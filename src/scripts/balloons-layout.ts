/**
 * Pure glyph layout for the balloon hero — no three.js, so it stays unit-testable
 * (CLAUDE.md exempts the imperative three code, not this).
 *
 * Coordinates are in the font's own units (the typeface `ha` advance + boundingBox).
 * The scene scales the whole block down to fit the canvas. Each line is centred on
 * x=0; lines stack downward and the block is centred on y=0.
 */

/** The four selectors the bootstrap needs to wire one balloon heading. */
export interface BalloonSelectors {
  section: string;
  canvas: string;
  title: string;
  reset: string;
}

// Home uses .hero; every other page uses the .phero page-heading. Both share
// the same `.line > span` title structure, so only the roots differ.
export const HERO_SELECTORS: BalloonSelectors = {
  section: ".hero",
  canvas: ".hero__canvas",
  title: ".hero__title",
  reset: ".hero__reset",
};
export const PHERO_SELECTORS: BalloonSelectors = {
  section: ".phero",
  canvas: ".phero__canvas",
  title: ".phero__title",
  reset: ".phero__reset",
};
// Project detail heading — its own section/title classes, but it reuses the
// PheroCanvas component (so the canvas/reset hooks are the .phero__* ones).
export const PD_SELECTORS: BalloonSelectors = {
  section: ".pd-hero",
  canvas: ".phero__canvas",
  title: ".pd-title",
  reset: ".phero__reset",
};

/**
 * Pick the balloon heading present on this page: the home hero, else the page
 * hero, else the project-detail heading. A page only ever has one, so order
 * past the home hero doesn't matter. Pure (takes a presence predicate) so it
 * stays unit-testable.
 */
export function pickSelectors(
  has: (sel: string) => boolean,
): BalloonSelectors | null {
  for (const sel of [HERO_SELECTORS, PHERO_SELECTORS, PD_SELECTORS]) {
    if (has(sel.section)) return sel;
  }
  return null;
}

/**
 * Title lines for the scene, read from the server-rendered `.line` spans — the
 * DOM stays the source of truth (localized by the content loader). DOM-light so
 * it can be tested with plain objects.
 */
export function readLines(title: {
  querySelectorAll(sel: string): ArrayLike<{ textContent: string | null }>;
}): string[] {
  return Array.from(title.querySelectorAll(".line"))
    .map((l) => l.textContent?.trim() ?? "")
    .filter(Boolean);
}

// Intro rise: balloons ease up into place on first reveal (and on reset),
// standing in for the old CSS heading rise — per-letter stagger + expo.out,
// mirroring core.js's [data-rise]. A pure render offset that decays to 0; the
// scene's spring physics are untouched. Kept here (three-free) so it's testable.
export const RISE_DIST = 2.4; // how far below home each balloon starts (root units)
export const RISE_DUR = 2; // the rise-to-home duration, seconds
export const RISE_STAGGER = 0.08; // delay between successive letters, seconds
// After the rise: a slow, gentle settle — the balloon bobs up and down a couple
// of times on its string before coming to rest.
export const RISE_SETTLE_DUR = 2.6; // settle duration, seconds (long = slow)
export const RISE_BOUNCES = 2; // up/down cycles during the settle
export const RISE_BOB = 0.02; // peak settle amplitude, root units (small = subtle)

/**
 * Vertical intro offset for letter `i`. Two phases:
 *  1. rise — eases up from -RISE_DIST to home (0) over RISE_DUR, no wobble.
 *  2. settle — once fully risen, a slow gentle bob up and down (RISE_BOUNCES
 *     cycles over RISE_SETTLE_DUR) before resting at 0.
 * Staggered per letter. `t0` is the intro start (ms); 0 (not yet revealed) or
 * before this letter's turn → -RISE_DIST.
 *
 * Both phases meet at home with zero velocity: the cubic rise decelerates to 0,
 * and the settle's amplitude is a sin(π·τ) hump that fades in AND out (zero
 * amplitude and zero slope at both ends), so the handoff is smooth, not a kick.
 */
export function riseOffset(i: number, now: number, t0: number): number {
  if (!t0) return -RISE_DIST;
  const e = (now - t0) / 1000 - i * RISE_STAGGER;
  if (e <= 0) return -RISE_DIST;
  if (e < RISE_DUR) {
    const p = e / RISE_DUR;
    return -RISE_DIST * (1 - p) ** 3; // cubic ease-out rise, monotonic
  }
  const ts = e - RISE_DUR;
  if (ts >= RISE_SETTLE_DUR) return 0; // fully settled at home
  const tau = ts / RISE_SETTLE_DUR;
  const envelope = Math.sin(Math.PI * tau); // fades in and out, 0 at both ends
  return RISE_BOB * envelope * Math.sin(RISE_BOUNCES * 2 * Math.PI * tau);
}

