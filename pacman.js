// Día 2 · «El follet dels regals» (V26.7) — un comecocos de Navidad.
// Un duende recorre el laberinto recogiendo regalos 🎁 sin dejar que le toquen los muñecos de nieve gruñones ☃️.
// Las estrellas ⭐ hacen que los muñecos se asusten un rato: entonces el duende los puede atrapar.
// Tres niveles: fácil (2 muñecos lentos), mediano (3) y difícil (4 rápidos y listos).
// ⭐ Marcador de Navidad: suma (ctx.won: +2 la 1.ª vez, +1 después) si en MEDIANO hace 1.000 puntos o en DIFÍCIL 800.
// La casilla queda hecha al acabar una partida en cualquier nivel.
import { getLang } from './i18n.js';
import { el, sleep, confetti, toast } from './fx.js';
import { pop, chime, clickSound, fanfare, sadTrombone, snapSound, unlockAudio, wrong } from './sound.js';
import { S, figure } from './app.js';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const rc = (n, ...k) => n.replaceChildren(...k.flat().filter(x => x != null && x !== false));

// ---------------------------------------------------------------- el laberinto (19 × 21; la mitad derecha es el espejo de la izquierda)
const HALF = [['#########', '#'], ['#o.......', '#'], ['#.##.###.', '#'], ['#........', '.'], ['#.##.#.##', '#'], ['#....#...', '#'], ['####.###.', '#'],
  ['   #.#...', '.'], ['####.#.##', '-'], ['    ...#G', 'G'], ['####.#.##', '#'], ['   #.#...', '.'], ['####.#.##', '#'], ['#........', '#'], ['#.##.###.', '#'],
  ['#o.#.....', '.'], ['##.#.#.##', '#'], ['#....#...', '#'], ['#.######.', '#'], ['#........', '.'], ['#########', '#']];
const MAP = HALF.map(([l, c]) => l + c + [...l].reverse().join(''));
const COLS = 19, ROWS = 21;
const START = { x: 9, y: 15 }, DOOR = { x: 9, y: 8 }, OUT = { x: 9, y: 7 }, HOME = [{ x: 9, y: 9 }, { x: 8, y: 9 }, { x: 10, y: 9 }, { x: 9, y: 9 }];
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };

// niveles
export const LEVELS = {
  easy: { name: () => L('Fácil', 'Fàcil', 'Easy'), ico: '🙂', ghosts: 2, gs: 3.6, ps: 6.2, fright: 8, smart: .35, goal: 0 },
  mid: { name: () => L('Mediano', 'Mitjà', 'Medium'), ico: '😎', ghosts: 3, gs: 4.8, ps: 6.4, fright: 6, smart: .7, goal: 1000 },
  hard: { name: () => L('Difícil', 'Difícil', 'Hard'), ico: '🔥', ghosts: 4, gs: 5.7, ps: 6.6, fright: 4, smart: .92, goal: 800 },
};
const P_GIFT = 10, P_STAR = 50, P_SNOW = 200, LIVES = 3;

