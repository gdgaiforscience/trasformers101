"""m06_softmax: from logits to probabilities, and what temperature does.

Illustrative next-token logits for "The chemical symbol for gold is": Au 6.0, Ag 3.0, gold 2.6,
Fe 1.2, Pb 0.5. exp() makes the leader dominate, normalising makes everything sum to 1, and the
temperature T sharpens (T < 1) or flattens (T > 1) the distribution. All values computed here.
"""
from common import *

TOKS = ["Au", "Ag", "gold", "Fe", "Pb"]
Z = np.array([6.0, 3.0, 2.6, 1.2, 0.5])
X_B = [-5.35, -4.1, -2.85, -1.6, -0.35]
BASE_Y = -2.45
H = 4.1
BAR_W = 0.8
OPAC = [0.95, 0.8, 0.68, 0.56, 0.46]
STACK_X = 0.8
EQ_POS = [4.05, 2.45, 0]
T_MIN, T_MAX = 0.2, 3.0


def softmax(z, T=1.0):
    e = np.exp((z - z.max()) / T)
    return e / e.sum()


class Softmax(Scene):
    def construct(self):
        E = np.exp(Z)
        P1 = softmax(Z)
        assert abs(P1.sum() - 1) < 1e-12

        s1 = ValueTracker(0.0)   # logits -> exp
        s2 = ValueTracker(0.0)   # exp -> probabilities
        Tt = ValueTracker(1.0)   # temperature
        grow = ValueTracker(0.0)  # initial bar growth

        def heights():
            if s2.get_value() <= 0:
                v = (1 - s1.get_value()) * Z + s1.get_value() * E
                return grow.get_value() * H * v / v.max(), v
            u = s2.get_value()
            p = softmax(Z, Tt.get_value())
            return (1 - u) * H * P1 / P1.max() + u * H * p, E

        def bar(i):
            def f():
                h, _ = heights()
                hi = max(float(h[i]), 0.004)
                r = Rectangle(width=BAR_W, height=hi, stroke_width=0, fill_color=C_BLUE,
                              fill_opacity=OPAC[i])
                r.move_to([X_B[i], BASE_Y + hi / 2, 0])
                return r
            return always_redraw(f)

        caption = corner_caption("illustrative numbers")
        p_text = txt("The chemical symbol for gold is", size=28, color=MUTED)
        blank = Line(ORIGIN, RIGHT * 0.6, stroke_color=TEXT, stroke_width=3)
        prompt = VGroup(p_text, blank)
        prompt.arrange(RIGHT, buff=0.18, aligned_edge=DOWN).to_corner(UL, buff=0.45)
        base = Line([X_B[0] - 0.65, BASE_Y, 0], [X_B[-1] + 0.65, BASE_Y, 0], stroke_color=MUTED,
                    stroke_width=2)
        labels = VGroup()
        desc = mono("a", size=26).get_bottom()[1] - mono("g", size=26).get_bottom()[1]
        for i, t in enumerate(TOKS):
            m = mono(t, size=26)
            b = RoundedRectangle(width=max(m.width + 0.28, 0.75), height=0.5, corner_radius=0.1,
                                 stroke_color=GRID, stroke_width=1.5, fill_color=PANEL,
                                 fill_opacity=1)
            b.move_to([X_B[i], BASE_Y - 0.42, 0])
            # common baseline for all token chips (descenders hang below it)
            m.move_to(b)
            drop = desc if any(ch in "gjpqy" for ch in t) else 0.0
            m.shift(UP * (b.get_center()[1] - 0.1 - drop - m.get_bottom()[1]))
            labels.add(VGroup(b, m))
        bars = VGroup(*[bar(i) for i in range(5)])

        # value labels: logits/exp numbers (stage A) and percentages (stage B)
        def num_label(i):
            d = DecimalNumber(Z[i], num_decimal_places=1, font_size=30, color=TEXT)

            def upd(m):
                h, v = heights()
                m.set_value(float(v[i]))
                m.next_to([X_B[i], BASE_Y + h[i], 0], UP, buff=0.12)
            d.add_updater(upd)
            return d

        def pct_label(i):
            d = DecimalNumber(100 * P1[i], num_decimal_places=1, unit=r"\%", font_size=30,
                              color=TEXT)

            def upd(m):
                p = softmax(Z, Tt.get_value())
                h, _ = heights()
                m.set_value(float(100 * p[i]))
                m.next_to([X_B[i], BASE_Y + h[i], 0], UP, buff=0.12)
            d.add_updater(upd)
            back = always_redraw(lambda: BackgroundRectangle(d, color=BG, fill_opacity=1,
                                                             buff=0.05))
            return VGroup(back, d)

        stage = txt("logits", size=26, color=MUTED).move_to([-5.75, 2.65, 0], aligned_edge=LEFT)
        self.add(caption)
        cue(self, "Logits: raw scores for the next token")
        self.play(FadeIn(prompt, shift=0.1 * DOWN), Create(base),
                  LaggedStart(*[FadeIn(l, shift=0.1 * UP) for l in labels], lag_ratio=0.1),
                  run_time=1.0)
        self.add(bars)
        nums = VGroup(*[num_label(i) for i in range(5)])
        self.play(grow.animate.set_value(1.0), FadeIn(stage), run_time=1.1)
        self.play(LaggedStart(*[FadeIn(n) for n in nums], lag_ratio=0.1), run_time=0.6)
        self.wait(0.4)

        # ------------------------------------------------------------------ exp
        eq_exp = tex("e^{z_i}", size=60).move_to(EQ_POS)
        stage_exp = txt("exp", size=26, color=MUTED).move_to(stage, aligned_edge=LEFT)
        cue(self, "Exponentiate: the leader dominates")
        self.play(FadeTransform(stage, stage_exp), FadeIn(eq_exp, shift=0.2 * LEFT), run_time=0.6)
        self.play(s1.animate.set_value(1.0), run_time=2.0, rate_func=smooth)
        self.wait(0.4)

        # ------------------------------------------------------------------ normalise
        one_y = BASE_Y + H
        one_line = DashedLine([X_B[0] - 0.65, one_y, 0], [STACK_X + 0.45, one_y, 0],
                              dash_length=0.08, stroke_color=MUTED, stroke_width=1.5,
                              stroke_opacity=0.7)
        one_lab = tex("1", size=28, color=MUTED).next_to(one_line, LEFT, buff=0.12)
        zero_lab = tex("0", size=28, color=MUTED).next_to(base, LEFT, buff=0.12)
        stage_p = txt("probabilities", size=26, color=MUTED).move_to(stage, aligned_edge=LEFT)
        eq_frac = tex(r"\mathrm{softmax}(z)_i", "=", r"\frac{e^{z_i", "}}{\sum_j e^{z_j", "}}",
                      size=46).move_to(EQ_POS)
        pcts = VGroup(*[pct_label(i) for i in range(5)])
        cue(self, "Normalise: probabilities that sum to 1")
        for n in nums:
            n.clear_updaters()
        for p in pcts:
            p[1].suspend_updating()
        self.play(FadeTransform(stage_exp, stage_p), FadeOut(nums), Create(one_line),
                  FadeIn(one_lab), FadeIn(zero_lab), s2.animate.set_value(1.0),
                  ReplacementTransform(eq_exp, eq_frac[2]), run_time=1.3)
        for p in pcts:
            p[1].resume_updating()
            p[1].update()
        self.play(FadeIn(pcts), FadeIn(eq_frac[0:2]), FadeIn(eq_frac[3:]), run_time=0.8)

        # the probabilities stack up to exactly 1
        def stack():
            p = softmax(Z, Tt.get_value())
            g = VGroup()
            y = BASE_Y
            for i in range(5):
                h = H * p[i]
                if h > 1e-3:
                    r = Rectangle(width=0.55, height=h, stroke_color=BG, stroke_width=1.5,
                                  fill_color=C_BLUE, fill_opacity=OPAC[i])
                    r.move_to([STACK_X, y + h / 2, 0])
                    g.add(r)
                y += h
            return g

        copies = VGroup(*[b.copy().clear_updaters() for b in bars])
        stk = stack()
        sum_lab = tex(r"\textstyle\sum = 1", size=30).next_to([STACK_X, one_y, 0], UP, buff=0.15)
        self.play(*[ReplacementTransform(copies[i], stk[i]) for i in range(len(stk))],
                  FadeIn(sum_lab, shift=0.1 * DOWN), run_time=1.1)
        self.remove(stk)
        live_stack = always_redraw(stack)
        self.add(live_stack)
        self.wait(0.3)

        # ------------------------------------------------------------------ temperature
        eq_T = tex(r"\mathrm{softmax}(z)_i", "=", r"\frac{e^{z_i", "/T", "}}{\sum_j e^{z_j", "/T",
                   "}}", size=46).move_to(EQ_POS)
        eq_T[3].set_color(C_PINK)
        eq_T[5].set_color(C_PINK)
        cue(self, "Temperature T divides the logits")
        self.play(TransformMatchingTex(eq_frac, eq_T), run_time=1.0)

        track_l, track_r, track_y = 2.35, 6.05, -0.85

        def t2x(T):
            return track_l + (track_r - track_l) * (T - T_MIN) / (T_MAX - T_MIN)

        track = Line([track_l, track_y, 0], [track_r, track_y, 0], stroke_color=GRID,
                     stroke_width=6)
        ticks = VGroup(*[Line([t2x(T), track_y - 0.12, 0], [t2x(T), track_y + 0.12, 0],
                              stroke_color=MUTED, stroke_width=2) for T in (0.3, 1.0, 2.5)])
        tick_labs = VGroup(*[tex(s, size=24, color=MUTED).next_to([t2x(T), track_y - 0.12, 0],
                                                                    DOWN, buff=0.1)
                             for s, T in (("0.3", 0.3), ("1", 1.0), ("2.5", 2.5))])
        fill = always_redraw(lambda: Line([track_l, track_y, 0], [t2x(Tt.get_value()), track_y, 0],
                                          stroke_color=C_PINK, stroke_width=6))
        knob = always_redraw(lambda: Dot([t2x(Tt.get_value()), track_y, 0], radius=0.13,
                                         color=C_PINK))
        t_read = VGroup(tex("T", "=", size=40), DecimalNumber(1.0, num_decimal_places=2,
                                                              font_size=40, color=C_PINK))
        t_read[0][0].set_color(C_PINK)
        t_read.arrange(RIGHT, buff=0.15).move_to([(track_l + track_r) / 2, track_y + 0.8, 0])
        t_read[1].add_updater(lambda m: m.set_value(Tt.get_value()))
        self.play(Create(track), FadeIn(ticks), FadeIn(tick_labs), FadeIn(t_read), run_time=0.6)
        self.add(fill, knob)
        self.play(Indicate(eq_T[3], color=C_PINK), Indicate(eq_T[5], color=C_PINK), run_time=0.6)

        cue(self, "T = 0.3: sharper, almost always “Au”")
        self.play(Tt.animate.set_value(0.3), run_time=1.6, rate_func=smooth)
        self.wait(0.5)
        cue(self, "T = 2.5: flatter, more random")
        self.play(Tt.animate.set_value(2.5), run_time=2.4, rate_func=smooth)
        self.wait(0.5)
        cue(self, "Back to T = 1")
        self.play(Tt.animate.set_value(1.0), run_time=1.5, rate_func=smooth)
        self.wait(1.6)
        write_cues(self, "m06_softmax")
