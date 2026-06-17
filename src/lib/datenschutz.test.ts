import { describe, it, expect, beforeEach, vi } from "vitest";
import { getDatenschutzPage } from "./datenschutz";

// loadDatenschutzPage switches on sanityConfigured and calls sanityFetch
// (Sanity branch) or returns the per-locale defaults (local branch). Mock
// ./sanity so the network is never touched; sanityConfigured is a getter read
// at call time, so each test can flip the backend in place (mirrors
// impressum.test.ts).
const mocks = vi.hoisted(() => ({
  sanityConfigured: false,
  sanityFetch: vi.fn(),
}));

vi.mock("./sanity", () => ({
  get sanityConfigured() {
    return mocks.sanityConfigured;
  },
  sanityFetch: mocks.sanityFetch,
  // withDefaults (./site) imports imageUrl from ./sanity at module load.
  imageUrl: vi.fn(() => null),
}));

beforeEach(() => {
  mocks.sanityConfigured = false;
  mocks.sanityFetch.mockReset();
});

// ── local defaults backend (Sanity unconfigured) ────────────────────────────
describe("getDatenschutzPage — local defaults", () => {
  it("returns the German defaults for de and never hits the network", async () => {
    const page = await getDatenschutzPage("de");
    expect(page.title).toBe("Datenschutz");
    expect(Array.isArray(page.body)).toBe(true);
    expect(page.body.length).toBeGreaterThan(0);
    expect(mocks.sanityFetch).not.toHaveBeenCalled();
  });

  it("returns the English defaults for en", async () => {
    const page = await getDatenschutzPage("en");
    expect(page.title).toBe("Privacy");
    expect(page.lede).not.toBe((await getDatenschutzPage("de")).lede);
  });

  it("defaults to the de locale when none is passed", async () => {
    const page = await getDatenschutzPage();
    expect(page.title).toBe("Datenschutz");
  });

  it("discloses the Art. 13 legal basis for server logs", async () => {
    const page = await getDatenschutzPage("de");
    expect(page.body.join(" ")).toContain("Art. 6 Abs. 1 lit. f DSGVO");
  });
});

// ── Sanity backend ──────────────────────────────────────────────────────────
// GROQ coalesces the locale objects to flat strings, so the raw doc is flat;
// the en→de fallback lives in the coalesce() projection of the query.
describe("getDatenschutzPage — Sanity backend", () => {
  it("queries with the locale's coalesce fallback and merges the doc", async () => {
    mocks.sanityConfigured = true;
    mocks.sanityFetch.mockResolvedValue({
      metaTitle: "Meta",
      title: "Data protection",
      lede: "From CMS",
      body: ["one", "two"],
    });

    const page = await getDatenschutzPage("en");

    expect(mocks.sanityFetch).toHaveBeenCalledOnce();
    expect(mocks.sanityFetch.mock.calls[0][0]).toContain(
      "coalesce(title.en, title.de)",
    );
    expect(mocks.sanityFetch.mock.calls[0][0]).toContain(
      "coalesce(body.en, body.de)",
    );
    expect(page.title).toBe("Data protection");
    expect(page.body).toEqual(["one", "two"]);
  });

  it("keeps the per-field default when a doc field is null", async () => {
    mocks.sanityConfigured = true;
    mocks.sanityFetch.mockResolvedValue({ title: "Data protection", body: null });

    const page = await getDatenschutzPage("de");
    expect(page.title).toBe("Data protection"); // from doc
    expect(page.body.length).toBeGreaterThan(0); // default kept (body was null)
  });

  it("falls back to the full defaults when the document is missing", async () => {
    mocks.sanityConfigured = true;
    mocks.sanityFetch.mockResolvedValue(null);

    const page = await getDatenschutzPage("de");
    expect(page.title).toBe("Datenschutz");
  });

  it("uses coalesce(field.de, field.de) when defaulting to de", async () => {
    mocks.sanityConfigured = true;
    mocks.sanityFetch.mockResolvedValue(null);
    await getDatenschutzPage();
    expect(mocks.sanityFetch.mock.calls[0][0]).toContain(
      "coalesce(title.de, title.de)",
    );
  });
});
