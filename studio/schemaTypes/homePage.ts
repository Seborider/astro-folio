import { defineType, defineField, defineArrayMember } from "sanity";

/**
 * homePage — singleton for the home page content. Create ONE document of
 * this type. Only the tiles set here are rendered; the labelled placeholder
 * defaults in src/lib/site.ts apply only when Sanity is unconfigured.
 */
export default defineType({
  name: "homePage",
  title: "Home Page",
  type: "document",
  fields: [
    defineField({
      name: "reelTiles",
      title: "Reel tiles",
      type: "array",
      description:
        "Up to 8 tiles in display order. The grid layout is fixed in code " +
        "(tiles 1–2 large landscape, tile 3 tall, 4–8 small); only the " +
        "tiles you add are rendered.",
      validation: (r) => r.max(8),
      of: [
        defineArrayMember({
          type: "object",
          name: "reelTile",
          fields: [
            defineField({
              name: "label",
              title: "Label",
              type: "localeString",
              description:
                "Alt text; also the placeholder caption if no media is set.",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "image",
              title: "Image",
              type: "image",
              options: { hotspot: true },
              description:
                "Tiles crop from the center — keep the subject centered. " +
                "≥1600px wide for tiles 1–2, ≥1000px for the rest.",
            }),
            defineField({
              name: "video",
              title: "Video loop",
              type: "file",
              options: { accept: "video/mp4" },
              description:
                "Short muted mp4 (autoplays, loops). The image is used as poster.",
            }),
          ],
          preview: { select: { title: "label.de", media: "image" } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Home Page" }) },
});
