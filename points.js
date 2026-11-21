// (V24.2) ⭐ MARCADOR DE NAVIDAD — para TODOS (galletas, árboles y gnomos). No tiene nada que ver con el marcador 🍄 de los gnomos.
// · Cada vez que alguien ACABA un juego (los que elige la administradora): la 1.ª vez +2; las siguientes +1,
//   como mucho 5 veces al día por juego. Dulce Navidad cuenta al pasar los 5 niveles.
// · Cada persona guarda lo suyo en pts/{uid} { uid, name, fig, total, games:{id:{n,d,dn}}, hist:[{g,p,at}], at }.
// · Todos ven el top 5 (y su puesto); la administradora ve la clasificación entera.
// · El 1 de diciembre todo empieza de 0 (lo de antes era de prueba).
import { el, popup, toast, confetti } from './fx.js';
import { store } from './store.js';
import { chime } from './sound.js';
import { getLang } from './i18n.js';
import { S, figure } from './app.js';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const FIRST = 2, AGAIN = 1, MAX_DAY = 5, HIST = 120;
const FIG = { galleta: 'galleta.png', arbol: 'arbol.png', gnomo: 'gnomo.png' };
// juegos que pueden dar puntos (id → nombre). Los días se refieren a la casilla.
export const PGAMES = [
  ['d1', 1, () => L('Los gorros', 'Els barrets', 'The hats')],
  ['d2', 2, () => L('El duende de los regalos (Mediano o Difícil)', 'El follet dels regals (Mitjà o Difícil)', 'The present elf (Medium or Hard)')],
  ['d3', 3, () => L('Sudoku', 'Sudoku', 'Sudoku')],
  ['d4', 4, () => L('Los renos', 'Els rens', 'The reindeer')],
  ['d5', 5, () => L('Desafío de colores', 'Desafiament de colors', 'Colour challenge')],
  ['d6', 6, () => L('Las diferencias', 'Les diferències', 'Spot the difference')],
  ['d7', 7, () => L('Puzle del tren', 'Trencaclosques del tren', 'Train puzzle')],
  ['d8', 8, () => L('Decora el árbol', 'Decora l’arbre', 'Decorate the tree')],
  ['candy8', 8, () => L('Dulce Navidad', 'Dolç Nadal', 'Sweet Christmas')],
  ['d9', 9, () => L('Papá Noel dice', 'El Pare Noel diu', 'Santa says')],
  ['d10', 10, () => L('La oca de Navidad', 'L’oca de Nadal', 'The Christmas goose game')],
  ['d11', 11, () => L('El laberinto', 'El laberint', 'The maze')],
  ['d12', 12, () => L('El parchís de Navidad (en línea)', 'El parxís de Nadal (en línia)', 'Christmas ludo (online)')],
  ['c4', 1, () => L('El 4 en raya (1.ª partida)', 'El 4 en ratlla (1a partida)', 'Connect 4 (first game)')],
  ['d13', 13, () => L('El solitario de Navidad', 'El solitari de Nadal', 'Christmas solitaire')],
  ['d14', 14, () => L('Atrapa los regalos', 'Atrapa els regals', 'Catch the presents')],
  ['d15', 15, () => L('Ordena las bolas', 'Ordena les boles', 'Sort the baubles')],
  ['d16', 16, () => L('Los marcianitos de Navidad (100 puntos)', 'Els marcianets de Nadal (100 punts)', 'Christmas space invaders (100 points)')],
  ['d17', 17, () => L('Tres en raya', 'Tres en ratlla', 'Noughts and crosses')],
  ['d18', 18, () => L('Puzle de Papá Noel', 'Trencaclosques del Pare Noel', 'Santa puzzle')],
  ['d19', 19, () => L('Código secreto', 'Codi secret', 'Secret code')],
  ['d21', 21, () => L('Puzle deslizante', 'Trencaclosques lliscant', 'Sliding puzzle')],
  ['d22', 22, () => L('Sopa de letras', 'Sopa de lletres', 'Word search')],
  ['d23', 23, () => L('Crucigrama', 'Mots encreuats', 'Crossword')],
].map(([id, day, name]) => ({ id, day, name }));
export const pgName = id => PGAMES.find(g => g.id === id)?.name() || id;
export const pgOn = id => !!PGAMES.find(g => g.id === id) && !(S.config?.ptsOff || {})[id];

