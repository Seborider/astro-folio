import { describe, it, expect } from "vitest";
import { withDefaults } from "./site";

// Note: the get* loaders (getSiteSettings/getAboutPage/getHomePage) are not
// unit-tested here. This repo has Sanity configured (.env), so those functions
// perform live network reads from the Sanity CDN — non-deterministic I/O, out
// of scope for unit tests. Their only pure logic is the per-field merge below.

describe("withDefaults", () => {
  const defaults = { a: 1, b: "x", c: true };

  it("returns the defaults unchanged when doc is null", () => {
    expect(withDefaults(defaults, null)).toEqual(defaults);
  });

  it("overrides only the fields present (non-null) in the doc", () => {
    expect(withDefaults(defaults, { a: 9 })).toEqual({ a: 9, b: "x", c: true });
  });

  it("keeps the default when a doc field is null or undefined", () => {
    expect(withDefaults(defaults, { a: null, b: undefined, c: false })).toEqual({
      a: 1,
      b: "x",
      c: false,
    });
  });

  it("ignores doc keys that are not in the defaults", () => {
    expect(withDefaults(defaults, { z: 99 })).toEqual(defaults);
  });

  it("does not mutate the defaults object", () => {
    const d = { a: 1 };
    withDefaults(d, { a: 2 });
    expect(d).toEqual({ a: 1 });
  });
});
