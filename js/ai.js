'use strict';
// ===== Refúgio Zero — mundo e simulação dos jogadores de IA =====
const MAP = 80, SIM_DT = 15000, MAX_CLAN = 30;
let NEWS_HOOK = null;
function W_() { return S.world; }
function news(text, type) { const W = W_(); W.nc = (W.nc || 0) + 1; W.news.unshift({ t: now(), text, type: type || 'info' }); if (W.news.length > 200) W.news.length = 200; if (NEWS_HOOK) NEWS_HOOK(text, type); }
function clanById(id) { return W_().clans.find(c => c.id === id); }
function clanTag(id) { const c = clanById(id); return c ? c.tag : (W_().dead[id] || '???'); }
function clanPower(c) { let p = 0; c.members.forEach(id => { const a = aiById(id); if (a) p += a.power; }); if (S.clan === c.id) p += playerPower(); return Math.round(p); }
function aiById(id) { return W_().aimap ? W_().aimap[id] : W_().ai.find(a => a.id === id); }
function reindex() { const m = {}; W_().ai.forEach(a => m[a.id] = a); W_().aimap = m; }
function memberCount(c) { return c.members.length + (S.clan === c.id ? 1 : 0); }
function uniqName() { const W = W_(); for (let i = 0; i < 50; i++) { const n = pick(FIRST) + pick(SUF); if (!W.names[n]) { W.names[n] = 1; return n; } } return pick(FIRST) + rint(100, 999); }
function makeTag(name) { const w = name.replace(/^(Os|As|O|A) /, '').split(' ').filter(x => x.length > 2); let t = (w[0] || 'X').slice(0, 1) + (w[1] || w[0] || 'XX').slice(0, 1) + (w[2] || w[1] || w[0]).slice(-1); t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase(); const W = W_(); let k = t, i = 2; while (W.clans.some(c => c.tag === k)) { k = t.slice(0, 2) + i; i++; } return k; }
function newClanName() { const W = W_(); for (let i = 0; i < 60; i++) { const n = pick(CPRE) + ' ' + pick(CSUF); if (!W.clans.some(c => c.name === n)) return n; } return 'Clã ' + rint(10, 99); }
function freeColor() { const used = new Set(W_().clans.map(c => c.color)); return COLORS.find(c => !used.has(c)) || pick(COLORS); }
function occupied(x, y, r) { const W = W_(); r = r || 1.4; const near = o => Math.abs(o.x - x) < r && Math.abs(o.y - y) < r; return (Math.abs(S.x - x) < 2 && Math.abs(S.y - y) < 2) || W.ai.some(near) || W.hordes.some(near) || W.nodes.some(near) || W.giants.some(near) || W.towers.some(o => Math.abs(o.x - x) < 2.5 && Math.abs(o.y - y) < 2.5); }
function spot(cx, cy, r) { for (let i = 0; i < 80; i++) { const x = Math.round(clamp(cx + rnd(-r, r), 2, MAP - 3)), y = Math.round(clamp(cy + rnd(-r, r), 2, MAP - 3)); if (!occupied(x, y)) return { x, y }; } return { x: rint(2, MAP - 3), y: rint(2, MAP - 3) }; }
function newAI(lvl, clan, cx, cy, r) {
  const W = W_(); const p = spot(cx == null ? MAP / 2 : cx, cy == null ? MAP / 2 : cy, r || MAP / 2);
  const c = [rnd(0.2, 1), rnd(0.2, 1), rnd(0.2, 1)]; const sm = c[0] + c[1] + c[2];
  const ai = { id: 'a' + (W.nid++), name: uniqName(), clan, x: p.x, y: p.y, lvl, power: Math.round(300 * Math.pow(lvl, 1.7) * rnd(0.7, 1.3)), loyal: rint(50, 85), pers: rint(-28, 15), aggr: Math.random(), comp: c.map(v => v / sm), w: 0, l: 0, grudge: null };
  W.ai.push(ai); if (W.aimap) W.aimap[ai.id] = ai; return ai;
}
function newClan(name, tag, leader, cx, cy) {
  const W = W_(); const c = { id: 'c' + (W.nid++), name, tag: tag || makeTag(name), color: freeColor(), leader, members: [], morale: rint(55, 75), recent: 0, tech: { prod: 0, atk: 0, ajuda: 0 }, pts: { prod: 0, atk: 0, ajuda: 0 }, wars: [], founded: now(), cx, cy, score: 0, minLvl: 1 };
  W.clans.push(c); return c;
}
function spawnHorde(hint) {
  const W = W_(); const p = spot(MAP / 2, MAP / 2, MAP / 2 - 3); const d = Math.hypot(p.x - S.x, p.y - S.y);
  let lvl = Math.round(1 + d / 3 + rnd(-1, 2)); if (hint && Math.random() < 0.5) lvl = hint + rint(-1, 1);
  const top = Math.max(3, (S.maxHorde || 1) + 3, Math.ceil(S.b.bunker * 1.2) + 2);
  lvl = clamp(lvl, 1, Math.min(20, Math.max(top, Math.round(d / 2)))); W.hordes.push({ id: 'h' + (W.nid++), x: p.x, y: p.y, lvl, kind: pick(['b', 'm', 'a', 'x']) });
}
function spawnNode() { const W = W_(); const p = spot(MAP / 2, MAP / 2, MAP / 2 - 3); const lvl = rint(1, 6); W.nodes.push({ id: 'n' + (W.nid++), x: p.x, y: p.y, res: pick(RKEYS), lvl, amt: 2000 * lvl * lvl, busy: null }); }
function spawnGiant() { const W = W_(); const p = spot(MAP / 2, MAP / 2, MAP / 2 - 4); const lvl = rint(1, Math.min(10, 2 + Math.ceil(S.b.bunker / 2))); W.giants.push({ id: 'g' + (W.nid++), x: p.x, y: p.y, lvl, name: pick(['Gigante Mutante', 'Colosso Podre', 'Tanque de Carne', 'Rei da Horda']) }); }
function towerArmy(tg) { const c = clanById(tg.owner); if (!c) return hordeArmy(9, null, 2.5); const avg = c.members.reduce((a, id) => a + (aiById(id) || { lvl: 1 }).lvl, 0) / Math.max(1, c.members.length); return aiArmy({ lvl: Math.round(avg), power: clanPower(c) * 0.09, comp: [0.34, 0.33, 0.33] }); }
function warScore(a, b, n) { const c = a && clanById(a); if (c) { c.score += n; c.recent = clamp(c.recent + n * 0.5, -25, 25); } const d = b && clanById(b); if (d) d.recent = clamp(d.recent - n * 0.4, -25, 25); }

