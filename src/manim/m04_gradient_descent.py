"""m04_gradient_descent: rolling downhill.

A 1D loss with a global and a local minimum. A ball (the weight w) takes discrete steps
w <- w - eta dL/dw, shown with its tangent line and the -eta*slope step arrow:
first with eta too big (it overshoots and bounces), then with eta just right (it settles).
All iterates are computed here from the analytic derivative.
"""
from common import *

W_MIN, W_MAX = -2.6, 2.6
L_MAX = 3.2
W0 = -2.4
ETA_BIG, N_BIG = 0.8, 6
ETA_GOOD, N_GOOD = 0.2, 7


def G(w, m, s):
    return np.exp(-(w - m) ** 2 / (2 * s ** 2))


def loss(w):
    return 0.15 * w ** 2 + 2.0 - 1.7 * G(w, -1.1, 0.7) - 0.9 * G(w, 1.4, 0.45)


def dloss(w):
    return (0.3 * w + 1.7 * G(w, -1.1, 0.7) * (w + 1.1) / 0.49
            + 0.9 * G(w, 1.4, 0.45) * (w - 1.4) / 0.2025)


def iterate(w0, eta, n):
    ws = [w0]
    for _ in range(n):
        ws.append(ws[-1] - eta * dloss(ws[-1]))
    return ws


def find_minima():
    ws = np.linspace(W_MIN, W_MAX, 20001)
    Ls = loss(ws)
    idx = [i for i in range(1, len(ws) - 1) if Ls[i] < Ls[i - 1] and Ls[i] < Ls[i + 1]]
    return [float(ws[i]) for i in idx]


