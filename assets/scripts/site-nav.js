(() => {
  if (window.__tl9NavInit) {
    return;
  }
  window.__tl9NavInit = true;

  const stubs = {
    "/blog.html": { en: "/en/index.html", ru: "/ru/index.html" },
  };

  const getBasePrefix = () => {
    // Prefer Material's scope helper (works even on 404 pages where <base> is absent).
    // Example: __md_scope = new URL("/The-Last-of-9s/", location)
    const scopePath = window.__md_scope?.pathname;
    if (typeof scopePath === "string" && scopePath.length) {
      return scopePath.endsWith("/") ? scopePath.slice(0, -1) : scopePath;
    }

    // Fallback: <base href="..."> (may be absent).
    const baseHref = document.querySelector("base")?.getAttribute("href");
    if (baseHref) {
      try {
        const basePath = new URL(baseHref, window.location.origin).pathname;
        return basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
      } catch {
        // ignore
      }
    }

    return "";
  };

  const normalizePath = (pathname, basePrefix) => {
    if (!basePrefix) {
      return pathname;
    }
    return pathname.startsWith(`${basePrefix}/`) ? pathname.slice(basePrefix.length) : pathname;
  };

  const getPreferredLang = () => {
    try {
      const saved = window.localStorage.getItem("tl9.lang");
      if (saved === "ru" || saved === "en") {
        return saved;
      }
    } catch {
      // ignore
    }
    return "en";
  };

  const saveLangFromPath = () => {
    const basePrefix = getBasePrefix();
    const rawPath = window.location.pathname || "";
    const path = normalizePath(rawPath, basePrefix);
    const lang = path.startsWith("/ru/") ? "ru" : path.startsWith("/en/") ? "en" : null;
    if (!lang && path !== "/index.html") return;
    try {
      window.localStorage.setItem("tl9.lang", lang || "en");
    } catch {
      // ignore
    }
  };

  const maybeRedirectStub = () => {
    const basePrefix = getBasePrefix();
    const rawPath = window.location.pathname || "";
    const path = normalizePath(rawPath, basePrefix);
    const target = stubs[path];
    if (!target) return;
    const to =
      typeof target === "string"
        ? target
        : (() => {
          const lang = getPreferredLang();
          return target[lang] || target.en;
        })();
    if (!to || to === path) return;
    const absolute = basePrefix ? `${basePrefix}${to}` : to;
    window.location.replace(absolute);
  };

  saveLangFromPath();
  // maybeRedirectStub(); // Disabled: Navigation links now point directly to content.
})();

