// Día 13 · (V27.3) «El solitari de Nadal» — el solitario de siempre (Klondike, se roba de 1 en 1) con cartas navideñas.
// Se abre con el botón de debajo de la ruleta de superpoderes.
// Fácil de jugar: TOCA una carta y se va sola al mejor sitio (o arrástrala). Botón «Desfer», partida nueva y normas.
// Cartas: ♥ ♦ rojas y ♣ ♠ verdes (se alternan rojo/verde en las columnas).
//   A = estrella de galleta · J = el duende · Q = el reno · K = Papá Noel · 2–10 = perrito (♥), galleta (♦), búho (♣), muñeco de nieve (♠).
import { getLang } from './i18n.js';
import { el, sleep, confetti } from './fx.js';
import { pop, chime, fanfare, clickSound, snapSound, unlockAudio, wrong } from './sound.js';
import { bigCongrats } from './gamefx.js';
import { S } from './app.js';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const rc = (n, ...k) => n.replaceChildren(...k.flat().filter(x => x != null && x !== false));
const SUITS = ['♥', '♦', '♣', '♠'];
const RED = s => s < 2;
const RANK = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const PIC = { 1: 'mem-14.webp', 11: 'mem-06.webp', 12: 'mem-07.webp', 13: 'mem-13.webp' };
const SUITPIC = ['mem-01.webp', 'mem-05.webp', 'mem-09.webp', 'mem-12.webp'];
const BACK = 'mem-reverso.webp';

function deal() {
  const deck = [];
  for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) deck.push({ s, r, up: false, id: s * 13 + r });
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  const tab = Array.from({ length: 7 }, () => []);
  for (let c = 0; c < 7; c++) for (let k = 0; k <= c; k++) { const card = deck.pop(); card.up = k === c; tab[c].push(card); }
  return { stock: deck, waste: [], found: [[], [], [], []], tab, moves: 0 };
}
const clone = G => JSON.parse(JSON.stringify(G));
const canFound = (card, pile) => pile.length ? (pile[pile.length - 1].s === card.s && pile[pile.length - 1].r === card.r - 1) : card.r === 1;
const canTab = (card, col) => { if (!col.length) return card.r === 13; const t = col[col.length - 1]; return t.up && RED(t.s) !== RED(card.s) && t.r === card.r + 1; };

