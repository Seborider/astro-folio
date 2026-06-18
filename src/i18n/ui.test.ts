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
    expect(t("de").navWork).toBe("Arbeiten");
    expect(t("en").navWork).toBe("Work");
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
