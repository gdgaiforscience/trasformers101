"""m01_neuron: one artificial neuron, with the exact numbers from DESIGN.md 3a.

x = (0.9, 0.2, 0.6), w = (+1.2, -0.8, +0.5), b = -0.2
z = 1.08 - 0.16 + 0.30 - 0.20 = 1.02,  y_hat = sigma(1.02) = 0.73
"""
from common import *

X_VALS = [0.9, 0.2, 0.6]
W_VALS = [1.2, -0.8, 0.5]
B_VAL = -0.2


def pill(m: Mobject, buff=0.09, opacity=1.0) -> VGroup:
    """Number with a BG-coloured rounded backing so it reads cleanly over lines."""
    r = RoundedRectangle(width=m.width + 2 * buff, height=m.height + 2 * buff,
                         corner_radius=min(0.12, (m.height + 2 * buff) / 2),
                         stroke_width=0, fill_color=BG, fill_opacity=opacity).move_to(m)
    return VGroup(r, m)


class Neuron(Scene):
    def construct(self):
        prods = [x * w for x, w in zip(X_VALS, W_VALS)]
        z = sum(prods) + B_VAL
        yhat = float(sigmoid(z))
        assert abs(z - 1.02) < 1e-9 and f"{yhat:.2f}" == "0.73", (z, yhat)

        # ------------------------------------------------------------------ layout
        Y0 = 0.85
        in_x = -5.35
        in_ys = [Y0 + 1.55, Y0, Y0 - 1.55]
        r_in = 0.42
        n_c = np.array([-2.05, Y0, 0.0])
        r_n = 0.72
        box_c = np.array([1.55, Y0, 0.0])
        box_w, box_h = 4.0, 3.0
        out_c = np.array([5.1, Y0, 0.0])
        r_out = 0.6
        EQ_Y = -2.45

        inputs = VGroup(*[
            Circle(radius=r_in, stroke_color=C_BLUE, stroke_width=3.5,
                   fill_color=BG, fill_opacity=1).move_to([in_x, y, 0]) for y in in_ys])
        in_vals = VGroup(*[tex(f"{v:.1f}", size=34, color=C_BLUE).move_to(c)
                           for v, c in zip(X_VALS, inputs)])
        in_labels = VGroup(*[tex(f"x_{i + 1}", size=38, color=C_BLUE).next_to(c, LEFT, buff=0.25)
                             for i, c in enumerate(inputs)])

        neuron = Circle(radius=r_n, stroke_color=TEXT, stroke_width=3.5,
                        fill_color=PANEL, fill_opacity=1).move_to(n_c)
        sigma_sym = tex(r"\Sigma", size=60).move_to(n_c)

        edges, wlabels, dirs = VGroup(), VGroup(), []
        for i, (c, w) in enumerate(zip(inputs, W_VALS)):
            d = normalize(n_c - c.get_center())
            dirs.append(d)
            e = Line(c.get_center() + d * r_in, n_c - d * r_n,
                     stroke_color=weight_color(w), stroke_width=5.5 * abs(w))
            edges.add(e)
            nrm = rotate_vector(d, PI / 2) * (1 if i < 2 else -1)
            lab = tex(num(w, 1, plus=True), size=32, color=C_YELLOW)
            lab.move_to(e.point_from_proportion(0.5) + nrm * 0.36)
            wlabels.add(lab)

        b_lab = tex("b", "=", "-0.2", size=36)
        b_lab[0].set_color(C_TEAL)
        b_lab[2].set_color(C_TEAL)
        b_lab.move_to(n_c + DOWN * 2.0)
        b_arrow = Arrow(b_lab.get_top() + UP * 0.08, neuron.get_bottom(), buff=0.06,
                        stroke_color=C_TEAL, stroke_width=4, max_tip_length_to_length_ratio=0.3,
                        tip_length=0.18)

        # sigma "function box"
        box = RoundedRectangle(width=box_w, height=box_h, corner_radius=0.18,
                               stroke_color=MUTED, stroke_width=2, stroke_opacity=0.7,
                               fill_color=PANEL, fill_opacity=1).move_to(box_c)
        box_title = tex(r"\sigma", size=46).next_to(box, UP, buff=0.14)
        axes = Axes(x_range=[-6, 6, 2], y_range=[0, 1, 0.5], x_length=3.3, y_length=2.05,
                    tips=False,
                    axis_config={"stroke_color": MUTED, "stroke_width": 2, "include_ticks": False})
        axes.move_to(box_c + DOWN * 0.12)
        curve = axes.plot(lambda t: sigmoid(t), x_range=[-6, 6], color=TEXT, stroke_width=4)
        one_line = DashedLine(axes.c2p(-6, 1), axes.c2p(6, 1), dash_length=0.06,
                              stroke_color=MUTED, stroke_width=1.5, stroke_opacity=0.6)
        one_lab = tex("1", size=24, color=MUTED).next_to(axes.c2p(0, 1), LEFT, buff=0.1)
        one_lab.shift(UP * 0.13)

        arrow_nb = Arrow(neuron.get_right(), box.get_left(), buff=0.06, stroke_color=TEXT,
                         stroke_width=3.5, tip_length=0.18)
        out_circle = Circle(radius=r_out, stroke_color=C_BLUE, stroke_width=3.5,
                            fill_color=BG, fill_opacity=1).move_to(out_c)
        arrow_bo = Arrow(box.get_right(), out_circle.get_left(), buff=0.06, stroke_color=TEXT,
                         stroke_width=3.5, tip_length=0.18)
        yhat_lab = tex(r"\hat{y}", size=42).next_to(out_circle, UP, buff=0.18)

        # ------------------------------------------------------------------ build
        cue(self, "Inputs x, weights w (blue = positive, red = negative), bias b")
        self.play(LaggedStart(*[GrowFromCenter(c) for c in inputs], lag_ratio=0.15),
                  LaggedStart(*[FadeIn(v, scale=0.6) for v in in_vals], lag_ratio=0.15),
                  LaggedStart(*[Write(l) for l in in_labels], lag_ratio=0.15), run_time=0.9)
        self.play(GrowFromCenter(neuron), FadeIn(sigma_sym, scale=0.5),
                  LaggedStart(*[Create(e) for e in edges], lag_ratio=0.2),
                  LaggedStart(*[FadeIn(l, shift=0.1 * UP) for l in wlabels], lag_ratio=0.2),
                  run_time=1.1)
        self.play(FadeIn(b_lab, shift=0.2 * UP), GrowArrow(b_arrow), GrowArrow(arrow_nb),
                  FadeIn(box), FadeIn(box_title), run_time=0.7)
        self.play(Create(axes), Create(curve), FadeIn(one_line), FadeIn(one_lab),
                  GrowArrow(arrow_bo), GrowFromCenter(out_circle), FadeIn(yhat_lab),
                  run_time=1.0)
        self.wait(0.3)

        # ------------------------------------------------------------------ values travel
        eq = tex("z", "=", num(prods[0]), "-", f"{abs(prods[1]):.2f}", "+", num(prods[2]),
                 "-", f"{abs(B_VAL):.2f}", "=", num(z), size=48)
        eq[7:9].set_color(C_TEAL)
        eq.move_to([0, EQ_Y, 0])
        prod_targets = [VGroup(eq[2]), VGroup(eq[3], eq[4]), VGroup(eq[6])]

        def set_op(tok, o):
            tok[0].set_fill(opacity=o)
            tok[1].set_fill(opacity=o)

        tokens_v, tokens_p, anims = [], [], []
        for i, e in enumerate(edges):
            v_tok = pill(tex(f"{X_VALS[i]:.1f}", size=30, color=C_BLUE))
            p_tok = pill(tex(num(prods[i]), size=30, color=TEXT))
            start, end = e.get_start() + dirs[i] * 0.3, e.point_from_proportion(0.82)
            for t_ in (v_tok, p_tok):
                t_.move_to(start)
                set_op(t_, 0)
            tokens_v.append(v_tok)
            tokens_p.append(p_tok)
            wl = wlabels[i]
            wl.save_state()

            def upd(g, a, v_tok=v_tok, p_tok=p_tok, start=start, end=end, wl=wl):
                pos = start + (end - start) * a
                v_tok.move_to(pos)
                p_tok.move_to(pos)
                cf = smooth(float(np.clip((a - 0.40) / 0.2, 0, 1)))
                fade_in = float(np.clip(a / 0.08, 0, 1))
                set_op(v_tok, fade_in * (1 - cf))
                set_op(p_tok, cf)
                bump = float(np.exp(-((a - 0.5) / 0.09) ** 2))
                wl.restore()
                wl.scale(1 + 0.3 * bump)

            anims.append(UpdateFromAlphaFunc(VGroup(v_tok, p_tok), upd, rate_func=smooth))
        self.add(*tokens_v, *tokens_p)
        cue(self, "Each input is multiplied by its weight")
        self.play(LaggedStart(*anims, lag_ratio=0.25), run_time=2.6)
        for wl in wlabels:
            wl.restore()
        self.remove(*tokens_v)

        # products -> equation (the neuron sums them)
        cue(self, "The neuron adds them up: z = 1.08 − 0.16 + 0.30 − 0.20 = 1.02")
        self.play(Indicate(sigma_sym, scale_factor=1.25, color=TEXT),
                  *[ReplacementTransform(tokens_p[i][1], prod_targets[i]) for i in range(3)],
                  *[FadeOut(tokens_p[i][0]) for i in range(3)],
                  FadeIn(eq[0:2]), FadeIn(eq[5]), run_time=1.2)
        b_copy = b_lab[2].copy()
        self.play(ReplacementTransform(b_copy, eq[7:9]), Indicate(b_lab, color=C_TEAL),
                  run_time=0.9)
        self.play(Write(eq[9:11]), run_time=0.6)
        self.play(Circumscribe(eq[10], color=TEXT, buff=0.1, run_time=0.9))

        # ------------------------------------------------------------------ sigma
        cue(self, "The sigmoid squashes z: σ(1.02) ≈ 0.73")
        zx = axes.c2p(z, 0)
        z_dot = Dot(zx, radius=0.07, color=TEXT)
        z_tag = tex(num(z), size=26).next_to(zx, DOWN, buff=0.12)
        pulse = Dot(arrow_nb.get_start(), radius=0.08, color=TEXT)
        self.play(MoveAlongPath(pulse, Line(arrow_nb.get_start(), arrow_nb.get_end())),
                  TransformFromCopy(eq[10], z_tag), run_time=1.0)
        self.remove(pulse)
        self.play(FadeIn(z_dot, scale=0.5), run_time=0.3)
        cy = axes.c2p(z, yhat)
        v_line = DashedLine(zx, cy, dash_length=0.06, stroke_color=TEXT, stroke_width=2.5)
        c_dot = Dot(cy, radius=0.08, color=C_BLUE)
        self.play(Create(v_line), run_time=0.6)
        self.play(FadeIn(c_dot, scale=0.5), run_time=0.25)
        h_end = np.array([box.get_right()[0] - 0.12, cy[1], 0])
        h_line = DashedLine(cy, h_end, dash_length=0.06, stroke_color=C_BLUE, stroke_width=2.5)
        y_tag = tex(f"{yhat:.2f}", size=26, color=C_BLUE).next_to(h_end, UP, buff=0.1).shift(LEFT * 0.18)
        self.play(Create(h_line), FadeIn(y_tag, shift=0.1 * UP), run_time=0.7)

        # output neuron fills to 73 %
        level = ValueTracker(0.0)

        def liquid():
            lv = level.get_value()
            h = max(2 * r_out * lv, 1e-3)
            rect = Rectangle(width=2 * r_out + 0.2, height=h)
            rect.move_to(out_circle.get_bottom() + UP * h / 2)
            disk = Circle(radius=r_out - 0.02).move_to(out_c)
            return Intersection(disk, rect, fill_color=C_BLUE, fill_opacity=0.85,
                                stroke_width=0)

        liq = always_redraw(liquid)
        self.add(liq)
        self.bring_to_front(out_circle)
        out_circle.set_fill(opacity=0)
        out_val = tex(f"{yhat:.2f}", size=36, color=C_BLUE).next_to(out_circle, DOWN, buff=0.2)
        travel = y_tag.copy()
        self.play(travel.animate.move_to(out_val), level.animate.set_value(yhat),
                  run_time=1.4, rate_func=smooth)
        self.remove(travel)
        self.add(out_val)
        self.play(Indicate(out_val, color=C_BLUE, scale_factor=1.15), run_time=0.6)
        self.wait(0.3)

        # ------------------------------------------------------------------ general formula
        cue(self, "One neuron: ŷ = σ(w·x + b)")
        eq2 = tex("z", "=", r"\mathbf{w}", r"\cdot", r"\mathbf{x}", "+", "b", size=52,
                  cmap={r"\mathbf{w}": C_YELLOW, r"\mathbf{x}": C_BLUE, "b": C_TEAL})
        eq2.move_to([0, EQ_Y, 0])
        # the numeric equation was assembled piecewise; make `eq` the single owner first
        self.remove(*eq.submobjects)
        self.add(eq)
        self.play(FadeOut(VGroup(*eq[2:]), shift=0.3 * UP), run_time=0.5)
        self.play(ReplacementTransform(eq[0], eq2[0]), ReplacementTransform(eq[1], eq2[1]),
                  FadeIn(VGroup(*eq2[2:]), shift=0.3 * UP), run_time=0.7)
        self.remove(*eq2.submobjects)
        self.add(eq2)
        self.wait(0.3)
        eq3 = tex(r"\hat{y}", "=", r"\sigma(", r"\mathbf{w}", r"\cdot", r"\mathbf{x}", "+", "b", ")",
                  size=56, cmap={r"\mathbf{w}": C_YELLOW, r"\mathbf{x}": C_BLUE, "b": C_TEAL})
        eq3.move_to([0, EQ_Y, 0])
        self.play(TransformMatchingTex(eq2, eq3), run_time=1.2)
        frame_box = SurroundingRectangle(eq3, buff=0.28, corner_radius=0.12, stroke_color=TEXT,
                                         stroke_width=2.5)
        self.play(Create(frame_box), run_time=0.8)
        self.wait(1.8)
        write_cues(self, "m01_neuron")
