import { initStore, store, DEMO } from './store.js?v=7';
import { t, tx, setLang, getLang } from './i18n.js?v=7';
import { defaultDay, DEFAULT_CONFIG, PAPERS, PORTADAS, DEFAULT_PORTADA, MARQUEE_DEFAULT } from './defaults.js?v=7';
import { creak, speak, unlockAudio, crumple as crumpleSound, chime, doorSound, hohoho } from './sound.js?v=7';
import { $, el, sleep, esc, confetti, typewriter, popup, toast } from './fx.js?v=7';

export const APP_VERSION = 'V7';
export const S = {
  user: null, profile: null, settings: null, answers: {}, config: null, card: null,
  isAdmin: false,
};
const FIG_IMG = { galleta: 'galleta.png', arbol: 'arbol.png', gnomo: 'gnomo.png' };
const app = $('#app');

// ------------------------------------------------------------------ utilidades
export function madridToday() {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const g = k => +p.find(x => x.type === k).value;
  return { y: g('year'), m: g('month'), d: g('day') };
}
export const testMode = () => S.isAdmin && sessionStorage.getItem('adv_test') === '1';
function canOpen(n) {
  if (testMode()) return true;
  const { y, m, d } = madridToday(); const Y = S.config.year;
  return y > Y || (y === Y && m === 12 && d >= n);
}
export const figure = () => S.settings?.figure || 'galleta';
const correctCount = () => Object.values(S.answers).filter(a => a.status === 'correct').length;
export async function loadDay(n) {
  const c = await store.getDay(n).catch(() => null);
  if (c && c.locked) return null;
  return { ...defaultDay(n), ...(c || {}) };
}
export function applyPaper(node) {
  PAPERS.forEach(p => node.classList.remove('paper-' + p.id));
  node.classList.add('paper', 'paper-' + (S.profile?.paper || 'nordico'));
}

// ------------------------------------------------------------------ arranque
async function boot() {
  setLang(localStorage.getItem('adv_lang') || 'es');
  try { await initStore(); } catch (e) {
    app.innerHTML = `<div class="fatal">No se ha podido conectar con Firebase. Revisa js/firebase-config.js.<br><small>${esc(e.message)}</small></div>`; return;
  }
  store.onAuth(async u => {
    S.user = u;
    if (!u) { S.isAdmin = false; return renderLogin(); }
    app.innerHTML = '<div class="loading">❄</div>';
    const [profile, settings, answers, config, card] = await Promise.all([
      store.getProfile(u.uid), store.getSettings(u.uid).catch(() => null), store.getAnswers(u.uid).catch(() => ({})),
      store.getConfig().catch(() => null), store.getCard(u.uid).catch(() => null),
    ]);
    S.profile = profile || { email: u.email, name: u.email.split('@')[0], lang: getLang(), paper: 'nordico', portada: DEFAULT_PORTADA };
    if (!profile) await store.saveProfile(u.uid, S.profile).catch(() => {});
    S.settings = settings || { figure: 'galleta', showProgress: true };
    S.answers = answers || {};
    S.config = { ...DEFAULT_CONFIG, ...(config || {}), prizes: { ...DEFAULT_CONFIG.prizes, ...(config?.prizes || {}) } };
    S.card = card;
    setLang(S.profile.lang || 'es');
    renderHome();
  });
}

