"""m08_lora: LoRA, the maths in ~25 seconds (light palette; plays over the #finetune slide's live explorer).

1. Fine-tuning learns a change ΔW: a grid of numbers (6 × 6 = 36 here).
2. This one is special: every row is a multiple of the first row, so ΔW = b aᵀ (rank 1).
3. Each cell is one product b_i × a_j: 36 numbers are described by 6 + 6 = 12.
4. A real 4096 × 4096 layer: 16,777,216 numbers; rank 1 needs 8,192; rank r = 8 needs 65,536 (0.39 %),
   written ΔW = B A with B: 4096 × r and A: r × 4096.
5. LoRA: h = W₀x + BAx with W₀ frozen and only B, A trained; B starts at 0, so ΔW = 0 and training starts
   exactly at the original model (Hu et al. 2021, arXiv 2106.09685, §4.1).
Every number on screen is computed (and asserted) below. Build: python build.py m08_lora --bg light
"""
from common_light import *

B_VEC = np.array([1, 2, -1, 3, -2, 1])
A_VEC = np.array([2, -1, 3, 1, -2, 1])
DW = np.outer(B_VEC, A_VEC)                     # 6 × 6, rank 1
assert np.linalg.matrix_rank(DW) == 1
D = K = 4096
R = 8
FULL, RANK1, RANKR = D * K, D + K, R * (D + K)
assert (FULL, RANK1, RANKR) == (16_777_216, 8_192, 65_536)
SHARE = 100 * RANKR / FULL                      # 0.390625 %

S = 0.7                                         # cell size
X0, Y0 = 0.6, -0.75                             # centre of the 6 × 6 grid
SQ = 3.3                                        # side of the schematic 4096 × 4096 squares


def cx(j):
    return X0 + (j - 2.5) * S


def cy(i):
    return Y0 - (i - 2.5) * S


def cell_color(v):
    if v == 0:
        return ManimColor(PANEL)
    t = 0.15 + 0.55 * min(abs(v) / 9, 1)        # mid tints: ink text stays > 5.9:1
    return interpolate_color(ManimColor(PANEL), ManimColor(C_BLUE if v > 0 else C_RED), t)


def cell(v, x, y, s=S):
    sq = Square(side_length=s).set_stroke(LINE, 2).set_fill(cell_color(v), 1).move_to([x, y, 0])
    return VGroup(sq, tex(str(int(v)), size=30, color=TEXT).move_to(sq))


def heading(*parts):
    """Top-left heading; str parts are Roboto text, (latex, colour) tuples are MathTex (centre-aligned)."""
    mobs = [tex(p[0], size=52, color=p[1]) if isinstance(p, tuple) else txt(p, size=38) for p in parts]
    g = VGroup(*mobs).arrange(RIGHT, buff=0.16)
    g.move_to([-SAFE_X + g.width / 2, 3.12, 0])
    return g


def swap(scene, old, new, rt=0.6):
    scene.play(FadeOut(old, shift=0.25 * UP), FadeIn(new, shift=0.25 * UP), run_time=rt)


