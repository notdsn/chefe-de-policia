'use strict';
// ===== Refúgio Zero — interface =====
const V = { tab: 'base', sheet: null, sub: { cla: 'membros', mundo: 'noticias', nf: 'all', tr: 'treinar' }, hold: false, md: null, tier: {}, qty: {}, promo: {} };
const $ = s => document.querySelector(s);
const ACT = {};
function getQ(key) { if (!key) return null; const [k, a] = key.split(':'); if (k === 'b') return S.bq.find(q => q.bid === a); if (k === 't') return S.tq[a]; if (k === 'r') return S.rq; if (k === 'h') return S.hq; return null; }
function tmr(q) { return `<span data-end="${q.end}">${ftime((q.end - now()) / 1000)}</span>`; }
function pbar(q, cls) { const f = clamp((now() - q.start) / (q.end - q.start), 0, 1); return `<div class="bar ${cls || 'o'}"><i data-s="${q.start}" data-e="${q.end}" style="width:${f * 100}%"></i></div>`; }
function rwHtml(rw) { return Object.keys(rw || {}).filter(k => rw[k] > 0 && k !== 'min').map(k => { const e = RES[k] ? RES[k].e : k === 'chips' ? '🪙' : ITEMS[k] ? ITEMS[k].e : '🎁'; return `<span class="cost">${e} ${fmt(rw[k])}</span>`; }).join(''); }
function heroFace(id, sz) { const h = HEROES[id]; const r = RAR[h.r]; return `<div class="hp" style="border-color:${r.c};background:radial-gradient(circle at 50% 30%,${r.c}44,#0b0d0c);${sz ? `width:${sz}px;height:${sz}px;font-size:${sz / 2}px` : ''}">${h.e}<span class="cl">${CLS[h.c].e}</span></div>`; }
function stars(n) { return '<span class="stars">' + '★'.repeat(n) + '<span style="opacity:.25">' + '★'.repeat(5 - n) + '</span></span>'; }
function flag(c, sz) { return `<div class="flag" style="background:${c.color};${sz ? `width:${sz}px;height:${sz}px` : ''}">${esc(c.tag)}</div>`; }
function moodCol(v) { return v >= 60 ? '#9be15d' : v >= 35 ? '#ffd84d' : '#ff5d5d'; }
function rwText(rw) { return Object.keys(rw).filter(k => rw[k]).map(k => (RES[k] ? RES[k].e : k === 'chips' ? '🪙' : ITEMS[k].e) + ' ' + fmt(rw[k])).join('  '); }

// ---------- topo ----------
function renderTop() {
  const c = myClan();
  $('#top').innerHTML = `<div class="who"><div class="ava">🧔<b>${S.b.bunker}</b></div><div><div class="nm">${c ? `<span class="tag" style="color:${c.color}">${esc(c.tag)}</span> ` : ''}${esc(S.name)}</div><div class="pw">⚔️ ${fmt(playerPower())}</div></div>
  <div class="chips">${S.shield > now() ? `<span class="pill">🛡️ <span data-end="${S.shield}">${ftime((S.shield - now()) / 1000)}</span></span>` : ''}<button class="pill" data-act="items">🎒</button><span class="pill gd">🪙 ${fmt(S.chips)}</span></div></div>
  <div class="resrow">${RKEYS.map(k => { const cap = capRes(k); const f = clamp(S.res[k] / cap, 0, 1); return `<div class="res ${f >= 1 ? 'full' : ''}">${RES[k].e} ${fmt(S.res[k])}<i style="width:${f * 100}%"></i></div>`; }).join('')}</div>`;
}
// ---------- tutorial ----------
const TUT = [
  { n: 'Melhore o Bunker Central ao Nv.2', ok: () => S.b.bunker >= 2, go: () => { tabGo('base'); openB('bunker'); }, hl: 'bunker', rw: { chips: 30, acel5: 2 } },
  { n: 'Recolha a produção das construções', ok: () => (S.stats.col || 0) >= 1, go: () => tabGo('base'), hl: 'collect', rw: { comida: 800, agua: 800 } },
  { n: 'Treine 20 Brutos no Quartel', ok: () => S.stats.trained >= 20, go: () => { tabGo('base'); openB('brutos'); }, hl: 'brutos', rw: { chips: 30, acel5: 2 } },
  { n: 'Recrute um herói com Sinal de Rádio', ok: () => (S.stats.rec || 0) >= 1, go: () => tabGo('herois'), rw: { radio: 2 } },
  { n: 'Derrote uma horda zumbi no Mapa', ok: () => S.stats.kills >= 1, go: () => { tabGo('mapa'); setTimeout(() => findHorde(1), 50); }, rw: { manual: 10, chips: 40 } },
  { n: 'Entre em um clã (ou crie o seu)', ok: () => !!S.clan, go: () => tabGo('cla'), rw: { chips: 50, radio: 1 } },
  { n: 'Melhore a Horta Hidropônica ao Nv.2', ok: () => S.b.fazenda >= 2, go: () => { tabGo('base'); openB('fazenda'); }, hl: 'fazenda', rw: { acel60: 1, chips: 50 } },
  { n: 'Vença a fase 1 da Exploração', ok: () => S.exp.stage >= 2, go: () => openExplore(), rw: { medalha: 5, manual: 10 } },
];
function curTut() {
  if (S.tut < TUT.length) return TUT[S.tut];
  const L = S.b.bunker + 1; if (L > MAXLV) return null;
  return { n: `Melhore o Bunker Central ao Nv.${L}`, ok: () => S.b.bunker >= L, go: () => { tabGo('base'); openB('bunker'); }, hl: 'bunker', rw: { chips: 40 + L * 10, radio: 1, acel60: L >= 6 ? 1 : 0, acel5: 2 } };
}
function renderTut() {
  const t = curTut(); const el = $('#tut');
  if (!t || V.tab === 'mapa' && !t.ok() && S.tut !== 4) { el.className = ''; el.innerHTML = ''; return; }
  const done = t.ok(); el.className = 'on';
  el.innerHTML = `<div class="tutb ${done ? 'hl' : ''}"><span style="font-size:18px">${done ? '🎁' : '🎯'}</span><div><div class="sm mu">${S.tut < TUT.length ? `Missão ${S.tut + 1}/${TUT.length}` : 'Missão principal'}</div><div class="b">${t.n}</div></div>${done ? `<button class="go" data-act="tutclaim">Pegar</button>` : `<button class="go" data-act="tutgo">Ir</button>`}</div>`;
}
ACT.tutgo = () => { const t = curTut(); if (t) t.go(); };
ACT.tutclaim = () => { const t = curTut(); if (!t || !t.ok()) return; gain(t.rw); toast('Recompensa: ' + rwText(t.rw)); S.tut++; dirty(); save(); };

// ---------- abas ----------
function tabGo(t) {
  closeSheet(); V.tab = t; document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  const v = $('#view'); v.scrollTop = 0; v.innerHTML = ''; v.classList.toggle('mapmode', t === 'mapa');
  if (t !== 'mapa') mapStop(); renderView(); renderTut();
}
function renderView() {
  const v = $('#view');
  if (V.tab === 'mapa') { if (!$('#mapcv')) { v.innerHTML = `<div id="mapwrap"><canvas id="mapcv"></canvas><div class="mapui"><span class="pill" id="mapxy"></span><button class="pill" data-act="mapme">🏰 Minha base</button><button class="pill" data-act="findh">🧟 Procurar horda</button><button class="pill" data-act="findn">⛏️ Recurso</button><button class="pill" data-act="reports">📜</button></div><div class="mlist" id="mlist"></div></div>`; mapInit($('#mapcv')); mapStart(); } renderMarches(); return; }
  const st = v.scrollTop;
  v.innerHTML = V.tab === 'base' ? viewBase() : V.tab === 'herois' ? viewHeroes() : V.tab === 'cla' ? viewClan() : viewWorld();
  v.scrollTop = st;
  if (V.stickBottom && v.querySelector('.chat.autoscroll')) v.scrollTop = v.scrollHeight;
}
function renderMarches() {
  const el = $('#mlist'); if (!el) return;
  el.innerHTML = S.marches.map(m => { const ph = { go: 'indo', work: 'coletando', back: 'voltando', wait: 'reunindo' }[m.phase]; return `<button class="mch" data-act="march" data-a="${m.id}">${m.kind === 'gather' ? '🛻' : m.kind === 'rally' ? '🚩' : '⚔️'} ${esc(m.tname || '')} · ${ph} <span data-end="${m.t1}">${ftime((m.t1 - now()) / 1000)}</span></button>`; }).join('') + `<span class="mch mu">Marchas ${S.marches.length}/${maxMarches()}</span>`;
}

