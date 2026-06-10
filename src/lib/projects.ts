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

export interface Shot {
  label: string;
  span: "full" | "half";
  image?: string | null; // resolved CDN url (Sanity) or undefined (placeholder)
}

export interface Project {
  id: string;          // slug
  order: number;
  name: string;
  cat: string;
  yr: string;
  role: string;
  client: string;
  services: string[];
  intro: string;
  overview: string[];
  quote?: string[];
  cover?: string | null;
  gallery: Shot[];
}

// Explicit projection matching the Project interface — when adding a field,
// add it to BOTH schemas (see CLAUDE.md) and name it here.
const PROJECT_QUERY = `*[_type == "project"] | order(order asc){
  "id": slug.current,
  order, name, cat, yr, role, client, services, intro, overview, quote,
  "cover": cover.asset._ref,
  "gallery": gallery[]{ label, span, "image": image.asset._ref }
}`;

let cache: Promise<Project[]> | undefined;

export function getProjects(): Promise<Project[]> {
  if (import.meta.env.DEV) return loadProjects(); // always fresh in dev
  return (cache ??= loadProjects());              // memoize once for the static build
}

async function loadProjects(): Promise<Project[]> {
  if (sanityConfigured) {
    const raw = await sanityFetch<any[]>(PROJECT_QUERY);
    return raw.map((p) => ({
      ...p,
      cover: imageUrl(p.cover, { w: 2200 }),
      gallery: (p.gallery || []).map((g: any) => ({
        label: g.label,
        span: g.span,
        image: imageUrl(g.image, { w: g.span === "full" ? 2200 : 1200 }),
      })),
    }));
  }

  // Fallback: local content collection (JSON files)
  const entries = await getCollection("projects");
  return entries
    .map((e) => ({ id: e.id, ...e.data } as Project))
    .sort((a, b) => a.order - b.order);
}

export function neighbours(list: Project[], index: number) {
  const n = list.length;
  return { prev: list[(index - 1 + n) % n], next: list[(index + 1) % n] };
}
