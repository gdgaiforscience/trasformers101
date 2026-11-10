# Inside the Black Box: How AI Really Works

A one-hour, fully interactive introduction to AI for the **GDG AI for Science** community
(October 2026). It takes a general audience from "I typed *hi*" to neurons, matrices, tensor
transformations, loss landscapes, backpropagation, attention, scaling laws and AI for science,
in the style of 3Blue1Brown: picture first, equation second.

* **Deck:** [`index.html`](index.html), a single offline page (vanilla JS, no build step, no CDN).
* **Speaker script:** [`TALK_SCRIPT.md`](TALK_SCRIPT.md), word-for-word with click/demo/video cues, a Q&A bank and a numbers cheat sheet.
* **Sources:** [`docs/facts.md`](docs/facts.md) (every claim on the slides), [`docs/CREDITS.md`](docs/CREDITS.md) (data, fonts, software, licences).

## Presenting

1. Open `index.html` in **Chrome or Edge**. It works straight from `file://`, with no server needed.
2. Press **F** for fullscreen, **P** for the presenter window (notes, timer, next slide), and **T** for the on-screen timer.
3. Use **→ / Space / clicker** to step and **←** to go back. Steps are reversible: going back undoes a demo step.

| Key | Action | Key | Action |
|---|---|---|---|
| → ␣ PgDn | next step / slide | ← PgUp | previous |
| Home / End | first / last slide | `12` ⏎ | jump to slide 12 |
| O / Esc | overview | P | presenter window |
| N | notes drawer | T | timer pill |
| K / J | play-pause / restart video | B | blackout |
| F | fullscreen | ? | help |

Only slide 33 (bbycroft.net/llm and Transformer Explainer embeds) needs the internet. Everything
else, including all data, videos and fonts, is local. The stage is 1920×1080 and scales to any window.

## What's inside (43 slides, ≈63 min + Q&A)

| Chapter | Slides | Live demos (real data unless noted) |
|---|---|---|
| Opening | title, "I typed hi", roadmap | Gemma 3 270M next-token probabilities for "hi" (93.26 %), temperature, sampling |
| 1 · What is AI today? | AI zoo, state of play Nov 2026 | nested-rings explainer |
| 2 · How we got here | 80-year timeline, why now, Nobel 2024 | timeline with hype curve; training-compute chart (log ↔ linear) |
| 3 · Technology stack | stack tower, journey of "hi" | stack tower with a TPU systolic-array clip; "hi" through one inference server as a CPU · PCIe · GPU swim-lane film (8 stations: guardrails, chat template, tokenizer, PCIe copy, prefill, decode loop, detokenizer) with real Gemma 3 270M token IDs, probabilities, KV-cache size and tokenizer timing (`data/journey.js`), live PCIe-bytes vs weights-read meter, and a local open-weights view (grammar masks, unified memory, prefix caching) |
| 4 · Inside a neural network | numbers, tensors, neuron, activations, layer = matrix, GPUs & TPUs, warping space, deep warps, weights | pixel-level photo zoom, EEG, token IDs; Iris neuron; activation explorer; matrix stepper; the same layer run on a CPU, a GPU and a TPU systolic array (ticks + memory-trip counter, energy bars, zoom out to a TPU pod); 2×2 grid warp; trained 21-parameter net; real Gemma weight matrices |
| 5 · How machines learn | loss, gradient descent, landscapes, backprop, training | Kepler's law by least squares; loss-landscape descent with η; backprop graph; in-browser neural-network playground |
| 6 · From networks to Gemini | embeddings, attention, Transformer 3D, softmax, prediction, scaling, post-training & fine-tuning | Gemma embedding map + analogies; real attention heads; science prompts incl. a hallucination; Chinchilla scaling law; base-vs-assistant "hi" bars → SFT/RLHF/RLVR, then a live LoRA explorer (W freezes, ΔW = B·A, rank slider with exact counts), a "will it fit on one GPU?" chart and a lab playbook (`js/demos/finetune.js`) |
| 7 · AI for science | model zoo, science highlights, "which AI for my lab?" | **model zoo** (`#archs`, `js/demos/archs.js`): the m08_wiring manim film full-bleed ("same neuron, different wiring"), then 12 live, data-driven heroes in three status groups (still everywhere / had its moment / rising): a real 3 × 3 convolution on Grace Hopper's photo, an LSTM with real equations reading "The keys to the cabinet…", message passing on caffeine, real Gemma attention, an exact-denoiser diffusion sampler, Mamba vs attention memory, PCA autoencoder, GAN (Goodfellow Fig. 1), Hopfield recall, a Fourier layer on the heat equation, KAN, plus a timeline and a "match the wiring to your data" field guide; rotating GFP (PDB 1EMA); decision helper |
| Wrap-up | limits, six equations, resources | — |

