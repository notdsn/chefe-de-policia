'use strict';
// ===== Refúgio Zero — núcleo: estado, economia, combate, ações =====
let S = null;
const now = () => Date.now();
const UI = { dirty: true, toast: null, hooks: [] };
function dirty() { UI.dirty = true; }
function toast(msg, kind) { if (UI.toast) UI.toast(msg, kind); }

function newState() {
  const t = now();
  const b = {}; BORDER.forEach(k => b[k] = 0);
  Object.assign(b, { bunker: 1, fazenda: 1, poco: 1, ferro: 1, gerador: 1, abrigo: 1, brutos: 1, muralha: 1 });
  const heroes = {};
  Object.keys(HEROES).forEach(k => heroes[k] = { shards: 0, on: false, stars: 1, lvl: 1, sk: [1, 1], gear: { arma: 0, capacete: 0, colete: 0, botas: 0 } });
  ['rosa', 'kaio', 'lia'].forEach(k => heroes[k].on = true);
  const chief = {}; Object.keys(CHIEF).forEach(k => chief[k] = 0);
  const tech = {}; Object.keys(TECH).forEach(k => tech[k] = 0);
  return {
    v: 1, created: t, lastEco: t, name: 'Você', x: 40, y: 40,
    res: { comida: 1500, agua: 1500, sucata: 1200, comb: 500 }, chips: 300,
    b, acc: {}, bq: [], rq: null, hq: null,
    surv: 10, survT: 0, inf: 0, genOn: true,
    troops: { b: { 1: 60 }, m: {}, a: {} }, wounded: { b: {}, m: {}, a: {} },
    tq: { b: null, m: null, a: null },
    heroes, form: ['rosa', 'kaio', 'lia'], chief, tech,
    items: { acel1: 10, acel5: 6, acel60: 1, radio: 10, manual: 20, medalha: 10, liga: 5, escudo: 1 },
    marches: [], reports: [], mid: 1,
    exp: { stage: 1, idle: t },
    daily: null, event: null, tut: 0, intro: false,
    clan: null, shield: t + 60 * 60 * 1000, lastHelp: 0, lastGift: 0,
    stats: { kills: 0, built: 0, trained: 0, revolts: 0, pvpW: 0, pvpL: 0 },
    world: null, chat: [], wchat: [], seenNews: 0,
  };
}

// ---------- recursos ----------
function has(c) { return Object.keys(c).every(k => (RES[k] ? S.res[k] : (k === 'chips' ? S.chips : S.items[k] || 0)) >= c[k] - 1e-6); }
function pay(c) { if (!has(c)) return false; Object.keys(c).forEach(k => { if (RES[k]) S.res[k] -= c[k]; else if (k === 'chips') S.chips -= c[k]; else S.items[k] -= c[k]; }); return true; }
function gain(c, mult) {
  mult = mult || 1;
  Object.keys(c).forEach(k => {
    const v = Math.floor(c[k] * mult);
    if (RES[k]) S.res[k] = Math.min(capRes(k) * 1.5, S.res[k] + v);
    else if (k === 'chips') S.chips += v;
    else S.items[k] = (S.items[k] || 0) + v;
  });
}
function scale(c, m) { const o = {}; Object.keys(c).forEach(k => o[k] = Math.ceil(c[k] * m)); return o; }
function capRes(k) { return Math.round(4000 * Math.pow(1.45, S.b.armazem) + S.b.bunker * 1000); }
function protRes(k) { return Math.round(capRes(k) * (0.2 + S.b.armazem * 0.015)); }
function myClan() { return S.clan && S.world.clans.find(c => c.id === S.clan); }
function towerBuff() { const c = myClan(); return c ? S.world.towers.filter(t => t.owner === c.id).length : 0; }
function prodMul(k) {
  const tk = { comida: 'agri', agua: 'puri', sucata: 'recic', comb: 'dest' }[k];
  const c = myClan();
  return (1 + S.tech[tk] * 0.06 + (c ? c.tech.prod * 0.03 : 0) + towerBuff() * 0.08) * (1 - S.inf / 200);
}
function workers() {
  let need = 0; const n = {};
  BORDER.forEach(k => { if (BLD[k].res && S.b[k] > 0) { n[k] = S.b[k] + 1; need += n[k]; } });
  const fill = need ? Math.min(1, S.surv / need) : 1;
  return { need, fill, n };
}
function rate(bid) { // por segundo
  const L = S.b[bid]; if (!L || !BLD[bid].res) return 0;
  const w = workers();
  return 18 * L * Math.pow(1.13, L - 1) / 60 * prodMul(BLD[bid].res) * (0.35 + 0.65 * w.fill);
}
function accCap(bid) { return Math.max(250, rate(bid) * 90 * 60); }
function survCap() { return 8 + S.b.abrigo * 6 + S.b.bunker * 2; }
function genUse() { return (3 + S.b.bunker * 2) / 60; } // combustível por segundo

