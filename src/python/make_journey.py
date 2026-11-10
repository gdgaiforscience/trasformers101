"""journey.js: real numbers for the "journey of hi" slide (the inference pipeline).

Everything is computed OFFLINE from the cached Gemma 3 270M instruction-tuned
keras-hub preset and its SentencePiece vocabulary:

- the chat-templated prompt for "hi" and its token IDs (what crosses PCIe),
- the full greedy reply, one decode step at a time, with the probability of
  each chosen token at T = 1, until the model emits <end_of_turn> or <eos>,
- turn 2 of the same chat: how many leading token IDs match what is already in
  the KV cache from turn 1 (prefix caching),
- model sizes: parameters, embedding table, KV-cache bytes per token,
- the tokenizer type (read from the SentencePiece model proto) and how long
  tokenization takes on this machine's CPU (median of many runs).

Run:  python src/python/make_journey.py      (offline, about 1 min on CPU)
"""
import os
import platform
import statistics
import time

import numpy as np

from common import (ROOT, SPECIAL_IDS, SPM_PATH, Logits, chat_prompt, encode,
                    load_backbone, load_sp, load_tokenizer, logsumexp,
                    piece_to_text, text_to_disp, write_js)

MAX_NEW = 40
TURN2 = "What is a transformer?"
BYTES_BF16 = 2


def cpu_name():
    try:
        with open("/proc/cpuinfo") as f:
            for line in f:
                if line.startswith("model name"):
                    return line.split(":", 1)[1].strip()
    except OSError:
        pass
    return platform.processor() or platform.machine()


def time_encode(sp, text, n=3000):
    """Median wall time of one SentencePiece encode call, in microseconds."""
    for _ in range(300):
        sp.EncodeAsIds(text)
    ts = []
    for _ in range(n):
        t0 = time.perf_counter_ns()
        sp.EncodeAsIds(text)
        ts.append(time.perf_counter_ns() - t0)
    return statistics.median(ts) / 1000.0


def tok(sp, i, p=None):
    t = piece_to_text(sp.IdToPiece(int(i)))
    e = {"id": int(i), "token": t, "disp": text_to_disp(t)}
    if p is not None:
        e["p"] = round(float(p), 4)
    return e


