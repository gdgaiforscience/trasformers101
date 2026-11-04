/* =====================================================================
   Chapter 5 demos: how machines learn
   - loss:     fit Kepler's planets with a line; squared errors drawn as squares
   - descent:  gradient descent on the loss landscape L(w, b)
   - backprop: forward / backward on a tiny computational graph
   - train:    a live neural-network playground
   ===================================================================== */
(function () {
  'use strict';
  const { C, FONT, el, slider, btn, seg, fmt, fmtMinus, clamp, lerp, sigmoid } = U;

  const KEPLER_FALLBACK = [['Mercury', 0.387, 0.241], ['Venus', 0.723, 0.615], ['Earth', 1, 1], ['Mars', 1.524, 1.881], ['Jupiter', 5.203, 11.86], ['Saturn', 9.537, 29.46], ['Uranus', 19.19, 84.01], ['Neptune', 30.07, 164.8]];
  function planets() {
    const K = U.data('kepler');
    const P = K ? K.planets.map(p => ({ name: p.name, a: p.a, T: p.T })) : KEPLER_FALLBACK.map(([name, a, T]) => ({ name, a, T }));
    return P.map(p => Object.assign(p, { x: Math.log10(p.a), y: Math.log10(p.T) }));
  }
  function lossOf(P, w, b) { let s = 0; for (const p of P) { const r = w * p.x + b - p.y; s += r * r; } return s / P.length; }
  function gradOf(P, w, b) { let gw = 0, gb = 0; for (const p of P) { const r = w * p.x + b - p.y; gw += 2 * r * p.x; gb += 2 * r; } return [gw / P.length, gb / P.length]; }
  function ols(P) { const n = P.length; let sx = 0, sy = 0, sxx = 0, sxy = 0; for (const p of P) { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; } const w = (n * sxy - sx * sy) / (n * sxx - sx * sx); return [w, (sy - w * sx) / n]; }

  // ======================================================================
  // LOSS: Kepler's third law by "measuring wrongness"
  // ======================================================================
  Deck.register('loss', {
    init(slide) {
      this.P = planets();
      this.w = 0.6; this.b = 0.4; this.mode = 'log';
      const host = slide.querySelector('[data-role=plot]');
      const wrap = el('div', { class: 'canvas-wrap' }, host);
      this.cv = U.canvas(wrap, { onresize: () => this.draw() });
      const ctl = slide.querySelector('[data-role=ctl]');
      this.sw = slider(ctl, { label: 'slope <span class="m c-yellow">w</span>', min: -0.5, max: 3, step: 0.01, value: this.w, color: C.yellow, width: 240, fmt: v => fmtMinus(v, 2), oninput: v => { this.w = v; this.update(); } });
      this.sb = slider(ctl, { label: 'intercept <span class="m c-teal">b</span>', min: -1.5, max: 1.5, step: 0.01, value: this.b, color: C.teal, width: 240, fmt: v => fmtMinus(v, 2), oninput: v => { this.b = v; this.update(); } });
      const ctl2 = slide.querySelector('[data-role=ctl2]');
      btn(ctl2, '✨ best fit', () => this.best(), 'primary');
      this.modeSeg = seg(ctl2, [{ value: 'log', label: 'log–log axes' }, { value: 'raw', label: 'raw axes' }], 'log', v => { this.mode = v; this.draw(); });
      this.readout = slide.querySelector('[data-role=loss]');
      this.reveal = slide.querySelector('[data-role=reveal]');
      // drag the line by its two handles
      this.drag = null;
      const cv = this.cv.canvas;
      cv.addEventListener('pointerdown', e => {
        if (this.mode !== 'log') return;
        const m = this.cv.toLocal(e), v = this.view();
        for (const hx of this.handles()) { const Y = v.sy(this.w * hx + this.b); if (Math.hypot(m.x - v.sx(hx), m.y - Y) < 24) { this.drag = hx; cv.setPointerCapture(e.pointerId); } }
      });
      cv.addEventListener('pointermove', e => {
        if (this.drag === null) return;
        const m = this.cv.toLocal(e), v = this.view(), [h0, h1] = this.handles();
        const other = this.drag === h0 ? h1 : h0, yo = this.w * other + this.b, yd = v.iy(m.y);
        this.w = clamp((yd - yo) / (this.drag - other), -0.5, 3); this.b = clamp(yo - this.w * other, -1.5, 1.5);
        this.sw.set(this.w, true); this.sb.set(this.b, true); this.update();
      });
      cv.addEventListener('pointerup', () => { this.drag = null; });
      this.update();
    },
    enter(slide) { if (slide._stepPos === 0) this.setLine(0.6, 0.4, 'log'); },
    onStep(a, vis) {
      if (a === 'best') { if (vis) this.best(); else this.setLine(0.6, 0.4, null, true); }
      if (a === 'raw') this.modeSeg.set(vis ? 'raw' : 'log');
    },
    setLine(w, b, mode, animate) {
      if (this._tw) this._tw.cancel();
      if (mode) { this.mode = mode; this.modeSeg.set(mode, true); }
      if (!animate) { this.w = w; this.b = b; this.sw.set(w, true); this.sb.set(b, true); this.update(); return; }
      const w0 = this.w, b0 = this.b;
      this._tw = U.tween(1.0, e => { this.w = lerp(w0, w, e); this.b = lerp(b0, b, e); this.sw.set(this.w, true); this.sb.set(this.b, true); this.update(); });
    },
    handles() { return [-0.25, 1.35]; },
    best() { const [W, B] = ols(this.P); this.setLine(W, B, null, true); },
    view() {
      const { w, h } = this.cv;
      if (this.mode === 'raw') return U.view(90, 20, w - 120, h - 80, 0, 32, 0, 175);
      const xr = [-0.6, 1.7], yr = [-0.9, 2.5], pw = w - 120, ph = h - 80, s = Math.min(pw / (xr[1] - xr[0]), ph / (yr[1] - yr[0]));
      const W = s * (xr[1] - xr[0]), H = s * (yr[1] - yr[0]);
      return U.view(90 + (pw - W) / 2, 20 + (ph - H) / 2, W, H, xr[0], xr[1], yr[0], yr[1]);
    },
    update() {
      const L = lossOf(this.P, this.w, this.b);
      if (this.readout) this.readout.innerHTML = `<span class="m c-red">L</span> = <b class="c-red" style="font-size:52px">${fmt(L, 4)}</b>`;
      if (this.reveal) this.reveal.classList.toggle('on', L < 0.0005);
      this.draw();
    },
    draw() {
      const { ctx, w, h } = this.cv, v = this.view(), P = this.P;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      if (this.mode === 'raw') {
        U.grid(ctx, v, { step: 5, stepY: 25, labels: true, minor: false });
        U.text(ctx, 'distance from the Sun  a  (AU)', v.px + v.pw, h - 12, { size: 20, color: C.muted, align: 'right' });
        ctx.save(); ctx.translate(22, v.py + 4); ctx.rotate(-Math.PI / 2); U.text(ctx, 'orbital period  T  (years)', 0, 0, { size: 20, color: C.muted, align: 'right' }); ctx.restore();
        ctx.save(); ctx.strokeStyle = C.yellow; ctx.lineWidth = 3.5; ctx.shadowColor = C.yellow; ctx.shadowBlur = 10; ctx.beginPath();
        for (let X = v.px; X <= v.px + v.pw; X += 3) { const a = Math.max(1e-3, v.ix(X)), T = Math.pow(10, this.b) * Math.pow(a, this.w), Y = v.sy(Math.min(T, 400)); X === v.px ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
        ctx.stroke(); ctx.restore();
        for (const p of P) { U.circle(ctx, v.sx(p.a), v.sy(p.T), 8, C.blue, C.bg, 2); U.text(ctx, p.name, v.sx(p.a) + 12, v.sy(p.T) - 10, { size: 18, color: C.muted }); }
        U.text(ctx, `model:  T = 10^${fmtMinus(this.b, 2)} · a^${fmtMinus(this.w, 2)}`, v.px + 16, v.py + 30, { size: 22, color: C.yellow, family: FONT.mono });
        return;
      }
      U.grid(ctx, v, { step: 0.5, labels: true, minor: false });
      U.text(ctx, 'log₁₀ distance from the Sun (AU)   →   x', v.px + v.pw, h - 12, { size: 20, color: C.muted, align: 'right' });
      ctx.save(); ctx.translate(22, v.py + 4); ctx.rotate(-Math.PI / 2); U.text(ctx, 'log₁₀ orbital period (years)   →   y', 0, 0, { size: 20, color: C.muted, align: 'right' }); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(v.px, v.py, v.pw, v.ph); ctx.clip();
      // squared errors drawn as real squares
      for (const p of P) {
        const yh = this.w * p.x + this.b, r = yh - p.y, X = v.sx(p.x), Y0 = v.sy(p.y), Y1 = v.sy(yh), side = Math.abs(Y1 - Y0);
        ctx.fillStyle = U.rgba(C.red, 0.18); ctx.strokeStyle = U.rgba(C.red, 0.7); ctx.lineWidth = 1.5;
        ctx.fillRect(X, Math.min(Y0, Y1), side, side); ctx.strokeRect(X, Math.min(Y0, Y1), side, side);
        ctx.strokeStyle = C.red; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(X, Y0); ctx.lineTo(X, Y1); ctx.stroke();
      }
      // the line
      ctx.strokeStyle = C.yellow; ctx.lineWidth = 4; ctx.shadowColor = C.yellow; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.moveTo(v.sx(v.x0), v.sy(this.w * v.x0 + this.b)); ctx.lineTo(v.sx(v.x1), v.sy(this.w * v.x1 + this.b)); ctx.stroke();
      ctx.restore();
      for (const hx of this.handles()) U.circle(ctx, v.sx(hx), v.sy(this.w * hx + this.b), 11, C.bg, C.yellow, 3);
      for (const p of P) { U.circle(ctx, v.sx(p.x), v.sy(p.y), 8, C.blue, C.bg, 2); U.text(ctx, p.name, v.sx(p.x) - 12, v.sy(p.y) - 12, { size: 18, color: C.muted, align: 'right' }); }
    }
  });

  // ======================================================================
  // DESCENT: rolling downhill on L(w, b)
  // ======================================================================
  Deck.register('descent', {
    init(slide) {
      this.P = planets();
      const host = slide.querySelector('[data-role=plot]');
      const wrap = el('div', { class: 'canvas-wrap' }, host);
      this.cv = U.canvas(wrap, { onresize: () => { this.bg = null; this.draw(); } });
      this.lr = 0.1; this.start = [0.2, 1.2]; this.reset();
      const ctl = slide.querySelector('[data-role=ctl]');
      this.slr = slider(ctl, { label: 'learning rate <span class="m c-orange">η</span>', min: -2.3, max: 0.05, step: 0.001, value: Math.log10(this.lr), color: C.orange, width: 300, fmt: v => Math.pow(10, v).toFixed(Math.pow(10, v) < 0.1 ? 3 : 2), oninput: v => { this.lr = Math.pow(10, v); } });
      const ctl2 = slide.querySelector('[data-role=ctl2]');
      this.playBtn = btn(ctl2, '▶ roll downhill', () => this.toggle(), 'primary');
      btn(ctl2, 'one step', () => { this.stepOnce(); this.draw(); });
      btn(ctl2, '⟲ reset', () => { this.stop(); this.reset(); this.draw(); });
      this.readout = slide.querySelector('[data-role=readout]');
      this.lcv = U.canvas(slide.querySelector('[data-role=lossplot]'), { onresize: () => this.drawLoss() });
      this.fcv = U.canvas(slide.querySelector('[data-role=fitplot]'), { onresize: () => this.drawFit() });
      this.cv.canvas.addEventListener('pointerdown', e => { const m = this.cv.toLocal(e), v = this.view(); if (!v.inside(m.x, m.y)) return; this.start = [v.ix(m.x), v.iy(m.y)]; this.reset(); this.draw(); });
      this.loop = U.animator(dt => { this.acc += dt; while (this.acc > 0.06) { this.acc -= 0.06; this.stepOnce(); } this.draw(); });
      this.draw();
    },
    enter(slide) { if (slide._stepPos === 0) this.run(0.1, false); },
    leave() { this.stop(); },
    onStep(a, vis, elx) {
      if (vis) {
        if (a === 'play') this.run(this.lr, true);
        if (a.startsWith('lr:')) this.run(+a.slice(3), true);
        return;
      }
      // stepping back: replay the most recent learning rate that is still visible
      const steps = elx.closest('.slide')._steps.filter(s => s.classList.contains('visible') && s.dataset.action);
      const lrs = steps.map(s => s.dataset.action).filter(x => x.startsWith('lr:'));
      const played = steps.some(s => s.dataset.action === 'play');
      this.run(lrs.length ? +lrs[lrs.length - 1].slice(3) : 0.1, played || lrs.length > 0);
    },
    run(lr, play) {
      this.stop(); this.lr = lr; this.slr.set(Math.log10(lr), true);
      this.start = [0.2, 1.2]; this.reset(); this.draw();
      if (play) this.toggle();
    },
    reset() { this.wb = this.start.slice(); this.path = [this.wb.slice()]; this.losses = [lossOf(this.P, this.wb[0], this.wb[1])]; this.k = 0; this.diverged = false; this.acc = 0; },
    toggle() { if (this.loop.running) this.stop(); else { if (this.diverged || this.k > 400) this.reset(); this.loop.start(); this.playBtn.innerHTML = '⏸ pause'; } },
    stop() { this.loop && this.loop.stop(); if (this.playBtn) this.playBtn.innerHTML = '▶ roll downhill'; },
    stepOnce() {
      if (this.diverged) return;
      const [gw, gb] = gradOf(this.P, this.wb[0], this.wb[1]);
      this.wb = [this.wb[0] - this.lr * gw, this.wb[1] - this.lr * gb];
      this.path.push(this.wb.slice()); this.k++;
      const L = lossOf(this.P, this.wb[0], this.wb[1]); this.losses.push(L);
      if (!isFinite(L) || L > 50 || Math.abs(this.wb[0]) > 20) { this.diverged = true; this.stop(); }
      if (this.k > 400 || (Math.hypot(gw, gb) < 1e-5)) this.stop();
    },
    view() { const { w, h } = this.cv; return U.view(70, 16, w - 90, h - 66, -0.6, 3.1, -1.6, 1.6); },
    renderBg() {
      const { w, h } = this.cv, v = this.view(), k = this.cv.k;
      const off = document.createElement('canvas'); off.width = Math.round(w * k); off.height = Math.round(h * k);
      const oc = off.getContext('2d'); oc.setTransform(k, 0, 0, k, 0, 0);
      oc.fillStyle = C.bg; oc.fillRect(0, 0, w, h);
      const step = 3;
      const Lmin = Math.log(0.0003), Lmax = Math.log(8);
      for (let X = v.px; X < v.px + v.pw; X += step) for (let Y = v.py; Y < v.py + v.ph; Y += step) {
        const L = lossOf(this.P, v.ix(X + step / 2), v.iy(Y + step / 2)), t = clamp((Math.log(L) - Lmin) / (Lmax - Lmin), 0, 1);
        const band = Math.abs(((Math.log(L) * 2.2) % 1 + 1) % 1 - 0.5) < 0.04 ? 0.55 : 1;
        const c = U.rampRgb(['#ffd54f', '#5cd0b3', '#58c4dd', '#1d3a5f', '#14243a'], t);
        oc.fillStyle = U.rgbStr(c[0] * band, c[1] * band, c[2] * band); oc.fillRect(X, Y, step, step);
      }
      U.grid(oc, v, { step: 0.5, labels: true, minor: false, color: 'rgba(15,17,21,.35)', axisColor: 'rgba(15,17,21,.6)' });
      this.bg = off;
    },
    draw() {
      if (!this.cv) return;
      if (!this.bg) this.renderBg();
      const { ctx, w, h } = this.cv, v = this.view();
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(this.bg, 0, 0); ctx.restore();
      U.text(ctx, 'slope  w  →', v.px + v.pw, h - 12, { size: 20, color: C.muted, align: 'right' });
      ctx.save(); ctx.translate(22, v.py + 4); ctx.rotate(-Math.PI / 2); U.text(ctx, 'intercept  b  →', 0, 0, { size: 20, color: C.muted, align: 'right' }); ctx.restore();
      const [Wb, Bb] = ols(this.P);
      U.circle(ctx, v.sx(Wb), v.sy(Bb), 7, null, C.bg, 3);
      U.text(ctx, 'minimum', v.sx(Wb) + 10, v.sy(Bb) + 24, { size: 18, color: C.bg });
      ctx.save(); ctx.beginPath(); ctx.rect(v.px, v.py, v.pw, v.ph); ctx.clip();
      ctx.strokeStyle = C.text; ctx.lineWidth = 2.5; ctx.beginPath();
      this.path.forEach((p, i) => { const X = v.sx(p[0]), Y = v.sy(p[1]); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
      this.path.forEach(p => U.circle(ctx, v.sx(p[0]), v.sy(p[1]), 3.2, C.text));
      const [cw, cb] = this.wb, [gw, gb] = gradOf(this.P, cw, cb), gl = Math.hypot(gw, gb);
      if (gl > 1e-6 && !this.diverged) U.arrow(ctx, v.sx(cw), v.sy(cb), v.sx(cw) - gw / gl * 70, v.sy(cb) + gb / gl * 70, { color: C.green, width: 4, glow: 8 });
      ctx.save(); ctx.shadowColor = C.orange; ctx.shadowBlur = 16; U.circle(ctx, v.sx(cw), v.sy(cb), 11, C.orange, C.bg, 2.5); ctx.restore();
      ctx.restore();
      if (this.diverged) U.text(ctx, '💥 diverged: learning rate too big!', v.px + v.pw / 2, v.py + 50, { size: 34, color: C.red, align: 'center' });
      const L = this.losses[this.losses.length - 1];
      if (this.readout) this.readout.innerHTML = `step <b>${this.k}</b> · <span class="m c-yellow">w</span> = <b>${fmtMinus(cw, 3)}</b> · <span class="m c-teal">b</span> = <b>${fmtMinus(cb, 3)}</b> · <span class="m c-red">L</span> = <b class="c-red">${isFinite(L) ? fmt(L, 5) : '∞'}</b>`;
      this.drawLoss(); this.drawFit();
    },
    drawLoss() {
      if (!this.lcv) return;
      const { ctx, w, h } = this.lcv; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      const v = U.view(50, 10, w - 60, h - 40, 0, Math.max(30, this.losses.length), -4, 1);
      U.grid(ctx, v, { step: Math.max(10, U.niceStep(v.x1, 4)), stepY: 1, labels: true, minor: false, fmtY: y => '10' + String(y).replace('-', '⁻').replace('1', '¹').replace('2', '²').replace('3', '³').replace('4', '⁴').replace('0', '⁰') });
      ctx.strokeStyle = C.red; ctx.lineWidth = 2.5; ctx.beginPath();
      this.losses.forEach((L, i) => { const Y = v.sy(clamp(Math.log10(Math.max(L, 1e-6)), -4, 1)); i ? ctx.lineTo(v.sx(i), Y) : ctx.moveTo(v.sx(i), Y); }); ctx.stroke();
      U.text(ctx, 'loss vs step', w - 8, 24, { size: 16, color: C.muted, align: 'right' });
    },
    drawFit() {
      if (!this.fcv) return;
      const { ctx, w, h } = this.fcv; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      const v = U.view(30, 10, w - 40, h - 20, -0.6, 1.7, -0.9, 2.5);
      U.grid(ctx, v, { step: 0.5, minor: false });
      const [cw, cb] = this.wb;
      ctx.strokeStyle = C.yellow; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(v.sx(v.x0), v.sy(cw * v.x0 + cb)); ctx.lineTo(v.sx(v.x1), v.sy(cw * v.x1 + cb)); ctx.stroke();
      for (const p of this.P) U.circle(ctx, v.sx(p.x), v.sy(p.y), 5, C.blue);
      U.text(ctx, 'current fit', w - 8, 24, { size: 16, color: C.muted, align: 'right' });
    }
  });

  // ======================================================================
  // BACKPROP: forward values, backward blame (chain rule)
  // ======================================================================
  Deck.register('backprop', {
    init(slide) {
      this.x = 2; this.w = 0.5; this.b = 0; this.y = 1; this.eta = 1;
      this.phase = 0;  // 0 nothing, 1 forward done, 2 backward done
      this.anim = null; this.history = [];
      const host = slide.querySelector('[data-role=graph]');
      this.cv = U.canvas(host, { onresize: () => this.draw() });
      const ctl = slide.querySelector('[data-role=ctl]');
      btn(ctl, '① forward ▶', () => this.forward(), 'primary');
      btn(ctl, '② backward ◀', () => this.backward(), 'green');
      btn(ctl, '③ nudge the weights', () => this.update(), 'orange');
      btn(ctl, '🔁 train ×20', () => this.auto());
      btn(ctl, 'reset', () => { this.w = 0.5; this.b = 0; this.history = []; this.phase = 0; this.draw(); this.eqUpdate(); });
      this.eq = slide.querySelector('[data-role=chain]');
      this.compute(); this.draw(); this.eqUpdate();
    },
    leave() { if (this.anim) this.anim.cancel(); clearInterval(this._auto); },
    onStep(a, vis) { if (!vis) return; if (a === 'forward') this.forward(); if (a === 'backward') this.backward(); if (a === 'update') this.update(); if (a === 'auto') this.auto(); },
    compute() {
      const s = this; s.wx = s.w * s.x; s.z = s.wx + s.b; s.yh = sigmoid(s.z); s.L = (s.yh - s.y) ** 2;
      s.dL_dyh = 2 * (s.yh - s.y); s.dyh_dz = s.yh * (1 - s.yh); s.dL_dz = s.dL_dyh * s.dyh_dz;
      s.dL_dw = s.dL_dz * s.x; s.dL_db = s.dL_dz; s.dL_dx = s.dL_dz * s.w;
    },
    layout() {
      const { w, h } = this.cv, y0 = h * 0.42;
      return {
        x: [w * 0.06, h * 0.18], w: [w * 0.06, h * 0.62], b: [w * 0.30, h * 0.86],
        mul: [w * 0.22, y0], add: [w * 0.40, y0], sig: [w * 0.58, y0], loss: [w * 0.80, y0], yt: [w * 0.69, h * 0.86], out: [w * 0.95, y0]
      };
    },
    edges() {
      return [
        ['x', 'mul', '', 'w'], ['w', 'mul', '', 'x'], ['mul', 'add', 'wx', '1'], ['b', 'add', '', '1'],
        ['add', 'sig', 'z', 'σ′(z)'], ['sig', 'loss', 'ŷ', '2(ŷ−y)'], ['yt', 'loss', '', ''], ['loss', 'out', 'L', '']
      ];
    },
    forward() {
      this.compute(); if (this.anim) this.anim.cancel();
      this.phase = 0.5; this.prog = 0;
      this.anim = U.tween(2.2, (e, t) => { this.prog = t; this.draw(); }, () => { this.phase = 1; this.draw(); this.eqUpdate(); }, t => t);
    },
    backward() {
      if (this.phase < 1) { this.forward(); setTimeout(() => this.backward(), 2400); return; }
      if (this.anim) this.anim.cancel();
      this.phase = 1.5; this.prog = 0;
      this.anim = U.tween(2.4, (e, t) => { this.prog = t; this.draw(); }, () => { this.phase = 2; this.draw(); this.eqUpdate(); }, t => t);
    },
    update() {
      if (this.phase < 2) { this.compute(); }
      const L0 = this.L;
      const w0 = this.w, b0 = this.b, w1 = w0 - this.eta * this.dL_dw, b1 = b0 - this.eta * this.dL_db;
      U.tween(0.8, e => { this.w = lerp(w0, w1, e); this.b = lerp(b0, b1, e); this.compute(); this.phase = 1; this.draw(); }, () => {
        this.compute(); this.history.push([L0, this.L]); this.phase = 1; this.draw(); this.eqUpdate(true, L0);
      });
    },
    auto() {
      clearInterval(this._auto); let n = 0;
      this._auto = setInterval(() => {
        this.compute(); const L0 = this.L;
        this.w -= this.eta * this.dL_dw; this.b -= this.eta * this.dL_db; this.compute();
        this.history.push([L0, this.L]); this.phase = 2; this.draw(); this.eqUpdate(true, L0);
        if (++n >= 20) clearInterval(this._auto);
      }, 140);
    },
    eqUpdate(updated, L0) {
      if (!this.eq) return;
      const s = this;
      let html = `<span class="m c-green">∂L/∂w</span> = <span class="c-green">2(ŷ−y)</span> · <span class="c-green">σ(z)(1−σ(z))</span> · <span class="c-green">x</span>`;
      if (this.phase >= 2 || updated) html += `<br>= <b class="c-green">${fmtMinus(s.dL_dyh, 3)}</b> · <b class="c-green">${fmt(s.dyh_dz, 3)}</b> · <b class="c-green">${fmt(s.x, 1)}</b> = <b class="c-green">${fmtMinus(s.dL_dw, 4)}</b>`;
      if (updated) html += `<br><span class="muted">update:</span> <span class="m c-yellow">w</span> ← <span class="m c-yellow">w</span> − <span class="m c-orange">η</span>·<span class="m c-green">∂L/∂w</span> → <b class="c-yellow">w = ${fmt(s.w, 3)}</b> · loss <b class="c-red">${fmt(L0, 4)}</b> → <b class="c-green">${fmt(s.L, 4)}</b>`;
      this.eq.innerHTML = html;
    },
    node(ctx, key, label, val, grad, kind) {
      const [x, y] = this.layout()[key];
      const isOp = kind === 'op', r = isOp ? 40 : 0;
      ctx.save();
      if (isOp) { U.circle(ctx, x, y, r, U.rgba(C.text, 0.05), C.text, 2.5); U.text(ctx, label, x, y + 11, { size: 30, align: 'center', family: FONT.math }); }
      else {
        const col = kind === 'param' ? C.yellow : kind === 'target' ? C.muted : kind === 'loss' ? C.red : C.blue;
        U.roundRect(ctx, x - 52, y - 30, 104, 60, 14); ctx.fillStyle = U.rgba(col, 0.1); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.stroke();
        U.mathText(ctx, label, x, y - 40, { size: 26, color: col, align: 'center' });
        if (val !== null) U.text(ctx, val, x, y + 9, { size: 24, align: 'center', family: FONT.mono });
      }
      if (grad !== null) U.text(ctx, grad, x, y + (isOp ? 70 : 58), { size: 21, color: C.green, align: 'center', family: FONT.mono });
      ctx.restore();
    },
    draw() {
      const { ctx, w, h } = this.cv, L = this.layout(), s = this;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      const fwdDone = this.phase >= 1, bwdDone = this.phase >= 2;
      const order = ['x', 'w', 'mul', 'b', 'add', 'sig', 'yt', 'loss', 'out'];
      const edges = this.edges();
      edges.forEach(([a, b, lab, der], i) => {
        const A = L[a], B = L[b];
        ctx.strokeStyle = U.rgba(C.text, 0.35); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
        if (lab && fwdDone) U.mathText(ctx, lab, (A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - 14, { size: 22, color: C.blue, align: 'center' });
        if (der && this.phase >= 1.5) U.text(ctx, '×' + der, (A[0] + B[0]) / 2, (A[1] + B[1]) / 2 + 30, { size: 18, color: U.rgba(C.green, 0.85), align: 'center', family: FONT.math });
      });
      // travelling pulses
      if (this.phase === 0.5 || this.phase === 1.5) {
        const fwd = this.phase === 0.5, seqE = fwd ? [[0, 1, 3], [2], [4], [5, 6], [7]] : [[7], [5], [4], [2, 3], [0, 1]];
        const n = seqE.length, t = this.prog * n, k = Math.min(n - 1, Math.floor(t)), f = t - k;
        seqE[k].forEach(ei => {
          const [a, b] = edges[ei], A = fwd ? L[a] : L[b], B = fwd ? L[b] : L[a];
          ctx.save(); ctx.shadowColor = fwd ? C.blue : C.green; ctx.shadowBlur = 18;
          U.circle(ctx, lerp(A[0], B[0], f), lerp(A[1], B[1], f), 9, fwd ? C.blue : C.green); ctx.restore();
        });
      }
      const show = (phaseNeeded, v) => (this.phase >= phaseNeeded ? v : null);
      const g = v => '∂L = ' + fmtMinus(v, 3);
      this.node(ctx, 'x', 'x', fmt(s.x, 1), show(2, g(s.dL_dx)), 'input');
      this.node(ctx, 'w', 'w', fmt(s.w, 3), show(2, g(s.dL_dw)), 'param');
      this.node(ctx, 'b', 'b', fmtMinus(s.b, 3), show(2, g(s.dL_db)), 'param');
      this.node(ctx, 'mul', '×', null, null, 'op');
      this.node(ctx, 'add', '+', null, show(2, g(s.dL_dz)), 'op');
      this.node(ctx, 'sig', 'σ', null, show(2, g(s.dL_dyh * 1)), 'op');
      this.node(ctx, 'yt', 'y (target)', fmt(s.y, 1), null, 'target');
      this.node(ctx, 'loss', '(ŷ−y)²', null, null, 'op');
      this.node(ctx, 'out', 'L', fwdDone ? fmt(s.L, 4) : '?', show(2, '∂L = 1'), 'loss');
      if (fwdDone) {
        U.text(ctx, `wx = ${fmt(s.wx, 2)}`, (L.mul[0] + L.add[0]) / 2, L.mul[1] + 40, { size: 18, color: C.muted, align: 'center', family: FONT.mono });
        U.text(ctx, `z = ${fmt(s.z, 2)}`, (L.add[0] + L.sig[0]) / 2, L.add[1] + 40, { size: 18, color: C.muted, align: 'center', family: FONT.mono });
        U.text(ctx, `ŷ = ${fmt(s.yh, 3)}`, (L.sig[0] + L.loss[0]) / 2, L.sig[1] + 40, { size: 18, color: C.muted, align: 'center', family: FONT.mono });
      }
      // loss history sparkline
      if (this.history.length) {
        const hx = w * 0.62, hy = h * 0.06, hw = w * 0.34, hh = h * 0.16;
        ctx.strokeStyle = C.line; ctx.strokeRect(hx, hy, hw, hh);
        const all = [this.history[0][0]].concat(this.history.map(p => p[1])), mx = Math.max(...all);
        ctx.strokeStyle = C.red; ctx.lineWidth = 2.5; ctx.beginPath();
        all.forEach((v, i) => { const X = hx + hw * i / Math.max(1, all.length - 1), Y = hy + hh - hh * v / (mx || 1); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
        U.text(ctx, `loss after ${this.history.length} update${this.history.length > 1 ? 's' : ''}: ${fmt(all[all.length - 1], 4)}`, hx + hw, hy - 8, { size: 16, color: C.muted, align: 'right' });
      }
    }
  });

  // ======================================================================
  // TRAIN: a live neural-network playground
  // ======================================================================
  Deck.register('train', {
    init(slide) {
      this.ds = 'spiral'; this.layers = 2; this.width = 6; this.act = 'tanh'; this.lr = 0.03; this.noise = 0.05;
      this.bcv = U.canvas(slide.querySelector('[data-role=boundary]'), { onresize: () => this.drawBoundary() });
      this.ncv = U.canvas(slide.querySelector('[data-role=net]'), { onresize: () => this.drawNet() });
      this.lcv = U.canvas(slide.querySelector('[data-role=curve]'), { onresize: () => this.drawCurve() });
      const c1 = slide.querySelector('[data-role=ctl]');
      this.dsSeg = seg(c1, [{ value: 'gauss', label: 'blobs' }, { value: 'xor', label: 'XOR' }, { value: 'circles', label: 'circles' }, { value: 'moons', label: 'moons' }, { value: 'spiral', label: 'spiral' }], this.ds, v => { this.ds = v; this.rebuild(); });
      this.actSeg = seg(c1, [{ value: 'tanh', label: 'tanh' }, { value: 'relu', label: 'ReLU' }], this.act, v => { this.act = v; this.rebuild(); });
      const c2 = slide.querySelector('[data-role=ctl2]');
      this.layerSeg = seg(c2, [{ value: '1', label: '1 hidden layer' }, { value: '2', label: '2' }, { value: '3', label: '3' }], String(this.layers), v => { this.layers = +v; this.rebuild(); });
      this.wSl = slider(c2, { label: 'neurons/layer', min: 1, max: 8, step: 1, value: this.width, width: 180, fmt: v => String(v), oninput: v => { this.width = v; this.rebuild(); } });
      this.lrSl = slider(c2, { label: '<span class="m c-orange">η</span>', min: 0.003, max: 0.1, step: 0.001, value: this.lr, color: C.orange, width: 160, fmt: v => v.toFixed(3), oninput: v => { this.lr = v; } });
      const c3 = slide.querySelector('[data-role=ctl3]');
      this.playBtn = btn(c3, '▶ train', () => this.toggle(), 'primary');
      btn(c3, 'step', () => { this.trainSteps(5); this.redraw(true); });
      btn(c3, '⟲ new network', () => this.rebuild(1 + Math.floor(Math.random() * 1000)));
      this.readout = slide.querySelector('[data-role=readout]');
      this.loop = U.animator(() => { this.trainSteps(4); this.frame = (this.frame || 0) + 1; this.redraw(this.frame % 5 === 0); });
      this.rebuild();
    },
    leave() { this.stop(); },
    onStep(a, vis) { if (!vis) return; if (a === 'play') { if (!this.loop.running) this.toggle(); } if (a.startsWith('ds:')) { this.dsSeg.set(a.slice(3)); this.toggle(true); } },
    // seed 9: a reliable start (spiral, 2x6 tanh: 95% after ~720 epochs ≈ 3 s live); "new network" rolls a random one
    rebuild(seed) {
      const d = NN.datasets[this.ds](220, this.noise, 21);
      this.X = d.map(p => [p[0], p[1]]); this.Y = d.map(p => p[2]);
      const sizes = [2].concat(Array(this.layers).fill(this.width)).concat([1]);
      this.net = new NN.MLP(sizes, { act: this.act, seed: seed || 9 });
      this.epoch = 0; this.curve = [this.net.loss(this.X, this.Y)];
      this.redraw(true);
    },
    toggle(forceOn) { if (this.loop.running && !forceOn) this.stop(); else { this.loop.start(); this.playBtn.innerHTML = '⏸ pause'; } },
    stop() { this.loop && this.loop.stop(); if (this.playBtn) this.playBtn.innerHTML = '▶ train'; },
    trainSteps(k) { for (let i = 0; i < k; i++) { const L = this.net.trainBatch(this.X, this.Y, this.lr); this.epoch++; if (this.epoch % 4 === 0) this.curve.push(L); } if (this.curve.length > 600) this.curve = this.curve.filter((_, i) => i % 2 === 0); },
    redraw(full) { this.drawBoundary(); this.drawCurve(); if (full) this.drawNet(); this.updateReadout(); },
    updateReadout() {
      if (!this.readout) return;
      const L = this.curve[this.curve.length - 1], acc = this.net.accuracy(this.X, this.Y);
      this.readout.innerHTML = `epoch <b>${this.epoch}</b> · loss <b class="c-red">${fmt(L, 3)}</b> · accuracy <b class="${acc > 0.98 ? 'c-green' : ''}">${(acc * 100).toFixed(0)}%</b> · <span class="muted">${this.net.paramCount()} weights</span>`;
    },
    drawBoundary() {
      if (!this.net) return;
      const { ctx, w, h } = this.bcv, s = Math.min(w, h), v = U.view((w - s) / 2, (h - s) / 2, s, s, -1.25, 1.25, -1.25, 1.25);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      const n = 64, cs = s / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const p = this.net.predict([v.ix(v.px + (i + 0.5) * cs), v.iy(v.py + (j + 0.5) * cs)]);
        ctx.fillStyle = p > 0.5 ? U.rgba(C.orange, (p - 0.5) * 0.9) : U.rgba(C.blue, (0.5 - p) * 0.9);
        ctx.fillRect(v.px + i * cs, v.py + j * cs, cs + 0.6, cs + 0.6);
      }
      for (let i = 0; i < this.X.length; i++) U.circle(ctx, v.sx(this.X[i][0]), v.sy(this.X[i][1]), 5.5, this.Y[i] ? C.orange : C.blue, '#fff', 1.2);
      ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.strokeRect(v.px, v.py, v.pw, v.ph);
    },
    drawCurve() {
      if (!this.lcv || !this.curve) return;
      const { ctx, w, h } = this.lcv; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      const mx = Math.max(0.75, ...this.curve.slice(0, 5));
      const v = U.view(40, 8, w - 50, h - 30, 0, Math.max(20, this.curve.length - 1), 0, mx);
      U.grid(ctx, v, { step: 1e9, stepY: 0.25, minor: false, labels: false });
      ctx.strokeStyle = C.red; ctx.lineWidth = 2.5; ctx.beginPath();
      this.curve.forEach((L, i) => { const X = v.sx(i), Y = v.sy(Math.min(L, mx)); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
      U.text(ctx, 'loss', 4, 20, { size: 16, color: C.muted });
    },
    drawNet() {
      if (!this.net) return;
      const { ctx, w, h } = this.ncv, net = this.net, sizes = net.sizes, L = sizes.length;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      const colX = l => 50 + (w - 100) * l / (L - 1);
      const nodeY = (l, i) => h / 2 + (i - (sizes[l] - 1) / 2) * Math.min(64, (h - 40) / Math.max(...sizes));
      // edges
      for (let l = 0; l < L - 1; l++) for (let o = 0; o < sizes[l + 1]; o++) for (let i = 0; i < sizes[l]; i++) {
        const wv = net.W[l][o * sizes[l] + i];
        ctx.strokeStyle = wv >= 0 ? U.rgba(C.blue, 0.75) : U.rgba(C.red, 0.75); ctx.lineWidth = Math.min(7, 0.4 + Math.abs(wv) * 1.6);
        ctx.beginPath(); ctx.moveTo(colX(l), nodeY(l, i)); ctx.lineTo(colX(l + 1), nodeY(l + 1, o)); ctx.stroke();
      }
      // neuron thumbnails: each hidden neuron's activation over the input plane
      const G = 22, sz = 40, acts = [];
      for (let l = 0; l < L; l++) acts.push(Array.from({ length: sizes[l] }, () => new Float32Array(G * G)));
      for (let gi = 0; gi < G; gi++) for (let gj = 0; gj < G; gj++) {
        const x = -1.25 + 2.5 * (gi + 0.5) / G, y = 1.25 - 2.5 * (gj + 0.5) / G;
        net.forward([x, y]);
        for (let l = 0; l < L; l++) for (let n = 0; n < sizes[l]; n++) acts[l][n][gj * G + gi] = net.A[l][n];
      }
      for (let l = 0; l < L; l++) for (let n = 0; n < sizes[l]; n++) {
        const X = colX(l) - sz / 2, Y = nodeY(l, n) - sz / 2, a = acts[l][n];
        let mx = 1e-6; if (this.act === 'relu' && l > 0 && l < L - 1) for (const v of a) mx = Math.max(mx, Math.abs(v)); else mx = 1;
        const cs = sz / G;
        for (let k = 0; k < G * G; k++) {
          let v = a[k] / mx; if (l === L - 1) v = (a[k] - 0.5) * 2; if (l === 0) v = a[k] / 1.25;
          ctx.fillStyle = v > 0 ? U.rgba(C.orange, Math.min(1, v) * 0.95) : U.rgba(C.blue, Math.min(1, -v) * 0.95);
          ctx.fillRect(X + (k % G) * cs, Y + Math.floor(k / G) * cs, cs + 0.3, cs + 0.3);
        }
        ctx.strokeStyle = l === 0 || l === L - 1 ? C.text : C.muted; ctx.lineWidth = 1.5; ctx.strokeRect(X, Y, sz, sz);
      }
      U.text(ctx, 'inputs', colX(0), 22, { size: 16, color: C.muted, align: 'center' });
      U.text(ctx, 'output', colX(L - 1), 22, { size: 16, color: C.muted, align: 'center' });
      if (L > 2) U.text(ctx, 'hidden neurons: each learns a simple feature', (colX(1) + colX(L - 2)) / 2, h - 8, { size: 16, color: C.muted, align: 'center' });
    }
  });
})();
