// (V24) 🍄 EL JUEGO DE LOS GNOMOS — solo para quien tiene la figura de gnomo
//
// · La administradora prepara preguntas (de opciones o de respuesta escrita) y elige cuándo salen:
//   ya mismo, a una hora exacta o a una hora al azar dentro de una franja.
// · Carrera real: cada pregunta sigue abierta hasta que sale la siguiente.
//   El primero que acierta: +2 (y puede quitar 1 punto a quien quiera). El último en acertar: −1.
//   Quien falla: −1. Quien no contesta antes de que salga la siguiente: −1.
// · La administradora suma o resta puntos a mano (con el motivo).
// · Metas iguales para todos (p. ej. 10, 20 y 30 puntos) con un regalo distinto para cada persona, con foto.
// · El Gran premio (distinto para cada persona) es solo para quien gane el día 25. Si hay empate: pregunta de desempate.
//
// Datos en Firebase:
//   gnome/cfg     { ms:[10,20,30], prizes:{uid:{m0,m1,m2,g:{t,d,img}}}, delivered:{'uid_k':ms}, since, endAt }
//   gnome/players { list:[{uid,name}] }   (los gnomos; se actualiza desde el panel de la administradora)
//   gnome/sched   { list:[{id,at,until,mode,win,tie,to}] }   (solo horas: el texto de cada pregunta no se ve hasta que sale)
//   gnome/adj     { list:[{id,uid,pts,why,at}] }   (puntos puestos a mano)
//   gq/{id}       la pregunta (solo se puede leer a partir de su hora); la respuesta buena va como huella (hs)
//   gqk/{id}      la respuesta buena en claro (solo la administradora)
//   ga/{id}       las respuestas { uid:{n,a,ok,at,nm}, steal:{by,to,at}, ov:{uid:true/false} }
//   gimg/{uid_k}  foto de cada premio
import { el, popup, toast, confetti, sleep, esc } from './fx.js';
import { store } from './store.js';
import { shrink, lightbox } from './richact.js';
import { chime, fanfare, sadTrombone, pop, hohoho } from './sound.js';
import { getLang } from './i18n.js';
import { S, figure } from './app.js';
import { sha256Hex } from './version.js';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const FAR = Date.UTC(2100, 0, 1);
const KEYS = ['m0', 'm1', 'm2', 'm3', 'm4'];
const when = t => new Date(t).toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const gap = ms => ms < 60000 ? Math.round(ms / 1000) + ' s' : ms < 3600000 ? Math.round(ms / 60000) + ' min' : (ms / 3600000).toFixed(1).replace('.', ',') + ' h';
const hm = t => new Date(t).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
const toLocalInput = t => new Date(t - new Date(t).getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const newId = () => 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
// misma forma de escribir para comparar respuestas: sin mayúsculas, acentos, signos ni espacios de más
export const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const hashAns = (id, s) => sha256Hex(id + ':' + norm(s));
export const isGnome = () => figure() === 'gnomo';
const me = () => S.user?.uid;
const ok = x => x && !x.__denied;
const ls = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

// ================================================================ CÁLCULO DE LOS PUNTOS
const decStartMs = () => Date.UTC(S.config?.year || new Date().getFullYear(), 11, 1, -1);
export function msOf(cfg) { const m = (cfg?.ms || [10, 20, 30]).map(Number).filter(x => x > 0).sort((a, b) => a - b); return m.length ? m.slice(0, 5) : [10, 20, 30]; }
function sinceOf(cfg) { let s = +(cfg?.since || 0); if (Date.now() >= decStartMs()) s = Math.max(s, decStartMs()); return s; }
// (V25.1) por defecto, todo se cierra el 24 de diciembre a las 23:59 (hora de España)
export function endOf(cfg) { return +(cfg?.endAt || Date.UTC(S.config?.year || new Date().getFullYear(), 11, 24, 22, 59)); }

export async function loadAll({ answers = true } = {}) {
  const [cfg, pl, sc, adj] = await Promise.all(['cfg', 'players', 'sched', 'adj'].map(k => store.gDoc('gnome', k).catch(() => null)));
  const st = { cfg: ok(cfg) ? cfg : {}, players: ok(pl) ? pl.list || [] : [], sched: ok(sc) ? sc.list || [] : [], adj: ok(adj) ? adj.list || [] : [], ga: {}, now: Date.now(), denied: !!cfg?.__denied };
  st.gb = await store.gList('gb').catch(() => []); // (V24.1) puntos ganados en los juegos (Dulce Navidad…)
  st.since = sinceOf(st.cfg); st.endAt = endOf(st.cfg); st.ms = msOf(st.cfg);
  if (answers) {
    const qs = st.sched.filter(q => q.at <= st.now && (q.tie || (q.at >= st.since && q.at < st.endAt)));
    await Promise.all(qs.map(async q => { st.ga[q.id] = await store.gDoc('ga', q.id).catch(() => null); }));
  }
  return compute(st);
}
const nameOf = (st, uid) => st.players.find(p => p.uid === uid)?.name || '—';

// resultado de una pregunta: quién ha ganado, quién ha fallado… y los puntos de cada uno
export function scoreQuestion(st, q, R) {
  R = ok(R) ? R : {}; const ov = R.ov || {};
  const ids = st.players.map(p => p.uid);
  const ans = ids.filter(u => R[u]).map(u => ({ uid: u, ...R[u], ok: ov[u] ?? R[u].ok })).sort((a, b) => a.at - b.at);
  const until = q.until || FAR;
  const closed = st.now >= until || ans.length >= ids.length;
  const right = ans.filter(a => a.ok), first = right[0] || null;
  const ev = [];
  if (first) ev.push({ uid: first.uid, pts: 2, at: first.at, k: 'first', q: q.id });
  ans.filter(a => !a.ok).forEach(a => ev.push({ uid: a.uid, pts: -1, at: a.at, k: 'wrong', q: q.id }));
  let last = null;
  if (closed) {
    if (right.length >= 2) { last = right[right.length - 1]; ev.push({ uid: last.uid, pts: -1, at: Math.min(until, ans[ans.length - 1].at), k: 'last', q: q.id }); }
    if (st.now >= until) ids.filter(u => !R[u]).forEach(u => ev.push({ uid: u, pts: -1, at: until, k: 'none', q: q.id }));
  }
  if (first && R.steal && R.steal.by === first.uid && ids.includes(R.steal.to)) ev.push({ uid: R.steal.to, pts: -1, at: R.steal.at, k: 'steal', by: first.uid, q: q.id });
  return { ans, right, first, last, closed, ev, steal: R.steal || null };
}

function compute(st) {
  const ev = [];
  st.res = {};
  st.sched.filter(q => !q.tie && q.at <= st.now && q.at >= st.since && q.at < st.endAt).forEach(q => {
    const R = st.ga[q.id];
    if (R?.__denied) { st.res[q.id] = { hidden: true }; return; } // aún no la has contestado: no se ve cómo va
    const r = scoreQuestion(st, q, R); st.res[q.id] = r; ev.push(...r.ev);
  });
  st.adj.filter(a => a.at >= st.since && a.at < st.endAt).forEach(a => ev.push({ uid: a.uid, pts: +a.pts || 0, at: a.at, k: 'adj', why: a.why, id: a.id }));
  // (V24.1) puntos de los juegos: cuentan si se cobraron dentro del juego de los gnomos
  (st.gb || []).filter(b => (+b.pts || 0) > 0 && b.at >= st.since && b.at < st.endAt && b.start >= st.since)
    .forEach(b => ev.push({ uid: b.uid, pts: +b.pts || 0, at: b.at, k: 'game', why: gameName(b.game), id: b.id }));
  // (V25.3) lo que se resta por perder (la oca): un apunte con el total
  (st.gb || []).filter(b => (+b.neg || 0) > 0 && b.nat >= st.since && b.nat < st.endAt && b.start >= st.since)
    .forEach(b => ev.push({ uid: b.uid, pts: -(+b.neg || 0), at: b.nat, k: 'game', why: gameName(b.game) + ' · ' + (b.game === 'parchis12' ? L('abandonar', 'abandonar', 'leaving') : L('perder', 'perdre', 'losing')), id: b.id + '_neg' }));
  ev.sort((a, b) => a.at - b.at);
  st.score = {}; st.max = {}; st.hist = {};
  st.players.forEach(p => { st.score[p.uid] = 0; st.max[p.uid] = 0; st.hist[p.uid] = []; });
  ev.forEach(e => {
    if (!(e.uid in st.score)) return;
    st.score[e.uid] += e.pts; st.max[e.uid] = Math.max(st.max[e.uid], st.score[e.uid]);
    st.hist[e.uid].push({ ...e, total: st.score[e.uid] });
  });
  st.events = ev;
  st.rank = st.players.map(p => ({ ...p, score: st.score[p.uid] })).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'es'));
  // ¿hay alguna pregunta abierta (contando el desempate)?
  st.open = st.sched.find(q => !q.tie && q.at <= st.now && st.now < (q.until || FAR) && q.at >= st.since && q.at < st.endAt) || null;
  st.hiddenOpen = !!(st.open && st.res[st.open.id]?.hidden);
  // final
  st.ended = st.now >= st.endAt;
  const top = st.rank.length ? st.rank[0].score : 0;
  st.tied = st.rank.filter(r => r.score === top).map(r => r.uid);
  st.winner = null; st.tieQ = null;
  if (st.ended && st.rank.length) {
    if (st.tied.length === 1) st.winner = st.tied[0];
    else {
      st.tieQ = st.sched.filter(q => q.tie && q.at <= st.now).sort((a, b) => b.at - a.at)[0] || null;
      const R = st.tieQ && st.ga[st.tieQ.id];
      if (ok(R)) {
        const ov = R.ov || {};
        const w = st.tied.filter(u => R[u] && (ov[u] ?? R[u].ok)).sort((a, b) => R[a].at - R[b].at)[0];
        if (w) st.winner = w;
      }
    }
  }
  return st;
}
const unlocked = (st, uid, i) => (st.max[uid] || 0) >= st.ms[i];
const prizeOf = (st, uid, k) => st.cfg.prizes?.[uid]?.[k] || null;
const imgCache = {};
async function prizeImg(uid, k) {
  const id = uid + '_' + k;
  if (!(id in imgCache)) imgCache[id] = store.gDoc('gimg', id).then(x => (ok(x) ? x.img || '' : '')).catch(() => '');
  return imgCache[id];
}
function imgInto(node, uid, k, p) { if (p?.img) prizeImg(uid, k).then(src => { if (src) { node.style.backgroundImage = `url(${src})`; node.classList.add('has-img'); } }); }

