// Mensajes sorpresa: la administradora prepara un popup para una persona y un día concretos
import { el, popup, toast, confetti } from './fx.js?v=17.3';
import { store } from './store.js?v=17.3';
import { shrink, ytId, lightbox } from './richact.js?v=17.3';
import { chime } from './sound.js?v=17.3';

export const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// [nombre de la letra, grosor mínimo, grosor máximo, nombre para elegir]
const FONTS = {
  navidad: ['Mountains of Christmas', 400, 700, 'Navideña'],
  elegante: ['Playfair Display', 400, 900, 'Elegante'],
  moderna: ['Montserrat', 100, 900, 'Moderna'],
  redonda: ['Fredoka', 300, 700, 'Redonda'],
  caligrafia: ['Great Vibes', 400, 400, 'Caligrafía'],
};
const COLORS = ['#b3122e', '#e11d48', '#ea580c', '#c99a2e', '#facc15', '#1f6b45', '#16a34a', '#0f766e', '#1d4ed8', '#7c3aed', '#db2777', '#6b4423', '#111111', '#ffffff'];
const DEFAULT_TITLE = { text: '¡Sorpresa!', colors: [], color: '#b3122e', font: 'navidad', weight: 700, size: 13, x: 50, y: 10, rot: -4 };
const blank = () => ({ active: true, dates: [todayKey()], title: { ...DEFAULT_TITLE, colors: [] }, text: '', photos: [], video: '' });
const shortDate = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }); };

// ---------------------------------------------------------------- el título (cada letra con su color)
function titleEl(T) {
  const f = FONTS[T.font] || FONTS.navidad;
  const w = T.weight ?? 700, fw = Math.max(f[1], Math.min(f[2], w));
  const extra = Math.max(0, w - f[2]) / 100; // más grueso de lo que da la letra: se engorda con contorno
  const node = el('div', { class: 'sp-title' });
  node.style.cssText = `left:${T.x}%;top:${T.y}%;transform:translate(-50%,-50%) rotate(${T.rot || 0}deg);font-family:'${f[0]}',cursive;font-weight:${fw};font-size:${T.size || 13}cqw;`;
  if (extra) node.style.webkitTextStroke = `${(extra * .02).toFixed(3)}em currentColor`;
  [...(T.text || '')].forEach((ch, i) => { const s = el('span', {}, ch); s.style.color = T.colors?.[i] || T.color || '#b3122e'; node.append(s); });
  return node;
}

// ---------------------------------------------------------------- la tarjeta (popup)
function videoEl(src) {
  const id = ytId(src);
  if (id) return el('iframe', { class: 'sp-video', src: `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0`, allow: 'autoplay; encrypted-media; fullscreen', allowfullscreen: true });
  return el('video', { class: 'sp-video', src, controls: true, playsinline: true });
}
function renderCard(msg, { onHome, preview } = {}) {
  const T = { ...DEFAULT_TITLE, ...(msg.title || {}) };
  const photos = (msg.photos || []).filter(Boolean);
  const items = photos.map(src => ({ kind: 'img', src }));
  const card = el('div', { class: 'sp-card' + (preview ? ' preview' : '') },
    el('div', { class: 'sp-deco tl' }, '🎄'), el('div', { class: 'sp-deco tr' }, '⭐'),
    el('div', { class: 'sp-deco bl' }, '🎁'), el('div', { class: 'sp-deco br' }, '❄️'),
    el('div', { class: 'sp-body' },
      photos.length ? el('div', { class: 'sp-photos n' + photos.length }, ...photos.map((src, i) =>
        el('button', { class: 'sp-photo no-delay', onclick: () => !preview && lightbox(items, i) }, el('img', { src, alt: '' })))) : null,
      msg.video ? videoEl(msg.video) : null,
      msg.text ? el('p', { class: 'sp-text' }, msg.text) : null,
      el('button', { class: 'btn sp-home', onclick: () => onHome && onHome() }, '🏠 Volver al inicio')),
    titleEl(T));
  return card;
}
function showCard(msg) {
  return new Promise(res => {
    const back = el('div', { class: 'sp-back' });
    const close = () => { back.classList.add('out'); setTimeout(() => { back.remove(); res(); }, 350); };
    back.append(renderCard(msg, { onHome: close }));
    document.body.append(back);
  });
}

