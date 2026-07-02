import { DEFAULT_LOCALE, type Locale } from "../i18n";

/**
 * Per-locale memo for build-time loaders: prod memoizes the promise per
 * locale (one fetch per locale per build); dev always reloads so Studio
 * edits show up. Replaces six hand-rolled copies of the same pattern.
 */
export function memoByLocale<T>(
  load: (locale: Locale) => Promise<T>,
): (locale?: Locale) => Promise<T> {
  const cache = new Map<Locale, Promise<T>>();
  return (locale = DEFAULT_LOCALE) => {
    if (import.meta.env.DEV) return load(locale);
    let p = cache.get(locale);
    if (!p) {
      p = load(locale);
      cache.set(locale, p);
    }
    return p;
  };
}
