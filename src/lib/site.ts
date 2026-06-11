/**
 * site.ts — loaders for the singleton documents (siteSettings, aboutPage),
 * mirroring the projects.ts pattern: read Sanity when configured, fall back
 * to the built-in defaults below otherwise. The merge is per-field, so a
 * half-filled Studio document still renders a complete page.
 *
 * Localization: text fields are locale objects in the Studio; the queries
 * coalesce(field.<locale>, field.de). The defaults are authored per locale
 * below — DE prose is currently an EN duplicate pending real translation.
 */
import { sanityConfigured, sanityFetch, imageUrl } from "./sanity";
import { DEFAULT_LOCALE, type Locale } from "../i18n";

export interface SocialLink {
  label: string;
  url: string;
}

export interface SiteSettings {
  headerMark: string;
  email: string;
  contactLabel: string;
  contactCta: string;
  socials: SocialLink[];
  archiveHeading: string;
  location: string;
  timezoneLabel: string;
  copyright: string;
  colophon: string;
  footerNote: string;
}

export interface AboutRow {
  title: string;
  detail: string;
}

export interface AboutPage {
  metaTitle: string;
  title: string;
  lede: string;
  subMeta: string;
  introQuote: string[]; // lines; may contain <em>
  bio: string[]; // paragraphs; may contain <span class="dim">
  portrait: string | null; // resolved CDN url, or null for the placeholder
  portraitCaption: string;
  portraitYear: string;
  capabilitiesHeading: string;
  capabilities: AboutRow[];
  recognitionHeading: string;
  recognition: AboutRow[];
}

const SITE_DEFAULTS_EN: SiteSettings = {
  headerMark: "Juno Vestergaard ©",
  email: "hello@studio.demo",
  contactLabel: "( Reach out )",
  contactCta: "Say hello ↗",
  socials: [
    { label: "Instagram ↗", url: "#" },
    { label: "LinkedIn ↗", url: "#" },
    { label: "Savee ↗", url: "#" },
  ],
  archiveHeading: "Archive",
  location: "Copenhagen",
  timezoneLabel: "UTC+1",
  copyright: "© 2026 — Neutral demo, all placeholders",
  colophon: "Built with Astro · GSAP · Lenis · WebGL",
  footerNote: "Recreation study",
};

const SITE_DEFAULTS: Record<Locale, SiteSettings> = {
  en: SITE_DEFAULTS_EN,
  de: {
    ...SITE_DEFAULTS_EN,
    contactLabel: "( Kontakt )",
    contactCta: "Sag hallo ↗",
    archiveHeading: "Archiv",
    location: "Kopenhagen",
    copyright: "© 2026 — Neutrale Demo, alles Platzhalter",
    footerNote: "Rekonstruktionsstudie",
  },
};

const ABOUT_DEFAULTS_EN: AboutPage = {
  metaTitle: "About — Juno Vestergaard",
  title: "About",
  lede: "Design & art director working between brand, motion and the printed page.",
  subMeta: "( Copenhagen — est. 2014 )",
  introQuote: ["I shape the space", "between images,", "where rhythm turns", "to <em>meaning</em>."],
  bio: [
    "Juno Vestergaard is a Copenhagen-based design and art director with a decade of practice spanning identity systems, motion, and editorial. The work is led by typography and pacing — treating a brand less as a logo and more as a tempo that recurs across every surface.",
    '<span class="dim">Previously</span> design lead at a Scandinavian studio and an independent for cultural institutions, fashion houses and technology brands. Current focus: long-form brand worlds and the moving image.',
    '<span class="dim">Approach</span> — slow looking, sharp type, generous white space, and the conviction that restraint is its own kind of noise.',
  ],
  portrait: null,
  portraitCaption: "Studio, Vesterbro",
  portraitYear: "2026",
  capabilitiesHeading: "Capabilities",
  capabilities: [
    { title: "Brand systems", detail: "Identity, naming, voice, guidelines, rollout" },
    { title: "Art direction", detail: "Campaigns, photography, casting, set" },
    { title: "Motion", detail: "Title design, brand films, sound partners" },
    { title: "Editorial", detail: "Books, catalogues, type design, print craft" },
    { title: "Digital", detail: "Sites, WebGL, prototypes with dev partners" },
  ],
  recognitionHeading: "Recognition",
  recognition: [
    { title: "Awwwards", detail: "Site of the Day × 3, Developer Award" },
    { title: "D&AD", detail: "Wood Pencil, Branding" },
    { title: "Type Directors Club", detail: "Certificate of Excellence" },
    { title: "Lectures", detail: "CPH Design Week, Typojanchi, OFFF" },
  ],
};

