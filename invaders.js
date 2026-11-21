// Día 16 · (V26.8) «Els marcianets de Nadal» — un joc com el Space Invaders d'abans.
// S'obre des del diploma absurd amb el botó «Prem per divertir-te!».
// Uns marcianets verds amb gorro de Pare Noel baixen a poc a poc; el trineu-canó els dispara raigs làser.
// Comptador fins a 100 punts:
//   ⭐ Marcador de Nadal (per a tothom): en arribar a 100 → ctx.won() (+2 la 1a vegada, +1 després, com els altres jocs).
//   🍄 Gnoms: la PRIMERA vegada que arriben a 100 → punts per al joc dels gnoms (gnomes.js 'inv16', per defecte +2).
import { getLang } from './i18n.js';
import { el, sleep, confetti, popup } from './fx.js';
import { pop, chime, fanfare, sadTrombone, boom, laser, unlockAudio, clickSound } from './sound.js';
import { S } from './app.js';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const rc = (n, ...k) => n.replaceChildren(...k.flat().filter(x => x != null && x !== false));
export const GOAL = 100;
const W = 360, H = 500, PY = 462, ROWS = 5, COLS = 8, LIVES = 3;
const ROWPTS = [3, 3, 2, 1, 1];                     // punts per fila (a dalt valen més)
const ALCOL = ['#b56cff', '#b56cff', '#4fc3ff', '#5fe07a', '#5fe07a'];

