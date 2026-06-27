/**
 * Pure glyph layout for the balloon hero — no three.js, so it stays unit-testable
 * (CLAUDE.md exempts the imperative three code, not this).
 *
 * Coordinates are in the font's own units (the typeface `ha` advance + boundingBox).
 * The scene scales the whole block down to fit the canvas. Each line is centred on
 * x=0; lines stack downward and the block is centred on y=0.
 */

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