// ---------- BASE ----------
function viewBase() {
  const w = workers(); const anyAcc = BORDER.some(k => BLD[k].res && (S.acc[k] || 0) >= 1);
  ensureDaily(); const ev = S.event; const dp = dailyPts(); const dReady = DCHEST.some((c, i) => dp >= c.p && !S.daily.claimed.includes(i)) || !S.daily.login;
  const evReady = EVM.some((c, i) => ev.pts >= c.p && !ev.claimed.includes(i));
  const newRep = S.reports.filter(r => r.t > (S.seenRep || 0)).length;
  const idle = idleRw(); const ct = curTut();
  let h = `<div class="status">
    <button class="st" data-act="openb" data-a="gerador" style="text-align:left"><span class="mu">⚡ Gerador</span><b class="${S.genOn && S.powered !== false ? 'ok' : 'no'}">${S.genOn ? (S.powered === false ? 'SEM COMBUSTÍVEL' : 'LIGADO') : 'DESLIGADO'}</b><span class="mu sm">-${fmt(genUse() * 60)} ⛽/min</span></button>
    <div class="st"><span class="mu">☣️ Infecção</span><b class="${S.inf > 40 ? 'no' : S.inf > 15 ? 'gd' : 'ok'}">${Math.round(S.inf)}%</b><div class="bar inf"><i style="width:${S.inf}%"></i></div></div>
    <button class="st" data-act="openb" data-a="abrigo" style="text-align:left"><span class="mu">👥 Sobreviventes</span><b>${S.surv}/${survCap()}</b><span class="sm ${w.fill < 1 ? 'no' : 'mu'}">Trabalho ${Math.round(w.fill * 100)}%</span></button>
    <button class="st" data-act="openb" data-a="enfermaria" style="text-align:left"><span class="mu">🏥 Feridos</span><b>${armyCount(S.wounded)}/${woundCap()}</b><span class="mu sm">${S.hq ? 'Em tratamento' : armyCount(S.wounded) ? 'Toque para curar' : 'Nenhum'}</span></button>
  </div>
  <div class="quick">
    <button class="qb" data-act="daily"><span>📋</span>Tarefas${dReady ? '<i class="bdg">!</i>' : ''}</button>
    <button class="qb" data-act="event"><span>🏆</span>Evento${evReady ? '<i class="bdg">!</i>' : ''}</button>
    <button class="qb ${ct && S.tut === 7 ? 'hl' : ''}" data-act="explore"><span>🧭</span>Exploração${idle.min > 30 ? '<i class="bdg">!</i>' : ''}</button>
    <button class="qb" data-act="reports"><span>📜</span>Relatórios${newRep ? `<i class="bdg">${newRep}</i>` : ''}</button>
    <button class="qb" data-act="openb" data-a="lab"><span>🧪</span>Pesquisa</button>
    <button class="qb" data-act="chief"><span>👑</span>Equip. Líder</button>
    <button class="qb" data-act="troops"><span>🪖</span>Exército</button>
    <button class="qb" data-act="help"><span>❔</span>Como jogar</button>
  </div>`;
  const tl = timerList();
  h += `<h3>Filas (${S.bq.length}/${builders()} obras)</h3><div class="queues">${tl.length ? tl.map(x => `<div class="q"><div class="nm"><div class="b">${esc(x.n)}</div>${pbar(x.ref)}</div><span class="b" style="min-width:56px;text-align:right">${tmr(x.ref)}</span><button class="btn sm o" data-act="speed" data-a="${x.k === 'b' ? 'b:' + x.ref.bid : x.k === 't' ? 't:' + CK.find(c => S.tq[c] === x.ref) : x.k}">⏩</button></div>`).join('') : '<div class="q mu">Nenhuma fila ativa. Obras, treinos e pesquisas aparecem aqui.</div>'}</div>`;
  const hl = ct && !ct.ok() ? ct.hl : null;
  h += `<h3>Construções</h3><div class="grid">${BORDER.map(k => {
    const B = BLD[k], L = S.b[k], q = inQueue(k), lock = (B.unlock || 1) > S.b.bunker;
    const acc = B.res ? Math.floor(S.acc[k] || 0) : 0; const canUp = !q && !lock && L < MAXLV && !bReqs(k).length && has(bCost(k, L + 1)) && S.bq.length < builders();
    const tq = B.troop && S.tq[B.troop];
    return `<button class="bt ${lock ? 'lock' : L === 0 ? 'new' : ''} ${hl === k ? 'hl' : ''}" data-act="openb" data-a="${k}">
      ${L ? `<span class="lv">Nv.${L}</span>` : ''}${canUp ? '<span class="up">▲</span>' : ''}
      ${acc >= Math.max(10, accCap(k) * 0.05) ? `<span class="bub">${RES[B.res].e} ${fmt(acc)}</span>` : ''}
      <span class="e">${B.e}</span><span class="n">${B.n}</span>
      ${lock ? `<span class="sm mu">🔒 Bunker ${B.unlock}</span>` : L === 0 ? '<span class="sm gd b">Construir</span>' : ''}
      ${q ? `<span class="pb"><i data-s="${q.start}" data-e="${q.end}" style="width:${clamp((now() - q.start) / (q.end - q.start), 0, 1) * 100}%"></i></span>` : tq ? `<span class="pb"><i data-s="${tq.start}" data-e="${tq.end}" style="width:${clamp((now() - tq.start) / (tq.end - tq.start), 0, 1) * 100}%;background:var(--blue)"></i></span>` : ''}
    </button>`;
  }).join('')}</div>`;
  if (anyAcc) h += `<div class="fab"><button class="btn y ${hl === 'collect' ? 'hl' : ''}" data-act="collectall">🧺 Recolher tudo</button></div>`;
  return h;
}
ACT.collectall = () => { collectAll(); };
ACT.openb = el => openB(el.dataset.a);

// ---------- sheet ----------
function openSheet(title, fn) { V.sheet = { title, fn }; $('#sheet .bd').scrollTop = 0; renderSheet(); $('#shade').classList.add('on'); $('#sheet').classList.add('on'); }
function closeSheet() { V.sheet = null; V.md = null; $('#shade').classList.remove('on'); $('#sheet').classList.remove('on'); }
function renderSheet() { if (!V.sheet) return; const bd = $('#sheet .bd'); const st = bd.scrollTop; $('#sheet .t').innerHTML = typeof V.sheet.title === 'function' ? V.sheet.title() : V.sheet.title; bd.innerHTML = V.sheet.fn(); bd.scrollTop = st; }
ACT.close = closeSheet;

function upgradeBlock(k) {
  const L = S.b[k], q = inQueue(k);
  if (q) return `<div class="card"><div class="row sp"><b>Em obra → Nv.${q.to}</b><b>${tmr(q)}</b></div>${pbar(q)}<div class="row" style="margin-top:8px;gap:6px"><button class="btn o sm" data-act="speed" data-a="b:${k}">⏩ Acelerar</button>${S.clan ? `<span class="sm mu">🤝 Ajudas do clã: ${q.helps || 0}/${5 + S.b.centro + (myClan() ? myClan().tech.ajuda : 0)}</span>` : ''}</div></div>`;
  if (L >= MAXLV) return `<div class="card ok b">Nível máximo!</div>`;
  const r = bReqs(k), c = bCost(k, L + 1);
  return `<div class="card"><div class="row sp"><b>${L ? 'Melhorar para Nv.' + (L + 1) : 'Construir'}</b><span class="mu">⏱️ ${ftime(bTime(k, L + 1))}</span></div>
  ${r.length ? `<div class="sm no" style="margin:6px 0">Requisitos: ${r.join(', ')}</div>` : ''}
  <div style="margin:6px 0">${costHtml(c, S.res)}</div>
  ${k === 'bunker' ? `<div class="sm mu" style="margin-bottom:6px">Libera: nível máximo ${L + 1} para as construções${Object.keys(BLD).filter(b => BLD[b].unlock === L + 1).map(b => ', ' + BLD[b].n).join('')}.</div>` : ''}
  <button class="btn w ${r.length || !has(c) || S.bq.length >= builders() ? 'dis' : ''}" data-act="upgrade" data-a="${k}">${S.bq.length >= builders() ? 'Equipes ocupadas' : !has(c) ? 'Faltam recursos' : r.length ? 'Requisito pendente' : L ? '⬆️ Melhorar' : '🔨 Construir'}</button></div>`;
}
ACT.upgrade = el => { const k = el.dataset.a; if (startUpgrade(k) && !BLD[k].troop) closeSheet(); };
function openB(k) {
  const B = BLD[k];
  openSheet(() => `${B.e} ${B.n} <span class="mu sm">Nv.${S.b[k]}</span>`, () => {
    let h = `<div class="sm mu" style="margin-bottom:8px">${B.d}</div>`;
    const L = S.b[k];
    if ((B.unlock || 1) > S.b.bunker) return h + `<div class="card no b">🔒 Libera com o Bunker Central Nv.${B.unlock}.</div>`;
    if (B.res && L) { const acc = Math.floor(S.acc[k] || 0), w = workers(); h += `<div class="card"><div class="kv"><span>Produção</span><span>${fmt(rate(k) * 60)} ${RES[B.res].e}/min</span><span>Acumulado</span><span>${fmt(acc)} / ${fmt(accCap(k))}</span><span>Trabalhadores</span><span>${Math.round(w.n[k] * w.fill)}/${w.n[k]} 👥</span><span>Armazém (${RES[B.res].n})</span><span>${fmt(S.res[B.res])} / ${fmt(capRes(B.res))}</span></div><button class="btn y w" style="margin-top:8px" data-act="collect" data-a="${k}">🧺 Recolher ${fmt(acc)}</button></div>`; }
    if (k === 'gerador') h += `<div class="card"><div class="kv"><span>Estado</span><span class="${S.genOn ? 'ok' : 'no'}">${S.genOn ? 'Ligado' : 'Desligado'}</span><span>Consumo</span><span>${fmt(genUse() * 60 * (1 - Math.min(0.5, S.b.gerador * 0.02)))} ⛽/min</span><span>Infecção</span><span>${Math.round(S.inf)}%</span><span>Produção</span><span>${Math.round((1 - S.inf / 200) * 100)}%</span></div><div class="sm mu" style="margin:6px 0">Com o gerador ligado a infecção cai. Sem energia ela sobe, a produção cai e sobreviventes vão embora.</div><button class="btn w ${S.genOn ? 'r' : ''}" data-act="gen">${S.genOn ? '⏻ Desligar (economiza combustível)' : '⚡ Ligar gerador'}</button></div>`;
    if (k === 'abrigo') h += `<div class="card kv"><span>Sobreviventes</span><span>${S.surv}/${survCap()}</span><span>Consumo</span><span>${(S.surv * 0.15).toFixed(1)} 🥫 e 💧/min</span><span>Chegada</span><span>1 a cada 20s</span></div><div class="sm mu">Novos sobreviventes só chegam com comida, água e infecção abaixo de 60%.</div>`;
    if (k === 'armazem') h += `<div class="card kv"><span>Limite por recurso</span><span>${fmt(capRes('comida'))}</span><span>Protegido de saques</span><span>${fmt(protRes('comida'))}</span></div>`;
    if (k === 'muralha') h += `<div class="card kv"><span>Bônus de vida na defesa</span><span>+${S.b.muralha * 4}%</span><span>Tropas em casa</span><span>${fmt(armyCount(S.troops))}</span><span>Escudo</span><span>${S.shield > now() ? ftime((S.shield - now()) / 1000) : 'nenhum'}</span></div><button class="btn g w" style="margin-bottom:8px" data-act="useitem" data-a="escudo">🛡️ Usar Escudo de Paz (${S.items.escudo || 0})</button>`;
    if (k === 'posto') h += `<div class="card kv"><span>Marchas simultâneas</span><span>${maxMarches()}</span><span>Liderança extra por herói</span><span>+${S.b.posto * 30}</span></div>`;
    if (k === 'centro') h += `<div class="card kv"><span>Ajudas por tarefa</span><span>${5 + S.b.centro + (myClan() ? myClan().tech.ajuda : 0)}</span><span>Bônus de doação</span><span>+${S.b.centro * 10}%</span></div>`;
    if (k === 'enfermaria' && L) { const hc = healCost(); h += `<div class="card"><div class="kv"><span>Feridos</span><span>${armyCount(S.wounded)} / ${woundCap()}</span><span>Redução de infecção</span><span>+${S.b.enfermaria * 10}%</span></div>${S.hq ? `<div style="margin-top:8px" class="row sp"><b>Curando ${armyCount(S.hq.army)}</b><b>${tmr(S.hq)}</b></div>${pbar(S.hq)}<button class="btn o sm" style="margin-top:6px" data-act="speed" data-a="h">⏩ Acelerar</button>` : armyCount(S.wounded) ? `<div style="margin:6px 0">${costHtml(hc.c, S.res)} <span class="sm mu">⏱️ ${ftime(hc.time)}</span></div><button class="btn w" data-act="heal">💉 Curar todos</button>` : '<div class="mu sm" style="margin-top:6px">Ninguém ferido.</div>'}</div>`; }
    if (k === 'enfermaria' && !L && armyCount(S.wounded)) h += `<div class="card sm">Você tem ${armyCount(S.wounded)} feridos esperando. Construa a Enfermaria para curá-los.</div>`;
    if (B.troop && L) h += trainBlock(B.troop);
    if (k === 'lab' && L) h += techBlock();
    if (k === 'oficina' && L) h += `<button class="btn g w" style="margin-bottom:8px" data-act="chief">👑 Equipamento do Líder</button>`;
    return h + upgradeBlock(k);
  });
}
ACT.collect = el => { const g = collect(el.dataset.a); if (g) toast('+' + fmt(g) + ' ' + RES[BLD[el.dataset.a].res].n); };
ACT.gen = () => { S.genOn = !S.genOn; toast(S.genOn ? 'Gerador ligado' : 'Gerador desligado. Cuidado com a infecção!', S.genOn ? '' : 'bad'); dirty(); save(); };
ACT.heal = () => heal();
ACT.useitem = el => { const k = el.dataset.a; if (!S.items[k]) return toast('Você não tem esse item.', 'bad'); if (k === 'escudo') { S.items.escudo--; S.shield = Math.max(now(), S.shield) + 2 * 3600e3; toast('Escudo ativado por 2h'); } dirty(); save(); };

