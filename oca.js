// Día 10 · «L’oca de Nadal» (V25.3): el juego de la oca de toda la vida, con dibujos de Navidad y un tablero luminoso.
// · Arriba, el dado dentro de un hueco: un toque y empieza a girar; otro toque y se para (sale el número).
// · A un lado del dado, el cronómetro; al otro, el botón de las instrucciones.
// · Se juega solo o contra el Pare Noel (la máquina).
// · Casillas especiales de siempre: ocas, puentes (trineos), posada (casita de galleta), dados (regalos), pozo (bola de nieve),
//   laberinto (bosque), cárcel (saco de Papá Noel), muerte (muñeco de nieve que se funde) y el jardín (árbol de Navidad, 63).
// · Puntos: acabar la partida suma en el ⭐ Marcador de Navidad (ctx.won). Ganar al Pare Noel: los gnomos ganan su premio (1.ª vez).
//   Perder contra el Pare Noel: −1 en el Marcador de Navidad y −1 a los gnomos (como mucho una vez al día).
import { getLang } from './i18n.js';
import { el, sleep, confetti } from './fx.js';
import { pop, chime, clickSound, fanfare, sadTrombone, snapSound, unlockAudio, speak, wrong } from './sound.js';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const FIG = { galleta: 'galleta.png', arbol: 'arbol.png', gnomo: 'gnomo.png' };
const GEESE = [5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54, 59];
const SPECIAL = {
  6: { k: 'bridge', img: 'trineo11.webp', to: 12 }, 12: { k: 'bridge', img: 'trineo11.webp', to: 6 },
  19: { k: 'inn', img: 'ilu-10.webp', skip: 1 },
  26: { k: 'dice', img: 'ilu-gr.webp', to: 53 }, 53: { k: 'dice', img: 'ilu-gr.webp', to: 26 },
  31: { k: 'well', img: 'ilu-7.webp', skip: 2 },
  42: { k: 'maze', img: 'ilu-abeto.webp', to: 30 },
  52: { k: 'jail', img: 'saco14.webp', skip: 2 },
  58: { k: 'death', img: 'mem-12.webp', to: 0 },
  63: { k: 'garden', img: 'mem-04.webp' },
};
const DECOR = ['ilu-2.webp', 'ilu-4.webp', 'ilu-9.webp', 'ilu-11.webp', 'ilu-14.webp', 'ilu-17.webp', 'ilu-18.webp', 'ilu-20.webp', 'ilu-23.webp', 'mem-01.webp', 'mem-02.webp', 'mem-05.webp', 'mem-06.webp', 'mem-07.webp', 'mem-08.webp', 'mem-09.webp', 'mem-11.webp', 'mem-13.webp', 'mem-14.webp', 'ilu-6.webp', 'ilu-19.webp', 'ilu-21.webp'];
const RHYME = {
  goose: () => L('¡De oca a oca y tiro porque me toca!', 'D’oca a oca i tiro perquè em toca!', 'From goose to goose, and I roll again!'),
  bridge: () => L('¡De trineo a trineo y tiro porque me lleva la corriente!', 'De trineu a trineu i tiro perquè em porta el corrent!', 'From sleigh to sleigh, and I roll again!'),
  dice: () => L('¡De regalo a regalo y tiro porque me ha tocado!', 'De regal a regal i tiro perquè m’ha tocat!', 'From present to present, and I roll again!'),
  inn: () => L('Casita de galleta: ¡te quedas a merendar! Pierdes 1 turno.', 'Caseta de galeta: et quedes a berenar! Perds 1 torn.', 'Gingerbread house: stay for a snack! Miss 1 turn.'),
  well: () => L('¡Atrapado en la bola de nieve! Pierdes 2 turnos.', 'Atrapat dins la bola de neu! Perds 2 torns.', 'Stuck in the snow globe! Miss 2 turns.'),
  maze: () => L('¡Te pierdes en el bosque nevado! Vuelves a la 30.', 'T’has perdut al bosc nevat! Tornes a la 30.', 'Lost in the snowy forest! Back to 30.'),
  jail: () => L('¡Dentro del saco de Papá Noel! Pierdes 2 turnos.', 'Dins el sac del Pare Noel! Perds 2 torns.', 'Inside Santa’s sack! Miss 2 turns.'),
  death: () => L('¡El muñeco de nieve se ha fundido! Vuelves a empezar.', 'El ninot de neu s’ha fos! Tornes a començar.', 'The snowman melted! Back to the start.'),
  bounce: () => L('¡Te pasas! Rebotas hacia atrás.', 'Te’n passes! Rebotes cap enrere.', 'Too far! You bounce back.'),
};

