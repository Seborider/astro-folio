import { afterEach, describe, expect, it, vi } from "vitest";
import { memoByLocale } from "./memo";
import type { Locale } from "../i18n";

afterEach(() => vi.unstubAllEnvs());

describe("memoByLocale", () => {
  it("memoizes per locale outside dev", async () => {
    vi.stubEnv("DEV", false);
    const load = vi.fn(async (l: Locale) => `v-${l}`);
    const get = memoByLocale(load);
    await get("de");
    await get("de");
    await get("en");
    expect(load).toHaveBeenCalledTimes(2);
    await expect(get("en")).resolves.toBe("v-en");
  });

  it("defaults to the default locale", async () => {
    vi.stubEnv("DEV", false);
    const load = vi.fn(async (l: Locale) => l);
    const get = memoByLocale(load);
    await expect(get()).resolves.toBe("de");
  });

  it("always reloads in dev", async () => {
    vi.stubEnv("DEV", true);
    const load = vi.fn(async (l: Locale) => l);
    const get = memoByLocale(load);
    await get("de");
    await get("de");
    expect(load).toHaveBeenCalledTimes(2);
  });
});
