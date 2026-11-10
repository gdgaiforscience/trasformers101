"""Light-theme variant of common.py, for clips that sit on the deck's light slides (--bg #F8F9FA).

``from common_light import *`` gives every helper from common.py (cue/write_cues, num, sigmoid,
lerp_color, ...) but with
  * the deck's light Google palette (constants below; no purple / teal / pink),
  * text/tex/panel helpers whose *default* colours are the light ones (the common.py helpers bind
    the dark TEXT/BG as default arguments, so they are redefined here), and
  * a re-patched yuv420p encoder whose pure-background special case targets #F8F9FA.

WCAG 2.2 AA: small text only in TEXT (#202124), MUTED (#5F6368) or a dark surface tint
(T_BLUE / T_RED / T_GREEN). The bright brand colours are for shapes, strokes, fills and very large
bold labels (>= 3:1). Build light clips with ``python build.py <name> --bg light``.
"""
from __future__ import annotations

from common import *  # noqa: F401,F403  (helpers; palette, defaults and encoder overridden below)

import av as _av
from manim.scene import scene_file_writer as _sfw

# ---------------------------------------------------------------- video / background
config.background_color = "#F8F9FA"

# ---------------------------------------------------------------- exact colour encoding (light)
# Same exact BT.601 limited-range RGB->YUV conversion as common.py. #F8F9FA = (248,249,250) is not
# exactly representable in 8-bit 4:2:0 YUV either. Exhaustive search (``python common_light.py``):
# every YUV triple near the float value (229.7,128.6,127.5) is decoded by ffmpeg exactly the way
# build.py extracts check frames; the closest is (231,128,127), which decodes to (248,250,250).
_BG_RGB = np.array([248, 249, 250], dtype=np.uint8)
_BG_YUV = (231, 128, 127)
BG_DECODED = (248, 250, 250)


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

# ---------------------------------------------------------------- light Google palette
BG = "#F8F9FA"
TEXT = "#202124"        # black / body text
MUTED = "#5F6368"       # secondary text (AA on BG and white)
GREY = "#9AA0A6"        # node strokes, neutral shapes (not for text)
LIGHT_GREY = "#F1F3F4"
LINE = "#DADCE0"        # hairlines, empty cells
PANEL = "#FFFFFF"
GRID = LINE
GRID_MINOR = LIGHT_GREY

C_BLUE = "#4285F4"      # brand colours: shapes / strokes / fills / very large bold labels only
C_RED = "#EA4335"
C_YELLOW = "#FBBC04"
C_GREEN = "#34A853"

T_BLUE = "#174EA6"      # dark surface tints (T_BLUE / T_RED / T_GREEN are AA for small text)
T_RED = "#A50E0E"
T_ORANGE = "#E37400"
T_GREEN = "#0D652D"

L_BLUE = "#D2E3FC"      # light tints (fills behind dark text)
L_RED = "#FAD2CF"
L_YELLOW = "#FEEFC3"
L_GREEN = "#CEEAD6"

C_ZERO = LIGHT_GREY     # middle of the diverging weight colormap
C_ORANGE = T_ORANGE
# The light palette has no teal / purple / pink: legacy names alias to palette colours so that any
# helper that still references them stays on-palette.
C_TEAL = C_GREEN
C_PURPLE = C_BLUE
C_PINK = C_RED

NODE_FILL = "#FFFFFF"
NODE_STROKE = GREY

FONT = "Roboto"
MONO = "Noto Sans Mono"

TEX_COLORS = {
    "x": T_BLUE,
    "L": T_RED,
    "\\partial": T_GREEN,
    "\\nabla": T_GREEN,
}

# Safe area of the 1920x1080 design canvas (90 px sides, 70 px top/bottom), in scene units.
PX = config.frame_width / 1920
SAFE_X = config.frame_width / 2 - 90 * PX
SAFE_Y = config.frame_height / 2 - 70 * PX