// ---- la oca de Navidad, dibujada (blanca, con gorro de Papá Noel y bufanda)
const GOOSE_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="gg" cx=".4" cy=".35"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#e6ecf2"/></radialGradient></defs>
<ellipse cx="50" cy="92" rx="26" ry="5" fill="#0002"/>
<path d="M30 86 q-14-4-12-22 q4-18 26-20 q8-1 10 6 q-2 10 6 16 q12 8 14 18 q1 8-10 8 z" fill="url(#gg)" stroke="#9fb3c6" stroke-width="1.5"/>
<path d="M30 62 q12-6 22 6" fill="none" stroke="#c9d6e2" stroke-width="2"/>
<path d="M54 44 q-4-14 2-24 q6-8 14-4 q6 4 2 12 q-4 6-6 16" fill="url(#gg)" stroke="#9fb3c6" stroke-width="1.5"/>
<path d="M71 25 l13 3 l-12 5 z" fill="#f59e0b" stroke="#c46a00" stroke-width="1"/>
<circle cx="66" cy="23" r="2.4" fill="#2b1a12"/><circle cx="66.8" cy="22.2" r=".8" fill="#fff"/>
<path d="M52 40 q8 6 18 0 l1 5 q-10 6-20 0 z" fill="#c8263f"/><path d="M62 44 l-3 12 l5 1 l1-12 z" fill="#a3122c"/>
<path d="M57 18 q4-14 18-10 q8 3 6 10 q-12-4-24 0 z" fill="#c8263f"/><path d="M80 12 q8 2 6 10" fill="none" stroke="#c8263f" stroke-width="5" stroke-linecap="round"/>
<circle cx="86" cy="23" r="4" fill="#fff"/><path d="M55 19 q12-5 26-1" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
<path d="M40 88 l-3 6 h8 M56 88 l-2 6 h8" stroke="#f59e0b" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;

// ---- tablero 8×8 en espiral (de fuera hacia dentro): casillas 1–62 y el jardín (63) ocupa las dos últimas
function spiral(n = 8) {
  const out = []; let top = 0, left = 0, bottom = n - 1, right = n - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) out.push([bottom, c]);           // fila de abajo, de izquierda a derecha
    for (let r = bottom - 1; r >= top; r--) out.push([r, right]);         // columna derecha, hacia arriba
    if (top < bottom) for (let c = right - 1; c >= left; c--) out.push([top, c]); // fila de arriba, hacia la izquierda
    if (left < right) for (let r = top + 1; r <= bottom - 1; r++) out.push([r, left]); // columna izquierda, hacia abajo
    top++; bottom--; left++; right--;
  }
  return out; // 64 posiciones
}
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const BEST = 'adv_oca_best';

export function render(body, ctx) {
  const fig = ctx.settings?.figure || 'galleta';
  let best = null; try { best = JSON.parse(localStorage.getItem(BEST + '_' + (ctx.user?.uid || '')) || 'null'); } catch {}
  body.append(el('div', { class: 'oca-intro' },
    el('h2', { class: 'q-title cw-title' }, '🪿 ' + L('La oca de Navidad', 'L’oca de Nadal', 'The Christmas goose game') + ' 🎄'),
    el('div', { class: 'oca-intro-pic', html: GOOSE_SVG }),
    el('p', { class: 'game-help' }, L('El juego de la oca de toda la vida… ¡en Navidad! Tira el dado, salta de oca en oca y llega la primera al árbol de Navidad (la casilla 63).',
      'El joc de l’oca de tota la vida… per Nadal! Tira el dau, salta d’oca en oca i arriba primer a l’arbre de Nadal (la casella 63).',
      'The classic goose game… at Christmas! Roll the dice, jump from goose to goose and reach the Christmas tree first (square 63).')),
    el('button', { type: 'button', class: 'oca-cta no-delay', onclick: () => { unlockAudio(); openOca(ctx); } }, '🎲 ' + L('¡A jugar a la oca!', 'A jugar a l’oca!', 'Let’s play!')),
    best ? el('p', { class: 'muted oca-best' }, '⏱ ' + L('Tu mejor tiempo', 'El teu millor temps', 'Your best time') + ': ' + fmt(best)) : null));
}

