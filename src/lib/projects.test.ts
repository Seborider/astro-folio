import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getProjects,
  neighbours,
  reelTileTarget,
  resolveLedeLink,
  tagToken,
  resolveTags,
  tagUnion,
  type Project,
  type Tag,
} from "./projects";

// loadProjects switches on sanityConfigured and calls sanityFetch/imageUrl
// (Sanity branch) or getCollection (local JSON branch). Mock both modules so
// neither the network nor astro:content is touched. sanityConfigured is a
// getter read at call time, so each test can flip the backend in place.
const mocks = vi.hoisted(() => ({
  sanityConfigured: false,
  sanityFetch: vi.fn(),
  imageUrl: vi.fn((ref?: string, opts?: { w?: number }) =>
    ref ? `url:${ref}:${opts?.w}` : null,
  ),
  getCollection: vi.fn(),
}));

vi.mock("./sanity", () => ({
  get sanityConfigured() {
    return mocks.sanityConfigured;
  },
  sanityFetch: mocks.sanityFetch,
  imageUrl: mocks.imageUrl,
}));

vi.mock("astro:content", () => ({
  getCollection: mocks.getCollection,
}));

beforeEach(() => {
  mocks.sanityConfigured = false;
  mocks.sanityFetch.mockReset();
  mocks.getCollection.mockReset();
  mocks.imageUrl.mockClear();
});

// ── neighbours ────────────────────────────────────────────────────────────
const p = (id: string): Project =>
  ({ id, order: 0, name: id }) as unknown as Project;

const list = [p("a"), p("b"), p("c")];

describe("neighbours", () => {
  it("returns the adjacent items in the middle of the list", () => {
    const { prev, next } = neighbours(list, 1);
    expect(prev.id).toBe("a");
    expect(next.id).toBe("c");
  });

  it("has no prev on the first item", () => {
    const { prev, next } = neighbours(list, 0);
    expect(prev).toBeUndefined();
    expect(next.id).toBe("b");
  });

  it("has no next on the last item", () => {
    const { prev, next } = neighbours(list, 2);
    expect(prev.id).toBe("b");
    expect(next).toBeUndefined();
  });

  it("has neither neighbour in a 1-item list", () => {
    const { prev, next } = neighbours([p("solo")], 0);
    expect(prev).toBeUndefined();
    expect(next).toBeUndefined();
  });

  it("has neither neighbour for an empty list", () => {
    const { prev, next } = neighbours([], 0);
    expect(prev).toBeUndefined();
    expect(next).toBeUndefined();
  });
});

// ── resolveLedeLink ─────────────────────────────────────────────────────────
describe("resolveLedeLink", () => {
  it("returns undefined for an absent url", () => {
    expect(resolveLedeLink(undefined)).toBeUndefined();
    expect(resolveLedeLink(null)).toBeUndefined();
    expect(resolveLedeLink("")).toBeUndefined();
  });

  it("uses the host as the label for a valid url", () => {
    expect(resolveLedeLink("https://www.example.com/case")).toEqual({
      url: "https://www.example.com/case",
      label: "www.example.com",
    });
  });

  it("falls back to the raw string when the url is malformed", () => {
    expect(resolveLedeLink("not a url")).toEqual({
      url: "not a url",
      label: "not a url",
    });
  });
});

// ── reelTileTarget ──────────────────────────────────────────────────────────
const named = (id: string, name: string): Project =>
  ({ id, order: 0, name }) as unknown as Project;

describe("reelTileTarget", () => {
  const projects = [named("a", "Alpha"), named("b", "Beta")];
  const projectsAlt = [named("a", "Alpha-en"), named("b", "Beta-en")];

  it("resolves a matching slug to its id and localized names", () => {
    expect(reelTileTarget(projects, projectsAlt, "b")).toEqual({
      id: "b",
      name: "Beta",
      nameAlt: "Beta-en",
    });
  });

  it("falls back to the resolved-locale name when the alt is missing", () => {
    expect(reelTileTarget(projects, [named("a", "Alpha-en")], "b")).toEqual({
      id: "b",
      name: "Beta",
      nameAlt: "Beta",
    });
  });

  it("returns null when the tile has no project set", () => {
    expect(reelTileTarget(projects, projectsAlt, null)).toBeNull();
    expect(reelTileTarget(projects, projectsAlt, undefined)).toBeNull();
  });

  it("returns null when the slug no longer matches a project", () => {
    expect(reelTileTarget(projects, projectsAlt, "gone")).toBeNull();
  });
});

