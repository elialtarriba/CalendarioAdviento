// Día 6: las 5 diferencias + susto divertido en el 5º intento
import { t, getLang } from './i18n.js';
import { el, sleep, confetti, toast, svgEl } from './fx.js';
import { chime, wrong, pop, scare } from './sound.js';

// Escena pintada al estilo del calendario (dibujos recortados del calendario).
// Cada diferencia: zona (cx,cy,r) donde se pulsa en el dibujo de la derecha.
// (V26.5) b = rectángulo del dibujo que cambia: se acepta el toque en TODO el dibujo (más un margen), no solo en su centro
const DIFFS = [
  { id: 'moon', c: [55, 45, 24], b: [25, 15, 85, 75] }, { id: 'scarf', c: [70, 200, 32], b: [22, 142, 120, 262] }, { id: 'lantern', c: [128, 236, 20], b: [112, 210, 144, 264] },
  { id: 'robin', c: [244, 250, 20], b: [228, 228, 261, 268] }, { id: 'gift', c: [350, 262, 26], b: [322, 234, 378, 292] }, { id: 'bells', c: [190, 152, 16], b: [176, 140, 205, 166] }, { id: 'sleigh', c: [186, 272, 20], b: [166, 254, 206, 290] },
];
const PAD = 12;
const near = (d, x, y) => { const [x1, y1, x2, y2] = d.b; const dx = Math.max(x1 - x, 0, x - x2), dy = Math.max(y1 - y, 0, y - y2); return Math.hypot(dx, dy); };
const IMG = (src, x, y, w, h, extra = '') => `<image href="${src}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" ${extra}/>`;