function trainBlock(c) {
  const mt = maxTier(c); const sub = V.sub.tr; const t = V.tier[c] = clamp(V.tier[c] || mt, 1, mt);
  const q = S.tq[c]; let h = `<div class="card"><div class="row sp"><b>${CLS[c].e} ${CLS[c].n}</b><span class="sm mu">${CLS[c].d}</span></div>`;
  if (q) h += `<div class="row sp" style="margin-top:8px"><span>${q.from ? 'Promovendo' : 'Treinando'} <b>${q.n}× T${q.tier}</b></span><b>${tmr(q)}</b></div>${pbar(q, '')}<button class="btn o sm" style="margin-top:6px" data-act="speed" data-a="t:${c}">⏩ Acelerar</button>`;
  h += `<div class="tabs" style="margin-top:10px"><button class="tab ${sub === 'treinar' ? 'on' : ''}" data-act="trsub" data-a="treinar">Treinar</button><button class="tab ${sub === 'promover' ? 'on' : ''}" data-act="trsub" data-a="promover">Promover</button><button class="tab ${sub === 'tropas' ? 'on' : ''}" data-act="trsub" data-a="tropas">Tropas</button></div>`;
  if (sub === 'treinar') {
    const max = batchMax(c); const n = V.qty[c] = clamp(V.qty[c] || Math.min(max, 20), 1, max);
    h += `<div class="tiers">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `<button class="tier ${i === t ? 'on' : ''} ${i > mt ? 'lk' : ''}" data-act="tier" data-a="${c}" data-b="${i}">T${i}</button>`).join('')}</div>
    <div class="kv sm"><span>Ataque / Vida</span><span>${Math.round(T[t].atk)} / ${Math.round(T[t].hp)}</span><span>Poder por tropa</span><span>${T[t].pow}</span><span>Carga</span><span>${T[t].load}</span><span>Você tem T${t}</span><span>${fmt(S.troops[c][t] || 0)}</span></div>
    ${mt < 10 ? `<div class="sm mu" style="margin-top:4px">T${mt + 1} libera com ${BLD[trainBld(c)].n} Nv.${mt * 2 + 1}.</div>` : ''}
    <div class="row sp" style="margin-top:8px"><span>Quantidade</span><b id="qn-${c}">${n}</b></div>
    <input type="range" min="1" max="${max}" value="${n}" data-inp="qty" data-a="${c}">
    <div id="qc-${c}">${costHtml(trainCost(c, t, n), S.res)} <span class="sm mu">⏱️ ${ftime(trainTime(c, t, n))}</span></div>
    <button class="btn w ${q ? 'dis' : ''}" style="margin-top:6px" data-act="train" data-a="${c}">${q ? 'Fila ocupada' : '🪖 Treinar'}</button>`;
  } else if (sub === 'promover') {
    const low = Object.keys(S.troops[c]).map(Number).filter(x => x < mt && S.troops[c][x] > 0).sort((a, b) => a - b);
    if (!low.length) h += `<div class="mu sm">Nenhuma tropa abaixo de T${mt} para promover. A promoção transforma tropas fracas na categoria máxima pagando só a diferença.</div>`;
    else {
      const f = V.promo[c] = low.includes(V.promo[c]) ? V.promo[c] : low[0]; const have = S.troops[c][f]; const n = V.qty['p' + c] = clamp(V.qty['p' + c] || have, 1, have);
      h += `<div class="sm mu">Promover para <b class="ok">T${mt}</b> pagando só a diferença de custo e tempo.</div><div class="tiers">${low.map(i => `<button class="tier ${i === f ? 'on' : ''}" data-act="ptier" data-a="${c}" data-b="${i}">T${i}<div class="sm mu">${fmt(S.troops[c][i])}</div></button>`).join('')}</div>
      <div class="row sp"><span>T${f} → T${mt}</span><b id="pn-${c}">${n}</b></div><input type="range" min="1" max="${have}" value="${n}" data-inp="pqty" data-a="${c}">
      <div id="pc-${c}">${costHtml(promoCost(c, f, mt, n), S.res)} <span class="sm mu">⏱️ ${ftime(promoTime(c, f, mt, n))}</span></div>
      <div class="sm mu">Treinar do zero custaria: ${costHtml(trainCost(c, mt, n))} ⏱️ ${ftime(trainTime(c, mt, n))}</div>
      <button class="btn o w ${q ? 'dis' : ''}" style="margin-top:6px" data-act="promote" data-a="${c}">${q ? 'Fila ocupada' : '⬆️ Promover'}</button>`;
    }
  } else {
    const all = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(i => S.troops[c][i] || S.wounded[c][i]);
    h += all.length ? `<div class="kv">${all.map(i => `<span>T${i}</span><span>${fmt(S.troops[c][i] || 0)}${S.wounded[c][i] ? ` <span class="no sm">(+${S.wounded[c][i]} feridos)</span>` : ''}</span>`).join('')}</div>` : '<div class="mu sm">Nenhuma tropa.</div>';
  }
  return h + '</div>';
}
ACT.trsub = el => { V.sub.tr = el.dataset.a; renderSheet(); };
ACT.tier = el => { if (+el.dataset.b > maxTier(el.dataset.a)) return toast('Melhore o prédio para liberar.', 'bad'); V.tier[el.dataset.a] = +el.dataset.b; renderSheet(); };
ACT.ptier = el => { V.promo[el.dataset.a] = +el.dataset.b; V.qty['p' + el.dataset.a] = 0; renderSheet(); };
ACT.train = el => { const c = el.dataset.a; startTrain(c, V.tier[c], V.qty[c]); };
ACT.promote = el => { const c = el.dataset.a; startPromo(c, V.promo[c], V.qty['p' + c]); };
const INP = {
  qty: el => { const c = el.dataset.a; const n = V.qty[c] = +el.value; $('#qn-' + c).textContent = n; $('#qc-' + c).innerHTML = costHtml(trainCost(c, V.tier[c], n), S.res) + ` <span class="sm mu">⏱️ ${ftime(trainTime(c, V.tier[c], n))}</span>`; },
  pqty: el => { const c = el.dataset.a; const n = V.qty['p' + c] = +el.value; const mt = maxTier(c); $('#pn-' + c).textContent = n; $('#pc-' + c).innerHTML = costHtml(promoCost(c, V.promo[c], mt, n), S.res) + ` <span class="sm mu">⏱️ ${ftime(promoTime(c, V.promo[c], mt, n))}</span>`; },
  mcnt: el => { V.md.cnt[el.dataset.a] = +el.value; updMarch(); },
};
function techBlock() {
  let h = '';
  if (S.rq) h += `<div class="card"><div class="row sp"><b>${TECH[S.rq.id].e} ${TECH[S.rq.id].n} → Nv.${S.rq.to}</b><b>${tmr(S.rq)}</b></div>${pbar(S.rq)}<button class="btn o sm" style="margin-top:6px" data-act="speed" data-a="r">⏩ Acelerar</button></div>`;
  h += '<div class="card list">' + Object.keys(TECH).map(id => { const L = S.tech[id], c = techCost(id, L + 1); return `<div class="it"><span style="font-size:24px">${TECH[id].e}</span><div style="flex:1"><div class="b">${TECH[id].n} <span class="mu">Nv.${L}/${S.b.lab}</span></div><div class="sm mu">${TECH[id].d}</div><div>${costHtml(c, S.res)} <span class="sm mu">⏱️ ${ftime(techTime(id, L + 1))}</span></div></div><button class="btn sm ${S.rq || L >= S.b.lab || !has(c) ? 'dis' : ''}" data-act="tech" data-a="${id}">Pesquisar</button></div>`; }).join('') + '</div>';
  return h;
}
ACT.tech = el => startTech(el.dataset.a);

