import { initStore, store, DEMO } from './store.js?v=15.7';
import { t, tx, setLang, getLang } from './i18n.js?v=15.7';
import { defaultDay, DEFAULT_CONFIG, PAPERS, PORTADAS, DEFAULT_PORTADA, MARQUEE_DEFAULT, MISSED_DEFAULT, SPLASH_DEFAULT } from './defaults.js?v=15.7';
import { creak, speak, unlockAudio, crumple as crumpleSound, chime, doorSound, hohoho, fanfare, wrong, clickSound } from './sound.js?v=15.7';
import { typeRich, gallery } from './richact.js?v=15.7';
import { $, el, sleep, esc, confetti, typewriter, popup, toast } from './fx.js?v=15.7';

export const APP_VERSION = 'V15.7';
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
  const def = defaultDay(n);
  return { ...def, ...(c || {}), type: def.type }; // el tipo de juego de cada día es fijo
}
export function applyPaper(node) {
  PAPERS.forEach(p => node.classList.remove('paper-' + p.id));
  node.classList.add('paper', 'paper-' + (S.profile?.paper || 'nordico'));
}

// ------------------------------------------------------------------ arranque
// ------------------------------------------------------------------ pantalla de bienvenida con nieve
function splashCfg() {
  try { return { ...SPLASH_DEFAULT, ...(JSON.parse(localStorage.getItem('adv_splash')) || {}) }; } catch { return SPLASH_DEFAULT; }
}
function splash() {
  const cfg = splashCfg();
  let seen = false; try { seen = sessionStorage.getItem('adv_splash_seen') === '1'; sessionStorage.setItem('adv_splash_seen', '1'); } catch {}
  if (cfg.show === false || seen) return Promise.resolve();
  return new Promise(resolve => {
    const secs = Math.max(1, Math.min(30, +cfg.seconds || 5));
    const cv = el('canvas', { class: 'splash-snow' });
    const title = el('h1', { class: 'splash-title' }, tx(cfg.text) || tx(SPLASH_DEFAULT.text));
    const pic = el('div', { class: 'splash-pic' }, el('img', { src: 'arbol.png', alt: '' }));
    const msg = el('div', { class: 'splash-msg' }, pic, title);
    const skip = el('button', { class: 'splash-skip' }, '›');
    const box = el('div', { class: 'splash' }, cv, msg, skip);
    document.body.append(box);
    const c = cv.getContext('2d'); let W, H, dpr = Math.min(2, devicePixelRatio || 1);
    const size = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener('resize', size);
    const N = Math.round(Math.min(260, W * H / 3500));
    const flakes = Array.from({ length: N }, () => ({ x: Math.random() * W, y: -Math.random() * H, r: Math.random() < .75 ? 1 + Math.random() * 2.5 : 3.5 + Math.random() * 3.5, v: .6 + Math.random() * 1.4, w: Math.random() * 6, s: .5 + Math.random() }));
    const pile = new Float32Array(Math.ceil(W / 4) + 2);
    const t0 = performance.now(); let done = false, shown = false;
    (function loop(now) {
      if (done) return;
      const el_ = (now - t0) / 1000;
      c.clearRect(0, 0, W, H);
      // nieve que se acumula abajo (suavizada)
      for (let k = 1; k < pile.length - 1; k++) pile[k] = pile[k] * .6 + (pile[k - 1] + pile[k + 1]) * .2;
      c.fillStyle = '#eef4fb'; c.beginPath(); c.moveTo(0, H);
      for (let i = 0; i < pile.length; i++) c.lineTo(i * 4, H - pile[i]);
      c.lineTo(W, H); c.fill();
      for (const f of flakes) {
        f.y += f.v * (f.r / 3 + .6); f.x += Math.sin(now / 900 * f.s + f.w) * .5;
        const floor = H - (pile[Math.max(0, Math.min(pile.length - 1, Math.round(f.x / 4)))] || 0);
        if (f.y > floor) {
          const i = Math.round(f.x / 4); if (i >= 0 && i < pile.length && pile[i] < H * .07) { pile[i] += f.r * .35; if (pile[i - 1] !== undefined) pile[i - 1] += f.r * .25; if (pile[i + 1] !== undefined) pile[i + 1] += f.r * .25; }
          if (el_ < secs) { f.y = -10; f.x = Math.random() * W; } else f.y = H + 50;
        }
        if (f.y > -10 && f.y < H + 20) {
          c.beginPath(); c.arc(f.x, f.y, f.r, 0, 7);
          c.fillStyle = f.r > 3.4 ? '#b9d4ee' : '#cfe2f5'; c.fill();
          if (f.r > 3.4) { c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.stroke(); }
        }
      }
      if (el_ >= secs && !shown) { shown = true; box.classList.add('show-msg'); setTimeout(finish, 3800); }
      requestAnimationFrame(loop);
    })(t0);
    function finish() {
      if (done) return; done = true; removeEventListener('resize', size);
      box.classList.add('out'); setTimeout(() => { box.remove(); resolve(); }, 700);
    }
    skip.onclick = finish;
  });
}

