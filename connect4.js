// Día 1 · (V28) «El 4 en raya de Navidad»
// Contra el Pare Noel (la máquina) o en línea con otra persona (como el parchís: invitación, mensajes, todo se borra al acabar).
// Para tirar: coges TU ficha 3D de la bandeja y la arrastras encima de la columna; al soltarla cae por la columna hasta su sitio.
// La otra persona ve cómo tu ficha va hasta la columna y cae. Quien hace 4 en raya (en fila, columna o diagonal) gana:
// fuegos artificiales y felicitación con el nombre del ganador. Si no se mueve en 20 s, sale un aviso para saber si sigue.
// Partida en línea: pgame/{gid} { game:'c4', host, hostName, status: lobby|play|end|cancel, pl:{uid:{n,f,st,seen}}, red, yel, G, tt, v, again }
//   G = { b: 42 letras ('.', 'r', 'y'; fila 0 = arriba), turn, starter, last: {c, r, by}, win: 'r,c;r,c…', winner: 'r'|'y'|'d', n, why }
import { getLang } from './i18n.js';
import { el, sleep, confetti, popup, toast } from './fx.js';
import { pop, chime, clickSound, snapSound, unlockAudio, wrong, fanfare, sadTrombone } from './sound.js';
import { bigCongrats } from './gamefx.js';
import { store } from './store.js';
import { S, figure } from './app.js';
import { sendMsg, clearGameMsgs, boxList, onBox, myName, myUid, setOpenGame, getOpenGame, openInbox, markRead } from './parchis.js';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const rc = (n, ...k) => n.replaceChildren(...k.flat().filter(x => x != null && x !== false));
const FIG = { galleta: 'galleta.png', arbol: 'arbol.png', gnomo: 'gnomo.png' };
const COLS = 7, ROWS = 6, IDLE_MS = 20000, OPP_IDLE_MS = 45000;
const CNAME = { r: () => L('rojas', 'vermelles', 'red'), y: () => L('amarillas', 'grogues', 'yellow') };
const newGid = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ---------------------------------------------------------------- reglas del juego (sin pantalla)
const emptyG = starter => ({ b: '.'.repeat(COLS * ROWS), turn: starter, starter, last: null, win: '', winner: null, n: 0 });
const at = (b, r, c) => b[r * COLS + c];
const dropRow = (b, c) => { for (let r = ROWS - 1; r >= 0; r--) if (at(b, r, c) === '.') return r; return -1; };
const put = (b, r, c, p) => b.slice(0, r * COLS + c) + p + b.slice(r * COLS + c + 1);
function fourAt(b, r, c) {
  const p = at(b, r, c); if (p === '.') return null;
  for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    const line = [[r, c]];
    for (const s of [1, -1]) { let rr = r + dr * s, cc = c + dc * s; while (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && at(b, rr, cc) === p) { line.push([rr, cc]); rr += dr * s; cc += dc * s; } }
    if (line.length >= 4) return line;
  }
  return null;
}
function play(G, c, by = '') { // devuelve el nuevo G o null si la columna está llena
  const r = dropRow(G.b, c); if (r < 0 || G.winner) return null;
  const b = put(G.b, r, c, G.turn), line = fourAt(b, r, c), n = (G.n || 0) + 1;
  const out = { ...G, b, n, last: { c, r, by }, turn: G.turn === 'r' ? 'y' : 'r' };
  if (line) { out.winner = G.turn; out.win = line.map(x => x.join(',')).join(';'); }
  else if (n >= COLS * ROWS) out.winner = 'd';
  return out;
}
// ---- el Pare Noel: minimax con poda (mira 5 jugadas) y alguna vez se despista
function scoreWin(b, p) {
  const o = p === 'r' ? 'y' : 'r'; let s = 0;
  for (let r = 0; r < ROWS; r++) if (at(b, r, 3) === p) s += 3;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    const er = r + dr * 3, ec = c + dc * 3; if (er < 0 || er >= ROWS || ec < 0 || ec >= COLS) continue;
    let mine = 0, his = 0, emp = 0;
    for (let k = 0; k < 4; k++) { const v = at(b, r + dr * k, c + dc * k); if (v === p) mine++; else if (v === o) his++; else emp++; }
    if (mine === 4) s += 1000; else if (mine === 3 && emp === 1) s += 6; else if (mine === 2 && emp === 2) s += 2;
    if (his === 3 && emp === 1) s -= 8;
  }
  return s;
}
const ORDER = [3, 2, 4, 1, 5, 0, 6];
function minimax(G, depth, a, bt, me) {
  if (G.winner) return G.winner === 'd' ? 0 : (G.winner === me ? 100000 + depth : -100000 - depth);
  if (!depth) return scoreWin(G.b, me);
  const maxi = G.turn === me; let best = maxi ? -Infinity : Infinity;
  for (const c of ORDER) {
    const g2 = play(G, c); if (!g2) continue;
    const v = minimax(g2, depth - 1, a, bt, me);
    if (maxi) { best = Math.max(best, v); a = Math.max(a, v); } else { best = Math.min(best, v); bt = Math.min(bt, v); }
    if (a >= bt) break;
  }
  return best;
}
function santaMove(G) {
  const me = G.turn, opts = ORDER.filter(c => dropRow(G.b, c) >= 0);
  // ganar ya o tapar el 4 en raya del otro, siempre
  for (const c of opts) if (play(G, c)?.winner === me) return c;
  const other = { ...G, turn: me === 'r' ? 'y' : 'r' };
  for (const c of opts) if (play(other, c)?.winner === other.turn) return c;
  if (Math.random() < .12) return opts[Math.floor(Math.random() * opts.length)]; // a veces se despista 🎅
  let best = opts[0], bv = -Infinity;
  for (const c of opts) { const v = minimax(play(G, c), 4, -Infinity, Infinity, me) + Math.random(); if (v > bv) { bv = v; best = c; } }
  return best;
}

