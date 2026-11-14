// Día 12: mira la imagen; en la siguiente falta un objeto. ¿Cuál?
import { t, getLang } from './i18n.js?v=19.2';
import { el, sleep, toast } from './fx.js?v=19.2';
import { chime } from './sound.js?v=19.2';

// dibujos pintados al estilo del calendario
const OBJ = [
  ['ilu-5.webp', 'árbol de Navidad', 'arbre de Nadal', 'Christmas tree'], ['ilu-3.webp', 'muñeco de nieve', 'ninot de neu', 'snowman'],
  ['ilu-12.webp', 'campanas', 'campanes', 'bells'], ['ilu-4.webp', 'regalos', 'regals', 'presents'], ['ilu-11.webp', 'calcetín', 'mitjó', 'stocking'],
  ['ilu-18.webp', 'galleta de estrella', 'galeta d’estrella', 'star cookie'], ['ilu-15.webp', 'trineo', 'trineu', 'sleigh'], ['ilu-14.webp', 'petirrojo', 'pit-roig', 'robin'],
  ['ilu-9.webp', 'osito', 'osset', 'teddy bear'], ['ilu-2.webp', 'farol rojo', 'fanal vermell', 'red lantern'], ['ilu-21.webp', 'tren', 'tren', 'train'],
  ['ilu-19.webp', 'caballito de balancín', 'cavallet de balancí', 'rocking horse'], ['ilu-17.webp', 'duende', 'follet', 'elf'],
  ['ilu-23.webp', 'saco de regalos', 'sac de regals', 'sack of presents'], ['ilu-10.webp', 'casita de jengibre', 'caseta de gingebre', 'gingerbread house'],
];
const POS = [[12, 18], [32, 14], [55, 20], [78, 15], [90, 40], [20, 42], [42, 40], [66, 44], [10, 70], [30, 68], [52, 66], [74, 72], [90, 80], [40, 86], [62, 88]];

export function render(body, ctx) {
  const order = [...OBJ].sort(() => Math.random() - .5);
  const missing = Math.floor(Math.random() * 15);
  const scene = (skip) => el('div', { class: 'memory-scene' }, ...order.map((o, i) => i === skip ? null :
    el('span', { style: `left:${POS[i][0]}%;top:${POS[i][1]}%;transform:translate(-50%,-50%) rotate(${(i * 37 % 20) - 10}deg)` }, el('img', { src: o[0], class: 'ilu', alt: '', draggable: 'false' }))));
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
    // mantén pulsada la imagen para ver la de antes; al soltar vuelve la que tiene un objeto menos
    const holder = el('div', { class: 'memory-hold' }, scene(missing), el('div', { class: 'memory-hint' }, '👆 ' + L3('Mantén pulsado para ver la imagen de antes', 'Mantén premut per veure la imatge d’abans', 'Press and hold to see the picture from before')));
    const showOld = e => { e.preventDefault(); holder.firstChild.replaceWith(scene(-1)); holder.classList.add('old'); };
    const showNew = () => { if (!holder.classList.contains('old')) return; holder.firstChild.replaceWith(scene(missing)); holder.classList.remove('old'); };
    holder.addEventListener('pointerdown', showOld); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => holder.addEventListener(ev, showNew));
    holder.addEventListener('contextmenu', e => e.preventDefault());
    wrap.replaceChildren(el('p', { class: 'game-help' }, '❓ ' + t('d12q')), holder,
      el('p', { class: 'game-help muted' }, t('d12send')), el('div', { class: 'memory-answer' }, input, send));
    input.focus();
    const go = async () => {
      if (!input.value.trim()) { input.focus(); return; }
      send.disabled = true;
      const ok = matches(input.value, order[missing].slice(1));
      await ctx.submit({ answer: input.value.trim(), status: ok ? 'correct' : 'pending', extra: { missing: order[missing][1] } });
      chime();
      if (ok) { await flyStar(send); toast('⭐ ' + L3('¡Correcto! Era: ', 'Correcte! Era: ', 'Correct! It was: ') + order[missing][{ es: 1, ca: 2, en: 3 }[getLang()] || 1], 3000); await sleep(800); }
      else { toast(t('d12sent')); await sleep(1400); }
      ctx.finish();
    };
    send.onclick = go; input.onkeydown = e => { if (e.key === 'Enter') go(); };
  }
  ctx.finishBtn.addEventListener('click', () => clearInterval(tick));
}

const L3 = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
// ¿lo que ha escrito es el objeto que falta? (en cualquier idioma, sin acentos, singular o plural)
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñç ]/g, ' ');
const STOP = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'of', 'the', 'a', 'les', 'els', 'd', 'l']);
function matches(input, names) {
  const toks = s => norm(s).split(/\s+/).filter(w => w.length >= 3 && !STOP.has(w));
  const inp = toks(input); if (!inp.length) return false;
  return names.some(n => { const nt = toks(n); const main = nt[0]; return main && inp.some(w => w.slice(0, 5) === main.slice(0, 5) || (main.length < 5 && w === main)); });
}
// una estrella brillante sale del botón y se va volando dando una vuelta por la pantalla
function flyStar(from) {
  return new Promise(res => {
    const r = from.getBoundingClientRect(), x0 = r.left + r.width / 2, y0 = r.top + r.height / 2;
    const s = el('div', { class: 'fly-star' }, '⭐'); document.body.append(s);
    const W = innerWidth, H = innerHeight, t0 = performance.now(), D = 2600;
    const trail = setInterval(() => { const b = s.getBoundingClientRect(); const d = el('i', { class: 'cine-trail', style: `left:${b.left + b.width / 2}px;top:${b.top + b.height / 2}px;z-index:400` }); document.body.append(d); setTimeout(() => d.remove(), 700); }, 45);
    (function f(now) {
      const k = Math.min(1, (now - t0) / D), a = -Math.PI / 2 + k * Math.PI * 2.2;
      const rad = Math.min(W, H) * .32 * Math.sin(Math.min(1, k * 1.3) * Math.PI / 1.0 + .0001);
      const cx = W / 2, cy = H / 2, x = x0 + (cx + Math.cos(a) * Math.max(rad, 0) - x0) * Math.min(1, k * 3), y = y0 + (cy + Math.sin(a) * Math.max(rad, 0) - y0) * Math.min(1, k * 3);
      const yy = k > .8 ? y - (k - .8) / .2 * H : y;
      s.style.transform = `translate(${x - 30}px,${yy - 30}px) rotate(${k * 720}deg) scale(${1 + Math.sin(k * Math.PI) * .8})`;
      s.style.opacity = k > .9 ? (1 - k) / .1 : 1;
      if (k < 1) requestAnimationFrame(f); else { clearInterval(trail); s.remove(); res(); }
    })(t0);
  });
}
