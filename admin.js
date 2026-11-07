// Configuración de la administradora (protegida con contraseña)
import { store } from './store.js?v=17.6';
import { t, tx } from './i18n.js?v=17.6';
import { el, popup, toast, esc } from './fx.js?v=17.6';
import { S, renderHome, loadDay, testMode, setTestMode } from './app.js?v=17.6';
import { openActEditor, plain } from './richact.js?v=17.6';
import { R_COLS, DEFAULT_R_NOTE } from './roulette.js?v=17.6';
import { defaultDay, MARQUEE_DEFAULT, MARQUEE_COLORS, MISSED_DEFAULT, SPLASH_DEFAULT } from './defaults.js?v=17.6';

const FIGS = [['galleta', 'Hombrecito de jengibre (solo la puerta)'], ['arbol', 'Árbol de Navidad (+ actividad 1)'], ['gnomo', 'Gnomo (+ actividad 2)']];
export const OWNER_EMAIL = 'elialtarriba@gmail.com';
const FIG_IMG = { galleta: 'galleta.png', arbol: 'arbol.png', gnomo: 'gnomo.png' };
const ST = { correct: '✓', incorrect: '✗', pending: '⏳' };
const TYPE_NAME = { hats: 'Atrapa los 3 gorros', quiz: 'Pregunta con 4 respuestas', reindeer: 'Busca los renos con gafas', differences: 'Las 5 diferencias + susto', tree: 'Decorar el árbol',
  memory: 'Ojo de lince (objeto que falta)', goodcheck: '¿Has sido bueno?', diploma: 'Diploma absurdo', roulette: 'Ruleta del disparate', dance: 'El baile secreto', santa: 'Tu cara en Papá Noel' };

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
    try { await store.adminSetup(S.user.uid, pw.value); S.config.adminConfigured = true; toast('🔐 Contraseña creada'); return true; }
    catch (e) { toast('Error: ' + e.message, 5000); return false; }
  }
  const good = await store.adminLogin(S.user.uid, pw.value);
  if (!good) toast(t('adminWrong'));
  return good;
}

async function forgotAdmin() {
  if ((S.user.email || '').toLowerCase() !== OWNER_EMAIL) {
    return popup(`<h2>🔐</h2><p>Solo la administradora (${OWNER_EMAIL}) puede crear una contraseña nueva. Pídesela a ella.</p>`);
  }
  const n1 = el('input', { type: 'password', placeholder: 'Contraseña nueva', autocomplete: 'new-password' });
  const n2 = el('input', { type: 'password', placeholder: 'Repite la contraseña nueva', autocomplete: 'new-password' });
  const ok = await popup(el('div', { class: 'settings-form' }, el('h2', {}, '🔐 Contraseña olvidada'),
    el('p', {}, 'Como has entrado con la cuenta de la administradora (' + OWNER_EMAIL + '), puedes poner una contraseña de configuración nueva:'), n1, n2),
    { buttons: [{ label: t('cancel'), value: false, cls: 'btn-ghost' }, { label: 'Guardar', value: true }] });
  if (!ok) return false;
  if (n1.value.length < 6) { toast('Mínimo 6 caracteres'); return false; }
  if (n1.value !== n2.value) { toast('Las contraseñas no coinciden'); return false; }
  try { await store.adminOwnerReset(S.user.uid, n1.value); toast('🔐 Contraseña nueva guardada'); return true; }
  catch (e) { toast('Error: ' + (e.code || e.message), 6000); return false; }
}

