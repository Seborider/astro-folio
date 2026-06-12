/**
 * ui.ts — translations for UI strings that live OUTSIDE the CMS
 * (nav labels, filter buttons, table headers, button text, meta copy).
 * CMS content is localized in the backends; see src/lib/projects.ts/site.ts.
 *
 * Note: the microcopy inside public/scripts/ (loader states, cursor labels,
 * "Copied ✓") intentionally stays English in both locales — the motion code
 * is off-limits per CLAUDE.md.
 */
import type { Locale } from "./index";

export interface UIDict {
  // header / footer chrome
  navWork: string;
  navAbout: string;
  navArchive: string;
  themeToggleLabel: string;
  langSwitchLabel: string;
  footSocials: string;
  footIndex: string;
  footHome: string;
  footBased: string;

  // home
  homeTitle: string;
  homeDescription: string;
  loadingLabel: string;
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
}

export const ui: Record<Locale, UIDict> = {
  de: {
    navWork: "Arbeiten",
    navAbout: "Über",
    navArchive: "Archiv",
    themeToggleLabel: "Farbschema umschalten",
    langSwitchLabel: "Switch to English",
    footSocials: "Socials",
    footIndex: "Index",
    footHome: "Start",
    footBased: "Standort",

    homeTitle: "Sebo Mayer — Design & Art Director",
    homeDescription:
      "Design- und Art-Direction zwischen Brand, Motion und Editorial — Portfolio von Sebo Mayer.",
    loadingLabel: "( Laden )",
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

    workTitle: "Arbeiten",
    workMetaTitle: "Arbeiten — Sebo Mayer",
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
    archiveMetaTitle: "Archiv — Sebo Mayer",
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
  },
  en: {
    navWork: "Work",
    navAbout: "About",
    navArchive: "Archive",
    themeToggleLabel: "Toggle color theme",
    langSwitchLabel: "Zu Deutsch wechseln",
    footSocials: "Socials",
    footIndex: "Index",
    footHome: "Home",
    footBased: "Based",

    homeTitle: "Sebo Mayer — Design & Art Director",
    homeDescription:
      "Design and art direction across brand, motion and editorial — the portfolio of Sebo Mayer.",
    loadingLabel: "( Loading )",
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

    workTitle: "Work",
    workMetaTitle: "Work — Sebo Mayer",
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
    archiveMetaTitle: "Archive — Sebo Mayer",
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
  },
};

export function t(locale: Locale): UIDict {
  return ui[locale];
}
