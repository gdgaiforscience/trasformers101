"""warpnet.js: a tiny 2-2-2-2 tanh network (numpy) that untangles two moons.

    h1 = tanh(W1 x + b1);  h2 = tanh(W2 h1 + b2);  h3 = tanh(W3 h2 + b3)
    p(class B) = sigmoid(w . h3 + c)        (linear readout = a straight line in h3)

Every hidden layer is 2-D, so each stage can be drawn as a warp of the plane:
stretch/rotate (W), shift (b), bend (tanh). Because the readout is linear and
accuracy is 100%, the data is linearly separable in the last 2-D layer.

We train many random initialisations with full-batch Adam and keep the one with
100% accuracy and the widest margin in h3. Hidden-unit signs are then flipped
(a symmetry of tanh nets; the function is unchanged) so every W has det > 0,
which keeps the I -> W interpolation in the deck free of reflections.

Run:  python src/python/make_warpnet.py [--diag]
"""
import os
import sys

import numpy as np

from common import BLUE, ORANGE, rnd, write_js

N_POINTS = 200
NOISE = 0.09
DATA_SEED = 7


def make_data():
    from sklearn.datasets import make_moons
    X, y = make_moons(n_samples=N_POINTS, noise=NOISE, random_state=DATA_SEED)
    X = X - np.array([0.5, 0.25])  # centre the two moons on the origin
    X = X * 1.2
    return X, y.astype(float)


def forward(P, X):
    W1, b1, W2, b2, W3, b3, w, c = P
    a1 = X @ W1.T + b1
    h1 = np.tanh(a1)
    a2 = h1 @ W2.T + b2
    h2 = np.tanh(a2)
    a3 = h2 @ W3.T + b3
    h3 = np.tanh(a3)
    s = h3 @ w + c
    return a1, h1, a2, h2, a3, h3, s


def spread_grad(h, mu):
    """Gradient of -mu * log det(cov(h)) w.r.t. h (keeps a layer 2-D)."""
    N = h.shape[0]
    d = h - h.mean(0)
    C = d.T @ d / N + 1e-6 * np.eye(2)
    return -mu * (2.0 / N) * d @ np.linalg.inv(C)


def train(X, y, seed, steps=6000, lr=0.03, lam=1e-4, init_scale=1.0, mu=0.0,
          kappa=0.0, wnorm=None):
    """Full-batch Adam on BCE + L2(lam) [+ spread(mu)] [+ kappa * mean a^2].

    kappa penalises large pre-activations so tanh bends without saturating;
    wnorm (if set) fixes |w| of the linear readout, which forces a real gap
    between the classes in the last hidden layer instead of a huge w."""
    rng = np.random.default_rng(seed)
    P = [rng.normal(0, init_scale, (2, 2)), rng.normal(0, 0.3, 2),
         rng.normal(0, init_scale, (2, 2)), rng.normal(0, 0.3, 2),
         rng.normal(0, init_scale, (2, 2)), rng.normal(0, 0.3, 2),
         rng.normal(0, init_scale, 2), 0.0]
    P = [np.asarray(p, dtype=float) for p in P]
    if wnorm:
        P[6] = P[6] * (wnorm / np.linalg.norm(P[6]))
    m = [np.zeros_like(p) for p in P]
    v = [np.zeros_like(p) for p in P]
    b1_, b2_, eps = 0.9, 0.999, 1e-8
    N = len(y)
    for t in range(1, steps + 1):
        W1, b1, W2, b2, W3, b3, w, c = P
        a1, h1, a2, h2, a3, h3, s = forward(P, X)
        p = 1 / (1 + np.exp(-s))
        ds = (p - y) / N
        dw = h3.T @ ds + (0.0 if wnorm else lam) * w
        dc = ds.sum()
        dh3 = ds[:, None] * w[None, :]
        if mu:
            dh3 = dh3 + spread_grad(h3, mu)
        da3 = dh3 * (1 - h3 ** 2) + (2 * kappa / N) * a3
        dW3 = da3.T @ h2 + lam * W3
        db3 = da3.sum(0)
        dh2 = da3 @ W3
        if mu:
            dh2 = dh2 + spread_grad(h2, mu)
        da2 = dh2 * (1 - h2 ** 2) + (2 * kappa / N) * a2
        dW2 = da2.T @ h1 + lam * W2
        db2 = da2.sum(0)
        dh1 = da2 @ W2
        if mu:
            dh1 = dh1 + spread_grad(h1, mu)
        da1 = dh1 * (1 - h1 ** 2) + (2 * kappa / N) * a1
        dW1 = da1.T @ X + lam * W1
        db1 = da1.sum(0)
        G = [dW1, db1, dW2, db2, dW3, db3, dw, np.asarray(dc)]
        for i in range(len(P)):
            m[i] = b1_ * m[i] + (1 - b1_) * G[i]
            v[i] = b2_ * v[i] + (1 - b2_) * G[i] ** 2
            mh = m[i] / (1 - b1_ ** t)
            vh = v[i] / (1 - b2_ ** t)
            P[i] = P[i] - lr * mh / (np.sqrt(vh) + eps)
        if wnorm:
            P[6] = P[6] * (wnorm / np.linalg.norm(P[6]))
    return P


