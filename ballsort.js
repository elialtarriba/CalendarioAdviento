// Día 15: ordena las bolas de Navidad por colores en botes de cristal.
// Se toca un bote (sube la bola de arriba) y luego otro bote; o se arrastra la bola con el dedo.
// Se puede dejar en cualquier bote que no esté lleno (caben 4). Cada partida (25) es distinta.
// Ayuda (solo si no lo consigues): el bote de donde sacar y el bote donde dejar brillan.
import { el, sleep, confetti, popup, toast } from './fx.js?v=19';
import { getLang } from './i18n.js?v=19';
import { pop, chime, fanfare, christmasSong, unlockAudio, oops, glassClink } from './sound.js?v=19';
import { nextGame, rng, TOTAL } from './games25.js?v=19';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const CAP = 4, COLORS = ['red', 'gold', 'green', 'blue', 'silver'], EMPTY = 2;

// ---- buscar solución (sirve para crear el juego y para la ayuda)
const key = s => s.map(t => t.join('')).sort().join('|');
const full = t => t.length === CAP && t.every(x => x === t[0]);
const solved = s => s.every(t => !t.length || full(t));
function moves(s) {
  const out = [];
  for (let i = 0; i < s.length; i++) {
    const a = s[i]; if (!a.length || full(a)) continue;
    const top = a[a.length - 1], same = a.every(x => x === top);
    let emptyDone = false;
    for (let j = 0; j < s.length; j++) {
      if (i === j) continue; const b = s[j];
      if (b.length >= CAP) continue;
      if (b.length && b[b.length - 1] !== top) continue;
      if (!b.length) { if (same || emptyDone) continue; emptyDone = true; } // no sirve pasar un bote de un solo color a otro vacío
      out.push([i, j]);
    }
  }
  // primero los movimientos que juntan colores
  return out.sort((m, n) => (s[n[1]].length ? 1 : 0) - (s[m[1]].length ? 1 : 0));
}
// movimientos «libres»: cualquier bola a cualquier bote no lleno (así se juega desde V18.5)
function movesFree(s) {
  const out = [];
  for (let i = 0; i < s.length; i++) {
    const a = s[i]; if (!a.length || full(a)) continue;
    const top = a[a.length - 1], same = a.every(x => x === top); let emptyDone = false;
    for (let j = 0; j < s.length; j++) {
      if (i === j) continue; const b = s[j]; if (b.length >= CAP) continue;
      if (!b.length) { if (same || emptyDone) continue; emptyDone = true; }
      out.push([i, j, !b.length ? 1 : b[b.length - 1] === top ? (b.every(x => x === top) ? -1 : 0) : 2]);
    }
  }
  return out.sort((m, n) => m[2] - n[2]).map(m => [m[0], m[1]]);
}
const apply = (s, [i, j]) => { const c = s.map(t => t.slice()); c[j].push(c[i].pop()); return c; };
function solve(start, limit = 60000, gen = moves) {
  const seen = new Set(), path = []; let n = 0;
  const dfs = s => {
    if (solved(s)) return true;
    if (++n > limit) return false;
    const k = key(s); if (seen.has(k)) return false; seen.add(k);
    for (const m of gen(s)) { path.push(m); if (dfs(apply(s, m))) return true; path.pop(); }
    return false;
  };
  return dfs(start) ? path.slice() : null;
}
// para la ayuda: primero con las reglas estrictas (camino corto); si no, con las libres
const solveAny = s => solve(s) || solve(s, 80000, movesFree);
// partida número g (0..24): siempre la misma para el mismo número, distinta entre números
function newGame(g) {
  const R = rng(1600 + g * 7919);
  for (let tries = 0; tries < 400; tries++) {
    const balls = COLORS.flatMap(c => Array(CAP).fill(c));
    for (let i = balls.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [balls[i], balls[j]] = [balls[j], balls[i]]; }
    const s = COLORS.map((_, i) => balls.slice(i * CAP, i * CAP + CAP));
    for (let e = 0; e < EMPTY; e++) s.push([]);
    if (s.some(full) || s.some(t => t.length && t.slice(1).every(x => x === t[0]))) continue;
    const sol = solve(s); if (sol && sol.length >= 12) return s;
  }
  return COLORS.map((c, i) => [COLORS[(i + 1) % 5], COLORS[(i + 2) % 5], COLORS[(i + 3) % 5], c]).concat([[], []]);
}

