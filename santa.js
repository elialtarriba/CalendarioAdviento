// Día 25: tu cara en Papá Noel + felicitación con letras, confeti y luces
import { t, getLang } from './i18n.js';
import { el, sleep, confetti } from './fx.js';
import { chime, jingle, speak } from './sound.js';
import { S } from './app.js';
import { store } from './store.js';

const W = 800, H = 1000, FACE = { x: 400, y: 450, rx: 112, ry: 140 };
const BULBS = ['#ff3b3b', '#ffd23b', '#3bff6a', '#3bb6ff', '#ff7af0'];

function bulbPositions() {
  const out = [];
  for (let i = 0; i <= 14; i++) out.push([20 + i * (W - 40) / 14, 28 + Math.sin(i * .9) * 10]);
  for (let i = 1; i <= 16; i++) out.push([W - 22, 28 + i * (H - 56) / 17]);
  for (let i = 14; i >= 0; i--) out.push([20 + i * (W - 40) / 14, H - 26 + Math.sin(i * .9) * 8]);
  for (let i = 16; i >= 1; i--) out.push([22, 28 + i * (H - 56) / 17]);
  return out;
}
const BP = bulbPositions();

function drawSanta(c, st) {
  // fondo
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d1f45'); g.addColorStop(.6, '#1e4a8a'); g.addColorStop(1, '#2d6ab5');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (st.glow) { const rg = c.createRadialGradient(400, 480, 50, 400, 480, 520); rg.addColorStop(0, `rgba(255,220,120,${.55 * st.glow})`); rg.addColorStop(1, 'rgba(255,220,120,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, H); }
  c.fillStyle = '#ffffffcc'; for (let i = 0; i < 90; i++) { c.beginPath(); c.arc((i * 211) % W, (i * 137) % H, (i % 3) + 1.2, 0, 7); c.fill(); }
  c.fillStyle = '#f4f8ff'; c.beginPath(); c.ellipse(400, 1010, 520, 120, 0, 0, 7); c.fill();
  // abrigo
  c.fillStyle = '#c8102e';
  c.beginPath(); c.moveTo(130, H); c.bezierCurveTo(120, 760, 230, 660, 400, 650); c.bezierCurveTo(570, 660, 680, 760, 670, H); c.closePath(); c.fill();
  c.fillStyle = '#a00d24'; c.beginPath(); c.moveTo(130, H); c.bezierCurveTo(140, 820, 190, 760, 230, 740); c.lineTo(240, H); c.fill();
  c.beginPath(); c.moveTo(670, H); c.bezierCurveTo(660, 820, 610, 760, 570, 740); c.lineTo(560, H); c.fill();
  c.fillStyle = '#fff'; c.fillRect(372, 700, 56, 300);
  c.fillStyle = '#1b1b1b'; c.fillRect(150, 890, 500, 46); c.fillStyle = '#e8b64c'; c.fillRect(365, 882, 70, 62); c.fillStyle = '#1b1b1b'; c.fillRect(382, 897, 36, 32);
  // cara (foto o silueta)
  c.save(); c.beginPath(); c.ellipse(FACE.x, FACE.y, FACE.rx, FACE.ry, 0, 0, 7); c.clip();
  if (st.photo) {
    const iw = st.photo.width * st.sc, ih = st.photo.height * st.sc;
    c.drawImage(st.photo, FACE.x - iw / 2 + st.ox, FACE.y - ih / 2 + st.oy, iw, ih);
  } else {
    c.fillStyle = '#f2c9a5'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#e8a98a'; c.beginPath(); c.arc(330, 500, 22, 0, 7); c.arc(470, 500, 22, 0, 7); c.fill();
    c.fillStyle = '#7a4a2a'; c.font = 'bold 120px Montserrat, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', 400, 460);
  }
  c.restore();
  // barba (lienzo aparte, con el hueco de la cara)
  const b = document.createElement('canvas'); b.width = W; b.height = H; const bc = b.getContext('2d');
  bc.fillStyle = '#ffffff';
  bc.beginPath(); bc.ellipse(400, 540, 185, 225, 0, 0, 7); bc.fill();
  for (let a = 0; a < 360; a += 14) { const r = a * Math.PI / 180; const x = 400 + Math.cos(r) * 185, y = 540 + Math.sin(r) * 225; if (y > 380) { bc.beginPath(); bc.arc(x, y, 34, 0, 7); bc.fill(); } }
  bc.strokeStyle = '#e6ecf3'; bc.lineWidth = 3;
  for (let i = 0; i < 26; i++) { const x = 240 + i * 12.5; bc.beginPath(); bc.moveTo(x, 560); bc.quadraticCurveTo(x + 8, 680, x - 4 + (i % 3) * 4, 740 - Math.abs(13 - i) * 4); bc.stroke(); }
  bc.globalCompositeOperation = 'destination-out';
  bc.fillRect(0, 0, W, 360);
  bc.beginPath(); bc.ellipse(FACE.x, FACE.y - 6, FACE.rx - 6, FACE.ry - 10, 0, 0, 7); bc.fill();
  c.drawImage(b, 0, 0);
  // gorro
  c.fillStyle = '#c8102e';
  c.beginPath(); c.moveTo(265, 330); c.bezierCurveTo(280, 170, 420, 110, 560, 140); c.bezierCurveTo(640, 160, 670, 230, 650, 300); c.bezierCurveTo(610, 230, 560, 230, 530, 330); c.closePath(); c.fill();
  c.fillStyle = '#a00d24'; c.beginPath(); c.moveTo(520, 330); c.bezierCurveTo(540, 250, 600, 220, 650, 300); c.bezierCurveTo(600, 250, 560, 260, 535, 330); c.fill();
  c.fillStyle = '#fff';
  for (let x = 250; x <= 550; x += 22) { c.beginPath(); c.arc(x, 318 + Math.sin(x) * 3, 30, 0, 7); c.fill(); }
  c.beginPath(); c.arc(652, 308, 36, 0, 7); c.fill();
  // luces
  const n = Math.round(st.bulbs * BP.length);
  if (n) {
    c.strokeStyle = '#1b3b1b'; c.lineWidth = 3; c.beginPath(); BP.slice(0, n).forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
    BP.slice(0, n).forEach(([x, y], i) => {
      const col = BULBS[i % BULBS.length]; const on = (i + (st.phase || 0)) % 2 === 0;
      if (on) { const rg = c.createRadialGradient(x, y, 2, x, y, 26); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = rg; c.beginPath(); c.arc(x, y, 26, 0, 7); c.fill(); }
      c.fillStyle = on ? col : col + '77'; c.beginPath(); c.ellipse(x, y + 4, 7, 10, 0, 0, 7); c.fill();
    });
  }
  // texto final
  if (st.text) {
    c.font = '110px "Great Vibes", cursive'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = '#ffb300'; c.shadowBlur = 24; c.fillStyle = '#fff7d0'; c.fillText(st.text, 400, 800);
    c.shadowBlur = 0; c.lineWidth = 2; c.strokeStyle = '#7a4a00'; c.strokeText(st.text, 400, 800);
  }
}

