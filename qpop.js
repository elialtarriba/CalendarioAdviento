// Preguntas sorpresa: la administradora prepara un popup con una pregunta de 4 respuestas, una explicación,
// una foto y un recuadro para comentarios. Elige a quién (cualquiera que haya entrado: galletas, árboles o gnomos)
// y el día y la hora. Cuando llega esa hora, a esas personas les sale el popup al entrar (o si ya están dentro).
// Lo que contestan (y sus comentarios) lo ve la administradora en Configuración → «❓ Preguntas sorpresa».
// Datos: la lista va en config/public.pops; cada foto en config/popimg_<id>; las respuestas en users/{uid}.popAns.
import { el, popup, toast, confetti, searchBox } from './fx.js?v=23.4';
import { store } from './store.js?v=23.4';
import { shrink, lightbox } from './richact.js?v=23.4';
import { chime, fanfare, sadTrombone, pop } from './sound.js?v=23.4';
import { getLang } from './i18n.js?v=23.4';
import { S } from './app.js?v=23.4';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const when = t => new Date(t).toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const toLocalInput = t => { const d = new Date(t - new Date(t).getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); };
const newId = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

// ================================================================ JUGADORES
let busy = false, later = new Set(), timer = 0;
export function startPops() {
  clearInterval(timer);
  setTimeout(checkPops, 4000);
  timer = setInterval(checkPops, 60000); // por si llega la hora con la app abierta
}
async function checkPops() {
  if (busy || !S.user) return;
  // no molestar si hay otra ventana o una casilla abierta
  if (document.querySelector('.popup-back, .note-layer, .sum-wrap, .cd-boom, .sp-back, .slfx')) return;
  let cfg = null; try { cfg = await store.getConfig(); } catch {}
  const pops = (cfg?.pops || S.config?.pops || []).filter(p => p.active !== false && p.at <= Date.now() && (p.to || []).includes(S.user.uid));
  const done = S.profile?.popAns || {};
  const next = pops.filter(p => !done[p.id] && !later.has(p.id)).sort((a, b) => a.at - b.at)[0];
  if (!next) return;
  busy = true;
  try { await showPop(next); } finally { busy = false; }
}

