import { describe, expect, it } from "vitest";
import { layoutGlyphs } from "./balloons-layout";

// fixed-width synthetic font: every glyph advances 10, space advances 10 too.
const adv = () => 10;

describe("layoutGlyphs", () => {
  it("centres a single line on x=0", () => {
    const { placements, width, height } = layoutGlyphs(["ab"], adv, { lineHeight: 12 });
    expect(width).toBe(20);
    expect(height).toBe(12);
    expect(placements).toHaveLength(2);
    // two glyphs of advance 10 → centres at -5 and +5
    expect(placements[0]).toMatchObject({ char: "a", line: 0, x: -5, y: 0 });
    expect(placements[1]).toMatchObject({ char: "b", line: 0, x: 5, y: 0 });
  });

  it("skips spaces but still advances past them", () => {
    const { placements } = layoutGlyphs(["a b"], adv, { lineHeight: 12 });
    // "a b" → a at 0, space at 10, b at 20; width 30 → shift -15
    expect(placements.map((p) => p.char)).toEqual(["a", "b"]);
    expect(placements[0].x).toBeCloseTo(0 + 5 - 15); // -10
    expect(placements[1].x).toBeCloseTo(20 + 5 - 15); // 10
  });

  it("stacks lines, top line highest, block centred on y", () => {
    const { placements, height } = layoutGlyphs(["a", "b"], adv, { lineHeight: 12 });
    expect(height).toBe(24);
    const a = placements.find((p) => p.char === "a")!;
    const b = placements.find((p) => p.char === "b")!;
    expect(a.y).toBe(6); // (2-1)/2 - 0 = 0.5 → *12
    expect(b.y).toBe(-6); // 0.5 - 1 = -0.5 → *12
  });

  it("applies tracking between glyphs only", () => {
    const { width } = layoutGlyphs(["ab"], adv, { lineHeight: 12, tracking: 2 });
    // a(10)+track(2)+b(10), trailing track removed → 22
    expect(width).toBe(22);
  });

  it("handles empty input", () => {
    const { placements, width, height } = layoutGlyphs([], adv, { lineHeight: 12 });
    expect(placements).toHaveLength(0);
    expect(width).toBe(0);
    expect(height).toBe(0);
  });
});
