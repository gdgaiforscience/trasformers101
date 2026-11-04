/* =====================================================================
   Chapters 1–3 demos: the AI zoo, an 80-year timeline, why-now compute
   chart, the technology stack and the journey of "hi"
   ===================================================================== */
(function () {
  'use strict';
  const { C, FONT, el, btn, seg, fmt, clamp, lerp } = U;
  const SUP = n => String(n).split('').map(c => ({ '-': '⁻' })[c] || '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join('');

  // ======================================================================
  // ZOO: AI ⊃ ML ⊃ deep learning ⊃ foundation models
  // ======================================================================
  const RINGS = [
    { id: 'ai', r: 1.0, col: C.muted, name: 'Artificial intelligence', year: '1956 →', def: 'Any technique that makes a computer do something we would call “intelligent” if a person did it.', ex: ['Chess engines and route planners', 'Rule-based expert systems', 'Search & logic (e.g. theorem provers)'] },
    { id: 'ml', r: 0.76, col: C.blue, name: 'Machine learning', year: '1959 →', def: 'Instead of writing the rules, <b>learn them from data</b>. Show examples, not instructions.', ex: ['Spam filters, recommendations', 'Random forests / XGBoost on tabular lab data', 'Clustering cells or galaxies'] },
    { id: 'dl', r: 0.53, col: C.teal, name: 'Deep learning', year: '2012 →', def: 'Machine learning with <b>many-layered neural networks</b> that discover their own features from raw data.', ex: ['Image & speech recognition', 'AlphaFold (protein structure)', 'AI weather forecasting'] },
    { id: 'gen', r: 0.3, col: C.yellow, name: 'Foundation models & generative AI', year: '2017 →', def: 'Huge networks <b>pre-trained on vast data</b>, then adapted to many tasks. They <b>generate</b> text, images, video, code and molecules.', ex: ['Gemini, Gemma and other LLMs', 'Image / video / music generators', 'Protein & materials generators'] }
  ];
  Deck.register('zoo', {
    init(slide) {
      this.cv = U.canvas(slide.querySelector('[data-role=rings]'), { onresize: () => this.draw() });
      this.info = slide.querySelector('[data-role=info]');
      this.sel = 0; this.hover = -1; this.reveal = 4;
      this.cv.canvas.addEventListener('pointermove', e => { const k = this.ringAt(this.cv.toLocal(e)); if (k !== this.hover) { this.hover = k; this.draw(); } });
      this.cv.canvas.addEventListener('click', e => { const k = this.ringAt(this.cv.toLocal(e)); if (k >= 0) { this.sel = k; this.show(); this.draw(); } });
      this.show(); this.draw();
    },
    enter(slide) { if (slide._stepPos === 0) { this.sel = 0; this.hover = -1; this.show(); this.draw(); } },
    onStep(a, vis) { const k = RINGS.findIndex(r => r.id === a); if (k >= 0) { this.sel = vis ? k : Math.max(0, k - 1); this.show(); this.draw(); } },
    geom() { const { w, h } = this.cv, R = Math.min(w, h) / 2 - 16; return { cx: w / 2, cy: h / 2, R }; },
    ringAt(m) {
      const { cx, cy, R } = this.geom(), d = Math.hypot(m.x - cx, m.y - (cy + 0)) / R;
      let k = -1; RINGS.forEach((r, i) => { const off = (1 - r.r) * R; const dd = Math.hypot(m.x - cx, m.y - (cy + off)) / R; if (dd <= r.r) k = i; });
      return k;
    },
    show() {
      const r = RINGS[this.sel];
      if (this.info) this.info.innerHTML = `<div class="kicker" style="color:${r.col}">${r.year}</div><h3 style="font-size:46px;font-weight:400;margin:0 0 14px;color:${r.col}">${r.name}</h3><p class="big" style="font-size:34px">${r.def}</p><ul class="clean mt-s">${r.ex.map(e => `<li>${e}</li>`).join('')}</ul>`;
    },
    draw() {
      const { ctx, w, h } = this.cv, { cx, cy, R } = this.geom();
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      RINGS.forEach((r, i) => {
        const rad = r.r * R, y = cy + (1 - r.r) * R, on = i === this.sel, hv = i === this.hover;
        ctx.save(); ctx.beginPath(); ctx.arc(cx, y, rad, 0, Math.PI * 2);
        ctx.fillStyle = U.rgba(r.col, on ? 0.16 : 0.06); ctx.fill();
        ctx.strokeStyle = r.col; ctx.lineWidth = on ? 4 : hv ? 3 : 2; if (on) { ctx.shadowColor = r.col; ctx.shadowBlur = 18; } ctx.stroke(); ctx.restore();
        const label = r.name.replace(' & generative AI', '');
        U.text(ctx, label, cx, y - rad + (i === 3 ? rad * 0.95 : 44), { size: i === 3 ? 26 : 30, color: r.col, align: 'center' });
      });
    }
  });

  // ======================================================================
  // TIMELINE: 80 years of AI, with a "hype temperature" curve
  // ======================================================================
  const MILESTONES = [
    [1943, '🧠', 'McCulloch & Pitts', 'A mathematical model of a neuron: inputs, weights, a threshold.'],
    [1950, '🤖', 'Turing’s imitation game', '“Can machines think?” — the paper that framed the question.'],
    [1956, '🏫', 'Dartmouth workshop', 'The term “artificial intelligence” is born (coined in the 1955 proposal).'],
    [1958, '🔌', 'Perceptron', 'Rosenblatt’s machine learns its weights from examples.'],
    [1969, '📕', '“Perceptrons”', 'Minsky & Papert show the limits of single-layer nets; funding dries up.'],
    [1973, '❄️', 'Lighthill report', 'A damning UK review: the first AI winter begins.'],
    [1986, '🔁', 'Backpropagation', 'Rumelhart, Hinton & Williams popularise training multi-layer nets.'],
    [1989, '✉️', 'Convolutional nets', 'LeCun’s network reads hand-written zip codes.'],
    [1997, '♟️', 'Deep Blue beats Kasparov', 'Brute-force search, not learning, but a cultural shock. LSTM is published the same year.'],
    [2009, '🖼️', 'ImageNet', '14 million labelled images: the dataset that made deep learning measurable.'],
    [2012, '⚡', 'AlexNet', 'A GPU-trained deep net crushes ImageNet: 15.3% vs 26.2% error. The deep-learning era begins.'],
    [2016, '⚪', 'AlphaGo beats Lee Sedol', '4–1 at Go, a game with more positions than atoms in the universe.'],
    [2017, '🔤', 'The Transformer', '“Attention Is All You Need” (Google). The architecture behind every modern LLM.'],
    [2020, '🧬', 'GPT-3 & AlphaFold 2', '175B-parameter language model; protein structure prediction at near-experimental accuracy.'],
    [2022, '💬', 'ChatGPT', 'Chatbots go mainstream: 30 Nov 2022.'],
    [2023, '♊', 'Gemini 1.0', 'Natively multimodal from the start (6 Dec 2023).'],
    [2024, '🏅', 'Two Nobel prizes', 'Physics: Hopfield & Hinton. Chemistry: Baker; Hassabis & Jumper.'],
    [2025, '🥇', 'Thinking models', 'Models that reason before answering; Gemini Deep Think reaches IMO gold-medal standard.'],
    [2026, '🚀', 'Gemini 4 Argon', 'Sparse mixture-of-experts, 1M-token context, built for agents and science.']
  ];
  const HYPE = [[1940, 0.08], [1950, 0.2], [1958, 0.5], [1965, 0.62], [1969, 0.42], [1974, 0.14], [1980, 0.28], [1985, 0.62], [1988, 0.36], [1993, 0.13], [2000, 0.24], [2006, 0.3], [2012, 0.5], [2016, 0.66], [2020, 0.76], [2022, 0.92], [2024, 1.0], [2026.9, 1.08]];
  const WINTERS = [[1974, 1980, 'first AI winter'], [1987, 1993, 'second AI winter']];
  const ERAS = [[1943, 1973, 'symbolic AI & first neurons', C.muted], [1980, 1993, 'expert systems & backprop', C.muted], [1993, 2012, 'statistical machine learning', C.blue], [2012, 2017, 'deep learning', C.teal], [2017, 2022, 'transformers & scale', C.yellow], [2022, 2027, 'generative & agentic AI', C.orange]];
  function hypeAt(y) {
    for (let i = 0; i < HYPE.length - 1; i++) {
      const [x0, v0] = HYPE[i], [x1, v1] = HYPE[i + 1];
      if (y >= x0 && y <= x1) { const t = (y - x0) / (x1 - x0); return lerp(v0, v1, (1 - Math.cos(Math.PI * t)) / 2); }
    }
    return HYPE[HYPE.length - 1][1];
  }
  Deck.register('timeline', {
    init(slide) {
      const host = slide.querySelector('[data-role=tl]');
      const wrap = el('div', { class: 'canvas-wrap' }, host);
      this.cv = U.canvas(wrap, { onresize: () => this.draw() });
      this.tipper = U.tip(wrap);
      this.card = slide.querySelector('[data-role=card]');
      this.upto = 2026.9; this.shown = 2026.9; this.hover = null;
      this.cv.canvas.addEventListener('pointermove', e => this.onMove(this.cv.toLocal(e)));
      this.cv.canvas.addEventListener('pointerleave', () => { this.hover = null; this.tipper.hide(); this.draw(); });
      this.draw();
    },
    enter(slide) { if (slide._stepPos === 0) { cancelAnimationFrame(this._raf); this.shown = 1940; this.draw(); this.animTo(1945); } },
    onStep(a, vis, elx) {
      if (!a.startsWith('to:')) return;
      const steps = Array.from(elx.parentNode.querySelectorAll('[data-action^="to:"]'));
      const k = steps.indexOf(elx);
      const target = vis ? +a.slice(3) : (k > 0 ? +steps[k - 1].dataset.action.slice(3) : 1945);
      this.animTo(target);
    },
    animTo(y) {
      const y0 = this.shown; cancelAnimationFrame(this._raf); const t0 = performance.now(), dur = 1400;
      const tick = now => { const t = Math.min(1, (now - t0) / dur); this.shown = lerp(y0, y, U.ease(t)); this.draw(); if (t < 1) this._raf = requestAnimationFrame(tick); };
      this._raf = requestAnimationFrame(tick);
      const ms = MILESTONES.filter(m => m[0] <= y);
      if (this.card && ms.length) { const m = ms[ms.length - 1]; this.card.innerHTML = `<span style="font-size:40px">${m[1]}</span> <b>${m[0]} · ${m[2]}</b> — <span class="muted">${m[3]}</span>`; }
    },
    sx(y) { const { w } = this.cv, L = 70, Rr = w - 40, split = 2008, f = 0.52; return y <= split ? L + (Rr - L) * f * (y - 1940) / (split - 1940) : L + (Rr - L) * (f + (1 - f) * (y - split) / (2027 - split)); },
    sy(v) { const { h } = this.cv; return h - 120 - v * (h - 230); },
    draw() {
      const { ctx, w, h } = this.cv;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      // era bands
      ERAS.forEach(([a, b, name, col]) => { const X0 = this.sx(a), X1 = this.sx(Math.min(b, 2027)); ctx.fillStyle = U.rgba(col, 0.05); ctx.fillRect(X0, 30, X1 - X0, h - 150); U.text(ctx, name, (X0 + X1) / 2, h - 96, { size: 17, color: U.rgba(col === C.muted ? C.text : col, 0.75), align: 'center' }); });
      WINTERS.forEach(([a, b, name]) => { const X0 = this.sx(a), X1 = this.sx(b), cx = (X0 + X1) / 2; ctx.fillStyle = 'rgba(88,196,221,0.10)'; ctx.fillRect(X0, 30, X1 - X0, h - 150); const [w1, ...rest] = name.split(' '); U.text(ctx, '❄ ' + w1, cx, 54, { size: 17, color: C.blue, align: 'center' }); U.text(ctx, rest.join(' '), cx, 76, { size: 17, color: C.blue, align: 'center' }); });
      // axis
      ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(this.sx(1940), h - 120); ctx.lineTo(this.sx(2027), h - 120); ctx.stroke();
      [1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2015, 2020, 2025].forEach(y => { const X = this.sx(y); ctx.beginPath(); ctx.moveTo(X, h - 120); ctx.lineTo(X, h - 112); ctx.stroke(); U.text(ctx, String(y), X, h - 64, { size: 17, color: C.dim, align: 'center', family: FONT.mono }); });
      U.text(ctx, 'hype & funding ↑', this.sx(1941), 92, { size: 18, color: C.dim });
      // hype curve up to `shown`
      ctx.save(); ctx.strokeStyle = C.yellow; ctx.lineWidth = 4; ctx.shadowColor = C.yellow; ctx.shadowBlur = 10; ctx.beginPath();
      for (let y = 1940; y <= this.shown; y += 0.25) { const X = this.sx(y), Y = this.sy(hypeAt(y)); y === 1940 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
      ctx.stroke(); ctx.restore();
      // milestones
      this.dots = [];
      MILESTONES.forEach((m, i) => {
        if (m[0] > this.shown + 0.01) return;
        const X = this.sx(m[0] + 0.3), Y = this.sy(hypeAt(m[0] + 0.3)), up = i % 2 === 0, ly = Y + (up ? -46 : 52);
        ctx.strokeStyle = U.rgba(C.text, 0.25); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X, ly + (up ? 14 : -26)); ctx.stroke();
        U.circle(ctx, X, Y, this.hover === i ? 9 : 6.5, C.text, C.bg, 2);
        U.text(ctx, m[1], X, ly, { size: 28, align: 'center' });
        this.dots.push([X, Y, i, ly]);
      });
    },
    onMove(m) {
      let best = null, bd = 30;
      (this.dots || []).forEach(([X, Y, i, ly]) => { const d = Math.min(Math.hypot(m.x - X, m.y - Y), Math.hypot(m.x - X, m.y - ly)); if (d < bd) { bd = d; best = i; } });
      if (best !== this.hover) { this.hover = best; this.draw(); }
      if (best !== null) { const M = MILESTONES[best]; this.tipper.show(`<b>${M[1]} ${M[0]} · ${M[2]}</b><br><span class="muted">${M[3]}</span>`, m.x, m.y); } else this.tipper.hide();
    }
  });

  // ======================================================================
  // WHY NOW: training compute of notable models
  // ======================================================================
  Deck.register('whynow', {
    init(slide) {
      const D = U.data('compute');
      const host = slide.querySelector('[data-role=chart]');
      if (!D) { U.missing(host); return; }
      this.D = D; this.log = true; this.t = 1;
      const wrap = el('div', { class: 'canvas-wrap' }, host);
      this.cv = U.canvas(wrap, { onresize: () => this.draw() });
      this.tipper = U.tip(wrap);
      const ctl = slide.querySelector('[data-role=ctl]');
      this.scaleSeg = seg(ctl, [{ value: 'log', label: 'log scale' }, { value: 'lin', label: 'linear scale 😱' }], 'log', v => this.morph(v === 'log'));
      this.cv.canvas.addEventListener('pointermove', e => this.onMove(this.cv.toLocal(e)));
      this.cv.canvas.addEventListener('pointerleave', () => { this.tipper.hide(); });
      this.draw();
    },
    enter(slide) { if (this.D && slide._stepPos === 0 && this.scaleSeg.value !== 'log') this.scaleSeg.set('log'); },
    onStep(a, vis) { if (a === 'linear' && this.scaleSeg) this.scaleSeg.set(vis ? 'lin' : 'log'); },
    morph(toLog) { const from = this.t, to = toLog ? 1 : 0; this.log = toLog; if (this._tw) this._tw.cancel(); this._tw = U.tween(1.2, e => { this.t = lerp(from, to, e); this.draw(); }); },
    yOf(flop) {   // blend between log and linear placement
      const { h } = this.cv, top = 30, bot = h - 60;
      const ly = (Math.log10(flop) - 17) / (26 - 17), lin = flop / 4e25;
      return bot - (bot - top) * lerp(lin, ly, this.t);
    },
    xOf(year) { const { w } = this.cv; return 110 + (w - 150) * (year - 2011) / (2026 - 2011); },
    draw() {
      if (!this.D) return;
      const { ctx, w, h } = this.cv; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      const top = 30, bot = h - 60, left = 110, right = w - 30;
      // gridlines
      ctx.font = `17px ${FONT.sans}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      if (this.t > 0.5) for (let p = 17; p <= 26; p++) { const Y = this.yOf(Math.pow(10, p)); ctx.strokeStyle = C.gridMinor; ctx.beginPath(); ctx.moveTo(left, Y); ctx.lineTo(right, Y); ctx.stroke(); ctx.fillStyle = C.dim; ctx.fillText('10' + SUP(p), 100, Y); }
      else for (let k = 0; k <= 4; k++) { const Y = this.yOf(k * 1e25); ctx.strokeStyle = C.gridMinor; ctx.beginPath(); ctx.moveTo(left, Y); ctx.lineTo(right, Y); ctx.stroke(); ctx.fillStyle = C.dim; ctx.fillText(k ? `${k}×10²⁵` : '0', 100, Y); }
      ctx.textAlign = 'center';
      for (let y = 2012; y <= 2026; y += 2) { ctx.fillStyle = C.dim; ctx.fillText(String(y), this.xOf(y), h - 34); }
      U.text(ctx, 'training compute (FLOP)', left, 18, { size: 18, color: C.muted });
      // Epoch trend band: 4–5x per year, anchored on GPT-3 (clipped to the plot)
      if (this.t > 0.02) {
        ctx.save(); ctx.globalAlpha = this.t;
        ctx.beginPath(); ctx.rect(left, top - 10, right - left, bot - top + 10); ctx.clip();
        const y0 = 2020.4, f0 = 3.14e23;
        ctx.fillStyle = U.rgba(C.purple, 0.13); ctx.beginPath();
        for (let y = 2012; y <= 2026; y += 0.25) ctx.lineTo(this.xOf(y), this.yOf(f0 * Math.pow(4, y - y0)));
        for (let y = 2026; y >= 2012; y -= 0.25) ctx.lineTo(this.xOf(y), this.yOf(f0 * Math.pow(5, y - y0)));
        ctx.closePath(); ctx.fill();
        U.text(ctx, '×4–5 every year (Epoch AI)', this.xOf(2013.2), this.yOf(f0 * Math.pow(4.5, 2014.5 - y0)) - 30, { size: 20, color: C.purple });
        ctx.restore();
      }
      // points first, then labels placed greedily so none overlap or leave the canvas
      this.pts = [];
      const placed = [];
      this.D.models.forEach((m, i) => {
        const X = this.xOf(m.year + (i % 3) * 0.12), Y = this.yOf(m.flop), filled = m.method === 'reported';
        U.circle(ctx, X, Y, 9, filled ? C.yellow : C.bg, C.yellow, 2.5);
        this.pts.push([X, Y, m]);
        placed.push([X - 10, Y - 10, 20, 20]);
      });
      ctx.font = `17px ${FONT.sans}`;
      const overlap = (b, p) => Math.max(0, Math.min(b[0] + b[2], p[0] + p[2]) - Math.max(b[0], p[0])) * Math.max(0, Math.min(b[1] + b[3], p[1] + p[3]) - Math.max(b[1], p[1]));
      const cost = b => placed.reduce((s, p) => s + overlap(b, p), 0);
      this.pts.slice().sort((a, b) => b[2].flop - a[2].flop).forEach(([X, Y, m]) => {
        if (this.t < 0.5 && m.flop < 1e25) return;              // linear view: only label what rises off the floor
        const label = m.name.replace(' (big)', ''), tw = ctx.measureText(label).width, th = 20;
        const cands = [];
        [-26, 6, -46, 26, -66, 46].forEach(dy => { cands.push([X + 13, Y + dy]); cands.push([X - 13 - tw, Y + dy]); });
        const ok = cands.filter(([x, y]) => x > left && x + tw < w - 4 && y > 0 && y + th < bot + 20);
        let pos = ok.find(([x, y]) => cost([x, y, tw, th]) === 0);
        if (!pos) pos = ok.slice().sort((a, b) => cost([a[0], a[1], tw, th]) - cost([b[0], b[1], tw, th]))[0] || cands[0];
        placed.push([pos[0], pos[1], tw, th]);
        U.text(ctx, label, pos[0], pos[1] + 15, { size: 17, color: C.text });
      });
      U.text(ctx, '● reported   ○ estimated (6·N·D or GPU-time)', w - 30, h - 8, { size: 16, color: C.muted, align: 'right' });
    },
    onMove(m) {
      let best = null, bd = 18;
      (this.pts || []).forEach(([X, Y, d]) => { const dd = Math.hypot(m.x - X, m.y - Y); if (dd < bd) { bd = dd; best = d; } });
      if (best) this.tipper.show(`<b>${U.esc(best.name)}</b> (${best.year}, ${U.esc(best.org || '')})<br>${U.fmtSci(best.flop, 2)} FLOP · <span class="muted">${best.method}</span>${best.params ? `<br>${U.fmtBig(best.params)} parameters` : ''}${best.tokens ? ` · ${U.fmtBig(best.tokens)} tokens` : ''}`, m.x, m.y);
      else this.tipper.hide();
    }
  });

  // ======================================================================
  // STACK: the AI technology stack
  // ======================================================================
  const LAYERS = [
    { icon: '⚡', name: 'Energy & data centres', col: C.red, txt: 'Power, cooling, buildings. Training and serving frontier models takes data-centre scale electricity, measured in megawatts.', sci: 'Your lab’s share: GPU-hours on a cluster or cloud credits.' },
    { icon: '🔬', name: 'Chips', col: C.orange, txt: 'GPUs and Google’s TPUs: grids of multiply-add units (a “systolic array”) that pass numbers to their neighbours every clock tick. Gemini 2.5 trained on pods of <b>8,960 TPU v5p chips</b>.', sci: 'Matrix multiplication is the workload. Everything else is plumbing.', clip: 'assets/video/b04_chip.mp4' },
    { icon: '🧮', name: 'Systems software', col: C.yellow, txt: 'Compilers (XLA, CUDA) and frameworks (<b>JAX</b>, PyTorch, Keras) that split one model across thousands of chips. Gemini is trained with JAX + Pathways.', sci: 'The same JAX/PyTorch you can pip-install today.' },
    { icon: '🧠', name: 'Models', col: C.green, txt: 'Architectures (Transformers, mixture-of-experts) and their <b>weights</b>: billions of learned numbers. That pile of numbers <i>is</i> the model.', sci: 'Open-weight models like <b>Gemma</b> run on a laptop.' },
    { icon: '📚', name: 'Data & training', col: C.teal, txt: 'Pre-training on trillions of tokens of text, code, images, audio, video; then post-training (fine-tuning, human feedback, reinforcement learning) and safety evaluation.', sci: 'Fine-tune on your own data (e.g. LoRA) for a few dollars.' },
    { icon: '🚀', name: 'Serving', col: C.blue, txt: 'Inference at scale: batching thousands of users onto TPUs, caching, streaming tokens, safety filters, watermarking (SynthID).', sci: 'APIs: one HTTP call away (AI Studio, Vertex AI).' },
    { icon: '🧩', name: 'Apps & agents', col: C.purple, txt: 'Chat apps, coding agents (e.g. Antigravity), Deep Research, NotebookLM, robots, science tools — models that use tools and take actions.', sci: 'Agents that read papers, write analysis code and run experiments.' }
  ];
  Deck.register('stack', {
    init(slide) {
      const tower = slide.querySelector('[data-role=tower]'), det = slide.querySelector('[data-role=detail]');
      this.det = det; this.slideEl = slide;
      this.items = LAYERS.slice().reverse().map((L, ri) => {
        const i = LAYERS.length - 1 - ri;
        const d = el('div', { class: 'st-layer', html: `<span class="st-ic">${L.icon}</span><span class="st-name">${L.name}</span><span class="st-n">${i + 1}</span>` }, tower);
        d.style.setProperty('--c', L.col);
        d.addEventListener('mouseenter', () => this.pick(i)); d.addEventListener('click', () => this.pick(i));
        return d;
      }).reverse();
      this.cur = -1;
      this.pick(0);
    },
    enter(slide) { if (slide._stepPos === 0) this.pick(0); const v = this.det.querySelector('video'); if (v) v.play().catch(() => {}); },
    leave() { const v = this.det.querySelector('video'); if (v) v.pause(); },
    onStep(a, vis) { if (a.startsWith('layer:')) { const k = +a.slice(6); this.pick(vis ? k : Math.max(0, k - 1)); } },
    pick(i) {
      if (i === this.cur) return;
      this.cur = i;
      const L = LAYERS[i];
      this.items.forEach((d, k) => d.classList.toggle('on', k === i));
      const clip = L.clip ? `<video class="stack-clip" src="${L.clip}" poster="${L.clip.replace('/video/', '/poster/').replace('.mp4', '.jpg')}" muted loop playsinline autoplay onerror="this.remove()"></video>` : '';
      this.det.innerHTML = `<div style="font-size:72px">${L.icon}</div><h3 style="font-size:46px;font-weight:400;margin:6px 0 16px;color:${L.col}">${i + 1}. ${L.name}</h3><p style="font-size:32px">${L.txt}</p>${clip}<p class="callout green" style="font-size:28px">🔬 For scientists: ${L.sci}</p>`;
      const v = this.det.querySelector('video');
      if (v) { v.addEventListener('error', () => v.remove(), true); if (!Deck.isActive(this.slideEl)) v.pause(); }
    }
  });

  // ======================================================================
  // JOURNEY of "hi"
  // ======================================================================
  const STOPS = [
    ['📱', 'Your device', 'Keystrokes become Unicode, then bytes: <b class="mono">h → 0x68, i → 0x69</b>.'],
    ['🌐', 'The internet', 'DNS finds Google; <b>TLS 1.3</b> encrypts; packets ride fibre (maybe a subsea cable).'],
    ['🏢', 'Google front door', 'Load balancing, sign-in, abuse checks, then routing to a model server.'],
    ['🗂️', 'The Gemini app', 'Adds hidden instructions, chat history and tool definitions, then wraps it all in a <b>chat template</b>.'],
    ['🔤', 'Tokenizer', '<b class="mono">hi → #2202</b>. The full prompt becomes <b>10 tokens</b> (Gemma’s template).'],
    ['🧠', 'Transformer on TPUs', '10 vectors × 640 numbers flow through 18 layers of attention + MLP (Gemma 3 270M). Gemini: a sparse mixture-of-experts.'],
    ['🎲', 'Decoding', '<b>262,144</b> scores → softmax → <b class="c-yellow">“Hi” 93%</b> → pick → append → repeat, one token at a time.'],
    ['🛡️', 'Guardrails', 'Safety filters check the output; SynthID nudges word choices to leave an invisible watermark.'],
    ['💬', 'Back to you', 'Tokens stream back and render: <b class="c-yellow">“Hi there! How can I help you today?”</b>']
  ];
  Deck.register('journey', {
    init(slide) {
      this.cv = U.canvas(slide.querySelector('[data-role=line]'), { onresize: () => this.draw() });
      this.card = slide.querySelector('[data-role=card]');
      this.pos = 0; this.target = 0;
      this.cv.canvas.addEventListener('click', e => { const m = this.cv.toLocal(e); const k = this.stopAt(m); if (k >= 0) this.go(k); });
      this.draw(); this.showCard();
    },
    enter(slide) { if (slide._stepPos === 0) { this.pos = 0; this.target = 0; this.draw(); this.showCard(); } },
    onStep(a, vis, elx) { if (a.startsWith('stop:')) { const k = +a.slice(5); this.go(vis ? k : Math.max(0, k - 1)); } },
    pt(k) { const { w, h } = this.cv, n = STOPS.length; return [90 + (w - 180) * k / (n - 1), h * 0.55]; },
    stopAt(m) { for (let k = 0; k < STOPS.length; k++) { const [x, y] = this.pt(k); if (Math.hypot(m.x - x, m.y - y) < 54) return k; } return -1; },
    go(k) {
      this.target = k; const p0 = this.pos; cancelAnimationFrame(this._raf); const t0 = performance.now(), dur = 500 + 250 * Math.abs(k - p0);
      const tick = now => { const t = Math.min(1, (now - t0) / dur); this.pos = lerp(p0, k, U.ease(t)); this.draw(); if (t < 1) this._raf = requestAnimationFrame(tick); else this.showCard(); };
      this._raf = requestAnimationFrame(tick);
    },
    showCard() { const s = STOPS[Math.round(this.pos)]; if (this.card) this.card.innerHTML = `<span style="font-size:64px">${s[0]}</span><div><div class="kicker">stop ${Math.round(this.pos) + 1} of 9</div><b style="font-size:40px;font-weight:500">${s[1]}</b><p style="font-size:32px;margin-top:8px">${s[2]}</p></div>`; },
    draw() {
      const { ctx, w, h } = this.cv; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      const n = STOPS.length, [x0, y0] = this.pt(0), [x1] = this.pt(n - 1);
      ctx.strokeStyle = C.line; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
      const px = lerp(x0, x1, this.pos / (n - 1));
      const grad = ctx.createLinearGradient(x0, 0, x1, 0); grad.addColorStop(0, C.blue); grad.addColorStop(0.65, C.purple); grad.addColorStop(1, C.yellow);
      ctx.strokeStyle = grad; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(px, y0); ctx.stroke();
      STOPS.forEach((s, k) => {
        const [x, y] = this.pt(k), reached = k <= this.pos + 0.01, cur = Math.abs(k - this.pos) < 0.5;
        ctx.save(); if (cur) { ctx.shadowColor = C.text; ctx.shadowBlur = 16; }
        U.circle(ctx, x, y, cur ? 48 : 40, reached ? '#1b2029' : C.bg, reached ? C.text : C.line, cur ? 4 : 2.5); ctx.restore();
        U.text(ctx, s[0], x, y + 14, { size: 40, align: 'center', alpha: reached ? 1 : 0.4 });
        U.text(ctx, s[1], x, y + (k % 2 ? 94 : -66), { size: 24, color: reached ? C.text : C.dim, align: 'center' });
      });
      // the travelling message (above the upper label row)
      const back = this.pos > 6.5, label = back ? 'Hi there!' : this.pos > 4.5 && this.pos <= 6.5 ? '[2202]' : '“hi”';
      const bw = 170, bh = 56, by = y0 - 168;
      ctx.save(); ctx.shadowColor = back ? C.yellow : C.blue; ctx.shadowBlur = 22;
      U.roundRect(ctx, px - bw / 2, by, bw, bh, 28); ctx.fillStyle = back ? U.rgba(C.yellow, 0.2) : U.rgba(C.blue, 0.2); ctx.fill(); ctx.strokeStyle = back ? C.yellow : C.blue; ctx.lineWidth = 2.5; ctx.stroke(); ctx.restore();
      U.text(ctx, label, px, by + 38, { size: 28, color: C.text, align: 'center', family: FONT.mono });
    }
  });

  document.head.appendChild(Object.assign(document.createElement('style'), {
    textContent: `
    .st-layer{display:flex;align-items:center;gap:18px;padding:14px 22px;margin:8px 0;border-radius:14px;border:1px solid var(--line);background:rgba(255,255,255,.02);cursor:pointer;transition:transform .2s,border-color .2s,background .2s;font-size:30px}
    .st-layer .st-ic{font-size:36px} .st-layer .st-name{flex:1} .st-layer .st-n{font-family:var(--mono);color:var(--dim);font-size:22px}
    .st-layer.on{border-color:var(--c);background:color-mix(in srgb, var(--c) 14%, transparent);transform:translateX(18px)}
    `
  }));
})();
