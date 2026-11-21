// Cartel navideño con el resultado de una partida (foto para el grupo de WhatsApp de la familia).
// shareResult({ title, emoji, who, rows: [[etiqueta, valor]…], note, file, text })
import { el, popup, toast } from './fx.js';
import { getLang, t } from './i18n.js';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const loadImg = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });

export async function resultImage({ title, emoji = '🎄', who = '', rows = [], day = '', img = '' }) {
  const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  try { await Promise.all(['700 80px "Mountains of Christmas"', '800 60px Montserrat', '600 40px Montserrat'].map(f => document.fonts.load(f))); } catch {}
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#7a1020'); bg.addColorStop(.55, '#b3122e'); bg.addColorStop(1, '#14532d');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  let s = 7; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  g.fillStyle = '#fff'; for (let i = 0; i < 160; i++) { g.globalAlpha = .25 + rnd() * .6; g.beginPath(); g.arc(rnd() * W, rnd() * H, 2 + rnd() * 6, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  g.strokeStyle = '#f2c14e'; g.lineWidth = 14; g.strokeRect(36, 36, W - 72, H - 72);
  g.strokeStyle = '#fff6d6'; g.lineWidth = 3; g.strokeRect(58, 58, W - 116, H - 116);
  for (let i = 0; i < 15; i++) { const x = 90 + i * 64, y = 92 + Math.sin(i * .9) * 10; g.fillStyle = ['#ffd24a', '#4ade80', '#ff4d6d', '#7dd3fc'][i % 4]; g.shadowColor = g.fillStyle; g.shadowBlur = 18; g.beginPath(); g.ellipse(x, y, 11, 15, 0, 0, 7); g.fill(); }
  g.shadowBlur = 0; g.textAlign = 'center';
  g.font = '120px serif'; g.fillText(emoji, W / 2, 270);
  g.fillStyle = '#fff6d6'; g.font = '700 84px "Mountains of Christmas", cursive';
  const wrap = (txt, maxW) => { const words = String(txt).split(' '), lines = []; let cur = ''; words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }); if (cur) lines.push(cur); return lines; };
  let y = 380; wrap(title, W - 200).slice(0, 2).forEach(l => { g.fillText(l, W / 2, y); y += 86; });
  if (img) { const im = await loadImg(img); if (im) { const h = 230, w = im.width / im.height * h; g.drawImage(im, W / 2 - w / 2, y - 40, w, h); y += h; } }
  // tarjeta con los datos (V22.7: los textos largos se escriben enteros, en varias líneas)
  const rr = (x, yy, w, h, r) => { g.beginPath(); g.moveTo(x + r, yy); g.arcTo(x + w, yy, x + w, yy + h, r); g.arcTo(x + w, yy + h, x, yy + h, r); g.arcTo(x, yy + h, x, yy, r); g.arcTo(x, yy, x + w, yy, r); g.closePath(); };
  const top0 = Math.max(y, 520), avail = H - top0 - 140;
  const layout = vs => { let h = 170; const out = rows.map(([k, v]) => {
      g.font = `800 ${vs}px Montserrat, sans-serif`; const one = g.measureText(String(v)).width <= 520 && !!String(k);
      if (one) { h += Math.max(92, vs * 1.9); return { k, one, lines: [String(v)], h: Math.max(92, vs * 1.9) }; }
      const lines = wrap(String(v), W - 320); const hh = (k ? 56 : 0) + lines.length * vs * 1.25 + 34; h += hh; return { k, one, lines, h: hh }; });
    return { out, h }; };
  let vs = 40, L2 = layout(vs);
  while (L2.h > avail && vs > 22) { vs -= 2; L2 = layout(vs); }
  const cardH = Math.min(avail, L2.h), top = top0 + Math.max(0, (avail - cardH) / 2) * .4;
  g.fillStyle = '#fffaf0'; g.strokeStyle = '#f2c14e'; g.lineWidth = 8; rr(110, top, W - 220, cardH, 46); g.fill(); g.stroke();
  g.fillStyle = '#7a1020'; g.font = '700 70px "Mountains of Christmas", cursive'; g.textAlign = 'center'; g.fillText(who || '', W / 2, top + 90);
  let ry = top + 165;
  L2.out.forEach(r => {
    if (r.one) {
      g.textAlign = 'left'; g.fillStyle = '#b8862b'; g.font = '700 34px Montserrat, sans-serif'; g.fillText(String(r.k), 160, ry);
      g.textAlign = 'right'; g.fillStyle = '#b3122e'; g.font = `800 ${vs}px Montserrat, sans-serif`; g.fillText(r.lines[0], W - 160, ry);
    } else {
      let yy = ry;
      if (r.k) { g.textAlign = 'center'; g.fillStyle = '#b8862b'; g.font = '700 34px Montserrat, sans-serif'; g.fillText(String(r.k), W / 2, yy); yy += 56; }
      g.textAlign = 'center'; g.fillStyle = '#b3122e'; g.font = `800 ${vs}px Montserrat, sans-serif`;
      r.lines.forEach(l => { g.fillText(l, W / 2, yy); yy += vs * 1.25; });
    }
    ry += r.h;
  });
  g.textAlign = 'center'; g.fillStyle = '#fff6d6'; g.font = '700 44px "Mountains of Christmas", cursive';
  g.fillText(L('Calendario de Adviento', 'Calendari d’Advent', 'Advent Calendar') + (day ? ' · ' + L('Día', 'Dia', 'Day') + ' ' + day : ''), W / 2, H - 78);
  return await new Promise(r => cv.toBlob(r, 'image/png'));
}