export function render(body, ctx) {
  body.style.webkitUserSelect = body.style.userSelect = 'none';
  body.append(
    el('h2', { class: 'q-title cw-title' }, '🎄 ' + L('Ordena las bolas de Navidad', 'Ordena les boles de Nadal', 'Sort the Christmas baubles') + ' 🎄'),
    el('p', { class: 'game-help cw-help' }, L('Pon en cada bote de cristal las 4 bolas del mismo color. Toca un bote y después otro (o arrastra la bola). Puedes dejar la bola en cualquier bote que no esté lleno (caben 4).',
      'Posa a cada pot de vidre les 4 boles del mateix color. Toca un pot i després un altre (o arrossega la bola). Pots deixar la bola a qualsevol pot que no estigui ple (n’hi caben 4).',
      'Put the 4 baubles of the same colour in each glass jar. Tap a jar and then another (or drag the bauble). You can put the bauble in any jar that is not full (4 fit).')));

  const wrap = el('div', { class: 'cw-wrap bs-wrap' });
  const lights = el('div', { class: 'cw-lights' }, ...Array.from({ length: 14 }, (_, i) => el('i', { style: `--i:${i}` })));
  const stage = el('div', { class: 'bs-stage' });
  const snow = el('div', { class: 'sp-snow bs-snow' });
  const board = el('div', { class: 'cw-board bs-board' }, lights, stage, snow);
  const moveTxt = el('span', { class: 'sp-moves' });
  const undoBtn = el('button', { type: 'button', class: 'btn btn-ghost bs-small no-delay', onclick: () => undo() }, '↩️ ' + L('Deshacer', 'Desfer', 'Undo'));
  const resetBtn = el('button', { type: 'button', class: 'btn btn-ghost bs-small no-delay', onclick: () => restart() }, '🔄 ' + L('Empezar de nuevo', 'Tornar a començar', 'Start again'));
  const helpBtn = el('button', { type: 'button', class: 'btn btn-ghost ws-help no-delay', onclick: () => help() }, '🆘 ' + L('Ayuda (solo si no lo consigues)', 'Ajuda (només si no te’n surts)', 'Help (only if you’re stuck)'));
  const msg = el('div', { class: 'sp-msg' });
  const bar = el('div', { class: 'bs-bar' }, undoBtn, moveTxt, resetBtn);
  wrap.append(board, bar, helpBtn, msg);
  body.append(wrap);

  let gameNo = nextGame('ballsort'), first = newGame(gameNo), state, history, count, sel = null, done = false, helping = false, busyAnim = false;
  let plan = null, tubes = [], glass = [], balls = []; // balls[i] = elementos del bote i (de abajo arriba)
  let G = null; // medidas

  function build() {
    stage.replaceChildren(); tubes = []; glass = []; balls = state.map(() => []);
    state.forEach((t, i) => {
      const tube = el('div', { class: 'bs-tube', 'data-i': i }, el('i', { class: 'bs-rim' }));
      const front = el('div', { class: 'bs-glass' });
      tubes.push(tube); glass.push(front); stage.append(tube, front);
      t.forEach(c => { const b = el('div', { class: 'bs-ball bs-' + c }, el('i')); balls[i].push(b); stage.append(b); });
    });
    measure(); place(false);
  }
  function measure() {
    const W = stage.clientWidth || 320, n = state.length, gap = Math.max(5, W * .022);
    const tw = Math.min(62, (W - gap * (n - 1)) / n), b = tw * .8, step = b * 1.02;
    const th = step * CAP + b * .55 + tw * .2, top = b * 1.25;
    G = { W, n, gap, tw, b, step, th, top, x0: (W - (tw * n + gap * (n - 1))) / 2 };
    stage.style.height = (top + th + 8) + 'px';
    stage.style.setProperty('--b', b + 'px'); stage.style.setProperty('--tw', tw + 'px'); stage.style.setProperty('--th', th + 'px');
    tubes.forEach((t, i) => { t.style.left = glass[i].style.left = (G.x0 + i * (tw + gap)) + 'px'; t.style.top = glass[i].style.top = top + 'px'; });
  }
  const tubeX = i => G.x0 + i * (G.tw + G.gap) + G.tw / 2;
  const slotPos = (i, k) => [tubeX(i) - G.b / 2, G.top + G.th - G.tw * .12 - G.b - k * G.step];
  const liftPos = i => [tubeX(i) - G.b / 2, G.top - G.b * 1.15];
  const setXY = (e, [x, y]) => { e.style.left = x + 'px'; e.style.top = y + 'px'; };
  function place() { balls.forEach((col, i) => col.forEach((e, k) => setXY(e, slotPos(i, k)))); if (sel != null) setXY(top(sel), liftPos(sel)); paintTubes(); }
  const top = i => balls[i][balls[i].length - 1];
  const fly = (e, pts, ms) => {
    const from = { left: e.style.left, top: e.style.top };
    const frames = [from, ...pts.map(([x, y]) => ({ left: x + 'px', top: y + 'px' }))];
    setXY(e, pts[pts.length - 1]);
    return e.animate(frames, { duration: ms, easing: 'cubic-bezier(.35,.9,.4,1.08)' }).finished.catch(() => {});
  };
  function paintTubes() {
    tubes.forEach((t, i) => { const f = full(state[i]); t.classList.toggle('done', f); glass[i].classList.toggle('done', f); t.classList.toggle('sel', i === sel); });
    tubes.forEach(t => t.classList.remove('hint-from', 'hint-to'));
    if (helping && !done) {
      // se sigue un mismo plan; solo se recalcula si la persona hace otro movimiento
      if (!plan || !plan.length || plan.at !== key(state)) { plan = solveAny(state) || []; plan.at = key(state); }
      if (plan.length) { tubes[plan[0][0]].classList.add('hint-from'); tubes[plan[0][1]].classList.add('hint-to'); }
    }
  }
  const paintCount = () => { moveTxt.textContent = '👣 ' + L(`Movimientos: ${count}`, `Moviments: ${count}`, `Moves: ${count}`) + ' · ' + L(`Partida ${gameNo + 1} de ${TOTAL}`, `Partida ${gameNo + 1} de ${TOTAL}`, `Game ${gameNo + 1} of ${TOTAL}`); };

  // ---- coger, mover, soltar
  async function pick(i) {
    if (!state[i].length || full(state[i])) { pop(); shake(i); toast(full(state[i]) ? '✅ ' + L('Este bote ya está completo.', 'Aquest pot ja és complet.', 'This jar is already complete.') : L('Este bote está vacío.', 'Aquest pot és buit.', 'This jar is empty.'), 2200); return false; }
    sel = i; pop(); paintTubes(); await fly(top(i), [liftPos(i)], 220); return true;
  }
  async function putBack() {
    const i = sel; sel = null; if (i == null) return; paintTubes();
    await fly(top(i), [slotPos(i, balls[i].length - 1)], 220);
  }
  async function moveTo(j) {
    const i = sel; if (i == null) return;
    const a = state[i], b = state[j], c = a[a.length - 1];
    if (j === i) return putBack();
    if (b.length >= CAP) { oops(); shake(j); toast('✋ ' + L('Ese bote está lleno (caben 4 bolas).', 'Aquest pot és ple (hi caben 4 boles).', 'That jar is full (4 baubles fit).'), 2400); return putBack(); }
    busyAnim = true; sel = null;
    history.push(state.map(t => t.slice()));
    const e = balls[i].pop(); state[i].pop(); state[j].push(c); balls[j].push(e);
    count++; paintCount();
    if (plan && plan.length && plan[0][0] === i && plan[0][1] === j) { const rest = plan.slice(1); rest.at = key(state); plan = rest; } else plan = null;
    await fly(e, [liftPos(j), slotPos(j, balls[j].length - 1)], 420);
    glassClink(); e.classList.remove('land'); void e.offsetWidth; e.classList.add('land');
    paintTubes(); busyAnim = false;
    if (full(state[j])) { chime(); sparkleTube(j); }
    if (solved(state)) win();
    else if (!movesFree(state).length) stuck();
  }
  // sin movimientos posibles: se avisa y se ofrece deshacer o empezar de nuevo
  async function stuck() {
    oops();
    const r = await popup(el('div', { class: 'ttt-info' }, el('div', { class: 'ttt-info-ico' }, '🎄'),
      el('h2', {}, L('¡Uy! No quedan movimientos', 'Ui! No queden moviments', 'Oops! No moves left')),
      el('p', {}, L('Ninguna bola se puede mover a otro bote. Puedes deshacer los últimos movimientos o empezar la partida de nuevo.', 'Cap bola es pot moure a un altre pot. Pots desfer els últims moviments o tornar a començar la partida.', 'No bauble can move to another jar. You can undo your last moves or start the game again.'))),
      { cls: 'small ttt-info-pop', buttons: [{ label: '↩️ ' + L('Deshacer', 'Desfer', 'Undo'), value: 'undo', cls: 'btn-ghost' }, { label: '🔄 ' + L('Empezar de nuevo', 'Tornar a començar', 'Start again'), value: 'restart' }] });
    if (r === 'restart') restart(); else { undo(); if (!movesFree(state).length) undo(); }
  }
  function shake(i) { tubes[i].classList.remove('nope'); void tubes[i].offsetWidth; tubes[i].classList.add('nope'); }
  function sparkleTube(j) {
    for (let k = 0; k < 6; k++) {
      const s = el('i', { class: 'bs-spark', style: `left:${tubeX(j) + (Math.random() - .5) * G.tw}px;top:${G.top + Math.random() * G.th}px;animation-delay:${k * .08}s` }, '✦');
      stage.append(s); setTimeout(() => s.remove(), 1300);
    }
  }
  const tubeAt = x => { let best = null, bd = 1e9; state.forEach((_, i) => { const d = Math.abs(tubeX(i) - x); if (d < bd) { bd = d; best = i; } }); return bd < G.tw / 2 + G.gap ? best : null; };
  const local = e => { const r = stage.getBoundingClientRect(), s = r.width / stage.offsetWidth || 1; return [(e.clientX - r.left) / s, (e.clientY - r.top) / s]; };

  let down = null;
  stage.addEventListener('pointerdown', async e => {
    if (done || busyAnim) return; e.preventDefault(); unlockAudio();
    const [x, y] = local(e), i = tubeAt(x); if (i == null) return;
    try { stage.setPointerCapture(e.pointerId); } catch {}
    if (sel != null) { down = { id: e.pointerId, target: true }; return; }
    down = { id: e.pointerId, x, y, drag: false, from: i };
    await pick(i); if (sel !== i) down = null;
  });
  stage.addEventListener('pointermove', e => {
    if (!down || down.target || e.pointerId !== down.id || sel == null) return;
    const [x, y] = local(e);
    if (!down.drag && Math.hypot(x - down.x, y - down.y) > 10) { down.drag = true; top(sel).classList.add('drag'); }
    if (down.drag) setXY(top(sel), [x - G.b / 2, y - G.b * 1.1]);
  });
  const up = e => {
    if (!down || e.pointerId !== down.id) return;
    const d = down; down = null; const [x] = local(e), j = tubeAt(x);
    if (d.target) { if (j == null) putBack(); else moveTo(j); return; }
    if (d.drag) { top(sel)?.classList.remove('drag'); if (j == null || j === sel) putBack(); else moveTo(j); }
  };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', e => { if (down?.drag) { top(sel)?.classList.remove('drag'); putBack(); } down = null; });

  function undo() {
    if (done || busyAnim || !history.length) { pop(); return; }
    state = history.pop(); sel = null; build();
  }
  function restart() { if (busyAnim) return; state = first.map(t => t.slice()); history = []; count = 0; sel = null; done = false; paintCount(); build(); }

  // ---- ayuda
  async function help() {
    unlockAudio(); if (done) return;
    if (!helping) {
      const ok = await popup(el('div', { class: 'ttt-info' }, el('div', { class: 'ttt-info-ico' }, '🆘'),
        el('h2', {}, L('¿Seguro?', 'Segur?', 'Are you sure?')),
        el('p', {}, L('Este botón es solo para quien NO consigue ordenar las bolas. ¡Inténtalo un poquito más antes de usarlo! 😉', 'Aquest botó és només per a qui NO aconsegueix ordenar les boles. Intenta-ho una miqueta més abans de fer-lo servir! 😉', 'This button is only for people who CANNOT sort the baubles. Try a little longer first! 😉'))),
        { cls: 'small ttt-info-pop', buttons: [{ label: L('Seguir intentándolo', 'Continuar intentant-ho', 'Keep trying'), value: false }, { label: L('Necesito ayuda', 'Necessito ajuda', 'I need help'), value: true, cls: 'btn-ghost' }] });
      if (!ok) return;
      helping = true;
      helpBtn.textContent = '💡 ' + L('¿Qué muevo ahora?', 'Què moc ara?', 'What do I move now?');
      popup(el('div', { class: 'ttt-info' }, el('div', { class: 'ttt-info-ico' }, '💡'), el('h2', {}, L('¡Te ayudo!', 'T’ajudo!', 'Here’s some help!')),
        el('p', {}, L('Ahora, en cada jugada, brilla en dorado el bote de donde tienes que sacar la bola y en verde el bote donde la tienes que dejar.', 'Ara, a cada jugada, brilla en daurat el pot d’on has de treure la bola i en verd el pot on l’has de deixar.', 'Now, on every move, the jar to take from shines gold and the jar to put it in shines green.'))),
        { cls: 'small ttt-info-pop', buttons: [{ label: L('¡Vamos!', 'Som-hi!', 'Let’s go!'), value: true }] });
    }
    if (sel != null) await putBack();
    // si se ha quedado atascado, deshacer hasta que vuelva a tener solución
    let back = 0;
    while (!solveAny(state) && history.length) { state = history.pop(); back++; }
    if (back) { build(); toast('↩️ ' + L(`Así no se podía acabar: he deshecho ${back} movimiento${back > 1 ? 's' : ''}.`, `Així no es podia acabar: he desfet ${back} moviment${back > 1 ? 's' : ''}.`, `That couldn’t be finished: I undid ${back} move${back > 1 ? 's' : ''}.`), 4000); }
    chime(); paintTubes();
  }

  // ---- ¡conseguido!
  let music = null, iv = null;
  ctx.cleanup = () => { clearInterval(iv); try { music?.stop(1); } catch {} music = null; };
  async function win() {
    done = true; paintTubes(); board.classList.add('solved');
    if (!ctx.prev && !win.sent) { win.sent = true; ctx.submit({ answer: '🎄 ' + L(`Bolas ordenadas en ${count} movimientos`, `Boles ordenades en ${count} moviments`, `Baubles sorted in ${count} moves`), status: 'correct' }); }
    snow.replaceChildren(...Array.from({ length: 26 }, () => el('i', { style: `left:${Math.random() * 100}%;--d:${4 + Math.random() * 5}s;--dl:${-Math.random() * 8}s;--s:${8 + Math.random() * 10}px;--x:${(Math.random() - .5) * 60}px` }, '❄')));
    state.forEach((t, j) => t.length && setTimeout(() => sparkleTube(j), j * 180));
    fanfare(); confetti(240); setTimeout(() => confetti(160), 900);
    setTimeout(() => { if (done && board.isConnected) try { music = christmasSong(); } catch {} }, 1700);
    const again = el('button', { class: 'btn btn-big no-delay' }, '🔄 ' + L('Volver a jugar', 'Tornar a jugar', 'Play again'));
    const out = el('button', { class: 'btn btn-ghost btn-big no-delay' }, '🎁 ' + L('Continuar', 'Continuar', 'Continue'));
    msg.replaceChildren(el('div', { class: 'sp-msg-title' }, L('¡Enhorabuena!', 'Enhorabona!', 'Congratulations!') + ' ✨'),
      el('p', {}, L(`¡Has ordenado todas las bolas en ${count} movimientos!`, `Has ordenat totes les boles en ${count} moviments!`, `You sorted all the baubles in ${count} moves!`)),
      el('div', { class: 'ttt-fx-btns' }, again, out));
    msg.classList.add('on'); helpBtn.style.display = 'none'; undoBtn.style.visibility = resetBtn.style.visibility = 'hidden';
    setTimeout(() => msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 700);
    // otra partida = la siguiente de las 25 (se vuelve a montar el juego entero)
    again.onclick = () => { ctx.cleanup(); removeEventListener('resize', relayout); body.replaceChildren(); render(body, ctx); body.scrollTop = 0; };
    out.onclick = () => { ctx.cleanup(); ctx.finish(); };
  }

  const relayout = () => { if (!busyAnim && stage.isConnected) { measure(); place(); } };
  addEventListener('resize', relayout);
  try { new ResizeObserver(relayout).observe(stage); } catch {}
  restart();
  requestAnimationFrame(relayout); setTimeout(relayout, 400);
}
