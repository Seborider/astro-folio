import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * Projects are structured DATA (no long-form body). Each project is one JSON
 * file in src/content/projects/ loaded via the Content Layer `glob()` loader;
 * the filename (e.g. `halcyon.json`) is the project's id/slug and becomes the
 * URL: /work/halcyon.
 *
 * A headless CMS (Sanity, Keystatic, etc.) would replace these JSON
 * files — keep this schema as the contract the CMS must satisfy.
 *
 * Translatable fields are `{ de, en? }` objects, mirroring the Sanity
 * locale-object types (studio/schemaTypes/locale.ts). DE is required;
 * a missing EN falls back to DE in src/lib/projects.ts.
 */
const localized = <T extends z.ZodTypeAny>(value: T) =>
  z.object({ de: value, en: value.optional() });

// Required localized list: the de arm must be non-empty (mirrors the Sanity
// localeStringArray/localeTextArray `.required().min(1)` in studio/schemaTypes/
// locale.ts); en stays an optional, possibly-empty fallback.
const requiredList = () =>
  z.object({ de: z.array(z.string()).min(1), en: z.array(z.string()).optional() });

const projects = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/projects" }),
  schema: z.object({
    // Explicit ordering drives prev/next and list order (loader order is
    // non-deterministic). Lower = earlier / more recent.
    order: z.number(),
    name: localized(z.string()),
    cat: localized(z.string()), // e.g. "Brand · Motion"
    yr: z.string(), // string so "2026" stays as-authored
    role: localized(z.string()),
    client: localized(z.string()),
    services: requiredList(),
    technologies: localized(z.array(z.string())).optional(), // tech/tools used
    tags: localized(z.array(z.string())).optional(), // /work filter tags; buttons derive from the union
    intro: localized(z.string()), // one-line lede
    ledeLink: z.string().url().optional(), // external link below the lede (host = text)
    overview: requiredList(), // paragraphs
    quote: localized(z.array(z.string())).optional(), // pull-quote lines (may contain <em>)
    cover: z.string().optional(), // image URL/path; placeholder when absent
    video: z.string().optional(), // optional project video URL/path; play affordance + overlay when present
    gallery: z
      .array(
        z.object({
          label: localized(z.string()),
          span: z.enum(["full", "half"]),
          image: z.string().optional(), // image URL/path; placeholder when absent
        }),
      )
      .min(1),
  }),
});

export const collections = { projects };
