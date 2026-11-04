"""m07_attention: how "it" finds "wombat".

"The wombat crossed the road because it was hungry". Every token gets small query (Q), key (K)
and value (V) vectors. The query of "it" is compared with every earlier key (scaled dot
products), softmax turns the scores into weights ("wombat" wins), and the weighted sum of the
values flows into "it". Then the whole causal attention matrix builds row by row and the formula
assembles.

The numbers are illustrative but self-consistent: Q and K (d_k = 4) are fitted in numpy so that
their scaled dot products resemble a plausible attention pattern, and every score, weight and
matrix cell shown is computed from those Q, K (masked softmax).
"""
from common import *

TOKENS = ["The", "wombat", "crossed", "the", "road", "because", "it", "was", "hungry"]
N = len(TOKENS)
FOCUS = 6
D = 4
C_Q, C_K, C_V = C_PINK, C_ORANGE, C_BLUE

TOK_Y, Q_Y, K_Y, V_Y = 3.1, 2.38, 1.93, 1.48
SCORE_Y = 0.8
BAR_BASE = -1.15
BAR_SCALE = 2.0
WNUM_Y = -1.45


def build_attention():
    target = np.zeros((N, N))
    for i in range(N):
        target[i, i] = 1.0
        if i > 0:
            target[i, i - 1] = 1.2
    target[2, 1] = 2.2              # crossed -> wombat (subject)
    target[3, 2] = 0.8
    target[4, 2], target[4, 3] = 1.8, 1.0
    target[5, 2] = 1.2
    target[6, :7] = [0.4, 3.2, 0.9, 0.3, 1.4, 0.7, 1.1]          # it -> wombat
    target[7, 6], target[7, 1] = 2.0, 1.4
    target[8, 1], target[8, 6], target[8, 7] = 2.2, 1.6, 1.0
    mask = np.tril(np.ones((N, N)))
    rng = np.random.default_rng(7)
    Q = rng.normal(0, 0.6, (N, D))
    K = rng.normal(0, 0.6, (N, D))
    mQ, vQ, mK, vK = [np.zeros_like(Q) for _ in range(4)]
    for t in range(1, 6001):
        S = Q @ K.T / np.sqrt(D)
        E = (S - target) * mask
        gQ = E @ K / np.sqrt(D) + 1e-3 * Q
        gK = E.T @ Q / np.sqrt(D) + 1e-3 * K
        for P, g, m, v in ((Q, gQ, mQ, vQ), (K, gK, mK, vK)):
            m[:] = 0.9 * m + 0.1 * g
            v[:] = 0.999 * v + 0.001 * g * g
            P -= 0.01 * (m / (1 - 0.9 ** t)) / (np.sqrt(v / (1 - 0.999 ** t)) + 1e-8)
    S = Q @ K.T / np.sqrt(D)
    Sm = np.where(mask > 0, S, -np.inf)
    A = np.exp(Sm - Sm.max(1, keepdims=True))
    A /= A.sum(1, keepdims=True)
    V = rng.uniform(-1, 1, (N, D))
    return Q, K, V, S, A


def mini_vector(vals, color, vmax, cell=0.15, gap=0.025):
    g = VGroup()
    for k, v in enumerate(vals):
        sq = Square(cell, stroke_width=1.2, stroke_color=color, stroke_opacity=0.9,
                    fill_color=color, fill_opacity=0.15 + 0.85 * min(abs(v) / vmax, 1.0))
        g.add(sq)
    g.arrange(RIGHT, buff=gap)
    return g


