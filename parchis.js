// Día 12 · «El parxís de Nadal» (V26) — sustituye al «Ojo de lince».
// · Se juega SOLO (contra 1, 2 o 3 Papás Noel) o EN LÍNEA con 2, 3 o 4 personas que tengan la app abierta.
// · En línea: lista de quién está conectado con un botón verde al lado; al tocarlo le llega la invitación; si dice que sí, elige color.
//   Quien invita pulsa ⏱ «¡Empezamos!»: el tiempo empieza a contar y ya no se puede apuntar nadie más.
// · Todos ven el mismo tablero; cada uno mueve su color arrastrando la ficha con el dedo (encaja y hace «clic»).
// · Si alguien no tira en 2 minutos, su ficha se mueve sola; si no vuelve en 5 minutos, queda fuera y −1.
// · Puntos (Marcador de Navidad y gnomos): 1.º = tantos como jugadores (4 si son 4), 2.º uno menos… último 1. Abandonar: −1.
// · Reglas de siempre: salir con 5, comer suma 20, llegar a casa suma 10, con 6 se repite (7 si no queda nadie en casa),
//   el tercer 6 seguido manda a casa la última ficha movida, las barreras no dejan pasar, a la meta se llega justo.
import { getLang } from './i18n.js';
import { el, sleep, confetti, popup, toast } from './fx.js';
import { pop, chime, clickSound, snapSound, unlockAudio, sayVoice, preloadVoice, wrong, sadTrombone, fanfare } from './sound.js';
import { pawnSvg, dragToken, bigCongrats } from './gamefx.js';
import { store } from './store.js';
import { S, figure } from './app.js';

// replaceChildren sin «null» escrito en pantalla
const rc = (n, ...k) => n.replaceChildren(...k.flat().filter(x => x != null && x !== false));
const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const FIG = { galleta: 'galleta.png', arbol: 'arbol.png', gnomo: 'gnomo.png' };
// ---------------------------------------------------------------- tablero
export const COLORS = ['y', 'b', 'r', 'g']; // orden de juego (contrario a las agujas del reloj)
const ARM = { y: 0, b: 1, r: 2, g: 3 };
const TIPS = [67, 16, 33, 50];
const SAL = { y: 4, b: 21, r: 38, g: 55 };
const SAFE = new Set(TIPS.flatMap(t => [t, (t + 5) % 68, (t + 12) % 68]));
const CNAME = { y: () => L('Amarillo', 'Groc', 'Yellow'), b: () => L('Azul', 'Blau', 'Blue'), r: () => L('Rojo', 'Vermell', 'Red'), g: () => L('Verde', 'Verd', 'Green') };
const CHEX = { y: '#f2b705', b: '#1f7ae0', r: '#d3203a', g: '#1f9a4a' };
// casillas del recorrido (columna, fila) en una cuadrícula de 19×19
const TRACK = [];
for (let j = 0; j < 8; j++) TRACK.push([10, 18 - j]);
for (let j = 0; j < 8; j++) TRACK.push([11 + j, 10]);
TRACK.push([18, 9]);
for (let j = 0; j < 8; j++) TRACK.push([18 - j, 8]);
for (let j = 0; j < 8; j++) TRACK.push([10, 7 - j]);
TRACK.push([9, 0]);
for (let j = 0; j < 8; j++) TRACK.push([8, j]);
for (let j = 0; j < 8; j++) TRACK.push([7 - j, 8]);
TRACK.push([0, 9]);
for (let j = 0; j < 8; j++) TRACK.push([j, 10]);
for (let j = 0; j < 8; j++) TRACK.push([8, 11 + j]);
TRACK.push([9, 18]);
const CORR = { y: k => [9, 17 - k], b: k => [17 - k, 9], r: k => [9, 1 + k], g: k => [1 + k, 9] };
const HOMEC = { y: [15, 15], b: [15, 4], r: [4, 4], g: [4, 15] };
const METAC = { y: [9.5, 10.15], b: [10.15, 9.5], r: [9.5, 8.85], g: [8.85, 9.5] };
const vertical = ([c]) => c >= 8 && c <= 10;

// ---------------------------------------------------------------- reglas (sin pantalla: sirven igual en solo y en línea)
const absOf = (c, p) => (SAL[c] + p) % 68;
const keyOf = (c, p) => p < 0 ? 'h' + c : p <= 63 ? 't' + absOf(c, p) : p <= 70 ? 'c' + c + (p - 64) : 'm' + c;
function occ(G, k) { const o = []; for (const c of G.order) G.tok[c].forEach((p, i) => { if (p >= -1 && keyOf(c, p) === k) o.push({ c, i }); }); return o; }
const atHome = (G, c) => G.tok[c].some(p => p === -1);
export function moveOf(G, c, i, s, bonus = false) {
  const p = G.tok[c][i];
  if (p === -2 || p === 71) return null;
  if (p === -1) {
    if (bonus || s !== 5) return null;
    const k = 't' + SAL[c], o = occ(G, k);
    if (o.length >= 2) { const en = o.filter(x => x.c !== c); if (!en.length) return null; return { c, i, from: -1, to: 0, cap: en[en.length - 1], path: [k] }; }
    return { c, i, from: -1, to: 0, cap: null, path: [k] };
  }
  const to = p + s; if (to > 71) return null;
  const path = [];
  for (let q = p + 1; q <= to; q++) {
    const k = keyOf(c, q); path.push(k);
    if (q <= 63) {
      const o = occ(G, k).filter(x => !(x.c === c && x.i === i));
      if (o.length >= 2 && o[0].c === o[1].c) return null; // barrera: 2 fichas del MISMO color (V26.3: dos colores distintos en un seguro no cierran el paso)
      if (q === to && o.length >= 2) return null;          // en una casilla caben 2 fichas como mucho
    }
  }
  let cap = null;
  if (to <= 63) {
    const o = occ(G, keyOf(c, to)).filter(x => !(x.c === c && x.i === i));
    if (o.length === 1 && o[0].c !== c && !SAFE.has(absOf(c, to))) cap = o[0];
  }
  return { c, i, from: p, to, cap, path };
}
export function legal(G, c, s, bonus = false) {
  const all = [0, 1, 2, 3].map(i => moveOf(G, c, i, s, bonus)).filter(Boolean);
  if (!bonus && s === 5) { const ex = all.filter(m => m.from === -1); if (ex.length) return ex; } // con un 5 hay que sacar ficha
  return all;
}
const done4 = (G, c) => G.tok[c].every(p => p === 71);
const activeCols = G => G.order.filter(c => !G.fin.includes(c) && !G.out.includes(c));
function nextTurn(G) {
  G.sixes = 0; G.lastTok = null; G.ph = 'roll'; G.dice = 0; G.steps = 0; G.bonus = 0;
  const act = activeCols(G); if (!act.length) return;
  let k = G.order.indexOf(G.turn);
  for (let n = 0; n < 4; n++) { k = (k + 1) % G.order.length; if (act.includes(G.order[k])) { G.turn = G.order[k]; return; } }
}
// ¿se acaba? (en solo, cuando el humano llega; en línea, cuando solo queda uno por llegar)
function checkEnd(G) {
  const act = activeCols(G);
  if (G.solo) { if (G.fin.includes(G.me)) G.status = 'end'; return; }
  if (act.length <= 1) { if (act.length === 1) G.fin.push(act[0]); G.status = 'end'; }
}
export function newGame(order, { solo = false, me = null } = {}) {
  const tok = {}; COLORS.forEach(c => { tok[c] = order.includes(c) ? [-1, -1, -1, -1] : [-2, -2, -2, -2]; });
  return { order, tok, turn: order[0], ph: 'roll', dice: 0, steps: 0, sixes: 0, lastTok: null, bonus: 0, fin: [], out: [], solo, me, status: 'play' };
}
// tirar el dado: devuelve un aviso para la pantalla
export function applyRoll(G, n) {
  const c = G.turn; G.dice = n;
  if (n === 6) {
    G.sixes++;
    if (G.sixes >= 3) { // tercer 6 seguido: la última ficha movida vuelve a casa (si no está ya en el pasillo de meta)
      const i = G.lastTok; let sent = null;
      if (i != null && G.tok[c][i] >= 0 && G.tok[c][i] <= 63) { sent = { c, i, from: G.tok[c][i] }; G.tok[c][i] = -1; }
      nextTurn(G); return { k: 'three6', sent };
    }
  }
  const s = n === 6 && !atHome(G, c) ? 7 : n;
  G.steps = s;
  if (!legal(G, c, s).length) {
    if (n === 6) { G.ph = 'roll'; return { k: 'none6' }; }
    nextTurn(G); return { k: 'none' };
  }
  G.ph = 'move'; return { k: 'move', s };
}
export function applyMove(G, mv) {
  const { c, i } = mv;
  G.tok[c][i] = mv.to; G.lastTok = i;
  if (mv.cap) G.tok[mv.cap.c][mv.cap.i] = -1;
  const wasBonus = G.ph === 'bonus';
  let fx = mv.cap ? 'cap' : mv.to === 71 ? 'meta' : '';
  if (done4(G, c) && !G.fin.includes(c)) { G.fin.push(c); fx = 'done'; checkEnd(G); if (G.status === 'end') return fx; nextTurn(G); return fx; }
  const b = mv.cap ? 20 : mv.to === 71 ? 10 : 0;
  if (b && legal(G, c, b, true).length) { G.ph = 'bonus'; G.bonus = b; G.steps = b; return fx; }
  if (b) fx += 'x'; // (V26.3) toca contar 20 o 10 pero no se puede mover ninguna ficha
  if (G.dice === 6) { G.ph = 'roll'; G.steps = 0; G.bonus = 0; return fx; } // con un 6 se vuelve a tirar
  nextTurn(G); return fx;
}
// la máquina (o el «se mueve sola» de los 2 minutos): comer > llegar > salir > la más adelantada
export function bestMove(moves) {
  const sc = m => (m.cap ? 1000 : 0) + (m.to === 71 ? 500 : 0) + (m.from === -1 ? 300 : 0) + m.from;
  return moves.slice().sort((a, b) => sc(b) - sc(a))[0];
}
// alguien se va: sus fichas desaparecen
function removeColor(G, c) {
  if (!G.out.includes(c)) G.out.push(c);
  G.tok[c] = G.tok[c].map(p => p === 71 ? 71 : -2);
  const wasTurn = G.turn === c;
  checkEnd(G); if (G.status !== 'end' && wasTurn) nextTurn(G);
}

// ---------------------------------------------------------------- pantalla del día 12
export function render(body, ctx) {
  body.append(el('div', { class: 'pch-intro' },
    el('h2', { class: 'q-title cw-title' }, '🎲 ' + L('El parchís de Navidad', 'El parxís de Nadal', 'Christmas ludo') + ' 🎄'),
    el('div', { class: 'pch-intro-pics' }, ...COLORS.map(c => el('div', { class: 'pch-intro-pawn', html: pawnSvg(c) }))),
    el('p', { class: 'game-help' }, L('Juega sola o solo contra Papá Noel, o en línea con las personas que tengan la app abierta (de 2 a 4). ¡Todos veis el mismo tablero!',
      'Juga sol contra el Pare Noel, o en línia amb les persones que tinguin l’app oberta (de 2 a 4). Tots veieu el mateix tauler!',
      'Play alone against Santa, or online with people who have the app open (2 to 4). Everyone sees the same board!')),
    el('div', { class: 'pch-cta-row' },
      el('button', { type: 'button', class: 'oca-cta pch-cta no-delay', onclick: () => { unlockAudio(); openParchis(ctx, { mode: 'online' }); } }, '🌐 ' + L('Jugar en línea', 'Jugar en línia', 'Play online')),
      el('button', { type: 'button', class: 'oca-cta pch-cta solo no-delay', onclick: () => { unlockAudio(); openParchis(ctx, { mode: 'solo' }); } }, '🎅 ' + L('Jugar contra Papá Noel', 'Jugar contra el Pare Noel', 'Play against Santa'))),
    el('button', { type: 'button', class: 'btn btn-ghost no-delay', onclick: () => showRules() }, '📜 ' + L('Reglas', 'Regles', 'Rules'))));
}

