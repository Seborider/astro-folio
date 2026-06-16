/**
 * ui.ts — translations for UI strings that live OUTSIDE the CMS
 * (nav labels, filter buttons, table headers, button text, meta copy).
 * CMS content is localized in the backends; see src/lib/projects.ts/site.ts.
 *
 * Note: the microcopy inside public/scripts/ (loader states, cursor labels,
 * "Copied ✓") intentionally stays English in both locales — the motion code
 * is off-limits per CLAUDE.md.
 */
import { BRAND, pageTitle, type Locale } from "./index";

export interface UIDict {
  // header / footer chrome
  navWork: string;
  navAbout: string;
  navArchive: string;
  themeToggleLabel: string;
  langSwitchLabel: string;
  menuLabel: string;
  footSocials: string;
  footIndex: string;
  footHome: string;
  footBased: string;

  // home
  homeTitle: string;
  homeDescription: string;
  loadingLabel: string;
  heroRole: string;
  // hero meta line — scramble words (A/B/C) interleaved with paren labels.
  // The scramble data-text attributes must match these strings.
  heroMetaA: string;
  heroMetaRole: string;
  heroMetaB: string;
  heroMetaC: string;
  heroMetaYear: string;
  heroCity: string;
  scrollCue: string;
  statementLabel: string;
  statementLines: string[]; // reveal-lines; may contain <em>
  statementAttr: string;
  reelHeading: string;
  playReel: string;
  workIndexLabel: string;
  showreelLabel: string;
  close: string;
  showreelPlaceholder: string;

  // shared page-hero — secondary index label ("Index 01/02/03")
  indexLabel: string;

  // work
  workTitle: string;
  workMetaTitle: string;
  workDescription: string;
  workScramble: string;
  workLede: string;
  projectsCountLabel: string;
  filterAll: string;
  filterBrand: string;
  filterMotion: string;
  filterEditorial: string;
  filterDigital: string;

  // project detail
  metaClient: string;
  metaYear: string;
  metaRole: string;
  metaServices: string;
  prevLabel: string;
  nextLabel: string;

  // about
  aboutScramble: string;
  bioLabel: string;
  selectedLabel: string;

  // archive
  archiveTitle: string;
  archiveMetaTitle: string;
  archiveDescription: string;
  archiveScramble: string;
  archiveLede: string;
  thYear: string;
  thProject: string;
  thType: string;
  thRole: string;
  thLink: string;
  viewLink: string;

  // 404 — single static page, DE-primary (notFoundSubMeta stays English by design)
  notFoundScramble: string;
  notFoundLabel: string;
  notFoundLede: string;
  notFoundSubMeta: string;
  notFoundHome: string;
  notFoundWork: string;

  // Tweaks panel (React island)
  tweaks: {
    title: string;
    close: string;
    accent: string;
    highlight: string;
    canvas: string;
    background: string;
    text: string;
  };

  // localized section labels — surfaced by the floating section index
  // (core.js reads each section's data-screen-label).
  sections: {
    hero: string;
    statement: string;
    reel: string;
    voices: string;
    work: string;
    contact: string;
    workHero: string;
    projectGrid: string;
    aboutHero: string;
    aboutProcess: string;
    archiveHero: string;
    archiveTable: string;
    projectHero: string;
    projectInfo: string;
    projectGallery: string;
  };
}

