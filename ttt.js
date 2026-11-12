// Día 17: tres en raya navideño (galleta contra perrito). Cada uno tiene 3 fichas que se arrastran
// y se pueden volver a mover. Al acabar, cada uno pulsa su dibujo: si ha ganado, baila; si ha perdido, decepción.
import { el, sleep, confetti, popup, toast } from './fx.js?v=17.27';
import { getLang } from './i18n.js?v=17.27';
import { pop, chime, fanfare, christmasSong, unlockAudio, snapSound, slideSound, sadTrombone } from './sound.js?v=17.27';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const P = {
  g: { face: 'ttt-galleta-cara.webp', full: 'ttt-galleta.webp', dance: 'ttt-baile-galleta.webp', col: 'green', name: () => L('la Galleta', 'la Galeta', 'the Gingerbread') },
  r: { face: 'ttt-perro-cara.webp', full: 'ttt-perro.webp', dance: 'ttt-baile-perro.webp', col: 'red', name: () => L('el Perrito', 'el Gosset', 'the Puppy') },
};
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

export function render(body, ctx) {
  body.append(
    el('h2', { class: 'q-title' }, '🎄 ' + L('Tres en raya navideño', 'Tres en ratlla de Nadal', 'Christmas noughts and crosses')),
    el('p', { class: 'game-help ttt-help' }, L('Juega al tres en raya con quien más quieras y, cuando terminéis, pulsa tu dibujo para saber si has ganado, perdido o empatado 🙂',
      'Juga al tres en ratlla amb qui més vulguis i, quan acabeu, prem el teu dibuix per saber si has guanyat, perdut o empatat 🙂',
      'Play noughts and crosses with whoever you like and, when you finish, tap your picture to see if you won, lost or drew 🙂')));
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
    el('button', { type: 'button', class: 'ttt-who green no-delay', onclick: () => result('g') }, el('img', { src: P.g.face, alt: '' }), el('span', {}, L('Galleta', 'Galeta', 'Gingerbread'))),
    el('button', { type: 'button', class: 'ttt-who red no-delay', onclick: () => result('r') }, el('img', { src: P.r.face, alt: '' }), el('span', {}, L('Perrito', 'Gosset', 'Puppy'))));
  body.append(turnTxt, stage, el('p', { class: 'ttt-ask' }, L('¿Quién ha ganado? Pulsa tu dibujo:', 'Qui ha guanyat? Prem el teu dibuix:', 'Who won? Tap your picture:')), res);

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
    if (turn && o.who !== turn) { toast('⏳ ' + L(`Ahora le toca a ${P[turn].name()}`, `Ara li toca a ${P[turn].name()}`, `It is ${P[turn].name()}’s turn`)); trayOf(turn).classList.remove('nudge'); void trayOf(turn).offsetWidth; trayOf(turn).classList.add('nudge'); return; }
    if (left[o.who] <= 0) { toast('⛔ ' + L('Ya no te quedan movimientos', 'Ja no et queden moviments', 'No moves left')); return; }
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
    if (best >= 0 && bd < cellR.w * .7 && !tokens.some(t => t !== o && t.cell === best)) { o.cell = best; place(o); snapSound(); if (best !== from) { useMove(o.who); setTurn(o.who === 'g' ? 'r' : 'g'); } }
    else place(o); // vuelve a donde estaba
    check();
  };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);

  const winner = () => {
    for (const ln of LINES) { const w = ln.map(i => tokens.find(t => t.cell === i)?.who); if (w[0] && w[0] === w[1] && w[1] === w[2]) return { who: w[0], ln }; }
    return null;
  };
  let shown = null;
  function check() {
    const w = winner();
    [...board.children].forEach(c => c.classList.remove('win'));
    if (w) { w.ln.forEach(i => board.children[i].classList.add('win')); if (shown !== w.ln.join()) { shown = w.ln.join(); chime(); toast('✨ ' + L('¡Tres en raya!', 'Tres en ratlla!', 'Three in a row!')); } }
    else shown = null;
  }

  // ---- resultado
  let submitted = false;
  async function result(who) {
    unlockAudio();
    const w = winner();
    if (!w) return show('draw'); // sin tres en raya: empate
    show(w.who === who ? 'win' : 'lose', who);
  }

  function show(kind, who) {
    if (!submitted && !ctx.prev) { submitted = true; ctx.submit({ answer: kind === 'draw' ? '🤝' : (kind === 'win' ? '🏆 ' : '😢 ') + P[who].name(), status: 'correct' }); }
    let music = null, alive = true;
    const again = el('button', { class: 'btn btn-big no-delay' }, '🔄 ' + L('Volver a jugar', 'Tornar a jugar', 'Play again'));
    const out = el('button', { class: 'btn btn-ghost btn-big no-delay' }, '🚪 ' + L('Salir de la partida', 'Sortir de la partida', 'Leave the game'));
    const later = el('button', { class: 'btn btn-ghost no-delay ttt-later' }, '⏳ ' + L('Cancelar (lo haré luego)', 'Cancel·lar (ho faré després)', 'Cancel (I’ll do it later)'));
    const btns = el('div', { class: 'ttt-fx-btns' }, again, out, later);
    const fx = el('div', { class: 'ttt-fx ' + kind });
    if (kind === 'win') {
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
    const close = () => { alive = false; fx._stop?.(); try { music?.stop(1); } catch {} fx.classList.add('out'); setTimeout(() => fx.remove(), 400); };
    again.onclick = () => { close(); tokens.forEach(o => { o.cell = -1; place(o); }); left.g = limit.g; left.r = limit.r; paint('g'); paint('r'); setTurn(null); check(); };
    out.onclick = () => { close(); ctx.finish(); };
    later.onclick = () => { close(); ctx.finish(true); };
    ctx.cleanup = close;
  }
}