def evaluate(P, X, y):
    *_, h3, s = forward(P, X)
    pred = (s > 0).astype(float)
    acc = float((pred == y).mean())
    w, c = P[6], float(P[7])
    sgn = 2 * y - 1
    margin = float(np.min(sgn * s) / (np.linalg.norm(w) + 1e-12))
    p = 1 / (1 + np.exp(-s))
    loss = float(-np.mean(y * np.log(p + 1e-12) + (1 - y) * np.log(1 - p + 1e-12)))
    return acc, margin, loss


def fix_signs(P):
    """Flip hidden units so det(W1), det(W2), det(W3) > 0 (function unchanged)."""
    W1, b1, W2, b2, W3, b3, w, c = [np.array(p, dtype=float) for p in P]
    Ws, bs = [W1, W2, W3], [b1, b2, b3]
    for k in range(3):
        if np.linalg.det(Ws[k]) < 0:
            Ws[k][0, :] *= -1
            bs[k][0] *= -1
            if k < 2:
                Ws[k + 1][:, 0] *= -1
            else:
                w[0] *= -1
    return [Ws[0], bs[0], Ws[1], bs[1], Ws[2], bs[2], w, c]


def stage_points(P, X):
    """Point clouds after every elementary step of the animation."""
    W1, b1, W2, b2, W3, b3, w, c = P
    out = [("input", X)]
    h = X
    for k, (W, b) in enumerate([(W1, b1), (W2, b2), (W3, b3)], start=1):
        lin = h @ W.T
        out.append((f"W{k}", lin))
        aff = lin + b
        out.append((f"b{k}", aff))
        h = np.tanh(aff)
        out.append((f"tanh{k}", h))
    return out


def extent_of(pts, pad=0.12):
    lo = pts.min(0)
    hi = pts.max(0)
    span = np.maximum(hi - lo, 1e-6)
    lo = lo - pad * span
    hi = hi + pad * span
    return [float(lo[0]), float(hi[0]), float(lo[1]), float(hi[1])]


# Chosen after comparing warped-grid renders of several solution families:
# plain max-margin training collapses the hidden layers onto a line; a mild
# spread term (mu), a pre-activation penalty (kappa) and a fixed-norm readout
# (wnorm) give: squash into a band -> unfold -> two compact, well-separated
# clusters in opposite corners of the last layer.
CONFIG = dict(steps=4000, lr=0.03, lam=1e-3, mu=0.005, kappa=0.02, wnorm=4.0)
SEED = 9


