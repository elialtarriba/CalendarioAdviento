// Resumen del mes: al terminar el día 25 (con la actividad, si la tiene la figura),
// una página muy navideña con los 25 días, cada uno en su cuadro: el reto, lo que contestaste
// y la actividad de tu figura. Se puede guardar en PDF y volver al calendario.
import { el, sleep, confetti, toast } from './fx.js?v=17.11';
import { t, tx, getLang } from './i18n.js?v=17.11';
import { chime } from './sound.js?v=17.11';
import { S, figure, loadDay } from './app.js?v=17.11';
import { defaultDay } from './defaults.js?v=17.11';

const TK = { hats: 'hatsTitle', reindeer: 'd4title', differences: 'd6title', tree: 'd8title', memory: 'd12title', goodcheck: 'd13title', diploma: 'd15title', roulette: 'd20title', dance: 'd24title', santa: 'd25title' };
const typeTitle = ty => (TK[ty] && t(TK[ty])) || '';
const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const PIC = { 1: 'ilu-gorro.webp', 8: 'ilu-abeto.webp', 13: 'ilu-17.webp', 16: 'ilu-bola-roja.webp', 22: 'ilu-gl.webp', 24: 'ilu-gr.webp', 25: 'ilu-7.webp' };
const pic = n => PIC[n] || `ilu-${n}.webp`;
const FIG_IMG = { galleta: 'galleta.png', arbol: 'arbol.png', gnomo: 'gnomo.png' };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const plain = html => { const d = document.createElement('div'); d.innerHTML = String(html || ''); return (d.textContent || '').trim(); };

