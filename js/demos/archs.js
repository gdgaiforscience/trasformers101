/* =====================================================================
   The model zoo (slide "archs"): same neuron, different wiring
   Step 0 plays the manim film m08_wiring full-bleed (dense → conv → recurrent → graph → attention).
   Steps 1–6 walk six live "heroes", each a small, honest simulation on a 1088 × 670 canvas:
     CNN          a real 3 × 3 convolution over Grace Hopper's photo (data/hopper.js)
     LSTM         real LSTM equations, hand-set weights: "The keys to the cabinet …" → are / is
     GNN          message passing on caffeine; the receptive field grows one bond per round
     Transformer  real Gemma 3 270M attention weights (data/attention.js)
     Diffusion    a real DDIM sampler with the exact denoiser of a 2-D Gaussian-mixture spiral
     Mamba / SSM  a fixed-size selective state next to a growing attention cache
   Step 7: the zoo on a timeline + "match the wiring to your data".
   The 12 tiles open any hero at any time (also: MLP, autoencoder = PCA on photo patches, GAN after
   Goodfellow et al. 2014 Fig. 1, Hopfield recall, a Fourier layer on the heat equation, KAN).
   Every number drawn is computed here; sources for every claim are in docs/facts.md (slide 38).
   ===================================================================== */
