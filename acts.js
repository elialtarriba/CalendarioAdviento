// Actividades especiales (interactivas) de algunos días
//  · Día 23: tres regalos que no se compran, debajo de un árbol con luces → eliges a quién se los das
//  · Día 24: el regalo que Papá Noel ha dejado para ti → lazo, luz, bolas con regalos imaginarios
import { el, sleep, confetti, popup, toast } from './fx.js?v=17.6';
import { getLang } from './i18n.js?v=17.6';
import { chime, pop, jingle, hohoho } from './sound.js?v=17.6';
import { S } from './app.js?v=17.6';
import { store } from './store.js?v=17.6';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const img = (src, cls = '') => el('img', { src, class: 'ilu ' + cls, alt: '', draggable: 'false' });
// adorno redondo dorado con un dibujo del calendario dentro
const orn = (src, cls = '') => el('span', { class: 'orn ' + cls }, el('i', { class: 'orn-cap' }), el('span', { class: 'orn-ball' }, img(src)));

export function special(n, key) {
  if (n === 23) return box => gifts23(box, key);
  if (n === 24) return box => present24(box);
  return null;
}

// ================================================================ DÍA 23
const NAMES = {
  act1: ['Yaya', 'Julio Padre', 'Julio Hijo', 'Marian', 'Lorena', 'Santi', 'Txell', 'Agustí', 'Raimon Padre', 'Raimon Hijo', 'Yan', 'Pruna', 'Elisabeth'],
  act2: ['Raimon Padre', 'Raimon Hijo', 'Yan', 'Pruna', 'Elisabeth Mamá'],
};
// Dibujos al estilo del calendario (recortados de la imagen del calendario)
const TREE = 'ilu-5.webp';
const GIFT_PICS = ['ilu-gr.webp', 'ilu-gl.webp', 'ilu-4.webp'];
const HUG = 'ilu-9.webp', THANKS = 'ilu-14.webp', KITCHEN = 'ilu-18.webp';

