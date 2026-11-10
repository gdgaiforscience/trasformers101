"""m09_agent_loop: How a humble Transformer becomes an Agent (~23 s, light palette).

1. A plain Transformer runs one forward pass and guesses from weights ("pH ≈ 3.12 ?").
2. Add tool schemas to the prompt: the same next-token predictor emits a structured
   tool-call token (call: python) and pauses generation.
3. The harness runs the tool in the real world (CPU sandbox / MCP), catches a real
   NameError on turn 1, feeds the observation back into the context window, and on
   turn 2 verifies the exact quadratic pH = 3.2918.
4. Summary: Agent = Transformer + Tools + While-Loop + Memory (4 pillars below).

Build: python build.py m09_agent_loop --bg light
"""
from common_light import *

# Exact chemistry check (0.015 M acetic acid, Ka = 1.8e-5)
KA = 1.8e-5
CONC = 0.015
H_EXACT = (-KA + np.sqrt(KA ** 2 + 4 * KA * CONC)) / 2
PH_EXACT = -np.log10(H_EXACT)
assert abs(PH_EXACT - 3.2918) < 0.001


def heading(*parts):
    """Top-left heading; str parts are Roboto text, (text, colour) tuples are coloured."""
    mobs = []
    for p in parts:
        if isinstance(p, tuple):
            mobs.append(txt(p[0], size=38, color=p[1], weight=BOLD))
        else:
            mobs.append(txt(p, size=38, color=TEXT))
    g = VGroup(*mobs).arrange(RIGHT, buff=0.14, aligned_edge=DOWN)
    g.move_to([-SAFE_X + g.width / 2, 3.12, 0])
    return g


def swap(scene, old, new, rt=0.5):
    scene.play(FadeOut(old, shift=0.22 * UP), FadeIn(new, shift=0.22 * UP), run_time=rt)


def pill(label: str, sub: str | None = None, fill=PANEL, stroke=LINE,
         text_color=TEXT, sub_color=MUTED, w: float = 2.8, h: float = 1.05,
         font=FONT, label_size: float = 24, sub_size: float = 17, stroke_w: float = 2.5):
    box = RoundedRectangle(width=w, height=h, corner_radius=0.16,
                           fill_color=fill, fill_opacity=1.0,
                           stroke_color=stroke, stroke_width=stroke_w)
    if sub:
        t1 = txt(label, size=label_size, color=text_color, weight=BOLD, font=font)
        t2 = txt(sub, size=sub_size, color=sub_color, font=FONT)
        g = VGroup(t1, t2).arrange(DOWN, buff=0.08).move_to(box)
        return VGroup(box, g)
    t1 = txt(label, size=label_size, color=text_color, weight=BOLD, font=font).move_to(box)
    return VGroup(box, t1)


