/* =====================================================================
   Inside the Black Box — tiny slide engine
   - 1920x1080 stage scaled to fit
   - steps (.step) revealed one at a time with → / clicker
   - demos registered with Deck.register(id, {init, enter, leave, onStep, resize})
   - lazy videos (data-src), cue captions (data-cues), presenter view (P),
     notes (N), overview (O), timer (T), blackout (B), fullscreen (F), help (?)
   ===================================================================== */
(function () {
  'use strict';

  const Deck = window.Deck = {
    scale: 1, index: -1, slides: [], demos: {}, inited: new Set(),
    timerStart: 0, timerOn: false, presenter: null
  };
  Deck.register = function (id, demo) { Deck.demos[id] = demo; };
  Deck.current = () => Deck.slides[Deck.index];
  Deck.isActive = s => Deck.slides[Deck.index] === s;

  let stage, hud = {};

  function fit() {
    const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    Deck.scale = s;
    stage.style.transform = `scale(${s})`;
    stage.style.left = ((window.innerWidth - 1920 * s) / 2) + 'px';
    stage.style.top = ((window.innerHeight - 1080 * s) / 2) + 'px';
  }

  function demosOf(slide) {
    const ids = (slide.dataset.demo || '').split(/\s+/).filter(Boolean);
    return ids.map(id => ({ id, d: Deck.demos[id] })).filter(x => x.d);
  }
  function safe(fn, label) { try { return fn(); } catch (e) { console.error('[deck]', label, e); } }

  function initDemos(slide) {
    demosOf(slide).forEach(({ id, d }) => {
      if (Deck.inited.has(id)) return;
      Deck.inited.add(id);
      safe(() => d.init && d.init(slide), 'init ' + id);
    });
  }

  // ---------- videos ----------
  function prepVideos(slide) {
    slide.querySelectorAll('video[data-src]').forEach(v => {
      if (v.dataset.loaded) return;
      v.dataset.loaded = '1';
      const frame = v.closest('.video-frame');
      v.addEventListener('error', () => frame && frame.classList.add('no-video'), { once: true });
      const src = document.createElement('source');
      src.src = v.dataset.src; src.type = 'video/mp4';
      src.addEventListener('error', () => frame && frame.classList.add('no-video'));
      v.appendChild(src);
      v.load();
      if (v.dataset.cues && frame) {
        let cues = [];
        try { cues = JSON.parse(v.dataset.cues); } catch (e) { cues = []; }
        const cap = frame.querySelector('.vcap');
        if (cap && cues.length) v.addEventListener('timeupdate', () => {
          let label = '';
          for (const c of cues) if (v.currentTime + 0.05 >= c.t) label = c.label;
          if (cap.dataset.label !== label) { cap.dataset.label = label; cap.innerHTML = label; }
        });
      }
      if (frame) frame.addEventListener('click', e => { if (e.target.closest('button')) return; v.paused ? v.play().catch(() => {}) : v.pause(); });
    });
  }
  function playVideos(slide) {
    slide.querySelectorAll('video[data-autoplay]').forEach(v => {
      if (v.dataset.restart !== 'false') { try { v.currentTime = 0; } catch (e) { /* not ready */ } }
      const p = v.play(); if (p && p.catch) p.catch(() => {});
    });
  }
  function pauseVideos(slide) { slide.querySelectorAll('video').forEach(v => v.pause()); }
  Deck.toggleVideo = function (restart) {
    const v = Deck.current() && Deck.current().querySelector('video');
    if (!v) return;
    if (restart) { v.currentTime = 0; v.play().catch(() => {}); return; }
    v.paused ? v.play().catch(() => {}) : v.pause();
  };

  // ---------- steps ----------
  function setStep(slide, i, visible) {
    const el = slide._steps[i];
    if (!el) return;
    el.classList.toggle('visible', visible);
    const action = el.dataset.action;
    if (action) demosOf(slide).forEach(({ id, d }) => d.onStep && safe(() => d.onStep(action, visible, el), 'step ' + id));
  }
  function resetSteps(slide, showAll) {
    slide._steps.forEach((el, i) => el.classList.toggle('visible', !!showAll));
    slide._stepPos = showAll ? slide._steps.length : 0;
    if (showAll) slide._steps.forEach((el, i) => { if (el.dataset.action) setStep(slide, i, true); });
  }

  // ---------- navigation ----------
  function go(i, opts) {
    opts = opts || {};
    i = Math.max(0, Math.min(Deck.slides.length - 1, i));
    if (i === Deck.index && !opts.force) return;
    const old = Deck.current();
    if (old) {
      demosOf(old).forEach(({ id, d }) => d.leave && safe(() => d.leave(old), 'leave ' + id));
      pauseVideos(old);
      old.classList.remove('active');
    }
    Deck.index = i;
    const s = Deck.current();
    prepVideos(s);
    initDemos(s);
    resetSteps(s, opts.showAllSteps);
    s.classList.add('active');
    demosOf(s).forEach(({ id, d }) => d.enter && safe(() => d.enter(s), 'enter ' + id));
    playVideos(s);
    // prefetch the next slide's demo + video so transitions are instant
    const nx = Deck.slides[i + 1];
    if (nx) setTimeout(() => { prepVideos(nx); initDemos(nx); }, 600);
    if (!Deck.timerStart && i > 0) startTimer();
    updateHUD();
    if (history.replaceState) history.replaceState(null, '', '#' + (s.id || (i + 1)));
  }
  Deck.go = go;
  Deck.next = function () {
    const s = Deck.current();
    if (s._stepPos < s._steps.length) { setStep(s, s._stepPos, true); s._stepPos++; updateHUD(); return; }
    go(Deck.index + 1);
  };
  Deck.prev = function () {
    const s = Deck.current();
    if (s._stepPos > 0) { s._stepPos--; setStep(s, s._stepPos, false); updateHUD(); return; }
    go(Deck.index - 1, { showAllSteps: true });
  };
  Deck.goById = function (id) { const i = Deck.slides.findIndex(s => s.id === id); if (i >= 0) go(i); };

  function indexFromHash() {
    const h = decodeURIComponent((location.hash || '').replace(/^#\/?/, ''));
    if (!h) return 0;
    if (/^\d+$/.test(h)) return Math.max(0, +h - 1);
    const i = Deck.slides.findIndex(s => s.id === h);
    return i >= 0 ? i : 0;
  }

  // ---------- timer ----------
  function plannedStart(i) { let m = 0; for (let k = 0; k < i; k++) m += +(Deck.slides[k].dataset.minutes || 0); return m * 60; }
  function totalPlanned() { return plannedStart(Deck.slides.length); }
  function startTimer() { Deck.timerStart = Date.now(); }
  const mmss = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  function timerText() {
    if (!Deck.timerStart) return { html: `ready · plan ${mmss(totalPlanned())}`, plain: 'not started' };
    const el = (Date.now() - Deck.timerStart) / 1000;
    const plan = plannedStart(Deck.index);
    const d = el - plan;
    const cls = d > 60 ? 'behind' : d < -30 ? 'ahead' : '';
    const sign = d >= 0 ? '+' : '−';
    return { html: `${mmss(el)} <span class="${cls}">(${sign}${mmss(Math.abs(d))} vs plan)</span>`, plain: `${mmss(el)} elapsed · slide planned at ${mmss(plan)} (${sign}${mmss(Math.abs(d))})` };
  }
  setInterval(() => {
    if (hud.timer && Deck.timerOn) hud.timer.innerHTML = timerText().html;
    updatePresenter(true);
  }, 1000);

  // ---------- HUD, notes, overview, presenter ----------
  function buildHUD() {
    const mk = (id, tag) => { const e = document.createElement(tag || 'div'); e.id = id; document.body.appendChild(e); return e; };
    hud.progress = mk('progress'); hud.counter = mk('counter'); hud.chapter = mk('chapterlabel');
    hud.timer = mk('timer'); hud.notes = mk('notes'); hud.overview = mk('overview'); hud.black = mk('blackout'); hud.help = mk('help');
    const nav = mk('navbtns');
    nav.innerHTML = '<button title="Previous (←)">‹</button><button title="Overview (O)">☰</button><button title="Next (→)">›</button>';
    const [b1, b2, b3] = nav.querySelectorAll('button');
    b1.onclick = () => Deck.prev(); b2.onclick = toggleOverview; b3.onclick = () => Deck.next();
    hud.help.innerHTML = `<h3 style="margin:0 0 12px;font-weight:500">Presenter keys</h3><table>
      <tr><td>→ ␣ PgDn</td><td>next step / slide</td></tr><tr><td>← PgUp</td><td>previous</td></tr>
      <tr><td>Home / End</td><td>first / last slide</td></tr><tr><td>12 ⏎</td><td>jump to slide 12</td></tr>
      <tr><td>O / Esc</td><td>overview</td></tr><tr><td>P</td><td>presenter window (notes + timer)</td></tr>
      <tr><td>N</td><td>notes drawer</td></tr><tr><td>T</td><td>timer pill</td></tr>
      <tr><td>K / J</td><td>play-pause / restart video</td></tr><tr><td>B</td><td>blackout</td></tr>
      <tr><td>F</td><td>fullscreen</td></tr><tr><td>?</td><td>this help</td></tr></table>`;
    hud.help.addEventListener('click', () => hud.help.classList.remove('on'));
    buildOverview();
  }
  function chapterOf(s) { return s.dataset.chapter || ''; }
  function updateHUD() {
    const n = Deck.slides.length, s = Deck.current();
    hud.progress.style.width = (100 * Deck.index / Math.max(1, n - 1)) + '%';
    hud.counter.textContent = `${Deck.index + 1} / ${n}`;
    hud.chapter.textContent = chapterOf(s);
    const notes = s.querySelector('aside.notes');
    hud.notes.innerHTML = `<h4>Notes · ${Deck.index + 1}. ${s.dataset.title || ''}</h4>` + (notes ? notes.innerHTML : '<p class="dim">No notes.</p>');
    hud.overview.querySelectorAll('.ov-item').forEach((e, i) => e.classList.toggle('cur', i === Deck.index));
    updatePresenter(false);
  }
  function buildOverview() {
    let html = '<div style="display:flex;justify-content:space-between;align-items:baseline"><h2 style="font-weight:400;margin:0;font-family:var(--sans)">Inside the Black Box · slide overview</h2><span class="dim" style="font-family:var(--sans)">click a slide · Esc to close</span></div>';
    let lastCh = null, k = 0;
    Deck.slides.forEach((s, i) => {
      const ch = chapterOf(s);
      if (ch !== lastCh) { if (lastCh !== null) html += '</div>'; html += `<h3>${ch || 'Opening'}</h3><div class="ov-grid">`; lastCh = ch; }
      const m = +(s.dataset.minutes || 0);
      html += `<div class="ov-item" data-i="${i}"><span class="n">${i + 1}</span>${s.dataset.title || s.id}<span class="mins">${m ? m + "′" : ''}</span></div>`;
      k++;
    });
    html += '</div>';
    html += `<p class="dim" style="margin-top:22px;font-family:var(--sans);font-size:14px">Planned total ≈ ${Math.round(totalPlanned() / 60)} min</p>`;
    hud.overview.innerHTML = html;
    hud.overview.addEventListener('click', e => {
      const it = e.target.closest('.ov-item');
      if (it) { toggleOverview(false); go(+it.dataset.i); }
    });
  }
  function toggleOverview(force) {
    const on = typeof force === 'boolean' ? force : !hud.overview.classList.contains('on');
    hud.overview.classList.toggle('on', on);
  }

  function openPresenter() {
    if (Deck.presenter && !Deck.presenter.closed) { Deck.presenter.focus(); return; }
    const w = window.open('', 'bb-presenter', 'width=980,height=760');
    if (!w) { alert('Popup blocked — allow popups to use the presenter window.'); return; }
    Deck.presenter = w;
    w.document.open();
    w.document.write(`<!doctype html><html><head><title>Presenter · Inside the Black Box</title><style>
      body{margin:0;background:#f8f9fa;color:#202124;font:16px/1.5 Roboto,system-ui,sans-serif;padding:22px 28px}
      .top{display:flex;justify-content:space-between;align-items:baseline;gap:20px}
      #cur{font-size:28px;font-weight:500} #num{color:#5f6368;font-family:monospace;font-size:18px}
      #timer{font-family:monospace;font-size:24px;color:#1a73e8} .behind{color:#d93025}.ahead{color:#1e8e3e}
      #steps{color:#5f6368;margin:4px 0 12px} #next{color:#5f6368;margin-top:14px;font-size:18px}
      #notes{font-size:21px;line-height:1.55;background:#ffffff;border:1px solid #dadce0;border-radius:12px;padding:18px 22px;margin-top:10px;box-shadow:0 1px 3px rgba(60,64,67,.08)}
      #notes b{color:#1a73e8;font-weight:500} #notes em{color:#00897b;font-style:normal}
      .keys{color:#80868b;font-size:13px;margin-top:16px} button{font-size:18px;margin-right:8px;background:#ffffff;color:#202124;border:1px solid #dadce0;border-radius:8px;padding:6px 14px;cursor:pointer}
      </style></head><body><div class="top"><div><span id="num"></span> <span id="cur"></span></div><div id="timer"></div></div>
      <div id="steps"></div><div><button id="bp">‹ prev</button><button id="bn">next ›</button><button id="bt">reset timer</button></div>
      <div id="notes"></div><div id="next"></div>
      <div class="keys">Keys work in this window too: → ← space PgUp PgDn · K video · B blackout</div></body></html>`);
    w.document.close();
    const opener = window;
    w.document.addEventListener('keydown', e => opener.Deck.key(e));
    w.document.getElementById('bp').onclick = () => opener.Deck.prev();
    w.document.getElementById('bn').onclick = () => opener.Deck.next();
    w.document.getElementById('bt').onclick = () => { opener.Deck.timerStart = Date.now(); };
    updatePresenter(false);
  }
  function updatePresenter(timerOnly) {
    const w = Deck.presenter;
    if (!w || w.closed || !w.document || !w.document.getElementById('timer')) return;
    const t = timerText();
    w.document.getElementById('timer').innerHTML = t.html;
    if (timerOnly) return;
    const s = Deck.current(), nx = Deck.slides[Deck.index + 1];
    const notes = s.querySelector('aside.notes');
    w.document.getElementById('num').textContent = `${Deck.index + 1}/${Deck.slides.length}`;
    w.document.getElementById('cur').textContent = s.dataset.title || s.id;
    w.document.getElementById('steps').textContent = s._steps.length ? `step ${s._stepPos} of ${s._steps.length} · planned ${s.dataset.minutes || '?'} min` : `planned ${s.dataset.minutes || '?'} min`;
    w.document.getElementById('notes').innerHTML = notes ? notes.innerHTML : '<i>No notes</i>';
    w.document.getElementById('next').innerHTML = nx ? `Next → <b>${nx.dataset.title || nx.id}</b>` : 'End of deck';
  }

  // ---------- keyboard ----------
  let digits = '';
  Deck.key = function (e) {
    const tag = (e.target && e.target.tagName) || '';
    const inField = /INPUT|SELECT|TEXTAREA/.test(tag) && e.target.type !== 'range';
    const k = e.key;
    if (k === 'PageDown') { e.preventDefault(); Deck.next(); return; }
    if (k === 'PageUp') { e.preventDefault(); Deck.prev(); return; }
    if (inField) { if (k === 'Escape') e.target.blur(); return; }
    if (e.target && e.target.type === 'range' && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    switch (k) {
      case 'ArrowRight': case 'ArrowDown': case ' ': e.preventDefault(); Deck.next(); break;
      case 'ArrowLeft': case 'ArrowUp': e.preventDefault(); Deck.prev(); break;
      case 'Home': go(0); break;
      case 'End': go(Deck.slides.length - 1); break;
      case 'Enter': if (digits) { go(+digits - 1); digits = ''; } break;
      case 'o': case 'O': toggleOverview(); break;
      case 'Escape': toggleOverview(false); hud.help.classList.remove('on'); hud.notes.classList.remove('on'); break;
      case 'n': case 'N': hud.notes.classList.toggle('on'); break;
      case 'p': case 'P': openPresenter(); break;
      case 't': case 'T': Deck.timerOn = !Deck.timerOn; hud.timer.classList.toggle('on', Deck.timerOn); hud.timer.innerHTML = timerText().html; break;
      case 'b': case 'B': case '.': hud.black.classList.toggle('on'); break;
      case 'f': case 'F': if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {}); else document.exitFullscreen(); break;
      case 'k': case 'K': Deck.toggleVideo(false); break;
      case 'j': case 'J': Deck.toggleVideo(true); break;
      case '?': case 'h': case 'H': hud.help.classList.toggle('on'); break;
      default:
        if (/^\d$/.test(k)) { digits += k; clearTimeout(Deck._dt); Deck._dt = setTimeout(() => digits = '', 1600); }
    }
  };

  function init() {
    stage = document.getElementById('stage');
    Deck.slides = Array.from(stage.querySelectorAll(':scope > .slide'));
    Deck.slides.forEach((s, i) => {
      const steps = Array.from(s.querySelectorAll('.step'));
      s._steps = steps.map((e, k) => ({ e, k, o: e.dataset.order !== undefined ? +e.dataset.order : k })).sort((a, b) => a.o - b.o || a.k - b.k).map(x => x.e);
      s._stepPos = 0;
    });
    buildHUD();
    fit();
    let rt = 0;
    window.addEventListener('resize', () => {
      fit();
      clearTimeout(rt);
      rt = setTimeout(() => {
        if (window.U) U.resizeAll();
        Deck.inited.forEach(id => { const d = Deck.demos[id]; d && d.resize && safe(() => d.resize(), 'resize ' + id); });
      }, 120);
    });
    document.addEventListener('keydown', Deck.key);
    let tx = null;
    stage.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', e => {
      if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; tx = null;
      if (Math.abs(dx) > 80 && !e.target.closest('canvas,input,.demo')) (dx < 0 ? Deck.next() : Deck.prev());
    });
    const start = () => go(indexFromHash(), { force: true });
    // load *every* @font-face up front (canvases draw text once, so fonts must be ready first)
    if (document.fonts && document.fonts.forEach) {
      const faces = []; document.fonts.forEach(f => faces.push(f.load().catch(() => null)));
      const timeout = new Promise(res => setTimeout(res, 3000));
      Promise.race([Promise.all(faces).then(() => document.fonts.ready), timeout]).then(start, start);
    } else start();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
