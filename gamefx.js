// (V26) Cosas comunes de los juegos de tablero (la oca del día 10 y el parchís del día 12):
// · fichas en 3D que se cogen con el dedo y se arrastran por el tablero (las casillas por las que pasan se iluminan)
// · al soltarla en su casilla encaja y hace «clic»
// · la gran felicitación final con fuegos artificiales
import { el, sleep, confetti } from './fx.js';
import { snapSound, clickSound, unlockAudio, fanfare } from './sound.js';

// ---- ficha 3D: una peana redonda (como un disco de verdad) con la figura encima y su sombra en el tablero
export function token3d({ img = '', color = '#f2c14e', cls = '' } = {}) {
  return el('div', { class: 'tk3 ' + cls, style: `--tk:${color}` },
    el('i', { class: 'tk3-shadow' }),
    el('i', { class: 'tk3-base' }),
    img ? el('img', { class: 'tk3-fig', src: img, alt: '', draggable: 'false' }) : null);
}

// ---- peón de parchís en 3D (con gorrito de Papá Noel), dibujado
const SHADE = { r: ['#ff6b7d', '#d3203a', '#7a0c1c'], y: ['#ffe680', '#f2b705', '#8a6200'], g: ['#7be39a', '#1f9a4a', '#0b4d22'], b: ['#8fd3ff', '#1f7ae0', '#0b3a7a'] };
export function pawnSvg(c) {
  const [l, m, d] = SHADE[c] || SHADE.r, id = 'pw' + c + Math.random().toString(36).slice(2, 6);
  return `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg"><defs>
<radialGradient id="${id}a" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".25" stop-color="${l}"/><stop offset=".7" stop-color="${m}"/><stop offset="1" stop-color="${d}"/></radialGradient>
<linearGradient id="${id}b" x1="0" x2="1"><stop offset="0" stop-color="${d}"/><stop offset=".35" stop-color="${l}"/><stop offset=".7" stop-color="${m}"/><stop offset="1" stop-color="${d}"/></linearGradient></defs>
<ellipse cx="50" cy="104" rx="38" ry="12" fill="${d}"/>
<path d="M12 98 v6 a38 12 0 0 0 76 0 v-6 z" fill="url(#${id}b)"/>
<ellipse cx="50" cy="98" rx="38" ry="12" fill="url(#${id}a)"/>
<path d="M30 96 q4-26 12-36 h16 q8 10 12 36 z" fill="url(#${id}b)"/>
<circle cx="50" cy="46" r="20" fill="url(#${id}a)"/>
<path d="M31 38 q6-22 26-20 q14 2 16 14 q-8-6-16-4 z" fill="#d3203a"/><path d="M57 18 q14 -6 22 8" fill="none" stroke="#d3203a" stroke-width="7" stroke-linecap="round"/>
<circle cx="80" cy="28" r="6" fill="#fff"/><path d="M29 39 q20-10 44-5" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
<ellipse cx="43" cy="44" rx="6" ry="4" fill="#fff" opacity=".55"/></svg>`;
}

