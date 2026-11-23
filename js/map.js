'use strict';
// ===== Refúgio Zero — mapa do mundo (canvas) =====
const MapV = { cx: 40, cy: 40, z: 0.8, cv: null, ctx: null, w: 0, h: 0, dpr: 1, on: false, sprites: {}, sel: null, drag: null, raf: 0, last: 0 };
const TS = 38;
function hash(x, y) { let h = x * 374761393 + y * 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; }
function sprite(e, px) {
  const k = e + px; if (MapV.sprites[k]) return MapV.sprites[k];
  const c = document.createElement('canvas'); const s = Math.ceil(px * 1.3); c.width = c.height = s; const x = c.getContext('2d');
  x.font = `${px}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, s / 2, s / 2 + px * 0.06);
  MapV.sprites[k] = c; return c;
}
function mapInit(cv) {
  MapV.cv = cv; MapV.ctx = cv.getContext('2d'); MapV.cx = S.x; MapV.cy = S.y;
  const pts = new Map(); let pinch = null, moved = 0;
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: MapV.z }; } });
  cv.addEventListener('pointermove', e => {
    const p = pts.get(e.pointerId); if (!p) return;
    if (pts.size === 2 && pinch) { p.x = e.clientX; p.y = e.clientY; const [a, b] = [...pts.values()]; MapV.z = clamp(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, 0.55, 1.8); moved = 99; return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y; moved += Math.abs(dx) + Math.abs(dy);
    const ts = TS * MapV.z; MapV.cx = clamp(MapV.cx - dx / ts, 0, MAP); MapV.cy = clamp(MapV.cy - dy / ts, 0, MAP); p.x = e.clientX; p.y = e.clientY;
  });
  const up = e => { const p = pts.get(e.pointerId); pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (p && moved < 10 && pts.size === 0) mapTap(e); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', e => { pts.delete(e.pointerId); pinch = null; });
  cv.addEventListener('wheel', e => { e.preventDefault(); MapV.z = clamp(MapV.z * (e.deltaY < 0 ? 1.1 : 0.9), 0.55, 1.8); }, { passive: false });
}
function mapResize() { const r = MapV.cv.parentElement.getBoundingClientRect(); MapV.dpr = Math.min(2, window.devicePixelRatio || 1); MapV.w = r.width; MapV.h = r.height; MapV.cv.width = r.width * MapV.dpr; MapV.cv.height = r.height * MapV.dpr; MapV.cv.style.width = r.width + 'px'; MapV.cv.style.height = r.height + 'px'; }
function toScreen(x, y) { const ts = TS * MapV.z; return [(x - MapV.cx) * ts + MapV.w / 2, (y - MapV.cy) * ts + MapV.h / 2]; }
function mapTap(e) {
  const r = MapV.cv.getBoundingClientRect(); const ts = TS * MapV.z;
  const x = (e.clientX - r.left - MapV.w / 2) / ts + MapV.cx, y = (e.clientY - r.top - MapV.h / 2) / ts + MapV.cy;
  const W = S.world; let best = null, bd = 0.9;
  const test = (o, kind) => { const d = Math.hypot(o.x - x, o.y - y); if (d < bd) { bd = d; best = { kind, o }; } };
  W.hordes.forEach(o => test(o, 'horde')); W.nodes.forEach(o => test(o, 'node')); W.ai.forEach(o => test(o, 'ai')); W.giants.forEach(o => test(o, 'giant')); W.towers.forEach(o => test(o, 'tower'));
  test({ x: S.x, y: S.y }, 'me');
  MapV.sel = best; if (best) openEntity(best);
}
function mapFocus(x, y) { MapV.cx = x; MapV.cy = y; }
function mapLoop(t) {
  if (!MapV.on) return; MapV.raf = requestAnimationFrame(mapLoop);
  if (t - MapV.last < 33) return; MapV.last = t; drawMap();
}
function mapStart() { if (MapV.on) return; MapV.on = true; mapResize(); MapV.raf = requestAnimationFrame(mapLoop); }
function mapStop() { MapV.on = false; cancelAnimationFrame(MapV.raf); }
function drawMap() {
  const c = MapV.ctx, d = MapV.dpr, W = S.world; c.setTransform(d, 0, 0, d, 0, 0);
  const ts = TS * MapV.z, w = MapV.w, h = MapV.h;
  c.fillStyle = '#0c0f0d'; c.fillRect(0, 0, w, h);
  const x0 = Math.floor(MapV.cx - w / 2 / ts) - 1, x1 = Math.ceil(MapV.cx + w / 2 / ts) + 1, y0 = Math.floor(MapV.cy - h / 2 / ts) - 1, y1 = Math.ceil(MapV.cy + h / 2 / ts) + 1;
  for (let y = Math.max(0, y0); y < Math.min(MAP, y1); y++) for (let x = Math.max(0, x0); x < Math.min(MAP, x1); x++) {
    const v = hash(x, y); const [sx, sy] = toScreen(x - 0.5, y - 0.5);
    const road = (x % 10 === 0) || (y % 10 === 0);
    c.fillStyle = road ? '#23262a' : v < 0.15 ? '#1a2117' : v < 0.3 ? '#171d16' : v > 0.93 ? '#221c17' : '#141914';
    c.fillRect(sx, sy, ts + 0.6, ts + 0.6);
    if (!road && v > 0.975 && ts > 22) c.drawImage(sprite(v > 0.99 ? '🚗' : '🌲', 26), sx + ts * 0.15, sy + ts * 0.15, ts * 0.7, ts * 0.7);
  }
  // bordas do mapa
  const [bx, by] = toScreen(-0.5, -0.5); c.strokeStyle = '#ff5d5d55'; c.lineWidth = 2; c.strokeRect(bx, by, MAP * ts, MAP * ts);
  const vis = o => o.x >= x0 && o.x <= x1 && o.y >= y0 && o.y <= y1;
  // territórios
  c.globalAlpha = 0.11;
  W.ai.forEach(a => { if (!a.clan || !vis(a)) return; const cl = clanById(a.clan); if (!cl) return; const [sx, sy] = toScreen(a.x, a.y); c.fillStyle = cl.color; c.beginPath(); c.arc(sx, sy, ts * 2.2, 0, 7); c.fill(); });
  if (S.clan) { const cl = myClan(); const [sx, sy] = toScreen(S.x, S.y); c.fillStyle = cl.color; c.beginPath(); c.arc(sx, sy, ts * 2.2, 0, 7); c.fill(); }
  c.globalAlpha = 1;
  const big = ts * 0.78, fs = Math.max(9, 11 * MapV.z);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  const label = (sx, sy, txt, col, bg) => { c.font = `700 ${fs}px system-ui,sans-serif`; const tw = c.measureText(txt).width + 8; c.fillStyle = bg || 'rgba(0,0,0,.65)'; c.fillRect(sx - tw / 2, sy - fs * 0.65, tw, fs * 1.3); c.fillStyle = col || '#fff'; c.fillText(txt, sx, sy + 0.5); };
  W.nodes.forEach(n => { if (!vis(n)) return; const [sx, sy] = toScreen(n.x, n.y); c.drawImage(sprite({ comida: '🌽', agua: '🛢️', sucata: '⚙️', comb: '⛽' }[n.res], 30), sx - big / 2, sy - big / 2, big, big); if (ts > 24) label(sx, sy + ts * 0.5, 'Nv' + n.lvl, '#cfe8b8'); if (n.busy) { c.strokeStyle = '#9be15d'; c.beginPath(); c.arc(sx, sy, ts * 0.5, 0, 7); c.stroke(); } });
  W.hordes.forEach(o => { if (!vis(o)) return; const [sx, sy] = toScreen(o.x, o.y); c.drawImage(sprite(o.kind === 'b' ? '🧟‍♂️' : o.kind === 'm' ? '🧟' : o.kind === 'a' ? '🧟‍♀️' : '🧟', 30), sx - big / 2, sy - big / 2, big, big); label(sx, sy + ts * 0.5, String(o.lvl), '#fff', o.lvl <= 3 ? '#2e6b2ecc' : o.lvl <= 8 ? '#8a6a12cc' : '#8a1f1fcc'); });
  W.giants.forEach(o => { if (!vis(o)) return; const [sx, sy] = toScreen(o.x, o.y); c.drawImage(sprite('🦍', 34), sx - ts * 0.6, sy - ts * 0.6, ts * 1.2, ts * 1.2); label(sx, sy + ts * 0.7, 'Gigante ' + o.lvl, '#ffd84d', '#3b1010dd'); });
  W.towers.forEach(o => { if (!vis(o)) return; const [sx, sy] = toScreen(o.x, o.y); const cl = o.owner && clanById(o.owner); c.fillStyle = (cl ? cl.color : '#888') + '44'; c.beginPath(); c.arc(sx, sy, ts * 1.1, 0, 7); c.fill(); c.strokeStyle = cl ? cl.color : '#888'; c.lineWidth = 2; c.stroke(); c.drawImage(sprite('📡', 34), sx - ts * 0.6, sy - ts * 0.6, ts * 1.2, ts * 1.2); label(sx, sy + ts * 0.85, cl ? '[' + cl.tag + ']' : 'Livre', cl ? cl.color : '#ccc'); });
  W.ai.forEach(a => { if (!vis(a)) return; const [sx, sy] = toScreen(a.x, a.y); const cl = a.clan && clanById(a.clan); const lead = cl && cl.leader === a.id; c.drawImage(sprite(lead ? '🏯' : a.lvl >= 10 ? '🏰' : '🏚️', 30), sx - big / 2, sy - big / 2, big, big); if (ts > 26) label(sx, sy + ts * 0.52, (cl ? '[' + cl.tag + '] ' : '') + a.name, cl ? cl.color : '#bbb'); });
  { const [sx, sy] = toScreen(S.x, S.y); c.fillStyle = '#9be15d33'; c.beginPath(); c.arc(sx, sy, ts * 0.9, 0, 7); c.fill(); c.strokeStyle = '#9be15d'; c.lineWidth = 2; c.stroke(); c.drawImage(sprite('🏰', 34), sx - ts * 0.6, sy - ts * 0.62, ts * 1.2, ts * 1.2); const cl = myClan(); label(sx, sy + ts * 0.75, (cl ? '[' + cl.tag + '] ' : '') + S.name, '#9be15d', '#0b2410e0'); }
  // marchas
  const t = now();
  S.marches.forEach(m => {
    const [ax, ay] = toScreen(S.x, S.y), [bx2, by2] = toScreen(m.tx, m.ty);
    c.strokeStyle = m.kind === 'gather' ? '#4ea8ffaa' : m.kind === 'rally' ? '#ffb534aa' : '#ff5d5daa'; c.lineWidth = 2; c.setLineDash([6, 5]); c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx2, by2); c.stroke(); c.setLineDash([]);
    let f = m.phase === 'go' ? (t - m.t0) / (m.t1 - m.t0) : m.phase === 'back' ? 1 - (t - m.t0) / (m.t1 - m.t0) : m.phase === 'work' ? 1 : 0; f = clamp(f, 0, 1);
    const px = ax + (bx2 - ax) * f, py = ay + (by2 - ay) * f; c.drawImage(sprite(m.kind === 'gather' ? '🛻' : '🚩', 26), px - ts * 0.35, py - ts * 0.35, ts * 0.7, ts * 0.7);
  });
  if (MapV.sel) { const o = MapV.sel.kind === 'me' ? S : MapV.sel.o; const [sx, sy] = toScreen(o.x, o.y); c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(sx, sy, ts * 0.62 + Math.sin(t / 200) * 2, 0, 7); c.stroke(); }
  // minimapa de coordenadas
  const el = document.getElementById('mapxy'); if (el) el.textContent = `X ${Math.round(MapV.cx)} · Y ${Math.round(MapV.cy)}`;
}
