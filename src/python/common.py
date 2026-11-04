"""Shared helpers for the data builders of the "Inside the Black Box" deck.

Every data file is a plain JS file that the deck loads with a <script> tag
(works on file://, no fetch):

    window.AIDATA = window.AIDATA || {}; AIDATA.<key> = {...};

All Gemma work is OFFLINE: the cached keras-hub presets are loaded from local
directories with KERAS_BACKEND=jax. Gemma 3 270M is Gemini's small open-weights
sibling, not Gemini itself.
"""
import json
import math
import os
import re

os.environ.setdefault("KERAS_BACKEND", "jax")
os.environ.setdefault("MPLCONFIGDIR", "/tmp/mplconfig_state_of_ai")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import numpy as np  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))  # state_of_ai/
DATA_DIR = os.path.join(ROOT, "data")
IMG_DIR = os.path.join(ROOT, "assets", "img")
CACHE_DIR = os.path.join(HERE, "_cache")  # small intermediate files

_KAGGLE = os.path.expanduser("~/.cache/kagglehub/models/keras/gemma3/keras")
PT_PRESET = os.path.join(_KAGGLE, "gemma3_270m", "3")
IT_PRESET = os.path.join(_KAGGLE, "gemma3_instruct_270m", "4")
SPM_PATH = os.path.join(IT_PRESET, "assets", "tokenizer", "vocabulary.spm")

MODEL_NAME = "Gemma 3 270M (keras-hub preset, run offline)"

# Style-guide colours (DESIGN.md section 1).
BG = "#0f1115"
TEXT = "#ECEFF4"
MUTED = "#9AA4B2"
GRID = "#2A3140"
BLUE = "#58C4DD"
ORANGE = "#F0AC5F"
YELLOW = "#FFD54F"
TEAL = "#5CD0B3"
GREEN = "#83C167"
RED = "#FC6255"
PURPLE = "#9A72AC"
PINK = "#E07A9F"
ZERO = "#1a1d24"

SPECIAL_IDS = {"pad": 0, "eos": 1, "bos": 2, "end_of_turn": 106}


# --------------------------------------------------------------------------
# JS writing
# --------------------------------------------------------------------------
def rnd(obj, nd=4):
    """Recursively round floats (keeps files small); NaN/inf -> None."""
    if isinstance(obj, float) or isinstance(obj, np.floating):
        v = float(obj)
        if not math.isfinite(v):
            return None
        r = round(v, nd)
        return 0.0 if r == 0 else r
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, np.ndarray):
        return rnd(obj.tolist(), nd)
    if isinstance(obj, dict):
        return {k: rnd(v, nd) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [rnd(v, nd) for v in obj]
    return obj


def write_js(key, obj, filename=None, header=None):
    """Write AIDATA.<key> = <json>; to data/<filename>. Returns the path.

    ensure_ascii=True so the file is pure ASCII and decodes identically no
    matter which charset the browser assumes for a file:// script.
    """
    os.makedirs(DATA_DIR, exist_ok=True)
    filename = filename or f"{key}.js"
    path = os.path.join(DATA_DIR, filename)
    body = json.dumps(obj, ensure_ascii=True, separators=(",", ":"),
                      allow_nan=False)
    with open(path, "w", encoding="ascii") as f:
        if header:
            for line in header.strip().splitlines():
                f.write(f"// {line}\n")
        f.write("window.AIDATA = window.AIDATA || {}; ")
        f.write(f"AIDATA.{key} = {body};\n")
    print(f"wrote {path} ({os.path.getsize(path) / 1024:.1f} KB)")
    return path


# --------------------------------------------------------------------------
# Tokenizer helpers
# --------------------------------------------------------------------------
def load_sp():
    """Raw SentencePiece processor for the Gemma 3 vocabulary."""
    import sentencepiece as spm
    sp = spm.SentencePieceProcessor()
    sp.Load(SPM_PATH)
    return sp


_BYTE_RE = re.compile(r"^<0x([0-9A-Fa-f]{2})>$")


def piece_to_text(piece):
    """SentencePiece piece -> the text it contributes ('\u2581' -> ' ')."""
    m = _BYTE_RE.match(piece)
    if m:
        b = int(m.group(1), 16)
        return chr(b) if b < 128 else f"<0x{m.group(1).upper()}>"
    return piece.replace("\u2581", " ")


def text_to_disp(text):
    """Make invisible characters visible for on-screen labels."""
    return (text.replace("\n", "\u21b5").replace("\t", "\u21e5")
            .replace("\r", "\u240d"))


# --------------------------------------------------------------------------
# Model helpers
# --------------------------------------------------------------------------
def load_backbone(which="it"):
    import keras_hub
    preset = IT_PRESET if which == "it" else PT_PRESET
    return keras_hub.models.Gemma3Backbone.from_preset(preset)


def load_tokenizer():
    import keras_hub
    return keras_hub.models.Gemma3Tokenizer(proto=SPM_PATH)


def named_weights(backbone):
    """{variable path: float32 numpy array} for every backbone variable."""
    out = {}
    for v in backbone.weights:
        out[v.path] = np.asarray(v.numpy(), dtype=np.float32)
    return out


def chat_prompt(user_text):
    """Gemma chat template for a single user turn (BOS is added separately)."""
    return (f"<start_of_turn>user\n{user_text}<end_of_turn>\n"
            "<start_of_turn>model\n")


def encode(tokenizer, text, add_bos=True):
    ids = [int(i) for i in np.asarray(tokenizer(text)).tolist()]
    if add_bos:
        ids = [SPECIAL_IDS["bos"]] + ids
    return ids


class Logits:
    """Fixed-shape (jit-friendly) full forward pass -> next-token logits."""

    def __init__(self, backbone, max_len=64):
        import jax
        import keras
        self.bb = backbone
        self.max_len = max_len
        self.keras = keras

        def fwd(token_ids, padding_mask):
            h = backbone({"token_ids": token_ids, "padding_mask": padding_mask})
            return backbone.token_embedding(h, reverse=True)

        self._fwd = jax.jit(fwd)

    def __call__(self, ids):
        n = len(ids)
        assert n <= self.max_len, (n, self.max_len)
        tok = np.zeros((1, self.max_len), dtype="int32")
        msk = np.zeros((1, self.max_len), dtype="int32")
        tok[0, :n] = ids
        msk[0, :n] = 1
        out = self._fwd(tok, msk)
        return np.asarray(out[0, n - 1], dtype=np.float64)


def logsumexp(x):
    m = np.max(x)
    return float(m + np.log(np.sum(np.exp(x - m))))