export const ui: Record<Locale, UIDict> = {
  de: {
    navWork: "Arbeiten",
    navAbout: "Über",
    navArchive: "Archiv",
    themeToggleLabel: "Farbschema umschalten",
    langSwitchLabel: "Switch to English",
    menuLabel: "Menü",
    footSocials: "Socials",
    footIndex: "Index",
    footHome: "Start",
    footBased: "Standort",

    homeTitle: `${BRAND} — Web & Mobile Developer`,
    homeDescription: `Design- und Art-Direction zwischen Brand, Motion und Editorial — Portfolio von ${BRAND}.`,
    loadingLabel: "( Laden )",
    heroRole: "Web & Mobile Developer",
    heroMetaA: "WEB",
    heroMetaRole: "( Developer )",
    heroMetaB: "DEVELOPMENT",
    heroMetaC: "PORTFOLIO",
    heroMetaYear: "( 2026 )",
    heroCity: "( Kopenhagen )",
    scrollCue: "( Scrollen )",
    statementLabel: "Ansatz",
    statementLines: [
      "Alles",
      "beginnt als ein",
      "<em>Zufall</em>",
      "der Aufmerksamkeit.",
    ],
    statementAttr:
      "Eine Praxis zwischen Brand, Motion und Editorial — gebaut auf langsames Sehen, scharfe Typografie und die Überzeugung, dass Zurückhaltung ihre eigene Art von Lärm ist.",
    reelHeading: "Ausgewählte Motion",
    playReel: "Showreel abspielen — 02:14",
    workIndexLabel: "Ausgewählte Arbeiten",
    showreelLabel: "( Showreel — 02:14 )",
    close: "( Schließen )",
    showreelPlaceholder: "Showreel in voller Länge — Master-Cut hier ablegen",

    indexLabel: "Index",

    workTitle: "Arbeiten",
    workMetaTitle: pageTitle("Arbeiten"),
    workDescription:
      "Ausgewählte Projekte aus Brand, Motion, Editorial und Digital — 2021 bis heute.",
    workScramble: "( Arbeiten )",
    workLede:
      "Ausgewählte Projekte aus Brand, Motion, Editorial und Digital — 2021 bis heute.",
    projectsCountLabel: "Projekte",
    filterAll: "Alle",
    filterBrand: "Brand",
    filterMotion: "Motion",
    filterEditorial: "Editorial",
    filterDigital: "Digital",

    metaClient: "Kunde",
    metaYear: "Jahr",
    metaRole: "Rolle",
    metaServices: "Leistungen",
    prevLabel: "( Vorheriges )",
    nextLabel: "( Nächstes Projekt )",

    aboutScramble: "( Über )",
    bioLabel: "( Bio )",
    selectedLabel: "( Auswahl )",

    archiveTitle: "Archiv",
    archiveMetaTitle: pageTitle("Archiv"),
    archiveDescription:
      "Der vollständige Index — jedes Projekt, chronologisch, mit Typ und Rolle.",
    archiveScramble: "( Archiv )",
    archiveLede:
      "Der vollständige Index — jedes Projekt, chronologisch, mit Typ und Rolle.",
    thYear: "Jahr",
    thProject: "Projekt",
    thType: "Typ",
    thRole: "Rolle",
    thLink: "Link",
    viewLink: "Ansehen ↗",

    notFoundScramble: "( Fehler 404 )",
    notFoundLabel: "Nicht gefunden",
    notFoundLede: "Diese Seite existiert nicht — oder ist umgezogen.",
    notFoundSubMeta: "This page could not be found.",
    notFoundHome: "Startseite ↗",
    notFoundWork: "Arbeiten ↗",

    tweaks: {
      title: "Tweaks",
      close: "Schließen",
      accent: "Akzent",
      highlight: "Highlight-Farbe",
      canvas: "Fläche",
      background: "Hintergrund",
      text: "Text",
    },

    sections: {
      hero: "Intro",
      statement: "Ansatz",
      reel: "Motion",
      voices: "Stimmen",
      work: "Arbeiten",
      contact: "Kontakt",
      workHero: "Arbeiten",
      projectGrid: "Projekte",
      aboutHero: "Über",
      aboutProcess: "Arbeitsweise",
      archiveHero: "Archiv",
      archiveTable: "Index",
      projectHero: "Projekt",
      projectInfo: "Details",
      projectGallery: "Galerie",
    },
  },
  en: {
    navWork: "Work",
    navAbout: "About",
    navArchive: "Archive",
    themeToggleLabel: "Toggle color theme",
    langSwitchLabel: "Zu Deutsch wechseln",
    menuLabel: "Menu",
    footSocials: "Socials",
    footIndex: "Index",
    footHome: "Home",
    footBased: "Based",

    homeTitle: `${BRAND} — Web & Mobile Developer`,
    homeDescription: `Design and art direction across brand, motion and editorial — the portfolio of ${BRAND}.`,
    loadingLabel: "( Loading )",
    heroRole: "Web & Mobile Developer",
    heroMetaA: "WEB",
    heroMetaRole: "( Developer )",
    heroMetaB: "DEVELOPMENT",
    heroMetaC: "PORTFOLIO",
    heroMetaYear: "( 2026 )",
    heroCity: "( Copenhagen )",
    scrollCue: "( Scroll )",
    statementLabel: "Approach",
    statementLines: [
      "Everything",
      "begins as an",
      "<em>accident</em>",
      "of attention.",
    ],
    statementAttr:
      "A practice across brand, motion and editorial — built on slow looking, sharp typography, and the belief that restraint is its own kind of noise.",
    reelHeading: "Selected motion",
    playReel: "Play showreel — 02:14",
    workIndexLabel: "Selected work",
    showreelLabel: "( Showreel — 02:14 )",
    close: "( Close )",
    showreelPlaceholder: "Full showreel — drop master cut here",

    indexLabel: "Index",

    workTitle: "Work",
    workMetaTitle: pageTitle("Work"),
    workDescription:
      "Selected projects across brand, motion, editorial and digital — 2021 to now.",
    workScramble: "( Work )",
    workLede:
      "Selected projects across brand, motion, editorial and digital — 2021 to now.",
    projectsCountLabel: "projects",
    filterAll: "All",
    filterBrand: "Brand",
    filterMotion: "Motion",
    filterEditorial: "Editorial",
    filterDigital: "Digital",

    metaClient: "Client",
    metaYear: "Year",
    metaRole: "Role",
    metaServices: "Services",
    prevLabel: "( Previous )",
    nextLabel: "( Next project )",

    aboutScramble: "( About )",
    bioLabel: "( Bio )",
    selectedLabel: "( Selected )",

    archiveTitle: "Archive",
    archiveMetaTitle: pageTitle("Archive"),
    archiveDescription:
      "The full index — every project, chronological, type and role.",
    archiveScramble: "( Archive )",
    archiveLede:
      "The full index — every project, chronological, type and role.",
    thYear: "Year",
    thProject: "Project",
    thType: "Type",
    thRole: "Role",
    thLink: "Link",
    viewLink: "View ↗",

    notFoundScramble: "( Error 404 )",
    notFoundLabel: "Not found",
    notFoundLede: "This page doesn’t exist — or has moved.",
    notFoundSubMeta: "This page could not be found.",
    notFoundHome: "Home ↗",
    notFoundWork: "Work ↗",

    tweaks: {
      title: "Tweaks",
      close: "Close",
      accent: "Accent",
      highlight: "Highlight color",
      canvas: "Canvas",
      background: "Background",
      text: "Text",
    },

    sections: {
      hero: "Intro",
      statement: "Approach",
      reel: "Motion",
      voices: "Voices",
      work: "Work",
      contact: "Contact",
      workHero: "Work",
      projectGrid: "Projects",
      aboutHero: "About",
      aboutProcess: "Process",
      archiveHero: "Archive",
      archiveTable: "Index",
      projectHero: "Project",
      projectInfo: "Details",
      projectGallery: "Gallery",
    },
  },
};

export function t(locale: Locale): UIDict {
  return ui[locale];
}