// ---- reglas (botón a mano, dentro y fuera del juego)
export function showRules() {
  const host = document.body; document.querySelector('.pch-rules')?.remove();
  const R = (ico, t, d) => el('div', { class: 'oca-rule' }, el('div', { class: 'pch-rico' }, ico), el('div', {}, el('b', {}, t), el('small', {}, d)));
  const box = el('div', { class: 'cc8-end oca-helpbox pch-rules' }, el('div', { class: 'cc8-endcard oca-help' },
    el('h2', {}, '📜 ' + L('Reglas del parchís', 'Regles del parxís', 'Ludo rules')),
    R('🎲', L('Tirar', 'Tirar', 'Roll'), L('Toca el dado para que gire y vuelve a tocarlo para pararlo. Después coge tu ficha con el dedo y llévala a la casilla que brilla: encaja y hace «clic».', 'Toca el dau perquè giri i torna’l a tocar per parar-lo. Després agafa la teva fitxa amb el dit i porta-la a la casella que brilla: encaixa i fa «clic».', 'Tap the dice to spin it and tap again to stop it. Then drag your token to the glowing square: it clicks into place.')),
    R('5️⃣', L('Salir de casa', 'Sortir de casa', 'Leaving home'), L('Solo se sale con un 5. Si sacas un 5 y puedes sacar ficha, es obligatorio.', 'Només se surt amb un 5. Si treus un 5 i pots treure fitxa, és obligatori.', 'You only leave home with a 5. If you roll a 5 and can bring a token out, you must.')),
    R('6️⃣', L('El 6', 'El 6', 'The 6'), L('Con un 6 vuelves a tirar. Si ya no te queda ninguna ficha en casa, el 6 vale 7. ¡El tercer 6 seguido manda a casa la última ficha que has movido!', 'Amb un 6 tornes a tirar. Si ja no et queda cap fitxa a casa, el 6 val 7. El tercer 6 seguit envia a casa l’última fitxa que has mogut!', 'A 6 lets you roll again. If none of your tokens are at home, a 6 counts as 7. A third 6 in a row sends your last moved token home!')),
    R('🍪', L('Comer', 'Menjar', 'Capture'), L('Si caes donde hay una ficha de otro color, te la comes (vuelve a su casa) y cuentas 20 con la ficha que quieras. En las casillas seguras ❄️ no se come.', 'Si caus on hi ha una fitxa d’un altre color, te la menges (torna a casa seva) i en comptes 20 amb la fitxa que vulguis. A les caselles segures ❄️ no es menja.', 'Land on another colour’s token to capture it (it goes home) and move 20 with any token. No captures on the safe ❄️ squares.')),
    R('🧱', L('Barrera', 'Barrera', 'Blockade'), L('Dos fichas del mismo color en la misma casilla hacen barrera: nadie puede pasar. En una casilla caben 2 fichas como mucho.', 'Dues fitxes del mateix color a la mateixa casella fan barrera: ningú no pot passar. A una casella hi caben 2 fitxes com a màxim.', 'Two tokens of the same colour on one square make a blockade: nobody can pass. A square holds 2 tokens at most.')),
    R('🏠', L('Llegar a casa', 'Arribar a casa', 'Getting home'), L('Al final das la vuelta por tu pasillo de color hasta el árbol del centro. Hay que llegar justo. Cada ficha que llega: cuentas 10.', 'Al final fas el teu passadís de color fins a l’arbre del centre. Cal arribar-hi just. Cada fitxa que arriba: en comptes 10.', 'At the end, go up your coloured lane to the tree in the middle. You must land exactly. Each token home: move 10.')),
    R('⏱', L('Tiempo', 'Temps', 'Time'), L('En línea: si alguien no tira en 2 minutos, su ficha se mueve sola. Si no vuelve en 5 minutos, queda fuera de la partida.', 'En línia: si algú no tira en 2 minuts, la seva fitxa es mou sola. Si no torna en 5 minuts, queda fora de la partida.', 'Online: if someone doesn’t play within 2 minutes, their token moves by itself. After 5 minutes away, they’re out.')),
    el('div', { class: 'oca-pts' }, el('b', {}, '⭐ ' + L('Puntos (en línea)', 'Punts (en línia)', 'Points (online)')),
      el('small', {}, L('El 1.º gana tantos puntos como jugadores hay (4 si sois 4), el 2.º uno menos… y el último 1. Quien abandona o no acaba la partida: −1. Cuenta en el Marcador de Navidad (hasta 5 partidas al día) y en el juego de los gnomos (su primera partida). Contra Papá Noel: acabar suma como los otros juegos.',
        'El 1r guanya tants punts com jugadors hi ha (4 si sou 4), el 2n un menys… i l’últim 1. Qui abandona o no acaba la partida: −1. Compta al Marcador de Nadal (fins a 5 partides al dia) i al joc dels gnoms (la seva primera partida). Contra el Pare Noel: acabar suma com els altres jocs.',
        'The winner gets as many points as there are players (4 if four), 2nd one less… and last 1. Leaving or not finishing: −1. Counts for the Christmas scoreboard (up to 5 games a day) and the gnome game (their first game). Against Santa: finishing scores like other games.'))),
    el('div', { class: 'cc8-endbtns' }, el('button', { type: 'button', class: 'btn btn-big no-delay', onclick: () => box.remove() }, '🎲 ' + L('¡Entendido!', 'Entesos!', 'Got it!')))));
  host.append(box);
}

// ---------------------------------------------------------------- la ventana del juego
const myUid = () => S.user?.uid || '';
const myName = () => ((S.profile?.who || S.profile?.name || L('Tú', 'Tu', 'You')) + '').trim().split(' ')[0];
let OPEN = null; // la partida abierta (para no abrir dos)
export const parchisOpen = () => !!OPEN;

export async function openParchis(ctx, { mode = 'solo', join = null } = {}) {
  if (OPEN) return;
  preloadVoice(getLang());
  const W = buildShell(ctx);
  OPEN = W;
  if (mode === 'solo') soloSetup(W);
  else onlineLobby(W, join);
}

function buildShell(ctx) {
  let alive = true;
  const timeEl = el('b', {}, '0:00');
  const die = el('div', { class: 'oca-die' });
  const hole = el('button', { type: 'button', class: 'oca-hole no-delay', 'aria-label': 'dado' }, die);
  const dieHint = el('div', { class: 'oca-diehint' });
  const top = el('div', { class: 'oca-top' },
    el('div', { class: 'oca-side oca-timer' }, el('span', {}, '⏱'), timeEl),
    el('div', { class: 'oca-diebox' }, hole, dieHint),
    el('button', { type: 'button', class: 'oca-side no-delay', onclick: () => showRules() }, el('span', {}, '📜'), el('small', {}, L('Reglas', 'Regles', 'Rules'))));
  const players = el('div', { class: 'pch-players' });
  const board = el('div', { class: 'pch-board' });
  const msg = el('div', { class: 'oca-msg' });
  const xBtn = el('button', { type: 'button', class: 'cc8-x no-delay' }, '✕');
  const wrap = el('div', { class: 'oca-wrap pch-wrap' },
    el('div', { class: 'oca-snow' }),
    el('div', { class: 'oca-head' }, xBtn, el('div', { class: 'oca-title' }, L('El parchís de Navidad', 'El parxís de Nadal', 'Christmas ludo'))),
    top, players, el('div', { class: 'oca-stage' }, board, msg));
  document.body.append(wrap);
  document.documentElement.classList.add('gm-lock');
  const W = { ctx, wrap, board, hole, die, dieHint, timeEl, players, msg, xBtn, top, cells: {}, toks: {}, alive: true, cleanups: [] };
  W.close = () => { if (!W.alive) return; W.alive = false; W.cleanups.forEach(f => { try { f(); } catch {} }); wrap.classList.add('out'); document.documentElement.classList.remove('gm-lock'); setTimeout(() => wrap.remove(), 350); OPEN = null; };
  xBtn.onclick = () => (W.onX ? W.onX() : W.close());
  drawBoard(W);
  const onR = () => layout(W); addEventListener('resize', onR); W.cleanups.push(() => removeEventListener('resize', onR));
  // dado
  const PIPS = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
  W.face = n => { rc(die, ...Array.from({ length: 9 }, (_, i) => el('i', { class: PIPS[n].includes(i + 1) ? 'on' : '' }))); };
  W.face(1);
  let spinIv = 0;
  W.spin = () => { clearInterval(spinIv); hole.classList.add('spin'); let last = 1; spinIv = setInterval(() => { let n; do { n = 1 + Math.floor(Math.random() * 6); } while (n === last); last = n; W.face(n); clickSound(); }, 85); };
  W.land = n => { clearInterval(spinIv); hole.classList.remove('spin'); W.face(n); hole.classList.add('land'); setTimeout(() => hole.classList.remove('land'), 500); pop(); };
  W.cleanups.push(() => clearInterval(spinIv));
  // el jugador tira: primer toque gira, segundo para
  W.humanRoll = () => new Promise(res => {
    let spinning = false; hole.classList.add('ready'); dieHint.textContent = L('¡Toca el dado!', 'Toca el dau!', 'Tap the dice!');
    W.rollCancel = () => { hole.onclick = null; hole.classList.remove('ready'); dieHint.textContent = ''; res(0); };
    hole.onclick = () => {
      unlockAudio();
      if (!spinning) { spinning = true; W.spin(); dieHint.textContent = L('¡Toca para parar!', 'Toca per parar!', 'Tap to stop!'); return; }
      hole.onclick = null; W.rollCancel = null; hole.classList.remove('ready'); dieHint.textContent = '';
      const n = 1 + Math.floor(Math.random() * 6); W.land(n); res(n);
    };
  });
  let msgT = 0;
  W.say = async (txt, kind = '', vkey = '') => {
    rc(msg, el('span', {}, txt)); msg.className = 'oca-msg on ' + kind; clearTimeout(msgT);
    msgT = setTimeout(() => msg.classList.remove('on'), 2400);
    if (vkey) { try { await sayVoice(vkey, getLang(), txt.replace(/[!¡]/g, '')); } catch {} clearTimeout(msgT); msgT = setTimeout(() => msg.classList.remove('on'), 600); }
  };
  W.t0 = 0; const tIv = setInterval(() => { if (W.t0) timeEl.textContent = fmt((Date.now() - W.t0) / 1000); }, 500); W.cleanups.push(() => clearInterval(tIv));
  return W;
}
const fmt = s => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };

