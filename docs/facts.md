# Facts used on slides (with sources)

Status key: **✔ live** = I opened the source during the build (28 Oct 2026) · **✔ stable** = well-established, with a DOI/arXiv/Nobel source · **≈** = estimate, labelled as such on slides.

## State of AI, October 2026 (Google/DeepMind)
| Fact | Status | Source |
|---|---|---|
| Gemini 4 Argon: Google's flagship reasoning model. Large-scale sparse mixture-of-experts Transformer; natively multimodal (text, image, audio, video in); 1,048,576-token context; knowledge cutoff March 2026; trained on TPUs with JAX + ML Pathways; model card published October 2026 | ✔ live | https://deepmind.google/models/model-cards/gemini-4-argon/ · https://ai.google.dev/gemini-api/docs/models/gemini-4-argon |
| Gemini 3.x Flash line (3.5 → 3.8). Gemini 3.8 Flash = "our most intelligent Flash model … long-horizon software engineering, autonomous agents" | ✔ live | https://ai.google.dev/gemini-api/docs/models |
| DeepMind model families listed: Gemini, Gemini Omni ("create anything from anything"), Nano Banana (images), Gemini Audio, Veo (video with audio), Lyria (music), Genie 4 (interactive worlds), Gemini Robotics, Gemma (open models) | ✔ live | deepmind.google navigation (fetched with the Gemini 4 Argon model card) |
| Latest model cards: Gemini 4 Argon, Nano Banana 2.1, Gemini 3.8 Flash, Gemini Robotics On-Device 2, Gemini Robotics ER 2, Lyria 3.5 | ✔ live | https://deepmind.google/models/model-cards/gemini-4-argon/ |
| Gemma 4 exists as an open model with image and audio encoders (2B instruct preset checked locally) | ✔ local | keras-hub preset `gemma4_instruct_2b` |
| Gemini 3 thinking levels; temperature default 1.0 | ✔ live | https://ai.google.dev/gemini-api/docs/gemini-3 |
| Trends: reasoning/test-time compute (OpenAI o1 Sep 2024, DeepSeek-R1 Jan 2025, Gemini 2.5 Mar 2025); agents and computer use; open-weight models (Gemma, Llama, Qwen, DeepSeek, gpt-oss); native multimodality; 1M-token context since Gemini 1.5 (Feb 2024) | ✔ stable | arXiv 2501.12948; Gemini 2.5 report arXiv 2507.06261 |

## State of play additions, November 2026 (slide 5 `now`)
| Fact | Status | Source |
|---|---|---|
| Gemini API built-in tools: Google Search, Google Maps, Code Execution (writes and runs Python), URL Context, Computer Use ("view a screen and generate actions to interact with web browser UIs"), File Search (your own documents); custom tools via function calling; Gemini 4 and 3 can combine built-in and custom tools in one turn (preview) | ✔ live (opened 8 Nov 2026) | ai.google.dev/gemini-api/docs/tools |
| Gemma 4: Apache 2.0; sizes E2B, E4B, 12B, 26B A4B, 31B; up to 256K context; "configurable thinking modes"; native function calling; runs from high-end phones to laptops and servers. **26B A4B MoE: 25.2B total, 3.8B active parameters, experts "8 active / 128 total and 1 shared"** | ✔ live (opened 8 Nov 2026) | ai.google.dev/gemma/docs/core/model_card_4 |
| Fine-grained MoE in open models: Mistral Large 4 "Le Chonk" = 128 routed experts, 4 active + 1 shared (1T total / 52B active); frontier: Gemini 4 Argon is a "large-scale sparse mixture-of-experts Transformer" | ✔ live | HF model card mistralai/Mistral-Large-4-1T-A52B; Gemini 4 Argon model card (above) |
| Harness: Antigravity is Google's "agentic development platform"; the Antigravity SDK builds custom agents "leveraging Antigravity's harness". Gemini CLI: "An open-source AI agent that brings the power of Gemini directly into your terminal" (Apache 2.0, MCP servers supported) | ✔ live (opened 8 Nov 2026) | antigravity.google · github.com/google-gemini/gemini-cli |
| Agent benchmark results are reported together with their harness, e.g. Mistral Large 4's model card: "OpenCode harness, 4 rollouts per task", "mini-swe-agent harness" | ✔ live (opened 6 Nov 2026) | huggingface.co/mistralai/Mistral-Large-4-1T-A52B (eval results) |
| MCP: "an open-source standard for connecting AI applications to external systems … Think of MCP like a USB-C port for AI applications"; supported by Claude, ChatGPT, VS Code, Cursor and others; spec version 2026-07-28 | ✔ live (opened 8 Nov 2026) | modelcontextprotocol.io/docs/getting-started/intro |
| AGENTS.md: "A simple, open format for guiding coding agents, used by over 60k open-source projects"; "a README for agents"; works with Jules and Gemini CLI from Google, Codex, Cursor, VS Code and more; "now stewarded by the Agentic AI Foundation under the Linux Foundation" | ✔ live (opened 8 Nov 2026) | agents.md |
| Agentic AI Foundation (Linux Foundation) projects include MCP, AGENTS.md, Agent2Agent (A2A: "enables AI agents to communicate, collaborate, and securely exchange information and tasks") and goose | ✔ live (opened 8 Nov 2026) | aaif.io (Projects) |
| Cost per completed task: Mistral Large 4 scores 48 % on the Artificial Analysis Coding Agent Index, "effectively tied with the leading open-weight model, GLM-5.3, while using 47 % fewer tokens per task on average"; it offers low / medium / high reasoning modes | ✔ live (opened 6 Nov 2026) | mistral.ai/news/mistral-large-4-oss |
| Flagship naming: the Gemini API models page lists **Gemini 4 Argon** as "Our flagship reasoning model" (the only Gemini 4 model listed on 8 Nov 2026). The slide footnote was edited by the deck owner to read "Gemini 4 Carbon"; no public model card was found for that name (deepmind.google/models/model-cards/gemini-4-carbon returned 404) | ⚠ check | ai.google.dev/gemini-api/docs/models |

