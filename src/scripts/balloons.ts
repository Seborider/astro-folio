/**
 * Bootstrap for the balloon hero. Stays light (no three import) so the heavy
 * scene chunk only loads when the hero is actually on screen. Reads the title
 * text straight from the server-rendered <h1>, so the DOM stays the source of
 * truth for SEO / screen readers and the CSS hero is the fallback.
 */
import type { BalloonHandle } from "./balloons-scene";

export function initBalloons(): void {
  const hero = document.querySelector<HTMLElement>(".hero");
  const canvas = document.querySelector<HTMLCanvasElement>("#heroCanvas");
  const title = document.querySelector<HTMLElement>(".hero__title");
  const resetBtn = document.querySelector<HTMLButtonElement>("#heroReset");
  // An inline head script hides the <h1> from first paint via .balloons-pending
  // (no serif flicker); reveal it again whenever balloons won't actually run.
  const reveal = () => document.documentElement.classList.remove("balloons-pending");
  if (!hero || !canvas || !title) return reveal();

  // Guards: reduced-motion or no WebGL → leave the plain CSS hero in place.
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return reveal();
  if (!hasWebGL()) return reveal();

  const lines = Array.from(title.querySelectorAll<HTMLElement>(".line"))
    .map((l) => l.textContent?.trim() ?? "")
    .filter(Boolean);
  if (!lines.length) return reveal();

  let handle: BalloonHandle | null = null;
  let started = false;

  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries.some((e) => e.isIntersecting);
      if (visible && !started) {
        started = true;
        import("./balloons-scene")
          .then(({ start }) => start(canvas, lines, hero))
          .then((h) => {
            handle = h;
            canvas.classList.add("is-active");
            resetBtn?.classList.add("is-active");
            handle.setActive(true);
          })
          .catch(reveal); // init failed → fall back to the CSS hero
      } else if (handle) {
        handle.setActive(visible); // pause the loop when scrolled away
      }
    },
    { threshold: 0.05 },
  );
  io.observe(hero);

  resetBtn?.addEventListener("click", () => handle?.reset());
  addEventListener(
    "pagehide",
    () => {
      handle?.destroy();
      io.disconnect();
    },
    { once: true },
  );
}

function hasWebGL(): boolean {
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}
