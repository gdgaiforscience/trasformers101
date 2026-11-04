"""m03_grid_warp: layers warp space.

A tiny 2-2-2 tanh network is trained in numpy *inside this script* on two interleaved moons
(not linearly separable). We then animate what each piece of a layer does to the whole plane:
W (stretch & rotate) -> b (shift) -> tanh (bend), twice, after which a straight line separates the
two classes.

Training notes: plain cross-entropy finds rank-1 / saturated solutions that look degenerate on
screen, so the loss adds mild *visual* regularisers: a conformality penalty (keeps W well
conditioned), a soft cap on how far points travel (keeps them inside the frame), and a nudge that
keeps |b| visible. The readout is a unit-norm line (fixed gain) so the margin is geometric.
The network shown is exactly the trained one (accuracy is asserted to be 100 %).
"""
from common import *

S = 1.7          # scene units per data unit
ZOOM = 1.4       # final zoom into the output square
GRID_MOVE = "#3A4864"
AXIS_MOVE = "#66728A"


# ----------------------------------------------------------------------------- data + training
def make_moons(n=60, noise=0.05, voff=0.35, seed=3):
    rng = np.random.default_rng(seed)
    t1 = np.linspace(0, np.pi, n) + rng.uniform(-0.03, 0.03, n)
    t2 = np.linspace(0, np.pi, n) + rng.uniform(-0.03, 0.03, n)
    a = np.c_[np.cos(t1), np.sin(t1)] + rng.normal(0, noise, (n, 2))
    b = np.c_[1 - np.cos(t2), voff - np.sin(t2)] + rng.normal(0, noise, (n, 2))
    X = np.r_[a, b]
    y = np.r_[np.zeros(n), np.ones(n)]
    X = (X - (X.min(0) + X.max(0)) / 2) / 1.2
    return X, y


def _conf_grad(W):
    f = (W ** 2).sum()
    return 2 * W / f - np.linalg.inv(W).T


def train_net(X, y, seed=3, steps=8000, lr=0.02, k=6.0, lam=2.0, lc=0.02, zcap=2.2,
              cap=(2.4, 1.8), lb=0.5, bt=0.45):
    cap = np.array(cap)

    def excess(a, c):
        return np.maximum(np.abs(a) - c, 0) * np.sign(a)

    rng = np.random.default_rng(seed)
    p = [rng.normal(0, 1.5, (2, 2)), rng.normal(0, 0.5, 2),
         rng.normal(0, 1.5, (2, 2)), rng.normal(0, 0.5, 2),
         np.array(rng.uniform(0, 2 * np.pi)), np.array(0.0)]
    m = [np.zeros_like(q) for q in p]
    v = [np.zeros_like(q) for q in p]
    n = len(y)
    for t in range(1, steps + 1):
        W1, b1, W2, b2, th, c = p
        a1 = X @ W1.T
        z1 = a1 + b1
        h1 = np.tanh(z1)
        a2 = h1 @ W2.T
        z2 = a2 + b2
        h2 = np.tanh(z2)
        u = np.array([np.cos(th), np.sin(th)])
        o = k * (h2 @ u + c)
        do = (1 / (1 + np.exp(-o)) - y) / n
        gth = (k * (h2.T @ do)) @ np.array([-np.sin(th), np.cos(th)])
        gc = k * do.sum()
        dz2 = np.outer(do, k * u) * (1 - h2 ** 2) + lam * 2 * (excess(z2, cap) + excess(z2, zcap)) / n
        da2 = dz2 + lam * 2 * excess(a2, cap) / n
        gW2, gb2 = da2.T @ h1, dz2.sum(0)
        dz1 = (da2 @ W2) * (1 - h1 ** 2) + lam * 2 * (excess(z1, cap) + excess(z1, zcap)) / n
        da1 = dz1 + lam * 2 * excess(a1, cap) / n
        gW1, gb1 = da1.T @ X, dz1.sum(0)
        for bb, gb in ((b1, gb1), (b2, gb2)):
            nb = np.linalg.norm(bb) + 1e-9
            gb += lb * 2 * (nb - bt) * bb / nb
        g = [gW1 + lc * _conf_grad(W1), gb1, gW2 + lc * _conf_grad(W2), gb2,
             np.array(gth), np.array(gc)]
        for i in range(6):
            m[i] = 0.9 * m[i] + 0.1 * g[i]
            v[i] = 0.999 * v[i] + 0.001 * g[i] ** 2
            p[i] = p[i] - lr * (m[i] / (1 - 0.9 ** t)) / (np.sqrt(v[i] / (1 - 0.999 ** t)) + 1e-8)
    W1, b1, W2, b2, th, c = p
    return dict(W1=W1, b1=b1, W2=W2, b2=b2, u=np.array([np.cos(th), np.sin(th)]), c=float(c))