function economy(t) {
  let dt = (t - S.lastEco) / 1000; if (dt <= 0) return; S.lastEco = t;
  dt = Math.min(dt, 12 * 3600);
  BORDER.forEach(k => { if (BLD[k].res && S.b[k]) S.acc[k] = Math.min(accCap(k), (S.acc[k] || 0) + rate(k) * dt); });
  // sobreviventes consomem
  const eat = S.surv * 0.15 / 60 * dt;
  S.res.comida = Math.max(0, S.res.comida - eat); S.res.agua = Math.max(0, S.res.agua - eat);
  // gerador
  let powered = false;
  if (S.genOn && S.b.gerador > 0) {
    const use = genUse() * dt * (1 - Math.min(0.5, S.b.gerador * 0.02));
    if (S.res.comb >= use) { S.res.comb -= use; powered = true; } else { S.res.comb = 0; }
  }
  if (powered) S.inf = Math.max(0, S.inf - (1.5 + S.b.enfermaria * 0.15) / 60 * dt);
  else S.inf = Math.min(100, S.inf + 2 * (1 - S.tech.vacina * 0.1) / 60 * dt);
  S.powered = powered;
  // crescimento
  S.survT += dt;
  while (S.survT >= 20) {
    S.survT -= 20;
    if (S.res.comida > 0 && S.res.agua > 0 && S.inf < 60 && S.surv < survCap()) S.surv++;
    else if ((S.inf >= 60 || S.res.comida <= 0 || S.res.agua <= 0) && S.surv > 3 && Math.random() < 0.3) S.surv--;
  }
  if (S.surv > survCap()) S.surv = survCap();
}
function collect(bid) {
  const k = BLD[bid].res; const a = Math.floor(S.acc[bid] || 0);
  const room = Math.max(0, capRes(k) - S.res[k]); const g = Math.min(a, room);
  if (g <= 0) { if (a > 0) toast('Armazém cheio! Melhore o Armazém.', 'bad'); return 0; }
  S.res[k] += g; S.acc[bid] = a - g; task('collect', 1); S.stats.col = (S.stats.col || 0) + 1; dirty(); return g;
}
function collectAll() { let tot = 0; BORDER.forEach(k => { if (BLD[k].res && (S.acc[k] || 0) >= 1) tot += collect(k); }); if (tot) toast('Recolhido: ' + fmt(tot) + ' recursos'); return tot; }

// ---------- construções ----------
function bCost(bid, to) {
  const m = Math.pow(1.55, to - 1) * (BLD[bid].base || 1);
  const c = { comida: 60 * m, agua: 60 * m, sucata: 80 * m, comb: to >= 3 ? 30 * m : 0 };
  if (bid === 'gerador' || bid === 'refinaria') c.sucata *= 1.3;
  Object.keys(c).forEach(k => c[k] = Math.round(c[k]));
  return c;
}
function bTime(bid, to) { return BLD[bid].t * Math.pow(1.42, to - 1) / (1 + S.tech.obra * 0.05); }
function bReqs(bid) {
  const L = S.b[bid], to = L + 1, out = [];
  if (to > MAXLV) return ['Nível máximo'];
  if (bid === 'bunker') {
    const need = ['muralha', ROT[to % ROT.length], ROT[(to + 3) % ROT.length]];
    [...new Set(need)].forEach(k => { if (S.b[k] < L) out.push(`${BLD[k].e} ${BLD[k].n} Nv.${L}`); });
  } else {
    if ((BLD[bid].unlock || 1) > S.b.bunker) out.push(`🏚️ Bunker Nv.${BLD[bid].unlock}`);
    else if (to > S.b.bunker) out.push(`🏚️ Bunker Nv.${to}`);
  }
  return out;
}
function builders() { return 2; }
function inQueue(bid) { return S.bq.find(q => q.bid === bid); }
function startUpgrade(bid) {
  if (inQueue(bid)) return toast('Já está em obra.', 'bad');
  if (S.bq.length >= builders()) return toast('As 2 equipes de obra estão ocupadas.', 'bad');
  const r = bReqs(bid); if (r.length) return toast('Requisito: ' + r[0], 'bad');
  const to = S.b[bid] + 1, c = bCost(bid, to);
  if (!pay(c)) return toast('Recursos insuficientes.', 'bad');
  const d = bTime(bid, to) * 1000, t = now();
  S.bq.push({ bid, to, start: t, end: t + d, dur: d, helps: 0 });
  toast(`Obra iniciada: ${BLD[bid].n} Nv.${to}`); dirty(); save(); return true;
}

