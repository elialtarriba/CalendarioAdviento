// Día 19: «El código secreto de Papá Noel» (Mastermind para jugar solo).
// Papá Noel esconde una combinación de bolas de Navidad. Hay 10 intentos para adivinarla; después de cada
// intento sale una pista por bola, en el mismo orden: verde = color y sitio correctos; blanca = el color está en otro sitio.
// Hay un reloj que cuenta lo que tardas. 3 niveles y 25 partidas distintas. Solo cuenta la primera partida:
// al acabarla sale un cartel con todos los datos para enviarlo por WhatsApp al grupo de la familia.
import { el, sleep, confetti, popup, toast } from './fx.js?v=22.5';
import { getLang } from './i18n.js?v=22.5';
import { unlockAudio, oops, fanfare, chime, pop, sadTrombone } from './sound.js?v=22.5';
import { nextGame, rng, TOTAL } from './games25.js?v=22.5';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const COLORS = [
  { k: 'red', c1: '#ff7a7a', c2: '#d01f2f', c3: '#6e0a14', n: ['roja', 'vermella', 'red'] },
  { k: 'gold', c1: '#fff0a8', c2: '#e0a91c', c3: '#7a5208', n: ['dorada', 'daurada', 'gold'] },
  { k: 'green', c1: '#8ef0a0', c2: '#1f9a48', c3: '#0b4a1f', n: ['verde', 'verda', 'green'] },
  { k: 'blue', c1: '#9fd4ff', c2: '#2563eb', c3: '#0c2c66', n: ['azul', 'blava', 'blue'] },
  { k: 'purple', c1: '#e3b5ff', c2: '#9333ea', c3: '#4a1172', n: ['lila', 'lila', 'purple'] },
  { k: 'silver', c1: '#ffffff', c2: '#c9d3df', c3: '#6b7a8c', n: ['plateada', 'platejada', 'silver'] },
];
const LEVELS = [
  { id: 0, holes: 3, colors: 4, rep: false, name: () => L('Fácil', 'Fàcil', 'Easy'), stars: '⭐', info: () => L('3 bolas · 4 colores · sin repetir', '3 boles · 4 colors · sense repetir', '3 baubles · 4 colours · no repeats') },
  { id: 1, holes: 4, colors: 5, rep: false, name: () => L('Normal', 'Normal', 'Normal'), stars: '⭐⭐', info: () => L('4 bolas · 5 colores · sin repetir', '4 boles · 5 colors · sense repetir', '4 baubles · 5 colours · no repeats') },
  { id: 2, holes: 4, colors: 6, rep: true, name: () => L('Difícil', 'Difícil', 'Hard'), stars: '⭐⭐⭐', info: () => L('4 bolas · 6 colores · se pueden repetir', '4 boles · 6 colors · es poden repetir', '4 baubles · 6 colours · repeats allowed') },
];
const TRIES = 10;
const fmt = ms => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const peek = lv => { try { return +(localStorage.getItem('adv_g25_mm19_' + lv) || 0) % TOTAL; } catch { return 0; } };
const ball = (ci, cls = '') => el('span', { class: 'mm19-ball ' + cls, style: ci == null ? '' : `--c1:${COLORS[ci].c1};--c2:${COLORS[ci].c2};--c3:${COLORS[ci].c3}` });

function makeCode(lv, seed) {
  const R = rng(1900 + seed * 101 + lv.id * 7), out = [];
  while (out.length < lv.holes) { const c = Math.floor(R() * lv.colors); if (lv.rep || !out.includes(c)) out.push(c); }
  return out;
}
// pistas bola a bola (en el mismo orden que las bolas): 'ok' = color y sitio correctos (verde),
// 'near' = ese color está pero en otro sitio (blanco), '' = ese color no está
function score(code, guess) {
  const res = guess.map((g, i) => g === code[i] ? 'ok' : '');
  const left = code.filter((c, i) => guess[i] !== c);
  guess.forEach((g, i) => { if (res[i]) return; const k = left.indexOf(g); if (k >= 0) { res[i] = 'near'; left.splice(k, 1); } });
  return res;
}

