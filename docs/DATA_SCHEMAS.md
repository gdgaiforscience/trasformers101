# Data files: schemas & usage (`state_of_ai/data/*.js`)

Every file is a plain script: `window.AIDATA = window.AIDATA || {}; AIDATA.<key> = {...};`
(pure ASCII, loads on `file://`, no fetch). Rebuild with the scripts in `src/python/`
(`make_*.py`, gdg env, offline) and check with `node src/python/check_data.js`.

> [!IMPORTANT]
> Render model-generated strings (token labels, greedy continuations) with `textContent`,
> not `innerHTML`: e.g. the DNA continuation contains literal `<strong>` tags from web text.

## `next_token.js` -> `AIDATA.nextToken`
```
{model, models:{it,pt}, vocabSize:262144, temps:[0.10..3.00 step 0.05], topkN:40, howTo, greedyRule,
 prompts:[{id, label, prompt, model:"it"|"pt", templated, fullText, promptIds, promptTokens,
           topk:[{token, disp, id, logit}] (40, raw logits, 6 dp),
           lse:{"0.10":..., ..., "3.00":...},   // log-sum-exp of logits/T over ALL 262,144 tokens
           greedy, greedyTokens:[{token,disp,id}], greedyStop:"newline"|"end_of_turn"|"eos"|"max",
           top40MassT1, maxLogit}]}
```
Exact probability at temperature T: `p = Math.exp(logit / T - lse[T.toFixed(2)])`;
"everything else" = `1 - sum(p)`. `token` keeps leading spaces (`" Au"`); `disp` shows newlines as `↵`.
Prompt ids: `hi` (instruct + chat template), `gold`, `dna`, `star`, `water`, `mito`, `emc`, `reef`,
`planet` (pretrained), plus `hi_pt` (pretrained model given a bare "hi", for contrast).

## `journey.js` -> `AIDATA.journey` (slide `journey`, built by `make_journey.py`)
```
{model, config:{vocab, layers, hidden, qHeads, kvHeads, headDim, ffn, slidingWindow},
 params, weightsBytesBf16, embedNumbers, kvBytesPerToken, kvNote, logitsBytesF32,
 tokenizer:{type:"BPE", byteFallback, pieces},
 timing:{cpu, lib, hiTokens, hiMicros, longTokens, longMicros},     // median SentencePiece encode time
 prompt:{text:"hi", templated, ids:[10], tokens:[10], bytesInt32:40},
 reply:{text, steps:[{id, token, disp, p, alt:[{id, token, disp, p} × 2]}], stop:{… <end_of_turn>}, passes, rule},
 turn2:{user, text, ids, total, cached, reused, new}, source}
```
`steps` is the full greedy reply of the instruction-tuned model (11 tokens, the last one is a newline),
`p` its softmax probability at T = 1 and `stop` the token that ends it (`<end_of_turn>`, id 106);
`passes` = 1 prefill + one decode pass per reply token. `kvBytesPerToken` assumes bf16 keys and values:
2 × layers × KV heads × head_dim × 2 bytes. `turn2.reused` = how many leading IDs of the second turn match
what turn 1 left in the KV cache (prompt + every reply token that was fed back in).

## `embeddings.js` -> `AIDATA.embeddings`
```
{model, dim:640, vocabSize, words:[{w, piece, id, cat, pca:[x,y], tsne:[x,y], nn:[8 strings], nnSim:[8 cosines]}],
 categories:{name: colour}, analogies:[{a,b,c,expect, top5, top5Sim, hit, inTop5, rank, expectSingleToken}],
 analogyMethod, nnMethod, pcaExplainedVariance, tsne:{...}, categoryPurity5NN, coords, droppedMultiToken, source}
```
`pca`/`tsne` are centred and scaled to [-1, 1]. Analogy = `b - a + c` (e.g. `king - man + woman`).