// ---- lo que se dice al comer o llegar (V26.3: y si no se puede contar, también se dice)
async function sayFx(W, fx, talk) {
  if (!fx) return;
  if (fx.startsWith('cap')) { chime(); await W.say(L('¡Te como, y cuento veinte!', 'Et menjo, i en compto vint!', 'Got you! I count twenty!'), 'goose', talk ? 'pcap' : ''); }
  else if (fx.startsWith('meta') || fx === 'done') { chime(); await W.say(L('¡Llego a casa, y cuento diez!', 'Arribo a casa, i en compto deu!', 'Home safe! I count ten!'), 'goose', talk ? 'pmeta' : ''); }
  if (fx.endsWith('x')) await W.say('🚫 ' + L('…pero no puedo avanzar con ninguna ficha', '…però no puc avançar amb cap fitxa', '…but I can’t move any token'), 'warn', talk ? 'pnomove' : '');
}
// ---- dibujar el tablero (cuadrícula 19×19)
function drawBoard(W) {
  const { board, cells } = W;
  const at = (c, r, cls, k, inner = null) => { const d = el('div', { class: 'pch-cell ' + cls, style: `--x:${c};--y:${r}`, 'data-k': k }, inner); cells[k] = d; board.append(d); return d; };
  // casas (esquinas) con su dibujo de Navidad
  const HOMEIMG = { y: 'ilu-estrella.webp', b: 'ilu-gl.webp', r: 'ilu-gorro.webp', g: 'ilu-arbolito.webp' };
  const HC = { y: [11, 11], b: [11, 0], r: [0, 0], g: [0, 11] };
  COLORS.forEach(c => {
    const [x, y] = HC[c];
    const h = el('div', { class: 'pch-home pc-' + c, style: `--x:${x};--y:${y}`, 'data-k': 'h' + c },
      el('div', { class: 'pch-home-in' }, el('img', { src: HOMEIMG[c], alt: '' }), ...[0, 1, 2, 3].map(i => el('i', { class: 'pch-nest', style: `--i:${i}` }))),
      el('b', { class: 'pch-home-name' }));
    cells['h' + c] = h; board.append(h);
  });
  TRACK.forEach(([c, r], i) => {
    const sal = Object.entries(SAL).find(([, v]) => v === i)?.[0];
    const tip = TIPS.indexOf(i);
    const cls = 'track' + (SAFE.has(i) ? ' safe' : '') + (sal ? ' sal pc-' + sal : '') + (tip >= 0 ? ' tip' : '') + (vertical([c, r]) ? ' v' : ' h');
    at(c, r, cls, 't' + i, SAFE.has(i) ? el('span', { class: 'pch-safe' }, sal ? '★' : '❄') : null);
  });
  COLORS.forEach(c => { for (let k = 0; k < 7; k++) { const [x, y] = CORR[c](k); at(x, y, 'corr pc-' + c + (ARM[c] % 2 ? ' h' : ' v'), 'c' + c + k); } });
  // el centro: cuatro triángulos de colores y el árbol de Navidad
  const mid = el('div', { class: 'pch-mid' },
    ...COLORS.map(c => el('div', { class: 'pch-tri pc-' + c, 'data-k': 'm' + c })),
    el('img', { class: 'pch-midtree', src: 'arbol8.webp', alt: '' }));
  COLORS.forEach(c => { cells['m' + c] = mid.querySelector(`[data-k="m${c}"]`); });
  board.append(mid);
}
function layout(W) {
  const w = Math.min(innerWidth * .97, innerHeight * .6, 680);
  W.board.style.width = W.board.style.height = w + 'px';
  W.u = w / 19;
  requestAnimationFrame(() => placeAll(W));
}
// punto (en unidades de casilla) donde va cada ficha
function spot(W, c, i) {
  const G = W.G, p = G.tok[c][i];
  if (p === -1) { const [x, y] = HOMEC[c]; const o = [[-1.95, -1.95], [1.95, -1.95], [-1.95, 1.95], [1.95, 1.95]][i]; return [x + o[0], y + o[1]]; }
  if (p === 71) { const [x, y] = METAC[c], d = (i - 1.5) * .5; return ARM[c] % 2 ? [x, y + d] : [x + d, y]; }
  const k = keyOf(c, p), here = occ(G, k), idx = here.findIndex(o => o.c === c && o.i === i);
  const [cx, cy] = p <= 63 ? TRACK[absOf(c, p)] : CORR[c](p - 64);
  let x = cx + .5, y = cy + .5;
  if (here.length > 1) { const d = idx === 0 ? -.24 : .24; if (vertical([cx, cy])) x += d; else y += d; }
  return [x, y];
}
const px = (W, [x, y]) => ({ x: x * W.u, y: y * W.u });
function tokEl(W, c, i) {
  const k = c + i;
  if (!W.toks[k]) {
    const t = el('div', { class: 'tk3 pch-tok pc-' + c, style: `--tk:${CHEX[c]}` }, el('i', { class: 'tk3-shadow' }), el('div', { class: 'pch-pawn', html: pawnSvg(c) }));
    W.toks[k] = t; W.board.append(t);
  }
  return W.toks[k];
}
function setTok(W, c, i, pt) { const t = tokEl(W, c, i); t.style.transform = `translate(${pt.x}px, ${pt.y}px) translate(-50%, -62%)`; }
function placeAll(W, skip = null) {
  if (!W.G || !W.u) return;
  COLORS.forEach(c => W.G.tok[c].forEach((p, i) => {
    const t = W.toks[c + i];
    if (p === -2) { if (t) t.style.display = 'none'; return; }
    if (skip && skip.c === c && skip.i === i) return;
    tokEl(W, c, i).style.display = ''; setTok(W, c, i, px(W, spot(W, c, i)));
  }));
}
// animar una ficha casilla a casilla (lo que hacen los demás)
async function walkTok(W, c, i, path, to) {
  const t = tokEl(W, c, i);
  for (const k of path) {
    if (!W.alive) return;
    let pt;
    if (k[0] === 't') { const [x, y] = TRACK[+k.slice(1)]; pt = { x: (x + .5) * W.u, y: (y + .5) * W.u }; }
    else if (k[0] === 'c') { const [x, y] = CORR[k[1]](+k.slice(2)); pt = { x: (x + .5) * W.u, y: (y + .5) * W.u }; }
    else { const [x, y] = METAC[k[1]]; pt = { x: x * W.u, y: y * W.u }; }
    t.style.transform = `translate(${pt.x}px, ${pt.y}px) translate(-50%, -62%)`;
    W.cells[k]?.classList.add('tk-lit'); setTimeout(() => W.cells[k]?.classList.remove('tk-lit'), 500);
    clickSound(); await sleep(150);
  }
  t.classList.add('tk-snap'); snapSound(); setTimeout(() => t.classList.remove('tk-snap'), 450);
}
async function flyHome(W, c, i) { const t = tokEl(W, c, i); t.classList.add('pch-fly'); placeAll(W); await sleep(650); t.classList.remove('pch-fly'); }
const cellAt = (x, y) => { const c = document.elementsFromPoint(x, y).find(e => e.dataset?.k && (e.classList.contains('pch-cell') || e.classList.contains('pch-tri') || e.classList.contains('pch-home'))); return c ? c.dataset.k : null; };

// el jugador mueve: puede coger cualquiera de sus fichas que se puedan mover
async function humanMove(W, moves) {
  const c = moves[0].c;
  W.dieHint.textContent = '👆 ' + L('Coge una ficha que salta y llévala a la casilla que brilla', 'Agafa una fitxa que salta i porta-la a la casella que brilla', 'Pick a hopping token and drag it to the glowing square');
  const cancels = moves.map(() => ({}));
  W.moveCancel = () => cancels.forEach(x => x.fn?.());
  const results = moves.map((mv, j) => {
    const t = tokEl(W, c, mv.i);
    return dragToken({ tok: t, layer: W.board, path: mv.path, targetOnLift: true, cellEl: k => W.cells[k], cellAt,
      center: k => { const [x, y] = k[0] === 'm' ? METAC[k[1]] : k[0] === 't' ? TRACK[+k.slice(1)].map(v => v + .5) : CORR[k[1]](+k.slice(2)).map(v => v + .5); return { x: x * W.u, y: y * W.u }; },
      size: W.u * 1.6, home: () => px(W, spot(W, c, mv.i)), cancel: cancels[j],
      onLift: () => cancels.forEach((x, q) => { if (q !== j) moves[q] && tokEl(W, c, moves[q].i).classList.remove('tk-can'); }),
      onMiss: () => { moves.forEach(m => tokEl(W, c, m.i).classList.add('tk-can')); W.dieHint.classList.remove('nudge'); void W.dieHint.offsetWidth; W.dieHint.classList.add('nudge'); } })
      .then(ok => ({ ok, mv }));
  });
  // la primera ficha que se deja bien es la buena
  const r = await new Promise(res => { results.forEach(p => p.then(x => { if (x.ok) res(x.mv); })); Promise.all(results).then(xs => { if (!xs.some(x => x.ok)) res(null); }); });
  cancels.forEach(x => x.fn?.());
  W.moveCancel = null; W.dieHint.textContent = '';
  return r;
}
function paintPlayers(W, info) {
  const G = W.G;
  rc(W.players, ...G.order.map(c => {
    const p = info[c] || {};
    const place = G.fin.indexOf(c);
    return el('div', { class: 'pch-pl pc-' + c + (G.turn === c && G.status === 'play' ? ' now' : '') + (G.out.includes(c) ? ' gone' : ''), style: `--tk:${CHEX[c]}` },
      el('span', { class: 'pch-dot', html: pawnSvg(c) }),
      p.img ? el('img', { src: p.img, alt: '' }) : null,
      el('b', {}, p.name || CNAME[c]()),
      place >= 0 ? el('em', {}, ['🥇', '🥈', '🥉', '4️⃣'][place]) : G.out.includes(c) ? el('em', {}, '🚪') : null,
      G.turn === c && G.status === 'play' && W.turnLeft != null ? el('small', { class: 'pch-clock' }, '⏳ ' + fmt(W.turnLeft)) : null);
  }));
  COLORS.forEach(c => { const n = W.cells['h' + c]?.querySelector('.pch-home-name'); if (n) n.textContent = G.order.includes(c) ? (info[c]?.name || '') : ''; });
}