## Journey of "hi" (slide 10 `journey`): CPU ⇄ GPU inference pipeline
| Fact | Status | Source |
|---|---|---|
| "hi" with the Gemma chat template = 10 tokens [2, 105, 2364, 107, 2202, 106, 107, 105, 4368, 107] (40 bytes as 32-bit integers); full greedy reply = 11 tokens "Hi there! How can I help you today?↵" picked with p = 93.3, 97.9, 100, 99.5, 99.6, 100, 99.6, 100, 99.9, 100, 68.4 % (T = 1), then `<end_of_turn>` (id 106, ≈ 100 %) → 12 forward passes (1 prefill + 11 decode), 12 IDs back to the CPU (48 bytes) | ✔ local | `data/journey.js` (`make_journey.py`; first 10 tokens match `data/next_token.js`) |
| Gemma 3 270M: 268,098,176 parameters = 0.54 GB in bf16; 18 layers, hidden 640, 4 query heads, 1 KV head × 256 → KV cache 2 × 18 × 1 × 256 × 2 B = 18,432 B ≈ 18 KB per token (bf16 assumed); embedding table 262,144 × 640; a decode pass reads every weight once (12 passes ≈ 6.4 GB for this reply, before batching shares the reads) | ✔ local | keras-hub preset `config.json`; `data/journey.js`, `data/weights.js` |
| Gemma tokenizer = SentencePiece **BPE** with byte fallback, 262,144 pieces; encode time on one Intel Xeon @ 2.20 GHz core (sentencepiece 0.2.1, median): 6.8 µs for the templated "hi" (9 tokens), 3.0 ms for 1,401 tokens of the talk script | ✔ local | `data/journey.js` (`trainer_spec.model_type`; 3,000 / 1,000 timed runs) |
| Turn 2 ("What is a transformer?") = 35 tokens; the first 20 (turn 1's prompt + reply, trailing newline trimmed by the template) match what is already in the KV cache, 15 are new | ✔ local | `data/journey.js` |
| Gemma 1–3 instruction-tuned models "are designed to work with only two roles: user and model … the system role or a system turn is not" supported; "provide system-level instructions directly within the initial user prompt". Gemma 4: "native support for the system role" | ✔ live (opened 9 Nov 2026) | ai.google.dev/gemma/docs/core/prompt-structure (legacy Gemma 1–3 page); ai.google.dev/gemma/docs/core/model_card_4 |
| PCIe 6.0: "64.0 GT/s raw data rate and up to 256.0 GB/s via x16", double PCIe 5.0 (32.0 GT/s) → PCIe 5.0 ×16 ≈ 128 GB/s both ways ≈ 64 GB/s each way | ✔ live (opened 9 Nov 2026) | pcisig.com/pci-express-6.0-specification |
| GB200: one Grace CPU and two Blackwell GPUs connected "using the NVLink-C2C interconnect"; 372 GB HBM3E at 16 TB/s per superchip (≈ 8 TB/s per GPU) | ✔ live (opened 8 Nov 2026) | nvidia.com GB200 NVL72 page |
| Apple silicon: `MTLStorageMode.shared`: "The CPU and GPU share access to the resource, allocated in system memory"; the default for buffers on Apple silicon GPUs | ✔ live (opened 9 Nov 2026) | developer.apple.com/documentation/metal/mtlstoragemode/shared |
| llama.cpp server: OpenAI-compatible `/v1/chat/completions`; Jinja chat template "taken from model's metadata" (`--jinja`, on by default); `grammar` and `json_schema` "for grammar-based sampling"; `cache_prompt` (default true): "the common prefix does not have to be re-processed, only the suffix that differs" | ✔ live (opened 9 Nov 2026) | github.com/ggml-org/llama.cpp `tools/server/README.md` |
| vLLM automatic prefix caching: "we hash each kv-cache block by the tokens in the block and the tokens in the prefix before the block"; "We only cache full blocks"; "won't change model outputs". Structured outputs: XGrammar or guidance backends (default `auto`) | ✔ live (opened 9 Nov 2026) | vllm-project/vllm `docs/design/prefix_caching.md`, `docs/features/structured_outputs.md` |
| SGLang: "RadixAttention for KV cache reuse and compressed finite state machines for faster structured output decoding". XGrammar: grammar-constrained decoding, "overlap grammar computation with GPU executions" | ✔ stable | Zheng et al., arXiv:2312.07104; Dong et al., arXiv:2411.15100 |
| Gemini API (`generateContent`): a blocked prompt returns no candidates, only `promptFeedback.blockReason` (SAFETY, BLOCKLIST, PROHIBITED_CONTENT…); output `finishReason` SAFETY ("flagged for safety reasons") or SPII ("Token generation stopped because the content potentially contains Sensitive Personally Identifiable Information"); harm category JAILBREAK ("Prompts attempting to bypass or subvert the model's safety guidelines") | ✔ live (opened 9 Nov 2026) | ai.google.dev/api/generate-content |
| Where sampling runs: large serving engines sample on the accelerator; llama.cpp has traditionally copied the logits to host memory and sampled on the CPU (slide wording hedged: "has traditionally"). The CPU launches every decode step and receives each sampled ID (streaming, stop checks) | ✔ stable (hedged) | llama.cpp API (`llama_get_logits_ith` returns host memory); engine docs |
| NVIDIA Triton Inference Server: "open source inference serving software"; dynamic batching; "HTTP/REST and GRPC inference protocols"; examples for deploying "with Kubernetes and Helm on GCP, AWS…"; release 2.74.0 / 26.10 container | ✔ live (opened 8 Nov 2026) | github.com/triton-inference-server/server (README) |
| NVIDIA NIM: "prebuilt, optimized inference microservices … on any NVIDIA-accelerated infrastructure"; "industry-standard APIs" (OpenAI-style chat example with role/content messages); "scale seamlessly on Kubernetes"; engines TensorRT-LLM, vLLM or SGLang | ✔ live (opened 8 Nov 2026) | nvidia.com/en-us/ai-data-science/products/nim-microservices |
| Kubernetes: "a portable, extensible, open source platform for managing containerized workloads"; open-sourced by Google in 2014, combining "over 15 years of Google's experience running production workloads"; "You provide Kubernetes with a cluster of nodes" | ✔ live (opened 8 Nov 2026) | kubernetes.io/docs/concepts/overview |
| GKE: "full support for TPU node and node pool lifecycle management"; TPUs are Google's custom ASICs for ML; optical links and optical circuit switches (OCS) connect TPU cubes (4×4×4 chips) | ✔ live (opened 8 Nov 2026) | cloud.google.com/kubernetes-engine/docs/concepts/tpus |
| Borg is Google's cluster manager (Kubernetes's ancestor) | ✔ stable | Verma et al., "Large-scale cluster management at Google with Borg", EuroSys 2015, doi:10.1145/2741948.2741964; Burns et al., "Borg, Omega, and Kubernetes", ACM Queue 2016 |
| Chat templates: "All causal LMs, whether chat-trained or not, continue a sequence of tokens"; role/content messages "get converted to a token sequence, often with control tokens"; `apply_chat_template` does the formatting | ✔ live (opened 8 Nov 2026) | huggingface.co/docs/transformers/chat_templating |
| Bare "hi" into the pretrained model (no template) = [2, 2202] → "," 27.30 % · " all" 8.91 % · " guys" 8.23 % (Q&A: skipping the template) | ✔ local | `data/next_token.js` (prompt `hi_pt`) |
| Gemma IT models are "trained with a specific formatter" used "both at training and inference time"; control tokens `<start_of_turn>` / `<end_of_turn>` are reserved in the tokenizer; prompt prefix `<start_of_turn>model\n` | ✔ live (opened 8 Nov 2026) | ai.google.dev/gemma/docs/core/prompt-structure |
| Gemini API request = JSON: `{"model": …, "input": "How does AI work?"}` plus optional `system_instruction`, POST to …/v1beta/interactions; streaming supported | ✔ live (opened 8 Nov 2026) | ai.google.dev/gemini-api/docs/text-generation |
| Gemini API safety: adjustable filters per harm category (default Off for Gemini 2.5+); blocked input or output fails with HTTP 400 and an error `code`: `safety` (input or response) or `jailbreak` / `prohibited_content` / `blocklist` (input; message starts "Input blocked:"); "protections against core harms, such as content that endangers child safety … are always blocked and cannot be adjusted" | ✔ live (re-opened 9 Nov 2026) | ai.google.dev/gemini-api/docs/safety-settings |
| ShieldGemma: open-weight models "for evaluating the safety of text and images against a set of defined safety policies", for prompt input and output; ShieldGemma 1 = 2B/9B/27B (Gemma 2), ShieldGemma 2 = 4B images | ✔ live (opened 8 Nov 2026) | ai.google.dev/gemma/docs/shieldgemma |

