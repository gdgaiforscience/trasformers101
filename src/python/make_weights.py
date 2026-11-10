"""weights.js + assets/img/w_*.png: what Gemma 3 270M's weights look like.

* Heatmaps of real weight matrices with the deck's diverging colormap
  (RED negative -> #1a1d24 zero -> BLUE positive), robust symmetric scaling at
  +-3 sigma of each matrix (values beyond are clipped), 1 weight = 1 (or 2x2)
  pixels, transparent gaps between heads / categories, ~1200 px wide.
* A 16x16 raw-number patch for each matrix (centred on its largest |w|), with
  its pixel rectangle in the PNG so the deck can draw a zoom box.
* Exact parameter count + breakdown (embedding / attention / MLP / norms),
  per-matrix shapes, a histogram of all weights and a parameter-count ladder.

Run:  python src/python/make_weights.py
"""
import os

import numpy as np

from common import (BLUE, IMG_DIR, RED, ZERO, load_backbone, load_sp,
                    named_weights, rnd, write_js)

GAMMA = 0.8  # colour = sign(w) * |w / 3sigma|^GAMMA (gentle brightening of mid values)
GAP = 8      # transparent pixels between blocks
LEVELS = 64  # colour levels per sign -> palette indices 0..128 (64 = zero)
TRANSPARENT = 2 * LEVELS + 1


def hex_rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float64)


C_NEG, C_ZERO, C_POS = hex_rgb(RED), hex_rgb(ZERO), hex_rgb(BLUE)


def palette():
    """RGB palette for indices 0..2*LEVELS (+ one transparent slot)."""
    pal = []
    for k in range(2 * LEVELS + 1):
        v = (k - LEVELS) / LEVELS
        a = abs(v) ** GAMMA
        tgt = C_POS if v >= 0 else C_NEG
        pal.append(np.round(C_ZERO + (tgt - C_ZERO) * a))
    pal.append(hex_rgb("#0f1115"))  # transparent slot (BG colour if alpha ignored)
    return np.array(pal, dtype=np.uint8)


def colorize(M, vmax):
    """M (h, w) -> palette indices (uint8) using the deck's diverging map."""
    v = np.clip(M / vmax, -1, 1)
    return np.round(v * LEVELS + LEVELS).astype(np.uint8)


def save_png(idx, name):
    from PIL import Image
    os.makedirs(IMG_DIR, exist_ok=True)
    path = os.path.join(IMG_DIR, name)
    im = Image.fromarray(idx)
    im.putpalette(palette().reshape(-1).tolist())
    im.save(path, optimize=True, transparency=TRANSPARENT)
    print(f"wrote {path} {idx.shape[1]}x{idx.shape[0]} ({os.path.getsize(path) / 1024:.0f} KB)")
    return path


def stats(M):
    s = float(M.std())
    return {
        "shape": list(M.shape), "n": int(M.size),
        "mean": float(M.mean()), "std": s,
        "min": float(M.min()), "max": float(M.max()),
        "absMax": float(np.abs(M).max()),
        "p01": float(np.percentile(M, 1)), "p99": float(np.percentile(M, 99)),
        "fracBeyond3Sigma": float(np.mean(np.abs(M) > 3 * s)),
    }


def grid(rows, rows_what, cols, cols_what, M):
    """Caption line 'rows x columns = weights'; asserts it really multiplies out to the matrix size."""
    assert rows * cols == M.size, (rows, cols, M.shape)
    return {"rows": [int(rows), rows_what], "cols": [int(cols), cols_what]}


def blocks_image(blocks, sx=1, sy=1, gap=GAP, axis=1, vmax=None):
    """Lay out 2-D blocks side by side (axis=1) or stacked (axis=0) with
    transparent gaps; each weight becomes an sy x sx pixel rectangle.
    Returns (palette-index image, offsets) where offsets[i] = (x, y) of block i."""
    imgs = []
    for B in blocks:
        im = colorize(B, vmax)
        im = np.repeat(np.repeat(im, sy, axis=0), sx, axis=1)
        imgs.append(im)
    offsets, parts = [], []
    pos = 0
    for k, im in enumerate(imgs):
        if k:
            shape = list(im.shape)
            shape[axis] = gap
            parts.append(np.full(shape, TRANSPARENT, dtype=np.uint8))
            pos += gap
        offsets.append((pos, 0) if axis == 1 else (0, pos))
        parts.append(im)
        pos += im.shape[axis]
    return np.concatenate(parts, axis=axis), offsets


