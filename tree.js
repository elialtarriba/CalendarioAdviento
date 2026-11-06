// Día 8: decorar el árbol arrastrando 25 objetos hasta su sitio
import { t } from './i18n.js?v=15.8';
import { el, svgEl, confetti, borderLights } from './fx.js?v=15.8';
import { chime, pop } from './sound.js?v=15.8';

const SLOTS = [
  { type: 'star', x: 300, y: 96 },
  ...[[285, 175], [318, 182], [255, 235], [345, 238], [225, 290], [300, 296], [375, 290], [215, 350], [270, 356], [330, 352], [385, 350],
      [200, 420], [265, 426], [335, 420], [400, 424], [160, 480], [440, 482]].map(([x, y]) => ({ type: 'orn', x, y })),
  ...[[180, 582], [240, 586], [300, 590], [360, 586], [420, 582], [210, 625], [390, 625]].map(([x, y]) => ({ type: 'gift', x, y })),
];
const BULB = ['#ff3b3b', '#ffd23b', '#3bff6a', '#3bb6ff', '#ff7af0'];
function itemSvg(kind, i) {
  if (kind === 'star') return '<path d="M0 -26 l8 16 18 2 -13 12 4 18 -17 -9 -17 9 4 -18 -13 -12 18 -2z" fill="#ffd400" stroke="#b88a00" stroke-width="2"/>';
  if (kind === 'bulb') { const c = BULB[i % BULB.length]; return `<rect x="-4" y="-14" width="8" height="6" fill="#777"/><path d="M0 -9 C10 -6 10 8 0 14 C-10 8 -10 -6 0 -9Z" fill="${c}" class="bulb-fill" style="--c:${c}"/>`; }
  if (kind === 'ball') { const c = ['#e63946', '#3a86ff', '#c9a227'][i % 3]; return `<circle r="12" fill="${c}"/><rect x="-3" y="-15" width="6" height="4" fill="#bbb"/><circle cx="-4" cy="-4" r="3" fill="#fff8"/>`; }
  if (kind === 'cane') return '<path d="M4 14 V-6 a6 6 0 0 0 -12 0" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M4 14 V-6 a6 6 0 0 0 -12 0" stroke="#e63946" stroke-width="6" fill="none" stroke-dasharray="4 4" stroke-linecap="round"/>';
  if (kind === 'bell') return '<path d="M-11 8 C-11 -10 11 -10 11 8 Z" fill="#e8b64c" stroke="#9c7520"/><circle cy="10" r="3" fill="#9c7520"/><path d="M-6 -9 q6 -6 12 0" stroke="#e63946" stroke-width="3" fill="none"/>';
  const c = ['#e63946', '#2a9d8f', '#ffb703', '#3a86ff', '#9b5de5', '#e63946', '#06d6a0'][i % 7], r = ['#ffd166', '#fff', '#e63946', '#ffd166', '#fff', '#2a9d8f', '#ffd166'][i % 7];
  return `<rect x="-22" y="-18" width="44" height="36" rx="3" fill="${c}"/><rect x="-4" y="-18" width="8" height="36" fill="${r}"/><rect x="-22" y="-3" width="44" height="7" fill="${r}"/><path d="M0 -18 c-10 -14 -18 -4 0 0 c10 -14 18 -4 0 0" fill="${r}"/>`;
}