// ---------- tropas ----------
function maxTier(c) { const bid = { b: 'brutos', m: 'motos', a: 'atir' }[c]; return Math.min(10, Math.ceil(S.b[bid] / 2)); }
function trainBld(c) { return { b: 'brutos', m: 'motos', a: 'atir' }[c]; }
function batchMax(c) { return 20 + S.b[trainBld(c)] * 15; }
function trainSpeed() { return 1 + S.tech.treino * 0.06; }
function trainCost(c, t, n) { return scale(troopCost(c, t), n); }
function trainTime(c, t, n) { return T[t].time * n / trainSpeed(); }
function startTrain(c, t, n) {
  n = Math.floor(n); if (n < 1) return;
  if (S.tq[c]) return toast('Fila de treino ocupada.', 'bad');
  if (t > maxTier(c) || !S.b[trainBld(c)]) return toast('Categoria bloqueada.', 'bad');
  if (!pay(trainCost(c, t, n))) return toast('Recursos insuficientes.', 'bad');
  const d = trainTime(c, t, n) * 1000, s = now();
  S.tq[c] = { tier: t, n, start: s, end: s + d, dur: d };
  toast(`Treinando ${n} ${CLS[c].n} T${t}`); dirty(); save(); return true;
}
function promoCost(c, f, to, n) { const a = troopCost(c, to), b = troopCost(c, f), o = {}; Object.keys(a).forEach(k => o[k] = Math.max(0, (a[k] - (b[k] || 0))) * n); return o; }
function promoTime(c, f, to, n) { return Math.max(1, (T[to].time - T[f].time) * n / trainSpeed()); }
function startPromo(c, f, n) {
  const to = maxTier(c); n = Math.floor(n);
  if (S.tq[c]) return toast('Fila de treino ocupada.', 'bad');
  if (f >= to || n < 1 || (S.troops[c][f] || 0) < n) return toast('Nada para promover.', 'bad');
  if (!pay(promoCost(c, f, to, n))) return toast('Recursos insuficientes.', 'bad');
  S.troops[c][f] -= n;
  const d = promoTime(c, f, to, n) * 1000, s = now();
  S.tq[c] = { tier: to, n, start: s, end: s + d, dur: d, from: f };
  toast(`Promovendo ${n} ${CLS[c].n} T${f} → T${to}`); dirty(); save(); return true;
}
function addArmy(dst, a) { CK.forEach(c => Object.keys(a[c] || {}).forEach(t => { dst[c][t] = (dst[c][t] || 0) + a[c][t]; if (dst[c][t] <= 0) delete dst[c][t]; })); }
function subArmy(dst, a) { CK.forEach(c => Object.keys(a[c] || {}).forEach(t => { dst[c][t] = (dst[c][t] || 0) - a[c][t]; if (dst[c][t] <= 0) delete dst[c][t]; })); }
function armyCount(a) { let n = 0; CK.forEach(c => Object.values(a[c] || {}).forEach(v => n += v)); return n; }
function armyPow(a) { let p = 0; CK.forEach(c => Object.keys(a[c] || {}).forEach(t => p += a[c][t] * T[t].pow)); return p; }
function emptyArmy() { return { b: {}, m: {}, a: {} }; }
function woundCap() { return S.b.enfermaria * 250 + 50; }
function heal() {
  if (S.hq) return toast('Já tem tropas em tratamento.', 'bad');
  const n = armyCount(S.wounded); if (!n) return;
  const c = { comida: 0, agua: 0, sucata: 0 }; let time = 0;
  CK.forEach(k => Object.keys(S.wounded[k]).forEach(t => { const x = troopCost(k, +t); c.comida += x.comida * 0.3 * S.wounded[k][t]; c.agua += x.agua * 0.3 * S.wounded[k][t]; c.sucata += x.sucata * 0.2 * S.wounded[k][t]; time += T[t].time * 0.25 * S.wounded[k][t]; }));
  const cc = scale(c, 1);
  if (!pay(cc)) return toast('Recursos insuficientes para curar.', 'bad');
  const s = now(); S.hq = { army: S.wounded, start: s, end: s + time * 1000, dur: time * 1000, helps: 0 }; S.wounded = emptyArmy();
  toast('Tratamento iniciado.'); dirty(); save();
}
function healCost() { const c = { comida: 0, agua: 0, sucata: 0 }; let time = 0; CK.forEach(k => Object.keys(S.wounded[k]).forEach(t => { const x = troopCost(k, +t), n = S.wounded[k][t]; c.comida += x.comida * 0.3 * n; c.agua += x.agua * 0.3 * n; c.sucata += x.sucata * 0.2 * n; time += T[t].time * 0.25 * n; })); return { c: scale(c, 1), time }; }

// ---------- pesquisa ----------
function techCost(id, to) { const m = Math.pow(1.6, to - 1); return { comida: Math.round(300 * m), agua: Math.round(300 * m), sucata: Math.round(400 * m), comb: Math.round(150 * m) }; }
function techTime(id, to) { return 20 * Math.pow(1.5, to - 1); }
function startTech(id) {
  if (S.rq) return toast('O laboratório já está pesquisando.', 'bad');
  const to = S.tech[id] + 1; if (to > S.b.lab) return toast('Melhore o Laboratório para liberar o próximo nível.', 'bad');
  if (!pay(techCost(id, to))) return toast('Recursos insuficientes.', 'bad');
  const s = now(), d = techTime(id, to) * 1000; S.rq = { id, to, start: s, end: s + d, dur: d, helps: 0 };
  toast('Pesquisa iniciada: ' + TECH[id].n); dirty(); save();
}

