// Día 3: sudoku de Navidad (4×4, 6×6 o 9×9) a pantalla completa. Fichas 3D con los números arriba:
// se toca una casilla y luego el número (o se arrastra la ficha). Si el número es el bueno encaja con un
// «clac»; si no, vuelve a su sitio. En el 9×9 se pueden apuntar números posibles (en las esquinas y el centro).
// Botón de ayuda: pone un número. Al acabar: las fichas salen volando, se convierten en estrellas y aparece «¡Conseguido!».
import { el, sleep, confetti } from './fx.js?v=18.5';
import { getLang } from './i18n.js?v=18.5';
import { pop, chime, fanfare, unlockAudio, snapSound, clickSound, oops } from './sound.js?v=18.5';
import { nextGame, rng, TOTAL } from './games25.js?v=18.5';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const SIZES = { 4: { br: 2, bc: 2, givens: 8 }, 6: { br: 2, bc: 3, givens: 17 }, 9: { br: 3, bc: 3, givens: 34 } };

// ---------------- generar un sudoku con una sola solución
function makeSudoku(n, g = 0) {
  const R = rng(n * 100003 + g * 7919 + 3);
  const { br, bc, givens } = SIZES[n];
  const box = (r, c) => Math.floor(r / br) * (n / bc) + Math.floor(c / bc);
  const ok = (g, r, c, v) => { for (let k = 0; k < n; k++) if (g[r][k] === v || g[k][c] === v) return false;
    const r0 = r - r % br, c0 = c - c % bc; for (let i = 0; i < br; i++) for (let j = 0; j < bc; j++) if (g[r0 + i][c0 + j] === v) return false; return true; };
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = R() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fill = g => { for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!g[r][c]) {
    for (const v of shuffle([...Array(n)].map((_, i) => i + 1))) { if (ok(g, r, c, v)) { g[r][c] = v; if (fill(g)) return true; g[r][c] = 0; } } return false; } return true; };
  const count = (g, lim) => { let cnt = 0; const go = () => { for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!g[r][c]) {
    for (let v = 1; v <= n; v++) if (ok(g, r, c, v)) { g[r][c] = v; go(); g[r][c] = 0; if (cnt >= lim) return; } return; } cnt++; }; go(); return cnt; };
  const sol = [...Array(n)].map(() => Array(n).fill(0)); fill(sol);
  const puz = sol.map(r => r.slice()); let left = n * n;
  for (const i of shuffle([...Array(n * n).keys()])) {
    if (left <= givens) break;
    const r = i / n | 0, c = i % n, v = puz[r][c]; puz[r][c] = 0;
    if (count(puz.map(x => x.slice()), 2) !== 1) puz[r][c] = v; else left--;
  }
  return { sol, puz, br, bc, box };
}

// pequeña melodía de estrellas (distinta de las otras felicitaciones)
let AC = null;
function starSong() {
  try {
    const c = (AC ||= new (window.AudioContext || window.webkitAudioContext)()); c.resume?.(); const t0 = c.currentTime + .05;
    const notes = [1046.5, 1318.5, 1568, 2093, 1568, 1318.5, 1568, 2093, 2637, 2093, 2637, 3136];
    notes.forEach((f, i) => { const t = t0 + i * .11; const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.12, t + .01); g.gain.exponentialRampToValueAtTime(.0005, t + .9); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + .95); });
    [523.25, 659.25, 783.99].forEach(f => { const t = t0 + notes.length * .11; const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.1, t + .05); g.gain.exponentialRampToValueAtTime(.0005, t + 2.4); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 2.5); });
  } catch {}
}

