// Día 4: busca los 5 renos con gafas negras entre ~1000 renos
import { t, getLang } from './i18n.js?v=17.14';
import { el, popup, starBurst, toast } from './fx.js?v=17.14';
import { chime, pop, wrong } from './sound.js?v=17.14';
import { figure } from './app.js?v=17.14';

const W = 1600, H = 1100, COLS = 40, ROWS = 25;

function rnd(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

// renos pintados al estilo del calendario (el reno de la casilla 6)
const SPR = {};
const sprite = (src, hgt = 160) => new Promise(res => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.height = hgt; c.width = Math.round(hgt * i.width / i.height); c.getContext('2d').drawImage(i, 0, 0, c.width, c.height); res(c); }; i.onerror = () => res(null); i.src = src; });
const ready = Promise.all([['deer', 'ilu-6.webp'], ['green', 'ilu-6-verde.webp'], ['blue', 'ilu-6-azul.webp'], ['hat', 'ilu-gorro.webp', 80], ['gift', 'ilu-4.webp', 60]]
  .map(([k, s, h]) => sprite(s, h).then(c => { SPR[k] = c; })));
const DW = 40, DH = 42;                               // tamaño del reno en el lienzo
const EYE_L = [.615, .482], EYE_R = [.835, .446], NOSE = [.82, .558];
const headOf = d => [d.x + (.72 - .5) * DW * d.s * (d.flip ? -1 : 1), d.y + (.47 - .5) * DH * d.s];