## History
| Year | Milestone | Source |
|---|---|---|
| 1943 | McCulloch & Pitts: logical model of a neuron | doi:10.1007/BF02478259 |
| 1950 | Turing, "Computing Machinery and Intelligence" (the imitation game) | doi:10.1093/mind/LIX.236.433 |
| 1956 | Dartmouth workshop; "artificial intelligence" coined in the 1955 proposal | Wikipedia: Dartmouth workshop |
| 1958 | Rosenblatt's perceptron (Psychological Review) | doi:10.1037/h0042519 |
| 1969 | Minsky & Papert, *Perceptrons*; neural-net funding dries up | MIT Press |
| 1973 | Lighthill report → first "AI winter" (UK) | Wikipedia: Lighthill report |
| 1986 | Rumelhart, Hinton & Williams popularise backpropagation (Nature 323:533) | doi:10.1038/323533a0 |
| 1989 | LeCun: convolutional nets read handwritten zip codes | doi:10.1162/neco.1989.1.4.541 |
| 1997 | LSTM (Hochreiter & Schmidhuber); Deep Blue beats Kasparov (11 May) | doi:10.1162/neco.1997.9.8.1735 |
| 2009 | ImageNet (Deng et al., CVPR) | doi:10.1109/CVPR.2009.5206848 |
| 2012 | AlexNet wins ImageNet: 15.3% top-5 error vs 26.2% for the runner-up | image-net.org ILSVRC 2012 results |
| 2013 | word2vec | arXiv 1301.3781 |
| 2014 | GANs | arXiv 1406.2661 |
| 2016 | AlphaGo beats Lee Sedol 4–1 (March) | Wikipedia: AlphaGo versus Lee Sedol |
| 2017 | "Attention Is All You Need": the Transformer (June) | arXiv 1706.03762 |
| 2018 | BERT | arXiv 1810.04805 |
| 2020 | GPT-3 (175B); AlphaFold 2 at CASP14 (median GDT 92.4) | arXiv 2005.14165; doi:10.1038/s41586-021-03819-2 |
| 2022 | ChatGPT (30 Nov) | openai.com |
| 2023 | Gemini 1.0 (6 Dec) | blog.google |
| 2024 | Nobel prizes in Physics and Chemistry for AI work; AlphaProof + AlphaGeometry 2: IMO silver | nobelprize.org; deepmind.google |
| 2025 | Gemini 2.5 "thinking" models (Mar); Gemini Deep Think: IMO gold-medal standard (Jul, 35/42); Gemini 3 (Nov) | deepmind.google; blog.google |
| 2026 | Gemini 4 Argon (October model card) | deepmind.google model card |