const decStartMs = () => Date.UTC(S.config?.year || new Date().getFullYear(), 11, 1, -1);
// (V25.1) el marcador se cierra el 24 de diciembre a las 23:59 (hora de España): después ya no se suman puntos
export const ptsEndMs = () => Date.UTC(S.config?.year || new Date().getFullYear(), 11, 24, 22, 59);
export const ptsClosed = () => Date.now() >= ptsEndMs();
const madridDay = (t = Date.now()) => new Date(t).toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
const ok = x => x && !x.__denied;
// lo de antes del 1 de diciembre no cuenta a partir de ese día
const fresh = d => ok(d) && !(Date.now() >= decStartMs() && (d.at || 0) < decStartMs()) ? d : null;
const myName = () => (S.profile?.who || S.profile?.name || '—').trim();

let MINE = null;
async function loadMine() {
  if (!S.user) return null;
  const d = fresh(await store.gDoc('pts', S.user.uid).catch(() => null));
  MINE = d || { uid: S.user.uid, total: 0, games: {}, hist: [], at: 0 };
  return MINE;
}
export async function loadAllPts() {
  const all = (await store.gList('pts').catch(() => [])).map(fresh).filter(Boolean).filter(d => (d.total || 0) > 0);
  all.sort((a, b) => (b.total || 0) - (a.total || 0) || (a.at || 0) - (b.at || 0));
  return all;
}

