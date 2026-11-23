'use strict';
// ===== Refúgio Zero — inicialização e laço principal =====
(function () {
  UI.toast = (msg, kind) => { const box = document.getElementById('toasts'); const d = document.createElement('div'); d.className = 'toast ' + (kind || ''); d.textContent = msg; box.appendChild(d); while (box.children.length > 3) box.firstChild.remove(); setTimeout(() => d.remove(), 2600); };
  S = load();
  let off = null;
  if (!S || !S.world || S.v !== 1) { S = newState(); genWorld(); ensureDaily(); }
  else { reindex(); ensureDaily(); economy(now()); off = catchUp(); checkTimers(); }
  document.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (el && ACT[el.dataset.act]) { ACT[el.dataset.act](el); if (el.dataset.act !== 'close') dirty(); } });
  document.querySelectorAll('#nav button').forEach(b => b.addEventListener('click', () => tabGo(b.dataset.tab)));
  document.getElementById('shade').addEventListener('click', closeSheet);
  document.addEventListener('input', e => { const el = e.target; if (el.dataset && el.dataset.inp && INP[el.dataset.inp]) INP[el.dataset.inp](el); });
  document.addEventListener('pointerdown', e => { if (e.target.matches && e.target.matches('input[type=range]')) V.hold = true; });
  document.addEventListener('pointerup', () => { V.hold = false; });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && document.activeElement) { if (document.activeElement.id === 'cmsg') ACT.csay(); if (document.activeElement.id === 'wmsg') ACT.wsay(); } });
  window.addEventListener('resize', () => { if (MapV.on) mapResize(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); else { economy(now()); const r = catchUp(); checkTimers(); if (r && r.steps > 20) showOffline(r); dirty(); } });
  NEWS_HOOK = (text, type) => { if (type === 'revolt' && Math.random() < 0.25 && V.tab !== 'mundo') toast(text.length > 80 ? text.slice(0, 78) + '…' : text); };
  let lastSave = now();
  function badge(sel, n) { const b = document.querySelector(sel); let x = b.querySelector('.bdg'); if (n > 0) { if (!x) { x = document.createElement('i'); x.className = 'bdg'; b.appendChild(x); } x.textContent = n > 99 ? '99+' : n; } else if (x) x.remove(); }
  function frame() {
    const t = now();
    economy(t); checkTimers();
    let n = 0; while (t - S.world.lastSim >= SIM_DT && n < 4) { simStep(false); S.world.lastSim += SIM_DT; n++; dirty(); }
    if (t - S.world.lastSim > SIM_DT * 8) S.world.lastSim = t;
    renderTop();
    const ae = document.activeElement; const typing = ae && ae.tagName === 'INPUT' && ae.type !== 'range';
    if (UI.dirty && !V.hold && !typing) { renderView(); renderSheet(); renderTut(); UI.dirty = false; }
    else if (V.tab === 'mapa') renderMarches();
    document.querySelectorAll('[data-end]').forEach(el => el.textContent = ftime((+el.dataset.end - t) / 1000));
    document.querySelectorAll('i[data-e]').forEach(el => { const s = +el.dataset.s, e = +el.dataset.e; el.style.width = clamp((t - s) / (e - s), 0, 1) * 100 + '%'; });
    badge('#nav [data-tab=mundo]', V.tab !== 'mundo' ? (S.world.nc || 0) - (S.seenNews || 0) : 0);
    badge('#nav [data-tab=cla]', S.clan && V.tab !== 'cla' ? (S.world.helpReq || 0) : 0);
    if (t - lastSave > 8000) { save(); lastSave = t; }
  }
  tabGo('base');
  setInterval(frame, 1000); frame();
  if (!S.intro) showIntro(() => { dirty(); frame(); });
  else if (off && off.steps > 20) showOffline(off);
  window.__G = { get S() { return S; }, simStep, catchUp, checkTimers, playerJoin, revolt, clanById, aiById, rankClans, frame, save };
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
})();
