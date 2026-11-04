"""Encode a rendered PNG sequence to the deck's H.264 spec, write the poster, and verify.

    python encode.py <clip> [--poster-frame N] [--loop] [--crf 21]

* ffmpeg: -framerate 30 -c:v libx264 -pix_fmt yuv420p -crf 21 -movflags +faststart, no audio,
  plus BT.709 matrix conversion + matrix/range tags so browsers decode the background as exactly as possible.
* If the file is > 8 MB the CRF is raised until it fits.
* Poster: assets/poster/<clip>.jpg (1920x1080) from the chosen PNG frame (4:4:4 JPEG).
* Checks: decoded corner pixels vs #0f1115, duration/resolution/size, and for loops the
  last->first frame difference compared with typical consecutive-frame differences.
"""
import argparse
import glob
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
BG = np.array([15, 17, 21])
MAX_BYTES = 8 * 1024 * 1024


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-3000:])
        raise SystemExit('command failed: ' + ' '.join(cmd))
    return r


def encode(frames_dir, out, crf, upscale=False):
    # RGB -> YUV with the BT.709 matrix, limited range, and tag matrix + range in the stream.
    # Primaries/transfer are left unspecified (ffmpeg 8 takes them from the filtered frames), so
    # browsers treat the clip as ordinary sRGB web video and match the #0f1115 slide background.
    vf = 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p'
    if upscale:
        vf = 'scale=1920:1080:flags=lanczos,' + vf
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '30', '-i', os.path.join(frames_dir, '%04d.png'),
           '-an', '-vf', vf,
           '-c:v', 'libx264', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-crf', str(crf),
           '-colorspace', 'bt709', '-color_range', 'tv',
           '-movflags', '+faststart', out]
    run(cmd)
    return os.path.getsize(out)


def probe(path):
    r = run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
             'stream=width,height,r_frame_rate,nb_frames,pix_fmt,color_space:format=duration,size',
             '-of', 'json', path])
    return json.loads(r.stdout)


def decode_frame(path, idx, tmp):
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', path, '-vf', 'select=eq(n\\,%d)' % idx, '-vframes', '1', tmp])
    return np.asarray(Image.open(tmp).convert('RGB')).astype(int)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('clip')
    ap.add_argument('--poster-frame', type=int, default=1)
    ap.add_argument('--loop', action='store_true')
    ap.add_argument('--crf', type=int, default=21)
    ap.add_argument('--frames-dir', default=None)
    a = ap.parse_args()

    frames_dir = a.frames_dir or os.path.join(HERE, '_frames', a.clip)
    pngs = sorted(glob.glob(os.path.join(frames_dir, '[0-9][0-9][0-9][0-9].png')))
    nums = [int(os.path.basename(p)[:4]) for p in pngs]
    assert nums == list(range(1, len(nums) + 1)), 'missing frames in %s' % frames_dir
    first = Image.open(pngs[0])
    print('%s: %d PNG frames, %dx%d' % (a.clip, len(pngs), first.width, first.height))

    vid_dir = os.path.join(ROOT, 'assets', 'video')
    post_dir = os.path.join(ROOT, 'assets', 'poster')
    os.makedirs(vid_dir, exist_ok=True)
    os.makedirs(post_dir, exist_ok=True)
    out = os.path.join(vid_dir, a.clip + '.mp4')
    crf = a.crf
    up = (first.width, first.height) != (1920, 1080)
    if up:
        print('  upscaling %dx%d -> 1920x1080 (lanczos)' % (first.width, first.height))
    size = encode(frames_dir, out, crf, up)
    while size > MAX_BYTES and crf < 35:
        crf += 2
        print('  %.2f MB > 8 MB, re-encoding with crf %d' % (size / 1e6, crf))
        size = encode(frames_dir, out, crf, up)

    # poster from the PNG (exact colours), 1920x1080
    im = Image.open(pngs[a.poster_frame - 1]).convert('RGB')
    if im.size != (1920, 1080):
        im = im.resize((1920, 1080), Image.LANCZOS)
    poster = os.path.join(post_dir, a.clip + '.jpg')
    im.save(poster, quality=93, subsampling=0, optimize=True)

    info = probe(out)
    st, fm = info['streams'][0], info['format']
    print('  video: %s  %sx%s  %s fps  frames=%s  %.3f s  %.2f MB  crf=%d  pix=%s  space=%s' % (
        os.path.relpath(out, ROOT), st['width'], st['height'], st['r_frame_rate'], st.get('nb_frames'),
        float(fm['duration']), int(fm['size']) / 1e6, crf, st['pix_fmt'], st.get('color_space')))
    print('  poster: %s (frame %d), %.0f KB' % (os.path.relpath(poster, ROOT), a.poster_frame,
                                             os.path.getsize(poster) / 1e3))

    # corner pixels: PNG and decoded video
    tmp = os.path.join(HERE, '_frames', '_probe_%s.png' % a.clip)
    png0 = np.asarray(Image.open(pngs[0]).convert('RGB')).astype(int)
    dec0 = decode_frame(out, 0, tmp)
    def corners(img):
        h, w = img.shape[:2]
        return [tuple(int(v) for v in img[y, x]) for y, x in ((0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1))]

    print('  PNG corners   :', corners(png0))
    print('  video corners :', corners(dec0))
    jp = np.asarray(Image.open(poster).convert('RGB')).astype(int)
    print('  poster corners:', corners(jp))

    if a.loop:
        def load(i):
            return np.asarray(Image.open(pngs[i]).convert('RGB')).astype(float)
        seam = np.abs(load(-1) - load(0)).mean()
        steps = [np.abs(load(i + 1) - load(i)).mean() for i in range(0, len(pngs) - 1, max(1, len(pngs) // 12))]
        print('  loop seam |last-first| = %.3f ; typical consecutive diffs = %.3f..%.3f (mean %.3f)' % (
            seam, min(steps), max(steps), float(np.mean(steps))))
    os.remove(tmp)


if __name__ == '__main__':
    sys.exit(main())
