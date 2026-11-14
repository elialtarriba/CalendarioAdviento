// Día 11: el laberinto de los regalos perdidos. Se elige nivel (fácil, intermedio o experto). Se pulsa el
// Papá Noel y, sin levantar el dedo, se pinta el camino (con una lupa grande encima del dedo), o se usan las
// 4 flechas. Al llegar a un regalo el camino se engancha y Papá Noel se queda allí. Con el dedo, si se atraviesa
// una pared o se levanta antes de llegar, el camino se borra y se vuelve a empezar desde Papá Noel; con las
// flechas, la pared solo frena. Con los 3 regalos, Papá Noel tiene que llegar al trineo.
// Se cuenta el tiempo. Solo cuenta la PRIMERA partida (se guarda como respuesta del día y se puede compartir).
import { el, sleep, confetti, toast, popup } from './fx.js?v=19.2';
import { getLang } from './i18n.js?v=19.2';
import { pop, chime, fanfare, unlockAudio, snapSound, oops, jingle, christmasSong } from './sound.js?v=19.2';
import { nextGame, rng, TOTAL } from './games25.js?v=19.2';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const GIFTS = ['ilu-gl.webp', 'ilu-gr.webp', 'ilu-4.webp'];
const LEVELS = {
  f: { C: 9, R: 11, cut: 9, key: 'maze', seed: 0, ico: '🌟', name: () => L('Fácil', 'Fàcil', 'Easy'), sub: () => L('Laberinto pequeño, con varios caminos', 'Laberint petit, amb diversos camins', 'Small maze with several paths') },
  m: { C: 11, R: 14, cut: 4, key: 'maze_m', seed: 50000, ico: '🌟🌟', name: () => L('Intermedio', 'Intermedi', 'Medium'), sub: () => L('Más grande y con menos atajos', 'Més gran i amb menys dreceres', 'Bigger, with fewer shortcuts') },
  x: { C: 13, R: 17, cut: 0, key: 'maze_x', seed: 90000, ico: '🌟🌟🌟', name: () => L('Experto', 'Expert', 'Expert'), sub: () => L('Enorme y con un solo camino bueno', 'Enorme i amb un sol camí bo', 'Huge, with only one right way') },
};
const fmt = ms => { const s = Math.floor(ms / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };

// ---- laberinto (siempre el mismo para la misma partida y nivel)
function makeMaze(g, lv) {
  const { C, R } = lv;
  const rnd = rng(1100 + lv.seed + g * 7919);
  // walls[r][c] = { r: pared a la derecha, b: pared abajo }
  const W = Array.from({ length: R }, () => Array.from({ length: C }, () => ({ r: true, b: true })));
  const seen = Array.from({ length: R }, () => Array(C).fill(false));
  const stack = [[0, 0]]; seen[0][0] = true;
  while (stack.length) {
    const [r, c] = stack[stack.length - 1];
    const nb = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < R && b < C && !seen[a][b]);
    if (!nb.length) { stack.pop(); continue; }
    const [a, b] = nb[Math.floor(rnd() * nb.length)];
    if (a === r) W[r][Math.min(c, b)].r = false; else W[Math.min(r, a)][c].b = false;
    seen[a][b] = true; stack.push([a, b]);
  }
  // unas cuantas paredes de menos (según el nivel): hay más de un camino, pero sigue habiendo callejones
  for (let k = 0; k < lv.cut; k++) { const r = Math.floor(rnd() * R), c = Math.floor(rnd() * C);
    if (rnd() < .5 && c < C - 1) W[r][c].r = false; else if (r < R - 1) W[r][c].b = false; }
  const open = (r, c, a, b) => { if (a < 0 || b < 0 || a >= R || b >= C) return false;
    if (a === r && Math.abs(b - c) === 1) return !W[r][Math.min(c, b)].r;
    if (b === c && Math.abs(a - r) === 1) return !W[Math.min(r, a)][c].b; return false; };
  const dist = (sr, sc) => { const d = Array.from({ length: R }, () => Array(C).fill(-1)); const q = [[sr, sc]]; d[sr][sc] = 0;
    while (q.length) { const [r, c] = q.shift(); for (const [a, b] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]) if (open(r, c, a, b) && d[a][b] < 0) { d[a][b] = d[r][c] + 1; q.push([a, b]); } } return d; };
  const d0 = dist(0, 0);
  let sleigh = [0, 0]; d0.forEach((row, r) => row.forEach((v, c) => { if (v > d0[sleigh[0]][sleigh[1]]) sleigh = [r, c]; }));
  const ends = []; for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const n = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([a, b]) => open(r, c, a, b)).length;
    if (n === 1 && !(r === 0 && c === 0) && !(r === sleigh[0] && c === sleigh[1]) && d0[r][c] > 4) ends.push([r, c]); }
  const far = (p, q) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]);
  let best = null, bs = -1;
  for (let t = 0; t < 400; t++) {
    const pick = []; const pool = ends.slice(); while (pick.length < 3 && pool.length) pick.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    if (pick.length < 3) break;
    const s = Math.min(far(pick[0], pick[1]), far(pick[0], pick[2]), far(pick[1], pick[2]), ...pick.map(p => far(p, sleigh)), ...pick.map(p => far(p, [0, 0])));
    if (s > bs) { bs = s; best = pick; }
  }
  if (!best) best = [[R - 1, 0], [0, C - 1], [Math.floor(R / 2), Math.floor(C / 2)]];
  return { W, open, sleigh, gifts: best, C, R };
}

