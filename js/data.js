'use strict';
// ===== Refúgio Zero — dados e utilidades =====
const GAME_NAME = 'Refúgio Zero';
const SAVE_KEY = 'refugio-zero-v1';
const RES = {
  comida: { n: 'Comida', e: '🥫' },
  agua: { n: 'Água', e: '💧' },
  sucata: { n: 'Sucata', e: '🔩' },
  comb: { n: 'Combustível', e: '⛽' },
};
const RKEYS = Object.keys(RES);

const BLD = {
  bunker:   { n: 'Bunker Central', e: '🏚️', d: 'O coração do refúgio. O nível dele é o nível da sua conta e limita todas as outras construções.', base: 2, t: 15 },
  fazenda:  { n: 'Horta Hidropônica', e: '🌽', res: 'comida', d: 'Produz comida. Precisa de sobreviventes trabalhando.', t: 8 },
  poco:     { n: 'Poço Filtrado', e: '🚰', res: 'agua', d: 'Produz água limpa.', t: 8 },
  ferro:    { n: 'Ferro-Velho', e: '🔩', res: 'sucata', d: 'Desmonta carcaças e gera sucata.', t: 8 },
  refinaria:{ n: 'Refinaria Caseira', e: '⛽', res: 'comb', unlock: 2, d: 'Refina combustível para o gerador e as motos.', t: 9 },
  gerador:  { n: 'Gerador', e: '⚡', d: 'Mantém luz, filtros e cercas elétricas. Desligado, a infecção sobe.', t: 9 },
  abrigo:   { n: 'Abrigos', e: '🏠', d: 'Aumenta o limite de sobreviventes.', t: 7 },
  armazem:  { n: 'Armazém', e: '📦', unlock: 2, d: 'Aumenta o limite de recursos e protege parte deles de saques.', t: 9 },
  muralha:  { n: 'Muralha', e: '🧱', d: 'Defesa da base. Dá vida extra às tropas que defendem.', t: 10 },
  brutos:   { n: 'Quartel dos Brutos', e: '🪓', troop: 'b', d: 'Treina Brutos. Cada 2 níveis libera uma categoria nova (T1 a T10).', t: 10 },
  motos:    { n: 'Garagem dos Motoqueiros', e: '🏍️', troop: 'm', unlock: 2, d: 'Treina Motoqueiros.', t: 10 },
  atir:     { n: 'Torre dos Atiradores', e: '🎯', troop: 'a', unlock: 3, d: 'Treina Atiradores.', t: 10 },
  posto:    { n: 'Posto de Comando', e: '📡', unlock: 2, d: 'Mais marchas simultâneas e heróis liderando mais tropas.', t: 10 },
  enfermaria:{ n: 'Enfermaria', e: '🏥', unlock: 3, d: 'Guarda e cura tropas feridas. Também reduz a infecção.', t: 9 },
  centro:   { n: 'Rádio do Clã', e: '📻', unlock: 3, d: 'Mais ajudas do clã por tarefa e bônus na tecnologia do clã.', t: 9 },
  lab:      { n: 'Laboratório', e: '🧪', unlock: 4, d: 'Pesquisas que melhoram produção, tropas e marchas.', t: 11 },
  oficina:  { n: 'Oficina', e: '🛠️', unlock: 5, d: 'Forja o Equipamento do Líder e equipamentos de heróis.', t: 11 },
};
const BORDER = ['bunker','fazenda','poco','ferro','refinaria','gerador','abrigo','armazem','muralha','brutos','motos','atir','posto','enfermaria','centro','lab','oficina'];
const MAXLV = 20;
const ROT = ['fazenda','poco','ferro','brutos','abrigo','gerador','motos','refinaria','posto','atir','enfermaria','armazem','lab','centro','oficina'];

// classes de tropa: b > m > a > b
const CLS = {
  b: { n: 'Brutos', e: '🪓', beats: 'm', d: 'Fortes contra Motoqueiros' },
  m: { n: 'Motoqueiros', e: '🏍️', beats: 'a', d: 'Fortes contra Atiradores' },
  a: { n: 'Atiradores', e: '🎯', beats: 'b', d: 'Fortes contra Brutos' },
};
const CK = ['b','m','a'];
const ZCLS = { b: 'Brutamontes', m: 'Corredores', a: 'Cuspidores' };
const T = [];
for (let t = 1; t <= 10; t++) {
  const g = Math.pow(1.45, t - 1);
  T[t] = {
    atk: 10 * g, hp: 10 * g, pow: Math.round(2 * g * 10) / 10,
    cost: { comida: Math.round(8 * Math.pow(1.42, t - 1)), agua: Math.round(8 * Math.pow(1.42, t - 1)), sucata: Math.round(5 * Math.pow(1.42, t - 1)) },
    time: 0.5 * Math.pow(1.25, t - 1),
    load: 4 + t * 2,
  };
}
function troopCost(c, t) { const x = Object.assign({}, T[t].cost); if (c === 'm') x.comb = Math.round(4 * Math.pow(1.42, t - 1)); return x; }

