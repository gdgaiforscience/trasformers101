/* =====================================================================
   Post-training & fine-tuning (slide "finetune")
   Scene 1 (clicks 1–4): real next-token probabilities of Gemma 3 270M for "hi"
            pre-trained on bare text vs instruction-tuned in its chat template (data/next_token.js),
            plus the post-training recipe SFT → RLHF → RLVR.
   Scene 2 (clicks 5–8): live LoRA explorer for one 4096 × 4096 layer, drawn as 22 × 22 cells.
            Full fine-tuning learns a dense change ΔW; LoRA freezes W and learns ΔW = B·A, with
            A random and B = 0 at the start, so training starts exactly at the original model
            (Hu et al. 2021, §4.1). The rank slider gives exact counts r·(d + k) vs d·k.
   Each click adds .atK to the slide body (K = number of visible steps): reversible, CSS-driven.
   ===================================================================== */
(function () {
  'use strict';
  const { clamp, lerp, ease, rampRgb, rgbStr, hexToRgb, mix, showToken, FONT } = U;

  // ---------- the real layer we describe (7B-class hidden size) ----------
  const D = 4096, K = 4096, DK = D * K;                    // 16,777,216 weights
  const RANKS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
  const R_DEFAULT = 3;                                      // RANKS[3] = 8
  const loraParams = r => r * (D + K);                      // B: d × r plus A: r × k

  // ---------- the drawing ----------
  const N = 22, CELL = 12, MS = N * CELL;                   // drawn matrices: 22 × 22 cells (264 px)
  const XW = 40, XD = 470, Y0 = 196;                        // W left edge, ΔW left edge, matrix top
  const XC = 770;                                           // counters column
  const NSTEP = 8;
  const VSCALE = 0.42;                                      // N(0,1) values → colour range (≈ ±2.4σ saturates)

  // user palette; text colours are AA on white
  const P = {
    ink: '#202124', muted: '#5f6368', dim: '#80868b', grey: '#9aa0a6', line: '#dadce0',
    blue: '#4285f4', dblue: '#174ea6', lblue: '#d2e3fc', red: '#ea4335', dred: '#a50e0e',
    green: '#34a853', dgreen: '#0d652d', lgreen: '#ceead6', lgrey: '#f1f3f4'
  };
  // the deck's diverging weight map, light version: red (−) · white (0) · blue (+)
  const NEG = ['#ffffff', '#fad2cf', '#ea4335', '#a50e0e'];
  const POS = ['#ffffff', '#d2e3fc', '#4285f4', '#174ea6'];
  const LG = hexToRgb('#f1f3f4');
  function cval(v, sat) {
    const c = rampRgb(v < 0 ? NEG : POS, clamp(Math.abs(v), 0, 1));
    if (sat === undefined || sat >= 1) return rgbStr(c[0], c[1], c[2]);
    return rgbStr(lerp(LG[0], c[0], sat), lerp(LG[1], c[1], sat), lerp(LG[2], c[2], sat));
  }
  const SANS = (w, px) => `${w} ${px}px ${FONT.sans}`;
  const MATH = px => `italic ${px}px ${FONT.math}`;
  const easeBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

  // ---------- fixed pseudo-random matrices (seeded, so every run looks the same) ----------
  const rnd = U.rng(20261109);
  const mat = (r, c, f) => Array.from({ length: r }, () => Array.from({ length: c }, f));
  const W0 = mat(N, N, () => rnd.normal());                 // pre-trained W (texture only)
  const DWF = mat(N, N, () => rnd.normal());                // full fine-tuning: a dense change
  const BF = mat(N, N, () => rnd.normal());                 // B after training (first r columns used)
  const A0 = mat(N, N, () => rnd.normal());                 // A at initialisation: random
  const AF = A0.map(row => row.map(v => v + 0.45 * rnd.normal()));   // A after training: moved a little

  // row i of B "trains" in a wave from top to bottom (ΔW row i depends only on B row i)
  const rowProg = (i, tr) => clamp((tr * (N + 7) - i) / 7, 0, 1);
  const thick = re => (re <= 8 ? re * 5 : Math.min(40 + (re - 8) * 3.4, 88));   // drawn strip thickness (px), not to scale

  function loraDW(re, tr) {                                 // ΔW = B·A / √r, at training progress tr
    const s = 1 / Math.sqrt(re), out = [];
    for (let i = 0; i < N; i++) {
      const row = new Array(N).fill(0), bi = ease(rowProg(i, tr));
      if (bi > 0) for (let k = 0; k < re; k++) {
        const b = BF[i][k] * bi, a0 = A0[k], a1 = AF[k];
        for (let j = 0; j < N; j++) row[j] += b * (a0[j] + (a1[j] - a0[j]) * tr);
      }
      for (let j = 0; j < N; j++) row[j] *= s;
      out.push(row);
    }
    return out;
  }

  function rich(ctx, segs, x, y, alpha) {                   // draw [{t, font, color}] left to right
    ctx.save(); ctx.globalAlpha = alpha === undefined ? 1 : alpha; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    let cx = x;
    for (const s of segs) { ctx.font = s.font; ctx.fillStyle = s.color || P.ink; ctx.fillText(s.t, cx, y); cx += ctx.measureText(s.t).width; }
    ctx.restore();
    return cx - x;
  }
  function richWidth(ctx, segs) { let w = 0; ctx.save(); for (const s of segs) { ctx.font = s.font; w += ctx.measureText(s.t).width; } ctx.restore(); return w; }
  function wrap(ctx, s, x, y, maxW, lh, font, color, alpha) {
    ctx.save(); ctx.font = font; ctx.fillStyle = color; ctx.globalAlpha = alpha; ctx.textAlign = 'left';
    let line = '';
    for (const word of s.split(' ')) {
      const t = line ? line + ' ' + word : word;
      if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, y); y += lh; line = word; } else line = t;
    }
    if (line) ctx.fillText(line, x, y);
    ctx.restore();
  }
  const fmtInt = v => Math.round(v).toLocaleString('en-US');
  function fmtShare(s) { const p = s * 100; return (p >= 10 ? p.toFixed(0) : p >= 1 ? p.toFixed(1) : p.toFixed(2)) + '%'; }
  function fmtProb(p) { return p >= 0.001 ? (p * 100).toFixed(1) + '%' : '<0.1%'; }

  Deck.register('finetune', {
    init(slide) {
      this.slide = slide;
      this.root = slide.querySelector('[data-role=root]');
      this.buildBars(slide.querySelector('[data-role=bars-pt]'), 'hi_pt', slide.querySelector('[data-role=rest-pt]'));
      this.buildBars(slide.querySelector('[data-role=bars-it]'), 'hi', slide.querySelector('[data-role=rest-it]'));

      this.panel = slide.querySelector('[data-role=lora-panel]');
      this.ph = { freeze: 0, split: 0, train: 0, count: 0 };
      this.pos = 0; this.r = 8; this.rPrev = 8; this.rb = 1; this.hov = null; this.cache = {};
      this.cv = U.canvas(slide.querySelector('[data-role=lora]'), { width: 1024, height: 576, onresize: () => this.draw() });
      this.slider = U.slider(slide.querySelector('[data-role=lora-ctl]'), {
        label: 'rank <span class="m">r</span>', min: 0, max: RANKS.length - 1, step: 1, value: R_DEFAULT, width: 250,
        color: P.green, fmt: i => String(RANKS[Math.round(i)]), oninput: i => this.setRank(Math.round(i))
      });
      this.tip = U.tip(this.panel);
      const c = this.cv.canvas;
      c.addEventListener('mousemove', e => this.hover(e));
      c.addEventListener('mouseleave', () => this.unhover());

      // optional manim clip, played over the live explorer
      this.vid = slide.querySelector('[data-role=film] video');
      const play = slide.querySelector('[data-role=play]'), close = slide.querySelector('[data-role=close]');
      if (play) play.addEventListener('click', () => { this.openFilm(); play.blur(); });
      if (close) close.addEventListener('click', e => { e.stopPropagation(); this.closeFilm(); close.blur(); });
      if (this.vid) this.vid.addEventListener('play', () => {           // K / J open it too, once the LoRA beat is on screen
        if (this.pos < 6) { this.vid.pause(); return; }
        this.panel.classList.add('film-on');
      });
      this.draw();
    },

    enter(slide) {
      if (slide._stepPos === 0) { this.r = this.rPrev = RANKS[R_DEFAULT]; this.rb = 1; this.slider.set(R_DEFAULT, true); }
      this.setPos(slide._stepPos, true);
    },
    leave() { cancelAnimationFrame(this._raf); cancelAnimationFrame(this._rraf); this.closeFilm(); this.unhover(); },
    onStep(action, visible, elx) {
      if (!action || action.indexOf('ft:') !== 0) return;
      const s = elx.closest('.slide');
      const pos = s._steps.filter(x => x.classList.contains('visible')).length;
      this.setPos(pos, !s.classList.contains('active'));
    },

    // ---------- step state ----------
    setPos(pos, instant) {
      const prev = this.pos; this.pos = pos;
      const root = this.root;
      if (instant) root.classList.add('ft-instant');
      for (let k = 1; k <= NSTEP; k++) root.classList.toggle('at' + k, pos >= k);
      if (instant) { void root.offsetWidth; requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('ft-instant'))); }
      this.closeFilm(); this.unhover();
      const lora = pos >= 6;
      if (instant) {
        cancelAnimationFrame(this._raf);
        const v = lora ? 1 : 0; this.ph = { freeze: v, split: v, train: v, count: v }; this.draw();
      } else if (lora && prev < 6) {
        // freeze W → split ΔW into B and A (the trainable count collapses here; B = 0, so ΔW = 0) → train B and A
        this.tween({ freeze: 1, split: 1, train: 1, count: 1 }, { freeze: [0, 0.9], split: [0.7, 1.7], train: [1.9, 3.9], count: [0.7, 1.7] });
      } else if (!lora && prev >= 6) {
        this.tween({ freeze: 0, split: 0, train: 0, count: 0 }, { freeze: [0, 0.7], split: [0, 0.7], train: [0, 0.5], count: [0, 0.7] });
      }
    },
    tween(target, win) {
      cancelAnimationFrame(this._raf);
      const from = Object.assign({}, this.ph), t0 = performance.now();
      const step = now => {
        const t = (now - t0) / 1000; let done = true;
        for (const k in target) {
          const u = clamp((t - win[k][0]) / (win[k][1] - win[k][0]), 0, 1);
          if (u < 1) done = false;
          this.ph[k] = lerp(from[k], target[k], ease(u));
        }
        if (done || !Deck.isActive(this.slide)) { Object.assign(this.ph, target); this.draw(); return; }
        this.draw();
        this._raf = requestAnimationFrame(step);
      };
      this._raf = requestAnimationFrame(step);
    },
    setRank(idx) {
      const r = RANKS[idx];
      if (r === this.r) return;
      this.rPrev = this.rb < 1 ? Math.round(lerp(this.rPrev, this.r, this.rb)) : this.r;
      this.r = r; this.rb = 0;
      cancelAnimationFrame(this._rraf);
      const t0 = performance.now();
      const step = now => {
        this.rb = clamp((now - t0) / 450, 0, 1);
        this.draw();
        if (this.rb < 1) this._rraf = requestAnimationFrame(step);
      };
      this._rraf = requestAnimationFrame(step);
    },

    // ---------- scene 1: real probability bars ----------
    buildBars(host, id, restHost) {
      if (!host) return;
      const data = U.data('nextToken');
      const p = data && data.prompts.find(q => q.id === id);
      if (!p) { U.missing(host, 'Next-token data missing (<span class="mono">data/next_token.js</span>).'); return; }
      const lse = p.lse['1.00'];                             // full-vocabulary log-sum-exp at T = 1: exact probabilities
      const items = p.topk.map(t => ({ tok: t.disp !== undefined ? t.disp : t.token, p: Math.exp(t.logit - lse) }))
        .sort((a, b) => b.p - a.p).slice(0, 5);
      host.innerHTML = items.map((it, k) => `<div class="fb${k === 0 ? ' top' : ''}"><span class="fb-lab">${showToken(it.tok)}</span>` +
        `<span class="fb-track"><i class="fb-fill" style="--w:${(it.p * 100).toFixed(2)}%"></i></span><span class="fb-pct">${fmtProb(it.p)}</span></div>`).join('');
      if (restHost) {
        const rest = Math.max(0, 1 - items.reduce((s, it) => s + it.p, 0));
        const others = ((data.vocabSize || 262144) - items.length).toLocaleString('en-US');
        restHost.innerHTML = `…the other <b>${others}</b> tokens share <b>${fmtProb(rest)}</b>`;
      }
    },

    // ---------- the manim film ----------
    openFilm() {
      if (!this.vid) return;
      this.panel.classList.add('film-on');
      try { this.vid.currentTime = 0; } catch (e) { /* not loaded yet */ }
      const pr = this.vid.play(); if (pr && pr.catch) pr.catch(() => {});
    },
    closeFilm() {
      if (!this.panel) return;
      this.panel.classList.remove('film-on');
      if (this.vid && !this.vid.paused) this.vid.pause();
    },

    // ---------- hover: ΔW[i][j] = row i of B · column j of A ----------
    hover(e) {
      if (this.pos < 6 || this.ph.train < 0.999) { this.unhover(); return; }
      const p = this.cv.toLocal(e);
      const j = Math.floor((p.x - XD) / CELL), i = Math.floor((p.y - Y0) / CELL);
      if (i < 0 || j < 0 || i >= N || j >= N) { this.unhover(); return; }
      if (!this.hov || this.hov.i !== i || this.hov.j !== j) { this.hov = { i, j }; this.draw(); }
      const r = this.r;
      const sum = r === 1 ? `<span class="m">B<sub>i1</sub> A<sub>1j</sub></span>: a single product`
        : `Σ<sub>k=1…${r}</sub> <span class="m">B<sub>ik</sub> A<sub>kj</sub></span>: <b>${r.toLocaleString('en-US')}</b> products`;
      this.tip.show(`<b>One cell of Δ<span class="m">W</span></b> = row of <b class="ft-green">B</b> · column of <b class="ft-green">A</b><br>` +
        `<span class="m">ΔW<sub>ij</sub></span> = ${sum}`, p.x, p.y);
    },
    unhover() { if (this.hov) { this.hov = null; this.draw(); } if (this.tip) this.tip.hide(); },

    // ---------- drawing ----------
    dw(re, tr) {
      if (tr >= 1) return this.cache[re] || (this.cache[re] = loraDW(re, 1));
      return loraDW(re, tr);
    },
    draw() {
      if (!this.cv) return;
      const { ctx, w, h } = this.cv;
      const { freeze: f, split: sp, train: tr, count: cn } = this.ph;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);

      // header: full fine-tuning fades out, then LoRA fades in (sequential, so the two never overlap)
      const aOut = clamp(1 - sp * 2, 0, 1), aIn = clamp(sp * 2 - 1, 0, 1);
      rich(ctx, [{ t: 'Full fine-tuning: learn a change ', font: SANS(500, 27) }, { t: 'ΔW', font: MATH(30) }, { t: ' for every weight', font: SANS(500, 27) }], 32, 54, aOut);
      rich(ctx, [{ t: 'LoRA: freeze ', font: SANS(500, 27) }, { t: 'W', font: MATH(30), color: P.dblue }, { t: ', learn ', font: SANS(500, 27) },
        { t: 'ΔW', font: MATH(30), color: P.dgreen }, { t: ' as two thin matrices', font: SANS(500, 27) }], 32, 54, aIn);
      U.text(ctx, 'one 4096 × 4096 layer of a 7B-class model, drawn as 22 × 22 cells', 32, 86, { size: 18, color: P.muted, alpha: aOut });
      U.text(ctx, 'one 4096 × 4096 layer, drawn as 22 × 22 cells · B and A drawn much wider than to scale', 32, 86, { size: 18, color: P.muted, alpha: aIn });

      // ---- W: pre-trained, then frozen
      const sat = lerp(1, 0.42, f);
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        ctx.fillStyle = cval(W0[i][j] * VSCALE, sat);
        ctx.fillRect(XW + j * CELL, Y0 + i * CELL, CELL - 1, CELL - 1);
      }
      if (f > 0) { ctx.fillStyle = `rgba(210,227,252,${0.38 * f})`; ctx.fillRect(XW, Y0, MS - 1, MS - 1); }
      ctx.strokeStyle = mix(P.grey, P.blue, f); ctx.lineWidth = 2 + f;
      ctx.strokeRect(XW - 2, Y0 - 2, MS + 3, MS + 3);
      if (f > 0.02) {                                       // ❄ badge pops in
        const s = Math.max(0, easeBack(clamp(f * 1.2, 0, 1)));
        ctx.save(); ctx.translate(XW + MS, Y0); ctx.scale(s, s);
        U.circle(ctx, 0, 0, 19, '#ffffff', P.blue, 2.5);
        U.text(ctx, '❄', 0, 7, { size: 21, color: P.dblue, align: 'center' });
        ctx.restore();
      }
      const wl = [{ t: 'W', font: MATH(30), color: f > 0.5 ? P.dblue : P.ink }, { t: '  4096 × 4096', font: SANS(400, 17), color: P.muted }];
      rich(ctx, wl, XW + MS / 2 - richWidth(ctx, wl) / 2, 484);
      U.text(ctx, 'pre-trained weights', XW + MS / 2, 508, { size: 18, color: P.muted, align: 'center', alpha: 1 - f });
      U.text(ctx, '❄ frozen: gets no gradients', XW + MS / 2, 508, { size: 18, color: P.dblue, align: 'center', alpha: f });

      U.text(ctx, '+', 342, Y0 + MS / 2 + 15, { size: 46, color: P.ink, align: 'center' });

      // ---- ΔW: dense (full fine-tuning) → B·A (LoRA)
      const re = Math.min(this.r, N), reP = Math.min(this.rPrev, N), rb = this.rb;
      const L = sp > 0 ? this.dw(re, tr) : null;
      const LP = sp > 0 && rb < 1 ? this.dw(reP, tr) : null;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        let v = (1 - sp) * DWF[i][j];
        if (L) v += sp * (LP ? lerp(LP[i][j], L[i][j], rb) : L[i][j]);
        ctx.fillStyle = cval(v * VSCALE);
        ctx.fillRect(XD + j * CELL, Y0 + i * CELL, CELL - 1, CELL - 1);
      }
      if (sp < 1) { ctx.save(); ctx.globalAlpha = 1 - sp; ctx.strokeStyle = P.red; ctx.lineWidth = 3; ctx.strokeRect(XD - 2, Y0 - 2, MS + 3, MS + 3); ctx.restore(); }
      if (sp > 0) { ctx.save(); ctx.globalAlpha = sp; ctx.setLineDash([7, 5]); ctx.strokeStyle = P.green; ctx.lineWidth = 2; ctx.strokeRect(XD - 2, Y0 - 2, MS + 3, MS + 3); ctx.restore(); }

      // B (d × r, left of ΔW) and A (r × k, above ΔW) extrude out of ΔW's edges
      const T = lerp(thick(reP), thick(re), rb) * sp;
      const bx = XD - 10 - T, ay = Y0 - 10 - T;
      if (T > 0.5) {
        const cw = T / re;
        for (let i = 0; i < N; i++) {
          const g = ease(rowProg(i, tr));
          for (let k = 0; k < re; k++) {
            ctx.fillStyle = cval(BF[i][k] * g * VSCALE);
            ctx.fillRect(bx + k * cw, Y0 + i * CELL, Math.max(0.6, cw - (cw > 4 ? 1 : 0)), CELL - 1);
          }
        }
        for (let k = 0; k < re; k++) for (let j = 0; j < N; j++) {
          ctx.fillStyle = cval((A0[k][j] + (AF[k][j] - A0[k][j]) * tr) * VSCALE);
          ctx.fillRect(XD + j * CELL, ay + k * cw, CELL - 1, Math.max(0.6, cw - (cw > 4 ? 1 : 0)));
        }
        ctx.save(); ctx.strokeStyle = P.green; ctx.lineWidth = 2.5;
        ctx.strokeRect(bx - 2, Y0 - 2, T + 3, MS + 3); ctx.strokeRect(XD - 2, ay - 2, MS + 3, T + 3); ctx.restore();
        // labels
        ctx.save(); ctx.globalAlpha = sp;
        U.mathText(ctx, 'B', bx + T / 2, 484, { size: 30, color: P.dgreen, align: 'center' });
        U.text(ctx, '4096 × r', Math.min(bx + T / 2 + 30, XD - 14), 508, { size: 15, color: P.muted, align: 'right' });
        U.mathText(ctx, 'A', XD - 22, ay + T / 2 + 2, { size: 30, color: P.dgreen, align: 'right' });
        U.text(ctx, 'r × 4096', XD - 22, ay + T / 2 + 22, { size: 15, color: P.muted, align: 'right' });
        ctx.restore();
      }
      // ΔW label + status
      const dl = [{ t: 'ΔW', font: MATH(30), color: sp > 0.5 ? P.dgreen : P.ink }];
      rich(ctx, dl, XD + MS / 2 - richWidth(ctx, dl) / 2, 484);
      U.text(ctx, 'trainable: all 16.8 M numbers', XD + MS / 2, 508, { size: 18, color: P.dred, align: 'center', alpha: 1 - sp });
      U.text(ctx, '= B · A, computed on the fly', XD + MS / 2, 508, { size: 18, color: P.dgreen, align: 'center', alpha: sp });

      // "B starts at zero" caption, between the split and the training
      const z = sp * (1 - clamp(tr * 4, 0, 1));
      if (z > 0.01) {
        ctx.save(); ctx.globalAlpha = z;
        ctx.fillStyle = 'rgba(255,255,255,0.92)'; U.roundRect(ctx, XD + 18, Y0 + MS / 2 - 52, MS - 36, 104, 12); ctx.fill();
        rich(ctx, [{ t: 'B', font: MATH(26), color: P.dgreen }, { t: ' = 0  ⇒  ', font: SANS(500, 23), color: P.dgreen }, { t: 'ΔW', font: MATH(26), color: P.dgreen }, { t: ' = 0', font: SANS(500, 23), color: P.dgreen }],
          XD + 50, Y0 + MS / 2 - 14);
        U.text(ctx, 'training starts exactly at', XD + MS / 2, Y0 + MS / 2 + 16, { size: 17, color: P.muted, align: 'center' });
        U.text(ctx, 'the original model', XD + MS / 2, Y0 + MS / 2 + 38, { size: 17, color: P.muted, align: 'center' });
        ctx.restore();
      }
      if (tr > 0.001 && tr < 0.999) {
        const a = Math.sin(Math.PI * tr);
        U.circle(ctx, XC + 6, Y0 - 6, 6, U.rgba(P.green, a), null);
        U.text(ctx, 'training B and A…', XC + 20, Y0, { size: 17, color: P.dgreen, alpha: a });
      }

      // hover highlight: one ΔW cell = row of B · column of A
      if (this.hov && T > 0.5) {
        const { i, j } = this.hov;
        ctx.save(); ctx.strokeStyle = P.ink; ctx.lineWidth = 2;
        ctx.strokeRect(bx - 1, Y0 + i * CELL - 1, T + 2, CELL + 1);
        ctx.strokeRect(XD + j * CELL - 1, ay - 1, CELL + 1, T + 2);
        ctx.setLineDash([3, 3]); ctx.lineWidth = 1.2; ctx.strokeStyle = U.rgba(P.ink, 0.55);
        ctx.beginPath(); ctx.moveTo(bx + T + 1, Y0 + (i + 0.5) * CELL); ctx.lineTo(XD + j * CELL, Y0 + (i + 0.5) * CELL);
        ctx.moveTo(XD + (j + 0.5) * CELL, ay + T + 1); ctx.lineTo(XD + (j + 0.5) * CELL, Y0 + i * CELL); ctx.stroke();
        ctx.setLineDash([]); ctx.lineWidth = 2.5; ctx.strokeStyle = P.ink;
        ctx.strokeRect(XD + j * CELL - 1.5, Y0 + i * CELL - 1.5, CELL + 2, CELL + 2);
        ctx.restore();
      }

      // ---- counters (exact numbers for the real 4096 × 4096 layer)
      const rTr = lerp(loraParams(this.rPrev), loraParams(this.r), rb);
      const trains = lerp(DK, rTr, cn), frozen = lerp(0, DK, f);
      const tc = mix(P.dred, P.dgreen, cn);
      ctx.save(); if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';
      U.text(ctx, 'TRAINS', XC, 232, { size: 15, color: P.muted, font: SANS(500, 15) });
      U.text(ctx, 'FROZEN', XC, 352, { size: 15, color: P.muted, font: SANS(500, 15) });
      ctx.restore();
      U.text(ctx, fmtInt(trains), XC, 276, { color: tc, font: SANS(500, 40) });
      U.text(ctx, `${fmtShare(trains / DK)} of this layer`, XC, 302, { size: 18, color: P.muted });
      U.text(ctx, fmtInt(frozen), XC, 392, { color: frozen > 0 ? P.dblue : P.muted, font: SANS(500, 32) });
      U.text(ctx, f > 0.5 ? 'pre-trained, untouched' : 'nothing is frozen', XC, 418, { size: 18, color: P.muted });
      const hint = cn < 0.5 ? 'Each one also needs a gradient and two Adam moments.'
        : this.r === 1 ? 'Rank 1: every row of ΔW is a scaled copy of one row. On two GPT-3 tasks that was enough.'
          : this.r === 2 ? 'LoRA paper: on two GPT-3 tasks, rank 1 already matched rank 64.'
            : this.r <= 64 ? 'The LoRA paper tested r = 1 to 64 on GPT-3. Drag to 1 to see the pattern.'
              : this.r < 2048 ? 'Higher rank: more freedom, but more numbers to train.'
                : 'Break-even: B and A now hold as many numbers as W.';
      wrap(ctx, hint, XC, 456, 236, 21, SANS(400, 16), P.muted, cn < 0.5 ? 1 - cn * 2 : (cn - 0.5) * 2);

      // ---- share bar: how much of the layer trains
      const bx0 = 490, bw = 502, by = 544, share = trains / DK;
      U.text(ctx, 'share of this layer that trains', bx0, 534, { size: 16, color: P.muted });
      U.text(ctx, fmtShare(share), bx0 + bw, 534, { color: tc, align: 'right', font: SANS(500, 16) });
      ctx.fillStyle = mix(P.lgrey, P.lblue, cn); U.roundRect(ctx, bx0, by, bw, 14, 7); ctx.fill();
      ctx.fillStyle = mix(P.red, P.green, cn); U.roundRect(ctx, bx0, by, Math.max(3, share * bw), 14, 7); ctx.fill();
    }
  });
})();