// ---------- acelerar ----------
function openSpeed(key) {
  openSheet('⏩ Acelerar', () => {
    const q = getQ(key); if (!q) return '<div class="empty">Concluído! ✅</div><button class="btn w" data-act="close">OK</button>';
    const left = (q.end - now()) / 1000;
    return `<div class="card"><div class="row sp"><b>Tempo restante</b><b class="gd">${tmr(q)}</b></div>${pbar(q)}</div>
    ${left <= freeTime() ? `<button class="btn w y" data-act="sp" data-a="${key}" data-b="free" style="margin-bottom:8px">✨ Concluir grátis</button>` : `<div class="sm mu" style="margin-bottom:8px">Nos últimos 5 minutos a conclusão é grátis.</div>`}
    <div class="card list">${['acel1', 'acel5', 'acel60'].map(k => `<div class="it"><span style="font-size:22px">${ITEMS[k].e}</span><div style="flex:1"><b>${ITEMS[k].n}</b><div class="sm mu">Você tem ${S.items[k] || 0}</div></div><button class="btn sm ${S.items[k] ? '' : 'dis'}" data-act="sp" data-a="${key}" data-b="${k}">Usar</button></div>`).join('')}
    <div class="it"><span style="font-size:22px">🪙</span><div style="flex:1"><b>Concluir agora</b><div class="sm mu">${Math.ceil(left / 60)} fichas (você tem ${S.chips})</div></div><button class="btn sm o ${S.chips >= Math.ceil(left / 60) ? '' : 'dis'}" data-act="sp" data-a="${key}" data-b="chips">Usar</button></div></div>
    <div class="sm mu">Fichas são ganhas jogando (tarefas, hordas, exploração). Não existe compra com dinheiro.</div>`;
  });
}
ACT.speed = el => openSpeed(el.dataset.a);
ACT.sp = el => { const q = getQ(el.dataset.a); if (q) speedUp(q, el.dataset.b); renderSheet(); };

// ---------- itens / exército / relatórios / ajuda ----------
ACT.items = () => openSheet('🎒 Itens', () => `<div class="card list">${Object.keys(ITEMS).map(k => `<div class="it"><span style="font-size:24px">${ITEMS[k].e}</span><div style="flex:1"><b>${ITEMS[k].n}</b></div><b>${fmt(S.items[k] || 0)}</b>${k === 'escudo' ? `<button class="btn sm" data-act="useitem" data-a="escudo">Usar</button>` : ''}</div>`).join('')}<div class="it"><span style="font-size:24px">🪙</span><div style="flex:1"><b>Fichas</b><div class="sm mu">Moeda ganha jogando. Acelera tudo.</div></div><b>${fmt(S.chips)}</b></div></div>`);
ACT.troops = () => openSheet('🪖 Exército', () => {
  let h = `<div class="card kv"><span>Poder total</span><span class="gd">${fmt(playerPower())}</span><span>Tropas em casa</span><span>${fmt(armyCount(S.troops))}</span><span>Em marcha</span><span>${fmt(S.marches.reduce((a, m) => a + armyCount(m.army), 0))}</span><span>Feridos</span><span>${fmt(armyCount(S.wounded))}</span></div>`;
  CK.forEach(c => { const tiers = Object.keys(S.troops[c]).map(Number).sort((a, b) => b - a); h += `<div class="card"><div class="row sp"><b>${CLS[c].e} ${CLS[c].n}</b><span class="sm mu">${CLS[c].d}</span></div>${tiers.length ? `<div class="kv sm" style="margin-top:6px">${tiers.map(t => `<span>T${t}</span><span>${fmt(S.troops[c][t])}</span>`).join('')}</div>` : '<div class="sm mu">Nenhuma</div>'}<button class="btn g sm" style="margin-top:6px" data-act="openb" data-a="${trainBld(c)}">Abrir ${BLD[trainBld(c)].n}</button></div>`; });
  return h + `<div class="card sm mu">Triângulo: 🪓 Brutos vencem 🏍️ Motoqueiros, que vencem 🎯 Atiradores, que vencem 🪓 Brutos (+40% de dano).</div>`;
});
ACT.reports = () => { S.seenRep = now(); openSheet('📜 Relatórios', () => S.reports.length ? S.reports.map(r => `<div class="card"><div class="row"><span style="font-size:24px">${r.icon}</span><div style="flex:1"><b class="${r.win ? 'ok' : ''}">${esc(r.title)}</b><div class="sm mu">${new Date(r.t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div></div></div><div class="sm" style="margin-top:4px">${esc(r.text)}</div>${r.rw ? `<div style="margin-top:4px">${rwHtml(r.rw)}</div>` : ''}</div>`).join('') : '<div class="empty">Nenhum relatório ainda.</div>'); };
ACT.help = () => openSheet('❔ Como jogar', () => `<div class="card sm">
<p><b>🏚️ Bunker Central</b> é o nível da sua conta. Para subir, ele exige a Muralha e outras construções no nível atual. As outras construções ficam limitadas ao nível do Bunker.</p>
<p><b>🌽 Recursos:</b> as construções produzem sozinhas até encher. Toque nelas ou em "Recolher tudo". Sobreviventes trabalham nelas: falta de gente reduz a produção.</p>
<p><b>⚡ Gerador e ☣️ Infecção:</b> o gerador queima combustível. Sem ele a infecção sobe, a produção cai e o pessoal vai embora.</p>
<p><b>🪖 Tropas:</b> 3 classes em triângulo, 10 categorias (T1–T10). Cada prédio tem 1 fila. <b>Promova</b> tropas fracas para a categoria máxima pagando só a diferença.</p>
<p><b>🦸 Heróis:</b> recrute com Sinais de Rádio, suba nível com Manuais, estrelas com fragmentos, habilidades com Medalhas e equipamentos com Liga. Até 5 na formação; cada herói lidera tropas na marcha. A Exploração usa só os heróis.</p>
<p><b>🗺️ Mapa:</b> colete recursos, derrote hordas de nível crescente, ataque bases e faça ataques em grupo contra Gigantes e Torres de Rádio (território do clã).</p>
<p><b>🏴 Clãs de IA:</b> todo mundo no mapa é IA. Os clãs crescem, guerreiam e ajudam. Membros infelizes (derrotas, líder fraco, poucas recompensas) <b>se revoltam</b>: saem, trocam de clã ou fundam clãs novos. Clãs podem sumir ou se fundir.</p>
<p><b>⏩ Tempo:</b> tudo acontece em tempo real, acelerado. Ao reabrir o jogo, o mundo recupera o que aconteceu (até 1h de simulação).</p>
<p class="mu">Não há compras com dinheiro real. Fichas são ganhas jogando. O progresso fica salvo neste aparelho.</p></div><button class="btn r sm" data-act="reset">Apagar progresso e recomeçar</button>`);
ACT.reset = () => { if (confirm('Apagar todo o progresso do Refúgio Zero?')) { localStorage.removeItem(SAVE_KEY); S = null; location.reload(); } };

// ---------- tarefas / evento ----------
ACT.daily = () => openSheet('📋 Tarefas diárias', () => {
  ensureDaily(); const p = dailyPts();
  return `${!S.daily.login ? `<div class="card row"><span style="font-size:28px">🎁</span><div style="flex:1"><b>Presente diário</b><div class="sm mu">50 fichas + 1 Sinal de Rádio + aceleração</div></div><button class="btn y sm" data-act="login">Pegar</button></div>` : ''}
  <div class="card"><div class="row sp"><b>Atividade de hoje</b><b class="gd">${p} pts</b></div><div class="bar"><i style="width:${Math.min(100, p)}%"></i></div>
  <div class="chest">${DCHEST.map((c, i) => `<button class="cb ${S.daily.claimed.includes(i) ? 'done' : p >= c.p ? 'ready' : ''}" data-act="chest" data-a="${i}">${S.daily.claimed.includes(i) ? '✅' : '🧰'}<small>${c.p}</small></button>`).join('')}</div></div>
  <div class="card list">${DAILY.map(d => { const v = Math.min(d.g, S.daily.prog[d.k] || 0); return `<div class="it"><span>${v >= d.g ? '✅' : '⬜'}</span><div style="flex:1"><b>${d.n}</b><div class="bar"><i style="width:${v / d.g * 100}%"></i></div></div><span class="sm mu">${v}/${d.g} · +${d.p}</span></div>`; }).join('')}</div><div class="sm mu">Renova à meia-noite.</div>`;
});
ACT.login = () => { ensureDaily(); if (S.daily.login) return; S.daily.login = true; gain({ chips: 50, radio: 1, acel5: 1 }); toast('Presente diário recebido!'); dirty(); save(); };
ACT.chest = el => { const rw = claimChest(+el.dataset.a); if (rw) toast('Baú: ' + rwText(rw)); renderSheet(); };
ACT.event = () => openSheet('🏆 Desafio do Sobrevivente', () => {
  ensureDaily(); const e = S.event; const end = e.start + 3 * 864e5;
  return `<div class="card"><div class="row sp"><b>Pontos</b><b class="gd">${fmt(e.pts)}</b></div><div class="sm mu">Termina em <span data-end="${end}">${ftime((end - now()) / 1000)}</span></div>
  <div class="sm" style="margin-top:6px">Ganhe pontos construindo (50 × nível), treinando (1 × categoria por tropa), derrotando hordas (100 × nível), vencendo a Exploração e coletando no mapa.</div></div>
  <div class="card list">${EVM.map((c, i) => `<div class="it"><span style="font-size:22px">${e.claimed.includes(i) ? '✅' : '🏆'}</span><div style="flex:1"><b>${fmt(c.p)} pontos</b><div>${rwHtml(c.rw)}</div></div><button class="btn sm ${e.pts >= c.p && !e.claimed.includes(i) ? 'y' : 'dis'}" data-act="evclaim" data-a="${i}">Pegar</button></div>`).join('')}</div>`;
});
ACT.evclaim = el => { claimEvent(+el.dataset.a); renderSheet(); };

// ---------- exploração ----------
function openExplore() {
  openSheet('🧭 Exploração', () => {
    const s = S.exp.stage, sp = stagePow(s), fp = formPow(), ch = exploreChance(), idle = idleRw();
    return `<div class="card"><div class="sm mu">Os heróis da formação exploram ruínas sozinhos, sem tropas. Cada fase vencida aumenta o saque automático.</div>
    <div class="vs"><div><div class="mu sm">Sua formação</div><div class="big ok">${fmt(fp)}</div></div><div style="font-size:26px">⚔️</div><div><div class="mu sm">Fase ${s}</div><div class="big no">${fmt(sp)}</div></div></div>
    <div class="row sp"><span>Chance de vitória</span><b class="${ch > 0.6 ? 'ok' : ch > 0.3 ? 'gd' : 'no'}">${Math.round(ch * 100)}%</b></div>
    <div class="sm mu" style="margin:4px 0">Recompensa: ${rwHtml({ manual: 2 + Math.floor(s / 2), chips: 10 + s * 2, sucata: 300 * s })}${s % 5 === 0 ? ' + 📡 2 + 🏅 3' : ''}</div>
    <button class="btn w o" data-act="explore_go">⚔️ Lutar na fase ${s}</button></div>
    <div class="card"><div class="row sp"><b>💰 Saque automático</b><span class="sm mu">${Math.floor(idle.min)} min (máx. 8h)</span></div><div style="margin:6px 0">${rwHtml(idle) || '<span class="sm mu">Juntando...</span>'}</div><button class="btn y w ${idle.min < 1 ? 'dis' : ''}" data-act="idle">Recolher</button></div>
    <button class="btn g w" data-act="tabheroes">🦸 Ajustar formação</button>`;
  });
}
ACT.explore = () => openExplore();
ACT.explore_go = () => { const r = explore(); toast(r.ok ? `Vitória na fase ${r.s}!` : `Derrota na fase ${r.s}. Fortaleça seus heróis.`, r.ok ? '' : 'bad'); renderSheet(); };
ACT.idle = () => { claimIdle(); renderSheet(); };
ACT.tabheroes = () => tabGo('herois');

