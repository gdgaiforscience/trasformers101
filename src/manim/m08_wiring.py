"""m08_wiring: same neuron, different wiring (light palette).

One neuron (a weighted sum, then a bend) multiplies into a layer, and the same neurons are then wired
five ways. Every stage shows the wiring diagram (left) and a "who talks to whom" matrix (right; rows =
receivers, columns = senders):

  Dense        6 inputs -> 4 outputs, all 24 weights (fixed-seed uniform[-1, 1]).
  Convolution  banded Toeplitz matrix of the valid 1-D convolution y_j = a x_j + b x_{j+1} + c x_{j+2}:
               only neighbours, the same 3 weights in every row.
  Recurrent    unrolled chain h_t = f(W h_{t-1} + U x_t), the same U and W at every step; the matrix
               shows how strongly x_s still reaches h_t (lower-triangular, fading as LAMBDA^(t-s)).
  Graph        heavy-atom graph of phenol (C6 ring + O on C1): adjacency + self-loops; messages flow
               along the bonds in both directions.
  Attention    row-softmax of fixed illustrative scores over a Winograd sentence; "big" -> "small"
               re-routes "it" from "trophy" to "suitcase".

Every number on screen is computed (and asserted) below. Build: python build.py m08_wiring --bg light
"""
from common_light import *

# ------------------------------------------------------------------ the numbers
SEED = 5627
N_IN, N_OUT = 6, 4
W_DENSE = np.random.default_rng(SEED).uniform(-1, 1, (N_OUT, N_IN))
N_DENSE = W_DENSE.size                                   # 24 different weights
K = 3                                                    # kernel (a, b, c)
KERNEL = "abc"
BAND = {(j, j + k): k for j in range(N_OUT) for k in range(K)}   # Toeplitz band: row j, cols j..j+2
FOCUS = 1                                                # the opening neuron = output 1 ...
NEURON_IN = [FOCUS + k for k in range(K)]                # ... wired to inputs 1..3 (its conv window)

N_T = 5                                                  # recurrent steps
LAMBDA = 0.6                                             # how much of the memory survives one step
INFL = np.array([[LAMBDA ** (t - s) if s <= t else 0.0 for s in range(N_T)] for t in range(N_T)])

ELEM = ["C"] * 6 + ["O"]                                 # phenol heavy atoms: C1..C6, O (on C1)
BONDS = [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 0), (0, 6)]
RING_ANGLES = [90, 30, -30, -90, -150, 150]
ADJ = np.eye(len(ELEM), dtype=int)                       # adjacency + self-loops
for _u, _v in BONDS:
    ADJ[_u, _v] = ADJ[_v, _u] = 1

TOKENS = ["trophy", "didn’t", "fit", "in", "suitcase", "because", "it", "was", "too", "big"]
SWAP = "small"
IT, TROPHY, SUITCASE, LAST = (TOKENS.index(w) for w in ("it", "trophy", "suitcase", "big"))


def attention_scores(last: str) -> np.ndarray:
    """Illustrative attention logits (hand-set, not from a trained model)."""
    n = len(TOKENS)
    S = np.zeros((n, n))
    for i in range(n):
        S[i, i] = 1.6
        if i > 0:
            S[i, i - 1] = 0.9
        if i < n - 1:
            S[i, i + 1] = 0.6
    S[1, 2] = 1.4                                        # didn't -> fit
    S[2, TROPHY], S[2, SUITCASE] = 1.5, 1.3              # fit -> trophy, suitcase
    S[3, SUITCASE] = 1.6                                 # in -> suitcase
    S[5, 2] = 1.2                                        # because -> fit
    S[7, IT] = 1.4                                       # was -> it
    S[8, LAST] = 1.8                                     # too -> big / small
    S[IT, LAST] = 1.2                                    # it -> big / small
    noun, other = (TROPHY, SUITCASE) if last == "big" else (SUITCASE, TROPHY)
    S[IT, noun], S[IT, other] = 3.4, 1.0                 # what is "it"?
    S[LAST, noun] = 2.0                                  # big -> trophy, small -> suitcase
    return S


def softmax_rows(S: np.ndarray) -> np.ndarray:
    E = np.exp(S - S.max(axis=1, keepdims=True))
    return E / E.sum(axis=1, keepdims=True)


A_BIG = softmax_rows(attention_scores("big"))
A_SMALL = softmax_rows(attention_scores(SWAP))
A_MAX = max(A_BIG.max(), A_SMALL.max())

CUES = ["One neuron: a weighted sum, then a bend",
        "Dense: everyone talks to everyone",
        f"Convolution: only neighbours, the same {K} weights everywhere",
        "Recurrent: read in order, carry a memory forward",
        "Graph: atoms swap messages with their bonded neighbours",
        "Attention: anyone can talk to anyone, and the wiring is computed from the data",
        "Same neuron. Different wiring."]

