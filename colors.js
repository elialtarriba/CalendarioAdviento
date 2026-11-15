// Día 5: «Desafío de colores». Cuatro cuadrados de colores navideños (dorado, rojo, azul y verde) se iluminan
// en un orden —solo luces, sin sonido ni dibujos— y hay que repetirlo. Cada ronda, uno más.
// Arriba está el COMPTADOR: antes de empezar se toca para elegir los minutos (de 1 a 20). Los 2 primeros minutos
// son fáciles; después va cada vez más rápido (y al final el tablero se balancea y gira). 25 partidas distintas.
// Botón ⛶ para jugar a pantalla completa. Solo cuenta la primera partida: es la que se guarda y la que se comparte.
import { el, sleep, confetti, popup, toast } from './fx.js?v=22.2';
import { getLang } from './i18n.js?v=22.2';
import { unlockAudio } from './sound.js?v=22.2';
import { nextGame, rng, TOTAL } from './games25.js?v=22.2';
import { minutesPopup, fullBtn, exitFull, howStrip } from './gameui.js?v=22.2';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const MIN = 1, MAX = 20, EASY = 2; // minutos fáciles al principio
// orden: arriba izquierda, arriba derecha, abajo izquierda, abajo derecha
const PADS = [
  { k: 'gold', a: '#ffe27a', b: '#d39b14', d: '#7a5208', n: ['dorado', 'daurat', 'gold'] },
  { k: 'red', a: '#ff7a7a', b: '#cf1f34', d: '#6e0a17', n: ['rojo', 'vermell', 'red'] },
  { k: 'green', a: '#86eb94', b: '#1f9a48', d: '#0b4a1f', n: ['verde', 'verd', 'green'] },
  { k: 'blue', a: '#8cccff', b: '#2563eb', d: '#0c2c66', n: ['azul', 'blau', 'blue'] },
];
const LV = [['⭐', 'Fácil', 'Fàcil', 'Easy'], ['⭐⭐', 'Normal', 'Normal', 'Normal'], ['⭐⭐⭐', 'Difícil', 'Difícil', 'Hard'], ['⭐⭐⭐⭐', 'Muy difícil', 'Molt difícil', 'Very hard'], ['⭐⭐⭐⭐⭐', '¡Experto!', 'Expert!', 'Expert!']];
// nivel según los minutos que llevas jugando: 0 los 2 primeros, y sube cada 2 minutos
const levelAt = min => min < EASY ? 0 : Math.min(4, 1 + Math.floor((min - EASY) / 2));
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const peekGame = () => { try { return +(localStorage.getItem('adv_g25_colors5') || 0) % TOTAL; } catch { return 0; } };
const miniGrid = lit => el('div', { class: 'c5-mini' }, ...PADS.map((p, i) => el('i', { class: i === lit ? 'on' : '', style: `--a:${p.a};--b:${p.b}` })));

