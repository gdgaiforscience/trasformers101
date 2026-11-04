# "Inside the Black Box": Design Spec (shared by all builders)

A **60-minute, fully interactive, visual introduction to AI (Oct 2026)** for the
**GDG AI for Science** community: a general audience of scientists, students and curious people.
The tone is 3Blue1Brown: one big question, built up from intuition, and the equation revealed
only once the picture makes it obvious.

> **Central question:** *How does a pile of numbers learn to talk, see, and fold proteins?*
> **Answer (revealed at the end):** Multiply by weights, bend, repeat. Measure the error, roll
> downhill, repeat. Then do it at an absurd scale.

Root folder: `state_of_ai/`. The deck is `state_of_ai/index.html` (offline-first, vanilla JS).

---

## 1. Style guide (EVERY asset must follow this)

| Token | Hex | Meaning |
|---|---|---|
| `BG` | `#0f1115` | Background of slides **and all videos** (videos must blend seamlessly) |
| `TEXT` | `#ECEFF4` | Main text |
| `MUTED` | `#9AA4B2` | Secondary text, axes |
| `GRID` | `#2A3140` | Major grid lines (minor: `#1B2029`) |
| `BLUE` | `#58C4DD` | Inputs, activations, data class A, **positive weights** |
| `ORANGE` | `#F0AC5F` | Data class B, highlights |
| `YELLOW` | `#FFD54F` | Weights `W` |
| `TEAL` | `#5CD0B3` | Bias `b` |
| `GREEN` | `#83C167` | Gradients / learning signal / "correct" |
| `RED` | `#FC6255` | Loss / error, **negative weights** |
| `PURPLE` | `#9A72AC` | Attention |
| `PINK` | `#E07A9F` | Extra category colour |

* Diverging weight colormap: `RED` (negative) → `#1a1d24` (zero) → `BLUE` (positive).
* Sequential colormap (heights, intensities): `#1d3a5f` → `BLUE` → `TEAL` → `YELLOW`.
* Fonts: UI sans (`Inter, Roboto, "Segoe UI", system-ui`); equations are **LaTeX / Latin Modern**
  (bundled in `fonts/`); code in `"JetBrains Mono", "DejaVu Sans Mono", monospace`.
* Equations in videos use manim `MathTex` (real LaTeX). Colour the symbols consistently:
  `W`/`w` YELLOW, `x` BLUE, `b` TEAL, `L` RED, gradients `∂`/`∇` GREEN, `η` ORANGE.

### Video spec
* 1920×1080, 30 fps, H.264 (`libx264 -pix_fmt yuv420p -crf 21 -movflags +faststart`), no audio.
* Background **exactly** `#0f1115`. In Blender, use the `Standard` view transform (not AgX/Filmic)
  so colours aren't shifted, then verify a corner pixel.
* Each clip has a poster JPG (1920×1080) in `assets/poster/<same-name>.jpg`.
* Keep **in-video text minimal**; the deck overlays crisp HTML captions. If a clip has stages,
  also write `assets/video/<name>.cues.json`: `[{"t": seconds, "label": "..."}, ...]`.
* Target ≤ 8 MB per clip.

---

## 2. Story & slide plan (60 min)

