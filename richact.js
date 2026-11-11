// Actividades con texto enriquecido (títulos de colores, emojis) y fotos/vídeos
import { el, sleep, popup, toast } from './fx.js?v=17.14';
import { store } from './store.js?v=17.14';

// ---------- limpieza del HTML (solo etiquetas y estilos seguros)
const OK_TAGS = new Set(['H2', 'H3', 'P', 'DIV', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'SPAN', 'FONT', 'UL', 'OL', 'LI']);
export function sanitize(html) {
  const tpl = document.createElement('template'); tpl.innerHTML = String(html || '');
  const walk = node => {
    [...node.childNodes].forEach(ch => {
      if (ch.nodeType === 3) return;
      if (ch.nodeType !== 1 || !OK_TAGS.has(ch.tagName)) {
        if (ch.nodeType === 1 && !['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT'].includes(ch.tagName)) { walk(ch); ch.replaceWith(...ch.childNodes); }
        else ch.remove();
        return;
      }
      const color = ch.style?.color || ch.getAttribute('color');
      [...ch.attributes].forEach(a => ch.removeAttribute(a.name));
      if (color && /^(#[0-9a-f]{3,8}|rgb\([\d ,.]+\))$/i.test(color.trim())) ch.style.color = color;
      walk(ch);
    });
  };
  walk(tpl.content);
  return tpl.innerHTML;
}
const isRich = s => /<\w+[^>]*>/.test(s || '');
export const plain = s => { const d = document.createElement('div'); d.innerHTML = sanitize(s); return d.textContent; };

// ---------- mostrar el texto apareciendo letra a letra (también con títulos y colores)
export async function typeRich(node, html, speed = 24) {
  if (!isRich(html)) html = String(html || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(/\n/g, '<br>');
  node.innerHTML = sanitize(html);
  const texts = []; const w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) texts.push(w.currentNode);
  const full = texts.map(t => t.data); texts.forEach(t => t.data = '');
  const cursor = el('span', { class: 'tw-cursor' }, '▍');
  for (let i = 0; i < texts.length; i++) {
    const tnode = texts[i]; tnode.after(cursor);
    for (const ch of [...full[i]]) {
      tnode.data += ch;
      if (node._skip) continue;
      await sleep('.!?'.includes(ch) ? speed * 6 : ch === ',' ? speed * 3 : speed);
    }
  }
  cursor.remove();
}

// ---------- galería de miniaturas + ampliar
export const ytId = s => (String(s).match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/) || [])[1];
function mediaEl(m, big) {
  if (m.kind === 'video') {
    const id = ytId(m.src);
    if (id) return big ? el('iframe', { class: 'mv-video', src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`, allow: 'autoplay; encrypted-media; fullscreen', allowfullscreen: true })
      : el('div', { class: 'mv-thumb-video', style: `background-image:url(https://img.youtube.com/vi/${id}/hqdefault.jpg)` }, el('span', {}, '▶'));
    return big ? el('video', { class: 'mv-video', src: m.src, controls: true, autoplay: true, playsinline: true })
      : el('div', { class: 'mv-thumb-video' }, el('span', {}, '▶'));
  }
  return el('img', { src: m.src, alt: '', class: big ? 'mv-big' : '' });
}
export function gallery(items) {
  if (!items?.length) return null;
  return el('div', { class: 'mv-gallery' }, ...items.map((m, i) => el('button', { class: 'mv-thumb no-delay', onclick: () => lightbox(items, i) }, mediaEl(m, false))));
}
export function lightbox(items, i) {
  let k = i;
  const stage = el('div', { class: 'mv-stage' });
  const show = () => stage.replaceChildren(mediaEl(items[k], true));
  const back = el('div', { class: 'mv-lightbox' },
    stage,
    items.length > 1 ? el('button', { class: 'mv-nav prev no-delay', onclick: e => { e.stopPropagation(); k = (k + items.length - 1) % items.length; show(); } }, '‹') : null,
    items.length > 1 ? el('button', { class: 'mv-nav next no-delay', onclick: e => { e.stopPropagation(); k = (k + 1) % items.length; show(); } }, '›') : null,
    el('button', { class: 'mv-close no-delay', onclick: () => back.remove() }, '✕'));
  back.addEventListener('click', e => { if (e.target === back || e.target === stage) back.remove(); });
  show(); document.body.append(back);
}

// ---------- reducir fotos para guardarlas (máx. 1200 px)
export async function shrink(file, max = 1200, limit = 700000) {
  const url = URL.createObjectURL(file);
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const s = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
  let q = .8, out = c.toDataURL('image/jpeg', q);
  while (out.length > limit && q > .35) { q -= .1; out = c.toDataURL('image/jpeg', q); }
  return out;
}

// ---------- editor de la actividad (ventana para la administradora)
const EMOJIS = '🎄🎅🤶🦌⛄❄️☃️🎁🎀🔔🕯️⭐🌟✨🍪🥛☕🍫🧦🧤🧣🛷🎶🎵🎉🥳😄😂🤣😍🥰😘😉😎🤩🤗🙌👏👍❤️💚💛💙🧡💜🏠🌲🍬🍭🎈📸📱🎤💃🕺🐧🦊🐻🧸🚂👨‍👩‍👧‍👦'.match(/\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*/gu);
const COLORS = ['#b3122e', '#1f6b45', '#c99a2e', '#1d4ed8', '#7c3aed', '#db2777', '#ea580c', '#0f766e', '#111111', '#6b4423'];

export function openActEditor({ day, actKey, title, html, langName }) {
  return new Promise(async resolve => {
    let color = COLORS[0];
    const ed = el('div', { class: 'rich-editor', contenteditable: 'true' });
    ed.innerHTML = isRich(html) ? sanitize(html) : String(html || '').replace(/\n/g, '<br>');
    const cmd = (c, v) => { ed.focus(); document.execCommand(c, false, v); };
    const curBlock = () => { const n = getSelection().anchorNode; const e = n && (n.nodeType === 1 ? n : n.parentElement); return e && ed.contains(e) ? e.closest('h2, h3') : null; };
    // pinta: si hay texto seleccionado, ese texto; si no, el título donde está el cursor
    const paint = c => { const sel = getSelection(); if (sel.isCollapsed) { const b = curBlock(); if (b) b.style.color = c; } else cmd('foreColor', c); };
    const heading = tag => { cmd('formatBlock', `<${tag}>`); const b = curBlock(); if (b) b.style.color = color; };
    const tb = (label, fn, t = '') => el('button', { type: 'button', class: 'tb-btn no-delay', title: t, onmousedown: e => e.preventDefault(), onclick: fn }, label);
    const swatches = el('div', { class: 'tb-colors' }, ...COLORS.map(c => el('button', { type: 'button', class: 'tb-color no-delay', style: `background:${c}`, title: 'Color',
      onmousedown: e => e.preventDefault(), onclick: ev => { color = c; paint(c); [...swatches.children].forEach(b => b.classList.toggle('sel', b === ev.currentTarget)); } })));
    const emojiBox = el('div', { class: 'tb-emojis', style: 'display:none' }, ...EMOJIS.map(e => el('button', { type: 'button', class: 'no-delay', onmousedown: ev => ev.preventDefault(), onclick: () => cmd('insertText', e) }, e)));
    const toolbar = el('div', { class: 'rich-toolbar' },
      tb('T', () => heading('h2'), 'Título grande'),
      tb('t', () => heading('h3'), 'Subtítulo'),
      tb('¶', () => cmd('formatBlock', '<p>'), 'Texto normal'),
      tb(el('b', {}, 'B'), () => cmd('bold'), 'Negrita'),
      tb(el('i', {}, 'I'), () => cmd('italic'), 'Cursiva'),
      tb('😀', () => { emojiBox.style.display = emojiBox.style.display === 'none' ? '' : 'none'; }, 'Emojis'),
      swatches);
    // fotos y vídeos
    let media = null;
    const mediaBox = el('div', { class: 'ed-media' }, el('p', { class: 'muted', style: 'margin:0' }, '❄ Cargando fotos…'));
    const drawMedia = () => mediaBox.replaceChildren(...media.map(m => el('div', { class: 'ed-thumb' }, mediaEl(m, false),
      el('button', { type: 'button', class: 'ed-del no-delay', title: 'Borrar', onclick: async () => {
        if (!(await popup('<p>¿Borrar esta foto o vídeo?</p>', { buttons: [{ label: 'No', value: false, cls: 'btn-ghost' }, { label: 'Sí, borrar', value: true }] }))) return;
        await store.deleteMedia(day, m.id); media = media.filter(x => x !== m); drawMedia();
      } }, '✕'))),
      ...(media.length ? [] : [el('p', { class: 'muted', style: 'margin:0' }, 'Aún no hay fotos ni vídeos.')]));
    store.getMedia(day).then(list => { media = list.filter(m => m.act === actKey); drawMedia(); }).catch(() => { media = []; drawMedia(); });
    const fileIn = el('input', { type: 'file', accept: 'image/*', multiple: true, style: 'display:none', onchange: async () => {
      const files = [...fileIn.files]; fileIn.value = '';
      for (const f of files) {
        try {
          toast('📤 Subiendo ' + f.name + '…', 1500);
          const src = await shrink(f); const item = { act: actKey, kind: 'img', src, order: Date.now() };
          item.id = await store.addMedia(day, item); (media = media || []).push(item); drawMedia(); toast('📷 Foto guardada');
        } catch (e) { toast('No se ha podido subir ' + f.name + ': ' + (e.code || e.message), 6000); }
      }
    } });
    const addVideo = async () => {
      const inp = el('input', { type: 'text', placeholder: 'https://www.youtube.com/watch?v=…  o  baile.mp4' });
      setTimeout(() => inp.focus(), 50);
      const ok = await popup(el('div', { class: 'settings-form' }, el('h2', {}, '🎥 Añadir vídeo'),
        el('p', {}, 'Pega el enlace de un vídeo de YouTube, o escribe el nombre de un vídeo que hayas subido a GitHub junto a los demás archivos (por ejemplo baile.mp4).'), inp),
        { buttons: [{ label: 'Cancelar', value: false, cls: 'btn-ghost no-delay' }, { label: '➕ Añadir', value: true, cls: 'no-delay' }] });
      const v = inp.value.trim(); if (!ok || !v) return;
      if (!/^https?:\/\//.test(v) && !/\.(mp4|mov|m4v|webm)$/i.test(v)) return toast('Eso no parece un enlace de YouTube ni un nombre de vídeo (.mp4)', 5000);
      try { const item = { act: actKey, kind: 'video', src: v, order: Date.now() }; item.id = await store.addMedia(day, item); (media = media || []).push(item); drawMedia(); toast('🎥 Vídeo añadido'); }
      catch (e) { toast('Error: ' + (e.code || e.message), 6000); }
    };
    const box = el('div', { class: 'act-editor' },
      el('h2', {}, '✏️ ' + title),
      el('p', { class: 'muted' }, `Día ${day} · texto en ${langName}. Escribe todo lo que quieras; usa T para títulos, el color para pintarlos y 😀 para emojis (o los del teclado).`),
      toolbar, emojiBox, ed,
      el('h3', {}, '📷 Fotos y vídeos'),
      mediaBox,
      el('div', { class: 'media-btns' },
        el('button', { type: 'button', class: 'btn media-btn no-delay', title: 'Añadir fotos', onclick: () => fileIn.click() }, '📷', el('small', {}, 'Fotos')),
        el('button', { type: 'button', class: 'btn media-btn no-delay', title: 'Añadir vídeo', onclick: addVideo }, '🎥', el('small', {}, 'Vídeo')), fileIn),
      el('p', { class: 'muted' }, 'Las fotos se guardan al momento. Los vídeos se ponen con un enlace de YouTube o subiendo el vídeo a GitHub y escribiendo su nombre.'));
    const ok = await popup(box, { cls: 'wide', buttons: [{ label: 'Cancelar', value: false, cls: 'btn-ghost no-delay' }, { label: '💾 Guardar texto', value: true, cls: 'no-delay' }] });
    resolve(ok ? sanitize(ed.innerHTML).replace(/^(<br>|\s)+|(<br>|\s)+$/g, '') : null);
  });
}
