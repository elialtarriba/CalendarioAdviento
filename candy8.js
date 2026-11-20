// Día 8 · Mini juego «Dulce Navidad» (V24.1): como el Candy Crush, con cosas de Navidad pintadas.
// · Cada vez que se entra es una PARTIDA nueva y distinta (otras piezas y otro tablero), hasta 24 partidas.
// · Cada partida tiene 5 NIVELES, cada uno más difícil (más tipos de piezas, menos movimientos, más puntos para pasar).
// · Con 4 o más en fila sale una ⭐ ESTRELLA MÁGICA (se lleva su fila y su columna) y suma 1 en el CONTADOR de «4 en raya»,
//   que se va acumulando de partida en partida hasta la meta que pone la administradora (100 si no pone nada).
// · Gnomos: si la administradora lo activa, en su PRIMERA partida ganan puntos para su juego de gnomos
//   (pasar 2 niveles / pasar los 5), que cobran con el botón 🍄.
import { getLang } from './i18n.js';
import { el, sleep, confetti } from './fx.js';
import { pop, chime, clickSound, snapSound, fanfare, oops, christmasSong, unlockAudio } from './sound.js';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const N = 7, PARTIDAS = 24, NIVELES = 5;
// dificultad de cada nivel (calculada con una simulación: el 1 casi todos, el 3 y 4 la mitad, el 5 cuesta)
const LV = [
  { types: 5, moves: 20, goal: 1000 },
  { types: 6, moves: 20, goal: 1000 },
  { types: 6, moves: 18, goal: 1100 },
  { types: 7, moves: 18, goal: 950 },
  { types: 7, moves: 16, goal: 950 },
];
// en cada partida, un poco más difícil (+0,8 % de puntos por partida)
const goalOf = (lv, p) => Math.round(LV[lv].goal * (1 + (p - 1) * .008) / 10) * 10;
const POOL = ['ilu-gorro.webp', 'bola8-3.webp', 'galleta.png', 'ilu-12.webp', 'ilu-5.webp', 'ilu-3.webp', 'ilu-11.webp', 'ilu-9.webp', 'ilu-14.webp', 'ilu-17.webp', 'bola8-1.webp', 'ilu-10.webp'];
const STAR = 'estrella8.webp';
const THEMES = ['#2f6b4a,#123b2a,#0a2018', '#8a1c2b,#4a0d16,#22060b', '#1f4f8a,#0f2a4d,#07162a', '#5a3a8a,#2e1d4d,#150c26', '#7a5418,#3f2a0b,#1f1505', '#1d6b6b,#0e3a3a,#061e1e'];
const CHEERS = () => [L('¡Dulce!', 'Dolç!', 'Sweet!'), L('¡Ho, ho, ho!', 'Ho, ho, ho!', 'Ho, ho, ho!'), L('¡Genial!', 'Genial!', 'Great!'),
  L('¡Navideño!', 'Nadalenc!', 'Festive!'), L('¡Mágico!', 'Màgic!', 'Magical!'), L('¡Increíble!', 'Increïble!', 'Amazing!')];

// ---- lo que se guarda en este aparato (por persona): partidas jugadas y contador de 4 en raya
const decStartMs = () => { const y = new Date().getFullYear(); return Date.UTC(y, 11, 1, -1); }; // 1 de diciembre, 00:00 en España
function loadSave(uid) {
  let s = null; try { s = JSON.parse(localStorage.getItem('adv_candy8_' + (uid || 'x'))); } catch {}
  s = s || { partida: 0, fours: 0, goalSeen: 0, at: Date.now() };
  // el 1 de diciembre todo empieza de 0 (lo jugado antes era de prueba)
  if (Date.now() >= decStartMs() && (s.at || 0) < decStartMs()) s = { partida: 0, fours: 0, goalSeen: 0, at: Date.now() };
  return s;
}
const storeSave = (uid, s) => { try { localStorage.setItem('adv_candy8_' + (uid || 'x'), JSON.stringify({ ...s, at: Date.now() })); } catch {} };

