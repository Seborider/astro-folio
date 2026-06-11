import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  // The Tweaks panel is a React island; everything else is plain Astro.
  integrations: [react()],
  // Set this to the production URL before deploying (used for sitemap/canonical
  // and the hreflang alternates in Base.astro).
  site: "https://example.com",
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
  // Native cross-fade between pages is available via <ViewTransitions/> if you
  // prefer it over the custom wipe in /public/scripts/chrome.js (see README).
  prefetch: true,
});
