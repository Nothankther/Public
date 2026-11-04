/* ===== 交互脚本 ===== */
(function () {
  'use strict';

  var chapters = [].slice.call(document.querySelectorAll('.chapter'));
  var toc = document.getElementById('toc');
  var progress = document.getElementById('progress');

  /* ---------- 1. 生成目录 ---------- */
  function slug(i, k) { return 'ch' + i + (k ? '-' + k : ''); }

  chapters.forEach(function (ch, i) {
    var rawNum = ch.getAttribute('data-num');
    var n = rawNum !== null ? rawNum : String(i + 1);
    var pad = /^\d+$/.test(n) ? (n.length < 2 ? '0' + n : n) : n;
    var h2 = ch.querySelector('h2');
    if (!h2) return;
    if (!ch.id) ch.id = slug(n);
    h2.id = ch.id + '-h';
    ch.setAttribute('data-index', n);

    var group = document.createElement('div');
    group.className = 'toc-ch';

    var a = document.createElement('a');
    a.href = '#' + ch.id;
    a.setAttribute('data-target', ch.id);
    var title = (ch.getAttribute('data-title') || h2.textContent || '').trim();
    var short = ch.getAttribute('data-short') || title;
    a.innerHTML = '<span class="num">' + pad + '</span><span class="lbl">' + short +
      '</span>' + (ch.querySelector('.figx') ? '<span class="toc-lab">交互</span>' : '') +
      (ch.querySelector('details.prereq') ? '<span class="toc-lab pre">前置</span>' : '') +
      '<span class="tick" data-ch="' + ch.id + '" title="标记已复习"></span>';
    group.appendChild(a);

    var subs = [].slice.call(ch.querySelectorAll('h3'));
    if (subs.length) {
      var box = document.createElement('div');
      box.className = 'sub';
      subs.forEach(function (h, k) {
        if (!h.id) h.id = slug(n, k + 1);
        var sa = document.createElement('a');
        sa.href = '#' + h.id;
        sa.setAttribute('data-target', h.id);
        sa.innerHTML = '<span class="num">' + n + '.' + (k + 1) + '</span><span class="lbl">' +
          h.textContent.trim() + '</span>';
        box.appendChild(sa);
      });
      group.appendChild(box);
    }
    toc.appendChild(group);
  });

  var links = [].slice.call(toc.querySelectorAll('a'));

  /* ---------- 2. 滚动高亮 + 进度 ---------- */
  var targets = links.map(function (a) { return document.getElementById(a.getAttribute('data-target')); })
    .filter(Boolean);

  function onScroll() {
    var y = window.scrollY;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (h > 0 ? Math.min(100, (y / h) * 100) : 0) + '%';

    var current = null;
    for (var i = 0; i < targets.length; i++) {
      if (targets[i].getBoundingClientRect().top <= 120) current = targets[i];
      else break;
    }
    if (!current) current = targets[0];
    links.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-target') === (current && current.id));
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 3. 已复习标记 ---------- */
  var KEY = 'ac-review-done-v1';
  var done = {};
  try { done = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { done = {}; }

  function refreshFoot() {
    var total = chapters.length;
    var cnt = chapters.filter(function (c) { return done[c.id]; }).length;
    var el = document.getElementById('doneCount');
    if (el) el.textContent = cnt + '/' + total;
    var ring = document.getElementById('doneRing');
    if (ring) {
      var pct = total ? Math.round(cnt / total * 100) : 0;
      ring.style.background = 'conic-gradient(#0f766e ' + pct + '%, #e2e8f0 ' + pct + '%)';
      ring.title = '已复习 ' + pct + '%';
    }
  }

  [].slice.call(toc.querySelectorAll('.tick')).forEach(function (t) {
    var id = t.getAttribute('data-ch');
    if (done[id]) t.classList.add('on');
    t.addEventListener('click', function (ev) {
      ev.preventDefault(); ev.stopPropagation();
      done[id] = !done[id];
      if (!done[id]) delete done[id];
      t.classList.toggle('on', !!done[id]);
      try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) { }
      refreshFoot();
    });
  });
  refreshFoot();

  /* ---------- 4. 搜索 ---------- */
  var input = document.getElementById('q');
  function clearMarks() {
    [].slice.call(document.querySelectorAll('mark.hit')).forEach(function (m) {
      var p = m.parentNode; p.replaceChild(document.createTextNode(m.textContent), m); p.normalize();
    });
  }
  function markText(kw) {
    clearMarks();
    if (!kw) return 0;
    var count = 0;
    var walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var p = node.parentNode;
        while (p && p !== document.body) {
          if (/^(SCRIPT|STYLE|MJX-CONTAINER|SUMMARY|MARK)$/.test(p.tagName)) return NodeFilter.FILTER_REJECT;
          p = p.parentNode;
        }
        return node.nodeValue.toLowerCase().indexOf(kw) >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      var txt = node.nodeValue, lower = txt.toLowerCase(), idx, last = 0, frag = document.createDocumentFragment();
      while ((idx = lower.indexOf(kw, last)) >= 0) {
        if (idx > last) frag.appendChild(document.createTextNode(txt.slice(last, idx)));
        var mk = document.createElement('mark'); mk.className = 'hit';
        mk.textContent = txt.substr(idx, kw.length); frag.appendChild(mk);
        last = idx + kw.length; count++;
      }
      if (last < txt.length) frag.appendChild(document.createTextNode(txt.slice(last)));
      if (last > 0) node.parentNode.replaceChild(frag, node);
    });
    return count;
  }
  if (input) {
    input.addEventListener('input', function () {
      var kw = this.value.trim().toLowerCase();
      links.forEach(function (a) {
        var ok = !kw || a.textContent.toLowerCase().indexOf(kw) >= 0;
        a.style.display = ok ? '' : 'none';
      });
      if (!kw) clearMarks();
    });
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') {
        var kw = this.value.trim();
        if (!kw) return;
        var firstVisible = links.filter(function (a) { return a.style.display !== 'none'; })[0];
        var total = markText(kw.toLowerCase());
        var hit = document.querySelector('mark.hit');
        if (hit) hit.scrollIntoView({ behavior: 'smooth', block: 'center' });
        else if (firstVisible) location.hash = firstVisible.getAttribute('href');
        this.title = '共 ' + total + ' 处匹配';
      }
      if (ev.key === 'Escape') { this.value = ''; this.dispatchEvent(new Event('input')); clearMarks(); this.blur(); }
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === '/' && document.activeElement !== input && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
        ev.preventDefault(); input.focus(); input.select();
      }
    });
  }

  /* ---------- 5. 工具按钮 ---------- */
  var btnAll = document.getElementById('btnAll');
  if (btnAll) {
    btnAll.addEventListener('click', function () {
      var all = [].slice.call(document.querySelectorAll('.example details, details.prereq'));
      var anyClosed = all.some(function (d) { return !d.open; });
      all.forEach(function (d) { d.open = anyClosed; });
      this.title = anyClosed ? '收起全部解答' : '展开全部解答';
      this.classList.toggle('on', anyClosed);
    });
  }
  var btnPrint = document.getElementById('btnPrint');
  if (btnPrint) btnPrint.addEventListener('click', function () {
    [].slice.call(document.querySelectorAll('.example details, details.prereq')).forEach(function (d) { d.open = true; });
    window.print();
  });
  // 保证浏览器直接 Ctrl+P 时解答也全部展开
  var reopened = [];
  window.addEventListener('beforeprint', function () {
    reopened = [];
    [].slice.call(document.querySelectorAll('.example details, details.prereq')).forEach(function (d) {
      if (!d.open) { d.open = true; reopened.push(d); }
    });
  });
  window.addEventListener('afterprint', function () {
    reopened.forEach(function (d) { d.open = false; });
    reopened = [];
  });
  var btnTop = document.getElementById('btnTop');
  if (btnTop) btnTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  var menuBtn = document.getElementById('menuBtn');
  var sidebar = document.getElementById('sidebar');
  if (menuBtn) menuBtn.addEventListener('click', function () { sidebar.classList.toggle('open'); });
  toc.addEventListener('click', function (ev) {
    if (ev.target.closest('a') && window.innerWidth <= 820) sidebar.classList.remove('open');
  });

  /* ---------- 6. 自测题 ---------- */
  [].slice.call(document.querySelectorAll('.qitem')).forEach(function (item, i) {
    var a = item.querySelector('.ans');
    if (!a) return;
    var t = document.createElement('span');
    t.className = 'toggle'; t.textContent = '显示答案';
    t.addEventListener('click', function () {
      var on = item.classList.toggle('show');
      t.textContent = on ? '收起' : '显示答案';
    });
    a.parentNode.insertBefore(t, a);
  });

  /* ---------- 7. 公式渲染完成后再纠正表格横向滚动 ---------- */
  if (window.MathJax && MathJax.startup && MathJax.startup.promise) {
    MathJax.startup.promise.then(function () { onScroll(); });
  }

  /* ---------- 8. 交互实验室 ---------- */
  function byId(id) { return document.getElementById(id); }
  var NS = 'http://www.w3.org/2000/svg';

  function svgEl(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function plotCurve(svg, fn, Tmax, tp) {
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var W = 640, H = 300, ml = 48, mr = 16, mt = 16, mb = 36;
    var iw = W - ml - mr, ih = H - mt - mb;
    var N = 320, maxY = 1.2, pts = [], i, t, y;
    for (i = 0; i <= N; i++) {
      t = Tmax * i / N; y = fn(t);
      if (isFinite(y) && y > maxY) maxY = y;
      pts.push([t, y]);
    }
    maxY = Math.min(maxY * 1.08, 2.2);
    function X(t) { return ml + (t / Tmax) * iw; }
    function Y(v) { return mt + ih - (v / maxY) * ih; }

    // 误差带
    svg.appendChild(svgEl('rect', { x: ml, y: Y(1.05), width: iw, height: Math.max(1, Y(0.95) - Y(1.05)), fill: '#0f766e', 'fill-opacity': .08 }));
    svg.appendChild(svgEl('line', { x1: ml, y1: Y(1), x2: W - mr, y2: Y(1), stroke: '#94a3b8', 'stroke-width': 1, 'stroke-dasharray': '5 4' }));

    // 网格与刻度
    [0, .5, 1, 1.5, 2].forEach(function (v) {
      if (v > maxY) return;
      svg.appendChild(svgEl('line', { x1: ml, y1: Y(v), x2: W - mr, y2: Y(v), stroke: '#eef2f8', 'stroke-width': 1 }));
      var tx = svgEl('text', { x: ml - 8, y: Y(v) + 4, 'text-anchor': 'end', 'font-size': 10.5, fill: '#94a3b8' });
      tx.textContent = v.toFixed(1); svg.appendChild(tx);
    });
    for (i = 0; i <= 4; i++) {
      t = Tmax * i / 4;
      svg.appendChild(svgEl('line', { x1: X(t), y1: mt, x2: X(t), y2: mt + ih, stroke: '#f4f7fb', 'stroke-width': 1 }));
      var xt = svgEl('text', { x: X(t), y: H - mb + 16, 'text-anchor': 'middle', 'font-size': 10.5, fill: '#94a3b8' });
      xt.textContent = t.toFixed(2); svg.appendChild(xt);
    }
    // 坐标轴
    svg.appendChild(svgEl('line', { x1: ml, y1: mt, x2: ml, y2: mt + ih, stroke: '#94a3b8', 'stroke-width': 1.1 }));
    svg.appendChild(svgEl('line', { x1: ml, y1: mt + ih, x2: W - mr, y2: mt + ih, stroke: '#94a3b8', 'stroke-width': 1.1 }));
    var la = svgEl('text', { x: W - mr, y: H - 4, 'text-anchor': 'end', 'font-size': 10.5, fill: '#64748b' });
    la.textContent = 't / s'; svg.appendChild(la);
    var la2 = svgEl('text', { x: ml + 6, y: mt + 12, 'font-size': 10.5, fill: '#64748b' });
    la2.textContent = 'c(t)'; svg.appendChild(la2);

    // 曲线
    var d = '';
    for (i = 0; i < pts.length; i++) d += (i ? 'L' : 'M') + X(pts[i][0]).toFixed(1) + ',' + Y(pts[i][1]).toFixed(1);
    svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: '#1d4ed8', 'stroke-width': 2, 'stroke-linejoin': 'round' }));

    // 峰值点
    if (tp) {
      svg.appendChild(svgEl('line', { x1: X(tp), y1: Y(1), x2: X(tp), y2: mt + ih, stroke: '#d97706', 'stroke-width': 1, 'stroke-dasharray': '4 4' }));
      svg.appendChild(svgEl('circle', { cx: X(tp), cy: Y(1), r: 3.6, fill: '#fff', stroke: '#d97706', 'stroke-width': 1.6 }));
    }
  }

  function cellHTML(k, v, unit) {
    return '<div class="lab-cell"><div class="k">' + k + '</div><div class="v">' + v +
      (unit ? ' <small>' + unit + '</small>' : '') + '</div></div>';
  }

  // 二阶
  (function () {
    var zr = byId('zRange'), wr = byId('wnRange');
    if (!zr || !wr) return;
    function upd() {
      var z = +zr.value, w = +wr.value;
      byId('zOut').textContent = z.toFixed(2);
      byId('wnOut').textContent = w.toFixed(1);
      var cells = [], fn, Tmax, tp = null, note = '';
      if (z < 0.9999) {
        var wd = w * Math.sqrt(1 - z * z), beta = Math.acos(z);
        var tr = (Math.PI - beta) / wd, tpk = Math.PI / wd;
        var sig = Math.exp(-Math.PI * z / Math.sqrt(1 - z * z)) * 100;
        cells = [cellHTML('超调量 σ%', sig.toFixed(1), '%'),
                 cellHTML('上升时间 t_r', tr.toFixed(3), 's'),
                 cellHTML('峰值时间 t_p', tpk.toFixed(3), 's'),
                 cellHTML('调节时间 t_s', (3.5 / (z * w)).toFixed(3), 's (5%)')];
        fn = function (t) { return 1 - Math.exp(-z * w * t) / Math.sqrt(1 - z * z) * Math.sin(wd * t + beta); };
        Tmax = Math.max(3 * tpk, 8 / (z * w)); tp = tpk;
        note = '欠阻尼：σ% 只由 ζ 决定；t_s(2%) = ' + (4.4 / (z * w)).toFixed(3) + ' s，ω_d = ' + wd.toFixed(2) + ' rad/s。';
      } else if (z <= 1.0001) {
        cells = [cellHTML('超调量 σ%', '0', '%'),
                 cellHTML('上升时间 t_r', '—', ''),
                 cellHTML('调节时间 t_s', (3.5 / w).toFixed(3), 's (5%)'),
                 cellHTML('到达 90%', (3.89 / w).toFixed(3), 's')];
        fn = function (t) { return 1 - Math.exp(-w * t) * (1 + w * t); };
        Tmax = 8 / w;
        note = '临界阻尼：无超调，是“无超调情形下最快”的响应。';
      } else {
        var s1 = -w * (z - Math.sqrt(z * z - 1)), s2 = -w * (z + Math.sqrt(z * z - 1));
        cells = [cellHTML('超调量 σ%', '0', '%'),
                 cellHTML('慢极点 |s₁|', Math.abs(s1).toFixed(3), 'rad/s'),
                 cellHTML('快极点 |s₂|', Math.abs(s2).toFixed(3), 'rad/s'),
                 cellHTML('调节时间 t_s', (3.5 / Math.abs(s1)).toFixed(3), 's (5%)')];
        fn = function (t) { return 1 + (s2 / (s1 - s2)) * Math.exp(s1 * t) - (s1 / (s1 - s2)) * Math.exp(s2 * t); };
        Tmax = Math.min(40, 8 / Math.abs(s1));
        note = '过阻尼：响应由慢极点主导，' + (Math.abs(s2) > 5 * Math.abs(s1) ? '可近似为一阶系统（T = 1/' + Math.abs(s1).toFixed(2) + '）。' : '两个极点相距不远，不能简单降阶。');
      }
      Tmax = Math.min(Tmax, 60);
      byId('secondOut').innerHTML = cells.join('');
      var noteEl = byId('secondNote');
      if (!noteEl) { noteEl = document.createElement('div'); noteEl.id = 'secondNote'; noteEl.style.cssText = 'font-size:12.5px;color:#64748b;margin-top:4px'; byId('secondOut').parentNode.insertBefore(noteEl, byId('secondPlot')); }
      noteEl.textContent = note;
      plotCurve(byId('secondPlot'), fn, Tmax, tp);
    }
    zr.addEventListener('input', upd); wr.addEventListener('input', upd); upd();
  })();

  // 一阶
  (function () {
    var tr = byId('tRange');
    if (!tr) return;
    function upd() {
      var T = +tr.value;
      byId('tOut').textContent = T.toFixed(1);
      byId('firstOut').innerHTML =
        cellHTML('上升时间 t_r', (2.2 * T).toFixed(2), 's') +
        cellHTML('调节时间 t_s', (3 * T).toFixed(2), 's (5%)') +
        cellHTML('调节时间 t_s', (4 * T).toFixed(2), 's (2%)') +
        cellHTML('到达 63.2%', T.toFixed(2), 's');
      plotCurve(byId('firstPlot'), function (t) { return 1 - Math.exp(-t / T); }, 5 * T, null);
    }
    tr.addEventListener('input', upd); upd();
  })();

  // 频域
  (function () {
    var kr = byId('kRange'), t1r = byId('t1Range'), t2r = byId('t2Range');
    if (!kr) return;
    function mag(w, K, T1, T2) { return K / (w * Math.sqrt(1 + (T1 * w) * (T1 * w)) * Math.sqrt(1 + (T2 * w) * (T2 * w))); }
    function ph(w, T1, T2) { return -90 - Math.atan(T1 * w) * 180 / Math.PI - Math.atan(T2 * w) * 180 / Math.PI; }
    function upd() {
      var K = +kr.value, T1 = +t1r.value, T2 = +t2r.value;
      byId('kOut').textContent = K.toFixed(1);
      byId('t1Out').textContent = T1.toFixed(2);
      byId('t2Out').textContent = T2.toFixed(3);
      // 扫描求 wc
      var lo = 1e-3, hi = 1e3, wc = null, prevW = lo, prevM = mag(lo, K, T1, T2);
      for (var i = 1; i <= 4000; i++) {
        var w = lo * Math.pow(hi / lo, i / 4000), m = mag(w, K, T1, T2);
        if ((prevM - 1) * (m - 1) < 0) {
          var a = prevW, b = w, fa = prevM - 1;
          for (var k = 0; k < 60; k++) { var mid = (a + b) / 2, fm = mag(mid, K, T1, T2) - 1; if (fa * fm <= 0) b = mid; else { a = mid; fa = fm; } }
          wc = (a + b) / 2; break;
        }
        prevW = w; prevM = m;
      }
      var cells = [];
      if (wc) {
        var gam = 180 + ph(wc, T1, T2);
        var wg = 1 / Math.sqrt(T1 * T2);
        var kgdb = -20 * Math.log10(mag(wg, K, T1, T2));
        cells = [cellHTML('剪切频率 ω_c', wc.toFixed(3), 'rad/s'),
                 cellHTML('相位裕度 γ', gam.toFixed(1), '°'),
                 cellHTML('交界频率 ω_g', wg.toFixed(2), 'rad/s'),
                 cellHTML('幅值裕度 K_g', kgdb.toFixed(1), 'dB')];
        var v = byId('freqVerdict');
        if (gam > 0 && kgdb > 0) { v.className = 'lab-verdict ok'; v.textContent = '闭环稳定：γ = ' + gam.toFixed(1) + '° > 0，K_g = ' + kgdb.toFixed(1) + ' dB > 0。工程上建议 γ 在 30°～60°、K_g ≥ 6 dB。'; }
        else { v.className = 'lab-verdict bad'; v.textContent = '闭环不稳定或临界：γ = ' + gam.toFixed(1) + '°，K_g = ' + kgdb.toFixed(1) + ' dB（需同时为正）。可减小 K 或增大 T 使曲线下移。'; }
      } else {
        cells = [cellHTML('剪切频率 ω_c', '—', ''), cellHTML('相位裕度 γ', '—', ''), cellHTML('交界频率 ω_g', (1 / Math.sqrt(T1 * T2)).toFixed(2), 'rad/s'), cellHTML('幅值裕度 K_g', '—', '')];
        var v2 = byId('freqVerdict');
        v2.className = 'lab-verdict bad';
        v2.textContent = '在当前 K 下幅频曲线不与 0 dB 相交（K 太小），系统虽无剪切频率但稳态误差会很大，请增大 K。';
      }
      byId('freqOut').innerHTML = cells.join('');
    }
    kr.addEventListener('input', upd); t1r.addEventListener('input', upd); t2r.addEventListener('input', upd); upd();
  })();

  // 劳斯
  (function () {
    var btn = byId('routhBtn'), inp = byId('routhInput'), out = byId('routhOut');
    if (!btn) return;
    function calc() {
      var raw = (inp.value || '').replace(/，/g, ',').split(/[,\s]+/).filter(function (x) { return x !== ''; });
      var a = raw.map(Number);
      if (a.length < 2 || a.some(function (x) { return !isFinite(x); })) {
        out.innerHTML = '<div class="routh-note">请输入至少两个数字系数，用逗号或空格分隔。</div>'; return;
      }
      if (a[0] === 0) { out.innerHTML = '<div class="routh-note">最高次项系数不能为 0。</div>'; return; }
      var n = a.length - 1;
      var rows = [], r0 = [], r1 = [], i, j;
      for (i = 0; i < a.length; i += 2) r0.push(a[i]);
      for (i = 1; i < a.length; i += 2) r1.push(a[i]);
      var width = Math.ceil(a.length / 2);
      while (r0.length < width) r0.push(0);
      while (r1.length < width) r1.push(0);
      rows.push(r0.slice()); rows.push(r1.slice());
      var notes = [];
      for (i = 2; i <= n; i++) {
        var A = rows[i - 2], B = rows[i - 1];
        if (B.every(function (x) { return Math.abs(x) < 1e-12; })) {
          var deg = n - (i - 2), der = [];
          for (j = 0; j < A.length; j++) { var p = deg - 2 * j; der.push(p > 0 ? A[j] * p : 0); }
          rows[i - 1] = der; B = der;
          notes.push('第 ' + (i - 1) + ' 行全为零，用上一行构造辅助多项式并求导后继续。');
        }
        if (Math.abs(B[0]) < 1e-12) { B[0] = 1e-9; notes.push('首列为 0，用 ε→0⁺ 代替。'); }
        var nr = [];
        for (j = 0; j < width - 1; j++) {
          var x1 = A[j + 1] === undefined ? 0 : A[j + 1];
          var x2 = B[j + 1] === undefined ? 0 : B[j + 1];
          nr.push((B[0] * x1 - A[0] * x2) / B[0]);
        }
        rows.push(nr);
      }
      // 首列符号变化
      var first = rows.map(function (r) { return r[0]; });
      var changes = 0;
      for (i = 1; i < first.length; i++) if (first[i - 1] * first[i] < 0) changes++;
      var html = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>行</th>';
      for (j = 0; j < width; j++) html += '<th>' + (j === 0 ? '首列' : '第 ' + (j + 1) + ' 列') + '</th>';
      html += '</tr></thead><tbody>';
      for (i = 0; i < rows.length; i++) {
        html += '<tr><td><b>s<sup>' + (n - i) + '</sup></b></td>';
        for (j = 0; j < width; j++) {
          var val = rows[i][j] === undefined ? 0 : rows[i][j];
          var txt = Math.abs(val) < 1e-7 ? '0' : (Math.abs(val) >= 1000 || Math.abs(val) < 0.001 ? val.toExponential(2) : val.toFixed(3));
          html += '<td class="c">' + txt + '</td>';
        }
        html += '</tr>';
      }
      html += '</tbody></table></div>';
      if (changes === 0) html += '<div class="lab-verdict ok">第一列全部同号：系统稳定（' + n + ' 阶，无右半平面根）。</div>';
      else html += '<div class="lab-verdict bad">第一列变号 ' + changes + ' 次：系统不稳定，右半平面有 ' + changes + ' 个根。</div>';
      if (notes.length) html += '<div class="routh-note">' + notes.join(' ') + '</div>';
      out.innerHTML = html;
    }
    btn.addEventListener('click', calc);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); calc(); } });
    calc();
  })();

  /* ---------- 9. 搜索结果面板 ---------- */
  (function () {
    var input = byId('q');
    if (!input) return;
    var box = input.closest('.wrap');
    if (!box) return;
    var panel = document.createElement('div');
    panel.id = 'searchPanel';
    box.appendChild(panel);
    var index = null;
    function buildIndex() {
      index = [];
      var heads = [].slice.call(document.querySelectorAll('main h2, main h3'));
      heads.forEach(function (h) {
        var text = '', node = h.nextElementSibling;
        var guard = 0;
        while (node && !/^H[23]$/.test(node.tagName) && guard < 14) {
          if (!node.classList || !node.classList.contains('figx')) text += ' ' + (node.textContent || '');
          node = node.nextElementSibling; guard++;
        }
        var clean = text.replace(/\$\$[\s\S]*?\$\$/g, ' ').replace(/\$[^$\n]*?\$/g, ' ').replace(/\s+/g, ' ');
        index.push({ el: h, title: h.textContent.trim(), text: clean });
      });
    }
    function close() { panel.className = ''; panel.innerHTML = ''; }
    function render(q) {
      if (!index) buildIndex();
      var lq = q.toLowerCase(), hits = [];
      index.forEach(function (it) {
        var t = it.title.toLowerCase(), x = it.text.toLowerCase();
        var score = t.indexOf(lq) >= 0 ? 3 : (x.indexOf(lq) >= 0 ? 1 : 0);
        if (score) hits.push({ it: it, score: score });
      });
      hits.sort(function (a, b) { return b.score - a.score; });
      hits = hits.slice(0, 8);
      if (!hits.length) { panel.className = 'on'; panel.innerHTML = '<div class="empty">没有匹配的章节，试试“劳斯”“裕度”“最少拍”。</div>'; return; }
      var html = '';
      hits.forEach(function (h, i) {
        var txt = h.it.text, p = txt.toLowerCase().indexOf(lq), snip;
        if (p >= 0) snip = (p > 26 ? '…' : '') + txt.slice(Math.max(0, p - 26), p + 60) + '…';
        else snip = txt.slice(0, 80) + '…';
        html += '<a href="#' + h.it.el.id + '" data-i="' + i + '"><div class="st">' + h.it.title + '</div><div class="ss">' + snip.replace(/</g, '&lt;') + '</div></a>';
      });
      panel.className = 'on';
      panel.innerHTML = html;
      [].slice.call(panel.querySelectorAll('a')).forEach(function (a) {
        a.addEventListener('click', function (ev) {
          ev.preventDefault();
          var id = a.getAttribute('href').slice(1);
          var el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          markText(lq); close();
        });
      });
    }
    var timer = null;
    input.addEventListener('input', function () {
      var q = this.value.trim();
      clearTimeout(timer);
      if (q.length < 1) { close(); return; }
      timer = setTimeout(function () { render(q); }, 160);
    });
    input.addEventListener('focus', function () { if (this.value.trim()) render(this.value.trim()); });
    document.addEventListener('click', function (e) { if (!box.contains(e.target)) close(); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  })();

})();
