"""protein.js: green fluorescent protein (PDB 1EMA) as a C-alpha trace.

Input (no network at run time): src/python/_cache/1ema_ca_modelserver.cif, the
RCSB PDB ModelServer CA-only mmCIF of 1EMA (fetched once at build time):
  https://models.rcsb.org/v1/1ema/atoms?label_atom_id=CA&encoding=cif&copy_all_categories=false
It contains every C-alpha atom (atom_site) plus the deposited secondary
structure (struct_conf = helices, struct_sheet_range = strands). A full PDB
file at src/python/_cache/1EMA.pdb is used instead if present.

Coordinates are centred on the centroid and rotated (proper rotation, no
mirroring) so the barrel's long axis is vertical (y); units are Angstrom.

Run:  python src/python/make_protein.py
"""
import os

import numpy as np

from common import CACHE_DIR, rnd, write_js

CIF = os.path.join(CACHE_DIR, "1ema_ca_modelserver.cif")
PDB = os.path.join(CACHE_DIR, "1EMA.pdb")

AA1 = {"ALA": "A", "ARG": "R", "ASN": "N", "ASP": "D", "CYS": "C", "GLN": "Q", "GLU": "E",
       "GLY": "G", "HIS": "H", "ILE": "I", "LEU": "L", "LYS": "K", "MET": "M", "MSE": "M",
       "PHE": "F", "PRO": "P", "SER": "S", "THR": "T", "TRP": "W", "TYR": "Y", "VAL": "V"}


def cif_loops(path):
    """Minimal mmCIF loop_ reader (enough for these simple, unquoted rows)."""
    loops, cur = {}, None
    with open(path) as f:
        lines = [ln.rstrip("\n") for ln in f]
    i = 0
    while i < len(lines):
        ln = lines[i].strip()
        if ln == "loop_":
            cols = []
            i += 1
            while i < len(lines) and lines[i].strip().startswith("_"):
                cols.append(lines[i].strip())
                i += 1
            cat = cols[0].split(".")[0]
            rows = []
            while i < len(lines):
                s = lines[i].strip()
                if not s or s == "#" or s.startswith("_") or s == "loop_" or s.startswith(";"):
                    break
                rows.append(s.split())
                i += 1
            loops[cat] = [dict(zip([c.split(".", 1)[1] for c in cols], r)) for r in rows]
            continue
        i += 1
    return loops


def from_cif(path):
    L = cif_loops(path)
    atoms = [a for a in L["_atom_site"] if a["label_atom_id"] == "CA"]
    res = []
    for a in atoms:
        res.append({
            "num": int(a["auth_seq_id"]), "label": int(a["label_seq_id"]),
            "name": a["auth_comp_id"], "xyz": [float(a["Cartn_x"]), float(a["Cartn_y"]), float(a["Cartn_z"])],
            "b": float(a["B_iso_or_equiv"]),
        })
    helices = [{"id": h["id"], "start": int(h["beg_auth_seq_id"]), "end": int(h["end_auth_seq_id"])}
               for h in L.get("_struct_conf", []) if h["conf_type_id"].upper().startswith("HELX")]
    strands = [{"id": f"{s['sheet_id']}{s['id']}", "start": int(s["beg_auth_seq_id"]), "end": int(s["end_auth_seq_id"])}
               for s in L.get("_struct_sheet_range", [])]
    return res, helices, strands


def from_pdb(path):
    res, helices, strands = [], [], []
    with open(path) as f:
        for ln in f:
            rec = ln[:6]
            if rec in ("ATOM  ", "HETATM") and ln[12:16].strip() == "CA" and ln[21] == "A" and ln[16] in " A":
                res.append({"num": int(ln[22:26]), "label": None, "name": ln[17:20].strip(),
                            "xyz": [float(ln[30:38]), float(ln[38:46]), float(ln[46:54])],
                            "b": float(ln[60:66])})
            elif rec == "HELIX ":
                helices.append({"id": ln[11:14].strip(), "start": int(ln[21:25]), "end": int(ln[33:37])})
            elif rec == "SHEET ":
                strands.append({"id": ln[11:14].strip() + ln[7:10].strip(), "start": int(ln[22:26]),
                                "end": int(ln[33:37])})
    return res, helices, strands


