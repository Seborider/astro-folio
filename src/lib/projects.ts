/**
 * projects.ts — single source of truth for reading projects in pages.
 *
 * Returns the SAME shape regardless of backend, so the .astro pages don't care
 * where data comes from:
 *   - If Sanity is configured (PUBLIC_SANITY_PROJECT_ID set) → read from Sanity.
 *   - Otherwise → fall back to the local content collection (JSON files).
 *
 * This lets you develop offline with the JSON seed and flip to the CMS by
 * setting two env vars — no page changes required.
 */
import { getCollection } from "astro:content";
import { sanityConfigured, sanityFetch, imageUrl } from "./sanity";
import { DEFAULT_LOCALE, pick, type Locale } from "../i18n";

export interface Shot {
  label: string;
  span: "full" | "half";
  image?: string | null; // resolved CDN url (Sanity) or undefined (placeholder)
}

export interface Project {
  id: string; // slug
  order: number;
  name: string;
  cat: string;
  yr: string;
  role: string;
  client: string;
  services: string[];
  technologies: string[]; // optional in source; [] when absent
  intro: string;
  ledeLink?: { url: string; label: string }; // label locale-resolved, host-fallback applied
  overview: string[];
  quote?: string[];
  cover?: string | null;
  gallery: Shot[];
}

// Link text is the URL host; shared so both backends derive it identically.
function resolveLedeLink(url?: string | null): Project["ledeLink"] {
  if (!url) return undefined;
  let host = url;
  try {
    host = new URL(url).host;
  } catch {
    // ponytail: malformed CMS url — fall back to the raw string, don't crash the build
  }
  return { url, label: host };
}

// Explicit projection matching the Project interface — when adding a field,
// add it to BOTH schemas (see CLAUDE.md) and name it here. Translatable
// fields are locale objects in the Studio; coalesce() falls back to DE.
const projectQuery = (l: Locale) => `*[_type == "project"] | order(order asc){
  "id": slug.current,
  order, yr,
  "name": coalesce(name.${l}, name.de),
  "cat": coalesce(cat.${l}, cat.de),
  "role": coalesce(role.${l}, role.de),
  "client": coalesce(client.${l}, client.de),
  "services": coalesce(services.${l}, services.de),
  "technologies": coalesce(technologies.${l}, technologies.de),
  "intro": coalesce(intro.${l}, intro.de),
  ledeLink,
  "overview": coalesce(overview.${l}, overview.de),
  "quote": coalesce(quote.${l}, quote.de),
  "cover": cover.asset._ref,
  "gallery": gallery[]{ "label": coalesce(label.${l}, label.de), span, "image": image.asset._ref }
}`;

const cache = new Map<Locale, Promise<Project[]>>(); // per-locale memo for the static build

export function getProjects(
  locale: Locale = DEFAULT_LOCALE,
): Promise<Project[]> {
  if (import.meta.env.DEV) return loadProjects(locale); // always fresh in dev
  let p = cache.get(locale);
  if (!p) {
    p = loadProjects(locale);
    cache.set(locale, p);
  }
  return p;
}

async function loadProjects(locale: Locale): Promise<Project[]> {
  if (sanityConfigured) {
    const raw = await sanityFetch<any[]>(projectQuery(locale));
    return raw.map((p) => ({
      ...p,
      technologies: p.technologies ?? [], // GROQ coalesce yields null when absent
      ledeLink: resolveLedeLink(p.ledeLink),
      cover: imageUrl(p.cover, { w: 2200 }),
      gallery: (p.gallery || []).map((g: any) => ({
        label: g.label,
        span: g.span,
        image: imageUrl(g.image, { w: g.span === "full" ? 2200 : 1200 }),
      })),
    }));
  }

  // Fallback: local content collection (JSON files). pick() = coalesce twin.
  const entries = await getCollection("projects");
  return entries
    .map((e): Project => {
      const d = e.data;
      return {
        id: e.id,
        order: d.order,
        yr: d.yr,
        name: pick(d.name, locale),
        cat: pick(d.cat, locale),
        role: pick(d.role, locale),
        client: pick(d.client, locale),
        services: pick(d.services, locale),
        technologies: d.technologies ? pick(d.technologies, locale) : [],
        intro: pick(d.intro, locale),
        ledeLink: resolveLedeLink(d.ledeLink),
        overview: pick(d.overview, locale),
        quote: d.quote && pick(d.quote, locale),
        cover: d.cover,
        gallery: d.gallery.map((g) => ({
          label: pick(g.label, locale),
          span: g.span,
          image: g.image,
        })),
      };
    })
    .sort((a, b) => a.order - b.order);
}

export function neighbours(list: Project[], index: number) {
  return { prev: list[index - 1], next: list[index + 1] };
}