const howtoText = () => [
  L('Pon el dedo sobre Papá Noel y, sin levantarlo, deslízalo por los caminos: se irá pintando. Encima del dedo verás una lupa grande con el camino. También puedes usar las 4 flechas de debajo del laberinto (si las mantienes pulsadas, Papá Noel sigue andando).',
    'Posa el dit sobre el Pare Noel i, sense aixecar-lo, llisca’l pels camins: s’anirà pintant. Damunt del dit veuràs una lupa gran amb el camí. També pots fer servir les 4 fletxes de sota del laberint (si les mantens premudes, el Pare Noel continua caminant).',
    'Put your finger on Santa and, without lifting it, slide along the paths: they get painted. Above your finger you’ll see a big magnifier with the path. You can also use the 4 arrows under the maze (hold them down and Santa keeps walking).'),
  L('Lleva a Papá Noel hasta un regalo: el camino se engancha y Papá Noel se queda allí. Coge los 3 regalos (en el orden que quieras) y después llévalo al trineo. Con el dedo, si atraviesas una pared o lo levantas antes de llegar, el camino se borra y vuelves a empezar desde Papá Noel.',
    'Porta el Pare Noel fins a un regal: el camí s’enganxa i el Pare Noel s’hi queda. Agafa els 3 regals (en l’ordre que vulguis) i després porta’l al trineu. Amb el dit, si travesses una paret o l’aixeques abans d’arribar, el camí s’esborra i tornes a començar des del Pare Noel.',
    'Take Santa to a present: the path sticks and Santa stays there. Collect the 3 presents (in any order) and then take him to the sleigh. With your finger, if you cross a wall or lift it before arriving, the path is erased and you start again from Santa.'),
  L('⏱ El tiempo empieza cuando mueves a Papá Noel. Solo cuenta tu primera partida: ¡esa es la que podrás compartir!',
    '⏱ El temps comença quan mous el Pare Noel. Només compta la teva primera partida: aquesta és la que podràs compartir!',
    '⏱ The clock starts when you move Santa. Only your first game counts: that’s the one you can share!'),
];

