# -*- coding: utf-8 -*-
"""根轨迹与频域插图（数值计算）"""
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
})
BLUE, ORANGE, GREEN, PURPLE, RED = "#1d4ed8", "#d97706", "#0f766e", "#7c3aed", "#dc2626"


def save(fig, name):
    fig.savefig(os.path.join(OUT, "fig-%s.svg" % name), format="svg", bbox_inches="tight", pad_inches=0.08)
    plt.close(fig)
    print("saved", name)


# ---------- 图 4-1 根轨迹 ----------
def rootlocus():
    Ks = np.concatenate([np.linspace(0, 6, 400), np.geomspace(6.01, 3000, 1400)])
    fig, ax = plt.subplots(figsize=(6.6, 4.6))
    for K in Ks:
        r = np.roots([1, 3, 2, K])
        for x in r:
            ax.plot(x.real, x.imag, ".", ms=1.7, color=BLUE, alpha=.75)
    # 渐近线
    for ang in (60, 180, 300):
        a = np.deg2rad(ang)
        ax.plot([-1, -1 + 3.2 * np.cos(a)], [0, 3.2 * np.sin(a)], ls=(0, (5, 4)), color="#94a3b8", lw=1)
    # 极点与分离点
    ax.plot([0, -1, -2], [0, 0, 0], "x", ms=9, mew=2, color=RED, zorder=5)
    ax.plot([-0.4226], [0], "o", ms=6, mfc="white", mec=ORANGE, mew=1.8, zorder=6)
    ax.annotate("分离点 $d=-0.422$\n$K^*=0.385$", xy=(-0.4226, 0), xytext=(-3.0, 1.35),
                fontsize=9.5, color=ORANGE, arrowprops=dict(arrowstyle="->", color=ORANGE, lw=1))
    ax.plot([0, 0], [-1.414, 1.414], "o", ms=5, mfc="white", mec=GREEN, mew=1.6, zorder=6)
    ax.annotate("$\\pm\\mathrm{j}\\sqrt{2}$\n$K^*=6$", xy=(0, 1.414), xytext=(0.5, 1.75), fontsize=9.5, color=GREEN,
                arrowprops=dict(arrowstyle="->", color=GREEN, lw=1))
    ax.axhline(0, color="#94a3b8", lw=1)
    ax.axvline(0, color="#475569", lw=1.1)
    ax.set_xlim(-4.2, 1.6)
    ax.set_ylim(-3.2, 3.2)
    ax.set_xlabel("实轴 $\\sigma$")
    ax.set_ylabel("虚轴 $\\mathrm{j}\\omega$")
    ax.set_title("$G(s)=\\dfrac{K^*}{s(s+1)(s+2)}$ 的根轨迹", fontsize=12, color="#0f172a", pad=10)
    ax.text(-4.0, 2.6, "× 开环极点\n○ 分离点/临界点", fontsize=9, color="#64748b")
    save(fig, "rootlocus")


