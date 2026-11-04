"""Loss landscape + gradient-descent-with-momentum path (shared by b03 and a tuning plot).

Pure numpy so it can run inside Blender's Python and in the gdg env.
"""
import numpy as np

# minima (negative Gaussians) and hills (positive Gaussians): (cx, cy, amplitude, sigma)
WELLS = [
    (1.9, -1.4, 3.0, 1.55),     # global minimum
    (-2.3, 2.1, 1.55, 0.95),    # local minimum on the descent path
    (-0.6, -3.7, 1.25, 0.85),   # local minimum
    (3.7, 2.9, 1.35, 1.0),      # local minimum
]
HILLS = [
    (-3.6, -1.2, 1.35, 1.35),
    (0.6, 3.6, 1.0, 1.25),
    (4.6, -3.9, 0.9, 1.1),
    (-4.8, 4.6, 0.8, 1.3),
]
BOWL = 0.028


def loss(x, y):
    x = np.asarray(x, dtype=float)
    y = np.asarray(y, dtype=float)
    z = BOWL * (x * x + y * y)
    for cx, cy, a, s in WELLS:
        z = z - a * np.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * s * s))
    for cx, cy, a, s in HILLS:
        z = z + a * np.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * s * s))
    return z


def grad(x, y):
    gx = 2 * BOWL * x
    gy = 2 * BOWL * y
    for cx, cy, a, s in WELLS:
        e = a * np.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * s * s)) / (s * s)
        gx = gx + e * (x - cx)
        gy = gy + e * (y - cy)
    for cx, cy, a, s in HILLS:
        e = a * np.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * s * s)) / (s * s)
        gx = gx - e * (x - cx)
        gy = gy - e * (y - cy)
    return gx, gy


def descend(p0=(-4.6, 0.0), lr=0.035, beta0=0.96, beta1=0.72, k0=105, k1=150, steps=420):
    """Heavy-ball momentum: v <- beta v - lr grad; p <- p + v.

    beta is annealed from beta0 to beta1 between iterations k0 and k1 (a standard momentum
    schedule) so the ball swings through a local basin, then settles in the global minimum.
    """
    p = np.array(p0, dtype=float)
    v = np.zeros(2)
    path = [p.copy()]
    for k in range(steps):
        beta = beta0 if k < k0 else (beta1 if k > k1 else beta0 + (beta1 - beta0) * (k - k0) / (k1 - k0))
        g = np.array(grad(p[0], p[1]))
        v = beta * v - lr * g
        p = p + v
        path.append(p.copy())
    return np.array(path)


if __name__ == '__main__':
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import sys
    xs = np.linspace(-7, 7, 300)
    X, Y = np.meshgrid(xs, xs)
    Z = loss(X, Y)
    P = descend()
    zp = loss(P[:, 0], P[:, 1])
    print('z range', Z.min(), Z.max(), 'path end', P[-1], 'loss end', zp[-1])
    print('global min approx', np.unravel_index(Z.argmin(), Z.shape), X.flat[Z.argmin()], Y.flat[Z.argmin()])
    fig, ax = plt.subplots(figsize=(7, 7))
    ax.contourf(X, Y, Z, 40, cmap='viridis')
    ax.contour(X, Y, Z, 20, colors='k', linewidths=0.4)
    ax.plot(P[:, 0], P[:, 1], 'r.-', ms=2, lw=0.8)
    ax.set_aspect('equal')
    fig.savefig(sys.argv[1] if len(sys.argv) > 1 else 'landscape.png', dpi=80)
