# 用 HTML 做两份专业课复习手册：自动控制原理与虚拟仪器技术的工程做法

## 一、先定约束，再选工具

做这两份资料前，我给自己定了三条硬指标：

1. **公式必须排对**。自动控制原理一份资料里有约 2700 个公式，Word 公式编辑器在几十页之后开始拖慢、错位；截图公式则无法搜索、无法缩放。
2. **图必须清楚**。Bode 图、根轨迹、Nyquist 曲线、相平面，以及 LabVIEW 的前面板与程序框图，都要能放大看细节。
3. **必须能打印**。考前还是要落到纸上，分页、表头、图注都得可控。

按这三条排除：Word（长文档公式与分页不可控）、PDF（交互为零、改一个数要重导）、笔记软件（离线与打印都勉强）、LaTeX（排版最强，但学习成本高，且仍然没有交互）。

最终选型是**单文件 HTML**：样式、脚本、公式引擎、矢量图全部内联在一个文件里。双击能开，发给别人能开，断网能开，浏览器里能打印。

## 二、技术栈：四件东西，没有框架

| 用途 | 选择 | 说明 |
|---|---|---|
| 页面 | 原生 HTML / CSS / JS | 不引框架、不引 npm、无打包器 |
| 公式 | MathJax 3（tex-svg） | 2 MB，内联进 HTML，离线渲染 |
| 插图 | matplotlib → SVG | 矢量、可内联、可用 CSS 控制 |
| 构建 | Python 脚本，约 120 行 | 拼接片段、内联 SVG、转义公式 |
| 打印 | Edge headless | 一条命令导出 PDF |

整个项目没有 `node_modules`，没有构建工具链。唯一需要跑的命令是 `python build.py`。

## 三、目录结构：一章一个片段

```
复习资料/
├── src/
│   ├── style.css          # 全部样式
│   ├── app.js             # 目录、搜索、进度
│   ├── 01.html … 17-appH.html   # 每章一个片段
├── assets/
│   ├── mathjax-tex-svg.js
│   └── fig-*.svg
├── build.py
└── index.html             # 唯一产物，约 4 MB
```

不直接写单文件，原因很实际：4 MB 的文件在编辑器里改一个错别字都要卡两秒。分片后每章 10–30 KB，改哪章开哪个文件。代价是多一步构建，而构建只要一秒。

`build.py` 只做四件事：

```python
# 1. 按文件名顺序拼接所有片段
body = '\n'.join(read(f) for f in sorted(glob.glob('src/*.html')))

# 2. 把 <!--FIG:name--> 占位符替换成内联 SVG
body = re.sub(r'<!--FIG:([\w\-]+)-->', fig_sub, body)

# 3. 转义公式里的 < > &（否则会被 HTML 解析器当标签）
body = re.sub(r'\$\$[\s\S]*?\$\$', esc_math, body)
body = re.sub(r'\$[^$\n]*?\$', esc_math, body)

# 4. 把 CSS、JS、MathJax 全部注入模板
html = TEMPLATE.replace('%(css)s', css).replace('%(body)s', body) \
               .replace('%(js)s', js).replace('%(mathjax)s', mathjax)
```

## 四、公式：MathJax 离线的四个细节

**第一，只开 SVG 输出。** `tex-svg.js` 把公式渲染成 SVG 路径，不依赖字体文件，打印、缩放、复制到别处都不会变形。CommonHTML 输出依赖网页字体，打印时容易错位。

**第二，注意三个兼容性坑。**

- `\boldsymbol`、`\mathbb` 在默认组件里不可用，会直接导致整页排版中断。改用 `\mathbf`；`\mathbb` 需要额外加载扩展包。
- 公式里的 `<`、`>` 会被 HTML 解析器当成标签起始。必须在构建时统一转义。**但不要在源文件里手写 `&lt;`**——它会被二次转义成 `&amp;lt;`，MathJax 报 `Misplaced &`，而且错误信息不会告诉你是哪一行。
- CSS 里写 `figure svg { width:100% }`，会把 MathJax 生成的公式 SVG 一起拉伸成整行宽。改成 `figure > svg`，只作用于插图。

**第三，排版时机影响搜索。** 搜索索引必须在 MathJax 排版完成后建立，否则摘要里出现的是 `$\omega_c$` 而不是 ωc。做法是首次搜索时惰性建索引，而不是在 `DOMContentLoaded` 时建。

**第四，公式多的页面首屏会慢。** 2700 个公式的排版约 2 秒。这个成本可以接受，但不要试图用 `requestIdleCallback` 分批排版——MathJax 的内部状态不支持并发，分批反而更慢。

## 五、插图：matplotlib 出 SVG，图注交给 MathJax

- `svg.fonttype = 'path'`：把字形转成路径，换一台没有装 Matplotlib 字体的机器也不会缺字。代价是每个 SVG 自带一份 glyph 定义，多图内联时会出现重复的 `id`；但只要图形相同，浏览器取第一个，显示不受影响。
- 图注里的公式不要烤进图片。图注用 HTML 写，公式交给 MathJax，这样缩放、搜索、改字号都正常。
- 点击放大：克隆 `figure` 节点时，必须把内部的 `mjx-container` 替换成纯文本。否则 MathJax 的 `<use>` 引用脱离原文档后失效，放大层里的公式会变成空白，并把后面的内容挤出可视区。

## 六、交互：不引框架，手写八个控件

自动控制原理有个天然优势：每个知识点都能写成“参数 → 曲线”的函数。于是做了八个控件，全部用原生 JS 加手写 SVG，没有 D3，没有图表库：