## Nobel 2024 (exact citations) ✔ stable
* **Physics:** John J. Hopfield and Geoffrey E. Hinton, "for foundational discoveries and inventions that enable machine learning with artificial neural networks".
* **Chemistry:** David Baker, "for computational protein design"; Demis Hassabis and John M. Jumper, "for protein structure prediction".

## AI for Science ✔ stable
| Fact | Source |
|---|---|
| AlphaFold DB: 200M+ predicted structures (with EMBL-EBI) | https://alphafold.ebi.ac.uk/ |
| AlphaFold 3 (Nature, May 2024): proteins with DNA, RNA, ligands, ions | doi:10.1038/s41586-024-07487-w |
| GNoME (Nature, Nov 2023): 2.2 million new crystals, ~380,000 most stable | doi:10.1038/s41586-023-06735-9 |
| GenCast (Nature, Dec 2024): 15-day ensemble forecasts; beat ECMWF ENS on 97.2% of 1,320 targets | doi:10.1038/s41586-024-08252-9 |
| AlphaEvolve (May 2025): 4×4 complex matrix multiplication in 48 multiplications; recovers ~0.7% of Google's fleet compute | deepmind.google blog (AlphaEvolve) |
| AI co-scientist (Feb 2025): multi-agent Gemini system generating testable hypotheses | research.google blog |
| AlphaGenome (Jun 2025): reads up to 1M DNA letters, predicts regulatory effects | deepmind.google blog |
| Tokamak plasma control with deep RL (Nature, Feb 2022) | doi:10.1038/s41586-021-04301-9 |

## Numbers
| Fact | Status | Source |
|---|---|---|
| Training compute of notable/frontier models grows ~4–5× per year (since 2010) | ✔ stable | epoch.ai blog |
| Training FLOPs ≈ 6·N·D | ✔ stable | Kaplan et al. 2020, arXiv 2001.08361 |
| GPT-3: 175B params, 3.14×10²³ FLOP | ✔ stable | arXiv 2005.14165 |
| Chinchilla: 70B params, 1.4T tokens (~20 tokens/param), 5.76×10²³ FLOP | ✔ stable | arXiv 2203.15556 |
| Chinchilla loss fit used on the slide (Besiroglu et al. 2024 refit): E=1.8172, A=482.01, B=2085.43, α=0.3478, β=0.3658 → ~20 tokens/param at the optimum | ≈ (memory + consistency check) | arXiv 2404.10102 |
| Gemma 3 270M: 268,098,176 parameters; 262,144-token vocabulary | ✔ local | measured from the cached model |
| AlexNet ~60M params; GPT-2 1.5B; PaLM 540B | ✔ stable | papers |
| Mistral Large 4 = "Le Chonk" (Mistral AI): "Unofficially ML4, very officially: le Chonk"; public preview 6 Oct 2026, open weights 29 Oct 2026; 1T total / 52B active parameters (49B excluding embeddings and output layers); mixture-of-experts with 128 routed experts (4 active per token) + 1 shared expert | ✔ live (opened 6 Nov 2026) | mistral.ai/news/mistral-large-4 · mistral.ai/news/mistral-large-4-oss · huggingface.co/mistralai/Mistral-Large-4-1T-A52B (model card) |
| Le Chonk pretraining: 3,840 NVIDIA GB200 GPUs near Paris, 45 days, "about 4.15 million GPU-hours", MFU 36 % measured "against peak hardware BF16 FLOP/s", goodput 94.1 % (the launch post rounds to "3,800 NVIDIA Grace Blackwell GPUs"); training token count not given | ✔ live (opened 6 Nov 2026) | Mistral Large 4 technical report §2.3, alphaxiv.org/abs/2611.mistral-large-4 |
| GB200 peak BF16: 10 PFLOPS per Grace Blackwell superchip (2 GPUs), quoted with sparsity; "Dense is one-half sparse spec shown" → 2.5 PFLOPS per GPU | ✔ live (opened 6 Nov 2026) | nvidia.com/en-us/data-center/gb200-nvl72 (spec table, footnote 2) |
| ⇒ Le Chonk pretraining compute ≈ 4.15×10⁶ GPU-h × 3,600 s × 2.5×10¹⁵ FLOP/s × 0.36 × 0.941 ≈ **1.3×10²⁵ FLOP**, about ⅓ of Llama 3.1 405B's reported 3.8×10²⁵ (hollow dot on `whynow`) | ≈ derived | the two rows above; `src/python/make_compute.py` |

## Stack, tokenizer & demo numbers (added by the deck owner)
| Fact | Status | Source |
|---|---|---|
| Gemini 2.5 was trained on TPU v5p, data-parallel across multiple 8,960-chip pods (stack slide: "pods of 8,960 TPU chips") | ✔ live (re-opened 5 Nov 2026: "the first to be trained on TPUv5p … multiple 8960-chip pods") | Gemini 2.5 technical report, arXiv 2507.06261 (§2.3 Training Infrastructure) |
| Gemma 3 uses the same SentencePiece tokenizer as Gemini 2.0 | ✔ stable | Gemma 3 technical report, arXiv 2503.19786 |
| Token IDs: "hi" 2202, "Hi" 10979, " hi" 5631, "The" 818, "strawberry" 115137 (one token); digits split one per token ("9.11" → 9 . 1 1); "🦘" → 4 byte tokens | ✔ local | `src/python/build_tokens.py` → `data/tokens.js` |
| Chat template for "hi" = 10 tokens; first-word probabilities Hi 93.26 % / Hello 6.31 % / How 0.37 % | ✔ local | `data/next_token.js` (checked by `src/python/check_data.js`) |
| Iris neuron "let it learn" (Adam, same code as the demo): easy pair 100/100, hard pair 94/100; best possible linear 97/100 | ✔ local | node re-run of the demo maths (build log) |
| Kepler least squares in log-log: w = 1.4978, b ≈ 0.000, L = 1.4×10⁻⁶; gradient descent from (0.2, 1.2): η = 0.1 converges in 181 steps, 0.6 in 27 (zig-zag), 0.8 diverges | ✔ local | node re-run of the demo maths |
| Playground default (spiral, 2×6 tanh, η = 0.03, seed 9): 95 % accuracy after ~720 epochs; XOR with one hidden neuron stalls at ~63 % | ✔ local | node re-run of `js/lib/nn.js` |

