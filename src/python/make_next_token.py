"""next_token.js: real Gemma 3 270M next-token distributions.

For each prompt we store the raw logits of the top-40 tokens plus the
full-vocabulary log-sum-exp of logits/T for T = 0.10 ... 3.00 (step 0.05), so
the browser can renormalise EXACTLY at any of those temperatures:

    p_i(T) = exp(logit_i / T - lse[T])        (sum over all 262,144 tokens = 1)

The remaining probability mass (1 - sum of the top-40) is the "everything
else" bar. A greedy continuation (argmax, up to 20 tokens, stop at
<end_of_turn>/<eos>/newline) is included for each prompt.

Run:  python src/python/make_next_token.py      (offline, ~3 min on CPU)
"""
import time

import numpy as np

from common import (MODEL_NAME, SPECIAL_IDS, Logits, chat_prompt, encode,
                    load_backbone, load_sp, load_tokenizer, logsumexp,
                    piece_to_text, rnd, text_to_disp, write_js)

TOPK = 40
TEMPS = [round(0.10 + 0.05 * i, 2) for i in range(59)]  # 0.10 ... 3.00
MAX_NEW = 20

PROMPTS = [
    # id, label, prompt, model, templated
    ("hi", "hi (chat)", "hi", "it", True),
    ("gold", "Chemical symbol for gold", "The chemical symbol for gold is", "pt", False),
    ("dna", "DNA bases", "DNA is made of four bases: adenine, thymine, guanine and", "pt", False),
    ("star", "Closest star", "The closest star to the Sun is", "pt", False),
    ("water", "Water", "Water is made of hydrogen and", "pt", False),
    ("mito", "Mitochondria", "The mitochondria is the", "pt", False),
    ("emc", "E = mc...", "E = mc", "pt", False),
    ("reef", "Great Barrier Reef", "The Great Barrier Reef is located off the coast of", "pt", False),
    ("planet", "Largest planet", "The largest planet in our solar system is", "pt", False),
    # Extra contrast: the PRETRAINED model given a bare "hi" (no chat template).
    ("hi_pt", "hi (pretrained, no template)", "hi", "pt", False),
]


def tok_entry(sp, i, logit=None):
    t = piece_to_text(sp.IdToPiece(int(i)))
    e = {"token": t, "disp": text_to_disp(t), "id": int(i)}
    if logit is not None:
        e["logit"] = round(float(logit), 6)  # 6 dp: exact renormalisation down to T = 0.10
    return e


def run_prompt(lg, sp, tok, pid, label, prompt, model, templated):
    text = chat_prompt(prompt) if templated else prompt
    ids = encode(tok, text, add_bos=True)
    z = lg(ids)  # float64 logits over the full vocabulary
    order = np.argsort(-z)[:TOPK]
    lse = {f"{T:.2f}": round(logsumexp(z / T), 6) for T in TEMPS}
    p1 = np.exp(z - logsumexp(z))

    # Greedy continuation.
    cur = list(ids)
    gen, stop = [], "max"
    for _ in range(MAX_NEW):
        zz = z if not gen else lg(cur)
        nxt = int(np.argmax(zz))
        piece_txt = piece_to_text(sp.IdToPiece(nxt))
        if nxt == SPECIAL_IDS["end_of_turn"]:
            stop = "end_of_turn"
            break
        if nxt == SPECIAL_IDS["eos"]:
            stop = "eos"
            break
        if "\n" in piece_txt:
            stop = "newline"
            break
        gen.append(nxt)
        cur.append(nxt)
    greedy = "".join(piece_to_text(sp.IdToPiece(i)) for i in gen)

    entry = {
        "id": pid,
        "label": label,
        "prompt": prompt,
        "model": model,
        "templated": templated,
        "fullText": text,
        "promptIds": ids,
        "promptTokens": [tok_entry(sp, i)["token"] for i in ids],
        "topk": [tok_entry(sp, i, z[i]) for i in order],
        "lse": lse,
        "greedy": greedy,
        "greedyTokens": [tok_entry(sp, i) for i in gen],
        "greedyStop": stop,
        "top40MassT1": round(float(p1[order].sum()), 6),
        "maxLogit": round(float(z.max()), 4),
    }
    top3 = [(sp.IdToPiece(int(i)), f"{100 * p1[i]:.2f}%") for i in order[:3]]
    print(f"[{pid}] {model} top3={top3} greedy={greedy!r} ({stop})")
    return entry


def main():
    sp = load_sp()
    tok = load_tokenizer()
    results = {}
    for which in ("it", "pt"):
        t0 = time.time()
        bb = load_backbone(which)
        lg = Logits(bb, max_len=64)
        print(f"loaded {which} in {time.time() - t0:.1f}s")
        for p in PROMPTS:
            if p[3] == which:
                results[p[0]] = run_prompt(lg, sp, tok, *p)
        del lg, bb

    obj = {
        "model": MODEL_NAME,
        "models": {
            "it": "Gemma 3 270M instruction-tuned (gemma3_instruct_270m, keras-hub preset v4)",
            "pt": "Gemma 3 270M pretrained (gemma3_270m, keras-hub preset v3)",
        },
        "vocabSize": 262144,
        "temps": TEMPS,
        "topkN": TOPK,
        "howTo": ("p_i(T) = exp(logit_i/T - lse[T.toFixed(2)]); lse is the log-sum-exp "
                  "of logits/T over ALL 262,144 tokens, so 1 - sum(top-40 p) is the "
                  "mass of every other token. token = decoded piece ('\u2581' -> space); "
                  "disp = token with newline shown as \u21b5."),
        "greedyRule": "argmax at T->0, up to 20 tokens, stopping before <end_of_turn>, <eos> or a newline",
        "prompts": [results[p[0]] for p in PROMPTS],
        "source": ("Computed offline with keras-hub 0.30 (JAX backend, float32) from the "
                   "cached Gemma 3 270M presets. Gemma is Gemini's open-weights sibling, "
                   "not Gemini itself. Gemma terms of use: ai.google.dev/gemma/terms"),
    }
    write_js("nextToken", obj, "next_token.js")


if __name__ == "__main__":
    main()