function genWorld() {
  S.world = { ai: [], clans: [], hordes: [], nodes: [], giants: [], towers: [], news: [], nid: 1, names: {}, dead: {}, lastSim: now(), helpReq: 3 };
  const W = S.world; reindex();
  const TW = [['Torre de Rádio Norte', 40, 12], ['Torre de Rádio Leste', 68, 40], ['Torre de Rádio Sul', 40, 68], ['Torre de Rádio Oeste', 12, 40], ['Antena Central', 26, 26]];
  TW.forEach(t => W.towers.push({ id: 'tw' + (W.nid++), name: t[0], x: t[1], y: t[2], tower: true, owner: null }));
  const centers = []; for (let i = 0; i < INIT_CLANS.length; i++) { const a = i / INIT_CLANS.length * Math.PI * 2 + rnd(-0.2, 0.2), r = rnd(14, 32); centers.push([MAP / 2 + Math.cos(a) * r, MAP / 2 + Math.sin(a) * r]); }
  INIT_CLANS.forEach((x, i) => {
    const str = 1.6 - i * 0.09 + rnd(-0.1, 0.1); const c = newClan(x[0], x[1], null, centers[i][0], centers[i][1]);
    const n = rint(10, 20);
    for (let k = 0; k < n; k++) { const ai = newAI(clamp(Math.round(rnd(1, 8) * str), 1, 15), c.id, c.cx, c.cy, 6); c.members.push(ai.id); }
    let best = null; c.members.forEach(id => { const a = aiById(id); if (!best || a.power > best.power) best = a; }); c.leader = best.id;
    c.minLvl = Math.max(1, Math.round(str * 2) - 1); c.morale = rint(45, 80);
  });
  for (let k = 0; k < 10; k++) newAI(rint(1, 4), null);
  W.towers.forEach((t, i) => { if (i < 4) { const c = W.clans[i * 2]; t.owner = c.id; } });
  for (let i = 0; i < 6; i++) { const p = spot(S.x, S.y, 6); W.hordes.push({ id: 'h' + (W.nid++), x: p.x, y: p.y, lvl: rint(1, 2), kind: pick(['b', 'm', 'a', 'x']) }); }
  for (let i = 0; i < 4; i++) { const p = spot(S.x, S.y, 7); W.nodes.push({ id: 'n' + (W.nid++), x: p.x, y: p.y, res: RKEYS[i], lvl: 1, amt: 2500, busy: null }); }
  for (let i = 0; i < 70; i++) spawnHorde(); for (let i = 0; i < 46; i++) spawnNode(); for (let i = 0; i < 4; i++) spawnGiant();
  // guerras iniciais
  W.clans[0].wars.push(W.clans[1].id); W.clans[1].wars.push(W.clans[0].id);
  W.clans[4].wars.push(W.clans[6].id); W.clans[6].wars.push(W.clans[4].id);
  news('📻 Sinal captado: 12 clãs disputam a região. Escolha um lado... ou crie o seu.', 'info');
}

