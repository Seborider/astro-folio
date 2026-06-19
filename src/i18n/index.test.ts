import { describe, it, expect } from "vitest";
import {
  pick,
  altOf,
  otherLocale,
  localePath,
  altLocalePath,
  localeFromParams,
  localeStaticPaths,
  pageTitle,
  BRAND,
  DEFAULT_LOCALE,
} from "./index";

describe("pick", () => {
  it("returns the requested locale when present", () => {
    expect(pick({ de: "Hallo", en: "Hello" }, "en")).toBe("Hello");
    expect(pick({ de: "Hallo", en: "Hello" }, "de")).toBe("Hallo");
  });

  it("falls back to de when en is missing", () => {
    expect(pick({ de: "Hallo" }, "en")).toBe("Hallo");
  });

  it("works with non-string values (arrays)", () => {
    expect(pick({ de: ["a"], en: ["b"] }, "en")).toEqual(["b"]);
    expect(pick({ de: ["a"] }, "en")).toEqual(["a"]);
  });
});

describe("altOf", () => {
  it("returns the alt value when it differs from the primary", () => {
    expect(altOf("Arbeiten", "Work")).toBe("Work");
  });

  it("returns undefined when both locales are identical", () => {
    expect(altOf("Aperture", "Aperture")).toBeUndefined();
  });

  it("compares arrays/objects by value, not reference", () => {
    expect(altOf(["a", "b"], ["a", "b"])).toBeUndefined();
    expect(altOf(["a"], ["b"])).toEqual(["b"]);
  });
});

describe("otherLocale", () => {
  it("returns the opposite locale", () => {
    expect(otherLocale("de")).toBe("en");
    expect(otherLocale("en")).toBe("de");
  });
});

describe("localePath", () => {
  it("leaves paths unprefixed for the default (de) locale", () => {
    expect(localePath("de", "/work")).toBe("/work");
    expect(localePath("de", "/")).toBe("/");
  });

  it("prefixes /en for the en locale", () => {
    expect(localePath("en", "/work")).toBe("/en/work");
  });

  it("maps the root to /en (not /en/) for en", () => {
    expect(localePath("en", "/")).toBe("/en");
  });
});

describe("altLocalePath", () => {
  it("switches de pages to their /en twin", () => {
    expect(altLocalePath("de", "/work")).toBe("/en/work");
    expect(altLocalePath("de", "/")).toBe("/en");
  });

  it("switches en pages back to de (strips the /en prefix)", () => {
    expect(altLocalePath("en", "/en/work")).toBe("/work");
    expect(altLocalePath("en", "/en")).toBe("/");
  });

  it("normalizes a trailing slash before switching", () => {
    expect(altLocalePath("de", "/work/")).toBe("/en/work");
    expect(altLocalePath("en", "/en/work/")).toBe("/work");
  });

  it("preserves the bare root slash (does not strip it)", () => {
    expect(altLocalePath("de", "/")).toBe("/en");
  });

  it("round-trips a path through both locales", () => {
    const de = "/work/halcyon";
    const en = altLocalePath("de", de);
    expect(en).toBe("/en/work/halcyon");
    expect(altLocalePath("en", en)).toBe(de);
  });
});

describe("localeFromParams", () => {
  it("maps undefined (root) to the default locale", () => {
    expect(localeFromParams(undefined)).toBe(DEFAULT_LOCALE);
    expect(localeFromParams(undefined)).toBe("de");
  });

  it("maps 'en' to the en locale", () => {
    expect(localeFromParams("en")).toBe("en");
  });

  it("throws on an unknown segment", () => {
    expect(() => localeFromParams("fr")).toThrow(/Unknown locale segment/);
  });
});

describe("localeStaticPaths", () => {
  it("emits one entry per locale with matching params and props", () => {
    expect(localeStaticPaths()).toEqual([
      { params: { lang: undefined }, props: { locale: "de" } },
      { params: { lang: "en" }, props: { locale: "en" } },
    ]);
  });
});

describe("pageTitle", () => {
  it("composes '<name> — <brand>'", () => {
    expect(pageTitle("Work")).toBe(`Work — ${BRAND}`);
  });
});
