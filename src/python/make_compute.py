"""compute.js: training compute of notable AI models (for the 'Why now?' slide).

Preferred source: Epoch AI's "Notable AI Models" dataset (CC BY 4.0),
https://epoch.ai/data/notable-ai-models . Save its CSV as
    src/python/_cache/epoch_notable_ai_models.csv
and re-run this script; every model with a training-compute value is exported.

FALLBACK (used when that CSV is not available, e.g. no network at build time):
a short list of models whose compute is either REPORTED in the original paper
or ESTIMATED here with C ~= 6 N D from the parameter count N and training
tokens D that the paper reports. Each row says which ("method") and cites its
source. No value is taken from memory of third-party estimates.

Run:  python src/python/make_compute.py
"""
import csv
import os
import re

from common import CACHE_DIR, write_js

EPOCH_CSV = os.path.join(CACHE_DIR, "epoch_notable_ai_models.csv")

# name, year, org, params N, tokens D, reported FLOP (or None), source
FALLBACK = [
    ("Transformer (big)", 2017, "Google", 213e6, None, 2.3e19,
     "Vaswani et al. 2017, 'Attention Is All You Need', Table 2 (training cost 2.3e19 FLOPs; 213M parameters)"),
    ("BERT-large", 2018, "Google", 340e6, 1.28e11, None,
     "Devlin et al. 2018: 340M parameters; 1,000,000 steps x 128,000 tokens/batch = 1.28e11 tokens (upper bound: "
     "90% of steps used 128-token sequences)"),
    ("GPT-3 175B", 2020, "OpenAI", 175e9, 300e9, 3.14e23,
     "Brown et al. 2020, 'Language Models are Few-Shot Learners', Table D.1 (3.14e23 FLOPs; 300B tokens)"),
    ("Gopher 280B", 2021, "DeepMind", 280e9, 300e9, 5.76e23,
     "Rae et al. 2021 (280B parameters, 300B tokens); compute budget 5.76e23 FLOPs as given by Hoffmann et al. 2022"),
    ("Chinchilla 70B", 2022, "DeepMind", 70e9, 1.4e12, 5.76e23,
     "Hoffmann et al. 2022, 'Training Compute-Optimal Large Language Models': 70B parameters, 1.4T tokens, "
     "same 5.76e23-FLOP budget as Gopher"),
    ("PaLM 540B", 2022, "Google", 540e9, 780e9, None,
     "Chowdhery et al. 2022: 540B parameters, 780B training tokens"),
    ("LLaMA 65B", 2023, "Meta", 65.2e9, 1.4e12, None,
     "Touvron et al. 2023 (LLaMA): 65.2B parameters, 1.4T tokens"),
    ("Llama 2 70B", 2023, "Meta", 70e9, 2.0e12, None,
     "Touvron et al. 2023 (Llama 2): 70B parameters, 2T tokens"),
    ("Llama 3.1 405B", 2024, "Meta", 405e9, 15.6e12, 3.8e25,
     "Llama Team 2024, 'The Llama 3 Herd of Models' (3.8e25 FLOPs; 15.6T tokens)"),
    ("DeepSeek-V3", 2024, "DeepSeek", 37e9, 14.8e12, None,
     "DeepSeek-AI 2024, DeepSeek-V3 Technical Report: 671B total / 37B activated parameters, 14.8T tokens "
     "(6ND uses the 37B activated parameters)"),
    ("Gemma 3 27B", 2025, "Google DeepMind", 27e9, 14e12, None,
     "Gemma Team 2025, Gemma 3 Technical Report: 27B model trained on 14T tokens"),
    ("Gemma 3 270M", 2025, "Google DeepMind", 268_098_176, 6e12, None,
     "Parameters counted from the keras-hub preset; 6T training tokens per the Gemma 3 270M model card "
     "(this is the model used in the talk)"),
]

# AlexNet (a CNN: 6ND does not apply) - explicit hardware-time estimate.
ALEXNET = {
    "name": "AlexNet", "year": 2012, "org": "University of Toronto",
    "gpus": 2, "days": 5.5, "peakFlopPerS": 1.581e12, "utilization": 0.33,
    "source": ("Krizhevsky, Sutskever & Hinton 2012: trained 'between five and six days on two NVIDIA GTX 580 3GB "
               "GPUs'; GTX 580 FP32 peak = 512 cores x 1.544 GHz x 2 = 1.581e12 FLOP/s (NVIDIA spec); "
               "33% utilisation is an ASSUMPTION"),
}