export async function showPop(p, { preview = false } = {}) {
  let img = '';
  if (p.hasImg) { try { img = (await store.getConfigDoc('popimg_' + p.id))?.img || ''; } catch {} }
  if (p._img) img = p._img; // vista previa desde el editor
  const opts = (p.opts || []).map((o, i) => ({ o, i })).filter(x => x.o);
  let pick = null;
  const fb = el('div', { class: 'aq-fb' });
  const list = el('div', { class: 'aq-list' });
  const expBtn = (p.exp || img) ? el('button', { type: 'button', class: 'btn aq-expbtn no-delay', style: 'display:none', onclick: () => popup(el('div', { class: 'aq-exppop' },
    el('h2', {}, '💡 ' + L('Explicación', 'Explicació', 'Explanation')), p.exp ? el('p', {}, p.exp) : null,
    img ? el('button', { type: 'button', class: 'aq-expimg no-delay', onclick: () => lightbox([{ kind: 'img', src: img }], 0) }, el('img', { src: img, alt: '' }), el('small', {}, '🔍 ' + L('Toca para verla en grande', 'Toca per veure-la en gran', 'Tap to enlarge'))) : null),
    { cls: 'small', buttons: [{ label: '👍 OK', value: true }] }) }, '💡 ' + L('Explicación', 'Explicació', 'Explanation')) : null;
  opts.forEach(({ o, i }, k) => list.append(el('button', { type: 'button', class: 'aq-ans no-delay', style: `--k:${k}`, onclick: ev => {
    if (pick != null) return; pick = i;
    const b = ev.currentTarget; list.classList.add('done');
    const hasOk = Number.isInteger(p.ok) && p.ok >= 0;
    if (!hasOk) { b.classList.add('right'); pop(); fb.className = 'aq-fb show good'; fb.textContent = L('¡Anotado! 📝', 'Anotat! 📝', 'Noted! 📝'); }
    else if (i === p.ok) { b.classList.add('right'); fanfare(); const r = b.getBoundingClientRect(); confetti(140, { x: r.left + r.width / 2, y: r.top + r.height / 2 }); fb.className = 'aq-fb show good'; fb.textContent = L('¡Muy bien! ¡Has acertado!', 'Molt bé! Ho has encertat!', 'Well done! That’s right!'); }
    else { b.classList.add('wrong'); sadTrombone(); fb.className = 'aq-fb show bad'; fb.textContent = L('¡Oh! No era esa…', 'Oh! No era aquesta…', 'Oh! That wasn’t it…'); }
    if (expBtn) expBtn.style.display = '';
    send.disabled = false;
  } }, el('span', { class: 'aq-ball' }), el('span', { class: 'aq-txt' }, o))));
  const comment = el('textarea', { class: 'qp-comment', rows: 3, maxlength: 600, placeholder: L('Para comentarios, si los hay… (opcional)', 'Per a comentaris, si n’hi ha… (opcional)', 'For comments, if any… (optional)') });
  const send = el('button', { type: 'button', class: 'btn btn-big no-delay qp-send', disabled: opts.length > 0 }, '📨 ' + L('Enviar a Mamá Noel', 'Enviar a la Mare Noel', 'Send to Mrs Claus'));
  const box = el('div', { class: 'qp-card' },
    el('div', { class: 'cw-lights' }, ...Array.from({ length: 12 }, (_, i) => el('i', { style: `--i:${i}` }))),
    el('div', { class: 'qp-ribbon' }, '❓ ' + (p.title || L('Pregunta sorpresa', 'Pregunta sorpresa', 'Surprise question'))),
    p.msg ? el('p', { class: 'qp-msg' }, p.msg) : null,
    p.q ? el('div', { class: 'aq-play qp-play' }, el('p', { class: 'aq-question' }, p.q), list, fb, expBtn) : null,
    el('label', { class: 'qp-lbl' }, '💬 ' + L('Para comentarios (si los hay)', 'Per a comentaris (si n’hi ha)', 'Comments (if any)')), comment,
    send);
  chime();
  return new Promise(res => {
    const back = el('div', { class: 'popup-back qp-back' }, el('div', { class: 'popup small qp-popup' }, box,
      el('div', { class: 'popup-btns' }, el('button', { class: 'btn btn-ghost', onclick: () => { back.remove(); later.add(p.id); res(false); } }, preview ? L('Cerrar', 'Tancar', 'Close') : '⏰ ' + L('Más tarde', 'Més tard', 'Later')))));
    send.onclick = async () => {
      if (preview) { back.remove(); toast('👀 Vista previa: no se ha enviado nada'); return res(false); }
      send.disabled = true;
      const r = { pick, ok: Number.isInteger(p.ok) && p.ok >= 0 ? pick === p.ok : null, answer: pick != null ? p.opts[pick] : '', comment: comment.value.trim().slice(0, 600), at: Date.now() };
      try {
        await store.saveProfile(S.user.uid, { popAns: { [p.id]: r } });
        S.profile.popAns = { ...(S.profile.popAns || {}), [p.id]: r };
        back.remove(); confetti(80); toast('📨 ' + L('¡Enviado! Gracias 💝', 'Enviat! Gràcies 💝', 'Sent! Thank you 💝'), 2500); res(true);
        setTimeout(checkPops, 1500); // por si hay otra
      } catch (e) { send.disabled = false; toast('⚠️ ' + (e.code || e.message), 5000); }
    };
    document.body.append(back);
  });
}

