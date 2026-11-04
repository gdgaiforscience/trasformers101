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
* Numbers on screen are computed in the scripts (asserts check the spec values for m01/m05).
  m06 logits and m07 Q/K/V/attention values are illustrative (captioned on screen); m07's Q and K are fitted
  in numpy so every displayed score/weight/cell is computed from them.
* m03 adds visual regularisers to the training loss (well-conditioned W, bounded travel, visible biases);
  the network shown is exactly the trained one and separates all points (asserted).