# ------------------------------------------------------------------ layout (scene units, 1 = 135 px)
DX = -1.95                     # centre of the wiring diagram
X_MAX = 2.55                   # the diagram stays left of this
MX = 4.6                       # centre of the matrix panel
TITLE_BASE = 1.8               # baseline of "who talks to whom"
M_TOP = 1.5                    # top edge of every matrix
R_NODE = 0.3
STEP = 1.3
X_IN = [DX + (i - (N_IN - 1) / 2) * STEP for i in range(N_IN)]
X_OUT = [X_IN[j + 1] for j in range(N_OUT)]   # output j sits above the centre of its window
IN_Y, OUT_Y = -2.3, 0.75
CS, CS7, CS10 = 0.52, 0.44, 0.30              # cell pitch: dense/conv/recurrent, graph, attention
KCOL = [C_BLUE, C_YELLOW, C_GREEN]            # kernel position: left / centre / right
KTINT = [L_BLUE, L_YELLOW, L_GREEN]
KW = 4.5                                      # conv edge width (all equal: shared weights)
XR = [DX + (t - (N_T - 1) / 2) * 1.6 for t in range(N_T)]
H_Y = 0.15
GR, GY, R_ATOM = 1.3, -1.45, 0.3              # phenol ring radius / centre y / atom radius
TOK_SIZE, TOK_PAD, TOK_GAP, TOK_H, TOK_Y = 21, 0.09, 0.09, 0.46, -1.45
ARC_ANGLE = 2.1
LABEL_SIZE, CAP_SIZE, SUB_SIZE = 44, 28, 22
INSET = 0.04                                  # keep anti-aliased glyph edges inside the safe area
TEXT_SS = 8                                   # text layout supersampling (see T)


def P(x, y):
    return np.array([x, y, 0.0])


def T(s: str, size: float, color=TEXT, weight=NORMAL, **kw) -> Text:
    """Deck text. manim lays Text out at font_size / 4.8 pt, where Pango rounds glyph advances
    (visible gaps after "t", "w"); laying out 8x larger and scaling down keeps Roboto's spacing."""
    return txt(s, size * TEXT_SS, color, weight=weight, **kw).scale(1 / TEXT_SS)


def baseline(t: Text) -> float:
    """Baseline of a one-line Text: the median glyph bottom (most glyphs sit on it; descenders,
    apostrophes and middle dots are outliers on either side)."""
    return float(np.median([g.get_bottom()[1] for g in t if g.width > 1e-6]))


def put(t: Text, s: str = "", x_left=None, x_center=None, y_base=None) -> Text:
    """Place Text ``t`` by its left edge or centre and by its baseline (``s`` is documentation)."""
    dx = dy = 0.0
    if x_left is not None:
        dx = x_left - t.get_left()[0]
    elif x_center is not None:
        dx = x_center - t.get_center()[0]
    if y_base is not None:
        dy = y_base - baseline(t)
    return t.shift(RIGHT * dx + UP * dy)


def node(pos, r=R_NODE):
    return Circle(radius=r, stroke_color=NODE_STROKE, stroke_width=3, fill_color=NODE_FILL,
                  fill_opacity=1).move_to(pos).set_z_index(2)


def link(p, q, rp, rq, color, width, z=0):
    d = normalize(q - p)
    return Line(p + d * rp, q - d * rq, stroke_color=color, stroke_width=width).set_z_index(z)


def ew(w: float) -> float:
    return 1.2 + 6.0 * abs(w)


def cell(pos, cs, fill=PANEL, stroke=LINE, sw=1.2):
    s = 0.86 * cs
    return RoundedRectangle(width=s, height=s, corner_radius=0.16 * s, fill_color=fill, fill_opacity=1,
                            stroke_color=stroke, stroke_width=sw).move_to(pos)


def grid(nr, nc, cs, cx=MX, top=M_TOP):
    """Cell centres (row-major) of an nr x nc matrix, centred at cx with its top edge at ``top``."""
    x0 = cx - nc * cs / 2
    return {(r, c): P(x0 + cs * (c + 0.5), top - cs * (r + 0.5)) for r in range(nr) for c in range(nc)}


def row_box(centers, cs):
    xs = [p[0] for p in centers]
    return RoundedRectangle(width=max(xs) - min(xs) + cs + 0.08, height=cs + 0.08, corner_radius=0.08,
                            stroke_color=TEXT, stroke_width=2.5, fill_opacity=0).move_to(
        P((max(xs) + min(xs)) / 2, centers[0][1])).set_z_index(3)


