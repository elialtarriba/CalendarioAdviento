// Actividades especiales (interactivas) de algunos días
//  · Día 23: tres regalos que no se compran, debajo de un árbol con luces → eliges a quién se los das
//  · Día 24: el regalo que Papá Noel ha dejado para ti → lazo, luz, bolas con regalos imaginarios
import { el, sleep, confetti, popup, toast } from './fx.js?v=17.19';
import { getLang } from './i18n.js?v=17.19';
import { chime, pop, jingle, hohoho, christmasSong, unlockAudio } from './sound.js?v=17.19';
import { S } from './app.js?v=17.19';
import { store } from './store.js?v=17.19';

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
  act2: ['Raimon Padre', 'Raimon Hijo', 'Yan', 'Pruna', 'Elisabeth Mamá', 'Marc'],
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
        status.replaceChildren(el('b', {}, L('¡Qué regalos tan bonitos! 💝 Ahora solo falta darlos de verdad.', 'Quins regals més bonics! 💝 Ara només falta donar-los de veritat.', 'What lovely gifts! 💝 Now you just need to give them for real.')), shareBtn());
        resolve();
      }
    };
    const shareBtn = () => el('button', { type: 'button', class: 'btn btn-big no-delay g23-share', onclick: () => shareGifts(G, chosen) }, '📲 ' + L('Enviar al grupo', 'Enviar al grup', 'Send to the group'));
    draw();
    if (next === 3) { status.replaceChildren(shareBtn()); resolve(); }
  });
}

// ---- la foto bonita con los regalos y los nombres, para enviar por WhatsApp
const SHORT23 = () => ({ hug: ['🤗', L('Un abrazo sin prisas', 'Una abraçada sense presses', 'A hug with no rush')],
  thanks: ['💌', L('Un «gracias» pendiente', 'Un «gràcies» pendent', 'A long-due “thank you”')], kitchen: ['🍽️', L('«Recojo yo la cocina»', '«Ja recullo jo la cuina»', '“I’ll tidy the kitchen”')] });
