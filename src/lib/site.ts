/**
 * site.ts — loaders for the singleton documents (siteSettings, aboutPage,
 * homePage), mirroring the projects.ts pattern: read Sanity when configured,
 * fall back to the built-in defaults below otherwise. The merge is per-field,
 * so a half-filled Studio document still renders a complete page.
 *
 * Localization: text fields are locale objects in the Studio; the queries
 * coalesce(field.<locale>, field.de). The defaults are authored per locale
 * below — DE prose is currently an EN duplicate pending real translation.
 */
import { sanityConfigured, sanityFetch, imageUrl } from "./sanity";
import { BRAND, pageTitle, type Locale } from "../i18n";
import { memoByLocale } from "./memo";

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
  availability: string;
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

export interface Technology {
  name: string; // not translatable
  svg: string; // raw inline SVG markup; rendered with set:html so fill="currentColor" inherits
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
  processHeading: string;
  process: AboutRow[];
  recognitionHeading: string;
  recognition: AboutRow[];
  technologies: Technology[];
}

export interface ReelTile {
  label: string;
  image: string | null; // resolved CDN url, or null for the placeholder
  video: string | null; // resolved CDN file url (muted loop), or null
  project: string | null; // linked project slug, or null for no caption link
}

export interface Testimonial {
  quote: string;
  attribution: string;
  role?: string;
}

export interface HomePage {
  reelTiles: ReelTile[]; // only the tiles set in the Studio (max 8); the
  // placeholder defaults below are used only when Sanity is unconfigured
  testimonials: Testimonial[]; // empty until real client quotes are added
  showreelVideo: string | null; // overlay player URL; null → placeholder
}

const SITE_DEFAULTS_EN: SiteSettings = {
  headerMark: `${BRAND} ©`,
  email: "sebo@sebo.zone",
  contactLabel: "( Reach out )",
  contactCta: "Say hello ↗",
  socials: [
    { label: "Instagram ↗", url: "#" },
    { label: "LinkedIn ↗", url: "#" },
    { label: "Savee ↗", url: "#" },
  ],
  archiveHeading: "Archive",
  availability: "Available for projects",
  location: "Germany",
  timezoneLabel: "UTC+1",
  copyright: "© 2026",
  colophon: "Built with Astro · GSAP · Lenis · WebGL",
  footerNote: "",
};

const SITE_DEFAULTS: Record<Locale, SiteSettings> = {
  en: SITE_DEFAULTS_EN,
  de: {
    ...SITE_DEFAULTS_EN,
    contactLabel: "( Kontakt )",
    contactCta: "Sag hallo ↗",
    archiveHeading: "Archiv",
    availability: "Verfügbar für Projekte",
    location: "Germany",
    copyright: "© 2026",
    footerNote: "",
  },
};

const ABOUT_DEFAULTS_EN: AboutPage = {
  metaTitle: `${pageTitle("About")}, Web & Mobile Developer`,
  title: "About",
  lede: "Design & art director working between brand, motion and the printed page.",
  subMeta: "( Germany — est. 2021 )",
  introQuote: [
    "I shape the space",
    "between images,",
    "where rhythm turns",
    "to <em>meaning</em>.",
  ],
  bio: [
    `${BRAND} is a Germany-based design and art director with a decade of practice spanning identity systems, motion, and editorial. The work is led by typography and pacing — treating a brand less as a logo and more as a tempo that recurs across every surface.`,
    '<span class="dim">Previously</span> design lead at a Scandinavian studio and an independent for cultural institutions, fashion houses and technology brands. Current focus: long-form brand worlds and the moving image.',
    '<span class="dim">Approach</span> — slow looking, sharp type, generous white space, and the conviction that restraint is its own kind of noise.',
  ],
  portrait: null,
  portraitCaption: "Studio, Vesterbro",
  portraitYear: "2026",
  capabilitiesHeading: "Capabilities",
  capabilities: [
    {
      title: "Brand systems",
      detail: "Identity, naming, voice, guidelines, rollout",
    },
    { title: "Art direction", detail: "Campaigns, photography, casting, set" },
    { title: "Motion", detail: "Title design, brand films, sound partners" },
    {
      title: "Editorial",
      detail: "Books, catalogues, type design, print craft",
    },
    { title: "Digital", detail: "Sites, WebGL, prototypes with dev partners" },
  ],
  processHeading: "How I work",
  process: [
    {
      title: "Discovery",
      detail: "Goals, audience, scope — what success looks like",
    },
    { title: "Design", detail: "Direction, system, prototype, sign-off" },
    {
      title: "Build",
      detail: "Front + back end, CMS, accessible and performant",
    },
    { title: "Launch", detail: "Testing, deploy, handover, docs" },
    { title: "Support", detail: "Iteration, analytics, ongoing care" },
  ],
  recognitionHeading: "Recognition",
  recognition: [
    { title: "Awwwards", detail: "Site of the Day × 3, Developer Award" },
    { title: "D&AD", detail: "Wood Pencil, Branding" },
    { title: "Type Directors Club", detail: "Certificate of Excellence" },
    { title: "Lectures", detail: "CPH Design Week, Typojanchi, OFFF" },
  ],
  // Empty by design — the carousel stays hidden until logos are added in the Studio.
  technologies: [],
};

// DE prose is the EN copy for now (translation pending); short labels are German.
const ABOUT_DEFAULTS: Record<Locale, AboutPage> = {
  en: ABOUT_DEFAULTS_EN,
  de: {
    ...ABOUT_DEFAULTS_EN,
    metaTitle: `${pageTitle("Über mich")}, Web & Mobile Developer`,
    title: "Über",
    subMeta: "( Germany)",
    capabilitiesHeading: "Fähigkeiten",
    processHeading: "Arbeitsweise",
    recognitionHeading: "Auszeichnungen",
  },
};