// ---- ¡juego acabado! (lo llaman las casillas y Dulce Navidad)
export async function awardGame(id) {
  if (!S.user || !pgOn(id)) return 0;
  if (ptsClosed()) { toast('🏁 ' + L('El Marcador de Navidad ya está cerrado (24 de diciembre a las 23:59).', 'El Marcador de Nadal ja està tancat (24 de desembre a les 23:59).', 'The Christmas scoreboard is closed (24 December at 23:59).'), 4000); return 0; }
  const d = await loadMine(); if (!d) return 0;
  const g = { n: 0, d: '', dn: 0, ...(d.games?.[id] || {}) }, today = madridDay();
  let p;
  if (!g.n) p = FIRST;
  else {
    if (g.d !== today) { g.d = today; g.dn = 0; }
    if (g.dn >= MAX_DAY) { toast('⭐ ' + L(`Hoy ya has sumado ${MAX_DAY} veces con este juego. ¡Mañana más!`, `Avui ja has sumat ${MAX_DAY} cops amb aquest joc. Demà més!`, `You've already scored ${MAX_DAY} times with this game today. More tomorrow!`), 4000); return 0; }
    g.dn++; p = AGAIN;
  }
  g.n++;
  const now = Date.now();
  const next = { uid: S.user.uid, name: myName(), fig: figure(), total: (d.total || 0) + p, games: { ...(d.games || {}), [id]: g },
    hist: [{ g: id, p, at: now }, ...(d.hist || [])].slice(0, HIST), at: now };
  try { await store.gPut('pts', S.user.uid, next); MINE = next; } catch (e) { console.warn(e); return 0; }
  celebrate(id, p, next.total);
  paintPtsBars();
  return p;
}
// (V28) solo la primera vez (el 4 en raya): +2 y ya está
export async function awardOnce(id) {
  if (!S.user || !pgOn(id)) return 0;
  const d = await loadMine(); if (!d || d.games?.[id]?.n) return 0;
  return awardGame(id);
}
// (V26.3) cuántos puntos daría ahora acabar este juego (para explicarlo en pantalla): { on, p, left }
export async function nextAward(id) {
  if (!S.user || !pgOn(id) || ptsClosed()) return { on: false, p: 0, left: 0 };
  const d = await loadMine(); const g = { n: 0, d: '', dn: 0, ...(d?.games?.[id] || {}) };
  if (!g.n) return { on: true, p: FIRST, left: MAX_DAY };
  const used = g.d === madridDay() ? g.dn : 0;
  return { on: true, p: used >= MAX_DAY ? 0 : AGAIN, left: Math.max(0, MAX_DAY - used) };
}
// (V25.3) perder (la oca contra la máquina): −1, como mucho una vez al día por juego; nunca por debajo de 0
export async function penaltyGame(id) {
  if (!S.user || !pgOn(id) || ptsClosed()) return 0;
  const d = await loadMine(); if (!d) return 0;
  const g = { n: 0, d: '', dn: 0, ...(d.games?.[id] || {}) }, today = madridDay();
  if (g.pd === today || !(d.total > 0)) return 0;
  g.pd = today;
  const now = Date.now();
  const next = { uid: S.user.uid, name: myName(), fig: figure(), total: d.total - 1, games: { ...(d.games || {}), [id]: g },
    hist: [{ g: id, p: -1, at: now }, ...(d.hist || [])].slice(0, HIST), at: now };
  try { await store.gPut('pts', S.user.uid, next); MINE = next; paintPtsBars(); return 1; } catch (e) { console.warn(e); return 0; }
}
// (V26) parchís en línea: puntos según el puesto (con 4 jugadores: 4, 3, 2 y 1). Cuenta como mucho 5 partidas al día.
export async function awardPlace(id, p) {
  if (!S.user || !pgOn(id) || !(p > 0)) return 0;
  if (ptsClosed()) { toast('🏁 ' + L('El Marcador de Navidad ya está cerrado (24 de diciembre a las 23:59).', 'El Marcador de Nadal ja està tancat (24 de desembre a les 23:59).', 'The Christmas scoreboard is closed (24 December at 23:59).'), 4000); return 0; }
  const d = await loadMine(); if (!d) return 0;
  const g = { n: 0, d: '', dn: 0, ...(d.games?.[id] || {}) }, today = madridDay();
  if (g.d !== today) { g.d = today; g.dn = 0; }
  if (g.dn >= MAX_DAY) { toast('⭐ ' + L(`Hoy ya has sumado ${MAX_DAY} veces con este juego. ¡Mañana más!`, `Avui ja has sumat ${MAX_DAY} cops amb aquest joc. Demà més!`, `You've already scored ${MAX_DAY} times with this game today. More tomorrow!`), 4000); return 0; }
  g.dn++; g.n++; p = Math.min(4, Math.round(p));
  const now = Date.now();
  const next = { uid: S.user.uid, name: myName(), fig: figure(), total: (d.total || 0) + p, games: { ...(d.games || {}), [id]: g },
    hist: [{ g: id, p, at: now }, ...(d.hist || [])].slice(0, HIST), at: now };
  try { await store.gPut('pts', S.user.uid, next); MINE = next; } catch (e) { console.warn(e); return 0; }
  celebrate(id, p, next.total); paintPtsBars();
  return p;
}
// (V26) abandonar una partida en línea (o no acabarla): −1 cada vez; nunca por debajo de 0
export async function penaltyAbandon(id) {
  if (!S.user || !pgOn(id) || ptsClosed()) return 0;
  const d = await loadMine(); if (!d || !(d.total > 0)) return 0;
  const now = Date.now();
  const next = { uid: S.user.uid, name: myName(), fig: figure(), total: d.total - 1, games: { ...(d.games || {}) },
    hist: [{ g: id, p: -1, at: now }, ...(d.hist || [])].slice(0, HIST), at: now };
  try { await store.gPut('pts', S.user.uid, next); MINE = next; paintPtsBars(); return 1; } catch (e) { console.warn(e); return 0; }
}
function celebrate(id, p, total) {
  try { chime(); } catch {}
  const b = el('div', { class: 'pt-pop' }, el('div', { class: 'pt-pop-star' }, '⭐'), el('b', {}, '+' + p),
    el('span', {}, L('Marcador de Navidad', 'Marcador de Nadal', 'Christmas scoreboard')), el('small', {}, `${pgName(id)} · ${total} ${L('puntos', 'punts', 'points')}`));
  document.body.append(b); setTimeout(() => b.classList.add('out'), 2600); setTimeout(() => b.remove(), 3200);
}

// ---- botón con el nombre de cada uno (en la portada)
const bars = new Set();
export function ptsBar() {
  const b = el('button', { type: 'button', class: 'pt-bar no-delay', onclick: () => openPoints() });
  bars.add(b); paintBar(b);
  if (!MINE) loadMine().then(() => paintPtsBars()).catch(() => {});
  return b;
}
function paintBar(b) {
  b.replaceChildren(el('span', { class: 'pt-bar-star' }, '⭐'),
    el('span', { class: 'pt-bar-txt' }, el('small', {}, L('Marcador de Navidad', 'Marcador de Nadal', 'Christmas scoreboard')), el('b', { class: 'pt-name' }, myName())),
    el('span', { class: 'pt-bar-num' }, el('b', {}, String(MINE?.total || 0)), el('small', {}, L('puntos', 'punts', 'points'))));
}
export function paintPtsBars() { bars.forEach(b => { if (!b.isConnected) bars.delete(b); else paintBar(b); }); }

