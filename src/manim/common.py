"""Shared style for the "Inside the Black Box" manim clips (see docs/DESIGN.md, section 1).

Every scene imports * from here so that palette, fonts and the background colour are identical
across clips.
"""
from __future__ import annotations

import numpy as np
from manim import *  # noqa: F401,F403

# ---------------------------------------------------------------- video / background
config.background_color = "#0f1115"
config.frame_rate = 30

# ---------------------------------------------------------------- exact colour encoding
# manim hands RGBA frames to PyAV, whose implicit rgba->yuv420p conversion darkens everything by
# 1-2 levels (the background decoded as (14,15,20)). We convert ourselves with the exact BT.601
# limited-range matrix (what ffmpeg/browsers assume for untagged H.264). 8-bit 4:2:0 YUV cannot
# represent #0f1115 exactly; pure-background pixels get the closest triple (31,130,127), which
# ffmpeg decodes to (15,16,21) -- the nearest reachable value.
import av as _av
from manim.scene import scene_file_writer as _sfw

_BG_RGB = np.array([15, 17, 21], dtype=np.uint8)
_BG_YUV = (31, 130, 127)


def _rgba_to_yuv420p(frame: np.ndarray) -> np.ndarray:
    h, w = frame.shape[:2]
    rgb = frame[..., :3].astype(np.float32)
    R, G, B = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    Y = 16.0 + (65.481 * R + 128.553 * G + 24.966 * B) / 255.0
    U = 128.0 + (-37.797 * R - 74.203 * G + 112.0 * B) / 255.0
    V = 128.0 + (112.0 * R - 93.786 * G - 18.214 * B) / 255.0
    Uc = U.reshape(h // 2, 2, w // 2, 2).mean(axis=(1, 3))
    Vc = V.reshape(h // 2, 2, w // 2, 2).mean(axis=(1, 3))
    bg = np.all(frame[..., :3] == _BG_RGB, axis=-1)
    Y = np.where(bg, _BG_YUV[0], np.rint(Y))
    bgc = bg.reshape(h // 2, 2, w // 2, 2).all(axis=(1, 3))
    Uc = np.where(bgc, _BG_YUV[1], np.rint(Uc))
    Vc = np.where(bgc, _BG_YUV[2], np.rint(Vc))
    out = np.empty((h * 3 // 2, w), np.uint8)
    out[:h] = np.clip(Y, 0, 255)
    out[h:h + h // 4] = np.clip(Uc, 0, 255).reshape(h // 4, w)
    out[h + h // 4:] = np.clip(Vc, 0, 255).reshape(h // 4, w)
    return out


def _encode_and_write_frame(self, frame, num_frames):
    yuv = _rgba_to_yuv420p(frame)
    for _ in range(num_frames):
        av_frame = _av.VideoFrame.from_ndarray(yuv, format="yuv420p")
        for packet in self.video_stream.encode(av_frame):
            self.video_container.mux(packet)


_sfw.SceneFileWriter.encode_and_write_frame = _encode_and_write_frame

# ---------------------------------------------------------------- palette (DESIGN.md 1)
BG = "#0f1115"
TEXT = "#ECEFF4"
MUTED = "#9AA4B2"
GRID = "#2A3140"
GRID_MINOR = "#1B2029"
C_BLUE = "#58C4DD"     # inputs x, activations, class A, positive weights
C_ORANGE = "#F0AC5F"   # class B, eta
C_YELLOW = "#FFD54F"   # weights W / w
C_TEAL = "#5CD0B3"     # bias b
C_GREEN = "#83C167"    # gradients
C_RED = "#FC6255"      # loss, negative weights
C_PURPLE = "#9A72AC"   # attention
C_PINK = "#E07A9F"     # extra category colour
C_ZERO = "#1a1d24"     # middle of the diverging colormap
PANEL = "#161a21"      # slightly lighter than BG, for subtle panels

FONT = "Roboto"
MONO = "DejaVu Sans Mono"

# Symbol colours used in MathTex.
TEX_COLORS = {
    "W": C_YELLOW,
    "w": C_YELLOW,
    "x": C_BLUE,
    "b": C_TEAL,
    "L": C_RED,
    "\\eta": C_ORANGE,
    "\\partial": C_GREEN,
    "\\nabla": C_GREEN,
}


def txt(s: str, size: float = 32, color=TEXT, weight=NORMAL, font: str = FONT, **kw) -> Text:
    """Sans-serif label in the deck font."""
    return Text(s, font=font, font_size=size, color=color, weight=weight, **kw)


def mono(s: str, size: float = 30, color=TEXT, weight=NORMAL, **kw) -> Text:
    return Text(s, font=MONO, font_size=size, color=color, weight=weight, **kw)


def tex(*parts: str, size: float = 48, color=TEXT, cmap: dict | None = None, **kw) -> MathTex:
    """MathTex in TEXT colour; parts whose string is a key of ``cmap`` get that colour."""
    m = MathTex(*parts, font_size=size, color=color, **kw)
    if cmap:
        for i, p in enumerate(parts):
            if p in cmap:
                m[i].set_color(cmap[p])
    return m


def num(x: float, nd: int = 2, plus: bool = False) -> str:
    """LaTeX string for a number with a proper minus sign (and optional explicit plus)."""
    s = f"{x:.{nd}f}"
    if s.startswith("-"):
        # avoid "-0.00"
        if float(s) == 0:
            s = s[1:]
        return s
    return ("+" + s) if plus else s


def bg_box(mob: Mobject, buff: float = 0.18, opacity: float = 0.88, color=BG,
           corner_radius: float = 0.12) -> RoundedRectangle:
    """Rounded background panel that keeps labels legible over grid lines."""
    r = RoundedRectangle(
        width=mob.width + 2 * buff,
        height=mob.height + 2 * buff,
        corner_radius=corner_radius,
        stroke_width=0,
        fill_color=color,
        fill_opacity=opacity,
    )
    r.move_to(mob)
    return r


def corner_caption(s: str = "illustrative numbers", size: float = 18) -> Text:
    c = txt(s, size=size, color=MUTED)
    c.to_corner(DR, buff=0.3)
    return c


def sigmoid(z):
    return 1.0 / (1.0 + np.exp(-z))


def lerp_color(c1, c2, t: float):
    return interpolate_color(ManimColor(c1), ManimColor(c2), float(np.clip(t, 0, 1)))


def diverging(v: float, vmax: float = 1.0):
    """RED (negative) -> C_ZERO -> BLUE (positive)."""
    t = float(np.clip(v / vmax, -1, 1))
    if t >= 0:
        return lerp_color(C_ZERO, C_BLUE, t)
    return lerp_color(C_ZERO, C_RED, -t)


def weight_color(w: float):
    return C_BLUE if w >= 0 else C_RED


# ---------------------------------------------------------------- stage cues
import json as _json
from pathlib import Path as _Path

_CUE_DIR = _Path(__file__).resolve().parent.parent.parent / "assets" / "video"


def cue(scene: Scene, label: str) -> None:
    """Record a stage marker at the scene's current time (seconds)."""
    if not hasattr(scene, "_cues"):
        scene._cues = []
    scene._cues.append({"t": round(float(scene.time), 2), "label": label})


def write_cues(scene: Scene, name: str) -> None:
    _CUE_DIR.mkdir(parents=True, exist_ok=True)
    (_CUE_DIR / f"{name}.cues.json").write_text(
        _json.dumps(getattr(scene, "_cues", []), indent=1, ensure_ascii=False) + "\n")
