// Node sanity checks for every data/*.js file (run: node src/python/check_data.js).
// Each file must load in a plain JS context and define exactly its AIDATA key.
const path = require("path");
const fs = require("fs");
const DATA = path.resolve(__dirname, "..", "..", "data");
globalThis.window = globalThis;

const expect = {
  "next_token.js": "nextToken", "embeddings.js": "embeddings", "weights.js": "weights",
  "attention.js": "attention", "warpnet.js": "warpnet", "iris.js": "iris", "kepler.js": "kepler",
  "hopper.js": "hopper", "eeg.js": "eeg", "compute.js": "compute", "protein.js": "protein", "journey.js": "journey",
};
let ok = true;
const fail = (m) => { ok = false; console.log("  FAIL:", m); };
const approx = (a, b, tol) => Math.abs(a - b) <= tol;

for (const [file, key] of Object.entries(expect)) {
  const p = path.join(DATA, file);
  if (!fs.existsSync(p)) { fail(`${file} missing`); continue; }
  const before = new Set(Object.keys(globalThis.AIDATA || {}));
  require(p);
  const added = Object.keys(AIDATA).filter((k) => !before.has(k));
  const kb = (fs.statSync(p).size / 1024).toFixed(1);
  console.log(`${file}: key=${added.join(",")} size=${kb} KB`);
  if (added.length !== 1 || added[0] !== key) fail(`${file} should define AIDATA.${key}`);
  if (fs.statSync(p).size > 1.5 * 1024 * 1024) fail(`${file} larger than 1.5 MB`);
}

// nextToken: exact renormalisation at T=1 and T=0.5 using the full-vocab LSE.
const nt = AIDATA.nextToken;
for (const pr of nt.prompts) {
  if (pr.topk.length !== 40) fail(`${pr.id}: topk ${pr.topk.length}`);
  if (Object.keys(pr.lse).length !== 59) fail(`${pr.id}: lse keys ${Object.keys(pr.lse).length}`);
  for (const T of ["1.00", "0.50", "3.00", "0.10"]) {
    const s = pr.topk.reduce((a, t) => a + Math.exp(t.logit / Number(T) - pr.lse[T]), 0);
    if (!(s <= 1.0001 && s > 0)) fail(`${pr.id} T=${T}: top-40 mass ${s}`);
  }
}
const hi = nt.prompts.find((p) => p.id === "hi");
const pHi = Math.exp(hi.topk[0].logit - hi.lse["1.00"]);
console.log(`  hi: top=${JSON.stringify(hi.topk[0].token)} p=${(100 * pHi).toFixed(2)}% greedy=${JSON.stringify(hi.greedy)}`);
if (!approx(pHi, 0.9326, 0.0005)) fail("hi top-1 probability != 93.26%");

// attention: rows sum to ~1 and are causal.
const at = AIDATA.attention;
for (const s of at.sentences) {
  const T = s.tokens.length;
  for (let l = 0; l < at.layers; l++) for (let h = 0; h < at.heads; h++) for (let t = 0; t < T; t++) {
    const row = s.attn[l][h][t];
    const sum = row.reduce((a, b) => a + b, 0);
    if (!approx(sum, 1, 0.01)) { fail(`${s.id} L${l}H${h} t${t} sum ${sum}`); break; }
    for (let u = t + 1; u < T; u++) if (row[u] !== 0) { fail(`${s.id} not causal`); break; }
  }
}
console.log(`  attention: illustrative=${at.illustrative} validation.passed=${at.validation.passed} highlights=${at.highlights.length}`);

// embeddings
const em = AIDATA.embeddings;
console.log(`  embeddings: ${em.words.length} words, ${em.analogies.filter((a) => a.hit).length}/${em.analogies.length} analogies hit`);
for (const w of em.words) if (w.nn.length !== 8 || w.pca.length !== 2 || w.tsne.length !== 2) fail(`word ${w.w}`);
for (const w of em.words) if (!(w.cat in em.categories)) fail(`category ${w.cat}`);