async function boot() {
  setLang(localStorage.getItem('adv_lang') || 'es');
  await splash();
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
    try { if (config?.splash) localStorage.setItem('adv_splash', JSON.stringify(config.splash)); } catch {}
    S.card = card;
    setLang(S.profile.lang || 'es');
    renderHome();
    import('./admin.js?v=15.7').catch(() => {});
    import('./surprise.js?v=15.7').then(m => m.showSurprise(u.uid)).catch(() => {});
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
// un día ya pasado que no se ha abierto
function missed(d) {
  const { y, m, d: today } = madridToday(); const Y = S.config.year;
  return y > Y || (y === Y && m === 12 && today > d);
}
function showMissed(d) {
  wrong();
  const msg = (S.config.missedMsg || MISSED_DEFAULT).replaceAll('{dia}', d);
  popup(`<div class="missed-pop"><div class="missed-big">🧌</div><p class="prize-text">${esc(msg)}</p><div class="missed-gifts">🎁 🎁 🎁</div></div>`);
}
// Premio de la casilla g: del día 1 al g se pueden fallar (o no hacer) como máximo 3 casillas
export const GOALS = [10, 15, 20, 25];
function prizeState(g) {
  let ok = 0, bad = 0, pend = 0, todo = 0;
  for (let d = 1; d <= g; d++) {
    const a = S.answers[d];
    if (a?.status === 'correct') ok++;
    else if (a?.status === 'incorrect') bad++;
    else if (a?.status === 'pending') pend++;
    else if (missed(d)) bad++;
    else todo++;
  }
  const state = bad > 3 ? 'lost' : (todo || pend) ? 'play' : 'won';
  return { g, ok, bad, pend, todo, state };
}
function prizeDetail(g) {
  const p = prizeState(g);
  const head = { won: '🏆 ' + t('prizeWon'), lost: '😢 ' + t('prizeLost'), play: '🎁 ' + t('prizePlay') }[p.state];
  popup(`<h2>🎁 ${t('prize')} · ${t('dayRange', g)}</h2><p class="prize-state ${p.state}">${head}</p>
    <div class="prize-counts"><div>✅<b>${p.ok}</b><small>${t('cntOk')}</small></div><div>❌<b>${p.bad}</b><small>${t('cntBad')}</small></div>
    <div>⏳<b>${p.pend}</b><small>${t('cntPend')}</small></div><div>📅<b>${p.todo}</b><small>${t('cntTodo')}</small></div></div>
    <p>${t('failsLeft', Math.max(0, 3 - p.bad))}</p>
    ${p.state === 'won' ? `<p class="prize-text">${esc(S.config.prizes['p' + g])}</p>` : ''}`);
}
// al pulsar una figura de la franja: resultado del día o ánimo para hacerlo
async function dayInfo(d) {
  const fig = figure(), a = S.answers[d];
  const img = el('img', { class: 'dinfo-fig' + (a?.status === 'correct' ? '' : ' bw'), src: FIG_IMG[fig], alt: '' });
  const box = el('div', { class: 'dinfo' }, el('div', { class: 'dinfo-day' }, t('dayDate', d)), img);
  let goBtn = false;
  if (a) {
    const c = await loadDay(d).catch(() => null) || defaultDay(d);
    let ans = a.answer;
    if (c.type === 'quiz' && typeof ans === 'number') ans = (tx(c.options) || [])[ans];
    const st = { correct: ['dinfo-ok', '✅ ' + t('correct')], incorrect: ['dinfo-bad', '❌ ' + t('incorrect')], pending: ['dinfo-pend', '⏳ ' + t('pending')] }[a.status] || ['', ''];
    box.append(el('p', { class: 'dinfo-status ' + st[0] }, st[1]));
    if (c.type === 'quiz') box.append(el('p', { class: 'dinfo-q' }, tx(c.q)));
    if (ans !== '' && ans != null && !/^[\p{Extended_Pictographic}\s]+$/u.test(String(ans))) box.append(el('p', { class: 'dinfo-a' }, el('b', {}, t('yourAnswer') + ': '), String(ans)));
    box.append(el('p', { class: 'dinfo-msg' }, a.status === 'correct' ? t('dinfoWell') : a.status === 'pending' ? t('dinfoWait') : t('dinfoBad')));
    if (actPending(d)) box.append(el('p', { class: 'dinfo-msg' }, '👉 ' + t('remindAct', t(fig === 'arbol' ? 'activity1' : 'activity2'))));
  } else if (canOpen(d)) {
    box.append(el('div', { class: 'dinfo-deco' }, '🎁✨🎄✨🎁'), el('p', { class: 'dinfo-msg big' }, t('dinfoGo', d)));
    goBtn = true;
  } else {
    box.append(el('div', { class: 'dinfo-deco' }, '⏳❄️⏳'), el('p', { class: 'dinfo-msg' }, t('locked', d)));
  }
  const btns = [{ label: t('close'), value: false, cls: goBtn ? 'btn-ghost' : '' }];
  if (goBtn) btns.push({ label: '🚪 ' + t('dinfoOpen'), value: true });
  const r = await popup(box, { cls: 'small', outside: true, buttons: btns });
  if (r) { const door = [...document.querySelectorAll('.door')].find(x => x.getAttribute('aria-label') === t('dayN', d)); if (door) openDoor(d, door); }
}
function showPrizes() {
  const box = el('div', {},
    el('h2', {}, '🏆 ' + t('prizes')),
    el('div', { class: 'rules-deco' }, '🎄🎅🎁'),
    el('p', { class: 'prize-rules' }, t('prizeRules')),
    el('p', { class: 'muted' }, t('prizeTap')),
    ...GOALS.map(g => {
      const p = prizeState(g);
      return el('button', { class: 'prize-row2 ' + p.state, onclick: () => prizeDetail(g) },
        el('span', { class: 'pr-ico' }, { won: '🏆', lost: '💔', play: '🎁' }[p.state]),
        el('span', { class: 'pr-txt' }, el('b', {}, t('dayRange', g)), el('small', {}, p.state === 'won' ? S.config.prizes['p' + g] : `✅ ${p.ok} · ❌ ${p.bad}`)),
        el('span', { class: 'pr-go' }, '›'));
    }));
  popup(box);
}
export function renderHome() {
  document.title = t('appTitle');
  const theme = currentTheme();
  const fig = figure();
  const n = correctCount();

  const header = el('header', { class: 'top' },
    el('div', { class: 'title-frame', onclick: e => { if (e.target.closest('.icon-btn')) return; const f = e.currentTarget; f.classList.add('moving'); clearTimeout(f._t); f._t = setTimeout(() => f.classList.remove('moving'), 4000); } },
      el('div', { class: 'title-inner' },
        el('div', { class: 'title-block' }, el('h1', { class: 'title-text' }, t('appTitle')), el('div', { class: 'greeting' }, greeting())),
        el('div', { class: 'top-actions' },
          el('button', { class: 'icon-btn', title: t('settings'), onclick: openUserSettings }, '⚙️'),
          el('button', { class: 'icon-btn', title: t('admin'), onclick: async () => (await import('./admin.js?v=15.7')).openAdmin() }, '🔒'),
          el('button', { class: 'icon-btn', title: t('logout'), onclick: () => store.signOut() }, '🚪')))));

  let strip = null;
  if (S.settings.showProgress !== false) {
    const row = el('div', { class: 'strip-row' },
      el('button', { class: 'strip-score', title: t('prizes'), onclick: showPrizes }, el('b', {}, n), el('small', {}, '/25'), el('span', {}, '🏆')));
    for (let d = 1; d <= 25; d++) {
      const a = S.answers[d];
      const st = a?.status === 'correct' ? 'on' : a?.status === 'pending' ? 'pend' : a ? 'off' : 'none';
      if (!a && missed(d)) {
        row.append(el('button', { class: 'strip-fig missed' + (d === 25 ? ' big' : ''), title: t('dayN', d), onclick: () => showMissed(d) },
          el('span', { class: 'missed-face' }, '🧌'), el('span', {}, d)));
        continue;
      }
      row.append(el('button', { class: 'strip-fig ' + st + (d === 25 ? ' big' : ''), title: t('dayN', d), onclick: () => dayInfo(d) },
        el('img', { src: FIG_IMG[fig], alt: '' }), el('span', {}, d)));
    }
    strip = el('section', { class: 'strip' }, row);
  }

  const board = el('section', { class: 'board', onclick: e => { if (e.target === board && !fullView) { fullView = true; renderHome(); } } });
  const mq = { ...MARQUEE_DEFAULT, ...(S.config.marquee || {}) };
  const marquee = mq.show === false ? null : el('div', { class: 'marquee', onclick: () => { fullView = true; renderHome(); } },
    el('div', { class: 'marquee-track', style: `animation-duration:${Math.max(4, +mq.speed || 14)}s;color:${mq.color};font-weight:${mq.weight};${/neon/.test(mq.colorName || '') ? `text-shadow:0 0 6px ${mq.color},0 0 14px ${mq.color};` : ''}` },
      ...Array.from({ length: 8 }, () => el('span', {}, ((S.settings?.marqueeText || '').trim() || tx(mq.text) || t('tapToZoom')) + '\u2003✦\u2003'))));
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
  if (actPending(n)) {
    door.classList.add('lighting'); doorSound(n); await sleep(700); door.classList.add('opening'); await sleep(700);
    busy = false; return remindActivity(n);
  }
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
  const cancelBtn = el('button', { class: 'btn btn-cancel' }, t('cancelLater'));
  note.append(el('div', { class: 'note-head' }, el('span', { class: 'note-day' }, t('dayN', n))), body, el('div', { class: 'note-foot' }, ...(S.answers[n] ? [] : [cancelBtn]), finishBtn));
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
  setTimeout(() => speak(t('welcome', n), getLang()), n === 25 ? 3200 : 0);

  let closed = false;
  const ctx = {
    day: n, content, lang: getLang(), prev: S.answers[n] || null, note, body, finishBtn,
    profile: S.profile, settings: S.settings, user: S.user, config: S.config,
    submit: async data => {
      if (S.answers[n]) return;
      const rec = { answer: data.answer ?? '', status: data.status || 'pending', extra: data.extra ?? null, at: Date.now() };
      S.answers[n] = { ...rec }; cancelBtn.remove();
      try { await store.submitAnswer(S.user.uid, n, rec); } catch (e) { console.error(e); toast('⚠️ ' + e.message); }
      if (rec.status === 'correct') { fanfare(); checkPrize(); }
    },
    finish: () => { if (!closed) { closed = true; closeDay(n, layer, note, door); } },
  };
  finishBtn.onclick = ctx.finish; cancelBtn.onclick = ctx.finish;
  try {
    if (ctx.prev && !['diploma', 'dance', 'santa', 'roulette'].includes(content.type)) renderSummary(body, ctx);
    else (await import(`./${content.type}.js?v=15.7`)).render(body, ctx);
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
  let seen = {}; const key = 'adv_prizes_' + S.user.uid;
  try { seen = JSON.parse(localStorage.getItem(key)) || {}; } catch {}
  const g = GOALS.find(x => !seen[x] && prizeState(x).state === 'won');
  if (!g) return;
  seen[g] = 1; try { localStorage.setItem(key, JSON.stringify(seen)); } catch {}
  setTimeout(() => { confetti(250); chime(); popup(`<h2>🏆 ${t('prize')}!</h2><p>${t('dayRange', g)}</p><p class="prize-text">${esc(S.config.prizes['p' + g])}</p>`); }, 1800);
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

// Arrugar el papel: solo transformaciones y recortes (las hace la tarjeta gráfica, va fluido)
const JAG = (k, seed) => { // contorno de bola arrugada: k=0 rectángulo, k=1 bola dentada
  const pts = [], n = 28;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, r = 50 * (1 - k * .55) * (1 + (k * .16) * Math.sin(i * 7.3 + seed));
    const sx = Math.cos(a), sy = Math.sin(a), m = Math.max(Math.abs(sx), Math.abs(sy));
    const rx = 50 + (sx / m * 50) * (1 - k) + (sx * r) * k, ry = 50 + (sy / m * 50) * (1 - k) + (sy * r) * k;
    pts.push(`${rx.toFixed(1)}% ${ry.toFixed(1)}%`);
  }
  return `polygon(${pts.join(',')})`;
};
// Textura de pliegues: facetas de papel arrugado (se genera una sola vez)
let CREASE_URL = null;
function creaseTexture() {
  if (CREASE_URL) return CREASE_URL;
  const S = 360, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d'), N = 7, c = S / N, P = [];
  for (let y = 0; y <= N; y++) { P[y] = []; for (let x = 0; x <= N; x++) {
    const edge = x === 0 || y === 0 || x === N || y === N;
    P[y][x] = [x * c + (edge ? 0 : (Math.random() - .5) * c * .9), y * c + (edge ? 0 : (Math.random() - .5) * c * .9)];
  } }
  const tri = (a, b, d) => { // cada faceta con su luz, como si el papel tuviera relieve
    const l = 150 + Math.random() * 105 | 0;
    g.fillStyle = `rgb(${l},${l},${l})`; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...d); g.closePath(); g.fill();
    g.strokeStyle = Math.random() < .5 ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.8)'; g.lineWidth = 1.2; g.stroke();
  };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const p = P[y][x], q = P[y][x + 1], r = P[y + 1][x + 1], s = P[y + 1][x];
    if (Math.random() < .5) { tri(p, q, r); tri(p, r, s); } else { tri(p, q, s); tri(q, r, s); }
  }
  CREASE_URL = cv.toDataURL('image/jpeg', .8);
  return CREASE_URL;
}

