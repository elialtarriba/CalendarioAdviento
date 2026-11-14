// Día 14: atrapa los regalos. Caen cosas de Navidad (y trolls gruñones). Se coge un objeto con el dedo
// y se arrastra hasta el saco de Papá Noel: suma puntos (cada cosa vale distinto). Las cosas se van
// desvaneciendo mientras caen. Tocar un troll: gruñido, vibración, explota y resta puntos. Meta: 100 puntos.
import { el, sleep, popup, toast } from './fx.js?v=20.1';
import { getLang } from './i18n.js?v=20.1';
import { pop, chime, unlockAudio, grumble, boom, sackDrop, wishSong } from './sound.js?v=20.1';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const GOAL = 100, TROLL_PTS = 10;
// [imagen, puntos, tamaño relativo, probabilidad]
const ITEMS = [
  ['bola8-1.webp', 2, .82, 10], ['bola8-2.webp', 2, .82, 10], ['bola8-3.webp', 3, .82, 8], ['bola8-4.webp', 3, .82, 8],
  ['ilu-11.webp', 3, .9, 8], ['ilu-12.webp', 4, .95, 8], ['ilu-gr.webp', 5, 1, 7], ['ilu-gl.webp', 6, 1.05, 6],
  ['ilu-21.webp', 7, 1.1, 5], ['ilu-4.webp', 8, 1.1, 4], ['estrella8.webp', 10, 1.05, 3],
];
// troll gruñón (dibujo propio)
const TROLL = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 130">
<defs><radialGradient id="s" cx=".45" cy=".35"><stop offset="0" stop-color="#b9a7d6"/><stop offset=".7" stop-color="#7d68a8"/><stop offset="1" stop-color="#4d3b72"/></radialGradient></defs>
<path d="M30 30 L22 6 L42 24Z M90 30 L98 6 L78 24Z" fill="#e8d9b0" stroke="#7a6a45" stroke-width="2"/>
<path d="M18 56 Q4 50 6 70 Q14 66 20 70Z M102 56 Q116 50 114 70 Q106 66 100 70Z" fill="#8d79b8" stroke="#3d2d5c" stroke-width="2"/>
<ellipse cx="60" cy="66" rx="44" ry="48" fill="url(#s)" stroke="#3d2d5c" stroke-width="3"/>
<path d="M22 40 Q30 12 60 16 Q90 12 98 40 Q84 26 74 34 Q66 22 58 32 Q48 22 40 34 Q30 28 22 40Z" fill="#3b2a24"/>
<path d="M30 48 L52 56 M90 48 L68 56" stroke="#2a1d3d" stroke-width="6" stroke-linecap="round"/>
<circle cx="44" cy="64" r="9" fill="#fff"/><circle cx="76" cy="64" r="9" fill="#fff"/>
<circle cx="46" cy="66" r="4.5" fill="#c0182c"/><circle cx="74" cy="66" r="4.5" fill="#c0182c"/>
<ellipse cx="60" cy="80" rx="10" ry="8" fill="#9a84c4" stroke="#3d2d5c" stroke-width="2"/>
<path d="M38 100 Q60 86 82 100 Q60 94 38 100Z" fill="#2a1d3d"/><path d="M46 96 L49 102 L52 95 M68 95 L71 102 L74 96" fill="#fff"/>
</svg>`);

const MOUTH = `<svg viewBox="0 0 200 80" preserveAspectRatio="none"><defs><radialGradient id="ctIn" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#2a0507"/><stop offset=".75" stop-color="#4a0b10"/><stop offset="1" stop-color="#7a1418"/></radialGradient>
<radialGradient id="ctGl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe9a0" stop-opacity=".7"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient></defs>
<ellipse cx="100" cy="30" rx="110" ry="40" fill="url(#ctGl)"/>
<path d="M6 42 Q2 18 30 14 Q60 2 100 8 Q140 2 170 14 Q198 18 194 42 Q196 62 160 70 Q100 82 40 70 Q4 62 6 42Z" fill="#b51e2a" stroke="#6b0a12" stroke-width="3"/>
<path d="M20 40 Q100 4 180 40 Q100 66 20 40Z" fill="url(#ctIn)"/>
<path d="M30 22 Q36 34 32 46 M62 12 Q66 26 60 40 M138 12 Q134 26 140 40 M170 22 Q164 34 168 46" stroke="#7a0f18" stroke-width="3" fill="none" opacity=".7"/>
<path d="M14 36 Q100 0 186 36" stroke="#ffffff55" stroke-width="3" fill="none"/></svg>`;

export function render(body, ctx) {
  body.style.webkitUserSelect = body.style.userSelect = 'none';
  body.append(
    el('h2', { class: 'q-title cw-title' }, '🎁 ' + L('Atrapa los regalos', 'Atrapa els regals', 'Catch the presents') + ' 🎁'));
  const helpTxt = el('p', { class: 'ct-help' }, L(`Atrapa con el dedo las cosas de Navidad antes de que desaparezcan y arrástralas al saco de Papá Noel. ¡Cuidado con los trolls gruñones: si los tocas o pasas por encima de ellos mientras llevas algo al saco, pierdes ${TROLL_PTS} puntos! Llega a ${GOAL} puntos.`,
      `Atrapa amb el dit les coses de Nadal abans que desapareguin i arrossega-les al sac del Pare Noel. Compte amb els trols rondinaires: si els toques o hi passes per sobre mentre portes alguna cosa al sac, perds ${TROLL_PTS} punts! Arriba a ${GOAL} punts.`,
      `Catch the Christmas things with your finger before they vanish and drag them into Santa’s sack. Watch out for the grumpy trolls: touching one, or passing over one while carrying something to the sack, loses ${TROLL_PTS} points! Reach ${GOAL} points.`));


  const sky = el('div', { class: 'ct-sky' });
  const flakes = el('div', { class: 'ct-flakes' }, ...Array.from({ length: 30 }, () => el('i', { style: `left:${Math.random() * 100}%;--d:${5 + Math.random() * 6}s;--dl:${-Math.random() * 10}s;--s:${6 + Math.random() * 9}px;--x:${(Math.random() - .5) * 50}px` }, '❄')));
  const sack = el('div', { class: 'ct-sack' }, el('img', { src: 'saco14.webp', alt: '' })); 
  const field = el('div', { class: 'ct-field' }, sky, el('div', { class: 'ct-moon' }), el('div', { class: 'ct-hills' }), flakes, sack);
  const bar = el('div', { class: 'ct-bar' }, el('i', {}));
  const score = el('div', { class: 'ct-score' });
  const startBtn = el('button', { class: 'btn btn-big ct-start no-delay' }, '▶️ ' + L('¡Empezar!', 'Comencem!', 'Start!'));
  const startBox = el('div', { class: 'ct-startbox' }, helpTxt, el('div', { class: 'ct-legend' },
    el('span', {}, el('img', { src: 'estrella8.webp', alt: '' }), '+10'), el('span', {}, el('img', { src: 'ilu-4.webp', alt: '' }), '+8'),
    el('span', {}, el('img', { src: 'ilu-12.webp', alt: '' }), '+4'), el('span', {}, el('img', { src: 'bola8-1.webp', alt: '' }), '+2'),
    el('span', { class: 'bad' }, el('img', { src: TROLL, alt: '' }), '−' + TROLL_PTS)), startBtn);
  field.append(startBox);
  const board = el('div', { class: 'cw-board ct-board' }, el('div', { class: 'cw-lights' }, ...Array.from({ length: 14 }, (_, i) => el('i', { style: `--i:${i}` }))), score, bar, field);
  const msg = el('div', { class: 'sp-msg' });
  body.append(el('div', { class: 'cw-wrap ct-wrap' }, board, msg));
  // el campo de juego ocupa justo lo que queda de pantalla (sin tener que desplazarse), en cualquier móvil
  const fitField = () => {
    if (!field.isConnected) return;
    const br = body.getBoundingClientRect(), fr = field.getBoundingClientRect(), k = br.height / (body.offsetHeight || 1) || 1;
    const top = (fr.top - br.top) / k + body.scrollTop;
    const h = Math.max(250, Math.min(560, body.clientHeight - top - 26));
    field.style.height = h + 'px'; field.style.minHeight = '0';
  };
  fitField(); requestAnimationFrame(fitField); setTimeout(fitField, 400); setTimeout(fitField, 1600);
  addEventListener('resize', fitField);

  let pts = 0, objs = [], raf = 0, last = 0, spawnT = 0, running = false, held = null, over = false;
  const paint = () => { score.replaceChildren(el('b', {}, Math.max(0, pts)), el('small', {}, ' / ' + GOAL + ' ' + L('puntos', 'punts', 'points'))); bar.firstChild.style.width = Math.min(100, pts / GOAL * 100) + '%'; };
  paint();
  const W = () => field.clientWidth, H = () => field.clientHeight;
  const pickItem = () => { const tot = ITEMS.reduce((a, b) => a + b[3], 0); let r = Math.random() * tot; for (const it of ITEMS) { if ((r -= it[3]) < 0) return it; } return ITEMS[0]; };

  function spawn() {
    const lvl = Math.min(1, pts / GOAL);
    const troll = Math.random() < .22 + lvl * .1;
    const it = troll ? null : pickItem();
    const size = Math.min(78, W() * .17) * (troll ? 1 : it[2]);
    const e = el('div', { class: 'ct-obj' + (troll ? ' troll' : '') }, el('img', { src: troll ? TROLL : it[0], alt: '', draggable: 'false' }));
    e.style.width = e.style.height = size + 'px';
    const o = { e, troll, pts: troll ? -TROLL_PTS : it[1], x: Math.random() * (W() - size), y: -size, size,
      vy: (H() * (.13 + lvl * .1)) * (.8 + Math.random() * .5), sway: Math.random() * 6, life: 0, ttl: 4.2 - lvl * 1.3 + Math.random() };
    field.append(e); objs.push(o);
  }
  function loop(t) {
    if (!running) return;
    const dt = Math.min(.05, (t - (last || t)) / 1000); last = t;
    spawnT -= dt;
    if (spawnT <= 0) { spawn(); spawnT = .95 - Math.min(1, pts / GOAL) * .4 + Math.random() * .35; }
    for (const o of objs.slice()) {
      if (o === held) continue;
      o.life += dt; o.y += o.vy * dt;
      const fade = Math.max(0, Math.min(1, (o.ttl - o.life) / 1.2));
      o.e.style.opacity = fade;
      o.e.style.transform = `translate(${o.x + Math.sin(o.life * 2 + o.sway) * 10}px, ${o.y}px) rotate(${Math.sin(o.life * 3 + o.sway) * 12}deg)`;
      if (fade <= 0 || o.y > H()) remove(o);
    }
    raf = requestAnimationFrame(loop);
  }
  const remove = o => { o.e.remove(); objs = objs.filter(x => x !== o); };
  const local = e => { const r = field.getBoundingClientRect(), s = r.width / field.offsetWidth || 1; return [(e.clientX - r.left) / s, (e.clientY - r.top) / s]; };

  field.addEventListener('pointerdown', e => {
    if (!running || held) return;
    const [x, y] = local(e);
    // el objeto más cercano bajo el dedo (con un poco de margen)
    let best = null, bd = 1e9;
    objs.forEach(o => { const cx = o.x + o.size / 2, cy = o.y + o.size / 2, d = Math.hypot(cx - x, cy - y); if (d < o.size * .75 && d < bd) { bd = d; best = o; } });
    if (!best) return;
    e.preventDefault(); unlockAudio();
    if (best.troll) { if (best.hit) return; best.hit = true; return hitTroll(best); }
    try { field.setPointerCapture(e.pointerId); } catch {}
    held = best; held.id = e.pointerId; best.e.classList.add('held'); best.e.style.opacity = 1; pop();
    moveHeld(x, y);
  });
  const moveHeld = (x, y) => { held.x = x - held.size / 2; held.y = y - held.size / 2; held.e.style.transform = `translate(${held.x}px, ${held.y}px) scale(1.15)`;
    sack.classList.toggle('open', overSack(x, y));
    // si al llevar algo al saco pasas por encima de un troll: ¡se enfada y pierdes puntos!
    const hx = held.x + held.size / 2, hy = held.y + held.size / 2;
    for (const o of objs) if (o.troll && !o.hit && Math.hypot(o.x + o.size / 2 - hx, o.y + o.size / 2 - hy) < (o.size + held.size) * .36) { o.hit = true; hitTroll(o); } };
  const overSack = (x, y) => { const sx = sack.offsetLeft, sy = sack.offsetTop, sw = sack.offsetWidth, sh = sack.offsetHeight; return x > sx - 20 && x < sx + sw + 20 && y > sy - 40 && y < sy + sh; };
  field.addEventListener('pointermove', e => { if (held && e.pointerId === held.id) { const [x, y] = local(e); moveHeld(x, y); } });
  const release = e => {
    if (!held || e.pointerId !== held.id) return;
    const o = held; held = null; o.e.classList.remove('held'); sack.classList.remove('open');
    const [x, y] = local(e);
    if (overSack(x, y)) intoSack(o);
    else { o.life = Math.max(o.life, o.ttl - 1); } // si lo sueltas fuera, se desvanece
  };
  field.addEventListener('pointerup', release); field.addEventListener('pointercancel', release);

  function intoSack(o) {
    remove(o);
    const sx = sack.offsetLeft + sack.offsetWidth / 2, sy = sack.offsetTop + sack.offsetHeight * .25;
    const ghost = el('img', { class: 'ct-in', src: o.e.firstChild.src, alt: '' }); ghost.style.cssText = `left:${sx - o.size / 2}px;top:${sy - o.size}px;width:${o.size}px;height:${o.size}px`;
    field.append(ghost); setTimeout(() => ghost.remove(), 450);
    sack.classList.remove('gulp'); void sack.offsetWidth; sack.classList.add('gulp'); clearTimeout(sack._t); sack._t = setTimeout(() => sack.classList.remove('gulp'), 700);
    sackDrop();
    const star = el('div', { class: 'ct-plus', style: `left:${sx}px;top:${sy}px` }, el('span', { class: 'ct-star' }, '★'), '+' + o.pts);
    field.append(star); setTimeout(() => star.remove(), 1400);
    pts += o.pts; paint();
    if (pts >= GOAL) win();
  }
  function hitTroll(o) {
    grumble(); setTimeout(boom, 260);
    try { navigator.vibrate?.([120, 60, 180]); } catch {}
    o.e.classList.add('angry'); o.vy = 0;
    board.classList.remove('shake'); void board.offsetWidth; board.classList.add('shake');
    setTimeout(() => {
      const cx = o.x + o.size / 2, cy = o.y + o.size / 2;
      for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2, r = 40 + Math.random() * 40;
        const p = el('i', { class: 'ct-bit', style: `left:${cx}px;top:${cy}px;--dx:${Math.cos(a) * r}px;--dy:${Math.sin(a) * r}px` }); field.append(p); setTimeout(() => p.remove(), 700); }
      const minus = el('div', { class: 'ct-plus minus', style: `left:${cx}px;top:${cy}px` }, '−' + TROLL_PTS); field.append(minus); setTimeout(() => minus.remove(), 1300);
      remove(o);
    }, 330);
    pts = Math.max(0, pts - TROLL_PTS); paint();
  }

  // ---- final con una felicitación distinta: el saco salta, salen regalos y fuegos artificiales
  let fw = null, music = null;
  ctx.cleanup = () => { running = false; cancelAnimationFrame(raf); fw?.stop(); try { music?.stop(1); } catch {} music = null; };
  async function win() {
    if (over) return; over = true; running = false; cancelAnimationFrame(raf);
    objs.slice().forEach(remove); held = null;
    if (!ctx.prev && !win.sent) { win.sent = true; ctx.submit({ answer: `🎁 ${GOAL} ${L('puntos', 'punts', 'points')}`, status: 'correct' }); }
    sack.classList.add('full');
    ITEMS.slice().reverse().forEach((it, k) => setTimeout(() => {
      const g = el('img', { class: 'ct-burst', src: it[0], alt: '', style: `--dx:${(Math.random() - .5) * W() * .9}px;--dy:${-H() * (.35 + Math.random() * .3)}px;--r:${(Math.random() - .5) * 720}deg` });
      g.style.left = (sack.offsetLeft + sack.offsetWidth / 2 - 22) + 'px'; g.style.top = (sack.offsetTop + 10) + 'px'; field.append(g);
    }, 300 + k * 140));
    fw = fireworks(field);
    try { music = wishSong(); } catch {}
    await sleep(1600);
    const again = el('button', { class: 'btn btn-big no-delay' }, '🔄 ' + L('Volver a jugar', 'Tornar a jugar', 'Play again'));
    const out = el('button', { class: 'btn btn-ghost btn-big no-delay' }, '🎁 ' + L('Continuar', 'Continuar', 'Continue'));
    msg.replaceChildren(
      el('div', { class: 'ct-win-title' }, L('¡Saco lleno!', 'Sac ple!', 'Sack full!')),
      el('p', { class: 'ct-win-text' }, L('Papá Noel ya tiene todos los regalos gracias a ti. ¡Eres su ayudante número 1! 🎅', 'El Pare Noel ja té tots els regals gràcies a tu. Ets el seu ajudant número 1! 🎅', 'Santa has all his presents thanks to you. You’re his number one helper! 🎅')),
      el('div', { class: 'ttt-fx-btns' }, again, out));
    msg.classList.add('on');
    setTimeout(() => msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300);
    again.onclick = () => { ctx.cleanup(); msg.classList.remove('on'); field.querySelectorAll('.ct-burst').forEach(x => x.remove()); sack.classList.remove('full'); start(); };
    out.onclick = () => { ctx.cleanup(); ctx.finish(); };
  }
  function start() {
    pts = 0; over = false; objs.slice().forEach(remove); paint(); startBox.remove();
    running = true; last = 0; spawnT = .3; raf = requestAnimationFrame(loop);
  }
  startBtn.onclick = () => { unlockAudio(); chime(); start(); };
}

// fuegos artificiales en un lienzo encima del cielo
function fireworks(host) {
  const c = el('canvas', { class: 'ct-fw' }); host.append(c);
  const W = c.width = host.clientWidth * 2, H = c.height = host.clientHeight * 2, x = c.getContext('2d');
  const cols = ['#ffd24a', '#ff5a6e', '#7dffa8', '#7cc4ff', '#ff9ef0', '#ffffff'];
  let ps = [], alive = true, t = 0;
  const burst = () => { const cx = W * (.15 + Math.random() * .7), cy = H * (.12 + Math.random() * .35), col = cols[Math.random() * cols.length | 0];
    for (let i = 0; i < 60; i++) { const a = Math.random() * Math.PI * 2, v = 3 + Math.random() * 7; ps.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 1, col }); } };
  (function loop() {
    if (!alive) return; t++;
    if (t % 28 === 1 && t < 600) burst();
    x.globalCompositeOperation = 'destination-out'; x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = 'lighter';
    ps.forEach(p => { p.vy += .08; p.vx *= .98; p.vy *= .98; p.x += p.vx; p.y += p.vy; p.l -= .012; x.fillStyle = p.col; x.globalAlpha = Math.max(0, p.l); x.beginPath(); x.arc(p.x, p.y, 3, 0, 7); x.fill(); });
    x.globalAlpha = 1; ps = ps.filter(p => p.l > 0);
    requestAnimationFrame(loop);
  })();
  return { stop: () => { alive = false; c.remove(); } };
}
