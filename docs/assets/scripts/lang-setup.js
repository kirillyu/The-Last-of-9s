(() => {
  if (window.__tl9LangInit) {
    return;
  }
  window.__tl9LangInit = true;

  const path = window.location.pathname || "";
  const isRu = path.includes("/ru/");
  const lang = isRu ? "ru" : "en";

  if (document.documentElement.getAttribute("lang") !== lang) {
    document.documentElement.setAttribute("lang", lang);
  }

  // Convert mkdocs-material language dropdown into a simple toggle:
  // - EN pages show a "RU" button
  // - RU pages show an "EN" button
  const installLangToggle = () => {
    const select = document.querySelector(".md-header .md-select");
    if (!select) return;

    const current = (document.documentElement.getAttribute("lang") || "en").toLowerCase();
    const links = Array.from(select.querySelectorAll("a.md-select__link"));
    if (links.length < 2) return;

    const other = links.find((a) => (a.getAttribute("hreflang") || "").toLowerCase() !== current);
    if (!other) return;

    const otherLang = (other.getAttribute("hreflang") || "").toLowerCase() || (current === "ru" ? "en" : "ru");
    const label = otherLang === "ru" ? "RU" : "EN";

    // Replace the whole dropdown with a single link button (no icon glyphs).
    const button = select.querySelector('button[aria-label="Select language"]');
    const toggle = document.createElement("a");
    toggle.className = "md-header__button tl9-lang-toggle";
    toggle.href = other.href;
    toggle.setAttribute("hreflang", otherLang);
    toggle.setAttribute("rel", "alternate");
    toggle.setAttribute("aria-label", otherLang === "ru" ? "Switch to Russian" : "Switch to English");
    toggle.textContent = label;

    // Replace the dropdown container completely (prevents stray i18n icon rendering).
    select.replaceWith(toggle);
  };

  // Fix for mkdocs-material language selector under our base path.
  // In some builds, clicking a language option doesn't navigate (JS prevents default).
  // We enforce navigation in the capture phase to keep UX reliable.
  window.addEventListener(
    "click",
    (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a.md-select__link");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href) return;
      // Only handle real navigation links
      if (href.startsWith("javascript:")) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      window.location.href = link.href;
    },
    true
  );

  // Run after initial DOM paint so header is present.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installLangToggle, { once: true });
  } else {
    installLangToggle();
  }
})();
