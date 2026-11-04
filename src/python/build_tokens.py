"""Tokenize example strings with the real Gemma 3 / Gemini 2.0 SentencePiece vocabulary
and write data/tokens.js for the "Everything is numbers" slide.

Usage: python src/python/build_tokens.py
"""
import json
import pathlib

import sentencepiece as spm

ROOT = pathlib.Path(__file__).resolve().parents[2]
VOCAB = pathlib.Path.home() / (".cache/kagglehub/models/keras/gemma3/keras/"
                               "gemma3_instruct_270m/4/assets/tokenizer/vocabulary.spm")
EXAMPLES = [
    "The wombat crossed the road because it was hungry.",
    "Mitochondria are the powerhouse of the cell.",
    "hi", "Hi", " hi", "strawberry", "Deoxyribonucleic acid", "9.11 vs 9.9",
    "G'day mate", "こんにちは", "🦘", "E = mc²",
]
CHAT_HI = [2, 105, 2364, 107, 2202, 106, 107, 105, 4368, 107]


def main() -> None:
    sp = spm.SentencePieceProcessor(model_file=str(VOCAB))
    out = {"vocab_size": sp.get_piece_size(), "examples": [], "chat_hi": []}
    for s in EXAMPLES:
        ids = sp.encode(s)
        out["examples"].append({"text": s, "ids": ids,
                                "pieces": [sp.id_to_piece(i).replace("\u2581", " ") for i in ids]})
    out["chat_hi"] = [{"id": i, "piece": sp.id_to_piece(i).replace("\u2581", " ")} for i in CHAT_HI]
    js = "window.AIDATA = window.AIDATA || {}; AIDATA.tokens = " + json.dumps(out, ensure_ascii=False) + ";\n"
    (ROOT / "data" / "tokens.js").write_text(js, encoding="utf-8")
    for e in out["examples"]:
        print(f"{e['text']!r:40} {e['ids']}")


if __name__ == "__main__":
    main()