# ---------------------------------------------------------------- helpers with light defaults
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


def bg_box(mob: Mobject, buff: float = 0.18, opacity: float = 0.92, color=BG,
           corner_radius: float = 0.12) -> RoundedRectangle:
    """Rounded background panel that keeps labels legible over lines."""
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
    """Muted note in the bottom-right corner of the safe area."""
    c = txt(s, size=size, color=MUTED)
    c.move_to([SAFE_X - c.width / 2, -SAFE_Y + c.height / 2, 0])
    return c


def diverging(v: float, vmax: float = 1.0):
    """C_RED (negative) -> C_ZERO (#F1F3F4) -> C_BLUE (positive)."""
    t = float(np.clip(v / vmax, -1, 1))
    if t >= 0:
        return lerp_color(C_ZERO, C_BLUE, t)
    return lerp_color(C_ZERO, C_RED, -t)


def weight_color(w: float):
    return C_BLUE if w >= 0 else C_RED


# ---------------------------------------------------------------- background search
def search_bg_yuv(rgb=(248, 249, 250), span=(8, 7, 7)):
    """Brute-force the 8-bit yuv420p triple whose ffmpeg decode is closest to ``rgb``.

    Every candidate fills one 16x16 block of a 1920x1080 raw frame; ffmpeg converts it to PNG the
    same way build.py extracts check frames, and the block centres are compared with ``rgb``.
    """
    import itertools
    import subprocess
    import tempfile
    from pathlib import Path

    from PIL import Image

    tgt = np.array(rgb, float)
    y0 = 16 + (65.481 * tgt[0] + 128.553 * tgt[1] + 24.966 * tgt[2]) / 255
    u0 = 128 + (-37.797 * tgt[0] - 74.203 * tgt[1] + 112.0 * tgt[2]) / 255
    v0 = 128 + (112.0 * tgt[0] - 93.786 * tgt[1] - 18.214 * tgt[2]) / 255
    cands = list(itertools.product(*[range(int(c) - s, int(c) + s + 1)
                                     for c, s in zip((y0, u0, v0), span)]))
    W, H, B = 1920, 1080, 16
    cols = W // B
    assert len(cands) <= cols * (H // B)
    Yp = np.full((H, W), 16, np.uint8)
    Up = np.full((H // 2, W // 2), 128, np.uint8)
    Vp = np.full((H // 2, W // 2), 128, np.uint8)
    for k, (y, u, v) in enumerate(cands):
        r, c = divmod(k, cols)
        Yp[r * B:(r + 1) * B, c * B:(c + 1) * B] = y
        Up[r * B // 2:(r + 1) * B // 2, c * B // 2:(c + 1) * B // 2] = u
        Vp[r * B // 2:(r + 1) * B // 2, c * B // 2:(c + 1) * B // 2] = v
    with tempfile.TemporaryDirectory() as d:
        raw, png = Path(d) / "c.yuv", Path(d) / "c.png"
        raw.write_bytes(Yp.tobytes() + Up.tobytes() + Vp.tobytes())
        subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-f", "rawvideo",
                        "-pix_fmt", "yuv420p", "-s", f"{W}x{H}", "-i", str(raw), "-frames:v", "1",
                        str(png)], check=True)
        im = np.asarray(Image.open(png).convert("RGB")).astype(int)
    best = None
    for k, cand in enumerate(cands):
        r, c = divmod(k, cols)
        dec = im[r * B + B // 2, c * B + B // 2]
        d2 = float(np.sum((dec - tgt) ** 2))
        if best is None or d2 < best[0]:
            best = (d2, cand, tuple(int(x) for x in dec))
    return best[1], best[2]


if __name__ == "__main__":
    yuv, dec = search_bg_yuv()
    print(f"#F8F9FA -> yuv {yuv} -> ffmpeg decodes to {dec}")
    assert yuv == _BG_YUV and dec == BG_DECODED, (yuv, dec)
