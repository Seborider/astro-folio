/**
 * datenschutz.ts — loader for the Datenschutzerklärung (privacy policy)
 * singleton, mirroring impressum.ts: read Sanity when configured, fall back to
 * the built-in per-locale defaults below otherwise. The merge is per-field
 * (withDefaults), so a half-filled Studio document still renders a complete page.
 *
 * The defaults describe THIS site honestly: a static portfolio with self-hosted
 * fonts, no cookies, no analytics, no tracking. The only personal data are the
 * server access logs kept by the host (Art. 6 Abs. 1 lit. f DSGVO) and contact
 * by email. Replace the controller block with real data before going live.
 */
import { sanityConfigured, sanityFetch } from "./sanity";
import { withDefaults } from "./site";
import { DEFAULT_LOCALE, pageTitle, type Locale } from "../i18n";

export interface DatenschutzPage {
  metaTitle: string;
  title: string;
  lede: string;
  body: string[]; // paragraphs; may contain <br> and <span class="dim">
}

const DATENSCHUTZ_DEFAULTS: Record<Locale, DatenschutzPage> = {
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

const datenschutzQuery = (l: Locale) => `*[_type == "datenschutzPage"][0]{
  "metaTitle": coalesce(metaTitle.${l}, metaTitle.de),
  "title": coalesce(title.${l}, title.de),
  "lede": coalesce(lede.${l}, lede.de),
  "body": coalesce(body.${l}, body.de)
}`;

const datenschutzCache = new Map<Locale, Promise<DatenschutzPage>>();

export function getDatenschutzPage(
  locale: Locale = DEFAULT_LOCALE,
): Promise<DatenschutzPage> {
  if (import.meta.env.DEV) return loadDatenschutzPage(locale);
  let p = datenschutzCache.get(locale);
  if (!p) {
    p = loadDatenschutzPage(locale);
    datenschutzCache.set(locale, p);
  }
  return p;
}

async function loadDatenschutzPage(locale: Locale): Promise<DatenschutzPage> {
  if (!sanityConfigured) return DATENSCHUTZ_DEFAULTS[locale];
  const doc = await sanityFetch<Record<string, unknown> | null>(
    datenschutzQuery(locale),
  );
  return withDefaults(DATENSCHUTZ_DEFAULTS[locale], doc);
}