function drawReindeer(x, c, s, flip, acc, r) {
  const img = acc === 'scarf' ? (r < .5 ? SPR.green : SPR.blue) : SPR.deer;
  if (!img) return;
  c.save(); c.translate(x[0], x[1]); c.scale(flip ? -s : s, s);
  const w = DW, h = DH, X = u => -w / 2 + u * w, Y = v => -h / 2 + v * h;
  if (acc === 'ski') { c.strokeStyle = '#b3122e'; c.lineWidth = 2.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(X(.05), Y(1)); c.lineTo(X(.95), Y(1)); c.stroke(); }
  c.drawImage(img, -w / 2, -h / 2, w, h);
  const [lx, ly] = [X(EYE_L[0]), Y(EYE_L[1])], [rx, ry] = [X(EYE_R[0]), Y(EYE_R[1])];
  if (acc === 'black' || acc === 'redglasses' || acc === 'brownglasses') {
    const col = acc === 'black' ? '#0b0b0b' : acc === 'redglasses' ? '#d01818' : '#6b3e17';
    c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 1.1;
    c.beginPath(); c.ellipse(lx, ly, 3.6, 2.9, -.2, 0, 7); c.fill(); c.beginPath(); c.ellipse(rx, ry, 3.2, 2.7, -.2, 0, 7); c.fill();
    c.beginPath(); c.moveTo(lx + 3, ly - .8); c.lineTo(rx - 2.8, ry); c.moveTo(lx - 3.4, ly - .5); c.lineTo(X(.47), Y(.43)); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.arc(lx - 1.2, ly - 1, .8, 0, 7); c.arc(rx - 1.1, ry - 1, .7, 0, 7); c.fill();
  } else if (acc === 'specs') {
    c.strokeStyle = '#2a2a2a'; c.lineWidth = .8; c.beginPath(); c.arc(lx, ly, 3.2, 0, 7); c.moveTo(rx + 2.9, ry); c.arc(rx, ry, 2.9, 0, 7); c.moveTo(lx + 3.2, ly); c.lineTo(rx - 2.9, ry); c.stroke();
  } else if (acc === 'rednose') {
    const g = c.createRadialGradient(X(NOSE[0]) - .6, Y(NOSE[1]) - .6, .2, X(NOSE[0]), Y(NOSE[1]), 3.2); g.addColorStop(0, '#ff9a9a'); g.addColorStop(.5, '#ff1a1a'); g.addColorStop(1, '#a00');
    c.fillStyle = g; c.beginPath(); c.arc(X(NOSE[0]), Y(NOSE[1]), 3, 0, 7); c.fill();
  } else if (acc === 'hat' && SPR.hat) {
    const hw = w * .55, hh = hw * SPR.hat.height / SPR.hat.width; c.drawImage(SPR.hat, X(.42), Y(.12), hw, hh);
  } else if (acc === 'gift' && SPR.gift) {
    const gw = w * .36, gh = gw * SPR.gift.height / SPR.gift.width; c.drawImage(SPR.gift, X(-.08), Y(1) - gh, gw, gh);
  } else if (acc === 'sleep') {
    c.save(); c.scale(flip ? -1 : 1, 1); c.fillStyle = '#3a6ea5'; c.font = 'bold 9px serif'; c.fillText('z', flip ? -X(.98) : X(.95), Y(.12)); c.font = 'bold 6px serif'; c.fillText('z', flip ? -X(1.1) - 3 : X(1.05) + 3, Y(.02)); c.restore();
  } else if (acc === 'ball') {
    const g = c.createRadialGradient(X(.08) - 1, Y(.78) - 1, .3, X(.08), Y(.78), 4); g.addColorStop(0, '#fff'); g.addColorStop(1, '#c9d8ea');
    c.fillStyle = g; c.beginPath(); c.arc(X(.08), Y(.78), 4, 0, 7); c.fill();
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
      const [hx, hy] = headOf(d); c.strokeStyle = '#ffcc00'; c.lineWidth = 4; c.beginPath(); c.arc(hx, hy, 22, 0, 7); c.stroke();
    });
    // pista: se oscurece todo menos una zona (no muy grande) donde está el próximo reno
    if (hint && performance.now() < hint.until) {
      c.save(); c.fillStyle = 'rgba(20,10,30,.55)'; c.beginPath(); c.rect(0, 0, W, H); c.moveTo(hint.x + hint.r, hint.y); c.arc(hint.x, hint.y, hint.r, 0, Math.PI * 2, true); c.closePath(); c.fill('evenodd');
      const gl = c.createRadialGradient(hint.x, hint.y, hint.r * .75, hint.x, hint.y, hint.r * 1.05); gl.addColorStop(0, 'rgba(255,214,90,0)'); gl.addColorStop(1, 'rgba(255,214,90,.55)');
      c.fillStyle = gl; c.beginPath(); c.arc(hint.x, hint.y, hint.r * 1.05, 0, 7); c.fill();
      c.strokeStyle = '#ffd24a'; c.lineWidth = 5; c.setLineDash([14, 10]); c.beginPath(); c.arc(hint.x, hint.y, hint.r, 0, 7); c.stroke(); c.restore();
    }
  };
  let hint = null;
  draw(); ready.then(draw);

  const counter = el('div', {}, t('d4count', 0));
  const L3 = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
  // cuando faltan 3 renos (o menos): botón de pista
  const hintBtn = el('button', { class: 'btn small-btn btn-green no-delay d4-hint', style: 'display:none', onclick: () => {
    const left = deer.filter(d => d.target && !d.found); if (!left.length) return;
    const d = left[Math.floor(Math.random() * left.length)], [hx, hy] = headOf(d);
    const r = 165, a = Math.random() * Math.PI * 2, off = r * (.25 + Math.random() * .4); // el reno no queda en el centro justo
    hint = { x: Math.max(r * .6, Math.min(W - r * .6, hx + Math.cos(a) * off)), y: Math.max(r * .6, Math.min(H - r * .6, hy + Math.sin(a) * off)), r, until: performance.now() + 5000 };
    // se mueve la vista para que la zona se vea
    { const vw = scroll.clientWidth, vh = scroll.clientHeight;
      zoom = Math.max(1, Math.min(zoom, Math.min(vw, vh) * .8 / (2 * r / W * base)));   // que el círculo quepa en la pantalla
      const w = base * zoom, h = w * H / W; tx = vw / 2 - hint.x / W * w; ty = vh / 2 - hint.y / H * h; apply(); }
    draw(); chime(); clearTimeout(hintBtn._t); hintBtn._t = setTimeout(draw, 5100);
  } }, '💡 ' + L3('Pista', 'Pista', 'Hint'));
  const showHint = () => { hintBtn.style.display = !finished && found >= 2 && found < 5 ? '' : 'none'; };
  // zoom y desplazamiento propios: un dedo arrastra, dos dedos pellizcan, toque = pulsar reno
  const scroll = el('div', { class: 'reindeer-scroll' }, cv);
  let zoom = 1, tx = 0, ty = 0, base = 0;
  const clamp = () => {
    const vw = scroll.clientWidth, vh = scroll.clientHeight, w = base * zoom, h = w * H / W;
    tx = Math.min(0, Math.max(vw - w, tx)); ty = h > vh ? Math.min(0, Math.max(vh - h, ty)) : (vh - h) / 2;
  };
  const apply = () => { clamp(); cv.style.width = base * zoom + 'px'; cv.style.height = base * zoom * H / W + 'px'; cv.style.transform = `translate(${tx}px,${ty}px)`; };
  const zoomAt = (nz, px, py) => { nz = Math.max(1, Math.min(6, nz)); const k = nz / zoom; tx = px - (px - tx) * k; ty = py - (py - ty) * k; zoom = nz; apply(); };
  const center = () => [scroll.clientWidth / 2, scroll.clientHeight / 2];
  const zoomBar = el('div', { class: 'zoom-bar' },
    el('button', { onclick: () => zoomAt(zoom / 1.5, ...center()) }, '−'),
    el('span', {}, t('zoomHelp')),
    el('button', { onclick: () => zoomAt(zoom * 1.5, ...center()) }, '+'));
  body.append(el('h2', { class: 'q-title' }, t('d4title')), el('p', { class: 'game-help' }, t('d4help')),
    el('div', { class: 'game-stats' }, counter, hintBtn), zoomBar, scroll);
  requestAnimationFrame(() => { base = scroll.clientWidth || 800; zoomAt(Math.max(1, 1000 / base), ...center()); });
  const pts = new Map(); let g0 = null, moved = 0;
  const local = (x, y) => { const r = scroll.getBoundingClientRect(); return [x - r.left, y - r.top]; };
  const gest = () => { const p = [...pts.values()]; return p.length > 1 ? { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2, d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) } : { x: p[0].x, y: p[0].y, d: 0 }; };
  const startG = () => { g0 = { ...gest(), tx, ty, zoom }; };
  scroll.addEventListener('pointerdown', e => { e.preventDefault(); try { scroll.setPointerCapture(e.pointerId); } catch {} pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 1) moved = 0; startG(); });
  scroll.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId) || !g0) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gest(); moved = Math.max(moved, Math.hypot(g.x - g0.x, g.y - g0.y) + (g.d && g0.d ? Math.abs(g.d - g0.d) : 0));
    if (g.d && g0.d) { const [px, py] = local(g0.x, g0.y); zoom = g0.zoom; tx = g0.tx; ty = g0.ty; zoomAt(g0.zoom * g.d / g0.d, px, py); }
    if (g.d && g0.d) { tx += g.x - g0.x; ty += g.y - g0.y; }
    if (!(g.d && g0.d)) { tx = g0.tx + g.x - g0.x; ty = g0.ty + g.y - g0.y; }
    apply();
  });
  const up = e => {
    const single = pts.size === 1 && moved < 8 && e.type === 'pointerup';
    pts.delete(e.pointerId);
    if (single) tap(e.clientX, e.clientY);
    if (pts.size) startG(); else g0 = null;
  };
  scroll.addEventListener('pointerup', up); scroll.addEventListener('pointercancel', up);
  scroll.addEventListener('wheel', e => { e.preventDefault(); const [px, py] = local(e.clientX, e.clientY); zoomAt(zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), px, py); }, { passive: false });
  setTimeout(() => popup(`<h2>🦌🕶️</h2><p style="font-size:20px">${t('d4help')}</p>`, { buttons: [{ label: '¡OK!', value: 1 }] }), 1600);

  let found = 0, finished = !!ctx.prev;
  if (finished) { deer.filter(d => d.target).forEach(d => d.found = true); found = 5; counter.textContent = t('d4count', 5); draw(); }
  function tap(cx, cy) {
    const e = { clientX: cx, clientY: cy };
    if (finished) return;
    const rect = cv.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * W, y = (e.clientY - rect.top) / rect.height * H;
    const hit = deer.find(d => { if (!d.target || d.found) return false; const [hx, hy] = headOf(d); return Math.hypot(hx - x, hy - y) < 24; });
    if (hit) {
      hit.found = true; found++; draw(); pop(); starBurst(e.clientX, e.clientY);
      counter.textContent = t('d4count', found); hint = null; showHint();
      if (found === 2) setTimeout(() => toast('💡 ' + L3('Si te cuesta encontrarlos, pulsa «Pista».', 'Si et costa trobar-los, prem «Pista».', 'If you can’t find them, tap “Hint”.'), 3500), 900);
      if (found === 5) {
        finished = true; chime();
        ctx.submit({ answer: '5/5', status: 'correct' });
        setTimeout(async () => { await popup(`<h2>🏆</h2><p class="prize-text">${t('prizeGot')[figure()]}</p>`); ctx.finish(); }, 900);
      }
    } else wrong();
  }
}