export function render(body, ctx) {
  body.style.webkitUserSelect = body.style.userSelect = 'none';
  let first = ctx.prev?.extra?.c5 || null; // la primera partida (la que cuenta)
  let minutes = 3, started = false;

  body.append(
    el('div', { class: 'c5-head' },
      el('div', { class: 'c5-ribbon' }, '🎄 ' + L('Desafío de colores', 'Desafiament de colors', 'Colour challenge') + ' 🎄')),
    howStrip([
      { ic: miniGrid(1), t: L('Mira las luces', 'Mira les llums', 'Watch the lights') },
      { ic: '👆', t: L('Repítelas en el mismo orden', 'Repeteix-les en el mateix ordre', 'Repeat them in order') },
      { ic: '⏱️', t: L('Toca el comptador para elegir minutos', 'Toca el comptador per triar minuts', 'Tap the timer to choose minutes') },
      { ic: '🏅📲', t: L('Solo cuenta la 1.ª partida', 'Només compta la 1a partida', 'Only the 1st game counts') }]));

  // ---- tablero
  const pads = PADS.map((p, i) => el('button', { type: 'button', class: `c5-sq c5-${p.k} no-delay`, 'data-i': i, style: `--a:${p.a};--b:${p.b};--d:${p.d}` }));
  const center = el('div', { class: 'c5-center' }, el('b', { class: 'c5-round' }, '0'), el('small', {}, L('ronda', 'ronda', 'round')));
  const grid = el('div', { class: 'c5-grid' }, ...pads, center);
  const clock = el('button', { type: 'button', class: 'c5-chip c5-clock no-delay' });
  const score = el('div', { class: 'c5-chip c5-score' }), lvlChip = el('div', { class: 'c5-chip c5-lvl' });
  const status = el('p', { class: 'c5-status' });
  const gameTag = el('p', { class: 'c5-gametag' });
  const startBtn = el('button', { class: 'btn btn-big no-delay c5-start' }, '▶️ ' + L('¡Empezar!', 'Comencem!', 'Start!'));
  const wrap = el('div', { class: 'c5-wrap gm-wrap' });
  const board = el('div', { class: 'c5-board' },
    el('div', { class: 'cw-lights' }, ...Array.from({ length: 14 }, (_, i) => el('i', { style: `--i:${i}` }))),
    el('div', { class: 'c5-top' }, clock, lvlChip, score, fullBtn(wrap)), grid, status, startBtn, gameTag);
  wrap.prepend(board);
  const extra = el('div', { class: 'c5-extra' });
  body.append(wrap, extra);

  const paintTag = () => { gameTag.textContent = `🎲 ${L('Partida', 'Partida', 'Game')} ${peekGame() + 1} ${L('de', 'de', 'of')} ${TOTAL}` + (first ? '' : ' · ' + L('¡la que cuenta!', 'la que compta!', 'the one that counts!')); };
  const paintIdle = () => { clock.replaceChildren(el('small', {}, '⏱️ ' + L('COMPTADOR', 'COMPTADOR', 'TIMER')), el('b', {}, `${minutes} min ✏️`)); clock.classList.add('pick'); lvlChip.textContent = LV[0][0]; score.textContent = '🎁 0'; };
  const paintExtra = () => extra.replaceChildren(...(first ? [
    el('p', { class: 'c5-firstnote' }, '🏅 ' + L(`Tu partida buena: ${first.pts} puntos (${first.minutes} min). Las de ahora son para divertirte.`, `La teva partida bona: ${first.pts} punts (${first.minutes} min). Les d’ara són per divertir-te.`, `Your official game: ${first.pts} points (${first.minutes} min). These are just for fun.`)),
    el('button', { type: 'button', class: 'btn btn-ghost small-btn no-delay', onclick: () => shareResult(first, ctx) }, '📲 ' + L('Enviar mi primera partida', 'Enviar la meva primera partida', 'Send my first game'))] : []));
  paintTag(); paintIdle(); paintExtra();
  clock.onclick = async () => {
    if (started) return;
    minutes = await minutesPopup(minutes, MIN, MAX, m => { const t = LV[levelAt(Math.max(0, m - .01))]; return L('Llegarás hasta: ', 'Arribaràs fins a: ', 'You’ll reach: ') + t[0] + ' ' + L(t[1], t[2], t[3]); });
    paintIdle();
  };

  let R = Math.random, seq = [], pos = 0, listening = false, alive = true, timeUp = false, tick = 0, t0 = 0, endAt = 0;
  let st = null; // estadísticas de la partida
  const elapsedMin = () => (Date.now() - t0) / 60000;
  const setStatus = t => { status.textContent = t; };
  const paintClock = () => {
    const s = Math.max(0, (endAt - Date.now()) / 1000); clock.replaceChildren('⏱️ ', el('b', {}, fmt(Math.ceil(s)))); clock.classList.toggle('low', s <= 15);
    const lv = levelAt(elapsedMin()); if (st && lv > st.lvl) { st.lvl = lv; lvlUp(lv); }
    lvlChip.textContent = LV[st ? st.lvl : 0][0];
    if (s <= 0 && !timeUp) finish();
  };
  const paintScore = () => { score.textContent = '🎁 ' + (st?.pts || 0); };
  function lvlUp(lv) {
    grid.classList.toggle('spin', lv >= 4); grid.classList.toggle('wobble', lv === 3);
    const b = el('div', { class: 'c5-lvlup' }, LV[lv][0], el('b', {}, L(LV[lv][1], LV[lv][2], LV[lv][3]))); board.append(b); setTimeout(() => b.remove(), 2200);
  }
  async function flash(i, ms) { const p = pads[i]; p.classList.add('lit'); await sleep(ms); p.classList.remove('lit'); }
  async function playSeq() {
    listening = false; grid.classList.add('watch'); setStatus('👀 ' + L('Mira las luces…', 'Mira les llums…', 'Watch the lights…'));
    const e = elapsedMin(), f = e < EASY ? 0 : Math.min(1, (e - EASY) / 8);
    const on = Math.round(e < EASY ? 650 : 560 - 330 * f), gap = Math.round(e < EASY ? 320 : 240 - 150 * f);
    await sleep(650);
    for (const i of seq) { if (!alive || timeUp) return; await flash(i, on); await sleep(gap); }
    if (!alive || timeUp) return;
    listening = true; pos = 0; grid.classList.remove('watch'); setStatus('👆 ' + L('¡Tu turno!', 'El teu torn!', 'Your turn!'));
  }
  async function nextRound() {
    seq.push(Math.floor(R() * 4));
    center.querySelector('.c5-round').textContent = seq.length;
    center.classList.remove('up'); void center.offsetWidth; center.classList.add('up');
    await playSeq();
  }
  grid.addEventListener('pointerdown', async e => {
    const p = e.target.closest('.c5-sq'); if (!p || !listening || timeUp) return;
    e.preventDefault();
    const i = +p.dataset.i;
    p.classList.add('lit'); setTimeout(() => p.classList.remove('lit'), 240);
    if (i !== seq[pos]) {
      listening = false; st.mistakes++; grid.classList.add('wrong'); setTimeout(() => grid.classList.remove('wrong'), 600);
      setStatus('❄️ ' + L(`¡Uy! Era el ${L(...PADS[seq[pos]].n)}. ¡Otra vez!`, `Ui! Era el ${L(...PADS[seq[pos]].n)}. Una altra vegada!`, `Oops! It was ${L(...PADS[seq[pos]].n)}. Again!`));
      pads[seq[pos]].classList.add('hint'); setTimeout(() => pads.forEach(x => x.classList.remove('hint')), 900);
      seq = []; await sleep(1500); if (!timeUp && alive) nextRound(); return;
    }
    pos++;
    if (pos === seq.length) {
      listening = false; st.rounds++; st.pts += seq.length * (1 + st.lvl); paintScore();
      if (seq.length > st.best) st.best = seq.length;
      setStatus('⭐ ' + L('¡Muy bien!', 'Molt bé!', 'Well done!') + ` +${seq.length * (1 + st.lvl)}`);
      grid.classList.add('good'); setTimeout(() => grid.classList.remove('good'), 450);
      if (seq.length % 5 === 0) confetti(60);
      await sleep(550); if (!timeUp && alive) nextRound();
    }
  });

  function start() {
    unlockAudio(); started = true;
    const g = nextGame('colors5'); R = rng(500 + g * 7919);
    startBtn.remove(); clock.classList.remove('pick'); board.classList.add('on'); grid.classList.remove('spin', 'wobble');
    st = { game: g + 1, minutes, pts: 0, best: 0, rounds: 0, mistakes: 0, lvl: 0, at: Date.now() };
    seq = []; timeUp = false; paintScore();
    t0 = Date.now(); endAt = t0 + minutes * 60000; paintClock(); clearInterval(tick); tick = setInterval(paintClock, 250);
    gameTag.textContent = `🎲 ${L('Partida', 'Partida', 'Game')} ${g + 1} ${L('de', 'de', 'of')} ${TOTAL}`;
    nextRound();
  }
  startBtn.onclick = start;
  ctx.cleanup = () => { alive = false; clearInterval(tick); exitFull(wrap); };

  async function finish() {
    timeUp = true; listening = false; clearInterval(tick); clock.replaceChildren('⏱️ ', el('b', {}, '0:00')); grid.classList.remove('spin', 'wobble', 'watch');
    setStatus('🔔 ' + L('¡Tiempo!', 'Temps!', 'Time’s up!'));
    const counts = !first;
    if (counts) {
      first = { ...st };
      ctx.submit({ answer: '🎨 ' + L(`${st.pts} puntos · serie de ${st.best} · ${st.minutes} min`, `${st.pts} punts · sèrie de ${st.best} · ${st.minutes} min`, `${st.pts} points · series of ${st.best} · ${st.minutes} min`), status: 'correct', extra: { c5: first } });
    }
    confetti(220);
    exitFull(wrap);
    const stat = (ic, k, v) => el('div', { class: 'c5-stat' }, el('span', { class: 'c5-st-ic' }, ic), el('b', {}, String(v)), el('small', {}, k));
    const box = el('div', { class: 'c5-result' },
      el('div', { class: 'c5-res-flakes' }, ...Array.from({ length: 22 }, () => el('i', { style: `left:${Math.random() * 100}%;--d:${4 + Math.random() * 4}s;--dl:${-Math.random() * 6}s;--s:${10 + Math.random() * 12}px` }, '❄'))),
      el('img', { class: 'c5-res-star', src: 'estrella8.webp', alt: '' }),
      el('h2', {}, L('¡Tiempo!', 'Temps!', 'Time’s up!')),
      el('p', { class: 'c5-res-msg' }, praise(st)),
      el('div', { class: 'c5-stats' },
        stat('🎁', L('puntos', 'punts', 'points'), st.pts), stat('🔗', L('mejor serie', 'millor sèrie', 'best series'), st.best),
        stat('✅', L('rondas', 'rondes', 'rounds'), st.rounds), stat('❄️', L('fallos', 'errades', 'mistakes'), st.mistakes),
        stat('⏱️', L('minutos', 'minuts', 'minutes'), st.minutes), stat('⭐', L('nivel', 'nivell', 'level'), LV[st.lvl][0])),
      el('p', { class: 'c5-res-game' }, `🎲 ${L('Partida', 'Partida', 'Game')} ${st.game} ${L('de', 'de', 'of')} ${TOTAL}`),
      el('p', { class: 'c5-res-note ' + (counts ? 'ok' : '') }, counts
        ? '🏅 ' + L('¡Esta es tu partida buena! Es la que cuenta y la que puedes enviar por WhatsApp.', 'Aquesta és la teva partida bona! És la que compta i la que pots enviar per WhatsApp.', 'This is your official game! It counts and you can send it on WhatsApp.')
        : '🎈 ' + L(`Esta era para divertirte. La que cuenta es la primera: ${first.pts} puntos.`, `Aquesta era per divertir-te. La que compta és la primera: ${first.pts} punts.`, `This one was for fun. The one that counts is the first: ${first.pts} points.`)));
    await sleep(700);
    const btns = counts ? [{ label: '📲 ' + L('Enviar por WhatsApp', 'Enviar per WhatsApp', 'Send on WhatsApp'), value: 'share', cls: 'no-delay c5-wa' }] : [];
    btns.push({ label: '🔄 ' + L('Jugar otra', 'Jugar-ne una altra', 'Play another'), value: 'again', cls: 'btn-ghost no-delay' }, { label: '🎁 ' + L('Continuar', 'Continuar', 'Continue'), value: 'out', cls: 'btn-ghost no-delay' });
    const r = await popup(box, { cls: 'small c5-respop', buttons: btns });
    if (r === 'share') await shareResult(first, ctx);
    if (r === 'out') { ctx.cleanup(); ctx.finish(); return; }
    // otra partida (distinta): se vuelve a poder tocar el comptador
    started = false; board.classList.remove('on'); setStatus(''); center.querySelector('.c5-round').textContent = '0';
    paintIdle(); paintTag(); paintExtra(); board.insertBefore(startBtn, gameTag);
  }
}

