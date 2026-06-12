/**
 * sanity.ts — minimal Sanity read client + image URL helper.
 * Uses the public CDN endpoint (read-only, no token needed for published docs).
 *
 * Env (set in a .env file at the Astro project root):
 *   PUBLIC_SANITY_PROJECT_ID=xxxxxxxx
 *   PUBLIC_SANITY_DATASET=production
 *
 * No SDK dependency — a single fetch keeps the build lean. If you prefer the
 * official clients, swap this for `@sanity/client` + `@sanity/image-url`.
 */
const PROJECT_ID = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const DATASET = import.meta.env.PUBLIC_SANITY_DATASET || "production";
const API_VERSION = "2024-01-01";

// The CDN host caches query results (~up to a minute after a publish) — fine
// for builds, laggy for authoring. Dev hits the uncached host instead.
const API_HOST = import.meta.env.DEV ? "api.sanity.io" : "apicdn.sanity.io";

export const sanityConfigured = Boolean(PROJECT_ID);

export async function sanityFetch<T>(query: string): Promise<T> {
  if (!PROJECT_ID)
    throw new Error(
      "Sanity is not configured (PUBLIC_SANITY_PROJECT_ID missing).",
    );
  const encoded = encodeURIComponent(query);
  const url = `https://${PROJECT_ID}.${API_HOST}/v${API_VERSION}/data/query/${DATASET}?query=${encoded}`;
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`Sanity query failed: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.result as T;
}

/**
 * Build an image CDN URL from a Sanity image asset ref.
 * `image.asset._ref` looks like: image-<id>-<w>x<h>-<ext>
 */
export function imageUrl(
  ref: string | undefined,
  opts: { w?: number; h?: number } = {},
): string | null {
  if (!ref || !PROJECT_ID) return null;
  const [, id, dims, ext] = ref.split("-");
  if (!id || !dims || !ext) return null;
  let url = `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}/${id}-${dims}.${ext}`;
  const q: string[] = ["auto=format", "fit=max"];
  if (opts.w) q.push("w=" + opts.w);
  if (opts.h) q.push("h=" + opts.h);
  return url + "?" + q.join("&");
}