| # | id | Min | Slide | Key visual / interaction | Assets |
|---|---|---|---|---|---|
| 1 | `title` | 1 | Inside the Black Box | Blender hero network loop behind the title | `b01_hero_network` |
| 2 | `hook` | 1.5 | "I typed *hi*" | Real Gemma 3 270M probability bars over the 262,144-token vocabulary; temperature slider | `data/next_token.js` |
| 3 | `roadmap` | 0.5 | Tonight's journey | 7 chapter cards that light up as the talk progresses | — |
| 4 | `zoo` | 2 | What do we mean by "AI"? | Interactive nesting circles: AI ⊃ ML ⊃ deep learning ⊃ foundation models | — |
| 5 | `now` | 2.5 | State of play, Oct 2026 | 6 trend cards (multimodal, reasoning, agents, long context, open models, science) | `docs/facts.md` |
| 6 | `timeline` | 3 | 80 years in 3 minutes | Interactive timeline 1943 → 2026 with a "hype temperature" curve (summers & winters) | `docs/facts.md` |
| 7 | `whynow` | 2.5 | Why now? Data × compute × algorithms | Log-scale chart of training compute for notable models; `C ≈ 6ND` | `data/compute.js` |
| 8 | `nobel` | 1 | 2024: AI wins Nobel prizes | Physics (Hopfield, Hinton) and Chemistry (Baker; Hassabis, Jumper) | — |
| 9 | `stack` | 2.5 | The AI technology stack | Clickable tower: energy → chips → systems → models → data/training → serving → apps | `b04_chip` (optional) |
| 10 | `journey` | 2 | The journey of "hi" | Animated packet down and up the stack; real numbers (10 tokens, 262,144 logits) | — |
| 11 | `tensors` | 3 | Everything is numbers | Hover a photo to reveal pixel numbers; EEG trace; text → token IDs; tensor rank ladder video | `b02_tensor_ranks`, `data/hopper.js`, `data/eeg.js` |
| 12 | `neuron` | 3 | One artificial neuron | manim clip, then interactive Iris neuron (sliders w₁, w₂, b; live equation) | `m01_neuron`, `data/iris.js` |
| 13 | `activation` | 1.5 | Why bend? Activation functions | Interactive plot: step / sigmoid / tanh / ReLU / GELU | — |
| 14 | `layer` | 2.5 | A layer is a matrix | manim clip, then interactive matrix × vector stepper | `m02_layer_matrix` |
| 15 | `warp` | 3 | Layers warp space | Interactive 2×2 matrix grid warp, plus shift (b) and bend (tanh) | `m03_grid_warp` |
| 16 | `deep` | 2 | Deep = many warps | Trained 2-2-2-2 tanh net untangling data, animated layer by layer | `data/warpnet.js` |
| 17 | `weights` | 2.5 | Weights: the knobs | Real Gemma weight matrices as images, zoom to raw numbers; parameter-count ladder | `data/weights.js`, `assets/img/w_*.png` |
| 18 | `loss` | 2.5 | Measuring wrongness | Kepler's planets: drag the line, watch the squared errors | `data/kepler.js` |
| 19 | `descent` | 3 | Rolling downhill | Loss-contour plot + gradient descent, learning-rate slider; Blender landscape | `m04_gradient_descent`, `b03_loss_landscape` |
| 20 | `backprop` | 2.5 | Backpropagation | manim clip, then interactive computational graph (forward / backward) | `m05_backprop` |
| 21 | `train` | 3 | Watch a network learn | Live in-browser training playground (spiral / circles / XOR) | — |
| 22 | `embed` | 2.5 | Words become vectors | Real Gemma token embeddings → 2D map; nearest neighbours; analogies | `data/embeddings.js` |
| 23 | `attention` | 3 | Attention | manim clip, then real attention heatmaps from Gemma | `m07_attention`, `data/attention.js` |
| 24 | `llm3d` | 2 | The whole Transformer in 3D | Embed bbycroft.net/llm (live) with fallback | — |
| 25 | `predict` | 2 | Next-token prediction | manim softmax clip, then real Gemma predictions for science prompts + temperature | `m06_softmax`, `data/next_token.js` |
| 26 | `scale` | 2.5 | How LLMs are trained and scaled | Pretrain → post-train → think pipeline; interactive Chinchilla scaling law | — |
| 27 | `science` | 3 | AI for Science | Rotating real protein (PDB) + highlight cards (AlphaFold, GNoME, weather, …) | `data/protein.js`, `docs/facts.md` |
| 28 | `lab` | 1.5 | Which AI should my lab use? | Interactive decision helper | — |
| 29 | `limits` | 1.5 | What AI still gets wrong | Hallucination, energy, bias, evaluation, interpretability, safety | — |
| 30 | `recap` | 1 | The whole story in six equations | Equation montage over the hero video | `b01_hero_network` |
| 31 | `qa` | — | Resources & Q&A | Links | — |

---

## 3. Asset contracts

### 3a. manim clips → `assets/video/m0X_*.mp4`, sources in `src/manim/`
Render with `python -m manim render -qh` (1080p30 = `-qh` gives 1080p60; set `--frame_rate 30`).
Set `config.background_color = "#0f1115"`. Recommended length 12–25 s each; end on a clean
"summary frame" (it becomes the paused final state on the slide).