def glow(color, r=0.1):
    return VGroup(*[Circle(radius=r * f, stroke_width=0, fill_color=color, fill_opacity=o)
                    for f, o in ((2.6, 0.16), (1.75, 0.32), (1.0, 1.0))]).set_z_index(4)


def pill(m: Mobject, fill, buff=0.08):
    r = RoundedRectangle(width=m.width + 2 * buff, height=m.height + 2 * buff, corner_radius=0.1,
                         stroke_width=0, fill_color=fill, fill_opacity=1).move_to(m)
    return VGroup(r, m).set_z_index(3)


def kernel_letter(k: int, center, size=30):
    m = tex(KERNEL[k], size=size)
    xh = tex("a", size=size).height
    m.move_to(center)
    m.shift(UP * (center[1] - xh / 2 - m.get_bottom()[1]))   # letters share a baseline
    return m.set_z_index(3)


def heat(w: float):
    return lerp_color(PANEL, C_RED, (w / A_MAX) ** 0.7)


def infl_color(t: int, s: int):
    """Direct input (diagonal, via U) in blue; memory carried by W in yellow, fading with age."""
    return lerp_color(LIGHT_GREY, C_BLUE if s == t else C_YELLOW, 0.2 + 0.8 * INFL[t, s])


def adj_color(r: int, c: int):
    if r == c:
        return L_GREEN
    return C_GREEN if ADJ[r, c] else PANEL


def token_row(tokens, x_left, xh):
    words, pills, x = [], [], x_left
    for s in tokens:
        t = T(s, TOK_SIZE)
        w = max(t.width + 2 * TOK_PAD, 0.44)
        cx = x + w / 2
        pills.append(RoundedRectangle(width=w, height=TOK_H, corner_radius=0.12, fill_color=PANEL,
                                      fill_opacity=1, stroke_color=GREY, stroke_width=1.8)
                     .move_to(P(cx, TOK_Y)).set_z_index(2))
        words.append(put(t, s, x_center=cx, y_base=TOK_Y - xh / 2).set_z_index(3))
        x += w + TOK_GAP
    return words, pills, x - TOK_GAP


def it_arcs(A, pills):
    """Arcs from "it" to every other token, drawn outward from "it"; width = attention weight."""
    arcs = []
    for j in range(len(TOKENS)):
        if j == IT:
            continue
        side = -1 if j < IT else 1
        p_it = pills[IT].get_top() + P(0.07 * side, 0.03)
        p_j = pills[j].get_top() + P(0, 0.03)
        arcs.append(ArcBetweenPoints(p_it, p_j, angle=ARC_ANGLE if j < IT else -ARC_ANGLE,
                                     stroke_color=C_RED, stroke_width=0.8 + 20 * A[IT, j],
                                     stroke_opacity=0.9).set_z_index(1))
    return arcs


# ------------------------------------------------------------------ summary icons
def dense_icon(c, cs=0.3):
    g = grid(N_OUT, N_IN, cs, cx=c[0], top=c[1] + N_OUT * cs / 2)
    return VGroup(*[cell(p, cs, diverging(W_DENSE[rc]), sw=0.9) for rc, p in g.items()])


def conv_icon(c, cs=0.3):
    g = grid(N_OUT, N_IN, cs, cx=c[0], top=c[1] + N_OUT * cs / 2)
    return VGroup(*[cell(p, cs, KTINT[BAND[rc]], KCOL[BAND[rc]], 1.8) if rc in BAND else
                    cell(p, cs, sw=0.9) for rc, p in g.items()])


def rnn_icon(c, n=4, dx=0.56):
    xs = [c[0] + (t - (n - 1) / 2) * dx for t in range(n)]
    hy, iy = c[1] + 0.32, c[1] - 0.46
    hs = [RoundedRectangle(width=0.3, height=0.3, corner_radius=0.07, fill_color=L_YELLOW,
                           fill_opacity=1, stroke_color=C_YELLOW, stroke_width=2.8).move_to(P(x, hy))
          for x in xs]
    ins = [Circle(radius=0.11, fill_color=L_BLUE, fill_opacity=1, stroke_color=C_BLUE,
                  stroke_width=2.8).move_to(P(x, iy)) for x in xs]
    kw = dict(buff=0.03, stroke_width=3.2, tip_length=0.09, max_tip_length_to_length_ratio=0.5,
              max_stroke_width_to_length_ratio=40)
    ups = [Arrow(P(x, iy + 0.11), P(x, hy - 0.15), color=C_BLUE, **kw) for x in xs]
    rights = [Arrow(P(xs[t] + 0.15, hy), P(xs[t + 1] - 0.15, hy), color=C_YELLOW, **kw)
              for t in range(n - 1)]
    return VGroup(*ups, *rights, *hs, *ins)


