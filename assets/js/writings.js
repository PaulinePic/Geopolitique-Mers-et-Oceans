/*
 * Publications page behaviour. Vanilla JS, no framework.
 * The HTML already contains every entry; this script only filters, sorts and exports.
 *
 * URL hash: "#<tab>[&q=..][&area=..][&years=2024,2025][&types=a,b][&sort=oldest]"
 * e.g. "#articles", "#all&area=geopolitique-arctique".
 */
(function () {
  'use strict';
  var root = document.querySelector('.writings');
  var dataEl = document.getElementById('pub-data');
  if (!root || !dataEl) return;

  var data = JSON.parse(dataEl.textContent);
  var typeLabels = {};
  try { typeLabels = JSON.parse(root.getAttribute('data-type-labels') || '{}'); } catch (e) {}
  var countPattern = root.getAttribute('data-count-pattern') || '__S__ / __T__';
  var bibFile = root.getAttribute('data-label-bibtex') || 'citations.bib';

  var list = document.getElementById('pub-list');
  var items = Array.prototype.slice.call(list.querySelectorAll('.pub-item'));
  var byIndex = {};
  items.forEach(function (el) { byIndex[el.getAttribute('data-i')] = el; });

  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab-btn'));
  var tabIds = tabs.map(function (b) { return b.getAttribute('data-tab'); });
  var qInput = document.getElementById('f-q');
  var areaSel = document.getElementById('f-area');
  var sortSel = document.getElementById('f-sort');
  var yearsBox = document.getElementById('f-years');
  var typesBox = document.getElementById('f-types');
  var typesBlock = document.getElementById('f-types-block');
  var countEl = document.getElementById('result-count');
  var emptyEl = document.getElementById('pub-empty');

  var state = { tab: 'all', q: '', area: '', years: [], types: [], sort: 'newest' };

  function fold(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  data.forEach(function (d) {
    d._hay = fold([d.title, (d.authors || []).join(' '), d.venue, d.location, d.abstract, (d.tags || []).join(' ')].join(' '));
    d._title = fold(d.title);
  });

  /* ---------- hash <-> state ---------- */
  function readHash() {
    var h = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    var s = { tab: 'all', q: '', area: '', years: [], types: [], sort: 'newest' };
    if (h) {
      h.split('&').forEach(function (part, idx) {
        if (!part) return;
        var eq = part.indexOf('=');
        if (eq === -1) { if (idx === 0) s.tab = part; return; }
        var k = part.slice(0, eq), v = part.slice(eq + 1);
        if (k === 'q') s.q = v;
        else if (k === 'area') s.area = v;
        else if (k === 'sort') s.sort = v;
        else if (k === 'years') s.years = v ? v.split(',') : [];
        else if (k === 'types') s.types = v ? v.split(',') : [];
      });
    }
    if (tabIds.indexOf(s.tab) === -1) s.tab = 'all';
    return s;
  }
  function writeHash(push) {
    var parts = [state.tab];
    if (state.q) parts.push('q=' + encodeURIComponent(state.q));
    if (state.area) parts.push('area=' + state.area);
    if (state.years.length) parts.push('years=' + state.years.join(','));
    if (state.types.length) parts.push('types=' + state.types.join(','));
    if (state.sort !== 'newest') parts.push('sort=' + state.sort);
    var h = '#' + parts.join('&');
    if (h === location.hash || (h === '#all' && !location.hash)) return;
    try { history[push ? 'pushState' : 'replaceState'](null, '', h); } catch (e) { location.hash = h; }
  }

  /* ---------- filtering ---------- */
  function matchTab(d, tab) { return tab === 'all' || (d.tabs || []).indexOf(tab) !== -1; }

  function visibleFor(d, ignoreTypes) {
    if (!matchTab(d, state.tab)) return false;
    if (state.area && (d.areas || []).indexOf(state.area) === -1) return false;
    if (state.years.length && state.years.indexOf(d.year) === -1) return false;
    if (!ignoreTypes && state.types.length) {
      var ok = (d.types || []).some(function (t) { return state.types.indexOf(t) !== -1; });
      if (!ok) return false;
    }
    if (state.q) {
      var words = fold(state.q).split(/\s+/).filter(Boolean);
      for (var i = 0; i < words.length; i++) if (d._hay.indexOf(words[i]) === -1) return false;
    }
    return true;
  }

  function buildTypeFilter() {
    var seen = {};
    data.forEach(function (d) {
      if (!matchTab(d, state.tab)) return;
      (d.types || []).forEach(function (t) { seen[t] = true; });
    });
    var types = Object.keys(seen);
    typesBox.textContent = '';
    if (types.length < 2) { typesBlock.hidden = true; state.types = []; return; }
    typesBlock.hidden = false;
    state.types = state.types.filter(function (t) { return seen[t]; });
    types.sort().forEach(function (t) {
      var label = document.createElement('label');
      label.className = 'check-row';
      var cb = document.createElement('input');
      cb.type = 'checkbox'; cb.value = t; cb.checked = state.types.indexOf(t) !== -1;
      var span = document.createElement('span');
      span.textContent = typeLabels[t] || t;
      label.appendChild(cb); label.appendChild(document.createTextNode(' ')); label.appendChild(span);
      typesBox.appendChild(label);
    });
  }

  function sortData(arr) {
    var copy = arr.slice();
    copy.sort(function (a, b) {
      if (state.sort === 'az') return a._title.localeCompare(b._title, 'fr');
      if (state.sort === 'za') return b._title.localeCompare(a._title, 'fr');
      var ya = parseInt(a.year, 10), yb = parseInt(b.year, 10);
      if (state.sort === 'oldest') return ya - yb || a.i - b.i;
      return yb - ya || a.i - b.i; // newest first; the build order already breaks ties by date
    });
    return copy;
  }

  function render() {
    var shown = 0;
    var order = sortData(data);
    var frag = document.createDocumentFragment();
    order.forEach(function (d) {
      var el = byIndex[d.i];
      var show = visibleFor(d, false);
      el.style.display = show ? '' : 'none';
      if (show) shown++;
      frag.appendChild(el);
    });
    list.appendChild(frag);
    countEl.textContent = countPattern.replace('__S__', shown).replace('__T__', data.length);
    emptyEl.hidden = shown !== 0;
    tabs.forEach(function (btn) {
      var active = btn.getAttribute('data-tab') === state.tab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function syncControls() {
    qInput.value = state.q;
    areaSel.value = state.area;
    sortSel.value = state.sort;
    Array.prototype.forEach.call(yearsBox.querySelectorAll('input'), function (cb) {
      cb.checked = state.years.indexOf(cb.value) !== -1;
    });
  }

  function update(push) {
    buildTypeFilter();
    render();
    writeHash(push);
  }

  /* ---------- events ---------- */
  tabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.tab = btn.getAttribute('data-tab');
      state.types = [];
      update(true);
    });
  });
  var qTimer;
  qInput.addEventListener('input', function () {
    clearTimeout(qTimer);
    qTimer = setTimeout(function () { state.q = qInput.value.trim(); update(false); }, 120);
  });
  areaSel.addEventListener('change', function () { state.area = areaSel.value; update(false); });
  sortSel.addEventListener('change', function () { state.sort = sortSel.value; update(false); });
  yearsBox.addEventListener('change', function () {
    state.years = Array.prototype.map.call(yearsBox.querySelectorAll('input:checked'), function (cb) { return cb.value; });
    update(false);
  });
  typesBox.addEventListener('change', function () {
    state.types = Array.prototype.map.call(typesBox.querySelectorAll('input:checked'), function (cb) { return cb.value; });
    update(false);
  });
  document.getElementById('f-reset').addEventListener('click', function () {
    state = { tab: state.tab, q: '', area: '', years: [], types: [], sort: 'newest' };
    syncControls();
    update(false);
  });
  window.addEventListener('hashchange', function () {
    state = readHash();
    syncControls();
    buildTypeFilter();
    Array.prototype.forEach.call(typesBox.querySelectorAll('input'), function (cb) { cb.checked = state.types.indexOf(cb.value) !== -1; });
    render();
  });
  window.addEventListener('popstate', function () { window.dispatchEvent(new Event('hashchange')); });

  /* ---------- BibTeX export of the visible results ---------- */
  function bibEscape(s) { return String(s || '').replace(/[{}]/g, ''); }
  function bibAuthors(list) {
    return (list || []).map(function (n) {
      var parts = n.split(' ');
      var last = parts.pop();
      return parts.length ? last + ', ' + parts.join(' ') : last;
    }).join(' and ');
  }
  function toBib(d, used) {
    var first = (d.authors && d.authors[0]) ? fold(d.authors[0].split(' ').pop()).replace(/[^a-z0-9]/g, '') : 'anon';
    var word = fold(d.title).split(/[^a-z0-9]+/).filter(function (w) { return w.length > 3; })[0] || 'work';
    var key = first + d.year + word, n = 2, base = key;
    while (used[key]) { key = base + (n++); }
    used[key] = true;
    var t = d.types || [], type = 'misc', venueField = 'howpublished';
    if (t.indexOf('journal_article') !== -1) { type = 'article'; venueField = 'journal'; }
    else if (t.indexOf('book') !== -1) { type = 'book'; venueField = 'publisher'; }
    else if (t.indexOf('book_chapter') !== -1 || t.indexOf('conference_paper') !== -1) { type = 'incollection'; venueField = 'booktitle'; }
    else if (t.indexOf('report') !== -1 || t.indexOf('policy_brief') !== -1) { type = 'techreport'; venueField = 'institution'; }
    var out = '@' + type + '{' + key + ',\n';
    out += '  title = {' + bibEscape(d.title) + '},\n';
    if (d.authors && d.authors.length) out += '  author = {' + bibEscape(bibAuthors(d.authors)) + '},\n';
    out += '  year = {' + d.year + '},\n';
    var venue = d.venue + (d.location ? ', ' + d.location : '');
    if (venue) out += '  ' + venueField + ' = {' + bibEscape(venue) + '},\n';
    if (d.doi) out += '  doi = {' + d.doi + '},\n';
    out += '}\n';
    return out;
  }
  document.getElementById('f-bibtex').addEventListener('click', function () {
    var used = {};
    var text = sortData(data).filter(function (d) { return visibleFor(d, false); })
      .map(function (d) { return toBib(d, used); }).join('\n');
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = bibFile;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });

  /* ---------- initial state from the hash ---------- */
  state = readHash();
  syncControls();
  buildTypeFilter();
  Array.prototype.forEach.call(typesBox.querySelectorAll('input'), function (cb) { cb.checked = state.types.indexOf(cb.value) !== -1; });
  render();
})();