// Touch-device hint balloons: small labelled balloons that drift up behind the
// letters (the desktop CUT/POP cursor affordance is invisible on touch). Pure
// scheduling only — the scene launches one, then waits `delay` for the next.
export const HINT_DELAY_MIN = 2; // seconds between launches, lower bound
export const HINT_DELAY_MAX = 5; // upper bound
// per-launch rise variation, [min, max] — sampled per balloon so each one
// rises a little differently (the cut letters keep their fixed scene rates)
export const HINT_VY: [number, number] = [0.25, 0.6]; // initial climb speed
export const HINT_VX: [number, number] = [-0.35, 0.35]; // sideways drift
export const HINT_LIFT: [number, number] = [0.5, 1.2]; // helium acceleration
// no spin range: the sign hanging off the knot weighs the balloon down, so a
// hint balloon rises upright (the scene passes spin 0 to the shared rise).
// Instead of tumbling it meanders: a per-launch sinusoidal left/right sway.
export const HINT_SWAY_AMP: [number, number] = [0.3, 0.9]; // sway width, root units
export const HINT_SWAY_FREQ: [number, number] = [0.5, 1.2]; // sway rate, rad/s

const pickIn = ([lo, hi]: [number, number], rand: () => number) =>
  lo + rand() * (hi - lo);

export interface HintLaunch {
  delay: number; // seconds until the NEXT launch
  x: number; // horizontal start, root-local units
  label: number; // alternates 0/1 → "cut me loose" / "pop me"
  vy: number; // initial climb speed
  vx: number; // sideways drift
  lift: number; // helium acceleration
  swayAmp: number; // left/right meander width
  swayFreq: number; // meander rate
  swayPhase: number; // where in the cycle this balloon starts
}

/** Launch spec for hint balloon `i`; `rand` is injected so it stays testable. */
export function hintLaunch(
  i: number,
  halfWidth: number,
  rand: () => number,
): HintLaunch {
  return {
    delay: HINT_DELAY_MIN + rand() * (HINT_DELAY_MAX - HINT_DELAY_MIN),
    x: (rand() * 2 - 1) * halfWidth,
    label: i % 2,
    vy: pickIn(HINT_VY, rand),
    vx: pickIn(HINT_VX, rand),
    lift: pickIn(HINT_LIFT, rand),
    swayAmp: pickIn(HINT_SWAY_AMP, rand),
    swayFreq: pickIn(HINT_SWAY_FREQ, rand),
    swayPhase: rand() * 2 * Math.PI,
  };
}

/**
 * Lateral sway velocity `age` seconds after launch — the derivative of a
 * sinusoidal meander, so integrating it in the scene traces smooth left/right
 * arcs bounded by ±amp. The scene also leans the rig by this velocity, which
 * is what angles the string and swings the sign.
 */
export function hintSwayVel(
  spec: { swayAmp: number; swayFreq: number; swayPhase: number },
  age: number,
): number {
  return (
    spec.swayAmp *
    spec.swayFreq *
    Math.cos(spec.swayFreq * age + spec.swayPhase)
  );
}

/**
 * Twist of the whole rig around its vertical (y) axis, normalized [-1, 1] —
 * the string's torsion turns the balloon and its sign back and forth as they
 * rise, the way a hanging tag twists in the air. Phase derives from the
 * balloon's swayPhase so every launch twists on its own rhythm. The scene
 * scales it to radians (balloon) and a perspective rotateY (sign).
 */
export function hintTurn(spec: { swayPhase: number }, age: number): number {
  return Math.sin(1.3 * age + spec.swayPhase * 1.7);
}

export interface GlyphPlacement {
  char: string;
  line: number;
  /** glyph centre, font units, origin at block centre */
  x: number;
  y: number;
}

export interface LayoutResult {
  placements: GlyphPlacement[];
  width: number; // widest line
  height: number; // total block height
}

export interface LayoutOptions {
  /** extra space between glyphs, font units (can be negative to tighten) */
  tracking?: number;
  /** distance between baselines, font units */
  lineHeight: number;
}

/**
 * @param lines    text lines, e.g. ["Sebo", "Mayer"]
 * @param advance  glyph → horizontal advance in font units
 */
export function layoutGlyphs(
  lines: string[],
  advance: (ch: string) => number,
  opts: LayoutOptions,
): LayoutResult {
  const tracking = opts.tracking ?? 0;
  const lineHeight = opts.lineHeight;

  // First pass: per-line glyph left-edges + line width.
  const perLine = lines.map((line) => {
    const glyphs: { char: string; left: number; adv: number }[] = [];
    let x = 0;
    for (const char of Array.from(line)) {
      const adv = advance(char);
      if (char !== " ") glyphs.push({ char, left: x, adv });
      x += adv + tracking;
    }
    // width is the last advance without the trailing tracking
    const width = x - (line.length ? tracking : 0);
    return { glyphs, width };
  });

  const blockWidth = perLine.reduce((m, l) => Math.max(m, l.width), 0);
  const blockHeight = lines.length * lineHeight;

  const placements: GlyphPlacement[] = [];
  perLine.forEach((l, lineIdx) => {
    // centre this line horizontally, centre the block vertically
    const xShift = -l.width / 2;
    const y = (lines.length - 1) / 2 - lineIdx; // top line highest
    for (const g of l.glyphs) {
      placements.push({
        char: g.char,
        line: lineIdx,
        x: g.left + g.adv / 2 + xShift, // glyph centre
        y: y * lineHeight,
      });
    }
  });

  return { placements, width: blockWidth, height: blockHeight };
}
