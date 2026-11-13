// Día 11: el laberinto de los regalos perdidos. Se pulsa el Papá Noel y, sin levantar el dedo, se pinta
// el camino. Al llegar a un regalo el camino se engancha (con sonido) y Papá Noel se queda allí. Si el dedo
// atraviesa una pared o se levanta antes de llegar, el camino se borra poco a poco y se vuelve a empezar
// desde Papá Noel. Cada vez que se desliza es un intento. Con los 3 regalos, Papá Noel tiene que llegar al trineo.
import { el, sleep, confetti, toast } from './fx.js?v=18.5';
import { getLang } from './i18n.js?v=18.5';
import { pop, chime, fanfare, unlockAudio, snapSound, oops, jingle, christmasSong } from './sound.js?v=18.5';
import { nextGame, rng, TOTAL } from './games25.js?v=18.5';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const C = 9, R = 11; // columnas y filas
const GIFTS = ['ilu-gl.webp', 'ilu-gr.webp', 'ilu-4.webp'];

// ---- laberinto (siempre el mismo para la misma partida)
function makeMaze(g) {
  const rnd = rng(1100 + g * 7919);
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
  // unas cuantas paredes de menos: hay más de un camino, pero sigue habiendo callejones sin salida
  for (let k = 0; k < 9; k++) { const r = Math.floor(rnd() * R), c = Math.floor(rnd() * C);
    if (rnd() < .5 && c < C - 1) W[r][c].r = false; else if (r < R - 1) W[r][c].b = false; }
  const open = (r, c, a, b) => { if (a < 0 || b < 0 || a >= R || b >= C) return false;
    if (a === r && Math.abs(b - c) === 1) return !W[r][Math.min(c, b)].r;
    if (b === c && Math.abs(a - r) === 1) return !W[Math.min(r, a)][c].b; return false; };
  // distancias desde la salida
  const dist = (sr, sc) => { const d = Array.from({ length: R }, () => Array(C).fill(-1)); const q = [[sr, sc]]; d[sr][sc] = 0;
    while (q.length) { const [r, c] = q.shift(); for (const [a, b] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]) if (open(r, c, a, b) && d[a][b] < 0) { d[a][b] = d[r][c] + 1; q.push([a, b]); } } return d; };
  const d0 = dist(0, 0);
  // trineo: el sitio más lejano; regalos: callejones sin salida lejos entre ellos
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
  return { W, open, sleigh, gifts: best };
}

