/* =====================================================================
   Chapter 7 demos: a real protein in 3D (PDB 1EMA, green fluorescent
   protein) and "which AI should my lab use?"
   ===================================================================== */
(function () {
  'use strict';
  const { C, FONT, el, seg, clamp, lerp } = U;

  // ======================================================================
  // PROTEIN: rotating Cα trace, coloured by secondary structure
  // ======================================================================
  function catmull(p0, p1, p2, p3, t) {
    const t2 = t * t, t3 = t2 * t;
    return [0, 1, 2].map(k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3));
  }
  Deck.register('protein', {
    init(slide) {
      const P = U.data('protein');
      const host = slide.querySelector('[data-role=prot]');
      let ca, ss;
      if (P) { ca = P.ca; ss = P.ss; }
      else {      // fallback: a toy helix–strand structure
        ca = []; ss = '';
        for (let i = 0; i < 120; i++) { const a = i * 1.75; ca.push([8 * Math.cos(a) + (i > 60 ? 18 : 0), i * 1.5 % 60, 8 * Math.sin(a)]); ss += i % 40 < 20 ? 'H' : 'C'; }
      }
      // centre + scale
      const n = ca.length, cen = [0, 1, 2].map(k => ca.reduce((s, p) => s + p[k], 0) / n);
      let rmax = 0; ca.forEach(p => { rmax = Math.max(rmax, Math.hypot(p[0] - cen[0], p[1] - cen[1], p[2] - cen[2])); });
      const pts = ca.map(p => [(p[0] - cen[0]) / rmax, (p[1] - cen[1]) / rmax, (p[2] - cen[2]) / rmax]);
      // smooth spline with 5 sub-steps per residue
      this.path = []; this.ssPath = []; this.idxPath = [];
      for (let i = 0; i < n - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
        for (let s = 0; s < 5; s++) { this.path.push(catmull(p0, p1, p2, p3, s / 5)); this.ssPath.push(ss[i] || 'C'); this.idxPath.push(i / (n - 1)); }
      }
      this.n = n; this.P = P;
      const wrap = el('div', { class: 'canvas-wrap' }, host);
      this.cv = U.canvas(wrap, { onresize: () => this.draw() });
      this.yaw = 0.6; this.pitch = 0.25; this.auto = true; this.mode = 'ss';
      const ctl = slide.querySelector('[data-role=pctl]');
      if (ctl) seg(ctl, [{ value: 'ss', label: 'helices & strands' }, { value: 'rainbow', label: 'start → end' }], 'ss', v => { this.mode = v; this.draw(); });
      let drag = null;
      this.cv.canvas.addEventListener('pointerdown', e => { drag = { p: this.cv.toLocal(e), y: this.yaw, pt: this.pitch }; this.auto = false; this.cv.canvas.setPointerCapture(e.pointerId); });
      this.cv.canvas.addEventListener('pointermove', e => { if (!drag) return; const p = this.cv.toLocal(e); this.yaw = drag.y + (p.x - drag.p.x) * 0.01; this.pitch = clamp(drag.pt + (p.y - drag.p.y) * 0.01, -1.4, 1.4); this.draw(); });
      this.cv.canvas.addEventListener('pointerup', () => { drag = null; setTimeout(() => { this.auto = true; }, 2500); });
      this.loop = U.animator(dt => { if (this.auto) { this.yaw += dt * 0.35; this.draw(); } });
      this.draw();
    },
    enter() { this.loop && this.loop.start(); },
    leave() { this.loop && this.loop.stop(); },
    colour(i) {
      if (this.mode === 'rainbow') { const c = U.rampRgb(['#4285f4', '#00897b', '#34a853', '#fbbc04', '#e65100', '#ea4335'], this.idxPath[i]); return c; }
      const s = this.ssPath[i];
      return U.hexToRgb(s === 'H' ? C.pink : s === 'E' ? '#f9ab00' : '#9aa0a6');
    },
    draw() {
      const { ctx, w, h } = this.cv; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
      const S = Math.min(w, h) * 0.36, ox = w / 2, oy = h / 2;
      const proj = this.path.map(([x, y, z]) => { const X = cy * x + sy * z, Z0 = -sy * x + cy * z, Y = cp * y - sp * Z0, Z = sp * y + cp * Z0; const f = 1 / (1 + Z * 0.25); return [ox + X * S * f, oy - Y * S * f, Z]; });
      const segs = [];
      for (let i = 0; i < proj.length - 1; i++) segs.push(i);
      segs.sort((a, b) => (proj[b][2] + proj[b + 1][2]) - (proj[a][2] + proj[a + 1][2]));
      ctx.lineCap = 'round';
      for (const i of segs) {
        const a = proj[i], b = proj[i + 1], z = (a[2] + b[2]) / 2, depth = clamp((1 - z) / 2, 0, 1);
        const c = this.colour(i), fog = 0.38 + 0.62 * depth, ss = this.mode === 'ss' ? this.ssPath[i] : 'C';
        const width = (ss === 'H' ? 15 : ss === 'E' ? 13 : 6) * (0.65 + 0.5 * depth);
        const r = lerp(226, c[0], fog) | 0, g = lerp(230, c[1], fog) | 0, bl = lerp(236, c[2], fog) | 0;
        ctx.strokeStyle = `rgb(${r},${g},${bl})`; ctx.lineWidth = width;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${0.32 * depth})`; ctx.lineWidth = width * 0.3;
        ctx.beginPath(); ctx.moveTo(a[0], a[1] - width * 0.18); ctx.lineTo(b[0], b[1] - width * 0.18); ctx.stroke();
      }
      const lab = this.P ? `${this.P.name} · PDB ${this.P.pdb} · ${this.n} amino acids` : 'toy structure (protein data missing)';
      U.text(ctx, lab, 16, h - 16, { size: 18, color: C.muted });
      U.text(ctx, 'drag to rotate', w - 16, h - 16, { size: 16, color: C.dim, align: 'right' });
    }
  });

  // ======================================================================
  // LAB: which AI should my lab use?
  // ======================================================================
  function recommend(data, size, goal) {
    if (goal === 'understand' && data === 'text') return ['📚 An LLM over your own documents', 'Gemini / NotebookLM-style tools or retrieval-augmented generation (RAG) over your PDFs. Always check citations: language models can confidently make things up.', ['Gemini API · AI Studio', 'NotebookLM', 'Gemma + RAG (offline)']];
    if (data === 'table') return size === 'small'
      ? ['🌲 Classical machine learning first!', 'For spreadsheets with hundreds to thousands of rows, gradient-boosted trees (XGBoost, LightGBM) or TabPFN usually beat deep nets, train in seconds and are easier to explain. Put the GPU down!', ['scikit-learn', 'XGBoost / LightGBM', 'TabPFN']]
      : ['🌲→🧠 Trees, then maybe a neural net', 'Start with gradient-boosted trees as a strong baseline. Deep nets pay off with millions of rows or rich mixed inputs.', ['XGBoost', 'Keras / JAX MLP', 'feature engineering']];
    if (data === 'images') return goal === 'generate'
      ? ['🎨 Diffusion models', 'Generate or restore images (super-resolution, denoising, inpainting) with diffusion or flow models. Validate against physics and real measurements.', ['diffusers', 'Imagen / Nano Banana APIs', 'U-Nets']]
      : size === 'small'
        ? ['🖼️ Fine-tune a pre-trained vision model', 'Transfer learning: start from a model pre-trained on millions of images (ViT / ConvNet) and fine-tune with a few hundred labelled examples.', ['Keras / timm', 'ViT, EfficientNet', 'data augmentation']]
        : ['🖼️ Train a CNN or Vision Transformer', 'With lots of images, train or fine-tune a ConvNet/ViT; consider self-supervised pre-training on your unlabelled images first.', ['JAX / PyTorch', 'ViT', 'self-supervised pre-training']];
    if (data === 'seq') return goal === 'generate'
      ? ['🧬 Generative protein / DNA models', 'Design new sequences or structures with generative models, then check them with AlphaFold before going to the bench.', ['AlphaFold 3 server', 'protein diffusion models', 'protein language models']]
      : ['🧬 Biological foundation models', 'Use protein/DNA language models or AlphaFold/AlphaGenome-style predictors as feature extractors, then add a small model on top for your property.', ['AlphaFold DB · AlphaFold 3', 'protein language models', 'AlphaGenome API']];
    if (data === 'sim') return ['🌊 Neural emulators', 'Train a neural network on your simulation outputs to make predictions 1,000× faster (like GraphCast/GenCast for weather). Physics-informed or graph networks help with small data.', ['graph neural networks', 'neural operators', 'JAX']];
    if (data === 'text') return goal === 'generate'
      ? ['✍️ Prompt or fine-tune an LLM', 'Use Gemini for drafting/coding, or fine-tune an open model (Gemma + LoRA) on your lab’s style and formats.', ['Gemini API', 'Gemma + LoRA', 'Keras / Hugging Face']]
      : ['🏷️ Embeddings + a simple classifier', 'Turn text into embedding vectors with a pre-trained model, then train logistic regression or fine-tune a small LLM (Gemma + LoRA).', ['Gemini embeddings', 'Gemma + LoRA', 'scikit-learn']];
    return ['🤔', 'Talk to us at the GDG AI for Science meetup!', []];
  }
  Deck.register('lab', {
    init(slide) {
      this.d = 'table'; this.s = 'small'; this.g = 'predict';
      const q1 = slide.querySelector('[data-role=q1]'), q2 = slide.querySelector('[data-role=q2]'), q3 = slide.querySelector('[data-role=q3]');
      this.out = slide.querySelector('[data-role=rec]');
      seg(q1, [{ value: 'table', label: '📊 spreadsheet' }, { value: 'images', label: '🔬 images' }, { value: 'seq', label: '🧬 sequences' }, { value: 'text', label: '📄 text' }, { value: 'sim', label: '🌊 simulations' }], 'table', v => { this.d = v; this.show(); });
      seg(q2, [{ value: 'small', label: 'hundreds – thousands' }, { value: 'large', label: 'millions' }], 'small', v => { this.s = v; this.show(); });
      seg(q3, [{ value: 'predict', label: 'predict / classify' }, { value: 'generate', label: 'generate / design' }, { value: 'understand', label: 'search / summarise' }], 'predict', v => { this.g = v; this.show(); });
      this.show();
    },
    show() {
      const [t, body, tools] = recommend(this.d, this.s, this.g);
      this.out.innerHTML = `<h3 style="font-size:44px;font-weight:400;margin:0 0 14px">${t}</h3><p style="font-size:30px">${body}</p><div>${tools.map(x => `<span class="tag blue" style="font-size:20px;margin:4px 8px 4px 0">${x}</span>`).join('')}</div>`;
      this.out.classList.remove('pop'); void this.out.offsetWidth; this.out.classList.add('pop');
    }
  });
})();
