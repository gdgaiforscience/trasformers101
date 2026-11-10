/* =====================================================================
   Chapter 4 demo: how GPUs & TPUs run a layer   (slide `chips`)
   The same layer as the `layer` slide (W is 4×3), run on a batch of 4 tokens:
   - CPU: 4 big cores, one multiply-add per core per tick, both numbers fetched from memory each time
   - GPU: one simple core per output (16), all at once, but every core still fetches its own numbers
   - TPU: weight-stationary systolic array: weights load once and stay put, inputs flow down,
          running sums flow right, finished results drop out on the right (no memory trips mid-calculation)
   Then a "powers of ten" zoom-out: 128×128 matrix unit → TPU v5p chip → pod.
   Everything is drawn as a pure function of the clock τ (in ticks), so pause / step / replay are free.
   Palette: Google light palette. Text stays WCAG AA: #202124 / #174EA6 / #0D652D / #A50E0E / #5F6368
   on white or the light tints; yellow, blue, green and red are only used as fills, strokes and glows.
   ===================================================================== */
(function () {
  'use strict';
  const { FONT, el, btn, seg, slider, fmtMinus, clamp, lerp, ease, smoothstep } = U;

  const G = {
    blue: '#4285F4', red: '#EA4335', yellow: '#FBBC04', green: '#34A853', black: '#202124', grey: '#9AA0A6',
    lgrey: '#F1F3F4', tBlue: '#174EA6', tRed: '#A50E0E', orange: '#E37400', tGreen: '#0D652D',
    lBlue: '#D2E3FC', lRed: '#FAD2CF', lYellow: '#FEEFC3', lGreen: '#CEEAD6', white: '#FFFFFF',
    line: '#DADCE0', muted: '#5F6368', bg: '#F8F9FA', faint: '#ECEEF1'
  };

  // Same weights as the `layer` slide and the m02 clip. Token 1 is that slide's input x,
  // so the first result is 1.22 again (1.2×0.9 − 0.8×0.2 + 0.5×0.6).
  const W = [[1.2, -0.8, 0.5], [-0.4, 0.9, 0.7], [0.3, 1.1, -1.0], [-0.9, 0.2, 0.6]];
  const X = [[0.9, 0.2, 0.6], [0.1, 0.8, 0.3], [0.5, 0.5, 0.9], [0.7, 0.0, 0.2]];
  const M = 4, N = 4, K = 3;                       // tokens, neurons (outputs), inputs
  const MACS = M * N * K;                          // 48 multiply-adds
  const Yv = X.map(x => W.map(w => w[0] * x[0] + w[1] * x[1] + w[2] * x[2]));
  const TICK_S = 0.62;                             // seconds per tick at 1× speed

  // ---------------------------------------------------------------- layout (design units, 1080 × 680)
  const DW = 1080, DH = 680;
  const MEM = { x: 8, y: 56, w: 244, h: 562 }, PROC = { x: 268, y: 56, w: 528, h: 562 }, RES = { x: 812, y: 56, w: 260, h: 562 };
  const CW = 60, YCW = 54, CH = 36, GAP = 5;
  const XT = { x: 50, y: 142 }, WT = { x: 50, y: 352 }, YT = { x: 836, y: 142 };
  const cellXY = (T, r, c, cw) => { cw = cw || CW; return { x: T.x + c * (cw + GAP) + cw / 2, y: T.y + r * (CH + GAP) + CH / 2 }; };
  const DIE = { x: 296, y: 112, w: 472, h: 480 }, TDIE = { x: 296, y: 96, w: 472, h: 516 };
  const CPU_CORES = [0, 1, 2, 3].map(c => ({ x: 316 + (c % 2) * 222, y: 132 + Math.floor(c / 2) * 186, w: 210, h: 172 }));
  const GPU_CORE = (i, j) => ({ x: 316 + j * 110, y: 132 + i * 96, w: 100, h: 86 });
  const TP = { x0: 384, y0: 178, cell: 96, pitch: 106 };
  const colL = k => TP.x0 + k * TP.pitch, rowT = j => TP.y0 + j * TP.pitch;
  const colC = k => colL(k) + TP.cell / 2, rowC = j => rowT(j) + TP.cell / 2;
  const XLANE = 22, SLANE = 76;                    // inputs run down the left edge of a column, sums along the bottom of a row

  // zoom levels: home rectangles, and where each level sits inside the next one (normalised)
  const TOY = { x: TP.x0, y: TP.y0, w: K * TP.pitch, h: N * TP.pitch };
  const H1 = { x: 280, y: 96, w: 520, h: 520 }, H2 = { x: 50, y: 96, w: 980, h: 560 }, H3 = { x: 20, y: 72, w: 1040, h: 594 };
  const E01 = { x: 62 / 128, y: 62 / 128, w: K / 128, h: N / 128 };              // our 12 cells, in the middle of the MXU
  const E12 = { x: 190 / 980, y: 64 / 560, w: 130 / 980, h: 130 / 560 };         // that MXU, top-left of TensorCore 1
  const POD = { cols: 21, rows: 21, cx: 10, cy: 10 }, PPX = 1040 / POD.cols, PPY = 594 / POD.rows, PW = 42, PH = 24;
  const E23 = { x: (POD.cx * PPX + (PPX - PW) / 2) / 1040, y: (POD.cy * PPY + (PPY - PH) / 2) / 594, w: PW / 1040, h: PH / 594 };
  const ZCAP = [null,
    'One matrix unit (MXU): 128 × 128 cells = 16,384 multiply-adds every tick',
    'One TPU v5p chip: 2 TensorCores × 4 matrix units, fed by 95 GB of HBM memory',
    'One pod: 8,960 chips (v5p) or 9,216 (Ironwood), wired into one computer'];

  // ---------------------------------------------------------------- timelines (times in ticks)
  // fetch = a trip to memory (particle from a memory cell to a core / the array), write = a result flying to RESULTS.
  // A multiply-add "happens" at its moment m; for every mode m = tick + 0.5.
  function mkTimeline(kind) {
    const tl = { kind, macs: [], fetch: [], write: [], land: [[], [], [], []] };
    const xSrc = (i, k) => cellXY(XT, i, k), wSrc = (j, k) => cellXY(WT, j, k), yDst = (i, j) => cellXY(YT, i, j, YCW);
    if (kind === 'cpu') {                                   // core c owns token c; neurons one after another
      for (let c = 0; c < M; c++) {
        const R = CPU_CORES[c];
        for (let j = 0; j < N; j++) for (let k = 0; k < K; k++) {
          const t = j * K + k;
          tl.macs.push({ m: t + 0.5 });
          tl.fetch.push({ t0: t + 0.04, t1: t + 0.46, a: xSrc(c, k), b: { x: R.x + 58, y: R.y + 80 }, col: 'x', src: ['X', c, k] });
          tl.fetch.push({ t0: t + 0.08, t1: t + 0.5, a: wSrc(j, k), b: { x: R.x + 152, y: R.y + 80 }, col: 'w', src: ['W', j, k] });
        }
        for (let j = 0; j < N; j++) { const t = j * K + K - 1; tl.write.push({ t0: t + 0.62, t1: t + 1.08, a: { x: R.x + 105, y: R.y + 128 }, b: yDst(c, j), i: c, j }); }
      }
      tl.T = N * K; tl.start = -0.4; tl.end = tl.T + 0.4;
    } else if (kind === 'gpu') {                            // one core per output, all at once
      for (let i = 0; i < M; i++) for (let j = 0; j < N; j++) {
        const R = GPU_CORE(i, j), cc = { x: R.x + R.w / 2, y: R.y + R.h / 2 };
        for (let k = 0; k < K; k++) {
          tl.macs.push({ m: k + 0.5 });
          tl.fetch.push({ t0: k + 0.04, t1: k + 0.46, a: xSrc(i, k), b: cc, col: 'x', src: ['X', i, k] });
          tl.fetch.push({ t0: k + 0.08, t1: k + 0.5, a: wSrc(j, k), b: cc, col: 'w', src: ['W', j, k] });
        }
        tl.write.push({ t0: K - 1 + 0.62, t1: K - 1 + 1.08, a: cc, b: yDst(i, j), i, j });
      }
      tl.T = K; tl.start = -0.4; tl.end = tl.T + 0.5;
    } else {                                                // TPU: weight-stationary systolic array
      tl.loadT = [[], [], [], []];
      for (let j = 0; j < N; j++) for (let k = 0; k < K; k++) {
        const t0 = -3.2 + (j * K + k) * 0.16;
        tl.fetch.push({ t0, t1: t0 + 0.9, a: wSrc(j, k), b: { x: colC(k), y: rowC(j) }, col: 'w', src: ['W', j, k] });
        tl.loadT[j][k] = t0 + 0.9;
      }
      // input x[i][k] lands just above column k at τ = i + k − 0.5, then moves down one row per tick;
      // cell (j, k) multiplies it at τ = i + j + k + 0.5, exactly when token i's running sum for neuron j arrives
      for (let i = 0; i < M; i++) for (let k = 0; k < K; k++) {
        const t1 = i + k - 0.5;
        tl.fetch.push({ t0: t1 - 0.9, t1, a: xSrc(i, k), b: { x: colL(k) + XLANE, y: rowC(-1) - 8 }, col: 'x', src: ['X', i, k] });
      }
      for (let i = 0; i < M; i++) for (let j = 0; j < N; j++) {
        for (let k = 0; k < K; k++) tl.macs.push({ m: i + j + k + 0.5 });
        const t0 = i + j + K;
        tl.write.push({ t0, t1: t0 + 0.85, a: { x: colL(K) - 5, y: rowT(j) + SLANE }, b: yDst(i, j), i, j });
      }
      tl.T = M + N + K - 2; tl.start = -3.5; tl.end = (M - 1) + (N - 1) + K + 0.85 + 0.35;
    }
    tl.write.forEach(wr => { tl.land[wr.i][wr.j] = wr.t1; });
    tl.nFetch = tl.fetch.length;
    return tl;
  }

  // ---------------------------------------------------------------- drawing helpers
  function rr(ctx, x, y, w, h, r, fill, stroke, lw) {
    U.roundRect(ctx, x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
  }
  function txt(ctx, s, x, y, size, color, align, family, weight) {
    ctx.font = `${weight || 400} ${size}px ${family || FONT.sans}`;
    ctx.fillStyle = color; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(s, x, y);
  }
  // text that scales with the zoom: hidden when too small to read or too big to be useful
  function ztxt(ctx, s, x, y, size, color, align, weight, backing) {
    if (size < 7 || size > 110) return;
    const a = smoothstep(7, 10, size) * (1 - smoothstep(70, 110, size));
    ctx.save(); ctx.globalAlpha *= a;
    if (backing) {
      ctx.font = `${weight || 400} ${size}px ${FONT.sans}`;
      const tw = ctx.measureText(s).width, bx = align === 'center' ? x - tw / 2 : x;
      rr(ctx, bx - size * 0.3, y - size * 0.62, tw + size * 0.6, size * 1.24, size * 0.3, 'rgba(255,255,255,0.88)');
    }
    txt(ctx, s, x, y, size, color, align, FONT.sans, weight);
    ctx.restore();
  }
  const CHIP = { x: [G.lBlue, G.blue, G.tBlue], w: [G.lYellow, G.yellow, G.black], s: [G.lGreen, G.green, G.tGreen] };
  function chip(ctx, cx, cy, label, kind, alpha, wdt) {   // a number in flight: x (blue), w (yellow), running sum s (green)
    if (alpha <= 0.01) return;
    const S = CHIP[kind], w = wdt || Math.max(46, 10 * label.length + 12), h = 26;
    ctx.save(); ctx.globalAlpha *= alpha;
    rr(ctx, cx - w / 2, cy - h / 2, w, h, 8, S[0], S[1], 1.6);
    txt(ctx, label, cx, cy + 1, 16, S[2], 'center', FONT.mono);
    ctx.restore();
  }
  function cell(ctx, cx, cy, w, h, fill, stroke, label, color, size) {
    rr(ctx, cx - w / 2, cy - h / 2, w, h, 8, fill, stroke, 1.4);
    if (label != null) txt(ctx, label, cx, cy + 1, size || 17, color, 'center', FONT.mono);
  }
  function panel(ctx, R, title, sub) {
    ctx.save(); ctx.shadowColor = 'rgba(60,64,67,0.10)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 2;
    rr(ctx, R.x, R.y, R.w, R.h, 16, G.white); ctx.restore();
    rr(ctx, R.x, R.y, R.w, R.h, 16, null, G.line, 1);
    if (title) txt(ctx, title, R.x + 20, R.y + 24, 15, G.muted, 'left', FONT.sans, 500);
    if (sub) txt(ctx, sub, R.x + 20, R.y + 44, 14, G.muted);
  }
  function die(ctx, R, pins) {                        // a silicon die with little pins around the edge
    if (pins) {
      ctx.fillStyle = '#E3E5E8';
      for (let x = R.x + 22; x < R.x + R.w - 18; x += 22) { ctx.fillRect(x, R.y - 9, 8, 9); ctx.fillRect(x, R.y + R.h, 8, 9); }
      for (let y = R.y + 22; y < R.y + R.h - 18; y += 22) { ctx.fillRect(R.x - 9, y, 9, 8); ctx.fillRect(R.x + R.w, y, 9, 8); }
    }
    rr(ctx, R.x, R.y, R.w, R.h, 16, G.white, G.grey, 2);
  }
  function arcPt(a, b, u) {                           // a gentle arc between two points
    const cx = (a.x + b.x) / 2, cy = Math.max(40, Math.min(a.y, b.y) - 36 - Math.abs(b.x - a.x) * 0.1), v = 1 - u;
    return { x: v * v * a.x + 2 * v * u * cx + u * u * b.x, y: v * v * a.y + 2 * v * u * cy + u * u * b.y };
  }
  function particle(ctx, f, tau, fill, edge) {
    const u = clamp((tau - f.t0) / (f.t1 - f.t0), 0, 1), e = ease(u), fade = 1 - smoothstep(0.8, 1, u);
    if (fade <= 0.01) return;                         // it has landed: the chip / cell takes over
    ctx.save();
    for (let s = 3; s >= 1; s--) {                    // fading trail
      const p = arcPt(f.a, f.b, Math.max(0, e - s * 0.05));
      ctx.globalAlpha = 0.16 * (4 - s) * fade;
      U.circle(ctx, p.x, p.y, 5.5 - s, fill);
    }
    const p = arcPt(f.a, f.b, e);
    ctx.globalAlpha = fade; ctx.shadowColor = fill; ctx.shadowBlur = 8;
    U.circle(ctx, p.x, p.y, 6.5, fill, edge, 1.6);
    ctx.restore();
  }
  function zoomFrame(Hfrom, E, Hto, t) {
    // frame of the outer level: at t = 0 its sub-rectangle E sits exactly on Hfrom, at t = 1 it is at home (Hto).
    // Exponential zoom about the fixed point of the similarity, so the motion feels like one smooth camera move.
    const F0w = Hfrom.w / E.w, F0h = Hfrom.h / E.h, F0x = Hfrom.x - E.x * F0w, F0y = Hfrom.y - E.y * F0h;
    const r = Hto.w / F0w, px = (Hto.x - r * F0x) / (1 - r), py = (Hto.y - r * F0y) / (1 - r), s = Math.pow(r, t);
    return { x: px + (F0x - px) * s, y: py + (F0y - py) * s, w: F0w * s, h: F0h * s };
  }
  const inner = (F, E) => ({ x: F.x + E.x * F.w, y: F.y + E.y * F.h, w: E.w * F.w, h: E.h * F.h });
  const offscreen = R => R.x > DW || R.y > DH || R.x + R.w < 0 || R.y + R.h < 0;
  // the "heartbeat" colour of a busy cell: ph = how many cells behind the wave front it is.
  // A blue front (data arriving) on the idle light yellow, then a warm yellow glow that starts just behind it.
  const RGB = { base: U.hexToRgb(G.lYellow), mid: U.hexToRgb(G.yellow), light: U.hexToRgb(G.lBlue), front: U.hexToRgb(G.blue) };
  function waveRGB(ph, out) {
    const fr = Math.exp(-ph * ph / 0.7), tail = smoothstep(0.5, 1.8, ph) * Math.exp(-Math.max(0, ph - 1.8) / 8) * 0.9;
    for (let q = 0; q < 3; q++) {
      const m1 = RGB.base[q] + (RGB.mid[q] - RGB.base[q]) * tail;          // warm glow behind the front
      out[q] = fr <= 0.5 ? m1 + (RGB.light[q] - m1) * (fr / 0.5)          // light blue, then full blue at the front
        : RGB.light[q] + (RGB.front[q] - RGB.light[q]) * ((fr - 0.5) / 0.5);
    }
    return out;
  }

  // ---------------------------------------------------------------- right-hand cards
  const CARDS = {
    intro: `<div class="kicker">The job</div><h3>One multiply-add, millions of times</h3>
      <p>Every token meets every weight once: multiply, then add to a running sum.</p>
      <p>This little layer, for 4 tokens: 4 × 4 × 3 = <b>48</b> multiply-adds. Gemma 3 270M: about <b>268 million</b> for every token.</p>
      <p>Two things decide which chip wins: how many it can do <b>per tick</b>, and how many numbers it has to <b class="cg-red">fetch from memory</b>.</p>`,
    cpu: `<div class="kicker">CPU · central processing unit</div><h3>A few brilliant generalists</h3>
      <ul class="clean tight">
        <li>8–16 big cores in a laptop, a few hundred in a server. Runs anything: your OS, browser, spreadsheets.</li>
        <li>Every multiply-add means two trips to memory to fetch its numbers.</li>
        <li>Here: 4 cores, 4 results at a time → <b>12 ticks</b>.</li></ul>`,
    gpu: `<div class="kicker">GPU · graphics processing unit</div><h3>Thousands of simple workers</h3>
      <ul class="clean tight">
        <li>Built to colour millions of pixels at once. Every output number is independent too, so each gets its own core → <b>3 ticks</b>.</li>
        <li>NVIDIA H100: <b>16,896</b> cores + 528 Tensor Cores (mini matrix engines). AlexNet (2012) learned on two gaming GPUs.</li>
        <li>But each core still fetches its own numbers: <b class="cg-red">96 trips</b>.</li></ul>`,
    tpu: `<div class="kicker">TPU · tensor processing unit · Google, 2015</div><h3>A grid where the numbers flow</h3>
      <ul class="clean tight">
        <li>Weights load once and <b>stay put</b>. Inputs flow down, sums flow right, handed to the neighbour every tick like a heartbeat: a <i>systolic array</i>.</li>
        <li>Each input is fetched once and used by a whole column: <b class="cg-green">24 trips, not 96</b>.</li>
        <li>The first results take a few ticks to arrive; then one drops out every tick.</li></ul>`,
    energy: `<div class="kicker">Why the trips matter</div><h3>Moving data costs more than maths</h3>
      <div class="cb">
        <div><div class="cb-lbl">multiply two numbers</div><div class="cb-line"><span class="cb-track"><i class="cb-bar" data-w="0.58"></i></span><span class="cb-val">3.7 pJ</span></div></div>
        <div><div class="cb-lbl">fetch one from on-chip memory</div><div class="cb-line"><span class="cb-track"><i class="cb-bar" data-w="0.78"></i></span><span class="cb-val">5 pJ</span></div></div>
        <div><div class="cb-lbl">fetch one from off-chip memory</div><div class="cb-line"><span class="cb-track"><i class="cb-bar red" data-w="100"></i></span><span class="cb-val">640 pJ</span></div></div>
      </div>
      <p>One trip off the chip burns the energy of <b>~170 multiplications</b>. Keep numbers on the chip and reuse them, exactly what the systolic array does. Smaller numbers (16- and 8-bit) help too.</p>
      <span class="tag">45 nm chip figures · Horowitz, ISSCC 2014</span>`,
    zoom: `<div class="kicker">Now scale it up</div><h3>From 12 cells to a supercomputer</h3>
      <ol class="cz">
        <li data-lv="1"><b>One matrix unit (MXU)</b>: 128 × 128 cells → 16,384 multiply-adds per tick, ≈ 1.75 billion ticks a second</li>
        <li data-lv="2"><b>One TPU v5p chip</b>: 8 matrix units + 95 GB of HBM → 459 trillion operations a second</li>
        <li data-lv="3"><b>One pod</b>: 8,960 chips (v5p, which trained Gemini 2.5) · 9,216 chips (Ironwood, 2025)</li>
      </ol>`
  };
  const TITLES = { intro: 'Who should do the multiply-adds?', cpu: 'CPU · 4 big cores', gpu: 'GPU · 16 simple cores', tpu: 'TPU · a 4 × 3 systolic array' };
  const NAMES = { cpu: ['CPU', '4 cores'], gpu: ['GPU', '16 cores'], tpu: ['TPU', '4×3 grid'] };

  Deck.register('chips', {
    init(slide) {
      this.TL = { cpu: mkTimeline('cpu'), gpu: mkTimeline('gpu'), tpu: mkTimeline('tpu') };
      this.cv = U.canvas(slide.querySelector('[data-role=stage]'), { onresize: () => this.draw() });
      this.cardEl = slide.querySelector('[data-role=card]');
      this.scoreEl = slide.querySelector('[data-role=score]');
      const ctl = slide.querySelector('[data-role=ctl]');
      el('span', { class: 'lbl', text: 'run it on' }, ctl);
      this.segApi = seg(ctl, [{ value: 'cpu', label: 'CPU' }, { value: 'gpu', label: 'GPU' }, { value: 'tpu', label: 'TPU' }], '', v => {
        this.zoomStop(); this.setMode(v, false); this.showCard(v);
      });
      this.playBtn = btn(ctl, '⏸ pause', () => this.togglePlay());
      btn(ctl, 'step ▸', () => this.stepOnce());
      btn(ctl, '↻ replay', () => { if (this.tl) { this.zoomStop(); this.setMode(this.mode, false); this.showCard(this.mode); } });
      slider(ctl, { label: 'speed', min: 0.25, max: 2, step: 0.25, value: 1, width: 130, fmt: v => v + '×', oninput: v => { this.speed = v; } });
      this.mx = document.createElement('canvas'); this.mx.width = this.mx.height = 128;
      this.mxc = this.mx.getContext('2d'); this.mxd = this.mxc.createImageData(128, 128);
      this.rgb = [0, 0, 0];
      this.time = 0; this.speed = 1; this.z = 0; this.zoomOn = false; this.results = {};
      this.loop = U.animator(dt => this.tick(dt));
      this.applyStage(0, false);
      this.draw();
    },
    enter(slide) { if (slide._stepPos === 0) this.applyStage(0, false); this.loop.start(); },
    leave() { this.loop.stop(); },
    onStep(a, vis, elx) {
      // steps: mode:cpu, mode:gpu, mode:tpu, energy, zoom. Forward steps animate; going back shows finished states.
      const slide = elx.closest('.slide');
      const n = slide._steps.filter(s => s.classList.contains('visible')).length;
      this.applyStage(n, vis && slide.classList.contains('active'));
    },

    // ------------------------------------------------------------ state
    applyStage(n, animate) {
      const order = ['cpu', 'gpu', 'tpu'];
      if (animate) this.loop.start();                 // no-op if it is already running
      if (n === 0) { this.zoomStop(); this.results = {}; this.setMode('intro', false); this.showCard('intro'); return; }
      const m = Math.min(n, 3);
      order.forEach((q, idx) => { if (idx < m - 1) this.complete(q); else if (idx > m - 1) delete this.results[q]; });
      if (n <= 3) { this.zoomStop(); this.setMode(order[n - 1], !animate); this.showCard(order[n - 1]); return; }
      const keepRunning = animate && n === 4 && this.mode === 'tpu' && this.playing;
      if (!keepRunning) this.setMode('tpu', true);
      if (n === 4) { this.zoomStop(); this.showCard('energy'); }
      else { this.showCard('zoom'); if (animate) this.zoomStart(); else this.zoomSet(3); }
    },
    setMode(mode, atEnd) {
      this.mode = mode; this.tl = mode === 'intro' ? null : this.TL[mode]; this.stepTo = null;
      if (this.tl) { this.tau = atEnd ? this.tl.end : this.tl.start; this.playing = !atEnd; if (atEnd) this.complete(mode); }
      else { this.tau = 0; this.playing = false; }
      this.fade = atEnd ? 1 : 0;
      if (this.segApi) this.segApi.set(mode === 'intro' ? '' : mode, true);
      this.updatePlayBtn();
    },
    complete(q) { const tl = this.TL[q]; this.results[q] = { ticks: tl.T, fetched: tl.nFetch }; },
    togglePlay() {
      if (!this.tl) return;
      if (this.tau >= this.tl.end) { this.setMode(this.mode, false); return; }
      this.playing = !this.playing; this.stepTo = null; this.updatePlayBtn();
    },
    stepOnce() {
      if (!this.tl) return;
      if (this.tau >= this.tl.end) this.tau = this.tl.start;
      this.stepTo = Math.min(this.tl.end, Math.floor(this.tau + 1e-6) + 1);
      this.playing = true; this.updatePlayBtn();
    },
    updatePlayBtn() { if (this.playBtn) this.playBtn.innerHTML = this.playing && this.stepTo == null ? '⏸ pause' : '▶ play'; },
    zoomStart() { this.zoomOn = true; this.zoomE = 0; this.z = 0; },
    zoomSet(z) { this.zoomOn = false; this.z = z; this.updateZoomCard(); },
    zoomStop() { this.zoomOn = false; this.z = 0; },
    zAt(e) {                                          // 0→1, hold, 1→2, hold, 2→3 (eased per level when drawn)
      const S = [[3.0, 0, 1], [1.7, 1, 1], [2.4, 1, 2], [1.7, 2, 2], [2.6, 2, 3]];
      for (const [d, a, b] of S) { if (e < d) return lerp(a, b, e / d); e -= d; }
      return 3;
    },
    tick(dt) {
      this.time += dt;
      if (this.playing && this.tl) {
        this.tau += dt * this.speed / TICK_S;
        if (this.stepTo != null && this.tau >= this.stepTo) { this.tau = this.stepTo; this.stepTo = null; this.playing = false; this.updatePlayBtn(); }
        if (this.tau >= this.tl.end) { this.tau = this.tl.end; this.playing = false; this.complete(this.mode); this.updatePlayBtn(); }
      }
      if (this.fade < 1) this.fade = Math.min(1, this.fade + dt / 0.35);
      if (this.zoomOn) { this.zoomE += dt; this.z = this.zAt(this.zoomE); if (this.z >= 3) this.zoomOn = false; this.updateZoomCard(); }
      this.draw();
      this.updateScore();
    },

    // ------------------------------------------------------------ HTML side panel
    showCard(kind) {
      if (this._card === kind) return;
      this._card = kind; this._lv = -1;
      const c = this.cardEl;
      c.innerHTML = CARDS[kind];
      c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
      if (kind === 'energy') requestAnimationFrame(() => requestAnimationFrame(() => c.querySelectorAll('.cb-bar').forEach(b => { b.style.width = b.dataset.w + '%'; })));
      if (kind === 'zoom') this.updateZoomCard();
    },
    updateZoomCard() {
      const lis = this.cardEl.querySelectorAll('.cz li');
      if (!lis.length) return;
      const lv = this.z < 0.5 ? 0 : Math.min(3, Math.round(this.z));
      if (lv === this._lv) return;
      this._lv = lv;
      lis.forEach(li => { const v = +li.dataset.lv; li.classList.toggle('on', v === lv); li.classList.toggle('seen', v < lv); });
    },
    liveStats() {
      const tl = this.tl, tau = this.tau;
      return { ticks: tau < 0 ? 0 : Math.min(tl.T, Math.ceil(tau - 1e-6)), fetched: tl.fetch.reduce((n, f) => n + (f.t0 <= tau ? 1 : 0), 0) };
    },
    updateScore() {
      const rows = ['cpu', 'gpu', 'tpu'].map(q => ({ q, v: this.tl && this.mode === q ? this.liveStats() : (this.results[q] || null) }));
      const sig = this.mode + JSON.stringify(rows);
      if (sig === this._sig) return;
      this._sig = sig;
      let html = `<div class="cs-title">Scoreboard <span>· the same 48 multiply-adds</span></div><div class="cs-grid">
        <div class="cs-h"></div><div class="cs-h">ticks</div><div class="cs-h">numbers fetched from memory</div>`;
      rows.forEach(({ q, v }) => {
        const on = this.mode === q ? ' on' : '';
        html += `<div class="cs-name${on}"><b>${NAMES[q][0]}</b><span>${NAMES[q][1]}</span></div>`;
        html += `<div class="cs-t${on}">${v ? v.ticks : '—'}</div>`;
        html += `<div class="cs-f${on}"><span class="cs-bar">${v ? `<i style="width:${(100 * v.fetched / 96).toFixed(1)}%"></i>` : ''}</span><b>${v ? v.fetched : '—'}</b></div>`;
      });
      this.scoreEl.innerHTML = html + '</div>';
    },

    // ------------------------------------------------------------ canvas
    draw() {
      if (!this.cv) return;
      const { ctx, w, h } = this.cv;
      ctx.save();
      ctx.fillStyle = G.bg; ctx.fillRect(0, 0, w, h);
      const s = Math.min(w / DW, h / DH);
      ctx.translate((w - DW * s) / 2, (h - DH * s) / 2); ctx.scale(s, s);
      if (this.z > 1e-4) this.drawZoom(ctx);
      else { this.drawScene(ctx); this.drawCaption(ctx, this.caption(), 1); }
      ctx.restore();
    },
    drawScene(ctx) {
      const tl = this.tl, tau = this.tau;
      this.drawMemory(ctx, tau, tl);
      this.drawResults(ctx, tau, tl);
      this.drawProcessor(ctx, tau, tl);
      if (tl) {
        for (const f of tl.fetch) if (tau >= f.t0 && tau <= f.t1) particle(ctx, f, tau, f.col === 'x' ? G.blue : G.yellow, f.col === 'x' ? G.white : G.orange);
        for (const f of tl.write) if (tau >= f.t0 && tau <= f.t1) particle(ctx, f, tau, G.green, G.white);
      }
    },
    caption() {
      const tl = this.tl, tau = this.tau;
      if (!tl) return 'One multiply-add: the atom of every AI chip';
      const done = tau >= tl.end - 1e-6;
      if (tl.kind === 'cpu') return done ? `CPU done: ${tl.T} ticks, ${tl.nFetch} numbers fetched from memory` : 'Each core: fetch x, fetch w, multiply, add… then the next one';
      if (tl.kind === 'gpu') return done ? `GPU done: ${tl.T} ticks, but still ${tl.nFetch} numbers fetched` : 'Every output gets its own core: all 16 at once';
      if (done) return `TPU done: every number fetched once, ${tl.nFetch} trips instead of 96`;
      if (tau < -0.2) return '① Load the weights once. They stay put';
      if (tau < K) return '② Inputs flow down ↓ · running sums flow right →';
      return '③ A finished result drops out on the right every tick';
    },
    drawCaption(ctx, s, alpha) {
      if (!s || alpha <= 0.01) return;
      ctx.save(); ctx.globalAlpha = alpha;
      U.circle(ctx, 20, 27, 7, G.yellow);
      txt(ctx, s, 36, 28, 22, G.black, 'left', FONT.sans, 500);
      ctx.restore();
    },

    drawMemory(ctx, tau, tl) {
      panel(ctx, MEM, 'MEMORY', 'off the chip (DRAM / HBM)');
      txt(ctx, 'inputs x · 4 tokens', XT.x, XT.y - 18, 15, G.muted);
      txt(ctx, 'weights W · 4 × 3', WT.x, WT.y - 18, 15, G.muted);
      for (let i = 0; i < M; i++) {
        txt(ctx, String(i + 1), XT.x - 18, cellXY(XT, i, 0).y + 1, 14, G.muted, 'center');
        for (let k = 0; k < K; k++) { const p = cellXY(XT, i, k); cell(ctx, p.x, p.y, CW, CH, G.lBlue, G.blue, fmtMinus(X[i][k], 1), G.tBlue); }
      }
      for (let j = 0; j < N; j++) {
        txt(ctx, 'n' + (j + 1), WT.x - 20, cellXY(WT, j, 0).y + 1, 14, G.muted, 'center');
        for (let k = 0; k < K; k++) { const p = cellXY(WT, j, k); cell(ctx, p.x, p.y, CW, CH, G.lYellow, G.yellow, fmtMinus(W[j][k], 1), G.black); }
      }
      let n = 0;
      if (tl) for (const f of tl.fetch) {
        const d = tau - f.t0;
        if (d < 0) continue;
        n++;
        if (d < 0.4) {                                // a red ring = a trip to memory
          const p = cellXY(f.src[0] === 'X' ? XT : WT, f.src[1], f.src[2]);
          ctx.save(); ctx.globalAlpha = 1 - d / 0.4; ctx.shadowColor = G.red; ctx.shadowBlur = 10;
          rr(ctx, p.x - CW / 2 - 3, p.y - CH / 2 - 3, CW + 6, CH + 6, 10, null, G.red, 2.5);
          ctx.restore();
        }
      }
      txt(ctx, 'numbers fetched', MEM.x + 20, 560, 15, G.muted);
      txt(ctx, tl ? String(n) : '—', MEM.x + 20, 594, 36, G.tRed, 'left', FONT.sans, 500);
      if (tl) txt(ctx, 'trips to memory', MEM.x + 80, 598, 14, G.muted);
    },

    drawResults(ctx, tau, tl) {
      panel(ctx, RES, 'RESULTS', 'W·x for each token');
      for (let j = 0; j < N; j++) txt(ctx, 'n' + (j + 1), cellXY(YT, 0, j, YCW).x, YT.y - 18, 14, G.muted, 'center');
      for (let i = 0; i < M; i++) {
        txt(ctx, String(i + 1), YT.x - 13, cellXY(YT, i, 0, YCW).y + 1, 14, G.muted, 'center');
        for (let j = 0; j < N; j++) {
          const p = cellXY(YT, i, j, YCW), L = tl ? tl.land[i][j] : Infinity;
          if (tau >= L) {
            const pop = tau - L < 0.5 ? 1 - (tau - L) / 0.5 : 0;
            ctx.save(); if (pop) { ctx.shadowColor = G.green; ctx.shadowBlur = 16 * pop; }
            cell(ctx, p.x, p.y, YCW, CH, G.lGreen, G.green, fmtMinus(Yv[i][j], 2), G.tGreen, 15);
            ctx.restore();
          } else cell(ctx, p.x, p.y, YCW, CH, G.lgrey, G.line, '·', G.muted);
        }
      }
      const done = tl ? tl.macs.reduce((n, mc) => n + (mc.m <= tau ? 1 : 0), 0) : 0;
      txt(ctx, 'multiply-adds', RES.x + 20, 344, 15, G.muted);
      txt(ctx, `${done} / ${MACS}`, RES.x + 20, 378, 30, G.black, 'left', FONT.sans, 500);
      txt(ctx, 'ticks', RES.x + 20, 428, 15, G.muted);
      const ticks = !tl ? '—' : tau < 0 ? (tl.kind === 'tpu' ? 'loading…' : '0') : String(Math.min(tl.T, Math.ceil(tau - 1e-6)));
      txt(ctx, ticks, RES.x + 20, 462, 30, G.black, 'left', FONT.sans, 500);
      txt(ctx, '1 tick = one beat of', RES.x + 20, 566, 14, G.muted);
      txt(ctx, 'the chip’s clock', RES.x + 20, 586, 14, G.muted);
    },

    drawProcessor(ctx, tau, tl) {
      panel(ctx, PROC);
      ctx.save(); ctx.globalAlpha *= ease(this.fade);
      txt(ctx, TITLES[this.mode], PROC.x + PROC.w / 2, PROC.y + 24, 21, G.black, 'center', FONT.sans, 500);
      if (this.mode === 'intro') this.drawIntro(ctx);
      else if (this.mode === 'cpu') this.drawCPU(ctx, tau, tl);
      else if (this.mode === 'gpu') this.drawGPU(ctx, tau, tl);
      else this.drawTPU(ctx, tau, tl);
      ctx.restore();
    },

    drawIntro(ctx) {
      // one multiply-add cell, looping: x drops in from the top, the running sum slides in from the left
      const cx = 532, cy = 300, S = 168, p = (this.time % 3.6) / 3.6;
      const flash = p > 0.3 && p < 0.7 ? Math.exp(-(p - 0.3) * 9) : 0;
      ctx.save(); if (flash > 0.02) { ctx.shadowColor = G.yellow; ctx.shadowBlur = 32 * flash; }
      rr(ctx, cx - S / 2, cy - S / 2, S, S, 22, G.lYellow, G.yellow, 2.5 + 2.5 * flash); ctx.restore();
      txt(ctx, '1.2', cx + 46, cy - 54, 24, G.black, 'center', FONT.mono);
      txt(ctx, 'weight w', cx + S / 2 + 14, cy - 54, 16, G.muted);
      txt(ctx, '(stays inside)', cx + S / 2 + 14, cy - 33, 14, G.muted);
      const xin = ease(clamp((p - 0.04) / 0.24, 0, 1)), xout = ease(clamp((p - 0.5) / 0.26, 0, 1));
      const xa = smoothstep(0, 0.25, xin) * (1 - smoothstep(0.6, 1, xout));
      chip(ctx, cx - 38, lerp(cy - 170, cy - 14, xin) + 184 * xout, '0.9', 'x', xa);
      const sa = smoothstep(0, 0.25, xin) * (1 - smoothstep(0.6, 1, xout));
      chip(ctx, lerp(cx - 220, cx + 4, xin) + 224 * xout, cy + 50, p < 0.33 ? '0.00' : '1.08', 's', sa, 64);
      txt(ctx, 'input x', cx - 8, cy - 172, 16, G.tBlue);
      txt(ctx, 'running sum s', cx - 220, cy + 22, 16, G.tGreen, 'center');
      const ann = smoothstep(0.33, 0.4, p) * (1 - smoothstep(0.78, 0.86, p));
      if (ann > 0.01) { ctx.save(); ctx.globalAlpha *= ann; txt(ctx, '0 + 1.2 × 0.9 = 1.08', cx, cy + S / 2 + 32, 20, G.tGreen, 'center', FONT.mono); ctx.restore(); }
      // s ← s + w × x
      const parts = [['s', G.tGreen, 1], [' ← ', G.black, 0], ['s', G.tGreen, 1], [' + ', G.black, 0], ['w', G.black, 1, 1], [' × ', G.black, 0], ['x', G.tBlue, 1]];
      const font = it => `${it ? 'italic ' : ''}46px ${FONT.math}`;
      let tw = 0; parts.forEach(q => { ctx.font = font(q[2]); q.w = ctx.measureText(q[0]).width; tw += q.w; });
      let x = cx - tw / 2; const ey = 488;
      parts.forEach(q => {
        if (q[3]) { rr(ctx, x - 6, ey - 26, q.w + 12, 48, 6, G.lYellow); ctx.fillStyle = G.yellow; ctx.fillRect(x - 6, ey + 18, q.w + 12, 4); }
        ctx.font = font(q[2]); ctx.fillStyle = q[1]; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(q[0], x, ey);
        x += q.w;
      });
      txt(ctx, `× ${MACS} for this little layer`, cx, 552, 22, G.black, 'center', FONT.sans, 500);
      txt(ctx, '× 268 million per token in Gemma 3 270M', cx, 584, 18, G.muted, 'center');
    },

    drawCPU(ctx, tau, tl) {
      die(ctx, DIE, true);
      const tt = clamp(Math.floor(tau), 0, tl.T - 1), j = Math.floor(tt / K), k = tt % K;
      const since = tau - (tt + 0.5), glow = since >= 0 && since < 0.6 ? Math.exp(-since / 0.18) : 0;
      for (let c = 0; c < M; c++) {
        const R = CPU_CORES[c];
        ctx.save(); if (glow > 0.02) { ctx.shadowColor = G.blue; ctx.shadowBlur = 24 * glow; }
        rr(ctx, R.x, R.y, R.w, R.h, 14, G.lgrey, glow > 0.02 ? G.blue : G.grey, 1.5 + 1.5 * glow); ctx.restore();
        txt(ctx, `core ${c + 1}`, R.x + 14, R.y + 22, 15, G.black, 'left', FONT.sans, 500);
        txt(ctx, `token ${c + 1}`, R.x + R.w - 14, R.y + 22, 14, G.muted, 'right');
        if (tau < 0) { txt(ctx, 'ready', R.x + R.w / 2, R.y + 92, 16, G.muted, 'center'); continue; }
        const a = smoothstep(tt + 0.32, tt + 0.5, tau);
        chip(ctx, R.x + 58, R.y + 80, fmtMinus(X[c][k], 1), 'x', a);
        txt(ctx, '×', R.x + 105, R.y + 81, 22, G.black, 'center');
        chip(ctx, R.x + 152, R.y + 80, fmtMinus(W[j][k], 1), 'w', a);
        let s = 0;
        for (let q = 0; q <= k; q++) if (j * K + q + 0.5 <= tau) s += W[j][q] * X[c][q];
        txt(ctx, `s = ${fmtMinus(s, 2)}`, R.x + 105, R.y + 128, 21, G.tGreen, 'center', FONT.mono);
        txt(ctx, `→ neuron ${j + 1}`, R.x + 14, R.y + 154, 14, G.muted);
        for (let q = 0; q < K; q++) { const on = j * K + q + 0.5 <= tau; U.circle(ctx, R.x + R.w - 50 + q * 16, R.y + 154, 5, on ? G.green : G.white, on ? G.green : G.grey, 1.2); }
      }
      rr(ctx, 316, 504, 432, 68, 12, G.lgrey, G.line, 1.2);
      ctx.save(); U.roundRect(ctx, 316, 504, 432, 68, 12); ctx.clip();
      ctx.strokeStyle = '#E3E5E8'; ctx.lineWidth = 1;
      for (let x = 300; x < 760; x += 12) { ctx.beginPath(); ctx.moveTo(x, 572); ctx.lineTo(x + 68, 504); ctx.stroke(); }
      ctx.restore();
      rr(ctx, 380, 523, 304, 30, 8, 'rgba(255,255,255,0.9)');
      txt(ctx, 'big caches + control: built to run anything', 532, 538, 15, G.muted, 'center');
    },

    drawGPU(ctx, tau, tl) {
      die(ctx, DIE, true);
      ctx.fillStyle = G.faint;                        // a sea of tiny cores: real GPUs have thousands
      for (let y = DIE.y + 16; y <= DIE.y + DIE.h - 22; y += 9) for (let x = DIE.x + 16; x <= DIE.x + DIE.w - 22; x += 9) ctx.fillRect(x, y, 5, 5);
      const tt = clamp(Math.floor(tau), 0, tl.T - 1), since = tau - (tt + 0.5), glow = tau >= 0 && since >= 0 && since < 0.6 ? Math.exp(-since / 0.18) : 0;
      for (let i = 0; i < M; i++) for (let j = 0; j < N; j++) {
        const R = GPU_CORE(i, j);
        ctx.save(); if (glow > 0.02) { ctx.shadowColor = G.green; ctx.shadowBlur = 18 * glow; }
        rr(ctx, R.x, R.y, R.w, R.h, 10, G.white, glow > 0.02 ? G.green : G.grey, 1.3 + 1.2 * glow); ctx.restore();
        txt(ctx, `#${i + 1} · n${j + 1}`, R.x + 8, R.y + 14, 12, G.muted);
        let s = 0, nk = 0;
        for (let q = 0; q < K; q++) if (q + 0.5 <= tau) { s += W[j][q] * X[i][q]; nk++; }
        txt(ctx, nk ? fmtMinus(s, 2) : '·', R.x + R.w / 2, R.y + 45, 19, nk ? G.tGreen : G.muted, 'center', FONT.mono);
        for (let q = 0; q < K; q++) U.circle(ctx, R.x + R.w / 2 - 14 + q * 14, R.y + R.h - 13, 4, q < nk ? G.green : G.white, q < nk ? G.green : G.grey, 1);
      }
      rr(ctx, 356, 548, 352, 30, 8, 'rgba(255,255,255,0.94)');
      txt(ctx, 'just 16 of a real H100’s 16,896 cores', 532, 563, 16, G.muted, 'center');
    },

    // the 12 weight cells; each flashes whenever an input and a running sum meet in it
    drawCells(ctx, tau, tl) {
      for (let j = 0; j < N; j++) for (let k = 0; k < K; k++) {
        const L = tl.loadT[j][k], loaded = tau >= L;
        const il = Math.min(M - 1, Math.floor(tau - 0.5 - j - k));
        let f = 0;
        if (il >= 0) { const d = tau - (il + j + k + 0.5); if (d >= 0 && d < 0.9) f = Math.exp(-d / 0.22); }
        const pop = loaded && tau - L < 0.4 ? 1 - (tau - L) / 0.4 : 0, g = Math.max(f, pop);
        ctx.save(); if (g > 0.02) { ctx.shadowColor = G.yellow; ctx.shadowBlur = 26 * g; }
        rr(ctx, colL(k), rowT(j), TP.cell, TP.cell, 14, loaded ? G.lYellow : G.lgrey, loaded ? G.yellow : G.line, 1.6 + 2.4 * f);
        ctx.restore();
        if (loaded) txt(ctx, fmtMinus(W[j][k], 1), colL(k) + TP.cell - 8, rowT(j) + 22, 16, G.black, 'right', FONT.mono);
      }
    },
    drawTPU(ctx, tau, tl) {
      rr(ctx, TDIE.x, TDIE.y, TDIE.w, TDIE.h, 16, G.white, G.grey, 2);
      txt(ctx, 'inputs ↓', colL(0) - 14, rowC(-1) - 8, 15, G.tBlue, 'right');
      txt(ctx, 'sums →', colC(-1), rowT(0) + SLANE - 30, 15, G.tGreen, 'center');
      this.drawCells(ctx, tau, tl);
      // running sums: start at 0 on the left, gain w·x in every cell, leave on the right
      for (let i = 0; i < M; i++) for (let j = 0; j < N; j++) {
        const a0 = i + j - 0.5;
        if (tau < a0 - 0.3 || tau > i + j + K) continue;
        const tt = Math.max(tau, a0), x = colC(0) + (tt - (i + j) - 0.5) * TP.pitch;
        let s = 0;
        for (let k = 0; k < K; k++) if (i + j + k + 0.5 <= tau) s += W[j][k] * X[i][k];
        chip(ctx, x, rowT(j) + SLANE, fmtMinus(s, 2), 's', smoothstep(a0 - 0.3, a0, tau), 60);
      }
      // inputs: land above their column (after the trip from memory), then move down one row per tick
      for (let i = 0; i < M; i++) for (let k = 0; k < K; k++) {
        const t1 = i + k - 0.5, tEnd = i + k + N + 0.3;
        if (tau < t1 || tau > tEnd) continue;
        const y = rowC(0) - 8 + (tau - (i + k) - 0.5) * TP.pitch;
        chip(ctx, colL(k) + XLANE, y, fmtMinus(X[i][k], 1), 'x', 1 - smoothstep(tEnd - 0.4, tEnd, tau), 42);
      }
    },

    // ------------------------------------------------------------ zoom out: MXU → chip → pod
    updateMxu() {
      const d = this.mxd.data, P = 70, T = this.time * 42, c3 = this.rgb;
      for (let r = 0; r < 128; r++) for (let c = 0; c < 128; c++) {
        waveRGB(((T - r - c) % P + P) % P, c3);
        const o = (r * 128 + c) * 4;
        d[o] = c3[0]; d[o + 1] = c3[1]; d[o + 2] = c3[2]; d[o + 3] = 255;
      }
      this.mxc.putImageData(this.mxd, 0, 0);
    },
    drawMXU(ctx, F, alpha) {
      if (alpha <= 0.01 || offscreen(F)) return;
      ctx.save(); ctx.globalAlpha *= alpha;
      const pitch = F.w / 128;
      ctx.imageSmoothingEnabled = pitch < 3;
      ctx.drawImage(this.mx, F.x, F.y, F.w, F.h);
      ctx.imageSmoothingEnabled = true;
      if (pitch >= 5) {                               // gaps between cells, in the same proportion as the toy array
        const gap = pitch * (TP.pitch - TP.cell) / TP.pitch;
        const c0 = Math.max(0, Math.floor(-F.x / pitch)), c1 = Math.min(127, Math.ceil((DW - F.x) / pitch));
        const r0 = Math.max(0, Math.floor(-F.y / pitch)), r1 = Math.min(127, Math.ceil((DH - F.y) / pitch));
        const top = Math.max(F.y, 0), bot = Math.min(F.y + F.h, DH), lft = Math.max(F.x, 0), rgt = Math.min(F.x + F.w, DW);
        ctx.fillStyle = G.bg;
        for (let c = c0; c <= c1; c++) ctx.fillRect(F.x + c * pitch + pitch - gap, top, gap, bot - top);
        for (let r = r0; r <= r1; r++) ctx.fillRect(lft, F.y + r * pitch + pitch - gap, rgt - lft, gap);
      }
      if (F.w < 3000) rr(ctx, F.x - 4, F.y - 4, F.w + 8, F.h + 8, 6, null, G.yellow, 2);
      // "our 12 cells" marker while we pull back from them
      const ha = smoothstep(0.42, 0.62, this.z) * (1 - smoothstep(1.12, 1.4, this.z));
      if (ha > 0.01 && F.w < 4000) {
        const I = inner(F, E01);
        ctx.save(); ctx.globalAlpha *= ha;
        rr(ctx, I.x - 3, I.y - 3, I.w + 6, I.h + 6, 3, null, G.blue, 2.5);
        const lx = I.x + I.w + 46, ly = I.y - 26;
        ctx.strokeStyle = G.blue; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(I.x + I.w + 3, I.y); ctx.lineTo(lx - 4, ly + 6); ctx.stroke();
        rr(ctx, lx - 6, ly - 15, 130, 28, 8, 'rgba(255,255,255,0.94)', G.blue, 1.2);
        txt(ctx, 'our 12 cells', lx + 59, ly - 1, 16, G.tBlue, 'center', FONT.sans, 500);
        ctx.restore();
      }
      const da = smoothstep(300, 440, F.w) * (1 - smoothstep(640, 1100, F.w)) * smoothstep(50, 86, F.y);   // "128" marks at level 1
      if (da > 0.01) {
        ctx.globalAlpha *= da; ctx.strokeStyle = G.muted; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(F.x, F.y - 18); ctx.lineTo(F.x + F.w, F.y - 18); ctx.moveTo(F.x - 18, F.y); ctx.lineTo(F.x - 18, F.y + F.h); ctx.stroke();
        rr(ctx, F.x + F.w / 2 - 70, F.y - 30, 140, 24, 6, G.bg); txt(ctx, '128 inputs ↓', F.x + F.w / 2, F.y - 18, 16, G.black, 'center');
        ctx.save(); ctx.translate(F.x - 18, F.y + F.h / 2); ctx.rotate(-Math.PI / 2);
        rr(ctx, -60, -12, 120, 24, 6, G.bg); txt(ctx, '128 outputs', 0, 0, 16, G.black, 'center'); ctx.restore();
      }
      ctx.restore();
    },
    drawChip(ctx, F, alpha, skipTile0) {
      if (alpha <= 0.01 || offscreen(F)) return;
      const k = F.w / 980, X0 = u => F.x + u * k, Y0 = v => F.y + v * k, S = v => v * k, lw = v => Math.max(0.5, v * k);
      ctx.save(); ctx.globalAlpha *= alpha;
      for (const [hx, hy] of [[10, 40], [10, 300], [850, 40], [850, 300]]) {     // HBM memory stacks
        ctx.strokeStyle = G.grey; ctx.lineWidth = lw(2);
        ctx.beginPath();
        for (let q = 0; q < 6; q++) { const yy = Y0(hy + 30 + q * 32); if (hx < 500) { ctx.moveTo(X0(130), yy); ctx.lineTo(X0(150), yy); } else { ctx.moveTo(X0(830), yy); ctx.lineTo(X0(850), yy); } }
        ctx.stroke();
        rr(ctx, X0(hx), Y0(hy), S(120), S(220), S(12), G.lBlue, G.blue, lw(2));
        ctx.strokeStyle = U.rgba(G.blue, 0.45); ctx.lineWidth = lw(1.5);
        ctx.beginPath(); for (let q = 1; q < 6; q++) { ctx.moveTo(X0(hx + 12), Y0(hy + q * 36.7)); ctx.lineTo(X0(hx + 108), Y0(hy + q * 36.7)); } ctx.stroke();
        ztxt(ctx, 'HBM', X0(hx + 60), Y0(hy + 110), S(24), G.tBlue, 'center', 500, true);
      }
      rr(ctx, X0(150), Y0(0), S(680), S(560), S(18), G.white, G.grey, lw(2.5));
      for (let tc = 0; tc < 2; tc++) {
        const tx = 172 + tc * 330;
        rr(ctx, X0(tx), Y0(22), S(306), S(516), S(12), G.lgrey, G.line, lw(1.5));
        ztxt(ctx, 'TensorCore', X0(tx + 16), Y0(43), S(17), G.black, 'left', 500);
        for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
          const mx = tx + 18 + a * 146, my = 64 + b * 146;
          if (!(skipTile0 && tc === 0 && a === 0 && b === 0)) ctx.drawImage(this.mx, X0(mx), Y0(my), S(130), S(130));
          rr(ctx, X0(mx), Y0(my), S(130), S(130), S(4), null, G.yellow, lw(2));
          ztxt(ctx, 'MXU', X0(mx + 65), Y0(my + 112), S(15), G.black, 'center', 500, true);
        }
        rr(ctx, X0(tx + 18), Y0(366), S(276), S(70), S(10), G.lGreen, G.green, lw(1.5));
        ztxt(ctx, 'vector unit', X0(tx + 156), Y0(401), S(17), G.tGreen, 'center', 500);
        rr(ctx, X0(tx + 18), Y0(450), S(130), S(66), S(10), G.lRed, G.red, lw(1.5));
        ztxt(ctx, 'scalar', X0(tx + 83), Y0(483), S(16), G.tRed, 'center', 500);
      }
      ctx.restore();
    },
    drawPod(ctx, F, alpha) {
      if (alpha <= 0.01) return;
      const k = F.w / 1040, px = PPX * k, py = PPY * k, pw = PW * k, ph = PH * k, t = this.time, c3 = this.rgb;
      const c0 = Math.max(0, Math.floor(-F.x / px) - 1), c1 = Math.min(POD.cols - 1, Math.ceil((DW - F.x) / px));
      const r0 = Math.max(0, Math.floor(-F.y / py) - 1), r1 = Math.min(POD.rows - 1, Math.ceil((DH - F.y) / py));
      const pos = (r, c) => ({ x: F.x + c * px + (px - pw) / 2, y: F.y + r * py + (py - ph) / 2 });
      ctx.save(); ctx.globalAlpha *= alpha;
      ctx.strokeStyle = G.line; ctx.lineWidth = Math.max(0.8, 1.4 * k); ctx.beginPath();   // chip-to-chip links
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const p = pos(r, c);
        if (c < POD.cols - 1) { ctx.moveTo(p.x + pw, p.y + ph / 2); ctx.lineTo(p.x + px, p.y + ph / 2); }
        if (r < POD.rows - 1) { ctx.moveTo(p.x + pw / 2, p.y + ph); ctx.lineTo(p.x + pw / 2, p.y + py); }
      }
      ctx.stroke();
      ctx.fillStyle = G.blue;                         // data hopping between chips
      for (let r = r0; r <= r1; r++) {
        if (r % 2) continue;
        const u = (t * 0.11 + r * 0.137) % 1, x = F.x + u * POD.cols * px, y = pos(r, 0).y + ph / 2;
        if (x > -10 && x < DW + 10) { ctx.beginPath(); ctx.arc(x, y, Math.max(1.8, 2.6 * k), 0, Math.PI * 2); ctx.fill(); }
      }
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        if (r === POD.cy && c === POD.cx) continue;   // the centre chip is drawn in detail by the caller
        const p = pos(r, c);
        if (pw > 110) { this.drawChip(ctx, { x: p.x, y: p.y, w: pw, h: ph }, 1, false); continue; }
        waveRGB(((t * 9 - r - c) % 26 + 26) % 26, c3);
        ctx.fillStyle = G.lBlue;
        ctx.fillRect(p.x + pw * 0.01, p.y + ph * 0.07, pw * 0.122, ph * 0.86); ctx.fillRect(p.x + pw * 0.867, p.y + ph * 0.07, pw * 0.122, ph * 0.86);
        rr(ctx, p.x + pw * 0.153, p.y, pw * 0.694, ph, Math.max(1, 2.5 * k), G.white, G.grey, Math.max(0.6, k));
        ctx.fillStyle = `rgb(${c3[0] | 0},${c3[1] | 0},${c3[2] | 0})`;
        ctx.fillRect(p.x + pw * 0.18, p.y + ph * 0.1, pw * 0.64, ph * 0.8);
      }
      ctx.restore();
    },
    drawZoom(ctx) {
      const z = this.z;
      this.updateMxu();
      if (z < 1) {
        // phase 1: the panels dissolve and the matrix unit grows around our 12 cells; phase 2: the camera pulls back
        const p = ease(clamp(z / 0.22, 0, 1)), t = ease(clamp((z - 0.22) / 0.78, 0, 1));
        const F1 = zoomFrame(TOY, E01, H1, t), I = inner(F1, E01);
        this.drawMXU(ctx, F1, p);
        if (p < 1) { ctx.save(); ctx.globalAlpha = 1 - p; this.drawScene(ctx); ctx.restore(); this.drawCaption(ctx, this.caption(), 1 - p); }
        const a = 1 - smoothstep(0.3, 0.6, z);
        if (a > 0.01) {                               // our cells shrink into place, then hand over to the big grid
          const s = I.w / TOY.w;
          ctx.save(); ctx.globalAlpha = a; ctx.translate(I.x, I.y); ctx.scale(s, s); ctx.translate(-TOY.x, -TOY.y);
          this.drawCells(ctx, this.TL.tpu.end, this.TL.tpu); ctx.restore();
        }
      } else if (z < 2) {
        const t = ease(z - 1), F2 = zoomFrame(H1, E12, H2, t);
        this.drawChip(ctx, F2, smoothstep(0, 0.3, t), true);
        this.drawMXU(ctx, inner(F2, E12), 1);
      } else {
        const t = ease(Math.min(1, z - 2)), F3 = zoomFrame(H2, E23, H3, t), C = inner(F3, E23);
        this.drawPod(ctx, F3, smoothstep(0, 0.3, t));
        this.drawChip(ctx, C, 1, false);
        const ra = smoothstep(0.75, 1, t);            // "this is our chip" ring at pod scale
        if (ra > 0.01) { ctx.save(); ctx.globalAlpha = ra; ctx.shadowColor = G.blue; ctx.shadowBlur = 12; rr(ctx, C.x - 5, C.y - 5, C.w + 10, C.h + 10, 6, null, G.blue, 2.5); ctx.restore(); }
      }
      for (let l = 1; l <= 3; l++) {
        const a = l < 3 ? clamp(1 - Math.abs(z - l) * 2.4, 0, 1) : clamp((z - 2.6) * 2.5, 0, 1);
        if (a > 0.01) {
          ctx.save(); ctx.globalAlpha = a * 0.92; rr(ctx, 8, 6, 1064, 44, 12, G.bg); ctx.restore();
          this.drawCaption(ctx, ZCAP[l], a);
        }
      }
    }
  });
})();
