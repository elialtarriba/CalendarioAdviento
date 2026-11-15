// Piezas comunes de los juegos con tiempo (días 5 y 9):
// · minutesPopup: elegir los minutos del COMPTADOR tocando el reloj de arriba (antes de empezar)
// · fullBtn: botón ⛶ para ver el tablero en grande, a pantalla completa, y volver
// · howStrip: explicación con dibujos y muy poca letra
import { el, popup } from './fx.js?v=22.6';
import { getLang } from './i18n.js?v=22.6';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;

export const minTxt = m => (m === 0.5 ? '½' : String(m));
export async function minutesPopup(cur, min, max, levelOf, values = null) {
  const vals = values || Array.from({ length: max - min + 1 }, (_, k) => min + k);
  let pick = cur;
  const info = el('p', { class: 'gm-info' });
  const paint = () => { grid.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.m === pick)); info.textContent = levelOf ? levelOf(pick) : ''; };
  const grid = el('div', { class: 'gm-grid' }, ...vals.map(v => el('button', { type: 'button', class: 'gm-min no-delay', 'data-m': v, onclick: () => { pick = v; paint(); } }, minTxt(v))));
  paint();
  const ok = await popup(el('div', { class: 'gm-box' },
    el('div', { class: 'gm-clock' }, '⏱️'),
    el('h2', {}, L('Comptador', 'Comptador', 'Timer')),
    el('p', {}, L('¿Cuántos minutos quieres jugar?', 'Quants minuts vols jugar?', 'How many minutes do you want to play?')),
    grid, info),
    { cls: 'small', buttons: [{ label: L('Cancelar', 'Cancel·lar', 'Cancel'), value: false, cls: 'btn-ghost' }, { label: '✔︎ ' + L('Listo', 'Fet', 'Done'), value: true }] });
  return ok ? pick : cur;
}

// pone el tablero a pantalla completa (y lo devuelve a su sitio)
export function fullBtn(wrap) {
  const b = el('button', { type: 'button', class: 'gm-full no-delay', title: L('Pantalla completa', 'Pantalla completa', 'Full screen') }, '⛶');
  const back = el('button', { type: 'button', class: 'gm-back no-delay' }, '↩︎ ' + L('Opciones y explicación', 'Opcions i explicació', 'Options and help'));
  const set = on => { wrap.classList.toggle('gm-on', on); document.documentElement.classList.toggle('gm-lock', on); b.textContent = on ? '✕' : '⛶'; };
  b.onclick = () => set(!wrap.classList.contains('gm-on'));
  back.onclick = () => set(false);
  wrap.append(back);
  return b;
}
export const exitFull = wrap => { wrap.classList.remove('gm-on'); document.documentElement.classList.remove('gm-lock'); };

// explicación con dibujos: [{ ic, t }]
export const howStrip = items => el('div', { class: 'gm-how' }, ...items.map((x, i) => el('div', { class: 'gm-step', style: `--i:${i}` },
  el('span', { class: 'gm-num' }, String(i + 1)), typeof x.ic === 'string' ? el('div', { class: 'gm-ic' }, x.ic) : x.ic, el('small', {}, x.t))));