def main():
    sp = load_sp()
    tk = load_tokenizer()

    # ---------------------------------------------------------------- tokenizer facts
    from sentencepiece import sentencepiece_model_pb2 as pb
    proto = pb.ModelProto()
    with open(SPM_PATH, "rb") as f:
        proto.ParseFromString(f.read())
    model_type = pb.TrainerSpec.ModelType.Name(proto.trainer_spec.model_type)
    byte_fallback = bool(proto.trainer_spec.byte_fallback)

    # ---------------------------------------------------------------- turn 1 prompt
    text = chat_prompt("hi")
    ids = encode(tk, text, add_bos=True)
    sp_ids = [SPECIAL_IDS["bos"]] + list(sp.EncodeAsIds(text))
    assert sp_ids == ids, (sp_ids, ids)          # raw SentencePiece == keras-hub tokenizer

    # a longer, natural prompt for the timing comparison: the start of the talk script
    with open(os.path.join(ROOT, "TALK_SCRIPT.md"), encoding="utf-8") as f:
        script = f.read()
    long_text = script[:4200]
    long_n = len(sp.EncodeAsIds(long_text))
    timing = {
        "cpu": cpu_name(),
        "lib": "sentencepiece " + __import__("sentencepiece").__version__ + " (Python binding, 1 thread)",
        "hiTokens": len(ids) - 1,
        "hiMicros": round(time_encode(sp, text), 1),
        "longTokens": long_n,
        "longMicros": round(time_encode(sp, long_text, n=1000), 1),
    }

    # ---------------------------------------------------------------- the model
    bb = load_backbone("it")
    cfg = bb.get_config()
    params = int(bb.count_params())
    lg = Logits(bb, max_len=64)

    cur = list(ids)
    steps, stop = [], None
    for _ in range(MAX_NEW):
        z = lg(cur)                                   # float64 logits over all 262,144 tokens
        p = np.exp(z - logsumexp(z))                  # softmax at T = 1
        order = np.argsort(-z)[:3]
        nxt = int(order[0])                           # greedy = argmax
        e = tok(sp, nxt, p[nxt])
        e["alt"] = [tok(sp, i, p[i]) for i in order[1:3]]
        if nxt in (SPECIAL_IDS["end_of_turn"], SPECIAL_IDS["eos"]):
            stop = e
            break
        steps.append(e)
        cur.append(nxt)                               # the new ID goes straight back in
    reply = "".join(s["token"] for s in steps)

    # ---------------------------------------------------------------- turn 2 (prefix caching)
    # Gemma 3 chat template: '<start_of_turn>' + role + '\n' + content|trim + '<end_of_turn>\n'
    hist = ("<start_of_turn>user\nhi<end_of_turn>\n<start_of_turn>model\n"
            f"{reply.strip()}<end_of_turn>\n" + chat_prompt(TURN2))
    ids2 = encode(tk, hist, add_bos=True)
    cached = cur      # every token whose keys/values were computed in turn 1 (the stop token is never fed back)
    reuse = 0
    while reuse < min(len(cached), len(ids2)) and cached[reuse] == ids2[reuse]:
        reuse += 1

    layers, kvh, hd = cfg["num_layers"], cfg["num_key_value_heads"], cfg["head_dim"]
    kv_per_tok = 2 * layers * kvh * hd * BYTES_BF16
    vocab, hidden = cfg["vocabulary_size"], cfg["hidden_dim"]
    obj = {
        "model": "Gemma 3 270M instruction-tuned (gemma3_instruct_270m, keras-hub preset v4)",
        "config": {"vocab": vocab, "layers": layers, "hidden": hidden, "qHeads": cfg["num_query_heads"],
                   "kvHeads": kvh, "headDim": hd, "ffn": cfg["intermediate_dim"],
                   "slidingWindow": cfg["sliding_window_size"]},
        "params": params,
        "weightsBytesBf16": params * BYTES_BF16,
        "embedNumbers": vocab * hidden,
        "kvBytesPerToken": kv_per_tok,
        "kvNote": "2 (K and V) x layers x KV heads x head_dim x 2 bytes, assuming bf16",
        "logitsBytesF32": vocab * 4,
        "tokenizer": {"type": model_type, "byteFallback": byte_fallback, "pieces": len(proto.pieces)},
        "timing": timing,
        "prompt": {"text": "hi", "templated": text, "ids": ids, "tokens": [tok(sp, i)["token"] for i in ids],
                   "bytesInt32": 4 * len(ids)},
        "reply": {"text": reply, "steps": steps, "stop": stop, "passes": len(steps) + 1,
                  "rule": "greedy (argmax) at T = 1 probabilities, until <end_of_turn> or <eos>"},
        "turn2": {"user": TURN2, "text": hist, "ids": ids2, "total": len(ids2), "cached": len(cached),
                  "reused": reuse, "new": len(ids2) - reuse},
        "source": ("Computed offline with keras-hub (JAX backend, float32) from the cached Gemma 3 270M "
                   "instruction-tuned preset; tokenizer timing measured on the build machine. "
                   "Gemma terms of use: ai.google.dev/gemma/terms"),
    }
    print(f"params={params:,} kv/token={kv_per_tok} B tokenizer={model_type} byte_fallback={byte_fallback}")
    print(f"prompt ids={ids}")
    print(f"reply={reply!r} ({len(steps)} tokens) stop={stop and stop['token']!r} p={stop and stop['p']}")
    print("steps:", [(s['disp'], s['id'], s['p']) for s in steps])
    print(f"turn2: total={len(ids2)} reused={reuse} new={len(ids2) - reuse}")
    print(f"timing: {timing}")
    write_js("journey", obj, "journey.js")


if __name__ == "__main__":
    main()
