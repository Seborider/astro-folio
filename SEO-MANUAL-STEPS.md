# SEO — Manual Steps

Items from the SEO audit that can't be fixed in this repo's build output alone:
Hostinger hPanel config, Sanity/CMS content, external services, and binary media
that must be produced. Each has the exact step and a copy-paste `curl` to verify
once done. (The CODE-fixable findings are already applied in the working tree.)

Production host: **sebo.zone** on Hostinger (git-based static auto-build from
`dist/`).

---

## 1. Custom 404 page  (finding #1)

Astro already emits `dist/404.html`. Apache must be told to serve it for
unmatched routes.

- **DONE in repo:** `public/.htaccess` ships `ErrorDocument 404 /404.html` (§A).
  Deploys automatically on the next push. No hPanel action needed.
- **hPanel alternative** (if you'd rather not ship `.htaccess`): hPanel →
  Websites → `sebo.zone` → **Advanced → Error Pages** → set `/404.html`.

Verify after deploy (should print the German 404 title `404 — Sebo Mayer`, HTTP 404):

```bash
curl -s https://sebo.zone/this-page-does-not-exist | grep -i '<title>'
curl -sI https://sebo.zone/this-page-does-not-exist | head -n1
```

---

## 2. www → apex 301 redirect  (finding #6)

Force `www.sebo.zone` → `sebo.zone` (matches the canonical host in
`astro.config.ts` `site`).

- **DONE in repo:** `public/.htaccess` performs the 301 (§A). Deploys on next
  push. (Requires the `www` DNS record to point at this host — set it in hPanel →
  Domains → DNS Zone if it isn't already.)
- **hPanel alternative:** hPanel → Websites → `sebo.zone` → **Advanced →
  Redirects** → permanent (301) from `www.sebo.zone` to `https://sebo.zone`.

Verify (Location must be the apex, status 301):

```bash
curl -sI https://www.sebo.zone/ | grep -iE '^(HTTP|location)'
```

---

## 3. Real Open Graph image  (finding #5)

Interim fix is live: `og:image`/`twitter:image` fall back to the shipped
`/favicon.svg` (no more 404). Replace with a designed raster card:

- Produce **`public/og.png`, 1200×630**, then in `src/layouts/Base.astro` change
  the fallback `image ?? "/favicon.svg"` back to `image ?? "/og.png"`.

Verify (200, `image/png`):

```bash
curl -sI https://sebo.zone/og.png | grep -iE '^(HTTP|content-type)'
```

---

## 4. Sprudelludi video re-encode  (findings #3 / #8)

The autoplay reel videos are now IntersectionObserver-gated (no cold-load
streaming), but the source file is still oversized.

- Re-encode the Sprudelludi clip to **single-digit MB, 16:9 (1920×1080)** H.264
  and re-upload in the Studio (reel-tile media box is pinned to `aspect-ratio:
  16/9`, so off-ratio footage re-crops).

Verify after publish + rebuild (Content-Length should be a few MB, not tens):

```bash
curl -sI "<sprudelludi video URL>" | grep -iE '^(content-type|content-length)'
```

---

## 5. Person schema — remaining fields  (schema pass)

`personSchema()` now emits `alternateName` (Sebastian Mayer-Murschall) and a
`PostalAddress` (Tittmoning / Bavaria / DE). `alumniOf` is wired but left unset —
supply the institution name and add it to the `personSchema({…})` calls in
`src/pages/[...lang]/index.astro` and `about.astro`:

```ts
alumniOf: "<school / university name>",
```

Verify (after rebuild): view-source on `https://sebo.zone/` → the `Person`
JSON-LD block contains `alumniOf`.

---

## 6. Search Console + off-site identity  (findings #6 / #7)

- **Google Search Console:** add & verify the `sebo.zone` property (DNS TXT via
  hPanel → Domains → DNS Zone, or the HTML-meta method), then submit
  `https://sebo.zone/sitemap-index.xml`.
- **Index check:** confirm coverage with `site:sebo.zone` in Google.
- **`sameAs` pins:** the Studio `siteSettings.socials` already resolve to real
  LinkedIn / GitHub / Savee URLs (verified in the built Person JSON-LD). Just
  confirm they are the intended profiles; any social left as `#` is dropped.

Verify `sameAs` after publish + rebuild:

```bash
curl -s https://sebo.zone/ | grep -o '"sameAs":\[[^]]*\]'
curl -s "https://www.google.com/search?q=site:sebo.zone" -A "Mozilla/5.0"   # or check in a browser
```

---

## 7. Production content (Sanity)  (findings #2 / #7 / #8)

Placeholder/demo content still ships from the JSON fallback and the Studio
defaults. Fill in the real content, then rebuild:

- **About `<title>`:** the role-qualified title is now the code default, but the
  live site is Sanity-backed and `aboutPage.metaTitle` overrides it (currently
  renders just `Sebo Mayer`). Set `aboutPage.metaTitle` in the Studio to
  `Über mich — Sebo Mayer, Web & Mobile Developer` (DE) /
  `About — Sebo Mayer, Web & Mobile Developer` (EN). Verify:
  `curl -s https://sebo.zone/about/ | grep -i '<title>'`.
- Homepage intro/statement copy; per-project case-study structure (overview,
  gallery, quotes) and **project dates** (`yr`).
- Real **portrait** image (About) and reel/cover media.
- **Sprudelludi**: author the EN locale fields and its meta description.
- **Location strings still reading "Copenhagen":** `siteSettings.location` (EN
  default) and `aboutPage.subMeta` (EN `( Copenhagen — est. 2014 )`) are demo
  placeholders — set them to the real location. (The hero badge itself is fixed
  in code: `( Germany )` both locales.)
- Real **contact email** (`siteSettings.email`, currently `hello@studio.demo`).
- Once real projects + contact are published, expand `public/llms.txt` with the
  actual project list and contact address.

Verify: `npm run build` then spot-check the built pages show real copy, and the
project JSON-LD `dateCreated` carries real years.

---

## A. `public/.htaccess`  (ADDED to repo — deploys on next push)

Hostinger runs Apache and honours a `.htaccess` at the web root. Astro copies
`public/` verbatim into `dist/`, so `public/.htaccess` ships to the site root.
It carries items 1, 2 and the header/cache findings; every block is wrapped in
`<IfModule>` so a missing module degrades to no-op instead of 500. Contents:

- `ErrorDocument 404 /404.html` (item 1)
- www → apex 301 (item 2)
- **Security headers:** `Strict-Transport-Security` (1y, includeSubDomains),
  `X-Content-Type-Options: nosniff`, `Content-Security-Policy: frame-ancestors
  'self'` (clickjacking only — a fuller CSP would break the inline motion
  scripts/WebGL), `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` (geolocation/camera/microphone/browsing-topics off).
- **Cache headers:** `/_astro/*` (content-hashed) → `public, max-age=31536000,
  immutable`; `/vendor/`, `/scripts/` (hand-pinned) → `public, max-age=86400,
  must-revalidate`.

Nothing to do beyond deploy. **Note:** if you ever move off Apache (e.g. an Nginx
host), this file is ignored — the rules would need porting.

Verify after deploy:

```bash
curl -sI https://sebo.zone/ | grep -iE 'strict-transport|x-content-type|content-security|referrer-policy|permissions-policy'
curl -sI https://sebo.zone/_astro/<a-real-hashed-file>.css | grep -i cache-control  # → immutable, 1y
curl -sI https://sebo.zone/vendor/gsap.min.js | grep -i cache-control              # → max-age=86400
```
