"""Render every on-slide equation to SVG with real LaTeX (latex -> dvisvgm).

Colours follow docs/DESIGN.md: weights YELLOW, inputs BLUE, bias TEAL, loss RED,
gradients GREEN, learning rate ORANGE, attention PURPLE. Glyphs are converted to
paths (--no-fonts) so the SVGs need no fonts. Each SVG gets a pixel size of
PX_PER_PT * its natural size, so glyphs look the same size across all equations.

Usage: python src/equations/build_equations.py
"""
import pathlib
import re
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "eq"
PX_PER_PT = 4.0          # 10pt LaTeX -> ~40px glyphs on the 1920x1080 stage

PREAMBLE = r"""
\documentclass[border=1pt]{standalone}
\usepackage{amsmath,amssymb,bm}
\usepackage{xcolor}
\definecolor{cW}{HTML}{C98400}\definecolor{cX}{HTML}{1A73E8}\definecolor{cB}{HTML}{00897B}
\definecolor{cL}{HTML}{D93025}\definecolor{cG}{HTML}{1E8E3E}\definecolor{cE}{HTML}{E65100}
\definecolor{cA}{HTML}{9334E6}\definecolor{cT}{HTML}{202124}\definecolor{cM}{HTML}{5F6368}
\definecolor{cP}{HTML}{D01884}
\newcommand{\cw}[1]{\textcolor{cW}{#1}}\newcommand{\cx}[1]{\textcolor{cX}{#1}}
\newcommand{\cb}[1]{\textcolor{cB}{#1}}\newcommand{\cl}[1]{\textcolor{cL}{#1}}
\newcommand{\cg}[1]{\textcolor{cG}{#1}}\newcommand{\ce}[1]{\textcolor{cE}{#1}}
\newcommand{\ca}[1]{\textcolor{cA}{#1}}\newcommand{\cm}[1]{\textcolor{cM}{#1}}
\newcommand{\cp}[1]{\textcolor{cP}{#1}}
\begin{document}\color{cT}
"""