Videos: 9 manim clips (`assets/video/m0*.mp4`) and 4 Blender clips (`assets/video/b0*.mp4`), all
1920×1080 H.264 with posters and cue files. `m08_lora` uses the light palette and plays on demand
inside the `#finetune` slide (**▶ The maths in 25 s**, or K). `m08_wiring` (light palette, 32 s) opens the
`#archs` model-zoo slide full-bleed (→ or **meet the zoo ▸** skips it; K / J replay it at any step).

## Folder layout

```
state_of_ai/
├── index.html            the deck (slides + speaker notes in <aside class="notes">)
├── TALK_SCRIPT.md        speaker script
├── css/deck.css          styles (3Blue1Brown-like dark palette, see docs/DESIGN.md)
├── js/deck.js            slide engine: steps, lazy videos/demos, presenter view, timer, overview
├── js/lib/util.js        canvas/DOM helpers (U.*)        js/lib/nn.js   tiny MLP + backprop + Adam
├── js/demos/*.js         one file per chapter; each registers demos with Deck.register(id, {...})
├── data/*.js             generated data (window.AIDATA.*), loaded with <script> so file:// works
├── assets/eq/*.svg       LaTeX equations (Latin Modern)    assets/img/  photo + weight heatmaps
├── assets/video, poster  manim + Blender clips, posters, cue JSON
├── fonts/                Roboto, Latin Modern (text + math), Noto Sans Mono
├── docs/                 DESIGN.md, DATA_SCHEMAS.md, facts.md, CREDITS.md
└── src/                  everything needed to rebuild the assets (below)
```

## Rebuilding the assets (optional)

Everything is already built. To regenerate, use the `gdg` conda env
(`/usr/local/google/home/butterworthnat/miniforge3/envs/gdg/bin/python`):

* **Data** (`src/python/make_*.py`): uses the cached Gemma 3 270M keras-hub presets offline (`KERAS_BACKEND=jax`). Check the output with `node src/python/check_data.js`. Schemas are in `docs/DATA_SCHEMAS.md`.
* **Equations** (`src/equations/build_equations.py`): needs LaTeX and dvisvgm, and writes `assets/eq/*.svg`.
* **manim clips** (`src/manim/`): `python build.py <name>`. See `src/manim/README.md`, and always run renders with a timeout.
* **Blender clips** (`src/blender/`): `bash render_clip.sh <clip> 2`, then `python encode.py <clip> [--loop] --poster-frame N`. Clips b02–b04 were rendered at 720p and upscaled because the machine was busy. Re-render at 1080p when it's quiet if you want them sharper.

Build intermediates can be deleted safely, freeing roughly 770 MB: `src/blender/_frames/` (PNG sequences, about 700 MB) and `src/manim/_media/` (about 65 MB).

## Honesty notes

* Live numbers come from **Gemma 3 270M** (open weights), not Gemini, whose internals aren't public. Gemma 3 shares Gemini 2.0's tokenizer.
* The m06 (softmax) and m07 (attention) clips use **illustrative numbers** and say so on screen. The interactive slides after them use real model data.
* `data/compute.js` is a hand-checked fallback list (reported, or 6·N·D from reported N and D; AlexNet and Mistral Large 4 "Le Chonk" are GPU-time estimates, drawn hollow), because Epoch AI's CSV couldn't be fetched whole at build time.
* Frontier model sizes (Gemini 4) are not disclosed and are shown as such.
