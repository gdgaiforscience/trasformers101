"""embeddings.js: real Gemma 3 270M token embeddings for ~250 words.

* Words are kept only if " word" is ONE token in Gemma's 262,144-token vocab
  (the '\u2581word' piece), checked with the real SentencePiece model.
* 2-D maps: PCA and t-SNE (scikit-learn, cosine geometry) of the 640-D input
  embedding rows of those words.
* Nearest neighbours: cosine similarity against the FULL input embedding
  matrix (262,144 x 640). Cleaning: drop control/unused/byte tokens, pieces
  that are not word-like (punctuation, mid-word fragments), the word itself
  and its case/space variants, and duplicate variants of the same neighbour.
* Analogies: 3CosAdd (b - a + c over unit vectors), excluding a, b, c and
  their variants, over the same cleaned vocabulary; reported honestly.

Run:  python src/python/make_embeddings.py [--probe]
"""
import re
import sys
import unicodedata

import numpy as np

from common import (BLUE, GREEN, ORANGE, PINK, PURPLE, RED, TEAL, TEXT,
                    YELLOW, load_backbone, load_sp, named_weights, rnd,
                    write_js)

CATEGORIES = {
    # name: (colour, candidate words in preference order)
    "planets & space": (YELLOW, [
        "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus",
        "Neptune", "Pluto", "Moon", "Sun", "comet", "asteroid", "galaxy",
        "star", "planet", "orbit", "meteor", "nebula", "telescope", "universe",
        "eclipse", "satellite"]),
    "chemical elements": (TEAL, [
        "hydrogen", "helium", "lithium", "carbon", "nitrogen", "oxygen",
        "sodium", "magnesium", "aluminum", "silicon", "phosphorus", "sulfur",
        "chlorine", "potassium", "calcium", "iron", "copper", "zinc",
        "silver", "gold", "lead", "uranium", "platinum", "nickel", "cobalt",
        "titanium", "neon", "argon", "tin", "mercury"]),
    "animals": (GREEN, [
        "dog", "cat", "horse", "cow", "pig", "sheep", "lion", "tiger",
        "elephant", "giraffe", "zebra", "monkey", "wolf", "fox", "bear",
        "rabbit", "mouse", "eagle", "owl", "shark", "whale", "dolphin",
        "snake", "frog", "bee", "spider", "penguin", "kangaroo"]),
    "countries": (BLUE, [
        "France", "Germany", "Italy", "Spain", "Japan", "China", "India",
        "Brazil", "Canada", "Mexico", "Russia", "Egypt", "Kenya", "Nigeria",
        "Australia", "Argentina", "Sweden", "Norway", "Greece", "Turkey",
        "Peru", "Chile", "Poland", "Portugal", "Ireland", "Vietnam"]),
    "cities": ("#8FA8FF", [
        "Paris", "London", "Berlin", "Rome", "Madrid", "Tokyo", "Beijing",
        "Delhi", "Moscow", "Cairo", "Sydney", "Toronto", "Chicago", "Boston",
        "Athens", "Lisbon", "Dublin", "Vienna", "Prague", "Seoul", "Bangkok",
        "Nairobi", "Lima", "Oslo", "Stockholm", "Warsaw"]),
    "emotions": (PINK, [
        "happy", "sad", "angry", "afraid", "joy", "fear", "anger", "love",
        "hate", "calm", "anxious", "excited", "proud", "jealous", "lonely",
        "surprised", "bored", "grateful", "guilty", "ashamed", "hopeful",
        "nervous", "disgust", "sorrow"]),
    "numbers": (ORANGE, [
        "one", "two", "three", "four", "five", "six", "seven", "eight",
        "nine", "ten", "eleven", "twelve", "twenty", "thirty", "fifty",
        "hundred", "thousand", "million", "billion", "zero", "dozen"]),
    "colours": (RED, [
        "red", "orange", "yellow", "green", "blue", "purple", "pink",
        "brown", "black", "white", "gray", "violet", "cyan", "magenta",
        "crimson", "scarlet", "turquoise", "beige", "maroon", "indigo",
        "lavender"]),
    "body parts": ("#C9A27E", [
        "head", "hand", "foot", "arm", "leg", "eye", "ear", "nose", "mouth",
        "heart", "brain", "lung", "liver", "kidney", "stomach", "skin",
        "bone", "finger", "knee", "shoulder", "neck", "tooth", "blood"]),
    "sciences": (PURPLE, [
        "physics", "chemistry", "biology", "geology", "astronomy",
        "mathematics", "ecology", "genetics", "medicine", "psychology",
        "economics", "statistics", "engineering", "botany", "zoology",
        "anatomy", "optics", "calculus", "algebra", "geometry",
        "neuroscience", "thermodynamics", "linguistics"]),
    "verbs": (TEXT, [
        "run", "walk", "jump", "swim", "eat", "drink", "sleep", "think",
        "read", "write", "speak", "sing", "dance", "build", "break", "grow",
        "fly", "fall", "push", "pull", "give", "take", "see", "hear"]),
}
MAX_PER_CAT = 23

