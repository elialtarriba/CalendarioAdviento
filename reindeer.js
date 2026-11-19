// Día 4: busca los 5 renos con gafas negras entre ~1000 renos
import { t, getLang } from './i18n.js';
import { el, popup, starBurst, toast } from './fx.js';
import { chime, pop, oops } from './sound.js';
import { figure } from './app.js';

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

  // (V23.6) lienzo con más resolución: al acercarse con los dedos se ve nítido
  const dpr = Math.min(2.5, Math.max(1.5, (window.devicePixelRatio || 1) * 1.25));
  const cv = el('canvas', { width: Math.round(W * dpr), height: Math.round(H * dpr) });
  const c = cv.getContext('2d'); c.scale(dpr, dpr);
  const draw = () => {
    c.clearRect(0, 0, W, H);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#eaf5ff'); g.addColorStop(1, '#ffffff'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = '#cfe4f7'; for (let i = 0; i < 500; i++) { c.beginPath(); c.arc((i * 997) % W, (i * 613) % H, 1.5, 0, 7); c.fill(); }
    deer.forEach(d => drawReindeer([d.x, d.y], c, d.s, d.flip, d.acc, d.r));
    deer.filter(d => d.found).forEach(d => {
      const [hx, hy] = headOf(d); c.strokeStyle = '#ffcc00'; c.lineWidth = 4; c.beginPath(); c.arc(hx, hy, 22, 0, 7); c.stroke();
    });
    // pista: se oscurece todo menos una zona donde está el reno
    if (hint && performance.now() < hint.until) {
      c.save(); c.fillStyle = 'rgba(20,10,30,.55)'; c.beginPath(); c.rect(0, 0, W, H); c.moveTo(hint.x + hint.r, hint.y); c.arc(hint.x, hint.y, hint.r, 0, Math.PI * 2, true); c.closePath(); c.fill('evenodd');
      const gl = c.createRadialGradient(hint.x, hint.y, hint.r * .75, hint.x, hint.y, hint.r * 1.05); gl.addColorStop(0, 'rgba(255,214,90,0)'); gl.addColorStop(1, 'rgba(255,214,90,.55)');
      c.fillStyle = gl; c.beginPath(); c.arc(hint.x, hint.y, hint.r * 1.05, 0, 7); c.fill();
      c.strokeStyle = '#ffd24a'; c.lineWidth = 5; c.setLineDash([14, 10]); c.beginPath(); c.arc(hint.x, hint.y, hint.r, 0, 7); c.stroke(); c.restore();
    }
  };
  let hint = null;
  draw(); ready.then(draw);

  const L3 = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
  const counter = el('div', {}, t('d4count', 0));

  // ---------- vista: el lienzo se mueve y se agranda con transform (fluido con los dedos) ----------
  const stage = el('div', { class: 'd4-stage' }, cv);           // lienzo + marcas, se mueven juntos
  const scroll = el('div', { class: 'reindeer-scroll d4-view' }, stage);
  let zoom = 1, tx = 0, ty = 0, base = 0, zoom0 = 1, raf = 0, anim = null;
  const ZMAX = 7;
  const vwh = () => [scroll.clientWidth || 1, scroll.clientHeight || 1];
  const clamp = () => {
    const [vw, vh] = vwh(), w = base * zoom, h = w * H / W;
    tx = w > vw ? Math.min(0, Math.max(vw - w, tx)) : (vw - w) / 2;
    ty = h > vh ? Math.min(0, Math.max(vh - h, ty)) : (vh - h) / 2;
  };
  const paint = () => { raf = 0; stage.style.transform = `translate3d(${tx}px,${ty}px,0) scale(${zoom})`; stage.style.setProperty('--z', zoom); };
  const apply = () => { clamp(); if (!raf) raf = requestAnimationFrame(paint); };
  const stopAnim = () => { if (anim) { cancelAnimationFrame(anim); anim = null; } };
  // movimiento suave hasta una vista (botones, pista, volver)
  const animateTo = (nz, ntx, nty, ms = 380) => {
    stopAnim(); stopFling();
    const z1 = zoom, x1 = tx, y1 = ty, t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      zoom = z1 + (nz - z1) * e; tx = x1 + (ntx - x1) * e; ty = y1 + (nty - y1) * e; clamp(); paint();
      anim = k < 1 ? requestAnimationFrame(step) : null;
    };
    anim = requestAnimationFrame(step);
  };
  // vista para que el punto (x, y) del dibujo quede en (px, py) de la pantalla con el zoom nz
  const viewFor = (nz, x, y, px, py) => { nz = Math.max(1, Math.min(ZMAX, nz)); const w = base * nz, h = w * H / W; return [nz, px - x / W * w, py - y / H * h]; };
  const zoomBy = f => { const [vw, vh] = vwh(); const cx = (vw / 2 - tx) / (base * zoom) * W, cy = (vh / 2 - ty) / (base * zoom * H / W) * H; animateTo(...viewFor(zoom * f, cx, cy, vw / 2, vh / 2), 260); };
  const home = () => { const [vw, vh] = vwh(); animateTo(...viewFor(zoom0, W / 2, H / 2, vw / 2, vh / 2)); };
  const whole = () => { const [vw, vh] = vwh(); animateTo(...viewFor(1, W / 2, H / 2, vw / 2, vh / 2)); };

  const zoomBar = el('div', { class: 'd4-zoom' },
    el('button', { type: 'button', class: 'no-delay', 'aria-label': '−', onclick: () => zoomBy(1 / 1.6) }, '−'),
    el('button', { type: 'button', class: 'no-delay d4-home', onclick: home }, '⟲ ' + L3('Como estaba', 'Com estava', 'Reset')),
    el('button', { type: 'button', class: 'no-delay d4-home', onclick: whole }, '🗺️ ' + L3('Todo', 'Tot', 'All')),
    el('button', { type: 'button', class: 'no-delay', 'aria-label': '+', onclick: () => zoomBy(1.6) }, '+'));
  const zoomTip = el('div', { class: 'd4-tip' }, '🤏 ' + L3('Pellizca con dos dedos para acercarte o alejarte; arrastra con un dedo.', 'Pessiga amb dos dits per apropar-te o allunyar-te; arrossega amb un dit.', 'Pinch with two fingers to zoom; drag with one finger.'));

  // ---------- ayudas ----------
  // 💡 Pista: un reno cada vez. Si vuelves a pulsar, la zona se hace más pequeña (más ayuda) hasta señalarlo.
  const RADII = [200, 120, 60];
  let hintDeer = null, hintLevel = 0, usedHints = 0;
  const left = () => deer.filter(d => d.target && !d.found);
  // mueve la vista para que se vea bien la zona (x, y, r) en la parte del tablero que de verdad se ve
  const showArea = (x, y, r) => {
    let top = 0, bot = 0;
    try { scroll.scrollIntoView({ block: 'nearest', behavior: 'instant' }); } catch { scroll.scrollIntoView(false); }
    const sr2 = scroll.getBoundingClientRect(), box = (scroll.closest('.note-body') || document.documentElement).getBoundingClientRect();
    const foot = scroll.closest('.note-layer')?.querySelector('.note-foot, .note-btns')?.getBoundingClientRect();
    top = Math.max(sr2.top, box.top, 0); bot = Math.min(sr2.bottom, box.bottom, foot ? foot.top : 1e9, innerHeight);
    const [vw] = vwh(), vh = Math.max(80, bot - top), cy = (top + bot) / 2 - sr2.top;
    const nz = Math.min(vw, vh) * .85 / (2 * r / W * base);
    animateTo(...viewFor(nz, x, y, vw / 2, cy), 450);
  };
  const hintBtn = el('button', { type: 'button', class: 'btn small-btn btn-green no-delay d4-hint', onclick: () => {
    const L = left(); if (!L.length) return;
    if (!hintDeer || hintDeer.found) { hintDeer = L[Math.floor(Math.random() * L.length)]; hintLevel = 0; }
    else hintLevel = Math.min(RADII.length - 1, hintLevel + 1);
    usedHints++;
    const [hx, hy] = headOf(hintDeer), r = RADII[hintLevel];
    const off = hintLevel === RADII.length - 1 ? 0 : r * (.25 + Math.random() * .35), a = Math.random() * Math.PI * 2; // el reno no queda justo en el centro
    hint = { x: Math.max(r * .6, Math.min(W - r * .6, hx + Math.cos(a) * off)), y: Math.max(r * .6, Math.min(H - r * .6, hy + Math.sin(a) * off)), r, until: performance.now() + 6000 };
    showArea(hint.x, hint.y, r); draw(); chime();
    clearTimeout(hintBtn._t); hintBtn._t = setTimeout(draw, 6100);
    hintLabel();
  } });
  const hintLabel = () => {
    const more = hintDeer && !hintDeer.found && hintLevel < RADII.length - 1;
    hintBtn.textContent = '💡 ' + (more ? L3('Más ayuda', 'Més ajuda', 'More help') : L3('Pista', 'Pista', 'Hint'));
  };
  // 👀 Los que quedan: señala todos los renos que faltan durante unos segundos
  const marks = el('div', { class: 'd4-marks' }); stage.append(marks);
  const allBtn = el('button', { type: 'button', class: 'btn small-btn no-delay d4-all', style: 'display:none', onclick: () => {
    const L = left(); if (!L.length) return;
    marks.innerHTML = ''; if (hint) { hint = null; clearTimeout(hintBtn._t); draw(); }
    L.forEach(d => { const [hx, hy] = headOf(d); marks.append(el('i', { style: `left:${hx / W * 100}%;top:${hy / H * 100}%` })); });
    // la vista abarca todos los que faltan
    const hs = L.map(headOf), x0 = Math.min(...hs.map(h => h[0])), x1 = Math.max(...hs.map(h => h[0])), y0 = Math.min(...hs.map(h => h[1])), y1 = Math.max(...hs.map(h => h[1]));
    const [vw, vh] = vwh(), nz = Math.min(vw / ((x1 - x0 + 160) / W * base), vh / ((y1 - y0 + 160) / W * base));
    animateTo(...viewFor(nz, (x0 + x1) / 2, (y0 + y1) / 2, vw / 2, vh / 2), 450); chime();
    clearTimeout(allBtn._t); allBtn._t = setTimeout(() => { marks.innerHTML = ''; }, 5000);
  } }, '👀 ' + L3('Los que quedan', 'Els que queden', 'Show the rest'));
  hintLabel();
  const showHelp = () => {
    hintBtn.style.display = finished ? 'none' : '';
    allBtn.style.display = !finished && usedHints > 0 ? '' : 'none';
  };
  hintBtn.addEventListener('click', () => showHelp());

  body.append(el('h2', { class: 'q-title' }, t('d4title')), el('p', { class: 'game-help' }, t('d4help')),
    el('div', { class: 'game-stats' }, counter), el('div', { class: 'd4-helps' }, hintBtn, allBtn), zoomBar, scroll, zoomTip);
  const sizeUp = () => {
    const nb = scroll.clientWidth || 800; if (nb === base) return;
    const first = !base; base = nb; zoom0 = Math.max(1, 1000 / base);
    stage.style.width = base + 'px'; stage.style.height = base * H / W + 'px';
    if (first) { const [vw, vh] = vwh(); [zoom, tx, ty] = viewFor(zoom0, W / 2, H / 2, vw / 2, vh / 2); }
    apply();
  };
  requestAnimationFrame(sizeUp);
  try { new ResizeObserver(() => sizeUp()).observe(scroll); } catch {}

  // ---------- gestos: un dedo arrastra (con inercia), dos dedos pellizcan, toque = pulsar reno ----------
  const pts = new Map(); let g0 = null, moved = 0, vel = null, fling = 0;
  const stopFling = () => { if (fling) { cancelAnimationFrame(fling); fling = 0; } };
  const local = (x, y) => { const r = scroll.getBoundingClientRect(); return [x - r.left, y - r.top]; };
  const gest = () => {
    const p = [...pts.values()];
    if (p.length > 1) return { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2, d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) };
    return { x: p[0].x, y: p[0].y, d: 0 };
  };
  const startG = () => { if (!pts.size) { g0 = null; return; } g0 = { ...gest(), tx, ty, zoom, n: pts.size }; vel = { x: g0.x, y: g0.y, t: performance.now(), vx: 0, vy: 0 }; };
  scroll.addEventListener('pointerdown', e => {
    e.preventDefault(); stopAnim(); stopFling(); try { scroll.setPointerCapture(e.pointerId); } catch {}
    if (e.isPrimary) pts.clear(); // un dedo nuevo empieza un gesto nuevo (si se perdió un «soltar», no se queda bloqueado)
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 1) moved = 0; startG();
  });
  scroll.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId) || !g0) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gest();
    moved = Math.max(moved, Math.hypot(g.x - g0.x, g.y - g0.y) + (g.d && g0.d ? Math.abs(g.d - g0.d) : 0));
    const [mx, my] = local(g0.x, g0.y), [nx, ny] = local(g.x, g.y);
    const nz = g.d && g0.d ? Math.max(1, Math.min(ZMAX, g0.zoom * g.d / g0.d)) : g0.zoom;
    // el punto que estaba bajo los dedos sigue bajo los dedos
    const k = nz / g0.zoom; zoom = nz; tx = nx - (mx - g0.tx) * k; ty = ny - (my - g0.ty) * k;
    const now = performance.now(), dt = now - vel.t;
    if (dt > 0) { const a = Math.min(1, dt / 50); vel.vx = vel.vx * (1 - a) + (g.x - vel.x) / dt * a; vel.vy = vel.vy * (1 - a) + (g.y - vel.y) / dt * a; vel.x = g.x; vel.y = g.y; vel.t = now; }
    apply();
  });
  const up = e => {
    const single = pts.size === 1 && moved < 9 && e.type === 'pointerup';
    const wasPan = pts.size === 1 && g0 && g0.n === 1 && moved >= 9;
    pts.delete(e.pointerId);
    if (single) tap(e.clientX, e.clientY);
    if (pts.size) { startG(); return; }
    // inercia al soltar después de arrastrar
    if (wasPan && vel && performance.now() - vel.t < 80 && Math.hypot(vel.vx, vel.vy) > .25) {
      let vx = vel.vx, vy = vel.vy, last = performance.now();
      const step = now => { const dt = Math.min(32, now - last); last = now; tx += vx * dt; ty += vy * dt; const f = Math.pow(.94, dt / 16); vx *= f; vy *= f; clamp(); paint();
        fling = Math.hypot(vx, vy) > .03 ? requestAnimationFrame(step) : 0; };
      fling = requestAnimationFrame(step);
    }
    g0 = null;
  };
  scroll.addEventListener('pointerup', up); scroll.addEventListener('pointercancel', up);
  scroll.addEventListener('lostpointercapture', e => { if (pts.has(e.pointerId)) { pts.delete(e.pointerId); if (pts.size) startG(); else g0 = null; } });
  scroll.addEventListener('wheel', e => { e.preventDefault(); stopAnim(); const [px, py] = local(e.clientX, e.clientY); const nz = Math.max(1, Math.min(ZMAX, zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15))), k = nz / zoom; tx = px - (px - tx) * k; ty = py - (py - ty) * k; zoom = nz; apply(); }, { passive: false });
  // Safari del iPhone: que el pellizco no amplíe toda la página
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => scroll.addEventListener(ev, e => e.preventDefault(), { passive: false }));
  setTimeout(() => popup(`<h2>🦌🕶️</h2><p style="font-size:20px">${t('d4help')}</p><p style="font-size:16px">🤏 ${L3('Pellizca con dos dedos para acercarte. Si te cuesta, pulsa 💡 Pista.', 'Pessiga amb dos dits per apropar-te. Si et costa, prem 💡 Pista.', 'Pinch to zoom in. If it’s hard, tap 💡 Hint.')}</p>`, { buttons: [{ label: '¡OK!', value: 1 }] }), 1600);

  cv._left = () => deer.filter(d => d.target && !d.found).map(d => headOf(d).map((v, i) => v / (i ? H : W)));
  let found = 0, finished = !!ctx.prev;
  if (finished) { deer.filter(d => d.target).forEach(d => d.found = true); found = 5; counter.textContent = t('d4count', 5); draw(); }
  showHelp();

  // chispa cuando se pulsa un reno que no es
  const spark = (x, y) => {
    const s = el('div', { class: 'd4-spark' }); s.style.left = x + 'px'; s.style.top = y + 'px';
    for (let i = 0; i < 10; i++) { const a = i / 10 * 360 + Math.random() * 20; s.append(el('i', { style: `--a:${a}deg;--d:${26 + Math.random() * 18}px;--c:${['#ffd24a', '#ff8a00', '#ff3b1f', '#fff3a0'][i % 4]}` })); }
    s.append(el('b', {}, '✖'));
    document.body.append(s); setTimeout(() => s.remove(), 750);
  };
  let lastOops = 0;
  function tap(cx, cy) {
    if (finished) return;
    const rect = cv.getBoundingClientRect();
    const x = (cx - rect.left) / rect.width * W, y = (cy - rect.top) / rect.height * H;
    const R = Math.max(26, 28 / (rect.width / W)); // en la pantalla, siempre unos 28 px de margen (aunque la imagen esté pequeña)
    const hit = left().map(d => { const [hx, hy] = headOf(d); return { d, k: Math.hypot(hx - x, hy - y) }; }).filter(o => o.k < R).sort((a, b) => a.k - b.k)[0]?.d;
    if (hit) {
      hit.found = true; found++; pop(); starBurst(cx, cy);
      counter.textContent = t('d4count', found);
      if (hint) { hint = null; clearTimeout(hintBtn._t); }
      if (hit === hintDeer) { hintDeer = null; hintLevel = 0; }
      marks.innerHTML = ''; draw(); hintLabel(); showHelp();
      if (found === 5) {
        finished = true; showHelp(); chime();
        ctx.submit({ answer: '5/5', status: 'correct' });
        setTimeout(async () => { await popup(ctx.replay ? `<h2>🦌✨</h2><p class="prize-text">${L3('¡Los has vuelto a encontrar todos!', 'Els has tornat a trobar tots!', 'You found them all again!')}</p>` : `<h2>🏆</h2><p class="prize-text">${t('prizeGot')[figure()]}</p>`); ctx.finish(); }, 900);
      }
      return;
    }
    // ¿has tocado otro reno? → chispa + sonido de decepción
    const near = deer.some(d => !d.target && Math.hypot(d.x - x, d.y - y) < Math.max(DW * d.s * .55, 14 / (rect.width / W)));
    if (near) { spark(cx, cy); const now = performance.now(); if (now - lastOops > 450) { oops(); lastOops = now; } }
  }
}
