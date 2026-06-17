# Astro 4 → 6 Upgrade Plan

> **Status: EXECUTED (2026-06-16).** Both steps applied. On Astro **6.4.7**,
> @astrojs/react **5.0.7**, React **18.3.1** (unchanged), Vitest **4.1.9**.
> `npm test` (71/71) and `npm run build` pass; `npm run preview` serves both
> locales (200, correct `lang`). Audit went **12 → 4** (1 critical + 8 moderate
> cleared). See **Execution notes** at the bottom for two deviations from the
> original plan and the residual advisory.

This is a **two-major jump (4 → 5 → 6)**. Astro recommends upgrading one major
at a time, verifying in between. Sources used (not memory):
[Astro v5 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v5/),
[Astro v6 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v6/),
[@astrojs/react integration](https://docs.astro.build/en/guides/integrations-guide/react/),
plus npm peer-dependency data.

## Current state (verified)

| Package | Current | Notes |
|---|---|---|
| astro | 4.16.19 | `output: "static"`, i18n, `prefetch: true` |
| @astrojs/react | 3.6.3 | one island (`Tweaks.tsx`) |
| react / react-dom | 18.3.1 | |
| @types/react / -dom | 18.3.31 / 18.3.7 | |
| vitest | 2.1.9 | wraps Astro's `getViteConfig` |
| Node (local) | v24.6.0 | meets v6's ≥22.12 floor |

The local content collection is a **`type: "data"` collection**: 14 JSON files
in `src/content/projects/`, read via `getCollection("projects")` in
`src/lib/projects.ts`. The loader already uses `entry.id` (not the removed
`entry.slug`) and already sorts by `order`. `src/env.d.ts` already references
`.astro/types.d.ts`. These reduce migration friction (see impact list).

---

## Version steps & matching integration versions

### Step A — Astro 4 → 5

| Package | From | To | Why |
|---|---|---|---|
| astro | ^4.16 | **^5** (latest 5.18.2) | major 1 |
| @astrojs/react | ^3.6 | **^4** (4.4.2) | `@astrojs/react@4` is built for Astro 5 (its `astro` devDep is 5.15.4). v3 pairs with Astro 4. |
| react / react-dom | 18.3.1 | **unchanged** | `@astrojs/react@4` peer is `^17 \|\| ^18 \|\| ^19` — React 18 stays valid. |
| @types/react / -dom | 18.x | **unchanged** | peer accepts 18. |
| vitest | ^2.1 | **^4** (4.1.9) | Astro 5 ships **Vite 6**; Vitest 2 only supports Vite 5, so the `getViteConfig` wrapper breaks. Vitest 4 supports Vite 6/7/8 — covers both Step A and Step B, and is the version that clears the critical `vitest` advisory (vuln is `<=3.2.5`). |

### Step B — Astro 5 → 6

| Package | From | To | Why |
|---|---|---|---|
| astro | ^5 | **^6** (6.4.7) | major 2 |
| @astrojs/react | ^4 | **^5** (5.0.7) | `@astrojs/react@5` is built for Astro 6 (its `astro` devDep is 6.4.3). |
| react / react-dom | 18.3.1 | **unchanged** | `@astrojs/react@5` peer still `^17 \|\| ^18 \|\| ^19`. **No forced React 19 bump.** |
| vitest | ^4 | **unchanged** | already Vite 7-capable from Step A. |
| Node | — | **≥ 22.12.0** | v6 hard requirement (drops 18 & 20). Local is fine; **update CI/host runtime + any `.nvmrc`/`engines`**. |

> **Minimum Astro 5.x before going to 6:** be on a recent 5.x (use the latest,
> 5.18.2) before the v6 bump — the v6 guide assumes you have already adopted the
> Content Layer API and Vite 6 from v5.

---

## Breaking changes that touch THIS repo

Only changes with an actual impact here are listed. Each cites its guide section.

### Astro 5

1. **Content Layer API / legacy collections** — *v5 guide → "Content Collections"*.
   `type: "data"`/`"content"` collections become loader-based. The config file's
   conventional path moves to `src/content.config.ts`, and `glob()`/`file()`
   loaders replace `type`. **Impact:** `src/content/config.ts` must adopt the
   `glob()` loader (one JSON per project → `glob`). Alternatively the
   `legacy.collections` flag defers this, but v6 removes that escape hatch, so we
   migrate now rather than twice.
2. **Vite 6** — *v5 guide → "Upgrade Dependencies"*. Forces the **Vitest bump**
   (see risks). This is the single biggest mechanical risk in Step A.
3. **`ViewTransitions` renamed to `ClientRouter`** — *v5 guide → "Renamed:
   ViewTransitions"*. The repo does **not** use it functionally; only a comment
   in `public/scripts/chrome.js` mentions `<ViewTransitions/>`. Optional doc fix.
4. **`security.checkOrigin` defaults to `true`** — *v5 guide → "Changed default:
   CSRF protection"*. Only affects on-demand/form routes. This is `output:
   "static"` → **no functional impact**; noted for completeness.
5. **TypeScript types move to `.astro/types.d.ts`** — *v5 guide → "Changed:
   TypeScript configuration"*. **Already done** — `src/env.d.ts` references it.

### Astro 6

6. **Legacy Content Collections removed; config rename required** — *v6 guide →
   "Content Collections"*. `src/content/config.ts` **must** be `src/content.config.ts`,
   and **all** collections must define a `loader`. (Handled in Step A item 1.)
7. **Zod imported from `astro/zod`, not `astro:content`; `astro:schema` removed** —
   *v6 guide → "astro:content / Zod"*. **Impact:** the `z` import in the content
   config changes. Astro also upgrades to **Zod 4** — the schema here
   (`z.object/string/number/array/enum/.optional()`) uses only stable APIs, low
   risk, but re-verify the `localized()` generic helper compiles under Zod 4.
8. **`entry.slug` → `entry.id`; `entry.render()` → `render(entry)`** — *v6 guide
   → "Entry API"*. **No impact** — loader already uses `entry.id`, and this is a
   data collection with no `render()` call.
9. **Node ≥ 22.12, Vite 7 (Environments API)** — *v6 guide → "Requirements"*.
   Vite 7 again flows through the `getViteConfig` wrapper (covered by Vitest 4).
10. **`i18n.routing.redirectToDefaultLocale` now defaults to `false`** — *v6
    guide → "i18n routing"*. The config sets `prefixDefaultLocale: false` and does
    not set `redirectToDefaultLocale`; static output with custom routing under
    `src/pages/[...lang]/`. **Verify** route output is unchanged; minimal impact.
11. **`getStaticPaths()` params cannot be numeric (must be strings)** — *v6 guide
    → "Routing"*. `localeStaticPaths()` returns `{ lang: undefined | "en" }`
    (string/undefined). **Compliant** — no change needed.
12. **`import.meta.env` always inlined; non-public vars don't fall back to
    `process.env`** — *v6 guide → "Environment"*. `src/lib/sanity.ts` reads only
    `PUBLIC_`-prefixed vars + `import.meta.env.DEV`, which stay inlined. **No
    impact**, but re-verify the Sanity branch builds with envs set.
13. **`Astro.glob()` removed, `prefetch()` option removed, ClientRouter
    `handleForms` removed, adapter/actions/transitions API removals** — *v6 guide
    → "Removed APIs"*. **None used here.** `prefetch: true` in config is the
    config flag (still valid), not the removed `prefetch()` call.

---

## File-by-file impact

| File | Step | Impact | Detail |
|---|---|---|---|
| `src/content/config.ts` | A (then rename in B) | **HIGH** | Rename to `src/content.config.ts`; replace `type: "data"` with a `glob()` loader (`glob({ pattern: "**/*.json", base: "./src/content/projects" })`) carrying the existing `schema`. In Step B, change `z` import from `astro:content` to `astro/zod`. Verify against Zod 4. |
| `vitest.config.ts` | A | **HIGH (risk)** | No code change expected, but its `getViteConfig` output is Vite 6 (A) then Vite 7 (B). Must land **with** the Vitest 4 bump or the test run breaks. Re-run full suite immediately after. |
| `astro.config.ts` | A & B | **LOW–MED** | Review `i18n.routing` against the `redirectToDefaultLocale` default change (item 10); confirm `prefetch: true` and `output: "static"` still valid (they are). Likely no edits. |
| `src/lib/projects.ts` | A/B | **LOW** | `getCollection("projects")` + `entry.id` + `.data` survive Content Layer; keeps the `.sort((a,b)=>a.order-b.order)` (loader order is non-deterministic, so the sort stays load-bearing). Confirm the returned-type now-includes-`undefined` change doesn't break typing. The `Project` contract is unchanged. |
| `src/lib/projects.test.ts` | A | **LOW** | Mocks `astro:content` `getCollection` — keep as-is; just confirm it passes under Vitest 4 (mocking API parity). |
| `src/lib/sanity.ts` | B | **LOW** | `PUBLIC_*` + `import.meta.env.DEV` only; inlining change is a no-op here. Re-verify with envs set. |
| `src/pages/[...lang]/**` | B | **LOW** | `getStaticPaths` via `localeStaticPaths()` already returns string/undefined params — compliant. Route params auto-decode removal (v5) is moot (ASCII slugs). |
| `src/env.d.ts` | A | **NONE** | Already points at `.astro/types.d.ts`. |
| `public/scripts/chrome.js` | A | **TRIVIAL/OPTIONAL** | Comment references `<ViewTransitions/>`; update to `<ClientRouter/>` for accuracy. No runtime effect (motion code is the custom wipe, not Astro transitions). |
| `tsconfig.json` | A | **NONE expected** | Extends `astro/tsconfigs/strict`; verify after `astro sync`. |

---

## Risk callouts

- **Content Layer API (collections) — highest design risk.** The `type: "data"`
  → `glob()` loader migration changes how entries are produced. Verify after
  migration: `entry.id` still equals the filename slug (drives `/work/<slug>` and
  prev/next), all 14 JSON files load, and the Zod schema still validates at build.
  The `getProjects` JSON branch and its tests are the canary.
- **Vitest `getViteConfig` wrapper — highest mechanical risk.** `vitest.config.ts`
  inherits Astro's Vite version through `getViteConfig`. Vite 5→6 (Step A) and
  6→7 (Step B) each can break Vitest if versions drift. Bump Vitest to 4 **in the
  same commit** as the Astro 5 bump; do not split them. Watch for changed
  `vi.mock`/`vi.stubEnv`/`vi.stubGlobal` behavior used across the suite.
- **Sanity-vs-JSON loader contract.** The whole point of `src/lib/projects.ts` is
  one stable `Project` shape across both backends. Neither Astro upgrade touches
  the Sanity branch (plain `fetch`), but the JSON branch rides the Content Layer
  change — so after each step, verify **both** backends still return the identical
  flat shape (run with and without `PUBLIC_SANITY_PROJECT_ID`).
- **Two majors, executed separately.** Land Step A, get green, commit; then Step
  B. Do not collapse them — it makes regressions impossible to bisect.
- **Node runtime.** v6 needs ≥22.12 on CI and the host (Hostinger build), not just
  locally. Update `engines`/`.nvmrc`/CI image before the Step B build runs there.

---

## Verification checklist (run after Step A, then again after Step B)

```bash
npx astro sync     # regenerate content + env types after the upgrade
npm test           # Vitest — all 71 tests must pass (watch the projects.ts suite)
npm run build      # validates the content schema; must pass
npm run preview    # serve the static output
npm audit          # confirm vuln count drops (target: 0 after Step B)
```

Then manually check, in **BOTH** locales (`/` and `/en/...`):

- [ ] Home loader → hero reveal animation fires.
- [ ] `/work` filter works; tags render.
- [ ] `/work/<slug>` detail renders with correct prev/next (wrap-around).
- [ ] Page-wipe transition between routes (custom `chrome.js`), including the
      EN/DE switcher in the header.
- [ ] Tweaks panel (bottom-right) opens; live color changes apply.
- [ ] No console errors.
- [ ] If Sanity is configured: rebuild with `PUBLIC_SANITY_PROJECT_ID` set and
      confirm the Sanity branch returns the same `Project` shape.

**Done when:** both upgrade steps are committed, `npm test` + `npm run build` +
`npm run preview` pass, the manual checklist is green in both locales, and
`npm audit` reports 0 vulnerabilities.

---

## Execution notes (what actually happened)

Two deviations from the plan above, plus one residual item:

1. **Sharp build failure → passthrough image service (not in the original plan).**
   Astro 5 makes Sharp the default image service (Squoosh removed). The build
   failed with `Rollup failed to resolve import "sharp"`. The site does **no**
   Astro image processing (`Media.astro` renders raw `<img>`/`<video>` URLs; no
   `astro:assets`/`<Image>`/`getImage` anywhere), so instead of adding the heavy
   native `sharp` dependency we set the no-op service in `astro.config.ts`:
   `image: { service: passthroughImageService() }`. Switch to Sharp if
   `astro:assets` is adopted later.

2. **Content config edits landed as planned.** `src/content/config.ts` →
   `src/content.config.ts` with a `glob()` loader (Step A); `z` now imported
   from `astro/zod` (Step B). The colocated test moved to
   `src/content.config.test.ts`. `entry.id` already matched filenames, so slugs
   and `/work/<slug>` URLs are unchanged.

3. **Residual: 4 high advisories remain — upstream-blocked, not fixable now.**
   All four chain to a single transitive **esbuild** advisory
   ([GHSA-gv7w-rqvm-qjhr](https://github.com/advisories/GHSA-gv7w-rqvm-qjhr),
   fixed in esbuild 0.28.1) pulled in via **Vite 7.3.5**, which pins
   `esbuild: ^0.27.0` — a range that excludes 0.28.x. We are already on the
   latest Astro 6 / Vite 7 / esbuild 0.27.7. Forcing `esbuild@0.28.1` via npm
   `overrides` would push it outside Vite's declared range (esbuild minors can
   break) and is **not** done. This advisory is a **dev/build-tool** issue (Deno
   install path / dev server), not present in the shipped static HTML.
   `npm audit fix --force` suggests bogus downgrades (astro@2.4.5) — do **not**
   run it. Resolution is to bump Vite when it adopts esbuild 0.28.1.

**Still requires manual browser verification** (visual/DOM, outside the unit
suite): hero reveal, `/work` filter, page-wipe transition + EN/DE switcher,
Tweaks panel live colour changes, and zero console errors — in both locales.