// botón grande y alegre que invita a jugar (va en la casilla 8)
export function candyButton(ctx = {}) {
  const b = el('button', { type: 'button', class: 'cc8-cta no-delay', onclick: () => { unlockAudio(); openCandy(ctx); } },
    el('span', { class: 'cc8-cta-pics' }, ...POOL.slice(0, 4).map(src => el('img', { src, alt: '' }))),
    el('span', { class: 'cc8-cta-txt' }, el('b', {}, L('¡Juega a Dulce Navidad!', 'Juga a Dolç Nadal!', 'Play Sweet Christmas!')),
      el('small', {}, L('24 partidas · 5 niveles 🎮', '24 partides · 5 nivells 🎮', '24 games · 5 levels 🎮'))));
  return el('div', { class: 'cc8-cta-box' }, b);
}

export async function openCandy(ctx = {}) {
  if (document.querySelector('.cc8-wrap')) return;
  const uid = ctx.user?.uid || '';
  const save = loadSave(uid);
  const goal4 = Math.max(5, +(ctx.config?.candyGoal) || 100);
  let music = null, alive = true;
  const close = () => { alive = false; try { music?.stop(1); } catch {} music = null; wrap.classList.add('out'); document.documentElement.classList.remove('gm-lock'); removeEventListener('resize', size); setTimeout(() => wrap.remove(), 350); };

  // ---- pantalla
  const closeBtn = el('button', { type: 'button', class: 'cc8-x no-delay', title: L('Salir', 'Sortir', 'Exit'), onclick: close }, '✕');
  const sub = el('div', { class: 'cc8-sub' });
  const movesEl = el('b', {}), scoreEl = el('b', {}), foursEl = el('b', {});
  const foursChip = el('div', { class: 'cc8-chip cc8-fours', title: L('Estrellas mágicas (4 en raya)', 'Estrelles màgiques (4 en ratlla)', 'Magic stars (4 in a row)') },
    el('small', {}, '⭐ ' + L('4 en raya', '4 en ratlla', '4 in a row')), foursEl);
  const gnBtn = el('button', { type: 'button', class: 'cc8-gn no-delay', style: 'display:none' });
  const fill = el('i', { class: 'cc8-fill' }), flag = el('span', { class: 'cc8-flag' }, '🎯');
  const bar = el('div', { class: 'cc8-bar' }, fill, flag);
  const board = el('div', { class: 'cc8-board' });
  const cheer = el('div', { class: 'cc8-cheer' });
  const help = el('p', { class: 'cc8-help' }, L('Desliza una pieza hacia su vecina para hacer filas de 3 iguales. ¡Con 4 sale una estrella mágica ⭐ que suma en tu contador!',
    'Llisca una peça cap a la del costat per fer files de 3 iguals. Amb 4 surt una estrella màgica ⭐ que suma al teu comptador!', 'Swipe a piece towards its neighbour to make rows of 3. Make 4 for a magic star ⭐ that adds to your counter!'));
  const wrap = el('div', { class: 'cc8-wrap' },
    el('div', { class: 'cc8-snow' }),
    el('div', { class: 'cc8-head' }, closeBtn, el('div', { class: 'cc8-title' }, L('Dulce Navidad', 'Dolç Nadal', 'Sweet Christmas'))),
    sub,
    el('div', { class: 'cc8-stats' },
      el('div', { class: 'cc8-chip' }, el('small', {}, L('Movimientos', 'Moviments', 'Moves')), movesEl),
      el('div', { class: 'cc8-chip' }, el('small', {}, L('Puntos', 'Punts', 'Points')), scoreEl),
      foursChip),
    gnBtn, bar, el('div', { class: 'cc8-stage' }, board, cheer), help);
  document.body.append(wrap);
  document.documentElement.classList.add('gm-lock');
  setTimeout(() => { if (alive) try { music = christmasSong(); } catch {} }, 600);

  // ---- gnomos: ¿esta partida da puntos para su juego?
  let G = null, bonusPartida = false;
  try {
    const gm = await import('./gnomes.js');
    G = { gm, bs: await gm.gameBonusState('candy8') };
    if (!G.bs) G = null;
  } catch (e) { console.warn(e); G = null; }
  function paintGn() {
    if (!G) { gnBtn.style.display = 'none'; return; }
    const { gm, bs } = G, r = bs.rules, owed = gm.gameBonusOwed(bs), paid = bs.doc?.pts || 0;
    gnBtn.style.display = '';
    gnBtn.classList.toggle('ready', owed > paid);
    gnBtn.disabled = !(owed > paid);
    if (owed > paid) gnBtn.replaceChildren(el('img', { src: 'gnomo.png', alt: '' }), el('span', {}, el('b', {}, `🍄 ${L('¡Pulsa y cobra', 'Prem i cobra', 'Tap to get')} +${owed - paid}!`), el('small', {}, L('para tu juego de los gnomos', 'per al teu joc dels gnoms', 'for your gnome game'))));
    else if (bonusPartida) gnBtn.replaceChildren(el('img', { src: 'gnomo.png', alt: '' }), el('span', {}, el('b', {}, L('🍄 ¡Partida de puntos!', '🍄 Partida de punts!', '🍄 Points game!')),
      el('small', {}, `${L('Nivel 2', 'Nivell 2', 'Level 2')}: +${r.p2} · ${L('los 5 niveles', 'els 5 nivells', 'all 5 levels')}: +${r.p5}`)));
    else if (paid > 0) gnBtn.replaceChildren(el('img', { src: 'gnomo.png', alt: '' }), el('span', {}, el('b', {}, `🍄 +${paid} ${L('cobrados', 'cobrats', 'collected')} ✅`), el('small', {}, L('Solo contaba tu primera partida', 'Només comptava la teva primera partida', 'Only your first game counted'))));
    else gnBtn.replaceChildren(el('img', { src: 'gnomo.png', alt: '' }), el('span', {}, el('b', {}, '🍄 ' + L('Tu partida de puntos ya pasó', 'La teva partida de punts ja ha passat', 'Your points game is over')), el('small', {}, L('Solo contaba la primera', 'Només comptava la primera', 'Only the first one counted'))));
  }
  gnBtn.onclick = async () => {
    if (!G || gnBtn.disabled) return;
    gnBtn.disabled = true;
    try { const add = await G.gm.gameBonusClaim(G.bs); if (add > 0) { fanfare(); confetti(160); showCheer(`🍄 +${add}!`); } }
    catch (e) { console.warn(e); gnBtn.disabled = false; return; }
    paintGn();
  };

  // ---------- tablero
  let S = 0, grid = [], score = 0, moves = 0, busy = false, over = false, lv = 0, partida = 0, pics = [], T = 5;
  const size = () => {
    const w = Math.min(innerWidth * .94, innerHeight * .56, 520);
    S = Math.floor(w / N); board.style.width = board.style.height = S * N + 'px'; board.style.setProperty('--s', S + 'px');
    grid.flat().forEach(p => p && place(p, false));
  };
  addEventListener('resize', size);
  const place = (p, anim = true) => { p.el.style.transition = anim ? '' : 'none'; p.el.style.transform = `translate(${p.x * S}px, ${p.y * S}px)`; };
  const make = (t, x, y, star = false) => {
    const e = el('div', { class: 'cc8-p' + (star ? ' star' : '') }, el('img', { src: star ? STAR : pics[t], alt: '', draggable: 'false' }));
    const p = { t, x, y, star, el: e }; e._p = p; board.append(e); return p;
  };
  const rnd = () => Math.floor(Math.random() * T);
  function fresh() {
    board.replaceChildren(); grid = Array.from({ length: N }, () => Array(N).fill(null));
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let t; do { t = rnd(); } while ((x >= 2 && grid[y][x - 1].t === t && grid[y][x - 2].t === t) || (y >= 2 && grid[y - 1][x].t === t && grid[y - 2][x].t === t));
      grid[y][x] = make(t, x, y);
    }
    if (!hasMove()) return fresh();
    size();
    grid.flat().forEach(p => { p.el.style.transition = 'none'; p.el.style.transform = `translate(${p.x * S}px, ${(p.y - N - 1) * S}px)`; });
    requestAnimationFrame(() => requestAnimationFrame(() => grid.flat().forEach(p => { p.el.style.transition = `transform .5s cubic-bezier(.3,1.3,.5,1) ${(N - p.y) * 40 + p.x * 15}ms`; place(p); })));
  }
  function findRuns() {
    const runs = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N;) { let k = x; while (k + 1 < N && same(grid[y][x], grid[y][k + 1])) k++; if (k - x >= 2) runs.push(Array.from({ length: k - x + 1 }, (_, i) => grid[y][x + i])); x = k + 1; }
    for (let x = 0; x < N; x++) for (let y = 0; y < N;) { let k = y; while (k + 1 < N && same(grid[y][x], grid[k + 1][x])) k++; if (k - y >= 2) runs.push(Array.from({ length: k - y + 1 }, (_, i) => grid[y + i][x])); y = k + 1; }
    return runs;
  }
  const same = (a, b) => a && b && a.t === b.t;
  function hasMove() {
    const tryS = (x1, y1, x2, y2) => { swapG(x1, y1, x2, y2); const ok = findRuns().length > 0; swapG(x1, y1, x2, y2); return ok; };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { if (x + 1 < N && tryS(x, y, x + 1, y)) return true; if (y + 1 < N && tryS(x, y, x, y + 1)) return true; }
    return false;
  }
  function swapG(x1, y1, x2, y2) { const a = grid[y1][x1], b = grid[y2][x2]; grid[y1][x1] = b; grid[y2][x2] = a; if (a) { a.x = x2; a.y = y2; } if (b) { b.x = x1; b.y = y1; } }

  // ---------- un movimiento
  async function trySwap(a, dx, dy) {
    if (busy || over || !a) return;
    const x2 = a.x + dx, y2 = a.y + dy; if (x2 < 0 || y2 < 0 || x2 >= N || y2 >= N) return;
    const b = grid[y2][x2]; busy = true; clearSel();
    swapG(a.x, a.y, x2, y2); place(a); place(b); clickSound(); await sleep(200);
    if (!findRuns().length) {
      swapG(a.x, a.y, b.x, b.y); place(a); place(b); try { oops(); } catch {} a.el.classList.add('no'); b.el.classList.add('no');
      await sleep(260); a.el.classList.remove('no'); b.el.classList.remove('no'); busy = false; return;
    }
    moves--; movesEl.textContent = moves;
    await resolve([a, b]);
    if (!alive) return;
    if (score >= goalOf(lv, partida)) return levelDone(true);
    if (moves <= 0) return levelDone(false);
    if (!hasMove()) { showCheer(L('¡Mezclamos!', 'Barregem!', 'Shuffle!')); await sleep(500); fresh(); await sleep(700); }
    busy = false;
  }
  async function resolve(moved) {
    let combo = 0;
    for (;;) {
      const runs = findRuns(); if (!runs.length) break;
      combo++;
      const kill = new Set(), born = [];
      runs.forEach(r => {
        r.forEach(p => kill.add(p));
        if (r.length >= 4) { const at = r.find(p => moved?.includes(p)) || r[Math.floor(r.length / 2)]; born.push({ x: at.x, y: at.y, t: at.t }); }
      });
      let more = true; while (more) { more = false; [...kill].forEach(p => { if (p.star && !p.boom) { p.boom = true; starBlast(p);
        for (let i = 0; i < N; i++) [grid[p.y][i], grid[i][p.x]].forEach(q => { if (q && !kill.has(q)) { kill.add(q); more = true; } }); } }); }
      const pts = kill.size * 10 * combo; addScore(pts);
      if (combo > 1 || kill.size >= 5) showCheer(CHEERS()[Math.min(CHEERS().length - 1, combo + Math.floor(kill.size / 6) - 1)]);
      combo > 1 ? chime() : pop();
      kill.forEach(p => { p.el.classList.add('pop'); sparkle(p); grid[p.y][p.x] = null; });
      floatPts(kill, pts);
      await sleep(260);
      kill.forEach(p => p.el.remove());
      born.forEach(b => { const p = make(b.t, b.x, b.y, true); grid[b.y][b.x] = p; place(p, false); p.el.classList.add('born'); });
      if (born.length) { try { snapSound(); } catch {} showCheer('⭐ ' + L('¡Estrella mágica!', 'Estrella màgica!', 'Magic star!')); addFours(born.length); }
      await fall(); moved = null;
    }
  }
  async function fall() {
    for (let x = 0; x < N; x++) {
      let w = N - 1;
      for (let y = N - 1; y >= 0; y--) if (grid[y][x]) { const p = grid[y][x]; grid[y][x] = null; grid[w][x] = p; p.y = w; w--; }
      for (let k = w; k >= 0; k--) { const p = make(rnd(), x, k); grid[k][x] = p; p.el.style.transition = 'none'; p.el.style.transform = `translate(${x * S}px, ${(k - w - 1) * S}px)`; }
    }
    await sleep(20); requestAnimationFrame(() => grid.flat().forEach(p => place(p)));
    await sleep(330);
  }
  function paintScore() {
    const g = goalOf(lv, partida);
    scoreEl.textContent = `${score}/${g}`;
    fill.style.width = Math.min(100, score / g * 100) + '%';
    bar.classList.toggle('done', score >= g);
  }
  const addScore = n => { score += n; paintScore(); };
  function paintFours(bump = false) {
    foursEl.textContent = `${save.fours}/${goal4}`;
    foursChip.classList.toggle('full', save.fours >= goal4);
    if (bump) { foursChip.classList.remove('bump'); void foursChip.offsetWidth; foursChip.classList.add('bump'); }
  }
  function addFours(n) {
    save.fours += n; storeSave(uid, save); paintFours(true);
    if (save.fours >= goal4 && save.goalSeen < goal4) { save.goalSeen = goal4; storeSave(uid, save); setTimeout(() => goalParty(), 900); }
  }
  async function goalParty() {
    if (!alive) return;
    try { fanfare(); } catch {} confetti(260);
    const box = el('div', { class: 'cc8-end cc8-goal' }, el('div', { class: 'cc8-endcard' },
      el('div', { class: 'cc8-bigstar' }, '⭐'),
      el('h2', {}, L(`¡Has llegado a ${goal4}!`, `Has arribat a ${goal4}!`, `You reached ${goal4}!`)),
      el('p', {}, L('Estrellas mágicas de 4 en raya. ¡Eres un crack de la Navidad!', 'Estrelles màgiques de 4 en ratlla. Ets un crack del Nadal!', 'Magic 4-in-a-row stars. You are a Christmas champ!')),
      el('div', { class: 'cc8-endbtns' }, el('button', { type: 'button', class: 'btn btn-big no-delay', onclick: () => box.remove() }, '🎄 ' + L('¡Seguir jugando!', 'Continuar jugant!', 'Keep playing!')))));
    wrap.append(box);
  }
  let cheerT = 0;
  function showCheer(txt) { cheer.textContent = txt; cheer.classList.remove('on'); void cheer.offsetWidth; cheer.classList.add('on'); clearTimeout(cheerT); cheerT = setTimeout(() => cheer.classList.remove('on'), 1100); }
  function sparkle(p) {
    for (let k = 0; k < 3; k++) { const s = el('i', { class: 'cc8-spk' }); s.style.left = (p.x + .5) * S + 'px'; s.style.top = (p.y + .5) * S + 'px';
      s.style.setProperty('--dx', (Math.random() - .5) * S * 1.6 + 'px'); s.style.setProperty('--dy', (Math.random() - .7) * S * 1.6 + 'px'); board.append(s); setTimeout(() => s.remove(), 700); }
  }
  function floatPts(kill, pts) {
    const arr = [...kill]; const cx = arr.reduce((a, p) => a + p.x, 0) / arr.length, cy = arr.reduce((a, p) => a + p.y, 0) / arr.length;
    const f = el('div', { class: 'cc8-pts' }, '+' + pts); f.style.left = (cx + .5) * S + 'px'; f.style.top = (cy + .5) * S + 'px'; board.append(f); setTimeout(() => f.remove(), 900);
  }
  function starBlast(p) {
    const h = el('i', { class: 'cc8-beam h' }), v = el('i', { class: 'cc8-beam v' });
    h.style.top = p.y * S + 'px'; v.style.left = p.x * S + 'px'; board.append(h, v); setTimeout(() => { h.remove(); v.remove(); }, 600);
  }

  // ---------- tocar y deslizar
  let sel = null, start = null;
  const clearSel = () => { sel?.el.classList.remove('sel'); sel = null; };
  board.addEventListener('pointerdown', e => {
    const pe = e.target.closest('.cc8-p'); if (!pe || busy || over) return; e.preventDefault(); unlockAudio();
    start = { p: pe._p, x: e.clientX, y: e.clientY, used: false };
    try { board.setPointerCapture(e.pointerId); } catch {}
  });
  board.addEventListener('pointermove', e => {
    if (!start || start.used) return; const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < S * .35) return;
    start.used = true; const p = start.p; start = null;
    Math.abs(dx) > Math.abs(dy) ? trySwap(p, Math.sign(dx), 0) : trySwap(p, 0, Math.sign(dy));
  });
  board.addEventListener('pointerup', () => {
    if (!start || start.used) { start = null; return; } const p = start.p; start = null;
    if (sel && sel !== p && Math.abs(sel.x - p.x) + Math.abs(sel.y - p.y) === 1) { const a = sel; trySwap(a, p.x - a.x, p.y - a.y); return; }
    if (sel === p) return clearSel();
    clearSel(); sel = p; p.el.classList.add('sel'); pop();
  });
  board.addEventListener('pointercancel', () => { start = null; });

  // ---------- partidas y niveles
  const levelDots = () => el('span', { class: 'cc8-dots' }, ...Array.from({ length: NIVELES }, (_, i) => el('i', { class: i < lv ? 'ok' : i === lv ? 'now' : '' })));
  function paintSub() {
    sub.replaceChildren(el('span', {}, `${L('Partida', 'Partida', 'Game')} ${partida}/${PARTIDAS}`), el('span', { class: 'cc8-sep' }, '·'),
      el('span', {}, `${L('Nivel', 'Nivell', 'Level')} ${lv + 1}/${NIVELES}`), levelDots());
  }
  function startLevel() {
    const c = LV[lv]; T = c.types; score = 0; moves = c.moves; over = false; busy = false;
    movesEl.textContent = moves; paintScore(); paintSub(); clearSel();
    showCheer(`${L('Nivel', 'Nivell', 'Level')} ${lv + 1}`);
    fresh();
  }
  async function newPartida() {
    if (save.partida >= PARTIDAS) return allDone();
    save.partida++; storeSave(uid, save); partida = save.partida; lv = 0;
    // cada partida, distinta: otras piezas, otro orden y otro color de fondo
    pics = POOL.slice().sort(() => Math.random() - .5);
    const th = THEMES[(partida - 1) % THEMES.length].split(',');
    wrap.style.background = `radial-gradient(ellipse at 50% 0%, ${th[0]} 0%, ${th[1]} 45%, ${th[2]} 100%)`;
    // gnomos: la primera partida es la de los puntos
    bonusPartida = false;
    if (G && !G.bs.doc) bonusPartida = await G.gm.gameBonusStart(G.bs);
    paintGn();
    startLevel();
  }
  async function levelDone(won) {
    over = true; busy = true; await sleep(450); if (!alive) return;
    const pass = won;
    if (pass) { lv++; if (bonusPartida && G) { await G.gm.gameBonusLevel(G.bs, lv); paintGn(); } }
    const last = pass && lv >= NIVELES;
    if (pass) { try { fanfare(); } catch {} confetti(last ? 300 : 120); } else { try { oops(); } catch {} }
    const btns = [];
    const card = el('div', { class: 'cc8-endcard' });
    const box = el('div', { class: 'cc8-end' }, card);
    const go = fn => () => { box.remove(); fn(); };
    if (last) {
      if (bonusPartida) bonusPartida = false;
      import('./points.js').then(m => m.awardGame('candy8')).catch(e => console.warn(e)); // (V24.2) ⭐ Marcador de Navidad
      btns.push(el('button', { type: 'button', class: 'btn btn-big no-delay', onclick: go(newPartida) }, save.partida >= PARTIDAS ? '🏆 ' + L('Ver el final', 'Veure el final', 'See the ending') : '🎮 ' + L('Nueva partida', 'Partida nova', 'New game')));
      card.append(el('div', { class: 'cc8-endstars' }, ...Array.from({ length: NIVELES }, (_, i) => el('span', { class: 'on', style: `--i:${i}` }, '★'))),
        el('h2', {}, L('¡Partida completada!', 'Partida completada!', 'Game complete!')),
        el('p', {}, L(`Has pasado los ${NIVELES} niveles de la partida ${partida}. ¡Eres una estrella de la Navidad!`, `Has passat els ${NIVELES} nivells de la partida ${partida}. Ets una estrella del Nadal!`, `You beat all ${NIVELES} levels of game ${partida}. You are a Christmas star!`)));
    } else if (pass) {
      btns.push(el('button', { type: 'button', class: 'btn btn-big no-delay', onclick: go(startLevel) }, `➡️ ${L('Nivel', 'Nivell', 'Level')} ${lv + 1}`));
      card.append(el('div', { class: 'cc8-endstars' }, ...Array.from({ length: NIVELES }, (_, i) => el('span', { class: i < lv ? 'on' : '', style: `--i:${i}` }, '★'))),
        el('h2', {}, `${L('¡Nivel', 'Nivell', 'Level')} ${lv} ${L('superado!', 'superat!', 'cleared!')}`),
        el('p', { class: 'cc8-endpts' }, L('Puntos', 'Punts', 'Points') + ': ', el('b', {}, score)),
        el('p', {}, L('El siguiente es un poco más difícil…', 'El següent és una mica més difícil…', 'The next one is a bit harder…')));
    } else {
      btns.push(el('button', { type: 'button', class: 'btn btn-big no-delay', onclick: go(startLevel) }, '🔄 ' + L('Repetir el nivel', 'Repetir el nivell', 'Retry level')));
      card.append(el('div', { class: 'cc8-bigstar sad' }, '❄️'),
        el('h2', {}, L('¡Casi!', 'Gairebé!', 'Almost!')),
        el('p', { class: 'cc8-endpts' }, `${score} / ${goalOf(lv, partida)} ${L('puntos', 'punts', 'points')}`),
        el('p', {}, L('Se han acabado los movimientos. ¡Prueba otra vez!', 'S’han acabat els moviments. Torna-ho a provar!', 'Out of moves. Try again!')));
      if (bonusPartida) card.append(el('p', { class: 'cc8-rec' }, '🍄 ' + L('Tu partida de puntos sigue: si sales, se acaba.', 'La teva partida de punts continua: si surts, s’acaba.', 'Your points game continues: if you leave, it ends.')));
    }
    // gnomos: si ya puede cobrar, el botón también sale aquí
    if (G && G.gm.gameBonusOwed(G.bs) > (G.bs.doc?.pts || 0)) {
      const claim = el('button', { type: 'button', class: 'cc8-gn ready no-delay' }, el('img', { src: 'gnomo.png', alt: '' }),
        el('span', {}, el('b', {}, `🍄 ${L('¡Pulsa y cobra', 'Prem i cobra', 'Tap to get')} +${G.gm.gameBonusOwed(G.bs) - (G.bs.doc?.pts || 0)}!`), el('small', {}, L('para tu juego de los gnomos', 'per al teu joc dels gnoms', 'for your gnome game'))));
      claim.onclick = async () => { claim.disabled = true; await gnBtn.onclick(); claim.replaceWith(el('p', { class: 'cc8-rec' }, '🍄 ' + L('¡Puntos cobrados!', 'Punts cobrats!', 'Points collected!') + ' ✅')); };
      card.append(claim);
    }
    btns.push(el('button', { type: 'button', class: 'btn btn-ghost btn-big no-delay', onclick: close }, '🎄 ' + L('Salir', 'Sortir', 'Exit')));
    card.append(el('div', { class: 'cc8-endbtns' }, ...btns));
    wrap.append(box);
  }
  function allDone() {
    over = true; busy = true; board.replaceChildren(); try { fanfare(); } catch {} confetti(300);
    const again = el('button', { type: 'button', class: 'btn btn-big no-delay' }, '🔄 ' + L('Empezar de nuevo', 'Tornar a començar', 'Start again'));
    const box = el('div', { class: 'cc8-end' }, el('div', { class: 'cc8-endcard' },
      el('div', { class: 'cc8-bigstar' }, '🏆'),
      el('h2', {}, L(`¡Has jugado las ${PARTIDAS} partidas!`, `Has jugat les ${PARTIDAS} partides!`, `You played all ${PARTIDAS} games!`)),
      el('p', {}, `⭐ ${L('Estrellas mágicas', 'Estrelles màgiques', 'Magic stars')}: ${save.fours}`),
      el('div', { class: 'cc8-endbtns' }, again, el('button', { type: 'button', class: 'btn btn-ghost btn-big no-delay', onclick: close }, '🎄 ' + L('Salir', 'Sortir', 'Exit')))));
    again.onclick = () => { box.remove(); save.partida = 0; storeSave(uid, save); newPartida(); };
    wrap.append(box);
  }
  paintFours(); paintGn();
  newPartida();
}