// ---------------------------------------------------------------- SOLO contra Papá Noel
function soloSetup(W) {
  let myC = 'y', n = 1;
  const card = el('div', { class: 'cc8-endcard oca-mode pch-setup' });
  const box = el('div', { class: 'cc8-end' }, card);
  const draw = () => rc(card, 
    el('h2', {}, '🎅 ' + L('Contra Papá Noel', 'Contra el Pare Noel', 'Against Santa')),
    el('p', {}, L('Elige tu color:', 'Tria el teu color:', 'Choose your colour:')),
    el('div', { class: 'pch-colpick' }, ...COLORS.map(c => el('button', { type: 'button', class: 'pch-colbtn no-delay' + (c === myC ? ' on' : ''), style: `--tk:${CHEX[c]}`, onclick: () => { myC = c; draw(); } }, el('span', { html: pawnSvg(c) }), el('small', {}, CNAME[c]())))),
    el('p', {}, L('¿Contra cuántos Papás Noel?', 'Contra quants Pares Noel?', 'Against how many Santas?')),
    el('div', { class: 'pch-colpick' }, ...[1, 2, 3].map(k => el('button', { type: 'button', class: 'pch-numbtn no-delay' + (k === n ? ' on' : ''), onclick: () => { n = k; draw(); } }, '🎅'.repeat(k)))),
    el('div', { class: 'cc8-endbtns' }, el('button', { type: 'button', class: 'btn btn-big no-delay', onclick: () => { box.remove(); soloPlay(W, myC, n); } }, '🎲 ' + L('¡A jugar!', 'A jugar!', 'Let’s play!')),
      el('button', { type: 'button', class: 'btn btn-ghost no-delay', onclick: () => W.close() }, '⏰ ' + L('Lo haré más tarde', 'Ho faré més tard', 'Later'))));
  draw(); W.wrap.append(box);
  layout(W);
  W.G = newGame(COLORS); W.G.order.forEach(c => { W.G.tok[c] = [-1, -1, -1, -1]; }); placeAll(W);
}
async function soloPlay(W, myC, nCpu) {
  // los rivales: los colores siguientes al tuyo
  const k = COLORS.indexOf(myC), order = [myC];
  if (nCpu === 1) order.push(COLORS[(k + 2) % 4]); else for (let j = 1; j <= nCpu; j++) order.push(COLORS[(k + j) % 4]);
  const ord = COLORS.filter(c => order.includes(c));
  const G = W.G = newGame(ord, { solo: true, me: myC }); G.turn = myC;
  Object.values(W.toks).forEach(t => t.style.display = 'none');
  const info = {}; ord.forEach(c => { info[c] = c === myC ? { name: myName(), img: FIG[figure()] } : { name: L('Papá Noel', 'Pare Noel', 'Santa'), img: 'santa11.webp' }; });
  layout(W); paintPlayers(W, info); W.t0 = Date.now();
  W.onX = () => W.close();
  while (W.alive && G.status === 'play') {
    const c = G.turn, cpu = c !== myC;
    paintPlayers(W, info);
    if (G.ph === 'roll') {
      let n;
      if (cpu) { await sleep(600); W.spin(); await sleep(900); n = 1 + Math.floor(Math.random() * 6); W.land(n); }
      else { n = await W.humanRoll(); if (!n) return; }
      await sleep(350);
      const r = applyRoll(G, n);
      if (r.k === 'three6') { await W.say('6️⃣6️⃣6️⃣ ' + L('¡Tres seises! La última ficha vuelve a casa', 'Tres sisos! L’última fitxa torna a casa', 'Three sixes! Last token goes home'), 'bad'); sadTrombone(); placeAll(W); await sleep(1300); continue; }
      if (r.k === 'none' || r.k === 'none6') { W.say((cpu ? '🎅 ' : '') + L('No se puede mover', 'No es pot moure', 'No move possible'), 'warn'); await sleep(1300); continue; }
      if (n === 6) W.say(L('¡Seis! Vuelve a tirar después.', 'Sis! Després torna a tirar.', 'Six! Roll again afterwards.'), 'goose');
    }
    const moves = legal(G, c, G.steps, G.ph === 'bonus');
    if (!moves.length) { nextTurn(G); continue; }
    if (G.ph === 'bonus') W.say(`🎁 ${L('Cuenta', 'Compta', 'Move')} ${G.bonus}!`, 'goose');
    let mv;
    if (cpu) { await sleep(500); mv = bestMove(moves); placeAll(W, mv); await walkTok(W, c, mv.i, mv.path); }
    else { mv = await humanMove(W, moves); if (!mv) return; }
    const fx = applyMove(G, mv);
    if (mv.cap) await flyHome(W, mv.cap.c, mv.cap.i);
    placeAll(W);
    await sayFx(W, fx, true);
    await sleep(cpu ? 300 : 150);
  }
  if (!W.alive) return;
  // final: has llegado (en solo, la partida se acaba cuando llegas tú)
  const secs = (Date.now() - W.t0) / 1000; W.t0 = 0;
  const place = G.fin.indexOf(myC) + 1;
  try { W.ctx?.won?.(); } catch {} // ⭐ cuenta como acabar el juego (+2 la 1.ª vez, +1 las siguientes)
  if (!W.ctx?.prev) { try { W.ctx?.submit?.({ answer: `🎲 ${['🥇', '🥈', '🥉', '4️⃣'][place - 1] || ''} ${fmt(secs)}`, status: 'correct' }); } catch {} }
  const again = el('button', { type: 'button', class: 'btn btn-big no-delay' }, '🔄 ' + L('Jugar otra vez', 'Tornar a jugar', 'Play again'));
  const out = el('button', { type: 'button', class: 'btn btn-ghost btn-big no-delay', onclick: () => W.close() }, '🎄 ' + L('Salir', 'Sortir', 'Exit'));
  const fx = await bigCongrats(W.wrap, { title: L('¡Felicidades!', 'Felicitats!', 'Congratulations!'),
    sub: place === 1 ? L('¡Has ganado a Papá Noel!', 'Has guanyat el Pare Noel!', 'You beat Santa!') : L(`¡Has llegado a casa! Puesto ${place}`, `Has arribat a casa! Posició ${place}`, `You made it home! Place ${place}`),
    img: FIG[figure()], lines: ['⏱ ' + fmt(secs)], buttons: [again, out] });
  if (place === 1) sayVoice('pwin', getLang()).catch(() => {});
  again.onclick = () => { fx.close(); W.close(); setTimeout(() => openParchis(W.ctx, { mode: 'solo' }), 400); };
}

// ---------------------------------------------------------------- EN LÍNEA
// pgame/{gid}: { host, status: lobby|play|end|cancel, pl: { uid: { n, f, c, st: inv|ok|no|left, seen } }, created, startAt, v, tt, ev, G… }
const TURN_MS = 120000, AWAY_MS = 300000;
const newGid = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const CUR = 'adv_pch_cur';