// Arrugar como papel de verdad: pliegues con luz y sombra + deformación SVG + bola que se encoge
export async function crumpleAnim(node, out = true) {
  const creases = el('div', { class: 'creases' });
  creases.style.backgroundImage = `url(${creaseTexture()})`;
  node.append(creases);
  const disp = document.querySelector('#crumpleFilter feDisplacementMap');
  const turb = document.querySelector('#crumpleFilter feTurbulence');
  if (turb) turb.setAttribute('seed', String(1 + Math.random() * 90 | 0));
  node.style.willChange = 'transform, clip-path, opacity, filter';
  const dur = out ? 1800 : 1500, t0 = performance.now(), seed = Math.random() * 9;
  const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  let frame = 0;
  await new Promise(done => {
    const f = now => {
      const p = Math.min(1, (now - t0) / dur);
      const k = out ? ease(p) : 1 - ease(p); // 0 = hoja lisa, 1 = bola
      // pliegues: aparecen enseguida y se marcan cada vez más
      creases.style.opacity = Math.min(.95, k * 2.2).toFixed(3);
      // deformación del papel (cada 2 fotogramas para que vaya suave)
      if (disp && (frame++ % 2 === 0 || p === 1)) {
        disp.setAttribute('scale', (k * 55).toFixed(1));
        node.style.filter = k > .02 ? 'url(#crumpleFilter)' : '';
      }
      node.style.clipPath = k > .01 ? JAG(Math.min(1, k * 1.1), seed) : '';
      const sc = 1 - k * .8;
      node.style.transform = `perspective(900px) scale(${sc}) rotate(${k * 30 + Math.sin(k * 9) * 5}deg) rotateX(${Math.sin(k * 7) * 14}deg) rotateY(${Math.cos(k * 6) * 12}deg) translateY(${k * 40}px)`;
      node.style.opacity = out ? (k > .88 ? 1 - (k - .88) / .12 : 1) : Math.min(1, .25 + p * 3);
      if (p < 1) requestAnimationFrame(f); else done();
    };
    requestAnimationFrame(f);
  });
  if (!out) {
    creases.remove();
    Object.assign(node.style, { filter: '', clipPath: '', transform: '', opacity: '', willChange: '' });
  }
}

