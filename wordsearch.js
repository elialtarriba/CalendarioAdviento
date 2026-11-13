// Día 22: sopa de letras de animales. Se desliza el dedo en línea recta (horizontal, vertical o en
// diagonal, en cualquier sentido). Si las letras forman un animal se queda marcado con relieve y suena
// «encaja»; si no, el marcado desaparece al soltar. Al encontrarlos todos: confeti y ¡enhorabuena!
import { el, sleep, confetti, popup, toast } from './fx.js?v=18.4';
import { getLang } from './i18n.js?v=18.4';
import { pop, chime, fanfare, christmasSong, unlockAudio, snapSound, clickSound } from './sound.js?v=18.4';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
// [palabra, fila, columna, paso fila, paso columna, dibujo, nombre bonito]
const SETS = {
  es: { grid: ["LCHLAPPUEA", "NRICRENOFE", "DMPHAPEAGP", "HDOKDBRBDE", "CZPCOIAOMR", "DAOPJATLZR", "SGTMZALCLO", "HAAIGSGAAO", "PIMBALLENA", "VAODSOBIRL"], words: [
    ['HIPOPOTAMO', 0, 2, 1, 0, '🦛', 'HIPOPÓTAMO'],
    ['BALLENA', 8, 3, 0, 1, '🐋', 'BALLENA'],
    ['CABALLO', 1, 3, 1, 1, '🐴', 'CABALLO'],
    ['JIRAFA', 5, 4, -1, 1, '🦒', 'JIRAFA'],
    ['PERRO', 2, 9, 1, 0, '🐶', 'PERRO'],
    ['KOALA', 3, 3, 1, 1, '🐨', 'KOALA'],
    ['RENO', 1, 4, 0, 1, '🦌', 'RENO'],
    ['GATO', 7, 4, -1, 1, '🐱', 'GATO'],
  ] },
  ca: { grid: ["SENBNEJORF", "ZHVDSSRSAI", "KIIOGMVNMT", "OCGPAAEGBZ", "AASPOLTJDG", "LVAGAPPDIJ", "AAJBHAOREN", "FLZOIMZTML", "TLFTAEGCAB", "GIRAFAGAIM"], words: [
    ['HIPOPOTAM', 1, 1, 1, 1, '🦛', 'HIPOPÒTAM'],
    ['BALENA', 6, 3, -1, 1, '🐋', 'BALENA'],
    ['CAVALL', 3, 1, 1, 0, '🐴', 'CAVALL'],
    ['GIRAFA', 9, 0, 0, 1, '🦒', 'GIRAFA'],
    ['KOALA', 2, 0, 1, 0, '🐨', 'KOALA'],
    ['REN', 6, 7, 0, 1, '🦌', 'REN'],
    ['GOS', 3, 2, -1, 1, '🐶', 'GOS'],
    ['GAT', 2, 4, 1, 1, '🐱', 'GAT'],
  ] },
  en: { grid: ["KCOLLNGLHP", "AATAMAPTOS", "OTUCSHIPPO", "GREINDEERE", "HITKEHAFBH", "FIRLOHMRBO", "REAAHALRGR", "OHYMFLLOHS", "WKOYAFDAOE", "AGYYOYEEAG"], words: [
    ['REINDEER', 3, 1, 0, 1, '🦌', 'REINDEER'],
    ['GIRAFFE', 3, 0, 1, 1, '🦒', 'GIRAFFE'],
    ['WHALE', 8, 0, -1, 1, '🐋', 'WHALE'],
    ['HORSE', 4, 9, 1, 0, '🐴', 'HORSE'],
    ['HIPPO', 2, 5, 0, 1, '🦛', 'HIPPO'],
    ['KOALA', 4, 3, 1, 1, '🐨', 'KOALA'],
    ['DOG', 8, 6, -1, 1, '🐶', 'DOG'],
    ['CAT', 0, 1, 1, 0, '🐱', 'CAT'],
  ] },
};
const FRIENDS = ['ttt-perro.webp'];
const COLORS = ['#e63946', '#2a9d8f', '#f4a261', '#3a86ff', '#9b5de5', '#06a77d', '#ff70a6', '#e9a92a'];