# ---------- 图 5-1 Bode ----------
def bode():
    w = np.logspace(-1, 3, 2000)
    s = 1j * w
    G = 10 / (s * (0.1 * s + 1) * (0.01 * s + 1))
    mag = 20 * np.log10(np.abs(G))
    ph = np.angle(G, deg=True)
    ph = np.where(ph > 0, ph - 360, ph)
    wc, wg = 7.85, 31.62
    fig, (a1, a2) = plt.subplots(2, 1, figsize=(7.6, 5.6), sharex=True, gridspec_kw={"height_ratios": [1.15, 1], "hspace": 0.12})
    a1.semilogx(w, mag, color=BLUE, lw=1.9)
    a1.axvline(wc, color=ORANGE, ls=":", lw=1.2)
    a1.plot([wc], [0], "o", color=ORANGE, ms=6, zorder=5)
    a1.annotate("$\\omega_c=7.85$\n$L=0\\,\\mathrm{dB}$", xy=(wc, 0), xytext=(9, 13), fontsize=9.5, color=ORANGE,
                arrowprops=dict(arrowstyle="->", color=ORANGE, lw=1))
    a1.annotate("$-20\\,\\mathrm{dB/dec}$", xy=(0.5, 26), fontsize=9.5, color="#64748b")
    a1.annotate("$-40$", xy=(16, -22), fontsize=9.5, color="#64748b")
    a1.annotate("$-60$", xy=(130, -60), fontsize=9.5, color="#64748b")
    for xt in (10, 100):
        a1.axvline(xt, color="#e2e8f0", lw=0.9)
    a1.set_ylabel("$L(\\omega)/\\mathrm{dB}$")
    a1.set_ylim(-80, 45)
    a1.set_title("$G(s)=\\dfrac{10}{s(0.1s+1)(0.01s+1)}$ 的 Bode 图", fontsize=12, color="#0f172a", pad=10)

    a2.semilogx(w, ph, color=GREEN, lw=1.9)
    a2.axhline(-180, color="#94a3b8", ls="--", lw=1)
    a2.axvline(wg, color=PURPLE, ls=":", lw=1.2)
    a2.plot([wg], [-180], "o", color=PURPLE, ms=6, zorder=5)
    a2.annotate("$\\omega_g=31.6$\n$\\varphi=-180°$", xy=(wg, -180), xytext=(45, -140), fontsize=9.5, color=PURPLE,
                arrowprops=dict(arrowstyle="->", color=PURPLE, lw=1))
    a2.annotate("相位裕度 $\\gamma=47.4°$", xy=(wc, ph[np.argmin(np.abs(w - wc))]), xytext=(1.2, -95),
                fontsize=9.5, color=ORANGE, arrowprops=dict(arrowstyle="->", color=ORANGE, lw=1))
    a2.set_ylabel("$\\varphi(\\omega)/(°)$")
    a2.set_xlabel("$\\omega/(\\mathrm{rad/s})$")
    a2.set_ylim(-280, -60)
    a2.set_yticks([-270, -180, -90])
    save(fig, "bode")


# ---------- 图 5-2 Nyquist ----------
def nyquist():
    w = np.logspace(-2, 3, 4000)
    s = 1j * w
    G = 10 / (s * (0.1 * s + 1) * (0.01 * s + 1))
    fig, ax = plt.subplots(figsize=(6.2, 4.4))
    ax.plot(G.real, G.imag, color=BLUE, lw=1.8, label="$\\omega:0^+\\to+\\infty$")
    ax.plot(G.real, -G.imag, color=BLUE, lw=1.1, ls=(0, (4, 3)), alpha=.65, label="镜像（$\\omega<0$）")
    ax.plot([-1], [0], "x", ms=10, mew=2.2, color=RED, zorder=6)
    ax.annotate("$(-1,\\mathrm{j}0)$", xy=(-1, 0), xytext=(-2.1, 0.55), fontsize=10, color=RED,
                arrowprops=dict(arrowstyle="->", color=RED, lw=1))
    i0 = int(np.argmin(np.abs(G.imag + 6.2)))
    ax.annotate("$\\omega\\to0^+$ 时\n$|G|\\to\\infty$（沿负虚轴）", xy=(G.real[i0], G.imag[i0]), xytext=(-2.35, -5.2),
                fontsize=9.5, color="#64748b", arrowprops=dict(arrowstyle="->", color="#94a3b8", lw=1))
    ax.axhline(0, color="#94a3b8", lw=1)
    ax.axvline(0, color="#94a3b8", lw=1)
    ax.set_xlim(-2.7, 1.2)
    ax.set_ylim(-7.0, 1.3)
    ax.set_xlabel("实部")
    ax.set_ylabel("虚部")
    ax.set_title("开环幅相特性（Nyquist 图）", fontsize=12, color="#0f172a", pad=10)
    ax.legend(frameon=False, fontsize=9, loc="upper right")
    ax.text(-2.55, -6.55, "曲线不包围 $(-1,\\mathrm{j}0)$：$N=0$，$P=0\\Rightarrow Z=0$，闭环稳定", fontsize=9, color=GREEN)
    save(fig, "nyquist")


if __name__ == "__main__":
    rootlocus()
    bode()
    nyquist()