// ---------------------------------------------------------------- dibuixos (fets aquí)
function alienSprite(col, frame, sc) {
  const c = document.createElement('canvas'); c.width = 34 * sc; c.height = 32 * sc; const g = c.getContext('2d'); g.scale(sc, sc);
  // antenes
  g.strokeStyle = col; g.lineWidth = 2;
  [[11, 13, 7, 5], [23, 13, 27, 5]].forEach(([a, b, x, y]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(x, y); g.stroke(); g.fillStyle = '#ffd24a'; g.beginPath(); g.arc(x, y, 2.4, 0, 7); g.fill(); });
  // cos
  const gr = g.createRadialGradient(13, 14, 2, 17, 18, 13); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.25, col); gr.addColorStop(1, shade(col, -.45));
  g.fillStyle = gr; g.beginPath(); g.ellipse(17, 19, 12, 9, 0, 0, 7); g.fill();
  // cames (2 posicions)
  g.strokeStyle = shade(col, -.35); g.lineWidth = 2.6; g.lineCap = 'round';
  const legs = frame ? [[9, 26, 5, 31], [15, 27, 14, 31], [19, 27, 20, 31], [25, 26, 29, 31]] : [[9, 26, 8, 31], [15, 27, 12, 31], [19, 27, 22, 31], [25, 26, 26, 31]];
  legs.forEach(([a, b, x, y]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(x, y); g.stroke(); });
  // braços amunt / avall
  g.beginPath(); g.moveTo(6, 19); g.lineTo(1, frame ? 13 : 23); g.moveTo(28, 19); g.lineTo(33, frame ? 13 : 23); g.stroke();
  // ulls grossos
  [[12.5, 18], [21.5, 18]].forEach(([x, y]) => { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y, 3.6, 4.2, 0, 0, 7); g.fill(); g.fillStyle = '#1b1b2e'; g.beginPath(); g.arc(x + (frame ? .8 : -.8), y + .6, 2, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + (frame ? 1.4 : -.2), y - .4, .8, 0, 7); g.fill(); });
  // somriure
  g.strokeStyle = '#1b1b2e'; g.lineWidth = 1.3; g.beginPath(); g.arc(17, 22, 3, .2 * Math.PI, .8 * Math.PI); g.stroke();
  // gorro de Pare Noel
  g.fillStyle = '#e0283f'; g.beginPath(); g.moveTo(8, 12); g.quadraticCurveTo(15, -1, 27, 3); g.quadraticCurveTo(22, 6, 26, 12); g.closePath(); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(17, 12, 10, 2.6, 0, 0, 7); g.fill(); g.beginPath(); g.arc(27.5, 3, 2.6, 0, 7); g.fill();
  return c;
}
function shipSprite(sc) { // trineu-canó vermell amb patins daurats
  const c = document.createElement('canvas'); c.width = 46 * sc; c.height = 30 * sc; const g = c.getContext('2d'); g.scale(sc, sc);
  // canó
  const cg = g.createLinearGradient(19, 0, 27, 0); cg.addColorStop(0, '#7a7f8c'); cg.addColorStop(.5, '#eef1f6'); cg.addColorStop(1, '#6b7080');
  g.fillStyle = cg; g.fillRect(19.5, 1, 7, 13); g.fillStyle = '#ffd24a'; g.fillRect(18.5, 0, 9, 3);
  // trineu
  const sg = g.createLinearGradient(0, 8, 0, 24); sg.addColorStop(0, '#ff5a6e'); sg.addColorStop(1, '#a3122c');
  g.fillStyle = sg; g.beginPath(); g.moveTo(4, 12); g.quadraticCurveTo(4, 8, 10, 9); g.lineTo(38, 9); g.quadraticCurveTo(44, 9, 43, 15); g.lineTo(41, 22); g.lineTo(7, 22); g.closePath(); g.fill();
  g.fillStyle = '#ffd24a'; g.fillRect(6, 14, 36, 2.4);
  g.fillStyle = '#1f9a4a'; g.beginPath(); g.arc(14, 17.5, 2.2, 0, 7); g.arc(23, 17.5, 2.2, 0, 7); g.arc(32, 17.5, 2.2, 0, 7); g.fill();
  // patins
  g.strokeStyle = '#f2c14e'; g.lineWidth = 2.4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(5, 27); g.lineTo(40, 27); g.quadraticCurveTo(46, 27, 45, 21); g.stroke();
  g.beginPath(); g.moveTo(12, 22); g.lineTo(12, 27); g.moveTo(34, 22); g.lineTo(34, 27); g.stroke();
  return c;
}
function ufoSprite(sc) { // plateret volador amb llumetes de Nadal
  const c = document.createElement('canvas'); c.width = 50 * sc; c.height = 24 * sc; const g = c.getContext('2d'); g.scale(sc, sc);
  g.fillStyle = '#bfe8ff'; g.globalAlpha = .9; g.beginPath(); g.ellipse(25, 9, 10, 8, 0, Math.PI, 0); g.fill(); g.globalAlpha = 1;
  const gr = g.createLinearGradient(0, 8, 0, 20); gr.addColorStop(0, '#ffe58a'); gr.addColorStop(1, '#c7891a');
  g.fillStyle = gr; g.beginPath(); g.ellipse(25, 13, 23, 7, 0, 0, 7); g.fill();
  ['#ff4d6d', '#4ade80', '#60a5fa', '#ffffff', '#ff4d6d'].forEach((k, i) => { g.fillStyle = k; g.beginPath(); g.arc(9 + i * 8, 14, 2.2, 0, 7); g.fill(); });
  return c;
}
function shade(hex, k) { const n = parseInt(hex.slice(1), 16); const f = v => Math.max(0, Math.min(255, Math.round(v * (1 + k)))); return `rgb(${f(n >> 16)},${f(n >> 8 & 255)},${f(n & 255)})`; }

