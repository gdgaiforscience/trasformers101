# 🎙️ Transformers 101 — Inside the Black Box: Presenter Guide & Talking Points

* **Event:** Google Developer Groups (GDG) AI for Science / UTS · November 2026
* **Audience:** Scientists, students, and curious minds—no machine-learning background assumed, and zero mathematical hand-waving.
* **Duration:** ~66 minutes (44 slides) + Q&A. See trimming notes below the Run of Show to land cleanly at 60 minutes.
* **Deck:** [`index.html`](index.html) — fully offline single-page deck (only the optional external 3D links on Slide 33 open a browser tab requiring internet).
* **Central question:** *How does a static pile of numbers decide to say “Hi there”?*
* **Central answer:** *Multiply, bend, repeat. Measure the error, roll downhill, repeat. Then do it at an absurd scale.*

### Voice & philosophy of these notes
> *“If we cannot explain what is happening in plain language—without hiding behind mystical words—then we haven’t really understood it yet. Yet once you strip away the jargon, what remains is even more remarkable: out of nothing more than multiplying numbers, bending straight lines, and rolling downhill on error, something emerges that can translate languages, fold proteins, and help discover new crystals.”*

How to read each slide below:
* **Core point:** The single takeaway the audience should walk away with.
* **Definitions:** Crisp, accurate, plain-English definitions of the technical and scientific terms introduced on that slide.
* **Talking points & cues:** Concise bullet points to speak from, paired with **`[→]`** (next step/slide), **`[DEMO]`** (live mouse interaction), and **`(0 s)`** (video cue times).

---

## ✅ Pre-talk checklist (10 minutes before)

1. Open `index.html` in **Chrome or Edge**. Press **`F`** for fullscreen and **`P`** to open the presenter window (shows each slide’s `<aside class="notes">`, live timer, and next-slide preview).
2. Press **`T`** to toggle the on-screen timer pill (starts automatically when advancing past Slide 1).
3. **Optional internet check (Slide 33 `#llm3d`):** Click **Open bbycroft.net/llm ↗** once beforehand if you plan to show the 3D flythrough in a separate browser tab. Every other slide, dataset, font, and video is 100% local.
4. **Controls:** **`→` / `Space` / `PgDn`** next step or slide · **`←` / `PgUp`** undo step or previous slide · **`K`** play/pause video · **`J`** restart video · **`O`** slide overview · **`N`** notes drawer · **`B`** blackout · **`?`** help.

---

## ⏱️ Run of show (44 slides)

| Time | # | ID | Slide | Core paradigm / demo |
|:---|:---:|:---|:---|:---|
| 0:00 | 1 | `#title` | Transformers 101 | Hero network loop: neurons & numerical pulses |
| 0:30 | 2 | `#hook` | I typed “hi” | Tokens, vocabulary (262,144), probabilities, temperature |
| 2:30 | 3 | `#roadmap` | Tonight’s journey | 7-chapter map: picture first, equation second |
| 3:00 | 4 | `#zoo` | What do we mean by “AI”? | AI ⊃ Machine Learning ⊃ Deep Learning ⊃ Foundation Models |
| 5:00 | 5 | `#now` | State of play: Nov 2026 | Multimodality, test-time reasoning, MoE, agents, harnesses, MCP |
| 7:30 | 6 | `#timeline` | 80 years of AI | McCulloch–Pitts → AI winters → AlexNet → Transformer → Nobels |
| 10:30 | 7 | `#whynow` | Why now? Compute exploded | Exponential FLOPs (4–5×/yr), log vs linear scale, $C \approx 6ND$ |
| 12:00 | 8 | `#nobel` | 2024: Two Nobel prizes | Statistical physics (Hopfield, Hinton) & proteins (Baker, Hassabis, Jumper) |
| 13:00 | 9 | `#stack` | The AI technology stack | Energy → silicon → compilers → weights → serving → agents |
| 14:30 | 10 | `#journey` | The journey of “hi” | CPU text (BPE) ⇄ PCIe ⇄ GPU tensors (prefill, KV cache, decode) |
| 17:00 | 11 | `#tensors` | Everything is numbers | **[DEMO]** Pixel RGB zoom, EEG time series, tokens, amino acids |
| 19:00 | 12 | `#tensors2` | Tensors: numbers in boxes | Scalar (0D) → vector (1D) → matrix (2D) → 3D/4D tensors |
| 20:00 | 13 | `#neuron` | One artificial neuron | **[DEMO]** Fisher’s Iris flowers; weights, bias, decision boundary |
| 22:30 | 14 | `#activation` | Why bend? Activation functions | **[DEMO]** Nonlinearity (Sigmoid, ReLU, GELU) vs linear collapse |
| 23:30 | 15 | `#v-neuron` | ▶ A neuron (animation) | Manim synthesis (21 s): $\hat{y} = \sigma(\mathbf{w}\cdot\mathbf{x} + b)$ |
| 24:00 | 16 | `#layer` | A layer is a matrix | **[DEMO]** Dense layer = matrix-vector dot products |
| 25:30 | 17 | `#v-layer` | ▶ A layer is a matrix (animation) | Manim synthesis (22 s): wires fold into $\mathbf{a} = \sigma(W\mathbf{x}+\mathbf{b})$ |
| 26:00 | 18 | `#v-warp` | ▶ Layers warp space (animation) | Manim (23 s): stretch, shift, bend untangles data |
| 26:30 | 19 | `#warp` | Layers warp space | **[DEMO]** Basis vectors $\hat{\imath}, \hat{\jmath}$, determinant, $\tanh$ warp |
| 29:00 | 20 | `#deep` | Deep = many warps | Representation learning: 21-parameter net unfolds two moons |
| 30:30 | 21 | `#weights` | Weights: the knobs | Real Gemma 3 weight matrices (268M parameters) + scale ladder |
| 32:00 | 22 | `#chips` | How GPUs & TPUs work | MACs, memory wall (170× energy), CPU vs GPU vs TPU systolic array |
| 34:00 | 23 | `#loss` | Measuring wrongness | **[DEMO]** Loss function (MSE) rediscovers Kepler’s $T^2 \propto a^3$ |
| 36:00 | 24 | `#v-descent` | ▶ Gradient descent (animation) | Manim (18 s): slope, learning rate $\eta$, overshoot vs convergence |
| 36:30 | 25 | `#descent` | Rolling downhill | 2D loss landscape, gradient $-\nabla L$, divergence at $\eta = 0.8$ |
| 38:30 | 26 | `#landscape` | ▶ Real loss landscapes | Blender loop: 268M-D non-convex terrain & momentum |
| 39:15 | 27 | `#backprop` | Backpropagation | Reverse-mode autodiff: all 268M slopes in one backward pass |
| 41:15 | 28 | `#v-backprop` | ▶ Backpropagation (animation) | Manim (23 s): forward values vs backward blame (chain rule) |
| 41:45 | 29 | `#train` | Watch a network learn | **[DEMO]** Live MLP training on spirals; why 1 neuron fails XOR |
| 44:15 | 30 | `#embed` | Words become vectors | 640-D embeddings, t-SNE clusters, Jupiter’s neighbours, analogies |
| 45:45 | 31 | `#attention` | Attention | Real Gemma multi-head attention: coreference & attention sinks |
| 47:45 | 32 | `#v-attention` | ▶ Attention (animation) | Manim (22 s): Query, Key, Value & causal mask |
| 48:15 | 33 | `#llm3d` | The Transformer in 3D | Full Transformer stack; external 3D flythrough tab (`bbycroft.net/llm`) |
| 49:15 | 34 | `#v-softmax` | ▶ Softmax & temperature | Manim (20 s): logits $\to \exp(z_i/T) \to$ probabilities |
| 49:45 | 35 | `#predict` | Next-token prediction | Autoregressive decoding & live hallucination (“largest planet”) |
| 51:15 | 36 | `#scale` | Training & scaling | Pre-train / post-train / think + Chinchilla law (~20 tokens/param) |
| 52:45 | 37 | `#finetune` | Post-training & fine-tuning | SFT, RLHF, RLVR; LoRA ($\Delta W = BA$), QLoRA (4-bit), RAG ladder |
| 54:45 | 38 | `#agents` | Agents: giving a Transformer hands | Tool schemas, pause-and-parse, while-loop harness, self-correction & guardrails (`m09_agent_loop`) |
| 57:15 | 39 | `#archs` | The model zoo | Inductive bias: CNN, LSTM, GNN, Transformer, Diffusion, Mamba |
| 60:15 | 40 | `#science` | AI ecosystem | 9 paradigms in 3 rows: small, domain & world models · agents & tools, multi-agent, OpenClaw & Grok Bot · AlphaFold/AlphaGenome, GNoME/GenCast, superintelligence |
| 62:45 | 41 | `#lab` | Which AI for my lab? | **[DEMO]** Tabular trees vs foundation-model transfer learning |
| 63:45 | 42 | `#limits` | What AI still gets wrong | Hallucination, bias, energy, contamination, interpretability, safety |
| 65:15 | 43 | `#recap` | Six equations | All 6 equations assembled + final synthesis |
| 66:15 | 44 | `#qa` | Keep exploring | Offline links & open Q&A |

**Pacing valve (to hit 60:00 sharp):** Summarize Slide 5 in 3 row-level bullets (~1 min saved), skip the pod zoom step on Slide 22 (~30 s), treat Slide 33 as a 20-second architectural recap without opening the external tab (~40 s), on Slide 39 advance past the opening film into the 6 live cards (~30 s), and on Slide 40 click through each row and tell one story per row (~1 min). *These five trims save ~3 min 40 s; the deck now plans 66:15, so they land near 62:35 and ~2.5 min more must go to hit 60:00 (e.g., the Slide 28 backprop clip now recaps the demo before it and can be skipped, ~30 s).*

---

## 🎤 Slide-by-slide presenter notes & talking points

### Opening

#### 1 · Transformers 101 (`#title`, 0:00–0:30)
* **Core point:** Modern AI is not magic—it is simple arithmetic (multiplying, adding, and bending curves) repeated billions of times.
* **Definitions:**
  * **Artificial neuron:** A simple mathematical unit that takes several numbers in, weighs them, and outputs one number.
* **Talking points:**
  * Welcome to GDG AI for Science. Behind me is a simulation of a deep neural network: every glowing sphere is an artificial neuron, and every pulse of light is a plain number passing from one layer to the next.
  * By the end of this hour, we will open this black box completely—starting with a single neuron, building all the way up to Gemini and AlphaFold, and summarizing the entire machinery in **six equations**.
  * Every equation tonight arrives *after* its visual picture, so when the symbols appear, you already know what they mean. **`[→]`**

---

#### 2 · I typed “hi” (`#hook`, 0:30–2:30)
* **Core point:** A language model does not “think in sentences”—at each step, it computes a probability distribution over every piece of text in its vocabulary and samples one piece at a time.
* **Definitions:**
  * **Token:** The basic unit of text a language model reads and writes—a common word, a word fragment, or a punctuation mark, represented by an integer ID.
  * **Vocabulary:** The fixed dictionary of all tokens the model knows (262,144 in Gemma 3).
  * **Temperature ($T$):** A knob that rescales uncertainty before choosing a token—low $T$ concentrates nearly all probability on the #1 choice (deterministic); high $T$ flattens the distribution so rarer choices can be picked.
