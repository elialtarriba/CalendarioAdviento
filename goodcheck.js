// Día 13: la ruleta de superpoderes de Navidad. En la pantalla negra pasan los poderes rápido,
// van frenando y a los 4 segundos sale el tuyo con sonido y chispas.
import { getLang } from './i18n.js?v=17.19';
import { el, sleep, confetti } from './fx.js?v=17.19';
import { machine, chime, pop } from './sound.js?v=17.19';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const POWERS = () => [
  ['🍫', L('Hacer desaparecer los turrones', 'Fer desaparèixer els torrons', 'Making the nougat disappear'), L('Nadie te ha visto. Pero ya no quedan.', 'Ningú t’ha vist. Però ja no en queden.', 'Nobody saw you. But there’s none left.')],
  ['😂', L('Contagiar la risa', 'Contagiar el riure', 'Spreading laughter'), L('Empiezas tú y acaba riendo toda la mesa.', 'Comences tu i acaba rient tota la taula.', 'You start and the whole table ends up laughing.')],
  ['🎁', L('Detectar regalos', 'Detectar regals', 'Present detector'), L('Sabes cuál es el tuyo antes de leer la etiqueta.', 'Saps quin és el teu abans de llegir l’etiqueta.', 'You know which one is yours before reading the tag.')],
  ['🛋️', L('Dormirte en el sofá', 'Adormir-te al sofà', 'Falling asleep on the sofa'), L('Con conversaciones, villancicos y quince personas alrededor.', 'Amb converses, nadales i quinze persones al voltant.', 'With chatter, carols and fifteen people around you.')],
  ['🍽️', L('Encontrar sitio para el postre', 'Trobar lloc per a les postres', 'Finding room for dessert'), L('Aunque hace un minuto no podías más.', 'Encara que fa un minut no podies més.', 'Even though a minute ago you were stuffed.')],
  ['🐾', L('Atraer a todos los animales', 'Atreure tots els animals', 'Attracting every animal'), L('Te sientas un momento y ya tienes uno encima.', 'Seus un moment i ja en tens un a sobre.', 'You sit down for a second and one is already on you.')],
  ['🕵️', L('Abrir envoltorios sin dejar rastro', 'Obrir embolcalls sense deixar rastre', 'Opening wrapping without a trace'), L('Solo estabas «mirando».', 'Només estaves «mirant».', 'You were only “looking”.')],
  ['🎶', L('Inventarte los villancicos', 'Inventar-te les nadales', 'Making up the carols'), L('No te sabes la letra, pero lo das todo.', 'No et saps la lletra, però ho dones tot.', 'You don’t know the words, but you give it everything.')],
];

export function render(body, ctx) {
  const P = POWERS();
  const screen = el('div', { class: 'sp-screen' }, el('div', { class: 'sp-line' }, '✨ ? ✨'));
  const btn = el('button', { class: 'btn good-btn no-delay' }, L('¡Descúbrelo!', 'Descobreix-lo!', 'Find out!'));
  const wrap = el('div', { class: 'good-check' }, el('h2', { class: 'good-title' }, '✨ ' + L('¿Cuál es tu superpoder de Navidad?', 'Quin és el teu superpoder de Nadal?', 'What is your Christmas superpower?')), screen, btn);
  body.append(wrap);
  let last = -1, busy = false;
  const line = (p, cls = '') => el('div', { class: 'sp-line ' + cls }, el('span', { class: 'sp-emo' }, p[0]), el('b', {}, p[1]));
  btn.onclick = async () => {
    if (busy) return; busy = true; btn.disabled = true;
    machine(4);
    let pick; do { pick = Math.floor(Math.random() * P.length); } while (pick === last && P.length > 1); last = pick;
    // pasan rápido y van frenando (4 segundos)
    const t0 = performance.now(); let i = Math.floor(Math.random() * P.length), wait = 50;
    while (performance.now() - t0 < 3600) {
      screen.replaceChildren(line(P[i % P.length], 'blur')); pop();
      await sleep(wait); wait = Math.min(420, wait * 1.13); i++;
    }
    const p = P[pick];
    screen.replaceChildren(el('div', { class: 'sp-result' }, el('div', { class: 'sp-big' }, p[0]), el('b', {}, p[1]), el('p', {}, p[2])));
    screen.classList.remove('flash'); void screen.offsetWidth; screen.classList.add('flash');
    sparks(screen); chime(); confetti(120);
    if (!ctx.prev) ctx.submit({ answer: p[0] + ' ' + p[1], status: 'correct' });
    btn.textContent = L('¿Tengo otro?', 'En tinc un altre?', 'Do I have another?');
    btn.disabled = false; busy = false;
  };
}

function sparks(box) {
  for (let i = 0; i < 26; i++) {
    const s = el('i', { class: 'sp-spark' }); const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 120;
    s.style.cssText = `--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;animation-delay:${Math.random() * .2}s`;
    box.append(s); setTimeout(() => s.remove(), 1400);
  }
}