class Lora(Scene):
    def construct(self):
        # ------------------------------------------------------------------ 1. a change is a grid
        cue(self, "Fine-tuning learns a change ΔW: a grid of numbers")
        h1 = heading("Fine-tuning learns a change", (r"\Delta W", T_GREEN))
        grid = VGroup(*[VGroup(*[cell(DW[i, j], cx(j), cy(i)) for j in range(6)]) for i in range(6)])
        count1 = txt("36 numbers to learn", size=30, color=MUTED).move_to([X0, Y0 - 3 * S - 0.45, 0])
        self.play(FadeIn(h1, shift=0.2 * DOWN), run_time=0.6)
        self.play(LaggedStart(*[FadeIn(grid[i][j], scale=0.6) for i in range(6) for j in range(6)],
                              lag_ratio=0.03), run_time=1.7)
        self.play(FadeIn(count1, shift=0.1 * UP), run_time=0.5)
        self.wait(0.7)

        # ------------------------------------------------------------------ 2. rows are multiples
        cue(self, "But every row is a multiple of the first row")
        h2 = heading("But look: every row is a multiple of the first")
        swap(self, h1, h2)
        row_box = SurroundingRectangle(grid[0], buff=0.05, color=T_BLUE, stroke_width=4, corner_radius=0.05)
        self.play(Create(row_box), run_time=0.5)
        bx = X0 - 3 * S - 0.55 - S / 2
        ay = Y0 + 3 * S + 0.5 + S / 2
        mults = VGroup(*[tex(r"\times " + (f"({b})" if b < 0 else f"{b}"), size=34, color=T_GREEN)
                         .move_to([bx - 0.1, cy(i), 0]) for i, b in enumerate(B_VEC)])
        self.play(LaggedStart(*[FadeIn(m, shift=0.2 * RIGHT) for m in mults], lag_ratio=0.15), run_time=1.3)
        self.wait(0.3)
        bcol = VGroup(*[cell(b, bx, cy(i)) for i, b in enumerate(B_VEC)])
        arow = VGroup(*[cell(a, cx(j), ay) for j, a in enumerate(A_VEC)])
        for c in [*bcol, *arow]:
            c[0].set_stroke(C_GREEN, 3)
        lab_b = tex("b", size=44, color=T_GREEN).next_to(bcol, DOWN, buff=0.18)
        lab_a = tex(r"a^{\top}", size=44, color=T_GREEN).next_to(arow, LEFT, buff=0.3)
        # the multipliers ARE b (they morph in place); the first row IS a (it lifts out)
        self.play(*[ReplacementTransform(mults[i], bcol[i]) for i in range(6)],
                  TransformFromCopy(grid[0], arow), FadeOut(row_box), FadeOut(count1), run_time=1.2)
        self.play(FadeIn(lab_b, shift=0.1 * UP), FadeIn(lab_a, shift=0.1 * RIGHT), run_time=0.4)
        self.wait(0.3)

        # ------------------------------------------------------------------ 3. one cell = one product
        cue(self, "Each cell is one multiplication: ΔW_ij = b_i × a_j")
        h3 = heading("Each cell is one product:", (r"\Delta W_{ij} = b_i\, a_j", T_GREEN))
        swap(self, h2, h3)
        i, j = 3, 2
        assert DW[i, j] == B_VEC[i] * A_VEC[j] == 9
        boxes = VGroup(*[SurroundingRectangle(m, buff=0.05, color=TEXT, stroke_width=4, corner_radius=0.04)
                         for m in (bcol[i], arow[j], grid[i][j])])
        guides = VGroup(DashedLine(bcol[i].get_right(), grid[i][j].get_left(), color=MUTED, stroke_width=2.5),
                        DashedLine(arow[j].get_bottom(), grid[i][j].get_top(), color=MUTED, stroke_width=2.5))
        prod = tex(f"{B_VEC[i]}", r"\times", f"{A_VEC[j]}", "=", f"{DW[i, j]}", size=54).move_to([4.95, 0.75, 0])
        prod[0].set_color(T_GREEN)
        prod[2].set_color(T_GREEN)
        self.play(Create(boxes[0]), Create(boxes[1]), run_time=0.5)
        self.play(Create(guides), Create(boxes[2]), run_time=0.5)
        self.play(TransformFromCopy(bcol[i][1], prod[0]), TransformFromCopy(arow[j][1], prod[2]),
                  FadeIn(prod[1]), FadeIn(prod[3]), run_time=0.8)
        self.play(TransformFromCopy(grid[i][j][1], prod[4]), run_time=0.5)
        count2 = VGroup(txt("36 numbers are really", size=28, color=MUTED),
                        txt("6 + 6 = 12", size=46, color=T_GREEN, weight=BOLD)).arrange(DOWN, buff=0.18)
        count2.move_to([4.95, -1.1, 0])
        self.play(FadeIn(count2, shift=0.1 * UP), run_time=0.6)
        self.wait(1.0)

        # ------------------------------------------------------------------ 4. a real layer
        cue(self, "A real 4096 × 4096 layer: 16,777,216 numbers, 8,192 at rank 1, 65,536 at rank 8")
        h4 = heading("A real layer is 4096 × 4096")
        dW = Square(side_length=SQ).set_stroke(C_GREEN, 3).set_fill(L_GREEN, 0.6).move_to([X0, Y0, 0])
        b1 = Rectangle(width=0.08, height=SQ).set_stroke(C_GREEN, 3).set_fill(C_GREEN, 1).next_to(dW, LEFT, buff=0.25)
        a1 = Rectangle(width=SQ, height=0.08).set_stroke(C_GREEN, 3).set_fill(C_GREEN, 1).next_to(dW, UP, buff=0.25)
        dW_lab = VGroup(tex(r"\Delta W", size=60, color=T_GREEN), txt("4096 × 4096", size=26, color=T_GREEN)
                        ).arrange(DOWN, buff=0.15).move_to(dW)
        self.play(FadeOut(VGroup(prod, count2, boxes, guides, lab_a, lab_b)), run_time=0.4)
        swap(self, h3, h4, rt=0.5)
        self.play(FadeTransform(grid, dW), FadeTransform(bcol, b1), FadeTransform(arow, a1), run_time=1.1)
        self.play(FadeIn(dW_lab, scale=0.9), run_time=0.4)
        CX = 4.6
        c_full = VGroup(txt("a number per cell", size=26, color=MUTED),
                        txt(f"{FULL:,}", size=44, color=T_RED, weight=BOLD)).arrange(DOWN, buff=0.1)
        c_r1 = VGroup(txt("rank 1: a column + a row", size=26, color=MUTED),
                      txt(f"{RANK1:,}", size=44, color=T_GREEN, weight=BOLD)).arrange(DOWN, buff=0.1)
        VGroup(c_full, c_r1).arrange(DOWN, buff=0.55).move_to([CX, 0.2, 0])
        self.play(FadeIn(c_full, shift=0.1 * UP), run_time=0.5)
        self.play(FadeIn(c_r1, shift=0.1 * UP), Indicate(b1, color=T_GREEN, scale_factor=1.0),
                  Indicate(a1, color=T_GREEN, scale_factor=1.0), run_time=0.8)
        # rank r: r columns in B, r rows in A (drawn wider than to scale)
        TW = 0.48
        bR = Rectangle(width=TW, height=SQ).set_stroke(C_GREEN, 3).set_fill(L_GREEN, 1).next_to(dW, LEFT, buff=0.25)
        aR = Rectangle(width=SQ, height=TW).set_stroke(C_GREEN, 3).set_fill(L_GREEN, 1).next_to(dW, UP, buff=0.25)
        cols = VGroup(*[Line(bR.get_corner(UL) + RIGHT * TW * k / R, bR.get_corner(DL) + RIGHT * TW * k / R,
                             stroke_width=1.6, color=C_GREEN) for k in range(1, R)])
        rows = VGroup(*[Line(aR.get_corner(UL) + DOWN * TW * k / R, aR.get_corner(UR) + DOWN * TW * k / R,
                             stroke_width=1.6, color=C_GREEN) for k in range(1, R)])
        lab_B = tex("B", size=48, color=T_GREEN).next_to(bR, DOWN, buff=0.15)
        lab_A = tex("A", size=48, color=T_GREEN).next_to(aR, LEFT, buff=0.2)
        eq = tex(r"\Delta W", "=", "B", "A", size=58).next_to(dW, DOWN, buff=0.38)
        for k in (0, 2, 3):
            eq[k].set_color(T_GREEN)
        c_rR = VGroup(txt(f"rank r = {R}: B and A", size=26, color=MUTED),
                      txt(f"{RANKR:,}", size=44, color=T_GREEN, weight=BOLD),
                      txt(f"= {SHARE:.2f} % of the layer", size=26, color=T_GREEN)).arrange(DOWN, buff=0.1)
        c_rR.move_to(c_r1, aligned_edge=UP)
        self.play(ReplacementTransform(b1, bR), ReplacementTransform(a1, aR), FadeIn(cols), FadeIn(rows),
                  FadeIn(lab_B), FadeIn(lab_A), FadeOut(c_r1, shift=0.15 * UP), Write(eq), run_time=1.1)
        self.play(FadeIn(c_rR, shift=0.15 * UP), run_time=0.5)
        self.wait(1.0)

        # ------------------------------------------------------------------ 5. the LoRA layer
        cue(self, "LoRA: h = W₀x + BAx. W₀ is frozen; only B and A train, and B starts at 0")
        h5 = heading("LoRA: freeze", ("W_0", T_BLUE), "and train only", ("B", T_GREEN), "and", ("A", T_GREEN))
        lora = VGroup(bR, aR, dW, cols, rows, lab_B, lab_A, dW_lab)
        self.play(FadeOut(VGroup(c_full, c_rR, eq)), run_time=0.4)
        YC = 0.15                                   # common centre line of W0 and ΔW
        W0 = Square(side_length=SQ).set_stroke(C_BLUE, 3).set_fill(L_BLUE, 0.8).move_to([-2.92, YC, 0])
        W0_lab = VGroup(tex("W_0", size=60, color=T_BLUE), txt("❄ frozen", size=28, color=T_BLUE)).arrange(DOWN, buff=0.15)
        W0_lab.move_to(W0)
        plus = tex("+", size=72).move_to([-0.52, YC, 0])
        swap(self, h4, h5)
        self.play(lora.animate.shift(np.array([2.91, YC, 0]) - dW.get_center()), FadeIn(W0, shift=0.4 * RIGHT),
                  FadeIn(plus), run_time=1.0)
        self.play(FadeIn(W0_lab, scale=0.9), run_time=0.4)
        # B starts at zero, so ΔW starts at zero: training begins exactly at the original model
        zero = VGroup(tex(r"B = 0 \;\Rightarrow\; \Delta W = 0", size=36, color=T_GREEN),
                      txt("start = the original model", size=22, color=MUTED)).arrange(DOWN, buff=0.12).move_to(dW)
        self.play(bR.animate.set_fill(PANEL, 1), dW.animate.set_fill(PANEL, 1), FadeOut(dW_lab), FadeIn(zero),
                  run_time=0.7)
        self.wait(0.5)
        self.play(bR.animate.set_fill(L_GREEN, 1), dW.animate.set_fill(L_GREEN, 0.6), FadeOut(zero), FadeIn(dW_lab),
                  run_time=0.8)
        final = tex(r"\mathbf{h}", "=", "W_0", r"\mathbf{x}", "+", "B", "A", r"\mathbf{x}", size=66)
        final[2].set_color(T_BLUE)
        final[5].set_color(T_GREEN)
        final[6].set_color(T_GREEN)
        final.move_to([0, -2.72, 0])
        box = SurroundingRectangle(final, buff=0.2, color=TEXT, stroke_width=2.5, corner_radius=0.1)
        self.play(Write(final), run_time=0.9)
        self.play(Create(box), run_time=0.5)
        self.wait(1.8)
        write_cues(self, "m08_lora")