* **Talking points:**
  * Start with the smallest possible experiment: typing two letters, *h-i*.
  * **`[→]`** *(Step 1: probability bars)* These are real measurements from **Gemma 3 270M**, an open-weights cousin of Gemini running locally. Notice the top strip: the model actually receives a 10-token formatted script (`<bos> <start_of_turn> user \n hi <end_of_turn> \n <start_of_turn> model \n`), where each token is just an integer.
  * Out comes a probability for every possible next token: **“Hi” (93.3%)**, **“Hello” (6.3%)**, **“How” (0.37%)**.
  * **`[DEMO]`** *Drag Temperature to ~2, then back to 1; click **Sample a token** a few times.* Raising temperature is like heating atoms in physics—more thermal agitation means more randomness (“Hi” drops to ~71%, “Hello” rises to ~19%). Clicking *Sample* literally rolls a 262,144-sided weighted die.
  * **`[→]`** *(Step 2: counter)* To pick that single word, it scored all **262,144** tokens in its vocabulary.
  * **`[→]`** *(Step 3: reply streams)* Then it appended “Hi” to the prompt and ran the entire calculation again—12 passes total—to write *“Hi there! How can I help you today?”*
  * **`[→]`** *(Step 4: central question)* Here is our scientific mystery for tonight: **How does a static pile of numbers compute those probabilities?** **`[→]`**

---

#### 3 · Tonight’s journey (`#roadmap`, 2:30–3:00)
* **Core point:** Understand the landscape first, build the engine from scratch in the middle, then see how scaling and wiring turn that engine into Gemini and scientific discovery tools.
* **Talking points:**
  * Chapters 1–3 map out what “AI” means in 2026, how 80 years of history brought us here, and the physical stack from power plants to silicon.
  * Chapters **4 and 5** are the heart of tonight: we will build a neural network from one neuron and watch calculus teach it from mistakes.
  * Chapters 6–7 assemble those exact pieces into Transformers, Gemini, and AI for biology, chemistry, and physics—closing with the whole story on one slide. **`[→]`**

---

### Chapter 1 · What is AI today?

#### 4 · What do we mean by “AI”? (`#zoo`, 3:00–5:00)
* **Core point:** AI, Machine Learning, Deep Learning, and Foundation Models are four nested paradigms—and larger/newer isn’t always the right tool for your data.
* **Definitions:**
  * **Artificial Intelligence (AI):** Any computational method that performs tasks associated with intelligent behaviour—including hand-written logic rules and tree search (no learning required).
  * **Machine Learning (ML):** Algorithms that infer statistical rules from data examples rather than explicit human instructions (e.g., linear models, decision trees, random forests).
  * **Deep Learning (DL):** Machine learning built from many stacked layers of artificial neurons that automatically learn hierarchical features directly from raw inputs (pixels, audio waveforms, sequences).
  * **Foundation Models / Generative AI:** Large deep networks pre-trained on massive datasets to model complex probability distributions—capable of generating new text, code, images, or molecular structures, and adaptable across tasks.
* **Talking points:**
  * People use “AI” to mean everything from a thermostat to Gemini. Picture four Russian nesting dolls:
  * Outer ring: **AI (1956)**—includes pure search like Deep Blue beating Kasparov at chess without learning from data.
  * **`[→]`** **Machine Learning**—instead of coding rules, we fit parameters to examples.
  * **`[→]`** **Deep Learning**—multi-layer neural networks that learn their own features from raw signals; sparked the 2012 boom and powers AlphaFold.
  * **`[→]`** **Foundation Models & Generative AI**—giant pre-trained models like Gemini and Gemma.
  * *Practical note for scientists:* If your lab has a clean spreadsheet of 500 rows, classical ML in the second ring (like gradient-boosted trees) routinely beats deep learning. We’ll revisit why at the end. **`[→]`**

---

#### 5 · The state of play: November 2026 (`#now`, 5:00–7:30)
* **Core point:** Modern AI has shifted from single-pass text prediction to multimodal, reasoning models wrapped inside tool-using software harnesses.
* **Definitions:**
  * **Multimodal model:** A single network trained jointly on text, images, audio, and video tokens in a shared representation space.
  * **Test-time compute (“thinking”):** Spending extra computation *during inference* to generate and verify step-by-step intermediate reasoning before producing a final answer.
  * **Mixture of Experts (MoE):** A sparse architecture where each layer holds dozens or hundreds of specialist sub-networks (“experts”), and a learned router sends each token to only a few—decoupling total memory capacity from per-token compute cost.
  * **Agent & Harness:** The *model* only predicts tokens; the *harness* is the surrounding control loop that plans, executes external tools (Python, search, lab APIs), checks outputs, and enforces permissions. Together they form an *agent*.
  * **MCP (Model Context Protocol):** An open standard interface (“USB-C for AI”) connecting models/harnesses to external tools and data sources.
* **Talking points:**
  * **`[→]` × 3 (Row 1 — Models):** ① **Multimodal** in and out—1M tokens of context (~10 novels) plus native generation of images (Nano Banana), video+audio (Veo), music (Lyria), and interactive worlds (Genie 4). ② **Reasoning (“thinking”)**—RL-trained step-by-step deliberation hit IMO gold-medal level in 2025. ③ **Fine-grained MoE**—used in both frontier Gemini 4 and open Gemma 4 26B (25.2B total weights, only 3.8B active per token).
  * **`[→]` × 3 (Row 2 — Agents):** ④ **Tool use**—models invoke Python, search, browsers, or custom lab functions. ⑤ **Harnesses**—if the model is the engine, the harness (like Antigravity or Gemini CLI) is the car steering the plan-act-verify loop. ⑥ **Open standards**—MCP for tools, `AGENTS.md` (60k+ repos), and A2A under the Linux Foundation.
  * **`[→]` × 4 (Row 3 — Impact + Footnote):** ⑦ Measure **cost per completed task**, not price per token (Mistral’s Le Chonk matches top open coding scores using 47% fewer tokens). ⑧ **Open-weight models** (Gemma 4, Apache 2.0) keep sensitive research local. ⑨ **Science**—proteins, crystals, weather, genomics. **`[→]`**

---

### Chapter 2 · How we got here

#### 6 · 80 years of AI (`#timeline`, 7:30–10:30)
* **Core point:** Neural networks are an 80-year-old idea; past “AI winters” happened whenever bold promises outran mathematical depth, data, and hardware.
* **Definitions:**
  * **Perceptron (1958):** Rosenblatt’s single-layer learning neuron—able to learn linear boundaries, but mathematically incapable of nonlinear logic like XOR.
  * **Expert systems (1980s):** Symbolic AI built from thousands of hand-authored `IF–THEN` rules; brittle in the noisy real world.
  * **AI Winter:** Periods when overhyped expectations collided with fundamental bottlenecks, collapsing research funding.
* **Talking points:**
  * Walk the yellow “expectations” curve across 8 eras (hover any icon if asked):
  * **`[→]` 1943–60:** McCulloch & Pitts write down a logical neuron (1943); Turing asks *“Can machines think?”* (1950); Dartmouth names “AI” (1956); Rosenblatt’s **perceptron** learns weights from data (1958).
  * **`[→]` 1969–75:** Minsky & Papert prove single-layer perceptrons can’t even learn XOR; the 1973 Lighthill report triggers the **first AI winter**.
  * **`[→]` 1980s–90s:** Rule-based expert systems boom and bust (**second winter**), while Rumelhart, Hinton & Williams quietly popularize **backpropagation** (1986) and LeCun trains convolutional nets to read postal codes (1989).
  * **`[→]` 1997–2009:** Statistical ML matures; Deep Blue beats Kasparov via brute-force search (1997); Fei-Fei Li’s team assembles **ImageNet** (14M labelled photos, 2009).
  * **`[→]` 2012–17:** **AlexNet** trains a deep net on two gaming GPUs and halves ImageNet error overnight (2012); AlphaGo (2016); Google publishes *“Attention Is All You Need”*—the **Transformer** (2017).
  * **`[→]` × 3 (2020–26):** GPT-3 & AlphaFold 2 (2020) → ChatGPT & Gemini 1.0 (2022–23) → AI Nobel Prizes (2024), IMO-gold reasoning models (2025), and sparse MoE flagships (2026). **`[→]`**

---

#### 7 · Why now? Compute exploded (`#whynow`, 10:30–12:00)
* **Core point:** Modern AI ignited when internet-scale data met scalable algorithms and an exponential **10-billion-fold** surge in training compute.
* **Definitions:**
  * **FLOP (Floating-Point Operation):** One basic decimal addition or multiplication—the unit of computational work.
  * **Logarithmic scale:** An axis where equal vertical steps multiply by 10 ($10^{18}, 10^{20}, 10^{22}\dots$), turning exponential explosions into straight lines.
  * **$C \approx 6ND$ rule:** Training a dense Transformer with $N$ active parameters on $D$ tokens takes roughly $6 \times N \times D$ FLOPs (~2 FLOPs/weight forward + ~4 FLOPs/weight backward).
* **Talking points:**
  * Three ingredients had to converge: **Data** (trillions of tokens), **Algorithms** (backprop, ReLU, residual highways, attention, MoE), and above all **Compute**.
  * Since 2010, frontier training compute grew **4–5× every single year** (Epoch AI)—jumping from AlexNet ($\approx 5 \times 10^{17}$ FLOP) to Llama 3.1 405B ($\approx 4 \times 10^{25}$ FLOP), nearly 100 million times more arithmetic.
  * Point out the top-right hollow dot (**Mistral Large 4 “Le Chonk”**, Oct 2026): 1 trillion total parameters, yet only 52B active per token via MoE—training in $\approx 1.3 \times 10^{25}$ FLOP, a third of Llama 3.1’s bill. Cleverer algorithms buy capability without brute force.
  * **`[→]`** *(Switch to Linear scale)* Watch everything before 2020 flatten onto the floor—that is the visceral reality of exponential growth. **`[→]`**

---

#### 8 · 2024: AI wins two Nobel prizes (`#nobel`, 12:00–13:00)
* **Core point:** Neural networks emerged from statistical physics and have matured into foundational instruments of scientific discovery.
* **Talking points:**
  * **Physics (Hopfield & Hinton):** Borrowed energy landscapes and Boltzmann distributions from condensed-matter physics to show how networks of simple nodes store associative memories and learn representations.
  * **Chemistry (Baker; Hassabis & Jumper):** Solved the 50-year protein-folding problem (predicting 3D atomic coordinates from 1D amino-acid sequences via AlphaFold) and designed entirely new functional proteins from scratch.
  * **`[→]`** Like Galileo’s telescope or Leeuwenhoek’s microscope, AI is shifting from an engineering curiosity into part of the scientific method itself. **`[→]`**

---

### Chapter 3 · The technology stack

#### 9 · The AI technology stack (`#stack`, 13:00–14:30)
* **Core point:** Strip away the mystique: a trained model is just a static file of numbers; seven layers of physical and software engineering exist to multiply those numbers fast and wrap them safely.
* **Definitions:**
  * **Compiler / ML Framework (JAX, PyTorch, XLA, CUDA):** Software that translates high-level matrix equations into fused machine instructions distributed across thousands of accelerator chips.
  * **Inference / Serving:** Running a frozen, already-trained model to answer live user requests (as opposed to *training*, which updates the weights).
