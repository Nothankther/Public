# -*- coding: utf-8 -*-
"""把 src/ 下的章节片段组装成单文件 index.html（内联样式、脚本、MathJax、矢量图）"""
import os, re, glob, io

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
ASSETS = os.path.join(ROOT, 'assets')

def read(p, mode='r'):
    with io.open(p, mode, encoding=None if 'b' in mode else 'utf-8') as f:
        return f.read()

css = read(os.path.join(SRC, 'style.css'))
js = read(os.path.join(SRC, 'app.js'))
_w = os.path.join(SRC, 'widgets.js')
if os.path.exists(_w):
    js += '\n' + read(_w)

parts = []
for f in sorted(glob.glob(os.path.join(SRC, '*.html'))):
    parts.append(read(f))
body = '\n'.join(parts)

# 内联 SVG 插图
def fig_sub(m):
    name = m.group(1)
    p = os.path.join(ASSETS, 'fig-%s.svg' % name)
    if not os.path.exists(p):
        return '<!-- missing figure: %s -->' % name
    svg = read(p)
    svg = re.sub(r'<\?xml[^>]*\?>', '', svg)
    svg = svg.replace('width="100%"', '')
    return svg
body = re.sub(r'<!--FIG:([a-zA-Z0-9_\-]+)-->', fig_sub, body)

# 公式里的 < 会被浏览器当作标签起始，必须在组装前转义
def esc_math(m):
    return m.group(0).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
body = re.sub(r'\$\$[\s\S]*?\$\$', esc_math, body)
body = re.sub(r'\$[^$\n]*?\$', esc_math, body)


mathjax_path = os.path.join(ASSETS, 'mathjax-tex-svg.js')
mathjax = read(mathjax_path) if os.path.exists(mathjax_path) else ''

MJ_CFG = r"""
window.MathJax = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
    tags: 'none',
    macros: {
      deg: '^{\\circ}',
      dd: '{\\mathrm{d}}',
      j: '{\\mathrm{j}}',
      e: '{\\mathrm{e}}'
    }
  },
  svg: { fontCache: 'global', scale: 1.02 },
  options: { skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'] },
  startup: { typeset: true }
};
"""

html = u"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>自动控制原理 · 复习手册（胡寿松 第八版）</title>
<meta name="description" content="自动控制原理课程系统复习资料：章节知识框架、核心公式推导、典型题型精解、易错清单与自测题库。">
<style>%(css)s</style>
<script>%(mjcfg)s</script>
<script>%(mathjax)s</script>
</head>
<body>
<div id="progress"></div>
<button id="menuBtn" aria-label="目录"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#334155" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>
<aside id="sidebar">
  <div class="brand">
    <div class="mark"><div class="dot">自控</div><h1>自动控制原理<br>复习手册</h1></div>
    <p>胡寿松《自动控制原理》第八版 · 期末 / 考研通用</p>
  </div>
  <div class="searchbox">
    <div class="wrap">
      <svg class="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
      <input id="q" type="text" placeholder="搜索章节 / 公式 / 关键词" autocomplete="off">
      <kbd>/</kbd>
    </div>
  </div>
  <nav id="toc"></nav>
  <div class="sidebar-foot">
    <span>已复习 <b class="ring" id="doneCount">0/0</b></span>
    <span class="ring" id="doneRing" style="width:18px;height:18px;border-radius:50%;display:inline-block;background:conic-gradient(#0f766e 0%,#e2e8f0 0%)"></span>
  </div>
</aside>
<main>
%(body)s
</main>
<div class="toolbar no-print">
  <button id="btnAll" title="展开 / 收起全部解答"><svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h10"/></svg></button>
  <button id="btnPrint" title="打印 / 导出 PDF"><svg viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg></button>
  <button id="btnTop" title="回到顶部"><svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>
</div>
<script>%(js)s</script>
</body>
</html>
"""
for k, v in (('%(css)s', css), ('%(mjcfg)s', MJ_CFG), ('%(mathjax)s', mathjax), ('%(body)s', body), ('%(js)s', js)):
    html = html.replace(k, v)

out = os.path.join(ROOT, 'index.html')
with io.open(out, 'w', encoding='utf-8') as f:
    f.write(html)
print('built %s  %.2f MB' % (out, os.path.getsize(out) / 1048576.0))
print('正文字数(不含标签): %d' % len(re.sub(r'<[^>]+>', '', body)))