* **m01_neuron**: three inputs x=(0.9, 0.2, 0.6), weights w=(+1.2, −0.8, +0.5), bias b=−0.2.
  Edges coloured by sign, thickness ∝ |w|. Values travel along the edges, products appear, then
  Σ: z = 1.08 − 0.16 + 0.30 − 0.20 = 1.02. A sigmoid plot shows σ(1.02) ≈ 0.73 and the output
  neuron fills to 73%. End on the boxed equation `\hat y = \sigma(\mathbf{w}\cdot\mathbf{x} + b)`.
* **m02_layer_matrix**: 3 inputs → 4 neurons. Each neuron's incoming edges slide into a row of a
  4×3 matrix W (3Blue1Brown neural-network chapter 1 move). Animate a row·column dot product, add b, apply σ,
  and end on `\mathbf{a} = \sigma(W\mathbf{x} + \mathbf{b})`. Use concrete numbers computed in code.
* **m03_grid_warp**: NumberPlane plus two classes of points (BLUE and ORANGE, e.g. two moons) that
  aren't linearly separable. Train a tiny 2-2-2 tanh net in numpy inside the script, then animate:
  ApplyMatrix(W1) → shift b1 → tanh (pointwise, `prepare_for_nonlinear_transform`) → W2 → b2 →
  tanh → a straight separating line appears. A top-left label shows the stage:
  "stretch & rotate (W)", "shift (b)", "bend (tanh)".
* **m04_gradient_descent**: 1D loss curve with a local and a global minimum. A ball with a tangent
  line and a −slope arrow takes discrete steps of `w \leftarrow w - \eta\,\frac{dL}{dw}`. Show
  "η too big" (overshoot/bounce) and then "η just right".
* **m05_backprop**: Chain x=2 →[×w, w=0.5]→ z=1.0 →[σ]→ ŷ=0.731 →[(ŷ−y)², y=1]→ L=0.0723.
  Forward values flow left→right (BLUE); gradients flow right→left (GREEN):
  ∂L/∂ŷ = −0.538, ∂ŷ/∂z = 0.197, ∂z/∂w = 2, so ∂L/∂w = −0.2115. The chain-rule equation assembles,
  then the update w ← 0.5 − η(−0.2115) is applied.
* **m06_softmax**: 5 labelled logit bars (illustrative, e.g. tokens " Au", " Ag", " gold",
  " Fe", " Pb" with logits 6.0, 3.0, 2.6, 1.2, 0.5). Animate exp (bars grow), then normalise
  (they sum to 1). The equation `\mathrm{softmax}(z)_i = \frac{e^{z_i/T}}{\sum_j e^{z_j/T}}`
  assembles, then sweep T: 1 → 0.3 → 2.5 → 1 with live bars.
* **m07_attention**: "The wombat crossed the road because it was hungry". Tokens get Q/K/V
  mini-vectors. Focus on "it": dot products with each earlier K → scores → softmax weights
  ("wombat" highest) → weighted sum of V flows into "it". Then the full causal attention
  matrix builds row by row (lower-triangular heatmap in PURPLE), and
  `\mathrm{Attention}(Q,K,V)=\mathrm{softmax}\!\big(\frac{QK^\top}{\sqrt{d_k}}\big)V` assembles.
  Values may be illustrative (say so in a tiny corner caption: "illustrative numbers").

### 3b. Blender clips → `assets/video/b0X_*.mp4`, sources in `src/blender/`
Headless only: `blender -b --factory-startup -P src/blender/<script>.py` (EEVEE works with
software GL; the first frame is slow because shaders compile). Render a PNG sequence → ffmpeg.
The live-Blender MCP addon is **not** connected; don't use it.

* **b01_hero_network** (seamless 8 s loop): a deep network of 6–7 layers × 8–12 glowing nodes.
  Thin, dim connection lines; bright pulses travel left → right along random edges. Pulse timing
  must be periodic over the clip length so it loops. Colours drift BLUE → PURPLE → ORANGE by layer.
  Bloom via compositor Glare. Keep the **left 35% of frame calm/darker** (title overlay). Use a static
  camera or one with periodic motion.
