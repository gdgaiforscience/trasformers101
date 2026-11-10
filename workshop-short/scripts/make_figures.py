"""Draw the workshop-short diagrams (SVG + PNG) and refresh them inside the notebook.

    python workshop-short/scripts/make_figures.py

Colours: Google News Partner Marketing Hub light palette. All text is #202124 or a
dark surface tint on white/light tints (WCAG 2.2 AA); medium colours are used only
for strokes and fills (>= 3:1 against white).
"""

import base64
import io
import json
import re
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.patches import Circle, FancyArrowPatch, FancyBboxPatch, Rectangle
from PIL import Image

HERE = Path(__file__).resolve().parents[1]
ASSETS = HERE / "assets"
NOTEBOOK = HERE / "neuron_to_transformer.ipynb"

BLUE, RED, YELLOW, GREEN = "#4285F4", "#EA4335", "#FBBC04", "#34A853"
INK, GREY, LIGHT_GREY = "#202124", "#9AA0A6", "#F1F3F4"
DARK_BLUE, DARK_RED, ORANGE, DARK_GREEN = "#174EA6", "#A50E0E", "#E37400", "#0D652D"
LIGHT_BLUE, LIGHT_RED, LIGHT_YELLOW, LIGHT_GREEN = "#D2E3FC", "#FAD2CF", "#FEEFC3", "#CEEAD6"

for f in (HERE.parent / "fonts").glob("*.ttf"):
    font_manager.fontManager.addfont(str(f))
plt.rcParams.update({
    "font.family": ["Roboto", "DejaVu Sans"], "text.color": INK, "svg.fonttype": "path",
    "mathtext.fontset": "custom", "mathtext.rm": "Roboto", "mathtext.it": "Roboto:italic",
    "mathtext.bf": "Roboto:bold", "svg.hashsalt": "workshop-short",
})
MONO = "Noto Sans Mono"


# --------------------------------------------------------------------------- primitives
def canvas(w, h):
    """A figure whose data units are 1/100 inch (so 2 px in the 200 dpi PNG)."""
    fig = plt.figure(figsize=(w / 100, h / 100))
    ax = fig.add_axes([0, 0, 1, 1], xlim=(0, w), ylim=(0, h))
    ax.axis("off")
    return fig, ax


def box(ax, x, y, w, h, fill, edge, lw=1.6, r=8, ls="-", z=1):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle=f"round,pad=0,rounding_size={r}",
                                fc=fill, ec=edge, lw=lw, ls=ls, zorder=z))


def text(ax, x, y, s, size=10, color=INK, weight="normal", ha="center", va="center", **kw):
    ax.text(x, y, s, fontsize=size, color=color, fontweight=weight, ha=ha, va=va, zorder=5, **kw)


def tag(ax, x, y, s, size, color):
    """Bold label on a white chip, so it stays readable on top of lines."""
    ax.text(x, y, s, fontsize=size, color=color, fontweight="bold", ha="center", va="center", zorder=6,
            bbox=dict(boxstyle="round,pad=0.22", fc="white", ec="none"))


def arrow(ax, p, q, color=INK, lw=1.6, rad=0.0, style="-|>", ms=10, z=2, **kw):
    ax.add_patch(FancyArrowPatch(p, q, arrowstyle=style, mutation_scale=ms, color=color, lw=lw,
                                 connectionstyle=f"arc3,rad={rad}", zorder=z, **kw))


def save(fig, name):
    ASSETS.mkdir(exist_ok=True)
    fig.savefig(ASSETS / f"{name}.svg", metadata={"Date": None})
    buf = io.BytesIO()
    fig.savefig(buf, dpi=200, format="png")
    plt.close(fig)
    img = Image.open(buf).convert("RGB").quantize(colors=96, method=Image.Quantize.MEDIANCUT)
    img.save(ASSETS / f"{name}.png", optimize=True)


