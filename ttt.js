// Día 17: tres en raya navideño (galleta contra perrito). Cada uno tiene 3 fichas que se arrastran
// y se pueden volver a mover. Al acabar, cada uno pulsa su dibujo: si ha ganado, baila; si ha perdido, decepción.
import { el, sleep, confetti, popup, toast } from './fx.js?v=23';
import { shareResult, fireworks } from './share.js?v=23';
import { getLang } from './i18n.js?v=23';
import { pop, chime, fanfare, christmasSong, unlockAudio, snapSound, slideSound, sadTrombone } from './sound.js?v=23';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const P = {
  g: { face: 'ttt-galleta-cara.webp', full: 'ttt-galleta.webp', dance: 'ttt-baile-galleta.webp', col: 'green', name: () => L('la Galleta', 'la Galeta', 'the Gingerbread'), short: () => L('Galleta', 'Galeta', 'Gingerbread') },
  r: { face: 'ttt-perro-cara.webp', full: 'ttt-perro.webp', dance: 'ttt-baile-perro.webp', col: 'red', name: () => L('el Perrito', 'el Gosset', 'the Puppy'), short: () => L('Perrito', 'Gosset', 'Puppy') },
};
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

export function render(body, ctx) {
  body.append(
    el('h2', { class: 'q-title' }, '🎄 ' + L('Tres en raya navideño', 'Tres en ratlla de Nadal', 'Christmas noughts and crosses')),
    el('p', { class: 'game-help ttt-help' }, L('Juega al tres en raya con quien quieras (o contra la app). Cuando alguien hace tres en raya, la app dice quién ha ganado. 📲 El resultado de la PRIMERA partida se envía por WhatsApp al grupo de la familia.',
      'Juga al tres en ratlla amb qui vulguis (o contra l’app). Quan algú fa tres en ratlla, l’app diu qui ha guanyat. 📲 El resultat de la PRIMERA partida s’envia per WhatsApp al grup de la família.',
      'Play with whoever you like (or against the app). When someone gets three in a row, the app says who won. 📲 Send the result of the FIRST game on WhatsApp to the family group.')));
  let firstRes = ctx.prev?.extra?.ttt || null; // la primera partida (la que se envía)
  if (firstRes) body.append(el('button', { type: 'button', class: 'btn btn-ghost small-btn no-delay ttt-sharefirst', onclick: () => shareTtt(firstRes, ctx) }, '📲 ' + L('Enviar mi primera partida', 'Enviar la meva primera partida', 'Send my first game')));
  const stage = el('div', { class: 'ttt-stage' });
  body.style.webkitUserSelect = body.style.userSelect = 'none';
  const trayR = el('div', { class: 'ttt-tray red' }), trayG = el('div', { class: 'ttt-tray green' });
  const board = el('div', { class: 'ttt-board' }, ...Array.from({ length: 9 }, (_, i) => el('div', { class: 'ttt-cell', 'data-i': i })));
  stage.append(trayR, board, trayG);
  // ---- turnos: uno cada uno (empieza quien quiera)
  let turn = null;
  const trayOf = who => (who === 'r' ? trayR : trayG);
  const turnTxt = el('p', { class: 'ttt-turn' });
  const setTurn = who => {
    turn = who;
    trayR.classList.toggle('turn', who === 'r'); trayG.classList.toggle('turn', who === 'g');
    turnTxt.replaceChildren(who ? el('span', {}, el('img', { src: P[who].face, alt: '' }), ' ' + L(`Le toca a ${P[who].name()}`, `Li toca a ${P[who].name()}`, `${P[who].name()}’s turn`))
      : el('span', {}, '🎲 ' + L('Empieza quien quiera', 'Comença qui vulgui', 'Anyone can start')));
  };
  setTurn(null);
  // ---- contador de movimientos de cada jugador (se puede cambiar con − y +)
  const limit = { g: 20, r: 20 }, left = { g: 20, r: 20 }, cnt = {};
  const counter = who => {
    const num = el('b', {}, left[who]);
    const box = el('div', { class: 'ttt-count ' + P[who].col },
      el('button', { type: 'button', class: 'ttt-cbtn no-delay', onclick: () => change(who, -1) }, '−'),
      el('div', { class: 'ttt-cnum', onclick: info }, el('small', {}, L('movim.', 'movim.', 'moves')), num),
      el('button', { type: 'button', class: 'ttt-cbtn no-delay', onclick: () => change(who, 1) }, '+'));
    cnt[who] = { box, num }; return box;
  };
  const paint = who => { cnt[who].num.textContent = left[who]; cnt[who].box.classList.toggle('empty', left[who] <= 0); cnt[who].box.classList.toggle('low', left[who] > 0 && left[who] <= 3); };
  const change = (who, d) => { left[who] = Math.max(0, Math.min(99, left[who] + d)); limit[who] = Math.max(limit[who], left[who]); pop(); paint(who); };
  function useMove(who) {
    left[who] = Math.max(0, left[who] - 1); paint(who);
    cnt[who].box.classList.remove('tick'); void cnt[who].box.offsetWidth; cnt[who].box.classList.add('tick');
    if (left[who] === 0) toast('⏳ ' + L(`¡${P[who].name()} se ha quedado sin movimientos!`, `${P[who].name()} s’ha quedat sense moviments!`, `${P[who].name()} has no moves left!`), 3500);
  }
  function info() {
    popup(el('div', { class: 'ttt-info' }, el('div', { class: 'ttt-info-ico' }, '🎯'),
      el('h2', {}, L('Contador de movimientos', 'Comptador de moviments', 'Move counter')),
      el('p', {}, L('Cada jugador tiene un contador con los movimientos que le quedan. Cada vez que pones o mueves una ficha en el tablero, se resta uno.', 'Cada jugador té un comptador amb els moviments que li queden. Cada vegada que poses o mous una fitxa al tauler, se’n resta un.', 'Each player has a counter with the moves left. Every time you place or move a piece on the board, one is taken away.')),
      el('p', {}, L('Empezáis con 20 cada uno. Con los botones − y + podéis cambiarlo cuando queráis.', 'Comenceu amb 20 cadascú. Amb els botons − i + ho podeu canviar quan vulgueu.', 'You start with 20 each. Use − and + to change it whenever you like.')),
      el('p', {}, L('Si a alguien se le acaban, ya no puede mover más fichas. ¡Pensad bien cada jugada! 🎄', 'Si a algú se li acaben, ja no pot moure més fitxes. Penseu bé cada jugada! 🎄', 'If someone runs out, they cannot move any more pieces. Think carefully! 🎄'))),
      { cls: 'small ttt-info-pop', buttons: [{ label: L('¡Entendido!', 'Entesos!', 'Got it!'), value: true }] });
  }
  trayR.append(counter('r')); trayG.append(counter('g'));
  body.append(el('button', { type: 'button', class: 'ttt-infobtn no-delay', onclick: info }, '🎯 ' + L('¿Qué es el contador de movimientos?', 'Què és el comptador de moviments?', 'What is the move counter?')));
  const res = el('div', { class: 'ttt-results' },
    el('button', { type: 'button', class: 'btn btn-ghost no-delay ttt-drawbtn', onclick: () => { if (!over) { over = true; show('draw'); } } }, '🤝 ' + L('Hemos acabado en empate', 'Hem acabat en empat', 'We ended in a draw')));
  const ask = el('p', { class: 'ttt-ask' }, L('¿Nadie consigue tres en raya? Pulsa:', 'Ningú no aconsegueix tres en ratlla? Premeu:', 'Nobody gets three in a row? Tap:'));
  // ---- jugar contra la app: tú eres la Galleta (verde) y la app mueve el Perrito (rojo)
  let ai = false, aiBusy = false;
  const modeBtn = el('button', { type: 'button', class: 'btn ttt-mode no-delay' });
  const paintMode = () => { modeBtn.textContent = ai ? '👫 ' + L('Jugar dos personas', 'Jugar dues persones', 'Two players') : '🤖 ' + L('Jugar contra la app', 'Jugar contra l’app', 'Play against the app');
    ask.style.display = res.style.display = ai ? 'none' : ''; };
  modeBtn.onclick = () => { unlockAudio(); ai = !ai; paintMode(); resetBoard();
    toast(ai ? '🤖 ' + L('Tú eres la Galleta y empiezas. El Perrito lo mueve la app.', 'Tu ets la Galeta i comences. El Gosset el mou l’app.', 'You are the Gingerbread and you start. The app moves the Puppy.') : '👫 ' + L('Ahora jugáis dos personas.', 'Ara jugueu dues persones.', 'Two players now.'), 3500); };
  { const ib = body.querySelector('.ttt-infobtn'); const row = el('div', { class: 'ttt-row' }); if (ib) { ib.replaceWith(row); row.append(modeBtn, ib); } else body.append(row.appendChild(modeBtn) && row); }
  body.append(turnTxt, stage, ask, res);
  paintMode();

  // ---- fichas
  const tokens = [];
  const make = (who, k) => {
    const t = el('div', { class: `ttt-token ${P[who].col}` }, el('img', { src: P[who].face, alt: '', draggable: 'false' }));
    const o = { who, k, el: t, cell: -1 }; tokens.push(o); stage.append(t); return o;
  };
  ['r', 'g'].forEach(w => { for (let k = 0; k < 3; k++) make(w, k); });
  // posiciones dentro del tablero sin contar animaciones (la nota entra haciéndose grande)
  const rel = n => { let x = 0, y = 0, m = n; while (m && m !== stage) { x += m.offsetLeft; y += m.offsetTop; m = m.offsetParent; } return { x, y, w: n.offsetWidth, h: n.offsetHeight }; };
  const home = o => {
    if (o.cell >= 0) { const r = rel(board.children[o.cell]); return [r.x + r.w / 2, r.y + r.h / 2]; }
    const r = rel(o.who === 'r' ? trayR : trayG); return [r.x + r.h * .55 + o.k * (r.h * .95), r.y + r.h / 2];
  };
  const place = (o, anim = true) => { const [x, y] = home(o); o.el.style.transition = anim ? 'left .25s cubic-bezier(.3,1.4,.5,1), top .25s cubic-bezier(.3,1.4,.5,1)' : 'none'; o.el.style.left = x + 'px'; o.el.style.top = y + 'px'; };
  const layout = () => tokens.forEach(o => place(o, false));
  requestAnimationFrame(layout); setTimeout(layout, 300); addEventListener('resize', layout);
  document.fonts?.ready?.then(layout);

  let drag = null, lastSlide = 0;
  stage.addEventListener('pointerdown', e => {
    const tEl = e.target.closest('.ttt-token'); if (!tEl) return;
    const o = tokens.find(x => x.el === tEl); e.preventDefault(); unlockAudio();
    try { stage.setPointerCapture(e.pointerId); } catch {}
    if (ai && o.who === 'r') { toast('🤖 ' + L('Las fichas rojas las mueve la app.', 'Les fitxes vermelles les mou l’app.', 'The app moves the red pieces.')); return; }
    if (ai && aiBusy) return;
    if (turn && o.who !== turn) { toast('⏳ ' + L(`Ahora le toca a ${P[turn].name()}`, `Ara li toca a ${P[turn].name()}`, `It is ${P[turn].name()}’s turn`)); trayOf(turn).classList.remove('nudge'); void trayOf(turn).offsetWidth; trayOf(turn).classList.add('nudge'); return; }
    if (left[o.who] <= 0) { toast('⛔ ' + L('Ya no te quedan movimientos', 'Ja no et queden moviments', 'No moves left')); return; }
    if (over) { toast('🏁 ' + L('La partida ha terminado. Pulsa «Volver a jugar».', 'La partida s’ha acabat. Prem «Tornar a jugar».', 'The game is over. Tap “Play again”.')); return; }
    if (!t0) t0 = Date.now();
    const b = stage.getBoundingClientRect();
    drag = { o, from: o.cell, id: e.pointerId, dx: parseFloat(tEl.style.left) - (e.clientX - b.left), dy: parseFloat(tEl.style.top) - (e.clientY - b.top) };
    tEl.classList.add('lift'); tEl.style.transition = 'none'; tEl.style.zIndex = 50; pop();
  });
  stage.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const b = stage.getBoundingClientRect();
    drag.o.el.style.left = (e.clientX - b.left + drag.dx) + 'px'; drag.o.el.style.top = (e.clientY - b.top + drag.dy) + 'px';
    const now = performance.now(); if (now - lastSlide > 170) { lastSlide = now; slideSound(); }
  });
  const up = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const { o, from } = drag; drag = null; o.el.classList.remove('lift'); o.el.style.zIndex = '';
    const x = parseFloat(o.el.style.left), y = parseFloat(o.el.style.top);
    let best = -1, bd = 1e9;
    [...board.children].forEach((c, i) => { const r = rel(c); const d = Math.hypot(r.x + r.w / 2 - x, r.y + r.h / 2 - y); if (d < bd) { bd = d; best = i; } });
    const cellR = rel(board.children[0]);
    let moved = false;
    if (best >= 0 && bd < cellR.w * .7 && !tokens.some(t => t !== o && t.cell === best)) { o.cell = best; place(o); snapSound(); if (best !== from) { moved = true; useMove(o.who); setTurn(o.who === 'g' ? 'r' : 'g'); } }
    else place(o); // vuelve a donde estaba
    check();
    if (ai && moved) afterMove();
    else if (moved && !over && left.g <= 0 && left.r <= 0) finishIfStuck();
  };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);

  const winner = () => {
    for (const ln of LINES) { const w = ln.map(i => tokens.find(t => t.cell === i)?.who); if (w[0] && w[0] === w[1] && w[1] === w[2]) return { who: w[0], ln }; }
    return null;
  };
  let shown = null, over = false, t0 = 0;
  function check() {
    const w = winner();
    [...board.children].forEach(c => c.classList.remove('win'));
    if (w) {
      w.ln.forEach(i => board.children[i].classList.add('win'));
      if (shown !== w.ln.join()) { shown = w.ln.join(); chime(); }
      // tres en raya: la partida se acaba sola y se dice quién ha ganado (los contadores se quedan como estaban)
      if (!over) { over = true; setTimeout(() => show(ai ? (w.who === 'g' ? 'win' : 'lose') : 'win2', ai ? 'g' : w.who), 900); }
    } else shown = null;
  }

  // ---- la app piensa su jugada
  const occ = () => { const b = Array(9).fill(null); tokens.forEach(t => { if (t.cell >= 0) b[t.cell] = t.who; }); return b; };
  const lineWin = (b, who) => LINES.some(ln => ln.every(i => b[i] === who));
  function movesOf(b, who, cellsOf) { // [desde (-1 = bandeja), hasta]
    const mine = cellsOf.filter(c => c.who === who), empty = b.map((x, i) => x ? -1 : i).filter(i => i >= 0);
    const tray = mine.filter(c => c.cell < 0);
    const froms = tray.length ? [-1] : mine.map(c => c.cell);
    const out = []; froms.forEach(f => empty.forEach(t => out.push([f, t]))); return out;
  }
  const applyMv = (b, who, [f, t]) => { const c = b.slice(); if (f >= 0) c[f] = null; c[t] = who; return c; };
  const simTokens = b => { const list = []; b.forEach((w, i) => w && list.push({ who: w, cell: i })); ['g', 'r'].forEach(w => { const n = 3 - list.filter(x => x.who === w).length; for (let k = 0; k < n; k++) list.push({ who: w, cell: -1 }); }); return list; };
  function aiChoose() {
    const b = occ(), mv = movesOf(b, 'r', simTokens(b));
    if (!mv.length) return null;
    const win = mv.find(m => lineWin(applyMv(b, 'r', m), 'r')); if (win) return win;
    const safe = mv.filter(m => { const nb = applyMv(b, 'r', m); return !movesOf(nb, 'g', simTokens(nb)).some(m2 => lineWin(applyMv(nb, 'g', m2), 'g')); });
    const pool = safe.length ? safe : mv;
    if (Math.random() < .25) return pool[Math.floor(Math.random() * pool.length)]; // a veces se despista (para que se le pueda ganar)
    const score = ([f, t]) => (t === 4 ? 3 : [0, 2, 6, 8].includes(t) ? 2 : 1) + (f === 4 ? -2 : 0) + Math.random();
    return pool.slice().sort((x, y) => score(y) - score(x))[0];
  }
  async function aiMove() {
    if (!ai || turn !== 'r' || winner()) return;
    if (left.r <= 0) { return finishIfStuck(); }
    aiBusy = true;
    turnTxt.classList.add('thinking'); await sleep(650 + Math.random() * 500); turnTxt.classList.remove('thinking');
    const m = aiChoose(); if (!m || !ai) { aiBusy = false; return; }
    const [f, t] = m; const o = f < 0 ? tokens.find(x => x.who === 'r' && x.cell < 0) : tokens.find(x => x.who === 'r' && x.cell === f);
    o.el.classList.add('lift'); o.el.style.zIndex = 50; slideSound(); await sleep(150);
    o.cell = t; place(o); await sleep(260); o.el.classList.remove('lift'); o.el.style.zIndex = '';
    snapSound(); useMove('r'); setTurn('g'); check(); aiBusy = false;
    afterMove();
  }
  function finishIfStuck() { if (!over && left.g <= 0 && left.r <= 0 && !winner()) { over = true; setTimeout(() => show('draw'), 700); } }
  function afterMove() {
    const w = winner();
    if (w) return; // ya lo ha visto check()
    if (left.g <= 0 && left.r <= 0) return finishIfStuck();
    if (turn === 'r') { if (left.r <= 0) { setTurn('g'); return; } setTimeout(aiMove, 350); }
    else if (left.g <= 0) { setTurn('r'); setTimeout(aiMove, 350); }
  }
  function resetBoard() { over = false; t0 = 0; shown = null; tokens.forEach(o => { o.cell = -1; place(o); }); left.g = limit.g; left.r = limit.r; paint('g'); paint('r'); setTurn(ai ? 'g' : null); check(); aiBusy = false; }

  // ---- resultado
  let submitted = false;
  function show(kind, who) {
    const winnerWho = kind === 'win2' ? who : kind === 'win' ? 'g' : kind === 'lose' ? 'r' : null;
    const info = { mode: ai ? 'ai' : 'two', winner: winnerWho, movesG: limit.g - left.g, movesR: limit.r - left.r, time: t0 ? Date.now() - t0 : 0, at: Date.now() };
    const counts = !submitted && !ctx.prev && !firstRes;
    if (counts) {
      submitted = true; firstRes = info;
      ctx.submit({ answer: kind === 'draw' ? '🤝 ' + L('Empate', 'Empat', 'Draw') : '🏆 ' + P[winnerWho].name(), status: 'correct', extra: { ttt: info } });
    }
    let music = null, alive = true;
    const again = el('button', { class: 'btn btn-big no-delay' }, '🔄 ' + L('Volver a jugar', 'Tornar a jugar', 'Play again'));
    const out = el('button', { class: 'btn btn-ghost btn-big no-delay' }, '🚪 ' + L('Salir de la partida', 'Sortir de la partida', 'Leave the game'));
    const later = el('button', { class: 'btn btn-ghost no-delay ttt-later' }, '⏳ ' + L('Cancelar (lo haré luego)', 'Cancel·lar (ho faré després)', 'Cancel (I’ll do it later)'));
    const wa = counts ? el('button', { class: 'btn btn-big no-delay c5-wa' }, '📲 ' + L('Enviar el resultado al grupo', 'Enviar el resultat al grup', 'Send the result to the group')) : null;
    if (wa) wa.onclick = () => shareTtt(info, ctx);
    const btns = el('div', { class: 'ttt-fx-btns' }, ...(wa ? [el('p', { class: 'ttt-fx-send' }, '📲 ' + L('Esta es tu primera partida: envía el resultado al grupo de WhatsApp de la familia.', 'Aquesta és la teva primera partida: envia el resultat al grup de WhatsApp de la família.', 'This is your first game: send the result to the family WhatsApp group.')), wa] : []), again, out, later);
    const fx = el('div', { class: 'ttt-fx ' + (kind === 'win2' ? 'win' : kind) });
    const cv = el('canvas', { class: 'ttt-fw' }); fx.append(cv);
    if (kind === 'win2' || kind === 'win') setTimeout(() => { if (alive) fx._fw = fireworks(cv, 9000); }, 200);
    if (kind === 'win2') {
      const dancer = el('img', { class: 'ttt-dancer', src: P[who].dance, alt: '' });
      fx.append(el('div', { class: 'ttt-fx-title' }, '🏆 ' + L(`¡Enhorabuena, ${P[who].short()}!`, `Enhorabona, ${P[who].short()}!`, `Congratulations, ${P[who].short()}!`)),
        el('p', { class: 'ttt-fx-text' }, L(`${P[who].name()} ha hecho tres en raya y ha ganado la partida.`, `${P[who].name()} ha fet tres en ratlla i ha guanyat la partida.`, `${P[who].name()} got three in a row and won.`)), dancer, btns);
      fanfare(); confetti(260); setTimeout(() => { if (alive) { try { music = christmasSong(); } catch {} } }, 1600);
      const iv = setInterval(() => alive && confetti(60), 2500); fx._stop = () => clearInterval(iv);
    } else if (kind === 'win') {
      const dancer = el('img', { class: 'ttt-dancer', src: P[who].dance, alt: '' });
      fx.append(el('div', { class: 'ttt-fx-title' }, '🏆 ' + L('¡Has ganado!', 'Has guanyat!', 'You won!')), dancer, btns);
      fanfare(); confetti(260); setTimeout(() => { if (alive) { try { music = christmasSong(); } catch {} } }, 1600);
      const iv = setInterval(() => alive && confetti(60), 2500); fx._stop = () => clearInterval(iv);
    } else if (kind === 'lose') {
      fx.append(el('div', { class: 'ttt-fx-title' }, L('¡Oh, no!', 'Oh, no!', 'Oh no!')),
        el('div', { class: 'ttt-loser' }, el('div', { class: 'ttt-cloud' }, '☁️', ...Array.from({ length: 9 }, (_, i) => el('i', { style: `--i:${i}` }))), el('img', { src: P[who].full, alt: '' }), el('span', { class: 'ttt-coal' }, '🪨')),
        el('p', { class: 'ttt-fx-text' }, L('Esta vez ha llovido sobre ti… y Papá Noel te deja carbón. ¡La revancha te espera!', 'Aquesta vegada t’ha plogut a sobre… i el Pare Noel et deixa carbó. La revenja t’espera!', 'It rained on you this time… and Santa left you coal. Revenge awaits!')), btns);
      sadTrombone();
    } else {
      fx.append(el('div', { class: 'ttt-fx-title' }, '🤝 ' + L('¡Empate!', 'Empat!', 'Draw!')),
        el('div', { class: 'ttt-hug' }, el('img', { src: P.g.full, alt: '' }), el('span', {}, '💛'), el('img', { src: P.r.full, alt: '' })),
        el('p', { class: 'ttt-fx-text' }, L('¡Sois igual de buenos! La Navidad se celebra mejor juntos. 🎄', 'Sou igual de bons! El Nadal se celebra millor junts. 🎄', 'You are equally good! Christmas is better together. 🎄')), btns);
      chime(); setTimeout(chime, 400); confetti(140);
    }
    document.body.append(fx);
    const close = () => { alive = false; fx._stop?.(); try { fx._fw?.(); } catch {} try { music?.stop(1); } catch {} fx.classList.add('out'); setTimeout(() => fx.remove(), 400); };
    again.onclick = () => { close(); resetBoard(); };
    out.onclick = () => { close(); ctx.finish(); };
    later.onclick = () => { close(); ctx.finish(true); };
    ctx.cleanup = close;
  }
}

