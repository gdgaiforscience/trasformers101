"""Small classic datasets for the deck: iris.js, kepler.js, hopper.js, eeg.js.

Run:  python src/python/make_small_data.py
All inputs are offline (sklearn / matplotlib bundled sample data, plus the
NASA Planetary Fact Sheet values transcribed below).
"""
import os
import shutil

import numpy as np

from common import IMG_DIR, rnd, write_js

MPL_SAMPLE = None


def mpl_sample_path(name):
    import matplotlib
    return os.path.join(matplotlib.get_data_path(), "sample_data", name)


# --------------------------------------------------------------------------
def make_iris():
    from sklearn.datasets import load_iris
    ds = load_iris()
    X, y = ds.data, ds.target
    rows = [[*map(float, X[i]), int(y[i])] for i in range(len(y))]
    obj = {
        "features": ["sepal length (cm)", "sepal width (cm)",
                     "petal length (cm)", "petal width (cm)"],
        "featureKeys": ["sepalLength", "sepalWidth", "petalLength",
                        "petalWidth"],
        "species": [str(s) for s in ds.target_names],  # setosa, versicolor, virginica
        "rows": rows,  # [sepalLength, sepalWidth, petalLength, petalWidth, speciesIndex]
        "n": len(rows),
        "source": ("Fisher (1936) iris data as bundled with scikit-learn "
                   "(sklearn.datasets.load_iris; sklearn fixed two points to "
                   "match Fisher's paper, same as R's iris)."),
        "license": "Public domain data; scikit-learn is BSD-3-Clause.",
    }
    write_js("iris", rnd(obj, 2), "iris.js")


# --------------------------------------------------------------------------
# NASA Planetary Fact Sheet (metric), D. R. Williams, NASA NSSDCA:
# https://nssdc.gsfc.nasa.gov/planetary/factsheet/
# Rows "Distance from Sun (10^6 km)" and "Orbital Period (days)".
# NOTE: transcribed, not re-fetched at build time (network fetch was not
# permitted); spot-check against the page before the talk.
KEPLER_SHEET = [
    # name,     distance 1e6 km, period days
    ("Mercury", 57.9, 88.0),
    ("Venus", 108.2, 224.7),
    ("Earth", 149.6, 365.2),
    ("Mars", 228.0, 687.0),
    ("Jupiter", 778.5, 4331.0),
    ("Saturn", 1432.0, 10747.0),
    ("Uranus", 2867.0, 30589.0),
    ("Neptune", 4515.0, 59800.0),
]


def make_kepler():
    d_e = KEPLER_SHEET[2][1]
    t_e = KEPLER_SHEET[2][2]
    planets = []
    for name, d, t in KEPLER_SHEET:
        a = d / d_e
        T = t / t_e
        planets.append({
            "name": name,
            "a": round(a, 4),          # semi-major axis, AU (Earth = 1)
            "T": round(T, 4),          # orbital period, years (Earth = 1)
            "distance_1e6km": d,       # as printed on the fact sheet
            "period_days": t,          # as printed on the fact sheet
            "T2_over_a3": round(T * T / (a ** 3), 4),
        })
    la = np.log10([p["a"] for p in planets])
    lt = np.log10([p["T"] for p in planets])
    slope, icpt = np.polyfit(la, lt, 1)
    obj = {
        "planets": planets,
        "units": {"a": "AU", "T": "years"},
        "fit": {"log10T_vs_log10a_slope": round(float(slope), 4),
                "intercept": round(float(icpt), 4),
                "note": "Least-squares line in log-log space; Kepler's third law predicts slope 1.5."},
        "conversion": ("a = distance / 149.6e6 km and T = period / 365.2 d, "
                       "i.e. ratios to Earth's values on the same sheet."),
        "source": ("NASA Planetary Fact Sheet (metric), D. R. Williams, NASA "
                   "NSSDCA, https://nssdc.gsfc.nasa.gov/planetary/factsheet/ ; "
                   "rows 'Distance from Sun' and 'Orbital Period'."),
        "caveat": ("Values transcribed from the fact sheet (not re-fetched at "
                   "build time). The sheet's periods are tropical periods, so "
                   "T^2/a^3 deviates from 1 by up to ~2.5% (Neptune)."),
        "license": "US Government work (public domain).",
    }
    write_js("kepler", obj, "kepler.js")
    print("kepler slope", slope)


# --------------------------------------------------------------------------
def make_hopper(width=64):
    from PIL import Image
    src = mpl_sample_path("grace_hopper.jpg")
    os.makedirs(IMG_DIR, exist_ok=True)
    dst = os.path.join(IMG_DIR, "grace_hopper.jpg")
    shutil.copyfile(src, dst)
    im = Image.open(src).convert("RGB")
    W, H = im.size
    height = int(round(H * width / W))
    small = im.resize((width, height), Image.BOX)  # area average
    arr = np.asarray(small, dtype=np.uint8)
    gray = np.round(0.299 * arr[..., 0] + 0.587 * arr[..., 1]
                    + 0.114 * arr[..., 2]).astype(int)
    obj = {
        "src": "assets/img/grace_hopper.jpg",
        "origWidth": W,
        "origHeight": H,
        "width": width,
        "height": height,
        "rgb": arr.reshape(-1).tolist(),  # row-major, [r,g,b, r,g,b, ...]
        "gray": gray.reshape(-1).tolist(),  # row-major luma (Rec. 601)
        "layout": "rgb[(row*width + col)*3 + channel], channel 0=R 1=G 2=B; values 0-255",
        "source": ("matplotlib sample data grace_hopper.jpg (JPEG comment: "
                   "'File source: http://commons.wikimedia.org/wiki/File:Grace_Hopper.jpg')."),
        "license": "Public domain (U.S. Navy photograph of Rear Admiral Grace M. Hopper).",
    }
    write_js("hopper", obj, "hopper.js")


# --------------------------------------------------------------------------
def make_eeg():
    src = mpl_sample_path("eeg.dat")
    data = np.fromfile(src, dtype=float).reshape((800, 4))  # as in matplotlib's example
    rate = 80.0  # matplotlib example: t = 10 * arange(800) / 800  (800 samples over 10 s)
    obj = {
        "channels": ["PG3", "PG5", "PG7", "PG9"],
        "rateHz": rate,
        "nSamples": int(data.shape[0]),
        "durationS": float(data.shape[0] / rate),
        "data": [rnd(data[:, c], 3) for c in range(data.shape[1])],  # data[channel][sample]
        "units": "standardised amplitude (each channel has mean 0, s.d. 1 in the file)",
        "source": ("matplotlib sample data eeg.dat, read exactly as in matplotlib's "
                   "'MRI with EEG' gallery example (float64, 800 samples x 4 channels)."),
        "caveat": ("The sampling rate (80 Hz) and channel labels (PG3, PG5, PG7, PG9) "
                   "come from that example (it plots the 800 samples over 10 s); the "
                   "original recording's provenance is not documented."),
        "license": "matplotlib sample data (matplotlib licence, PSF/BSD-style).",
    }
    write_js("eeg", obj, "eeg.js")


if __name__ == "__main__":
    make_iris()
    make_kepler()
    make_hopper()
    make_eeg()
