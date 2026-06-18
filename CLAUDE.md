# CLAUDE.md — working notes for Claude Code

This is an **Astro static site** (no DB, no SSR). It was migrated from a
hand-built HTML motion prototype; the animation code is intentionally plain
`<script>` files in `public/scripts/` so it stays identical to the original.

## Conventions

- **TypeScript everywhere in source.** All code in `src/` and config files
  (e.g. `astro.config.ts`) is TypeScript (`.ts`/`.tsx`). Exception:
  `public/scripts/*.js` stays plain JavaScript — those files are served
  directly to the browser without bundling.
- **Don't convert the motion code to a framework.** GSAP/Lenis/WebGL are
  imperative and live in `public/scripts/`. Keep them as `is:inline` scripts.
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
- The JSON schema (`src/content/config.ts`) and the Sanity schema
  (`studio/schemaTypes/project.ts`, locale objects in `locale.ts`) must stay
  in sync. Update BOTH when adding a field, and map it (with `coalesce` if
  translatable) in the GROQ query in `src/lib/projects.ts`.
- Styling is one file, `src/styles/styles.css`, token-driven (`--bg`, `--ink`,
  `--accent`; the rest derive via `color-mix`). Reuse tokens; don't hardcode hex.
- Reveal animations are declarative: `data-reveal`, `.reveal-lines` (with
  `.line > span`), `data-scramble`. `core.js` wires them on every page.
- Internal links must start with `/` so `chrome.js` applies the wipe transition.
  Build them with `localePath(locale, "/work")` from `src/i18n` so they stay in
  the visitor's language.
- Render media through `Media.astro` (shows `<img>` when a src exists, else the
  labelled placeholder) so layout is identical with or without CMS images.

## Script load order (in src/layouts/Base.astro)

GSAP → ScrollTrigger → Lenis → webgl-bg.js → chrome.js → core.js → home.js (home only)

The Tweaks panel is a React island (`<Tweaks client:idle />`, see
`src/components/Tweaks.tsx`), not an inline script — Astro bundles and hydrates it.

## Verify after changes

```bash
npm test           # Vitest — unit tests must pass
npm run build      # must pass; content schema is validated here
npm run preview
```

Then check, in BOTH locales (`/` and `/en/...`): home loader → hero reveal;
/work filter; /work/<slug> detail with prev/next; the page-wipe between routes
(including the EN/DE switcher in the header); the Tweaks toggle (bottom-right)
opens the panel and color changes apply live; no console errors.

Note: a Sanity dataset created before the locale migration has flat string
fields — run `cd studio && npm run migrate:locales` once (idempotent) or the
GROQ `coalesce` projections return null and the build fails.

## Testing

**Vitest.** Config in `vitest.config.ts` wraps Astro's `getViteConfig` so the
`astro:content` virtual module and `import.meta.env` resolve the same way they
do in `astro build`. Run with `npm test` (`vitest run`). Tests are **colocated**
as `*.test.ts` next to the module they cover (`src/**/*.test.ts`).

**Tests are mandatory.** Every change that touches testable logic ships with
tests in the same change — no exceptions. "Testable logic" = pure functions,
loaders, schema mapping, i18n helpers (anything in `src/lib/`, `src/i18n/`,
`src/content/config.ts`, and pure helpers in components). Cover the happy path,
the `en`→`de` locale fallback where relevant, and edge cases (empty input,
missing fields). Do NOT add tests for the imperative motion code in
`public/scripts/*.js` (GSAP/Lenis/WebGL) or browser/DOM/visual behavior — that
stays out of the unit suite.

Current coverage (keep it green when editing these):

- `src/i18n/index.ts` — locale helpers (`pick`, `localePath`, `altLocalePath`,
  `localeFromParams`, `localeStaticPaths`, `pageTitle`).
- `src/i18n/ui.ts` — `t()` plus a de/en key-parity guard.
- `src/lib/sanity.ts` — `imageUrl` (ref→CDN url) and `sanityFetch` (mocked
  global `fetch`; never hits the network).
- `src/lib/projects.ts` — `neighbours` wrap-around, and `getProjects` for BOTH
  backends with `./sanity` + `astro:content` mocked.
- `src/lib/site.ts` — `withDefaults` per-field merge (the loaders themselves do
  live Sanity I/O and are not unit-tested).
- `src/content/config.ts` — the project Zod schema (`safeParse`, real
  `astro:content`).
- `src/components/tweaks-panel.tsx` — `__twkIsLight` luminance check.

Mocking patterns that work here: `vi.stubEnv` + `vi.resetModules()` + dynamic
`import()` for module-level env consts (`PROJECT_ID`); `vi.mock("./sanity")`
with `sanityConfigured` as a **getter** to flip backends per test;
`vi.mock("astro:content")` for `getCollection`; `vi.stubGlobal("fetch", ...)`
for network code. The Zod-schema test uses the REAL `astro:content` (no mock).

Two source helpers are exported solely for testing: `withDefaults`
(`src/lib/site.ts`) and `__twkIsLight` (`src/components/tweaks-panel.tsx`).
Keep them exported.

## Good first tasks (in priority order)

1. **Connect Sanity.** Follow README → CMS. `cd studio && npm i`, init a project,
   set `PUBLIC_SANITY_PROJECT_ID`, `npm run import:seed`, rebuild the app.
2. **Real media.** Upload cover + gallery images in the Studio. They resolve via
   `src/lib/sanity.ts` and render through `Media.astro` automatically. For video
   use Mux/Cloudflare Stream (the hero + showreel slots).
3. **Filter tags.** `work.astro` derives discipline tags from `cat` via regex.
   Add an explicit `tags: string[]` to BOTH schemas and use it instead.
4. **Build webhook.** Sanity publish → host build hook, so content edits
   redeploy. The host (incl. Hostinger) builds from the GitHub repo; if it has
   no public build-hook URL, bridge via Sanity webhook → `repository_dispatch`
   → GitHub Action redeploy (see README → Deploy).
5. **Light-theme chrome.** Make the header/cursor `mix-blend-mode` theme-aware
   (see README caveat) if a light default ships.
6. **SEO.** Add per-page `<meta>`/OG tags and a sitemap (`@astrojs/sitemap`).

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
