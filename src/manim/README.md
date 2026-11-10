# manim clips (m01–m07)

3Blue1Brown-style explainer clips for the deck (spec: `docs/DESIGN.md` §1 and §3a).

| clip | scene | what it shows |
|---|---|---|
| `m01_neuron.py` | `Neuron` | x=(0.9, 0.2, 0.6), w=(+1.2, −0.8, +0.5), b=−0.2 → z=1.02 → σ(z)=0.73 |
| `m02_layer_matrix.py` | `LayerMatrix` | 3→4 layer; edges slide into rows of W; row·x+b; a = σ(Wx+b) |
| `m03_grid_warp.py` | `GridWarp` | 2-2-2 tanh net trained in numpy (in the script) warps the plane; a line separates two moons |
| `m04_gradient_descent.py` | `GradientDescent` | w ← w − η dL/dw with η too big (bounces) and just right (settles) |
| `m05_backprop.py` | `Backprop` | forward (blue) / backward (green) on x→×w→σ→(ŷ−y)²; chain rule; update; loss drops |
| `m06_softmax.py` | `Softmax` | logits → exp → normalise (sums to 1) → temperature sweep 1→0.3→2.5→1 |
| `m07_attention.py` | `Attention` | Q/K/V, "it" attends to "wombat", causal attention matrix, formula |
| `m08_lora.py` | `Lora` | **light palette** (`common_light.py`, build with `--bg light`): rank-1 ΔW = b aᵀ on real numbers, 36 → 6 + 6, a 4096 × 4096 layer (16,777,216 vs 8,192 vs 65,536), h = W₀x + BAx with B = 0 at the start. Plays on demand over the `#finetune` slide's live LoRA explorer |
| `m08_wiring.py` | `Wiring` | **light palette** (`--bg light`): "same neuron, different wiring". One neuron → dense 6→4 (24 fixed-seed weights) → convolution (banded Toeplitz a, b, c: 3 weights, sliding window) → recurrent (same U, W every step; influence of x_s on h_t fades as 0.6^(t−s)) → graph (phenol adjacency + self-loops, message passing) → attention (row softmax of illustrative scores; "big" → "small" re-routes "it" from trophy to suitcase) → 5-icon summary. Every stage pairs the diagram with a "who talks to whom" matrix (rows = receivers). Plays full-bleed as step 0 of the `#archs` model-zoo slide (K / J replay it at any step) |

## Build

```bash
PY=/usr/local/google/home/butterworthnat/miniforge3/envs/gdg/bin/python
cd state_of_ai/src/manim
timeout 2400 $PY build.py m03_grid_warp            # render -qh @30fps, re-encode, poster, check frames
$PY montage.py m03_grid_warp                      # contact sheet of the check frames
$PY verify.py                                     # stream props, sizes, cues, dominant background pixel
```

`build.py` renders with `manim render -qh --frame_rate 30 --disable_caching`, re-encodes to
`assets/video/<name>.mp4` with `ffmpeg -an -c:v libx264 -pix_fmt yuv420p -crf 21 -movflags +faststart`,
grabs the final (summary) frame as `assets/poster/<name>.jpg`, and extracts check frames into
`_media/check/<name>/`. Each scene also writes `assets/video/<name>.cues.json` (stage captions with times).
Always run manim under `timeout`: after a Python exception manim's writer thread keeps the process alive.

## Notes

* `common.py` holds the palette, fonts and helpers, and **replaces manim's RGBA→yuv420p conversion**:
  PyAV's implicit conversion darkened every colour by 1–2 levels (background decoded as (14,15,20)).
  We convert with the exact BT.601 limited-range matrix instead. 8-bit 4:2:0 YUV cannot represent
  `#0f1115` exactly (exhaustive search over YUV triples); background pixels get the closest triple
  (31,130,127), which ffmpeg decodes to **(15,16,21)**.
* **Light clips** (`m08_*`, for the light slides) import `common_light.py` instead: `from common import *`
  for the helpers, then the deck's light Google palette (small text only in `#202124`, `#5F6368` or the dark
  surface tints, WCAG 2.2 AA), light-default `txt`/`tex`/`bg_box`/`corner_caption`, background `#F8F9FA`, and
  the same exact encoder with a light special case: pure-background pixels get (231,128,127), which ffmpeg
  decodes to **(248,250,250)**, the nearest reachable value (re-run the search with `python common_light.py`).
  Build them with `build.py <name> --bg light` so the corner-pixel check expects that triple.
* Numbers on screen are computed in the scripts (asserts check the spec values for m01/m05).
  m06 logits and m07 Q/K/V/attention values are illustrative (captioned on screen); m07's Q and K are fitted
  in numpy so every displayed score/weight/cell is computed from them.
* m03 adds visual regularisers to the training loss (well-conditioned W, bounded travel, visible biases);
  the network shown is exactly the trained one and separates all points (asserted).
