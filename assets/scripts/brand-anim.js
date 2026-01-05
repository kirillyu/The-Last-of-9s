
(() => {
  // Unified header brand behavior:
  // - inject wordmark image before title
  // - on hover (logo/title): smoothly morph "9s" -> "99.9999" and turn it green like the background hot color
  if (window.__tl9BrandAnimInit) {
    return;
  }
  window.__tl9BrandAnimInit = true;

  const SELECTORS = {
    header: ".md-header",
    title: ".md-header__title",
    titleEllipsis: ".md-header__title .md-header__ellipsis",
    logoButton: "a.md-header__button.md-logo",
    pageTitleTopic: ".md-header__title .md-header__topic[data-md-component=\"header-topic\"]",
    siteTitleTopic: ".md-header__title .md-header__topic:not([data-md-component=\"header-topic\"])",
  };

  const getNodes = () => {
    const header = document.querySelector(SELECTORS.header);
    const title = document.querySelector(SELECTORS.title);
    const titleEllipsis = document.querySelector(SELECTORS.titleEllipsis);
    const logoButton = document.querySelector(SELECTORS.logoButton);
    const pageTitleTopic = document.querySelector(SELECTORS.pageTitleTopic);
    const siteTitleTopic = document.querySelector(SELECTORS.siteTitleTopic);
    return { header, title, titleEllipsis, logoButton, pageTitleTopic, siteTitleTopic };
  };

  const ensureSiteTitleText = ({ title, titleEllipsis, pageTitleTopic, siteTitleTopic }) => {
    const container = titleEllipsis || title;
    if (!container) return null;

    let siteTopic = siteTitleTopic || container.querySelector(SELECTORS.siteTitleTopic);
    if (!siteTopic) {
      siteTopic = document.createElement("div");
      siteTopic.className = "md-header__topic";
      if (pageTitleTopic) {
        container.insertBefore(siteTopic, pageTitleTopic);
      } else {
        container.prepend(siteTopic);
      }
    }

    let siteText = siteTopic.querySelector(".md-ellipsis");
    if (!siteText) {
      siteText = document.createElement("span");
      siteText.className = "md-ellipsis";
      siteTopic.append(siteText);
    }
    pageTitleTopic?.setAttribute("aria-hidden", "true");

    return siteText;
  };

  const getSiteLabel = (header, logoButton, siteTitleText) => {
    const cached = header?.getAttribute("data-tl9-site-label");
    if (cached) return cached;

    const label =
      logoButton?.getAttribute("aria-label")?.trim() ||
      logoButton?.getAttribute("title")?.trim() ||
      siteTitleText?.getAttribute("data-tl9-title-original")?.trim() ||
      siteTitleText?.textContent?.trim() ||
      "The Last of 9s";

    header?.setAttribute("data-tl9-site-label", label);
    return label;
  };

  const ensureTitleSwap = (titleText, label) => {
    if (!titleText || !label) return;
    const original = label.trim();
    if (!original) return;

    const swapped = original.replace(/9s\b/g, "99.9999");
    let wrap = titleText.querySelector(".tl9-title-swap");

    if (!wrap) {
      wrap = document.createElement("span");
      wrap.className = "tl9-title-swap";

      const base = document.createElement("span");
      base.className = "tl9-title-base";

      const hot = document.createElement("span");
      hot.className = "tl9-title-hot";
      hot.setAttribute("aria-hidden", "true");

      wrap.append(base, hot);
      titleText.textContent = "";
      titleText.append(wrap);
    }

    const base = wrap.querySelector(".tl9-title-base");
    const hot = wrap.querySelector(".tl9-title-hot");
    if (base && base.textContent !== original) {
      base.textContent = original;
    }
    if (hot && hot.textContent !== swapped) {
      hot.textContent = swapped;
    }

    titleText.setAttribute("data-tl9-title-original", original);
  };

  const setHot = (header, enabled) => {
    if (!header) return;
    header.classList.toggle("tl9-brand-hot", enabled);
  };

  let observer;

  const bindHotHandlers = (header, title, logoButton) => {
    if (!header) return;
    const enter = () => setHot(header, true);
    const leave = () => setHot(header, false);

    for (const el of [title, logoButton].filter(Boolean)) {
      if (el.dataset.tl9BrandBound === "true") continue;
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointerleave", leave);
      el.addEventListener("focusin", enter);
      el.addEventListener("focusout", leave);
      el.dataset.tl9BrandBound = "true";
    }
  };

  const attach = () => {
    const nodes = getNodes();
    const { header, title, logoButton } = nodes;
    if (!header || !title) return;

    const siteTitleText = ensureSiteTitleText(nodes);
    if (!siteTitleText) return;

    const siteLabel = getSiteLabel(header, logoButton, siteTitleText);
    if (siteTitleText.textContent.trim() !== siteLabel) {
      siteTitleText.textContent = siteLabel;
    }
    ensureTitleSwap(siteTitleText, siteLabel);
    header.classList.add("tl9-site-title-ready");

    bindHotHandlers(header, title, logoButton);

    if (!observer && title) {
      observer = new MutationObserver(() => {
        const next = getNodes();
        const nextTitleText = ensureSiteTitleText(next);
        if (!nextTitleText) return;
        const label = getSiteLabel(next.header, next.logoButton, nextTitleText);
        if (nextTitleText.textContent.trim() !== label) {
          nextTitleText.textContent = label;
        }
        ensureTitleSwap(nextTitleText, label);
        next.header?.classList.add("tl9-site-title-ready");
      });
      observer.observe(title, { childList: true, subtree: true });
    }
  };

  document.addEventListener("DOMContentLoaded", attach);
  document.addEventListener("navigation.instant", attach);
  if (document.readyState !== "loading") {
    attach();
  }
})();