// fuegos artificiales en un canvas que ocupa la pantalla
export function fireworks(cv, ms = 6000) {
  const g = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const COLS = ['#ffd24a', '#ff4d6d', '#4ade80', '#7dd3fc', '#ffffff', '#f2c14e', '#c084fc'];
  let parts = [], last = 0, raf = 0; const t0 = performance.now();
  const burst = () => { const x = innerWidth * (.1 + Math.random() * .8), y = innerHeight * (.1 + Math.random() * .45), c = COLS[Math.floor(Math.random() * COLS.length)];
    for (let i = 0; i < 80; i++) { const a = Math.random() * 7, v = 1.5 + Math.random() * 4.5; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c: Math.random() < .2 ? '#fff' : c }); }  };
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

// popup con la foto y el botón de WhatsApp
export async function shareResult(opts) {
  const { file = 'resultado.png', text = '', note = '' } = opts;
  toast('✨ ' + L('Preparando la foto…', 'Preparant la foto…', 'Preparing the picture…'), 1500);
  const blob = await resultImage(opts).catch(() => null);
  const f = blob ? new File([blob], file, { type: 'image/png' }) : null;
  const url = blob ? URL.createObjectURL(blob) : null;
  const canFiles = !!(f && navigator.canShare && navigator.canShare({ files: [f] }));
  const send = el('button', { type: 'button', class: 'btn btn-big no-delay c5-wa', onclick: async () => {
    try { if (canFiles) { await navigator.share({ files: [f], text }); return; } } catch (e) { if (e?.name === 'AbortError') return; }
    if (url) { const a = el('a', { href: url, download: file }); document.body.append(a); a.click(); a.remove(); }
    location.href = 'whatsapp://send?text=' + encodeURIComponent(text);
  } }, '📲 ' + L('Enviar por WhatsApp', 'Enviar per WhatsApp', 'Send on WhatsApp'));
  await popup(el('div', { class: 'g23-sharebox' },
    el('h2', {}, L('Tu foto para el grupo', 'La teva foto per al grup', 'Your picture for the group')),
    note ? el('p', { class: 'sh-note' }, note) : null,
    url ? el('img', { class: 'g23-shareimg', src: url, alt: '' }) : null,
    el('p', { class: 'muted' }, canFiles ? L('Pulsa el botón y elige WhatsApp y el grupo de la familia.', 'Prem el botó i tria WhatsApp i el grup de la família.', 'Tap the button and choose WhatsApp and the family group.')
      : L('Se guardará la foto y se abrirá WhatsApp.', 'Es guardarà la foto i s’obrirà WhatsApp.', 'The picture will be saved and WhatsApp will open.')), send),
    { cls: 'small g23-sharepop', buttons: [{ label: L('Cerrar', 'Tancar', 'Close'), value: false, cls: 'btn-ghost' }] });
  if (url) setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// (V22.7) escribe el nombre de la persona encima de una foto (p. ej. el certificado del premio).
// yPct: altura de la línea donde va el nombre, en % de la foto (la base de las letras queda justo encima).
export async function nameOnPhoto(src, name, yPct = 39) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  try { await document.fonts?.load('80px "Great Vibes"'); } catch {}
  const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
  const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
  const W = cv.width, H = cv.height, maxW = W * .52;
  let fs = Math.round(H * .105);
  g.font = `${fs}px "Great Vibes", "Mountains of Christmas", cursive`;
  while (g.measureText(name).width > maxW && fs > 10) { fs -= 2; g.font = `${fs}px "Great Vibes", "Mountains of Christmas", cursive`; }
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const y = H * (+yPct || 39) / 100 - H * .008;
  g.shadowColor = 'rgba(255,255,255,.9)'; g.shadowBlur = fs * .12;
  g.fillStyle = '#8f1323'; g.fillText(name, W / 2, y);
  return cv.toDataURL('image/jpeg', .92);
}

