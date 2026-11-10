/* =====================================================================
   Chapter 6 finale: How a humble Transformer becomes an Agent (slide `agents`)
   - Interactive "Transformer-in-a-Loop" visualizer (1120 × 600 design canvas)
     showing the exact token-level mechanism:
       1. Context window tape (System + Tool Schemas + User + Turns + Observations)
       2. Same Transformer predicting next-token probabilities (including <tool_call>)
       3. Stop-and-parse gate + Guardrail approval
       4. External execution (Python sandbox, MCP server, Shell/Files) returning truth
   - 3 switchable real-world scenarios + "Plain Transformer" vs "Agent" compare toggle
   - Synced with deck → steps (reversible) + interactive card selection
   - Optional 3Blue1Brown-style Manim reel (assets/video/m09_agent_loop.mp4, K or button)
   Palette: Google Light Material (WCAG 2.2 AA contrast on all text).
   ===================================================================== */
(function () {
  'use strict';
  const { FONT, el, seg, btn, clamp, lerp, ease } = U;

  // Google News Partner Marketing Hub light palette (WCAG 2.2 AA verified)
  const G = {
    bg: '#F8F9FA', panel: '#FFFFFF', surface: '#F1F3F4', line: '#DADCE0',
    ink: '#202124', muted: '#5F6368', grey: '#9AA0A6',
    blue: '#4285F4', tBlue: '#174EA6', lBlue: '#D2E3FC',
    red: '#EA4335', tRed: '#A50E0E', lRed: '#FAD2CF',
    yellow: '#FBBC04', orange: '#E37400', lYellow: '#FEEFC3',
    green: '#34A853', tGreen: '#0D652D', lGreen: '#CEEAD6'
  };

  // Scenarios: every turn is scientifically accurate and self-consistent
  const SCENARIOS = {
    code: {
      id: 'code',
      title: 'Compute pH of 0.015 M acetic acid (Ka = 1.8×10⁻⁵)',
      plain: {
        answer: '"Roughly pH ≈ 3.12"',
        probs: [['≈', 0.41], ['3', 0.34], ['about', 0.14], ['2', 0.06]],
        tokens: 28, passes: 1, calls: 0,
        status: 'Unverified mental guess (exact is 3.292)', ok: false,
        note: 'One forward pass guesses from training-corpus patterns — no calculator, no check.'
      },
      turns: [
        {
          pill: 0, phase: 'call', label: 'Turn 1 · Model emits a tool call',
          caption: 'Tool schemas sit in the prompt. The same next-token predictor emits a structured JSON call — and pauses.',
          probs: [['<call>', 0.94], ['"To', 0.04], ['"pH', 0.01], ['"Let', 0.01]],
          callTitle: 'run_python',
          callCode: 'Ka = 1.8e-5; c = 0.015\nh = (-Ka + math.sqrt(Ka**2 + 4*Ka*c))/2',
          toolName: 'Python Sandbox (CPU)',
          toolResult: 'NameError: name "math" is not defined',
          toolOk: false,
          tape: [
            { k: 'sys', t: 'System + [run_python]' },
            { k: 'usr', t: 'pH of 0.015M acetic?' },
            { k: 'call', t: 'call: run_python(...)' }
          ],
          passes: 1, calls: 1, ctxTokens: 168,
          grounding: '⏸ Paused for Python sandbox', groundOk: null
        },
        {
          pill: 1, phase: 'obs', label: 'World → Observation injected (Error caught!)',
          caption: 'The harness runs Python outside the model, catches the real NameError, and appends it to the context window.',
          probs: [['import', 0.91], ['<call>', 0.07], ['"Oops', 0.01], ['"Error', 0.01]],
          callTitle: 'run_python',
          callCode: 'Ka = 1.8e-5; c = 0.015\nh = (-Ka + math.sqrt(Ka**2 + 4*Ka*c))/2',
          toolName: 'Python Sandbox (CPU)',
          toolResult: 'NameError: name "math" is not defined',
          toolOk: false,
          tape: [
            { k: 'sys', t: 'System + [run_python]' },
            { k: 'usr', t: 'pH of 0.015M acetic?' },
            { k: 'call', t: 'call: run_python' },
            { k: 'err', t: 'obs: NameError' }
          ],
          passes: 1, calls: 1, ctxTokens: 194,
          grounding: '⚠ Error fed back into context', groundOk: false
        },
        {
          pill: 2, phase: 'call2', label: 'Turn 2 · Self-correction from context',
          caption: 'Prefix KV cache is reused. Reading the error in its own context, the model adds "import math" and re-runs.',
          probs: [['<call>', 0.97], ['"The', 0.02], ['"Let', 0.01], ['"3.', 0.00]],
          callTitle: 'run_python (retry)',
          callCode: 'import math\nprint(round(-math.log10(h), 4))',
          toolName: 'Python Sandbox (CPU)',
          toolResult: 'stdout: 3.2918',
          toolOk: true,
          tape: [
            { k: 'sys', t: 'System + [run_python]' },
            { k: 'usr', t: 'pH of 0.015M acetic?' },
            { k: 'call', t: 'call #1' },
            { k: 'err', t: 'NameError' },
            { k: 'call', t: 'call #2: import math' },
            { k: 'ok', t: 'obs: 3.2918' }
          ],
          passes: 2, calls: 2, ctxTokens: 258,
          grounding: '✓ Exact result returned (3.2918)', groundOk: true
        },
        {
          pill: 3, phase: 'done', label: 'Turn 3 · Grounded final answer',
          caption: 'Only after observing 3.2918 in context does the Transformer emit the final answer for the user.',
          probs: [['"Exact', 0.96], ['"The', 0.03], ['"3.29', 0.01], ['<call>', 0.00]],
          callTitle: 'Final answer',
          callCode: 'pH = 3.292 (exact quadratic)',
          toolName: 'Verified Output',
          toolResult: 'pH = 3.2918  ✓  (exact quadratic)',
          toolOk: true,
          tape: [
            { k: 'sys', t: 'System + [run_python]' },
            { k: 'usr', t: 'pH of 0.015M acetic?' },
            { k: 'call', t: 'call #1' },
            { k: 'err', t: 'NameError' },
            { k: 'call', t: 'call #2' },
            { k: 'ok', t: '3.2918' },
            { k: 'ans', t: 'pH = 3.292 ✓' }
          ],
          passes: 3, calls: 2, ctxTokens: 296,
          grounding: '✓ Grounded in real execution', groundOk: true
        }
      ]
    },
    mcp: {
      id: 'mcp',
      title: 'Check Gemini 4 Argon context window & cutoff (Oct 2026)',
      plain: {
        answer: '"Gemini 1.5 had 1M… maybe 2M?"',
        probs: [['"2M', 0.38], ['"1M', 0.35], ['"I', 0.16], ['"512K', 0.07]],
        tokens: 34, passes: 1, calls: 0,
        status: 'Frozen at training cutoff — risks stale facts', ok: false,
        note: 'Weights freeze after training. Without live retrieval, models guess or cite old versions.'
      },
      turns: [
        {
          pill: 0, phase: 'call', label: 'Turn 1 · Model invokes an MCP tool',
          caption: 'MCP ("USB-C for AI") exposes external search & databases as standard tool schemas in the prompt.',
          probs: [['<call>', 0.93], ['"Gemini', 0.04], ['"Let', 0.02], ['"As', 0.01]],
          callTitle: 'mcp: search_docs',
          callCode: '{"server":"deepmind-docs",\n "query":"Gemini 4 Argon model card"}',
          toolName: 'MCP Server · Docs',
          toolResult: 'Fetching model card…',
          toolOk: true,
          tape: [
            { k: 'sys', t: 'System + [mcp:search_docs]' },
            { k: 'usr', t: 'Gemini 4 Argon specs?' },
            { k: 'call', t: 'mcp: search_docs(...)' }
          ],
          passes: 1, calls: 1, ctxTokens: 210,
          grounding: '⏸ Calling MCP tool server', groundOk: null
        },
        {
          pill: 1, phase: 'obs', label: 'MCP returns live primary source',
          caption: 'The MCP server queries the live document store and injects verified excerpts back into context.',
          probs: [['"Per', 0.89], ['<call>', 0.08], ['"The', 0.02], ['"1M', 0.01]],
          callTitle: 'mcp: search_docs',
          callCode: '{"server":"deepmind-docs",\n "query":"Gemini 4 Argon model card"}',
          toolName: 'MCP Server · Docs',
          toolResult: '1,048,576 tokens · cutoff Mar 2026 · sparse MoE',
          toolOk: true,
          tape: [
            { k: 'sys', t: 'System + [mcp:search_docs]' },
            { k: 'usr', t: 'Gemini 4 Argon specs?' },
            { k: 'call', t: 'mcp: search_docs' },
            { k: 'ok', t: 'obs: 1,048,576 tok · Mar 2026' }
          ],
          passes: 1, calls: 1, ctxTokens: 412,
          grounding: '✓ Primary source injected into KV cache', groundOk: true
        },
        {
          pill: 2, phase: 'call2', label: 'Turn 2 · Cross-check or synthesize',
          caption: 'Working memory holds the retrieved snippet alongside the prompt — no weight updates needed.',
          probs: [['"Gemini', 0.95], ['"1,048', 0.03], ['"Sparse', 0.01], ['<call>', 0.01]],
          callTitle: 'Verify citation',
          callCode: 'Source: model-cards/gemini-4-argon (Oct 2026)',
          toolName: 'MCP Server · Docs',
          toolResult: 'Citation verified · 1,048,576-token context',
          toolOk: true,
          tape: [
            { k: 'sys', t: 'System + [mcp:search_docs]' },
            { k: 'usr', t: 'Gemini 4 Argon specs?' },
            { k: 'call', t: 'mcp: search_docs' },
            { k: 'ok', t: 'obs: 1M ctx · Mar 2026' },
            { k: 'ans', t: 'Grounded answer + link' }
          ],
          passes: 2, calls: 1, ctxTokens: 468,
          grounding: '✓ Grounded in live MCP source', groundOk: true
        },
        {
          pill: 3, phase: 'done', label: 'Turn 2 · Cited, up-to-date reply',
          caption: 'The model stays frozen, yet answers with post-cutoff facts grounded in retrieved evidence.',
          probs: [['"Gemini', 0.96], ['"1M', 0.03], ['"Oct', 0.01], ['<call>', 0.00]],
          callTitle: 'Final answer',
          callCode: '1,048,576-token context · cutoff Mar 2026',
          toolName: 'Verified Output',
          toolResult: 'Cited: Oct 2026 model card  ✓',
          toolOk: true,
          tape: [
            { k: 'sys', t: 'System + [mcp:search_docs]' },
            { k: 'usr', t: 'Gemini 4 Argon specs?' },
            { k: 'call', t: 'mcp: search_docs' },
            { k: 'ok', t: 'obs: 1M ctx · Mar 2026' },
            { k: 'ans', t: 'Verified reply ✓' }
          ],
          passes: 2, calls: 1, ctxTokens: 468,
          grounding: '✓ Grounded in live MCP source', groundOk: true
        }
      ]
    },
    guard: {
      id: 'guard',
      title: 'Fix failing lab pipeline & apply patch safely',
      plain: {
        answer: '"Try changing line 42… (untested)"',
        probs: [['"Try', 0.44], ['"It', 0.28], ['"Check', 0.18], ['"Maybe', 0.07]],
        tokens: 46, passes: 1, calls: 0,
        status: 'Cannot read logs, run tests, or verify a fix', ok: false,
        note: 'A chat assistant suggests edits blindly. You still have to copy, run, debug, and verify.'
      },
      turns: [
        {
          pill: 0, phase: 'call', label: 'Turn 1 · Read memory + run tests',
          caption: 'Persistent files (AGENTS.md + repo) give long-term state. The agent inspects tests first.',
          probs: [['<call>', 0.95], ['"First', 0.03], ['"Let', 0.01], ['"I', 0.01]],
          callTitle: 'read_file + run_tests',
          callCode: '{"tool":"run_tests", "target":"tests/test_norm.py"}',
          toolName: 'Sandboxed Shell',
          toolResult: 'FAIL: NaN when std == 0 (1/14 failed)',
          toolOk: false,
          tape: [
            { k: 'sys', t: 'AGENTS.md + [tools]' },
            { k: 'usr', t: 'Fix failing pipeline' },
            { k: 'call', t: 'run_tests()' },
            { k: 'err', t: 'obs: 1/14 failed (NaN)' }
          ],
          passes: 1, calls: 1, ctxTokens: 320,
          grounding: '⚠ Reproduced failure in sandbox', groundOk: false
        },
        {
          pill: 1, phase: 'obs', label: 'Turn 2 · Propose edit → Human Gate',
          caption: 'Writing files or running shell commands hits a guardrail gate: least privilege + human approval.',
          probs: [['<call>', 0.92], ['"I', 0.05], ['"The', 0.02], ['"Line', 0.01]],
          callTitle: 'write_patch [GATED]',
          callCode: 'if std == 0: return x - mean  # guard ÷0',
          toolName: 'Approval Gate · User ✓',
          toolResult: 'Prompt-injection check ✓ · User approved diff',
          toolOk: true,
          tape: [
            { k: 'sys', t: 'AGENTS.md + [tools]' },
            { k: 'usr', t: 'Fix pipeline' },
            { k: 'call', t: 'run_tests' },
            { k: 'err', t: '1 failed' },
            { k: 'call', t: 'patch [Approved ✓]' }
          ],
          passes: 2, calls: 2, ctxTokens: 438,
          grounding: '🛡️ Gated & approved by human', groundOk: true
        },
        {
          pill: 2, phase: 'call2', label: 'Turn 3 · Re-run tests to verify',
          caption: 'After applying the approved patch, the agent re-runs the test suite to verify the fix.',
          probs: [['<call>', 0.96], ['"Done', 0.02], ['"Fixed', 0.01], ['"Tests', 0.01]],
          callTitle: 'run_tests (verify)',
          callCode: '{"tool":"run_tests", "target":"tests/"}',
          toolName: 'Sandboxed Shell',
          toolResult: '14 / 14 tests passed ✓ (0.4 s)',
          toolOk: true,
          tape: [
            { k: 'sys', t: 'AGENTS.md' },
            { k: 'usr', t: 'Fix pipeline' },
            { k: 'call', t: 'test' },
            { k: 'err', t: 'fail' },
            { k: 'call', t: 'patch ✓' },
            { k: 'ok', t: 'obs: 14/14 passed ✓' }
          ],
          passes: 3, calls: 3, ctxTokens: 512,
          grounding: '✓ 14/14 unit tests pass', groundOk: true
        },
        {
          pill: 3, phase: 'done', label: 'Turn 4 · Verified summary delivered',
          caption: 'Planning + tool execution + memory + safety gates turn next-token prediction into reliable work.',
          probs: [['"Fixed', 0.97], ['"All', 0.02], ['"The', 0.01], ['<call>', 0.00]],
          callTitle: 'Final report',
          callCode: 'Guarded std==0 in norm.py · 14/14 tests pass',
          toolName: 'Verified Output',
          toolResult: 'Diff clean · 14/14 tests passed ✓',
          toolOk: true,
          tape: [
            { k: 'sys', t: 'AGENTS.md' },
            { k: 'usr', t: 'Fix pipeline' },
            { k: 'call', t: 'test → patch → retest' },
            { k: 'ok', t: '14/14 ✓' },
            { k: 'ans', t: 'Verified summary ✓' }
          ],
          passes: 4, calls: 3, ctxTokens: 560,
          grounding: '✓ Verified & safely gated', groundOk: true
        }
      ]
    }
  };

  // Canvas hit-test regions for interactive tooltips (design coordinates 1120 × 600)
  const HIT_REGIONS = [
    {
      x: 24, y: 16, w: 1072, h: 100, title: 'Context Window (Working Memory & KV Cache)',
      body: 'Everything the Transformer sees is a flat sequence of tokens: system prompt, JSON tool schemas, user request, its own tool calls, and real tool outputs. Existing prefix KV vectors are reused across turns.'
    },
    {
      x: 28, y: 152, w: 396, h: 274, title: 'The Humble Transformer (Unchanged Math)',
      body: 'The weights and next-token math do not change. Post-training (SFT + RLVR) simply taught the model to predict structured tool-call tokens when it needs external facts, calculation, or action.'
    },
    {
      x: 492, y: 156, w: 258, h: 112, title: 'Stop-and-Parse Gate + Guardrails',
      body: 'When a stop-for-tool token appears, the harness pauses GPU decoding, parses the JSON call (often grammar-constrained), and checks permissions or asks the human before risky actions.'
    },
    {
      x: 794, y: 156, w: 298, h: 270, title: 'External World (Tools & MCP Servers)',
      body: 'Ordinary software executes outside the model: Python sandboxes, web/document search, browsers, lab instruments, or MCP servers. Real outputs (including errors!) flow back into the prompt.'
    }
  ];

  // Drawing helpers
  function tx(ctx, s, x, y, size, color, o) {
    o = o || {};
    ctx.save();
    ctx.font = `${o.weight || 400} ${size}px ${o.mono ? FONT.mono : FONT.sans}`;
    ctx.fillStyle = color; ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'alphabetic';
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    ctx.fillText(s, x, y);
    ctx.restore();
  }
  function rbox(ctx, x, y, w, h, r, fill, stroke, lw, dash) {
    U.roundRect(ctx, x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.save(); ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.5; if (dash) ctx.setLineDash(dash); ctx.stroke(); ctx.restore(); }
  }
  function arrowHead(ctx, x, y, ang, size, color) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size * 1.4, -size * 0.65);
    ctx.lineTo(-size * 1.0, 0);
    ctx.lineTo(-size * 1.4, size * 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  function clipText(ctx, str, maxW, font) {
    ctx.save(); ctx.font = font;
    if (ctx.measureText(str).width <= maxW) { ctx.restore(); return str; }
    let s = str;
    while (s.length > 3 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1);
    ctx.restore();
    return s + '…';
  }

  const NSTEP = 5; // 5 deck steps: 1..4 highlight pillars + advance loop, 5 enables self-correction/complete

  Deck.register('agents', {
    init(slide) {
      this.slide = slide;
      this.root = slide.querySelector('[data-role=root]');
      this.stage = slide.querySelector('[data-role=stage]');
      this.scenId = 'code';
      this.mode = 'agent'; // 'agent' | 'plain'
      this.turn = 0;       // 0..3 inside scenario.turns
      this.pulseT = 0;
      this.autoPlay = false;
      this.autoTimer = 0;
      this.hovIdx = -1;

      // Controls
      const scenHost = slide.querySelector('[data-role=scen]');
      seg(scenHost, [
        { value: 'code', label: '🧪 Code & Self-Correct' },
        { value: 'mcp', label: '🔌 Search & MCP' },
        { value: 'guard', label: '🛡️ Plan & Gate' }
      ], 'code', v => { this.scenId = v; this.turn = 0; this.pulseT = 0; this.draw(); this.syncUI(); });

      const modeHost = slide.querySelector('[data-role=mode]');
      seg(modeHost, [
        { value: 'agent', label: 'Agent (Loop)' },
        { value: 'plain', label: 'Plain Transformer' }
      ], 'agent', v => { this.mode = v; this.pulseT = 0; this.draw(); this.syncUI(); });

      // Canvas
      const cvHost = slide.querySelector('[data-role=cv]');
      this.cv = U.canvas(cvHost, { width: 1120, height: 600, onresize: () => this.draw() });
      this.tip = U.tip(this.stage);

      const c = this.cv.canvas;
      c.addEventListener('mousemove', e => this.onHover(e));
      c.addEventListener('mouseleave', () => this.onLeave());

      // Transport controls
      this.prevBtn = slide.querySelector('[data-role=prev]');
      this.nextBtn = slide.querySelector('[data-role=next]');
      this.replayBtn = slide.querySelector('[data-role=replay]');
      this.dotsHost = slide.querySelector('[data-role=dots]');
      this.turnLabel = slide.querySelector('[data-role=turn-label]');

      if (this.prevBtn) this.prevBtn.addEventListener('click', () => { this.mode = 'agent'; this.setTurn(Math.max(0, this.turn - 1)); this.prevBtn.blur(); });
      if (this.nextBtn) this.nextBtn.addEventListener('click', () => { this.mode = 'agent'; this.setTurn((this.turn + 1) % 4); this.nextBtn.blur(); });
      if (this.replayBtn) this.replayBtn.addEventListener('click', () => { this.mode = 'agent'; this.autoPlay = true; this.turn = 0; this.autoTimer = 0; this.pulseT = 0; this.syncUI(); this.replayBtn.blur(); });

      // Pillar cards clickable at any time
      this.pillars = Array.from(slide.querySelectorAll('.ag-pillar'));
      this.pillars.forEach((p, idx) => {
        p.addEventListener('click', () => {
          this.mode = 'agent';
          this.setTurn(Math.min(3, idx));
        });
      });

      // Manim reel overlay
      this.vid = slide.querySelector('[data-role=film] video');
      const playBtn = slide.querySelector('[data-role=play]');
      const closeBtn = slide.querySelector('[data-role=close]');
      if (playBtn) playBtn.addEventListener('click', () => { this.openFilm(); playBtn.blur(); });
      if (closeBtn) closeBtn.addEventListener('click', e => { e.stopPropagation(); this.closeFilm(); closeBtn.blur(); });
      if (this.vid) {
        this.vid.addEventListener('play', () => { this.stage.classList.add('film-on'); });
        this.vid.addEventListener('ended', () => { /* keep summary frame visible until closed */ });
      }

      this.loop = U.animator(dt => {
        this.pulseT = (this.pulseT + dt * 0.55) % 1;
        if (this.autoPlay && this.mode === 'agent') {
          this.autoTimer += dt;
          if (this.autoTimer >= 2.2) {
            this.autoTimer = 0;
            if (this.turn < 3) { this.turn += 1; this.syncUI(); }
            else { this.autoPlay = false; this.syncUI(); }
          }
        }
        this.draw();
      });

      this.buildDots();
      this.syncUI();
      this.draw();
    },

    enter(slide) {
      this.loop && this.loop.start();
      const pos = slide._stepPos || 0;
      this.applyStepPos(pos);
    },

    leave() {
      this.loop && this.loop.stop();
      this.autoPlay = false;
      this.closeFilm();
      this.onLeave();
    },

    onStep(action, visible, elx) {
      if (!action || action.indexOf('ag:') !== 0) return;
      const s = elx.closest('.slide');
      const pos = s._steps.filter(x => x.classList.contains('visible')).length;
      this.applyStepPos(pos);
    },

    applyStepPos(pos) {
      this.pos = pos;
      for (let k = 1; k <= NSTEP; k++) this.root.classList.toggle('at' + k, pos >= k);
      if (pos === 0) {
        this.mode = 'plain';
        this.turn = 0;
      } else {
        this.mode = 'agent';
        this.turn = clamp(pos - 1, 0, 3);
      }
      this.autoPlay = false;
      this.closeFilm();
      this.syncUI();
      this.draw();
    },

    setTurn(t) {
      this.turn = clamp(t, 0, 3);
      this.autoPlay = false;
      this.pulseT = 0;
      this.syncUI();
      this.draw();
    },

    buildDots() {
      if (!this.dotsHost) return;
      this.dotsHost.innerHTML = '';
      for (let i = 0; i < 4; i++) {
        const d = el('button', { class: 'ag-dot', type: 'button', title: `Turn ${i + 1}`, onclick: () => { this.mode = 'agent'; this.setTurn(i); d.blur(); } }, this.dotsHost);
        d.textContent = String(i + 1);
      }
    },

    syncUI() {
      const sc = SCENARIOS[this.scenId];
      const t = sc.turns[this.turn];
      if (this.dotsHost) {
        Array.from(this.dotsHost.children).forEach((d, i) => {
          d.classList.toggle('on', this.mode === 'agent' && i === this.turn);
          d.classList.toggle('seen', this.mode === 'agent' && i < this.turn);
        });
      }
      if (this.turnLabel) {
        this.turnLabel.textContent = this.mode === 'plain' ? 'Plain Transformer · 1 forward pass (no loop)' : t.label;
      }
      this.pillars.forEach((p, idx) => {
        p.classList.toggle('active-card', this.mode === 'agent' && idx === t.pill);
      });
      // Sync mode segmented UI if mode was switched programmatically
      const modeBtns = this.slide.querySelectorAll('[data-role=mode] button');
      modeBtns.forEach(b => b.classList.toggle('on', (this.mode === 'agent' && b.textContent.includes('Agent')) || (this.mode === 'plain' && b.textContent.includes('Plain'))));
    },

    openFilm() {
      if (!this.vid) return;
      this.stage.classList.add('film-on');
      try { this.vid.currentTime = 0; } catch (e) { /* noop */ }
      const p = this.vid.play(); if (p && p.catch) p.catch(() => {});
    },
    closeFilm() {
      if (this.vid) this.vid.pause();
      if (this.stage) this.stage.classList.remove('film-on');
    },

    onHover(e) {
      if (this.stage.classList.contains('film-on')) return;
      const p = this.cv.toLocal(e);
      let hit = -1;
      for (let i = 0; i < HIT_REGIONS.length; i++) {
        const r = HIT_REGIONS[i];
        if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) { hit = i; break; }
      }
      if (hit >= 0) {
        this.hovIdx = hit;
        const r = HIT_REGIONS[hit];
        this.tip.show(p.x, p.y, `<b>${r.title}</b><br><span style="color:#5f6368">${r.body}</span>`);
      } else {
        this.onLeave();
      }
    },
    onLeave() { this.hovIdx = -1; this.tip && this.tip.hide(); },

    draw() {
      const { ctx } = this.cv;
      const W = 1120, H = 600;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = G.panel;
      ctx.fillRect(0, 0, W, H);

      const sc = SCENARIOS[this.scenId];
      const isAgent = this.mode === 'agent';
      const T = sc.turns[this.turn];

      // ---------------------------------------------------------------- 1. CONTEXT WINDOW TAPE
      const tapeX = 24, tapeY = 16, tapeW = W - 48, tapeH = 98;
      rbox(ctx, tapeX, tapeY, tapeW, tapeH, 14, G.bg, this.hovIdx === 0 ? G.blue : G.line, this.hovIdx === 0 ? 2.5 : 1.5);
      tx(ctx, 'CONTEXT WINDOW (WORKING MEMORY · KV CACHE)', tapeX + 18, tapeY + 26, 15, G.muted, { weight: 700 });
      tx(ctx, sc.title, tapeX + 430, tapeY + 26, 16, G.ink, { weight: 500 });

      const blocks = isAgent ? T.tape : [{ k: 'usr', t: sc.title.slice(0, 34) + '…' }, { k: 'err', t: sc.plain.answer }];
      let bx = tapeX + 18, by = tapeY + 42, bh = 40;
      const styleMap = {
        sys:  { fill: G.surface, stroke: G.grey, ink: G.ink },
        usr:  { fill: G.lBlue,   stroke: G.blue, ink: G.tBlue },
        call: { fill: G.lYellow, stroke: G.orange, ink: G.ink },
        err:  { fill: G.lRed,    stroke: G.red, ink: G.tRed },
        ok:   { fill: G.lGreen,  stroke: G.green, ink: G.tGreen },
        ans:  { fill: G.lBlue,   stroke: G.green, ink: G.tGreen }
      };
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        const st = styleMap[b.k] || styleMap.sys;
        ctx.save();
        ctx.font = `500 15px ${FONT.mono}`;
        const tw = ctx.measureText(b.t).width;
        ctx.restore();
        const bw = Math.min(tw + 22, 235);
        if (bx + bw > tapeX + tapeW - 14) break;
        rbox(ctx, bx, by, bw, bh, 9, st.fill, st.stroke, 1.8);
        const label = clipText(ctx, b.t, bw - 14, `500 15px ${FONT.mono}`);
        tx(ctx, label, bx + bw / 2, by + 25, 15, st.ink, { align: 'center', weight: 500, mono: true });
        bx += bw + 8;
      }

      // ---------------------------------------------------------------- 2. HARNESS FRAME (Agent mode)
      if (isAgent) {
        rbox(ctx, 20, 128, W - 40, 366, 18, 'rgba(248, 249, 250, 0.55)', G.grey, 1.8, [7, 6]);
        rbox(ctx, 42, 118, 280, 24, 8, G.lGreen, G.green, 1.5);
        tx(ctx, 'HARNESS: while not done:', 182, 134, 14, G.tGreen, { align: 'center', weight: 700, mono: true });
      } else {
        rbox(ctx, 20, 128, W - 40, 366, 18, 'rgba(250, 210, 207, 0.14)', G.line, 1.5);
        rbox(ctx, 42, 118, 288, 24, 8, G.lRed, G.red, 1.5);
        tx(ctx, 'NO LOOP · ONE FORWARD PASS', 186, 134, 14, G.tRed, { align: 'center', weight: 700, mono: true });
      }

      // ---------------------------------------------------------------- 3. TRANSFORMER BOX (left-center)
      const tfX = 44, tfY = 160, tfW = 382, tfH = 270;
      rbox(ctx, tfX, tfY, tfW, tfH, 16, G.panel, this.hovIdx === 1 ? G.blue : G.blue, this.hovIdx === 1 ? 3 : 2.2);
      rbox(ctx, tfX + 16, tfY + 16, tfW - 32, 34, 9, G.lBlue, null);
      tx(ctx, 'HUMBLE TRANSFORMER', tfX + tfW / 2, tfY + 38, 16, G.tBlue, { align: 'center', weight: 700 });
      tx(ctx, 'Same weights · predicts next token p(xₜ | x<ₜ)', tfX + 20, tfY + 74, 15, G.muted);

      // Next-token probability bars inside the Transformer
      const probs = isAgent ? T.probs : sc.plain.probs;
      tx(ctx, 'NEXT-TOKEN PROBABILITIES:', tfX + 20, tfY + 104, 13, G.muted, { weight: 700 });
      probs.forEach(([tok, p], idx) => {
        const py = tfY + 118 + idx * 34;
        const barMax = 210;
        const isCall = tok === '<call>';
        const barCol = idx === 0 ? (isCall ? G.orange : isAgent ? G.green : G.red) : G.blue;
        const txtCol = idx === 0 ? (isCall ? G.ink : isAgent ? G.tGreen : G.tRed) : G.ink;
        rbox(ctx, tfX + 20, py, 86, 26, 6, G.surface, G.line, 1);
        tx(ctx, tok, tfX + 63, py + 18, 14, txtCol, { align: 'center', weight: 700, mono: true });
        rbox(ctx, tfX + 116, py + 5, barMax, 16, 8, G.surface, null);
        rbox(ctx, tfX + 116, py + 5, Math.max(6, barMax * p), 16, 8, barCol, null);
        tx(ctx, Math.round(p * 100) + '%', tfX + 334, py + 18, 14, G.ink, { weight: 600, mono: true });
      });

      // ---------------------------------------------------------------- 4. RIGHT SIDE (Plain vs Agent)
      if (!isAgent) {
        // Plain Transformer single arrow to unverified answer
        ctx.save();
        ctx.strokeStyle = G.red; ctx.lineWidth = 3.2;
        ctx.beginPath(); ctx.moveTo(tfX + tfW, 295); ctx.lineTo(540, 295); ctx.stroke();
        arrowHead(ctx, 546, 295, 0, 9, G.red);
        ctx.restore();

        const ansX = 556, ansY = 195, ansW = 510, ansH = 200;
        rbox(ctx, ansX, ansY, ansW, ansH, 16, G.lRed, G.red, 2.2);
        tx(ctx, 'TRAPPED IN THE CHAT BOX', ansX + 24, ansY + 40, 17, G.tRed, { weight: 700 });
        tx(ctx, sc.plain.answer, ansX + 24, ansY + 90, 28, G.ink, { weight: 700, mono: true });
        tx(ctx, '✗ ' + sc.plain.status, ansX + 24, ansY + 132, 18, G.tRed, { weight: 600 });
        tx(ctx, sc.plain.note, ansX + 24, ansY + 166, 16, G.ink);
      } else {
        // Gate box (Stop & Parse)
        const gX = 492, gY = 160, gW = 256, gH = 112;
        rbox(ctx, gX, gY, gW, gH, 14, G.lYellow, this.hovIdx === 2 ? G.orange : G.yellow, this.hovIdx === 2 ? 3 : 2.2);
        tx(ctx, '1 · STOP & PARSE GATE', gX + 16, gY + 28, 14, G.ink, { weight: 700 });
        tx(ctx, T.callTitle, gX + 16, gY + 56, 18, G.ink, { weight: 700, mono: true });
        const code1 = clipText(ctx, T.callCode.split('\n')[0], gW - 32, `400 13px ${FONT.mono}`);
        tx(ctx, code1, gX + 16, gY + 80, 13, G.muted, { mono: true });
        const code2 = T.callCode.split('\n')[1] ? clipText(ctx, T.callCode.split('\n')[1], gW - 32, `400 13px ${FONT.mono}`) : '⏸ GPU pauses at stop token';
        tx(ctx, code2, gX + 16, gY + 99, 13, G.muted, { mono: true });

        // World / Tool Sandbox box
        const wX = 794, wY = 160, wW = 298, wH = 270;
        const wStroke = T.toolOk ? G.green : G.red;
        rbox(ctx, wX, wY, wW, wH, 16, G.panel, wStroke, this.hovIdx === 3 ? 3.2 : 2.4);
        rbox(ctx, wX + 14, wY + 14, wW - 28, 34, 9, T.toolOk ? G.lGreen : G.lRed, null);
        tx(ctx, '2 · EXTERNAL WORLD', wX + wW / 2, wY + 36, 15, T.toolOk ? G.tGreen : G.tRed, { align: 'center', weight: 700 });
        tx(ctx, T.toolName, wX + 18, wY + 76, 18, G.ink, { weight: 700 });
        tx(ctx, 'Runs outside model weights', wX + 18, wY + 100, 14, G.muted);

        // Result card inside World
        rbox(ctx, wX + 16, wY + 124, wW - 32, 124, 12, T.toolOk ? G.lGreen : G.lRed, wStroke, 1.5);
        tx(ctx, T.toolOk ? 'OBSERVATION (STDOUT / DATA)' : 'ERROR CAUGHT (STDERR)', wX + 28, wY + 150, 13, T.toolOk ? G.tGreen : G.tRed, { weight: 700 });
        const resWords = T.toolResult.split(' ');
        let l1 = '', l2 = '';
        for (const wd of resWords) {
          if ((l1 + ' ' + wd).length <= 25) l1 = l1 ? l1 + ' ' + wd : wd;
          else l2 = l2 ? l2 + ' ' + wd : wd;
        }
        tx(ctx, l1, wX + 28, wY + 182, 17, T.toolOk ? G.tGreen : G.tRed, { weight: 700, mono: true });
        if (l2) tx(ctx, clipText(ctx, l2, wW - 56, `600 16px ${FONT.mono}`), wX + 28, wY + 208, 16, T.toolOk ? G.tGreen : G.tRed, { weight: 600, mono: true });
        tx(ctx, '→ appended as tokens', wX + 28, wY + 234, 14, G.ink);

        // Arrows connecting the loop
        // Transformer -> Gate
        ctx.save();
        ctx.strokeStyle = G.orange; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(tfX + tfW, 216); ctx.lineTo(gX - 8, 216); ctx.stroke();
        arrowHead(ctx, gX - 2, 216, 0, 8, G.orange);

        // Gate -> World
        ctx.beginPath(); ctx.moveTo(gX + gW, 216); ctx.lineTo(wX - 8, 216); ctx.stroke();
        arrowHead(ctx, wX - 2, 216, 0, 8, G.orange);

        // Return Observation Wire: World bottom -> left -> up to Transformer & Context
        const retCol = T.toolOk ? G.green : G.red;
        ctx.strokeStyle = retCol; ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(wX + wW / 2, wY + wH);
        ctx.lineTo(wX + wW / 2, 466);
        ctx.lineTo(tfX + tfW / 2, 466);
        ctx.lineTo(tfX + tfW / 2, tfY + tfH + 8);
        ctx.stroke();
        arrowHead(ctx, tfX + tfW / 2, tfY + tfH + 2, -Math.PI / 2, 8.5, retCol);
        ctx.restore();

        // Pill on return wire
        const pillW = 316, pillX = 635 - pillW / 2;
        rbox(ctx, pillX, 450, pillW, 30, 15, T.toolOk ? G.lGreen : G.lRed, retCol, 1.8);
        tx(ctx, '3 · OBSERVATION → BACK INTO CONTEXT', 635, 470, 14, T.toolOk ? G.tGreen : G.tRed, { align: 'center', weight: 700 });

        // Animated pulse dot traveling the active loop
        const p = this.pulseT;
        let px, py, pc = G.blue;
        if (p < 0.3) {
          const q = p / 0.3;
          px = lerp(tfX + tfW, wX, q); py = 216; pc = G.orange;
        } else if (p < 0.5) {
          const q = (p - 0.3) / 0.2;
          px = lerp(wX + 40, wX + wW / 2, q); py = lerp(216, wY + wH, q); pc = retCol;
        } else {
          const q = (p - 0.5) / 0.5;
          if (q < 0.8) { px = lerp(wX + wW / 2, tfX + tfW / 2, q / 0.8); py = 466; }
          else { px = tfX + tfW / 2; py = lerp(466, tfY + tfH + 6, (q - 0.8) / 0.2); }
          pc = retCol;
        }
        ctx.save();
        ctx.fillStyle = pc;
        ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      }

      // ---------------------------------------------------------------- 5. TUFTE TELEMETRY STRIP (bottom)
      const telY = 510, telH = 74;
      rbox(ctx, 24, telY, W - 48, telH, 14, G.bg, G.line, 1.5);
      const passes = isAgent ? T.passes : sc.plain.passes;
      const calls = isAgent ? T.calls : sc.plain.calls;
      const ctxTok = isAgent ? T.ctxTokens : sc.plain.tokens;
      const gText = isAgent ? T.grounding : '✗ ' + sc.plain.status;
      const gCol = isAgent ? (T.groundOk === true ? G.tGreen : T.groundOk === false ? G.tRed : G.ink) : G.tRed;

      const cols = [
        { k: 'FORWARD PASSES', v: String(passes), x: 46, c: G.tBlue },
        { k: 'TOOL CALLS', v: String(calls), x: 245, c: G.ink },
        { k: 'CONTEXT TOKENS', v: `${ctxTok} (KV cached)`, x: 410, c: G.ink },
        { k: 'REALITY CHECK', v: gText, x: 675, c: gCol }
      ];
      cols.forEach((col, i) => {
        if (i > 0) {
          ctx.save(); ctx.strokeStyle = G.line; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(col.x - 22, telY + 14); ctx.lineTo(col.x - 22, telY + telH - 14); ctx.stroke();
          ctx.restore();
        }
        tx(ctx, col.k, col.x, telY + 26, 12, G.muted, { weight: 700 });
        tx(ctx, col.v, col.x, telY + 54, 20, col.c, { weight: 700 });
      });

      // Live caption below or in footer
      const capEl = this.slide.querySelector('[data-role=caption]');
      if (capEl) capEl.textContent = isAgent ? T.caption : sc.plain.note;
    }
  });
})();