// ================================================================ JUGADORES: preguntas que salen solas
let timer = 0, busy = false, later = {};
export function startGnomes() {
  clearInterval(timer);
  setTimeout(() => syncDoorPts(true).catch(() => {}), 4000);
  setTimeout(check, 6000);
  timer = setInterval(check, 30000);
  if (!startGnomes.vis) { startGnomes.vis = true; document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(check, 800); }); }
}
const blocked = () => document.querySelector('.popup-back, .note-layer, .sum-wrap, .cd-boom, .sp-back, .slfx, .gn-unlock, .gn-final, .gn-wrap');
async function check() {
  if (busy || !S.user || !isGnome() || document.hidden || blocked()) { refreshFab(); return; }
  busy = true;
  try {
    const st = await loadAll();
    LAST = st; refreshFab(st);
    if (st.denied) return;
    // 1) una pregunta abierta que aún no he contestado
    const mine = pendingQ(st);
    if (mine && !(later[mine.id] > Date.now())) { await askQuestion(mine, st); return; }
    // 2) un robo pendiente (he sido el más rápido y aún no he elegido)
    const steal = Object.entries(st.res).find(([, r]) => r.first?.uid === me() && !r.steal);
    if (steal && !(later['s' + steal[0]] > Date.now())) { await stealPicker(steal[0], st); return; }
    // 3) avisos: regalos conseguidos, puntos robados, puntos de la administradora, final
    await news(st);
  } catch (e) { console.warn('gnomos', e); }
  finally { busy = false; }
}
let LAST = null;
function pendingQ(st) {
  const u = me();
  const tie = st.sched.filter(q => q.tie && q.at <= st.now && (q.to || []).includes(u) && st.ended && !st.winner).sort((a, b) => b.at - a.at)[0];
  for (const q of [tie, st.open]) {
    if (!q) continue;
    const R = st.ga[q.id];
    if (!R || R.__denied || !R[u]) return q;
  }
  return null;
}

// ---- el popup de la pregunta
export async function askQuestion(s, st, { preview = null } = {}) {
  const q = preview || await store.gDoc('gq', s.id);
  if (!ok(q)) return;
  const opts = (q.opts || []).filter(Boolean);
  const fb = el('div', { class: 'aq-fb' });
  const after = el('div', { class: 'gn-after' });
  let sent = false;
  const send = async answer => {
    if (sent) return; sent = true;
    if (preview) { fb.className = 'aq-fb show good'; fb.textContent = '👀 Vista previa: no se ha enviado nada'; return; }
    const okAns = (q.hs || []).includes(await hashAns(s.id, answer));
    try { await store.gAnswer(s.id, me(), { n: norm(answer), a: String(answer).slice(0, 200), ok: okAns, nm: S.profile?.name || '' }); }
    catch (e) {
      sent = false;
      fb.className = 'aq-fb show bad';
      fb.textContent = /permission/.test(e.code || e.message || '') ? '⏰ ' + L('Esta pregunta ya se ha cerrado o ya la habías contestado.', 'Aquesta pregunta ja s’ha tancat o ja l’havies contestat.', 'This question is closed or already answered.') : '⚠️ ' + (e.code || e.message);
      return;
    }
    const R = await store.gDoc('ga', s.id).catch(() => null);
    const st2 = { ...st, now: Date.now() }; if (!st2.players.some(p => p.uid === me())) st2.players = [...st2.players, { uid: me(), name: S.profile?.name || '' }];
    const r = scoreQuestion(st2, s, R);
    box.classList.add('answered');
    if (okAns && r.first?.uid === me()) {
      fanfare(); confetti(200);
      fb.className = 'aq-fb show good gn-big'; fb.textContent = s.tie ? '🏆 ' + L('¡Has acertado el primero!', 'Has encertat el primer!', 'You got it first!') : '🥇 ' + L('¡Has sido el más rápido! +2 puntos', 'Has estat el més ràpid! +2 punts', 'You were the fastest! +2 points');
      if (!s.tie) after.append(el('button', { class: 'btn btn-big no-delay', onclick: () => { back.remove(); res(); stealPicker(s.id, st2); } }, '😈 ' + L('Elegir a quién quito 1 punto', 'Triar a qui trec 1 punt', 'Choose who loses 1 point')));
    } else if (okAns) {
      chime();
      fb.className = 'aq-fb show good'; fb.textContent = '✅ ' + L('¡Correcto! Pero ', 'Correcte! Però ', 'Correct! But ') + (r.first ? r.first.nm || nameOf(st2, r.first.uid) : '…') + L(' ha sido más rápido/a. ¡A la próxima!', ' ha estat més ràpid/a. A la propera!', ' was faster. Next time!');
    } else {
      sadTrombone();
      fb.className = 'aq-fb show bad'; fb.textContent = '❌ ' + L('¡Oh! No era esa… −1 punto', 'Oh! No era aquesta… −1 punt', 'Oh! That wasn’t it… −1 point');
    }
    closeBtn.textContent = '👍 OK';
    setTimeout(reloadFab, 500);
  };
  const play = el('div', { class: 'gn-play' });
  if (q.kind === 'text' || !opts.length) {
    const inp = el('input', { type: 'text', class: 'gn-input', maxlength: 120, autocomplete: 'off', placeholder: L('Escribe tu respuesta…', 'Escriu la teva resposta…', 'Type your answer…') });
    const go = el('button', { class: 'btn btn-big no-delay', onclick: () => { if (inp.value.trim()) { inp.disabled = go.disabled = true; send(inp.value.trim()).then(() => { if (!sent) inp.disabled = go.disabled = false; }); } } }, '📨 ' + L('¡Enviar!', 'Enviar!', 'Send!'));
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') go.click(); });
    play.append(inp, go);
    setTimeout(() => inp.focus(), 400);
  } else {
    const list = el('div', { class: 'aq-list' });
    opts.forEach((o, k) => list.append(el('button', { type: 'button', class: 'aq-ans no-delay', style: `--k:${k}`, onclick: ev => {
      if (sent) return; list.classList.add('done'); ev.currentTarget.classList.add('right'); pop(); send(o);
    } }, el('span', { class: 'aq-ball' }), el('span', { class: 'aq-txt' }, o))));
    play.append(list);
  }
  const box = el('div', { class: 'qp-card gn-qcard' },
    el('div', { class: 'cw-lights' }, ...Array.from({ length: 12 }, (_, i) => el('i', { style: `--i:${i}` }))),
    el('img', { class: 'gn-qgnome', src: 'gnomo.png', alt: '' }),
    el('div', { class: 'qp-ribbon' }, s.tie ? '⚔️ ' + L('¡Pregunta de desempate!', 'Pregunta de desempat!', 'Tie-break question!') : '🍄 ' + L('¡Pregunta de gnomo!', 'Pregunta de gnom!', 'Gnome question!')),
    el('p', { class: 'gn-rule' }, s.tie ? L('El primero que acierte se lleva el Gran premio ⭐', 'El primer que l’encerti s’emporta el Gran premi ⭐', 'The first right answer wins the Grand prize ⭐') : L('¡Rápido! El primero que acierte gana +2 ⚡', 'Ràpid! El primer que l’encerti guanya +2 ⚡', 'Quick! The first right answer wins +2 ⚡')),
    q.title ? el('p', { class: 'qp-msg' }, q.title) : null,
    el('div', { class: 'aq-play qp-play' }, el('p', { class: 'aq-question' }, q.q), play, fb, after));
  chime();
  let res;
  const closeBtn = el('button', { class: 'btn btn-ghost no-delay', onclick: () => { back.remove(); if (!sent && !preview) later[s.id] = Date.now() + 3 * 60000; res(); } }, preview ? 'Cerrar' : '⏰ ' + L('Luego', 'Després', 'Later'));
  const back = el('div', { class: 'popup-back qp-back gn-qback' }, el('div', { class: 'popup small qp-popup' }, box, el('div', { class: 'popup-btns' }, closeBtn)));
  return new Promise(r => { res = r; document.body.append(back); });
}

// ---- el más rápido elige a quién quitar 1 punto
async function stealPicker(qid, st) {
  const others = st.players.filter(p => p.uid !== me());
  if (!others.length) return;
  const grid = el('div', { class: 'gn-steal' });
  let done = false;
  const box = el('div', { class: 'gn-stealbox' }, el('div', { class: 'gn-devil' }, '😈'),
    el('h2', {}, L('¡Elige a quién le quitas 1 punto!', 'Tria a qui li treus 1 punt!', 'Choose who loses 1 point!')), grid);
  const p = popup(box, { cls: 'small gn-stealpop', buttons: [{ label: '⏰ ' + L('Luego', 'Després', 'Later'), value: false, cls: 'btn-ghost' }] });
  others.forEach(o => grid.append(el('button', { class: 'gn-victim no-delay', onclick: async () => {
    if (done) return; done = true;
    try {
      await store.gSteal(qid, me(), o.uid);
      document.querySelector('.gn-stealpop')?.closest('.popup-back')?.remove();
      pop(); toast('😈 ' + L(`¡Hecho! ${o.name} pierde 1 punto`, `Fet! ${o.name} perd 1 punt`, `Done! ${o.name} loses 1 point`), 3500);
      reloadFab();
    } catch (e) { done = false; toast('⚠️ ' + (e.code || e.message), 5000); }
  } }, el('b', { class: 'gn-name' }, o.name), el('span', { class: 'gn-mini-ball' }, String(st.score[o.uid] ?? 0)))));
  const r = await p;
  if (r === false && !done) later['s' + qid] = Date.now() + 10 * 60000;
}

// ---- avisos (una sola vez cada uno)
async function news(st) {
  const u = me(), seenK = 'adv_gn_seen_' + u, seen = new Set(ls.get(seenK, []));
  const first = !ls.get(seenK, null);
  const add = k => { seen.add(k); ls.set(seenK, [...seen].slice(-400)); };
  // la primera vez en este aparato no se repiten los avisos viejos (sí los regalos)
  for (const p of st.players) for (let i = 0; i < st.ms.length; i++) {
    const k = `u_${p.uid}_${i}_${st.ms[i]}_${st.since}`;
    if (seen.has(k) || !unlocked(st, p.uid, i)) continue;
    add(k);
    if (p.uid === u) { await showUnlock(st, u, KEYS[i], i); return; }
    if (!first) toast(`🎁 ${p.name} ${L('ha conseguido su regalo de', 'ha aconseguit el seu regal de', 'got the prize for')} ${st.ms[i]} ${L('puntos', 'punts', 'points')}!`, 4500);
  }
  for (const e of st.hist[u] || []) {
    const k = 'e_' + e.k + '_' + (e.q || e.id) + '_' + e.at;
    if (seen.has(k)) continue; add(k);
    if (first) continue;
    if (e.k === 'steal') toast(`😈 ${nameOf(st, e.by)} ${L('te ha quitado 1 punto', 't’ha tret 1 punt', 'took 1 point from you')}`, 4500);
    if (e.k === 'adj') toast(`✨ ${e.pts > 0 ? '+' : ''}${e.pts} ${L('de Mamá Noel', 'de la Mare Noel', 'from Mrs Claus')}${e.why ? ': ' + e.why : ''}`, 5000);
    if (e.k === 'game') toast(`🎮 +${e.pts} ${L('por', 'per', 'for')} ${e.why}`, 4500);
    if (e.k === 'none') toast('⏰ ' + L('Se te pasó una pregunta: −1', 'Se’t va passar una pregunta: −1', 'You missed a question: −1'), 4000);
  }
  if (st.ended && st.winner) {
    const k = 'final_' + st.endAt + '_' + st.winner;
    if (!seen.has(k)) { add(k); await showFinal(st); }
  }
}

// ================================================================ BOTÓN 🍄 EN EL CALENDARIO
let fabs = new Set();
function reloadFab() { loadAll().then(st => { LAST = st; refreshFab(st); }).catch(() => {}); }
export function decorateFab(btn) { fabs.add(btn); refreshFab(LAST); if (!LAST) loadAll().then(st => { LAST = st; refreshFab(st); }).catch(() => {}); }
function refreshFab(st = LAST) {
  fabs.forEach(b => { if (!b.isConnected) fabs.delete(b); });
  if (!st) return;
  const pend = isGnome() && pendingQ(st);
  const mine = st.rank.findIndex(r => r.uid === me());
  fabs.forEach(b => {
    b.classList.toggle('pending', !!pend);
    b.replaceChildren(...[el('span', { class: 'gn-fab-ico' }, pend ? '❓' : '🍄'), el('b', {}, mine >= 0 ? (st.score[me()] ?? 0) + ' pt' : L('Gnomos', 'Gnoms', 'Gnomes')), mine === 0 && st.rank.length > 1 && st.rank[0].score > st.rank[1].score ? el('span', { class: 'gn-fab-crown' }, '👑') : null].filter(Boolean));
  });
}

