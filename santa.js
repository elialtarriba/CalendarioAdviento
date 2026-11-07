// Día 25: tu cara en Papá Noel + felicitación con letras, confeti y luces
import { t, getLang } from './i18n.js?v=17.9';
import { el, sleep, confetti, popup, toast } from './fx.js?v=17.9';
import { chime, jingle, speak, hohoho } from './sound.js?v=17.9';
import { S } from './app.js?v=17.9';
import { store } from './store.js?v=17.9';

const W = 882, H = 1192, FACE = { x: 458, y: 500, rx: 215, ry: 185 };
const BULBS = ['#ff3b3b', '#ffd23b', '#3bff6a', '#3bb6ff', '#ff7af0'];

function bulbPositions() {
  const out = [];
  for (let i = 0; i <= 16; i++) out.push([20 + i * (W - 40) / 16, 26 + Math.sin(i * .9) * 10]);
  for (let i = 1; i <= 20; i++) out.push([W - 22, 26 + i * (H - 52) / 21]);
  for (let i = 16; i >= 0; i--) out.push([20 + i * (W - 40) / 16, H - 24 + Math.sin(i * .9) * 8]);
  for (let i = 20; i >= 1; i--) out.push([22, 26 + i * (H - 52) / 21]);
  return out;
}
const BP = bulbPositions();
const TPL = new Image(); TPL.src = 'santa-plantilla.png';

function drawSanta(c, st) {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d1f45'); g.addColorStop(.6, '#1e4a8a'); g.addColorStop(1, '#2d6ab5');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (st.glow) { const rg = c.createRadialGradient(W / 2, 520, 60, W / 2, 520, 620); rg.addColorStop(0, `rgba(255,220,120,${.6 * st.glow})`); rg.addColorStop(1, 'rgba(255,220,120,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, H); }
  c.fillStyle = '#ffffffcc'; for (let i = 0; i < 110; i++) { c.beginPath(); c.arc((i * 211) % W, (i * 137) % H, (i % 3) + 1.2, 0, 7); c.fill(); }
  // la cara (foto) va DETRÁS de la plantilla, que tiene el hueco
  if (st.photo) {
    // solo se ve la zona de la cara: el resto de la foto (paisaje, etc.) queda escondido
    const iw = st.photo.width * st.sc, ih = st.photo.height * st.sc;
    c.save(); c.beginPath(); c.ellipse(FACE.x, FACE.y + 5, 228, 200, 0, 0, 7); c.clip();
    c.drawImage(st.photo, FACE.x - iw / 2 + st.ox, FACE.y - ih / 2 + st.oy, iw, ih);
    c.restore();
  } else {
    c.save(); c.beginPath(); c.ellipse(FACE.x, FACE.y, FACE.rx, FACE.ry, 0, 0, 7); c.fillStyle = '#f2c9a5'; c.fill();
    c.fillStyle = '#7a4a2a'; c.font = 'bold 150px Montserrat, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', FACE.x, FACE.y - 20); c.restore();
  }
  if (TPL.complete && TPL.naturalWidth) c.drawImage(TPL, 0, 0, W, H);
  const n = Math.round(st.bulbs * BP.length);
  if (n) {
    c.strokeStyle = '#1b3b1b'; c.lineWidth = 3; c.beginPath(); BP.slice(0, n).forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
    BP.slice(0, n).forEach(([x, y], i) => {
      const col = BULBS[i % BULBS.length]; const on = (i + (st.phase || 0)) % 2 === 0;
      if (on) { const rg = c.createRadialGradient(x, y, 2, x, y, 28); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = rg; c.beginPath(); c.arc(x, y, 28, 0, 7); c.fill(); }
      c.fillStyle = on ? col : col + '77'; c.beginPath(); c.ellipse(x, y + 4, 8, 11, 0, 0, 7); c.fill();
    });
  }
  if (st.text) {
    c.save(); c.fillStyle = 'rgba(160,10,30,.82)'; c.beginPath(); c.roundRect(70, 1000, W - 140, 140, 30); c.fill();
    c.font = '110px "Great Vibes", cursive'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = '#ffb300'; c.shadowBlur = 24; c.fillStyle = '#fff7d0'; c.fillText(st.text, W / 2, 1072); c.restore();
  }
}

