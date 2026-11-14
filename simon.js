// Día 9: «Papá Noel dice» (Simón dice). Cuatro botones navideños se iluminan y suenan siguiendo una
// secuencia; hay que repetirla. Cada ronda se añade uno más y va más rápido. Se juega hasta que se
// acaba el tiempo (4 minutos por defecto; se puede elegir). Al acabar: «¡Tiempo!».
import { el, sleep, confetti } from './fx.js?v=19';
import { getLang } from './i18n.js?v=19';
import { unlockAudio, oops, fanfare, chime } from './sound.js?v=19';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const PADS = [
  { c: 'green', img: 'ilu-11.webp', f: 392.0 },  // calcetín · sol
  { c: 'red', img: 'bola8-4.webp', f: 523.25 },   // bola roja · do
  { c: 'gold', img: 'ilu-12.webp', f: 659.25 },   // campanas · mi
  { c: 'blue', img: 'bola8-3.webp', f: 783.99 },  // bola azul · sol alto
];
const MIN = 3, MAX = 15;
// dificultad según los minutos: de 3 a 5 muy fácil; cuantos más minutos, más rápido
const diff = m => Math.max(0, Math.min(1, (m - 5) / 10));
const LEVELS = [[5, '⭐', ['Muy fácil', 'Molt fàcil', 'Very easy']], [8, '⭐⭐', ['Fácil', 'Fàcil', 'Easy']], [11, '⭐⭐⭐', ['Normal', 'Normal', 'Normal']], [13, '⭐⭐⭐⭐', ['Difícil', 'Difícil', 'Hard']], [15, '⭐⭐⭐⭐⭐', ['Muy difícil', 'Molt difícil', 'Very hard']]];
let AC = null;
const ac = () => (AC ||= new (window.AudioContext || window.webkitAudioContext)());
function bell(f, dur = .45) {
  try {
    const c = ac(), t = c.currentTime;
    [[1, .22], [2.01, .08], [3.0, .04]].forEach(([m, v]) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f * m;
      g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + .015); g.gain.exponentialRampToValueAtTime(.0005, t + dur + .3);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + .35);
    });
  } catch {}
}
// melodía de «¡Tiempo!»: campanadas como de reloj de Nochevieja + escala alegre
function timeUpSong() {
  try {
    const c = ac(), t0 = c.currentTime + .1;
    for (let k = 0; k < 4; k++) { const t = t0 + k * .55; [[196, .3], [392, .12], [588, .06]].forEach(([f, v]) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0005, t + 1.2); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 1.25); }); }
    [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((f, i) => { const t = t0 + 2.4 + i * .14; const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(.16, t); g.gain.exponentialRampToValueAtTime(.0005, t + .5); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + .55); });
  } catch {}
}