async function onlineLobby(W, join) {
  layout(W);
  W.G = newGame(COLORS); placeAll(W);
  const me = myUid();
  let gid = join;
  if (!gid) { // nueva partida: yo invito
    gid = newGid();
    const free = 'y';
    await store.gPut('pgame', gid, { gid, host: me, hostName: myName(), status: 'lobby', created: Date.now(), v: 0,
      pl: { [me]: { n: myName(), f: figure(), c: free, st: 'ok', seen: Date.now() } } });
  }
  try { localStorage.setItem(CUR, gid); } catch {}
  W.gid = gid;
  const lobby = el('div', { class: 'cc8-endcard pch-lobby' });
  const box = el('div', { class: 'cc8-end pch-lobby-back' }, lobby);
  W.wrap.append(box);
  let doc = null, started = false, people = [], onlineMap = {}, showPeople = true, query = '', closing = false;
  // (V26.1) salir siempre se puede: del vestíbulo se sale enseguida («lo haré más tarde»)
  const leaveLobby = async (thenSolo = false) => {
    if (closing) return; closing = true;
    const d = doc;
    try { localStorage.removeItem(CUR); } catch {}
    if (d?.status === 'lobby') {
      if (d.host === me) {
        store.gTx('pgame', gid, x => x && x.status === 'lobby' ? { ...x, status: 'cancel', v: (x.v || 0) + 1 } : null).catch(() => {});
        clearGameMsgs(gid, Object.keys(d.pl || {}));
      } else {
        store.gPatch('pgame', gid, { [`pl.${me}.st`]: 'no' }).catch(() => {});
        if (d.host) sendMsg({ gid, to: d.host, tn: d.hostName, k: 'no', txt: L('Lo haré más tarde', 'Ho faré més tard', 'Maybe later') }).catch(() => {});
      }
    }
    W.close();
    if (thenSolo) setTimeout(() => openParchis(W.ctx, { mode: 'solo' }), 400);
  };
  W.canLeaveQuiet = () => !doc || doc.status !== 'play';
  W.isHostLobby = () => doc?.status === 'lobby' && doc.host === me;
  W.hasInvited = u => ['inv', 'ok'].includes(doc?.pl?.[u]?.st);
  W.leaveQuiet = () => leaveLobby();
  W.onX = async () => {
    if (doc?.status === 'play' && doc.pl?.[me]?.st === 'ok' && !doc.G?.fin?.includes(doc.pl[me].c)) {
      const go = await popup(`<h2>🚪</h2><p style="font-size:18px">${L('Si sales ahora, quedas fuera de la partida y pierdes 1 punto. ¿Seguro?', 'Si surts ara, quedes fora de la partida i perds 1 punt. Segur?', 'If you leave now you are out of the game and lose 1 point. Sure?')}</p>`,
        { cls: 'pch-xmas', buttons: [{ label: L('Seguir jugando', 'Continuar jugant', 'Keep playing'), value: false }, { label: L('Salir', 'Sortir', 'Leave'), value: true, cls: 'btn-ghost' }] });
      if (!go) return;
      leaveGame(gid, me, true);
      W.close(); return;
    }
    if (doc?.status === 'lobby' || !doc) return leaveLobby();
    W.close();
  };
  // todas las personas apuntadas (con verde si tienen la app abierta ahora)
  const isOn = o => !!o && o.st === 'online' && Date.now() - (o.at || 0) < 150000;
  const loadPeople = async () => {
    const [names, onl] = await Promise.all([store.gList('names').catch(() => []), store.gList('online').catch(() => [])]);
    onlineMap = {}; onl.forEach(o => { if (o?.uid) onlineMap[o.uid] = o; });
    const m = new Map();
    names.forEach(nm => { if (nm?.uid && nm.uid !== me && !m.has(nm.uid)) m.set(nm.uid, { uid: nm.uid, n: onlineMap[nm.uid]?.n || nm.name || '—' }); });
    onl.forEach(o => { if (o?.uid && o.uid !== me && !m.has(o.uid)) m.set(o.uid, { uid: o.uid, n: o.n || '—' }); });
    people = [...m.values()].map(p => ({ ...p, f: onlineMap[p.uid]?.f || 'galleta', on: isOn(onlineMap[p.uid]) }))
      .sort((a, b) => (b.on - a.on) || String(a.n).localeCompare(String(b.n)));
    drawLobby();
  };
  loadPeople(); const oIv = setInterval(loadPeople, 10000); W.cleanups.push(() => clearInterval(oIv));
  W.cleanups.push(onBox(() => drawLobby()));
  // el buscador se crea una vez (así no se pierde lo que escribes)
  const search = el('input', { type: 'search', class: 'pch-search', placeholder: '🔍 ' + L('Buscar…', 'Cercar…', 'Search…'), oninput: e => { query = e.target.value; drawPeople(); } });
  const peopleList = el('div', { class: 'pch-on-list' });
  const STEP = (n, t) => el('h3', { class: 'pch-step' }, el('span', { class: 'pch-step-n' }, n), t);
  const lastMsgFrom = u => boxList().find(m => m.gid === gid && m.from === u);
  function drawPeople() {
    if (!doc) return;
    const pls = doc.pl || {};
    const busy = Object.values(pls).filter(p => p.st === 'ok' || p.st === 'inv').length;
    const qn = query.trim().toLowerCase();
    const list = people.filter(p => !qn || String(p.n).toLowerCase().includes(qn));
    rc(peopleList, ...(list.length ? list.map(p => {
      const st = pls[p.uid]?.st;
      const btn = st === 'ok' ? el('span', { class: 'pch-tag ok' }, '✅ ' + L('juega', 'juga', 'playing'))
        : st === 'inv' ? el('span', { class: 'pch-tag inv' }, '✉️ ' + L('invitado', 'convidat', 'invited'))
        : p.on ? el('button', { type: 'button', class: 'pch-go no-delay', disabled: busy >= 4, onclick: () => invite(p) }, '▶ ' + L('Invitar', 'Convidar', 'Invite'))
        : el('span', { class: 'pch-go off' }, L('Fuera de línea', 'Fora de línia', 'Offline'));
      return el('div', { class: 'pch-on-row' + (p.on ? ' on' : '') },
        el('i', { class: 'pch-on-dot' + (p.on ? ' on' : '') }), el('img', { src: FIG[p.f] || FIG.galleta, alt: '' }), el('b', {}, p.n), btn);
    }) : [el('p', { class: 'muted' }, people.length ? L('No hay nadie con ese nombre', 'No hi ha ningú amb aquest nom', 'Nobody with that name') : L('Aún no hay nadie más apuntado', 'Encara no hi ha ningú més apuntat', 'Nobody else has joined yet'))]));
  }
  const drawLobby = () => {
    if (!doc || doc.status !== 'lobby') return;
    const host = doc.host === me, pls = Object.entries(doc.pl || {});
    const ok = pls.filter(([, p]) => p.st === 'ok');
    const ready = ok.filter(([, p]) => p.c).length;
    const used = new Set(ok.map(([, p]) => p.c).filter(Boolean));
    const mine = doc.pl?.[me];
    const stTxt = p => p.st === 'ok' ? (p.c ? '✅ ' + CNAME[p.c]() : '🎨 ' + L('eligiendo color…', 'triant color…', 'choosing colour…')) : p.st === 'inv' ? '✉️ ' + L('esperando respuesta…', 'esperant resposta…', 'waiting for an answer…') : p.st === 'no' ? '🙅 ' + L('ahora no', 'ara no', 'not now') : '';
    const nOn = people.filter(p => p.on).length, un = unread();
    let n = 0;
    rc(lobby, 
      el('h2', {}, '🌐 ' + L('Partida en línea', 'Partida en línia', 'Online game')),
      host ? null : el('p', { class: 'pch-wait' }, '⏳ ' + L(`Esperando a que ${doc.hostName || ''} empiece la partida…`, `Esperant que ${doc.hostName || ''} comenci la partida…`, `Waiting for ${doc.hostName || ''} to start…`)),
      // 1 · mi color
      mine?.st === 'ok' ? el('div', { class: 'pch-sec' }, STEP(++n, L('Elige tu color', 'Tria el teu color', 'Choose your colour')),
        el('div', { class: 'pch-colpick' }, ...COLORS.map(c => el('button', { type: 'button', class: 'pch-colbtn no-delay' + (mine.c === c ? ' on' : ''), disabled: used.has(c) && mine.c !== c, style: `--tk:${CHEX[c]}`,
          onclick: () => pickColor(c) }, el('span', { html: pawnSvg(c) }), el('small', {}, CNAME[c]()))))) : null,
      // 2 · con quién (solo quien organiza)
      host ? el('div', { class: 'pch-sec' }, STEP(++n, L('¿Con quién juegas?', 'Amb qui jugues?', 'Who are you playing with?')),
        el('button', { type: 'button', class: 'pch-drop no-delay' + (showPeople ? ' open' : ''), onclick: () => { showPeople = !showPeople; drawLobby(); } },
          '👥 ' + L('Personas', 'Persones', 'People') + ` · 🟢 ${nOn} ` + L('en línea', 'en línia', 'online'), el('span', {}, showPeople ? '▲' : '▼')),
        showPeople ? el('div', { class: 'pch-drop-in' }, people.length > 4 ? search : null, peopleList) : null,
        el('small', { class: 'muted' }, L('🟢 = tiene la app abierta: toca ▶ para invitarle. ⚪ = fuera de línea.', '🟢 = té l’app oberta: toca ▶ per convidar-lo. ⚪ = fora de línia.', '🟢 = app open: tap ▶ to invite. ⚪ = offline.'))) : null,
      // 3 · quién juega
      el('div', { class: 'pch-sec' }, STEP(++n, L('Jugadores de la partida', 'Jugadors de la partida', 'Players in this game')),
        el('div', { class: 'pch-lob-list' }, ...pls.filter(([, p]) => p.st !== 'no' || host).map(([u, p]) => {
          const lm = u !== me ? lastMsgFrom(u) : null;
          return el('div', { class: 'pch-lob-row' + (p.c ? ' pc-' + p.c : ''), style: p.c ? `--tk:${CHEX[p.c]}` : '' },
            p.c ? el('span', { class: 'pch-dot', html: pawnSvg(p.c) }) : el('span', { class: 'pch-dot' }, p.st === 'no' ? '🙅' : '⏳'),
            el('img', { src: FIG[p.f] || FIG.galleta, alt: '' }),
            el('div', { class: 'pch-lob-who' }, el('b', {}, p.n + (u === me ? ' (' + L('tú', 'tu', 'you') + ')' : '')), el('small', {}, stTxt(p)),
              lm?.txt ? el('em', { class: 'pch-lob-msg' }, '💬 ' + lm.txt) : null));
        }))),
      host ? el('button', { type: 'button', class: 'btn btn-big pch-start no-delay', disabled: ready < 2, onclick: startGame }, '⏱ ' + L('¡Empezamos!', 'Comencem!', 'Start!')) : null,
      host && ready < 2 ? el('small', { class: 'muted pch-hint' }, L('Cuando haya al menos 2 jugadores con color, se enciende «¡Empezamos!».', 'Quan hi hagi almenys 2 jugadors amb color, s’encén «Comencem!».', '«Start!» lights up when at least 2 players have a colour.')) : null,
      el('div', { class: 'pch-lob-btns' },
        el('button', { type: 'button', class: 'btn no-delay pch-msgbtn' + (un ? ' new' : ''), onclick: () => openInbox() }, '💬 ' + L('Mensajes', 'Missatges', 'Messages'), un ? el('i', { class: 'pch-badge' }, un) : null),
        el('button', { type: 'button', class: 'btn no-delay', onclick: () => showRules() }, '📜 ' + L('Reglas', 'Regles', 'Rules')),
        el('button', { type: 'button', class: 'btn no-delay pch-santa', onclick: () => leaveLobby(true) }, '🎅 ' + L('Jugar contra Papá Noel', 'Jugar contra el Pare Noel', 'Play against Santa')),
        el('button', { type: 'button', class: 'btn btn-ghost no-delay', onclick: () => leaveLobby() }, '⏰ ' + L('Lo haré más tarde', 'Ho faré més tard', 'Later'))));
    if (host && showPeople) drawPeople();
  };
  const pickColor = c => store.gTx('pgame', gid, d => {
    if (!d || d.status !== 'lobby' || !d.pl?.[me]) return null;
    if (Object.entries(d.pl).some(([u, p]) => u !== me && p.st === 'ok' && p.c === c)) return null;
    return { ...d, pl: { ...d.pl, [me]: { ...d.pl[me], c } }, v: (d.v || 0) + 1 };
  }).then(ok => { if (!ok) toast('🎨 ' + L('Ese color ya lo tiene otra persona', 'Aquest color ja el té una altra persona', 'That colour is taken')); }).catch(e => toast('⚠️ ' + e.message));
  const invite = async o => {
    // se puede enviar con el mensaje de la app o escribir uno propio
    const ta = el('textarea', { class: 'pch-msg-in', rows: 3, maxlength: 200, placeholder: L('Escribe tu mensaje (opcional)…', 'Escriu el teu missatge (opcional)…', 'Write your message (optional)…') });
    const how = await popup(el('div', { class: 'pch-invbox' },
      el('h2', {}, '✉️ ' + L(`Invitar a ${o.n}`, `Convidar ${o.n}`, `Invite ${o.n}`)),
      el('p', {}, L('¿Cómo quieres invitar?', 'Com vols convidar?', 'How do you want to invite?')),
      el('p', { class: 'muted pch-appmsg' }, '🎲 «' + L(`${myName()} quiere jugar contigo al parchís. ¿Juegas?`, `${myName()} vol jugar amb tu al parxís. Hi jugues?`, `${myName()} wants to play ludo with you. Will you play?`) + '»'),
      ta),
      { cls: 'pch-xmas', buttons: [{ label: '🎲 ' + L('Mensaje de la app', 'Missatge de l’app', 'App message'), value: 'app' }, { label: '✍️ ' + L('Enviar mi mensaje', 'Enviar el meu missatge', 'Send my message'), value: 'mine' }, { label: L('Cancelar', 'Cancel·lar', 'Cancel'), value: null, cls: 'btn-ghost' }] });
    if (!how) return;
    const msgTxt = how === 'mine' ? ta.value.trim().slice(0, 200) : '';
    try {
      await store.gTx('pgame', gid, d => d && d.status === 'lobby' ? { ...d, pl: { ...d.pl, [o.uid]: { n: o.n, f: o.f, c: null, st: 'inv', seen: 0 } }, v: (d.v || 0) + 1 } : null);
      await sendMsg({ gid, to: o.uid, tn: o.n, k: 'inv', txt: msgTxt });
      toast('✉️ ' + L(`Invitación enviada a ${o.n}`, `Invitació enviada a ${o.n}`, `Invitation sent to ${o.n}`));
    } catch (e) { toast('⚠️ ' + (e.code || e.message), 5000); }
  };
  async function startGame() {
    const ok = await store.gTx('pgame', gid, d => {
      if (!d || d.status !== 'lobby') return null;
      const pl = {}; Object.entries(d.pl).forEach(([u, p]) => { if (p.st === 'ok' && p.c) pl[u] = { ...p, seen: Date.now() }; else if (p.st === 'inv') pl[u] = { ...p, st: 'no' }; else pl[u] = p; });
      const order = COLORS.filter(c => Object.values(pl).some(p => p.st === 'ok' && p.c === c));
      if (order.length < 2) return null;
      const G = newGame(order); G.turn = order[0];
      return { ...d, pl, status: 'play', startAt: Date.now(), tt: Date.now(), G, n: order.length, v: (d.v || 0) + 1, ev: { k: 'start' } };
    }).catch(e => { toast('⚠️ ' + e.message); return false; });
    if (!ok) toast(L('Hacen falta al menos 2 jugadores con color.', 'Calen almenys 2 jugadors amb color.', 'At least 2 players with a colour are needed.'));
  }
  // ---- en directo
  let lastV = -1, busyAnim = Promise.resolve();
  const unwatch = store.gWatch('pgame', gid, d => {
    if (d === undefined) return; // error de conexión: seguirá cuando vuelva
    if (!d) { toast(L('La partida ya no existe', 'La partida ja no existeix', 'The game no longer exists')); W.close(); return; }
    const prev = doc; doc = d;
    if (d.status === 'cancel') { try { localStorage.removeItem(CUR); } catch {} clearGameMsgs(gid); if (!closing) { toast('🚪 ' + L('Se ha anulado la partida', 'S’ha anul·lat la partida', 'The game was cancelled'), 3500); W.close(); } return; }
    if (d.status === 'lobby') { if (d.pl?.[me]?.st === 'inv') store.gPatch('pgame', gid, { [`pl.${me}.st`]: 'ok', [`pl.${me}.seen`]: Date.now() }).catch(() => {}); drawLobby(); return; }
    if (!d.pl?.[me] || d.pl[me].st === 'no') { toast(L('La partida ya ha empezado sin ti', 'La partida ja ha començat sense tu', 'The game started without you'), 4000); try { localStorage.removeItem(CUR); } catch {} W.close(); return; }
    if (!started) { started = true; box.remove(); W.t0 = d.startAt; layout(W); }
    if (d.v === lastV) return; lastV = d.v;
    busyAnim = busyAnim.then(() => showState(prev, d)).catch(e => console.warn(e));
  });
  W.cleanups.push(() => { try { unwatch?.(); } catch {} });
  // latido: «sigo aquí» cada 15 s; y el vigilante del tiempo cada 5 s
  const beat = () => { if (doc?.pl?.[me] && doc.status !== 'end') store.gPatch('pgame', gid, { [`pl.${me}.seen`]: Date.now() }).catch(() => {}); };
  beat(); const bIv = setInterval(beat, 15000); W.cleanups.push(() => clearInterval(bIv));
  const wIv = setInterval(() => watchdog(), 5000); W.cleanups.push(() => clearInterval(wIv));
  const cIv = setInterval(() => { if (doc?.status === 'play') { W.turnLeft = Math.max(0, (TURN_MS - (Date.now() - (doc.tt || 0))) / 1000); paintPlayers(W, infoOf(doc)); } }, 1000); W.cleanups.push(() => clearInterval(cIv));

  const infoOf = d => { const o = {}; Object.values(d.pl || {}).forEach(p => { if (p.c && p.st !== 'no') o[p.c] = { name: p.n, img: FIG[p.f] || FIG.galleta }; }); return o; };
  const colorOf = d => d.pl?.[me]?.c;
  const uidOf = (d, c) => Object.entries(d.pl || {}).find(([, p]) => p.c === c && p.st !== 'no')?.[0];

  // cambiar la partida: siempre «de golpe» y solo si nadie la ha cambiado antes (v)
  const commit = (v0, fn) => store.gTx('pgame', gid, d => {
    if (!d || d.v !== v0 || d.status !== 'play') return null;
    const G = JSON.parse(JSON.stringify(d.G)); const ev = fn(G, d); if (!ev) return null;
    const out = { ...d, G, v: d.v + 1, tt: Date.now(), ev: { ...ev, v: d.v + 1, at: Date.now() } };
    if (G.status === 'end') { out.status = 'end'; out.endAt = Date.now(); }
    return out;
  }).catch(e => { console.warn(e); return false; });

  let acting = false;
  async function showState(prev, d) {
    W.G = d.G; const ev = d.ev || {}; const info = infoOf(d);
    W.turnLeft = Math.max(0, (TURN_MS - (Date.now() - (d.tt || 0))) / 1000);
    paintPlayers(W, info);
    // lo que ha pasado (para los que miran)
    if (ev.k === 'roll' && ev.by !== me) { W.spin(); await sleep(700); W.land(ev.n); if (ev.r === 'three6') { W.say('6️⃣6️⃣6️⃣ ' + L('¡Tres seises!', 'Tres sisos!', 'Three sixes!'), 'bad'); } else if (ev.r === 'none' || ev.r === 'none6') W.say(`${info[ev.c]?.name || ''}: ${L('no puede mover', 'no pot moure', 'can’t move')}`, 'warn'); }
    if (ev.k === 'move' && ev.by !== me) { const pG = prev?.G; if (pG) { W.G = pG; placeAll(W, { c: ev.c, i: ev.i }); W.G = d.G; } await walkTok(W, ev.c, ev.i, ev.path || []); if (ev.cap) await flyHome(W, ev.cap.c, ev.cap.i); }
    if (ev.k === 'move') await sayFx(W, ev.fx, ev.by === me);
    if (ev.k === 'left') W.say('🚪 ' + (info[ev.c]?.name || '') + ' ' + L('ha salido de la partida', 'ha sortit de la partida', 'left the game'), 'warn');
    if (ev.auto && ev.c) W.say('⏳ ' + (info[ev.c]?.name || '') + ': ' + L('se ha movido sola', 's’ha mogut sola', 'moved by itself'), 'warn');
    placeAll(W);
    payMe(d);
    if (d.status === 'end') return finishOnline(d);
    if (d.G.fin.includes(colorOf(d)) && !shownFin) { shownFin = true; showMyPlace(d); }
    maybeMine();
  }
  // ¿me toca? (siempre con la partida más nueva, y nunca dos veces la misma jugada)
  let handledV = -1;
  function maybeMine() {
    const d = doc; if (!d || d.status !== 'play' || acting || !W.alive) return;
    if (d.G.turn !== colorOf(d) || d.pl[me]?.st !== 'ok' || handledV === d.v) return;
    handledV = d.v; myTurn(d);
  }
  async function myTurn(d) {
    acting = true;
    try {
      const v0 = d.v, G = d.G, c = G.turn;
      if (G.ph === 'roll') {
        try { if (navigator.vibrate) navigator.vibrate(120); } catch {}
        const n = await W.humanRoll(); if (!n || !W.alive) return;
        await sleep(300);
        let r = null;
        const ok = await commit(v0, G2 => { r = applyRoll(G2, n); return { k: 'roll', by: me, c, n, r: r.k }; });
        if (!ok) { handledV = -1; return; }
        if (r?.k === 'three6') { W.say('6️⃣6️⃣6️⃣ ' + L('¡Tres seises! La última ficha vuelve a casa', 'Tres sisos! L’última fitxa torna a casa', 'Three sixes! Last token goes home'), 'bad'); sadTrombone(); }
        else if (r?.k === 'none' || r?.k === 'none6') W.say(L('No se puede mover', 'No es pot moure', 'No move possible'), 'warn');
        else if (n === 6) W.say(L('¡Seis! Después vuelves a tirar.', 'Sis! Després tornes a tirar.', 'Six! You roll again afterwards.'), 'goose');
        return; // el cambio llega por el «en directo» y vuelve a mirar si me toca mover
      }
      const moves = legal(G, c, G.steps, G.ph === 'bonus');
      if (G.ph === 'bonus') W.say(`🎁 ${L('Cuenta', 'Compta', 'Move')} ${G.bonus}!`, 'goose');
      const mv = await humanMove(W, moves); if (!mv || !W.alive) return;
      W.G = JSON.parse(JSON.stringify(G)); // la ficha ya está en su sitio (la he dejado yo)
      const ok = await commit(v0, G2 => { const fx = applyMove(G2, mv); return { k: 'move', by: me, c, i: mv.i, path: mv.path, cap: mv.cap, fx }; });
      if (!ok) { W.G = doc.G; placeAll(W); handledV = -1; }
    } finally { acting = false; setTimeout(() => { if (doc && doc.v !== handledV) maybeMine(); else if (doc && W.G !== doc.G) { W.G = doc.G; placeAll(W); } }, 60); }
  }
  // cancelar mi turno si se ha movido solo (los 2 minutos)
  const stopMine = () => { try { W.rollCancel?.(); } catch {} try { W.moveCancel?.(); } catch {} };
  async function watchdog() {
    const d = doc; if (!d || d.status !== 'play') return;
    const now = Date.now();
    // alguien que hace 5 minutos que no está: fuera
    for (const [u, p] of Object.entries(d.pl)) {
      if (p.st === 'ok' && p.c && !d.G.fin.includes(p.c) && !d.G.out.includes(p.c) && now - (p.seen || 0) > AWAY_MS) {
        const ok = await store.gTx('pgame', gid, x => {
          if (!x || x.v !== d.v || x.status !== 'play') return null;
          const G = JSON.parse(JSON.stringify(x.G)); removeColor(G, p.c);
          const out = { ...x, G, pl: { ...x.pl, [u]: { ...x.pl[u], st: 'left' } }, v: x.v + 1, tt: Date.now(), ev: { k: 'left', c: p.c, v: x.v + 1 } };
          if (G.status === 'end') { out.status = 'end'; out.endAt = Date.now(); }
          return out;
        }).catch(() => false);
        if (ok) store.gMerge('pinv', u, { pen: { [gid]: true } }).catch(() => {});
        return;
      }
    }
    // el que tiene el turno no ha hecho nada en 2 minutos: se mueve solo
    if (now - (d.tt || 0) > TURN_MS + 1500) {
      const c = d.G.turn, u = uidOf(d, c);
      if (u === me) stopMine();
      await commit(d.v, G => {
        if (G.ph === 'roll') { const n = 1 + Math.floor(Math.random() * 6); const r = applyRoll(G, n); return { k: 'roll', by: 'auto', auto: true, c, n, r: r.k }; }
        const mv = bestMove(legal(G, c, G.steps, G.ph === 'bonus')); if (!mv) { nextTurn(G); return { k: 'pass', auto: true, c }; }
        const fx = applyMove(G, mv); return { k: 'move', by: 'auto', auto: true, c, i: mv.i, path: mv.path, cap: mv.cap, fx };
      });
    }
  }
  // (V26) los puntos se cobran en cuanto llegas (aunque después salgas sin esperar a los demás)
  let shownFin = false, paying = null; const lines = [];
  function payMe(d) {
    if (paying) return paying;
    const myC = colorOf(d), G = d.G, N = d.n || G.order.length, place = G.fin.indexOf(myC) + 1, left = d.pl[me]?.st === 'left';
    if (!(place > 0 && !left) && !(left && d.status === 'end')) return null;
    const paidKey = 'adv_pch_paid_' + gid + '_' + me; let paid = false; try { paid = !!localStorage.getItem(paidKey); } catch {}
    if (paid) return null;
    try { localStorage.setItem(paidKey, '1'); localStorage.removeItem(CUR); } catch {}
    paying = (async () => {
      if (left) return penalize(gid);
      const p = N - place + 1;
      try { const pm = await import('./points.js'); const got = await pm.awardPlace('d12', p); if (got) lines.push(`⭐ ${L('Marcador de Navidad', 'Marcador de Nadal', 'Christmas scoreboard')}: +${got}`); } catch (e) { console.warn(e); }
      try { const gm = await import('./gnomes.js'); const got = await gm.gamePlacePts('parchis12', p); if (got) lines.push(`🍄 ${L('Juego de los gnomos', 'Joc dels gnoms', 'Gnome game')}: +${got}`); } catch (e) { console.warn(e); }
      if (!W.ctx?.prev) { try { W.ctx?.submit?.({ answer: `🎲 ${['🥇', '🥈', '🥉', '4️⃣'][place - 1]} ${fmt((Date.now() - d.startAt) / 1000)}`, status: 'correct' }); } catch {} }
    })();
    return paying;
  }
  // he llegado y los demás siguen: felicitación y puedo mirar o salir
  async function showMyPlace(d) {
    await paying;
    const place = d.G.fin.indexOf(colorOf(d)) + 1;
    const watch = el('button', { type: 'button', class: 'btn btn-big no-delay' }, '👀 ' + L('Mirar cómo acaban', 'Mirar com acaben', 'Watch the others'));
    const out = el('button', { type: 'button', class: 'btn btn-ghost btn-big no-delay', onclick: () => W.close() }, '🎄 ' + L('Salir', 'Sortir', 'Exit'));
    const fx = await bigCongrats(W.wrap, { title: L('¡Felicidades!', 'Felicitats!', 'Congratulations!'),
      sub: place === 1 ? L('¡Has llegado el primero!', 'Has arribat el primer!', 'You finished first!') : L(`¡Has llegado! Puesto ${place}`, `Has arribat! Posició ${place}`, `You made it! Place ${place}`),
      img: FIG[figure()], lines: [...lines], buttons: [watch, out] });
    if (place === 1) sayVoice('pwin', getLang()).catch(() => {});
    watch.onclick = () => fx.close();
  }
  let finished = false;
  async function finishOnline(d) {
    if (finished) return; finished = true; W.t0 = 0;
    clearGameMsgs(gid, Object.keys(d.pl || {})); // (V26.1) se acaba la partida: se borran sus mensajes
    document.querySelectorAll('.gfx-back, .gfx-fw').forEach(x => x.remove());
    try { localStorage.removeItem(CUR); } catch {}
    const myC = colorOf(d), G = d.G, N = d.n || G.order.length;
    const place = G.fin.indexOf(myC) + 1;
    await (payMe(d) || paying);
    const names = [...G.fin.map((c, k) => `${['🥇', '🥈', '🥉', '4️⃣'][k]} ${infoOf(d)[c]?.name || CNAME[c]()} (+${N - k})`),
      ...G.out.filter(c => !G.fin.includes(c)).map(c => `🚪 ${infoOf(d)[c]?.name || CNAME[c]()} (−1)`)];
    const out = el('button', { type: 'button', class: 'btn btn-big no-delay', onclick: () => W.close() }, '🎄 ' + L('Salir', 'Sortir', 'Exit'));
    if (place === 1) {
      await bigCongrats(W.wrap, { title: L('¡Felicidades!', 'Felicitats!', 'Congratulations!'), sub: L('¡Has ganado el parchís!', 'Has guanyat el parxís!', 'You won the game!'), img: FIG[figure()], lines: [...names, ...lines], buttons: [out] });
      sayVoice('pwin', getLang()).catch(() => {});
    } else {
      fanfare(); confetti(120);
      const card = el('div', { class: 'cc8-endcard' }, el('div', { class: 'cc8-bigstar' }, place > 0 ? ['🥇', '🥈', '🥉', '4️⃣'][place - 1] : '🎲'),
        el('h2', {}, place > 0 ? L(`¡Has quedado ${place}.º!`, `Has quedat ${place}è!`, `You came ${place}!`) : L('Partida acabada', 'Partida acabada', 'Game over')),
        ...names.map(n => el('p', { class: 'cc8-rec' }, n)), ...lines.map(n => el('p', { class: 'cc8-rec' }, n)), el('div', { class: 'cc8-endbtns' }, out));
      W.wrap.append(el('div', { class: 'cc8-end' }, card));
    }
  }
}
// salir (o quedar fuera): −1 en el Marcador de Navidad y en los gnomos (una vez por partida)
async function penalize(gid) {
  const k = 'adv_pch_pen_' + gid + '_' + myUid(); try { if (localStorage.getItem(k)) return; localStorage.setItem(k, '1'); localStorage.removeItem(CUR); } catch {}
  try { const pm = await import('./points.js'); await pm.penaltyAbandon('d12'); } catch (e) { console.warn(e); }
  try { const gm = await import('./gnomes.js'); await gm.gameAbandon('parchis12'); } catch (e) { console.warn(e); }
  toast('🚪 ' + L('Parchís: no acabaste la partida (−1)', 'Parxís: no vas acabar la partida (−1)', 'Ludo: you didn’t finish the game (−1)'), 5000);
}
async function leaveGame(gid, me, self = false) {
  await store.gTx('pgame', gid, x => {
    if (!x || x.status !== 'play' || !x.pl?.[me]) return null;
    const c = x.pl[me].c, G = JSON.parse(JSON.stringify(x.G)); removeColor(G, c);
    const out = { ...x, G, pl: { ...x.pl, [me]: { ...x.pl[me], st: 'left' } }, v: x.v + 1, tt: Date.now(), ev: { k: 'left', c, v: x.v + 1 } };
    if (G.status === 'end') { out.status = 'end'; out.endAt = Date.now(); }
    return out;
  }).catch(e => console.warn(e));
  if (self) await penalize(gid);
}