* **b02_tensor_ranks** (12–14 s): one cube (scalar) → row of 6 (vector) → 6×6 sheet (matrix) →
  3 stacked sheets tinted R/G/B (3D tensor = an image) → 4 such blocks side by side (batch = 4D).
  Camera pulls back to isometric. No text; write `b02_tensor_ranks.cues.json` with stage times.
* **b03_loss_landscape** (12 s): smooth terrain (sum of Gaussians, one global and 2–3 local minima)
  with a height colormap (deep blue → teal → yellow) and subtle contour lines in the shader. A
  glowing ball descends along a precomputed (numpy) gradient-descent-with-momentum path on the same
  function, leaving an emissive trail. The camera orbits slowly and ends near the minimum.
* **b04_chip** (optional, 8 s loop): stylised TPU-like chip; a systolic array grid of
  multiply-accumulate cells with data pulses flowing diagonally.

### 3c. Data → `data/*.js` (scripts in `src/python/`, figures in `assets/img/`)
Every file: `window.AIDATA = window.AIDATA || {}; AIDATA.<key> = {...};` (no fetch, works on file://).
Use the cached Gemma presets **offline** (no network):
`~/.cache/kagglehub/models/keras/gemma3/keras/gemma3_270m/3` (pretrained) and
`.../gemma3_instruct_270m/4` (instruct), keras-hub with `KERAS_BACKEND=jax`.
Python: `/usr/local/google/home/butterworthnat/miniforge3/envs/gdg/bin/python`.

* `next_token.js` → `AIDATA.nextToken = {model, prompts:[{id, label, prompt, model:"it"|"pt",
  templated:bool, topk:[{token, id, logit}] (40 entries, raw logits), lse:{"0.10":…, …, "3.00":…}
  (full-vocab log-sum-exp of logits/T for T = 0.10…3.00 step 0.05), greedy:"…"}]}`.
  Prompts: "hi" (instruct + chat template), plus 6–8 science prompts on the pretrained model,
  e.g. "The chemical symbol for gold is", "DNA is made of four bases: adenine, thymine, guanine and",
  "The closest star to the Sun is", "Water is made of hydrogen and", "The mitochondria is the",
  "E = mc", "The Great Barrier Reef is located off the coast of".
* `embeddings.js` → ~250 single-token words (prefer `▁word` pieces) in categories (planets,
  chemical elements, animals, countries, cities, emotions, numbers, colours, body parts, sciences,
  verbs). Fields: `{w, piece, id, cat, pca:[x,y], tsne:[x,y], nn:[top-8 neighbours over the FULL vocab,
  cleaned]}` + `analogies:[{a,b,c,expect,top5,hit}]` (report honestly) + `categories:{name:colour}`.
* `weights.js` + `assets/img/w_*.png` → heatmaps of 3–4 real matrices (e.g. layer-0 query, an FFN
  gate crop, a slice of the embedding table) with the diverging colormap and robust scaling; a 16×16
  numeric patch for each; component parameter breakdown; a histogram of all weights.
* `attention.js` → real attention weights for 2–3 short sentences (including the wombat sentence)
  for a handful of (layer, head) pairs, chosen to be interesting (previous-token, coreference …).
  **Validate** against the model's own layer output; if you can't, set `illustrative:true`.
* `iris.js` (sklearn bundled), `kepler.js` (8 planets: semi-major axis AU, period years, source
  NASA fact sheet), `warpnet.js` (numpy-trained 2-2-2-2 tanh net + dataset that becomes linearly
  separable in the last 2D layer), `hopper.js` (`assets/img/grace_hopper.jpg` from matplotlib
  sample data + a ~64-px-wide RGB array for hover), `eeg.js` (short snippet from matplotlib's
  `eeg.dat`), `compute.js` (notable models' training compute with year, org and source; Epoch AI),
  `protein.js` (a real PDB, e.g. GFP 1EMA: CA coordinates + secondary structure).

---

## 4. Rules for parallel builders
* Only write inside your assigned folders. Don't edit `index.html`, `css/` or `js/` (the deck owner does).
* No network at runtime. The `read_url_content` tool may be used at build time to fetch public data
  (PDB files, Epoch AI CSV). Record every source/licence in `docs/CREDITS.md` (append a section).
* Verify your output visually: extract frames with ffmpeg and view them; check data files load in node.
* When done, report: file list, durations/sizes, cue timings, any caveats.