| 控件 | 操作 | 实时输出 |
|---|---|---|
| 二阶系统极点 | 在 s 平面拖动极点 | ζ、ωn、σ%、tr、tp、ts 与阶跃响应 |
| 根轨迹 | 拖 K* | 三个闭环极点位置与闭环响应 |
| 奈奎斯特 | 拖 K | 曲线缩放、负实轴交点、包围圈数 |
| Bode | 拖 K | L(ω)、ωc、γ、Kg 与稳定性结论 |
| 校正装置 | 切超前/滞后，调 a、T | 校正器 Bode、φm、ωm |
| 离散系统 | 调 K、T | z 极点是否出单位圆、采样响应 |
| 相平面 | 点击初始点 | RK4 积分轨迹与奇点类型 |
| 稳态误差 | 点 3×3 表格 | 0／常数／∞ 的判断依据 |

核心逻辑不过三十行，以极点拖动为例：

```js
function onDrag(e) {
  const p = toPlane(e);                 // 屏幕坐标 → s 平面
  const sigma = -p.x, wd = Math.abs(p.y);
  const wn = Math.hypot(sigma, wd);
  const zeta = wn > 0 ? sigma / wn : 0;
  const Mp = zeta < 1 ? 100 * Math.exp(-Math.PI * zeta / Math.sqrt(1 - zeta * zeta)) : 0;
  renderPole(sigma, wd);                // 只重绘 s 平面
  renderStep(zeta, wn);                 // 只重绘响应曲线
  updateReadout({ zeta, wn, Mp });      // 只改文字节点
}
```

三条原则：所有计算在本地完成；参数变化只重绘本控件内的 SVG，不重建 DOM；控件在 `@media print` 里整体隐藏，打印版不留空白。

## 七、打印：一份 CSS，一条命令

打印样式解决四件事：

```css
@media print {
  #sidebar, .toolbar, .figx { display: none !important; }  /* 隐藏导航与交互 */
  .box, figure, table.tbl tr { break-inside: avoid; }      /* 块内不分页 */
  table.tbl thead { display: table-header-group; }         /* 跨页重复表头 */
  details > .bd { display: block !important; }             /* 折叠内容强制展开 */
}
```

最后一条值得单独说：折叠的例题解答如果在打印时没展开，PDF 里就是空的。CSS 无法改变 `<details>` 的 `open` 状态，但可以对内容元素强制 `display:block`，Chrome/Edge 会照此渲染。同时在 `beforeprint` 事件里把所有 `details` 打开，双保险。

导出命令：

```bash
msedge --headless --disable-gpu \
  --print-to-pdf="复习手册.pdf" --no-pdf-header-footer \
  --virtual-time-budget=40000 "file:///…/index.html"
```

`--virtual-time-budget` 要给够，MathJax 没排完就打印，公式位置会是空白。当前这份 21 章、约 29 万字、2700 个公式的资料，导出为 134 页 PDF，公式与插图全部保持矢量。

## 八、两门课的差异

同一套思路用在两门课上，成本结构完全不同。

**自动控制原理**：公式密集。主要工作量在公式与数值的正确性，每个交互控件都要拿教材例题对数值——ζ=0.5、ωn=2 时 σ% 必须是 16.3%，K=10 时 γ 必须是 47.4°，根轨迹临界增益必须是 6。算错一个数，整页的可信度就没了。

**虚拟仪器技术**：以 LabVIEW 为主，知识单元是前面板、程序框图、函数选板、数据流。公式很少，MathJax 几乎用不上；主要工作量在图的整理与主线设计——把十几个课件的零散知识点压成一条链：数据类型 → 程序结构 → 数组/簇/波形 → 文件 → 图表 → 数据采集 → 仪器总线。交互的重点也不是数值计算，而是流程演示。

两者共用的骨架是每章固定的六件套：知识框架、公式或图集、典型例题、易错清单、自测题、交叉索引。结构固定，读者才知道在哪能找到什么。

## 九、踩过的坑

| 现象 | 原因 | 处理 |
|---|---|---|
| 整页公式不渲染 | 用了 `\boldsymbol`、`\mathbb` | 改 `\mathbf`，或加载扩展 |
| 公式后半段消失 | 公式里的 `<` 被当标签 | 构建时统一转义 |
| 报 `Misplaced &` | 源文件里预写了 `&lt;`，被二次转义 | 公式内只写原始字符 |
| 图注公式被拉成整行 | `figure svg` 命中了 MathJax | 改 `figure > svg` |
| 放大层里公式空白 | 克隆节点后 `<use>` 失效 | 克隆前转纯文本 |
| 打印缺解答 | `<details>` 未展开 | CSS 强制显示 + `beforeprint` |
| 搜索摘要出现 LaTeX 源码 | 索引建得太早 | 首次搜索时惰性建索引 |
| PDF 公式错位 | 打印时 MathJax 未排完 | 加大 `virtual-time-budget` |

## 十、取舍

这套做法不通用，边界要说清楚。

**适合**：个人或小团队的课程复习资料、讲义、实验指导。要求离线、可打印、公式多、需要一点交互。

**不适合**：多人协作编辑（单文件无法合并）、需要权限与版本管理的团队文档（用 GitBook 或 Docusaurus）、内容需要频繁按数据库更新的场景。

**成本**：单文件 4 MB，首屏排版约 2 秒；改内容必须重跑构建；交互控件的数值都需要人工核对，这是最耗时的部分。

**收益**：零依赖、可离线、可打印、可搜索、可交互。一份文件发给同学，双击就能用，不用装任何东西。

工具的选择应该由“读者在什么场景下用它”决定。这份资料的读者在考前两周，可能在图书馆没网、可能只有手机、最后一定要打印——单文件 HTML 是同时满足这三条的少数方案之一。
