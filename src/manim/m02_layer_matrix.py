"""m02_layer_matrix: a layer is a matrix.

3 inputs -> 4 neurons. Each neuron's incoming edges slide into one row of the 4x3 matrix W;
then a row . column dot product, + b, sigma, and the compact form a = sigma(Wx + b).
Row 1 is the exact neuron from m01 (w = 1.2, -0.8, 0.5; b = -0.2) so the two clips connect.
All numbers are computed below.
"""
from common import *

X_VALS = np.array([0.9, 0.2, 0.6])
W = np.array([[1.2, -0.8, 0.5],
              [-0.4, 0.9, 0.7],
              [0.3, 1.1, -1.0],
              [-0.9, 0.2, 0.6]])
B = np.array([-0.2, 0.1, 0.4, -0.3])
Z = W @ X_VALS + B
A = sigmoid(Z)

Y_C = 1.0                      # vertical centre of the network / matrices
ROW_DY = 0.95
ROW_YS = [Y_C + 1.5 * ROW_DY - i * ROW_DY for i in range(4)]
IN_YS = [Y_C + 1.2, Y_C, Y_C - 1.2]
X_ROW_YS = [Y_C + ROW_DY, Y_C, Y_C - ROW_DY]
IN_X, NEU_X = -5.9, -3.2
R_IN, R_NEU = 0.36, 0.33
A_COL = -2.0
W_COLS = [0.65, 1.55, 2.45]
X_COL = 3.62
B_COL = 5.2
ENTRY = 32


def brackets(x_l, x_r, y_t, y_b, tick=0.14, color=TEXT, sw=2.5):
    left = VMobject(stroke_color=color, stroke_width=sw).set_points_as_corners(
        [[x_l + tick, y_t, 0], [x_l, y_t, 0], [x_l, y_b, 0], [x_l + tick, y_b, 0]])
    right = VMobject(stroke_color=color, stroke_width=sw).set_points_as_corners(
        [[x_r - tick, y_t, 0], [x_r, y_t, 0], [x_r, y_b, 0], [x_r - tick, y_b, 0]])
    return VGroup(left, right)


def paren(x_extreme, y_t, y_b, side="(", color=TEXT, sw=2.8, half=17 * DEGREES):
    """Arc parenthesis whose bulge (left-most point for '(') sits at x_extreme."""
    h = y_t - y_b
    r = h / (2 * np.sin(half))
    yc = (y_t + y_b) / 2
    if side == "(":
        arc = Arc(radius=r, start_angle=PI - half, angle=2 * half)
        arc.move_arc_center_to([x_extreme + r, yc, 0])
    else:
        arc = Arc(radius=r, start_angle=-half, angle=2 * half)
        arc.move_arc_center_to([x_extreme - r, yc, 0])
    return arc.set_stroke(color, sw)


def pill(m: Mobject, buff=0.07):
    r = RoundedRectangle(width=m.width + 2 * buff, height=m.height + 2 * buff,
                         corner_radius=min(0.1, (m.height + 2 * buff) / 2), stroke_width=0,
                         fill_color=BG, fill_opacity=1).move_to(m)
    return VGroup(r, m)