// ---- arrastrar una ficha con el dedo
// opts: tok (el elemento), layer (donde están las fichas, position:relative), path (casillas por orden, la última es la buena),
//        cellEl(k) → elemento de la casilla k, cellAt(x, y) → casilla k bajo el dedo (o null), center(k) → {x, y} dentro de layer,
//        size (tamaño de casilla en px, para la tolerancia), home → {x, y} donde estaba la ficha
// Devuelve una promesa: true cuando la ficha se ha dejado en su casilla.
export function dragToken(o) {
  return new Promise(resolve => {
    const { tok, layer, path } = o; const target = path[path.length - 1];
    let lit = new Set(), dragging = false, ox = 0, oy = 0, done = false, dx0 = 0, dy0 = 0, dt0 = 0;
    tok.classList.add('tk-can');
    const tgt = o.cellEl(target); if (!o.targetOnLift) tgt?.classList.add('tk-target');
    const light = upTo => { // ilumina el camino hasta la casilla upTo (incluida)
      const i = path.indexOf(upTo), want = new Set(i >= 0 ? path.slice(0, i + 1) : []);
      lit.forEach(k => { if (!want.has(k)) { o.cellEl(k)?.classList.remove('tk-lit'); lit.delete(k); } });
      want.forEach(k => { if (!lit.has(k)) { o.cellEl(k)?.classList.add('tk-lit'); lit.add(k); try { clickSound(); } catch {} } });
    };
    const clear = () => { lit.forEach(k => o.cellEl(k)?.classList.remove('tk-lit')); lit.clear(); tgt?.classList.remove('tk-target'); };
    const pos = (x, y) => { tok.style.transform = `translate(${x}px, ${y}px) translate(-50%, -62%)`; };
    const down = e => {
      if (done) return; e.preventDefault(); unlockAudio();
      dragging = true; tok.setPointerCapture?.(e.pointerId); dx0 = e.clientX; dy0 = e.clientY; dt0 = Date.now();
      const lr = layer.getBoundingClientRect(), h = o.home();
      ox = e.clientX - lr.left - h.x; oy = e.clientY - lr.top - h.y;
      tok.classList.add('tk-lift'); tok.style.transition = 'none'; if (o.targetOnLift) tgt?.classList.add('tk-target');
      o.onLift?.();
      try { snapSound(); } catch {}
    };
    const move = e => {
      if (!dragging) return; e.preventDefault();
      const lr = layer.getBoundingClientRect();
      pos(e.clientX - lr.left - ox, e.clientY - lr.top - oy);
      const k = o.cellAt(e.clientX, e.clientY - o.size * .25);
      if (k != null && path.includes(k)) light(k);
    };
    const up = e => {
      if (!dragging) return; dragging = false;
      // (V26.3) un toque (sin arrastrar) también vale: la ficha va sola a su casilla
      if (Math.hypot(e.clientX - dx0, e.clientY - dy0) < 12 && Date.now() - dt0 < 600) {
        done = true; tok.classList.remove('tk-lift', 'tk-can'); tok.style.transition = '';
        cleanup();
        (async () => {
          for (const k of path) { const c = o.center(k); pos(c.x, c.y); light(k); await new Promise(r => setTimeout(r, 120)); }
          tok.classList.add('tk-snap'); try { snapSound(); } catch {}
          setTimeout(() => { tok.classList.remove('tk-snap'); clear(); }, 450);
          resolve(true);
        })();
        return;
      }
      const lr = layer.getBoundingClientRect(), x = e.clientX - lr.left - ox, y = e.clientY - lr.top - oy;
      const c = o.center(target), dist = Math.hypot(x - c.x, y - c.y);
      const k = o.cellAt(e.clientX, e.clientY - o.size * .25);
      tok.style.transition = '';
      tok.classList.remove('tk-lift');
      if (k === target || dist < o.size * 1.1) { // ¡encaja!
        done = true; light(target);
        tok.classList.remove('tk-can'); tok.classList.add('tk-snap'); pos(c.x, c.y);
        try { snapSound(); } catch {}
        setTimeout(() => { tok.classList.remove('tk-snap'); clear(); }, 450);
        cleanup(); resolve(true);
      } else { // vuelve a su sitio
        const h = o.home(); pos(h.x, h.y); light(null); if (o.targetOnLift) tgt?.classList.remove('tk-target');
        o.onMiss?.();
      }
    };
    const cleanup = () => { tok.removeEventListener('pointerdown', down); tok.removeEventListener('pointermove', move); tok.removeEventListener('pointerup', up); tok.removeEventListener('pointercancel', up); o.cancel && (o.cancel.fn = null); };
    tok.addEventListener('pointerdown', down); tok.addEventListener('pointermove', move);
    tok.addEventListener('pointerup', up); tok.addEventListener('pointercancel', up);
    // se puede cancelar desde fuera (se acaba el tiempo, se cierra el juego…)
    if (o.cancel) o.cancel.fn = () => { if (done) return; done = true; dragging = false; tok.classList.remove('tk-can', 'tk-lift'); clear(); cleanup(); resolve(false); };
  });
}

// ---- ¡felicidades! fuegos artificiales + tarjeta bonita
export async function bigCongrats(host, { title, sub = '', img = '', lines = [], buttons = [] }) {
  const cv = el('canvas', { class: 'gfx-fw' });
  host.append(cv);
  try { const { fireworks } = await import('./share.js'); fireworks(cv, 7000); } catch {}
  try { fanfare(); } catch {}
  confetti(220);
  const card = el('div', { class: 'gfx-card' },
    el('div', { class: 'gfx-ribbon' }, '🎉 ' + title + ' 🎉'),
    img ? el('div', { class: 'gfx-hero' }, el('img', { src: img, alt: '' })) : null,
    sub ? el('p', { class: 'gfx-sub' }, sub) : null,
    ...lines.map(l => typeof l === 'string' ? el('p', { class: 'gfx-line' }, l) : l),
    el('div', { class: 'gfx-btns' }, ...buttons));
  const box = el('div', { class: 'gfx-back' }, card);
  host.append(box);
  await sleep(50);
  return { box, cv, close: () => { box.remove(); cv.remove(); } };
}
