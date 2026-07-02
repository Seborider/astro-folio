/* ============================================================
   i18n.js — in-place locale swap, the language twin of the theme
   toggle. No navigation, no fetch: every localized node was rendered
   with its alternate language in data-i18n-alt (text / innerHTML) or a
   data-*-alt attribute, so switching is a symmetric DOM swap.

   Loads BEFORE core.js so a stored-locale swap on a fresh page happens
   before the reveal/scramble animations read the (now correct) text.
   Vanilla; runs at end of <body> (the markup it swaps already parsed).
   ============================================================ */
(function () {
  "use strict";

  // Attribute-borne localized strings: [liveAttr, altAttr]. Text nodes use
  // data-i18n-alt directly (handled below); these are the exceptions that live
  // in attributes — section labels (read by core.js), the work-preview name,
  // and a11y labels on the toggles.
  const ATTR_PAIRS = [
    ["data-screen-label", "data-screen-label-alt"],
    ["data-name", "data-name-alt"],
    ["data-cursor-label", "data-cursor-label-alt"],
    ["aria-label", "data-aria-label-alt"],
  ];

  // Toggle every stamped node between its rendered value and its alternate.
  // Symmetric: with two locales, one pass == switch to the other language.
  function swapDom() {
    document.querySelectorAll("[data-i18n-alt]").forEach(function (el) {
      const html = el.hasAttribute("data-i18n-html");
      // A scramble animation may be mid-flight: textContent is then random
      // glyphs. data-text always holds the true current string — store THAT
      // as the alternate, never the scrambled frame.
      const cur = html
        ? el.innerHTML
        : el.getAttribute("data-text") || el.textContent;
      const alt = el.getAttribute("data-i18n-alt");
      if (html) el.innerHTML = alt;
      else el.textContent = alt;
      el.setAttribute("data-i18n-alt", cur);
      // keep the scramble source (core.js reads data-text || textContent) in sync
      if (el.hasAttribute("data-text")) el.setAttribute("data-text", el.textContent);
    });
    ATTR_PAIRS.forEach(function (pair) {
      const live = pair[0];
      const alt = pair[1];
      document.querySelectorAll("[" + alt + "]").forEach(function (el) {
        const cur = el.getAttribute(live) || "";
        el.setAttribute(live, el.getAttribute(alt));
        el.setAttribute(alt, cur);
      });
    });
  }

  // Source of truth is <html lang>; swapDom is symmetric, so applying the other
  // locale once == switching. (The tab title swaps via its own data-i18n-alt in
  // the generic loop; og:/description aren't swapped — crawlers read the static
  // HTML, not this JS, so it'd be dead work. ponytail: visible text only.)
  const root = document.documentElement;

  function applyLocale(target) {
    if (target !== "de" && target !== "en") return;
    if (target === root.lang) return;
    swapDom();
    root.lang = target;
    root.dataset.locale = target;
    try {
      localStorage.setItem("locale", target);
    } catch (e) {}
    root.classList.remove("i18n-pending");
    window.dispatchEvent(
      new CustomEvent("localechange", { detail: { locale: target } }),
    );
  }
  window.__applyLocale = applyLocale;

  // First paint: honour a stored preference that differs from the built locale
  // (a no-op if they match). Runs before core.js so reveals animate swapped text.
  try {
    applyLocale(localStorage.getItem("locale"));
  } catch (e) {}

  // Delegated, like the theme toggle — the button parses in the header markup.
  document.addEventListener("click", function (e) {
    if (!e.target.closest("[data-locale-toggle]")) return;
    applyLocale(root.lang === "de" ? "en" : "de");
  });
})();