// ---------------------------------------------------------------- pantalla del día 1 (debajo de los gorros)
export function c4Button(ctx) {
  return el('div', { class: 'c4-intro' },
    el('button', { type: 'button', class: 'oca-cta c4-cta no-delay', onclick: () => { unlockAudio(); chooseMode(ctx); } }, el('span', { class: 'c4-mini' }, el('i', { class: 'r' }), el('i', { class: 'y' })), ' ' + L('¡Juega al 4 en raya!', 'Juga al 4 en ratlla!', 'Play Connect 4!')),
    el('p', { class: 'pm-goalnote' }, '🎅 ' + L('Contra el Pare Noel o con alguien que tenga la app abierta. ⭐ Tu 1.ª partida suma al Marcador (y a los gnomos: +2 si ganan, +1 si pierden).', 'Contra el Pare Noel o amb algú que tingui l’app oberta. ⭐ La teva 1a partida suma al Marcador (i als gnoms: +2 si guanyen, +1 si perden).', 'Against Santa or someone online. ⭐ Your 1st game counts for the scoreboard (gnomes: +2 win, +1 loss).')));
}
async function chooseMode(ctx) {
  const r = await popup(el('div', { class: 'c4-choose' },
    el('div', { class: 'c4-mini big' }, el('i', { class: 'r' }), el('i', { class: 'y' }), el('i', { class: 'r' }), el('i', { class: 'y' })),
    el('h2', {}, L('4 en raya de Navidad', '4 en ratlla de Nadal', 'Christmas Connect 4')),
    el('p', {}, L('¿Con quién quieres jugar?', 'Amb qui vols jugar?', 'Who do you want to play with?'))),
    { cls: 'pch-xmas', buttons: [{ label: '🌐 ' + L('Con alguien en línea', 'Amb algú en línia', 'Someone online'), value: 'online' }, { label: '🎅 ' + L('Contra el Pare Noel', 'Contra el Pare Noel', 'Against Santa'), value: 'cpu' }, { label: L('Ahora no', 'Ara no', 'Not now'), value: null, cls: 'btn-ghost' }] });
  if (r) openC4(ctx, { mode: r });
}
export function showC4Rules() {
  document.querySelector('.c4-rules')?.remove();
  const R = (ico, t, d) => el('div', { class: 'oca-rule' }, el('div', { class: 'pch-rico' }, ico), el('div', {}, el('b', {}, t), el('small', {}, d)));
  const box = el('div', { class: 'cc8-end oca-helpbox c4-rules' }, el('div', { class: 'cc8-endcard oca-help' },
    el('h2', {}, '📜 ' + L('Normas del 4 en raya', 'Normes del 4 en ratlla', 'Connect 4 rules')),
    R('🎯', L('Objetivo', 'Objectiu', 'Goal'), L('Pon 4 fichas de tu color seguidas: en fila, en columna o en diagonal.', 'Posa 4 fitxes del teu color seguides: en fila, en columna o en diagonal.', 'Get 4 of your discs in a row: across, down or diagonally.')),
    R('👆', L('Tirar', 'Tirar', 'Play'), L('Coge tu ficha de abajo, arrástrala encima de la columna que quieras y suéltala: cae hasta el hueco libre. (También puedes tocar la columna.)', 'Agafa la teva fitxa de sota, arrossega-la a sobre de la columna que vulguis i deixa-la anar: cau fins al forat lliure. (També pots tocar la columna.)', 'Pick up your disc, drag it over a column and let go: it drops to the free slot. (You can also tap the column.)')),
    R('🔁', L('Turnos', 'Torns', 'Turns'), L('Se tira por turnos. En la siguiente partida empieza el otro.', 'Es tira per torns. A la partida següent comença l’altre.', 'Take turns. The other player starts the next game.')),
    R('⏱', L('Tiempo', 'Temps', 'Time'), L('Si alguien no tira en 20 segundos, le sale un aviso para saber si sigue jugando. En línea, si la otra persona no contesta, puedes esperar o acabar la partida.', 'Si algú no tira en 20 segons, li surt un avís per saber si continua jugant. En línia, si l’altra persona no contesta, pots esperar o acabar la partida.', 'If someone doesn’t play within 20 seconds, they’re asked whether they’re still playing. Online, if the other person doesn’t answer, you can wait or end the game.')),
    R('⭐', L('Puntos', 'Punts', 'Points'), L('Tu PRIMERA partida acabada (contra el Pare Noel o en línea) suma +2 en el Marcador de Navidad. Gnomos: si ganan esa partida +2, si pierden o empatan +1. Las demás partidas son para divertirse.', 'La teva PRIMERA partida acabada (contra el Pare Noel o en línia) suma +2 al Marcador de Nadal. Gnoms: si guanyen aquesta partida +2, si perden o empaten +1. Les altres partides són per divertir-se.', 'Your FIRST finished game (against Santa or online) adds +2 to the Christmas scoreboard. Gnomes: +2 if they win it, +1 if they lose or draw. Other games are just for fun.')),
    R('💬', L('Mensajes', 'Missatges', 'Messages'), L('En línea, con 💬 puedes escribir a la otra persona mientras jugáis. Al acabar, los mensajes se borran.', 'En línia, amb 💬 pots escriure a l’altra persona mentre jugueu. En acabar, els missatges s’esborren.', 'Online, use 💬 to write to the other player. Messages are deleted at the end.')),
    el('div', { class: 'cc8-endbtns' }, el('button', { type: 'button', class: 'btn btn-big no-delay', onclick: () => box.remove() }, '👍 ' + L('¡Entendido!', 'Entesos!', 'Got it!')))));
  document.body.append(box);
}

// ---------------------------------------------------------------- la ventana del juego
export async function openC4(ctx, { mode = null, join = null } = {}) {
  mode = mode || (join ? 'online' : 'cpu');
  if (getOpenGame()) { toast(L('Ya tienes una partida abierta', 'Ja tens una partida oberta', 'You already have a game open')); return; }
  const W = shell(ctx, mode);
  setOpenGame(W);
  if (mode === 'cpu') cpuGame(W); else onlineGame(W, join);
}

