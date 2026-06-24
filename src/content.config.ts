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
    services: localized(z.array(z.string())),
    technologies: localized(z.array(z.string())).optional(), // tech/tools used
    intro: localized(z.string()), // one-line lede
    ledeLink: z.string().url().optional(), // external link below the lede (host = text)
    overview: localized(z.array(z.string())), // paragraphs
    quote: localized(z.array(z.string())).optional(), // pull-quote lines (may contain <em>)
    cover: z.string().optional(), // image URL/path; placeholder when absent
    video: z.string().optional(), // optional project video URL/path; play affordance + overlay when present
    gallery: z.array(
      z.object({
        label: localized(z.string()),
        span: z.enum(["full", "half"]),
        image: z.string().optional(), // image URL/path; placeholder when absent
      }),
    ),
  }),
});

export const collections = { projects };
