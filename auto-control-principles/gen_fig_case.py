# -*- coding: utf-8 -*-
"""图 11-1：直流电机位置伺服校正前后阶跃响应"""
import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

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
BLUE, ORANGE, GREEN = "#1d4ed8", "#d97706", "#0f766e"


def step2(t, z, w):
    wd = w * np.sqrt(1 - z * z)
    b = np.arccos(z)
    return 1 - np.exp(-z * w * t) / np.sqrt(1 - z * z) * np.sin(wd * t + b)


fig, ax = plt.subplots(figsize=(7.2, 4.4))
t = np.linspace(0, 7.2, 1200)
y1 = step2(t, 0.1581, np.sqrt(10))
y2 = step2(t, 0.5, 10)
ax.axhspan(0.95, 1.05, color=GREEN, alpha=0.08, lw=0)
ax.axhline(1, color="#94a3b8", lw=1, ls=(0, (5, 4)))
ax.plot(t, y1, color=ORANGE, lw=2.0, label=r"校正前：$\sigma\%=60.4\%,\ t_s\approx7.0\,$s")
ax.plot(t, y2, color=BLUE, lw=2.2, label=r"校正后：$\sigma\%=16.3\%,\ t_s\approx0.7\,$s")
ax.plot([1.0], [np.max(y1)], "o", ms=5, mfc="white", mec=ORANGE, mew=1.6)
ax.annotate("峰值 1.60（t=1.0 s）", xy=(1.0, np.max(y1)), xytext=(1.45, 1.55), fontsize=9.5, color=ORANGE,
            arrowprops=dict(arrowstyle="->", color="#d97706", lw=1))
ax.plot([0.36], [np.max(y2)], "o", ms=5, mfc="white", mec=BLUE, mew=1.6)
ax.annotate("峰值 1.16（t=0.36 s）", xy=(0.36, np.max(y2)), xytext=(0.75, 1.30), fontsize=9.5, color=BLUE,
            arrowprops=dict(arrowstyle="->", color=BLUE, lw=1))
ax.set_xlabel("t / s")
ax.set_ylabel("c(t)")
ax.set_xlim(0, 7.2)
ax.set_ylim(0, 1.78)
ax.set_title("位置伺服系统校正前后的单位阶跃响应", fontsize=12, color="#0f172a", pad=10)
ax.legend(frameon=False, loc="upper right", fontsize=10)
fig.tight_layout()
p = os.path.join(OUT, "fig-case.svg")
fig.savefig(p, format="svg", bbox_inches="tight", pad_inches=0.08)
plt.close(fig)
print("saved", p)