// ---------------------------------------------------------------- (V26.1) MENSAJES DEL PARCHÍS
// pinv/{uid}.box = { id: { gid, from, fn, to, tn, k: inv|msg|yes|no, txt, at, read } } — cada mensaje se guarda en el buzón de los dos
// (así ves lo que te envían y lo que has enviado). Cuando la partida se acaba o se anula, se borran sus mensajes.
let BOX = {};
const boxSubs = new Set();
const onBox = f => { boxSubs.add(f); return () => boxSubs.delete(f); };
const boxChanged = () => { boxSubs.forEach(f => { try { f(); } catch (e) { console.warn(e); } }); paintFab(); };
const boxList = () => Object.entries(BOX).filter(([, m]) => m && m.at).map(([id, m]) => ({ id, ...m })).sort((a, b) => b.at - a.at);
const unread = () => boxList().filter(m => m.to === myUid() && !m.read).length;
const newMsgId = () => 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const hhmm = t => { const d = new Date(t); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
async function sendMsg({ gid, to, tn, k = 'msg', txt = '', mut = null, g = null }) {
  const me = myUid(), id = newMsgId(), m = { gid, from: me, fn: myName(), to, tn: tn || '', k, txt: String(txt || '').slice(0, 200), at: Date.now() };
  if (mut) m.mut = mut;
  if (g) m.g = g;
  BOX[id] = { ...m, read: true }; boxChanged();
  await Promise.all([store.gMerge('pinv', to, { box: { [id]: m } }), store.gMerge('pinv', me, { box: { [id]: { ...m, read: true } } })]);
}
function markRead() {
  const ids = boxList().filter(m => m.to === myUid() && !m.read).map(m => m.id);
  if (!ids.length) return;
  const p = {}; ids.forEach(id => { p['box.' + id + '.read'] = true; BOX[id].read = true; });
  store.gPatch('pinv', myUid(), p).catch(() => {}); boxChanged();
}
// borrar los mensajes de una partida (los míos, y los de los demás que tengo yo)
function clearGameMsgs(gid, others = []) {
  const mine = boxList().filter(m => m.gid === gid);
  if (!mine.length) return;
  mine.forEach(m => delete BOX[m.id]); boxChanged();
  store.gUnset('pinv', myUid(), mine.map(m => 'box.' + m.id)).catch(() => {});
  others.filter(u => u && u !== myUid()).forEach(u => {
    const ids = mine.filter(m => m.from === u || m.to === u).map(m => 'box.' + m.id);
    if (ids.length) store.gUnset('pinv', u, ids).catch(() => {});
  });
}
const KIND = { inv: () => '✉️ ' + L('Invitación', 'Invitació', 'Invitation'), msg: () => '💬 ' + L('Mensaje', 'Missatge', 'Message'),
  yes: () => '✅ ' + L('¡Sí, juega!', 'Sí, juga!', 'Yes, playing!'), no: () => '🙅 ' + L('Ahora no', 'Ara no', 'Not now') };
const msgText = m => m.txt || (m.k === 'inv' && m.g === 'c4' ? L(`${m.fn} quiere jugar contigo al 4 en raya. ¿Juegas?`, `${m.fn} vol jugar amb tu al 4 en ratlla. Hi jugues?`, `${m.fn} wants to play Connect 4 with you. Will you play?`) : m.k === 'inv' ? L(`${m.fn} quiere jugar contigo al parchís. ¿Juegas?`, `${m.fn} vol jugar amb tu al parxís. Hi jugues?`, `${m.fn} wants to play ludo with you. Will you play?`) : '');

// ---- botón flotante con el número de mensajes (en toda la app)
let fab = null;
function paintFab() {
  const all = boxList().length, n = unread();
  if (!all) { fab?.remove(); fab = null; return; }
  if (!fab) { fab = el('button', { type: 'button', class: 'pch-fab no-delay', onclick: () => openInbox() }); document.body.append(fab); }
  rc(fab, el('span', { class: 'pch-fab-ico' }, '🎲'), el('b', {}, '💬'), n ? el('i', { class: 'pch-badge' }, n) : null);
  fab.classList.toggle('new', n > 0);
}

// ---- contestar a una invitación
async function answerInvite(m, yes, txt = '') {
  const me = myUid();
  const d = await store.gDoc('pgame', m.gid).catch(() => null);
  if (!d || d.__denied || d.status !== 'lobby') {
    toast(L('Esta partida ya ha empezado o se ha anulado', 'Aquesta partida ja ha començat o s’ha anul·lat', 'That game already started or was cancelled'), 4000);
    clearGameMsgs(m.gid); return false;
  }
  if (yes) {
    // (V26.2) nos hemos invitado el uno al otro: siempre se juega en UNA sola partida, la más antigua (gid menor)
    if (OPEN && OPEN.gid && OPEN.gid !== m.gid && OPEN.isHostLobby?.() && OPEN.hasInvited?.(m.from) && OPEN.gid < m.gid) {
      await store.gPatch('pgame', m.gid, { [`pl.${me}.st`]: 'no' }).catch(() => {});
      await sendMsg({ gid: m.gid, to: m.from, tn: m.fn, k: 'no', mut: OPEN.gid, txt: L('¡Nos hemos invitado a la vez! Juguemos en mi partida 😊', 'Ens hem convidat alhora! Juguem a la meva partida 😊', 'We invited each other! Let’s play in my game 😊') });
      document.querySelector('.pch-inbox-back')?.remove();
      toast('🤝 ' + L(`${m.fn} y tú os habéis invitado a la vez: jugáis en tu partida`, `${m.fn} i tu us heu convidat alhora: jugueu a la teva partida`, `You and ${m.fn} invited each other: you’ll play in your game`), 5000);
      return true;
    }
    if (OPEN && OPEN.gid !== m.gid) {
      if (OPEN.canLeaveQuiet?.() !== false) { await OPEN.leaveQuiet?.(); OPEN?.close?.(); await sleep(450); }
      else { toast(L('Primero acaba la partida que estás jugando', 'Primer acaba la partida que estàs jugant', 'Finish your current game first'), 4000); return false; }
    }
    await store.gPatch('pgame', m.gid, { [`pl.${me}.st`]: 'ok', [`pl.${me}.seen`]: Date.now(), [`pl.${me}.n`]: myName(), [`pl.${me}.f`]: figure() });
    await sendMsg({ gid: m.gid, to: m.from, tn: m.fn, k: 'yes', txt });
    document.querySelector('.pch-inbox-back')?.remove();
    if (!OPEN) { if (d.game === 'c4') import('./connect4.js').then(x => x.openC4(null, { join: m.gid })); else openParchis(null, { mode: 'online', join: m.gid }); } // (V28) el 4 en raya usa el mismo buzón
  } else {
    await store.gPatch('pgame', m.gid, { [`pl.${me}.st`]: 'no' }).catch(() => {});
    await sendMsg({ gid: m.gid, to: m.from, tn: m.fn, k: 'no', txt });
  }
  return true;
}

// ---- la ventana de mensajes: recibidos y enviados
export function openInbox() {
  if (document.querySelector('.pch-inbox-back')) return;
  const me = myUid();
  const list = el('div', { class: 'pch-inbox-list' });
  const close = () => { off(); back.remove(); };
  const card = el('div', { class: 'pch-inbox popup pch-xmas' },
    el('button', { type: 'button', class: 'pch-inbox-x no-delay', onclick: () => close() }, '✕'),
    el('h2', {}, '💬 ' + L('Mensajes de los juegos', 'Missatges dels jocs', 'Game messages')), list,
    el('div', { class: 'popup-btns' }, el('button', { type: 'button', class: 'btn no-delay', onclick: () => close() }, L('Cerrar', 'Tancar', 'Close'))));
  const back = el('div', { class: 'popup-back pch-inbox-back' }, card);
  back.addEventListener('click', e => { if (e.target === back) close(); });
  document.body.append(back);
  const games = {}; let replyOpen = null;
  const gameOf = async gid => { if (!(gid in games)) { games[gid] = null; games[gid] = await store.gDoc('pgame', gid).catch(() => null); draw(); } return games[gid]; };
  const item = m => {
    const got = m.to === me, g = games[m.gid];
    gameOf(m.gid);
    const acts = el('div', { class: 'pch-im-acts' });
    const ta = el('textarea', { class: 'pch-msg-in', rows: 2, maxlength: 200, placeholder: L('Escribe tu mensaje…', 'Escriu el teu missatge…', 'Write your message…') });
    const other = got ? { u: m.from, n: m.fn } : { u: m.to, n: m.tn };
    const live = g && !g.__denied && g.status === 'lobby';
    const canAnswer = got && m.k === 'inv' && live && g.pl?.[me]?.st === 'inv';
    if (canAnswer) acts.append(
      el('button', { type: 'button', class: 'btn btn-big no-delay', onclick: () => answerInvite(m, true, ta.value.trim()) }, '✅ ' + L('¡Sí, a jugar!', 'Sí, a jugar!', 'Yes, let’s play!')),
      el('button', { type: 'button', class: 'btn btn-ghost no-delay', onclick: () => answerInvite(m, false, ta.value.trim()) }, '🙅 ' + L('Ahora no', 'Ara no', 'Not now')));
    if (live || canAnswer) acts.append(el('button', { type: 'button', class: 'btn btn-ghost no-delay', onclick: () => { replyOpen = replyOpen === m.id ? null : m.id; draw(); } }, '✍️ ' + L('Responder', 'Respondre', 'Reply')));
    if (got && m.k === 'inv' && g && !live) acts.append(el('small', { class: 'muted' }, L('Esta partida ya ha empezado o se ha anulado.', 'Aquesta partida ja ha començat o s’ha anul·lat.', 'This game already started or was cancelled.')));
    return el('div', { class: 'pch-im' + (got ? ' got' : ' sent') + (got && !m.read ? ' unread' : '') },
      el('div', { class: 'pch-im-head' }, el('b', {}, got ? L(`De ${m.fn}`, `De ${m.fn}`, `From ${m.fn}`) : L(`Para ${m.tn}`, `Per a ${m.tn}`, `To ${m.tn}`)), el('small', {}, KIND[m.k]?.() + ' · ' + hhmm(m.at))),
      msgText(m) ? el('p', {}, msgText(m)) : null,
      replyOpen === m.id ? el('div', { class: 'pch-im-reply' }, ta, el('button', { type: 'button', class: 'btn no-delay', onclick: async () => {
        const t = ta.value.trim(); if (!t) return; replyOpen = null;
        await sendMsg({ gid: m.gid, to: other.u, tn: other.n, k: 'msg', txt: t }).catch(e => toast('⚠️ ' + e.message));
        toast('✉️ ' + L('Mensaje enviado', 'Missatge enviat', 'Message sent'));
      } }, '📨 ' + L('Enviar', 'Enviar', 'Send'))) : (canAnswer ? ta : null),
      acts);
  };
  function draw() {
    const all = boxList(), got = all.filter(m => m.to === me), sent = all.filter(m => m.from === me && m.to !== me);
    rc(list, 
      !all.length ? el('p', { class: 'muted' }, L('No tienes mensajes.', 'No tens missatges.', 'You have no messages.')) : null,
      got.length ? el('h3', { class: 'pch-im-sec' }, '📥 ' + L('Recibidos', 'Rebuts', 'Received')) : null, ...got.map(item),
      sent.length ? el('h3', { class: 'pch-im-sec' }, '📤 ' + L('Enviados', 'Enviats', 'Sent')) : null, ...sent.map(item));
  }
  const off = onBox(() => { if (document.activeElement?.tagName !== 'TEXTAREA') draw(); });
  draw(); setTimeout(markRead, 1200);
}

// ---- ventana bonita cuando te invitan (salga donde salga la app)
async function invitePopup(m) {
  chime();
  const ans = el('textarea', { class: 'pch-msg-in', rows: 2, maxlength: 200, placeholder: L('Contesta con un mensaje (opcional): «a las 18:00 estaré»…', 'Respon amb un missatge (opcional): «a les 18:00 hi seré»…', 'Reply with a message (optional)…') });
  const r = await popup(el('div', { class: 'pch-invite' }, el('div', { class: 'pch-intro-pics' }, ...COLORS.map(c => el('div', { class: 'pch-intro-pawn', html: pawnSvg(c) }))),
    el('h2', {}, m.g === 'c4' ? '🔴🟡 ' + L('¡Te invitan al 4 en raya!', 'Et conviden al 4 en ratlla!', 'You’re invited to Connect 4!') : '🎲 ' + L('¡Te invitan al parchís!', 'Et conviden al parxís!', 'You’re invited to play ludo!')),
    el('div', { class: 'pch-invmsg' }, el('small', {}, '✉️ ' + m.fn + ':'), el('p', {}, msgText(m))), ans),
    { cls: 'pch-xmas', buttons: [{ label: '✅ ' + L('¡Sí, a jugar!', 'Sí, a jugar!', 'Yes, let’s play!'), value: 'yes' }, { label: '✍️ ' + L('Solo enviar el mensaje', 'Només enviar el missatge', 'Just send the message'), value: 'msg' }, { label: '🙅 ' + L('Ahora no', 'Ara no', 'Not now'), value: 'no' }, { label: L('Lo miro luego', 'M’ho miro després', 'Later'), value: null, cls: 'btn-ghost' }] });
  const t = ans.value.trim().slice(0, 200);
  if (r === 'yes') return answerInvite(m, true, t);
  if (r === 'no') return answerInvite(m, false, t);
  if (r === 'msg') { if (t) { await sendMsg({ gid: m.gid, to: m.from, tn: m.fn, k: 'msg', txt: t }).catch(() => {}); toast('✉️ ' + L('Mensaje enviado', 'Missatge enviat', 'Message sent')); } return; }
  toast('💬 ' + L('Lo tienes en el botón de mensajes 🎲💬', 'El tens al botó de missatges 🎲💬', 'It’s in the messages button 🎲💬'), 4000);
}

// ---------------------------------------------------------------- en toda la app: buzón, avisos y partidas que se quedaron a medias
let invStarted = false;
export function startParchisInvites() {
  if (invStarted || !S.user) return; invStarted = true;
  const me = myUid();
  // ¿me fui de una partida sin acabarla (cerré la app)? Si ya me han dejado fuera, −1
  (async () => {
    let gid = null; try { gid = localStorage.getItem(CUR); } catch {}
    if (!gid) return;
    const d = await store.gDoc('pgame', gid).catch(() => null);
    if (!d || d.__denied) { try { localStorage.removeItem(CUR); } catch {} return; }
    if (d.status === 'play' && d.pl?.[me]?.st === 'ok' && d.G?.fin?.includes(d.pl[me].c)) { try { localStorage.removeItem(CUR); } catch {} return; }
    if (d.status === 'play' && d.pl?.[me]?.st === 'ok') {
      if (Date.now() - (d.pl[me].seen || 0) > AWAY_MS) { await leaveGame(gid, me, true); return; }
      const go = await popup(`<h2>🎲</h2><p style="font-size:18px">${L('Tienes una partida de parchís en marcha. ¿Vuelves?', 'Tens una partida de parxís en marxa. Hi tornes?', 'You have a ludo game in progress. Go back?')}</p>`,
        { cls: 'pch-xmas', buttons: [{ label: L('Volver a la partida', 'Tornar a la partida', 'Back to the game'), value: true }, { label: L('Dejarla (−1)', 'Deixar-la (−1)', 'Leave it (−1)'), value: false, cls: 'btn-ghost' }] });
      if (go) openParchis(null, { mode: 'online', join: gid }); else await leaveGame(gid, me, true);
    } else if (d.status === 'end' && d.pl?.[me]?.st === 'left') await penalize(gid);
    else if (d.status !== 'play') { try { localStorage.removeItem(CUR); } catch {} }
  })().catch(e => console.warn(e));
  const seen = new Set(); let first = true;
  store.gWatch('pinv', me, async inv => {
    if (inv === undefined) return;
    // me dejaron fuera de una partida (5 minutos sin estar): −1
    Object.keys(inv?.pen || {}).forEach(g => { if (inv.pen[g] && !seen.has('pen' + g)) { seen.add('pen' + g); penalize(g).then(() => store.gMerge('pinv', me, { pen: { [g]: false } }).catch(() => {})); } });
    BOX = { ...(inv?.box || {}) }; Object.keys(BOX).forEach(k => { if (!BOX[k]) delete BOX[k]; });
    boxChanged();
    if (first) { first = false; tidyBox(); }
    // mensajes nuevos que aún no he visto
    for (const m of boxList().filter(m => m.to === me && !m.read && Date.now() - m.at < 3 * 3600e3)) {
      if (seen.has(m.id)) continue; seen.add(m.id);
      let shown = false; try { shown = !!localStorage.getItem('adv_pch_pop_' + m.id); localStorage.setItem('adv_pch_pop_' + m.id, '1'); } catch {}
      if (shown) continue;
      const playing = OPEN && OPEN.canLeaveQuiet?.() === false;
      // (V26.2) la otra persona se queda en su partida porque nos invitamos a la vez: entro yo en la suya
      if (m.k === 'no' && m.mut) {
        const invm = boxList().find(x => x.k === 'inv' && x.gid === m.mut && x.from === m.from && x.to === me);
        if (invm) { toast('🤝 ' + L(`Os habéis invitado a la vez: entras en la partida de ${m.fn}`, `Us heu convidat alhora: entres a la partida de ${m.fn}`, `You invited each other: joining ${m.fn}’s game`), 5000); document.querySelectorAll('.popup-back').forEach(x => { if (x.querySelector('.pch-invite')) x.remove(); }); await answerInvite(invm, true); continue; }
      }
      if (m.k === 'inv' && !playing && !document.querySelector('.pch-inbox-back')) await invitePopup(m);
      else { chime(); toast(`${KIND[m.k]?.() || '💬'} · ${m.fn}${m.txt ? ': ' + m.txt : ''}`, 5000); }
    }
  });
}
// mensajes viejos (más de un día) o de partidas que ya no están en marcha: fuera
async function tidyBox() {
  const all = boxList(), gids = [...new Set(all.map(m => m.gid))];
  for (const g of gids) {
    const ms = all.filter(m => m.gid === g);
    const old = ms.every(m => Date.now() - m.at > 24 * 3600e3);
    let dead = old;
    if (!dead) { const d = await store.gDoc('pgame', g).catch(() => null); dead = !d || d.__denied || d.status === 'cancel' || d.status === 'end'; }
    if (dead) clearGameMsgs(g);
  }
}

// (V28) lo comparten otros juegos en línea (el 4 en raya del día 1): buzón, mensajes y «una partida abierta a la vez»
export { sendMsg, clearGameMsgs, boxList, onBox, unread, myName, myUid, markRead };
export const setOpenGame = w => { OPEN = w; };
export const getOpenGame = () => OPEN;