export function render(body, ctx) {
  body.style.webkitUserSelect = body.style.userSelect = 'none';
  let first = ctx.prev?.extra?.mm19 || null; // la primera partida, la que cuenta
  let level = first ? first.level : 0;

  body.append(
    el('div', { class: 'c5-head' },
      el('div', { class: 'c5-ribbon mm19-ribbon' }, '🎁 ' + L('El código secreto de Papá Noel', 'El codi secret del Pare Noel', 'Santa’s secret code') + ' 🎁'),
      el('p', { class: 'c5-sub' }, L('¿Adivinarás qué bolas ha escondido?', 'Endevinaràs quines boles ha amagat?', 'Can you guess which baubles he hid?'))),
    el('details', { class: 'c5-how', open: !first },
      el('summary', {}, '📖 ' + L('Cómo se juega', 'Com es juga', 'How to play')),
      el('ol', {},
        el('li', {}, L('Papá Noel ha escondido unas bolas de Navidad en unos regalos (🎁 🎁 🎁). Tienes que adivinar qué colores son y en qué orden.', 'El Pare Noel ha amagat unes boles de Nadal en uns regals (🎁 🎁 🎁). Has d’endevinar quins colors són i en quin ordre.', 'Santa has hidden some Christmas baubles in presents (🎁 🎁 🎁). Guess the colours and their order.')),
        el('li', {}, L('Toca los colores de abajo para llenar la fila que brilla. Si te equivocas, toca la bola de la fila para quitarla.', 'Toca els colors de baix per omplir la fila que brilla. Si t’equivoques, toca la bola de la fila per treure-la.', 'Tap the colours below to fill the glowing row. To remove one, tap it in the row.')),
        el('li', {}, L('Pulsa ✔︎ y mira las pistas a la derecha:', 'Prem ✔︎ i mira les pistes a la dreta:', 'Tap ✔︎ and look at the clues on the right:'),
          el('div', { class: 'mm19-legend' }, el('span', {}, el('i', { class: 'mm19-pin green' }), ' ' + L('= color correcto y en su sitio', '= color correcte i al seu lloc', '= right colour, right place')),
            el('span', {}, el('i', { class: 'mm19-pin white' }), ' ' + L('= ese color está, pero en otro sitio', '= aquest color hi és, però en un altre lloc', '= that colour is there, but elsewhere')),
            el('span', {}, el('i', { class: 'mm19-pin' }), ' ' + L('= nada', '= res', '= nothing')))),
        el('li', {}, L('Cada pista va en el mismo orden que tus bolas: la 1.ª pista es de la 1.ª bola, la 2.ª de la 2.ª… Tienes 10 intentos.', 'Cada pista va en el mateix ordre que les teves boles: la 1a pista és de la 1a bola, la 2a de la 2a… Tens 10 intents.', 'Each clue is in the same order as your baubles: clue 1 is for bauble 1, and so on. You have 10 tries.')),
        el('li', {}, L('⏱️ Un reloj cuenta cuánto tardas en cada partida. Hay 3 niveles y 25 partidas distintas.', '⏱️ Un rellotge compta quant tardes a cada partida. Hi ha 3 nivells i 25 partides diferents.', '⏱️ A clock times each game. There are 3 levels and 25 different games.')),
        el('li', { class: 'mm19-important' }, '📲 ' + L('Importante: solo cuenta la PRIMERA partida. Al acabarla saldrá un cartel con tu resultado: envíalo por WhatsApp al grupo de la familia. Las demás partidas son para divertirte y no se envían.', 'Important: només compta la PRIMERA partida. Quan l’acabis sortirà un cartell amb el teu resultat: envia’l per WhatsApp al grup de la família. Les altres partides són per divertir-te i no s’envien.', 'Important: only the FIRST game counts. When you finish it, a card with your result will appear: send it on WhatsApp to the family group. Other games are just for fun.')))));

  const board = el('div', { class: 'mm19-board' });
  const wrap = el('div', { class: 'c5-wrap' }, board);
  body.append(wrap);

  let lv, code, rows, cur, guess, t0 = 0, tick = 0, over = false, gameNo = 0, alive = true;
  const clock = el('div', { class: 'c5-chip mm19-clock' }, '⏱️ 0:00');
  const lvChip = el('div', { class: 'c5-chip' });
  const tryChip = el('div', { class: 'c5-chip' });
  ctx.cleanup = () => { alive = false; clearInterval(tick); };

  // ---- pantalla de inicio: nivel + partida
  function intro() {
    clearInterval(tick); over = true;
    const lvBtns = LEVELS.map(x => el('button', { type: 'button', class: 'mm19-lv no-delay' + (x.id === level ? ' on' : ''), onclick: () => { level = x.id; paint(); chime(); } },
      el('b', {}, x.stars + ' ' + x.name()), el('small', {}, x.info())));
    const tag = el('div', { class: 'c5-gametag' });
    const paint = () => { lvBtns.forEach((b, i) => b.classList.toggle('on', i === level)); tag.textContent = `🎲 ${L('Partida', 'Partida', 'Game')} ${peek(level) + 1} ${L('de', 'de', 'of')} ${TOTAL}` + (first ? '' : ' · ' + L('¡la que cuenta!', 'la que compta!', 'the one that counts!')); };
    paint();
    board.replaceChildren(
      el('div', { class: 'cw-lights' }, ...Array.from({ length: 14 }, (_, i) => el('i', { style: `--i:${i}` }))),
      el('div', { class: 'mm19-intro' },
        el('div', { class: 'mm19-gifts' }, ...[0, 1, 2].map(i => el('span', { class: 'mm19-gift', style: `--d:${i * .2}s` }, '?'))),
        tag,
        el('p', {}, L('Elige el nivel:', 'Tria el nivell:', 'Choose the level:')),
        el('div', { class: 'mm19-lvs' }, ...lvBtns),
        el('button', { class: 'btn btn-big no-delay c5-start', onclick: start }, '▶️ ' + L('¡Empezar!', 'Comencem!', 'Start!')),
        first ? el('p', { class: 'c5-firstnote' }, '🏅 ' + L(`Tu partida buena: ${first.solved ? 'resuelta' : 'no resuelta'} en ${first.tries} intentos y ${fmt(first.time)}. Las de ahora son para divertirte.`, `La teva partida bona: ${first.solved ? 'resolta' : 'no resolta'} en ${first.tries} intents i ${fmt(first.time)}. Les d’ara són per divertir-te.`, `Your official game: ${first.solved ? 'solved' : 'not solved'} in ${first.tries} tries and ${fmt(first.time)}. These ones are just for fun.`)) : null,
        first ? el('button', { type: 'button', class: 'btn btn-ghost small-btn no-delay', onclick: () => shareResult(first, ctx) }, '📲 ' + L('Enviar mi primera partida', 'Enviar la meva primera partida', 'Send my first game')) : null));
  }

  // ---- tablero
  function start() {
    unlockAudio(); lv = LEVELS[level];
    gameNo = (() => { const k = 'mm19_' + lv.id; return nextGame(k); })();
    code = makeCode(lv, gameNo); cur = 0; guess = []; over = false; t0 = 0;
    lvChip.textContent = lv.stars + ' ' + lv.name(); tryChip.textContent = `🎯 1/${TRIES}`; clock.textContent = '⏱️ 0:00';
    const secret = el('div', { class: 'mm19-secret' }, ...code.map(() => el('span', { class: 'mm19-gift' }, '?')));
    rows = Array.from({ length: TRIES }, (_, r) => {
      const holes = Array.from({ length: lv.holes }, (_, h) => el('button', { type: 'button', class: 'mm19-hole no-delay', onclick: () => { if (r !== cur || over || guess[h] == null) return; guess[h] = null; paintRow(); pop(); } }));
      const pins = el('div', { class: 'mm19-pins h' + lv.holes }, ...Array.from({ length: lv.holes }, () => el('i', { class: 'mm19-pin' })));
      const check = el('button', { type: 'button', class: 'mm19-check no-delay', disabled: true, onclick: () => submit() }, '✔︎');
      return { box: el('div', { class: 'mm19-row' }, el('b', { class: 'mm19-n' }, String(r + 1)), el('div', { class: 'mm19-holes' }, ...holes), el('div', { class: 'mm19-side' }, pins, check)), holes, pins, check };
    });
    const palette = el('div', { class: 'mm19-palette' }, ...Array.from({ length: lv.colors }, (_, ci) => el('button', { type: 'button', class: 'mm19-pick no-delay', title: L(...COLORS[ci].n), onclick: () => place(ci) }, ball(ci))));
    board.replaceChildren(
      el('div', { class: 'cw-lights' }, ...Array.from({ length: 14 }, (_, i) => el('i', { style: `--i:${i}` }))),
      el('div', { class: 'c5-top' }, lvChip, clock, tryChip),
      secret,
      el('div', { class: 'mm19-rows' }, ...rows.map(x => x.box).reverse()), // la 1 abajo, como en el juego de mesa
      palette,
      el('p', { class: 'mm19-tip' }, L(`Partida ${gameNo + 1} de ${TOTAL}`, `Partida ${gameNo + 1} de ${TOTAL}`, `Game ${gameNo + 1} of ${TOTAL}`)));
    board.secret = secret;
    paintRow();
    setTimeout(() => rows[0].box.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  }
  function paintRow() {
    rows.forEach((x, r) => x.box.classList.toggle('cur', r === cur && !over));
    const x = rows[cur]; if (!x) return;
    x.holes.forEach((h, i) => { h.replaceChildren(guess[i] != null ? ball(guess[i]) : ''); h.classList.toggle('full', guess[i] != null); });
    x.check.disabled = !(guess.filter(g => g != null).length === lv.holes);
  }
  function place(ci) {
    if (over) return; unlockAudio();
    if (!t0) { t0 = Date.now(); tick = setInterval(() => { if (alive && !over) clock.textContent = '⏱️ ' + fmt(Date.now() - t0); }, 500); } // el reloj empieza con la primera bola
    const i = Array.from({ length: lv.holes }, (_, k) => k).find(k => guess[k] == null);
    if (i == null) { toast('👉 ' + L('Fila llena: pulsa ✔︎ o quita una bola', 'Fila plena: prem ✔︎ o treu una bola', 'Row full: tap ✔︎ or remove a bauble'), 1800); return; }
    guess[i] = ci; pop(); paintRow();
  }
  async function submit() {
    if (over) return; const x = rows[cur]; x.check.disabled = true;
    const g = guess.slice(0, lv.holes), s = score(code, g);
    for (let k = 0; k < s.length; k++) {
      await sleep(170); if (!s[k]) continue;
      x.pins.children[k].className = 'mm19-pin ' + (s[k] === 'ok' ? 'green' : 'white');
      x.holes[k].classList.add(s[k] === 'ok' ? 'hit' : 'near'); pop();
    }
    x.check.style.visibility = 'hidden'; x.box.classList.add('done');
    if (s.every(v => v === 'ok')) return end(true);
    if (s.every(v => !v)) oops(); else chime();
    cur++; guess = [];
    if (cur >= TRIES) return end(false);
    tryChip.textContent = `🎯 ${cur + 1}/${TRIES}`; paintRow();
    setTimeout(() => rows[cur].box.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  }
  async function end(solved) {
    over = true; clearInterval(tick); paintRow();
    const time = t0 ? Date.now() - t0 : 0; clock.textContent = '⏱️ ' + fmt(time);
    // destapar el código
    const sec = board.secret; [...sec.children].forEach((gft, i) => setTimeout(() => { gft.replaceWith(ball(code[i], 'reveal')); pop(); }, 250 * i));
    await sleep(250 * code.length + 500);
    if (solved) { fanfare(); confetti(220); } else sadTrombone();
    const res = { level: lv.id, solved, tries: Math.min(cur + 1, TRIES), time, game: gameNo + 1, code: code.slice(), at: Date.now() };
    const counts = !first;
    if (counts) {
      first = res;
      ctx.submit({ answer: '🎁 ' + L(`Código ${lv.name().toLowerCase()}: ${solved ? 'resuelto' : 'no resuelto'} en ${res.tries} intentos · ${fmt(time)}`, `Codi ${lv.name().toLowerCase()}: ${solved ? 'resolt' : 'no resolt'} en ${res.tries} intents · ${fmt(time)}`, `${lv.name()} code: ${solved ? 'solved' : 'not solved'} in ${res.tries} tries · ${fmt(time)}`), status: 'correct', extra: { mm19: res } });
    }
    await sleep(900);
    const stat = (ic, k, v) => el('div', { class: 'c5-stat' }, el('span', { class: 'c5-st-ic' }, ic), el('b', {}, String(v)), el('small', {}, k));
    const box = el('div', { class: 'c5-result' },
      el('div', { class: 'c5-res-flakes' }, ...Array.from({ length: 22 }, () => el('i', { style: `left:${Math.random() * 100}%;--d:${4 + Math.random() * 4}s;--dl:${-Math.random() * 6}s;--s:${10 + Math.random() * 12}px` }, '❄'))),
      el('img', { class: 'c5-res-star', src: solved ? 'estrella8.webp' : 'ilu-gorro.webp', alt: '' }),
      el('h2', {}, solved ? L('¡Código descubierto!', 'Codi descobert!', 'Code cracked!') : L('¡Casi, casi!', 'Gairebé!', 'So close!')),
      el('p', { class: 'c5-res-msg' }, solved ? praise(res) : L('Papá Noel ha ganado esta vez… ¡pero ha sido muy reñido! 🎅', 'El Pare Noel ha guanyat aquesta vegada… però ha anat de poc! 🎅', 'Santa won this time… but it was close! 🎅')),
      el('div', { class: 'mm19-code' }, el('small', {}, L('El código era:', 'El codi era:', 'The code was:')), ...code.map(c => ball(c))),
      el('div', { class: 'c5-stats' },
        stat('🎯', L('intentos', 'intents', 'tries'), `${res.tries}/${TRIES}`), stat('⏱️', L('tiempo', 'temps', 'time'), fmt(time)), stat('⭐', L('nivel', 'nivell', 'level'), lv.name())),
      el('p', { class: 'c5-res-game' }, `🎲 ${L('Partida', 'Partida', 'Game')} ${res.game} ${L('de', 'de', 'of')} ${TOTAL}`),
      el('p', { class: 'c5-res-note ' + (counts ? 'ok' : '') }, counts
        ? '📲 ' + L('¡Esta es tu partida buena! Envíala por WhatsApp al grupo de la familia.', 'Aquesta és la teva partida bona! Envia-la per WhatsApp al grup de la família.', 'This is your official game! Send it on WhatsApp to the family group.')
        : '🎈 ' + L('Esta era para divertirte: no hace falta enviarla.', 'Aquesta era per divertir-te: no cal enviar-la.', 'This one was for fun: no need to send it.')));
    const btns = counts ? [{ label: '📲 ' + L('Enviar por WhatsApp', 'Enviar per WhatsApp', 'Send on WhatsApp'), value: 'share', cls: 'no-delay c5-wa' }] : [];
    btns.push({ label: '🔄 ' + L('Jugar otra', 'Jugar-ne una altra', 'Play another'), value: 'again', cls: 'btn-ghost no-delay' }, { label: '🎄 ' + L('Continuar', 'Continuar', 'Continue'), value: 'out', cls: 'btn-ghost no-delay' });
    const r = await popup(box, { cls: 'small c5-respop', buttons: btns });
    if (r === 'share') await shareResult(first, ctx);
    if (r === 'out') { ctx.cleanup(); ctx.finish(); return; }
    if (alive) intro();
  }
  intro();
}

function praise(res) {
  if (res.tries <= 3) return L('¡Increíble! ¿Has espiado a Papá Noel? 🕵️‍♀️✨', 'Increïble! Has espiat el Pare Noel? 🕵️‍♀️✨', 'Amazing! Did you spy on Santa? 🕵️‍♀️✨');
  if (res.tries <= 5) return L('¡Fantástico! Tienes cabeza de duende detective. 🎄', 'Fantàstic! Tens cap de follet detectiu. 🎄', 'Fantastic! You think like a detective elf. 🎄');
  if (res.tries <= 8) return L('¡Muy bien! Papá Noel está orgulloso. ⭐', 'Molt bé! El Pare Noel n’està orgullós. ⭐', 'Well done! Santa is proud. ⭐');
  return L('¡Por los pelos! Pero lo has conseguido. ❤️', 'Pels pèls! Però ho has aconseguit. ❤️', 'Just in time! But you did it. ❤️');
}

// ---- imagen para WhatsApp
const loadImg = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
async function resultImage(res, name) {
  const lv = LEVELS[res.level] || LEVELS[0];
  const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  try { await Promise.all(['700 80px "Mountains of Christmas"', '800 60px Montserrat', '600 40px Montserrat'].map(f => document.fonts.load(f))); } catch {}
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#7a1020'); bg.addColorStop(.55, '#b3122e'); bg.addColorStop(1, '#14532d');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const rnd = rng(19); g.fillStyle = '#fff';
  for (let i = 0; i < 160; i++) { g.globalAlpha = .25 + rnd() * .6; g.beginPath(); g.arc(rnd() * W, rnd() * H, 2 + rnd() * 6, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  g.strokeStyle = '#f2c14e'; g.lineWidth = 14; g.strokeRect(36, 36, W - 72, H - 72);
  g.strokeStyle = '#fff6d6'; g.lineWidth = 3; g.strokeRect(58, 58, W - 116, H - 116);
  for (let i = 0; i < 15; i++) { const x = 90 + i * 64, y = 92 + Math.sin(i * .9) * 10; g.fillStyle = ['#ffd24a', '#4ade80', '#ff4d6d', '#7dd3fc'][i % 4]; g.shadowColor = g.fillStyle; g.shadowBlur = 18; g.beginPath(); g.ellipse(x, y, 11, 15, 0, 0, 7); g.fill(); }
  g.shadowBlur = 0; g.textAlign = 'center'; g.fillStyle = '#fff6d6';
  g.font = '700 84px "Mountains of Christmas", cursive'; g.fillText(L('El código secreto', 'El codi secret', 'The secret code'), W / 2, 215);
  g.font = '700 64px "Mountains of Christmas", cursive'; g.fillText(L('de Papá Noel', 'del Pare Noel', 'of Santa'), W / 2, 290);
  const santa = await loadImg('santa11.webp');
  if (santa) { g.save(); g.beginPath(); g.arc(W / 2, 420, 90, 0, 7); g.closePath(); g.fillStyle = '#fff4dc'; g.fill(); g.clip(); g.drawImage(santa, W / 2 - 100, 320, 200, 200); g.restore(); g.strokeStyle = '#f2c14e'; g.lineWidth = 8; g.beginPath(); g.arc(W / 2, 420, 90, 0, 7); g.stroke(); }
  // bolas del código
  const n = res.code.length, gap = 150, x0 = W / 2 - (n - 1) * gap / 2;
  res.code.forEach((ci, i) => {
    const c = COLORS[ci], x = x0 + i * gap, y = 600, r = 56;
    const gr = g.createRadialGradient(x - 18, y - 20, 6, x, y, r); gr.addColorStop(0, c.c1); gr.addColorStop(.6, c.c2); gr.addColorStop(1, c.c3);
    g.fillStyle = '#d9b45a'; g.fillRect(x - 14, y - r - 14, 28, 18);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.lineWidth = 4; g.strokeStyle = '#00000044'; g.stroke();
    g.fillStyle = '#ffffff99'; g.beginPath(); g.ellipse(x - 18, y - 22, 14, 9, -.6, 0, 7); g.fill();
  });
  const rrect = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  g.fillStyle = '#fffaf0'; g.strokeStyle = '#f2c14e'; g.lineWidth = 8; rrect(110, 720, W - 220, 500, 46); g.fill(); g.stroke();
  g.fillStyle = '#7a1020'; g.font = '700 80px "Mountains of Christmas", cursive'; g.fillText(name || L('¡Lo he conseguido!', 'Ho he aconseguit!', 'I did it!'), W / 2, 815);
  g.fillStyle = '#14532d'; g.font = '700 42px Montserrat, sans-serif';
  g.fillText(res.solved ? L('¡ha descubierto el código!', 'ha descobert el codi!', 'cracked the code!') : L('ha estado a punto de descubrirlo', 'ha estat a punt de descobrir-lo', 'almost cracked it'), W / 2, 880);
  const cols = [[L('INTENTOS', 'INTENTS', 'TRIES'), `${res.tries}/${TRIES}`], [L('TIEMPO', 'TEMPS', 'TIME'), fmt(res.time)], [L('NIVEL', 'NIVELL', 'LEVEL'), lv.name()]];
  cols.forEach(([k, v], i) => { const x = 270 + i * 270; g.fillStyle = '#b8862b'; g.font = '700 30px Montserrat, sans-serif'; g.fillText(k, x, 990); g.fillStyle = '#b3122e'; g.font = '800 62px Montserrat, sans-serif'; g.fillText(v, x, 1065); });
  g.fillStyle = '#7a5a2a'; g.font = '600 32px Montserrat, sans-serif';
  g.fillText(L(`Partida ${res.game} de ${TOTAL} · primera partida`, `Partida ${res.game} de ${TOTAL} · primera partida`, `Game ${res.game} of ${TOTAL} · first game`), W / 2, 1150);
  g.fillStyle = '#fff6d6'; g.font = '700 44px "Mountains of Christmas", cursive';
  g.fillText(L('Calendario de Adviento · Día 19', 'Calendari d’Advent · Dia 19', 'Advent Calendar · Day 19'), W / 2, 1272);
  return await new Promise(r => cv.toBlob(r, 'image/png'));
}
async function shareResult(res, ctx) {
  if (!res) return;
  const lv = LEVELS[res.level] || LEVELS[0], name = (ctx.profile?.name || '').trim();
  const text = (res.solved
    ? L(`🎁 ¡He descubierto el código secreto de Papá Noel! Nivel ${lv.name()} · ${res.tries} intentos · ${fmt(res.time)} (partida ${res.game} de ${TOTAL}).`, `🎁 He descobert el codi secret del Pare Noel! Nivell ${lv.name()} · ${res.tries} intents · ${fmt(res.time)} (partida ${res.game} de ${TOTAL}).`, `🎁 I cracked Santa’s secret code! ${lv.name()} level · ${res.tries} tries · ${fmt(res.time)} (game ${res.game} of ${TOTAL}).`)
    : L(`🎁 El código secreto de Papá Noel: ¡casi lo consigo! Nivel ${lv.name()} · ${TRIES} intentos · ${fmt(res.time)} (partida ${res.game} de ${TOTAL}).`, `🎁 El codi secret del Pare Noel: gairebé ho aconsegueixo! Nivell ${lv.name()} · ${TRIES} intents · ${fmt(res.time)} (partida ${res.game} de ${TOTAL}).`, `🎁 Santa’s secret code: so close! ${lv.name()} level · ${TRIES} tries · ${fmt(res.time)} (game ${res.game} of ${TOTAL}).`))
    + (name ? `\n— ${name}` : '');
  toast('✨ ' + L('Preparando la foto…', 'Preparant la foto…', 'Preparing the picture…'), 1500);
  const blob = await resultImage(res, name).catch(() => null);
  const file = blob ? new File([blob], 'codigo-secreto.png', { type: 'image/png' }) : null;
  const url = blob ? URL.createObjectURL(blob) : null;
  const canFiles = !!(file && navigator.canShare && navigator.canShare({ files: [file] }));
  const send = el('button', { type: 'button', class: 'btn btn-big no-delay c5-wa', onclick: async () => {
    try { if (canFiles) { await navigator.share({ files: [file], text }); return; } } catch (e) { if (e?.name === 'AbortError') return; }
    if (url) { const a = el('a', { href: url, download: 'codigo-secreto.png' }); document.body.append(a); a.click(); a.remove(); }
    location.href = 'whatsapp://send?text=' + encodeURIComponent(text);
  } }, '📲 ' + L('Enviar por WhatsApp', 'Enviar per WhatsApp', 'Send on WhatsApp'));
  await popup(el('div', { class: 'g23-sharebox' },
    el('h2', {}, L('Tu foto para el grupo', 'La teva foto per al grup', 'Your picture for the group')),
    url ? el('img', { class: 'g23-shareimg', src: url, alt: '' }) : el('p', {}, '⚠️'),
    el('p', { class: 'muted' }, canFiles ? L('Pulsa el botón y elige WhatsApp y el grupo de la familia.', 'Prem el botó i tria WhatsApp i el grup de la família.', 'Tap the button and choose WhatsApp and the family group.')
      : L('Se guardará la foto y se abrirá WhatsApp.', 'Es guardarà la foto i s’obrirà WhatsApp.', 'The picture will be saved and WhatsApp will open.')), send),
    { cls: 'small g23-sharepop', buttons: [{ label: L('Cerrar', 'Tancar', 'Close'), value: false, cls: 'btn-ghost' }] });
  if (url) setTimeout(() => URL.revokeObjectURL(url), 60000);
}
