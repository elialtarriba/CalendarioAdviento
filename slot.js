// Día 25 (solo gnomos): «Juega al Regalo Seguro», la máquina tragaperras de Mamá Noel.
// Se tira de la palanca, el rodillo va pasando las 5 opciones que la administradora pone en
// Configuración → «🎰 Máquina de regalos», y al tocar el rodillo se para y se ilumina el resultado.
// Solo cuenta la primera tirada (se guarda en el perfil) y se puede compartir por WhatsApp en una imagen.
import { el, popup, confetti, toast } from './fx.js?v=23.4';
import { getLang } from './i18n.js?v=23.4';
import { pop, fanfare, chime, unlockAudio, jingle, hohoho, sadTrombone, christmasSong } from './sound.js?v=23.4';
import { TROLL } from './catch.js?v=23.4';
import { S } from './app.js?v=23.4';
import { store } from './store.js?v=23.4';
import { shareResult } from './share.js?v=23.4';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const IMG = 'maquina25.webp';
export const slotOptions = () => (S.config?.slot?.opts || []).map(x => String(x || '').trim()).filter(Boolean);
// efecto de cada opción al parar la máquina (se configura en «🎰 Máquina de regalos»); por defecto, activado
export const FX_TYPES = { vale: 'Imagen del vale (Art Bo) con fuegos artificiales', coins: 'Lluvia de monedas de oro', lose: '«¡Ohhhh! No has ganado!» y después Papá Noel', none: 'Sin efecto' };
export const FX_DEFAULT = ['vale', 'coins', 'coins', 'coins', 'lose'];
const slotFx = text => { const all = (S.config?.slot?.opts || []).map(x => String(x || '').trim()); const i = all.indexOf(text); const f = S.config?.slot?.fx?.[i] || {};
  return { type: f.type || FX_DEFAULT[i] || 'none', on: f.on !== false }; };
// en el rodillo solo sale la primera parte («¡Has ganado 2 Euros!»); el resto («A canjear…») sale en el efecto
const neverWins = t => slotFx(t).type === 'lose' || /no has ganado|no has guanyat/i.test(String(t));
const short = t => String(t).split(/\s+[-–—]\s+/)[0];
const rest = t => String(t).split(/\s+[-–—]\s+/).slice(1).join(' – ');

export function slotButton() {
  const b = el('button', { type: 'button', class: 'gift-btn slot-btn no-delay' },
    el('img', { src: IMG, alt: '' }),
    el('span', { class: 'gift-btn-txt' }, el('b', {}, L('Juega al Regalo Seguro', 'Juga al Regal Segur', 'Play the Sure Gift')),
      el('small', {}, L('La máquina de regalos de Mamá Noel', 'La màquina de regals de la Mare Noel', 'Mrs Claus’s gift machine'))));
  b.addEventListener('click', () => { unlockAudio(); openSlot(); });
  return b;
}

