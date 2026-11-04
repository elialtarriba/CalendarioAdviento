import { initStore, store, DEMO } from './store.js';
import { t, tx, setLang, getLang } from './i18n.js';
import { defaultDay, DEFAULT_CONFIG, PAPERS, PORTADAS } from './defaults.js';
import { creak, speak, unlockAudio, crumple as crumpleSound, chime } from './sound.js';
import { $, el, sleep, esc, confetti, typewriter, popup, toast } from './fx.js';

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
  node.classList.add('paper', 'paper-' + (S.profile?.paper || 'pergamino'));
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
    S.profile = profile || { email: u.email, name: u.email.split('@')[0], lang: getLang(), paper: 'pergamino', portada: 'toyshop' };
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
    }
  };
  const form = el('form', { class: 'login-card paper paper-pergamino', onsubmit: submit },
    el('img', { src: FIG_IMG.galleta, class: 'login-fig', alt: '' }),
    el('h1', { class: 'login-title' }, t('appTitle')),
    mode === 'register' ? name : null, email, pw, errBox,
    el('button', { class: 'btn btn-big', type: 'submit' }, mode === 'login' ? t('login') : t('register')),
    el('a', { href: '#', onclick: e => { e.preventDefault(); renderLogin(mode === 'login' ? 'register' : 'login'); } }, mode === 'login' ? t('noAccount') : t('haveAccount')),
    mode === 'login' ? el('a', { href: '#', class: 'small', onclick: async e => {
      e.preventDefault(); if (!email.value) { email.focus(); return; }
      try { await store.resetPassword(email.value.trim()); toast(t('resetSent')); } catch { toast(t('loginError')); }
    } }, t('forgot')) : null,
    langSel,
    DEMO ? el('p', { class: 'demo-note' }, t('demo')) : null,
  );
  app.replaceChildren(el('div', { class: 'login-wrap' }, form));
}

