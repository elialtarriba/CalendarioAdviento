// Regalo sorpresa: un botón que abre la web que la administradora pone en Configuración → «🎁 Regalo sorpresa».
// Sale en las actividades 1 y 2 del día 24, abajo del todo de la casilla 25 y al final del resumen del día 25.
// Árboles y gnomos ya lo reciben el día 24: en el 25 sale como «Regalo ya abierto» (se puede volver a abrir).
import { el, popup, confetti } from './fx.js?v=23.2';
import { getLang } from './i18n.js?v=23.2';
import { chime, unlockAudio } from './sound.js?v=23.2';
import { S, figure } from './app.js?v=23.2';
import { store } from './store.js?v=23.2';

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
  // primero, un cartel que explica el regalo; el botón abre la web al momento (el móvil solo deja abrir otra web con un toque directo)
  chime(); try { const r = b.getBoundingClientRect(); confetti(120, { x: r.left + r.width / 2, y: r.top + r.height / 2 }); } catch {}
  const go = el('button', { type: 'button', class: 'btn btn-big no-delay gift-go', onclick: () => {
    openOutside(fixUrl(url));
    go.closest('.popup-back')?.remove();
  } }, '🎲 ' + L('¡Ir al Bingo de Navidad!', 'Anar al Bingo de Nadal!', 'Go to the Christmas Bingo!'));
  await popup(el('div', { class: 'gift-pop gift-bingo' },
    el('div', { class: 'gift-lights' }, ...Array.from({ length: 12 }, (_, i) => el('i', { style: `--i:${i}` }))),
    el('img', { class: 'gift-pop-img', src: 'ilu-gr.webp', alt: '' }),
    el('h2', {}, L('¡Tu regalo es un Bingo de Navidad!', 'El teu regal és un Bingo de Nadal!', 'Your present is a Christmas Bingo!')),
    el('div', { class: 'gift-steps' },
      el('p', {}, '🎲 ' + L('Es un bingo para jugar en familia por internet, cada uno con su móvil.', 'És un bingo per jugar en família per internet, cadascú amb el seu mòbil.', 'It’s a bingo to play online as a family, each on their own phone.')),
      el('p', {}, '👑 ' + L('Para jugar hace falta una persona que haga de administradora: es la que crea la partida y va cantando los números.', 'Per jugar cal una persona que faci d’administradora: és qui crea la partida i va cantant els números.', 'One person has to be the host: they create the game and call out the numbers.')),
      el('p', {}, '📖 ' + L('Antes de empezar, leed las instrucciones del manual que hay dentro de la app del Bingo. ¡Ahí está todo explicado!', 'Abans de començar, llegiu les instruccions del manual que hi ha dins l’app del Bingo. Allà hi ha tot explicat!', 'Before you start, read the instructions in the manual inside the Bingo app. Everything is explained there!')),
      el('p', {}, '🎄 ' + L('¡Que tengáis mucha suerte y una Navidad llena de líneas y bingos!', 'Que tingueu molta sort i un Nadal ple de línies i bingos!', 'Good luck and a Christmas full of lines and bingos!'))),
    go),
    { cls: 'small', buttons: [{ label: L('Más tarde', 'Més tard', 'Later'), value: false, cls: 'btn-ghost' }] });
  if (!S.profile?.giftOpened && S.user) {
    const at = Date.now(); S.profile.giftOpened = at;
    store.saveProfile(S.user.uid, { giftOpened: at }).catch(() => {});
  }
  b.classList.add('opened');
  b.querySelector('b').textContent = L('Regalo ya abierto', 'Regal ja obert', 'Present already opened');
  b.querySelector('small').textContent = L('Tócalo para volver a verlo', 'Toca’l per tornar-lo a veure', 'Tap to see it again');
}

// (V23) abrir la web en Safari o Chrome de verdad, no dentro de la app
export function openOutside(u) {
  const ua = navigator.userAgent || '';
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  const standalone = matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
  const fallback = () => { const w = window.open(u, '_blank', 'noopener'); if (!w) location.href = u; };
  if (iOS && /^https?:/i.test(u)) {
    // iPhone/iPad: «x-safari-https://…» abre directamente Safari (iOS 17 o más nuevo)
    let left = false; const onHide = () => { left = true; };
    document.addEventListener('visibilitychange', onHide, { once: true });
    location.href = 'x-safari-' + u;
    setTimeout(() => { document.removeEventListener('visibilitychange', onHide); if (!left && !document.hidden) fallback(); }, 900);
    return;
  }
  if (android && standalone && /^https?:/i.test(u)) {
    // Android: se abre en Chrome
    const m = u.match(/^(https?):\/\/(.*)$/i);
    location.href = `intent://${m[2]}#Intent;scheme=${m[1].toLowerCase()};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(u)};end`;
    return;
  }
  fallback();
}
