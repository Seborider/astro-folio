import { describe, expect, it } from "vitest";
import {
  HERO_SELECTORS,
  HINT_DELAY_MAX,
  HINT_DELAY_MIN,
  HINT_LIFT,
  HINT_SWAY_AMP,
  HINT_SWAY_FREQ,
  HINT_VX,
  HINT_VY,
  PD_SELECTORS,
  PHERO_SELECTORS,
  RISE_BOB,
  RISE_DIST,
  RISE_DUR,
  RISE_SETTLE_DUR,
  RISE_STAGGER,
  hintLaunch,
  hintSwayVel,
  hintTurn,
  layoutGlyphs,
  pickSelectors,
  readLines,
  riseOffset,
} from "./balloons-layout";

describe("riseOffset", () => {
  const t0 = 1000;
  // time (ms) `s` seconds into letter `i`'s own intro
  const at = (i: number, s: number) => riseOffset(i, t0 + (i * RISE_STAGGER + s) * 1000, t0);

  it("sits fully below before the intro starts (t0 = 0)", () => {
    expect(riseOffset(0, 1000, 0)).toBe(-RISE_DIST);
  });

  it("sits below until this letter's staggered turn", () => {
    const justBefore = t0 + (2 * RISE_STAGGER - 0.001) * 1000;
    expect(riseOffset(2, justBefore, t0)).toBe(-RISE_DIST);
  });

  it("rises monotonically to home — no wobble during the rise", () => {
    const ys = [0.05, 0.25, 0.45, 0.65, 0.85].map((f) => at(0, RISE_DUR * f));
    // strictly increasing (moving up toward 0), so no up/down while rising
    for (let k = 1; k < ys.length; k++) expect(ys[k]).toBeGreaterThan(ys[k - 1]);
    expect(ys[0]).toBeGreaterThan(-RISE_DIST);
    expect(ys[ys.length - 1]).toBeLessThan(0);
  });

  it("reaches home as the rise completes (continuous handoff to settle)", () => {
    expect(at(1, RISE_DUR)).toBeCloseTo(0, 10); // ~0 at the boundary (sin 0)
    expect(at(1, RISE_DUR - 1e-3)).toBeCloseTo(0, 3); // approaching from below
  });

  it("bobs up and down only after fully risen, then rests at home", () => {
    // a clear up-swing exists in the settle phase (first peak near τ=0.125)
    const swing = at(0, RISE_DUR + RISE_SETTLE_DUR * 0.125);
    expect(swing).toBeGreaterThan(0);
    expect(Math.abs(swing)).toBeLessThanOrEqual(RISE_BOB);
    // direction reverses across the settle (it's an oscillation, not a drift)
    const ys = [0.1, 0.3, 0.5, 0.7, 0.9].map((f) => at(0, RISE_DUR + RISE_SETTLE_DUR * f));
    const dirs = ys.slice(1).map((y, k) => Math.sign(y - ys[k]));
    const reversals = dirs.slice(1).filter((d, k) => d !== dirs[k] && d !== 0);
    expect(reversals.length).toBeGreaterThan(0);
    // settled back to home once the settle window passes
    expect(at(0, RISE_DUR + RISE_SETTLE_DUR + 0.1)).toBe(0);
  });
});

describe("hintLaunch", () => {
  it("alternates the label index 0,1,0,1 by launch count", () => {
    const labels = [0, 1, 2, 3].map((i) => hintLaunch(i, 5, () => 0.5).label);
    expect(labels).toEqual([0, 1, 0, 1]);
  });

  it("keeps the delay inside [HINT_DELAY_MIN, HINT_DELAY_MAX]", () => {
    expect(hintLaunch(0, 5, () => 0).delay).toBe(HINT_DELAY_MIN);
    expect(hintLaunch(0, 5, () => 1).delay).toBe(HINT_DELAY_MAX);
    const d = hintLaunch(0, 5, () => 0.5).delay;
    expect(d).toBeGreaterThan(HINT_DELAY_MIN);
    expect(d).toBeLessThan(HINT_DELAY_MAX);
  });

  it("spreads x across the full half-width span", () => {
    expect(hintLaunch(0, 5, () => 0).x).toBe(-5);
    expect(hintLaunch(0, 5, () => 1).x).toBe(5);
    expect(hintLaunch(0, 5, () => 0.5).x).toBe(0);
  });

  it("is deterministic for a fixed rand", () => {
    expect(hintLaunch(3, 2, () => 0.25)).toEqual(hintLaunch(3, 2, () => 0.25));
  });

  it("handles a zero half-width (degenerate viewport)", () => {
    expect(hintLaunch(0, 0, () => 1).x).toBe(0);
  });

  it("samples the rise motion inside its documented ranges", () => {
    const lo = hintLaunch(0, 5, () => 0);
    expect([lo.vy, lo.vx, lo.lift]).toEqual([HINT_VY[0], HINT_VX[0], HINT_LIFT[0]]);
    const hi = hintLaunch(0, 5, () => 1);
    expect([hi.vy, hi.vx, hi.lift]).toEqual([HINT_VY[1], HINT_VX[1], HINT_LIFT[1]]);
  });

  it("varies the motion between launches (no shared path)", () => {
    // a counter-based rand gives each field a different draw — two launches
    // starting at different counter values must not ride identical motion
    const seq = (start: number) => {
      let n = start;
      return () => (n++ % 10) / 10;
    };
    const a = hintLaunch(0, 5, seq(0));
    const b = hintLaunch(0, 5, seq(3));
    expect(a.vy).not.toBe(b.vy);
    expect(a.lift).not.toBe(b.lift);
  });

  it("samples the sway inside its ranges, phase across the full circle", () => {
    const lo = hintLaunch(0, 5, () => 0);
    expect([lo.swayAmp, lo.swayFreq, lo.swayPhase]).toEqual([
      HINT_SWAY_AMP[0],
      HINT_SWAY_FREQ[0],
      0,
    ]);
    const hi = hintLaunch(0, 5, () => 1);
    expect(hi.swayAmp).toBeCloseTo(HINT_SWAY_AMP[1], 10);
    expect(hi.swayFreq).toBeCloseTo(HINT_SWAY_FREQ[1], 10);
    expect(hi.swayPhase).toBeCloseTo(2 * Math.PI, 10);
  });
});

