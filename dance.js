// Día 24: el baile secreto
import { t } from './i18n.js?v=20.3';
import { el, sleep, confetti } from './fx.js?v=20.3';

export function render(body, ctx) {
  // el vídeo del baile va fijo con la app: es el archivo baile.mp4 (o baile.mov) subido junto a los demás archivos
  const video = el('video', { class: 'dance-video fixed', controls: true, playsinline: true, loop: true, preload: 'auto' },
    el('source', { src: 'baile.mp4', type: 'video/mp4' }), el('source', { src: 'baile.mov', type: 'video/quicktime' }), el('source', { src: 'baile.mov' }));
  const missing = el('p', { class: 'dance-err', style: 'display:none' }, '⚠️ ' + t('d24missing'));
  video.lastElementChild.addEventListener('error', () => { missing.style.display = ''; video.style.display = 'none'; });
  const stage = el('div', { class: 'dance-box' }, video, missing);
  const again = el('button', { class: 'btn btn-green no-delay', onclick: () => { video.currentTime = 0; video.muted = false; video.play().catch(() => {}); } }, '💃 ' + t('d24again'));
  // intenta empezar solo; si el móvil no deja con sonido, empieza sin sonido y se puede activar
  setTimeout(() => video.play().catch(() => { video.muted = true; video.play().catch(() => {}); }), 900);
  // abre WhatsApp directamente (sin enlaces): la persona elige el chat y adjunta su vídeo
  const share = el('button', { class: 'btn no-delay', onclick: () => {
    const msg = encodeURIComponent(t('d24waText'));
    location.href = `whatsapp://send?text=${msg}`;
  } }, '📱 ' + t('d24share'));
  body.append(el('div', { class: 'dance' },
    el('h2', { class: 'q-title' }, '🕺 ' + t('d24title') + ' 💃'), stage,
    el('p', { class: 'game-help' }, t('d24help')),
    el('ol', {}, ...t('d24steps').map(s => el('li', {}, s))),
    el('div', { class: 'popup-btns' }, again, share),
    el('p', { class: 'tomorrow' }, '🎄 ' + t('d24tomorrow') + ' 🎄')));
  ctx.finishBtn.addEventListener('click', () => video.pause());
  // se da por hecho cuando se ha visto un trocito del baile (si te vas sin verlo, puedes volver a entrar)
  let sent = !!ctx.prev;
  const mark = () => { if (!sent) { sent = true; ctx.submit({ answer: '💃', status: 'correct' }); } };
  video.addEventListener('timeupdate', () => { if (video.currentTime > 4) mark(); });
  video.lastElementChild.addEventListener('error', () => setTimeout(mark, 6000));
}
