/* =====================================================================
   Chapter 4 demos: "layers warp space"
   - warp: drag î / ĵ to set a 2x2 matrix, add a shift, bend with tanh/ReLU
   - deep: a trained 2-2-2-2 tanh network untangling two classes, layer by layer
   ===================================================================== */
(function () {
  'use strict';
  const { C, FONT, el, slider, btn, seg, fmt, fmtMinus, clamp, lerp } = U;
  const relu = v => (v > 0 ? v : 0);

  function warpData() {
    const D = U.data('warpnet');
    if (D) return D.data.x.map((p, i) => ({ x: p[0], y: p[1], c: D.data.y[i] }));
    return NN.datasets.moons(160, 0.06, 4).map(p => ({ x: p[0] * 2, y: p[1] * 2, c: p[2] }));
  }

  // ======================================================================
  // WARP: one layer = stretch/rotate (W) + shift (b) + bend (σ)
  // ======================================================================
  const PRESETS = {
    identity: { m: [1, 0, 0, 1] },
    rotate: { m: [Math.cos(0.7), -Math.sin(0.7), Math.sin(0.7), Math.cos(0.7)] },
    shear: { m: [1, 1, 0, 1] },
    stretch: { m: [1.8, 0, 0, 0.6] },
    flip: { m: [-1, 0, 0, 1] },
    squash: { m: [1, 0.5, 0.6, 0.3] }
  };
  Deck.register('warp', {
    init(slide) {
      const host = slide.querySelector('[data-role=plot]');
      const wrap = el('div', { class: 'canvas-wrap' }, host);
      this.cv = U.canvas(wrap, { onresize: () => this.draw() });
      this.pts = warpData().map(p => ({ x: p.x / 1.15, y: p.y / 1.15, c: p.c }));
      this.T = { a: 1, b: 0, c: 0, d: 1, b1: 0, b2: 0, tanh: 0, relu: 0 };
      this.P = Object.assign({}, this.T);
      const ctl = slide.querySelector('[data-role=ctl]');
      const mk = (key, label, color) => slider(ctl, { label, min: -2, max: 2, step: 0.05, value: this.T[key], color, width: 170, fmt: v => fmtMinus(v, 2), oninput: v => { this.T[key] = v; this.kick(); } });
      this.sl = {
        a: mk('a', '<span class="m c-yellow">a</span>', C.green), c: mk('c', '<span class="m c-yellow">c</span>', C.green),
        b: mk('b', '<span class="m c-yellow">b</span>', C.red), d: mk('d', '<span class="m c-yellow">d</span>', C.red),
        b1: mk('b1', '<span class="m c-teal">b₁</span>', C.teal), b2: mk('b2', '<span class="m c-teal">b₂</span>', C.teal)
      };
      const ctl2 = slide.querySelector('[data-role=ctl2]');
      Object.keys(PRESETS).forEach(k => btn(ctl2, k, () => this.preset(k), 'small'));
      const ctl3 = slide.querySelector('[data-role=ctl3]');
      this.actSeg = seg(ctl3, [{ value: 'none', label: 'no bend' }, { value: 'tanh', label: 'bend: tanh' }, { value: 'relu', label: 'bend: ReLU' }], 'none', v => { this.T.tanh = v === 'tanh' ? 1 : 0; this.T.relu = v === 'relu' ? 1 : 0; this.kick(); });
      this.eq = slide.querySelector('[data-role=eq]');
      // drag the basis-vector tips
      this.drag = null;
      const cv = this.cv.canvas;
      cv.addEventListener('pointerdown', e => {
        const m = this.cv.toLocal(e), v = this.view(), P = this.T;
        const ox = v.sx(P.b1), oy = v.sy(P.b2);
        const ti = [v.sx(P.a + P.b1), v.sy(P.c + P.b2)], tj = [v.sx(P.b + P.b1), v.sy(P.d + P.b2)];
        if (Math.hypot(m.x - ti[0], m.y - ti[1]) < 26) this.drag = 'i';
        else if (Math.hypot(m.x - tj[0], m.y - tj[1]) < 26) this.drag = 'j';
        if (this.drag) cv.setPointerCapture(e.pointerId);
      });
      cv.addEventListener('pointermove', e => {
        if (!this.drag) return;
        const m = this.cv.toLocal(e), v = this.view();
        const X = Math.round((v.ix(m.x) - this.T.b1) * 20) / 20, Y = Math.round((v.iy(m.y) - this.T.b2) * 20) / 20;
        if (this.drag === 'i') { this.T.a = clamp(X, -2.5, 2.5); this.T.c = clamp(Y, -2.5, 2.5); }
        else { this.T.b = clamp(X, -2.5, 2.5); this.T.d = clamp(Y, -2.5, 2.5); }
        Object.keys(this.sl).forEach(k => this.sl[k].set(this.T[k], true));
        this.P = Object.assign(this.P, { a: this.T.a, b: this.T.b, c: this.T.c, d: this.T.d });
        this.kick();
      });
      cv.addEventListener('pointerup', () => { this.drag = null; });
      this.loop = U.animator(() => this.tick());
      this.draw(); this.updateEq();
    },
    enter(slide) { if (slide._stepPos === 0) this.fromSteps(slide); else this.kick(); },
    leave() { this.loop.stop(); },
    onStep(a, vis, elx) { this.fromSteps(elx.closest('.slide')); },
    // the slide's steps are cumulative: identity, then every visible step applied in order
    fromSteps(slide) {
      const T = this.T, acts = slide._steps.filter(s => s.classList.contains('visible')).map(s => s.dataset.action).filter(Boolean);
      Object.assign(T, { a: 1, b: 0, c: 0, d: 1, b1: 0, b2: 0, tanh: 0, relu: 0 });
      for (const a of acts) {
        if (PRESETS[a]) [T.a, T.b, T.c, T.d] = PRESETS[a].m;
        if (a === 'shift') { T.b1 = 0.6; T.b2 = -0.4; }
        if (a === 'tanh') { T.tanh = 1; T.relu = 0; }
        if (a === 'relu') { T.relu = 1; T.tanh = 0; }
      }
      Object.keys(this.sl).forEach(k => this.sl[k].set(T[k], true));
      this.actSeg.set(T.tanh ? 'tanh' : T.relu ? 'relu' : 'none', true);
      this.kick();
    },
    preset(k) {
      const m = PRESETS[k].m; [this.T.a, this.T.b, this.T.c, this.T.d] = m;
      ['a', 'b', 'c', 'd'].forEach(key => this.sl[key].set(this.T[key], true));
      this.kick();
    },
    kick() { this.updateEq(); if (!this.loop.running) this.loop.start(); },
    tick() {
      let moving = false;
      for (const k in this.T) { const d = this.T[k] - this.P[k]; if (Math.abs(d) > 1e-4) { this.P[k] += d * 0.14; moving = true; } else this.P[k] = this.T[k]; }
      this.draw();
      if (!moving) this.loop.stop();
    },
    view() { const { w, h } = this.cv, s = Math.min(w, h); return U.view((w - s) / 2, (h - s) / 2, s, s, -3.2, 3.2, -3.2, 3.2); },
    f(x, y) {
      const P = this.P;
      let u = P.a * x + P.b * y + P.b1, v = P.c * x + P.d * y + P.b2;
      const lin = 1 - P.tanh - P.relu;
      return [lin * u + P.tanh * Math.tanh(u) + P.relu * relu(u), lin * v + P.tanh * Math.tanh(v) + P.relu * relu(v)];
    },
    draw() {
      const { ctx, w, h } = this.cv, v = this.view(), P = this.P;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      U.grid(ctx, v, { step: 1, minor: false, color: C.gridMinor, axisColor: C.line });
      ctx.save(); ctx.beginPath(); ctx.rect(v.px, v.py, v.pw, v.ph); ctx.clip();
      // transformed grid
      const lines = [];
      for (let k = -6; k <= 6; k++) { lines.push({ fixed: k * 0.5, vert: true }); lines.push({ fixed: k * 0.5, vert: false }); }
      for (const L of lines) {
        const major = Math.abs(L.fixed) < 1e-9;
        ctx.strokeStyle = major ? U.rgba(C.text, 0.85) : U.rgba(C.blue, Number.isInteger(L.fixed) ? 0.55 : 0.28);
        ctx.lineWidth = major ? 2.2 : 1.4;
        ctx.beginPath();
        for (let s = 0; s <= 80; s++) {
          const t = -3 + 6 * s / 80, x = L.vert ? L.fixed : t, y = L.vert ? t : L.fixed;
          const q = this.f(x, y), X = v.sx(q[0]), Y = v.sy(q[1]);
          s ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
        }
        ctx.stroke();
      }
      // squash box for tanh
      if (P.tanh > 0.02) { ctx.strokeStyle = U.rgba(C.yellow, 0.5 * P.tanh); ctx.setLineDash([8, 8]); ctx.lineWidth = 2; ctx.strokeRect(v.sx(-1), v.sy(1), v.sx(1) - v.sx(-1), v.sy(-1) - v.sy(1)); ctx.setLineDash([]); }
      // data points
      for (const p of this.pts) { const q = this.f(p.x, p.y); U.circle(ctx, v.sx(q[0]), v.sy(q[1]), 6.5, p.c ? C.orange : C.blue, C.bg, 1.5); }
      ctx.restore();
      // basis vectors (only meaningful without the bend)
      const lin = 1 - P.tanh - P.relu;
      if (lin > 0.05) {
        ctx.save(); ctx.globalAlpha = lin;
        const ox = v.sx(P.b1), oy = v.sy(P.b2);
        U.arrow(ctx, ox, oy, v.sx(P.a + P.b1), v.sy(P.c + P.b2), { color: C.green, width: 5, glow: 10 });
        U.arrow(ctx, ox, oy, v.sx(P.b + P.b1), v.sy(P.d + P.b2), { color: C.red, width: 5, glow: 10 });
        U.mathText(ctx, 'î', v.sx(P.a + P.b1) + 12, v.sy(P.c + P.b2) - 10, { size: 34, color: C.green });
        U.mathText(ctx, 'ĵ', v.sx(P.b + P.b1) + 12, v.sy(P.d + P.b2) - 10, { size: 34, color: C.red });
        U.circle(ctx, v.sx(P.a + P.b1), v.sy(P.c + P.b2), 9, null, U.rgba(C.green, 0.6), 2);
        U.circle(ctx, v.sx(P.b + P.b1), v.sy(P.d + P.b2), 9, null, U.rgba(C.red, 0.6), 2);
        ctx.restore();
      }
      const det = P.a * P.d - P.b * P.c;
      U.text(ctx, `area × ${fmtMinus(det, 2)}  (det W)`, v.px + 14, v.py + v.ph - 16, { size: 20, color: Math.abs(det) < 0.05 ? C.red : C.muted, family: FONT.mono });
    },
    updateEq() {
      if (!this.eq) return;
      const T = this.T, act = T.tanh ? 'tanh' : T.relu ? 'ReLU' : '';
      const m = (v, col) => `<span class="${col}">${fmtMinus(v, 2)}</span>`;
      this.eq.innerHTML = `<div class="weq"><span class="m c-blue">x′</span> <span class="op">=</span> ${act ? `<span class="mr">${act}</span>(` : ''}
        <span class="wmat"><span>${m(T.a, 'c-green')}</span><span>${m(T.b, 'c-red')}</span><span>${m(T.c, 'c-green')}</span><span>${m(T.d, 'c-red')}</span></span>
        <span class="m c-blue">x</span> <span class="op">+</span> <span class="wvec"><span class="c-teal">${fmtMinus(T.b1, 2)}</span><span class="c-teal">${fmtMinus(T.b2, 2)}</span></span>${act ? ')' : ''}</div>`;
    }
  });

  // ======================================================================
  // DEEP: watch a trained 2-2-2-2 tanh network untangle the data
  // ======================================================================
  const STAGE_LABELS = {
    input: ['the raw data', ''],
    W1: ['layer 1 · stretch & rotate', 'W'], b1: ['layer 1 · shift', 'b'], tanh1: ['layer 1 · bend', 'tanh'],
    W2: ['layer 2 · stretch & rotate', 'W'], b2: ['layer 2 · shift', 'b'], tanh2: ['layer 2 · bend', 'tanh'],
    W3: ['layer 3 · stretch & rotate', 'W'], b3: ['layer 3 · shift', 'b'], tanh3: ['layer 3 · bend → now a straight line separates them!', 'tanh']
  };
  function netFromData() {
    const D = U.data('warpnet');
    if (D) return { layers: D.layers.map(L => ({ W: L.W, b: L.b })), readout: D.readout, stageExtent: D.stageExtent, extent: D.extent, acc: D.accuracy };
    // fallback: train one in the browser
    const d = NN.datasets.moons(160, 0.06, 4), X = d.map(p => [p[0] * 2, p[1] * 2]), Y = d.map(p => p[2]);
    const m = new NN.MLP([2, 2, 2, 2, 1], { act: 'tanh', seed: 5 });
    for (let i = 0; i < 4000; i++) m.trainBatch(X, Y, 0.03);
    const layers = [0, 1, 2].map(l => ({ W: [[m.W[l][0], m.W[l][1]], [m.W[l][2], m.W[l][3]]], b: [m.b[l][0], m.b[l][1]] }));
    return { layers, readout: { w: [m.W[3][0], m.W[3][1]], c: m.b[3][0] }, acc: m.accuracy(X, Y) };
  }
  Deck.register('deep', {
    init(slide) {
      const host = slide.querySelector('[data-role=plot]');
      const wrap = el('div', { class: 'canvas-wrap' }, host);
      this.cv = U.canvas(wrap, { onresize: () => this.draw() });
      this.net = netFromData();
      this.pts = warpData();
      this.order = ['input', 'W1', 'b1', 'tanh1', 'W2', 'b2', 'tanh2', 'W3', 'b3', 'tanh3'];
      // grid lines in input space
      const ext = this.net.extent || [-2.6, 2.6, -2, 2];
      this.lines = [];
      const gx0 = Math.floor(ext[0] * 2) / 2, gx1 = Math.ceil(ext[1] * 2) / 2, gy0 = Math.floor(ext[2] * 2) / 2, gy1 = Math.ceil(ext[3] * 2) / 2;
      for (let x = gx0; x <= gx1 + 1e-9; x += 0.5) this.lines.push(Array.from({ length: 61 }, (_, s) => [x, gy0 + (gy1 - gy0) * s / 60]));
      for (let y = gy0; y <= gy1 + 1e-9; y += 0.5) this.lines.push(Array.from({ length: 61 }, (_, s) => [gx0 + (gx1 - gx0) * s / 60, y]));
      // precompute every stage
      const apply = (pts) => {
        const out = [pts];
        let cur = pts;
        for (const L of this.net.layers) {
          const a = cur.map(([x, y]) => [L.W[0][0] * x + L.W[0][1] * y, L.W[1][0] * x + L.W[1][1] * y]); out.push(a);
          const b = a.map(([x, y]) => [x + L.b[0], y + L.b[1]]); out.push(b);
          const t = b.map(([x, y]) => [Math.tanh(x), Math.tanh(y)]); out.push(t);
          cur = t;
        }
        return out;
      };
      this.ptStages = apply(this.pts.map(p => [p.x, p.y]));
      this.lineStages = this.lines.map(l => apply(l));
      this.extents = this.ptStages.map((S, k) => {
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        S.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, r = Math.max(x1 - x0, y1 - y0) / 2 * 1.3 + 0.15;
        return [cx - r, cx + r, cy - r, cy + r];
      });
      this.stage = 0; this.t = 1; this.playing = false; this.showGrid = true;
      const ctl = slide.querySelector('[data-role=ctl]');
      btn(ctl, '◀', () => this.go(this.stage - 1), 'small');
      this.playBtn = btn(ctl, '▶ next step', () => this.go(this.stage + 1), 'primary');
      btn(ctl, '⏵⏵ play all', () => this.playAll(), 'green');
      btn(ctl, '⟲ reset', () => { this.playing = false; this.stage = 0; this.t = 1; this.draw(); this.label(); });
      this.gridSeg = seg(ctl, [{ value: 'on', label: 'grid on' }, { value: 'off', label: 'grid off' }], 'on', v => { this.showGrid = v === 'on'; this.draw(); });
      this.lab = slide.querySelector('[data-role=stage]');
      this.loop = U.animator(dt => this.tick(dt));
      this.label(); this.draw();
    },
    leave() { this.loop.stop(); this.playing = false; },
    enter(slide) { if (slide._stepPos === 0) this.resetStage(); else this.draw(); },
    resetStage() { this.loop.stop(); this.playing = false; this.stage = 0; this.t = 1; this.from = undefined; this.label(); this.draw(); },
    onStep(a, vis) { if (a === 'play') { if (vis) this.playAll(); else this.resetStage(); } if (a === 'reset' && vis) this.resetStage(); },
    go(s) {
      s = clamp(s, 0, this.order.length - 1);
      if (s === this.stage) return;
      this.from = this.stage; this.stage = s; this.t = s > this.from ? 0 : 1;
      if (s < this.from) { this.t = 1; }
      this.label();
      if (!this.loop.running) this.loop.start();
    },
    playAll() { this.stage = 0; this.t = 1; this.playing = true; this.wait = 0.6; this.label(); if (!this.loop.running) this.loop.start(); },
    tick(dt) {
      if (this.t < 1) { this.t = Math.min(1, this.t + dt / 1.1); }
      else if (this.playing) {
        this.wait -= dt;
        if (this.wait <= 0) {
          if (this.stage < this.order.length - 1) { this.from = this.stage; this.stage++; this.t = 0; this.wait = 0.55; this.label(); }
          else { this.playing = false; }
        }
      } else { this.draw(); this.loop.stop(); return; }
      this.draw();
    },
    label() {
      if (!this.lab) return;
      const name = this.order[this.stage], [txt, part] = STAGE_LABELS[name];
      const hl = p => (part === p ? ' class="on"' : '');
      this.lab.innerHTML = `<div class="stage-name">${this.stage}/9 · ${txt}</div>
        <div class="stage-eq eqline"><span class="m c-blue">h</span>′ <span class="op">=</span> <span${hl('tanh')}><span class="mr">tanh</span>(</span><span${hl('W')}><span class="m c-yellow">W</span></span> <span class="m c-blue">h</span> <span${hl('b')}><span class="op">+</span> <span class="m c-teal">b</span></span><span${hl('tanh')}>)</span></div>`;
    },
    pos(stageArr, i) {
      const k = this.stage, e = U.ease(this.t);
      const prev = this.from !== undefined && this.t < 1 ? this.from : k;
      const a = stageArr[prev][i], b = stageArr[k][i];
      return [lerp(a[0], b[0], e), lerp(a[1], b[1], e)];
    },
    draw() {
      const { ctx, w, h } = this.cv;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      const k = this.stage, e = U.ease(this.t), prev = this.from !== undefined && this.t < 1 ? this.from : k;
      const E0 = this.extents[prev], E1 = this.extents[k], E = E0.map((v, i) => lerp(v, E1[i], e));
      const s = Math.min(w, h) - 30;
      const v = U.view((w - s) / 2, (h - s) / 2, s, s, E[0], E[1], E[2], E[3]);
      // readout decision region at the final stage
      if (k === this.order.length - 1) {
        const R = this.net.readout, alpha = e * 0.22;
        const cs = 8;
        for (let X = v.px; X < v.px + v.pw; X += cs) for (let Y = v.py; Y < v.py + v.ph; Y += cs) {
          const z = R.w[0] * v.ix(X + cs / 2) + R.w[1] * v.iy(Y + cs / 2) + R.c;
          ctx.fillStyle = z > 0 ? U.rgba(C.orange, alpha) : U.rgba(C.blue, alpha); ctx.fillRect(X, Y, cs, cs);
        }
      }
      ctx.save(); ctx.beginPath(); ctx.rect(v.px, v.py, v.pw, v.ph); ctx.clip();
      if (this.showGrid) {
        ctx.lineWidth = 1.3;
        this.lineStages.forEach((LS, li) => {
          ctx.strokeStyle = U.rgba(C.blue, 0.32);
          ctx.beginPath();
          const n = LS[0].length;
          for (let i = 0; i < n; i++) {
            const a = LS[prev][i], b = LS[k][i], X = v.sx(lerp(a[0], b[0], e)), Y = v.sy(lerp(a[1], b[1], e));
            i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
          }
          ctx.stroke();
        });
      }
      this.pts.forEach((p, i) => {
        const a = this.ptStages[prev][i], b = this.ptStages[k][i];
        U.circle(ctx, v.sx(lerp(a[0], b[0], e)), v.sy(lerp(a[1], b[1], e)), 6, p.c ? C.orange : C.blue, C.bg, 1.5);
      });
      if (k === this.order.length - 1) {
        const R = this.net.readout;
        if (Math.abs(R.w[1]) > 1e-6) {
          const y0 = -(R.w[0] * v.x0 + R.c) / R.w[1], y1 = -(R.w[0] * v.x1 + R.c) / R.w[1];
          ctx.save(); ctx.globalAlpha = e; ctx.strokeStyle = C.yellow; ctx.lineWidth = 4; ctx.shadowColor = C.yellow; ctx.shadowBlur = 14;
          ctx.beginPath(); ctx.moveTo(v.sx(v.x0), v.sy(y0)); ctx.lineTo(v.sx(v.x1), v.sy(y1)); ctx.stroke(); ctx.restore();
        }
      }
      ctx.restore();
    }
  });

  document.head.appendChild(Object.assign(document.createElement('style'), {
    textContent: `
    .weq{font-family:var(--math);font-size:40px;display:flex;align-items:center;gap:12px;white-space:nowrap}
    .wmat{display:inline-grid;grid-template-columns:auto auto;gap:2px 16px;border-left:3px solid var(--muted);border-right:3px solid var(--muted);border-radius:8px;padding:2px 10px;font-size:30px;font-family:var(--mono)}
    .wvec{display:inline-grid;grid-template-columns:auto;gap:2px;border-left:3px solid var(--muted);border-right:3px solid var(--muted);border-radius:8px;padding:2px 10px;font-size:30px;font-family:var(--mono)}
    .stage-name{font-size:30px;color:var(--text);margin-bottom:6px}
    .stage-eq span{transition:color .3s, text-shadow .3s}
    .stage-eq > span.on, .stage-eq > span.on *{color:var(--blue) !important;text-shadow:0 0 14px rgba(66,133,244,.25)}
    `
  }));
})();