// ---------------------------------------------------------------- el joc
export function openInvaders(ctx) {
  let alive = true, raf = 0;
  const bestKey = 'adv_inv_best_' + (S.user?.uid || '');
  const best = () => { try { return +localStorage.getItem(bestKey) || 0; } catch { return 0; } };
  const scoreEl = el('b', {}, '0'), barIn = el('div', { class: 'inv-barin' }), barTxt = el('span', { class: 'inv-bartxt' }), livesEl = el('div', { class: 'inv-lives' });
  const cv = el('canvas', { class: 'inv-cv' }), msg = el('div', { class: 'oca-msg' });
  const keys = { left: false, right: false, fire: false };
  const hold = (k, ico, cls, label) => {
    const b = el('button', { type: 'button', class: 'inv-key ' + cls + ' no-delay', 'aria-label': label }, ico);
    const on = e => { e.preventDefault(); unlockAudio(); keys[k] = true; b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch {} };
    const off = () => { keys[k] = false; b.classList.remove('on'); };
    b.addEventListener('pointerdown', on); ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, off));
    b.addEventListener('contextmenu', e => e.preventDefault());
    return b;
  };
  const pad = el('div', { class: 'inv-pad' },
    hold('left', '◀', 'inv-move', L('Izquierda', 'Esquerra', 'Left')),
    hold('fire', el('span', {}, '⚡', el('small', {}, L('¡LÁSER!', 'LÀSER!', 'LASER!'))), 'inv-fire', L('Disparar', 'Disparar', 'Fire')),
    hold('right', '▶', 'inv-move', L('Derecha', 'Dreta', 'Right')));
  const rulesBtn = el('button', { type: 'button', class: 'inv-rules no-delay', onclick: () => showRules() }, '📜 ' + L('Reglas', 'Normes', 'Rules'));
  const close = () => { alive = false; cancelAnimationFrame(raf); removeEventListener('keydown', kd); removeEventListener('keyup', ku); removeEventListener('resize', fit); wrap.classList.add('out'); document.documentElement.classList.remove('gm-lock'); setTimeout(() => wrap.remove(), 350); };
  const wrap = el('div', { class: 'oca-wrap inv-wrap' },
    el('div', { class: 'oca-snow' }),
    el('div', { class: 'oca-head' }, el('button', { type: 'button', class: 'cc8-x no-delay', onclick: () => close() }, '✕'), el('div', { class: 'oca-title' }, L('Los marcianitos de Navidad', 'Els marcianets de Nadal', 'Christmas space invaders'))),
    el('div', { class: 'inv-hud' }, el('div', { class: 'pm-box' }, el('small', {}, L('Puntos', 'Punts', 'Points')), scoreEl),
      el('div', { class: 'inv-bar' }, barIn, barTxt), livesEl, rulesBtn),
    el('div', { class: 'pm-stage' }, cv, msg), pad);
  document.body.append(wrap);
  document.documentElement.classList.add('gm-lock');
  const g = cv.getContext('2d');
  let K = 1, dpr = 1, SPR = null;
  function fit() {
    const w = Math.min(innerWidth * .96, 520), h = Math.max(260, innerHeight - 290);
    K = Math.min(w / W, h / H); dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(W * K * dpr); cv.height = Math.round(H * K * dpr); cv.style.width = Math.round(W * K) + 'px'; cv.style.height = Math.round(H * K) + 'px';
    g.setTransform(K * dpr, 0, 0, K * dpr, 0, 0);
    const sc = Math.max(1, Math.ceil(K * dpr));
    SPR = { al: ALCOL.map(c => [alienSprite(c, 0, sc), alienSprite(c, 1, sc)]), ship: shipSprite(sc), ufo: ufoSprite(sc) };
  }
  addEventListener('resize', fit); fit();

  // tecles i arrossegar el dit pel tauler
  const kd = e => { const k = { ArrowLeft: 'left', ArrowRight: 'right', ' ': 'fire', ArrowUp: 'fire' }[e.key]; if (k) { e.preventDefault(); keys[k] = true; } };
  const ku = e => { const k = { ArrowLeft: 'left', ArrowRight: 'right', ' ': 'fire', ArrowUp: 'fire' }[e.key]; if (k) keys[k] = false; };
  addEventListener('keydown', kd); addEventListener('keyup', ku);
  let dragX = null;
  const toX = e => { const r = cv.getBoundingClientRect(); return (e.clientX - r.left) / r.width * W; };
  cv.addEventListener('pointerdown', e => { unlockAudio(); dragX = toX(e); try { cv.setPointerCapture(e.pointerId); } catch {} });
  cv.addEventListener('pointermove', e => { if (dragX != null) dragX = toX(e); });
  ['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, () => { dragX = null; }));

  // ---- estat
  let score, lives, wave, ship, shots, bombs, aliens, dir, stepT, frame, shields, ufo, ufoT, parts, running = false, over = false, goalHit = false, cool = 0, bombT = 0, inv = 0, stars;
  stars = Array.from({ length: 50 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + .3, s: Math.random() * 12 + 4 }));
  function newWave() {
    aliens = [];
    const top = 64 + Math.min(3, wave - 1) * 14;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) aliens.push({ x: 26 + c * 38, y: top + r * 32, r, alive: true });
    dir = 1; stepT = 0; frame = 0; bombs = []; shots = [];
  }
  function newShields() {
    shields = [];
    const shape = ['..####..', '.######.', '########', '###..###'];
    [0, 1, 2, 3].forEach(i => { const ox = 32 + i * 84; shape.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') shields.push({ x: ox + x * 7, y: 400 + y * 7, hp: 3 }); })); });
  }
  function reset() {
    score = 0; lives = LIVES; wave = 1; goalHit = false; over = false; parts = []; ufo = null; ufoT = 12 + Math.random() * 8; inv = 0;
    ship = { x: W / 2 }; newWave(); newShields(); paintHud();
  }
  function paintHud() {
    scoreEl.textContent = score;
    const p = Math.min(1, score / GOAL); barIn.style.width = (p * 100) + '%';
    barTxt.textContent = score >= GOAL ? '⭐ ' + GOAL + ' ✅' : `⭐ ${score} / ${GOAL}`;
    rc(livesEl, ...Array.from({ length: LIVES }, (_, i) => el('span', { class: 'inv-life' + (i < lives ? '' : ' gone') }, '🛷')));
  }
  let msgT = 0;
  function say(txt, kind = 'goose', ms = 1500) { rc(msg, el('span', {}, txt)); msg.className = 'oca-msg on ' + kind; clearTimeout(msgT); msgT = setTimeout(() => msg.classList.remove('on'), ms); }
  const boomAt = (x, y, col, n = 14) => { for (let i = 0; i < n; i++) { const a = Math.random() * 7, v = 40 + Math.random() * 120; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: .5 + Math.random() * .4, col }); } };

  // ---- el bucle
  let last = 0;
  function loop(now) {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    stars.forEach(s => { s.y += s.s * dt; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } });
    if (running) step(dt);
    parts = parts.filter(p => (p.t -= dt) > 0); parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; });
    draw(now / 1000);
  }
  function step(dt) {
    // trineu
    const sp = 190;
    if (dragX != null) ship.x += Math.max(-sp * 1.6 * dt, Math.min(sp * 1.6 * dt, dragX - ship.x));
    if (keys.left) ship.x -= sp * dt; if (keys.right) ship.x += sp * dt;
    ship.x = Math.max(24, Math.min(W - 24, ship.x));
    if (inv > 0) inv -= dt;
    // disparar (mantenir premut = rànegues)
    cool -= dt;
    if (keys.fire && cool <= 0 && shots.length < 2) { shots.push({ x: ship.x, y: PY - 16 }); cool = .32; laser(); }
    shots.forEach(s => s.y -= 430 * dt);
    shots = shots.filter(s => s.y > -10);
    // marcianets: passos (més ràpids quan en queden pocs)
    const live = aliens.filter(a => a.alive);
    const interval = .05 + .62 * (live.length / (ROWS * COLS)) - Math.min(.12, (wave - 1) * .03);
    stepT += dt;
    if (stepT >= Math.max(.04, interval)) {
      stepT = 0; frame ^= 1;
      const minX = Math.min(...live.map(a => a.x)), maxX = Math.max(...live.map(a => a.x));
      if ((dir > 0 && maxX + 8 > W - 22) || (dir < 0 && minX - 8 < 22)) { dir = -dir; live.forEach(a => a.y += 14); }
      else live.forEach(a => a.x += dir * 8);
    }
    // bombes de neu
    bombT -= dt;
    if (bombT <= 0 && live.length) {
      bombT = Math.max(.35, 1.15 - wave * .12) * (.6 + Math.random() * .8);
      const cols = {}; live.forEach(a => { const k = Math.round(a.x); if (!cols[k] || cols[k].y < a.y) cols[k] = a; });
      const front = Object.values(cols); const near = front.sort((a, b) => Math.abs(a.x - ship.x) - Math.abs(b.x - ship.x));
      const a = Math.random() < .5 ? near[0] : front[Math.floor(Math.random() * front.length)];
      bombs.push({ x: a.x, y: a.y + 14, v: 120 + wave * 18 });
    }
    bombs.forEach(b => b.y += b.v * dt);
    bombs = bombs.filter(b => b.y < H + 10);
    // plateret
    ufoT -= dt;
    if (!ufo && ufoT <= 0) { const d = Math.random() < .5 ? 1 : -1; ufo = { x: d > 0 ? -30 : W + 30, y: 36, d, pts: [5, 10, 15][Math.floor(Math.random() * 3)] }; ufoT = 16 + Math.random() * 10; }
    if (ufo) { ufo.x += ufo.d * 70 * dt; if (ufo.x < -40 || ufo.x > W + 40) ufo = null; }
    // xocs: làser
    for (const s of shots) {
      let hit = false;
      for (const a of live) if (a.alive && Math.abs(a.x - s.x) < 14 && Math.abs(a.y - s.y) < 13) { a.alive = false; hit = true; addPts(ROWPTS[a.r], a.x, a.y); boomAt(a.x, a.y, ALCOL[a.r]); pop(); break; }
      if (!hit && ufo && Math.abs(ufo.x - s.x) < 22 && Math.abs(ufo.y - s.y) < 10) { hit = true; addPts(ufo.pts, ufo.x, ufo.y); boomAt(ufo.x, ufo.y, '#ffd24a', 24); chime(); say(`🛸 +${ufo.pts}!`, 'goose', 900); ufo = null; }
      if (!hit) for (const b of shields) if (b.hp > 0 && s.x > b.x - 1 && s.x < b.x + 8 && s.y > b.y && s.y < b.y + 8) { b.hp--; hit = true; break; }
      if (!hit) for (const b of bombs) if (Math.abs(b.x - s.x) < 5 && Math.abs(b.y - s.y) < 8) { b.y = H + 50; hit = true; boomAt(s.x, s.y, '#ffffff', 6); break; }
      if (hit) s.y = -99;
    }
    shots = shots.filter(s => s.y > -10);
    // xocs: bombes
    for (const b of bombs) {
      for (const sh of shields) if (sh.hp > 0 && b.x > sh.x - 2 && b.x < sh.x + 9 && b.y > sh.y - 2 && b.y < sh.y + 8) { sh.hp--; b.y = H + 50; break; }
      if (b.y < H && inv <= 0 && Math.abs(b.x - ship.x) < 18 && b.y > PY - 12 && b.y < PY + 14) { b.y = H + 50; hit(); return; }
    }
    // els marcianets es mengen els fortins de neu en passar-hi
    live.forEach(a => shields.forEach(sh => { if (sh.hp > 0 && Math.abs(sh.x + 3 - a.x) < 15 && Math.abs(sh.y + 3 - a.y) < 12) sh.hp = 0; }));
    // han arribat a baix?
    if (live.some(a => a.y > PY - 22)) { lives = 0; paintHud(); boom(); boomAt(ship.x, PY, '#ff5a6e', 30); return end(); }
    // onada acabada
    if (!aliens.some(a => a.alive)) nextWave();
  }
  function addPts(n) {
    score += n; paintHud();
    if (!goalHit && score >= GOAL) { goalHit = true; goal(); }
  }
  async function goal() {
    fanfare(); confetti(200);
    say('⭐ ' + GOAL + ' ' + L('¡puntos! ¡Lo has conseguido!', 'punts! Ho has aconseguit!', 'points! You did it!'), 'goose', 2600);
    try { ctx.won?.(); } catch {}
    try { const gm = await import('./gnomes.js'); const bs = await gm.gameBonusState('inv16'); if (bs) { if (!bs.doc) await gm.gameBonusStart(bs); await gm.gameBonusLevel(bs, 1); if (gm.gameBonusOwed(bs) > (bs.doc?.pts || 0)) G = { gm, bs }; } } catch (e) { console.warn(e); }
  }
  let G = null;
  async function nextWave() {
    running = false; wave++; chime();
    say('👽 ' + L(`¡Oleada ${wave}!`, `Onada ${wave}!`, `Wave ${wave}!`), 'goose', 1400);
    await sleep(1400); if (!alive || over) return;
    newWave(); running = true;
  }
  async function hit() {
    running = false; lives--; paintHud(); boom(); boomAt(ship.x, PY, '#ff5a6e', 30);
    try { navigator.vibrate?.(200); } catch {}
    if (lives <= 0) return end();
    say('❄️ ' + L('¡Te ha dado una bola de nieve!', 'T’ha tocat una bola de neu!', 'A snowball hit you!'), 'bad', 1400);
    await sleep(1400); if (!alive) return;
    bombs = []; shots = []; inv = 1.5; running = true;
  }

  // ---- dibuixar
  function draw(time) {
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#060b24'); bg.addColorStop(1, '#14275a');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff'; stars.forEach(s => { g.globalAlpha = .4 + .6 * Math.abs(Math.sin(time * 2 + s.x)); g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill(); }); g.globalAlpha = 1;
    // lluna i terra nevat
    g.fillStyle = '#fff6d6'; g.beginPath(); g.arc(320, 30, 14, 0, 7); g.fill(); g.fillStyle = '#060b24'; g.beginPath(); g.arc(326, 26, 12, 0, 7); g.fill();
    g.fillStyle = '#eaf4ff'; g.beginPath(); g.moveTo(0, H); g.lineTo(0, H - 14); for (let x = 0; x <= W; x += 30) g.quadraticCurveTo(x + 15, H - 22, x + 30, H - 14); g.lineTo(W, H); g.fill();
    if (!aliens) return;
    // fortins de neu
    shields.forEach(b => { if (b.hp <= 0) return; g.fillStyle = b.hp === 3 ? '#ffffff' : b.hp === 2 ? '#d6e9ff' : '#9fc3ee'; g.fillRect(b.x, b.y, 7, 7); });
    // marcianets
    aliens.forEach(a => { if (!a.alive) return; const s = SPR.al[a.r][frame]; g.drawImage(s, a.x - 17, a.y - 16, 34, 32); });
    if (ufo) g.drawImage(SPR.ufo, ufo.x - 25, ufo.y - 12, 50, 24);
    // làsers
    shots.forEach(s => { g.save(); g.shadowColor = '#ff3355'; g.shadowBlur = 10; g.fillStyle = '#ff6b81'; g.fillRect(s.x - 1.5, s.y - 10, 3, 14); g.fillStyle = '#fff'; g.fillRect(s.x - .6, s.y - 9, 1.2, 12); g.restore(); });
    // boles de neu
    bombs.forEach(b => { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(b.x, b.y, 4, 0, 7); g.fill(); g.fillStyle = '#b8d4ff'; g.beginPath(); g.arc(b.x + 1.2, b.y + 1.2, 1.8, 0, 7); g.fill(); });
    // trineu
    if (lives > 0 && !(inv > 0 && Math.floor(time * 10) % 2)) g.drawImage(SPR.ship, ship.x - 23, PY - 15, 46, 30);
    parts.forEach(p => { g.globalAlpha = Math.min(1, p.t * 2); g.fillStyle = p.col; g.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); }); g.globalAlpha = 1;
  }
  raf = requestAnimationFrame(loop);

  // ---- normes, inici, final
  function showRules(first = false) {
    const was = running; running = false;
    const box = el('div', { class: 'cc8-end' }, el('div', { class: 'cc8-endcard inv-rulescard' },
      el('h2', {}, '👽 ' + L('Los marcianitos de Navidad', 'Els marcianets de Nadal', 'Christmas space invaders')),
      el('ul', { class: 'inv-rl' },
        el('li', {}, '◀ ▶ ' + L('Mueve el trineo con las flechas (o arrastrando el dedo por el tablero).', 'Mou el trineu amb les fletxes (o arrossegant el dit pel tauler).', 'Move the sleigh with the arrows (or drag on the board).')),
        el('li', {}, '⚡ ' + L('Pulsa el botón rojo LÁSER para disparar. Si lo mantienes pulsado, dispara seguido.', 'Prem el botó vermell LÀSER per disparar. Si el mantens premut, dispara seguit.', 'Press the red LASER button to fire. Hold it to keep firing.')),
        el('li', {}, '👽 ' + L('Marcianitos: abajo 1 punto, en medio 2, arriba 3. El platillo volador 🛸: 5, 10 o 15.', 'Marcianets: a baix 1 punt, al mig 2, a dalt 3. El plateret volador 🛸: 5, 10 o 15.', 'Invaders: bottom 1 point, middle 2, top 3. The flying saucer 🛸: 5, 10 or 15.')),
        el('li', {}, '❄️ ' + L('Te tiran bolas de nieve: escóndete detrás de los fuertes de nieve. Tienes 3 trineos 🛷.', 'Et tiren boles de neu: amaga’t darrere els fortins de neu. Tens 3 trineus 🛷.', 'They throw snowballs: hide behind the snow forts. You have 3 sleighs 🛷.')),
        el('li', {}, '⬇️ ' + L('Si los marcianitos llegan abajo, se acaba la partida.', 'Si els marcianets arriben a baix, s’acaba la partida.', 'If the invaders reach the bottom, the game ends.')),
        el('li', { class: 'inv-rlgoal' }, '⭐ ' + L(`Llega a ${GOAL} puntos: suma al Marcador de Navidad (+2 la 1.ª vez, +1 las siguientes).`, `Arriba a ${GOAL} punts: suma al Marcador de Nadal (+2 la 1a vegada, +1 les següents).`, `Reach ${GOAL} points: Christmas scoreboard points (+2 the first time, +1 after).`)),
        el('li', { class: 'inv-rlgoal' }, '🍄 ' + L(`Gnomos: la 1.ª vez que llegáis a ${GOAL}, ¡puntos para vuestro juego!`, `Gnoms: la 1a vegada que arribeu a ${GOAL}, punts per al vostre joc!`, `Gnomes: the first time you reach ${GOAL}, points for your game!`))),
      el('div', { class: 'cc8-endbtns' },
        el('button', { type: 'button', class: 'btn btn-big no-delay', onclick: () => { box.remove(); if (first) start(); else running = was; } }, first ? '🚀 ' + L('¡A jugar!', 'A jugar!', 'Play!') : '👍 ' + L('Seguir', 'Continuar', 'Continue')),
        first ? el('button', { type: 'button', class: 'btn btn-ghost no-delay', onclick: () => close() }, '⏰ ' + L('Lo haré más tarde', 'Ho faré més tard', 'Later')) : null)));
    wrap.append(box);
  }
  async function start() {
    reset(); running = false;
    for (const n of ['3', '2', '1', L('¡Fuego!', 'Foc!', 'Fire!')]) { if (!alive) return; say(n, 'goose', 600); clickSound(); await sleep(620); }
    if (alive) running = true;
  }
  async function end() {
    if (over) return; over = true; running = false;
    await sleep(900); if (!alive) return;
    const b0 = best(), rec = score > b0; if (rec) try { localStorage.setItem(bestKey, score); } catch {}
    if (goalHit) { fanfare(); confetti(200); } else sadTrombone();
    const lines = [goalHit ? '⭐ ' + L(`¡Has llegado a ${GOAL} puntos! Suma al Marcador de Navidad.`, `Has arribat a ${GOAL} punts! Suma al Marcador de Nadal.`, `You reached ${GOAL} points! Scoreboard points added.`)
      : '⭐ ' + L(`Para el Marcador de Navidad hacen falta ${GOAL} puntos. ¡Inténtalo otra vez!`, `Per al Marcador de Nadal calen ${GOAL} punts. Torna-ho a provar!`, `You need ${GOAL} points for the scoreboard. Try again!`)];
    const card = el('div', { class: 'cc8-endcard' },
      el('div', { class: 'cc8-bigstar' }, goalHit ? '🏆' : '👽'),
      el('h2', {}, goalHit ? L('¡Campeón de los marcianitos!', 'Campió dels marcianets!', 'Invader champion!') : L('¡Fin de la partida!', 'Fi de la partida!', 'Game over!')),
      el('p', { class: 'cc8-endpts' }, L('Puntos', 'Punts', 'Points') + ': ', el('b', {}, score), ' · ' + L('oleada', 'onada', 'wave') + ' ' + wave),
      el('p', { class: 'cc8-rec' }, '🏆 ' + (rec ? L('¡Nuevo récord!', 'Nou rècord!', 'New record!') : L('Tu récord', 'El teu rècord', 'Your best') + ': ' + Math.max(b0, score))),
      ...lines.map(x => el('p', { class: 'cc8-rec cc8-ptinfo' }, x)));
    if (G) {
      const claim = el('button', { type: 'button', class: 'cc8-gn ready no-delay' }, el('img', { src: 'gnomo.png', alt: '' }),
        el('span', {}, el('b', {}, `🍄 ${L('¡Pulsa y cobra', 'Prem i cobra', 'Tap to get')} +${G.gm.gameBonusOwed(G.bs) - (G.bs.doc?.pts || 0)}!`), el('small', {}, L('para tu juego de los gnomos', 'per al teu joc dels gnoms', 'for your gnome game'))));
      const g0 = G;
      claim.onclick = async () => { claim.disabled = true; try { const add = await g0.gm.gameBonusClaim(g0.bs); if (add) { fanfare(); confetti(160); } } catch (e) { console.warn(e); claim.disabled = false; return; }
        claim.replaceWith(el('p', { class: 'cc8-rec' }, '🍄 ' + L('¡Puntos cobrados!', 'Punts cobrats!', 'Points collected!') + ' ✅')); };
      card.append(claim); G = null;
    }
    card.append(el('div', { class: 'cc8-endbtns' },
      el('button', { type: 'button', class: 'btn btn-big no-delay', onclick: () => { box.remove(); start(); } }, '🔄 ' + L('Jugar otra vez', 'Tornar a jugar', 'Play again')),
      el('button', { type: 'button', class: 'btn btn-ghost no-delay', onclick: () => close() }, '🎓 ' + L('Volver al diploma', 'Tornar al diploma', 'Back to the diploma'))));
    const box = el('div', { class: 'cc8-end' }, card);
    wrap.append(box);
  }
  reset(); running = false;
  showRules(true);
}