function gifts23(box, key) {
  return new Promise(resolve => {
    const names = NAMES[key] || NAMES.act1;
    const G = [
      { id: 'hug', pic: HUG, title: L('Un abrazo de esos en los que nadie tiene prisa', 'Una abraçada d’aquelles en què ningú no té pressa', 'One of those hugs where nobody is in a hurry') },
      { id: 'thanks', pic: THANKS, title: L('Un «gracias» que llevas tiempo pensando', 'Un «gràcies» que fa temps que penses', 'A “thank you” you have been meaning to say for a while') },
      { id: 'kitchen', pic: KITCHEN, title: L('¡Un «recojo yo la cocina»!', 'Un «ja recullo jo la cuina»!', 'An “I’ll tidy the kitchen”!') },
    ];
    const chosen = { ...(S.profile?.gifts23?.[key] || {}) };
    let next = G.findIndex(g => !chosen[g.id]); if (next < 0) next = 3;
    const intro = el('div', { class: 'g23-intro' },
      el('p', { class: 'g23-big' }, L('Esta noche puedes regalar algo que no se compra. ', 'Aquesta nit pots regalar una cosa que no es compra. ', 'Tonight you can give something money can’t buy. '), el('b', {}, L('¿A quién se lo darías?', 'A qui l’hi donaries?', 'Who would you give it to?'))),
      el('p', {}, L('Debajo del árbol hay tres regalos. Ábrelos de uno en uno: toca el primero, mira qué es y elige a la persona a quien se lo quieres regalar. Después, el segundo, y por último, el tercero.',
        'Sota l’arbre hi ha tres regals. Obre’ls d’un en un: toca el primer, mira què és i tria la persona a qui li vols regalar. Després el segon i, finalment, el tercer.',
        'There are three presents under the tree. Open them one at a time: tap the first, see what it is and choose who you want to give it to. Then the second, and finally the third.')));
    const tree = el('div', { class: 'g23-tree' }, img(TREE), el('div', { class: 'g23-twinkle' }, ...Array.from({ length: 12 }, (_, i) => { const d = el('i'); d.style.cssText = `left:${22 + (i * 37) % 56}%;top:${18 + (i * 23) % 64}%;animation-delay:${(i % 5) * .35}s`; return d; })));
    const row = el('div', { class: 'g23-gifts' });
    const status = el('p', { class: 'g23-status' });
    const scene = el('div', { class: 'g23-scene' }, el('div', { class: 'g23-glow' }), tree, row);
    box.append(intro, scene, status);
    const draw = () => {
      row.replaceChildren(...G.map((g, i) => {
        const state = chosen[g.id] ? 'done' : i === next ? 'next' : 'wait';
        const btn = el('button', { class: `g23-gift no-delay ${state}`, onclick: () => open(i) }, img(GIFT_PICS[i]),
          state === 'done' ? el('span', { class: 'g23-tag' }, '🎀 ' + chosen[g.id]) : el('span', { class: 'g23-num' }, i + 1));
        return btn;
      }));
      status.textContent = next < 3 ? L(`Toca el regalo número ${next + 1}`, `Toca el regal número ${next + 1}`, `Tap present number ${next + 1}`) : '';
    };
    const open = async i => {
      if (chosen[G[i].id]) return;
      if (i !== next) return toast(L(`Primero abre el regalo número ${next + 1} 🎁`, `Primer obre el regal número ${next + 1} 🎁`, `Open present number ${next + 1} first 🎁`));
      pop(); chime();
      const g = G[i];
      const other = el('input', { type: 'text', placeholder: L('Otra persona…', 'Una altra persona…', 'Someone else…') });
      let pick = null;
      const card = el('div', { class: 'g23-card' },
        el('div', { class: 'g23-kicker' }, L(`Regalo ${i + 1}`, `Regal ${i + 1}`, `Present ${i + 1}`)),
        img(g.pic, 'g23-pic'), el('h2', {}, g.title),
        el('p', { class: 'muted' }, L('¿A quién se lo regalas? Toca un nombre:', 'A qui el regales? Toca un nom:', 'Who do you give it to? Tap a name:')),
        el('div', { class: 'g23-names' }, ...names.map(nm => el('button', { type: 'button', class: 'g23-name no-delay', onclick: () => { pick = nm; close.click(); } }, nm))),
        el('div', { class: 'g23-other' }, other, el('button', { type: 'button', class: 'btn small-btn no-delay g23-ok', onclick: () => { pick = pick || other.value.trim(); if (pick) close.click(); else toast(L('Elige un nombre o escríbelo', 'Tria un nom o escriu-lo', 'Choose or type a name')); } }, L('Elegir', 'Triar', 'Choose'))));
      let close;
      const p = popup(card, { cls: 'small g23-pop', buttons: [{ label: L('Cerrar', 'Tancar', 'Close'), value: false, cls: 'btn-ghost' }] });
      close = document.querySelector('.g23-pop .popup-btns .btn');
      await p;
      if (!pick) return;
      chosen[g.id] = pick; next = G.findIndex(x => !chosen[x.id]); if (next < 0) next = 3;
      confetti(80); chime();
      const g23 = { ...(S.profile.gifts23 || {}), [key]: { ...chosen } };
      S.profile.gifts23 = g23; store.saveProfile(S.user.uid, { gifts23: g23 }).catch(() => {});
      draw();
      if (next === 3) {
        status.replaceChildren(el('b', {}, L('¡Qué regalos tan bonitos! 💝 Ahora solo falta darlos de verdad.', 'Quins regals més bonics! 💝 Ara només falta donar-los de veritat.', 'What lovely gifts! 💝 Now you just need to give them for real.')));
        resolve();
      }
    };
    draw();
    if (next === 3) resolve();
  });
}