# --------------------------------------------------------------------------- figures
def roadmap():
    fig, ax = canvas(900, 270)
    cards = [
        ("1", "One neuron", "NumPy", "w @ x + b", BLUE, LIGHT_BLUE, DARK_BLUE),
        ("2", "A neural network", "torch autograd\nnn.Linear · nn.Sequential", "loss.backward()", GREEN, LIGHT_GREEN, DARK_GREEN),
        ("3", "Attention", "nn.Embedding\nF.scaled_dot_product_attention", "softmax(QKᵀ/√d) V", ORANGE, LIGHT_YELLOW, INK),
        ("4", "A Transformer", "nn.Module\nnn.MultiheadAttention", "Block × 2", RED, LIGHT_RED, DARK_RED),
    ]
    for i, (num, title, tools, idea, edge, fill, dark) in enumerate(cards):
        x = 18 + i * 222
        box(ax, x, 62, 196, 178, fill, edge, lw=2)
        badge = YELLOW if edge == ORANGE else edge
        ax.add_patch(Circle((x + 24, 214), 14, fc=badge, ec=INK if edge == ORANGE else edge, lw=1.2, zorder=3))
        text(ax, x + 24, 213.5, num, 12, INK if edge == ORANGE else "white", "bold")
        text(ax, x + 46, 214, title, 12.5, INK, "bold", ha="left")
        icon(ax, i, x + 98, 160)
        text(ax, x + 98, 112, idea, 9.5, dark, "medium", family=None if i == 2 else MONO)
        text(ax, x + 98, 82, tools, 7.2, INK, family=MONO, linespacing=1.35)
        if i < 3:
            arrow(ax, (x + 199, 151), (x + 219, 151), lw=2, ms=12)
    arrow(ax, (40, 30), (862, 30), color=GREY, lw=1.4, ms=12)
    text(ax, 451, 44, "the model grows, the code stays small: each idea is written once from scratch, then handed to a library",
         8.8, INK, style="italic")
    save(fig, "roadmap")


def icon(ax, i, cx, cy):
    """Tiny pictograms for the roadmap cards."""
    if i == 0:
        for dy in (-22, 0, 22):
            ax.add_patch(Circle((cx - 38, cy + dy), 6, fc="white", ec=BLUE, lw=1.4, zorder=3))
            arrow(ax, (cx - 31, cy + dy * 0.9), (cx - 9, cy + dy * 0.2), color=BLUE if dy <= 0 else RED, lw=1.4, style="-")
        ax.add_patch(Circle((cx, cy), 10, fc=LIGHT_GREEN, ec=GREEN, lw=1.6, zorder=3))
        arrow(ax, (cx + 11, cy), (cx + 34, cy), lw=1.4, ms=8)
    elif i == 1:
        layers = [(-44, [-16, 16]), (0, [-24, -8, 8, 24]), (44, [0])]
        for (x0, ys0), (x1, ys1) in zip(layers, layers[1:]):
            for a in ys0:
                for b in ys1:
                    ax.plot([cx + x0, cx + x1], [cy + a, cy + b], color=GREY, lw=0.8, zorder=2)
        for x0, ys in layers:
            for a in ys:
                ax.add_patch(Circle((cx + x0, cy + a), 5.5, fc="white" if x0 < 0 else LIGHT_GREEN, ec=GREEN, lw=1.4, zorder=3))
    elif i == 2:
        xs = [cx - 54 + k * 27 for k in range(5)]
        for k, x in enumerate(xs):
            box(ax, x - 10, cy - 18, 20, 14, "white" if k < 4 else DARK_BLUE, ORANGE if k < 4 else DARK_BLUE, lw=1.2, r=3, z=3)
        for k, w in zip(range(4), (0.9, 3.4, 1.4, 0.8)):
            arrow(ax, (xs[4], cy - 3), (xs[k], cy - 3), color=DARK_BLUE, lw=w, rad=0.55, style="-")
    else:
        for k in range(2):
            y = cy - 22 + k * 24
            box(ax, cx - 44, y, 40, 18, LIGHT_BLUE, BLUE, lw=1.2, r=3, z=3)
            box(ax, cx + 4, y, 40, 18, LIGHT_GREEN, GREEN, lw=1.2, r=3, z=3)
        box(ax, cx - 52, cy - 28, 104, 56, "none", RED, lw=1.2, r=6, ls=(0, (3, 2)), z=2)


