(() => {
  if (window.__tl9BgInit) {
    return;
  }
  window.__tl9BgInit = true;

  const canvas = document.createElement("canvas");
  canvas.className = "tl9-bg";
  canvas.setAttribute("aria-hidden", "true");
  canvas.setAttribute("role", "presentation");
  document.body.prepend(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const deviceMemory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const lowPower = deviceMemory <= 4 || cores <= 4;

  const nines = ["99.9", "99.99", "99.999", "99.9999", "99.99999"];
  const pointer = { x: 0, y: 0, active: false };
  const headerBoost = { value: 0, target: 0 };
  let points = [];
  let width = 0;
  let height = 0;
  let ratio = 1;
  let raf = null;
  let deactivateTimer = null;
  let palette = null;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const mix = (a, b, t) => [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];

  const randomMetric = () => {
    const roll = Math.random();
    if (roll < 0.4) {
      return (Math.random() * 9.9).toFixed(2);
    }
    if (roll < 0.75) {
      return (Math.random() * 99.0).toFixed(1);
    }
    return Math.floor(Math.random() * 98 + 1).toString();
  };

  const scheduleDraw = () => {
    if (raf) {
      return;
    }
    raf = window.requestAnimationFrame((timestamp) => {
      raf = null;
      draw(timestamp);
    });
  };

  const setHeaderBoostTarget = (target) => {
    headerBoost.target = clamp(target, 0, 1);
    scheduleDraw();
  };

  const attachHeaderHover = () => {
    const title = document.querySelector(".md-header__title");
    const logo = document.querySelector("a.md-header__button.md-logo");

    const targets = [title, logo].filter(Boolean);
    if (!targets.length) {
      return;
    }

    const enter = () => setHeaderBoostTarget(1);
    const leave = () => setHeaderBoostTarget(0);

    for (const el of targets) {
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointerleave", leave);
      el.addEventListener("focusin", enter);
      el.addEventListener("focusout", leave);
    }
  };

  const activatePointer = (x, y) => {
    pointer.x = x;
    pointer.y = y;
    pointer.active = true;
    scheduleDraw();

    if (deactivateTimer) {
      window.clearTimeout(deactivateTimer);
    }
    deactivateTimer = window.setTimeout(() => {
      pointer.active = false;
      scheduleDraw();
    }, 1200);
  };

  const buildPoints = () => {
    let spacing = isCoarsePointer ? 210 : lowPower ? 190 : 160;
    const maxPoints = isCoarsePointer ? 60 : lowPower ? 90 : 140;

    let cols = Math.max(5, Math.floor(width / spacing));
    let rows = Math.max(4, Math.floor(height / spacing));

    while (cols * rows > maxPoints) {
      spacing += 18;
      cols = Math.max(5, Math.floor(width / spacing));
      rows = Math.max(4, Math.floor(height / spacing));
    }

    const jitter = Math.min(28, Math.max(10, width * 0.012));
    points = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const baseX = (col + 0.5) / cols;
        const baseY = (row + 0.5) / rows;
        points.push({
          x: baseX * width + (Math.random() - 0.5) * jitter,
          y: baseY * height + (Math.random() - 0.5) * jitter,
          value: randomMetric(),
        });
      }
    }
  };

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    ratio = Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.5);

    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    buildPoints();
    scheduleDraw();
  };

  const getScheme = () =>
    document.body?.getAttribute("data-md-color-scheme") ||
    document.documentElement.getAttribute("data-md-color-scheme") ||
    "slate";

  const selectPalette = () => {
    const light = getScheme() === "default";
    if (light) {
      return {
        baseColor: [70, 84, 98],
        hotColor: [38, 140, 92],
        baseAlpha: isCoarsePointer ? 0.2 : 0.26,
        radiusScale: 0.34,
      };
    }
    return {
      baseColor: [120, 148, 178],
      hotColor: [99, 217, 155],
      baseAlpha: isCoarsePointer ? 0.16 : 0.22,
      radiusScale: 0.38,
    };
  };

  const syncPalette = () => {
    palette = selectPalette();
    // Expose the same hot color for other UI elements (header brand, accents).
    if (palette?.hotColor?.length === 3) {
      const [r, g, b] = palette.hotColor;
      document.documentElement.style.setProperty("--tl9-hot-rgb", `${r}, ${g}, ${b}`);
      document.documentElement.style.setProperty("--tl9-hot-color", `rgb(${r} ${g} ${b})`);
    }
  };

  const draw = () => {
    if (!width || !height) {
      return;
    }

    ctx.clearRect(0, 0, width, height);

    // Smoothly ease hover boost without keeping a permanent animation loop.
    headerBoost.value += (headerBoost.target - headerBoost.value) * 0.16;
    if (Math.abs(headerBoost.target - headerBoost.value) > 0.01) {
      scheduleDraw();
    }

    const baseFontSize = clamp(Math.round(width / 92), 11, 14);
    const fontSize = clamp(Math.round(baseFontSize * (1 + headerBoost.value * 0.72)), 11, 22);
    ctx.font = `${fontSize}px 'IBM Plex Mono', ui-monospace, Menlo, Monaco, Consolas, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (!palette) {
      syncPalette();
    }

    const radius = Math.min(width, height) * (palette.radiusScale + headerBoost.value * 0.12);
    const baseAlpha = palette.baseAlpha + headerBoost.value * 0.08;

    for (const point of points) {
      const dx = (pointer.active ? pointer.x : width / 2) - point.x;
      const dy = (pointer.active ? pointer.y : height / 2) - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const intensity = pointer.active ? clamp(1 - distance / radius, 0, 1) : 0;

      let value = point.value;
      let color = palette.baseColor;
      let alpha = baseAlpha;

      if (intensity > 0) {
        const idx = Math.min(nines.length - 1, Math.floor(intensity * nines.length));
        value = nines[idx];
        color = mix(palette.baseColor, palette.hotColor, 0.4 + intensity * 0.6);
        alpha = baseAlpha + intensity * 0.6;
      }

      ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
      ctx.fillText(value, point.x, point.y);
    }
  };

  if (!prefersReduced) {
    document.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") {
        return;
      }
      activatePointer(event.clientX, event.clientY);
    });
  }

  document.addEventListener("touchstart", (event) => {
    if (!event.touches.length) {
      return;
    }
    const touch = event.touches[0];
    activatePointer(touch.clientX, touch.clientY);
  }, { passive: true });

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);
  window.addEventListener("blur", () => {
    pointer.active = false;
    scheduleDraw();
  });

  const schemeTarget = document.body || document.documentElement;
  if (schemeTarget) {
    const observer = new MutationObserver(() => {
      syncPalette();
      scheduleDraw();
    });
    observer.observe(schemeTarget, { attributes: true, attributeFilter: ["data-md-color-scheme"] });
  }

  syncPalette();
  attachHeaderHover();
  resize();
})();