* **Talking points:**
  * Climb from bedrock to user interface:
  * Start on **① Energy & data centres**—megawatts of electricity and liquid cooling turning power into computation.
  * **`[→]` ② Chips**—GPUs and Google TPUs built around matrix-multiply silicon (Gemini 2.5 trained across pods of 8,960 TPU v5p chips).
  * **`[→]` ③ Systems software**—PyTorch, JAX, Keras, XLA, CUDA; open-source tools anyone here can `pip install`.
  * **`[→]` ④ Models**—an architecture blueprint + billions of learned weights.
  * **`[→]` ⑤ Data & training** → **`[→]` ⑥ Serving** (batching requests, streaming tokens, safety filters) → **`[→]` ⑦ Apps & agents**. **`[→]`**

---

#### 10 · The journey of “hi” (`#journey`, 14:30–17:00)
* **Core point:** Text lives on the CPU and tensors live on the GPU—only tiny 4-byte integer token IDs cross the wire between them, while gigabytes of model weights are read inside GPU memory.
* **Definitions:**
  * **BPE Tokenizer (Byte-Pair Encoding):** A fast lookup algorithm that splits raw text into common sub-word pieces and maps each piece to its integer ID.
  * **PCIe bus:** The physical data highway connecting the host CPU’s memory to the GPU’s high-bandwidth memory (VRAM).
  * **Prefill vs Decode:** *Prefill* processes all prompt tokens simultaneously in one parallel pass; *decode* generates the response sequentially, one token per pass, feeding each chosen token back in (**autoregressive loop**).
  * **KV Cache (Key-Value Cache):** The saved attention keys and values of all earlier tokens kept in GPU VRAM (~18 KB/token in Gemma 3 270M) so the model never recomputes the past.
* **Talking points:**
  * Follow our two-letter `"hi"` through a real inference server using measured Gemma 3 270M numbers:
  * **`[→]` ① Input guardrail** (policy/safety filter) → **`[→]` ② Chat template** (adds `<start_of_turn>user...` formatting tags—formatting, not security!) → **`[→]` ③ Tokenizer** (turns the templated string into 10 integers in **6.8 microseconds**; `"hi"` = `2202`) → **`[→]` ④ PCIe transfer** (just **40 bytes** cross into GPU VRAM—the GPU never sees English letters!).
  * **`[→]` ⑤ Prefill** (all 10 token vectors pass through 18 layers in parallel, populating the KV cache; `"Hi"` scores 93.3%) → **`[→]` ⑥ Decode loop** (11 sequential laps generate 1 token per lap until `<end_of_turn>`; weights stay in VRAM) → **`[→]` ⑦ Detokenizer** (each integer streams immediately back to the CPU as text—that’s why words appear one by one!) → **`[→]` ⑧ Output guardrail**.
  * Point out the byte meter: **under 100 bytes** crossed PCIe, while the GPU read **6.4 GB** of weights!
  * **`[→]` Local open weights (L1–L4):** Running `llama.cpp` or `vLLM` locally uses the exact same pipeline—adding grammar masks for guaranteed JSON, unified CPU/GPU memory on Apple silicon (zero PCIe copy), and prefix caching across chat turns. **`[→]`**

---

### Chapter 4 · Inside a neural network

#### 11 · Step 0: Everything is numbers (`#tensors`, 17:00–19:00)
* **Core point:** One mathematical architecture can process photos, brainwaves, language, and proteins because every physical measurement or symbol can be encoded as a structured grid of numbers.
* **Talking points:**
  * **`[DEMO]`** *Click **🔍 zoom into the eye** on Rear Admiral Grace Hopper’s portrait and hover over pixels.* Up close, a human face is nothing more than a grid where each square holds three integers—Red, Green, Blue—from 0 to 255 (14,400 numbers even at 64×75 resolution).
  * **`[→]`** **Brainwaves (EEG):** Voltage sampled over time—4 channels × 800 numbers.
  * **`[→]`** **Text:** Sequence of token IDs (`"The"` = 818; `"wombat"` splits into `"wom"` + `"bat"`).
  * **`[→]`** **Proteins:** Chains of 20 standard amino acids mapped to integers 0–19. Once nature is written as numbers, finding patterns becomes geometry. **`[→]`**

---

#### 12 · Tensors: numbers stacked in boxes (`#tensors2`, 19:00–20:00)
* **Core point:** In computer science, a *tensor* is simply a box of numbers generalized to any number of dimensions (axes).
* **Definitions:**
  * **Tensor & Rank:** An array of numbers indexed along $k$ axes (*rank* $k$): **Scalar** (rank 0, single number), **Vector** (rank 1, list/column), **Matrix** (rank 2, 2D table), **3D Tensor** (rank 3, e.g., image height × width × colour), **4D Tensor** (rank 4, a *batch* of images processed together).
* **Talking points:**
  * Physicists attach coordinate-transformation rules to tensors, but in machine learning a tensor is simply an $N$-dimensional container of numbers.
  * Watch the cubes stack from scalar → vector → matrix → RGB image → batch of images. A neural network is an assembly line where tensors flow in, get multiplied and bent into new shapes, and flow out as predictions—literally **TensorFlow**. **`[→]`**

---

#### 13 · One artificial neuron: a weighted vote (`#neuron`, 20:00–22:30)
* **Core point:** A single artificial neuron computes a weighted vote over its inputs, shifts the result by a threshold (*bias*), and squashes it into a probability—drawing a straight decision boundary across input space.
* **Definitions:**
  * **Fisher’s Iris dataset (1936):** Classic botanical dataset of 150 flowers across three species (*Iris setosa*, *Iris versicolor*, *Iris virginica*), measured by petal and sepal length/width.
  * **Weights ($w_1, w_2$):** Multipliers telling how strongly—and with what sign—each input feature votes toward the output. Geometrically, the vector $\mathbf{w}=(w_1, w_2)$ sets the orientation of the boundary and points perpendicular to it.
  * **Bias ($b$):** An offset added to the sum that shifts the boundary without tilting it—controlling how easily the neuron fires.
  * **Decision boundary:** The line $w_1 x_1 + w_2 x_2 + b = 0$ where the neuron’s output is exactly $\sigma(0) = 0.50$ (50 : 50).
* **Talking points:**
  * Look at the three flower photos on the bottom right so everyone knows what we’re measuring: *Iris setosa* (blue) has tiny stubby inner petals (~1.5 × 0.2 cm), *Iris versicolor* (orange) has medium petals (~4.3 × 1.3 cm), and *Iris virginica* (green) has large petals (~5.6 × 2.0 cm).
  * Each dot on the chart is a real flower plotted by petal length ($x_1$) vs petal width ($x_2$). Right now our neuron calls every flower *setosa* (50/100 correct).
  * **`[DEMO]`** *Drag **bias $b$** from $-8$ up to $\approx -4$.* Watch the yellow 50:50 line sweep between blue and orange—**100 out of 100**! *Bias* is how easily the neuron fires.
  * **`[DEMO]`** *Drag **$w_1$** and **$w_2$**, and hover a flower dot.* Changing weights tilts the boundary—*weights* decide which measurements the neuron cares about. Notice the yellow arrow $\mathbf{w}$ always points perpendicular to the boundary toward higher output confidence.
  * **`[DEMO]`** *Click the **I. virginica** card (or **versicolor vs virginica**), then click **⚙️ let it learn**.* Notice orange (*versicolor*) stays right where it was, and green (*virginica*) overlaps with it—no straight line can ever get 100%. Clicking *let it learn* previews Chapter 5: calculus nudges $w_1, w_2, b$ automatically up to **94/100** (best possible line is 97). **`[→]`**

---

#### 14 · Why bend? Activation functions (`#activation`, 22:30–23:30)
* **Core point:** Stacking linear layers without a nonlinear curve (“bend”) between them collapses mathematically into a single flat layer—**nonlinearity is what makes deep learning deep**.
* **Definitions:**
  * **Activation function:** A nonlinear function applied to each neuron’s weighted sum $z$.
  * **Step function (1943):** Jumps abruptly from 0 to 1; flat everywhere ($0$ slope), so calculus gives zero signal on how to improve weights.
  * **Sigmoid ($\sigma(z) = \frac{1}{1+e^{-z}}$) & Tanh:** Smooth S-curves squashing $(-\infty, \infty)$ into $(0,1)$ or $(-1,1)$ with non-zero slopes for learning.
  * **ReLU ($\max(0, z)$) & GELU:** Zero for negative inputs, linear (or smoothly curved in GELU) for positive inputs—cheap to compute and resistant to vanishing slopes in deep networks; GELU is used in Gemini and Gemma.
  * **Linear collapse:** $W_2(W_1 \mathbf{x}) = (W_2 W_1)\mathbf{x} = W_{\text{single}}\mathbf{x}$—multiplying matrices without an intervening bend can only ever draw flat hyperplanes.
* **Talking points:**
  * **`[DEMO]`** *Click through **step → sigmoid → tanh → ReLU → GELU**.* Why did neural networks abandon the 1943 hard step? Because a flat cliff gives zero slope—you can’t feel which way is downhill! Smooth curves and ReLU/GELU preserve slope so networks can learn.
  * Point to the red card: if you apply two straight-line transformations in a row without bending in between, algebra collapses them into one matrix. A 100-layer linear network has no more expressive power than a 1-layer network! **`[→]`**

---

#### 15 · ▶ A neuron (animation) (`#v-neuron`, 23:30–24:00)
* **Core point:** Watch all three ingredients of one artificial neuron—weighted sum, bias shift, and nonlinear squash—lock into a single clean formula before we scale to a full layer.
* **Talking points** *(21 s video plays automatically)*:
  * *(0 s)* Three inputs $(0.9, 0.2, 0.6)$ travel along wires with weights $(+1.2, -0.8, +0.5)$—blue positive, red negative, thickness proportional to strength.
  * *(7 s)* Multiply and sum with bias $-0.2$: $1.08 - 0.16 + 0.30 - 0.20 = 1.02$.
  * *(10 s)* Pass $1.02$ through the sigmoid bend to get **$\hat{y} = 0.73$**—remember $1.02 \to 0.73$ for Neuron #1 on the very next slide! **`[→]`**

---

#### 16 · A whole layer = one matrix multiplication (`#layer`, 24:00–25:30)
* **Core point:** Putting many neurons side by side in a layer—each looking for a different pattern in the same inputs—is mathematically identical to one **matrix-vector multiplication**.
* **Definitions:**
  * **Dense (fully connected) layer:** A bank of neurons where every input connects to every neuron in the layer.
  * **Dot product:** Multiplying two equal-length lists element-by-element and summing the products ($\sum_j W_{ij} x_j$).
  * **Weight matrix ($W$):** A 2D table whose $i$-th row holds all incoming weights of the $i$-th neuron.
* **Talking points:**
  * One neuron asks one question of the inputs; four neurons ask four independent questions at once.
  * **`[DEMO]`** *Click **next neuron ▸** 4 times; hover a matrix cell to light up its wire.* Row 1 dotted with input column $\mathbf{x}$ gives $1.22$—our exact neuron from the animation! Rows 2, 3, and 4 compute the other three neurons.
  * **`[DEMO]`** *Click **next neuron ▸** twice more.* Add bias vector $\mathbf{b}$ ($1.22 - 0.2 = 1.02$) and apply $\sigma$ element-wise to get $(0.73, 0.58, 0.57, 0.33)$. **`[→]`**

---

