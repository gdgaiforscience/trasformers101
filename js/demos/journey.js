/* =====================================================================
   Chapter 3 demo: the journey of "hi" inside one inference server   (slide `journey`)
   Two lanes and a bus. The CPU (system RAM) does everything with TEXT: guardrail rules, the chat
   template, tokenizing and detokenizing. The GPU / TPU (VRAM / HBM) does everything with NUMBERS:
   embedding lookup, the 18 layers, the KV cache, picking the next token. PCIe carries token IDs
   (a few bytes each) between them, and guardrails wrap both ends.
   8 stations in 3 phases, plus a "local open weights" view with four variations (L1–L4).
   The pipeline is one short film: everything is drawn as a pure function of the film clock τ
   (seconds), so steps, going back, ↻ replay and ▶ play all are free.
   Real numbers: data/journey.js (Gemma 3 270M instruction-tuned, src/python/make_journey.py).
   Palette: Google light palette. Text stays WCAG AA: #202124 / #174EA6 / #0D652D / #A50E0E /
   #5F6368 on white or the light tints; yellow, blue, green and red are fills, strokes and glows.
   ===================================================================== */
(function () {
  'use strict';
  const { FONT, btn, seg, clamp, lerp, ease } = U;

  const G = {
    blue: '#4285F4', red: '#EA4335', yellow: '#FBBC04', green: '#34A853', black: '#202124', grey: '#9AA0A6',
    lgrey: '#F1F3F4', tBlue: '#174EA6', tRed: '#A50E0E', orange: '#E37400', tGreen: '#0D652D',
    lBlue: '#D2E3FC', lRed: '#FAD2CF', lYellow: '#FEEFC3', lGreen: '#CEEAD6', white: '#FFFFFF',
    line: '#DADCE0', muted: '#5F6368', bg: '#F8F9FA', cpuBg: '#EAF1FD', gpuBg: '#FEF7E1', busBg: '#F1F3F4',
    slab: '#E3E5E8', rail: '#C4C7CC'
  };
  const P = (x, y) => ({ x, y });

  // ---------------------------------------------------------------- layout (design units, 1728 × 480)
  const DW = 1728, DH = 480;
  const LN = { cpu: { y: 34, h: 162 }, bus: { y: 200, h: 40 }, gpu: { y: 244, h: 214 } };
  const SX = 1506;                                         // the server ends here; the phone sits outside
  const GATE = { 1: [104, 204], 8: [1396, 1496] }, GATE_Y = [38, 454];
  const SEP = [666, 1110];                                 // phase boundaries
  const ENTRY = P(52, 140), MSG_Y = 140;                   // the request arrives here, then passes the input gate
  const TPL_X = 224, TPL_Y = [118, 144, 170];              // chat-template text (15 px mono)
  const SLOT = { x: 459, pitch: 44, y: 120, dy: 38, w: 40, h: 30 };   // token-ID chips (centres)
  const DOWN_X = 684, UP_X = 1126, CH_Y = [182, 262];      // PCIe channels
  const EMB = { x: 702, y: 294, w: 46, h: 86 };            // embedding table (schematic: 12 visible rows)
  const SLAB = { x: 768, pitch: 12, w: 7, y: 294, h: 86 }; // the 18 layers
  const slabX = l => SLAB.x + l * SLAB.pitch;
  const SAMP = { x: 996, y: 294, w: 96, h: 86 };           // scores → pick
  const KV = { x: 768, y: 402, w: 211, h: 48 };            // KV cache: columns = layers, rows = tokens
  const DET = { x: 1150, y: 70, w: 236, h: 116 };          // detokenizer output
  const PHONE = { x: 1522, y: 40, w: 198, h: 432 };
  const ARC_Y = 283, SCX = SAMP.x + SAMP.w / 2, ECX = EMB.x + EMB.w / 2;
  const ARC = [P(SCX, SAMP.y), P(SCX, ARC_Y), P(ECX, ARC_Y), P(ECX, EMB.y)];
  const WAIT = P(SCX, ARC_Y);                              // a freshly picked ID sits here
  const FRONT = [EMB.x + EMB.w + 8, slabX(17) + SLAB.w + 10];   // where a vector's front edge runs through the layers
  const BL = 42;                                           // vector bar length (6 cells)
  const PHASES = [
    { x0: GATE[1][0], x1: SEP[0], label: 'PHASE 1 · PRE-PROCESSING' },
    { x0: SEP[0], x1: SEP[1], label: 'PHASE 2 · HAND-OFF & TRANSFORMATION' },
    { x0: SEP[1], x1: GATE[8][1], label: 'PHASE 3 · POST-PROCESSING & RETURN' }
  ];
  const KIND = {
    cpu: { stroke: G.blue, text: G.tBlue, fill: '#E8F0FE', badge: G.tBlue, num: G.white },
    gpu: { stroke: G.yellow, text: G.black, fill: G.lYellow, badge: G.yellow, num: G.black },
    bus: { stroke: G.grey, text: G.black, fill: G.lgrey, badge: G.muted, num: G.white },
    gate: { stroke: G.red, text: G.tRed, fill: G.lRed, badge: G.tRed, num: G.white }
  };
  const ST = [null,
    { kind: 'gate', hit: [104, 34, 204, 476] },
    { kind: 'cpu', x: 323, y: 48, label: 'chat template', hit: [208, 34, 432, 196] },
    { kind: 'cpu', x: 547, y: 48, label: 'tokenizer', hit: [432, 34, 666, 196] },
    { kind: 'bus', x: 702, y: 220, label: 'PCIe copy', left: true, hit: [666, 182, 840, 262] },
    { kind: 'gpu', x: 862, y: 258, label: 'embed + prefill', hit: [690, 262, 985, 458] },
    { kind: 'gpu', x: 1030, y: 258, label: 'decode loop', hit: [985, 244, 1110, 458] },
    { kind: 'cpu', x: 1268, y: 48, label: 'detokenizer', hit: [1110, 34, 1390, 262] },
    { kind: 'gate', hit: [1396, 34, 1496, 476] }
  ];
  const GRAM = { x: 986, y: 74, w: 118, h: 68 };           // local: grammar → token mask (CPU)
  const PINS = { L1: P(432, 48), L2: P(1098, 78), L3: P(650, 220), L4: P(735, 428) };

  // ---------------------------------------------------------------- film clock (seconds)
  const T = [0, 2.4, 4.4, 6.6, 8.2, 11.4, 17.4, 19.2, 21.6];   // station n plays over [T[n-1], T[n]]
  const LAPD = [1.1, 0.8, 0.6, 0.48, 0.42, 0.38, 0.36, 0.36, 0.36, 0.36, 0.36];   // decode laps speed up
  const LAP0 = []; LAPD.reduce((t, d, i) => { LAP0[i] = t; return t + d; }, T[5] + 0.2);
  const PRE = T[4];                                        // prefill: bars out 0–0.5 s, layers 0.5–2.4 s, pick 2.4–3.0 s
  const UPFLY = 0.55;                                      // flight time of a copied ID, sampler → detokenizer

  function along(pts, f) {                                 // point at fraction f of a polyline's length
    f = clamp(f, 0, 1);
    const lens = []; let total = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); lens.push(d); total += d; }
    let s = f * total;
    for (let i = 0; i < lens.length; i++) {
      if (s <= lens[i] || i === lens.length - 1) { const q = lens[i] ? clamp(s / lens[i], 0, 1) : 0; return P(lerp(pts[i].x, pts[i + 1].x, q), lerp(pts[i].y, pts[i + 1].y, q)); }
      s -= lens[i];
    }
    return pts[pts.length - 1];
  }
  const rowOf = id => ((id * 2654435761) >>> 0) % 12;      // schematic table row (the real table has 262,144)
  const rowY = id => EMB.y + 4 + rowOf(id) * 6.5 + 3.25;
  const pct = p => (p >= 0.9995 ? '100' : (100 * p).toFixed(1)) + '%';
  const fmtB = n => n < 1e3 ? n + ' B' : n < 1e6 ? (n / 1e3).toFixed(0) + ' KB' : n < 1e9 ? (n / 1e6).toFixed(0) + ' MB' : (n / 1e9).toFixed(1) + ' GB';
  const cellColor = (id, c) => { const r = U.rng(id * 31 + c * 7 + 11)(); return r < 0.5 ? U.mix('#ffffff', G.blue, 0.25 + 1.3 * (0.5 - r)) : U.mix('#ffffff', G.yellow, 0.25 + 1.3 * (r - 0.5)); };
  const idW = id => Math.max(38, String(id).length * 8.6 + 16);

  // ---------------------------------------------------------------- canvas primitives
  function tx(ctx, s, x, y, size, color, o) {
    o = o || {};
    ctx.save();
    ctx.font = `${o.weight || 400} ${size}px ${o.mono ? FONT.mono : FONT.sans}`;
    ctx.fillStyle = color; ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'alphabetic';
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (o.ls && 'letterSpacing' in ctx) ctx.letterSpacing = o.ls;
    ctx.fillText(s, x, y);
    ctx.restore();
  }
  function box(ctx, x, y, w, h, r, fill, stroke, lw, dash) {
    U.roundRect(ctx, x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.save(); ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.5; if (dash) ctx.setLineDash(dash); ctx.stroke(); ctx.restore(); }
  }
  // a rounded chip centred on (x, y); o: {fill, stroke, lw, color, size, weight, mono, alpha, glow, sy (vertical squash)}
  function chip(ctx, x, y, w, h, label, o) {
    o = o || {};
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (o.sy != null) { ctx.translate(x, y); ctx.scale(1, Math.max(0.001, o.sy)); ctx.translate(-x, -y); }
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 14; }
    U.roundRect(ctx, x - w / 2, y - h / 2, w, h, o.r || 7);
    ctx.fillStyle = o.fill || G.white; ctx.fill();
    ctx.shadowBlur = 0;
    if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw || 1.7; ctx.stroke(); }
    if (label != null && label !== '') {
      ctx.font = `${o.weight || 600} ${o.size || 14}px ${o.mono === false ? FONT.sans : FONT.mono}`;
      ctx.fillStyle = o.color || G.black; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y + 1);
    }
    ctx.restore();
  }
  function check(ctx, x, y, r, a) {                         // green ✓ in a circle
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    ctx.translate(x, y); ctx.scale(0.6 + 0.4 * a, 0.6 + 0.4 * a);
    U.circle(ctx, 0, 0, r, G.green, null);
    ctx.strokeStyle = G.white; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-r * 0.45, 0); ctx.lineTo(-r * 0.1, r * 0.35); ctx.lineTo(r * 0.5, -r * 0.35); ctx.stroke();
    ctx.restore();
  }
  function poly(ctx, pts, color, lw, dash, offset) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (dash) { ctx.setLineDash(dash); ctx.lineDashOffset = offset || 0; }
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke(); ctx.restore();
  }
  function head(ctx, x, y, dir, color, s) {                 // small arrow head pointing dir
    s = s || 6;
    const a = { down: Math.PI / 2, up: -Math.PI / 2, left: Math.PI, right: 0 }[dir];
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s * 0.7, -s * 0.75); ctx.lineTo(-s * 0.7, s * 0.75); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function caption(ctx, lines, x, y, o) {                   // small centred multi-line note
    o = o || {};
    lines.forEach((s, i) => tx(ctx, s, x, y + i * (o.lh || 17), o.size || 13.5, o.color || G.muted, { align: 'center', weight: o.weight || 400, alpha: o.alpha }));
  }

  // ---------------------------------------------------------------- the cards (HTML side)
  const esc = U.esc;
  const chips = list => list.map(([cls, txt]) => `<span class="jr-chip ${cls}">${txt}</span>`).join('');
  const PH = ['', 'Phase 1 · pre-processing', 'Phase 1 · pre-processing', 'Phase 1 · pre-processing',
    'Phase 2 · hand-off &amp; transformation', 'Phase 2 · hand-off &amp; transformation', 'Phase 2 · hand-off &amp; transformation',
    'Phase 3 · post-processing &amp; return', 'Phase 3 · post-processing &amp; return'];
  function tokChips(D) {
    return D.prompt.tokens.map((t, i) => `<span class="jr-tok${t === 'hi' ? ' u' : ''}"><b>${esc(t === '\n' ? '↵' : t)}</b><small>${D.prompt.ids[i]}</small></span>`).join('');
  }
  function stepCards(D) {
    const S = D.reply.steps, stop = D.reply.stop, kvKB = Math.round(D.kvBytesPerToken / 1e3);
    const nP = D.prompt.ids.length, passes = D.reply.passes, upN = S.length + 1, V = D.config.vocab.toLocaleString('en-US');
    const gb = (passes * D.weightsBytesBf16 / 1e9).toFixed(1), wGB = (D.weightsBytesBf16 / 1e9).toFixed(2);
    const reply = esc(D.reply.text.trim()), tm = D.timing;
    return {
      0: { head: [['ph', 'Inside one inference server']], title: 'One request, three phases, eight stations',
        text: 'The <b>CPU</b> does everything with text: safety rules, the chat template, tokens in and out. The <b>GPU</b> (or a TPU, or a laptop’s NPU) does the numbers: embedding lookups, matrix maths against the weights, picking the next token.',
        foot: 'Guardrails wrap both ends. Press → to follow “hi”, or click any station to replay it.',
        dl: 'The plan',
        data: `<ol class="jr-phases"><li><b>Pre-processing</b><span>CPU (+ an optional classifier GPU): guardrail → template → tokens</span></li><li><b>Hand-off &amp; transformation</b><span>GPU memory: PCIe copy → prefill → decode loop</span></li><li><b>Post-processing &amp; return</b><span>GPU → CPU: detokenize → guardrail → your screen</span></li></ol>` },
      1: { head: [['ph', PH[1]], ['cpu', 'CPU'], ['gpu', 'GPU, optional'], ['grd', 'guardrail']], title: 'Input guardrail',
        text: 'Before the main model runs, fast rule filters on the CPU and a small safety classifier on a GPU inspect the raw prompt for policy violations, personal data or prompt injection.',
        foot: 'If it trips, the main model never runs: the Gemini API reports the input as blocked (e.g. for safety, or as a jailbreak attempt) instead of replying.',
        dl: 'The data now: raw text in a JSON request',
        data: `<div class="jr-code">{"role": "user", "content": "<mark>hi</mark>"}</div><div class="jr-seq"><span>rule filters ✓</span><i>→</i><span>safety classifier ✓</span><i>→</i><span class="ok">pass</span></div>` },
      2: { head: [['ph', PH[2]], ['cpu', 'CPU']], title: 'Chat template',
        text: 'The CPU wraps your message, and any system instructions, in the role tags the model was trained with. Still plain text: no numbers yet.',
        foot: 'Gemma 1–3 have no system role (instructions go into the first user turn); Gemma 4 adds one. Skipping the template isn’t a jailbreak: it’s formatting, not a guardrail.',
        dl: 'The data now: one formatted string',
        data: `<div class="jr-code"><i>&lt;start_of_turn&gt;</i>user<s>↵</s><br><mark>hi</mark><i>&lt;end_of_turn&gt;</i><s>↵</s><br><i>&lt;start_of_turn&gt;</i>model<s>↵</s></div>` },
      3: { head: [['ph', PH[3]], ['cpu', 'CPU']], title: 'Tokenization',
        text: `The tokenizer splits the text into sub-word pieces (BPE, from a vocabulary of ${V}) and swaps each for its number: “hi” is ${D.prompt.ids[D.prompt.tokens.indexOf('hi')]}. Result: ${nP} integers in system RAM.`,
        foot: `Measured on one Xeon core: ${tm.hiMicros} µs for this prompt, ${(tm.longMicros / 1000).toFixed(1)} ms for a ${tm.longTokens.toLocaleString('en-US')}-token page. &lt;bos&gt; (2) marks the start.`,
        dl: `The data now: ${nP} token IDs`,
        data: `<div class="jr-toks">${tokChips(D)}</div>` },
      4: { head: [['ph', PH[4]], ['bus', 'CPU → GPU over PCIe']], title: 'PCIe copy to the GPU',
        text: `The ${nP} IDs, ${D.prompt.bytesInt32} bytes as 32-bit integers, are copied by DMA from system RAM across the PCIe bus into GPU memory. From here on it’s numbers only: the GPU never sees a letter.`,
        foot: 'PCIe 5.0 ×16 carries about 64 GB/s each way. Grace-Blackwell superchips link CPU and GPU with NVLink-C2C instead.',
        dl: `The data now: ${D.prompt.bytesInt32} bytes in VRAM`,
        data: `<div class="jr-code">int32[${nP}] = [${D.prompt.ids.join(', ')}]</div><div class="jr-seq"><span>system RAM</span><i>→ PCIe (DMA) →</i><span class="gpu">GPU memory</span></div>` },
      5: { head: [['ph', PH[5]], ['gpu', 'GPU']], title: 'Embedding lookup + prefill',
        text: `Each ID picks one row of the ${V} × ${D.config.hidden} embedding table: ${nP} vectors of ${D.config.hidden} numbers. All ${nP} go through the ${D.config.layers} layers at once, and every layer stores each token’s keys and values in the KV cache.`,
        foot: `Only the last token’s output picks the next token. The weights (${(D.params / 1e6).toFixed(0)} million numbers, ${wGB} GB in bf16) are loaded once and stay in VRAM.`,
        dl: `The data now: vectors, a cache, ${V} scores`,
        data: `<div class="jr-seq wrap"><span class="gpu">${nP} × ${D.config.hidden} numbers</span><i>→</i><span class="gpu">${D.config.layers} layers, in parallel</span><i>→</i><span class="gpu">KV cache ${nP} × ${kvKB} KB</span><i>→</i><span class="gpu">${V} scores</span><i>→</i><span class="ok">#${S[0].id} “${esc(S[0].disp)}” ${pct(S[0].p)}</span></div>` },
      6: { head: [['ph', PH[6]], ['gpu', 'GPU']], title: 'Autoregressive decode loop',
        text: `Pick one ID from the scores, feed it straight back in, repeat: one token per lap, every lap running all ${D.config.layers} layers and adding one row to the KV cache. ${S.length} laps, until the model picks &lt;end_of_turn&gt;.`,
        foot: 'Weights, activations and the KV cache never leave VRAM. Many engines keep the new ID on the GPU; llama.cpp has traditionally sampled on the CPU. Servers batch many users into every lap.',
        dl: 'The data now: one ID per lap (greedy pick, its probability)',
        data: `<div class="jr-probs">${S.map(s => `<span><b>${esc(s.disp.trim() || '␣')}</b>${pct(s.p)}</span>`).join('')}<span class="stop"><b>&lt;end_of_turn&gt;</b>${pct(stop.p)} · stop</span></div>` },
      7: { head: [['ph', PH[7]], ['bus', 'GPU → CPU'], ['cpu', 'CPU']], title: 'Copy back + detokenize',
        text: 'Each new ID is copied back to system RAM as soon as it’s picked, and the CPU’s detokenizer turns it straight into text. That’s why replies appear word by word. Control tokens like &lt;end_of_turn&gt; are dropped.',
        foot: 'It holds back half-finished characters: an emoji can arrive as several byte tokens, because Gemma’s tokenizer falls back to raw bytes.',
        dl: `The data now: ${upN} IDs back, one at a time`,
        data: `<div class="jr-probs map">${S.map(s => `<span><small>${s.id}</small><b>${esc(s.disp)}</b></span>`).join('')}<span class="stop"><small>${stop.id}</small><b><s>&lt;end_of_turn&gt;</s></b></span></div>` },
      8: { head: [['ph', PH[8]], ['cpu', 'CPU'], ['gpu', 'GPU, optional'], ['grd', 'guardrail']], title: 'Output guardrail + delivery',
        text: 'Before anything reaches your screen, the decoded stream is checked again for leaked secrets, personal data, toxic language or broken formatting. Then it streams to the app.',
        foot: 'Output filters can stop a reply mid-stream; the Gemini API then says why, e.g. SAFETY, or SPII for personal data.',
        dl: 'The whole trip, in numbers',
        data: `<div class="jr-bubble">${reply}</div><div class="jr-seq wrap"><span>${passes} passes (1 prefill + ${passes - 1} decode)</span><span>${nP + upN} IDs over PCIe</span><span class="gpu">${gb} GB of weights read</span></div>` }
    };
  }
  function localCards(D) {
    const tm = D.timing, t2 = D.turn2;
    return {
      summary: { head: [['loc', 'Local open weights'], ['ph', 'e.g. Gemma on your laptop']], title: 'Running it yourself: same pipeline, four differences',
        grid: [
          ['L1', 'Template + tokenizer in the server', `llama.cpp, Ollama, LM Studio or vLLM take OpenAI-style JSON, then template and tokenize on CPU threads: ${tm.hiMicros} µs for “hi”.`],
          ['L2', 'Grammar instead of guardrails', 'No safety classifier by default. A grammar compiled on the CPU masks invalid tokens at every step: valid JSON, not safety.'],
          ['L3', 'Memory depends on the hardware', 'PCIe DMA on a discrete GPU; zero-copy shared RAM on Apple silicon; a model too big for VRAM makes every token pay.'],
          ['L4', 'Prefix caching', `Turn 2 resends all ${t2.total} tokens. The ${t2.reused} already in the KV cache are reused; only ${t2.new} are computed.`]
        ] },
      L1: { head: [['loc', 'Local · L1'], ['cpu', 'CPU']], title: 'Templating + BPE tokenization inside the server',
        text: 'Local servers (llama.cpp, Ollama, LM Studio, vLLM) receive raw OpenAI-style JSON, apply the chat template that ships with the model (written in Jinja) and run the BPE tokenizer on CPU worker threads, all in one process.',
        foot: `Gemma’s tokenizer is SentencePiece ${D.tokenizer.type} with byte fallback: ${D.tokenizer.pieces.toLocaleString('en-US')} pieces, and any UTF-8 text still tokenizes.`,
        dl: `Measured: ${esc(tm.lib)}`,
        data: `<div class="jr-code">POST /v1/chat/completions<br>{"messages": [{"role": "user", "content": "hi"}]}</div><table class="jr-tab"><tr><td>“hi”, templated</td><td>${tm.hiTokens} tokens</td><td><b>${tm.hiMicros} µs</b></td></tr><tr><td>a page of the talk script</td><td>${tm.longTokens.toLocaleString('en-US')} tokens</td><td><b>${(tm.longMicros / 1000).toFixed(1)} ms</b></td></tr></table>` },
      L2: { head: [['loc', 'Local · L2'], ['cpu', 'CPU mask'], ['gpu', 'GPU scores']], title: 'Grammar-constrained decoding instead of a guardrail',
        text: 'No safety classifier by default. Instead you can force the structure: a grammar or JSON schema compiled on the CPU into a state machine gives the allowed tokens at every step, and every other score is set to −∞ before picking.',
        foot: 'This guarantees valid JSON, not safe content. For safety, add a classifier yourself, e.g. ShieldGemma.',
        dl: 'Where you find it',
        data: `<ul class="jr-list"><li><b>llama.cpp</b> <span class="mono">grammar</span>, <span class="mono">json_schema</span></li><li><b>vLLM</b> XGrammar or llguidance backends</li><li><b>SGLang</b> compressed finite-state machines</li><li><b>Ollama</b> <span class="mono">format</span> with a JSON schema</li></ul>` },
      L3: { head: [['loc', 'Local · L3'], ['bus', 'CPU ↔ GPU']], title: 'Memory transfers depend on the hardware',
        text: 'Discrete GPU: the IDs cross PCIe by DMA, a few bytes. Unified memory (Apple silicon): CPU and GPU share one RAM, so there is nothing to copy. Model bigger than VRAM: part of it lives in CPU RAM, and every token pays.',
        foot: 'llama.cpp runs the leftover layers on the CPU; offloading engines stream weights over PCIe for every token. Either way, speed collapses.',
        dl: 'Why spilling hurts',
        data: `<table class="jr-tab"><tr><td>PCIe 5.0 ×16</td><td><b>≈ 64 GB/s</b> each way</td></tr><tr><td>HBM on one Blackwell GPU</td><td><b>≈ 8 TB/s</b></td></tr><tr><td>Apple silicon, shared memory</td><td>“CPU and GPU share access”</td></tr></table>` },
      L4: { head: [['loc', 'Local · L4'], ['gpu', 'KV cache in VRAM']], title: 'Prefix caching for multi-turn speed',
        text: 'Every turn resends the whole conversation. The engine matches the incoming token IDs against what is already in the KV cache and only computes the new part: vLLM hashes blocks of IDs, SGLang keeps a radix tree, llama.cpp’s <span class="mono">cache_prompt</span> compares prefixes.',
        foot: 'The cached keys and values never left VRAM, and the answer doesn’t change.',
        dl: `Turn 2: “${esc(t2.user)}”`,
        data: `<div class="jr-split"><i style="flex:${t2.reused}">${t2.reused} reused</i><b style="flex:${t2.new}">${t2.new} new</b></div><p class="jr-mini">${t2.total} tokens = turn 1’s prompt and reply (${t2.reused}, already cached) + the new question (${t2.new}).</p>` }
    };
  }

  // ---------------------------------------------------------------- the demo
  Deck.register('journey', {
    init(slide) {
      this.D = U.data('journey');
      this.slideEl = slide;
      const stage = slide.querySelector('[data-role=stage]');
      this.cardEl = slide.querySelector('[data-role=card]');
      this.meterEl = slide.querySelector('[data-role=meter]');
      if (!this.D) { U.missing(stage); return; }
      const D = this.D;
      this.S = D.reply.steps;                         // 11 reply tokens (the last is "\n")
      this.OUT = this.S.concat([D.reply.stop]);       // 12 IDs come back: the reply + <end_of_turn>
      this.CARDS = stepCards(D); this.LC = localCards(D);
      this.sampled = this.OUT.map((_, j) => (j === 0 ? PRE + 2.95 : LAP0[j - 1] + 0.92 * LAPD[j - 1]));
      this.upDep = this.OUT.map((_, j) => (j === 0 ? T[5] + 0.02 : this.sampled[j] + 0.04));
      this.cv = U.canvas(stage, { onresize: () => this.draw() });
      const ctl = slide.querySelector('[data-role=ctl]');
      this.modeSeg = seg(ctl, [{ value: 'hosted', label: 'Hosted API' }, { value: 'local', label: 'Local open weights' }], 'hosted', v => this.setMode(v));
      this.playBtn = btn(ctl, '▶ play all', () => this.togglePlayAll());
      btn(ctl, '↻ replay', () => this.replay());
      this.cv.canvas.addEventListener('click', e => this.onClick(e));
      this.cv.canvas.addEventListener('mousemove', e => { this.cv.canvas.style.cursor = this.hit(e) ? 'pointer' : 'default'; });
      this.cardEl.addEventListener('click', e => { const b = e.target.closest('[data-l]'); if (b) this.showLocal(b.dataset.l); });
      this.tau = 0; this.target = 0; this.playing = false; this.all = false; this.cur = 0; this.mode = 'hosted'; this.focus = null;
      this.time = 0; this.lt = 0;
      this.loop = U.animator(dt => this.tick(dt));
      this.layoutReply();
      this.showCard(0); this.draw(); this.updateMeter();
    },
    enter(slide) { if (!this.D) return; if (slide._stepPos === 0) this.applyStage(0, false); this.loop.start(); },
    leave() { if (this.loop) this.loop.stop(); },
    onStep(a, vis, elx) {
      if (!this.D) return;
      const slide = elx.closest('.slide');
      const n = slide._steps.filter(s => s.classList.contains('visible')).length;
      this.applyStage(n, vis && slide.classList.contains('active'));
    },

    // ------------------------------------------------------------ state
    applyStage(n, animate) {
      this.all = false;
      if (n >= 9) { this.setMode('local'); return; }
      if (this.mode !== 'hosted') this.setMode('hosted', true);
      if (n === 0) { this.tau = 0; this.target = 0; this.playing = false; this.cur = 0; }
      else if (animate) { this.loop.start(); this.tau = T[n - 1]; this.target = T[n]; this.playing = true; this.cur = n; }
      else { this.tau = T[n]; this.target = T[n]; this.playing = false; this.cur = n; }
      this.showCard(this.cur); this.updatePlayBtn(); this.draw(); this.updateMeter();
    },
    setMode(m, quiet) {
      this.mode = m; this.focus = null; this.lt = 0;
      if (this.modeSeg) this.modeSeg.set(m, true);
      if (m === 'local') { this.all = false; this.playing = false; this.tau = T[8]; this.target = T[8]; this.showLocal('summary'); }
      else if (!quiet) {                              // back to hosted from the toggle: restore the deck's step
        const n = this.slideEl._steps ? Math.min(8, this.slideEl._steps.filter(s => s.classList.contains('visible')).length) : 0;
        this.tau = T[n]; this.target = T[n]; this.cur = n; this.showCard(n);
      }
      this.updatePlayBtn(); this.draw(); this.updateMeter();
    },
    playStation(n) {
      if (this.mode !== 'hosted') this.setMode('hosted', true);
      this.all = false; this.cur = n; this.tau = T[n - 1]; this.target = T[n]; this.playing = true;
      this.loop.start(); this.showCard(n); this.updatePlayBtn();
    },
    togglePlayAll() {
      if (this.all && this.playing) { this.playing = false; this.updatePlayBtn(); return; }
      if (this.mode !== 'hosted') this.setMode('hosted', true);
      if (!this.all || this.tau >= T[8]) this.tau = 0;
      this.all = true; this.target = T[8]; this.playing = true; this.loop.start(); this.updatePlayBtn();
    },
    replay() {
      if (this.mode === 'local') { this.lt = 0; return; }
      if (this.cur >= 1) this.playStation(this.cur); else this.togglePlayAll();
    },
    updatePlayBtn() { if (this.playBtn) this.playBtn.innerHTML = this.all && this.playing ? '⏸ pause' : '▶ play all'; },
    showLocal(k) {
      this.focus = k === 'summary' ? null : k; this.lt = 0;
      this.renderCard('L:' + k, k === 'summary' ? this.LC.summary : this.LC[k]);
      this.draw();
    },
    showCard(n) { this.renderCard('S:' + n, this.CARDS[n], n); },
    renderCard(key, c, n) {
      if (!this.cardEl || this._card === key) return;
      this._card = key;
      let html;
      if (c.grid) {
        html = `<div class="jr-l wide"><div class="jr-head">${chips(c.head)}</div><h3 class="jr-title">${c.title}</h3>` +
          `<div class="jr-grid">${c.grid.map(([k, t, s]) => `<button class="jr-lc" data-l="${k}"><span class="jr-pin">${k}</span><b>${t}</b><span>${s}</span></button>`).join('')}</div></div>`;
      } else {
        const num = n >= 1 ? `<span class="jr-n k-${ST[n].kind}">${n}</span>` : (key.startsWith('L:') ? `<span class="jr-pin big">${key.slice(2)}</span>` : '');
        html = `<div class="jr-l"><div class="jr-head">${chips(c.head)}</div><h3 class="jr-title">${num}${c.title}</h3><p class="jr-text">${c.text}</p>` +
          `${c.foot ? `<p class="jr-foot">${c.foot}</p>` : ''}</div><div class="jr-r"><div class="jr-dl">${c.dl}</div>${c.data}</div>`;
      }
      this.cardEl.innerHTML = html;
      this.cardEl.classList.remove('pop'); void this.cardEl.offsetWidth; this.cardEl.classList.add('pop');
    },
    tick(dt) {
      this.time += dt; this.lt += dt;
      if (this.playing) {
        this.tau = Math.min(this.target, this.tau + dt);
        if (this.all) { let k = 1; while (k < 8 && this.tau >= T[k]) k++; if (k !== this.cur) { this.cur = k; this.showCard(k); } }
        if (this.tau >= this.target) { this.playing = false; this.updatePlayBtn(); }
      }
      this.draw(); this.updateMeter();
    },
    pr(a, b) { return clamp((this.tau - a) / (b - a), 0, 1); },

    // ------------------------------------------------------------ live counters (HTML bar)
    counts() {
      const t = this.tau, D = this.D;
      let down = 0; for (let k = 0; k < D.prompt.ids.length; k++) if (t >= T[3] + 0.08 * k + 0.75) down++;
      let up = 0; this.upDep.forEach(d => { if (t >= d + UPFLY) up++; });
      let passes = t >= PRE + 2.4 ? 1 : 0; LAP0.forEach((t0, i) => { if (t >= t0 + 0.8 * LAPD[i]) passes++; });
      return { down, up, passes };
    },
    updateMeter() {
      if (!this.meterEl) return;
      const c = this.counts(), D = this.D;
      const sig = `${c.down}|${c.up}|${c.passes}`;
      if (sig === this._msig) return;
      this._msig = sig;
      const gb = c.passes * D.weightsBytesBf16;
      this.meterEl.innerHTML = `<span><i class="sw bus"></i>across PCIe <b>↓ ${4 * c.down} B · ↑ ${4 * c.up} B</b></span>` +
        `<span><i class="sw gpu"></i>weights read inside the GPU <b>${c.passes ? fmtB(gb) : '0 GB'}</b> <em>${c.passes} pass${c.passes === 1 ? '' : 'es'} × ${(D.weightsBytesBf16 / 1e9).toFixed(2)} GB</em></span>`;
    },

    // ------------------------------------------------------------ hit testing
    toDesign(e) { const m = this.cv.toLocal(e), v = this.view || { s: 1, ox: 0, oy: 0 }; return P((m.x - v.ox) / v.s, (m.y - v.oy) / v.s); },
    hit(e) {
      if (!this.D) return null;
      const p = this.toDesign(e);
      if (this.mode === 'local') {
        for (const k in PINS) { const q = PINS[k]; if (Math.abs(p.x - q.x) < 18 && Math.abs(p.y - q.y) < 14) return { local: k }; }
        if (p.x > GRAM.x && p.x < GRAM.x + GRAM.w && p.y > GRAM.y && p.y < GRAM.y + GRAM.h) return { local: 'L2' };
      }
      for (let n = 1; n <= 8; n++) { const [x0, y0, x1, y1] = ST[n].hit; if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1) return { n }; }
      return null;
    },
    onClick(e) {
      const h = this.hit(e);
      if (!h) return;
      if (h.local) this.showLocal(h.local); else this.playStation(h.n);
    },

    // ------------------------------------------------------------ reply layout (where each detokenized piece lands)
    layoutReply() {
      const ctx = this.cv.ctx; ctx.save(); ctx.font = `18px ${FONT.sans}`;
      let x = DET.x + 12, line = 0; const x1 = DET.x + DET.w - 10;
      this.pieces = this.S.map(s => {
        const nl = s.token === '\n';
        let str = nl ? '↵' : s.token;
        let w = nl ? 13 : ctx.measureText(str).width;
        if (x + w > x1) { line++; x = DET.x + 12; if (str.startsWith(' ')) { str = str.slice(1); w = ctx.measureText(str).width; } }
        const p = { str, nl, x, y: DET.y + 44 + line * 26, w };
        x += w; return p;
      });
      this.stopPos = P(DET.x + 12, DET.y + 44 + (line + 1) * 26);
      ctx.restore();
    },

    // ------------------------------------------------------------ canvas
    draw() {
      if (!this.cv || !this.D) return;
      const { ctx, w, h } = this.cv;
      ctx.save();
      ctx.fillStyle = G.bg; ctx.fillRect(0, 0, w, h);
      const s = Math.min(w / DW, h / DH), ox = (w - DW * s) / 2, oy = (h - DH * s) / 2;
      this.view = { s, ox, oy };
      ctx.translate(ox, oy); ctx.scale(s, s);
      this.drawLanes(ctx);
      this.drawPhases(ctx);
      this.drawFixtures(ctx);
      this.drawKV(ctx);
      if (this.mode === 'local') this.drawGrammar(ctx);
      this.drawStations(ctx);
      this.drawGate(ctx, 1); this.drawGate(ctx, 8);
      this.drawWrap(ctx);
      this.drawPhone(ctx);
      this.drawFilm(ctx);
      if (this.mode === 'local') this.drawLocal(ctx);
      ctx.restore();
    },
    drawLanes(ctx) {
      box(ctx, 0, LN.cpu.y, SX, LN.cpu.h, 14, G.cpuBg);
      ctx.fillStyle = G.busBg; ctx.fillRect(0, LN.bus.y, SX, LN.bus.h);
      box(ctx, 0, LN.gpu.y, SX, LN.gpu.h, 14, G.gpuBg);
      ctx.save(); ctx.strokeStyle = G.rail; ctx.lineWidth = 2;
      [LN.bus.y + 7, LN.bus.y + LN.bus.h - 7].forEach(y => { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SX, y); ctx.stroke(); });
      ctx.restore();
      tx(ctx, 'CPU', 12, LN.cpu.y + 34, 26, G.tBlue, { weight: 700 });
      tx(ctx, 'the text', 12, LN.cpu.y + 54, 14, G.tBlue, { weight: 700 });
      tx(ctx, 'system RAM', 12, LN.cpu.y + 71, 12, G.muted);
      tx(ctx, 'PCIe', 12, LN.bus.y + 26, 15, G.black, { weight: 700 });
      tx(ctx, 'GPU', 12, LN.gpu.y + 34, 26, G.black, { weight: 700 });
      tx(ctx, 'the maths', 12, LN.gpu.y + 54, 14, G.black, { weight: 700 });
      tx(ctx, 'or TPU, NPU', 12, LN.gpu.y + 71, 12, G.muted);
      tx(ctx, 'VRAM / HBM', 12, LN.gpu.y + 86, 12, G.muted);
    },
    phaseOf(n) { return n <= 0 ? 0 : n <= 3 ? 1 : n <= 6 ? 2 : n <= 8 ? 3 : 0; },
    drawPhases(ctx) {
      const act = this.mode === 'local' ? 0 : this.phaseOf(this.cur);
      ctx.save(); ctx.strokeStyle = G.line; ctx.lineWidth = 1.5; ctx.setLineDash([5, 6]);
      SEP.forEach(x => { ctx.beginPath(); ctx.moveTo(x, 28); ctx.lineTo(x, GATE_Y[1] + 2); ctx.stroke(); });
      ctx.restore();
      PHASES.forEach((p, i) => {
        const on = act === i + 1, cx = (p.x0 + p.x1) / 2;
        tx(ctx, p.label, cx, 18, 13.5, on ? G.black : G.muted, { weight: on ? 700 : 600, align: 'center', ls: '1.3px' });
        if (on) {
          ctx.save(); ctx.font = `700 13.5px ${FONT.sans}`; if ('letterSpacing' in ctx) ctx.letterSpacing = '1.3px';
          const tw = ctx.measureText(p.label).width; ctx.restore();
          box(ctx, cx - tw / 2, 23, tw, 3, 1.5, G.blue);
        }
      });
    },
    drawFixtures(ctx) {
      const t = this.tau, D = this.D, local = this.mode === 'local';
      // what each lane is doing while the other one works
      caption(ctx, ['model weights (' + (D.weightsBytesBf16 / 1e9).toFixed(2) + ' GB)', 'loaded at start-up, waiting'], (GATE[1][1] + SEP[0]) / 2, 340);
      caption(ctx, ['meanwhile the CPU schedules', 'and launches each GPU step'], local ? 868 : (SEP[0] + SEP[1]) / 2, 116);
      caption(ctx, local ? ['idle until', 'your next turn'] : ['free for the next', 'requests in the batch'], (SEP[1] + GATE[8][0]) / 2, 340);
      // PCIe channels (down: IDs to the GPU; up: each new ID back to the CPU)
      [[DOWN_X, 'down', 4], [UP_X, 'up', 7]].forEach(([x, dir, n]) => {
        const hot = !local && (this.cur === n || (n === 7 && this.cur === 6));
        box(ctx, x - 11, CH_Y[0], 22, CH_Y[1] - CH_Y[0], 9, G.white, hot ? G.black : G.grey, hot ? 2.2 : 1.6);
        head(ctx, x, dir === 'down' ? 226 : 214, dir, hot ? G.black : G.grey, 6.5);
      });
      tx(ctx, '↑ each new ID', UP_X + 20, LN.bus.y + 25, 12.5, G.muted);
      // embedding table, the 18 layers, the sampler
      box(ctx, EMB.x, EMB.y, EMB.w, EMB.h, 6, G.white, '#BDC1C6', 1.2);
      ctx.save(); ctx.strokeStyle = '#ECEEF1'; ctx.lineWidth = 1;
      for (let r = 1; r < 12; r++) { const y = EMB.y + 4 + r * 6.5; ctx.beginPath(); ctx.moveTo(EMB.x + 4, y); ctx.lineTo(EMB.x + EMB.w - 4, y); ctx.stroke(); }
      ctx.restore();
      for (let l = 0; l < 18; l++) box(ctx, slabX(l), SLAB.y, SLAB.w, SLAB.h, 2, G.slab);
      box(ctx, SAMP.x, SAMP.y, SAMP.w, SAMP.h, 10, G.white, '#BDC1C6', 1.2);
      tx(ctx, 'embeddings', ECX, 393, 12.5, G.muted, { align: 'center' });
      tx(ctx, `${D.config.layers} layers`, (SLAB.x + slabX(17) + SLAB.w) / 2, 393, 12.5, G.black, { align: 'center', weight: 700 });
      tx(ctx, 'scores → pick', SCX, 393, 12.5, G.muted, { align: 'center' });
      // the decode loop: each new ID goes straight back to the embedding table
      const loopOn = t > LAP0[0] - 0.05 && t < T[6];
      poly(ctx, ARC, loopOn ? G.orange : G.rail, loopOn ? 2.6 : 1.8, [7, 6], loopOn ? -this.time * 30 : 0);
      head(ctx, ARC[3].x, ARC[3].y - 2, 'down', loopOn ? G.orange : G.rail, 6);
      // detokenizer output
      box(ctx, DET.x, DET.y, DET.w, DET.h, 10, G.white, U.rgba(G.blue, 0.55), 1.4);
      tx(ctx, 'reply text', DET.x + 10, DET.y + 17, 12, G.muted);
      // entry: the request arrives as JSON
      caption(ctx, [local ? 'from your' : 'from the', 'app (JSON)'], ENTRY.x, 180, { size: 12 });
    },
    drawStations(ctx) {
      for (let n = 2; n <= 7; n++) {
        const st = ST[n], K = KIND[st.kind], t = this.tau;
        const start = n === 7 ? this.upDep[0] + UPFLY : T[n - 1] + 0.02;   // the detokenizer starts as soon as the first ID lands
        const reached = t >= start, cur = this.mode === 'hosted' && this.cur === n, on = reached || cur;
        ctx.save(); ctx.font = `${cur ? 700 : 500} 15px ${FONT.sans}`;
        const tw = ctx.measureText(st.label).width; ctx.restore();
        const w = tw + 50, h = 26, x0 = st.left ? st.x : st.x - w / 2, y0 = st.y - h / 2;
        ctx.save();
        if (cur) { ctx.shadowColor = U.rgba(K.stroke, 0.55); ctx.shadowBlur = 12 + 4 * Math.sin(this.time * 4); }
        box(ctx, x0, y0, w, h, 13, cur ? K.fill : G.white, on ? K.stroke : G.line, cur ? 2.6 : 1.5);
        ctx.restore();
        U.circle(ctx, x0 + 14, st.y, 10, on ? K.badge : '#E8EAED', null);
        tx(ctx, String(n), x0 + 14, st.y + 4.5, 13, on ? K.num : G.muted, { weight: 700, align: 'center' });
        tx(ctx, st.label, x0 + 31, st.y + 5.5, 15, on ? K.text : G.muted, { weight: cur ? 700 : 500 });
      }
    },
    drawGate(ctx, n) {
      const [x0, x1] = GATE[n], cx = (x0 + x1) / 2, local = this.mode === 'local', t = this.tau;
      const cur = !local && this.cur === n, reached = t >= T[n - 1] + 0.02;
      const s0 = T[n - 1] + (n === 1 ? 0.8 : 0.5), s1 = s0 + 0.7;                 // scan window
      ctx.save();
      if (cur) { ctx.shadowColor = U.rgba(G.red, 0.5); ctx.shadowBlur = 14 + 4 * Math.sin(this.time * 4); }
      box(ctx, x0, GATE_Y[0], x1 - x0, GATE_Y[1] - GATE_Y[0], 14, local ? 'rgba(250,210,207,0.22)' : 'rgba(250,210,207,0.62)', local ? U.rgba(G.red, 0.65) : G.red, cur ? 3 : 2, local ? [6, 5] : null);
      ctx.restore();
      U.circle(ctx, cx, 58, 12, reached || cur ? G.tRed : '#E8EAED', null);
      tx(ctx, String(n), cx, 63, 14, reached || cur ? G.white : G.muted, { weight: 700, align: 'center' });
      tx(ctx, n === 1 ? 'input' : 'output', cx, 90, 14.5, G.tRed, { weight: 700, align: 'center' });
      tx(ctx, 'guardrail', cx, 107, 14.5, G.tRed, { weight: 700, align: 'center' });
      if (local) {
        caption(ctx, ['none by', 'default'], cx, 172, { color: G.tRed, size: 13.5 });
        caption(ctx, ['add your own,', 'e.g.'], cx, 318, { color: G.tRed, size: 12.5, lh: 16 });
        tx(ctx, 'ShieldGemma', cx, 350, 12.5, G.tRed, { align: 'center', weight: 700 });
        return;
      }
      const okRules = t >= s0 + 0.35, okCls = t >= s1 - 0.05;
      tx(ctx, okRules ? 'rules ✓' : 'rule filters', cx, 186, 13, okRules ? G.tGreen : G.tRed, { align: 'center', weight: okRules ? 700 : 400 });
      box(ctx, cx - 42, 292, 84, 58, 8, G.white, okCls ? G.green : G.red, 1.6, [5, 4]);
      tx(ctx, 'safety', cx, 316, 13, okCls ? G.tGreen : G.tRed, { align: 'center', weight: 700 });
      tx(ctx, okCls ? 'classifier ✓' : 'classifier', cx, 334, 13, okCls ? G.tGreen : G.tRed, { align: 'center' });
      caption(ctx, ['a small model', 'on a GPU', '(optional)'], cx, 372, { size: 12.5, lh: 16 });
      // scanning: a beam over the message and a copy to the classifier and back
      if (t > s0 && t < s1 + 0.1) {
        const u = clamp((t - s0) / 0.45, 0, 1), y = lerp(MSG_Y - 22, MSG_Y + 22, u);
        const g = ctx.createLinearGradient(0, y - 10, 0, y + 10);
        g.addColorStop(0, 'rgba(234,67,53,0)'); g.addColorStop(0.5, 'rgba(234,67,53,0.42)'); g.addColorStop(1, 'rgba(234,67,53,0)');
        ctx.fillStyle = g; ctx.fillRect(x0 + 6, y - 10, x1 - x0 - 12, 20);
        const v = clamp((t - s0) / 0.7, 0, 1), dy = v < 0.5 ? lerp(MSG_Y + 18, 292, ease(v * 2)) : lerp(292, MSG_Y + 18, ease(v * 2 - 1));
        poly(ctx, [P(cx + 32, MSG_Y + 18), P(cx + 32, 292)], U.rgba(G.red, 0.6), 1.5, [3, 4]);
        U.circle(ctx, cx + 32, dy, 5, G.red, null);
      }
    },
    drawWrap(ctx) {                                   // the two gates are one system: guardrails wrap the pipeline
      const y = 469, a = GATE[1], b = GATE[8], local = this.mode === 'local';
      const col = local ? U.rgba(G.red, 0.55) : G.red;
      poly(ctx, [P((a[0] + a[1]) / 2, GATE_Y[1]), P((a[0] + a[1]) / 2, y), P((b[0] + b[1]) / 2, y), P((b[0] + b[1]) / 2, GATE_Y[1])], col, 2, local ? [6, 5] : null);
      const label = local ? 'guardrails: yours to add' : 'guardrails wrap the pipeline';
      ctx.save(); ctx.font = `700 13.5px ${FONT.sans}`; const tw = ctx.measureText(label).width; ctx.restore();
      const cx = (SEP[0] + SEP[1]) / 2;
      ctx.fillStyle = G.bg; ctx.fillRect(cx - tw / 2 - 12, y - 10, tw + 24, 20);
      tx(ctx, label, cx, y + 5, 13.5, G.tRed, { weight: 700, align: 'center' });
    },
    drawPhone(ctx) {
      const F = PHONE, t = this.tau;
      tx(ctx, 'your screen', F.x + F.w / 2, 26, 13, G.muted, { align: 'center' });
      box(ctx, F.x, F.y, F.w, F.h, 28, G.white, G.grey, 3);
      box(ctx, F.x + F.w / 2 - 28, F.y + 11, 56, 6, 3, G.line);
      box(ctx, F.x + F.w - 66, F.y + 32, 50, 32, 15, G.lBlue);
      tx(ctx, 'hi', F.x + F.w - 41, F.y + 53, 16, G.black, { align: 'center' });
      const a = this.pr(T[7] + 1.6, T[8] - 0.2);
      if (a > 0) {                                    // the reply streams in
        const full = this.D.reply.text.trim(), n = Math.round(full.length * a);
        const lines = this.wrap(ctx, full, F.w - 60, 15);
        box(ctx, F.x + 14, F.y + 78, F.w - 38, 18 + lines.length * 20, 15, G.lgrey);
        let left = n;
        lines.forEach((ln, i) => { const s = ln.slice(0, Math.max(0, left)); left -= ln.length; if (s) tx(ctx, s, F.x + 28, F.y + 101 + i * 20, 15, G.black); });
      } else if (t > 0.4 && this.mode === 'hosted') { // "typing…" while the server works
        box(ctx, F.x + 14, F.y + 78, 62, 32, 15, G.lgrey);
        for (let i = 0; i < 3; i++) U.circle(ctx, F.x + 32 + i * 13, F.y + 94 - 3 * Math.max(0, Math.sin(this.time * 6 - i * 0.9)), 3.6, G.grey, null);
      }
      const on = t >= T[7] + 1.2;
      poly(ctx, [P(GATE[8][1] + 2, MSG_Y), P(F.x - 5, MSG_Y)], on ? G.green : G.rail, 2.2);
      head(ctx, F.x - 5, MSG_Y, 'right', on ? G.green : G.rail, 6);
    },
    wrap(ctx, s, maxW, size) {
      ctx.save(); ctx.font = `${size}px ${FONT.sans}`;
      const out = []; let cur = '';
      s.split(' ').forEach(wd => { const t2 = cur ? cur + ' ' + wd : wd; if (ctx.measureText(t2).width > maxW && cur) { out.push(cur + ' '); cur = wd; } else cur = t2; });
      if (cur) out.push(cur);
      ctx.restore(); return out;
    },

    // ------------------------------------------------------------ the film
    drawFilm(ctx) {
      const t = this.tau, ids = this.D.prompt.ids;
      // ---- 1 · the message arrives and passes the input guardrail
      if (t < T[1] + 0.12) {
        const a1 = ease(this.pr(0.2, 0.8)), a2 = ease(this.pr(2.0, 2.4)), gx = (GATE[1][0] + GATE[1][1]) / 2;
        const hi = this.tplLines(ctx)[1][0], hx = hi.x + hi.w / 2, hy = hi.y - 5;
        const x = t < 2.0 ? lerp(ENTRY.x, gx, a1) : lerp(gx, hx, a2), y = t < 2.0 ? MSG_Y : lerp(MSG_Y, hy, a2);
        chip(ctx, x, y, 60, 30, '"hi"', { stroke: t >= 1.7 ? G.green : G.blue, size: 16, alpha: 1 - 0.85 * a2, glow: this.cur === 1 ? U.rgba(G.blue, 0.4) : null });
        check(ctx, x + 28, y - 15, 9, ease(this.pr(1.7, 1.95)) * (1 - a2));
      }
      // ---- 2 · chat template (stays as a faint ghost once tokenized)
      if (t >= T[1] + 0.1) this.drawTemplate(ctx);
      // ---- 3 · tokens: pieces of the template fly into ID chips
      if (t >= T[2]) this.drawTokens(ctx);
      // ---- 4 · DMA copy over PCIe into the embedding table
      if (t >= T[3]) {
        for (let k = 0; k < ids.length; k++) {
          const d0 = T[3] + 0.08 * k, d1 = d0 + 0.75;
          if (t < d0 || t > d1 + 0.3) continue;
          const f = ease(this.pr(d0, d1)), p = along([this.slot(k), P(DOWN_X, 190), P(DOWN_X, 256), P(EMB.x - 4, rowY(ids[k]))], f);
          const sc = lerp(1, 0.6, clamp((f - 0.6) / 0.4, 0, 1)), gone = this.pr(d1, d1 + 0.3), gpu = p.y > LN.bus.y + 20;
          chip(ctx, p.x, p.y, SLOT.w * sc, 28 * sc, String(ids[k]), { stroke: gpu ? G.yellow : G.blue, size: 14 * sc, alpha: 1 - gone, color: gpu ? G.black : G.tBlue });
        }
      }
      this.drawLookups(ctx);
      // ---- 5 + 6 · prefill bundle, then one token per decode lap
      this.drawVectors(ctx);
      this.drawSampler(ctx);
      this.drawLoopChips(ctx);
      // ---- 7 · each new ID is copied up and becomes text
      this.drawUp(ctx);
      this.drawDetok(ctx);
      // ---- 8 · the text passes the output guardrail on its way out
      if (t >= T[7] && t < T[8] - 0.7) {
        const a = ease(this.pr(T[7], T[7] + 0.5)), b = ease(this.pr(T[7] + 1.2, T[7] + 1.6)), gx = (GATE[8][0] + GATE[8][1]) / 2;
        const x = t < T[7] + 1.2 ? lerp(DET.x + DET.w / 2, gx, a) : lerp(gx, PHONE.x + 64, b);
        const y = t < T[7] + 1.2 ? lerp(DET.y + DET.h / 2, MSG_Y, a) : lerp(MSG_Y, PHONE.y + 100, b);
        chip(ctx, x, y, 92, 28, '“Hi there…”', { stroke: t >= T[7] + 1.15 ? G.green : G.blue, size: 13.5, mono: false, weight: 500, alpha: 1 - this.pr(T[7] + 1.5, T[7] + 1.7) });
        check(ctx, x + 44, y - 14, 9, ease(this.pr(T[7] + 1.15, T[7] + 1.35)) * (1 - b));
      }
    },
    drawTemplate(ctx) {
      const t = this.tau, rev = this.pr(T[1] + 0.2, T[2] - 0.2), hiA = this.pr(T[1], T[1] + 0.3);
      this.tplLines(ctx).forEach((ln, li) => ln.forEach(tok => {
        let a = 1, dx = 0, dy = 0;
        if (tok.kind === 'user') a = hiA;
        else {
          const r0 = li === 0 ? 0 : li === 1 ? 0.25 : 0.5, e = ease(clamp((rev - r0) / 0.5, 0, 1));
          a = e; if (li === 0) dy = -22 * (1 - e); else if (li === 2) dy = 22 * (1 - e); else dx = 30 * (1 - e);
        }
        if (t >= this.tokStart(tok.k)) a *= 0.33;     // this piece has flown off to become an ID
        if (a <= 0.01) return;
        if (tok.kind === 'user') box(ctx, tok.x - 2, tok.y - 15, tok.w + 4, 20, 4, U.rgba(G.yellow, 0.45 * a));
        tx(ctx, tok.s, tok.x + dx, tok.y + dy, 15, tok.kind === 'ctrl' ? G.tBlue : tok.kind === 'nl' ? G.muted : G.black, { mono: true, weight: tok.kind === 'ctrl' || tok.kind === 'nl' ? 400 : 700, alpha: a });
      }));
    },
    tplLines(ctx) {                                   // token boxes of the formatted prompt, from data/journey.js
      if (this._tpl) return this._tpl;
      ctx.save(); ctx.font = `400 15px ${FONT.mono}`; const cw = ctx.measureText('M').width; ctx.restore();
      const out = [[]]; let line = 0, x = TPL_X;
      this.D.prompt.tokens.forEach((s, k) => {
        if (k === 0) return;                          // <bos> is added by the tokenizer, not the template
        const nl = s === '\n', disp = nl ? '↵' : s, kind = nl ? 'nl' : s.startsWith('<') ? 'ctrl' : s === 'hi' ? 'user' : 'role';
        out[line].push({ s: disp, k, kind, x, y: TPL_Y[line], w: disp.length * cw });
        x += disp.length * cw;
        if (nl) { line++; x = TPL_X; out[line] = out[line] || []; }
      });
      this._tpl = out.filter(l => l.length); return this._tpl;
    },
    tokStart(k) { return k === 0 ? T[2] + 0.1 : T[2] + 0.25 + 0.12 * (k - 1); },
    slot(k) { return P(SLOT.x + SLOT.pitch * (k % 5), SLOT.y + SLOT.dy * Math.floor(k / 5)); },
    drawTokens(ctx) {
      const t = this.tau, ids = this.D.prompt.ids, flat = {};
      this.tplLines(ctx).forEach(l => l.forEach(tok => { flat[tok.k] = tok; }));
      const keep = t > T[3] ? lerp(1, 0.6, this.pr(T[3], T[3] + 0.6)) : 1;   // copied, not moved: the IDs stay in RAM
      for (let k = 0; k < ids.length; k++) {
        const s0 = this.tokStart(k), m = ease(this.pr(s0, s0 + 0.5));
        if (m <= 0) continue;
        const dst = this.slot(k), src = k === 0 ? dst : P(flat[k].x + flat[k].w / 2, flat[k].y - 5);
        const cy = k < 5 ? Math.min(src.y, dst.y) - 60 : Math.max(src.y, dst.y) + 34, cx = (src.x + dst.x) / 2;   // hop: row 1 over the top, row 2 underneath
        const x = (1 - m) * (1 - m) * src.x + 2 * (1 - m) * m * cx + m * m * dst.x, y = (1 - m) * (1 - m) * src.y + 2 * (1 - m) * m * cy + m * m * dst.y;
        const w = k === 0 ? SLOT.w * m : lerp(flat[k].w + 6, SLOT.w, m), h = k === 0 ? SLOT.h * m : lerp(20, SLOT.h, m);
        const isHi = this.D.prompt.tokens[k] === 'hi', early = m < 0.5 && k > 0;
        chip(ctx, x, y, w, h, '', { fill: isHi ? G.lYellow : G.white, stroke: isHi ? G.yellow : G.blue, alpha: keep * (k === 0 ? m : 0.35 + 0.65 * m) });
        tx(ctx, early ? flat[k].s : String(ids[k]), x, y + 5, early ? 13 : 14, isHi ? G.black : G.tBlue, { mono: true, weight: 600, align: 'center', alpha: keep * clamp(early ? 1 - 2 * m : k === 0 ? m : 2 * m - 1, 0, 1) });
      }
      const la = this.pr(T[2] + 1.6, T[2] + 2.0);
      if (la > 0 && !(this.mode === 'local' && this.focus === 'L1')) tx(ctx, `${ids.length} IDs · ${this.D.prompt.bytesInt32} bytes in RAM`, SLOT.x + 2 * SLOT.pitch, 192, 12.5, G.muted, { align: 'center', alpha: la });
    },
    drawLookups(ctx) {
      const t = this.tau, ids = this.D.prompt.ids;
      const lit = (id, a) => { if (a > 0) box(ctx, EMB.x + 3, rowY(id) - 3.25, EMB.w - 6, 6.5, 2, U.rgba(G.yellow, 0.9 * a)); };
      if (t >= T[3] && t < PRE + 0.9) ids.forEach((id, k) => { const d1 = T[3] + 0.08 * k + 0.75; lit(id, this.pr(d1, d1 + 0.15) * (1 - this.pr(PRE + 0.5, PRE + 0.9))); });
      LAP0.forEach((t0, i) => { const d = LAPD[i]; lit(this.S[i].id, this.pr(t0 + 0.2 * d, t0 + 0.26 * d) * (1 - this.pr(t0 + 0.4 * d, t0 + 0.55 * d))); });
    },
    // where the vectors are: the prefill bundle (10 rows side by side) and each decode lap (1 row)
    prefillFront() { const t = this.tau; if (t < PRE) return -1; if (t < PRE + 0.5) return lerp(FRONT[0] - 20, FRONT[0], ease(this.pr(PRE, PRE + 0.5))); return lerp(FRONT[0], FRONT[1], ease(this.pr(PRE + 0.5, PRE + 2.4))); },
    lapFront(i) { const t0 = LAP0[i], d = LAPD[i]; if (this.tau < t0 + 0.3 * d) return -1; return lerp(FRONT[0], FRONT[1], ease(this.pr(t0 + 0.3 * d, t0 + 0.8 * d))); },
    drawVectors(ctx) {
      const t = this.tau, ids = this.D.prompt.ids;
      const bar = (front, y, id, a) => {
        if (a <= 0) return;
        ctx.save(); ctx.globalAlpha *= a;
        for (let c = 0; c < 6; c++) { ctx.fillStyle = cellColor(id, c); ctx.fillRect(front - BL + c * (BL / 6), y - 3, BL / 6 - 0.8, 6); }
        ctx.restore();
      };
      const glowSlabs = (front, a) => {
        for (let l = 0; l < 18; l++) {
          const x = slabX(l); if (front < x || front - BL > x + SLAB.w) continue;
          ctx.save(); ctx.shadowColor = G.yellow; ctx.shadowBlur = 10; box(ctx, x - 1, SLAB.y, SLAB.w + 2, SLAB.h, 2, U.rgba(G.yellow, 0.75 * a)); ctx.restore();
        }
      };
      if (t >= PRE && t < PRE + 3.05) {               // prefill: all 10 tokens side by side, through all 18 layers at once
        const f = this.prefillFront(), out = this.pr(PRE + 2.4, PRE + 2.9);
        glowSlabs(f, 1 - out);
        ids.forEach((id, k) => {
          const y = 308 + 6.4 * k, last = k === ids.length - 1;
          const front = last ? lerp(f, SCX + 20, out) : f, a = last ? 1 - this.pr(PRE + 2.85, PRE + 3.0) : 1 - out;
          bar(front, last ? lerp(y, 337, out) : y, id, a * this.pr(PRE, PRE + 0.25));
        });
      }
      LAP0.forEach((t0, i) => {                       // decode: one token per lap
        const d = LAPD[i]; if (t < t0 + 0.3 * d || t > t0 + d) return;
        const f = this.lapFront(i), out = this.pr(t0 + 0.8 * d, t0 + 0.95 * d);
        glowSlabs(f, 1 - out);
        bar(lerp(f, SCX + 20, out), 337, this.S[i].id, 1 - this.pr(t0 + 0.9 * d, t0 + d));
      });
    },
    drawSampler(ctx) {
      const t = this.tau; let j = -1;
      for (let q = 0; q < this.OUT.length; q++) if (t >= this.sampled[q] - 0.3) j = q;
      if (j < 0) return;
      const o = this.OUT[j], grow = ease(this.pr(this.sampled[j] - 0.3, this.sampled[j]));
      const ps = [o.p, o.alt[0].p, o.alt[1].p, Math.max(0, 1 - o.p - o.alt[0].p - o.alt[1].p)];
      ps.forEach((p, i) => { const hgt = Math.max(1.5, 34 * p * grow); box(ctx, SAMP.x + 14 + i * 18, 346 - hgt, 14, hgt, 2, i === 0 ? G.yellow : i === 3 ? G.line : '#F6D57A'); });
      ctx.save(); ctx.strokeStyle = G.line; ctx.beginPath(); ctx.moveTo(SAMP.x + 8, 346.5); ctx.lineTo(SAMP.x + SAMP.w - 8, 346.5); ctx.stroke(); ctx.restore();
      tx(ctx, `#${o.id}`, SCX, 362, 13, G.black, { mono: true, weight: 700, align: 'center', alpha: grow });
      tx(ctx, pct(o.p), SCX, 376, 12, G.muted, { align: 'center', alpha: grow });
    },
    drawLoopChips(ctx) {
      const t = this.tau;
      this.OUT.forEach((o, j) => {
        const s = this.sampled[j]; if (t < s) return;
        const isStop = j === this.OUT.length - 1, ride0 = isStop ? Infinity : LAP0[j];
        if (t < ride0) {                              // waiting on the loop, right above the sampler
          if (isStop && t > this.upDep[j] + 0.05) return;
          chip(ctx, WAIT.x, WAIT.y, idW(o.id), 24, String(o.id), { stroke: isStop ? G.red : G.yellow, size: 13, alpha: ease(this.pr(s, s + 0.12)) });
          return;
        }
        const d = LAPD[j], f = this.pr(ride0, ride0 + 0.22 * d);              // riding the loop back to the table
        if (f >= 1) return;
        const q = along([WAIT, P(ECX, ARC_Y), P(ECX, EMB.y + 2)], ease(f));
        chip(ctx, q.x, q.y, idW(o.id) * lerp(1, 0.7, f), 24 * lerp(1, 0.8, f), String(o.id), { stroke: G.orange, size: 13, alpha: 1 - clamp((f - 0.85) / 0.15, 0, 1) });
      });
    },
    drawUp(ctx) {
      const t = this.tau;
      this.OUT.forEach((o, j) => {
        const d0 = this.upDep[j], d1 = d0 + UPFLY; if (t < d0 || t >= d1) return;
        const isStop = j === this.OUT.length - 1, tgt = isStop ? P(this.stopPos.x + 56, this.stopPos.y - 6) : P(this.pieces[j].x + this.pieces[j].w / 2, this.pieces[j].y - 6);
        const p = along([P(WAIT.x + 12, WAIT.y), P(UP_X, WAIT.y), P(UP_X, 188), tgt], ease(this.pr(d0, d1)));
        const cpu = p.y < LN.bus.y + 20;
        chip(ctx, p.x, p.y, idW(o.id), 24, String(o.id), { stroke: isStop ? G.red : cpu ? G.blue : G.yellow, color: cpu ? G.tBlue : G.black, size: 13 });
      });
    },
    drawDetok(ctx) {
      const t = this.tau;
      this.pieces.forEach((pc, j) => {
        const arr = this.upDep[j] + UPFLY; if (t < arr) return;
        const u = this.pr(arr, arr + 0.25), o = this.OUT[j];
        if (u < 0.5) { chip(ctx, pc.x + pc.w / 2, pc.y - 6, idW(o.id), 24, String(o.id), { stroke: G.blue, color: G.tBlue, size: 13, sy: 1 - 2 * u }); return; }
        const hl = 1 - this.pr(arr + 0.4, arr + 1.0);
        if (hl > 0) box(ctx, pc.x - 1, pc.y - 16, pc.w + 2, 21, 4, U.rgba(G.yellow, 0.5 * hl));
        ctx.save(); ctx.translate(0, pc.y - 6); ctx.scale(1, 2 * u - 1); ctx.translate(0, -(pc.y - 6));
        tx(ctx, pc.str, pc.x, pc.y, pc.nl ? 14 : 18, pc.nl ? G.muted : G.black);
        ctx.restore();
      });
      // the stop token arrives, is recognised as a control token and dropped
      const j = this.OUT.length - 1, arr = this.upDep[j] + UPFLY;
      if (t >= arr && t < arr + 1.3) {
        const x = this.stopPos.x + 60, y = this.stopPos.y - 6, a = 1 - this.pr(arr + 0.75, arr + 1.3);
        chip(ctx, x, y, 120, 24, '<end_of_turn>', { fill: G.lRed, stroke: G.red, color: G.tRed, size: 12.5, alpha: a });
        const sk = this.pr(arr + 0.25, arr + 0.55);
        if (sk > 0) poly(ctx, [P(x - 56, y), P(x - 56 + 112 * sk, y)], U.rgba(G.tRed, a), 2.2);
      }
    },
    drawKV(ctx) {
      const t = this.tau, nP = this.D.prompt.ids.length, nR = this.S.length;
      const l4 = this.mode === 'local' && this.focus === 'L4', t2 = this.D.turn2;
      const rows = l4 ? t2.total : nP + nR, rh = KV.h / rows;
      box(ctx, KV.x - 4, KV.y - 4, KV.w + 8, KV.h + 8, 5, null, G.rail, 1.2, [4, 4]);
      let cells = 0;
      const fill = (r, l, col) => { ctx.fillStyle = col; ctx.fillRect(slabX(l), KV.y + r * rh, SLAB.w, Math.max(0.9, rh - 0.5)); cells++; };
      if (l4) {                                       // turn 2: the cached prefix is reused, only the new tokens are computed
        const f = lerp(FRONT[0], FRONT[1], ease(clamp((this.lt - 0.6) / 1.6, 0, 1)));
        for (let r = 0; r < rows; r++) for (let l = 0; l < 18; l++) {
          if (r < t2.reused) fill(r, l, G.green); else if (f >= slabX(l) + SLAB.w) fill(r, l, G.yellow);
        }
      } else {
        const pf = this.prefillFront();
        for (let l = 0; l < 18; l++) {
          if (t >= PRE && pf >= slabX(l) + SLAB.w) for (let r = 0; r < nP; r++) fill(r, l, G.blue);
          for (let i = 0; i < nR; i++) if (this.lapFront(i) >= slabX(l) + SLAB.w) fill(nP + i, l, G.yellow);
        }
      }
      const lx = SAMP.x;
      tx(ctx, 'KV cache', lx, 416, 15, G.black, { weight: 700 });
      if (l4) tx(ctx, `${t2.reused} reused + ${t2.new} new`, lx, 433, 12.5, G.tGreen, { weight: 700 });
      else tx(ctx, `${Math.round(this.D.kvBytesPerToken / 1e3)} KB per token`, lx, 433, 12.5, G.muted);
      tx(ctx, fmtB(Math.round(cells * this.D.kvBytesPerToken / 18)), lx, 450, 13.5, G.black, { mono: true, weight: 600 });
    },

    // ------------------------------------------------------------ local open weights
    drawGrammar(ctx) {                                // L2: a grammar compiled on the CPU masks the scores before the pick
      const f = this.focus === 'L2';
      poly(ctx, [P(SCX, GRAM.y + GRAM.h), P(SCX, SAMP.y - 2)], G.orange, 1.8, [3, 4], f ? -this.time * 20 : 0);
      head(ctx, SCX, SAMP.y - 1, 'down', G.orange, 5.5);
      box(ctx, GRAM.x, GRAM.y, GRAM.w, GRAM.h, 10, G.white, f ? G.orange : '#E8A04A', 1.7);
      tx(ctx, 'grammar', GRAM.x + GRAM.w / 2, GRAM.y + 24, 14, G.black, { weight: 700, align: 'center' });
      tx(ctx, '→ token mask', GRAM.x + GRAM.w / 2, GRAM.y + 42, 13, G.black, { align: 'center' });
      tx(ctx, 'e.g. JSON schema', GRAM.x + GRAM.w / 2, GRAM.y + 58, 11.5, G.muted, { align: 'center' });
    },
    drawLocal(ctx) {
      const f = this.focus, pulse = 0.5 + 0.5 * Math.sin(this.time * 3);
      const ring = (x, y, w, h, on) => { if (!on) return; ctx.save(); ctx.shadowColor = U.rgba(G.orange, 0.6); ctx.shadowBlur = 10 + 6 * pulse; box(ctx, x, y, w, h, 12, null, G.orange, 2.5, [7, 5]); ctx.restore(); };
      ring(208, 64, 458, 130, f === 'L1');
      ring(GRAM.x - 6, GRAM.y - 6, GRAM.w + 12, GRAM.h + 12, f === 'L2');
      ring(DOWN_X - 19, CH_Y[0] - 8, 38, CH_Y[1] - CH_Y[0] + 16, f === 'L3'); ring(UP_X - 19, CH_Y[0] - 8, 38, CH_Y[1] - CH_Y[0] + 16, f === 'L3');
      ring(KV.x - 9, KV.y - 4, KV.w + 18, KV.h + 9, f === 'L4');
      if (f === 'L1') tx(ctx, `${this.D.timing.hiMicros} µs on one CPU core`, SLOT.x + 2 * SLOT.pitch, 192, 13.5, G.black, { weight: 700, align: 'center' });
      if (f === 'L3') tx(ctx, 'or one shared RAM: Apple silicon', 830, LN.bus.y + 26, 13, G.black, { weight: 600 });
      for (const k in PINS) {
        const p = PINS[k], on = f === k;
        ctx.save(); if (on || !f) { ctx.shadowColor = U.rgba(G.orange, 0.5); ctx.shadowBlur = on ? 12 : 6 * pulse; }
        box(ctx, p.x - 16, p.y - 12, 32, 24, 8, on ? G.orange : G.lYellow, G.orange, 2);
        ctx.restore();
        tx(ctx, k, p.x, p.y + 5, 13, G.black, { weight: 700, align: 'center' });
      }
    }
  });
})();
