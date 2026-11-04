"""m05_backprop: the chain rule on a 3-step computational graph (numbers from DESIGN.md 3a).

x=2 --[x w, w=0.5]--> z=1.0 --[sigma]--> y_hat=0.731 --[(y_hat - y)^2, y=1]--> L=0.0723
dL/dy_hat = -0.538, dy_hat/dz = 0.197, dz/dw = 2  =>  dL/dw = -0.2115
update (eta = 0.1): w <- 0.5 - eta(-0.2115) = 0.521, and the loss drops to 0.0680.
"""
from common import *

X, W0, YT, ETA = 2.0, 0.5, 1.0, 0.1
Z = W0 * X
YH = float(sigmoid(Z))
L = (YH - YT) ** 2
D_L_YH = 2 * (YH - YT)
D_YH_Z = YH * (1 - YH)
D_Z_W = X
D_L_W = D_L_YH * D_YH_Z * D_Z_W
W1 = W0 - ETA * D_L_W
Z1 = W1 * X
YH1 = float(sigmoid(Z1))
L1 = (YH1 - YT) ** 2

GY = 1.45  # graph row


def value_node(sym, color, pos, r=0.48):
    c = Circle(radius=r, stroke_color=color, stroke_width=3, fill_color=BG,
               fill_opacity=1).move_to(pos)
    t = tex(sym, size=42, color=color).move_to(pos)
    return VGroup(c, t)


def op_node(sym, pos, size=34):
    t = tex(sym, size=size)
    w = max(0.8, t.width + 0.36)
    sq = RoundedRectangle(width=w, height=0.8, corner_radius=0.14, stroke_color=MUTED,
                          stroke_width=2.5, fill_color=PANEL, fill_opacity=1).move_to(pos)
    t.move_to(pos)
    return VGroup(sq, t)


def frac_parts(num, num_c, den, den_c):
    return ([r"\frac{", r"\partial ", num, "}{", r"\partial ", den, "}"],
            [None, C_GREEN, num_c, None, C_GREEN, den_c, None])


def colored(parts, cols, size):
    m = MathTex(*parts, font_size=size, color=TEXT)
    for i, c in enumerate(cols):
        if c is not None:
            m[i].set_color(c)
    return m


def link(a: Mobject, b: Mobject, color=MUTED):
    return Arrow(a.get_center(), b.get_center(), buff=0, stroke_color=color, stroke_width=3,
                 tip_length=0.16, max_tip_length_to_length_ratio=0.25)


def edge_between(m1, m2, color=MUTED):
    """Arrow from the boundary of m1 to the boundary of m2 (horizontal or vertical)."""
    p1, p2 = m1.get_center(), m2.get_center()
    d = normalize(p2 - p1)
    if abs(d[0]) > abs(d[1]):
        s = m1.get_right() if d[0] > 0 else m1.get_left()
        e = m2.get_left() if d[0] > 0 else m2.get_right()
    else:
        s = m1.get_bottom() if d[1] < 0 else m1.get_top()
        e = m2.get_top() if d[1] < 0 else m2.get_bottom()
    return Arrow(s, e, buff=0.06, stroke_color=color, stroke_width=3, tip_length=0.16,
                 max_tip_length_to_length_ratio=0.3)