// ---------- heróis ----------
function heroMaxLvl() { return 5 + S.b.bunker * 3; }
function heroPower(id) {
  const h = S.heroes[id], r = RAR[HEROES[id].r].m; if (!h.on) return 0;
  const g = Object.values(h.gear).reduce((a, b) => a + b, 0);
  return Math.round(100 * r * (1 + 0.08 * (h.lvl - 1)) * (1 + 0.3 * (h.stars - 1)) + 30 * (h.sk[0] + h.sk[1] - 2) + 25 * g);
}
function heroBonus(id) {
  const h = S.heroes[id], r = RAR[HEROES[id].r].m;
  return {
    atk: 0.04 * r + 0.004 * h.lvl + 0.05 * (h.stars - 1) + 0.025 * h.sk[0] + 0.012 * (h.gear.arma + h.gear.capacete),
    hp: 0.04 * r + 0.004 * h.lvl + 0.05 * (h.stars - 1) + 0.025 * h.sk[1] + 0.012 * (h.gear.colete + h.gear.botas),
  };
}
function leadership(id) { const h = S.heroes[id]; return Math.round(80 + h.lvl * 25 + (h.stars - 1) * 60 + S.b.posto * 30); }
function lvlCost(id) { return S.heroes[id].lvl * 2; }
function heroLvlUp(id, times) {
  const h = S.heroes[id]; let n = 0;
  for (let i = 0; i < (times || 1); i++) { if (h.lvl >= heroMaxLvl()) break; const c = lvlCost(id); if (S.items.manual < c) break; S.items.manual -= c; h.lvl++; n++; }
  if (!n) toast(h.lvl >= heroMaxLvl() ? 'Nível máximo (suba o Bunker).' : 'Manuais insuficientes.', 'bad'); dirty(); save();
}
const STAR_COST = [0, 10, 20, 40, 80];
function heroStar(id) {
  const h = S.heroes[id];
  if (!h.on) { if (h.shards >= 10) { h.shards -= 10; h.on = true; toast(HEROES[id].n + ' entrou para o refúgio!'); } else toast('Precisa de 10 fragmentos.', 'bad'); dirty(); save(); return; }
  if (h.stars >= 5) return toast('Estrelas no máximo.', 'bad');
  const c = STAR_COST[h.stars]; if (h.shards < c) return toast(`Precisa de ${c} fragmentos.`, 'bad');
  h.shards -= c; h.stars++; toast(`${HEROES[id].n} agora tem ${h.stars}★`); dirty(); save();
}
function heroSkill(id, i) { const h = S.heroes[id]; if (h.sk[i] >= 5) return toast('Habilidade no máximo.', 'bad'); const c = h.sk[i] * 3; if (S.items.medalha < c) return toast('Medalhas insuficientes.', 'bad'); S.items.medalha -= c; h.sk[i]++; dirty(); save(); }
function gearCost(lv) { return { sucata: Math.round(200 * Math.pow(1.6, lv)), liga: lv + 1 }; }
function heroGear(id, slot) {
  const h = S.heroes[id]; const lv = h.gear[slot]; if (lv >= Math.max(1, S.b.oficina) * 2 || lv >= 10) return toast('Melhore a Oficina para subir mais.', 'bad');
  if (!pay(gearCost(lv))) return toast('Sucata ou Liga insuficiente.', 'bad'); h.gear[slot]++; dirty(); save();
}
function recruit(n) {
  if (S.items.radio < n) return toast('Sinais de rádio insuficientes.', 'bad');
  S.items.radio -= n; const got = {};
  for (let i = 0; i < n; i++) {
    const roll = Math.random(); const r = roll < 0.1 ? 'l' : roll < 0.4 ? 'e' : 'r';
    const pool = Object.keys(HEROES).filter(k => HEROES[k].r === r); const id = pick(pool);
    const s = r === 'l' ? rint(1, 2) : rint(2, 4); S.heroes[id].shards += s; got[id] = (got[id] || 0) + s;
    if (Math.random() < 0.3) S.items.manual += rint(2, 5);
  }
  task('recruit', n); S.stats.rec = (S.stats.rec || 0) + n; dirty(); save();
  return got;
}
function chiefCost(lv) { return { sucata: Math.round(400 * Math.pow(1.7, lv)), comb: Math.round(150 * Math.pow(1.7, lv)), liga: (lv + 1) * 2 }; }
function chiefUp(slot) {
  const lv = S.chief[slot]; if (!S.b.oficina) return toast('Construa a Oficina primeiro.', 'bad'); if (lv >= S.b.oficina * 2) return toast('Melhore a Oficina para subir mais.', 'bad');
  if (!pay(chiefCost(lv))) return toast('Recursos insuficientes.', 'bad'); S.chief[slot]++; toast(CHIEF[slot].n + ' Nv.' + S.chief[slot]); dirty(); save();
}