// ---------- passo de simulação ----------
let SIM_QUIET = false;
function rankClans() { return W_().clans.map(c => ({ c, p: clanPower(c) })).sort((a, b) => b.p - a.p); }
function simStep(offline) {
  const W = W_(); const t = now(); reindex();
  // 1. crescimento + caçadas
  W.ai.forEach(a => {
    a.power += a.power * 0.0022 * rnd(0.4, 1.6) + a.lvl * 3;
    if (a.lvl < 20 && Math.random() < 0.005) { a.lvl++; if (a.lvl >= 12 && Math.random() < 0.3) news(`🏚️ ${a.name} elevou o bunker ao Nv.${a.lvl}.`, 'info'); }
    if (Math.random() < 0.035) {
      const ok = Math.random() < 0.72;
      if (ok) { a.loyal = clamp(a.loyal + 1.5, 0, 100); a.power *= 1.01; a.w++; if (Math.random() < 0.3 && W.hordes.length) { const h = pick(W.hordes); W.hordes = W.hordes.filter(x => x !== h); spawnHorde(); } }
      else { a.loyal = clamp(a.loyal - 4, 0, 100); a.power *= 0.97; a.l++; }
    }
  });
  // 2. guerras entre clãs
  W.clans.forEach(c => c.wars = c.wars.filter(id => clanById(id)));
  W.clans.forEach(c => c.wars.forEach(eid => {
    if (c.id > eid || Math.random() > 0.55) return; const e = clanById(eid);
    const am = c.members.map(aiById).filter(Boolean), bm = e.members.map(aiById).filter(Boolean); if (!am.length || !bm.length) return;
    const A = pick(am), B = pick(bm); const aw = A.power * rnd(0.6, 1.4) > B.power * rnd(0.6, 1.4);
    const win = aw ? A : B, lose = aw ? B : A;
    lose.power *= 0.95; lose.loyal = clamp(lose.loyal - 7, 0, 100); win.loyal = clamp(win.loyal + 3, 0, 100); win.power *= 1.01;
    warScore(win.clan, lose.clan, 1);
    if (Math.random() < 0.18) news(`⚔️ ${win.name} [${clanTag(win.clan)}] saqueou a base de ${lose.name} [${clanTag(lose.clan)}].`, 'pvp');
  }));
  if (Math.random() < 0.02) {
    const R = rankClans(); const i = rint(0, R.length - 2); const a = R[i] && R[i].c, b = R[i + 1] && R[i + 1].c;
    if (a && b && !a.wars.includes(b.id) && a.wars.length < 2 && b.wars.length < 2 && !(S.clan === a.id && a.leader === 'P') && !(S.clan === b.id && b.leader === 'P')) { a.wars.push(b.id); b.wars.push(a.id); news(`🔥 GUERRA! [${a.tag}] ${a.name} declarou guerra contra [${b.tag}] ${b.name}.`, 'war'); }
  }
  W.clans.forEach(c => c.wars.slice().forEach(eid => { if (c.id < eid && Math.random() < 0.008 && c.leader !== 'P' && (clanById(eid) || {}).leader !== 'P') { c.wars = c.wars.filter(x => x !== eid); const e = clanById(eid); if (e) e.wars = e.wars.filter(x => x !== c.id); news(`🕊️ [${c.tag}] e [${clanTag(eid)}] assinaram uma trégua.`, 'war'); } }));
  // 3. torres
  if (Math.random() < 0.025) {
    const tw = pick(W.towers); const R = rankClans().slice(0, 8); const at = pick(R).c;
    if (at.id !== tw.owner && at.leader !== 'P') {
      const op = tw.owner ? clanPower(clanById(tw.owner)) : 20000; const ap = clanPower(at);
      const prot = tw.owner === S.clan ? 0.35 : 0.5; // o clã do jogador defende um pouco melhor
      if (Math.random() < ap / (ap + op) * prot * 2) { const old = tw.owner; tw.owner = at.id; at.recent += 4; if (old) { warScore(at.id, old, 6); } news(`📡 [${at.tag}] conquistou a ${tw.name}${old ? ' de [' + clanTag(old) + ']' : ''}!`, 'war'); if (old && old === S.clan) toast(`Seu clã perdeu a ${tw.name}!`, 'bad'); }
      else if (tw.owner) news(`🛡️ [${clanTag(tw.owner)}] defendeu a ${tw.name} contra [${at.tag}].`, 'war');
    }
  }
  // 4. moral e lealdade
  const R = rankClans(); const N = R.length;
  R.forEach((r, i) => {
    const c = r.c; const mem = c.members.map(aiById).filter(Boolean);
    const avg = mem.length ? mem.reduce((a, m) => a + m.power, 0) / mem.length : 1;
    const lp = c.leader === 'P' ? playerPower() : (aiById(c.leader) || { power: avg }).power;
    const rankB = (1 - i / Math.max(1, N - 1)) * 22 - 9;
    const lead = clamp((lp / avg - 1) * 14, -16, 12);
    const tw = W.towers.filter(t => t.owner === c.id).length * 4;
    const target = 50 + rankB + lead + c.recent + tw - c.wars.length * 2 + (memberCount(c) < 5 ? -6 : 0);
    c.morale = clamp(c.morale + (target - c.morale) * 0.07 + rnd(-1.5, 1.5), 0, 100);
    c.recent *= 0.93; c.age = (c.age || 0) + 1;
    mem.forEach(m => { const tg = c.morale + m.pers; m.loyal = clamp(m.loyal + (tg - m.loyal) * 0.05 + rnd(-2.5, 2.5), 0, 100); });
    // contribui tecnologia
    if (Math.random() < 0.1 && mem.length) { const k = pick(Object.keys(CTECH)); c.pts[k] += mem.length * rint(2, 6); const need = 200 * Math.pow(1.6, c.tech[k]); if (c.pts[k] >= need && c.tech[k] < 10) { c.pts[k] -= need; c.tech[k]++; if (c.id === S.clan) news(`🔬 Seu clã liberou ${CTECH[k].n} Nv.${c.tech[k]}!`, 'me'); } }
  });
  // 5. revoltas, golpes, saídas
  W.clans.slice().forEach(c => {
    if (!clanById(c.id)) return;
    // golpe
    const mem = c.members.map(aiById).filter(Boolean);
    if (mem.length && c.morale < 35 && Math.random() < 0.04) {
      const strong = mem.reduce((a, b) => b.power > a.power ? b : a);
      const lp = c.leader === 'P' ? playerPower() : (aiById(c.leader) || { power: 0 }).power;
      if (strong.id !== c.leader && strong.power > lp * 1.25) {
        const oldName = c.leader === 'P' ? S.name : (aiById(c.leader) || { name: '?' }).name;
        c.leader = strong.id; c.morale = clamp(c.morale + 15, 0, 100); strong.loyal = 90;
        news(`👑 GOLPE! ${strong.name} derrubou ${oldName} e assumiu a liderança de [${c.tag}].`, 'revolt');
        if (S.clan === c.id && oldName === S.name) toast('Você sofreu um golpe e perdeu a liderança do clã!', 'bad');
      }
    }
    mem.forEach(m => {
      if (m.id === c.leader || m.loyal >= 24 || Math.random() > 0.09) return;
      revolt(m, c);
    });
    if (!clanById(c.id)) return;
    if (!c.members.includes(c.leader) && c.leader !== 'P') { const rest = c.members.map(aiById).filter(Boolean); if (rest.length) { const nl = rest.reduce((a, b) => b.power > a.power ? b : a); c.leader = nl.id; news(`👑 ${nl.name} é o novo líder de [${c.tag}].`, 'revolt'); } }
    if (c.leader === 'P' && S.clan !== c.id) { const rest = c.members.map(aiById).filter(Boolean); if (rest.length) c.leader = rest.reduce((a, b) => b.power > a.power ? b : a).id; }
    const mc = memberCount(c);
    if (mc === 0) { dissolve(c); return; }
    if (mc <= 3 && S.clan !== c.id && (c.age || 0) > 80 && Math.random() < 0.05) {
      const tgt = W.clans.filter(o => o !== c && !o.wars.includes(c.id) && memberCount(o) + mc <= MAX_CLAN && o.leader !== 'P').sort((a, b) => Math.abs(clanPower(a) - clanPower(c)) - Math.abs(clanPower(b) - clanPower(c)))[0];
      if (tgt) { c.members.forEach(id => { const a = aiById(id); if (a) { a.clan = tgt.id; a.loyal = 60; tgt.members.push(id); } }); c.members = []; news(`🤝 FUSÃO! O clã [${c.tag}] ${c.name} se juntou ao [${tgt.tag}] ${tgt.name}.`, 'revolt'); dissolve(c, true); }
    }
  });
  // nômades
  W.ai.filter(a => !a.clan).forEach(a => {
    if (Math.random() > 0.05) return;
    const nom = W.ai.filter(o => !o.clan && o !== a);
    if (nom.length >= 2 && Math.random() < 0.25 && W.clans.length < 24) { foundClan(a, nom.slice(0, rint(2, 4)), null); return; }
    const opts = W.clans.filter(c => memberCount(c) < MAX_CLAN && c.minLvl <= a.lvl + 2);
    if (opts.length) { const c = bestClan(opts, a); joinAI(a, c); if (Math.random() < 0.4) news(`🙋 ${a.name} entrou para [${c.tag}] ${c.name}.`, 'info'); }
  });
  // novos sobreviventes chegam
  if (W.ai.length < 260 && Math.random() < 0.03) { const a = newAI(rint(1, 3), null); news(`🧍 Um novo sobrevivente, ${a.name}, chegou à região.`, 'info'); }
  // 6. ataques ao jogador
  if (S.shield < t && (!S.truce || S.truce < t) && (!offline || (S.offAtk || 0) < 2) && Math.random() < 0.02) {
    const pp = playerPower(); const cand = W.ai.filter(a => a.clan !== S.clan && a.power > pp * 0.45 && a.power < pp * 1.8 && (a.aggr > 0.6 || a.grudge === 'P' || (S.clan && a.clan && (clanById(a.clan) || { wars: [] }).wars.includes(S.clan))));
    if (cand.length) { aiAttackPlayer(pick(cand)); if (offline) S.offAtk = (S.offAtk || 0) + 1; }
  }
  // 7. ajudas e pedidos de ajuda
  const mc = myClan();
  if (mc) {
    const mh = 5 + S.b.centro + mc.tech.ajuda; const tasks = [...S.bq, S.rq, S.hq].filter(Boolean);
    tasks.forEach(q => { if ((q.helps || 0) < mh && Math.random() < 0.55 && mc.members.length) { q.helps = (q.helps || 0) + 1; q.end -= Math.max(10000, q.dur * 0.02); q.lastHelper = (aiById(pick(mc.members)) || {}).name; } });
    if (Math.random() < 0.35 && mc.members.length) W.helpReq = Math.min(30, (W.helpReq || 0) + rint(1, 3));
    if (Math.random() < 0.3) clanChat();
  }
  if (Math.random() < 0.22) worldChat();
}
function bestClan(opts, a) {
  const R = rankClans(); const rank = id => R.findIndex(r => r.c.id === id);
  return opts.map(c => ({ c, s: c.morale + (R.length - rank(c.id)) * 3 + rnd(0, 25) + (c.id === S.clan ? (c.leader === 'P' ? 10 : 5) : 0) - (a && c.id === a.prevClan ? 50 : 0) })).sort((x, y) => y.s - x.s)[0].c;
}
function joinAI(a, c) { if (a.clan) { const o = clanById(a.clan); if (o) o.members = o.members.filter(x => x !== a.id); } a.prevClan = a.clan; a.clan = c.id; c.members.push(a.id); a.loyal = rint(55, 75); }
function revolt(m, c) {
  const W = W_(); S.stats.revolts++;
  const rebels = c.members.map(aiById).filter(x => x && x.id !== c.leader && x.loyal < 36);
  const lname = c.leader === 'P' ? S.name : (aiById(c.leader) || { name: 'o líder' }).name;
  if (rebels.length >= 3 && Math.random() < 0.55 && W.clans.length < 24) {
    const grp = rebels.sort((a, b) => a.loyal - b.loyal).slice(0, rint(3, Math.min(7, rebels.length)));
    if (!grp.includes(m)) { grp.pop(); grp.unshift(m); }
    const leader = grp.reduce((a, b) => b.power > a.power ? b : a);
    const nc = foundClan(leader, grp.filter(x => x !== leader), c);
    if (c.wars.length < 3) { nc.wars.push(c.id); c.wars.push(nc.id); }
    return;
  }
  const opts = W.clans.filter(o => o !== c && memberCount(o) < MAX_CLAN && o.minLvl <= m.lvl + 2);
  if (opts.length && Math.random() < 0.78) {
    const o = bestClan(opts, m); joinAI(m, o);
    news(`🚪 ${m.name} se revoltou com ${lname} e trocou [${c.tag}] por [${o.tag}] ${o.name}.`, 'revolt');
    if (S.clan === c.id) clanSay(m, pick(['Pra mim chega. Fui!', 'Esse clã não dá mais. Tchau.', 'Vou pra um clã que me valoriza.']));
    if (S.clan === o.id) clanSay(m, pick(['E aí, galera! Cheguei.', 'Obrigado por me aceitarem!', 'Meu clã antigo era uma bagunça. Bora!']));
  } else {
    c.members = c.members.filter(x => x !== m.id); m.prevClan = c.id; m.clan = null; m.loyal = 50;
    news(`🏃 ${m.name} abandonou [${c.tag}] e agora vaga sozinho pelo mapa.`, 'revolt');
  }
}
function foundClan(leader, others, from) {
  const W = W_(); const name = newClanName();
  const nc = newClan(name, null, leader.id, leader.x, leader.y); nc.morale = rint(68, 82);
  [leader, ...others].forEach(a => { if (a.clan) { const o = clanById(a.clan); if (o) o.members = o.members.filter(x => x !== a.id); } a.prevClan = a.clan; a.clan = nc.id; nc.members.push(a.id); a.loyal = rint(70, 90); });
  if (from) news(`🔥 REVOLTA! ${leader.name} se rebelou contra [${from.tag}] e fundou o clã [${nc.tag}] ${nc.name}, levando ${others.length} rebelde${others.length > 1 ? 's' : ''}!`, 'revolt');
  else news(`🏴 Os nômades ${[leader, ...others].map(a => a.name).join(', ')} fundaram o clã [${nc.tag}] ${nc.name}.`, 'revolt');
  if (from && S.clan === from.id) { toast(`Revolta! ${leader.name} saiu e fundou [${nc.tag}]`, 'bad'); clanSay(leader, pick(['Cansei. Quem quiser liberdade, vem comigo!', 'Esse clã acabou pra mim. Vou fundar o meu.', 'A liderança aqui é uma piada. Adeus!'])); }
  return nc;
}
function dissolve(c, merged) {
  const W = W_(); W.dead[c.id] = c.tag; W.clans = W.clans.filter(x => x !== c);
  W.clans.forEach(o => o.wars = o.wars.filter(x => x !== c.id)); W.towers.forEach(t => { if (t.owner === c.id) t.owner = null; });
  c.members.forEach(id => { const a = aiById(id); if (a) a.clan = null; });
  if (S.clan === c.id) S.clan = null;
  if (!merged) news(`💀 O clã [${c.tag}] ${c.name} deixou de existir.`, 'revolt');
}
function aiAttackPlayer(a) {
  const home = JSON.parse(JSON.stringify(S.troops)); const t = now();
  const heroes = S.form.filter(h => !busyHeroes().has(h));
  const res = battle(aiArmy(a, 0.7), home, flatMods(1 + a.lvl * 0.03), mods(heroes, true));
  // perdas defensivas: maioria vira ferida
  let room = Math.max(0, woundCap() - armyCount(S.wounded)); let w = 0, dead = 0;
  CK.forEach(c => Object.keys(res.lossB[c]).forEach(tt => { const n = res.lossB[c][tt]; S.troops[c][tt] -= n; if (S.troops[c][tt] <= 0) delete S.troops[c][tt]; const x = Math.min(room, Math.floor(n * 0.85)); room -= x; w += x; dead += n - x; if (x) S.wounded[c][tt] = (S.wounded[c][tt] || 0) + x; }));
  a.power = Math.max(200, a.power - armyPow(res.lossA) * 0.8);
  S.truce = t + 8 * 60000;
  if (res.win) {
    const lost = {}; RKEYS.forEach(k => { const x = Math.floor(Math.max(0, S.res[k] - protRes(k)) * 0.3); lost[k] = x; S.res[k] -= x; });
    S.inf = Math.min(100, S.inf + 6); a.w++; a.loyal = clamp(a.loyal + 3, 0, 100);
    report({ title: `Sua base foi saqueada por ${a.name}`, text: `${a.name}${a.clan ? ' [' + clanTag(a.clan) + ']' : ''} invadiu. Levou ${fmt(lost.comida + lost.agua + lost.sucata + lost.comb)} recursos. Feridos: ${w}, perdidos: ${dead}. Dica: melhore a Muralha e o Armazém.`, icon: '🚨' });
    news(`🚨 ${a.name}${a.clan ? ' [' + clanTag(a.clan) + ']' : ''} saqueou a base de ${S.name}!`, 'pvp'); toast(`🚨 ${a.name} saqueou sua base!`, 'bad');
    warScore(a.clan, S.clan, 2);
  } else {
    a.l++; a.loyal = clamp(a.loyal - 6, 0, 100); a.grudge = 'P';
    report({ title: `Defesa vitoriosa contra ${a.name}`, text: `Suas tropas e a Muralha seguraram o ataque. Feridos: ${w}, perdidos: ${dead}.`, icon: '🛡️', win: true });
    news(`🛡️ ${S.name} repeliu um ataque de ${a.name}${a.clan ? ' [' + clanTag(a.clan) + ']' : ''}.`, 'pvp'); toast(`🛡️ Você repeliu o ataque de ${a.name}!`);
    warScore(S.clan, a.clan, 2);
  }
  dirty();
}
function rallyJoin(m) {
  const c = myClan(); if (!c) return; const mem = c.members.map(aiById).filter(Boolean).sort(() => Math.random() - 0.5);
  const max = Math.min(8, 3 + Math.floor(mem.length / 4));
  mem.forEach(a => { if (m.joiners.length < max && Math.random() < 0.4 + c.morale / 250) { m.joiners.push({ id: a.id, name: a.name, army: aiArmy(a, 0.3) }); a.loyal = clamp(a.loyal + 3, 0, 100); } });
}