// ================================================================ ADMINISTRADORA
export async function popsAdmin(root) {
  root.replaceChildren(el('p', { class: 'loading-msg' }, el('span', { class: 'spin' }, '❄'), ' Cargando…'));
  const [cfg, users] = await Promise.all([store.getConfig().catch(() => S.config), store.listUsers().catch(() => [])]);
  const pops = (cfg?.pops || []).slice().sort((a, b) => b.at - a.at);
  const uName = Object.fromEntries(users.map(u => [u.uid, u.name || u.email || '—']));
  const answered = p => users.filter(u => u.popAns?.[p.id]).length;
  const card = p => {
    const n = (p.to || []).length, a = answered(p), future = p.at > Date.now();
    return el('div', { class: 'qp-acard' + (p.active === false ? ' off' : '') },
      el('b', {}, (p.title ? p.title + ' · ' : '') + (p.q || p.msg || '(sin pregunta)')),
      el('small', {}, `${future ? '⏳ Saldrá' : '📨 Salió'}: ${when(p.at)} · 👥 ${n} ${n === 1 ? 'persona' : 'personas'}` + (p.active === false ? ' · 🚫 desactivada' : '')),
      el('div', { class: 'qp-abtns' },
        el('button', { class: 'btn small-btn no-delay', onclick: () => answersView(root, p, users) }, `📬 Respuestas (${a}/${n})`),
        el('button', { class: 'btn btn-ghost small-btn no-delay', onclick: () => editor(root, p, users) }, '✏️ Editar'),
        el('button', { class: 'btn btn-ghost small-btn no-delay', onclick: () => showPop(p, { preview: true }) }, '👀'),
        el('button', { class: 'btn btn-ghost small-btn no-delay', title: 'Borrar', onclick: async () => {
          if (!await popup('<h2>🗑️</h2><p>¿Borrar esta pregunta sorpresa? Si alguien no la ha visto aún, ya no le saldrá. (Las respuestas que ya tengas se quedan guardadas en cada persona.)</p>', { cls: 'small', buttons: [{ label: 'No', value: false, cls: 'btn-ghost' }, { label: 'Sí, borrar', value: true }] })) return;
          try { await savePops((cfg.pops || []).filter(x => x.id !== p.id)); if (p.hasImg) await store.delConfigDoc('popimg_' + p.id).catch(() => {}); toast('🗑️ Borrada'); } catch (e) { toast('⚠️ ' + (e.code || e.message), 5000); }
          popsAdmin(root);
        } }, '🗑️')));
  };
  root.replaceChildren(
    el('p', { class: 'muted' }, 'Prepara un popup con una pregunta de 4 respuestas, una explicación (con botón) y una foto. Elige a quién le sale (cualquiera que haya entrado: galletas, árboles o gnomos) y el día y la hora. Además tendrán un recuadro para comentarios. Lo que contesten lo verás aquí, en «📬 Respuestas».'),
    el('button', { class: 'btn btn-big no-delay', onclick: () => editor(root, null, users) }, '➕ Nueva pregunta sorpresa'),
    pops.length ? el('div', { class: 'qp-alist' }, ...pops.map(card)) : el('p', { class: 'muted' }, 'Aún no has preparado ninguna.'));
  void uName;
}
async function savePops(list) { await store.saveConfig({ pops: list }); if (S.config) S.config.pops = list; }

