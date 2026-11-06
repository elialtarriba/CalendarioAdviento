// Día 6: las 5 diferencias + susto divertido en el 5º intento
import { t } from './i18n.js?v=9';
import { el, sleep, confetti, toast, svgEl } from './fx.js?v=9';
import { chime, wrong, pop, scare } from './sound.js?v=9';

// Cada diferencia: zona (cx,cy,r) y cómo se dibuja en A y en B
const DIFFS = [
  { id: 'star', c: [300, 62, 22] }, { id: 'scarf', c: [118, 168, 22] }, { id: 'moon', c: [60, 45, 26] },
  { id: 'window', c: [222, 165, 18] }, { id: 'gift', c: [345, 262, 22] }, { id: 'button', c: [110, 225, 20] }, { id: 'bird', c: [180, 108, 20] },
];

function scene(changed) {
  const on = id => changed.has(id);
  return `
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c3f74"/><stop offset="1" stop-color="#6aa3dd"/></linearGradient></defs>
  <rect width="400" height="300" fill="url(#sky)"/>
  <g fill="#fff" opacity=".8"><circle cx="150" cy="30" r="1.5"/><circle cx="250" cy="20" r="1.2"/><circle cx="350" cy="35" r="1.6"/><circle cx="20" cy="90" r="1.2"/><circle cx="380" cy="110" r="1.3"/></g>
  ${on('moon') ? '<circle cx="60" cy="45" r="20" fill="#ffd84a"/><g stroke="#ffd84a" stroke-width="3"><path d="M60 15v-8M60 75v8M30 45h-8M90 45h8"/></g>'
               : '<circle cx="60" cy="45" r="20" fill="#fff6c8"/><circle cx="68" cy="40" r="17" fill="#2a5590"/>'}
  <path d="M0 230 Q100 200 200 225 T400 215 V300 H0Z" fill="#f4f9ff"/>
  <!-- casa -->
  <rect x="180" y="140" width="85" height="80" fill="#a23a2b"/><path d="M170 145 L222 100 L275 145Z" fill="#fff"/><path d="M175 145 L222 106 L270 145Z" fill="#6b2b20"/>
  <rect x="235" y="105" width="12" height="25" fill="#7b3a2b"/>
  <rect x="210" y="152" width="24" height="24" fill="${on('window') ? '#203046' : '#ffd86b'}" stroke="#fff" stroke-width="3"/><path d="M222 152v24M210 164h24" stroke="#fff" stroke-width="2"/>
  <rect x="245" y="180" width="16" height="40" fill="#4a2410"/>
  ${on('bird') ? '<g transform="translate(180 102)"><ellipse cx="0" cy="0" rx="8" ry="6" fill="#d62828"/><circle cx="6" cy="-4" r="4" fill="#d62828"/><path d="M9 -4l4 1-4 1z" fill="#ffb703"/><circle cx="7" cy="-5" r="1" fill="#000"/></g>' : ''}
  <!-- árbol -->
  <rect x="293" y="210" width="14" height="22" fill="#6b3a1a"/>
  <path d="M300 75 L250 150 H275 L240 210 H360 L325 150 H350Z" fill="#1f7a4a"/>
  <g fill="#e63946"><circle cx="285" cy="130" r="5"/><circle cx="318" cy="170" r="5"/><circle cx="270" cy="195" r="5"/></g>
  <g fill="#ffd166"><circle cx="312" cy="120" r="4"/><circle cx="290" cy="175" r="4"/><circle cx="335" cy="200" r="4"/></g>
  ${on('star') ? '' : '<path d="M300 44 l6 13 14 1-11 9 4 14-13-8-13 8 4-14-11-9 14-1z" fill="#ffd400" stroke="#c79a00"/>'}
  <!-- regalos -->
  <rect x="250" y="235" width="34" height="28" fill="#2a9d8f"/><rect x="264" y="235" width="6" height="28" fill="#ffd166"/>
  <rect x="330" y="245" width="30" height="26" fill="#e63946"/><rect x="342" y="245" width="6" height="26" fill="${on('gift') ? '#3a86ff' : '#fff'}"/><rect x="330" y="255" width="30" height="6" fill="${on('gift') ? '#3a86ff' : '#fff'}"/>
  <!-- muñeco de nieve -->
  <circle cx="110" cy="235" r="38" fill="#fff" stroke="#cfe0f0" stroke-width="2"/><circle cx="110" cy="180" r="27" fill="#fff" stroke="#cfe0f0" stroke-width="2"/><circle cx="110" cy="137" r="20" fill="#fff" stroke="#cfe0f0" stroke-width="2"/>
  <circle cx="103" cy="132" r="2.5" fill="#222"/><circle cx="117" cy="132" r="2.5" fill="#222"/><path d="M110 138 l14 4 -14 2z" fill="#f77f00"/>
  <path d="M100 146 q10 6 20 0" stroke="#222" stroke-width="2" fill="none"/>
  <rect x="94" y="108" width="32" height="6" fill="#222"/><rect x="99" y="88" width="22" height="22" fill="#222"/>
  <path d="M90 160 h40 v8 h-40z M118 160 h8 v26 h-8z" fill="${on('scarf') ? '#3a86ff' : '#e63946'}"/>
  <g fill="#222"><circle cx="110" cy="180" r="3"/><circle cx="110" cy="195" r="3"/>${on('button') ? '' : '<circle cx="110" cy="225" r="3.5"/>'}<circle cx="110" cy="245" r="3.5"/></g>
  <path d="M84 178 L55 160 M136 178 L165 162" stroke="#6b3a1a" stroke-width="3"/>`;
}