async function showActivity(n, layer) {
  const fig = figure();
  const content = await loadDay(n) || defaultDay(n);
  const key = fig === 'arbol' ? 'act1' : 'act2';
  const over = null; // ya no hay actividades por persona: todos ven las del día
  const text = (over && over.trim()) || tx(content[key]);
  const note = el('div', { class: 'note activity-note' });
  applyPaper(note);
  const textBox = el('div', { class: 'activity-text rich' });
  const media = (await store.getMedia(n).catch(() => [])).filter(m => m.act === key);
  const gal = gallery(media);
  const btn = el('button', { class: 'btn btn-finish', disabled: true }, t('finish'));
  const later = el('button', { class: 'btn btn-cancel' }, t('cancelLater'));
  note.append(
    el('div', { class: 'note-head' }, el('span', { class: 'note-day' }, `${t(fig === 'arbol' ? 'activity1' : 'activity2')} · ${t('dayN', n)}`)),
    el('div', { class: 'note-body activity-body' },
      el('img', { class: 'activity-fig', src: FIG_IMG[fig], alt: '' }),
      textBox, gal,
      el('p', { class: 'activity-warn' }, t('warnColor', t('figName')[fig]))),
    el('div', { class: 'note-foot' }, later, btn));
  layer.append(note);
  crumpleSound();
  let choice = null; const decided = new Promise(r => { btn.onclick = () => r('done'); later.onclick = () => { choice = 'later'; r('later'); }; });
  await crumpleAnim(note, false);
  await Promise.race([typeRich(textBox, text, 24), decided]);
  btn.disabled = false;
  const res = choice || await decided;
  if (res === 'done') {
    const stamp = S.answers[n]?.at || true;
    S.profile.actDone = { ...(S.profile.actDone || {}), [n]: stamp };
    store.saveProfile(S.user.uid, { actDone: { [n]: stamp } }).catch(e => console.warn(e));
  }
  note.classList.add('fly-away');
  await sleep(500);
  return res;
}
const actPending = n => {
  if (figure() === 'galleta' || !S.answers[n]) return false;
  const v = S.profile?.actDone?.[n];
  return !(v === true || (v && v === S.answers[n].at));
};