// ---------- ações de clã do jogador ----------
function playerJoin(id) {
  const c = clanById(id); if (!c) return;
  if (memberCount(c) >= MAX_CLAN) return toast('Clã lotado.', 'bad');
  if (S.b.bunker < c.minLvl) return toast(`Esse clã exige Bunker Nv.${c.minLvl}.`, 'bad');
  if (S.clan) playerLeave(true);
  S.clan = c.id; c.morale = clamp(c.morale + 2, 0, 100); news(`🙋 ${S.name} entrou para o clã [${c.tag}] ${c.name}.`, 'me');
  const ai = aiById(pick(c.members)); if (ai) setTimeout(() => clanSay(ai, pick(['Bem-vindo(a) ao clã! 👋', 'Chegou reforço! Bora caçar hordas.', 'Seja bem-vindo(a)! Ajuda a galera que a gente te ajuda.'])), 1500);
  dirty(); save(); return true;
}
function playerLeave(silent) {
  const c = myClan(); if (!c) return; if (c.leader === 'P') { const rest = c.members.map(aiById).filter(Boolean); if (rest.length) c.leader = rest.reduce((a, b) => b.power > a.power ? b : a).id; }
  S.clan = null; if (!silent) news(`🚶 ${S.name} saiu do clã [${c.tag}].`, 'me');
  if (!memberCount(c)) dissolve(c); dirty(); save();
}
function playerCreate(name) {
  name = (name || '').trim().slice(0, 24); if (name.length < 3) return toast('Nome muito curto.', 'bad');
  if (S.b.bunker < 3) return toast('Precisa de Bunker Nv.3.', 'bad'); if (S.chips < 200) return toast('Precisa de 200 fichas.', 'bad');
  if (W_().clans.some(c => c.name.toLowerCase() === name.toLowerCase())) return toast('Já existe um clã com esse nome.', 'bad');
  S.chips -= 200; if (S.clan) playerLeave(true);
  const c = newClan(name, null, 'P', S.x, S.y); c.morale = 75; S.clan = c.id;
  news(`🏴 ${S.name} fundou o clã [${c.tag}] ${c.name}!`, 'me'); dirty(); save(); return c;
}
function playerGift() {
  const c = myClan(); if (!c) return; const t = now();
  if (t - S.lastGift < 10 * 60000) return toast('Você já distribuiu suprimentos. Espere ' + ftime((S.lastGift + 600000 - t) / 1000), 'bad');
  const cost = { comida: 800 * S.b.bunker, agua: 800 * S.b.bunker };
  if (!pay(cost)) return toast('Recursos insuficientes.', 'bad');
  S.lastGift = t; c.morale = clamp(c.morale + (c.leader === 'P' ? 10 : 4), 0, 100); c.recent += 3;
  c.members.forEach(id => { const a = aiById(id); if (a) a.loyal = clamp(a.loyal + (c.leader === 'P' ? 8 : 3), 0, 100); });
  const a = aiById(pick(c.members)); if (a) clanSay(a, pick(['Valeu pelos suprimentos! 🙏', 'Isso sim é liderança!', 'Agora sim, comida pra semana toda.']));
  toast('Suprimentos distribuídos. Moral do clã subiu!'); dirty(); save();
}
function playerHelpAll() {
  const W = W_(); const n = W.helpReq || 0; if (!n || !S.clan) return toast('Ninguém pediu ajuda agora.', 'bad');
  W.helpReq = 0; S.chips += n * 2; task('help', n); const c = myClan(); c.morale = clamp(c.morale + Math.min(4, n * 0.4), 0, 100);
  for (let i = 0; i < n; i++) { const a = aiById(pick(c.members)); if (a) a.loyal = clamp(a.loyal + 2, 0, 100); }
  toast(`Você ajudou ${n} membros (+${n * 2} fichas)`); dirty(); save();
}
function playerTech(k) {
  const c = myClan(); if (!c) return; const cost = { comida: 400 * S.b.bunker, sucata: 300 * S.b.bunker };
  if (c.tech[k] >= 10) return toast('Tecnologia no máximo.', 'bad');
  if (!pay(cost)) return toast('Recursos insuficientes.', 'bad');
  c.pts[k] += 40 * (1 + S.b.centro * 0.1) * S.b.bunker; const need = 200 * Math.pow(1.6, c.tech[k]);
  if (c.pts[k] >= need) { c.pts[k] -= need; c.tech[k]++; news(`🔬 Seu clã liberou ${CTECH[k].n} Nv.${c.tech[k]}!`, 'me'); }
  toast('Doação feita!'); dirty(); save();
}
function playerWar(id) { const c = myClan(); const e = clanById(id); if (!c || c.leader !== 'P' || !e) return; if (c.wars.includes(id)) { c.wars = c.wars.filter(x => x !== id); e.wars = e.wars.filter(x => x !== c.id); news(`🕊️ [${c.tag}] e [${e.tag}] fizeram as pazes.`, 'war'); } else { c.wars.push(id); e.wars.push(c.id); c.recent += 2; news(`🔥 GUERRA! [${c.tag}] ${c.name} declarou guerra contra [${e.tag}] ${e.name}.`, 'war'); } dirty(); save(); }
function playerKick(id) { const c = myClan(); const a = aiById(id); if (!c || c.leader !== 'P' || !a) return; c.members = c.members.filter(x => x !== id); a.clan = null; a.prevClan = c.id; a.grudge = 'P'; c.members.forEach(m => { const x = aiById(m); if (x) x.loyal = clamp(x.loyal - 3, 0, 100); }); news(`👢 ${a.name} foi expulso do clã [${c.tag}] por ${S.name}.`, 'revolt'); dirty(); save(); }