#### 17 · ▶ A layer is a matrix (animation) (`#v-layer`, 25:30–26:00)
* **Core point:** Visual proof of Equation ①: $\mathbf{a} = \sigma(W\mathbf{x} + \mathbf{b})$.
* **Talking points** *(22 s video)*:
  * Watch the tangled web of 12 wires lift right off the diagram and pack neatly into the 4 rows of matrix $W$.
  * That single notation—$\mathbf{a} = \sigma(W\mathbf{x} + \mathbf{b})$—turns messy wiring into clean linear algebra that hardware can execute in parallel. **`[→]`**

---

#### 18 · ▶ Layers warp space (animation) (`#v-warp`, 26:00–26:30)
* **Core point:** Geometrically, a neural network doesn’t draw a complicated boundary through fixed points—it **warps the space itself** until tangled classes become separable by a straight line.
* **Talking points** *(23 s video)*:
  * Watch two interlocking crescents (blue and orange) that no straight line could ever divide.
  * Each layer stretches and rotates the entire grid ($W$), shifts it ($\mathbf{b}$), and bends it ($\tanh$)—until the crescents untangle and a single straight line cleanly separates them. **`[→]`**

---

#### 19 · Tensor transformations: a layer warps space (`#warp`, 26:30–29:00)
* **Core point:** Every matrix multiplication is a geometric stretch, rotation, or shear determined completely by where the unit basis vectors $\hat{\imath}$ and $\hat{\jmath}$ land; the activation function is what bends straight grid lines into curves.
* **Definitions:**
  * **Linear transformation ($W\mathbf{x}$):** Maps space while keeping grid lines straight, parallel, and evenly spaced; Column 1 of $W$ is where $\hat{\imath}=(1,0)$ lands, Column 2 is where $\hat{\jmath}=(0,1)$ lands.
  * **Determinant ($\det W$):** The signed factor by which a matrix scales area (or volume). If $\det W = 0$, space collapses onto a lower dimension, irreversibly erasing information.
  * **Affine + nonlinear map ($\tanh(W\mathbf{x}+\mathbf{b})$):** Linear warp ($W$), origin shift ($\mathbf{b}$), and coordinate-wise curve ($\tanh$).
* **Talking points:**
  * **`[→]`** **Rotate** → **`[→]`** **Shear** (slanting the grid).
  * **`[DEMO]`** *Drag an arrow tip, then click **squash**.* When $\hat{\imath}$ and $\hat{\jmath}$ line up, $\det W = 0$: the entire 2D plane flattens onto a 1D line—information lost forever!
  * **`[→]`** **Shift** (bias $\mathbf{b}$ moves the grid) → **`[→]`** **Bend** ($\tanh$ curves the straight lines into the $[-1,1]$ box). A 640-dimensional layer in Gemma performs this exact **stretch, rotate, shift, bend** in 640D space. **`[→]`**

---

#### 20 · Deep learning = warp, warp, warp (`#deep`, 29:00–30:30)
* **Core point:** **Depth** composes simple warps step by step—each layer untangles the data’s geometry a little further until the final classification is trivial.
* **Definitions:**
  * **Representation learning:** Automatically transforming raw measurements across successive hidden layers into an internal coordinate space where meaningful categories separate cleanly.
* **Talking points:**
  * **`[→]`** *(Plays all 9 stages across 3 layers)* Imagine two colours painted on a crumpled ball of paper. Instead of cutting with microscopic curved scissors, a deep network gently unfolds the paper crease by crease—using just **21 learned numbers** here to hit **100% accuracy** with a straight cut at the end. **`[→]`**

---

#### 21 · Weights: the knobs (`#weights`, 30:30–32:00)
* **Core point:** Everything an AI model knows—syntax, facts, physics heuristics—exists strictly as millions or billions of learned decimal numbers stored in weight matrices.
* **Definitions:**
  * **Parameters:** All adjustable numbers in a model (every entry of every weight matrix $W$ and bias vector $\mathbf{b}$).
* **Talking points:**
  * Left: a real 655,360-number weight matrix from Layer 0 of **Gemma 3 270M**, drawn at one pixel per weight (blue positive, red negative).
  * **`[→]`** *(Zooms to raw decimals)* `0.012`, `−0.031`… Nobody hand-coded a single number here; every one was tuned automatically during training.
  * Right: the logarithmic ladder from our 3-knob Iris neuron and 21-knob moon net up to **268,098,176** knobs in Gemma 3 270M (63% in the token embedding table alone) and 175B in GPT-3. Now ask: if Gemma has 268M weights, how does physical silicon multiply 268M numbers for *every single word*? **`[→]`**

---

#### 22 · How GPUs & TPUs work (`#chips`, 32:00–34:00)
* **Core point:** Arithmetic on silicon is extraordinarily cheap; **fetching numbers from off-chip memory burns ~170× more energy**, so AI accelerators win by massive parallelism and passing data rhythmically between neighbouring cells.
* **Definitions:**
  * **MAC (Multiply-Accumulate):** The atomic hardware step of matrix math: $s \leftarrow s + w \times x$.
  * **Memory wall (von Neumann bottleneck):** The speed and energy penalty of shuttling weights and activations back and forth between off-chip DRAM and compute cores.
  * **Systolic array (Kung & Leiserson, 1978):** A 2D grid of MAC cells where weights stay stationary and inputs/partial sums pulse from neighbour to neighbour every clock tick—like blood pumped by a heartbeat (*systole*)—eliminating repeated memory trips.
* **Talking points:**
  * Run our 4×3 layer $W$ across 4 tokens (48 MACs total) and watch **ticks** (time) and **memory fetches** (red counter):
  * **`[→]` CPU:** 4 powerful sequential cores—**12 ticks, 96 memory trips**.
  * **`[→]` GPU:** Built to shade millions of pixels simultaneously—16 cores finish in **3 ticks**, though a naive uncached pass still makes **96 trips** (real NVIDIA H100s use caches + 528 Tensor Cores to cut trips dramatically).
  * **`[→]` TPU:** Load the 12 weights once and freeze them in place; stream inputs down and running sums right—top-left drops out **1.22** (our exact row-1 sum!), cutting memory trips from 96 down to **24**.
  * **`[→]` Energy:** At 45 nm, one 32-bit multiply costs **3.7 pJ**, while reading one number from off-chip DRAM costs **640 pJ (~170× more)**! Data movement—not math—dominates AI power.
  * **`[→]` Zoom out:** One 128×128 Matrix Multiply Unit (16,384 MACs/tick @ 1.75 GHz) → 8 MXUs on a TPU v5p chip (459 TFLOP/s) → optical pods of **8,960** (v5p) or **9,216** (Ironwood) chips acting as one supercomputer. **`[→]`**

---

### Chapter 5 · How machines learn

#### 23 · Learning step 1: measure how wrong you are (`#loss`, 34:00–36:00)
* **Core point:** To learn automatically, we first collapse all prediction errors across a dataset into a single scalar score—the **loss function**—turning “learning” into finding the lowest point of a mathematical surface.
* **Definitions:**
  * **Loss (objective / cost) function $L$:** A single number quantifying how poorly the current parameters fit the training data (lower = better).
  * **Mean Squared Error (MSE):** $L = \frac{1}{N}\sum_i (\hat{y}_i - y_i)^2$—squaring each residual makes every error positive and penalizes big misses heavily (invented by Gauss & Legendre around 1805 to track planetary orbits!).
* **Talking points:**
  * Plot NASA’s 8 planets: log distance from the Sun ($\log_{10} a$) vs log orbital period ($\log_{10} T$). Each red square literally has side length equal to that planet’s vertical miss, so its **area is the squared error**.
  * **`[DEMO]`** *Drag the yellow line handles to shrink the red squares.*
  * **`[→]`** *(Best fit)* Minimizing average square area lands at slope **$w = 1.498 \approx \frac{3}{2}$**—rediscovering **Kepler’s Third Law ($T^2 \propto a^3$, 1619)** straight from raw numbers!
  * **`[→]`** *(Raw linear axes)* Flip back from log-log to ordinary units to see our straight line become Kepler’s classic power-law curve.
  * **Bridge to step 2:** *“So learning means finding the bottom of this loss. For a straight line, Legendre and Gauss gave us a formula around 1805, and that’s what the best-fit button just used. But Gemma 3 has 268 million knobs, bent through activation functions, and no such formula exists. So how does a machine find the bottom when it can’t see the map?”* (Presenter note: ✨ best fit uses the closed-form least-squares formula, not gradient descent.) **`[→]`**

---

#### 24 · ▶ Gradient descent (animation) (`#v-descent`, 36:00–36:30)
* **Core point:** Without a closed-form shortcut, a network finds good weights like a hiker in thick mountain fog—feeling the local slope underfoot and stepping downhill.
* **Definitions:**
  * **Derivative ($\frac{dL}{dw}$):** The local slope of the loss with respect to weight $w$ (positive = uphill to the right, so step left).
  * **Learning rate ($\eta$):** A hyperparameter scaling how big a step we take per update ($w \leftarrow w - \eta \frac{dL}{dw}$).
* **Talking points** *(18.5 s video)*:
  * *(0 s)* **Learning step 2.** Across: one knob, $w$. Up: how wrong. Every setting of the knob is one dot on this curve. (Presenter note: this curve is illustrative, not Kepler’s; slide 25 brings back the real loss.)
  * *(2.5 s)* Measure the slope and step opposite to it: $w \leftarrow w - \eta \frac{dL}{dw}$.
  * *(3.5 s)* If $\eta$ is too large, you leap right across the valley and bounce higher.
  * *(9.6 s)* With a sensible $\eta$, steps automatically shorten as the valley floor flattens out, settling cleanly into the minimum. **`[→]`**

---

#### 25 · Learning step 2: roll downhill (`#descent`, 36:30–38:30)
* **Core point:** **Gradient descent** generalizes “stepping opposite the slope” to any number of knobs simultaneously—and its stability hinges critically on the learning rate $\eta$.
* **Definitions:**
  * **Loss landscape:** The altitude map of error $L$ plotted over every possible combination of model parameters.
  * **Gradient ($\nabla L$):** The vector collecting the partial derivative $\frac{\partial L}{\partial w_i}$ along every parameter axis; $-\nabla L$ points in the direction of steepest descent.
* **Talking points:**
  * Every point on this contour map is one candidate line $(w, b)$ for Kepler’s planets (yellow = terrible fit, deep blue = low error; green arrow = $-\nabla L$).
  * **`[→]` $\eta = 0.1$:** Smooth, steady descent into the Kepler minimum in ~180 steps, landing on $w = 1.498$: the same answer the best-fit formula gave on slide 23, reached just by walking downhill.
  * **`[→]` $\eta = 0.6$:** Reaches the valley fast (~27 steps) but zig-zags violently off the steep canyon walls.
  * **`[→]` $\eta = 0.8$:** **Divergence**—each bounce overshoots higher up the opposite wall until the error explodes to infinity! **`[→]`**

---

#### 26 · ▶ Real loss landscapes (`#landscape`, 38:30–39:15)
* **Core point:** In 268 million dimensions, calculus works identically—and tricks like **momentum** help optimizers glide past shallow traps into deep valleys.
* **Definitions:**
  * **Non-convex landscape, Local minimum & Saddle point:** Rugged surfaces with multiple valleys; in high dimensions, most flat spots aren’t dead-end bowls (*local minima*) but *saddle points* that curve up in some directions and down in others.
  * **Momentum & Adam:** Optimizers that accumulate a running velocity of past gradients (like a heavy ball rolling downhill) and adapt step sizes per parameter.
