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
import { pick, type Locale } from "../i18n";
import { memoByLocale } from "./memo";

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
  coverThumb?: string | null; // thumbnail-width cover (hover preview, carousel); Sanity w=800, JSON = cover
  video?: string | null; // optional video file url (not translatable); play affordance + overlay
  gallery: Shot[];
}

// Raw shape returned by projectQuery: locale objects are already coalesced to
// plain values, but assets are still refs/urls and absent fields come back null.
interface ProjectRow {
  id: string;
  order: number;
  yr: string;
  name: string;
  cat: string;
  role: string;
  client: string;
  services: string[];
  technologies: string[] | null;
  intro: string;
  ledeLink?: string | null;
  overview: string[];
  quote?: string[] | null;
  cover?: string | null; // image asset _ref
  video?: string | null;
  gallery: { label: string; span: "full" | "half"; image?: string | null }[] | null;
}

// Link text is the URL host; shared so both backends derive it identically.
// Exported for unit testing.
export function resolveLedeLink(url?: string | null): Project["ledeLink"] {
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
  "video": video.asset->url,
  "gallery": gallery[]{ "label": coalesce(label.${l}, label.de), span, "image": image.asset._ref }
}`;

export const getProjects = memoByLocale(loadProjects);

async function loadProjects(locale: Locale): Promise<Project[]> {
  if (sanityConfigured) {
    const raw = await sanityFetch<ProjectRow[]>(projectQuery(locale));
    return raw.map((p): Project => ({
      ...p,
      technologies: p.technologies ?? [], // GROQ coalesce yields null when absent
      quote: p.quote ?? undefined, // null when absent → omit
      ledeLink: resolveLedeLink(p.ledeLink),
      cover: imageUrl(p.cover, { w: 2200 }),
      coverThumb: imageUrl(p.cover, { w: 800 }),
      video: p.video ?? null,
      gallery: (p.gallery || []).map((g) => ({
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
        coverThumb: d.cover, // local paths can't be resized — same URL
        video: d.video ?? null,
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

/**
 * Resolve a reel tile's project slug to its detail-page heading. Returns null
 * when the tile has no project set or the slug no longer matches a project
 * (e.g. it was deleted in the Studio) — the caller then renders no link.
 * `nameAlt` (the other locale's name, for the i18n scramble) falls back to the
 * resolved-locale name, mirroring the parallel `projectsAlt` indexing.
 */
export function reelTileTarget(
  projects: Project[],
  projectsAlt: Project[],
  slug: string | null | undefined,
): { id: string; name: string; nameAlt: string } | null {
  if (!slug) return null;
  const i = projects.findIndex((p) => p.id === slug);
  if (i < 0) return null;
  const project = projects[i];
  return {
    id: project.id,
    name: project.name,
    nameAlt: projectsAlt[i]?.name ?? project.name,
  };
}