// weights
const wt = AIDATA.weights;
const sumB = Object.values(wt.breakdown).reduce((a, b) => a + b, 0);
if (sumB !== wt.totalParams) fail("weights breakdown does not sum to total");
for (const m of wt.matrices) {
  if (m.patch.values.length !== 16 || m.patch.values[0].length !== 16) fail(`${m.id} patch`);
  if (!fs.existsSync(path.resolve(DATA, "..", m.img))) fail(`${m.img} missing`);
}
console.log(`  weights: total=${wt.totalParams} matrices=${wt.matrices.length}`);

// warpnet: recompute accuracy in JS from the exported weights.
const wn = AIDATA.warpnet;
let correct = 0;
for (let i = 0; i < wn.data.x.length; i++) {
  let h = wn.data.x[i];
  for (const L of wn.layers) {
    h = [Math.tanh(L.W[0][0] * h[0] + L.W[0][1] * h[1] + L.b[0]),
         Math.tanh(L.W[1][0] * h[0] + L.W[1][1] * h[1] + L.b[1])];
  }
  const s = wn.readout.w[0] * h[0] + wn.readout.w[1] * h[1] + wn.readout.c;
  if ((s > 0 ? 1 : 0) === wn.data.y[i]) correct++;
}
console.log(`  warpnet: JS accuracy ${(correct / wn.data.x.length).toFixed(3)} (file says ${wn.accuracy})`);
if (correct !== wn.data.x.length) fail("warpnet JS accuracy != 100%");

// small data
if (AIDATA.iris.rows.length !== 150) fail("iris rows");
if (AIDATA.kepler.planets.length !== 8) fail("kepler planets");
const hp = AIDATA.hopper;
if (hp.rgb.length !== hp.width * hp.height * 3) fail("hopper rgb length");
if (!fs.existsSync(path.resolve(DATA, "..", hp.src))) fail("hopper jpg missing");
if (AIDATA.eeg.data.length !== AIDATA.eeg.channels.length) fail("eeg channels");
const pr = AIDATA.protein;
if (pr.ca.length !== pr.resNum.length || pr.ss.length !== pr.ca.length) fail("protein lengths");
console.log(`  protein: ${pr.pdb} ${pr.ca.length} CA, ss H/E/C = ${[..."HEC"].map((c) => pr.ss.split(c).length - 1).join("/")}`);
console.log(`  compute: ${AIDATA.compute.models.length} models, fallback=${AIDATA.compute.fallback}`);

// journey: must agree with next_token.js and with itself
const jr = AIDATA.journey;
if (JSON.stringify(jr.prompt.ids) !== JSON.stringify(hi.promptIds)) fail("journey prompt ids != nextToken hi");
hi.greedyTokens.forEach((g, i) => { if (jr.reply.steps[i].id !== g.id) fail(`journey reply token ${i} != nextToken greedy`); });
if (!approx(jr.reply.steps[0].p, pHi, 0.0005)) fail("journey first-token p != nextToken");
if (jr.reply.stop.id !== 106) fail("journey reply does not end with <end_of_turn>");
if (jr.reply.passes !== jr.reply.steps.length + 1) fail("journey passes != steps + 1");
const c = jr.config;
if (jr.kvBytesPerToken !== 2 * c.layers * c.kvHeads * c.headDim * 2) fail("journey KV bytes per token");
if (jr.params !== wt.totalParams) fail("journey params != weights total");
const cached = jr.prompt.ids.concat(jr.reply.steps.map((s) => s.id));
for (let i = 0; i < jr.turn2.reused; i++) if (jr.turn2.ids[i] !== cached[i]) { fail("journey turn-2 prefix mismatch"); break; }
if (jr.turn2.ids[jr.turn2.reused] === cached[jr.turn2.reused]) fail("journey turn-2 reuse could be longer");
if (jr.turn2.reused + jr.turn2.new !== jr.turn2.total) fail("journey turn-2 counts");
console.log(`  journey: ${jr.prompt.ids.length} prompt IDs, reply ${jr.reply.steps.length} tokens + stop (${jr.reply.passes} passes), KV ${jr.kvBytesPerToken} B/token, turn 2 reuses ${jr.turn2.reused}/${jr.turn2.total}, tokenizer ${jr.tokenizer.type} ${jr.timing.hiMicros} µs`);
console.log(ok ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED");
process.exit(ok ? 0 : 1);