def polar_angle(W):
    U, _, Vt = np.linalg.svd(W)
    R = U @ Vt
    return np.arctan2(R[1, 0], R[0, 0])


def canonicalise(net):
    """Permute / sign-flip hidden units (function unchanged since tanh is odd) so that both
    matrices have det > 0 (pure stretch + rotation) with the smallest rotation angle."""
    best = None
    perms = [np.eye(2), np.array([[0.0, 1.0], [1.0, 0.0]])]
    signs = [np.diag([a, b]) for a in (1.0, -1.0) for b in (1.0, -1.0)]
    for P1 in perms:
        for D1 in signs:
            T1 = D1 @ P1
            W1 = T1 @ net["W1"]
            if np.linalg.det(W1) <= 0:
                continue
            b1 = T1 @ net["b1"]
            W2a = net["W2"] @ T1.T
            for P2 in perms:
                for D2 in signs:
                    T2 = D2 @ P2
                    W2 = T2 @ W2a
                    if np.linalg.det(W2) <= 0:
                        continue
                    cost = abs(polar_angle(W1)) + abs(polar_angle(W2))
                    if best is None or cost < best[0]:
                        best = (cost, dict(W1=W1, b1=b1, W2=W2, b2=T2 @ net["b2"],
                                           u=T2 @ net["u"], c=net["c"]))
    return best[1]


def forward(net, X):
    h1 = np.tanh(X @ net["W1"].T + net["b1"])
    h2 = np.tanh(h1 @ net["W2"].T + net["b2"])
    return h1, h2


# ----------------------------------------------------------------------------- geometry helpers
def polar_path(W):
    """M(t) = R(t*theta) [(1-t) I + t S] with W = R S (polar decomposition)."""
    U, sv, Vt = np.linalg.svd(W)
    R = U @ Vt
    Sm = Vt.T @ np.diag(sv) @ Vt
    th = np.arctan2(R[1, 0], R[0, 0])

    def M(t):
        c, s = np.cos(t * th), np.sin(t * th)
        return np.array([[c, -s], [s, c]]) @ ((1 - t) * np.eye(2) + t * Sm)
    return M


def clip_halfplane(poly, n, c):
    """Sutherland-Hodgman: keep the part of convex polygon where n.p + c <= 0."""
    out = []
    for i in range(len(poly)):
        P, Q = poly[i], poly[(i + 1) % len(poly)]
        fp, fq = n @ P + c, n @ Q + c
        if fp <= 0:
            out.append(P)
        if fp * fq < 0:
            out.append(P + (Q - P) * fp / (fp - fq))
    return out


class VecHomotopy(Animation):
    """Like manim's Homotopy but F(points[N,3], t) is applied to whole point arrays at once
    (the per-point Python callback was ~1 s per frame for the dense plane)."""

    def __init__(self, mobject, F, **kwargs):
        self.F = F
        super().__init__(mobject, **kwargs)

    def interpolate_submobject(self, submobject, starting_submobject, alpha):
        if len(starting_submobject.points) > 0:
            submobject.points = self.F(starting_submobject.points, alpha)


def stage_label(text_markup: str, layer: str):
    tag = txt(layer, size=24, color=MUTED)
    main = MarkupText(text_markup, font=FONT, font_size=36, color=TEXT)
    return VGroup(tag, main).arrange(DOWN, aligned_edge=LEFT, buff=0.12)