export function render(body, ctx) {
  const kinds = ['star', ...Array(10).fill('bulb'), 'ball', 'ball', 'ball', 'cane', 'cane', 'bell', 'bell', ...Array(7).fill('gift')];
  const items = kinds.map((k, i) => ({ kind: k, type: k === 'star' ? 'star' : k === 'gift' ? 'gift' : 'orn', i }));
  // posiciones iniciales repartidas por los lados y abajo
  const side = items.filter(it => it.type !== 'gift').sort(() => Math.random() - .5);
  side.forEach((it, k) => { it.x0 = k % 2 ? 555 : 45; it.y0 = 90 + Math.floor(k / 2) * 58 + (k % 2) * 20; });
  items.filter(it => it.type === 'gift').forEach((it, k) => { it.x0 = 60 + k * 80; it.y0 = 668; });

  const tree = `
    <defs><radialGradient id="tglow"><stop offset="0" stop-color="#fff6c0" stop-opacity=".8"/><stop offset="1" stop-color="#fff6c0" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="300" cy="610" rx="230" ry="40" fill="#ffffff55"/>
    <rect x="282" y="505" width="36" height="60" fill="#6b3a1a"/>
    <path d="M300 230 L100 510 H500Z" fill="#1d6b42"/><path d="M300 150 L150 360 H450Z" fill="#228050"/><path d="M300 100 L205 220 H395Z" fill="#279058"/>
    <path d="M140 470 Q300 520 460 470 M180 330 Q300 370 420 330 M225 200 Q300 230 375 200" stroke="#ffffff33" stroke-width="5" fill="none"/>
    <g id="slots">${SLOTS.map(s => s.type === 'gift' ? `<rect x="${s.x - 22}" y="${s.y - 18}" width="44" height="36" rx="4" fill="none" stroke="#ffffff88" stroke-dasharray="4 3"/>`
      : `<circle cx="${s.x}" cy="${s.y}" r="${s.type === 'star' ? 18 : 9}" fill="#ffffff22" stroke="#ffffffaa" stroke-dasharray="3 3"/>`).join('')}</g>
    <g id="items"></g>`;
  const svg = svgEl('viewBox="0 0 600 700"', tree);
  const layer = svg.querySelector('#items');
  const counter = el('span', {}, t('d8count', 0));
  const doneMsg = el('p', { class: 'game-help' });
  body.append(el('h2', { class: 'q-title' }, t('d8title')), el('p', { class: 'game-help' }, t('d8help')),
    el('div', { class: 'game-stats' }, counter), el('div', { class: 'tree-game' }, svg), doneMsg);

  const ns = 'http://www.w3.org/2000/svg';
  let placed = 0;
  const pt = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const setPos = (it, x, y) => { it.x = x; it.y = y; it.g.setAttribute('transform', `translate(${x} ${y}) scale(${it.placed ? 1.15 : 1.4})`); };
  const place = (it, s) => {
    s.used = true; it.placed = true; it.g.classList.add('placed'); setPos(it, s.x, s.y);
    if (it.kind === 'bulb') { const b = document.createElementNS(ns, 'circle'); b.setAttribute('r', '16'); b.setAttribute('fill', 'url(#tglow)'); it.g.prepend(b); it.g.style.animation = `twk ${1 + Math.random()}s ease-in-out infinite alternate`; }
    placed++; counter.textContent = t('d8count', placed);
  };
  items.forEach(it => {
    it.g = document.createElementNS(ns, 'g'); it.g.setAttribute('class', 'tree-item'); it.g.innerHTML = itemSvg(it.kind, it.i);
    layer.append(it.g); setPos(it, it.x0, it.y0);
    if (ctx.prev) return;
    it.g.addEventListener('pointerdown', e => {
      if (it.placed) return; e.preventDefault(); layer.append(it.g);
      const p0 = pt(e), ox = it.x - p0.x, oy = it.y - p0.y;
      const move = ev => { const p = pt(ev); setPos(it, p.x + ox, p.y + oy); };
      const up = () => {
        window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
        const s = SLOTS.filter(s => !s.used && s.type === it.type).map(s => ({ s, d: Math.hypot(s.x - it.x, s.y - it.y) })).sort((a, b) => a.d - b.d)[0];
        if (s && s.d < (it.type === 'gift' ? 95 : 80)) { place(it, s.s); pop(); if (placed === 25) win(); }
        else setPos(it, it.x0, it.y0);
      };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    });
  });
  if (ctx.prev) items.forEach(it => place(it, SLOTS.find(s => !s.used && s.type === it.type)));
  const st = document.createElementNS(ns, 'style');
  st.textContent = '@keyframes twk{from{opacity:.55}to{opacity:1}} .placed .bulb-fill{filter:drop-shadow(0 0 6px var(--c))}';
  svg.append(st);

  function win() {
    chime(); confetti(200); doneMsg.textContent = t('d8done');
    const stop = borderLights(); const fin = ctx.finishBtn.onclick; ctx.finishBtn.onclick = () => { stop(); fin(); };
    ctx.submit({ answer: '25/25', status: 'correct' });
  }
}
