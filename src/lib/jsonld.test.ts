import { describe, it, expect } from "vitest";
import {
  personSchema,
  webSiteSchema,
  creativeWorkSchema,
  profilePageSchema,
  collectionPageSchema,
  breadcrumbSchema,
  serializeJsonLd,
} from "./jsonld";

describe("personSchema", () => {
  const base = {
    name: "Sebo Mayer",
    url: "https://x.test/",
    jobTitle: "Web & Mobile Developer",
  };

  it("carries the core identity fields", () => {
    const p = personSchema(base);
    expect(p["@type"]).toBe("Person");
    expect(p["@context"]).toBe("https://schema.org");
    expect(p.name).toBe("Sebo Mayer");
    expect(p.url).toBe("https://x.test/");
    expect(p.jobTitle).toBe("Web & Mobile Developer");
  });

  it("keeps only http(s) sameAs profiles, dropping placeholders", () => {
    const p = personSchema({
      ...base,
      sameAs: ["#", "", "https://github.com/seb", "mailto:x@y.z"],
    });
    expect(p.sameAs).toEqual(["https://github.com/seb"]);
  });

  it("omits sameAs entirely when no real profiles remain", () => {
    const p = personSchema({ ...base, sameAs: ["#", "#"] });
    expect("sameAs" in p).toBe(false);
  });

  it("omits image when null/absent", () => {
    expect("image" in personSchema(base)).toBe(false);
    expect("image" in personSchema({ ...base, image: null })).toBe(false);
    expect(personSchema({ ...base, image: "https://x.test/p.png" }).image).toBe(
      "https://x.test/p.png",
    );
  });

  it("adds alternateName only when set", () => {
    expect("alternateName" in personSchema(base)).toBe(false);
    expect(
      personSchema({ ...base, alternateName: "Sebastian Mayer-Murschall" })
        .alternateName,
    ).toBe("Sebastian Mayer-Murschall");
  });

  it("builds a PostalAddress node when address is given, else omits it", () => {
    expect("address" in personSchema(base)).toBe(false);
    const p = personSchema({
      ...base,
      address: { locality: "Tittmoning", region: "Bavaria", country: "DE" },
    });
    expect(p.address).toEqual({
      "@type": "PostalAddress",
      addressLocality: "Tittmoning",
      addressRegion: "Bavaria",
      addressCountry: "DE",
    });
  });

  it("builds an EducationalOrganization for alumniOf only when set", () => {
    expect("alumniOf" in personSchema(base)).toBe(false);
    expect(personSchema({ ...base, alumniOf: "HTL Salzburg" }).alumniOf).toEqual({
      "@type": "EducationalOrganization",
      name: "HTL Salzburg",
    });
  });
});

describe("profilePageSchema", () => {
  it("wraps a mainEntity with page metadata", () => {
    const person = personSchema({
      name: "Sebo Mayer",
      url: "https://x.test/",
      jobTitle: "Web & Mobile Developer",
    });
    const page = profilePageSchema({
      url: "https://x.test/about/",
      inLanguage: "de",
      mainEntity: person,
    });
    expect(page["@type"]).toBe("ProfilePage");
    expect(page.url).toBe("https://x.test/about/");
    expect(page.inLanguage).toBe("de");
    expect(page.mainEntity).toBe(person);
  });
});

describe("collectionPageSchema", () => {
  it("builds an ordered ItemList as mainEntity", () => {
    const page = collectionPageSchema({
      name: "Projects",
      url: "https://x.test/work/",
      inLanguage: "en",
      items: [
        { name: "Alpha", url: "https://x.test/work/alpha/" },
        { name: "Beta", url: "https://x.test/work/beta/" },
      ],
    });
    expect(page["@type"]).toBe("CollectionPage");
    const list = page.mainEntity as {
      "@type": string;
      itemListElement: unknown[];
    };
    expect(list["@type"]).toBe("ItemList");
    expect(list.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        url: "https://x.test/work/alpha/",
        name: "Alpha",
      },
      {
        "@type": "ListItem",
        position: 2,
        url: "https://x.test/work/beta/",
        name: "Beta",
      },
    ]);
  });
});

describe("breadcrumbSchema", () => {
  it("numbers crumbs from 1 with item URLs", () => {
    const bc = breadcrumbSchema([
      { name: "Sebo Mayer", url: "https://x.test/" },
      { name: "Projects", url: "https://x.test/work/" },
      { name: "Alpha", url: "https://x.test/work/alpha/" },
    ]);
    expect(bc["@type"]).toBe("BreadcrumbList");
    expect(bc.itemListElement).toHaveLength(3);
    expect(bc.itemListElement[2]).toEqual({
      "@type": "ListItem",
      position: 3,
      name: "Alpha",
      item: "https://x.test/work/alpha/",
    });
  });
});

describe("webSiteSchema", () => {
  it("builds a WebSite node with language", () => {
    const w = webSiteSchema({
      name: "Sebo Mayer",
      url: "https://x.test/en/",
      inLanguage: "en",
    });
    expect(w["@type"]).toBe("WebSite");
    expect(w.inLanguage).toBe("en");
    expect(w.url).toBe("https://x.test/en/");
  });
});

describe("creativeWorkSchema", () => {
  const base = {
    name: "Sprudelludi",
    url: "https://x.test/work/sprudelludi",
    inLanguage: "de",
    author: { name: "Sebo Mayer", url: "https://x.test/" },
  };

  it("nests the author as a Person", () => {
    const c = creativeWorkSchema(base);
    expect(c["@type"]).toBe("CreativeWork");
    expect(c.author).toEqual({
      "@type": "Person",
      name: "Sebo Mayer",
      url: "https://x.test/",
    });
  });

  it("omits optional fields when absent and includes them when present", () => {
    const bare = creativeWorkSchema(base);
    expect("description" in bare).toBe(false);
    expect("image" in bare).toBe(false);
    expect("dateCreated" in bare).toBe(false);

    const full = creativeWorkSchema({
      ...base,
      description: "A fizzy thing",
      image: "https://cdn.test/c.png",
      dateCreated: "2024",
    });
    expect(full.description).toBe("A fizzy thing");
    expect(full.image).toBe("https://cdn.test/c.png");
    expect(full.dateCreated).toBe("2024");
  });

  it("joins keywords when present, omits them when empty", () => {
    expect("keywords" in creativeWorkSchema(base)).toBe(false);
    expect("keywords" in creativeWorkSchema({ ...base, keywords: [] })).toBe(
      false,
    );
    expect(
      creativeWorkSchema({ ...base, keywords: ["Astro", "GSAP"] }).keywords,
    ).toBe("Astro, GSAP");
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so the JSON cannot break out of a <script> tag", () => {
    const out = serializeJsonLd({ x: "</script><b>hi" });
    expect(out).not.toContain("</script>");
    expect(out).toContain("\\u003c/script>");
  });

  it("escapes U+2028 / U+2029 which break inline <script> parsing", () => {
    const out = serializeJsonLd({ x: "a\u2028b\u2029c" });
    expect(out).not.toContain("\u2028");
    expect(out).not.toContain("\u2029");
    expect(out).toContain("\\u2028");
    expect(out).toContain("\\u2029");
  });
});
