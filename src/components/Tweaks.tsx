// Tweaks.tsx — Tweaks panel for the folio (Astro React island).
// Writes the --accent / --bg / --ink CSS variables that folio.css consumes.

import React from "react";
import { useTweaks, TweaksPanel, TweakSection, TweakColor } from "./tweaks-panel";

const TWEAK_DEFAULTS = {
  "accent": "oklch(0.72 0.13 56)",
  "bg": "#080808",
  "ink": "#e9e6df"
};

// Curated accents — matched lightness/chroma, hue varied (per the design system)
const ACCENTS = [
  "oklch(0.72 0.13 56)",   // amber (default)
  "oklch(0.72 0.13 18)",   // coral
  "oklch(0.72 0.13 150)",  // sage
  "oklch(0.72 0.13 232)",  // steel blue
  "oklch(0.72 0.13 300)",  // violet
  "oklch(0.90 0.02 90)",   // near-white (monochrome / off)
];

// Backgrounds — subtly-toned darks + one paper light
const BGS = [
  "#080808",  // near-black (default)
  "#0b0d11",  // cool ink
  "#13100b",  // warm espresso
  "#171717",  // charcoal
  "#1a1320",  // deep aubergine
  "#ece8df",  // warm paper (pair with a dark text)
];

// Text — warm/cool off-whites + one near-black for light backgrounds
const INKS = [
  "#e9e6df",  // warm off-white (default)
  "#f5f2ec",  // bright paper
  "#cbc6ba",  // muted stone
  "#e6e9ef",  // cool white
  "#d8cfc0",  // sand
  "#14110c",  // near-black (pair with a light background)
];

function applyAccent(v: string) {
  document.documentElement.style.setProperty("--accent", v);
}
function applyVar(name: string, v: string) {
  document.documentElement.style.setProperty(name, v);
}

function FolioTweaks() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => { applyAccent(t.accent); }, [t.accent]);
  React.useEffect(() => { applyVar("--bg", t.bg); }, [t.bg]);
  React.useEffect(() => { applyVar("--ink", t.ink); }, [t.ink]);

  return (
    <TweaksPanel>
      <TweakSection label="Accent" />
      <TweakColor
        label="Highlight color"
        value={t.accent}
        options={ACCENTS}
        onChange={(v) => setTweak("accent", v)}
      />
      <TweakSection label="Canvas" />
      <TweakColor
        label="Background"
        value={t.bg}
        options={BGS}
        onChange={(v) => setTweak("bg", v)}
      />
      <TweakColor
        label="Text"
        value={t.ink}
        options={INKS}
        onChange={(v) => setTweak("ink", v)}
      />
    </TweaksPanel>
  );
}

export default FolioTweaks;
