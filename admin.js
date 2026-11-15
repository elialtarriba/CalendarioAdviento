// Configuración de la administradora (protegida con contraseña)
import { store, DEMO } from './store.js?v=22.6';
import { t, tx } from './i18n.js?v=22.6';
import { el, popup, toast, esc, searchBox } from './fx.js?v=22.6';
import { S, renderHome, loadDayRaw as loadDay, testMode, setTestMode, celebrateStart } from './app.js?v=22.6';
import { openActEditor, plain, shrink } from './richact.js?v=22.6';
import { R_COLS, DEFAULT_R_NOTE } from './roulette.js?v=22.6';
import { defaultDay, MARQUEE_DEFAULT, MARQUEE_COLORS, MISSED_DEFAULT, SPLASH_DEFAULT } from './defaults.js?v=22.6';

const FIGS = [['galleta', 'Hombrecito de jengibre (solo la puerta)'], ['arbol', 'Árbol de Navidad (+ actividad 1)'], ['gnomo', 'Gnomo (+ actividad 2)']];
export const OWNER_EMAIL = 'elialtarriba@gmail.com';
const FIG_IMG = { galleta: 'galleta.png', arbol: 'arbol.png', gnomo: 'gnomo.png' };
const ST = { correct: '✓', incorrect: '✗', pending: '⏳' };
const TYPE_NAME = { hats: 'Atrapa los 3 gorros', quiz: 'Pregunta con 4 respuestas', reindeer: 'Busca los renos con gafas', differences: 'Las 5 diferencias + susto', tree: 'Decorar el árbol',
  memory: 'Ojo de lince (objeto que falta)', goodcheck: '¿Has sido bueno?', diploma: 'Diploma absurdo', roulette: 'Ruleta del disparate', dance: 'El baile secreto', santa: 'Tu cara en Papá Noel', puzzle: 'Puzle que cobra vida', pairs: 'Memory navideño (parejas)', ttt: 'Tres en raya navideño', crossword: 'Crucigrama de Navidad', wordsearch: 'Sopa de letras de animales', slidepuzzle: 'Puzle deslizante que cobra vida', ballsort: 'Ordena las bolas por colores', catch: 'Atrapa los regalos', simon: 'Papá Noel dice (Simón)', colors: 'Desafío de colores (rueda de 4 colores, 1–20 min)', mastermind: 'El código secreto de Papá Noel (Mastermind)', sudoku: 'Sudoku de Navidad (4×4, 6×6, 9×9)', maze: 'Laberinto: los regalos perdidos' };

// las contraseñas de la administradora se recuerdan SOLO en este aparato (para verlas con el ojo); no se guardan en internet
const CFG_KEY = 'adv_cfgpw';
const rememberCfg = pw => { try { localStorage.setItem(CFG_KEY, pw); } catch {} };
export const savedPw = () => { try { return localStorage.getItem('adv_pw_' + (S.user?.email || '').toLowerCase()) || ''; } catch { return ''; } };
const savedCfg = () => { try { return localStorage.getItem(CFG_KEY) || ''; } catch { return ''; } };
// recuadro para cambiar una contraseña: actual + nueva dos veces, cada una con su ojo
function pwChangeCard(title, help, save, done) {
  const field = ph => { const i = el('input', { type: 'password', placeholder: ph, autocomplete: 'off' });
    const eye = el('button', { type: 'button', class: 'ow-eye no-delay', onclick: () => { i.type = i.type === 'password' ? 'text' : 'password'; eye.textContent = i.type === 'password' ? '👁️' : '🙈'; } }, '👁️');
    return { i, row: el('div', { class: 'ow-row' }, i, eye) }; };
  const cur = field('Contraseña actual'), n1 = field('Contraseña nueva'), n2 = field('Repite la contraseña nueva');
  const msg = el('p', { class: 'ow-err' });
  const form = el('div', { class: 'settings-form pwc-form', style: 'display:none' }, cur.row, n1.row, n2.row, msg,
    el('button', { type: 'button', class: 'btn small-btn no-delay', onclick: async e => {
      msg.textContent = '';
      if (n1.i.value.length < 6) return (msg.textContent = '✍️ La nueva tiene que tener al menos 6 caracteres');
      if (n1.i.value !== n2.i.value) return (msg.textContent = '✍️ Las dos contraseñas nuevas no son iguales');
      e.target.disabled = true;
      try { await save(cur.i.value, n1.i.value); toast('🔐 Contraseña cambiada', 4000); done(); }
      catch (er) { msg.textContent = '⚠️ ' + er.message; }
      e.target.disabled = false;
    } }, '💾 Guardar la contraseña nueva'));
  return el('div', { class: 'card pwc-card' }, el('h3', {}, title), el('p', { class: 'muted' }, help),
    el('button', { type: 'button', class: 'btn btn-ghost small-btn no-delay', onclick: () => { form.style.display = form.style.display === 'none' ? '' : 'none'; } }, '✏️ Cambiar'), form);
}
function pwShow(label, value) {
  const dots = el('b', { class: 'pw-dots' }, value ? '••••••••' : '—');
  const eye = el('button', { type: 'button', class: 'btn btn-ghost small-btn no-delay pw-eye', onclick: () => {
    if (!value) return toast('Este aparato aún no la conoce: sal y vuelve a entrar escribiéndola una vez y aquí la verás.', 6000);
    const hidden = dots.textContent === '••••••••'; dots.textContent = hidden ? value : '••••••••'; eye.textContent = hidden ? '🙈' : '👁️';
  } }, '👁️');
  return el('div', { class: 'pw-show-row' }, el('span', {}, label), dots, eye);
}

export async function openAdmin() {
  if (!S.isAdmin) {
    const ok = await askPassword();
    if (!ok) return;
    S.isAdmin = true;
  }
  showPanel();
}

async function askPassword() {
  const first = !S.config.adminConfigured;
  const pw = el('input', { type: 'password', placeholder: t('adminPw'), autocomplete: 'off' });
  const pw2 = el('input', { type: 'password', placeholder: 'Repite la contraseña', autocomplete: 'off' });
  let forgot = false;
  const box = el('div', { class: 'settings-form' }, el('h2', {}, '🔒 ' + t('admin')), first ? el('p', {}, t('adminFirst')) : null, pw, first ? pw2 : null,
    first ? null : el('a', { href: '#', class: 'small', onclick: e => { e.preventDefault(); forgot = true; document.querySelector('.popup-back .popup-btns .btn-ghost')?.click(); } }, '¿Has olvidado la contraseña de configuración?'));
  setTimeout(() => pw.focus(), 50);
  const ok = await popup(box, { buttons: [{ label: t('cancel'), value: false, cls: 'btn-ghost' }, { label: t('adminEnter'), value: true }] });
  if (forgot) return forgotAdmin();
  if (!ok || !pw.value) return false;
  if (first) {
    if (pw.value.length < 6) { toast('Mínimo 6 caracteres'); return false; }
    if (pw.value !== pw2.value) { toast('Las contraseñas no coinciden'); return false; }
    try { await store.adminSetup(S.user.uid, pw.value); rememberCfg(pw.value); S.config.adminConfigured = true; toast('🔐 Contraseña creada'); return true; }
    catch (e) { toast('Error: ' + e.message, 5000); return false; }
  }
  const good = await store.adminLogin(S.user.uid, pw.value);
  if (!good) toast(t('adminWrong')); else rememberCfg(pw.value);
  return good;
}

async function forgotAdmin() {
  // por seguridad, ya no basta con haber entrado en la cuenta: hay que hacerlo desde Firebase (que solo abre ella)
  if ((S.user.email || '').toLowerCase() !== OWNER_EMAIL) {
    return popup(`<h2>🔐</h2><p>Solo la administradora puede crear una contraseña de configuración nueva.</p>`);
  }
  const ok = await popup(`<h2>🔐 Contraseña de configuración olvidada</h2>
    <p>Para que nadie más pueda cambiarla, se hace desde Firebase (solo tú puedes entrar ahí):</p>
    <ol style="text-align:left"><li>Entra en <b>console.firebase.google.com</b> → tu proyecto → <b>Firestore Database → Datos</b>.</li>
    <li>Abre la colección <b>adminSecret</b> → documento <b>main</b> → los tres puntitos ⋮ → <b>Eliminar documento</b>.</li>
    <li>Vuelve aquí y pulsa «Ya lo he borrado».</li></ol>`,
    { cls: 'small', buttons: [{ label: t('cancel'), value: false, cls: 'btn-ghost' }, { label: 'Ya lo he borrado', value: true }] });
  if (!ok) return false;
  const n1 = el('input', { type: 'password', placeholder: 'Contraseña nueva', autocomplete: 'new-password' });
  const n2 = el('input', { type: 'password', placeholder: 'Repite la contraseña nueva', autocomplete: 'new-password' });
  const ok2 = await popup(el('div', { class: 'settings-form' }, el('h2', {}, '🔐 Contraseña nueva'), n1, n2),
    { buttons: [{ label: t('cancel'), value: false, cls: 'btn-ghost' }, { label: 'Guardar', value: true }] });
  if (!ok2) return false;
  if (n1.value.length < 6) { toast('Mínimo 6 caracteres'); return false; }
  if (n1.value !== n2.value) { toast('Las contraseñas no coinciden'); return false; }
  try { await store.adminOwnerReset(S.user.uid, n1.value); rememberCfg(n1.value); toast('🔐 Contraseña nueva guardada'); return true; }
  catch (e) { toast('⚠️ No se ha podido: ¿has borrado el documento adminSecret/main en Firebase? (' + (e.code || e.message) + ')', 8000); return false; }
}