export function render(body, ctx) {
  const cv = el('canvas', { width: W, height: H });
  const c = cv.getContext('2d');
  const letters = el('div', { class: 'santa-letters' });
  const stage = el('div', { class: 'santa-stage' }, cv, letters);
  const st = { photo: null, ox: 0, oy: 0, sc: 1, bulbs: 0, glow: 0, text: '' };
  const redraw = () => drawSanta(c, st);
  document.fonts?.load?.('110px "Great Vibes"').then(redraw).catch(() => {});
  redraw();

  const intro = el('p', { class: 'game-help' }, '🎅 ' + t('d25intro'));
  const fileIn = el('input', { type: 'file', accept: 'image/*' });
  const upBtn = el('label', { class: 'btn file-btn' }, '📷 ' + t('d25upload'), fileIn);
  const size = el('input', { type: 'range', min: 10, max: 300, value: 100 });
  const sizeLbl = el('label', { style: 'display:none' }, t('d25size') + ' ', size);
  const magic = el('button', { class: 'btn btn-green', style: 'display:none' }, '✨ ' + t('d25magic'));
  const adjust = el('p', { class: 'game-help muted', style: 'display:none' }, t('d25adjust'));
  const out = el('div', { class: 'santa-controls' });
  const controls = el('div', { class: 'santa-controls' }, upBtn, sizeLbl, magic);
  body.append(el('div', { class: 'santa' }, el('h2', { class: 'q-title' }, '🎄 ' + t('d25title') + ' 🎄'), intro, stage, adjust, controls, out));

  if (ctx.prev && S.card) { stage.replaceChildren(el('img', { src: S.card, style: 'width:100%;display:block' })); controls.remove(); showOutputs(S.card); return; }

  fileIn.onchange = () => {
    const f = fileIn.files[0]; if (!f) return;
    const img = new Image();
    img.onload = () => {
      st.photo = img; st.base = (FACE.ry * 2.3) / img.height; st.sc = st.base; st.ox = 0; st.oy = 0; size.value = 100;
      redraw(); sizeLbl.style.display = adjust.style.display = magic.style.display = ''; upBtn.firstChild.textContent = '📷 ';
    };
    img.src = URL.createObjectURL(f);
  };
  size.oninput = () => { st.sc = st.base * size.value / 100; redraw(); };
  let drag = null;
  cv.addEventListener('pointerdown', e => { if (!st.photo || st.locked) return; cv.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY, ox: st.ox, oy: st.oy }; });
  cv.addEventListener('pointermove', e => { if (!drag) return; const k = W / cv.getBoundingClientRect().width; st.ox = drag.ox + (e.clientX - drag.x) * k; st.oy = drag.oy + (e.clientY - drag.y) * k; redraw(); });
  ['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, () => drag = null));
  cv.addEventListener('wheel', e => { if (!st.photo) return; e.preventDefault(); size.value = Math.max(10, Math.min(300, +size.value - Math.sign(e.deltaY) * 5)); size.oninput(); }, { passive: false });

  magic.onclick = async () => {
    st.locked = true; controls.remove(); adjust.remove();
    jingle(2);
    const text = t('merry');
    const rect = stage.getBoundingClientRect(); const k = rect.width / W;
    const fs = 110 * k;
    // medir la anchura de cada letra en la fuente final
    c.font = '110px "Great Vibes", cursive';
    const widths = [...text].map(ch => c.measureText(ch).width * k);
    const total = widths.reduce((a, b) => a + b, 0);
    let x = rect.width / 2 - total / 2;
    const spans = [...text].map((ch, i) => {
      const s = el('span', { style: `font-size:${fs}px;left:${Math.random() * rect.width}px;top:${-fs * 2}px;transform:rotate(${Math.random() * 720 - 360}deg)` }, ch === ' ' ? ' ' : ch);
      s.dataset.fx = x; x += widths[i]; letters.append(s); return s;
    });
    await sleep(50);
    // caen y se quedan desordenadas
    spans.forEach((s, i) => setTimeout(() => {
      s.style.left = Math.random() * (rect.width - fs) + 'px'; s.style.top = rect.height * (.15 + Math.random() * .7) + 'px';
      s.style.transform = `rotate(${Math.random() * 90 - 45}deg)`;
    }, i * 120));
    await sleep(spans.length * 120 + 1700);
    // se ordenan formando la frase
    spans.forEach((s, i) => setTimeout(() => {
      s.style.left = s.dataset.fx + 'px'; s.style.top = (800 * k - fs * .62) + 'px'; s.style.transform = 'rotate(0)';
    }, i * 90));
    await sleep(spans.length * 90 + 1700);
    st.text = text; redraw(); letters.replaceChildren();
    chime(); confetti(350, { frames: 360 }); setTimeout(() => confetti(250), 1200);
    speak(text, getLang(), { hoho: true });
    // se van encendiendo las luces
    for (let i = 1; i <= 40; i++) { st.bulbs = i / 40; st.glow = i / 40; redraw(); await sleep(60); }
    let ph = 0; const blink = setInterval(() => { st.phase = ++ph; redraw(); }, 700);
    ctx.finishBtn.addEventListener('click', () => clearInterval(blink));
    await sleep(800);
    const full = cv.toDataURL('image/png');
    // copia pequeña para el cartel de la portada
    const sm = document.createElement('canvas'); sm.width = 480; sm.height = 600; sm.getContext('2d').drawImage(cv, 0, 0, 480, 600);
    const small = sm.toDataURL('image/jpeg', .8);
    S.card = small;
    store.saveCard(ctx.user.uid, small).catch(e => console.warn(e));
    ctx.submit({ answer: '🎅', status: 'correct' });
    showOutputs(full);
  };

  function showOutputs(url) {
    out.replaceChildren(
      el('a', { class: 'btn', href: url, download: 'feliz-navidad.png', style: 'text-decoration:none' }, '💾 ' + t('d25save')),
      el('button', { class: 'btn btn-green', onclick: () => {
        const pa = el('div', { class: 'print-area' }, el('img', { src: url })); document.body.append(pa);
        setTimeout(() => { window.print(); setTimeout(() => pa.remove(), 500); }, 300);
      } }, '🖨️ ' + t('d25print')));
  }
}