class LayerMatrix(Scene):
    def construct(self):
        assert abs(Z[0] - 1.02) < 1e-9

        # ------------------------------------------------------------------ network
        inputs = VGroup(*[Circle(radius=R_IN, stroke_color=C_BLUE, stroke_width=3,
                                 fill_color=BG, fill_opacity=1).move_to([IN_X, y, 0])
                          for y in IN_YS])
        in_vals = VGroup(*[tex(f"{v:.1f}", size=30, color=C_BLUE).move_to(c)
                           for v, c in zip(X_VALS, inputs)])
        neurons = VGroup(*[Circle(radius=R_NEU, stroke_color=TEXT, stroke_width=3,
                                  fill_color=C_BLUE, fill_opacity=0).move_to([NEU_X, y, 0])
                           for y in ROW_YS])
        edges = [[None] * 3 for _ in range(4)]
        edge_group = VGroup()
        for j in range(4):
            for i in range(3):
                p, q = inputs[i].get_center(), neurons[j].get_center()
                d = normalize(q - p)
                e = Line(p + d * R_IN, q - d * R_NEU, stroke_color=weight_color(W[j, i]),
                         stroke_width=4.2 * abs(W[j, i]) + 0.6)
                edges[j][i] = e
                edge_group.add(e)

        cue(self, "3 inputs → 4 neurons: 12 weights")
        self.play(LaggedStart(*[GrowFromCenter(c) for c in inputs], lag_ratio=0.15),
                  LaggedStart(*[FadeIn(v, scale=0.6) for v in in_vals], lag_ratio=0.15),
                  run_time=0.8)
        self.play(LaggedStart(*[GrowFromCenter(n) for n in neurons], lag_ratio=0.12),
                  LaggedStart(*[Create(e) for e in edge_group], lag_ratio=0.04),
                  run_time=1.2)
        self.add(inputs, in_vals, neurons)  # keep nodes above edges
        self.wait(0.2)

        # ------------------------------------------------------------------ maths layout
        top = ROW_YS[0] + 0.45
        bot = ROW_YS[-1] - 0.45
        w_entries = VGroup(*[VGroup(*[tex(num(W[j, i], 1), size=ENTRY, color=C_YELLOW)
                                      .move_to([W_COLS[i], ROW_YS[j], 0]) for i in range(3)])
                             for j in range(4)])
        w_br = brackets(W_COLS[0] - 0.52, W_COLS[2] + 0.52, top, bot)
        x_entries = VGroup(*[tex(f"{X_VALS[i]:.1f}", size=ENTRY, color=C_BLUE)
                             .move_to([X_COL, X_ROW_YS[i], 0]) for i in range(3)])
        x_br = brackets(X_COL - 0.45, X_COL + 0.45, X_ROW_YS[0] + 0.45, X_ROW_YS[-1] - 0.45)
        b_entries = VGroup(*[tex(num(B[j], 1), size=ENTRY, color=C_TEAL)
                             .move_to([B_COL, ROW_YS[j], 0]) for j in range(4)])
        b_br = brackets(B_COL - 0.52, B_COL + 0.52, top, bot)
        a_entries = VGroup(*[tex(f"{A[j]:.2f}", size=ENTRY, color=C_BLUE)
                             .move_to([A_COL, ROW_YS[j], 0]) for j in range(4)])
        a_br = brackets(A_COL - 0.5, A_COL + 0.5, top, bot)
        tall = r"\vphantom{\begin{matrix}0\\0\\0\\0\end{matrix}}"
        lpar = MathTex(r"\left(" + tall + r"\right.", color=TEXT).set_height(top - bot + 0.1)
        rpar = MathTex(r"\left." + tall + r"\right)", color=TEXT).set_height(top - bot + 0.1)
        lpar.stretch(0.72, 0)
        rpar.stretch(0.72, 0)
        lpar.next_to(w_br, LEFT, buff=0.08)
        rpar.next_to(b_br, RIGHT, buff=0.08)
        sig = tex(r"\sigma", size=48).next_to(lpar, LEFT, buff=0.06)
        eq_sign = tex("=", size=44).next_to(sig, LEFT, buff=0.22)
        plus = tex("+", size=44).move_to([(X_COL + 0.45 + B_COL - 0.52) / 2, Y_C, 0])

        lab_y = bot - 0.42
        lab_a = tex(r"\mathbf{a}", size=40, color=C_BLUE).move_to([A_COL, lab_y, 0])
        lab_W = tex("W", size=40, color=C_YELLOW).move_to([W_COLS[1], lab_y, 0])
        lab_x = tex(r"\mathbf{x}", size=40, color=C_BLUE).move_to([X_COL, lab_y, 0])
        lab_b = tex(r"\mathbf{b}", size=40, color=C_TEAL).move_to([B_COL, lab_y, 0])

        # ------------------------------------------------------------------ edges -> rows
        def weight_labels(j):
            labels = VGroup()
            for i in range(3):
                lab = pill(tex(num(W[j, i], 1), size=28, color=C_YELLOW))
                lab.move_to(edges[j][i].point_from_proportion(0.36))
                labels.add(lab)
            return labels

        def others(j):
            return [edges[jj][i] for jj in range(4) for i in range(3) if jj != j]

        cue(self, "Each neuron's incoming weights become one row of W")
        labels = weight_labels(0)
        self.play(*[e.animate.set_stroke(opacity=0.12) for e in others(0)],
                  Indicate(neurons[0], color=TEXT, scale_factor=1.15),
                  LaggedStart(*[FadeIn(l, scale=0.7) for l in labels], lag_ratio=0.2),
                  Create(w_br), run_time=0.8)
        self.play(*[ReplacementTransform(labels[i][1], w_entries[0][i], path_arc=-0.5)
                    for i in range(3)], *[FadeOut(labels[i][0]) for i in range(3)],
                  run_time=1.0)
        for j in range(1, 4):
            labels = weight_labels(j)
            self.play(*[e.animate.set_stroke(opacity=0.12) for e in others(j)],
                      *[edges[j][i].animate.set_stroke(opacity=1) for i in range(3)],
                      LaggedStart(*[FadeIn(l, scale=0.7) for l in labels], lag_ratio=0.15),
                      run_time=0.4)
            self.play(*[ReplacementTransform(labels[i][1], w_entries[j][i], path_arc=-0.5)
                        for i in range(3)], *[FadeOut(labels[i][0]) for i in range(3)],
                      run_time=0.55)
        self.play(*[e.animate.set_stroke(opacity=1) for e in edge_group],
                  FadeIn(lab_W, shift=0.15 * UP), run_time=0.5)

        # ------------------------------------------------------------------ x vector, b, sigma
        cue(self, "The inputs become the column x; add the bias b and apply σ")
        self.play(Create(x_br), *[TransformFromCopy(in_vals[i], x_entries[i], path_arc=-0.4)
                                  for i in range(3)], FadeIn(lab_x, shift=0.15 * UP),
                  run_time=1.0)
        self.play(FadeIn(plus), Create(b_br),
                  LaggedStart(*[FadeIn(b, shift=0.1 * LEFT) for b in b_entries], lag_ratio=0.1),
                  FadeIn(lab_b, shift=0.15 * UP), run_time=0.9)
        self.play(FadeIn(sig), Create(lpar), Create(rpar), FadeIn(eq_sign), Create(a_br),
                  FadeIn(lab_a, shift=0.15 * UP), run_time=0.8)
        self.wait(0.3)

        # ------------------------------------------------------------------ row 1 . x
        cue(self, "Row 1 · x + b = 1.02 and σ(1.02) ≈ 0.73: the neuron from before")
        def rbox(m, color):
            return SurroundingRectangle(m, buff=0.1, corner_radius=0.08, stroke_color=color,
                                        stroke_width=2.5)

        row_box = rbox(w_entries[0], C_YELLOW)
        col_box = rbox(x_entries, C_BLUE)
        self.play(Create(row_box), Create(col_box), run_time=0.5)
        CY = -2.3
        w_s = [num(W[0, i], 1) for i in range(3)]
        x_s = [f"{X_VALS[i]:.1f}" for i in range(3)]
        line = tex(f"({w_s[0]})", f"({x_s[0]})", "+", f"({w_s[1]})", f"({x_s[1]})", "+",
                   f"({w_s[2]})", f"({x_s[2]})", "+", f"({num(B[0], 1)})", "=", num(Z[0]),
                   size=40)
        for k in (0, 3, 6):
            line[k].set_color(C_YELLOW)
        for k in (1, 4, 7):
            line[k].set_color(C_BLUE)
        line[9].set_color(C_TEAL)
        line.move_to([0, CY, 0])
        anims = [AnimationGroup(TransformFromCopy(w_entries[0][i], line[3 * i]),
                                TransformFromCopy(x_entries[i], line[3 * i + 1]))
                 for i in range(3)]
        self.play(LaggedStart(*anims, lag_ratio=0.35), FadeIn(line[2]), FadeIn(line[5]),
                  run_time=1.4)
        b_box = rbox(b_entries[0], C_TEAL)
        self.play(Create(b_box), FadeIn(line[8]), TransformFromCopy(b_entries[0], line[9]),
                  run_time=0.8)
        self.play(Write(line[10:12]), run_time=0.5)
        sig_line = tex(r"\sigma(", num(Z[0]), ")", "=", f"{A[0]:.2f}", size=40)
        sig_line[4].set_color(C_BLUE)
        sig_line.move_to([0, CY, 0])
        self.play(FadeOut(line[0:11], shift=0.2 * LEFT),
                  ReplacementTransform(line[11], sig_line[1]),
                  FadeIn(sig_line[0]), FadeIn(sig_line[2:4]), run_time=0.8)
        self.play(Write(sig_line[4]), run_time=0.4)
        self.play(TransformFromCopy(sig_line[4], a_entries[0], path_arc=0.4),
                  neurons[0].animate.set_fill(opacity=float(A[0])), run_time=0.9)
        self.wait(0.2)

        # ------------------------------------------------------------------ remaining rows
        cue(self, "The other rows give the other three neurons")
        self.play(FadeOut(sig_line), FadeOut(b_box), run_time=0.3)
        for j in range(1, 4):
            bb = rbox(b_entries[j], C_TEAL)
            self.play(Transform(row_box, rbox(w_entries[j], C_YELLOW)), FadeIn(bb), run_time=0.3)
            self.play(FadeIn(a_entries[j], shift=0.15 * RIGHT),
                      neurons[j].animate.set_fill(opacity=float(A[j])), FadeOut(bb),
                      run_time=0.35)
        self.play(FadeOut(row_box), FadeOut(col_box), run_time=0.3)

        # ------------------------------------------------------------------ compact formula
        cue(self, "A whole layer: a = σ(Wx + b)")
        final = tex(r"\mathbf{a}", "=", r"\sigma(", "W", r"\mathbf{x}", "+", r"\mathbf{b}", ")",
                    size=60, cmap={r"\mathbf{a}": C_BLUE, "W": C_YELLOW, r"\mathbf{x}": C_BLUE,
                                   r"\mathbf{b}": C_TEAL})
        final.move_to([0.4, -2.45, 0])
        self.play(TransformFromCopy(lab_a, final[0]), TransformFromCopy(lab_W, final[3]),
                  TransformFromCopy(lab_x, final[4]), TransformFromCopy(lab_b, final[6]),
                  FadeIn(final[1]), FadeIn(final[2]), FadeIn(final[5]), FadeIn(final[7]),
                  run_time=1.2)
        box = SurroundingRectangle(final, buff=0.28, corner_radius=0.12, stroke_color=TEXT,
                                   stroke_width=2.5)
        self.play(Create(box), run_time=0.7)
        self.wait(1.7)
        write_cues(self, "m02_layer_matrix")