// ---------- combate ----------
function mods(heroes, defense) {
  const m = { atk: { b: 1, m: 1, a: 1 }, hp: { b: 1, m: 1, a: 1 } };
  const c = myClan(); const tb = towerBuff();
  CK.forEach(k => { m.atk[k] += S.tech.armas * 0.03 + (c ? c.tech.atk * 0.02 : 0) + tb * 0.03; m.hp[k] += S.tech.blind * 0.03 + (defense ? S.b.muralha * 0.04 : 0); });
  Object.keys(CHIEF).forEach(s => { m[CHIEF[s].st][CHIEF[s].c] += S.chief[s] * 0.02; });
  (heroes || []).forEach(id => { const hb = heroBonus(id), cl = HEROES[id].c; m.atk[cl] += hb.atk; m.hp[cl] += hb.hp; CK.forEach(k => { if (k !== cl) { m.atk[k] += hb.atk / 4; m.hp[k] += hb.hp / 4; } }); });
  return m;
}
function flatMods(x) { return { atk: { b: x, m: x, a: x }, hp: { b: x, m: x, a: x } }; }
function stats(a, md) { const s = {}; CK.forEach(c => { let at = 0, hp = 0; Object.keys(a[c] || {}).forEach(t => { at += a[c][t] * T[t].atk; hp += a[c][t] * T[t].hp; }); s[c] = { atk: at * md.atk[c], hp: hp * md.hp[c] }; }); return s; }
function battle(A, B, mA, mB) {
  const sa = stats(A, mA), sb = stats(B, mB);
  const ha0 = {}, hb0 = {}, ha = {}, hb = {};
  CK.forEach(c => { ha0[c] = ha[c] = sa[c].hp; hb0[c] = hb[c] = sb[c].hp; });
  const tot = h => CK.reduce((x, c) => x + Math.max(0, h[c]), 0);
  for (let r = 0; r < 8; r++) {
    const da = { b: 0, m: 0, a: 0 }, db = { b: 0, m: 0, a: 0 };
    const hit = (src, src0, srcStats, tgt, out) => {
      const H = tot(tgt); if (H <= 0) return;
      CK.forEach(c => {
        if (src[c] <= 0 || src0[c] <= 0) return; const at = srcStats[c].atk * (src[c] / src0[c]);
        CK.forEach(d => { if (tgt[d] <= 0) return; const sh = tgt[d] / H; const mul = CLS[c].beats === d ? 1.4 : CLS[d].beats === c ? 0.7 : 1; out[d] += at * sh * mul * 0.16 * rnd(0.92, 1.08); });
      });
    };
    hit(ha, ha0, sa, hb, db); hit(hb, hb0, sb, ha, da);
    CK.forEach(c => { ha[c] = Math.max(0, ha[c] - da[c]); hb[c] = Math.max(0, hb[c] - db[c]); });
    if (tot(ha) <= 0 || tot(hb) <= 0) break;
  }
  const fa = tot(ha0) ? tot(ha) / tot(ha0) : 0, fb = tot(hb0) ? tot(hb) / tot(hb0) : 0;
  const loss = (army, h, h0) => { const o = emptyArmy(); CK.forEach(c => { const f = h0[c] > 0 ? 1 - h[c] / h0[c] : 0; Object.keys(army[c] || {}).forEach(t => { const x = army[c][t] * f; const k = Math.min(army[c][t], Math.floor(x) + (Math.random() < x % 1 ? 1 : 0)); if (k > 0) o[c][t] = k; }); }); return o; };
  return { win: fa > fb, fa, fb, lossA: loss(A, ha, ha0), lossB: loss(B, hb, hb0) };
}
function hordeArmy(L, kind, mult) {
  const tier = clamp(Math.ceil(L / 2), 1, 10); const n = Math.round((25 + L * L * 6) * (mult || 1));
  const w = kind === 'b' ? [0.6, 0.2, 0.2] : kind === 'm' ? [0.2, 0.6, 0.2] : kind === 'a' ? [0.2, 0.2, 0.6] : [0.34, 0.33, 0.33];
  const a = emptyArmy(); CK.forEach((c, i) => { const x = Math.round(n * w[i]); if (x) a[c][tier] = x; if (tier > 1) a[c][tier - 1] = Math.round(x * 0.4); });
  return a;
}
function aiArmy(ai, frac) {
  const tier = clamp(Math.ceil(ai.lvl / 2), 1, 10); const units = ai.power * 0.6 * (frac || 1) / T[tier].pow;
  const a = emptyArmy(); CK.forEach((c, i) => { const x = Math.round(units * ai.comp[i] * 0.75); if (x) a[c][tier] = x; const y = Math.round(units * ai.comp[i] * 0.25 * T[tier].pow / T[Math.max(1, tier - 1)].pow); if (y && tier > 1) a[c][tier - 1] = y; else if (y) a[c][tier] = (a[c][tier] || 0) + y; });
  return a;
}
function playerPower() {
  let p = armyPow(S.troops); S.marches.forEach(m => p += armyPow(m.army));
  BORDER.forEach(k => p += Math.pow(S.b[k], 1.6) * 12);
  Object.keys(HEROES).forEach(k => p += heroPower(k) / 5);
  Object.values(S.tech).forEach(v => p += v * 40); Object.values(S.chief).forEach(v => p += v * 40);
  return Math.round(p);
}