export function render(body, ctx, levelId = null) {
  body.style.webkitUserSelect = body.style.userSelect = 'none';
  const firstRes = () => ctx.prev?.extra?.mz || ctx._mzFirst || null;
  const title = el('h2', { class: 'q-title cw-title' }, '🎅 ' + L('Los regalos perdidos', 'Els regals perduts', 'The lost presents') + ' 🎁');
  if (!levelId) return pickLevel(body, ctx, title, firstRes());

  const lv = LEVELS[levelId];
  const gameNo = nextGame(lv.key);
  const M = makeMaze(gameNo, lv);
  const { C, R } = M;
  if (location.search.includes('mztest')) window.__mz = { M, cs: () => cs, st: () => ({ anchor, taken: taken.slice() }), arrow: (a, b) => arrowMove(a, b) };
  body.append(title, el('p', { class: 'cw-gno' }, `${lv.name()} · ` + L(`Partida ${gameNo + 1} de ${TOTAL}`, `Partida ${gameNo + 1} de ${TOTAL}`, `Game ${gameNo + 1} of ${TOTAL}`)));
  const howto = el('div', { class: 'mz-how' }, el('h3', {}, '📖 ' + L('Cómo se juega', 'Com es juga', 'How to play')), ...howtoText().map(t => el('p', {}, t)),
    el('button', { class: 'btn btn-big no-delay', onclick: () => { pop(); over.classList.add('hide'); } }, '▶️ ' + L('Continuar', 'Continuar', 'Continue')));
  const tries = el('span', { class: 'mz-tries' }), got = el('span', { class: 'mz-got' }), clock = el('span', { class: 'mz-clock' }, '⏱ 00:00');
  const helpBtn = el('button', { type: 'button', class: 'mz-helpbtn no-delay', title: L('Cómo se juega', 'Com es juga', 'How to play') }, '📖');
  const hud = el('div', { class: 'mz-hud' }, tries, clock, helpBtn, got);
  const cv = el('canvas', { class: 'mz-cv' });
  const stage = el('div', { class: 'mz-stage' }, cv);
  const over = el('div', { class: 'mz-over hide' }, howto);
  // las 4 flechas (manteniéndolas pulsadas, sigue andando)
  const arrowBtn = (cls, label, dr, dc) => {
    const b = el('button', { type: 'button', class: 'mz-arrow no-delay ' + cls, 'aria-label': cls }, label);
    let iv = null, tm = null;
    const stop = () => { clearTimeout(tm); clearInterval(iv); iv = tm = null; b.classList.remove('on'); };
    b.addEventListener('pointerdown', e => { e.preventDefault(); unlockAudio(); b.classList.add('on'); arrowMove(dr, dc); tm = setTimeout(() => { iv = setInterval(() => arrowMove(dr, dc), 150); }, 380); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, stop));
    return b;
  };
  const pad = el('div', { class: 'mz-pad' }, arrowBtn('up', '▲', -1, 0), arrowBtn('left', '◀', 0, -1), arrowBtn('down', '▼', 1, 0), arrowBtn('right', '▶', 0, 1));
  const board = el('div', { class: 'cw-board mz-board' }, el('div', { class: 'cw-lights' }, ...Array.from({ length: 14 }, (_, i) => el('i', { style: `--i:${i}` }))), hud, stage, pad, over);
  const msg = el('div', { class: 'sp-msg' });
  body.append(el('div', { class: 'cw-wrap mz-wrap' }, board, msg));
  helpBtn.onclick = () => { pop(); over.classList.remove('hide'); };

  // ---- fichas: Papá Noel, regalos y trineo
  const santa = el('div', { class: 'mz-santa' }, el('img', { src: 'santa11.webp', alt: '' }));
  const giftEls = M.gifts.map((p, i) => el('div', { class: 'mz-gift' }, el('img', { src: GIFTS[i], alt: '' })));
  const sleighEl = el('div', { class: 'mz-sleigh' }, el('img', { src: 'trineo11.webp', alt: '' }));
  stage.append(sleighEl, ...giftEls, santa);

  let cs = 30, nTries = 0, anchor = [0, 0], locked = [], active = null, ghosts = [], taken = [false, false, false], done = false, warnedSleigh = false, moving = false;
  // ---- reloj
  let t0 = null, tick = null, elapsed = 0;
  const startClock = () => { if (t0 != null || done) return; t0 = performance.now(); tick = setInterval(() => { elapsed = performance.now() - t0; clock.textContent = '⏱ ' + fmt(elapsed); }, 250); };
  const stopClock = () => { clearInterval(tick); if (t0 != null) elapsed = performance.now() - t0; clock.textContent = '⏱ ' + fmt(elapsed); };
  const paintHud = () => { tries.textContent = '🎅 ' + nTries; got.textContent = `🎁 ${taken.filter(Boolean).length}/3`; };
  paintHud();
  const posEl = (e, [r, c], k = .86) => { const s = cs * k; Object.assign(e.style, { width: s + 'px', height: s + 'px', left: (c * cs + (cs - s) / 2) + 'px', top: (r * cs + (cs - s) / 2) + 'px' }); };
  function fit() {
    if (!stage.isConnected) return;
    const avW = Math.min(board.clientWidth - 20, 620);
    const br = body.getBoundingClientRect(), sr = stage.getBoundingClientRect(), k = br.height / (body.offsetHeight || 1) || 1;
    const top = (sr.top - br.top) / k + body.scrollTop;
    const avH = Math.max(240, body.clientHeight - top - pad.offsetHeight - 40);
    cs = Math.floor(Math.min(avW / C, avH / R, 52));
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = C * cs * dpr; cv.height = R * cs * dpr; cv.style.width = C * cs + 'px'; cv.style.height = R * cs + 'px';
    stage.style.width = C * cs + 'px'; stage.style.height = R * cs + 'px';
    cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!moving) posEl(santa, anchor, .92);
    M.gifts.forEach((p, i) => posEl(giftEls[i], p, .84)); posEl(sleighEl, M.sleigh, .98);
    draw();
  }

  // ---- dibujo
  const ctr = ([r, c]) => [c * cs + cs / 2, r * cs + cs / 2];
  function stroke(g, path, color, width, alpha = 1, glow = 0) {
    if (path.length < 2) return;
    g.save(); g.globalAlpha = alpha; g.lineCap = g.lineJoin = 'round'; g.strokeStyle = color; g.lineWidth = width;
    if (glow) { g.shadowColor = color; g.shadowBlur = glow; }
    g.beginPath(); path.forEach((p, i) => { const [x, y] = ctr(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.restore();
  }
  function draw() {
    const g = cv.getContext('2d'); g.clearRect(0, 0, C * cs, R * cs);
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { g.fillStyle = (r + c) % 2 ? '#fbf3e2' : '#f4e7cc'; g.fillRect(c * cs, r * cs, cs, cs); }
    locked.forEach(p => { stroke(g, p, '#b8862b', cs * .5, .35); stroke(g, p, '#f2c14e', cs * .32, 1, 8); });
    ghosts.forEach(gh => stroke(g, gh.path, '#c8102e', cs * .32, gh.a));
    if (active) {
      stroke(g, active, '#7a1020', cs * .4, .35); stroke(g, active, '#e63946', cs * .28, 1, 6);
      if (active.length > 1) { const [x, y] = ctr(active[active.length - 1]); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, cs * .2, 0, 7); g.fill(); g.fillStyle = '#e63946'; g.beginPath(); g.arc(x, y, cs * .13, 0, 7); g.fill(); }
    }
    g.lineCap = 'round';
    const wall = (x1, y1, x2, y2) => { g.strokeStyle = '#14532d'; g.lineWidth = Math.max(3, cs * .16); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      g.strokeStyle = '#ffffffcc'; g.lineWidth = Math.max(1, cs * .05); g.beginPath(); g.moveTo(x1, y1 - cs * .04); g.lineTo(x2, y2 - cs * .04); g.stroke(); };
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      if (M.W[r][c].r && c < C - 1) wall((c + 1) * cs, r * cs, (c + 1) * cs, (r + 1) * cs);
      if (M.W[r][c].b && r < R - 1) wall(c * cs, (r + 1) * cs, (c + 1) * cs, (r + 1) * cs);
    }
    g.strokeStyle = '#14532d'; g.lineWidth = Math.max(4, cs * .2); g.strokeRect(1, 1, C * cs - 2, R * cs - 2);
  }
  let fading = false;
  function fadeLoop() {
    if (fading) return; fading = true;
    (function step() {
      ghosts.forEach(gh => gh.a -= .045); ghosts = ghosts.filter(gh => gh.a > 0); draw();
      if (ghosts.length && stage.isConnected) requestAnimationFrame(step); else fading = false;
    })();
  }
  function cut(sound = true) {
    hideLoupe();
    if (!active) return;
    if (active.length > 1) ghosts.push({ path: active, a: 1 }); active = null; fadeLoop();
    if (sound) oops();
    santa.classList.remove('drag');
  }
  const begin = () => { active = [anchor.slice()]; nTries++; paintHud(); santa.classList.add('drag'); startClock(); };

  // ---- tocar y deslizar
  const cellAt = e => { const r = stage.getBoundingClientRect(), k = r.width / (C * cs) || 1;
    return [Math.floor((e.clientY - r.top) / k / cs), Math.floor((e.clientX - r.left) / k / cs)]; };
  const same = (a, b) => a[0] === b[0] && a[1] === b[1];
  let pid = null;
  // lupa grande encima del dedo
  let loupe = null;
  function showLoupe(e) {
    if (e.pointerType === 'mouse') return;
    const LS = Math.round(Math.min(230, innerWidth * .58)), ZOOM = 1.7;
    if (!loupe) { loupe = el('canvas', { class: 'mz-loupe' }); document.body.append(loupe); }
    const dpr = Math.min(2, devicePixelRatio || 1);
    if (loupe.width !== LS * dpr) { loupe.width = loupe.height = LS * dpr; loupe.style.width = loupe.style.height = LS + 'px'; }
    const r = stage.getBoundingClientRect(), k = r.width / (C * cs) || 1;
    const x = (e.clientX - r.left) / k, y = (e.clientY - r.top) / k;
    const half = LS / 2 / ZOOM, sc = LS / (2 * half);
    const g = loupe.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, LS, LS); g.save(); g.beginPath(); g.arc(LS / 2, LS / 2, LS / 2 - 1, 0, 7); g.clip();
    g.fillStyle = '#f4e7cc'; g.fillRect(0, 0, LS, LS);
    const cdpr = cv.width / (C * cs);
    g.drawImage(cv, (x - half) * cdpr, (y - half) * cdpr, 2 * half * cdpr, 2 * half * cdpr, 0, 0, LS, LS);
    const put = (img, [rr, cc], f) => { if (!img?.complete) return; const s2 = cs * f * sc; const cx = (cc * cs + cs / 2 - (x - half)) * sc, cy = (rr * cs + cs / 2 - (y - half)) * sc; g.drawImage(img, cx - s2 / 2, cy - s2 / 2, s2, s2); };
    put(sleighEl.firstChild, M.sleigh, .98); M.gifts.forEach((q, i) => { if (!taken[i]) put(giftEls[i].firstChild, q, .84); }); put(santa.firstChild, anchor, .92);
    g.fillStyle = '#e63946'; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(LS / 2, LS / 2, 8, 0, 7); g.fill(); g.stroke();
    g.restore();
    let L0 = e.clientX - LS / 2, T0 = e.clientY - LS - 70;
    if (T0 < 6) { T0 = Math.max(6, e.clientY - LS / 2); L0 = e.clientX + (e.clientX < innerWidth / 2 ? 60 : -60 - LS); }
    loupe.style.left = Math.max(4, Math.min(innerWidth - LS - 4, L0)) + 'px'; loupe.style.top = T0 + 'px';
  }
  const hideLoupe = () => { loupe?.remove(); loupe = null; };
  stage.addEventListener('pointerdown', e => {
    if (done || moving) return; unlockAudio();
    const p = cellAt(e);
    if (!same(p, anchor)) { toast('🎅 ' + L('Pon el dedo sobre Papá Noel para empezar el camino, o usa las flechas.', 'Posa el dit sobre el Pare Noel per començar el camí, o fes servir les fletxes.', 'Put your finger on Santa to start the path, or use the arrows.'), 2400); santa.classList.remove('nudge'); void santa.offsetWidth; santa.classList.add('nudge'); return; }
    e.preventDefault(); try { stage.setPointerCapture(e.pointerId); } catch {}
    pid = e.pointerId; begin(); pop(); draw(); showLoupe(e);
  });
  stage.addEventListener('pointermove', e => {
    if (!active || e.pointerId !== pid) return;
    move(e); if (active) showLoupe(e); else hideLoupe();
  });
  function move(e) {
    const p = cellAt(e), last = active[active.length - 1];
    if (same(p, last)) return;
    if (active.length > 1 && same(p, active[active.length - 2])) { active.pop(); draw(); return; }
    const dr = p[0] - last[0], dc = p[1] - last[1];
    if (Math.abs(dr) + Math.abs(dc) !== 1) {
      if (dr && dc) return;
      const n = Math.abs(dr + dc), sr = Math.sign(dr), sc = Math.sign(dc); let cur = last;
      for (let i = 0; i < n; i++) { const nx = [cur[0] + sr, cur[1] + sc]; if (!M.open(cur[0], cur[1], nx[0], nx[1])) return cut(); if (step(nx)) return; cur = nx; }
      return;
    }
    if (!M.open(last[0], last[1], p[0], p[1])) return cut();
    step(p);
  }
  // ---- con las flechas: la pared solo frena (no borra el camino)
  function arrowMove(dr, dc) {
    if (done || moving) return;
    if (!active) { begin(); pid = null; }
    const last = active[active.length - 1], p = [last[0] + dr, last[1] + dc];
    if (!M.open(last[0], last[1], p[0], p[1])) { stage.classList.remove('bump'); void stage.offsetWidth; stage.classList.add('bump'); pop(); return; }
    step(p);
  }
  function step(p) {
    if (active.some(q => same(q, p))) { while (!same(active[active.length - 1], p)) active.pop(); draw(); return false; }
    active.push(p); draw();
    const gi = M.gifts.findIndex((q, i) => !taken[i] && same(q, p));
    if (gi >= 0) { reach(p, gi); return true; }
    if (same(p, M.sleigh)) {
      if (taken.every(Boolean)) { reach(p, -1); return true; }
      if (!warnedSleigh) { warnedSleigh = true; toast('🛷 ' + L('¡Primero los 3 regalos!', 'Primer els 3 regals!', 'First the 3 presents!'), 2200); }
    }
    return false;
  }
  const up = e => { if (!active || e.pointerId !== pid) return; pid = null; cut(active.length > 1); };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);

  async function reach(p, gi) {
    const path = active; active = null; pid = null; locked.push(path); santa.classList.remove('drag'); hideLoupe(); moving = true;
    snapSound(); chime(); draw();
    for (let i = 1; i < path.length; i++) { posEl(santa, path[i], .92); await sleep(Math.max(18, 160 / path.length)); }
    anchor = p.slice(); moving = false;
    if (gi >= 0) {
      taken[gi] = true; giftEls[gi].classList.add('got'); paintHud();
      const r = giftEls[gi].getBoundingClientRect(); confetti(60, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
      if (taken.every(Boolean)) { sleighEl.classList.add('ready'); toast('🛷 ' + L('¡Ya tienes los 3 regalos! Ahora lleva a Papá Noel al trineo.', 'Ja tens els 3 regals! Ara porta el Pare Noel al trineu.', 'You have the 3 presents! Now take Santa to the sleigh.'), 3200); }
    } else win();
  }

  // ---- ¡al trineo!
  let music = null;
  ctx.cleanup = () => { hideLoupe(); clearInterval(tick); try { music?.stop(1); } catch {} };
  async function win() {
    done = true; stopClock();
    const res = { time: Math.round(elapsed), level: levelId, tries: nTries, at: Date.now() };
    const counts = !ctx.prev && !ctx._mzFirst; // solo la primera partida (la que se guarda como respuesta del día)
    if (counts) {
      ctx._mzFirst = res;
      ctx.submit({ answer: '🛷 ' + L(`Laberinto ${lv.name()} en ${fmt(res.time)} (${nTries} intentos)`, `Laberint ${lv.name()} en ${fmt(res.time)} (${nTries} intents)`, `Maze ${lv.name()} in ${fmt(res.time)} (${nTries} tries)`), status: 'correct', extra: { mz: res } });
    }
    santa.classList.add('in-sleigh'); sleighEl.classList.add('go');
    try { jingle(2); } catch {}
    const fly = el('div', { class: 'mz-fly' }, el('div', { class: 'mz-fly-ride' }, el('img', { class: 'mz-fly-sleigh', src: 'trineo11.webp', alt: '' }), el('img', { class: 'mz-fly-santa', src: 'santa11.webp', alt: '' }),
      ...GIFTS.map((g, i) => el('img', { class: 'mz-fly-gift g' + i, src: g, alt: '' }))),
      el('div', { class: 'mz-fly-trail' }));
    document.body.append(fly);
    const trail = fly.querySelector('.mz-fly-trail');
    const iv = setInterval(() => { const s = el('i', { style: `left:${Math.random() * 100}%;top:${20 + Math.random() * 50}%` }, '✦'); trail.append(s); setTimeout(() => s.remove(), 1500); }, 70);
    await sleep(3200); clearInterval(iv); fly.remove();
    fanfare(); confetti(220); setTimeout(() => { try { music = christmasSong(); } catch {} }, 1500);
    const first = firstRes();
    const again = el('button', { class: 'btn btn-big no-delay' }, '🔄 ' + L('Jugar otra partida', 'Jugar una altra partida', 'Play another game'));
    const share = el('button', { class: 'btn btn-big no-delay mz-share' }, '📲 ' + L('Compartir por WhatsApp', 'Compartir per WhatsApp', 'Share on WhatsApp'));
    const out = el('button', { class: 'btn btn-ghost btn-big no-delay' }, '🎁 ' + L('Continuar', 'Continuar', 'Continue'));
    msg.replaceChildren(el('div', { class: 'sp-msg-title' }, L('¡Buen viaje, Papá Noel!', 'Bon viatge, Pare Noel!', 'Safe trip, Santa!')),
      el('div', { class: 'mz-result' },
        el('div', {}, el('small', {}, L('Tiempo', 'Temps', 'Time')), el('b', {}, fmt(res.time))),
        el('div', {}, el('small', {}, L('Nivel', 'Nivell', 'Level')), el('b', {}, lv.name())),
        el('div', {}, el('small', {}, L('Intentos', 'Intents', 'Tries')), el('b', {}, String(nTries)))),
      first ? el('p', {}, counts ? L('¡Esta es tu partida buena! Es la que cuenta y la que puedes compartir.', 'Aquesta és la teva partida bona! És la que compta i la que pots compartir.', 'This is your official game! It’s the one that counts and the one you can share.')
        : L(`Solo cuenta la primera partida: ${LEVELS[first.level]?.name() || ''} en ${fmt(first.time)}. Es la que se comparte.`, `Només compta la primera partida: ${LEVELS[first.level]?.name() || ''} en ${fmt(first.time)}. És la que es comparteix.`, `Only the first game counts: ${LEVELS[first.level]?.name() || ''} in ${fmt(first.time)}. That’s the one shared.`)) : null,
      el('div', { class: 'ttt-fx-btns' }, first ? share : null, again, out));
    msg.classList.add('on'); setTimeout(() => msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300);
    share.onclick = () => shareResult(first, ctx);
    again.onclick = () => { ctx.cleanup(); body.replaceChildren(); render(body, ctx); };
    out.onclick = () => { ctx.cleanup(); ctx.finish(); };
  }

  fit(); requestAnimationFrame(fit); setTimeout(fit, 350); setTimeout(fit, 1600);
  addEventListener('resize', fit);
}