// ------------------------------------------------------------------ portada
export function renderHome() {
  document.title = t('appTitle');
  const portada = PORTADAS.find(p => p.id === S.profile.portada) || PORTADAS[0];
  const fig = figure();
  const n = correctCount();

  const header = el('header', { class: 'topbar' },
    el('div', { class: 'brand' }, '🎄 ', t('appTitle')),
    el('div', { class: 'who' }, S.profile.name || ''),
    el('div', { class: 'top-actions' },
      el('button', { class: 'icon-btn', title: t('settings'), onclick: openUserSettings }, '⚙️'),
      el('button', { class: 'icon-btn', title: t('admin'), onclick: async () => (await import('./admin.js')).openAdmin() }, '🔒'),
      el('button', { class: 'icon-btn', title: t('logout'), onclick: () => store.signOut() }, '🚪'),
    ));

  let strip = null;
  if (S.settings.showProgress !== false) {
    const figs = el('div', { class: 'strip-figs' });
    for (let d = 1; d <= 25; d++) {
      const a = S.answers[d];
      const st = a?.status === 'correct' ? 'on' : a?.status === 'pending' ? 'pend' : a ? 'off' : 'none';
      figs.append(el('div', { class: 'strip-fig ' + st, title: t('dayN', d) },
        el('img', { src: FIG_IMG[fig], alt: '' }), el('span', {}, d)));
    }
    const goals = [10, 15, 20, 25];
    const nextG = goals.find(g => g > n);
    const prizes = el('div', { class: 'prizes' }, ...goals.map((g, i) => el('button', {
      class: 'prize ' + (n >= g ? 'won' : ''), onclick: () => popup(`<h3>${t('prize')} ${i + 1} · ${g}</h3><p>${n >= g ? esc(S.config.prizes['p' + g]) : '🎁 ?'}</p>`),
    }, n >= g ? '🏆' : '🎁', el('small', {}, g))));
    strip = el('section', { class: 'strip' }, figs,
      el('div', { class: 'progress-line' },
        el('span', {}, t('correctCount', n)), el('span', { class: 'sep' }, '·'),
        el('span', {}, nextG ? t('nextPrize', nextG - n) : t('allPrizes')), prizes));
  }

  // Cartel de Navidad (después del día 25)
  let banner = null;
  if (S.card) {
    banner = el('section', { class: 'xmas-banner' },
      el('div', { class: 'xmas-bg', style: `background-image:url(${S.card})` }),
      el('div', { class: 'xmas-text' }, t('newYear')),
      el('button', { class: 'xmas-close', onclick: () => banner.classList.toggle('mini') }, '✕'));
  }

  const board = el('div', { class: 'board' });
  const imgWrap = el('div', { class: 'board-img', style: `aspect-ratio:${portada.w}/${portada.h};width:min(100%, calc((100vh - 150px) * ${(portada.w / portada.h).toFixed(3)}), ${portada.w > portada.h ? 1300 : 900}px)` },
    el('img', { src: portada.img, alt: t('appTitle'), draggable: 'false' }));
  const rad = portada.door?.radius || '8%';
  for (let d = 1; d <= 25; d++) {
    const [cx, cy, w, h] = portada.spots[d];
    const L = cx - w / 2, T = cy - h / 2;
    const done = !!S.answers[d];
    const st = done ? S.answers[d].status : '';
    // la puertecita es un trozo de la propia imagen: al abrirse gira y deja ver la luz de dentro
    const panel = el('span', { class: 'door-panel', style: `border-radius:${rad};background-image:url(${portada.img});background-size:${portada.w / w * 100}% ${portada.h / h * 100}%;background-position:${L / (portada.w - w) * 100}% ${T / (portada.h - h) * 100}%` });
    const door = el('button', {
      class: 'door' + (done ? ' opened' : '') + (canOpen(d) ? '' : ' closed-day'), 'aria-label': t('dayN', d),
      style: `left:${L / portada.w * 100}%;top:${T / portada.h * 100}%;width:${w / portada.w * 100}%;height:${h / portada.h * 100}%`,
      onclick: () => openDoor(d, door),
    }, el('span', { class: 'door-glow', style: `border-radius:${rad}` }, el('b', {}, d), done ? (st === 'correct' ? '★' : st === 'pending' ? '⏳' : '❄') : ''),
       panel);
    imgWrap.append(door);
  }
  board.append(imgWrap);
  const banners = [];
  if (DEMO) banners.push(el('div', { class: 'demo-bar' }, t('demo')));
  if (testMode()) banners.push(el('div', { class: 'demo-bar test' }, '🧪 Modo prueba: todas las casillas abiertas'));
  app.replaceChildren(header, ...banners, ...(banner ? [banner] : []), ...(strip ? [strip] : []), board);
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
  creak(true);
  door.classList.add('opening');
  await sleep(900);

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
  speak(t('welcome', n), getLang());

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
    else (await import(`./${content.type}.js`)).render(body, ctx);
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
  const paper = el('select', {}, ...PAPERS.map(p => el('option', { value: p.id, selected: p.id === (S.profile.paper || 'pergamino') }, p.name)));
  const port = el('select', {}, ...PORTADAS.map(p => el('option', { value: p.id, selected: p.id === S.profile.portada }, p.name)));
  const preview = el('div', { class: 'paper-preview' }, el('p', {}, '¡Ho, ho, ho! Así se verán tus notas.'));
  const upd = () => { PAPERS.forEach(p => preview.classList.remove('paper-' + p.id)); preview.classList.add('paper', 'paper-' + paper.value); };
  paper.onchange = upd; upd();
  const box = el('div', { class: 'settings-form' },
    el('h2', {}, t('settings')),
    el('label', {}, t('name'), name), el('label', {}, t('language'), lang),
    el('label', {}, t('paper'), paper), preview, el('label', {}, t('portada'), port));
  popup(box, { buttons: [{ label: t('cancel'), value: false, cls: 'btn-ghost' }, { label: t('save'), value: true }] }).then(async ok => {
    if (!ok) return;
    Object.assign(S.profile, { name: name.value.trim() || S.profile.name, lang: lang.value, paper: paper.value, portada: port.value });
    setLang(lang.value); localStorage.setItem('adv_lang', lang.value);
    await store.saveProfile(S.user.uid, { name: S.profile.name, lang: S.profile.lang, paper: S.profile.paper, portada: S.profile.portada });
    renderHome();
  });
}

boot();