// DE prose is the EN copy for now (translation pending); short labels are German.
const ABOUT_DEFAULTS: Record<Locale, AboutPage> = {
  en: ABOUT_DEFAULTS_EN,
  de: {
    ...ABOUT_DEFAULTS_EN,
    metaTitle: "Über — Juno Vestergaard",
    title: "Über",
    subMeta: "( Kopenhagen — seit 2014 )",
    capabilitiesHeading: "Fähigkeiten",
    recognitionHeading: "Auszeichnungen",
  },
};

const siteQuery = (l: Locale) => `*[_type == "siteSettings"][0]{
  "headerMark": coalesce(headerMark.${l}, headerMark.de),
  email,
  "contactLabel": coalesce(contactLabel.${l}, contactLabel.de),
  "contactCta": coalesce(contactCta.${l}, contactCta.de),
  "socials": socials[]{ "label": coalesce(label.${l}, label.de), url },
  "archiveHeading": coalesce(archiveHeading.${l}, archiveHeading.de),
  "location": coalesce(location.${l}, location.de),
  "timezoneLabel": coalesce(timezoneLabel.${l}, timezoneLabel.de),
  "copyright": coalesce(copyright.${l}, copyright.de),
  "colophon": coalesce(colophon.${l}, colophon.de),
  "footerNote": coalesce(footerNote.${l}, footerNote.de)
}`;

const aboutQuery = (l: Locale) => `*[_type == "aboutPage"][0]{
  "metaTitle": coalesce(metaTitle.${l}, metaTitle.de),
  "title": coalesce(title.${l}, title.de),
  "lede": coalesce(lede.${l}, lede.de),
  "subMeta": coalesce(subMeta.${l}, subMeta.de),
  "introQuote": coalesce(introQuote.${l}, introQuote.de),
  "bio": coalesce(bio.${l}, bio.de),
  "portrait": portrait.asset._ref,
  "portraitCaption": coalesce(portraitCaption.${l}, portraitCaption.de),
  portraitYear,
  "capabilitiesHeading": coalesce(capabilitiesHeading.${l}, capabilitiesHeading.de),
  "capabilities": capabilities[]{ "title": coalesce(title.${l}, title.de), "detail": coalesce(detail.${l}, detail.de) },
  "recognitionHeading": coalesce(recognitionHeading.${l}, recognitionHeading.de),
  "recognition": recognition[]{ "title": coalesce(title.${l}, title.de), "detail": coalesce(detail.${l}, detail.de) }
}`;

// Sanity returns null for unset fields — keep the default in that case.
function withDefaults<T extends object>(defaults: T, doc: Record<string, unknown> | null): T {
  const out = { ...defaults };
  if (doc) {
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const v = doc[key as string];
      if (v != null) out[key] = v as T[keyof T];
    }
  }
  return out;
}

const siteCache = new Map<Locale, Promise<SiteSettings>>();
const aboutCache = new Map<Locale, Promise<AboutPage>>();

export function getSiteSettings(locale: Locale = DEFAULT_LOCALE): Promise<SiteSettings> {
  if (import.meta.env.DEV) return loadSiteSettings(locale);
  let p = siteCache.get(locale);
  if (!p) {
    p = loadSiteSettings(locale);
    siteCache.set(locale, p);
  }
  return p;
}

export function getAboutPage(locale: Locale = DEFAULT_LOCALE): Promise<AboutPage> {
  if (import.meta.env.DEV) return loadAboutPage(locale);
  let p = aboutCache.get(locale);
  if (!p) {
    p = loadAboutPage(locale);
    aboutCache.set(locale, p);
  }
  return p;
}

async function loadSiteSettings(locale: Locale): Promise<SiteSettings> {
  if (!sanityConfigured) return SITE_DEFAULTS[locale];
  const doc = await sanityFetch<Record<string, unknown> | null>(siteQuery(locale));
  return withDefaults(SITE_DEFAULTS[locale], doc);
}

async function loadAboutPage(locale: Locale): Promise<AboutPage> {
  if (!sanityConfigured) return ABOUT_DEFAULTS[locale];
  const doc = await sanityFetch<Record<string, unknown> | null>(aboutQuery(locale));
  const about = withDefaults(ABOUT_DEFAULTS[locale], doc);
  about.portrait = imageUrl(about.portrait ?? undefined, { w: 1600 });
  return about;
}