export function render(body, ctx) {
  body.style.webkitUserSelect = body.style.userSelect = 'none';
  const gameNo = nextGame('maze');
  const M = makeMaze(gameNo);
  if (location.search.includes('mztest')) window.__mz = { M, cs: () => cs, st: () => ({ anchor, taken: taken.slice() }) };
  body.append(
    el('h2', { class: 'q-title cw-title' }, '🎅 ' + L('Los regalos perdidos', 'Els regals perduts', 'The lost presents') + ' 🎁'),
    el('p', { class: 'cw-gno' }, L(`Partida ${gameNo + 1} de ${TOTAL}`, `Partida ${gameNo + 1} de ${TOTAL}`, `Game ${gameNo + 1} of ${TOTAL}`)));
  const startBtn = el('button', { class: 'btn btn-big no-delay' }, '▶️ ' + L('¡A jugar!', 'A jugar!', 'Let’s play!'));
  const howto = el('div', { class: 'mz-how' },
    el('h3', {}, '📖 ' + L('Cómo se juega', 'Com es juga', 'How to play')),
    el('p', {}, L('Pon el dedo sobre Papá Noel y, sin levantarlo, deslízalo por los caminos: se irá pintando. Lleva a Papá Noel hasta un regalo: el camino se engancha y Papá Noel se queda allí. Desde allí, ve a buscar el siguiente.',
      'Posa el dit sobre el Pare Noel i, sense aixecar-lo, llisca’l pels camins: s’anirà pintant. Porta el Pare Noel fins a un regal: el camí s’enganxa i el Pare Noel s’hi queda. Des d’allà, ves a buscar el següent.',
      'Put your finger on Santa and, without lifting it, slide along the paths: they get painted. Take Santa to a present: the path sticks and Santa stays there. From there, go and find the next one.')),
    el('p', {}, L('Si atraviesas una pared o levantas el dedo antes de llegar, el camino se borra poco a poco y vuelves a empezar desde Papá Noel. Cada vez que deslizas el dedo es un intento. Coge los 3 regalos (en el orden que quieras) y después lleva a Papá Noel al trineo.',
      'Si travesses una paret o aixeques el dit abans d’arribar, el camí s’esborra a poc a poc i tornes a començar des del Pare Noel. Cada vegada que llisques el dit és un intent. Agafa els 3 regals (en l’ordre que vulguis) i després porta el Pare Noel al trineu.',
      'If you cross a wall or lift your finger before arriving, the path fades away and you start again from Santa. Every slide is one try. Collect the 3 presents (in any order) and then take Santa to the sleigh.')), startBtn);
  const tries = el('span', { class: 'mz-tries' }), got = el('span', { class: 'mz-got' });
  const helpBtn = el('button', { type: 'button', class: 'mz-helpbtn no-delay', title: L('Cómo se juega', 'Com es juga', 'How to play') }, '📖');
  const hud = el('div', { class: 'mz-hud' }, tries, helpBtn, got);
  const cv = el('canvas', { class: 'mz-cv' });
  const stage = el('div', { class: 'mz-stage' }, cv);
  const over = el('div', { class: 'mz-over' }, howto);
  const board = el('div', { class: 'cw-board mz-board' }, el('div', { class: 'cw-lights' }, ...Array.from({ length: 14 }, (_, i) => el('i', { style: `--i:${i}` }))), hud, stage, over);
  const msg = el('div', { class: 'sp-msg' });
  body.append(el('div', { class: 'cw-wrap mz-wrap' }, board, msg));
  startBtn.onclick = () => { unlockAudio(); pop(); over.classList.add('hide'); };
  helpBtn.onclick = () => { pop(); over.classList.remove('hide'); };

  // ---- fichas: Papá Noel, regalos y trineo
  const santa = el('div', { class: 'mz-santa' }, el('img', { src: 'santa11.webp', alt: '' }));
  const giftEls = M.gifts.map((p, i) => el('div', { class: 'mz-gift' }, el('img', { src: GIFTS[i], alt: '' })));
  const sleighEl = el('div', { class: 'mz-sleigh' }, el('img', { src: 'trineo11.webp', alt: '' }));
  stage.append(sleighEl, ...giftEls, santa);

  let cs = 30, nTries = 0, anchor = [0, 0], locked = [], active = null, ghosts = [], taken = [false, false, false], done = false, warnedSleigh = false;
  const paintHud = () => { tries.textContent = '🎅 ' + L(`Intentos: ${nTries}`, `Intents: ${nTries}`, `Tries: ${nTries}`); got.textContent = `🎁 ${taken.filter(Boolean).length} / 3`; };
  paintHud();
  const posEl = (e, [r, c], k = .86) => { const s = cs * k; Object.assign(e.style, { width: s + 'px', height: s + 'px', left: (c * cs + (cs - s) / 2) + 'px', top: (r * cs + (cs - s) / 2) + 'px' }); };
  function fit() {
    if (!stage.isConnected) return;
    const avW = Math.min(board.clientWidth - 20, 560);
    const br = body.getBoundingClientRect(), sr = stage.getBoundingClientRect(), k = br.height / (body.offsetHeight || 1) || 1;
    const top = (sr.top - br.top) / k + body.scrollTop;
    const avH = Math.max(260, body.clientHeight - top - 30);
    cs = Math.floor(Math.min(avW / C, avH / R, 52));
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = C * cs * dpr; cv.height = R * cs * dpr; cv.style.width = C * cs + 'px'; cv.style.height = R * cs + 'px';
    stage.style.width = C * cs + 'px'; stage.style.height = R * cs + 'px';
    cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    posEl(santa, anchor, .92); M.gifts.forEach((p, i) => posEl(giftEls[i], p, .84)); posEl(sleighEl, M.sleigh, .98);
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
    // caminos enganchados (dorados) y el que se está pintando (rojo)
    locked.forEach(p => { stroke(g, p, '#b8862b', cs * .5, .35); stroke(g, p, '#f2c14e', cs * .32, 1, 8); });
    ghosts.forEach(gh => stroke(g, gh.path, '#c8102e', cs * .32, gh.a));
    if (active) { stroke(g, active, '#7a1020', cs * .4, .35); stroke(g, active, '#e63946', cs * .28, 1, 6); }
    // paredes: setos verdes con un poco de nieve
    g.lineCap = 'round';
    const wall = (x1, y1, x2, y2) => { g.strokeStyle = '#14532d'; g.lineWidth = Math.max(3, cs * .16); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      g.strokeStyle = '#ffffffcc'; g.lineWidth = Math.max(1, cs * .05); g.beginPath(); g.moveTo(x1, y1 - cs * .04); g.lineTo(x2, y2 - cs * .04); g.stroke(); };
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      if (M.W[r][c].r && c < C - 1) wall((c + 1) * cs, r * cs, (c + 1) * cs, (r + 1) * cs);
      if (M.W[r][c].b && r < R - 1) wall(c * cs, (r + 1) * cs, (c + 1) * cs, (r + 1) * cs);
    }
    g.strokeStyle = '#14532d'; g.lineWidth = Math.max(4, cs * .2); g.strokeRect(1, 1, C * cs - 2, R * cs - 2);
  }
  // el camino cortado se borra poco a poco
  let fading = false;
  function fadeLoop() {
    if (fading) return; fading = true;
    (function step() {
      ghosts.forEach(gh => gh.a -= .045); ghosts = ghosts.filter(gh => gh.a > 0); draw();
      if (ghosts.length && stage.isConnected) requestAnimationFrame(step); else fading = false;
    })();
  }
  function cut(sound = true) {
    if (!active) return;
    if (active.length > 1) ghosts.push({ path: active, a: 1 }); active = null; fadeLoop();
    if (sound) oops();
    santa.classList.remove('drag');
  }

  // ---- tocar y deslizar
  const cellAt = e => { const r = stage.getBoundingClientRect(), k = r.width / (C * cs) || 1;
    return [Math.floor((e.clientY - r.top) / k / cs), Math.floor((e.clientX - r.left) / k / cs)]; };
  const same = (a, b) => a[0] === b[0] && a[1] === b[1];
  let pid = null;
  stage.addEventListener('pointerdown', e => {
    if (done) return; unlockAudio();
    const p = cellAt(e);
    if (!same(p, anchor)) { toast('🎅 ' + L('Pon el dedo sobre Papá Noel para empezar el camino.', 'Posa el dit sobre el Pare Noel per començar el camí.', 'Put your finger on Santa to start the path.'), 2400); santa.classList.remove('nudge'); void santa.offsetWidth; santa.classList.add('nudge'); return; }
    e.preventDefault(); try { stage.setPointerCapture(e.pointerId); } catch {}
    pid = e.pointerId; active = [anchor.slice()]; nTries++; paintHud(); santa.classList.add('drag'); pop(); draw();
  });
  stage.addEventListener('pointermove', e => {
    if (!active || e.pointerId !== pid) return;
    const p = cellAt(e), last = active[active.length - 1];
    if (same(p, last)) return;
    if (active.length > 1 && same(p, active[active.length - 2])) { active.pop(); draw(); return; } // volver atrás
    const dr = p[0] - last[0], dc = p[1] - last[1];
    if (Math.abs(dr) + Math.abs(dc) !== 1) {
      // dedo rápido: si va en línea recta sin paredes, se rellenan las casillas; en diagonal se espera
      if (dr && dc) return;
      const n = Math.abs(dr + dc), sr = Math.sign(dr), sc = Math.sign(dc); let cur = last;
      for (let i = 0; i < n; i++) { const nx = [cur[0] + sr, cur[1] + sc]; if (!M.open(cur[0], cur[1], nx[0], nx[1])) return cut(); if (step(nx)) return; cur = nx; }
      return;
    }
    if (!M.open(last[0], last[1], p[0], p[1])) return cut(); // ¡pared!
    step(p);
  });
  // avanza una casilla; devuelve true si se ha acabado el trazo
  function step(p) {
    if (active.some(q => same(q, p))) { while (!same(active[active.length - 1], p)) active.pop(); draw(); return false; } // ha vuelto sobre su camino
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
    const path = active; active = null; pid = null; locked.push(path); santa.classList.remove('drag');
    snapSound(); chime(); draw();
    // Papá Noel recorre el camino hasta el regal
    for (let i = 1; i < path.length; i++) { posEl(santa, path[i], .92); await sleep(Math.max(18, 160 / path.length)); }
    anchor = p.slice();
    if (gi >= 0) {
      taken[gi] = true; giftEls[gi].classList.add('got'); paintHud();
      const r = giftEls[gi].getBoundingClientRect(); confetti(60, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
      if (taken.every(Boolean)) { sleighEl.classList.add('ready'); toast('🛷 ' + L('¡Ya tienes los 3 regalos! Ahora lleva a Papá Noel al trineo.', 'Ja tens els 3 regals! Ara porta el Pare Noel al trineu.', 'You have the 3 presents! Now take Santa to the sleigh.'), 3200); }
    } else win();
  }

  // ---- ¡al trineo! Papá Noel se va volando con los regalos
  let music = null;
  ctx.cleanup = () => { try { music?.stop(1); } catch {} };
  async function win() {
    done = true;
    if (!ctx.prev && !win.sent) { win.sent = true; ctx.submit({ answer: '🛷 ' + L(`Laberinto en ${nTries} intentos`, `Laberint en ${nTries} intents`, `Maze in ${nTries} tries`), status: 'correct' }); }
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
    const again = el('button', { class: 'btn btn-big no-delay' }, '🔄 ' + L('Jugar otra partida', 'Jugar una altra partida', 'Play another game'));
    const out = el('button', { class: 'btn btn-ghost btn-big no-delay' }, '🎁 ' + L('Continuar', 'Continuar', 'Continue'));
    msg.replaceChildren(el('div', { class: 'sp-msg-title' }, L('¡Buen viaje, Papá Noel!', 'Bon viatge, Pare Noel!', 'Safe trip, Santa!')),
      el('p', {}, L(`Has encontrado los 3 regalos en ${nTries} intentos. 🎄`, `Has trobat els 3 regals en ${nTries} intents. 🎄`, `You found the 3 presents in ${nTries} tries. 🎄`)),
      el('div', { class: 'ttt-fx-btns' }, again, out));
    msg.classList.add('on'); setTimeout(() => msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300);
    again.onclick = () => { ctx.cleanup(); body.replaceChildren(); render(body, ctx); };
    out.onclick = () => { ctx.cleanup(); ctx.finish(); };
  }

  fit(); requestAnimationFrame(fit); setTimeout(fit, 350); setTimeout(fit, 1600);
  addEventListener('resize', fit);
}
