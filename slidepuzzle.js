// Día 21: puzle deslizante 3×3 (8 piezas y un hueco). Se toca (o se arrastra) una pieza de la misma fila
// o columna que el hueco y se desliza. Al completarlo entra la última pieza y la imagen cobra vida.
// Ayuda (solo si no lo consigues): números en las piezas y la pieza que conviene mover, brillando.
import { el, sleep, confetti, popup, toast } from './fx.js?v=19.2';
import { getLang } from './i18n.js?v=19.2';
import { pop, chime, fanfare, christmasSong, unlockAudio, snapSound, slideSound } from './sound.js?v=19.2';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const N = 3, GOAL = '012345678'; // la pieza 8 es el hueco (abajo a la derecha)
const IMG = l => `puzle21-${l}.jpg`, ALIVE = l => `nadal21-${l}.mp4?v=1`; // vídeo de Elisabeth (en catalán e inglés con su texto)

// distancias de todas las posiciones a la solución (8-puzzle: 181 440 estados, se calcula en un momento)
let DIST = null;
function neighbours(s) {
  const b = s.indexOf('8'), r = Math.floor(b / N), c = b % N, out = [];
  for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const rr = r + dr, cc = c + dc; if (rr < 0 || rr >= N || cc < 0 || cc >= N) continue;
    const j = rr * N + cc, a = s.split(''); [a[b], a[j]] = [a[j], a[b]]; out.push(a.join(''));
  }
  return out;
}
function dist() {
  if (DIST) return DIST;
  DIST = new Map([[GOAL, 0]]); let q = [GOAL];
  while (q.length) { const nq = []; for (const s of q) { const d = DIST.get(s); for (const t of neighbours(s)) if (!DIST.has(t)) { DIST.set(t, d + 1); nq.push(t); } } q = nq; }
  return DIST;
}
function shuffled() {
  const D = dist(), pool = [];
  for (const [s, d] of D) if (d >= 14 && d <= 17) pool.push(s);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function render(body, ctx) {
  const lang = ['es', 'ca', 'en'].includes(getLang()) ? getLang() : 'es';
  body.style.webkitUserSelect = body.style.userSelect = 'none';

  body.append(
    el('h2', { class: 'q-title cw-title' }, '🧩 ' + L('Puzle deslizante', 'Puzle lliscant', 'Sliding puzzle') + ' 🎄'),
    el('p', { class: 'game-help cw-help' }, ctx.prev
      ? L('¡Ya lo has completado! Puedes volver a jugar cuando quieras.', 'Ja l’has completat! Hi pots tornar a jugar quan vulguis.', 'Already done! You can play again whenever you like.')
      : L('Toca (o desliza) una pieza que esté en la fila o la columna del hueco y se moverá. Ordena las 8 piezas hasta completar la imagen.',
        'Toca (o llisca) una peça que sigui a la fila o la columna del forat i es mourà. Ordena les 8 peces fins a completar la imatge.',
        'Tap (or swipe) a piece in the same row or column as the gap and it will slide. Put the 8 pieces in order to complete the picture.')));

  const wrap = el('div', { class: 'cw-wrap sp-wrap' });
  const lights = el('div', { class: 'cw-lights' }, ...Array.from({ length: 14 }, (_, i) => el('i', { style: `--i:${i}` })));
  const grid = el('div', { class: 'sp-grid' });
  const peek = el('img', { class: 'sp-peek', src: IMG(lang), alt: '' });
  // la imagen cobra vida: el vídeo en bucle, sin sonido propio (suena la música de Navidad); se para al tocarlo o al salir
  const alive = el('video', { class: 'sp-alive', preload: 'auto', playsinline: '', 'webkit-playsinline': '', muted: '', loop: '' });
  alive.muted = true; alive.loop = true; alive.playsInline = true; alive.src = ALIVE(lang); // que esté listo al acabar
  const snow = el('div', { class: 'sp-snow' });
  grid.append(peek, alive, snow);
  const board = el('div', { class: 'cw-board sp-board' }, lights, grid);
  const moves = el('span', { class: 'sp-moves' });
  const eye = el('button', { type: 'button', class: 'sp-eye no-delay' }, el('img', { src: IMG(lang), alt: '' }), el('span', {}, L('Mantén pulsado para ver la imagen', 'Mantén premut per veure la imatge', 'Hold to see the picture')));
  const helpBtn = el('button', { type: 'button', class: 'btn btn-ghost ws-help no-delay', onclick: help }, '🆘 ' + L('Ayuda (solo si no lo consigues)', 'Ajuda (només si no te’n surts)', 'Help (only if you’re stuck)'));
  const msg = el('div', { class: 'sp-msg' });
  wrap.append(board, el('div', { class: 'sp-bar' }, eye, moves), helpBtn, msg);
  body.append(wrap);

  // ---- ver la imagen entera mientras se mantiene pulsado
  const showPeek = on => { peek.classList.toggle('on', on); if (on) pop(); };
  eye.addEventListener('pointerdown', e => { e.preventDefault(); unlockAudio(); showPeek(true); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => eye.addEventListener(t, () => showPeek(false)));

  // ---- piezas
  const tiles = [];
  for (let k = 0; k < 8; k++) {
    const r = Math.floor(k / N), c = k % N;
    tiles.push(el('div', { class: 'sp-tile', 'data-k': k, style: `--c:${c};--r:${r}` }, el('div', { class: 'sp-face', style: `background-image:url(${IMG(lang)})` }), el('b', { class: 'sp-num' }, k + 1)));
  }
  const last = el('div', { class: 'sp-tile sp-last', style: '--c:2;--r:2;transform:translate(200%,200%)' }, el('div', { class: 'sp-face', style: `background-image:url(${IMG(lang)})` }));
  grid.prepend(...tiles, last);
  // tamaño del tablero en px para recortar bien cada pieza
  const size = () => { grid.style.setProperty('--gw', grid.clientWidth + 'px'); grid.style.setProperty('--gh', grid.clientHeight + 'px'); };
  size(); requestAnimationFrame(size); setTimeout(size, 400); addEventListener('resize', size);
  try { new ResizeObserver(size).observe(grid); } catch {}

  let state = GOAL, count = 0, done = false, helping = false;
  const paintMoves = () => { moves.textContent = '👣 ' + L(`Movimientos: ${count}`, `Moviments: ${count}`, `Moves: ${count}`); };
  function layout(anim = true) {
    [...state].forEach((ch, pos) => {
      if (ch === '8') return;
      const t = tiles[+ch], r = Math.floor(pos / N), c = pos % N;
      t.style.transition = anim ? '' : 'none';
      t.style.transform = `translate(${c * 100}%, ${r * 100}%)`;
      t.classList.toggle('home', +ch === pos);
    });
    grid.classList.toggle('helping', helping && !done);
    tiles.forEach(t => t.classList.remove('next'));
    if (helping && !done) { const n = bestMove(); if (n != null) tiles[+state[n]].classList.add('next'); }
  }
  // la pieza que conviene mover (la que acerca a la solución)
  function bestMove() {
    const D = dist(), b = state.indexOf('8'); let best = null, bd = 1e9;
    for (const t of neighbours(state)) { const d = D.get(t); if (d < bd) { bd = d; best = t.indexOf('8'); } }
    return best; // posición de la pieza que hay que mover (pasa a ser el hueco)
  }

  function tryMove(pos) {
    if (done) return;
    const b = state.indexOf('8'), br = Math.floor(b / N), bc = b % N, r = Math.floor(pos / N), c = pos % N;
    if (pos === b || (r !== br && c !== bc)) { pop(); const t = tiles[+state[pos]]; t?.classList.remove('nope'); void t?.offsetWidth; t?.classList.add('nope'); return; }
    // desliza todas las piezas entre la tocada y el hueco
    const a = state.split('');
    const step = r === br ? (c < bc ? -1 : 1) : (r < br ? -N : N);
    let cur = b;
    while (cur !== pos) { const nx = cur + step; a[cur] = a[nx]; a[nx] = '8'; cur = nx; }
    state = a.join(''); count++; paintMoves();
    slideSound(); layout();
    setTimeout(() => { snapSound(); }, 190);
    if (state === GOAL) win();
  }
  // tocar o deslizar una pieza
  let down = null;
  grid.addEventListener('pointerdown', e => {
    const t = e.target.closest('.sp-tile:not(.sp-last)'); if (!t || done) return;
    e.preventDefault(); unlockAudio(); down = { k: +t.dataset.k, x: e.clientX, y: e.clientY };
  });
  grid.addEventListener('pointerup', e => {
    if (!down) return;
    const pos = state.indexOf(String(down.k)); down = null; tryMove(pos);
  });
  grid.addEventListener('pointercancel', () => { down = null; });

  // ---- ayuda
  async function help() {
    unlockAudio();
    if (done) return;
    if (helping) { const n = bestMove(); if (n != null) { const t = tiles[+state[n]]; t.classList.remove('next'); void t.offsetWidth; t.classList.add('next'); chime(); } return; }
    const ok = await popup(el('div', { class: 'ttt-info' }, el('div', { class: 'ttt-info-ico' }, '🆘'),
      el('h2', {}, L('¿Seguro?', 'Segur?', 'Are you sure?')),
      el('p', {}, L('Este botón es solo para quien NO consigue hacer el puzle. ¡Inténtalo un poquito más antes de usarlo! 😉', 'Aquest botó és només per a qui NO aconsegueix fer el puzle. Intenta-ho una miqueta més abans de fer-lo servir! 😉', 'This button is only for people who CANNOT do the puzzle. Try a little longer before using it! 😉'))),
      { cls: 'small ttt-info-pop', buttons: [{ label: L('Seguir intentándolo', 'Continuar intentant-ho', 'Keep trying'), value: false }, { label: L('Necesito ayuda', 'Necessito ajuda', 'I need help'), value: true, cls: 'btn-ghost' }] });
    if (!ok) return;
    helping = true; chime(); layout();
    helpBtn.textContent = '💡 ' + L('¿Cuál muevo ahora?', 'Quina moc ara?', 'Which one now?');
    popup(el('div', { class: 'ttt-info' }, el('div', { class: 'ttt-info-ico' }, '💡'),
      el('h2', {}, L('¡Te ayudo!', 'T’ajudo!', 'Here’s some help!')),
      el('p', {}, L('Ahora cada pieza lleva su número: hay que ordenarlas del 1 al 8, como cuando lees (de izquierda a derecha y de arriba abajo).', 'Ara cada peça porta el seu número: s’han d’ordenar de l’1 al 8, com quan llegeixes (d’esquerra a dreta i de dalt a baix).', 'Now every piece shows its number: put them in order from 1 to 8, as you read (left to right, top to bottom).')),
      el('p', {}, L('La pieza que brilla es la que te conviene mover. ✨', 'La peça que brilla és la que et convé moure. ✨', 'The shining piece is the one to move next. ✨'))),
      { cls: 'small ttt-info-pop', buttons: [{ label: L('¡Vamos!', 'Som-hi!', 'Let’s go!'), value: true }] });
  }

  // ---- ¡completado! entra la última pieza y la imagen cobra vida
  let music = null, iv = null;
  const playMusic = () => { if (music?.playing) return; try { music?.stop(0); music = christmasSong(); } catch {} };
  const stopAll = () => { try { alive.pause(); } catch {} try { music?.stop(1); } catch {} music = null; };
  ctx.cleanup = () => { clearInterval(iv); stopAll(); };
  const aliveHint = el('p', { class: 'sp-alive-hint' });
  const paintHint = () => { aliveHint.textContent = alive.paused ? '▶️ ' + L('Toca el vídeo para volver a ponerlo en marcha', 'Toca el vídeo per tornar-lo a posar en marxa', 'Tap the video to play it again') : '⏸ ' + L('Toca el vídeo para pararlo', 'Toca el vídeo per aturar-lo', 'Tap the video to stop it'); };
  alive.addEventListener('click', () => { if (!done) return; unlockAudio(); if (alive.paused) { alive.play().catch(() => {}); playMusic(); } else stopAll(); setTimeout(paintHint, 50); });
  async function win(instant = false) {
    done = true; layout(!instant);
    if (!ctx.prev && !win.sent) { win.sent = true; ctx.submit({ answer: '🧩 ' + L(`Puzle completado en ${count} movimientos`, `Puzle completat en ${count} moviments`, `Puzzle completed in ${count} moves`), status: 'correct' }); }
    if (!instant) await sleep(350);
    grid.classList.add('solved'); last.classList.add('in');
    if (!instant) { chime(); await sleep(900); }
    grid.classList.add('alive'); try { alive.currentTime = 0; } catch {} alive.play().catch(() => {});
    snow.replaceChildren(...Array.from({ length: 26 }, () => el('i', { style: `left:${Math.random() * 100}%;--d:${4 + Math.random() * 5}s;--dl:${-Math.random() * 8}s;--s:${8 + Math.random() * 10}px;--x:${(Math.random() - .5) * 60}px` }, '❄')));
    if (!instant) { fanfare(); confetti(240); setTimeout(() => confetti(160), 900); setTimeout(() => { if (done && !alive.paused) playMusic(); }, 1700); }
    else playMusic();
    setTimeout(paintHint, 300);
    const again = el('button', { class: 'btn btn-big no-delay' }, '🔄 ' + L('Volver a jugar', 'Tornar a jugar', 'Play again'));
    const out = el('button', { class: 'btn btn-ghost btn-big no-delay' }, '🎁 ' + L('Continuar', 'Continuar', 'Continue'));
    msg.replaceChildren(
      el('div', { class: 'sp-msg-title' }, L('¡Enhorabuena!', 'Enhorabona!', 'Congratulations!') + ' ✨'),
      el('p', {}, instant ? L('Así cobró vida tu puzle:', 'Així va cobrar vida el teu puzle:', 'This is how your puzzle came to life:') : count
        ? L(`¡Lo has conseguido en ${count} movimientos y la imagen ha cobrado vida!`, `Ho has aconseguit en ${count} moviments i la imatge ha cobrat vida!`, `You did it in ${count} moves and the picture came to life!`)
        : L('¡La imagen ha cobrado vida!', 'La imatge ha cobrat vida!', 'The picture came to life!')),
      aliveHint,
      el('div', { class: 'ttt-fx-btns' }, again, out));
    msg.classList.add('on'); helpBtn.style.display = 'none';
    setTimeout(() => msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), instant ? 0 : 600);
    again.onclick = () => { ctx.cleanup(); start(); };
    out.onclick = () => { ctx.cleanup(); ctx.finish(); };
  }
  function start() {
    done = false; count = 0; helping = false;
    grid.classList.remove('solved', 'alive'); last.classList.remove('in'); stopAll(); snow.replaceChildren();
    msg.classList.remove('on'); msg.replaceChildren(); helpBtn.style.display = '';
    helpBtn.textContent = '🆘 ' + L('Ayuda (solo si no lo consigues)', 'Ajuda (només si no te’n surts)', 'Help (only if you’re stuck)');
    state = shuffled(); paintMoves(); layout(false);
  }
  if (ctx.prev) { state = GOAL; paintMoves(); win(true); }
  else start();
}
