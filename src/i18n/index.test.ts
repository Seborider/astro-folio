import { describe, it, expect } from "vitest";
import {
  pick,
  altOf,
  otherLocale,
  localePath,
  altLocalePath,
  stripTrailingSlash,
  withTrailingSlash,
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
  it("returns undefined when both strings match", () => {
    expect(altOf("Same", "Same")).toBeUndefined();
  });
  it("returns the alternate when it differs", () => {
    expect(altOf("Projekte", "Projects")).toBe("Projects");
  });
});

describe("otherLocale", () => {
  it("returns the opposite locale", () => {
    expect(otherLocale("de")).toBe("en");
    expect(otherLocale("en")).toBe("de");
  });
});

describe("localePath", () => {
  it("leaves the de locale unprefixed but adds a trailing slash", () => {
    expect(localePath("de", "/work")).toBe("/work/");
    expect(localePath("de", "/")).toBe("/");
  });

  it("prefixes /en and adds a trailing slash for the en locale", () => {
    expect(localePath("en", "/work")).toBe("/en/work/");
  });

  it("maps the root to /en/ for en", () => {
    expect(localePath("en", "/")).toBe("/en/");
  });

  it("does not double a slash on an already-slashed path", () => {
    expect(localePath("de", "/work/")).toBe("/work/");
    expect(localePath("en", "/work/")).toBe("/en/work/");
  });
});

describe("altLocalePath", () => {
  it("switches de pages to their trailing-slashed /en twin", () => {
    expect(altLocalePath("de", "/work")).toBe("/en/work/");
    expect(altLocalePath("de", "/")).toBe("/en/");
  });

  it("switches en pages back to de with a trailing slash", () => {
    expect(altLocalePath("en", "/en/work")).toBe("/work/");
    expect(altLocalePath("en", "/en")).toBe("/");
  });

  it("normalizes a trailing slash before switching, then re-adds it", () => {
    expect(altLocalePath("de", "/work/")).toBe("/en/work/");
    expect(altLocalePath("en", "/en/work/")).toBe("/work/");
  });

  it("preserves the bare root slash", () => {
    expect(altLocalePath("de", "/")).toBe("/en/");
  });

  it("round-trips a path through both locales", () => {
    const de = "/work/halcyon/";
    const en = altLocalePath("de", de);
    expect(en).toBe("/en/work/halcyon/");
    expect(altLocalePath("en", en)).toBe(de);
  });
});

describe("withTrailingSlash", () => {
  it("adds a slash when missing", () => {
    expect(withTrailingSlash("/work")).toBe("/work/");
    expect(withTrailingSlash("/en/work")).toBe("/en/work/");
  });
  it("leaves an already-slashed path (and the root) untouched", () => {
    expect(withTrailingSlash("/work/")).toBe("/work/");
    expect(withTrailingSlash("/")).toBe("/");
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

describe("stripTrailingSlash", () => {
  it("strips one or more trailing slashes", () => {
    expect(stripTrailingSlash("/work/")).toBe("/work");
    expect(stripTrailingSlash("/en/work//")).toBe("/en/work");
  });
  it("keeps the root and untouched paths as-is", () => {
    expect(stripTrailingSlash("/")).toBe("/");
    expect(stripTrailingSlash("/work")).toBe("/work");
  });
});
