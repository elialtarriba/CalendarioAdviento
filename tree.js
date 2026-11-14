// Día 8: decorar el árbol (dibujo pintado de Elisabeth) arrastrando 25 objetos hasta su sitio.
// Al encajar: «clac» y uno o dos destellos que suben y se apagan. Al acabar, el árbol cobra vida:
// luces de colores que cambian, halo luminoso y la estrella brillando. Volver a jugar / Continuar.
import { t, getLang } from './i18n.js?v=20';
import { el, svgEl, confetti } from './fx.js?v=20';
import { chime, pop, snapSound, clickSound, fanfare, christmasSong, unlockAudio } from './sound.js?v=20';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const ns = 'http://www.w3.org/2000/svg';
const W = 600, H = 845;
const SLOTS = [
  { type: 'star', x: 300, y: 134 },
  ...[[300, 220], [350, 300], [210, 352], [380, 392], [236, 446], [312, 462]].map(([x, y]) => ({ type: 'bulb', x, y })),
  ...[[200, 275], [410, 302], [452, 382], [150, 446], [290, 522], [398, 516]].map(([x, y]) => ({ type: 'ball', x, y })),
  ...[[262, 256], [345, 338]].map(([x, y]) => ({ type: 'bell', x, y })),
  ...[[170, 490], [440, 470]].map(([x, y]) => ({ type: 'sock', x, y })),
  ...[[165, 640], [240, 636], [360, 636], [435, 640], [118, 708], [215, 714], [385, 714], [482, 708]].map(([x, y]) => ({ type: 'gift', x, y })),
];
const BULB = ['#ff3b3b', '#ffd23b', '#3bff6a', '#3bb6ff', '#ff7af0', '#ff9a3b'];
const BALLS = ['bola8-1.webp', 'bola8-2.webp', 'bola8-3.webp', 'bola8-4.webp'];
const GIFTS = ['ilu-4.webp', 'ilu-gl.webp', 'ilu-gr.webp', 'ilu-23.webp', 'ilu-9.webp', 'ilu-19.webp', 'ilu-15.webp', 'ilu-21.webp'];
const SIZE = { star: [96, 101], bulb: [22, 32], ball: [46, 52], bell: [44, 40], sock: [38, 46], gift: [80, 74] };
const IMG = (src, w, h) => `<image href="${src}" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
function itemSvg(kind, i) {
  const [w, h] = SIZE[kind];
  if (kind === 'star') return IMG('estrella8.webp', w, h);
  if (kind === 'bulb') {
    const c = BULB[i % BULB.length];
    return `<g class="t8-bulb" style="--c:${c}"><circle class="t8-bglow" r="15" fill="${c}" opacity="0"/><rect x="-3.5" y="-15" width="7" height="6" rx="1.5" fill="#8a6d2a"/>`
      + `<path class="t8-bbody" d="M0,-9 C7,-9 8,3 0,13 C-8,3 -7,-9 0,-9Z" fill="${c}"/><ellipse cx="-2.4" cy="-3" rx="1.8" ry="3.4" fill="#fff" opacity=".75"/></g>`;
  }
  if (kind === 'ball') return IMG(BALLS[i % BALLS.length], w, h);
  if (kind === 'bell') return IMG('ilu-12.webp', w, h);
  if (kind === 'sock') return IMG('ilu-11.webp', w, h);
  return IMG(GIFTS[i % GIFTS.length], w, h);
}
const COUNT = { star: 1, bulb: 6, ball: 6, bell: 2, sock: 2, gift: 8 };

export function render(body, ctx) {
  body.style.webkitUserSelect = body.style.userSelect = 'none';
  const kinds = Object.entries(COUNT).flatMap(([k, n]) => Array(n).fill(k));
  const items = kinds.map((kind, i) => ({ kind, type: kind, i }));
  // al empezar, repartidos a los lados (adornos) y en la bandeja de abajo (regalos)
  const side = items.filter(it => it.type !== 'gift').sort(() => Math.random() - .5);
  side.forEach((it, k) => { it.x0 = k % 2 ? 560 : 40; it.y0 = 160 + Math.floor(k / 2) * 52 + (k % 2) * 22; });
  items.filter(it => it.type === 'gift').sort(() => Math.random() - .5).forEach((it, k) => { it.x0 = 45 + k * 73; it.y0 = 800; });

  const lights = Array.from({ length: 40 }, () => {
    const y = 195 + Math.random() * 390, half = (y - 160) * .43 - 8, x = 300 + (Math.random() * 2 - 1) * half;
    return `<g class="t8-fl" style="--d:${(Math.random() * 3).toFixed(2)}s;--t:${(.7 + Math.random()).toFixed(2)}s"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" opacity=".35"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6"/></g>`;
  }).join('');
  const halo = ['#ffe9a0', '#ff8a8a', '#9dffb4', '#9fd2ff'].map((c, i) =>
    `<radialGradient id="t8h${i}"><stop offset="0" stop-color="${c}" stop-opacity=".95"/><stop offset=".55" stop-color="${c}" stop-opacity=".35"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`).join('');
  const scene = `
    <defs>
      <radialGradient id="t8warm"><stop offset="0" stop-color="#fff3c4" stop-opacity=".9"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient>
      <radialGradient id="t8snow"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#f4f1ea"/><stop offset="1" stop-color="#f4f1ea" stop-opacity="0"/></radialGradient>
      ${halo}
    </defs>
    <ellipse cx="300" cy="400" rx="270" ry="300" fill="url(#t8warm)"/>
    <g class="t8-halos">${[0, 1, 2, 3].map(i => `<ellipse class="t8-halo" style="--i:${i}" cx="300" cy="390" rx="285" ry="320" fill="url(#t8h${i})"/>`).join('')}</g>
    <ellipse cx="300" cy="690" rx="290" ry="74" fill="url(#t8snow)"/>
    <image href="guirnalda8.webp" x="165" y="-4" width="270" height="111" preserveAspectRatio="xMidYMid meet"/>
    <image class="t8-tree" href="arbol8.webp" x="95" y="140" width="410" height="471" preserveAspectRatio="xMidYMid meet"/>
    <g class="t8-lights">${lights}</g>
    <g id="slots">${SLOTS.map(s => s.type === 'gift'
      ? `<rect class="t8-slot" x="${s.x - 30}" y="${s.y - 26}" width="60" height="52" rx="8"/>`
      : `<circle class="t8-slot" cx="${s.x}" cy="${s.y}" r="${s.type === 'star' ? 28 : s.type === 'bulb' ? 10 : 16}"/>`).join('')}</g>
    <rect x="8" y="762" width="584" height="78" rx="22" class="t8-tray"/>
    <g id="items"></g>
    <g id="fx"></g>`;
  const svg = svgEl(`viewBox="0 0 ${W} ${H}" class="t8-svg"`, scene);
  const layer = svg.querySelector('#items'), fxl = svg.querySelector('#fx');
  const counter = el('span', {}, t('d8count', 0));
  const doneMsg = el('div', { class: 't8-done' });
  body.append(el('h2', { class: 'q-title cw-title' }, '🎄 ' + t('d8title') + ' 🎄'), el('p', { class: 'game-help' }, t('d8help')),
    el('div', { class: 'game-stats' }, counter), el('div', { class: 'tree-game t8-game' }, svg), doneMsg);

  let placed = 0, finished = false, music = null, iv = null;
  const pt = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const scaleOf = it => it.placed ? 1 : it.drag ? 1.2 : it.type === 'gift' ? .82 : 1;
  const setPos = (it, x, y) => { it.x = x; it.y = y; it.g.setAttribute('transform', `translate(${x} ${y}) scale(${scaleOf(it)})`); };

  // uno o dos destellos que suben y se apagan
  function sparkle(x, y) {
    const n = 1 + (Math.random() < .6 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const g = document.createElementNS(ns, 'g'); g.setAttribute('transform', `translate(${x} ${y})`);
      const s = document.createElementNS(ns, 'g');
      s.innerHTML = '<circle r="11" fill="#fff6c0" opacity=".55"/><path d="M0,-16 C2,-3 3,-2 16,0 C3,2 2,3 0,16 C-2,3 -3,2 -16,0 C-3,-2 -2,-3 0,-16Z" fill="#fffbe6"/><circle r="3" fill="#fff"/>';
      g.append(s); fxl.append(g);
      const dx = (Math.random() - .5) * 90 + (k ? 30 : -20), dy = -70 - Math.random() * 80;
      s.animate([{ transform: 'translate(0px,0px) scale(.2) rotate(0deg)', opacity: 1 }, { transform: `translate(${dx * .4}px,${dy * .4}px) scale(1.1) rotate(45deg)`, opacity: 1, offset: .35 },
        { transform: `translate(${dx}px,${dy}px) scale(.3) rotate(120deg)`, opacity: 0 }], { duration: 1000 + k * 250, delay: k * 120, easing: 'ease-out', fill: 'both' })
        .finished.then(() => g.remove()).catch(() => g.remove());
    }
  }
  const place = (it, s, quiet) => {
    s.used = true; it.placed = true; it.drag = false; it.slot = s; it.g.classList.add('placed'); setPos(it, s.x, s.y);
    placed++; counter.textContent = t('d8count', placed);
    if (!quiet) { snapSound(); clickSound(); sparkle(s.x, s.y - (it.type === 'gift' ? 20 : 0)); }
  };
  items.forEach(it => {
    it.g = document.createElementNS(ns, 'g'); it.g.setAttribute('class', 'tree-item t8-' + it.kind); it.g.innerHTML = itemSvg(it.kind, it.i);
    layer.append(it.g); setPos(it, it.x0, it.y0);
    it.g.addEventListener('pointerdown', e => {
      if (it.placed || finished) return; e.preventDefault(); unlockAudio(); layer.append(it.g); it.drag = true; pop();
      const p0 = pt(e), ox = it.x - p0.x, oy = it.y - p0.y;
      setPos(it, it.x, it.y);
      const move = ev => { const p = pt(ev); setPos(it, p.x + ox, p.y + oy); };
      const up = () => {
        window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
        it.drag = false;
        const s = SLOTS.filter(s => !s.used && s.type === it.type).map(s => ({ s, d: Math.hypot(s.x - it.x, s.y - it.y) })).sort((a, b) => a.d - b.d)[0];
        if (s && s.d < (it.type === 'gift' ? 95 : it.type === 'star' ? 110 : 75)) { place(it, s.s); if (placed === items.length) setTimeout(win, 500); }
        else { it.g.animate([{ opacity: .6 }, { opacity: 1 }], { duration: 300 }); setPos(it, it.x0, it.y0); }
      };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    });
  });

  // ---- ¡el árbol cobra vida!
  ctx.cleanup = () => { clearInterval(iv); try { music?.stop(1); } catch {} music = null; };
  function alive(quiet) {
    finished = true; svg.classList.add('t8-alive');
    const again = el('button', { class: 'btn btn-big no-delay' }, '🔄 ' + L('Volver a jugar', 'Tornar a jugar', 'Play again'));
    const out = el('button', { class: 'btn btn-ghost btn-big no-delay' }, '🎁 ' + L('Continuar', 'Continuar', 'Continue'));
    doneMsg.replaceChildren(el('div', { class: 'sp-msg-title t8-title' }, L('¡Qué árbol más bonito!', 'Quin arbre més bonic!', 'What a lovely tree!')),
      el('p', {}, L('Lo has decorado tú y ahora brilla con todos sus colores ✨', 'L’has decorat tu i ara brilla amb tots els colors ✨', 'You decorated it and now it shines in every colour ✨')),
      el('div', { class: 'ttt-fx-btns' }, again, out));
    doneMsg.classList.add('on');
    again.onclick = () => { ctx.cleanup(); body.replaceChildren(); render(body, { ...ctx, prev: null }); };
    out.onclick = () => { ctx.cleanup(); ctx.finish(); };
    if (quiet) return;
    fanfare(); chime(); confetti(220); setTimeout(() => confetti(140), 900);
    setTimeout(() => { if (finished && svg.isConnected) try { music = christmasSong(); } catch {} }, 1600);
    for (let k = 0; k < 10; k++) setTimeout(() => sparkle(150 + Math.random() * 300, 180 + Math.random() * 380), 300 + k * 260);
    setTimeout(() => doneMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 1200);
  }
  function win() {
    if (!ctx.prev) ctx.submit({ answer: '25/25', status: 'correct' });
    alive(false);
  }
  if (ctx.prev) { items.forEach(it => place(it, SLOTS.find(s => !s.used && s.type === it.type), true)); alive(true); }
}