* **Talking points** *(Blender loop)*:
  * Watch the glowing ball roll through a rugged terrain, escape a shallow side basin thanks to momentum, and settle into the global valley.
  * Now face the million-dollar question: if we wiggle 268M knobs one at a time to test each slope, one step would require 268 million forward passes. How do we compute all 268M slopes *at once*? **`[→]`**

---

#### 27 · Learning step 3: backpropagation assigns the blame (`#backprop`, 39:15–41:15)
* **Core point:** Think of a train of gears—knowing each gear pair’s local ratio lets one backward sweep determine how turning the very first knob moves the final needle, for ~2× the work of one forward pass.
* **Definitions:**
  * **Chain rule ($\frac{\partial L}{\partial w} = \frac{\partial L}{\partial \hat{y}}\frac{\partial \hat{y}}{\partial z}\frac{\partial z}{\partial w}$):** The rate of change through a chain of functions is the product of each link’s local rate of change.
  * **Backpropagation (reverse-mode automatic differentiation):** Caching intermediate activations on the forward pass, then sweeping error sensitivities right-to-left so all $N$ parameter gradients are computed in one pass (explaining the “4” backward FLOPs + “2” forward FLOPs in $C \approx 6ND$!).
* **Talking points:**
  * **One-liner** (as you arrive, answering slide 26’s question): *“The loss tells us **how wrong** we are. Backpropagation tells every knob **how much it’s to blame**, and which way to turn.”* (Presenter note: each knob’s slope $\frac{\partial L}{\partial w}$ *is* that blame: its size says how much, its sign says which way.)
  * **`[→]` Forward** (values flow left-to-right) → **`[→]` Backward** (blame flows right-to-left) → **`[→]` Update** (weights step opposite gradients, loss drops) → **`[→]` Train ×20** (watch error converge toward zero). **`[→]`**

---

#### 28 · ▶ Backpropagation (animation) (`#v-backprop`, 41:15–41:45)
* **Core point:** **Backpropagation** applies the chain rule of calculus backward from the final loss—computing every weight’s exact sensitivity in a single reverse sweep.
* **Talking points** *(23 s video)*:
  * *(0 s)* The same forward and backward pass you just clicked through, now animated.
  * *(2.6 s)* **Forward pass (blue, left → right):** Input $x=2 \times w=0.5 \to z=1.0 \to \hat{y}=0.731 \to \text{loss } L = (\hat{y}-1)^2 = 0.0723$.
  * *(7 s)* **Backward pass (green, right → left):** Each simple link knows its own local derivative: $-0.538$, $0.197$, and $2$.
  * *(12 s)* **Chain rule:** Multiply the local sensitivities along the chain: $(-0.538)\times 0.197 \times 2 = -0.2115 = \frac{\partial L}{\partial w}$. Nudge $w$ up (opposite the negative slope), and the loss drops! **`[→]`**

---

#### 29 · Put it together: watch a network learn (`#train`, 41:45–44:15)
* **Core point:** Running **Forward → Loss → Backward → Update** in a loop spontaneously organizes simple neurons into a hierarchy of features—edges first, curves second, full shapes last.
* **Definitions:**
  * **Epoch / Iteration:** One pass of computing predictions, loss, backward gradients, and weight updates.
  * **XOR (Exclusive-OR):** Classic nonlinear task where opposite quadrants share a label—impossible for a single linear boundary, trivial once hidden neurons bend space.
* **Talking points:**
  * **`[→]`** *(Starts live training in browser—~50 lines of vanilla JS)* Watch two interleaved spirals untangle in real time! Look at the little square thumbnails inside each neuron: Layer 1 discovers straight diagonal cuts; Layer 2 combines cuts into curves; Layer 3 weaves curves into spirals—emergent hierarchy without a single hand-coded rule.
  * **`[DEMO]`** *Select **XOR** with **1 hidden layer** and **1 neuron/layer**—watch it stall at ~63%, recreating Minsky & Papert’s 1969 roadblock live—then restore 3 layers / 6 neurons to watch it snap to 100%.*
  * **Recap in three beats** (the order they run in every training step): *“Loss: how wrong. Backprop: who’s to blame. Gradient descent: nudge them.”*
  * Emphasize: **That 4-step loop is all of deep learning.** Gemini runs the exact same loop on bigger matrices. **`[→]`**

---

### Chapter 6 · From networks to Gemini

#### 30 · Words become vectors: a map of meaning (`#embed`, 44:15–45:45)
* **Core point:** An embedding table turns discrete symbols into continuous coordinates in high-dimensional space, where **semantic similarity becomes geometric closeness** and **relationships become directions**.
* **Definitions:**
  * **Vector embedding:** A learned lookup table assigning each vocabulary token a dense list of numbers ($d = 640$ in Gemma 3 270M).
  * **Dimensionality reduction (t-SNE / PCA):** Projecting high-dimensional points onto a 2D map so nearby vectors stay nearby visually.
  * **Cosine similarity:** Measuring how closely two vectors point in the same direction.
* **Talking points:**
  * Token IDs alone are arbitrary labels (`"Jupiter"`’s ID number tells you nothing about planets). So Gemma gives every token 640 learned coordinates.
  * Look at this real t-SNE map of Gemma 3’s embeddings: planets cluster, elements cluster, emotions cluster—nobody gave it a taxonomy; tokens that appear in exchangeable contexts get pulled together by gradient descent! Notice `"lead"` sitting near both metals and verbs.
  * **`[→]`** *(Highlight Jupiter)* Out of all **262,144** tokens in Gemma’s vocabulary, Jupiter’s nearest neighbours by cosine similarity are *Saturn, Venus, Neptune, Mars, Titan, Pluto, Uranus*—and *Zeus*!
  * Even directions carry meaning: `vec("king") − vec("man") + vec("woman") ≈ vec("queen")`; `vec("sodium") − vec("Na") + vec("K") ≈ vec("potassium")` (14 of 18 tested analogies succeed; misses left in honestly). **`[→]`**

---

#### 31 · Attention: words look at other words (`#attention`, 45:45–47:45)
* **Core point:** **Multi-head attention** runs dozens of independent Query-Key-Value circuits in parallel so the network learns specialized linguistic detectors automatically.
* **Definitions:**
  * **Multi-Head Attention:** Splitting token vectors across $H$ parallel attention heads, each with its own $(W_Q, W_K, W_V)$ matrices, then concatenating their outputs.
  * **Attention sink:** A common learned behaviour where a head parks nearly all its probability weight on the `<bos>` (beginning-of-sequence) token as a harmless “do-nothing” state when no pattern matches.
* **Talking points:**
  * **Opener:** *“One vector per word isn’t enough: a river bank isn’t a bank account. Attention lets each word look back at the words before it and borrow their meaning. Here’s a real Gemma head doing it.”*
  * Validated real attention matrices extracted from **Gemma 3 270M** (18 layers × 4 query heads = 72 heads):
  * On entry (**Layer 9, Head 2**): *“The trophy did not fit in the suitcase because **it** was too big.”* From `"it"`, **51.2%** of attention routes directly to `"trophy"` vs only **7.6%** to `"suitcase"`—pronoun resolution learned purely from next-word prediction!
  * **`[→]` Layer 2, Head 3:** A crisp **previous-token head** (note the sub-diagonal stripe in the heatmap).
  * **`[→]` Layer 17, Head 3:** An **attention sink**—parking ~95% on `<bos>` whenever a head has nothing useful to contribute.
  * **Bridge:** *“So how does a word know where to look? Here’s the mechanism, in 22 seconds.”* **`[→]`**

---

#### 32 · ▶ Attention (animation) (`#v-attention`, 47:45–48:15)
* **Core point:** Static word vectors aren’t enough because words change meaning in context (“bank” of a river vs “bank” account)—**self-attention** lets tokens dynamically query earlier tokens and blend relevant context.
* **Definitions:**
  * **Self-Attention:** A mechanism where each token computes relevance weights over other tokens in the sequence and absorbs a weighted sum of their information.
  * **Query ($\mathbf{q}$), Key ($\mathbf{k}$), Value ($\mathbf{v}$):** Three learned linear projections of each token: **Query** = *what I’m looking for*; **Key** = *what I advertise*; **Value** = *what content I pass along if matched*.
  * **Causal mask:** Restricting each token to attend only to itself and earlier tokens (forming a lower-triangular matrix) so the model cannot peek at future words during training.
* **Talking points** *(22 s video; illustrative numbers)*:
  * *“The wombat crossed the road because **it** was hungry.”* How does `"it"` know it’s a wombat?
  * `"it"` broadcasts its **Query**; every earlier word holds up a **Key**; dot products $\mathbf{q}\cdot\mathbf{k}/\sqrt{d_k}$ pass through softmax so `"wombat"` wins the highest weight, pouring its **Value** vector into `"it"`. **`[→]`**

---

#### 33 · The whole Transformer, in 3D (`#llm3d`, 48:15–49:15)
* **Core point:** Every modern LLM (GPT, Gemma, Gemini) is simply a repeating two-beat rhythm stacked $N$ layers deep: **Attention** moves context *between* tokens, and an **MLP** processes knowledge *within* each token.
* **Definitions:**
  * **Transformer block (Vaswani et al., 2017):** One repeating unit combining Multi-Head Self-Attention + Feed-Forward MLP, wrapped with **residual (skip) connections** ($\mathbf{x} + f(\mathbf{x})$, so gradients flow cleanly across dozens of layers) and **normalization**.
* **Talking points:**
  * Walk the one-line blueprint at the bottom: **Embeddings → (Self-Attention + MLP) × $N$ layers → Vocabulary logits**. Every single sub-part is just matrices and bends you now understand!
  * **`[DEMO]`** *(Optional if internet is live)* Click **Open bbycroft.net/llm ↗** (opens in a new browser tab) for a 30-second 3D flythrough from token embeddings to final softmax, then switch right back to this tab. **`[→]`**

---

#### 34 · ▶ Softmax & temperature (`#v-softmax`, 49:15–49:45)
* **Core point:** **Softmax** turns any list of positive or negative raw scores (*logits*) into valid probabilities that are positive and sum to 100%, governed by temperature $T$.
* **Definitions:**
  * **Logits ($z_i$):** The raw, unnormalized real-valued scores produced by the final linear layer for every token in the vocabulary.
  * **Softmax ($p_i = \frac{e^{z_i/T}}{\sum_j e^{z_j/T}}$):** Exponentiates scaled logits (making them strictly positive and amplifying leaders) and divides by their sum (normalizing to 1).
* **Talking points** *(20 s video)*:
  * Watch 5 candidate chemical tokens: exponentiating turns differences into ratios, dividing by the sum normalizes them to 1, and sweeping $T$ from $0.3 \to 2.5$ shifts the distribution from laser-focused certainty (`"Au"`) to creative exploration. **`[→]`**

---

#### 35 · A language model is a next-token predictor (`#predict`, 49:45–51:15)
* **Core point:** Generating text by chaining next-token probabilities explains both why LLMs write so fluently and why they **hallucinate**—statistical likelihood is not a database of verified facts.
* **Definitions:**
  * **Autoregressive generation:** Factoring sequence probability via $P(w_1,\dots,w_t) = \prod_k P(w_k \mid w_{<k})$—generating one token at a time conditioned on all preceding tokens.
  * **Hallucination:** Fluent, grammatically probable text generated by the model that is factually false.