export async function openSlot({ test = false } = {}) {
  const opts = slotOptions();
  if (!opts.length) {
    return popup(el('div', { class: 'gift-pop' }, el('img', { class: 'gift-pop-img', src: IMG, alt: '' }),
      el('h2', {}, L('¡La máquina se está preparando!', 'La màquina s’està preparant!', 'The machine is getting ready!')),
      el('p', {}, L('Mamá Noel todavía está llenando la máquina de regalos. ¡Vuelve pronto!', 'La Mare Noel encara està omplint la màquina de regals. Torna aviat!', 'Mrs Claus is still filling the gift machine. Come back soon!'))),
      { cls: 'small', buttons: [{ label: '🎄 OK', value: true }] });
  }
  // la tirada buena la guarda Firebase en un sitio que solo se puede escribir una vez
  if (!test) { const once = await store.getOnce(S.user.uid, 'slot').catch(() => null); if (once) S.profile.slot = once; else if (S.profile?.slot && !S.profile.slot.locked) S.profile.slot = null; }
  const first = () => S.profile?.slot || null;
  const items = el('div', { class: 'sl-items' });
  const reel = el('div', { class: 'sl-reel' }, items);
  const glow = el('div', { class: 'sl-glow' });
  const lever = el('button', { type: 'button', class: 'sl-lever no-delay', 'aria-label': 'palanca' }, el('span', { class: 'sl-lever-hint' }, '⬇'));
  const machine = el('div', { class: 'sl-machine' }, el('img', { class: 'sl-img', src: IMG, alt: '' }), reel, glow, lever,
    el('div', { class: 'sl-lights' }, ...Array.from({ length: 10 }, (_, i) => el('i', { style: `--i:${i}` }))));
  const info = el('p', { class: 'sl-info' });
  const pull = el('button', { type: 'button', class: 'btn btn-big no-delay sl-pull' });
  const share = el('button', { type: 'button', class: 'btn btn-big no-delay mz-share' }, '📲 ' + L('Compartir por WhatsApp', 'Compartir per WhatsApp', 'Share on WhatsApp'));
  const firstBox = el('div', { class: 'sl-first' });
  const box = el('div', { class: 'sl-wrap' },
    el('h2', { class: 'sl-title' }, L('Juega al Regalo Seguro', 'Juga al Regal Segur', 'Play the Sure Gift')),
    el('p', { class: 'sl-how' }, L('Tira de la palanca: el rodillo empezará a girar con los regalos. Toca el rodillo para pararlo… ¡y el regalo que quede en el centro es el tuyo! Solo cuenta la primera tirada.',
      'Tira de la palanca: el rodet començarà a girar amb els regals. Toca el rodet per aturar-lo… i el regal que quedi al centre és el teu! Només compta la primera tirada.',
      'Pull the lever: the reel will start spinning with the gifts. Tap the reel to stop it… and the gift in the middle is yours! Only the first spin counts.')),
    machine, info, el('div', { class: 'ttt-fx-btns' }, pull), firstBox);

  // ---- rodillo: las opciones pasan una detrás de otra (en bucle)
  const list = [...opts, ...opts, ...opts];
  list.forEach(t => items.append(el('div', { class: 'sl-item' }, el('span', {}, short(t)))));
  let pos = 0, speed = 0, state = 'idle', raf = 0, lastTick = 0, stopAt = null;
  const n = opts.length;
  const H = () => reel.clientHeight * .5; // alto de cada casilla del rodillo
  const paint = () => { const h = H(); items.style.setProperty('--h', h + 'px'); const p = ((pos % n) + n) % n; items.style.transform = `translateY(${(-(p + n) * h + reel.clientHeight / 2 - h / 2).toFixed(1)}px)`; };
  function loop(t) {
    if (state === 'spin') pos += speed;
    else if (state === 'stopping') {
      const left = stopAt - pos;
      if (left <= .002) { pos = stopAt; paint(); return landed(); }
      pos += Math.max(.012, Math.min(speed, left * .09));
    }
    if (Math.floor(pos) !== lastTick) { lastTick = Math.floor(pos); try { pop(); } catch {} }
    paint(); raf = requestAnimationFrame(loop);
  }
  function startSpin() {
    if (state === 'spin' || state === 'stopping') return;
    unlockAudio(); try { jingle(1); } catch {}
    lever.classList.remove('pulled'); void lever.offsetWidth; lever.classList.add('pulled');
    machine.classList.add('spinning'); machine.classList.remove('won'); glow.classList.remove('on');
    state = 'spin'; speed = .32; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    paintInfo();
  }
  function stopSpin() {
    if (state !== 'spin') return;
    state = 'stopping'; stopAt = Math.ceil(pos) + 2; // frena y se queda en una opción
    // «¡Ohhhh! No has ganado!» pasa por el rodillo (para dar emoción) pero nunca sale
    for (let k = 0; k < n && neverWins(opts[((stopAt % n) + n) % n]); k++) stopAt++;
    paintInfo();
  }
  function landed() {
    state = 'done'; machine.classList.remove('spinning'); machine.classList.add('won'); glow.classList.add('on');
    const won = opts[((stopAt % n) + n) % n];
    fanfare(); setTimeout(chime, 500);
    const r = machine.getBoundingClientRect(); confetti(200, { x: r.left + r.width / 2, y: r.top + r.height * .45 });
    const official = !first() && !test;
    if (official) {
      const res = { text: won, at: Date.now(), locked: true };
      S.profile.slot = res;
      store.createOnce(S.user.uid, 'slot', res).then(() => {
        store.saveProfile(S.user.uid, { slot: res }).catch(() => {});
        toast('🎁 ' + L('¡Esta es tu tirada buena!', 'Aquesta és la teva tirada bona!', 'This is your official spin!'), 3500);
      }).catch(async () => { // ya había una tirada guardada: esa es la que vale
        const old = await store.getOnce(S.user.uid, 'slot').catch(() => null);
        if (old) { S.profile.slot = old; paintInfo(); toast('🎁 ' + L(`Tu tirada buena ya era: ${old.text}`, `La teva tirada bona ja era: ${old.text}`, `Your official spin was: ${old.text}`), 5000); }
      });
    }
    paintInfo();
    const fx = slotFx(won), isFirst = official;
    setTimeout(async () => {
      if (fx.on && fx.type !== 'none') await playFx(fx.type, won);
      if (fx.type !== 'lose' && !/no has ganado|no has guanyat/i.test(won)) prizePop(won, test || !isFirst);
    }, 1300);
  }
  reel.addEventListener('click', () => (state === 'spin' ? stopSpin() : null));
  lever.addEventListener('click', startSpin);
  pull.addEventListener('click', () => (state === 'spin' ? stopSpin() : startSpin()));
  share.addEventListener('click', () => shareSlot(first()));
  function paintInfo() {
    pull.textContent = state === 'spin' ? '✋ ' + L('¡Para el rodillo!', 'Atura el rodet!', 'Stop the reel!') : state === 'stopping' ? '⏳ …' : '🎰 ' + L('Tirar de la palanca', 'Tirar de la palanca', 'Pull the lever');
    pull.disabled = state === 'stopping';
    info.textContent = state === 'spin' ? L('¡Toca el rodillo para pararlo!', 'Toca el rodet per aturar-lo!', 'Tap the reel to stop it!') : state === 'done' ? '✨ ' + opts[((stopAt % n) + n) % n] + ' ✨' : '';
    info.classList.toggle('big', state === 'done');
    const f = first();
    firstBox.replaceChildren(...(f ? [el('p', {}, L('Tu tirada buena (la primera): ', 'La teva tirada bona (la primera): ', 'Your official spin (the first one): '), el('b', {}, f.text)), share] : []));
  }
  paint(); requestAnimationFrame(paint); paintInfo();
  await popup(box, { cls: 'wide sl-pop', buttons: [{ label: L('Cerrar', 'Tancar', 'Close'), value: true, cls: 'btn-ghost' }] });
  cancelAnimationFrame(raf);
}