class AgentLoop(Scene):
    def construct(self):
        # ------------------------------------------------------------------ 1. Humble Transformer
        cue(self, "Without tools, a Transformer makes one pass and guesses from its weights")
        h1 = heading("A plain Transformer predicts one token at a time")

        prompt_box = pill('"pH of 0.015M acetic acid?"', sub="user prompt",
                          fill=L_BLUE, stroke=C_BLUE, text_color=T_BLUE, sub_color=T_BLUE,
                          w=3.65, h=1.05, label_size=19, sub_size=16).move_to([-4.5, 0.55, 0])

        # Transformer core with equation
        tf_rect = RoundedRectangle(width=3.2, height=1.95, corner_radius=0.18,
                                   fill_color=PANEL, fill_opacity=1.0,
                                   stroke_color=C_BLUE, stroke_width=3.0).move_to([-0.2, 0.55, 0])
        tf_title = txt("Transformer", size=28, color=T_BLUE, weight=BOLD).move_to([-0.2, 1.15, 0])
        tf_sub = tex(r"p(x_t \mid x_{<t})", size=30, color=MUTED).move_to([-0.2, 0.65, 0])
        tf_note = txt("same weights · next-token math", size=16, color=MUTED).move_to([-0.2, -0.1, 0])
        tf_box = VGroup(tf_rect, tf_title, tf_sub, tf_note)

        guess_box = pill("≈ 3.12  ?", sub="1 pass · unverified guess",
                         fill=L_RED, stroke=C_RED, text_color=T_RED, sub_color=T_RED,
                         w=3.0, h=1.05, label_size=26, sub_size=16).move_to([4.2, 0.55, 0])

        arr_in = Arrow(prompt_box.get_right(), tf_box.get_left(), buff=0.14,
                       stroke_width=3.5, color=C_BLUE, max_tip_length_to_length_ratio=0.18)
        arr_out = Arrow(tf_box.get_right(), guess_box.get_left(), buff=0.14,
                        stroke_width=3.5, color=C_RED, max_tip_length_to_length_ratio=0.18)

        self.play(FadeIn(h1, shift=0.18 * DOWN), run_time=0.5)
        self.play(FadeIn(prompt_box, shift=0.2 * RIGHT), FadeIn(tf_box, scale=0.95), run_time=0.7)
        self.play(GrowArrow(arr_in), run_time=0.4)
        self.play(GrowArrow(arr_out), FadeIn(guess_box, shift=0.2 * RIGHT), run_time=0.6)
        self.wait(1.0)

        # ------------------------------------------------------------------ 2. Add tool schemas + Pause
        cue(self, "Add tool schemas to the prompt: the same model emits a structured tool call")
        h2 = heading("Add", ("tool schemas", T_ORANGE), "— the same model emits a", ("tool call", T_ORANGE))
        swap(self, h1, h2)

        schema_pill = pill("tools: [run_python]", sub="JSON schema in context",
                           fill=L_YELLOW, stroke=C_YELLOW, text_color=TEXT, sub_color=MUTED,
                           w=3.65, h=0.82, font=MONO, label_size=19, sub_size=15).next_to(prompt_box, UP, buff=0.18)

        call_pill = pill("call: python(...)", sub="⏸ pause GPU · hand off",
                         fill=L_YELLOW, stroke=C_YELLOW, text_color=TEXT, sub_color=T_ORANGE,
                         w=3.0, h=1.05, font=MONO, label_size=20, sub_size=16).move_to([4.2, 1.55, 0])

        arr_call = CurvedArrow(tf_box.get_right() + UP * 0.25, call_pill.get_left(),
                               angle=-0.25, color=C_YELLOW, stroke_width=3.5, tip_length=0.2)

        self.play(FadeOut(guess_box, shift=0.15 * DOWN), FadeOut(arr_out),
                  FadeIn(schema_pill, shift=0.15 * DOWN), run_time=0.6)
        self.play(Create(arr_call), FadeIn(call_pill, shift=0.15 * RIGHT), run_time=0.8)
        self.wait(0.8)

        # ------------------------------------------------------------------ 3. Harness Loop + Self-Correction
        cue(self, "The harness runs Python in the real world, catches a bug, and feeds truth back")
        h3 = heading("A", ("while-loop", T_GREEN), "executes tools and feeds", ("reality", T_GREEN), "back")
        swap(self, h2, h3)

        sandbox_box = pill("Python Sandbox", sub="outside model · CPU / MCP",
                           fill=PANEL, stroke=C_GREEN, text_color=T_GREEN, sub_color=MUTED,
                           w=3.05, h=1.15, label_size=24, sub_size=16).move_to([4.2, -0.35, 0])

        arr_exec = Arrow(call_pill.get_bottom(), sandbox_box.get_top(), buff=0.12,
                         stroke_width=3.2, color=C_ORANGE, max_tip_length_to_length_ratio=0.28)

        # Harness outer loop frame
        harness_rect = RoundedRectangle(width=12.85, height=4.48, corner_radius=0.25,
                                        stroke_color=GREY, stroke_width=2.0,
                                        fill_opacity=0.0).set_stroke(opacity=0.65).move_to([-0.15, 0.22, 0])
        harness_tag = txt("HARNESS  while not done:", size=17, color=MUTED, font=MONO, weight=BOLD)
        harness_tag.next_to(harness_rect.get_corner(UL), RIGHT, buff=0.3).shift(DOWN * 0.22)

        self.play(FadeIn(harness_rect), FadeIn(harness_tag),
                  GrowArrow(arr_exec), FadeIn(sandbox_box, shift=0.15 * DOWN), run_time=0.8)

        # Turn 1: NameError caught! Continuous return path from sandbox bottom -> badge -> prompt bottom
        err_badge = pill("NameError: math", sub="turn 1 · caught by sandbox",
                         fill=L_RED, stroke=C_RED, text_color=T_RED, sub_color=T_RED,
                         w=2.85, h=0.85, font=MONO, label_size=19, sub_size=15).move_to([0.9, -1.48, 0])

        ret_line_r = VMobject(color=C_RED, stroke_width=3.2)
        ret_line_r.set_points_as_corners([
            sandbox_box.get_bottom(),
            [4.2, -1.48, 0],
            [err_badge.get_right()[0], -1.48, 0],
        ])
        ret_line_l = Arrow([err_badge.get_left()[0], -1.48, 0], [-4.5, -1.48, 0], buff=0.0,
                           color=C_RED, stroke_width=3.2, max_tip_length_to_length_ratio=0.08)
        ret_up = Arrow([-4.5, -1.48, 0], prompt_box.get_bottom(), buff=0.08,
                       color=C_RED, stroke_width=3.2, max_tip_length_to_length_ratio=0.18)

        obs_lbl = txt("observation appended to context", size=17, color=T_RED, weight=BOLD).next_to(err_badge, LEFT, buff=0.22).shift(UP * 0.24)

        self.play(Create(ret_line_r), FadeIn(err_badge, scale=0.92), run_time=0.55)
        self.play(GrowArrow(ret_line_l), GrowArrow(ret_up), FadeIn(obs_lbl), run_time=0.75)

        # Pulse travels into Transformer -> Turn 2 fixes it!
        pulse = Dot(radius=0.11, color=C_GREEN).move_to(prompt_box.get_right())
        self.play(pulse.animate.move_to(tf_box.get_center()), run_time=0.4)
        self.play(Indicate(tf_rect, color=C_GREEN, scale_factor=1.03),
                  pulse.animate.move_to(call_pill.get_left()), run_time=0.5)
        self.play(FadeOut(pulse), run_time=0.15)

        # Turn 2: Verified result!
        ok_badge = pill("pH = 3.2918 ✓", sub="turn 2 · verified by Python",
                        fill=L_GREEN, stroke=C_GREEN, text_color=T_GREEN, sub_color=T_GREEN,
                        w=2.85, h=0.85, font=MONO, label_size=20, sub_size=15).move_to([0.9, -1.48, 0])
        obs_lbl_ok = txt("verified result → context", size=17, color=T_GREEN, weight=BOLD).move_to(obs_lbl)

        self.play(
            ReplacementTransform(err_badge, ok_badge),
            ReplacementTransform(obs_lbl, obs_lbl_ok),
            ret_line_r.animate.set_color(C_GREEN),
            ret_line_l.animate.set_color(C_GREEN),
            ret_up.animate.set_color(C_GREEN),
            run_time=0.7,
        )
        self.wait(0.8)

        # ------------------------------------------------------------------ 4. Zoom out -> 4 Pillars + Agent Equation
        cue(self, "Agent = Transformer + Tools + While-Loop + Memory")
        h4 = heading("How a humble Transformer becomes an", ("Agent", T_BLUE))
        swap(self, h3, h4)

        diagram = VGroup(
            harness_rect, harness_tag,
            prompt_box, schema_pill, tf_box, call_pill, sandbox_box,
            arr_in, arr_call, arr_exec,
            ret_line_r, ret_line_l, ret_up, ok_badge, obs_lbl_ok,
        )
        self.play(diagram.animate.scale(0.62).move_to([0, 1.32, 0]), run_time=0.85)

        # 4 capability cards
        specs = [
            ("1 · Tool Use", "structured calls + MCP", C_YELLOW, L_YELLOW, TEXT),
            ("2 · Harness Loop", "plan → act → observe", C_BLUE, L_BLUE, T_BLUE),
            ("3 · Memory", "KV context + files / RAG", C_GREEN, L_GREEN, T_GREEN),
            ("4 · Guardrails", "verify + least privilege", C_RED, L_RED, T_RED),
        ]
        cards = VGroup()
        for title, desc, stroke_c, tint_c, title_c in specs:
            c_bg = RoundedRectangle(width=2.92, height=1.22, corner_radius=0.14,
                                    fill_color=PANEL, fill_opacity=1.0,
                                    stroke_color=LINE, stroke_width=2.0)
            top_bar = Line(c_bg.get_corner(UL) + RIGHT * 0.08, c_bg.get_corner(UR) + LEFT * 0.08,
                           color=stroke_c, stroke_width=5.5).shift(DOWN * 0.02)
            t_m = txt(title, size=22, color=title_c, weight=BOLD)
            d_m = txt(desc, size=17, color=MUTED)
            lbls = VGroup(t_m, d_m).arrange(DOWN, buff=0.1).move_to(c_bg)
            cards.add(VGroup(c_bg, top_bar, lbls))
        cards.arrange(RIGHT, buff=0.22).move_to([0, -1.25, 0])

        self.play(LaggedStart(*[FadeIn(c, shift=0.2 * UP) for c in cards], lag_ratio=0.12), run_time=1.0)

        # Closing formula
        eq_parts = VGroup(
            txt("Agent", size=34, color=TEXT, weight=BOLD),
            txt("=", size=34, color=MUTED),
            txt("Transformer", size=32, color=T_BLUE, weight=BOLD),
            txt("+", size=32, color=MUTED),
            txt("Tools", size=32, color=T_ORANGE, weight=BOLD),
            txt("+", size=32, color=MUTED),
            txt("While-Loop", size=32, color=T_GREEN, weight=BOLD),
            txt("+", size=32, color=MUTED),
            txt("Memory", size=32, color=TEXT, weight=BOLD),
        ).arrange(RIGHT, buff=0.18).move_to([0, -2.68, 0])
        eq_box = SurroundingRectangle(eq_parts, buff=0.22, color=C_BLUE, stroke_width=2.5,
                                      corner_radius=0.14, fill_color=PANEL, fill_opacity=1.0)
        self.play(FadeIn(eq_box), Write(eq_parts), run_time=0.95)
        self.wait(1.8)

        write_cues(self, "m09_agent_loop")