* **Talking points:**
  * Real outputs from raw pretrained **Gemma 3 270M**:
  * *“The Great Barrier Reef is located off the coast of…”* → **Australia (49%)**, **Queensland (34%)**.
  * **`[→]`** *“The chemical symbol for gold is…”* → **Au (32%)** (*`[DEMO]` drag $T$ to 0.3 → Au jumps to ~75%*).
  * **`[→]`** *“The largest planet in our solar system is…”* → Top prediction is `"the"` then `"a"`; **Jupiter gets 0.85%**, and greedy decoding loops endlessly! In a compact 270M model you can catch the mechanism red-handed: **next-token plausibility $\neq$ truth**. Larger models know far more facts, yet share this exact statistical foundation. **`[→]`**

---

#### 36 · Training a giant: predict, align, think, and scale (`#scale`, 51:15–52:45)
* **Core point:** Frontier models are built in three training phases, and their pre-training error obeys smooth **power-law scaling laws** linking compute, model size, and dataset size.
* **Definitions:**
  * **Self-supervised pre-training & Cross-entropy loss ($-\log p_{\text{true}}$):** Hiding the next token in ordinary documents so any text becomes training data; cross-entropy measures how “surprised” the model was by the true next token.
  * **Neural scaling laws (Chinchilla, Hoffmann et al. 2022):** Empirical power laws $L(N,D) = E + A N^{-\alpha} + B D^{-\beta}$ showing that for a fixed FLOP budget $C \approx 6ND$, optimal performance requires scaling parameters $N$ and training tokens $D$ in tandem (~**20 tokens per parameter**).
* **Talking points:**
  * Three stages: **① Pre-training** (compress world patterns via next-token prediction on trillions of tokens), **② Post-training** (turn document-completion into a helpful assistant), **③ Reasoning RL** (practice step-by-step problem solving on verifiable math & code).
  * Right chart: why labs invested billions with confidence—error falls along a predictable curve! GPT-3 (175B weights, 300B tokens) was oversized for its data; **Chinchilla** (70B weights, 1.4T tokens—20 tokens/weight) outperformed it on the same compute budget. **`[→]` × 2** to sweep compute budgets from small lab runs to frontier clusters. **`[→]`**

---

#### 37 · From autocomplete to assistant… to your model (`#finetune`, 52:45–54:45)
* **Core point:** Post-training reshapes a base model’s weights from raw autocomplete into an aligned assistant, while **LoRA / QLoRA** lets any lab specialize a multi-billion-parameter open model on a single GPU.
* **Definitions:**
  * **SFT (Supervised Fine-Tuning) & Distillation:** Continuing next-token training on curated `(prompt, ideal response)` pairs (or matching a larger teacher model’s probability distributions in *knowledge distillation*).
  * **RLHF, DPO & RLAIF:** *Reinforcement Learning from Human Feedback* fits a **reward model** to human A-vs-B preference rankings and optimizes the LLM toward high reward with a KL-divergence “leash” so it doesn’t drift into gibberish (*DPO* optimizes preferences directly without a separate reward model; *RLAIF* uses a principle-guided AI judge).
  * **RLVR (RL with Verifiable Rewards):** Rewarding chains of thought using deterministic checkers (unit tests, symbolic math)—the engine behind modern “thinking” models.
  * **LoRA (Low-Rank Adaptation) & QLoRA:** Freezing the giant weight matrix $W_0 \in \mathbb{R}^{d\times k}$ and training a low-rank update $\Delta W = B A$ ($B \in \mathbb{R}^{d\times r}, A \in \mathbb{R}^{r\times k}$ with $r \ll d$, $B$ initialized to $0$). *QLoRA* compresses frozen $W_0$ to 4-bit precision while training LoRA adapters.
  * **RAG (Retrieval-Augmented Generation):** Fetching relevant lab documents/papers at query time and inserting them into the prompt—updating knowledge without touching weights.
* **Talking points:**
  * **Scene 1 (Post-training):** Look at raw base Gemma 3 given bare `"hi"`: its #1 prediction is a **comma (27.3%)**—it thinks it’s continuing `"hi, hope this email finds you well"`!
  * **`[→]` ① SFT** (imitate curated dialogues) → **`[→]` ② RLHF** (learn human preference on a KL leash) → **`[→]` ③ RLVR** (verify math & code) → **`[→]` ④ Assistant** (`"Hi"` **93.3%**—same 268M architecture, updated weight values; in 2022 people preferred 1.3B InstructGPT over raw 175B GPT-3!).
  * **`[→]` Scene 2 (Fine-tuning on your GPU):** Full Adam fine-tuning needs ~16 bytes/weight (**112 GB** for a 7B model—overflowing an 80 GB H100).
  * **`[→]` LoRA animation:** Freeze $W_0$ and factor $\Delta W = B \cdot A$ ($B=0$ at start so $\Delta W = 0$). On a $4096 \times 4096$ matrix at rank $r=8$, only **65,536** numbers train instead of **16.8 million (0.39%)**!
  * **`[→]` Memory fit:** Drops a 7B run from 112 GB → **~14 GB (LoRA)** → **~4 GB (4-bit QLoRA)**—fitting on a single workstation or gaming GPU (GPT-3’s LoRA adapter was 35 MB vs a 350 GB base model!).
  * **`[→]` Lab playbook:** Climb only as high as needed: **① Prompting → ② RAG → ③ LoRA/QLoRA on an open model → ④ Full fine-tune**. **`[→]`**

---

#### 38 · How a humble Transformer becomes an Agent (`#agents`, 54:45–57:15)
* **Core point:** There is no mysterious second brain inside the weights. An **Agent** is the *exact same next-token Transformer* placed inside a software `while` loop (a **harness**) with tool schemas, external execution, memory, and guardrails.
* **Definitions:**
  * **Tool use / Function calling:** Including JSON tool descriptions in the prompt and post-training the model (via SFT + RLVR, often with grammar-constrained decoding) to emit structured call tokens (`<call>`) instead of prose.
  * **MCP (Model Context Protocol):** Open standard (“USB-C for AI”) letting any model or harness plug into external tools, databases, browsers, or lab instruments.
  * **ReAct / Harness loop:** Ordinary software running `while not done`: decode tokens → pause GPU at a tool call → run the tool in the real world → append the observation to the context window → repeat.
  * **Prompt injection:** Untrusted instructions hidden inside web pages, emails, or logs that try to hijack an agent’s tool permissions—mitigated via sandboxing, least privilege, and human approval gates.
* **Talking points:**
  * **Opening (Plain Transformer):** Ask for the pH of $0.015\text{ M}$ acetic acid ($K_a = 1.8\times 10^{-5}$). With one forward pass and no tools, a language model can only guess from memorized text (`≈ 3.12`)—missing the exact quadratic result (`3.2918`).
  * **`[→]` 1 · Tool Use (Hands):** Put `[run_python]` in the prompt. Predicting `<call>` is *still* just next-token prediction (`p(x_t | x_<t)`), only now the token stream triggers a pause!
  * **`[→]` 2 · The Harness Loop (Reality Check):** The GPU pauses; CPU code runs Python outside the model. Watch Turn 1 catch a real `NameError: name 'math' is not defined`—the harness injects that error right back into the prompt!
  * **`[→]` 3 · Memory & Self-Correction:** Existing KV-cache prefixes stay warm. Seeing its own traceback in working memory, the Transformer fixes `import math`, re-runs, and observes `3.2918 ✓`. Longer-term memory comes from files, RAG, and `AGENTS.md`.
  * **`[→]` 4 · Grounding & Guardrails:** Flip to *Search & MCP* (grounding past cutoff dates) or *Plan & Gate* (human approval before file patches). **`[→]` 5 · Formula:** `Agent = Transformer + Tools + While-Loop + Memory`. *(Click **▶ The loop in 16 s** or press **K** for the Manim animation.)* **`[→]`**

---

### Chapter 7 · AI for science

#### 39 · The model zoo: same neuron, different wiring (`#archs`, 57:15–60:15)
* **Core point:** Every neural architecture uses the **exact same artificial neuron**—changing how neurons are wired encodes an **inductive bias**: a mathematical bet about the symmetry and geometry of your scientific data.
* **Definitions:**
  * **Inductive bias:** Structural assumptions built into a model’s wiring (locality, translation invariance, graph permutation symmetry) so it generalizes from realistic amounts of data.
  * **CNN (Convolutional Neural Network):** Slides a tiny shared weight kernel across spatial grids—reusing the same detector at every pixel (**translation equivariance**).
  * **RNN / LSTM (Long Short-Term Memory):** Processes sequences step by step while learned *input, forget, and output gates* regulate what stays in a running memory cell.
  * **GNN (Graph Neural Network):** Nodes (e.g., atoms) iteratively aggregate transformed vectors from bonded neighbours (**message passing**), respecting molecular/mesh symmetries.
  * **Diffusion model:** A generative paradigm trained to estimate clean signals (or noise scores) from corrupted inputs, creating samples by iteratively denoising pure Gaussian static.
  * **SSM (State Space Model, e.g., Mamba):** Updates a compact fixed-size hidden state selectively per token—scaling linearly $O(n)$ in sequence length vs $O(n^2)$ for full attention.
* **Talking points:**
  * *Opening 32 s film:* Watch the same neuron wired five ways: Dense, Convolution, Recurrence, Graph, and Attention. **`[→]`** *(or click **meet the zoo ▸**)*
  * **① CNN:** Real $3\times 3$ filter on Grace Hopper’s photo—**9 shared weights** reused across 4,526 positions (a dense layer would demand **21.7 million** weights!). Workhorse of microscopy (U-Net cell segmentation).
  * **`[→]` ② LSTM:** Gated sequential memory reading *“The keys to the cabinet…”*—remembers plural `"keys"` across the singular distractor `"cabinet"` to predict `"are"` (**98.4%**). Still powers Google’s global Flood Hub.
  * **`[→]` ③ GNN:** Message passing on **caffeine** (14 heavy atoms, 15 bonds; 6 hops for full molecular context). Scales to **GraphCast** (40,962-node global weather mesh) and **GNoME** (crystals).
  * **`[→]` ④ Transformer:** Data-dependent all-to-all routing (`"it"` → `"trophy"` 51.2%)—universal across modalities, at quadratic $O(n^2)$ length cost.
  * **`[→]` ⑤ Diffusion:** Watch 1,600 points condense out of pure static across 60 denoising steps—how **AlphaFold 3**, **RFdiffusion**, and **GenCast** generate 3D molecular coordinates and weather ensembles.
  * **`[→]` ⑥ Mamba (SSM):** Selective fixed-size 16-number memory—doubling sequence length costs **2×** work instead of attention’s **4×** (used in hybrid LLMs like RecurrentGemma, Jamba, Granite 4).
  * **`[→]` ⑦ Timeline & Field Guide:** **Match the wiring to the symmetry of your data** (grids → CNN/ViT; sequences → Transformer/SSM; molecules/meshes → GNN; 3D structures/ensembles → Diffusion; PDEs → Neural Operators; small tables → Trees). *(Extra Q&A tiles on rail: MLP, Autoencoder/PCA, GAN, Hopfield network, Fourier Neural Operator, KAN.)* **`[→]`**

---

