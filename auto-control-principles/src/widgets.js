/* ===== 交互图控件（拖动 / 点击 / 联动） ===== */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  function mk(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag), k;
    if (attrs) for (k in attrs) {
      if (attrs[k] === null || attrs[k] === undefined) continue;
      n.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(n);
    return n;
  }
  function clear(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
  function text(parent, x, y, s, o) {
    o = o || {};
    var t = mk('text', {
      x: x, y: y, 'font-size': o.size || 11, fill: o.fill || '#64748b',
      'text-anchor': o.anchor || 'start', 'font-weight': o.weight || 400,
      'font-family': o.mono ? 'Consolas,Menlo,monospace' : 'inherit'
    }, parent);
    t.textContent = s;
    return t;
  }
  function line(parent, x1, y1, x2, y2, o) {
    o = o || {};
    return mk('line', {
      x1: x1, y1: y1, x2: x2, y2: y2, stroke: o.stroke || '#cbd5e1',
      'stroke-width': o.w || 1, 'stroke-dasharray': o.dash || null, 'stroke-opacity': o.op || null
    }, parent);
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function fmt(v, d) {
    if (!isFinite(v)) return '∞';
    if (Math.abs(v) >= 1000 || (v !== 0 && Math.abs(v) < 0.001)) return v.toExponential(1);
    return v.toFixed(d === undefined ? 2 : d);
  }
  function chip(name, val) {
    return '<div class="figx-chip">' + name + '<b>' + val + '</b></div>';
  }
  function chipC(name, val, color) {
    return '<div class="figx-chip">' + name + '<b style="color:' + color + '">' + val + '</b></div>';
  }

  /* ---------- 复数与多项式求根（Durand–Kerner） ---------- */
  function cadd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
  function csub(a, b) { return { re: a.re - b.re, im: a.im - b.im }; }
  function cmul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
  function cdiv(a, b) {
    var d = b.re * b.re + b.im * b.im;
    return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
  }
  function cabs(a) { return Math.sqrt(a.re * a.re + a.im * a.im); }
  function peval(c, z) {
    var r = { re: 0, im: 0 }, i;
    for (i = 0; i < c.length; i++) { r = cmul(r, z); r.re += c[i]; }
    return r;
  }
  function roots(c) {
    var n = c.length - 1, i, j, it, lead = c[0], a = [], rad = 1;
    for (i = 0; i <= n; i++) a.push(c[i] / lead);
    for (i = 1; i <= n; i++) rad = Math.max(rad, 1 + Math.abs(a[i]));
    rad = Math.min(rad, 5);
    var z = [];
    for (i = 0; i < n; i++) {
      var th = 2 * Math.PI * i / n + 0.35;
      z.push({ re: rad * Math.cos(th), im: rad * Math.sin(th) });
    }
    for (it = 0; it < 500; it++) {
      var mx = 0;
      for (i = 0; i < n; i++) {
        var num = peval(a, z[i]), den = { re: 1, im: 0 };
        for (j = 0; j < n; j++) if (j !== i) den = cmul(den, csub(z[i], z[j]));
        if (cabs(den) < 1e-15) continue;
        var d = cdiv(num, den);
        z[i] = csub(z[i], d);
        if (cabs(d) > mx) mx = cabs(d);
      }
      if (mx < 1e-11) break;
    }
    for (i = 0; i < n; i++) {
      if (Math.abs(z[i].im) < 1e-7) z[i].im = 0;
      if (Math.abs(z[i].re) < 1e-9) z[i].re = 0;
    }
    return z;
  }

  /* ---------- 时间响应曲线 ---------- */
  function drawTime(svg, fn, Tmax, opt) {
    opt = opt || {};
    clear(svg);
    var W = opt.w || 440, H = opt.h || 430;
    var L = 54, R = 16, T = 24, B = 42;
    var iw = W - L - R, ih = H - T - B;
    var N = 400, pts = [], i, t, y, ymax = 1.15;
    for (i = 0; i <= N; i++) {
      t = Tmax * i / N; y = fn(t);
      if (!isFinite(y)) y = 0;
      pts.push([t, y]);
      if (y > ymax) ymax = y;
    }
    ymax = Math.min(ymax * 1.08, 2.35);
    var ymin = -0.12;
    function X(v) { return L + v / Tmax * iw; }
    function Y(v) { return T + ih - (v - ymin) / (ymax - ymin) * ih; }

    mk('rect', { x: L, y: Y(1.05), width: iw, height: Math.max(1, Y(0.95) - Y(1.05)), fill: '#0f766e', 'fill-opacity': 0.07 }, svg);
    [0, 0.5, 1, 1.5, 2].forEach(function (v) {
      if (v > ymax) return;
      line(svg, L, Y(v), W - R, Y(v), { stroke: '#eef2f8', w: 1 });
      text(svg, L - 8, Y(v) + 4, v.toFixed(1), { anchor: 'end', size: 10.5, fill: '#9aa6b8' });
    });
    for (i = 0; i <= 4; i++) {
      t = Tmax * i / 4;
      line(svg, X(t), T, X(t), T + ih, { stroke: '#f4f7fb', w: 1 });
      text(svg, X(t), H - B + 17, t.toFixed(t < 1 ? 2 : 1), { anchor: 'middle', size: 10.5, fill: '#9aa6b8' });
    }
    line(svg, L, Y(1), W - R, Y(1), { stroke: '#94a3b8', w: 1, dash: '5 4' });
    line(svg, L, T, L, T + ih, { stroke: '#94a3b8', w: 1.1 });
    line(svg, L, T + ih, W - R, T + ih, { stroke: '#94a3b8', w: 1.1 });
    text(svg, W - R, H - 6, 't / s', { anchor: 'end', size: 10.5, fill: '#64748b' });
    text(svg, L + 6, T + 12, 'c(t)', { size: 10.5, fill: '#64748b' });

    var d = '', pen = false;
    for (i = 0; i < pts.length; i++) {
      y = pts[i][1];
      if (y > ymax || y < ymin) { pen = false; continue; }
      d += (pen ? 'L' : 'M') + X(pts[i][0]).toFixed(1) + ',' + Y(y).toFixed(1);
      pen = true;
    }
    mk('path', { d: d, fill: 'none', stroke: opt.color || '#1d4ed8', 'stroke-width': 2, 'stroke-linejoin': 'round' }, svg);

    (opt.marks || []).forEach(function (m) {
      if (m.t > Tmax || m.t < 0) return;
      line(svg, X(m.t), T, X(m.t), T + ih, { stroke: m.color || '#d97706', w: 1, dash: '4 4' });
      var mv = fn(m.t);
      if (mv >= ymin && mv <= ymax) mk('circle', { cx: X(m.t), cy: Y(mv), r: 3.4, fill: '#fff', stroke: m.color || '#d97706', 'stroke-width': 1.6 }, svg);
      text(svg, X(m.t) + 4, T + 14, m.label, { size: 10, fill: m.color || '#d97706', weight: 600 });
    });
    if (opt.note) text(svg, L + 6, T + ih - 8, opt.note, { size: 10.5, fill: '#94a3b8' });
  }

  /* =========================================================
     1. 二阶系统：拖动极点
     ========================================================= */
  (function () {
    var svg = document.getElementById('poleSvg'), rsvg = document.getElementById('poleResp');
    if (!svg || !rsvg) return;
    var zr = document.getElementById('pz'), wr = document.getElementById('pwn');
    var zOut = document.getElementById('pzOut'), wOut = document.getElementById('pwnOut');
    var read = document.getElementById('poleRead');
    var st = { z: 0.5, w: 2 };
    var W = 440, H = 430, L = 48, R = 16, T = 20, B = 40;
    var iw = W - L - R, ih = H - T - B;
    var XR = [-2.35, 0.35], YR = [0, 2.66];
    function X(v) { return L + (v - XR[0]) / (XR[1] - XR[0]) * iw; }
    function Y(v) { return T + ih - (v - YR[0]) / (YR[1] - YR[0]) * ih; }

    function response(t) {
      var z = st.z, w = st.w;
      if (z < 0.9995) {
        var wd = w * Math.sqrt(1 - z * z), b = Math.acos(z);
        return 1 - Math.exp(-z * w * t) / Math.sqrt(1 - z * z) * Math.sin(wd * t + b);
      }
      return 1 - Math.exp(-w * t) * (1 + w * t);
    }

    function draw() {
      clear(svg);
      var z = st.z, w = st.w, beta = Math.acos(z);
      var px = -z * w, py = w * Math.sqrt(Math.max(0, 1 - z * z));

      // 等 ωn 半圆
      [1, 2].forEach(function (r) {
        var d = '', i, a;
        for (i = 0; i <= 60; i++) {
          a = Math.PI * i / 60;
          d += (i ? 'L' : 'M') + X(-r * Math.cos(a)).toFixed(1) + ',' + Y(r * Math.sin(a)).toFixed(1);
        }
        mk('path', { d: d, fill: 'none', stroke: '#e6edf8', 'stroke-width': 1 }, svg);
      });
      // 等阻尼线
      [0.2, 0.5, 0.707].forEach(function (zz) {
        var b = Math.acos(zz), r = 2.45;
        line(svg, X(0), Y(0), X(-r * Math.cos(b)), Y(r * Math.sin(b)), { stroke: '#eef3fa', w: 1, dash: '4 5' });
        text(svg, X(-r * Math.cos(b) * 0.9) + 2, Y(r * Math.sin(b) * 0.9) - 3, 'ζ=' + zz, { size: 8.8, fill: '#c2cddd' });
      });

      line(svg, X(XR[0]), Y(0), X(XR[1]), Y(0), { stroke: '#94a3b8', w: 1.1 });
      line(svg, X(0), Y(YR[0]), X(0), Y(YR[1]), { stroke: '#94a3b8', w: 1.1 });
      [-2].forEach(function (v) {
        line(svg, X(v), Y(0) - 3, X(v), Y(0) + 3, { stroke: '#94a3b8', w: 1 });
        text(svg, X(v), Y(0) + 15, '' + v, { anchor: 'middle', size: 10, fill: '#94a3b8' });
      });
      text(svg, X(0) + 5, Y(0) + 15, '0', { size: 10, fill: '#94a3b8' });
      text(svg, X(XR[1]) - 2, Y(0) - 7, 'σ', { anchor: 'end', size: 10.5, fill: '#64748b' });
      text(svg, X(0) + 7, Y(YR[1]) + 24, 'jω', { size: 10.5, fill: '#64748b' });

      // β 角
      var rb = 0.55, d2 = '', i;
      for (i = 0; i <= 30; i++) {
        var a = (Math.PI - beta) * i / 30 + beta;
        d2 += (i ? 'L' : 'M') + X(-rb * Math.cos(a)).toFixed(1) + ',' + Y(rb * Math.sin(a)).toFixed(1);
      }
      mk('path', { d: d2, fill: 'none', stroke: '#b45309', 'stroke-width': 1.2 }, svg);
      text(svg, X(-rb * Math.cos(beta / 2)) - 2, Y(rb * Math.sin(beta / 2)) + 4, 'β', { size: 10.5, fill: '#b45309', weight: 700 });

      // 投影
      line(svg, X(px), Y(py), X(px), Y(0), { stroke: '#94a3b8', w: 1, dash: '3 3' });
      line(svg, X(px), Y(py), X(0), Y(py), { stroke: '#94a3b8', w: 1, dash: '3 3' });
      text(svg, X(px) - 5, Y(0) - 7, '-ζωn', { anchor: 'end', size: 10, fill: '#64748b' });
      text(svg, X(0) + 6, Y(py) + 4, 'ωd', { size: 10, fill: '#64748b' });

      // 极点
      mk('circle', { cx: X(px), cy: Y(py), r: 7, fill: '#1d4ed8', stroke: '#fff', 'stroke-width': 2 }, svg);
      mk('circle', { cx: X(px), cy: Y(-py), r: 4, fill: '#fff', stroke: '#93b4f0', 'stroke-width': 1.4 }, svg);
      text(svg, X(px) + 10, Y(py) - 8, 's₁', { size: 10.5, fill: '#1d4ed8', weight: 700 });
      if (py > 0.3) text(svg, X(px) + 8, Y(-py) + 12, 's₂（共轭）', { size: 9.5, fill: '#93a8c9' });

      // 指标
      var cells = [];
      if (z < 0.9995) {
        var wd = w * Math.sqrt(1 - z * z), tr = (Math.PI - beta) / wd, tp = Math.PI / wd;
        var sig = Math.exp(-Math.PI * z / Math.sqrt(1 - z * z)) * 100;
        cells = [chip('阻尼比 ζ', z.toFixed(2)), chip('自然频率 ωn', w.toFixed(2) + ' <small>rad/s</small>'),
          chip('阻尼角 β', (beta * 180 / Math.PI).toFixed(1) + '°'),
          chip('超调量 σ%', sig.toFixed(1) + '%'), chip('上升时间 tr', tr.toFixed(2) + ' <small>s</small>'),
          chip('峰值时间 tp', tp.toFixed(2) + ' <small>s</small>'),
          chip('调节时间 ts', (3.5 / (z * w)).toFixed(2) + ' <small>s (5%)</small>')];
        var Tmax = Math.min(45, Math.max(8 / (z * w), 2.2 * 2 * Math.PI / wd));
        drawTime(rsvg, response, Tmax, {
          marks: [{ t: tp, label: 'tp', color: '#d97706' }, { t: 3.5 / (z * w), label: 'ts', color: '#0f766e' }]
        });
      } else {
        cells = [chip('阻尼比 ζ', '1.00'), chip('自然频率 ωn', w.toFixed(2) + ' <small>rad/s</small>'),
          chip('阻尼角 β', '0°'), chip('超调量 σ%', '0'),
          chip('上升时间 tr', '—'), chip('峰值时间 tp', '—'),
          chip('调节时间 ts', (3.5 / w).toFixed(2) + ' <small>s (5%)</small>')];
        drawTime(rsvg, response, Math.min(40, 8 / w), { marks: [{ t: 3.5 / w, label: 'ts', color: '#0f766e' }] });
      }
      read.innerHTML = cells.join('');
      if (zOut) zOut.textContent = z.toFixed(2);
      if (wOut) wOut.textContent = w.toFixed(2);
      if (zr) zr.value = z;
      if (wr) wr.value = w;
    }

    function fromEvent(ev) {
      var r = svg.getBoundingClientRect();
      var sx = (ev.clientX - r.left) / r.width * W;
      var sy = (ev.clientY - r.top) / r.height * H;
      var x = (sx - L) / iw * (XR[1] - XR[0]) + XR[0];
      var y = (T + ih - sy) / ih * (YR[1] - YR[0]) + YR[0];
      y = Math.abs(y);
      var rad = Math.sqrt(x * x + y * y);
      if (rad < 0.45) return;
      var z = clamp(-x / rad, 0.02, 1);
      var w = clamp(rad, 0.45, 2.35);
      st.z = z; st.w = w; draw();
    }
    var drag = false;
    svg.addEventListener('pointerdown', function (e) {
      drag = true;
      if (svg.setPointerCapture) svg.setPointerCapture(e.pointerId);
      fromEvent(e); e.preventDefault();
    });
    svg.addEventListener('pointermove', function (e) { if (drag) { fromEvent(e); e.preventDefault(); } });
    svg.addEventListener('pointerup', function () { drag = false; });
    svg.addEventListener('pointercancel', function () { drag = false; });
    if (zr) zr.addEventListener('input', function () { st.z = +zr.value; draw(); });
    if (wr) wr.addEventListener('input', function () { st.w = +wr.value; draw(); });
    draw();
  })();

  /* =========================================================
     2. 根轨迹：拖动 K*
     ========================================================= */
  (function () {
    var svg = document.getElementById('rlSvg'), rsvg = document.getElementById('rlResp');
    if (!svg || !rsvg) return;
    var kr = document.getElementById('rlK'), kOut = document.getElementById('rlKOut');
    var read = document.getElementById('rlRead'), note = document.getElementById('rlNote');
    var st = { k: 1.2 };
    var W = 440, H = 430, L = 44, R = 14, T = 18, B = 38;
    var iw = W - L - R, ih = H - T - B;
    var XR = [-4.6, 1.6], YR = [-3.1, 3.1];
    function X(v) { return L + (v - XR[0]) / (XR[1] - XR[0]) * iw; }
    function Y(v) { return T + ih - (v - YR[0]) / (YR[1] - YR[0]) * ih; }

    function polesOf(k) {
      var r = roots([1, 3, 2, k]), i, re = [], cp = null;
      for (i = 0; i < r.length; i++) {
        if (Math.abs(r[i].im) < 1e-5) re.push(r[i].re);
        else cp = r[i];
      }
      re.sort(function (a, b) { return a - b; });
      if (!cp) return [{ re: re[0], im: 0 }, { re: re[1], im: 0 }, { re: re[2], im: 0 }];
      return [{ re: re[0], im: 0 }, { re: cp.re, im: Math.abs(cp.im) }, { re: cp.re, im: -Math.abs(cp.im) }];
    }

    // 预计算三条分支
    var branches = [[], [], []], i, k;
    for (i = 0; i <= 900; i++) {
      k = i * 30 / 900;
      var ps = polesOf(k);
      branches[0].push(ps[0]);
      branches[1].push(ps[1]);
      branches[2].push(ps[2]);
    }

    function drawLocus() {
      clear(svg);
      line(svg, X(XR[0]), Y(0), X(XR[1]), Y(0), { stroke: '#94a3b8', w: 1.1 });
      line(svg, X(0), Y(YR[0]), X(0), Y(YR[1]), { stroke: '#94a3b8', w: 1.1 });
      [-4, -3, -2, -1, 1].forEach(function (v) {
        if (v < XR[0] || v > XR[1]) return;
        line(svg, X(v), Y(0) - 3, X(v), Y(0) + 3, { stroke: '#94a3b8', w: 1 });
        text(svg, X(v), Y(0) + 15, '' + v, { anchor: 'middle', size: 10, fill: '#94a3b8' });
      });
      text(svg, X(0) + 5, Y(0) + 15, '0', { size: 10, fill: '#94a3b8' });
      text(svg, X(0) + 7, Y(YR[1]) + 24, 'jω', { size: 10.5, fill: '#64748b' });
      text(svg, X(XR[1]) - 2, Y(0) - 7, 'σ', { anchor: 'end', size: 10.5, fill: '#64748b' });

      // 渐近线
      [60, -60].forEach(function (ang) {
        var a = ang * Math.PI / 180, r = 8;
        line(svg, X(-1), Y(0), X(-1 + r * Math.cos(a)), Y(r * Math.sin(a)), { stroke: '#e8eef9', w: 1.1, dash: '6 5' });
      });
      line(svg, X(-1), Y(0), X(XR[0]), Y(0), { stroke: '#e8eef9', w: 1.1, dash: '6 5' });
      text(svg, X(-3.9), Y(2.55), '渐近线 ±60°', { size: 9.5, fill: '#b6c2d4' });

      // 三条分支
      ['#1d4ed8', '#0f766e', '#b45309'].forEach(function (c, bi) {
        var d = '', pen = false;
        branches[bi].forEach(function (p) {
          if (p.re < XR[0] - 0.2 || p.re > XR[1] || Math.abs(p.im) > YR[1]) { pen = false; return; }
          d += (pen ? 'L' : 'M') + X(p.re).toFixed(1) + ',' + Y(p.im).toFixed(1);
          pen = true;
        });
        mk('path', { d: d, fill: 'none', stroke: c, 'stroke-width': c === '#0f766e' ? 2 : 1.7, 'stroke-opacity': 0.85 }, svg);
      });

      // 关键点
      mk('circle', { cx: X(-0.422), cy: Y(0), r: 3.6, fill: '#fff', stroke: '#6d28d9', 'stroke-width': 1.6 }, svg);
      line(svg, X(-0.422) - 5, Y(0) - 6, X(-0.62), Y(-0.86), { stroke: '#c4b5fd', w: 1, dash: '3 2' });
      text(svg, X(-0.66), Y(-0.95), 'd=-0.422（K*=0.385）', { anchor: 'end', size: 9, fill: '#6d28d9' });
      [1, -1].forEach(function (sg) {
        mk('circle', { cx: X(0), cy: Y(1.414 * sg), r: 3.6, fill: '#fff', stroke: '#be123c', 'stroke-width': 1.6 }, svg);
      });
      line(svg, X(0) + 4, Y(1.414) + 6, X(-0.55), Y(2.12), { stroke: '#f3b4b4', w: 1, dash: '3 2' });
      text(svg, X(-0.6), Y(2.2), 'K*=6：穿越虚轴 ±j1.414', { anchor: 'end', size: 9, fill: '#be123c', weight: 600 });

      // 当前极点
      var ps = polesOf(st.k);
      ps.forEach(function (p) {
        mk('circle', { cx: X(p.re), cy: Y(p.im), r: 5.5, fill: '#fff', stroke: '#16357f', 'stroke-width': 2 }, svg);
      });
    }

    function simulate(k, Tn) {
      var dt = 0.004, n = Math.round(Tn / dt), y = [0, 0, 0], pts = [], i;
      function der(v) { return [v[1], v[2], -k * v[0] - 2 * v[1] - 3 * v[2] + k]; }
      function step(v, d, h) { return [v[0] + d[0] * h, v[1] + d[1] * h, v[2] + d[2] * h]; }
      for (i = 0; i <= n; i++) {
        pts.push([i * dt, y[0]]);
        var k1 = der(y), k2 = der(step(y, k1, dt / 2)), k3 = der(step(y, k2, dt / 2)), k4 = der(step(y, k3, dt));
        y = [y[0] + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
             y[1] + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
             y[2] + dt / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2])];
      }
      return pts;
    }

    function drawAll() {
      drawLocus();
      var ps = polesOf(st.k);
      var dom = ps[0], j;
      for (j = 1; j < 3; j++) if (ps[j].re > dom.re) dom = ps[j];
      var stable = Math.max(ps[0].re, ps[1].re, ps[2].re) < -1e-4;
      var edge = Math.abs(Math.max(ps[0].re, ps[1].re, ps[2].re)) <= 1e-3;

      var reMax = Math.max(ps[0].re, ps[1].re, ps[2].re);
      var Tmax = reMax < -0.06 ? clamp(6 / -reMax, 8, 30) : 12;
      var pts = simulate(st.k, Tmax);
      clear(rsvg);
      // 复用统一时间图（重新采样，避免刻度不一致）
      drawTime(rsvg, function (t) {
        var idx = Math.min(pts.length - 1, Math.round(t / 0.004));
        return pts[idx][1];
      }, Tmax, { color: stable ? '#1d4ed8' : '#b91c1c', marks: [] });

      var pTxt = ps.map(function (p) {
        return Math.abs(p.im) < 0.005 ? p.re.toFixed(2) : p.re.toFixed(2) + '±j' + Math.abs(p.im).toFixed(2);
      }).filter(function (v, idx, arr) { return arr.indexOf(v) === idx; }).join(', ');

      var cells = [chip('K*', st.k.toFixed(3)), chip('闭环极点', pTxt)];
      if (Math.abs(dom.im) > 0.005 && dom.re < 0) {
        var z = -dom.re / Math.sqrt(dom.re * dom.re + dom.im * dom.im);
        var sig = Math.exp(-Math.PI * z / Math.sqrt(1 - z * z)) * 100;
        cells.push(chip('主导 ζ', z.toFixed(3)));
        cells.push(chip('σ%', sig.toFixed(1) + '%'));
        cells.push(chip('ts', (3.5 / -dom.re).toFixed(2) + ' <small>s</small>'));
      } else if (Math.abs(dom.im) < 0.005 && dom.re < 0) {
        cells.push(chip('主导极点', '实数 ' + dom.re.toFixed(2)));
        cells.push(chip('σ%', '0'));
        cells.push(chip('ts', (3.5 / -dom.re).toFixed(2) + ' <small>s</small>'));
      } else {
        cells.push(chip('σ%', '—'));
        cells.push(chip('ts', '—'));
      }
      read.innerHTML = cells.join('');

      var v = document.getElementById('rlVerdict');
      if (edge) {
        v.className = 'figx-verdict bad';
        v.textContent = 'K* = 6：一对闭环极点落在虚轴 ±j1.414 上，临界稳定，输出为等幅振荡（图中蓝色曲线不衰减）。';
      } else if (stable) {
        v.className = 'figx-verdict ok';
        v.textContent = '闭环稳定（三个极点实部均为负）。K* 增大时复数极点向虚轴靠近，振荡加剧；K* < 0.385 时为三个负实根，无超调。';
      } else {
        v.className = 'figx-verdict bad';
        v.textContent = '闭环不稳定：复数极点已越过虚轴进入右半平面，阶跃响应发散。临界增益就由“轨迹与虚轴的交点”给出。';
      }
      if (note) note.textContent = '拖动滑块时，左图的空心圈沿根轨迹移动，右图就是该 K* 下闭环系统的真实阶跃响应（数值积分，不是示意图）。';
      if (kOut) kOut.textContent = st.k.toFixed(2);
      if (kr) kr.value = st.k;
    }

    if (kr) kr.addEventListener('input', function () { st.k = +kr.value; drawAll(); });
    [].slice.call(document.querySelectorAll('[data-rlk]')).forEach(function (b) {
      b.addEventListener('click', function () {
        st.k = +b.getAttribute('data-rlk');
        drawAll();
      });
    });
    drawAll();
  })();

  /* =========================================================
     3. Bode 图：拖动增益 K
     ========================================================= */
  (function () {
    var svg = document.getElementById('bodeSvg');
    if (!svg) return;
    var kr = document.getElementById('bodeK'), kOut = document.getElementById('bodeKOut');
    var read = document.getElementById('bodeRead'), verdict = document.getElementById('bodeVerdict');
    var st = { K: 10 }, T1 = 0.1, T2 = 0.01;
    var W = 820, H = 500, L = 64, R = 20, T = 24, B = 42;
    var iw = W - L - R;
    var magY0 = 30, magY1 = 232, phY0 = 282, phY1 = 462;
    function X(w) { return L + (Math.log10(w) + 1) / 4 * iw; }
    function YL(v) { return magY1 - (v + 100) / 160 * (magY1 - magY0); }
    function YP(v) { return phY0 + (-v) / 270 * (phY1 - phY0); }

    function mag(w) { return st.K / (w * Math.sqrt(1 + T1 * T1 * w * w) * Math.sqrt(1 + T2 * T2 * w * w)); }
    function phase(w) { return -90 - Math.atan(T1 * w) * 180 / Math.PI - Math.atan(T2 * w) * 180 / Math.PI; }
    function Ldb(w) { return 20 * Math.log10(mag(w)); }

    function cross(f, target, lo, hi) {
      var a = lo, b = hi, fa = f(a) - target, i, m, fm;
      for (i = 0; i < 80; i++) {
        m = Math.sqrt(a * b); fm = f(m) - target;
        if (fa * fm <= 0) b = m; else { a = m; fa = fm; }
      }
      return Math.sqrt(a * b);
    }

    function draw() {
      clear(svg);
      var wc = cross(mag, 1, 0.1, 1000);
      var wg = cross(function (w) { return phase(w) + 180; }, 0, 0.1, 1000);
      var gam = 180 + phase(wc), kg = -Ldb(wg);

      // 网格
      for (var d = -1; d <= 3; d++) {
        var x = X(Math.pow(10, d));
        line(svg, x, magY0, x, magY1, { stroke: '#f0f4fa', w: 1 });
        line(svg, x, phY0, x, phY1, { stroke: '#f0f4fa', w: 1 });
        text(svg, x, phY1 + 18, d === 0 ? '1' : '10' + ['⁻¹', '', '¹', '²', '³'][d + 1], { anchor: 'middle', size: 10, fill: '#94a3b8' });
      }
      text(svg, W - R, H - 8, 'ω / (rad/s)', { anchor: 'end', size: 10.5, fill: '#64748b' });
      [-80, -40, 0, 40].forEach(function (v) {
        line(svg, L, YL(v), W - R, YL(v), { stroke: v === 0 ? '#94a3b8' : '#eef2f8', w: v === 0 ? 1.2 : 1 });
        text(svg, L - 8, YL(v) + 4, '' + v, { anchor: 'end', size: 10, fill: '#94a3b8' });
      });
      [0, -90, -180, -270].forEach(function (v) {
        line(svg, L, YP(v), W - R, YP(v), { stroke: v === -180 ? '#f0b48a' : '#eef2f8', w: v === -180 ? 1.2 : 1 });
        text(svg, L - 8, YP(v) + 4, '' + v, { anchor: 'end', size: 10, fill: '#94a3b8' });
      });
      text(svg, L - 46, magY0 + 12, 'L / dB', { size: 10.5, fill: '#64748b' });
      text(svg, L - 46, phY0 + 12, 'φ / °', { size: 10.5, fill: '#64748b' });

      // 曲线
      var d1 = '', d2 = '', w, i, pen = false;
      for (i = 0; i <= 700; i++) {
        w = Math.pow(10, -1 + 4 * i / 700);
        var lv = Ldb(w);
        if (lv < -100 || lv > 60) { pen = false; } else {
          d1 += (pen ? 'L' : 'M') + X(w).toFixed(1) + ',' + YL(lv).toFixed(1);
          pen = true;
        }
        d2 += (i ? 'L' : 'M') + X(w).toFixed(1) + ',' + YP(phase(w)).toFixed(1);
      }
      mk('path', { d: d1, fill: 'none', stroke: '#1d4ed8', 'stroke-width': 2.2 }, svg);
      mk('path', { d: d2, fill: 'none', stroke: '#b45309', 'stroke-width': 2.2 }, svg);

      // ωc
      line(svg, X(wc), magY0, X(wc), phY1, { stroke: '#0f766e', w: 1, dash: '4 4' });
      mk('circle', { cx: X(wc), cy: YL(0), r: 4, fill: '#0f766e' }, svg);
      mk('circle', { cx: X(wc), cy: YP(phase(wc)), r: 4, fill: '#0f766e' }, svg);
      text(svg, X(wc) + 6, YL(0) - 8, 'ωc=' + wc.toFixed(2), { size: 10, fill: '#0f766e', weight: 700 });
      // γ
      line(svg, X(wc), YP(-180), X(wc), YP(phase(wc)), { stroke: '#0f766e', w: 3, op: .35 });
      text(svg, X(wc) - 7, (YP(-180) + YP(phase(wc))) / 2 + 4, 'γ=' + gam.toFixed(1) + '°', { anchor: 'end', size: 10, fill: '#0f766e', weight: 700 });

      // ωg
      line(svg, X(wg), magY0, X(wg), phY1, { stroke: '#be123c', w: 1, dash: '4 4' });
      mk('circle', { cx: X(wg), cy: YP(-180), r: 4, fill: '#be123c' }, svg);
      mk('circle', { cx: X(wg), cy: YL(Ldb(wg)), r: 4, fill: '#be123c' }, svg);
      text(svg, X(wg) - 6, phY1 - 8, 'ωg=' + wg.toFixed(1), { anchor: 'end', size: 10, fill: '#be123c', weight: 700 });
      line(svg, X(wg), YL(0), X(wg), YL(Ldb(wg)), { stroke: '#be123c', w: 3, op: .35 });
      text(svg, X(wg) - 8, YL(Ldb(wg)) + 18, 'Kg=' + kg.toFixed(1) + ' dB', { anchor: 'end', size: 10, fill: '#be123c', weight: 700 });

      read.innerHTML = chip('开环增益 K', st.K.toFixed(1)) + chip('剪切频率 ωc', wc.toFixed(2) + ' <small>rad/s</small>') +
        chip('相位裕度 γ', gam.toFixed(1) + '°') + chip('交界频率 ωg', wg.toFixed(2) + ' <small>rad/s</small>') +
        chip('幅值裕度 Kg', kg.toFixed(1) + ' dB');
      if (gam > 0 && kg > 0) {
        verdict.className = 'figx-verdict ok';
        verdict.textContent = '闭环稳定：γ = ' + gam.toFixed(1) + '° > 0，Kg = ' + kg.toFixed(1) + ' dB > 0。K 增大时整条 L(ω) 上移，ωc 右移、γ 减小——这正是“增益不能无限调大”的频域解释。';
      } else {
        verdict.className = 'figx-verdict bad';
        verdict.textContent = '闭环不稳定：γ = ' + gam.toFixed(1) + '°，Kg = ' + kg.toFixed(1) + ' dB（须同时为正）。把 K 调小，使 L(ω) 下移、ωc 左移即可恢复稳定。';
      }
      if (kOut) kOut.textContent = st.K < 10 ? st.K.toFixed(1) : Math.round(st.K).toString();
      if (kr) kr.value = Math.log10(st.K);
    }
    if (kr) kr.addEventListener('input', function () { st.K = Math.pow(10, +kr.value); draw(); });
    draw();
  })();

  /* =========================================================
     4. Nyquist 图：增益缩放与 (-1,j0) 的关系
     ========================================================= */
  (function () {
    var svg = document.getElementById('nyqSvg');
    if (!svg) return;
    var kr = document.getElementById('nyqK'), kOut = document.getElementById('nyqKOut');
    var read = document.getElementById('nyqRead'), verdict = document.getElementById('nyqVerdict');
    var st = { K: 10 }, T1 = 0.1, T2 = 0.01;
    var W = 640, H = 520, L = 62, R = 22, T = 24, B = 42;
    var iw = W - L - R, ih = H - T - B;
    var XR = [-2.55, 0.55], YR = [-4.6, 1.15];
    function X(v) { return L + (v - XR[0]) / (XR[1] - XR[0]) * iw; }
    function Y(v) { return T + ih - (v - YR[0]) / (YR[1] - YR[0]) * ih; }
    function G(w) {
      var a = T1 * w, b = T2 * w;
      var dr = -w * (a + b), di = w * (1 - a * b), dd = dr * dr + di * di;
      return { re: st.K * dr / dd, im: -st.K * di / dd };
    }

    function draw() {
      clear(svg);
      line(svg, X(XR[0]), Y(0), X(XR[1]), Y(0), { stroke: '#94a3b8', w: 1.1 });
      line(svg, X(0), Y(YR[0]), X(0), Y(YR[1]), { stroke: '#94a3b8', w: 1.1 });
      [-2].forEach(function (v) {
        line(svg, X(v), Y(0) - 3, X(v), Y(0) + 3, { stroke: '#94a3b8', w: 1 });
        text(svg, X(v), Y(0) + 15, '' + v, { anchor: 'middle', size: 10, fill: '#94a3b8' });
      });
      text(svg, X(XR[1]) - 2, Y(0) - 8, 'Re', { anchor: 'end', size: 10.5, fill: '#64748b' });
      text(svg, X(0) + 7, Y(YR[1]) + 24, 'Im', { size: 10.5, fill: '#64748b' });

      // 单位圆参考
      var dc = '';
      for (var i = 0; i <= 90; i++) {
        var a = Math.PI * i / 90;
        dc += (i ? 'L' : 'M') + X(Math.cos(a)).toFixed(1) + ',' + Y(Math.sin(a)).toFixed(1);
      }
      mk('path', { d: dc, fill: 'none', stroke: '#eef2f8', 'stroke-width': 1, 'stroke-dasharray': '4 4' }, svg);

      // 正频率曲线（裁剪）
      function branch(sign) {
        var d = '', pen = false;
        for (var j = 0; j <= 1200; j++) {
          var w = 0.35 * Math.pow(3000 / 0.35, j / 1200);
          var p = G(w); p.im *= sign;
          if (p.re < XR[0] - 0.2 || p.re > XR[1] || p.im < YR[0] || p.im > YR[1]) { pen = false; continue; }
          d += (pen ? 'L' : 'M') + X(p.re).toFixed(1) + ',' + Y(p.im).toFixed(1);
          pen = true;
        }
        return d;
      }
      mk('path', { d: branch(-1), fill: 'none', stroke: '#c7d6ee', 'stroke-width': 1.2, 'stroke-dasharray': '5 4' }, svg);
      mk('path', { d: branch(1), fill: 'none', stroke: '#1d4ed8', 'stroke-width': 2.1 }, svg);

      // 负实轴交点
      var xc = -st.K / 110;
      if (xc > XR[0]) {
        mk('circle', { cx: X(xc), cy: Y(0), r: 4.2, fill: '#d97706' }, svg);
        text(svg, X(xc) - 7, Y(0) - 8, '−K/110 = ' + xc.toFixed(2), { anchor: 'end', size: 10, fill: '#b45309', weight: 600 });
      }

      // (-1,0)
      mk('circle', { cx: X(-1), cy: Y(0), r: 5, fill: 'none', stroke: '#b91c1c', 'stroke-width': 2 }, svg);
      mk('line', { x1: X(-1) - 7, y1: Y(0) - 7, x2: X(-1) + 7, y2: Y(0) + 7, stroke: '#b91c1c', 'stroke-width': 1.6 }, svg);
      mk('line', { x1: X(-1) - 7, y1: Y(0) + 7, x2: X(-1) + 7, y2: Y(0) - 7, stroke: '#b91c1c', 'stroke-width': 1.6 }, svg);
      text(svg, X(-1) - 6, Y(0) - 18, '(−1, j0)', { anchor: 'end', size: 10.5, fill: '#b91c1c', weight: 700 });


      text(svg, X(-1.18), Y(-3.9), '曲线自 −j∞ 方向进入（ω→0⁺）', { anchor: 'end', size: 9.5, fill: '#9aa6b8' });
      read.innerHTML = chip('开环增益 K', st.K.toFixed(0)) + chip('负实轴交点', xc.toFixed(2)) +
        chip('临界增益', '110') + chip('幅值裕度', (20 * Math.log10(110 / st.K)).toFixed(1) + ' dB');
      var stable = st.K < 110;
      verdict.className = 'figx-verdict ' + (stable ? 'ok' : 'bad');
      verdict.textContent = stable
        ? '曲线在 (−1, j0) 右侧穿过负实轴（交点 ' + xc.toFixed(2) + ' > −1），不包围该点：N = 0，P = 0 ⇒ Z = 0，闭环稳定。K 增大到 110 时曲线恰好穿过 (−1, j0)，即临界状态。'
        : '交点已移到 −1 左侧，曲线包围 (−1, j0)：N = 1，Z = P − 2N = 2，闭环有两个右半平面极点。把 K 降到 110 以下即可稳定。';
      if (kOut) kOut.textContent = st.K.toFixed(0);
      if (kr) kr.value = st.K;
    }
    if (kr) kr.addEventListener('input', function () { st.K = +kr.value; draw(); });
    draw();
  })();

  /* =========================================================
     5. 相平面：点击发射轨迹
     ========================================================= */
  (function () {
    var svg = document.getElementById('phaseSvg');
    if (!svg) return;
    var zr = document.getElementById('phaseZ'), zOut = document.getElementById('phaseZOut');
    var read = document.getElementById('phaseRead'), verdict = document.getElementById('phaseVerdict');
    var st = { z: 0.2, trails: [] };
    var W = 560, H = 500, L = 54, R = 18, T = 22, B = 44;
    var iw = W - L - R, ih = H - T - B;
    var XR = [-3, 3], YR = [-2.67, 2.67];
    var colors = ['#1d4ed8', '#0f766e', '#b45309', '#6d28d9', '#be123c'];
    function X(v) { return L + (v - XR[0]) / (XR[1] - XR[0]) * iw; }
    function Y(v) { return T + ih - (v - YR[0]) / (YR[1] - YR[0]) * ih; }

    function field() {
      var i, j, x, v, dx, dv, len, ux, uv;
      for (i = 0; i <= 12; i++) {
        for (j = 0; j <= 10; j++) {
          x = -2.75 + 5.5 * i / 12;
          v = -2.45 + 4.9 * j / 10;
          dx = v; dv = -x - 2 * st.z * v;
          len = Math.sqrt(dx * dx + dv * dv);
          if (len < 1e-6) continue;
          ux = dx / len * 0.15; uv = dv / len * 0.15;
          line(svg, X(x), Y(v), X(x + ux), Y(v + uv), { stroke: '#dbe6f5', w: 1.1 });
          line(svg, X(x + ux), Y(v + uv), X(x + ux - 0.05 * ux / 0.15 + 0.03 * uv / 0.15), Y(v + uv - 0.05 * uv / 0.15 - 0.03 * ux / 0.15), { stroke: '#dbe6f5', w: 1 });
          line(svg, X(x + ux), Y(v + uv), X(x + ux - 0.05 * ux / 0.15 - 0.03 * uv / 0.15), Y(v + uv - 0.05 * uv / 0.15 + 0.03 * ux / 0.15), { stroke: '#dbe6f5', w: 1 });
        }
      }
    }

    function integrate(x0, v0) {
      var dt = 0.006, n = 2600, y = [x0, v0], pts = [[x0, v0]], i;
      function der(p) { return [p[1], -p[0] - 2 * st.z * p[1]]; }
      function step(p, d, h) { return [p[0] + d[0] * h, p[1] + d[1] * h]; }
      for (i = 0; i < n; i++) {
        var k1 = der(y), k2 = der(step(y, k1, dt / 2)), k3 = der(step(y, k2, dt / 2)), k4 = der(step(y, k3, dt));
        y = [y[0] + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
             y[1] + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
        if (!isFinite(y[0]) || Math.abs(y[0]) > 6 || Math.abs(y[1]) > 6) break;
        pts.push([y[0], y[1]]);
      }
      return pts;
    }

    function typeOf() {
      var z = st.z;
      if (Math.abs(z) < 1e-6) return ['中心点', '一对纯虚根 ±jωn，相轨迹是闭合椭圆，临界稳定。', 'ok'];
      if (z < 0) return [Math.abs(z) < 1 ? '不稳定焦点' : '不稳定节点', '特征根实部为正，轨迹向外发散——系统不稳定。', 'bad'];
      if (z < 1) return ['稳定焦点', '共轭复根且实部为负，轨迹是向原点收敛的螺旋线。', 'ok'];
      if (Math.abs(z - 1) < 1e-6) return ['稳定节点（临界）', '一对相等的负实根，轨迹沿抛物线方向汇入原点，无振荡。', 'ok'];
      return ['稳定节点', '两个不相等的负实根，轨迹直接汇入原点，无振荡。', 'ok'];
    }

    function draw() {
      clear(svg);
      // 网格
      for (var g = -2; g <= 2; g++) {
        line(svg, X(g), Y(YR[0]), X(g), Y(YR[1]), { stroke: '#f4f7fb', w: 1 });
        line(svg, X(XR[0]), Y(g), X(XR[1]), Y(g), { stroke: '#f4f7fb', w: 1 });
      }
      field();
      line(svg, X(XR[0]), Y(0), X(XR[1]), Y(0), { stroke: '#94a3b8', w: 1.1 });
      line(svg, X(0), Y(YR[0]), X(0), Y(YR[1]), { stroke: '#94a3b8', w: 1.1 });
      [-2, -1, 1, 2].forEach(function (v) {
        text(svg, X(v), Y(0) + 15, '' + v, { anchor: 'middle', size: 10, fill: '#94a3b8' });
        text(svg, X(0) - 7, Y(v) + 4, '' + v, { anchor: 'end', size: 10, fill: '#94a3b8' });
      });
      text(svg, X(XR[1]) - 2, Y(0) - 8, 'x', { anchor: 'end', size: 11, fill: '#64748b' });
      text(svg, X(0) + 7, Y(YR[1]) + 24, 'ẋ', { size: 11, fill: '#64748b' });

      st.trails.forEach(function (tr, i) {
        var c = colors[i % colors.length], d = '', pen = false;
        tr.forEach(function (p) {
          if (p[0] < XR[0] || p[0] > XR[1] || p[1] < YR[0] || p[1] > YR[1]) { pen = false; return; }
          d += (pen ? 'L' : 'M') + X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1);
          pen = true;
        });
        mk('path', { d: d, fill: 'none', stroke: c, 'stroke-width': 1.8, 'stroke-opacity': .9 }, svg);
        mk('circle', { cx: X(tr[0][0]), cy: Y(tr[0][1]), r: 4, fill: c }, svg);
      });

      // 奇点
      mk('circle', { cx: X(0), cy: Y(0), r: 4.5, fill: '#fff', stroke: '#16357f', 'stroke-width': 2 }, svg);
      text(svg, X(0) + 10, Y(0) + 16, '奇点', { size: 10, fill: '#16357f' });

      var tp = typeOf();
      read.innerHTML = chip('阻尼比 ζ', st.z.toFixed(2)) + chip('特征根', st.z * st.z < 1 ? (-st.z).toFixed(2) + '±j' + Math.sqrt(1 - st.z * st.z).toFixed(2) : (function () {
        var s = Math.sqrt(st.z * st.z - 1);
        return (-st.z + s).toFixed(2) + ', ' + (-st.z - s).toFixed(2);
      })()) + chip('奇点类型', tp[0]);
      verdict.className = 'figx-verdict ' + tp[2];
      verdict.textContent = tp[1];
      if (zOut) zOut.textContent = st.z.toFixed(2);
      if (zr) zr.value = st.z;
    }

    function launch(ev) {
      var r = svg.getBoundingClientRect();
      var sx = (ev.clientX - r.left) / r.width * W;
      var sy = (ev.clientY - r.top) / r.height * H;
      var x = (sx - L) / iw * (XR[1] - XR[0]) + XR[0];
      var v = (T + ih - sy) / ih * (YR[1] - YR[0]) + YR[0];
      if (x < XR[0] || x > XR[1] || v < YR[0] || v > YR[1]) return;
      st.trails.push(integrate(x, v));
      if (st.trails.length > 5) st.trails.shift();
      draw();
    }
    svg.addEventListener('pointerdown', function (e) { launch(e); e.preventDefault(); });
    if (zr) zr.addEventListener('input', function () { st.z = +zr.value; st.trails = []; draw(); });
    var cb = document.getElementById('phaseClear');
    if (cb) cb.addEventListener('click', function () { st.trails = []; draw(); });
    draw();
    // 初始示范
    st.trails.push(integrate(2.2, 0)); draw();
  })();

  /* =========================================================
     6. 校正装置：a 与 T 对 Bode 的影响
     ========================================================= */
  (function () {
    var svg = document.getElementById('compSvg');
    if (!svg) return;
    var ar = document.getElementById('compA'), tr = document.getElementById('compT');
    var aOut = document.getElementById('compAOut'), tOut = document.getElementById('compTOut');
    var read = document.getElementById('compRead'), note = document.getElementById('compNote');
    var st = { mode: 'lead', p: 4, T: 0.5 };
    var W = 760, H = 430, L = 60, R = 20, T = 24, B = 40;
    var iw = W - L - R;
    var magY0 = 28, magY1 = 196, phY0 = 246, phY1 = 396;
    function X(w) { return L + (Math.log10(w) + 2) / 5 * iw; }
    function YL(v) { return magY1 - (v + 30) / 60 * (magY1 - magY0); }
    function YP(v) { return phY0 + (60 - v) / 120 * (phY1 - phY0); }
    function alpha() { return st.mode === 'lead' ? st.p : 1 / st.p; }

    function mag(w) {
      var a = alpha() * st.T * w, b = st.T * w;
      return Math.sqrt(1 + a * a) / Math.sqrt(1 + b * b);
    }
    function phase(w) {
      var a = alpha() * st.T * w, b = st.T * w;
      return (Math.atan(a) - Math.atan(b)) * 180 / Math.PI;
    }

    function draw() {
      clear(svg);
      var al = alpha(), wm = 1 / (st.T * Math.sqrt(al));
      var pm = Math.asin((al - 1) / (al + 1)) * 180 / Math.PI;

      for (var d = -2; d <= 3; d++) {
        var x = X(Math.pow(10, d));
        line(svg, x, magY0, x, magY1, { stroke: '#f2f5fa', w: 1 });
        line(svg, x, phY0, x, phY1, { stroke: '#f2f5fa', w: 1 });
        text(svg, x, phY1 + 17, d === 0 ? '1' : '10' + ['⁻²', '⁻¹', '', '¹', '²', '³'][d + 2], { anchor: 'middle', size: 10, fill: '#94a3b8' });
      }
      text(svg, W - R, H - 8, 'ω / (rad/s)', { anchor: 'end', size: 10.5, fill: '#64748b' });
      [-20, -10, 0, 10, 20].forEach(function (v) {
        line(svg, L, YL(v), W - R, YL(v), { stroke: v === 0 ? '#94a3b8' : '#eef2f8', w: v === 0 ? 1.2 : 1 });
        text(svg, L - 8, YL(v) + 4, '' + v, { anchor: 'end', size: 10, fill: '#94a3b8' });
      });
      [60, 30, 0, -30, -60].forEach(function (v) {
        line(svg, L, YP(v), W - R, YP(v), { stroke: v === 0 ? '#94a3b8' : '#eef2f8', w: 1 });
        text(svg, L - 8, YP(v) + 4, '' + v, { anchor: 'end', size: 10, fill: '#94a3b8' });
      });
      text(svg, L - 44, magY0 + 12, 'Lc / dB', { size: 10.5, fill: '#64748b' });
      text(svg, L - 44, phY0 - 6, 'φc / °', { size: 10.5, fill: '#64748b' });

      var d1 = '', d2 = '', i, w;
      for (i = 0; i <= 600; i++) {
        w = Math.pow(10, -2 + 5 * i / 600);
        d1 += (i ? 'L' : 'M') + X(w).toFixed(1) + ',' + YL(20 * Math.log10(mag(w))).toFixed(1);
        d2 += (i ? 'L' : 'M') + X(w).toFixed(1) + ',' + YP(phase(w)).toFixed(1);
      }
      mk('path', { d: d1, fill: 'none', stroke: '#1d4ed8', 'stroke-width': 2.2 }, svg);
      mk('path', { d: d2, fill: 'none', stroke: '#b45309', 'stroke-width': 2.2 }, svg);

      line(svg, X(wm), magY0, X(wm), phY1, { stroke: '#0f766e', w: 1, dash: '4 4' });
      mk('circle', { cx: X(wm), cy: YP(pm), r: 4.2, fill: '#0f766e' }, svg);
      text(svg, X(wm) + 6, YP(pm) - 8, 'ωm=' + wm.toFixed(2), { size: 10, fill: '#0f766e', weight: 600 });
      line(svg, X(wm), YP(0), X(wm), YP(pm), { stroke: '#0f766e', w: 3, op: .3 });
      text(svg, X(wm) + 7, (YP(0) + YP(pm)) / 2, 'φm=' + pm.toFixed(1) + '°', { size: 10, fill: '#0f766e', weight: 700 });

      read.innerHTML = chip(st.mode === 'lead' ? 'a' : 'β', st.p.toFixed(1)) + chip('T', st.T.toFixed(2) + ' <small>s</small>') +
        chip('ωm', wm.toFixed(2) + ' <small>rad/s</small>') + chip('φm', pm.toFixed(1) + '°') +
        chip('高频增益', (20 * Math.log10(al)).toFixed(1) + ' dB');
      if (note) {
        note.innerHTML = st.mode === 'lead'
          ? '<b>超前：</b>φm = arcsin[(a−1)/(a+1)] 随 a 增大而增大，但 a > 10 后收益递减（a=10 约 55°，a=20 仅 62°），且高频增益抬升 20lg a 会放大噪声。T 只改变 ωm 的位置，不改变 φm。'
          : '<b>滞后：</b>φm 为负值，最大滞后角出现在 ωm；它的作用不是“加相位”，而是<b>把中高频增益压低 20lg β</b>，使剪切频率左移，从而在原 ωc 附近保住相位裕度。T 增大使 ωm 左移、滞后更早出现。';
      }
      if (aOut) aOut.textContent = st.p.toFixed(1);
      if (tOut) tOut.textContent = st.T.toFixed(2);
      var albl = document.getElementById('compALabel');
      if (albl) albl.textContent = st.mode === 'lead' ? 'a' : 'β';
      if (ar) ar.value = st.p;
      if (tr) tr.value = st.T;
    }

    if (ar) ar.addEventListener('input', function () { st.p = +ar.value; draw(); });
    if (tr) tr.addEventListener('input', function () { st.T = +tr.value; draw(); });
    [].slice.call(document.querySelectorAll('[data-comp]')).forEach(function (b) {
      b.addEventListener('click', function () {
        st.mode = b.getAttribute('data-comp');
        st.p = st.mode === 'lead' ? 4 : 5;
        [].slice.call(document.querySelectorAll('[data-comp]')).forEach(function (x) { x.classList.toggle('on', x === b); });
        if (ar) { ar.min = 1.2; ar.max = 20; ar.step = 0.1; }
        draw();
      });
    });
    draw();
  })();

  /* =========================================================
     7. 稳态误差矩阵：点一格看结论
     ========================================================= */
  (function () {
    var tbl = document.getElementById('errTable');
    if (!tbl) return;
    var kr = document.getElementById('errK'), kOut = document.getElementById('errKOut');
    var detail = document.getElementById('errDetail');
    var st = { K: 10, row: 1, col: 1 };

    var names = ['阶跃 r=1', '斜坡 r=t', '抛物线 r=t²/2'];
    var types = ['0 型', 'I 型', 'II 型'];
    var grid = [
      ['1/(1+K)', '∞', '∞'],
      ['0', '1/K', '∞'],
      ['0', '0', '1/K']
    ];

    function val(r, c) {
      var g = grid[r][c];
      if (g === '0') return '0';
      if (g === '∞') return '∞';
      if (g === '1/(1+K)') return (1 / (1 + st.K)).toFixed(3);
      return (1 / st.K).toFixed(3);
    }

    function render() {
      var html = '<thead><tr><th style="width:22%">型别 \\ 输入</th>';
      for (var c = 0; c < 3; c++) html += '<th>' + names[c] + '</th>';
      html += '</tr></thead><tbody>';
      for (var r = 0; r < 3; r++) {
        html += '<tr><td><b>' + types[r] + '</b></td>';
        for (c = 0; c < 3; c++) {
          var cls = 'emat ' + (grid[r][c] === '0' ? 'zero' : (grid[r][c] === '∞' ? 'inf' : 'const'));
          if (r === st.row && c === st.col) cls += ' sel';
          html += '<td class="' + cls + '" data-r="' + r + '" data-c="' + c + '">' + val(r, c) + '</td>';
        }
        html += '</tr>';
      }
      html += '</tbody>';
      tbl.innerHTML = html;
      [].slice.call(tbl.querySelectorAll('td[data-r]')).forEach(function (td) {
        td.addEventListener('click', function () {
          st.row = +td.getAttribute('data-r');
          st.col = +td.getAttribute('data-c');
          render();
        });
      });
      var r = st.row, c = st.col, v = val(r, c);
      var kind = grid[r][c];
      var msg;
      if (kind === '0') msg = '能完全跟上：输入的变化被积分环节“记住”，稳态误差为 0。';
      else if (kind === '∞') msg = '跟不上：误差随时间无限增大（系统型别低于输入阶次），这种输入下谈“稳态误差”没有意义。';
      else msg = '差一个常数：型别正好低一阶，误差与开环增益成反比，K 越大误差越小。';
      detail.innerHTML = '<b>' + types[r] + ' 系统 · ' + names[c] + '：</b> e<sub>ss</sub> = ' + v +
        '（K = ' + st.K.toFixed(0) + '）　' + msg;
      if (kOut) kOut.textContent = st.K.toFixed(0);
    }
    if (kr) kr.addEventListener('input', function () { st.K = +kr.value; render(); });
    render();
  })();


  /* =========================================================
     8. 离散系统：采样周期 T 与增益 K 对 z 极点的影响
     ========================================================= */
  (function () {
    var svg = document.getElementById('zplSvg'), rsvg = document.getElementById('zplResp');
    if (!svg || !rsvg) return;
    var kr = document.getElementById('zplK'), tr = document.getElementById('zplT');
    var kOut = document.getElementById('zplKOut'), tOut = document.getElementById('zplTOut');
    var read = document.getElementById('zplRead'), verdict = document.getElementById('zplVerdict');
    var st = { K: 1, T: 1 };

    function dat() {
      var a = Math.exp(-st.T), z = a - st.K * (1 - a);
      return { a: a, z: z, kmax: (1 + a) / (1 - a) };
    }

    function drawZp() {
      clear(svg);
      var W = 400, H = 400, L = 36, R = 36, T = 26, B = 38;
      var iw = W - L - R, ih = H - T - B;
      var d = dat(), rr = Math.max(1.35, Math.abs(d.z) * 1.12);
      function X(v) { return L + (v + rr) / (2 * rr) * iw; }
      function Y(v) { return T + ih - (v + rr) / (2 * rr) * ih; }

      line(svg, X(-rr), Y(0), X(rr), Y(0), { stroke: '#94a3b8', w: 1.1 });
      line(svg, X(0), Y(-rr), X(0), Y(rr), { stroke: '#94a3b8', w: 1.1 });
      if (rr < 3) [-1, 1].forEach(function (v) {
        line(svg, X(v), Y(0) - 3, X(v), Y(0) + 3, { stroke: '#94a3b8', w: 1 });
        text(svg, X(v), Y(0) + 15, '' + v, { anchor: 'middle', size: 9.5, fill: '#94a3b8' });
      });
      text(svg, X(rr) - 4, Y(0) - 8, 'Re', { anchor: 'end', size: 10, fill: '#64748b' });
      text(svg, X(0) + 7, Y(rr) + 16, 'Im', { size: 10, fill: '#64748b' });

      // 单位圆
      var dc = '', i, a;
      for (i = 0; i <= 120; i++) {
        a = 2 * Math.PI * i / 120;
        dc += (i ? 'L' : 'M') + X(Math.cos(a)).toFixed(1) + ',' + Y(Math.sin(a)).toFixed(1);
      }
      mk('path', { d: dc, fill: 'none', stroke: '#0f766e', 'stroke-width': 1.4, 'stroke-dasharray': '5 4' }, svg);
      text(svg, X(0.72), Y(0.78), '|z|=1', { size: 10, fill: '#0f766e' });

      // 极点
      var inside = Math.abs(d.z) < 1;
      mk('circle', { cx: X(d.z), cy: Y(0), r: 6, fill: inside ? '#0f766e' : '#b91c1c', stroke: '#fff', 'stroke-width': 2 }, svg);
      var lx = X(d.z), right = d.z >= 0;
      text(svg, lx + (right ? 9 : -9), Y(0) - 9, 'z=' + d.z.toFixed(2), { anchor: right ? 'start' : 'end', size: 10, fill: inside ? '#0f766e' : '#b91c1c', weight: 700 });
      if (Math.abs(d.z) > 1.02) text(svg, lx + (right ? 9 : -9), Y(0) + 16, '圆外 ' + Math.abs(d.z).toFixed(2) + ' 倍', { anchor: right ? 'start' : 'end', size: 9, fill: '#b91c1c' });

      read.innerHTML = chip('采样周期 T', st.T.toFixed(2) + ' <small>s</small>') + chip('a = e⁻ᵀ', d.a.toFixed(3)) +
        chip('闭环极点 z', d.z.toFixed(3)) + chip('|z|', Math.abs(d.z).toFixed(3)) +
        chip('临界增益 Kmax', d.kmax.toFixed(2)) + chip('稳态输出', (st.K / (1 + st.K)).toFixed(3));
      var ok = Math.abs(d.z) < 1 - 1e-9;
      verdict.className = 'figx-verdict ' + (ok ? 'ok' : 'bad');
      verdict.textContent = ok
        ? '极点在单位圆内（|z| = ' + Math.abs(d.z).toFixed(2) + ' < 1），闭环稳定。T = ' + st.T.toFixed(2) + ' s 时增益最多可取到 ' + d.kmax.toFixed(1) + '。'
        : '极点已跑到单位圆外（|z| = ' + Math.abs(d.z).toFixed(2) + ' > 1），闭环不稳定，采样输出发散。把 K 降到 ' + d.kmax.toFixed(1) + ' 以下，或减小 T，才能回到圆内。';
      if (kOut) kOut.textContent = st.K.toFixed(2);
      if (tOut) tOut.textContent = st.T.toFixed(2);
    }

    function drawResp() {
      clear(rsvg);
      var W = 440, H = 400, L = 54, R = 16, T = 20, B = 40;
      var iw = W - L - R, ih = H - T - B;
      var d = dat(), b = st.K * (1 - d.a), y = 0, ys = [0], k;
      for (k = 1; k <= 24; k++) { y = b + d.z * y; ys.push(y); }
      var ymax = 1.15, ymin = -0.15, i;
      for (i = 0; i < ys.length; i++) {
        if (isFinite(ys[i])) { if (ys[i] > ymax) ymax = ys[i]; if (ys[i] < ymin) ymin = ys[i]; }
      }
      ymax = Math.min(ymax * 1.12, 2.6); ymin = Math.max(ymin * 1.15, -1.2);
      function X(v) { return L + v / 24 * iw; }
      function Y(v) { return T + ih - (v - ymin) / (ymax - ymin) * ih; }

      [0, 0.5, 1, 1.5, 2].forEach(function (v) {
        if (v > ymax) return;
        line(rsvg, L, Y(v), W - R, Y(v), { stroke: '#eef2f8', w: 1 });
        text(rsvg, L - 8, Y(v) + 4, v.toFixed(1), { anchor: 'end', size: 10, fill: '#9aa6b8' });
      });
      for (i = 0; i <= 24; i += 4) {
        line(rsvg, X(i), T, X(i), T + ih, { stroke: '#f4f7fb', w: 1 });
        text(rsvg, X(i), H - B + 17, '' + i, { anchor: 'middle', size: 10, fill: '#9aa6b8' });
      }
      line(rsvg, L, Y(0), W - R, Y(0), { stroke: '#94a3b8', w: 1.1 });
      line(rsvg, L, T, L, T + ih, { stroke: '#94a3b8', w: 1.1 });
      text(rsvg, W - R, H - 6, 'k（采样序号）', { anchor: 'end', size: 10.5, fill: '#64748b' });
      text(rsvg, L + 6, T + 12, 'y(k)', { size: 10.5, fill: '#64748b' });

      var ss = st.K / (1 + st.K);
      if (ss < ymax && Math.abs(d.z) < 1) {
        line(rsvg, L, Y(ss), W - R, Y(ss), { stroke: '#94a3b8', w: 1, dash: '5 4' });
      }
      for (i = 0; i < ys.length; i++) {
        if (!isFinite(ys[i]) || ys[i] > ymax + 0.4 || ys[i] < ymin - 0.2) continue;
        line(rsvg, X(i), Y(0), X(i), Y(ys[i]), { stroke: '#1d4ed8', w: 1.4, op: .55 });
        mk('circle', { cx: X(i), cy: Y(ys[i]), r: 3, fill: '#1d4ed8' }, rsvg);
      }
      if (Math.abs(d.z) >= 1) text(rsvg, L + 8, T + ih - 10, '响应发散，超出显示范围', { size: 10, fill: '#b91c1c' });
    }

    function drawAll() { drawZp(); drawResp(); }
    if (kr) kr.addEventListener('input', function () { st.K = +kr.value; drawAll(); });
    if (tr) tr.addEventListener('input', function () { st.T = +tr.value; drawAll(); });
    drawAll();
  })();

  /* =========================================================
     9. 静态插图：点击放大
     ========================================================= */
  (function () {
    var figs = [].slice.call(document.querySelectorAll('main figure')).filter(function (f) {
      return f.querySelector('svg') && !f.closest('.figx');
    });
    if (!figs.length) return;
    var box = document.createElement('div');
    box.id = 'zoom';
    box.innerHTML = '<div class="zi"><button class="x" type="button" aria-label="关闭">×</button><div class="zbody"></div></div>';
    document.body.appendChild(box);
    var zbody = box.querySelector('.zbody');
    function close() {
      box.classList.remove('on');
      document.body.style.overflow = '';
      zbody.innerHTML = '';
    }
    function open(f) {
      zbody.innerHTML = '';
      var c = f.cloneNode(true);
      [].slice.call(c.querySelectorAll('mjx-container')).forEach(function (m) {
        var sp = document.createElement('span');
        sp.className = 'zoom-math';
        sp.textContent = m.textContent;
        m.parentNode.replaceChild(sp, m);
      });
      [].slice.call(c.querySelectorAll('[id]')).forEach(function (n) { n.removeAttribute('id'); });
      zbody.appendChild(c);
      box.classList.add('on');
      document.body.style.overflow = 'hidden';
    }
    figs.forEach(function (f) {
      f.classList.add('zoomable');
      f.setAttribute('title', '点击放大');
      f.addEventListener('click', function (e) {
        if (e.target.closest('a,button')) return;
        open(f);
      });
    });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    box.querySelector('.x').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  })();

})();
