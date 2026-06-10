import { defineType, defineField, defineArrayMember } from "sanity";

/**
 * siteSettings — singleton for the global chrome (header mark, contact email,
 * socials, footer copy). Create ONE document of this type. Every field is
 * optional: anything left blank falls back to the built-in defaults in
 * src/lib/site.ts.
 */
export default defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({ name: "headerMark", title: "Header mark", type: "string", description: 'Top-left logo text, e.g. "Juno Vestergaard ©".' }),
    defineField({ name: "email", title: "Contact email", type: "string", description: "Copied to the clipboard by the footer's contact button." }),
    defineField({ name: "contactLabel", title: "Contact label", type: "string", description: 'Small label above the contact button, e.g. "( Reach out )".' }),
    defineField({ name: "contactCta", title: "Contact button text", type: "string", description: 'e.g. "Say hello ↗".' }),
    defineField({
      name: "socials",
      title: "Social links",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "socialLink",
          fields: [
            defineField({ name: "label", title: "Label", type: "string", validation: (r) => r.required() }),
            defineField({ name: "url", title: "URL", type: "url", validation: (r) => r.required() }),
          ],
          preview: { select: { title: "label", subtitle: "url" } },
        }),
      ],
    }),
    defineField({ name: "archiveHeading", title: "Archive carousel heading", type: "string", description: "Heading above the home-page footer carousel." }),
    defineField({ name: "location", title: "Location", type: "string", description: 'Footer "Based" column, e.g. "Copenhagen".' }),
    defineField({ name: "timezoneLabel", title: "Timezone label", type: "string", description: 'e.g. "UTC+1". Display only — the clock itself is fixed to CPH.' }),
    defineField({ name: "copyright", title: "Copyright line", type: "string" }),
    defineField({ name: "colophon", title: "Colophon line", type: "string", description: 'e.g. "Built with Astro · GSAP · Lenis · WebGL".' }),
    defineField({ name: "footerNote", title: "Footer note", type: "string", description: "Third line in the footer bottom row." }),
  ],
  preview: { prepare: () => ({ title: "Site Settings" }) },
});
