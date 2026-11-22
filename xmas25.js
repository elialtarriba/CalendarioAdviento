// Día 25 (V29) · «¡Es Navidad! Hoy, dos juegos»: al entrar salen dos botones y hay que hacer los dos:
//   1. 🎴 Memory de Navidad (pairs.js, el de siempre, con la bola que cobra vida)
//   2. 🐍 La serpiente de Navidad (snake.js, nuevo, con 3 niveles)
// Al acabar los dos: fuegos artificiales, «Ho, ho, ho», Merry Christmas y mucho confeti; después, el calendario
// del mes (el resumen de siempre, desde donde se puede ir a todas las casillas). El día 25 ya no tiene actividad 1 ni 2.
import { el, sleep, confetti, toast, popup } from './fx.js';
import { getLang } from './i18n.js';
import { hohoho, fanfare, christmasSong, unlockAudio, pop } from './sound.js';
import { fireworks } from './share.js';
import { S } from './app.js';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const GAMES = ['pairs', 'snake'];

// lo que ya se ha hecho de los dos juegos (en este aparato). Lo de noviembre (pruebas) no cuenta en diciembre.
const key = () => 'adv_d25prog_' + (S.user?.uid || 'x');
const isDec = t => new Date(t).getMonth() === 11;
function loadProg() {
  try { const p = JSON.parse(localStorage.getItem(key()) || 'null'); if (p && isDec(p.at) === isDec(Date.now())) return p; } catch {}
  return { pairs: null, snake: null, at: Date.now() };
}
const saveProg = p => { try { p.at = Date.now(); localStorage.setItem(key(), JSON.stringify(p)); } catch {} };