// volver a un día con el reto hecho pero la actividad pendiente
async function remindActivity(n) {
  const fig = figure();
  const layer = el('div', { class: 'note-layer' }); document.body.append(layer);
  const note = el('div', { class: 'note activity-note' }); applyPaper(note);
  const go = el('button', { class: 'btn btn-finish' }, t('remindGo'));
  const later = el('button', { class: 'btn btn-cancel' }, t('cancelLater'));
  note.append(el('div', { class: 'note-head' }, el('span', { class: 'note-day' }, t('dayN', n))),
    el('div', { class: 'note-body activity-body' },
      el('div', { class: 'remind-deco' }, '🎄 ⭐ 🎁 ⭐ 🎄'),
      el('p', { class: 'activity-text' }, t('remindDone', n)),
      el('img', { class: 'activity-fig', src: FIG_IMG[fig], alt: '' }),
      el('p', { class: 'activity-text remind-small' }, t('remindAct', t(fig === 'arbol' ? 'activity1' : 'activity2'))),
      el('div', { class: 'remind-deco' }, '❄️ 🦌 🔔 🦌 ❄️')),
    el('div', { class: 'note-foot' }, later, go));
  layer.append(note);
  note.animate([{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' });
  chime();
  const r = await new Promise(res => { go.onclick = () => res('go'); later.onclick = () => res('later'); });
  if (r === 'go') { crumpleSound(); await crumpleAnim(note, true); note.remove(); await showActivity(n, layer); }
  creak(false); layer.classList.add('fade-out'); await sleep(700); layer.remove(); renderHome();
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
document.addEventListener('touchmove', e => { if (e.touches.length > 1 && !e.target.closest('.santa-stage, .reindeer-scroll')) e.preventDefault(); }, { passive: false });

// Botones: se hunden, hacen «clic» y, después, hacen su acción
document.addEventListener('click', e => {
  const b = e.target.closest('.btn, .icon-btn, .q-opt, .prize-row2, .strip-score, .tb-btn');
  if (!b || b.disabled) return;
  if (b._go) { b._go = false; return; } // segunda vez: ya toca hacer la acción
  clickSound();
  b.classList.remove('pressing'); void b.offsetWidth; b.classList.add('pressing');
  setTimeout(() => b.classList.remove('pressing'), 260);
  // los que necesitan el toque directo (compartir, archivos, enlaces) no esperan
  if (b.matches('.no-delay, a, label, .file-btn') || b.closest('.santa-controls')) return;
  e.preventDefault(); e.stopImmediatePropagation();
  setTimeout(() => { b._go = true; b.click(); }, 170);
}, true);

boot();
