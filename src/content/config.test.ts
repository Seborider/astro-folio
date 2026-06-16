import { describe, it, expect } from "vitest";
import { collections } from "./config";

// defineCollection stores the Zod schema on `.schema`. It's a plain object
// schema here (not the image()-helper function form), so use it directly.
const schema = (collections.projects as { schema: any }).schema;

// A fully valid project record (DE-only localized fields, EN omitted).
function valid(over: Record<string, unknown> = {}) {
  return {
    order: 1,
    name: { de: "Halcyon" },
    cat: { de: "Brand · Motion" },
    yr: "2026",
    role: { de: "Art Direction" },
    client: { de: "Acme" },
    services: { de: ["Identity", "Motion"] },
    intro: { de: "A one-line lede." },
    overview: { de: ["Paragraph one.", "Paragraph two."] },
    gallery: [{ label: { de: "Cover" }, span: "full" }],
    ...over,
  };
}

describe("project schema — happy path", () => {
  it("accepts a complete DE-only record", () => {
    expect(schema.safeParse(valid()).success).toBe(true);
  });

  it("accepts optional en alongside de", () => {
    const r = schema.safeParse(
      valid({ name: { de: "Halcyon", en: "Halcyon EN" } }),
    );
    expect(r.success).toBe(true);
  });

  it("accepts the optional quote and cover fields when present", () => {
    const r = schema.safeParse(
      valid({ quote: { de: ["A pulled line."] }, cover: "/cover.jpg" }),
    );
    expect(r.success).toBe(true);
  });
});

describe("project schema — required fields", () => {
  it("rejects a missing order", () => {
    const { order, ...rest } = valid();
    expect(schema.safeParse(rest).success).toBe(false);
  });

  it("rejects a localized field missing its required de side", () => {
    expect(schema.safeParse(valid({ name: { en: "only-en" } })).success).toBe(
      false,
    );
  });

  it("rejects yr given as a number (must stay an authored string)", () => {
    expect(schema.safeParse(valid({ yr: 2026 })).success).toBe(false);
  });
});

describe("project schema — field shapes", () => {
  it("rejects a localized field passed as a bare value instead of { de }", () => {
    expect(schema.safeParse(valid({ name: "Halcyon" })).success).toBe(false);
  });

  it("rejects services given as a bare array instead of a localized object", () => {
    expect(schema.safeParse(valid({ services: ["Identity"] })).success).toBe(
      false,
    );
  });

  it("rejects a gallery span outside the full|half enum", () => {
    const r = schema.safeParse(
      valid({ gallery: [{ label: { de: "X" }, span: "thumb" }] }),
    );
    expect(r.success).toBe(false);
  });

  it("accepts both full and half gallery spans", () => {
    const r = schema.safeParse(
      valid({
        gallery: [
          { label: { de: "A" }, span: "full" },
          { label: { de: "B" }, span: "half" },
        ],
      }),
    );
    expect(r.success).toBe(true);
  });

  it("accepts an empty gallery array", () => {
    expect(schema.safeParse(valid({ gallery: [] })).success).toBe(true);
  });
});
