// Día 12: mira la imagen; en la siguiente falta un objeto. ¿Cuál?
import { t } from './i18n.js?v=15.7';
import { el, sleep, toast } from './fx.js?v=15.7';
import { chime } from './sound.js?v=15.7';

const OBJ = [
  ['🎄', 'árbol de Navidad', 'arbre de Nadal', 'Christmas tree'], ['🎅', 'Papá Noel', 'Pare Noel', 'Santa'], ['⛄', 'muñeco de nieve', 'ninot de neu', 'snowman'],
  ['🦌', 'reno', 'ren', 'reindeer'], ['🔔', 'campana', 'campana', 'bell'], ['🎁', 'regalo', 'regal', 'present'], ['🕯️', 'vela', 'espelma', 'candle'],
  ['⭐', 'estrella', 'estel', 'star'], ['🧦', 'calcetín', 'mitjó', 'stocking'], ['🍪', 'galleta', 'galeta', 'cookie'], ['🛷', 'trineo', 'trineu', 'sleigh'],
  ['🧣', 'bufanda', 'bufanda', 'scarf'], ['🍭', 'piruleta', 'piruleta', 'lollipop'], ['❄️', 'copo de nieve', 'floc de neu', 'snowflake'], ['🧤', 'guantes', 'guants', 'gloves'],
];
const POS = [[12, 18], [32, 14], [55, 20], [78, 15], [90, 40], [20, 42], [42, 40], [66, 44], [10, 70], [30, 68], [52, 66], [74, 72], [90, 80], [40, 86], [62, 88]];

export function render(body, ctx) {
  const order = [...OBJ].sort(() => Math.random() - .5);
  const missing = Math.floor(Math.random() * 15);
  const scene = (skip) => el('div', { class: 'memory-scene' }, ...order.map((o, i) => i === skip ? null :
    el('span', { style: `left:${POS[i][0]}%;top:${POS[i][1]}%;transform:translate(-50%,-50%) rotate(${(i * 37 % 30) - 15}deg)` }, o[0])));
  const timer = el('div', { class: 'memory-timer' });
  const nextBtn = el('button', { class: 'btn btn-green' }, t('next') + ' →');
  const wrap = el('div', {}, el('p', { class: 'game-help' }, '👀 ' + t('d12help')), timer, scene(-1), el('div', { class: 'popup-btns' }, nextBtn));
  body.append(el('h2', { class: 'q-title' }, t('d12title')), wrap);

  let left = 60, done = false;
  const tick = setInterval(() => { left--; timer.textContent = `⏱️ ${left} s`; if (left <= 0) step2(); }, 1000);
  timer.textContent = `⏱️ ${left} s`;
  nextBtn.onclick = step2;

  function step2() {
    if (done) return; done = true; clearInterval(tick);
    const input = el('input', { type: 'text', placeholder: t('d12ph'), maxlength: 60 });
    const send = el('button', { class: 'btn' }, '📨 ' + t('send'));
    wrap.replaceChildren(el('p', { class: 'game-help' }, '❓ ' + t('d12q')), scene(missing),
      el('p', { class: 'game-help muted' }, t('d12send')), el('div', { class: 'memory-answer' }, input, send));
    input.focus();
    const go = async () => {
      if (!input.value.trim()) { input.focus(); return; }
      send.disabled = true;
      await ctx.submit({ answer: input.value.trim(), status: 'pending', extra: { missing: `${order[missing][0]} ${order[missing][1]}` } });
      chime(); toast(t('d12sent'));
      await sleep(1400); ctx.finish();
    };
    send.onclick = go; input.onkeydown = e => { if (e.key === 'Enter') go(); };
  }
  ctx.finishBtn.addEventListener('click', () => clearInterval(tick));
}
