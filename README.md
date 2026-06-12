# Astro Folio

An art-director portfolio built on **Astro** (static output), with the original
hand-crafted motion layer intact: **GSAP + ScrollTrigger**, **Lenis** smooth
scroll, a **WebGL** shader background, a custom cursor, character-scramble text,
and a CSS-driven page-wipe transition. No database, no server runtime.

This repo was migrated from a static multi-page HTML prototype. The motion code
is deliberately kept as plain `<script>` files so it behaves identically to the
prototype — Astro handles routing, content, and the build.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static site → ./dist
npm run preview    # serve the build locally
```

Requires Node 18+.

---

## How it's structured

```
src/
  content/
    config.ts                # Zod schema for the `projects` collection
    projects/*.json          # one file per project (filename = slug = URL)
  lib/
    projects.ts              # getProjects() — unified loader (JSON or Sanity)
    sanity.ts                # tiny Sanity read client + image URL helper
  layouts/
    Base.astro               # the shared shell + script load order
  components/
    Header.astro
    Footer.astro             # lean footer; pass `carousel` for the home variant
    Media.astro              # <img> when a src exists, else labelled placeholder
    Tweaks.tsx               # Tweaks panel: accent / background / text colors (React island)
    tweaks-panel.tsx         # reusable panel shell + curated color control
  pages/
    index.astro              # home (loader, hero, statement, reel, work, archive band)
    about.astro
    work.astro               # project grid + discipline filter
    archive.astro            # full chronological table
    work/[slug].astro        # project detail (server-rendered from the loader)
  styles/
    folio.css                # the whole design system (tokens, components, layouts)
public/
  scripts/
    core.js                  # EVERY page: cursor, Lenis, reveals, scramble, clock
    home.js                  # home only: loader, showreel, carousel, work preview
    webgl-bg.js              # the shader background (theme-aware)
    chrome.js                # the page-wipe transition (intercepts internal links)
studio/                      # Sanity Studio (optional CMS)
  sanity.config.ts           # schema + plugins; set your projectId
  schemaTypes/project.ts     # mirrors the content contract + media fields
  seed/projects.ndjson       # the 14 current projects, ready to import
```

### The content model
Projects are **structured data**, not long-form articles, so they live in a
`type: "data"` collection — one JSON file per project in `src/content/projects/`.
The **filename is the slug**: `halcyon.json` → `/work/halcyon`.

`src/content/config.ts` is the contract (validated at build time):

```ts
order: number          // drives list order + prev/next (data collections are unordered)
name, cat, yr, role, client: string
services: string[]
intro: string          // one-line lede
overview: string[]     // paragraphs
quote?: string[]       // optional pull-quote lines (may contain <em>…</em>)
gallery: { label: string; span: "full" | "half" }[]
```

### Add or edit a project
1. Drop a new JSON file in `src/content/projects/` (copy an existing one).
2. Give it a unique `order`. That's it — the detail page, the work grid, the
   archive table, and the home lists all pick it up automatically.

### Two backends, one shape
Pages never read content directly — they call `getProjects()` from
`src/lib/projects.ts`, which returns the same `Project[]` shape from either
backend:

- **No env set** → reads the local JSON collection (great for offline dev).
- **`PUBLIC_SANITY_PROJECT_ID` set** → reads from Sanity instead.

So flipping to the CMS is two env vars and a rebuild — no page edits. See the
**CMS (Sanity)** section below.

---

## CMS (Sanity)

A ready-to-run Studio lives in `studio/`. Its schema (`studio/schemaTypes/project.ts`)
mirrors the content contract exactly, and adds optional `cover` + per-shot
`image` fields for real media.

### One-time setup
```bash
cd studio
npm install
npx sanity login
npx sanity init --reconfigure   # create/select a project; choose dataset "production"
```
Put the resulting **project id** in two places:
- `studio/sanity.config.ts` and `studio/sanity.cli.ts` (or set `SANITY_STUDIO_PROJECT_ID`)
- the Astro app's `.env`: `PUBLIC_SANITY_PROJECT_ID=<id>` (copy `.env.example`)

### Seed the 14 current projects
The prototype content is exported to NDJSON so the client starts with real data:
```bash
cd studio
npm run import:seed     # imports seed/projects.ndjson into the production dataset
```

### Run the Studio
```bash
cd studio
npm run dev             # http://localhost:3333 — edit content here
npm run deploy          # host the Studio at https://<name>.sanity.studio
```

The Studio is **not part of the deployed site**. Content lives in Sanity's
cloud; the Studio is just an editing UI for it. Run `npm run deploy` once and
Sanity hosts it for free at `https://<name>.sanity.studio` — log in there from
any browser to edit content. Nothing to configure on the site host.

### Go live with the CMS
1. Set `PUBLIC_SANITY_PROJECT_ID` + `PUBLIC_SANITY_DATASET` **wherever the
   build runs** — they're build-time vars, baked in by `npm run build`. On
   Vercel/Netlify/CF Pages/Hostinger that's the project's build env settings.
2. Rebuild. `getProjects()` now reads Sanity; images resolve through the Sanity
   image CDN via `src/lib/sanity.ts` and render through `Media.astro`.
3. Publishing in the Studio does **not** update the live site by itself — the
   static HTML holds the old content until the next build. For auto-rebuild on
   publish, add a webhook (Sanity → manage → API → Webhooks) pointing at the
   host's build hook — see **Deploy** below. For instant updates without
   rebuilds, switch the page(s) to SSR with an adapter — but static + webhook
   is plenty here.

> Note: `src/lib/sanity.ts` uses a single `fetch` against the read-only image/query
> CDN — no SDK. Swap in `@sanity/client` + `@sanity/image-url` if you prefer.

---

## The motion layer (don't fight it)

- **`core.js`** runs on every page. It owns the cursor, Lenis, the scramble
  effect (`window.scramble`), the scroll reveals (`[data-reveal]`,
  `.reveal-lines`, `[data-scramble]`), the page-hero rise, the clock, and the
  email-copy button. It exposes `window.__revealHero` and `window.__lenis`.
- **`home.js`** runs only on the home page (loaded when `Base` gets `home={true}`)
  and adds the loader count-up, the showreel overlay, the carousel, and the
  cursor-following work preview.
- Reveal hooks are declarative — add `data-reveal` (fade-up), wrap kinetic
  copy in `.reveal-lines` with `.line > span`, or `data-scramble` a heading.
- Load order in `Base.astro` matters: GSAP → ScrollTrigger → Lenis →
  webgl-bg → chrome → core → (home).

### Page transitions
`chrome.js` does the CSS-driven cover-wipe and intercepts internal links
(`href` starting with `/`). **Alternative:** delete `chrome.js` and add Astro's
native transitions to `Base.astro`:

```astro
import { ViewTransitions } from "astro:transitions";
// in <head>:
<ViewTransitions />
```
You'd then re-create the wipe with `::view-transition-old/new` CSS. The custom
script is kept because it reproduces the prototype exactly.

### Theming / Tweaks
`folio.css` is driven by `--bg`, `--ink`, and `--accent`; every other token is
derived via `color-mix`. The Tweaks panel writes those three variables and the
WebGL background samples them live. It's a React island
(`src/components/Tweaks.tsx`, mounted as `<Tweaks client:idle />` in `Base.astro`)
with its own toggle button in the bottom-right corner. Changes are **live-only**:
they apply for the session and reset on reload — there's no persistence layer.
The defaults match the `:root` values in `folio.css`, so first paint is correct
before the island hydrates.

---

## Media (the important part)

Everything visual is a labelled placeholder right now. For production:

- **Images** — add `@astrojs/image`/built-in `<Image>` or a CMS asset CDN
  (Sanity, Cloudinary). Put an `image` field on the gallery items and the cover.
- **Video** — do **not** commit large MP4s. Use **Mux** or **Cloudflare Stream**
  (adaptive streaming + posters) and reference by playback ID. The hero `.hero__bg`
  and showreel `.showreel__player` are the slots.

---

## Deploy

Static output — host anywhere:

- **Vercel / Netlify / Cloudflare Pages / Hostinger** — connect the GitHub
  repo, build command `npm run build`, output dir `dist`. Done.
- Rebuild-on-publish: Sanity webhook → the host's build/deploy hook URL. If
  the host only rebuilds on git push (no public hook URL), bridge it: Sanity
  webhook → `repository_dispatch` → a GitHub Action that triggers a redeploy.
- Set `site` in `astro.config.ts` to the production URL first.

No database is required. A contact form would use a form service (Formspree) or
a serverless function → email; only add a DB for auth / commerce / stored
submissions.

---

## Known caveat carried over from the prototype
The header nav and custom cursor use `mix-blend-mode: difference` so they stay
legible over the dark hero. On a **light** Tweaks theme that blend inverts and
can look faint — make the chrome theme-aware if you ship a light default.