// al entrar en la app: si hoy hay mensaje para esta persona, se muestra
export async function showSurprise(uid) {
  const msg = await store.getSurprise(uid, todayKey()).catch(() => null); // solo los activados con la fecha de hoy
  if (!msg || (!msg.text && !msg.photos?.length && !msg.video && !msg.title?.text)) return;
  setTimeout(() => { chime(); confetti(90); }, 300);
  await showCard(msg);
}

// ================================================================ ADMINISTRADORA
export async function surpriseAdmin(root) {
  const users = (await store.listUsers()).sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email, 'es'));
  const q = el('input', { type: 'search', class: 'sp-search', placeholder: '🔍 Buscar persona por nombre o correo…' });
  const list = el('div', { class: 'sp-users' });
  const draw = () => {
    const f = q.value.trim().toLowerCase();
    const shown = users.filter(u => !f || (u.name || '').toLowerCase().includes(f) || (u.email || '').toLowerCase().includes(f));
    list.replaceChildren(...(shown.length ? shown.map(u => el('button', { class: 'sp-user no-delay', onclick: () => userView(root, u, users) },
      el('span', { class: 'sp-ava' }, (u.name || u.email || '?').trim()[0].toUpperCase()),
      el('span', {}, el('b', {}, u.name || '—'), el('small', {}, u.email)))) : [el('p', { class: 'muted' }, 'No hay nadie con ese nombre.')]));
  };
  q.oninput = draw; draw();
  root.replaceChildren(el('h3', { class: 'sp-h' }, '💌 Mensajes sorpresa'),
    el('p', { class: 'muted' }, 'Elige a una persona para prepararle un mensaje que verá al entrar el día que tú digas.'), q, list);
  setTimeout(() => q.focus(), 50);
}

async function userView(root, u, users) {
  root.replaceChildren(el('p', { class: 'loading-msg' }, el('span', { class: 'spin' }, '❄'), ' Cargando…'));
  const msgs = await store.listSurprises(u.uid).catch(() => []);
  const today = todayKey();
  const card = m => {
    const dates = (m.dates || []).slice().sort();
    const sw = el('input', { type: 'checkbox', checked: m.active !== false });
    const box = el('div', { class: 'sp-msg' + (sw.checked ? '' : ' off') },
      el('div', { class: 'sp-msg-main' },
        el('b', {}, m.title?.text || '(sin título)'),
        m.text ? el('small', {}, m.text.slice(0, 70) + (m.text.length > 70 ? '…' : '')) : null,
        el('div', { class: 'sp-chips' }, ...(dates.length ? dates.map(d => el('span', { class: 'sp-chip' + (d === today ? ' today' : d < today ? ' past' : '') }, (d === today ? 'HOY · ' : '') + shortDate(d)))
          : [el('span', { class: 'sp-chip past' }, 'Sin fechas')]))),
      el('div', { class: 'sp-msg-btns' },
        el('label', { class: 'sp-switch no-delay' }, sw, el('span', { class: 'sp-slider' }), el('em', {}, sw.checked ? 'Activado' : 'No activado')),
        el('button', { class: 'btn small-btn', onclick: () => editor(root, u, users, m) }, '✏️ Editar'),
        el('button', { class: 'btn btn-ghost small-btn', title: 'Borrar', onclick: async () => {
          if (!await popup(`<h2>🗑️</h2><p>¿Borrar este mensaje para siempre?<br><small>Si solo quieres que no salga, desactívalo.</small></p>`, { cls: 'small', buttons: [{ label: 'No', value: false, cls: 'btn-ghost' }, { label: 'Sí, borrar', value: true }] })) return;
          await store.deleteSurprise(u.uid, m.id); toast('🗑️ Borrado'); userView(root, u, users);
        } }, '🗑️')));
    sw.onchange = async () => {
      m.active = sw.checked; box.classList.toggle('off', !sw.checked); sw.parentNode.querySelector('em').textContent = sw.checked ? 'Activado' : 'No activado';
      try { await store.setSurpriseActive(u.uid, m.id, sw.checked); toast(sw.checked ? '✅ Activado' : '⏸️ No activado'); }
      catch (e) { toast('⚠️ ' + (e.code || e.message), 5000); }
    };
    return box;
  };
  root.replaceChildren(
    el('button', { class: 'btn btn-ghost small-btn', onclick: () => surpriseAdmin(root) }, '← Todas las personas'),
    el('h3', { class: 'sp-h' }, `💌 Mensajes para ${u.name || u.email}`),
    el('p', { class: 'muted' }, 'Solo sale si está «Activado» y hoy es una de sus fechas.'),
    msgs.length ? el('div', { class: 'sp-msgs' }, ...msgs.map(card)) : el('p', { class: 'muted' }, 'Todavía no tiene ningún mensaje.'),
    el('div', { class: 'sp-new' }, el('button', { class: 'btn', onclick: () => editor(root, u, users, null) }, '➕ Nuevo mensaje')));
}

