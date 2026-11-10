# Transformers 101: Inside the Black Box

A fully interactive, offline-first introduction to AI for **GDG AI for Science / UTS** (November 2026). It takes a general audience from "I typed *hi*" to neurons, matrices, loss landscapes, backpropagation, attention, agents, and AI for science—picture first, equation second.

* **Deck:** [`index.html`](index.html) — single offline page (vanilla JS, no build step, no CDN; 1920×1080 scaled stage).
* **Speaker script:** [`TALK_SCRIPT.md`](TALK_SCRIPT.md) — word-for-word guide with click/demo/video cues, Q&A bank, and pacing trims.
* **Sources:** [`docs/facts.md`](docs/facts.md) (every claim on the slides), [`docs/CREDITS.md`](docs/CREDITS.md) (data, fonts, software, licences).

## Presenting

1. Open `index.html` in **Chrome or Edge** directly from `file://` (no server needed).
2. Press **F** for fullscreen, **P** for the presenter window (notes, timer, next slide), **T** for the on-screen timer.
3. Use **→ / Space / clicker** to step and **←** to go back (steps are reversible).

| Key | Action | Key | Action |
|---|---|---|---|
| → ␣ PgDn | next step / slide | ← PgUp | previous |
| Home / End | first / last slide | `12` ⏎ | jump to slide 12 |
| O / Esc | overview | P | presenter window |
| N | notes drawer | T | timer pill |
| K / J | play-pause / restart video | B | blackout |
| F | fullscreen | ? | help |

All data, fonts, and videos are local; only the optional external links on slide 33 (`#llm3d`) and slide 44 (`#qa`) use the internet.

## What's inside (44 slides, ≈66 min + Q&A)

See [`TALK_SCRIPT.md`](TALK_SCRIPT.md) for pacing trims toward 60 min.

| Chapter | Slides | Interactive demos & clips |
|---|---|---|
| Opening | title, "I typed *hi*", roadmap | Gemma 3 270M next-token probabilities for "hi" (93.3%), temperature, sampling |
| 1 · What is AI today? | AI zoo, state of play (Nov 2026) | nested-rings explainer; multimodality, reasoning, MoE, agents & harnesses |
| 2 · How we got here | 80-year timeline, why now, Nobel 2024 | timeline with hype curve; training-compute chart (log ↔ linear) |
| 3 · Technology stack | stack tower, journey of "hi" | clickable stack (`b04_chip`); 8-station CPU · PCIe · GPU inference trace (`data/journey.js`) + local open-weights view |
| 4 · Inside a neural network | numbers, tensors, neuron, activations, layer = matrix, warping space, deep warps, weights, GPUs & TPUs | photo/EEG/token/protein explorer; Iris neuron; activation curves; matrix stepper; 2×2 grid warp; 21-param net; Gemma weights; CPU vs GPU vs TPU systolic array |
| 5 · How machines learn | loss, gradient descent, landscapes, backprop (+ clip), training | Kepler least-squares fit; 2D loss-landscape descent with η; 3D Blender landscape; chain-rule graph; live spiral/XOR MLP |
| 6 · From networks to Gemini | embeddings, attention (+ clip), Transformer 3D, softmax, prediction, scaling, post-training & fine-tuning, agents | Gemma embeddings & analogies; real attention heads; science hallucinations; Chinchilla scaling; SFT/RLHF/RLVR + LoRA/QLoRA (`js/demos/finetune.js`, `m08_lora`); Transformer-in-a-loop harness (`js/demos/agents.js`, `m09_agent_loop`) |
| 7 · AI for science | model zoo, AI ecosystem, "which AI for my lab?" | `m08_wiring` film + 12-architecture zoo (`js/demos/archs.js`); 9 ecosystem cards + rotating GFP (PDB 1EMA); lab decision helper |
| Wrap-up | limits, six equations, Q&A | — |

Media: 10 Manim clips (`assets/video/m0*.mp4`) and 4 Blender clips (`assets/video/b0*.mp4`), all 1920×1080 H.264 with posters and cue JSON.

## Folder layout

```
├── index.html            deck (slides + <aside class="notes">)
├── TALK_SCRIPT.md        main speaker guide (plus variants in talk_scripts/)
├── css/deck.css          styles (light Google/GDG palette)
├── js/deck.js            slide engine, steps, lazy media, presenter view, timer
├── js/lib/               canvas/DOM helpers (util.js) & tiny MLP + Adam (nn.js)
├── js/demos/*.js         chapter demos registered with Deck.register(id, {...})
├── data/*.js             offline datasets (window.AIDATA.*)
├── assets/               LaTeX equations (eq/*.svg), images, Manim & Blender videos
├── fonts/                Roboto, Latin Modern, Noto Sans Mono
├── docs/                 facts.md, CREDITS.md, DATA_SCHEMAS.md, DESIGN.md
├── src/                  generators (python/, equations/, manim/, blender/)
└── workshop/, workshop-short/   companion Jupyter notebooks & assets
```

## Rebuilding assets (optional)

Everything is prebuilt. To regenerate, use the `gdg` conda env (`/usr/local/google/home/butterworthnat/miniforge3/envs/gdg/bin/python`):

* **Data** (`src/python/make_*.py`): uses cached Gemma 3 270M presets offline (`KERAS_BACKEND=jax`); validate with `node src/python/check_data.js`.
* **Equations** (`src/equations/build_equations.py`): requires LaTeX and `dvisvgm`; writes `assets/eq/*.svg`.
* **Manim** (`src/manim/`): `python build.py <name>` (run renders with a timeout; see `src/manim/README.md`).
* **Blender** (`src/blender/`): `bash render_clip.sh <clip> 2`, then `python encode.py <clip> [--loop] --poster-frame N`.

## Honesty notes

* Live model numbers come from **Gemma 3 270M** (open weights), not Gemini; Gemma 3 shares Gemini 2.0's tokenizer.
* `m06_softmax`, `m07_attention`, and `m08_wiring` use **illustrative numbers** and label them on screen; the interactive demos use real model data.
* `data/compute.js` is a hand-checked list (reported, or `6·N·D` from reported `N` and `D`; AlexNet and Mistral Large 4 "Le Chonk" are hollow GPU-time estimates).
* Undisclosed frontier model sizes (e.g. Gemini 4) are marked as undisclosed.
