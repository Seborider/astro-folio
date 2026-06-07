# CLAUDE.md — working notes for Claude Code

This is an **Astro static site** (no DB, no SSR). It was migrated from a
hand-built HTML motion prototype; the animation code is intentionally plain
`<script>` files in `public/scripts/` so it stays identical to the original.

## Conventions

- **Don't convert the motion code to a framework.** GSAP/Lenis/WebGL are
  imperative and live in `public/scripts/`. Keep them as `is:inline` scripts.
- Content has **two interchangeable backends behind one loader**: pages call
  `getProjects()` from `src/lib/projects.ts`, never `getCollection` directly.
  It reads Sanity when `PUBLIC_SANITY_PROJECT_ID` is set, else the local JSON
  collection. Keep the returned `Project` shape stable — it's the contract.
- The JSON schema (`src/content/config.ts`) and the Sanity schema
  (`studio/schemaTypes/project.ts`) must stay in sync. Update BOTH when adding
  a field, and map it in the GROQ query in `src/lib/projects.ts`.
- Styling is one file, `src/styles/folio.css`, token-driven (`--bg`, `--ink`,
  `--accent`; the rest derive via `color-mix`). Reuse tokens; don't hardcode hex.
- Reveal animations are declarative: `data-reveal`, `.reveal-lines` (with
  `.line > span`), `data-scramble`. `core.js` wires them on every page.
- Internal links must start with `/` so `chrome.js` applies the wipe transition.
- Render media through `Media.astro` (shows `<img>` when a src exists, else the
  labelled placeholder) so layout is identical with or without CMS images.

## Script load order (in src/layouts/Base.astro)

GSAP → ScrollTrigger → Lenis → webgl-bg.js → chrome.js → core.js → home.js (home only)
→ React + Babel + tweaks-panel.jsx + tweaks.jsx

## Verify after changes

```bash
npm run build      # must pass; content schema is validated here
npm run preview
```

Then check: home loader → hero reveal; /work filter; /work/<slug> detail with
prev/next; the page-wipe between routes; no console errors (an in-browser Babel
notice is expected until the Tweaks panel is converted to an island).

## Good first tasks (in priority order)

1. **Connect Sanity.** Follow README → CMS. `cd studio && npm i`, init a project,
   set `PUBLIC_SANITY_PROJECT_ID`, `npm run import:seed`, rebuild the app.
2. **Real media.** Upload cover + gallery images in the Studio. They resolve via
   `src/lib/sanity.ts` and render through `Media.astro` automatically. For video
   use Mux/Cloudflare Stream (the hero + showreel slots).
3. **Tweaks → island.** `npm i @astrojs/react`, convert `tweaks.jsx` to
   `<Tweaks client:idle />`, remove the three CDN `<script>` tags in Base.
4. **Filter tags.** `work.astro` derives discipline tags from `cat` via regex.
   Add an explicit `tags: string[]` to BOTH schemas and use it instead.
5. **Build webhook.** Sanity publish → host build hook, so content edits redeploy.
6. **Light-theme chrome.** Make the header/cursor `mix-blend-mode` theme-aware
   (see README caveat) if a light default ships.
7. **SEO.** Add per-page `<meta>`/OG tags and a sitemap (`@astrojs/sitemap`).

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

New features and bugfixes ship with tests when they touch testable logic (helpers, the proxy, access control, hooks).
