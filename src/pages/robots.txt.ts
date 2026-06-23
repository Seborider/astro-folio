/**
 * robots.txt — generated at build so the Sitemap line tracks `site` in
 * astro.config.ts (no hardcoded domain to drift). Allows all crawling and
 * points bots at the sitemap @astrojs/sitemap emits.
 */
import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL("sitemap-index.xml", site).href;
  const body = `User-agent: *
Allow: /

Sitemap: ${sitemap}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain" } });
};