// ---- imagen para compartir: la máquina con el resultado y el nombre
const loadImg = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
function wrapLines(g, text, maxW) {
  const words = String(text).split(/\s+/); const lines = []; let cur = '';
  words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
  if (cur) lines.push(cur); return lines;
}
async function slotImage(res, name) {
  const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  try { await Promise.all(['700 80px "Mountains of Christmas"', '800 60px Montserrat'].map(f => document.fonts.load(f))); } catch {}
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#14532d'); bg.addColorStop(.5, '#1f6b45'); bg.addColorStop(1, '#7a1020');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff'; for (let i = 0; i < 150; i++) { g.globalAlpha = .2 + Math.random() * .6; g.beginPath(); g.arc(Math.random() * W, Math.random() * H, 2 + Math.random() * 5, 0, 7); g.fill(); }
  g.globalAlpha = 1; g.strokeStyle = '#f2c14e'; g.lineWidth = 14; g.strokeRect(36, 36, W - 72, H - 72);
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.fillStyle = '#fff6d6'; g.font = '700 84px "Mountains of Christmas", cursive'; g.fillText(L('El Regalo Seguro', 'El Regal Segur', 'The Sure Gift'), W / 2, 140);
  const img = await loadImg(IMG);
  const mh = 900, mw = img ? mh * img.width / img.height : 650, mx = (W - mw) / 2, my = 175;
  if (img) g.drawImage(img, mx, my, mw, mh);
  // el resultado dentro del rodillo
  const rx = mx + mw * .21, ry = my + mh * .418, rw = mw * .47, rh = mh * .115;
  g.save(); g.shadowColor = '#ffd24a'; g.shadowBlur = 40; g.fillStyle = '#fffdf2'; g.fillRect(rx, ry, rw, rh); g.restore();
  g.strokeStyle = '#d4a017'; g.lineWidth = 5; g.strokeRect(rx, ry, rw, rh);
  g.fillStyle = '#b3122e'; let fs = 52; g.font = `800 ${fs}px Montserrat, sans-serif`;
  let lines = wrapLines(g, res.text, rw - 20);
  while ((lines.length > 2 || lines.some(l => g.measureText(l).width > rw - 20)) && fs > 22) { fs -= 3; g.font = `800 ${fs}px Montserrat, sans-serif`; lines = wrapLines(g, res.text, rw - 20); }
  lines.slice(0, 2).forEach((l, i, a) => g.fillText(l, rx + rw / 2, ry + rh / 2 + fs * .35 + (i - (a.length - 1) / 2) * fs * 1.1));
  g.fillStyle = '#fff6d6'; g.font = '700 70px "Mountains of Christmas", cursive'; g.fillText(name || '', W / 2, 1160);
  g.font = '600 32px Montserrat, sans-serif'; g.fillText(L('ha tirado de la palanca de Mamá Noel', 'ha tirat de la palanca de la Mare Noel', 'pulled Mrs Claus’s lever'), W / 2, 1210);
  g.font = '700 42px "Mountains of Christmas", cursive'; g.fillText(L('Calendario de Adviento · Día 25', 'Calendari d’Advent · Dia 25', 'Advent Calendar · Day 25'), W / 2, 1285);
  return await new Promise(r => cv.toBlob(r, 'image/png'));
}
async function shareSlot(res) {
  if (!res) return;
  const name = (S.profile?.name || '').trim();
  const text = L(`🎰 ¡He jugado al Regalo Seguro de Mamá Noel y me ha tocado: ${res.text}!`, `🎰 He jugat al Regal Segur de la Mare Noel i m’ha tocat: ${res.text}!`, `🎰 I played Mrs Claus’s Sure Gift and I got: ${res.text}!`) + (name ? `\n— ${name}` : '');
  toast('✨ ' + L('Preparando la foto…', 'Preparant la foto…', 'Preparing the picture…'), 1500);
  const blob = await slotImage(res, name).catch(() => null);
  const file = blob ? new File([blob], 'regalo-seguro.png', { type: 'image/png' }) : null;
  const url = blob ? URL.createObjectURL(blob) : null;
  const canFiles = !!(file && navigator.canShare && navigator.canShare({ files: [file] }));
  const send = el('button', { type: 'button', class: 'btn btn-big no-delay', onclick: async () => {
    try { if (canFiles) { await navigator.share({ files: [file], text }); return; } } catch (e) { if (e?.name === 'AbortError') return; }
    if (url) { const a = el('a', { href: url, download: 'regalo-seguro.png' }); document.body.append(a); a.click(); a.remove(); }
    location.href = 'whatsapp://send?text=' + encodeURIComponent(text);
  } }, '📲 ' + L('Enviar por WhatsApp', 'Enviar per WhatsApp', 'Send by WhatsApp'));
  await popup(el('div', { class: 'g23-sharebox' }, el('h2', {}, L('Tu foto para el grupo', 'La teva foto per al grup', 'Your picture for the group')),
    url ? el('img', { class: 'g23-shareimg', src: url, alt: '' }) : el('p', {}, '⚠️'), send),
    { cls: 'small g23-sharepop', buttons: [{ label: L('Cerrar', 'Tancar', 'Close'), value: false, cls: 'btn-ghost' }] });
  if (url) setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// ================================================================ efectos al ganar
function fireworks(cv, ms = 6000) {
  const g = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const COLS = ['#ffd24a', '#ff4d6d', '#4ade80', '#7dd3fc', '#ffffff', '#f2c14e', '#c084fc'];
  let parts = [], last = 0, raf = 0; const t0 = performance.now();
  const burst = () => { const x = innerWidth * (.1 + Math.random() * .8), y = innerHeight * (.1 + Math.random() * .45), c = COLS[Math.floor(Math.random() * COLS.length)];
    for (let i = 0; i < 80; i++) { const a = Math.random() * 7, v = 1.5 + Math.random() * 4.5; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c: Math.random() < .2 ? '#fff' : c }); } try { pop(); } catch {} };
  (function f(t) {
    if (t - t0 < ms && t - last > 420) { last = t; burst(); }
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(0, 0, innerWidth, innerHeight);
    g.globalCompositeOperation = 'lighter';
    parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .05; p.vx *= .985; p.vy *= .985; p.life -= .012; g.globalAlpha = Math.max(0, p.life); g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, 2.2, 0, 7); g.fill(); });
    parts = parts.filter(p => p.life > 0); g.globalAlpha = 1;
    if (cv.isConnected && (t - t0 < ms + 2500)) raf = requestAnimationFrame(f);
  })(t0);
  return () => cancelAnimationFrame(raf);
}
function coinRain(cv) {
  const g = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const coins = Array.from({ length: 70 }, () => ({ x: Math.random() * innerWidth, y: -Math.random() * innerHeight * 1.5, r: 12 + Math.random() * 14, v: 2 + Math.random() * 3.5, a: Math.random() * 7, s: .05 + Math.random() * .12 }));
  let raf = 0;
  (function f() {
    g.clearRect(0, 0, innerWidth, innerHeight);
    coins.forEach(c => {
      c.y += c.v; c.a += c.s; if (c.y > innerHeight + 40) { c.y = -40; c.x = Math.random() * innerWidth; }
      const w = Math.abs(Math.cos(c.a)) * c.r; // gira
      const gr = g.createRadialGradient(c.x - w * .3, c.y - c.r * .3, 1, c.x, c.y, c.r);
      gr.addColorStop(0, '#fff6c2'); gr.addColorStop(.5, '#f2c14e'); gr.addColorStop(1, '#a8740a');
      g.fillStyle = gr; g.strokeStyle = '#8a5d06'; g.lineWidth = 2;
      g.beginPath(); g.ellipse(c.x, c.y, Math.max(1.5, w), c.r, 0, 0, 7); g.fill(); g.stroke();
      if (w > c.r * .45) { g.fillStyle = '#8a5d06'; g.font = `800 ${c.r}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('€', c.x, c.y + 1); }
    });
    if (cv.isConnected) raf = requestAnimationFrame(f);
  })();
  return () => cancelAnimationFrame(raf);
}
function fxLayer() {
  const cv = el('canvas', { class: 'slfx-cv' });
  const box = el('div', { class: 'slfx' }, el('div', { class: 'slfx-flash' }), cv);
  document.body.append(box);
  const close = () => new Promise(res => { box.classList.add('out'); setTimeout(() => { box.remove(); res(); }, 600); });
  return { box, cv, close };
}
const waitTap = (box, btnLabel) => new Promise(res => {
  const b = el('button', { type: 'button', class: 'btn btn-big no-delay slfx-btn' }, btnLabel);
  b.onclick = res; box.append(b); setTimeout(() => b.classList.add('show'), 1200);
});
async function playFx(type, text) {
  if (type === 'vale') {
    const { box, cv, close } = fxLayer(); const stop = fireworks(cv, 7000);
    try { fanfare(); confetti(200); } catch {}
    let mus = null; setTimeout(() => { try { mus = christmasSong(); } catch {} }, 1500);
    box.append(el('img', { class: 'slfx-vale', src: 'vale-artbo.webp', alt: '' }));
    await waitTap(box, '🎁 ' + L('¡Gracias, Mamá Noel!', 'Gràcies, Mare Noel!', 'Thank you, Mrs Claus!'));
    stop(); try { mus?.stop(1); } catch {} await close();
  } else if (type === 'coins') {
    const { box, cv, close } = fxLayer(); const stop = coinRain(cv);
    try { fanfare(); jingle(2); } catch {}
    box.append(el('div', { class: 'slfx-card' }, el('div', { class: 'slfx-deco' }, '✦ ❄ ✦'),
      el('h2', {}, short(text)), rest(text) ? el('p', {}, rest(text)) : null,
      el('small', {}, [S.profile?.name, L('Mamá Noel', 'Mare Noel', 'Mrs Claus')].filter(Boolean).join(' · '))));
    await waitTap(box, '💰 ' + L('¡Genial!', 'Genial!', 'Great!'));
    stop(); await close();
  } else if (type === 'lose') {
    try { sadTrombone(); } catch {}
    await popup(el('div', { class: 'slfx-lose' }, el('img', { src: TROLL, alt: '' }), el('h2', {}, short(text) || L('¡Ohhhh! No has ganado!', 'Ohhhh! No has guanyat!', 'Ohhhh! You didn’t win!'))),
      { cls: 'small', buttons: [{ label: '😢 OK', value: true }] });
    const { box, cv, close } = fxLayer(); const stop = fireworks(cv, 7000);
    try { hohoho(); } catch {} setTimeout(() => { try { confetti(180); fanfare(); } catch {} }, 1800);
    box.append(el('div', { class: 'slfx-santa' }, el('img', { src: 'santa-navidad.webp', alt: '' }),
      el('h2', {}, L('¡Pero siempre queda la Navidad!', 'Però sempre ens queda el Nadal!', 'But there’s always Christmas!'))));
    await waitTap(box, '🎄 ' + L('¡Feliz Navidad!', 'Bon Nadal!', 'Merry Christmas!'));
    stop(); await close();
  }
}
export const testFx = (type, text) => playFx(type, text);

// el premio: cartel bonito para hacer una foto (captura) y enviarla al grupo de la familia
async function prizePop(text, notFirst) {
  const name = S.profile?.name || '';
  const when = new Date().toLocaleString(getLang() === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  const go = await popup(el('div', { class: 'sl-prize' },
    el('div', { class: 'gift-lights' }, ...Array.from({ length: 12 }, (_, i) => el('i', { style: `--i:${i}` }))),
    el('img', { class: 'sl-prize-img', src: 'maquina25.webp', alt: '' }),
    el('h2', {}, short(text)),
    rest(text) ? el('p', { class: 'sl-prize-rest' }, rest(text)) : null,
    el('p', { class: 'sl-prize-who' }, `🎅 ${name} · ${when}`),
    notFirst ? el('p', { class: 'muted' }, L('(Esta tirada era de prueba: el premio que vale es el de tu primera tirada.)', '(Aquesta tirada era de prova: el premi que val és el de la teva primera tirada.)', '(This was a practice spin: your prize is the one from your first spin.)'))
      : el('p', { class: 'sh-note' }, '📸 ' + L('Haz una foto (captura de pantalla) de este mensaje y envíala al grupo de WhatsApp de la familia para que Mamá Noel te dé el premio.', 'Fes una foto (captura de pantalla) d’aquest missatge i envia-la al grup de WhatsApp de la família perquè la Mare Noel et doni el premi.', 'Take a screenshot of this message and send it to the family WhatsApp group so Mrs Claus can give you your prize.'))),
    { cls: 'small', buttons: notFirst ? [{ label: '🎄 OK', value: false }] : [{ label: L('Cerrar', 'Tancar', 'Close'), value: false, cls: 'btn-ghost' }, { label: '📲 WhatsApp', value: true, cls: 'c5-wa' }] });
  if (go) shareResult({ title: short(text), emoji: '🎰', who: name, day: 25, file: 'premio.png',
    rows: [[L('Premio', 'Premi', 'Prize'), short(text)], ...(rest(text) ? [['', rest(text)]] : []), [L('Fecha', 'Data', 'Date'), when]],
    note: L('Envíalo al grupo de la familia para que Mamá Noel te dé el premio.', 'Envia-ho al grup de la família perquè la Mare Noel et doni el premi.', 'Send it to the family group so Mrs Claus can give you the prize.'),
    text: `🎰 ${L('Máquina de regalos de Mamá Noel', 'Màquina de regals de la Mare Noel', 'Mrs Claus’s gift machine')}: ${text}` + (name ? `\n— ${name}` : '') });
}