EQS = {
    # --- neurons & layers ---
    "neuron": r"$\hat{y} = \sigma\big(\cw{w_1}\,\cx{x_1} + \cw{w_2}\,\cx{x_2} + \cb{b}\big)$",
    "neuron_vec": r"$\hat{y} = \sigma\big(\cw{\mathbf{w}}\cdot\cx{\mathbf{x}} + \cb{b}\big)$",
    "sigmoid": r"$\sigma(z) = \dfrac{1}{1+e^{-z}}$",
    "relu": r"$\mathrm{ReLU}(z) = \max(0,\,z)$",
    "layer": r"$\mathbf{a} = \sigma\big(\cw{W}\,\cx{\mathbf{x}} + \cb{\mathbf{b}}\big)$",
    "layer_entry": r"$a_i = \sigma\Big(\textstyle\sum_j \cw{W_{ij}}\,\cx{x_j} + \cb{b_i}\Big)$",
    "deep": r"$\hat{y} = f_3\big(f_2(f_1(\cx{\mathbf{x}}))\big),\qquad f_\ell(\mathbf{h}) = \tanh\big(\cw{W_\ell}\,\mathbf{h} + \cb{\mathbf{b}_\ell}\big)$",
    "warp": r"$\cx{\mathbf{x}}' = \tanh\big(\cw{W}\,\cx{\mathbf{x}} + \cb{\mathbf{b}}\big)$",
    "collapse": r"$\cw{W_2}(\cw{W_1}\cx{\mathbf{x}}) = (\cw{W_2 W_1})\,\cx{\mathbf{x}} = \cw{W'}\cx{\mathbf{x}}$",
    # --- learning ---
    "mse": r"$\cl{L}(\cw{w},\cb{b}) = \dfrac{1}{N}\displaystyle\sum_{i=1}^{N}\big(\underbrace{\cw{w}\,\cx{x_i} + \cb{b}}_{\text{prediction}} - y_i\big)^2$",
    "gd": r"$\cw{w} \;\leftarrow\; \cw{w} - \ce{\eta}\,\cg{\dfrac{\partial \cl{L}}{\partial \cw{w}}}$",
    "gd_vec": r"$\boldsymbol{\theta} \;\leftarrow\; \boldsymbol{\theta} - \ce{\eta}\,\cg{\nabla_{\!\boldsymbol{\theta}}}\,\cl{L}$",
    "chain": r"$\cg{\dfrac{\partial \cl{L}}{\partial \cw{w}}} = \cg{\dfrac{\partial \cl{L}}{\partial \hat{y}}}\cdot\cg{\dfrac{\partial \hat{y}}{\partial z}}\cdot\cg{\dfrac{\partial z}{\partial \cw{w}}}$",
    "bce": r"$\cl{L} = -\big[\,y\log\hat{y} + (1-y)\log(1-\hat{y})\,\big]$",
    "kepler": r"$T^2 \propto a^3 \quad\Longleftrightarrow\quad \log T = \tfrac{3}{2}\,\log a$",
    "line": r"$\hat{y} = \cw{w}\,\cx{x} + \cb{b}$",
    # --- language models ---
    "softmax": r"$p_i = \dfrac{e^{\,z_i/\ce{T}}}{\sum_j e^{\,z_j/\ce{T}}}$",
    "attention": r"$\mathrm{Attention}(Q,K,V) = \mathrm{softmax}\!\left(\dfrac{\ca{Q}\,\ca{K}^{\top}}{\sqrt{d_k}}\right)\cx{V}$",
    "qkv": r"$\ca{Q} = X\cw{W_Q},\qquad \ca{K} = X\cw{W_K},\qquad \cx{V} = X\cw{W_V}$",
    "xent": r"$\cl{L} = -\log p_{\cw{\theta}}(\text{true next token}\mid\text{context})$",
    "lm": r"$p(\text{text}) = \displaystyle\prod_{t} p\big(x_t \mid x_1,\dots,x_{t-1}\big)$",
    "embed": r"$\text{token id} \;\longmapsto\; \mathbf{e} = E[\text{id}] \in \mathbb{R}^{640}$",
    "image_tensor": r"$\text{image} \in \mathbb{R}^{H \times W \times 3}$",
    # --- scale ---
    "compute": r"$C \;\approx\; 6\,N\,D$",
    "scaling": r"$\cl{L}(N, D) = E + \dfrac{A}{N^{\alpha}} + \dfrac{B}{D^{\beta}}$",
}


def render(name: str, body: str, workdir: pathlib.Path) -> None:
    tex = workdir / f"{name}.tex"
    tex.write_text(PREAMBLE + body + "\n\\end{document}\n")
    r = subprocess.run(["latex", "-interaction=nonstopmode", "-halt-on-error", tex.name],
                       cwd=workdir, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"LaTeX failed for {name}:\n{r.stdout[-1500:]}")
    svg = workdir / f"{name}.svg"
    subprocess.run(["dvisvgm", "--no-fonts", "--exact-bbox", "-o", svg.name, f"{name}.dvi"],
                   cwd=workdir, capture_output=True, check=True)
    s = svg.read_text()
    m = re.search(r"width='([\d.]+)pt' height='([\d.]+)pt'", s)
    w_pt, h_pt = float(m.group(1)), float(m.group(2))
    s = s.replace(m.group(0), f"width='{w_pt * PX_PER_PT:.1f}' height='{h_pt * PX_PER_PT:.1f}'", 1)
    (OUT / f"{name}.svg").write_text(s)
    print(f"{name:14s} {w_pt * PX_PER_PT:7.1f} x {h_pt * PX_PER_PT:6.1f} px")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as d:
        for name, body in EQS.items():
            render(name, body, pathlib.Path(d))


if __name__ == "__main__":
    main()
