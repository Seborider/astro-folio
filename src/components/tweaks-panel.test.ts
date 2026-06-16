import { describe, it, expect } from "vitest";
import { __twkIsLight } from "./tweaks-panel";

describe("__twkIsLight", () => {
  it.each([
    ["near-white #ffffff is light", "#ffffff", true],
    ["near-white #fafafa is light", "#fafafa", true],
    ["near-black #000000 is dark", "#000000", false],
    ["near-black #111111 is dark", "#111111", false],
    ["3-digit shorthand #fff expands to light", "#fff", true],
    ["3-digit shorthand #000 expands to dark", "#000", false],
    ["hex without leading # (ffffff) is light", "ffffff", true],
    ["hex without leading # (000) is dark", "000", false],
    // "ff" -> "ff0000" (red), luminance below threshold -> dark
    ["short non-shorthand #ff pads to red (dark)", "#ff", false],
    ["unparseable rgb() falls through to light", "rgb(255,255,255)", true],
    ["unparseable named color falls through to light", "rebeccapurple", true],
  ])("%s", (_, input, expected) => {
    expect(__twkIsLight(input as string)).toBe(expected);
  });
});