// ================================================================ EL MARCADOR (para todos los gnomos y la administradora)
export async function openBoard() {
  document.querySelector('.gn-wrap')?.remove();
  const body = el('div', { class: 'gn-body' }, el('p', { class: 'loading-msg' }, el('span', { class: 'spin' }, '❄'), ' …'));
  const wrap = el('div', { class: 'gn-wrap' },
    el('div', { class: 'gn-snow', 'aria-hidden': 'true' }, ...Array.from({ length: 26 }, (_, i) => el('i', { style: `--x:${(i * 37) % 100};--d:${6 + (i % 7)}s;--dl:${-(i % 9)}s;--s:${6 + (i % 4) * 3}px` }))),
    el('header', { class: 'gn-head' },
      el('h1', {}, el('span', {}, '🍄'), ' ' + L('El juego de los gnomos', 'El joc dels gnoms', 'The gnome game'),
        el('small', { class: 'gn-sub' }, L('Solo gnomos · no es el ⭐ Marcador de Navidad', 'Només gnoms · no és el ⭐ Marcador de Nadal', 'Gnomes only · not the ⭐ Christmas scoreboard'))),
      el('button', { class: 'gn-x no-delay', onclick: () => { wrap.remove(); later = {}; setTimeout(check, 600); } }, '✕')),
    body);
  document.body.append(wrap);
  try { const st = await loadAll(); LAST = st; refreshFab(st); drawBoard(body, st); }
  catch (e) { body.replaceChildren(el('p', { class: 'gn-err' }, '⚠️ ' + (e.code || e.message))); }
}

function drawBoard(body, st) {
  if (st.denied) return body.replaceChildren(el('p', { class: 'gn-err' }, '🔒 ' + L('Falta publicar las reglas nuevas de Firebase (V24).', 'Falten publicar les regles noves de Firebase (V24).', 'The new Firebase rules (V24) are not published yet.')));
  if (!st.players.length) return body.replaceChildren(el('p', { class: 'gn-err' }, L('Todavía no hay gnomos en el juego.', 'Encara no hi ha gnoms al joc.', 'No gnomes in the game yet.')));
  const u = me();
  const parts = [];
  // pregunta en juego
  const pend = isGnome() && pendingQ(st);
  if (pend) parts.push(el('button', { class: 'gn-qbanner no-delay', onclick: () => { askQuestion(pend, st).then(() => drawLater(body)); } }, '❓ ' + L('¡Hay una pregunta en juego! Contesta rápido', 'Hi ha una pregunta en joc! Contesta ràpid', 'A question is live! Answer fast'), el('small', {}, L('Toca aquí', 'Toca aquí', 'Tap here'))));
  else if (st.open) parts.push(el('div', { class: 'gn-qinfo' }, '⏳ ' + L('Pregunta en juego: esperando a los demás…', 'Pregunta en joc: esperant els altres…', 'Question live: waiting for the others…')));
  // final
  if (st.ended) parts.push(finalBox(st));
  // Gran premio de cada uno, en las estrellas del árbol
  parts.push(grandTree(st));
  // tarjetas
  const lead = st.rank[0] && (st.rank.length === 1 || st.rank[0].score > st.rank[1].score) ? st.rank[0].uid : null;
  parts.push(el('div', { class: 'gn-cards' }, ...st.rank.map((r, i) => card(st, r, i, r.uid === lead, r.uid === u))));
  parts.push(el('button', { class: 'gn-rules-btn no-delay', onclick: rulesPopup }, '📜 ' + L('¿Cómo se ganan los puntos?', 'Com es guanyen els punts?', 'How do you score points?')));
  body.replaceChildren(...parts);
}
async function drawLater(body) { try { const st = await loadAll(); LAST = st; refreshFab(st); if (body.isConnected) drawBoard(body, st); } catch {} }

function card(st, r, i, lead, mine) {
  const maxMs = st.ms[st.ms.length - 1] || 1;
  const sc = st.score[r.uid];
  const pct = v => Math.max(0, Math.min(100, v / maxMs * 100));
  const path = el('div', { class: 'gn-path' }, el('div', { class: 'gn-cane' }, el('div', { class: 'gn-cane-fill', style: `width:${pct(sc)}%` })));
  st.ms.forEach((m, k) => {
    const p = prizeOf(st, r.uid, KEYS[k]), on = unlocked(st, r.uid, k);
    const g = el('button', { class: 'gn-gift no-delay' + (on ? ' on' : ''), style: `left:${pct(m)}%`, title: p?.t || '', onclick: () => prizePopup(st, r, KEYS[k], `${m} ${L('puntos', 'punts', 'points')}`, on) },
      el('span', { class: 'gn-gift-pic' }, on ? '' : '🎁'), el('small', {}, m));
    imgInto(g.firstChild, r.uid, KEYS[k], p);
    path.append(g);
  });
  const prizes = el('div', { class: 'gn-prizes' }, ...st.ms.map((m, k) => {
    const p = prizeOf(st, r.uid, KEYS[k]), on = unlocked(st, r.uid, k);
    const th = el('span', { class: 'gn-pthumb' }, p?.img ? '' : '🎁');
    imgInto(th, r.uid, KEYS[k], p);
    return el('button', { class: 'gn-prize no-delay' + (on ? ' on' : ''), onclick: () => prizePopup(st, r, KEYS[k], `${m} ${L('puntos', 'punts', 'points')}`, on) },
      th, el('span', { class: 'gn-ptxt' }, el('b', {}, `${m} pt ${on ? '✅' : ''}`), el('small', {}, p?.t || L('Regalo sorpresa', 'Regal sorpresa', 'Surprise gift'))));
  }));
  const nextM = st.ms.find((m, k) => !unlocked(st, r.uid, k));
  return el('div', { class: 'gn-card' + (lead ? ' lead' : '') + (mine ? ' mine' : ''), style: `--d:${i * 0.12}s` },
    el('span', { class: 'gn-holly l' }), el('span', { class: 'gn-holly r' }),
    lead ? el('span', { class: 'gn-crown' }, '👑') : null,
    el('div', { class: 'gn-card-top' },
      el('span', { class: 'gn-pos' }, (k => ['🥇', '🥈', '🥉'][k] || `${k + 1}º`)(st.rank.findIndex(x => x.score === r.score))),
      el('b', { class: 'gn-name' }, r.name),
      el('span', { class: 'gn-ball' }, el('span', { class: 'gn-ball-cap' }), el('b', {}, String(sc)), el('small', {}, 'pt'))),
    path,
    el('p', { class: 'gn-next' }, nextM != null ? `🎁 ${L('A', 'A', '')} ${nextM - sc} ${L('puntos de su próximo regalo', 'punts del proper regal', 'points to the next gift')}` : '🌟 ' + L('¡Todos los regalos conseguidos!', 'Tots els regals aconseguits!', 'All gifts unlocked!')),
    prizes,
    el('button', { class: 'gn-hist-btn no-delay', onclick: () => historyPopup(st, r) }, '📜 ' + L('Ver sus puntos', 'Veure els seus punts', 'See points')));
}

function grandTree(st) {
  const stars = st.players.map(p => {
    const g = prizeOf(st, p.uid, 'g');
    const won = st.winner === p.uid, lost = st.winner && !won;
    const pic = el('span', { class: 'gn-star-pic' });
    imgInto(pic, p.uid, 'g', g);
    return el('button', { class: 'gn-star no-delay' + (won ? ' won' : '') + (lost ? ' lost' : ''), onclick: () => prizePopup(st, p, 'g', L('Gran premio', 'Gran premi', 'Grand prize'), won, true) },
      el('span', { class: 'gn-star-shape' }, pic), el('b', { class: 'gn-name' }, p.name), el('small', {}, g?.t || '⭐'));
  });
  return el('section', { class: 'gn-grand' },
    el('div', { class: 'gn-grand-title' }, '⭐ ' + L('Gran premio', 'Gran premi', 'Grand prize') + ' ⭐'),
    el('p', { class: 'gn-grand-sub' }, st.ended ? (st.winner ? `🏆 ${L('Se lo lleva', 'Se l’emporta', 'Goes to')} ${nameOf(st, st.winner)}!` : '⚔️ ' + L('¡Empate! Pregunta final…', 'Empat! Pregunta final…', 'Tie! Final question…'))
      : L(`Esto puede ser tuyo… El ${new Date(st.endAt).getDate()} de diciembre, quien tenga más puntos se lo lleva`, `Això pot ser teu… El ${new Date(st.endAt).getDate()} de desembre, qui tingui més punts se l’emporta`, `This could be yours… On ${new Date(st.endAt).getDate()} December, the top scorer takes it`)),
    el('div', { class: 'gn-tree' }, ...stars));
}

function finalBox(st) {
  const podium = st.rank.slice(0, 3);
  return el('section', { class: 'gn-podium' },
    ...podium.map((r, i) => el('div', { class: 'gn-step s' + (i + 1) + (st.winner === r.uid ? ' win' : '') },
      el('span', { class: 'gn-medal' }, ['🥇', '🥈', '🥉'][st.rank.findIndex(x => x.score === r.score)] || '🏅'), el('b', { class: 'gn-name' }, r.name), el('small', {}, r.score + ' pt'))));
}

async function prizePopup(st, p, k, label, won, grand = false) {
  const pr = prizeOf(st, p.uid, k);
  const src = pr?.img ? await prizeImg(p.uid, k) : '';
  const pola = el('div', { class: 'gn-pola' + (grand ? ' grand' : '') },
    src ? el('img', { src, alt: '', onclick: () => lightbox([{ kind: 'img', src }], 0) }) : el('div', { class: 'gn-pola-empty' }, grand ? '⭐' : '🎁'),
    el('b', {}, pr?.t || L('Regalo sorpresa', 'Regal sorpresa', 'Surprise gift')));
  const state = grand
    ? (st.winner === p.uid ? '🏆 ' + L('¡Conseguido!', 'Aconseguit!', 'Won!') : st.winner ? '💫 ' + L('Esta vez no…', 'Aquest cop no…', 'Not this time…') : '✨ ' + L('Solo para quien gane', 'Només per a qui guanyi', 'Only for the winner'))
    : (won ? '✅ ' + L('¡Conseguido!', 'Aconseguit!', 'Unlocked!') : `🔒 ${L('Faltan', 'Falten', 'Missing')} ${Math.max(0, st.ms[KEYS.indexOf(k)] - (st.max[p.uid] || 0))} ${L('puntos', 'punts', 'points')}`);
  await popup(el('div', { class: 'gn-ppop' }, el('div', { class: 'gn-plabel' }, `${label} · `, el('span', { class: 'gn-name' }, p.name)), pola, pr?.d ? el('p', { class: 'gn-pdesc' }, pr.d) : null, el('p', { class: 'gn-pstate' }, state)),
    { cls: 'small gn-prizepop', outside: true, buttons: [{ label: '🎄 OK', value: true }] });
}

