// Día 20: la ruleta del disparate
import { t, tx } from './i18n.js?v=9';
import { el, confetti } from './fx.js?v=9';
import { chime, pop } from './sound.js?v=9';

const COLS = ['#e63946', '#2a9d62', '#ffb703', '#3a86ff', '#9b5de5', '#f15bb5', '#00b4d8', '#fb8500', '#06d6a0', '#8338ec'];

export function render(body, ctx) {
  const missions = (ctx.content.missions || []).map(m => tx(m)).filter(Boolean);
  const N = missions.length || 1;
  const cv = el('canvas', { width: 800, height: 800 });
  const c = cv.getContext('2d');
  let angle = 0;
  const draw = () => {
    c.clearRect(0, 0, 800, 800); c.save(); c.translate(400, 400); c.rotate(angle);
    for (let i = 0; i < N; i++) {
      const a0 = i * 2 * Math.PI / N, a1 = (i + 1) * 2 * Math.PI / N;
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 380, a0, a1); c.closePath(); c.fillStyle = COLS[i % COLS.length]; c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 6; c.stroke();
      c.save(); c.rotate((a0 + a1) / 2); c.fillStyle = '#fff'; c.font = 'bold 64px Montserrat, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(String(i + 1), 270, 0); c.restore();
    }
    c.restore();
    c.beginPath(); c.arc(400, 400, 60, 0, 7); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 8; c.strokeStyle = '#e8b64c'; c.stroke();
    c.font = '60px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🎅', 400, 404);
    c.beginPath(); c.arc(400, 400, 388, 0, 7); c.lineWidth = 16; c.strokeStyle = '#e8b64c'; c.stroke();
  };
  draw();
  const result = el('p', { class: 'mission' });
  const btn = el('button', { class: 'btn btn-big' }, '🎡 ' + t('d20btn'));
  body.append(el('div', { class: 'roulette' }, el('h2', { class: 'q-title' }, t('d20title')),
    el('div', { class: 'roulette-wrap' }, el('div', { class: 'roulette-pointer' }), cv), btn, result));
  if (ctx.prev?.answer) { result.textContent = t('d20mission') + ' ' + ctx.prev.answer; btn.remove(); return; }

  btn.onclick = () => {
    btn.disabled = true; result.textContent = '';
    const pick = Math.floor(Math.random() * N);
    // el puntero está arriba (−90°): calcular ángulo final para que el sector elegido quede arriba
    const segMid = (pick + .5) * 2 * Math.PI / N;
    const target = -Math.PI / 2 - segMid + (Math.random() - .5) * (1.4 * Math.PI / N);
    const start = angle, TAU = 2 * Math.PI;
    const end = target + TAU * Math.ceil((start + 6 * TAU - target) / TAU);
    const dur = 5200, t0 = performance.now(); let lastSeg = -1;
    (function f(now) {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      angle = start + (end - start) * e; draw();
      const seg = Math.floor((((-Math.PI / 2 - angle) % (2 * Math.PI)) + 4 * Math.PI) % (2 * Math.PI) / (2 * Math.PI / N));
      if (seg !== lastSeg) { lastSeg = seg; pop(); }
      if (k < 1) requestAnimationFrame(f);
      else {
        chime(); confetti(140);
        result.innerHTML = ''; result.append(el('span', { style: `color:${COLS[pick % COLS.length]}` }, `${t('d20mission')} `), missions[pick]);
        ctx.submit({ answer: missions[pick], status: 'correct' });
      }
    })(t0);
  };
}