#### 40 · AI ecosystem (`#science`, 60:15–62:45)
* **Core point:** Nothing on this slide needs new ingredients. The neurons, attention and gradient descent from tonight are being reassembled into **smaller and specialised** models, models that **simulate worlds**, and models that **act** in loops and teams. They are aimed at science and, some say, at superintelligence.
* **Definitions:**
  * **Small reasoning model:** A model with a few billion parameters or fewer that works through problems step by step. It usually learns this by **distillation** (a small *student* is trained to imitate a large *teacher*’s outputs), by **RLVR** (slide 37: rewards only for answers a checker can verify), or both.
  * **Domain-specific model:** A general foundation model given extra training on one field’s data (medical images, single-cell gene expression) so it speaks that field’s “language”.
  * **World model:** A learned simulator that predicts how a world changes when you act in it. A language model predicts the next word; a world model predicts the next moment. Agents can “imagine” an action before taking it, and robots can practise in generated worlds.
  * **Agent & tool use:** An agent is a model running in a loop: plan, act, observe, repeat. *Tool use* means the model writes a structured request (search this, run this code, click this button) that ordinary software carries out, then reads the result.
  * **Multi-agent system:** Several model instances with different roles (generator, critic, ranker, coordinator) working on one problem, often in parallel.
  * **Prompt injection:** Instructions hidden in content an agent reads (an email, a web page, a document) that try to take over the agent. The more access the agent has, the more dangerous this is.
  * **Superintelligence:** Bostrom’s definition: *“any intellect that greatly exceeds the cognitive performance of humans in virtually all domains of interest.”* It does not exist. Whether, when and how to build it is openly debated.
* **Talking points:**
  * *Frame:* “Three rows: what the **models** are becoming, what they now **do**, and where it might **lead**.”
  * **`[→]` ① Small reasoning models:** Reasoning is no longer just for giant models. DeepSeek-R1’s distilled **1.5 B** model scored **28.9%** on the AIME 2024 maths competition; GPT-4o (May 2024) scored **9.3%**. Gemma 4 runs on phones and laptops, and you choose how hard it thinks.
  * **`[→]` ② Domain-specific models:** Take a generalist and keep training it on one field. **MedGemma** reads medical images and text. **C2S-Scale 27B** (Google + Yale, built on Gemma 2) reads each cell as a “sentence” of gene names. It predicted that the drug silmitasertib plus low-dose interferon would make tumour cells more visible to the immune system (~50% more antigen presentation), and the prediction held up in living human cells.
  * **`[→]` ③ World models:** **Genie 4** turns a prompt into a world you can explore in real time, a safe rehearsal space for agents and robots.
  * **`[→]` ④ Agents & tool use:** This is slide 5’s harness at work. In **AlphaEvolve**, Gemini proposes code, automated evaluators score it and an evolutionary loop keeps the winners. It multiplied 4×4 complex matrices with **48** multiplications, one fewer than Strassen’s 1969 method. METR measures how long a task (in human time) agents can finish half the time; that length has doubled roughly every **7 months** (2019–2025).
  * **`[→]` ⑤ Multi-agent intelligence:** Divide the labour, like a lab group. In Google’s **AI co-scientist**, some agents generate hypotheses, others critique them, and a tournament ranks them. Several of its drug-repurposing suggestions for acute myeloid leukaemia inhibited cancer cells in lab tests. Coding tools now split one job across **hundreds** of parallel agents and check the results.
  * **`[→]` ⑥ OpenClaw & Grok Bot:** The newest wave is *always-on* agents. **OpenClaw** is free, open source and self-hosted, stewarded by a non-profit. You message it on WhatsApp or Telegram and it handles email, calendar and flights. **Grok Bot** (x.ai, launched August 2026) gives your bots a persistent cloud computer where they work 24/7 and hand tasks to each other. Both hold your logins, so one hidden line in an email can try to give them orders: **prompt injection**. Grant the fewest permissions possible.
  * **`[→]` ⑦ The molecules of life:** *Drag the protein:* green fluorescent protein (PDB **1EMA**). The green β-strands form a barrel around its glowing chromophore. **AlphaFold** has predicted **200M+** structures, free to all, and **AlphaFold 3** adds DNA, RNA and drug molecules. **AlphaGenome** reads **1 million** DNA letters at once and predicts how a single-letter change alters gene regulation.
  * **`[→]` ⑧ Matter & the planet:** **GNoME** (graph networks) found **2.2 million** new crystals, ~**380,000** of them predicted stable. **GenCast** (diffusion) beat the leading physics ensemble (ECMWF ENS) on **97.2%** of 1,320 forecast targets.
  * **`[→]` ⑨ Superintelligence:** Hypothetical and debated. Today’s AI is superhuman in narrow domains (its neighbours on this row), not in general. Meta Superintelligence Labs and Safe Superintelligence Inc. say it is their goal. In October 2025, Hinton, Bengio and many others signed a statement calling for a prohibition on developing it until there is broad scientific consensus that it can be done safely and controllably, and strong public buy-in.
  * **`[→]` Footer:** *“Same building blocks as tonight, reassembled.”* Bridge: *“So which of these should **your** lab reach for?”* **`[→]`**

---

#### 41 · Which AI should my lab use? (`#lab`, 62:45–63:45)
* **Core point:** Good scientific computing starts with the simplest baseline suited to your data’s geometry and sample size—and reuses pre-trained representations whenever data is unstructured.
* **Definitions:**
  * **Gradient-Boosted Decision Trees (XGBoost / LightGBM):** Ensembles of shallow decision trees trained sequentially to correct previous residuals—still the gold standard on small-to-medium tabular datasets.
  * **Transfer learning:** Starting from a foundation model pre-trained on millions/billions of examples and adapting it (via embeddings, probing, or LoRA) to your smaller lab dataset.
* **Talking points:**
  * **`[DEMO]`** *Invite an audience member’s real dataset and click through the 3 questions.*
  * Leave them with two rules: **① Tabular spreadsheets (<100k rows):** put the GPU down and run gradient-boosted trees + linear baselines first. **② Images, spectra, sequences, text, or molecules:** never train from scratch if a pre-trained foundation model exists—extract embeddings or fine-tune with LoRA. **`[→]`**

---

### Wrap-up

#### 42 · What AI still gets wrong (`#limits`, 63:45–65:15)
* **Core point:** Richard Feynman’s first rule of science—*“The first principle is that you must not fool yourself, and you are the easiest person to fool”*—is essential when working with probabilistic models.
* **Definitions:**
  * **Out-of-distribution (OOD) generalization:** How a model behaves on regimes absent from its training data—where statistical interpolators often fail silently.
  * **Data contamination:** When benchmark test questions accidentally appear in web-scale training sets, inflating scores via memorization rather than reasoning.
  * **Mechanistic interpretability:** Reverse-engineering trained weight matrices into human-understandable circuits and algorithms.
* **Talking points:**
  * **`[→]` ① Hallucination:** Next-token likelihood is not physical or factual truth—verify every reference, number, and proof.
  * **`[→]` ② Bias & OOD blind spots:** Models mirror where science has already looked (well-studied organisms and crystal families), not unexplored nature.
  * **`[→]` ③ Energy & cost** (4–5×/yr compute growth demands algorithmic & hardware efficiency) · **`[→]` ④ Evaluation & contamination** · **`[→]` ⑤ The interpretability black box** (we can inspect all 268M numbers yet still not know *why*—a wide-open frontier for scientists!) · **`[→]` ⑥ Safety, guardrails & SynthID watermarking**.
  * **Summary rule:** Treat AI like an encyclopedic, tireless, occasionally overconfident postdoc—collaborate ambitiously, and check every step of its work. **`[→]`**

---

#### 43 · The whole story in six equations (`#recap`, 65:15–66:15)
* **Core point:** Return to our opening question—*How does a pile of numbers decide to say “Hi there”?* Every symbol on this slide now corresponds to a concrete picture you have seen and manipulated tonight.
* **Talking points:**
  * Reveal each card deliberately and state its plain meaning:
  * **`[→]` ① Dense layer** ($\mathbf{a} = \sigma(W\mathbf{x} + \mathbf{b})$): *Take a weighted vote, shift by a bias, and bend space.*
  * **`[→]` ② Loss function** ($L = \frac{1}{N}\sum (\hat{y}_i - y_i)^2$, or cross-entropy for tokens): *Collapse how wrong you are into a single score.*
  * **`[→]` ③ Gradient descent** ($w \leftarrow w - \eta \frac{\partial L}{\partial w}$): *Feel the local slope and take a step downhill.*
  * **`[→]` ④ Backpropagation** ($\frac{\partial L}{\partial w} = \frac{\partial L}{\partial \hat{y}}\frac{\partial \hat{y}}{\partial z}\frac{\partial z}{\partial w}$): *Use the chain rule backward to compute millions of slopes in one pass.*
  * **`[→]` ⑤ Self-attention** ($\mathrm{softmax}(\frac{QK^\top}{\sqrt{d_k}})V$): *Let tokens dynamically look at other tokens to gather context.*
  * **`[→]` ⑥ Softmax** ($p_i = \frac{e^{z_i/T}}{\sum_j e^{z_j/T}}$): *Turn raw scores into probabilities and roll the die.*
  * **`[→]`** Read slowly: *“Multiply, bend, repeat. Measure the error, roll downhill, repeat.”* *(pause)* *“Then do it at an absurd scale.”* **`[→]`**

---

#### 44 · Keep exploring (`#qa`, 66:15+)
* **Talking points:**
  * Every interactive demo from tonight runs offline in a browser so you can poke at the weights, break gradient descent, and inspect Gemma’s attention heads yourself.
  * **Which model to choose for my task?** opens Hugging Face’s trending models list: filter by task (image segmentation, speech recognition, time-series forecasting…) and licence to find a pre-trained model to start from—slide 41’s transfer-learning rule in practice.
  * Grant Sanderson’s *3Blue1Brown* series and Brendan Bycroft’s 3D visualizer are wonderful next stops. Thank you—let’s open the floor for questions!

---

## 📖 Quick Glossary of Core Paradigms, Algorithms & Terms