function showPanel() {
  // cada botón abre su propia ventana (popup); todos iguales, uno debajo de otro y en 3D
  const owner = DEMO || (S.user?.email || '').toLowerCase() === 'elialtarriba@gmail.com';
  const loading = () => el('p', { class: 'loading-msg' }, el('span', { class: 'spin' }, '❄'), ' Cargando…');
  const openSub = (title, fill) => {
    const content = el('div');
    const pin = () => content.querySelectorAll('button:not([data-pin])').forEach(b => {
      b.dataset.pin = '1';
      if (b.closest('.adm-sticky, .sp-actions, .popup-back .popup:not(.wide)')) return;
      const txt = b.textContent.trim();
      if (/^←/.test(txt)) b.classList.add('adm-back');
      else if (/^💾|^Guardar/.test(txt)) (b.parentElement.matches('.row') ? b.parentElement : b).classList.add('adm-save');
    });
    new MutationObserver(pin).observe(content, { childList: true, subtree: true });
    content.replaceChildren(loading());
    Promise.resolve(fill(content)).catch(e => content.replaceChildren(el('p', {}, '⚠️ ' + (e.code || e.message))));
    return popup(el('div', { class: 'admin adm-sub' }, el('h2', {}, title), content), { cls: 'wide', buttons: [{ label: '← Volver', value: true }] });
  };
  const B = (ico, title, sub, fill) => el('button', { class: 'adm-btn', onclick: () => openSub(ico + ' ' + title, fill) },
    el('span', { class: 'adm-btn-ico' }, ico), el('span', { class: 'adm-btn-txt' }, el('b', {}, title), el('small', {}, sub)));
  const usersBtn = B('👥', 'Usuarios', 'Nombres, PIN, galleta / árbol / gnomo y sus días', root => VIEWS.users(root).then(() => usersBtn.querySelector('.adm-badge')?.remove()));
  store.listUsers().then(us => { const n = us.filter(pinNew).length; if (n) usersBtn.append(el('span', { class: 'adm-badge' }, `🔄 ${n} PIN ${n > 1 ? 'nuevos' : 'nuevo'}`)); }).catch(() => {});
  const btns = [
    owner ? B('🟢', 'Quién está en la app', 'Solo para ti: quién ha entrado, quién está dentro ahora y sacar a quien la deje abierta', root => import('./presence.js?v=22.6').then(m => m.presenceAdmin(root))) : null,
    B('💌', 'Mensajes sorpresa', 'Un popup para quien tú quieras, el día que quieras', root => import('./surprise.js?v=22.6').then(m => m.surpriseAdmin(root))),
    B('👪', 'Palabra secreta de la familia', 'Solo puede entrar quien la sabe (se pide una vez a cada uno)', root => VIEWS.family(root)),
    B('❓', 'Preguntas sorpresa', 'Un popup con pregunta, explicación, foto y comentarios para quien tú elijas, el día y la hora que quieras', root => import('./qpop.js?v=22.6').then(m => m.popsAdmin(root))),
    B('📨', 'Respuestas', 'Lo que han contestado y lo que tienes que corregir', root => VIEWS.answers(root)),
    usersBtn,
    B('📅', 'Contenido de los días', 'Lo que sale en cada casilla y las actividades 1 y 2', root => VIEWS.days(root)),
    owner ? B('👤', 'Mis datos de administradora', 'Tu correo y tus contraseñas (pulsa el ojo para verlas)', root => VIEWS.me(root)) : null,
    B('🎁', 'Regalo sorpresa', 'La web que se abre con el botón «Regalo sorpresa» (días 24 y 25)', root => VIEWS.gift(root)),
    B('🎰', 'Máquina de regalos', 'Las 5 opciones de la tragaperras del día 25 (solo gnomos)', root => VIEWS.slot(root)),
    B('🏆', 'Premios y ajustes', 'Premios, abrir todas las casillas, modo prueba, contraseña…', root => VIEWS.general(root)),
    el('button', { class: 'adm-btn', onclick: () => import('./help.js?v=22.6').then(m => m.openHelp()).catch(e => toast('⚠️ ' + e.message)) },
      el('span', { class: 'adm-btn-ico' }, '📖'), el('span', { class: 'adm-btn-txt' }, el('b', {}, 'Guía de la app'), el('small', {}, 'Todo lo que tiene y cómo configurarlo, con dibujos'))),
    el('button', { class: 'adm-btn', onclick: () => { document.querySelectorAll('.popup-back').forEach(x => x.remove()); celebrateStart(true); } },
      el('span', { class: 'adm-btn-ico' }, '🎆'), el('span', { class: 'adm-btn-txt' }, el('b', {}, 'Probar la explosión del día 1'), el('small', {}, 'Cómo lo verán todos al entrar el 1 de diciembre (fuegos artificiales y «¡A empezar!»)'))),
    B('🧝', 'Casilla 11 · Gnomos', 'Los 3 premios del laberinto (solo para los gnomos)', root => VIEWS.maze11(root)),
  ];
  // orden de los botones: se puede cambiar arrastrándolos (se recuerda en este aparato)
  const ORD = 'adv_adm_order';
  const list = btns.filter(Boolean);
  list.forEach(b => { b.dataset.k = b.querySelector('b')?.textContent || ''; });
  try { const ord = JSON.parse(localStorage.getItem(ORD) || '[]'); list.sort((a, b) => { const ia = ord.indexOf(a.dataset.k), ib = ord.indexOf(b.dataset.k); return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib); }); } catch {}
  const menu = el('div', { class: 'adm-menu' }, ...list);
  let sorting = false;
  const sortBtn = el('button', { type: 'button', class: 'btn btn-ghost small-btn no-delay adm-sortbtn', onclick: () => {
    sorting = !sorting; menu.classList.toggle('sorting', sorting);
    sortBtn.textContent = sorting ? '✅ Listo (guardar el orden)' : '↕️ Cambiar el orden de los botones';
    if (sorting) toast('☰ Mantén el dedo en un botón y arrástralo arriba o abajo', 4000);
    else { try { localStorage.setItem(ORD, JSON.stringify([...menu.children].map(b => b.dataset.k))); } catch {} toast('💾 Orden guardado'); }
  } }, '↕️ Cambiar el orden de los botones');
  // mientras se ordena, los botones no se abren: se arrastran
  menu.addEventListener('click', e => { if (sorting) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  let drag = null;
  menu.addEventListener('pointerdown', e => {
    if (!sorting) return; const b = e.target.closest('.adm-btn'); if (!b) return;
    e.preventDefault(); try { menu.setPointerCapture(e.pointerId); } catch {}
    let sc = menu.parentElement; while (sc && sc !== document.body && !(sc.scrollHeight > sc.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
    drag = { b, id: e.pointerId, y0: e.clientY, top0: b.getBoundingClientRect().top, sc: sc && sc !== document.body ? sc : null, y: e.clientY }; b.classList.add('dragging');
    // si el dedo está cerca del borde de arriba o de abajo, la lista se desplaza sola
    const tick = () => { if (!drag) return; const sc = drag.sc; if (sc) { const r = sc.getBoundingClientRect(), z = 70; const v = drag.y < r.top + z ? -(r.top + z - drag.y) / 4 : drag.y > r.bottom - z ? (drag.y - (r.bottom - z)) / 4 : 0; if (v) { sc.scrollTop += v; move(drag.y); } } requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  menu.addEventListener('pointermove', e => { if (drag && e.pointerId === drag.id) { drag.y = e.clientY; move(e.clientY); } });
  function move(y) {
    const e = { clientY: y }; const { b } = drag;
    const prev = b.previousElementSibling, next = b.nextElementSibling;
    const mid = x => { const r = x.getBoundingClientRect(); return r.top + r.height / 2; };
    if (prev && e.clientY < mid(prev)) menu.insertBefore(b, prev);
    else if (next && e.clientY > mid(next)) menu.insertBefore(next, b);
    // el botón sigue al dedo desde su sitio actual en la lista
    b.style.transform = ''; const top = b.getBoundingClientRect().top;
    b.style.transform = `translateY(${e.clientY - drag.y0 - (top - drag.top0)}px)`;
  }
  const endDrag = e => { if (!drag || e.pointerId !== drag.id) return; drag.b.classList.remove('dragging'); drag.b.style.transform = ''; drag = null; };
  menu.addEventListener('pointerup', endDrag); menu.addEventListener('pointercancel', endDrag);
  const box = el('div', { class: 'admin' }, el('h2', {}, '⚙️ Configuración'), menu, sortBtn);
  popup(box, { cls: 'wide', buttons: [{ label: t('close'), value: true }] }).then(async r => {
    if (r === 'logout') return;
    S.answers = await store.getAnswers(S.user.uid).catch(() => S.answers);
    S.settings = (await store.getSettings(S.user.uid).catch(() => null)) || S.settings;
    renderHome();
  });
}

// jugadores: se ve su PIN (por si lo olvidan); los demás, su correo
const isPlayer = u => u.player || /@jugadores\.example\.com$/i.test(u.email || '');
const who2 = u => isPlayer(u) ? '🔑 PIN ' + (u.pin || '—') : (u.email || '');
// PIN cambiado por el jugador y que la administradora todavía no ha visto (se recuerda en este aparato)
const pinSeenKey = u => 'adv_pin_seen_' + u.uid;
const pinNew = u => { try { return isPlayer(u) && u.pinChangedAt && +(localStorage.getItem(pinSeenKey(u)) || 0) < u.pinChangedAt; } catch { return false; } };
const pinNote = u => u.pinChangedAt ? el('span', { class: 'pin-chg' + (pinNew(u) ? ' new' : '') },
  `🔄 PIN cambiado el ${new Date(u.pinChangedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}: ahora ${u.pin}${u.pinPrev ? ' (antes ' + u.pinPrev + ')' : ''}`) : null;

// ------------------------------------------------------------------ Respuestas
// se guarda 1 minuto para que cambiar de pestaña sea instantáneo
let cache = null, cacheAt = 0;
export function clearCache() { cache = null; }
async function loadAll(force) {
  if (!force && cache && Date.now() - cacheAt < 60000) return cache;
  const users = await store.listUsers();
  const all = await Promise.all(users.map(async u => ({ u, a: await store.getAnswers(u.uid).catch(() => ({})) })));
  cache = { users, all }; cacheAt = Date.now();
  return cache;
}
const VIEWS = {
  // ---------------------------------------------------------------- Casilla 11 · Gnomos: los 3 premios del laberinto
  async maze11(root) {
    const { mazePrizes } = await import('./maze.js?v=22.6');
    const cur = mazePrizes(S.config);
    const ins = cur.map((v, i) => el('input', { type: 'text', value: v, maxlength: 40, placeholder: i ? `Ej.: 2 o «una chocolatina»` : 'Ej.: 5 o «un abrazo»' }));
    const prev = el('p', { class: 'mz-adm-prev' });
    const show = () => { const v = ins.map(x => x.value.trim()).filter(Boolean);
      const nums = v.map(x => x.replace(/€|eur(os)?/gi, '').replace(',', '.').trim());
      prev.textContent = !v.length ? 'Sin premios: no saldrá nada.' : nums.every(x => x !== '' && !isNaN(+x)) ? `Al final verán: «Premio total: ${Math.round(nums.reduce((a, b) => a + +b, 0) * 100) / 100} €»` : `Al final verán: «Pasa a ver a Mamá Noel para recibir tu regalo: ${v.join(' · ')}»`; };
    ins.forEach(x => x.addEventListener('input', show)); show();
    root.replaceChildren(el('div', { class: 'card' },
      el('p', {}, 'Solo para los gnomos y solo en su primera partida (cualquier nivel). Cada premio está tapado hasta que llegan a su regalo: el 1.º que cogen destapa el premio 1, el 2.º el premio 2 y el 3.º el premio 3. Los demás jugadores solo ven chispas y sonidos.'),
      el('p', { class: 'muted' }, 'Escribe un número (euros) o un texto. Si los tres son números, al final se suman; si hay texto, les sale que pasen a ver a Mamá Noel para recibir su regalo, con lo que has escrito.'),
      ...ins.map((x, i) => el('label', { class: 'mm-row' }, el('span', {}, `🎁 Premio del regalo ${i + 1}`), x)),
      prev,
      el('button', { class: 'btn small-btn no-delay', onclick: async () => {
        const v = ins.map(x => x.value.trim());
        try { await store.saveConfig({ mazePrizes: v }); S.config.mazePrizes = v; toast('🎁 Premios guardados'); } catch (e) { toast('⚠️ ' + (e.code || e.message), 5000); }
      } }, '💾 Guardar premios')));
  },
  // ---------------------------------------------------------------- Máquina de regalos (día 25)
  async family(root) {
    const on = await store.hasFamilyWord();
    const w = el('input', { type: 'text', autocomplete: 'off', autocapitalize: 'none', placeholder: 'Ej.: turron2026', maxlength: 40 });
    const eye = null; void eye;
    root.replaceChildren(el('div', { class: 'card' },
      el('h3', {}, '👪 Palabra secreta de la familia'),
      el('p', {}, on ? '✅ Ahora mismo HAY palabra secreta: solo entra quien la sabe.' : '⚠️ Ahora mismo NO hay palabra secreta: cualquiera con el enlace puede entrar.'),
      el('p', { class: 'muted' }, 'Cuando la pongas, a cada persona se le pedirá UNA vez (al entrar por primera vez o la próxima vez que abra la app). Sin la palabra no puede ver nada. Da igual mayúsculas, acentos o espacios. No se guarda la palabra, solo su «huella»: si la olvidas, pon una nueva (los que ya han entrado tendrán que escribir la nueva). Tú no la necesitas para entrar.'),
      el('label', {}, on ? 'Cambiar la palabra:' : 'Palabra secreta:', w),
      el('div', { class: 'row' },
        el('button', { class: 'btn small-btn no-delay', onclick: async () => {
          const v = w.value.trim(); if (v.length < 4) return toast('✍️ Pon al menos 4 letras o números', 4000);
          if (!await popup(`<h2>👪</h2><p>¿Poner «<b>${esc(v)}</b>» como palabra secreta? Apúntatela y pásasela a la familia (por WhatsApp, por ejemplo).</p>`, { cls: 'small', buttons: [{ label: 'No', value: false, cls: 'btn-ghost' }, { label: 'Sí', value: true }] })) return;
          try { await store.setFamilyWord(S.user.uid, v); toast('👪 Palabra secreta puesta', 4000); VIEWS.family(root); } catch (e) { toast('⚠️ ' + (e.code || e.message) + ' (¿has publicado las reglas nuevas de Firebase?)', 7000); }
        } }, '💾 Guardar la palabra'),
        on ? el('button', { class: 'btn btn-ghost small-btn no-delay', onclick: async () => {
          if (!await popup('<h2>🔓</h2><p>¿Quitar la palabra secreta? Cualquiera con el enlace podrá volver a entrar.</p>', { cls: 'small', buttons: [{ label: 'No', value: false, cls: 'btn-ghost' }, { label: 'Sí, quitar', value: true }] })) return;
          try { await store.delFamilyWord(); toast('🔓 Palabra secreta quitada'); VIEWS.family(root); } catch (e) { toast('⚠️ ' + (e.code || e.message), 6000); }
        } }, '🔓 Quitarla') : null)));
  },
  async slot(root) {
    const { FX_TYPES, FX_DEFAULT, testFx, openSlot } = await import('./slot.js?v=22.6');
    const cur = S.config.slot?.opts || [], fx = S.config.slot?.fx || [];
    const rows = [0, 1, 2, 3, 4].map(i => {
      const inp = el('input', { type: 'text', placeholder: `Opción ${i + 1} (ej.: ¡Has ganado 2 Euros! - A canjear en el grupo familiar)`, value: cur[i] || '', maxlength: 120 });
      const sel = el('select', {}, ...Object.entries(FX_TYPES).map(([k, v]) => el('option', { value: k, selected: k === (fx[i]?.type || FX_DEFAULT[i]) }, v)));
      const on = el('input', { type: 'checkbox', checked: fx[i]?.on !== false });
      const test = el('button', { type: 'button', class: 'btn btn-ghost small-btn no-delay', onclick: () => { document.querySelectorAll('.popup-back').forEach(x => x.style.visibility = 'hidden'); testFx(sel.value, inp.value.trim() || `Opción ${i + 1}`).finally(() => document.querySelectorAll('.popup-back').forEach(x => x.style.visibility = '')); } }, '👀 Ver efecto');
      return { inp, sel, on, box: el('div', { class: 'sl-adm-row' }, el('b', {}, `🎁 Opción ${i + 1}`), inp,
        el('div', { class: 'sl-adm-fx' }, el('span', {}, '✨ Efecto al salir:'), sel),
        el('div', { class: 'sl-adm-fx' }, el('label', { class: 'switch-row' }, on, ' Efecto activado'), test)) };
    });
    root.replaceChildren(
      el('div', { class: 'card' }, el('h3', {}, '🎰 Máquina de regalos (día 25, solo gnomos)'),
        el('p', { class: 'muted' }, 'Al tirar de la palanca, el rodillo va pasando estas opciones; al tocarlo se para en una. Solo cuenta la primera tirada. En el rodillo sale el texto hasta el guion («¡Has ganado 2 Euros!»); lo que va después del guion sale en el efecto. Cada opción puede tener su efecto al salir (imagen del vale, lluvia de monedas o «no has ganado» con Papá Noel), y lo puedes activar o desactivar. La opción «No has ganado» pasa por el rodillo pero nunca sale.'),
        el('div', { class: 'sl-adm' }, ...rows.map(r => r.box)),
        el('div', { class: 'row' },
          el('button', { class: 'btn small-btn no-delay', onclick: async () => {
            const slot = { opts: rows.map(r => r.inp.value.trim()), fx: rows.map(r => ({ type: r.sel.value, on: r.on.checked })) };
            try { await store.saveConfig({ slot }); S.config.slot = slot; toast('🎰 Máquina guardada'); } catch (e) { toast('⚠️ ' + (e.code || e.message), 5000); }
          } }, '💾 Guardar la máquina'),
          el('button', { class: 'btn btn-ghost small-btn no-delay', onclick: () => openSlot({ test: true }) }, '🎰 Probar la máquina'))));
  },
  // ---------------------------------------------------------------- Regalo sorpresa (días 24 y 25)
  async gift(root) {
    const cur = S.config.gift || {};
    const url = el('input', { type: 'url', inputmode: 'url', placeholder: 'https://…', value: cur.url || '', autocomplete: 'off', class: 'gift-url' });
    const state = el('p', { class: 'muted' });
    const paint = () => { state.textContent = (S.config.gift?.url || '').trim() ? '✅ Ahora mismo el botón abre: ' + S.config.gift.url : '⏳ Todavía no hay web: si alguien pulsa el botón le sale «¡Shhh! Todavía se está envolviendo…».'; };
    paint();
    const save = async v => {
      try { await store.saveConfig({ gift: { url: v } }); S.config.gift = { url: v }; paint(); toast(v ? '🎁 Web del regalo guardada' : '🗑️ Web del regalo quitada'); }
      catch (e) { toast('⚠️ ' + (e.code || e.message), 5000); }
    };
    root.replaceChildren(el('div', { class: 'card' },
      el('p', {}, 'Escribe (o pega) la dirección de la web del regalo. El botón «🎁 Regalo sorpresa» sale en:'),
      el('ul', {}, el('li', {}, 'Las actividades 1 y 2 del día 24 (árboles y gnomos).'), el('li', {}, 'Abajo del todo de la casilla 25 (allí, a los árboles y gnomos les sale «Regalo ya abierto»).'), el('li', {}, 'Al final del resumen del día 25.')),
      url, state,
      el('div', { class: 'row' },
        el('button', { class: 'btn small-btn no-delay', onclick: () => { let v = url.value.trim(); if (v && !/^https?:\/\//i.test(v)) v = 'https://' + v; url.value = v; save(v); } }, '💾 Guardar'),
        el('button', { class: 'btn btn-ghost small-btn no-delay', onclick: () => { const v = url.value.trim(); if (!v) return toast('Primero escribe la web'); window.open(/^https?:\/\//i.test(v) ? v : 'https://' + v, '_blank', 'noopener'); } }, '👀 Probarla'),
        el('button', { class: 'btn btn-ghost small-btn no-delay', onclick: () => { url.value = ''; save(''); } }, '🗑️ Quitar'))));
  },
  // ---------------------------------------------------------------- Mis datos de administradora
  async me(root) {
    root.replaceChildren(el('div', { class: 'card adm-me' },
      el('div', { class: 'pw-show-row' }, el('span', {}, '👤 Nombre'), el('b', { class: 'pw-dots' }, S.profile?.name || '—')),
      el('div', { class: 'pw-show-row' }, el('span', {}, '📧 Correo para entrar'), el('b', { class: 'pw-dots' }, S.user?.email || '—')),
      pwShow('🔑 Contraseña para entrar', savedPw()),
      pwShow('🔒 Contraseña de configuración', savedCfg()),
      el('p', { class: 'muted', style: 'margin-top:10px' }, 'Pulsa el ojo 👁️ para ver cada contraseña. Solo se recuerdan en este aparato (no se guardan en internet): en otro móvil u ordenador se verán después de haberlas escrito allí una vez.')),
      // la de entrar se cambia SOLO por email: hace falta tener acceso a tu correo
      (() => {
        const msg = el('p', { class: 'muted' });
        const btn = el('button', { type: 'button', class: 'btn small-btn no-delay', onclick: async () => {
          if (!await popup('<h2>📧</h2><p>Te voy a enviar un correo a tu Gmail con un enlace para poner una contraseña nueva. ¿Lo envío?</p>', { cls: 'small', buttons: [{ label: 'No', value: false, cls: 'btn-ghost' }, { label: '📧 Sí, envíalo', value: true }] })) return;
          btn.disabled = true;
          try { await store.resetPassword(S.user.email); msg.innerHTML = '✅ <b>Correo enviado.</b> Ábrelo (mira también en «Spam» o «Promociones»), pulsa el enlace y escribe la contraseña nueva. Después, la próxima vez que entres en la app, usa la nueva.'; }
          catch (e) { msg.textContent = '⚠️ No se ha podido enviar: ' + (e.code || e.message); }
          btn.disabled = false;
        } }, '📧 Enviarme el correo para cambiarla');
        return el('div', { class: 'card pwc-card' }, el('h3', {}, '🔑 Cambiar la contraseña para entrar'),
          el('p', { class: 'muted' }, 'La que escribes después del PIN 1970 para entrar en la app. Por seguridad, se cambia desde tu correo: te llega un enlace de Google y allí pones la nueva. Al cambiarla, se cierra la sesión en tus otros aparatos en menos de 1 hora.'),
          btn, msg);
      })(),
      pwChangeCard('🔒 Cambiar la contraseña de configuración', 'La que te pide al entrar en 🔒 Configuración.',
        async (cur, nw) => {
          if (!(await store.adminLogin(S.user.uid, cur))) throw new Error('La contraseña actual no es correcta');
          await store.adminChangePw(S.user.uid, nw); rememberCfg(nw);
        }, () => VIEWS.me(root)));
  },
  async answers(root, tab = 'people') {
    const { all } = await loadAll();
    const pendingN = all.reduce((k, { a }) => k + Object.values(a).filter(r => r.status === 'pending').length, 0);
    const tabs = el('div', { class: 'rs-tabs' },
      el('button', { class: 'btn small-btn no-delay' + (tab === 'people' ? '' : ' btn-ghost'), onclick: () => VIEWS.answers(root, 'people') }, '👥 Por persona'),
      el('button', { class: 'btn small-btn no-delay' + (tab === 'pending' ? '' : ' btn-ghost'), onclick: () => VIEWS.answers(root, 'pending') }, `⏳ Por corregir (${pendingN})`));
    if (tab === 'people') {
      const sorted = [...all].sort((x, y) => String(x.u.name || x.u.email || '').localeCompare(String(y.u.name || y.u.email || ''), 'es'));
      const peopleBox = el('div', { class: 'rs-people' });
      root.replaceChildren(tabs,
        el('p', { class: 'muted' }, 'Toca a una persona para ver lo que ha hecho en cada casilla.'),
        searchBox(peopleBox, '.rs-person'), peopleBox);
      peopleBox.append(...sorted.map(({ u, a }) => {
          const done = Object.keys(a).length, ok = Object.values(a).filter(r => r.status === 'correct').length, pend = Object.values(a).filter(r => r.status === 'pending').length;
          return el('button', { class: 'rs-person no-delay', onclick: () => personAnswers(root, u, a) },
            el('b', {}, u.name || u.email || '—'),
            el('span', {}, `📦 ${done}/25 · ⭐ ${ok}` + (pend ? ` · ⏳ ${pend}` : '')));
        }));
      return;
    }
    const list = el('div');
    const draw = () => {
      const rows = [];
      all.forEach(({ u, a }) => Object.entries(a).forEach(([day, r]) => rows.push({ u, day: +day, r })));
      rows.sort((x, y) => (y.r.at || 0) - (x.r.at || 0));
      const shown = rows.filter(x => x.r.status === 'pending');
      list.replaceChildren(shown.length ? el('table', {},
        el('tr', {}, el('th', {}, 'Persona'), el('th', {}, 'Día'), el('th', {}, 'Respuesta'), el('th', {}, 'Estado')),
        ...shown.map(x => el('tr', {},
          el('td', {}, x.u.name || '', el('br'), el('small', {}, who2(x.u))),
          el('td', {}, String(x.day)),
          el('td', {}, String(x.r.answer ?? ''), x.r.extra?.missing ? el('div', { class: 'ans' }, 'Faltaba: ' + x.r.extra.missing) : null),
          el('td', {}, statusButtons(x.u.uid, x.day, x.r, () => draw()))))) : el('p', {}, '🎉 No hay respuestas pendientes de corregir.'));
    };
    draw();
    root.replaceChildren(tabs, searchBox(list, 'tr:not(:first-child)'), list);
  },

  // ---------------------------------------------------------------- Usuarios
  async users(root) {
    // rápido: primero la lista (y lo que ya teníamos guardado); los aciertos y las figuras se van rellenando
    const fresh = cache && Date.now() - cacheAt < 60000;
    const users = fresh ? cache.users : await store.listUsers();
    const ansOf = {}; (fresh ? cache.all : []).forEach(x => { ansOf[x.u.uid] = x.a; });
    setTimeout(() => users.forEach(u => { if (u.pinChangedAt) try { localStorage.setItem(pinSeenKey(u), String(u.pinChangedAt)); } catch {} }), 1500);
    const setOf = {};
    users.sort((x, y) => String(x.name || x.email || '').localeCompare(String(y.name || y.email || ''), 'es'));
    const cards = users.map(u => {
      const img = el('img', { class: 'u-fig', src: FIG_IMG.galleta, alt: '' });
      const score = el('span', { class: 'u-score' }, ansOf[u.uid] ? '⭐ ' + Object.values(ansOf[u.uid]).filter(r => r.status === 'correct').length + ' aciertos' : '⭐ …');
      const open = async () => {
        const a = ansOf[u.uid] || await store.getAnswers(u.uid).catch(() => ({}));
        const st = setOf[u.uid] || await store.getSettings(u.uid).catch(() => null) || {};
        userPanel(root, u, a, st);
      };
      const delBtn = el('button', { class: 'btn small-btn u-btn u-del', onclick: () => deleteUser(u, root) }, '🗑️ Eliminar');
      const card = el('div', { class: 'u-card', onclick: e => { if (!e.target.closest('button')) open(); } },
        img,
        el('div', { class: 'u-info' }, el('b', {}, u.name || '—'), el('small', {}, who2(u)), pinNote(u), score),
        el('div', { class: 'u-btns' }, el('button', { class: 'btn small-btn u-btn', onclick: open }, '⚙️ Configurar'), u.uid === S.user.uid ? null : delBtn));
      // relleno en segundo plano
      store.getSettings(u.uid).then(st => { setOf[u.uid] = st || {}; img.src = FIG_IMG[st?.figure || 'galleta']; }).catch(() => {});
      store.getAnswers(u.uid).then(a => { ansOf[u.uid] = a; score.textContent = '⭐ ' + Object.values(a).filter(r => r.status === 'correct').length + ' aciertos'; }).catch(() => {});
      return card;
    });
    const uBox = el('div', { class: 'u-cards' }, ...cards);
    root.replaceChildren(el('p', { class: 'muted' }, 'Pulsa «Configurar» para elegir su figura, si ve su progreso y corregir o reiniciar sus días. «Eliminar» borra a la persona y todo lo que ha hecho.'),
      searchBox(uBox, '.u-card'), uBox);
    // la próxima vez, al momento
    Promise.all(users.map(async u => ({ u, a: ansOf[u.uid] || await store.getAnswers(u.uid).catch(() => ({})) }))).then(all => { cache = { users, all }; cacheAt = Date.now(); });
  },

  // ---------------------------------------------------------------- Contenido
  async days(root) {
    const lang = el('select', {}, el('option', { value: 'es' }, 'Español'), el('option', { value: 'ca' }, 'Català'), el('option', { value: 'en' }, 'English'));
    const daySel = el('select', {}, ...Array.from({ length: 25 }, (_, i) => el('option', { value: i + 1 }, `Día ${i + 1}`)));
    const editor = el('div');
    const load = async () => {
      const n = +daySel.value, L = lang.value;
      const d = await loadDay(n) || defaultDay(n);
      const f = {};
      const ta = (v, rows = 3) => el('textarea', { rows }, v || '');
      const parts = [el('p', {}, el('b', {}, 'Tipo: '), TYPE_NAME[d.type] || d.type)];
      if (d.type === 'quiz') {
        f.q = ta(d.q?.[L] ?? '', 2);
        const opts = (d.options?.[L] || d.options?.es || ['', '', '', '']).slice(0, 4);
        f.opts = [0, 1, 2, 3].map(i => el('input', { type: 'text', value: opts[i] || '' }));
        f.correct = [0, 1, 2, 3].map(i => el('input', { type: 'radio', name: 'corr', checked: +d.correct === i }));
        parts.push(el('label', {}, 'Pregunta', f.q), el('p', { class: 'muted' }, 'Respuestas (marca la correcta):'),
          ...[0, 1, 2, 3].map(i => el('div', { class: 'opt-row' }, f.correct[i], el('b', {}, 'ABCD'[i]), f.opts[i])));
      }
      if (d.type === 'roulette') {
        // cada casilla de la ruleta con su número y su color
        const list = el('div', { class: 'mis-list' });
        f.mis = (d.missions || []).map(m => m?.[L] ?? m?.es ?? '');
        const drawMis = () => list.replaceChildren(...f.mis.map((m, i) => el('div', { class: 'mis-row' },
          el('span', { class: 'mis-num', style: `background:${R_COLS[i % R_COLS.length]}` }, i + 1),
          el('input', { type: 'text', value: m, oninput: e => { f.mis[i] = e.target.value; } }),
          f.mis.length > 2 ? el('button', { type: 'button', class: 'mis-del', title: 'Quitar', onclick: () => { f.mis.splice(i, 1); drawMis(); } }, '✕') : null)),
          f.mis.length < 10 ? el('button', { type: 'button', class: 'btn btn-ghost small-btn', onclick: () => { f.mis.push(''); drawMis(); } }, '➕ Añadir casilla') : null);
        drawMis();
        f.note = el('input', { type: 'text', value: d.rouletteNote?.[L] ?? (L === 'es' ? DEFAULT_R_NOTE : '') });
        parts.push(el('p', {}, el('b', {}, '🎡 Casillas de la ruleta'), ' (de 2 a 10; el número y el color son los que se ven en la ruleta)'), list,
          el('label', {}, 'Frase que sale debajo de la misión', f.note));
      }
      if (d.type === 'hats') {
        const H = [['hat1Title', 'Gorro 1 · título'], ['hat1Text', 'Gorro 1 · mensaje'], ['hatReminder', 'Gorro 1 · recordatorio en pequeño'],
          ['hat2Title', 'Gorro 2 · título'], ['hat2Joke', 'Gorro 2 · chiste'], ['hat2Answer', 'Gorro 2 · respuesta'], ['gdResult', 'Gorro 3 · resultado del detector']];
        f.hats = {};
        H.forEach(([k, l]) => { f.hats[k] = ta(d[k]?.[L] ?? '', 2); f.hats[k].placeholder = 'Vacío = texto original'; parts.push(el('label', {}, l, f.hats[k])); });
      }
      if (d.type === 'differences') {
        f.scare = el('input', { type: 'number', min: 1, max: 30, value: d.scareSeconds ?? 5 });
        parts.push(el('label', {}, 'Segundos que dura la imagen del susto', f.scare));
      }
      parts.push(actCard(n, L, d, 'act1', '🎄 Actividad 1 (personas con árbol)'), actCard(n, L, d, 'act2', '🧙 Actividad 2 (personas con gnomo)'));
      const save = el('button', { class: 'btn', onclick: async () => {
        const nd = JSON.parse(JSON.stringify(d)); delete nd.openAt;
        const setL = (k, v) => { nd[k] = { ...(nd[k] || {}), [L]: v }; };
        if (d.type === 'quiz') {
          setL('q', f.q.value.trim());
          nd.options = { ...(nd.options || {}), [L]: f.opts.map(o => o.value.trim()) };
          nd.correct = f.correct.findIndex(r => r.checked);
        }
        if (d.type === 'roulette') {
          const lines = f.mis.map(s => s.trim()).filter(Boolean).slice(0, 10);
          if (lines.length < 2) return toast('La ruleta necesita al menos 2 casillas');
          nd.missions = lines.map((s, i) => ({ ...(d.missions?.[i] || {}), [L]: s }));
          setL('rouletteNote', f.note.value.trim());
        }
        if (d.type === 'hats') Object.entries(f.hats).forEach(([k, x]) => setL(k, x.value.trim()));
        if (d.type === 'differences') nd.scareSeconds = Math.max(1, +f.scare.value || 5);
        { const fresh = await loadDay(n); if (fresh) { nd.act1 = fresh.act1; nd.act2 = fresh.act2; } } // las actividades se guardan aparte, al momento
        try { await store.saveDay(n, nd, S.config.year); toast('💾 Día ' + n + ' guardado'); } catch (e) { toast('Error: ' + e.message, 5000); }
      } }, '💾 Guardar día ' + n);
      const reset = el('button', { class: 'btn btn-ghost', onclick: async () => {
        if (!confirm('¿Volver al contenido original de este día?')) return;
        await store.saveDay(n, defaultDay(n), S.config.year); toast('Restaurado'); load();
      } }, '↺ Restaurar original');
      editor.replaceChildren(el('div', { class: 'card' }, ...parts, el('div', { class: 'row' }, save, reset)));
    };
    daySel.onchange = load; lang.onchange = load;
    root.replaceChildren(el('div', { class: 'row' }, el('label', {}, 'Día', daySel), el('label', {}, 'Idioma del texto', lang)),
      el('p', { class: 'muted' }, 'Lo que escribes aquí solo lo ven los usuarios a partir del día que toca. Si escribes en español y no en catalán o inglés, en esos idiomas se verá el texto original.'), editor);
    load();
  },

  // ---------------------------------------------------------------- Premios y ajustes
  async general(root) {
    const pr = S.config.prizes;
    const fields = Object.fromEntries(['p10', 'p15', 'p20', 'p25'].map(k => [k, el('textarea', { rows: 2 }, pr[k] || '')]));
    const year = el('input', { type: 'number', value: S.config.year, min: 2024, max: 2100 });
    const testBtn = el('button', { class: 'test-switch no-delay', onclick: () => {
      const on = !testMode(); setTestMode(on); drawTest(); toast(on ? '🧪 Modo prueba activado' : 'Modo prueba desactivado');
    } });
    const drawTest = () => { const on = testMode(); testBtn.classList.toggle('on', on); testBtn.replaceChildren(el('span', { class: 'ts-knob' }), el('b', {}, on ? 'ACTIVADO' : 'DESACTIVADO')); };
    drawTest();
    // abre (o vuelve a cerrar) todas las casillas para TODAS las personas, aunque no haya llegado su día
    const allBtn = el('button', { class: 'test-switch no-delay', onclick: async () => {
      const on = !S.config.openAll; allBtn.disabled = true;
      try { await store.saveConfig({ openAll: on }); S.config.openAll = on; drawAll(); renderHome(); toast(on ? '🔓 Casillas abiertas para todos' : '🔒 Casillas cerradas hasta su día'); }
      catch (e) { toast('⚠️ ' + (e.code || e.message), 5000); }
      allBtn.disabled = false;
    } });
    const drawAll = () => { const on = !!S.config.openAll; allBtn.classList.toggle('on', on); allBtn.replaceChildren(el('span', { class: 'ts-knob' }), el('b', {}, on ? 'ABIERTAS' : 'CERRADAS')); };
    drawAll();
    const np = el('input', { type: 'password', placeholder: 'Nueva contraseña' });
    // un solo botón fijo arriba que guarda todo lo de esta pestaña
    const saveAll = el('button', { class: 'btn small-btn no-delay', onclick: async () => {
      saveAll.disabled = true;
      const btns = [...root.querySelectorAll('.card button')].filter(b => /^💾|^Guardar/.test(b.textContent.trim()));
      for (const b of btns) {
        if (/año/.test(b.textContent) && +year.value === +S.config.year) continue; // el año solo si ha cambiado
        b._go = true; b.click(); await new Promise(r => setTimeout(r, 250));
      }
      saveAll.disabled = false; setTimeout(() => toast('💾 Todo guardado'), 400);
    } }, '💾 Guardar todo');
    root.replaceChildren(
      el('div', { class: 'adm-sticky' }, el('span', { class: 'adm-sticky-t' }, '🏆 Premios y ajustes'), saveAll),
      (() => {
        // premios distintos para galleta, árbol y gnomo
        const pf = S.config.prizesFig || {};
        const LBL = { p10: 'Al llegar a la casilla 10', p15: 'Al llegar a la casilla 15', p20: 'Al llegar a la casilla 20', p25: 'Al llegar a la casilla 25 (premio final)' };
        const F = {};
        const tabs = el('div', { class: 'pz-tabs' }), panes = el('div');
        [['galleta', 'Galleta'], ['arbol', 'Árbol'], ['gnomo', 'Gnomo']].forEach(([fg, name], i) => {
          F[fg] = Object.fromEntries(['p10', 'p15', 'p20', 'p25'].map(k => [k, el('textarea', { rows: 2, placeholder: pr[k] || '' }, (pf[fg]?.[k] ?? pr[k]) || '')]));
          // lo que sale en el popup «Pulsa para conseguir el regalo»: un mensaje y una foto (opcional)
          ['m10', 'm15', 'm20', 'm25'].forEach(k => { F[fg][k] = el('textarea', { rows: 3, placeholder: 'Ej.: ¡Enhorabuena! Busca debajo del árbol un sobre con tu nombre 🎄' }, pf[fg]?.[k] || ''); });
          const goalBox = g => {
            const thumb = el('div', { class: 'pz-photo-row' });
            const fileIn = el('input', { type: 'file', accept: 'image/*', style: 'display:none' });
            const draw = src => thumb.replaceChildren(
              src ? el('img', { src, alt: '' }) : el('small', { class: 'muted' }, 'Sin foto (no saldrá ningún marco)'),
              el('button', { type: 'button', class: 'btn small-btn no-delay', onclick: () => fileIn.click() }, src ? '📷 Cambiar foto' : '📷 Añadir foto'),
              src ? el('button', { type: 'button', class: 'btn btn-ghost small-btn no-delay', onclick: async () => { await store.savePrizePhoto(fg, g, ''); draw(''); toast('🗑️ Foto quitada'); } }, '✕ Quitar') : null, fileIn);
            fileIn.onchange = async () => {
              const f = fileIn.files[0]; fileIn.value = ''; if (!f) return;
              try { const src = await shrink(f, 1000, 380000); await store.savePrizePhoto(fg, g, src); draw(src); toast('💾 Foto guardada'); } catch (e) { toast('⚠️ ' + (e.message || 'No se ha podido guardar la foto')); }
            };
            draw(''); store.getPrizePhoto(fg, g).then(draw).catch(() => {});
            return el('div', { class: 'pz-goal' }, el('b', {}, '🎁 ' + LBL['p' + g]),
              el('label', {}, 'Premio (lo que se gana)', F[fg]['p' + g]),
              el('label', {}, 'Mensaje del popup «Pulsa para conseguir el regalo»', F[fg]['m' + g]),
              el('label', {}, 'Foto (opcional): sale pequeña con marco; al pulsarla se hace grande'), thumb);
          };
          const pane = el('div', { class: 'pz-pane', style: i ? 'display:none' : '' }, ...[10, 15, 20, 25].map(goalBox));
          const tb = el('button', { type: 'button', class: 'pz-tab no-delay' + (i ? '' : ' on'), onclick: () => {
            [...tabs.children].forEach(b => b.classList.remove('on')); tb.classList.add('on');
            [...panes.children].forEach(p => p.style.display = 'none'); pane.style.display = '';
          } }, el('img', { src: FIG_IMG[fg], alt: '' }), name);
          tabs.append(tb); panes.append(pane);
        });
        return el('div', { class: 'card' }, el('h3', {}, '🏆 Premios'),
          el('p', { class: 'muted' }, 'Cada figura tiene sus propios premios. Elige la figura y escribe lo que se gana en cada casilla. Cuando alguien consigue un premio, le sale el botón «🎁 Pulsa para conseguir el regalo»: se abre una caja de regalo y aparece el premio, tu mensaje y la foto (si pones una). Las fotos se guardan al momento; los textos, con «Guardar premios».'),
          tabs, panes,
          el('button', { class: 'btn', onclick: async () => {
            const prizesFig = Object.fromEntries(Object.entries(F).map(([fg, fs]) => [fg, Object.fromEntries(Object.entries(fs).map(([k, f]) => [k, f.value.trim()]))]));
            await store.saveConfig({ prizesFig }); S.config.prizesFig = prizesFig; toast('💾 Premios guardados');
          } }, '💾 Guardar premios'));
      })(),
      marqueeCard(),
      (() => {
        const sp = { ...SPLASH_DEFAULT, ...(S.config.splash || {}) };
        const show = el('input', { type: 'checkbox', checked: sp.show !== false });
        const secs = el('input', { type: 'number', min: 1, max: 30, value: sp.seconds });
        const tt = Object.fromEntries(['es', 'ca', 'en'].map(l => [l, el('input', { type: 'text', value: sp.text?.[l] || '' })]));
        return el('div', { class: 'card' }, el('h3', {}, '❄️ Pantalla de bienvenida (nieve)'),
          el('label', { class: 'inline' }, show, ' Mostrarla al abrir la app'),
          el('label', {}, 'Segundos que nieva antes de salir el título', secs),
          el('label', {}, 'Título en español', tt.es), el('label', {}, 'Título en catalán', tt.ca), el('label', {}, 'Título en inglés', tt.en),
          el('p', { class: 'muted' }, 'Se ve una vez cada vez que se abre la app. El cambio llega a cada persona la próxima vez que entre.'),
          el('div', { class: 'row' },
            el('button', { class: 'btn small-btn', onclick: async () => {
              const v = { show: show.checked, seconds: Math.max(1, Math.min(30, +secs.value || 5)), text: { es: tt.es.value.trim(), ca: tt.ca.value.trim(), en: tt.en.value.trim() } };
              await store.saveConfig({ splash: v }); S.config.splash = v; try { localStorage.setItem('adv_splash', JSON.stringify(v)); } catch {} toast('💾 Bienvenida guardada');
            } }, '💾 Guardar'),
            el('button', { class: 'btn btn-ghost small-btn', onclick: () => { try { sessionStorage.removeItem('adv_splash_seen'); } catch {} location.reload(); } }, '👀 Verla ahora')));
      })(),
      el('div', { class: 'card' }, el('h3', {}, '📅 Año del calendario'),
        el('p', { class: 'muted' }, 'Las casillas se abren del 1 al 25 de diciembre de este año (hora de España).'),
        el('div', { class: 'row' }, year, el('button', { class: 'btn small-btn', onclick: async e => {
          const y = +year.value; e.target.disabled = true;
          await store.saveConfig({ year: y }); S.config.year = y;
          // re-guardar los días ya personalizados con las nuevas fechas
          for (let n = 1; n <= 25; n++) { const c = await store.getDay(n).catch(() => null); if (c && !c.locked) { delete c.openAt; await store.saveDay(n, c, y); } }
          e.target.disabled = false; toast('💾 Año guardado');
        } }, 'Guardar año'))),
      el('div', { class: 'card' }, el('h3', {}, '🔓 Abrir todas las casillas a todos'),
        el('p', { class: 'muted' }, 'Solo antes de diciembre. ABIERTAS: todas las personas pueden abrir todas las casillas para probarlas. CERRADAS: cada casilla se abre en su día de diciembre. El 1 de diciembre todo lo que se haya hecho antes se borra solo (también lo tuyo) y todos empiezan de 0.'), allBtn),
      el('div', { class: 'card' }, el('h3', {}, '🧪 Modo prueba'),
        el('p', { class: 'muted' }, 'Abre todas las casillas, solo para ti, para probarlas. Se queda activado (aunque cierres la app) hasta que tú lo desactives aquí.'), testBtn),
      (() => {
        const cur = el('input', { type: 'password', placeholder: 'Contraseña actual', autocomplete: 'off' });
        const n1 = el('input', { type: 'password', placeholder: 'Contraseña nueva', autocomplete: 'new-password' });
        const n2 = el('input', { type: 'password', placeholder: 'Repite la contraseña nueva', autocomplete: 'new-password' });
        return el('div', { class: 'card' }, el('h3', {}, '🔐 Cambiar contraseña de configuración'),
          el('div', { class: 'settings-form' }, cur, n1, n2),
          el('button', { class: 'btn small-btn', style: 'margin-top:8px', onclick: async () => {
            if (n1.value.length < 6) return toast('Mínimo 6 caracteres');
            if (n1.value !== n2.value) return toast('Las dos contraseñas nuevas no son iguales');
            if (!(await store.adminLogin(S.user.uid, cur.value))) return toast('La contraseña actual no es correcta');
            try { await store.adminChangePw(S.user.uid, n1.value); rememberCfg(n1.value); [cur, n1, n2].forEach(x => x.value = ''); toast('🔐 Contraseña cambiada'); } catch (e) { toast('Error: ' + e.message, 5000); }
          } }, 'Cambiar'),
          el('p', { class: 'muted', style: 'margin-top:8px' }, `Si la olvidas: pulsa 🔒 y luego «¿Has olvidado la contraseña de configuración?» (te explica cómo hacerlo desde Firebase).`));
      })(),
      el('div', { class: 'card' }, el('h3', {}, '🚪 Cerrar sesión'),
        el('p', { class: 'muted' }, 'Sales de tu cuenta en este móvil u ordenador. Para volver a entrar necesitarás tu correo y tu contraseña.'),
        el('button', { class: 'btn btn-ghost small-btn', onclick: async () => {
          const ok = await popup(`<h2>🚪 Cerrar sesión</h2><p>¿Seguro que quieres salir de tu cuenta?<br><small>Para volver a entrar necesitarás tu correo y tu contraseña.</small></p>`,
            { cls: 'small', buttons: [{ label: 'Cancelar', value: false, cls: 'btn-ghost' }, { label: 'Sí, cerrar sesión', value: true }] });
          if (!ok) return; // se queda en Configuración
          S.isAdmin = false; setTestMode(false);
          document.querySelectorAll('.popup-back').forEach(x => x.remove());
          await store.signOut();
        } }, '🚪 Cerrar sesión')),
      (() => {
        const ta = el('textarea', { rows: 3 }, S.config.missedMsg || MISSED_DEFAULT);
        return el('div', { class: 'card' }, el('h3', {}, '🧌 Aviso de día olvidado'),
          el('p', { class: 'muted' }, 'Solo funciona en diciembre: si una persona deja pasar un día sin abrir su casilla, en su franja de figuras sale un duende verde 🧌 en ese día. Al tocarlo aparece este mensaje. No tiene nada que ver con las actividades 1 y 2. Escribe {dia} donde quieras que salga el número del día.'),
          ta, el('button', { class: 'btn small-btn', style: 'margin-top:8px', onclick: async () => { await store.saveConfig({ missedMsg: ta.value.trim() }); S.config.missedMsg = ta.value.trim(); toast('💾 Guardado'); } }, '💾 Guardar aviso'));
      })());
    // los «Guardar» de cada apartado se esconden: lo guarda todo el botón fijo de arriba
    root.querySelectorAll('.card button').forEach(b => { if (/^💾|^Guardar/.test(b.textContent.trim())) { b.dataset.pin = '1'; b.style.display = 'none'; } });
  },
};

// Respuestas → una persona: un desplegable por casilla con lo que ha hecho
const DAY_NAMES = ['', 'Los gorros', 'Pregunta', 'Sudoku', 'Los renos', 'Desafío de colores', 'Las diferencias', 'Puzle del tren', 'El árbol', 'Papá Noel dice', 'Pregunta',
  'Laberinto', 'Ojo de lince', 'Ruleta de superpoderes', 'Atrapa los regalos', 'Ordena las bolas', 'Diploma', 'Tres en raya', 'Puzle de Papá Noel', 'El código secreto',
  'Ruleta del disparate', 'Puzle deslizante', 'Sopa de letras', 'Crucigrama', 'El baile', 'Memory y resumen'];
const ST_TXT = { correct: '✅ Correcta', incorrect: '❌ Incorrecta', pending: '⏳ Por corregir' };
const when = t => t && t !== true ? new Date(t).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
async function personAnswers(root, u, a) {
  const set = await store.getSettings(u.uid).catch(() => null) || {};
  const once = await store.getOnce(u.uid, 'slot').catch(() => null); u = { ...u, slot: once || null };
  const fig = set.figure || 'galleta', act = { arbol: 'actividad 1', gnomo: 'actividad 2' }[fig];
  const actDone = u.actDone || {};
  const vals = Object.values(a);
  const head = el('div', { class: 'card rs-head' },
    el('img', { src: FIG_IMG[fig], alt: '' }),
    el('div', {}, el('h3', {}, u.name || u.email || '—'), el('small', {}, who2(u)),
      el('p', {}, `📦 Casillas hechas: ${vals.length}/25 · ⭐ Correctas: ${vals.filter(r => r.status === 'correct').length}` +
        (vals.some(r => r.status === 'pending') ? ` · ⏳ Por corregir: ${vals.filter(r => r.status === 'pending').length}` : '') +
        (act ? ` · 📝 ${act[0].toUpperCase() + act.slice(1)}: ${Object.keys(actDone).length} hechas` : '')),
      u.slot?.text ? el('p', {}, '🎰 Máquina de regalos: ', el('b', {}, u.slot.text)) : null));
  const days = [];
  for (let d = 1; d <= 25; d++) {
    const r = a[d];
    const icon = !r ? '▫️' : r.status === 'correct' ? '✅' : r.status === 'incorrect' ? '❌' : '⏳';
    const body = el('div', { class: 'rs-body' });
    if (!r) body.append(el('p', { class: 'muted' }, 'Todavía no la ha hecho.'));
    else {
      if (r.answer !== '' && r.answer != null) body.append(el('p', {}, '💬 Respuesta: ', el('b', {}, String(r.answer))));
      if (r.extra?.missing) body.append(el('p', {}, '🔎 Faltaba: ' + r.extra.missing));
      if (r.extra?.mz?.prizes?.length) body.append(el('p', {}, '🎁 Premios: ' + r.extra.mz.prizes.join(' · ')));
      body.append(el('p', {}, `${ST_TXT[r.status] || '✔︎ Hecha'}` + (when(r.at) ? ` · 🕒 ${when(r.at)}` : '')));
      const aq = u.actQuiz?.[d]; if (aq) body.append(el('p', {}, `❓ Pregunta de la ${act || 'actividad'}: ${aq.ok ? '✅ acertada' : '❌ fallada'} (primera vez)`));
      if (act) body.append(el('p', {}, actDone[d] ? `📝 ${act[0].toUpperCase() + act.slice(1)}: hecha` : `📝 ${act[0].toUpperCase() + act.slice(1)}: aún no`));
      if (d === 24 && u.giftOpened) body.append(el('p', {}, '🎁 Ha abierto el regalo sorpresa'));
      if (d === 25 && u.slot?.text) body.append(el('p', {}, '🎰 Máquina de regalos: ' + u.slot.text));
      const sb = statusButtons(u.uid, d, r, () => { sum.firstChild.textContent = { correct: '✅', incorrect: '❌', pending: '⏳' }[r.status] || '✔︎'; clearCache(); });
      body.append(el('div', { class: 'rs-st' }, el('span', { class: 'muted' }, 'Cambiar estado:'), sb));
    }
    const sum = el('summary', {}, el('span', { class: 'rs-ic' }, icon), el('b', {}, `Día ${d}`), el('span', { class: 'rs-name' }, DAY_NAMES[d]));
    days.push(el('details', { class: 'rs-day' + (r ? '' : ' empty') }, sum, body));
  }
  root.replaceChildren(
    el('div', { class: 'adm-sticky' }, el('button', { class: 'btn btn-ghost small-btn no-delay', onclick: () => VIEWS.answers(root, 'people') }, '← Volver a las personas')),
    head, el('div', { class: 'rs-days' }, ...days));
  root.scrollTop = 0; root.closest('.popup')?.scrollTo?.(0, 0);
}

function statusButtons(uid, day, r, after) {
  const wrap = el('div', { class: 'st-btns' });
  const draw = () => wrap.replaceChildren(...Object.entries(ST).map(([k, sym]) => el('button', {
    class: (r?.status === k ? 'sel ' : '') + k, title: { correct: 'Correcta (con color)', incorrect: 'Incorrecta (blanco y negro)', pending: 'Pendiente' }[k],
    onclick: async () => {
      try { await store.setAnswerStatus(uid, day, k); r = r || {}; r.status = k; draw(); after && after(); }
      catch (e) { toast('Error: ' + e.message, 5000); }
    } }, sym)));
  draw();
  return wrap;
}

// eliminar a una persona: dos confirmaciones
async function deleteUser(u, root) {
  const name = esc(u.name || u.email || '');
  if (!(await popup(`<h2>🗑️ Eliminar a ${name}</h2><p>Se borrará <b>${name}</b> del calendario con todo lo que ha hecho (casillas, respuestas, premios, tarjeta y mensajes).</p><p>¿Seguro que quieres eliminarlo?</p>`,
    { buttons: [{ label: t('cancel'), value: false, cls: 'btn-ghost' }, { label: 'Sí, eliminar', value: true }] }))) return;
  if (!(await popup(`<h2>⚠️ ¿De verdad?</h2><p>Esto <b>no se puede deshacer</b>. ¿Eliminas a <b>${name}</b> definitivamente?</p>`,
    { buttons: [{ label: 'No, lo dejo', value: false, cls: 'btn-ghost' }, { label: '🗑️ Sí, eliminar para siempre', value: true }] }))) return;
  try {
    await store.deleteUserData(u.uid); clearCache();
    toast(`🗑️ ${u.name || u.email} eliminado`);
    VIEWS.users(root);
  } catch (e) { toast('⚠️ No se ha podido eliminar: ' + (e.code || e.message) + (/permission/.test(e.code || '') ? ' (publica las reglas nuevas de Firebase)' : ''), 8000); }
}

function userPanel(root, u, answers, set) {
  // selector con dibujos de las tres figuras
  const fig = el('div', { class: 'fig-pick' }); fig.value = set.figure || 'galleta';
  const drawFig = () => fig.replaceChildren(...FIGS.map(([v, l]) => el('label', { class: v === fig.value ? 'sel' : '', onclick: () => { fig.value = v; drawFig(); } },
    el('img', { src: FIG_IMG[v], alt: '' }), l)));
  drawFig();
  const show = el('input', { type: 'checkbox', checked: set.showProgress !== false });
  const grid = el('div', { class: 'day-grid' });
  for (let d = 1; d <= 25; d++) {
    const r = answers[d];
    grid.append(el('div', { class: 'day-cell' }, el('b', {}, `Día ${d}`),
      r?.answer != null && r.answer !== '' ? el('div', { class: 'ans' }, String(r.answer)) : el('div', { class: 'ans muted' }, r ? '✔︎' : '—'),
      statusButtons(u.uid, d, r),
      r ? el('button', { class: 'reset-day', title: 'Dejar este día sin hacer', onclick: async () => {
        if (!(await popup(`<h2>↺ Día ${d}</h2><p>¿Dejar el día ${d} de <b>${esc(u.name || u.email)}</b> como no hecho, para que lo pueda repetir?</p>`, { buttons: [{ label: t('cancel'), value: false, cls: 'btn-ghost' }, { label: 'Sí, reiniciar', value: true }] }))) return;
        await resetDays(u, [d]); delete answers[d]; userPanel(root, u, answers, set);
      } }, '↺ Reiniciar') : null));
  }
  const mq = el('input', { type: 'text', value: set.marqueeText || '', placeholder: 'Vacío = el mensaje general de la marquesina' });
  // casillas abiertas antes de tiempo (para probar): por defecto, cerradas
  const early = el('button', { class: 'test-switch no-delay', onclick: async () => {
    const on = !set.earlyOpen; early.disabled = true;
    try {
      if (u.uid === S.user?.uid) setTestMode(on); else await store.setSettings(u.uid, { earlyOpen: on });
      set.earlyOpen = on; drawEarly(); if (u.uid === S.user?.uid) renderHome();
      toast(on ? '🔓 Casillas abiertas antes de tiempo' : '🔒 Casillas cerradas hasta su día');
    } catch (e) { toast('⚠️ ' + (e.code || e.message), 5000); }
    early.disabled = false;
  } });
  const drawEarly = () => { const on = !!set.earlyOpen; early.classList.toggle('on', on); early.replaceChildren(el('span', { class: 'ts-knob' }), el('b', {}, on ? 'ABIERTAS' : 'CERRADAS')); };
  if (u.uid === S.user?.uid && testMode()) set.earlyOpen = true;
  drawEarly();
  const saveUser = async () => {
    try { await store.setSettings(u.uid, { figure: fig.value, showProgress: show.checked, marqueeText: mq.value.trim(), actOverrides: {} }); toast('💾 Guardado'); }
    catch (e) { toast('Error: ' + e.message, 5000); }
  };
  root.replaceChildren(
    el('div', { class: 'adm-sticky' },
      el('button', { class: 'btn btn-ghost small-btn', onclick: () => VIEWS.users(root) }, '← Volver'),
      el('button', { class: 'btn small-btn', onclick: saveUser }, '💾 Guardar configuración')),
    el('h3', {}, `${esc(u.name || '')} · ${esc(who2(u))}`),
    el('div', { class: 'card' },
      el('label', {}, 'Figura y tipo de calendario', fig),
      el('label', { class: 'inline' }, show, ' Ver arriba la franja con sus figuras y su progreso')),
    el('div', { class: 'card' }, el('h3', {}, '🔓 Casillas abiertas antes de tiempo'),
      el('p', { class: 'muted' }, u.uid === S.user?.uid
        ? 'Para hacer pruebas: ABIERTAS = puedes abrir todas tus casillas aunque no haya llegado su día. Se queda así hasta que lo cambies.'
        : 'Para que esta persona pueda probar: ABIERTAS = puede abrir todas las casillas antes de su día (lo verá la próxima vez que entre). Solo vale antes de diciembre; el 1 de diciembre se cierran solas. Por defecto, CERRADAS.'), early),
    el('div', { class: 'card' }, el('h3', {}, 'Días (✓ con color · ✗ blanco y negro · ⏳ pendiente)'), grid,
      el('button', { class: 'btn small-btn', style: 'margin-top:10px;background:linear-gradient(#e86a3a,#a83b12)', onclick: async () => {
        const days = Object.keys(answers).map(Number); if (!days.length) return toast('No tiene ningún día hecho');
        if (!(await popup(`<h2>↺ Reiniciar todo</h2><p>Se borrarán los <b>${days.length}</b> días hechos de <b>${esc(u.name || u.email)}</b> y todas sus casillas quedarán como nuevas, sin abrir. ¿Seguro?</p>`, { buttons: [{ label: t('cancel'), value: false, cls: 'btn-ghost' }, { label: 'Sí, reiniciar todo', value: true }] }))) return;
        await resetDays(u, days); Object.keys(answers).forEach(k => delete answers[k]); userPanel(root, u, answers, set);
      } }, '↺ Reiniciar todas sus casillas')),
    el('div', { class: 'card' }, el('h3', {}, '📣 Mensaje de su marquesina'),
      el('p', { class: 'muted' }, 'Lo que verá esta persona pasando por la pantalla de inicio. Si lo dejas vacío, verá el mensaje general.'), mq),
    el('p', { class: 'muted' }, 'Las actividades 1 y 2 de cada casilla se escriben en «📅 Contenido de los días» (son las mismas para todos).'));
}

function marqueeCard() {
  const m = { ...MARQUEE_DEFAULT, ...(S.config.marquee || {}) };
  const show = el('input', { type: 'checkbox', checked: m.show !== false });
  const Y = S.config.year || new Date().getFullYear();
  const DEF = { es: `¡Feliz Navidad ${Y} y próspero Año Nuevo!`, ca: `Bon Nadal ${Y} i feliç Any Nou!`, en: `Merry Christmas ${Y} and a Happy New Year!` };
  // si no hay texto (o es el antiguo «pulsa para verla en grande»), se muestra la felicitación por defecto
  const curTxt = l => { const v = (m.text && m.text[l]) || ''; return !v || /en grande|en gran|full screen/i.test(v) ? DEF[l] : v; };
  const texts = Object.fromEntries(['es', 'ca', 'en'].map(l => [l, el('input', { type: 'text', value: curTxt(l) })]));
  const speed = el('input', { type: 'range', min: 4, max: 40, value: 44 - m.speed }); // derecha = más rápida
  const speedLbl = el('span', {}, '');
  const color = el('select', {}, ...MARQUEE_COLORS.map(([id, name]) => el('option', { value: id, selected: id === m.colorName }, name)));
  const weight = el('select', {}, ...[[300, 'Fina'], [400, 'Normal'], [600, 'Semigruesa'], [700, 'Gruesa'], [800, 'Muy gruesa']].map(([v, l]) => el('option', { value: v, selected: +m.weight === v }, l)));
  const prevTrack = el('div', { class: 'marquee-track' });
  const prev = el('div', { class: 'marquee', style: 'border-radius:8px;border:1px solid #e3cfa5' }, prevTrack);
  const cur = () => {
    const c = MARQUEE_COLORS.find(x => x[0] === color.value) || MARQUEE_COLORS[0];
    return { show: show.checked, speed: 44 - speed.value, weight: +weight.value, colorName: c[0], color: c[2], text: Object.fromEntries(['es', 'ca', 'en'].map(l => { const v = texts[l].value.trim(); return [l, v === DEF[l] ? '' : v]; })) };
  };
  const upd = () => {
    const v = cur(); speedLbl.textContent = ` (← lenta · rápida →) ahora: ${v.speed <= 8 ? 'muy rápida' : v.speed <= 14 ? 'rápida' : v.speed <= 24 ? 'normal' : 'lenta'}`;
    prevTrack.style.cssText = `animation-duration:${v.speed}s;color:${v.color};font-weight:${v.weight};${v.colorName.startsWith('neon') ? `text-shadow:0 0 6px ${v.color},0 0 14px ${v.color};` : ''}`;
    prevTrack.replaceChildren(...Array.from({ length: 8 }, () => el('span', {}, (texts.es.value.trim() || '…') + '\u2003✦\u2003')));
  };
  [show, speed, color, weight, ...Object.values(texts)].forEach(x => x.addEventListener('input', upd)); upd();
  return el('div', { class: 'card' }, el('h3', {}, '📣 Marquesina (el texto que se mueve)'),
    el('label', { class: 'inline' }, show, ' Mostrar la marquesina'),
    el('label', {}, 'Texto en español', texts.es), el('label', {}, 'Texto en catalán', texts.ca), el('label', {}, 'Texto en inglés', texts.en),
    el('label', {}, el('span', {}, 'Rapidez', speedLbl), speed),
    el('div', { class: 'row' }, el('label', {}, 'Color de las letras', color), el('label', {}, 'Grosor de las letras', weight)),
    el('p', { class: 'muted' }, 'Así se verá:'), prev,
    el('button', { class: 'btn', style: 'margin-top:10px', onclick: async () => {
      const v = cur(); try { await store.saveConfig({ marquee: v }); S.config.marquee = v; toast('💾 Marquesina guardada'); } catch (e) { toast('Error: ' + e.message, 5000); }
    } }, '💾 Guardar marquesina'));
}

// deja días sin hacer (borra la respuesta); si es tu propio usuario, la portada se actualiza
async function resetDays(u, days) {
  try {
    for (const d of days) await store.deleteAnswer(u.uid, d);
    if (days.map(Number).includes(25)) { await store.delOnce(u.uid, 'slot').catch(() => {}); await store.saveProfile(u.uid, { slot: null }).catch(() => {}); if (u.uid === S.user.uid && S.profile) S.profile.slot = null; } // la máquina también vuelve a estar por tirar
    clearCache();
    // sus juegos vuelven a empezar desde la partida 1 (en su móvil, la próxima vez que entre)
    await store.setSettings(u.uid, { resetAt: Date.now() }).catch(e => console.warn(e));
    if (u.uid === S.user.uid) {
      days.forEach(d => delete S.answers[d]);
      (await import('./app.js?v=22.6')).applyReset(true);
    }
    toast(days.length === 1 ? `↺ Día ${days[0]} reiniciado` : `↺ ${days.length} días reiniciados`);
  } catch (e) { toast('Error: ' + (e.code || e.message), 6000); }
}

// tarjeta de actividad (la misma en «Contenido de los días» y en cada usuario): al guardar se guarda al momento
function actCard(n, L, d, key, label) {
  const langName = { es: 'español', ca: 'catalán', en: 'inglés' }[L];
  const qTag = () => d[key + 'Q']?.[L]?.q ? ' · ❓ con pregunta' : '';
  const prev = el('div', { class: 'act-prev' }, (plain(d[key]?.[L] ?? '') || '—') + qTag());
  return el('div', { class: 'act-card', onclick: async () => {
    const cur = (await loadDay(n)) || defaultDay(n);
    const r = await openActEditor({ day: n, actKey: key, title: label, html: cur[key]?.[L] ?? '', langName, quiz: cur[key + 'Q']?.[L] || null });
    if (r == null) return;
    try {
      const nd = JSON.parse(JSON.stringify(cur)); delete nd.openAt;
      nd[key] = { ...(nd[key] || {}), [L]: r.html };
      const qk = key + 'Q', qs = { ...(nd[qk] || {}) };
      if (r.quiz) qs[L] = r.quiz; else delete qs[L];
      if (L === 'es' && r.quiz) { delete qs.ca; delete qs.en; } // los otros idiomas se traducen solos desde el español
      nd[qk] = qs;
      await store.saveDay(n, nd, S.config.year);
      d[key] = nd[key]; d[qk] = qs; prev.textContent = (plain(r.html) || '—') + qTag();
      toast('✅ Texto guardado');
    } catch (e) { toast('Error al guardar: ' + (e.code || e.message), 6000); }
  } }, el('b', {}, label), prev, el('span', { class: 'act-edit' }, '✏️ Editar (texto, títulos, emojis, fotos y vídeos)'));
}
