import { defineType, defineField, defineArrayMember } from "sanity";

/**
 * aboutPage — singleton for the /about page content. Create ONE document of
 * this type. Every field is optional: anything left blank falls back to the
 * built-in defaults in src/lib/site.ts. Text fields are { de, en } locale
 * objects (./locale.ts); rows keep a shared structure and localize inside.
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
          defineField({
            name: "title",
            title: "Title",
            type: "localeString",
            validation: (r) => r.required(),
          }),
          defineField({
            name: "detail",
            title: "Detail",
            type: "localeString",
            validation: (r) => r.required(),
          }),
        ],
        preview: { select: { title: "title.de", subtitle: "detail.de" } },
      }),
    ],
  });

export default defineType({
  name: "aboutPage",
  title: "About Page",
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
      description: 'Hero heading, e.g. "Über".',
    }),
    defineField({ name: "lede", title: "Lede", type: "localeText" }),
    defineField({
      name: "subMeta",
      title: "Hero meta",
      type: "localeString",
      description: 'e.g. "( Kopenhagen — seit 2014 )".',
    }),
    defineField({
      name: "introQuote",
      title: "Intro quote lines",
      type: "localeStringArray",
      description:
        "Each entry is one line. You may wrap a word in <em>…</em> for the accent.",
    }),
    defineField({
      name: "bio",
      title: "Bio paragraphs",
      type: "localeTextArray",
      description: 'You may wrap a lead-in word in <span class="dim">…</span>.',
    }),
    defineField({
      name: "portrait",
      title: "Portrait image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "portraitCaption",
      title: "Portrait caption",
      type: "localeString",
      description: 'e.g. "Studio, Vesterbro". Also used as the image alt text.',
    }),
    defineField({
      name: "portraitYear",
      title: "Portrait year",
      type: "string",
    }),
    defineField({
      name: "capabilitiesHeading",
      title: "Capabilities heading",
      type: "localeString",
    }),
    row("capabilities", "Capabilities"),
    defineField({
      name: "recognitionHeading",
      title: "Recognition heading",
      type: "localeString",
    }),
    row("recognition", "Recognition"),
  ],
  preview: { prepare: () => ({ title: "About Page" }) },
});