export async function monthSummary() {
  const fig = figure(), key = fig === 'arbol' ? 'act1' : fig === 'gnomo' ? 'act2' : null;
  const year = S.config?.year || new Date().getFullYear();
  const days = await Promise.all(Array.from({ length: 25 }, (_, i) => loadDay(i + 1).catch(() => null).then(c => c || defaultDay(i + 1))));
  const ans = S.answers || {};
  const stars = Object.values(ans).filter(a => a.status === 'correct').length;
  const acts = key ? Object.keys(S.profile?.actDone || {}).length : 0;

  return new Promise(resolve => {
    const cards = days.map((c, i) => {
      const n = i + 1, a = ans[n];
      const st = !a ? 'none' : a.status;
      const badge = { correct: ['★', L('¡Conseguido!', 'Aconseguit!', 'Done!')], incorrect: ['❄', L('Casi…', 'Gairebé…', 'Almost…')], pending: ['⏳', L('Pendiente de revisar', 'Pendent de revisar', 'Waiting for review')], none: ['·', L('No lo hiciste', 'No el vas fer', 'Not done')] }[st] || ['★', ''];
      let answer = a?.answer;
      if (c.type === 'quiz' && typeof answer === 'number') answer = (tx(c.options) || [])[answer];
      const title = c.type === 'quiz' ? tx(c.q) : typeTitle(c.type);
      const actTxt = key ? plain(tx(c[key])) : '';
      const actDone = key && S.profile?.actDone?.[n];
      const extra = [];
      if (n === 23 && key && S.profile?.gifts23?.[key]) {
        const g = S.profile.gifts23[key];
        extra.push(el('div', { class: 'sum-gifts' }, ...[['hug', '🤗', L('Abrazo', 'Abraçada', 'Hug')], ['thanks', '💌', L('Gracias', 'Gràcies', 'Thank you')], ['kitchen', '🍽️', L('Cocina', 'Cuina', 'Kitchen')]]
          .filter(([k]) => g[k]).map(([k, e, w]) => el('span', {}, `${e} ${w} → `, el('b', {}, g[k])))));
      }
      if (n === 25 && S.card) extra.push(el('img', { class: 'sum-card-photo', src: S.card, alt: '' }));
      return el('article', { class: `sum-card st-${st}`, style: `--d:${(i % 6) * .08}s` },
        el('div', { class: 'sum-pic' }, el('img', { src: pic(n), alt: '', loading: 'lazy' }), el('b', { class: 'sum-n' }, n)),
        el('div', { class: 'sum-body' },
          el('div', { class: 'sum-day' }, t('dayN', n), el('span', { class: 'sum-badge' }, badge[0] + ' ' + badge[1])),
          el('h3', {}, title || ''),
          answer !== undefined && answer !== '' && answer !== null && typeof answer !== 'object' ? el('p', { class: 'sum-ans' }, el('span', {}, L('Tu respuesta', 'La teva resposta', 'Your answer') + ': '), String(answer)) : null,
          actTxt ? el('div', { class: 'sum-act' + (actDone ? ' done' : '') },
            el('div', { class: 'sum-act-h' }, (fig === 'arbol' ? '🎄 ' + t('activity1') : '🍄 ' + t('activity2')), el('span', {}, actDone ? '✅ ' + L('Hecha', 'Feta', 'Done') : '⏳ ' + L('Sin hacer', 'Sense fer', 'Not done'))),
            el('p', {}, actTxt)) : null,
          ...extra));
    });

    const close = el('button', { class: 'btn btn-big no-delay sum-home' }, '🏠 ' + L('Volver al calendario', 'Tornar al calendari', 'Back to the calendar'));
    const pdf = el('button', { class: 'btn btn-big btn-green no-delay sum-pdf' }, '📄 ' + L('Guardar en PDF', 'Desar en PDF', 'Save as PDF'));
    const actions = el('div', { class: 'sum-actions' }, pdf, close);
    const page = el('div', { class: 'sum-page' },
      el('div', { class: 'sum-garland' }),
      el('header', { class: 'sum-head' },
        el('img', { class: 'sum-fig', src: FIG_IMG[fig] || FIG_IMG.galleta, alt: '' }),
        el('h1', {}, L('Mi Navidad', 'El meu Nadal', 'My Christmas') + ' ' + year),
        el('p', { class: 'sum-name' }, S.profile?.name || ''),
        el('p', { class: 'sum-sub' }, L('Todo lo que has vivido en tu Calendario de Adviento', 'Tot el que has viscut al teu Calendari d’Advent', 'Everything you lived in your Advent Calendar')),
        el('div', { class: 'sum-stats' },
          el('div', {}, el('b', {}, stars), el('small', {}, L('días con ★', 'dies amb ★', 'days with ★'))),
          el('div', {}, el('b', {}, Object.keys(ans).length), el('small', {}, L('retos hechos', 'reptes fets', 'challenges done'))),
          key ? el('div', {}, el('b', {}, acts), el('small', {}, L('actividades', 'activitats', 'activities'))) : null)),
      el('div', { class: 'sum-grid' }, ...cards),
      el('footer', { class: 'sum-foot' }, el('p', {}, '🎄 ' + L('¡Feliz Navidad y próspero Año Nuevo!', 'Bon Nadal i feliç Any Nou!', 'Merry Christmas and a Happy New Year!') + ' 🎄')),
      actions);
    const wrap = el('div', { class: 'sum-wrap' }, el('div', { class: 'sum-snow' }), page);
    document.body.append(wrap); document.body.classList.add('sum-open');
    setTimeout(() => { chime(); confetti(160); }, 500);

    pdf.onclick = async () => {
      toast('📄 ' + L('En el menú que se abre, elige «Guardar como PDF» (en iPhone: «Imprimir» y después compartir).', 'Al menú que s’obre, tria «Desa com a PDF» (a l’iPhone: «Imprimeix» i després comparteix).', 'In the menu that opens, choose “Save as PDF” (on iPhone: “Print”, then share).'), 5000);
      await sleep(300);
      try { window.print(); } catch {}
    };
    close.onclick = () => { wrap.classList.add('out'); document.body.classList.remove('sum-open'); setTimeout(() => { wrap.remove(); resolve(); }, 500); };
  });
}
