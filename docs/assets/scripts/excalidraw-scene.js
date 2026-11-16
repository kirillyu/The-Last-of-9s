/*
 * excalidraw-scene.js - схемы статей на движке сайта.
 *
 * Элементы берутся из авторского файла Excalidraw (build_scenes.py) и рисуются так же, как их рисует сам
 * Excalidraw: rough.js с теми же seed и настройками, штриховка, скругления, наконечники стрелок, Excalifont.
 * Поверх идет пассивная анимация: когда схема на экране, сценарий проигрывается сам (появление, прорисовка
 * линий, движение по стрелкам, перемещение блоков), в конце готовая схема стоит, чтобы ее дочитать, потом повтор.
 * Читателю ничего нажимать не нужно. С prefers-reduced-motion сразу готовая схема.
 *
 * Разметка: <div class="exc-scene" data-scene="runtime-models_02"></div>, данные в window.EXC_SCENES.
 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var FONT_BASE = 'https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@0.18.0/dist/prod/fonts/Excalifont/';
  var FONT_FILES = [
    { file: 'Excalifont-Regular-a88b72a24fb54c9f94e3b5fdaa7481c9.woff2',
      range: 'U+20-7e,U+a0-a3,U+a5-a6,U+a8-ab,U+ad-b1,U+b4,U+b6-b8,U+ba-ff,U+131,U+152-153,U+2bc,U+2c6,U+2da,U+2dc,U+304,U+308,U+2013-2014,U+2018-201a,U+201c-201e,U+2020,U+2022,U+2024-2026,U+2030,U+2039-203a,U+20ac,U+2122,U+2212' },
    { file: 'Excalifont-Regular-b9dcf9d2e50a1eaf42fc664b50a3fd0d.woff2', range: 'U+400-45f,U+490-491,U+2116' }
  ];
  var FONT = 'Excalifont, Xiaolai, "Segoe UI Emoji", cursive';
  var ROUGH_URL = 'https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.js';

  var fontsReady = null;
  function loadFonts() {
    if (fontsReady) return fontsReady;
    if (!window.FontFace || !document.fonts) return (fontsReady = Promise.resolve());
    fontsReady = Promise.all(FONT_FILES.map(function (f) {
      var face = new FontFace('Excalifont', 'url(' + FONT_BASE + f.file + ') format("woff2")', { unicodeRange: f.range });
      document.fonts.add(face);
      return face.load().catch(function () {});
    })).then(function () {});
    return fontsReady;
  }

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // ------------------------------------------------------------------ Excalidraw shapes (port of element/shape.ts)
  function isLinear(e) { return e.type === 'arrow' || e.type === 'line'; }
  function transparent(c) { return !c || c === 'transparent' || /^#[0-9a-f]{6}00$/i.test(c); }

  function adjustRoughness(e) {
    var maxS = Math.max(e.width, e.height), minS = Math.min(e.width, e.height);
    if ((minS >= 20 && maxS >= 50) || (minS >= 15 && e.roundness && !isLinear(e)) || (isLinear(e) && maxS >= 50)) return e.roughness;
    return Math.min(e.roughness / (maxS < 10 ? 3 : 2), 2.5);
  }

  function roughOptions(e, continuous) {
    var o = {
      seed: e.seed,
      strokeLineDash: e.strokeStyle === 'dashed' ? [8, 8 + e.strokeWidth] : e.strokeStyle === 'dotted' ? [1.5, 6 + e.strokeWidth] : undefined,
      disableMultiStroke: e.strokeStyle !== 'solid',
      strokeWidth: e.strokeStyle !== 'solid' ? e.strokeWidth + 0.5 : e.strokeWidth,
      fillWeight: e.strokeWidth / 2,
      hachureGap: e.strokeWidth * 4,
      roughness: adjustRoughness(e),
      stroke: e.strokeColor,
      preserveVertices: continuous || e.roughness < 2
    };
    if (e.type === 'rectangle' || e.type === 'diamond' || e.type === 'ellipse') {
      o.fillStyle = e.fillStyle;
      o.fill = transparent(e.backgroundColor) ? undefined : e.backgroundColor;
      if (e.type === 'ellipse') o.curveFitting = 1;
    } else if (e.type === 'line' && isLoop(e.points)) {
      o.fillStyle = e.fillStyle;
      o.fill = transparent(e.backgroundColor) ? undefined : e.backgroundColor;
    }
    return o;
  }

  function isLoop(p) {
    if (!p || p.length < 3) return false;
    var a = p[0], b = p[p.length - 1];
    return Math.hypot(a[0] - b[0], a[1] - b[1]) <= 8;
  }

  function cornerRadius(x, e) {
    if (!e.roundness) return 0;
    if (e.roundness.type === 1 || e.roundness.type === 2) return x * 0.25;
    var fixed = e.roundness.value != null ? e.roundness.value : 32;
    return x <= fixed / 0.25 ? x * 0.25 : fixed;
  }

  function rotate(p, c, a) {
    var s = Math.sin(a), k = Math.cos(a), x = p[0] - c[0], y = p[1] - c[1];
    return [x * k - y * s + c[0], x * s + y * k + c[1]];
  }

  // arrowhead lines to the tip, as getArrowheadPoints in element/bounds.ts ("arrow" head)
  function arrowhead(e, drawable, position) {
    var set = null;
    drawable.sets.forEach(function (s) { if (!set && s.type === 'path') set = s; });
    var ops = (set || drawable.sets[0]).ops;
    if (ops.length < 2) return null;
    var index = position === 'start' ? 1 : ops.length - 1;
    var data = ops[index].data;
    if (!data || data.length !== 6) return null;
    var p3 = [data[4], data[5]], p2 = [data[2], data[3]], p1 = [data[0], data[1]], p0 = [0, 0];
    var prev = ops[index - 1];
    if (prev.op === 'move') p0 = [prev.data[0], prev.data[1]];
    else if (prev.op === 'bcurveTo') p0 = [prev.data[4], prev.data[5]];
    function eq(t, i) { return Math.pow(1 - t, 3) * p3[i] + 3 * t * Math.pow(1 - t, 2) * p2[i] + 3 * t * t * (1 - t) * p1[i] + p0[i] * Math.pow(t, 3); }
    var tip = position === 'start' ? p0 : p3;
    var x1 = eq(0.3, 0), y1 = eq(0.3, 1);
    var dist = Math.hypot(tip[0] - x1, tip[1] - y1) || 1;
    var nx = (tip[0] - x1) / dist, ny = (tip[1] - y1) / dist;
    var pts = e.points, c = position === 'end' ? pts[pts.length - 1] : pts[0];
    var q = pts.length > 1 ? (position === 'end' ? pts[pts.length - 2] : pts[1]) : [0, 0];
    var len = Math.hypot(c[0] - q[0], c[1] - q[1]);
    var size = Math.min(25, len * 0.5);
    var shrink = Math.max(0, Math.min(1, (25 - size) / 15));
    var ang = (20 + 10 * shrink) * Math.PI / 180;
    var xs = tip[0] - nx * size, ys = tip[1] - ny * size;
    return { tip: tip, a: rotate([xs, ys], tip, -ang), b: rotate([xs, ys], tip, ang) };
  }

  function shapes(gen, e) {
    var w = e.width, h = e.height;
    if (e.type === 'rectangle') {
      if (e.roundness) {
        var r = cornerRadius(Math.min(w, h), e);
        return [gen.path('M ' + r + ' 0 L ' + (w - r) + ' 0 Q ' + w + ' 0, ' + w + ' ' + r + ' L ' + w + ' ' + (h - r) +
          ' Q ' + w + ' ' + h + ', ' + (w - r) + ' ' + h + ' L ' + r + ' ' + h + ' Q 0 ' + h + ', 0 ' + (h - r) +
          ' L 0 ' + r + ' Q 0 0, ' + r + ' 0', roughOptions(e, true))];
      }
      return [gen.rectangle(0, 0, w, h, roughOptions(e, false))];
    }
    if (e.type === 'ellipse') return [gen.ellipse(w / 2, h / 2, w, h, roughOptions(e, false))];
    if (e.type === 'diamond') {
      var tx = w / 2, ty = 0, rx = w, ry = h / 2, bx = w / 2, by = h, lx = 0, ly = h / 2;
      if (e.roundness) {
        var vr = cornerRadius(Math.abs(tx - lx), e), hr = cornerRadius(Math.abs(ry - ty), e);
        return [gen.path('M ' + (tx + vr) + ' ' + (ty + hr) + ' L ' + (rx - vr) + ' ' + (ry - hr) +
          ' C ' + rx + ' ' + ry + ', ' + rx + ' ' + ry + ', ' + (rx - vr) + ' ' + (ry + hr) +
          ' L ' + (bx + vr) + ' ' + (by - hr) + ' C ' + bx + ' ' + by + ', ' + bx + ' ' + by + ', ' + (bx - vr) + ' ' + (by - hr) +
          ' L ' + (lx + vr) + ' ' + (ly + hr) + ' C ' + lx + ' ' + ly + ', ' + lx + ' ' + ly + ', ' + (lx + vr) + ' ' + (ly - hr) +
          ' L ' + (tx - vr) + ' ' + (ty + hr) + ' C ' + tx + ' ' + ty + ', ' + tx + ' ' + ty + ', ' + (tx + vr) + ' ' + (ty + hr), roughOptions(e, true))];
      }
      return [gen.polygon([[tx, ty], [rx, ry], [bx, by], [lx, ly]], roughOptions(e, false))];
    }
    if (isLinear(e)) {
      var o = roughOptions(e, false), pts = e.points.length ? e.points : [[0, 0]];
      var main = !e.roundness ? (o.fill ? gen.polygon(pts, o) : gen.linearPath(pts, o)) : gen.curve(pts, o);
      var out = [main];
      if (e.type === 'arrow') {
        var lo = {}; for (var k in o) lo[k] = o[k];
        if (e.strokeStyle === 'dotted') lo.strokeLineDash = [1.5, 6 + e.strokeWidth - 2]; else delete lo.strokeLineDash;
        lo.roughness = Math.min(1, lo.roughness || 0);
        [['start', e.startArrowhead], ['end', e.endArrowhead]].forEach(function (pair) {
          if (!pair[1]) return;
          var ah = arrowhead(e, main, pair[0]);
          if (!ah) return;
          out.push(gen.line(ah.a[0], ah.a[1], ah.tip[0], ah.tip[1], lo));
          out.push(gen.line(ah.b[0], ah.b[1], ah.tip[0], ah.tip[1], lo));
        });
      }
      return out;
    }
    return [];
  }

  function linearCenter(e) {
    var xs = e.points.map(function (p) { return p[0]; }), ys = e.points.map(function (p) { return p[1]; });
    return [(Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2, (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2];
  }

  // one element: outer <g> for animation (opacity, moves), inner <g> with the Excalidraw transform
  function drawElement(rc, layer, e, haloIds) {
    var outer = el('g', { 'class': 'exc-el', 'data-i': e.i }, layer);
    var deg = (e.angle || 0) * 180 / Math.PI;
    var c = isLinear(e) ? linearCenter(e) : [e.width / 2, e.height / 2];
    var inner = el('g', { transform: 'translate(' + e.x + ' ' + e.y + ')' + (deg ? ' rotate(' + deg + ' ' + c[0] + ' ' + c[1] + ')' : '') }, outer);
    var body = el('g', {}, inner), lineNodes = [];
    if (e.type === 'text') {
      var lines = String(e.text).replace(/\r\n?/g, '\n').split('\n');
      var lh = e.fontSize * (e.lineHeight || 1.25);
      var em = e.fontSize / 1000;
      var vOff = em * 886 + (lh - em * 886 - em * 374) / 2;
      var hx = e.textAlign === 'center' ? e.width / 2 : e.textAlign === 'right' ? e.width : 0;
      var anchor = e.textAlign === 'center' ? 'middle' : e.textAlign === 'right' ? 'end' : 'start';
      lines.forEach(function (ln, i) {
        var t = el('text', { x: hx, y: i * lh + vOff, 'font-family': FONT, 'font-size': e.fontSize + 'px', fill: e.strokeColor,
          'text-anchor': anchor, 'dominant-baseline': 'alphabetic', style: 'white-space: pre;' }, body);
        if (haloIds[e.i]) { t.setAttribute('stroke', '#ffffff'); t.setAttribute('stroke-width', e.fontSize / 3); t.setAttribute('stroke-linejoin', 'round'); t.setAttribute('paint-order', 'stroke'); }
        t.textContent = ln;
        lineNodes.push(t);
      });
    } else if (rc) {
      shapes(rc.generator, e).forEach(function (d) { body.appendChild(rc.draw(d)); });
    }
    return { outer: outer, inner: inner, body: body, e: e, lines: lineNodes };
  }

  // ------------------------------------------------------------------ paths along linear elements (scene coords)
  function catmull(pts, steps) {
    if (pts.length < 3) return pts.slice();
    var out = [pts[0]];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      for (var s = 1; s <= steps; s++) {
        var t = s / steps, t2 = t * t, t3 = t2 * t;
        out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
      }
    }
    return out;
  }
  function localPath(e) { return e.roundness ? catmull(e.points, 16) : e.points.slice(); }
  function scenePath(e) {
    var deg = e.angle || 0, c = linearCenter(e);
    return localPath(e).map(function (p) { var q = deg ? rotate(p, c, deg) : p; return [q[0] + e.x, q[1] + e.y]; });
  }
  function measure(pts) {
    var acc = [0];
    for (var i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts: pts, acc: acc, len: acc[acc.length - 1] };
  }
  function pointAt(m, f) {
    var L = f * m.len, i = 1;
    while (i < m.acc.length - 1 && m.acc[i] < L) i++;
    var seg = m.acc[i] - m.acc[i - 1] || 1, t = (L - m.acc[i - 1]) / seg;
    return [m.pts[i - 1][0] + (m.pts[i][0] - m.pts[i - 1][0]) * t, m.pts[i - 1][1] + (m.pts[i][1] - m.pts[i - 1][1]) * t];
  }
  function d(pts) { return 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L'); }

  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  // ------------------------------------------------------------------ one scene
  var uid = 0;
  function Scene(root, data) {
    this.root = root; this.data = data; this.id = 'exc' + (++uid);
    this.reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.build();
  }

  Scene.prototype.build = function () {
    var data = this.data, self = this;
    var svg = el('svg', { xmlns: NS, viewBox: '0 0 ' + data.w + ' ' + data.h, role: 'img', 'aria-label': data.title || 'схема',
      style: '--exc-glow:' + Math.max(6, Math.round(data.w / 140)) + 'px' });
    this.svg = svg;
    var defs = el('defs', {}, svg);
    this.defs = defs;
    el('rect', { x: 0, y: 0, width: data.w, height: data.h, fill: '#ffffff', 'class': 'exc-bg' }, svg);
    var layer = el('g', {}, svg);
    var rc = window.rough ? window.rough.svg(svg) : null;
    var halo = {};
    data.els.forEach(function (e) { if (e.halo) halo[e.i] = true; });
    this.items = {};
    data.els.forEach(function (e) { self.items[e.i] = drawElement(rc, layer, e, halo); });
    this.tokens = el('g', { 'class': 'exc-tokens' }, svg);
    this.root.appendChild(svg);
    // everything the timeline shows starts hidden; the rest is the static base of the picture
    this.animated = {}; this.typed = {};
    (data.tl || []).forEach(function (s) {
      (s.lines || []).forEach(function (i) { self.typed[i] = true; });
      ['show', 'draw'].forEach(function (k) { (s[k] || []).forEach(function (i) { self.animated[i] = true; }); });
      if (s.sweep) s.sweep.ids.forEach(function (i) { self.animated[i] = true; });
    });
  };

  // ---- state helpers
  Scene.prototype.each = function (ids, fn) { var self = this; (ids || []).forEach(function (i) { if (self.items[i]) fn(self.items[i]); }); };
  Scene.prototype.setVisible = function (ids, on) { this.each(ids, function (it) { it.outer.classList.toggle('exc-off', !on); }); };
  Scene.prototype.setFocus = function (ids) {
    var set = {}; (ids || []).forEach(function (i) { set[i] = true; });
    this.svg.classList.toggle('exc-focusing', !!(ids && ids.length));
    for (var i in this.items) this.items[i].outer.classList.toggle('exc-hl', !!set[i]);
  };
  Scene.prototype.resetMoves = function () {
    for (var i in this.items) { var it = this.items[i]; it.dx = 0; it.dy = 0; it.outer.style.transform = ''; }
  };
  Scene.prototype.clearEffects = function () {
    for (var i in this.items) {
      var it = this.items[i];
      it.body.removeAttribute('mask'); it.outer.removeAttribute('clip-path');
    }
    while (this.defs.firstChild) this.defs.removeChild(this.defs.firstChild);
    while (this.tokens.firstChild) this.tokens.removeChild(this.tokens.firstChild);
  };
  Scene.prototype.showLines = function (i, n) {
    var it = this.items[i]; if (!it) return;
    it.lines.forEach(function (t, k) { t.style.opacity = n == null || k < n ? '' : '0'; });
  };
  Scene.prototype.finalState = function () {
    this.clearEffects();
    for (var t in this.typed) this.showLines(t, null);
    for (var i in this.items) this.items[i].outer.classList.remove('exc-off');
    this.setFocus(null);
    this.resetMoves();
  };
  Scene.prototype.startState = function () {
    this.clearEffects(); this.setFocus(null); this.resetMoves();
    for (var i in this.items) this.items[i].outer.classList.toggle('exc-off', !!this.animated[i]);
    for (var t in this.typed) this.showLines(t, 0);
  };

  // text lines appear one by one (tables, label columns)
  Scene.prototype.typeLines = function (ids, dur) {
    var self = this;
    this.each(ids, function (it) {
      it.outer.classList.remove('exc-off');
      var n = it.lines.length, shown = 0;
      self.anims.push({ t0: self.now, dur: dur, tick: function (f) {
        var k = Math.min(n, Math.floor(f * n) + 1);
        if (k !== shown) { shown = k; self.showLines(it.e.i, k); }
      }, done: function () { self.showLines(it.e.i, null); } });
    });
  };

  // ---- effects driven by the scene clock, so they pause when the scene leaves the screen
  Scene.prototype.drawLine = function (i, dur) {
    var it = this.items[i]; if (!it) return;
    it.outer.classList.remove('exc-off');
    if (!isLinear(it.e)) { it.outer.classList.add('exc-pop'); return; }
    var mid = this.id + 'm' + i;
    var e = it.e, xs = e.points.map(function (p) { return p[0]; }), ys = e.points.map(function (p) { return p[1]; });
    var pad = 60;
    var mask = el('mask', { id: mid, maskUnits: 'userSpaceOnUse', x: Math.min.apply(null, xs) - pad, y: Math.min.apply(null, ys) - pad,
      width: Math.max.apply(null, xs) - Math.min.apply(null, xs) + 2 * pad, height: Math.max.apply(null, ys) - Math.min.apply(null, ys) + 2 * pad }, this.defs);
    var p = el('path', { d: d(localPath(e)), fill: 'none', stroke: '#fff', 'stroke-width': 30 + e.strokeWidth * 4, pathLength: 1,
      'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, mask);
    it.body.setAttribute('mask', 'url(#' + mid + ')');
    this.anims.push({ t0: this.now, dur: dur, tick: function (f) { p.setAttribute('stroke-dashoffset', 1 - ease(f)); },
      done: function () { it.body.removeAttribute('mask'); mask.remove(); } });
  };

  Scene.prototype.sweep = function (sw, dur) {
    var self = this, cid = this.id + 'c' + (++uid);
    var cp = el('clipPath', { id: cid, clipPathUnits: 'userSpaceOnUse' }, this.defs);
    var vertical = sw.dir === 'up';
    var r = el('rect', vertical ? { x: 0, y: sw.to, width: this.data.w, height: 0 } : { x: 0, y: 0, width: sw.from, height: this.data.h }, cp);
    this.each(sw.ids, function (it) { it.outer.classList.remove('exc-off'); it.outer.setAttribute('clip-path', 'url(#' + cid + ')'); });
    // labels appear when the sweep passes them
    var later = (sw.labels || []).map(function (l) { return { at: l.at, ids: l.ids, shown: false }; });
    later.forEach(function (l) { self.setVisible(l.ids, false); });
    this.anims.push({ t0: this.now, dur: dur, tick: function (f) {
      var k = ease(f);
      if (vertical) { var y = sw.from + (sw.to - sw.from) * k; r.setAttribute('y', y); r.setAttribute('height', sw.from - y + 2); }
      else r.setAttribute('width', sw.from + (sw.to - sw.from) * k);
      later.forEach(function (l) { if (!l.shown && k >= l.at) { l.shown = true; self.each(l.ids, function (it) { it.outer.classList.remove('exc-off'); it.outer.classList.add('exc-pop'); }); } });
    }, done: function () {
      self.each(sw.ids, function (it) { it.outer.removeAttribute('clip-path'); });
      later.forEach(function (l) { self.setVisible(l.ids, true); });
      cp.remove();
    } });
  };

  // a dot that runs along one or several linear elements one after another
  Scene.prototype.flow = function (chain, opts) {
    var self = this;
    var parts = chain.map(function (i) { return self.items[i]; }).filter(function (it) { return it && isLinear(it.e); });
    if (!parts.length) return 0;
    var ms = parts.map(function (it) { return measure(scenePath(it.e)); });
    var total = ms.reduce(function (s, m) { return s + m.len; }, 0);
    var dur = opts.dur || Math.max(600, Math.min(2200, total / 0.55));
    var color = opts.color || parts[0].e.strokeColor;
    var r = opts.r || 7 + parts[0].e.strokeWidth;
    var dot = el('circle', { r: r, fill: color, stroke: '#ffffff', 'stroke-width': 2.5, 'class': 'exc-token' }, this.tokens);
    this.anims.push({ t0: this.now + (opts.delay || 0), dur: dur, tick: function (f) {
      var L = ease(f) * total, k = 0;
      while (k < ms.length - 1 && L > ms[k].len) { L -= ms[k].len; k++; }
      var p = pointAt(ms[k], Math.min(1, L / (ms[k].len || 1)));
      dot.setAttribute('cx', p[0]); dot.setAttribute('cy', p[1]);
    }, done: function () { if (!opts.stay) dot.remove(); } });
    return dur + (opts.delay || 0);
  };

  Scene.prototype.move = function (mv, dur) {
    var self = this;
    this.each(mv.ids, function (it) {
      var x0 = it.dx || 0, y0 = it.dy || 0, x1 = mv.dx, y1 = mv.dy;
      it.dx = x1; it.dy = y1;
      self.anims.push({ t0: self.now, dur: dur, tick: function (f) {
        var k = ease(f);
        it.outer.style.transform = 'translate(' + (x0 + (x1 - x0) * k) + 'px,' + (y0 + (y1 - y0) * k) + 'px)';
      }, done: function () {} });
    });
  };

  Scene.prototype.pulse = function (ids) {
    this.each(ids, function (it) {
      it.outer.classList.remove('exc-pulse');
      void it.outer.getBoundingClientRect();
      it.outer.classList.add('exc-pulse');
    });
  };

  // ---- timeline
  Scene.prototype.runStep = function (s) {
    var self = this, longest = 0;
    if (s.hide) this.setVisible(s.hide, false);
    if (s.show) this.each(s.show, function (it) { it.outer.classList.remove('exc-off'); it.outer.classList.add('exc-pop'); });
    if ('focus' in s) this.setFocus(s.focus);
    if (s.draw) { var dd = s.drawDur || 650; s.draw.forEach(function (i) { self.drawLine(i, dd); }); longest = Math.max(longest, dd); }
    if (s.sweep) { var sd = s.sweep.dur || 2600; this.sweep(s.sweep, sd); longest = Math.max(longest, sd); }
    if (s.flow) s.flow.forEach(function (f) { longest = Math.max(longest, self.flow(f.chain, f)); });
    if (s.move) s.move.forEach(function (mv) { var md = mv.dur || 700; self.move(mv, md); longest = Math.max(longest, md); });
    if (s.pulse) this.pulse(s.pulse);
    if (s.lines) { var ld = s.linesDur || 1200; this.typeLines(s.lines, ld); longest = Math.max(longest, ld); }
    return s.d != null ? s.d : Math.max(longest, 500);
  };

  Scene.prototype.frame = function (ts) {
    var self = this;
    if (this.last == null) this.last = ts;
    var dt = Math.min(100, ts - this.last); this.last = ts;
    if (this.running) this.now += dt;
    // effects
    this.anims = this.anims.filter(function (a) {
      if (self.now < a.t0) return true;
      var f = Math.min(1, (self.now - a.t0) / a.dur);
      a.tick(f);
      if (f >= 1) { a.done(); return false; }
      return true;
    });
    // timeline
    if (this.running && this.now >= this.nextAt) {
      var tl = this.data.tl || [];
      if (this.step < tl.length) {
        this.nextAt = this.now + this.runStep(tl[this.step]);
        this.step++;
      } else if (this.step === tl.length) {
        // after the last effects: the complete picture as the author drew it and a pause to read it
        if (this.anims.length) { this.nextAt = this.now; }
        else {
        this.finalState(); this.anims = [];
        this.step++;
        this.nextAt = this.now + (this.data.hold || 7000);
        }
      } else if (!this.hovered) {
        this.restart();
      }
    }
    this.raf = (this.visible && !document.hidden) ? requestAnimationFrame(function (t) { self.frame(t); }) : null;
  };

  Scene.prototype.restart = function () {
    this.anims = []; this.now = 0; this.step = 0; this.nextAt = 400; this.startState();
  };

  Scene.prototype.wake = function () {
    var self = this;
    if (!this.raf && this.visible && !document.hidden) { this.last = null; this.raf = requestAnimationFrame(function (t) { self.frame(t); }); }
  };

  Scene.prototype.start = function () {
    var self = this;
    this.anims = [];
    if (this.reduced || !(this.data.tl || []).length) { this.finalState(); return; }
    this.running = true; this.restart();
    this.root.addEventListener('pointerenter', function () { self.hovered = true; });
    this.root.addEventListener('pointerleave', function () { self.hovered = false; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { self.visible = e.isIntersecting; });
        self.wake();
      }, { threshold: 0.35 }).observe(this.root);
    } else { this.visible = true; this.wake(); }
    document.addEventListener('visibilitychange', function () { self.wake(); });
  };

  // ------------------------------------------------------------------ full size view for big schemes
  function openFull(data) {
    var ov = document.createElement('div'); ov.className = 'exc-overlay'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    var close = document.createElement('button'); close.type = 'button'; close.className = 'exc-overlay__close'; close.textContent = 'закрыть';
    var host = document.createElement('div'); host.className = 'exc-scene__chart exc-overlay__chart';
    ov.appendChild(close); ov.appendChild(host); document.body.appendChild(ov);
    var s = new Scene(host, data); s.finalState();
    s.svg.setAttribute('width', data.w); s.svg.setAttribute('height', data.h);
    function done() { ov.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') done(); }
    close.addEventListener('click', done);
    ov.addEventListener('click', function (e) { if (e.target === ov) done(); });
    document.addEventListener('keydown', onKey);
    close.focus();
  }

  function mount(root) {
    var id = root.getAttribute('data-scene'), data = (window.EXC_SCENES || {})[id];
    if (!data || root.__exc) return;
    root.__exc = true;
    var ns = root.querySelector('noscript'); if (ns) ns.remove();
    var host = document.createElement('div'); host.className = 'exc-scene__chart';
    host.style.maxWidth = Math.round(data.w * (data.maxScale || 0.75)) + 'px';
    root.appendChild(host);
    var s = new Scene(host, data);
    if (data.w > 1400) {
      var big = document.createElement('button'); big.type = 'button'; big.className = 'exc-scene__full'; big.textContent = 'развернуть';
      big.addEventListener('click', function () { openFull(data); });
      root.appendChild(big);
    }
    s.start();
  }

  function startAll() {
    loadFonts().then(function () { Array.prototype.forEach.call(document.querySelectorAll('.exc-scene[data-scene]'), mount); });
  }
  function boot() {
    if (!document.querySelector('.exc-scene[data-scene]')) return;
    if (window.rough) { startAll(); return; }
    var prev = document.querySelector('script[data-rough]');
    if (prev) { prev.addEventListener('load', startAll); prev.addEventListener('error', startAll); return; }
    var s = document.createElement('script'); s.src = ROUGH_URL; s.setAttribute('data-rough', '1'); s.onload = startAll; s.onerror = startAll;
    document.head.appendChild(s);
  }
  window.ExcScene = { mount: mount, Scene: Scene };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
