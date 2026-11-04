# 自动控制原理 · 复习手册

《自动控制原理》（胡寿松、姜斌、张绍杰，第八版）的系统复习资料。单文件 HTML：公式、插图、脚本全部内联，双击即可打开，离线可用，可直接打印成 PDF。

> 本仓库为个人学习整理的笔记，非教材替代品。教材与习题版权归原作者及出版社所有。

## 特性

| 项目 | 说明 |
|---|---|
| 内容 | 11 章正文 + 8 个附录，21 个章节，正文约 29 万字 |
| 公式 | 2716 个，MathJax 3 离线渲染（SVG 输出），缩放不失真 |
| 插图 | 12 张矢量图（知识地图、结构图、根轨迹、Bode、Nyquist、相平面等），点击放大 |
| 交互 | 8 个可操作控件 + 4 个计算器（详见下） |
| 前置知识 | 9 个章首「预备知识」折叠盒（复数、ODE、辐角、dB、阻抗、z 变换、傅里叶、线代、变分） |
| 体积 | `index.html` 约 4.0 MB（含 2 MB MathJax，无外部依赖） |
| 打印 | 134 页 PDF 版式，交互控件自动隐藏，表格跨页重复表头 |

### 交互控件

| 位置 | 操作 | 输出 |
|---|---|---|
| 3.3 二阶系统 | 在 s 平面拖动极点 | ζ、ωₙ、σ%、tᵣ、tₚ、tₛ 与阶跃响应 |
| 3.6 稳态误差 | 点 3×3 表格 | 0 / 常数 / ∞ 的判断依据 |
| 4.4 根轨迹 | 拖 K* | 闭环极点位置与闭环响应 |
| 5.4 奈奎斯特 | 拖 K | 曲线缩放、负实轴交点、包围圈数 |
| 5.5 Bode | 拖 K | L(ω)、ω_c、γ、K_g 与稳定性结论 |
| 6.2 校正装置 | 切超前/滞后，调 a、T | 校正器 Bode、φ_m、ω_m |
| 7.4 离散系统 | 调 K、T | z 极点是否出单位圆、采样响应 |
| 8.3 相平面 | 点击初始点 | RK4 轨迹与奇点类型 |

「交互实验室」另有四个计算器：二阶指标、一阶指标、开环频域裕度、劳斯判据（含首列 0 与全零行处理）。

## 使用

直接打开 `index.html` 即可，无需服务器、无需联网。

重新构建：

```bash
python build.py
```

构建脚本会把 `src/*.html` 按文件名顺序拼接，替换 `<!--FIG:name-->` 为 `assets/fig-name.svg`，转义公式中的 `< > &`，再注入 CSS、JS 与 MathJax，输出单文件 `index.html`。

导出 PDF（Windows，Edge）：

```bash
msedge --headless --disable-gpu \
  --print-to-pdf="自动控制原理复习手册.pdf" --no-pdf-header-footer \
  --virtual-time-budget=40000 "file:///<绝对路径>/index.html"
```

`--virtual-time-budget` 必须给足，否则 MathJax 未排完就打印，公式位置会留白。

## 目录结构

```
.
├── index.html              # 构建产物（单文件，可直接分发）
├── build.py                # 构建脚本
├── gen_figs_ch3.py         # 第 3 章插图（matplotlib → SVG）
├── gen_figs_ch45.py        # 第 4–5 章插图
├── gen_figs_ch8.py         # 第 8 章插图
├── gen_fig_case.py         # 第 11 章案例插图
├── src/
│   ├── style.css           # 全部样式（含 @media print）
│   ├── app.js              # 目录、搜索、进度、实验室
│   ├── widgets.js          # 8 个交互控件 + 图片放大
│   ├── 00-hero.html        # 封面与使用指南
│   ├── 00b-lab.html        # 交互实验室
│   ├── 01.html … 09c-ch11.html
│   └── 10-appA.html … 17-appH.html
├── assets/
│   ├── mathjax-tex-svg.js  # MathJax 3（离线，2 MB）
│   └── fig-*.svg           # 12 张矢量插图
└── docs/
    └── zhihu-article.md    # 制作方法（知乎文章原稿）
```

## 二次开发

- **改内容**：编辑 `src/` 下对应章节，然后 `python build.py`。一章一个文件，避免在 4 MB 的单文件里改字。
- **加图**：把 SVG 放到 `assets/fig-xxx.svg`，正文写 `<!--FIG:xxx-->` 占位。
- **加控件**：在 `src/widgets.js` 里按现有模式注册，选择器约定为 `.figx[data-widget="名称"]`。
- **改版式**：`src/style.css`；打印规则集中在文件末尾的 `@media print`。

三个易踩的坑：

1. 公式里不要手写 `&lt;`、`&gt;`，会与构建脚本的转义叠加成 `&amp;lt;`，MathJax 报 `Misplaced &`。写原始 `<`、`>` 即可。
2. CSS 用 `figure > svg` 而不是 `figure svg`，否则 MathJax 生成的公式 SVG 会被拉成整行宽。
3. 克隆 `figure` 做点击放大时，先把内部 `mjx-container` 换成纯文本，否则 `<use>` 引用失效，公式变空白。

## 声明

- 代码（`build.py`、`src/*.js`、`src/style.css`）采用 MIT 许可。
- 文字内容为个人依据课堂笔记与教材整理的复习提纲，公式与定理本身属于公共知识；例题与习题的原始版权归教材作者及出版社。如有侵权，请联系删除。
- 仅供学习交流，请勿用于商业用途。

## License

MIT (code) · 内容版权归原作者，转载注明出处。
