// Día 8: decorar el árbol arrastrando 25 objetos hasta su sitio
import { t } from './i18n.js?v=17.15';
import { el, svgEl, confetti, borderLights } from './fx.js?v=17.15';
import { chime, pop } from './sound.js?v=17.15';

const SLOTS = [
  { type: 'star', x: 300, y: 96 },
  ...[[285, 175], [318, 182], [255, 235], [345, 238], [225, 290], [300, 296], [375, 290], [215, 350], [270, 356], [330, 352], [385, 350],
      [200, 420], [265, 426], [335, 420], [400, 424], [160, 480], [440, 482]].map(([x, y]) => ({ type: 'orn', x, y })),
  ...[[180, 582], [240, 586], [300, 590], [360, 586], [420, 582], [210, 625], [390, 625]].map(([x, y]) => ({ type: 'gift', x, y })),
];
const BULB = ['#ff3b3b', '#ffd23b', '#3bff6a', '#3bb6ff', '#ff7af0'];
// adornos pintados al estilo del calendario
const IMG = (src, w, h) => `<image href="${src}" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
const GIFTS = ['ilu-4.webp', 'ilu-gl.webp', 'ilu-gr.webp', 'ilu-23.webp', 'ilu-9.webp', 'ilu-19.webp', 'ilu-15.webp'];
function itemSvg(kind, i) {
  if (kind === 'star') return IMG('ilu-estrella.webp', 52, 48);
  if (kind === 'bulb') { const c = BULB[i % BULB.length]; return `<circle r="11" fill="${c}" opacity=".35"/><circle r="6" fill="${c}" class="bulb-fill" style="--c:${c}"/><circle cx="-1.8" cy="-1.8" r="2" fill="#fff" opacity=".8"/>`; }
  if (kind === 'ball') return IMG(['ilu-bola-roja.webp', 'ilu-bola-oro.webp', 'ilu-bola-roja2.webp'][i % 3], 26, 30);
  if (kind === 'cane') return IMG('ilu-11.webp', 26, 30);
  if (kind === 'bell') return IMG('ilu-12.webp', 30, 27);
  return IMG(GIFTS[i % 7], 48, 46);
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
    <ellipse cx="300" cy="606" rx="240" ry="42" fill="#ffffff66"/>
    <image href="ilu-abeto.webp" x="81" y="100" width="438" height="470" preserveAspectRatio="xMidYMid meet"/>
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
