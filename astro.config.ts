import { defineConfig, passthroughImageService } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  // sitemap emits sitemap-index.xml at build with hreflang alternates; DE is
  // the unprefixed default, EN lives under /en/ (mirrors the i18n block below).
  integrations: [
    // Sitemap follows the top-level trailingSlash:"always" below, so its URLs
    // equal the canonical trailing-slash URLs (no 3xx on submitted URLs).
    sitemap({
      i18n: {
        defaultLocale: "de",
        locales: { de: "de-DE", en: "en-GB" },
      },
    }),
  ],
  // Set this to the production URL before deploying (used for sitemap/canonical
  // and the hreflang alternates in Base.astro).
  site: "https://sebo.zone",
  // DE is the default locale at "/", EN lives under "/en/". Routing is done
  // by src/pages/[...lang]/ + src/i18n helpers; this block documents intent
  // and enables Astro.currentLocale / future @astrojs/sitemap i18n support.
  i18n: {
    defaultLocale: "de",
    locales: ["de", "en"],
    routing: { prefixDefaultLocale: false },
  },
  // Fully static output — no server/database required.
  output: "static",
  // Every route serves at its trailing-slash URL (directory build format emits
  // /work/index.html → /work/). Canonical, hreflang and internal links are all
  // built with a trailing slash (src/i18n) so they resolve 200 with no redirect.
  trailingSlash: "always",
  // No Astro image processing: Media.astro renders raw <img>/<video> URLs
  // (Sanity CDN or local paths). The passthrough service skips Sharp so the
  // build needs no native image dependency. Switch to the default Sharp
  // service if you adopt astro:assets <Image>.
  image: { service: passthroughImageService() },
  // Native cross-fade between pages is available via <ViewTransitions/> if you
  // prefer it over the custom wipe in /public/scripts/chrome.js (see README).
  prefetch: { prefetchAll: true },
});
