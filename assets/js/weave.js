/* Woven Rasch matrix.
   Each warp thread (column) is an item with difficulty b_j, each weft thread (row)
   a learner with ability theta_i. A cell shows the weft (gold) on top when the
   sampled response is correct, P = 1 / (1 + exp(-(theta_i - b_j))), and the warp
   (indigo) otherwise. Bands every few rows follow a symmetric ulos-style motif. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function setup(cv) {
    var ctx = cv.getContext('2d');
    var cell = +cv.dataset.cell || 11;
    var host = cv.parentElement;
    var interactive = cv.dataset.interactive === '1';
    var readout = interactive ? document.getElementById('weave-readout') : null;
    var seed = +cv.dataset.seed || 7;
    var W, H, cols, rows, b, theta, u, dpr;
    var shift = 0, target = 0, hover = null, running = false, idleT = 0, visible = true;

    function build() {
      var r = rng(seed);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cols = Math.ceil(W / cell) + 1; rows = Math.ceil(H / cell) + 1;
      b = new Float32Array(cols); theta = new Float32Array(rows);
      var ph = r() * 6.28;
      for (var j = 0; j < cols; j++) b[j] = 2.3 * Math.sin(j * 0.042 + ph) + 0.8 * Math.sin(j * 0.16 + ph * 2) + (r() - 0.5) * 0.7;
      for (var i = 0; i < rows; i++) theta[i] = 3.1 - 6.2 * i / Math.max(rows - 1, 1) + (r() - 0.5) * 0.5;
      u = new Float32Array(cols * rows);
      for (var k = 0; k < u.length; k++) u[k] = r();
    }

    function band(i) { var m = i % 30; return m < 3 ? m : -1; }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#141d33';
      ctx.fillRect(0, 0, W, H);
      var t = cell * 0.2, w = cell * 0.6;
      for (var i = 0; i < rows; i++) {
        var y = i * cell, bi = band(i);
        for (var j = 0; j < cols; j++) {
          var x = j * cell;
          if (bi >= 0) {
            var d = Math.abs((j % 14) - 7) + bi;
            ctx.fillStyle = d % 4 === 0 ? 'rgba(239,232,218,0.78)' : (d % 2 ? 'rgba(140,74,47,0.95)' : 'rgba(176,102,63,0.7)');
            ctx.fillRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
            continue;
          }
          var p = 1 / (1 + Math.exp(-(theta[i] + shift - b[j])));
          if (u[i * cols + j] < p) {
            ctx.fillStyle = 'rgba(201,161,91,' + (0.28 + 0.66 * p).toFixed(3) + ')';
            ctx.fillRect(x + 0.5, y + t, cell - 1, w);
            ctx.fillStyle = 'rgba(255,236,196,' + (0.12 + 0.3 * p).toFixed(3) + ')';
            ctx.fillRect(x + 0.5, y + t, cell - 1, 1);
          } else {
            ctx.fillStyle = 'rgba(62,82,124,' + (0.35 + 0.45 * (1 - p)).toFixed(3) + ')';
            ctx.fillRect(x + t, y + 0.5, w, cell - 1);
            ctx.fillStyle = 'rgba(150,170,210,' + (0.06 + 0.14 * (1 - p)).toFixed(3) + ')';
            ctx.fillRect(x + t, y + 0.5, 1, cell - 1);
          }
        }
      }
      if (hover) {
        ctx.strokeStyle = 'rgba(239,232,218,0.9)';
        ctx.lineWidth = 1;
        ctx.strokeRect(hover.j * cell + 0.5, 0.5, cell - 1, H);
        ctx.strokeRect(0.5, hover.i * cell + 0.5, W, cell - 1);
      }
    }

    function report() {
      if (!readout || !hover || band(hover.i) >= 0) return;
      var th = theta[hover.i] + shift, bj = b[hover.j];
      var p = 1 / (1 + Math.exp(-(th - bj)));
      readout.textContent = 'θ = ' + th.toFixed(2) + '   b = ' + bj.toFixed(2) + '   P = ' + p.toFixed(2);
    }

    function tick(now) {
      if (!visible) { running = false; return; }
      if (!reduce && interactive && !hover && now - idleT > 2500) target = 1.3 * Math.sin(now / 4200);
      var d = target - shift;
      shift += d * 0.08;
      draw(); report();
      if (Math.abs(d) > 0.002 || (!reduce && interactive && !hover)) { requestAnimationFrame(tick); } else { running = false; }
    }
    function kick() { if (!running) { running = true; requestAnimationFrame(tick); } }

    if (interactive) {
      host.addEventListener('pointermove', function (e) {
        var rc = cv.getBoundingClientRect();
        var x = e.clientX - rc.left, y = e.clientY - rc.top;
        if (x < 0 || y < 0 || x > W || y > H) return;
        target = (x / W - 0.5) * 3.6;
        hover = { i: Math.floor(y / cell), j: Math.floor(x / cell) };
        idleT = performance.now();
        kick();
      });
      host.addEventListener('pointerleave', function () { hover = null; idleT = performance.now(); if (readout) readout.textContent = readout.dataset.idle || ''; kick(); });
      var again = document.getElementById('weave-again');
      if (again) again.addEventListener('click', function () { seed += 1; build(); kick(); });
    }

    build();
    if (reduce) { draw(); } else { kick(); }
    var ro = new ResizeObserver(function () { if (cv.clientWidth !== W || cv.clientHeight !== H) { build(); draw(); kick(); } });
    ro.observe(cv);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); }).observe(cv);
    }
  }

  document.querySelectorAll('canvas.weave').forEach(setup);
})();