export function scareImage() {
  return el('div', { class: 'scare', html: `
  <svg viewBox="0 0 400 400">
    <rect width="400" height="400" fill="#0b1a3a"/>
    <circle cx="200" cy="230" r="190" fill="#fff"/>
    <path d="M60 120 Q200 -40 340 120 Z" fill="#d62828"/><rect x="50" y="110" width="300" height="34" rx="17" fill="#fff"/><circle cx="345" cy="40" r="26" fill="#fff"/>
    <path d="M300 60 Q340 50 345 40" stroke="#d62828" stroke-width="40" fill="none"/>
    <circle cx="135" cy="200" r="58" fill="#fff" stroke="#000" stroke-width="6"/><circle cx="265" cy="200" r="58" fill="#fff" stroke="#000" stroke-width="6"/>
    <circle cx="150" cy="210" r="26" fill="#000"/><circle cx="250" cy="190" r="22" fill="#000"/><circle cx="158" cy="200" r="8" fill="#fff"/><circle cx="257" cy="182" r="7" fill="#fff"/>
    <path d="M200 225 L250 265 L200 262Z" fill="#f77f00"/>
    <ellipse cx="200" cy="320" rx="95" ry="60" fill="#3a0a10"/><ellipse cx="200" cy="350" rx="50" ry="25" fill="#ff5d7a"/>
    <g fill="#fff"><rect x="135" y="268" width="22" height="22"/><rect x="243" y="268" width="22" height="22"/></g>
    <text x="200" y="395" text-anchor="middle" font-family="Mountains of Christmas, cursive" font-weight="700" font-size="54" fill="#ffd400" stroke="#000" stroke-width="2">¡BUUU! 🎄</text>
  </svg>` });
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
    const r = svgB.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * 400, y = (e.clientY - r.top) / r.height * 300;
    attempts++;
    const hit = pool.find(d => !d.found && Math.hypot(d.c[0] - x, d.c[1] - y) < d.c[2] + 8);
    if (hit) { hit.found = true; found++; mark(hit); pop(); } else { wrong(); if (attempts < 8) toast(t('d6tries', 8 - attempts)); }
    foundEl.textContent = t('d6found', found); tries.textContent = t('d6tries', 8 - attempts);
    if (found === 5) { over = true; chime(); confetti(160); toast(t('d6win')); ctx.submit({ answer: `5/5 (${attempts})`, status: 'correct' }); return; }
    if (attempts >= 8) { over = true; pool.filter(d => !d.found).forEach(d => mark(d, '#999')); toast(t('d6lost'), 3500); ctx.submit({ answer: `${found}/5`, status: 'incorrect' }); return; }
    if (attempts === 5 && !scared) {
      scared = true;
      await sleep(250);
      const s = scareImage(); document.body.append(s); scare();
      await sleep(secs * 1000); s.remove();
      const m = el('div', { class: 'unlock-msg' }, el('div', {}, '🔓 ' + t('d6unlock'))); document.body.append(m); chime();
      await sleep(2000); m.remove();
    }
  });
}