// ------------------------------------------------------------------ login
function renderLogin(mode = 'login') {
  document.title = t('appTitle');
  const errBox = el('div', { class: 'form-err' });
  const name = el('input', { type: 'text', placeholder: t('name'), autocomplete: 'name' });
  const email = el('input', { type: 'email', placeholder: t('email'), autocomplete: 'email' });
  const pw = el('input', { type: 'password', placeholder: t('password'), autocomplete: mode === 'login' ? 'current-password' : 'new-password' });
  const langSel = el('select', { class: 'lang-sel', onchange: e => { setLang(e.target.value); localStorage.setItem('adv_lang', e.target.value); renderLogin(mode); } },
    ...[['es', 'Español'], ['ca', 'Català'], ['en', 'English']].map(([v, l]) => el('option', { value: v, selected: v === getLang() }, l)));
  const submit = async e => {
    e.preventDefault(); errBox.textContent = ''; unlockAudio();
    try {
      if (mode === 'login') await store.signIn(email.value.trim(), pw.value);
      else {
        if (!name.value.trim()) { name.focus(); return; }
        await store.signUp(email.value.trim(), pw.value, name.value.trim(), getLang());
      }
    } catch (er) {
      const c = er.code || '';
      errBox.textContent = c.includes('email-already') ? t('emailUsed') : c.includes('weak-password') ? t('weakPw') : t('loginError');
      if (DEMO && mode === 'login' && email.value.trim()) errBox.append(el('br'), el('a', { href: '#', onclick: ev => { ev.preventDefault(); demoReset(email.value.trim()); } }, '🔑 ' + t('forgot')));
    }
  };
  const form = el('form', { class: 'login-card paper paper-pergamino', onsubmit: submit },
    el('img', { src: FIG_IMG.galleta, class: 'login-fig', alt: '' }),
    el('h1', { class: 'login-title' }, t('appTitle')),
    mode === 'register' ? name : null, email, pw, errBox,
    el('button', { class: 'btn btn-big', type: 'submit' }, mode === 'login' ? t('login') : t('register')),
    el('a', { href: '#', onclick: e => { e.preventDefault(); renderLogin(mode === 'login' ? 'register' : 'login'); } }, mode === 'login' ? t('noAccount') : t('haveAccount')),
    mode === 'login' ? el('a', { href: '#', class: 'small', onclick: async e => {
      e.preventDefault(); if (!email.value) { email.focus(); toast(t('emailFirst')); return; }
      if (DEMO) return demoReset(email.value.trim());
      try { await store.resetPassword(email.value.trim()); toast(t('resetSent'), 6000); }
      catch (er) { toast(String(er.code || '').includes('user-not-found') ? t('noUser') : t('loginError') + ' (' + (er.code || er.message) + ')', 6000); }
    } }, t('forgot')) : null,
    langSel,
    DEMO ? el('p', { class: 'demo-note' }, t('demo')) : null,
    DEMO ? el('a', { href: '#', class: 'small', onclick: async e => {
      e.preventDefault();
      if (await popup(`<h2>🧹</h2><p>${t('wipeAsk')}</p>`, { buttons: [{ label: t('cancel'), value: false, cls: 'btn-ghost' }, { label: t('wipeYes'), value: true }] })) { store.demoWipe(); sessionStorage.clear(); location.reload(); }
    } }, '🧹 ' + t('wipe')) : null,
    el('p', { class: 'demo-note' }, APP_VERSION),
  );
  app.replaceChildren(el('div', { class: 'login-wrap' }, form));
}