// ================================================================ DÍA 24
const PRESENT = 'ilu-gr.webp';
const BALL_PICS = ['ilu-3.webp', 'ilu-11.webp', 'ilu-12.webp', 'ilu-15.webp', 'ilu-19.webp', 'ilu-23.webp', 'ilu-2.webp', 'ilu-5.webp', 'ilu-21.webp', 'ilu-20.webp'];
const GIFTS24 = () => [
  [L('Paciencia infinita', 'Paciència infinita', 'Infinite patience'), L('«No incluye instrucciones para montarla».', '«No inclou instruccions per muntar-la».', '“Assembly instructions not included.”')],
  [L('Una siesta sin interrupciones', 'Una migdiada sense interrupcions', 'A nap with no interruptions'), L('«El regalo más solicitado por los adultos».', '«El regal més sol·licitat pels adults».', '“The most requested gift among grown-ups.”')],
  [L('Un detector de tuppers', 'Un detector de carmanyoles', 'A Tupperware detector'), L('«Para recuperar los que se quedaron en otras casas».', '«Per recuperar les que es van quedar en altres cases».', '“To get back the ones left at other people’s houses.”')],
  [L('Un día sin prisas', 'Un dia sense presses', 'A day with no rush'), L('«Úsalo antes de que alguien te pida un favor».', '«Fes-lo servir abans que algú et demani un favor».', '“Use it before someone asks you a favour.”')],
  [L('🌙 Una noche en modo «no estoy para nadie»', '🌙 Una nit en mode «no hi soc per a ningú»', '🌙 A night in “not available to anyone” mode'), L('«Desde las 20:00 hasta mañana, nadie te pide nada, nadie te llama y nadie aparece con un “oye, una cosita…”. A descansar, que ya te toca».', '«Des de les 20:00 fins demà, ningú no et demana res, ningú no et truca i ningú no apareix amb un “escolta, una coseta…”. A descansar, que ja et toca».', '“From 8 pm until tomorrow, nobody asks you for anything, nobody calls and nobody turns up with a ‘hey, just one little thing…’. Time to rest — you’ve earned it.”')],
  [L('Un aplauso cada vez que terminas una tarea', 'Un aplaudiment cada vegada que acabes una tasca', 'A round of applause every time you finish a chore'), L('«Hacer la cama y ordenar tu habitación, por ejemplo».', '«Fer el llit i endreçar la teva habitació, per exemple».', '“Making your bed and tidying your room, for example.”')],
  [L('Un pase para saltarte la cola del baño', 'Un passi per saltar-te la cua del lavabo', 'A pass to skip the bathroom queue'), L('«Especialmente valioso después de la comida de Navidad».', '«Especialment valuós després del dinar de Nadal».', '“Especially valuable after Christmas lunch.”')],
  [L('Un cargador de ilusión', 'Un carregador d’il·lusió', 'A hope charger'), L('«Compatible con días un poco grises».', '«Compatible amb dies una mica grisos».', '“Compatible with slightly grey days.”')],
  [L('Un vale para cambiar de opinión', 'Un val per canviar d’opinió', 'A voucher to change your mind'), L('«Sin dar una explicación de veinte minutos».', '«Sense donar una explicació de vint minuts».', '“Without a twenty-minute explanation.”')],
  [L('Una caja de carcajadas', 'Una capsa de rialles', 'A box of belly laughs'), L('«Abrir en caso de lunes».', '«Obrir en cas de dilluns».', '“Open in case of Monday.”')],
];

