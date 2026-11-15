// Interactions for the Persian motion lab landing page.
(function () {
  var body = document.body;
  var root = document.documentElement;

  // ---------- reveal on load ----------
  var revealEls = document.querySelectorAll('.reveal');
  revealEls.forEach(function (el, i) {
    setTimeout(function () { el.classList.add('is-in'); }, 150 + i * 110);
  });

  // ---------- toast ----------
  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }

  // Links that have no destination yet say so, instead of silently jumping to top.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-soon], button[data-soon]');
    if (a) {
      e.preventDefault();
      toast('این بخش به‌زودی فعال می‌شود');
    }
  });

  // ---------- theme toggle (persisted) ----------
  var themeBtn = document.getElementById('themeToggle');
  function applyTheme(light) {
    body.classList.toggle('light', light);
    themeBtn.setAttribute('aria-pressed', String(light));
    try { localStorage.setItem('theme', light ? 'light' : 'dark'); } catch (e) {}
  }
  var savedTheme = null;
  try { savedTheme = localStorage.getItem('theme'); } catch (e) {}
  applyTheme(savedTheme === 'light');
  themeBtn.addEventListener('click', function () {
    applyTheme(!body.classList.contains('light'));
    toast(body.classList.contains('light') ? 'حالت روشن' : 'حالت تاریک');
  });

  // ---------- font switcher ----------
  var chips = document.querySelectorAll('.font-chip');
  var validFonts = ['nastaliq', 'hasti', 'vazir', 'peyda'];

  function setFont(name) {
    if (name === 'nastaliq') {
      body.removeAttribute('data-font');
    } else {
      body.setAttribute('data-font', name);
    }
    chips.forEach(function (c) {
      var on = c.getAttribute('data-font') === name;
      c.classList.toggle('active', on);
      c.setAttribute('aria-pressed', String(on));
    });
    try { localStorage.setItem('titleFont', name); } catch (e) {}
  }
  chips.forEach(function (c) {
    c.addEventListener('click', function () { setFont(c.getAttribute('data-font')); });
  });
  var savedFont = null;
  try { savedFont = localStorage.getItem('titleFont'); } catch (e) {}
  setFont(validFonts.indexOf(savedFont) !== -1 ? savedFont : 'nastaliq');

  // ---------- search: ⌘K / Ctrl+K focuses, filters the dock ----------
  var input = document.getElementById('searchInput');
  var kbd = document.getElementById('kbdHint');
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  kbd.textContent = isMac ? '⌘K' : 'Ctrl K';

  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      input.focus();
      input.select();
    }
    if (e.key === 'Escape' && document.activeElement === input) {
      input.value = '';
      filterDock('');
      input.blur();
    }
  });

  var dockItems = document.querySelectorAll('.dock-item');
  function filterDock(q) {
    var needle = q.trim();
    dockItems.forEach(function (item) {
      var label = item.getAttribute('data-label') || item.textContent;
      item.classList.toggle('hidden', needle !== '' && label.indexOf(needle) === -1);
    });
  }
  input.addEventListener('input', function () { filterDock(input.value); });
  input.addEventListener('search', function () { filterDock(input.value); });
})();

// ---------- island glide + magnetic pull ----------
(function () {
  var dock = document.querySelector('.dock');
  if (!dock) return;
  var glide = dock.querySelector('.glide');
  var items = Array.prototype.slice.call(dock.querySelectorAll('.dock-item'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;

  function visibleItems() {
    return items.filter(function (el) { return !el.classList.contains('hidden'); });
  }
  function moveTo(el) {
    if (!el) { glide.style.opacity = '0'; return; }
    glide.style.opacity = '1';
    glide.style.left = el.offsetLeft + 'px';
    glide.style.width = el.offsetWidth + 'px';
  }
  function rest() {
    var active = dock.querySelector('.dock-item.active');
    if (!active || active.classList.contains('hidden')) active = visibleItems()[0];
    moveTo(active || null);
  }

  items.forEach(function (el) {
    el.addEventListener('pointerenter', function () { moveTo(el); });
    el.addEventListener('focus', function () { moveTo(el); });
    el.addEventListener('blur', rest);
  });
  dock.addEventListener('pointerleave', rest);

  window.addEventListener('resize', rest);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rest);
  var searchEl = document.getElementById('searchInput');
  if (searchEl) searchEl.addEventListener('input', function () { setTimeout(rest, 0); });
  rest();

  // magnetic pull (only with a precise pointer and motion allowed)
  if (!fine || reduce) return;
  var magnets = items.concat(Array.prototype.slice.call(document.querySelectorAll('.btn')));
  magnets.forEach(function (el) {
    var isBtn = el.classList.contains('btn');
    var strength = isBtn ? 0.2 : 0.28;
    var max = isBtn ? 8 : 6;
    el.classList.add('mag');
    el.addEventListener('pointermove', function (e) {
      // measure the resting centre, not the moved one, so the pull does not jitter
      var r = el.getBoundingClientRect();
      var curX = el._mx || 0, curY = el._my || 0;
      var cx = r.left + r.width / 2 - curX;
      var cy = r.top + r.height / 2 - curY;
      var x = Math.max(-max, Math.min(max, (e.clientX - cx) * strength));
      var y = Math.max(-max, Math.min(max, (e.clientY - cy) * strength));
      el._mx = x; el._my = y;
      el.classList.add('tracking');
      el.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px)';
    });
    el.addEventListener('pointerleave', function () {
      el._mx = 0; el._my = 0;
      el.classList.remove('tracking');
      el.style.transform = '';
    });
  });
})();