(function () {
  'use strict';
  const { clamp, lerp, ease, easeOut, FONT } = U;

  // ---------- the user's Google palette (text only in ink, muted or the dark surface tints: WCAG AA) ----------
  const P = {
    ink: '#202124', muted: '#5f6368', grey: '#9aa0a6', line: '#dadce0', lgrey: '#f1f3f4', bg: '#f8f9fa', white: '#ffffff',
    blue: '#4285f4', red: '#ea4335', yellow: '#fbbc04', green: '#34a853',
    dblue: '#174ea6', dred: '#a50e0e', orange: '#e37400', dgreen: '#0d652d',
    lblue: '#d2e3fc', lred: '#fad2cf', lyellow: '#feefc3', lgreen: '#ceead6'
  };
  const W = 1088, H = 670;                                   // hero canvas (CSS px on the 1920 × 1080 stage)
  const SANS = (w, px) => `${w} ${px}px ${FONT.sans}`;
  const MONO = (px, w) => `${w || 400} ${px}px ${FONT.mono}`;
  const MATH = px => `italic ${px}px ${FONT.math}`;
  const MATHR = px => `${px}px ${FONT.math}`;                // upright (function names, digits)
  const NEG = ['#ffffff', '#fad2cf', '#ea4335', '#a50e0e'], POS = ['#ffffff', '#d2e3fc', '#4285f4', '#174ea6'];
  const divRgb = v => U.rampRgb(v < 0 ? NEG : POS, clamp(Math.abs(v), 0, 1));     // light diverging map (as on #finetune)
  const rgb = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  const divCol = v => rgb(divRgb(v));
  const win = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const fmtInt = v => Math.round(v).toLocaleString('en-US');

  function T(ctx, s, x, y, o) {
    o = o || {};
    ctx.save();
    ctx.font = o.font || SANS(o.weight || 400, o.size || 20);
    ctx.fillStyle = o.color || P.ink;
    ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'alphabetic';
    if (o.alpha !== undefined) ctx.globalAlpha = clamp(o.alpha, 0, 1);
    ctx.fillText(s, x, y);
    ctx.restore();
  }
  function rich(ctx, segs, x, y, o) {                         // [{t, font, color}] laid out left to right
    o = o || {};
    ctx.save(); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    if (o.alpha !== undefined) ctx.globalAlpha = clamp(o.alpha, 0, 1);
    let w = 0; for (const s of segs) { ctx.font = s.font; w += ctx.measureText(s.t).width; }
    let cx = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    for (const s of segs) { ctx.font = s.font; ctx.fillStyle = s.color || P.ink; ctx.fillText(s.t, cx, y + (s.dy || 0)); cx += ctx.measureText(s.t).width; }
    ctx.restore();
    return w;
  }
  function line(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  function box(ctx, x, y, w, h, r, fill, stroke, lw) {
    U.roundRect(ctx, x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
  }
  function headline(ctx, title, sub) {
    T(ctx, title, 30, 48, { font: SANS(500, 26) });
    if (sub) T(ctx, sub, 30, 77, { size: 18, color: P.muted });
  }
  function pill(ctx, s, cx, cy, o) {                          // a token / word chip, returns its width
    o = o || {};
    ctx.save(); ctx.font = o.font || SANS(o.weight || 400, o.size || 22);
    const w = Math.max(o.minW || 0, ctx.measureText(s).width + 2 * (o.pad || 12)), h = o.h || 42;
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    box(ctx, cx - w / 2, cy - h / 2, w, h, o.r || 10, o.fill || P.white, o.stroke || P.grey, o.lw || 1.5);
    ctx.fillStyle = o.color || P.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(s, cx, cy + 1);
    ctx.restore();
    return w;
  }
  function arrowUp(ctx, x, y0, y1, col, lw) { U.arrow(ctx, x, y0, x, y1, { color: col, width: lw || 3, head: 12 }); }

  // ======================================================================
  // THE ZOO: one entry per tile. status: work = still everywhere · moment = had its moment · rising
  // ======================================================================
  const STATUS = {
    work: { label: 'Still everywhere', acc: P.blue, tint: P.lblue, text: P.dblue },
    moment: { label: 'Had its moment', acc: P.yellow, tint: P.lyellow, text: P.ink },
    rising: { label: 'Rising', acc: P.green, tint: P.lgreen, text: P.dgreen }
  };
  const ARCHS = [
    { id: 'mlp', status: 'work', tile: 'MLP', year: 1986, name: 'MLP', full: 'Dense network · multilayer perceptron', since: '1986 →',
      bet: 'No assumptions: any input might matter to any neuron.',
      wire: 'Every neuron is wired to every input. Simple, general, and hungry for data.',
      eq: 'arch_mlp', eqAlt: 'a = σ(W x + b)',
      famous: ['perceptron 1958', 'backprop 1986', 'inside every Transformer block'],
      sci: 'Smooth surrogate models and physics-informed nets. For a small spreadsheet, try gradient-boosted trees first.' },
    { id: 'cnn', status: 'work', tile: 'CNN', year: 1989, name: 'CNN', full: 'Convolutional neural network', since: '1989 →',
      bet: 'Nearby pixels belong together, and a pattern means the same thing anywhere.',
      wire: 'Each neuron sees a small window, and every window shares the same few weights.',
      eq: 'arch_conv', eqAlt: '(x ∗ w)ij = Σ wmn x(i+m, j+n)',
      famous: ['AlexNet 2012', 'ResNet 2015', 'U-Net 2015'],
      sci: 'Microscopy and medical scans (U-Net was built to segment cells), telescope images, DNA motifs.' },
    { id: 'ae', status: 'work', tile: 'Autoencoder', year: 2006, name: 'Autoencoder', full: 'Bottleneck network · VAE', since: '2006 →',
      bet: 'Real data has far fewer degrees of freedom than it has pixels.',
      wire: 'Squeeze through a narrow bottleneck, then rebuild: the bottleneck keeps the essentials.',
      eq: 'arch_ae', eqAlt: 'x → z (k numbers) → x̂, L = ‖x − x̂‖²',
      famous: ['deep autoencoders 2006', 'VAE 2013', 'latent diffusion 2022'],
      sci: 'Single-cell RNA-seq (scVI), anomaly detection; image generators work in a VAE’s squeezed latent space.' },
    { id: 'gnn', status: 'work', tile: 'GNN', year: 2009, name: 'GNN', full: 'Graph neural network', since: '2009 →',
      bet: 'Connections matter, not order: atoms and bonds, places and roads.',
      wire: 'Each node gathers messages from its neighbours, round after round.',
      eq: 'arch_gnn', eqAlt: 'h′v = φ(hv, Σ over neighbours u of ψ(hu, hv))',
      famous: ['GNoME 2023', 'GraphCast 2023', 'Google Maps ETAs'],
      sci: 'Molecules and crystals (GNoME), weather on a mesh around the globe (GraphCast: 16 rounds), particle physics.' },
    { id: 'diff', status: 'work', tile: 'Diffusion', year: 2015, name: 'Diffusion', full: 'Denoising diffusion model', since: '2015 →',
      bet: 'Creating is un-noising: learn to remove a little noise, then repeat from pure static.',
      wire: 'Any network (often a U-Net or Transformer) predicts the noise; a loop does the rest.',
      eq: 'arch_diff', eqAlt: 'x_t = √ᾱ x0 + √(1−ᾱ) ε; L = ‖ε − ε_θ(x_t, t)‖²',
      famous: ['Imagen 2022', 'Veo', 'Gemini Diffusion (text) 2025'],
      sci: 'AlphaFold 3 builds atoms by diffusion; GenCast diffuses 15-day weather ensembles; RFdiffusion designs proteins.' },
    { id: 'attn', status: 'work', tile: 'Transformer', year: 2017, name: 'Transformer', full: 'Attention-based network', since: '2017 →',
      bet: 'Anything may relate to anything: learn who to look at from the data itself.',
      wire: 'Every token scores every other token, then takes a weighted average of them.',
      eq: 'arch_attn', eqAlt: 'y = softmax(Q Kᵀ / √d) V, Q = X W_Q, K = X W_K',
      famous: ['Gemini · Gemma', 'Vision Transformer 2020', 'AlphaFold 2'],
      sci: 'Protein structure (AlphaFold), DNA and protein language models: anything you can turn into tokens.' },
    { id: 'hop', status: 'moment', tile: 'Hopfield', year: 1982, name: 'Hopfield network', full: 'Associative memory', since: '1982 →',
      bet: 'Memories are valleys in an energy landscape: recalling is rolling downhill.',
      wire: 'Every neuron connects to every other, with symmetric weights set by Hebb’s rule.',
      eq: 'arch_hop', eqAlt: 'E = −½ Σ wij si sj, wij = (1/N) Σ ξi ξj',
      famous: ['Nobel Physics 2024', 'Boltzmann machine 1985', '≈ attention (2020)'],
      sci: 'The bridge between neural networks and the statistical physics of magnets (spin glasses).' },
    { id: 'lstm', status: 'moment', tile: 'LSTM', year: 1997, name: 'LSTM', full: 'Recurrent network with long short-term memory', since: '1997 →',
      bet: 'Order matters: read one step at a time and carry a memory forward.',
      wire: 'The same cell runs at every step; gates decide what to write, keep and read.',
      eq: 'arch_lstm', eqAlt: 'c_t = f_t ⊙ c_t−1 + i_t ⊙ c̃_t; h_t = o_t ⊙ tanh(c_t)',
      famous: ['Google Translate 2016', 'speech recognition', 'overtaken by Transformers'],
      sci: 'Still forecasts river floods: the model behind Google’s Flood Hub is an LSTM (Nature, 2024).' },
    { id: 'gan', status: 'moment', tile: 'GAN', year: 2014, name: 'GAN', full: 'Generative adversarial network', since: '2014 →',
      bet: 'A forger and a detective both get better by competing.',
      wire: 'A generator turns noise into samples; a discriminator calls real or fake. They train against each other.',
      eq: 'arch_gan', eqAlt: 'min over G, max over D of E[log D(x)] + E[log(1 − D(G(z)))]',
      famous: ['StyleGAN 2019', 'this-person-does-not-exist', 'overtaken by diffusion 2021'],
      sci: 'Fast super-resolution and simulation; adversarial losses still sharpen image decoders.' },
    { id: 'fno', status: 'rising', tile: 'Neural operator', year: 2020, name: 'Neural operator', full: 'Fourier neural operator (FNO)', since: '2020 →',
      bet: 'Learn the physics map from one whole field to another, at any resolution.',
      wire: 'Jump to frequencies, reweight them with learned weights, jump back, repeat.',
      eq: 'arch_fno', eqAlt: 'v′ = σ(W v + F⁻¹(R · F v))',
      famous: ['FNO 2020', 'FourCastNet 2022', 'up to 1,000× faster than a solver'],
      sci: 'Fast surrogates for fluids, climate and materials: train on simulations, then predict far faster.' },
    { id: 'ssm', status: 'rising', tile: 'Mamba · SSM', year: 2023, name: 'Mamba · SSM', full: 'Selective state space model', since: '2023 →',
      bet: 'Squeeze the past into a fixed-size memory, and choose what is worth keeping.',
      wire: 'A linear recurrence whose updates depend on the input: linear time, constant memory.',
      eq: 'arch_ssm', eqAlt: 'h_t = Ā_t h_t−1 + B̄_t x_t; y_t = C_t h_t',
      famous: ['Mamba 2023', 'RecurrentGemma 2024', 'hybrids: Jamba, Nemotron-H, Granite 4'],
      sci: 'Very long sequences: whole genomes, audio, sensor streams.' },
    { id: 'kan', status: 'rising', tile: 'KAN', year: 2024, name: 'KAN', full: 'Kolmogorov–Arnold network', since: '2024 →',
      bet: 'Put the learning on the edges: every connection is a learnable curve.',
      wire: 'Edges apply learned 1-D functions (splines); nodes only add. Curves can snap to formulas.',
      eq: 'arch_kan', eqAlt: 'f(x) = Σq Φq(Σp φq,p(xp))',
      famous: ['Liu et al. 2024', 'symbolic regression', 'debated at scale'],
      sci: 'Rediscovering formulas from data. A fairer 2024 comparison found MLPs still win most other tasks.' }
  ];
  const BY = Object.fromEntries(ARCHS.map(a => [a.id, a]));
  const ORDER = ['film', 'cnn', 'lstm', 'gnn', 'attn', 'diff', 'ssm', 'overview'];   // what each step shows

  // ---------- tile icons (64 × 40 SVG) ----------
  const S_ = (s) => `<svg viewBox="0 0 64 40" aria-hidden="true">${s}</svg>`;
  const ICON = {
    mlp: (() => {
      const L = [[10, [12, 28]], [32, [7, 20, 33]], [54, [13, 27]]]; let s = '';
      for (let l = 0; l < 2; l++) for (const a of L[l][1]) for (const b of L[l + 1][1]) s += `<line x1="${L[l][0]}" y1="${a}" x2="${L[l + 1][0]}" y2="${b}" stroke="#9aa0a6" stroke-width="1.4"/>`;
      for (const [x, ys] of L) for (const y of ys) s += `<circle cx="${x}" cy="${y}" r="4" fill="#fff" stroke="#5f6368" stroke-width="1.6"/>`;
      return S_(s);
    })(),
    cnn: (() => {
      let s = '';
      for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) s += `<rect x="${4 + c * 7}" y="${2 + r * 7}" width="6" height="6" rx="1" fill="${r >= 1 && r <= 3 && c >= 1 && c <= 3 ? '#4285f4' : '#dadce0'}"/>`;
      s += '<path d="M40 20 H50" stroke="#5f6368" stroke-width="1.8"/><path d="M48 16 L53 20 L48 24" fill="none" stroke="#5f6368" stroke-width="1.8"/><rect x="55" y="16" width="7" height="7" rx="1" fill="#174ea6"/>';
      return S_(s);
    })(),
    ae: S_('<path d="M6 4 L28 15 L28 25 L6 36 Z" fill="#d2e3fc" stroke="#4285f4" stroke-width="1.6"/><path d="M58 4 L36 15 L36 25 L58 36 Z" fill="#d2e3fc" stroke="#4285f4" stroke-width="1.6"/><rect x="28" y="15" width="8" height="10" fill="#174ea6"/>'),
    gnn: (() => {
      const P6 = [0, 1, 2, 3, 4, 5].map(k => [26 + 11 * Math.cos(Math.PI / 6 + k * Math.PI / 3), 24 + 11 * Math.sin(Math.PI / 6 + k * Math.PI / 3)]);
      let s = '';
      for (let k = 0; k < 6; k++) { const a = P6[k], b = P6[(k + 1) % 6]; s += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#9aa0a6" stroke-width="2"/>`; }
      s += `<line x1="${P6[4][0]}" y1="${P6[4][1]}" x2="${P6[4][0]}" y2="3" stroke="#9aa0a6" stroke-width="2"/><line x1="${P6[0][0]}" y1="${P6[0][1]}" x2="52" y2="32" stroke="#9aa0a6" stroke-width="2"/>`;
      P6.forEach((p, k) => { s += `<circle cx="${p[0]}" cy="${p[1]}" r="3.6" fill="${k === 2 ? '#4285f4' : '#5f6368'}"/>`; });
      s += `<circle cx="${P6[4][0]}" cy="4" r="3.6" fill="#ea4335"/><circle cx="52" cy="32" r="3.6" fill="#5f6368"/>`;
      return S_(s);
    })(),
    diff: (() => {
      const R = U.rng(5); let s = '';
      for (let i = 0; i < 18; i++) s += `<circle cx="${(4 + R() * 20).toFixed(1)}" cy="${(5 + R() * 30).toFixed(1)}" r="1.8" fill="#9aa0a6"/>`;
      s += '<path d="M27 20 H35" stroke="#5f6368" stroke-width="1.8"/><path d="M33 16 L37 20 L33 24" fill="none" stroke="#5f6368" stroke-width="1.8"/>';
      for (let i = 0; i < 14; i++) { const t = i / 13, r = 3 + 12 * t, th = 4.4 * t * Math.PI; s += `<circle cx="${(51 + r * Math.cos(th)).toFixed(1)}" cy="${(20 + r * Math.sin(th)).toFixed(1)}" r="1.8" fill="${i % 2 ? '#4285f4' : '#ea4335'}"/>`; }
      return S_(s);
    })(),
    attn: (() => {
      const xs = [6, 18, 30, 42, 56]; let s = '';
      [[42, 6, 2.4], [42, 18, 1.2], [42, 30, 3.4]].forEach(([a, b, w]) => { s += `<path d="M${a} 30 Q ${(a + b) / 2} ${30 - Math.abs(a - b) * 0.75} ${b} 30" fill="none" stroke="#ea4335" stroke-width="${w}" stroke-opacity="0.85"/>`; });
      xs.forEach((x, k) => { s += `<rect x="${x - 4}" y="30" width="8" height="7" rx="2" fill="${k === 3 ? '#a50e0e' : k === 4 ? '#f1f3f4' : '#dadce0'}"/>`; });
      return S_(s);
    })(),
    hop: S_('<path d="M2 10 C 12 10, 12 34, 22 34 C 30 34, 30 16, 36 16 C 42 16, 44 30, 52 30 C 58 30, 60 12, 62 8" fill="none" stroke="#5f6368" stroke-width="2"/><circle cx="22" cy="29" r="4.5" fill="#4285f4"/>'),
    lstm: S_('<path d="M2 7 H62" stroke="#fbbc04" stroke-width="4" stroke-linecap="round"/><rect x="3" y="16" width="14" height="14" rx="3" fill="#fff" stroke="#5f6368" stroke-width="1.6"/><rect x="25" y="16" width="14" height="14" rx="3" fill="#fff" stroke="#5f6368" stroke-width="1.6"/><rect x="47" y="16" width="14" height="14" rx="3" fill="#fff" stroke="#5f6368" stroke-width="1.6"/><path d="M17 23 H25 M39 23 H47" stroke="#5f6368" stroke-width="1.6"/><path d="M32 16 V9" stroke="#4285f4" stroke-width="2"/>'),
    gan: (() => {
      let a = '', b = '';
      for (let i = 0; i <= 24; i++) { const x = 2 + i * 2.5, ga = Math.exp(-0.5 * ((x - 22) / 7) ** 2), gb = Math.exp(-0.5 * ((x - 40) / 6) ** 2); a += `${i ? 'L' : 'M'}${x.toFixed(1)} ${(34 - 26 * ga).toFixed(1)} `; b += `${i ? 'L' : 'M'}${x.toFixed(1)} ${(34 - 26 * gb).toFixed(1)} `; }
      return S_(`<path d="${b}" fill="none" stroke="#202124" stroke-width="2" stroke-dasharray="2 3"/><path d="${a}" fill="none" stroke="#34a853" stroke-width="2.4"/><path d="M2 36 H62" stroke="#9aa0a6" stroke-width="1.2"/>`);
    })(),
    fno: (() => {
      let s = 'M2 20 '; for (let i = 1; i <= 26; i++) { const x = 2 + i, y = 20 - 9 * Math.sin(i * 0.5) - 4 * Math.sin(i * 1.3); s += `L${x} ${y.toFixed(1)} `; }
      return S_(`<path d="${s}" fill="none" stroke="#4285f4" stroke-width="2"/><path d="M31 20 H38" stroke="#5f6368" stroke-width="1.8"/><path d="M36 16 L40 20 L36 24" fill="none" stroke="#5f6368" stroke-width="1.8"/><rect x="43" y="10" width="5" height="26" fill="#174ea6"/><rect x="50" y="20" width="5" height="16" fill="#4285f4"/><rect x="57" y="29" width="5" height="7" fill="#d2e3fc"/>`);
    })(),
    ssm: S_('<path d="M2 32 H18" stroke="#5f6368" stroke-width="1.8"/><path d="M15 28 L20 32 L15 36" fill="none" stroke="#5f6368" stroke-width="1.8"/><rect x="22" y="20" width="22" height="18" rx="3" fill="#feefc3" stroke="#fbbc04" stroke-width="2"/><path d="M28 20 C 26 6, 42 6, 40 18" fill="none" stroke="#5f6368" stroke-width="1.8"/><path d="M37 15 L40 19 L43 15" fill="none" stroke="#5f6368" stroke-width="1.8"/><path d="M44 29 H60" stroke="#5f6368" stroke-width="1.8"/>'),
    kan: (() => {
      let s = ''; for (let i = 0; i <= 20; i++) { const x = 14 + i * 1.8, y = 20 - 7 * Math.sin(i / 20 * 2 * Math.PI); s += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)} `; }
      return S_(`<circle cx="7" cy="20" r="5" fill="#fff" stroke="#5f6368" stroke-width="1.8"/><circle cx="57" cy="20" r="5" fill="#fff" stroke="#5f6368" stroke-width="1.8"/><path d="${s}" fill="none" stroke="#34a853" stroke-width="2.4"/>`);
    })(),
    overview: S_('<path d="M4 34 H60" stroke="#9aa0a6" stroke-width="1.4"/><path d="M10 9 H60" stroke="#4285f4" stroke-width="3"/><path d="M22 18 H44" stroke="#fbbc04" stroke-width="3"/><path d="M40 27 H60" stroke="#34a853" stroke-width="3"/><circle cx="10" cy="9" r="3" fill="#174ea6"/><circle cx="22" cy="18" r="3" fill="#e37400"/><circle cx="40" cy="27" r="3" fill="#0d652d"/>')
  };

  // ======================================================================
  // HEROES. Interface: start(a) · draw(a, t) → true while it still animates · controls(bar, a)
  //                    move(a, p) · out(a) · click(a, p)   (a = hero API, t = seconds since start)
  // ======================================================================
  const HEROES = {};

  // ---------------------------------------------------------------- MLP
  HEROES.mlp = (function () {
    const L = [4, 6, 6, 2];
    const R = U.rng(1986);
    const Wt = [0, 1, 2].map(l => Array.from({ length: L[l + 1] }, () => Array.from({ length: L[l] }, () => {
      const w = R() * 2 - 1; return Math.abs(w) < 0.18 ? (w < 0 ? -0.18 : 0.18) : w;
    })));
    const lx = l => 120 + 170 * l, ny = (l, i) => 345 + (i - (L[l] - 1) / 2) * 74;
    const MX = 772, MY = 186, CS = 44;
    let hov = null;
    return {
      start() { hov = null; },
      draw(a, t) {
        const ctx = a.ctx;
        headline(ctx, 'Dense: every neuron listens to every input', 'the kind of network you watched learn in chapter 5 · 4 → 6 → 6 → 2 · fixed random weights');
        const ph = (t % 2.8) / 0.6, k = Math.floor(ph), f = ease(ph - k);
        for (let l = 0; l < 3; l++) for (let j = 0; j < L[l + 1]; j++) for (let i = 0; i < L[l]; i++) {
          const w = Wt[l][j][i], on = !hov || (hov.l === l + 1 && hov.j === j);
          ctx.strokeStyle = U.rgba(w > 0 ? P.blue : P.red, on ? 0.2 + 0.6 * Math.abs(w) : 0.06);
          ctx.lineWidth = 1 + 3 * Math.abs(w);
          line(ctx, lx(l), ny(l, i), lx(l + 1), ny(l + 1, j));
        }
        if (k < 3) for (let j = 0; j < L[k + 1]; j++) for (let i = 0; i < L[k]; i++) {
          if (hov && !(hov.l === k + 1 && hov.j === j)) continue;
          const w = Wt[k][j][i];
          U.circle(ctx, lerp(lx(k), lx(k + 1), f), lerp(ny(k, i), ny(k + 1, j), f), 2.4 + 2.6 * Math.abs(w), w > 0 ? P.blue : P.red);
        }
        for (let l = 0; l < 4; l++) for (let i = 0; i < L[l]; i++) {
          const g = ph >= l && ph < l + 0.6 ? 1 - (ph - l) / 0.6 : 0, on = hov && hov.l === l && hov.j === i;
          U.circle(ctx, lx(l), ny(l, i), 17, g > 0 ? U.mix(P.white, P.lblue, g) : P.white, on ? P.ink : P.grey, on ? 3 : 2);
        }
        ['inputs', 'hidden', 'hidden', 'outputs'].forEach((s, l) => T(ctx, s, lx(l), 592, { size: 18, color: P.muted, align: 'center' }));
        // who talks to whom: layer 1 as a 6 × 4 matrix (rows = receivers)
        T(ctx, 'who talks to whom', MX + 2 * CS, MY - 36, { size: 18, color: P.muted, align: 'center' });
        T(ctx, 'layer 1 · rows = 6 neurons, columns = 4 inputs', MX + 2 * CS, MY - 12, { size: 16, color: P.muted, align: 'center' });
        for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) {
          const w = Wt[0][r][c], dim = hov && hov.l === 1 && hov.j !== r;
          ctx.save(); if (dim) ctx.globalAlpha = 0.3;
          box(ctx, MX + c * CS + 2, MY + r * CS + 2, CS - 4, CS - 4, 6, divCol(w * 0.9), P.line, 1);
          ctx.restore();
        }
        if (hov && hov.l === 1) box(ctx, MX - 1, MY + hov.j * CS, 4 * CS + 2, CS, 8, null, P.ink, 2.5);
        rich(ctx, [{ t: '24', font: SANS(500, 40) }, { t: '  different weights', font: SANS(400, 20), color: P.muted }], MX + 2 * CS, MY + 6 * CS + 52, { align: 'center' });
        T(ctx, 'every cell filled: no assumptions', MX + 2 * CS, MY + 6 * CS + 82, { size: 18, color: P.muted, align: 'center' });
        return true;
      },
      move(a, p) {
        let best = null;
        for (let l = 1; l < 4; l++) for (let i = 0; i < L[l]; i++) if (Math.hypot(p.x - lx(l), p.y - ny(l, i)) < 24) best = { l, j: i };
        if (!best && p.x >= MX && p.x < MX + 4 * CS && p.y >= MY && p.y < MY + 6 * CS) best = { l: 1, j: Math.floor((p.y - MY) / CS) };
        hov = best;
      },
      out() { hov = null; }
    };
  })();

  // ---------------------------------------------------------------- CNN: a real convolution on Grace Hopper's photo
  HEROES.cnn = (function () {
    const KER = [
      { id: 'v', label: 'vertical edges', k: [-1, 0, 1, -2, 0, 2, -1, 0, 1], signed: true },
      { id: 'h', label: 'horizontal edges', k: [-1, -2, -1, 0, 0, 0, 1, 2, 1], signed: true },
      { id: 'blur', label: 'blur', k: new Array(9).fill(1 / 9), txt: '1/9', signed: false },
      { id: 'sharp', label: 'sharpen', k: [0, -1, 0, -1, 5, -1, 0, -1, 0], signed: false }
    ];
    const IW = 64, IH = 75, OW = IW - 2, OH = IH - 2, NPOS = OW * OH;          // 62 × 73 = 4,526 positions
    const S = 6, IX = 34, IY = 108, KX = 446, KY = 210, KC = 48, OX = 638, OY = 114;
    const SWEEP = 3.4;
    let gray = null, inCv = null, outCv = null, outCtx = null, outImg = null, out = null, scale = 1, ker = KER[0], shown = -1, hov = null, segApi = null;
    function build() {
      if (gray) return true;
      const D = U.data('hopper'); if (!D || !D.gray) return false;
      gray = D.gray;
      inCv = document.createElement('canvas'); inCv.width = IW; inCv.height = IH;
      const ic = inCv.getContext('2d'), id = ic.createImageData(IW, IH);
      for (let i = 0; i < IW * IH; i++) { id.data[4 * i] = id.data[4 * i + 1] = id.data[4 * i + 2] = gray[i]; id.data[4 * i + 3] = 255; }
      ic.putImageData(id, 0, 0);
      outCv = document.createElement('canvas'); outCv.width = OW; outCv.height = OH;
      outCtx = outCv.getContext('2d'); outImg = outCtx.createImageData(OW, OH);
      return true;
    }
    function conv(r, c) { let s = 0; for (let m = 0; m < 3; m++) for (let n = 0; n < 3; n++) s += ker.k[m * 3 + n] * gray[(r + m) * IW + c + n]; return s; }
    function compute() {
      out = new Float32Array(NPOS);
      for (let r = 0; r < OH; r++) for (let c = 0; c < OW; c++) out[r * OW + c] = conv(r, c);
      if (ker.signed) { const s = Array.from(out, Math.abs).sort((x, y) => x - y); scale = s[Math.floor(s.length * 0.99)] || 1; }
      for (let i = 0; i < NPOS; i++) {
        let c;
        if (ker.signed) c = divRgb(clamp(out[i] / scale, -1, 1)); else { const g = clamp(out[i], 0, 255); c = [g, g, g]; }
        outImg.data[4 * i] = c[0]; outImg.data[4 * i + 1] = c[1]; outImg.data[4 * i + 2] = c[2]; outImg.data[4 * i + 3] = 0;
      }
      shown = -1;
    }
    function reveal(n) { for (let i = 0; i < NPOS; i++) outImg.data[4 * i + 3] = i < n ? 255 : 0; outCtx.putImageData(outImg, 0, 0); shown = n; }
    function kTxt(v) { if (ker.txt) return ker.txt; if (v === 0) return '0'; return (v > 0 ? '+' : '−') + Math.abs(v); }
    return {
      start() { hov = null; if (build()) compute(); },
      controls(bar, a) {
        segApi = U.seg(bar, KER.map(k => ({ value: k.id, label: k.label })), ker.id, v => { ker = KER.find(k => k.id === v); a.restart(); });
        U.btn(bar, '↻ slide again', () => a.restart(), 'small');
      },
      draw(a, t) {
        const ctx = a.ctx;
        headline(ctx, 'A real convolution on Grace Hopper’s photo', 'one 3 × 3 kernel slides over every position · trained CNNs learn kernels like these in their first layer');
        if (!gray) { T(ctx, 'photo data missing (data/hopper.js)', 30, 140, { color: P.muted }); return false; }
        const n = Math.round(NPOS * clamp(t / SWEEP, 0, 1));
        if (n !== shown) reveal(n);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(inCv, IX, IY, IW * S, IH * S);
        box(ctx, OX, OY, OW * S, OH * S, 0, P.lgrey);
        ctx.drawImage(outCv, OX, OY, OW * S, OH * S);
        ctx.imageSmoothingEnabled = true;
        ctx.strokeStyle = P.line; ctx.lineWidth = 1; ctx.strokeRect(IX - 0.5, IY - 0.5, IW * S + 1, IH * S + 1); ctx.strokeRect(OX - 0.5, OY - 0.5, OW * S + 1, OH * S + 1);
        const idx = hov !== null ? hov : n < NPOS ? Math.max(0, n - 1) : null;
        if (idx !== null) {
          const r = Math.floor(idx / OW), c = idx % OW;
          ctx.save();
          ctx.strokeStyle = P.white; ctx.lineWidth = 5; ctx.strokeRect(IX + c * S - 1.5, IY + r * S - 1.5, 3 * S + 3, 3 * S + 3);
          ctx.strokeStyle = P.ink; ctx.lineWidth = 2.5; ctx.strokeRect(IX + c * S - 1.5, IY + r * S - 1.5, 3 * S + 3, 3 * S + 3);
          ctx.strokeStyle = P.white; ctx.lineWidth = 5; ctx.strokeRect(OX + c * S - 1.5, OY + r * S - 1.5, S + 3, S + 3);
          ctx.strokeStyle = P.ink; ctx.lineWidth = 2.5; ctx.strokeRect(OX + c * S - 1.5, OY + r * S - 1.5, S + 3, S + 3);
          ctx.strokeStyle = U.rgba(P.ink, 0.4); ctx.lineWidth = 1.3; ctx.setLineDash([5, 5]);
          line(ctx, IX + (c + 3) * S + 2, IY + (r + 1.5) * S, KX - 8, KY + 1.5 * KC);
          line(ctx, KX + 3 * KC + 8, KY + 1.5 * KC, OX + c * S - 2, OY + (r + 0.5) * S);
          ctx.restore();
        }
        // the 9 shared weights
        T(ctx, 'kernel', KX + 1.5 * KC, KY - 16, { size: 18, color: P.muted, align: 'center' });
        const km = Math.max(...ker.k.map(Math.abs));
        for (let m = 0; m < 3; m++) for (let q = 0; q < 3; q++) {
          const v = ker.k[m * 3 + q], x = KX + q * KC, y = KY + m * KC, u = ker.txt ? 0.32 : v / km * 0.9;
          box(ctx, x + 1.5, y + 1.5, KC - 3, KC - 3, 7, divCol(u), P.line, 1);
          T(ctx, kTxt(v), x + KC / 2, y + KC / 2 + 7, { font: MONO(ker.txt ? 16 : 20, 500), color: Math.abs(u) > 0.62 ? P.white : P.ink, align: 'center' });
        }
        rich(ctx, [{ t: '9', font: SANS(500, 44) }, { t: ' weights', font: SANS(400, 20), color: P.muted }], KX + 1.5 * KC, KY + 3 * KC + 60, { align: 'center' });
        T(ctx, 'reused at all', KX + 1.5 * KC, KY + 3 * KC + 90, { size: 18, color: P.muted, align: 'center' });
        T(ctx, fmtInt(NPOS) + ' positions', KX + 1.5 * KC, KY + 3 * KC + 114, { size: 18, color: P.ink, align: 'center', weight: 500 });
        T(ctx, 'input · 64 × 75 pixels', IX + IW * S / 2, IY + IH * S + 28, { size: 18, color: P.muted, align: 'center' });
        T(ctx, 'output “feature map” · 62 × 73', OX + OW * S / 2, OY + OH * S + 26, { size: 18, color: P.muted, align: 'center' });
        if (n >= NPOS && hov === null) T(ctx, 'hover the output', OX + OW * S / 2, OY + OH * S + 50, { size: 16, color: P.muted, align: 'center' });
        return n < NPOS;
      },
      move(a, p) {
        if (!gray || shown < NPOS) return;
        const c = Math.floor((p.x - OX) / S), r = Math.floor((p.y - OY) / S);
        if (c >= 0 && r >= 0 && c < OW && r < OH) {
          hov = r * OW + c;
          const v = out[hov];
          a.tip.show(`<b>One output pixel</b> = 9 multiply-adds with the same 9 weights<br><span class="mono">Σ w·x = ${U.fmtMinus(v, ker.txt ? 1 : 0)}</span>`, p.x, p.y);
        } else { hov = null; a.tip.hide(); }
      },
      out(a) { hov = null; a.tip.hide(); }
    };
  })();

  // ---------------------------------------------------------------- LSTM: real equations, hand-set weights
  HEROES.lstm = (function () {
    const sig = U.sigmoid, tanh = Math.tanh;
    // features per word: [plural noun, singular noun, preposition, verb slot]
    const SENT = {
      keys: { words: ['The', 'keys', 'to', 'the', 'cabinet', '…'], f: [[0, 0, 0, 0], [1, 0, 0, 0], [0, 0, 1, 0], [0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1]] },
      key: { words: ['The', 'key', 'to', 'the', 'cabinets', '…'], f: [[0, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 0], [1, 0, 0, 0], [0, 0, 0, 1]] }
    };
    // cells: 0 = plural, 1 = singular (share gates f, i, o) · 2 = "inside a side phrase" (its own gates)
    function run(S) {
      let c = [0, 0, 0], h = [0, 0, 0];
      const steps = S.f.map(([pl, sg, pp, vb]) => {
        const iN = sig(6 * (pl + sg) - 9 * h[2] - 3), fN = sig(5), oN = sig(8 * vb - 4);
        const i2 = sig(6 * pp - 3), f2 = sig(5), o2 = sig(4);
        c = [fN * c[0] + iN * tanh(3 * pl), fN * c[1] + iN * tanh(3 * sg), f2 * c[2] + i2 * tanh(3 * pp)];
        h = [oN * tanh(c[0]), oN * tanh(c[1]), o2 * tanh(c[2])];
        return { f: fN, i: iN, o: oN, c: c.slice(), h: h.slice(), noun: pl + sg, pp, vb };
      });
      const last = steps[steps.length - 1];
      return { steps, pPl: sig(6 * (last.h[0] - last.h[1])) };
    }
    const RUN = { keys: run(SENT.keys), key: run(SENT.key) };
    let cur = 'keys';
    const N = 6, STEP = 1.05, CX = i => 222 + i * 150, CW = 122, CY = 286, CH = 120;
    const LANES = [{ y: 126, label: 'plural', fill: P.yellow }, { y: 166, label: 'singular', fill: P.yellow }, { y: 206, label: 'side phrase', fill: P.grey }];
    const LH = 30;
    const GATES = [['f', 'keep', P.green], ['i', 'write', P.blue], ['o', 'read', P.orange]];
    return {
      controls(bar, a) {
        U.seg(bar, [{ value: 'keys', label: 'The keys to the cabinet …' }, { value: 'key', label: 'The key to the cabinets …' }], cur, v => { cur = v; a.restart(); });
        U.btn(bar, '↻ read again', () => a.restart(), 'small');
      },
      draw(a, t) {
        const ctx = a.ctx, S = SENT[cur], R = RUN[cur];
        headline(ctx, 'An LSTM reads one word at a time, carrying a memory', 'real LSTM equations · 3 memory cells · hand-set weights (trained LSTMs grow units like these)');
        const tk = t / STEP, k = Math.min(N - 1, Math.floor(tk)), fk = tk >= N ? 1 : tk - Math.floor(tk);
        const prog = i => (i < k ? 1 : i === k ? ease(win(fk, 0.05, 0.45)) : 0);
        const memProg = i => (i < k ? 1 : i === k ? ease(win(fk, 0.35, 0.75)) : 0);
        // memory lanes
        T(ctx, 'MEMORY', 30, 116, { font: SANS(700, 16), color: P.muted });
        LANES.forEach((ln, li) => {
          T(ctx, ln.label, 136, ln.y + LH / 2 + 6, { size: 18, color: P.muted, align: 'right' });
          box(ctx, CX(0) - CW / 2 - 8, ln.y - 4, CX(N - 1) - CX(0) + CW + 16, LH + 8, 10, P.bg, P.line, 1);
          for (let i = 0; i <= k; i++) {
            const v = Math.abs(R.steps[i].c[li]) * memProg(i);
            if (v < 0.01) continue;
            box(ctx, CX(i) - CW / 2 - 8 + (i ? 0 : 0), ln.y, CW + 16 + (i < N - 1 ? 14 : 0), LH, 6, U.rgba(ln.fill, 0.15 + 0.85 * v));
          }
          if (k >= 0) { const v = R.steps[k].c[li] * memProg(k); if (Math.abs(v) > 0.02) T(ctx, U.fmt(v, 2), CX(k) + CW / 2 - 4, ln.y + LH / 2 + 6, { font: MONO(16, 500), align: 'right' }); }
        });
        // cells, gates and words
        for (let i = 0; i < N; i++) {
          const st = R.steps[i], x = CX(i), act = i === k && t < N * STEP + 0.6, seen = i <= k;
          box(ctx, x - CW / 2, CY, CW, CH, 14, seen ? P.white : P.bg, act ? P.ink : P.line, act ? 2.5 : 1.5);
          GATES.forEach(([g, , col], gi) => {
            const bx = x - 40 + gi * 32, by = CY + 18, bh = 62, v = st[g] * prog(i);
            box(ctx, bx, by, 22, bh, 5, P.lgrey);
            if (v > 0.004) box(ctx, bx, by + bh * (1 - v), 22, Math.max(3, bh * v), 5, col);
            T(ctx, g, bx + 11, CY + CH - 14, { font: MATH(21), color: seen ? P.ink : P.grey, align: 'center' });
            if (act && prog(i) > 0.5) T(ctx, st[g].toFixed(2), bx + 11, by - 6, { font: MONO(15), color: P.ink, align: 'center', alpha: (prog(i) - 0.5) * 2 });
          });
          const word = i === N - 1 && k === N - 1 && fk > 0.75 ? (R.pPl > 0.5 ? 'are' : 'is') : S.words[i];
          pill(ctx, word, x, 452, { size: 22, weight: act ? 500 : 400, stroke: act ? P.ink : P.grey, lw: act ? 2.5 : 1.5, alpha: seen ? 1 : 0.45, minW: 64, fill: word === 'are' || word === 'is' ? P.lgreen : P.white, color: word === 'are' || word === 'is' ? P.dgreen : P.ink });
          if (i < N - 1) U.arrow(ctx, x + CW / 2 + 3, CY + CH / 2, CX(i + 1) - CW / 2 - 3, CY + CH / 2, { color: seen && i < k ? P.muted : P.line, width: 2, head: 9 });
        }
        // what happened at each word (persisting labels)
        for (let i = 0; i <= k; i++) {
          const st = R.steps[i], x = CX(i), p = memProg(i);
          if (p <= 0) continue;
          if (st.noun && st.i > 0.5) { arrowUp(ctx, x, CY - 4, LANES[S.f[i][0] ? 0 : 1].y + LH + 4, P.dblue, 3); }
          if (st.noun && st.i < 0.2) {
            ctx.save(); ctx.globalAlpha = p;
            arrowUp(ctx, x, CY - 4, CY - 30, P.dred, 3);
            T(ctx, '✕ blocked', x, CY - 38, { font: SANS(700, 17), color: P.dred, align: 'center' });
            ctx.restore();
          }
          if (st.pp) arrowUp(ctx, x, CY - 4, LANES[2].y + LH + 4, P.muted, 2.5);
        }
        // the read-out at the verb slot
        const pr = k === N - 1 ? ease(win(fk, 0.45, 0.95)) : 0;
        if (pr > 0) {
          const x = CX(N - 1), lane = R.pPl > 0.5 ? 0 : 1;
          ctx.save(); ctx.globalAlpha = pr;
          U.arrow(ctx, x - 30, LANES[lane].y + LH + 4, x - 30, CY - 6, { color: P.orange, width: 3, head: 12 });
          T(ctx, 'read', x - 38, CY - 16, { font: SANS(700, 17), color: P.ink, align: 'right' });
          ctx.restore();
          const rows = [['are', R.pPl], ['is', 1 - R.pPl]], bx = CX(N - 1) - 128, by = 498;
          rows.forEach(([w, p], ri) => {
            const y = by + ri * 34, win1 = p > 0.5;
            T(ctx, w, bx + 34, y + 19, { font: SANS(win1 ? 500 : 400, 19), color: win1 ? P.dgreen : P.muted, align: 'right' });
            box(ctx, bx + 42, y + 4, 104, 20, 5, P.lgrey);
            box(ctx, bx + 42, y + 4, Math.max(3, 104 * p * pr), 20, 5, win1 ? P.green : P.grey);
            T(ctx, (p * 100).toFixed(1) + '%', bx + 152, y + 20, { font: MONO(16, win1 ? 500 : 400), color: win1 ? P.dgreen : P.muted });
          });
        }
        // legend
        let lx = 30;
        GATES.forEach(([g, word, col]) => {
          box(ctx, lx, 520, 16, 16, 4, col);
          lx += 24; lx += rich(ctx, [{ t: g, font: MATH(21) }, { t: ' = ' + word, font: SANS(400, 18), color: P.muted }], lx, 534) + 22;
        });
        T(ctx, 'side phrase: a 3rd cell that closes the write gate inside “to the …”', 30, 566, { size: 17, color: P.muted });
        return t < N * STEP + 0.7;
      }
    };
  })();

  // ---------------------------------------------------------------- GNN: message passing on caffeine (heavy atoms)
  HEROES.gnn = (function () {
    // standard 2-D depiction (bond length 1): 1,3,7-trimethylxanthine
    const AT = [['N', -0.866, 0.5, 'N1'], ['C', -0.866, -0.5, 'C2'], ['N', 0, -1, 'N3'], ['C', 0.866, -0.5, 'C4'], ['C', 0.866, 0.5, 'C5'],
      ['C', 0, 1, 'C6'], ['N', 1.817, 0.809, 'N7'], ['C', 2.405, 0, 'C8'], ['N', 1.817, -0.809, 'N9'], ['O', -1.732, -1, 'O on C2'],
      ['O', 0, 2, 'O on C6'], ['C', -1.732, 1, 'methyl on N1'], ['C', 0, -2, 'methyl on N3'], ['C', 2.126, 1.76, 'methyl on N7']];
    const BD = [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 2], [4, 5, 1], [5, 0, 1], [3, 8, 1], [8, 7, 2], [7, 6, 1], [6, 4, 1], [1, 9, 2], [5, 10, 2], [0, 11, 1], [2, 12, 1], [6, 13, 1]];
    const NA = AT.length, UPX = 94, OX0 = 244, OY0 = 352;
    const px = i => OX0 + AT[i][1] * UPX, py = i => OY0 - AT[i][2] * UPX;
    const adj = AT.map(() => []); BD.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
    const hops = s => { const d = new Array(NA).fill(-1); d[s] = 0; const q = [s]; while (q.length) { const u = q.shift(); for (const v of adj[u]) if (d[v] < 0) { d[v] = d[u] + 1; q.push(v); } } return d; };
    const DIST = AT.map((_, i) => hops(i));
    const ECC = DIST.map(d => Math.max(...d));
    const COL = { C: P.muted, N: P.blue, O: P.red };
    const ROUND = 1.35, MX = 640, MY = 150, CS = 18;
    let focus = 13, hov = -1;
    return {
      start() { hov = -1; },
      controls(bar, a) {
        U.btn(bar, '↻ pass messages again', () => a.restart(), 'small');
        U.el('span', { class: 'ar-hint', text: 'click any atom to follow it' }, bar);
      },
      draw(a, t) {
        const ctx = a.ctx;
        headline(ctx, 'Message passing on caffeine, C₈H₁₀N₄O₂', 'heavy atoms only · every round, each atom sends a message along each of its bonds');
        // round k (1-based): messages fly during its first half, then every atom updates
        const last = ECC[focus], tt = t - 0.5;
        const kRound = tt < 0 ? 0 : Math.min(last, Math.floor(tt / ROUND) + 1);
        const inRound = tt < 0 ? 0 : (tt - (kRound - 1) * ROUND) / ROUND;
        const kVis = tt < 0 ? 0 : inRound >= 0.5 ? kRound : kRound - 1;
        const d = DIST[focus];
        const reached = i => d[i] <= kVis;
        // bonds
        BD.forEach(([a1, b1, order]) => {
          const on = kVis > 0 && reached(a1) && reached(b1);
          ctx.strokeStyle = on ? P.green : P.grey; ctx.lineWidth = on ? 4 : 3;
          const x1 = px(a1), y1 = py(a1), x2 = px(b1), y2 = py(b1);
          if (order === 2) {
            const nx = -(y2 - y1), ny = x2 - x1, L = Math.hypot(nx, ny), ox = nx / L * 4, oy = ny / L * 4;
            line(ctx, x1 + ox, y1 + oy, x2 + ox, y2 + oy); line(ctx, x1 - ox, y1 - oy, x2 - ox, y2 - oy);
          } else line(ctx, x1, y1, x2, y2);
        });
        // messages in flight (both directions on every bond)
        const animating = tt >= 0 && tt < last * ROUND;
        if (animating) {
          const f = ease(win(inRound, 0.0, 0.5));
          if (f > 0 && f < 1) BD.forEach(([a1, b1]) => {
            [[a1, b1], [b1, a1]].forEach(([s, e]) => U.circle(ctx, lerp(px(s), px(e), f), lerp(py(s), py(e), f), 5, P.green));
          });
        }
        // atoms
        for (let i = 0; i < NA; i++) {
          const x = px(i), y = py(i), r = 22;
          if (kVis > 0 && reached(i)) U.circle(ctx, x, y, r + 9, P.lgreen, null);
          if (animating) { const g = win(inRound, 0.5, 0.85); if (g > 0 && g < 1) U.circle(ctx, x, y, r + 4 + 14 * g, null, U.rgba(P.green, 1 - g), 3); }
          U.circle(ctx, x, y, r, COL[AT[i][0]], i === focus ? P.ink : i === hov ? P.ink : null, i === focus ? 4 : 2);
          T(ctx, AT[i][0], x, y + 7, { font: SANS(700, 20), color: P.white, align: 'center' });
        }
        T(ctx, 'following this atom', px(focus), py(focus) - 34, { size: 16, color: P.ink, align: 'center', weight: 500 });
        // who has heard from whom: (A + I)^k reachability, focus row outlined
        T(ctx, 'who has heard from whom', MX + NA * CS / 2, MY - 16, { size: 18, color: P.muted, align: 'center' });
        for (let r = 0; r < NA; r++) for (let c = 0; c < NA; c++) {
          const on = DIST[r][c] <= kVis;
          ctx.fillStyle = on ? (r === c ? P.lgreen : P.green) : P.lgrey;
          ctx.fillRect(MX + c * CS + 1, MY + r * CS + 1, CS - 2, CS - 2);
        }
        box(ctx, MX - 1, MY + focus * CS - 1, NA * CS + 2, CS + 2, 3, null, P.ink, 2);
        const n = d.filter(v => v <= kVis).length;
        rich(ctx, [{ t: 'round ', font: SANS(400, 22), color: P.muted }, { t: String(kVis), font: SANS(500, 44) }], MX, MY + NA * CS + 62);
        T(ctx, `this atom has heard from ${n} of ${NA} atoms`, MX, MY + NA * CS + 96, { size: 20 });
        T(ctx, `after k rounds: everything within k bonds`, MX, MY + NA * CS + 124, { size: 18, color: P.muted });
        T(ctx, 'GraphCast: 16 rounds on a mesh around the planet', MX, MY + NA * CS + 160, { size: 18, color: P.dblue });
        return t < 0.5 + last * ROUND + 0.4;
      },
      move(a, p) {
        let best = -1; for (let i = 0; i < NA; i++) if (Math.hypot(p.x - px(i), p.y - py(i)) < 26) best = i;
        hov = best; a.cursor(best >= 0 ? 'pointer' : '');
        if (best >= 0) a.tip.show(`<b>${AT[best][3]}</b> · ${AT[best][0] === 'C' ? 'carbon' : AT[best][0] === 'N' ? 'nitrogen' : 'oxygen'} · ${adj[best].length} bond${adj[best].length > 1 ? 's' : ''}<br><span class="muted">click to follow it</span>`, p.x, p.y);
        else a.tip.hide();
      },
      out(a) { hov = -1; a.tip.hide(); a.cursor(''); },
      click(a, p) { for (let i = 0; i < NA; i++) if (Math.hypot(p.x - px(i), p.y - py(i)) < 26) { focus = i; a.restart(); return; } }
    };
  })();

  // ---------------------------------------------------------------- Transformer: real Gemma 3 270M attention
  HEROES.attn = (function () {
    const HEADS = [
      { id: 'coref', label: '“it” finds its noun', layer: 9, head: 2, sent: 'trophy', q: ' it' },
      { id: 'copy', label: 'find earlier copies', layer: 3, head: 3, sent: 'water', qi: 14 },
      { id: 'prev', label: 'look one word back', layer: 2, head: 3, sent: 'wombat', q: ' it' }
    ];
    let hd = HEADS[0], q = null, hovQ = null, lay = null;
    const BASE = 482, TOKY = 506;
    function sentence() { const A = U.data('attention'); return A && A.sentences.find(s => s.id === hd.sent); }
    function layout(ctx, s) {
      ctx.save(); let fs = 22, pad = 11, gap = 8, ws;
      for (; fs >= 15; fs--) {
        ctx.font = SANS(400, fs);
        ws = s.tokens.map(tk => ctx.measureText(label(tk)).width + 2 * pad);
        if (ws.reduce((x, y) => x + y, 0) + gap * (ws.length - 1) <= W - 60) break;
      }
      ctx.restore();
      const tot = ws.reduce((x, y) => x + y, 0) + gap * (ws.length - 1);
      let x = (W - tot) / 2; const cx = [];
      ws.forEach(w => { cx.push(x + w / 2); x += w + gap; });
      return { fs, ws, cx };
    }
    const label = tk => (tk === '<bos>' ? '<bos>' : tk.replace(/^ /, '') || '␣');
    return {
      start() { const s = sentence(); hovQ = null; if (s) q = hd.qi !== undefined ? hd.qi : s.tokens.indexOf(hd.q); lay = null; },
      controls(bar, a) {
        U.seg(bar, HEADS.map(h => ({ value: h.id, label: h.label })), hd.id, v => { hd = HEADS.find(h => h.id === v); a.restart(); });
        U.el('span', { class: 'ar-hint', text: 'hover any word' }, bar);
      },
      draw(a, t) {
        const ctx = a.ctx, s = sentence();
        headline(ctx, 'Real attention inside Gemma 3 (270M)', `layer ${hd.layer}, head ${hd.head} · each word looks back at earlier words · the arcs are recomputed for every sentence`);
        if (!s) { T(ctx, 'attention data missing (data/attention.js)', 30, 140, { color: P.muted }); return false; }
        lay = layout(ctx, s);
        const qq = hovQ !== null ? hovQ : q, row = s.attn[hd.layer][hd.head][qq], grow = ease(win(t, 0.1, 1.2));
        // arcs from the query token to every earlier token (width = attention weight)
        const order = row.map((v, j) => j).filter(j => j <= qq).sort((x, y) => row[x] - row[y]);
        for (const j of order) {
          const v = row[j]; if (v < 0.01 || j === qq) continue;
          const x0 = lay.cx[qq], x1 = lay.cx[j], h = Math.min(BASE - 120, 46 + Math.abs(x0 - x1) * 0.48) * grow;
          ctx.strokeStyle = U.rgba(P.red, Math.min(0.95, 0.22 + v * 1.5)); ctx.lineWidth = 1.2 + v * 20; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x0, BASE); ctx.bezierCurveTo(x0, BASE - h, x1, BASE - h, x1, BASE); ctx.stroke();
          if (v >= 0.075 && Math.abs(x0 - x1) > 60 && grow > 0.9) T(ctx, Math.round(v * 100) + '%', (x0 + x1) / 2, BASE - h * 0.76 - 8, { font: MONO(18, 500), align: 'center' });
        }
        s.tokens.forEach((tk, j) => {
          const isQ = j === qq, future = j > qq;
          pill(ctx, label(tk), lay.cx[j], TOKY, { size: lay.fs, h: 40, pad: 11, minW: lay.ws[j], fill: isQ ? P.lred : P.white, stroke: isQ ? P.red : P.grey, lw: isQ ? 3 : 1.5, color: isQ ? P.dred : P.ink, alpha: future ? 0.35 : 1, weight: isQ ? 500 : 400 });
        });
        // top target in words
        let best = -1; row.forEach((v, j) => { if (j !== qq && j > 0 && j <= qq && (best < 0 || v > row[best])) best = j; });
        if (best > 0 && grow > 0.9) {
          rich(ctx, [{ t: `from “${label(s.tokens[qq])}”: `, font: SANS(400, 22), color: P.muted }, { t: `${Math.round(row[best] * 100)}% → “${label(s.tokens[best])}”`, font: SANS(500, 22), color: P.dred }], W / 2, 572, { align: 'center' });
        }
        T(ctx, 'faded words are in the future: a language model may only look back', W / 2, 598, { size: 16, color: P.muted, align: 'center', alpha: qq < s.tokens.length - 1 ? 1 : 0 });
        return t < 1.3;
      },
      move(a, p) {
        if (!lay) return;
        let best = null; if (Math.abs(p.y - TOKY) < 24) lay.cx.forEach((x, j) => { if (j > 0 && Math.abs(p.x - x) < lay.ws[j] / 2 + 4) best = j; });
        if (best !== hovQ) { hovQ = best; }
      },
      out() { hovQ = null; }
    };
  })();

  // ---------------------------------------------------------------- Diffusion: DDIM with the exact denoiser of a toy spiral
  HEROES.diff = (function () {
    const K = 120, S0 = 0.06, NP = 1600, STEPS = 60, RANGE = 2.6, PLAY = 4.4;
    const MU = new Float64Array(2 * K), ARM = new Uint8Array(K);
    for (let a = 0; a < 2; a++) for (let k = 0; k < K / 2; k++) {
      const t = k / (K / 2 - 1), r = 0.25 + 1.75 * t, th = 0.5 + 3.4 * Math.PI * t + a * Math.PI, i = a * K / 2 + k;
      MU[2 * i] = r * Math.cos(th); MU[2 * i + 1] = r * Math.sin(th); ARM[i] = a;
    }
    const fcos = x => Math.pow(Math.cos((x + 0.008) / 1.008 * Math.PI / 2), 2);
    const abar = s => clamp(fcos(s) / fcos(0), 1e-5, 0.9999);   // cosine schedule; s = 1 is pure noise
    const LW = new Float64Array(K);
    function denoise(x, y, ab, o, oi) {                         // posterior mean E[x0 | x_t] and P(arm 1 | x_t)
      const sa = Math.sqrt(ab), v = ab * S0 * S0 + 1 - ab, g = sa * S0 * S0 / v;
      let mx = -Infinity;
      for (let k = 0; k < K; k++) { const dx = x - sa * MU[2 * k], dy = y - sa * MU[2 * k + 1]; LW[k] = -(dx * dx + dy * dy) / (2 * v); if (LW[k] > mx) mx = LW[k]; }
      let Z = 0, ex = 0, ey = 0, pa = 0;
      for (let k = 0; k < K; k++) {
        const w = Math.exp(LW[k] - mx), mx0 = MU[2 * k], my0 = MU[2 * k + 1];
        Z += w; ex += w * (mx0 + g * (x - sa * mx0)); ey += w * (my0 + g * (y - sa * my0)); if (ARM[k]) pa += w;
      }
      o[oi] = ex / Z; o[oi + 1] = ey / Z; return pa / Z;
    }
    let frames = [], x0s = [], resp = [], done = 0, seed = 11, f = 0, playing = true, playT0 = 0, scrub = null, arrows = true;
    function reset(newSeed) {
      if (newSeed) seed = (seed * 48271 + 7) % 2147483647;
      const R = U.rng(seed), x = new Float32Array(2 * NP);
      for (let i = 0; i < 2 * NP; i++) x[i] = R.normal();
      frames = [x]; x0s = []; resp = []; done = 0; f = 0;
    }
    function stepTo(n) {
      const tmp = new Float64Array(2);
      while (done < n && done < STEPS) {
        const s = 1 - done / STEPS, sn = 1 - (done + 1) / STEPS, ab = abar(s), abn = abar(sn);
        const xt = frames[done], xn = new Float32Array(2 * NP), xh = new Float32Array(2 * NP), rp = new Float32Array(NP);
        const sa = Math.sqrt(ab), sb = Math.sqrt(1 - ab), san = Math.sqrt(abn), sbn = Math.sqrt(1 - abn);
        for (let i = 0; i < NP; i++) {
          const x = xt[2 * i], y = xt[2 * i + 1];
          rp[i] = denoise(x, y, ab, tmp, 0);
          const hx = tmp[0], hy = tmp[1], ex = (x - sa * hx) / sb, ey = (y - sa * hy) / sb;
          xh[2 * i] = hx; xh[2 * i + 1] = hy;
          xn[2 * i] = san * hx + sbn * ex; xn[2 * i + 1] = san * hy + sbn * ey;
        }
        x0s[done] = xh; resp[done] = rp; frames[done + 1] = xn; done++;
      }
      if (done === STEPS && !resp[STEPS]) {                       // colours at the end: responsibilities of the clean samples
        const rp = new Float32Array(NP), xs = frames[STEPS];
        for (let i = 0; i < NP; i++) rp[i] = denoise(xs[2 * i], xs[2 * i + 1], abar(0), tmp, 0);
        resp[STEPS] = rp; x0s[STEPS] = xs;
      }
    }
    const PX = 44, PY = 104, PS = 470, MPX = 640, MPY = 150, MPS = 300;
    const map = (v, o, s) => o + (v + RANGE) / (2 * RANGE) * s;
    let slider = null;
    function particles(ctx, xs, rp, ox, oy, sz, r) {
      const B = new Map();
      for (let i = 0; i < NP; i++) {
        const pa = rp ? rp[i] : 0.5, c = Math.pow(Math.abs(2 * pa - 1), 1.5), lv = Math.round(c * 6), key = (pa > 0.5 ? 'r' : 'b') + lv;
        let arr = B.get(key); if (!arr) { arr = []; B.set(key, arr); } arr.push(i);
      }
      B.forEach((arr, key) => {
        const lv = +key.slice(1) / 6, col = U.mix(P.grey, key[0] === 'r' ? P.red : P.blue, lv);
        ctx.fillStyle = col; ctx.beginPath();
        for (const i of arr) {
          const x = map(xs[2 * i], ox, sz), y = map(-xs[2 * i + 1], oy, sz);
          if (x < ox - 2 || x > ox + sz + 2 || y < oy - 2 || y > oy + sz + 2) continue;
          ctx.rect(x - r, y - r, 2 * r, 2 * r);
        }
        ctx.fill();
      });
    }
    return {
      start(a) { reset(false); playing = true; playT0 = 0; scrub = null; if (slider) slider.set(0, true); },
      controls(bar, a) {
        U.btn(bar, '▶ generate new samples', () => { reset(true); playing = true; scrub = null; a.restart(true); }, 'small primary');
        slider = U.slider(bar, { label: 'noise → data', min: 0, max: STEPS, step: 0.1, value: 0, width: 300, color: P.blue, fmt: v => `step ${Math.round(v)}/${STEPS}`, oninput: v => { playing = false; scrub = v; a.redraw(); } });
        const lab = U.el('label', { class: 'ar-check' }, bar);
        const cb = U.el('input', { type: 'checkbox' }, lab); cb.checked = arrows;
        U.el('span', { text: ' arrows' }, lab);
        cb.addEventListener('change', () => { arrows = cb.checked; cb.blur(); a.redraw(); });
      },
      draw(a, t) {
        const ctx = a.ctx;
        headline(ctx, 'A real diffusion sampler: from static to structure', 'toy 2-D data (two spiral arms) · exact denoiser, which a trained network approximates for real images');
        if (playing) f = clamp((t - 0.35) / PLAY, 0, 1) * STEPS; else if (scrub !== null) f = scrub;
        if (slider && playing) slider.set(f, true);
        const n0 = Math.floor(f), n1 = Math.min(STEPS, n0 + 1), fr = f - n0;
        stepTo(n1);
        const A0 = frames[n0], A1 = frames[n1];
        const xs = new Float32Array(2 * NP); for (let i = 0; i < 2 * NP; i++) xs[i] = A0[i] + (A1[i] - A0[i]) * fr;
        const nr = Math.min(STEPS, Math.round(f)), rp = resp[nr] || resp[Math.max(0, nr - 1)];
        // main plot
        box(ctx, PX, PY, PS, PS, 12, P.bg, P.line, 1);
        if (arrows && f < STEPS - 0.5) {
          const ab = abar(1 - f / STEPS), tmp = new Float64Array(2), G = 13;
          ctx.save(); ctx.strokeStyle = U.rgba(P.muted, 0.55); ctx.fillStyle = U.rgba(P.muted, 0.55); ctx.lineWidth = 1.4;
          for (let gi = 0; gi < G; gi++) for (let gj = 0; gj < G; gj++) {
            const x = -RANGE + (gi + 0.5) * 2 * RANGE / G, y = -RANGE + (gj + 0.5) * 2 * RANGE / G;
            denoise(x, y, ab, tmp, 0);
            const X = map(x, PX, PS), Y = map(-y, PY, PS), dx = map(tmp[0], PX, PS) - X, dy = map(-tmp[1], PY, PS) - Y, L = Math.hypot(dx, dy);
            if (L < 2) continue;
            const s = Math.min(16, L * 0.3) / L;
            U.arrow(ctx, X, Y, X + dx * s, Y + dy * s, { color: U.rgba(P.muted, 0.6), width: 1.4, head: 6 });
          }
          ctx.restore();
        }
        ctx.save(); ctx.beginPath(); ctx.rect(PX, PY, PS, PS); ctx.clip();
        particles(ctx, xs, rp, PX, PY, PS, 2.1);
        ctx.restore();
        T(ctx, 'the samples, as the noise is removed', PX + PS / 2, PY + PS + 24, { size: 18, color: P.muted, align: 'center' });
        // the denoiser's guess of the clean data
        T(ctx, 'the network’s guess of the clean data, x̂₀', MPX, MPY - 16, { size: 18, color: P.muted });
        box(ctx, MPX, MPY, MPS, MPS, 12, P.bg, P.line, 1);
        const xh = x0s[nr] || x0s[nr - 1] || x0s[0];
        if (xh) { ctx.save(); ctx.beginPath(); ctx.rect(MPX, MPY, MPS, MPS); ctx.clip(); particles(ctx, xh, rp, MPX, MPY, MPS, 1.5); ctx.restore(); }
        // noise level
        const sig = Math.sqrt(1 - abar(1 - f / STEPS));
        T(ctx, 'noise level', MPX, 512, { size: 18, color: P.muted });
        box(ctx, MPX + 104, 498, 196, 18, 9, P.lgrey);
        box(ctx, MPX + 104, 498, Math.max(4, 196 * sig), 18, 9, P.grey);
        T(ctx, `σ = ${sig.toFixed(2)}`, MPX + 312, 513, { font: MONO(18, 500) });
        T(ctx, `denoising step ${Math.round(f)} of ${STEPS}`, MPX, 548, { size: 18, color: P.ink });
        T(ctx, 'colour = which arm a sample is heading for', MPX, 576, { size: 16, color: P.muted });
        return playing && f < STEPS;
      }
    };
  })();

  // ---------------------------------------------------------------- Mamba / SSM vs attention
  HEROES.ssm = (function () {
    const NT = 36, DT = 0.16, KEY = new Set([3, 11, 19, 28]), NC = 16;
    const R = U.rng(2023), XV = Array.from({ length: NT }, () => (R() < 0.5 ? -1 : 1));
    const AC = Array.from({ length: NC }, (_, c) => 0.06 + 0.9 * c / (NC - 1)), BC = Array.from({ length: NC }, () => R() * 2 - 1);
    const STATES = []; { let h = new Array(NC).fill(0); for (let t = 0; t < NT; t++) { const d = KEY.has(t) ? 1.0 : 0.06; h = h.map((v, c) => Math.exp(-d * AC[c]) * v + d * BC[c] * XV[t]); STATES.push(h.slice()); } }
    const HMAX = Math.max(...STATES.flat().map(Math.abs));
    const TX = i => 44 + i * 24;
    const LEN = { '1k': 1e3, '100k': 1e5, '1m': 1e6 };
    let len = '1m';
    return {
      controls(bar, a) {
        U.el('span', { class: 'ar-hint', text: 'cost at' }, bar);
        U.seg(bar, [{ value: '1k', label: '1 thousand' }, { value: '100k', label: '100 thousand' }, { value: '1m', label: '1 million tokens' }], len, v => { len = v; a.redraw(); });
        U.btn(bar, '↻ stream again', () => a.restart(), 'small');
      },
      draw(a, t) {
        const ctx = a.ctx;
        headline(ctx, 'Two ways to remember a long stream', 'yellow = tokens worth remembering · grey = filler · illustrative sizes, real update rules');
        const n = Math.min(NT, Math.floor(t / DT) + 1), cur = n - 1;
        // lane A: attention
        T(ctx, 'Attention (Transformer): keep every token, compare each new one with all of them', 30, 122, { size: 20, weight: 500 });
        for (let j = 0; j < cur; j++) {
          const x0 = TX(cur) + 8, x1 = TX(j) + 8, h = Math.min(104, 18 + (x0 - x1) * 0.2);
          ctx.strokeStyle = U.rgba(P.red, 0.3); ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.moveTo(x0, 262); ctx.quadraticCurveTo((x0 + x1) / 2, 262 - h * 2, x1, 262); ctx.stroke();
        }
        for (let i = 0; i < n; i++) box(ctx, TX(i), 264, 16, 16, 3, KEY.has(i) ? P.yellow : P.grey, i === cur ? P.ink : null, 2);
        T(ctx, `this token: ${cur} comparisons`, 30, 312, { size: 18, color: P.muted });
        // KV cache grows
        const KX = 944;
        T(ctx, 'memory', KX + 48, 132, { size: 16, color: P.muted, align: 'center' });
        for (let i = 0; i < n; i++) box(ctx, KX, 280 - (i + 1) * 3.6, 96, 2.6, 1, KEY.has(i) ? P.yellow : P.grey);
        T(ctx, `${n} slots · grows`, KX + 48, 304, { size: 16, color: P.dred, align: 'center', weight: 500 });
        // lane B: SSM
        T(ctx, 'State space model (Mamba): a fixed-size memory, updated once per token', 30, 372, { size: 20, weight: 500 });
        for (let i = 0; i < n; i++) box(ctx, TX(i), 504, 16, 16, 3, KEY.has(i) ? P.yellow : P.grey, i === cur ? P.ink : null, 2);
        const sx = 944, sy = 400, cs = 24, h = STATES[cur];
        T(ctx, 'memory', sx + 48, 392, { size: 16, color: P.muted, align: 'center' });
        for (let c = 0; c < NC; c++) box(ctx, sx + (c % 4) * cs, sy + 6 + Math.floor(c / 4) * cs, cs - 3, cs - 3, 4, divCol(h[c] / HMAX * 0.95), P.line, 1);
        ctx.strokeStyle = U.rgba(P.dblue, 0.55); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(TX(cur) + 8, 502); ctx.quadraticCurveTo((TX(cur) + sx) / 2, 440, sx - 6, 450); ctx.stroke();
        U.arrow(ctx, sx - 20, 452, sx - 4, 450, { color: U.rgba(P.dblue, 0.8), width: 2, head: 9 });
        T(ctx, '16 numbers · fixed', sx + 48, sy + 6 + 4 * cs + 22, { size: 16, color: P.dgreen, align: 'center', weight: 500 });
        T(ctx, `this token: ${KEY.has(cur) ? 'writes strongly (selective)' : 'barely registers'}`, 30, 552, { size: 18, color: KEY.has(cur) ? P.ink : P.muted });
        // the bill
        const L = LEN[len], pairs = L * (L + 1) / 2;
        rich(ctx, [{ t: 'Double the text: ', font: SANS(500, 20) }, { t: 'attention ×4 work', font: SANS(500, 20), color: P.dred }, { t: '  ·  ', font: SANS(400, 20), color: P.muted }, { t: 'SSM ×2', font: SANS(500, 20), color: P.dgreen }], 30, 596);
        T(ctx, `${{ '1k': '1,000', '100k': '100,000', '1m': '1 million' }[len]} tokens: ${U.fmtSci(pairs, 1)} token pairs vs ${U.fmtSci(L, 0)} state updates (per layer)`, W - 30, 596, { size: 17, color: P.muted, align: 'right' });
        return n < NT;
      }
    };
  })();

  // ---------------------------------------------------------------- Autoencoder: a linear autoencoder (= PCA) on 8 × 8 photo patches
  HEROES.ae = (function () {
    const IW = 64, IH = 72, PSZ = 8, N = 64, S = 5, KS = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64];
    let ready = false, gray, mu, vecs, origCv, recCv, recK = -1, kNow = 64, kUser = null, err = 0, sd = 1, slider = null;
    function jacobi(A, n) {
      const V = new Float64Array(n * n); for (let i = 0; i < n; i++) V[i * n + i] = 1;
      for (let sweep = 0; sweep < 60; sweep++) {
        let off = 0, tot = 0; for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) { const v = A[p * n + q] * A[p * n + q]; tot += v; if (p !== q) off += v; }
        if (off < 1e-22 * tot) break;
        for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
          const apq = A[p * n + q]; if (Math.abs(apq) < 1e-300) continue;
          const th = (A[q * n + q] - A[p * n + p]) / (2 * apq), tt = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(tt * tt + 1), s = tt * c;
          for (let k = 0; k < n; k++) { const kp = A[k * n + p], kq = A[k * n + q]; A[k * n + p] = c * kp - s * kq; A[k * n + q] = s * kp + c * kq; }
          for (let k = 0; k < n; k++) { const pk = A[p * n + k], qk = A[q * n + k]; A[p * n + k] = c * pk - s * qk; A[q * n + k] = s * pk + c * qk; }
          for (let k = 0; k < n; k++) { const kp = V[k * n + p], kq = V[k * n + q]; V[k * n + p] = c * kp - s * kq; V[k * n + q] = s * kp + c * kq; }
        }
      }
      const idx = Array.from({ length: n }, (_, i) => i).sort((x, y) => A[y * n + y] - A[x * n + x]);
      return idx.map(i => Float64Array.from({ length: n }, (_, k) => V[k * n + i]));
    }
    function build() {
      if (ready) return true;
      const D = U.data('hopper'); if (!D || !D.gray) return false;
      gray = D.gray;
      const X = [];
      for (let r0 = 0; r0 + PSZ <= IH; r0 += 2) for (let c0 = 0; c0 + PSZ <= IW; c0 += 2) {
        const v = new Float64Array(N); for (let i = 0; i < PSZ; i++) for (let j = 0; j < PSZ; j++) v[i * PSZ + j] = gray[(r0 + i) * IW + c0 + j]; X.push(v);
      }
      mu = new Float64Array(N); X.forEach(v => { for (let i = 0; i < N; i++) mu[i] += v[i] / X.length; });
      const C = new Float64Array(N * N);
      X.forEach(v => { for (let i = 0; i < N; i++) { const di = v[i] - mu[i]; for (let j = 0; j < N; j++) C[i * N + j] += di * (v[j] - mu[j]) / X.length; } });
      vecs = jacobi(C, N);
      let m = 0; for (let i = 0; i < IW * IH; i++) m += gray[i] / (IW * IH);
      let vv = 0; for (let i = 0; i < IW * IH; i++) vv += (gray[i] - m) * (gray[i] - m) / (IW * IH);
      sd = Math.sqrt(vv);
      origCv = document.createElement('canvas'); origCv.width = IW; origCv.height = IH;
      const oc = origCv.getContext('2d'), od = oc.createImageData(IW, IH);
      for (let i = 0; i < IW * IH; i++) { od.data[4 * i] = od.data[4 * i + 1] = od.data[4 * i + 2] = gray[i]; od.data[4 * i + 3] = 255; }
      oc.putImageData(od, 0, 0);
      recCv = document.createElement('canvas'); recCv.width = IW; recCv.height = IH;
      ready = true; return true;
    }
    function reconstruct(k) {
      if (k === recK) return;
      const rc = recCv.getContext('2d'), rd = rc.createImageData(IW, IH);
      let se = 0;
      const x = new Float64Array(N), rec = new Float64Array(N);
      for (let r0 = 0; r0 < IH; r0 += PSZ) for (let c0 = 0; c0 < IW; c0 += PSZ) {
        for (let i = 0; i < PSZ; i++) for (let j = 0; j < PSZ; j++) x[i * PSZ + j] = gray[(r0 + i) * IW + c0 + j] - mu[i * PSZ + j];
        rec.fill(0);
        for (let c = 0; c < k; c++) { const v = vecs[c]; let z = 0; for (let i = 0; i < N; i++) z += v[i] * x[i]; for (let i = 0; i < N; i++) rec[i] += z * v[i]; }
        for (let i = 0; i < PSZ; i++) for (let j = 0; j < PSZ; j++) {
          const val = rec[i * PSZ + j] + mu[i * PSZ + j], e = x[i * PSZ + j] - rec[i * PSZ + j], o = 4 * ((r0 + i) * IW + c0 + j);
          se += e * e; rd.data[o] = rd.data[o + 1] = rd.data[o + 2] = clamp(Math.round(val), 0, 255); rd.data[o + 3] = 255;
        }
      }
      rc.putImageData(rd, 0, 0);
      err = Math.sqrt(se / (IW * IH)); recK = k;
    }
    const kAt = t => {                                          // 64 → 1 → 8, on a log scale
      if (t < 0.5) return 64;
      if (t < 2.9) return Math.round(Math.pow(2, lerp(6, 0, ease(win(t, 0.5, 2.9)))));
      return Math.round(Math.pow(2, lerp(0, 3, ease(win(t, 3.1, 3.9)))));
    };
    return {
      start() { kUser = null; build(); if (slider) slider.set(KS.indexOf(8), true); },
      controls(bar, a) {
        slider = U.slider(bar, { label: 'bottleneck <span class="m">k</span>', min: 0, max: KS.length - 1, step: 1, value: KS.indexOf(8), width: 320, color: P.blue, fmt: i => `${KS[Math.round(i)]} numbers`, oninput: i => { kUser = KS[Math.round(i)]; a.redraw(); } });
      },
      draw(a, t) {
        const ctx = a.ctx;
        headline(ctx, 'Squeeze, then rebuild: an autoencoder on Grace Hopper’s photo', 'each 8 × 8 patch (64 numbers) → k numbers → 64 numbers · shown: the optimal linear autoencoder (same result as PCA)');
        if (!build()) { T(ctx, 'photo data missing (data/hopper.js)', 30, 140, { color: P.muted }); return false; }
        kNow = kUser !== null ? kUser : kAt(t);
        if (slider && kUser === null) { const j = KS.reduce((b, v, i) => (Math.abs(v - kNow) < Math.abs(KS[b] - kNow) ? i : b), 0); slider.set(j, true); }
        reconstruct(kNow);
        const OXa = 40, OXb = 728, OY = 120;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(origCv, OXa, OY, IW * S, IH * S); ctx.drawImage(recCv, OXb, OY, IW * S, IH * S);
        ctx.imageSmoothingEnabled = true;
        ctx.strokeStyle = P.line; ctx.lineWidth = 1; ctx.strokeRect(OXa - 0.5, OY - 0.5, IW * S + 1, IH * S + 1); ctx.strokeRect(OXb - 0.5, OY - 0.5, IW * S + 1, IH * S + 1);
        // one patch grid hint
        ctx.strokeStyle = U.rgba(P.white, 0.75); ctx.lineWidth = 2; ctx.strokeRect(OXa + 24 * S, OY + 16 * S, PSZ * S, PSZ * S);
        T(ctx, 'original', OXa + IW * S / 2, OY + IH * S + 28, { size: 18, color: P.muted, align: 'center' });
        T(ctx, 'rebuilt from the bottleneck', OXb + IW * S / 2, OY + IH * S + 28, { size: 18, color: P.muted, align: 'center' });
        // the hourglass
        const cx = 544, cy = OY + IH * S / 2, hb = 220, hk = Math.max(6, hb * kNow / 64), xl = 392, xr = 678, bw = 18;
        ctx.fillStyle = P.lblue; ctx.strokeStyle = P.blue; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(xl + bw, cy - hb / 2); ctx.lineTo(cx - bw / 2, cy - hk / 2); ctx.lineTo(cx - bw / 2, cy + hk / 2); ctx.lineTo(xl + bw, cy + hb / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(xr - bw, cy - hb / 2); ctx.lineTo(cx + bw / 2, cy - hk / 2); ctx.lineTo(cx + bw / 2, cy + hk / 2); ctx.lineTo(xr - bw, cy + hb / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
        box(ctx, xl, cy - hb / 2, bw, hb, 4, P.blue); box(ctx, xr - bw, cy - hb / 2, bw, hb, 4, P.blue); box(ctx, cx - bw / 2, cy - hk / 2, bw, hk, 3, P.dblue);
        T(ctx, '64', xl + bw / 2, cy - hb / 2 - 12, { font: SANS(500, 20), align: 'center' }); T(ctx, '64', xr - bw / 2, cy - hb / 2 - 12, { font: SANS(500, 20), align: 'center' });
        rich(ctx, [{ t: 'k', font: MATH(30), color: P.dblue }, { t: ' = ' + kNow, font: SANS(500, 30), color: P.dblue }], cx, cy - Math.max(hk / 2, 20) - 18, { align: 'center' });
        T(ctx, 'encoder', (xl + cx) / 2, cy + hb / 2 + 30, { size: 18, color: P.muted, align: 'center' });
        T(ctx, 'decoder', (xr + cx) / 2, cy + hb / 2 + 30, { size: 18, color: P.muted, align: 'center' });
        const ratio = 64 / kNow;
        T(ctx, ratio > 1 ? `${ratio % 1 ? ratio.toFixed(1) : ratio}× fewer numbers` : 'no squeeze at all', cx, OY + IH * S + 28, { font: SANS(500, 20), color: P.dblue, align: 'center' });
        T(ctx, kNow === 64 ? 'perfect copy' : `typical error ± ${err.toFixed(0)} grey levels (of 255)`, cx, OY + IH * S + 56, { size: 18, color: P.muted, align: 'center' });
        return kUser === null && t < 4.0;
      }
    };
  })();

  // ---------------------------------------------------------------- GAN: idealised training, after Goodfellow et al. (2014), Fig. 1
  HEROES.gan = (function () {
    const MD = 1.0, SD = 0.55, G0 = [-1.7, 1.1], X0 = 70, X1 = 1018, XMIN = -4, XMAX = 4, BASE = 440, HD = 230, ZY = 560, DUR = 5.2;
    const xp = x => X0 + (x - XMIN) / (XMAX - XMIN) * (X1 - X0);
    const pdf = (x, m, s) => Math.exp(-0.5 * ((x - m) / s) * ((x - m) / s)) / (s * Math.sqrt(2 * Math.PI));
    const PMAX = pdf(MD, MD, SD) * 1.05;
    function probit(p) {
      const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
      const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
      const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
      const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
      if (p < 0.02425) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
      if (p > 1 - 0.02425) return -probit(1 - p);
      const q = p - 0.5, r = q * q;
      return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    }
    let tau = 0, manual = null, slider = null;
    return {
      start() { manual = null; if (slider) slider.set(0, true); },
      controls(bar, a) {
        slider = U.slider(bar, { label: 'training', min: 0, max: 1, step: 0.01, value: 0, width: 320, color: P.green, fmt: v => Math.round(v * 100) + '%', oninput: v => { manual = v; a.redraw(); } });
        U.btn(bar, '↻ train again', () => a.restart(), 'small');
      },
      draw(a, t) {
        const ctx = a.ctx;
        headline(ctx, 'A forger and a detective, in one dimension', 'idealised training, after Goodfellow et al. (2014), Fig. 1 · the detective is the best possible one at every moment');
        tau = manual !== null ? manual : ease(win(t, 0.4, 0.4 + DUR));
        if (slider && manual === null) slider.set(tau, true);
        const mg = lerp(G0[0], MD, tau), sg = lerp(G0[1], SD, tau);
        const yD = v => BASE - v * HD;
        // axes and D = ½ guide
        ctx.strokeStyle = P.line; ctx.lineWidth = 1.5; line(ctx, X0, BASE, X1, BASE);
        ctx.setLineDash([3, 5]); line(ctx, X0, yD(0.5), X1, yD(0.5)); ctx.setLineDash([]);
        T(ctx, 'D = ½', X1, yD(0.5) - 8, { size: 16, color: P.muted, align: 'right' });
        T(ctx, 'D = 1', X1, yD(1) - 8, { size: 16, color: P.muted, align: 'right' });
        ctx.strokeStyle = P.line; ctx.setLineDash([3, 5]); line(ctx, X0, yD(1), X1, yD(1)); ctx.setLineDash([]);
        // z → x mapping (upward lines, as in the paper)
        const za = 330, zb = 760;
        ctx.strokeStyle = P.grey; ctx.lineWidth = 1.5; line(ctx, za, ZY, zb, ZY);
        T(ctx, 'random noise z', (za + zb) / 2, ZY + 28, { size: 17, color: P.muted, align: 'center' });
        T(ctx, 'x', X1, BASE + 26, { font: MATH(22), color: P.muted, align: 'right' });
        for (let i = 0; i < 25; i++) {
          const z = (i + 0.5) / 25, gx = clamp(mg + sg * probit(z), XMIN, XMAX);
          ctx.strokeStyle = U.rgba(P.green, 0.45); ctx.lineWidth = 1.4;
          line(ctx, lerp(za, zb, z), ZY - 2, xp(gx), BASE + 3);
          U.circle(ctx, lerp(za, zb, z), ZY, 2.6, P.green);
        }
        // densities and the optimal discriminator D*(x) = p_data / (p_data + p_g)
        const curve = (fn, style) => { ctx.beginPath(); for (let i = 0; i <= 240; i++) { const x = XMIN + (XMAX - XMIN) * i / 240, y = fn(x); i ? ctx.lineTo(xp(x), y) : ctx.moveTo(xp(x), y); } style(); };
        curve(x => BASE - pdf(x, mg, sg) / PMAX * HD * 0.95, () => { ctx.strokeStyle = P.green; ctx.lineWidth = 4; ctx.stroke(); });
        curve(x => BASE - pdf(x, MD, SD) / PMAX * HD * 0.95, () => { ctx.strokeStyle = P.ink; ctx.lineWidth = 2.6; ctx.setLineDash([2, 5]); ctx.stroke(); ctx.setLineDash([]); });
        curve(x => { const pd = pdf(x, MD, SD), pg = pdf(x, mg, sg); return yD(pd + pg > 1e-12 ? pd / (pd + pg) : 0.5); }, () => { ctx.strokeStyle = P.blue; ctx.lineWidth = 3; ctx.setLineDash([10, 7]); ctx.stroke(); ctx.setLineDash([]); });
        // legend
        const lg = [['real data', P.ink, [2, 5]], ['forger’s samples (generator)', P.green, []], ['detective D(x): “is it real?”', P.blue, [10, 7]]];
        let lx = 70;
        lg.forEach(([s, col, dash]) => { ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash(dash); line(ctx, lx, 118, lx + 34, 118); ctx.setLineDash([]); T(ctx, s, lx + 44, 124, { size: 18 }); ctx.font = SANS(400, 18); lx += 44 + ctx.measureText(s).width + 34; });
        const end = tau > 0.985;
        T(ctx, end ? 'The forger matches the data: the detective can only guess, D(x) = ½ everywhere.' : 'Training: the detective learns to spot fakes, the forger learns to fool it.', 70, 166, { size: 19, color: end ? P.dgreen : P.ink, weight: end ? 500 : 400 });
        return manual === null && t < DUR + 0.6;
      }
    };
  })();

  // ---------------------------------------------------------------- Hopfield network: recall a memory by rolling downhill in energy
  HEROES.hop = (function () {
    const PATS = [
      ['..######..', '.########.', '##.####.##', '##.####.##', '##########', '#.######.#', '##.####.##', '###....###', '.########.', '..######..'],
      ['....##....', '...####...', '..######..', '.########.', '##########', '.#......#.', '.#.##...#.', '.#.##.###.', '.#.##.###.', '.########.'],
      ['##......##', '###....###', '.###..###.', '..######..', '...####...', '...####...', '..######..', '.###..###.', '###....###', '##......##']
    ].map(rows => Int8Array.from(rows.join('').split(''), ch => (ch === '#' ? 1 : -1)));
    const N = 100, NAMES = ['smile', 'house', 'cross'];
    const Wm = new Float32Array(N * N);
    PATS.forEach(p => { for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (i !== j) Wm[i * N + j] += p[i] * p[j] / N; });
    const energy = s => { let e = 0; for (let i = 0; i < N; i++) { let h = 0; for (let j = 0; j < N; j++) h += Wm[i * N + j] * s[j]; e += h * s[i]; } return -0.5 * e; };
    let target = 1, seed = 3, run = null;
    function simulate() {                                       // pre-compute one asynchronous run (deterministic for a seed)
      const R = U.rng(seed * 101 + target), s = Int8Array.from(PATS[target]);
      const idx = Array.from({ length: N }, (_, i) => i);
      for (let i = N - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
      idx.slice(0, 25).forEach(i => { s[i] = -s[i]; });          // 25 % of the neurons flipped
      const start = Int8Array.from(s), ups = [], E = [energy(s)];
      for (let sweep = 0; sweep < 12; sweep++) {
        const ord = Array.from({ length: N }, (_, i) => i);
        for (let i = N - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [ord[i], ord[j]] = [ord[j], ord[i]]; }
        let flips = 0;
        for (const i of ord) {
          let h = 0; for (let j = 0; j < N; j++) h += Wm[i * N + j] * s[j];
          const ns = h >= 0 ? 1 : -1, flip = ns !== s[i];
          if (flip) { s[i] = ns; flips++; }
          ups.push([i, flip]); E.push(energy(s));
        }
        if (!flips) break;
      }
      let match = -1; PATS.forEach((p, k) => { if (p.every((v, i) => v === s[i])) match = k; });
      run = { start, ups, E, final: s, match };
    }
    const GX = 64, GY = 150, CS = 34, UPS = 70;                 // updates per second
    return {
      start() { simulate(); },
      controls(bar, a) {
        U.el('span', { class: 'ar-hint', text: 'corrupt' }, bar);
        U.seg(bar, NAMES.map((n, k) => ({ value: String(k), label: n })), String(target), v => { target = +v; a.restart(); });
        U.btn(bar, '↻ new noise', () => { seed++; a.restart(); }, 'small');
      },
      draw(a, t) {
        const ctx = a.ctx;
        headline(ctx, 'A Hopfield network recalls a memory', '100 neurons · 3 memories stored in the weights (Hebb’s rule) · start from a copy with 25 of its 100 pixels flipped');
        if (!run) simulate();
        const m = Math.min(run.ups.length, Math.floor(Math.max(0, t - 0.6) * UPS));
        const s = Int8Array.from(run.start); for (let u = 0; u < m; u++) { const [i, fl] = run.ups[u]; if (fl) s[i] = -s[i]; }
        const curI = m > 0 && m < run.ups.length ? run.ups[m - 1][0] : -1;
        for (let i = 0; i < N; i++) {
          const r = Math.floor(i / 10), c = i % 10;
          box(ctx, GX + c * CS, GY + r * CS, CS - 3, CS - 3, 5, s[i] > 0 ? P.dblue : P.lgrey, i === curI ? P.orange : null, 3);
        }
        T(ctx, m === 0 ? 'corrupted copy' : m < run.ups.length ? 'neurons update one at a time…' : 'settled', GX + 5 * CS, GY + 10 * CS + 26, { size: 18, color: P.muted, align: 'center' });
        // stored memories
        T(ctx, 'memories stored in the weights', 520, 130, { size: 18, color: P.muted });
        PATS.forEach((p, k) => {
          const x0 = 520 + k * 126, y0 = 146, cs = 10, ok = m >= run.ups.length && run.match === k;
          box(ctx, x0 - 6, y0 - 6, 10 * cs + 12, 10 * cs + 12, 8, ok ? P.lgreen : P.white, ok ? P.green : P.line, ok ? 3 : 1);
          ctx.fillStyle = P.dblue;
          for (let i = 0; i < N; i++) if (p[i] > 0) ctx.fillRect(x0 + (i % 10) * cs, y0 + Math.floor(i / 10) * cs, cs - 1, cs - 1);
          T(ctx, NAMES[k] + (ok ? ' ✓' : ''), x0 + 5 * cs, y0 + 10 * cs + 26, { size: 17, color: ok ? P.dgreen : P.muted, align: 'center', weight: ok ? 500 : 400 });
        });
        // energy, falling
        const ex0 = 520, ey0 = 330, ew = 520, eh = 220, E = run.E, Emax = Math.max(...E), Emin = Math.min(...E), sc = v => ey0 + eh - (v - Emin) / ((Emax - Emin) || 1) * eh;
        T(ctx, 'energy E', ex0, ey0 - 12, { size: 18, color: P.muted });
        ctx.strokeStyle = P.line; ctx.lineWidth = 1; ctx.strokeRect(ex0, ey0, ew, eh);
        ctx.strokeStyle = P.blue; ctx.lineWidth = 3; ctx.beginPath();
        for (let u = 0; u <= m; u++) { const x = ex0 + ew * u / (E.length - 1), y = sc(E[u]); u ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
        if (m > 0) U.circle(ctx, ex0 + ew * m / (E.length - 1), sc(E[m]), 6, P.blue);
        T(ctx, 'neuron updates →', ex0 + ew, ey0 + eh + 24, { size: 16, color: P.muted, align: 'right' });
        if (m >= run.ups.length) T(ctx, run.match >= 0 ? `Recalled “${NAMES[run.match]}”: the energy can only go down.` : 'Stuck in a spurious valley: that happens too.', ex0, 604, { size: 19, color: run.match >= 0 ? P.dgreen : P.dred, weight: 500 });
        return m < run.ups.length;
      }
    };
  })();

  // ---------------------------------------------------------------- Neural operator: one Fourier layer = the exact heat-equation solver
  HEROES.fno = (function () {
    const KM = 16, TMAX = 0.12;
    const R = U.rng(2020), AK = [], BK = [];
    for (let k = 1; k <= KM; k++) { const amp = k <= 12 ? 1.1 / Math.pow(k, 0.8) : 0.18; AK.push(amp * (R() * 2 - 1)); BK.push(amp * (R() * 2 - 1)); }
    const u = (x, t) => { let s = 0; for (let k = 1; k <= KM; k++) { const d = Math.exp(-k * k * t); s += d * (AK[k - 1] * Math.cos(k * x) + BK[k - 1] * Math.sin(k * x)); } return s; };
    let res = 256, tUser = null, slider = null;
    function plotCurve(ctx, x0, y0, w, h, fn, n, col, dots) {
      const ys = 2.6;
      ctx.strokeStyle = P.line; ctx.lineWidth = 1; line(ctx, x0, y0 + h / 2, x0 + w, y0 + h / 2);
      ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const x = 2 * Math.PI * i / 200, X = x0 + w * i / 200, Y = y0 + h / 2 - fn(x) / ys * h / 2; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
      ctx.stroke();
      if (dots) { ctx.fillStyle = col; for (let i = 0; i < n; i++) { const x = 2 * Math.PI * i / n; ctx.fillRect(x0 + w * i / n - 1.6, y0 + h / 2 - fn(x) / ys * h / 2 - 1.6, 3.2, 3.2); } }
    }
    return {
      start() { tUser = null; if (slider) slider.set(0, true); },
      controls(bar, a) {
        slider = U.slider(bar, { label: 'time <span class="m">t</span>', min: 0, max: TMAX, step: 0.001, value: 0, width: 280, color: P.green, fmt: v => v.toFixed(3), oninput: v => { tUser = v; a.redraw(); } });
        U.el('span', { class: 'ar-hint', text: 'grid' }, bar);
        U.seg(bar, [{ value: '32', label: '32 points' }, { value: '256', label: '256 points' }], String(res), v => { res = +v; a.redraw(); });
      },
      draw(a, t) {
        const ctx = a.ctx;
        headline(ctx, 'One Fourier layer solving the heat equation', 'u is temperature along a ring · the operator acts on whole functions, so the grid size doesn’t matter');
        const tt = tUser !== null ? tUser : TMAX * ease(win(t, 0.5, 3.5));
        if (slider && tUser === null) slider.set(tt, true);
        const A = { x: 30, y: 150, w: 288, h: 250 }, B = { x: 400, y: 150, w: 288, h: 250 }, C = { x: 770, y: 150, w: 288, h: 250 };
        [[A, 'input  u(x, 0)'], [B, 'frequencies'], [C, `output  u(x, t)`]].forEach(([pp, s]) => { box(ctx, pp.x - 10, pp.y - 40, pp.w + 20, pp.h + 60, 12, P.bg, P.line, 1); T(ctx, s, pp.x, pp.y - 14, { size: 18, color: P.muted }); });
        plotCurve(ctx, A.x, A.y, A.w, A.h, x => u(x, 0), res, P.blue, true);
        plotCurve(ctx, C.x, C.y, C.w, C.h, x => u(x, tt), res, P.dblue, true);
        // frequency bars before / after, and the multiplier R(k) = exp(−k² t)
        const bw = B.w / KM;
        for (let k = 1; k <= KM; k++) {
          const m0 = Math.hypot(AK[k - 1], BK[k - 1]), r = Math.exp(-k * k * tt), hx = B.y + B.h - 4, sc = B.h * 0.72 / 1.2;
          box(ctx, B.x + (k - 1) * bw + 2, hx - m0 * sc, bw - 4, m0 * sc, 2, P.lblue);
          box(ctx, B.x + (k - 1) * bw + 2, hx - m0 * r * sc, bw - 4, Math.max(1, m0 * r * sc), 2, P.blue);
        }
        ctx.strokeStyle = P.green; ctx.lineWidth = 3; ctx.beginPath();
        for (let i = 0; i <= 120; i++) { const k = 1 + (KM - 1) * i / 120, X = B.x + (k - 0.5) * bw, Y = B.y + B.h - 4 - Math.exp(-k * k * tt) * (B.h - 30); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
        ctx.stroke();
        rich(ctx, [{ t: 'R(k) = e', font: SANS(500, 19), color: P.dgreen }, { t: '−k²t', font: SANS(500, 16), color: P.dgreen, dy: -9 }], B.x + B.w - 4, B.y + 22, { align: 'right' });
        T(ctx, 'k = 1 … 16 →', B.x + B.w, B.y + B.h + 22, { size: 16, color: P.muted, align: 'right' });
        U.arrow(ctx, A.x + A.w + 14, A.y + A.h / 2, B.x - 14, B.y + B.h / 2, { color: P.muted, width: 2.5, head: 11 });
        T(ctx, 'FFT', (A.x + A.w + B.x) / 2, A.y + A.h / 2 - 14, { font: SANS(500, 17), color: P.ink, align: 'center' });
        U.arrow(ctx, B.x + B.w + 14, B.y + B.h / 2, C.x - 14, C.y + C.h / 2, { color: P.muted, width: 2.5, head: 11 });
        T(ctx, '× R', (B.x + B.w + C.x) / 2, B.y + B.h / 2 - 14, { font: SANS(500, 17), color: P.dgreen, align: 'center' });
        rich(ctx, [{ t: 'FFT', font: SANS(500, 16) }, { t: '−1', font: SANS(500, 14), dy: -7 }], (B.x + B.w + C.x) / 2, B.y + B.h / 2 + 26, { align: 'center' });
        rich(ctx, [{ t: 'heat equation  ', font: SANS(400, 20), color: P.muted }, { t: 'u', font: MATH(24) }, { t: 't', font: MATH(17), dy: 5 }, { t: ' = ', font: SANS(400, 22) }, { t: 'u', font: MATH(24) }, { t: 'xx', font: MATH(17), dy: 5 },
          { t: '   ⇒   every frequency k just fades by a factor e', font: SANS(400, 20) }, { t: '−k²t', font: SANS(400, 16), dy: -9 }], 30, 496);
        T(ctx, 'An FNO learns weights like R(k) from simulations (plus a local path and a bend), then reuses them on any grid.', 30, 530, { size: 18, color: P.muted });
        T(ctx, `t = ${tt.toFixed(3)} · drawn at ${res} points`, 30, 566, { font: MONO(17), color: P.ink });
        return tUser === null && t < 3.6;
      }
    };
  })();

  // ---------------------------------------------------------------- KAN: weights become functions
  HEROES.kan = (function () {
    const R = U.rng(404);
    const rnd = () => { const a = [R() * 2 - 1, R() * 2 - 1, R() * 2 - 1], ph = [R() * 6, R() * 6, R() * 6]; return x => (a[0] * Math.sin(2 * x + ph[0]) + a[1] * Math.sin(4.5 * x + ph[1]) + 0.6 * a[2] * Math.sin(7 * x + ph[2])) * 0.5; };
    const EDGES = [
      { from: [600, 226], to: [842, 350], fn: x => Math.sin(Math.PI * x), dom: [-1, 1], label: [{ t: 'sin ', font: MATHR(22), color: P.dgreen }, { t: 'πx', font: MATH(22), color: P.dgreen }], box: [664, 246] },
      { from: [600, 474], to: [842, 350], fn: x => x * x, dom: [-1, 1], label: [{ t: 'y', font: MATH(22), color: P.dgreen }, { t: '2', font: MATHR(15), color: P.dgreen, dy: -9 }], box: [664, 384] },
      { from: [842, 350], to: [1030, 350], fn: x => Math.exp(x), dom: [-1, 2], label: [{ t: 'exp', font: MATHR(22), color: P.dgreen }], box: [880, 314] }
    ].map(e => Object.assign(e, { init: rnd() }));
    const BW = 116, BH = 72;
    function edgeBox(ctx, e, tr, snap) {
      const [bx, by] = e.box, [d0, d1] = e.dom;
      const vals = []; for (let i = 0; i <= 48; i++) { const x = d0 + (d1 - d0) * i / 48; vals.push(e.fn(x)); }
      const lo = Math.min(...vals), hi = Math.max(...vals);
      box(ctx, bx, by, BW, BH, 10, P.white, snap ? P.green : P.line, snap ? 2.5 : 1.5);
      ctx.strokeStyle = P.green; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i <= 48; i++) {
        const tn = (vals[i] - lo) / ((hi - lo) || 1), v0 = 0.5 + e.init(i / 48 * 3) * 0.8, v = lerp(v0, tn, tr);
        const X = bx + 8 + (BW - 16) * i / 48, Y = by + BH - 8 - (BH - 16) * clamp(v, -0.1, 1.1);
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.stroke();
      if (snap > 0) rich(ctx, e.label, bx + BW / 2, by - 10, { align: 'center', alpha: snap });
    }
    return {
      controls(bar, a) { U.btn(bar, '↻ train again', () => a.restart(), 'small'); },
      draw(a, t) {
        const ctx = a.ctx;
        headline(ctx, 'Weights become functions', 'Liu et al. (2024)’s example: f(x, y) = exp(sin πx + y²) · training is sketched, the final curves are exact');
        // MLP (left)
        const mn = { x: [110, 226], y: [110, 474], h: [300, 350], o: [450, 350] };
        [['x', 'h'], ['y', 'h'], ['h', 'o']].forEach(([s, e2], k) => {
          ctx.strokeStyle = P.grey; ctx.lineWidth = 3; line(ctx, mn[s][0], mn[s][1], mn[e2][0], mn[e2][1]);
          const mx = (mn[s][0] + mn[e2][0]) / 2, my = (mn[s][1] + mn[e2][1]) / 2;
          pill(ctx, ['1.3', '−0.8', '2.1'][k], mx, my - (k === 2 ? 22 : 0), { font: MONO(18, 500), h: 32, pad: 8, fill: P.lyellow, stroke: P.yellow, lw: 1.5 });
        });
        [['x', mn.x], ['y', mn.y]].forEach(([s, p]) => { U.circle(ctx, p[0], p[1], 24, P.white, P.muted, 2); T(ctx, s, p[0], p[1] + 8, { font: MATH(24), align: 'center' }); });
        U.circle(ctx, mn.h[0], mn.h[1], 26, P.white, P.muted, 2); T(ctx, 'σ', mn.h[0], mn.h[1] + 8, { font: MATH(26), align: 'center' });
        U.circle(ctx, mn.o[0], mn.o[1], 24, P.white, P.muted, 2); T(ctx, 'σ', mn.o[0], mn.o[1] + 8, { font: MATH(26), align: 'center' });
        T(ctx, 'MLP: numbers on the edges,', 70, 556, { size: 20, weight: 500 });
        T(ctx, 'fixed bends (σ) inside the nodes', 70, 582, { size: 20, color: P.muted });
        ctx.strokeStyle = P.line; ctx.lineWidth = 1; line(ctx, 530, 110, 530, 600);
        // KAN (right)
        const tr = ease(win(t, 0.6, 3.4)), snap = ease(win(t, 3.5, 4.1)), form = ease(win(t, 4.2, 4.8));
        EDGES.forEach(e => { ctx.strokeStyle = P.grey; ctx.lineWidth = 3; line(ctx, e.from[0], e.from[1], e.to[0], e.to[1]); });
        EDGES.forEach(e => edgeBox(ctx, e, tr, snap));
        [['x', [600, 226]], ['y', [600, 474]]].forEach(([s, p]) => { U.circle(ctx, p[0], p[1], 24, P.white, P.muted, 2); T(ctx, s, p[0], p[1] + 8, { font: MATH(24), align: 'center' }); });
        U.circle(ctx, 842, 350, 24, P.white, P.muted, 2); T(ctx, '+', 842, 359, { font: SANS(500, 28), align: 'center' });
        U.circle(ctx, 1030, 350, 20, P.white, P.muted, 2); T(ctx, 'f', 1030, 358, { font: MATH(24), align: 'center' });
        if (tr > 0 && tr < 1) T(ctx, 'training the curves…', 842, 160, { size: 18, color: P.dgreen, align: 'center' });
        T(ctx, 'KAN: a learnable curve on every edge,', 572, 556, { size: 20, weight: 500 });
        T(ctx, 'nodes only add', 572, 582, { size: 20, color: P.muted });
        if (form > 0) rich(ctx, [{ t: 'f', font: MATH(30), color: P.dgreen }, { t: '(', font: MATHR(30), color: P.dgreen }, { t: 'x', font: MATH(30), color: P.dgreen }, { t: ', ', font: MATHR(30), color: P.dgreen }, { t: 'y', font: MATH(30), color: P.dgreen },
          { t: ') = exp( sin ', font: MATHR(30), color: P.dgreen }, { t: 'πx', font: MATH(30), color: P.dgreen }, { t: ' + ', font: MATHR(30), color: P.dgreen }, { t: 'y', font: MATH(30), color: P.dgreen }, { t: '2', font: MATHR(20), color: P.dgreen, dy: -12 }, { t: ' )', font: MATHR(30), color: P.dgreen }], 842, 142, { align: 'center', alpha: form });
        return t < 5.0;
      }
    };
  })();

  // ---------------------------------------------------------------- Overview: the zoo through time
  HEROES.overview = (function () {
    // eras = years as a go-to choice (approximate, from milestones in docs/facts.md)
    const ROWS = [
      { id: 'hop', born: 1982, era: [1982, 1992], ms: [[2024, 'Nobel']] },
      { id: 'mlp', born: 1986, era: [1986, 2026], ms: [[2017, 'inside every Transformer']] },
      { id: 'cnn', born: 1989, era: [2012, 2026], ms: [[2012, 'AlexNet']] },
      { id: 'lstm', born: 1997, era: [2014, 2018], ms: [[2016, 'Translate'], [2024, 'floods']] },
      // optional 3rd element 'l' = put the label left of its dot (keeps two labels on one row apart)
      { id: 'ae', born: 2006, era: null, ms: [[2013, 'VAE', 'l'], [2022, 'latent diffusion']] },
      { id: 'gnn', born: 2009, era: [2017, 2026], ms: [[2023, 'GraphCast · GNoME']] },
      { id: 'gan', born: 2014, era: [2015, 2021], ms: [[2019, 'StyleGAN']] },
      { id: 'diff', born: 2015, era: [2020, 2026], ms: [[2024, 'AlphaFold 3']] },
      { id: 'attn', born: 2017, era: [2018, 2026], ms: [[2020, 'ViT · AlphaFold 2']] },
      { id: 'fno', born: 2020, era: null, ms: [[2022, 'FourCastNet']] },
      { id: 'ssm', born: 2023, era: null, ms: [[2024, 'hybrids']] },
      { id: 'kan', born: 2024, era: null, ms: [] }
    ];
    const Y0 = 1980, Y1 = 2026, XL = 236, XR = 1040, RY = 118, RH = 37;
    const xy = y => XL + (y - Y0) / (Y1 - Y0) * (XR - XL);
    return {
      draw(a, t) {
        const ctx = a.ctx;
        headline(ctx, 'The zoo through time', 'dot = born · thick bar = years as a go-to choice (approximate, from milestones) · colour = status today');
        for (let y = 1980; y <= 2020; y += 10) { ctx.strokeStyle = P.lgrey; ctx.lineWidth = 1; line(ctx, xy(y), RY - 12, xy(y), RY + ROWS.length * RH); T(ctx, String(y), xy(y), RY + ROWS.length * RH + 24, { font: MONO(16), color: P.muted, align: 'center' }); }
        T(ctx, '2026', xy(2026), RY + ROWS.length * RH + 24, { font: MONO(16, 500), color: P.ink, align: 'center' });
        ROWS.forEach((r, i) => {
          const A = BY[r.id], st = STATUS[A.status], y = RY + i * RH + RH / 2, g = ease(win(t, 0.1 + i * 0.07, 0.7 + i * 0.07));
          T(ctx, A.tile, XL - 18, y + 7, { size: 19, weight: 500, color: st.text, align: 'right', alpha: g });
          if (g <= 0) return;
          const xb = xy(r.born), xe = lerp(xb, xy(2026), g);
          ctx.strokeStyle = st.acc; ctx.lineWidth = 3; ctx.lineCap = 'round';
          if (A.status === 'rising') ctx.setLineDash([2, 6]);
          line(ctx, xb, y, xe, y); ctx.setLineDash([]);
          if (r.era) { const e0 = xy(r.era[0]), e1 = Math.min(xe, xy(r.era[1])); if (e1 > e0) { ctx.lineWidth = 12; line(ctx, e0, y, e1, y); } }
          ctx.lineCap = 'butt';
          U.circle(ctx, xb, y, 7, st.text === P.ink ? P.orange : st.text, P.white, 2);
          T(ctx, String(r.born), xb - 12, y + 6, { font: MONO(16), color: P.muted, align: 'right', alpha: r.born > 1983 ? g : 0 });
          let lastRight = -Infinity;
          r.ms.forEach(([yr, s, side]) => {
            if (xy(yr) > xe) return;
            ctx.font = SANS(400, 16); const wl = ctx.measureText(s).width, flip = side === 'l' || xy(yr) + 8 + wl > W - 14;
            const left = flip ? xy(yr) - 8 - wl : xy(yr) + 8, below = left < lastRight + 10;
            U.circle(ctx, xy(yr), y, 4, P.white, P.ink, 2);
            T(ctx, s, flip ? xy(yr) - 8 : xy(yr) + 8, below ? y + 21 : y - 9, { size: 16, color: P.ink, alpha: g, align: flip ? 'right' : 'left' });
            if (!below) lastRight = left + wl;
          });
        });
        let lx = XL;
        Object.values(STATUS).forEach(st => { box(ctx, lx, 596, 30, 10, 5, st.acc); T(ctx, st.label, lx + 38, 606, { size: 17, color: st.text, weight: 500 }); ctx.font = SANS(500, 17); lx += 38 + ctx.measureText(st.label).width + 34; });
        return t < 1.8;
      }
    };
  })();

  // ======================================================================
  // THE SLIDE
  // ======================================================================
  const GROUPS = [['work', ['mlp', 'cnn', 'ae', 'gnn', 'diff', 'attn']], ['moment', ['hop', 'lstm', 'gan']], ['rising', ['fno', 'ssm', 'kan']]];
  const GUIDE = [
    ['▦', 'A grid', 'images, maps, scans', 'CNN · Vision Transformer'],
    ['⋯', 'A sequence', 'text, DNA, signals', 'Transformer · Mamba · LSTM'],
    ['⬡', 'A graph', 'molecules, meshes, networks', 'GNN'],
    ['∿', 'A field', 'fluids, climate, PDEs', 'neural operator · GNN'],
    ['▤', 'A table', 'a spreadsheet', 'gradient-boosted trees, then an MLP'],
    ['✦', 'New samples', 'images, structures, ensembles', 'diffusion (GANs, VAEs)']
  ];

  Deck.register('archs', {
    init(slide) {
      this.slide = slide;
      this.root = slide.querySelector('[data-role=root]');
      this.heroEl = slide.querySelector('[data-role=hero]');
      this.cvHost = slide.querySelector('[data-role=cv]');
      this.ctl = slide.querySelector('[data-role=ctl]');
      this.card = slide.querySelector('[data-role=card]');
      this.rail = slide.querySelector('[data-role=rail]');
      this.film = slide.querySelector('[data-role=film]');
      this.vid = this.film && this.film.querySelector('video');
      this.cv = U.canvas(this.cvHost, { width: W, height: H, onresize: () => this.kick() });
      this.tip = U.tip(this.heroEl);
      const self = this;
      this.api = {
        get ctx() { return self.cv.ctx; }, w: W, h: H, tip: this.tip,
        restart: (keep) => this.restart(keep), redraw: () => this.kick(),
        cursor: c => { this.cv.canvas.style.cursor = c || ''; }
      };
      // tiles
      this.tiles = {};
      GROUPS.forEach(([st, ids]) => {
        const g = U.el('div', { class: 'ar-grp ' + st }, this.rail);
        U.el('div', { class: 'ar-gl', text: STATUS[st].label }, g);
        const row = U.el('div', { class: 'ar-tiles' }, g);
        ids.forEach(id => this.tiles[id] = this.makeTile(row, id, BY[id].tile, String(BY[id].year), ICON[id]));
      });
      const g = U.el('div', { class: 'ar-grp all' }, this.rail);
      U.el('div', { class: 'ar-gl', text: 'Overview' }, g);
      this.tiles.overview = this.makeTile(U.el('div', { class: 'ar-tiles' }, g), 'overview', 'Timeline', '1982–2026', ICON.overview);
      // canvas interaction
      const c = this.cv.canvas;
      c.addEventListener('mousemove', e => { if (this.hero && this.hero.move) { this.hero.move(this.api, this.cv.toLocal(e)); this.kick(); } });
      c.addEventListener('mouseleave', () => { if (this.hero && this.hero.out) { this.hero.out(this.api); this.kick(); } this.tip.hide(); });
      c.addEventListener('click', e => { if (this.hero && this.hero.click) this.hero.click(this.api, this.cv.toLocal(e)); });
      // the film (step 0, or K / J at any time)
      const go = slide.querySelector('[data-role=go]');
      if (go) go.addEventListener('click', e => { e.stopPropagation(); go.blur(); if (this.pos === 0) Deck.next(); else this.closeFilm(); });
      if (this.vid) {
        this.vid.addEventListener('play', () => { if (Deck.isActive(slide)) this.film.classList.add('on'); });
        this.vid.addEventListener('ended', () => this.film.classList.add('ended'));
      }
      this.pos = -1;
      this.select('cnn', true);
    },
    makeTile(parent, id, name, year, icon) {
      const b = U.el('button', { class: 'ar-tile', type: 'button', 'data-id': id, 'aria-pressed': 'false', title: id === 'overview' ? 'The zoo through time' : BY[id].full, html: `${icon}<span class="tn">${name}</span><span class="ty">${year}</span>` }, parent);
      b.addEventListener('click', () => { this.closeFilm(); this.select(id); b.blur(); });
      return b;
    },
    enter(slide) {
      this.active = true;
      this.setPos(slide._stepPos, true);
      this.kick();
    },
    leave() {
      this.active = false;
      cancelAnimationFrame(this._raf); this._raf = 0;
      if (this.vid && !this.vid.paused) this.vid.pause();
      this.tip.hide();
    },
    onStep(action, visible, elx) {
      if (!action || action.indexOf('ar:') !== 0) return;
      const s = elx.closest('.slide');
      this.setPos(s._steps.filter(x => x.classList.contains('visible')).length, !s.classList.contains('active'));
    },
    setPos(pos, entering) {
      const prev = this.pos; this.pos = pos;
      const key = ORDER[Math.min(pos, ORDER.length - 1)];
      this.root.classList.toggle('ready', pos >= 1);
      if (key === 'film') {
        this.select('cnn', true);
        this.openFilm(entering || prev !== 0 ? (entering ? 'play' : 'end') : 'keep');
      } else {
        this.closeFilm();
        this.select(key);
      }
    },
    // ---------- film ----------
    openFilm(mode) {
      if (!this.film || !this.vid) return;
      if (this.film.querySelector('.video-frame.no-video')) { this.film.classList.remove('on'); return; }
      this.film.classList.add('on');
      if (mode === 'play') {
        this.film.classList.remove('ended');
        try { this.vid.currentTime = 0; } catch (e) { /* not loaded yet */ }
        const p = this.vid.play(); if (p && p.catch) p.catch(() => {});
      } else if (mode === 'end') {
        this.vid.pause();
        const seekEnd = () => { try { this.vid.currentTime = Math.max(0, (this.vid.duration || 32) - 0.05); } catch (e) { /* ignore */ } };
        if (this.vid.readyState >= 1) seekEnd(); else this.vid.addEventListener('loadedmetadata', seekEnd, { once: true });
        this.film.classList.add('ended');
      }
    },
    closeFilm() {
      if (!this.film) return;
      this.film.classList.remove('on');
      if (this.vid && !this.vid.paused) this.vid.pause();
    },
    // ---------- heroes ----------
    select(id, quiet) {
      const hero = HEROES[id]; if (!hero) return;
      const changed = id !== this.id;
      this.id = id; this.hero = hero;
      Object.entries(this.tiles).forEach(([k, b]) => { b.classList.toggle('on', k === id); b.setAttribute('aria-pressed', k === id ? 'true' : 'false'); });
      this.renderCard(id);
      this.ctl.innerHTML = '';
      if (hero.controls) hero.controls(this.ctl, this.api);
      this.tip.hide(); this.cv.canvas.style.cursor = '';
      this.cvHost.setAttribute('aria-label', id === 'overview' ? 'Timeline of the architectures, coloured by status' : `${BY[id].name}: ${BY[id].wire}`);
      if (changed && !quiet) { this.heroEl.classList.remove('swap'); void this.heroEl.offsetWidth; this.heroEl.classList.add('swap'); }
      this.restart();
    },
    restart(keep) {
      if (this.hero && this.hero.start && !keep) this.hero.start(this.api);
      this.t0 = performance.now();
      this.kick();
    },
    kick() {
      if (this._raf || !this.cv) return;
      this._raf = requestAnimationFrame(now => this.tick(now));
    },
    tick(now) {
      this._raf = 0;
      if (!this.hero) return;
      const ctx = this.cv.ctx;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = P.white; ctx.fillRect(0, 0, this.cv.canvas.width, this.cv.canvas.height); ctx.restore();
      let live = false;
      try { live = this.hero.draw(this.api, Math.max(0, (now - this.t0) / 1000)); } catch (e) { console.error('[archs]', this.id, e); }
      if (live && this.active) this.kick();
    },
    // ---------- the info card ----------
    renderCard(id) {
      const c = this.card;
      if (id === 'overview') {
        c.style.setProperty('--acc', P.ink); c.style.setProperty('--acc-tint', P.lgrey); c.style.setProperty('--acc-text', P.ink);
        c.innerHTML = `<div class="ar-chips"><span class="ar-status">Field guide</span><span class="ar-year">1982 → 2026</span></div>
          <h3 class="ar-name sm">Match the wiring to your data</h3>
          <ul class="ar-guide">${GUIDE.map(([ic, h, d, r]) => `<li><span class="gi" aria-hidden="true">${ic}</span><span class="gh"><b>${h}</b><span>${d}</span></span><span class="gr">${r}</span></li>`).join('')}</ul>
          <p class="ar-tag">The wiring is a bet about your data. <b>Pick the bet that matches.</b></p>`;
      } else {
        const A = BY[id], st = STATUS[A.status];
        c.style.setProperty('--acc', st.acc); c.style.setProperty('--acc-tint', st.tint); c.style.setProperty('--acc-text', st.text);
        c.innerHTML = `<div class="ar-chips"><span class="ar-status">${st.label}</span><span class="ar-year">${A.since}</span></div>
          <h3 class="ar-name">${A.name}</h3><div class="ar-full">${A.full}</div>
          <div class="ar-k">The bet</div><p class="ar-bet">${A.bet}</p>
          <div class="ar-k">The wiring</div><p class="ar-wire">${A.wire}</p>
          <div class="ar-eqw"><img class="ar-eq" src="assets/eq/${A.eq}.svg" alt="${U.esc(A.eqAlt)}"></div>
          <div class="ar-famous">${A.famous.map(f => `<span class="tag">${f}</span>`).join('')}</div>
          <div class="ar-sci"><b>🔬 In science:</b> ${A.sci}</div>`;
      }
      c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
    }
  });
})();
