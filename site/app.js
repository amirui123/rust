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
