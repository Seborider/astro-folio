/**
 * One-off seed: write the approved About-page copy (CV-derived, first person)
 * into the aboutPage singleton. Patches the existing document if one exists,
 * otherwise creates it. Only sets the fields with real content — everything
 * else keeps falling back to the defaults in src/lib/site.ts.
 *
 * Run from studio/:  npx sanity exec scripts/seed-about.ts --with-user-token
 */
import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2024-01-01" });

const de = (s: string) => ({ de: s });
const deEn = (d: string, e: string) => ({ de: d, en: e });

const key = (() => {
  let i = 0;
  return () => `seed-${Date.now().toString(36)}-${i++}`;
})();

const row = (
  type: string,
  tDe: string,
  tEn: string | null,
  dDe: string,
  dEn: string | null,
) => ({
  _type: type,
  _key: key(),
  title: tEn ? deEn(tDe, tEn) : de(tDe),
  detail: dEn ? deEn(dDe, dEn) : de(dDe),
});

const fields = {
  lede: deEn(
    "Web- & Mobile-Entwickler — von der Hybrid-App bis zur High-Traffic-Webanwendung.",
    "Web & mobile developer — from hybrid apps to high-traffic web applications.",
  ),
  subMeta: deEn("( Bayern — seit 2021 )", "( Bavaria — since 2021 )"),
  introQuote: {
    de: [
      "Ich schreibe Code,",
      "der echte Probleme löst —",
      "funktional, wartbar,",
      "mit <em>Mehrwert</em>.",
    ],
    en: [
      "I write code",
      "that solves real problems —",
      "functional, maintainable,",
      "built for <em>people</em>.",
    ],
  },
  bio: {
    de: [
      "Ich bin Web- und Mobile-Entwickler aus Bayern. Seit 2021 baue ich Anwendungen mit React, React Native, Angular und TypeScript — von High-Traffic-Vergleichsportalen bei Check24 bis zur Hybrid-App auf Expo-Basis, deren Architektur ich bei Promptus konzipiert und verantwortet habe.",
      '<span class="dim">Zuvor</span> ein Studium im Medienmanagement, eine Schreinerlehre und Jahre als stellvertretender Geschäftsführer in Münchner Cafés — Umwege, die Handwerk, Verantwortung und den Blick für Menschen geschärft haben.',
      '<span class="dim">Ansatz</span> — kontinuierlich lernen, technisch exzellent arbeiten und Software schreiben, die auch morgen noch wartbar ist.',
    ],
    en: [
      "I am a web and mobile developer based in Bavaria. Since 2021 I have been building applications with React, React Native, Angular and TypeScript — from high-traffic comparison platforms at Check24 to an Expo-based hybrid app whose architecture I designed and owned at Promptus.",
      '<span class="dim">Before that</span> — a degree in media management, an apprenticeship as a cabinetmaker, and years as deputy manager of Munich cafés. Detours that sharpened craft, responsibility and an eye for people.',
      '<span class="dim">Approach</span> — keep learning, aim for technical excellence, and write software that is still maintainable tomorrow.',
    ],
  },
  portraitCaption: de("Tittmoning, Oberbayern"),
  capabilities: [
    row(
      "capabilitiesRow",
      "Web-Apps",
      "Web apps",
      "React, Angular, TypeScript — High-Traffic-Anwendungen",
      "React, Angular, TypeScript — high-traffic applications",
    ),
    row(
      "capabilitiesRow",
      "Mobile",
      null,
      "React Native, Expo — Hybrid-Apps von Konzept bis Release",
      "React Native, Expo — hybrid apps from concept to release",
    ),
    row(
      "capabilitiesRow",
      "Backend",
      null,
      "Node.js, Express, Ruby on Rails, MongoDB",
      null,
    ),
    row(
      "capabilitiesRow",
      "Migration & Refactoring",
      "Migration & refactoring",
      "TypeScript-Migrationen, Sanierung gewachsener Codebases",
      "TypeScript migrations, reworking legacy codebases",
    ),
    row(
      "capabilitiesRow",
      "Tooling & CI/CD",
      null,
      "Nx, Jenkins, Kubernetes, Storybook, Git",
      null,
    ),
  ],
  process: [
    row(
      "processRow",
      "Konzeption",
      "Concept",
      "Architektur, Anforderungen, Abstimmung mit Projektmanagement",
      "Architecture, requirements, alignment with project management",
    ),
    row(
      "processRow",
      "Design",
      null,
      "Enge Rücksprache mit UX/UI-Design, Figma",
      "Close collaboration with UX/UI design, Figma",
    ),
    row(
      "processRow",
      "Entwicklung",
      "Build",
      "TypeScript-first, komponentenbasiert, Storybook",
      "TypeScript-first, component-driven, Storybook",
    ),
    row(
      "processRow",
      "Testing & Deploy",
      "Testing & deploy",
      "Automatisierte Tests, Jenkins CI/CD",
      "Automated tests, Jenkins CI/CD",
    ),
    row(
      "processRow",
      "Iteration",
      null,
      "Agile Zyklen, Shape Up, kontinuierliche Verbesserung",
      "Agile cycles, Shape Up, continuous improvement",
    ),
  ],
  recognitionHeading: deEn("Werdegang", "Career"),
  recognition: [
    row(
      "recognitionRow",
      "Web Developer Bootcamp",
      null,
      "neue fische — 540 Std., Zertifikat",
      "neue fische — 540 hrs, certified",
    ),
    row(
      "recognitionRow",
      "B.A. Medienmanagement",
      "B.A. Media Management",
      "Mediadesign Hochschule München",
      "Mediadesign Hochschule Munich",
    ),
    row(
      "recognitionRow",
      "Check24",
      null,
      "Junior Software Entwickler — 2022–2024",
      "Junior software developer — 2022–2024",
    ),
    row(
      "recognitionRow",
      "Promptus GmbH",
      null,
      "Software Entwickler — 2024–2025",
      "Software developer — 2024–2025",
    ),
  ],
};

async function run() {
  const existing: { _id: string }[] = await client.fetch(
    `*[_type == "aboutPage"]{_id}`,
  );
  let id = existing[0]?._id;
  if (existing.length > 1) {
    console.warn(
      `⚠ ${existing.length} aboutPage documents found; patching ${id}`,
    );
  }
  if (!id) {
    id = "aboutPage";
    await client.createIfNotExists({ _id: id, _type: "aboutPage" });
    console.log(`→ created aboutPage ${id}`);
  }
  await client.patch(id).set(fields).commit();
  console.log(`✓ aboutPage ${id} — set: ${Object.keys(fields).join(", ")}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