export function openSolitaire(ctx) {
  let G = deal(), hist = [], alive = true, secs = 0, won = false, tick = 0;
  const board = el('div', { class: 'sol-board' });
  const movesEl = el('b', {}, '0'), timeEl = el('b', {}, '0:00');
  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const undoBtn = el('button', { type: 'button', class: 'sol-btn no-delay', onclick: () => undo() }, '↶ ' + L('Deshacer', 'Desfer', 'Undo'));
  const newBtn = el('button', { type: 'button', class: 'sol-btn no-delay', onclick: () => fresh() }, '🔄 ' + L('Nueva', 'Nova', 'New'));
  const rulesBtn = el('button', { type: 'button', class: 'sol-btn no-delay', onclick: () => showRules() }, '📜 ' + L('Normas', 'Normes', 'Rules'));
  const autoBtn = el('button', { type: 'button', class: 'sol-btn sol-auto no-delay', style: 'display:none', onclick: () => autoFinish() }, '✨ ' + L('¡Acabar solo!', 'Acabar sol!', 'Finish!'));
  const close = () => { alive = false; clearInterval(tick); removeEventListener('resize', layout); wrap.classList.add('out'); document.documentElement.classList.remove('gm-lock'); setTimeout(() => wrap.remove(), 350); };
  const wrap = el('div', { class: 'oca-wrap sol-wrap' },
    el('div', { class: 'oca-snow' }),
    el('div', { class: 'oca-head' }, el('button', { type: 'button', class: 'cc8-x no-delay', onclick: () => close() }, '✕'), el('div', { class: 'oca-title' }, L('El solitario de Navidad', 'El solitari de Nadal', 'Christmas solitaire'))),
    el('div', { class: 'sol-hud' }, el('span', {}, '🃏 ', movesEl), el('span', {}, '⏱ ', timeEl), undoBtn, newBtn, rulesBtn),
    board, autoBtn);
  document.body.append(wrap);
  document.documentElement.classList.add('gm-lock');
  tick = setInterval(() => { if (!won && G.moves > 0) { secs++; timeEl.textContent = fmt(secs); } }, 1000);

  // ---- medidas: 7 columnas que caben en la pantalla
  let CW = 48, CH = 67, GAP = 5, TOP = 0, X = [], FD = 7, FU = 18, BH = 500;
  function layout() {
    const W = Math.min(innerWidth * .98, 620);
    GAP = Math.max(3, Math.round(W * .012));
    CW = Math.floor((W - GAP * 8) / 7); CH = Math.round(CW * 1.4);
    BH = Math.max(300, innerHeight - (board.getBoundingClientRect().top || 120) - 70);
    board.style.width = W + 'px'; board.style.height = BH + 'px';
    board.style.setProperty('--cw', CW + 'px'); board.style.setProperty('--ch', CH + 'px');
    X = Array.from({ length: 7 }, (_, i) => GAP + i * (CW + GAP));
    TOP = CH + GAP * 3;
    draw();
  }

  // ---- una carta
  function cardEl(c) {
    if (!c.up) return el('div', { class: 'sol-card back' }, el('img', { src: BACK, alt: '', draggable: false }));
    const red = RED(c.s);
    return el('div', { class: 'sol-card face ' + (red ? 'red' : 'green') + (c.r >= 11 || c.r === 1 ? ' pic' : '') },
      el('div', { class: 'sol-corner' }, el('b', {}, RANK[c.r]), el('span', {}, SUITS[c.s])),
      el('img', { class: 'sol-img', src: PIC[c.r] || SUITPIC[c.s], alt: '', draggable: false }),
      el('div', { class: 'sol-corner br' }, el('b', {}, RANK[c.r]), el('span', {}, SUITS[c.s])));
  }
  // ---- dibujar todo
  const nodes = new Map();
  function place(node, x, y, z) { node.style.transform = `translate(${x}px, ${y}px)`; node.style.zIndex = z; }
  function draw() {
    const kids = [];
    // huecos
    const slot = (x, y, txt, cls = '') => el('div', { class: 'sol-slot ' + cls, style: `transform:translate(${x}px,${y}px)` }, txt);
    kids.push(slot(X[0], GAP, G.stock.length ? '' : '↻', 'stock'));
    kids.push(slot(X[1], GAP, ''));
    for (let f = 0; f < 4; f++) kids.push(slot(X[3 + f], GAP, SUITS[f], RED(f) ? 'red' : 'green'));
    for (let c = 0; c < 7; c++) kids.push(slot(X[c], TOP, 'K', 'col'));
    // columnas: si no caben, se aprietan
    const offs = G.tab.map(col => {
      const nd = col.filter(c => !c.up).length, nu = col.length - nd;
      let fd = 7 + Math.round(CW * .05), fu = Math.round(CH * .34);
      const need = TOP + nd * fd + Math.max(0, nu - 1) * fu + CH;
      if (need > BH - 4 && nu > 1) fu = Math.max(10, Math.floor((BH - 4 - TOP - nd * fd - CH) / (nu - 1)));
      return { fd, fu };
    });
    const out = [];
    G.stock.forEach((c, i) => out.push([c, X[0] + Math.min(i, 3) * .7, GAP - Math.min(i, 3) * .7, i, { from: 'stock' }]));
    const ws = G.waste.length;
    G.waste.forEach((c, i) => { const k = ws - 1 - i; out.push([c, X[1] + (k === 0 && ws > 1 ? Math.round(CW * .18) : 0), GAP, 10 + i, { from: 'waste', i }]); }); // la de encima, un poco desplazada
    G.found.forEach((p, f) => p.forEach((c, i) => out.push([c, X[3 + f], GAP, 100 + i, { from: 'found', f, i }])));
    G.tab.forEach((col, ci) => { let y = TOP; col.forEach((c, i) => { out.push([c, X[ci], y, 200 + i, { from: 'tab', c: ci, i }]); y += c.up ? offs[ci].fu : offs[ci].fd; }); });
    const seen = new Set();
    out.forEach(([c, x, y, z, where]) => {
      const key = c.id + (c.up ? 'u' : 'd');
      let n = nodes.get(c.id);
      if (!n || n._k !== key) { n = cardEl(c); n._k = key; nodes.set(c.id, n); }
      n._where = where; n._card = c;
      place(n, x, y, z); seen.add(c.id); kids.push(n);
    });
    rc(board, kids);
    movesEl.textContent = G.moves;
    undoBtn.disabled = !hist.length;
    const allUp = !G.stock.length && !G.waste.length && G.tab.every(col => col.every(c => c.up));
    autoBtn.style.display = allUp && !won ? '' : 'none';
  }

  // ---- jugar
  const save = () => { hist.push(clone(G)); if (hist.length > 200) hist.shift(); };
  function undo() { if (!hist.length) return; G = hist.pop(); clickSound(); draw(); }
  function fresh() { G = deal(); hist = []; secs = 0; won = false; timeEl.textContent = '0:00'; snapSound(); nodes.clear(); draw(); }
  function drawStock() {
    save();
    if (G.stock.length) { const c = G.stock.pop(); c.up = true; G.waste.push(c); clickSound(); }
    else if (G.waste.length) { G.stock = G.waste.reverse().map(c => ({ ...c, up: false })); G.waste = []; snapSound(); }
    else { hist.pop(); return; }
    G.moves++; draw();
  }
  // las cartas que se mueven juntas desde ese sitio
  function pick(where) {
    if (where.from === 'waste') return where.i === G.waste.length - 1 ? [G.waste[G.waste.length - 1]] : null;
    if (where.from === 'found') return where.i === G.found[where.f].length - 1 ? [G.found[where.f][where.i]] : null;
    if (where.from === 'tab') { const col = G.tab[where.c]; const c = col[where.i]; return c?.up ? col.slice(where.i) : null; }
    return null;
  }
  function remove(where, n) {
    if (where.from === 'waste') G.waste.pop();
    else if (where.from === 'found') G.found[where.f].pop();
    else { const col = G.tab[where.c]; col.splice(col.length - n, n); if (col.length && !col[col.length - 1].up) col[col.length - 1].up = true; }
  }
  // destino: {to:'found', f} o {to:'tab', c}
  function legal(cards, dest, where) {
    if (dest.to === 'found') return cards.length === 1 && dest.f === cards[0].s && canFound(cards[0], G.found[dest.f]) && where.from !== 'found'; // cada palo en su sitio
    return canTab(cards[0], G.tab[dest.c]) && !(where.from === 'tab' && where.c === dest.c);
  }
  function doMove(where, cards, dest) {
    save(); remove(where, cards.length);
    if (dest.to === 'found') G.found[dest.f].push(...cards); else G.tab[dest.c].push(...cards);
    G.moves++;
    if (dest.to === 'found') chime(); else pop();
    draw(); checkWin();
  }
  // tocar: al mejor sitio (primero a las de arriba; si no, a una columna con cartas; si no, a una vacía)
  function bestDest(cards, where) {
    if (cards.length === 1 && legal(cards, { to: 'found', f: cards[0].s }, where)) return { to: 'found', f: cards[0].s };
    const cols = [...Array(7).keys()].filter(c => legal(cards, { to: 'tab', c }, where));
    const full = cols.find(c => G.tab[c].length); if (full != null) return { to: 'tab', c: full };
    // un rey que ya está arriba de su columna no se mueve a otra vacía
    if (cols.length && !(where.from === 'tab' && where.i === 0)) return { to: 'tab', c: cols[0] };
    return null;
  }
  function tap(node) {
    const w = node._where; if (!w) return;
    if (w.from === 'stock') return drawStock();
    if (w.from === 'found') return; // tocar las de arriba no las baja (se pueden arrastrar)
    const cards = pick(w); if (!cards) return;
    const d = bestDest(cards, w);
    if (d) doMove(w, cards, d); else { wrong(); node.classList.add('sol-shake'); setTimeout(() => node.classList.remove('sol-shake'), 400); }
  }
  // arrastrar
  let drag = null;
  board.addEventListener('pointerdown', e => {
    unlockAudio();
    const slotStock = e.target.closest('.sol-slot.stock'); if (slotStock) { drawStock(); return; }
    const node = e.target.closest('.sol-card'); if (!node || !node._where) return;
    if (node._where.from === 'stock') { drawStock(); return; }
    const cards = pick(node._where); if (!cards) return;
    e.preventDefault();
    const els = cards.map(c => nodes.get(c.id));
    const r0 = board.getBoundingClientRect();
    const starts = els.map(n => { const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(n.style.transform); return [+m[1], +m[2]]; });
    drag = { node, cards, els, starts, x0: e.clientX, y0: e.clientY, t0: Date.now(), moved: false, r0 };
    try { board.setPointerCapture(e.pointerId); } catch {}
  });
  board.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.moved && Math.hypot(dx, dy) < 8) return;
    drag.moved = true;
    drag.els.forEach((n, i) => { n.classList.add('drag'); place(n, drag.starts[i][0] + dx, drag.starts[i][1] + dy, 900 + i); });
  });
  const endDrag = e => {
    if (!drag) return; const d = drag; drag = null;
    if (!d.moved) return tap(d.node);
    // ¿dónde la ha soltado? por el centro de la primera carta
    const cx = d.starts[0][0] + (e.clientX - d.x0) + CW / 2, cy = d.starts[0][1] + (e.clientY - d.y0) + CH / 2;
    let dest = null;
    if (cy < TOP - GAP) { const f = X.findIndex(x => cx >= x - GAP && cx <= x + CW + GAP) - 3; if (f >= 0 && f < 4) dest = { to: 'found', f }; }
    else { const c = X.findIndex(x => cx >= x - GAP && cx <= x + CW + GAP); if (c >= 0) dest = { to: 'tab', c }; }
    d.els.forEach(n => n.classList.remove('drag'));
    if (dest && legal(d.cards, dest, d.node._where)) doMove(d.node._where, d.cards, dest);
    else { if (dest) wrong(); draw(); }
  };
  board.addEventListener('pointerup', endDrag); board.addEventListener('pointercancel', () => { if (drag) { drag.els.forEach(n => n.classList.remove('drag')); drag = null; draw(); } });

  async function autoFinish() {
    autoBtn.style.display = 'none';
    while (alive && !won) {
      let movedOne = false;
      for (let c = 0; c < 7 && !movedOne; c++) {
        const col = G.tab[c]; if (!col.length) continue;
        const card = col[col.length - 1];
        if (canFound(card, G.found[card.s])) { doMove({ from: 'tab', c, i: col.length - 1 }, [card], { to: 'found', f: card.s }); movedOne = true; }
      }
      if (!movedOne) break;
      await sleep(110);
    }
  }
  async function checkWin() {
    if (won || G.found.some(p => p.length < 13)) return;
    won = true; autoBtn.style.display = 'none';
    const b0 = (() => { try { return +localStorage.getItem('adv_sol_best_' + (S.user?.uid || '')) || 0; } catch { return 0; } })();
    const rec = !b0 || secs < b0; if (rec) try { localStorage.setItem('adv_sol_best_' + (S.user?.uid || ''), secs); } catch {}
    // ⭐ Marcador de Nadal para todos (+2 la 1.ª vez, +1 después) y 🍄 gnomos (la 1.ª vez que lo resuelven)
    const lines = ['⏱ ' + fmt(secs) + ' · 🃏 ' + G.moves + ' ' + L('movimientos', 'moviments', 'moves'), '🏆 ' + (rec ? L('¡Nuevo récord!', 'Nou rècord!', 'New record!') : L('Tu récord', 'El teu rècord', 'Your best') + ': ' + fmt(b0))];
    try { await ctx.won?.(); lines.push('⭐ ' + L('¡Suma al Marcador de Navidad!', 'Suma al Marcador de Nadal!', 'Christmas scoreboard points!')); } catch {}
    let claim = null;
    try {
      const gm = await import('./gnomes.js'); const bs = await gm.gameBonusState('sol13');
      if (bs) { if (!bs.doc) await gm.gameBonusStart(bs); await gm.gameBonusLevel(bs, 1);
        const owe = gm.gameBonusOwed(bs) - (bs.doc?.pts || 0);
        if (owe > 0) {
          claim = el('button', { type: 'button', class: 'cc8-gn ready no-delay' }, el('img', { src: 'gnomo.png', alt: '' }),
            el('span', {}, el('b', {}, `🍄 ${L('¡Pulsa y cobra', 'Prem i cobra', 'Tap to get')} +${owe}!`), el('small', {}, L('para tu juego de los gnomos', 'per al teu joc dels gnoms', 'for your gnome game'))));
          claim.onclick = async () => { claim.disabled = true; try { const add = await gm.gameBonusClaim(bs); if (add) { fanfare(); confetti(160); } } catch (e) { console.warn(e); claim.disabled = false; return; }
            claim.replaceWith(el('p', { class: 'gfx-line' }, '🍄 ' + L('¡Puntos cobrados!', 'Punts cobrats!', 'Points collected!') + ' ✅')); };
        } } } catch (e) { console.warn(e); }
    if (claim) lines.push(claim);
    await sleep(400); if (!alive) return;
    let fx = null;
    const again = el('button', { type: 'button', class: 'btn btn-big no-delay', onclick: () => { fx?.close(); fresh(); } }, '🔄 ' + L('Otra partida', 'Una altra partida', 'Play again'));
    const out = el('button', { type: 'button', class: 'btn btn-ghost no-delay', onclick: () => { fx?.close(); close(); } }, '🎄 ' + L('Salir', 'Sortir', 'Exit'));
    fx = await bigCongrats(wrap, { title: L('¡Solitario resuelto!', 'Solitari resolt!', 'Solitaire solved!'), img: 'mem-13.webp', lines, buttons: [again, out] });
  }

  function showRules(first = false) {
    const box = el('div', { class: 'cc8-end' }, el('div', { class: 'cc8-endcard inv-rulescard' },
      el('h2', {}, '🃏 ' + L('El solitario de Navidad', 'El solitari de Nadal', 'Christmas solitaire')),
      el('ul', { class: 'inv-rl' },
        el('li', {}, '🎯 ' + L('Objetivo: subir todas las cartas arriba, cada palo en su sitio, del A a la K.', 'Objectiu: pujar totes les cartes a dalt, cada pal al seu lloc, de l’A a la K.', 'Goal: move all cards up top, each suit in its place, from A to K.')),
        el('li', {}, '👆 ' + L('Toca una carta y se va sola donde puede ir. También la puedes arrastrar.', 'Toca una carta i se’n va sola on pot anar. També la pots arrossegar.', 'Tap a card and it goes where it can. You can also drag it.')),
        el('li', {}, '🔴🟢 ' + L('En las columnas, las cartas bajan de una en una (K, Q, J, 10…) alternando rojo y verde.', 'A les columnes, les cartes baixen d’una en una (K, Q, J, 10…) alternant vermell i verd.', 'In the columns, cards go down one by one (K, Q, J, 10…) alternating red and green.')),
        el('li', {}, '🎅 ' + L('En una columna vacía solo puede ir una K (Papá Noel).', 'En una columna buida només hi pot anar una K (el Pare Noel).', 'Only a K (Santa) can go in an empty column.')),
        el('li', {}, '🂠 ' + L('Toca el mazo de arriba a la izquierda para sacar cartas. Cuando se acaba, tócalo otra vez y vuelve a empezar.', 'Toca el munt de dalt a l’esquerra per treure cartes. Quan s’acaba, toca’l un altre cop i torna a començar.', 'Tap the pile top left to draw cards. When it runs out, tap it again to start over.')),
        el('li', {}, '↶ ' + L('Si te equivocas, pulsa «Deshacer».', 'Si t’equivoques, prem «Desfer».', 'If you make a mistake, tap «Undo».')),
        el('li', { class: 'inv-rlgoal' }, '⭐ ' + L('Si lo resuelves: suma al Marcador de Navidad (+2 la 1.ª vez, +1 las siguientes). Gnomos: la 1.ª vez, ¡puntos para vuestro juego! 🍄', 'Si el resols: suma al Marcador de Nadal (+2 la 1a vegada, +1 les següents). Gnoms: la 1a vegada, punts per al vostre joc! 🍄', 'Solve it: Christmas scoreboard points (+2 first time, +1 after). Gnomes: the first time, points for your game! 🍄')),
        el('li', {}, '🃏 A ' + L('= estrella', '= estrella', '= star') + ' · J ' + L('= duende', '= follet', '= elf') + ' · Q ' + L('= reno', '= ren', '= reindeer') + ' · K ' + L('= Papá Noel', '= Pare Noel', '= Santa'))),
      el('div', { class: 'cc8-endbtns' },
        el('button', { type: 'button', class: 'btn btn-big no-delay', onclick: () => box.remove() }, first ? '🃏 ' + L('¡A jugar!', 'A jugar!', 'Play!') : '👍 ' + L('Seguir', 'Continuar', 'Continue')),
        first ? el('button', { type: 'button', class: 'btn btn-ghost no-delay', onclick: () => close() }, '⏰ ' + L('Lo haré más tarde', 'Ho faré més tard', 'Later')) : null)));
    wrap.append(box);
  }
  addEventListener('resize', layout);
  requestAnimationFrame(() => { layout(); showRules(true); });
}
