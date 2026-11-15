// Día 5: «Desafío de colores de Navidad». Una rueda de 4 colores navideños (abeto, gorro, campanas y reno)
// se ilumina y suena siguiendo una serie; hay que repetirla. Cada ronda, un color más.
// Se juega el tiempo que elige cada uno (de 1 a 20 minutos): los 2 primeros minutos son fáciles y después,
// cuanto más tiempo pasa, más rápido va (y al final la rueda hasta gira). 25 partidas distintas.
// Solo cuenta la primera partida: es la que se guarda y la que se comparte por WhatsApp.
import { el, sleep, confetti, popup, toast } from './fx.js?v=22.0';
import { getLang } from './i18n.js?v=22.0';
import { unlockAudio, oops, fanfare, chime } from './sound.js?v=22.0';
import { nextGame, rng, TOTAL } from './games25.js?v=22.0';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const MIN = 1, MAX = 20, EASY = 2; // minutos fáciles al principio
// orden: arriba, derecha, abajo, izquierda (como la rueda de la foto)
const PADS = [
  { k: 'gold', a: '#ffe27a', b: '#c89412', d: '#7a5208', img: 'ilu-12.webp', f: 659.25, n: ['Campanas', 'Campanes', 'Bells'] },
  { k: 'red', a: '#ff6b6b', b: '#c0182f', d: '#6e0a17', img: 'ilu-gorro.webp', f: 523.25, n: ['Gorro', 'Barret', 'Hat'] },
  { k: 'blue', a: '#7cc4ff', b: '#1f5fbf', d: '#0c2c66', img: 'ilu-6-azul.webp', f: 783.99, n: ['Reno', 'Ren', 'Reindeer'] },
  { k: 'green', a: '#7ee08a', b: '#1f8a3e', d: '#0b4a1f', img: 'ilu-abeto.webp', f: 392.0, n: ['Abeto', 'Avet', 'Fir tree'] },
];
const LV = [['⭐', 'Fácil', 'Fàcil', 'Easy'], ['⭐⭐', 'Normal', 'Normal', 'Normal'], ['⭐⭐⭐', 'Difícil', 'Difícil', 'Hard'], ['⭐⭐⭐⭐', 'Muy difícil', 'Molt difícil', 'Very hard'], ['⭐⭐⭐⭐⭐', '¡Experto!', 'Expert!', 'Expert!']];
// nivel según los minutos que llevas jugando: 0 los 2 primeros, y sube cada 2 minutos
const levelAt = min => min < EASY ? 0 : Math.min(4, 1 + Math.floor((min - EASY) / 2));
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const peekGame = () => { try { return +(localStorage.getItem('adv_g25_colors5') || 0) % TOTAL; } catch { return 0; } };

let AC = null;
const ac = () => (AC ||= new (window.AudioContext || window.webkitAudioContext)());
function bell(f, dur = .4) {
  try {
    const c = ac(), t = c.currentTime;
    [[1, .22], [2.01, .08], [3.0, .04]].forEach(([m, v]) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f * m;
      g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + .015); g.gain.exponentialRampToValueAtTime(.0005, t + dur + .3);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + .35);
    });
  } catch {}
}
function jingleEnd() {
  try {
    const c = ac(), t0 = c.currentTime + .05;
    [659.25, 659.25, 659.25, 0, 659.25, 659.25, 659.25, 0, 659.25, 783.99, 523.25, 587.33, 659.25].forEach((f, i) => { if (!f) return; const t = t0 + i * .17; const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(.18, t); g.gain.exponentialRampToValueAtTime(.0005, t + .4); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + .45); });
  } catch {}
}

