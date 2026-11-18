/* sketch.js - Excalidraw-style frames for the site.
 *
 * Each element that matches a rule gets an SVG layer under its content. The frame is drawn by rough.js
 * with the same options Excalidraw uses for a rounded rectangle:
 *   solid  - strokeWidth 1, roughness 1 (two slightly different strokes, the "sketchy" line);
 *   dashed - strokeLineDash [8, 8 + strokeWidth], one stroke, strokeWidth + 0.5;
 *   fill   - hachure, angle -41, gap 5 px (7 px on shapes taller than 40 px), fillWeight strokeWidth / 2;
 *   faint  - the same hachure, gap 12 px, in a pale color, under the text of post cards.
 * Colors come from CSS variables (--sk-ink, --sk-hatch ...), so both themes work.
 * Without rough.js nothing is drawn and the CSS look stays.
 */
(function () {
  'use strict';
  var ROUGH_URL = 'https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.js';
  var NS = 'http://www.w3.org/2000/svg';

  // what is drawn where; r = corner radius in px (null = from CSS border-radius)
  var RULES = [
    // the Excalidraw dash: cards, scheme widgets that sit in a box, the line under the header
    // (Excalidraw schemes themselves float free, no frame); post cards also get a faint, sparse hachure
    { sel: '.post-card', style: 'dashed', ink: '--sk-ink-soft', faint: true },
    // the name band under the photo: the same faint hachure, no outline (the photo frame is around it),
    // its own dashed line to the photo stays (keep)
    { sel: '.tl9-caption', style: 'none', faint: true, r: 0, keep: true },
    { sel: '.rt-sheet, .cpu-sim', style: 'dashed', ink: '--sk-ink-soft' },
    { sel: '.md-typeset .admonition, .md-typeset details', style: 'dashed', ink: '--sk-ink-soft' },
    { sel: '.md-header', style: 'baseline', ink: '--sk-ink-soft' },
    // pictures in a sketchy solid frame, drawn over the picture
    { sel: '.post-card__cover, .tl9-cover', style: 'solid', ink: '--sk-ink', over: true },
    // small things with a background: hachure fill and a sketchy outline
    { sel: '.tag', style: 'solid', ink: '--sk-ink-soft', fill: '--sk-hatch-soft', r: 'pill' },
    { sel: '.slider-btn', style: 'solid', ink: '--sk-ink', fill: '--sk-hatch-soft', r: 'pill' },
    { sel: '.exc-scene__full, .rt-sheet__save, .md-typeset .md-button', style: 'solid', ink: '--sk-ink', fill: '--sk-hatch-soft', r: 8 },
    // header controls keep their own background (the icons are drawn for it), only the outline is sketched
    { sel: '.tl9-lang-toggle, .tl9-social-btn', style: 'solid', ink: '--sk-ink', r: 8 },
    // tables: paper, a sketchy frame and a hatched header row
    { sel: '.md-typeset__table', style: 'solid', ink: '--sk-ink-soft', paper: '--sk-paper', head: '--sk-hatch-soft', r: 6, inner: 'table' }
  ];

  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % 2147483647 || 1; }

  // Excalidraw lowers roughness on small shapes (renderElement.ts, adjustRoughness)
  function roughness(w, h) {
    var maxS = Math.max(w, h), minS = Math.min(w, h);
    if ((minS >= 20 && maxS >= 50) || minS >= 15) return 1;
    return 1 / (maxS < 10 ? 3 : 2);
  }

  function rr(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    return 'M ' + (x + r) + ' ' + y + ' L ' + (x + w - r) + ' ' + y + ' Q ' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + r) +
      ' L ' + (x + w) + ' ' + (y + h - r) + ' Q ' + (x + w) + ' ' + (y + h) + ' ' + (x + w - r) + ' ' + (y + h) +
      ' L ' + (x + r) + ' ' + (y + h) + ' Q ' + x + ' ' + (y + h) + ' ' + x + ' ' + (y + h - r) +
      ' L ' + x + ' ' + (y + r) + ' Q ' + x + ' ' + y + ' ' + (x + r) + ' ' + y;
  }

  function color(el, name) { return getComputedStyle(el).getPropertyValue(name).trim() || 'rgba(127,127,127,.5)'; }

  var items = [];

  function draw(it) {
    var el = it.el, rule = it.rule;
    var w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return;
    var key = w + 'x' + h + ':' + document.body.getAttribute('data-md-color-scheme');
    if (key === it.key) return;
    it.key = key;
    var svg = it.svg;
    if (!svg) {
      svg = it.svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'sk-layer');
      svg.setAttribute('aria-hidden', 'true');
      el.insertBefore(svg, el.firstChild);
    }
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    // room for the wobble outside the box; none where the box touches the page edge (header) or clips (pictures)
    // tables: none either, the wobble room made their scroll box 3 px wider than the page column
    var pad = rule.over || rule.inner || rule.style === 'baseline' ? 0 : 3;
    // the frame can follow an inner element (a table inside its scroll box)
    var bx = 0, by = 0, bw = w, bh = h;
    if (rule.inner) {
      var inn = el.querySelector(rule.inner);
      if (inn) { var a = inn.getBoundingClientRect(), b = el.getBoundingClientRect(); bx = a.left - b.left; by = a.top - b.top; bw = Math.min(a.width, w - bx); bh = a.height; }
    }
    if (rule.over) svg.style.zIndex = 2;
    // inline size: page CSS like '.slider-btn svg { width: 20px }' must not resize the layer
    svg.setAttribute('width', w + 2 * pad); svg.setAttribute('height', h + 2 * pad);
    svg.style.width = (w + 2 * pad) + 'px'; svg.style.height = (h + 2 * pad) + 'px';
    svg.setAttribute('viewBox', (-pad) + ' ' + (-pad) + ' ' + (w + 2 * pad) + ' ' + (h + 2 * pad));
    // an absolute child starts inside the border: shift it back by the border, so the frame sits on the box edge
    var cs = getComputedStyle(el);
    svg.style.left = -(pad + (parseFloat(cs.borderLeftWidth) || 0)) + 'px'; svg.style.top = -(pad + (parseFloat(cs.borderTopWidth) || 0)) + 'px';
    var rc = window.rough.svg(svg);
    var ink = color(el, rule.ink);
    var sw = 1;
    if (rule.style === 'baseline') {
      svg.appendChild(rc.line(0, h - 1, w, h - 1, { seed: it.seed, roughness: 1, stroke: ink, strokeWidth: sw + 0.5,
        strokeLineDash: [8, 8 + sw], disableMultiStroke: true }));
      return;
    }
    if (el.__skImg) {
      var ia = el.__skImg.getBoundingClientRect(), ib = el.getBoundingClientRect();
      bx = ia.left - ib.left; by = ia.top - ib.top; bw = ia.width; bh = ia.height;
    }
    var rsrc = el.__skImg || el;
    var r = rule.r === 'pill' ? bh / 2 : rule.r != null ? rule.r : Math.min(parseFloat(getComputedStyle(rsrc).borderTopLeftRadius) || 0, 32);
    var o = { seed: it.seed, roughness: roughness(bw, bh), stroke: ink, strokeWidth: sw, preserveVertices: true };
    if (rule.style === 'dashed') { o.strokeLineDash = [8, 8 + sw]; o.disableMultiStroke = true; o.strokeWidth = sw + 0.5; }
    if (rule.fill) { o.fill = color(el, rule.fill); o.fillStyle = 'hachure'; o.hachureAngle = -41; o.hachureGap = bh > 40 ? 7 : 5; o.fillWeight = sw / 2; }
    // a sparse, pale hachure over a whole card, so the text on top stays readable
    if (rule.faint) { o.fill = color(el, '--sk-hatch-faint'); o.fillStyle = 'hachure'; o.hachureAngle = -41; o.hachureGap = 12; o.fillWeight = 0.5; }
    if (rule.style === 'none') o.stroke = 'none';
    if (rule.paper) {
      // the paper under the table: a solid fill with the same wobbly outline, no stroke
      svg.appendChild(rc.path(rr(bx + 0.5, by + 0.5, bw - 1, bh - 1, r), { seed: it.seed + 2, roughness: 0.5, stroke: 'none',
        fill: color(el, rule.paper), fillStyle: 'solid' }));
    }
    if (rule.head) {
      var th = el.querySelector('thead');
      if (th && th.offsetHeight) {
        svg.appendChild(rc.path(rr(bx + 1, by + 1, bw - 2, th.offsetHeight, 0), { seed: it.seed + 1, roughness: 0.6, stroke: 'none',
          fill: color(el, rule.head), fillStyle: 'hachure', hachureAngle: -41, hachureGap: 6, fillWeight: 0.5 }));
      }
    }
    var ins = rule.over ? 1.5 : 0.5;
    svg.appendChild(rc.path(rr(bx + ins, by + ins, bw - 2 * ins, bh - 2 * ins, r), o));
  }

  function scan() {
    RULES.forEach(function (rule, ri) {
      document.querySelectorAll(rule.sel).forEach(function (el, i) {
        if (el.__sk) return;
        el.__sk = true;
        // a picture cannot hold the layer: wrap it, the wrapper is the host, the frame follows the picture
        if (el.tagName === 'IMG') {
          var wrap = document.createElement('span');
          wrap.className = 'sk-imgwrap';
          el.parentNode.insertBefore(wrap, el);
          wrap.appendChild(el);
          wrap.__sk = true;
          wrap.__skImg = el;
          el = wrap;
        }
        el.setAttribute('data-sk', '');
        // the layer needs a positioned host; a host that is positioned already keeps its own position
        if (getComputedStyle(el).position === 'static') el.classList.add('sk-rel');
        if (rule.fill) el.classList.add('sk-fill');
        if (rule.keep) el.classList.add('sk-keep');
        if (rule.over) el.classList.add('sk-over');
        var it = { el: el, rule: rule, seed: hash(rule.sel + ':' + i + ':' + location.pathname) };
        items.push(it);
        if (ro) ro.observe(el);
      });
    });
  }

  function redraw() { items.forEach(draw); }

  var ro = window.ResizeObserver ? new ResizeObserver(function () { redraw(); }) : null;

  function start() {
    if (!window.rough) return;
    scan();
    redraw();
    // lazy pictures and fonts change sizes after load
    window.addEventListener('load', redraw);
    // schemes and sheets add their buttons after the page loads: pick them up too (one pass per frame at most,
    // changes inside an svg and text changes do not count, so animated schemes cost nothing)
    var pending = false;
    new MutationObserver(function (ms) {
      if (pending) return;
      for (var i = 0; i < ms.length; i++) {
        if (ms[i].target instanceof SVGElement) continue;
        for (var j = 0; j < ms[i].addedNodes.length; j++) {
          var n = ms[i].addedNodes[j];
          if (n.nodeType === 1 && !(n instanceof SVGElement)) {
            pending = true;
            requestAnimationFrame(function () { pending = false; scan(); redraw(); });
            return;
          }
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);
    // theme switch: colors come from CSS variables
    new MutationObserver(function () { items.forEach(function (it) { it.key = null; }); redraw(); })
      .observe(document.body, { attributes: true, attributeFilter: ['data-md-color-scheme'] });
  }

  function boot() {
    if (window.rough) { start(); return; }
    var prev = document.querySelector('script[data-rough]');
    if (prev) { prev.addEventListener('load', start); return; }
    var s = document.createElement('script'); s.src = ROUGH_URL; s.setAttribute('data-rough', '1'); s.onload = start;
    document.head.appendChild(s);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