async function openOca(ctx) {
  if (document.querySelector('.oca-wrap')) return;
  const uid = ctx.user?.uid || '';
  const fig = ctx.settings?.figure || 'galleta';
  let alive = true, timerIv = 0;
  const close = () => { alive = false; clearInterval(timerIv); clearInterval(spinIv); wrap.classList.add('out'); document.documentElement.classList.remove('gm-lock'); setTimeout(() => wrap.remove(), 350); };

  // ---- cabecera: cronómetro · dado en su hueco · instrucciones
  const timeEl = el('b', {}, '0:00');
  const die = el('div', { class: 'oca-die' });
  const hole = el('button', { type: 'button', class: 'oca-hole no-delay', 'aria-label': 'dado' }, die);
  const dieHint = el('div', { class: 'oca-diehint' });
  const helpBtn = el('button', { type: 'button', class: 'oca-side no-delay', onclick: () => showHelp() }, el('span', {}, '📜'), el('small', {}, L('Instrucciones', 'Instruccions', 'Rules')));
  const top = el('div', { class: 'oca-top' },
    el('div', { class: 'oca-side oca-timer' }, el('span', {}, '⏱'), timeEl),
    el('div', { class: 'oca-diebox' }, hole, dieHint),
    helpBtn);
  const turnEl = el('div', { class: 'oca-turn' });
  const board = el('div', { class: 'oca-board' });
  const msg = el('div', { class: 'oca-msg' });
  const wrap = el('div', { class: 'oca-wrap' },
    el('div', { class: 'oca-snow' }),
    el('div', { class: 'oca-head' }, el('button', { type: 'button', class: 'cc8-x no-delay', onclick: close }, '✕'), el('div', { class: 'oca-title' }, L('La oca de Navidad', 'L’oca de Nadal', 'The Christmas goose'))),
    top, turnEl, el('div', { class: 'oca-stage' }, board, msg));
  document.body.append(wrap);
  document.documentElement.classList.add('gm-lock');

  // ---- dibujar el tablero
  const pos = spiral(8);
  const cells = {};
  const decorFor = n => DECOR[(n * 7) % DECOR.length];
  for (let n = 1; n <= 62; n++) {
    const [r, c] = pos[n - 1], sp = SPECIAL[n], goose = GEESE.includes(n);
    const cell = el('div', { class: 'oca-cell' + (goose ? ' goose' : '') + (sp ? ' sp sp-' + sp.k : ''), style: `grid-row:${r + 1};grid-column:${c + 1}` },
      el('span', { class: 'oca-n' }, n),
      goose ? el('div', { class: 'oca-pic', html: GOOSE_SVG }) : el('img', { class: 'oca-pic' + (sp ? '' : ' deco'), src: sp ? sp.img : decorFor(n), alt: '' }));
    cells[n] = cell; board.append(cell);
  }
  { // el jardín (63): las dos casillas del centro
    const a = pos[62], b = pos[63];
    const r1 = Math.min(a[0], b[0]) + 1, r2 = Math.max(a[0], b[0]) + 2, c1 = Math.min(a[1], b[1]) + 1, c2 = Math.max(a[1], b[1]) + 2;
    const g = el('div', { class: 'oca-cell sp sp-garden', style: `grid-row:${r1}/${r2};grid-column:${c1}/${c2}` },
      el('span', { class: 'oca-n' }, 63), el('img', { class: 'oca-pic', src: SPECIAL[63].img, alt: '' }), el('small', { class: 'oca-glabel' }, '🏆'));
    cells[63] = g; board.append(g);
  }

  // ---- fichas
  const mkTok = (src, cls) => el('div', { class: 'oca-tok ' + cls }, el('img', { src, alt: '' }));
  let players = [], cur = 0, mode = null, started = false, t0 = 0, rolling = false, spinIv = 0, waitingRoll = null, over = false;
  const placeTok = p => {
    const target = p.pos > 0 ? cells[p.pos] : cells[1];
    const br = board.getBoundingClientRect(), cr = target.getBoundingClientRect();
    const off = players.length > 1 ? (p.i === 0 ? -0.18 : 0.18) : 0;
    const x = cr.left - br.left + cr.width * (0.5 + off), y = cr.top - br.top + cr.height * (p.pos > 0 ? 0.55 : 1.05);
    p.tok.style.transform = `translate(${x}px, ${y}px) translate(-50%, -60%)`;
  };
  const layout = () => {
    const w = Math.min(innerWidth * .96, innerHeight * .62, 640);
    board.style.width = board.style.height = w + 'px';
    players.forEach(placeTok);
  };
  addEventListener('resize', layout);

  // ---- dado: gira hasta que lo paras
  const PIPS = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
  const face = n => { die.replaceChildren(...Array.from({ length: 9 }, (_, i) => el('i', { class: PIPS[n].includes(i + 1) ? 'on' : '' }))); die.dataset.n = n; };
  face(1);
  let spinning = false;
  function startSpin() {
    spinning = true; hole.classList.add('spin'); let last = 1;
    spinIv = setInterval(() => { let n; do { n = 1 + Math.floor(Math.random() * 6); } while (n === last); last = n; face(n); clickSound(); }, 85);
  }
  function stopSpin() { clearInterval(spinIv); spinning = false; hole.classList.remove('spin'); const n = 1 + Math.floor(Math.random() * 6); face(n); hole.classList.add('land'); setTimeout(() => hole.classList.remove('land'), 500); pop(); return n; }
  // el jugador: primer toque = gira; segundo toque = para
  hole.onclick = () => {
    unlockAudio();
    if (!waitingRoll || over) return;
    if (!spinning) { startSpin(); dieHint.textContent = L('¡Toca para parar!', 'Toca per parar!', 'Tap to stop!'); return; }
    const n = stopSpin(); dieHint.textContent = ''; const r = waitingRoll; waitingRoll = null; r(n);
  };
  const humanRoll = () => new Promise(res => { waitingRoll = res; hole.classList.add('ready'); dieHint.textContent = L('¡Toca el dado!', 'Toca el dau!', 'Tap the dice!'); }).then(n => { hole.classList.remove('ready'); return n; });
  const cpuRoll = async () => { await sleep(700); startSpin(); await sleep(1200 + Math.random() * 600); return stopSpin(); };

  // ---- mensajes
  let msgT = 0;
  const say = (txt, kind = '', talk = false) => {
    msg.replaceChildren(el('span', {}, txt)); msg.className = 'oca-msg on ' + kind; clearTimeout(msgT);
    msgT = setTimeout(() => msg.classList.remove('on'), 2600);
    if (talk) { try { speak(txt.replace(/[!¡]/g, ''), getLang()); } catch {} }
  };
  const paintTurn = () => {
    const p = players[cur];
    turnEl.replaceChildren(...players.map(q => el('div', { class: 'oca-pl' + (q === p ? ' now' : '') },
      el('img', { src: q.img, alt: '' }), el('b', {}, q.name), el('small', {}, q.pos ? `${L('Casilla', 'Casella', 'Square')} ${q.pos}` : L('Salida', 'Sortida', 'Start')),
      q.skip ? el('em', {}, `⏸ ${q.skip}`) : null)));
  };

  // ---- mover paso a paso
  async function walk(p, to) {
    const dir = to > p.pos ? 1 : -1;
    while (p.pos !== to && alive) { p.pos += dir; placeTok(p); clickSound(); await sleep(170); }
  }
  async function jump(p, to) { p.tok.classList.add('fly'); p.pos = to; placeTok(p); snapSound(); await sleep(650); p.tok.classList.remove('fly'); }

  async function turn(p) {
    paintTurn();
    if (p.skip > 0) { p.skip--; say(`${p.name}: ⏸ ${L('pierde este turno', 'perd aquest torn', 'misses this turn')}`); await sleep(1400); return false; }
    const n = p.cpu ? await cpuRoll() : await humanRoll();
    if (!alive) return false;
    if (!started) { started = true; t0 = Date.now(); timerIv = setInterval(() => { timeEl.textContent = fmt((Date.now() - t0) / 1000); }, 500); }
    let target = p.pos + n;
    if (target > 63) { await walk(p, 63); say(RHYME.bounce(), 'warn'); await sleep(500); target = 63 - (target - 63); await walk(p, target); }
    else await walk(p, target);
    return await land(p);
  }
  // devuelve true si vuelve a tirar
  async function land(p) {
    paintTurn();
    if (p.pos === 63) return 'win';
    if (GEESE.includes(p.pos)) {
      const next = GEESE.find(g => g > p.pos) || 63;
      say(RHYME.goose(), 'goose', !p.cpu); chime(); cells[p.pos].classList.add('flash'); setTimeout(() => cells[p.pos]?.classList.remove('flash'), 1200);
      await sleep(900); await jump(p, next); paintTurn();
      return p.pos === 63 ? 'win' : 'again';
    }
    const sp = SPECIAL[p.pos]; if (!sp) return false;
    cells[p.pos].classList.add('flash'); setTimeout(() => cells[p.pos]?.classList.remove('flash'), 1400);
    if (sp.k === 'bridge' || sp.k === 'dice') { say(RHYME[sp.k](), 'goose', !p.cpu); chime(); await sleep(900); await jump(p, sp.to); paintTurn(); return 'again'; }
    if (sp.k === 'inn' || sp.k === 'well' || sp.k === 'jail') { p.skip = sp.skip; say(RHYME[sp.k](), 'warn'); wrong(); await sleep(1300); paintTurn(); return false; }
    if (sp.k === 'maze') { say(RHYME.maze(), 'warn'); wrong(); await sleep(1100); await jump(p, sp.to); paintTurn(); return false; }
    if (sp.k === 'death') { say(RHYME.death(), 'bad'); sadTrombone(); await sleep(1300); await jump(p, 0); paintTurn(); return false; }
    return false;
  }

  async function play() {
    paintTurn(); layout();
    while (alive && !over) {
      const p = players[cur];
      const r = await turn(p);
      if (!alive) return;
      if (r === 'win') return finish(p);
      if (r === 'again') { say((p.cpu ? '🎅 ' : '🎲 ') + L('¡Vuelve a tirar!', 'Torna a tirar!', 'Roll again!'), 'goose'); await sleep(900); continue; }
      cur = (cur + 1) % players.length;
      await sleep(players.length > 1 ? 500 : 150);
    }
  }

  // ---- final
  async function finish(winner) {
    over = true; clearInterval(timerIv);
    const secs = Math.round((Date.now() - t0) / 1000);
    const meWon = !winner.cpu;
    const vsCpu = players.length > 1;
    cells[63].classList.add('win');
    // la casilla del calendario cuenta como hecha (la primera vez)
    if (!ctx.prev) { try { ctx.submit({ answer: `🪿 ${meWon ? '🏆' : '🎅'} ${fmt(secs)}`, status: 'correct' }); } catch {} }
    const lines = [];
    let G = null;
    if (meWon) {
      fanfare(); confetti(260);
      try { ctx.won?.(); } catch {} // ⭐ Marcador de Navidad (+2 la 1.ª vez, +1 las siguientes)
      let best = null; try { best = JSON.parse(localStorage.getItem(BEST + '_' + uid) || 'null'); } catch {}
      if (!best || secs < best) { try { localStorage.setItem(BEST + '_' + uid, JSON.stringify(secs)); } catch {} if (best) lines.push('🏅 ' + L('¡Nuevo récord de tiempo!', 'Nou rècord de temps!', 'New time record!')); }
      if (vsCpu) { // gnomos: premio la primera vez que ganan al Pare Noel
        try { const gm = await import('./gnomes.js'); const bs = await gm.gameBonusState('oca10');
          if (bs) { if (!bs.doc) await gm.gameBonusStart(bs); await gm.gameBonusLevel(bs, 1); if (gm.gameBonusOwed(bs) > (bs.doc?.pts || 0)) G = { gm, bs }; } } catch (e) { console.warn(e); }
      }
    } else {
      sadTrombone();
      // perder contra el Pare Noel: −1 (como mucho una vez al día)
      try { const pm = await import('./points.js'); if (await pm.penaltyGame('d10')) lines.push('⭐ ' + L('Marcador de Navidad: −1', 'Marcador de Nadal: −1', 'Christmas scoreboard: −1')); } catch (e) { console.warn(e); }
      try { const gm = await import('./gnomes.js'); const bs = await gm.gameBonusState('oca10'); if (bs && await gm.gamePenalty(bs)) lines.push('🍄 ' + L('Juego de los gnomos: −1', 'Joc dels gnoms: −1', 'Gnome game: −1')); } catch (e) { console.warn(e); }
    }
    if (!alive) return;
    const again = el('button', { type: 'button', class: 'btn btn-big no-delay' }, '🔄 ' + L('Jugar otra vez', 'Tornar a jugar', 'Play again'));
    const out = el('button', { type: 'button', class: 'btn btn-ghost btn-big no-delay', onclick: close }, '🎄 ' + L('Salir', 'Sortir', 'Exit'));
    const card = el('div', { class: 'cc8-endcard' },
      el('div', { class: 'cc8-bigstar' + (meWon ? '' : ' sad') }, meWon ? '🏆' : '🎅'),
      el('h2', {}, meWon ? (vsCpu ? L('¡Has ganado al Pare Noel!', 'Has guanyat el Pare Noel!', 'You beat Santa!') : L('¡Has llegado al árbol de Navidad!', 'Has arribat a l’arbre de Nadal!', 'You reached the Christmas tree!'))
        : L('¡El Pare Noel ha llegado primero!', 'El Pare Noel ha arribat primer!', 'Santa got there first!')),
      el('p', { class: 'cc8-endpts' }, '⏱ ', el('b', {}, fmt(secs))),
      ...lines.map(l => el('p', { class: 'cc8-rec' }, l)));
    if (G) {
      const claim = el('button', { type: 'button', class: 'cc8-gn ready no-delay' }, el('img', { src: 'gnomo.png', alt: '' }),
        el('span', {}, el('b', {}, `🍄 ${L('¡Pulsa y cobra', 'Prem i cobra', 'Tap to get')} +${G.gm.gameBonusOwed(G.bs) - (G.bs.doc?.pts || 0)}!`), el('small', {}, L('para tu juego de los gnomos', 'per al teu joc dels gnoms', 'for your gnome game'))));
      claim.onclick = async () => { claim.disabled = true; try { const add = await G.gm.gameBonusClaim(G.bs); if (add) { fanfare(); confetti(160); } } catch (e) { console.warn(e); claim.disabled = false; return; }
        claim.replaceWith(el('p', { class: 'cc8-rec' }, '🍄 ' + L('¡Puntos cobrados!', 'Punts cobrats!', 'Points collected!') + ' ✅')); };
      card.append(claim);
    }
    card.append(el('div', { class: 'cc8-endbtns' }, again, out));
    const box = el('div', { class: 'cc8-end' }, card);
    again.onclick = () => { box.remove(); chooseMode(); };
    wrap.append(box);
  }

  // ---- instrucciones (dentro del juego)
  function showHelp() {
    const R = (img, t, d, svg) => el('div', { class: 'oca-rule' }, svg ? el('div', { class: 'oca-rpic', html: GOOSE_SVG }) : el('img', { class: 'oca-rpic', src: img, alt: '' }), el('div', {}, el('b', {}, t), el('small', {}, d)));
    const box = el('div', { class: 'cc8-end oca-helpbox' }, el('div', { class: 'cc8-endcard oca-help' },
      el('h2', {}, '📜 ' + L('Cómo se juega', 'Com es juga', 'How to play')),
      el('p', {}, L('Toca el dado para que gire y vuelve a tocarlo para pararlo. Tu ficha avanza esas casillas. ¡Gana quien llega antes al árbol de Navidad (63)! Hay que llegar justo: si te pasas, rebotas hacia atrás.',
        'Toca el dau perquè giri i torna’l a tocar per parar-lo. La teva fitxa avança aquestes caselles. Guanya qui arriba abans a l’arbre de Nadal (63)! Cal arribar-hi just: si te’n passes, rebotes enrere.',
        'Tap the dice to spin it and tap again to stop it. Your token moves that many squares. Whoever reaches the Christmas tree (63) first wins! You must land exactly: if you go past, you bounce back.')),
      R('', L('Oca', 'Oca', 'Goose'), L('Saltas a la siguiente oca y vuelves a tirar.', 'Saltes a la següent oca i tornes a tirar.', 'Jump to the next goose and roll again.'), true),
      R('trineo11.webp', L('Trineo (6 y 12)', 'Trineu (6 i 12)', 'Sleigh (6 and 12)'), L('Saltas al otro trineo y vuelves a tirar.', 'Saltes a l’altre trineu i tornes a tirar.', 'Jump to the other sleigh and roll again.')),
      R('ilu-gr.webp', L('Regalo (26 y 53)', 'Regal (26 i 53)', 'Present (26 and 53)'), L('Saltas al otro regalo y vuelves a tirar.', 'Saltes a l’altre regal i tornes a tirar.', 'Jump to the other present and roll again.')),
      R('ilu-10.webp', L('Casita de galleta (19)', 'Caseta de galeta (19)', 'Gingerbread house (19)'), L('Pierdes 1 turno.', 'Perds 1 torn.', 'Miss 1 turn.')),
      R('ilu-7.webp', L('Bola de nieve (31)', 'Bola de neu (31)', 'Snow globe (31)'), L('Pierdes 2 turnos.', 'Perds 2 torns.', 'Miss 2 turns.')),
      R('ilu-abeto.webp', L('Bosque nevado (42)', 'Bosc nevat (42)', 'Snowy forest (42)'), L('Vuelves a la 30.', 'Tornes a la 30.', 'Back to 30.')),
      R('saco14.webp', L('Saco de Papá Noel (52)', 'Sac del Pare Noel (52)', 'Santa’s sack (52)'), L('Pierdes 2 turnos.', 'Perds 2 torns.', 'Miss 2 turns.')),
      R('mem-12.webp', L('Muñeco de nieve (58)', 'Ninot de neu (58)', 'Snowman (58)'), L('Se funde: vuelves a empezar.', 'Es fon: tornes a començar.', 'It melts: back to the start.')),
      R('mem-04.webp', L('Árbol de Navidad (63)', 'Arbre de Nadal (63)', 'Christmas tree (63)'), L('¡Has ganado!', 'Has guanyat!', 'You win!')),
      el('div', { class: 'oca-pts' },
        el('b', {}, '⭐ ' + L('Puntos', 'Punts', 'Points')),
        el('small', {}, L('Acabar la partida suma en el Marcador de Navidad. Contra el Pare Noel: si ganas, los gnomos ganan premio (la 1.ª vez); si pierdes, −1 (como mucho una vez al día).',
          'Acabar la partida suma al Marcador de Nadal. Contra el Pare Noel: si guanyes, els gnoms guanyen premi (la 1a vegada); si perds, −1 (com a molt un cop al dia).',
          'Finishing adds to the Christmas scoreboard. Against Santa: win and gnomes get a prize (1st time); lose and it’s −1 (at most once a day).'))),
      el('div', { class: 'cc8-endbtns' }, el('button', { type: 'button', class: 'btn btn-big no-delay', onclick: () => box.remove() }, '🎲 ' + L('¡Entendido!', 'Entesos!', 'Got it!')))));
    wrap.append(box);
  }

  // ---- elegir: solo o contra el Pare Noel
  function chooseMode() {
    board.querySelectorAll('.oca-tok').forEach(t => t.remove()); Object.values(cells).forEach(c => c.classList.remove('win'));
    clearInterval(timerIv); timeEl.textContent = '0:00'; started = false; over = false; cur = 0; face(1);
    const me = { i: 0, name: (ctx.profile?.who || ctx.profile?.name || L('Tú', 'Tu', 'You')).split(' ')[0], img: FIG[fig] || FIG.galleta, pos: 0, skip: 0 };
    const go = m => { box.remove(); mode = m; players = [me];
      if (m === 'cpu') players.push({ i: 1, cpu: true, name: L('Papá Noel', 'Pare Noel', 'Santa'), img: 'santa11.webp', pos: 0, skip: 0 });
      players.forEach(p => { p.tok = mkTok(p.img, p.cpu ? 'cpu' : 'me'); board.append(p.tok); });
      requestAnimationFrame(() => { layout(); play(); }); };
    const box = el('div', { class: 'cc8-end' }, el('div', { class: 'cc8-endcard oca-mode' },
      el('div', { class: 'oca-intro-pic small', html: GOOSE_SVG }),
      el('h2', {}, L('¿Cómo quieres jugar?', 'Com vols jugar?', 'How do you want to play?')),
      el('div', { class: 'cc8-endbtns' },
        el('button', { type: 'button', class: 'btn btn-big no-delay', onclick: () => go('solo') }, '🎲 ' + L('Jugar sola / solo', 'Jugar sol', 'Play alone')),
        el('button', { type: 'button', class: 'btn btn-big oca-vs no-delay', onclick: () => go('cpu') }, el('img', { src: 'santa11.webp', alt: '' }), L('Contra el Pare Noel', 'Contra el Pare Noel', 'Against Santa')),
        el('button', { type: 'button', class: 'btn btn-ghost no-delay', onclick: () => showHelp() }, '📜 ' + L('Instrucciones', 'Instruccions', 'Rules')))));
    wrap.append(box);
  }
  layout();
  chooseMode();
}
