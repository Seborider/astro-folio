import { defineType, defineField, defineArrayMember } from "sanity";

/**
 * project — mirrors the Astro content schema (src/content/config.ts) so the
 * site code barely changes. Image fields are added for production media; they
 * are optional so the seeded placeholder content imports cleanly.
 * Translatable text uses the locale object types (see ./locale.ts): DE is
 * required, EN optional with DE fallback at query time.
 */
export default defineType({
  name: "project",
  title: "Project",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "localeString",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "The URL segment — /work/<slug>. Shared by both languages.",
      options: { source: "name.de", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      description: "Lower = earlier / more recent. Drives list order and prev/next.",
      validation: (r) => r.required(),
    }),
    defineField({ name: "cat", title: "Category", type: "localeString", description: 'e.g. "Brand · Motion"', validation: (r) => r.required() }),
    defineField({ name: "yr", title: "Year", type: "string", validation: (r) => r.required() }),
    defineField({ name: "role", title: "Role", type: "localeString", validation: (r) => r.required() }),
    defineField({ name: "client", title: "Client", type: "localeString", validation: (r) => r.required() }),
    defineField({
      name: "services",
      title: "Services",
      type: "localeStringArray",
      validation: (r) => r.required(),
    }),
    defineField({ name: "intro", title: "Intro (one-line lede)", type: "localeText", validation: (r) => r.required() }),
    defineField({
      name: "overview",
      title: "Overview paragraphs",
      type: "localeTextArray",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "quote",
      title: "Pull-quote lines (optional)",
      description: "Each entry is one line. You may wrap a word in <em>…</em> for the accent.",
      type: "localeStringArray",
    }),
    // Production media — optional so placeholder content still validates.
    defineField({
      name: "cover",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "gallery",
      title: "Gallery",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "shot",
          title: "Shot",
          fields: [
            defineField({ name: "label", title: "Label / caption", type: "localeString", validation: (r) => r.required() }),
            defineField({
              name: "span",
              title: "Span",
              type: "string",
              options: { list: [{ title: "Full (16:9 band)", value: "full" }, { title: "Half (4:5 card)", value: "half" }], layout: "radio" },
              initialValue: "full",
              validation: (r) => r.required(),
            }),
            defineField({ name: "image", title: "Image (optional)", type: "image", options: { hotspot: true } }),
          ],
          preview: {
            select: { title: "label.de", subtitle: "span", media: "image" },
          },
        }),
      ],
      validation: (r) => r.required().min(1),
    }),
  ],
  orderings: [
    { title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: {
    select: { title: "name.de", subtitle: "cat.de", media: "cover" },
  },
});