// ---------- equipamento do líder ----------
ACT.chief = () => openSheet('👑 Equipamento do Líder', () => `<div class="sm mu" style="margin-bottom:6px">Forjado na Oficina com Sucata, Combustível e Liga Metálica. Cada nível dá +2% ao atributo da classe indicada. Nível máximo = 2 × nível da Oficina.</div>
  <div class="card list">${Object.keys(CHIEF).map(k => { const G = CHIEF[k], L = S.chief[k], c = chiefCost(L); return `<div class="it"><span style="font-size:26px">${G.e}</span><div style="flex:1"><b>${G.n} <span class="mu">Nv.${L}</span></b><div class="sm mu">+${L * 2}% ${G.st === 'atk' ? 'ataque' : 'vida'} ${CLS[G.c].e} ${CLS[G.c].n}</div><div>${costHtml(c, Object.assign({}, S.res, S.items))}</div></div><button class="btn sm ${!S.b.oficina || L >= S.b.oficina * 2 || !has(c) ? 'dis' : ''}" data-act="chiefup" data-a="${k}">Forjar</button></div>`; }).join('')}</div>${!S.b.oficina ? '<div class="no sm">Construa a Oficina (Bunker Nv.5).</div>' : ''}`);
ACT.chiefup = el => { chiefUp(el.dataset.a); };

// ---------- HERÓIS ----------
function viewHeroes() {
  const ids = Object.keys(HEROES).sort((a, b) => (S.heroes[b].on - S.heroes[a].on) || heroPower(b) - heroPower(a) || S.heroes[b].shards - S.heroes[a].shards);
  let h = `<h2>🦸 Formação <span class="mu sm">(até 5 heróis)</span></h2><div class="card"><div class="form">${[0, 1, 2, 3, 4].map(i => { const id = S.form[i]; return id ? `<button class="fs" data-act="hero" data-a="${id}" style="border:2px solid ${RAR[HEROES[id].r].c};background:radial-gradient(circle,${RAR[HEROES[id].r].c}33,#0008)">${HEROES[id].e}<small>${fmt(heroPower(id))}</small></button>` : `<div class="fs mu">＋</div>`; }).join('')}</div>
  <div class="row sp" style="margin-top:8px"><span class="mu">Poder da formação</span><b class="gd">${fmt(formPow())}</b></div><button class="btn o w" style="margin-top:6px" data-act="explore">🧭 Exploração (fase ${S.exp.stage})</button></div>
  <div class="card row ${S.tut === 3 ? 'hl' : ''}"><span style="font-size:34px">📡</span><div style="flex:1"><b>Recrutamento por rádio</b><div class="sm mu">Sinais: ${S.items.radio}. Cada sinal traz fragmentos de um herói (10% lendário).</div></div><div style="display:flex;flex-direction:column;gap:5px"><button class="btn sm ${S.items.radio >= 1 ? '' : 'dis'}" data-act="recruit" data-a="1">1×</button><button class="btn sm o ${S.items.radio >= 10 ? '' : 'dis'}" data-act="recruit" data-a="10">10×</button></div></div>
  <h3>Heróis</h3><div class="hgrid">`;
  ids.forEach(id => { const H = HEROES[id], s = S.heroes[id]; h += `<button class="hc ${s.on ? '' : 'off'}" data-act="hero" data-a="${id}">${heroFace(id, 46)}<div style="min-width:0"><div class="b" style="font-size:13px">${H.n}</div>${s.on ? `${stars(s.stars)}<div class="sm mu">Nv.${s.lvl} · ⚔️ ${fmt(heroPower(id))}</div>` : `<div class="sm ${s.shards >= 10 ? 'ok b' : 'mu'}">🧩 ${s.shards}/10${s.shards >= 10 ? ' · liberar!' : ''}</div>`}${S.form.includes(id) ? '<span class="tag ok">Formação</span>' : ''}</div></button>`; });
  return h + '</div>';
}
ACT.recruit = el => { const got = recruit(+el.dataset.a); if (!got) return; openSheet('📡 Recrutamento', () => `<div class="hgrid">${Object.keys(got).map(id => `<div class="hc">${heroFace(id, 46)}<div><b style="font-size:13px">${HEROES[id].n}</b><div class="sm" style="color:${RAR[HEROES[id].r].c}">${RAR[HEROES[id].r].n}</div><div class="b ok">+${got[id]} 🧩</div><div class="sm mu">${S.heroes[id].on ? 'Já no refúgio' : S.heroes[id].shards + '/10 para liberar'}</div></div></div>`).join('')}</div><button class="btn w" style="margin-top:10px" data-act="close">OK</button>`); };
function openHero(id) {
  const H = HEROES[id];
  openSheet(() => `${H.e} ${H.n}`, () => {
    const s = S.heroes[id], b = heroBonus(id); const inF = S.form.includes(id);
    let h = `<div class="hero card">${heroFace(id, 64)}<div style="flex:1"><div style="color:${RAR[H.r].c}" class="b">${RAR[H.r].n} · ${CLS[H.c].e} ${CLS[H.c].n}</div>${stars(s.stars)}<div class="sm mu">${H.bio}</div></div></div>`;
    if (!s.on) return h + `<div class="card"><div class="row sp"><b>Fragmentos</b><b>${s.shards}/10</b></div><div class="bar"><i style="width:${Math.min(100, s.shards * 10)}%"></i></div><button class="btn w ${s.shards >= 10 ? 'y' : 'dis'}" style="margin-top:8px" data-act="star" data-a="${id}">Liberar herói</button></div><div class="sm mu">Consiga fragmentos no Recrutamento por rádio.</div>`;
    h += `<div class="card kv"><span>Poder</span><span class="gd">${fmt(heroPower(id))}</span><span>Nível</span><span>${s.lvl}/${heroMaxLvl()}</span><span>Liderança (tropas)</span><span>${fmt(leadership(id))}</span><span>Bônus ${CLS[H.c].n}</span><span>+${Math.round(b.atk * 100)}% atq · +${Math.round(b.hp * 100)}% vida</span></div>
    <button class="btn w ${inF ? 'g' : ''}" style="margin-bottom:8px" data-act="form" data-a="${id}">${inF ? 'Tirar da formação' : 'Colocar na formação'}</button>
    <div class="card"><div class="row sp"><b>📘 Subir nível</b><span class="sm mu">Manuais: ${S.items.manual}</span></div><div class="row" style="gap:6px;margin-top:6px"><button class="btn sm ${S.items.manual >= lvlCost(id) && s.lvl < heroMaxLvl() ? '' : 'dis'}" data-act="lvl" data-a="${id}" data-b="1">+1 (📘${lvlCost(id)})</button><button class="btn sm o ${S.items.manual >= lvlCost(id) && s.lvl < heroMaxLvl() ? '' : 'dis'}" data-act="lvl" data-a="${id}" data-b="10">+10</button></div></div>
    <div class="card"><div class="row sp"><b>⭐ Estrelas</b><span class="sm mu">🧩 ${s.shards}${s.stars < 5 ? '/' + STAR_COST[s.stars] : ''}</span></div><button class="btn sm y ${s.stars < 5 && s.shards >= STAR_COST[s.stars] ? '' : 'dis'}" style="margin-top:6px" data-act="star" data-a="${id}">${s.stars >= 5 ? 'Máximo' : 'Subir para ' + (s.stars + 1) + '★'}</button></div>
    <div class="card list"><b>🏅 Habilidades</b> <span class="sm mu">Medalhas: ${S.items.medalha}</span>${H.s.map((n, i) => `<div class="it"><span style="font-size:20px">${i ? '🛡️' : '⚔️'}</span><div style="flex:1"><b>${n} <span class="mu">Nv.${s.sk[i]}/5</span></b><div class="sm mu">+${s.sk[i] * 2.5}% ${i ? 'vida' : 'ataque'} dos ${CLS[H.c].n}</div></div><button class="btn sm ${s.sk[i] < 5 && S.items.medalha >= s.sk[i] * 3 ? '' : 'dis'}" data-act="skill" data-a="${id}" data-b="${i}">🏅${s.sk[i] * 3}</button></div>`).join('')}</div>
    <div class="card list"><b>🛠️ Equipamento</b> <span class="sm mu">Liga: ${S.items.liga} · máx Nv.${Math.min(10, Math.max(1, S.b.oficina) * 2)}</span>${Object.keys(GEAR).map(g => { const L = s.gear[g], c = gearCost(L); return `<div class="it"><div style="flex:1"><b>${GEAR[g]} <span class="mu">Nv.${L}</span></b><div>${costHtml(c, Object.assign({}, S.res, S.items))}</div></div><button class="btn sm ${has(c) ? '' : 'dis'}" data-act="gear" data-a="${id}" data-b="${g}">Melhorar</button></div>`; }).join('')}</div>`;
    return h;
  });
}
ACT.hero = el => openHero(el.dataset.a);
ACT.form = el => { const id = el.dataset.a; if (S.form.includes(id)) { if (busyHeroes().has(id)) return toast('Herói está em marcha.', 'bad'); S.form = S.form.filter(x => x !== id); } else { if (S.form.length >= 5) return toast('Formação cheia (5).', 'bad'); S.form.push(id); } dirty(); save(); };
ACT.lvl = el => heroLvlUp(el.dataset.a, +el.dataset.b);
ACT.star = el => heroStar(el.dataset.a);
ACT.skill = el => heroSkill(el.dataset.a, +el.dataset.b);
ACT.gear = el => heroGear(el.dataset.a, el.dataset.b);

