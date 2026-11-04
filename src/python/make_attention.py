"""attention.js: REAL Gemma 3 270M attention probabilities.

We recompute every layer of the model in numpy straight from its weights,
exactly as keras-hub's Gemma 3 does it:

  x0 = E[token] * sqrt(640)
  per layer:  xn = RMSNorm(x) * (1 + s_pre)
              q = xn Wq (4 heads x 256), k = xn Wk, v = xn Wv (1 shared KV head)
              q, k = RMSNorm over head_dim (QK-norm) * (1 + s_q / s_k)
              q, k = RoPE (base 10k on local layers, 1M on global layers 5/11/17)
              q = q / sqrt(256)
              A = softmax(q k^T + causal mask)          <- exported
              attn = (A v) Wo ; x += RMSNorm(attn) * (1 + s_post)
              x += RMSNorm(Wdown (gelu_tanh(Wgate xn2) * (Wup xn2))) * (1 + s_post_ffw)

VALIDATION: for every layer the attention-block output (before the
post-attention norm) is compared with keras-hub's own layer.attention(...)
on the same input, and the full numpy forward pass is compared with the
backbone's final hidden states. If anything exceeds tolerance the file is
marked illustrative:true.

Run:  python src/python/make_attention.py [--model it|pt]
"""
import math
import sys

import numpy as np

from common import (MODEL_NAME, encode, load_backbone, load_sp,
                    load_tokenizer, named_weights, piece_to_text, rnd,
                    write_js)

SENTENCES = [
    ("wombat", "The wombat crossed the road because it was hungry."),
    ("trophy", "The trophy did not fit in the suitcase because it was too big."),
    ("water", "Water boils at 100 degrees and freezes at 0 degrees."),
]
N_LAYERS, N_HEADS, HEAD_DIM, HIDDEN = 18, 4, 256, 640
EPS = 1e-6
TOL_REL = 2e-3  # max |numpy - keras| / max |keras| per layer


def rms(x, scale):
    var = np.mean(x * x, axis=-1, keepdims=True)
    return x / np.sqrt(var + EPS) * (1.0 + scale)