// ── getProjects: local JSON fallback (Sanity unconfigured) ──────────────────
// Shape mirrors a content-collection entry: { id, data } where data matches
// the Zod schema (localized { de, en? } objects).
function entry(id: string, order: number, over: Record<string, unknown> = {}) {
  return {
    id,
    data: {
      order,
      yr: "2026",
      name: { de: `${id}-de` },
      cat: { de: "Brand" },
      role: { de: "Role" },
      client: { de: "Client" },
      services: { de: ["service-de"] },
      intro: { de: "intro-de" },
      overview: { de: ["para-de"] },
      cover: undefined,
      gallery: [{ label: { de: "shot-de" }, span: "full", image: undefined }],
      ...over,
    },
  };
}

describe("getProjects — local JSON fallback", () => {
  it("sorts by order and applies the en→de fallback per field", async () => {
    mocks.getCollection.mockResolvedValue([
      entry("b", 2, { name: { de: "Bravo" } }), // no en → falls back
      entry("a", 1, {
        name: { de: "Alpha-de", en: "Alpha-en" },
        services: { de: ["de-svc"], en: ["en-svc"] },
      }),
    ]);
    const result = await getProjects("en");

    expect(result.map((r) => r.id)).toEqual(["a", "b"]); // order asc
    expect(result[0].name).toBe("Alpha-en"); // en present
    expect(result[0].services).toEqual(["en-svc"]);
    expect(result[1].name).toBe("Bravo"); // en missing → de
    expect(result[1].services).toEqual(["service-de"]);
    expect(result[0].coverThumb).toBe(result[0].cover); // JSON: same url, no resizing
  });

  it("requests the local collection, not the network", async () => {
    mocks.getCollection.mockResolvedValue([entry("a", 1)]);
    await getProjects("de");
    expect(mocks.getCollection).toHaveBeenCalledWith("projects");
    expect(mocks.sanityFetch).not.toHaveBeenCalled();
  });

  it("leaves quote undefined when the field is absent", async () => {
    mocks.getCollection.mockResolvedValue([entry("a", 1)]);
    const [project] = await getProjects("de");
    expect(project.quote).toBeUndefined();
  });

  it("resolves quote when present", async () => {
    mocks.getCollection.mockResolvedValue([
      entry("a", 1, { quote: { de: ["q-de"], en: ["q-en"] } }),
    ]);
    const [project] = await getProjects("en");
    expect(project.quote).toEqual(["q-en"]);
  });

  it("resolves technologies with the en→de fallback, [] when absent", async () => {
    mocks.getCollection.mockResolvedValue([
      entry("a", 1, {
        technologies: { de: ["Astro-de"], en: ["Astro-en"] },
      }),
      entry("b", 2, { technologies: { de: ["GSAP"] } }), // no en → de
      entry("c", 3), // field absent → []
    ]);
    const result = await getProjects("en");
    expect(result[0].technologies).toEqual(["Astro-en"]);
    expect(result[1].technologies).toEqual(["GSAP"]);
    expect(result[2].technologies).toEqual([]);
  });

  it("leaves ledeLink undefined when the field is absent", async () => {
    mocks.getCollection.mockResolvedValue([entry("a", 1)]);
    const [project] = await getProjects("de");
    expect(project.ledeLink).toBeUndefined();
  });

  it("maps video when present, null when absent (not localized)", async () => {
    mocks.getCollection.mockResolvedValue([
      entry("a", 1, { video: "/clip.mp4" }),
      entry("b", 2), // no video → null
    ]);
    const result = await getProjects("en");
    expect(result[0].video).toBe("/clip.mp4");
    expect(result[1].video).toBeNull();
  });

  it("derives the host as the ledeLink text", async () => {
    mocks.getCollection.mockResolvedValue([
      entry("a", 1, { ledeLink: "https://studio.example.com/x" }),
    ]);
    const [project] = await getProjects("de");
    expect(project.ledeLink).toEqual({
      url: "https://studio.example.com/x",
      label: "studio.example.com",
    });
  });

  it("localizes gallery labels and passes images through verbatim", async () => {
    mocks.getCollection.mockResolvedValue([
      entry("a", 1, {
        gallery: [
          { label: { de: "voll", en: "full" }, span: "full", image: "/g1.jpg" },
          { label: { de: "halb" }, span: "half", image: undefined },
        ],
      }),
    ]);
    const [project] = await getProjects("en");
    expect(project.gallery).toEqual([
      { label: "full", span: "full", image: "/g1.jpg" },
      { label: "halb", span: "half", image: undefined }, // de fallback
    ]);
  });

  it("maps tags with locale labels and de-derived tokens, [] when absent", async () => {
    mocks.getCollection.mockResolvedValue([
      entry("a", 1, { tags: { de: ["Marke"], en: ["Brand"] } }),
      entry("b", 2, { tags: { de: ["Motion"] } }), // no en → de labels
      entry("c", 3), // field absent → []
    ]);
    const result = await getProjects("en");
    expect(result[0].tags).toEqual([{ token: "marke", label: "Brand" }]);
    expect(result[1].tags).toEqual([{ token: "motion", label: "Motion" }]);
    expect(result[2].tags).toEqual([]);
  });

  it("returns an empty list when the collection is empty", async () => {
    mocks.getCollection.mockResolvedValue([]);
    expect(await getProjects("de")).toEqual([]);
  });
});