// ---- pantalla de inicio: explicación y elegir nivel
function pickLevel(body, ctx, title, first) {
  const lvBtn = id => { const lv = LEVELS[id];
    return el('button', { type: 'button', class: 'mz-lv mz-lv-' + id + ' no-delay', onclick: () => { unlockAudio(); pop(); body.replaceChildren(); render(body, ctx, id); } },
      el('span', { class: 'mz-lv-stars' }, lv.ico), el('span', { class: 'mz-lv-txt' }, el('b', {}, lv.name()), el('small', {}, lv.sub()))); };
  body.append(...[title,
    el('h3', { class: 'mz-lv-h' }, L('Elige el nivel', 'Tria el nivell', 'Choose the level')),
    el('div', { class: 'mz-levels' }, lvBtn('f'), lvBtn('m'), lvBtn('x')),
    first ? el('div', { class: 'mz-firstbox' }, el('p', {}, L('Tu partida buena: ', 'La teva partida bona: ', 'Your official game: '), el('b', {}, `${LEVELS[first.level]?.name() || ''} · ${fmt(first.time)}`)),
      el('button', { type: 'button', class: 'btn no-delay mz-share', onclick: () => shareResult(first, ctx) }, '📲 ' + L('Compartir por WhatsApp', 'Compartir per WhatsApp', 'Share on WhatsApp'))) : null,
    el('div', { class: 'mz-how mz-intro' }, el('h3', {}, '📖 ' + L('Cómo se juega', 'Com es juga', 'How to play')), ...howtoText().map(t => el('p', {}, t)))].filter(Boolean));
}

