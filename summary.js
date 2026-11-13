// Resumen del mes: al terminar el día 25 (con la actividad, si la tiene la figura),
// una página muy navideña con los 25 días, cada uno en su cuadro: el reto, lo que contestaste
// y la actividad de tu figura. Se puede guardar en PDF y volver al calendario.
import { el, sleep, confetti, toast, popup } from './fx.js?v=18.1';
import { t, tx, getLang } from './i18n.js?v=18.1';
import { chime } from './sound.js?v=18.1';
import { S, figure, loadDay } from './app.js?v=18.1';
import { defaultDay } from './defaults.js?v=18.1';

const TK = { hats: 'hatsTitle', reindeer: 'd4title', differences: 'd6title', tree: 'd8title', memory: 'd12title', goodcheck: 'd13title', diploma: 'd15title', roulette: 'd20title', dance: 'd24title', pairs: 'd25title', puzzle: 'puzzleTitle' };
const typeTitle = ty => ty === 'sudoku' ? L('Sudoku de Navidad', 'Sudoku de Nadal', 'Christmas sudoku') : ty === 'simon' ? L('Papá Noel dice', 'El Pare Noel diu', 'Santa says') : ty === 'catch' ? L('Atrapa los regalos', 'Atrapa els regals', 'Catch the presents') : ty === 'ballsort' ? L('Ordena las bolas de Navidad', 'Ordena les boles de Nadal', 'Sort the Christmas baubles') : ty === 'slidepuzzle' ? L('Puzle deslizante', 'Puzle lliscant', 'Sliding puzzle') : ty === 'wordsearch' ? L('Sopa de letras de animales', 'Sopa de lletres d’animals', 'Animal word search') : ty === 'crossword' ? L('Crucigrama de Navidad', 'Mots encreuats de Nadal', 'Christmas crossword') : ty === 'ttt' ? L('Tres en raya navideño', 'Tres en ratlla de Nadal', 'Christmas noughts and crosses') : ty === 'puzzle' ? L('Haz el puzle y descubre qué imagen esconde', 'Fes el puzle i descobreix quina imatge amaga', 'Do the puzzle') : (TK[ty] && t(TK[ty])) || '';
const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const PIC = { 25: 'bola25.webp', 1: 'ilu-gorro.webp', 8: 'ilu-abeto.webp', 13: 'ilu-17.webp', 16: 'ilu-bola-roja.webp', 22: 'ilu-gl.webp', 24: 'ilu-gr.webp' };
const pic = n => PIC[n] || `ilu-${n}.webp`;
const FIG_IMG = { galleta: 'galleta.png', arbol: 'arbol.png', gnomo: 'gnomo.png' };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const plain = html => { const d = document.createElement('div'); d.innerHTML = String(html || ''); return (d.textContent || '').trim(); };

