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

## Stack, tokenizer & demo numbers (added by the deck owner)
| Fact | Status | Source |
|---|---|---|
| Gemini 2.5 was trained on TPU v5p, data-parallel across multiple 8,960-chip pods (stack slide: "pods of 8,960 TPU chips") | ≈ from memory of the report, not re-opened during this build | Gemini 2.5 technical report, arXiv 2507.06261 (training infrastructure section) |
| Gemma 3 uses the same SentencePiece tokenizer as Gemini 2.0 | ✔ stable | Gemma 3 technical report, arXiv 2503.19786 |
| Token IDs: "hi" 2202, "Hi" 10979, " hi" 5631, "The" 818, "strawberry" 115137 (one token); digits split one per token ("9.11" → 9 . 1 1); "🦘" → 4 byte tokens | ✔ local | `src/python/build_tokens.py` → `data/tokens.js` |
| Chat template for "hi" = 10 tokens; first-word probabilities Hi 93.26 % / Hello 6.31 % / How 0.37 % | ✔ local | `data/next_token.js` (checked by `src/python/check_data.js`) |
| Iris neuron "let it learn" (Adam, same code as the demo): easy pair 100/100, hard pair 94/100; best possible linear 97/100 | ✔ local | node re-run of the demo maths (build log) |
| Kepler least squares in log-log: w = 1.4978, b ≈ 0.000, L = 1.4×10⁻⁶; gradient descent from (0.2, 1.2): η = 0.1 converges in 181 steps, 0.6 in 27 (zig-zag), 0.8 diverges | ✔ local | node re-run of the demo maths |
| Playground default (spiral, 2×6 tanh, η = 0.03, seed 9): 95 % accuracy after ~720 epochs; XOR with one hidden neuron stalls at ~63 % | ✔ local | node re-run of `js/lib/nn.js` |
