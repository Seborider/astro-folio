/**
 * One-off seed: read the logo SVGs from a local folder, normalize them for
 * the inline carousel (no fixed size, currentColor fills so they follow the
 * text color / theme), and write them into aboutPage.technologies
 * (published + draft). Safe to re-run.
 *
 * Run from studio/:  npx sanity exec scripts/seed-technologies.ts --with-user-token
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2024-01-01" });

const DIR = "/Users/sebo/Downloads/Neuer Ordner";
const ABOUT_ID = "a9ad504d-f6c3-44bb-8183-25a536523b69";

// display order: core stack → backend → ops → tools
const FILES: [string, string][] = [
  ["typescript-official-svgrepo-com.svg", "TypeScript"],
  ["react-svgrepo-com.svg", "React"],
  ["expo-svgrepo-com.svg", "Expo"],
  ["angular-svgrepo-com.svg", "Angular"],
  ["node-svgrepo-com.svg", "Node.js"],
  ["express-svgrepo-com.svg", "Express"],
  ["next-js-svgrepo-com.svg", "Next.js"],
  ["html-svgrepo-com.svg", "HTML"],
  ["css-svgrepo-com.svg", "CSS"],
  ["python-127-svgrepo-com.svg", "Python"],
  ["rust-svgrepo-com.svg", "Rust"],
  ["rails-svgrepo-com.svg", "Ruby on Rails"],
  ["sql-file-format-svgrepo-com.svg", "SQL"],
  ["mongodb-svgrepo-com.svg", "MongoDB"],
  ["storybook-svgrepo-com.svg", "Storybook"],
  ["git-svgrepo-com.svg", "Git"],
  ["docker-svgrepo-com.svg", "Docker"],
  ["kubernetes-svgrepo-com.svg", "Kubernetes"],
  ["jenkins-svgrepo-com.svg", "Jenkins"],
  ["ansible-svgrepo-com.svg", "Ansible"],
  ["rancher-svgrepo-com.svg", "Rancher"],
  ["proxmox-svgrepo-com.svg", "Proxmox"],
  ["grafana-svgrepo-com.svg", "Grafana"],
  ["graylog-svgrepo-com.svg", "Graylog"],
  ["figma-svgrepo-com.svg", "Figma"],
  ["claude.svg", "Claude"],
];

function normalize(raw: string): string {
  return (
    raw
      .replace(/<\?xml[^?]*\?>/g, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<title>[\s\S]*?<\/title>/g, "")
      // fixed 800px canvas — the carousel CSS sizes via viewBox instead.
      // Root tag only: inner <rect> elements need their width/height.
      .replace(/<svg[^>]*>/, (tag) =>
        tag.replace(/\s(?:width|height)="[^"]*"/g, ""),
      )
      // white stays a knockout (TS letters) but must follow the theme
      .replace(/(fill:\s*|fill=")#(?:fff|ffffff)\b/gi, "$1var(--bg)")
      // any other hardcoded color → currentColor (fill="none" untouched)
      .replace(/fill="#[0-9a-fA-F]{3,8}"/g, 'fill="currentColor"')
      .replace(/fill:\s*#[0-9a-fA-F]{3,8}/g, "fill:currentColor")
      .replace(/stroke="#[0-9a-fA-F]{3,8}"/g, 'stroke="currentColor"')
      .replace(/stroke:\s*#[0-9a-fA-F]{3,8}/g, "stroke:currentColor")
      .trim()
  );
}

const technologies = FILES.map(([file, name], i) => ({
  _type: "technology",
  _key: `tech-${i}-${name.toLowerCase().replace(/[^a-z]/g, "")}`,
  name,
  svg: normalize(readFileSync(join(DIR, file), "utf8")),
}));

async function run() {
  const set = { technologies };
  await client.patch(ABOUT_ID).set(set).commit();
  await client.patch(`drafts.${ABOUT_ID}`).set(set).commit();
  console.log(`✓ technologies set (${technologies.length}) on published + draft`);
  for (const t of technologies) {
    const leftover = t.svg.match(/#[0-9a-fA-F]{3,8}\b/g);
    if (leftover) console.warn(`⚠ ${t.name}: hardcoded colors left: ${leftover.join(", ")}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