// ---------- MAPA: entidades e marchas ----------
ACT.mapme = () => mapFocus(S.x, S.y);
function findHorde(lv) {
  const W = S.world; const best = W.hordes.filter(h => !lv || h.lvl === lv).sort((a, b) => Math.hypot(a.x - S.x, a.y - S.y) - Math.hypot(b.x - S.x, b.y - S.y))[0];
  if (!best) return toast('Nenhuma horda desse nível no mapa.', 'bad'); mapFocus(best.x, best.y); MapV.sel = { kind: 'horde', o: best }; openEntity(MapV.sel);
}
ACT.findh = () => openSheet('🧟 Procurar horda', () => `<div class="sm mu">Maior horda já derrotada: Nv.${S.maxHorde || 0}</div><div class="tiers">${Array.from({ length: 20 }, (_, i) => i + 1).map(i => `<button class="tier ${S.world.hordes.some(h => h.lvl === i) ? '' : 'lk'}" data-act="findlv" data-a="${i}">${i}</button>`).join('')}</div>`);
ACT.findlv = el => findHorde(+el.dataset.a);
ACT.findn = () => { const W = S.world; const n = W.nodes.filter(x => !x.busy).sort((a, b) => Math.hypot(a.x - S.x, a.y - S.y) - Math.hypot(b.x - S.x, b.y - S.y))[0]; if (n) { mapFocus(n.x, n.y); MapV.sel = { kind: 'node', o: n }; openEntity(MapV.sel); } };
function dist(o) { return Math.hypot(o.x - S.x, o.y - S.y).toFixed(1); }
function counterOf(k) { return CK.find(c => CLS[c].beats === k); }
function openEntity(sel) {
  const o = sel.o, k = sel.kind;
  if (k === 'me') return openSheet('🏰 Seu refúgio', () => `<div class="card kv"><span>Poder</span><span>${fmt(playerPower())}</span><span>Bunker</span><span>Nv.${S.b.bunker}</span><span>Clã</span><span>${myClan() ? '[' + myClan().tag + '] ' + esc(myClan().name) : 'Nenhum'}</span><span>Coordenadas</span><span>${S.x}, ${S.y}</span></div><button class="btn w" data-act="gobase">Entrar na base</button>`);
  if (k === 'horde') return openSheet(`🧟 Horda de ${o.kind === 'x' ? 'Mistos' : ZCLS[o.kind]} Nv.${o.lvl}`, () => { const a = hordeArmy(o.lvl, o.kind); return `<div class="card kv"><span>Zumbis</span><span>${fmt(armyCount(a))}</span><span>Poder estimado</span><span class="no">${fmt(armyPow(a))}</span><span>Tipo</span><span>${o.kind === 'x' ? 'Misto' : ZCLS[o.kind] + ' (como ' + CLS[o.kind].n + ')'}</span><span>Distância</span><span>${dist(o)}</span></div><div class="sm mu" style="margin-bottom:6px">${o.kind !== 'x' ? `Dica: leve ${CLS[counterOf(o.kind)].n} ${CLS[counterOf(o.kind)].e}.` : 'Mistura de todos os tipos.'} Vencer dá recursos, Manuais, Liga e fichas.</div><button class="btn w r" data-act="mk" data-a="horde">⚔️ Atacar</button>`; });
  if (k === 'node') return openSheet(`${{ comida: '🌽', agua: '🛢️', sucata: '⚙️', comb: '⛽' }[o.res]} ${RES[o.res].n} Nv.${o.lvl}`, () => `<div class="card kv"><span>Disponível</span><span>${fmt(o.amt)}</span><span>Velocidade</span><span>${fmt((3 + o.lvl * 2.5) * 60)}/min</span><span>Distância</span><span>${dist(o)}</span><span>Estado</span><span>${o.busy ? 'Ocupado' : 'Livre'}</span></div><div class="sm mu" style="margin-bottom:6px">A quantidade coletada depende da carga das tropas (categorias altas carregam mais).</div><button class="btn w ${o.busy ? 'dis' : ''}" data-act="mk" data-a="gather">⛏️ Coletar</button>`);
  if (k === 'ai') return openSheet(() => `🏚️ ${esc(o.name)}`, () => { const c = o.clan && clanById(o.clan); const mine = c && c.id === S.clan; return `<div class="card kv"><span>Clã</span><span style="color:${c ? c.color : ''}">${c ? '[' + c.tag + '] ' + esc(c.name) + (c.leader === o.id ? ' 👑' : '') : 'Nômade'}</span><span>Bunker</span><span>Nv.${o.lvl}</span><span>Poder</span><span>${fmt(o.power)}</span><span>Humor</span><span><i class="mood" style="background:${moodCol(o.loyal)}"></i>${o.loyal >= 60 ? 'Feliz' : o.loyal >= 35 ? 'Desconfiado' : 'Revoltado'}</span><span>Vitórias / derrotas</span><span>${o.w} / ${o.l}</span><span>Distância</span><span>${dist(o)}</span></div>${mine ? '<div class="sm ok">É do seu clã.</div>' : `<div class="sm mu" style="margin-bottom:6px">Atacar derruba seu escudo e deixa esse jogador com raiva de você.</div><button class="btn w r" data-act="mk" data-a="attack">⚔️ Atacar base</button>`}`; });
  if (k === 'giant') return openSheet(`🦍 ${o.name} Nv.${o.lvl}`, () => { const a = hordeArmy(o.lvl * 2 + 4, null, 3); return `<div class="card kv"><span>Poder estimado</span><span class="no">${fmt(armyPow(a) * 1.2)}</span><span>Distância</span><span>${dist(o)}</span></div><div class="sm mu" style="margin-bottom:6px">Chefão: precisa de <b>ataque em grupo</b>. Seus aliados de IA do clã entram no ataque durante os 25s de reunião.</div><button class="btn w o ${S.clan ? '' : 'dis'}" data-act="mk" data-a="rally">🚩 Iniciar ataque em grupo</button>${S.clan ? '' : '<div class="sm no">Entre em um clã primeiro.</div>'}`; });
  if (k === 'tower') return openSheet(`📡 ${o.name}`, () => { const c = o.owner && clanById(o.owner); const mine = o.owner && o.owner === S.clan; return `<div class="card kv"><span>Dono</span><span style="color:${c ? c.color : ''}">${c ? '[' + c.tag + '] ' + esc(c.name) : 'Ninguém'}</span><span>Defesa estimada</span><span class="no">${fmt(armyPow(towerArmy(o)) * 1.1)}</span><span>Bônus para o clã dono</span><span>+8% produção · +3% ataque</span></div>${mine ? '<div class="ok b">Seu clã controla esta torre! 🎉</div>' : `<button class="btn w o ${S.clan ? '' : 'dis'}" data-act="mk" data-a="rally">🚩 Ataque em grupo para tomar</button>${S.clan ? '' : '<div class="sm no">Entre em um clã primeiro.</div>'}`}`; });
}
ACT.gobase = () => tabGo('base');
ACT.mk = el => { const sel = MapV.sel; if (!sel) return; openMarch(el.dataset.a, sel.o); };
function enemyFor(kind, o) { if (kind === 'horde') return { a: hordeArmy(o.lvl, o.kind), m: 1 }; if (kind === 'attack') return { a: aiArmy(o, 0.8), m: 1 + o.lvl * 0.03 }; if (kind === 'rally') return o.tower ? { a: towerArmy(o), m: 1.1 } : { a: hordeArmy(o.lvl * 2 + 4, null, 3), m: 1.2 }; return null; }
function openMarch(kind, o) {
  const busy = busyHeroes(); const free = S.form.filter(h => !busy.has(h) && S.heroes[h].on);
  const pref = kind === 'horde' && o.kind !== 'x' ? counterOf(o.kind) : null;
  const sorted = free.slice().sort((a, b) => (pref ? (HEROES[b].c === pref) - (HEROES[a].c === pref) : 0) || heroPower(b) - heroPower(a));
  V.md = { kind, o, heroes: sorted.slice(0, kind === 'gather' ? 1 : 3), cnt: { b: 0, m: 0, a: 0 }, pref };
  autoCnt();
  const name = kind === 'gather' ? 'Coleta' : kind === 'rally' ? 'Ataque em grupo' : 'Ataque';
  openSheet(`🚩 ${name}`, () => {
    const md = V.md; if (!md) return '';
    const avail = S.form.filter(h => S.heroes[h].on);
    let h = `<div class="sm mu">Alvo: <b>${esc(o.name || (kind === 'horde' ? 'Horda Nv.' + o.lvl : kind === 'gather' ? RES[o.res].n + ' Nv.' + o.lvl : ''))}</b> · Marchas ${S.marches.length}/${maxMarches()}</div>
    <h3>Heróis (formação)</h3><div class="form">${avail.map(id => { const on = md.heroes.includes(id), b = busy.has(id); return `<button class="fs" style="${on ? `border:2px solid ${RAR[HEROES[id].r].c};background:${RAR[HEROES[id].r].c}33` : ''};${b ? 'opacity:.3' : ''}" data-act="mh" data-a="${id}">${HEROES[id].e}<small>${b ? 'em marcha' : CLS[HEROES[id].c].e + ' ' + leadership(id)}</small></button>`; }).join('') || '<div class="mu sm">Coloque heróis na formação.</div>'}</div>
    <h3>Tropas <span id="mcap"></span></h3>`;
    CK.forEach(c => { const av = Object.values(S.troops[c]).reduce((a, b) => a + b, 0); h += `<div class="row sp sm"><span>${CLS[c].e} ${CLS[c].n} ${md.pref === c ? '<span class="tag ok">recomendado</span>' : ''}</span><b id="mc-${c}">${md.cnt[c]}</b></div><input type="range" min="0" max="${av}" value="${md.cnt[c]}" data-inp="mcnt" data-a="${c}" ${av ? '' : 'disabled'}>`; });
    h += `<div class="row" style="gap:6px"><button class="btn g sm" data-act="mauto">⚙️ Preencher automático</button></div><div class="card" id="minfo" style="margin-top:8px"></div>
    <button class="btn w ${kind === 'gather' ? '' : 'r'}" data-act="msend">🚀 Enviar</button>`;
    setTimeout(updMarch, 0); return h;
  });
}
function autoCnt() { const md = V.md; const a = autoArmy(md.heroes, md.pref); CK.forEach(c => md.cnt[c] = Object.values(a[c]).reduce((x, y) => x + y, 0)); }
function buildArmy() { const md = V.md; const a = emptyArmy(); CK.forEach(c => { let n = md.cnt[c]; Object.keys(S.troops[c]).map(Number).sort((x, y) => y - x).forEach(t => { if (n <= 0) return; const k = Math.min(n, S.troops[c][t]); if (k > 0) { a[c][t] = k; n -= k; } }); }); return a; }
function updMarch() {
  const md = V.md; if (!md) return; const cap = md.heroes.reduce((a, h) => a + leadership(h), 0); const army = buildArmy(); const n = armyCount(army);
  CK.forEach(c => { const e = $('#mc-' + c); if (e) e.textContent = md.cnt[c]; });
  const mc = $('#mcap'); if (mc) mc.innerHTML = `<span class="${n > cap ? 'no' : 'ok'}">${n}/${cap}</span>`;
  const info = $('#minfo'); if (!info) return;
  let t = `<div class="kv"><span>Viagem</span><span>${ftime(travel(md.o.x, md.o.y, army))}${md.kind === 'rally' ? ' + 25s reunião' : ''}</span>`;
  if (md.kind === 'gather') { let capa = 0; CK.forEach(c => Object.keys(army[c]).forEach(tt => capa += army[c][tt] * T[tt].load)); t += `<span>Carga</span><span>${fmt(capa * (1 + S.tech.logi * 0.06))}</span>`; }
  const en = enemyFor(md.kind, md.o);
  if (en) { const m = mods(md.heroes); const avg = CK.reduce((a, c) => a + m.atk[c] + m.hp[c], 0) / 6; const my = armyPow(army) * avg, ep = armyPow(en.a) * en.m; t += `<span>Seu poder</span><span class="ok">${fmt(my)}</span><span>Inimigo</span><span class="no">${fmt(ep)}</span><span>Previsão</span><span class="${my > ep * 1.15 ? 'ok' : my > ep * 0.85 ? 'gd' : 'no'}">${md.kind === 'rally' ? 'Aliados vão reforçar' : my > ep * 1.15 ? 'Vitória provável' : my > ep * 0.85 ? 'Equilibrado' : 'Arriscado'}</span>`; }
  info.innerHTML = t + '</div>' + (n > cap ? '<div class="sm no">Acima da liderança dos heróis: leve mais heróis ou menos tropas.</div>' : '');
}
ACT.mh = el => { const md = V.md; const id = el.dataset.a; if (busyHeroes().has(id)) return; if (md.heroes.includes(id)) md.heroes = md.heroes.filter(x => x !== id); else md.heroes.push(id); autoCnt(); renderSheet(); };
ACT.mauto = () => { autoCnt(); renderSheet(); };
ACT.msend = () => { const md = V.md; if (!md) return; const cap = md.heroes.reduce((a, h) => a + leadership(h), 0); const army = buildArmy(); if (armyCount(army) > cap) return toast('Tropas acima da liderança.', 'bad'); const o = md.o; const m = sendMarch(md.kind, { x: o.x, y: o.y, id: o.id, name: md.kind === 'horde' ? 'Horda Nv.' + o.lvl : md.kind === 'gather' ? RES[o.res].n : o.name }, md.heroes, army); if (m) { closeSheet(); toast('Marcha enviada!'); if (V.tab !== 'mapa') tabGo('mapa'); } };
ACT.march = el => { const id = +el.dataset.a; if (!S.marches.find(x => x.id === id)) return; openSheet('🚩 Marcha', () => { const mm = S.marches.find(x => x.id === id); if (!mm) return '<div class="empty">Marcha concluída.</div>'; return `<div class="card kv"><span>Destino</span><span>${esc(mm.tname || '')}</span><span>Fase</span><span>${{ go: 'Indo', work: 'Coletando', back: 'Voltando', wait: 'Reunindo aliados' }[mm.phase]}</span><span>Tempo</span><span><span data-end="${mm.t1}">${ftime((mm.t1 - now()) / 1000)}</span></span><span>Tropas</span><span>${fmt(armyCount(mm.army))}</span><span>Heróis</span><span>${mm.heroes.map(h => HEROES[h].e).join(' ')}</span>${mm.kind === 'rally' ? `<span>Aliados</span><span>${mm.joiners.length ? mm.joiners.map(j => esc(j.name)).join(', ') : 'aguardando...'}</span>` : ''}</div>${mm.phase !== 'back' ? '<button class="btn r w" data-act="recall" data-a="' + mm.id + '">↩️ Chamar de volta</button>' : ''}`; }); };
ACT.recall = el => { const m = S.marches.find(x => x.id === +el.dataset.a); if (m) recall(m); closeSheet(); };

