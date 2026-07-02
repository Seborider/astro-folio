import { defineType, defineField } from "sanity";

/**
 * datenschutzPage — singleton for the /datenschutz (privacy policy) page
 * content. Create ONE document of this type. Every field is optional: anything
 * left blank falls back to the built-in defaults in src/lib/legal.ts.
 * Text fields are { de, en } locale objects (./locale.ts); a missing EN
 * coalesces to DE in the app's GROQ query.
 */
export default defineType({
  name: "datenschutzPage",
  title: "Datenschutz",
  type: "document",
  fields: [
    defineField({
      name: "metaTitle",
      title: "Meta title",
      type: "localeString",
      description: "Browser tab / SEO title.",
    }),
    defineField({
      name: "title",
      title: "Page title",
      type: "localeString",
      description: 'Hero heading, e.g. "Datenschutz".',
    }),
    defineField({ name: "lede", title: "Lede", type: "localeText" }),
    defineField({
      name: "body",
      title: "Body paragraphs",
      type: "localeTextArray",
      description:
        'Each entry is one paragraph. You may use <br> for line breaks and wrap a lead-in word in <span class="dim">…</span>.',
    }),
  ],
  preview: { prepare: () => ({ title: "Datenschutz" }) },
});