const RAR = { r: { n: 'Raro', m: 1, c: '#4ea8ff' }, e: { n: 'Épico', m: 1.35, c: '#b36bff' }, l: { n: 'Lendário', m: 1.8, c: '#ffb534' } };
const HEROES = {
  rosa:  { n: 'Rosa Marreta', c: 'b', r: 'e', e: '🔨', s: ['Pancada Seca', 'Couro Grosso'], bio: 'Ex-pedreira. Resolve quase tudo com uma marreta.' },
  tiao:  { n: 'Tião Muralha', c: 'b', r: 'r', e: '🛡️', s: ['Escudo de Porta', 'Teimosia'], bio: 'Segurou sozinho o portão do mercado por três noites.' },
  cida:  { n: 'Dona Cida', c: 'b', r: 'l', e: '🍳', s: ['Frigideira Sagrada', 'Sopão'], bio: 'A avó mais temida do apocalipse.' },
  kaio:  { n: 'Kaio Veloz', c: 'm', r: 'r', e: '🏁', s: ['Arrancada', 'Zigue-Zague'], bio: 'Motoboy que nunca atrasou uma entrega. Nem agora.' },
  jess:  { n: 'Jéssica Faísca', c: 'm', r: 'e', e: '🔥', s: ['Rastro de Fogo', 'Nitro'], bio: 'Mecânica que transformou a moto num lança-chamas.' },
  bento: { n: 'Bento Pneu', c: 'm', r: 'l', e: '🛞', s: ['Atropelo', 'Comboio'], bio: 'Líder de comboio. Conhece cada estrada do mapa.' },
  nina:  { n: 'Nina Rádio', c: 'm', r: 'r', e: '📻', s: ['Sinal Aberto', 'Rota Segura'], bio: 'Escuta todas as frequências. Sabe onde está o perigo.' },
  lia:   { n: 'Lia Mira', c: 'a', r: 'r', e: '🏹', s: ['Flecha Certeira', 'Telhado'], bio: 'Arqueira do clube de tiro. Silenciosa e precisa.' },
  ze:    { n: 'Zé do Rifle', c: 'a', r: 'e', e: '🎖️', s: ['Rajada', 'Trincheira'], bio: 'Caçador do interior, desconfiado de todo mundo.' },
  ana:   { n: 'Doutora Ana', c: 'a', r: 'l', e: '💉', s: ['Dardo Sedativo', 'Primeiros Socorros'], bio: 'Médica que descobriu como desacelerar a infecção.' },
};
const GEAR = { arma: '🗡️ Arma', capacete: '⛑️ Capacete', colete: '🦺 Colete', botas: '🥾 Botas' };
const CHIEF = {
  capacete: { n: 'Capacete Tático', e: '⛑️', st: 'hp', c: 'b' },
  colete:   { n: 'Colete Reforçado', e: '🦺', st: 'hp', c: 'm' },
  luvas:    { n: 'Luvas de Couro', e: '🧤', st: 'atk', c: 'b' },
  calca:    { n: 'Calça Cargo', e: '👖', st: 'hp', c: 'a' },
  botas:    { n: 'Botas de Combate', e: '🥾', st: 'atk', c: 'm' },
  radio:    { n: 'Rádio Militar', e: '📟', st: 'atk', c: 'a' },
};
const TECH = {
  agri:  { n: 'Agricultura Urbana', e: '🌱', d: '+6% comida por nível' },
  puri:  { n: 'Purificação', e: '💧', d: '+6% água por nível' },
  recic: { n: 'Reciclagem', e: '♻️', d: '+6% sucata por nível' },
  dest:  { n: 'Destilação', e: '🛢️', d: '+6% combustível por nível' },
  treino:{ n: 'Treino Intensivo', e: '🏋️', d: '+6% velocidade de treino' },
  armas: { n: 'Armas Improvisadas', e: '🔪', d: '+3% ataque das tropas' },
  blind: { n: 'Blindagem', e: '🧲', d: '+3% vida das tropas' },
  logi:  { n: 'Logística', e: '🧭', d: '+6% velocidade de marcha e carga' },
  obra:  { n: 'Engenharia', e: '📐', d: '+5% velocidade de construção' },
  vacina:{ n: 'Vacina Experimental', e: '🧬', d: '-10% ganho de infecção' },
};
const CTECH = {
  prod: { n: 'Hortas Coletivas', e: '🌾', d: '+3% produção por nível' },
  atk:  { n: 'Arsenal Comum', e: '⚔️', d: '+2% ataque por nível' },
  ajuda:{ n: 'Mutirão', e: '🤝', d: '+1 ajuda por tarefa por nível' },
};
const ITEMS = {
  acel1: { n: 'Aceleração 1 min', e: '⏩', sec: 60 },
  acel5: { n: 'Aceleração 5 min', e: '⏩', sec: 300 },
  acel60: { n: 'Aceleração 1 h', e: '⏭️', sec: 3600 },
  radio: { n: 'Sinal de Rádio (recrutamento)', e: '📡' },
  manual: { n: 'Manual de Sobrevivência (XP)', e: '📘' },
  medalha: { n: 'Medalha (habilidades)', e: '🏅' },
  liga: { n: 'Liga Metálica', e: '⚙️' },
  escudo: { n: 'Escudo de Paz 2 h', e: '🛡️' },
};