function editor(root, p, users) {
  const isNew = !p; p = p ? { ...p, opts: [...(p.opts || ['', '', '', ''])], to: [...(p.to || [])] } : { id: newId(), title: '', msg: '', q: '', opts: ['', '', '', ''], ok: -1, exp: '', to: [], at: Date.now(), active: true, hasImg: false };
  const title = el('input', { type: 'text', maxlength: 60, value: p.title || '', placeholder: 'Título (opcional). Ej.: Pregunta de Mamá Noel' });
  const msg = el('textarea', { rows: 2, maxlength: 400, placeholder: 'Mensaje antes de la pregunta (opcional)' }, p.msg || '');
  const q = el('textarea', { rows: 2, maxlength: 300, placeholder: 'La pregunta. Ej.: ¿En qué año nació el abuelo?' }, p.q || '');
  let ok = Number.isInteger(p.ok) ? p.ok : -1;
  const marks = [], ins = [];
  const rows = [0, 1, 2, 3].map(i => {
    const mk = el('button', { type: 'button', class: 'aq-mark no-delay' + (i === ok ? ' on' : ''), title: 'Marcar como correcta', onclick: () => { ok = ok === i ? -1 : i; marks.forEach((m, j) => m.classList.toggle('on', j === ok)); } });
    const inp = el('input', { type: 'text', class: 'aq-opt', maxlength: 120, placeholder: `Respuesta ${i + 1}`, value: p.opts[i] || '' });
    marks.push(mk); ins.push(inp); return el('div', { class: 'aq-row' }, mk, inp);
  });
  const exp = el('textarea', { rows: 4, class: 'aq-exp', maxlength: 700, placeholder: 'Explicación (opcional, un párrafo). Sale con el botón «💡 Explicación» después de contestar.' }, p.exp || '');
  let img = null, imgChanged = false; // null = sin cambiar
  const imgBox = el('div', { class: 'aq-imgbox' });
  const imgIn = el('input', { type: 'file', accept: 'image/*', style: 'display:none', onchange: async () => {
    const f = imgIn.files[0]; imgIn.value = ''; if (!f) return;
    try { img = await shrink(f, 900, 260000); imgChanged = true; drawImg(); } catch { toast('No se ha podido usar esa foto', 5000); }
  } });
  const drawImg = () => imgBox.replaceChildren((img || (!imgChanged && p.hasImg))
    ? el('div', { class: 'aq-thumb' }, img ? el('img', { src: img, alt: '', onclick: () => lightbox([{ kind: 'img', src: img }], 0) }) : el('span', { class: 'qp-hasimg' }, '📷 Foto guardada'),
        el('button', { type: 'button', class: 'ed-del no-delay', title: 'Quitar la foto', onclick: () => { img = ''; imgChanged = true; drawImg(); } }, '✕'))
    : el('button', { type: 'button', class: 'btn btn-ghost small-btn no-delay', onclick: () => imgIn.click() }, '📷 Añadir una foto'), imgIn);
  drawImg();
  if (p.hasImg) store.getConfigDoc('popimg_' + p.id).then(d => { if (!imgChanged && d?.img) { img = d.img; drawImg(); } }).catch(() => {});
  // a quién: todos los que han entrado
  const sorted = users.slice().sort((a, b) => String(a.name || a.email || '').localeCompare(String(b.name || b.email || ''), 'es'));
  const checks = sorted.map(u => el('input', { type: 'checkbox', value: u.uid, checked: p.to.includes(u.uid) }));
  const all = el('input', { type: 'checkbox', checked: users.length && p.to.length === users.length });
  all.onchange = () => checks.forEach(c => c.checked = all.checked);
  const peopleBox = el('div', { class: 'qp-people' }, ...sorted.map((u, i) => el('label', { class: 'inline qp-person' }, checks[i], ' ' + (u.name || u.email || '—'))));
  const date = el('input', { type: 'datetime-local', value: toLocalInput(p.at || Date.now()), class: 'qp-date' });
  const active = el('input', { type: 'checkbox', checked: p.active !== false });
  const save = async () => {
    const data = { id: p.id, title: title.value.trim(), msg: msg.value.trim(), q: q.value.trim(), opts: ins.map(x => x.value.trim()), ok, exp: exp.value.trim().slice(0, 700),
      to: checks.filter(c => c.checked).map(c => c.value), at: new Date(date.value).getTime() || Date.now(), active: active.checked, hasImg: imgChanged ? !!img : !!p.hasImg };
    if (!data.q && !data.msg) return toast('✍️ Escribe una pregunta (o al menos un mensaje)', 4000);
    if (data.q && data.opts.filter(Boolean).length < 2) return toast('✍️ Escribe al menos 2 respuestas', 4000);
    if (ok >= 0 && !data.opts[ok]) data.ok = -1;
    if (!data.to.length) return toast('👥 Elige al menos a una persona', 4000);
    try {
      if (imgChanged) { if (img) await store.setConfigDoc('popimg_' + p.id, { img }); else await store.delConfigDoc('popimg_' + p.id).catch(() => {}); }
      const cfg = await store.getConfig().catch(() => S.config);
      const list = (cfg?.pops || []).filter(x => x.id !== p.id); list.push(data);
      await savePops(list);
      toast(data.at > Date.now() ? `⏳ Guardada: saldrá el ${when(data.at)}` : '📨 Guardada: les saldrá ahora al entrar', 4000);
      popsAdmin(root);
    } catch (e) { toast('⚠️ ' + (e.code || e.message), 6000); }
  };
  root.replaceChildren(
    el('div', { class: 'adm-sticky' },
      el('button', { class: 'btn btn-ghost small-btn no-delay', onclick: () => popsAdmin(root) }, '← Volver'),
      el('button', { class: 'btn small-btn no-delay', onclick: save }, '💾 Guardar')),
    el('h3', {}, isNew ? '➕ Nueva pregunta sorpresa' : '✏️ Editar pregunta sorpresa'),
    el('div', { class: 'card' }, el('label', {}, 'Título', title), el('label', {}, 'Mensaje', msg)),
    el('div', { class: 'card qp-qbody' }, el('label', { class: 'aq-lbl' }, '❓ Pregunta'), q,
      el('label', { class: 'aq-lbl' }, 'Respuestas (toca el círculo de la correcta; si no marcas ninguna, solo se apunta lo que elijan)'), ...rows,
      el('label', { class: 'aq-lbl' }, '💡 Explicación'), exp,
      el('label', { class: 'aq-lbl' }, '📷 Foto (sale pequeña en la explicación; al tocarla se hace grande)'), imgBox,
      el('p', { class: 'muted' }, '💬 Debajo siempre tendrán un recuadro «Para comentarios (si los hay)».')),
    el('div', { class: 'card' }, el('h3', {}, '👥 ¿A quién le sale?'),
      el('label', { class: 'inline qp-all' }, all, el('b', {}, ' Todos')),
      searchBox(peopleBox, '.qp-person'), peopleBox),
    el('div', { class: 'card' }, el('h3', {}, '📅 ¿Cuándo?'),
      el('p', { class: 'muted' }, 'A partir de este día y hora les saldrá al entrar en la app (o al momento, si ya están dentro). Solo una vez: cuando contestan, ya no les vuelve a salir.'), date,
      el('label', { class: 'inline' }, active, ' Activada')),
    el('button', { class: 'btn btn-ghost no-delay', onclick: () => showPop({ ...p, title: title.value.trim(), msg: msg.value.trim(), q: q.value.trim(), opts: ins.map(x => x.value.trim()), ok, exp: exp.value.trim(), hasImg: false, _img: img || '' }, { preview: true }) }, '👀 Ver cómo queda'));
}