## `weights.js` -> `AIDATA.weights` (+ `assets/img/w_*.png`)
```
{model, totalParams, breakdown:{embedding, attention, mlp, norms}, breakdownPct, breakdownNote,
 perLayer:{params, layers, matrices:{name:{shape,n,group}}}, config,
 colormap:{neg, zero, pos, scale, gamma, mapping, levels, transparent},
 matrices:[{id, img, title, desc, layout, width, height, vmax, stats:{shape,n,mean,std,min,max,absMax,p01,p99,fracBeyond3Sigma},
            patch:{row0, col0, values:[16][16], px:[x, y, w, h]  (zoom box in PNG pixels), head?, rowsWords?, sharedCol?},
            sharedFeature? (embed_slice only: {dim, meanOverVocab, fracSameSign})}],
 histogram:{edges(161), counts:{embedding,attention,mlp}, all, under, over, note}, allWeightStats, ladder:[{name, params, year, approx?, source}]}
```
PNG colour = `lerp(#1a1d24, BLUE|RED, |w/vmax|^0.8)`, clipped at ±3σ; gaps between heads/groups are transparent.
`layout.blocks` (query/attn-out) and `layout.rowsPx` / `layout.groups` (embedding slice) give pixel positions for labels.

## `attention.js` -> `AIDATA.attention`
```
{model, layers:18, heads:4, kvHeads:1, headDim:256, globalLayers:[5,11,17],
 sentences:[{id, text, tokens (tokens[0] = "<bos>"), ids, wordGroups, words, attn[layer][head][query][key]}],
 highlights:[{layer, head, kind, sentence, title, desc, value, focus?:{query, keys}, ...}],
 headStats:{prev, sink, self, entropy  ([layer][head]), note}, illustrative:false, caveats, validation:{...}, source}
```
Rows are post-softmax probabilities (sum to 1), zeros above the diagonal (causal). Sum over a word's pieces
(`wordGroups`) to merge sub-word tokens such as `" wom" + "bat"`.

## `warpnet.js` -> `AIDATA.warpnet`
```
{arch, equations, layers:[{W:[[2x2]], b:[2], act:"tanh"} x3], readout:{w:[2], c, note},
 data:{x:[[x,y] x200], y:[0|1], classes, colors, desc}, accuracy, loss, marginH3, trainSeed, dets,
 extent:[xmin,xmax,ymin,ymax], hiddenExtent, stageOrder, stageExtent:{stage: extent}, stagePoints:{stage: [[x,y]...]},
 story, notes, training}
```
Stages: `input -> W1 -> b1 -> tanh1 -> W2 -> b2 -> tanh2 -> W3 -> b3 -> tanh3`; the readout line lives in the `tanh3` plane.

## Small datasets
* `iris.js` -> `AIDATA.iris = {features, featureKeys, species, rows:[[sl, sw, pl, pw, speciesIndex] x150], n, source, license}`
* `kepler.js` -> `AIDATA.kepler = {planets:[{name, a (AU), T (yr), distance_1e6km, period_days, T2_over_a3}], units, fit, conversion, source, caveat, license}`
* `hopper.js` -> `AIDATA.hopper = {src, origWidth, origHeight, width:64, height:75, rgb:[...], gray:[...], layout, source, license}`
* `eeg.js` -> `AIDATA.eeg = {channels, rateHz:80, nSamples:800, durationS:10, data:[channel][sample], units, source, caveat, license}`
* `compute.js` -> `AIDATA.compute = {fallback:true, models:[{name, label?, year, org, flop, method:"reported"|"6ND"|"estimate", flop6ND?, params, active?, tokens, formula?, source}], formula, methods, trend:{factorPerYear:[4,5], since:2010, desc, source}, units, range, source, license}` (`label` = short on-chart name, e.g. "Le Chonk"; `active` = parameters used per token by a mixture-of-experts model)
* `protein.js` -> `AIDATA.protein = {pdb:"1EMA", name, organism, method, citation, nResidues, ca:[[x,y,z]] (Å, centred, barrel axis = y), resNum, resName, seq, ss ("H"/"E"/"C" per residue), bFactor, helices, strands, chainBreaks, chromophore:{name, approxPos, note}, radius, units, frame, notes, source, license}`
