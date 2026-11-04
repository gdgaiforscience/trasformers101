/* =====================================================================
   Inside the Black Box — shared helpers (vanilla JS, no dependencies)
   Exposes window.U
   ===================================================================== */
(function () {
  'use strict';

  const C = {
    bg: '#0f1115', bg2: '#151820', bg3: '#1b2029', line: '#2a3140', grid: '#2a3140', gridMinor: '#1b2029',
    text: '#eceff4', muted: '#9aa4b2', dim: '#5d6675',
    blue: '#58c4dd', orange: '#f0ac5f', yellow: '#ffd54f', teal: '#5cd0b3', green: '#83c167',
    red: '#fc6255', purple: '#9a72ac', pink: '#e07a9f',
    gblue: '#4285f4', gred: '#ea4335', gyellow: '#fbbc04', ggreen: '#34a853'
  };
  const FONT = {
    sans: '"Roboto", "Segoe UI", system-ui, sans-serif',
    math: '"LM Roman", "Latin Modern Roman", "Times New Roman", serif',
    mono: '"Noto Sans Mono", "DejaVu Sans Mono", monospace'
  };

  // ---------- math ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const invLerp = (a, b, v) => (v - a) / (b - a);
  const remap = (v, a, b, c, d) => c + (d - c) * ((v - a) / (b - a));
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);   // easeInOutCubic
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const sigmoid = z => 1 / (1 + Math.exp(-z));
  const smoothstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  function rng(seed) {                       // mulberry32
    let s = (seed >>> 0) || 1;
    const r = function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.normal = function () { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    return r;
  }

  // ---------- colour ----------
  function hexToRgb(h) {
    if (h[0] === '#') h = h.slice(1);
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgbStr = (r, g, b, a) => (a === undefined ? `rgb(${r | 0},${g | 0},${b | 0})` : `rgba(${r | 0},${g | 0},${b | 0},${a})`);
  function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return rgbStr(r, g, b, a); }
  function mixRgb(h1, h2, t) {
    const a = hexToRgb(h1), b = hexToRgb(h2);
    return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  }
  function mix(h1, h2, t, alpha) { const m = mixRgb(h1, h2, t); return rgbStr(m[0], m[1], m[2], alpha); }
  function rampRgb(stops, t) {
    t = clamp(t, 0, 1);
    const n = stops.length - 1, i = Math.min(n - 1, Math.floor(t * n)), f = t * n - i;
    return mixRgb(stops[i], stops[i + 1], f);
  }
  const SEQ = ['#14243a', '#1d3a5f', '#58c4dd', '#5cd0b3', '#ffd54f'];
  function seq(t, a) { const c = rampRgb(SEQ, t); return rgbStr(c[0], c[1], c[2], a); }
  function diverge(v, a) {                 // v in [-1, 1]: red .. dark .. blue
    v = clamp(v, -1, 1);
    const c = v < 0 ? mixRgb('#1a1d24', C.red, -v) : mixRgb('#1a1d24', C.blue, v);
    return rgbStr(c[0], c[1], c[2], a);
  }
  function divergeRgb(v) { v = clamp(v, -1, 1); return v < 0 ? mixRgb('#1a1d24', C.red, -v) : mixRgb('#1a1d24', C.blue, v); }

  // ---------- formatting ----------
  const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  function fmt(v, d = 2) { if (!isFinite(v)) return '—'; const s = v.toFixed(d); return s === '-0.00' || s === '-0.0' || s === '-0' ? s.slice(1) : s; }
  function fmtSigned(v, d = 2) { const s = fmt(Math.abs(v), d); return (v < 0 ? '−' : '+') + s; }
  function fmtMinus(v, d = 2) { const s = fmt(v, d); return s.replace('-', '−'); }
  function fmtSci(v, d = 1) {
    if (v === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e);
    return `${m.toFixed(d)}×10${String(e).split('').map(c => SUP[c]).join('')}`;
  }
  function fmtBig(n) {
    const a = Math.abs(n);
    if (a >= 1e12) return (n / 1e12).toFixed(a >= 1e13 ? 0 : 1) + ' trillion';
    if (a >= 1e9) return (n / 1e9).toFixed(a >= 1e10 ? 0 : 1) + ' billion';
    if (a >= 1e6) return (n / 1e6).toFixed(a >= 1e7 ? 0 : 1) + ' million';
    if (a >= 1e3) return Math.round(n).toLocaleString('en-US');
    return String(Math.round(n * 100) / 100);
  }
  function fmtPct(p, d) {
    if (d === undefined) d = p >= 0.1 ? 1 : p >= 0.01 ? 2 : p >= 0.001 ? 3 : 4;
    const v = p * 100;
    if (v > 0 && v < Math.pow(10, -d)) return '<' + Math.pow(10, -d).toFixed(d) + '%';
    return v.toFixed(d) + '%';
  }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function showToken(s) { return esc(s).replace(/ /g, '<span class="dim">␣</span>').replace(/\n/g, '<span class="dim">↵</span>'); }

  // ---------- DOM ----------
  function el(tag, attrs, parent) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k === 'class') e.className = attrs[k];
      else if (k === 'style' && typeof attrs[k] === 'object') Object.assign(e.style, attrs[k]);
      else if (k.startsWith('on') && typeof attrs[k] === 'function') e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(e);
    return e;
  }
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  function releaseFocus(e) { if (e && e.target && e.target.blur) e.target.blur(); }

  function slider(parent, o) {
    const wrap = el('div', { class: 'ctl' }, parent);
    if (o.label) el('label', { html: o.label }, wrap);
    const input = el('input', { type: 'range', min: o.min, max: o.max, step: o.step || 'any', value: o.value }, wrap);
    if (o.width) input.style.width = o.width + 'px';
    if (o.color) input.style.setProperty('--thumb', o.color);
    const fmtFn = o.fmt || (v => fmt(v, 2));
    const val = el('span', { class: 'val', html: fmtFn(+o.value) }, wrap);
    const api = {
      wrap, input, valEl: val,
      get: () => +input.value,
      set(v, silent) { input.value = v; val.innerHTML = fmtFn(+input.value); if (!silent && o.oninput) o.oninput(+input.value); }
    };
    input.addEventListener('input', () => { val.innerHTML = fmtFn(+input.value); if (o.oninput) o.oninput(+input.value); });
    input.addEventListener('change', releaseFocus);
    input.addEventListener('pointerup', releaseFocus);
    return api;
  }
  function btn(parent, text, onclick, cls) {
    const b = el('button', { class: 'btn ' + (cls || ''), html: text }, parent);
    b.addEventListener('click', e => { onclick && onclick(e); b.blur(); });
    return b;
  }
  function seg(parent, items, value, onchange) {
    const box = el('div', { class: 'seg' }, parent);
    const buttons = items.map(it => {
      const b = el('button', { html: it.label }, box);
      b.dataset.value = it.value;
      b.addEventListener('click', () => { api.set(it.value); b.blur(); });
      return b;
    });
    const api = {
      el: box, value,
      set(v, silent) { api.value = v; buttons.forEach(b => b.classList.toggle('on', b.dataset.value === String(v))); if (!silent && onchange) onchange(v); }
    };
    api.set(value, true);
    return api;
  }
  function tip(container) {
    const t = el('div', { class: 'tip' }, container);
    return {
      el: t,
      show(html, x, y) {
        t.innerHTML = html; t.classList.add('on');
        const cw = container.clientWidth, ch = container.clientHeight;
        const tw = t.offsetWidth, th = t.offsetHeight;
        let px = x + 18, py = y + 18;
        if (px + tw > cw - 6) px = x - tw - 18;
        if (py + th > ch - 6) py = y - th - 18;
        t.style.left = Math.max(4, px) + 'px'; t.style.top = Math.max(4, py) + 'px';
      },
      hide() { t.classList.remove('on'); }
    };
  }
  function missing(container, msg) {
    const m = el('div', { class: 'missing', html: msg || 'Data not generated yet — run the build scripts in <span class="mono">src/python/</span>.' }, container);
    m.style.height = '100%';
    return m;
  }
  const data = key => (window.AIDATA && window.AIDATA[key]) || null;

  // ---------- canvas ----------
  const canvases = [];
  function stageScale() { return (window.Deck && window.Deck.scale) || 1; }
  function canvas(container, opts) {
    opts = opts || {};
    const cv = el('canvas', null, container);
    const ctx = cv.getContext('2d');
    const api = { canvas: cv, ctx, w: 0, h: 0, k: 1, onresize: opts.onresize || null };
    api.resize = function (initial) {
      const w = opts.width || container.clientWidth || 800;
      const h = opts.height || container.clientHeight || 450;
      const k = Math.min(3, (window.devicePixelRatio || 1) * stageScale());
      api.w = w; api.h = h; api.k = k;
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
      cv.width = Math.max(1, Math.round(w * k)); cv.height = Math.max(1, Math.round(h * k));
      ctx.setTransform(k, 0, 0, k, 0, 0);
      // not on the first sizing: the caller hasn't stored the returned api yet (this.cv = U.canvas(...))
      if (api.onresize && !initial) api.onresize(api);
    };
    api.toLocal = function (e) {
      const r = cv.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return { x: (t.clientX - r.left) * (api.w / r.width), y: (t.clientY - r.top) * (api.h / r.height) };
    };
    api.clear = function (color) {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (color) { ctx.fillStyle = color; ctx.fillRect(0, 0, cv.width, cv.height); } else ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.restore();
    };
    api.resize(true);
    canvases.push(api);
    return api;
  }
  function resizeAll() { canvases.forEach(c => c.resize()); }

  // 2D view: maps data coords to pixel coords inside a rectangle
  function view(px, py, pw, ph, x0, x1, y0, y1) {
    const v = { px, py, pw, ph, x0, x1, y0, y1 };
    v.sx = x => px + (x - v.x0) / (v.x1 - v.x0) * pw;
    v.sy = y => py + ph - (y - v.y0) / (v.y1 - v.y0) * ph;
    v.ix = X => v.x0 + (X - px) / pw * (v.x1 - v.x0);
    v.iy = Y => v.y0 + (py + ph - Y) / ph * (v.y1 - v.y0);
    v.inside = (X, Y) => X >= px && X <= px + pw && Y >= py && Y <= py + ph;
    return v;
  }
  function niceStep(range, target) {
    const raw = range / (target || 8), p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  }
  function grid(ctx, v, o) {
    o = o || {};
    const sx = o.step || niceStep(v.x1 - v.x0, o.target || 8), sy = o.stepY || o.step || niceStep(v.y1 - v.y0, o.target || 6);
    ctx.save();
    ctx.beginPath(); ctx.rect(v.px, v.py, v.pw, v.ph); ctx.clip();
    ctx.lineWidth = 1;
    if (o.minor !== false) {
      ctx.strokeStyle = o.minorColor || C.gridMinor; ctx.beginPath();
      for (let x = Math.ceil(v.x0 / (sx / 2)) * (sx / 2); x <= v.x1; x += sx / 2) { const X = Math.round(v.sx(x)) + 0.5; ctx.moveTo(X, v.py); ctx.lineTo(X, v.py + v.ph); }
      for (let y = Math.ceil(v.y0 / (sy / 2)) * (sy / 2); y <= v.y1; y += sy / 2) { const Y = Math.round(v.sy(y)) + 0.5; ctx.moveTo(v.px, Y); ctx.lineTo(v.px + v.pw, Y); }
      ctx.stroke();
    }
    ctx.strokeStyle = o.color || C.grid; ctx.beginPath();
    for (let x = Math.ceil(v.x0 / sx) * sx; x <= v.x1 + 1e-9; x += sx) { const X = Math.round(v.sx(x)) + 0.5; ctx.moveTo(X, v.py); ctx.lineTo(X, v.py + v.ph); }
    for (let y = Math.ceil(v.y0 / sy) * sy; y <= v.y1 + 1e-9; y += sy) { const Y = Math.round(v.sy(y)) + 0.5; ctx.moveTo(v.px, Y); ctx.lineTo(v.px + v.pw, Y); }
    ctx.stroke();
    if (o.axes !== false) {
      ctx.strokeStyle = o.axisColor || '#4a5466'; ctx.lineWidth = 1.5; ctx.beginPath();
      if (v.x0 <= 0 && v.x1 >= 0) { const X = v.sx(0); ctx.moveTo(X, v.py); ctx.lineTo(X, v.py + v.ph); }
      if (v.y0 <= 0 && v.y1 >= 0) { const Y = v.sy(0); ctx.moveTo(v.px, Y); ctx.lineTo(v.px + v.pw, Y); }
      ctx.stroke();
    }
    ctx.restore();
    if (o.labels) {
      ctx.save(); ctx.fillStyle = C.muted; ctx.font = `16px ${FONT.mono}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const fx = o.fmtX || (x => +x.toFixed(6));
      for (let x = Math.ceil(v.x0 / sx) * sx; x <= v.x1 + 1e-9; x += sx) ctx.fillText(fx(x), v.sx(x), v.py + v.ph + 8);
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      const fy = o.fmtY || (y => +y.toFixed(6));
      for (let y = Math.ceil(v.y0 / sy) * sy; y <= v.y1 + 1e-9; y += sy) ctx.fillText(fy(y), v.px - 10, v.sy(y));
      ctx.restore();
    }
  }
  function arrow(ctx, x1, y1, x2, y2, o) {
    o = o || {};
    const lw = o.width || 3, head = o.head || Math.max(10, lw * 4);
    const ang = Math.atan2(y2 - y1, x2 - x1), len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 1) return;
    const hx = x2 - Math.cos(ang) * head * 0.9, hy = y2 - Math.sin(ang) * head * 0.9;
    ctx.save();
    ctx.strokeStyle = o.color || C.text; ctx.fillStyle = o.color || C.text; ctx.lineWidth = lw; ctx.lineCap = 'round';
    if (o.glow) { ctx.shadowColor = o.color; ctx.shadowBlur = o.glow; }
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(ang - 0.42) * head, y2 - Math.sin(ang - 0.42) * head);
    ctx.lineTo(x2 - Math.cos(ang + 0.42) * head, y2 - Math.sin(ang + 0.42) * head);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function circle(ctx, x, y, r, fill, stroke, lw) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
  }
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function text(ctx, s, x, y, o) {
    o = o || {};
    ctx.save();
    ctx.font = o.font || `${o.size || 22}px ${o.family || FONT.sans}`;
    ctx.fillStyle = o.color || C.text;
    ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.baseline || 'alphabetic';
    if (o.glow) { ctx.shadowColor = o.glowColor || o.color; ctx.shadowBlur = o.glow; }
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    ctx.fillText(s, x, y);
    ctx.restore();
  }
  function mathText(ctx, s, x, y, o) { o = Object.assign({ family: FONT.math }, o || {}); o.font = `${o.italic === false ? '' : 'italic '}${o.size || 28}px ${FONT.math}`; text(ctx, s, x, y, o); }

  // ---------- animation ----------
  function animator(fn) {
    let raf = 0, last = 0, t0 = 0;
    const api = {
      running: false,
      start() { if (api.running) return; api.running = true; last = performance.now(); if (!t0) t0 = last; raf = requestAnimationFrame(tick); },
      stop() { api.running = false; cancelAnimationFrame(raf); },
      toggle() { api.running ? api.stop() : api.start(); }
    };
    function tick(now) {
      if (!api.running) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      fn(dt, (now - t0) / 1000);
      raf = requestAnimationFrame(tick);
    }
    return api;
  }
  function tween(duration, onUpdate, onDone, easing) {
    const e = easing || ease; let raf = 0, cancelled = false; const t0 = performance.now();
    function tick(now) {
      if (cancelled) return;
      const t = clamp((now - t0) / (duration * 1000), 0, 1);
      onUpdate(e(t), t);
      if (t < 1) raf = requestAnimationFrame(tick); else if (onDone) onDone();
    }
    raf = requestAnimationFrame(tick);
    return { cancel() { cancelled = true; cancelAnimationFrame(raf); } };
  }

  window.U = {
    C, FONT, clamp, lerp, invLerp, remap, ease, easeOut, sigmoid, smoothstep, rng,
    hexToRgb, rgbStr, rgba, mix, mixRgb, rampRgb, seq, diverge, divergeRgb,
    fmt, fmtSigned, fmtMinus, fmtSci, fmtBig, fmtPct, esc, showToken,
    el, $, $$, slider, btn, seg, tip, missing, data, releaseFocus,
    canvas, resizeAll, view, niceStep, grid, arrow, circle, roundRect, text, mathText,
    animator, tween
  };
})();
