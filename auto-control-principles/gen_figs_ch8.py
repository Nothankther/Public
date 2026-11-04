# -*- coding: utf-8 -*-
"""非线性章节插图：相平面与描述函数"""
import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
plt.rcParams.update({
    "font.sans-serif": ["Microsoft YaHei", "SimHei", "DejaVu Sans"],
    "axes.unicode_minus": False, "svg.fonttype": "path", "font.size": 10.5,
    "axes.edgecolor": "#94a3b8", "axes.labelcolor": "#334155",
    "xtick.color": "#475569", "ytick.color": "#475569",
    "axes.grid": True, "grid.color": "#e6ebf3", "grid.linewidth": 0.9,
    "figure.facecolor": "white", "axes.facecolor": "white",
})
BLUE, ORANGE, GREEN, PURPLE, RED = "#1d4ed8", "#d97706", "#0f766e", "#7c3aed", "#dc2626"


def save(fig, name):
    fig.savefig(os.path.join(OUT, "fig-%s.svg" % name), format="svg", bbox_inches="tight", pad_inches=0.08)
    plt.close(fig)
    print("saved", name)


# 相平面：三种奇点
def phase():
    fig, axes = plt.subplots(1, 3, figsize=(9.6, 3.4))
    grid = np.linspace(-2, 2, 21)
    X, Y = np.meshgrid(grid, grid)

    cases = [
        (r"中心点：$\ddot x+x=0$", lambda x, y: y, lambda x, y: -x, BLUE),
        (r"稳定焦点：$\ddot x+\dot x+x=0$", lambda x, y: y, lambda x, y: -x - y, GREEN),
        (r"鞍点：$\ddot x-x=0$", lambda x, y: y, lambda x, y: x, RED),
    ]
    for ax, (title, fx, fy, col) in zip(axes, cases):
        U, V = fx(X, Y), fy(X, Y)
        N = np.hypot(U, V)
        ax.streamplot(X, Y, U, V, color=col, linewidth=1.0, density=1.15, arrowsize=0.9)
        ax.plot([0], [0], "o", ms=7, mfc="white", mec=col, mew=1.8, zorder=5)
        ax.axhline(0, color="#cbd5e1", lw=.9)
        ax.axvline(0, color="#cbd5e1", lw=.9)
        ax.set_xlim(-2.1, 2.1)
        ax.set_ylim(-2.1, 2.1)
        ax.set_xlabel("$x$")
        ax.set_ylabel("$\\dot x$")
        ax.set_title(title, fontsize=10.5, color="#0f172a")
    fig.suptitle("二阶系统相轨迹与奇点类型", fontsize=12, color="#0f172a", y=1.02)
    save(fig, "phase")


# 描述函数：G(jw) 与 -1/N(A)
def describing():
    fig, ax = plt.subplots(figsize=(6.6, 4.3))
    w = np.logspace(-1, 2, 3000)
    s = 1j * w
    G = 10 / (s * (s + 1) * (s + 2))
    ax.plot(G.real, G.imag, color=BLUE, lw=1.9, label="$G(\\mathrm{j}\\omega)$")
    # 理想继电特性 -1/N = -pi A/(4M)
    A = np.linspace(0.05, 3.2, 200)
    ax.plot(-np.pi * A / 4, np.zeros_like(A), color=RED, lw=1.6, label="$-1/N(A)$（理想继电）")
    ax.plot([-1.667], [0], "o", ms=7, mfc="white", mec=ORANGE, mew=2, zorder=6)
    ax.annotate("自振点\n$A=2.12,\\ \\omega=1.41$", xy=(-1.667, 0), xytext=(-1.55, 0.55), fontsize=9.5, color=ORANGE,
                arrowprops=dict(arrowstyle="->", color=ORANGE, lw=1))
    ax.annotate("$A$ 增大", xy=(-2.0, 0), xytext=(-2.55, -0.55), fontsize=9.5, color=RED,
                arrowprops=dict(arrowstyle="->", color=RED, lw=1))
    ax.axhline(0, color="#94a3b8", lw=1)
    ax.axvline(0, color="#94a3b8", lw=1)
    ax.set_xlim(-3.2, 2.0)
    ax.set_ylim(-2.2, 1.4)
    ax.set_xlabel("实部")
    ax.set_ylabel("虚部")
    ax.legend(frameon=False, fontsize=9, loc="upper right")
    ax.set_title("描述函数法：$G(\\mathrm{j}\\omega)$ 与 $-1/N(A)$ 的交点即自振点", fontsize=11, color="#0f172a", pad=10)
    save(fig, "describing")


if __name__ == "__main__":
    phase()
    describing()
