import { describe, it, expect, beforeEach, vi } from "vitest";
import { getProjects, neighbours, type Project } from "./projects";

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
    // full → 2200, half → 1200
    expect(project.gallery[0].image).toBe("url:g1:2200");
    expect(project.gallery[1].image).toBe("url:g2:1200");
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

  it("defaults to the de locale when none is passed", async () => {
    mocks.sanityConfigured = true;
    mocks.sanityFetch.mockResolvedValue([row()]);
    await getProjects();
    expect(mocks.sanityFetch.mock.calls[0][0]).toContain(
      "coalesce(name.de, name.de)",
    );
  });
});
