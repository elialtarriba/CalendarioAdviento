// Día 23: crucigrama de Navidad. Arriba el abecedario con fichas cuadradas en 3D; se arrastran
// (o se toca la casilla y luego la letra) hasta su sitio. Si la letra es buena encaja con un clic;
// si no, suena decepción y la ficha vuelve sola al abecedario. Al acabar, las letras vuelan y forman
// «¡Felicidades! Has completado el crucigrama» con nieve y confeti.
import { el, sleep, confetti, toast } from './fx.js?v=18.3';
import { getLang } from './i18n.js?v=18.3';
import { pop, chime, fanfare, christmasSong, unlockAudio, snapSound, clickSound, oops } from './sound.js?v=18.3';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;

// [palabra, fila, columna, A = horizontal / D = vertical, pista]
const SETS = {
  es: { w: 11, h: 10, abc: 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ', words: [
    ['NAVIDAD', 0, 4, 'A', 'Fiesta del 25 de diciembre 🎄'],
    ['NIEVE', 0, 4, 'D', 'Cae del cielo, blanca y fría; con ella se hace un muñeco ❄️'],
    ['CASCABELES', 0, 1, 'D', 'Bolitas que suenan «tilín, tilín» en el cuello de los renos 🔔'],
    ['VILLANCICO', 0, 6, 'D', 'Canción típica de Navidad, como «Los peces en el río» 🎶'],
    ['ESTRELLA', 2, 0, 'A', 'Brilla en lo más alto del árbol ⭐'],
    ['REGALO', 4, 3, 'A', 'Lo encuentras envuelto debajo del árbol 🎁'],
    ['RENO', 6, 0, 'A', 'Animal con cuernos que tira del trineo de Papá Noel 🦌'],
    ['REYES', 8, 0, 'A', 'Los … Magos llegan el 6 de enero en camello 👑'],
  ] },
  ca: { w: 8, h: 10, abc: 'ABCÇDEFGHIJKLMNOPQRSTUVWXYZ', words: [
    ['CASCAVELLS', 0, 6, 'D', 'Boletes que fan «ding, ding» al coll dels rens 🔔'],
    ['REGAL', 1, 4, 'D', 'El trobes embolicat sota l’arbre 🎁'],
    ['REIS', 2, 3, 'A', 'Els … d’Orient arriben el 6 de gener amb camell 👑'],
    ['NADAL', 4, 3, 'A', 'La festa del 25 de desembre 🎄'],
    ['TRINEU', 4, 0, 'D', 'El vehicle volador del Pare Noel 🛷'],
    ['REN', 6, 5, 'A', 'Animal amb banyes que estira el trineu del Pare Noel 🦌'],
    ['NEU', 7, 4, 'D', 'Cau del cel, blanca i freda; amb ella es fa un ninot ❄️'],
    ['ESTRELLA', 8, 0, 'A', 'Brilla dalt de tot de l’arbre ⭐'],
  ] },
  en: { w: 9, h: 10, abc: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', words: [
    ['SNOW', 0, 0, 'A', 'White and cold, it falls from the sky ❄️'],
    ['STAR', 0, 0, 'D', 'It shines at the very top of the tree ⭐'],
    ['CHRISTMAS', 1, 7, 'D', 'The holiday on 25 December 🎄'],
    ['GIFT', 2, 2, 'D', 'Something wrapped under the tree for you 🎁'],
    ['REINDEER', 3, 0, 'A', 'Animals with antlers that pull Santa’s sleigh 🦌'],
    ['CAROL', 5, 5, 'D', 'A Christmas song you sing together 🎶'],
    ['SANTA', 6, 4, 'A', 'He comes down the chimney with presents 🎅'],
    ['BELLS', 9, 3, 'A', 'Jingle …, jingle all the way! 🔔'],
  ] },
};
const MSG = {
  es: ['¡FELICIDADES!', 'HAS COMPLETADO', 'EL CRUCIGRAMA'],
  ca: ['FELICITATS!', 'HAS COMPLETAT', 'ELS MOTS', 'ENCREUATS'],
  en: ['WELL DONE!', 'YOU COMPLETED', 'THE CROSSWORD'],
};

