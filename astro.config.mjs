// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  // Set this to the production URL before deploying (used for sitemap/canonical).
  site: "https://example.com",
  // Fully static output — no server/database required.
  output: "static",
  // Native cross-fade between pages is available via <ViewTransitions/> if you
  // prefer it over the custom wipe in /public/scripts/chrome.js (see README).
  prefetch: true,
});
