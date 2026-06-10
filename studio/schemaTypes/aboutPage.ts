import { defineType, defineField, defineArrayMember } from "sanity";

/**
 * aboutPage — singleton for the /about page content. Create ONE document of
 * this type. Every field is optional: anything left blank falls back to the
 * built-in defaults in src/lib/site.ts.
 */
const row = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: "array",
    of: [
      defineArrayMember({
        type: "object",
        name: `${name}Row`,
        fields: [
          defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
          defineField({ name: "detail", title: "Detail", type: "string", validation: (r) => r.required() }),
        ],
        preview: { select: { title: "title", subtitle: "detail" } },
      }),
    ],
  });

export default defineType({
  name: "aboutPage",
  title: "About Page",
  type: "document",
  fields: [
    defineField({ name: "metaTitle", title: "Meta title", type: "string", description: "Browser tab / SEO title." }),
    defineField({ name: "title", title: "Page title", type: "string", description: 'Hero heading, e.g. "About".' }),
    defineField({ name: "lede", title: "Lede", type: "text", rows: 2 }),
    defineField({ name: "subMeta", title: "Hero meta", type: "string", description: 'e.g. "( Copenhagen — est. 2014 )".' }),
    defineField({
      name: "introQuote",
      title: "Intro quote lines",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      description: "Each entry is one line. You may wrap a word in <em>…</em> for the accent.",
    }),
    defineField({
      name: "bio",
      title: "Bio paragraphs",
      type: "array",
      of: [defineArrayMember({ type: "text", rows: 3 })],
      description: 'You may wrap a lead-in word in <span class="dim">…</span>.',
    }),
    defineField({ name: "portrait", title: "Portrait image", type: "image", options: { hotspot: true } }),
    defineField({ name: "portraitCaption", title: "Portrait caption", type: "string", description: 'e.g. "Studio, Vesterbro". Also used as the image alt text.' }),
    defineField({ name: "portraitYear", title: "Portrait year", type: "string" }),
    defineField({ name: "capabilitiesHeading", title: "Capabilities heading", type: "string" }),
    row("capabilities", "Capabilities"),
    defineField({ name: "recognitionHeading", title: "Recognition heading", type: "string" }),
    row("recognition", "Recognition"),
  ],
  preview: { prepare: () => ({ title: "About Page" }) },
});