def neuron_and_layer():
    fig, ax = canvas(860, 300)
    ax.plot([418, 418], [22, 278], color=GREY, lw=1, ls=(0, (4, 4)))

    # A · one neuron (the talk's numbers)
    text(ax, 22, 276, "One neuron = a weighted vote", 13, INK, "bold", ha="left")
    nx, ny = 236, 145
    for i, (v, w, y) in enumerate(zip((0.9, 0.2, 0.6), (1.2, -0.8, 0.5), (210, 145, 80))):
        col, dark = (BLUE, DARK_BLUE) if w > 0 else (RED, DARK_RED)
        end = ny + (y - ny) * 0.15
        ax.plot([70, nx - 30], [y, end], color=col, lw=abs(w) * 4.2, solid_capstyle="round", zorder=2)
        ax.add_patch(Circle((50, y), 21, fc=LIGHT_BLUE, ec=BLUE, lw=1.6, zorder=3))
        text(ax, 50, y, f"{v}", 11.5, INK, "medium")
        text(ax, 18, y, f"$x_{i + 1}$", 11, DARK_BLUE)
        tag(ax, 128, y + (end - y) * 0.38, f"× {w:+.1f}".replace("-", "−"), 10.5, dark)
    ax.add_patch(Circle((nx, ny), 30, fc=LIGHT_GREEN, ec=GREEN, lw=2, zorder=3))
    text(ax, nx, ny + 6, "Σ", 17, INK, "bold")
    text(ax, nx, ny - 14, "+ b", 9.5, DARK_GREEN, "bold")
    text(ax, nx, ny - 50, "b = −0.2\nz = 1.22 − 0.2 = 1.02", 9.5, INK, linespacing=1.4)
    box(ax, 296, ny - 22, 46, 44, "white", INK, lw=1.3, r=6)
    zz = [i / 20 for i in range(-20, 21)]
    ax.plot([319 + 18 * z for z in zz], [ny - 14 + 28 / (1 + 2.71828 ** (-5 * z)) for z in zz], color=INK, lw=1.8, zorder=4)
    text(ax, 319, ny + 34, "bend σ", 9.5, INK, "medium")
    arrow(ax, (nx + 31, ny), (295, ny), lw=1.8)
    arrow(ax, (343, ny), (362, ny), lw=1.8)
    ax.add_patch(Circle((385, ny), 21, fc=LIGHT_RED, ec=RED, lw=1.8, zorder=3))
    text(ax, 385, ny, "0.73", 11.5, INK, "bold")
    text(ax, 385, ny - 34, "$\\hat{y}$", 12, DARK_RED)
    text(ax, 210, 42, "$\\hat{y} = \\sigma(\\mathbf{w}\\cdot\\mathbf{x} + b)$", 13)
    text(ax, 210, 18, "weights: what it cares about  ·  bias: how easily it fires", 9.5, INK, style="italic")

    # B · a layer is a matrix
    text(ax, 440, 276, "A layer = one matrix multiply", 13, INK, "bold", ha="left")
    cw, ch, top = 38, 26, 214

    def cell(x0, y0, v, fill, edge, hl=False):
        ax.add_patch(Rectangle((x0, y0), cw, ch, fc=LIGHT_YELLOW if hl else fill, ec=ORANGE if hl else edge,
                               lw=1.8 if hl else 1, zorder=3 if hl else 2))
        text(ax, x0 + cw / 2, y0 + ch / 2, f"{v:g}".replace("-", "−"), 10, INK)

    def column(x0, vals, fill, edge, label, shift=0.0, hl=None):
        for r, v in enumerate(vals):
            cell(x0, top - (r + 1 - shift) * ch, v, fill, edge, hl=r == hl)
        text(ax, x0 + cw / 2, top + 28, label, 12, INK, "bold")

    W = [[1.2, -0.8, 0.5], [-0.4, 0.9, 0.7], [0.3, 1.1, -1.0], [-0.9, 0.2, 0.6]]
    for c in range(3):
        column(446 + c * cw, [row[c] for row in W], "white", GREY, "W" if c == 1 else "", hl=0)
    text(ax, 446 + 1.5 * cw, top - 4 * ch - 14, "4 neurons × 3 inputs", 8.5, INK)
    text(ax, 571, top - 2 * ch, "×", 15, INK)
    column(584, (0.9, 0.2, 0.6), LIGHT_BLUE, BLUE, "x", shift=0.5)
    text(ax, 634, top - 2 * ch, "+", 15, INK)
    column(646, (-0.2, 0.1, 0.4, -0.3), LIGHT_GREY, GREY, "b")
    arrow(ax, (690, top - 2 * ch), (742, top - 2 * ch), lw=1.8)
    text(ax, 716, top - 2 * ch + 12, "σ", 12, INK, "bold")
    column(750, (0.73, 0.58, 0.57, 0.33), LIGHT_RED, RED, "a", hl=0)
    text(ax, 640, 70, "row 1 is the neuron on the left: 1.2×0.9 − 0.8×0.2 + 0.5×0.6 − 0.2 = 1.02 → 0.73", 8.8, INK)
    text(ax, 640, 42, "$\\mathbf{a} = \\sigma(W\\mathbf{x} + \\mathbf{b})$", 13)
    text(ax, 640, 18, "GPUs and TPUs are built to do millions of these at once", 9.5, INK, style="italic")
    save(fig, "neuron_and_layer")