export function render(body, ctx) {
  body.style.webkitUserSelect = body.style.userSelect = 'none';
  const card = (n, name, stars, sub) => el('button', { type: 'button', class: 'sd-size no-delay', onclick: () => open(n) },
    el('div', { class: 'sd-mini', style: `--n:${Math.min(n, 6)}` }, ...Array.from({ length: Math.min(n, 6) ** 2 }, (_, i) => el('i', {}, (i * 7) % 3 ? '' : (i % n) + 1))),
    el('b', {}, `${n} × ${n}`), el('span', { class: 'sd-stars' }, stars), el('small', {}, name), el('em', {}, sub));
  body.append(
    el('h2', { class: 'q-title cw-title' }, '🎄 ' + L('Sudoku de Navidad', 'Sudoku de Nadal', 'Christmas sudoku') + ' 🎄'),
    el('p', { class: 'game-help cw-help' }, L('Pon los números de forma que no se repitan en ninguna fila, columna ni recuadro. Elige el tamaño:', 'Posa els números de manera que no es repeteixin a cap fila, columna ni requadre. Tria la mida:', 'Place the numbers so none repeats in any row, column or box. Choose the size:')),
    el('div', { class: 'sd-sizes' },
      card(4, L('Fácil', 'Fàcil', 'Easy'), '⭐', L('Números del 1 al 4', 'Números de l’1 al 4', 'Numbers 1 to 4')),
      card(6, L('Medio', 'Mitjà', 'Medium'), '⭐⭐', L('Números del 1 al 6', 'Números de l’1 al 6', 'Numbers 1 to 6')),
      card(9, L('Difícil', 'Difícil', 'Hard'), '⭐⭐⭐', L('Con números posibles ✏️', 'Amb números possibles ✏️', 'With pencil marks ✏️'))),
    el('p', { class: 'game-help sd-howto' }, L('Toca una casilla y después un número (o arrastra la ficha). En el 9×9, con ✏️ Posibles apuntas números pequeños en las esquinas y el centro; cuando estés segura, quítalo y pon el número grande. El reloj cuenta los minutos que dura la partida.',
      'Toca una casella i després un número (o arrossega la fitxa). Al 9×9, amb ✏️ Possibles apuntes números petits a les cantonades i al centre; quan n’estiguis segur, treu-lo i posa el número gran. El rellotge compta els minuts que dura la partida.',
      'Tap a square, then a number (or drag the tile). In the 9×9, ✏️ Pencil lets you note small numbers in the corners and centre; when you’re sure, switch it off and place the big number. The clock counts how long the game lasts.')));

  let full = null, tick = 0;
  ctx.cleanup = () => { clearInterval(tick); full?.remove(); full = null; };

  function open(n) {
    unlockAudio(); pop();
    const gameNo = nextGame('sudoku' + n);
    const S = makeSudoku(n, gameNo);
    const cells = [], notes = [...Array(n * n)].map(() => []);
    let sel = null, noteMode = false, done = false, t0 = Date.now(), helps = 0;
    const val = S.puz.map(r => r.slice());

    // ---- pantalla completa
    const timeEl = el('span', { class: 'sd-time', title: L('Tiempo de juego', 'Temps de joc', 'Playing time') }, '⏱ 0:00 min');
    const close = el('button', { type: 'button', class: 'sd-x no-delay', 'aria-label': 'X' }, '✕');
    const head = el('div', { class: 'sd-head' }, close, el('h2', {}, L('Sudoku', 'Sudoku', 'Sudoku') + ` ${n}×${n}`, el('small', { class: 'sd-gno' }, L(`Partida ${gameNo + 1} de ${TOTAL}`, `Partida ${gameNo + 1} de ${TOTAL}`, `Game ${gameNo + 1} of ${TOTAL}`))), timeEl);
    const tiles = el('div', { class: 'sd-tiles', style: `--n:${n}` }, ...Array.from({ length: n }, (_, i) => el('button', { type: 'button', class: 'sd-tile no-delay', 'data-v': i + 1 }, el('b', {}, i + 1))));
    const grid = el('div', { class: 'sd-grid', style: `--n:${n}` });
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const cl = el('div', { class: 'sd-cell' + ((c + 1) % S.bc === 0 && c < n - 1 ? ' br' : '') + ((r + 1) % S.br === 0 && r < n - 1 ? ' bb' : '') + (S.puz[r][c] ? ' given' : ''), 'data-i': r * n + c },
        el('span', { class: 'sd-num' }, S.puz[r][c] || ''), el('div', { class: 'sd-notes' }));
      cells.push(cl); grid.append(cl);
    }
    const board = el('div', { class: 'sd-board' }, grid);
    const noteBtn = n === 9 ? el('button', { type: 'button', class: 'btn btn-ghost sd-tool no-delay', onclick: () => { noteMode = !noteMode; noteBtn.classList.toggle('on', noteMode); full.classList.toggle('notes', noteMode); pop(); paintTiles(); } },
      '✏️ ' + L('Posibles', 'Possibles', 'Pencil')) : null;
    const eraseBtn = n === 9 ? el('button', { type: 'button', class: 'btn btn-ghost sd-tool no-delay', onclick: () => { if (sel != null && !val[sel / n | 0][sel % n]) { notes[sel] = []; paintNotes(sel); pop(); } } }, '🧽 ' + L('Borrar', 'Esborrar', 'Erase')) : null;
    const helpBtn = el('button', { type: 'button', class: 'btn sd-tool sd-help no-delay', onclick: help }, '💡 ' + L('Ayuda', 'Ajuda', 'Help'));
    const msg = el('div', { class: 'sd-msg' });
    const tools = el('div', { class: 'sd-tools' }, noteBtn, eraseBtn, helpBtn);
    const fmt = s => L(`${s / 60 | 0} min ${s % 60} s`, `${s / 60 | 0} min ${s % 60} s`, `${s / 60 | 0} min ${s % 60} s`);
    const hint = el('p', { class: 'sd-hint' }, n === 9
      ? L('Toca una casilla y después un número. Con ✏️ Posibles apuntas números pequeños (en las esquinas y el centro); cuando estés segura, quítalo y pon el número grande.', 'Toca una casella i després un número. Amb ✏️ Possibles apuntes números petits (a les cantonades i al centre); quan n’estiguis segur, treu-lo i posa el número gran.', 'Tap a square, then a number. With ✏️ Pencil you note small candidates (corners and centre); when you’re sure, switch it off and place the big number.')
      : L('Toca una casilla y después un número (o arrastra la ficha hasta la casilla).', 'Toca una casella i després un número (o arrossega la fitxa fins a la casella).', 'Tap a square, then a number (or drag the tile onto the square).'));
    full = el('div', { class: 'sd-full' }, el('div', { class: 'sd-snow' }, ...Array.from({ length: 26 }, () => el('i', { style: `left:${Math.random() * 100}%;--d:${6 + Math.random() * 6}s;--dl:${-Math.random() * 10}s;--s:${8 + Math.random() * 10}px;--x:${(Math.random() - .5) * 60}px` }, '❄'))),
      el('div', { class: 'sd-in' }, head, tiles, tools, board), msg);
    document.body.append(full);
    const nbc = n / S.bc, nbr = n / S.br; // recuadros por fila / columna
    function fit() {
      if (!full) return;
      const vw = (window.visualViewport?.width || innerWidth), vh = (window.visualViewport?.height || innerHeight);
      const availW = Math.min(vw - 24, 640);
      const headH = head.offsetHeight || 50, toolsH = tools.offsetHeight || 44;
      // tablero y números: el tablero es cuadrado; los números son una fila de fichas del mismo ancho
      let side = Math.min(availW, 600);
      const tileOf = sd => (sd - 20 - (n - 1) * 6) / n;
      const used = sd => headH + (tileOf(sd) + 24) + toolsH + sd + 3 * 18 + 16 + 40; // espacios entre bloques + márgenes
      while (side > 200 && used(side) > vh) side -= 4;
      const gap = n === 9 ? 2 : 3, extra = 4;
      const cell = Math.floor((side - 20 - gap * (n - 1) - extra * (Math.max(nbc, nbr) - 1)) / n);
      grid.style.setProperty('--cell', cell + 'px'); grid.style.gap = gap + 'px';
      // separación entre recuadros: pistas vacías de 4 px entre cada recuadro
      const cols = [], rows = [];
      for (let k = 0; k < n; k++) { cols.push(cell + 'px'); if ((k + 1) % S.bc === 0 && k < n - 1) cols.push(extra + 'px'); }
      for (let k = 0; k < n; k++) { rows.push(cell + 'px'); if ((k + 1) % S.br === 0 && k < n - 1) rows.push(extra + 'px'); }
      grid.style.gridTemplateColumns = cols.join(' '); grid.style.gridTemplateRows = rows.join(' ');
      cells.forEach((cl, i) => { const r = i / n | 0, c = i % n; cl.style.gridColumn = String(c + (c / S.bc | 0) + 1); cl.style.gridRow = String(r + (r / S.br | 0) + 1); });
      board.style.width = 'auto'; board.style.minWidth = '0';
      const t = Math.min(56, Math.floor(tileOf(side)));
      tiles.style.width = 'auto'; tiles.style.gridTemplateColumns = `repeat(${n}, ${t}px)`; tiles.style.setProperty('--tile', t + 'px');
    }
    fit(); requestAnimationFrame(fit); setTimeout(fit, 300);
    const onR = () => fit(); addEventListener('resize', onR); window.visualViewport?.addEventListener('resize', onR);
    requestAnimationFrame(() => full.classList.add('show'));
    tick = setInterval(() => { if (done) return; const s = (Date.now() - t0) / 1000 | 0; timeEl.textContent = `⏱ ${s / 60 | 0}:${String(s % 60).padStart(2, '0')} min`; }, 500);
    close.onclick = () => { clearInterval(tick); removeEventListener('resize', onR); full.classList.remove('show'); const f = full; full = null; setTimeout(() => f.remove(), 300); };

    // ---- pintar
    const rc = i => [i / n | 0, i % n];
    function paint() {
      const sv = sel != null ? val[sel / n | 0][sel % n] : 0;
      cells.forEach((cl, i) => {
        const [r, c] = rc(i);
        let rel = false; if (sel != null) { const [sr, sc] = rc(sel); rel = sr === r || sc === c || S.box(sr, sc) === S.box(r, c); }
        cl.classList.toggle('sel', i === sel); cl.classList.toggle('rel', rel && i !== sel);
        cl.classList.toggle('same', !!sv && val[r][c] === sv);
      });
      paintTiles();
    }
    function paintTiles() {} // no se enseña cuántos quedan: que lo piense quien juega
    function paintNotes(i) {
      const box = cells[i].querySelector('.sd-notes');
      box.replaceChildren(...notes[i].map((v, k) => el('i', { class: 'p' + k }, v)));
    }
    paint();

    grid.addEventListener('pointerdown', e => { const cl = e.target.closest('.sd-cell'); if (!cl || done) return; unlockAudio(); sel = +cl.dataset.i; pop(); paint(); });

    // ---- poner un número
    async function put(i, v, from) {
      const [r, c] = rc(i);
      if (val[r][c]) { cells[i].classList.remove('nope'); void cells[i].offsetWidth; cells[i].classList.add('nope'); return false; }
      if (noteMode) {
        const a = notes[i]; const k = a.indexOf(v);
        if (k >= 0) a.splice(k, 1); else { if (a.length >= 5) a.shift(); a.push(v); }
        paintNotes(i); pop(); return true;
      }
      if (S.sol[r][c] !== v) { // número equivocado: tiembla y vuelve
        oops(); cells[i].classList.remove('bad'); void cells[i].offsetWidth; cells[i].classList.add('bad');
        if (from) await fly(from, cells[i], 160, true);
        return false;
      }
      if (from) await fly(from, cells[i], 180);
      val[r][c] = v; notes[i] = []; paintNotes(i);
      const num = cells[i].querySelector('.sd-num'); num.textContent = v; cells[i].classList.add('placed');
      cells[i].classList.remove('snap'); void cells[i].offsetWidth; cells[i].classList.add('snap');
      snapSound(); clickSound();
      // quitar ese número de las notas de su fila, columna y recuadro
      cells.forEach((_, j) => { const [rr, cc] = rc(j); if ((rr === r || cc === c || S.box(rr, cc) === S.box(r, c)) && notes[j].includes(v)) { notes[j] = notes[j].filter(x => x !== v); paintNotes(j); } });
      checkGroups(r, c); paint();
      if (val.every((row, rr) => row.every((x, cc) => x === S.sol[rr][cc]))) win();
      return true;
    }
    function checkGroups(r, c) {
      const groups = [[...Array(n).keys()].map(k => r * n + k), [...Array(n).keys()].map(k => k * n + c),
        cells.map((_, j) => j).filter(j => S.box(...rc(j)) === S.box(r, c))];
      let any = false;
      groups.forEach(g => { if (g.every(j => { const [rr, cc] = rc(j); return val[rr][cc]; })) { any = true; g.forEach((j, k) => setTimeout(() => { cells[j].classList.remove('glow'); void cells[j].offsetWidth; cells[j].classList.add('glow'); }, k * 45)); } });
      if (any) setTimeout(chime, 120);
    }
    // ficha que vuela desde el número de arriba hasta la casilla
    function fly(fromEl, toEl, ms, back) {
      const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
      const f = el('div', { class: 'sd-fly' }, el('b', {}, fromEl.dataset.v)); Object.assign(f.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
      document.body.append(f);
      const to = { left: b.left + 'px', top: b.top + 'px', width: b.width + 'px', height: b.height + 'px' };
      const frames = back ? [{ left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' }, { ...to, offset: .45 }, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' }]
        : [{ left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' }, to];
      return f.animate(frames, { duration: back ? 700 : ms, easing: 'cubic-bezier(.3,1.1,.5,1)' }).finished.catch(() => {}).then(() => f.remove());
    }

    // ---- tocar o arrastrar los números de arriba
    let drag = null;
    tiles.addEventListener('pointerdown', e => {
      const t = e.target.closest('.sd-tile'); if (!t || done) return; e.preventDefault(); unlockAudio();
      try { tiles.setPointerCapture(e.pointerId); } catch {}
      drag = { t, id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, f: null };
      t.classList.add('press');
    });
    tiles.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 10) {
        drag.moved = true; const a = drag.t.getBoundingClientRect();
        drag.f = el('div', { class: 'sd-fly drag' }, el('b', {}, drag.t.dataset.v)); Object.assign(drag.f.style, { width: a.width * 1.2 + 'px', height: a.height * 1.2 + 'px' }); document.body.append(drag.f); pop();
      }
      if (drag.f) { drag.f.style.left = (e.clientX - drag.f.offsetWidth / 2) + 'px'; drag.f.style.top = (e.clientY - drag.f.offsetHeight - 14) + 'px';
        const cl = document.elementsFromPoint(e.clientX, e.clientY - drag.f.offsetHeight / 2 - 14).find(x => x.classList?.contains('sd-cell'));
        cells.forEach(x => x.classList.toggle('over', x === cl)); }
    });
    const up = async e => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag; drag = null; d.t.classList.remove('press'); cells.forEach(x => x.classList.remove('over'));
      const v = +d.t.dataset.v;
      if (d.f) {
        const fr = d.f.getBoundingClientRect(); d.f.remove();
        const cl = document.elementsFromPoint(fr.left + fr.width / 2, fr.top + fr.height / 2).find(x => x.classList?.contains('sd-cell'));
        if (cl) { sel = +cl.dataset.i; paint(); await put(sel, v, null); }
        return;
      }
      if (sel == null) { say('👆 ' + L('Toca primero una casilla.', 'Toca primer una casella.', 'Tap a square first.')); oops(); return; }
      await put(sel, v, d.t);
    };
    tiles.addEventListener('pointerup', up); tiles.addEventListener('pointercancel', up);

    function say(t) { msg.textContent = t; msg.classList.remove('on'); void msg.offsetWidth; msg.classList.add('on'); }

    // ---- ayuda: pone el número bueno en la casilla elegida (o en una que falte)
    async function help() {
      if (done) return; unlockAudio();
      let i = sel != null && !val[sel / n | 0][sel % n] ? sel : null;
      if (i == null) { const empty = cells.map((_, j) => j).filter(j => !val[rc(j)[0]][rc(j)[1]]); i = empty[Math.random() * empty.length | 0]; }
      if (i == null) return;
      helps++; sel = i; const [r, c] = rc(i); const was = noteMode; noteMode = false;
      cells[i].classList.add('helped');
      await put(i, S.sol[r][c], tiles.querySelector(`.sd-tile[data-v="${S.sol[r][c]}"]`));
      noteMode = was; say('💡 ' + L('¡Te he puesto un número!', 'T’he posat un número!', 'I placed a number for you!'));
    }

    // ---- ¡conseguido! las fichas salen volando y se convierten en estrellas
    async function win() {
      done = true; clearInterval(tick); sel = null; paint();
      if (!ctx.prev && !win.sent) { win.sent = true; const s = (Date.now() - t0) / 1000 | 0; ctx.submit({ answer: `🎄 Sudoku ${n}×${n} · ⏱ ${fmt(s)}`, status: 'correct' }); }
      await sleep(500);
      const sky = el('div', { class: 'sd-sky' }); full.append(sky);
      const W = innerWidth, H = innerHeight, list = cells.map(c => c.getBoundingClientRect());
      const cols = Math.ceil(Math.sqrt(list.length * W / H)), rows = Math.ceil(list.length / cols);
      const spots = list.map((_, k) => [((k % cols) + .5 + (Math.random() - .5) * .8) * W / cols, ((k / cols | 0) + .5 + (Math.random() - .5) * .8) * H / rows]).sort(() => Math.random() - .5);
      starSong();
      list.forEach((b, k) => {
        const s = el('div', { class: 'sd-star', style: `left:${b.left}px;top:${b.top}px;width:${b.width}px;height:${b.height}px;--tw:${(1 + Math.random() * 1.5).toFixed(2)}s` }, el('b', {}, val[rc(k)[0]][rc(k)[1]]), el('i', {}, '★'));
        sky.append(s);
        const [x, y] = spots[k], sz = 16 + Math.random() * 22;
        setTimeout(() => s.classList.add('star'), 250 + k * 12);
        s.animate([{ left: b.left + 'px', top: b.top + 'px', width: b.width + 'px', height: b.height + 'px', transform: 'rotate(0)' },
          { left: (x - sz / 2) + 'px', top: (y - sz / 2) + 'px', width: sz + 'px', height: sz + 'px', transform: `rotate(${(Math.random() < .5 ? -1 : 1) * 360}deg)` }],
          { duration: 1400 + Math.random() * 500, delay: k * 12, easing: 'cubic-bezier(.4,.1,.2,1)', fill: 'forwards' });
      });
      board.classList.add('gone'); tiles.classList.add('gone'); tools.classList.add('gone');
      await sleep(1700);
      const s = (Date.now() - t0) / 1000 | 0;
      const again = el('button', { class: 'btn btn-big no-delay' }, '🔄 ' + L('Jugar otro', 'Jugar-ne un altre', 'Play another'));
      const out = el('button', { class: 'btn btn-ghost btn-big no-delay' }, '🎁 ' + L('Continuar', 'Continuar', 'Continue'));
      sky.append(el('div', { class: 'sd-win' },
        el('div', { class: 'sd-win-word' }, L('¡Lo has conseguido!', 'Aconseguit!', 'You did it!')),
        el('p', {}, L(`Sudoku ${n}×${n} en ${fmt(s)}`, `Sudoku ${n}×${n} en ${fmt(s)}`, `Sudoku ${n}×${n} in ${fmt(s)}`) + (helps ? ' · 💡 ' + helps : '')),
        el('div', { class: 'ttt-fx-btns' }, again, out)));
      fanfare(); confetti(160);
      again.onclick = () => { full.remove(); full = null; };
      out.onclick = () => { full.remove(); full = null; ctx.finish(); };
    }
  }
}
