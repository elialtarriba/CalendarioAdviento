// Regalo de Nochebuena (día 24): un botón que abre la web que la administradora pone en Configuración → «🎁 Regalo de Nochebuena».
// (V23.3) «Regalo de Nochebuena»: sale abajo del todo del día 24, para todas las figuras. Una vez abierto,
// pone «Regalo ya abierto · Tócalo para volver a verlo». Antes de ir al navegador explica cómo poner el Bingo
// en la pantalla de inicio (iPhone → Safari, Android → Chrome).
import { el, popup, confetti } from './fx.js?v=23.4';
import { getLang } from './i18n.js?v=23.4';
import { chime, unlockAudio } from './sound.js?v=23.4';
import { S, figure } from './app.js?v=23.4';
import { store } from './store.js?v=23.4';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
export const giftUrl = () => String(S.config?.gift?.url || '').trim();
export const giftOpened = () => !!S.profile?.giftOpened;
const fixUrl = u => (/^https?:\/\//i.test(u) ? u : 'https://' + u);

export function giftButton({ opened = giftOpened(), cls = '' } = {}) {
  const b = el('button', { type: 'button', class: 'gift-btn no-delay ' + cls + (opened ? ' opened' : '') },
    el('img', { src: 'ilu-gr.webp', alt: '' }),
    el('span', { class: 'gift-btn-txt' },
      el('b', {}, opened ? L('Regalo ya abierto', 'Regal ja obert', 'Present already opened') : L('Regalo de Nochebuena', 'Regal de Nit de Nadal', 'Christmas Eve present')),
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
    go.closest('.popup-back')?.remove();
    installPopup(fixUrl(url));
  } }, '🎲 ' + L('¡Ir al Bingo de Navidad!', 'Anar al Bingo de Nadal!', 'Go to the Christmas Bingo!'));
  // (V23.3) se marca como abierto en cuanto se ve (antes, si se iba al Bingo, no se guardaba)
  if (!S.profile?.giftOpened && S.user) {
    const at = Date.now(); S.profile.giftOpened = at;
    store.saveProfile(S.user.uid, { giftOpened: at }).catch(() => {});
  }
  b.classList.add('opened');
  b.querySelector('b').textContent = L('Regalo ya abierto', 'Regal ja obert', 'Present already opened');
  b.querySelector('small').textContent = L('Tócalo para volver a verlo', 'Toca’l per tornar-lo a veure', 'Tap to see it again');
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

// ================================================================ (V23.3) cómo poner el Bingo en la pantalla de inicio
const isIOS = () => { const ua = navigator.userAgent || ''; return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); };
const isAndroid = () => /Android/i.test(navigator.userAgent || '');
const esc = t => String(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

// un móvil dibujado (SVG) con la parte que hay que tocar marcada en rojo y una manita
function phone(inner, tap) {
  const hand = tap ? `<circle cx="${tap[0]}" cy="${tap[1]}" r="15" fill="none" stroke="#e11d48" stroke-width="4"><animate attributeName="r" values="12;19;12" dur="1.4s" repeatCount="indefinite"/></circle><text x="${tap[0] + 6}" y="${tap[1] + 30}" font-size="24">👆</text>` : '';
  return `<svg viewBox="0 0 140 250" xmlns="http://www.w3.org/2000/svg" class="gi-phone">
    <rect x="4" y="4" width="132" height="242" rx="22" fill="#1f2937"/><rect x="11" y="13" width="118" height="224" rx="15" fill="#fffaf0"/>
    <rect x="52" y="17" width="36" height="9" rx="4.5" fill="#1f2937"/>${inner}${hand}</svg>`;
}
const bingoPage = `<rect x="11" y="34" width="118" height="22" fill="#b3122e"/><text x="70" y="50" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">🎄 Bingo 🎄</text>
  ${[0, 1, 2, 3, 4, 5].map(i => `<circle cx="${32 + (i % 3) * 38}" cy="${82 + Math.floor(i / 3) * 40}" r="15" fill="${['#e11d48', '#16a34a', '#f59e0b'][i % 3]}"/><text x="${32 + (i % 3) * 38}" y="${87 + Math.floor(i / 3) * 40}" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">${[7, 24, 12, 45, 3, 61][i]}</text>`).join('')}`;
const homeScreen = name => `<rect x="11" y="13" width="118" height="224" rx="15" fill="#7f1d1d"/>
  ${Array.from({ length: 11 }, (_, i) => `<rect x="${22 + (i % 4) * 26}" y="${40 + Math.floor(i / 4) * 34}" width="20" height="20" rx="5" fill="${['#60a5fa', '#34d399', '#fbbf24', '#f472b6'][i % 4]}" opacity=".8"/>`).join('')}
  <rect x="100" y="108" width="22" height="22" rx="5" fill="#fff"/><text x="111" y="125" text-anchor="middle" font-size="15">🎲</text>
  <circle cx="111" cy="119" r="17" fill="none" stroke="#fde047" stroke-width="3"><animate attributeName="opacity" values="1;.2;1" dur="1.2s" repeatCount="indefinite"/></circle>
  <text x="111" y="145" text-anchor="middle" font-size="8" fill="#fff" font-weight="700">${esc(name)}</text>
  <text x="70" y="200" text-anchor="middle" font-size="22">⭐</text>`;
function stepsFor(os) {
  const add = L('Añadir a la pantalla de inicio', 'Afegir a la pantalla d’inici', 'Add to Home Screen');
  if (os === 'ios') return [
    [phone(bingoPage + `<rect x="11" y="205" width="118" height="32" fill="#f3f4f6"/><text x="26" y="226" font-size="15" fill="#2563eb">‹</text><text x="44" y="226" font-size="15" fill="#2563eb">›</text>
      <g transform="translate(62,208)"><rect x="3" y="8" width="14" height="14" rx="2" fill="none" stroke="#2563eb" stroke-width="2"/><path d="M10 2 V16 M5 7 L10 2 L15 7" fill="none" stroke="#2563eb" stroke-width="2"/></g>
      <text x="96" y="226" font-size="13" fill="#2563eb">📖</text><text x="114" y="226" font-size="14" fill="#2563eb">⋯</text>`, [72, 222]),
      L('Toca el botón Compartir (el cuadrado con la flecha). Si no lo ves, toca antes ⋯', 'Toca el botó Compartir (el quadrat amb la fletxa). Si no el veus, toca abans ⋯', 'Tap the Share button (the square with the arrow). If you can’t see it, tap ⋯ first')],
    [phone(bingoPage + `<rect x="11" y="120" width="118" height="117" rx="12" fill="#f3f4f6"/>
      ${[L('Copiar', 'Copiar', 'Copy'), L('Añadir a favoritos', 'Afegir a preferits', 'Add to Favourites'), add].map((t, i) => `<rect x="18" y="${132 + i * 30}" width="104" height="24" rx="6" fill="${i === 2 ? '#fde68a' : '#fff'}"/><text x="24" y="${148 + i * 30}" font-size="8.5" fill="#111" font-weight="${i === 2 ? 800 : 400}">${esc(t)}</text><text x="112" y="${149 + i * 30}" font-size="10" text-anchor="middle">${['⧉', '☆', '⊞'][i]}</text>`).join('')}`, [70, 204]),
      L('Baja un poco y toca «' + add + '» ⊞', 'Baixa una mica i toca «' + add + '» ⊞', 'Scroll down a little and tap “' + add + '” ⊞')],
    [phone(`<rect x="11" y="34" width="118" height="24" fill="#f3f4f6"/><text x="18" y="50" font-size="9" fill="#2563eb">${esc(L('Cancelar', 'Cancel·lar', 'Cancel'))}</text><text x="122" y="50" text-anchor="end" font-size="10" font-weight="800" fill="#2563eb">${esc(L('Añadir', 'Afegir', 'Add'))}</text>
      <rect x="22" y="72" width="34" height="34" rx="8" fill="#fff" stroke="#e5e7eb"/><text x="39" y="96" text-anchor="middle" font-size="20">🎲</text>
      <rect x="62" y="78" width="60" height="20" rx="4" fill="#fff" stroke="#e5e7eb"/><text x="66" y="92" font-size="9" fill="#111">Bingo</text>`, [108, 46]),
      L('Arriba a la derecha, toca «Añadir»', 'A dalt a la dreta, toca «Afegir»', 'At the top right, tap “Add”')],
    [phone(homeScreen('Bingo')), L('¡Ya está! El Bingo sale en tu pantalla de inicio, como una app', 'Ja està! El Bingo surt a la teva pantalla d’inici, com una app', 'Done! The Bingo is on your Home Screen, like an app')]];
  return [
    [phone(`<rect x="11" y="30" width="118" height="22" fill="#f3f4f6"/><rect x="18" y="34" width="86" height="14" rx="7" fill="#fff"/><text x="24" y="44" font-size="8" fill="#555">bingo…</text><text x="118" y="46" text-anchor="middle" font-size="16" font-weight="900" fill="#333">⋮</text>`
      + bingoPage.replace(/y="34"/, 'y="56"').replace(/y="50"/, 'y="72"'), [118, 40]),
      L('Arriba a la derecha, toca los tres puntos ⋮', 'A dalt a la dreta, toca els tres punts ⋮', 'At the top right, tap the three dots ⋮')],
    [phone(bingoPage + `<rect x="46" y="30" width="80" height="120" rx="8" fill="#fff" stroke="#e5e7eb"/>
      ${[L('Nueva pestaña', 'Pestanya nova', 'New tab'), L('Historial', 'Historial', 'History'), add, L('Compartir', 'Compartir', 'Share')].map((t, i) => `<rect x="50" y="${36 + i * 27}" width="72" height="22" rx="4" fill="${i === 2 ? '#fde68a' : '#fff'}"/><text x="54" y="${50 + i * 27}" font-size="7" fill="#111" font-weight="${i === 2 ? 800 : 400}">${esc(t.length > 20 ? t.slice(0, 19) + '…' : t)}</text>`).join('')}`, [86, 101]),
      L('Toca «' + add + '» (o «Instalar aplicación»)', 'Toca «' + add + '» (o «Instal·lar l’aplicació»)', 'Tap “' + add + '” (or “Install app”)')],
    [phone(bingoPage + `<rect x="11" y="13" width="118" height="224" rx="15" fill="#0006"/><rect x="20" y="80" width="100" height="80" rx="10" fill="#fff"/>
      <text x="70" y="102" text-anchor="middle" font-size="9" font-weight="800">${esc(L('¿Instalar?', 'Instal·lar?', 'Install?'))}</text><text x="70" y="124" text-anchor="middle" font-size="18">🎲</text>
      <text x="110" y="150" text-anchor="end" font-size="9" font-weight="800" fill="#1a73e8">${esc(L('Instalar', 'Instal·lar', 'Install'))}</text>`, [96, 147]),
      L('Toca «Instalar» o «Añadir»', 'Toca «Instal·lar» o «Afegir»', 'Tap “Install” or “Add”')],
    [phone(homeScreen('Bingo')), L('¡Ya está! El Bingo sale en tu pantalla de inicio, como una app', 'Ja està! El Bingo surt a la teva pantalla d’inici, com una app', 'Done! The Bingo is on your Home Screen, like an app')]];
}
function installPopup(url) {
  let os = isAndroid() ? 'android' : 'ios';
  const grid = el('div', { class: 'gi-steps' });
  const goBtn = el('button', { type: 'button', class: 'btn btn-big no-delay gift-go' });
  const tabs = el('div', { class: 'gi-tabs' });
  const brName = el('b', {});
  const paint = () => {
    brName.textContent = os === 'ios' ? 'Safari' : 'Chrome';
    grid.replaceChildren(...stepsFor(os).map(([svg, txt], i) => el('div', { class: 'gi-step' }, el('span', { class: 'gi-n' }, String(i + 1)), el('div', { class: 'gi-pic', html: svg }), el('p', {}, txt))));
    goBtn.textContent = '🎲 ' + (os === 'ios' ? L('Abrir el Bingo en Safari', 'Obrir el Bingo a Safari', 'Open the Bingo in Safari') : L('Abrir el Bingo en Chrome', 'Obrir el Bingo a Chrome', 'Open the Bingo in Chrome'));
    tabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.os === os));
  };
  [['ios', '🍎 iPhone / iPad'], ['android', '🤖 Android']].forEach(([k, t]) => tabs.append(el('button', { type: 'button', class: 'gi-tab no-delay', 'data-os': k, onclick: () => { os = k; paint(); } }, t)));
  goBtn.onclick = () => { goBtn.closest('.popup-back')?.remove(); openOutside(url); };
  paint();
  try { confetti(80); } catch {}
  return popup(el('div', { class: 'gift-pop gift-install' },
    el('div', { class: 'gift-lights' }, ...Array.from({ length: 12 }, (_, i) => el('i', { style: `--i:${i}` }))),
    el('h2', {}, '🎄 ' + L('Pon el Bingo en tu pantalla de inicio', 'Posa el Bingo a la teva pantalla d’inici', 'Put the Bingo on your Home Screen')),
    el('p', { class: 'gi-sub' }, L('Así lo tendrás como una app más, al lado del calendario. Se abrirá en ', 'Així el tindràs com una app més, al costat del calendari. S’obrirà a ', 'So you’ll have it like another app, next to the calendar. It will open in '),
      brName, L(': sigue estos 4 pasos.', ': segueix aquests 4 passos.', ': follow these 4 steps.')),
    tabs, grid, goBtn),
    { cls: 'small', buttons: [{ label: L('Más tarde', 'Més tard', 'Later'), value: false, cls: 'btn-ghost' }] });
}