class GridWarp(Scene):
    def construct(self):
        X, y = make_moons()
        net = canonicalise(train_net(X, y))
        h1, h2 = forward(net, X)
        margin = (2 * y - 1) * (h2 @ net["u"] + net["c"])
        assert (margin > 0).all(), "network must separate the data"

        # ---------------------------------------------------------------- planes
        static = NumberPlane(x_range=(-8, 8, 1), y_range=(-5, 5, 1), x_length=16, y_length=10,
                             background_line_style={"stroke_color": GRID_MINOR,
                                                    "stroke_width": 1.5},
                             axis_config={"stroke_color": GRID_MINOR, "stroke_width": 1.5},
                             faded_line_ratio=1)
        plane = NumberPlane(x_range=(-16, 16, 1), y_range=(-12, 12, 1), x_length=32, y_length=24,
                            background_line_style={"stroke_color": GRID_MOVE,
                                                   "stroke_width": 2, "stroke_opacity": 1},
                            axis_config={"stroke_color": AXIS_MOVE, "stroke_width": 2.5},
                            faded_line_ratio=1)
        plane.prepare_for_nonlinear_transform(70)

        dots = VGroup(*[
            Dot(np.array([px * S, py * S, 0]), radius=0.065,
                color=C_BLUE if yy == 0 else C_ORANGE, stroke_color=BG, stroke_width=1.2)
            for (px, py), yy in zip(X, y)])

        cue(self, "Two classes that no straight line can separate")
        self.play(FadeIn(static), Create(plane, lag_ratio=0.02), run_time=1.2)
        self.play(LaggedStart(*[FadeIn(d, scale=0.4) for d in dots], lag_ratio=0.01),
                  run_time=0.9)

        # ---------------------------------------------------------------- label panel
        anchor = np.array([-6.6, 3.5, 0])

        def place(g):
            g.move_to(anchor, aligned_edge=UL)
            return g

        def panel_for(*mobs):
            g = VGroup(*[m for m in mobs if m is not None])
            r = RoundedRectangle(width=g.width + 0.44, height=g.height + 0.36, corner_radius=0.14,
                                 stroke_width=0, fill_color=BG, fill_opacity=0.9)
            r.move_to(g.get_corner(UL) + np.array([-0.22, 0.18, 0]), aligned_edge=UL)
            return r

        lab0 = place(stage_label("no straight line separates them", "two classes"))
        panel = panel_for(lab0)
        try_line = DashedLine(LEFT * 4.6, RIGHT * 4.6, dash_length=0.12, stroke_color=TEXT,
                              stroke_width=3).rotate(-25 * DEGREES)
        self.play(FadeIn(panel), FadeIn(lab0, shift=0.15 * DOWN), Create(try_line), run_time=0.7)
        ang = ValueTracker(-25 * DEGREES)
        try_line.add_updater(lambda m: m.set_angle(ang.get_value(), about_point=ORIGIN))
        self.play(ang.animate.set_value(18 * DEGREES), run_time=1.1)
        self.play(ang.animate.set_value(-6 * DEGREES), run_time=0.7)
        try_line.clear_updaters()
        self.play(FadeOut(try_line), run_time=0.3)

        # ---------------------------------------------------------------- stage machinery
        def lin_stage(W):
            M = polar_path(W)

            def F(P, t):
                Q = P.copy()
                Q[:, :2] = P[:, :2] @ M(t).T
                return Q
            return F

        def shift_stage(b):
            off = S * np.array([b[0], b[1], 0.0])
            return lambda P, t: P + t * off

        def tanh_stage():
            def F(P, t):
                Q = P.copy()
                Q[:, :2] = (1 - t) * P[:, :2] + t * S * np.tanh(P[:, :2] / S)
                return Q
            return F

        def run_stage(F, run_time):
            starts = np.array([d.get_center() for d in dots])

            def upd(g, a):
                new = F(starts, a)
                for d, p in zip(g, new):
                    d.move_to(p)

            self.play(VecHomotopy(plane, F), UpdateFromAlphaFunc(dots, upd),
                      run_time=run_time, rate_func=smooth)

        cm = {"W_1": C_YELLOW, "W_2": C_YELLOW, r"\mathbf{x}": C_BLUE, r"\mathbf{h}_1": C_BLUE,
              r"\mathbf{b}_1": C_TEAL, r"\mathbf{b}_2": C_TEAL}
        state = {"lab": lab0, "f": None, "panel": panel}

        def switch(new_lab, new_f, run_time=0.45):
            anims = [FadeOut(state["lab"], shift=0.15 * UP), FadeIn(new_lab, shift=0.15 * UP)]
            if new_f is not None:
                if state["f"] is None:
                    anims.append(FadeIn(new_f, shift=0.15 * UP))
                else:
                    anims.append(TransformMatchingTex(state["f"], new_f))
            elif state["f"] is not None:
                anims.append(FadeOut(state["f"]))
            new_panel = panel_for(new_lab, new_f)
            anims.append(Transform(state["panel"], new_panel))
            self.play(*anims, run_time=run_time)
            state["lab"], state["f"] = new_lab, new_f

        Y_, T_ = C_YELLOW, C_TEAL
        layers = [
            ("Layer 1", net["W1"], net["b1"],
             [["W_1", r"\mathbf{x}"], ["W_1", r"\mathbf{x}", "+", r"\mathbf{b}_1"],
              [r"\tanh(", "W_1", r"\mathbf{x}", "+", r"\mathbf{b}_1", ")"]]),
            ("Layer 2", net["W2"], net["b2"],
             [["W_2", r"\mathbf{h}_1"], ["W_2", r"\mathbf{h}_1", "+", r"\mathbf{b}_2"],
              [r"\tanh(", "W_2", r"\mathbf{h}_1", "+", r"\mathbf{b}_2", ")"]]),
        ]
        for lname, W, b, fparts in layers:
            labs = [
                place(stage_label(f'stretch &amp; rotate (<span foreground="{Y_}">W</span>)', lname)),
                place(stage_label(f'shift (<span foreground="{T_}">b</span>)', lname)),
                place(stage_label("bend (tanh)", lname)),
            ]
            fs = []
            for k, fp in enumerate(fparts):
                f = tex(*fp, size=40, cmap=cm)
                f.next_to(labs[k], DOWN, aligned_edge=LEFT, buff=0.16)
                fs.append(f)
            cue(self, f"{lname}: stretch & rotate (W)")
            switch(labs[0], fs[0])
            run_stage(lin_stage(W), 2.0)
            self.wait(0.15)
            cue(self, f"{lname}: shift (b)")
            switch(labs[1], fs[1])
            run_stage(shift_stage(b), 1.1)
            self.wait(0.15)
            cue(self, f"{lname}: bend (tanh)")
            switch(labs[2], fs[2])
            run_stage(tanh_stage(), 2.1)
            self.wait(0.25)

        # ---------------------------------------------------------------- zoom + separating line
        tag = txt("output", size=24, color=MUTED)
        l1 = txt("now a straight line", size=34)
        l2 = txt("separates them", size=34)
        lab_end = place(VGroup(tag, l1, l2).arrange(DOWN, aligned_edge=LEFT, buff=0.12))
        starts = [d.get_center().copy() for d in dots]

        def zoom_upd(g, a):
            k = 1 + (ZOOM - 1) * a
            for d, p0 in zip(g, starts):
                d.move_to(p0 * k)

        new_panel = panel_for(lab_end)
        cue(self, "Now a straight line separates them")
        self.play(FadeOut(state["lab"], shift=0.15 * UP), FadeOut(state["f"]),
                  FadeIn(lab_end, shift=0.15 * UP), Transform(state["panel"], new_panel),
                  plane.animate.scale(ZOOM, about_point=ORIGIN),
                  static.animate.scale(ZOOM, about_point=ORIGIN),
                  UpdateFromAlphaFunc(dots, zoom_upd), run_time=1.2, rate_func=smooth)

        L = S * ZOOM
        u, c = net["u"], net["c"]
        # separating line in output space: u.h + c = 0, with h = p / L
        d = np.array([-u[1], u[0]])
        p0 = -c * L * u
        ts = []
        for i in range(2):
            if abs(d[i]) > 1e-9:
                ts += [(-L - 0.3 - p0[i]) / d[i], (L + 0.3 - p0[i]) / d[i]]
        ts = sorted(ts)
        A = np.array([*(p0 + ts[1] * d), 0.0])
        B = np.array([*(p0 + ts[2] * d), 0.0])
        glow = Line(A, B, stroke_color=TEXT, stroke_width=16, stroke_opacity=0.14)
        sep = Line(A, B, stroke_color=TEXT, stroke_width=5)

        box = [np.array([-L, -L]), np.array([L, -L]), np.array([L, L]), np.array([-L, L])]
        tint_b = Polygon(*[np.array([*q, 0]) for q in clip_halfplane(box, u, c * L)],
                         stroke_width=0, fill_color=C_BLUE, fill_opacity=0.0)
        tint_o = Polygon(*[np.array([*q, 0]) for q in clip_halfplane(box, -u, -c * L)],
                         stroke_width=0, fill_color=C_ORANGE, fill_opacity=0.0)
        self.add(tint_b, tint_o)
        self.bring_to_front(dots, state["panel"], lab_end)
        self.play(Create(glow), Create(sep), run_time=0.9)
        self.play(tint_b.animate.set_fill(opacity=0.13), tint_o.animate.set_fill(opacity=0.13),
                  run_time=0.6)
        self.wait(1.7)
        write_cues(self, "m03_grid_warp")