| Term | Plain-English & rigorous definition |
|---|---|
| **Token & BPE** | A numbered text unit (word, sub-word, character) produced by Byte-Pair Encoding, which iteratively merges frequent character pairs into a fixed vocabulary (262,144 in Gemma 3). |
| **Tensor** | An $N$-dimensional array of numbers: scalar (0D), vector (1D), matrix (2D), image (3D), batch (4D). |
| **Artificial Neuron** | Computes $z = \mathbf{w}\cdot\mathbf{x} + b$, then applies a nonlinear activation $\hat{y} = \sigma(z)$—geometrically slicing input space with a hyperplane. |
| **Activation Function** | Element-wise nonlinear curve (Sigmoid, Tanh, ReLU, GELU) preventing stacked matrix multiplications from collapsing into a single linear matrix. |
| **Parameters (Weights & Biases)** | All learnable numbers inside a model ($268,098,176$ in Gemma 3 270M); weights scale connections, biases shift thresholds. |
| **Systolic Array (TPU)** | Hardware grid of Multiply-Accumulate (MAC) units that holds weights stationary while streaming inputs and partial sums between adjacent cells each clock cycle, slashing off-chip memory energy. |
| **Loss Function (MSE / Cross-Entropy)** | Scalar measure of prediction error minimized during training: Mean Squared Error averages $(\hat{y}-y)^2$ for continuous values; Cross-Entropy $-\log p_{\text{true}}$ measures surprise on discrete probabilities. |
| **Gradient Descent & Learning Rate ($\eta$)** | Iterative optimization rule $\theta \leftarrow \theta - \eta \nabla_\theta L$ that steps opposite the vector of partial derivatives; $\eta$ sets step size. |
| **Backpropagation** | Reverse-mode automatic differentiation applying the calculus chain rule from output loss back through each layer, computing all $N$ parameter gradients in ~2× the FLOPs of one forward pass. |
| **Embedding** | Learned lookup vector assigning each discrete token continuous coordinates ($d=640$ in Gemma 3) so semantic similarity maps to geometric proximity. |
| **Self-Attention (Q, K, V)** | Projects tokens into Queries, Keys, and Values; computes context-dependent routing weights $\mathrm{softmax}(QK^\top/\sqrt{d_k})$ to mix Value vectors across positions. |
| **Transformer** | Architecture alternating Multi-Head Self-Attention (inter-token routing) and Feed-Forward MLPs (per-token processing) with residual skip connections and normalization. |
| **Logits, Softmax & Temperature ($T$)** | Logits $z_i$ are raw final-layer scores; Softmax $\exp(z_i/T)/\sum_j \exp(z_j/T)$ converts them to probabilities; $T$ scales entropy/randomness. |
| **Mixture of Experts (MoE)** | Replaces a single dense MLP per layer with many expert MLPs plus a router activating only $k$ experts per token—scaling parameter memory without proportionally scaling FLOPs/token. |
| **Chinchilla Scaling Law** | Empirical power law showing compute-optimal pre-training scales model parameters $N$ and training tokens $D$ roughly equally (~20 tokens per parameter, $C \approx 6ND$). |
| **SFT, RLHF, DPO & RLVR** | Post-training stages: Supervised Fine-Tuning imitates curated responses; RLHF/DPO aligns outputs with human preference rankings under a KL leash; RLVR trains step-by-step reasoning against automated math/code verifiers. |
| **LoRA & QLoRA** | Parameter-Efficient Fine-Tuning (PEFT) that freezes $W_0$ (quantized to 4-bit in QLoRA) and learns a low-rank update $\Delta W = BA$ ($r \ll d$), cutting trainable parameters ~100–10,000× and fitting large models on one GPU. |
| **Inductive Bias** | Architectural assumptions matched to data symmetry: translation equivariance in **CNNs**, sequential gating in **LSTMs**, permutation-equivariant bond message passing in **GNNs**, iterative denoising in **Diffusion**, and linear-time selective state in **Mamba (SSMs)**. |
| **Distillation** | Training a small *student* model to reproduce a large *teacher* model’s outputs (or full probability distributions), transferring much of its skill at a fraction of the size and cost; a common way to make small reasoning models. |
| **World Model** | A learned simulator that predicts the next state of an environment from the current state and an action, so an agent can plan or practise “in imagination” (e.g., Genie). |
| **Agent, Tool Use & Multi-Agent Systems** | An agent runs a model in a loop: plan → emit a structured tool call (search, code, browser) → read the result → repeat. A multi-agent system splits one problem across several model instances with different roles (generate, critique, rank). |
| **Prompt Injection** | An attack in which instructions hidden in content an agent reads (emails, web pages, files) hijack its behaviour; the risk grows with the agent’s permissions. |
| **Superintelligence** | Hypothetical AI that “greatly exceeds the cognitive performance of humans in virtually all domains of interest” (Bostrom 2014); distinct from today’s *narrow* superhuman systems such as AlphaFold. |

---

## 🙋 Q&A Bank

* **“Does the model actually understand, or is it ‘just’ predicting the next token?”**
  Mechanically, its training objective is purely next-token probability estimation. Yet to predict the next token accurately across trillions of examples of code, physics, and logic, backpropagation forces its internal layers to build geometric representations—resolving pronouns, clustering chemical elements, tracking state. It has functional world-models without consciousness, feelings, or lived goals.
* **“Why does it hallucinate, and will scaling fix it?”**
  Softmax assigns probabilities over plausible continuations, not epistemic truth; when uncertain, fluent fabrication still scores well. Scale, retrieval (RAG), search, and code-execution verifiers drastically reduce hallucinations, but statistical generation has no native guarantee of truth—always verify critical facts and citations.
* **“Is it learning from me while we chat?”**
  No—during inference all weights $W$ are completely frozen. “Memory” inside a chat is just the text and KV cache sitting in the context window. If privacy matters, run open-weight models (like Gemma) locally so prompts never leave your machine.
* **“Why did tonight’s live demos use Gemma 3 instead of Gemini 4?”**
  Science requires inspecting the instrument! Gemma 3’s weights are open, letting us extract exact internal matrices, 640-D embeddings, validated attention maps, and full-vocabulary logits. Gemini uses the same Transformer principles (plus sparse MoE and native multimodality) at undisclosed frontier scale.
* **“Why do GPUs and TPUs beat CPUs so dramatically here?”**
  Nearly every heavy step—dense layers, Q/K/V projections, attention scores, MLPs—is matrix multiplication. GPUs run thousands of threads in parallel with Tensor Cores; TPUs hold weights inside systolic arrays and pass activations cell-to-cell so off-chip memory (which costs ~170× more energy per number than arithmetic) is touched as little as possible.
* **“Won’t gradient descent get trapped in local minima?”**
  In 2D cartoons, valleys look like closed bowls. In 268-million-dimensional space, almost every flat critical point is a *saddle point* with millions of downward escape directions, and mini-batch noise plus Adam’s momentum carry the trajectory into wide, low-loss basins.
* **“Why did ‘strawberry’ letter-counting trip up older models?”**
  Tokenization! In Gemma’s tokenizer, `"strawberry"` is a single integer (`#115137`), so the network never sees individual characters unless it spells them out token-by-token in a reasoning chain—which modern thinking models now do automatically.
* **“Is superintelligence coming? Should we be worried?”** *(Slide 39)*
  Nobody knows the timeline, and serious researchers disagree. What we can measure: narrow superhuman systems already exist (AlphaFold, GNoME), and the length of tasks agents can finish has doubled roughly every 7 months (METR, 2019–2025). Some labs say superintelligence is their goal; Hinton, Bengio and many others have called for a prohibition until there is broad scientific consensus that it can be done safely and controllably, and strong public buy-in. The scientist’s stance: follow the measurements, not the headlines.
* **“Should I run an always-on agent like OpenClaw on my own machine?”** *(Slide 39)*
  Treat it like handing a new intern your passwords. Run it in a separate account or container, grant the fewest permissions possible, require confirmation before payments, deletions or outgoing messages, and only install skills you trust: security researchers have reported internet-exposed installations and malicious add-on skills. And remember prompt injection: anything the agent reads can try to give it orders.

---

## 🔢 Verified Numbers Cheat Sheet (from `data/*.js` & `docs/facts.md`)

| Item | Exact value |
|---|---|
| **“hi” prompt (Gemma 3 270M IT)** | 10 templated tokens (`"hi"` = `#2202`, `"Hi"` = `#10979`) · Vocabulary = **262,144** tokens · `"Hi"` **93.26%**, `"Hello"` **6.31%**, `"How"` **0.37%** ($T=1$) |
| **Base vs Assistant “hi”** | Pretrained bare `"hi"` → `","` **27.3%**, `" all"` **8.9%**, `" guys"` **8.2%** · Post-trained assistant → `"Hi"` **93.3%** (same **268,098,176** parameters) |
| **Journey of “hi” (`#journey`)** | BPE encode = **6.8 µs** · PCIe in = **40 B**, out = **48 B** · 12 passes (1 prefill + 11 decode) read **6.4 GB** of bf16 weights · KV cache = **18 KB/token** |
| **Iris neuron (`#neuron`)** | 150 flowers, 3 species (*setosa* ~1.5×0.2 cm, *versicolor* ~4.3×1.3 cm, *virginica* ~5.6×2.0 cm) · Easy pair: **100/100** · Hard pair Adam: **94/100** (best line 97) |
| **Single neuron & 4-neuron layer** | $x=(0.9,0.2,0.6), w=(1.2,-0.8,0.5), b=-0.2 \Rightarrow 1.22 - 0.20 = 1.02 \Rightarrow \sigma(1.02) = \mathbf{0.73}$ · Layer outputs: **0.73, 0.58, 0.57, 0.33** |
| **Deep moon warp & Gemma weights** | Moon net = **21** parameters (**100%** accuracy) · Gemma 3 270M = **268,098,176** parameters (**63%** in embedding table; 18 layers × 4 query heads, $d=640$) |
| **Chips & energy (`#chips`)** | 48 MACs toy: CPU **12 ticks / 96 fetches** · GPU **3 / 96** · TPU **9 / 24** (first output **1.22**) · 45 nm energy: multiply **3.7 pJ** vs DRAM read **640 pJ (~170×)** · Pods: **8,960** (v5p), **9,216** (Ironwood) |
| **Kepler & gradient descent** | Best fit slope **$w = 1.498 \Rightarrow T^2 \propto a^3$** · $\eta=0.1$: ~181 steps · $\eta=0.6$: 27 steps (zig-zag) · $\eta=0.8$: diverges |
| **Backprop chain (`#v-backprop`)** | $x=2, w=0.5 \Rightarrow z=1.0, \hat{y}=0.731, L=0.0723$ · $\frac{\partial L}{\partial w} = (-0.538)(0.197)(2) = \mathbf{-0.2115}$ |
| **Embeddings & Attention** | Jupiter neighbours: *Saturn (.73), Venus (.71), Neptune (.69), Mars (.68), Titan, Pluto, Uranus, Zeus* · Analogies: **14/18** · L9H2 `"it"` → `"trophy"` **51.2%** vs `"suitcase"` **7.6%** · L17H3 sink: **~95%** on `<bos>` |
| **Compute & Scaling** | Growth: **4–5×/yr** (AlexNet $\approx 5\times 10^{17}$ → Llama 3.1 405B $\approx 4\times 10^{25}$ FLOP; Le Chonk 1T/52B active $\approx 1.3\times 10^{25}$) · $C \approx 6ND$ · Chinchilla optimum: **~20 tokens/parameter** |
| **LoRA & QLoRA (`#finetune`)** | $4096\times 4096$ ($16.8\text{M}$ weights), $r=8$: **65,536** trained (**0.39%**) · 7B memory: Full **112 GB**, LoRA **~14 GB**, QLoRA **~4 GB** · GPT-3 adapter: **35 MB** vs **350 GB** · QLoRA 65B on **one 48 GB GPU** |
| **Model zoo (`#archs`)** | Hopper $3\times 3$ CNN: **9** shared weights × **4,526** positions vs **21,724,800** dense · LSTM `"keys…are"` **98.4%** |
| **AI ecosystem (`#science`)** | R1-Distill-Qwen-**1.5B** AIME 2024 **28.9%** vs GPT-4o **9.3%** · C2S-Scale **27B**: ~**50%** more antigen presentation · AlphaEvolve **48** mults (Strassen **49**) · METR task length doubles every **~7 months** · Grok Build: **hundreds** of parallel agents · AlphaFold DB **200M+** · AlphaGenome **1M** bases · GNoME **2.2M** crystals (**380k** stable) · GenCast **97.2%** of **1,320** targets |
