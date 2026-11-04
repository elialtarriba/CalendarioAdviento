// Configuración de la administradora (protegida con contraseña)
import { store } from './store.js';
import { t, tx } from './i18n.js';
import { el, popup, toast, esc } from './fx.js';
import { S, renderHome, loadDay } from './app.js';
import { defaultDay } from './defaults.js';

const FIGS = [['galleta', '🍪 Galleta de jengibre (solo la puerta)'], ['arbol', '🎄 Árbol de Navidad (+ actividad 1)'], ['gnomo', '🧙 Gnomo (+ actividad 2)']];
const ST = { correct: '✓', incorrect: '✗', pending: '⏳' };
const TYPE_NAME = { quiz: 'Pregunta con 4 respuestas', reindeer: 'Busca los renos con gafas', differences: 'Las 5 diferencias + susto', tree: 'Decorar el árbol',
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
  const box = el('div', { class: 'settings-form' }, el('h2', {}, '🔒 ' + t('admin')), first ? el('p', {}, t('adminFirst')) : null, pw, first ? pw2 : null);
  setTimeout(() => pw.focus(), 50);
  const ok = await popup(box, { buttons: [{ label: t('cancel'), value: false, cls: 'btn-ghost' }, { label: t('adminEnter'), value: true }] });
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

function showPanel() {
  const content = el('div');
  const tabs = [['answers', '📨 Respuestas'], ['users', '👥 Usuarios'], ['days', '📅 Contenido de los días'], ['general', '🏆 Premios y ajustes']];
  const bar = el('div', { class: 'tabs' });
  const go = id => { [...bar.children].forEach(b => b.classList.toggle('active', b.dataset.id === id)); content.replaceChildren(el('p', {}, 'Cargando…')); VIEWS[id](content); };
  tabs.forEach(([id, label]) => bar.append(el('button', { 'data-id': id, onclick: () => go(id) }, label)));
  const box = el('div', { class: 'admin' }, el('h2', {}, '⚙️ Configuración'), bar, content);
  popup(box, { cls: 'wide', buttons: [{ label: t('close'), value: true }] }).then(async () => {
    S.answers = await store.getAnswers(S.user.uid).catch(() => S.answers);
    S.settings = (await store.getSettings(S.user.uid).catch(() => null)) || S.settings;
    renderHome();
  });
  go('answers');
}

// ------------------------------------------------------------------ Respuestas
async function loadAll() {
  const users = await store.listUsers();
  const all = await Promise.all(users.map(async u => ({ u, a: await store.getAnswers(u.uid).catch(() => ({})) })));
  return { users, all };
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
      el('table', {}, el('tr', {}, el('th', {}, 'Correo'), el('th', {}, 'Nombre'), el('th', {}, 'Figura'), el('th', {}, 'Aciertos'), el('th', {}, '')),
        ...all.map(({ u, a }, i) => el('tr', {},
          el('td', {}, u.email), el('td', {}, u.name || ''),
          el('td', {}, (FIGS.find(f => f[0] === (settings[i]?.figure || 'galleta')) || FIGS[0])[1].split(' (')[0]),
          el('td', {}, String(Object.values(a).filter(r => r.status === 'correct').length)),
          el('td', {}, el('button', { class: 'btn small-btn', onclick: () => userPanel(root, u, a, settings[i] || {}) }, 'Configurar'))))));
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
        f.missions = ta((d.missions || []).map(m => m?.[L] ?? '').join('\n'), 9);
        parts.push(el('label', {}, 'Misiones de la ruleta (una por línea, de 2 a 10)', f.missions));
      }
      if (d.type === 'differences') {
        f.scare = el('input', { type: 'number', min: 1, max: 30, value: d.scareSeconds ?? 5 });
        parts.push(el('label', {}, 'Segundos que dura la imagen del susto', f.scare));
      }
      f.act1 = ta(d.act1?.[L] ?? '', 3); f.act2 = ta(d.act2?.[L] ?? '', 3);
      parts.push(el('label', {}, '🎄 Actividad 1 (personas con árbol)', f.act1), el('label', {}, '🧙 Actividad 2 (personas con gnomo)', f.act2));
      const save = el('button', { class: 'btn', onclick: async () => {
        const nd = JSON.parse(JSON.stringify(d)); delete nd.openAt;
        const setL = (k, v) => { nd[k] = { ...(nd[k] || {}), [L]: v }; };
        if (d.type === 'quiz') {
          setL('q', f.q.value.trim());
          nd.options = { ...(nd.options || {}), [L]: f.opts.map(o => o.value.trim()) };
          nd.correct = f.correct.findIndex(r => r.checked);
        }
        if (d.type === 'roulette') {
          const lines = f.missions.value.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 10);
          nd.missions = lines.map((s, i) => ({ ...(d.missions?.[i] || {}), [L]: s }));
        }
        if (d.type === 'differences') nd.scareSeconds = Math.max(1, +f.scare.value || 5);
        setL('act1', f.act1.value.trim()); setL('act2', f.act2.value.trim());
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
    const test = el('input', { type: 'checkbox', checked: sessionStorage.getItem('adv_test') === '1' });
    test.onchange = () => sessionStorage.setItem('adv_test', test.checked ? '1' : '0');
    const np = el('input', { type: 'password', placeholder: 'Nueva contraseña' });
    root.replaceChildren(
      el('div', { class: 'card' }, el('h3', {}, '🏆 Premios'),
        el('label', {}, 'Con 10 aciertos', fields.p10), el('label', {}, 'Con 15 aciertos', fields.p15),
        el('label', {}, 'Con 20 aciertos', fields.p20), el('label', {}, 'Con las 25 (los 4 premios + extra)', fields.p25),
        el('button', { class: 'btn', onclick: async () => {
          const prizes = Object.fromEntries(Object.entries(fields).map(([k, f]) => [k, f.value.trim()]));
          await store.saveConfig({ prizes }); S.config.prizes = prizes; toast('💾 Premios guardados');
        } }, '💾 Guardar premios')),
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
        el('label', { class: 'inline' }, test, ' Abrir todas las casillas (solo para ti, mientras no cierres la pestaña)')),
      el('div', { class: 'card' }, el('h3', {}, '🔐 Cambiar contraseña de configuración'),
        el('div', { class: 'row' }, np, el('button', { class: 'btn small-btn', onclick: async () => {
          if (np.value.length < 6) return toast('Mínimo 6 caracteres');
          try { await store.adminChangePw(S.user.uid, np.value); np.value = ''; toast('🔐 Contraseña cambiada'); } catch (e) { toast('Error: ' + e.message, 5000); }
        } }, 'Cambiar'))));
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
  const fig = el('select', {}, ...FIGS.map(([v, l]) => el('option', { value: v, selected: v === (set.figure || 'galleta') }, l)));
  const show = el('input', { type: 'checkbox', checked: set.showProgress !== false });
  const grid = el('div', { class: 'day-grid' });
  for (let d = 1; d <= 25; d++) {
    const r = answers[d];
    grid.append(el('div', { class: 'day-cell' }, el('b', {}, `Día ${d}`),
      r?.answer != null && r.answer !== '' ? el('div', { class: 'ans' }, String(r.answer)) : el('div', { class: 'ans muted' }, '—'),
      statusButtons(u.uid, d, r)));
  }
  const ov = { ...(set.actOverrides || {}) };
  const daySel = el('select', {}, ...Array.from({ length: 25 }, (_, i) => el('option', { value: i + 1 }, `Día ${i + 1}`)));
  const a1 = el('textarea', { rows: 2, placeholder: 'Vacío = se usa la actividad general del día' });
  const a2 = el('textarea', { rows: 2, placeholder: 'Vacío = se usa la actividad general del día' });
  const loadOv = () => { const o = ov[daySel.value] || {}; a1.value = o.act1 || ''; a2.value = o.act2 || ''; };
  const keepOv = () => { ov[daySel.value] = { act1: a1.value, act2: a2.value }; };
  let prevDay = daySel.value;
  daySel.onchange = () => { const cur = daySel.value; daySel.value = prevDay; keepOv(); daySel.value = cur; prevDay = cur; loadOv(); };
  loadOv();
  root.replaceChildren(
    el('button', { class: 'btn btn-ghost small-btn', onclick: () => VIEWS.users(root) }, '← Volver'),
    el('h3', {}, `${esc(u.name || '')} · ${u.email}`),
    el('div', { class: 'card' },
      el('label', {}, 'Figura y tipo de calendario', fig),
      el('label', { class: 'inline' }, show, ' Ver arriba la franja con sus figuras y su progreso')),
    el('div', { class: 'card' }, el('h3', {}, 'Días (✓ con color · ✗ blanco y negro · ⏳ pendiente)'), grid),
    el('div', { class: 'card' }, el('h3', {}, 'Actividades personalizadas para esta persona'),
      el('label', {}, 'Día', daySel), el('label', {}, '🎄 Actividad 1 (si tiene árbol)', a1), el('label', {}, '🧙 Actividad 2 (si tiene gnomo)', a2)),
    el('button', { class: 'btn', onclick: async () => {
      keepOv();
      Object.keys(ov).forEach(k => { if (!ov[k].act1?.trim() && !ov[k].act2?.trim()) delete ov[k]; });
      try { await store.setSettings(u.uid, { figure: fig.value, showProgress: show.checked, actOverrides: ov }); toast('💾 Guardado'); }
      catch (e) { toast('Error: ' + e.message, 5000); }
    } }, '💾 Guardar configuración'));
}
