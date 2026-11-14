// Días 7 y 18: puzle de piezas (como de cartón, con relieve) que se mueven y se giran.
// Al encajar cada pieza suena un «clac»; al acabar, el puzle cobra vida con el vídeo (con sonido y en bucle).
import { el, sleep, confetti, toast } from './fx.js?v=19.2';
import { getLang } from './i18n.js?v=19.2';
import { snapSound, pop, chime, unlockAudio } from './sound.js?v=19.2';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
// unas 15 piezas, casi cuadradas
const PUZ = {
  7: { img: 'puzle7.jpg', video: 'puzle7.mp4', cols: 5, rows: 3 },   // tren: 15 piezas
  18: { img: 'puzle18.jpg', video: 'puzle18.mp4', cols: 3, rows: 5 }, // Papá Noel: 15 piezas
};
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

export async function render(body, ctx) {
  const P = PUZ[ctx.day] || PUZ[7];
  const stage = el('div', { class: 'pz3-stage' });
  const info = el('p', { class: 'game-help' }, ctx.prev
    ? L('¡Ya lo has completado! Así cobra vida tu puzle:', 'Ja l’has completat! Així cobra vida el teu puzle:', 'Already done! This is your puzzle coming to life:')
    : L('Mueve las piezas con el dedo y tócalas para girarlas. Cuando una pieza está en su sitio, encaja sola.', 'Mou les peces amb el dit i toca-les per girar-les. Quan una peça és al seu lloc, encaixa sola.', 'Drag the pieces with your finger and tap them to rotate. When a piece is in place, it snaps in.'));
  const count = el('div', { class: 'game-stats' });
  body.append(el('h2', { class: 'q-title' }, '🧩 ' + L('Haz el puzle y descubre qué imagen esconde', 'Fes el puzle i descobreix quina imatge amaga', 'Do the puzzle and discover the hidden picture')), info, count, stage);

  let img;
  try { img = await loadImg(P.img); } catch { stage.append(el('p', {}, '⚠️ ' + L('No se encuentra la imagen del puzle', 'No es troba la imatge del puzle', 'Puzzle image not found') + ` (${P.img})`)); return; }

  // ---- medidas
  const SW = Math.max(280, stage.clientWidth || body.clientWidth || 340);
  let BW = Math.min(SW * .94, 560), BH = BW * img.height / img.width;
  const maxBH = Math.max(200, innerHeight * .36);  // tablero + montón caben a la vez en la pantalla
  if (BH > maxBH) { BH = maxBH; BW = BH * img.width / img.height; }
  const bx = (SW - BW) / 2, by = 8;
  const pw = BW / P.cols, ph = BH / P.rows, tab = Math.min(pw, ph) * .22, pad = Math.ceil(tab + 3);
  const CW = pw + 2 * pad, CH = ph + 2 * pad;
  const pileTop = by + BH + 18, pileH = Math.max(180, Math.min(innerHeight * .27, 300));
  stage.style.height = (pileTop + pileH + 8) + 'px';

  const board = el('div', { class: 'pz3-board', style: `left:${bx}px;top:${by}px;width:${BW}px;height:${BH}px` });
  const full = el('img', { class: 'pz3-full', src: P.img, alt: '' });
  const video = el('video', { class: 'pz3-video', src: P.video, loop: true, playsinline: true, preload: 'auto' });
  video.setAttribute('playsinline', ''); video.setAttribute('webkit-playsinline', '');
  const soundBtn = el('button', { type: 'button', class: 'pz3-sound no-delay', style: 'display:none' }, '🔇');
  soundBtn.onclick = () => { video.muted = !video.muted; if (!video.muted) video.play().catch(() => {}); soundBtn.textContent = video.muted ? '🔇' : '🔊'; };
  board.append(full, video, soundBtn);
  const pileBg = el('div', { class: 'pz3-pilebg', style: `top:${pileTop}px;height:${pileH}px` });
  stage.append(pileBg, board);
  // miniatura en una esquina: mantenla pulsada para ver la imagen entera en grande
  const peek = el('div', { class: 'pz3-peekbig' }, el('img', { src: P.img, alt: '' }));
  const thumb = el('button', { type: 'button', class: 'pz3-thumb no-delay', style: `top:${pileTop + 8}px` }, el('img', { src: P.img, alt: '' }), el('span', {}, '🔍'));
  const peekOn = e => { e.preventDefault(); e.stopPropagation(); document.body.append(peek); requestAnimationFrame(() => peek.classList.add('on')); };
  const peekOff = () => { peek.classList.remove('on'); setTimeout(() => peek.remove(), 200); };
  thumb.addEventListener('pointerdown', peekOn); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => thumb.addEventListener(ev, peekOff));
  thumb.addEventListener('contextmenu', e => e.preventDefault());
  if (!ctx.prev) stage.append(thumb);

  const comeAlive = (withSound = true) => {
    board.classList.add('done');
    video.muted = !withSound;
    const p = video.play();
    (p?.catch ? p : Promise.resolve()).catch(() => { video.muted = true; video.play().catch(() => {}); });
    setTimeout(() => { soundBtn.style.display = ''; soundBtn.textContent = video.muted ? '🔇' : '🔊'; }, 600);
  };
  if (ctx.prev) {
    stage.style.height = (by + BH + 16) + 'px';
    const go = el('button', { class: 'btn btn-big no-delay pz3-replay' }, '▶️ ' + L('Verlo con sonido', 'Veure-ho amb so', 'Watch with sound'));
    go.onclick = () => { unlockAudio(); comeAlive(true); go.remove(); };
    body.append(go); comeAlive(false);
    const fin = ctx.finishBtn.onclick; ctx.finishBtn.onclick = () => { try { video.pause(); } catch {} fin(); };
    return;
  }

  // ---- bordes de las piezas: +1 saliente, -1 entrante
  const rnd = () => (Math.random() < .5 ? 1 : -1);
  const hE = Array.from({ length: P.rows }, () => Array.from({ length: P.cols - 1 }, rnd)); // bordes verticales
  const vE = Array.from({ length: P.rows - 1 }, () => Array.from({ length: P.cols }, rnd)); // bordes horizontales
  const edgeTo = (g, x1, y1, x2, y2, sign) => {
    if (!sign) { g.lineTo(x2, y2); return; }
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = uy, ny = -ux;
    const p = (t, h) => [x1 + dx * t + nx * tab * h * sign, y1 + dy * t + ny * tab * h * sign];
    g.lineTo(...p(.36, 0));
    g.bezierCurveTo(...p(.42, -.05), ...p(.28, .95), ...p(.5, 1));
    g.bezierCurveTo(...p(.72, .95), ...p(.58, -.05), ...p(.64, 0));
    g.lineTo(x2, y2);
  };
  const dpr = Math.min(2, devicePixelRatio || 1);
  const pieces = [];
  let z = 10;
  for (let r = 0; r < P.rows; r++) for (let c = 0; c < P.cols; c++) {
    const top = r === 0 ? 0 : -vE[r - 1][c], right = c === P.cols - 1 ? 0 : hE[r][c], bottom = r === P.rows - 1 ? 0 : vE[r][c], left = c === 0 ? 0 : -hE[r][c - 1];
    const cv = el('canvas', { class: 'pz3-piece' }); cv.width = Math.round(CW * dpr); cv.height = Math.round(CH * dpr);
    cv.style.width = CW + 'px'; cv.style.height = CH + 'px';
    const g = cv.getContext('2d'); g.scale(dpr, dpr); g.translate(pad, pad);
    const path = () => { g.beginPath(); g.moveTo(0, 0); edgeTo(g, 0, 0, pw, 0, top); edgeTo(g, pw, 0, pw, ph, right); edgeTo(g, pw, ph, 0, ph, bottom); edgeTo(g, 0, ph, 0, 0, left); g.closePath(); };
    path(); g.save(); g.clip();
    g.drawImage(img, -c * pw, -r * ph, BW, BH);
    // relieve: luz arriba a la izquierda y sombra abajo a la derecha (como una pieza de cartón)
    g.lineWidth = 3; g.translate(1.3, 1.3); path(); g.strokeStyle = 'rgba(0,0,0,.45)'; g.stroke();
    g.translate(-2.6, -2.6); path(); g.strokeStyle = 'rgba(255,255,255,.55)'; g.stroke(); g.translate(1.3, 1.3);
    const sh = g.createLinearGradient(0, 0, pw, ph); sh.addColorStop(0, 'rgba(255,255,255,.10)'); sh.addColorStop(1, 'rgba(0,0,0,.12)'); g.fillStyle = sh; g.fillRect(-pad, -pad, CW, CH);
    g.restore(); path(); g.lineWidth = .8; g.strokeStyle = 'rgba(40,20,10,.55)'; g.stroke();
    const alpha = g.getImageData(0, 0, cv.width, cv.height).data;
    const pc = { c, r, el: cv, alpha, rot: [0, 90, 180, 270][Math.floor(Math.random() * 4)], locked: false,
      tx: bx + c * pw + pw / 2, ty: by + r * ph + ph / 2,
      x: SW / 2 + (Math.random() - .5) * (SW - CW) * .92, y: pileTop + CH / 2 + Math.random() * Math.max(10, pileH - CH) };
    cv.style.zIndex = z++;
    pieces.push(pc); stage.append(cv);
  }
  // se mezclan para que el montón no salga ordenado
  pieces.sort(() => Math.random() - .5).forEach((p, i) => { p.el.style.zIndex = 10 + i; });
  stage._pz = { pieces, CW, CH };
  const place = p => { p.el.style.transform = `translate(${p.x - CW / 2}px,${p.y - CH / 2}px) rotate(${p.rot}deg)`; };
  pieces.forEach(place);
  body.style.webkitUserSelect = body.style.userSelect = 'none';
  setTimeout(() => stage.scrollIntoView?.({ behavior: 'smooth', block: 'end' }), 600);
  let done = 0; const showCount = () => { count.textContent = `🧩 ${done} / ${pieces.length}`; }; showCount();

  // ¿el dedo está sobre la parte dibujada de la pieza (no en el hueco transparente)?
  const hit = (p, px, py) => {
    const a = -p.rot * Math.PI / 180, dx = px - p.x, dy = py - p.y;
    const lx = dx * Math.cos(a) - dy * Math.sin(a) + CW / 2, ly = dx * Math.sin(a) + dy * Math.cos(a) + CH / 2;
    if (lx < 0 || ly < 0 || lx >= CW || ly >= CH) return false;
    const i = (Math.floor(ly * dpr) * p.el.width + Math.floor(lx * dpr)) * 4 + 3;
    return p.alpha[i] > 20;
  };
  const local = e => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  let drag = null;
  stage.addEventListener('pointerdown', e => {
    if (!e.target.classList?.contains('pz3-piece')) return;
    const [px, py] = local(e);
    const cand = pieces.filter(p => !p.locked && hit(p, px, py)).sort((a, b) => +b.el.style.zIndex - +a.el.style.zIndex)[0];
    if (!cand) return;
    e.preventDefault(); unlockAudio();
    try { stage.setPointerCapture(e.pointerId); } catch {}
    cand.el.style.zIndex = ++z + 1000; cand.el.classList.add('lift');
    drag = { p: cand, id: e.pointerId, sx: px, sy: py, ox: cand.x, oy: cand.y, moved: false };
  });
  stage.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const [px, py] = local(e), dx = px - drag.sx, dy = py - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 7) return;
    drag.moved = true;
    const p = drag.p; p.x = Math.max(CW * .2, Math.min(SW - CW * .2, drag.ox + dx)); p.y = Math.max(CH * .2, Math.min(stage.clientHeight - CH * .2, drag.oy + dy));
    p.el.classList.add('dragging'); place(p);
  });
  const up = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const { p, moved } = drag; drag = null;
    p.el.classList.remove('lift', 'dragging');
    if (!moved) { p.rot += 90; p.el.classList.add('turning'); place(p); pop(); setTimeout(() => p.el.classList.remove('turning'), 260); }
    trySnap(p);
  };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);

  function trySnap(p) {
    const upright = ((p.rot % 360) + 360) % 360 === 0;
    if (!upright || Math.hypot(p.x - p.tx, p.y - p.ty) > Math.min(pw, ph) * .42) return;
    p.x = p.tx; p.y = p.ty; p.rot = 0; p.locked = true;
    p.el.classList.add('snap', 'locked'); p.el.style.zIndex = 5; place(p);
    snapSound(); done++; showCount();
    const s = el('i', { class: 'pz3-spark', style: `left:${p.x}px;top:${p.y}px` }); stage.append(s); setTimeout(() => s.remove(), 700);
    if (done === pieces.length) finish();
  }
  function finish() {
    comeAlive(true); // dentro del toque: así el vídeo puede sonar
    chime(); confetti(260);
    info.textContent = L('¡Lo has conseguido! Mira cómo cobra vida 🎄', 'Ho has aconseguit! Mira com cobra vida 🎄', 'You did it! Watch it come to life 🎄');
    setTimeout(() => { pieces.forEach(p => p.el.classList.add('gone')); pileBg.remove(); thumb.remove(); stage.style.height = (by + BH + 16) + 'px'; }, 900);
    ctx.submit({ answer: '🧩', status: 'correct' });
    const fin = ctx.finishBtn.onclick; ctx.finishBtn.onclick = () => { try { video.pause(); } catch {} fin(); };
  }
}