export function render(body, ctx) {
  body.style.webkitUserSelect = body.style.userSelect = 'none';
  let minutes = 4;
  body.append(
    el('h2', { class: 'q-title cw-title' }, '🎅 ' + L('Papá Noel dice', 'El Pare Noel diu', 'Santa says') + ' 🎅'),
    el('p', { class: 'game-help cw-help' }, L('Mira y escucha: los botones se iluminan y suenan en un orden. Después, tócalos tú en el mismo orden. Cada vez se añade uno más y va un poco más rápido. Si te equivocas, empiezas otra vez desde el principio, ¡pero el tiempo sigue corriendo!',
      'Mira i escolta: els botons s’il·luminen i sonen en un ordre. Després, toca’ls tu en el mateix ordre. Cada vegada se n’afegeix un més i va una mica més ràpid. Si t’equivoques, tornes a començar, però el temps continua corrent!',
      'Watch and listen: the buttons light up and play in an order. Then tap them in the same order. Each time one more is added and it gets a bit faster. If you make a mistake you start again, but the clock keeps ticking!')));

  // ---- elegir el tiempo
  // ---- selector de tiempo: bolas de Navidad con los minutos colgadas de una guirnalda; se desliza con el dedo
  const BCOL = ['red', 'gold', 'green', 'blue', 'silver'];
  const track = el('div', { class: 'sm-track' }, el('i', { class: 'sm-pad-end' }),
    ...Array.from({ length: MAX - MIN + 1 }, (_, k) => el('button', { type: 'button', class: `sm-orn bs-ball bs-${BCOL[k % 5]} no-delay`, 'data-m': MIN + k, onclick: e => e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }) }, el('i'), el('b', {}, MIN + k))),
    el('i', { class: 'sm-pad-end' }));
  const lvl = el('div', { class: 'sm-lvl' });
  const chips = el('div', { class: 'sm-picker' }, el('div', { class: 'sm-garland' }), track, el('div', { class: 'sm-sel' }, el('b', { class: 'sm-selmin' }), lvl));
  const paintPick = () => {
    const r = track.getBoundingClientRect(), mid = r.left + r.width / 2; let best = null, bd = 1e9;
    track.querySelectorAll('.sm-orn').forEach(o => { const b = o.getBoundingClientRect(), d = Math.abs(b.left + b.width / 2 - mid); o.style.setProperty('--k', Math.min(1, d / (r.width / 2)).toFixed(3)); if (d < bd) { bd = d; best = o; } });
    if (!best) return; const m = +best.dataset.m;
    track.querySelectorAll('.sm-orn').forEach(o => o.classList.toggle('on', o === best));
    if (m !== minutes) { minutes = m; bell(PADS[m % 4].f * 1.5, .15); }
    chips.querySelector('.sm-selmin').textContent = L(`${m} minutos`, `${m} minuts`, `${m} minutes`);
    const lv = LEVELS.find(x => m <= x[0]); lvl.textContent = lv[1] + ' ' + L(...lv[2]);
  };
  track.addEventListener('scroll', () => requestAnimationFrame(paintPick), { passive: true });
  const centerPick = () => { const o = track.querySelector(`.sm-orn[data-m="${minutes}"]`); if (o) track.scrollLeft = o.offsetLeft + o.offsetWidth / 2 - track.clientWidth / 2; paintPick(); };
  requestAnimationFrame(centerPick); setTimeout(centerPick, 300); setTimeout(centerPick, 900);
  const startBtn = el('button', { class: 'btn btn-big no-delay' }, '▶️ ' + L('¡Empezar!', 'Comencem!', 'Start!'));
  const intro = el('div', { class: 'sm-intro' },
    el('p', {}, '⏱️ ' + L('Tienes 4 minutos para jugar. Si quieres otro tiempo, desliza las bolas (de 3 a 15 minutos). ¡Cuantos más minutos, más difícil!', 'Tens 4 minuts per jugar. Si vols un altre temps, llisca les boles (de 3 a 15 minuts). Com més minuts, més difícil!', 'You have 4 minutes to play. For another time, slide the baubles (3 to 15 minutes). The more minutes, the harder!')),
    chips, startBtn);

  // ---- tablero
  const pads = PADS.map((p, i) => el('button', { type: 'button', class: `sm-pad sm-${p.c} no-delay`, 'data-i': i }, el('img', { src: p.img, alt: '' })));
  const center = el('div', { class: 'sm-center' }, el('img', { src: 'estrella8.webp', alt: '' }), el('b', { class: 'sm-level' }, '0'), el('small', {}, L('ronda', 'ronda', 'round')));
  const ring = el('div', { class: 'sm-ring' }, ...pads, center);
  const clock = el('div', { class: 'sm-clock' }), best = el('div', { class: 'sm-best' }), status = el('p', { class: 'sm-status' });
  const top = el('div', { class: 'sm-top' }, clock, best);
  const board = el('div', { class: 'cw-board sm-board' }, el('div', { class: 'cw-lights' }, ...Array.from({ length: 14 }, (_, i) => el('i', { style: `--i:${i}` }))), top, ring, status, intro);
  const msg = el('div', { class: 'sp-msg' });
  body.append(el('div', { class: 'cw-wrap sm-wrap' }, board, msg));

  let seq = [], pos = 0, record = 0, listening = false, playing = false, endAt = 0, tick = 0, alive = true, timeUp = false;
  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const paintClock = () => { const s = Math.max(0, Math.ceil((endAt - Date.now()) / 1000)); clock.textContent = '⏱️ ' + fmt(s); clock.classList.toggle('low', s <= 20); if (s <= 0 && !timeUp) finish(); };
  const paintBest = () => { best.textContent = '🏆 ' + L(`Récord: ${record}`, `Rècord: ${record}`, `Best: ${record}`); };
  const setStatus = t => { status.textContent = t; };
  const level = () => center.querySelector('.sm-level');

  async function flash(i, ms) {
    const p = pads[i]; p.classList.add('lit'); bell(PADS[i].f, ms / 1000);
    await sleep(ms); p.classList.remove('lit');
  }
  async function playSeq() {
    playing = true; listening = false; ring.classList.add('watch');
    setStatus('👀 ' + L('Mira y escucha…', 'Mira i escolta…', 'Watch and listen…'));
    const n = seq.length, d = diff(minutes);
    const on = Math.max(360 - d * 170, 640 - d * 200 - n * (14 + d * 20)), gap = Math.max(160 - d * 80, 280 - d * 100 - n * (6 + d * 6));
    await sleep(650);
    for (const i of seq) { if (!alive || timeUp) return; await flash(i, on); await sleep(gap); }
    playing = false; listening = true; pos = 0; ring.classList.remove('watch');
    setStatus('👆 ' + L('¡Tu turno!', 'El teu torn!', 'Your turn!'));
  }
  async function nextRound() {
    seq.push(Math.floor(Math.random() * 4));
    if (seq.length === 1 && diff(minutes) > .55) seq.push(Math.floor(Math.random() * 4)); // en los niveles difíciles se empieza con 2 level().textContent = seq.length;
    center.classList.remove('up'); void center.offsetWidth; center.classList.add('up');
    await playSeq();
  }
  ring.addEventListener('pointerdown', async e => {
    const p = e.target.closest('.sm-pad'); if (!p || !listening || timeUp) return;
    e.preventDefault(); unlockAudio(); try { ac().resume(); } catch {}
    const i = +p.dataset.i;
    p.classList.add('lit'); bell(PADS[i].f, .3); setTimeout(() => p.classList.remove('lit'), 260);
    if (i !== seq[pos]) {
      listening = false; oops(); ring.classList.add('wrong'); setTimeout(() => ring.classList.remove('wrong'), 600);
      setStatus('❄️ ' + L(`¡Uy! Has llegado a la ronda ${seq.length}. Volvemos a empezar…`, `Ui! Has arribat a la ronda ${seq.length}. Tornem a començar…`, `Oops! You reached round ${seq.length}. Starting again…`));
      seq = []; await sleep(1500); if (!timeUp && alive) nextRound(); return;
    }
    pos++;
    if (pos === seq.length) {
      listening = false;
      if (seq.length > record) { record = seq.length; paintBest(); }
      setStatus('⭐ ' + L('¡Muy bien!', 'Molt bé!', 'Well done!'));
      ring.classList.add('good'); setTimeout(() => ring.classList.remove('good'), 500);
      await sleep(500); if (!timeUp && alive) nextRound();
    }
  });

  function start() {
    unlockAudio(); try { ac().resume(); } catch {} intro.remove(); board.classList.add('on');
    seq = []; record = 0; timeUp = false; paintBest();
    endAt = Date.now() + minutes * 60000; paintClock(); clearInterval(tick); tick = setInterval(paintClock, 250);
    chime(); nextRound();
  }
  startBtn.onclick = start;
  ctx.cleanup = () => { alive = false; clearInterval(tick); };

  async function finish() {
    timeUp = true; listening = false; clearInterval(tick); clock.textContent = '⏱️ 0:00';
    if (!ctx.prev && !finish.sent) { finish.sent = true; ctx.submit({ answer: '🎅 ' + L(`Récord: ronda ${record}`, `Rècord: ronda ${record}`, `Best: round ${record}`), status: 'correct' }); }
    const fx = el('div', { class: 'sm-timeup' },
      el('div', { class: 'sm-tu-flakes' }, ...Array.from({ length: 34 }, () => el('i', { style: `left:${Math.random() * 100}%;--d:${4 + Math.random() * 5}s;--dl:${-Math.random() * 6}s;--s:${10 + Math.random() * 16}px;--x:${(Math.random() - .5) * 80}px` }, '❄'))),
      el('img', { class: 'sm-tu-clock', src: 'estrella8.webp', alt: '' }),
      el('div', { class: 'sm-tu-title' }, L('¡Tiempo!', 'Temps!', 'Time’s up!')),
      el('p', { class: 'sm-tu-text' }, L(`Tu récord: ¡${record} seguidos! Papá Noel está impresionado. 🎄`, `El teu rècord: ${record} seguits! El Pare Noel està impressionat. 🎄`, `Your best: ${record} in a row! Santa is impressed. 🎄`)));
    board.append(fx);
    timeUpSong(); setTimeout(() => { fanfare(); confetti(200); }, 2400);
    const again = el('button', { class: 'btn btn-big no-delay' }, '🔄 ' + L('Volver a jugar', 'Tornar a jugar', 'Play again'));
    const out = el('button', { class: 'btn btn-ghost btn-big no-delay' }, '🎁 ' + L('Continuar', 'Continuar', 'Continue'));
    msg.replaceChildren(el('div', { class: 'ttt-fx-btns' }, again, out)); msg.classList.add('on');
    setTimeout(() => msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 800);
    again.onclick = () => { fx.remove(); msg.classList.remove('on'); board.classList.remove('on'); setStatus(''); level().textContent = '0'; clock.textContent = ''; board.append(intro); };
    out.onclick = () => { ctx.cleanup(); ctx.finish(); };
  }
}