class GradientDescent(Scene):
    def construct(self):
        big = iterate(W0, ETA_BIG, N_BIG)
        good = iterate(W0, ETA_GOOD, N_GOOD)
        g_min, l_min = find_minima()
        assert all(W_MIN < w < W_MAX for w in big + good)
        assert abs(good[-1] - g_min) < 0.02  # "just right" really converges

        # ------------------------------------------------------------------ axes + curve
        axes = Axes(x_range=[0, W_MAX - W_MIN, 1], y_range=[0, L_MAX, 1], x_length=11.6,
                    y_length=4.6, tips=False,
                    axis_config={"stroke_color": MUTED, "stroke_width": 2.5,
                                 "include_ticks": False})
        axes.move_to([0.15, -0.75, 0])
        xu = axes.x_length / (W_MAX - W_MIN)
        yu = axes.y_length / L_MAX

        def P(w, L=None):
            return axes.c2p(w - W_MIN, loss(w) if L is None else L)

        curve = axes.plot(lambda t: loss(t + W_MIN), x_range=[0, W_MAX - W_MIN],
                          color=C_RED, stroke_width=4.5)
        x_lab = tex("w", size=40, color=C_YELLOW).next_to(axes.x_axis.get_end(), RIGHT, buff=0.15)
        y_lab = tex("L", "(", "w", ")", size=40)
        y_lab[0].set_color(C_RED)
        y_lab[2].set_color(C_YELLOW)
        y_lab.next_to(axes.y_axis.get_end(), UP, buff=0.15)
        axis_y = axes.c2p(0, 0)[1]

        def min_marker(wm, text):
            drop = DashedLine(P(wm), [P(wm)[0], axis_y, 0], dash_length=0.07,
                              stroke_color=MUTED, stroke_width=1.5, stroke_opacity=0.6)
            lab = txt(text, size=22, color=MUTED).move_to([P(wm)[0], axis_y - 0.3, 0])
            return drop, lab

        gd, gl = min_marker(g_min, "global min")
        ld, ll = min_marker(l_min, "local min")

        cue(self, "A loss curve with a global and a local minimum")
        self.play(Create(axes), FadeIn(x_lab), FadeIn(y_lab), run_time=0.8)
        self.play(Create(curve), run_time=1.2)
        self.play(Create(gd), Create(ld), FadeIn(gl, shift=0.1 * UP), FadeIn(ll, shift=0.1 * UP),
                  run_time=0.5)

        # ------------------------------------------------------------------ update rule
        rule = tex("w", r"\leftarrow", "w", "-", r"\eta", r"\,\frac{d", "L", "}{d", "w", "}",
                   size=54)
        for i, c in ((0, C_YELLOW), (2, C_YELLOW), (4, C_ORANGE), (5, C_GREEN), (6, C_RED),
                     (7, C_GREEN), (8, C_YELLOW)):
            rule[i].set_color(c)
        rule.move_to([-1.2, 3.25, 0])
        cue(self, "Update rule: w ← w − η·dL/dw")
        self.play(Write(rule), run_time=1.0)

        def badge(eta, verdict, vcol):
            e = tex(r"\eta", "=", f"{eta:.1f}", size=44)
            e[0].set_color(C_ORANGE)
            e[2].set_color(C_ORANGE)
            v = txt(verdict, size=32, color=vcol, weight=BOLD)
            g = VGroup(e, v).arrange(RIGHT, buff=0.35)
            g.move_to([4.15, 3.25, 0])
            return g

        # ------------------------------------------------------------------ ball machinery
        ball = Dot(P(W0), radius=0.14, color=C_YELLOW)
        halo = Dot(P(W0), radius=0.28, color=C_YELLOW, fill_opacity=0.22)
        halo.add_updater(lambda m: m.move_to(ball.get_center()))

        def tangent(w):
            d = normalize(np.array([1.0, dloss(w) * yu / xu, 0.0]))
            c = P(w)
            return Line(c - d * 1.25, c + d * 1.25, stroke_color=TEXT, stroke_width=3,
                        stroke_opacity=0.85)

        def step_arrow(w, wn):
            a = P(w)
            b = np.array([P(wn)[0], a[1], 0.0])
            return Arrow(a, b, buff=0.0, stroke_color=C_GREEN, stroke_width=5,
                         tip_length=0.2, max_tip_length_to_length_ratio=0.35)

        def hop_path(w, wn):
            A, B = P(w), P(wn)
            h = 0.25 + 0.18 * abs(B[0] - A[0])
            ts = np.linspace(0, 1, 30)
            pts = [A + (B - A) * t + UP * 4 * h * t * (1 - t) for t in ts]
            path = VMobject()
            path.set_points_smoothly(pts)
            return path

        def run_phase(ws, durations, label_first=True):
            trail = VGroup()
            self.add(trail)
            for k in range(len(ws) - 1):
                w, wn = ws[k], ws[k + 1]
                tan, arr = tangent(w), step_arrow(w, wn)
                extras = []
                if label_first and k == 0:
                    sl = tex(r"-\eta\,", r"\frac{dL}{dw}", size=30)
                    sl[0].set_color(C_ORANGE)
                    sl[1].set_color(C_GREEN)
                    sl.next_to(arr, UP, buff=0.12)
                    extras = [sl]
                t1, t2 = durations[k]
                self.play(Create(tan), GrowArrow(arr), *[FadeIn(e) for e in extras], run_time=t1)
                dot = Dot(P(w), radius=0.055, color=C_YELLOW, fill_opacity=0.45)
                trail.add(dot)
                self.play(MoveAlongPath(ball, hop_path(w, wn)), FadeOut(tan), FadeOut(arr),
                          *[FadeOut(e) for e in extras], run_time=t2, rate_func=smooth)
            return trail

        # ------------------------------------------------------------------ phase 1: eta too big
        b1 = badge(ETA_BIG, "too big", C_RED)
        cue(self, "η too big: the ball overshoots and bounces around")
        self.play(FadeIn(b1, shift=0.15 * DOWN), FadeIn(halo), GrowFromCenter(ball), run_time=0.6)
        trail1 = run_phase(big, [(0.3, 0.5)] * N_BIG)
        self.play(Wiggle(b1[1], scale_value=1.15, rotation_angle=0.03 * TAU), run_time=0.7)

        # ------------------------------------------------------------------ reset, phase 2: just right
        b2 = badge(ETA_GOOD, "just right", C_GREEN)
        cue(self, "η just right: smaller and smaller steps into the minimum")
        self.play(FadeOut(trail1), FadeOut(ball), FadeOut(halo), FadeOut(b1, shift=0.2 * UP),
                  run_time=0.45)
        ball.move_to(P(W0))
        halo.move_to(P(W0))
        self.play(FadeIn(b2, shift=0.2 * UP), FadeIn(ball, scale=0.5), FadeIn(halo), run_time=0.5)
        durs = [(0.3, 0.5), (0.3, 0.5), (0.28, 0.45), (0.25, 0.42), (0.22, 0.38), (0.2, 0.32),
                (0.18, 0.3)]
        trail2 = run_phase(good, durs)
        ring = Circle(radius=0.32, stroke_color=C_GREEN, stroke_width=4).move_to(ball)
        self.play(Create(ring), Indicate(gl, color=C_GREEN, scale_factor=1.2),
                  Flash(ball, color=C_GREEN, flash_radius=0.45, line_length=0.18), run_time=0.8)
        self.play(Circumscribe(rule, color=TEXT, buff=0.12), run_time=0.9)
        self.wait(1.5)
        write_cues(self, "m04_gradient_descent")
