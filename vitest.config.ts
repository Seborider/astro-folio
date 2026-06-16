/// <reference types="vitest" />
import { getViteConfig } from "astro/config";

// getViteConfig wires Astro's Vite plugins so virtual modules (astro:content)
// and import.meta.env resolve the same way they do in `astro build`.
export default getViteConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