def patch_at_max(M, size=16):
    r, c = np.unravel_index(np.argmax(np.abs(M)), M.shape)
    r0 = int(np.clip(r - size // 2, 0, M.shape[0] - size))
    c0 = int(np.clip(c - size // 2, 0, M.shape[1] - size))
    return r0, c0, M[r0:r0 + size, c0:c0 + size]


def main():
    sp = load_sp()
    bb = load_backbone("it")
    W = named_weights(bb)
    total = int(bb.count_params())
    del bb

    # ---------------- parameter breakdown ----------------
    groups = {"embedding": 0, "attention": 0, "mlp": 0, "norms": 0}
    per_matrix = {}
    for k, v in W.items():
        if k.startswith("token_embedding"):
            g = "embedding"
        elif k.endswith("/scale"):
            g = "norms"
        elif "/attention/" in k:
            g = "attention"
        elif "/ffw_" in k:
            g = "mlp"
        else:
            raise ValueError(k)
        groups[g] += v.size
        short = k.replace("decoder_block_0/", "layer/") if k.startswith("decoder_block_0/") else k
        if not k.startswith("decoder_block_") or k.startswith("decoder_block_0/"):
            per_matrix[short] = {"shape": list(v.shape), "n": int(v.size), "group": g}
    assert sum(groups.values()) == total, (groups, total)
    per_layer = sum(v["n"] for k, v in per_matrix.items() if k.startswith("layer/"))
    print("total", total, groups, "per layer", per_layer)

    # ---------------- histogram of all weights ----------------
    edges = np.linspace(-0.2, 0.2, 161)
    hist = {g: np.zeros(160, dtype=np.int64) for g in ("embedding", "attention", "mlp")}
    under = {g: 0 for g in hist}
    over = {g: 0 for g in hist}
    for k, v in W.items():
        if k.endswith("/scale"):
            continue
        g = "embedding" if k.startswith("token_embedding") else ("attention" if "/attention/" in k else "mlp")
        flat = v.ravel()
        hist[g] += np.histogram(flat, bins=edges)[0]
        under[g] += int((flat < edges[0]).sum())
        over[g] += int((flat > edges[-1]).sum())
    hist_all = sum(hist.values())
    allw = np.concatenate([v.ravel() for k, v in W.items() if not k.endswith("/scale")])
    all_stats = {"n": int(allw.size), "mean": float(allw.mean()), "std": float(allw.std()),
                 "min": float(allw.min()), "max": float(allw.max()),
                 "fracAbsBelow0.05": float(np.mean(np.abs(allw) < 0.05))}
    del allw

    mats = []

    # ---------------- 1. layer-0 query projection ----------------
    Q = W["decoder_block_0/attention/query/kernel"]  # (4 heads, 640 in, 256 out)
    vmax = 3 * float(Q.std())
    img, offs = blocks_image([Q[h] for h in range(4)], vmax=vmax)
    save_png(img, "w_query_l0.png")
    h_best = int(np.argmax([np.abs(Q[h]).max() for h in range(4)]))
    r0, c0, P = patch_at_max(Q[h_best])
    ox, oy = offs[h_best]
    n_heads, d_model, d_head = Q.shape
    mats.append({
        "id": "query_l0", "img": "assets/img/w_query_l0.png",
        "title": "W_Q: attention query matrix · layer 0 (the first of 18)",
        "desc": (f"Attention lets each token pull in context from earlier tokens. W_Q turns a token’s {d_model} "
                 f"coordinates into a {d_head}-number “query” (what am I looking for?) for each of {n_heads} heads, "
                 f"drawn as {n_heads} blocks. Each output number needs one weight per input number."),
        "grid": grid(d_model, "coordinates", n_heads * d_head, f"{n_heads} heads × {d_head}", Q),
        "layout": {"rows": "input feature (640)", "cols": "head h * 256 + query feature", "pxPerWeight": 1,
                   "blocks": [{"label": f"head {h}", "x": offs[h][0], "y": 0, "w": 256, "h": 640} for h in range(4)]},
        "width": int(img.shape[1]), "height": int(img.shape[0]),
        "vmax": vmax, "stats": stats(Q),
        "patch": {"head": h_best, "row0": r0, "col0": c0, "values": P,
                  "px": [ox + c0, oy + r0, 16, 16]},
    })

    # ---------------- 2. FFN gate crop ----------------
    L = 8
    G = W[f"decoder_block_{L}/ffw_gating/kernel"]  # (640 in, 2048 hidden)
    rows, cols = slice(0, 300), slice(0, 600)
    crop = G[rows, cols]
    vmax = 3 * float(G.std())
    img, _ = blocks_image([crop], sx=2, sy=2, vmax=vmax)
    save_png(img, f"w_ffn_gate_l{L}.png")
    r0, c0, P = patch_at_max(crop)
    mats.append({
        "id": f"ffn_gate_l{L}", "img": f"assets/img/w_ffn_gate_l{L}.png",
        "title": f"MLP gate matrix · layer {L} (mid-network)",
        "desc": (f"After attention, each token passes through a small neural network (the MLP) with {G.shape[1]:,} "
                 f"neurons. Each neuron reads all {G.shape[0]} coordinates, and the gate decides how strongly it "
                 f"switches on. Shown: only the top-left {crop.shape[0]} × {crop.shape[1]} corner "
                 f"({100 * crop.size / G.size:.0f}%)."),
        "grid": grid(G.shape[0], "coordinates", G.shape[1], "neurons", G),
        "layout": {"rows": "input feature 0-299", "cols": "hidden unit 0-599", "pxPerWeight": 2,
                   "crop": {"row0": 0, "col0": 0, "rows": 300, "cols": 600, "fullShape": list(G.shape)}},
        "width": int(img.shape[1]), "height": int(img.shape[0]),
        "vmax": vmax, "stats": stats(G),
        "patch": {"row0": r0, "col0": c0, "values": P, "px": [2 * c0, 2 * r0, 32, 32]},
    })

    # ---------------- 3. embedding rows for category words ----------------
    from make_embeddings import CATEGORIES, MAX_PER_CAT, single_token_id
    E = W["token_embedding/embeddings"]
    cat_blocks, cat_words = [], []
    for cat, (_, cands) in CATEGORIES.items():
        ids, ws = [], []
        for w in cands:
            t = single_token_id(sp, w)
            if t is not None and len(ids) < MAX_PER_CAT:
                ids.append(t)
                ws.append(w)
        cat_blocks.append(E[ids])
        cat_words.append((cat, ws, ids))
    allrows = np.concatenate(cat_blocks)
    vmax = 3 * float(E.std())
    img, offs = blocks_image(cat_blocks, sx=2, sy=2, gap=6, axis=0, vmax=vmax)
    save_png(img, "w_embed_slice.png")
    row_px = []
    for (cat, ws, ids), (ox, oy) in zip(cat_words, offs):
        for j, (w, i) in enumerate(zip(ws, ids)):
            row_px.append({"w": w, "id": int(i), "cat": cat, "y": oy + 2 * j, "h": 2})
    # Patch: the first 16 words of the first category (planets & space) x 16
    # features centred on the feature with the largest |mean| over the whole
    # vocabulary (a "shared" feature: same sign for almost every token).
    shared_dim = int(np.argmax(np.abs(E.mean(0))))
    c0 = int(np.clip(shared_dim - 8, 0, E.shape[1] - 16))
    r0 = 0
    P = allrows[r0:r0 + 16, c0:c0 + 16]
    mats.append({
        "id": "embed_slice", "img": "assets/img/w_embed_slice.png",
        "title": f"Embeddings: Gemma’s token lookup table ({100 * E.size / total:.0f}% of all weights)",
        "desc": (f"Gemma’s vocabulary has {E.shape[0]:,} tokens (words and word pieces). Each token is represented "
                 f"by {E.shape[1]} coordinates in vector space (a “meaning space”), all learned in training. "
                 f"Shown: {allrows.shape[0]} sample words, grouped by topic."),
        "grid": grid(E.shape[0], "tokens", E.shape[1], "coordinates", E),
        "layout": {"rows": "word (grouped by category)", "cols": "embedding feature (640)", "pxPerWeight": 2,
                   "rowsPx": row_px,
                   "groups": [{"cat": c, "y": oy, "h": 2 * len(ws)} for (c, ws, _), (_, oy) in zip(cat_words, offs)]},
        "width": int(img.shape[1]), "height": int(img.shape[0]),
        "vmax": vmax, "stats": stats(E),
        "sharedFeature": {"dim": shared_dim, "meanOverVocab": float(E[:, shared_dim].mean()),
                          "fracSameSign": float(np.mean(np.sign(E[:, shared_dim]) == np.sign(E[:, shared_dim].mean())))},
        "patch": {"row0": r0, "col0": c0, "values": P,
                  "rowsWords": [row_px[r0 + j]["w"] for j in range(16)],
                  "sharedCol": shared_dim - c0,
                  "px": [2 * c0, row_px[r0]["y"], 32, row_px[r0 + 15]["y"] + 2 - row_px[r0]["y"]]},
    })

    # ---------------- 4. last layer attention output projection ----------------
    O = W["decoder_block_17/attention/attention_output/kernel"]  # (4, 256, 640)
    vmax = 3 * float(O.std())
    blocks = [O[h].T for h in range(4)]  # each (640 out, 256 in)
    img, offs = blocks_image(blocks, vmax=vmax)
    save_png(img, "w_attn_out_l17.png")
    h_best = int(np.argmax([np.abs(O[h]).max() for h in range(4)]))
    r0, c0, P = patch_at_max(blocks[h_best])
    ox, oy = offs[h_best]
    n_heads, d_head, d_model = O.shape
    mats.append({
        "id": "attn_out_l17", "img": "assets/img/w_attn_out_l17.png",
        "title": "W_O: attention output matrix · layer 17 (the last of 18)",
        "desc": (f"Each of the {n_heads} heads (the {n_heads} blocks) returns {d_head} numbers of gathered context. "
                 f"W_O blends those {n_heads * d_head:,} numbers back into the token’s {d_model} coordinates, one of "
                 "the final steps before the next token is picked."),
        "grid": grid(d_model, "coordinates", n_heads * d_head, f"{n_heads} heads × {d_head}", O),
        "layout": {"rows": "output feature (640)", "cols": "head h * 256 + value feature", "pxPerWeight": 1,
                   "blocks": [{"label": f"head {h}", "x": offs[h][0], "y": 0, "w": 256, "h": 640} for h in range(4)]},
        "width": int(img.shape[1]), "height": int(img.shape[0]),
        "vmax": vmax, "stats": stats(O),
        "patch": {"head": h_best, "row0": r0, "col0": c0, "values": P, "px": [ox + c0, oy + r0, 16, 16]},
    })

    ladder = [
        {"name": "One neuron (Iris demo: w1, w2, b)", "params": 3, "year": None, "source": "this deck"},
        {"name": "2-2-2-2 'warp' network", "params": 21, "year": None, "source": "this deck (3 x (4 + 2) + 3)"},
        {"name": "LeNet-5", "params": 60000, "year": 1998, "approx": True,
         "source": "LeCun et al. 1998, Proc. IEEE ('60,000 trainable free parameters')"},
        {"name": "AlexNet", "params": 60_000_000, "year": 2012, "approx": True,
         "source": "Krizhevsky, Sutskever & Hinton 2012 ('60 million parameters')"},
        {"name": "BERT-base", "params": 110_000_000, "year": 2018, "approx": True, "source": "Devlin et al. 2018"},
        {"name": "Gemma 3 270M", "params": total, "year": 2025, "source": "counted here from the keras-hub preset"},
        {"name": "GPT-2", "params": 1_500_000_000, "year": 2019, "approx": True, "source": "Radford et al. 2019"},
        {"name": "Gemma 3 27B", "params": 27_000_000_000, "year": 2025, "approx": True,
         "source": "Gemma 3 Technical Report (Gemma Team, 2025)"},
        {"name": "GPT-3", "params": 175_000_000_000, "year": 2020, "approx": True, "source": "Brown et al. 2020"},
        {"name": "Llama 3.1 405B", "params": 405_000_000_000, "year": 2024, "approx": True,
         "source": "Llama Team, 'The Llama 3 Herd of Models', 2024"},
        {"name": "DeepSeek-V3 (mixture of experts; 37B active per token)", "params": 671_000_000_000,
         "year": 2024, "approx": True, "source": "DeepSeek-AI, DeepSeek-V3 Technical Report, 2024"},
    ]

    obj = {
        "model": "Gemma 3 270M instruction-tuned (keras-hub preset, stored in bfloat16, viewed as float32)",
        "totalParams": total,
        "breakdown": {g: int(n) for g, n in groups.items()},
        "breakdownPct": {g: round(100 * n / total, 3) for g, n in groups.items()},
        "breakdownNote": ("embedding = 262,144 x 640 token table (shared with the output layer); attention = Q, K, V, O "
                          "projections of 18 layers; mlp = gate, up, down projections of 18 layers; norms = RMSNorm "
                          "scales incl. QK-norm and the final norm."),
        "perLayer": {"params": int(per_layer), "layers": 18, "matrices": per_matrix},
        "config": {"vocab": 262144, "hidden": 640, "layers": 18, "queryHeads": 4, "kvHeads": 1, "headDim": 256,
                   "mlpHidden": 2048, "slidingWindow": 512, "globalLayers": [5, 11, 17]},
        "colormap": {"neg": RED, "zero": ZERO, "pos": BLUE, "scale": "symmetric +-3 sigma of each matrix, clipped",
                     "gamma": GAMMA, "mapping": "colour = lerp(zero, pos|neg, |w / vmax| ^ gamma)",
                     "levels": 2 * LEVELS + 1,
                     "transparent": "gaps between heads / groups are fully transparent (palette PNG with tRNS)"},
        "matrices": mats,
        "histogram": {"edges": [round(float(e), 4) for e in edges], "counts": {g: c.tolist() for g, c in hist.items()},
                      "all": hist_all.tolist(), "under": under, "over": over,
                      "note": "all 268,042,240 matrix weights (norm scales excluded); bin width 0.0025"},
        "allWeightStats": all_stats,
        "ladder": ladder,
        "source": "Computed offline from the cached keras-hub Gemma 3 270M instruct preset (Gemma terms of use: ai.google.dev/gemma/terms).",
    }
    write_js("weights", rnd(obj, 5), "weights.js")


if __name__ == "__main__":
    main()