// ---------- CLÃ ----------
function viewClan() {
  const c = myClan(); const R = rankClans();
  if (!c) {
    return `<h2>🏴 Clãs da região</h2><div class="card sm">Todos os clãs são controlados por IA e mudam o tempo todo: crescem, guerreiam, se revoltam e se dividem. Num clã você recebe ajuda nas obras, faz ataques em grupo e disputa as Torres de Rádio.</div>
    <div class="card"><b>Criar meu clã</b><div class="sm mu">Exige Bunker Nv.3 e 200 🪙. Sobreviventes de IA vão pedir para entrar.</div><input class="tin" id="cname" maxlength="24" placeholder="Nome do clã"><button class="btn o w ${S.b.bunker >= 3 && S.chips >= 200 ? '' : 'dis'}" data-act="ccreate">🏴 Fundar clã</button></div>
    <h3>Entrar em um clã</h3>${R.map((r, i) => clanRow(r, i, true)).join('')}`;
  }
  const rank = R.findIndex(r => r.c === c) + 1; const lead = c.leader === 'P'; const L = lead ? null : aiById(c.leader);
  const sub = V.sub.cla;
  let h = `<div class="card"><div class="row">${flag(c, 52)}<div style="flex:1"><div class="b" style="font-size:17px">${esc(c.name)}</div><div class="sm mu">Líder: ${lead ? '<b class="ok">Você 👑</b>' : esc(L ? L.name : '?')} · ${memberCount(c)}/${MAX_CLAN} membros</div><div class="sm">⚔️ ${fmt(clanPower(c))} · #${rank} no ranking</div></div></div>
    <div class="row sp sm" style="margin-top:8px"><span>Moral do clã</span><b style="color:${moodCol(c.morale)}">${Math.round(c.morale)}%</b></div><div class="bar"><i style="width:${c.morale}%;background:${moodCol(c.morale)}"></i></div>
    <div class="sm mu" style="margin-top:4px">${c.wars.length ? '🔥 Em guerra com ' + c.wars.map(id => '[' + clanTag(id) + ']').join(', ') : '🕊️ Em paz'} · 📡 Torres: ${S.world.towers.filter(t => t.owner === c.id).length}</div></div>
    <div class="tabs">${[['membros', '👥 Membros'], ['chat', '💬 Chat'], ['ajuda', '🤝 Ajuda'], ['guerra', '⚔️ Guerra'], ['ranking', '🏆 Ranking']].map(x => `<button class="tab ${sub === x[0] ? 'on' : ''}" data-act="csub" data-a="${x[0]}">${x[1]}</button>`).join('')}</div>`;
  if (sub === 'membros') {
    const mem = c.members.map(aiById).filter(Boolean).sort((a, b) => b.power - a.power);
    const unhappy = mem.filter(m => m.loyal < 35).length;
    h += `${unhappy ? `<div class="card sm" style="border-color:#6a3a18">⚠️ ${unhappy} membro${unhappy > 1 ? 's' : ''} insatisfeito${unhappy > 1 ? 's' : ''}. Membros revoltados podem sair ou fundar outro clã. ${lead ? 'Distribua suprimentos, vença ataques em grupo e tome torres para animar o clã.' : ''}</div>` : ''}
    <div class="row" style="gap:6px;margin-bottom:8px"><button class="btn y sm" data-act="cgift">🎁 Distribuir suprimentos</button><button class="btn g sm" data-act="cleave">Sair do clã</button></div>
    <div class="card list"><div class="it"><span>🧔</span><div style="flex:1"><b class="ok">${esc(S.name)} (você)</b><div class="sm mu">Bunker ${S.b.bunker} · ⚔️ ${fmt(playerPower())}</div></div>${lead ? '👑' : ''}</div>${mem.map(m => `<div class="it"><span><i class="mood" style="background:${moodCol(m.loyal)}"></i></span><div style="flex:1"><b>${esc(m.name)} ${c.leader === m.id ? '👑' : ''}</b><div class="sm mu">Bunker ${m.lvl} · ⚔️ ${fmt(m.power)} · ${m.loyal >= 60 ? 'feliz' : m.loyal >= 35 ? 'desconfiado' : '<span class="no">revoltado</span>'}</div></div>${lead ? `<button class="btn g sm" data-act="ckick" data-a="${m.id}">Expulsar</button>` : ''}</div>`).join('')}</div>`;
  } else if (sub === 'chat') {
    h += `<div class="chat autoscroll">${S.chat.slice(-40).map(m => `<div class="msg ${m.me ? 'me' : ''}"><b>${esc(m.who)}</b>${esc(m.text)}</div>`).join('') || '<div class="empty">Ninguém falou nada ainda.</div>'}</div><div class="cin"><input id="cmsg" maxlength="140" placeholder="Mensagem para o clã"><button class="btn sm" data-act="csay">Enviar</button></div>`;
  } else if (sub === 'ajuda') {
    h += `<div class="card row"><span style="font-size:28px">🤝</span><div style="flex:1"><b>Pedidos de ajuda</b><div class="sm mu">${S.world.helpReq || 0} membros pediram ajuda nas obras. Ajudar dá fichas e melhora a moral.</div></div><button class="btn sm ${S.world.helpReq ? '' : 'dis'}" data-act="chelp">Ajudar todos</button></div>
    <div class="card sm mu">Suas obras, pesquisas e curas recebem até ${5 + S.b.centro + c.tech.ajuda} ajudas dos membros (cada uma tira 2% ou pelo menos 10s).</div>
    <h3>Tecnologia do clã</h3><div class="card list">${Object.keys(CTECH).map(k => { const need = 200 * Math.pow(1.6, c.tech[k]); return `<div class="it"><span style="font-size:22px">${CTECH[k].e}</span><div style="flex:1"><b>${CTECH[k].n} <span class="mu">Nv.${c.tech[k]}/10</span></b><div class="sm mu">${CTECH[k].d}</div><div class="bar"><i style="width:${Math.min(100, c.pts[k] / need * 100)}%"></i></div></div><button class="btn sm" data-act="ctech" data-a="${k}">Doar</button></div>`; }).join('')}<div class="sm mu">Doação: ${costHtml({ comida: 400 * S.b.bunker, sucata: 300 * S.b.bunker }, S.res)}</div></div>`;
  } else if (sub === 'guerra') {
    h += `<h3>📡 Torres de Rádio (território)</h3>${S.world.towers.map(t => { const o = t.owner && clanById(t.owner); return `<div class="clanrow"><span style="font-size:24px">📡</span><div style="flex:1"><b>${t.name}</b><div class="sm" style="color:${o ? o.color : 'var(--mu)'}">${o ? '[' + o.tag + '] ' + esc(o.name) : 'Livre'}</div></div><button class="btn sm g" data-act="seetower" data-a="${t.id}">Ver no mapa</button></div>`; }).join('')}
    <h3>Diplomacia</h3>${lead ? '' : '<div class="sm mu" style="margin-bottom:6px">Só o líder declara guerra ou paz.</div>'}${R.filter(r => r.c !== c).map(r => `<div class="clanrow">${flag(r.c)}<div style="flex:1"><b>${esc(r.c.name)}</b><div class="sm mu">⚔️ ${fmt(r.p)} · ${memberCount(r.c)} membros</div></div>${c.wars.includes(r.c.id) ? '<span class="tag no">GUERRA</span>' : ''}${lead ? `<button class="btn sm ${c.wars.includes(r.c.id) ? 'g' : 'r'}" data-act="cwar" data-a="${r.c.id}">${c.wars.includes(r.c.id) ? 'Paz' : 'Guerra'}</button>` : ''}</div>`).join('')}`;
  } else h += R.map((r, i) => clanRow(r, i, false)).join('');
  return h;
}
function clanRow(r, i, join) {
  const c = r.c; const L = c.leader === 'P' ? { name: S.name } : aiById(c.leader);
  const age = (now() - c.founded) < 30 * 60000 && i >= 0 ? ' <span class="tag gd">novo</span>' : '';
  return `<div class="clanrow ${c.id === S.clan ? 'hl' : ''}"><span class="rk">${i + 1}</span>${flag(c)}<div style="flex:1;min-width:0"><b>${esc(c.name)}</b>${age}<div class="sm mu">👑 ${esc(L ? L.name : '?')} · ${memberCount(c)}/${MAX_CLAN} · Bunker ${c.minLvl}+</div><div class="sm">⚔️ ${fmt(r.p)} · <span style="color:${moodCol(c.morale)}">moral ${Math.round(c.morale)}%</span>${c.wars.length ? ' · 🔥' : ''}</div></div>${join ? `<button class="btn sm ${memberCount(c) >= MAX_CLAN || S.b.bunker < c.minLvl ? 'dis' : ''}" data-act="cjoin" data-a="${c.id}">Entrar</button>` : ''}</div>`;
}
ACT.csub = el => { V.sub.cla = el.dataset.a; V.stickBottom = el.dataset.a === 'chat'; renderView(); if (V.stickBottom) $('#view').scrollTop = 1e6; };
ACT.cjoin = el => { if (playerJoin(el.dataset.a)) { toast('Você entrou no clã!'); tabGo('cla'); } };
ACT.ccreate = () => { const c = playerCreate($('#cname').value); if (c) { toast('Clã fundado!'); tabGo('cla'); } };
ACT.cleave = () => { if (confirm('Sair do clã?')) { playerLeave(); tabGo('cla'); } };
ACT.cgift = () => playerGift();
ACT.chelp = () => playerHelpAll();
ACT.ctech = el => playerTech(el.dataset.a);
ACT.cwar = el => playerWar(el.dataset.a);
ACT.ckick = el => { if (confirm('Expulsar esse membro?')) playerKick(el.dataset.a); };
ACT.csay = () => { const i = $('#cmsg'); if (!i) return; playerSay(i.value, false); i.value = ''; i.blur(); V.stickBottom = true; };
ACT.seetower = el => { const t = S.world.towers.find(x => x.id === el.dataset.a); tabGo('mapa'); setTimeout(() => { mapFocus(t.x, t.y); MapV.sel = { kind: 'tower', o: t }; openEntity(MapV.sel); }, 30); };

