// Día 25 (V29) · «La serpiente de Navidad»: una guirnalda con gorro de Papá Noel que se come las galletas
// y los regalos y se va haciendo más larga. Tres niveles: facilísimo, intermedio y difícil.
// Se mueve deslizando el dedo sobre el tablero, con las 4 flechas de debajo o con el teclado.
// Se gana al comerse las galletas que pide el nivel. Lo llama xmas25.js (los dos juegos de Navidad).
import { getLang } from './i18n.js';
import { el, sleep, confetti, toast } from './fx.js';
import { pop, chime, fanfare, sadTrombone, unlockAudio } from './sound.js';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const N = 15; // casillas por lado

export const LEVELS = {
  easy: { name: () => L('Facilísimo', 'Facilíssim', 'Super easy'), ico: '🙂', ms: 300, goal: 8, walls: false, self: false,
    tip: () => L('Muy lenta. Atraviesa las paredes y se puede cruzar a sí misma: ¡no se pierde nunca!', 'Molt lenta. Travessa les parets i es pot creuar a si mateixa: no es perd mai!', 'Very slow. It goes through the walls and can cross itself: you can’t lose!') },
  mid: { name: () => L('Intermedio', 'Intermedi', 'Medium'), ico: '😎', ms: 210, goal: 12, walls: false, self: true,
    tip: () => L('Atraviesa las paredes, pero no puede morderse la cola.', 'Travessa les parets, però no es pot mossegar la cua.', 'It goes through the walls, but must not bite its tail.') },
  hard: { name: () => L('Difícil', 'Difícil', 'Hard'), ico: '🔥', ms: 150, goal: 16, walls: true, self: true,
    tip: () => L('Rápida, y cada vez más. Ni paredes ni morderse la cola.', 'Ràpida, i cada cop més. Ni parets ni mossegar-se la cua.', 'Fast, and faster and faster. No walls and no biting its tail.') },
};
const FOODS = ['🍪', '🎁', '🍬', '⭐', '🔔'];
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
const best = k => { try { return +(localStorage.getItem('adv_snake25_best_' + k) || 0); } catch { return 0; } };
const setBest = (k, v) => { try { if (v > best(k)) localStorage.setItem('adv_snake25_best_' + k, String(v)); } catch {} };

