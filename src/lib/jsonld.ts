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
  alternateName?: string; // legal/full name, emitted when set
  address?: { locality: string; region: string; country: string };
  alumniOf?: string; // institution name; emitted when set
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
  if (i.alternateName) node.alternateName = i.alternateName;
  if (i.image) node.image = i.image;
  if (i.address)
    node.address = {
      "@type": "PostalAddress",
      addressLocality: i.address.locality,
      addressRegion: i.address.region,
      addressCountry: i.address.country,
    };
  if (i.alumniOf)
    node.alumniOf = { "@type": "EducationalOrganization", name: i.alumniOf };
  const sameAs = (i.sameAs ?? []).filter((u) => /^https?:\/\//.test(u));
  if (sameAs.length) node.sameAs = sameAs;
  return node;
}

interface ProfilePageInput {
  url: string;
  inLanguage: string;
  mainEntity: object; // typically a personSchema() node
}

export function profilePageSchema(i: ProfilePageInput) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: i.url,
    inLanguage: i.inLanguage,
    mainEntity: i.mainEntity,
  };
}

interface CollectionPageInput {
  name: string;
  url: string;
  inLanguage: string;
  items: { name: string; url: string }[]; // already in display order
}

export function collectionPageSchema(i: CollectionPageInput) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: i.name,
    url: i.url,
    inLanguage: i.inLanguage,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: i.items.map((it, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: it.url,
        name: it.name,
      })),
    },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: it.name,
      item: it.url,
    })),
  };
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
  keywords?: string[]; // e.g. technologies; joined, emitted when non-empty
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
  if (i.keywords && i.keywords.length) node.keywords = i.keywords.join(", ");
  return node;
}

export function serializeJsonLd(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c") // can't break out of the <script> tag
    .replace(/\u2028/g, "\\u2028") // line/paragraph separators are valid JSON
    .replace(/\u2029/g, "\\u2029"); // but break inline <script> parsing
}
