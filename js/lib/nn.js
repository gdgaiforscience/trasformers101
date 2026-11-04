/* =====================================================================
   Inside the Black Box — a tiny neural-network engine for live demos
   MLP with tanh/ReLU hidden layers, sigmoid output, binary cross-entropy,
   backprop + Adam. Plus 2D toy datasets. Exposes window.NN
   ===================================================================== */
(function (root) {
  'use strict';

  function makeRng(seed) {
    let s = (seed >>> 0) || 1;
    const r = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    r.normal = () => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    return r;
  }

  class MLP {
    constructor(sizes, opts) {
      opts = opts || {};
      this.sizes = sizes.slice();
      this.act = opts.act || 'tanh';
      this.L = sizes.length - 1;
      const r = makeRng(opts.seed || 7);
      this.W = []; this.b = [];
      for (let l = 0; l < this.L; l++) {
        const nin = sizes[l], nout = sizes[l + 1];
        const sc = (this.act === 'relu' && l < this.L - 1) ? Math.sqrt(2 / nin) : Math.sqrt(1 / nin);
        const W = new Float64Array(nout * nin);
        for (let i = 0; i < W.length; i++) W[i] = r.normal() * sc;
        this.W.push(W);
        this.b.push(new Float64Array(nout));
      }
      this.mW = this.W.map(w => new Float64Array(w.length)); this.vW = this.W.map(w => new Float64Array(w.length));
      this.mb = this.b.map(v => new Float64Array(v.length)); this.vb = this.b.map(v => new Float64Array(v.length));
      this.gW = this.W.map(w => new Float64Array(w.length)); this.gb = this.b.map(v => new Float64Array(v.length));
      this.t = 0;
      // scratch buffers
      this.A = sizes.map(n => new Float64Array(n));
      this.Z = sizes.map(n => new Float64Array(n));
      this.D = sizes.map(n => new Float64Array(n));
    }
    paramCount() { let n = 0; for (let l = 0; l < this.L; l++) n += this.W[l].length + this.b[l].length; return n; }
    _f(z) { return this.act === 'relu' ? (z > 0 ? z : 0) : Math.tanh(z); }
    _df(a, z) { return this.act === 'relu' ? (z > 0 ? 1 : 0) : 1 - a * a; }
    forward(x) {
      const A = this.A, Z = this.Z;
      for (let i = 0; i < x.length; i++) A[0][i] = x[i];
      for (let l = 0; l < this.L; l++) {
        const nin = this.sizes[l], nout = this.sizes[l + 1], W = this.W[l], b = this.b[l], a = A[l], z = Z[l + 1], an = A[l + 1];
        const last = l === this.L - 1;
        for (let o = 0; o < nout; o++) {
          let s = b[o]; const off = o * nin;
          for (let i = 0; i < nin; i++) s += W[off + i] * a[i];
          z[o] = s;
          an[o] = last ? 1 / (1 + Math.exp(-s)) : this._f(s);
        }
      }
      return A[this.L][0];
    }
    predict(x) { return this.forward(x); }
    /** hidden activations of every layer for input x (copies) */
    activations(x) { this.forward(x); return this.A.map(a => Array.from(a)); }
    trainBatch(X, Y, lr, opt) {
      opt = opt || {};
      const L = this.L, n = X.length;
      for (let l = 0; l < L; l++) { this.gW[l].fill(0); this.gb[l].fill(0); }
      let loss = 0;
      for (let s = 0; s < n; s++) {
        const p = this.forward(X[s]), y = Y[s];
        const pc = Math.min(1 - 1e-7, Math.max(1e-7, p));
        loss += -(y * Math.log(pc) + (1 - y) * Math.log(1 - pc));
        this.D[L][0] = p - y;                         // dL/dz for sigmoid + BCE
        for (let l = L - 1; l >= 0; l--) {
          const nin = this.sizes[l], nout = this.sizes[l + 1], W = this.W[l], gW = this.gW[l], gb = this.gb[l];
          const d = this.D[l + 1], a = this.A[l];
          for (let o = 0; o < nout; o++) {
            const dv = d[o]; if (dv === 0) continue;
            gb[o] += dv; const off = o * nin;
            for (let i = 0; i < nin; i++) gW[off + i] += dv * a[i];
          }
          if (l > 0) {
            const dp = this.D[l], ap = this.A[l], zp = this.Z[l];
            for (let i = 0; i < nin; i++) {
              let sum = 0;
              for (let o = 0; o < nout; o++) sum += W[o * nin + i] * d[o];
              dp[i] = sum * this._df(ap[i], zp[i]);
            }
          }
        }
      }
      const l2 = opt.l2 || 0;
      this.t++;
      const b1 = 0.9, b2 = 0.999, eps = 1e-8, useAdam = opt.optimizer !== 'sgd';
      const c1 = 1 - Math.pow(b1, this.t), c2 = 1 - Math.pow(b2, this.t);
      for (let l = 0; l < L; l++) {
        const W = this.W[l], gW = this.gW[l], b = this.b[l], gb = this.gb[l];
        for (let i = 0; i < W.length; i++) {
          const g = gW[i] / n + l2 * W[i];
          if (useAdam) { this.mW[l][i] = b1 * this.mW[l][i] + (1 - b1) * g; this.vW[l][i] = b2 * this.vW[l][i] + (1 - b2) * g * g; W[i] -= lr * (this.mW[l][i] / c1) / (Math.sqrt(this.vW[l][i] / c2) + eps); }
          else W[i] -= lr * g;
        }
        for (let i = 0; i < b.length; i++) {
          const g = gb[i] / n;
          if (useAdam) { this.mb[l][i] = b1 * this.mb[l][i] + (1 - b1) * g; this.vb[l][i] = b2 * this.vb[l][i] + (1 - b2) * g * g; b[i] -= lr * (this.mb[l][i] / c1) / (Math.sqrt(this.vb[l][i] / c2) + eps); }
          else b[i] -= lr * g;
        }
      }
      return loss / n;
    }
    loss(X, Y) {
      let s = 0;
      for (let i = 0; i < X.length; i++) { const p = Math.min(1 - 1e-7, Math.max(1e-7, this.forward(X[i]))); s += -(Y[i] * Math.log(p) + (1 - Y[i]) * Math.log(1 - p)); }
      return s / X.length;
    }
    accuracy(X, Y) { let c = 0; for (let i = 0; i < X.length; i++) c += ((this.forward(X[i]) > 0.5 ? 1 : 0) === Y[i]) ? 1 : 0; return c / X.length; }
  }

  // ---------- 2D toy datasets (coordinates roughly in [-1, 1]) ----------
  const datasets = {
    circles(n, noise, seed) {
      const r = makeRng(seed || 3), out = [];
      for (let i = 0; i < n; i++) {
        const inner = i % 2 === 0, rad = inner ? r() * 0.45 : 0.65 + r() * 0.3, a = r() * Math.PI * 2;
        out.push([rad * Math.cos(a) + r.normal() * noise, rad * Math.sin(a) + r.normal() * noise, inner ? 1 : 0]);
      }
      return out;
    },
    xor(n, noise, seed) {
      const r = makeRng(seed || 5), out = [];
      for (let i = 0; i < n; i++) {
        let x = r() * 2 - 1, y = r() * 2 - 1;
        x += x > 0 ? 0.06 : -0.06; y += y > 0 ? 0.06 : -0.06;
        out.push([x + r.normal() * noise, y + r.normal() * noise, x * y > 0 ? 1 : 0]);
      }
      return out;
    },
    spiral(n, noise, seed) {
      const r = makeRng(seed || 11), out = [], m = Math.floor(n / 2);
      for (let c = 0; c < 2; c++) for (let i = 0; i < m; i++) {
        const t = i / m, rad = 0.06 + t * 0.92, a = 1.75 * t * Math.PI * 2 + c * Math.PI;
        out.push([rad * Math.cos(a) + r.normal() * noise, rad * Math.sin(a) + r.normal() * noise, c]);
      }
      return out;
    },
    moons(n, noise, seed) {
      const r = makeRng(seed || 13), out = [], m = Math.floor(n / 2);
      for (let i = 0; i < m; i++) { const a = Math.PI * (i / (m - 1)); out.push([(Math.cos(a) - 0.5) * 0.85 + r.normal() * noise, (Math.sin(a) - 0.25) * 0.85 + r.normal() * noise, 0]); }
      for (let i = 0; i < m; i++) { const a = Math.PI * (i / (m - 1)); out.push([(0.5 - Math.cos(a)) * 0.85 + r.normal() * noise, (0.25 - Math.sin(a)) * 0.85 + r.normal() * noise, 1]); }
      return out;
    },
    gauss(n, noise, seed) {
      const r = makeRng(seed || 17), out = [];
      for (let i = 0; i < n; i++) { const c = i % 2; out.push([(c ? 0.45 : -0.45) + r.normal() * (0.18 + noise), (c ? 0.4 : -0.4) + r.normal() * (0.18 + noise), c]); }
      return out;
    }
  };

  root.NN = { MLP, datasets, makeRng };
})(typeof window !== 'undefined' ? window : globalThis);