// ---------------------------------------------------------------- dibujos (todos hechos aquí, al estilo del calendario)
const GIFT_COLORS = [['#d3203a', '#ffd24a'], ['#1f9a4a', '#ffffff'], ['#1f7ae0', '#ffd24a'], ['#f2b705', '#d3203a'], ['#8e44ad', '#ffffff']];
function giftSprite(size, [box, rib]) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  const s = size, b = s * .62, o = (s - b) / 2;
  g.fillStyle = '#0003'; g.beginPath(); g.ellipse(s / 2, o + b + s * .04, b * .5, s * .06, 0, 0, Math.PI * 2); g.fill();
  const gr = g.createLinearGradient(o, o, o + b, o + b); gr.addColorStop(0, box); gr.addColorStop(1, shade(box, -.3));
  g.fillStyle = gr; round(g, o, o + s * .08, b, b * .9, s * .06); g.fill();
  g.fillStyle = rib; g.fillRect(s / 2 - s * .05, o + s * .08, s * .1, b * .9); g.fillRect(o, o + s * .08 + b * .35, b, s * .09);
  g.beginPath(); g.ellipse(s / 2 - s * .1, o + s * .07, s * .1, s * .06, -.5, 0, Math.PI * 2); g.ellipse(s / 2 + s * .1, o + s * .07, s * .1, s * .06, .5, 0, Math.PI * 2); g.fill();
  return c;
}
function shade(hex, k) { const n = parseInt(hex.slice(1), 16); const f = v => Math.max(0, Math.min(255, Math.round(v * (1 + k)))); return `rgb(${f(n >> 16)},${f(n >> 8 & 255)},${f(n & 255)})`; }
function round(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function star(g, x, y, r, rot = 0) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = rot - Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }
// el duende: cara redonda, gorro verde con pompón, orejas puntiagudas y una gran boca que se abre al comer
function drawElf(g, x, y, r, dir, mouth, hurt = 0) {
  const ang = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[dir || 'right'];
  g.save(); g.translate(x, y);
  // orejas
  g.fillStyle = '#ffc9a0';
  [-1, 1].forEach(s => { g.beginPath(); g.moveTo(s * r * .78, -r * .15); g.lineTo(s * r * 1.32, -r * .62); g.lineTo(s * r * .86, r * .22); g.closePath(); g.fill(); });
  // cara con la boca (cuña) mirando hacia donde va
  const fg = g.createRadialGradient(-r * .3, -r * .35, r * .1, 0, 0, r); fg.addColorStop(0, '#ffe7d1'); fg.addColorStop(1, '#f6b98a');
  g.fillStyle = hurt ? '#cfd8e8' : fg;
  const m = mouth * .42;
  g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r, ang + m, ang + Math.PI * 2 - m); g.closePath(); g.fill();
  g.strokeStyle = '#b9774a'; g.lineWidth = Math.max(1, r * .06); g.stroke();
  // interior de la boca
  if (m > .05) { g.fillStyle = '#8a1020'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r * .72, ang - m * .8, ang + m * .8); g.closePath(); g.fill(); }
  // mejillas y ojos (miran hacia donde va)
  const ex = Math.cos(ang) * r * .18, ey = Math.sin(ang) * r * .12;
  g.fillStyle = '#ff8fa3'; g.globalAlpha = .7; [-1, 1].forEach(s => { g.beginPath(); g.arc(s * r * .45, r * .3, r * .14, 0, Math.PI * 2); g.fill(); }); g.globalAlpha = 1;
  g.fillStyle = '#2b1a10'; [-1, 1].forEach(s => { g.beginPath(); g.arc(s * r * .32 + ex, -r * .18 + ey, r * .11, 0, Math.PI * 2); g.fill(); });
  g.fillStyle = '#fff'; [-1, 1].forEach(s => { g.beginPath(); g.arc(s * r * .32 + ex + r * .04, -r * .22 + ey, r * .04, 0, Math.PI * 2); g.fill(); });
  // gorro verde con borde blanco y pompón rojo
  g.fillStyle = '#1f9a4a'; g.beginPath(); g.moveTo(-r * .92, -r * .48); g.quadraticCurveTo(-r * .2, -r * 1.9, r * 1.05, -r * 1.55); g.quadraticCurveTo(r * .4, -r * 1.05, r * .92, -r * .48); g.closePath(); g.fill();
  g.fillStyle = '#fff'; round(g, -r * 1.0, -r * .66, r * 2, r * .3, r * .15); g.fill();
  g.fillStyle = '#e0435a'; g.beginPath(); g.arc(r * 1.08, -r * 1.55, r * .22, 0, Math.PI * 2); g.fill();
  g.restore();
}
// muñeco de nieve gruñón (hecho aquí): dos bolas, sombrero, bufanda y cejas enfadadas
function drawSnowman(g, x, y, r, col, mode, t, fx) {
  g.save(); g.translate(x, y);
  if (mode === 'eaten') { // solo los ojos vuelven a casa
    g.fillStyle = '#fff'; [-1, 1].forEach(s => { g.beginPath(); g.arc(s * r * .3, -r * .1, r * .22, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = '#1b2a4a'; [-1, 1].forEach(s => { g.beginPath(); g.arc(s * r * .3, -r * .1, r * .1, 0, Math.PI * 2); g.fill(); });
    g.restore(); return;
  }
  const scared = mode === 'fright', blink = scared && fx < 1.6 && Math.floor(t * 6) % 2;
  const body = scared ? (blink ? '#ffffff' : '#9cc8ff') : '#ffffff';
  const wob = Math.sin(t * 9 + x) * r * .05;
  g.translate(wob, 0);
  g.fillStyle = '#0002'; g.beginPath(); g.ellipse(0, r * .95, r * .75, r * .16, 0, 0, Math.PI * 2); g.fill();
  const bg = (cx, cy, rr) => { const gr = g.createRadialGradient(cx - rr * .3, cy - rr * .3, rr * .1, cx, cy, rr); gr.addColorStop(0, '#fff'); gr.addColorStop(1, scared ? '#6ea8f0' : '#cfdcf0'); return gr; };
  g.fillStyle = bg(0, r * .38, r * .62); g.beginPath(); g.arc(0, r * .38, r * .62, 0, Math.PI * 2); g.fill();
  g.fillStyle = scared ? body : bg(0, -r * .38, r * .48); g.beginPath(); g.arc(0, -r * .38, r * .48, 0, Math.PI * 2); g.fill();
  // bufanda del color de cada muñeco
  g.fillStyle = scared ? '#5b8fd6' : col; round(g, -r * .5, -r * .05, r, r * .2, r * .08); g.fill(); g.fillRect(r * .18, -r * .02, r * .16, r * .42);
  // sombrero
  g.fillStyle = '#2b2b33'; g.fillRect(-r * .48, -r * .84, r * .96, r * .12); g.fillRect(-r * .3, -r * 1.22, r * .6, r * .42);
  g.fillStyle = scared ? '#5b8fd6' : col; g.fillRect(-r * .3, -r * .92, r * .6, r * .1);
  // cara: gruñona normalmente, asustada con la estrella
  g.fillStyle = '#1b1b22';
  [-1, 1].forEach(s => { g.beginPath(); g.arc(s * r * .18, -r * .46, r * .065, 0, Math.PI * 2); g.fill(); });
  g.strokeStyle = '#1b1b22'; g.lineWidth = Math.max(1, r * .07); g.lineCap = 'round';
  if (scared) { g.beginPath(); g.arc(0, -r * .2, r * .1, 0, Math.PI * 2); g.stroke(); }
  else {
    [-1, 1].forEach(s => { g.beginPath(); g.moveTo(s * r * .32, -r * .66); g.lineTo(s * r * .08, -r * .56); g.stroke(); });
    g.beginPath(); g.arc(0, -r * .14, r * .14, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
  }
  g.fillStyle = '#ff8a1e'; g.beginPath(); g.moveTo(0, -r * .38); g.lineTo(r * .32, -r * .32); g.lineTo(0, -r * .28); g.closePath(); g.fill();
  g.restore();
}
const SNOW_COLORS = ['#d3203a', '#1f7ae0', '#f2b705', '#8e44ad'];

// ---------------------------------------------------------------- la pantalla del día 2
export function render(body, ctx) {
  const pic = el('canvas', { class: 'pm-introcv', width: 360, height: 140 });
  const g = pic.getContext('2d');
  const giftS = giftSprite(40, GIFT_COLORS[0]), giftS2 = giftSprite(40, GIFT_COLORS[1]), giftS3 = giftSprite(40, GIFT_COLORS[2]);
  drawElf(g, 70, 82, 34, 'right', .8);
  [giftS, giftS2, giftS3, giftS].forEach((s, i) => g.drawImage(s, 118 + i * 38, 62));
  g.fillStyle = '#ffd24a'; star(g, 285, 50, 14, .2); g.fill();
  drawSnowman(g, 318, 84, 30, SNOW_COLORS[0], 'chase', 0, 9);
  body.append(el('div', { class: 'pm-intro' },
    el('h2', { class: 'q-title cw-title' }, '🎁 ' + L('El duende de los regalos', 'El follet dels regals', 'The present elf') + ' 🎄'),
    pic,
    el('p', { class: 'game-help' }, L('Guía al duende por el laberinto y recoge todos los regalos. ¡Que no te toquen los muñecos de nieve gruñones! Con una ⭐ se asustan y los puedes atrapar.',
      'Guia el follet pel laberint i recull tots els regals. Que no et toquin els ninots de neu rondinaires! Amb una ⭐ s’espanten i els pots atrapar.',
      'Guide the elf through the maze and collect all the presents. Don’t let the grumpy snowmen touch you! A ⭐ scares them so you can catch them.')),
    el('button', { type: 'button', class: 'oca-cta pm-cta no-delay', onclick: () => { unlockAudio(); openGame(ctx); } }, '🎮 ' + L('¡A jugar!', 'A jugar!', 'Play!')),
    el('p', { class: 'pm-goalnote' }, '⭐ ' + L(`Marcador de Navidad: suma si haces ${LEVELS.mid.goal} puntos en Mediano o ${LEVELS.hard.goal} en Difícil.`,
      `Marcador de Nadal: suma si fas ${LEVELS.mid.goal} punts en Mitjà o ${LEVELS.hard.goal} en Difícil.`,
      `Christmas scoreboard: score ${LEVELS.mid.goal} points on Medium or ${LEVELS.hard.goal} on Hard.`))));
}

// ---------------------------------------------------------------- la ventana del juego
function openGame(ctx) {
  let alive = true, raf = 0;
  const best = lv => { try { return +localStorage.getItem('adv_pm_best_' + lv + '_' + (S.user?.uid || '')) || 0; } catch { return 0; } };
  const scoreEl = el('b', {}, '0'), livesEl = el('div', { class: 'pm-lives' }), levelEl = el('span', { class: 'pm-lvl' });
  const cv = el('canvas', { class: 'pm-cv' });
  const msg = el('div', { class: 'oca-msg' });
  const pad = el('div', { class: 'pm-pad' }, ...['up', 'left', 'right', 'down'].map(d => el('button', { type: 'button', class: 'pm-key pm-' + d + ' no-delay', 'aria-label': d,
    onpointerdown: e => { e.preventDefault(); unlockAudio(); setDir(d); } }, { up: '▲', left: '◀', right: '▶', down: '▼' }[d])));
  const close = () => { alive = false; cancelAnimationFrame(raf); removeEventListener('keydown', onKey); removeEventListener('resize', fit); wrap.classList.add('out'); document.documentElement.classList.remove('gm-lock'); setTimeout(() => wrap.remove(), 350); };
  const wrap = el('div', { class: 'oca-wrap pm-wrap' },
    el('div', { class: 'oca-snow' }),
    el('div', { class: 'oca-head' }, el('button', { type: 'button', class: 'cc8-x no-delay', onclick: () => close() }, '✕'), el('div', { class: 'oca-title' }, L('El duende de los regalos', 'El follet dels regals', 'The present elf'))),
    el('div', { class: 'pm-hud' }, el('div', { class: 'pm-box' }, el('small', {}, L('Puntos', 'Punts', 'Points')), scoreEl), levelEl, livesEl),
    el('div', { class: 'pm-stage' }, cv, msg), pad);
  document.body.append(wrap);
  document.documentElement.classList.add('gm-lock');
  const g = cv.getContext('2d');
  let T = 20, dpr = 1;
  function fit() {
    const w = Math.min(innerWidth * .96, 560), h = innerHeight - 300;
    T = Math.max(12, Math.floor(Math.min(w / COLS, h / ROWS)));
    dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = COLS * T * dpr; cv.height = ROWS * T * dpr; cv.style.width = COLS * T + 'px'; cv.style.height = ROWS * T + 'px';
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    sprites();
  }
  let GS = [];
  function sprites() { GS = GIFT_COLORS.map(c => giftSprite(Math.round(T * .82 * dpr), c)); }
  addEventListener('resize', fit); fit();

  // ---- estado de la partida
  let lvKey = 'easy', LV = LEVELS.easy, grid, dots, score, lives, player, ghosts, frightT, running = false, t = 0, modeT = 0, chase = false, ghostCombo = 0, started = 0, over = false;
  const wall = (x, y) => { const c = MAP[y]?.[((x % COLS) + COLS) % COLS]; return c === '#' || c === undefined; };
  const cell = (x, y) => MAP[y]?.[((x % COLS) + COLS) % COLS];
  function reset(full) {
    if (full) {
      grid = MAP.map(r => [...r].map(c => c === '.' ? 1 : c === 'o' ? 2 : 0));
      dots = grid.flat().filter(v => v).length; score = 0; lives = LIVES;
    }
    player = { x: START.x, y: START.y, dir: 'left', next: 'left', mouth: 0, speed: LV.ps };
    ghosts = Array.from({ length: LV.ghosts }, (_, i) => ({ x: HOME[i].x, y: HOME[i].y, dir: 'up', mode: 'house', release: i * 2.5 + .8, col: SNOW_COLORS[i], i }));
    frightT = 0; modeT = 0; chase = false; ghostCombo = 0;
    paintHud();
  }
  function paintHud() {
    scoreEl.textContent = score;
    rc(livesEl, ...Array.from({ length: LIVES }, (_, i) => { const c = el('canvas', { width: 44, height: 44, class: 'pm-life' + (i < lives ? '' : ' gone') }); drawElf(c.getContext('2d'), 22, 26, 14, 'right', .5); return c; }));
    rc(levelEl, LV.ico + ' ' + LV.name(), LV.goal ? el('small', {}, '⭐ ' + LV.goal) : null);
  }
  const setDir = d => { if (!player) return; player.next = d; if (OPP[player.dir] === d) player.dir = d; };
  const onKey = e => { const d = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key]; if (d && running) { e.preventDefault(); setDir(d); } };
  addEventListener('keydown', onKey);
  // deslizar el dedo sobre el tablero
  let sx = 0, sy = 0, sw = false;
  cv.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; sw = true; unlockAudio(); });
  cv.addEventListener('pointermove', e => { if (!sw) return; const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.hypot(dx, dy) > 18) { setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); sx = e.clientX; sy = e.clientY; } });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => cv.addEventListener(ev, () => { sw = false; }));

  // ---- moverse por las casillas
  const canGo = (e, d, ghost) => {
    const [dx, dy] = DIRS[d], nx = Math.round(e.x) + dx, ny = Math.round(e.y) + dy, c = cell(nx, ny);
    if (c === undefined || c === '#') return false;
    if (c === '-') return ghost && (e.mode === 'leave' || e.mode === 'eaten');
    if (c === 'G') return ghost;
    return true;
  };
  function advance(e, dist, onCenter) {
    let guard = 0;
    while (dist > 1e-6 && guard++ < 20) {
      const atC = Math.abs(e.x - Math.round(e.x)) < 1e-6 && Math.abs(e.y - Math.round(e.y)) < 1e-6;
      if (atC) {
        e.x = Math.round(e.x); e.y = Math.round(e.y);
        if (e.x < 0) e.x = COLS - 1; else if (e.x > COLS - 1) e.x = 0; // túnel
        onCenter(e);
        if (!e.dir || !canGo(e, e.dir, !!e.mode)) return;
      }
      const [dx, dy] = DIRS[e.dir];
      const v = dx ? e.x : e.y, s = dx || dy;
      const toNext = s > 0 ? (Math.floor(v + 1e-9) + 1 - v) : (v - (Math.ceil(v - 1e-9) - 1));
      const step = Math.min(dist, toNext);
      if (dx) e.x += dx * step; else e.y += dy * step;
      dist -= step;
      if (e.x < -.5) e.x += COLS; else if (e.x > COLS - .5) e.x -= COLS;
    }
  }
  const playerCenter = p => {
    const v = grid[p.y]?.[p.x];
    if (v) {
      grid[p.y][p.x] = 0; dots--;
      if (v === 1) { score += P_GIFT; if (Math.random() < .5) clickSound(); }
      else { score += P_STAR; chime(); frightT = LV.fright; ghostCombo = 0; ghosts.forEach(gh => { if (gh.mode === 'chase') { gh.mode = 'fright'; gh.dir = OPP[gh.dir] || gh.dir; } }); say('⭐ ' + L('¡Se asustan! ¡Atrápalos!', 'S’espanten! Atrapa’ls!', 'They’re scared! Catch them!'), 'goose'); }
      paintHud();
      if (dots <= 0) win();
    }
    if (p.next && canGo(p, p.next)) p.dir = p.next;
  };
  const dist2 = (a, bx, by) => (a.x - bx) ** 2 + (a.y - by) ** 2;
  const ghostCenter = gh => {
    let target;
    if (gh.mode === 'house') { if (t > gh.release) gh.mode = 'leave'; else { gh.dir = null; return; } }
    if (gh.mode === 'leave') {
      if (gh.x === OUT.x && gh.y === OUT.y) gh.mode = 'chase'; // sale de casa (si hay una estrella activa, sale sin miedo: así no se queda dentro)
      else target = gh.x === DOOR.x && gh.y === DOOR.y ? OUT : DOOR;
    }
    if (gh.mode === 'eaten') { // vuelve a casa a recuperarse
      if (gh.x === HOME[0].x && gh.y === HOME[0].y) { gh.mode = 'leave'; target = DOOR; }
      else if (gh.x === DOOR.x && gh.y === DOOR.y) target = HOME[0];
      else if (gh.x === OUT.x && gh.y === OUT.y) target = DOOR;
      else target = OUT;
    }
    // no se vuelve a meter en casa si no le toca
    const opts = Object.keys(DIRS).filter(d => d !== OPP[gh.dir] && canGo(gh, d, true) && !(gh.mode !== 'eaten' && gh.mode !== 'leave' && cell(Math.round(gh.x) + DIRS[d][0], Math.round(gh.y) + DIRS[d][1]) === '-'));
    if (!opts.length) { gh.dir = OPP[gh.dir]; return; }
    if (gh.mode === 'fright') { gh.dir = opts[Math.floor(Math.random() * opts.length)]; return; }
    if (gh.mode === 'chase') {
      if (!chase) target = [{ x: 1, y: 1 }, { x: 17, y: 1 }, { x: 1, y: 19 }, { x: 17, y: 19 }][gh.i]; // a su rincón un rato
      else {
        const [dx, dy] = DIRS[player.dir] || [0, 0], k = [0, 3, -2, 5][gh.i];
        target = { x: player.x + dx * k, y: player.y + dy * k };
      }
      if (Math.random() > LV.smart) { gh.dir = opts[Math.floor(Math.random() * opts.length)]; return; }
    }
    target = target || OUT;
    opts.sort((a, b) => { const [ax, ay] = DIRS[a], [bx, by] = DIRS[b]; return dist2({ x: gh.x + ax, y: gh.y + ay }, target.x, target.y) - dist2({ x: gh.x + bx, y: gh.y + by }, target.x, target.y); });
    gh.dir = opts[0];
  };

  let msgT = 0;
  function say(txt, kind = '', ms = 1800) { rc(msg, el('span', {}, txt)); msg.className = 'oca-msg on ' + kind; clearTimeout(msgT); msgT = setTimeout(() => msg.classList.remove('on'), ms); }

  // ---- el bucle
  let last = 0;
  function frame(now) {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    if (running) step(dt);
    draw(now / 1000);
  }
  function step(dt) {
    t += dt; modeT += dt;
    if (!chase && modeT > 6) { chase = true; modeT = 0; } else if (chase && modeT > 20) { chase = false; modeT = 0; }
    if (frightT > 0) { frightT -= dt; if (frightT <= 0) ghosts.forEach(gh => { if (gh.mode === 'fright') gh.mode = 'chase'; }); }
    player.mouth = (player.mouth + dt * 9) % 2;
    advance(player, player.speed * dt, playerCenter);
    ghosts.forEach(gh => {
      const sp = gh.mode === 'eaten' ? 11 : gh.mode === 'fright' ? LV.gs * .55 : gh.mode === 'house' || gh.mode === 'leave' ? 3 : (cell(Math.round(gh.x), Math.round(gh.y)) === ' ' ? LV.gs * .6 : LV.gs);
      advance(gh, sp * dt, ghostCenter);
    });
    // ¿se tocan?
    for (const gh of ghosts) {
      if (Math.hypot(gh.x - player.x, gh.y - player.y) > .62) continue;
      if (gh.mode === 'fright') { gh.mode = 'eaten'; ghostCombo++; const p = P_SNOW * ghostCombo; score += p; snapSound(); pop(); say(`☃️ +${p}`, 'goose', 900); paintHud(); }
      else if (gh.mode === 'chase' || gh.mode === 'leave') { caught(); return; }
    }
  }
  async function caught() {
    running = false; lives--; paintHud(); sadTrombone();
    try { navigator.vibrate?.(200); } catch {}
    say('❄️ ' + L('¡Te ha pillado un muñeco de nieve!', 'T’ha enxampat un ninot de neu!', 'A snowman caught you!'), 'bad', 1800);
    await sleep(1600); if (!alive) return;
    if (lives <= 0) return finish(false);
    reset(false); await countdown(); running = true;
  }
  async function win() {
    running = false; fanfare(); confetti(200);
    say('🎁 ' + L('¡Todos los regalos recogidos!', 'Tots els regals recollits!', 'All presents collected!'), 'goose', 2200);
    score += 500; paintHud();
    await sleep(1800); if (alive) finish(true);
  }
  async function countdown() {
    for (const n of ['3', '2', '1', L('¡Ya!', 'Ja!', 'Go!')]) { if (!alive) return; say(n, 'goose', 600); clickSound(); await sleep(620); }
  }

  // ---- dibujar
  const wallCache = { T: 0, c: null };
  function drawWalls() {
    if (wallCache.T === T && wallCache.c) return wallCache.c;
    const c = document.createElement('canvas'); c.width = COLS * T * dpr; c.height = ROWS * T * dpr; const w = c.getContext('2d'); w.scale(dpr, dpr);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const ch = MAP[y][x];
      if (ch === '#') {
        const gr = w.createLinearGradient(0, y * T, 0, y * T + T); gr.addColorStop(0, '#2f8f5b'); gr.addColorStop(1, '#16543a');
        w.fillStyle = gr; round(w, x * T + 1, y * T + 1, T - 2, T - 2, T * .3); w.fill();
        // une con los vecinos (guirnalda continua)
        w.fillStyle = '#1f7a4c';
        if (MAP[y][x + 1] === '#') w.fillRect(x * T + T / 2, y * T + T * .18, T, T * .64);
        if (MAP[y + 1]?.[x] === '#') w.fillRect(x * T + T * .18, y * T + T / 2, T * .64, T);
      }
      if (ch === '-') { w.fillStyle = '#fff'; w.fillRect(x * T, y * T + T * .42, T, T * .16); w.fillStyle = '#e0435a'; for (let k = 0; k < 4; k++) w.fillRect(x * T + k * T / 4, y * T + T * .42, T / 8, T * .16); }
    }
    // lucecitas en la guirnalda
    const cols = ['#ff4d6d', '#ffd24a', '#4ade80', '#60a5fa'];
    let k = 0;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (MAP[y][x] === '#' && (x * 7 + y * 3) % 5 === 0) {
      w.fillStyle = cols[k++ % 4]; w.beginPath(); w.arc(x * T + T / 2, y * T + T / 2, T * .13, 0, Math.PI * 2); w.fill();
    }
    wallCache.T = T; wallCache.c = c; return c;
  }
  function draw(time) {
    g.clearRect(0, 0, COLS * T, ROWS * T);
    g.drawImage(drawWalls(), 0, 0, COLS * T, ROWS * T);
    // lucecitas que parpadean
    if (grid) {
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const v = grid[y][x];
        if (v === 1) { const s = GS[(x * 3 + y * 5) % GS.length]; const sz = T * .82; g.drawImage(s, x * T + (T - sz) / 2, y * T + (T - sz) / 2, sz, sz); }
        else if (v === 2) { const r = T * (.42 + .08 * Math.sin(time * 6)); g.save(); g.shadowColor = '#ffe27a'; g.shadowBlur = T * .6; g.fillStyle = '#ffd24a'; star(g, x * T + T / 2, y * T + T / 2, r, time); g.fill(); g.restore(); }
      }
    }
    if (ghosts) ghosts.forEach(gh => drawSnowman(g, (gh.x + .5) * T, (gh.y + .5) * T, T * .62, gh.col, gh.mode === 'house' || gh.mode === 'leave' ? 'chase' : gh.mode, time, frightT));
    if (player) { const m = Math.abs(1 - player.mouth); drawElf(g, (player.x + .5) * T, (player.y + .58) * T, T * .5, player.dir, running ? m : .5); }
  }
  raf = requestAnimationFrame(frame);

  // ---- elegir nivel
  function chooseLevel() {
    running = false;
    const card = el('div', { class: 'cc8-endcard pm-levels' },
      el('h2', {}, '🎮 ' + L('Elige el nivel', 'Tria el nivell', 'Choose the level')),
      ...Object.entries(LEVELS).map(([k, lv]) => el('button', { type: 'button', class: 'pm-lvbtn pm-' + k + ' no-delay', onclick: () => { box.remove(); start(k); } },
        el('span', { class: 'pm-lvico' }, lv.ico),
        el('div', {}, el('b', {}, lv.name()),
          el('small', {}, '☃️'.repeat(lv.ghosts) + ' · ' + (k === 'easy' ? L('muñecos lentos', 'ninots lents', 'slow snowmen') : k === 'mid' ? L('muñecos más rápidos', 'ninots més ràpids', 'faster snowmen') : L('¡muy rápidos y listos!', 'molt ràpids i espavilats!', 'very fast and smart!'))),
          el('small', { class: 'pm-lvgoal' }, lv.goal ? '⭐ ' + L(`Marcador de Navidad: haz ${lv.goal} puntos`, `Marcador de Nadal: fes ${lv.goal} punts`, `Scoreboard: score ${lv.goal}`) : L('Para practicar (no suma al Marcador)', 'Per practicar (no suma al Marcador)', 'Practice (no scoreboard points)')),
          best(k) ? el('small', { class: 'pm-lvbest' }, '🏆 ' + L('Tu récord', 'El teu rècord', 'Your best') + ': ' + best(k)) : null))),
      el('div', { class: 'pm-howto' },
        el('p', {}, '👆 ' + L('Mueve al duende deslizando el dedo por el tablero o con las flechas de abajo.', 'Mou el follet lliscant el dit pel tauler o amb les fletxes de sota.', 'Move the elf by swiping on the board or with the arrows below.')),
        el('p', {}, `🎁 +${P_GIFT} · ⭐ +${P_STAR} · ☃️ +${P_SNOW} · ` + L('todo recogido', 'tot recollit', 'all collected') + ' +500')),
      el('div', { class: 'cc8-endbtns' }, el('button', { type: 'button', class: 'btn btn-ghost no-delay', onclick: () => close() }, '⏰ ' + L('Lo haré más tarde', 'Ho faré més tard', 'Later'))));
    const box = el('div', { class: 'cc8-end' }, card);
    wrap.append(box);
  }
  async function start(k) {
    lvKey = k; LV = LEVELS[k]; over = false; t = 0; started = Date.now();
    reset(true); await countdown(); if (alive) running = true;
  }
  async function finish(cleared) {
    if (over) return; over = true; running = false;
    const b0 = best(lvKey), rec = score > b0;
    if (rec) try { localStorage.setItem('adv_pm_best_' + lvKey + '_' + (S.user?.uid || ''), score); } catch {}
    const goalOk = LV.goal && score >= LV.goal;
    const lines = [];
    if (goalOk) { try { ctx.won?.(); } catch {} lines.push('⭐ ' + L(`¡Has llegado a ${LV.goal} puntos! Suma al Marcador de Navidad.`, `Has arribat a ${LV.goal} punts! Suma al Marcador de Nadal.`, `You reached ${LV.goal} points! Scoreboard points added.`)); }
    else if (LV.goal) lines.push('⭐ ' + L(`Para el Marcador de Navidad hacen falta ${LV.goal} puntos en este nivel. ¡Inténtalo otra vez!`, `Per al Marcador de Nadal calen ${LV.goal} punts en aquest nivell. Torna-ho a provar!`, `You need ${LV.goal} points on this level for the scoreboard. Try again!`));
    else lines.push('⭐ ' + L('En Fácil se practica: para el Marcador de Navidad, juega en Mediano o Difícil.', 'En Fàcil es practica: per al Marcador de Nadal, juga en Mitjà o Difícil.', 'Easy is for practice: play Medium or Hard for the scoreboard.'));
    // la casilla queda hecha al acabar una partida
    if (!ctx.prev && !finish.sent) { finish.sent = true; try { ctx.submit?.({ answer: `🎁 ${score} ${L('puntos', 'punts', 'points')} · ${LV.name()}`, status: 'correct' }); } catch {} }
    if (cleared || goalOk) { fanfare(); confetti(220); }
    const again = el('button', { type: 'button', class: 'btn btn-big no-delay', onclick: () => { box.remove(); start(lvKey); } }, '🔄 ' + L('Jugar otra vez', 'Tornar a jugar', 'Play again'));
    const other = el('button', { type: 'button', class: 'btn no-delay', onclick: () => { box.remove(); chooseLevel(); } }, '🎮 ' + L('Cambiar de nivel', 'Canviar de nivell', 'Change level'));
    const out = el('button', { type: 'button', class: 'btn btn-ghost no-delay', onclick: () => close() }, '🎄 ' + L('Salir', 'Sortir', 'Exit'));
    const card = el('div', { class: 'cc8-endcard' },
      el('div', { class: 'cc8-bigstar' }, cleared ? '🎁' : '☃️'),
      el('h2', {}, cleared ? L('¡Todos los regalos recogidos!', 'Tots els regals recollits!', 'All presents collected!') : L('¡Fin de la partida!', 'Fi de la partida!', 'Game over!')),
      el('p', { class: 'cc8-endpts' }, L('Puntos', 'Punts', 'Points') + ': ', el('b', {}, score), ' · ' + LV.ico + ' ' + LV.name()),
      rec ? el('p', { class: 'cc8-rec' }, '🏆 ' + L('¡Nuevo récord!', 'Nou rècord!', 'New record!')) : el('p', { class: 'cc8-rec' }, '🏆 ' + L('Tu récord', 'El teu rècord', 'Your best') + ': ' + Math.max(b0, score)),
      ...lines.map(x => el('p', { class: 'cc8-rec cc8-ptinfo' }, x)),
      el('div', { class: 'cc8-endbtns' }, again, other, out));
    const box = el('div', { class: 'cc8-end' }, card);
    wrap.append(box);
  }
  chooseLevel();
}
