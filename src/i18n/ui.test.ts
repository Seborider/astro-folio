import { describe, it, expect } from "vitest";
import { t, ui } from "./ui";
import { LOCALES } from "./index";

// Collect dotted key paths so nested dicts (sections) are compared too.
function keyPaths(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    return v && typeof v === "object" && !Array.isArray(v)
      ? keyPaths(v as Record<string, unknown>, path)
      : [path];
  });
}

describe("t", () => {
  it("returns the dict for the requested locale", () => {
    expect(t("de")).toBe(ui.de);
    expect(t("en")).toBe(ui.en);
  });

  it("resolves localized nav labels", () => {
    expect(t("de").navWork).toBe("Projekte");
    expect(t("en").navWork).toBe("Projects");
  });

  it("localizes the Impressum footer label", () => {
    expect(t("de").navImpressum).toBe("Impressum");
    expect(t("en").navImpressum).toBe("Legal notice");
  });
});

describe("locale parity", () => {
  it("every locale dict has the identical set of keys", () => {
    const reference = keyPaths(ui.de).sort();
    for (const locale of LOCALES) {
      expect(keyPaths(ui[locale]).sort()).toEqual(reference);
    }
  });

  it("statementLines is a 4-line array in both locales", () => {
    for (const locale of LOCALES) {
      expect(Array.isArray(ui[locale].statementLines)).toBe(true);
      expect(ui[locale].statementLines).toHaveLength(4);
    }
  });
});

// SEO guard: <meta name="description"> snippets Google truncates near 160
// chars. Keep each non-empty and within budget so the full line shows.
describe("meta description budget", () => {
  const metaKeys = [
    "homeDescription",
    "workDescription",
    "archiveDescription",
    "notFoundDescription",
  ] as const;

  for (const locale of LOCALES) {
    for (const key of metaKeys) {
      it(`${locale}.${key} is non-empty and ≤ 160 chars`, () => {
        const text = ui[locale][key];
        expect(text.trim().length).toBeGreaterThan(0);
        expect(text.length).toBeLessThanOrEqual(160);
      });
    }
  }
});