def main():
    if os.path.exists(PDB):
        res, helices, strands = from_pdb(PDB)
        src_note = "full PDB file 1EMA.pdb"
    else:
        res, helices, strands = from_cif(CIF)
        src_note = "RCSB ModelServer CA-only mmCIF of 1EMA"
    X = np.array([r["xyz"] for r in res])
    c = X.mean(0)
    Y = X - c
    # Principal axes; longest axis -> y. Keep a proper rotation (det = +1).
    evals, evecs = np.linalg.eigh(np.cov(Y.T))
    order = np.argsort(evals)[::-1]
    a1, a2 = evecs[:, order[0]], evecs[:, order[1]]
    a3 = np.cross(a1, a2)  # right-handed frame
    R = np.stack([a2, a1, a3])  # rows: new x, y (long axis), z
    if np.linalg.det(R) < 0:
        R[2] *= -1
    Z = Y @ R.T

    nums = [r["num"] for r in res]
    ss = []
    for n in nums:
        s = "C"
        for h in helices:
            if h["start"] <= n <= h["end"]:
                s = "H"
        for st in strands:
            if st["start"] <= n <= st["end"]:
                s = "E"
        ss.append(s)
    breaks = [i for i in range(1, len(nums)) if nums[i] - nums[i - 1] != 1]
    # The chromophore (CRO, auth 66 = Ser65-Tyr66-Gly67 cyclised) has no atom named CA,
    # so it is absent from a CA-only trace. Approximate its position by the midpoint of
    # the flanking residues' C-alphas (Phe64, Val68).
    i64, i68 = nums.index(64), nums.index(68)
    chromo = (Z[i64] + Z[i68]) / 2
    radius = float(np.max(np.linalg.norm(Z, axis=1)))

    obj = {
        "pdb": "1EMA",
        "name": "Green fluorescent protein (GFP)",
        "organism": "Aequorea victoria (jellyfish)",
        "method": "X-ray diffraction",
        "citation": "Orm\u00f6 M, Cubitt AB, Kallio K, Gross LA, Tsien RY, Remington SJ (1996) Science 273:1392-1395",
        "nResidues": len(res),
        "ca": rnd(Z, 2),  # [[x,y,z], ...] Angstrom, centred, long axis = y
        "resNum": nums,  # author numbering (standard GFP numbering)
        "resName": [r["name"] for r in res],
        "seq": "".join(AA1.get(r["name"], "X") for r in res),
        "ss": "".join(ss),  # H helix, E strand, C coil (deposited assignments)
        "bFactor": rnd([r["b"] for r in res], 1),
        "helices": helices,
        "strands": strands,
        "chainBreaks": breaks,  # index i where residue i does not follow residue i-1
        "chromophore": {"name": "CRO (Ser65-Tyr66-Gly67 cyclised)", "approxPos": rnd(chromo, 2),
                        "note": "approximate: midpoint of the C-alphas of Phe64 and Val68 (CRO has no atom named CA)"},
        "radius": round(radius, 2),
        "units": "Angstrom",
        "frame": "centred on the C-alpha centroid; principal axes with the longest (barrel axis) along y; proper rotation (no mirroring)",
        "notes": [
            "Residues 2-229 are resolved; the N-terminal Met and residues 230-238 are not in the model.",
            "MSE = selenomethionine (Se-Met used for phasing), shown as M in seq.",
            "The 11 beta-strands form the famous 'beta-can' barrel around the central chromophore.",
        ],
        "source": f"RCSB Protein Data Bank entry 1EMA ({src_note}); https://www.rcsb.org/structure/1EMA",
        "license": "PDB data are public domain (CC0 1.0), https://www.rcsb.org/pages/usage-policy",
    }
    write_js("protein", obj, "protein.js")
    print("residues", len(res), "helices", len(helices), "strands", len(strands), "breaks", breaks,
          "radius", radius, "ss counts", {k: obj["ss"].count(k) for k in "HEC"})


if __name__ == "__main__":
    main()
