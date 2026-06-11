/**
 * One-time migration: wrap flat text fields as { de, en } locale objects,
 * matching the schema change in schemaTypes/locale.ts. Existing values are
 * copied into BOTH languages (current copy = EN baseline, DE duplicated
 * pending real translation — never renders empty either way).
 *
 * Idempotent: already-nested values are left untouched, so it is safe to
 * re-run. Run it from studio/ with your logged-in CLI user:
 *
 *   npx sanity exec scripts/migrate-locales.ts --with-user-token
 */
import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2024-01-01" });

type Doc = Record<string, any>;

const PROJECT_FIELDS = ["name", "cat", "role", "client", "services", "intro", "overview", "quote"];
const SITE_FIELDS = [
  "headerMark", "contactLabel", "contactCta", "archiveHeading", "location",
  "timezoneLabel", "copyright", "colophon", "footerNote",
];
const ABOUT_FIELDS = [
  "metaTitle", "title", "lede", "subMeta", "introQuote", "bio",
  "portraitCaption", "capabilitiesHeading", "recognitionHeading",
];

const isFlat = (v: unknown) =>
  v != null && (typeof v === "string" || Array.isArray(v));

const wrap = (v: unknown) => ({ de: v, en: v });

function localize(doc: Doc, fields: string[]): Doc {
  const set: Doc = {};
  for (const f of fields) {
    if (isFlat(doc[f])) set[f] = wrap(doc[f]);
  }
  return set;
}

// rows: arrays of objects whose listed keys need wrapping (gallery labels,
// social labels, capabilities/recognition rows)
function localizeRows(doc: Doc, field: string, keys: string[]): Doc {
  const rows = doc[field];
  if (!Array.isArray(rows) || !rows.some((r) => keys.some((k) => isFlat(r?.[k])))) return {};
  return {
    [field]: rows.map((r: Doc) => {
      const out = { ...r };
      for (const k of keys) if (isFlat(out[k])) out[k] = wrap(out[k]);
      return out;
    }),
  };
}

async function run() {
  const docs: Doc[] = await client.fetch(
    `*[_type in ["project", "siteSettings", "aboutPage"]]`
  );
  let patched = 0;

  for (const doc of docs) {
    let set: Doc = {};
    if (doc._type === "project") {
      set = { ...localize(doc, PROJECT_FIELDS), ...localizeRows(doc, "gallery", ["label"]) };
    } else if (doc._type === "siteSettings") {
      set = { ...localize(doc, SITE_FIELDS), ...localizeRows(doc, "socials", ["label"]) };
    } else if (doc._type === "aboutPage") {
      set = {
        ...localize(doc, ABOUT_FIELDS),
        ...localizeRows(doc, "capabilities", ["title", "detail"]),
        ...localizeRows(doc, "recognition", ["title", "detail"]),
      };
    }

    if (Object.keys(set).length === 0) {
      console.log(`✓ ${doc._type} ${doc._id} — already migrated, skipped`);
      continue;
    }
    await client.patch(doc._id).set(set).commit();
    console.log(`→ ${doc._type} ${doc._id} — localized: ${Object.keys(set).join(", ")}`);
    patched++;
  }

  console.log(`Done. ${patched} document(s) patched, ${docs.length - patched} already migrated.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
