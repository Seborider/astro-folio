/**
 * jsonld.ts — schema.org structured-data builders (pure, no Astro deps).
 * Pages resolve absolute URLs/strings and pass them in; these return plain
 * JSON-LD objects. Serialize with serializeJsonLd() before set:html — it
 * escapes "<" so the JSON can't break out of the <script> tag.
 */

interface PersonInput {
  name: string;
  url: string;
  jobTitle: string;
  sameAs?: string[]; // other profiles; non-http entries (e.g. "#") are dropped
  image?: string | null;
}

export function personSchema(i: PersonInput) {
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: i.name,
    url: i.url,
    jobTitle: i.jobTitle,
  };
  if (i.image) node.image = i.image;
  const sameAs = (i.sameAs ?? []).filter((u) => /^https?:\/\//.test(u));
  if (sameAs.length) node.sameAs = sameAs;
  return node;
}

interface WebSiteInput {
  name: string;
  url: string;
  inLanguage: string;
}

export function webSiteSchema(i: WebSiteInput) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: i.name,
    url: i.url,
    inLanguage: i.inLanguage,
  };
}

interface CreativeWorkInput {
  name: string;
  url: string;
  description?: string;
  image?: string | null;
  dateCreated?: string;
  inLanguage: string;
  author: { name: string; url: string };
}

export function creativeWorkSchema(i: CreativeWorkInput) {
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: i.name,
    url: i.url,
    inLanguage: i.inLanguage,
    author: { "@type": "Person", name: i.author.name, url: i.author.url },
  };
  if (i.description) node.description = i.description;
  if (i.image) node.image = i.image;
  if (i.dateCreated) node.dateCreated = i.dateCreated;
  return node;
}

export function serializeJsonLd(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c") // can't break out of the <script> tag
    .replace(/\u2028/g, "\\u2028") // line/paragraph separators are valid JSON
    .replace(/\u2029/g, "\\u2029"); // but break inline <script> parsing
}