// ── getProjects: Sanity backend ─────────────────────────────────────────────
// GROQ already coalesces locale objects to flat strings, so the raw rows are
// flat; loadProjects only resolves image refs to CDN urls.
describe("getProjects — Sanity backend", () => {
  const row = (over: Record<string, unknown> = {}) => ({
    id: "x",
    order: 1,
    yr: "2026",
    name: "X",
    cat: "Brand",
    role: "R",
    client: "C",
    services: ["s"],
    intro: "i",
    overview: ["o"],
    quote: ["q"],
    cover: "cover-ref",
    gallery: [
      { label: "full shot", span: "full", image: "g1" },
      { label: "half shot", span: "half", image: "g2" },
    ],
    ...over,
  });

  it("queries with the locale and resolves cover + gallery image urls", async () => {
    mocks.sanityConfigured = true;
    mocks.sanityFetch.mockResolvedValue([row()]);
    const [project] = await getProjects("en");

    expect(mocks.sanityFetch).toHaveBeenCalledOnce();
    expect(mocks.sanityFetch.mock.calls[0][0]).toContain(
      "coalesce(name.en, name.de)",
    );
    expect(mocks.getCollection).not.toHaveBeenCalled();

    expect(project.name).toBe("X"); // GROQ already coalesced
    expect(project.cover).toBe("url:cover-ref:2200");
    expect(project.coverThumb).toBe("url:cover-ref:800");
    // full → 2200, half → 1200
    expect(project.gallery[0].image).toBe("url:g1:2200");
    expect(project.gallery[1].image).toBe("url:g2:1200");
  });

  it("derives the host as the ledeLink text", async () => {
    mocks.sanityConfigured = true;
    mocks.sanityFetch.mockResolvedValue([
      row({ ledeLink: "https://example.com/x" }),
    ]);
    const [project] = await getProjects("en");
    expect(project.ledeLink).toEqual({
      url: "https://example.com/x",
      label: "example.com",
    });
  });

  it("passes technologies through, [] when missing", async () => {
    mocks.sanityConfigured = true;
    mocks.sanityFetch.mockResolvedValue([
      row({ technologies: ["Astro", "GSAP"] }),
      row({ technologies: null }), // coalesce yields null when absent
    ]);
    const result = await getProjects("en");
    expect(result[0].technologies).toEqual(["Astro", "GSAP"]);
    expect(result[1].technologies).toEqual([]);
  });

  it("leaves ledeLink undefined when the field is missing", async () => {
    mocks.sanityConfigured = true;
    mocks.sanityFetch.mockResolvedValue([row({ ledeLink: null })]);
    const [project] = await getProjects("de");
    expect(project.ledeLink).toBeUndefined();
  });

  it("maps the resolved video url, null when absent", async () => {
    mocks.sanityConfigured = true;
    mocks.sanityFetch.mockResolvedValue([
      row({ video: "https://cdn.sanity.io/files/x/y.mp4" }),
      row({ video: null }), // video.asset->url yields null when absent
    ]);
    const result = await getProjects("en");
    expect(result[0].video).toBe("https://cdn.sanity.io/files/x/y.mp4");
    expect(result[1].video).toBeNull();
  });

  it("yields a null cover and empty gallery when those fields are missing", async () => {
    mocks.sanityConfigured = true;
    mocks.sanityFetch.mockResolvedValue([
      row({ cover: undefined, gallery: null }),
    ]);
    const [project] = await getProjects("de");
    expect(project.cover).toBeNull();
    expect(project.gallery).toEqual([]);
  });

  it("maps tags from coalesced labels + de tokens, [] when null", async () => {
    mocks.sanityConfigured = true;
    mocks.sanityFetch.mockResolvedValue([
      row({ tags: ["Brand EN"], tagsDe: ["Marke"] }),
      row({ tags: null, tagsDe: null }), // coalesce yields null when absent
    ]);
    const result = await getProjects("en");
    expect(result[0].tags).toEqual([{ token: "marke", label: "Brand EN" }]);
    expect(result[1].tags).toEqual([]);
    // raw tagsDe must not leak into the Project shape
    expect("tagsDe" in result[0]).toBe(false);
    // projection carries both the coalesced labels and the de token source
    expect(mocks.sanityFetch.mock.calls[0][0]).toContain(
      "coalesce(tags.en, tags.de)",
    );
    expect(mocks.sanityFetch.mock.calls[0][0]).toContain('"tagsDe": tags.de');
  });

  it("defaults to the de locale when none is passed", async () => {
    mocks.sanityConfigured = true;
    mocks.sanityFetch.mockResolvedValue([row()]);
    await getProjects();
    expect(mocks.sanityFetch.mock.calls[0][0]).toContain(
      "coalesce(name.de, name.de)",
    );
  });
});