// ---- imagen bonita del resultado para compartir
const loadImg = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
async function resultImage(res, name) {
  const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  try { await Promise.all(['700 80px "Mountains of Christmas"', '800 60px Montserrat', '600 40px Montserrat'].map(f => document.fonts.load(f))); } catch {}
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#7a1020'); bg.addColorStop(.55, '#b3122e'); bg.addColorStop(1, '#14532d');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // nieve
  const rnd = rng(42); g.fillStyle = '#ffffff';
  for (let i = 0; i < 160; i++) { g.globalAlpha = .25 + rnd() * .6; g.beginPath(); g.arc(rnd() * W, rnd() * H, 2 + rnd() * 6, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  // marco dorado
  g.strokeStyle = '#f2c14e'; g.lineWidth = 14; g.strokeRect(36, 36, W - 72, H - 72);
  g.strokeStyle = '#fff6d6'; g.lineWidth = 3; g.strokeRect(58, 58, W - 116, H - 116);
  // guirnalda de luces
  for (let i = 0; i < 15; i++) { const x = 90 + i * 64, y = 92 + Math.sin(i * .9) * 10; g.fillStyle = ['#ffd24a', '#4ade80', '#ff4d6d', '#7dd3fc'][i % 4]; g.shadowColor = g.fillStyle; g.shadowBlur = 18; g.beginPath(); g.ellipse(x, y, 11, 15, 0, 0, 7); g.fill(); }
  g.shadowBlur = 0;
  g.textAlign = 'center'; g.fillStyle = '#fff6d6';
  g.font = '700 92px "Mountains of Christmas", cursive'; g.fillText(L('Los regalos perdidos', 'Els regals perduts', 'The lost presents'), W / 2, 230);
  const [santa, sleigh, ...gifts] = await Promise.all(['santa11.webp', 'trineo11.webp', ...GIFTS].map(loadImg));
  if (sleigh) g.drawImage(sleigh, W / 2 - 230, 270, 460, 300);
  if (santa) { g.save(); g.beginPath(); g.arc(W / 2 - 10, 330, 85, 0, 7); g.closePath(); g.fillStyle = '#fff4dc'; g.fill(); g.clip(); g.drawImage(santa, W / 2 - 105, 235, 190, 190); g.restore(); g.strokeStyle = '#f2c14e'; g.lineWidth = 8; g.beginPath(); g.arc(W / 2 - 10, 330, 85, 0, 7); g.stroke(); }
  gifts.forEach((im, i) => { if (im) g.drawImage(im, 170 + i * 300, 560, 140, 140); });
  // tarjeta con el resultado
  g.fillStyle = '#fffaf0'; g.strokeStyle = '#f2c14e'; g.lineWidth = 8;
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  rr(120, 730, W - 240, 470, 46); g.fill(); g.stroke();
  g.fillStyle = '#7a1020'; g.font = '700 84px "Mountains of Christmas", cursive'; g.fillText(name || L('¡Lo he conseguido!', 'Ho he aconseguit!', 'I did it!'), W / 2, 830);
  g.fillStyle = '#14532d'; g.font = '600 40px Montserrat, sans-serif';
  g.fillText(L('ha encontrado los 3 regalos y ha llevado', 'ha trobat els 3 regals i ha portat', 'found the 3 presents and took'), W / 2, 895);
  g.fillText(L('a Papá Noel hasta su trineo', 'el Pare Noel fins al seu trineu', 'Santa to his sleigh'), W / 2, 945);
  const cols = [[L('TIEMPO', 'TEMPS', 'TIME'), fmt(res.time)], [L('NIVEL', 'NIVELL', 'LEVEL'), LEVELS[res.level]?.name() || ''], [L('INTENTOS', 'INTENTS', 'TRIES'), String(res.tries)]];
  cols.forEach(([k, v], i) => { const x = 270 + i * 270; g.fillStyle = '#b8862b'; g.font = '700 30px Montserrat, sans-serif'; g.fillText(k, x, 1035); g.fillStyle = '#b3122e'; g.font = '800 64px Montserrat, sans-serif'; g.fillText(v, x, 1110); });
  g.fillStyle = '#fff6d6'; g.font = '700 46px "Mountains of Christmas", cursive';
  g.fillText(L('Calendario de Adviento · Día 11', 'Calendari d’Advent · Dia 11', 'Advent Calendar · Day 11'), W / 2, 1270);
  return await new Promise(r => cv.toBlob(r, 'image/png'));
}
async function shareResult(res, ctx) {
  if (!res) return;
  const name = (ctx.profile?.name || '').trim();
  const text = L(`🎅 ¡He encontrado los 3 regalos perdidos de Papá Noel! Nivel ${LEVELS[res.level]?.name()} en ${fmt(res.time)}.`, `🎅 He trobat els 3 regals perduts del Pare Noel! Nivell ${LEVELS[res.level]?.name()} en ${fmt(res.time)}.`, `🎅 I found Santa’s 3 lost presents! ${LEVELS[res.level]?.name()} level in ${fmt(res.time)}.`) + (name ? `\n— ${name}` : '');
  toast('✨ ' + L('Preparando la foto…', 'Preparant la foto…', 'Preparing the picture…'), 1500);
  const blob = await resultImage(res, name).catch(() => null);
  const file = blob ? new File([blob], 'laberinto-navidad.png', { type: 'image/png' }) : null;
  const url = blob ? URL.createObjectURL(blob) : null;
  const canFiles = !!(file && navigator.canShare && navigator.canShare({ files: [file] }));
  const send = el('button', { type: 'button', class: 'btn btn-big no-delay', onclick: async () => {
    try { if (canFiles) { await navigator.share({ files: [file], text }); return; } } catch (e) { if (e?.name === 'AbortError') return; }
    if (url) { const a = el('a', { href: url, download: 'laberinto-navidad.png' }); document.body.append(a); a.click(); a.remove(); }
    location.href = 'whatsapp://send?text=' + encodeURIComponent(text);
  } }, '📲 ' + L('Enviar por WhatsApp', 'Enviar per WhatsApp', 'Send by WhatsApp'));
  await popup(el('div', { class: 'g23-sharebox' },
    el('h2', {}, L('Tu foto para el grupo', 'La teva foto per al grup', 'Your picture for the group')),
    url ? el('img', { class: 'g23-shareimg', src: url, alt: '' }) : el('p', {}, '⚠️'),
    el('p', { class: 'muted' }, canFiles ? L('Pulsa el botón y elige WhatsApp y el grupo.', 'Prem el botó i tria WhatsApp i el grup.', 'Tap the button and choose WhatsApp and the group.')
      : L('Se guardará la foto y se abrirá WhatsApp.', 'Es guardarà la foto i s’obrirà WhatsApp.', 'The picture will be saved and WhatsApp will open.')), send),
    { cls: 'small g23-sharepop', buttons: [{ label: L('Cerrar', 'Tancar', 'Close'), value: false, cls: 'btn-ghost' }] });
  if (url) setTimeout(() => URL.revokeObjectURL(url), 60000);
}
