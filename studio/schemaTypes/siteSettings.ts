import { defineType, defineField, defineArrayMember } from "sanity";

/**
 * siteSettings — singleton for the global chrome (header mark, contact email,
 * socials, footer copy). Create ONE document of this type. Every field is
 * optional: anything left blank falls back to the built-in defaults in
 * src/lib/site.ts. Text fields are { de, en } locale objects (./locale.ts).
 */
export default defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "headerMark",
      title: "Header mark",
      type: "localeString",
      description: 'Top-left logo text, e.g. "Sebo Mayer ©".',
    }),
    defineField({
      name: "email",
      title: "Contact email",
      type: "string",
      description: "Copied to the clipboard by the footer's contact button.",
    }),
    defineField({
      name: "contactLabel",
      title: "Contact label",
      type: "localeString",
      description: 'Small label above the contact button, e.g. "( Kontakt )".',
    }),
    defineField({
      name: "contactCta",
      title: "Contact button text",
      type: "localeString",
      description: 'e.g. "Sag hallo ↗".',
    }),
    defineField({
      name: "socials",
      title: "Social links",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "socialLink",
          fields: [
            defineField({
              name: "label",
              title: "Label",
              type: "localeString",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "url",
              title: "URL",
              type: "url",
              validation: (r) => r.required(),
            }),
          ],
          preview: { select: { title: "label.de", subtitle: "url" } },
        }),
      ],
    }),
    defineField({
      name: "archiveHeading",
      title: "Archive carousel heading",
      type: "localeString",
      description: "Heading above the home-page footer carousel.",
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "localeString",
      description: 'Footer "Standort" column, e.g. "Kopenhagen".',
    }),
    defineField({
      name: "timezoneLabel",
      title: "Timezone label",
      type: "localeString",
      description:
        'e.g. "UTC+1". Display only — the clock itself is fixed to CPH.',
    }),
    defineField({
      name: "copyright",
      title: "Copyright line",
      type: "localeString",
    }),
    defineField({
      name: "colophon",
      title: "Colophon line",
      type: "localeString",
      description: 'e.g. "Built with Astro · GSAP · Lenis · WebGL".',
    }),
    defineField({
      name: "footerNote",
      title: "Footer note",
      type: "localeString",
      description: "Third line in the footer bottom row.",
    }),
  ],
  preview: { prepare: () => ({ title: "Site Settings" }) },
});