def rope(x, wavelength):
    """x: (T, n, H). keras-hub RotaryEmbedding (rotate-half form)."""
    T, _, H = x.shape
    inv = wavelength ** (-(np.arange(0, H, 2, dtype=np.float64) / H))
    freq = np.arange(T, dtype=np.float64)[:, None] * inv[None, :]
    emb = np.concatenate([freq, freq], axis=-1)[:, None, :]
    x1, x2 = x[..., : H // 2], x[..., H // 2:]
    rot = np.concatenate([-x2, x1], axis=-1)
    return x * np.cos(emb) + rot * np.sin(emb)


def gelu_tanh(x):
    return 0.5 * x * (1 + np.tanh(math.sqrt(2 / math.pi) * (x + 0.044715 * x ** 3)))


def is_global(layer):
    return layer % 6 == 5


def attention_block(W, layer, x):
    """x: (T, 640) residual stream entering `layer`. Returns probs, attn_out."""
    p = f"decoder_block_{layer}/"
    xn = rms(x, W[p + "pre_attention_norm/scale"])
    q = np.einsum("td,ndh->tnh", xn, W[p + "attention/query/kernel"])
    k = np.einsum("td,kdh->tkh", xn, W[p + "attention/key/kernel"])
    v = np.einsum("td,kdh->tkh", xn, W[p + "attention/value/kernel"])
    q = rms(q, W[p + "attention/query_norm/scale"])
    k = rms(k, W[p + "attention/key_norm/scale"])
    wl = 1_000_000.0 if is_global(layer) else 10_000.0
    q = rope(q, wl) / math.sqrt(HEAD_DIM)
    k = rope(k, wl)
    logits = np.einsum("tnh,sh->nts", q, k[:, 0, :])
    T = x.shape[0]
    causal = np.tril(np.ones((T, T), dtype=bool))
    logits = np.where(causal[None], logits, -np.inf)
    logits -= logits.max(-1, keepdims=True)
    A = np.exp(logits)
    A /= A.sum(-1, keepdims=True)
    o = np.einsum("nts,sh->tnh", A, v[:, 0, :])
    attn = np.einsum("tnh,nhd->td", o, W[p + "attention/attention_output/kernel"])
    return A, attn


def decoder_layer(W, layer, x):
    p = f"decoder_block_{layer}/"
    A, attn = attention_block(W, layer, x)
    x = x + rms(attn, W[p + "post_attention_norm/scale"])
    xn = rms(x, W[p + "pre_ffw_norm/scale"])
    h = gelu_tanh(xn @ W[p + "ffw_gating/kernel"]) * (xn @ W[p + "ffw_gating_2/kernel"])
    f = h @ W[p + "ffw_linear/kernel"]
    x = x + rms(f, W[p + "post_ffw_norm/scale"])
    return A, attn, x


def numpy_forward(W, ids):
    E = W["token_embedding/embeddings"]
    x = E[ids].astype(np.float64) * np.float64(np.float32(math.sqrt(HIDDEN)))
    probs = []
    for layer in range(N_LAYERS):
        A, _, x = decoder_layer(W, layer, x)
        probs.append(A)
    return np.stack(probs), rms(x, W["final_normalization/scale"])


def keras_validate(bb, W, ids):
    """Per-layer check of the attention block + end-to-end check."""
    from keras import ops
    tok = np.array([ids], dtype="int32")
    pm = np.ones_like(tok)
    x = bb.token_embedding(tok) * ops.cast(ops.sqrt(HIDDEN), "float32")
    per_layer = []
    for layer, blk in enumerate(bb.transformer_layers):
        xn = blk.pre_attention_norm(x)
        mask = blk._compute_attention_mask(xn, pm, None, None, 0)
        attn_k = np.asarray(blk.attention(xn, attention_mask=mask))[0].astype(np.float64)
        _, attn_np = attention_block(W, layer, np.asarray(x)[0].astype(np.float64))
        err = float(np.max(np.abs(attn_k - attn_np)))
        scale = float(np.max(np.abs(attn_k)))
        per_layer.append({"layer": layer, "maxAbsErr": err, "maxAbs": scale,
                          "rel": err / scale})
        x = blk(x, padding_mask=pm)
    final_k = np.asarray(bb({"token_ids": tok, "padding_mask": pm}))[0].astype(np.float64)
    _, final_np = numpy_forward(W, ids)
    e2e = float(np.max(np.abs(final_k - final_np)) / np.max(np.abs(final_k)))
    return per_layer, e2e


def head_metrics(A, toks):
    """A: (L, H, T, T). Returns dict of (L, H) arrays."""
    T = A.shape[-1]
    t = np.arange(T)
    prev = A[:, :, t[2:], t[2:] - 1].mean(-1)
    sink = A[:, :, 1:, 0].mean(-1)
    self_ = A[:, :, t[1:], t[1:]].mean(-1)
    ent = -(A[:, :, 1:, :] * np.log(A[:, :, 1:, :] + 1e-12)).sum(-1).mean(-1)
    return {"prev": prev, "sink": sink, "self": self_, "entropy": ent}


def find(toks, piece):
    return [i for i, t in enumerate(toks) if t.strip() == piece]


def main():
    which = "it"
    if "--model" in sys.argv:
        which = sys.argv[sys.argv.index("--model") + 1]
    sp = load_sp()
    tok = load_tokenizer()
    bb = load_backbone(which)
    W = {k: v.astype(np.float64) for k, v in named_weights(bb).items()}

    sents, validation = [], {}
    all_A = {}
    for sid, text in SENTENCES:
        ids = encode(tok, text, add_bos=True)
        toks = [piece_to_text(sp.IdToPiece(i)) for i in ids]
        toks[0] = "<bos>"
        A, _ = numpy_forward(W, ids)
        per_layer, e2e = keras_validate(bb, W, ids)
        worst = max(r["rel"] for r in per_layer)
        validation[sid] = {"worstLayerRelErr": worst, "endToEndRelErr": e2e,
                           "perLayerRelErr": [r["rel"] for r in per_layer]}
        print(f"[{sid}] T={len(ids)} worst per-layer rel err {worst:.2e}, end-to-end {e2e:.2e}")
        all_A[sid] = (A, toks, ids)

    # ---- per-head statistics (averaged over the sentences) ---------------
    stats = {k: [] for k in ("prev", "sink", "self", "entropy")}
    for sid, _ in SENTENCES:
        m = head_metrics(all_A[sid][0], all_A[sid][1])
        for k in stats:
            stats[k].append(m[k])
    stats = {k: np.mean(v, axis=0) for k, v in stats.items()}  # (L, H)

    def best(arr):
        l, h = np.unravel_index(np.argmax(arr), arr.shape)
        return int(l), int(h)

    def share(Arow, targets, upto):
        """Share of a query row's attention on `targets`, raw and excluding BOS."""
        raw = float(Arow[targets].sum())
        nob = raw / max(float(Arow[1:upto + 1].sum()), 1e-12)
        return raw, nob

    def rank_excl_bos(Arow, targets, upto):
        tgt = Arow[targets].sum()
        others = [Arow[j] for j in range(1, upto + 1) if j not in targets]
        return 1 + int(sum(o > tgt for o in others))

    Aw, wt, _ = all_A["wombat"]
    At, tt, _ = all_A["trophy"]
    Aa, at, _ = all_A["water"]
    it_w, wom = find(wt, "it")[0], [find(wt, "wom")[0], find(wt, "bat")[0]]
    it_t, tro, sui = find(tt, "it")[0], find(tt, "trophy"), find(tt, "suitcase")

    # Coreference: both 'it's must rank the right noun first (after <bos>);
    # pick the head with the largest combined non-BOS share.
    cands = []
    for l in range(N_LAYERS):
        for h in range(N_HEADS):
            rw = rank_excl_bos(Aw[l, h, it_w], wom, it_w)
            rt = rank_excl_bos(At[l, h, it_t], tro, it_t)
            sw = share(Aw[l, h, it_w], wom, it_w)
            st = share(At[l, h, it_t], tro, it_t)
            cands.append((rw == 1 and rt == 1, sw[1] + st[1], l, h, sw, st))
    cands.sort(key=lambda c: (c[0], c[1]), reverse=True)
    ok_coref, _, cl, ch, sw, st = cands[0]
    su = share(At[cl, ch, it_t], sui, it_t)
    row_w = Aw[cl, ch, it_w]
    top_other = max(((wt[j], float(row_w[j])) for j in range(1, it_w + 1) if j not in wom),
                    key=lambda x: x[1])

    pl, ph = best(stats["prev"])
    sl, sh = best(stats["sink"])
    fl, fh = best(stats["self"])
    deg = [i for i, x in enumerate(at) if x == " degrees"]
    ats = [i for i, x in enumerate(at) if x == " at"]
    dup = (Aa[:, :, deg[1], deg[0]] + Aa[:, :, ats[1], ats[0]]) / 2
    dl, dh = best(dup)
    n_sink_heads = int((stats["sink"] > 0.5).sum())
    ex_prev = (wt[it_w], wt[it_w - 1], float(Aw[pl, ph, it_w, it_w - 1]))

    highlights = [
        {"layer": pl, "head": ph, "kind": "previous-token", "sentence": "wombat",
         "title": f"Layer {pl}, head {ph}: look one token back",
         "desc": (f"On average {100 * stats['prev'][pl, ph]:.0f}% of each token's attention goes to the token "
                  f"right before it (e.g. '{ex_prev[0].strip()}' \u2192 '{ex_prev[1].strip()}' "
                  f"{100 * ex_prev[2]:.0f}%). A simple, very common head type."),
         "value": float(stats["prev"][pl, ph])},
        {"layer": sl, "head": sh, "kind": "first-token sink", "sentence": "wombat",
         "title": f"Layer {sl}, head {sh}: the attention sink",
         "desc": (f"Parks {100 * stats['sink'][sl, sh]:.0f}% of its attention on the first token <bos>: a "
                  f"'no-op' used when there is nothing useful to look at. {n_sink_heads} of the 72 heads "
                  f"put more than half of their attention on <bos>."),
         "value": float(stats["sink"][sl, sh])},
        {"layer": cl, "head": ch, "kind": "coreference (it \u2192 noun)", "sentence": "wombat",
         "focus": {"query": it_w, "keys": wom},
         "title": f"Layer {cl}, head {ch}: what does 'it' refer to?",
         "desc": (f"From ' it', {100 * sw[0]:.0f}% of the attention goes to ' wom'+'bat' "
                  f"({100 * sw[1]:.0f}% of everything except <bos>), more than any other earlier word "
                  f"(next: '{top_other[0].strip()}' {100 * top_other[1]:.0f}%). In the trophy sentence the "
                  f"same head sends {100 * st[0]:.0f}% of ' it''s attention to ' trophy' "
                  f"(vs {100 * su[0]:.0f}% to ' suitcase')."),
         "value": sw[0], "trophyValue": st[0], "suitcaseValue": su[0],
         "criterion": ("both 'it's rank the correct noun first (excluding <bos>), max combined share"
                       if ok_coref else "no head ranked both nouns first; best combined share shown")},
        {"layer": dl, "head": dh, "kind": "duplicate-token", "sentence": "water",
         "focus": {"query": deg[1], "keys": [deg[0]]},
         "title": f"Layer {dl}, head {dh}: find earlier copies",
         "desc": (f"The second ' degrees' puts {100 * Aa[dl, dh, deg[1], deg[0]]:.0f}% of its attention on the "
                  f"first ' degrees' (and the second ' at' {100 * Aa[dl, dh, ats[1], ats[0]]:.0f}% on the first ' at')."),
         "value": float(dup[dl, dh])},
        {"layer": fl, "head": fh, "kind": "self / current token", "sentence": "wombat",
         "title": f"Layer {fl}, head {fh}: look at yourself",
         "desc": f"Mostly attends to the current token itself ({100 * stats['self'][fl, fh]:.0f}% on average).",
         "value": float(stats["self"][fl, fh])},
    ]
    for hl in highlights:
        print(f"L{hl['layer']} H{hl['head']} [{hl['kind']}] {hl['desc']}")

    # ---- export ---------------------------------------------------------
    def word_groups(toks_):
        groups = [[0]]
        for i in range(1, len(toks_)):
            t = toks_[i]
            if t.startswith(" ") or i == 1 or not t[:1].isalnum() or not toks_[i - 1][-1:].isalnum():
                groups.append([i])
            else:
                groups[-1].append(i)  # continuation piece, e.g. 'bat' after ' wom'
        return groups

    for sid, text in SENTENCES:
        A_, toks_, ids_ = all_A[sid]
        g = word_groups(toks_)
        sents.append({
            "id": sid,
            "text": text,
            "tokens": toks_,
            "ids": ids_,
            "wordGroups": g,
            "words": ["".join(toks_[i] for i in grp).strip() for grp in g],
            # attn[layer][head][query t][key s]; rows sum to 1; zeros above the diagonal (causal)
            "attn": rnd(A_, 3),
        })
    ok = all(v["worstLayerRelErr"] < TOL_REL and v["endToEndRelErr"] < TOL_REL
             for v in validation.values())
    obj = {
        "model": MODEL_NAME + (" instruction-tuned" if which == "it" else " pretrained"),
        "layers": N_LAYERS,
        "heads": N_HEADS,
        "kvHeads": 1,
        "headDim": HEAD_DIM,
        "globalLayers": [l for l in range(N_LAYERS) if is_global(l)],
        "sentences": sents,
        "highlights": rnd(highlights, 4),
        "headStats": {
            "prev": rnd(stats["prev"], 4), "sink": rnd(stats["sink"], 4), "self": rnd(stats["self"], 4),
            "entropy": rnd(stats["entropy"], 4),
            "note": ("[layer][head], averaged over the 3 sentences: prev = mean attention to the previous token "
                     "(from token 2 on), sink = mean attention to <bos>, self = mean attention to itself, "
                     "entropy in nats"),
        },
        "illustrative": not ok,
        "caveats": [
            "'wombat' is two tokens (' wom' + 'bat'); use wordGroups to merge pieces (sum over keys).",
            "Attention weights show where information is read from, not a full explanation of the model.",
        ],
        "validation": {
            "method": ("numpy recomputation from the weights (QK-norm, RoPE 10k/1M, q/sqrt(256), causal softmax) "
                       "compared with keras-hub's own attention layer on identical inputs, every layer, every sentence; "
                       "plus the full 18-layer numpy forward pass vs the backbone output"),
            "toleranceRel": TOL_REL,
            "passed": ok,
            # relative errors, 3 significant figures (max |numpy - keras| / max |keras|)
            "perSentence": {sid: {"worstLayerRelErr": float(f"{v['worstLayerRelErr']:.3g}"),
                                  "endToEndRelErr": float(f"{v['endToEndRelErr']:.3g}"),
                                  "perLayerRelErr": [float(f"{e:.3g}") for e in v["perLayerRelErr"]]}
                            for sid, v in validation.items()},
        },
        "source": "Computed offline from the cached keras-hub Gemma 3 270M preset (Gemma terms of use: ai.google.dev/gemma/terms).",
    }
    write_js("attention", obj, "attention.js")
    print("validation passed:", ok)


if __name__ == "__main__":
    main()
