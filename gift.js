// Regalo sorpresa: un botón que abre la web que la administradora pone en Configuración → «🎁 Regalo sorpresa».
// Sale en las actividades 1 y 2 del día 24, abajo del todo de la casilla 25 y al final del resumen del día 25.
// Árboles y gnomos ya lo reciben el día 24: en el 25 sale como «Regalo ya abierto» (se puede volver a abrir).
import { el, popup, confetti } from './fx.js?v=20.3';
import { getLang } from './i18n.js?v=20.3';
import { chime, unlockAudio } from './sound.js?v=20.3';
import { S, figure } from './app.js?v=20.3';
import { store } from './store.js?v=20.3';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
export const giftUrl = () => String(S.config?.gift?.url || '').trim();
export const giftOpened = () => !!S.profile?.giftOpened || (figure() !== 'galleta' && !!S.answers?.[24]);
const fixUrl = u => (/^https?:\/\//i.test(u) ? u : 'https://' + u);

export function giftButton({ opened = giftOpened(), cls = '' } = {}) {
  const b = el('button', { type: 'button', class: 'gift-btn no-delay ' + cls + (opened ? ' opened' : '') },
    el('img', { src: 'ilu-gr.webp', alt: '' }),
    el('span', { class: 'gift-btn-txt' },
      el('b', {}, opened ? L('Regalo ya abierto', 'Regal ja obert', 'Present already opened') : L('Regalo sorpresa', 'Regal sorpresa', 'Surprise present')),
      el('small', {}, opened ? L('Tócalo para volver a verlo', 'Toca’l per tornar-lo a veure', 'Tap to see it again') : L('Tócalo y descubre lo que hay dentro', 'Toca’l i descobreix què hi ha a dins', 'Tap it and find out what’s inside'))));
  b.addEventListener('click', () => openGift(b));
  return b;
}

async function openGift(b) {
  unlockAudio();
  const url = giftUrl();
  if (!url) {
    return popup(el('div', { class: 'gift-pop' }, el('img', { class: 'gift-pop-img', src: 'ilu-gr.webp', alt: '' }),
      el('h2', {}, L('¡Shhh! Todavía se está envolviendo…', 'Xxt! Encara s’està embolicant…', 'Shhh! It’s still being wrapped…')),
      el('p', {}, L('Los duendes aún están poniendo el lazo a este regalo. ¡Vuelve muy pronto!', 'Els follets encara hi estan posant el llaç. Torna molt aviat!', 'The elves are still tying the bow on this present. Come back very soon!'))),
      { cls: 'small', buttons: [{ label: '🎄 OK', value: true }] });
  }
  // se abre al momento (el móvil solo deja abrir otra web con un toque directo)
  const w = window.open(fixUrl(url), '_blank', 'noopener');
  if (!w) location.href = fixUrl(url);
  chime(); try { const r = b.getBoundingClientRect(); confetti(120, { x: r.left + r.width / 2, y: r.top + r.height / 2 }); } catch {}
  if (!S.profile?.giftOpened && S.user) {
    const at = Date.now(); S.profile.giftOpened = at;
    store.saveProfile(S.user.uid, { giftOpened: at }).catch(() => {});
  }
  b.classList.add('opened');
  b.querySelector('b').textContent = L('Regalo ya abierto', 'Regal ja obert', 'Present already opened');
  b.querySelector('small').textContent = L('Tócalo para volver a verlo', 'Toca’l per tornar-lo a veure', 'Tap to see it again');
}
