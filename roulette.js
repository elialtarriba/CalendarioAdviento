// Día 20: la ruleta del disparate
import { t, tx } from './i18n.js?v=23.4';
import { el, confetti, popup } from './fx.js?v=23.4';
import { shareResult } from './share.js?v=23.4';
import { getLang } from './i18n.js?v=23.4';
const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
import { chime, pop } from './sound.js?v=23.4';

export const R_COLS = ['#e63946', '#2a9d62', '#ffb703', '#3a86ff', '#9b5de5', '#f15bb5', '#00b4d8', '#fb8500', '#06d6a0', '#8338ec'];
const COLS = R_COLS;
export const DEFAULT_R_NOTE = 'Tienes que cantar, en el día de hoy, a tu madre o tu padre.';

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
  const noteTxt = ctx.content.rouletteNote ? tx(ctx.content.rouletteNote) : (ctx.lang === 'es' ? DEFAULT_R_NOTE : '');
  const note = el('p', { class: 'mission-note', style: 'display:none' }, noteTxt);
  const btn = el('button', { class: 'btn btn-big' }, '🎡 ' + t('d20btn'));
  // lista de lo que hay en cada casilla
  const legend = el('ol', { class: 'r-legend' }, ...missions.map((m, i) => el('li', {}, el('span', { class: 'r-num', style: `background:${COLS[i % COLS.length]}` }, i + 1), el('span', {}, m))));
  const mark = i => [...legend.children].forEach((li, k) => li.classList.toggle('on', k === i));
  body.append(el('div', { class: 'roulette' }, el('h2', { class: 'q-title' }, t('d20title')),
    el('div', { class: 'roulette-wrap' }, el('div', { class: 'roulette-pointer' }), cv), btn, result, note,
    el('p', { class: 'r-legend-title' }, t('d20list')), legend));
  // solo se juega UNA vez: después se ve lo que salió y se puede volver a enviar
  const sendRes = (num, mission) => shareResult({
    title: L('La ruleta del disparate', 'La ruleta del disbarat', 'The silly roulette'), emoji: '🎡', who: (ctx.profile?.name || '').trim(), day: 20, file: 'ruleta.png',
    rows: [[L('Ha salido el', 'Ha sortit el', 'It landed on'), '№ ' + num], [L('Misión', 'Missió', 'Mission'), mission]],
    note: L('Envíalo al grupo de WhatsApp de la familia: así todos sabrán tu misión… ¡y podrán comprobar que la cumples! 😄', 'Envia-ho al grup de WhatsApp de la família: així tothom sabrà la teva missió… i podran comprovar que la compleixes! 😄', 'Send it to the family WhatsApp group so everyone knows your mission… and can check you do it! 😄'),
    text: L(`🎡 La ruleta del disparate (día 20): me ha salido el ${num}: «${mission}»`, `🎡 La ruleta del disbarat (dia 20): m’ha sortit el ${num}: «${mission}»`, `🎡 Silly roulette (day 20): I got number ${num}: “${mission}”`) + (ctx.profile?.name ? `\n— ${ctx.profile.name}` : ''),
  });
  const resultPop = async (num, mission) => {
    const go = await popup(el('div', { class: 'r20-pop' }, el('div', { class: 'r20-ico' }, '🎡'),
      el('h2', {}, L('¡Tu misión!', 'La teva missió!', 'Your mission!')),
      el('p', { class: 'r20-who' }, (ctx.profile?.name || '') + ' · ' + L('número', 'número', 'number') + ' ' + num),
      el('p', { class: 'r20-mission' }, mission), noteTxt ? el('p', { class: 'mission-note' }, noteTxt) : null,
      el('p', { class: 'sh-note' }, '📲 ' + L('Envía tu misión al grupo de WhatsApp de la familia.', 'Envia la teva missió al grup de WhatsApp de la família.', 'Send your mission to the family WhatsApp group.'))),
      { cls: 'small', buttons: [{ label: L('Cerrar', 'Tancar', 'Close'), value: false, cls: 'btn-ghost' }, { label: '📲 WhatsApp', value: true, cls: 'c5-wa' }] });
    if (go) sendRes(num, mission);
  };
  if (ctx.prev?.answer) {
    const i = missions.indexOf(ctx.prev.answer);
    result.textContent = t('d20mission') + ' ' + ctx.prev.answer; btn.remove();
    if (noteTxt) note.style.display = ''; mark(i);
    result.after(el('p', { class: 'muted r20-once' }, '🎡 ' + L('La ruleta solo se puede girar una vez.', 'La ruleta només es pot girar una vegada.', 'The roulette can only be spun once.')),
      el('button', { type: 'button', class: 'btn btn-ghost small-btn no-delay', onclick: () => sendRes(i + 1, ctx.prev.answer) }, '📲 ' + L('Enviar mi resultado', 'Enviar el meu resultat', 'Send my result')));
    return;
  }

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
        result.innerHTML = ''; result.append(el('span', { style: `color:${COLS[pick % COLS.length]}` }, `${t('d20mission')} (${pick + 1}) `), missions[pick]);
        if (noteTxt) note.style.display = ''; mark(pick);
        ctx.submit({ answer: missions[pick], status: 'correct' });
        btn.remove(); // solo una vez
        setTimeout(() => resultPop(pick + 1, missions[pick]), 1200);
      }
    })(t0);
  };
}
