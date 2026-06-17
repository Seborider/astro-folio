/**
 * impressum.ts — loader for the Impressum (legal notice) singleton, mirroring
 * the site.ts pattern: read Sanity when configured, fall back to the built-in
 * per-locale defaults below otherwise. The merge is per-field (withDefaults),
 * so a half-filled Studio document still renders a complete page.
 *
 * Localization: text fields are locale objects in the Studio; the query
 * coalesces(field.<locale>, field.de). The defaults are authored per locale.
 */
import { sanityConfigured, sanityFetch } from "./sanity";
import { withDefaults } from "./site";
import { DEFAULT_LOCALE, pageTitle, type Locale } from "../i18n";

export interface ImpressumPage {
  metaTitle: string;
  title: string;
  lede: string;
  body: string[]; // paragraphs; may contain <br> and <span class="dim">
}

const IMPRESSUM_DEFAULTS: Record<Locale, ImpressumPage> = {
  de: {
    metaTitle: pageTitle("Impressum"),
    title: "Impressum",
    lede: "Angaben gemäß § 5 DDG.",
    body: [
      'Sebo Mayer<br>Musterstraße 1<br>12345 Musterstadt<br>Deutschland',
      '<span class="dim">Kontakt</span><br>E-Mail: hello@studio.demo',
      '<span class="dim">Verantwortlich für den Inhalt</span> nach § 18 Abs. 2 MStV: Sebo Mayer, Anschrift wie oben.',
      "Plattform der EU-Kommission zur Online-Streitbeilegung: https://ec.europa.eu/consumers/odr",
    ],
  },
  en: {
    metaTitle: pageTitle("Legal notice"),
    title: "Legal notice",
    lede: "Information pursuant to § 5 DDG.",
    body: [
      'Sebo Mayer<br>Musterstraße 1<br>12345 Musterstadt<br>Germany',
      '<span class="dim">Contact</span><br>Email: hello@studio.demo',
      '<span class="dim">Responsible for the content</span> pursuant to § 18 (2) MStV: Sebo Mayer, address as above.',
      "EU Commission online dispute resolution platform: https://ec.europa.eu/consumers/odr",
    ],
  },
};

const impressumQuery = (l: Locale) => `*[_type == "impressumPage"][0]{
  "metaTitle": coalesce(metaTitle.${l}, metaTitle.de),
  "title": coalesce(title.${l}, title.de),
  "lede": coalesce(lede.${l}, lede.de),
  "body": coalesce(body.${l}, body.de)
}`;

const impressumCache = new Map<Locale, Promise<ImpressumPage>>();

export function getImpressumPage(
  locale: Locale = DEFAULT_LOCALE,
): Promise<ImpressumPage> {
  if (import.meta.env.DEV) return loadImpressumPage(locale);
  let p = impressumCache.get(locale);
  if (!p) {
    p = loadImpressumPage(locale);
    impressumCache.set(locale, p);
  }
  return p;
}

async function loadImpressumPage(locale: Locale): Promise<ImpressumPage> {
  if (!sanityConfigured) return IMPRESSUM_DEFAULTS[locale];
  const doc = await sanityFetch<Record<string, unknown> | null>(
    impressumQuery(locale),
  );
  return withDefaults(IMPRESSUM_DEFAULTS[locale], doc);
}