// (V22.7) imprimir o guardar una imagen
// (V26.3) la imagen como archivo, preparada ANTES de que la persona toque el botón (el iPhone solo deja compartir justo al tocar)
export async function imageFile(src, file = 'regalo.jpg') {
  const blob = await (await fetch(src)).blob();
  return new File([blob], file, { type: blob.type || 'image/jpeg' });
}
const isIOSApp = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  || navigator.standalone || matchMedia('(display-mode: standalone)').matches;
// (V26.4) iPhone/iPad: el menú de compartir a veces se cierra solo al elegir «Guardar en Archivos».
// Lo que funciona SIEMPRE es mantener el dedo sobre la imagen → «Guardar en Fotos» (o «Compartir» → «Imprimir»).
// Por eso se abre una ventana con la imagen grande y los pasos, y un botón para compartir por si se prefiere.
export function saveView(src, file = 'regalo.jpg', { print = false, ready = null } = {}) {
  document.querySelector('.sv-back')?.remove();
  const L3 = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
  const steps = print
    ? [L3('Mantén el dedo encima de la imagen', 'Mantén el dit damunt la imatge', 'Press and hold the picture'), L3('Toca «Compartir»', 'Toca «Comparteix»', 'Tap “Share”'), L3('Desliza hacia abajo y toca «Imprimir»', 'Llisca avall i toca «Imprimeix»', 'Scroll down and tap “Print”')]
    : [L3('Mantén el dedo encima de la imagen', 'Mantén el dit damunt la imatge', 'Press and hold the picture'), L3('Toca «Guardar en Fotos»', 'Toca «Desa a Fotos»', 'Tap “Save to Photos”'), L3('¡Ya la tienes en tus fotos! 📷', 'Ja la tens a les teves fotos! 📷', 'It’s in your photos! 📷')];
  const close = () => { back.classList.add('out'); setTimeout(() => back.remove(), 250); };
  const shareBtn = el('button', { type: 'button', class: 'btn btn-ghost no-delay', onclick: async () => {
    try { const f = ready || await imageFile(src, file); if (navigator.canShare?.({ files: [f] })) { await navigator.share({ files: [f] }); return; } } catch (e) { if (e?.name === 'AbortError') return; }
    toast(L3('Este aparato no deja compartir: usa el dedo sobre la imagen.', 'Aquest aparell no deixa compartir: fes servir el dit sobre la imatge.', 'Sharing not available: press and hold the picture.'), 4000);
  } }, '📤 ' + L3('Compartir (WhatsApp, correo…)', 'Compartir (WhatsApp, correu…)', 'Share (WhatsApp, email…)'));
  const card = el('div', { class: 'sv-card' },
    el('h2', {}, (print ? '🖨️ ' + L3('Imprimir', 'Imprimir', 'Print') : '💾 ' + L3('Guardar', 'Desar', 'Save'))),
    el('img', { class: 'sv-img', src, alt: file }),
    el('ol', { class: 'sv-steps' }, ...steps.map(x => el('li', {}, x))),
    el('div', { class: 'sv-btns' }, shareBtn, el('button', { type: 'button', class: 'btn no-delay', onclick: close }, '✔️ ' + L3('Hecho', 'Fet', 'Done'))));
  const back = el('div', { class: 'sv-back' }, card);
  back.addEventListener('click', e => { if (e.target === back) close(); });
  document.body.append(back);
}
export async function printImage(src, file = 'regalo.jpg', ready = null) {
  if (isIOSApp()) return saveView(src, file, { print: true, ready });
  // ordenador (y Android): se imprime directamente solo la imagen
  document.querySelectorAll('.print-only').forEach(x => x.remove());
  const box = document.createElement('div'); box.className = 'print-only';
  const im = new Image(); im.src = src; box.append(im); document.body.append(box);
  const go = () => { document.body.classList.add('printing'); setTimeout(() => { try { window.print(); } catch {} setTimeout(() => { document.body.classList.remove('printing'); box.remove(); }, 800); }, 120); };
  im.complete ? go() : (im.onload = go);
}
export async function saveImage(src, file = 'certificado.jpg', ready = null) {
  if (isIOSApp()) return saveView(src, file, { ready });
  // ordenador y Android: se descarga el archivo
  try {
    const f = ready || await imageFile(src, file);
    const u = URL.createObjectURL(f);
    const a = document.createElement('a'); a.href = u; a.download = file; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 60000);
    toast('💾 ' + ({ es: 'Guardado en Descargas', ca: 'Desat a Baixades', en: 'Saved to Downloads' })[getLang()], 3500);
  } catch { const a = document.createElement('a'); a.href = src; a.download = file; document.body.append(a); a.click(); a.remove(); }
}