// Current placeholder labels; locale-neutral, same for both locales.
const HOME_DEFAULTS: HomePage = {
  reelTiles: [
    "reel 01 · 16:9",
    "reel 02 · 16:9",
    "reel 03 · 4:5",
    "reel 04",
    "reel 05",
    "reel 06",
    "reel 07",
    "reel 08",
  ].map((label) => ({ label, image: null, video: null, project: null })),
  // Empty by design — the testimonial strip stays hidden until real client
  // quotes are added in the Studio (no fabricated proof ships).
  testimonials: [],
  // Null by design — the overlay shows its labelled placeholder until a real
  // showreel URL is set in the Studio.
  showreelVideo: null,
};

// One source for the fixed 8-slot reel layout: grid class + image width.
// Slots 0–1 span 3 of 6 grid columns (wider tiles → wider images), the rest 2.
// index.astro renders the classes; loadHomePage picks the widths.
export const REEL_SLOTS = [
  { cls: "s3", w: 1600 },
  { cls: "s3", w: 1600 },
  { cls: "s2", w: 1000 },
  { cls: "s2", w: 1000 },
  { cls: "s2", w: 1000 },
  { cls: "s2", w: 1000 },
  { cls: "s2", w: 1000 },
  { cls: "s2", w: 1000 },
] as const;

const siteQuery = (l: Locale) => `*[_type == "siteSettings"][0]{
  "headerMark": coalesce(headerMark.${l}, headerMark.de),
  email,
  "contactLabel": coalesce(contactLabel.${l}, contactLabel.de),
  "contactCta": coalesce(contactCta.${l}, contactCta.de),
  "socials": socials[]{ "label": coalesce(label.${l}, label.de), url },
  "archiveHeading": coalesce(archiveHeading.${l}, archiveHeading.de),
  "availability": coalesce(availability.${l}, availability.de),
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
  "processHeading": coalesce(processHeading.${l}, processHeading.de),
  "process": process[]{ "title": coalesce(title.${l}, title.de), "detail": coalesce(detail.${l}, detail.de) },
  "recognitionHeading": coalesce(recognitionHeading.${l}, recognitionHeading.de),
  "recognition": recognition[]{ "title": coalesce(title.${l}, title.de), "detail": coalesce(detail.${l}, detail.de) },
  "technologies": technologies[]{ name, svg }
}`;

const homeQuery = (l: Locale) => `*[_type == "homePage"][0]{
  "reelTiles": reelTiles[]{
    "label": coalesce(label.${l}, label.de),
    "image": image.asset._ref,
    "video": video.asset->url,
    "project": project->slug.current
  },
  "testimonials": testimonials[]{
    "quote": coalesce(quote.${l}, quote.de),
    "attribution": attribution,
    "role": coalesce(role.${l}, role.de)
  },
  "showreelVideo": showreelVideo.asset->url
}`;

// Sanity returns null for unset fields — keep the default in that case.
export function withDefaults<T extends object>(
  defaults: T,
  doc: Record<string, unknown> | null,
): T {
  const out = { ...defaults };
  if (doc) {
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const v = doc[key as string];
      if (v != null) out[key] = v as T[keyof T];
    }
  }
  return out;
}

async function loadSiteSettings(locale: Locale): Promise<SiteSettings> {
  if (!sanityConfigured) return SITE_DEFAULTS[locale];
  const doc = await sanityFetch<Record<string, unknown> | null>(
    siteQuery(locale),
  );
  return withDefaults(SITE_DEFAULTS[locale], doc);
}

async function loadAboutPage(locale: Locale): Promise<AboutPage> {
  if (!sanityConfigured) return ABOUT_DEFAULTS[locale];
  const doc = await sanityFetch<Record<string, unknown> | null>(
    aboutQuery(locale),
  );
  const about = withDefaults(ABOUT_DEFAULTS[locale], doc);
  about.portrait = imageUrl(about.portrait ?? undefined, { w: 1600 });
  return about;
}

// No withDefaults here: with Sanity configured, only the tiles actually set
// in the Studio are rendered — no placeholder padding.
async function loadHomePage(locale: Locale): Promise<HomePage> {
  if (!sanityConfigured) return HOME_DEFAULTS;
  const doc = await sanityFetch<{
    reelTiles?: Array<{
      label?: string;
      image?: string;
      video?: string;
      project?: string;
    }>;
    testimonials?: Array<{
      quote?: string;
      attribution?: string;
      role?: string;
    }>;
    showreelVideo?: string;
  } | null>(homeQuery(locale));
  const raw = doc?.reelTiles ?? [];
  return {
    reelTiles: raw.slice(0, REEL_SLOTS.length).map((t, i) => ({
      label: t.label ?? "",
      image: imageUrl(t.image, { w: REEL_SLOTS[i].w }),
      video: t.video ?? null,
      project: t.project ?? null,
    })),
    // Only keep entries with both a quote and an attribution — a half-filled
    // row never renders an anonymous or empty testimonial.
    testimonials: (doc?.testimonials ?? [])
      .filter((t) => t.quote && t.attribution)
      .map((t) => ({
        quote: t.quote as string,
        attribution: t.attribution as string,
        role: t.role ?? undefined,
      })),
    showreelVideo: doc?.showreelVideo ?? null,
  };
}

export const getSiteSettings = memoByLocale(loadSiteSettings);
export const getAboutPage = memoByLocale(loadAboutPage);
export const getHomePage = memoByLocale(loadHomePage);
