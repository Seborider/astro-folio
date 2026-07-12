/**
 * Seed one project document: "STL Browser". Idempotent (createOrReplace by
 * _id), safe to re-run. DE/EN copy is machine-drafted from the project's
 * README: review in the Studio before publish.
 *
 * Run from studio/:  npx sanity exec scripts/seed-project-stl-browser.ts --with-user-token
 */
import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2024-01-01" });

const doc = {
  _id: "project-stl-browser",
  _type: "project",
  name: { _type: "localeString", de: "STL Browser", en: "STL Browser" },
  slug: { _type: "slug", current: "stl-browser" },
  order: 1001,
  cat: {
    _type: "localeString",
    de: "Desktop · 3D · Tooling",
    en: "Desktop · 3D · Tooling",
  },
  yr: "2026",
  role: {
    _type: "localeString",
    de: "Konzept, Design & Entwicklung", // ⚠ draft, review before publish
    en: "Concept, design & development",
  },
  client: {
    _type: "localeString",
    de: "Eigenprojekt", // ⚠ draft
    en: "Personal project",
  },
  services: {
    _type: "localeStringArray",
    de: ["Desktop-App-Entwicklung", "3D-Rendering", "UI-Design"], // ⚠ draft
    en: ["Desktop app development", "3D rendering", "UI design"],
  },
  technologies: {
    _type: "localeStringArray",
    de: [
      "Rust",
      "Tauri 2",
      "React 19",
      "TypeScript",
      "Three.js",
      "Tailwind CSS",
      "Zustand",
      "SQLite",
    ],
    en: [
      "Rust",
      "Tauri 2",
      "React 19",
      "TypeScript",
      "Three.js",
      "Tailwind CSS",
      "Zustand",
      "SQLite",
    ],
  },
  tags: { _type: "localeStringArray", de: ["Digital"] },
  intro: {
    _type: "localeText",
    de: "Ein macOS-Desktop-Browser im Photos.app-Stil zur Vorschau von 3D-Druckdateien (.stl, .3mf, .obj).", // ⚠ draft
    en: "A Photos.app-style macOS desktop browser for previewing 3D-printing files (.stl, .3mf, .obj).",
  },
  ledeLink: "https://github.com/Seborider/stl-browser",
  overview: {
    _type: "localeTextArray",
    de: [
      "STL Browser rendert Thumbnails direkt aus den lokalen Mesh-Dateien und zeigt sie in einem virtualisierten Grid, mit Metadaten und einer Detailansicht mit Orbit, Pan und Zoom.", // ⚠ draft
      "Das Backend ist Rust mit Tauri 2 (tokio, rusqlite, notify, blake3); das Frontend React 19 mit react-three-fiber und Three.js. Version 1 zielt auf Apple Silicon.",
    ],
    en: [
      "STL Browser renders thumbnails straight from the local mesh files and presents them in a virtualized grid, with metadata and a detail viewer with orbit, pan and zoom.",
      "The backend is Rust with Tauri 2 (tokio, rusqlite, notify, blake3); the frontend is React 19 with react-three-fiber and Three.js. Version 1 targets Apple Silicon.",
    ],
  },
  // TODO: upload cover image in the Studio (chosen: upload later)
  gallery: [
    {
      _type: "shot",
      _key: "shot-0",
      label: { _type: "localeString", de: "Bibliotheksansicht", en: "Library view" }, // ⚠ draft
      span: "full",
    },
  ],
};

async function run() {
  await client.createOrReplace(doc);
  console.log(`✓ project seeded: ${doc._id} (order ${doc.order})`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
