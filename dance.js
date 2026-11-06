// Día 24: el baile secreto
import { t } from './i18n.js?v=15.7';
import { el, sleep, confetti } from './fx.js?v=15.7';
import { jingle } from './sound.js?v=15.7';

export function render(body, ctx) {
  const dancer = el('div', { class: 'dancer' }, el('img', { src: 'galleta.png', alt: '' }));
  const timer = el('div', { class: 'dance-timer' }, '25');
  const vid = (ctx.config?.danceVideo || '').trim();
  const yt = vid.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
  const stage = yt ? el('iframe', { class: 'dance-video', src: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&playsinline=1&rel=0`, allow: 'autoplay; encrypted-media; fullscreen', allowfullscreen: true })
    : vid ? el('video', { class: 'dance-video', src: vid, controls: true, autoplay: true, playsinline: true })
    : el('div', { class: 'dance-stage' }, el('div', { class: 'disco' }), el('div', { class: 'floor' }), dancer, timer);
  const again = vid ? null : el('button', { class: 'btn btn-green', onclick: play }, '💃 ' + t('d24again'));
  const share = el('a', { class: 'btn', href: 'https://wa.me/', target: '_blank', rel: 'noopener', style: 'text-decoration:none;display:inline-block' }, '📱 ' + t('d24share'));
  body.append(el('div', { class: 'dance' },
    el('h2', { class: 'q-title' }, '🕺 ' + t('d24title') + ' 💃'), stage,
    el('p', { class: 'game-help' }, t('d24help')),
    el('ol', {}, ...t('d24steps').map(s => el('li', {}, s))),
    el('div', { class: 'popup-btns' }, again, share),
    el('p', { class: 'tomorrow' }, '🎄 ' + t('d24tomorrow') + ' 🎄')));
  let iv;
  function play() {
    clearInterval(iv); dancer.classList.remove('go'); void dancer.offsetWidth; dancer.classList.add('go');
    let s = 25; timer.textContent = s;
    iv = setInterval(() => { s--; timer.textContent = Math.max(0, s); if (s <= 0) { clearInterval(iv); confetti(150); } }, 1000);
    // ~6,6 s por vuelta de melodía → 4 vueltas ≈ 25 s
    jingle(4);
  }
  if (!vid) setTimeout(play, 1600);
  ctx.finishBtn.addEventListener('click', () => clearInterval(iv));
  if (!ctx.prev) ctx.submit({ answer: '💃', status: 'correct' });
}
