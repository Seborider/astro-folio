/**
 * legal.ts — one loader for both legal-page singletons (Impressum +
 * Datenschutz). They share an identical shape and query; only the Sanity
 * _type and the built-in defaults differ, so a single factory replaces the
 * two former copy-paste files (impressum.ts / datenschutz.ts).
 */
import { sanityConfigured, sanityFetch } from "./sanity";
import { withDefaults } from "./site";
import { memoByLocale } from "./memo";
import { pageTitle, type Locale } from "../i18n";

export interface LegalPage {
  metaTitle: string;
  title: string;
  lede: string;
  body: string[]; // paragraphs; may contain <br> and <span class="dim">
}

const IMPRESSUM_DEFAULTS: Record<Locale, LegalPage> = {
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

const DATENSCHUTZ_DEFAULTS: Record<Locale, LegalPage> = {
  de: {
    metaTitle: pageTitle("Datenschutz"),
    title: "Datenschutz",
    lede: "Informationen gemäß Art. 13 DSGVO.",
    body: [
      '<span class="dim">Verantwortlicher</span><br>Sebo Mayer<br>Musterstraße 1<br>12345 Musterstadt<br>Deutschland<br>E-Mail: hello@studio.demo',
      '<span class="dim">Server-Logfiles</span> Beim Aufruf dieser Website verarbeitet der Hosting-Anbieter automatisch Zugriffsdaten (u. a. IP-Adresse, Datum und Uhrzeit, abgerufene Seite, Browsertyp). Rechtsgrundlage ist das berechtigte Interesse an einem sicheren, störungsfreien Betrieb (Art. 6 Abs. 1 lit. f DSGVO). Die Daten werden nicht mit anderen Quellen zusammengeführt.',
      '<span class="dim">Kontakt</span> Wenn Sie uns per E-Mail kontaktieren, verarbeiten wir Ihre Angaben zur Bearbeitung der Anfrage (Art. 6 Abs. 1 lit. b und f DSGVO). Die Daten werden gelöscht, sobald sie nicht mehr erforderlich sind.',
      '<span class="dim">Cookies und Tracking</span> Diese Website setzt keine Tracking- oder Marketing-Cookies und bindet keine Analyse-Tools ein. Schriftarten werden lokal vom eigenen Server ausgeliefert; es werden keine Daten an Dritte (etwa Google Fonts) übertragen. Lokal gespeicherte Einstellungen (z. B. das Farbschema) sind technisch notwendig und einwilligungsfrei (§ 25 Abs. 2 TDDDG).',
      '<span class="dim">Ihre Rechte</span> Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO). Wenden Sie sich dazu an die oben genannte Adresse.',
      "Beschwerderecht: Sie können sich bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO).",
    ],
  },
  en: {
    metaTitle: pageTitle("Privacy"),
    title: "Privacy",
    lede: "Information pursuant to Art. 13 GDPR.",
    body: [
      '<span class="dim">Controller</span><br>Sebo Mayer<br>Musterstraße 1<br>12345 Musterstadt<br>Germany<br>Email: hello@studio.demo',
      '<span class="dim">Server log files</span> When you visit this website, the hosting provider automatically processes access data (including IP address, date and time, page requested, browser type). The legal basis is the legitimate interest in secure, fault-free operation (Art. 6(1)(f) GDPR). This data is not combined with other sources.',
      '<span class="dim">Contact</span> If you contact us by email, we process your details to handle the enquiry (Art. 6(1)(b) and (f) GDPR). The data is deleted once it is no longer required.',
      '<span class="dim">Cookies and tracking</span> This website sets no tracking or marketing cookies and embeds no analytics tools. Fonts are served locally from our own server; no data is transmitted to third parties (such as Google Fonts). Locally stored preferences (e.g. the colour theme) are strictly necessary and exempt from consent (§ 25(2) TDDDG).',
      '<span class="dim">Your rights</span> You have the right to access, rectification, erasure, restriction of processing, data portability and objection (Art. 15–21 GDPR). To exercise them, contact the address above.',
      "Right to complain: you may lodge a complaint with a data protection supervisory authority (Art. 77 GDPR).",
    ],
  },
};

const legalQuery = (type: string, l: Locale) => `*[_type == "${type}"][0]{
  "metaTitle": coalesce(metaTitle.${l}, metaTitle.de),
  "title": coalesce(title.${l}, title.de),
  "lede": coalesce(lede.${l}, lede.de),
  "body": coalesce(body.${l}, body.de)
}`;

function legalLoader(
  type: "impressumPage" | "datenschutzPage",
  defaults: Record<Locale, LegalPage>,
) {
  return memoByLocale(async (locale: Locale): Promise<LegalPage> => {
    if (!sanityConfigured) return defaults[locale];
    const doc = await sanityFetch<Record<string, unknown> | null>(
      legalQuery(type, locale),
    );
    const page = withDefaults(defaults[locale], doc);
    // Studio body entries are plain textareas: an editor's Enter is a "\n"
    // that HTML would collapse to a space. Preserve it as a line break.
    return { ...page, body: page.body.map((p) => p.replace(/\r?\n/g, "<br>")) };
  });
}

export const getImpressumPage = legalLoader("impressumPage", IMPRESSUM_DEFAULTS);
export const getDatenschutzPage = legalLoader("datenschutzPage", DATENSCHUTZ_DEFAULTS);