def fallback_rows():
    rows = []
    a = ALEXNET
    est = a["gpus"] * a["days"] * 86400 * a["peakFlopPerS"] * a["utilization"]
    rows.append({"name": a["name"], "year": a["year"], "org": a["org"], "flop": est,
                 "method": "estimate", "params": 60e6, "tokens": None,
                 "formula": "GPUs x days x 86,400 s x peak FLOP/s x utilisation = 2 x 5.5 x 86,400 x 1.581e12 x 0.33",
                 "source": a["source"] + "; 60M parameters per the paper"})
    for name, year, org, N, D, rep, src in FALLBACK:
        est = 6 * N * D if (N and D) else None
        rows.append({
            "name": name, "year": year, "org": org,
            "flop": rep if rep else est,
            "method": "reported" if rep else "6ND",
            "flop6ND": est,
            "params": N, "tokens": D,
            "source": src,
        })
    return rows


def parse_epoch(path):
    """Flexible parser for Epoch's notable-models CSV."""
    def col(header, *pats):
        for p in pats:
            for h in header:
                if re.search(p, h, re.I):
                    return h
        return None

    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        rd = csv.DictReader(f)
        H = rd.fieldnames
        c_name = col(H, r"^model$", r"^system$", r"model")
        c_date = col(H, r"publication date", r"^date")
        c_org = col(H, r"^organi[sz]ation", r"organi[sz]ation")
        c_flop = col(H, r"training compute \(FLOP\)", r"training compute")
        c_par = col(H, r"^parameters$", r"parameters")
        c_dom = col(H, r"^domain", r"domain")
        c_link = col(H, r"^link", r"link")
        for r in rd:
            try:
                flop = float(r[c_flop])
            except (TypeError, ValueError):
                continue
            date = (r.get(c_date) or "").strip()
            m = re.match(r"(\d{4})(?:-(\d{2}))?", date)
            if not m:
                continue
            year = int(m.group(1)) + ((int(m.group(2)) - 0.5) / 12 if m.group(2) else 0.5)
            try:
                par = float(r[c_par]) if c_par and r.get(c_par) else None
            except ValueError:
                par = None
            rows.append({
                "name": r[c_name].strip(), "year": round(year, 3), "date": date,
                "org": (r.get(c_org) or "").strip(), "flop": flop, "params": par,
                "domain": (r.get(c_dom) or "").strip() if c_dom else "",
                "link": (r.get(c_link) or "").strip() if c_link else "",
                "method": "Epoch AI",
            })
    rows.sort(key=lambda d: d["year"])
    return rows


def main():
    if os.path.exists(EPOCH_CSV):
        rows = parse_epoch(EPOCH_CSV)
        obj = {
            "fallback": False,
            "models": rows,
            "source": "Epoch AI, 'Notable AI Models' dataset, https://epoch.ai/data/notable-ai-models",
            "license": "CC BY 4.0 (Epoch AI)",
        }
    else:
        rows = fallback_rows()
        obj = {
            "fallback": True,
            "models": rows,
            "source": ("FALLBACK list (Epoch AI's dataset could not be fetched at build time): compute as reported "
                       "in each paper, or estimated as C = 6 N D from the paper's parameter and token counts. "
                       "See each row's 'method' and 'source'."),
            "license": "Facts from the cited publications.",
        }
    obj["formula"] = "C \u2248 6 N D  (training FLOPs \u2248 6 x parameters x training tokens)"
    obj["methods"] = {
        "reported": "training compute stated in the cited paper",
        "6ND": "estimated here as 6 x parameters x training tokens, both as stated in the cited paper",
        "estimate": "hardware-time estimate (GPUs x time x peak throughput x assumed utilisation); see 'formula'",
        "Epoch AI": "value from Epoch AI's dataset",
    }
    obj["trend"] = {
        "factorPerYear": [4, 5],
        "since": 2010,
        "desc": "Training compute of frontier AI models has grown about 4-5x per year since 2010 (Epoch AI).",
        "source": "https://epoch.ai/blog/training-compute-of-frontier-ai-models-grows-by-4-5x-per-year",
    }
    obj["units"] = {"flop": "total training FLOP", "params": "parameters", "tokens": "training tokens"}
    if rows:
        lo = min(r["flop"] for r in rows)
        hi = max(r["flop"] for r in rows)
        obj["range"] = {"minFlop": lo, "maxFlop": hi}
    write_js("compute", obj, "compute.js")
    for r in rows[-15:]:
        print(r["year"], r["name"], f"{r['flop']:.3g}", r["method"])


if __name__ == "__main__":
    main()