def attention():
    words = ["<bos>", "The", "trophy", "did", "not", "fit", "in", "the", "suitcase", "because", "it", "was", "too", "big", "."]
    # Real Gemma 3 270M attention from " it" (layer 9, head 2), copied from ../data/attention.js
    att = [0.09, 0.004, 0.512, 0.072, 0.036, 0.111, 0.038, 0.007, 0.076, 0.042, 0.013, 0, 0, 0, 0]
    fig, ax = canvas(860, 340)
    text(ax, 22, 316, "Attention: each token looks back and gathers what it needs", 13, INK, "bold", ha="left")
    widths = [len(w) * 7.4 + 16 for w in words]
    gap, y0, h = 6, 112, 30
    x = (860 - sum(widths) - gap * (len(words) - 1)) / 2
    q, centres = words.index("it"), []
    for i, (w, wd) in enumerate(zip(words, widths)):
        fill, edge, col, wt, ls = LIGHT_BLUE, BLUE, INK, "normal", "-"
        if i == q:
            fill, edge, col, wt = DARK_BLUE, DARK_BLUE, "white", "bold"
        if i > q:
            fill, edge, ls = LIGHT_GREY, GREY, (0, (3, 2))
        box(ax, x, y0, wd, h, fill, edge, lw=1.4, r=6, ls=ls, z=3)
        text(ax, x + wd / 2, y0 + h / 2, w, 10.5, col, wt)
        centres.append(x + wd / 2)
        x += wd + gap
    for i in range(q):
        rad = 0.42 if q - i > 3 else 0.6
        strong = att[i] >= 0.07
        arrow(ax, (centres[q], y0 + h + 2), (centres[i], y0 + h + 2), color=DARK_BLUE if strong else BLUE,
              lw=max(att[i] * 16, 0.6), rad=rad, style="-", alpha=1 if strong else 0.55)
        if strong:
            span = centres[q] - centres[i]
            tag(ax, centres[i] + span / 2, y0 + h + 2 + span * rad / 2, f"{att[i]:.0%}", 12 if i == 2 else 10, DARK_BLUE)
    text(ax, (centres[q + 1] + centres[-1]) / 2, y0 - 16, "the future is masked", 9, DARK_RED, "medium")
    text(ax, 430, y0 - 38, "Real weights from Gemma 3 270M (layer 9, head 2): “it” puts 51% on trophy, 8% on suitcase. "
                           "<bos> marks the start of the text.", 9, INK, style="italic")
    steps = [("1 · score", "query(it) · key(word) / √d", LIGHT_BLUE, BLUE),
             ("2 · softmax", "scores → weights that sum to 1", LIGHT_YELLOW, ORANGE),
             ("3 · mix", "new it = Σ weight × value(word)", LIGHT_GREEN, GREEN)]
    for k, (t, s, fill, edge) in enumerate(steps):
        bx = 30 + k * 206
        box(ax, bx, 12, 186, 44, fill, edge, lw=1.6)
        text(ax, bx + 93, 42, t, 10.5, INK, "bold")
        text(ax, bx + 93, 23, s, 8.6, INK)
        if k < 2:
            arrow(ax, (bx + 188, 34), (bx + 204, 34), lw=1.6)
    text(ax, 748, 34, "$\\mathrm{softmax}\\left(\\frac{QK^{\\top}}{\\sqrt{d}} + \\mathrm{mask}\\right)V$", 13)
    save(fig, "attention")


