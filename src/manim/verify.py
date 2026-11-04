"""Verify packaged clips: stream properties, size, and the dominant (background) pixel colour."""
import json
import subprocess
import sys
from collections import Counter
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
names = sys.argv[1:] or ["m01_neuron", "m02_layer_matrix", "m03_grid_warp", "m04_gradient_descent",
                         "m05_backprop", "m06_softmax", "m07_attention"]
tmp = Path(__file__).resolve().parent / "_media" / "check" / "verify"
tmp.mkdir(parents=True, exist_ok=True)
for n in names:
    v = ROOT / "assets" / "video" / f"{n}.mp4"
    p = ROOT / "assets" / "poster" / f"{n}.jpg"
    c = ROOT / "assets" / "video" / f"{n}.cues.json"
    if not v.exists():
        print(n, "MISSING")
        continue
    info = json.loads(subprocess.run(
        ["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(v)],
        capture_output=True, text=True, check=True).stdout)
    vs = [s for s in info["streams"] if s["codec_type"] == "video"][0]
    n_audio = sum(1 for s in info["streams"] if s["codec_type"] == "audio")
    dur = float(info["format"]["duration"])
    png = tmp / f"{n}_last.png"
    subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-ss", f"{dur - 0.2:.2f}", "-i",
                    str(v), "-frames:v", "1", str(png)], check=True, stdin=subprocess.DEVNULL)
    im = Image.open(png).convert("RGB")
    common = Counter(im.getdata()).most_common(2)
    pim = Image.open(p) if p.exists() else None
    cues = json.loads(c.read_text()) if c.exists() else None
    print(f"{n}: {vs['codec_name']} {vs.get('profile')} {vs['pix_fmt']} {vs['width']}x{vs['height']} "
          f"{vs['r_frame_rate']} fps, {dur:.2f}s, {v.stat().st_size / 1e6:.2f} MB, audio streams={n_audio}, "
          f"faststart={'moov' in open(v, 'rb').read(64).decode('latin1') or 'n/a'}")
    print(f"   dominant pixels (last frame): {common}")
    print(f"   poster: {pim.size if pim else 'MISSING'} {p.stat().st_size / 1e3:.0f} kB" if pim else "   poster MISSING")
    print(f"   cues: {len(cues) if cues else 'MISSING'} entries, last t={cues[-1]['t'] if cues else '-'}")