async function giftsImage(G, chosen) {
  const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  try { await Promise.all(['700 80px "Mountains of Christmas"', '700 36px Montserrat', '800 40px Montserrat'].map(f => document.fonts.load(f))); } catch {}
  const [tree, ...gifts] = await Promise.all([TREE, ...GIFT_PICS].map(src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; })));
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0b1a3a'); bg.addColorStop(.55, '#24407a'); bg.addColorStop(1, '#3a2030');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) { g.globalAlpha = .3 + (i % 5) * .12; g.fillStyle = '#fff'; g.beginPath(); g.arc((i * 137.5) % W, (i * 71.3) % 740, 1.5 + (i % 3), 0, 7); g.fill(); } g.globalAlpha = 1;
  const glow = g.createRadialGradient(W / 2, 470, 20, W / 2, 470, 420); glow.addColorStop(0, 'rgba(255,214,120,.45)'); glow.addColorStop(1, 'rgba(255,214,120,0)'); g.fillStyle = glow; g.fillRect(0, 0, W, H);
  // marco dorado
  g.strokeStyle = '#d4a017'; g.lineWidth = 10; g.strokeRect(22, 22, W - 44, H - 44); g.strokeStyle = 'rgba(255,240,180,.6)'; g.lineWidth = 2; g.strokeRect(38, 38, W - 76, H - 76);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const gold = y => { const q = g.createLinearGradient(0, y - 40, 0, y + 40); q.addColorStop(0, '#fff6c2'); q.addColorStop(.5, '#f2c14e'); q.addColorStop(1, '#b8860b'); return q; };
  g.font = '700 74px "Mountains of Christmas", cursive'; g.fillStyle = gold(105); g.shadowColor = '#000a'; g.shadowBlur = 12;
  g.fillText(L('Regalos que no se compran', 'Regals que no es compren', 'Gifts money can’t buy'), W / 2, 105); g.shadowBlur = 0;
  if (tree) { const h = 520, w = h * tree.width / tree.height; g.drawImage(tree, W / 2 - w / 2, 170, w, h); }
  const S = SHORT23(), cw = 316, gap = 26, x0 = (W - 3 * cw - 2 * gap) / 2, y0 = 720, ch = 520;
  G.forEach((it, k) => {
    const x = x0 + k * (cw + gap);
    g.fillStyle = '#fff8ec'; g.strokeStyle = '#d4a017'; g.lineWidth = 5;
    g.beginPath(); g.roundRect ? g.roundRect(x, y0, cw, ch, 26) : g.rect(x, y0, cw, ch); g.fill(); g.stroke();
    const im = gifts[k]; if (im) { const h = 190, w = Math.min(cw - 60, h * im.width / im.height); const hh = w * im.height / im.width; g.drawImage(im, x + cw / 2 - w / 2, y0 + 24 + (h - hh) / 2, w, hh); }
    const [emo, title] = S[it.id];
    g.fillStyle = '#7a1020'; g.font = '800 33px Montserrat, sans-serif';
    const words = (emo + ' ' + title).split(' '); const lines = []; let line = '';
    words.forEach(wd => { const tl = line ? line + ' ' + wd : wd; if (g.measureText(tl).width > cw - 36) { lines.push(line); line = wd; } else line = tl; }); lines.push(line);
    lines.slice(0, 3).forEach((ln, j) => g.fillText(ln, x + cw / 2, y0 + 262 + j * 42));
    g.fillStyle = '#9a7a3a'; g.font = '600 28px Montserrat, sans-serif'; g.fillText(L('para', 'per a', 'for'), x + cw / 2, y0 + 400);
    g.fillStyle = '#b3122e'; g.font = '700 50px "Mountains of Christmas", cursive';
    let nm = chosen[it.id] || '—'; while (g.measureText(nm).width > cw - 30 && nm.length > 3) nm = nm.slice(0, -2) + '…';
    g.fillText(nm, x + cw / 2, y0 + 455);
  });
  g.fillStyle = '#fff3d0'; g.font = '600 30px Montserrat, sans-serif';
  g.fillText(`🎄 ${L('Calendario de Adviento · Día 23', 'Calendari d’Advent · Dia 23', 'Advent Calendar · Day 23')}${S_name() ? ' · ' + S_name() : ''} 🎄`, W / 2, H - 70);
  return await new Promise(r => cv.toBlob(r, 'image/png'));
}
const S_name = () => (S.profile?.name || '').trim();
async function shareGifts(G, chosen) {
  const S3 = SHORT23();
  const text = '🎁 ' + L('Esta noche regalo algo que no se compra:', 'Aquesta nit regalo una cosa que no es compra:', 'Tonight I’m giving something money can’t buy:') + '\n' +
    G.map(it => `${S3[it.id][0]} ${S3[it.id][1]} → ${chosen[it.id]}`).join('\n') + (S_name() ? `\n— ${S_name()}` : '');
  toast('✨ ' + L('Preparando la foto…', 'Preparant la foto…', 'Preparing the picture…'), 1500);
  const blob = await giftsImage(G, chosen).catch(() => null);
  const file = blob ? new File([blob], 'regalos-navidad.png', { type: 'image/png' }) : null;
  const url = blob ? URL.createObjectURL(blob) : null;
  const canFiles = !!(file && navigator.canShare && navigator.canShare({ files: [file] }));
  const send = el('button', { type: 'button', class: 'btn btn-big no-delay', onclick: async () => {
    try {
      if (canFiles) { await navigator.share({ files: [file], text }); return; }
    } catch (e) { if (e?.name === 'AbortError') return; }
    // si el móvil no deja compartir la foto: se guarda la foto y se abre WhatsApp con el texto
    if (url) { const a = el('a', { href: url, download: 'regalos-navidad.png' }); document.body.append(a); a.click(); a.remove(); }
    location.href = 'whatsapp://send?text=' + encodeURIComponent(text);
  } }, '📲 ' + L('Enviar por WhatsApp', 'Enviar per WhatsApp', 'Send by WhatsApp'));
  await popup(el('div', { class: 'g23-sharebox' },
    el('h2', {}, L('Tu foto para el grupo', 'La teva foto per al grup', 'Your picture for the group')),
    url ? el('img', { class: 'g23-shareimg', src: url, alt: '' }) : el('p', {}, '⚠️'),
    el('p', { class: 'muted' }, canFiles ? L('Pulsa el botón y elige WhatsApp y el grupo.', 'Prem el botó i tria WhatsApp i el grup.', 'Tap the button and choose WhatsApp and the group.')
      : L('Se guardará la foto y se abrirá WhatsApp.', 'Es guardarà la foto i s’obrirà WhatsApp.', 'The picture will be saved and WhatsApp will open.')), send),
    { cls: 'small g23-sharepop', buttons: [{ label: L('Cerrar', 'Tancar', 'Close'), value: false, cls: 'btn-ghost' }] });
  if (url) setTimeout(() => URL.revokeObjectURL(url), 60000);
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

// Día 24 en «película»: la cámara filma la caja de lado; con 5 toques al lazo se destapa,
// la cámara mira por la boca de la caja, sube una luz celestial del fondo y de ella salen
// las bolas. Al tocar una bola sale un destello que se va volando a lo lejos.
const easeIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const loadImg = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });

function present24(box) {
  return new Promise(resolve => {
    const head = el('h2', { class: 'p24-title' }, '🎁 ' + L('El regalo que Papá Noel ha dejado para ti', 'El regal que el Pare Noel ha deixat per a tu', 'The present Santa has left for you'));
    const teaser = el('div', { class: 'p24-teaser' }, img(PRESENT));
    const go = el('button', { class: 'btn btn-big no-delay p24-go' }, '🎬 ' + L('Abrir mi regalo', 'Obrir el meu regal', 'Open my present'));
    const foot = el('div', { class: 'p24-foot' });
    box.append(head, el('p', { class: 'p24-hint' }, L('«Hay un paquete con tu nombre…»', '«Hi ha un paquet amb el teu nom…»', '“There’s a parcel with your name on it…”')), teaser, el('div', { class: 'p24-foot' }, go), foot);
    let finished = false;
    const start = () => cinema().then(done => {
      if (!done) return;
      if (done === 'keep') return resolve('keep');
      finished = true; go.remove(); teaser.classList.add('opened');
      foot.replaceChildren(el('button', { class: 'btn btn-big no-delay p24-keep', onclick: () => resolve('keep') }, '🎁 ' + L('Me lo quedo. No acepto cambios.', 'M’ho quedo. No accepto canvis.', 'I’m keeping it. No exchanges.')));
    });
    go.onclick = start; teaser.onclick = () => { if (!finished) start(); };
  });
}