describe("hintSwayVel", () => {
  const spec = { swayAmp: 0.6, swayFreq: 1, swayPhase: 0 };

  it("peaks at amp*freq when the cosine is 1", () => {
    expect(hintSwayVel(spec, 0)).toBeCloseTo(0.6, 10);
  });

  it("reverses direction half a period later (left↔right)", () => {
    expect(hintSwayVel(spec, Math.PI)).toBeCloseTo(-0.6, 10);
  });

  it("stays bounded by amp*freq at any age", () => {
    for (const age of [0.3, 1.7, 4.2, 9.9]) {
      expect(Math.abs(hintSwayVel(spec, age))).toBeLessThanOrEqual(0.6 + 1e-12);
    }
  });

  it("honours the phase offset", () => {
    const shifted = { ...spec, swayPhase: Math.PI / 2 };
    expect(hintSwayVel(shifted, 0)).toBeCloseTo(0, 10);
  });
});

describe("hintTurn", () => {
  const spec = { swayPhase: 0 };

  it("stays normalized to [-1, 1] at any age", () => {
    for (const age of [0, 0.4, 1.1, 2.8, 7.5]) {
      expect(Math.abs(hintTurn(spec, age))).toBeLessThanOrEqual(1);
    }
  });

  it("turns back and forth (sign reverses over time)", () => {
    const samples = Array.from({ length: 24 }, (_, k) => hintTurn(spec, k * 0.25));
    expect(samples.some((v) => v > 0.1)).toBe(true);
    expect(samples.some((v) => v < -0.1)).toBe(true);
  });

  it("gives different launches a different twist (phase-dependent)", () => {
    expect(hintTurn({ swayPhase: 0.2 }, 1)).not.toBeCloseTo(
      hintTurn({ swayPhase: 4.8 }, 1),
      5,
    );
  });

  it("is deterministic for the same inputs", () => {
    expect(hintTurn(spec, 2)).toBe(hintTurn(spec, 2));
  });
});

describe("pickSelectors", () => {
  it("prefers the home hero when present", () => {
    expect(pickSelectors((s) => s === ".hero")).toBe(HERO_SELECTORS);
    // hero wins even if a phero is also present
    expect(pickSelectors(() => true)).toBe(HERO_SELECTORS);
  });

  it("falls back to the page hero (.phero)", () => {
    expect(pickSelectors((s) => s === ".phero")).toBe(PHERO_SELECTORS);
  });

  it("matches the project-detail heading (.pd-hero)", () => {
    expect(pickSelectors((s) => s === ".pd-hero")).toBe(PD_SELECTORS);
  });

  it("returns null when neither heading exists", () => {
    expect(pickSelectors(() => false)).toBeNull();
  });
});

describe("readLines", () => {
  const title = (...lines: (string | null)[]) => ({
    querySelectorAll: () => lines.map((textContent) => ({ textContent })),
  });

  it("reads and trims each .line span's text", () => {
    expect(readLines(title("  Sebo ", "Mayer"))).toEqual(["Sebo", "Mayer"]);
  });

  it("drops empty and whitespace-only / null lines", () => {
    expect(readLines(title("Work", "", "   ", null))).toEqual(["Work"]);
  });

  it("returns [] when there are no .line spans", () => {
    expect(readLines(title())).toEqual([]);
  });
});

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
