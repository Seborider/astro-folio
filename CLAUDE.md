# CLAUDE.md — working notes for Claude Code

This is an **Astro static site** (no DB, no SSR). It was migrated from a
hand-built HTML motion prototype; the animation code is intentionally plain
`<script>` files in `public/scripts/` so it stays identical to the original.

## Current status

**Final bug-fixing phase.** ~98% of page functionality is complete — routing,
i18n, theming, the motion layer, SEO, legal pages, and both content backends
all work. What remains is **content**: real copy and media (Sanity is wired but
the production dataset/images aren't filled in). Treat source as feature-frozen;
changes here are fixes and polish, not new systems.

**Keep this file current.** Any change that adds, removes, or alters a feature,
convention, gotcha, or the deploy flow must update CLAUDE.md in the same change.
A doc edit isn't optional follow-up — it ships with the code.

## Conventions

- **TypeScript everywhere in source.** All code in `src/` and config files
  (e.g. `astro.config.ts`) is TypeScript (`.ts`/`.tsx`). Exception:
  `public/scripts/*.js` stays plain JavaScript — those files are served
  directly to the browser without bundling.
- **Don't convert the motion code to a framework.** GSAP/Lenis/WebGL are
  imperative and live in `public/scripts/`. Keep them as `is:inline` scripts.
- **Two homes for client JS.** `public/scripts/*.js` are plain, unbundled, and
  served verbatim (the prototype motion layer). The Three.js balloon hero is
  the exception: it lives in `src/scripts/balloons*.ts` (TypeScript, bundled by
  Astro) and is mounted via `PheroCanvas.astro`. Pure layout math
  (`balloons-layout.ts`) is unit-tested; the WebGL scene is not.
- Content has **two interchangeable backends behind one loader**: pages call
  `getProjects(locale)` from `src/lib/projects.ts`, never `getCollection`
  directly. It reads Sanity when `PUBLIC_SANITY_PROJECT_ID` is set, else the
  local JSON collection. Keep the returned `Project` shape stable — it's the
  contract (localization is resolved inside the loader, the shape is flat).
- **Two locales, DE default.** `/` is German, `/en/...` is English; pages live
  in `src/pages/[...lang]/` (rest param `undefined` = de). Translatable fields
  are `{ de, en? }` objects in BOTH backends; a missing `en` falls back to `de`
  (GROQ `coalesce`, JSON `pick()` from `src/i18n`). UI strings outside the CMS
  live in `src/i18n/ui.ts` (`t(locale)`). Scramble `data-text` attributes must
  match the localized element text.
- The JSON schema (`src/content.config.ts`) and the Sanity schema
  (`studio/schemaTypes/project.ts`, locale objects in `locale.ts`) must stay
  in sync. Update BOTH when adding a field, and map it (with `coalesce` if
  translatable) in the GROQ query in `src/lib/projects.ts`. The same pairing
  applies to the singleton documents — `homePage`, `aboutPage`, `siteSettings`,
  `impressumPage`, `datenschutzPage` schemas mirror `src/lib/site.ts`,
  `legal.ts` (each with a `withDefaults` JSON fallback).
- Styling is one file, `src/styles/styles.css`, token-driven (`--bg`, `--ink`,
  `--accent`; the rest derive via `color-mix`). Reuse tokens; don't hardcode hex.
- Reveal animations are declarative: `data-reveal`, `.reveal-lines` (with
  `.line > span`), `data-scramble`. `core.js` wires them on every page.
- Internal links must start with `/` so `chrome.js` applies the wipe transition.
  Build them with `localePath(locale, "/work")` from `src/i18n` so they stay in
  the visitor's language.
- Render media through `Media.astro` (shows `<img>` when a src exists, else the
  labelled placeholder) so layout is identical with or without CMS images.

## Features (what's actually built)

- **Pages**, all bilingual (DE default `/`, EN `/en/…`): home (loader → hero →
  statement → showreel → work preview → archive band), `/about` (with a
  technologies carousel), `/work` (project grid + discipline filter derived
  from `cat`), `/work/<slug>` (detail with prev/next — list ends render no neighbour link, external
  lede link, technologies, optional project video), `/archive` (full
  chronological table), `/impressum`, `/datenschutz`, and a `404`.
- **Balloon hero.** A Three.js scene renders the page title as rising balloon
  letters on every route (`PheroCanvas.astro` + `src/scripts/balloons*.ts`);
  the header holds the reload/replay trigger.
- **Theme.** Real dark/light toggle with an animated theme-switch transition;
  `styles.css` is token-driven and the WebGL background + balloon scene react
  to the active theme. (The old live-only "Tweaks" color panel was removed.)
- **Motion layer.** Custom cursor (hover states on links), Lenis smooth scroll,
  WebGL shader background, character-scramble headings, declarative scroll
  reveals, CSS page-wipe transition, showreel overlay (dialog semantics: focus
  trap, Escape, focus restore), cursor-following work preview, a mobile header
  menu, and a custom scrollbar — interactive, not just an indicator: click the
  rail to jump, drag the thumb to scroll (wired in core.js; the rail takes
  pointer input only when the page scrolls). The /about technologies strip
  hides its native bar and mirrors the same thumb, with the same click/drag
  behavior, via `.tech-scroll` + an inline script.
- **i18n.** Header EN/DE switcher (immediate, same-page), localized chrome and
  content, `t(locale)` UI strings; `public/scripts/i18n.js` handles the
  client-side switch wiring.
- **SEO.** Per-page `<title>`/meta + OG/Twitter tags, hreflang alternates,
  JSON-LD (`src/lib/jsonld.ts`: Person / WebSite / CreativeWork), `@astrojs/sitemap`
  (i18n-aware `sitemap-index.xml`), and a generated `robots.txt`.
- **Accessibility.** Skip link, visible focus indicators, labelled controls.
- **CMS.** Sanity backend behind the loader (see Conventions); local JSON is
  the offline/default backend. Singletons (home/about/site settings/legal) also
  flow through Sanity with JSON fallbacks.

## Script load order (in src/layouts/Base.astro)

GSAP → ScrollTrigger → Lenis → webgl-bg.js → chrome.js → i18n.js → core.js → home.js (home only)

**Libraries are self-hosted** from `public/vendor/` (pinned versions: gsap 3.12.5, lenis 1.1.13). No third-party CDN requests — shipped with the site to respect DSGVO (Datenschutz page promises) and avoid SRI/supply-chain exposure. To upgrade: re-download the pinned files into `public/vendor/` and update the version comments in `src/layouts/Base.astro`.

The bundled `src/scripts/balloons*.ts` hero loads separately (not part of this ordered chain).

## Verify after changes

```bash
npm test           # Vitest — unit tests must pass
npm run build      # must pass; content schema is validated here
npm run preview
```

Then check, in BOTH locales (`/` and `/en/...`): home loader → hero reveal;
/work filter; /work/<slug> detail with prev/next; the page-wipe between routes
(including the EN/DE switcher in the header); no console errors.

Note: a Sanity dataset created before the locale migration has flat string
fields — run `cd studio && npm run migrate:locales` once (idempotent) or the
GROQ `coalesce` projections return null and the build fails.

## Gotchas

Non-obvious things that have bitten us (several show up repeatedly in the git
history — treat them as checklist items):

- **Pre-locale Sanity dataset → build fails.** Flat string fields break the
  GROQ `coalesce`. Run `cd studio && npm run migrate:locales` once (idempotent).
  See the note above.
- **Dev server caches `getStaticPaths`.** Sanity project edits don't appear
  until you restart `astro dev` (Astro caches the path lookup). Site-settings
  changes do refresh on reload. `src/lib/sanity.ts` already bypasses the query
  CDN in dev so *published* edits show instantly once paths are re-resolved.
- **Build-time content fetch.** Sanity is read at `npm run build`, not at
  runtime. Publishing in the Studio does **not** change the live site until the
  next build (see Deployment).
- **`en` falls back to `de`, never the reverse.** DE is required in both
  backends; a *missing* EN coalesces to DE. An EN field authored as an empty
  string is kept as-is (both `pick()` and GROQ `coalesce` only treat
  null/missing as absent) — never author empty EN fields, leave them unset.
- **Scramble `data-text` must equal the localized visible text.** A mismatch
  leaves the scramble animation resolving to the wrong string per locale.
- **Internal links must start with `/`** or `chrome.js` won't apply the wipe.
  Build them with `localePath(locale, …)` so they stay in-language.
- **Script load order is load-bearing** (see above). GSAP/ScrollTrigger/Lenis
  must exist before `core.js`/`home.js` run.
- **Never reintroduce third-party CDN scripts.** GSAP/ScrollTrigger/Lenis are
  self-hosted in `public/vendor/` to respect DSGVO (Datenschutz page promises
  no third-party IP leaks) and avoid SRI/supply-chain exposure. If upgrading
  libraries, always re-download into `public/vendor/` — don't link to CDNs.
- **Theme/cursor `mix-blend-mode` caveat.** The header nav and cursor use
  `mix-blend-mode: difference`; carried over from the prototype, this can look
  faint on light backgrounds. The dark/light rework touched this area
  repeatedly — re-check both themes after any chrome/cursor change.
- **`order` drives prev/next and list order**, not file/array order (data
  collections are unordered). Give every project a unique `order`.
- **First render is blocked until `#vt-ready`** (`<link rel="expect"
  blocking="render">` in Base.astro pointing at the last element in `<body>`).
  Without it Chrome paints mid-parse, 1–2 frames before core.js arms the hero's
  hidden state, and a View-Transition arrival flashed the settled page before
  the `vtRiseIn` rise. Keep the marker `<div id="vt-ready">` as the LAST element
  in `<body>` (after the synchronous script chain); moving it above the scripts
  brings the flicker back. Self-releasing: non-supporting browsers ignore the
  link, and render-blocking always ends when parsing does.
- **CMS strings are trusted HTML.** Bio/quote/statement lines, legal bodies
  and technology SVGs render via `set:html` (and swap via `innerHTML` in
  i18n.js) — deliberately unsanitized. Anyone with Studio write access can
  inject markup site-wide; keep Studio access limited to the site owner and
  never render third-party-supplied content through these fields.

## Deployment

The site is **static output** (`astro.config.ts` → `output: "static"`, no
`@astrojs/node` adapter). `npm run build` emits plain files to `dist/`. Node
(18+) is needed only at **build time**; nothing runs server-side at request
time.

**On Hostinger.** Build from the GitHub repo and serve the build:

- Build command: `npm run build`. Output / publish directory: `dist`.
- Node is the build toolchain, not a runtime — the served output is static
  HTML/CSS/JS. [CONFIRM] the exact Hostinger pipeline (git-based static build
  vs. a Node.js-app slot running the build and serving `dist/`); if it's a
  Node.js-app slot, [CONFIRM] the start/serve command and document it here.
- Set `site` in `astro.config.ts` to the production URL before deploying — it
  feeds canonical URLs, the sitemap, and the hreflang alternates. (Currently
  `https://sebo.zone`; [CONFIRM] this is the intended production domain.)

**Sanity at build time.** Content is fetched during `npm run build`, baked into
the static HTML:

- Set the build-time env vars **wherever the build runs** (Hostinger build env,
  `.env` from `.env.example`): `PUBLIC_SANITY_PROJECT_ID=<id>` and
  `PUBLIC_SANITY_DATASET=production`. Unset → the build uses the local JSON
  collection instead.
- A dataset created before the locale migration must be migrated once:
  `cd studio && npm run migrate:locales` (idempotent) — otherwise the GROQ
  `coalesce` projections return null and the build fails. See Gotchas.

**Redeploy on publish.** Publishing in the Studio does **not** update the live
site by itself — static HTML holds the old content until the next build. To
auto-rebuild:

- Sanity webhook (manage → API → Webhooks) → the host's build/deploy hook URL.
- If Hostinger exposes no public build-hook URL, bridge it: Sanity webhook →
  GitHub `repository_dispatch` → a GitHub Action that triggers the redeploy.
  [CONFIRM] which path is wired (host build hook vs. GitHub Action) and add the
  concrete URL/workflow once it exists — neither is committed to this repo yet.

## Testing

**Vitest.** Config in `vitest.config.ts` wraps Astro's `getViteConfig` so the
`astro:content` virtual module and `import.meta.env` resolve the same way they
do in `astro build`. Run with `npm test` (`vitest run`). Tests are **colocated**
as `*.test.ts` next to the module they cover (`src/**/*.test.ts`).

**Tests are mandatory.** Every change that touches testable logic ships with
tests in the same change — no exceptions. "Testable logic" = pure functions,
loaders, schema mapping, i18n helpers (anything in `src/lib/`, `src/i18n/`,
`src/content.config.ts`, and pure helpers in components). Cover the happy path,
the `en`→`de` locale fallback where relevant, and edge cases (empty input,
missing fields). Do NOT add tests for the imperative motion code in
`public/scripts/*.js` (GSAP/Lenis/WebGL) or browser/DOM/visual behavior — that
stays out of the unit suite.

Current coverage (keep it green when editing these):

- `src/i18n/index.ts` — locale helpers (`pick`, `altOf`, `localePath`, `altLocalePath`,
  `localeStaticPaths`, `pageTitle`, `stripTrailingSlash`).
- `src/i18n/ui.ts` — `t()` plus a de/en key-parity guard.
- `src/lib/sanity.ts` — `imageUrl` (ref→CDN url) and `sanityFetch` (mocked
  global `fetch`; never hits the network).
- `src/lib/projects.ts` — `neighbours` (adjacent items; ends yield undefined), `resolveLedeLink`,
  `reelTileTarget`, and `getProjects` for BOTH backends with `./sanity` +
  `astro:content` mocked.
- `src/lib/site.ts` — `withDefaults` per-field merge (the loaders themselves do
  live Sanity I/O and are not unit-tested).
- `src/lib/jsonld.ts` — `personSchema`/`webSiteSchema`/`creativeWorkSchema`
  shape and `serializeJsonLd`.
- `src/lib/legal.ts` — localized legal-page resolution (Impressum + Datenschutz) with JSON defaults.
- `src/scripts/balloons-layout.ts` — pure balloon-letter layout geometry (the
  one piece of the motion code that's pure math, so it IS tested; the WebGL
  scene around it is not).
- `src/content.config.ts` — the project Zod schema (`safeParse`, real
  `astro:content`).
- `src/lib/memo.ts` — `memoByLocale` (per-locale memo, DEV bypass).

Mocking patterns that work here: `vi.stubEnv` + `vi.resetModules()` + dynamic
`import()` for module-level env consts (`PROJECT_ID`); `vi.mock("./sanity")`
with `sanityConfigured` as a **getter** to flip backends per test;
`vi.mock("astro:content")` for `getCollection`; `vi.stubGlobal("fetch", ...)`
for network code. The Zod-schema test uses the REAL `astro:content` (no mock).

One source helper is exported solely for testing: `withDefaults`
(`src/lib/site.ts`). Keep it exported.

## Remaining work (final phase)

Page functionality is ~98% done; what's left is mostly content and the
go-live wiring. In rough priority:

1. **Fill the production content.** The Sanity backend is wired but the live
   dataset/copy isn't populated. `cd studio && npm i`, init a project, set
   `PUBLIC_SANITY_PROJECT_ID`, `npm run import:seed`, migrate if needed, rebuild.
2. **Real media.** Upload cover + gallery images in the Studio (they resolve via
   `src/lib/sanity.ts` and render through `Media.astro`). For the hero/showreel
   video slots use Mux or Cloudflare Stream rather than committing large MP4s.
   **Reel-tile previews must be recorded/exported at 16:9 — 1920×1080.** Every
   reel tile's media box is pinned to `aspect-ratio: 16/9` (`.reel__tile-media`
   in `styles.css`), so a 16:9 source fills any slot via `object-fit: cover`
   with no crop and no letterbox bars. Off-ratio footage reintroduces a crop.
3. **Redeploy-on-publish wiring.** Connect Sanity publish → rebuild (see
   Deployment). Not yet committed — [CONFIRM] the chosen path.
4. **Light-theme chrome polish.** The `mix-blend-mode: difference` header/cursor
   can look faint on light backgrounds (see Gotchas) — verify across the
   dark/light toggle.

Done already (don't re-do): SEO/OG/JSON-LD/sitemap, project video, technologies
carousel, accessibility pass, the balloon hero, and the dark/light theme system.

Possible later: replace the regex-derived discipline filter in `work.astro`
with an explicit `tags: string[]` on BOTH schemas, if filtering needs to be
authored rather than inferred from `cat`.

## Collaboration principles

### 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

New features and bugfixes **must** ship with tests whenever they touch testable
logic (pure helpers, loaders, schema mapping, i18n) — in the same change, and
`npm test` must pass before it's done. See the **Testing** section above for
scope, current coverage, and the mocking patterns.