ANALOGIES = [
    # a : b :: c : expect      (computed as b - a + c)
    ("man", "king", "woman", "queen"),
    ("France", "Paris", "Japan", "Tokyo"),
    ("France", "Paris", "Italy", "Rome"),
    ("Germany", "Berlin", "Egypt", "Cairo"),
    ("Na", "sodium", "K", "potassium"),
    ("Fe", "iron", "Cu", "copper"),
    ("gold", "Au", "silver", "Ag"),
    ("hydrogen", "H", "oxygen", "O"),
    ("Earth", "Moon", "Mars", "Phobos"),
    ("physics", "physicist", "chemistry", "chemist"),
    ("walk", "walked", "swim", "swam"),
    ("big", "bigger", "small", "smaller"),
    ("cat", "kitten", "dog", "puppy"),
    ("brother", "sister", "boy", "girl"),
    ("one", "two", "three", "four"),
    ("heart", "cardiology", "brain", "neurology"),
    ("electron", "negative", "proton", "positive"),
    ("Celsius", "temperature", "kilogram", "mass"),
]

NO_SPACE_SCRIPTS = ("CJK", "HIRAGANA", "KATAKANA", "HANGUL", "THAI")
WORD_RE = re.compile(r"[^\W_]+(?:['\u2019\-][^\W_]+)*")


def no_space_script(ch):
    try:
        name = unicodedata.name(ch)
    except ValueError:
        return False
    return name.startswith(NO_SPACE_SCRIPTS)


def classify_vocab(sp):
    """Return (clean mask, single-capital mask, display list, key list)."""
    V = sp.GetPieceSize()
    clean = np.zeros(V, dtype=bool)
    caps = np.zeros(V, dtype=bool)  # '\u2581O', '\u2581K', ... (element symbols)
    disp, key = [], []
    for i in range(V):
        p = sp.IdToPiece(i)
        t = p.replace("\u2581", " ")
        core = t.strip()
        disp.append(core)
        key.append(core.lower())
        if sp.IsControl(i) or sp.IsUnknown(i) or sp.IsByte(i):
            continue
        if p.startswith("<") and p.endswith(">"):
            continue
        if not core or "\u2581" in p[1:] or " " in core:
            continue
        if not WORD_RE.fullmatch(core):
            continue
        if not (p.startswith("\u2581") or no_space_script(core[0])):
            continue  # mid-word fragment (or a start-of-text variant)
        if len(core) < 2 and not core.isdigit() and not no_space_script(core[0]):
            if len(core) == 1 and "A" <= core <= "Z" and p.startswith("\u2581"):
                caps[i] = True
            continue
        clean[i] = True
    return clean, caps, disp, key


def single_token_id(sp, word):
    ids = sp.EncodeAsIds(" " + word)
    if len(ids) == 1 and sp.IdToPiece(ids[0]) == "\u2581" + word:
        return ids[0]
    return None


def topk_clean(scores, clean, key, exclude_keys, k=8, pool=400):
    idx = np.argpartition(-scores, pool)[:pool]
    idx = idx[np.argsort(-scores[idx])]
    out, seen = [], set(exclude_keys)
    for i in idx:
        if not clean[i] or key[i] in seen:
            continue
        seen.add(key[i])
        out.append(int(i))
        if len(out) == k:
            break
    return out


def scale_unit(xy):
    xy = xy - xy.mean(0)
    return xy / np.abs(xy).max()