function shell(ctx, mode) {
  const players = el('div', { class: 'c4-players' });
  const stage = el('div', { class: 'c4-stage' });
  const discs = el('div', { class: 'c4-discs' });
  const plate = el('div', { class: 'c4-plate' });
  const lane = el('div', { class: 'c4-lane' });
  const cols = el('div', { class: 'c4-cols' });
  const tray = el('div', { class: 'c4-tray' });
  const hint = el('div', { class: 'c4-hint' });
  const msg = el('div', { class: 'oca-msg' });
  const chatBtn = el('button', { type: 'button', class: 'c4-tool no-delay', style: mode === 'online' ? '' : 'display:none', onclick: () => W.openChat?.() }, '💬', el('small', {}, L('Mensajes', 'Missatges', 'Messages')));
  const xBtn = el('button', { type: 'button', class: 'cc8-x no-delay' }, '✕');
  const wrap = el('div', { class: 'oca-wrap c4-wrap' },
    el('div', { class: 'oca-snow' }),
    el('div', { class: 'oca-head' }, xBtn, el('div', { class: 'oca-title' }, L('4 en raya de Navidad', '4 en ratlla de Nadal', 'Christmas Connect 4'))),
    el('div', { class: 'c4-tools' }, chatBtn, el('button', { type: 'button', class: 'c4-tool no-delay', onclick: () => showC4Rules() }, '📜', el('small', {}, L('Normas', 'Normes', 'Rules')))),
    players, el('div', { class: 'c4-boardwrap' }, stage), tray, hint, msg);
  stage.append(el('div', { class: 'c4-back' }), lane, discs, plate, cols, el('div', { class: 'c4-leg l' }), el('div', { class: 'c4-leg r' }));
  document.body.append(wrap);
  document.documentElement.classList.add('gm-lock');
  const W = { ctx, mode, wrap, stage, discs, plate, lane, cols, tray, hint, players, chatBtn, msg, alive: true, cleanups: [], S: 40, G: null, me: 'r', names: {}, figs: {} };
  W.close = () => { if (!W.alive) return; W.alive = false; W.cleanups.forEach(f => { try { f(); } catch {} }); wrap.classList.add('out'); document.documentElement.classList.remove('gm-lock'); setTimeout(() => wrap.remove(), 350); setOpenGame(null); };
  xBtn.onclick = () => (W.onX ? W.onX() : W.close());
  // medidas
  W.layout = () => {
    const S0 = Math.floor(Math.min(Math.min(innerWidth * .94, 520) / (COLS + 1.2), (innerHeight - 360) / (ROWS + 1))); // (V28.1) deja sitio a las patas
    W.S = Math.max(34, S0);
    stage.style.width = COLS * W.S + 'px'; stage.style.height = (ROWS + 1) * W.S + 'px';
    stage.style.setProperty('--s', W.S + 'px');
    drawPlate(W); drawAll(W);
  };
  const onR = () => W.layout(); addEventListener('resize', onR); W.cleanups.push(() => removeEventListener('resize', onR));
  let msgT = 0;
  W.say = (txt, kind = 'goose', ms = 2200) => { rc(msg, el('span', {}, txt)); msg.className = 'oca-msg on ' + kind; clearTimeout(msgT); msgT = setTimeout(() => msg.classList.remove('on'), ms); };
  // columnas que se pueden tocar
  rc(cols, ...Array.from({ length: COLS }, (_, c) => el('button', { type: 'button', class: 'c4-col no-delay', 'data-c': c, onclick: () => W.pickCol?.(c) })));
  return W;
}
// el panel azul con agujeros (las fichas caen por detrás)
function drawPlate(W) {
  const S0 = W.S, w = COLS * S0, h = ROWS * S0, r = S0 * .39;
  const holes = []; for (let rr = 0; rr < ROWS; rr++) for (let c = 0; c < COLS; c++) holes.push(`<circle cx="${c * S0 + S0 / 2}" cy="${rr * S0 + S0 / 2}" r="${r}" fill="#000"/>`);
  const rims = []; for (let rr = 0; rr < ROWS; rr++) for (let c = 0; c < COLS; c++) rims.push(`<circle cx="${c * S0 + S0 / 2}" cy="${rr * S0 + S0 / 2}" r="${r}" fill="none" stroke="url(#c4rim)" stroke-width="${S0 * .07}"/>`);
  W.plate.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><mask id="c4m"><rect width="${w}" height="${h}" rx="${S0 * .25}" fill="#fff"/>${holes.join('')}</mask>
    <linearGradient id="c4g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d7bf0"/><stop offset="1" stop-color="#1846b8"/></linearGradient>
    <linearGradient id="c4rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0e2f86"/><stop offset="1" stop-color="#7fb0ff"/></linearGradient></defs>
    <rect width="${w}" height="${h}" rx="${S0 * .25}" fill="url(#c4g)" mask="url(#c4m)"/>${rims.join('')}
    <rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="${S0 * .23}" fill="none" stroke="#ffffff55" stroke-width="2" mask="url(#c4m)"/></svg>`;
}
const discEl = (p, extra = '') => el('div', { class: 'c4-disc ' + p + ' ' + extra }); // (V28.1) como las fichas de verdad: lisas con un aro
const posOf = (W, r, c) => ({ x: c * W.S + W.S * .06, y: (r + 1) * W.S + W.S * .06 });
function drawAll(W) {
  const G = W.G; if (!G) { W.discs.replaceChildren(); return; }
  const win = new Set((G.win || '').split(';').filter(Boolean));
  const kids = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const p = at(G.b, r, c); if (p === '.') continue;
    if (W.hide && W.hide.r === r && W.hide.c === c) continue;
    const d = discEl(p, win.has(r + ',' + c) ? 'win' : ''); const q = posOf(W, r, c);
    d.style.transform = `translate(${q.x}px, ${q.y}px)`; kids.push(d);
  }
  W.discs.replaceChildren(...kids);
}
// una ficha cae por la columna (desde arriba, o desde donde la ha soltado)
async function dropAnim(W, p, c, r, from = null) {
  const d = discEl(p, 'falling'); W.lane.append(d);
  const x = c * W.S + W.S * .06, top = W.S * .06, end = posOf(W, r, c).y;
  if (from) {
    d.style.transform = `translate(${from.x}px, ${from.y}px)`;
    await d.animate([{ transform: `translate(${from.x}px, ${from.y}px)` }, { transform: `translate(${x}px, ${top}px)` }], { duration: 380, easing: 'cubic-bezier(.3,.8,.3,1)', fill: 'forwards' }).finished.catch(() => {});
  }
  const dur = 160 + (r + 1) * 75;
  clickSound();
  await d.animate([
    { transform: `translate(${x}px, ${top}px)`, easing: 'cubic-bezier(.5,0,1,1)' },
    { transform: `translate(${x}px, ${end}px)`, offset: .78, easing: 'cubic-bezier(0,0,.4,1)' },
    { transform: `translate(${x}px, ${end - W.S * .18}px)`, offset: .9, easing: 'cubic-bezier(.5,0,1,1)' },
    { transform: `translate(${x}px, ${end}px)` }], { duration: dur + 180, fill: 'forwards' }).finished.catch(() => {});
  pop(); try { navigator.vibrate?.(25); } catch {}
  d.remove();
}
// la bandeja azul de abajo (como la del juego de verdad), con fichas de los dos colores y la tuya para coger
const dish = (main, p) => el('div', { class: 'c4-dish' }, el('div', { class: 'c4-disc r flat d1' }), el('div', { class: 'c4-disc y flat d2' }), el('div', { class: 'c4-disc ' + (p === 'r' ? 'y' : 'r') + ' flat d3' }), main);
// mi turno: arrastrar mi ficha de la bandeja (o tocar una columna)
function myTurnInput(W) {
  return new Promise(res => {
    const p = W.me; let done = false;
    const disc = discEl(p, 'tray-disc'); rc(W.tray, el('div', { class: 'c4-traybox ' + p }, dish(disc, p), el('small', {}, L('Arrastra tu ficha', 'Arrossega la teva fitxa', 'Drag your disc'))));
    W.tray.classList.add('on');
    W.hint.textContent = '👆 ' + L('¡Te toca! Coge tu ficha y suéltala encima de una columna', 'Et toca! Agafa la teva fitxa i deixa-la anar a sobre d’una columna', 'Your turn! Drag your disc over a column');
    const finish = (c, from) => { if (done) return; if (dropRow(W.G.b, c) < 0) { wrong(); W.say(L('Esa columna está llena', 'Aquesta columna és plena', 'That column is full'), 'warn', 1200); return; } done = true; cleanup(); res({ c, from }); };
    const colAt = x => { const r = W.stage.getBoundingClientRect(); const c = Math.floor((x - r.left) / W.S); return c >= 0 && c < COLS ? c : -1; };
    let ghost = null, drag = false;
    const hl = c => W.cols.querySelectorAll('.c4-col').forEach((b, i) => b.classList.toggle('hl', i === c));
    const down = e => {
      e.preventDefault(); unlockAudio(); drag = true; try { disc.setPointerCapture(e.pointerId); } catch {}
      ghost = discEl(p, 'drag'); document.body.append(ghost); move(e); snapSound();
    };
    const move = e => {
      if (!drag || !ghost) return;
      ghost.style.width = ghost.style.height = W.S * .88 + 'px';
      ghost.style.left = (e.clientX - W.S * .44) + 'px'; ghost.style.top = (e.clientY - W.S * .44) + 'px';
      hl(colAt(e.clientX));
    };
    const up = e => {
      if (!drag) return; drag = false; hl(-1);
      const c = colAt(e.clientX), r = W.stage.getBoundingClientRect();
      const from = ghost ? { x: e.clientX - r.left - W.S * .44, y: e.clientY - r.top - W.S * .44 } : null;
      ghost?.remove(); ghost = null;
      if (c >= 0) finish(c, from);
    };
    disc.addEventListener('pointerdown', down); disc.addEventListener('pointermove', move); disc.addEventListener('pointerup', up);
    disc.addEventListener('pointercancel', () => { drag = false; ghost?.remove(); ghost = null; hl(-1); });
    W.pickCol = c => finish(c, null);
    const cleanup = () => { W.pickCol = null; ghost?.remove(); W.tray.classList.remove('on'); W.hint.textContent = ''; rc(W.tray, el('div', { class: 'c4-traybox ' + p + ' off' }, dish(discEl(p, 'tray-disc'), p))); W.cancelInput = null; };
    W.cancelInput = () => { if (done) return; done = true; cleanup(); res(null); };
  });
}
function paintPlayers(W) {
  const G = W.G;
  const chip = p => el('div', { class: 'c4-chip ' + p + (G && !G.winner && G.turn === p ? ' turn' : '') },
    discEl(p, 'chip-disc'), el('img', { src: W.figs[p] || FIG.galleta, alt: '' }),
    el('div', {}, el('b', {}, W.names[p] || '—'), el('small', {}, G && !G.winner && G.turn === p ? (p === W.me ? L('¡te toca!', 'et toca!', 'your turn!') : L('pensando…', 'pensant…', 'thinking…')) : CNAME[p]())));
  rc(W.players, chip('r'), el('span', { class: 'c4-vs' }, 'VS'), chip('y'));
}
// aviso de los 20 segundos (al que no tira)
async function idleAsk(W) {
  const r = await popup(el('div', { class: 'c4-idle' }, el('div', { class: 'c4-mini big' }, el('i', { class: W.me })), el('h2', {}, '⏰ ' + L('¿Sigues jugando?', 'Continues jugant?', 'Still playing?')),
    el('p', {}, L('Hace 20 segundos que no tiras.', 'Fa 20 segons que no tires.', 'You haven’t played for 20 seconds.'))),
    { cls: 'pch-xmas', buttons: [{ label: '✅ ' + L('¡Sí, sigo!', 'Sí, continuo!', 'Yes!'), value: true }, { label: '🚪 ' + L('Salir', 'Sortir', 'Leave'), value: false, cls: 'btn-ghost' }] });
  return r !== false;
}
// (V28) la PRIMERA partida acabada: ⭐ Marcador para todos (+2) y 🍄 gnomos (+2 si gana, +1 si pierde o empata)
async function payFirst(res) {
  const lines = [];
  try { const pm = await import('./points.js'); const got = await pm.awardOnce('c4'); if (got) lines.push(`⭐ ${L('Marcador de Navidad', 'Marcador de Nadal', 'Christmas scoreboard')}: +${got}`); } catch (e) { console.warn(e); }
  try {
    const gm = await import('./gnomes.js'); const bs = await gm.gameBonusState('c4');
    if (bs && !bs.doc) { await gm.gameBonusStart(bs); await gm.gameBonusLevel(bs, res === 'win' ? 2 : 1); const add = await gm.gameBonusClaim(bs); if (add) lines.push(`🍄 ${L('Juego de los gnomos', 'Joc dels gnoms', 'Gnome game')}: +${add}`); }
  } catch (e) { console.warn(e); }
  return lines;
}
// final: fuegos artificiales y felicitación con el nombre del ganador
async function celebrate(W, onAgain, onExit, waitTxt = '', extra = []) {
  const G = W.G, wn = G.winner;
  drawAll(W); paintPlayers(W);
  await sleep(700); if (!W.alive) return null;
  const again = el('button', { type: 'button', class: 'btn btn-big no-delay' }, '🔄 ' + L('Volver a jugar', 'Tornar a jugar', 'Play again'));
  const out = el('button', { type: 'button', class: 'btn btn-ghost btn-big no-delay' }, '🚪 ' + L('Salir', 'Sortir', 'Exit'));
  const why = G.why === 'left' ? L('(la otra persona ha salido)', '(l’altra persona ha sortit)', '(the other player left)') : G.why === 'idle' ? L('(la otra persona no tiraba)', '(l’altra persona no tirava)', '(the other player stopped)') : '';
  let fx;
  if (wn === 'd') {
    fanfare(); confetti(150);
    fx = await bigCongrats(W.wrap, { title: L('¡Empate!', 'Empat!', 'Draw!'), sub: L('¡El tablero está lleno y nadie ha hecho 4 en raya!', 'El tauler és ple i ningú no ha fet 4 en ratlla!', 'The board is full and nobody got 4 in a row!'), lines: [...extra, ...(waitTxt ? [waitTxt] : [])], buttons: [again, out] });
  } else {
    fx = await bigCongrats(W.wrap, { title: L('¡Enhorabuena!', 'Enhorabona!', 'Congratulations!'),
      sub: '🏆 ' + L(`¡Ha ganado ${W.names[wn]}!`, `Ha guanyat ${W.names[wn]}!`, `${W.names[wn]} wins!`) + (why ? ' ' + why : ''),
      img: W.figs[wn] || FIG.galleta, lines: [wn === W.me ? '🎉 ' + (why ? L('¡Ganas tú!', 'Guanyes tu!', 'You win!') : L('¡Has hecho 4 en raya!', 'Has fet 4 en ratlla!', 'You got 4 in a row!')) : '🎅 ' + L('¡La próxima vez será!', 'La propera vegada serà!', 'Next time!'), ...extra, ...(waitTxt ? [waitTxt] : [])], buttons: [again, out] });
  }
  if (wn !== W.me && wn !== 'd') sadTrombone();
  again.onclick = () => { onAgain(fx, again); };
  out.onclick = () => { fx.close(); onExit(); };
  return fx;
}

// ---------------------------------------------------------------- contra el Pare Noel
async function cpuGame(W) {
  W.me = 'r'; W.names = { r: myName(), y: L('Pare Noel', 'Pare Noel', 'Santa') }; W.figs = { r: FIG[figure()] || FIG.galleta, y: 'mem-13.webp' };
  let starter = 'r';
  W.onX = () => W.close();
  W.layout();
  while (W.alive) {
    W.G = emptyG(starter); drawAll(W); paintPlayers(W);
    W.say(starter === 'r' ? L('¡Empiezas tú!', 'Comences tu!', 'You start!') : L('Empieza el Pare Noel', 'Comença el Pare Noel', 'Santa starts'), 'goose', 1500);
    while (W.alive && !W.G.winner) {
      paintPlayers(W);
      if (W.G.turn === W.me) {
        let idleT = setTimeout(async () => { if (!W.alive) return; const go = await idleAsk(W); if (!go) { W.cancelInput?.(); W.close(); } }, IDLE_MS);
        const mv = await myTurnInput(W); clearTimeout(idleT);
        if (!mv || !W.alive) return;
        const r = dropRow(W.G.b, mv.c); W.hide = { r, c: mv.c };
        W.G = play(W.G, mv.c, 'me'); drawAll(W);
        await dropAnim(W, 'r', mv.c, r, mv.from); W.hide = null; drawAll(W);
      } else {
        rc(W.tray, el('div', { class: 'c4-traybox y off' }, dish(discEl('y', 'tray-disc'), 'y'), el('small', {}, '🎅 ' + L('El Pare Noel piensa…', 'El Pare Noel pensa…', 'Santa is thinking…'))));
        await sleep(650 + Math.random() * 500); if (!W.alive) return;
        const c = santaMove(W.G), r = dropRow(W.G.b, c);
        const tr = W.tray.getBoundingClientRect(), sr = W.stage.getBoundingClientRect();
        W.hide = { r, c }; W.G = play(W.G, c, 'santa'); drawAll(W);
        await dropAnim(W, 'y', c, r, { x: tr.left + tr.width / 2 - sr.left - W.S * .44, y: tr.top - sr.top }); W.hide = null; drawAll(W);
      }
    }
    if (!W.alive) return;
    const extra = await payFirst(W.G.winner === 'd' ? 'draw' : W.G.winner === W.me ? 'win' : 'lose');
    const next = await new Promise(res => celebrate(W, fx => { fx.close(); res(true); }, () => res(false), '', extra));
    if (!next) { W.close(); return; }
    starter = starter === 'r' ? 'y' : 'r';
  }
}

// ---------------------------------------------------------------- en línea
async function onlineGame(W, join) {
  const me = myUid();
  let gid = join, doc = null, closing = false, lobbyBox = null, people = [], query = '';
  if (!gid) {
    gid = newGid();
    await store.gPut('pgame', gid, { gid, game: 'c4', host: me, hostName: myName(), status: 'lobby', created: Date.now(), v: 0,
      pl: { [me]: { n: myName(), f: figure(), st: 'ok', seen: Date.now() } } });
  }
  W.gid = gid; W.layout();
  const opp = () => Object.keys(doc?.pl || {}).find(u => u !== me && doc.pl[u].st === 'ok' && (u === doc.red || u === doc.yel));
  const oppName = () => doc?.pl?.[opp()]?.n || '';
  // salir
  const cleanupAll = async () => {
    const others = Object.keys(doc?.pl || {});
    clearGameMsgs(gid, others);
    if (doc?.host === me) setTimeout(() => store.gDel('pgame', gid).catch(() => {}), 8000); // un momento después, para que la otra persona vea el final
    else store.gPatch('pgame', gid, { [`pl.${me}.st`]: 'gone' }).catch(() => {});
  };
  const leave = async () => {
    if (closing) return; closing = true;
    if (doc?.status === 'lobby') {
      if (doc.host === me) { await store.gTx('pgame', gid, x => x && x.status === 'lobby' ? { ...x, status: 'cancel', v: (x.v || 0) + 1 } : null).catch(() => {}); clearGameMsgs(gid, Object.keys(doc.pl || {})); store.gDel('pgame', gid).catch(() => {}); }
      else { store.gPatch('pgame', gid, { [`pl.${me}.st`]: 'no' }).catch(() => {}); if (doc.host) sendMsg({ gid, to: doc.host, tn: doc.hostName, k: 'no', g: 'c4', txt: L('Lo haré más tarde', 'Ho faré més tard', 'Maybe later') }).catch(() => {}); }
    } else if (doc?.status === 'play') {
      const myC = doc.red === me ? 'r' : 'y', other = myC === 'r' ? 'y' : 'r';
      await store.gTx('pgame', gid, x => x && x.status === 'play' ? { ...x, status: 'end', G: { ...x.G, winner: other, why: 'left' }, v: (x.v || 0) + 1 } : null).catch(() => {});
      await cleanupAll();
    } else await cleanupAll();
    W.close();
  };
  W.canLeaveQuiet = () => !doc || doc.status !== 'play';
  W.isHostLobby = () => doc?.status === 'lobby' && doc.host === me;
  W.hasInvited = u => ['inv', 'ok'].includes(doc?.pl?.[u]?.st);
  W.leaveQuiet = () => leave();
  W.onX = async () => {
    if (doc?.status === 'play') {
      const go = await popup(`<h2>🚪</h2><p style="font-size:18px">${L('Si sales ahora, gana la otra persona. ¿Seguro?', 'Si surts ara, guanya l’altra persona. Segur?', 'If you leave now the other player wins. Sure?')}</p>`,
        { cls: 'pch-xmas', buttons: [{ label: L('Seguir jugando', 'Continuar jugant', 'Keep playing'), value: false }, { label: L('Salir', 'Sortir', 'Leave'), value: true, cls: 'btn-ghost' }] });
      if (!go) return;
    }
    leave();
  };
  // ---- vestíbulo: a quién invito
  const isOn = o => !!o && o.st === 'online' && Date.now() - (o.at || 0) < 150000;
  const loadPeople = async () => {
    if (doc?.status !== 'lobby') return;
    const [names, onl] = await Promise.all([store.gList('names').catch(() => []), store.gList('online').catch(() => [])]);
    const on = {}; onl.forEach(o => { if (o?.uid) on[o.uid] = o; });
    const m = new Map();
    names.forEach(nm => { if (nm?.uid && nm.uid !== me && !m.has(nm.uid)) m.set(nm.uid, { uid: nm.uid, n: on[nm.uid]?.n || nm.name || '—' }); });
    onl.forEach(o => { if (o?.uid && o.uid !== me && !m.has(o.uid)) m.set(o.uid, { uid: o.uid, n: o.n || '—' }); });
    people = [...m.values()].map(p => ({ ...p, f: on[p.uid]?.f || 'galleta', on: isOn(on[p.uid]) })).sort((a, b) => (b.on - a.on) || String(a.n).localeCompare(String(b.n)));
    drawLobby();
  };
  const pIv = setInterval(loadPeople, 10000); W.cleanups.push(() => clearInterval(pIv));
  const search = el('input', { type: 'search', class: 'pch-search', placeholder: '🔍 ' + L('Buscar…', 'Cercar…', 'Search…'), oninput: e => { query = e.target.value; drawLobby(); } });
  const lobby = el('div', { class: 'cc8-endcard pch-lobby' });
  lobbyBox = el('div', { class: 'cc8-end pch-lobby-back' }, lobby); W.wrap.append(lobbyBox);
  const invite = async o => {
    const ta = el('textarea', { class: 'pch-msg-in', rows: 3, maxlength: 200, placeholder: L('Escribe tu mensaje (opcional)…', 'Escriu el teu missatge (opcional)…', 'Write your message (optional)…') });
    const how = await popup(el('div', { class: 'pch-invbox' }, el('h2', {}, '✉️ ' + L(`Invitar a ${o.n}`, `Convidar ${o.n}`, `Invite ${o.n}`)),
      el('p', { class: 'muted pch-appmsg' }, '🔴🟡 «' + L(`${myName()} quiere jugar contigo al 4 en raya. ¿Juegas?`, `${myName()} vol jugar amb tu al 4 en ratlla. Hi jugues?`, `${myName()} wants to play Connect 4 with you. Will you play?`) + '»'), ta),
      { cls: 'pch-xmas', buttons: [{ label: '🔴🟡 ' + L('Mensaje de la app', 'Missatge de l’app', 'App message'), value: 'app' }, { label: '✍️ ' + L('Enviar mi mensaje', 'Enviar el meu missatge', 'Send my message'), value: 'mine' }, { label: L('Cancelar', 'Cancel·lar', 'Cancel'), value: null, cls: 'btn-ghost' }] });
    if (!how) return;
    try {
      await store.gTx('pgame', gid, d => d && d.status === 'lobby' ? { ...d, pl: { ...d.pl, [o.uid]: { n: o.n, f: o.f, st: 'inv', seen: 0 } }, v: (d.v || 0) + 1 } : null);
      await sendMsg({ gid, to: o.uid, tn: o.n, k: 'inv', g: 'c4', txt: how === 'mine' ? ta.value.trim().slice(0, 200) : '' });
      toast('✉️ ' + L(`Invitación enviada a ${o.n}`, `Invitació enviada a ${o.n}`, `Invitation sent to ${o.n}`));
    } catch (e) { toast('⚠️ ' + (e.code || e.message), 5000); }
  };
  function drawLobby() {
    if (!doc || doc.status !== 'lobby') return;
    const host = doc.host === me, pls = doc.pl || {};
    const qn = query.trim().toLowerCase();
    const list = people.filter(p => !qn || String(p.n).toLowerCase().includes(qn));
    const stTag = st => st === 'ok' ? el('span', { class: 'pch-tag ok' }, '✅ ' + L('juega', 'juga', 'playing')) : st === 'inv' ? el('span', { class: 'pch-tag inv' }, '✉️ ' + L('invitado', 'convidat', 'invited')) : st === 'no' ? el('span', { class: 'pch-tag' }, '🙅 ' + L('ahora no', 'ara no', 'not now')) : null;
    const lastFrom = u => boxList().find(m => m.gid === gid && m.from === u && m.txt);
    rc(lobby,
      el('h2', {}, '🌐 ' + L('4 en raya en línea', '4 en ratlla en línia', 'Online Connect 4')),
      host ? el('p', { class: 'muted' }, L('Toca ▶ para invitar a alguien que tenga la app abierta (🟢). En cuanto diga que sí, empieza la partida.', 'Toca ▶ per convidar algú que tingui l’app oberta (🟢). Quan digui que sí, comença la partida.', 'Tap ▶ to invite someone with the app open (🟢). The game starts as soon as they accept.'))
        : el('p', { class: 'pch-wait' }, '⏳ ' + L(`Esperando a ${doc.hostName || ''}…`, `Esperant ${doc.hostName || ''}…`, `Waiting for ${doc.hostName || ''}…`)),
      host ? el('div', { class: 'pch-sec' }, people.length > 4 ? search : null,
        el('div', { class: 'pch-on-list' }, ...(list.length ? list.map(p => {
          const st = pls[p.uid]?.st, lm = lastFrom(p.uid);
          return el('div', { class: 'pch-on-row' + (p.on ? ' on' : '') }, el('i', { class: 'pch-on-dot' + (p.on ? ' on' : '') }), el('img', { src: FIG[p.f] || FIG.galleta, alt: '' }),
            el('b', {}, p.n, lm ? el('em', { class: 'pch-lob-msg' }, ' 💬 ' + lm.txt) : null),
            stTag(st) && st !== 'no' ? stTag(st) : p.on ? el('button', { type: 'button', class: 'pch-go no-delay', onclick: () => invite(p) }, '▶ ' + L('Invitar', 'Convidar', 'Invite')) : (st === 'no' ? stTag(st) : el('span', { class: 'pch-go off' }, L('Fuera de línea', 'Fora de línia', 'Offline'))));
        }) : [el('p', { class: 'muted' }, L('Aún no hay nadie más', 'Encara no hi ha ningú més', 'Nobody else yet'))]))) : null,
      el('div', { class: 'pch-lob-btns' },
        el('button', { type: 'button', class: 'btn no-delay', onclick: () => openInbox() }, '💬 ' + L('Mensajes', 'Missatges', 'Messages')),
        el('button', { type: 'button', class: 'btn no-delay pch-santa', onclick: async () => { await leave(); setTimeout(() => openC4(W.ctx, { mode: 'cpu' }), 450); } }, '🎅 ' + L('Jugar contra el Pare Noel', 'Jugar contra el Pare Noel', 'Play against Santa')),
        el('button', { type: 'button', class: 'btn btn-ghost no-delay', onclick: () => leave() }, '⏰ ' + L('Lo haré más tarde', 'Ho faré més tard', 'Later'))));
  }
  W.cleanups.push(onBox(() => { drawLobby(); paintChatBadge(); W.drawChat?.(); }));
  // ---- mensajes durante la partida
  const paintChatBadge = () => { const n = boxList().filter(m => m.gid === gid && m.to === me && !m.read).length; W.chatBtn.classList.toggle('new', n > 0); W.chatBtn.dataset.n = n || ''; };
  W.openChat = () => {
    if (document.querySelector('.c4-chat')) return;
    const list = el('div', { class: 'c4-chat-list' });
    const ta = el('input', { type: 'text', class: 'c4-chat-in', maxlength: 200, placeholder: L('Escribe un mensaje…', 'Escriu un missatge…', 'Write a message…') });
    const send = async () => { const t = ta.value.trim(); const o = opp(); if (!t || !o) return; ta.value = ''; await sendMsg({ gid, to: o, tn: oppName(), k: 'msg', g: 'c4', txt: t }).catch(e => toast('⚠️ ' + e.message)); };
    ta.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
    const box = el('div', { class: 'c4-chat' }, el('div', { class: 'c4-chat-head' }, el('b', {}, '💬 ' + (oppName() || L('Mensajes', 'Missatges', 'Messages'))), el('button', { type: 'button', class: 'no-delay', onclick: () => { box.remove(); W.drawChat = null; } }, '✕')),
      list, el('div', { class: 'c4-chat-row' }, ta, el('button', { type: 'button', class: 'btn no-delay', onclick: send }, '📨')),
      el('div', { class: 'c4-quick' }, ...['👋', '😂', '👏', '🤔', '🎄', '😱'].map(q => el('button', { type: 'button', class: 'no-delay', onclick: () => { ta.value += q; ta.focus(); } }, q))));
    W.drawChat = () => {
      const ms = boxList().filter(m => m.gid === gid && (m.k === 'msg' || m.txt)).slice().reverse();
      rc(list, ...(ms.length ? ms.map(m => el('div', { class: 'c4-bubble' + (m.from === me ? ' mine' : '') }, el('small', {}, m.from === me ? L('Tú', 'Tu', 'You') : m.fn), m.txt)) : [el('p', { class: 'muted' }, L('Aún no hay mensajes', 'Encara no hi ha missatges', 'No messages yet'))]));
      list.scrollTop = list.scrollHeight; markRead();
    };
    W.wrap.append(box); W.drawChat(); setTimeout(() => ta.focus(), 100);
  };
  // ---- en directo
  let lastV = -1, chain = Promise.resolve(), myTurnV = -1, endedShown = '', idleT = 0, askedOpp = 0;
  const unwatch = store.gWatch('pgame', gid, d => {
    if (d === undefined) return;
    if (!d) { if (doc?.status === 'end' || closing) { W.otherGone = true; return; } toast(L('La partida se ha cerrado', 'La partida s’ha tancat', 'The game was closed'), 3500); W.close(); return; }
    const prev = doc; doc = d;
    if (d.status === 'cancel') { clearGameMsgs(gid); if (!closing) { toast('🚪 ' + L('Se ha anulado la partida', 'S’ha anul·lat la partida', 'The game was cancelled'), 3500); W.close(); } return; }
    if (d.status === 'lobby') {
      if (d.pl?.[me]?.st === 'inv') store.gPatch('pgame', gid, { [`pl.${me}.st`]: 'ok', [`pl.${me}.seen`]: Date.now() }).catch(() => {});
      // el anfitrión: en cuanto alguien acepta, empieza la partida
      if (d.host === me) {
        const g = Object.keys(d.pl).find(u => u !== me && d.pl[u].st === 'ok');
        if (g) store.gTx('pgame', gid, x => {
          if (!x || x.status !== 'lobby' || x.pl?.[g]?.st !== 'ok') return null;
          const pl = {}; Object.entries(x.pl).forEach(([u, p]) => { pl[u] = u === me || u === g ? { ...p, seen: Date.now() } : { ...p, st: p.st === 'inv' ? 'no' : p.st }; });
          return { ...x, pl, status: 'play', red: me, yel: g, G: emptyG('r'), tt: Date.now(), startAt: Date.now(), again: {}, v: (x.v || 0) + 1 };
        }).catch(e => console.warn(e));
      }
      if (!people.length) loadPeople(); else drawLobby();
      return;
    }
    if (d.red !== me && d.yel !== me) { toast(L('La partida ya ha empezado sin ti', 'La partida ja ha començat sense tu', 'The game started without you'), 4000); W.close(); return; }
    if (lobbyBox) { lobbyBox.remove(); lobbyBox = null; }
    W.me = d.red === me ? 'r' : 'y';
    W.names = { r: d.pl[d.red]?.n || '—', y: d.pl[d.yel]?.n || '—' }; W.figs = { r: FIG[d.pl[d.red]?.f] || FIG.galleta, y: FIG[d.pl[d.yel]?.f] || FIG.galleta };
    W.chatBtn.style.display = '';
    if (d.v === lastV) return; lastV = d.v;
    if (d.status === 'end' || d.G?.winner) W.cancelInput?.(); // se ha acabado mientras esperaba mi jugada
    chain = chain.then(() => showState(prev, d)).catch(e => console.warn(e));
  });
  W.cleanups.push(() => { try { unwatch?.(); } catch {} });
  const beat = () => { if (doc?.pl?.[me] && W.alive) store.gPatch('pgame', gid, { [`pl.${me}.seen`]: Date.now() }).catch(() => {}); };
  beat(); const bIv = setInterval(beat, 10000); W.cleanups.push(() => clearInterval(bIv));
  // la otra persona no tira: después de 45 s (o si ha cerrado la app) te pregunto si esperas o acabas
  const wIv = setInterval(async () => {
    const d = doc; if (!d || d.status !== 'play' || d.G.winner || d.G.turn === W.me || !W.alive) return;
    const o = opp(); const idle = Date.now() - Math.max(d.tt || 0, d.pl[o]?.ping || 0);
    if (idle < OPP_IDLE_MS || askedOpp === d.v || document.querySelector('.c4-oppidle')) return;
    askedOpp = d.v;
    const r = await popup(el('div', { class: 'c4-idle c4-oppidle' }, el('h2', {}, '⏳ ' + L(`${oppName()} no tira`, `${oppName()} no tira`, `${oppName()} isn’t playing`)),
      el('p', {}, L('¿Quieres esperar un poco más o acabar la partida? (Si la acabas, ganas tú.)', 'Vols esperar una mica més o acabar la partida? (Si l’acabes, guanyes tu.)', 'Wait a bit longer or end the game? (If you end it, you win.)'))),
      { cls: 'pch-xmas', buttons: [{ label: '⏳ ' + L('Esperar', 'Esperar', 'Wait'), value: 'wait' }, { label: '🏁 ' + L('Acabar la partida', 'Acabar la partida', 'End the game'), value: 'end', cls: 'btn-ghost' }] });
    if (r === 'end' && doc?.status === 'play' && !doc.G.winner && doc.G.turn !== W.me) {
      await store.gTx('pgame', gid, x => x && x.status === 'play' && !x.G.winner ? { ...x, status: 'end', G: { ...x.G, winner: W.me, why: 'idle' }, v: (x.v || 0) + 1 } : null).catch(() => {});
    } else if (r === 'wait') askedOpp = -2 - Date.now(); // vuelve a preguntar dentro de un rato
    if (r === 'wait') setTimeout(() => { if (askedOpp < -1) askedOpp = -1; }, OPP_IDLE_MS);
  }, 3000);
  W.cleanups.push(() => clearInterval(wIv));

  async function showState(prev, d) {
    const G = d.G, pG = prev?.G;
    // la jugada del otro: su ficha va hasta la columna y cae
    if (pG && G.last && (G.n || 0) > (pG.n || 0) && G.last.by !== me && pG.b !== G.b) {
      const { r, c } = G.last, p = at(G.b, r, c);
      W.G = { ...G, win: '' }; W.hide = { r, c }; drawAll(W); paintPlayers(W);
      const sr = W.stage.getBoundingClientRect();
      await dropAnim(W, p, c, r, { x: (p === 'r' ? 0 : COLS * W.S - W.S), y: -W.S * .9 + (sr ? 0 : 0) });
      W.hide = null;
    }
    W.G = G; drawAll(W); paintPlayers(W);
    if (d.status === 'end' || G.winner) {
      W.cancelInput?.(); clearTimeout(idleT);
      const ek = G.b + G.winner + (G.why || '') + (d.startAt || ''); if (endedShown === ek) return; endedShown = ek;
      document.querySelectorAll('.gfx-back, .gfx-fw').forEach(x => x.remove());
      // «volver a jugar»: los dos tienen que pulsarlo
      const onAgain = async (fx, btn) => {
        btn.disabled = true; btn.textContent = '⏳ ' + L(`Esperando a ${oppName()}…`, `Esperant ${oppName()}…`, `Waiting for ${oppName()}…`);
        if (W.otherGone || doc?.pl?.[opp()]?.st === 'gone') { toast(L(`${oppName()} ya ha salido`, `${oppName()} ja ha sortit`, `${oppName()} has left`), 3500); return; }
        await store.gPatch('pgame', gid, { [`again.${me}`]: true }).catch(() => {});
      };
      // los que han jugado hasta el final (no quien se ha ido)
      const extra = d.G.why === 'left' && d.G.winner !== W.me ? [] : await payFirst(G.winner === 'd' ? 'draw' : G.winner === W.me ? 'win' : 'lose');
      W.curFx = await celebrate(W, onAgain, () => leave(), '', extra);
      return;
    }
    if (prev?.status === 'end' && d.status === 'play') { W.curFx?.close?.(); W.curFx = null; W.say(G.turn === W.me ? L('¡Empiezas tú!', 'Comences tu!', 'You start!') : L(`Empieza ${W.names[G.turn]}`, `Comença ${W.names[G.turn]}`, `${W.names[G.turn]} starts`), 'goose', 1600); }
    if (G.turn === W.me && myTurnV !== d.v) {
      myTurnV = d.v; try { navigator.vibrate?.(80); } catch {}
      clearTimeout(idleT);
      idleT = setTimeout(async () => {
        if (!W.alive || doc?.v !== d.v) return;
        const go = await idleAsk(W);
        if (!go) return leave();
        store.gPatch('pgame', gid, { [`pl.${me}.ping`]: Date.now() }).catch(() => {});
      }, IDLE_MS);
      const mv = await myTurnInput(W); clearTimeout(idleT);
      if (!mv || !W.alive || doc?.v !== d.v) return;
      const r = dropRow(G.b, mv.c); W.hide = { r, c: mv.c }; W.G = play(G, mv.c, me); drawAll(W);
      const anim = dropAnim(W, W.me, mv.c, r, mv.from);
      const ok = await store.gTx('pgame', gid, x => {
        if (!x || x.v !== d.v || x.status !== 'play') return null;
        const g2 = play(x.G, mv.c, me); if (!g2) return null;
        const out = { ...x, G: g2, tt: Date.now(), v: x.v + 1 };
        if (g2.winner) { out.status = 'end'; out.endAt = Date.now(); }
        return out;
      }).catch(() => false);
      await anim; W.hide = null;
      if (!ok) { W.G = doc.G; drawAll(W); myTurnV = -1; }
    } else if (G.turn !== W.me) rc(W.tray, el('div', { class: 'c4-traybox ' + G.turn + ' off' }, dish(discEl(G.turn, 'tray-disc'), G.turn), el('small', {}, '⏳ ' + L(`Tira ${W.names[G.turn]}…`, `Tira ${W.names[G.turn]}…`, `${W.names[G.turn]} is playing…`))));
  }
  // el anfitrión: cuando los dos quieren volver a jugar, partida nueva (empieza el otro)
  const aIv = setInterval(() => {
    const d = doc; if (!d || d.host !== me || d.status !== 'end' || !d.red || !d.yel) return;
    if (d.again?.[d.red] && d.again?.[d.yel]) store.gTx('pgame', gid, x => {
      if (!x || x.status !== 'end' || !x.again?.[x.red] || !x.again?.[x.yel]) return null;
      const st = x.G.starter === 'r' ? 'y' : 'r';
      return { ...x, status: 'play', G: emptyG(st), again: {}, tt: Date.now(), v: (x.v || 0) + 1 };
    }).catch(() => {});
  }, 1000);
  W.cleanups.push(() => clearInterval(aIv));
}