// ---------- marchas ----------
function maxMarches() { return 1 + Math.floor((S.b.posto + 2) / 4); }
function busyHeroes() { const s = new Set(); S.marches.forEach(m => m.heroes.forEach(h => s.add(h))); return s; }
function marchSpeed(army) { const n = armyCount(army) || 1; let mo = 0; Object.values(army.m || {}).forEach(v => mo += v); return (1 + S.tech.logi * 0.06) * (mo / n > 0.5 ? 1.3 : 1); }
function travel(x, y, army) { const d = Math.hypot(x - S.x, y - S.y); return Math.max(4, d * 1.3 / marchSpeed(army)); }
function autoArmy(heroes, prefer) {
  const cap = heroes.reduce((a, h) => a + leadership(h), 0); const out = emptyArmy();
  const cls = prefer ? [prefer, ...CK.filter(c => c !== prefer)] : CK;
  let left = cap;
  // distribui proporcionalmente por classe, maiores tiers primeiro
  const avail = {}; CK.forEach(c => avail[c] = Object.values(S.troops[c]).reduce((a, b) => a + b, 0));
  const totalAvail = CK.reduce((a, c) => a + avail[c], 0); if (!totalAvail) return out;
  cls.forEach((c, i) => {
    let share = Math.min(avail[c], Math.ceil(cap * (avail[c] / totalAvail) * (prefer && c === prefer ? 1.2 : 1)));
    share = Math.min(share, left);
    Object.keys(S.troops[c]).map(Number).sort((a, b) => b - a).forEach(t => { if (share <= 0) return; const k = Math.min(share, S.troops[c][t]); if (k > 0) { out[c][t] = k; share -= k; left -= k; } });
  });
  // completa o que sobrou
  CK.forEach(c => Object.keys(S.troops[c]).map(Number).sort((a, b) => b - a).forEach(t => { if (left <= 0) return; const k = Math.min(left, S.troops[c][t] - (out[c][t] || 0)); if (k > 0) { out[c][t] = (out[c][t] || 0) + k; left -= k; } }));
  return out;
}
function sendMarch(kind, target, heroes, army) {
  if (S.marches.length >= maxMarches()) return toast('Todas as marchas estão ocupadas. Melhore o Posto de Comando.', 'bad');
  if (!heroes.length) return toast('Escolha pelo menos 1 herói.', 'bad');
  if (!armyCount(army)) return toast('Sem tropas para enviar.', 'bad');
  if ((kind === 'rally') && !S.clan) return toast('Precisa estar em um clã.', 'bad');
  subArmy(S.troops, army);
  const t = now(); const tt = travel(target.x, target.y, army) * 1000;
  const m = { id: S.mid++, kind, tx: target.x, ty: target.y, ref: target.id, tname: target.name, heroes: heroes.slice(), army, phase: kind === 'rally' ? 'wait' : 'go', t0: t, t1: kind === 'rally' ? t + 25000 : t + tt, tt, load: {}, joiners: [] };
  S.marches.push(m);
  if (S.shield > t && kind === 'attack') { S.shield = 0; toast('Seu escudo caiu porque você atacou.', 'bad'); }
  dirty(); save(); return m;
}
function recall(m) {
  if (m.phase === 'back') return; const t = now();
  if (m.phase === 'wait') { m.phase = 'back'; m.t0 = t; m.t1 = t + 1000; }
  else { const el = m.phase === 'go' ? (t - m.t0) : m.tt; m.phase = 'back'; m.t0 = t; m.t1 = t + Math.max(2000, el); }
  dirty();
}
function report(r) { r.t = now(); S.reports.unshift(r); S.reports.length = Math.min(S.reports.length, 40); }
function applyLoss(m, loss, woundFrac) {
  subArmy(m.army, loss);
  let room = Math.max(0, woundCap() - armyCount(S.wounded) - (S.hq ? armyCount(S.hq.army) : 0)); let w = 0, dead = 0;
  CK.forEach(c => Object.keys(loss[c]).forEach(t => { const x = Math.min(room, Math.floor(loss[c][t] * woundFrac)); room -= x; w += x; dead += loss[c][t] - x; if (x) S.wounded[c][t] = (S.wounded[c][t] || 0) + x; }));
  return { w, dead };
}
function arrive(m) {
  const W = S.world; const t = now();
  if (m.kind === 'gather') {
    const n = W.nodes.find(x => x.id === m.ref);
    if (!n || n.busy && n.busy !== 'P') { report({ title: 'Coleta cancelada', text: 'O ponto de recurso sumiu ou foi ocupado.', icon: '⚠️' }); return goBack(m); }
    let capa = 0; CK.forEach(c => Object.keys(m.army[c]).forEach(tt => capa += m.army[c][tt] * T[tt].load)); capa *= (1 + S.tech.logi * 0.06);
    const amt = Math.min(capa, n.amt); const r = (3 + n.lvl * 2.5) * (1 + S.tech.logi * 0.06);
    m.phase = 'work'; m.t0 = t; m.t1 = t + Math.max(5, amt / r) * 1000; m.amt = Math.floor(amt); m.res = n.res; n.busy = 'P'; dirty(); return;
  }
  if (m.kind === 'horde') {
    const h = W.hordes.find(x => x.id === m.ref);
    if (!h) { report({ title: 'Horda sumiu', text: 'Outro sobrevivente chegou antes.', icon: '⚠️' }); return goBack(m); }
    const res = battle(m.army, hordeArmy(h.lvl, h.kind), mods(m.heroes), flatMods(1));
    const lo = applyLoss(m, res.lossA, 0.7);
    if (res.win) {
      W.hordes = W.hordes.filter(x => x !== h); spawnHorde(h.lvl);
      const rw = { comida: 150 * h.lvl * h.lvl, agua: 150 * h.lvl * h.lvl, sucata: 120 * h.lvl * h.lvl, manual: rint(1, 2) + Math.floor(h.lvl / 3), chips: 5 + h.lvl * 2 };
      if (Math.random() < 0.4 + h.lvl * 0.03) rw.liga = rint(1, 2); if (Math.random() < 0.15) rw.radio = 1; if (Math.random() < 0.25) rw.medalha = rint(1, 3);
      m.load = rw; S.stats.kills++; task('horde', 1); evPts(100 * h.lvl);
      if (!S.maxHorde || h.lvl > S.maxHorde) S.maxHorde = h.lvl;
      report({ title: `Vitória! Horda Nv.${h.lvl}`, text: `Zumbis eliminados. Feridos: ${lo.w}, perdidos: ${lo.dead}.`, icon: '🧟', win: true, rw });
    } else report({ title: `Derrota contra Horda Nv.${h.lvl}`, text: `A horda era forte demais. Feridos: ${lo.w}, perdidos: ${lo.dead}. Treine mais tropas ou use heróis melhores.`, icon: '💀' });
    return goBack(m);
  }
  if (m.kind === 'attack') {
    const ai = W.ai.find(x => x.id === m.ref);
    if (!ai) return goBack(m);
    const res = battle(m.army, aiArmy(ai, 0.8), mods(m.heroes), flatMods(1 + ai.lvl * 0.03));
    const lo = applyLoss(m, res.lossA, 0.5);
    ai.power = Math.max(200, ai.power - armyPow(res.lossB) * 0.8); ai.loyal = clamp(ai.loyal - 6, 0, 100); ai.grudge = 'P';
    if (res.win) {
      const g = 300 * ai.lvl * ai.lvl; m.load = { comida: g, agua: g, sucata: g * 0.8, comb: g * 0.3 }; S.stats.pvpW++; ai.l++;
      report({ title: `Vitória contra ${ai.name}`, text: `Base saqueada! Feridos: ${lo.w}, perdidos: ${lo.dead}.`, icon: '⚔️', win: true, rw: m.load });
      news(`⚔️ ${S.name} saqueou a base de ${ai.name}${ai.clan ? ' [' + clanTag(ai.clan) + ']' : ''}.`, 'pvp');
      warScore(S.clan, ai.clan, 3);
    } else { S.stats.pvpL++; ai.w++; report({ title: `Derrota contra ${ai.name}`, text: `A defesa aguentou. Feridos: ${lo.w}, perdidos: ${lo.dead}.`, icon: '🛡️' }); warScore(ai.clan, S.clan, 2); }
    return goBack(m);
  }
  if (m.kind === 'rally') {
    const tg = W.giants.find(x => x.id === m.ref) || W.towers.find(x => x.id === m.ref);
    if (!tg) return goBack(m);
    const isTower = !!tg.tower;
    const total = JSON.parse(JSON.stringify(m.army)); m.joiners.forEach(j => addArmy(total, j.army));
    const enemy = isTower ? towerArmy(tg) : hordeArmy(tg.lvl * 2 + 4, null, 3);
    const res = battle(total, enemy, mods(m.heroes), flatMods(isTower ? 1.1 : 1.2));
    // perdas proporcionais só na parte do jogador
    const myLoss = emptyArmy(); CK.forEach(c => Object.keys(m.army[c]).forEach(t => { const tl = (res.lossA[c][t] || 0), tc = total[c][t] || 1; const k = Math.round(m.army[c][t] * tl / tc); if (k) myLoss[c][t] = k; }));
    const lo = applyLoss(m, myLoss, 0.8);
    const cl = myClan();
    if (res.win) {
      if (isTower) {
        const old = tg.owner; tg.owner = S.clan; tg.gar = (cl ? clanPower(cl) : 5000) * 0.12;
        m.load = { chips: 60, liga: 4, medalha: 4 }; if (cl) cl.morale = clamp(cl.morale + 10, 0, 100);
        news(`📡 O clã [${clanTag(S.clan)}] tomou a ${tg.name}${old ? ' do clã [' + clanTag(old) + ']' : ''} com um ataque em grupo liderado por ${S.name}!`, 'war');
        if (old) warScore(S.clan, old, 10);
      } else {
        W.giants = W.giants.filter(x => x !== tg); spawnGiant();
        m.load = { comida: 2000 * tg.lvl, agua: 2000 * tg.lvl, sucata: 1500 * tg.lvl, manual: 5 + tg.lvl, radio: 1 + Math.floor(tg.lvl / 4), liga: 3 + tg.lvl, chips: 30 + tg.lvl * 5 };
        if (cl) cl.morale = clamp(cl.morale + 6, 0, 100);
        news(`🦍 O clã [${clanTag(S.clan)}] derrubou o ${tg.name} Nv.${tg.lvl} num ataque em grupo de ${m.joiners.length + 1} sobreviventes.`, 'war');
      }
      evPts(500); task('horde', 1);
      report({ title: `Ataque em grupo: vitória!`, text: `${m.joiners.length} aliados participaram. Feridos: ${lo.w}, perdidos: ${lo.dead}.`, icon: '🚩', win: true, rw: m.load });
    } else {
      if (cl) cl.morale = clamp(cl.morale - 5, 0, 100);
      report({ title: `Ataque em grupo: derrota`, text: `${m.joiners.length} aliados participaram, mas não foi suficiente. Feridos: ${lo.w}, perdidos: ${lo.dead}.`, icon: '🏳️' });
    }
    return goBack(m);
  }
  goBack(m);
}
function goBack(m) { const t = now(); m.phase = 'back'; m.t0 = t; m.t1 = t + m.tt; dirty(); }
function finishMarch(m) {
  addArmy(S.troops, m.army); if (m.load) { gain(m.load); }
  if (m.kind === 'gather' && m.amt) toast(`Coleta voltou: +${fmt(m.amt)} ${RES[m.res].n}`);
  S.marches = S.marches.filter(x => x !== m); dirty();
}

