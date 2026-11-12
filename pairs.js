// Día 25: Memory navideño. 14 parejas de cartas; al encontrar todas, la bola de nieve
// de arriba crece hasta el centro de la pantalla y se convierte en el vídeo (cobra vida, en bucle).
import { el, sleep, confetti } from './fx.js?v=17.20';
import { getLang } from './i18n.js?v=17.20';
import { pop, chime, fanfare, christmasSong, unlockAudio } from './sound.js?v=17.20';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const FACES = Array.from({ length: 14 }, (_, i) => `mem-${String(i + 1).padStart(2, '0')}.webp`);
const BACK = 'mem-reverso.webp', BOLA = 'bola25.webp', VIDEO = 'bola25.mp4';

export function render(body, ctx) {
  const info = el('p', { class: 'game-help' }, L('Toca una carta para darle la vuelta y luego otra. Si son iguales, se quedan a la vista. ¡Encuentra todas las parejas!',
    'Toca una carta per girar-la i després una altra. Si són iguals, queden a la vista. Troba totes les parelles!', 'Tap a card to turn it over, then another. If they match, they stay face up. Find all the pairs!'));
  const count = el('div', { class: 'game-stats' });
  const bola = el('img', { class: 'mm-bola', src: BOLA, alt: '' });
  const top = el('div', { class: 'mm-top' }, bola);
  const grid = el('div', { class: 'mm-grid' });
  body.append(el('h2', { class: 'q-title' }, '🎄 ' + L('Memory navideño', 'Memory nadalenc', 'Christmas memory')), info, top, count, grid);

  // ya hecho: directamente la bola que cobra vida
  if (ctx.prev) { info.textContent = L('¡Ya lo has completado! Así cobra vida la bola:', 'Ja l’has completat! Així cobra vida la bola:', 'Already done! Here is the globe coming to life:'); grid.remove(); count.remove(); comeAlive(true); return; }

  // tamaño de carta para que el tablero quepa en la pantalla (28 cartas, 3:4)
  const W = Math.max(280, body.clientWidth || innerWidth - 32), H = Math.max(300, innerHeight * .5), gap = 6;
  let best = { cols: 4, w: 40 };
  for (let cols = 4; cols <= 7; cols++) {
    const rows = Math.ceil(28 / cols), w = Math.min((W - gap * (cols - 1)) / cols, ((H - gap * (rows - 1)) / rows) * .75);
    if (w > best.w) best = { cols, w };
  }
  grid.style.setProperty('--cw', Math.floor(best.w) + 'px');
  grid.style.maxWidth = (Math.floor(best.w) * best.cols + gap * (best.cols - 1) + 2) + 'px';

  const deck = [...FACES, ...FACES].map((src, i) => ({ src, id: FACES.indexOf(src), k: i })).sort(() => Math.random() - .5);
  let open = [], busy = false, found = 0, tries = 0;
  const show = () => { count.textContent = `🎴 ${found} / 14 · ${L('intentos', 'intents', 'tries')}: ${tries}`; };
  show();
  deck.forEach(c => {
    c.el = el('button', { type: 'button', class: 'mm-card no-delay', 'aria-label': L('carta', 'carta', 'card') },
      el('span', { class: 'mm-inner' }, el('img', { class: 'mm-back', src: BACK, alt: '', draggable: 'false' }), el('img', { class: 'mm-face', src: c.src, alt: '', draggable: 'false' })));
    c.el.onclick = () => flip(c);
    grid.append(c.el);
  });

  async function flip(c) {
    if (busy || c.done || open.includes(c)) return;
    unlockAudio(); pop();
    c.el.classList.add('up'); open.push(c);
    if (open.length < 2) return;
    tries++; busy = true;
    const [a, b] = open;
    if (a.id === b.id) {
      await sleep(420); a.done = b.done = true; a.el.classList.add('match'); b.el.classList.add('match'); chime();
      found++; open = []; busy = false; show();
      if (found === 14) finish();
    } else {
      await sleep(950); a.el.classList.remove('up'); b.el.classList.remove('up'); open = []; busy = false; show();
    }
  }

  async function finish() {
    fanfare(); confetti(220);
    info.textContent = L('¡Todas las parejas! Mira la bola… 🎄', 'Totes les parelles! Mira la bola… 🎄', 'All the pairs! Look at the globe… 🎄');
    ctx.submit({ answer: `14/14 (${tries})`, status: 'correct' });
    await sleep(1200);
    grid.classList.add('gone');
    comeAlive(false);
  }

  // la bola crece poco a poco hasta el centro y se convierte en el vídeo
  function comeAlive(quick) {
    let music = null; try { unlockAudio(); music = christmasSong(); } catch {}
    const r = bola.getBoundingClientRect();
    const stage = el('div', { class: 'mm-stage' });
    const big = el('img', { class: 'mm-big', src: BOLA, alt: '' });
    const video = el('video', { class: 'mm-video', src: VIDEO, muted: true, loop: true, playsinline: true, preload: 'auto' });
    video.muted = true; video.setAttribute('playsinline', ''); video.setAttribute('webkit-playsinline', '');
    const close = el('button', { class: 'btn btn-big no-delay mm-close' }, '✨ ' + L('¡Feliz Navidad!', 'Bon Nadal!', 'Merry Christmas!'));
    const box = el('div', { class: 'mm-box' }, video, big);
    stage.append(box, close); document.body.append(stage);
    bola.style.visibility = 'hidden';
    // del sitio pequeño al centro de la pantalla
    const b2 = box.getBoundingClientRect();
    const dx = r.left + r.width / 2 - (b2.left + b2.width / 2), dy = r.top + r.height / 2 - (b2.top + b2.height / 2), s = Math.max(.05, r.width / b2.width);
    box.animate([{ transform: `translate(${dx}px,${dy}px) scale(${s})` }, { transform: 'none' }], { duration: quick ? 900 : 2600, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'both' });
    stage.animate([{ backgroundColor: 'rgba(20,6,12,0)' }, { backgroundColor: 'rgba(20,6,12,.82)' }], { duration: 1200, fill: 'both' });
    setTimeout(() => {
      video.play().catch(() => {});
      const go = () => { big.classList.add('fade'); stage.classList.add('alive'); };
      if (video.readyState >= 2) go(); else { video.addEventListener('playing', go, { once: true }); setTimeout(go, 2500); }
    }, quick ? 900 : 2700);
    setTimeout(() => close.classList.add('show'), quick ? 1500 : 4200);
    close.onclick = () => {
      try { music?.stop(2); } catch {}
      stage.classList.add('out'); setTimeout(() => { stage.remove(); bola.style.visibility = ''; }, 500);
    };
    ctx.cleanup = () => { try { music?.stop(1); video.pause(); stage.remove(); } catch {} };
    const fin = ctx.finishBtn.onclick;
    ctx.finishBtn.onclick = () => { ctx.cleanup(); fin(); };
  }
}
