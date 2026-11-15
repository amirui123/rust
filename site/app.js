// Interactions for the Persian motion lab landing page.
(function () {
  var body = document.body;

  // Font switcher: changes the hero title face live.
  var chips = document.querySelectorAll('.font-chip');
  var fonts = { nastaliq: 'nastaliq', hasti: 'hasti', vazir: 'vazir', peyda: 'peyda' };

  function setFont(name) {
    if (name === 'nastaliq') {
      body.removeAttribute('data-font');
    } else {
      body.setAttribute('data-font', fonts[name] || name);
    }
    chips.forEach(function (c) {
      c.classList.toggle('active', c.getAttribute('data-font') === name);
    });
    try { localStorage.setItem('titleFont', name); } catch (e) {}
  }

  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      setFont(c.getAttribute('data-font'));
    });
  });

  var saved = null;
  try { saved = localStorage.getItem('titleFont'); } catch (e) {}
  setFont(saved && fonts[saved] ? saved : 'nastaliq');

  // Reveal the hero elements in sequence on load.
  var items = document.querySelectorAll('.badge, .line, .lead, .cta, .fontbar');
  items.forEach(function (el, i) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    el.style.transition = 'opacity .7s ease, transform .7s ease';
    setTimeout(function () {
      el.style.opacity = '1';
      el.style.transform = 'none';
    }, 150 + i * 120);
  });

  // Theme dot: a subtle pulse when clicked (the page is dark-only for now).
  var dot = document.getElementById('themeDot');
  if (dot) {
    dot.addEventListener('click', function () {
      dot.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }],
        { duration: 350 }
      );
    });
  }
})();
