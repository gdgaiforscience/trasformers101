/* =====================================================================
   Chapter 4/6 demos with real Gemma 3 270M data
   - weights:   real weight matrices, zoom down to the raw numbers; parameter ladder
   - embed:     token embeddings as a map of meaning
   - attention: real attention patterns
   - llm3d:     lazy embeds of bbycroft.net/llm and Transformer Explainer
   - scale:     the Chinchilla scaling law, interactive
   ===================================================================== */
(function () {
  'use strict';
  const { C, FONT, el, slider, btn, seg, fmt, fmtMinus, clamp, lerp, fmtBig } = U;

  const SUPS = n => String(n).split('').map(c => (c === '-' ? '⁻' : '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c])).join('');

  // ======================================================================
  // WEIGHTS
  // ======================================================================
  Deck.register('weights', {
    init(slide) {
      const W = U.data('weights');
      const host = slide.querySelector('[data-role=img]');
      this.slideEl = slide;
      if (!W) { U.missing(host); return; }
      this.W = W; this.sel = 0; this.z = 0; this.tz = 0;
      const wrap = el('div', { class: 'canvas-wrap' }, host);
      this.cv = U.canvas(wrap, { onresize: () => this.draw() });
      this.imgs = W.matrices.map(m => { const im = new Image(); im.onload = () => this.draw(); im.src = m.img; return im; });
      const ctl = slide.querySelector('[data-role=ctl]');
      this.selSeg = seg(ctl, W.matrices.map((m, i) => ({ value: String(i), label: ['W<sub>Q</sub> layer 0', 'MLP gate', 'Embeddings', 'W<sub>O</sub> layer 17'][i] || m.id })), '0', v => { this.sel = +v; this.tz = 0; this.z = 0; this.info(); this.draw(); if (this.zoomBtn) this.zoomBtn.innerHTML = '🔍 zoom to the numbers'; });
      this.zoomBtn = btn(ctl, '🔍 zoom to the numbers', () => this.zoom(), 'primary');
      this.desc = slide.querySelector('[data-role=desc]');
      this.lad = U.canvas(slide.querySelector('[data-role=ladder]'), { onresize: () => this.drawLadder() });
      this.info(); this.drawLadder();
    },
    enter(slide) {
      if (!this.W) return;
      if (slide._stepPos === 0 && this.z > 0) { cancelAnimationFrame(this._raf); this.z = this.tz = 0; this.draw(); if (this.zoomBtn) this.zoomBtn.innerHTML = '🔍 zoom to the numbers'; }
      this.ladderT = 0; const t0 = performance.now();
      const tick = now => { this.ladderT = Math.min(1, (now - t0) / 1600); this.drawLadder(); if (this.ladderT < 1 && Deck.isActive(this.slideEl)) requestAnimationFrame(tick); else { this.ladderT = 1; this.drawLadder(); } };
      requestAnimationFrame(tick);
    },
    onStep(a, vis) { if (a === 'zoom') { if (vis) { this.tz = 0; this.zoom(); } else { this.tz = 0; this.animate(); } } },
    info() {
      const m = this.W.matrices[this.sel], cm = this.W.colormap || { pos: '#58C4DD', neg: '#FC6255', zero: '#1a1d24' };
      if (!this.desc) return;
      const tex = s => U.esc(s).replace(/W_([QKVO])/g, 'W<sub>$1</sub>');  // W_Q -> W with a subscript Q
      const num = v => Number(v).toLocaleString('en-US');
      // rows x columns = weights: where each matrix's count comes from
      const g = m.grid;
      const grid = g ? `<br><b>${num(g.rows[0])} rows</b> (${U.esc(g.rows[1])}) × <b>${num(g.cols[0])} columns</b> (${U.esc(g.cols[1])}) = <b>${num(g.rows[0] * g.cols[0])} weights</b>` : '';
      const key = `<span class="legend wt-key"><span>1 pixel = 1 weight</span>${[['pos', 'positive'], ['neg', 'negative'], ['zero', '≈ zero']].map(([k, t]) => `<span><i class="sw" style="background:${cm[k]}"></i>${t}</span>`).join('')}</span>`;
      this.desc.innerHTML = `<b>${tex(m.title)}</b><br><span class="muted">${tex(m.desc)}</span>${grid}${key}`;
    },
    zoom() { this.tz = this.tz > 0.5 ? 0 : 1; this.animate(); },
    animate() {
      const t0 = performance.now(), z0 = this.z, z1 = this.tz;
      cancelAnimationFrame(this._raf);
      const tick = now => { const t = Math.min(1, (now - t0) / 2200); this.z = lerp(z0, z1, U.ease(t)); this.draw(); if (t < 1) this._raf = requestAnimationFrame(tick); };
      this._raf = requestAnimationFrame(tick);
      if (this.zoomBtn) this.zoomBtn.innerHTML = z1 > 0.5 ? '🔭 zoom back out' : '🔍 zoom to the numbers';
    },
    patchRect(m) {
      const p = m.patch, px = m.layout.pxPerWeight || 1;
      if (Array.isArray(p.px) && p.px.length === 4) return { x: p.px[0], y: p.px[1], w: p.px[2], h: p.px[3], px: p.px[2] / 16 };
      let x = p.col0 * px, y = p.row0 * px;
      if (p.head !== undefined && m.layout.blocks) x = m.layout.blocks[p.head].x + p.col0 * px;
      if (m.layout.rowsPx && m.layout.rowsPx[p.row0]) y = m.layout.rowsPx[p.row0].y;
      return { x, y, w: 16 * px, h: 16 * px, px };
    },
    draw() {
      if (!this.W) return;
      const { ctx, w, h } = this.cv, m = this.W.matrices[this.sel], im = this.imgs[this.sel];
      ctx.fillStyle = '#0f1115'; ctx.fillRect(0, 0, w, h);
      if (!im.complete || !im.naturalWidth) return;
      const IW = m.width, IH = m.height;
      const fit = Math.min(w / IW, h / IH);
      const full = { x: 0, y: 0, w: IW, h: IH }, pr = this.patchRect(m);
      const aspect = w / h;
      // final view: ~8 rows of the 16x16 patch, so each weight is big enough (~68 px) to print its value
      const th = pr.h * 0.5, tw = th * aspect;
      const tgt = { x: pr.x + pr.w / 2 - tw / 2, y: pr.y + pr.h / 2 - th / 2, w: tw, h: th };
      // interpolate the view in log-space so the zoom feels uniform
      const e = this.z, lw = Math.exp(lerp(Math.log(full.w), Math.log(tgt.w), e)), lh = lw / (full.w / full.h) * (e > 0 ? lerp(1, (full.w / full.h) / aspect, e) : 1);
      const cxv = lerp(full.x + full.w / 2, tgt.x + tgt.w / 2, e), cyv = lerp(full.y + full.h / 2, tgt.y + tgt.h / 2, e);
      const scale = e === 0 ? fit : Math.min(w / lw, h / Math.max(lh, 1e-6));
      const ox = w / 2 - cxv * scale, oy = h / 2 - cyv * scale;
      ctx.save(); ctx.imageSmoothingEnabled = scale < 2;
      ctx.drawImage(im, ox, oy, IW * scale, IH * scale);
      // paint over the white gaps between heads
      if (m.layout.blocks) { ctx.fillStyle = '#0f1115'; const B = m.layout.blocks; for (let i = 0; i < B.length - 1; i++) ctx.fillRect(ox + (B[i].x + B[i].w) * scale, oy, (B[i + 1].x - B[i].x - B[i].w) * scale, IH * scale); }
      ctx.restore();
      const cell = pr.px * scale;
      if (e < 0.6) { ctx.strokeStyle = U.rgba('#ffd54f', 1 - e); ctx.lineWidth = 2; ctx.strokeRect(ox + pr.x * scale, oy + pr.y * scale, pr.w * scale, pr.h * scale); }
      if (cell > 22) {
        const a = clamp((cell - 22) / 20, 0, 1), vals = m.patch.values, vmax = m.vmax || 0.1;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) {
          const X = ox + (pr.x + c * pr.px) * scale, Y = oy + (pr.y + r * pr.px) * scale, v = vals[r][c];
          ctx.globalAlpha = a; ctx.fillStyle = U.diverge(Math.sign(v) * Math.pow(Math.min(1, Math.abs(v) / vmax), 0.8));
          ctx.fillRect(X, Y, cell, cell); ctx.strokeStyle = 'rgba(15,17,21,.6)'; ctx.strokeRect(X, Y, cell, cell);
          if (cell > 44) { ctx.fillStyle = '#eceff4'; ctx.font = `${Math.min(17, cell * 0.24)}px ${FONT.mono}`; ctx.fillText(v.toFixed(3).replace('-', '−'), X + cell / 2, Y + cell / 2); }
        }
        ctx.globalAlpha = 1;
      }
    },
    drawLadder() {
      if (!this.W) return;
      const { ctx, w, h } = this.lad, L = this.W.ladder.slice().sort((a, b) => a.params - b.params);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      const rows = L.length + 1, rh = (h - 30) / rows, x0 = 300, x1 = w - 130, lx = v => x0 + (x1 - x0) * Math.log10(v) / 12;
      const T = this.ladderT === undefined ? 1 : this.ladderT;
      ctx.strokeStyle = C.gridMinor; ctx.lineWidth = 1;
      for (let p = 0; p <= 12; p += 3) { const X = lx(Math.pow(10, p)); ctx.beginPath(); ctx.moveTo(X, 4); ctx.lineTo(X, h - 24); ctx.stroke(); U.text(ctx, p === 0 ? '1' : '10' + SUPS(p), X, h - 4, { size: 15, color: C.dim, align: 'center', family: FONT.mono }); }
      L.forEach((m, i) => {
        const y = 6 + i * rh, isG = /Gemma 3 270M/.test(m.name), bw = (lx(m.params) - x0) * clamp(T * rows - i * 0.6, 0, 1);
        U.text(ctx, m.name.replace(' (mixture of experts; 37B active per token)', ' (MoE)'), x0 - 14, y + rh * 0.62, { size: 17, color: isG ? C.yellow : C.text, align: 'right' });
        ctx.fillStyle = isG ? C.gyellow : U.rgba(C.gblue, 0.85); U.roundRect(ctx, x0, y + rh * 0.18, Math.max(2, bw), rh * 0.62, 5); ctx.fill();
        if (bw > 0) U.text(ctx, fmtBig(m.params), x0 + bw + 8, y + rh * 0.62, { size: 16, color: C.muted, family: FONT.mono });
      });
      const y = 6 + L.length * rh;
      U.text(ctx, 'Gemini 4 Argon (2026)', x0 - 14, y + rh * 0.62, { size: 17, color: C.purple, align: 'right' });
      ctx.setLineDash([6, 6]); ctx.strokeStyle = C.purple; ctx.lineWidth = 2; ctx.strokeRect(x0, y + rh * 0.18, (x1 - x0) * T, rh * 0.62); ctx.setLineDash([]);
      U.text(ctx, 'size not disclosed', x0 + 12, y + rh * 0.64, { size: 16, color: C.purple });
    }
  });

  // ======================================================================
  // EMBED: a map of meaning (real Gemma input embeddings)
  // ======================================================================
  const EMBED_COLS = {
    'planets & space': '#c98400',
    'chemical elements': '#00897b',
    'animals': '#1e8e3e',
    'countries': '#1a73e8',
    'cities': '#3949ab',
    'emotions': '#d01884',
    'numbers': '#e65100',
    'colours': '#d93025',
    'body parts': '#6d4c41',
    'sciences': '#9334e6',
    'verbs': '#3c4043'
  };
  Deck.register('embed', {
    init(slide) {
      const E = U.data('embeddings');
      const host = slide.querySelector('[data-role=map]');
      if (!E) { U.missing(host); return; }
      this.E = E; this.proj = 'tsne'; this.hl = null; this.hover = null; this.search = null;
      this.catCol = cat => EMBED_COLS[cat] || E.categories[cat] || C.text;
      const wrap = el('div', { class: 'canvas-wrap' }, host);
      this.cv = U.canvas(wrap, { onresize: () => this.draw() });
      this.tipper = U.tip(wrap);
      const ctl = slide.querySelector('[data-role=ctl]');
      this.projSeg = seg(ctl, [{ value: 'tsne', label: 't-SNE map' }, { value: 'pca', label: 'PCA (linear)' }], 'tsne', v => this.morph(v));
      const inp = el('input', { class: 'txt', placeholder: 'find a word…', style: 'width:220px' }, ctl);
      inp.addEventListener('input', () => { const q = inp.value.trim().toLowerCase(); this.search = q ? this.E.words.find(w => w.w.toLowerCase() === q) || this.E.words.find(w => w.w.toLowerCase().startsWith(q)) : null; this.draw(); this.showNN(this.search); });
      const leg = slide.querySelector('[data-role=legend]');
      Object.keys(E.categories).forEach(cat => {
        const col = this.catCol(cat);
        const s = el('span', { class: 'leg-item', html: `<i class="sw" style="background:${col}"></i>${cat}` }, leg);
        s.addEventListener('mouseenter', () => { this.hl = cat; this.draw(); });
        s.addEventListener('mouseleave', () => { this.hl = null; this.draw(); });
      });
      this.nnBox = slide.querySelector('[data-role=nn]');
      const an = slide.querySelector('[data-role=analogies]');
      if (an) {
        const pick = E.analogies.filter(a => a.hit).slice(0, 5).concat(E.analogies.filter(a => !a.hit).slice(0, 2));
        an.innerHTML = pick.map(a => `<div class="an-row ${a.hit ? 'hit' : 'miss'}"><span class="an-q">${U.esc(a.b)} − ${U.esc(a.a)} + ${U.esc(a.c)}</span> → <b>${U.esc(a.top5[0])}</b> ${a.hit ? '✓' : `<span class="dim">(wanted ${U.esc(a.expect)})</span> ✗`}</div>`).join('');
      }
      this.t = 1; this.from = 'tsne';
      this.cv.canvas.addEventListener('pointermove', e => this.onMove(this.cv.toLocal(e)));
      this.cv.canvas.addEventListener('pointerleave', () => { this.hover = null; this.tipper.hide(); this.draw(); });
      this.draw(); this.showNN(null);
    },
    onStep(a, vis) {
      if (!this.E) return;
      if (vis && (a === 'pca' || a === 'tsne')) this.projSeg.set(a);
      if (a.startsWith('find:')) { this.search = vis ? this.E.words.find(w => w.w === a.slice(5)) || null : null; this.draw(); this.showNN(this.search); }
    },
    morph(to) { this.from = this.proj; this.proj = to; this.t = 0; const t0 = performance.now(); const tick = now => { this.t = Math.min(1, (now - t0) / 1200); this.draw(); if (this.t < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); },
    xy(wd) { const e = U.ease(this.t), a = wd[this.from], b = wd[this.proj]; return [lerp(a[0], b[0], e), lerp(a[1], b[1], e)]; },
    extentOf(proj) {
      this._ext = this._ext || {};
      if (!this._ext[proj]) {
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        this.E.words.forEach(wd => { const [x, y] = wd[proj]; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
        const mx = (x1 - x0) * 0.04 + 1e-6, my = (y1 - y0) * 0.06 + 1e-6;
        this._ext[proj] = [x0 - mx, x1 + mx * 3.5, y0 - my, y1 + my];   // extra room on the right for labels
      }
      return this._ext[proj];
    },
    view() {
      const { w, h } = this.cv, e = U.ease(this.t), A = this.extentOf(this.from), B = this.extentOf(this.proj), X = A.map((a, i) => lerp(a, B[i], e));
      return U.view(20, 20, w - 40, h - 40, X[0], X[1], X[2], X[3]);
    },
    draw() {
      if (!this.E) return;
      const { ctx, w, h } = this.cv, v = this.view(), E = this.E;
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      const focus = this.search || this.hover;
      const nnSet = focus ? new Set(focus.nn) : null;
      // links from focus to its neighbours that are on the map
      if (focus) {
        const [fx, fy] = this.xy(focus);
        E.words.forEach(wd => { if (nnSet.has(wd.w)) { const [x, y] = this.xy(wd); ctx.strokeStyle = U.rgba(C.text, 0.35); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(v.sx(fx), v.sy(fy)); ctx.lineTo(v.sx(x), v.sy(y)); ctx.stroke(); } });
      }
      const placed = [];
      const order = E.words.slice().sort((a, b) => (a.cat === this.hl) - (b.cat === this.hl));
      order.forEach(wd => {
        const [x, y] = this.xy(wd), X = v.sx(x), Y = v.sy(y), col = this.catCol(wd.cat);
        const dim = (this.hl && wd.cat !== this.hl) || (focus && wd !== focus && !nnSet.has(wd.w));
        ctx.globalAlpha = dim ? 0.18 : 1;
        U.circle(ctx, X, Y, wd === focus ? 8 : 5, col);
        ctx.font = `${wd === focus ? 26 : 18}px ${FONT.sans}`;
        const tw = ctx.measureText(wd.w).width, box = [X + 8, Y - 11, tw, 18];
        const overlaps = placed.some(p => box[0] < p[0] + p[2] && box[0] + box[2] > p[0] && box[1] < p[1] + p[3] && box[1] + box[3] > p[1]);
        if (!overlaps || wd === focus || (this.hl && wd.cat === this.hl) || (nnSet && nnSet.has(wd.w))) {
          ctx.fillStyle = wd === focus ? C.text : col; ctx.textBaseline = 'middle'; ctx.fillText(wd.w, X + 8, Y);
          placed.push(box);
        }
        ctx.globalAlpha = 1;
      });
    },
    onMove(m) {
      const v = this.view(); let best = null, bd = 14;
      for (const wd of this.E.words) { const [x, y] = this.xy(wd), d = Math.hypot(v.sx(x) - m.x, v.sy(y) - m.y); if (d < bd) { bd = d; best = wd; } }
      if (best !== this.hover) { this.hover = best; this.draw(); this.showNN(best || this.search); }
      if (best) this.tipper.show(`<b>${U.esc(best.w)}</b> <span class="dim">token #${best.id} · ${best.cat}</span><br><span class="muted">closest of all 262,144 tokens:</span><br>${best.nn.slice(0, 6).map((n, i) => `${U.esc(n)} <span class="dim">${best.nnSim ? best.nnSim[i].toFixed(2) : ''}</span>`).join(' · ')}`, m.x, m.y);
      else this.tipper.hide();
    },
    showNN(wd) {
      if (!this.nnBox) return;
      if (!wd) { this.nnBox.innerHTML = '<span class="muted">Hover a word: its nearest neighbours are computed over the <b>whole</b> 262,144-token vocabulary, in all 640 dimensions.</span>'; return; }
      this.nnBox.innerHTML = `<b style="color:${this.catCol(wd.cat)}">${U.esc(wd.w)}</b> is closest to: ` + wd.nn.slice(0, 8).map(n => `<span class="token-chip" style="font-size:20px">${U.esc(n)}</span>`).join('');
    }
  });

  // ======================================================================
  // ATTENTION: real Gemma attention heads
  // ======================================================================
  Deck.register('attention', {
    init(slide) {
      const A = U.data('attention');
      const host = slide.querySelector('[data-role=attn]');
      if (!A) { U.missing(host); return; }
      this.A = A; this.si = 0; this.q = null;
      const sentHost = slide.querySelector('[data-role=sent]');
      this.sentSeg = seg(sentHost, A.sentences.map((s, i) => ({ value: String(i), label: { wombat: 'wombat', trophy: 'trophy', water: 'water' }[s.id] || s.id })), '0', v => { this.si = +v; this.q = null; this.build(); });
      const hh = slide.querySelector('[data-role=heads]');
      this.headBtns = A.highlights.map((hd, i) => { const b = btn(hh, `L${hd.layer}·H${hd.head} <span class="dim">${hd.kind}</span>`, () => this.pickHead(i), 'small'); return b; });
      this.desc = slide.querySelector('[data-role=headdesc]');
      this.row = el('div', { class: 'att-row' }, host);
      this.arcs = U.canvas(host, { height: 260, onresize: () => this.drawArcs() });
      this.arcs.canvas.style.position = 'absolute'; this.arcs.canvas.style.left = '0'; this.arcs.canvas.style.top = '0';
      this.hm = U.canvas(slide.querySelector('[data-role=heat]'), { onresize: () => this.drawHeat() });
      this.pickHead(this.defaultHead());
    },
    defaultHead() { const k = this.A.highlights.findIndex(h => /coreference/.test(h.kind)); return k >= 0 ? k : 0; },
    headFor(a) { const k = this.A.highlights.findIndex(h => h.kind.startsWith(a.slice(5))); return k >= 0 ? k : this.defaultHead(); },
    enter(slide) { if (this.A && slide._stepPos === 0) this.pickHead(this.defaultHead()); },
    onStep(a, vis, elx) {
      if (!this.A || !a.startsWith('head:')) return;
      if (vis) { this.pickHead(this.headFor(a)); return; }
      // stepping back: show the head of the last step that is still visible (or the default)
      const slide = elx.closest('.slide'), prev = slide._steps.filter(s => s.classList.contains('visible') && (s.dataset.action || '').startsWith('head:')).pop();
      this.pickHead(prev ? this.headFor(prev.dataset.action) : this.defaultHead());
    },
    pickHead(i) {
      const hd = this.A.highlights[i]; this.layer = hd.layer; this.head = hd.head;
      let sid = hd.sentence, q = hd.focus ? hd.focus.query : null;
      if (/coreference/.test(hd.kind) && this.A.sentences.some(s => s.id === 'trophy')) {
        sid = 'trophy'; const t = this.A.sentences.find(s => s.id === 'trophy'); q = t.tokens.indexOf(' it');
      }
      const si = this.A.sentences.findIndex(s => s.id === sid); if (si >= 0) { this.si = si; this.sentSeg.set(String(si), true); }
      this.q = q;
      this.headBtns.forEach((b, k) => b.classList.toggle('primary', k === i));
      if (this.desc) this.desc.innerHTML = `<b>${U.esc(hd.title)}</b><br><span class="muted">${U.esc(hd.desc)}</span>`;
      this.build();
    },
    sent() { return this.A.sentences[this.si]; },
    build() {
      const s = this.sent();
      if (this.q === null || this.q < 0 || this.q >= s.tokens.length) this.q = s.tokens.length - 2;
      this.row.innerHTML = s.tokens.map((t, i) => `<span class="att-tok" data-i="${i}">${t === '<bos>' ? '&lt;bos&gt;' : U.esc(t).replace(/^ /, '␣')}</span>`).join('');
      this.row.querySelectorAll('.att-tok').forEach(e => {
        e.addEventListener('mouseenter', () => { this.q = +e.dataset.i; this.drawArcs(); this.drawHeat(); });
        e.addEventListener('click', () => { this.q = +e.dataset.i; this.drawArcs(); this.drawHeat(); });
      });
      this.fitRow();
      requestAnimationFrame(() => { this.fitRow(); this.drawArcs(); this.drawHeat(); });
    },
    fitRow() {   // shrink the token font until the whole sentence fits the panel width
      const avail = this.row.parentNode.clientWidth - 16, toks = Array.from(this.row.children);
      if (!avail || !toks.length) return;
      let fs = 26;
      const width = () => toks.reduce((s, t) => s + t.offsetWidth, 0) + 6 * (toks.length - 1);
      this.row.style.setProperty('--att-fs', fs + 'px');
      while (fs > 14 && width() > avail) { fs -= 1; this.row.style.setProperty('--att-fs', fs + 'px'); }
    },
    weights() { return this.sent().attn[this.layer][this.head]; },
    drawArcs() {
      if (!this.A) return;
      const { ctx, w, h } = this.arcs; ctx.clearRect(0, 0, w, h);
      const toks = Array.from(this.row.children), Wt = this.weights(), q = this.q, rowW = Wt[q];
      const base = this.row.offsetTop - 6;
      toks.forEach((t, i) => {
        const alpha = Math.min(0.82, rowW[i] * 1.5);
        t.classList.toggle('q', i === q);
        t.style.background = i <= q && i !== q ? U.rgba(C.purple, alpha) : '';
        t.style.color = i <= q && i !== q && alpha > 0.45 ? '#ffffff' : '';
        t.classList.toggle('future', i > q);
      });
      const cx = i => toks[i].offsetLeft + toks[i].offsetWidth / 2;
      for (let k = 0; k <= q; k++) {
        const a = rowW[k]; if (a < 0.01) continue;
        const x0 = cx(q), x1 = cx(k), hgt = Math.min(base - 8, 30 + Math.abs(x0 - x1) * 0.45);
        ctx.strokeStyle = U.rgba(C.purple, Math.min(1, 0.25 + a * 1.4)); ctx.lineWidth = 1 + a * 16;
        ctx.beginPath(); ctx.moveTo(x0, base); ctx.bezierCurveTo(x0, base - hgt, x1, base - hgt, x1, base); ctx.stroke();
        if (a > 0.06) U.text(ctx, Math.round(a * 100) + '%', (x0 + x1) / 2, base - hgt * 0.78 - 4, { size: 18, color: C.text, align: 'center', family: FONT.mono });
      }
    },
    drawHeat() {
      if (!this.hm) return;
      const { ctx, w, h } = this.hm, Wt = this.weights(), n = Wt.length, s = this.sent();
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      const pad = 110, cs = Math.min((w - pad - 10) / n, (h - pad - 10) / n);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const a = j <= i ? Wt[i][j] : 0;
        ctx.fillStyle = j > i ? C.bg3 : (a < 0.002 ? '#ffffff' : U.rgba(C.purple, Math.min(1, Math.sqrt(a) * 1.15)));
        ctx.fillRect(pad + j * cs, pad + i * cs, cs - 1, cs - 1);
      }
      if (this.q !== null) { ctx.strokeStyle = C.blue; ctx.lineWidth = 2; ctx.strokeRect(pad, pad + this.q * cs, n * cs, cs); }
      ctx.save(); ctx.font = `15px ${FONT.mono}`; ctx.fillStyle = C.muted; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      s.tokens.forEach((t, i) => ctx.fillText(t.replace(/^ /, '␣').slice(0, 9), pad - 6, pad + (i + 0.5) * cs));
      ctx.translate(0, 0);
      s.tokens.forEach((t, j) => { ctx.save(); ctx.translate(pad + (j + 0.5) * cs, pad - 6); ctx.rotate(-Math.PI / 3); ctx.textAlign = 'left'; ctx.fillText(t.replace(/^ /, '␣').slice(0, 9), 0, 0); ctx.restore(); });
      ctx.restore();
      U.text(ctx, `layer ${this.layer}, head ${this.head}`, 6, 22, { size: 16, color: C.muted });
    }
  });

  // ======================================================================
  // LLM3D: external visualisations (open in a new browser tab)
  // ======================================================================
  Deck.register('llm3d', {
    init(slide) {
      slide.querySelectorAll('a[target="_blank"]').forEach(a => a.addEventListener('click', () => a.blur()));
    }
  });

  // ======================================================================
  // SCALE: Chinchilla scaling law (refit of Besiroglu et al. 2024)
  // ======================================================================
  const SC = { E: 1.8172, A: 482.01, B: 2085.43, alpha: 0.3478, beta: 0.3658 };
  const lossND = (N, D) => SC.E + SC.A / Math.pow(N, SC.alpha) + SC.B / Math.pow(D, SC.beta);
  const MODELS = [
    { name: 'GPT-3', N: 175e9, D: 300e9 }, { name: 'Chinchilla', N: 70e9, D: 1.4e12 }, { name: 'Gopher', N: 280e9, D: 300e9 },
    { name: 'Llama 3.1 405B', N: 405e9, D: 15.6e12 }, { name: 'Gemma 3 270M', N: 268e6, D: 6e12 }
  ];
  Deck.register('scale', {
    init(slide) {
      this.logC = Math.log10(5.76e23);
      this.cv = U.canvas(slide.querySelector('[data-role=plot]'), { onresize: () => this.draw() });
      const ctl = slide.querySelector('[data-role=ctl]');
      this.cs = slider(ctl, { label: 'compute budget <span class="m">C</span>', min: 19, max: 27, step: 0.05, value: this.logC, width: 360, color: C.purple, fmt: v => U.fmtSci(Math.pow(10, v), 1) + ' FLOP', oninput: v => { this.logC = v; this.draw(); } });
      this.out = slide.querySelector('[data-role=out]');
      this.draw();
    },
    enter(slide) { if (slide._stepPos === 0) this.toC(Math.log10(5.76e23), 0); },
    onStep(a, vis, elx) {
      if (!a.startsWith('C:')) return;
      if (vis) { this.toC(+a.slice(2), 1.2); return; }
      const prev = elx.closest('.slide')._steps.filter(s => s.classList.contains('visible') && (s.dataset.action || '').startsWith('C:')).pop();
      this.toC(prev ? +prev.dataset.action.slice(2) : Math.log10(5.76e23), 1.2);
    },
    toC(t, dur) {
      if (this._tw) this._tw.cancel();
      if (!dur) { this.logC = t; this.cs.set(t, true); this.draw(); return; }
      const f = this.logC;
      this._tw = U.tween(dur, e => { this.logC = lerp(f, t, e); this.cs.set(this.logC, true); this.draw(); });
    },
    opt(C6) {   // minimise L(N, C/6N) numerically on a log grid
      let best = null;
      for (let lg = 5; lg <= 14; lg += 0.005) { const N = Math.pow(10, lg), D = C6 / N; const L = lossND(N, D); if (!best || L < best.L) best = { N, D, L }; }
      return best;
    },
    draw() {
      const { ctx, w, h } = this.cv; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
      const v = U.view(80, 20, w - 110, h - 80, 6, 13, 1.8, 4.2);
      U.grid(ctx, v, { step: 1, stepY: 0.5, labels: true, minor: false, fmtX: x => '10' + String(x).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join('') });
      U.text(ctx, 'model size N (parameters)', v.px + v.pw, h - 14, { size: 20, color: C.muted, align: 'right' });
      ctx.save(); ctx.translate(24, v.py + 6); ctx.rotate(-Math.PI / 2); U.text(ctx, 'predicted loss L', 0, 0, { size: 20, color: C.muted, align: 'right' }); ctx.restore();
      // faint iso-compute curves
      for (let lc = 19; lc <= 27; lc += 1) {
        const C6 = Math.pow(10, lc) / 6; ctx.strokeStyle = U.rgba(C.purple, 0.16); ctx.lineWidth = 1.5; ctx.beginPath(); let st = false;
        for (let lg = v.x0; lg <= v.x1; lg += 0.02) { const N = Math.pow(10, lg), L = lossND(N, C6 / N); if (L > v.y1) { st = false; continue; } const X = v.sx(lg), Y = v.sy(L); st ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); st = true; }
        ctx.stroke();
      }
      // optimal frontier
      ctx.strokeStyle = U.rgba(C.green, 0.6); ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.beginPath();
      for (let lc = 19; lc <= 27; lc += 0.1) { const o = this.opt(Math.pow(10, lc) / 6), X = v.sx(Math.log10(o.N)), Y = v.sy(o.L); lc === 19 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
      ctx.stroke(); ctx.setLineDash([]);
      // current budget
      const C6 = Math.pow(10, this.logC) / 6;
      ctx.save(); ctx.strokeStyle = C.purple; ctx.lineWidth = 4; ctx.shadowColor = C.purple; ctx.shadowBlur = 12; ctx.beginPath(); let st = false;
      for (let lg = v.x0; lg <= v.x1; lg += 0.01) { const N = Math.pow(10, lg), L = lossND(N, C6 / N); if (L > v.y1) { st = false; continue; } const X = v.sx(lg), Y = v.sy(L); st ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); st = true; }
      ctx.stroke(); ctx.restore();
      const o = this.opt(C6);
      ctx.save(); ctx.shadowColor = C.green; ctx.shadowBlur = 16; U.circle(ctx, v.sx(Math.log10(o.N)), v.sy(o.L), 10, C.green, C.bg, 2); ctx.restore();
      // famous models (at their own compute)
      MODELS.forEach(m => { const L = lossND(m.N, m.D), X = v.sx(Math.log10(m.N)), Y = v.sy(L); if (L < v.y1) { U.circle(ctx, X, Y, 6, C.orange, C.bg, 1.5); U.text(ctx, m.name, X + 9, Y - 8, { size: 16, color: C.orange }); } });
      if (this.out) this.out.innerHTML = `With <b>${U.fmtSci(Math.pow(10, this.logC), 1)}</b> FLOP the best choice is <b class="c-green">${fmtBig(o.N)}</b> parameters trained on <b class="c-green">${fmtBig(o.D)}</b> tokens (<b>${(o.D / o.N).toFixed(0)} tokens per parameter</b>), predicted loss <b>${fmt(o.L, 3)}</b>.`;
      // along the bright (fixed-compute) curve: small N = model too small; large N = too few tokens per parameter
      U.text(ctx, '← too few parameters', v.px + 12, v.py + 26, { size: 18, color: C.muted });
      U.text(ctx, 'too little data →', v.px + v.pw - 12, v.py + 26, { size: 18, color: C.muted, align: 'right' });
      U.text(ctx, '● best model for this budget', v.px + v.pw - 12, v.py + 52, { size: 18, color: C.green, align: 'right' });
    }
  });

  document.head.appendChild(Object.assign(document.createElement('style'), {
    textContent: `
    .leg-item{cursor:pointer;margin-right:16px;white-space:nowrap}
    .an-row{font-size:22px;padding:4px 0}.an-row.hit b{color:var(--green)}.an-row.miss b{color:var(--red)}
    .an-q{font-family:var(--mono);color:var(--muted)}
    .att-row{display:flex;flex-wrap:nowrap;gap:6px;position:absolute;left:0;right:0;top:244px;justify-content:center;z-index:2}
    .att-tok{font-family:var(--mono);font-size:var(--att-fs,26px);padding:8px 10px;border-radius:10px;border:1px solid var(--line);background:var(--bg-2);cursor:pointer;white-space:pre;transition:background .2s,color .2s}
    .att-tok.q{border-color:var(--blue);color:var(--blue);background:#e8f0fe;box-shadow:0 0 0 2px rgba(26,115,232,.25)}
    .att-tok.future{opacity:.35}
    `
  }));
})();