export function render(body, ctx) {
  body.style.webkitUserSelect = body.style.userSelect = 'none';
  const recorded = () => !!S.answers?.[25];
  const fresh = ctx.mode === 'fresh';
  // «Abrir la casilla 25 desde el principio»: los dos juegos otra vez, como el primer día
  let prog = fresh ? { pairs: null, snake: null, at: Date.now() } : loadProg();
  if (fresh) saveProg(prog);
  // la casilla ya está hecha (por ejemplo en otro aparato): los dos juegos salen hechos
  const doneOf = g => !!prog[g] || (recorded() && !fresh);
  let current = null; // juego que se está jugando
  let partyShown = false;
  ctx.cleanup = () => { try { current?.cleanup?.(); } catch {} try { current?.stop?.(); } catch {} document.querySelectorAll('.x25-party').forEach(x => x.remove()); };

  function menu() {
    try { current?.stop?.(); } catch {}
    current = null;
    body.replaceChildren();
    const both = GAMES.every(doneOf);
    const card = (g, n, ico, title, sub, img) => el('button', { type: 'button', class: 'x25-game no-delay' + (doneOf(g) ? ' done' : ''), 'data-game': g, onclick: () => open(g) },
      el('span', { class: 'x25-num' }, doneOf(g) ? '✓' : n),
      img ? el('img', { class: 'x25-img', src: img, alt: '' }) : el('span', { class: 'x25-ico' }, ico),
      el('span', { class: 'x25-txt' }, el('b', {}, title), el('small', {}, doneOf(g) ? '✅ ' + L('¡Hecho! (puedes volver a jugar)', 'Fet! (hi pots tornar a jugar)', 'Done! (you can play again)') : sub)));
    body.append(
      el('div', { class: 'x25-head' },
        el('div', { class: 'c5-ribbon x25-ribbon' }, '🎄 ' + L('¡Es Navidad!', 'És Nadal!', 'It’s Christmas!') + ' 🎄'),
        el('p', { class: 'x25-sub' }, both
          ? L('¡Has hecho los dos juegos de Navidad! 🎉', 'Has fet els dos jocs de Nadal! 🎉', 'You’ve done both Christmas games! 🎉')
          : L('Por ser Navidad, hoy hay que hacer los DOS juegos. Cuando acabes los dos… ¡habrá fiesta! 🎆', 'Com que és Nadal, avui s’han de fer els DOS jocs. Quan acabis tots dos… hi haurà festa! 🎆', 'Because it’s Christmas, today you have to play BOTH games. When you finish both… party time! 🎆'))),
      el('div', { class: 'x25-games' },
        card('pairs', 1, '🎴', L('Memory de Navidad', 'Memory de Nadal', 'Christmas memory'), L('Encuentra las 14 parejas de cartas', 'Troba les 14 parelles de cartes', 'Find the 14 pairs of cards'), 'mem-reverso.webp'),
        card('snake', 2, '🐍', L('La serpiente de Navidad', 'La serp de Nadal', 'The Christmas snake'), L('Come galletas y crece · 3 niveles', 'Menja galetes i creix · 3 nivells', 'Eat cookies and grow · 3 levels'))),
      el('p', { class: 'x25-progress' }, `${GAMES.filter(doneOf).length} / 2 ` + L('juegos hechos', 'jocs fets', 'games done')),
      ...(both && recorded() ? [el('button', { type: 'button', class: 'btn btn-big no-delay x25-again', onclick: () => party() }, '🎆 ' + L('¡Volver a ver la fiesta!', 'Tornar a veure la festa!', 'See the party again!'))] : []));
    body.scrollTo?.({ top: 0 });
  }

  async function open(g) {
    unlockAudio(); pop();
    body.replaceChildren(el('button', { type: 'button', class: 'btn btn-ghost small-btn no-delay x25-back', onclick: () => { ctx.cleanup(); menu(); } }, '← ' + L('Los dos juegos', 'Els dos jocs', 'The two games')));
    if (g === 'pairs') {
      // el Memory de siempre; al cerrar la bola que cobra vida vuelve aquí (no cierra la casilla)
      const sub = { ...ctx, prev: null, finishBtn: { onclick: null }, submit: async () => {}, finish: () => { current = null; complete('pairs'); } };
      current = sub;
      (await import('./pairs.js')).render(body, sub);
    } else {
      const { snakeGame } = await import('./snake.js');
      current = snakeGame(body, { won: ctx.won, onDone: () => complete('snake', true), onWin: () => { try { current?.stop?.(); } catch {} current = null; complete('snake'); } }); // arriba ya está «← Los dos juegos»
    }
  }

  // stay = el juego acaba de ganarse y su pantalla de «¡Conseguido!» sigue (V29.2): se apunta ya como hecho
  async function complete(g, stay = false) {
    const wasBoth = GAMES.every(doneOf), first = !prog[g];
    prog[g] = prog[g] || { at: Date.now() }; saveProg(prog);
    const both = GAMES.every(doneOf);
    if (both && (!wasBoth || fresh || !recorded()) && !partyShown) {
      partyShown = true;
      if (!recorded()) { try { await ctx.submit({ answer: L('Memory + Serpiente', 'Memory + Serp', 'Memory + Snake'), status: 'correct', extra: { d25: { pairs: prog.pairs, snake: prog.snake } } }); } catch (e) { console.error(e); } }
      if (stay) await sleep(1800); // que se vea el «¡Conseguido!» un momento… y ¡fiesta!
      try { current?.stop?.(); } catch {} current = null;
      menu(); return party();
    }
    if (stay) { if (!both && first) toast('👏 ' + L('¡Muy bien! Ahora te falta el otro juego.', 'Molt bé! Ara et falta l’altre joc.', 'Well done! Now the other game.'), 3500); return; }
    menu();
    if (!both && first) toast('👏 ' + L('¡Muy bien! Ahora te falta el otro juego.', 'Molt bé! Ara et falta l’altre joc.', 'Well done! Now the other game.'), 3500);
  }

  // 🎆 la gran fiesta de Navidad
  function party() {
    partyShown = true;
    let music = null; try { unlockAudio(); hohoho(); } catch {}
    const cv = el('canvas', { class: 'x25-fw' });
    const title = el('h1', { class: 'x25-title' }, 'Merry Christmas!');
    const hoho = el('p', { class: 'x25-hoho' }, 'Ho, ho, ho!');
    const local = el('p', { class: 'x25-local' }, getLang() === 'en' ? '🎄 🎅 🎁' : L('¡Feliz Navidad!', 'Bon Nadal!', ''));
    const go = el('button', { type: 'button', class: 'btn btn-big no-delay x25-cal' }, '📅 ' + L('Ver mi calendario', 'Veure el meu calendari', 'See my calendar'));
    const lay = el('div', { class: 'x25-party' }, cv,
      el('div', { class: 'x25-stars' }, ...Array.from({ length: 18 }, (_, i) => el('i', { style: `--i:${i};--x:${Math.round(Math.random() * 100)};--d:${(2 + Math.random() * 3).toFixed(2)}s` }, ['❄', '✨', '⭐', '🎁', '🔔', '🎄'][i % 6]))),
      el('div', { class: 'x25-party-in' }, el('div', { class: 'x25-santa' }, '🎅'), hoho, title, local,
        el('p', { class: 'x25-msg' }, L('¡Has terminado el Calendario de Adviento! Gracias por jugar cada día.', 'Has acabat el Calendari d’Advent! Gràcies per jugar cada dia.', 'You’ve finished the Advent Calendar! Thanks for playing every day.')), go));
    document.body.append(lay);
    const stopFw = fireworks(cv, 14000);
    confetti(320); setTimeout(() => confetti(260), 1500); setTimeout(() => { confetti(260); fanfare(); }, 3200); setTimeout(() => confetti(200), 5500);
    setTimeout(() => { try { music = christmasSong(); } catch {} }, 4200);
    setTimeout(() => go.classList.add('show'), 2500);
    go.onclick = () => {
      try { music?.stop?.(1.5); } catch {} try { stopFw(); } catch {}
      lay.classList.add('out');
      setTimeout(() => { lay.remove(); try { ctx.finish(); } catch (e) { console.error(e); } }, 500); // y después: el calendario del mes (resumen)
    };
  }

  // (V29.2) «Finalizar» en el día 25: nunca el aviso del «reto»; si faltan juegos, se dice cuál; si están los dos, ¡la fiesta!
  ctx.onFinishTry = async () => {
    if (document.querySelector('.x25-party')) return false;
    const left = GAMES.filter(g => !doneOf(g));
    if (left.length) {
      const name = g => g === 'pairs' ? '🎴 ' + L('Memory de Navidad', 'Memory de Nadal', 'Christmas memory') : '🐍 ' + L('La serpiente de Navidad', 'La serp de Nadal', 'The Christmas snake');
      const r = await popup(el('div', {}, el('h2', {}, '🎄'),
        el('p', { style: 'font-size:18px' }, L('Por ser Navidad hay que hacer los dos juegos. Te falta:', 'Com que és Nadal, s’han de fer els dos jocs. Et falta:', 'Because it’s Christmas you play both games. Still to do:')),
        ...left.map(g => el('p', { style: 'font-size:20px;font-weight:700' }, name(g)))),
        { buttons: [{ label: L('Jugar', 'Jugar', 'Play'), value: 'play' }, { label: L('Salir (lo haré luego)', 'Sortir (ho faré després)', 'Leave (later)'), value: 'later', cls: 'btn-ghost' }] });
      if (r === 'play') { ctx.cleanup(); open(left[0]); }
      else if (r === 'later') { ctx.cleanup(); ctx.finish(true); }
      return false;
    }
    if (!recorded() || (fresh && !partyShown)) { await complete(GAMES[0]); return false; } // los dos hechos: ¡fiesta! (y después el resumen)
    ctx.cleanup(); return true; // ya estaba todo: al resumen del mes
  };

  menu();
}