export function render(body, ctx) {
  const lang = SETS[getLang()] ? getLang() : 'es';
  const S = SETS[lang], N = S.grid.length;
  body.style.webkitUserSelect = body.style.userSelect = 'none';
  const words = S.words.map(([w, r, c, dr, dc, emo, nice], i) => ({ w, r, c, dr, dc, emo, nice, col: COLORS[i % COLORS.length], found: false }));

  body.append(
    el('h2', { class: 'q-title cw-title' }, '🦌 ' + L('Sopa de letras de animales', 'Sopa de lletres d’animals', 'Animal word search') + ' 🎄'),
    el('p', { class: 'game-help cw-help' }, L('Hay 8 animales escondidos. Desliza el dedo por encima de las letras (en línea recta, también en diagonal) para marcar cada animal.',
      'Hi ha 8 animals amagats. Llisca el dit per sobre de les lletres (en línia recta, també en diagonal) per marcar cada animal.',
      'There are 8 hidden animals. Slide your finger over the letters (in a straight line, diagonals too) to mark each animal.')));

  const wrap = el('div', { class: 'cw-wrap ws-wrap' });
  const lights = el('div', { class: 'cw-lights' }, ...Array.from({ length: 14 }, (_, i) => el('i', { style: `--i:${i}` })));
  const grid = el('div', { class: 'ws-grid', style: `--n:${N}` });
  const cells = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const n = el('div', { class: 'ws-cell' }, el('span', {}, S.grid[r][c]));
    cells.push(n); grid.append(n);
  }
  const marks = el('div', { class: 'ws-marks' }); // las cápsulas de color van por debajo de las letras
  const live = el('div', { class: 'ws-cap live' });
  grid.prepend(marks); marks.append(live);
  const board = el('div', { class: 'cw-board ws-board' }, lights, grid);
  const count = el('p', { class: 'ws-count' });
  const slots = el('div', { class: 'ws-slots' }, ...words.map(wd => (wd.slot = el('div', { class: 'ws-slot' }, el('span', { class: 'ws-emo' }, '❓'), el('b', {}, '· '.repeat(wd.w.length).trim())))));
  const helpBtn = el('button', { type: 'button', class: 'btn btn-ghost ws-help no-delay', onclick: help }, '🆘 ' + L('Ayuda (solo si no lo consigues)', 'Ajuda (només si no te’n surts)', 'Help (only if you’re stuck)'));
  wrap.append(board, count, slots, helpBtn);
  body.append(wrap);
  const paintCount = () => { const f = words.filter(w => w.found).length; count.textContent = '🐾 ' + L(`Animales encontrados: ${f} de ${words.length}`, `Animals trobats: ${f} de ${words.length}`, `Animals found: ${f} of ${words.length}`); };
  paintCount();

  // ---- geometría (offsetLeft: no le afecta la animación de entrada de la nota)
  const cellAt = (r, c) => cells[r * N + c];
  const center = (r, c) => { const n = cellAt(r, c); return [n.offsetLeft + n.offsetWidth / 2, n.offsetTop + n.offsetHeight / 2, n.offsetWidth]; };
  function placeCap(cap, r1, c1, r2, c2) {
    const [x1, y1, w] = center(r1, c1), [x2, y2] = center(r2, c2);
    const len = Math.hypot(x2 - x1, y2 - y1), ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI, h = w * .86;
    Object.assign(cap.style, { width: (len + h) + 'px', height: h + 'px', left: ((x1 + x2) / 2 - (len + h) / 2) + 'px', top: ((y1 + y2) / 2 - h / 2) + 'px', transform: `rotate(${ang}deg)`, display: 'block' });
  }
  const relayout = () => words.forEach(wd => wd.cap && placeCap(wd.cap, wd.r, wd.c, wd.r + wd.dr * (wd.w.length - 1), wd.c + wd.dc * (wd.w.length - 1)));
  addEventListener('resize', relayout);

  // ---- deslizar
  const hit = e => {
    const b = grid.getBoundingClientRect(), sz = b.width / N;
    const c = Math.floor((e.clientX - b.left) / sz), r = Math.floor((e.clientY - b.top) / sz);
    return [Math.max(0, Math.min(N - 1, r)), Math.max(0, Math.min(N - 1, c))];
  };
  let sel = null, path = [], lastLen = 0;
  // la línea siempre recta: se ajusta a la dirección más cercana de las 8
  function line(r0, c0, r1, c1) {
    let dr = r1 - r0, dc = c1 - c0;
    if (!dr && !dc) return [[r0, c0]];
    const ang = Math.round(Math.atan2(dr, dc) / (Math.PI / 4)) * (Math.PI / 4);
    const sr = Math.round(Math.sin(ang)), sc = Math.round(Math.cos(ang));
    let len = Math.max(Math.abs(dr), Math.abs(dc));
    const out = [];
    for (let i = 0; i <= len; i++) { const r = r0 + sr * i, c = c0 + sc * i; if (r < 0 || r >= N || c < 0 || c >= N) break; out.push([r, c]); }
    return out;
  }
  function paintSel() {
    cells.forEach(n => n.classList.remove('on'));
    path.forEach(([r, c]) => cellAt(r, c).classList.add('on'));
    const a = path[0], z = path[path.length - 1];
    placeCap(live, a[0], a[1], z[0], z[1]);
    if (path.length !== lastLen) { lastLen = path.length; pop(); }
  }
  grid.addEventListener('pointerdown', e => {
    e.preventDefault(); unlockAudio();
    try { grid.setPointerCapture(e.pointerId); } catch {}
    const [r, c] = hit(e); sel = { r, c, id: e.pointerId };
    live.style.background = '#ffd24a'; path = [[r, c]]; lastLen = 0; paintSel();
  });
  grid.addEventListener('pointermove', e => {
    if (!sel || e.pointerId !== sel.id) return;
    const [r, c] = hit(e); path = line(sel.r, sel.c, r, c); paintSel();
  });
  const up = e => {
    if (!sel || e.pointerId !== sel.id) return;
    sel = null;
    const txt = path.map(([r, c]) => S.grid[r][c]).join('');
    const a = path[0], z = path[path.length - 1];
    const wd = words.find(w => !w.found && (w.w === txt || w.w === [...txt].reverse().join('')) && path.length > 1);
    cells.forEach(n => n.classList.remove('on'));
    live.style.display = 'none';
    if (wd) found(wd, a, z);
  };
  grid.addEventListener('pointerup', up); grid.addEventListener('pointercancel', up);

  function found(wd, a, z) {
    wd.found = true;
    wd.cap = el('div', { class: 'ws-cap done', style: `background:${wd.col}` });
    marks.append(wd.cap); placeCap(wd.cap, a[0], a[1], z[0], z[1]);
    clickSound(); snapSound(); setTimeout(chime, 180);
    for (let i = 0; i < wd.w.length; i++) {
      const n = cellAt(wd.r + wd.dr * i, wd.c + wd.dc * i);
      setTimeout(() => { n.classList.add('up'); n.style.setProperty('--col', wd.col); n.classList.remove('pulse'); void n.offsetWidth; n.classList.add('pulse'); }, i * 60);
    }
    wd.slot.className = 'ws-slot ok'; wd.slot.style.setProperty('--col', wd.col);
    wd.slot.replaceChildren(el('span', { class: 'ws-emo' }, wd.emo), el('b', {}, wd.nice));
    paintCount();
    toast(wd.emo + ' ' + wd.nice + '!', 1600);
    if (words.every(w => w.found)) setTimeout(finale, 900);
  }

  // ---- ayuda: dice un animal que todavía no ha salido
  async function help() {
    unlockAudio();
    const left = words.filter(w => !w.found);
    if (!left.length) return;
    const ok = await popup(el('div', { class: 'ttt-info' }, el('div', { class: 'ttt-info-ico' }, '🆘'),
      el('h2', {}, L('¿Seguro?', 'Segur?', 'Are you sure?')),
      el('p', {}, L('Este botón es solo para quien NO consigue encontrar los animales. ¡Inténtalo un poquito más antes de usarlo! 😉', 'Aquest botó és només per a qui NO aconsegueix trobar els animals. Intenta-ho una miqueta més abans de fer-lo servir! 😉', 'This button is only for people who CANNOT find the animals. Try a little longer before using it! 😉'))),
      { cls: 'small ttt-info-pop', buttons: [{ label: L('Seguir buscando', 'Seguir buscant', 'Keep looking'), value: false }, { label: L('Necesito ayuda', 'Necessito ajuda', 'I need help'), value: true, cls: 'btn-ghost' }] });
    if (!ok) return;
    const wd = left[Math.floor(Math.random() * left.length)];
    chime();
    wd.slot.classList.add('hinted'); wd.slot.replaceChildren(el('span', { class: 'ws-emo' }, wd.emo), el('b', {}, wd.nice));
    popup(el('div', { class: 'ttt-info' }, el('div', { class: 'ws-hint-emo' }, wd.emo),
      el('h2', {}, L('Busca…', 'Busca…', 'Look for…')), el('p', { class: 'ws-hint-word' }, wd.nice)),
      { cls: 'small ttt-info-pop', buttons: [{ label: L('¡A buscar!', 'A buscar!', 'Let’s go!'), value: true }] });
  }

  // ---- todos encontrados
  let fx = null, music = null, iv = null;
  function stopFx() {
    clearInterval(iv); iv = null;
    try { music?.stop(1); } catch {} music = null;
    if (fx) { const f = fx; fx = null; f.classList.add('out'); setTimeout(() => f.remove(), 450); }
  }
  ctx.cleanup = stopFx;
  async function finale() {
    if (fx) return;
    if (!ctx.prev && !finale.sent) { finale.sent = true; ctx.submit({ answer: '🐾 ' + L('Sopa de letras completada', 'Sopa de lletres completada', 'Word search completed'), status: 'correct' }); }
    fx = el('div', { class: 'cw-fx ws-fx' },
      el('div', { class: 'cw-snow' }, ...Array.from({ length: 40 }, () => el('i', { style: `left:${Math.random() * 100}%;--d:${4 + Math.random() * 6}s;--dl:${-Math.random() * 8}s;--s:${10 + Math.random() * 18}px;--x:${(Math.random() - .5) * 120}px` }, '❄'))),
      el('div', { class: 'ws-fx-box' },
        el('div', { class: 'ws-fx-starbox' }, el('div', { class: 'ws-fx-rays' }), el('img', { class: 'ws-fx-star', src: 'estrella22.webp', alt: '' })),
        el('div', { class: 'ttt-fx-title' }, L('¡Enhorabuena!', 'Enhorabona!', 'Congratulations!')),
        el('p', { class: 'ttt-fx-text' }, L('¡Has encontrado todos los animales!', 'Has trobat tots els animals!', 'You found all the animals!')),
        // los amigos de la app (dibujos pintados como el calendario) lo celebran saltando
        el('div', { class: 'ws-fx-friends' }, ...FRIENDS.map((src, i) => el('img', { src, alt: '', style: `--i:${i}` })))));
    document.body.append(fx);
    fanfare(); confetti(260); setTimeout(() => { chime(); confetti(160); }, 700);
    setTimeout(() => { if (fx) try { music = christmasSong(); } catch {} }, 1800);
    iv = setInterval(() => fx && confetti(70), 2600);
    await sleep(1500);
    if (!fx) return;
    const again = el('button', { class: 'btn btn-big no-delay' }, '🔄 ' + L('Volver a jugar', 'Tornar a jugar', 'Play again'));
    const out = el('button', { class: 'btn btn-ghost btn-big no-delay' }, '🎁 ' + L('Continuar', 'Continuar', 'Continue'));
    fx.querySelector('.ws-fx-box').append(el('div', { class: 'ttt-fx-btns' }, again, out));
    again.onclick = () => { stopFx(); reset(); };
    out.onclick = () => { stopFx(); ctx.finish(); };
  }
  function reset() {
    words.forEach(wd => { wd.found = false; wd.cap?.remove(); wd.cap = null; wd.slot.className = 'ws-slot'; wd.slot.replaceChildren(el('span', { class: 'ws-emo' }, '❓'), el('b', {}, '· '.repeat(wd.w.length).trim())); });
    cells.forEach(n => { n.className = 'ws-cell'; n.style.removeProperty('--col'); });
    paintCount(); body.scrollTop = 0;
  }
}