function showPanel() {
  const content = el('div');
  const tabs = [['answers', '📨 Respuestas'], ['users', '👥 Usuarios'], ['days', '📅 Contenido de los días'], ['general', '🏆 Premios y ajustes']];
  const bar = el('div', { class: 'tabs' });
  const go = id => { [...bar.children].forEach(b => b.classList.toggle('active', b.dataset.id === id)); content.replaceChildren(el('p', { class: 'loading-msg' }, el('span', { class: 'spin' }, '❄'), ' Cargando…'));
    Promise.resolve(VIEWS[id](content)).catch(e => content.replaceChildren(el('p', {}, '⚠️ ' + (e.code || e.message)))); };
  tabs.forEach(([id, label]) => bar.append(el('button', { 'data-id': id, onclick: () => go(id) }, label)));
  const special = el('button', { class: 'sp-special no-delay', onclick: () => {
    [...bar.children].forEach(b => b.classList.remove('active'));
    content.replaceChildren(el('p', { class: 'loading-msg' }, el('span', { class: 'spin' }, '❄'), ' Cargando…'));
    import('./surprise.js?v=17.6').then(m => m.surpriseAdmin(content)).catch(e => content.replaceChildren(el('p', {}, '⚠️ ' + (e.code || e.message))));
  } }, el('span', { class: 'sp-special-ico' }, '💌'), el('span', {}, el('b', {}, 'Mensajes sorpresa'), el('small', {}, 'Un popup para quien tú quieras, el día que quieras')));
  const guide = el('button', { class: 'hg-open no-delay', onclick: () => import('./help.js?v=17.6').then(m => m.openHelp()).catch(e => toast('⚠️ ' + e.message)) },
    el('span', { class: 'hg-open-ico' }, '📖'), el('span', {}, el('b', {}, 'Guía de la app'), el('small', {}, 'Todo lo que tiene y cómo configurarlo, con dibujos')));
  const box = el('div', { class: 'admin' }, el('h2', {}, '⚙️ Configuración'), special, guide, bar, content);
  // los botones de guardar y de volver se quedan siempre a la vista al hacer scroll
  const pin = () => content.querySelectorAll('button:not([data-pin])').forEach(b => {
    b.dataset.pin = '1';
    if (b.closest('.adm-sticky, .sp-actions, .popup-back .popup:not(.wide)')) return;
    const txt = b.textContent.trim();
    if (/^←/.test(txt)) b.classList.add('adm-back');
    else if (/^💾|^Guardar/.test(txt)) (b.parentElement.matches('.row') ? b.parentElement : b).classList.add('adm-save');
  });
  new MutationObserver(pin).observe(content, { childList: true, subtree: true });
  popup(box, { cls: 'wide', buttons: [{ label: t('close'), value: true }] }).then(async r => {
    if (r === 'logout') return;
    S.answers = await store.getAnswers(S.user.uid).catch(() => S.answers);
    S.settings = (await store.getSettings(S.user.uid).catch(() => null)) || S.settings;
    renderHome();
  });
  go('answers');
}

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
  async answers(root) {
    const { all } = await loadAll();
    const onlyPending = el('input', { type: 'checkbox', checked: true });
    const list = el('div');
    const draw = () => {
      const rows = [];
      all.forEach(({ u, a }) => Object.entries(a).forEach(([day, r]) => rows.push({ u, day: +day, r })));
      rows.sort((x, y) => (y.r.at || 0) - (x.r.at || 0));
      const shown = rows.filter(x => !onlyPending.checked || x.r.status === 'pending');
      list.replaceChildren(shown.length ? el('table', {},
        el('tr', {}, el('th', {}, 'Persona'), el('th', {}, 'Día'), el('th', {}, 'Respuesta'), el('th', {}, 'Estado')),
        ...shown.map(x => el('tr', {},
          el('td', {}, x.u.name || '', el('br'), el('small', {}, x.u.email)),
          el('td', {}, String(x.day)),
          el('td', {}, String(x.r.answer ?? ''), x.r.extra?.missing ? el('div', { class: 'ans' }, 'Faltaba: ' + x.r.extra.missing) : null),
          el('td', {}, statusButtons(x.u.uid, x.day, x.r, () => draw()))))) : el('p', {}, '🎉 No hay respuestas pendientes.'));
    };
    onlyPending.onchange = draw; draw();
    root.replaceChildren(el('label', { class: 'inline' }, onlyPending, ' Ver solo las pendientes de revisar'), list);
  },

  // ---------------------------------------------------------------- Usuarios
  async users(root) {
    const { all } = await loadAll();
    const settings = await Promise.all(all.map(x => store.getSettings(x.u.uid).catch(() => null)));
    root.replaceChildren(el('p', { class: 'muted' }, 'Pulsa «Configurar» para elegir su figura, si ve su progreso, corregir sus días y personalizar sus actividades.'),
      el('div', { class: 'u-cards' }, ...all.map(({ u, a }, i) => {
        const open = () => userPanel(root, u, a, settings[i] || {});
        return el('div', { class: 'u-card', onclick: e => { if (!e.target.closest('button')) open(); } },
          el('img', { class: 'u-fig', src: FIG_IMG[settings[i]?.figure || 'galleta'], alt: '' }),
          el('div', { class: 'u-info' }, el('b', {}, u.name || '—'), el('small', {}, u.email),
            el('span', { class: 'u-score' }, '⭐ ' + Object.values(a).filter(r => r.status === 'correct').length + ' aciertos')),
          el('button', { class: 'btn small-btn u-btn', onclick: open }, '⚙️ Configurar'));
      })));
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
          const pane = el('div', { class: 'pz-pane', style: i ? 'display:none' : '' }, ...Object.entries(F[fg]).map(([k, ta]) => el('label', {}, LBL[k], ta)));
          const tb = el('button', { type: 'button', class: 'pz-tab no-delay' + (i ? '' : ' on'), onclick: () => {
            [...tabs.children].forEach(b => b.classList.remove('on')); tb.classList.add('on');
            [...panes.children].forEach(p => p.style.display = 'none'); pane.style.display = '';
          } }, el('img', { src: FIG_IMG[fg], alt: '' }), name);
          tabs.append(tb); panes.append(pane);
        });
        return el('div', { class: 'card' }, el('h3', {}, '🏆 Premios'),
          el('p', { class: 'muted' }, 'Cada figura tiene sus propios premios. Elige la figura y escribe lo que se gana en cada casilla. Lo que veas aquí es lo que verá cada persona según su figura.'),
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
            try { await store.adminChangePw(S.user.uid, n1.value); [cur, n1, n2].forEach(x => x.value = ''); toast('🔐 Contraseña cambiada'); } catch (e) { toast('Error: ' + e.message, 5000); }
          } }, 'Cambiar'),
          el('p', { class: 'muted', style: 'margin-top:8px' }, `Si la olvidas: entra con la cuenta ${OWNER_EMAIL}, pulsa 🔒 y luego «¿Has olvidado la contraseña de configuración?».`));
      })(),
      el('div', { class: 'card' }, el('h3', {}, '🚪 Cerrar sesión'),
        el('p', { class: 'muted' }, 'Sales de tu cuenta en este móvil u ordenador. Para volver a entrar necesitarás tu correo y tu contraseña.'),
        el('button', { class: 'btn btn-ghost small-btn', onclick: async () => {
          const ok = await popup(`<h2>🚪 Cerrar sesión</h2><p>¿Seguro que quieres salir de tu cuenta?<br><small>Para volver a entrar necesitarás tu correo y tu contraseña.</small></p>`,
            { cls: 'small', buttons: [{ label: 'Cancelar', value: false, cls: 'btn-ghost' }, { label: 'Sí, cerrar sesión', value: true }] });
          if (!ok) return; // se queda en Configuración
          S.isAdmin = false; setTestMode(false);
          root.closest('.popup-back')?.remove();
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
  // actividades: son las mismas que en «Contenido de los días» (un solo sitio donde se guardan)
  const daySel = el('select', {}, ...Array.from({ length: 25 }, (_, i) => el('option', { value: i + 1 }, `Día ${i + 1}`)));
  const langSel = el('select', {}, el('option', { value: 'es' }, 'Español'), el('option', { value: 'ca' }, 'Català'), el('option', { value: 'en' }, 'English'));
  const actsBox = el('div');
  const drawActs = async () => {
    const n = +daySel.value, L = langSel.value;
    const d = await loadDay(n) || defaultDay(n);
    actsBox.replaceChildren(actCard(n, L, d, 'act1', '🎄 Actividad 1 (personas con árbol)'), actCard(n, L, d, 'act2', '🧙 Actividad 2 (personas con gnomo)'));
  };
  daySel.onchange = drawActs; langSel.onchange = drawActs; drawActs();
  const mq = el('input', { type: 'text', value: set.marqueeText || '', placeholder: 'Vacío = el mensaje general de la marquesina' });
  const saveUser = async () => {
    try { await store.setSettings(u.uid, { figure: fig.value, showProgress: show.checked, marqueeText: mq.value.trim(), actOverrides: {} }); toast('💾 Guardado'); }
    catch (e) { toast('Error: ' + e.message, 5000); }
  };
  root.replaceChildren(
    el('div', { class: 'adm-sticky' },
      el('button', { class: 'btn btn-ghost small-btn', onclick: () => VIEWS.users(root) }, '← Volver'),
      el('button', { class: 'btn small-btn', onclick: saveUser }, '💾 Guardar configuración')),
    el('h3', {}, `${esc(u.name || '')} · ${u.email}`),
    el('div', { class: 'card' },
      el('label', {}, 'Figura y tipo de calendario', fig),
      el('label', { class: 'inline' }, show, ' Ver arriba la franja con sus figuras y su progreso')),
    el('div', { class: 'card' }, el('h3', {}, 'Días (✓ con color · ✗ blanco y negro · ⏳ pendiente)'), grid,
      el('button', { class: 'btn small-btn', style: 'margin-top:10px;background:linear-gradient(#e86a3a,#a83b12)', onclick: async () => {
        const days = Object.keys(answers).map(Number); if (!days.length) return toast('No tiene ningún día hecho');
        if (!(await popup(`<h2>↺ Reiniciar todo</h2><p>Se borrarán los <b>${days.length}</b> días hechos de <b>${esc(u.name || u.email)}</b> y todas sus casillas quedarán como nuevas, sin abrir. ¿Seguro?</p>`, { buttons: [{ label: t('cancel'), value: false, cls: 'btn-ghost' }, { label: 'Sí, reiniciar todo', value: true }] }))) return;
        await resetDays(u, days); Object.keys(answers).forEach(k => delete answers[k]); userPanel(root, u, answers, set);
      } }, '↺ Reiniciar todas sus casillas')),
    el('div', { class: 'card' }, el('h3', {}, '📣 Mensaje de su marquesina'),
      el('p', { class: 'muted' }, 'Lo que verá esta persona pasando por la pantalla de inicio. Si lo dejas vacío, verá el mensaje general.'), mq),

    el('div', { class: 'card' }, el('h3', {}, '✏️ Actividades del día'),
      el('p', { class: 'muted' }, 'Son las mismas actividades que en «Contenido de los días»: si cambias algo aquí, cambia allí también, y al revés.'),
      el('div', { class: 'row' }, el('label', {}, 'Día', daySel), el('label', {}, 'Idioma', langSel)), actsBox));
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
    clearCache();
    if (u.uid === S.user.uid) {
      days.forEach(d => delete S.answers[d]);
      try { localStorage.removeItem('adv_prizes_' + u.uid); } catch {}
    }
    toast(days.length === 1 ? `↺ Día ${days[0]} reiniciado` : `↺ ${days.length} días reiniciados`);
  } catch (e) { toast('Error: ' + (e.code || e.message), 6000); }
}

// tarjeta de actividad (la misma en «Contenido de los días» y en cada usuario): al guardar se guarda al momento
function actCard(n, L, d, key, label) {
  const langName = { es: 'español', ca: 'catalán', en: 'inglés' }[L];
  const prev = el('div', { class: 'act-prev' }, plain(d[key]?.[L] ?? '') || '—');
  return el('div', { class: 'act-card', onclick: async () => {
    const cur = (await loadDay(n)) || defaultDay(n);
    const r = await openActEditor({ day: n, actKey: key, title: label, html: cur[key]?.[L] ?? '', langName });
    if (r == null) return;
    try {
      const nd = JSON.parse(JSON.stringify(cur)); delete nd.openAt;
      nd[key] = { ...(nd[key] || {}), [L]: r };
      await store.saveDay(n, nd, S.config.year);
      d[key] = nd[key]; prev.textContent = plain(r) || '—';
      toast('✅ Texto guardado');
    } catch (e) { toast('Error al guardar: ' + (e.code || e.message), 6000); }
  } }, el('b', {}, label), prev, el('span', { class: 'act-edit' }, '✏️ Editar (texto, títulos, emojis, fotos y vídeos)'));
}
