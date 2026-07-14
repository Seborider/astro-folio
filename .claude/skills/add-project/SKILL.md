---
name: add-project
description: Use when the user wants to add a new portfolio project to this site from the source directory of an app they built: /add-project <path-to-project>.
---

# Add Project

Turn an app's source directory into a portfolio project in BOTH content
backends: a Sanity seed script + the local JSON fallback file.

**Input:** `<path-to-project>`, the app's source directory. If missing, ask
for it before doing anything else.

## Hard constraints (check before every write/run)

- **Only two files may be written per run:** `studio/scripts/seed-project-<slug>.ts`
  and `src/content/projects/<slug>.json`. Anything else: STOP and ask the user first.
- **NEVER run `npm run import:seed`**: it imports with `--replace` and wipes the dataset.
- **NEVER modify anything inside `<path-to-project>`.** It is read-only input.
- **NEVER author empty `en` strings.** No translation: omit `en` entirely
  (it falls back to `de` in both backends).
- **NEVER use the em dash.** Generated text MUST NOT contain the "EM DASH"
  character (U+2014) in either locale, in any field. Not negotiable, no
  exceptions. Rephrase, or use a comma, period, or colon instead.

## Workflow

### 1. Derive the field list from the schemas, at run time

Read BOTH schemas and build the field list from what they say **today**:

- `src/content.config.ts`: the Zod schema (JSON backend)
- `studio/schemaTypes/project.ts`: the Sanity schema (locale types in
  `studio/schemaTypes/locale.ts`)

Do NOT rely on any field list remembered from before; schemas change.
Note per field: required vs optional, localized (`{ de, en? }`) vs plain, and
Sanity-only fields (e.g. `slug`; `cover`/`gallery.image` are asset refs in
Sanity but string paths in JSON).

### 2. Scan the project directory (read-only)

From `<path-to-project>`, gather:

- `package.json`: `name` (slug candidate), `description`, `dependencies`
  (for `technologies`: map notable deps to display names, e.g. `react` becomes
  React; skip build-tool noise)
- `README*`: copy source for `intro`, `overview`, `quote`
- `git -C <path> remote get-url origin`: repo URL (`ledeLink` candidate)
- `package.json` `homepage` / deploy config (vercel.json, netlify.toml, CNAME):
  live URL (preferred `ledeLink`)

### 3. Map facts to fields; ask for the rest

- Draft the localized `{ de, en }` copy (`name`, `intro`, `overview`, `role`,
  `client`, `services`, …) from the README/description. Mark every drafted
  string **"⚠ draft, review before publish"** in your summary.
- **Write descriptive, concrete copy, not short generic phrases.** Every
  drafted text must say something specific about THIS project:
  - Say what the app actually does and for whom: the concrete features,
    workflows, or content it handles, pulled from the README and the code you
    scanned. "Ein STL-Viewer, der 3D-Druckdateien direkt im Browser rendert"
    beats "Eine moderne Web-App".
  - Name the tech where it matters and tie it to what it enables ("rendered
    with Three.js so models rotate at 60 fps in the browser"), instead of a
    bare buzzword list. `technologies` stays the structured list; the prose
    explains why those choices matter.
  - Include what makes the project interesting: a hard problem solved, an
    unusual constraint, a notable interaction, a measurable result. If the
    scan surfaced none, ask the user rather than padding with filler.
  - Give each field real substance: `intro` at least two full sentences,
    `overview` a full paragraph, `quote` a pointed specific claim. Banned
    filler: "modern", "clean", "seamless", "innovative" and their German
    equivalents, unless backed by a concrete detail in the same sentence.
  - Both locales get the same level of detail; `en` is a full translation,
    never a shortened summary of `de`.
  - The em-dash ban above applies to every drafted string in both locales.
- For fields NOT derivable from code (`cat`, `yr`, cover-image path, and
  anything required that the scan left blank) use **AskUserQuestion**. Do not
  invent values.
- `cat` and any other short label fields should still be specific: prefer the
  project's actual discipline ("3D Visualization", "E-Commerce") over vague
  catch-alls ("Web", "App").
- Show the full field value mapping to the user before writing files.

### 4. Assign the next free `order`

`order` must be unique (drives list order and prev/next):

- If `PUBLIC_SANITY_PROJECT_ID` is set (env / `.env`): query Sanity for
  existing `order` values (e.g. via a quick `sanity exec` or the API).
- Else: read `order` from every `src/content/projects/*.json`.

Take `max + 1`. Ask the user only if they want the project inserted elsewhere
(then flag that reordering other projects is out of scope for this skill).

### 5. Generate the seed script

Write `studio/scripts/seed-project-<slug>.ts` following the exact pattern of
`studio/scripts/seed-technologies.ts`:

- Header comment stating what it does, that it's **idempotent / safe to
  re-run**, and the run command:
  `Run from studio/:  npx sanity exec scripts/seed-project-<slug>.ts --with-user-token`
- `import { getCliClient } from "sanity/cli"` then
  `getCliClient({ apiVersion: "2024-01-01" })`
- Build one `project` document matching the Sanity schema from step 1
  (include `slug: { _type: "slug", current: "<slug>" }`, `_id:
  "project-<slug>"`, `_type: "project"`; array members need `_key`s).
- Use **`client.createOrReplace(doc)`**, idempotent by `_id`.
- Cover image: if the user gave a local path, upload it first via
  `client.assets.upload("image", createReadStream(path))` and set the returned
  ref on `cover`; otherwise leave a `// TODO: upload cover image in the Studio`
  comment and omit the field.

### 6. Write the JSON fallback

Write `src/content/projects/<slug>.json` with the same content, shaped by the
Zod schema from step 1 (filename = slug = URL `/work/<slug>`; no `slug` field
in JSON; `cover`/`gallery.image` are string paths or omitted; `gallery` needs
at least 1 entry, and a placeholder shot with just `label` + `span` is valid).

### 7. Verify + handoff checklist

Run and require both to pass (`npm run build` validates the JSON against the
content schema):

```bash
npm test
npm run build
```

Then end with this checklist for the user:

- [ ] `cd studio && npx sanity exec scripts/seed-project-<slug>.ts --with-user-token`
- [ ] Review the drafted DE/EN copy in the Studio (it's machine-drafted)
- [ ] Upload cover (if not seeded) + gallery images in the Studio
- [ ] Publish: the Sanity webhook triggers the redeploy
