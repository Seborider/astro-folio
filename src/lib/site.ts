/**
 * site.ts — loaders for the singleton documents (siteSettings, aboutPage),
 * mirroring the projects.ts pattern: read Sanity when configured, fall back
 * to the built-in defaults below otherwise. The merge is per-field, so a
 * half-filled Studio document still renders a complete page.
 */
import { sanityConfigured, sanityFetch, imageUrl } from "./sanity";

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

const SITE_DEFAULTS: SiteSettings = {
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

const ABOUT_DEFAULTS: AboutPage = {
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

const SITE_QUERY = `*[_type == "siteSettings"][0]{
  headerMark, email, contactLabel, contactCta,
  socials[]{ label, url },
  archiveHeading, location, timezoneLabel, copyright, colophon, footerNote
}`;

const ABOUT_QUERY = `*[_type == "aboutPage"][0]{
  metaTitle, title, lede, subMeta, introQuote, bio,
  "portrait": portrait.asset._ref,
  portraitCaption, portraitYear,
  capabilitiesHeading, capabilities[]{ title, detail },
  recognitionHeading, recognition[]{ title, detail }
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

let siteCache: Promise<SiteSettings> | undefined;
let aboutCache: Promise<AboutPage> | undefined;

export function getSiteSettings(): Promise<SiteSettings> {
  if (import.meta.env.DEV) return loadSiteSettings();
  return (siteCache ??= loadSiteSettings());
}

export function getAboutPage(): Promise<AboutPage> {
  if (import.meta.env.DEV) return loadAboutPage();
  return (aboutCache ??= loadAboutPage());
}

async function loadSiteSettings(): Promise<SiteSettings> {
  if (!sanityConfigured) return SITE_DEFAULTS;
  const doc = await sanityFetch<Record<string, unknown> | null>(SITE_QUERY);
  return withDefaults(SITE_DEFAULTS, doc);
}

async function loadAboutPage(): Promise<AboutPage> {
  if (!sanityConfigured) return ABOUT_DEFAULTS;
  const doc = await sanityFetch<Record<string, unknown> | null>(ABOUT_QUERY);
  const about = withDefaults(ABOUT_DEFAULTS, doc);
  about.portrait = imageUrl(about.portrait ?? undefined, { w: 1600 });
  return about;
}
