// Tweaks.tsx — Tweaks panel for the folio (Astro React island).
// Writes the --accent / --bg / --ink CSS variables that folio.css consumes.
// The theme (data-theme on <html>) is the persistent baseline; tweaks are
// ephemeral per-page-view overrides on top. Toggling the theme clears them.

import React from "react";
import { useTweaks, TweaksPanel, TweakSection, TweakColor } from "./tweaks-panel";

const TWEAK_DEFAULTS = {
  "accent": "oklch(0.72 0.13 56)",
  "bg": "#080808",
  "ink": "#e9e6df"
};

const TOKEN_NAMES = ["accent", "bg", "ink"] as const;

function readTokens() {
  const cs = getComputedStyle(document.documentElement);
  return {
    accent: cs.getPropertyValue("--accent").trim() || TWEAK_DEFAULTS.accent,
    bg: cs.getPropertyValue("--bg").trim() || TWEAK_DEFAULTS.bg,
    ink: cs.getPropertyValue("--ink").trim() || TWEAK_DEFAULTS.ink,
  };
}

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

function FolioTweaks() {
  // SSR renders with the dark defaults; the mount effect re-syncs to the
  // active theme without writing any inline styles.
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // On mount and on every theme toggle: drop the inline overrides and
  // mirror the new baseline tokens so the chips show the real values.
  React.useEffect(() => {
    const sync = () => {
      TOKEN_NAMES.forEach((n) => document.documentElement.style.removeProperty("--" + n));
      setTweak(readTokens());
    };
    sync();
    window.addEventListener("themechange", sync);
    return () => window.removeEventListener("themechange", sync);
  }, [setTweak]);

  // user-initiated changes write the override immediately (no effect needed)
  const change = (name: (typeof TOKEN_NAMES)[number]) => (v: string) => {
    setTweak(name, v);
    document.documentElement.style.setProperty("--" + name, v);
  };

  return (
    <TweaksPanel>
      <TweakSection label="Accent" />
      <TweakColor
        label="Highlight color"
        value={t.accent}
        options={ACCENTS}
        onChange={change("accent")}
      />
      <TweakSection label="Canvas" />
      <TweakColor
        label="Background"
        value={t.bg}
        options={BGS}
        onChange={change("bg")}
      />
      <TweakColor
        label="Text"
        value={t.ink}
        options={INKS}
        onChange={change("ink")}
      />
    </TweaksPanel>
  );
}

export default FolioTweaks;