export async function monthSummary(opts = {}) {
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
    // qué más se puede hacer en la casilla 25
    let menu = null;
    if (opts.menu) {
      const pick = v => () => { wrap.classList.add('out'); document.body.classList.remove('sum-open'); setTimeout(() => { wrap.remove(); resolve(v); }, 500); };
      const FIGA = { arbol: 'arbol.png', gnomo: 'gnomo.png' };
      menu = el('section', { class: 'sum-menu' },
        el('h2', {}, '✨ ' + L('¿Qué quieres hacer ahora?', 'Què vols fer ara?', 'What would you like to do now?')),
        el('div', { class: 'sum-menu-btns' },
          el('button', { type: 'button', class: 'sum-opt no-delay', onclick: pick('play') }, el('img', { src: 'bola25.webp', alt: '' }),
            el('b', {}, L('Volver a jugar', 'Tornar a jugar', 'Play again')), el('small', {}, L('El juego de parejas y la bola que cobra vida', 'El joc de parelles i la bola que cobra vida', 'The pairs game and the snow globe coming to life'))),
          el('button', { type: 'button', class: 'sum-opt no-delay', onclick: pick('fresh') }, el('img', { src: 'ilu-gl.webp', alt: '' }),
            el('b', {}, L('Abrir la casilla 25 desde el principio', 'Obrir la casella 25 des del principi', 'Open door 25 from the start')), el('small', {}, opts.menu.act ? L('Como el primer día: juego, bola y tu actividad', 'Com el primer dia: joc, bola i la teva activitat', 'Like the first day: game, globe and your activity') : L('Como el primer día', 'Com el primer dia', 'Like the first day'))),
          opts.menu.act ? el('button', { type: 'button', class: 'sum-opt no-delay', onclick: pick('act') }, el('img', { src: FIGA[fig] || 'galleta.png', alt: '' }),
            el('b', {}, L('Hacer mi actividad', 'Fer la meva activitat', 'Do my activity')), el('small', {}, fig === 'arbol' ? t('activity1') : t('activity2'))) : null));
    }
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
      menu,
      el('div', { class: 'sum-grid' }, ...cards),
      el('footer', { class: 'sum-foot' }, el('p', {}, '🎄 ' + L('¡Feliz Navidad y próspero Año Nuevo!', 'Bon Nadal i feliç Any Nou!', 'Merry Christmas and a Happy New Year!') + ' 🎄')),
      actions);
    const wrap = el('div', { class: 'sum-wrap' }, el('div', { class: 'sum-snow' }), page);
    document.body.append(wrap); document.body.classList.add('sum-open');
    setTimeout(() => { chime(); confetti(160); }, 500);

    pdf.onclick = async () => {
      if (pdf.disabled) return; pdf.disabled = true; const label = pdf.textContent;
      pdf.textContent = '⏳ ' + L('Preparando el PDF…', 'Preparant el PDF…', 'Preparing the PDF…');
      let file = null;
      try { file = await makePdf(page, cards, { year, name: S.profile?.name || '' }); } catch (e) { console.error(e); }
      pdf.disabled = false; pdf.textContent = label;
      if (!file) { toast('⚠️ ' + L('No se ha podido crear el PDF', 'No s’ha pogut crear el PDF', 'The PDF could not be created'), 4000); return; }
      // el móvil solo deja compartir con un toque directo: por eso un segundo botón
      const url = URL.createObjectURL(file);
      const canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
      const go = el('button', { type: 'button', class: 'btn btn-big btn-green no-delay', onclick: async () => {
        try { if (canShare) { await navigator.share({ files: [file], title: file.name }); return; } } catch (e) { if (e?.name === 'AbortError') return; }
        const a = el('a', { href: url, download: file.name, target: '_blank' }); document.body.append(a); a.click(); a.remove();
      } }, '📄 ' + (canShare ? L('Guardar o compartir el PDF', 'Desar o compartir el PDF', 'Save or share the PDF') : L('Descargar el PDF', 'Descarregar el PDF', 'Download the PDF')));
      await popup(el('div', { class: 'sum-pdfpop' }, el('h2', {}, '🎄 ' + L('¡Tu PDF está listo!', 'El teu PDF és a punt!', 'Your PDF is ready!')),
        el('p', {}, canShare ? L('Pulsa el botón y elige «Guardar en Archivos» (o compártelo por WhatsApp o correo).', 'Prem el botó i tria «Desa a Fitxers» (o comparteix-lo per WhatsApp o correu).', 'Tap the button and choose “Save to Files” (or share it).') : L('Pulsa el botón para descargarlo.', 'Prem el botó per descarregar-lo.', 'Tap the button to download it.')), go),
        { cls: 'small', buttons: [{ label: L('Cerrar', 'Tancar', 'Close'), value: false, cls: 'btn-ghost' }] });
      setTimeout(() => URL.revokeObjectURL(url), 120000);
    };
    close.onclick = () => { wrap.classList.add('out'); document.body.classList.remove('sum-open'); setTimeout(() => { wrap.remove(); resolve(); }, 500); };
  });
}