function scene(changed) {
  const on = id => changed.has(id);
  const stars = [[150, 30], [250, 22], [350, 35], [20, 95], [385, 110], [110, 18], [205, 55], [300, 60], [90, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3" fill="#fff" opacity=".85"/>`).join('');
  return `
  <defs><linearGradient id="dsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1a3a"/><stop offset=".7" stop-color="#2b4a86"/><stop offset="1" stop-color="#6a78b0"/></linearGradient>
  <radialGradient id="dmoon"><stop offset="0" stop-color="#fffbe6"/><stop offset=".55" stop-color="#ffefb0"/><stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></radialGradient>
  <linearGradient id="dsnow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9f0fb"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
  <filter id="dhue"><feColorMatrix type="hueRotate" values="200"/></filter></defs>
  <rect width="400" height="300" fill="url(#dsky)"/>${stars}
  ${on('moon') ? '' : '<circle cx="55" cy="45" r="28" fill="url(#dmoon)"/><circle cx="55" cy="45" r="15" fill="#fff6d0"/>'}
  <path d="M0 215 Q100 195 200 212 T400 205 V300 H0Z" fill="#cdd9ef"/>
  <path d="M0 232 Q120 218 220 230 T400 226 V300 H0Z" fill="url(#dsnow)"/>
  ${IMG('ilu-5.webp', 266, 78, 138, 166)}
  ${IMG('ilu-10.webp', 139, 92, 121, 150)}
  ${on('bells') ? '' : IMG('ilu-12.webp', 176, 140, 29, 26)}
  ${IMG('ilu-3.webp', 22, 142, 98, 120, on('scarf') ? 'filter="url(#dhue)"' : '')}
  ${IMG(on('lantern') ? 'ilu-20.webp' : 'ilu-2.webp', 112, 210, 32, 54)}
  ${on('robin') ? '' : IMG('ilu-14.webp', 228, 228, 33, 40)}
  ${IMG(on('sleigh') ? 'ilu-19.webp' : 'ilu-15.webp', 166, 254, 40, 36)}
  ${IMG(on('gift') ? 'ilu-gl.webp' : 'ilu-4.webp', 322, 234, 56, 58)}`;
}

export function scareImage() {
  return el('div', { class: 'scare scare-ilu' }, el('img', { src: 'ilu-3.webp', class: 'ilu', alt: '' }), el('b', {}, '¡BUUU! 🎄'));
}

export function render(body, ctx) {
  const pool = [...DIFFS].sort(() => Math.random() - .5).slice(0, 5);
  const changed = new Set(pool.map(d => d.id));
  const svgA = svgEl('viewBox="0 0 400 300"', scene(new Set()));
  const svgB = svgEl('viewBox="0 0 400 300" class="clickable"', scene(changed));
  const tries = el('span', {}, t('d6tries', 8)), foundEl = el('span', {}, t('d6found', 0));
  body.append(el('h2', { class: 'q-title' }, t('d6title')), el('p', { class: 'game-help' }, t('d6help')),
    el('div', { class: 'game-stats' }, foundEl, tries), el('div', { class: 'diff-wrap' }, svgA, svgB));

  const mark = (d, color = '#ff2d55') => [svgA, svgB].forEach(s => {
    const ns = 'http://www.w3.org/2000/svg'; const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', d.c[0]); c.setAttribute('cy', d.c[1]); c.setAttribute('r', d.c[2] + 4);
    c.setAttribute('fill', 'none'); c.setAttribute('stroke', color); c.setAttribute('stroke-width', '4'); s.append(c);
  });
  let attempts = 0, found = 0, over = false, scared = false;
  const secs = Math.max(1, +(ctx.content.scareSeconds ?? 5));

  svgB.addEventListener('click', async e => {
    if (over) return;
    // (V26.5) el punto exacto dentro del dibujo (sin el borde), y los toques sobre una diferencia ya encontrada no cuentan como fallo
    let x, y;
    try { const p = svgB.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(svgB.getScreenCTM().inverse()); x = q.x; y = q.y; }
    catch { const r = svgB.getBoundingClientRect(); x = (e.clientX - r.left - svgB.clientLeft) / svgB.clientWidth * 400; y = (e.clientY - r.top - svgB.clientTop) / svgB.clientHeight * 300; }
    const hit = pool.filter(d => !d.found && near(d, x, y) <= PAD).sort((a, b) => Math.hypot(a.c[0] - x, a.c[1] - y) - Math.hypot(b.c[0] - x, b.c[1] - y))[0];
    if (!hit && pool.some(d => d.found && near(d, x, y) <= PAD)) { pop(); toast('✅ ' + ({ es: '¡Esta ya la has encontrado!', ca: 'Aquesta ja l’has trobada!', en: 'You already found this one!' })[getLang()] || '✅'); return; }
    attempts++;
    if (hit) { hit.found = true; found++; mark(hit); pop(); if (found < 5) toast('✅ ' + ({ es: '¡Correcto!', ca: 'Correcte!', en: 'Correct!' })[getLang()]); } else { wrong(); if (attempts < 8) toast(t('d6tries', 8 - attempts)); }
    foundEl.textContent = t('d6found', found); tries.textContent = t('d6tries', 8 - attempts);
    if (found === 5) { over = true; ctx.won?.(); chime(); confetti(160); toast(t('d6win')); ctx.submit({ answer: `5/5 (${attempts})`, status: 'correct' }); return; }
    if (attempts >= 8) { over = true; pool.filter(d => !d.found).forEach(d => mark(d, '#999')); toast(t('d6lost'), 3500); ctx.submit({ answer: `${found}/5`, status: 'incorrect' }); return; }
    if (attempts === 5 && !scared) {
      scared = true;
      await sleep(hit ? 1100 : 450); // que se vea el círculo y el «¡Correcto!» antes del susto
      const s = scareImage(); document.body.append(s); scare();
      await sleep(secs * 1000); s.remove();
      // (V27.1) después del susto: dejar claro que era una broma y que el juego sigue (antes decía «Has desbloqueado esta casilla» y parecía que se había acabado)
      if (over) return;
      const left = 5 - found, tl = 8 - attempts;
      const m = el('div', { class: 'unlock-msg' }, el('div', {}, '😄 ' + ({ es: '¡Era una broma!', ca: 'Era una broma!', en: 'Just a joke!' })[getLang()],
        el('small', { style: 'display:block;font-size:.75em;margin-top:6px' }, (left === 1 ? { es: `Sigue buscando: te falta 1 diferencia y te quedan ${tl} intentos.`, ca: `Continua buscant: et falta 1 diferència i et queden ${tl} intents.`, en: `Keep looking: 1 difference to go, ${tl} tries left.` } : { es: `Sigue buscando: te faltan ${left} diferencias y te quedan ${tl} intentos.`, ca: `Continua buscant: et falten ${left} diferències i et queden ${tl} intents.`, en: `Keep looking: ${left} differences to go, ${tl} tries left.` })[getLang()])));
      document.body.append(m); chime();
      await sleep(2600); m.remove();
    }
  });
}