// ------------------------------------------------------------------ portada
let fullView = false, boardObserver = null;
function currentTheme() {
  return PORTADAS.find(p => p.id === S.profile.portada) || PORTADAS.find(p => p.id === DEFAULT_PORTADA) || PORTADAS[0];
}
function showPrizes() {
  const n = correctCount();
  const goals = [10, 15, 20, 25];
  const nextG = goals.find(g => g > n);
  popup(`<h2>🏆 ${t('prizes')}</h2><p>${t('correctCount', n)} · ${nextG ? t('nextPrize', nextG - n) : t('allPrizes')}</p>` +
    goals.map((g, i) => `<p class="prize-row ${n >= g ? 'won' : ''}">${n >= g ? '🏆' : '🎁'} <b>${g}</b> · ${n >= g ? esc(S.config.prizes['p' + g]) : '?'}</p>`).join(''));
}
export function renderHome() {
  document.title = t('appTitle');
  const theme = currentTheme();
  const fig = figure();
  const n = correctCount();

  const header = el('header', { class: 'top' },
    el('div', { class: 'title-frame' },
      el('div', { class: 'title-inner' },
        el('div', { class: 'title-block' }, el('h1', { class: 'title-text' }, t('appTitle')), el('div', { class: 'greeting' }, greeting())),
        el('div', { class: 'top-actions' },
          el('button', { class: 'icon-btn', title: t('settings'), onclick: openUserSettings }, '⚙️'),
          el('button', { class: 'icon-btn', title: t('admin'), onclick: async () => (await import('./admin.js?v=7')).openAdmin() }, '🔒'),
          el('button', { class: 'icon-btn', title: t('logout'), onclick: () => store.signOut() }, '🚪')))));

  let strip = null;
  if (S.settings.showProgress !== false) {
    const row = el('div', { class: 'strip-row' },
      el('button', { class: 'strip-score', title: t('prizes'), onclick: showPrizes }, el('b', {}, n), el('small', {}, '/25'), el('span', {}, '🏆')));
    for (let d = 1; d <= 25; d++) {
      const a = S.answers[d];
      const st = a?.status === 'correct' ? 'on' : a?.status === 'pending' ? 'pend' : a ? 'off' : 'none';
      row.append(el('div', { class: 'strip-fig ' + st + (d === 25 ? ' big' : ''), title: t('dayN', d) },
        el('img', { src: FIG_IMG[fig], alt: '' }), el('span', {}, d)));
    }
    strip = el('section', { class: 'strip' }, row);
  }

  const board = el('section', { class: 'board', onclick: e => { if (e.target === board && !fullView) { fullView = true; renderHome(); } } });
  const mq = { ...MARQUEE_DEFAULT, ...(S.config.marquee || {}) };
  const marquee = mq.show === false ? null : el('div', { class: 'marquee', onclick: () => { fullView = true; renderHome(); } },
    el('div', { class: 'marquee-track', style: `animation-duration:${Math.max(4, +mq.speed || 14)}s;color:${mq.color};font-weight:${mq.weight};${/neon/.test(mq.colorName || '') ? `text-shadow:0 0 6px ${mq.color},0 0 14px ${mq.color};` : ''}` },
      ...Array.from({ length: 8 }, () => el('span', {}, (tx(mq.text) || t('tapToZoom')) + '\u2003✦\u2003'))));
  const bars = [];
  if (DEMO) bars.push(el('div', { class: 'demo-bar' }, t('demo')));
  if (testMode()) bars.push(el('div', { class: 'demo-bar test' }, '🧪 Modo prueba: todas las casillas abiertas'));
  const exitBtn = fullView ? el('button', { class: 'exit-full', onclick: () => { fullView = false; renderHome(); } }, '✕ ' + t('exitFull')) : null;
  document.body.classList.toggle('full-view', fullView);
  app.replaceChildren(header, ...bars, ...(strip ? [strip] : []), ...(marquee ? [marquee] : []), board, el('div', { class: 'app-version' }, APP_VERSION), ...(exitBtn ? [exitBtn] : []));

  fitTitle(); document.fonts?.ready?.then(fitTitle);
  boardObserver?.disconnect();
  boardObserver = new ResizeObserver(() => layoutBoard(board, theme));
  boardObserver.observe(board);
  layoutBoard(board, theme);

  // Cartel de Navidad (después del día 25), una vez por sesión
  if (S.card && !sessionStorage.getItem('adv_banner')) {
    sessionStorage.setItem('adv_banner', '1');
    const b = el('div', { class: 'xmas-banner', onclick: () => b.remove() },
      el('div', { class: 'xmas-bg', style: `background-image:url(${S.card})` }),
      el('div', { class: 'xmas-text' }, t('newYear')), el('button', { class: 'xmas-close' }, '✕'));
    document.body.append(b);
  }
}

