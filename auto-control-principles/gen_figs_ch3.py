# -*- coding: utf-8 -*-
"""生成复习手册所需的矢量插图（数值计算，保证图形与理论一致）"""
import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyArrowPatch
import matplotlib.font_manager as fm

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
plt.rcParams.update({
    "font.sans-serif": ["Microsoft YaHei", "SimHei", "DejaVu Sans"],
    "axes.unicode_minus": False,
    "svg.fonttype": "path",
    "font.size": 10.5,
    "axes.edgecolor": "#94a3b8",
    "axes.labelcolor": "#334155",
    "xtick.color": "#475569",
    "ytick.color": "#475569",
    "axes.grid": True,
    "grid.color": "#e6ebf3",
    "grid.linewidth": 0.9,
    "figure.facecolor": "white",
    "axes.facecolor": "white",
    "savefig.facecolor": "white",
})
BLUE, ORANGE, GREEN, PURPLE, RED = "#1d4ed8", "#d97706", "#0f766e", "#7c3aed", "#dc2626"


def save(fig, name):
    p = os.path.join(OUT, "fig-%s.svg" % name)
    fig.savefig(p, format="svg", bbox_inches="tight", pad_inches=0.08)
    plt.close(fig)
    print("saved", p)


# ---------- 图 3-1 极点分布 ----------
def polemap():
    fig, ax = plt.subplots(figsize=(6.8, 5.6))
    th = np.linspace(0, 2 * np.pi, 400)
    ax.plot(np.cos(th), np.sin(th), color="#cbd5e1", lw=1.2, ls=(0, (4, 3)))
    ax.axhline(0, color="#94a3b8", lw=1.1)
    ax.axvline(0, color="#94a3b8", lw=1.1)
    for z, c in [(0.2, ORANGE), (0.5, BLUE), (0.707, GREEN)]:
        ang = np.arccos(z)
        ax.plot([0, -np.cos(ang)], [0, np.sin(ang)], color=c, lw=1.0, alpha=.6, ls=":")
        ax.plot([0, -np.cos(ang)], [0, -np.sin(ang)], color=c, lw=1.0, alpha=.6, ls=":")
        ax.plot([-z, -z], [-np.sqrt(1 - z**2), np.sqrt(1 - z**2)], "o", ms=8,
                mfc=c, mec="white", mew=1.4, zorder=5, label=r"$\zeta=%.3g$" % z)
    # beta 角标注
    ax.annotate("", xy=(-0.42, 0.30), xytext=(-0.86, 0.03),
                arrowprops=dict(arrowstyle="->", color="#64748b", lw=1.1, connectionstyle="arc3,rad=0.28"))
    ax.text(-1.62, 0.44, r"$\beta=\arccos\zeta$", fontsize=11, color="#475569")
    ax.annotate("", xy=(-0.5, -0.866), xytext=(-0.5, 0),
                arrowprops=dict(arrowstyle="<->", color="#94a3b8", lw=1.0))
    ax.text(-0.44, -0.52, r"$\omega_d$", fontsize=10.5, color="#475569")
    ax.annotate("", xy=(0.0, 0.0), xytext=(-0.5, 0.0),
                arrowprops=dict(arrowstyle="<->", color="#94a3b8", lw=1.0))
    ax.text(-0.40, 0.07, r"$\zeta\omega_n$", fontsize=10.5, color="#475569")
    ax.text(-1.72, 0.92, "等阻尼线（射线）", fontsize=9.5, color="#94a3b8")
    ax.text(0.30, 0.80, "单位圆\n$\omega_n=1$", fontsize=9.5, color="#94a3b8", ha="center")
    ax.set_xlim(-1.85, 0.85)
    ax.set_ylim(-1.18, 1.18)
    ax.set_aspect("equal")
    ax.set_xlabel("实轴 $\\sigma$")
    ax.set_ylabel("虚轴 $\\mathrm{j}\\omega$")
    ax.legend(frameon=False, loc="lower right", fontsize=10)
    ax.set_title("二阶系统极点位置与阻尼比的关系", fontsize=12, color="#0f172a", pad=10)
    save(fig, "polemap")


# ---------- 图 3-2 二阶阶跃响应 ----------
def step2():
    fig, ax = plt.subplots(figsize=(7.4, 3.9))
    t = np.linspace(0, 14, 1200)
    for z, c, lab in [(0.2, ORANGE, r"$\zeta=0.2$"), (0.4, PURPLE, r"$\zeta=0.4$"),
                      (0.707, BLUE, r"$\zeta=0.707$"), (1.0, GREEN, r"$\zeta=1$")]:
        if z < 1:
            wd = np.sqrt(1 - z**2)
            b = np.arccos(z)
            y = 1 - np.exp(-z * t) / wd * np.sin(wd * t + b)
        else:
            y = 1 - np.exp(-t) * (1 + t)
        ax.plot(t, y, color=c, lw=1.9, label=lab)
    ax.axhline(1, color="#94a3b8", lw=1, ls="--")
    ax.fill_between([0, 14], 0.95, 1.05, color="#0f766e", alpha=.06)
    ax.text(13.7, 1.07, r"$\pm5\%$ 误差带", fontsize=9.5, color=GREEN, ha="right")
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 1.75)
    ax.set_xlabel("$\\omega_n t$")
    ax.set_ylabel("$c(t)$")
    ax.legend(frameon=False, loc="upper right", fontsize=10)
    ax.set_title("二阶系统单位阶跃响应（$\\omega_n=1$）", fontsize=12, color="#0f172a", pad=10)
    save(fig, "step2")


# ---------- 图 3-3 sigma-zeta ----------
def zetasigma():
    fig, ax = plt.subplots(figsize=(6.2, 3.6))
    z = np.linspace(0.05, 1.0, 400)
    s = np.exp(-np.pi * z / np.sqrt(1 - z**2)) * 100
    ax.plot(z, s, color=BLUE, lw=2)
    for zz, lab in [(0.4, "25.4%"), (0.5, "16.3%"), (0.707, "4.3%")]:
        v = np.exp(-np.pi * zz / np.sqrt(1 - zz**2)) * 100
        ax.plot([zz], [v], "o", color=ORANGE, ms=6, zorder=5)
        ax.annotate(lab, xy=(zz, v), xytext=(zz + 0.03, v + 6), fontsize=9.5, color=ORANGE)
        ax.vlines(zz, 0, v, color=ORANGE, lw=.8, ls=":")
    ax.set_xlabel(r"阻尼比 $\zeta$")
    ax.set_ylabel(r"超调量 $\sigma\%$")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 100)
    ax.set_title(r"$\sigma\%=\mathrm{e}^{-\pi\zeta/\sqrt{1-\zeta^2}}$：超调量只由 $\zeta$ 决定", fontsize=11.5, color="#0f172a", pad=10)
    save(fig, "zetasigma")


if __name__ == "__main__":
    polemap()
    step2()
    zetasigma()
