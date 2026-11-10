/* =====================================================================
   Chapter 4 demos: tensors, the artificial neuron (Iris), activation
   functions, a layer as a matrix (stepper)
   ===================================================================== */
(function () {
  'use strict';
  const { C, FONT, el, slider, btn, seg, fmt, fmtMinus, clamp, lerp, sigmoid } = U;

  // ======================================================================
  // TENSORS: a photo is a grid of numbers (zoom until you see them)
  // ======================================================================
  Deck.register('tensors', {
    init(slide) {
      const H = U.data('hopper');
      const host = slide.querySelector('[data-role=photo]');
      if (!H) { U.missing(host); return; }
      this.H = H;
      const wrap = el('div', { class: 'canvas-wrap' }, host);
      const cv = this.cv = U.canvas(wrap, { onresize: () => this.draw() });
      this.mode = 'color';
      this.z = 1; this.cx = H.width / 2; this.cy = H.height / 2;
      this.tz = 1; this.tcx = this.cx; this.tcy = this.cy;
      const ctl = slide.querySelector('[data-role=photo-ctl]');
      this.modeSeg = seg(ctl, [{ value: 'color', label: 'colour (R,G,B)' }, { value: 'gray', label: 'grey' }], 'color', v => { this.mode = v; this.draw(); });
      btn(ctl, '🔍 zoom into the eye', () => this.zoomTo(25, 23.2, 9), 'primary');
      btn(ctl, 'reset', () => this.zoomTo(H.width / 2, H.height / 2, 1));
      this.readout = slide.querySelector('[data-role=photo-readout]');
      // interaction: wheel zoom + drag pan + hover readout
      let drag = null;
      cv.canvas.addEventListener('wheel', e => {
        e.preventDefault();
        const p = cv.toLocal(e), g = this.toPix(p.x, p.y);
        const nz = clamp(this.tz * Math.exp(-e.deltaY * 0.0015), 1, 14);
        this.tcx = g.x + (this.tcx - g.x) * (this.tz / nz); this.tcy = g.y + (this.tcy - g.y) * (this.tz / nz);
        this.tz = nz; this.anim();
      }, { passive: false });
      cv.canvas.addEventListener('pointerdown', e => { drag = { p: cv.toLocal(e), cx: this.tcx, cy: this.tcy }; cv.canvas.setPointerCapture(e.pointerId); });
      cv.canvas.addEventListener('pointerup', () => { drag = null; });
      cv.canvas.addEventListener('pointermove', e => {
        const p = cv.toLocal(e);
        if (drag) { const s = this.cell(); this.tcx = drag.cx - (p.x - drag.p.x) / s; this.tcy = drag.cy - (p.y - drag.p.y) / s; this.anim(); }
        const g = this.toPix(p.x, p.y), c = Math.floor(g.x), r = Math.floor(g.y);
        if (c >= 0 && r >= 0 && c < H.width && r < H.height && this.readout) {
          const i = (r * H.width + c) * 3, R = H.rgb[i], G = H.rgb[i + 1], B = H.rgb[i + 2];
          this.readout.innerHTML = `pixel (row ${r}, col ${c}) → <b class="c-red">R ${R}</b> · <b class="c-green">G ${G}</b> · <b class="c-blue">B ${B}</b>`;
        }
      });
      this.draw();
    },
    cell() { const cv = this.cv, H = this.H; return Math.min(cv.w / H.width, cv.h / H.height) * this.z; },
    toPix(x, y) { const s = this.cell(); return { x: this.cx + (x - this.cv.w / 2) / s, y: this.cy + (y - this.cv.h / 2) / s }; },
    zoomTo(x, y, z) { this.tcx = x; this.tcy = y; this.tz = z; this.anim(); },
    anim() {
      if (this._raf) return;
      const step = () => {
        const k = 0.18;
        this.z = lerp(this.z, this.tz, k); this.cx = lerp(this.cx, this.tcx, k); this.cy = lerp(this.cy, this.tcy, k);
        this.draw();
        if (Math.abs(this.z - this.tz) > 0.002 || Math.abs(this.cx - this.tcx) > 0.002 || Math.abs(this.cy - this.tcy) > 0.002) this._raf = requestAnimationFrame(step);
        else { this._raf = 0; this.z = this.tz; this.cx = this.tcx; this.cy = this.tcy; this.draw(); }
      };
      this._raf = requestAnimationFrame(step);
    },
    draw() {
      if (!this.H) return;
      const { ctx, w, h } = this.cv, H = this.H, s = this.cell();
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      const x0 = w / 2 - this.cx * s, y0 = h / 2 - this.cy * s;
      const c0 = Math.max(0, Math.floor(-x0 / s)), c1 = Math.min(H.width, Math.ceil((w - x0) / s));
      const r0 = Math.max(0, Math.floor(-y0 / s)), r1 = Math.min(H.height, Math.ceil((h - y0) / s));
      const gray = this.mode === 'gray';
      for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) {
        const i = (r * H.width + c) * 3;
        let R = H.rgb[i], G = H.rgb[i + 1], B = H.rgb[i + 2];
        if (gray) { const g = H.gray ? H.gray[r * H.width + c] : Math.round(0.299 * R + 0.587 * G + 0.114 * B); R = G = B = g; }
        ctx.fillStyle = `rgb(${R},${G},${B})`;
        ctx.fillRect(Math.floor(x0 + c * s), Math.floor(y0 + r * s), Math.ceil(s) + 0.5, Math.ceil(s) + 0.5);
      }
      if (s >= 26) {                         // grid lines + numbers
        ctx.strokeStyle = 'rgba(15,17,21,0.55)'; ctx.lineWidth = 1; ctx.beginPath();
        for (let c = c0; c <= c1; c++) { const X = Math.round(x0 + c * s) + 0.5; ctx.moveTo(X, Math.max(0, y0 + r0 * s)); ctx.lineTo(X, Math.min(h, y0 + r1 * s)); }
        for (let r = r0; r <= r1; r++) { const Y = Math.round(y0 + r * s) + 0.5; ctx.moveTo(Math.max(0, x0 + c0 * s), Y); ctx.lineTo(Math.min(w, x0 + c1 * s), Y); }
        ctx.stroke();
        const alpha = clamp((s - 26) / 18, 0, 1);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) {
          const i = (r * H.width + c) * 3, R = H.rgb[i], G = H.rgb[i + 1], B = H.rgb[i + 2];
          const lum = 0.299 * R + 0.587 * G + 0.114 * B, X = x0 + (c + 0.5) * s, Y = y0 + (r + 0.5) * s;
          ctx.globalAlpha = alpha;
          if (gray || s < 64) {
            const g = gray ? (H.gray ? H.gray[r * H.width + c] : Math.round(lum)) : Math.round(lum);
            ctx.fillStyle = lum > 128 ? '#111' : '#eee'; ctx.font = `${Math.min(22, s * 0.36)}px ${FONT.mono}`;
            ctx.fillText(String(g), X, Y);
          } else {
            const fs = Math.min(19, s * 0.22); ctx.font = `${fs}px ${FONT.mono}`;
            ctx.fillStyle = lum > 128 ? '#5a0000' : '#ffb3ab'; ctx.fillText(String(R), X, Y - fs * 1.05);
            ctx.fillStyle = lum > 128 ? '#0b3d00' : '#c9f7b5'; ctx.fillText(String(G), X, Y);
            ctx.fillStyle = lum > 128 ? '#002a55' : '#bfe9f5'; ctx.fillText(String(B), X, Y + fs * 1.05);
          }
        }
        ctx.globalAlpha = 1;
      }
    }
  });

  // EEG + text + protein side panels on the same slide
  Deck.register('signals', {
    init(slide) {
      const E = U.data('eeg'), host = slide.querySelector('[data-role=eeg]');
      if (host) {
        if (!E) U.missing(host, 'EEG data missing');
        else {
          const cv = this.cv = U.canvas(host, { onresize: () => this.draw() });
          this.E = E;
          this.draw();
        }
      }
      const T = U.data('tokens'), th = slide.querySelector('[data-role=text-tokens]');
      if (th && T) {
        const ex = T.examples[0];
        th.innerHTML = ex.pieces.map((p, i) => `<span class="token-chip">${U.esc(p).replace(/ /g, '␣')}<span class="tid">${ex.ids[i]}</span></span>`).join('');
      }
      const P = U.data('protein'), ph = slide.querySelector('[data-role=protein-seq]');
      if (ph && P) {
        const AA = 'ACDEFGHIKLMNPQRSTVWY', seqs = P.seq.slice(0, 16).split('');
        ph.innerHTML = seqs.map(a => `<span class="token-chip" style="background:#e6f4ea;border-color:#a8dab5">${a}<span class="tid">${AA.indexOf(a)}</span></span>`).join('') + '<span class="dim mono"> …</span>';
      }
    },
    draw() {
      const E = this.E; if (!E) return;
      const { ctx, w, h } = this.cv;
      ctx.fillStyle = C.bg2; ctx.fillRect(0, 0, w, h);
      const n = Math.min(E.data[0].length, 400), lanes = E.data.length, lh = h / lanes;
      const cols = [C.blue, C.teal, C.purple, C.orange];
      E.data.forEach((ch, k) => {
        let mx = 0; for (let i = 0; i < n; i++) mx = Math.max(mx, Math.abs(ch[i]));
        ctx.strokeStyle = cols[k % 4]; ctx.lineWidth = 1.6; ctx.beginPath();
        for (let i = 0; i < n; i++) { const X = 60 + (w - 70) * i / (n - 1), Y = lh * (k + 0.5) - (ch[i] / (mx || 1)) * lh * 0.42; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
        ctx.stroke();
        U.text(ctx, E.channels[k], 6, lh * (k + 0.5) + 6, { size: 15, color: C.muted, family: FONT.mono });
      });
    }
  });

  // ======================================================================
  // NEURON: one artificial neuron classifying iris flowers
  // ======================================================================
  Deck.register('neuron', {
    init(slide) {
      const I = U.data('iris');
      const host = slide.querySelector('[data-role=plot]');
      if (!I) { U.missing(host); return; }
      this.I = I;
      this.pair = 'easy';
      this.w1 = 1.0; this.w2 = 1.0; this.b = -8.0;   // starts wrong on purpose: every flower is called "setosa" (50/100)
      const wrap = el('div', { class: 'canvas-wrap' }, host);
      this.cv = U.canvas(wrap, { onresize: () => this.draw() });
      this.tipper = U.tip(wrap);
      const dh = slide.querySelector('[data-role=diagram]');
      this.dg = U.canvas(dh, { onresize: () => this.drawDiagram() });
      const ctl = slide.querySelector('[data-role=ctl]');
      this.s1 = slider(ctl, { label: '<span class="m c-yellow">w</span><sub>1</sub> petal length', min: -4, max: 4, step: 0.05, value: this.w1, color: C.yellow, width: 250, fmt: v => fmtMinus(v, 2), oninput: v => { this.w1 = v; this.update(); } });
      this.s2 = slider(ctl, { label: '<span class="m c-yellow">w</span><sub>2</sub> petal width', min: -4, max: 4, step: 0.05, value: this.w2, color: C.yellow, width: 250, fmt: v => fmtMinus(v, 2), oninput: v => { this.w2 = v; this.update(); } });
      this.sb = slider(ctl, { label: '<span class="m c-teal">b</span> bias', min: -14, max: 14, step: 0.1, value: this.b, color: C.teal, width: 250, fmt: v => fmtMinus(v, 1), oninput: v => { this.b = v; this.update(); } });
      const ctl2 = slide.querySelector('[data-role=ctl2]');
      this.pairSeg = seg(ctl2, [{ value: 'easy', label: 'setosa vs versicolor' }, { value: 'hard', label: 'versicolor vs virginica' }], 'easy', v => { this.pair = v; this.update(); });
      btn(ctl2, '⚙️ let it learn', () => this.learn(), 'green');
      btn(ctl2, 'reset', () => { if (this._learn) { this._learn.stop(); this._learn = null; } this.w1 = 1.0; this.w2 = 1.0; this.b = -8.0; this.s1.set(this.w1, true); this.s2.set(this.w2, true); this.sb.set(this.b, true); this.update(); });
      this.eq = slide.querySelector('[data-role=eq]');
      this.acc = slide.querySelector('[data-role=acc]');
      this.flowerCards = Array.from(slide.querySelectorAll('[data-role=flowers] [data-species]'));
      this.flowerCards.forEach(card => {
        const pick = () => {
          const sp = card.dataset.species;
          const next = sp === 'setosa' ? 'easy' : sp === 'virginica' ? 'hard' : (this.pair === 'easy' ? 'hard' : 'easy');
          if (next !== this.pair) this.pairSeg.set(next);
        };
        card.addEventListener('click', pick);
        card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      });
      this.hover = null;
      this.cv.canvas.addEventListener('pointermove', e => this.onHover(this.cv.toLocal(e)));
      this.cv.canvas.addEventListener('pointerleave', () => { this.hover = null; this.tipper.hide(); this.draw(); this.drawDiagram(); this.syncFlowers(); });
      this.update();
    },
    leave() { if (this._learn) { this._learn.stop(); this._learn = null; } },
    spColor(sp) {
      return sp === 'setosa' ? '#4285f4' : sp === 'versicolor' ? '#e37400' : '#34a853';
    },
    pairInfo() {
      const names = this.pair === 'easy' ? ['setosa', 'versicolor'] : ['versicolor', 'virginica'];
      return { names, cols: [this.spColor(names[0]), this.spColor(names[1])] };
    },
    pts() {
      const [a, b] = this.pair === 'easy' ? [0, 1] : [1, 2];
      return this.I.rows.filter(r => r[4] === a || r[4] === b).map(r => {
        const sp = this.I.species[r[4]];
        return { x: r[2], y: r[3], c: r[4] === b ? 1 : 0, sp, col: this.spColor(sp), r };
      });
    },
    view() { const { w, h } = this.cv; return U.view(70, 20, w - 90, h - 70, 0.6, 7.4, 0, 2.7); },
    z(x, y) { return this.w1 * x + this.w2 * y + this.b; },
    syncFlowers() {
      if (!this.flowerCards) return;
      const [s0, s1] = this.pairInfo().names;
      const hsp = this.hover ? this.hover.sp : null;
      this.flowerCards.forEach(card => {
        const sp = card.dataset.species;
        card.classList.toggle('is-off', sp !== s0 && sp !== s1);
        card.classList.toggle('is-hover', sp === hsp);
        const tag = card.querySelector('[data-role=sp-tag]');
        if (tag) tag.textContent = sp === s0 ? 'ŷ → 0' : sp === s1 ? 'ŷ → 1' : (sp === 'virginica' ? 'hard pair ▸' : '◂ easy pair');
      });
    },
    update() {
      const P = this.pts(); let ok = 0;
      for (const p of P) ok += ((sigmoid(this.z(p.x, p.y)) > 0.5 ? 1 : 0) === p.c) ? 1 : 0;
      const { names, cols } = this.pairInfo();
      if (this.acc) this.acc.innerHTML = `correct: <b class="${ok === P.length ? 'c-green' : 'c-yellow'}">${ok}</b> / ${P.length} flowers &nbsp;<span class="legend" style="display:inline-flex"><span><i class="sw" style="background:${cols[0]}"></i>${names[0]} (ŷ→0)</span><span><i class="sw" style="background:${cols[1]}"></i>${names[1]} (ŷ→1)</span></span>`;
      if (this.eq) this.eq.innerHTML = `<span class="m">ŷ</span> <span class="op">=</span> <span class="m">σ</span>( <b class="c-yellow">${fmtMinus(this.w1, 2)}</b>·<span class="m c-blue">x</span><sub>1</sub> <span class="op">+</span> <b class="c-yellow">${fmtMinus(this.w2, 2)}</b>·<span class="m c-blue">x</span><sub>2</sub> <span class="op">${this.b < 0 ? '−' : '+'}</span> <b class="c-teal">${fmt(Math.abs(this.b), 1)}</b> )`;
      this.draw(); this.drawDiagram(); this.syncFlowers();
    },
    draw() {
      if (!this.I) return;
      const { ctx, w, h } = this.cv, v = this.view();
      const [col0, col1] = this.pairInfo().cols;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      // probability field
      const cs = 10;
      for (let X = v.px; X < v.px + v.pw; X += cs) for (let Y = v.py; Y < v.py + v.ph; Y += cs) {
        const p = sigmoid(this.z(v.ix(X + cs / 2), v.iy(Y + cs / 2)));
        ctx.fillStyle = p > 0.5 ? U.rgba(col1, (p - 0.5) * 0.42) : U.rgba(col0, (0.5 - p) * 0.42);
        ctx.fillRect(X, Y, cs, cs);
      }
      U.grid(ctx, v, { step: 1, stepY: 0.5, labels: true, axes: false, minor: false });
      U.text(ctx, 'petal length (cm)  →  x₁', v.px + v.pw, h - 8, { size: 20, color: C.muted, align: 'right' });
      ctx.save(); ctx.translate(18, v.py + 6); ctx.rotate(-Math.PI / 2); U.text(ctx, 'petal width (cm)  →  x₂', 0, 0, { size: 20, color: C.muted, align: 'right' }); ctx.restore();
      // decision boundary  w1 x + w2 y + b = 0
      const ends = [];
      const add = (x, y) => { if (x >= v.x0 - 1e-9 && x <= v.x1 + 1e-9 && y >= v.y0 - 1e-9 && y <= v.y1 + 1e-9) ends.push([x, y]); };
      if (Math.abs(this.w2) > 1e-6) { add(v.x0, -(this.w1 * v.x0 + this.b) / this.w2); add(v.x1, -(this.w1 * v.x1 + this.b) / this.w2); }
      if (Math.abs(this.w1) > 1e-6) { add(-(this.w2 * v.y0 + this.b) / this.w1, v.y0); add(-(this.w2 * v.y1 + this.b) / this.w1, v.y1); }
      if (ends.length >= 2) {
        const [a, b] = ends;
        ctx.save(); ctx.strokeStyle = C.yellow; ctx.lineWidth = 4; ctx.shadowColor = C.yellow; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.moveTo(v.sx(a[0]), v.sy(a[1])); ctx.lineTo(v.sx(b[0]), v.sy(b[1])); ctx.stroke(); ctx.restore();
        // normal vector (direction in which z grows), drawn in pixel space
        const mx = (v.sx(a[0]) + v.sx(b[0])) / 2, my = (v.sy(a[1]) + v.sy(b[1])) / 2;
        const gx = this.w1 / (v.pw / (v.x1 - v.x0)), gy = -this.w2 / (v.ph / (v.y1 - v.y0));
        const gl = Math.hypot(gx, gy) || 1;
        U.arrow(ctx, mx, my, mx + gx / gl * 70, my + gy / gl * 70, { color: C.yellow, width: 3 });
        U.mathText(ctx, 'w', mx + gx / gl * 84 + 4, my + gy / gl * 84 + 8, { size: 28, color: C.yellow });
      }
      // points
      for (const p of this.pts()) {
        const X = v.sx(p.x), Y = v.sy(p.y), pr = sigmoid(this.z(p.x, p.y)), wrong = (pr > 0.5 ? 1 : 0) !== p.c;
        U.circle(ctx, X, Y, 8, p.col, C.bg, 2);
        if (wrong) U.circle(ctx, X, Y, 13, null, C.red, 3);
      }
      if (this.hover) { const p = this.hover; U.circle(ctx, v.sx(p.x), v.sy(p.y), 15, null, C.text, 2.5); }
    },
    onHover(m) {
      const v = this.view(); let best = null, bd = 18;
      for (const p of this.pts()) { const d = Math.hypot(v.sx(p.x) - m.x, v.sy(p.y) - m.y); if (d < bd) { bd = d; best = p; } }
      this.hover = best;
      if (best) {
        const z = this.z(best.x, best.y), y = sigmoid(z);
        this.tipper.show(`<div class="iris-tip-head"><img src="assets/img/iris_${best.sp}.jpg" alt=""><b><i class="sw" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${best.col};margin-right:6px"></i><i>Iris ${best.sp}</i></b></div>petal length <span class="c-blue">x₁ = ${best.x}</span> cm<br>petal width <span class="c-blue">x₂ = ${best.y}</span> cm<br>z = ${fmtMinus(z, 2)} → <b>ŷ = σ(z) = ${fmt(y, 3)}</b>`, m.x, m.y);
      } else this.tipper.hide();
      this.draw(); this.drawDiagram(); this.syncFlowers();
    },
    drawDiagram() {
      if (!this.dg) return;
      const { ctx, w, h } = this.dg;
      const [col0, col1] = this.pairInfo().cols;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      const p = this.hover || { x: 4.5, y: 1.5 };
      const ins = [{ x: 70, y: h * 0.28, v: p.x, lab: 'x₁', wv: this.w1, sub: 'petal length' }, { x: 70, y: h * 0.62, v: p.y, lab: 'x₂', wv: this.w2, sub: 'petal width' }];
      const nx = w * 0.62, ny = h * 0.45, ox = w - 50;
      const z = this.z(p.x, p.y), yv = sigmoid(z), ocol = yv > 0.5 ? col1 : col0;
      ins.forEach(n => {
        const col = n.wv >= 0 ? C.blue : C.red, lw = 1 + Math.min(9, Math.abs(n.wv) * 2.4);
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(n.x + 34, n.y); ctx.lineTo(nx - 46, ny); ctx.stroke();
        U.circle(ctx, n.x, n.y, 34, U.rgba(C.blue, 0.16), C.blue, 2.5);
        U.text(ctx, fmt(n.v, 1), n.x, n.y + 8, { size: 22, color: C.text, align: 'center', family: FONT.mono });
        U.mathText(ctx, n.lab, n.x, n.y - 44, { size: 26, color: C.blue, align: 'center' });
        U.text(ctx, fmtMinus(n.wv, 2), (n.x + nx) / 2 - 10, (n.y + ny) / 2 - 12, { size: 20, color: C.yellow, align: 'center', family: FONT.mono });
      });
      // bias input
      ctx.strokeStyle = C.teal; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(nx, h - 30); ctx.lineTo(nx, ny + 46); ctx.stroke(); ctx.setLineDash([]);
      U.text(ctx, 'b = ' + fmtMinus(this.b, 1), nx + 12, h - 22, { size: 20, color: C.teal, family: FONT.mono });
      // neuron
      ctx.save(); ctx.shadowColor = C.yellow; ctx.shadowBlur = 18 * yv;
      U.circle(ctx, nx, ny, 46, U.rgba(C.yellow, 0.08 + 0.25 * yv), C.text, 2.5); ctx.restore();
      U.text(ctx, 'Σ → σ', nx, ny + 9, { size: 24, color: C.text, align: 'center', family: FONT.math });
      U.arrow(ctx, nx + 48, ny, ox - 34, ny, { color: C.muted, width: 2.5 });
      U.circle(ctx, ox, ny, 30, U.rgba(ocol, 0.2 + 0.6 * Math.abs(yv - 0.5) * 2), ocol, 2.5);
      U.text(ctx, fmt(yv, 2), ox, ny + 8, { size: 20, color: C.text, align: 'center', family: FONT.mono });
      U.mathText(ctx, 'ŷ', ox, ny - 40, { size: 26, color: C.text, align: 'center' });
      U.text(ctx, `z = ${fmtMinus(z, 2)}`, nx, ny - 58, { size: 20, color: C.muted, align: 'center', family: FONT.mono });
    },
    learn() {
      if (this._learn) return;
      let t = 0, m = [0, 0, 0], s = [0, 0, 0];
      const P = this.pts(), lr = 0.06;
      this._learn = U.animator(() => {
        for (let k = 0; k < 6; k++) {
          let g1 = 0, g2 = 0, gb = 0;
          for (const p of P) { const e = sigmoid(this.z(p.x, p.y)) - p.c; g1 += e * p.x; g2 += e * p.y; gb += e; }
          const g = [g1 / P.length, g2 / P.length, gb / P.length]; t++;
          const par = ['w1', 'w2', 'b'];
          for (let i = 0; i < 3; i++) { m[i] = 0.9 * m[i] + 0.1 * g[i]; s[i] = 0.999 * s[i] + 0.001 * g[i] * g[i]; this[par[i]] -= lr * (m[i] / (1 - Math.pow(0.9, t))) / (Math.sqrt(s[i] / (1 - Math.pow(0.999, t))) + 1e-8); }
        }
        this.w1 = clamp(this.w1, -4, 4); this.w2 = clamp(this.w2, -4, 4); this.b = clamp(this.b, -14, 14);
        this.s1.set(this.w1, true); this.s2.set(this.w2, true); this.sb.set(this.b, true);
        this.update();
        if (t > 900) { this._learn.stop(); this._learn = null; }
      });
      this._learn.start();
    }
  });

  // ======================================================================
  // ACTIVATION: the rule's own graph, with real numbers travelling through it
  //   x = each neuron's sum z (IN, along the bottom); y = a = f(z) (OUT, up the
  //   left). Each pick bends the curve into the new rule, then 27 numbers rise
  //   from the IN axis and land on the curve: each one's height is its output.
  //   Hovering traces any number up to the curve and across to OUT.
  //   Colour = sign of the input (red −, ink 0, blue +), as on the weight wires.
  //   WCAG AA: #4285f4 / #ea4335 only for lines & dots (≥ 3:1 on #f8f9fa);
  //   canvas text uses #202124 / #5f6368.
  // ======================================================================
  const AP = {
    pos: '#4285f4', neg: '#ea4335', ink: '#202124', muted: '#5f6368',
    axis: '#5f6368', grid: '#e8eaed', zero: '#9aa0a6', spark: '#dadce0'
  };
  const gelu = z => 0.5 * z * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (z + 0.044715 * z * z * z)));
  const mv = s => `<span class="m">${s}</span>`, op = s => `<span class="op">${s}</span>`, mr = s => `<span class="mr">${s}</span>`;
  const ACTS = {
    // not a button: the dashed straight line on the graph, and the shape every visit bends away from
    none: { f: z => z, name: 'No activation', range: 'same as the input' },
    step: {
      f: z => (z >= 0 ? 1 : 0), label: 'step (1943)', name: 'Step', full: 'McCulloch &amp; Pitts, 1943',
      says: 'Negative → <b>0</b>. Zero or positive → <b>1</b>. All or nothing: the neuron is off or on.',
      eq: `${mv('a')}${op('=')}1 ${mr('if')} ${mv('z')}${op('≥')}0, ${mr('else')} 0`,
      foot: 'The first artificial neuron. It is flat everywhere, so gradient descent gets no slope to learn from.',
      range: 'only ever 0 or 1'
    },
    sigmoid: {
      f: sigmoid, label: 'sigmoid', name: 'Sigmoid', full: 'logistic curve',
      says: 'Squashes <b>every</b> number into <b>0 to 1</b>: big negatives → almost 0, big positives → almost 1, and 0 → 0.5.',
      eq: `${mv('a')}${op('=')}1 / (1 + ${mv('e')}<sup>−${mv('z')}</sup>)`,
      foot: 'Reads like a probability: it gave our Iris neuron its confidence.',
      range: 'always between 0 and 1'
    },
    tanh: {
      f: Math.tanh, label: 'tanh', name: 'Tanh', full: 'hyperbolic tangent',
      says: 'Squashes every number into <b>−1 to 1</b> and keeps its sign: negatives stay negative, 0 stays 0.',
      eq: `${mv('a')}${op('=')}${mr('tanh')}(${mv('z')})`,
      foot: 'A sigmoid stretched and re-centred on 0. It bends the grid in our warp demos.',
      range: 'always between −1 and 1'
    },
    relu: {
      f: z => Math.max(0, z), label: 'ReLU', name: 'ReLU', full: 'rectified linear unit',
      says: 'Negatives become <b>0</b>: the neuron switches off. Positives pass through <b>unchanged</b>.',
      eq: `${mv('a')}${op('=')}${mr('max')}(0, ${mv('z')})`,
      foot: 'Dead simple and fast: it powered the 2012 deep-learning boom.',
      range: 'never negative'
    },
    gelu: {
      f: gelu, label: 'GELU', name: 'GELU', full: 'Gaussian error linear unit',
      says: 'A smooth ReLU: big negatives fade to <b>≈ 0</b>, small ones dip just below, positives pass <b>almost unchanged</b>.',
      eq: `${mv('a')}${op('=')}${mv('z')} · Φ(${mv('z')})`,
      foot: 'Φ is a smooth 0-to-1 switch. Standard in Transformers; Gemma uses a gated version (GeGLU).',
      range: 'never below −0.17'
    }
  };
  const ACT_ORDER = ['step', 'sigmoid', 'tanh', 'relu', 'gelu'];
  const ACT_WIN = { z0: -3.6, z1: 3.6, a0: -1.25, a1: 3.4 };                   // the graph window (z across, a up)
  const ACT_CZ = []; for (let k = -180; k <= 180; k++) ACT_CZ.push(k / 50);    // curve samples every 0.02
  const ACT_C0 = ACT_CZ.indexOf(0);                                            // where red (z < 0) meets blue
  const ACT_Z = []; for (let k = -13; k <= 13; k++) ACT_Z.push(k / 4);          // 27 travelling numbers, −3.25 … 3.25
  const ACT_EXZ = [-3, -1, 0, 1, 3], ACT_EX = ACT_EXZ.map(z => ACT_Z.indexOf(z)); // sample values for the screen-reader summary
  const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const signCol = z => (z < 0 ? AP.neg : z > 0 ? AP.pos : AP.ink);
  const actLine = (ctx, x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  // dotted reading guide (round dots, like a pencil trace on graph paper)
  function actDots(ctx, x1, y1, x2, y2, col, alpha) {
    if (alpha <= 0.01 || Math.hypot(x2 - x1, y2 - y1) < 1) return;
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.setLineDash([0.1, 8]);
    actLine(ctx, x1, y1, x2, y2); ctx.restore();
  }
  // tidy numbers: integers stay integers; never round 0.995 up to 1, or −0.004 to 0
  function fmtAct(v, exact) {
    if (!exact) return fmtMinus(v, 2);
    if (Math.abs(v - Math.round(v)) < 1e-9) return fmtMinus(Math.round(v), 0);
    let s = fmt(v, 2);
    if ((+s === 0 && v !== 0) || (Math.abs(+s) === 1 && Math.abs(v) < 1)) s = fmt(v, 3);
    return s.replace('-', '−');
  }
  // word-sized graph of a rule (a Tufte sparkline): red half for z < 0, blue half for z ≥ 0
  function actSpark(f) {
    const W = 112, H = 64, p = 7, z0 = -3, z1 = 3, N = 60;
    const zs = []; for (let i = 0; i <= N; i++) zs.push(z0 + (z1 - z0) * i / N);
    const ys = zs.map(f);
    const lo = Math.min(0, ...ys), hi = Math.max(lo + 1e-6, 0, ...ys);
    const X = z => (p + (z - z0) / (z1 - z0) * (W - 2 * p)).toFixed(1);
    const Y = v => (H - p - (v - lo) / (hi - lo) * (H - 2 * p)).toFixed(1);
    const path = (a, b, g) => zs.filter(z => z >= a && z <= b).map((z, i) => `${i ? 'L' : 'M'}${X(z)} ${Y(g(z))}`).join('');
    const stroke = c => `stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false">` +
      `<path d="M${p} ${Y(0)}H${W - p}M${X(0)} ${p}V${H - p}" stroke="${AP.spark}" stroke-width="1.5" fill="none"/>` +
      `<path d="${path(z0, 0, z => (z === 0 ? f(-1e-9) : f(z)))}" ${stroke(AP.neg)}/>` +
      `<path d="${path(0, z1, f)}" ${stroke(AP.pos)}/></svg>`;
  }
  Deck.register('activation', {
    init(slide) {
      const host = slide.querySelector('[data-role=plot]');
      const wrap = el('div', { class: 'canvas-wrap' }, host);
      this.cv = U.canvas(wrap, { onresize: () => this.draw() });
      this.cv.canvas.setAttribute('role', 'img');
      this.sel = this.shown = 'sigmoid'; this.st = this.state(this.sel); this.oldSt = null;
      this.idle = true; this.tt = 1; this.oldA = 0; this.probe = null;
      const ctl = slide.querySelector('[data-role=ctl]');
      this.seg = seg(ctl, ACT_ORDER.map(k => ({ value: k, label: ACTS[k].label })), this.sel, k => this.choose(k));
      this.ruleEl = slide.querySelector('[data-role=rule]');
      this.sparkBend = slide.querySelector('[data-role=spark-bend]');
      const lin = slide.querySelector('[data-role=spark-lin]');
      if (lin) lin.innerHTML = actSpark(z => z);
      const cvs = this.cv.canvas;
      cvs.addEventListener('pointermove', e => { this.probe = clamp(this.geom().iz(this.cv.toLocal(e).x), -3.5, 3.5); this.draw(); });
      cvs.addEventListener('pointerleave', () => { this.probe = null; this.draw(); });
      this.text(); this.draw();
    },
    // every visit: the dashed "no activation" line bends into the chosen rule, then the numbers run through it
    enter() {
      this.stop(); this.st = this.state('none'); this.shown = 'none'; this.oldSt = null;
      this.idle = false; this.tt = 0; this.oldA = 0; this.draw();
      this.play(this.sel, 650);
    },
    leave() { this.stop(); },
    onStep(a, vis) { if (vis && ACT_ORDER.includes(a)) this.seg.set(a); },
    choose(k) { this.sel = k; this.text(); this.play(k, 0); },
    stop() { if (this._raf) cancelAnimationFrame(this._raf); this._raf = 0; },
    state(k) {
      const A = ACTS[k];
      return { curve: ACT_CZ.map(A.f), zl: A.f(-1e-9), out: ACT_Z.map(A.f) };   // zl = value just left of 0 (the step's jump)
    },
    blend(a, b, e) {
      const m = (u, v) => lerp(u, v, e);
      return { curve: a.curve.map((v, i) => m(v, b.curve[i])), zl: m(a.zl, b.zl), out: a.out.map((v, i) => m(v, b.out[i])) };
    },
    // one take, in seconds: last numbers fade (0–0.2) · the curve bends into the new rule (0–0.6) ·
    // the numbers rise from IN and land on it (0.45–0.95)
    play(k, hold) {
      this.stop();
      const a = this.st, b = this.state(k), hadOld = this.idle;
      this.oldSt = hadOld ? a : null; this.idle = false;
      if (REDUCED) { this.shown = k; this.st = b; this.idle = true; this.tt = 1; this.oldA = 0; this.draw(); return; }
      const t0 = performance.now() + (hold || 0);
      const tick = now => {
        const tau = (now - t0) / 1000;
        if (tau >= 0) {
          this.shown = k;
          this.st = this.blend(a, b, U.ease(clamp(tau / 0.6, 0, 1)));
          this.oldA = hadOld ? 1 - clamp(tau / 0.2, 0, 1) : 0;
          this.tt = clamp((tau - 0.45) / 0.5, 0, 1);
        }
        if (tau < 1.0) { this.draw(); this._raf = requestAnimationFrame(tick); }
        else { this._raf = 0; this.st = b; this.idle = true; this.tt = 1; this.oldA = 0; this.draw(); }
      };
      this._raf = requestAnimationFrame(tick);
    },
    text() {
      const A = ACTS[this.sel];
      if (this.ruleEl) this.ruleEl.innerHTML =
        `<div class="act-name">${A.name}${A.full ? `<small>${A.full}</small>` : ''}</div>` +
        `<p class="act-says">${A.says}</p><div class="eqline act-eq">${A.eq}</div><p class="act-foot">${A.foot}</p>`;
      if (this.sparkBend) this.sparkBend.innerHTML = actSpark(A.f);
    },
    geom() {
      const { w, h } = this.cv, { z0, z1, a0, a1 } = ACT_WIN, L = 168, R = w - 46, T = 74, B = h - 116;
      return {
        L, R, T, B,
        x: z => L + (z - z0) / (z1 - z0) * (R - L),
        y: a => B - (a - a0) / (a1 - a0) * (B - T),
        iz: X => z0 + (X - L) / (R - L) * (z1 - z0)
      };
    },
    curveAt(st, z) {   // read the (possibly mid-bend) curve between its samples
      const u = (z - ACT_WIN.z0) * 50, i = clamp(Math.floor(u), 0, ACT_CZ.length - 2);
      return lerp(st.curve[i], st.curve[i + 1], u - i);
    },
    // draw a row of differently styled text runs (sans words + italic math letters) from x
    runs(ctx, x, y, parts, align) {
      ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      let tot = 0; for (const p of parts) { ctx.font = p.f; p.w = ctx.measureText(p.t).width; tot += p.w; }
      let cx = align === 'center' ? x - tot / 2 : align === 'right' ? x - tot : x;
      for (const p of parts) { ctx.font = p.f; ctx.fillStyle = p.c; ctx.fillText(p.t, cx, y); cx += p.w; }
      ctx.restore(); return tot;
    },
    // white value tag for the hover probe: 'center' (under the IN axis) or 'right' (beside the OUT axis)
    pill(ctx, sym, val, x, y, align) {
      const parts = [{ t: sym, f: `italic 30px ${FONT.math}`, c: AP.ink }, { t: ` = ${val}`, f: `500 26px ${FONT.sans}`, c: AP.ink }];
      ctx.save(); let tw = 0; for (const p of parts) { ctx.font = p.f; tw += ctx.measureText(p.t).width; } ctx.restore();
      const w = tw + 26, left = align === 'right' ? x + 13 - w : clamp(x - w / 2, 4, this.cv.w - w - 4);
      ctx.save(); U.roundRect(ctx, left, y - 28, w, 40, 12);
      ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = AP.ink; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      this.runs(ctx, left + 13, y, parts);
    },
    // the travelling numbers at progress tt: 0 = waiting on the IN axis, 1 = landed on the curve (height = output)
    numbers(ctx, g, st, tt, alpha) {
      if (alpha <= 0.01) return;
      const rise = U.easeOut(clamp(tt, 0, 1));
      ctx.save(); ctx.globalAlpha = alpha;
      ACT_Z.forEach((z, i) => U.circle(ctx, g.x(z), lerp(g.B, Math.max(g.T - 4, g.y(st.out[i])), rise), 5, signCol(z), C.bg, 1.5));
      ctx.restore();
    },
    draw() {
      if (!this.cv) return;
      const { ctx, w, h } = this.cv, g = this.geom(), st = this.st, A = ACTS[this.shown];
      const { z0, z1, a0, a1 } = ACT_WIN, probing = this.probe !== null, dim = probing ? 0.25 : 1;
      const sans = (px, wt) => `${wt || 400} ${px}px ${FONT.sans}`, math = px => `italic ${px}px ${FONT.math}`;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);

      // axis titles in plain words: OUT up the left, IN along the bottom
      this.runs(ctx, 4, 38, [
        { t: 'OUT', f: sans(24, 500), c: AP.ink }, { t: '   ', f: sans(24), c: AP.muted }, { t: 'a', f: math(30), c: AP.ink },
        { t: ', what the next layer gets  —  ', f: sans(24), c: AP.muted }, { t: A.range, f: sans(24, 500), c: AP.ink }]);
      this.runs(ctx, g.L, h - 22, [
        { t: 'IN', f: sans(24, 500), c: AP.ink }, { t: '   ', f: sans(24), c: AP.muted }, { t: 'z', f: math(30), c: AP.ink },
        { t: ', each neuron’s sum  —  ', f: sans(24), c: AP.muted }, { t: 'can be any number', f: sans(24, 500), c: AP.ink }]);
      U.text(ctx, 'hover to try any number', w - 4, 38, { size: 20, color: AP.muted, align: 'right' });

      // graph paper: grid with stronger zero lines
      ctx.save(); ctx.lineWidth = 1.5;
      for (let z = -3; z <= 3; z++) { ctx.strokeStyle = z ? AP.grid : AP.zero; actLine(ctx, g.x(z), g.T, g.x(z), g.B); }
      for (let a = -1; a <= 3; a++) { ctx.strokeStyle = a ? AP.grid : AP.zero; actLine(ctx, g.L, g.y(a), g.R, g.y(a)); }
      ctx.restore();
      // the two axes and their plain scales
      ctx.save(); ctx.strokeStyle = AP.axis; ctx.lineWidth = 2;
      actLine(ctx, g.L, g.T - 8, g.L, g.B); actLine(ctx, g.L, g.B, g.R, g.B); ctx.restore();
      for (let a = -1; a <= 3; a++) U.text(ctx, fmtMinus(a, 0), g.R + 12, g.y(a) + 6, { size: 18, color: AP.muted });
      for (let z = -3; z <= 3; z++) U.text(ctx, fmtMinus(z, 0), g.x(z), g.B + 38, { size: 19, color: AP.muted, align: 'center', alpha: dim });

      // the reference: no activation is the straight line a = z
      const d0 = Math.max(z0, a0), d1 = Math.min(z1, a1);
      ctx.save(); ctx.strokeStyle = AP.zero; ctx.lineWidth = 2; ctx.setLineDash([9, 8]);
      actLine(ctx, g.x(d0), g.y(d0), g.x(d1), g.y(d1)); ctx.restore();
      this.runs(ctx, g.x(2.5) - 16, g.y(2.5) - 8, [{ t: 'no activation: ', f: sans(20), c: AP.muted }, { t: 'a = z', f: math(24), c: AP.muted }], 'right');

      // the rule itself: red where it reads negative sums, blue where it reads positive ones
      ctx.save(); ctx.beginPath(); ctx.rect(g.L, g.T - 6, g.R - g.L + 6, g.B - g.T + 6); ctx.clip();
      ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.strokeStyle = AP.neg; ctx.beginPath();
      for (let i = 0; i < ACT_C0; i++) { const X = g.x(ACT_CZ[i]), Y = g.y(st.curve[i]); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
      ctx.lineTo(g.x(0), g.y(st.zl)); ctx.stroke();
      ctx.strokeStyle = AP.pos; ctx.beginPath();
      for (let i = ACT_C0; i < ACT_CZ.length; i++) { const X = g.x(ACT_CZ[i]), Y = g.y(st.curve[i]); i === ACT_C0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
      ctx.stroke(); ctx.restore();
      if (Math.abs(st.curve[ACT_C0] - st.zl) > 0.04) actDots(ctx, g.x(0), g.y(st.zl), g.x(0), g.y(st.curve[ACT_C0]), AP.zero, 1);

      // where the numbers start: evenly spaced sums on the IN axis
      ACT_Z.forEach(z => U.circle(ctx, g.x(z), g.B, 4, U.rgba(signCol(z), 0.4)));

      // the numbers: the last rule's fade out while this rule's travel in
      if (this.oldA > 0.01 && this.oldSt) this.numbers(ctx, g, this.oldSt, 1, this.oldA * dim);
      this.numbers(ctx, g, st, this.idle ? 1 : this.tt, dim);

      // hover probe: read any number off the graph, the same way
      if (probing) {
        const z = this.probe, a = this.idle ? ACTS[this.shown].f(z) : this.curveAt(st, z);
        const X = g.x(z), Y = Math.max(g.T - 4, g.y(a));
        actDots(ctx, X, g.B, X, Y, AP.ink, 1); actDots(ctx, X, Y, g.L, Y, AP.ink, 1);
        U.circle(ctx, X, g.B, 8, AP.ink, C.bg, 2.5); U.circle(ctx, X, Y, 9, AP.ink, C.bg, 3); U.circle(ctx, g.L, Y, 8, AP.ink, C.bg, 2.5);
        this.pill(ctx, 'z', fmtMinus(z, 2), X, g.B + 38, 'center');
        this.pill(ctx, 'a', fmtAct(a, this.idle), g.L - 26, Y + 9, 'right');
      }

      if (this.idle) {   // screen-reader summary of what the rule does to a few sample numbers
        const lab = `${A.name}: for example ${ACT_EXZ.map(z => fmtAct(z, true)).join(', ')} come out as ${ACT_EX.map(i => fmtAct(st.out[i], true)).join(', ')}; the output is ${A.range}.`;
        if (this._aria !== lab) { this.cv.canvas.setAttribute('aria-label', lab); this._aria = lab; }
      }
    }
  });

  // ======================================================================
  // LAYER: a whole layer is one matrix–vector multiplication
  // ======================================================================
  Deck.register('layer', {
    init(slide) {
      // same numbers as the m02_layer_matrix animation (row 1 = the m01 neuron: 1.22 − 0.2 = 1.02 → σ = 0.73)
      this.W = [[1.2, -0.8, 0.5], [-0.4, 0.9, 0.7], [0.3, 1.1, -1.0], [-0.9, 0.2, 0.6]];
      this.x = [0.9, 0.2, 0.6]; this.b = [-0.2, 0.1, 0.4, -0.3];
      this.row = -1; this.phase = 0;     // phase: 0 rows, 1 bias added, 2 activated
      this.dh = slide.querySelector('[data-role=net]');
      this.cv = U.canvas(this.dh, { onresize: () => this.draw() });
      this.mat = slide.querySelector('[data-role=matrix]');
      this.dot = slide.querySelector('[data-role=dot]');
      const ctl = slide.querySelector('[data-role=ctl]');
      btn(ctl, 'next neuron ▸', () => this.advance(), 'primary');
      btn(ctl, '▶ all at once', () => this.all());
      btn(ctl, '🎲 new input', () => { this.x = this.x.map(() => Math.round((Math.random() * 2 - 0.6) * 10) / 10); this.reset(); });
      btn(ctl, 'reset', () => { this.x = [0.9, 0.2, 0.6]; this.reset(); });
      this.hoverCell = null;
      this.render();
    },
    enter() { this.reset(); },
    onStep(a, vis) { if (a === 'auto' && vis) this.all(); },
    z(i) { return this.W[i].reduce((s, w, j) => s + w * this.x[j], 0); },
    reset() { clearInterval(this._ti); this.row = -1; this.phase = 0; this.render(); },
    advance() {
      if (this.row < 3) { this.row++; }
      else if (this.phase === 0) this.phase = 1;
      else if (this.phase === 1) this.phase = 2;
      this.render();
    },
    all() { this.reset(); clearInterval(this._ti); this._ti = setInterval(() => { this.advance(); if (this.phase === 2) clearInterval(this._ti); }, 700); },
    render() { this.renderMatrix(); this.draw(); },
    renderMatrix() {
      const W = this.W, x = this.x, b = this.b, r = this.row, ph = this.phase;
      const cell = (v, cls, attrs) => `<td class="${cls || ''}" ${attrs || ''}>${fmtMinus(v, 1)}</td>`;
      let wHtml = '', xHtml = '', bHtml = '', zHtml = '', aHtml = '';
      for (let i = 0; i < 4; i++) {
        wHtml += '<tr>' + W[i].map((v, j) => cell(v, `w ${i === r && ph === 0 ? 'hl' : ''} ${i <= r ? 'done' : ''}`, `data-i="${i}" data-j="${j}"`)).join('') + '</tr>';
        const zi = this.z(i);
        zHtml += `<tr><td class="z ${i <= r ? 'on' : ''} ${i === r && ph === 0 ? 'hl' : ''}">${i <= r ? fmtMinus(ph >= 1 ? zi + b[i] : zi, 2) : '?'}</td></tr>`;
        bHtml += `<tr><td class="b ${ph >= 1 ? 'on' : ''}">${fmtMinus(b[i], 1)}</td></tr>`;
        aHtml += `<tr><td class="a ${ph >= 2 ? 'on' : ''}">${ph >= 2 ? fmt(sigmoid(zi + b[i]), 2) : '?'}</td></tr>`;
      }
      for (let j = 0; j < 3; j++) xHtml += `<tr><td class="x ${r >= 0 && ph === 0 ? 'hl' : ''}">${fmtMinus(x[j], 1)}</td></tr>`;
      this.mat.innerHTML = `
        <div class="mx-row">
          <div class="mx-col">${ph >= 2 ? '<div class="mx-lab">activation</div>' : ''}<div class="mx-col-inner">${ph >= 2 ? `<span class="m mx-sym">σ</span>(` : ''}</div></div>
          <div class="mx-col"><div class="mx-lab c-yellow">weights <span class="m">W</span> (4×3)</div><table class="mx">${wHtml}</table></div>
          <div class="mx-col"><div class="mx-lab c-blue">input <span class="m">x</span></div><table class="mx">${xHtml}</table></div>
          <div class="mx-op">${ph >= 1 ? '+' : ''}</div>
          <div class="mx-col" style="opacity:${ph >= 1 ? 1 : 0.15}"><div class="mx-lab c-teal">bias <span class="m">b</span></div><table class="mx">${bHtml}</table></div>
          <div class="mx-op">${ph >= 2 ? ')' : ''} =</div>
          <div class="mx-col"><div class="mx-lab">${ph >= 2 ? 'output <span class="m">a</span>' : 'sums <span class="m">z</span>'}</div><table class="mx">${ph >= 2 ? aHtml : zHtml}</table></div>
        </div>`;
      if (this.dot) {
        if (r >= 0 && ph === 0) {
          const terms = W[r].map((w, j) => `<b class="c-yellow">${fmtMinus(w, 1)}</b>×<b class="c-blue">${fmtMinus(x[j], 1)}</b>`).join(' + ');
          this.dot.innerHTML = `neuron ${r + 1}: ${terms} = <b>${fmtMinus(this.z(r), 2)}</b>`;
        } else if (ph === 1) this.dot.innerHTML = 'add each neuron’s bias <span class="m c-teal">b</span>…';
        else if (ph === 2) this.dot.innerHTML = '…then squash each one with <span class="m">σ</span>. That is the whole layer: <b class="c-yellow">a = σ(Wx + b)</b>';
        else this.dot.innerHTML = '<span class="muted">Each row of <span class="m c-yellow">W</span> is one neuron’s weights. Press “next neuron”.</span>';
      }
      this.mat.querySelectorAll('td.w').forEach(td => {
        td.addEventListener('mouseenter', () => { this.hoverCell = [+td.dataset.i, +td.dataset.j]; this.draw(); });
        td.addEventListener('mouseleave', () => { this.hoverCell = null; this.draw(); });
      });
    },
    draw() {
      const { ctx, w, h } = this.cv;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      const inX = 90, outX = w - 140, inY = j => h * (0.22 + 0.28 * j), outY = i => h * (0.12 + 0.253 * i);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
        const wv = this.W[i][j], hl = (this.row === i && this.phase === 0) || (this.hoverCell && this.hoverCell[0] === i && this.hoverCell[1] === j);
        ctx.save();
        ctx.strokeStyle = wv >= 0 ? C.blue : C.red; ctx.globalAlpha = hl ? 1 : (this.row >= 0 && this.phase === 0 ? 0.18 : 0.55);
        ctx.lineWidth = 1 + Math.abs(wv) * (hl ? 5 : 3.5);
        if (hl) { ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 12; }
        ctx.beginPath(); ctx.moveTo(inX + 30, inY(j)); ctx.lineTo(outX - 30, outY(i)); ctx.stroke(); ctx.restore();
        if (hl) U.text(ctx, fmtMinus(wv, 1), lerp(inX, outX, 0.36), lerp(inY(j), outY(i), 0.36) - 8, { size: 20, color: C.yellow, align: 'center', family: FONT.mono });
      }
      for (let j = 0; j < 3; j++) {
        U.circle(ctx, inX, inY(j), 30, U.rgba(C.blue, 0.12 + 0.4 * Math.abs(this.x[j])), C.blue, 2.5);
        U.text(ctx, fmtMinus(this.x[j], 1), inX, inY(j) + 7, { size: 20, align: 'center', family: FONT.mono });
        U.mathText(ctx, `x${'₁₂₃'[j]}`, inX - 50, inY(j) + 9, { size: 26, color: C.blue, align: 'right' });
      }
      for (let i = 0; i < 4; i++) {
        const known = i <= this.row, zi = this.z(i) + (this.phase >= 1 ? this.b[i] : 0), av = sigmoid(this.z(i) + this.b[i]);
        const fill = this.phase >= 2 ? U.rgba(C.yellow, 0.1 + 0.6 * av) : known ? U.rgba(C.text, 0.12) : 'transparent';
        ctx.save(); if (i === this.row && this.phase === 0) { ctx.shadowColor = C.yellow; ctx.shadowBlur = 16; }
        U.circle(ctx, outX, outY(i), 30, fill, i === this.row && this.phase === 0 ? C.yellow : C.text, 2.5); ctx.restore();
        if (known) U.text(ctx, this.phase >= 2 ? fmt(av, 2) : fmtMinus(zi, 2), outX, outY(i) + 7, { size: 18, align: 'center', family: FONT.mono });
        U.text(ctx, `neuron ${i + 1}`, outX + 42, outY(i) + 7, { size: 18, color: C.muted });
      }
    }
  });

  // matrix styles for the layer demo
  document.head.appendChild(Object.assign(document.createElement('style'), {
    textContent: `
    .mx-row{display:flex;align-items:center;gap:18px;font-family:var(--math)}
    .mx-col{display:flex;flex-direction:column;align-items:center;gap:8px}
    .mx-lab{font-family:var(--sans);font-size:20px;color:var(--muted);white-space:nowrap}
    .mx-op{font-size:46px;color:var(--text);min-width:24px;text-align:center;padding-top:30px}
    .mx-sym{font-size:56px;padding-top:30px}
    table.mx{border-collapse:separate;border-spacing:6px 4px;border-left:3px solid var(--muted);border-right:3px solid var(--muted);border-radius:10px;padding:2px 6px}
    table.mx td{font-size:30px;min-width:76px;text-align:center;padding:6px 8px;border-radius:8px;color:var(--text);transition:background .25s,color .25s}
    table.mx td.w{color:var(--yellow)} table.mx td.w.hl{background:#fef7e0;box-shadow:0 0 0 2px #fdd663 inset}
    table.mx td.x{color:var(--blue)} table.mx td.x.hl{background:#e8f0fe}
    table.mx td.b{color:var(--teal)} table.mx td.z{color:var(--dim)} table.mx td.z.on{color:var(--text)} table.mx td.z.hl{background:#fef7e0}
    table.mx td.a{color:var(--dim)} table.mx td.a.on{color:var(--yellow);font-weight:700}
    `
  }));
})();