def graph_icon(c, R=0.44, r=0.12):
    cy = c[1] - 0.29
    pos = [P(c[0] + R * np.cos(np.radians(a)), cy + R * np.sin(np.radians(a))) for a in RING_ANGLES]
    pos.append(P(c[0], cy + 2 * R))
    bonds = [Line(pos[u], pos[v], stroke_color=GREY, stroke_width=4) for u, v in BONDS]
    atoms = [Circle(radius=r, stroke_width=0, fill_color=C_RED if e == "O" else MUTED,
                    fill_opacity=1).move_to(pos[k]) for k, e in enumerate(ELEM)]
    return VGroup(*bonds, *atoms)


def attn_icon(c, cs=0.17):
    g = grid(len(TOKENS), len(TOKENS), cs, cx=c[0], top=c[1] + len(TOKENS) * cs / 2)
    return VGroup(*[cell(p, cs, heat(A_SMALL[rc]), sw=0.6) for rc, p in g.items()])


class Wiring(Scene):
    def regroup(self, mobs):
        """Make a list of individually-added mobjects one top-level group (safe to transform)."""
        g = VGroup(*mobs)
        self.remove(*mobs)
        self.add(g)
        return g

    def construct(self):
        assert N_IN - K + 1 == N_OUT                       # valid convolution: 6 -> 4
        assert np.abs(W_DENSE).min() > 0.2 and np.abs(W_DENSE).max() <= 1.0
        assert len(ELEM) == 7 and len(BONDS) == 7 and (ADJ == ADJ.T).all() and ADJ.sum() == 7 + 14
        assert np.allclose(A_BIG.sum(axis=1), 1) and np.allclose(A_SMALL.sum(axis=1), 1)
        assert A_BIG[IT].argmax() == TROPHY and A_SMALL[IT].argmax() == SUITCASE

        asc = T("Hdhkl", LABEL_SIZE, weight=BOLD).height      # tallest glyphs above the baseline
        y_label = SAFE_Y - INSET - asc
        y_cap, y_sub = y_label - 0.6, y_label - 1.06
        xh_tok = T("x", TOK_SIZE).height
        x_text = -SAFE_X + INSET

        def block(label, caption, sub=None):
            parts = [put(T(label, LABEL_SIZE, TEXT, BOLD), label, x_left=x_text, y_base=y_label),
                     put(T(caption, CAP_SIZE), caption, x_left=x_text, y_base=y_cap)]
            if sub:
                parts.append(put(T(sub, SUB_SIZE, MUTED), sub, x_left=x_text, y_base=y_sub))
            return VGroup(*parts)

        def swap_block(old, new):
            return [LaggedStart(FadeOut(old), FadeIn(new, shift=0.2 * UP), lag_ratio=0.6)]

        def under_label(s, nrows, cs):
            return put(T(s, 21, MUTED), s, x_center=MX, y_base=M_TOP - nrows * cs - 0.45)

        def counter(n, words, y_base):
            """'24 different weights' as separate, baseline-aligned pieces centred under the matrix."""
            pieces = [put(T(str(n), 40, TEXT, BOLD), str(n), x_left=0, y_base=y_base)]
            for w in words:
                pieces.append(put(T(w, 26, MUTED), w, x_left=pieces[-1].get_right()[0] + 0.16,
                                  y_base=y_base))
            shift = MX - (pieces[0].get_left()[0] + pieces[-1].get_right()[0]) / 2
            return [p.shift(RIGHT * shift) for p in pieces]

        title = put(T("who talks to whom", 24, MUTED), "who talks to whom", x_center=MX,
                    y_base=TITLE_BASE)

        # ============================================================== 0. one neuron
        inp = [node(P(x, IN_Y)) for x in X_IN]
        out = [node(P(x, OUT_Y)) for x in X_OUT]
        edges = {(j, i): link(inp[i].get_center(), out[j].get_center(), R_NODE, R_NODE,
                              weight_color(W_DENSE[j, i]), ew(W_DENSE[j, i]))
                 for j in range(N_OUT) for i in range(N_IN)}
        g46 = grid(N_OUT, N_IN, CS)
        cells = {rc: cell(p, CS, diverging(W_DENSE[rc])) for rc, p in g46.items()}
        row_y = g46[(FOCUS, 0)][1]
        row0 = [cell(P(MX + (k - (K - 1) / 2) * CS, row_y), CS, diverging(W_DENSE[FOCUS, i]))
                for k, i in enumerate(NEURON_IN)]
        glyph = ParametricFunction(lambda t: P(t, 0.12 * np.tanh(13 * t)), t_range=[-0.17, 0.17, 0.01],
                                   stroke_color=TEXT, stroke_width=3.5).move_to(out[FOCUS]).set_z_index(3)

        cue(self, CUES[0])
        b0 = block("One neuron", "A weighted sum, then a bend")
        self.play(FadeIn(b0, shift=0.15 * UP), FadeIn(title),
                  LaggedStart(*[GrowFromCenter(inp[i]) for i in NEURON_IN], lag_ratio=0.15),
                  GrowFromCenter(out[FOCUS]), run_time=0.7)
        self.play(LaggedStart(*[Create(edges[(FOCUS, i)]) for i in NEURON_IN], lag_ratio=0.2),
                  LaggedStart(*[FadeIn(c, scale=0.6) for c in row0], lag_ratio=0.2), run_time=0.8)
        self.play(Create(glyph), out[FOCUS].animate(rate_func=there_and_back).scale(1.15), run_time=0.5)
        self.wait(0.45)

        # ============================================================== 1. dense
        cue(self, CUES[1])
        b1 = block("Dense", "Everyone talks to everyone")
        others_out = [j for j in range(N_OUT) if j != FOCUS]
        others_in = [i for i in range(N_IN) if i not in NEURON_IN]
        self.play(*swap_block(b0, b1), FadeOut(glyph),
                  *[TransformFromCopy(out[FOCUS], out[j]) for j in others_out],
                  *[GrowFromCenter(inp[i]) for i in others_in],
                  *[ReplacementTransform(row0[k], cells[(FOCUS, i)]) for k, i in enumerate(NEURON_IN)],
                  run_time=0.9)
        rest = [(j, i) for j in range(N_OUT) for i in range(N_IN) if not (j == FOCUS and i in NEURON_IN)]
        y_count = M_TOP - N_OUT * CS - 0.62
        c24 = counter(N_DENSE, ["different", "weights"], y_count)
        self.play(LaggedStart(*[Create(edges[ji]) for ji in rest], lag_ratio=0.04),
                  LaggedStart(*[FadeIn(cells[ji], scale=0.5) for ji in rest], lag_ratio=0.04),
                  *[FadeIn(p, shift=0.1 * UP) for p in c24], run_time=1.3)

        def focus(j, pairs):
            """Light up the edges into output j (and the node); dim the rest."""
            return ([edges[(jj, i)].animate.set_stroke(opacity=1.0 if jj == j else 0.15) for jj, i in pairs]
                    + [out[jj].animate.set_stroke(TEXT if jj == j else NODE_STROKE, width=4 if jj == j else 3)
                       for jj in range(N_OUT)])

        def unfocus(pairs):
            return ([edges[ji].animate.set_stroke(opacity=1.0) for ji in pairs]
                    + [o.animate.set_stroke(NODE_STROKE, width=3) for o in out])

        # rows = receivers: a box sweeps down the matrix while each output's incoming edges light up
        all_pairs = list(edges)
        box = row_box([g46[(0, c)] for c in range(N_IN)], CS)
        self.play(Create(box), *focus(0, all_pairs), run_time=0.4)
        for j in range(1, N_OUT):
            self.play(box.animate.move_to(P(MX, g46[(j, 0)][1])), *focus(j, all_pairs), run_time=0.32)
        self.play(FadeOut(box), *unfocus(all_pairs), run_time=0.35)
        self.wait(0.5)

        # ============================================================== 2. convolution
        cue(self, CUES[2])
        b2 = block("Convolution", f"Only neighbours, the same {K} weights everywhere", "images · audio · DNA")
        off = [ji for ji in edges if ji not in BAND]
        self.play(*swap_block(b1, b2), *[FadeOut(edges[ji]) for ji in off],
                  *[cells[ji].animate.set_fill(PANEL, 1).set_stroke(LINE, 1.2) for ji in off],
                  run_time=1.0)
        letters = [kernel_letter(k, g46[ji]) for ji, k in BAND.items()]
        c3 = counter(K, ["weights"], y_count)
        self.play(*[edges[ji].animate.set_stroke(KCOL[k], width=KW) for ji, k in BAND.items()],
                  *[cells[ji].animate.set_fill(KTINT[k], 1).set_stroke(KCOL[k], 2.2) for ji, k in BAND.items()],
                  LaggedStart(*[FadeIn(m, scale=0.5) for m in letters], lag_ratio=0.06),
                  ReplacementTransform(c24[0], c3[0]), FadeOut(c24[1]), ReplacementTransform(c24[2], c3[1]),
                  run_time=1.1)

        def window(j):
            rect = RoundedRectangle(width=(K - 1) * STEP + 2 * R_NODE + 0.34, height=2 * R_NODE + 0.34,
                                    corner_radius=0.24, stroke_color=TEXT, stroke_width=2.5,
                                    fill_opacity=0).move_to(P(X_IN[j + 1], IN_Y))
            strip = VGroup()
            for k in range(K):
                c = P(X_IN[j + k], IN_Y - 0.76)
                sq = RoundedRectangle(width=0.44, height=0.44, corner_radius=0.08, fill_color=KTINT[k],
                                      fill_opacity=1, stroke_color=KCOL[k], stroke_width=2.2).move_to(c)
                strip.add(VGroup(sq, kernel_letter(k, c, size=28)))
            return VGroup(rect, strip).set_z_index(3)

        band_pairs = list(BAND)
        win = window(0)
        box = row_box([g46[(0, c)] for c in range(N_IN)], CS)
        self.play(FadeIn(win, shift=0.1 * UP), Create(box), *focus(0, band_pairs), run_time=0.5)
        for j in range(1, N_OUT):
            self.play(win.animate.shift(STEP * RIGHT), box.animate.move_to(P(MX, g46[(j, 0)][1])),
                      *focus(j, band_pairs), run_time=0.55)
        self.play(FadeOut(box), *unfocus(band_pairs), run_time=0.35)
        self.wait(0.6)

        # ============================================================== 3. recurrent
        cue(self, CUES[3])
        b3 = block("Recurrent", "Read in order, carry a memory forward",
                   "speech · translation (until 2017) · river flows")
        r_in = [Circle(radius=R_NODE, fill_color=L_BLUE, fill_opacity=1, stroke_color=C_BLUE,
                       stroke_width=3).move_to(P(XR[t], IN_Y)).set_z_index(2) for t in range(N_T)]
        x_lab = [tex(f"x_{{{t + 1}}}", size=30, color=T_BLUE).move_to(r_in[t]).set_z_index(3)
                 for t in range(N_T)]
        hid = [RoundedRectangle(width=0.66, height=0.66, corner_radius=0.14, fill_color=PANEL,
                                fill_opacity=1, stroke_color=NODE_STROKE, stroke_width=3)
               .move_to(P(XR[t], H_Y)).set_z_index(2) for t in range(N_T)]
        g55 = grid(N_T, N_T, CS)
        cells5 = {rc: cell(p, CS) for rc, p in g55.items()}
        old = self.regroup([cells[(r, c)] for r in range(N_OUT) for c in range(N_IN)])
        mat5 = VGroup(*[cells5[(r, c)] for r in range(N_T) for c in range(N_T)])
        lab3 = under_label("same weights at every step", N_T, CS)
        self.play(*swap_block(b2, b3), FadeOut(win), *[FadeOut(m) for m in letters],
                  *[FadeOut(edges[ji]) for ji in BAND],
                  *[ReplacementTransform(inp[t], r_in[t]) for t in range(N_T)],
                  FadeOut(inp[N_IN - 1], scale=0.5),
                  *[ReplacementTransform(out[t], hid[t]) for t in range(N_OUT)], GrowFromCenter(hid[N_T - 1]),
                  ReplacementTransform(old, mat5), *[FadeOut(p) for p in c3], FadeIn(lab3),
                  run_time=1.2)

        def arrow(p, q, color):
            return Arrow(p, q, buff=0.05, stroke_width=5, color=color, tip_length=0.17,
                         max_tip_length_to_length_ratio=0.35,
                         max_stroke_width_to_length_ratio=30).set_z_index(1)

        ups = [arrow(r_in[t].get_top(), hid[t].get_bottom(), C_BLUE) for t in range(N_T)]
        chain = [arrow(hid[t].get_right(), hid[t + 1].get_left(), C_YELLOW) for t in range(N_T - 1)]
        u_lab = pill(tex("U", size=30, color=T_BLUE), L_BLUE).next_to(ups[0], LEFT, buff=0.12)
        w_lab = pill(tex("W", size=30, color=TEXT), L_YELLOW).next_to(chain[0], UP, buff=0.14)
        self.play(LaggedStart(*[FadeIn(m, scale=0.6) for m in x_lab], lag_ratio=0.08),
                  LaggedStart(*[GrowArrow(a) for a in ups], lag_ratio=0.08),
                  LaggedStart(*[GrowArrow(a) for a in chain], lag_ratio=0.1),
                  FadeIn(u_lab, scale=0.7), FadeIn(w_lab, scale=0.7), run_time=0.9)

        # the memory marches strictly step by step; row t of the matrix fills as h_t updates
        mem = glow(C_YELLOW, r=0.12)
        for t in range(N_T):
            pulse = glow(C_BLUE, r=0.08).move_to(r_in[t].get_top())
            self.add(pulse)
            moves = [pulse.animate.move_to(hid[t].get_bottom())]
            if t > 0:
                moves.append(mem.animate.move_to(hid[t].get_center()))
            self.play(*moves, run_time=0.3)
            self.remove(pulse)
            upd = [hid[t].animate.set_fill(L_YELLOW, 1).set_stroke(C_YELLOW, 3.5),
                   *[cells5[(t, s)].animate.set_fill(infl_color(t, s), 1) for s in range(t + 1)]]
            if t == 0:
                mem.move_to(hid[0].get_center())
                upd.append(FadeIn(mem, scale=0.4))
            self.play(*upd, run_time=0.22)
        self.wait(0.3)

        # ============================================================== 4. graph
        cue(self, CUES[4])
        b4 = block("Graph", "Atoms swap messages with their bonded neighbours",
                   "molecules · materials · weather on a globe mesh")
        apos = [P(DX + GR * np.cos(np.radians(a)), GY + GR * np.sin(np.radians(a))) for a in RING_ANGLES]
        apos.append(P(DX, GY + 2 * GR))
        atoms = [Circle(radius=R_ATOM, fill_color=C_RED if e == "O" else MUTED, fill_opacity=1,
                        stroke_color=C_RED if e == "O" else MUTED, stroke_width=2)
                 .move_to(apos[k]).set_z_index(2) for k, e in enumerate(ELEM)]
        alab = [T(e, 30, WHITE, BOLD).move_to(apos[k]).set_z_index(3) for k, e in enumerate(ELEM)]
        bonds = [link(apos[u], apos[v], R_ATOM - 0.02, R_ATOM - 0.02, GREY, 6) for u, v in BONDS]
        src = [hid[2], hid[3], r_in[3], r_in[2], r_in[1], hid[1], hid[0]]   # nodes that snap to C1..C6, O
        leftover = [hid[4], r_in[0], r_in[4]]
        g77 = grid(len(ELEM), len(ELEM), CS7)
        cells7 = {rc: cell(p, CS7, adj_color(*rc)) for rc, p in g77.items()}
        mat7 = VGroup(*[cells7[(r, c)] for r in range(len(ELEM)) for c in range(len(ELEM))])
        lab4 = under_label("the bonds decide", len(ELEM), CS7)
        self.play(*swap_block(b3, b4), *[FadeOut(m) for m in (*ups, *chain, u_lab, w_lab, mem, *x_lab)],
                  *[ReplacementTransform(src[k], atoms[k]) for k in range(len(ELEM))],
                  *[FadeOut(m, scale=0.5) for m in leftover],
                  ReplacementTransform(mat5, mat7), FadeOut(lab3), FadeIn(lab4), run_time=1.2)
        self.play(LaggedStart(*[Create(b) for b in bonds], lag_ratio=0.08),
                  LaggedStart(*[FadeIn(m, scale=0.5) for m in alab], lag_ratio=0.06), run_time=0.7)

        # message passing: every bond carries a message both ways at once, then every atom updates
        for _ in range(2):
            dots, moves = [], []
            for u, v in BONDS:
                for a, b in ((u, v), (v, u)):
                    dot = glow(C_GREEN, r=0.075).move_to(apos[a]).set_z_index(1)
                    dots.append(dot)
                    moves.append(dot.animate.move_to(apos[b]))
            self.add(*dots)
            self.play(*moves, run_time=0.6)
            self.remove(*dots)
            rings = [Circle(radius=R_ATOM, stroke_color=C_GREEN, stroke_width=5, fill_opacity=0)
                     .move_to(p).set_z_index(1) for p in apos]
            self.play(*[r.animate.scale(1.7).set_stroke(opacity=0) for r in rings],
                      *[m.animate(rate_func=there_and_back).scale(1.15) for m in atoms],
                      *[m.animate(rate_func=there_and_back).scale(1.15) for m in alab], run_time=0.4)
            self.remove(*rings)
        self.wait(0.4)

        # ============================================================== 5. attention
        cue(self, CUES[5])
        b5 = block("Attention", "Anyone can talk to anyone, and the wiring is computed from the data")
        _, _, end_small = token_row(TOKENS[:-1] + [SWAP], 0.0, xh_tok)
        x0 = DX - end_small / 2
        words, pills, _ = token_row(TOKENS, x0, xh_tok)
        assert x0 >= -SAFE_X and x0 + end_small <= X_MAX, (x0, x0 + end_small)
        tok_from = {1: 5, 2: 4, 3: 6, 5: 0, 6: 3, 7: 1, 8: 2}               # token <- atom
        fresh = [j for j in range(len(TOKENS)) if j not in tok_from]
        g10 = grid(len(TOKENS), len(TOKENS), CS10)
        cells10 = {rc: cell(p, CS10, heat(A_BIG[rc]), sw=1.0) for rc, p in g10.items()}
        mat10 = VGroup(*[cells10[(r, c)] for r in range(len(TOKENS)) for c in range(len(TOKENS))])
        lab5 = under_label("changes with the sentence", len(TOKENS), CS10)
        note = T("illustrative numbers", 18, MUTED)
        note.move_to(P(SAFE_X - INSET - note.width / 2, -SAFE_Y + INSET + note.height / 2))
        self.play(*swap_block(b4, b5), *[FadeOut(b) for b in bonds], *[FadeOut(m) for m in alab],
                  *[ReplacementTransform(atoms[a], pills[j]) for j, a in tok_from.items()],
                  *[FadeIn(pills[j], shift=0.1 * UP) for j in fresh],
                  ReplacementTransform(mat7, mat10), FadeOut(lab4), FadeIn(lab5), FadeIn(note),
                  run_time=1.2)
        self.play(LaggedStart(*[FadeIn(w, shift=0.06 * UP) for w in words], lag_ratio=0.05), run_time=0.6)

        arcs = it_arcs(A_BIG, pills)
        it_box = row_box([g10[(IT, c)] for c in range(len(TOKENS))], CS10)
        it_lab = put(T("it", 20), "it", x_left=0, y_base=g10[(IT, 0)][1] - 0.07)
        it_lab.shift(RIGHT * (g10[(IT, 0)][0] - CS10 / 2 - 0.14 - it_lab.get_right()[0]))
        self.play(pills[IT].animate.set_stroke(C_RED, width=3.5),
                  LaggedStart(*[Create(a) for a in arcs], lag_ratio=0.06),
                  Create(it_box), FadeIn(it_lab), run_time=1.0)
        self.wait(0.5)

        # swap the last word: the wiring is recomputed and "it" now points at "suitcase"
        words_s, pills_s, _ = token_row(TOKENS[:-1] + [SWAP], x0, xh_tok)
        pills_s[LAST].set_stroke(TEXT, width=2.5)
        pills_s[IT].set_stroke(C_RED, width=3.5)
        arcs_s = it_arcs(A_SMALL, pills_s)
        self.play(FadeTransform(words[LAST], words_s[LAST]), Transform(pills[LAST], pills_s[LAST]),
                  run_time=0.6)
        words[LAST] = words_s[LAST]
        self.play(*[Transform(a, b) for a, b in zip(arcs, arcs_s)],
                  *[cells10[rc].animate.set_fill(heat(A_SMALL[rc]), 1) for rc in cells10
                    if abs(A_SMALL[rc] - A_BIG[rc]) > 1e-9], run_time=1.1)
        self.wait(1.0)

        # ============================================================== 6. summary
        cue(self, CUES[6])
        XS = [-5.0, -2.5, 0.0, 2.5, 5.0]
        ICON_Y = 1.25
        icons = [dense_icon(P(XS[0], ICON_Y)), conv_icon(P(XS[1], ICON_Y)), rnn_icon(P(XS[2], ICON_Y)),
                 graph_icon(P(XS[3], ICON_Y))]
        att = attn_icon(P(XS[4], ICON_Y))
        names = ["Dense", "Convolution", "Recurrent", "Graph", "Attention"]
        bets = ["no assumptions", "neighbours matter", "order matters", "bonds matter", "learn who to look at"]
        y_name = ICON_Y - 1.45
        name_m = [put(T(s, 32, TEXT, BOLD), s, x_center=x, y_base=y_name) for s, x in zip(names, XS)]
        bet_m = [put(T(s, 22, MUTED), s, x_center=x, y_base=y_name - 0.48) for s, x in zip(bets, XS)]
        assert bet_m[-1].get_right()[0] <= SAFE_X and bet_m[0].get_left()[0] >= -SAFE_X
        y_big = y_name - 1.95
        big_a = T("Same neuron.", 58, TEXT, BOLD)
        big_b = T("Different wiring.", 58, C_BLUE, BOLD)
        space = T("H H", 58, TEXT, BOLD).width - T("HH", 58, TEXT, BOLD).width
        total = big_a.width + space + big_b.width
        put(big_a, x_left=-total / 2, y_base=y_big)
        put(big_b, x_left=big_a.get_right()[0] + space, y_base=y_big)
        big = VGroup(big_a, big_b)
        others = [m for m in self.mobjects if m is not mat10]
        quick = lambda t: smooth(min(1.0, t / 0.4))        # done in the first 40% of the move
        self.play(*[FadeOut(m, rate_func=quick) for m in others], ReplacementTransform(mat10, att),
                  LaggedStart(*[FadeIn(ic, scale=0.8) for ic in icons], lag_ratio=0.15), run_time=1.3)
        self.play(LaggedStart(*[AnimationGroup(FadeIn(n, shift=0.1 * UP), FadeIn(b, shift=0.1 * UP))
                                for n, b in zip(name_m, bet_m)], lag_ratio=0.12), run_time=0.9)
        self.play(FadeIn(big, shift=0.15 * UP), run_time=0.7)
        self.wait(1.6)
        write_cues(self, "m08_wiring")