def main(diag=False):
    X, y = make_data()
    P = train(X, y, SEED, **CONFIG)
    acc0, margin0, _ = evaluate(P, X, y)
    P = fix_signs(P)
    acc, margin2, loss2 = evaluate(P, X, y)
    assert acc == 1.0 and abs(margin2 - margin0) < 1e-9, (acc, margin2, margin0)

    W1, b1, W2, b2, W3, b3, w, c = P
    stages = stage_points(P, X)
    ext_in = extent_of(X, pad=0.15)
    stage_ext = {}
    gx = np.linspace(ext_in[0], ext_in[1], 41)
    gy = np.linspace(ext_in[2], ext_in[3], 41)
    G = np.array([(a, b) for a in gx for b in gy])
    for (name, pts), (_, gpts) in zip(stages, stage_points(P, G)):
        stage_ext[name] = extent_of(np.vstack([pts, gpts]), pad=0.06)
    obj = {
        "arch": "2-2-2-2 tanh + linear readout",
        "equations": ["h1 = tanh(W1 x + b1)", "h2 = tanh(W2 h1 + b2)",
                      "h3 = tanh(W3 h2 + b3)", "p(B) = sigmoid(w . h3 + c)"],
        "layers": [
            {"W": W1, "b": b1, "act": "tanh"},
            {"W": W2, "b": b2, "act": "tanh"},
            {"W": W3, "b": b3, "act": "tanh"},
        ],
        "readout": {"w": w, "c": float(c),
                    "note": "decision line in the last hidden layer: w[0]*h1 + w[1]*h2 + c = 0; class B (label 1) where > 0"},
        "data": {"x": X, "y": y.astype(int),
                 "classes": ["A", "B"], "colors": [BLUE, ORANGE],
                 "desc": f"two interleaved moons (sklearn make_moons, n={N_POINTS}, noise={NOISE}, random_state={DATA_SEED}), centred and scaled by 1.2"},
        "accuracy": acc,
        "loss": loss2,
        "marginH3": margin2,
        "trainSeed": SEED,
        "dets": [float(np.linalg.det(W)) for W in (W1, W2, W3)],
        "extent": ext_in,
        "hiddenExtent": [-1.05, 1.05, -1.05, 1.05],
        "stageOrder": [s[0] for s in stages],
        "stageExtent": stage_ext,
        "stagePoints": {name: pts for name, pts in stages},
        "story": ["layer 1 squashes the plane into a thin S-shaped band (moons still interleaved)",
                  "layer 2 unfolds the band; the classes become two interlocking hooks",
                  "layer 3 pushes them into opposite corners: one straight line now separates them"],
        "notes": ("x (input) -> W1 x -> + b1 -> tanh -> W2 -> + b2 -> tanh -> W3 -> + b3 -> tanh -> line. "
                  "All det(W) > 0 (hidden-unit signs flipped where needed; the function is unchanged), so animating "
                  "(1-t) I + t W never mirrors the plane. stageExtent gives a view box per stage that fits the data "
                  "and the image of a 41x41 grid over 'extent'."),
        "training": (f"numpy full-batch Adam, {CONFIG['steps']} steps, lr {CONFIG['lr']}, L2 {CONFIG['lam']}, "
                     f"pre-activation penalty {CONFIG['kappa']}, spread term {CONFIG['mu']}, |w| fixed to "
                     f"{CONFIG['wnorm']}, seed {SEED}"),
    }
    write_js("warpnet", rnd(obj, 4), "warpnet.js")
    print("seed", SEED, "acc", acc, "margin", margin2, "loss", loss2, "dets", obj["dets"])
    if diag:
        preview(P, X, y, ext_in)


def preview(P, X, y, ext):
    """Stage-by-stage render with a warped grid (for checking only)."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    here = os.path.dirname(os.path.abspath(__file__))
    outdir = os.path.join(here, "_cache")
    os.makedirs(outdir, exist_ok=True)
    Ws = [(P[0], P[1]), (P[2], P[3]), (P[4], P[5])]

    def through(pts, k):
        h = pts
        for W, b in Ws[:k]:
            h = np.tanh(h @ W.T + b)
        return h

    fig, axes = plt.subplots(1, 4, figsize=(16, 4.2), facecolor="#0f1115")
    for k, ax in enumerate(axes):
        ax.set_facecolor("#0f1115")
        for xv in np.linspace(ext[0], ext[1], 17):
            L = through(np.stack([np.full(200, xv), np.linspace(ext[2], ext[3], 200)], 1), k)
            ax.plot(L[:, 0], L[:, 1], color="#2A3140", lw=0.8)
        for yv in np.linspace(ext[2], ext[3], 13):
            L = through(np.stack([np.linspace(ext[0], ext[1], 200), np.full(200, yv)], 1), k)
            ax.plot(L[:, 0], L[:, 1], color="#2A3140", lw=0.8)
        pts = through(X, k)
        ax.scatter(pts[:, 0], pts[:, 1], c=np.where(y > 0, ORANGE, BLUE), s=9, zorder=3)
        if k == 3:
            w, c = P[6], P[7]
            t = np.linspace(-1.05, 1.05, 10)
            if abs(w[1]) > abs(w[0]):
                ax.plot(t, -(w[0] * t + c) / w[1], color="#83C167", lw=2)
            else:
                ax.plot(-(w[1] * t + c) / w[0], t, color="#83C167", lw=2)
        if k:
            ax.set_xlim(-1.05, 1.05)
            ax.set_ylim(-1.05, 1.05)
        ax.set_aspect("equal")
        ax.set_title(["input", "after layer 1", "after layer 2", "after layer 3 + readout line"][k], color="#ECEFF4")
        ax.tick_params(colors="#9AA4B2", labelsize=7)
    fig.tight_layout()
    path = os.path.join(outdir, "warpnet_preview.png")
    fig.savefig(path, dpi=70, facecolor="#0f1115")
    print("preview ->", path)


if __name__ == "__main__":
    main(diag="--diag" in sys.argv)
