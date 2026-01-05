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
})();
