/* ============================================================
   home.js — interactions unique to the home page.
   Loader count-up (once per session), showreel overlay, carousel
   drag + counter, and the cursor-following work preview.
   Depends on core.js (window.__revealHero, window.scramble,
   window.__lenis, window.__pointer). Loaded only on index.
   ============================================================ */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- loader ---------------- */
  const loader = document.getElementById("loader");
  const countEl = document.getElementById("loaderCount");
  const stateEl = document.getElementById("loaderState");
  const states = ["Initialising", "Loading type", "Decoding", "Composing", "Ready"];
  const heroMeta = () => document.querySelectorAll(".hero__meta .scramble");

  function startSite() {
    const tl = gsap.timeline();
    tl.to(loader, { yPercent: -100, duration: 1.0, ease: "expo.inOut" })
      .set(loader, { display: "none" })
      .add(() => { if (window.__revealHero) window.__revealHero(); }, "-=0.5");
  }

  if (loader) {
    const seen = sessionStorage.getItem("folio_seen");
    sessionStorage.setItem("folio_seen", "1");

    if (reduce) {
      countEl.textContent = "100";
      loader.style.display = "none";
      heroMeta().forEach((el) => (el.textContent = el.dataset.text || el.textContent));
      if (window.__revealHero) window.__revealHero();
    } else if (seen) {
      loader.style.display = "none";
      if (window.__revealHero) window.__revealHero();
    } else {
      let n = 0;
      const tick = () => {
        n += Math.floor(Math.random() * 11) + 4;
        if (n >= 100) n = 100;
        countEl.textContent = n;
        stateEl.textContent = states[Math.min(states.length - 1, Math.floor(n / 22))];
        if (n < 100) setTimeout(tick, 90 + Math.random() * 120);
        else setTimeout(startSite, 350);
      };
      setTimeout(tick, 250);
    }
  }

  /* ---------------- showreel overlay ---------------- */
  const showreel = document.getElementById("showreel");
  const lenis = () => window.__lenis;
  const openReel = () => { showreel.classList.add("is-open"); if (lenis()) lenis().stop(); };
  const closeReel = () => { showreel.classList.remove("is-open"); if (lenis()) lenis().start(); };
  if (showreel) {
    const play = document.getElementById("playReel");
    const close = document.getElementById("closeReel");
    if (play) play.addEventListener("click", openReel);
    if (close) close.addEventListener("click", closeReel);
    document.querySelectorAll(".reel__tile").forEach((t) => t.addEventListener("click", openReel));
  }

  /* ---------------- carousel ---------------- */
  const carousel = document.getElementById("carousel");
  if (carousel) {
    const carCount = document.getElementById("carCount");
    const items = carousel.querySelectorAll(".carousel__item");
    if (carCount && items.length) {
      let step = items[0].offsetWidth + 16;
      window.addEventListener("resize", () => { step = items[0].offsetWidth + 16; });
      carousel.addEventListener("scroll", () => {
        const i = Math.round(carousel.scrollLeft / step);
        carCount.textContent = "( " + Math.min(items.length, i + 1) + " / " + items.length + " )";
      });
    }
    let down = false, sx = 0, sl = 0, moved = false;
    carousel.addEventListener("pointerdown", (e) => { down = true; moved = false; sx = e.clientX; sl = carousel.scrollLeft; });
    window.addEventListener("pointerup", () => (down = false));
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      if (Math.abs(e.clientX - sx) > 4) moved = true;
      carousel.scrollLeft = sl - (e.clientX - sx) * 1.4;
    });
    carousel.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  }

  /* ---------------- work preview (cursor follow) ---------------- */
  const preview = document.getElementById("workPreview");
  const isTouch = matchMedia("(hover: none)").matches;
  if (preview && !isTouch && typeof gsap !== "undefined") {
    const tgt = window.__pointer || { x: innerWidth / 2, y: innerHeight / 2 };
    const pv = { x: tgt.x, y: tgt.y };
    let active = false;
    document.querySelectorAll(".work__row").forEach((row) => {
      row.addEventListener("pointerenter", () => {
        active = true;
        preview.classList.add("is-active");
        const name = row.dataset.name || row.querySelector(".name")?.textContent || "";
        preview.querySelector("span").textContent = name;
      });
      row.addEventListener("pointerleave", () => { active = false; preview.classList.remove("is-active"); });
    });
    gsap.ticker.add(() => {
      pv.x += (tgt.x - pv.x) * 0.12;
      pv.y += (tgt.y - pv.y) * 0.12;
      const s = active ? 1 : 0.85;
      preview.style.transform = "translate(" + pv.x + "px," + pv.y + "px) translate(-50%,-50%) scale(" + s + ")";
    });
  }
})();
