import { defineCollection, z } from "astro:content";

/**
 * Projects are structured DATA (no long-form body), so this is a
 * `type: "data"` collection backed by one JSON file per project in
 * src/content/projects/. The filename (e.g. `halcyon.json`) is the
 * project's slug/id and becomes the URL: /work/halcyon.
 *
 * A headless CMS (Sanity, Keystatic, etc.) would replace these JSON
 * files — keep this schema as the contract the CMS must satisfy.
 */
const projects = defineCollection({
  type: "data",
  schema: z.object({
    // Explicit ordering drives prev/next and list order (data collections
    // are otherwise unordered). Lower = earlier / more recent.
    order: z.number(),
    name: z.string(),
    cat: z.string(),            // e.g. "Brand · Motion"
    yr: z.string(),             // string so "2026" stays as-authored
    role: z.string(),
    client: z.string(),
    services: z.array(z.string()),
    intro: z.string(),          // one-line lede
    overview: z.array(z.string()), // paragraphs
    quote: z.array(z.string()).optional(), // pull-quote lines (may contain <em>)
    gallery: z.array(
      z.object({
        label: z.string(),
        span: z.enum(["full", "half"]),
      })
    ),
  }),
});

export const collections = { projects };