const FIRST = ['Marcão','Duda','Rafa','Tonhão','Bia','Léo','Kátia','Juninho','Paty','Gui','Dani','Fefê','Caio','Lu','Beto','Nanda','Thiago','Jéssi','Vini','Rô','Biel','Malu','Fábio','Lari','Diego','Carla','Teté','Neto','Sandro','Gabi','Pedrão','Mari','Zeca','Lelê','Alemão','Bruna','Chico','Dedé','Elisa','Fred','Jorge','Kiko','Lívia','Moa','Nino','Olga','Paulão','Quel','Renan','Sueli','Tico','Vavá','Wesley','Yara','Zuca','Japa','Baiano','Mineiro','Gaúcho','Cearense'];
const SUF = ['','','',' Sucata',' Diesel',' Faca',' do Gás','_77',' Lâmina',' Zero','_BR',' Ferrugem',' Sem Medo',' da Lua',' Caveira','_Sobrevive',' Pólvora',' Turbo',' Bala',' da Serra','2000',' Corvo',' Lobo',' Neblina'];
const CPRE = ['Lobos','Corvos','Filhos','Guardiões','Ratos','Herdeiros','Sombras','Caçadores','Brigada','Legião','Matilha','Ordem','Irmandade','Tribo','Bando','Rebeldes','Clã','Facção','Vigias','Andarilhos'];
const CSUF = ['do Asfalto','de Ferro','da Ferrugem','do Último Sol','da Chuva Ácida','do Gerador','sem Pulso','do Farol','Rubros','da Estrada','do Bunker','da Neblina','do Fim','de Sucata','da Madrugada','do Viaduto','da Represa','do Morro','Livres','do Cerrado','da Cinza','do Pântano'];
const INIT_CLANS = [
  ['Lobos do Asfalto','LOB'],['Corvos de Ferro','CRV'],['Últimos Sinais','SIN'],['Brigada Ferrugem','BRF'],
  ['Filhos da Chuva Ácida','FCA'],['Guardiões do Poço','GDP'],['Os Sem Pulso','OSP'],['Caravana Fantasma','CFT'],
  ['Aliança Farol','FAR'],['Matilha Rubra','MTR'],['Ordem do Gerador','ODG'],['Ratos de Sucata','RDS'],
];
const COLORS = ['#ff5d5d','#ffb534','#9be15d','#4ea8ff','#b36bff','#ff7ad9','#3ee0c8','#ffd84d','#ff8a3d','#7ef0a0','#8fa8ff','#e06666','#c9a0ff','#5ce1ff','#f5f5a0','#ff9e9e','#a0ffcf','#ffcf80','#90caf9','#ce93d8'];

// utilidades
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function fmt(n) {
  n = Math.floor(n);
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace('.0', '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(1).replace('.0', '') + 'K';
  return n.toLocaleString('pt-BR');
}
function ftime(s) {
  s = Math.max(0, Math.ceil(s));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  if (h) return h + 'h ' + String(m).padStart(2, '0') + 'm';
  if (m) return m + 'm ' + String(x).padStart(2, '0') + 's';
  return x + 's';
}
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function costHtml(c, have) {
  return Object.keys(c).filter(k => c[k] > 0).map(k => {
    const ok = !have || (have[k] || 0) >= c[k];
    const e = RES[k] ? RES[k].e : (ITEMS[k] ? ITEMS[k].e : k);
    return `<span class="cost ${ok ? '' : 'bad'}">${e} ${fmt(c[k])}</span>`;
  }).join('');
}