// ---------- timers ----------
function checkTimers() {
  const t = now(); let ch = false;
  S.bq.slice().forEach(q => { if (q.end <= t) { S.b[q.bid] = q.to; S.bq = S.bq.filter(x => x !== q); S.stats.built++; task('build', 1); evPts(50 * q.to); toast(`✅ ${BLD[q.bid].n} chegou ao Nv.${q.to}`); if (q.bid === 'bunker') news(`🏚️ ${S.name} elevou o Bunker Central ao Nv.${q.to}.`, 'me'); ch = true; } });
  CK.forEach(c => { const q = S.tq[c]; if (q && q.end <= t) { S.troops[c][q.tier] = (S.troops[c][q.tier] || 0) + q.n; S.tq[c] = null; if (!q.from) { S.stats.trained += q.n; task('train', q.n); } evPts(q.n * q.tier * (q.from ? 0.5 : 1)); toast(`✅ ${q.n} ${CLS[c].n} T${q.tier} prontos`); ch = true; } });
  if (S.rq && S.rq.end <= t) { S.tech[S.rq.id] = S.rq.to; toast(`✅ Pesquisa concluída: ${TECH[S.rq.id].n} Nv.${S.rq.to}`); S.rq = null; ch = true; }
  if (S.hq && S.hq.end <= t) { addArmy(S.troops, S.hq.army); S.hq = null; toast('✅ Tropas curadas'); ch = true; }
  S.marches.slice().forEach(m => {
    if (m.t1 > t) return; ch = true;
    if (m.phase === 'wait') { rallyJoin(m); m.phase = 'go'; m.t0 = t; m.t1 = t + m.tt; }
    else if (m.phase === 'go') arrive(m);
    else if (m.phase === 'work') { const n = S.world.nodes.find(x => x.id === m.ref); if (n) { n.amt -= m.amt; n.busy = null; if (n.amt < 50) { S.world.nodes = S.world.nodes.filter(x => x !== n); spawnNode(); } } m.load = { [m.res]: m.amt }; task('gather', 1); evPts(m.amt / 50); goBack(m); }
    else if (m.phase === 'back') finishMarch(m);
  });
  if (ch) { dirty(); save(); }
}
function timerList() {
  const L = [];
  S.bq.forEach(q => L.push({ k: 'b', ref: q, n: `${BLD[q.bid].e} ${BLD[q.bid].n} → Nv.${q.to}` }));
  CK.forEach(c => { if (S.tq[c]) L.push({ k: 't', ref: S.tq[c], n: `${CLS[c].e} ${S.tq[c].from ? 'Promoção' : 'Treino'} ${S.tq[c].n}× T${S.tq[c].tier}` }); });
  if (S.rq) L.push({ k: 'r', ref: S.rq, n: `${TECH[S.rq.id].e} ${TECH[S.rq.id].n} Nv.${S.rq.to}` });
  if (S.hq) L.push({ k: 'h', ref: S.hq, n: `🏥 Cura de ${armyCount(S.hq.army)} tropas` });
  return L;
}
function speedUp(q, how) {
  const left = (q.end - now()) / 1000; if (left <= 0) return;
  if (how === 'free') { if (left > 300) return toast('Grátis só nos últimos 5 minutos.', 'bad'); q.end = now(); }
  else if (how === 'chips') { const c = Math.ceil(left / 60); if (S.chips < c) return toast('Fichas insuficientes.', 'bad'); S.chips -= c; q.end = now(); }
  else { if (!S.items[how]) return toast('Você não tem esse item.', 'bad'); S.items[how]--; q.end -= ITEMS[how].sec * 1000; }
  checkTimers(); dirty(); save();
}
function freeTime() { return 300; }

