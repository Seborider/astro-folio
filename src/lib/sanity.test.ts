import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// PROJECT_ID / DATASET are captured into module-level consts at import time,
// so each case stubs env *then* re-imports the module to exercise that branch.
async function loadSanity(env: Record<string, string> = {}) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return import("./sanity");
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("imageUrl (configured)", () => {
  const ENV = { PUBLIC_SANITY_PROJECT_ID: "p123", PUBLIC_SANITY_DATASET: "production" };

  it("builds a CDN url from a valid asset ref", async () => {
    const { imageUrl } = await loadSanity(ENV);
    expect(imageUrl("image-abc123-800x600-jpg")).toBe(
      "https://cdn.sanity.io/images/p123/production/abc123-800x600.jpg?auto=format&fit=max",
    );
  });

  it("appends w and h query params when provided", async () => {
    const { imageUrl } = await loadSanity(ENV);
    expect(imageUrl("image-abc123-800x600-jpg", { w: 1200, h: 400 })).toBe(
      "https://cdn.sanity.io/images/p123/production/abc123-800x600.jpg?auto=format&fit=max&w=1200&h=400",
    );
  });

  it("uses the configured dataset", async () => {
    const { imageUrl } = await loadSanity({
      PUBLIC_SANITY_PROJECT_ID: "p123",
      PUBLIC_SANITY_DATASET: "staging",
    });
    expect(imageUrl("image-abc123-800x600-jpg")).toContain("/images/p123/staging/");
  });

  it("returns null for undefined or empty ref", async () => {
    const { imageUrl } = await loadSanity(ENV);
    expect(imageUrl(undefined)).toBeNull();
    expect(imageUrl("")).toBeNull();
  });

  it("returns null for a malformed ref (missing parts)", async () => {
    const { imageUrl } = await loadSanity(ENV);
    expect(imageUrl("image-abc123")).toBeNull();
    expect(imageUrl("notanimage")).toBeNull();
  });
});

describe("imageUrl (unconfigured)", () => {
  it("returns null when PROJECT_ID is unset, even for a valid ref", async () => {
    const { imageUrl } = await loadSanity({ PUBLIC_SANITY_PROJECT_ID: "" });
    expect(imageUrl("image-abc123-800x600-jpg")).toBeNull();
  });
});

describe("sanityConfigured", () => {
  it("is true when PROJECT_ID is set, false otherwise", async () => {
    expect((await loadSanity({ PUBLIC_SANITY_PROJECT_ID: "p123" })).sanityConfigured).toBe(true);
    expect((await loadSanity({ PUBLIC_SANITY_PROJECT_ID: "" })).sanityConfigured).toBe(false);
  });
});

describe("sanityFetch", () => {
  it("throws when PROJECT_ID is unset (never hits the network)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { sanityFetch } = await loadSanity({ PUBLIC_SANITY_PROJECT_ID: "" });
    await expect(sanityFetch("*[_type=='project']")).rejects.toThrow(
      /not configured/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("builds the query url and returns json.result", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ result: [{ id: "a" }] }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const { sanityFetch } = await loadSanity({
      PUBLIC_SANITY_PROJECT_ID: "p123",
      PUBLIC_SANITY_DATASET: "production",
    });

    const query = "*[_type=='project']";
    const res = await sanityFetch<{ id: string }[]>(query);

    expect(res).toEqual([{ id: "a" }]);
    expect(fetchMock).toHaveBeenCalledOnce();
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("https://p123.");
    expect(url).toContain(".sanity.io/v2024-01-01/data/query/production?query=");
    expect(url).toContain(encodeURIComponent(query));
  });

  it("uses the configured dataset in the path", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ result: null }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const { sanityFetch } = await loadSanity({
      PUBLIC_SANITY_PROJECT_ID: "p123",
      PUBLIC_SANITY_DATASET: "staging",
    });
    await sanityFetch("*");
    expect(fetchMock.mock.calls[0][0]).toContain("/data/query/staging?query=");
  });

  it("throws with status text on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500, statusText: "Server Error" })),
    );
    const { sanityFetch } = await loadSanity({ PUBLIC_SANITY_PROJECT_ID: "p123" });
    await expect(sanityFetch("*")).rejects.toThrow(
      /Sanity query failed: 500 Server Error/,
    );
  });
});