// elige la versión de la imagen (móvil, cuadrada o ancha) que mejor llena el espacio
function layoutBoard(board, theme) {
  const W = board.clientWidth, H = board.clientHeight;
  if (!W || !H) return;
  const ar = W / H;
  const diff = v => Math.abs(Math.log(v.w / v.h) - Math.log(ar));
  const v = theme.variants.reduce((best, x) => (diff(x) < diff(best) ? x : best));
  if (board._v !== v) { board._v = v; board.replaceChildren(buildImage(theme, v)); board.style.background = '#ffffff'; }
  const wrap = board.firstChild;
  let w, h;
  if (ar > v.w / v.h) { h = H; w = H * v.w / v.h; } else { w = W; h = W * v.h / v.w; }
  wrap.style.width = Math.floor(w) + 'px'; wrap.style.height = Math.floor(h) + 'px';
}

function buildImage(theme, v) {
  const rad = theme.radius || '10%';
  const wrap = el('div', { class: 'board-img' + (theme.light === 'claro' ? ' light-theme' : ''), onclick: () => { if (!fullView) { fullView = true; renderHome(); } } },
    el('img', { src: v.img, alt: t('appTitle'), draggable: 'false' }));
  if (!fullView) wrap.append(el('div', { class: 'zoom-hint' }, '⤢ ' + t('tapToZoom')));
  for (let d = 1; d <= 25; d++) {
    const [cx, cy, w, h] = v.spots[d];
    const L = cx - w / 2, T = cy - h / 2;
    const done = !!S.answers[d];
    const st = done ? S.answers[d].status : '';
    // la puertecita es un trozo de la propia imagen: se ilumina por dentro y luego se abre
    const panel = el('span', { class: 'door-panel', style: `border-radius:${rad};background-image:url(${v.img});background-size:${v.w / w * 100}% ${v.h / h * 100}%;background-position:${L / (v.w - w) * 100}% ${T / (v.h - h) * 100}%` });
    const door = el('button', {
      class: 'door' + (done ? ' opened' : '') + (canOpen(d) ? '' : ' closed-day') + (d === 25 ? ' d25' : ''), 'aria-label': t('dayN', d),
      style: `left:${L / v.w * 100}%;top:${T / v.h * 100}%;width:${w / v.w * 100}%;height:${h / v.h * 100}%`,
      onclick: e => { e.stopPropagation(); openDoor(d, door); },
    }, el('span', { class: 'door-glow', style: `border-radius:${rad}` }, el('b', {}, d), done ? (st === 'correct' ? '★' : st === 'pending' ? '⏳' : '❄') : ''),
       panel, el('span', { class: 'door-light' }), el('span', { class: 'door-rays' }));
    wrap.append(door);
  }
  return wrap;
}