function editor(root, u, users, data) {
  const st = data ? JSON.parse(JSON.stringify({ active: data.active !== false, dates: data.dates || [], title: { ...DEFAULT_TITLE, ...data.title }, text: data.text || '', photos: data.photos || [], video: data.video || '' })) : blank();
  const T = st.title; T.colors = T.colors || [];
  let sel = new Set();
  // ---- activado y fechas
  const act = el('input', { type: 'checkbox', checked: st.active });
  const actTxt = el('em', {}, st.active ? 'Activado' : 'No activado');
  act.onchange = () => { st.active = act.checked; actTxt.textContent = act.checked ? 'Activado' : 'No activado'; };
  const date = el('input', { type: 'date', value: todayKey() });
  const chips = el('div', { class: 'sp-chips' });
  const drawDates = () => { st.dates.sort(); chips.replaceChildren(...(st.dates.length ? st.dates.map((d, i) => el('span', { class: 'sp-chip big' + (d === todayKey() ? ' today' : d < todayKey() ? ' past' : '') }, shortDate(d),
    el('button', { type: 'button', class: 'no-delay', title: 'Quitar fecha', onclick: () => { st.dates.splice(i, 1); drawDates(); } }, '✕'))) : [el('span', { class: 'sp-hint' }, 'Todavía no has elegido ninguna fecha.')])); };
  const addDate = () => { if (!date.value) return toast('Elige un día'); if (st.dates.includes(date.value)) return toast('Esa fecha ya está'); st.dates.push(date.value); drawDates(); };
  const prevBox = el('div', { class: 'sp-preview-wrap' });

  // ---- vista previa en vivo + arrastrar el título
  const redraw = () => {
    const card = renderCard(st, { preview: true });
    prevBox.replaceChildren(card);
    const tnode = card.querySelector('.sp-title');
    tnode.addEventListener('pointerdown', e => {
      e.preventDefault(); tnode.setPointerCapture(e.pointerId); tnode.classList.add('dragging');
      const r = card.getBoundingClientRect();
      const mv = ev => {
        T.x = Math.max(0, Math.min(100, (ev.clientX - r.left) / r.width * 100));
        T.y = Math.max(0, Math.min(100, (ev.clientY - r.top) / r.height * 100));
        tnode.style.left = T.x + '%'; tnode.style.top = T.y + '%';
      };
      const up = () => { tnode.classList.remove('dragging'); tnode.removeEventListener('pointermove', mv); tnode.removeEventListener('pointerup', up); tnode.removeEventListener('pointercancel', up); };
      tnode.addEventListener('pointermove', mv); tnode.addEventListener('pointerup', up); tnode.addEventListener('pointercancel', up);
    });
  };

  // ---- título: texto, letras, colores, letra, grosor, tamaño, giro
  const tText = el('input', { type: 'text', value: T.text, placeholder: 'Escribe el título' });
  const letters = el('div', { class: 'sp-letters' });
  const drawLetters = () => letters.replaceChildren(...[...T.text].map((ch, i) => {
    const b = el('button', { type: 'button', class: 'sp-letter no-delay' + (sel.has(i) ? ' on' : ''), onclick: () => { sel.has(i) ? sel.delete(i) : sel.add(i); drawLetters(); } }, ch === ' ' ? '␣' : ch);
    b.style.color = T.colors[i] || T.color; return b;
  }));
  tText.oninput = () => {
    const old = [...T.text], nw = [...tText.value];
    // conserva los colores de las letras que no cambian
    let p = 0; while (p < old.length && p < nw.length && old[p] === nw[p]) p++;
    let s = 0; while (s < old.length - p && s < nw.length - p && old[old.length - 1 - s] === nw[nw.length - 1 - s]) s++;
    T.colors = [...T.colors.slice(0, p), ...Array(nw.length - p - s).fill(null), ...T.colors.slice(old.length - s, old.length)];
    T.text = tText.value; sel = new Set(); drawLetters(); redraw();
  };
  const paint = c => {
    if (!sel.size) { T.color = c; T.colors = []; } else sel.forEach(i => T.colors[i] = c);
    drawLetters(); redraw();
  };
  const custom = el('input', { type: 'color', value: '#b3122e', title: 'Otro color', oninput: e => paint(e.target.value) });
  const swatches = el('div', { class: 'sp-swatches' }, ...COLORS.map(c => { const b = el('button', { type: 'button', class: 'sp-sw no-delay', title: c, onclick: () => paint(c) }); b.style.background = c; return b; }), custom);
  const font = el('select', {}, ...Object.entries(FONTS).map(([k, f]) => el('option', { value: k, selected: k === T.font }, f[3])));
  font.onchange = () => { T.font = font.value; redraw(); };
  const range = (label, key, min, max, step, fmt) => {
    const out = el('b', {}, fmt(T[key]));
    const r = el('input', { type: 'range', min, max, step, value: T[key] });
    r.oninput = () => { T[key] = +r.value; out.textContent = fmt(T[key]); redraw(); };
    return el('label', { class: 'sp-range' }, el('span', {}, label, ' ', out), r);
  };
  const thick = v => v <= 250 ? 'muy fina' : v <= 450 ? 'fina' : v <= 650 ? 'normal' : v <= 850 ? 'gruesa' : 'muy gruesa';

  // ---- texto, fotos y vídeo
  const text = el('textarea', { rows: 5, placeholder: 'Escribe aquí el mensaje…' }, st.text);
  text.oninput = () => { st.text = text.value; redraw(); };
  const photosBox = el('div', { class: 'sp-thumbs' });
  const fileIn = el('input', { type: 'file', accept: 'image/*', multiple: true, style: 'display:none' });
  const drawPhotos = () => photosBox.replaceChildren(...[...st.photos.map((src, i) => el('div', { class: 'sp-thumb' }, el('img', { src, alt: '' }),
    el('button', { type: 'button', class: 'no-delay', title: 'Quitar', onclick: () => { st.photos.splice(i, 1); drawPhotos(); redraw(); } }, '✕'))),
    st.photos.length < 2 ? el('button', { type: 'button', class: 'btn media-btn no-delay', onclick: () => fileIn.click() }, '📷', el('small', {}, st.photos.length ? 'Otra foto' : 'Añadir foto')) : null].filter(Boolean));
  fileIn.onchange = async () => {
    for (const f of [...fileIn.files]) {
      if (st.photos.length >= 2) { toast('Como máximo 2 fotos'); break; }
      try { st.photos.push(await shrink(f, 1000, 380000)); } catch { toast('⚠️ No se ha podido leer la foto'); }
    }
    fileIn.value = ''; drawPhotos(); redraw();
  };
  const video = el('input', { type: 'text', value: st.video, placeholder: 'Enlace de YouTube o nombre del vídeo (ej. saludo.mp4)' });
  video.onchange = () => {
    const v = video.value.trim();
    if (v && !/^https?:\/\//.test(v) && !/\.(mp4|mov|m4v|webm)$/i.test(v)) { toast('Pon un enlace (https://…) o un archivo .mp4 / .mov'); return; }
    st.video = v; redraw();
  };

  // ---- guardar / ver / copiar
  const save = async () => {
    if (st.active && !st.dates.length) return toast('Añade al menos una fecha (o déjalo «No activado»)', 4000);
    st.title.text = tText.value;
    try {
      await store.saveSurprise(u.uid, data?.id || null, st);
      toast('✅ Mensaje guardado'); userView(root, u, users);
    } catch (e) { toast('⚠️ ' + (e.code === 'permission-denied' ? 'Sin permiso: publica las reglas nuevas de Firestore' : (e.code || e.message)), 6000); }
  };
  const copy = async () => {
    const who = el('select', {}, ...users.filter(x => x.uid !== u.uid).map(x => el('option', { value: x.uid }, (x.name || '—') + ' · ' + x.email)));
    if (!who.options.length) return toast('No hay más personas');
    const ok = await popup(el('div', { class: 'settings-form' }, el('h2', {}, '📋 Copiar a otra persona'), el('p', {}, 'Se copia con las mismas fechas; luego lo puedes cambiar.'), who),
      { buttons: [{ label: 'Cancelar', value: false, cls: 'btn-ghost' }, { label: 'Copiar', value: true }] });
    if (!ok) return;
    try { st.title.text = tText.value; await store.saveSurprise(who.value, null, st); toast('📋 Copiado'); } catch (e) { toast('⚠️ ' + (e.code || e.message), 5000); }
  };

  const form = el('div', { class: 'sp-form' },
    el('fieldset', { class: 'sp-when' }, el('legend', {}, '📅 Cuándo sale'),
      el('label', { class: 'sp-switch big no-delay' }, act, el('span', { class: 'sp-slider' }), actTxt),
      el('div', { class: 'sp-adddate' }, date, el('button', { type: 'button', class: 'btn small-btn no-delay', onclick: addDate }, '➕ Añadir fecha')),
      chips),
    el('fieldset', {}, el('legend', {}, '✨ Título'), tText,
      el('p', { class: 'sp-hint' }, 'Toca una o varias letras y luego un color. Sin letras marcadas, el color va a todo el título.'),
      letters,
      el('div', { class: 'sp-row' }, el('button', { type: 'button', class: 'btn btn-ghost small-btn no-delay', onclick: () => { sel = new Set([...T.text].map((_, i) => i)); drawLetters(); } }, 'Marcar todas'),
        el('button', { type: 'button', class: 'btn btn-ghost small-btn no-delay', onclick: () => { sel = new Set(); drawLetters(); } }, 'Desmarcar')),
      swatches,
      el('label', { class: 'sp-field' }, el('span', {}, 'Tipo de letra'), font),
      range('Grosor:', 'weight', 100, 1300, 50, thick),
      range('Tamaño:', 'size', 5, 30, .5, v => Math.round(v * 10) / 10),
      range('Giro:', 'rot', -180, 180, 1, v => v + '°'),
      el('p', { class: 'sp-hint' }, '👆 Arrastra el título en la vista previa para colocarlo donde quieras.')),
    el('fieldset', {}, el('legend', {}, '💬 Mensaje'), text),
    el('fieldset', {}, el('legend', {}, '📷 Fotos (máx. 2) y 🎥 vídeo'), photosBox, fileIn, video),
    el('div', { class: 'sp-actions' },
      el('button', { class: 'btn btn-ghost', onclick: () => userView(root, u, users) }, 'Cancelar'),
      el('button', { class: 'btn btn-ghost', onclick: () => showCard(st) }, '👀 Ver como lo verá'),
      el('button', { class: 'btn btn-ghost', onclick: copy }, '📋 Copiar a otra persona'),
      el('button', { class: 'btn btn-green', onclick: save }, '💾 Guardar')));

  root.replaceChildren(
    el('button', { class: 'btn btn-ghost small-btn', onclick: () => userView(root, u, users) }, '← Mensajes de ' + (u.name || u.email)),
    el('h3', { class: 'sp-h' }, `💌 ${u.name || u.email}`),
    el('div', { class: 'sp-editor' }, form, el('div', { class: 'sp-preview' }, el('p', { class: 'sp-hint' }, 'Vista previa'), prevBox)));
  drawLetters(); drawPhotos(); drawDates(); redraw();
}