// ---- PDF: cada cuadro se fotografía (html2canvas) y se colocan en hojas A4 con fondo navideño (jsPDF)
const loadScript = src => new Promise((res, rej) => { if (document.querySelector(`script[data-src="${src}"]`)) return res(); const sc = document.createElement('script'); sc.src = src; sc.dataset.src = src; sc.onload = res; sc.onerror = rej; document.head.append(sc); });
async function makePdf(page, cards, { year, name }) {
  await loadScript('lib-html2canvas.js?v=1'); await loadScript('lib-jspdf.js?v=1');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
  const PW = doc.internal.pageSize.getWidth(), PH = doc.internal.pageSize.getHeight(), M = 28;
  const bg = () => { doc.setFillColor(74, 12, 24); doc.rect(0, 0, PW, PH, 'F'); doc.setDrawColor(212, 160, 23); doc.setLineWidth(3); doc.rect(12, 12, PW - 24, PH - 24); };
  // portada dibujada a mano (los textos dorados no salen bien en html2canvas)
  const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 560; const g = cv.getContext('2d'); g.fillStyle = '#4a0c18'; g.fillRect(0, 0, 1200, 560);
  try { await document.fonts.ready; } catch {}
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const fig = page.querySelector('.sum-fig'); if (fig?.complete) { const h = 170, w = h * fig.naturalWidth / fig.naturalHeight; g.drawImage(fig, 600 - w / 2, 10, w, h); }
  const gd = g.createLinearGradient(0, 200, 0, 300); gd.addColorStop(0, '#fff6c2'); gd.addColorStop(.55, '#f2c14e'); gd.addColorStop(1, '#b8860b');
  g.fillStyle = gd; g.font = '700 110px "Mountains of Christmas", cursive'; g.fillText(L('Mi Navidad', 'El meu Nadal', 'My Christmas') + ' ' + year, 600, 250);
  g.fillStyle = '#ffe9a8'; g.font = '64px "Great Vibes", cursive'; g.fillText(name, 600, 345);
  g.fillStyle = '#fff3d0'; g.font = '30px Montserrat, sans-serif'; g.fillText(L('Todo lo que has vivido en tu Calendario de Adviento', 'Tot el que has viscut al teu Calendari d’Advent', 'Everything you lived in your Advent Calendar'), 600, 410);
  const stats = [...page.querySelectorAll('.sum-stats > div')].map(d => [d.querySelector('b')?.textContent || '', d.querySelector('small')?.textContent || '']);
  stats.forEach(([b, sm], i) => { const x = 600 + (i - (stats.length - 1) / 2) * 250; g.fillStyle = '#fff8ec'; g.strokeStyle = '#d4a017'; g.lineWidth = 5; g.beginPath(); g.roundRect ? g.roundRect(x - 110, 450, 220, 100, 18) : g.rect(x - 110, 450, 220, 100); g.fill(); g.stroke();
    g.fillStyle = '#7a1020'; g.font = '700 46px "Playfair Display", serif'; g.fillText(b, x, 485); g.font = '700 22px Montserrat, sans-serif'; g.fillText(sm, x, 527); });
  bg();
  let y = M + 10; const cw = PW - 2 * M;
  const hh = cw * cv.height / cv.width; doc.addImage(cv.toDataURL('image/jpeg', .92), 'JPEG', M, y, cw, hh); y += hh + 14;
  // los cuadros: sin animación y a tamaño fijo para que salgan nítidos
  const holder = el('div', { class: 'sum-pdf-holder' }); document.body.append(holder);
  try {
    for (const card of cards) {
      const clone = card.cloneNode(true); clone.style.animation = 'none'; clone.style.width = '640px'; holder.replaceChildren(clone);
      await Promise.all([...clone.querySelectorAll('img')].map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
      const shot = await window.html2canvas(clone, { scale: 1.6, backgroundColor: null, useCORS: true, logging: false });
      const h = cw * shot.height / shot.width;
      if (y + h > PH - M) { doc.addPage(); bg(); y = M + 6; }
      doc.addImage(shot.toDataURL('image/jpeg', .88), 'JPEG', M, y, cw, h); y += h + 10;
    }
  } finally { holder.remove(); }
  doc.setTextColor(255, 233, 168); doc.setFontSize(16);
  if (y + 30 > PH - M) { doc.addPage(); bg(); y = M + 20; }
  doc.text(L('¡Feliz Navidad y próspero Año Nuevo!', 'Bon Nadal i feliç Any Nou!', 'Merry Christmas and a Happy New Year!'), PW / 2, y + 18, { align: 'center' });
  const blob = doc.output('blob');
  return new File([blob], `mi-navidad-${year}.pdf`, { type: 'application/pdf' });
}