// rueda en SVG: 4 arcos con brillo, borde y su dibujo navideño
function arc(cx, cy, R, r, a0, a1) {
  const p = (rad, a) => [cx + rad * Math.cos(a * Math.PI / 180), cy + rad * Math.sin(a * Math.PI / 180)];
  const [x1, y1] = p(R, a0), [x2, y2] = p(R, a1), [x3, y3] = p(r, a1), [x4, y4] = p(r, a0);
  return `M${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 0 1 ${x2.toFixed(1)},${y2.toFixed(1)} L${x3.toFixed(1)},${y3.toFixed(1)} A${r},${r} 0 0 0 ${x4.toFixed(1)},${y4.toFixed(1)} Z`;
}
function wheelSvg() {
  const NS = 'http://www.w3.org/2000/svg', C = 200, R = 186, r = 92, GAP = 5;
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 400 400'); svg.setAttribute('class', 'c5-svg');
  let defs = `<defs><filter id="c5glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  PADS.forEach((p, i) => { defs += `<radialGradient id="c5g${i}" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="${p.a}"/><stop offset=".55" stop-color="${p.b}"/><stop offset="1" stop-color="${p.d}"/></radialGradient>`; });
  defs += '</defs>';
  let g = '';
  PADS.forEach((p, i) => {
    const a0 = -135 + i * 90 + GAP, a1 = -45 + i * 90 - GAP, mid = (a0 + a1) / 2, rm = (R + r) / 2;
    const ix = C + rm * Math.cos(mid * Math.PI / 180), iy = C + rm * Math.sin(mid * Math.PI / 180);
    g += `<g class="c5-pad c5-${p.k}" data-i="${i}">
      <path d="${arc(C, C, R, r, a0, a1)}" fill="url(#c5g${i})" stroke="#2a1206" stroke-width="7" stroke-linejoin="round"/>
      <path d="${arc(C, C, R - 12, R - 30, a0 + 6, a1 - 6)}" fill="#ffffff" opacity=".22" pointer-events="none"/>
      <image href="${p.img}" x="${(ix - 34).toFixed(1)}" y="${(iy - 34).toFixed(1)}" width="68" height="68" pointer-events="none"/>
    </g>`;
  });
  svg.innerHTML = defs + g;
  return svg;
}

export function render(body, ctx) {
  body.style.webkitUserSelect = body.style.userSelect = 'none';
  let first = ctx.prev?.extra?.c5 || null; // la primera partida (la que cuenta)
  let minutes = 3;

  body.append(
    el('div', { class: 'c5-head' },
      el('div', { class: 'c5-ribbon' }, '🎄 ' + L('Desafío de colores', 'Desafiament de colors', 'Colour challenge') + ' 🎄'),
      el('p', { class: 'c5-sub' }, L('Mira, escucha… ¡y repite!', 'Mira, escolta… i repeteix!', 'Watch, listen… and repeat!'))),
    el('details', { class: 'c5-how', open: !first },
      el('summary', {}, '📖 ' + L('Cómo se juega', 'Com es juga', 'How to play')),
      el('ol', {},
        el('li', {}, L('Elige cuántos minutos quieres jugar (de 1 a 20) y pulsa «Empezar».', 'Tria quants minuts vols jugar (d’1 a 20) i prem «Comencem».', 'Choose how many minutes to play (1 to 20) and tap “Start”.')),
        el('li', {}, L('La rueda se ilumina y suena: campanas, gorro, reno y abeto. Mira el orden.', 'La roda s’il·lumina i sona: campanes, barret, ren i avet. Mira l’ordre.', 'The wheel lights up and plays: bells, hat, reindeer and fir. Watch the order.')),
        el('li', {}, L('Después tócalos tú en el mismo orden. Cada ronda se añade un color más.', 'Després toca’ls tu en el mateix ordre. Cada ronda s’hi afegeix un color més.', 'Then tap them in the same order. Each round adds one more colour.')),
        el('li', {}, L('Los 2 primeros minutos son fáciles. Después va cada vez más rápido… ¡y al final la rueda gira!', 'Els 2 primers minuts són fàcils. Després va cada cop més ràpid… i al final la roda gira!', 'The first 2 minutes are easy. Then it gets faster and faster… and at the end the wheel spins!')),
        el('li', {}, L('Si te equivocas, la serie vuelve a empezar, pero el tiempo sigue. Cada ronda acertada suma puntos (más en los niveles difíciles).', 'Si t’equivoques, la sèrie torna a començar, però el temps continua. Cada ronda encertada suma punts (més als nivells difícils).', 'If you make a mistake the series starts again, but the clock keeps going. Each round you get right scores points (more at harder levels).')),
        el('li', {}, L('Solo cuenta la primera partida: es la que se guarda y la que puedes enviar por WhatsApp. Las demás (hay 25 distintas) son para divertirte.', 'Només compta la primera partida: és la que es guarda i la que pots enviar per WhatsApp. Les altres (n’hi ha 25 de diferents) són per divertir-te.', 'Only the first game counts: it’s the one saved and the one you can send on WhatsApp. The others (25 different ones) are just for fun.')))));

  // ---- selector de minutos: bolas colgadas de una guirnalda (de 1 a 20)
  const BCOL = ['red', 'gold', 'green', 'blue', 'silver'];
  const track = el('div', { class: 'sm-track' }, el('i', { class: 'sm-pad-end' }),
    ...Array.from({ length: MAX - MIN + 1 }, (_, k) => el('button', { type: 'button', class: `sm-orn bs-ball bs-${BCOL[k % 5]} no-delay`, 'data-m': MIN + k, onclick: e => e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }) }, el('i'), el('b', {}, MIN + k))),
    el('i', { class: 'sm-pad-end' }));
  const lvlTxt = el('div', { class: 'sm-lvl' });
  const picker = el('div', { class: 'sm-picker' }, el('div', { class: 'sm-garland' }), track, el('div', { class: 'sm-sel' }, el('b', { class: 'sm-selmin' }), lvlTxt));
  const paintPick = () => {
    const r = track.getBoundingClientRect(), mid = r.left + r.width / 2; let best = null, bd = 1e9;
    track.querySelectorAll('.sm-orn').forEach(o => { const b = o.getBoundingClientRect(), d = Math.abs(b.left + b.width / 2 - mid); o.style.setProperty('--k', Math.min(1, d / (r.width / 2)).toFixed(3)); if (d < bd) { bd = d; best = o; } });
    if (!best) return; const m = +best.dataset.m;
    track.querySelectorAll('.sm-orn').forEach(o => o.classList.toggle('on', o === best));
    if (m !== minutes) { minutes = m; bell(PADS[m % 4].f * 1.5, .12); }
    picker.querySelector('.sm-selmin').textContent = m === 1 ? L('1 minuto', '1 minut', '1 minute') : L(`${m} minutos`, `${m} minuts`, `${m} minutes`);
    const top = LV[levelAt(Math.max(0, m - .01))]; lvlTxt.textContent = L('Llegarás hasta: ', 'Arribaràs fins a: ', 'You’ll reach: ') + top[0] + ' ' + L(top[1], top[2], top[3]);
  };
  track.addEventListener('scroll', () => requestAnimationFrame(paintPick), { passive: true });
  const centerPick = () => { const o = track.querySelector(`.sm-orn[data-m="${minutes}"]`); if (o) track.scrollLeft = o.offsetLeft + o.offsetWidth / 2 - track.clientWidth / 2; paintPick(); };
  requestAnimationFrame(centerPick); setTimeout(centerPick, 300); setTimeout(centerPick, 900);
  const startBtn = el('button', { class: 'btn btn-big no-delay c5-start' }, '▶️ ' + L('¡Empezar!', 'Comencem!', 'Start!'));
  const gameTag = el('div', { class: 'c5-gametag' });
  const paintTag = () => { gameTag.textContent = `🎲 ${L('Partida', 'Partida', 'Game')} ${peekGame() + 1} ${L('de', 'de', 'of')} ${TOTAL}` + (first ? '' : ' · ' + L('¡la que cuenta!', 'la que compta!', 'the one that counts!')); };
  paintTag();
  const shareFirst = first ? el('button', { type: 'button', class: 'btn btn-ghost small-btn no-delay', onclick: () => shareResult(first, ctx) }, '📲 ' + L('Enviar mi primera partida', 'Enviar la meva primera partida', 'Send my first game')) : null;
  const intro = el('div', { class: 'sm-intro c5-intro' },
    gameTag,
    el('p', {}, '⏱️ ' + L('¿Cuántos minutos quieres jugar? Desliza las bolas.', 'Quants minuts vols jugar? Llisca les boles.', 'How many minutes do you want to play? Slide the baubles.')),
    picker, startBtn,
    first ? el('p', { class: 'c5-firstnote' }, '🏅 ' + L(`Tu partida buena: ${first.pts} puntos (${first.minutes} min). Las de ahora son para divertirte.`, `La teva partida bona: ${first.pts} punts (${first.minutes} min). Les d’ara són per divertir-te.`, `Your official game: ${first.pts} points (${first.minutes} min). These ones are just for fun.`)) : null,
    shareFirst);

  // ---- tablero
  const svg = wheelSvg();
  const center = el('div', { class: 'c5-center' }, el('img', { src: 'estrella8.webp', alt: '' }), el('b', { class: 'c5-round' }, '0'), el('small', {}, L('ronda', 'ronda', 'round')));
  const wheel = el('div', { class: 'c5-wheel' }, svg, center);
  const clock = el('div', { class: 'c5-chip c5-clock' }), score = el('div', { class: 'c5-chip c5-score' }), lvlChip = el('div', { class: 'c5-chip c5-lvl' });
  const status = el('p', { class: 'c5-status' });
  const board = el('div', { class: 'c5-board' },
    el('div', { class: 'cw-lights' }, ...Array.from({ length: 14 }, (_, i) => el('i', { style: `--i:${i}` }))),
    el('div', { class: 'c5-top' }, clock, lvlChip, score), wheel, status, intro);
  body.append(el('div', { class: 'c5-wrap' }, board));

  const pads = [...svg.querySelectorAll('.c5-pad')];
  let R = Math.random, seq = [], pos = 0, listening = false, alive = true, timeUp = false, tick = 0, t0 = 0, endAt = 0;
  let st = null; // estadísticas de la partida
  const elapsedMin = () => (Date.now() - t0) / 60000;
  const setStatus = t => { status.textContent = t; };
  const paintClock = () => {
    const s = Math.max(0, (endAt - Date.now()) / 1000); clock.textContent = '⏱️ ' + fmt(Math.ceil(s)); clock.classList.toggle('low', s <= 15);
    const lv = levelAt(elapsedMin()); if (st && lv > st.lvl) { st.lvl = lv; lvlUp(lv); }
    lvlChip.textContent = LV[st ? st.lvl : 0][0];
    if (s <= 0 && !timeUp) finish();
  };
  const paintScore = () => { score.textContent = '🎁 ' + (st?.pts || 0); };
  function lvlUp(lv) {
    chime(); wheel.classList.toggle('spin', lv >= 4); wheel.classList.toggle('wobble', lv === 3);
    const b = el('div', { class: 'c5-lvlup' }, LV[lv][0], el('b', {}, L(LV[lv][1], LV[lv][2], LV[lv][3]))); board.append(b); setTimeout(() => b.remove(), 2200);
  }
  async function flash(i, ms) { const p = pads[i]; p.classList.add('lit'); bell(PADS[i].f, ms / 1000); await sleep(ms); p.classList.remove('lit'); }
  async function playSeq() {
    listening = false; wheel.classList.add('watch'); setStatus('👀 ' + L('Mira y escucha…', 'Mira i escolta…', 'Watch and listen…'));
    const e = elapsedMin(), f = e < EASY ? 0 : Math.min(1, (e - EASY) / 8);
    const on = Math.round(e < EASY ? 640 : 560 - 330 * f), gap = Math.round(e < EASY ? 300 : 230 - 150 * f);
    await sleep(600);
    for (const i of seq) { if (!alive || timeUp) return; await flash(i, on); await sleep(gap); }
    if (!alive || timeUp) return;
    listening = true; pos = 0; wheel.classList.remove('watch'); setStatus('👆 ' + L('¡Tu turno!', 'El teu torn!', 'Your turn!'));
  }
  async function nextRound() {
    seq.push(Math.floor(R() * 4));
    center.querySelector('.c5-round').textContent = seq.length;
    center.classList.remove('up'); void center.offsetWidth; center.classList.add('up');
    await playSeq();
  }
  svg.addEventListener('pointerdown', async e => {
    const p = e.target.closest('.c5-pad'); if (!p || !listening || timeUp) return;
    e.preventDefault(); unlockAudio(); try { ac().resume(); } catch {}
    const i = +p.dataset.i;
    p.classList.add('lit'); bell(PADS[i].f, .28); setTimeout(() => p.classList.remove('lit'), 240);
    if (i !== seq[pos]) {
      listening = false; oops(); st.mistakes++; wheel.classList.add('wrong'); setTimeout(() => wheel.classList.remove('wrong'), 600);
      setStatus('❄️ ' + L(`¡Uy! Era ${L(...PADS[seq[pos]].n).toLowerCase()}. Serie de ${seq.length - 1}. ¡Otra vez!`, `Ui! Era ${L(...PADS[seq[pos]].n).toLowerCase()}. Sèrie de ${seq.length - 1}. Una altra vegada!`, `Oops! It was the ${L(...PADS[seq[pos]].n).toLowerCase()}. Series of ${seq.length - 1}. Again!`));
      seq = []; await sleep(1500); if (!timeUp && alive) nextRound(); return;
    }
    pos++;
    if (pos === seq.length) {
      listening = false; st.rounds++; st.pts += seq.length * (1 + st.lvl); paintScore();
      if (seq.length > st.best) st.best = seq.length;
      setStatus('⭐ ' + L('¡Muy bien!', 'Molt bé!', 'Well done!') + ` +${seq.length * (1 + st.lvl)}`);
      wheel.classList.add('good'); setTimeout(() => wheel.classList.remove('good'), 450);
      if (seq.length % 5 === 0) confetti(60);
      await sleep(550); if (!timeUp && alive) nextRound();
    }
  });

  function start() {
    unlockAudio(); try { ac().resume(); } catch {}
    const g = nextGame('colors5'); R = rng(500 + g * 7919);
    intro.remove(); board.classList.add('on'); wheel.classList.remove('spin', 'wobble');
    st = { game: g + 1, minutes, pts: 0, best: 0, rounds: 0, mistakes: 0, lvl: 0, at: Date.now() };
    seq = []; timeUp = false; paintScore();
    t0 = Date.now(); endAt = t0 + minutes * 60000; paintClock(); clearInterval(tick); tick = setInterval(paintClock, 250);
    chime(); nextRound();
  }
  startBtn.onclick = start;
  ctx.cleanup = () => { alive = false; clearInterval(tick); };

  async function finish() {
    timeUp = true; listening = false; clearInterval(tick); clock.textContent = '⏱️ 0:00'; wheel.classList.remove('spin', 'wobble', 'watch');
    setStatus('🔔 ' + L('¡Tiempo!', 'Temps!', 'Time’s up!'));
    const counts = !first;
    if (counts) {
      first = { ...st };
      ctx.submit({ answer: '🎨 ' + L(`${st.pts} puntos · serie de ${st.best} · ${st.minutes} min`, `${st.pts} punts · sèrie de ${st.best} · ${st.minutes} min`, `${st.pts} points · series of ${st.best} · ${st.minutes} min`), status: 'correct', extra: { c5: first } });
    }
    jingleEnd(); setTimeout(() => { fanfare(); confetti(220); }, 1700);
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
    await sleep(900);
    const r = await popup(box, { cls: 'small c5-respop', buttons: [
      { label: '📲 ' + (counts ? L('Enviar por WhatsApp', 'Enviar per WhatsApp', 'Send on WhatsApp') : L('Enviar mi primera partida', 'Enviar la meva primera partida', 'Send my first game')), value: 'share', cls: 'no-delay c5-wa' },
      { label: '🔄 ' + L('Jugar otra', 'Jugar-ne una altra', 'Play another'), value: 'again', cls: 'btn-ghost no-delay' },
      { label: '🎁 ' + L('Continuar', 'Continuar', 'Continue'), value: 'out', cls: 'btn-ghost no-delay' }] });
    if (r === 'share') { await shareResult(first, ctx); }
    if (r === 'out') { ctx.cleanup(); ctx.finish(); return; }
    // volver a la pantalla de elegir minutos (otra partida distinta)
    board.classList.remove('on'); setStatus(''); center.querySelector('.c5-round').textContent = '0'; clock.textContent = ''; paintTag();
    if (!intro.querySelector('.c5-firstnote')) {
      intro.append(el('p', { class: 'c5-firstnote' }, '🏅 ' + L(`Tu partida buena: ${first.pts} puntos (${first.minutes} min). Las de ahora son para divertirte.`, `La teva partida bona: ${first.pts} punts (${first.minutes} min). Les d’ara són per divertir-te.`, `Your official game: ${first.pts} points (${first.minutes} min). These ones are just for fun.`)),
        el('button', { type: 'button', class: 'btn btn-ghost small-btn no-delay', onclick: () => shareResult(first, ctx) }, '📲 ' + L('Enviar mi primera partida', 'Enviar la meva primera partida', 'Send my first game')));
    }
    board.append(intro); requestAnimationFrame(centerPick);
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
  // rueda
  const imgs = await Promise.all(PADS.map(p => loadImg(p.img)));
  const cx = W / 2, cy = 470, Rr = 190, rr = 92;
  PADS.forEach((p, i) => {
    const a0 = (-135 + i * 90 + 5) * Math.PI / 180, a1 = (-45 + i * 90 - 5) * Math.PI / 180;
    const gr = g.createRadialGradient(cx, cy - 60, 20, cx, cy, Rr); gr.addColorStop(0, p.a); gr.addColorStop(.6, p.b); gr.addColorStop(1, p.d);
    g.beginPath(); g.arc(cx, cy, Rr, a0, a1); g.arc(cx, cy, rr, a1, a0, true); g.closePath();
    g.fillStyle = gr; g.fill(); g.lineWidth = 8; g.strokeStyle = '#2a1206'; g.lineJoin = 'round'; g.stroke();
    const m = (a0 + a1) / 2, rm = (Rr + rr) / 2; if (imgs[i]) g.drawImage(imgs[i], cx + rm * Math.cos(m) - 36, cy + rm * Math.sin(m) - 36, 72, 72);
  });
  const star = await loadImg('estrella8.webp'); if (star) g.drawImage(star, cx - 62, cy - 62, 124, 124);
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
