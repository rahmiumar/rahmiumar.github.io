(function () {
  var root = document.documentElement;
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // theme
  var themeBtn = document.querySelector('.theme-btn');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var cur = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next); store('rru-theme', next);
  });

  // language
  var langBtn = document.querySelector('.lang-btn');
  function setLang(l) {
    root.setAttribute('data-lang', l); root.setAttribute('lang', l);
    if (langBtn) langBtn.textContent = l === 'en' ? 'ID' : 'EN';
    if (langBtn) langBtn.setAttribute('aria-label', l === 'en' ? 'Baca dalam Bahasa Indonesia' : 'Read in English');
    var ro = document.getElementById('weave-readout');
    if (ro) { ro.dataset.idle = ro.getAttribute('data-idle-' + l); ro.textContent = ro.dataset.idle; }
  }
  setLang(root.getAttribute('data-lang') || 'en');
  if (langBtn) langBtn.addEventListener('click', function () {
    var l = root.getAttribute('data-lang') === 'en' ? 'id' : 'en'; setLang(l); store('rru-lang', l);
  });

  // mobile menu
  var menuBtn = document.querySelector('.menu-btn'), menu = document.querySelector('.nav ul');
  if (menuBtn && menu) menuBtn.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // reveal on scroll
  var els = document.querySelectorAll('.rv, .kawung, .dots');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
    }, { threshold: 0.18 });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('on'); }); }

  // publications: filter chips + map
  var list = document.querySelector('.pubs[data-filterable]');
  if (list) {
    var items = Array.prototype.slice.call(list.querySelectorAll('li[data-t]'));
    var marks = Array.prototype.slice.call(document.querySelectorAll('.pubmap .mk'));
    var rows = Array.prototype.slice.call(list.querySelectorAll('.year-row'));
    var chips = Array.prototype.slice.call(document.querySelectorAll('.chip[data-f]'));
    function apply(f) {
      items.forEach(function (li) { li.hidden = f !== 'all' && li.dataset.t.split(' ').indexOf(f) < 0; });
      marks.forEach(function (m) { m.classList.toggle('dim', f !== 'all' && m.dataset.t.split(' ').indexOf(f) < 0); });
      rows.forEach(function (r) {
        var n = r.nextElementSibling, any = false;
        while (n && !n.classList.contains('year-row')) { if (!n.hidden) any = true; n = n.nextElementSibling; }
        r.hidden = !any;
      });
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.f === f ? 'true' : 'false'); });
    }
    chips.forEach(function (c) { c.addEventListener('click', function () { apply(c.dataset.f); }); });
    marks.forEach(function (m) {
      function go() {
        var li = document.getElementById(m.dataset.target);
        if (!li) return;
        if (li.hidden) apply('all');
        li.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
        li.classList.add('flash'); setTimeout(function () { li.classList.remove('flash'); }, 1600);
      }
      m.addEventListener('click', go);
      m.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      m.addEventListener('mouseenter', function () { var li = document.getElementById(m.dataset.target); if (li) li.classList.add('flash'); });
      m.addEventListener('mouseleave', function () { var li = document.getElementById(m.dataset.target); if (li) li.classList.remove('flash'); });
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
