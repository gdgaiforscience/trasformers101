"""Render + package a manim clip for the deck.

usage: python build.py <name> [--scene SceneName] [--skip-render] [--frames N] [--bg {dark,light}]

  * renders  src/manim/<name>.py  (scene class defaults to CamelCase of name minus the m0X_ prefix)
  * re-encodes to assets/video/<name>.mp4 (libx264, yuv420p, crf 21, faststart, no audio)
  * writes the poster assets/poster/<name>.jpg from the final (summary) frame
  * extracts check frames into src/manim/_media/check/<name>/ and verifies the background pixel
    (--bg dark, the default: #0f1115 clips built on common.py; --bg light: #F8F9FA clips built on
    common_light.py)
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent  # state_of_ai/
MEDIA = HERE / "_media"
PY = "/usr/local/google/home/butterworthnat/miniforge3/envs/gdg/bin/python"
BG = (15, 17, 21)
# 8-bit 4:2:0 YUV cannot represent #0f1115 exactly; common.py encodes it as the closest
# triple, which ffmpeg decodes to (15,16,21).
BG_DECODED = (15, 16, 21)


def run(cmd, **kw):
    print("+", " ".join(str(c) for c in cmd), flush=True)
    return subprocess.run(cmd, check=True, stdin=subprocess.DEVNULL, **kw)


def probe_duration(p: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(p)],
        check=True, capture_output=True, text=True).stdout
    return float(json.loads(out)["format"]["duration"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("name")
    ap.add_argument("--scene", default=None)
    ap.add_argument("--skip-render", action="store_true")
    ap.add_argument("--frames", type=int, default=8)
    ap.add_argument("--quality", default="h")
    ap.add_argument("--bg", choices=["dark", "light"], default="dark")
    args = ap.parse_args()
    # light clips (common_light.py): #F8F9FA, which ffmpeg decodes to (248,250,250), the nearest 8-bit YUV value
    bg, bg_dec, bg_name = ((248, 249, 250), (248, 250, 250), "#F8F9FA") if args.bg == "light" else (BG, BG_DECODED, "#0f1115")

    name = args.name
    scene = args.scene or "".join(w.capitalize() for w in name.split("_")[1:])
    src = HERE / f"{name}.py"
    if not args.skip_render:
        run([PY, "-m", "manim", "render", f"-q{args.quality}", "--frame_rate", "30",
             "--disable_caching", "--media_dir", str(MEDIA), str(src), scene], cwd=HERE)
    res = {"h": "1080p30", "m": "720p30", "l": "480p30"}[args.quality]
    raw = MEDIA / "videos" / name / res / f"{scene}.mp4"
    assert raw.exists(), raw

    out = ROOT / "assets" / "video" / f"{name}.mp4"
    poster = ROOT / "assets" / "poster" / f"{name}.jpg"
    out.parent.mkdir(parents=True, exist_ok=True)
    poster.parent.mkdir(parents=True, exist_ok=True)
    if args.quality == "h":
        run(["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-i", str(raw), "-an", "-c:v", "libx264",
             "-pix_fmt", "yuv420p", "-crf", "21", "-movflags", "+faststart", str(out)])
        src_for_frames = out
    else:
        src_for_frames = raw

    dur = probe_duration(src_for_frames)
    if args.quality == "h":
        run(["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-ss", f"{max(dur - 0.25, 0):.3f}", "-i",
             str(out), "-frames:v", "1", "-q:v", "2", str(poster)])

    chk = MEDIA / "check" / name
    chk.mkdir(parents=True, exist_ok=True)
    for f in chk.glob("*.png"):
        f.unlink()
    n = args.frames
    times = [dur * (i + 0.5) / n for i in range(n)] + [max(dur - 0.1, 0)]
    for i, t in enumerate(times):
        run(["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-ss", f"{t:.3f}", "-i", str(src_for_frames),
             "-frames:v", "1", str(chk / f"f{i:02d}_{t:05.1f}s.png")])

    from PIL import Image
    bad = []
    for f in sorted(chk.glob("*.png")):
        im = Image.open(f).convert("RGB")
        w, h = im.size
        px = [im.getpixel((2, 2)), im.getpixel((w - 3, 2)), im.getpixel((2, h - 3)),
              im.getpixel((w - 3, h - 3))]
        if any(p not in (bg, bg_dec) for p in px):
            bad.append((f.name, px))
    print(f"\n{name}: duration {dur:.2f}s, size {src_for_frames.stat().st_size/1e6:.2f} MB")
    print("background check:", "OK (decodes to %s, nearest 8-bit YUV value to %s)" % (bg_dec, bg_name) if not bad else f"corner pixels not pure background in {len(bad)} frame(s): {bad[:3]}")
    print("check frames in", chk)


if __name__ == "__main__":
    sys.exit(main())
