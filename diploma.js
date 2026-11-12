// Día 15: el diploma absurdo
import { t } from './i18n.js?v=18';
import { el, confetti } from './fx.js?v=18';
import { chime } from './sound.js?v=18';

export function render(body, ctx) {
  const today = new Date(+(ctx.config?.year) || new Date().getFullYear(), 11, 25).toLocaleDateString(ctx.lang === 'en' ? 'en-GB' : ctx.lang === 'ca' ? 'ca-ES' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  body.append(el('div', { class: 'diploma' },
    el('span', { class: 'corner', style: 'top:8px;left:12px' }, '🎄'), el('span', { class: 'corner', style: 'top:8px;right:12px' }, '🎄'),
    el('h2', {}, t('d15title')),
    el('p', {}, t('d15grant')),
    el('div', { class: 'dname' }, ctx.profile.name || ''),
    el('p', { class: 'dtitle' }, '« ' + t('d15text') + ' »'),
    el('p', { class: 'dextra' }, t('d15extra')),
    el('p', { class: 'dextra' }, '🦌 ' + t('d15valid') + ' · ' + today),
    el('div', { class: 'signs' },
      el('div', { class: 'sign' }, el('div', { class: 'sig' }, t('d15sign1')), t('d15sign1b')),
      el('div', { class: 'sign' }, el('div', { class: 'sig' }, t('d15sign2')), t('d15sign2b'))),
    el('div', { class: 'seal' }, '★ ' + t('d15seal') + ' ★')));
  setTimeout(() => { chime(); confetti(120); }, 1200);
  if (!ctx.prev) ctx.submit({ answer: '🎓', status: 'correct' });
}
