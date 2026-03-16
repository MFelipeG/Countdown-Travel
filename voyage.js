document.addEventListener('DOMContentLoaded', function () {

  /* ── safe storage: funciona mesmo com localStorage bloqueado ── */
  var _mem = {};
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return _mem[k] || null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { _mem[k] = v; } }
  };

  var SK = 'voyage_trips_v2', LK = 'voyage_layout_v2';
  var MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  var editingId = null, currentTripId = null, currentLayout = 1;

  /* ── utilitários ── */
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function fmtDate(ds) {
    if (!ds) return '--';
    var d = new Date(ds + 'T12:00:00');
    return String(d.getDate()).padStart(2,'0') + ' ' + MONTHS[d.getMonth()] + ', ' + d.getFullYear();
  }
  function fmtShort(ds) {
    if (!ds) return '--';
    var d = new Date(ds + 'T12:00:00');
    return String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth() + 1).padStart(2,'0');
  }
  function getDays(ds) {
    if (!ds) return null;
    var t = new Date(); t.setHours(0,0,0,0);
    var g = new Date(ds + 'T00:00:00'); g.setHours(0,0,0,0);
    return Math.round((g - t) / 86400000);
  }
  function pct(d) { if (d === null) return '0%'; return Math.max(0, Math.min(100, (1 - d / 365) * 100)) + '%'; }
  function statusMsg(d) {
    if (d === null) return '';
    if (d < 0) return Math.abs(d) + ' dias depois';
    if (d === 0) return 'E hoje! ✈';
    if (d === 1) return 'Amanha!';
    if (d <= 7) return 'Faltam so ' + d + '...';
    return '';
  }
  function daysStr(d) {
    if (d === null) return '--';
    if (d < 0) return Math.abs(d);
    if (d === 0) return '★';
    return d;
  }
  function rg() { return 'ABCDEFG'[Math.floor(Math.random() * 7)] + (Math.floor(Math.random() * 20) + 1); }
  function rs() { return (Math.floor(Math.random() * 8) + 1) + 'ABCDEF'[Math.floor(Math.random() * 6)]; }

  function el(id) { return document.getElementById(id); }
  function setText(id, v) { var e = el(id); if (e) e.textContent = (v === undefined || v === null) ? '--' : String(v); }
  function setHTML(id, v) { var e = el(id); if (e) e.innerHTML = v || ''; }
  function setWidth(id, w) { var e = el(id); if (e) e.style.width = w; }

  /* ── dados ── */
  function loadTrips() {
    try {
      var s = store.get(SK);
      if (s) { var p = JSON.parse(s); if (typeof p === 'object' && p !== null) return p; }
    } catch (e) {}
    var def = makeDefault(); var t = {}; t[def.id] = def; return t;
  }
  function saveTrips(t) { store.set(SK, JSON.stringify(t)); }

  function makeDefault() {
    var d = new Date(); d.setDate(d.getDate() + 47);
    var dgo = d.toISOString().split('T')[0];
    var r = new Date(d); r.setDate(r.getDate() + 14);
    var dret = r.toISOString().split('T')[0];
    return {
      id: uid(), tripName: 'Paris 2025', dest: 'Paris, Franca',
      originCode: 'GRU', originCity: 'Sao Paulo',
      destCode: 'CDG', destCity: 'Paris',
      flight: 'AF 457', dateGo: dgo, dateRet: dret,
      passengers: 'Joao Silva\nMaria Souza', gate: rg(), seat: rs()
    };
  }

  function genBarcode() {
    var bc = el('l1-barcode'); if (!bc) return; bc.innerHTML = '';
    [14,22,10,18,26,12,20,16,28,10,22,14,24,12,18,26,10,20,16,22,12,28,14,18].forEach(function (h) {
      var b = document.createElement('div'); b.className = 'l1-bar'; b.style.height = h + 'px'; bc.appendChild(b);
    });
  }

  /* ── render ── */
  function render() {
    var trips = loadTrips();
    if (!currentTripId || !trips[currentTripId]) currentTripId = Object.keys(trips)[0];
    var t = trips[currentTripId]; if (!t) return;

    var dgo = getDays(t.dateGo), dret = getDays(t.dateRet), hasRet = !!t.dateRet;
    var pnames = (t.passengers || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean).join('\n') || 'Passageiro';

    /* L1 */
    setText('l1-origin', (t.originCode || 'GRU').toUpperCase());
    setText('l1-ocity',   t.originCity || 'Sao Paulo');
    setText('l1-dest',    (t.destCode || 'CDG').toUpperCase());
    setText('l1-dcity',   t.destCity || 'Paris');
    setText('l1-days-go', daysStr(dgo));
    setText('l1-status-go', statusMsg(dgo));
    setWidth('l1-prog-go', pct(dgo));
    setText('l1-pnames',  pnames);
    setText('l1-flight',  t.flight || 'VG 001');
    setText('l1-seat',    t.seat || '1A');
    setText('l1-date-go-txt',  fmtDate(t.dateGo));
    setText('l1-date-ret-txt', hasRet ? fmtDate(t.dateRet) : 'Sem retorno');
    setText('l1-dest-full', t.dest || '--');
    setText('l1-gate',    t.gate || 'B7');
    setText('l1-days-ret', hasRet ? daysStr(dret) : '--');
    setText('l1-status-ret', hasRet ? statusMsg(dret) : 'sem retorno');
    setWidth('l1-prog-ret', hasRet ? pct(dret) : '0%');
    var ur = el('l1-unit-ret'); if (ur) ur.style.display = hasRet ? '' : 'none';
    genBarcode();

    /* L2 */
    setText('l2-dname',    t.dest || '--');
    setText('l2-origin',   (t.originCode || 'GRU').toUpperCase());
    setText('l2-dest',     (t.destCode || 'CDG').toUpperCase());
    setText('l2-days-go',  daysStr(dgo));
    setText('l2-status-go', statusMsg(dgo));
    setWidth('l2-prog-go', pct(dgo));
    setText('l2-pnames',   pnames);
    setText('l2-flight',   t.flight || 'VG 001');
    setText('l2-date-go',  fmtShort(t.dateGo));
    setText('l2-gate',     t.gate || 'B7');
    setText('l2-days-ret', hasRet ? daysStr(dret) : '--');
    setText('l2-status-ret', hasRet ? statusMsg(dret) : 'sem retorno');

    /* L3 */
    var dp = (t.dest || 'Paris, Franca').split(',');
    var d1 = dp[0] || 'Paris', d2 = dp.slice(1).join(',').trim() || 'Franca';
    setHTML('l3-dname', d1 + ',<br><em>' + d2 + '</em>');
    setText('l3-days-go',   daysStr(dgo));
    setText('l3-status-go', statusMsg(dgo));
    setWidth('l3-prog-go',  pct(dgo));
    setText('l3-pnames',    pnames);
    setText('l3-origin',    (t.originCode || 'GRU').toUpperCase());
    setText('l3-flight',    t.flight || 'VG 001');
    setText('l3-dcode',     (t.destCode || 'CDG').toUpperCase());
    setText('l3-date-go-txt', fmtDate(t.dateGo));
    var retEl = el('l3-days-ret');
    if (retEl) { retEl.textContent = hasRet ? daysStr(dret) : '--'; retEl.style.fontSize = hasRet ? '48px' : '34px'; }
    setText('l3-status-ret', hasRet ? statusMsg(dret) : 'sem retorno');
    var l3ur = el('l3-unit-ret'); if (l3ur) l3ur.style.display = hasRet ? '' : 'none';

    renderTabs(trips);
  }

  /* ── tabs ── */
  function renderTabs(trips) {
    var c = el('tripTabs'); if (!c) return;
    c.innerHTML = '';
    Object.values(trips).forEach(function (t) {
      var b = document.createElement('button');
      b.className = 'trip-tab' + (t.id === currentTripId ? ' active' : '');
      b.textContent = t.tripName || 'Viagem';
      b.addEventListener('click', function () { currentTripId = t.id; render(); });
      c.appendChild(b);
    });
    var add = document.createElement('button');
    add.className = 'trip-tab-add'; add.title = 'Nova viagem'; add.textContent = '+';
    add.addEventListener('click', openModalNew);
    c.appendChild(add);
  }

  /* ── layout switch ── */
  function switchLayout(n) {
    currentLayout = n;
    [1,2,3].forEach(function (i) {
      var w = el('layout' + i); if (w) w.classList.toggle('active', i === n);
    });
    var btns = document.querySelectorAll('.sw-btn');
    btns.forEach(function (b, i) { b.classList.toggle('active', i + 1 === n); });
    store.set(LK, String(n));
  }

  /* ── modal ── */
  function clearModal() {
    ['inp-tripname','inp-dest','inp-ocode','inp-ocity','inp-dcode','inp-dcity','inp-flight','inp-date-go','inp-date-ret','inp-passengers']
      .forEach(function (id) { var e = el(id); if (e) e.value = ''; });
  }

  function openModalNew() {
    editingId = null;
    el('modalTitle').textContent = 'Nova viagem';
    el('deleteBtn').style.display = 'none';
    clearModal();
    el('modalOverlay').classList.add('open');
  }

  function openModalEdit() {
    var trips = loadTrips(); var t = trips[currentTripId]; if (!t) return;
    editingId = currentTripId;
    el('modalTitle').textContent = 'Editar viagem';
    el('deleteBtn').style.display = 'block';
    el('inp-tripname').value   = t.tripName || '';
    el('inp-dest').value       = t.dest || '';
    el('inp-ocode').value      = t.originCode || '';
    el('inp-ocity').value      = t.originCity || '';
    el('inp-dcode').value      = t.destCode || '';
    el('inp-dcity').value      = t.destCity || '';
    el('inp-flight').value     = t.flight || '';
    el('inp-date-go').value    = t.dateGo || '';
    el('inp-date-ret').value   = t.dateRet || '';
    el('inp-passengers').value = t.passengers || '';
    el('modalOverlay').classList.add('open');
  }

  function closeModal() { el('modalOverlay').classList.remove('open'); }

  function saveTrip() {
    var trips = loadTrips();
    var id = editingId || uid();
    trips[id] = {
      id:          id,
      tripName:    el('inp-tripname').value  || 'Viagem',
      dest:        el('inp-dest').value      || 'Destino',
      originCode:  (el('inp-ocode').value    || 'GRU').toUpperCase(),
      originCity:  el('inp-ocity').value     || 'Origem',
      destCode:    (el('inp-dcode').value    || 'DST').toUpperCase(),
      destCity:    el('inp-dcity').value     || 'Destino',
      flight:      el('inp-flight').value    || '',
      dateGo:      el('inp-date-go').value   || '',
      dateRet:     el('inp-date-ret').value  || '',
      passengers:  el('inp-passengers').value || '',
      gate: rg(), seat: rs()
    };
    saveTrips(trips);
    currentTripId = id;
    closeModal();
    render();
  }

  function deleteTrip() {
    if (!editingId) return;
    var trips = loadTrips();
    delete trips[editingId];
    if (Object.keys(trips).length === 0) { var def = makeDefault(); trips[def.id] = def; }
    saveTrips(trips);
    currentTripId = Object.keys(trips)[0];
    closeModal();
    render();
  }

  /* ── bind all buttons ── */
  function bindBtn(id, fn) { var b = el(id); if (b) b.addEventListener('click', fn); }

  bindBtn('sw1', function () { switchLayout(1); });
  bindBtn('sw2', function () { switchLayout(2); });
  bindBtn('sw3', function () { switchLayout(3); });
  bindBtn('edit1', openModalEdit);
  bindBtn('edit2', openModalEdit);
  bindBtn('edit3', openModalEdit);
  bindBtn('modalClose', closeModal);
  bindBtn('saveBtn', saveTrip);
  bindBtn('deleteBtn', deleteTrip);

  var overlay = el('modalOverlay');
  if (overlay) overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });

  /* ── init ── */
  var saved = parseInt(store.get(LK), 10);
  if (saved >= 1 && saved <= 3) switchLayout(saved);

  render();
  setInterval(render, 60000);

}); // DOMContentLoaded

