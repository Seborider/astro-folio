/* ============================================================
   chrome.js — cross-page navigation with a CSS-driven cover-wipe.
   Astro build: internal routes are extensionless (/work, /work/halcyon),
   so we intercept clicks on same-origin internal links (href starting
   with "/"), excluding hashes and external/new-tab links. The
   .page-wipe panel auto-reveals on load via CSS so it can never get
   stuck covering.

   ALTERNATIVE: delete this file and add Astro's <ViewTransitions/> to
   Base.astro for native cross-document transitions (see README).
   ============================================================ */
(function () {
  "use strict";
  const wipe = document.querySelector(".page-wipe");
  if (!wipe) return;

  // Browsers with cross-document View Transitions handle the page transition
  // natively (@view-transition in styles.css) — let them own navigation and
  // skip this JS wipe so the two don't run at once. Base.astro detects support
  // and tags <html.vt> before first paint; we just read that. Older browsers
  // fall back to the wipe below.
  if (document.documentElement.classList.contains("vt")) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COVER_MS = 650;
  let navigating = false;

  const hereUrl = () => location.pathname + location.search;

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href) return;
    if (!href.startsWith("/")) return;                 // internal absolute routes only
    if (a.hasAttribute("target")) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;  // let new-tab clicks through

    const targetUrl = href.split("#")[0];
    if (targetUrl === hereUrl()) return;               // exact same page

    e.preventDefault();
    if (reduce) { location.href = href; return; }
    if (navigating) return;
    navigating = true;
    wipe.style.animation = "none";
    void wipe.offsetWidth;            // restart animation
    wipe.classList.add("is-covering");
    wipe.style.animation = "";        // drop the inline reset so .is-covering's wipeCover runs
    setTimeout(() => { location.href = href; }, COVER_MS);
  });

  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      navigating = false;
      wipe.classList.remove("is-covering");
      wipe.style.animation = "none";
      void wipe.offsetWidth;
      wipe.style.animation = "wipeReveal 0.9s cubic-bezier(0.16,1,0.3,1) forwards";
    }
  });
})();