function present24(box) {
  return new Promise(resolve => {
    const head = el('h2', { class: 'p24-title' }, '🎁 ' + L('El regalo que Papá Noel ha dejado para ti', 'El regal que el Pare Noel ha deixat per a tu', 'The present Santa has left for you'));
    const hint = el('p', { class: 'p24-hint' }, L('«Hay un paquete con tu nombre…» Toca el lazo 5 veces para abrirlo.', '«Hi ha un paquet amb el teu nom…» Toca el llaç 5 vegades per obrir-lo.', '“There’s a parcel with your name on it…” Tap the bow 5 times to open it.'));
    const dots = el('div', { class: 'p24-dots' }, ...Array.from({ length: 5 }, () => el('i')));
    const pres = el('div', { class: 'p24-present' }, img(PRESENT, 'p-body'), img(PRESENT, 'p-lid'), el('div', { class: 'p-shine' }));
    const light = el('div', { class: 'p24-light' });
    const balls = el('div', { class: 'p24-balls' });
    const bokeh = el('div', { class: 'p24-bokeh' }, ...Array.from({ length: 18 }, (_, i) => { const b = el('i'); b.style.cssText = `left:${(i * 53) % 100}%;top:${(i * 37) % 100}%;animation-delay:${(i % 6) * .4}s;width:${8 + (i % 4) * 5}px;height:${8 + (i % 4) * 5}px`; return b; }));
    const stage = el('div', { class: 'p24-stage' }, bokeh, light, balls, pres);
    const foot = el('div', { class: 'p24-foot' });
    box.append(head, hint, dots, stage, foot);
    setTimeout(() => stage.scrollIntoView?.({ behavior: 'smooth', block: 'center' }), 900);
    let taps = 0, opened = false;
    pres.addEventListener('click', async () => {
      if (opened) return;
      taps++; pop(); dots.children[taps - 1]?.classList.add('on');
      pres.classList.remove('wiggle'); void pres.offsetWidth; pres.classList.add('wiggle');
      pres.style.setProperty('--loose', taps / 5);
      burst(stage, 8 + taps * 3);
      if (taps < 5) return;
      opened = true; hint.textContent = '✨';
      jingle(1);
      pres.classList.add('untie');         // el lazo se deshace a cámara lenta (brilla y se suelta)
      for (let k = 0; k < 4; k++) { burst(stage, 14); await sleep(560); }
      pres.classList.add('open');          // se levanta la tapa
      await sleep(900);
      light.classList.add('on'); chime();  // luz celestial
      await sleep(1200);
      const G = GIFTS24(); let seen = 0;
      hint.textContent = L('Toca cada bola para descubrir el regalo', 'Toca cada bola per descobrir el regal', 'Tap each bauble to discover the gift');
      G.forEach(([title, txt], i) => {
        const b = el('button', { class: 'p24-ball no-delay', style: `--i:${i};animation-delay:${i * .28}s` }, orn(BALL_PICS[i]), el('span', { class: 'p24-n' }, i + 1));
        b.onclick = async () => {
          pop();
          b.classList.add('seen');
          await popup(el('div', { class: 'p24-card' }, orn(BALL_PICS[i], 'p24-card-ball'), el('h2', {}, title), el('p', { class: 'p24-quote' }, txt)),
            { cls: 'small p24-pop', buttons: [{ label: L('¡Qué bien!', 'Que bé!', 'Lovely!'), value: true }] });
          if (!b.dataset.counted) { b.dataset.counted = '1'; seen++; }
          if (seen === G.length && !foot.childElementCount) {
            confetti(260); hohoho();
            foot.append(el('button', { class: 'btn btn-big no-delay p24-keep', onclick: () => resolve('keep') }, '🎁 ' + L('Me lo quedo. No acepto cambios.', 'M’ho quedo. No accepto canvis.', 'I’m keeping it. No exchanges.')));
            foot.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
          }
        };
        balls.append(b);
      });
    });
  });
}

// destellos dorados que salen del lazo
function burst(stage, n = 12) {
  const r = stage.getBoundingClientRect(), p = stage.querySelector('.p24-present')?.getBoundingClientRect();
  if (!p) return;
  const cx = p.left - r.left + p.width / 2, cy = p.top - r.top + p.height * .2;
  for (let i = 0; i < n; i++) {
    const s = el('i', { class: 'p24-spark' }); const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 90;
    s.style.cssText = `left:${cx}px;top:${cy}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 30}px;animation-delay:${Math.random() * .15}s`;
    stage.append(s); setTimeout(() => s.remove(), 1300);
  }
}
