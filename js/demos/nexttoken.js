/* =====================================================================
   Next-token prediction widget (real Gemma 3 270M logits)
   Used by: slide "hook" (I typed "hi") and slide "predict"
   p_i(T) = exp(logit_i / T - lse[T])  -> exact full-vocabulary probabilities
   ===================================================================== */
(function () {
  'use strict';
  const { el, slider, btn, seg, fmtPct, showToken, esc, C } = U;

  function lseAt(p, T) {
    const k = (Math.round(T * 20) / 20).toFixed(2);
    if (p.lse[k] !== undefined) return p.lse[k];
    let m = -Infinity; for (const t of p.topk) m = Math.max(m, t.logit / T);
    let s = 0; for (const t of p.topk) s += Math.exp(t.logit / T - m);
    return m + Math.log(s);   // fallback: renormalise over top-40
  }
  function probs(p, T) { const l = lseAt(p, T); return p.topk.map(t => Math.exp(t.logit / T - l)); }

  /** Build the widget inside `host`. Returns an API. */
  function NextTokenWidget(host, opt) {
    opt = Object.assign({ ids: null, initial: null, bars: 8, selector: true, sample: true, greedy: true, template: true, rowH: 54, labelW: 230 }, opt || {});
    const D = U.data('nextToken');
    if (!D) { U.missing(host, 'Next-token data missing (<span class="mono">data/next_token.js</span>).'); return null; }
    const prompts = D.prompts.filter(p => !opt.ids || opt.ids.includes(p.id));
    let cur = prompts.find(p => p.id === opt.initial) || prompts[0];
    let T = 1.0;

    host.classList.add('nt');
    const top = el('div', { class: 'nt-top' }, host);
    let selector = null;
    if (opt.selector && prompts.length > 1) {
      selector = el('select', { class: 'sel nt-select' }, top);
      prompts.forEach(p => el('option', { value: p.id, text: p.label }, selector));
      selector.value = cur.id;
      selector.addEventListener('change', () => { setPrompt(selector.value); selector.blur(); });
    }
    const promptBox = el('div', { class: 'nt-prompt' }, host);
    const bars = el('div', { class: 'nt-bars' }, host);
    const rows = [];
    for (let i = 0; i < opt.bars; i++) {
      const r = el('div', { class: 'nt-row' }, bars);
      r.style.height = opt.rowH + 'px';
      const lab = el('div', { class: 'nt-lab' }, r); lab.style.width = opt.labelW + 'px';
      const track = el('div', { class: 'nt-track' }, r);
      const fill = el('div', { class: 'nt-fill' }, track);
      const pct = el('div', { class: 'nt-pct' }, r);
      rows.push({ r, lab, fill, pct });
    }
    const other = el('div', { class: 'nt-other' }, host);
    const ctl = el('div', { class: 'controls nt-ctl' }, host);
    const tSlider = slider(ctl, { label: 'temperature <span class="m c-orange">T</span>', min: 0.1, max: 3, step: 0.05, value: 1, color: C.orange, width: 300, fmt: v => v.toFixed(2), oninput: v => { T = v; render(); } });
    let sampleBtn = null, sampled = el('span', { class: 'nt-sampled' });
    if (opt.sample) { sampleBtn = btn(ctl, '🎲 Sample a token', () => sample(), 'orange'); ctl.appendChild(sampled); }
    const greedyBox = opt.greedy ? el('div', { class: 'nt-greedy' }, host) : null;

    function setPrompt(id) { cur = prompts.find(p => p.id === id) || cur; sampled.innerHTML = ''; renderPrompt(); render(true); }
    function renderPrompt() {
      if (cur.templated && opt.template) {
        promptBox.innerHTML = cur.promptTokens.map((t, i) => {
          const ctlTok = /^<.*>$/.test(t);
          return `<span class="token-chip ${ctlTok ? 'ctl' : ''}">${t === '\n' ? '↵' : esc(t)}<span class="tid">${cur.promptIds[i]}</span></span>`;
        }).join('') + '<span class="nt-cursor">▍</span>';
      } else {
        promptBox.innerHTML = `<span class="nt-text">${esc(cur.prompt)}</span><span class="nt-cursor">▍</span>`;
      }
      if (greedyBox) greedyBox.innerHTML = `<span class="muted">Greedy continuation:</span> <span class="nt-text">${esc(cur.prompt === 'hi' && cur.templated ? '' : cur.prompt)}</span><b class="c-yellow">${esc(cur.greedy)}</b>`;
    }
    function render(instant) {
      const ps = probs(cur, T);
      const order = ps.map((p, i) => i).sort((a, b) => ps[b] - ps[a]);
      const maxP = ps[order[0]];
      let shown = 0;
      rows.forEach((row, k) => {
        const i = order[k], t = cur.topk[i], p = ps[i];
        row.lab.innerHTML = showToken(t.disp !== undefined ? t.disp : t.token);
        row.fill.style.transition = instant ? 'none' : '';
        row.fill.style.width = (100 * p / Math.max(maxP, 1e-9)) * 0.98 + '%';
        row.fill.style.background = k === 0 ? C.gyellow : C.gblue;
        row.pct.textContent = fmtPct(p);
        row.r.classList.toggle('top', k === 0);
        shown += p;
      });
      const rest = Math.max(0, 1 - shown);
      other.innerHTML = `…and <b>${(D.vocabSize - opt.bars).toLocaleString('en-US')}</b> other tokens share <b>${fmtPct(rest)}</b>`;
    }
    function sample() {
      const ps = probs(cur, T);
      let r = Math.random(), idx = -1, acc = 0;
      for (let i = 0; i < ps.length; i++) { acc += ps[i]; if (r < acc) { idx = i; break; } }
      const label = idx >= 0 ? showToken(cur.topk[idx].disp || cur.topk[idx].token) : '<span class="dim">(a rarer token outside the top 40)</span>';
      sampled.innerHTML = `→ <b class="c-yellow">${label}</b>`;
      sampled.classList.remove('pop'); void sampled.offsetWidth; sampled.classList.add('pop');
      rows.forEach(row => row.r.classList.remove('picked'));
      if (idx >= 0) {
        const order = ps.map((p, i) => i).sort((a, b) => ps[b] - ps[a]);
        const k = order.indexOf(idx);
        if (k >= 0 && k < rows.length) rows[k].r.classList.add('picked');
      }
    }
    renderPrompt(); render(true);
    return { setPrompt, setT(v) { tSlider.set(v); }, el: host, get prompt() { return cur; } };
  }
  window.NextTokenWidget = NextTokenWidget;

  // --- styles injected once (kept with the component) ---
  const css = `
  .nt-prompt{font-family:var(--mono);font-size:30px;margin:6px 0 18px;line-height:1.5;min-height:56px}
  .nt-text{color:var(--text)} .nt-cursor{color:var(--blue);animation:blink 1s steps(1) infinite;margin-left:2px}
  @keyframes blink{50%{opacity:0}}
  .nt-bars{display:flex;flex-direction:column;gap:6px}
  .nt-row{display:flex;align-items:center;gap:16px;transition:background .2s;border-radius:10px;padding:0 8px}
  .nt-row.top .nt-lab{color:var(--yellow)} .nt-row.picked{background:#feefe3}
  .nt-lab{font-family:var(--mono);font-size:28px;text-align:right;white-space:pre;overflow:hidden;text-overflow:ellipsis;flex:0 0 auto}
  .nt-track{flex:1 1 auto;height:60%;background:var(--bg-3);border-radius:8px;overflow:hidden}
  .nt-fill{height:100%;width:0;border-radius:8px;transition:width .45s cubic-bezier(.2,.8,.2,1),background .3s}
  .nt-pct{font-family:var(--mono);font-size:24px;width:110px;text-align:right;color:var(--muted);flex:0 0 auto}
  .nt-row.top .nt-pct{color:var(--text)}
  .nt-other{color:var(--muted);font-size:22px;margin:10px 0 0 8px}
  .nt-ctl{margin-top:20px} .nt-sampled{font-size:28px;font-family:var(--mono)} .nt-sampled.pop{animation:pop .5s ease}
  @keyframes pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
  .nt-greedy{margin-top:18px;font-size:26px;font-family:var(--mono);line-height:1.45}
  .nt-select{font-size:24px;margin-bottom:6px}
  `;
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: css }));

  // ---------------- slide: hook ----------------
  Deck.register('hook', {
    init(slide) {
      const host = slide.querySelector('[data-role=nt]');
      this.w = NextTokenWidget(host, { ids: ['hi'], selector: false, sample: true, greedy: false, bars: 6, rowH: 60, labelW: 150 });
      this.count = slide.querySelector('[data-role=count]');
      this.reply = slide.querySelector('[data-role=reply]');
    },
    enter() { this.typed = false; },
    onStep(action, visible) {
      if (action === 'count' && visible && this.count) {
        const target = 262144, t0 = performance.now(), elc = this.count;
        const tick = now => { const t = Math.min(1, (now - t0) / 1400); elc.textContent = Math.round(target * U.easeOut(t)).toLocaleString('en-US'); if (t < 1) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      }
      if (action === 'reply' && visible && this.reply) {
        const full = 'Hi there! How can I help you today?'; let i = 0; const r = this.reply; r.textContent = '';
        clearInterval(this._ti); this._ti = setInterval(() => { r.textContent = full.slice(0, ++i); if (i >= full.length) clearInterval(this._ti); }, 45);
      }
    }
  });

  // ---------------- slide: predict ----------------
  Deck.register('predict', {
    init(slide) {
      const host = slide.querySelector('[data-role=nt]');
      this.w = NextTokenWidget(host, { ids: ['reef', 'gold', 'water', 'dna', 'mito', 'emc', 'star', 'planet', 'hi_pt', 'hi'], initial: 'reef', bars: 7, rowH: 50, labelW: 230 });
    },
    enter(slide) { if (this.w && slide._stepPos === 0) { this.show('reef'); this.w.setT(1); } },
    show(id) { this.w.setPrompt(id); const s = this.w.el.querySelector('select'); if (s) s.value = id; },
    onStep(action, visible, elx) {
      if (!this.w || !action || !action.startsWith('prompt:')) return;
      if (visible) { this.show(action.slice(7)); return; }
      const prev = elx.closest('.slide')._steps.filter(s => s.classList.contains('visible') && (s.dataset.action || '').startsWith('prompt:')).pop();
      this.show(prev ? prev.dataset.action.slice(7) : 'reef');
    }
  });
})();