const KTXT = () => ({ first: '🥇 ' + L('El más rápido', 'El més ràpid', 'Fastest'), wrong: '❌ ' + L('Respuesta equivocada', 'Resposta equivocada', 'Wrong answer'), last: '🐢 ' + L('El último en acertar', 'L’últim a encertar', 'Last right answer'), none: '⏰ ' + L('No contestó', 'No va contestar', 'No answer'), steal: '😈 ' + L('Le quitó 1 punto', 'Li va treure 1 punt', 'Point taken by'), adj: '✨ ' + L('Mamá Noel', 'Mare Noel', 'Mrs Claus'), game: '🎮 ' + L('Juego', 'Joc', 'Game') });
function historyPopup(st, r) {
  const h = (st.hist[r.uid] || []).slice().reverse();
  const T = KTXT();
  popup(el('div', { class: 'gn-histbox' }, el('h2', {}, el('span', { class: 'gn-name' }, r.name), ' · ', st.score[r.uid] + ' pt'),
    h.length ? el('div', { class: 'gn-hist' }, ...h.map(e => el('div', { class: 'gn-hrow ' + (e.pts > 0 ? 'plus' : 'minus') },
      el('b', {}, (e.pts > 0 ? '+' : '') + e.pts),
      el('span', {}, T[e.k] + (e.k === 'steal' ? ' ' + nameOf(st, e.by) : '') + (e.why ? ': ' + e.why : '')),
      el('small', {}, when(e.at)))))
      : el('p', { class: 'muted' }, L('Todavía no hay puntos.', 'Encara no hi ha punts.', 'No points yet.'))),
  { cls: 'small', outside: true, buttons: [{ label: 'OK', value: true }] });
}
function rulesPopup() {
  popup(el('div', { class: 'gn-rulesbox' }, el('h2', {}, '🍄 ' + L('Cómo se juega', 'Com es juga', 'How to play')),
    el('ul', {},
      el('li', {}, L('Durante el día salen preguntas sorpresa solo para los gnomos.', 'Durant el dia surten preguntes sorpresa només per als gnoms.', 'Surprise questions pop up during the day, only for gnomes.')),
      el('li', {}, el('b', {}, '+2 '), L('el primero que acierta… ¡y le quita 1 punto a quien quiera! 😈', 'el primer que l’encerta… i li treu 1 punt a qui vulgui! 😈', 'for the first right answer… and they take 1 point from anyone! 😈')),
      el('li', {}, el('b', {}, '−1 '), L('si fallas.', 'si falles.', 'if you get it wrong.')),
      el('li', {}, el('b', {}, '−1 '), L('el último en acertar.', 'l’últim a encertar.', 'for the last right answer.')),
      el('li', {}, el('b', {}, '−1 '), L('si no contestas antes de que salga la siguiente pregunta.', 'si no contestes abans que surti la pregunta següent.', 'if you don’t answer before the next question.')),
      el('li', {}, '✨ ' + L('Mamá Noel también puede dar o quitar puntos por las actividades.', 'La Mare Noel també pot donar o treure punts per les activitats.', 'Mrs Claus can also give or take points for the activities.')),
      el('li', {}, '🎁 ' + L('Al llegar a cada meta, ¡regalo!', 'En arribar a cada meta, regal!', 'Each goal unlocks a gift!')),
      el('li', {}, '⭐ ' + L('El día 25, quien tenga más puntos se lleva su Gran premio.', 'El dia 25, qui tingui més punts s’emporta el seu Gran premi.', 'On the 25th, the top scorer gets their Grand prize.')))),
  { cls: 'small', outside: true, buttons: [{ label: '🎄 OK', value: true }] });
}

// ================================================================ ANIMACIONES ESPECIALES
// al conseguir un regalo: se oscurece, nieve dorada, ho-ho-ho, se desata el lazo, se abre la caja y sale la foto girando
export async function showUnlock(st, uid, k, i, { name } = {}) {
  const p = prizeOf(st, uid, k);
  const src = p?.img ? await prizeImg(uid, k) : '';
  const nm = name || nameOf(st, uid);
  const o = el('div', { class: 'gn-unlock' },
    el('div', { class: 'gn-goldsnow' }, ...Array.from({ length: 40 }, (_, j) => el('i', { style: `--x:${(j * 53) % 100};--d:${3 + (j % 5)}s;--dl:${-(j % 7) * 0.5}s;--s:${4 + (j % 4) * 3}px` }))),
    el('div', { class: 'gn-box' },
      el('div', { class: 'gn-box-body' }), el('div', { class: 'gn-box-lid' }, el('span', { class: 'gn-bow' }, el('i'), el('i'))),
      el('div', { class: 'gn-pola gn-pola-fly' }, src ? el('img', { src, alt: '' }) : el('div', { class: 'gn-pola-empty' }, '🎁'), el('b', {}, p?.t || L('¡Regalo sorpresa!', 'Regal sorpresa!', 'Surprise gift!')))),
    el('div', { class: 'gn-unlock-txt' },
      el('h2', {}, L('¡Lo has conseguido, ', 'Ho has aconseguit, ', 'You did it, '), el('span', { class: 'gn-name' }, nm), '!'),
      el('p', {}, `🎁 ${L('Tu regalo de', 'El teu regal de', 'Your gift for')} ${st.ms[i]} ${L('puntos', 'punts', 'points')}`),
      p?.d ? el('p', { class: 'gn-pdesc' }, p.d) : null,
      el('button', { class: 'btn btn-big no-delay', onclick: () => { o.classList.add('out'); setTimeout(() => o.remove(), 500); } }, '🎄 ' + L('¡Genial!', 'Genial!', 'Great!'))));
  document.body.append(o);
  try { hohoho(); } catch {}
  await sleep(1300); o.classList.add('untie');
  await sleep(900); o.classList.add('open');
  await sleep(600); try { fanfare(); } catch {} confetti(220);
  await sleep(1400); o.classList.add('done');
  return new Promise(r => { const iv = setInterval(() => { if (!o.isConnected) { clearInterval(iv); r(); } }, 300); });
}

// el día 25: la estrella del ganador explota en confeti y sale su Gran premio; los demás ven el podio
export async function showFinal(st) {
  const w = st.winner; if (!w) return;
  const g = prizeOf(st, w, 'g');
  const src = g?.img ? await prizeImg(w, 'g') : '';
  const iWin = w === me();
  const o = el('div', { class: 'gn-final' + (iWin ? ' me' : '') },
    el('div', { class: 'gn-goldsnow' }, ...Array.from({ length: 50 }, (_, j) => el('i', { style: `--x:${(j * 41) % 100};--d:${3 + (j % 5)}s;--dl:${-(j % 7) * 0.5}s;--s:${4 + (j % 4) * 3}px` }))),
    el('div', { class: 'gn-bigstar' }, '⭐'),
    el('div', { class: 'gn-final-in' },
      el('h2', {}, iWin ? L('¡Has ganado, ', 'Has guanyat, ', 'You won, ') : '🏆 ', el('span', { class: 'gn-name' }, nameOf(st, w)), iWin ? '!' : L(' gana el juego de los gnomos', ' guanya el joc dels gnoms', ' wins the gnome game')),
      el('div', { class: 'gn-pola grand' }, src ? el('img', { src, alt: '' }) : el('div', { class: 'gn-pola-empty' }, '⭐'), el('b', {}, g?.t || L('Gran premio', 'Gran premi', 'Grand prize'))),
      g?.d && iWin ? el('p', { class: 'gn-pdesc' }, g.d) : null,
      finalBox(st),
      el('button', { class: 'btn btn-big no-delay', onclick: () => { o.classList.add('out'); setTimeout(() => o.remove(), 500); } }, '🎄 ' + L('¡Feliz Navidad!', 'Bon Nadal!', 'Merry Christmas!'))));
  document.body.append(o);
  try { hohoho(); } catch {}
  await sleep(1500); o.classList.add('boom'); confetti(320); try { fanfare(); } catch {}
  await sleep(900); o.classList.add('show');
}