function praise(st) {
  const b = st.best;
  if (b >= 14) return L('¡Memoria de reno mágico! Papá Noel quiere contratarte. 🦌✨', 'Memòria de ren màgic! El Pare Noel et vol contractar. 🦌✨', 'Magic reindeer memory! Santa wants to hire you. 🦌✨');
  if (b >= 9) return L('¡Fantástico! Los duendes están impresionados. 🎄', 'Fantàstic! Els follets estan impressionats. 🎄', 'Fantastic! The elves are impressed. 🎄');
  if (b >= 5) return L('¡Muy bien! Tienes buena memoria navideña. ⭐', 'Molt bé! Tens bona memòria nadalenca. ⭐', 'Well done! You have a good Christmas memory. ⭐');
  return L('¡Bien hecho! Lo importante es pasarlo bien. ❤️', 'Ben fet! L’important és passar-s’ho bé. ❤️', 'Well done! What matters is having fun. ❤️');
}

// ---- imagen para WhatsApp con todos los datos de la partida
const loadImg = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
async function resultImage(res, name) {
  const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  try { await Promise.all(['700 80px "Mountains of Christmas"', '800 60px Montserrat', '600 40px Montserrat'].map(f => document.fonts.load(f))); } catch {}
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0d3b20'); bg.addColorStop(.5, '#14532d'); bg.addColorStop(1, '#7a1020');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const rnd = rng(55); g.fillStyle = '#fff';
  for (let i = 0; i < 160; i++) { g.globalAlpha = .25 + rnd() * .6; g.beginPath(); g.arc(rnd() * W, rnd() * H, 2 + rnd() * 6, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  g.strokeStyle = '#f2c14e'; g.lineWidth = 14; g.strokeRect(36, 36, W - 72, H - 72);
  g.strokeStyle = '#fff6d6'; g.lineWidth = 3; g.strokeRect(58, 58, W - 116, H - 116);
  for (let i = 0; i < 15; i++) { const x = 90 + i * 64, y = 92 + Math.sin(i * .9) * 10; g.fillStyle = ['#ffd24a', '#4ade80', '#ff4d6d', '#7dd3fc'][i % 4]; g.shadowColor = g.fillStyle; g.shadowBlur = 18; g.beginPath(); g.ellipse(x, y, 11, 15, 0, 0, 7); g.fill(); }
  g.shadowBlur = 0; g.textAlign = 'center'; g.fillStyle = '#fff6d6';
  g.font = '700 96px "Mountains of Christmas", cursive'; g.fillText(L('Desafío de colores', 'Desafiament de colors', 'Colour challenge'), W / 2, 225);
  // tablero de 4 cuadrados
  const S0 = 150, G0 = 18, x0 = W / 2 - S0 - G0 / 2, y0 = 300;
  PADS.forEach((p, i) => {
    const x = x0 + (i % 2) * (S0 + G0), y = y0 + Math.floor(i / 2) * (S0 + G0);
    const gr = g.createLinearGradient(x, y, x + S0, y + S0); gr.addColorStop(0, p.a); gr.addColorStop(.6, p.b); gr.addColorStop(1, p.d);
    g.fillStyle = gr; g.strokeStyle = '#2a1206'; g.lineWidth = 8;
    g.beginPath(); g.roundRect ? g.roundRect(x, y, S0, S0, 26) : g.rect(x, y, S0, S0); g.fill(); g.stroke();
    g.fillStyle = '#ffffff55'; g.beginPath(); g.roundRect ? g.roundRect(x + 16, y + 14, S0 - 32, 22, 11) : g.rect(x + 16, y + 14, S0 - 32, 22); g.fill();
  });
  // tarjeta
  const rrect = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  g.fillStyle = '#fffaf0'; g.strokeStyle = '#f2c14e'; g.lineWidth = 8; rrect(110, 700, W - 220, 520, 46); g.fill(); g.stroke();
  g.fillStyle = '#7a1020'; g.font = '700 80px "Mountains of Christmas", cursive'; g.fillText(name || L('¡Lo he conseguido!', 'Ho he aconseguit!', 'I did it!'), W / 2, 795);
  g.fillStyle = '#14532d'; g.font = '600 36px Montserrat, sans-serif';
  g.fillText(L(`Partida ${res.game} de ${TOTAL} · ${res.minutes} min · nivel ${LV[res.lvl][0]}`, `Partida ${res.game} de ${TOTAL} · ${res.minutes} min · nivell ${LV[res.lvl][0]}`, `Game ${res.game} of ${TOTAL} · ${res.minutes} min · level ${LV[res.lvl][0]}`), W / 2, 852);
  const cols = [[L('PUNTOS', 'PUNTS', 'POINTS'), res.pts], [L('MEJOR SERIE', 'MILLOR SÈRIE', 'BEST SERIES'), res.best], [L('RONDAS', 'RONDES', 'ROUNDS'), res.rounds], [L('FALLOS', 'ERRADES', 'MISTAKES'), res.mistakes]];
  cols.forEach(([k, v], i) => { const x = 225 + (i % 2) * 630 / 1, y = 960 + Math.floor(i / 2) * 140; const xx = i % 2 ? W / 2 + 190 : W / 2 - 190; g.fillStyle = '#b8862b'; g.font = '700 30px Montserrat, sans-serif'; g.fillText(k, xx, y); g.fillStyle = '#b3122e'; g.font = '800 72px Montserrat, sans-serif'; g.fillText(String(v), xx, y + 74); });
  g.fillStyle = '#fff6d6'; g.font = '700 44px "Mountains of Christmas", cursive';
  g.fillText(L('Calendario de Adviento · Día 5', 'Calendari d’Advent · Dia 5', 'Advent Calendar · Day 5'), W / 2, 1272);
  return await new Promise(r => cv.toBlob(r, 'image/png'));
}
async function shareResult(res, ctx) {
  if (!res) return;
  const name = (ctx.profile?.name || '').trim();
  const text = L(`🎄 Desafío de colores (día 5): ¡${res.pts} puntos! Mejor serie: ${res.best} · ${res.rounds} rondas · ${res.mistakes} fallos · ${res.minutes} min · partida ${res.game} de ${TOTAL}.`,
    `🎄 Desafiament de colors (dia 5): ${res.pts} punts! Millor sèrie: ${res.best} · ${res.rounds} rondes · ${res.mistakes} errades · ${res.minutes} min · partida ${res.game} de ${TOTAL}.`,
    `🎄 Colour challenge (day 5): ${res.pts} points! Best series: ${res.best} · ${res.rounds} rounds · ${res.mistakes} mistakes · ${res.minutes} min · game ${res.game} of ${TOTAL}.`) + (name ? `\n— ${name}` : '');
  toast('✨ ' + L('Preparando la foto…', 'Preparant la foto…', 'Preparing the picture…'), 1500);
  const blob = await resultImage(res, name).catch(() => null);
  const file = blob ? new File([blob], 'desafio-colores.png', { type: 'image/png' }) : null;
  const url = blob ? URL.createObjectURL(blob) : null;
  const canFiles = !!(file && navigator.canShare && navigator.canShare({ files: [file] }));
  const send = el('button', { type: 'button', class: 'btn btn-big no-delay', onclick: async () => {
    try { if (canFiles) { await navigator.share({ files: [file], text }); return; } } catch (e) { if (e?.name === 'AbortError') return; }
    if (url) { const a = el('a', { href: url, download: 'desafio-colores.png' }); document.body.append(a); a.click(); a.remove(); }
    location.href = 'whatsapp://send?text=' + encodeURIComponent(text);
  } }, '📲 ' + L('Enviar por WhatsApp', 'Enviar per WhatsApp', 'Send on WhatsApp'));
  await popup(el('div', { class: 'g23-sharebox' },
    el('h2', {}, L('Tu foto para el grupo', 'La teva foto per al grup', 'Your picture for the group')),
    url ? el('img', { class: 'g23-shareimg', src: url, alt: '' }) : el('p', {}, '⚠️'),
    el('p', { class: 'muted' }, canFiles ? L('Pulsa el botón y elige WhatsApp y el grupo.', 'Prem el botó i tria WhatsApp i el grup.', 'Tap the button and choose WhatsApp and the group.')
      : L('Se guardará la foto y se abrirá WhatsApp.', 'Es guardarà la foto i s’obrirà WhatsApp.', 'The picture will be saved and WhatsApp will open.')), send),
    { cls: 'small g23-sharepop', buttons: [{ label: L('Cerrar', 'Tancar', 'Close'), value: false, cls: 'btn-ghost' }] });
  if (url) setTimeout(() => URL.revokeObjectURL(url), 60000);
}