// ---------- MUNDO ----------
function viewWorld() {
  const sub = V.sub.mundo; const W = S.world;
  let h = `<div class="tabs">${[['noticias', '📰 Notícias'], ['chat', '🌍 Chat mundial'], ['ranking', '🏆 Ranking']].map(x => `<button class="tab ${sub === x[0] ? 'on' : ''}" data-act="wsub" data-a="${x[0]}">${x[1]}</button>`).join('')}</div>`;
  if (sub === 'noticias') {
    const f = V.sub.nf; const list = W.news.filter(n => f === 'all' || n.type === f || (f === 'war' && n.type === 'pvp')).slice(0, 80);
    h += `<div class="tabs">${[['all', 'Tudo'], ['revolt', '🔥 Revoltas'], ['war', '⚔️ Guerras'], ['me', '🧔 Você']].map(x => `<button class="tab ${f === x[0] ? 'on' : ''}" data-act="nf" data-a="${x[0]}">${x[1]}</button>`).join('')}</div>
    <div class="card row sm" style="flex-wrap:wrap"><span>🏴 ${W.clans.length} clãs</span><span>·</span><span>🧍 ${W.ai.length} sobreviventes</span><span>·</span><span>🔥 ${S.stats.revolts} revoltas</span></div>
    <div class="news">${list.map(n => `<div class="n ${n.type}">${esc(n.text)}<time>${new Date(n.t).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</time></div>`).join('') || '<div class="empty">Nada por aqui ainda.</div>'}</div>`;
    S.seenNews = W.nc || 0;
  } else if (sub === 'chat') {
    h += `<div class="chat autoscroll">${S.wchat.slice(-40).map(m => `<div class="msg ${m.me ? 'me' : ''}"><b>${m.tag ? '[' + esc(m.tag) + '] ' : ''}${esc(m.who)}</b>${esc(m.text)}</div>`).join('') || '<div class="empty">Silêncio no rádio...</div>'}</div><div class="cin"><input id="wmsg" maxlength="140" placeholder="Mensagem para todos"><button class="btn sm" data-act="wsay">Enviar</button></div>`;
  } else {
    const ps = W.ai.map(a => ({ n: a.name, c: a.clan, p: a.power, me: false })).concat([{ n: S.name, c: S.clan, p: playerPower(), me: true }]).sort((a, b) => b.p - a.p);
    const myR = ps.findIndex(x => x.me) + 1;
    h += `<div class="card row sp"><b>Sua posição</b><b class="gd">#${myR} de ${ps.length}</b></div><h3>Clãs</h3>${rankClans().slice(0, 10).map((r, i) => clanRow(r, i, false)).join('')}
    <h3>Sobreviventes</h3><div class="card list">${ps.slice(0, 30).map((x, i) => { const c = x.c && clanById(x.c); return `<div class="it"><span class="rk">${i + 1}</span><div style="flex:1"><b class="${x.me ? 'ok' : ''}">${c ? `<span style="color:${c.color}">[${esc(c.tag)}]</span> ` : ''}${esc(x.n)}</b></div><span class="b">${fmt(x.p)}</span></div>`; }).join('')}${myR > 30 ? `<div class="it"><span class="rk">${myR}</span><div style="flex:1"><b class="ok">${esc(S.name)}</b></div><span class="b">${fmt(playerPower())}</span></div>` : ''}</div>`;
  }
  return h;
}
ACT.wsub = el => { V.sub.mundo = el.dataset.a; V.stickBottom = el.dataset.a === 'chat'; renderView(); if (V.stickBottom) $('#view').scrollTop = 1e6; };
ACT.nf = el => { V.sub.nf = el.dataset.a; renderView(); };
ACT.wsay = () => { const i = $('#wmsg'); if (!i) return; playerSay(i.value, true); i.value = ''; i.blur(); V.stickBottom = true; };

// ---------- introdução ----------
function showIntro(done) {
  const slides = [
    { e: '🧟', t: GAME_NAME, p: 'O mundo caiu. Você comanda um refúgio de sobreviventes cercado por hordas, clãs rivais e escassez.' },
    { e: '🏚️', t: 'Construa e sobreviva', p: 'Suba o Bunker Central, produza comida, água, sucata e combustível, mantenha o gerador ligado e a infecção sob controle.' },
    { e: '🪖', t: 'Tropas e heróis', p: 'Brutos vencem Motoqueiros, que vencem Atiradores, que vencem Brutos. Treine até T10, promova as tropas fracas e lidere com até 5 heróis.' },
    { e: '🏴', t: 'Um mundo vivo de IA', p: 'Mais de 10 clãs de IA crescem, guerreiam e se traem. Membros insatisfeitos se revoltam, trocam de lado ou fundam clãs novos. Escolha o seu lado.' },
  ];
  let i = 0; const el = document.createElement('div'); el.className = 'intro'; el.id = 'intro'; document.body.appendChild(el);
  const draw = () => {
    const s = slides[i]; const last = i === slides.length - 1;
    el.innerHTML = `<div class="big">${s.e}</div><h1>${s.t}</h1><p>${s.p}</p><div class="dots">${slides.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
    ${last ? `<input class="tin" id="pname" maxlength="16" placeholder="Seu nome de sobrevivente" style="max-width:300px;text-align:center">` : ''}
    <button class="btn ${last ? 'y' : ''}" id="inext" style="min-width:200px;margin-top:8px">${last ? 'Começar' : 'Próximo'}</button>${!last ? '<button class="mu sm" id="iskip" style="margin-top:14px">Pular</button>' : ''}`;
    el.querySelector('#inext').onclick = () => { if (last) { const n = (el.querySelector('#pname').value || '').trim(); S.name = n || 'Sobrevivente'; S.intro = true; el.remove(); save(); done && done(); } else { i++; draw(); } };
    const sk = el.querySelector('#iskip'); if (sk) sk.onclick = () => { i = slides.length - 1; draw(); };
  };
  draw();
}
function showOffline(r) {
  const W = S.world; const top = W.news.slice(0, Math.min(6, r.news));
  openSheet('📻 Enquanto você estava fora', () => `<div class="card sm">Passaram-se cerca de ${Math.round(r.steps * SIM_DT / 60000)} min no mundo. ${r.news} acontecimentos.</div><div class="news">${top.map(n => `<div class="n ${n.type}">${esc(n.text)}</div>`).join('')}</div><button class="btn w" data-act="close">Continuar</button>`);
}
