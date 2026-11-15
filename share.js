// Cartel navideño con el resultado de una partida (foto para el grupo de WhatsApp de la familia).
// shareResult({ title, emoji, who, rows: [[etiqueta, valor]…], note, file, text })
import { el, popup, toast } from './fx.js?v=22.6';
import { getLang } from './i18n.js?v=22.6';

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
  // tarjeta con los datos
  const top = Math.max(y, 560), cardH = Math.min(H - top - 150, 150 + rows.length * 92);
  const rr = (x, yy, w, h, r) => { g.beginPath(); g.moveTo(x + r, yy); g.arcTo(x + w, yy, x + w, yy + h, r); g.arcTo(x + w, yy + h, x, yy + h, r); g.arcTo(x, yy + h, x, yy, r); g.arcTo(x, yy, x + w, yy, r); g.closePath(); };
  g.fillStyle = '#fffaf0'; g.strokeStyle = '#f2c14e'; g.lineWidth = 8; rr(110, top, W - 220, cardH, 46); g.fill(); g.stroke();
  g.fillStyle = '#7a1020'; g.font = '700 70px "Mountains of Christmas", cursive'; g.fillText(who || '', W / 2, top + 90);
  let ry = top + 170;
  rows.forEach(([k, v]) => {
    g.textAlign = 'left'; g.fillStyle = '#b8862b'; g.font = '700 34px Montserrat, sans-serif'; g.fillText(String(k), 160, ry);
    g.textAlign = 'right'; g.fillStyle = '#b3122e'; g.font = '800 40px Montserrat, sans-serif';
    let v2 = String(v); while (g.measureText(v2).width > 520 && v2.length > 4) v2 = v2.slice(0, -2) + '…'; g.fillText(v2, W - 160, ry);
    ry += 92;
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