// ---------- conversa ----------
const CH_OK = ['Bom dia, sobreviventes! ☕', 'Alguém pra ajudar no gigante?', 'Precisamos de mais água, o poço secou 😩', 'Bora atacar a torre hoje à noite!', 'Ajudei todo mundo, ajudem as minhas obras aí 🙏', 'Horda nível {n} perto da minha base, quem vem?', 'Achei um ponto de sucata nível 6!', '{enemy} tá folgado demais...', 'Esse clã é família ❤️', 'Hoje eu subi o bunker 💪', 'Cuidado com os Corredores, eles são rápidos!', 'Quem tem combustível sobrando?', 'Gerador quase sem diesel aqui kkk', 'Bom trabalho na última guerra, pessoal!'];
const CH_BAD = ['Esse líder não faz nada...', 'Tô pensando em sair do clã.', '{leader} só pensa em si mesmo 😒', 'A gente só perde, que fase.', 'Se continuar assim eu vou embora.', 'Ninguém ajuda ninguém aqui.', 'Outros clãs dão recompensa, aqui nada.'];
const CH_W = ['Recrutando! [{tag}] aceita todo mundo, bunker {n}+', 'Quem atacou minha base vai pagar 😤', 'Alguém sabe onde tem combustível?', '[{tag}] é o melhor clã da região, fato.', 'Vendo… nada, é o apocalipse kkk', 'Paz entre os clãs? Os zumbis agradecem.', 'Torre Norte vai cair hoje, avisando.', 'Alguém viu o Rei da Horda?', 'Dica: promovam as tropas fracas, compensa!', 'Gerador desligado = infecção. Aprendi do jeito difícil.'];
const REPLY = ['Valeu! 👊', 'Kkkkk', 'Tamo junto!', 'Bora!', 'Concordo total', 'Fala baixo que os zumbis escutam 😂', 'Pode deixar', 'É nóis', 'Boa, líder!', 'Hmm, sei não...', 'Partiu!'];
function fill(s, a) { const c = a && clanById(a.clan); const R = rankClans(); const en = c && c.wars.length ? clanTag(c.wars[0]) : (R[0] ? R[0].c.tag : 'LOB'); return s.replace('{n}', rint(3, 15)).replace('{enemy}', '[' + en + ']').replace('{leader}', c ? (c.leader === 'P' ? S.name : (aiById(c.leader) || { name: 'o líder' }).name) : 'o líder').replace('{tag}', c ? c.tag : 'LOB'); }
function clanSay(a, text) { S.chat.push({ t: now(), who: a.name, id: a.id, text }); if (S.chat.length > 80) S.chat.shift(); dirty(); }
function clanChat() { const c = myClan(); if (!c || !c.members.length) return; const a = aiById(pick(c.members)); if (!a) return; clanSay(a, fill(pick(a.loyal < 35 ? CH_BAD : CH_OK), a)); }
function worldChat() { const a = pick(W_().ai); S.wchat.push({ t: now(), who: a.name, tag: a.clan ? clanTag(a.clan) : '', text: fill(pick(CH_W), a) }); if (S.wchat.length > 60) S.wchat.shift(); dirty(); }
function playerSay(text, world) {
  text = text.trim().slice(0, 140); if (!text) return;
  if (world) S.wchat.push({ t: now(), who: S.name, tag: S.clan ? clanTag(S.clan) : '', text, me: true }); else S.chat.push({ t: now(), who: S.name, text, me: true });
  setTimeout(() => { if (world) { const a = pick(W_().ai); S.wchat.push({ t: now(), who: a.name, tag: a.clan ? clanTag(a.clan) : '', text: pick(REPLY) }); } else { const c = myClan(); if (c && c.members.length) { const a = aiById(pick(c.members)); if (a) clanSay(a, pick(REPLY)); } } dirty(); }, rint(1500, 4000));
  dirty(); save();
}

// ---------- recuperar tempo offline ----------
function catchUp() {
  const W = W_(); const t = now(); let steps = Math.floor((t - W.lastSim) / SIM_DT); if (steps <= 0) return 0;
  const n0 = W.nc || 0; const cap = 240; const run = Math.min(cap, steps); S.offAtk = 0;
  for (let i = 0; i < run; i++) simStep(true);
  W.lastSim = steps > cap ? t : W.lastSim + run * SIM_DT;
  return { steps: run, news: Math.max(0, (W.nc || 0) - n0) };
}