def main(probe=False):
    sp = load_sp()
    bb = load_backbone("it")
    E = named_weights(bb)["token_embedding/embeddings"].astype(np.float32)
    del bb
    En = E / np.linalg.norm(E, axis=1, keepdims=True)
    clean, caps, disp, key = classify_vocab(sp)
    ana_ok = clean | caps  # analogy answers may be element symbols like O, K
    print("clean vocab:", int(clean.sum()), "of", len(clean), "+ single capitals:", int(caps.sum()))

    words, dropped = [], {}
    for cat, (col, cands) in CATEGORIES.items():
        n = 0
        for w in cands:
            tid = single_token_id(sp, w)
            if tid is None:
                dropped.setdefault(cat, []).append(w)
                continue
            if n < MAX_PER_CAT:
                words.append({"w": w, "piece": sp.IdToPiece(tid), "id": tid,
                              "cat": cat})
                n += 1
    print("words:", len(words), "dropped (multi-token):", dropped)

    ids = np.array([d["id"] for d in words])
    S = En[ids] @ En.T  # (n_words, V) cosine similarities
    for d, srow in zip(words, S):
        nn = topk_clean(srow, clean, key, {d["w"].lower()}, k=8)
        d["nn"] = [disp[i] for i in nn]
        d["nnSim"] = [round(float(srow[i]), 3) for i in nn]
        d["nnId"] = nn
    if probe:
        for d in words:
            if d["w"] in ("Jupiter", "gold", "dog", "Paris", "happy", "seven",
                          "physics", "red", "heart", "run", "oxygen"):
                srow = S[[x["w"] for x in words].index(d["w"])]
                raw = np.argsort(-srow)[:25]
                print(d["w"], "RAW:", [(sp.IdToPiece(int(i)), round(float(srow[i]), 3)) for i in raw])
                print(d["w"], "CLEAN:", list(zip(d["nn"], d["nnSim"])))

    # 2-D maps.
    from sklearn.decomposition import PCA
    from sklearn.manifold import TSNE
    X = En[ids].astype(np.float64)
    Xc = X - X.mean(0)
    pca = PCA(n_components=2, random_state=0).fit(Xc)
    P = scale_unit(pca.transform(Xc))
    ts = TSNE(n_components=2, perplexity=18, metric="cosine", init="pca",
              learning_rate="auto", max_iter=3000, random_state=0)
    T = scale_unit(ts.fit_transform(X))
    for d, p, t in zip(words, P, T):
        d["pca"] = [round(float(p[0]), 4), round(float(p[1]), 4)]
        d["tsne"] = [round(float(t[0]), 4), round(float(t[1]), 4)]

    # Category purity of t-SNE / PCA neighbourhoods (k=5), as a sanity metric.
    def purity(Y):
        from sklearn.neighbors import NearestNeighbors
        nbr = NearestNeighbors(n_neighbors=6).fit(Y)
        _, I = nbr.kneighbors(Y)
        cats = np.array([d["cat"] for d in words])
        return float(np.mean(cats[I[:, 1:]] == cats[:, None]))
    pur = {"pca": purity(P), "tsne": purity(T), "full640": None}
    from sklearn.neighbors import NearestNeighbors
    nbr = NearestNeighbors(n_neighbors=6, metric="cosine").fit(X)
    _, I = nbr.kneighbors(X)
    cats = np.array([d["cat"] for d in words])
    pur["full640"] = float(np.mean(cats[I[:, 1:]] == cats[:, None]))
    print("5-NN category purity:", pur)

    # Analogies.
    results = []
    for a, b, c, expect in ANALOGIES:
        ia, ib, ic = (single_token_id(sp, x) for x in (a, b, c))
        ie = single_token_id(sp, expect)
        if None in (ia, ib, ic):
            results.append({"a": a, "b": b, "c": c, "expect": expect,
                            "skipped": "an input word is not a single token"})
            continue
        q = En[ib] - En[ia] + En[ic]
        q = q / np.linalg.norm(q)
        sc = En @ q
        excl = {a.lower(), b.lower(), c.lower()}
        top = topk_clean(sc, ana_ok, key, excl, k=5, pool=2000)
        rank = None
        if ie is not None:
            # Rank of the expected word among cleaned candidates.
            order = np.argsort(-sc)
            r, seen = 0, set(excl)
            for i in order[:50000]:
                if not ana_ok[i] or key[i] in seen:
                    continue
                seen.add(key[i])
                r += 1
                if key[i] == expect.lower():
                    rank = r
                    break
        res = {"a": a, "b": b, "c": c, "expect": expect,
               "top5": [disp[i] for i in top],
               "top5Sim": [round(float(sc[i]), 3) for i in top],
               "hit": bool(top and key[top[0]] == expect.lower()),
               "inTop5": bool(any(key[i] == expect.lower() for i in top)),
               "rank": rank,
               "expectSingleToken": ie is not None}
        results.append(res)
        print(f"{b} - {a} + {c} = {res['top5']}  expect {expect}: hit={res['hit']} rank={rank}")

    cats_out = {cat: col for cat, (col, _) in CATEGORIES.items()}
    obj = {
        "model": "Gemma 3 270M instruction-tuned: input embedding matrix (262,144 x 640, tied with the output layer)",
        "dim": int(E.shape[1]),
        "vocabSize": int(E.shape[0]),
        "words": [{k: d[k] for k in ("w", "piece", "id", "cat", "pca", "tsne", "nn", "nnSim")}
                  for d in words],
        "categories": cats_out,
        "analogies": results,
        "analogyMethod": ("3CosAdd: nearest token to unit(b) - unit(a) + unit(c) among the cleaned vocabulary plus "
                          "single capital letters (so symbols like O or K can win), excluding a, b, c and their "
                          "case/space variants; hit = expected word ranked 1st, rank = its position"),
        "nnMethod": ("cosine similarity over all 262,144 rows; cleaned = word-initial (\u2581) tokens of letters/digits "
                     "(plus CJK/Thai/kana/Hangul words, which have no leading space), length >= 2 unless a digit; "
                     "the word itself, case/space variants and duplicate variants removed; shown without the leading space"),
        "pcaExplainedVariance": [round(float(v), 4) for v in pca.explained_variance_ratio_],
        "tsne": {"perplexity": 18, "metric": "cosine", "init": "pca", "random_state": 0},
        "categoryPurity5NN": {k: round(v, 3) for k, v in pur.items()},
        "coords": "pca and tsne are centred and scaled to [-1, 1]",
        "droppedMultiToken": dropped,
        "source": "Computed offline from the cached keras-hub Gemma 3 270M instruct preset (Gemma terms of use: ai.google.dev/gemma/terms).",
    }
    write_js("embeddings", obj, "embeddings.js")


if __name__ == "__main__":
    main(probe="--probe" in sys.argv)
