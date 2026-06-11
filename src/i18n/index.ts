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

export type Localized<T> = { de: T; en?: T };

/** Resolve a localized value with DE fallback — never empty. */
export function pick<T>(v: Localized<T>, locale: Locale): T {
  return v[locale] ?? v.de;
}

/** Prefix an internal path for a locale. Always starts with "/" (chrome.js wipe). */
export function localePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === "/" ? "/en" : `/en${path}`;
}

/**
 * The same page in the OTHER locale — for the header switcher and hreflang.
 * Normalizes a trailing slash first (build-time Astro.url.pathname may carry
 * one; chrome.js compares location.pathname raw).
 */
export function altLocalePath(locale: Locale, pathname: string): string {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (locale === "en") {
    if (clean === "/en") return "/";
    return clean.startsWith("/en/") ? clean.slice(3) : clean;
  }
  return localePath("en", clean);
}

/** Map the [...lang] route param to a locale. undefined = root = DE. */
export function localeFromParams(lang: string | undefined): Locale {
  if (lang === undefined) return DEFAULT_LOCALE;
  if (lang === "en") return "en";
  throw new Error(`Unknown locale segment: ${lang}`);
}

/** getStaticPaths entries for static pages under src/pages/[...lang]/. */
export function localeStaticPaths() {
  return LOCALES.map((locale) => ({
    params: { lang: locale === DEFAULT_LOCALE ? undefined : locale },
    props: { locale },
  }));
}