// host: dónde se pinta · onWin({ level, eaten, time }) al conseguirlo · onExit() para volver al menú de los dos juegos
export function snakeGame(host, { onWin, onExit, won } = {}) {
  let timer = 0, alive = true;
  const stop = () => { clearTimeout(timer); timer = 0; };
  const wrap = el('div', { class: 'sn-wrap' });
  host.append(wrap);

  function chooseLevel() {
    stop();
    wrap.replaceChildren(
      el('div', { class: 'sn-head' }, el('h2', { class: 'q-title' }, '🐍 ' + L('La serpiente de Navidad', 'La serp de Nadal', 'The Christmas snake')),
        el('p', { class: 'game-help' }, L('Guía la serpiente para que se coma las galletas y los regalos. ¡Cada vez que come, se hace más larga!',
          'Guia la serp perquè es mengi les galetes i els regals. Cada cop que menja, es fa més llarga!', 'Steer the snake so it eats the cookies and presents. Every time it eats, it grows longer!'))),
      el('div', { class: 'cc8-endcard pm-levels sn-levels' },
        el('h2', {}, '🎮 ' + L('Elige el nivel', 'Tria el nivell', 'Choose the level')),
        ...Object.entries(LEVELS).map(([k, lv]) => el('button', { type: 'button', class: 'pm-lvbtn pm-' + k + ' no-delay', 'data-level': k, onclick: () => { unlockAudio(); pop(); play(k); } },
          el('span', { class: 'pm-lvico' }, lv.ico),
          el('span', {}, el('b', {}, lv.name()),
            el('small', {}, lv.tip()),
            el('small', { class: 'pm-lvgoal' }, '🍪 ' + L(`Cómete ${lv.goal} cosas`, `Menja’t ${lv.goal} coses`, `Eat ${lv.goal} treats`)),
            best(k) ? el('small', { class: 'pm-lvbest' }, '🏆 ' + L('Tu récord', 'El teu rècord', 'Your best') + ': ' + best(k)) : null)))),
      ...(onExit ? [el('button', { type: 'button', class: 'btn btn-ghost no-delay sn-back', onclick: () => { stop(); onExit(); } }, '← ' + L('Volver a los dos juegos', 'Tornar als dos jocs', 'Back to the two games'))] : []));
  }

  function play(k) {
    stop();
    const LV = LEVELS[k];
    const size = Math.floor(Math.min((host.clientWidth || innerWidth) - 8, 380, innerHeight * .5) / N) * N;
    const cs = size / N, dpr = Math.min(2, devicePixelRatio || 1);
    const cv = el('canvas', { class: 'sn-cv', width: size * dpr, height: size * dpr });
    cv.style.width = cv.style.height = size + 'px';
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const eatenEl = el('b', {}, '0'), msg = el('p', { class: 'sn-msg' }, '👆 ' + L('Toca una flecha o desliza el dedo para empezar', 'Toca una fletxa o llisca el dit per començar', 'Tap an arrow or swipe to start'));
    const key = (d, ico) => el('button', { type: 'button', class: 'pm-key pm-' + d + ' no-delay', 'aria-label': d, onpointerdown: e => { e.preventDefault(); turn(d); } }, ico);
    wrap.replaceChildren(
      el('div', { class: 'pm-hud sn-hud' },
        el('div', { class: 'pm-box' }, el('small', {}, L('Comido', 'Menjat', 'Eaten')), el('span', { class: 'sn-count' }, eatenEl, ' / ' + LV.goal)),
        el('span', { class: 'pm-lvl' }, LV.ico + ' ' + LV.name()),
        el('button', { type: 'button', class: 'btn btn-ghost small-btn no-delay sn-change', onclick: () => chooseLevel() }, '🎮 ' + L('Nivel', 'Nivell', 'Level'))),
      el('div', { class: 'sn-stage' }, cv), msg,
      el('div', { class: 'pm-pad sn-pad' }, key('up', '▲'), key('left', '◀'), key('down', '▼'), key('right', '▶')));

    let snake = [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }], dir = 'right', queue = [], started = false, eaten = 0, food = null, ms = LV.ms, t0 = 0, over = false;
    const placeFood = () => {
      const free = []; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!snake.some(s => s.x === x && s.y === y)) free.push({ x, y });
      food = { ...free[Math.floor(Math.random() * free.length)], ico: FOODS[eaten % FOODS.length] };
    };
    placeFood();

    function turn(d) {
      if (over) return;
      unlockAudio();
      if (!started) { if (d === OPP[dir]) return; started = true; t0 = Date.now(); msg.textContent = ''; dir = d; tick(); return; }
      const last = queue.length ? queue[queue.length - 1] : dir;
      if (d === last || d === OPP[last]) return; // ni repetir ni dar media vuelta
      if (queue.length < 2) queue.push(d);
    }
    // deslizar el dedo sobre el tablero
    let sx = 0, sy = 0, sw = false;
    cv.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; sw = true; e.preventDefault(); });
    cv.addEventListener('pointermove', e => {
      if (!sw) return; const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.hypot(dx, dy) < 22) return;
      turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); sx = e.clientX; sy = e.clientY;
    });
    const endSwipe = () => { sw = false; };
    cv.addEventListener('pointerup', endSwipe); cv.addEventListener('pointercancel', endSwipe);
    const onKey = e => {
      if (!cv.isConnected) return removeEventListener('keydown', onKey);
      const m = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key];
      if (m) { e.preventDefault(); turn(m); }
    };
    addEventListener('keydown', onKey);

    function tick() {
      if (!cv.isConnected || over) return stop();
      if (queue.length) dir = queue.shift();
      const [dx, dy] = DIRS[dir];
      let hx = snake[0].x + dx, hy = snake[0].y + dy;
      if (LV.walls) { if (hx < 0 || hy < 0 || hx >= N || hy >= N) return crash(L('¡Se ha chocado con la pared!', 'S’ha xocat amb la paret!', 'It hit the wall!')); }
      else { hx = (hx + N) % N; hy = (hy + N) % N; }
      const eats = food && hx === food.x && hy === food.y;
      const body = eats ? snake : snake.slice(0, -1);
      if (LV.self && body.some(s => s.x === hx && s.y === hy)) return crash(L('¡Se ha mordido la cola!', 'S’ha mossegat la cua!', 'It bit its tail!'));
      snake.unshift({ x: hx, y: hy });
      if (eats) {
        eaten++; eatenEl.textContent = eaten; chime(); bump(hx, hy);
        if (k === 'hard') ms = Math.max(85, ms - 4);
        if (eaten >= LV.goal) { draw(); return win(); }
        placeFood();
      } else snake.pop();
      draw();
      timer = setTimeout(tick, ms);
    }
    let pulse = null;
    const bump = (x, y) => { pulse = { x, y, t: performance.now() }; };

    function draw() {
      g.clearRect(0, 0, size, size);
      // tablero de nieve a cuadros
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { g.fillStyle = (x + y) % 2 ? '#e8f3fb' : '#f7fbff'; g.fillRect(x * cs, y * cs, cs, cs); }
      if (LV.walls) { g.strokeStyle = '#a3122c'; g.lineWidth = 4; g.strokeRect(2, 2, size - 4, size - 4); }
      // comida
      if (food) { g.font = `${cs * .82}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(food.ico, food.x * cs + cs / 2, food.y * cs + cs / 2 + 1); }
      // cuerpo: guirnalda de bolas rojas, blancas y verdes (de la cola a la cabeza)
      for (let i = snake.length - 1; i >= 1; i--) {
        const s = snake[i], r = cs * (i === snake.length - 1 ? .32 : .42);
        g.fillStyle = ['#d3203a', '#ffffff', '#1f9a4a'][i % 3];
        g.beginPath(); g.arc(s.x * cs + cs / 2, s.y * cs + cs / 2, r, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#0002'; g.lineWidth = 1.5; g.stroke();
        g.fillStyle = '#ffffff99'; g.beginPath(); g.arc(s.x * cs + cs * .4, s.y * cs + cs * .38, r * .3, 0, Math.PI * 2); g.fill();
      }
      // cabeza verde con ojos y gorro de Papá Noel
      const h = snake[0], cx = h.x * cs + cs / 2, cy = h.y * cs + cs / 2, [dx, dy] = DIRS[dir];
      g.fillStyle = '#2fa85a'; g.beginPath(); g.arc(cx, cy, cs * .5, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#14532d'; g.lineWidth = 2; g.stroke();
      const ex = -dy, ey = dx; // perpendicular
      [-1, 1].forEach(sgn => {
        const ox = cx + dx * cs * .14 + ex * sgn * cs * .2, oy = cy + dy * cs * .14 + ey * sgn * cs * .2;
        g.fillStyle = '#fff'; g.beginPath(); g.arc(ox, oy, cs * .13, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#1b1b1b'; g.beginPath(); g.arc(ox + dx * cs * .04, oy + dy * cs * .04, cs * .065, 0, Math.PI * 2); g.fill();
      });
      // gorro (detrás de la cabeza)
      const bx = cx - dx * cs * .32, by = cy - dy * cs * .32;
      g.fillStyle = '#d3203a'; g.beginPath(); g.moveTo(bx + ex * cs * .34, by + ey * cs * .34); g.lineTo(bx - ex * cs * .34, by - ey * cs * .34); g.lineTo(bx - dx * cs * .55 + ex * cs * .2, by - dy * cs * .55 + ey * cs * .2); g.closePath(); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(bx - dx * cs * .55 + ex * cs * .2, by - dy * cs * .55 + ey * cs * .2, cs * .12, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = cs * .12; g.lineCap = 'round'; g.beginPath(); g.moveTo(bx + ex * cs * .34, by + ey * cs * .34); g.lineTo(bx - ex * cs * .34, by - ey * cs * .34); g.stroke();
      // brillo al comer
      if (pulse) { const a = (performance.now() - pulse.t) / 400; if (a < 1) { g.strokeStyle = `rgba(255,210,74,${1 - a})`; g.lineWidth = 3; g.beginPath(); g.arc(pulse.x * cs + cs / 2, pulse.y * cs + cs / 2, cs * (.5 + a), 0, Math.PI * 2); g.stroke(); requestAnimationFrame(() => over || draw()); } else pulse = null; }
    }

    async function crash(why) {
      over = true; stop(); sadTrombone(); cv.classList.add('sn-hit'); setBest(k, eaten);
      await sleep(700);
      msg.replaceChildren(el('div', { class: 'sn-end lose' }, el('b', {}, '💥 ' + why), el('span', {}, L(`Te has comido ${eaten} de ${LV.goal}.`, `T’has menjat ${eaten} de ${LV.goal}.`, `You ate ${eaten} of ${LV.goal}.`)),
        el('div', { class: 'sn-end-btns' },
          el('button', { type: 'button', class: 'btn no-delay sn-again', onclick: () => play(k) }, '🔄 ' + L('Volver a jugar', 'Tornar a jugar', 'Play again')),
          el('button', { type: 'button', class: 'btn btn-ghost no-delay', onclick: () => chooseLevel() }, '🎮 ' + L('Cambiar de nivel', 'Canviar de nivell', 'Change level')))));
    }
    async function win() {
      over = true; stop(); setBest(k, eaten); fanfare(); confetti(200); try { won?.(); } catch {}
      const time = t0 ? Date.now() - t0 : 0;
      msg.replaceChildren(el('div', { class: 'sn-end win' }, el('b', {}, '🎉 ' + L('¡Conseguido!', 'Aconseguit!', 'You did it!')),
        el('span', {}, L(`La serpiente se ha comido las ${LV.goal} cosas.`, `La serp s’ha menjat les ${LV.goal} coses.`, `The snake ate all ${LV.goal} treats.`)),
        el('div', { class: 'sn-end-btns' },
          onWin ? el('button', { type: 'button', class: 'btn no-delay sn-continue', onclick: () => onWin({ level: k, eaten, time }) }, '✨ ' + L('Continuar', 'Continuar', 'Continue')) : null,
          el('button', { type: 'button', class: 'btn btn-ghost no-delay', onclick: () => play(k) }, '🔄 ' + L('Otra vez', 'Una altra vegada', 'Again')))));
      msg.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    }
    draw();
  }

  chooseLevel();
  return { stop: () => { alive = false; stop(); } };
}
