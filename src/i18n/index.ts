/**
 * i18n — locale core for the DE-default / EN-prefixed URL scheme.
 *
 *   /            → de (default, no prefix)
 *   /en/...      → en
 *
 * Content fields are stored as { de, en? } objects in BOTH backends
 * (Sanity locale objects and the local JSON collection); `pick()` is the
 * JSON twin of the GROQ `coalesce(field.en, field.de)` fallback.
 */
export const LOCALES = ["de", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "de";

/** Brand name — identical in every locale, so a shared constant, not a dict entry. */
export const BRAND = "Sebo Mayer";
/** Hero <h1>, one rising line per word. */
export const BRAND_LINES = ["Sebo", "Mayer"] as const;
/** Compose a document title as "<name> — <brand>". */
export const pageTitle = (name: string): string => `${name} — ${BRAND}`;

export type Localized<T> = { de: T; en?: T };

/** The other of the two locales. */
export const otherLocale = (l: Locale): Locale => (l === "de" ? "en" : "de");

/** Resolve a localized value with DE fallback — never empty. */
export function pick<T>(v: Localized<T>, locale: Locale): T {
  return v[locale] ?? v.de;
}

/**
 * The alternate-locale value to stamp on an element for the in-place locale
 * swap (public/scripts/i18n.js). Returns `alt` only when it differs from the
 * rendered `primary` — identical strings (common: project names, years) get
 * `undefined` so templates omit the `data-i18n-alt` attribute entirely.
 */
export const altOf = (primary: string, alt: string): string | undefined =>
  primary === alt ? undefined : alt;

/** Prefix an internal path for a locale. Always starts with "/" (chrome.js wipe). */
export function localePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === "/" ? "/en" : `/en${path}`;
}

/** Drop trailing slashes (keep root "/") so build-time and client paths compare equal. */
export const stripTrailingSlash = (path: string): string =>
  path.length > 1 ? path.replace(/\/+$/, "") : path;

/**
 * The same page in the OTHER locale — for the header switcher and hreflang.
 * Normalizes a trailing slash first (build-time Astro.url.pathname may carry
 * one; chrome.js compares location.pathname raw).
 */
export function altLocalePath(locale: Locale, pathname: string): string {
  const clean = stripTrailingSlash(pathname);
  if (locale === "en") {
    if (clean === "/en") return "/";
    return clean.startsWith("/en/") ? clean.slice(3) : clean;
  }
  return localePath("en", clean);
}

/** getStaticPaths entries for static pages under src/pages/[...lang]/. */
export function localeStaticPaths() {
  return LOCALES.map((locale) => ({
    params: { lang: locale === DEFAULT_LOCALE ? undefined : locale },
    props: { locale },
  }));
}