// cartel de la primera partida para el grupo de la familia
function shareTtt(info, ctx) {
  const fmt = ms => { const t = Math.round(ms / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
  const name = (ctx.profile?.name || '').trim();
  const win = info.winner ? P[info.winner].short() : null;
  shareResult({
    title: win ? L(`¡Ha ganado ${win}!`, `Ha guanyat ${win}!`, `${win} won!`) : L('¡Empate!', 'Empat!', 'Draw!'),
    emoji: win ? '🏆' : '🤝', who: name, day: 17, file: 'tres-en-raya.png',
    rows: [
      [L('Juego', 'Joc', 'Game'), L('Tres en raya', 'Tres en ratlla', 'Noughts and crosses')],
      [L('Modo', 'Mode', 'Mode'), info.mode === 'ai' ? L('Contra la app', 'Contra l’app', 'Against the app') : L('Dos personas', 'Dues persones', 'Two players')],
      [L('Ganador', 'Guanyador', 'Winner'), win || L('Empate', 'Empat', 'Draw')],
      [L('Movimientos', 'Moviments', 'Moves'), `${P.g.short()} ${info.movesG} · ${P.r.short()} ${info.movesR}`],
      [L('Tiempo', 'Temps', 'Time'), fmt(info.time)]],
    note: L('Envía esta foto al grupo de WhatsApp de la familia (solo la primera partida).', 'Envia aquesta foto al grup de WhatsApp de la família (només la primera partida).', 'Send this picture to the family WhatsApp group (first game only).'),
    text: (win ? L(`🎄 Tres en raya (día 17): ¡ha ganado ${win}!`, `🎄 Tres en ratlla (dia 17): ha guanyat ${win}!`, `🎄 Noughts and crosses (day 17): ${win} won!`) : L('🎄 Tres en raya (día 17): ¡empate!', '🎄 Tres en ratlla (dia 17): empat!', '🎄 Noughts and crosses (day 17): draw!')) + (name ? `\n— ${name}` : ''),
  });
}
