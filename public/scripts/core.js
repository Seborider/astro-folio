/* ============================================================
   core.js — chrome shared by EVERY page.
   Cursor, Lenis smooth scroll, scramble, scroll reveals, page-hero
   rise, clock, email-copy. Exposes window.scramble, window.__lenis
   and window.__revealHero (home.js calls the latter after its loader).
   Vanilla. GSAP + ScrollTrigger + Lenis assumed loaded first.
   ============================================================ */
(function () {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (typeof gsap !== "undefined") gsap.registerPlugin(ScrollTrigger);

  /* ---------------- scramble ---------------- */
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*/<>+=0123456789";
  function scramble(el, opts) {
    opts = opts || {};
    const target = el.dataset.text || el.textContent;
    const dur = opts.duration || 800;
    const start = performance.now();
    function frame(now) {
      const p = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      const revealed = Math.floor(e * target.length);
      let out = "";
      for (let i = 0; i < target.length; i++) {
        if (i < revealed || target[i] === " ") out += target[i];
        else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = target;
    }
    requestAnimationFrame(frame);
  }
  window.scramble = scramble;

  /* ---------------- cursor ---------------- */
  const cursor = document.getElementById("cursor");
  const cursorLabel = document.getElementById("cursorLabel");
  const tgt = { x: innerWidth / 2, y: innerHeight / 2 };
  const cur = { x: tgt.x, y: tgt.y };
  window.__pointer = tgt; // home.js reuses this for the work preview
  const isTouch = matchMedia("(hover: none)").matches;

  if (!isTouch && cursor) {
    window.addEventListener("pointermove", (e) => { tgt.x = e.clientX; tgt.y = e.clientY; });
    gsap.ticker.add(() => {
      cur.x += (tgt.x - cur.x) * 0.18;
      cur.y += (tgt.y - cur.y) * 0.18;
      cursor.style.transform = "translate(" + cur.x + "px," + cur.y + "px) translate(-50%,-50%)";
      if (cursorLabel) cursorLabel.style.transform = "translate(" + tgt.x + "px," + tgt.y + "px) translate(-50%,-50%)";
    });
    const LABELS = { play: "Play", open: "Open", view: "↗", copy: "Copy", close: "Close", home: "Top" };
    const bindCursor = (el) => {
      el.addEventListener("pointerenter", () => {
        cursor.classList.add("is-hover");
        const l = LABELS[el.dataset.cursor];
        if (l && cursorLabel) { cursorLabel.textContent = l; cursorLabel.style.opacity = "1"; }
      });
      el.addEventListener("pointerleave", () => {
        cursor.classList.remove("is-hover");
        if (cursorLabel) cursorLabel.style.opacity = "0";
      });
    };
    document.querySelectorAll("[data-cursor]").forEach(bindCursor);
    window.__bindCursor = bindCursor; // for any dynamically-added targets
  }

  /* ---------------- magnetic CTAs ---------------- */
  // [data-magnetic] elements ease toward the pointer while hovered, then
  // settle back. Skipped on touch / reduced-motion.
  function bindMagnetic(el) {
    const strength = 0.3;
    const setX = gsap.quickTo(el, "x", { duration: 0.5, ease: "expo.out" });
    const setY = gsap.quickTo(el, "y", { duration: 0.5, ease: "expo.out" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      setX((e.clientX - (r.left + r.width / 2)) * strength);
      setY((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener("pointerleave", () => { setX(0); setY(0); });
  }
  if (!reduce && !isTouch && typeof gsap !== "undefined") {
    document.querySelectorAll("[data-magnetic]").forEach(bindMagnetic);
  }

  /* ---------------- work preview (cursor follow) ---------------- */
  // Floating cover thumbnail that trails the pointer over project rows.
  // Shared by the home work list (.work__row) and the archive table
  // (.arch__row); the #workPreview element lives in Base.astro.
  const preview = document.getElementById("workPreview");
  if (preview && !isTouch && !reduce && typeof gsap !== "undefined") {
    const tgt = window.__pointer || { x: innerWidth / 2, y: innerHeight / 2 };
    const pv = { x: tgt.x, y: tgt.y };
    let active = false;
    const label = preview.querySelector("span");
    const img = preview.querySelector("img");
    document.querySelectorAll(".work__row, .arch__row").forEach((row) => {
      row.addEventListener("pointerenter", () => {
        active = true;
        preview.classList.add("is-active");
        const name = row.dataset.name || row.querySelector(".name")?.textContent || "";
        label.textContent = name;
        if (img) {
          const cover = row.dataset.cover || "";
          if (cover && img.getAttribute("src") !== cover) img.src = cover;
          img.hidden = !cover;
        }
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

  /* ---------------- section index ---------------- */
  // Surfaces the active section's localized data-screen-label in the fixed
  // corner marker. Pure IntersectionObserver — works without Lenis and under
  // reduced motion.
  function initSectionIndex() {
    const el = document.getElementById("sectionIndex");
    if (!el) return;
    const sections = document.querySelectorAll("[data-screen-label]");
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const label = e.target.getAttribute("data-screen-label");
          if (label) el.textContent = "( " + label + " )";
        });
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    // Reveal only after the hero so it never clashes with hero corner copy.
    const onScroll = () =>
      el.classList.toggle("is-visible", window.scrollY > innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------- Lenis ---------------- */
  let lenis = null;
  if (!reduce && typeof Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length > 1) { e.preventDefault(); lenis.scrollTo(id, { duration: 1.4 }); }
      });
    });
  }

  /* ---------------- page-hero rise ---------------- */
  // Set the hidden state immediately (no flash), then reveal.
  if (!reduce) {
    gsap.set("[data-rise]", { yPercent: 110 });
    gsap.set("[data-rise-soft]", { autoAlpha: 0, y: 20 });
  }
  function revealHero() {
    if (reduce) {
      gsap.set("[data-rise]", { yPercent: 0 });
      gsap.set("[data-rise-soft]", { autoAlpha: 1, y: 0 });
      document.querySelectorAll(".scramble, [data-scramble-now]").forEach((el) => (el.textContent = el.dataset.text || el.textContent));
      return;
    }
    const tl = gsap.timeline();
    tl.to("[data-rise]", { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.08 })
      .to("[data-rise-soft]", { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out" }, "-=0.7");
    setTimeout(() => {
      document.querySelectorAll(".hero__meta .scramble, [data-scramble-now]").forEach((el, i) => {
        setTimeout(() => scramble(el, { duration: 700 }), i * 130);
      });
    }, 500);
  }
  window.__revealHero = revealHero;

  /* ---------------- scroll reveals ---------------- */
  function initReveals() {
    if (reduce) {
      gsap.utils.toArray(".line > span").forEach((s) => gsap.set(s, { yPercent: 0 }));
      gsap.utils.toArray("[data-reveal]").forEach((s) => gsap.set(s, { autoAlpha: 1, y: 0 }));
      return;
    }
    gsap.utils.toArray(".reveal-lines").forEach((blk) => {
      const spans = blk.querySelectorAll(".line > span");
      if (!spans.length) return; // empty/hidden block (e.g. project with no quote)
      gsap.set(spans, { yPercent: 110 });
      ScrollTrigger.create({
        trigger: blk, start: "top 82%",
        onEnter: () => gsap.to(spans, { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.1 }),
      });
    });
    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: "top 88%" },
        autoAlpha: 0, y: 30, duration: 0.9, ease: "expo.out",
        delay: parseFloat(el.dataset.reveal) || 0,
      });
    });
    gsap.utils.toArray("[data-scramble]").forEach((el) => {
      el.dataset.text = el.textContent;
      ScrollTrigger.create({
        trigger: el, start: "top 86%", once: true,
        onEnter: () => scramble(el, { duration: 600 }),
      });
    });
  }

  /* ---------------- email copy ---------------- */
  const emailBtn = document.getElementById("emailBtn");
  if (emailBtn) {
    emailBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (navigator.clipboard) navigator.clipboard.writeText(emailBtn.dataset.email || "hello@studio.demo").catch(() => {});
      const o = emailBtn.textContent;
      emailBtn.textContent = "Copied ✓";
      setTimeout(() => (emailBtn.textContent = o), 1600);
    });
  }

  /* ---------------- clock ---------------- */
  const clock = document.getElementById("clock");
  if (clock) {
    const setClock = () => {
      const d = new Date();
      const utc = d.getTime() + d.getTimezoneOffset() * 60000;
      const cph = new Date(utc + 3600000);
      clock.textContent =
        String(cph.getHours()).padStart(2, "0") + ":" +
        String(cph.getMinutes()).padStart(2, "0") + ":" +
        String(cph.getSeconds()).padStart(2, "0");
    };
    setClock(); setInterval(setClock, 1000);
  }

  /* ---------------- boot ---------------- */
  // The home page has a #loader; home.js reveals the hero after the count-up.
  // Every other page reveals immediately.
  if (!document.getElementById("loader")) {
    setTimeout(revealHero, 350);
  }
  initReveals();
  initSectionIndex();
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