async function answersView(root, p, users) {
  users = await store.listUsers().catch(() => users); // siempre lo último
  const rows = (p.to || []).map(uid => ({ u: users.find(x => x.uid === uid) || { uid, name: '(persona borrada)' }, r: users.find(x => x.uid === uid)?.popAns?.[p.id] }));
  rows.sort((a, b) => (b.r ? 1 : 0) - (a.r ? 1 : 0) || String(a.u.name || '').localeCompare(String(b.u.name || ''), 'es'));
  const hasOk = Number.isInteger(p.ok) && p.ok >= 0;
  const ansBox = el('div', { class: 'qp-anslist' });
  root.replaceChildren(
    el('div', { class: 'adm-sticky' }, el('button', { class: 'btn btn-ghost small-btn no-delay', onclick: () => popsAdmin(root) }, '← Volver')),
    el('h3', {}, '📬 ' + (p.title || 'Respuestas')),
    el('div', { class: 'card' }, p.q ? el('p', {}, el('b', {}, p.q)) : null,
      p.q ? el('ol', { class: 'qp-optlist' }, ...p.opts.filter(Boolean).map(o => el('li', { class: hasOk && o === p.opts[p.ok] ? 'ok' : '' }, o + (hasOk && o === p.opts[p.ok] ? ' ✅' : '')))) : null,
      el('small', { class: 'muted' }, `Salió: ${when(p.at)} · contestadas ${rows.filter(x => x.r).length} de ${rows.length}`)),
    searchBox(ansBox, '.qp-ans'), ansBox);
  ansBox.append(...rows.map(({ u, r }) => el('div', { class: 'qp-ans' + (r ? '' : ' none') },
      el('b', {}, u.name || u.email || '—'),
      r ? el('div', {},
        p.q ? el('p', {}, (r.ok === true ? '✅ ' : r.ok === false ? '❌ ' : '📝 ') + 'Ha contestado: ', el('b', {}, r.answer || '—')) : null,
        r.comment ? el('p', { class: 'qp-com' }, '💬 ', el('i', {}, r.comment)) : el('p', { class: 'muted' }, '💬 Sin comentarios'),
        el('small', { class: 'muted' }, '🕒 ' + when(r.at)))
        : el('p', { class: 'muted' }, '⏳ Todavía no ha contestado'))));
}