def transformer():
    fig, ax = canvas(880, 330)
    text(ax, 22, 306, "TinyGPT: embeddings → [attention + MLP] × 2 → a score for every next token", 13, INK, "bold", ha="left")
    mid, sy = 160, 84
    for k, t in enumerate("GATT…>"):
        box(ax, 22, mid + 62 - k * 26, 34, 22, LIGHT_GREY, INK, lw=1, r=4, z=3)
        text(ax, 39, mid + 73 - k * 26, t, 10, INK, "medium", family=MONO)
    text(ax, 39, mid - 92, "token IDs", 8.8, INK)
    arrow(ax, (60, mid), (82, mid), lw=1.8)

    box(ax, 84, mid - 46, 104, 92, LIGHT_YELLOW, ORANGE, lw=1.8)
    for dy, s in ((22, "token"), (6, "+ position"), (-12, "embedding")):
        text(ax, 136, mid + dy, s, 10.5, INK, "bold")
    text(ax, 136, mid - 32, "what + where", 8.6, INK, style="italic")
    text(ax, 136, mid - 62, "tok(ids) + pos(…)", 8, INK, family=MONO)
    arrow(ax, (188, mid), (214, mid), lw=1.8)

    box(ax, 216, 46, 418, 228, "none", DARK_BLUE, lw=1.6, r=10, ls=(0, (5, 3)), z=1)
    text(ax, 232, 258, "Block × 2", 11.5, DARK_BLUE, "bold", ha="left")
    text(ax, 618, 258, "Block", 8.5, DARK_BLUE, ha="right", family=MONO)
    ax.plot([216, 216, 652, 652], [mid, sy, sy, mid], color=INK, lw=2.4, zorder=2)
    text(ax, 425, sy - 22, "residual stream: each step adds to it, x = x + …", 8.6, INK, style="italic")
    branches = [("masked multi-head", "attention", LIGHT_BLUE, BLUE, DARK_BLUE, "attn", "talk: tokens share information"),
                ("MLP", "Linear → GELU → Linear", LIGHT_GREEN, GREEN, DARK_GREEN, "mlp", "think: each token on its own")]
    for x0, (name, sub, fill, edge, dark, code, note) in zip((234, 432), branches):
        ax.plot([x0 - 8, x0 - 8], [sy, mid], color=INK, lw=1.4, zorder=2)
        arrow(ax, (x0 - 8, mid), (x0 + 2, mid), lw=1.4, ms=8)
        box(ax, x0 + 2, mid - 26, 30, 52, LIGHT_GREY, INK, lw=1, r=5)
        text(ax, x0 + 17, mid, "Norm", 8, INK, rotation=90)
        arrow(ax, (x0 + 32, mid), (x0 + 44, mid), lw=1.4, ms=8)
        box(ax, x0 + 44, mid - 40, 132, 80, fill, edge, lw=1.8)
        mlp = name == "MLP"
        text(ax, x0 + 110, mid + 14, name, 10.5 if mlp else 9.5, INK, "bold")
        text(ax, x0 + 110, mid - 4, sub, 8.2 if mlp else 9.5, INK, "normal" if mlp else "bold")
        text(ax, x0 + 110, mid - 26, code, 8.5, dark, family=MONO)
        text(ax, x0 + 110, mid + 58, note, 9, dark, "medium", style="italic")
        ax.plot([x0 + 176, x0 + 184], [mid, mid], color=INK, lw=1.4, zorder=2)
        arrow(ax, (x0 + 184, mid), (x0 + 184, sy + 10), lw=1.4, ms=8)
        ax.add_patch(Circle((x0 + 184, sy), 9, fc="white", ec=INK, lw=1.6, zorder=3))
        text(ax, x0 + 184, sy + 0.5, "+", 12, INK, "bold")
    arrow(ax, (652, mid), (666, mid), lw=1.8)

    box(ax, 668, mid - 46, 92, 92, LIGHT_RED, RED, lw=1.8)
    text(ax, 714, mid + 20, "Norm +", 10.5, INK, "bold")
    text(ax, 714, mid + 3, "Linear", 10.5, INK, "bold")
    text(ax, 714, mid - 20, "5 scores", 8.6, INK, style="italic")
    text(ax, 714, mid - 62, "norm, head", 8, DARK_RED, family=MONO)
    arrow(ax, (760, mid), (778, mid), lw=1.8)
    for k, (t, p) in enumerate((("A", 0.002), ("C", 0.003), ("G", 0.004), ("T", 0.99), (">", 0.001))):
        y = mid + 40 - k * 20
        text(ax, 790, y, t, 9.5, INK, "medium", family=MONO)
        ax.add_patch(Rectangle((800, y - 6), max(p * 62, 2.5), 12, fc=RED if t == "T" else GREY, ec="none", zorder=3))
    text(ax, 828, mid - 66, "softmax →\nnext token", 8.6, INK, linespacing=1.3)
    text(ax, 440, 20, "Ours: 2 blocks · 4 heads · 64 numbers per token · ≈0.1 M weights     "
                      "Gemma 3 270M: 18 blocks · 4 heads · 640 numbers per token · 268 M weights", 9, INK)
    save(fig, "transformer")


# --------------------------------------------------------------------------- embed
def embed():
    """Swap fresh PNGs into notebook markdown cells tagged with metadata {"figure": name}."""
    nb = json.loads(NOTEBOOK.read_text())
    for cell in nb["cells"]:
        name = cell["metadata"].get("figure")
        if name:
            uri = "data:image/png;base64," + base64.b64encode((ASSETS / f"{name}.png").read_bytes()).decode()
            src = re.sub(r"data:image/png;base64,[A-Za-z0-9+/=]+", uri, "".join(cell["source"]))
            cell["source"] = src.splitlines(keepends=True)
    NOTEBOOK.write_text(json.dumps(nb, sort_keys=True, indent=1, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    roadmap()
    neuron_and_layer()
    attention()
    transformer()
    if NOTEBOOK.exists():
        embed()
    print("wrote", sorted(p.name for p in ASSETS.iterdir()))