function cinema() {
  return new Promise(async resolveCine => {
    const cv = el('canvas', { class: 'cine-cv' });
    const hint = el('div', { class: 'cine-hint' }, '👆 ' + L('Toca el lazo 5 veces para abrirlo', 'Toca el llaç 5 vegades per obrir-lo', 'Tap the bow 5 times to open it'));
    const dots = el('div', { class: 'p24-dots cine-dots' }, ...Array.from({ length: 5 }, () => el('i')));
    const balls = el('div', { class: 'cine-balls' });
    const close = el('button', { class: 'cine-x no-delay', 'aria-label': 'cerrar' }, '✕');
    const keep = el('button', { class: 'btn btn-big no-delay cine-keep' }, '🎁 ' + L('Me lo quedo. No acepto cambios.', 'M’ho quedo. No accepto canvis.', 'I’m keeping it. No exchanges.'));
    const wrap = el('div', { class: 'cine-wrap' }, cv, el('div', { class: 'cine-bar top' }), el('div', { class: 'cine-bar bot' }), el('div', { class: 'cine-rec' }, el('i'), 'REC'), balls, dots, hint, keep, close);
    document.body.append(wrap);
    const g = cv.getContext('2d');
    let W, H, dpr;
    const size = () => { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; };
    size(); addEventListener('resize', size);
    const [gift, paper, ribbon] = await Promise.all([loadImg(PRESENT), loadImg('ilu-papel.webp'), loadImg('ilu-cinta.webp')]);
    const paperPat = paper ? g.createPattern(paper, 'repeat') : '#9c1024';
    let phase = 'film', phaseAt = performance.now(), taps = 0, loose = 0, lidK = 0, light = 0, raf, ended = false;
    const t0 = performance.now();
    const go = p => { phase = p; phaseAt = performance.now(); };
    const sparks = [];
    const bokeh = Array.from({ length: 22 }, (_, i) => ({ x: (i * 97.3 % 100) / 100, y: (i * 61.7 % 100) / 100, r: 10 + (i % 5) * 9, p: i }));
    const motes = Array.from({ length: 70 }, () => ({ a: Math.random() * 7, d: Math.random(), s: .2 + Math.random() * .8 }));

    // caja de lado: dónde está (en pantalla) según la cámara
    const giftRect = (z = 1, ox = 0, oy = 0) => {
      const ar = gift ? gift.width / gift.height : 1.1, h = Math.min(H * .4, W * .86 / ar) * z, w = h * ar;
      return { x: W / 2 - w / 2 + ox, y: H * .58 - h / 2 + oy, w, h };
    };
    const drawSide = (t, alpha, z, ox, oy) => {
      if (!gift) return;
      const r = giftRect(z, ox, oy);
      g.save(); g.globalAlpha = alpha;
      // sombra en el suelo
      const sh = g.createRadialGradient(r.x + r.w / 2, r.y + r.h * .98, 2, r.x + r.w / 2, r.y + r.h * .98, r.w * .6);
      sh.addColorStop(0, 'rgba(0,0,0,.55)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.fillRect(r.x - r.w * .3, r.y + r.h * .8, r.w * 1.6, r.h * .4);
      // línea donde acaba la tapa (sigue la esquina de la caja)
      const LID = [[0, .47], [.5, .555], [1, .455]], cut = .55;
      const lidPath = (above, dx = 0, dy = 0) => { g.beginPath(); const P = LID.map(([u, v]) => [r.x + u * r.w + dx, r.y + v * r.h + dy]);
        if (above) { g.moveTo(r.x - r.w + dx, r.y - r.h * 2); g.lineTo(r.x + r.w * 2 + dx, r.y - r.h * 2); g.lineTo(r.x + r.w * 2 + dx, P[2][1]); P.slice().reverse().forEach(p => g.lineTo(...p)); g.lineTo(r.x - r.w + dx, P[0][1]); }
        else { g.moveTo(r.x - r.w, P[0][1]); P.forEach(p => g.lineTo(...p)); g.lineTo(r.x + r.w * 2, P[2][1]); g.lineTo(r.x + r.w * 2, r.y + r.h * 2); g.lineTo(r.x - r.w, r.y + r.h * 2); }
        g.closePath(); };
      // caja (parte de abajo)
      g.save(); lidPath(false); g.clip(); g.drawImage(gift, r.x, r.y, r.w, r.h); g.restore();
      // luz que se escapa por la rendija
      const gap = loose * 10 + lidK * r.h * .9;
      if (loose > 0 || lidK > 0) {
        const gl = g.createRadialGradient(r.x + r.w / 2, r.y + r.h * cut, 2, r.x + r.w / 2, r.y + r.h * cut, r.w * (.4 + loose * .3 + lidK));
        gl.addColorStop(0, `rgba(255,248,214,${.5 + .5 * Math.max(loose, lidK)})`); gl.addColorStop(1, 'rgba(255,214,120,0)');
        g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gl; g.fillRect(r.x - r.w, r.y - r.h, r.w * 3, r.h * 2); g.restore();
      }
      // tapa con el lazo
      g.save();
      const wob = phase === 'film' ? Math.sin(t * 18) * loose * .03 * Math.max(0, 1 - (performance.now() - lastTap) / 400) : 0;
      const px = r.x + r.w * .1, py = r.y + r.h * cut;
      g.translate(px - lidK * r.w * .5, py - gap); g.rotate(-lidK * .55 + wob - loose * .03); g.translate(-px, -py);
      g.globalAlpha = alpha * (1 - cl((lidK - .55) / .45));
      lidPath(true); g.clip(); g.drawImage(gift, r.x, r.y, r.w, r.h);
      g.restore();
      g.restore();
      return r;
    };
    // vista desde arriba: la boca de la caja
    const drawInside = (t, alpha, z) => {
      const A = Math.min(W, H) * .44 * z, B = A * .42, cx = W / 2, cy = H * .5;
      g.save(); g.globalAlpha = alpha;
      const quad = (p, fill, shade) => {
        g.save(); g.beginPath(); p.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.clip();
        g.fillStyle = fill; g.fillRect(cx - A, cy - A, A * 2, A * 2);
        g.fillStyle = shade; g.fillRect(cx - A, cy - A, A * 2, A * 2); g.restore();
      };
      const sideG = (x0, y0, x1, y1, a0, a1) => { const q = g.createLinearGradient(x0, y0, x1, y1); q.addColorStop(0, `rgba(30,0,6,${a0})`); q.addColorStop(1, `rgba(30,0,6,${a1})`); return q; };
      quad([[cx - A, cy - A], [cx + A, cy - A], [cx + B, cy - B], [cx - B, cy - B]], paperPat, sideG(0, cy - A, 0, cy - B, .25, .75 - light * .5));
      quad([[cx - A, cy + A], [cx + A, cy + A], [cx + B, cy + B], [cx - B, cy + B]], paperPat, sideG(0, cy + A, 0, cy + B, .05, .6 - light * .45));
      quad([[cx - A, cy - A], [cx - A, cy + A], [cx - B, cy + B], [cx - B, cy - B]], paperPat, sideG(cx - A, 0, cx - B, 0, .15, .7 - light * .5));
      quad([[cx + A, cy - A], [cx + A, cy + A], [cx + B, cy + B], [cx + B, cy - B]], paperPat, sideG(cx + A, 0, cx + B, 0, .35, .8 - light * .5));
      // fondo
      { const bq = g.createRadialGradient(cx, cy, 0, cx, cy, B * 1.4); bq.addColorStop(0, `rgb(${60 + light * 195},${14 + light * 220},${16 + light * 150})`); bq.addColorStop(.6, `rgb(${50 + light * 150},${10 + light * 90},${14 + light * 30})`); bq.addColorStop(1, `rgb(${34 + light * 70},${6 + light * 20},${10})`);
        g.fillStyle = bq; g.fillRect(cx - B, cy - B, B * 2, B * 2); }
      // borde dorado (cinta)
      if (ribbon) { const rp = g.createPattern(ribbon, 'repeat'); g.strokeStyle = rp; } else g.strokeStyle = '#d4a017';
      g.lineWidth = A * .07; g.strokeRect(cx - A, cy - A, A * 2, A * 2);
      g.strokeStyle = 'rgba(255,240,180,.55)'; g.lineWidth = 1.5; g.strokeRect(cx - A - A * .035, cy - A - A * .035, A * 2.07, A * 2.07);
      g.restore();
      return { cx, cy, A, B };
    };
    const lightRays = (cx, cy, k, t) => {
      if (k <= 0) return;
      g.save(); g.globalCompositeOperation = 'lighter';
      const R = Math.min(W, H) * (.12 + k * .55);
      const q = g.createRadialGradient(cx, cy, 0, cx, cy, R); q.addColorStop(0, `rgba(255,252,235,${.85 * Math.min(1, k * 1.5)})`); q.addColorStop(.3, `rgba(255,226,150,${.4 * k})`); q.addColorStop(1, 'rgba(255,190,80,0)');
      g.fillStyle = q; g.fillRect(0, 0, W, H);
      g.translate(cx, cy); g.rotate(t * .12); const RR = Math.max(W, H) * (.2 + k * .6);
      for (let i = 0; i < 18; i++) { g.rotate(Math.PI * 2 / 18); g.fillStyle = `rgba(255,236,170,${.06 * k})`; g.beginPath(); g.moveTo(0, 0); g.lineTo(RR, -RR * .05); g.lineTo(RR, RR * .05); g.fill(); }
      g.restore();
      // motas doradas que suben de la luz hacia la cámara
      g.save(); g.globalCompositeOperation = 'lighter';
      for (const m of motes) { m.d += .004 * m.s; if (m.d > 1) { m.d = 0; m.a = Math.random() * 7; }
        const d = m.d * m.d * Math.max(W, H) * .7; g.globalAlpha = k * (1 - m.d); g.fillStyle = '#fff3c0';
        g.beginPath(); g.arc(cx + Math.cos(m.a) * d, cy + Math.sin(m.a) * d, .6 + m.d * 3.5, 0, 7); g.fill(); }
      g.restore();
    };

    let lastTap = 0;
    const frame = now => {
      const t = (now - t0) / 1000, pt = (now - phaseAt) / 1000;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      // la habitación: oscuro cálido con luces desenfocadas
      const bg = g.createRadialGradient(W / 2, H * .7, 10, W / 2, H * .6, Math.max(W, H));
      bg.addColorStop(0, '#5a1a10'); bg.addColorStop(.5, '#2a0e14'); bg.addColorStop(1, '#0c0508'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
      for (const b of bokeh) { g.globalAlpha = .1 + .08 * Math.sin(t * .8 + b.p); g.fillStyle = b.p % 3 ? '#ffcf7a' : '#ff8a6a'; g.beginPath(); g.arc(b.x * W + Math.sin(t * .2 + b.p) * 8, b.y * H, b.r, 0, 7); g.fill(); }
      g.globalAlpha = 1;
      // cámara
      if (phase === 'film') {
        const z = 1 + .05 * Math.sin(t * .35) + loose * .08, ox = Math.sin(t * .25) * W * .025;
        drawSide(t, 1, z, ox, 0);
      } else if (phase === 'open') {
        lidK = easeIO(cl(pt / 1.3)); drawSide(t, 1, 1.08 + lidK * .1, 0, 0);
      } else if (phase === 'dive') {
        const k = easeIO(cl(pt / 2.2));
        const r = giftRect(1.18 + k * 2.4, 0, k * H * .55);
        drawSide(t, 1 - cl((k - .35) / .45), 1.18 + k * 2.4, 0, k * H * .55);
        if (k > .3) drawInside(t, cl((k - .3) / .5), .55 + .45 * k);
        lightRays(W / 2, H * .5, .12 * k, t);
      } else {
        if (phase === 'light') light = easeIO(cl(pt / 2.6));
        const o = drawInside(t, 1, 1 + light * .08);
        lightRays(o.cx, o.cy, .12 + light * .88, t);
      }
      // destellos de los toques
      for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.x += s.vx; s.y += s.vy; s.vy += .05; s.life -= .02; if (s.life <= 0) { sparks.splice(i, 1); continue; }
        g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = s.life; g.fillStyle = '#ffe9a8'; g.translate(s.x, s.y); g.rotate(t * 3); g.fillRect(-s.r * 2, -s.r * .3, s.r * 4, s.r * .6); g.fillRect(-s.r * .3, -s.r * 2, s.r * .6, s.r * 4); g.restore(); }
      // viñeta de cine
      const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // música de Navidad durante toda la escena (si el móvil corta el sonido, vuelve al tocar)
    let music = null; const startMusic = () => { try { if (!music?.playing) { music?.stop(0); unlockAudio(); music = christmasSong(); } } catch {} };
    startMusic(); wrap.addEventListener('pointerdown', () => setTimeout(startMusic, 60));
    const end = done => { if (ended) return; ended = true; try { music?.stop(2); } catch {} cancelAnimationFrame(raf); removeEventListener('resize', size); wrap.classList.add('out'); setTimeout(() => wrap.remove(), 600); resolveCine(done); };
    close.onclick = () => end(seen >= 10);
    keep.onclick = () => end('keep');

    // ---- 5 toques al lazo
    cv.addEventListener('pointerdown', e => {
      if (phase !== 'film') return;
      const r = giftRect(); if (e.clientY > r.y + r.h * 1.1 || e.clientY < r.y - r.h * .3) return;
      taps++; lastTap = performance.now(); pop(); dots.children[taps - 1]?.classList.add('on');
      loose = taps / 5;
      for (let i = 0; i < 10 + taps * 4; i++) { const a = Math.random() * 7, v = 2 + Math.random() * 4; sparks.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: 1, r: 1.5 + Math.random() * 2.5 }); }
      if (taps === 5) opening();
    });
    let seen = 0;
    async function opening() {
      hint.textContent = '✨'; jingle(1);
      await sleep(500); go('open'); await sleep(1400);
      hint.textContent = ''; dots.classList.add('hide');
      go('dive'); await sleep(2300);
      go('light'); chime(); await sleep(1800);
      hint.textContent = L('Ábrelas en orden, de la 1 a la 10. Puedes arrastrarlas por la pantalla.', 'Obre-les en ordre, de l’1 a la 10. Les pots arrossegar per la pantalla.', 'Open them in order, from 1 to 10. You can drag them around the screen.');
      // salen las bolas de la luz
      const G = GIFTS24();
      const pos = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI * 2 / 10; return [50 + Math.cos(a) * 36, 47 + Math.sin(a) * 28]; });
      G.forEach(([title, txt], i) => {
        const b = el('button', { class: 'cine-ball no-delay', style: `--x:${pos[i][0]}%;--y:${pos[i][1]}%;animation-delay:${i * .35}s` }, orn(BALL_PICS[i]), el('span', { class: 'p24-n' }, i + 1));
        // se pueden arrastrar por la pantalla; un toque sin mover la abre
        let drag = null;
        b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch {} const r = b.getBoundingClientRect(); drag = { x0: e.clientX, y0: e.clientY, bx: r.left + r.width / 2, by: r.top + r.height / 2, moved: false }; });
        b.addEventListener('pointermove', e => {
          if (!drag) return; const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
          if (!drag.moved && Math.hypot(dx, dy) < 8) return;
          if (!drag.moved) { drag.moved = true; b.classList.add('dragging'); }
          b.style.left = Math.max(30, Math.min(W - 30, drag.bx + dx)) + 'px'; b.style.top = Math.max(50, Math.min(H - 40, drag.by + dy)) + 'px';
        });
        const drop = e => { if (!drag) return; const d = drag; drag = null; b.classList.remove('dragging'); if (d.moved) { pop(); b.classList.add('moved'); } else if (e.type === 'pointerup') b.open(); };
        b.addEventListener('pointerup', drop); b.addEventListener('pointercancel', drop);
        b.open = async () => {
          if (b.classList.contains('busy')) return;
          // se abren en orden, de la 1 a la 10
          if (!b.classList.contains('seen') && i !== seen) {
            const nb = balls.children[seen]; nb?.classList.remove('nudge'); void nb?.offsetWidth; nb?.classList.add('nudge');
            b.classList.remove('locked'); void b.offsetWidth; b.classList.add('locked');
            toast(L(`Primero abre la bola número ${seen + 1} ✨`, `Primer obre la bola número ${seen + 1} ✨`, `Open bauble number ${seen + 1} first ✨`));
            return;
          }
          b.classList.add('busy');
          chime(); flash(b);
          await sleep(1000);
          await popup(el('div', { class: 'p24-card' }, orn(BALL_PICS[i], 'p24-card-ball'), el('h2', {}, title), el('p', { class: 'p24-quote' }, txt)),
            { cls: 'small p24-pop', buttons: [{ label: L('¡Qué bien!', 'Que bé!', 'Lovely!'), value: true }] });
          b.classList.remove('busy');
          if (!b.classList.contains('seen')) { b.classList.add('seen'); seen++; balls.querySelectorAll('.cine-ball').forEach((x, k) => x.classList.toggle('next', k === seen)); }
          if (seen === 10) { confetti(260); hohoho(); hint.textContent = L('¡Todos los regalos son tuyos!', 'Tots els regals són teus!', 'All the gifts are yours!'); keep.classList.add('show'); }
        };
        if (i === 0) b.classList.add('next');
        balls.append(b);
      });
    }
    // destello que sale de la bola y se va volando a lo lejos
    function flash(b) {
      const r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height * .55;
      const f = el('div', { class: 'cine-flash' }); f.style.left = x + 'px'; f.style.top = y + 'px'; wrap.append(f);
      const tx = (Math.random() - .5) * W * .5 - (x - W / 2) * .4, ty = -y - H * .1 + Math.random() * H * .15;
      const anim = f.animate([
        { transform: 'translate(-50%,-50%) scale(.2)', opacity: 0 },
        { transform: 'translate(-50%,-50%) scale(1.6)', opacity: 1, offset: .18 },
        { transform: `translate(calc(-50% + ${tx * .45}px), calc(-50% + ${ty * .4}px)) scale(.9) rotate(120deg)`, opacity: 1, offset: .55 },
        { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(.05) rotate(260deg)`, opacity: 0 },
      ], { duration: 1500, easing: 'cubic-bezier(.3,.1,.3,1)' });
      // estela
      let n = 0; const trail = setInterval(() => { const rr = f.getBoundingClientRect(); const d = el('i', { class: 'cine-trail' }); d.style.left = rr.left + rr.width / 2 + 'px'; d.style.top = rr.top + rr.height / 2 + 'px'; wrap.append(d); setTimeout(() => d.remove(), 700); if (++n > 24) clearInterval(trail); }, 50);
      anim.onfinish = () => { f.remove(); clearInterval(trail); };
    }
  });
}