class Backprop(Scene):
    def construct(self):
        assert f"{D_L_W:.4f}" == "-0.2115" and f"{L:.4f}" == "0.0723", (D_L_W, L)

        # ------------------------------------------------------------------ graph
        xs = [-6.0, -4.15, -2.3, -0.45, 1.4, 3.45, 5.6]
        n_x = value_node("x", C_BLUE, [xs[0], GY, 0])
        o_mul = op_node(r"\times", [xs[1], GY, 0], size=40)
        n_z = value_node("z", TEXT, [xs[2], GY, 0])
        o_sig = op_node(r"\sigma", [xs[3], GY, 0], size=40)
        n_yh = value_node(r"\hat{y}", TEXT, [xs[4], GY, 0])
        o_loss = op_node(r"(\,\cdot\,-y)^2", [xs[5], GY, 0], size=30)
        n_L = value_node("L", C_RED, [xs[6], GY, 0])
        n_w = value_node("w", C_YELLOW, [xs[1], GY + 1.6, 0], r=0.42)
        n_y = value_node("y", TEXT, [xs[5], GY + 1.6, 0], r=0.42)
        chain = [n_x, o_mul, n_z, o_sig, n_yh, o_loss, n_L]
        edges = [edge_between(chain[i], chain[i + 1]) for i in range(6)]
        e_w = edge_between(n_w, o_mul)
        e_y = edge_between(n_y, o_loss)

        def above(m, s, color, size=32):
            return tex(s, size=size, color=color).next_to(m, UP, buff=0.16)

        v_x = above(n_x, "2", C_BLUE)
        v_w = tex(f"{W0:.1f}", size=32, color=C_YELLOW).next_to(n_w, LEFT, buff=0.2)
        v_y = tex(f"{YT:.0f}", size=32, color=TEXT).next_to(n_y, RIGHT, buff=0.2)
        v_z = above(n_z, f"{Z:.1f}", C_BLUE)
        v_yh = above(n_yh, f"{YH:.3f}", C_BLUE)
        v_L = above(n_L, f"{L:.4f}", C_RED)

        cue(self, "A computational graph: x → ×w → σ → (ŷ − y)² → L")
        self.play(LaggedStart(*[FadeIn(m, scale=0.8) for m in chain], lag_ratio=0.12),
                  LaggedStart(*[GrowArrow(e) for e in edges], lag_ratio=0.12), run_time=1.6)
        self.play(FadeIn(n_w, shift=0.2 * DOWN), FadeIn(n_y, shift=0.2 * DOWN), GrowArrow(e_w),
                  GrowArrow(e_y), FadeIn(v_x), FadeIn(v_w), FadeIn(v_y), run_time=0.8)
        self.wait(0.2)

        # ------------------------------------------------------------------ forward (BLUE)
        def pulse_along(arrow, color, reverse=False, radius=0.09):
            s, e = arrow.get_start(), arrow.get_end()
            if reverse:
                s, e = e, s
            d = Dot(s, radius=radius, color=color)
            glow = Dot(s, radius=radius * 2.2, color=color, fill_opacity=0.25)
            g = VGroup(glow, d)
            return g, MoveAlongPath(g, Line(s, e))

        def fwd_step(arrows, new_labels, extra=()):
            pulses = [pulse_along(a, C_BLUE) for a in arrows]
            self.add(*[p for p, _ in pulses])
            self.play(*[an for _, an in pulses], run_time=0.4, rate_func=smooth)
            self.remove(*[p for p, _ in pulses])
            if new_labels:
                self.play(*[FadeIn(l, scale=0.6) for l in new_labels], *extra, run_time=0.3)

        cue(self, "Forward pass: z = 1.0, ŷ = 0.731, L = 0.0723")
        fwd_step([edges[0], e_w], [])
        self.play(Indicate(o_mul, color=C_BLUE, scale_factor=1.12), run_time=0.25)
        fwd_step([edges[1]], [v_z])
        fwd_step([edges[2]], [])
        fwd_step([edges[3]], [v_yh])
        fwd_step([edges[4], e_y], [])
        fwd_step([edges[5]], [v_L])
        self.play(Indicate(v_L, color=C_RED, scale_factor=1.3), run_time=0.5)
        self.wait(0.2)

        # ------------------------------------------------------------------ backward (GREEN)
        LY = GY - 1.35

        def local(num, num_c, den, den_c, rhs, x_pos):
            parts, cols = frac_parts(num, num_c, den, den_c)
            m = colored(parts + ["=", rhs], cols + [None, C_GREEN], size=36)
            m.move_to([x_pos, LY, 0])
            return m

        g_loss = local("L", C_RED, r"\hat{y}", TEXT, f"{D_L_YH:.3f}", xs[5])
        g_sig = local(r"\hat{y}", TEXT, "z", TEXT, f"{D_YH_Z:.3f}", xs[3])
        g_mul = local("z", TEXT, "w", C_YELLOW, f"{D_Z_W:.0f}", xs[1])

        def back_step(arrows, label, node):
            pulses = [pulse_along(a, C_GREEN, reverse=True) for a in arrows]
            self.add(*[p for p, _ in pulses])
            self.play(*[an for _, an in pulses], run_time=0.45, rate_func=smooth)
            self.remove(*[p for p, _ in pulses])
            if label is not None:
                self.play(Indicate(node[0], color=C_GREEN, scale_factor=1.1),
                          FadeIn(label, shift=0.25 * DOWN), run_time=0.5)

        n_L_glow = n_L[0].copy().set_stroke(C_GREEN, 6, opacity=0.6)
        cue(self, "Backward pass: local derivatives −0.538, 0.197 and 2")
        self.play(FadeIn(n_L_glow, scale=1.15), run_time=0.25)
        self.play(FadeOut(n_L_glow), run_time=0.15)
        back_step([edges[5]], g_loss, o_loss)
        back_step([edges[4]], None, None)
        back_step([edges[3]], g_sig, o_sig)
        back_step([edges[2]], None, None)
        back_step([edges[1]], g_mul, o_mul)
        back_step([e_w], None, None)
        self.play(Indicate(n_w, color=C_GREEN, scale_factor=1.2), run_time=0.4)

        # ------------------------------------------------------------------ chain rule
        cue(self, "Chain rule: ∂L/∂w = (−0.538)(0.197)(2) ≈ −0.2115")
        CY = -1.45
        fp_w, fc_w = frac_parts("L", C_RED, "w", C_YELLOW)
        fp_1, fc_1 = frac_parts("L", C_RED, r"\hat{y}", TEXT)
        fp_2, fc_2 = frac_parts(r"\hat{y}", TEXT, "z", TEXT)
        fp_3, fc_3 = frac_parts("z", TEXT, "w", C_YELLOW)
        parts = fp_w + ["="] + fp_1 + [r"\cdot"] + fp_2 + [r"\cdot"] + fp_3 + \
            ["=", f"({D_L_YH:.3f})", f"({D_YH_Z:.3f})", f"({D_Z_W:.0f})", r"\approx", f"{D_L_W:.4f}"]
        cols = fc_w + [None] + fc_1 + [None] + fc_2 + [None] + fc_3 + \
            [None, C_GREEN, C_GREEN, C_GREEN, None, C_GREEN]
        ch = colored(parts, cols, size=40).move_to([0, CY, 0])
        i_lhs, i_f1, i_f2, i_f3 = 0, 8, 16, 24
        i_nums = 32
        self.play(FadeIn(VGroup(*ch[0:8]), shift=0.2 * UP), run_time=0.5)
        self.play(LaggedStart(
            TransformFromCopy(VGroup(*g_loss[0:7]), VGroup(*ch[i_f1:i_f1 + 7])),
            TransformFromCopy(VGroup(*g_sig[0:7]), VGroup(*ch[i_f2:i_f2 + 7])),
            TransformFromCopy(VGroup(*g_mul[0:7]), VGroup(*ch[i_f3:i_f3 + 7])),
            lag_ratio=0.3), FadeIn(ch[15]), FadeIn(ch[23]), run_time=1.3)
        self.play(FadeIn(ch[i_nums - 1]),
                  TransformFromCopy(g_loss[8], ch[i_nums]),
                  TransformFromCopy(g_sig[8], ch[i_nums + 1]),
                  TransformFromCopy(g_mul[8], ch[i_nums + 2]), run_time=1.0)
        self.play(Write(VGroup(ch[i_nums + 3], ch[i_nums + 4])), run_time=0.5)
        self.play(Circumscribe(ch[i_nums + 4], color=C_GREEN, buff=0.08), run_time=0.7)

        # ------------------------------------------------------------------ update w
        cue(self, "Update: w ← 0.5 − η(−0.2115) ≈ 0.521 (η = 0.1)")
        UY = -2.85
        up = tex("w", r"\leftarrow", f"{W0:.1f}", "-", r"\eta", r"\,(", f"{D_L_W:.4f}", ")",
                 r"\approx", f"{W1:.3f}", size=46)
        for i, c in ((0, C_YELLOW), (2, C_YELLOW), (4, C_ORANGE), (6, C_GREEN), (9, C_YELLOW)):
            up[i].set_color(c)
        up.move_to([-0.4, UY, 0])
        eta_note = tex(r"\eta", "=", f"{ETA:.1f}", size=34)
        eta_note[0].set_color(C_ORANGE)
        eta_note[2].set_color(C_ORANGE)
        eta_note.next_to(up, RIGHT, buff=0.6)
        self.play(FadeIn(VGroup(*up[0:2]), shift=0.2 * UP), TransformFromCopy(v_w, up[2]),
                  FadeIn(up[3]), FadeIn(up[4]), FadeIn(up[5]), FadeIn(up[7]),
                  TransformFromCopy(ch[i_nums + 4], up[6]), FadeIn(eta_note), run_time=1.1)
        self.play(Write(VGroup(up[8], up[9])), run_time=0.5)
        v_w_new = tex(f"{W1:.3f}", size=32, color=C_YELLOW).next_to(n_w, LEFT, buff=0.2)
        self.play(TransformFromCopy(up[9], v_w_new), FadeOut(v_w), run_time=0.8)
        self.play(Flash(n_w, color=C_YELLOW, flash_radius=0.6, line_length=0.18), run_time=0.5)

        # ------------------------------------------------------------------ forward again: loss drops
        cue(self, "Forward again: the loss drops from 0.0723 to 0.0680")
        v_z1 = above(n_z, f"{Z1:.2f}", C_BLUE)
        v_yh1 = above(n_yh, f"{YH1:.3f}", C_BLUE)
        v_L1 = above(n_L, f"{L1:.4f}", C_RED)
        pulses = [pulse_along(a, C_BLUE) for a in (edges[0], e_w, edges[1])]
        self.add(*[p for p, _ in pulses])
        self.play(*[an for _, an in pulses], run_time=0.35)
        self.remove(*[p for p, _ in pulses])
        self.play(ReplacementTransform(v_z, v_z1), run_time=0.25)
        pulses = [pulse_along(a, C_BLUE) for a in (edges[2], edges[3])]
        self.add(*[p for p, _ in pulses])
        self.play(*[an for _, an in pulses], run_time=0.35)
        self.remove(*[p for p, _ in pulses])
        self.play(ReplacementTransform(v_yh, v_yh1), run_time=0.25)
        pulses = [pulse_along(a, C_BLUE) for a in (edges[4], edges[5])]
        self.add(*[p for p, _ in pulses])
        self.play(*[an for _, an in pulses], run_time=0.35)
        self.remove(*[p for p, _ in pulses])
        down = Arrow(UP * 0.28, DOWN * 0.28, buff=0, stroke_color=C_GREEN, stroke_width=5,
                     tip_length=0.16).next_to(v_L1, RIGHT, buff=0.12)
        down.shift(LEFT * 0.0)
        self.play(ReplacementTransform(v_L, v_L1), GrowArrow(down), run_time=0.5)
        self.play(Indicate(v_L1, color=C_GREEN, scale_factor=1.25), run_time=0.5)
        self.wait(1.6)
        write_cues(self, "m05_backprop")