## GPUs & TPUs (slide 18 `chips`, sources opened 5 Nov 2026)
| Fact | Status | Source |
|---|---|---|
| CPU → GPU → TPU story: a CPU loads values from memory, computes and stores the result back for every calculation (the von Neumann bottleneck); GPUs have thousands of ALUs but still read registers/shared memory for every calculation; a TPU loads the parameters into the MXU, then streams data through multiply-accumulators wired to each other, with "no memory access … during the matrix multiplication process" | ✔ live | Google Cloud, "TPU architecture" (docs.cloud.google.com/tpu/docs/system-architecture-tpu-vm) |
| MXU = 128 × 128 multiply-accumulators in a systolic array (TPU v5p and earlier; 256 × 256 on v6e and TPU7x); each 128 × 128 MXU does 16K multiply-accumulates per cycle; a TensorCore has MXUs + a vector unit + a scalar unit | ✔ live | same page |
| TPU v5p: 2 TensorCores per chip, 4 MXUs per TensorCore (→ 8 MXUs = 131,072 multiply-adds per tick); 459 TFLOP/s BF16 per chip; 95 GiB HBM (96 physical) at 2,765 GB/s; 8,960 chips per pod in a 3D torus | ✔ live | docs.cloud.google.com/tpu/docs/v5p |
| "≈ 1.75 billion ticks a second" (slide zoom card) = 459×10¹² FLOP/s ÷ (2 FLOP per multiply-add × 131,072 multiply-adds per tick) | ✔ arithmetic from the two rows above | — |
| Ironwood (TPU7x, 2025): 9,216 chips per pod; 4,614 FP8 / 2,307 BF16 TFLOP/s and 192 GiB HBM at 7.38 TB/s per chip (→ ≈ 42.5 FP8 exaFLOP/s per pod) | ✔ live | docs.cloud.google.com/tpu/docs/tpu7x |
| First TPU: in Google's datacentres since 2015; a 65,536-MAC (256 × 256) 8-bit matrix unit, 92 TOPS; 15–30× faster and 30–80× better TOPS/W than its contemporary CPU/GPU on inference | ✔ live | Jouppi et al., ISCA 2017, arXiv 1704.04760 (abstract) |
| NVIDIA H100 SXM5: 132 SMs, 16,896 FP32 CUDA cores, 528 Tensor Cores, 80 GB HBM3 at > 3 TB/s; its 50 MB L2 cache exists to cut "trips to DRAM" | ✔ live | NVIDIA Technical Blog, "NVIDIA Hopper Architecture In-Depth" |
| AlexNet trained for five to six days on two GTX 580 3 GB gaming GPUs | ✔ stable | Krizhevsky, Sutskever & Hinton, NeurIPS 2012 |
| Energy at 45 nm: 32-bit float multiply 3.7 pJ, 32-bit on-chip SRAM read 5 pJ, 32-bit off-chip DRAM read 640 pJ (640 / 3.7 ≈ 173 → "≈ 170 multiplications") | ✔ live | Han et al., arXiv 1506.02626, Fig. 1, citing Horowitz, ISSCC 2014 |
| Systolic arrays: H. T. Kung & C. E. Leiserson (1978); the name is from the heart's systole, data pumped rhythmically from cell to cell | ✔ stable | Kung, "Why systolic architectures?", IEEE Computer 15(1), 1982, doi:10.1109/MC.1982.1653825 |
| Toy numbers on the slide (4 tokens, the `layer` slide's W): 48 multiply-adds. CPU (4 cores): 12 ticks, 96 fetches · GPU (16 cores): 3 ticks, 96 fetches · TPU (4 × 3 weight-stationary array): 9 ticks of multiply-adds, 24 fetches (12 weights once + 12 inputs once); first result = 1.22 (same as the `layer` slide before bias) | ✔ local | `js/demos/chips.js` timelines (counted by the demo itself) |
| Gemma 3 270M ≈ 268 million multiply-adds per token: one per weight in the forward pass (the tied 640 × 262,144 embedding is used once as the output layer) | ≈ (2·N FLOP per token rule, ignoring attention-score terms) | Kaplan et al. 2020, arXiv 2001.08361; parameter count above |

## Post-training & fine-tuning (slide 37 `finetune`, sources opened 4 Nov 2026)
| Fact | Status | Source |
|---|---|---|
| Base vs instruct “hi” (Gemma 3 270M): pretrained, bare “hi” → “,” 27.30 % · “ all” 8.91 % · “ guys” 8.23 %; instruct with chat template → “Hi” 93.26 % · “Hello” 6.31 % | ✔ local | `data/next_token.js` (prompts `hi_pt` and `hi`) |
| SFT on labeler demonstrations, then RLHF from rankings of model outputs; people preferred the 1.3B InstructGPT to the 175B GPT-3 (100× fewer parameters) | ✔ live | InstructGPT, arXiv 2203.02155 (abstract) |
| RLHF = fit a reward model to human preferences, then RL to maximise it “without drifting too far from the original model” (the KL leash); DPO solves the same objective with a simple classification loss, no reward model or sampling | ✔ live | DPO, arXiv 2305.18290 (abstract) |
| RLAIF: an AI compares two samples using a written list of principles (a “constitution”); the resulting preference model is the RL reward | ✔ live | Constitutional AI, arXiv 2212.08073 (abstract) |
| “Reinforcement Learning with Verifiable Rewards (RLVR)” named and used alongside SFT and DPO | ✔ live | Tülu 3, arXiv 2411.15124 (abstract) |
| Gemma 3: “All Gemma 3 models are trained with knowledge distillation”; post-training = distillation from a large instruction-tuned teacher + RL with human-feedback reward models, code-execution feedback and ground-truth maths rewards | ✔ live | Gemma 3 report, arXiv 2503.19786 (§1, §4) |
| Full fine-tuning: Adam in 16-bit mixed precision needs ~16 bytes per parameter for weights, gradients and optimiser states (“a trillion-parameter model … ~16 TB”) → 7B × 16 B ≈ 112 GB, before activations | ✔ live + arithmetic | ZeRO, arXiv 1910.02054 (§1, §3) |
| LoRA freezes the pretrained weights and trains low-rank matrices; vs. GPT-3 175B fine-tuned with Adam: 10,000× fewer trainable parameters, 3× less GPU memory, no extra inference latency | ✔ live | LoRA, arXiv 2106.09685 (abstract) |
| Slide example: one 4096 × 4096 layer = 16,777,216 weights; LoRA rank 8 trains 2 × 4096 × 8 = 65,536 (0.39 %) | ✔ arithmetic | — |
| QLoRA: gradients flow through a frozen 4-bit base model into LoRA adapters; fine-tunes a 65B model on a single 48 GB GPU | ✔ live | QLoRA, arXiv 2305.14314 (abstract) |
| Adapters: small trainable modules added to a frozen network (3.6 % extra parameters per task on GLUE) | ✔ live | Houlsby et al., arXiv 1902.00751 (abstract) |
| Prompt tuning: learned “soft prompts” condition a frozen model | ✔ live | Lester et al., arXiv 2104.08691 (abstract) |
| Distillation: a student trained to match a teacher's soft predictions | ✔ stable | Hinton et al. 2015, arXiv 1503.02531 |
| RAG: retrieval-augmented generation (retrieved passages condition the generator) | ✔ live | Lewis et al., arXiv 2005.11401 (abstract) |

**Reimagined slide + m08 clip (sources opened 9 Nov 2026)**

| Fact | Status | Source |
|---|---|---|
| Top-5 next-token shares: base “hi” 57.1 % → the other 262,139 tokens share 42.9 %; assistant top-5 > 99.9 % → the rest < 0.1 % (full-vocabulary probabilities from logits and log-sum-exp at T = 1) | ✔ local | `data/next_token.js` (computed live by `js/demos/finetune.js`) |
| Base and instruction-tuned Gemma 3 270M share the architecture and the 268,098,176-parameter count; only the weight values differ | ✔ local | parameter count above; same keras-hub architecture for both presets |
| LoRA: W₀ + ΔW = W₀ + BA with B ∈ ℝ^{d×r}, A ∈ ℝ^{r×k}, r ≪ min(d, k); W₀ frozen; forward pass h = W₀x + BAx; “random Gaussian initialization for A and zero for B, so ΔW = BA is zero at the beginning of training”; ΔWx scaled by α/r | ✔ live | LoRA, arXiv 2106.09685 v2, §4.1 (eq. 3) |
| LoRA on GPT-3 175B: training VRAM 1.2 TB → 350 GB; with r = 4 on W_q and W_v the checkpoint shrinks ~10,000× (350 GB → 35 MB); trained matrices can be merged into W, so no extra inference latency | ✔ live | LoRA §4.2 and §1 |
| GPT-3 ranks tested r = 1, 2, 4, 8, 64; “a rank as small as one suffices for adapting both W_q and W_v” on WikiSQL and MultiNLI (73.4 vs 73.5 and 91.3 vs 91.4 for r = 1 vs 64); authors do not expect small r to work for every task | ✔ live | LoRA §7.2, Table 6 |
| Rank slider arithmetic for d = k = 4096: trainable = r(d + k) = 8,192 r; share = r / 2048; break-even (100 %) at r = 2048 | ✔ arithmetic | — |
| QLoRA: “reduces the average memory requirements of finetuning a 65B parameter model from > 780GB of GPU memory to < 48GB” | ✔ live | QLoRA, arXiv 2305.14314, §1 |
| QLoRA double quantization: quantization constants cost 8/64 + 32/(64·256) = 0.127 bits per parameter (block size 64) | ✔ live | QLoRA §2 (Double Quantization) |
| “Will it fit?” bars, 7 B model, weights + training state before activations: full fine-tuning 7 × 16 = 112 GB; LoRA ≈ 7 × 2 B (16-bit frozen weights) = 14 GB + adapter at r = 8 (Llama-7B shapes: ≈ 4–20 M params × 16 B ≈ 0.07–0.3 GB) ≈ 14 GB; QLoRA ≈ 7 × (4 + 0.127) / 8 = 3.6 GB + adapter ≈ 4 GB | ≈ arithmetic | ZeRO (16 B/param), QLoRA §2 (4-bit + 0.127 bits), LoRA §4.2 (no optimiser state for frozen weights) |
| GPU memory lines: NVIDIA GeForce RTX 5090 = 32 GB GDDR7 (“gaming GPU”); H100 = 80 GB (row above) | ✔ live | nvidia.com RTX 5090 specifications |
| File-size receipt drawn by area: 35 MB / 350 GB = 10⁻⁴ of the 64 × 64 px square → a 0.64 px dot; drawn as 1 px (the smallest possible), i.e. slightly too big | ✔ arithmetic | — |
| m08 clip toy example: b = (1, 2, −1, 3, −2, 1), a = (2, −1, 3, 1, −2, 1), ΔW = b aᵀ (rank 1, asserted in the script); ΔW₄₃ = 3 × 3 = 9; 36 numbers described by 6 + 6 = 12 | ✔ arithmetic | `src/manim/m08_lora.py` |

## The model zoo (slide 38 `archs`, sources opened 9 Nov 2026)
Status key as above. Live demos compute their own numbers in `js/demos/archs.js`; the film is `src/manim/m08_wiring.py`.

| Fact | Status | Source |
|---|---|---|
| Film: one neuron wired five ways (dense 6 → 4 = 24 weights; valid 1-D convolution = 3 shared weights; recurrent influence fading as 0.6^(t−s); phenol adjacency + self-loops; attention row-softmax of hand-set scores, labelled “illustrative numbers”) | ✔ local | `src/manim/m08_wiring.py` (asserts) |
| CNN demo: valid 3 × 3 convolution of the 64 × 75 Grace Hopper photo → 62 × 73 = **4,526** positions sharing **9** weights; a dense layer between the same sizes needs 4,800 × 4,526 = **21,724,800** | ✔ arithmetic | `data/hopper.js`; computed live |
| Kernels shown are hand-set (Sobel x/y, box blur, sharpen), applied as cross-correlation, which is what deep-learning libraries call convolution; trained CNNs learn edge-like first-layer filters | ✔ stable | Krizhevsky et al. 2012 (Fig. 3); Zeiler & Fergus 2014, arXiv 1311.2901 |
| LeNet-style convolutional nets read zip codes (1989); AlexNet (2012); ResNet residual connections (2015); U-Net, built for biomedical (cell) segmentation (2015) | ✔ stable | doi:10.1162/neco.1989.1.4.541; NeurIPS 2012; arXiv 1512.03385; arXiv 1505.04597 |
| LSTM (Hochreiter & Schmidhuber 1997): cell state c_t = f ⊙ c_{t−1} + i ⊙ c̃, h_t = o ⊙ tanh(c_t) | ✔ stable | doi:10.1162/neco.1997.9.8.1735 |
| LSTM demo: real LSTM equations, **hand-set** weights, 3 cells (plural, singular, side phrase). “The keys to the cabinet …” → p(are) = **98.4 %**; “The key to the cabinets …” → p(is) = 98.4 %. Gates at “keys”: f 0.993, i 0.953, o 0.018; at “cabinet”: i 0.029 (blocked); at the verb: o 0.982 | ✔ local | `js/demos/archs.js` (node re-run, build log) |
| “The keys to the cabinet …” is the classic agreement-attraction test used to probe LSTMs | ✔ live | Linzen, Dupoux & Goldberg 2016, arXiv 1611.01368 (TACL) |
| Trained LSTM language models develop “number units” and “syntax units” that gate them (the slide's “trained LSTMs grow units like these”) | ✔ stable | Lakretz et al. 2019, arXiv 1903.07435 |
| Google Neural Machine Translation (2016): deep LSTM network, 8 encoder + 8 decoder layers, attention | ✔ live | Wu et al. 2016, arXiv 1609.08144 |
| Google Flood Hub's model is an LSTM (hindcast + forecast LSTMs, mixture-density head), forecasting floods in ungauged basins | ✔ live | Nearing et al., Nature 627, 559 (2024), doi:10.1038/s41586-024-07145-1 |
| GNN model (Scarselli et al. 2009); message passing for chemistry (Gilmer et al. 2017, Google) | ✔ stable | doi:10.1109/TNN.2008.2005605; arXiv 1704.01212 |
| GNN demo: caffeine (1,3,7-trimethylxanthine) heavy-atom graph, 14 atoms, 15 bonds (C2=O, C6=O, C4=C5, C8=N9 double); the N7 methyl reaches every atom after **6** rounds (graph eccentricity); after k rounds an atom has heard from everything within k bonds (receptive field = non-zero pattern of (A + I)^k) | ✔ arithmetic | PubChem CID 2519 (structure); BFS in `js/demos/archs.js` |
| GraphCast (Science, 2023): encoder–processor–decoder GNN, **16** message-passing layers on an icosahedral multi-mesh whose finest level has **40,962** nodes | ✔ live | Lam et al. 2023, doi:10.1126/science.adi2336; arXiv 2212.12794 |
| GNoME = “Graph Networks for Materials Exploration” (Nature, 2023): 2.2 M new crystals, ~380,000 stable | ✔ live | doi:10.1038/s41586-023-06735-9 |
| Google Maps ETA prediction with graph neural networks (DeepMind + Google Maps) | ✔ live | Derrow-Pinion et al. 2021, arXiv 2108.11482 (CIKM) |
| Transformer demo: real Gemma 3 270M attention. Layer 9 head 2, “it” → “trophy” **51.2 %** (“suitcase” 7.6 %); layer 3 head 3, second “degrees” → first “degrees” 77.6 %; layer 2 head 3, “it” → previous token 78.3 % | ✔ local | `data/attention.js` (validated, see Attention section) |
| Vision Transformer (2020); AlphaFold 2's Evoformer is attention-based | ✔ stable | arXiv 2010.11929; doi:10.1038/s41586-021-03819-2 |
| Diffusion: Sohl-Dickstein et al. 2015; DDPM (Ho et al. 2020); DDIM deterministic sampler; cosine schedule (Nichol & Dhariwal 2021) | ✔ stable | arXiv 1503.03585; arXiv 2006.11239; arXiv 2010.02502; arXiv 2102.09672 |
| Diffusion demo: 1,600 samples, 60 DDIM steps, data = mixture of 120 Gaussians (σ = 0.06) on two spiral arms; the denoiser E[x₀ \| x_t] is computed **exactly** for this mixture (a trained network approximates it for real data) | ✔ local | `js/demos/archs.js` (node re-run: median distance of samples to the nearest component 0.065) |
| “Diffusion Models Beat GANs on Image Synthesis” (2021) | ✔ live | Dhariwal & Nichol, arXiv 2105.05233 |
| AlphaFold 3 replaces the structure module with a diffusion module that works on raw atom coordinates | ✔ live | Abramson et al., Nature 2024, doi:10.1038/s41586-024-07487-w |
| GenCast is a conditional diffusion model (graph-transformer denoiser on a 6× refined icosahedral mesh) for 15-day ensembles | ✔ live | Price et al., Nature 2024, doi:10.1038/s41586-024-08252-9 |
| RFdiffusion designs proteins with diffusion (Baker lab) | ✔ stable | Watson et al., Nature 620, 1089 (2023) |
| Imagen is a text-to-image diffusion model (2022); Veo 3 is a latent diffusion model (model card); Gemini Diffusion: experimental text diffusion model announced at Google I/O, 20 May 2025 | ✔ live | arXiv 2205.11487; Veo 3 model card (storage.googleapis.com, deepmind-media); deepmind.google/models/gemini-diffusion |
| Mamba (Dec 2023): selective SSM, parameters depend on the input; linear scaling in sequence length; 5× inference throughput vs Transformers (paper's claim) | ✔ live | Gu & Dao, arXiv 2312.00752 (abstract) |
| S4 (2021) structured state spaces | ✔ stable | Gu et al., arXiv 2111.00396 |
| Griffin = gated linear recurrences + local attention; RecurrentGemma is built on Griffin (fixed-size state instead of a growing KV cache) | ✔ live | De et al. 2024, arXiv 2402.19427; RecurrentGemma, arXiv 2404.07839 |
| Hybrid Mamba–Transformer LLMs: Jamba (AI21, 2024), Nemotron-H (NVIDIA, 2025), Granite 4.0 (IBM, 2025, Mamba-2 hybrid) | ✔ live | arXiv 2403.19887; arXiv 2504.03624; ibm.com Granite 4.0 announcement |
| SSM demo: 36 tokens, 16-number diagonal state, h ← e^(−Δ·a)·h + Δ·b·x with Δ = 1 for “key” tokens and 0.06 for filler (illustrative sizes, real update rule). Cost line: n tokens → n(n+1)/2 token pairs for causal attention vs n state updates (per layer); doubling n multiplies them by ≈ 4 and 2 | ✔ arithmetic | — |
| Autoencoders: Hinton & Salakhutdinov, Science 313:504 (2006); VAE, Kingma & Welling 2013; a linear autoencoder trained with squared error spans the PCA subspace | ✔ stable | doi:10.1126/science.1127647; arXiv 1312.6114; Baldi & Hornik, Neural Networks 2:53 (1989) |
| Autoencoder demo: PCA of 957 overlapping 8 × 8 patches (stride 2) of the 64 × 72 photo crop; reconstruction exact at k = 64; relative RMS error 38.6 % at k = 8, 26.5 % at k = 16 | ✔ local | `js/demos/archs.js` (Jacobi eigen-decomposition, node re-run) |
| Latent diffusion (Stable Diffusion) works in a KL-regularised autoencoder's latent space: 512 × 512 × 3 → 64 × 64 × 4 (f = 8) | ✔ live | Rombach et al. 2022, arXiv 2112.10752 |
| scVI: a VAE for single-cell RNA-seq | ✔ stable | Lopez et al., Nature Methods 15, 1053 (2018) |
| GANs (2014): minimax objective; for a fixed generator the optimal discriminator is D*(x) = p_data / (p_data + p_g); at the optimum p_g = p_data and D = ½ | ✔ stable | Goodfellow et al., arXiv 1406.2661 (Prop. 1, Fig. 1) |
| GAN demo: idealised (Gaussian generator moved smoothly to the data; discriminator always optimal), after Fig. 1 of the paper | ✔ (labelled on screen) | — |
| StyleGAN (2019) | ✔ stable | Karras et al., arXiv 1812.04948 |
| Hopfield network (1982); capacity ≈ 0.138 N patterns; Boltzmann machine (1985); Nobel Prize in Physics 2024 to Hopfield and Hinton | ✔ stable | PNAS 79:2554; Amit, Gutfreund & Sompolinsky 1985; Ackley, Hinton & Sejnowski 1985; nobelprize.org |
| Modern continuous Hopfield networks: the update rule is equivalent to Transformer attention | ✔ live | Ramsauer et al. 2020, arXiv 2008.02217 |
| Hopfield demo: 100 neurons, 3 Hebbian memories (w_ij = (1/N) Σ ξ_i ξ_j), 25 % of pixels flipped, asynchronous updates; energy never increases. Node check at 30 % noise: 576 / 600 runs recall the exact memory (the rest end in a spurious state, which the demo labels honestly) | ✔ local | `js/demos/archs.js`; scratch prototype |
| Fourier neural operator (2020): learns the solution operator in Fourier space, zero-shot super-resolution, “up to three orders of magnitude faster compared to traditional PDE solvers” | ✔ live | Li et al., arXiv 2010.08895 (abstract) |
| FNO demo: heat equation u_t = u_xx on a ring; in Fourier space each mode decays exactly as e^(−k²t), the multiplier an FNO layer would have to learn; drawn at 32 or 256 points from the same weights | ✔ stable | standard Fourier solution of the heat equation |
| FourCastNet (2022) uses Adaptive Fourier Neural Operators; DeepONet (2019) | ✔ stable | Pathak et al., arXiv 2202.11214; Lu et al., arXiv 1910.03193 |
| KAN (2024): learnable 1-D functions (B-splines) on edges, nodes sum; example f(x, y) = exp(sin πx + y²) recovered symbolically | ✔ live | Liu et al., arXiv 2404.19756 |
| “KAN or MLP: A Fairer Comparison” (2024): with matched parameters/FLOPs, MLPs beat KANs on most tasks except symbolic formula representation | ✔ live | Yu, Yu & Wang, arXiv 2407.16674 |
| Timeline “go-to” bars are approximate eras read from the milestones above (e.g. LSTM 2014–2018 from seq2seq to BERT; GAN 2015–2021 from DCGAN to “Diffusion beats GANs”); labelled “approximate” on screen | ≈ | this table; seq2seq arXiv 1409.3215; BERT arXiv 1810.04805; DCGAN arXiv 1511.06434 |