// ---- el marcador: mi tarjeta, el top 5 y mi historial
const when = t => new Date(t).toLocaleString(getLang() === 'en' ? 'en-GB' : getLang() === 'ca' ? 'ca-ES' : 'es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const MEDAL = ['🥇', '🥈', '🥉', '4', '5'];
export async function openPoints() {
  const [me, all] = await Promise.all([loadMine(), loadAllPts()]);
  paintPtsBars();
  const pos = all.findIndex(d => d.uid === S.user?.uid) + 1;
  const top = all.slice(0, 5);
  const row = (d, i) => el('div', { class: 'pt-row' + (i < 3 ? ' p' + (i + 1) : '') + (d.uid === S.user?.uid ? ' me' : '') },
    el('span', { class: 'pt-medal' }, MEDAL[i] || String(i + 1)), el('img', { src: FIG[d.fig] || FIG.galleta, alt: '' }),
    el('b', { class: 'pt-name' }, d.name || '—'), el('span', { class: 'pt-num' }, String(d.total || 0)));
  const podium = top.length ? el('div', { class: 'pt-list' }, ...top.map(row))
    : el('p', { class: 'pt-empty' }, L('Todavía nadie tiene puntos. ¡Sé el primero!', 'Encara ningú no té punts. Sigues el primer!', 'Nobody has points yet. Be the first!'));
  const mine = pos > 5 ? el('div', { class: 'pt-list pt-mine' }, el('small', {}, '…'), row(all[pos - 1], pos - 1)) : null;
  const hist = (me?.hist || []);
  const box = el('div', { class: 'pt-box' },
    el('div', { class: 'pt-head' }, el('div', { class: 'pt-head-star' }, '⭐'),
      el('h2', {}, L('Marcador de Navidad', 'Marcador de Nadal', 'Christmas scoreboard')),
      ptsClosed() ? el('p', { class: 'pt-closed' }, '🏁 ' + L('¡Cerrado! Clasificación final', 'Tancat! Classificació final', 'Closed! Final ranking')) : null,
      el('p', { class: 'pt-rule' }, L('Acaba juegos y suma: la 1.ª vez ', 'Acaba jocs i suma: la 1a vegada ', 'Finish games and score: 1st time '), el('b', {}, '+2'),
        L(' · cada vez más ', ' · cada cop més ', ' · each time after '), el('b', {}, '+1'), L(` (hasta ${MAX_DAY} al día por juego) · hasta el 24 de diciembre a las 23:59`, ` (fins a ${MAX_DAY} al dia per joc) · fins al 24 de desembre a les 23:59`, ` (up to ${MAX_DAY} a day per game) · until 24 December at 23:59`))),
    el('div', { class: 'pt-me' }, el('img', { src: FIG[figure()] || FIG.galleta, alt: '' }),
      el('div', {}, el('b', { class: 'pt-name' }, myName()), el('small', {}, pos ? L(`Vas ${pos}.º`, `Vas ${pos}è`, `You are #${pos}`) : L('Aún sin puntos', 'Encara sense punts', 'No points yet'))),
      el('div', { class: 'pt-me-num' }, el('b', {}, String(me?.total || 0)), el('small', {}, L('puntos', 'punts', 'points')))),
    el('h3', {}, '🏆 ' + L('Los 5 primeros', 'Els 5 primers', 'Top 5')), podium, mine,
    el('h3', {}, '📜 ' + L('Mi historial', 'El meu historial', 'My history')),
    hist.length ? el('div', { class: 'pt-hist' }, ...hist.map(h => el('div', { class: 'pt-hrow' }, el('b', { class: h.p < 0 ? 'neg' : '' }, (h.p > 0 ? '+' : '') + h.p), el('span', {}, pgName(h.g)), el('small', {}, when(h.at)))))
      : el('p', { class: 'pt-empty' }, L('Aquí verás cada punto que ganes.', 'Aquí veuràs cada punt que guanyis.', 'Every point you win will show here.')),
    figure() === 'gnomo' ? el('p', { class: 'pt-note' }, '🍄 ' + L('Este no es el marcador de los gnomos: ese es el de la seta, abajo a la izquierda.', 'Aquest no és el marcador dels gnoms: aquest és el del bolet, a baix a l’esquerra.', 'This is not the gnome scoreboard: that one is the mushroom, bottom left.')) : null);
  if (pos === 1 && (me?.total || 0) > 0) setTimeout(() => { try { confetti(120); } catch {} }, 400);
  popup(box, { cls: 'pt-pop-wrap', outside: true, buttons: [{ label: '🎄 OK', value: true }] });
}

// ---- Configuración (administradora)
export async function pointsAdmin(root) {
  const put = (...k) => root.replaceChildren(...k.filter(Boolean));
  put(el('p', { class: 'muted' }, '❄ Cargando…'));
  const all = await loadAllPts();
  const off = { ...(S.config?.ptsOff || {}) };
  const checks = PGAMES.map(g => { const c = el('input', { type: 'checkbox' }); c.checked = !off[g.id]; return { g, c, node: el('label', { class: 'pt-adm-game' }, c, el('span', {}, `${g.name()}`, el('small', {}, ` · ${L('día', 'dia', 'day')} ${g.day}`))) }; });
  const save = el('button', { class: 'btn no-delay', onclick: async () => {
    const o = {}; checks.forEach(({ g, c }) => { if (!c.checked) o[g.id] = true; });
    try { await store.saveConfig({ ptsOff: o }); S.config.ptsOff = o; toast('💾 Guardado'); } catch (e) { toast('⚠️ ' + (e.code || e.message), 6000); }
  } }, '💾 Guardar juegos');
  const hist = d => popup(el('div', { class: 'pt-box' }, el('h2', {}, el('span', { class: 'pt-name' }, d.name || '—'), ' · ', String(d.total || 0)),
    el('div', { class: 'pt-hist' }, ...(d.hist || []).map(h => el('div', { class: 'pt-hrow' }, el('b', { class: h.p < 0 ? 'neg' : '' }, (h.p > 0 ? '+' : '') + h.p), el('span', {}, pgName(h.g)), el('small', {}, when(h.at)))))),
  { cls: 'small', outside: true, buttons: [{ label: 'OK', value: true }] });
  const ranking = all.length ? el('div', { class: 'pt-list' }, ...all.map((d, i) => el('div', { class: 'pt-row' + (i < 3 ? ' p' + (i + 1) : '') },
    el('span', { class: 'pt-medal' }, MEDAL[i] || String(i + 1)), el('img', { src: FIG[d.fig] || FIG.galleta, alt: '' }),
    el('b', { class: 'pt-name' }, d.name || '—'), el('span', { class: 'pt-num' }, String(d.total || 0)),
    el('button', { class: 'btn btn-ghost small-btn no-delay', onclick: () => hist(d) }, '📜'),
    el('button', { class: 'ed-del no-delay', title: 'Poner a 0', onclick: async () => {
      if (!await popup(`<h2>🗑️</h2><p>¿Poner a 0 los puntos de ${String(d.name || '').replace(/[<&>]/g, '')}? Se borra también su historial.</p>`, { cls: 'small', buttons: [{ label: 'No', value: false, cls: 'btn-ghost' }, { label: 'Sí', value: true }] })) return;
      try { await store.gDel('pts', d.uid || d.id); pointsAdmin(root); } catch (e) { toast('⚠️ ' + (e.code || e.message), 6000); }
    } }, '✕'))))
    : el('p', { class: 'muted' }, 'Todavía nadie tiene puntos.');
  put(el('p', { class: 'muted' }, `Para TODOS (galletas, árboles y gnomos). Cada vez que alguien acaba uno de estos juegos: la primera vez +${FIRST}; las siguientes +${AGAIN}, como mucho ${MAX_DAY} veces al día por juego. Dulce Navidad cuenta al pasar los 5 niveles. Todos ven los 5 primeros y su puesto. El 1 de diciembre empieza de 0 y se cierra el 24 de diciembre a las 23:59. (No tiene nada que ver con el marcador 🍄 de los gnomos.)`),
    el('h3', {}, '🎮 Juegos que dan puntos'), el('div', { class: 'pt-adm-games' }, ...checks.map(x => x.node)), save,
    el('h3', {}, '🏆 Clasificación completa'), ranking);
}