export function render(body, ctx) {
  // al pulsar «Finalizar» con la foto hecha: se ve la foto en un marco antes de salir
  const fin = ctx.finishBtn.onclick;
  ctx.finishBtn.onclick = async () => {
    const img = S.card;
    if (img) await popup(el('div', { class: 'sf-pop' },
      el('div', { class: 'sf-lights' }, ...Array.from({ length: 14 }, (_, i) => el('i', { style: `--i:${i}` }))),
      el('h2', {}, '🎄 ' + t('merry') + (S.profile?.name ? ', ' + S.profile.name : '') + ' 🎄'),
      el('div', { class: 'sf-frame' }, el('img', { src: img, alt: '' }))),
      { cls: 'small sf-popup', buttons: [{ label: t('exitFull'), value: true }] });
    fin();
  };

  const cv = el('canvas', { width: W, height: H });
  const c = cv.getContext('2d');
  const letters = el('div', { class: 'santa-letters' });
  const stage = el('div', { class: 'santa-stage' }, cv, letters);
  const st = { photo: null, ox: 0, oy: 0, sc: 1, bulbs: 0, glow: 0, text: '' };
  const redraw = () => drawSanta(c, st);
  document.fonts?.load?.('110px "Great Vibes"').then(redraw).catch(() => {});
  TPL.onload = redraw; redraw();

  const intro = el('p', { class: 'game-help' }, '🎅 ' + t('d25intro'));
  const fileIn = el('input', { type: 'file', accept: 'image/*' });
  const upBtn = el('label', { class: 'btn file-btn' }, '📷 ' + t('d25upload'), fileIn);
  const size = el('input', { type: 'range', min: 10, max: 300, value: 100 });
  const sizeLbl = el('label', { style: 'display:none' }, t('d25size') + ' ', size);
  const magic = el('button', { class: 'btn btn-green', style: 'display:none' }, '✨ ' + t('d25magic'));
  const adjust = el('p', { class: 'game-help muted', style: 'display:none' }, t('d25adjust'));
  const out = el('div', { class: 'santa-controls' });
  const controls = el('div', { class: 'santa-controls' }, upBtn, sizeLbl, magic);
  body.append(el('div', { class: 'santa' }, el('h2', { class: 'q-title' }, '🎄 ' + t('d25title') + ' 🎄'), intro, controls, adjust, out, stage));

  // día 25 ya hecho: solo tu foto de Papá Noel, lista para enviar, guardar o imprimir
  if (ctx.prev && S.card) { intro.remove(); adjust.remove(); stage.replaceChildren(el('img', { src: S.card, style: 'width:100%;display:block' })); stage.style.aspectRatio = 'auto'; controls.remove(); showOutputs(S.card); return; }

  fileIn.onchange = () => {
    const f = fileIn.files[0]; if (!f) return;
    const img = new Image();
    img.onload = () => {
      st.photo = img; st.base = Math.max((FACE.rx * 2.3) / img.width, (FACE.ry * 2.6) / img.height); st.sc = st.base; st.ox = 0; st.oy = 0; size.value = 100;
      redraw(); intro.style.display = 'none'; sizeLbl.style.display = adjust.style.display = magic.style.display = ''; upBtn.firstChild.textContent = '📷 ' + t('d25other') + ' ';
    };
    img.src = URL.createObjectURL(f);
  };
  size.max = 400; size.oninput = () => { st.sc = st.base * size.value / 100; redraw(); };
  // un dedo: mover · dos dedos: pellizcar para hacer grande o pequeña
  const pts = new Map(); let g0 = null;
  const k = () => W / cv.getBoundingClientRect().width;
  const gesture = () => {
    const p = [...pts.values()];
    if (p.length >= 2) return { mx: (p[0].x + p[1].x) / 2, my: (p[0].y + p[1].y) / 2, d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) };
    return { mx: p[0].x, my: p[0].y, d: 0 };
  };
  const start = () => { g0 = { ...gesture(), ox: st.ox, oy: st.oy, sc: st.sc }; };
  cv.addEventListener('pointerdown', e => { if (!st.photo || st.locked) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch {} pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); start(); });
  cv.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId) || !g0) return; e.preventDefault();
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture();
    if (g.d && g0.d) {
      st.sc = Math.max(st.base * .1, Math.min(st.base * 4, g0.sc * g.d / g0.d));
      size.value = Math.round(st.sc / st.base * 100);
    }
    st.ox = g0.ox + (g.mx - g0.mx) * k(); st.oy = g0.oy + (g.my - g0.my) * k(); redraw();
  });
  ['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, e => { pts.delete(e.pointerId); if (pts.size) start(); else g0 = null; }));
  cv.addEventListener('wheel', e => { if (!st.photo) return; e.preventDefault(); size.value = Math.max(10, Math.min(300, +size.value - Math.sign(e.deltaY) * 5)); size.oninput(); }, { passive: false });

  magic.onclick = async () => {
    st.locked = true; controls.remove(); adjust.remove(); intro.style.display = 'none';
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
      s.style.left = s.dataset.fx + 'px'; s.style.top = (1072 * k - fs * .62) + 'px'; s.style.transform = 'rotate(0)';
    }, i * 90));
    await sleep(spans.length * 90 + 1700);
    st.text = text; redraw(); letters.replaceChildren();
    chime(); confetti(350, { frames: 360 }); setTimeout(() => confetti(250), 1200);
    hohoho(getLang()); setTimeout(() => speak(text, getLang()), 4600);
    // se van encendiendo las luces
    for (let i = 1; i <= 40; i++) { st.bulbs = i / 40; st.glow = i / 40; redraw(); await sleep(60); }
    let ph = 0; const blink = setInterval(() => { st.phase = ++ph; redraw(); }, 700);
    ctx.finishBtn.addEventListener('click', () => clearInterval(blink));
    await sleep(800);
    const full = cv.toDataURL('image/png');
    // copia pequeña para el cartel de la portada
    const sm = document.createElement('canvas'); sm.width = 662; sm.height = 894; sm.getContext('2d').drawImage(cv, 0, 0, 662, 894);
    const small = sm.toDataURL('image/jpeg', .85);
    S.card = small;
    store.saveCard(ctx.user.uid, small).catch(e => console.warn(e));
    ctx.submit({ answer: '🎅', status: 'correct' });
    showOutputs(full);
  };

  function showOutputs(url) {
    // la imagen se prepara como archivo para que el móvil pueda guardarla o compartirla
    let blob = null;
    fetch(url).then(r => r.blob()).then(b => { blob = b; }).catch(() => {});
    const name = 'feliz-navidad.png';
    const save = el('button', { class: 'btn no-delay', onclick: async () => {
      try {
        const b = blob || await (await fetch(url)).blob();
        const file = new File([b], name, { type: b.type || 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: t('merry') }); return; }
        const u = URL.createObjectURL(b);
        const a = el('a', { href: u, download: name, style: 'display:none' }); document.body.append(a); a.click();
        setTimeout(() => { a.remove(); URL.revokeObjectURL(u); }, 4000);
      } catch (e) { if (e.name !== 'AbortError') showBig(url); }
    } }, '💾 ' + t('d25save'));
    const print = el('button', { class: 'btn btn-green no-delay', onclick: async () => {
      // iPhone/iPad: imprimir desde la app no está permitido, pero el menú de compartir tiene «Imprimir»
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (iOS || navigator.standalone || matchMedia('(display-mode: standalone)').matches) {
        try {
          const b = blob || await (await fetch(url)).blob();
          const file = new File([b], name, { type: b.type || 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) { toast('🖨️ ' + t('d25printHint'), 5000); await navigator.share({ files: [file] }); return; }
        } catch (e) { if (e.name === 'AbortError') return; }
      }
      // ordenador: se imprime desde un marco aparte que solo contiene la imagen
      const fr = el('iframe', { style: 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0' });
      document.body.append(fr);
      const d = fr.contentWindow.document;
      d.open(); d.write(`<!doctype html><html><head><meta charset="utf-8"><style>@page{margin:10mm}html,body{margin:0;height:100%}body{display:flex;align-items:center;justify-content:center}img{max-width:100%;max-height:100%}</style></head><body><img src="${url}"></body></html>`); d.close();
      const go = () => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch { window.print(); } setTimeout(() => fr.remove(), 60000); };
      const img = d.querySelector('img'); if (img.complete) setTimeout(go, 200); else img.onload = () => setTimeout(go, 200);
    } }, '🖨️ ' + t('d25print'));
    const share = el('button', { class: 'btn no-delay', style: 'background:linear-gradient(#25d366,#128c4a);box-shadow:0 4px 0 #0b5e31', onclick: async () => {
      try {
        const b = blob || await (await fetch(url)).blob();
        const file = new File([b], name, { type: b.type || 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], text: t('d25shareText') });
        else { save.click(); setTimeout(() => { location.href = 'whatsapp://send?text=' + encodeURIComponent(t('d25shareText')); }, 800); }
      } catch (e) { if (e.name !== 'AbortError') showBig(url); }
    }, html: '<svg viewBox="0 0 32 32" width="20" height="20" style="vertical-align:-4px;margin-right:6px"><path fill="#fff" d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm0 23.6c-2 0-4-.6-5.7-1.6l-.4-.2-3.9 1 1-3.8-.3-.4A10.6 10.6 0 1 1 16 26.6zm5.8-7.9c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7 0a8.7 8.7 0 0 1-4.3-3.8c-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.6 3.6 0 0 0-1.1 2.7 6.3 6.3 0 0 0 1.3 3.3 14.4 14.4 0 0 0 5.5 4.9c2 .9 2.8 1 3.9.8a3.3 3.3 0 0 0 2.1-1.5 2.7 2.7 0 0 0 .2-1.5c-.1-.2-.3-.3-.6-.4z"/></svg>' + t('d25shareBtn') });
    out.replaceChildren(el('p', { class: 'd25-family' }, '👨‍👩‍👧‍👦 ' + t('d25family')), share, save, print,
      el('p', { class: 'muted', style: 'width:100%;margin:4px 0 0;font-size:13px' }, t('d25saveHelp')));
  }
  // si el móvil no deja guardar: se abre la imagen en grande para mantenerla pulsada y guardarla
  function showBig(url) {
    popup(el('div', {}, el('img', { src: url, style: 'width:100%;border-radius:12px' }), el('p', {}, t('d25saveHelp'))), { outside: true, buttons: [{ label: t('close'), value: true }] });
  }

}
