import { defineType, defineField } from "sanity";

/**
 * Locale object types — every translatable field is a { de, en } object.
 * DE is the site default and required; EN is optional and falls back to DE
 * via coalesce() in the app's GROQ queries (src/lib/projects.ts, site.ts).
 * EN sits in a collapsible fieldset so editors see both languages on one
 * screen without the form doubling in height.
 *
 * The local JSON collection (src/content/config.ts) mirrors this exact
 * { de, en? } shape — keep the two in sync.
 */
const englishFieldset = [
  {
    name: "english",
    title: "English",
    options: { collapsible: true, collapsed: true },
  },
];

export const localeString = defineType({
  name: "localeString",
  title: "Localized string",
  type: "object",
  fieldsets: englishFieldset,
  fields: [
    defineField({
      name: "de",
      title: "Deutsch",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "en",
      title: "English",
      type: "string",
      fieldset: "english",
    }),
  ],
});

export const localeText = defineType({
  name: "localeText",
  title: "Localized text",
  type: "object",
  fieldsets: englishFieldset,
  fields: [
    defineField({
      name: "de",
      title: "Deutsch",
      type: "text",
      rows: 3,
      validation: (r) => r.required(),
    }),
    defineField({
      name: "en",
      title: "English",
      type: "text",
      rows: 3,
      fieldset: "english",
    }),
  ],
});

export const localeStringArray = defineType({
  name: "localeStringArray",
  title: "Localized string list",
  type: "object",
  fieldsets: englishFieldset,
  fields: [
    defineField({
      name: "de",
      title: "Deutsch",
      type: "array",
      of: [{ type: "string" }],
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: "en",
      title: "English",
      type: "array",
      of: [{ type: "string" }],
      fieldset: "english",
    }),
  ],
});

export const localeTextArray = defineType({
  name: "localeTextArray",
  title: "Localized paragraph list",
  type: "object",
  fieldsets: englishFieldset,
  fields: [
    defineField({
      name: "de",
      title: "Deutsch",
      type: "array",
      of: [{ type: "text", rows: 3 }],
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: "en",
      title: "English",
      type: "array",
      of: [{ type: "text", rows: 3 }],
      fieldset: "english",
    }),
  ],
});