class Attention(Scene):
    def construct(self):
        Q, K, V, S, A = build_attention()
        assert int(np.argmax(A[FOCUS, :FOCUS + 1])) == 1, A[FOCUS]

        caption = corner_caption("illustrative numbers")
        self.add(caption)

        # ------------------------------------------------------------------ tokens
        words, boxes = VGroup(), VGroup()
        for i, w in enumerate(TOKENS):
            t = txt(w, size=27)
            b = RoundedRectangle(width=max(t.width + 0.3, 0.78), height=0.6, corner_radius=0.12,
                                 stroke_color=MUTED, stroke_width=2, fill_color=PANEL,
                                 fill_opacity=1)
            words.add(t)
            boxes.add(b)
        boxes.arrange(RIGHT, buff=0.2).move_to([0.25, TOK_Y, 0])
        COL_X = [b.get_center()[0] for b in boxes]
        # put every word on a common baseline (words with descenders hang below it)
        desc = txt("a", size=27).get_bottom()[1] - txt("g", size=27).get_bottom()[1]
        for t, b, w in zip(words, boxes, TOKENS):
            base_y = b.get_center()[1] - 0.12
            t.move_to(b)
            drop = desc if any(ch in "gjpqy" for ch in w) else 0.0
            t.shift(UP * (base_y - drop - t.get_bottom()[1]))
        cue(self, "A sentence, split into tokens")
        self.play(LaggedStart(*[AnimationGroup(FadeIn(boxes[i], shift=0.2 * UP),
                                               FadeIn(words[i], shift=0.2 * UP))
                                for i in range(N)], lag_ratio=0.12), run_time=1.5)

        # ------------------------------------------------------------------ Q K V
        qmax, kmax, vmax = np.abs(Q).max(), np.abs(K).max(), np.abs(V).max()
        qv = VGroup(*[mini_vector(Q[i], C_Q, qmax).move_to([COL_X[i], Q_Y, 0]) for i in range(N)])
        kv = VGroup(*[mini_vector(K[i], C_K, kmax).move_to([COL_X[i], K_Y, 0]) for i in range(N)])
        vv = VGroup(*[mini_vector(V[i], C_V, vmax).move_to([COL_X[i], V_Y, 0]) for i in range(N)])
        row_labels = VGroup(tex("Q", size=32, color=C_Q).move_to([-6.6, Q_Y, 0]),
                            tex("K", size=32, color=C_K).move_to([-6.6, K_Y, 0]),
                            tex("V", size=32, color=C_V).move_to([-6.6, V_Y, 0]))
        cue(self, "Each token gets a query, a key and a value")
        for row, lab in ((qv, row_labels[0]), (kv, row_labels[1]), (vv, row_labels[2])):
            self.play(FadeIn(lab, shift=0.1 * RIGHT),
                      LaggedStart(*[GrowFromCenter(m) for m in row], lag_ratio=0.06),
                      run_time=0.55)

        # ------------------------------------------------------------------ focus on "it"
        fbox = boxes[FOCUS]
        cue(self, "“it” compares its query with every earlier key")
        future = VGroup(*[VGroup(boxes[i], words[i], qv[i], kv[i], vv[i])
                          for i in range(FOCUS + 1, N)])
        self.play(fbox.animate.set_stroke(C_PURPLE, width=4), words[FOCUS].animate.set_color(TEXT),
                  future.animate.set_opacity(0.25), run_time=0.6)

        # scan: q_it . k_j / sqrt(d)
        scores = VGroup(*[tex(num(S[FOCUS, j], 1), size=28).move_to([COL_X[j], SCORE_Y, 0])
                          for j in range(FOCUS + 1)])
        score_lab = txt("score", size=22, color=MUTED).move_to([-6.55, SCORE_Y, 0])
        qcopy = qv[FOCUS].copy()
        mid_y = (Q_Y + K_Y) / 2
        self.play(qcopy.animate.move_to([COL_X[0], mid_y, 0]), FadeIn(score_lab), run_time=0.6)
        scan = qcopy.animate(rate_func=linear).move_to([COL_X[FOCUS], mid_y, 0])
        pops = LaggedStart(*[FadeIn(s, scale=0.6) for s in scores], lag_ratio=1.0)
        self.play(scan, pops, run_time=2.0)
        self.play(FadeOut(qcopy), run_time=0.3)

        # softmax -> weights (bars)
        cue(self, "Softmax turns the scores into attention weights: “wombat” wins")
        w = A[FOCUS, :FOCUS + 1]
        bars = VGroup()
        for j in range(FOCUS + 1):
            h = max(BAR_SCALE * w[j], 0.02)
            bars.add(Rectangle(width=0.5, height=h, stroke_width=0, fill_color=C_PURPLE,
                               fill_opacity=0.9).move_to([COL_X[j], BAR_BASE + h / 2, 0]))
        base = Line([COL_X[0] - 0.5, BAR_BASE, 0], [COL_X[FOCUS] + 0.5, BAR_BASE, 0],
                    stroke_color=MUTED, stroke_width=1.5)
        wnums = VGroup(*[tex(f"{w[j]:.2f}", size=26, color=C_PURPLE)
                         .move_to([COL_X[j], WNUM_Y, 0]) for j in range(FOCUS + 1)])
        sm_lab = txt("softmax", size=22, color=MUTED).move_to([-6.45, BAR_BASE + 0.45, 0])
        self.play(FadeIn(sm_lab), Create(base),
                  LaggedStart(*[GrowFromEdge(b, DOWN) for b in bars], lag_ratio=0.08),
                  *[TransformFromCopy(scores[j], wnums[j]) for j in range(FOCUS + 1)],
                  run_time=1.3)
        self.play(Indicate(words[1], color=C_PURPLE, scale_factor=1.2),
                  Indicate(wnums[1], color=C_PURPLE, scale_factor=1.25), run_time=0.7)

        # weighted sum of values flows into "it"
        cue(self, "The weighted sum of values flows into “it”")
        flows = []
        copies = VGroup()
        for j in range(FOCUS + 1):
            c = vv[j].copy()
            c.set_fill(opacity=0.15 + 0.85 * w[j] / w.max())
            c.set_stroke(opacity=0.3 + 0.7 * w[j] / w.max())
            copies.add(c)
            flows.append(c.animate.scale(0.5 + 0.5 * w[j] / w.max()).move_to(fbox.get_center()))
        self.play(LaggedStart(*flows, lag_ratio=0.06), run_time=1.3)
        self.play(FadeOut(copies, scale=0.5), fbox.animate.set_fill(C_PURPLE, opacity=0.45),
                  Flash(fbox, color=C_PURPLE, flash_radius=0.55, line_length=0.15), run_time=0.7)
        self.wait(0.4)

        # ------------------------------------------------------------------ full causal matrix
        cue(self, "Every token does this at once: the causal attention matrix")
        cell = 0.5
        x0, y0 = -4.55, 1.55

        def cpos(i, j):
            return np.array([x0 + cell * (j + 0.5), y0 - cell * (i + 0.5), 0])

        col_labs = VGroup()
        row_labs = VGroup()
        for i, t in enumerate(TOKENS):
            cl = txt(t, size=20, color=TEXT).rotate(55 * DEGREES)
            cl.move_to(cpos(0, i) + UP * 0.32, aligned_edge=DL).shift(LEFT * 0.06)
            col_labs.add(cl)
            rl = txt(t, size=20, color=TEXT)
            rl.move_to(cpos(i, 0) + LEFT * 0.38, aligned_edge=RIGHT)
            row_labs.add(rl)
        keys_lab = txt("keys", size=20, color=C_K).next_to(col_labs, UP, buff=0.12)
        q_lab = txt("queries", size=20, color=C_Q).rotate(90 * DEGREES)
        q_lab.next_to(row_labs, LEFT, buff=0.18)

        fade_out = VGroup(qv, kv, vv, row_labels, scores, score_lab, wnums, sm_lab, base, boxes)
        self.play(FadeOut(fade_out), *[words[i].animate.set_opacity(1) for i in range(FOCUS + 1, N)],
                  run_time=0.6)
        self.play(*[ReplacementTransform(words[i], col_labs[i]) for i in range(N)],
                  *[TransformFromCopy(words[i], row_labs[i]) for i in range(N)],
                  FadeIn(keys_lab), FadeIn(q_lab), run_time=1.2)

        def make_cell(i, j):
            sq = Square(cell * 0.94, stroke_width=1.2).move_to(cpos(i, j))
            if j <= i:
                a = A[i, j]
                sq.set_fill(C_PURPLE, opacity=0.12 + 0.88 * a ** 0.7)
                sq.set_stroke(C_PURPLE, width=1.2, opacity=0.55)
            else:
                sq.set_fill(BG, opacity=1)
                sq.set_stroke(GRID, width=1.0, opacity=0.6)
            return sq

        cells = [[make_cell(i, j) for j in range(N)] for i in range(N)]
        # "it" row: the bars become cells
        self.play(*[ReplacementTransform(bars[j], cells[FOCUS][j]) for j in range(FOCUS + 1)],
                  *[FadeIn(cells[FOCUS][j]) for j in range(FOCUS + 1, N)], run_time=1.0)
        it_box = SurroundingRectangle(VGroup(*cells[FOCUS]), buff=0.04, stroke_color=TEXT,
                                      stroke_width=2.5)
        self.play(Create(it_box), run_time=0.4)
        order = [i for i in range(N) if i != FOCUS]
        self.play(LaggedStart(*[LaggedStart(*[FadeIn(cells[i][j], scale=0.6) for j in range(N)],
                                            lag_ratio=0.05) for i in order], lag_ratio=0.18),
                  run_time=2.4)
        self.bring_to_front(it_box)

        # ------------------------------------------------------------------ formula
        cue(self, "Attention(Q, K, V) = softmax(QKᵀ / √dₖ) V")
        cm = {"Q": C_Q, "K": C_K, "V": C_V}
        f1 = tex(r"\mathrm{Attention}(", "Q", ",", "K", ",", "V", ")", size=44, cmap=cm)
        f2 = tex(r"=\;\,", r"\mathrm{softmax}\!\Big(", r"\frac{", "Q", "K", r"^\top}{\sqrt{d_k}}",
                 r"\Big)", r"\;V", size=44, cmap=cm)
        f2[7].set_color(C_V)
        f2[1].set_color(C_PURPLE)
        f2[6].set_color(C_PURPLE)
        f1.move_to([3.55, 0.75, 0])
        f2.next_to(f1, DOWN, buff=0.45).align_to(f1, LEFT).shift(RIGHT * 0.35)
        self.play(Write(f1), run_time=1.0)
        self.play(FadeIn(f2[0]), Write(VGroup(f2[1], f2[6])), run_time=0.7)
        self.play(TransformFromCopy(f1[1], f2[3]), TransformFromCopy(f1[3], f2[4]),
                  FadeIn(f2[2]), FadeIn(f2[5]), run_time=0.9)
        self.play(TransformFromCopy(f1[5], f2[7]), run_time=0.6)
        xl, xr = f2[1].get_left()[0] - 0.17, f2[6].get_right()[0] + 0.17
        yt = max(f2[k].get_top()[1] for k in range(1, 7)) + 0.14
        yb = min(f2[k].get_bottom()[1] for k in range(1, 7)) - 0.14
        sm_box = RoundedRectangle(width=xr - xl, height=yt - yb, corner_radius=0.1,
                                  stroke_color=C_PURPLE, stroke_width=2.5).move_to(
                                      [(xl + xr) / 2, (yt + yb) / 2, 0])
        link = CurvedArrow(sm_box.get_bottom() + DOWN * 0.08,
                           cpos(FOCUS + 1, N - 1) + RIGHT * 0.45, angle=-TAU / 6,
                           color=C_PURPLE, stroke_width=3, tip_length=0.16)
        self.play(Create(sm_box), Create(link), run_time=0.9)
        self.wait(1.6)
        write_cues(self, "m07_attention")
