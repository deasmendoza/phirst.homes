/* PHIRST.HOMES hero — desktop only (>=1024px).
   1. Scroll-scrubbed right-to-left wipe through the four house models (no autoplay).
   2. Subtle cursor parallax + vertical hairline glow.
   Below 1024px nothing here runs: the layout is static. */
(function () {
  'use strict';

  var track = document.querySelector('.hero-track');
  if (!track) return;

  var stage = track.querySelector('.hero-stage');
  var frame = track.querySelector('.hero-frame');
  var layers = [].slice.call(track.querySelectorAll('.hero-layer:not(.is-first)'));
  var backs = [].slice.call(track.querySelectorAll('.hero-backdrop img:not(.is-first)'));
  var backdrop = track.querySelector('.hero-backdrop');
  var wipeLine = track.querySelector('.hero-wipe-line');
  var cursor = track.querySelector('.hero-cursor');
  var cursorLine = track.querySelector('.hero-cursor-line');
  var cursorGlow = track.querySelector('.hero-cursor-glow');
  var headline = track.querySelector('.hero-headline');
  var hint = track.querySelector('.hero-hint');
  var seriesName = track.querySelector('.hero-series b');
  var dots = [].slice.call(track.querySelectorAll('.hero-dots i'));
  var nav = track.querySelector('.hero-nav');

  var NAMES = ['Unna', 'Calista', 'Amani', 'Alora'];
  // Scroll progress (0..1) windows: three wipes, then the headline.
  var WIPES = [[0.05, 0.29], [0.33, 0.57], [0.61, 0.85]];
  var HEAD = [0.88, 0.98];

  var desktop = window.matchMedia('(min-width: 1024px)');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var root = document.documentElement;

  var active = false;
  var raf = 0;
  var target = 0;      // scroll progress wanted
  var current = 0;     // scroll progress shown (eased)
  var mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, on: false };
  var lastName = -1;

  if (/[?&]hotspots=1/.test(location.search) && nav) nav.classList.add('is-debug');

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function span(p, a, b) { return clamp((p - a) / (b - a)); }

  function readScroll() {
    var total = track.offsetHeight - window.innerHeight;
    target = total > 0 ? clamp(-track.getBoundingClientRect().top / total) : 0;
  }

  function render() {
    var p = current;
    var edge = -1;      // 0..1 position of the travelling wipe edge, -1 when idle
    var shown = 0;

    for (var i = 0; i < layers.length; i++) {
      var w = span(p, WIPES[i][0], WIPES[i][1]);
      layers[i].style.setProperty('--w', w.toFixed(4));
      if (backs[i]) backs[i].style.opacity = w.toFixed(3);
      if (w > 0 && w < 1) edge = 1 - w;
      if (w >= 0.5) shown = i + 1;
    }

    if (edge >= 0) {
      wipeLine.style.opacity = '1';
      wipeLine.style.transform = 'translate3d(' + (edge * frame.offsetWidth).toFixed(1) + 'px,0,0)';
    } else {
      wipeLine.style.opacity = '0';
    }

    var h = span(p, HEAD[0], HEAD[1]);
    stage.style.setProperty('--h', h.toFixed(3));
    headline.classList.toggle('is-live', h > 0.02);
    headline.style.pointerEvents = h > 0.6 ? 'auto' : 'none';
    if (hint) hint.style.opacity = String(1 - span(p, 0.005, 0.04));

    if (shown !== lastName) {
      lastName = shown;
      if (seriesName) seriesName.textContent = NAMES[shown];
      for (var d = 0; d < dots.length; d++) dots[d].classList.toggle('is-on', d === shown);
    }

    // Cursor response: frame drifts a few pixels against the cursor, backdrop drifts with it.
    var dx = mouse.x - 0.5;
    var dy = mouse.y - 0.5;
    frame.style.transform = 'translate3d(' + (-dx * 8).toFixed(2) + 'px,' + (-dy * 6).toFixed(2) + 'px,0)';
    if (backdrop) backdrop.style.transform = 'translate3d(' + (dx * 26).toFixed(2) + 'px,' + (dy * 16).toFixed(2) + 'px,0)';
    if (cursorLine) {
      var fw = frame.offsetWidth;
      var fh = frame.offsetHeight;
      cursorLine.style.transform = 'translate3d(' + (mouse.x * fw).toFixed(1) + 'px,0,0)';
      cursorGlow.style.transform = 'translate3d(' + (mouse.x * fw).toFixed(1) + 'px,' + (mouse.y * fh).toFixed(1) + 'px,0)';
    }
  }

  function tick() {
    raf = 0;
    if (!active) return;
    var k = reduced.matches ? 1 : 0.16;
    current += (target - current) * k;
    if (Math.abs(target - current) < 0.0004) current = target;
    mouse.x += (mouse.tx - mouse.x) * 0.12;
    mouse.y += (mouse.ty - mouse.y) * 0.12;
    render();
    var settled = current === target &&
      Math.abs(mouse.tx - mouse.x) < 0.0008 && Math.abs(mouse.ty - mouse.y) < 0.0008;
    if (!settled) raf = requestAnimationFrame(tick);
  }
  function kick() { if (active && !raf) raf = requestAnimationFrame(tick); }

  function onScroll() { readScroll(); kick(); }

  function onMove(e) {
    if (reduced.matches) return;
    var r = frame.getBoundingClientRect();
    mouse.tx = clamp((e.clientX - r.left) / r.width);
    mouse.ty = clamp((e.clientY - r.top) / r.height);
    if (!mouse.on) { mouse.on = true; cursor.classList.add('is-on'); }
    kick();
  }
  function onLeave() {
    mouse.on = false;
    mouse.tx = 0.5;
    mouse.ty = 0.5;
    cursor.classList.remove('is-on');
    kick();
  }

  function start() {
    if (active) return;
    active = true;
    root.classList.add('js-hero');
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', onLeave);
    readScroll();
    current = target;   // no animation on load: model 1 sits still until the user scrolls
    lastName = -1;
    render();
  }

  function stop() {
    if (!active) return;
    active = false;
    root.classList.remove('js-hero');
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    stage.removeEventListener('pointermove', onMove);
    stage.removeEventListener('pointerleave', onLeave);
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    // Hand everything back to the static stylesheet.
    frame.style.transform = '';
    if (backdrop) backdrop.style.transform = '';
    layers.forEach(function (l) { l.style.removeProperty('--w'); });
    backs.forEach(function (b) { b.style.opacity = ''; });
    stage.style.removeProperty('--h');
    headline.style.pointerEvents = '';
    headline.classList.remove('is-live');
    cursor.classList.remove('is-on');
  }

  function sync() { if (desktop.matches) start(); else stop(); }
  if (desktop.addEventListener) desktop.addEventListener('change', sync);
  else desktop.addListener(sync);
  sync();
})();