// ------------------------------------------------------------------ abrir puerta
let busy = false;
async function openDoor(n, door) {
  if (busy) return;
  unlockAudio();
  if (!canOpen(n)) { door.classList.add('shake'); setTimeout(() => door.classList.remove('shake'), 600); toast(t('locked', n)); return; }
  busy = true;
  const content = await loadDay(n);
  if (!content) { busy = false; toast(t('locked', n)); return; }
  // la luz se enciende dentro de la ventana y después se abre
  door.classList.add('lighting');
  if (n === 25) hohoho(); else doorSound(n);
  await sleep(800);
  door.classList.add('opening');
  await sleep(950);

  const r = door.getBoundingClientRect();
  const layer = el('div', { class: 'note-layer' });
  const note = el('div', { class: 'note' });
  applyPaper(note);
  const body = el('div', { class: 'note-body' });
  const finishBtn = el('button', { class: 'btn btn-finish' }, t('finish'));
  note.append(el('div', { class: 'note-head' }, el('span', { class: 'note-day' }, t('dayN', n))), body, el('div', { class: 'note-foot' }, finishBtn));
  layer.append(note);
  document.body.append(layer);
  // la nota viene "de lejos": desde la puerta hasta ocupar la pantalla
  const nr = note.getBoundingClientRect();
  const dx = r.left + r.width / 2 - (nr.left + nr.width / 2), dy = r.top + r.height / 2 - (nr.top + nr.height / 2);
  note.animate([
    { transform: `translate(${dx}px,${dy}px) scale(.03) rotate(-8deg)`, opacity: 0 },
    { opacity: 1, offset: .25 },
    { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
  ], { duration: 1500, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' });
  setTimeout(() => speak(t('welcome', n), getLang()), n === 25 ? 2600 : 0);

  let closed = false;
  const ctx = {
    day: n, content, lang: getLang(), prev: S.answers[n] || null, note, body, finishBtn,
    profile: S.profile, settings: S.settings, user: S.user, config: S.config,
    submit: async data => {
      if (S.answers[n]) return;
      const rec = { answer: data.answer ?? '', status: data.status || 'pending', extra: data.extra ?? null };
      S.answers[n] = { ...rec, at: Date.now() };
      try { await store.submitAnswer(S.user.uid, n, rec); } catch (e) { console.error(e); toast('⚠️ ' + e.message); }
      if (rec.status === 'correct') checkPrize();
    },
    finish: () => { if (!closed) { closed = true; closeDay(n, layer, note, door); } },
  };
  finishBtn.onclick = ctx.finish;
  try {
    if (ctx.prev && !['diploma', 'dance', 'santa', 'roulette'].includes(content.type)) renderSummary(body, ctx);
    else (await import(`./${content.type}.js?v=7`)).render(body, ctx);
  } catch (e) { console.error(e); body.append(el('p', {}, '⚠️ ' + e.message)); }
  busy = false;
}

function renderSummary(body, ctx) {
  const a = ctx.prev; const c = ctx.content;
  const st = a.status === 'correct' ? t('correct') : a.status === 'pending' ? t('pending') : t('incorrect');
  let ans = a.answer;
  if (c.type === 'quiz' && typeof a.answer === 'number') ans = (tx(c.options) || [])[a.answer];
  body.append(el('div', { class: 'summary' },
    el('p', { class: 'muted' }, t('alreadyDone')),
    c.type === 'quiz' ? el('h2', { class: 'q-title' }, tx(c.q)) : null,
    ans !== '' && ans != null ? el('p', {}, el('b', {}, t('yourAnswer') + ': '), String(ans)) : null,
    el('p', { class: 'status-big ' + a.status }, st),
    el('img', { class: 'summary-fig ' + (a.status === 'correct' ? '' : 'bw'), src: FIG_IMG[figure()], alt: '' })));
}

function checkPrize() {
  const n = correctCount();
  const g = [10, 15, 20, 25].find(x => x === n);
  if (g) setTimeout(() => { confetti(250); chime(); popup(`<h2>🏆 ${t('prize')}!</h2><p class="prize-text">${esc(S.config.prizes['p' + g])}</p>`); }, 1800);
}

// ------------------------------------------------------------------ cerrar el día
async function closeDay(n, layer, note, door) {
  const fig = figure();
  const done = !!S.answers[n];
  speechSynthesis?.cancel?.();
  if (fig !== 'galleta' && done) {
    crumpleSound();
    await crumpleAnim(note, true);
    note.remove();
    await showActivity(n, layer);
  }
  creak(false);
  layer.classList.add('fade-out');
  await sleep(700);
  layer.remove();
  renderHome();
}

// Arrugar con filtro SVG de desplazamiento
export async function crumpleAnim(node, out = true) {
  const disp = document.querySelector('#crumpleFilter feDisplacementMap');
  node.style.filter = 'url(#crumpleFilter)';
  const dur = 1100; const t0 = performance.now();
  return new Promise(res => {
    (function f(now) {
      const k = Math.min(1, (now - t0) / dur); const p = out ? k : 1 - k;
      disp.setAttribute('scale', String(p * 90));
      node.style.transform = `scale(${1 - p * .82}) rotate(${p * 25}deg) translateY(${p * 30}px)`;
      node.style.opacity = out ? String(1 - Math.max(0, k - .7) / .3) : String(Math.min(1, k * 3));
      if (k < 1) requestAnimationFrame(f); else { if (!out) { node.style.filter = ''; node.style.transform = ''; } res(); }
    })(t0);
  });
}

async function showActivity(n, layer) {
  const fig = figure();
  const content = await loadDay(n) || defaultDay(n);
  const key = fig === 'arbol' ? 'act1' : 'act2';
  const over = S.settings?.actOverrides?.[n]?.[key];
  const text = (over && over.trim()) || tx(content[key]);
  const note = el('div', { class: 'note activity-note' });
  applyPaper(note);
  const textBox = el('p', { class: 'activity-text' });
  const btn = el('button', { class: 'btn btn-finish', disabled: true }, t('finish'));
  note.append(
    el('div', { class: 'note-head' }, el('span', { class: 'note-day' }, `${t(fig === 'arbol' ? 'activity1' : 'activity2')} · ${t('dayN', n)}`)),
    el('div', { class: 'note-body activity-body' },
      el('img', { class: 'activity-fig', src: FIG_IMG[fig], alt: '' }),
      textBox,
      el('p', { class: 'activity-warn' }, t('warnColor', t('figName')[fig]))),
    el('div', { class: 'note-foot' }, btn));
  layer.append(note);
  crumpleSound();
  await crumpleAnim(note, false);
  await typewriter(textBox, text, 26);
  btn.disabled = false;
  await new Promise(r => btn.onclick = r);
  note.classList.add('fly-away');
  await sleep(500);
}

// ------------------------------------------------------------------ opciones del usuario
function openUserSettings() {
  const name = el('input', { type: 'text', value: S.profile.name || '' });
  const lang = el('select', {}, ...[['es', 'Español'], ['ca', 'Català'], ['en', 'English']].map(([v, l]) => el('option', { value: v, selected: v === getLang() }, l)));
  const paper = el('select', {}, ...PAPERS.map(p => el('option', { value: p.id, selected: p.id === (S.profile.paper || 'nordico') }, p.name)));
  const port = el('select', {}, ...PORTADAS.map(p => el('option', { value: p.id, selected: p.id === currentTheme().id }, p.name)));
  const preview = el('div', { class: 'paper-preview' }, el('p', {}, '¡Ho, ho, ho! Así se verán tus notas.'));
  const upd = () => { PAPERS.forEach(p => preview.classList.remove('paper-' + p.id)); preview.classList.add('paper', 'paper-' + paper.value); };
  paper.onchange = upd; upd();
  const box = el('div', { class: 'settings-form' },
    el('h2', {}, t('settings')),
    el('label', {}, t('name'), name), el('label', {}, t('language'), lang),
    el('label', {}, t('paper'), paper), preview, el('label', { class: 'after-preview' }, t('portada'), port),
    accountSection());
  popup(box, { buttons: [{ label: t('cancel'), value: false, cls: 'btn-ghost' }, { label: t('save'), value: true }] }).then(async ok => {
    if (!ok) return;
    Object.assign(S.profile, { name: name.value.trim() || S.profile.name, lang: lang.value, paper: paper.value, portada: port.value });
    setLang(lang.value); localStorage.setItem('adv_lang', lang.value);
    await store.saveProfile(S.user.uid, { name: S.profile.name, lang: S.profile.lang, paper: S.profile.paper, portada: S.profile.portada });
    renderHome();
  });
}

// el título se hace tan grande como quepa en su línea
function fitTitle() {
  const h = document.querySelector('.title-block .title-text'); if (!h) return;
  h.style.fontSize = ''; let fs = parseFloat(getComputedStyle(h).fontSize);
  while (h.scrollWidth > h.clientWidth + 1 && fs > 14) { fs -= 1; h.style.fontSize = fs + 'px'; }
}
addEventListener('resize', fitTitle);

function greeting() {
  const h = +new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', hour: 'numeric', hour12: false }).format(new Date());
  const k = h < 6 ? 'helloNight' : h < 14 ? 'helloMorning' : h < 21 ? 'helloAfternoon' : 'helloNight';
  return t(k, (S.profile?.name || '').split(' ')[0]);
}

// campo de contraseña con ojo para verla
function pwField(ph) {
  const i = el('input', { type: 'password', placeholder: ph, autocomplete: 'new-password' });
  const eye = el('button', { type: 'button', class: 'eye-btn', title: t('showPw'), onclick: () => { i.type = i.type === 'password' ? 'text' : 'password'; eye.textContent = i.type === 'password' ? '👁️' : '🙈'; } }, '👁️');
  return { input: i, wrap: el('div', { class: 'pw-wrap' }, i, eye) };
}

function accountSection() {
  const cur = pwField(t('currentPw')), n1 = pwField(t('newPw')), n2 = pwField(t('repeatPw'));
  const form = el('div', { class: 'pw-change', style: 'display:none' }, cur.wrap, n1.wrap, n2.wrap,
    el('button', { type: 'button', class: 'btn small-btn', onclick: async () => {
      if (n1.input.value.length < 6) return toast(t('weakPw'));
      if (n1.input.value !== n2.input.value) return toast(t('pwMismatch'));
      try { await store.changePassword(cur.input.value, n1.input.value); toast('🔐 ' + t('pwChanged')); form.style.display = 'none'; [cur, n1, n2].forEach(f => f.input.value = ''); }
      catch (er) { const c = String(er.code || ''); toast(c.includes('wrong-password') || c.includes('invalid-credential') ? t('wrongCurrent') : c.includes('weak') ? t('weakPw') : '⚠️ ' + (er.code || er.message), 5000); }
    } }, '💾 ' + t('savePw')));
  return el('div', { class: 'account-box' },
    el('div', { class: 'acc-row' }, el('span', {}, '👤 ' + t('user')), el('b', {}, S.user.email)),
    el('div', { class: 'acc-row' }, el('span', {}, '🔑 ' + t('password')), el('b', { class: 'dots', title: t('pwHidden'), onclick: () => toast(t('pwHidden'), 6000) }, '•••••••• 👁️'),
      el('button', { type: 'button', class: 'btn btn-ghost small-btn', onclick: () => { form.style.display = form.style.display === 'none' ? '' : 'none'; } }, t('changePw'))),
    form);
}

// modo demo: no se pueden mandar correos, así que se pone una contraseña nueva aquí mismo
async function demoReset(email) {
  const n1 = pwField(t('newPw')), n2 = pwField(t('repeatPw'));
  const ok = await popup(el('div', { class: 'settings-form' }, el('h2', {}, '🔑 ' + t('forgot')), el('p', {}, t('demoResetInfo')), el('p', {}, el('b', {}, email)), n1.wrap, n2.wrap),
    { buttons: [{ label: t('cancel'), value: false, cls: 'btn-ghost' }, { label: t('savePw'), value: true }] });
  if (!ok) return;
  if (n1.input.value !== n2.input.value) return toast(t('pwMismatch'));
  try {
    await store.demoSetPassword(email, n1.input.value);
    await store.signIn(email, n1.input.value); // entra directamente
    toast('🔐 ' + t('pwChanged'));
  } catch (er) { toast(String(er.code).includes('weak') ? t('weakPw') : '⚠️ ' + (er.code || er.message), 6000); }
}

// sin zoom con doble toque ni pellizco en ninguna pantalla (salvo la foto del día 25, que lo gestiona ella misma)
['gesturestart', 'gesturechange'].forEach(ev => document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
let lastTouch = 0;
document.addEventListener('touchend', e => {
  const now = Date.now();
  if (now - lastTouch < 350 && !e.target.closest('input, textarea, select')) e.preventDefault();
  lastTouch = now;
}, { passive: false });
document.addEventListener('touchmove', e => { if (e.touches.length > 1 && !e.target.closest('.santa-stage')) e.preventDefault(); }, { passive: false });

boot();