// ================================================================ ADMINISTRADORA
// los gnomos del juego = quien tiene la figura de gnomo (se guarda la lista para que todos la vean)
export async function syncPlayers() {
  const users = await store.listUsers();
  const sets = await Promise.all(users.map(u => store.getSettings(u.uid).catch(() => null)));
  const list = users.map((u, i) => ({ u, s: sets[i] })).filter(x => x.s?.figure === 'gnomo').map(x => ({ uid: x.u.uid, name: x.u.name || x.u.who || '—' }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  await store.gPut('gnome', 'players', { list, at: Date.now() });
  return list;
}

const put = (root, ...k) => root.replaceChildren(...k.filter(x => x != null && x !== false));
const BTN = (ico, title, sub, onclick) => el('button', { class: 'adm-btn', onclick }, el('span', { class: 'adm-btn-ico' }, ico), el('span', { class: 'adm-btn-txt' }, el('b', {}, title), el('small', {}, sub)));
const loading = () => el('p', { class: 'loading-msg' }, el('span', { class: 'spin' }, '❄'), ' Cargando…');
const back = root => el('div', { class: 'adm-sticky' }, el('button', { class: 'btn btn-ghost small-btn no-delay', onclick: () => gnomesAdmin(root) }, '← Volver'));
const errTxt = e => '⚠️ ' + (e.code || e.message) + (/permission/.test(e.code || e.message || '') ? ' (¿has publicado las reglas nuevas de Firebase de la V24?)' : '');

export async function gnomesAdmin(root) {
  put(root, loading());
  let players = [];
  try { players = await syncPlayers(); } catch (e) { put(root, el('p', {}, errTxt(e))); return; }
  put(root, 
    el('p', { class: 'muted' }, 'Un juego solo para los gnomos: preguntas sorpresa en carrera, puntos, regalos al llegar a cada meta y el Gran premio del día 25.'),
    el('div', { class: 'gn-adm-players' }, '🍄 Gnomos en el juego: ', players.length ? players.map(p => el('b', { class: 'gn-name' }, p.name)) : el('i', {}, 'ninguno (cambia la figura de alguien a «Gnomo» en Usuarios)')),
    el('div', { class: 'adm-menu gn-adm-menu' },
      BTN('❓', 'Preguntas', 'Prepara las preguntas y cuándo salen (ya, a una hora o al azar)', () => questionsView(root)),
      BTN('➕', 'Sumar o restar puntos', 'Por las actividades, con el motivo', () => pointsView(root)),
      BTN('🎁', 'Premios y metas', 'Las metas (10, 20, 30…) y los regalos de cada uno, con foto', () => prizesView(root)),
      BTN('🏆', 'Ver el marcador', 'Tal y como lo ven ellos', () => openBoard()),
      BTN('🎮', 'Puntos en los juegos', 'Elige en qué juegos ganan puntos de gnomo (Dulce Navidad del día 8…)', () => gamesView(root)),
      BTN('⚙️', 'Ajustes del juego', 'Final del juego, desempate y poner a 0', () => settingsView(root))));
}

// ---- preguntas
async function questionsView(root) {
  put(root, loading());
  const st = await loadAll();
  const qs = await Promise.all(st.sched.map(async s => ({ s, q: await store.gDoc('gq', s.id).catch(() => null) })));
  const now = Date.now();
  const status = s => s.at > now ? ['⏳', 'Saldrá', 'fut'] : now < (s.until || FAR) ? ['🟢', 'En juego', 'live'] : ['✅', 'Cerrada', 'done'];
  const card = ({ s, q }) => {
    const [ico, txt, cls] = status(s);
    const r = st.res[s.id];
    return el('div', { class: 'qp-acard gn-acard ' + cls },
      el('b', {}, (s.tie ? '⚔️ ' : '') + (ok(q) ? q.q : '(pregunta)')),
      el('small', {}, `${ico} ${txt}: ${when(s.at)}` + (s.mode === 'random' && s.win ? ` · 🎲 al azar entre ${s.win.from} y ${s.win.to}` : s.mode === 'now' ? ' · ⚡ ya mismo' : ' · 📅 hora exacta') + (r?.first ? ` · 🥇 ${nameOf(st, r.first.uid)}` : '')),
      el('div', { class: 'qp-abtns' },
        s.at <= now ? el('button', { class: 'btn small-btn no-delay', onclick: () => resultsView(root, s) }, '📬 Resultados') : null,
        el('button', { class: 'btn btn-ghost small-btn no-delay', onclick: () => editor(root, s) }, '✏️ Editar'),
        el('button', { class: 'btn btn-ghost small-btn no-delay', onclick: () => ok(q) && askQuestion(s, st, { preview: q }) }, '👀'),
        el('button', { class: 'btn btn-ghost small-btn no-delay', onclick: async () => {
          if (!await popup('<h2>🗑️</h2><p>¿Borrar esta pregunta y sus respuestas? Los puntos que dio desaparecen.</p>', { cls: 'small', buttons: [{ label: 'No', value: false, cls: 'btn-ghost' }, { label: 'Sí, borrar', value: true }] })) return;
          try { await deleteQ(s.id); toast('🗑️ Borrada'); } catch (e) { toast(errTxt(e), 6000); }
          questionsView(root);
        } }, '🗑️')));
  };
  const sorted = qs.slice().sort((a, b) => b.s.at - a.s.at);
  put(root, back(root),
    el('button', { class: 'btn btn-big no-delay', onclick: () => editor(root, null) }, '➕ Nueva pregunta'),
    el('p', { class: 'muted' }, 'Cada pregunta sigue abierta hasta que sale la siguiente. Las de desempate (⚔️) no cierran ninguna.'),
    sorted.length ? el('div', { class: 'qp-alist' }, ...sorted.map(card)) : el('p', { class: 'muted' }, 'Aún no has preparado ninguna.'));
}

async function recomputeUntil(list) {
  const normal = list.filter(s => !s.tie).sort((a, b) => a.at - b.at);
  const changed = [];
  normal.forEach((s, i) => { const u = normal[i + 1]?.at || FAR; if (s.until !== u) { s.until = u; changed.push(s); } });
  list.filter(s => s.tie).forEach(s => { if (s.until !== FAR) { s.until = FAR; changed.push(s); } });
  return changed;
}
async function saveSched(list) { await store.gPut('gnome', 'sched', { list, at: Date.now() }); }
async function deleteQ(id) {
  const sc = await store.gDoc('gnome', 'sched'); const list = (ok(sc) ? sc.list || [] : []).filter(s => s.id !== id);
  const ch = await recomputeUntil(list);
  for (const s of ch) await store.gPut('gq', s.id, { untilTs: s.until }, true);
  await saveSched(list);
  await Promise.all([store.gDel('gq', id), store.gDel('gqk', id), store.gDel('ga', id)].map(p => p.catch(() => {})));
}

async function editor(root, s) {
  put(root, loading());
  const isNew = !s || s._new;
  const id = s?.id || newId();
  const [q0, k0, pl] = await Promise.all([s ? store.gDoc('gq', id) : null, s ? store.gDoc('gqk', id) : null, store.gDoc('gnome', 'players')]);
  const players = ok(pl) ? pl.list || [] : [];
  const q = ok(q0) ? q0 : { kind: 'opts', q: '', opts: ['', '', '', ''] };
  const key = ok(k0) ? k0 : { ok: -1, answers: [] };
  let kind = q.kind || 'opts';
  const question = el('textarea', { rows: 2, maxlength: 300, placeholder: 'La pregunta. Ej.: ¿Cómo se llama el reno de la nariz roja?' }, q.q || '');
  const title = el('input', { type: 'text', maxlength: 80, value: q.title || '', placeholder: 'Frase antes de la pregunta (opcional)' });
  // opciones
  let okI = Number.isInteger(key.ok) ? key.ok : -1;
  const marks = [], ins = [];
  const optRows = [0, 1, 2, 3].map(i => {
    const mk = el('button', { type: 'button', class: 'aq-mark no-delay' + (i === okI ? ' on' : ''), title: 'Marcar como correcta', onclick: () => { okI = i; marks.forEach((m, j) => m.classList.toggle('on', j === okI)); } });
    const inp = el('input', { type: 'text', class: 'aq-opt', maxlength: 120, placeholder: `Respuesta ${i + 1}`, value: (q.opts || [])[i] || '' });
    marks.push(mk); ins.push(inp); return el('div', { class: 'aq-row' }, mk, inp);
  });
  const optsBox = el('div', {}, el('label', { class: 'aq-lbl' }, 'Respuestas (toca el círculo de la correcta)'), ...optRows);
  const answers = el('textarea', { rows: 3, maxlength: 600, placeholder: 'Respuestas buenas, una por línea. Ej.:\nRudolf\nRodolfo' }, (key.answers || []).join('\n'));
  const textBox = el('div', {}, el('label', { class: 'aq-lbl' }, '✍️ Respuestas que valen (una por línea; no importan mayúsculas, acentos ni signos)'), answers);
  const kindPick = el('div', { class: 'gn-seg' });
  const drawKind = () => { kindPick.replaceChildren(...[['opts', '🔘 De opciones'], ['text', '✍️ Respuesta escrita']].map(([v, l]) => el('button', { type: 'button', class: 'no-delay' + (v === kind ? ' on' : ''), onclick: () => { kind = v; drawKind(); } }, l))); optsBox.style.display = kind === 'opts' ? '' : 'none'; textBox.style.display = kind === 'text' ? '' : 'none'; };
  drawKind();
  // cuándo
  let mode = s?.mode || 'now';
  const exact = el('input', { type: 'datetime-local', class: 'qp-date', value: toLocalInput(s?.at && s.mode === 'exact' ? s.at : Date.now() + 3600000) });
  const today = new Date(); const dayIso = d => new Date(d - new Date(d).getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const rDay = el('input', { type: 'date', class: 'qp-date', value: s?.mode === 'random' && s.win?.day ? s.win.day : dayIso(today.getTime()) });
  const rFrom = el('input', { type: 'time', value: s?.win?.from || '10:00' });
  const rTo = el('input', { type: 'time', value: s?.win?.to || '21:00' });
  const whenBox = el('div');
  const modePick = el('div', { class: 'gn-seg' });
  const drawMode = () => {
    modePick.replaceChildren(...[['now', '⚡ Ya mismo'], ['exact', '📅 Hora exacta'], ['random', '🎲 Al azar']].map(([v, l]) => el('button', { type: 'button', class: 'no-delay' + (v === mode ? ' on' : ''), onclick: () => { mode = v; drawMode(); } }, l)));
    whenBox.replaceChildren(mode === 'now' ? el('p', { class: 'muted' }, 'Sale en cuanto pulses «Guardar».')
      : mode === 'exact' ? el('div', {}, el('p', { class: 'muted' }, 'Sale este día a esta hora:'), exact)
      : el('div', {}, el('p', { class: 'muted' }, 'Sale a una hora al azar (ni tú la sabrás) este día, entre:'), rDay, el('div', { class: 'gn-row' }, rFrom, ' y ', rTo)));
  };
  drawMode();
  // desempate
  const tie = el('input', { type: 'checkbox', checked: !!s?.tie });
  const tieChecks = players.map(p => el('input', { type: 'checkbox', value: p.uid, checked: (s?.to || []).includes(p.uid) }));
  const tieBox = el('div', { class: 'gn-tiebox' }, el('p', { class: 'muted' }, 'Solo la ven los gnomos empatados que marques. El primero que acierte gana el Gran premio. No da ni quita puntos.'),
    ...players.map((p, i) => el('label', { class: 'inline' }, tieChecks[i], ' ' + p.name)));
  const drawTie = () => { tieBox.style.display = tie.checked ? '' : 'none'; };
  tie.onchange = drawTie; drawTie();

  const save = async () => {
    const data = { kind, q: question.value.trim(), title: title.value.trim(), opts: kind === 'opts' ? ins.map(x => x.value.trim()) : [] };
    if (!data.q) return toast('✍️ Escribe la pregunta', 4000);
    let goods;
    if (kind === 'opts') {
      if (data.opts.filter(Boolean).length < 2) return toast('✍️ Escribe al menos 2 respuestas', 4000);
      if (okI < 0 || !data.opts[okI]) return toast('⭕ Toca el círculo de la respuesta correcta', 4000);
      goods = [data.opts[okI]];
    } else {
      goods = answers.value.split('\n').map(x => x.trim()).filter(Boolean);
      if (!goods.length) return toast('✍️ Escribe al menos una respuesta buena', 4000);
    }
    let at, win = null;
    if (mode === 'now') at = Date.now() - 20000;
    else if (mode === 'exact') { at = new Date(exact.value).getTime(); if (!at) return toast('📅 Elige el día y la hora', 4000); }
    else {
      const a = new Date(rDay.value + 'T' + rFrom.value).getTime(), b = new Date(rDay.value + 'T' + rTo.value).getTime();
      if (!a || !b || b <= a) return toast('🎲 La hora «hasta» tiene que ser después de «desde»', 5000);
      const lo = Math.max(a, Date.now() + 60000);
      if (lo >= b) return toast('🎲 Esa franja ya ha pasado: elige otra', 5000);
      // si no has cambiado la franja, se queda la hora que ya había salido al azar
      at = s && s.mode === 'random' && s.win?.day === rDay.value && s.win?.from === rFrom.value && s.win?.to === rTo.value ? s.at : lo + Math.random() * (b - lo);
      win = { day: rDay.value, from: rFrom.value, to: rTo.value };
    }
    const to = tie.checked ? tieChecks.filter(c => c.checked).map(c => c.value) : null;
    if (tie.checked && to.length < 2) return toast('⚔️ Marca al menos a 2 gnomos empatados', 4000);
    try {
      const hs = await Promise.all(goods.map(g => hashAns(id, g)));
      const sc = await store.gDoc('gnome', 'sched');
      const list = (ok(sc) ? sc.list || [] : []).filter(x => x.id !== id);
      const me2 = { id, at: Math.round(at), mode, win, tie: !!tie.checked, to, until: FAR };
      list.push(me2);
      const ch = await recomputeUntil(list);
      await store.gPut('gqk', id, { ok: kind === 'opts' ? okI : -1, answers: kind === 'text' ? goods : [] });
      await store.gPut('gq', id, { ...data, hs, tie: !!tie.checked, ...(to ? { to } : {}), atTs: me2.at, untilTs: me2.until });
      for (const x of ch) if (x.id !== id) await store.gPut('gq', x.id, { untilTs: x.until }, true);
      await saveSched(list);
      toast(mode === 'now' ? '⚡ ¡Pregunta lanzada! Les sale ya' : mode === 'random' ? `🎲 Guardada: saldrá al azar el ${new Date(at).toLocaleDateString('es-ES')} entre ${win.from} y ${win.to}` : `📅 Guardada: saldrá el ${when(at)}`, 4500);
      questionsView(root);
    } catch (e) { toast(errTxt(e), 7000); }
  };
  put(root, 
    el('div', { class: 'adm-sticky' },
      el('button', { class: 'btn btn-ghost small-btn no-delay', onclick: () => questionsView(root) }, '← Volver'),
      el('button', { class: 'btn small-btn no-delay', onclick: save }, '💾 Guardar')),
    el('h3', {}, isNew ? '➕ Nueva pregunta' : '✏️ Editar pregunta'),
    s && !s._new && s.at <= Date.now() ? el('p', { class: 'gn-warn' }, '⚠️ Esta pregunta ya ha salido. Si la cambias, los puntos se vuelven a calcular.') : null,
    el('div', { class: 'card' }, el('label', { class: 'aq-lbl' }, 'Tipo de pregunta'), kindPick),
    el('div', { class: 'card qp-qbody' }, el('label', {}, 'Frase (opcional)', title), el('label', { class: 'aq-lbl' }, '❓ Pregunta'), question, optsBox, textBox),
    el('div', { class: 'card' }, el('h3', {}, '📅 ¿Cuándo sale?'), modePick, whenBox),
    el('div', { class: 'card' }, el('label', { class: 'inline' }, tie, el('b', {}, ' ⚔️ Es una pregunta de desempate')), tieBox),
    el('button', { class: 'btn btn-ghost no-delay', onclick: () => askQuestion({ id, tie: tie.checked }, null, { preview: { kind, q: question.value.trim() || '¿…?', title: title.value.trim(), opts: ins.map(x => x.value.trim()) } }) }, '👀 Ver cómo queda'));
}

async function resultsView(root, s) {
  put(root, loading());
  const [st, q, k, R] = await Promise.all([loadAll({ answers: false }), store.gDoc('gq', s.id), store.gDoc('gqk', s.id), store.gDoc('ga', s.id)]);
  const r = scoreQuestion(st, s, R);
  const pts = {}; r.ev.forEach(e => { pts[e.uid] = (pts[e.uid] || 0) + e.pts; });
  const goods = ok(k) ? (k.answers?.length ? k.answers : ok(q) && k.ok >= 0 ? [q.opts[k.ok]] : []) : [];
  const toggle = async (uid, val) => { try { await store.gPut('ga', s.id, { ov: { [uid]: val } }, true); toast('💾 Cambiado'); resultsView(root, s); } catch (e) { toast(errTxt(e), 6000); } };
  const T = KTXT();
  put(root, 
    el('div', { class: 'adm-sticky' }, el('button', { class: 'btn btn-ghost small-btn no-delay', onclick: () => questionsView(root) }, '← Volver')),
    el('h3', {}, '📬 ' + (ok(q) ? q.q : 'Resultados')),
    el('div', { class: 'card' }, el('p', {}, '✅ Respuesta buena: ', el('b', {}, goods.join(' · ') || '—')),
      el('small', { class: 'muted' }, `Salió: ${when(s.at)} · ${r.closed ? 'cerrada' : 'en juego'}${s.until && s.until < FAR ? (r.closed ? ' · se cerró: ' : ' · se cierra: ') + when(s.until) : ''}`)),
    el('div', { class: 'gn-res' },
      ...r.ans.map((a, i) => el('div', { class: 'gn-resrow ' + (a.ok ? 'ok' : 'bad') },
        el('span', { class: 'gn-respos' }, `${i + 1}º`),
        el('b', {}, a.nm || nameOf(st, a.uid)),
        el('span', {}, `«${a.a}» ${a.ok ? '✅' : '❌'}`),
        el('small', {}, hm(a.at) + (i ? ` (+${gap(a.at - r.ans[0].at)})` : '')),
        el('span', { class: 'gn-respts' }, (pts[a.uid] > 0 ? '+' : '') + (pts[a.uid] || 0)),
        el('button', { class: 'btn btn-ghost small-btn no-delay', title: 'Cambiar si estaba bien o mal', onclick: () => toggle(a.uid, !a.ok) }, a.ok ? 'Marcar ❌' : 'Marcar ✅'))),
      ...st.players.filter(p => !(ok(R) && R[p.uid])).map(p => el('div', { class: 'gn-resrow none' }, el('span', { class: 'gn-respos' }, '—'), el('b', {}, p.name), el('span', {}, r.closed ? '⏰ No contestó' : '⏳ Todavía no ha contestado'), el('span', { class: 'gn-respts' }, (pts[p.uid] || 0) ? String(pts[p.uid]) : '')))),
    r.steal ? el('p', { class: 'card' }, `😈 ${nameOf(st, r.steal.by)} le quitó 1 punto a ${nameOf(st, r.steal.to)}`) : r.first && !s.tie ? el('p', { class: 'muted' }, `😈 ${nameOf(st, r.first.uid)} todavía no ha elegido a quién quitar 1 punto.`) : null,
    el('div', { class: 'card' }, el('h3', {}, 'Puntos de esta pregunta'), ...r.ev.map(e => el('p', {}, `${e.pts > 0 ? '+' : ''}${e.pts} · ${nameOf(st, e.uid)} · ${T[e.k]}`))));
}

// ---- puntos a mano
async function pointsView(root) {
  put(root, loading());
  const st = await loadAll();
  const give = async p => {
    let n = 1;
    const num = el('b', { class: 'gn-pnum' }, '+1');
    const set = v => { n = v; num.textContent = (n > 0 ? '+' : '') + n; num.className = 'gn-pnum ' + (n < 0 ? 'minus' : 'plus'); };
    const why = el('input', { type: 'text', maxlength: 120, placeholder: 'Motivo. Ej.: Ha hecho muy bien la actividad del día 3' });
    const box = el('div', { class: 'gn-givebox' }, el('h2', {}, el('span', { class: 'gn-name' }, p.name)), num,
      el('div', { class: 'gn-quick' }, ...[-5, -2, -1, 1, 2, 3, 5].map(v => el('button', { type: 'button', class: 'btn ' + (v < 0 ? 'btn-ghost' : '') + ' small-btn no-delay', onclick: () => set(v) }, (v > 0 ? '+' : '') + v))),
      el('label', {}, 'Motivo (lo verán en su historial)', why));
    if (!await popup(box, { cls: 'small', buttons: [{ label: 'Cancelar', value: false, cls: 'btn-ghost' }, { label: '💾 Guardar', value: true }] })) return;
    try {
      const a = await store.gDoc('gnome', 'adj'); const list = ok(a) ? a.list || [] : [];
      list.push({ id: newId(), uid: p.uid, pts: n, why: why.value.trim(), at: Date.now() });
      await store.gPut('gnome', 'adj', { list }); toast(`${n > 0 ? '✨ +' : '➖ '}${n} para ${p.name}`); pointsView(root);
    } catch (e) { toast(errTxt(e), 6000); }
  };
  const adj = st.adj.slice().sort((a, b) => b.at - a.at);
  put(root, back(root),
    el('div', { class: 'gn-plist' }, ...st.rank.map(r => el('div', { class: 'gn-prow' },
      el('b', { class: 'gn-name' }, r.name), el('span', { class: 'gn-mini-ball' }, String(r.score)),
      el('button', { class: 'btn btn-ghost small-btn no-delay', onclick: () => give(r) }, '➖ / ➕')))),
    el('h3', {}, '📜 Puntos puestos a mano'),
    adj.length ? el('div', { class: 'gn-hist' }, ...adj.map(a => el('div', { class: 'gn-hrow ' + (a.pts > 0 ? 'plus' : 'minus') },
      el('b', {}, (a.pts > 0 ? '+' : '') + a.pts), el('span', {}, nameOf(st, a.uid) + (a.why ? ': ' + a.why : '') + (a.at < st.since ? ' (antes de empezar: no cuenta)' : '')), el('small', {}, when(a.at)),
      el('button', { class: 'ed-del no-delay', title: 'Borrar', onclick: async () => {
        if (!await popup('<h2>🗑️</h2><p>¿Borrar estos puntos?</p>', { cls: 'small', buttons: [{ label: 'No', value: false, cls: 'btn-ghost' }, { label: 'Sí', value: true }] })) return;
        try { const x = await store.gDoc('gnome', 'adj'); await store.gPut('gnome', 'adj', { list: (ok(x) ? x.list || [] : []).filter(y => y.id !== a.id) }); pointsView(root); } catch (e) { toast(errTxt(e), 6000); }
      } }, '✕')))) : el('p', { class: 'muted' }, 'Todavía no has puesto puntos a mano.'));
}

// ---- premios y metas
async function prizesView(root) {
  put(root, loading());
  const st = await loadAll();
  const cfg = st.cfg;
  const msIns = st.ms.map(m => el('input', { type: 'number', min: 1, max: 999, value: m, class: 'gn-msin' }));
  const msBox = el('div', { class: 'gn-row' }, ...msIns);
  const addMs = el('button', { type: 'button', class: 'btn btn-ghost small-btn no-delay', onclick: () => { if (msIns.length >= 5) return; const i = el('input', { type: 'number', min: 1, max: 999, value: (+msIns[msIns.length - 1]?.value || 0) + 10, class: 'gn-msin' }); msIns.push(i); msBox.append(i); } }, '➕ Meta');
  const delMs = el('button', { type: 'button', class: 'btn btn-ghost small-btn no-delay', onclick: () => { if (msIns.length <= 1) return; msIns.pop().remove(); } }, '➖ Meta');
  const F = {}; const imgs = {};
  const prizeBox = (p, k, label) => {
    const cur = cfg.prizes?.[p.uid]?.[k] || {};
    const t = el('input', { type: 'text', maxlength: 80, value: cur.t || '', placeholder: 'Ej.: Cena en tu restaurante favorito' });
    const d = el('textarea', { rows: 2, maxlength: 300, placeholder: 'Frase (opcional)' }, cur.d || '');
    const id = p.uid + '_' + k; imgs[id] = { img: null, changed: false, had: !!cur.img };
    const ib = el('div', { class: 'aq-imgbox' });
    const fi = el('input', { type: 'file', accept: 'image/*', style: 'display:none', onchange: async () => {
      const f = fi.files[0]; fi.value = ''; if (!f) return;
      try { imgs[id].img = await shrink(f, 900, 260000); imgs[id].changed = true; draw(); } catch { toast('No se ha podido usar esa foto', 5000); }
    } });
    const draw = () => { const x = imgs[id]; ib.replaceChildren((x.img || (!x.changed && x.had)) ? el('div', { class: 'aq-thumb' }, x.img ? el('img', { src: x.img, alt: '' }) : el('span', { class: 'qp-hasimg' }, '📷 Foto guardada'),
      el('button', { type: 'button', class: 'ed-del no-delay', title: 'Quitar la foto', onclick: () => { x.img = ''; x.changed = true; draw(); } }, '✕'))
      : el('button', { type: 'button', class: 'btn btn-ghost small-btn no-delay', onclick: () => fi.click() }, '📷 Añadir foto'), fi); };
    draw();
    if (cur.img) prizeImg(p.uid, k).then(src => { if (src && !imgs[id].changed) { imgs[id].img = src; draw(); } });
    (F[p.uid] = F[p.uid] || {})[k] = { t, d };
    const key = p.uid + '_' + k, dlv = cfg.delivered?.[key];
    const dl = el('input', { type: 'checkbox', checked: !!dlv }); (F[p.uid][k]).dl = dl;
    return el('div', { class: 'gn-pedit' + (k === 'g' ? ' grand' : '') }, el('b', {}, label), el('label', {}, 'Regalo', t), d, ib,
      el('label', { class: 'inline' }, dl, ' Entregado ✓'));
  };
  const people = st.players.map(p => el('details', { class: 'card gn-pcard' }, el('summary', {}, el('span', { class: 'gn-name' }, p.name), ` · ${st.score[p.uid]} pt`),
    ...st.ms.map((m, i) => prizeBox(p, KEYS[i], `🎁 Meta ${i + 1}${unlocked(st, p.uid, i) ? ' (¡conseguida!)' : ''}`)),
    prizeBox(p, 'g', '⭐ Gran premio (solo si gana)')));
  const save = async () => {
    const ms = msIns.map(i => +i.value).filter(x => x > 0).sort((a, b) => a - b);
    if (!ms.length) return toast('Pon al menos una meta', 4000);
    try {
      const prizes = {}, delivered = { ...(cfg.delivered || {}) };
      for (const p of st.players) {
        prizes[p.uid] = {};
        for (const k of Object.keys(F[p.uid] || {})) {
          const f = F[p.uid][k], id = p.uid + '_' + k, x = imgs[id];
          if (x.changed) { if (x.img) await store.gPut('gimg', id, { img: x.img }); else await store.gDel('gimg', id).catch(() => {}); delete imgCache[id]; }
          prizes[p.uid][k] = { t: f.t.value.trim(), d: f.d.value.trim(), img: x.changed ? !!x.img : x.had };
          if (f.dl.checked) delivered[id] = delivered[id] || Date.now(); else delete delivered[id];
        }
      }
      const c = await store.gDoc('gnome', 'cfg');
      await store.gPut('gnome', 'cfg', { ...(ok(c) ? c : {}), ms, prizes, delivered });
      toast('💾 Premios guardados'); prizesView(root);
    } catch (e) { toast(errTxt(e), 7000); }
  };
  // lista de premios conseguidos
  const got = [];
  st.players.forEach(p => st.ms.forEach((m, i) => { if (unlocked(st, p.uid, i)) got.push({ p, k: KEYS[i], label: `${m} pt` }); }));
  if (st.winner) got.push({ p: st.players.find(x => x.uid === st.winner), k: 'g', label: 'Gran premio' });
  put(root, 
    el('div', { class: 'adm-sticky' },
      el('button', { class: 'btn btn-ghost small-btn no-delay', onclick: () => gnomesAdmin(root) }, '← Volver'),
      el('button', { class: 'btn small-btn no-delay', onclick: save }, '💾 Guardar')),
    el('div', { class: 'card' }, el('h3', {}, '🎯 Metas (iguales para todos)'), el('p', { class: 'muted' }, 'Al llegar a estos puntos se desbloquea un regalo. Una vez conseguido, ya es suyo aunque luego pierda puntos.'), msBox, el('div', { class: 'gn-row' }, addMs, delMs)),
    got.length ? el('div', { class: 'card' }, el('h3', {}, '🎁 Regalos conseguidos'), ...got.map(g => el('p', {}, `${cfg.delivered?.[g.p.uid + '_' + g.k] ? '✅ Entregado' : '⏳ Por entregar'} · `, el('b', {}, g.p.name), ` · ${g.label}: ${cfg.prizes?.[g.p.uid]?.[g.k]?.t || '(sin título)'}`)),
      el('small', { class: 'muted' }, 'Marca «Entregado ✓» en el regalo de cada uno (abajo) y guarda.')) : null,
    el('h3', {}, '👤 Los regalos de cada gnomo'),
    st.players.length ? el('div', {}, ...people) : el('p', { class: 'muted' }, 'Todavía no hay gnomos.'));
}

// ---- ajustes
async function settingsView(root) {
  put(root, loading());
  const st = await loadAll();
  const end = el('input', { type: 'datetime-local', class: 'qp-date', value: toLocalInput(st.endAt) });
  const saveCfg = async patch => { const c = await store.gDoc('gnome', 'cfg'); await store.gPut('gnome', 'cfg', { ...(ok(c) ? c : {}), ...patch }); };
  const tieInfo = st.ended && !st.winner && st.tied.length > 1
    ? el('div', { class: 'card gn-warn' }, el('p', {}, '⚔️ Hay empate entre: ', el('b', {}, st.tied.map(u => nameOf(st, u)).join(', '))),
      el('button', { class: 'btn no-delay', onclick: () => editor(root, { id: newId(), tie: true, to: st.tied, mode: 'now', at: Date.now() + 1, _new: true }) }, '⚔️ Preparar la pregunta de desempate'))
    : null;
  put(root, back(root),
    tieInfo,
    el('div', { class: 'card' }, el('h3', {}, '🏁 Final del juego'),
      el('p', { class: 'muted' }, 'A esta hora se cierran los puntos y se revela quién gana el Gran premio (normalmente, el 25 de diciembre a las 00:00).'), end,
      el('div', { class: 'gn-row' },
        el('button', { class: 'btn small-btn no-delay', onclick: async () => { try { await saveCfg({ endAt: new Date(end.value).getTime() || null }); toast('💾 Guardado'); settingsView(root); } catch (e) { toast(errTxt(e), 6000); } } }, '💾 Guardar'),
        el('button', { class: 'btn btn-ghost small-btn no-delay', onclick: async () => { try { await saveCfg({ endAt: null }); toast('↺ El 25 de diciembre'); settingsView(root); } catch (e) { toast(errTxt(e), 6000); } } }, '↺ El día 25')),
      el('p', { class: 'muted' }, st.ended ? '✅ El juego ya ha terminado.' : `⏳ Termina: ${when(st.endAt)}`),
      el('p', { class: 'muted' }, '🧪 Para probar en noviembre: pon una hora que ya haya pasado, mira el final, y luego pulsa «↺ El día 25».')),
    el('div', { class: 'card' }, el('h3', {}, '🔄 Poner el marcador a 0'),
      el('p', { class: 'muted' }, 'Lo de antes ya no cuenta (preguntas y puntos a mano). El 1 de diciembre se pone a 0 solo, así puedes probar ahora en noviembre.'),
      el('button', { class: 'btn btn-ghost no-delay', onclick: async () => {
        if (!await popup('<h2>🔄</h2><p>¿Poner el marcador de todos los gnomos a 0?</p>', { cls: 'small', buttons: [{ label: 'No', value: false, cls: 'btn-ghost' }, { label: 'Sí, a 0', value: true }] })) return;
        try { await saveCfg({ since: Date.now() }); toast('🔄 Marcador a 0'); settingsView(root); } catch (e) { toast(errTxt(e), 6000); }
      } }, '🔄 Poner a 0 ahora')),
    el('div', { class: 'card' }, el('h3', {}, '🎬 Probar las animaciones'),
      el('div', { class: 'gn-row' },
        el('button', { class: 'btn btn-ghost small-btn no-delay', onclick: () => { const p = st.players[0]; if (!p) return toast('No hay gnomos'); document.querySelectorAll('.popup-back').forEach(x => x.style.display = 'none'); showUnlock(st, p.uid, 'm0', 0).then(() => document.querySelectorAll('.popup-back').forEach(x => x.style.display = '')); } }, '🎁 Regalo conseguido'),
        el('button', { class: 'btn btn-ghost small-btn no-delay', onclick: () => { const p = st.rank[0]; if (!p) return toast('No hay gnomos'); document.querySelectorAll('.popup-back').forEach(x => x.style.display = 'none'); showFinal({ ...st, winner: p.uid }).then(() => { const iv = setInterval(() => { if (!document.querySelector('.gn-final')) { clearInterval(iv); document.querySelectorAll('.popup-back').forEach(x => x.style.display = ''); } }, 400); }); } }, '⭐ Final del día 25'))));
}


// ================================================================ (V24.1) PUNTOS DE GNOMO EN LOS JUEGOS
// La administradora elige en qué juegos se ganan puntos (gnome/cfg.games). Cada gnomo guarda lo suyo en gb/{uid}_{juego}:
//   { uid, game, start (cuándo empezó su partida de puntos), lv (niveles pasados en esa partida), pts (puntos ya cobrados), at }
// Solo cuenta la PRIMERA partida de cada gnomo (desde que empieza el juego de los gnomos).
export const GAMES = [
  { id: 'candy8', day: 8, name: () => L('Dulce Navidad', 'Dolç Nadal', 'Sweet Christmas'), adm: 'Dulce Navidad (día 8)',
    help: 'En su PRIMERA partida: si pasan el nivel 2 ganan unos puntos; si pasan los 5 niveles, más.', def: { on: true, p2: 1, p5: 3 },
    fields: [['p2', 'Si pasan 2 niveles'], ['p5', 'Si pasan los 5 niveles (en total)']], prog: b => `${b.lv || 0}/5 niveles`,
    owed: (lv, r) => lv >= 5 ? +r.p5 || 0 : lv >= 2 ? +r.p2 || 0 : 0 },
  // (V25.3) la oca del día 10: ganar a la máquina la PRIMERA vez; perder resta 1 (como mucho 1 al día)
  { id: 'oca10', day: 10, name: () => L('La oca de Navidad', 'L’oca de Nadal', 'The Christmas goose game'), adm: 'La oca de Navidad (día 10)',
    help: 'La PRIMERA vez que ganan a la máquina ganan estos puntos. Si pierden contra la máquina: −1 (como mucho 1 al día).', def: { on: true, pw: 2 },
    fields: [['pw', 'Al ganar a la máquina (1.ª vez)']], prog: b => (b.lv ? '🏆 ha ganado' : 'aún no ha ganado') + (b.neg ? ` · −${b.neg} por perder` : ''),
    owed: (lv, r) => lv >= 1 ? +r.pw || 0 : 0 },
  // (V26) el parchís en línea del día 12: su PRIMERA partida acabada, puntos según el puesto (con 4 jugadores: 4, 3, 2, 1); abandonar o no acabarla: −1
  { id: 'parchis12', day: 12, name: () => L('El parchís de Navidad', 'El parxís de Nadal', 'Christmas ludo'), adm: 'El parchís en línea (día 12)',
    help: 'Solo cuenta su PRIMERA partida en línea que acaba: el 1.º gana tantos puntos como jugadores hay (4 si son 4), el 2.º uno menos… y el último 1. Quien abandona o no la acaba: −1 (cada vez).', def: { on: true },
    fields: [], prog: b => `${b.lv || 0} puntos ganados` + (b.neg ? ` · −${b.neg} por abandonar` : ''),
    owed: lv => lv || 0 },
  // (V27.4) cada casilla hecha (en diciembre; en noviembre, desde que empezó el juego de los gnomos): +1 (configurable). Se suma solo.
  { id: 'doors', day: 0, name: () => L('Casillas hechas', 'Caselles fetes', 'Doors done'), adm: 'Casillas del calendario hechas',
    help: 'Cada casilla que hacen suma estos puntos (se suman solos, sin botón). Si les reinicias una casilla, se resta.', def: { on: true, pw: 1 },
    fields: [['pw', 'Puntos por cada casilla hecha']], prog: b => `${b.lv || 0} casillas hechas`,
    owed: (lv, r) => lv * (+r.pw || 0) },
  // (V28) el 4 en raya del día 1: su PRIMERA partida acabada (contra el Pare Noel o en línea): ganar +2, perder o empatar +1
  { id: 'c4', day: 1, name: () => L('El 4 en raya', 'El 4 en ratlla', 'Connect 4'), adm: 'El 4 en raya (día 1)',
    help: 'Solo cuenta su PRIMERA partida acabada (contra el Pare Noel o en línea): si gana, estos puntos; si pierde o empata (pero juega), los otros. Se suman solos.', def: { on: true, pw: 2, pl: 1 },
    fields: [['pw', 'Ganar (1.ª partida)'], ['pl', 'Perder o empatar (1.ª partida)']], prog: b => b.lv >= 2 ? '🏆 ganó su 1.ª partida' : b.lv >= 1 ? 'jugó su 1.ª partida' : 'aún no ha jugado',
    owed: (lv, r) => lv >= 2 ? +r.pw || 0 : lv >= 1 ? +r.pl || 0 : 0 },
  // (V27.3) el solitario del día 13: la PRIMERA vez que lo resuelven
  { id: 'sol13', day: 13, name: () => L('El solitario de Navidad', 'El solitari de Nadal', 'Christmas solitaire'), adm: 'El solitario de Navidad (día 13)',
    help: 'La PRIMERA vez que resuelven el solitario ganan estos puntos (botón verde para cobrar). No resta nada.', def: { on: true, pw: 2 },
    fields: [['pw', 'Al resolverlo (1.ª vez)']], prog: b => b.lv ? '🏆 lo ha resuelto' : 'aún no lo ha resuelto',
    owed: (lv, r) => lv >= 1 ? +r.pw || 0 : 0 },
  // (V27) los marcianitos del día 16 (debajo del diploma): la PRIMERA vez que llegan a 100 puntos
  { id: 'inv16', day: 16, name: () => L('Los marcianitos de Navidad', 'Els marcianets de Nadal', 'Christmas space invaders'), adm: 'Los marcianitos de Navidad (día 16)',
    help: 'La PRIMERA vez que llegan a 100 puntos ganan estos puntos (botón verde para cobrar). No resta nada.', def: { on: true, pw: 2 },
    fields: [['pw', 'Al llegar a 100 puntos (1.ª vez)']], prog: b => b.lv ? '🏆 ha llegado a 100' : 'aún no ha llegado a 100',
    owed: (lv, r) => lv >= 1 ? +r.pw || 0 : 0 },
];
export const gameName = id => GAMES.find(g => g.id === id)?.name() || id;
const gameRules = (cfg, id) => { const g = GAMES.find(x => x.id === id); return { ...(g?.def || {}), ...(cfg?.games?.[id] || {}) }; };

// estado del gnomo en ese juego: null si no es gnomo o el juego no da puntos
export async function gameBonusState(id) {
  if (!isGnome() || !S.user) return null;
  let cfg = await store.gDoc('gnome', 'cfg').catch(() => ({ __denied: true })); if (cfg?.__denied) return null; cfg = cfg || {};
  const r = gameRules(cfg, id); if (!r.on) return null;
  const since = sinceOf(cfg), end = endOf(cfg), now = Date.now();
  if (now >= end) return null;
  let doc = await store.gDoc('gb', S.user.uid + '_' + id).catch(() => null);
  if (!ok(doc) || !(doc.start >= since)) doc = null; // de antes de empezar (pruebas): no cuenta
  return { id, rules: r, doc, since, end };
}
// empieza la partida de puntos (la primera); devuelve true si esta partida es la que cuenta
export async function gameBonusStart(bs) {
  if (!bs || bs.doc) return false;
  const now = Date.now(); bs.doc = { uid: S.user.uid, game: bs.id, start: now, lv: 0, pts: 0, at: now };
  try { await store.gPut('gb', S.user.uid + '_' + bs.id, bs.doc); return true; } catch (e) { console.warn(e); bs.doc = null; return false; }
}
// puntos que le tocan según los niveles pasados en su primera partida
export const gameBonusOwed = bs => { if (!bs?.doc) return 0; const g = GAMES.find(x => x.id === (bs.id || bs.doc.game)); return g ? g.owed(bs.doc.lv || 0, bs.rules || {}) : 0; };
export async function gameBonusLevel(bs, lv) {
  if (!bs?.doc || lv <= (bs.doc.lv || 0)) return;
  bs.doc = { ...bs.doc, lv }; try { await store.gPut('gb', S.user.uid + '_' + bs.id, bs.doc); } catch (e) { console.warn(e); }
}
// cobrar: el marcador de los gnomos suma la diferencia
// (V25.3) perder contra la máquina: −1 en el marcador de los gnomos, como mucho una vez al día
export async function gamePenalty(bs) {
  if (!bs) return 0;
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
  const now = Date.now();
  const d = bs.doc || { uid: S.user.uid, game: bs.id, start: now, lv: 0, pts: 0, at: now };
  if (d.negd === today) return 0;
  bs.doc = { ...d, neg: (d.neg || 0) + 1, negd: today, nat: now };
  try { await store.gPut('gb', S.user.uid + '_' + bs.id, bs.doc); LAST = null; try { reloadFab(); } catch {} return 1; } catch (e) { console.warn(e); return 0; }
}
// (V26) parchís: suma los puntos del puesto (se cobran solos) / resta 1 por abandonar
export async function gamePlacePts(id, add) {
  const bs = await gameBonusState(id); if (!bs || !(add > 0)) return 0;
  const now = Date.now(), d = bs.doc || { uid: S.user.uid, game: id, start: now, lv: 0, pts: 0, at: now };
  if ((d.lv || 0) > 0) return 0; // solo cuenta la PRIMERA partida en línea que acaba (como Dulce Navidad y la oca)
  const lv = Math.min(300, (d.lv || 0) + add);
  bs.doc = { ...d, lv, pts: lv, at: now };
  try { await store.gPut('gb', S.user.uid + '_' + id, bs.doc); LAST = null; try { reloadFab(); } catch {} return add; } catch (e) { console.warn(e); return 0; }
}
export async function gameAbandon(id) {
  const bs = await gameBonusState(id); if (!bs) return 0;
  const now = Date.now(), d = bs.doc || { uid: S.user.uid, game: id, start: now, lv: 0, pts: 0, at: now };
  bs.doc = { ...d, neg: Math.min(60, (d.neg || 0) + 1), nat: now };
  try { await store.gPut('gb', S.user.uid + '_' + id, bs.doc); LAST = null; try { reloadFab(); } catch {} return 1; } catch (e) { console.warn(e); return 0; }
}
// (V27.4) puntos de gnomo por las casillas hechas: se cuentan las respuestas guardadas desde que empezó el juego de los gnomos
export async function syncDoorPts(quiet = false) {
  if (!isGnome() || !S.user) return 0;
  const bs = await gameBonusState('doors'); if (!bs) return 0;
  const end = bs.end || FAR;
  const n = Object.entries(S.answers || {}).filter(([d, a]) => +d >= 1 && +d <= 25 && a && +a.at >= bs.since && +a.at < end).length;
  const lv = Math.min(25, n), pts = Math.min(300, lv * Math.max(0, +bs.rules.pw || 0));
  const before = bs.doc?.pts || 0;
  if (bs.doc && (bs.doc.lv || 0) === lv && before === pts) return 0;
  const now = Date.now();
  bs.doc = { ...(bs.doc || { uid: S.user.uid, game: 'doors', start: now }), lv, pts, at: now };
  try { await store.gPut('gb', S.user.uid + '_doors', bs.doc); LAST = null; try { reloadFab(); } catch {} } catch (e) { console.warn(e); return 0; }
  if (!quiet && pts > before) toast('🍄 +' + (pts - before) + ' ' + L('para tu juego de los gnomos', 'per al teu joc dels gnoms', 'for your gnome game'), 3500);
  return pts - before;
}
export async function gameBonusClaim(bs) {
  const owed = gameBonusOwed(bs), add = owed - (bs.doc?.pts || 0); if (add <= 0) return 0;
  bs.doc = { ...bs.doc, pts: owed, at: Date.now() };
  await store.gPut('gb', S.user.uid + '_' + bs.id, bs.doc);
  LAST = null; try { reloadFab(); } catch {}
  return add;
}

async function gamesView(root) {
  put(root, loading());
  const st = await loadAll();
  const cfg = st.cfg;
  const rows = GAMES.map(g => {
    const r = gameRules(cfg, g.id);
    const on = el('input', { type: 'checkbox' }); on.checked = !!r.on;
    const ins = Object.fromEntries(g.fields.map(([k]) => [k, el('input', { type: 'number', min: 0, max: 5, value: r[k], class: 'gn-msin' })]));
    const got = (st.gb || []).filter(b => b.game === g.id && b.start >= st.since);
    return { g, on, ins, node: el('div', { class: 'card gn-gamecard' },
      el('label', { class: 'gn-gameon' }, on, el('b', {}, '🎮 ' + g.adm)),
      el('p', { class: 'muted' }, g.help),
      el('div', { class: 'gn-gamepts' }, ...g.fields.map(([k, lab]) => el('label', {}, lab, ins[k]))),
      got.length ? el('div', { class: 'gn-hist' }, ...got.map(b => el('div', { class: 'gn-hrow ' + (b.pts > 0 ? 'plus' : '') },
        el('b', {}, '+' + (b.pts || 0)), el('span', {}, `${nameOf(st, b.uid)} · ${g.prog(b)}` + ((b.pts || 0) < gameBonusOwed({ id: g.id, doc: b, rules: r }) ? ' · aún no lo ha cobrado' : '')), el('small', {}, when(b.start)),
        el('button', { class: 'ed-del no-delay', title: 'Borrar (podrá volver a jugar su partida de puntos)', onclick: async () => {
          if (!await popup(`<h2>🗑️</h2><p>¿Borrar la partida de puntos de ${esc(nameOf(st, b.uid))}? Pierde estos puntos y podrá jugarla otra vez.</p>`, { cls: 'small', buttons: [{ label: 'No', value: false, cls: 'btn-ghost' }, { label: 'Sí', value: true }] })) return;
          try { await store.gDel('gb', b.id); gamesView(root); } catch (e) { toast(errTxt(e), 6000); }
        } }, '✕'))))
        : el('p', { class: 'muted' }, 'Ningún gnomo ha jugado todavía su partida de puntos.')) };
  });
  const save = el('button', { class: 'btn btn-big no-delay', onclick: async () => {
    const games = { ...(cfg.games || {}) };
    rows.forEach(({ g, on, ins }) => { games[g.id] = { on: on.checked, ...Object.fromEntries(Object.entries(ins).map(([k, i]) => [k, Math.max(0, Math.min(5, +i.value || 0))])) }; });
    try { await store.gPut('gnome', 'cfg', { games }, true); toast('💾 Guardado'); gamesView(root); } catch (e) { toast(errTxt(e), 6000); }
  } }, '💾 Guardar');
  // meta del contador de «4 en raya» de Dulce Navidad (para TODOS los jugadores, no solo gnomos)
  const goalIn = el('input', { type: 'number', min: 5, max: 999, value: +(S.config?.candyGoal) || 100, class: 'gn-msin' });
  const goalCard = el('div', { class: 'card gn-gamecard' }, el('b', {}, '⭐ Dulce Navidad · meta del contador (para todos)'),
    el('p', { class: 'muted' }, 'Cada vez que alguien junta 4 o más iguales (sale la estrella mágica) suma 1 en su contador. Al llegar a esta meta, ¡celebración!'),
    el('div', { class: 'gn-gamepts' }, el('label', {}, 'Meta', goalIn),
      el('button', { class: 'btn small-btn no-delay', onclick: async () => {
        const v = Math.max(5, Math.min(999, Math.round(+goalIn.value || 100)));
        try { await store.saveConfig({ candyGoal: v }); S.config.candyGoal = v; toast('💾 Meta: ' + v); } catch (e) { toast(errTxt(e), 6000); }
      } }, '💾 Guardar meta')));
  put(root, back(root), goalCard,
    el('p', { class: 'muted' }, 'Marca los juegos en los que los gnomos pueden ganar puntos para su marcador. Solo cuenta su PRIMERA partida (en la oca, su primera victoria contra la máquina). Al conseguirlo les sale un botón 🍄 para cobrar los puntos (y aparecen en su historial como «🎮 Juego»).'),
    ...rows.map(r => r.node), save,
    el('p', { class: 'muted', style: 'margin-top:12px' }, 'Más juegos: se pueden ir añadiendo a esta lista.'));
}