// ── tags: tagToken / resolveTags / tagUnion ─────────────────────────────────
describe("tagToken", () => {
  it("slugs to lowercase with hyphens", () => {
    expect(tagToken("Title Design")).toBe("title-design");
  });

  it("strips diacritics", () => {
    expect(tagToken("Identität")).toBe("identitat");
  });

  it("collapses punctuation runs and trims edge hyphens", () => {
    expect(tagToken(" 3D / Motion ")).toBe("3d-motion");
  });
});

describe("resolveTags", () => {
  it("returns [] for absent lists", () => {
    expect(resolveTags(undefined, undefined)).toEqual([]);
    expect(resolveTags(null, null)).toEqual([]);
  });

  it("derives tokens from the de labels, keeps locale-resolved labels", () => {
    expect(resolveTags(["Editorial EN"], ["Redaktion"])).toEqual([
      { token: "redaktion", label: "Editorial EN" },
    ]);
  });

  it("falls back to the label itself when the de entry is missing", () => {
    expect(resolveTags(["Brand", "Extra"], ["Brand"])).toEqual([
      { token: "brand", label: "Brand" },
      { token: "extra", label: "Extra" },
    ]);
  });
});

describe("tagUnion", () => {
  const proj = (...tags: Tag[]) => ({ tags });

  it("unions by token in encounter order; first label wins", () => {
    const u = tagUnion([
      proj(
        { token: "brand", label: "Brand" },
        { token: "motion", label: "Motion" },
      ),
      proj({ token: "brand", label: "Brand (dupe)" }),
      proj({ token: "digital", label: "Digital" }),
    ]);
    expect(u).toEqual([
      { token: "brand", label: "Brand" },
      { token: "motion", label: "Motion" },
      { token: "digital", label: "Digital" },
    ]);
  });

  it("is empty when no project has tags", () => {
    expect(tagUnion([proj(), proj()])).toEqual([]);
  });
});
