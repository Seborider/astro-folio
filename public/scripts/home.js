/* ============================================================
   home.js — interactions unique to the home page.
   Loader count-up (once per session), showreel overlay, and carousel
   drag + counter. Depends on core.js (window.__revealHero,
   window.scramble, window.__lenis). Loaded only on index.
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
      // arrived via a View Transition → rise after the wipe finishes; a plain
      // revisit (refresh, not viaVT) still rises immediately. Scheduler decides.
      if (window.__revealHeroEntrance) window.__revealHeroEntrance();
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
  const reelVideo = showreel ? showreel.querySelector(".showreel__video") : null;
  // The full showreel source the "Play reel" CTA returns to (tiles swap it out).
  const showreelSrc = reelVideo ? reelVideo.getAttribute("src") : null;
  const lenis = () => window.__lenis;
  const openReel = (src) => {
    if (reelVideo) {
      if (src && reelVideo.getAttribute("src") !== src) {
        reelVideo.setAttribute("src", src); // resets + loads the new source at 0
      } else {
        reelVideo.currentTime = 0; // same source → rewind
      }
      reelVideo.play().catch(() => {});
    }
    showreel.classList.add("is-open");
    document.documentElement.classList.add("reel-open");
    if (lenis()) lenis().stop();
  };
  const closeReel = () => {
    showreel.classList.remove("is-open");
    document.documentElement.classList.remove("reel-open");
    if (reelVideo) reelVideo.pause();
    if (lenis()) lenis().start();
  };
  if (showreel) {
    const play = document.getElementById("playReel");
    const close = document.getElementById("closeReel");
    if (play) play.addEventListener("click", () => openReel(showreelSrc));
    if (close) close.addEventListener("click", closeReel);
    // Only tiles that actually have a video open the overlay — playing their own.
    document.querySelectorAll(".reel__tile[data-video]").forEach((t) =>
      t.addEventListener("click", () => openReel(t.dataset.video)),
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && showreel.classList.contains("is-open")) closeReel();
    });
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

  // The cursor-following work preview now lives in core.js (shared with the
  // archive table); the #workPreview element lives in Base.astro.
})();
