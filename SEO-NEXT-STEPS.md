# SEO — things you must do OUTSIDE this repo

The code is done: every page has a unique title + description, canonical +
hreflang (DE/EN/x-default), Open Graph + Twitter cards, JSON-LD (Person +
WebSite on home, CreativeWork per project), a sitemap, and a robots.txt.
None of that makes you *appear* in Google by itself. Below is what only you
can do — in order of impact.

---

## 1. Set your real production domain (DO THIS FIRST — blocks everything)

**Where:** `astro.config.ts`, the `site` field (currently
`"https://example.com"`).

**Why:** every absolute URL — canonical, hreflang, `og:image`, `og:url`,
JSON-LD URLs, the sitemap, and the `Sitemap:` line in robots.txt — is built
from `site`. Until it's your real domain, you're telling Google your pages
live at example.com. Change this one value and all of them become correct;
rebuild and redeploy.

```ts
site: "https://your-real-domain.com",
```

Verify after deploy: open `https://your-domain.com/robots.txt` and
`https://your-domain.com/sitemap-index.xml` in a browser — both should load
and show your real domain.

---

## 2. Create the default share image

**Where:** add a file at `public/og.png`.

**Why:** when someone shares a non-project page (home, about, work) on
LinkedIn / X / Slack / iMessage, this is the preview image. It's wired but the
file doesn't exist yet, so right now those shares point at a 404.

**Spec:** 1200 × 630 px, PNG or JPG, under ~1 MB. Put your name + role on it.
Project pages already use their own cover image automatically — this is only
the fallback for everything else.

---

## 3. Google Search Console (the single most important off-repo step)

**Where:** https://search.google.com/search-console → "Add property" → enter
your domain.

**Why:** this is how you *tell Google your site exists*, see which queries you
rank for, and find indexing problems. Without it you're invisible and blind.

Steps:
1. **Verify ownership.** Easiest for most hosts: the "Domain" property + a DNS
   TXT record (your host's DNS panel). Alternative: "URL prefix" property +
   upload an HTML file or add a `<meta>` tag (drop it into `Base.astro`'s
   `<head>` if you go that route).
2. **Submit your sitemap.** Sidebar → "Sitemaps" → enter `sitemap-index.xml` →
   Submit.
3. **Request indexing** for your home URL: top search bar → paste the URL →
   "Request Indexing". (Optional; the sitemap covers the rest.)

---

## 4. Bing Webmaster Tools (5 minutes, do it once)

**Where:** https://www.bing.com/webmasters

**Why:** Bing also powers DuckDuckGo and others, and it can **import
everything from Google Search Console** in one click — so verification +
sitemap submission is nearly free once GSC is set up.

---

## 5. Fill in good content per project (this is what you control daily)

Each project page's SEO is built from CMS/content fields. Make them count:

- **Project name** → becomes the `<title>` ("Name — Sebo Mayer") and the
  CreativeWork name. Make it descriptive, not a codename.
- **`intro`** → becomes the meta description AND the CreativeWork description.
  Write 1 clear sentence, ~110–160 characters, describing what the project is
  and your role. This is the snippet Google shows.
- **`cover`** → becomes the project's social share image. Upload a real one
  (ideally ~1200×630-ish) in the Studio.
- **`yr`** → becomes `dateCreated`.

Also worth doing in the Studio:
- **Add your GitHub** (and any other profiles) to site settings → socials.
  Those feed `Person.sameAs` in the home JSON-LD, which is how Google links
  this site to your identity across the web. You currently have LinkedIn +
  Savee; a developer profile really wants GitHub.
- **Fix the home title/description match** if you change roles — they should
  agree (both now say "Web & Mobile Developer").

Optional self-check: paste any page URL into
https://search.google.com/test/rich-results to confirm the JSON-LD parses,
and into https://www.opengraph.xyz to preview the share card.

---

## Realistic expectations

**Timeline.** After you submit the sitemap, indexing typically takes **a few
days to a few weeks**, sometimes longer for a brand-new domain with no
history. There is no button that makes it instant. A new site with zero
backlinks can take a month+ to show up for anything but your own name.

**What this repo work actually does:** it removes the *technical* reasons
Google might ignore or misread your pages — duplicate URLs, missing
descriptions, wrong language targeting, unparseable structure, undiscoverable
pages. This is table stakes, not an advantage. It gets you *eligible*.

**What actually moves rankings (and is NOT code):**
- **Content** — real, specific, text-rich pages. Google ranks words; a
  portfolio that's mostly images and motion has little for it to read. Your
  project `intro`/`overview` text matters more than any meta tag.
- **Backlinks** — other reputable sites linking to you (your LinkedIn, dribbble
  /awwwards profiles, clients, directories, articles). This is the single
  biggest ranking factor and it's earned, not coded.
- **Performance & Core Web Vitals** — load speed and visual stability. Your
  heavy GSAP/WebGL/large covers can hurt here; test at
  https://pagespeed.web.dev and watch the "Core Web Vitals" report in Search
  Console.

**What you cannot control:** the actual ranking position, whether Google shows
your rich results, and how fast it crawls. You influence these; you don't set
them.

**Don't expect** to outrank your name twins or industry sites quickly. Realistic
first win: ranking #1 for **"Sebo Mayer"** (your own name) within a few weeks.
Generic terms like "web developer copenhagen" are a long game of content +
backlinks.