export function render(body, ctx) {
  const lang = SETS[getLang()] ? getLang() : 'es';
  const S = SETS[lang];
  body.style.webkitUserSelect = body.style.userSelect = 'none';

  // ---- celdas y numeración (como en los crucigramas de papel)
  const cells = {}; // "f,c" → { r, c, ch, words:[], node, filled }
  const words = S.words.map(([w, r, c, d, clue]) => ({ w, r, c, d, clue, keys: [...w].map((_, i) => d === 'A' ? `${r},${c + i}` : `${r + i},${c}`) }));
  words.forEach((wd, wi) => wd.keys.forEach((k, i) => { (cells[k] ||= { r: +k.split(',')[0], c: +k.split(',')[1], ch: wd.w[i], words: [] }).words.push(wi); }));
  const starts = [...new Set(words.map(wd => wd.keys[0]))].sort((a, b) => { const [ra, ca] = a.split(',').map(Number), [rb, cb] = b.split(',').map(Number); return ra - rb || ca - cb; });
  const numOf = k => starts.indexOf(k) + 1;
  words.forEach(wd => { wd.num = numOf(wd.keys[0]); });

  // ---- cabecera
  body.append(
    el('h2', { class: 'q-title cw-title' }, '🎄 ' + L('Crucigrama de Navidad', 'Mots encreuats de Nadal', 'Christmas crossword') + ' 🎄'),
    el('p', { class: 'game-help cw-help' }, L('Arrastra cada letra hasta su casilla (o toca una casilla y después la letra). ¡Lee las pistas de abajo!',
      'Arrossega cada lletra fins a la seva casella (o toca una casella i després la lletra). Llegeix les pistes de sota!',
      'Drag each letter to its square (or tap a square, then the letter). Read the clues below!')));

  const wrap = el('div', { class: 'cw-wrap' });
  const abc = el('div', { class: 'cw-abc' });
  [...S.abc].forEach(ch => abc.append(el('div', { class: 'cw-tile cw-src', 'data-ch': ch }, el('span', {}, ch))));
  const lights = el('div', { class: 'cw-lights' }, ...Array.from({ length: 14 }, (_, i) => el('i', { style: `--i:${i}` })));
  const grid = el('div', { class: 'cw-grid', style: `--cols:${S.w};--rows:${S.h}` });
  for (let r = 0; r < S.h; r++) for (let c = 0; c < S.w; c++) {
    const k = `${r},${c}`, cell = cells[k];
    if (!cell) { grid.append(el('div', { class: 'cw-cell empty' })); continue; }
    cell.node = el('div', { class: 'cw-cell', 'data-k': k }, starts.includes(k) ? el('small', {}, numOf(k)) : null);
    grid.append(cell.node);
  }
  const board = el('div', { class: 'cw-board' }, lights, grid);
  const hintBtn = el('button', { type: 'button', class: 'btn cw-hint no-delay', onclick: hint }, '💡 ' + L('Pista: una letra más en cada palabra', 'Pista: una lletra més a cada paraula', 'Hint: one more letter in each word'));
  const clueList = (d, title) => el('div', { class: 'cw-clues' }, el('h3', {}, title),
    ...words.filter(wd => wd.d === d).sort((a, b) => a.num - b.num).map(wd => (wd.li = el('p', { class: 'cw-clue', onclick: () => flash(wd) }, el('b', {}, wd.num + '.'), ' ', wd.clue, el('span', { class: 'cw-len' }, ` (${wd.w.length})`)))));
  const clues = el('div', { class: 'cw-cluebox' },
    clueList('A', '➡️ ' + L('Horizontales', 'Horitzontals', 'Across')),
    clueList('D', '⬇️ ' + L('Verticales', 'Verticals', 'Down')));
  wrap.append(abc, board, hintBtn, clues);
  body.append(wrap);

  // ---- colocar una letra en su casilla
  const filledAll = () => Object.values(cells).every(c => c.filled);
  function fill(cell, how = 'drop') {
    cell.filled = true;
    cell.node.classList.add('done', how);
    cell.node.append(el('span', { class: 'cw-letter' }, cell.ch));
    cell.node.classList.remove('sel');
    if (sel === cell) sel = null;
    cell.words.forEach(wi => {
      const wd = words[wi];
      if (!wd.ok && wd.keys.every(k => cells[k].filled)) {
        wd.ok = true; wd.li.classList.add('ok');
        wd.keys.forEach((k, i) => setTimeout(() => { const n = cells[k].node; n.classList.remove('glow'); void n.offsetWidth; n.classList.add('glow'); }, i * 70));
        setTimeout(chime, 250);
      }
    });
    if (filledAll()) setTimeout(finale, 900);
  }
  function flash(wd) {
    pop();
    wd.keys.forEach((k, i) => setTimeout(() => { const n = cells[k].node; n.classList.remove('peek'); void n.offsetWidth; n.classList.add('peek'); }, i * 60));
  }
  // pista: una letra más (solo una) en cada palabra que no esté acabada
  function hint() {
    unlockAudio();
    let any = false;
    words.forEach(wd => {
      const free = wd.keys.filter(k => !cells[k].filled);
      if (!free.length) return;
      const k = free[Math.floor(Math.random() * free.length)];
      any = true; fill(cells[k], 'hint');
    });
    if (any) { chime(); toast('💡 ' + L('¡Una letra más en cada palabra!', 'Una lletra més a cada paraula!', 'One more letter in each word!')); }
  }

  // ---- seleccionar casilla tocándola
  let sel = null;
  grid.addEventListener('click', e => {
    const n = e.target.closest('.cw-cell[data-k]'); if (!n) return;
    const cell = cells[n.dataset.k]; if (cell.filled) return;
    unlockAudio(); pop();
    if (sel) sel.node.classList.remove('sel');
    sel = sel === cell ? null : cell;
    if (sel) sel.node.classList.add('sel');
  });

  // ---- arrastrar fichas del abecedario
  let drag = null;
  const rectOf = n => n.getBoundingClientRect();
  function nearestCell(x, y) {
    let best = null, bd = 1e9, size = 30;
    Object.values(cells).forEach(c => {
      if (c.filled) return;
      const r = rectOf(c.node); size = r.width;
      const d = Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y);
      if (d < bd) { bd = d; best = c; }
    });
    return bd < size * 1.05 ? best : null;
  }
  // mueve la ficha flotante (position: fixed) hasta el rectángulo r
  function flyTo(t, r, ms = 260) {
    const a = { left: t.style.left, top: t.style.top, width: t.style.width, height: t.style.height };
    const b = { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' };
    const an = t.animate([a, b], { duration: ms, easing: 'cubic-bezier(.3,1.2,.5,1)' });
    return an.finished.catch(() => {}).then(() => Object.assign(t.style, b));
  }
  async function drop(t, src, cell) {
    if (cell && cell.ch === src.dataset.ch) {
      await flyTo(t, rectOf(cell.node), 180);
      t.remove(); clickSound(); snapSound(); fill(cell);
    } else if (cell) {
      // letra equivocada: tiembla, decepción y vuelve sola
      const r = rectOf(cell.node);
      await flyTo(t, r, 160);
      cell.node.classList.remove('bad'); void cell.node.offsetWidth; cell.node.classList.add('bad');
      oops();
      t.classList.add('shake', 'bad'); await sleep(450); t.classList.remove('shake');
      await flyTo(t, rectOf(src), 520); t.remove();
    } else {
      await flyTo(t, rectOf(src), 380); t.remove();
    }
  }
  abc.addEventListener('pointerdown', e => {
    const src = e.target.closest('.cw-src'); if (!src || drag) return;
    e.preventDefault(); unlockAudio();
    const r = rectOf(src);
    const t = el('div', { class: 'cw-tile cw-float lift' }, el('span', {}, src.dataset.ch));
    const size = Math.max(46, r.width * 1.25);
    Object.assign(t.style, { width: size + 'px', height: size + 'px', left: (e.clientX - size / 2) + 'px', top: (e.clientY - size / 2 - 34) + 'px' });
    document.body.append(t);
    src.classList.add('taken'); setTimeout(() => src.classList.remove('taken'), 250);
    drag = { t, src, id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false, size };
    try { abc.setPointerCapture(e.pointerId); } catch {}
    pop();
  });
  const move = e => {
    if (!drag || e.pointerId !== drag.id) return;
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 8) drag.moved = true;
    drag.t.style.left = (e.clientX - drag.size / 2) + 'px'; drag.t.style.top = (e.clientY - drag.size / 2 - 34) + 'px';
    const c = nearestCell(e.clientX, e.clientY - 34);
    Object.values(cells).forEach(x => x.node.classList.toggle('over', x === c));
  };
  const up = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const { t, src, moved } = drag; drag = null;
    Object.values(cells).forEach(x => x.node.classList.remove('over'));
    t.classList.remove('lift');
    let cell;
    if (!moved) {
      cell = sel; // toque: va a la casilla elegida
      if (!cell) toast('👆 ' + L('Arrastra la letra hasta su casilla, o toca primero una casilla.', 'Arrossega la lletra fins a la casella, o toca primer una casella.', 'Drag the letter to its square, or tap a square first.'));
    } else cell = nearestCell(e.clientX, e.clientY - 34);
    drop(t, src, cell);
  };
  abc.addEventListener('pointermove', move);
  abc.addEventListener('pointerup', up); abc.addEventListener('pointercancel', up);

  // ---- final: las letras vuelan y escriben la felicitación
  let fx = null, music = null, iv = null;
  function stopFx() {
    clearInterval(iv); iv = null;
    try { music?.stop(1); } catch {} music = null;
    if (fx) { const f = fx; fx = null; f.classList.add('out'); setTimeout(() => f.remove(), 450); }
  }
  ctx.cleanup = stopFx;
  async function finale() {
    if (fx) return;
    if (!ctx.prev && !finale.sent) { finale.sent = true; ctx.submit({ answer: '✅ ' + L('Crucigrama completado', 'Mots encreuats completats', 'Crossword completed'), status: 'correct' }); }
    fx = el('div', { class: 'cw-fx' });
    const snow = el('div', { class: 'cw-snow' }, ...Array.from({ length: 46 }, () => el('i', { style: `left:${Math.random() * 100}%;--d:${4 + Math.random() * 6}s;--dl:${-Math.random() * 8}s;--s:${10 + Math.random() * 18}px;--x:${(Math.random() - .5) * 120}px` }, '❄')));
    fx.append(snow);
    document.body.append(fx);
    // fichas que salen de las casillas
    const from = Object.values(cells).map(c => rectOf(c.node));
    Object.values(cells).forEach(c => c.node.classList.add('gone'));
    const lines = MSG[lang];
    const maxLen = Math.max(...lines.map(l => l.length));
    const ts = Math.min(40, Math.floor((innerWidth - 24) / maxLen) - 3), gap = 3;
    const totalH = lines.length * (ts + 8);
    const top0 = Math.max(70, innerHeight * .36 - totalH / 2);
    const targets = [];
    lines.forEach((ln, li) => {
      const w = ln.length * (ts + gap) - gap, x0 = (innerWidth - w) / 2;
      [...ln].forEach((ch, i) => { if (ch !== ' ') targets.push({ ch, x: x0 + i * (ts + gap), y: top0 + li * (ts + 8), li }); });
    });
    const n = Math.max(from.length, targets.length);
    fanfare(); confetti(240);
    for (let i = 0; i < n; i++) {
      const f = from[i % from.length], tg = targets[i];
      const letter = i < from.length ? Object.values(cells)[i].ch : '';
      const t = el('div', { class: 'cw-tile cw-fly' + (tg ? ' msg' : '') }, el('span', {}, letter || (tg ? tg.ch : '')));
      // la ficha ya tiene el tamaño final (ts) y la letra centrada; al salir se ve del tamaño de la casilla
      const s0 = f.width / ts, x0 = f.left + f.width / 2 - ts / 2, y0 = f.top + f.height / 2 - ts / 2;
      Object.assign(t.style, { width: ts + 'px', height: ts + 'px', left: x0 + 'px', top: y0 + 'px', fontSize: Math.round(ts * .64) + 'px' });
      fx.append(t);
      const mx = Math.random() * innerWidth - x0 - ts / 2, my = Math.random() * innerHeight * .7 - y0;
      const spin = (Math.random() < .5 ? -1 : 1) * (Math.random() < .5 ? 360 : 720); // acaba derecha
      const delay = i * 28;
      if (tg) {
        const dx = tg.x - x0, dy = tg.y - y0;
        const an = t.animate([
          { transform: `translate(0,0) rotate(0) scale(${s0})` },
          { transform: `translate(${mx}px,${my}px) rotate(${spin / 2}deg) scale(1.8)`, offset: .45 },
          { transform: `translate(${dx}px,${dy}px) rotate(${spin}deg) scale(1)` },
        ], { duration: 1900, delay, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'both' });
        setTimeout(() => { t.firstChild.textContent = tg.ch; }, delay + 850);
        an.finished.then(() => { Object.assign(t.style, { left: tg.x + 'px', top: tg.y + 'px' }); an.cancel(); t.style.setProperty('--w', (i % 14) * .08 + 's'); t.classList.add('wave'); }).catch(() => {});
      } else {
        t.animate([
          { transform: `translate(0,0) rotate(0) scale(${s0})`, opacity: 1 },
          { transform: `translate(${mx}px,${-innerHeight}px) rotate(${spin}deg)`, opacity: 0 },
        ], { duration: 1700, delay, easing: 'cubic-bezier(.5,0,.7,1)', fill: 'both' });
      }
    }
    setTimeout(() => { if (fx) try { music = christmasSong(); } catch {} }, 1800);
    iv = setInterval(() => fx && confetti(70), 2600);
    await sleep(n * 28 + 2100);
    if (!fx) return;
    const again = el('button', { class: 'btn btn-big no-delay' }, '🔄 ' + L('Volver a jugar', 'Tornar a jugar', 'Play again'));
    const out = el('button', { class: 'btn btn-ghost btn-big no-delay' }, '🎁 ' + L('Continuar', 'Continuar', 'Continue'));
    fx.append(el('div', { class: 'cw-fx-btns', style: `top:${top0 + totalH + 40}px` }, again, out));
    again.onclick = () => { stopFx(); reset(); };
    out.onclick = () => { stopFx(); ctx.finish(); };
  }
  function reset() {
    Object.values(cells).forEach(c => { c.filled = false; c.node.className = 'cw-cell'; c.node.querySelector('.cw-letter')?.remove(); });
    words.forEach(wd => { wd.ok = false; wd.li.classList.remove('ok'); });
    sel = null; body.scrollTop = 0;
  }
}
