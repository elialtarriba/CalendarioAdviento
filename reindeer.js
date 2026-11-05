// Día 4: busca los 5 renos con gafas negras entre ~1000 renos
import { t } from './i18n.js?v=4';
import { el, popup, starBurst } from './fx.js?v=4';
import { chime, pop, wrong } from './sound.js?v=4';
import { figure } from './app.js?v=4';

const W = 1600, H = 1100, COLS = 40, ROWS = 25;

function rnd(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

function drawReindeer(x, c, s, flip, acc, r) {
  c.save(); c.translate(x[0], x[1]); c.scale(flip ? -s : s, s);
  // patas
  c.strokeStyle = '#5a3a1c'; c.lineWidth = 2.2; c.lineCap = 'round';
  [[-7, 1], [-3, -1], [4, 1], [8, -1]].forEach(([lx, k]) => { c.beginPath(); c.moveTo(lx, 10); c.lineTo(lx + k, 19); c.stroke(); });
  if (acc === 'ski') { c.strokeStyle = '#d62828'; c.lineWidth = 2; c.beginPath(); c.moveTo(-14, 20); c.lineTo(14, 20); c.stroke(); }
  // cuerpo
  c.fillStyle = r < .5 ? '#9a6232' : '#83522a';
  c.beginPath(); c.ellipse(1, 6, 12, 7.5, 0, 0, 7); c.fill();
  c.fillStyle = '#f1dcc0'; c.beginPath(); c.ellipse(-3, 9, 6, 3, 0, 0, 7); c.fill();
  // cola
  c.fillStyle = '#f5e6d0'; c.beginPath(); c.arc(13, 3, 2.5, 0, 7); c.fill();
  // cuello y cabeza
  c.fillStyle = '#8b5a2b'; c.beginPath(); c.ellipse(-9, -1, 4, 7, -.5, 0, 7); c.fill();
  c.beginPath(); c.arc(-12, -7, 6.2, 0, 7); c.fill();
  c.fillStyle = '#c99a6b'; c.beginPath(); c.ellipse(-17, -5, 4, 3.2, 0, 0, 7); c.fill();
  // cuernos
  c.strokeStyle = '#6b4423'; c.lineWidth = 1.8;
  c.beginPath(); c.moveTo(-10, -12); c.lineTo(-7, -20); c.moveTo(-8.4, -16); c.lineTo(-4, -18); c.moveTo(-7, -20); c.lineTo(-9, -24);
  c.moveTo(-13, -12); c.lineTo(-15, -20); c.moveTo(-14.3, -16.5); c.lineTo(-18, -18); c.stroke();
  // oreja
  c.fillStyle = '#7a4a22'; c.beginPath(); c.ellipse(-6, -10, 3, 1.6, -.6, 0, 7); c.fill();
  // ojo y nariz
  c.fillStyle = '#1a1a1a'; c.beginPath(); c.arc(-13, -8.5, 1.2, 0, 7); c.fill();
  c.fillStyle = acc === 'rednose' ? '#ff1a1a' : '#2b1a10'; c.beginPath(); c.arc(-20.5, -5.5, acc === 'rednose' ? 2.2 : 1.6, 0, 7); c.fill();
  // complementos
  if (acc === 'black' || acc === 'redglasses' || acc === 'brownglasses') {
    c.fillStyle = acc === 'black' ? '#000' : acc === 'redglasses' ? '#e01b1b' : '#5b3a1a';
    c.beginPath(); c.ellipse(-15.8, -8.5, 2.9, 2.3, 0, 0, 7); c.ellipse(-10.4, -8.5, 2.9, 2.3, 0, 0, 7); c.fill();
    c.strokeStyle = c.fillStyle; c.lineWidth = 1.3; c.beginPath(); c.moveTo(-13.2, -9); c.lineTo(-12.9, -9); c.moveTo(-7.6, -9); c.lineTo(-5, -10); c.stroke();
    if (acc === 'black') { c.fillStyle = '#ffffffaa'; c.beginPath(); c.arc(-16.6, -9.3, .8, 0, 7); c.arc(-11.2, -9.3, .8, 0, 7); c.fill(); }
  } else if (acc === 'specs') {
    c.strokeStyle = '#333'; c.lineWidth = .9; c.beginPath(); c.arc(-15.8, -8.5, 2.6, 0, 7); c.moveTo(-7.8, -8.5); c.arc(-10.4, -8.5, 2.6, 0, 7); c.stroke();
  } else if (acc === 'hat') {
    c.fillStyle = '#d62828'; c.beginPath(); c.moveTo(-18, -11); c.lineTo(-6, -12); c.lineTo(-4, -22); c.closePath(); c.fill();
    c.fillStyle = '#fff'; c.fillRect(-18.5, -12.5, 13, 2.5); c.beginPath(); c.arc(-4, -22, 2, 0, 7); c.fill();
  } else if (acc === 'scarf') {
    c.fillStyle = r < .5 ? '#2a9d62' : '#1d6fd1'; c.fillRect(-12, -2, 7, 3.4); c.fillRect(-8, 0, 2.5, 7);
  } else if (acc === 'gift') {
    c.fillStyle = r < .5 ? '#e63946' : '#ffb703'; c.fillRect(-26, 4, 9, 8); c.fillStyle = '#fff'; c.fillRect(-22, 4, 1.6, 8); c.fillRect(-26, 7.3, 9, 1.6);
  } else if (acc === 'sleep') {
    c.save(); c.scale(flip ? -1 : 1, 1); c.fillStyle = '#3a6ea5'; c.font = 'bold 9px sans-serif'; c.fillText('z', flip ? 10 : -26, -18); c.font = 'bold 6px sans-serif'; c.fillText('z', flip ? 15 : -21, -23); c.restore();
  } else if (acc === 'ball') {
    c.fillStyle = '#fff'; c.strokeStyle = '#9bb'; c.lineWidth = .8; c.beginPath(); c.arc(-24, -4, 3.5, 0, 7); c.fill(); c.stroke();
  }
  c.restore();
}

export function render(body, ctx) {
  const rand = rnd(1000 + Math.floor(Math.random() * 99999));
  const deer = [];
  for (let r = 0; r < ROWS; r++) for (let k = 0; k < COLS; k++) {
    const x = (k + .5) * W / COLS + (rand() - .5) * 14, y = (r + .5) * H / ROWS + (rand() - .5) * 10 + 6;
    const p = rand();
    const acc = p < .05 ? 'redglasses' : p < .08 ? 'brownglasses' : p < .12 ? 'specs' : p < .2 ? 'hat' : p < .28 ? 'scarf' : p < .34 ? 'gift' : p < .39 ? 'rednose' : p < .43 ? 'sleep' : p < .47 ? 'ski' : p < .5 ? 'ball' : 'none';
    deer.push({ x, y, s: .78 + rand() * .22, flip: rand() < .5, acc, r: rand(), target: false });
  }
  const idx = new Set(); while (idx.size < 5) idx.add(Math.floor(rand() * deer.length));
  idx.forEach(i => { deer[i].acc = 'black'; deer[i].target = true; });

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const cv = el('canvas', { width: W * dpr, height: H * dpr });
  const c = cv.getContext('2d'); c.scale(dpr, dpr);
  const draw = () => {
    c.clearRect(0, 0, W, H);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#eaf5ff'); g.addColorStop(1, '#ffffff'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = '#cfe4f7'; for (let i = 0; i < 500; i++) { c.beginPath(); c.arc((i * 997) % W, (i * 613) % H, 1.5, 0, 7); c.fill(); }
    deer.forEach(d => drawReindeer([d.x, d.y], c, d.s, d.flip, d.acc, d.r));
    deer.filter(d => d.found).forEach(d => {
      c.strokeStyle = '#ffcc00'; c.lineWidth = 4; c.beginPath(); c.arc(d.x - (d.flip ? -12 : 12) * d.s, d.y - 4, 22, 0, 7); c.stroke();
    });
  };
  draw();

  const counter = el('div', {}, t('d4count', 0));
  const scroll = el('div', { class: 'reindeer-scroll' }, cv);
  let zoom = 1;
  const applyZoom = () => { const base = scroll.clientWidth || 800; const w = Math.max(base, base * zoom); cv.style.width = w + 'px'; cv.style.height = w * H / W + 'px'; };
  const zoomBar = el('div', { class: 'zoom-bar' },
    el('button', { onclick: () => { zoom = Math.max(1, zoom / 1.4); applyZoom(); } }, '−'),
    el('span', {}, t('zoomHelp')),
    el('button', { onclick: () => { zoom = Math.min(5, zoom * 1.4); applyZoom(); } }, '+'));
  body.append(el('h2', { class: 'q-title' }, t('d4title')), el('p', { class: 'game-help' }, t('d4help')),
    el('div', { class: 'game-stats' }, counter), zoomBar, scroll);
  requestAnimationFrame(() => { zoom = Math.max(1, 1000 / (scroll.clientWidth || 1000)); applyZoom(); });
  setTimeout(() => popup(`<h2>🦌🕶️</h2><p style="font-size:20px">${t('d4help')}</p>`, { buttons: [{ label: '¡OK!', value: 1 }] }), 1600);

  let found = 0, finished = !!ctx.prev;
  if (finished) { deer.filter(d => d.target).forEach(d => d.found = true); found = 5; counter.textContent = t('d4count', 5); draw(); }
  cv.addEventListener('click', e => {
    if (finished) return;
    const rect = cv.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * W, y = (e.clientY - rect.top) / rect.height * H;
    const hit = deer.find(d => d.target && !d.found && Math.hypot(d.x - (d.flip ? -12 : 12) * d.s - x, d.y - 6 - y) < 26);
    if (hit) {
      hit.found = true; found++; draw(); pop(); starBurst(e.clientX, e.clientY);
      counter.textContent = t('d4count', found);
      if (found === 5) {
        finished = true; chime();
        ctx.submit({ answer: '5/5', status: 'correct' });
        setTimeout(async () => { await popup(`<h2>🏆</h2><p class="prize-text">${t('prizeGot')[figure()]}</p>`); ctx.finish(); }, 900);
      }
    } else wrong();
  });
}
