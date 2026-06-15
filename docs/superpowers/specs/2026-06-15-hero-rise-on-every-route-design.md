# Hero rise on every route — design

## Problem

The page hero (title `[data-rise]` + lede/meta `[data-rise-soft]`) animates up
from below (`yPercent: 110 → 0`) — the bottom-to-top rise visible on the home
page's first load. But that rise only plays on **cold loads and refreshes**.

When navigating **between** pages, modern browsers use a cross-document View
Transition (`@view-transition` in `folio.css`): the whole new page rises in via
`vtRiseIn` (`translateY(100%) → 0`, 1s). To avoid a compound "loading twice"
motion, `core.js` deliberately shows the hero already settled on those arrivals
(`revealHero(true)`, instant). The result: the hero rise is missing on exactly
the in-site navigation where you'd expect it.

(On older browsers without View Transitions, navigation uses the `chrome.js` JS
wipe; there `viaVT` is `false`, so the hero already rises normally. No change
needed there.)

## Goal

Play the hero rise on **every** route entrance. On View-Transition browsers the
rise should sequence **after** the page-wipe clears, so it reads as the page's
own entrance rather than doubling with `vtRiseIn`.

## Approach

Hook the View Transition's `finished` promise rather than guessing a delay. The
inbound page receives a `pagereveal` event exposing `event.viewTransition`,
whose `.finished` promise resolves exactly when `vtRiseIn` completes. Trigger the
hero rise off that.

This is robust because the inline body scripts run during parse — before
`pagereveal` fires — so a listener registered at boot reliably catches the event.
View-Transition support implies `pagereveal`, so no fallback timer is needed for
the `viaVT` case. A hardcoded `setTimeout` was rejected: it silently desyncs if
the CSS transition timing changes.

## Changes

All changes are in the plain motion scripts (`public/scripts/`); no framework or
schema changes.

### 1. Always arm the hidden state — `core.js` (~line 213)

Change the guard from `if (!reduce && !viaVT)` to `if (!reduce)` so
`[data-rise]`/`[data-rise-soft]` start below even on a View-Transition arrival.
This runs at parse time, so the page-transition snapshot captures the hero
already hidden — it rides up empty with the page, then the title rises in
afterward (clean sequential motion, no double-rise).

### 2. New shared entrance scheduler — `core.js`

Add `window.__revealHeroEntrance()` that centralizes the entrance decision:

- `viaVT` → register a one-shot `pagereveal` listener; on fire,
  `event.viewTransition.finished.finally(() => revealHero())` (animated). If the
  event has no `viewTransition` (transition skipped), fall back to
  `requestAnimationFrame(() => revealHero())`.
- not `viaVT` → `requestAnimationFrame(() => revealHero())` (unchanged cold-load
  / JS-wipe behavior).
- Reduced motion remains handled inside `revealHero` (instant); no special case
  needed in the scheduler.

### 3. Wire the three call sites

- **`core.js` boot (lines 314–315, non-home):** replace the
  `if (viaVT) revealHero(true) / else requestAnimationFrame(revealHero)` block
  with `window.__revealHeroEntrance()`.
- **`home.js` `seen` path (line 38):** replace `revealHero(window.__viaVT)` with
  `window.__revealHeroEntrance()` — VT navigations to home now rise after the
  transition; a plain refresh (not `viaVT`) still rises immediately.
- **`home.js` first-visit `startSite` (line 22) and reduced-motion path
  (line 33):** unchanged — both are cold loads (not `viaVT`) and already
  animate.

## Behavior matrix (after change)

| Entrance | `viaVT` | Result |
|---|---|---|
| Cold load / refresh, VT browser | false | rise (rAF) — unchanged |
| Cold load, non-VT browser | false | rise (rAF) — unchanged |
| In-site nav, VT browser | true | **rise after `vtRiseIn` finishes — new** |
| In-site nav, JS wipe (non-VT) | false | rise (rAF) — unchanged |
| Home first visit (loader) | false | rise after loader — unchanged |
| Home revisit refresh | false | rise — unchanged |
| Home in-site nav, VT browser | true | **rise after transition — new** |
| Reduced motion | any | instant (inside `revealHero`) — unchanged |

## Tunable

The rise starts only once the 1s VT fully finishes, so the total entrance is
≈ VT (1s) + rise. If that feels sluggish we can shorten the VT duration or start
the rise slightly before `finished`. For now we honor "after the wipe clears".

## Verification

`npm run build` passes, then `npm run preview` and check in BOTH locales
(`/` and `/en/...`):

- Hero rises on cold load / refresh of every route (regression check).
- Navigating between routes (`/` ↔ `/work` ↔ `/work/<slug>` ↔ `/about` ↔
  `/archive`) shows the hero rise after the page-wipe clears, with no
  double-rise or flash of the title in its final position.
- EN/DE switcher in the header also produces the post-wipe rise.
- Reduced motion: hero appears instantly, no errors.
- No console errors.