// ---------- tarefas diárias e evento ----------
const DAILY = [
  { k: 'build', n: 'Concluir 2 melhorias', g: 2, p: 20 },
  { k: 'train', n: 'Treinar 60 tropas', g: 60, p: 20 },
  { k: 'horde', n: 'Derrotar 3 hordas', g: 3, p: 20 },
  { k: 'gather', n: 'Fazer 2 coletas no mapa', g: 2, p: 15 },
  { k: 'collect', n: 'Recolher produção 6 vezes', g: 6, p: 10 },
  { k: 'help', n: 'Ajudar o clã 3 vezes', g: 3, p: 10 },
  { k: 'explore', n: 'Vencer 2 fases da Exploração', g: 2, p: 15 },
  { k: 'recruit', n: 'Recrutar 1 herói', g: 1, p: 10 },
];
const DCHEST = [{ p: 20, rw: { acel5: 2, comida: 2000 } }, { p: 40, rw: { radio: 1, agua: 2000 } }, { p: 60, rw: { manual: 10, sucata: 2000 } }, { p: 80, rw: { medalha: 4, acel60: 1 } }, { p: 100, rw: { radio: 3, chips: 100, liga: 5 } }];
const EVM = [{ p: 1500, rw: { acel5: 3, chips: 50 } }, { p: 5000, rw: { radio: 2, manual: 15 } }, { p: 12000, rw: { liga: 8, medalha: 6 } }, { p: 25000, rw: { radio: 4, acel60: 2 } }, { p: 50000, rw: { chips: 400, radio: 6 } }];
function dayKey() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function ensureDaily() {
  if (!S.daily || S.daily.day !== dayKey()) S.daily = { day: dayKey(), prog: {}, claimed: [], done: [], login: false };
  if (!S.event || now() - S.event.start > 3 * 864e5) S.event = { start: now(), pts: 0, claimed: [] };
}
function task(k, n) { ensureDaily(); S.daily.prog[k] = (S.daily.prog[k] || 0) + n; }
function dailyPts() { ensureDaily(); return DAILY.reduce((a, d) => a + ((S.daily.prog[d.k] || 0) >= d.g ? d.p : 0), 0); }
function evPts(n) { ensureDaily(); S.event.pts += Math.round(n); }
function claimChest(i) { const c = DCHEST[i]; if (dailyPts() < c.p || S.daily.claimed.includes(i)) return; S.daily.claimed.push(i); gain(c.rw); toast('Baú aberto!'); dirty(); save(); return c.rw; }
function claimEvent(i) { const c = EVM[i]; if (S.event.pts < c.p || S.event.claimed.includes(i)) return; S.event.claimed.push(i); gain(c.rw); toast('Recompensa do evento!'); dirty(); save(); return c.rw; }

// ---------- exploração ----------
function stagePow(s) { return Math.round(220 * Math.pow(1.17, s - 1)); }
function formPow() { return S.form.reduce((a, id) => a + heroPower(id), 0); }
function exploreChance() { const r = formPow() / stagePow(S.exp.stage); return clamp((r - 0.7) * 1.8, 0.03, 0.97); }
function explore() {
  const ok = Math.random() < exploreChance(); const s = S.exp.stage;
  if (ok) { const rw = { manual: 2 + Math.floor(s / 2), chips: 10 + s * 2, sucata: 300 * s }; if (s % 5 === 0) { rw.radio = 2; rw.medalha = 3; } gain(rw); S.exp.stage++; task('explore', 1); evPts(40 * s); dirty(); save(); return { ok, rw, s }; }
  dirty(); save(); return { ok, s };
}
function idleRw() { const min = Math.min(8 * 60, (now() - S.exp.idle) / 60000); const s = S.exp.stage; return { comida: Math.floor(min * 8 * s), agua: Math.floor(min * 8 * s), sucata: Math.floor(min * 6 * s), manual: Math.floor(min * 0.04 * (1 + s / 5)), min }; }
function claimIdle() { const r = idleRw(); if (r.min < 1) return toast('Ainda não juntou nada.', 'bad'); delete r.min; gain(r); S.exp.idle = now(); toast('Saque da expedição recolhido!'); dirty(); save(); return r; }

// ---------- salvar ----------
function save() { try { S.lastSave = now(); localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { } }
function load() { try { const s = localStorage.getItem(SAVE_KEY); if (s) return JSON.parse(s); } catch (e) { } return null; }
