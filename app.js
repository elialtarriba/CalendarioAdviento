import { initStore, store, DEMO } from './store.js?v=17.15';
import { t, tx, setLang, getLang } from './i18n.js?v=17.15';
import { defaultDay, DEFAULT_CONFIG, PAPERS, PORTADAS, DEFAULT_PORTADA, MARQUEE_DEFAULT, MISSED_DEFAULT, SPLASH_DEFAULT } from './defaults.js?v=17.15';
import { creak, speak, unlockAudio, crumple as crumpleSound, chime, doorSound, hohoho, fanfare, wrong, clickSound, christmasSong, audioOn, onAudioState } from './sound.js?v=17.15';
import { typeRich, gallery, lightbox } from './richact.js?v=17.15';
import { $, el, sleep, esc, confetti, typewriter, popup, toast } from './fx.js?v=17.15';

export const APP_VERSION = 'V17.15';
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
// modo prueba: se recuerda en este aparato hasta que la administradora lo desactive
const testKey = () => 'adv_test_' + (S.user?.uid || '');
export const testMode = () => { try { return localStorage.getItem(testKey()) === '1'; } catch { return false; } };
export const setTestMode = on => { try { on ? localStorage.setItem(testKey(), '1') : localStorage.removeItem(testKey()); } catch {} };
function canOpen(n) {
  if (testMode()) return true;
  const { y, m, d } = madridToday(); const Y = S.config.year;
  return y > Y || (y === Y && m === 12 && d >= n);
}
export const figure = () => S.settings?.figure || 'galleta';
// el premio depende de la figura de cada persona (galleta, árbol o gnomo); si no hay texto propio, el general
export const prizeText = g => (S.config.prizesFig?.[figure()]?.['p' + g] || '').trim() || S.config.prizes?.['p' + g] || '';
const correctCount = () => Object.values(S.answers).filter(a => a.status === 'correct').length;
// tal cual está guardado (sin traducir): para el administrador
export async function loadDayRaw(n) {
  const c = await store.getDay(n).catch(() => null);
  if (c && c.locked) return null;
  const def = defaultDay(n);
  return { ...def, ...(c || {}), type: def.type };
}
export async function loadDay(n) {
  const c = await store.getDay(n).catch(() => null);
  if (c && c.locked) return null;
  const def = defaultDay(n);
  const day = { ...def, ...(c || {}), type: def.type }; // el tipo de juego de cada día es fijo
  // lo que el administrador escribe en español se traduce solo al idioma elegido (si no lo ha escrito él)
  if (c && getLang() !== 'es') { try { return await (await import('./translate.js?v=17.15')).localizeDay(day, def, getLang()); } catch {} }
  return day;
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
    const hint = el('div', { class: 'splash-hint' }, '🔔 Toca la pantalla para oír la música');
    const box = el('div', { class: 'splash' }, cv, msg, skip, hint);
    document.body.append(box);
    // música desde el primer copo; el iPhone no deja sonar nada hasta que se toca la pantalla
    let music = null; try { music = christmasSong(); } catch {}
    const checkSound = () => { if (music?.playing) hint.classList.add('hide'); else hint.classList.add('show'); };
    setTimeout(checkSound, 600);
    box.addEventListener('pointerdown', e => {
      if (e.target === skip) return;
      unlockAudio(); hint.classList.add('hide');
      // si la música no ha arrancado (el sonido se había cortado), se vuelve a empezar
      setTimeout(() => { if (!music?.playing) { music?.stop(0); try { music = christmasSong(); } catch {} } checkSound(); }, 300);
    });
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
      setTimeout(() => music?.stop(4), 7000); // sigue sonando unos segundos con la portada abierta
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
    // si ha elegido el idioma en la pantalla de entrada, se queda ese (y se guarda en su perfil)
    let pick = null; try { pick = localStorage.getItem('adv_lang_pick'); localStorage.removeItem('adv_lang_pick'); } catch {}
    if (pick && pick !== S.profile.lang) { S.profile.lang = pick; store.saveProfile(u.uid, { lang: pick }).catch(() => {}); }
    setLang(S.profile.lang || 'es');
    renderHome();
    import('./admin.js?v=17.15').catch(() => {});
    import('./surprise.js?v=17.15').then(m => m.showSurprise(u.uid)).catch(() => {});
  });
}

// ------------------------------------------------------------------ login
function renderLogin(mode = 'login') {
  document.title = t('appTitle');
  const errBox = el('div', { class: 'form-err' });
  const name = el('input', { type: 'text', placeholder: t('name'), autocomplete: 'name' });
  const email = el('input', { type: 'email', placeholder: t('email'), autocomplete: 'email' });
  const pw = el('input', { type: 'password', placeholder: t('password'), autocomplete: mode === 'login' ? 'current-password' : 'new-password' });
  // idioma, antes de entrar
  const langSel = el('div', { class: 'login-langs' }, ...[['es', 'Castellano'], ['ca', 'Català'], ['en', 'English']].map(([v, l]) =>
    el('button', { type: 'button', class: 'login-lang no-delay' + (v === getLang() ? ' on' : ''), onclick: () => { setLang(v); try { localStorage.setItem('adv_lang_pick', v); } catch {} renderLogin(mode); } }, l)));
  const guideBtn = el('button', { type: 'button', class: 'btn btn-ghost login-guide no-delay', onclick: () => import('./help.js?v=17.15').then(m => m.openUserHelp(getLang())).catch(e => toast('⚠️ ' + e.message)) },
    '📖 ' + ({ es: 'Cómo funciona', ca: 'Com funciona', en: 'How it works' }[getLang()] || 'Cómo funciona'));
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
    langSel,
    mode === 'register' ? name : null, email, pw, errBox,
    el('button', { class: 'btn btn-big', type: 'submit' }, mode === 'login' ? t('login') : t('register')),
    el('a', { href: '#', onclick: e => { e.preventDefault(); renderLogin(mode === 'login' ? 'register' : 'login'); } }, mode === 'login' ? t('noAccount') : t('haveAccount')),
    mode === 'login' ? el('a', { href: '#', class: 'small', onclick: async e => {
      e.preventDefault(); if (!email.value) { email.focus(); toast(t('emailFirst')); return; }
      if (DEMO) return demoReset(email.value.trim());
      try { await store.resetPassword(email.value.trim()); toast(t('resetSent'), 6000); }
      catch (er) { toast(String(er.code || '').includes('user-not-found') ? t('noUser') : t('loginError') + ' (' + (er.code || er.message) + ')', 6000); }
    } }, t('forgot')) : null,
    guideBtn,
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
    ${p.state === 'won' ? `<p class="prize-text" id="pz-txt-${g}">${esc(prizeText(g))}</p>` : ''}`);
  if (p.state === 'won' && getLang() !== 'es') { const n = document.getElementById('pz-txt-' + g); if (n) n.replaceWith(tEl('p', 'prize-text', prizeText(g))); }
}
// confeti que brilla: cae de arriba abajo y cada pieza se enciende un momento (como lucecitas)
function glowConfetti(parent) {
  const cv = el('canvas', { class: 'glow-confetti' }); parent.append(cv);
  const g = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1);
  let W = 0, H = 0; const size = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; }; size();
  const COLS = ['#ffd24a', '#ff4d6d', '#ffffff', '#7cf29a', '#5ab0ff', '#f2c14e', '#ff9ad5'];
  const P = []; let raf, t0 = performance.now(), stopped = false, last = t0;
  const add = n => { for (let i = 0; i < n; i++) P.push({ x: Math.random() * W, y: -20 - Math.random() * H * .9 + (P.length < 200 ? H * .35 : 0), vy: 2.6 + Math.random() * 3.2, vx: (Math.random() - .5) * .8, w: 5 + Math.random() * 7, h: 3 + Math.random() * 6,
    rot: Math.random() * 7, vr: (Math.random() - .5) * .2, c: COLS[i % COLS.length], sw: Math.random() * 7, lit: Math.random() * 4000, star: Math.random() < .25 }); };
  add(380);
  const f = now => {
    const el2 = now - t0, dt = Math.min(3, (now - last) / 16.7); last = now;
    if (!stopped && el2 < 7000 && P.length < 800) add(9);          // sigue cayendo un buen rato
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.y += p.vy * dt; p.x += (p.vx + Math.sin(now / 400 + p.sw) * .6) * dt; p.rot += p.vr * dt;
      if (p.y > H + 30) { P.splice(i, 1); continue; }
      // cada pieza se ilumina un instante (en momentos distintos) mientras baja
      const k = ((now + p.lit) % 2600) / 2600, glow = k < .18 ? Math.sin(k / .18 * Math.PI) : 0;
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
      if (glow > 0) { g.shadowColor = p.c; g.shadowBlur = 18 * glow; g.globalCompositeOperation = 'lighter'; }
      g.globalAlpha = .75 + .25 * glow; g.fillStyle = glow > .5 ? '#fff' : p.c;
      if (p.star) { const r = p.w * (.8 + glow * .6); g.beginPath(); for (let j = 0; j < 10; j++) { const a = j * Math.PI / 5, rr = j % 2 ? r * .45 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); }
      else g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      g.restore();
    }
    if (P.length || !stopped && el2 < 6000) raf = requestAnimationFrame(f); else cv.remove();
  };
  raf = requestAnimationFrame(f);
  return () => { stopped = true; cancelAnimationFrame(raf); cv.remove(); };
}
// texto escrito por la administradora: sale en español y se cambia por la traducción al idioma elegido
function tEl(tag, cls, text) {
  const n = el(tag, { class: cls }, text || '');
  if (text && getLang() !== 'es') import('./translate.js?v=17.15').then(m => m.tr(text, getLang())).then(x => { if (x) n.textContent = x; }).catch(() => {});
  return n;
}
// el regalo: una caja que se abre y dentro el premio (texto, mensaje y foto que pone el administrador)
async function revealPrize(g) {
  const fig = figure(), pf = S.config.prizesFig?.[fig] || {};
  const msg = (pf['m' + g] || '').trim(), photoP = store.getPrizePhoto(fig, g).catch(() => '');
  const box = el('div', { class: 'pzr' },
    el('div', { class: 'pzr-deco' }, ...['ilu-12.webp', 'ilu-5.webp', 'ilu-12.webp'].map((s, i) => el('img', { src: s, alt: '', class: 'pzr-d' + i }))),
    el('div', { class: 'pzr-gift' }, el('img', { src: 'ilu-gr.webp', alt: '' }), el('div', { class: 'pzr-rays' })),
    el('p', { class: 'pzr-hint' }, L3('Toca el regalo para abrirlo', 'Toca el regal per obrir-lo', 'Tap the present to open it')));
  const back = el('div', { class: 'popup-back pzr-back' }, el('div', { class: 'popup small pzr-pop' }, box));
  document.body.append(back);
  // al entrar: muchísimo confeti que se va iluminando pieza a pieza mientras cae, con música de Navidad
  let music = null; try { unlockAudio(); music = christmasSong(); } catch {}
  const stopFx = glowConfetti(back);
  const gift = box.querySelector('.pzr-gift');
  await new Promise(r => { gift.onclick = r; setTimeout(r, 9000); });
  gift.onclick = null; box.querySelector('.pzr-hint').textContent = '✨';
  try { const { jingle } = await import('./sound.js?v=17.15'); jingle(1); } catch {}
  gift.classList.add('shake'); await sleep(900); gift.classList.add('open'); chime(); confetti(220);
  await sleep(700);
  const photo = await photoP;
  const content = el('div', { class: 'pzr-content' },
    el('div', { class: 'pzr-kicker' }, '🏆 ' + t('dayRange', g)),
    el('h2', {}, L3('¡Tu regalo!', 'El teu regal!', 'Your present!')),
    prizeText(g) ? tEl('p', 'pzr-prize', prizeText(g)) : null,
    msg ? tEl('p', 'pzr-msg', msg) : null,
    photo ? el('button', { class: 'pzr-photo no-delay', onclick: () => lightbox([{ kind: 'img', src: photo }], 0) }, el('img', { src: photo, alt: '' }), el('small', {}, '🔍 ' + L3('Toca para verla en grande', 'Toca per veure-la en gran', 'Tap to enlarge'))) : null,
    el('button', { class: 'btn btn-big no-delay pzr-ok', onclick: () => { try { music?.stop(2); } catch {} stopFx(); back.classList.add('out'); setTimeout(() => back.remove(), 300); } }, '🎄 ' + L3('¡Gracias, Papá Noel!', 'Gràcies, Pare Noel!', 'Thank you, Santa!')));
  box.querySelector('.pzr-hint').remove(); gift.after(content);
  try { hohoho(); } catch {}
}
// al pulsar una figura de la franja: resultado del día o ánimo para hacerlo
async function dayInfo(d) {
  const fig = figure(), a = S.answers[d];
  const img = a?.status === 'incorrect' ? el('div', { class: 'dinfo-grumpy' }, '🧌')
    : el('img', { class: 'dinfo-fig' + (a?.status === 'correct' ? '' : ' bw'), src: FIG_IMG[fig], alt: '' });
  if (a?.status === 'incorrect') wrong();
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
    if (a.status === 'incorrect') {
      // por qué no ha salido
      let why = t('dinfoWhyGeneric');
      if (c.type === 'quiz') { const right = (tx(c.options) || [])[+c.correct]; if (right != null) why = t('dinfoWhyQuiz', right); }
      else if (a.extra?.missing) why = t('dinfoWhyMissing', a.extra.missing);
      box.append(el('p', { class: 'dinfo-why' }, '🔍 ' + why));
      // ánimo: cuántos fallos quedan para el próximo premio
      const g = GOALS.find(x => x >= d && prizeState(x).state !== 'lost');
      box.append(el('p', { class: 'dinfo-msg' }, g ? t('dinfoCheer', Math.max(0, 3 - prizeState(g).bad), g) : t('dinfoCheerLost')));
    } else box.append(el('p', { class: 'dinfo-msg' }, a.status === 'correct' ? t('dinfoWell') : t('dinfoWait')));
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
      const row = el('button', { class: 'prize-row2 ' + p.state, onclick: () => prizeDetail(g) },
        el('span', { class: 'pr-ico' }, { won: '🏆', lost: '💔', play: '🎁' }[p.state]),
        el('span', { class: 'pr-txt' }, el('b', {}, t('dayRange', g)),
          prizeText(g) ? tEl('span', 'pr-prize', prizeText(g)) : null,
          el('small', {}, `✅ ${p.ok} · ❌ ${p.bad}`)),
        el('span', { class: 'pr-go' }, '›'));
      if (p.state !== 'won') return row;
      // regalo conseguido: botón para abrirlo
      return el('div', { class: 'prize-wrap won' }, row,
        el('button', { class: 'prize-claim no-delay', onclick: () => revealPrize(g) }, el('img', { src: 'ilu-gr.webp', alt: '' }), el('span', {}, L3('Pulsa para conseguir el regalo', 'Prem per aconseguir el regal', 'Tap to get your present')), '✨'));
    }));
  popup(box);
}
// texto general de la cinta (el antiguo «pulsa para verla en grande» se cambia por la felicitación)
function marqueeGeneral(mq) {
  const txt = tx(mq.text) || '';
  if (!txt || /en grande|en gran|full screen/i.test(txt)) return t('marqueeDefault', S.config.year || new Date().getFullYear());
  return txt;
}
// botón de sonido: verde si suena; rojo si el móvil lo ha cortado (un toque y vuelve)
function sndBtn() {
  const on = audioOn();
  return el('button', { class: 'icon-btn snd-btn no-delay' + (on ? '' : ' off'), title: t(on ? 'soundOn' : 'soundOff'),
    onclick: () => { unlockAudio(true); setTimeout(() => { chime(); paintSnd(); }, 200); toast(audioOn() ? '🔊 ' + t('soundOn') : '🔊 ' + t('soundBack')); } }, on ? '🔊' : '🔇');
}
function paintSnd(on = audioOn()) {
  document.querySelectorAll('.snd-btn').forEach(b => { b.classList.toggle('off', !on); b.textContent = on ? '🔊' : '🔇'; b.title = t(on ? 'soundOn' : 'soundOff'); });
}
onAudioState(paintSnd);
export function renderHome() {
  document.title = t('appTitle');
  const theme = currentTheme();
  const fig = figure();
  const n = correctCount();

  const header = el('header', { class: 'top' },
    el('div', { class: 'title-frame', onclick: e => { if (e.target.closest('.icon-btn')) return; const f = e.currentTarget; f.classList.add('moving'); clearTimeout(f._t); f._t = setTimeout(() => f.classList.remove('moving'), 4000); } },
      el('div', { class: 'title-inner' },
        el('div', { class: 'title-block' }, el('h1', { class: 'title-text' }, t('appTitle')), el('div', { class: 'greeting' }, greeting())),
        el('span', { class: 'ver-tag' }, APP_VERSION),
        el('div', { class: 'top-actions' },
          sndBtn(),
          el('button', { class: 'icon-btn', title: t('settings'), onclick: openUserSettings }, '⚙️'),
          el('button', { class: 'icon-btn', title: t('admin'), onclick: async () => (await import('./admin.js?v=17.15')).openAdmin() }, '🔒')))));

  let strip = null;
  if (S.settings.showProgress !== false) {
    const row = el('div', { class: 'strip-row' },
      el('button', { class: 'strip-score', title: t('prizes'), onclick: showPrizes }, el('b', {}, n), el('small', {}, '/25'), el('span', {}, '🏆')));
    for (let d = 1; d <= 25; d++) {
      const a = S.answers[d];
      // si falta la actividad del árbol o del gnomo, la figura no se ilumina todavía
      const st = a && actPending(d) && a.status !== 'incorrect' ? 'half' : a?.status === 'correct' ? 'on' : a?.status === 'pending' ? 'pend' : a ? 'off' : 'none';
      if (!a && missed(d)) {
        row.append(el('button', { class: 'strip-fig missed' + (d === 25 ? ' big' : ''), title: t('dayN', d), onclick: () => showMissed(d) },
          el('span', { class: 'missed-face' }, '🧌'), el('span', {}, d)));
        continue;
      }
      if (st === 'off') { // casilla mal hecha: en vez de la figura, el duende verde gruñón iluminado
        row.append(el('button', { class: 'strip-fig wrong' + (d === 25 ? ' big' : ''), title: t('dayN', d), onclick: () => dayInfo(d) },
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
      ...Array.from({ length: 8 }, () => el('span', {}, ((S.settings?.marqueeText || '').trim() || marqueeGeneral(mq)) + '\u2003✦\u2003'))));
  const bars = [];
  if (DEMO) bars.push(el('div', { class: 'demo-bar' }, t('demo')));
  if (testMode()) bars.push(el('div', { class: 'demo-bar test' }, '🧪 Modo prueba: todas las casillas abiertas'));
  if (!fullView) bars.push(el('button', { class: 'zoom-bar no-delay', onclick: () => { fullView = true; renderHome(); } }, '🔍 ' + t('zoomBar')));
  const exitBtn = fullView ? el('button', { class: 'exit-full', onclick: () => { fullView = false; renderHome(); } }, '✕ ' + t('exitFull')) : null;
  document.body.classList.toggle('full-view', fullView);
  app.replaceChildren(header, ...bars, ...(strip ? [strip] : []), ...(marquee ? [marquee] : []), board, ...(exitBtn ? [exitBtn] : []));

  fitTitle(); document.fonts?.ready?.then(fitTitle);
  boardObserver?.disconnect();
  boardObserver = new ResizeObserver(() => layoutBoard(board, theme));
  boardObserver.observe(board);
  layoutBoard(board, theme);

  // Cartel de Navidad (después del día 25), una vez por sesión
  const now = new Date(), xmasTime = (now.getMonth() === 11 && now.getDate() >= 25) || (now.getMonth() === 0 && now.getDate() <= 6);
  if (S.answers[25] && xmasTime && !sessionStorage.getItem('adv_banner')) {
    sessionStorage.setItem('adv_banner', '1');
    const close = e => { e?.stopPropagation(); b.classList.add('out'); setTimeout(() => b.remove(), 400); };
    const b = el('div', { class: 'xmas-banner no-delay' },
      el('div', { class: 'xmas-bg', style: 'background-image:url(bola25.webp)' }),
      el('div', { class: 'xmas-text' }, t('newYear')), el('button', { class: 'xmas-close no-delay', onclick: close }, '✕'));
    b.addEventListener('pointerup', close);
    document.body.append(b);
    setTimeout(close, 8000);
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
    const done = !!S.answers[d] && !actPending(d); // si falta la actividad, la casilla sigue cerrada (se ve su dibujo)
    const st = done ? S.answers[d].status : '';
    // la puertecita es un trozo de la propia imagen: se ilumina por dentro y luego se abre
    const panel = el('span', { class: 'door-panel', style: `border-radius:${rad};background-image:url(${v.img});background-size:${v.w / w * 100}% ${v.h / h * 100}%;background-position:${L / (v.w - w) * 100}% ${T / (v.h - h) * 100}%` });
    const door = el('button', {
      class: 'door' + (done ? ' opened' : '') + (S.answers[d] && actPending(d) ? ' half' : '') + (canOpen(d) ? '' : ' closed-day') + (d === 25 ? ' d25' : ''), 'aria-label': t('dayN', d),
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
  if (busy || document.querySelector('.note-layer')) return; // nunca dos casillas a la vez
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
  // Finalizar sin haber hecho el reto: avisar (si no, no sale la actividad y parece que falla)
  finishBtn.onclick = async () => {
    if (!S.answers[n] && figure() !== 'galleta' && !closed) {
      const go = await popup(`<h2>🎄</h2><p style="font-size:18px">${L3('Todavía no has hecho el reto de hoy. Cuando lo hagas, aparecerá tu actividad.', 'Encara no has fet el repte d’avui. Quan el facis, apareixerà la teva activitat.', 'You haven’t done today’s challenge yet. When you do, your activity will appear.')}</p>`,
        { buttons: [{ label: L3('Hacer el reto', 'Fer el repte', 'Do the challenge'), value: false }, { label: L3('Salir', 'Sortir', 'Leave'), value: true, cls: 'btn-ghost' }] });
      if (!go) return;
    }
    ctx.finish();
  };
  cancelBtn.onclick = ctx.finish;
  try {
    if (ctx.prev && !['diploma', 'dance', 'pairs', 'roulette', 'puzzle'].includes(content.type)) renderSummary(body, ctx);
    else (await import(`./${content.type}.js?v=17.15`)).render(body, ctx);
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
  setTimeout(async () => { confetti(250); chime();
    const go = await popup(el('div', {}, el('h2', {}, `🏆 ${t('prize')}!`), el('p', {}, t('dayRange', g)), tEl('p', 'prize-text', prizeText(g))),
      { buttons: [{ label: '🎁 ' + L3('Pulsa para conseguir el regalo', 'Prem per aconseguir el regal', 'Tap to get your present'), value: true }, { label: t('close'), value: false, cls: 'btn-ghost' }] });
    if (go) revealPrize(g); }, 1800);
}

// ------------------------------------------------------------------ cerrar el día
// nunca esperar para siempre a una animación
const withTimeout = (p, ms) => Promise.race([Promise.resolve(p).catch(e => console.warn(e)), sleep(ms)]);
const clearCrumples = () => document.querySelectorAll('.crumple-canvas').forEach(c => c.remove());
const L3 = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
// arruga la nota y la quita (si algo falla, la quita igualmente)
async function crumpleAway(note) {
  try { crumpleSound(); await withTimeout(crumpleAnim(note, true), 4000); } catch (e) { console.warn(e); }
  clearCrumples(); note.remove();
}
// enseña la actividad pase lo que pase: si la versión bonita falla, sale la sencilla
async function runActivity(n, layer) {
  layer.querySelectorAll('.note').forEach(x => x.remove());
  try { return await showActivity(n, layer); }
  catch (e) {
    console.error(e); clearCrumples(); layer.querySelectorAll('.note').forEach(x => x.remove());
    try { return await showActivity(n, layer, true); } catch (e2) { console.error(e2); toast('⚠️ ' + (e2.code || e2.message), 6000); return null; }
  }
}

async function closeDay(n, layer, note, door) {
  const fig = figure();
  const done = !!S.answers[n];
  speechSynthesis?.cancel?.();
  if (fig !== 'galleta' && done && actPending(n)) {
    // la actividad sale siempre que esté pendiente (y solo una vez: la de tu figura)
    await crumpleAway(note);
    const res = await runActivity(n, layer);
    if (res === 'done') fullView = true; // al acabar: el calendario en grande
  }
  // día 25 con la foto hecha: final del calendario con la bola de nieve que cobra vida
  // al acabar el día 25: el resumen de todo el mes
  if (n === 25 && done) { try { await (await import('./summary.js?v=17.15')).monthSummary(); fullView = true; } catch (e) { console.error(e); } }
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
// ---------------------------------------------------------------- arrugar el papel
// Se hace una «foto» de la nota en un lienzo (canvas) y ese dibujo se pliega en facetas con luz y sombra
// hasta hacerse una bola. Todo en UN solo lienzo: muy ligero, también en iPhone (antes, con muchas copias
// de la nota, el iPhone se quedaba sin memoria y recargaba la app sin enseñar la actividad).
function snapshotNote(node, W, H, dpr) {
  const c = document.createElement('canvas'); c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
  const x = c.getContext('2d'); x.scale(dpr, dpr);
  const r = node.getBoundingClientRect(), cs = getComputedStyle(node);
  const cols = (cs.backgroundImage.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}/gi) || []);
  const bw = parseFloat(cs.borderTopWidth) || 0, rad = Math.min(24, parseFloat(cs.borderTopLeftRadius) || 0);
  const rr = (X, Y, w, h, q) => { x.beginPath(); x.moveTo(X + q, Y); x.arcTo(X + w, Y, X + w, Y + h, q); x.arcTo(X + w, Y + h, X, Y + h, q); x.arcTo(X, Y + h, X, Y, q); x.arcTo(X, Y, X + w, Y, q); x.closePath(); };
  const inner = (cs.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor)) ? cs.backgroundColor : (cols[0] || '#fdfaf3');
  // marco (rayas de bastón de caramelo si la nota las tiene)
  if (bw > 0) {
    rr(0, 0, W, H, rad); x.save(); x.clip();
    if (/repeating/.test(cs.backgroundImage) && cols.length >= 4) {
      const rc = [...new Set(cs.backgroundImage.slice(cs.backgroundImage.indexOf('repeating')).match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}/gi) || [])];
      const a = rc[0] || '#b3122e', b2 = rc[1] || '#ffffff';
      x.fillStyle = b2; x.fillRect(0, 0, W, H); x.strokeStyle = a; x.lineWidth = 10;
      for (let i = -H; i < W + H; i += 28) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + H, H); x.stroke(); }
    } else { x.fillStyle = cs.borderTopColor || '#c99a2e'; x.fillRect(0, 0, W, H); }
    x.restore();
  }
  x.fillStyle = inner; rr(bw, bw, W - 2 * bw, H - 2 * bw, Math.max(0, rad - bw)); x.fill();
  // botones e imágenes (y lienzos de los juegos) en su sitio
  node.querySelectorAll('.btn, img, canvas, video').forEach(e => {
    const q = e.getBoundingClientRect(); if (!q.width || q.bottom < r.top || q.top > r.bottom) return;
    const X = q.left - r.left, Y = q.top - r.top;
    try {
      if (e.matches('.btn')) { const bs = getComputedStyle(e); x.fillStyle = /rgba\(0, 0, 0, 0\)/.test(bs.backgroundColor) ? '#b3122e' : bs.backgroundColor; rr(X, Y, q.width, q.height, Math.min(q.height / 2, 22)); x.fill(); }
      else if (e.tagName === 'VIDEO') { x.fillStyle = '#111'; x.fillRect(X, Y, q.width, q.height); }
      else if ((e.tagName === 'IMG' && e.complete && e.naturalWidth) || e.tagName === 'CANVAS') x.drawImage(e, X, Y, q.width, q.height);
    } catch {}
  });
  // texto: cada palabra en su sitio, con su letra y su color
  const w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT); const rg = document.createRange(); let count = 0;
  while (w.nextNode() && count < 900) {
    const tn = w.currentNode, txt = tn.data; if (!txt.trim()) continue;
    const ps = getComputedStyle(tn.parentElement); if (ps.visibility === 'hidden' || ps.display === 'none') continue;
    x.font = `${ps.fontStyle} ${ps.fontWeight} ${ps.fontSize} ${ps.fontFamily}`; x.fillStyle = ps.color; x.textBaseline = 'alphabetic';
    const re = /\S+/g; let m;
    while ((m = re.exec(txt)) && count < 900) {
      rg.setStart(tn, m.index); rg.setEnd(tn, m.index + m[0].length);
      const q = rg.getBoundingClientRect(); if (!q.width || q.bottom < r.top || q.top > r.bottom) continue;
      x.fillText(m[0], q.left - r.left, q.bottom - r.top - q.height * .22); count++;
    }
  }
  return c;
}

export async function crumpleAnim(node, out = true) {
  const dur = (out ? 1900 : 1600) * (window.__crumpleSlow || 1);
  let cv = null;
  try {
    const r = node.getBoundingClientRect();
    if (!r.width || !r.height) throw new Error('sin tamaño');
    const W = r.width, H = r.height, dpr = Math.min(2, window.devicePixelRatio || 1), COLS = 4, ROWS = 5;
    const paper = snapshotNote(node, W, H, dpr);
    // malla de puntos con un poco de desorden (los bordes se quedan rectos)
    const P = [];
    for (let y = 0; y <= ROWS; y++) { P[y] = []; for (let xx = 0; xx <= COLS; xx++) {
      const ex = xx === 0 || xx === COLS, ey = y === 0 || y === ROWS;
      P[y][xx] = [xx / COLS * W + (ex ? 0 : (Math.random() - .5) * W / COLS * .7), y / ROWS * H + (ey ? 0 : (Math.random() - .5) * H / ROWS * .7)];
    } }
    const facets = [];
    for (let y = 0; y < ROWS; y++) for (let xx = 0; xx < COLS; xx++) {
      const a = P[y][xx], b = P[y][xx + 1], c = P[y + 1][xx + 1], d = P[y + 1][xx];
      for (const t of ((xx + y) % 2 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]])) {
        const cx = (t[0][0] + t[1][0] + t[2][0]) / 3, cy = (t[0][1] + t[1][1] + t[2][1]) / 3, dark = Math.random() < .6;
        facets.push({ t, cx, cy, dx: W / 2 - cx, dy: H / 2 - cy, th: Math.random() * Math.PI, phi: (35 + Math.random() * 45) * Math.PI / 180,
          rot: (Math.random() - .5) * .9, jx: (Math.random() - .5) * 12, jy: (Math.random() - .5) * 12, dark, sh: dark ? .25 + Math.random() * .45 : .12 + Math.random() * .35, z: Math.random() });
      }
    }
    facets.sort((p, q) => p.z - q.z);
    cv = el('canvas', { class: 'crumple-canvas' });
    const VW = innerWidth, VH = innerHeight; cv.width = Math.round(VW * dpr); cv.height = Math.round(VH * dpr);
    document.body.append(cv);
    node.style.visibility = 'hidden';
    const g = cv.getContext('2d');
    const t0 = performance.now(), spin = (Math.random() < .5 ? -1 : 1) * (.35 + Math.random() * .35);
    const ease = v => v < .5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
    await new Promise(done => {
      let finished = false; const end = () => { if (!finished) { finished = true; done(); } };
      const f = now => {
        if (finished) return;
        const p = Math.min(1, (now - t0) / dur);
        const k = out ? ease(p) : 1 - ease(p); // 0 = hoja lisa, 1 = bola de papel
        const fold = Math.min(1, k * 1.4), pull = Math.max(0, (k - .12) / .88), S = 1 - .55 * k;
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, VW, VH);
        g.globalAlpha = out ? (k > .9 ? 1 - (k - .9) / .1 : 1) : Math.min(1, .3 + p * 4);
        for (const fc of facets) {
          g.save();
          g.translate(r.left + W / 2, r.top + H / 2 + k * 50); g.rotate(spin * k); g.scale(S, S);
          g.translate(-W / 2 + fc.dx * .9 * pull + fc.jx * fold, -H / 2 + fc.dy * .9 * pull + fc.jy * fold);
          // pliegue: la faceta gira y se «acorta» en una dirección, como un papel doblado
          g.translate(fc.cx, fc.cy); g.rotate(fc.rot * fold); g.rotate(fc.th); g.scale(1, Math.max(.15, Math.cos(fc.phi * fold))); g.rotate(-fc.th);
          const sc = 1 - .45 * pull; g.scale(sc, sc); g.translate(-fc.cx, -fc.cy);
          g.beginPath(); g.moveTo(...fc.t[0]); g.lineTo(...fc.t[1]); g.lineTo(...fc.t[2]); g.closePath();
          g.save(); g.clip(); g.drawImage(paper, 0, 0, W, H);
          g.fillStyle = fc.dark ? `rgba(0,0,0,${(fc.sh * Math.min(1, k * 1.6)).toFixed(3)})` : `rgba(255,255,255,${(fc.sh * Math.min(1, k * 1.6)).toFixed(3)})`;
          g.fill(); g.restore();
          if (k > .02) { g.strokeStyle = `rgba(0,0,0,${(.18 * Math.min(1, k * 2)).toFixed(3)})`; g.lineWidth = .8; g.stroke(); }
          g.restore();
        }
        if (p < 1) requestAnimationFrame(f); else end();
      };
      requestAnimationFrame(f);
      setTimeout(end, dur + 1000); // protección: nunca se queda a medias
    });
  } catch (e) {
    console.warn('arrugado sencillo', e);
    // protección: si algo falla, un arrugado sencillo que funciona en todas partes
    node.style.visibility = '';
    const kf = [{ transform: 'scale(1) rotate(0)', opacity: 1 }, { transform: 'scale(.25) rotate(35deg)', opacity: 0 }];
    try { await node.animate(out ? kf : kf.slice().reverse(), { duration: 900, easing: 'ease-in-out', fill: out ? 'forwards' : 'none' }).finished; } catch {}
  } finally {
    cv?.remove();
    if (!out) node.style.visibility = '';
  }
}

async function showActivity(n, layer, simple = false) {
  const fig = figure();
  const content = (await withTimeout(loadDay(n), 7000)) || defaultDay(n); // sin conexión no se queda colgado
  const key = fig === 'arbol' ? 'act1' : 'act2';
  const over = null; // ya no hay actividades por persona: todos ven las del día
  const text = (over && over.trim()) || tx(content[key]);
  const note = el('div', { class: 'note activity-note', style: 'opacity:0' }); // invisible hasta que empieza la animación (sin parpadeos)
  setTimeout(() => { note.style.opacity = ''; note.style.visibility = ''; }, 4500); // pase lo que pase, la nota se ve
  applyPaper(note);
  const textBox = el('div', { class: 'activity-text rich' });
  const media = ((await withTimeout(store.getMedia(n), 6000)) || []).filter(m => m.act === key);
  const gal = gallery(media);
  const btn = el('button', { class: 'btn btn-finish no-delay', disabled: true }, t('finish'));
  const later = el('button', { class: 'btn btn-cancel no-delay' }, t('cancelLater'));
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
  // algunos días tienen una actividad especial interactiva (día 23: regalos; día 24: el regalo de Papá Noel)
  const sp = await import('./acts.js?v=17.15').then(m => m.special(n, key)).catch(() => null);
  if (!simple) await withTimeout(crumpleAnim(note, false), 3500);
  // la nota tiene que verse siempre, pase lo que pase con la animación
  clearCrumples(); note.style.visibility = ''; note.style.opacity = '';
  if (sp) {
    textBox.classList.add('act-special');
    note.querySelector('.activity-fig')?.remove(); note.querySelector('.activity-warn')?.remove();
    if (n === 24) btn.style.display = 'none'; // se termina con «Me lo quedo»
    sp(textBox).then(v => { btn.disabled = false; if (v === 'keep') btn.onclick(); }).catch(() => { btn.disabled = false; });
  } else {
    await Promise.race([typeRich(textBox, text, 24), decided]);
    btn.disabled = false;
  }
  const res = choice || await decided;
  if (res === 'done') {
    const stamp = S.answers[n]?.at || true;
    S.profile.actDone = { ...(S.profile.actDone || {}), [n]: stamp };
    store.saveProfile(S.user.uid, { actDone: { [n]: stamp } }).catch(e => console.warn(e));
  }
  // al terminar, el papel se vuelve a arrugar y se hace pequeño
  await crumpleAway(note);
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
  if (r === 'go') {
    await crumpleAway(note); const res = await runActivity(n, layer);
    if (res === 'done') fullView = true;
    if (res === 'done' && n === 25) { try { await (await import('./summary.js?v=17.15')).monthSummary(); } catch (e) { console.error(e); } }
  }
  creak(false); layer.classList.add('fade-out'); await sleep(700); layer.remove(); renderHome();
}

// ------------------------------------------------------------------ opciones del usuario
function openUserSettings() {
  const name = el('input', { type: 'text', value: S.profile.name || '' });
  const lang = el('select', {}, ...[['es', 'Español'], ['ca', 'Català'], ['en', 'English']].map(([v, l]) => el('option', { value: v, selected: v === getLang() }, l)));
  // estilo de las notas: se ven todos y se toca el que guste
  const paper = { value: S.profile.paper || 'nordico' };
  const paperGrid = el('div', { class: 'pick-grid papers' }, ...PAPERS.map(p => {
    const b = el('button', { type: 'button', class: 'pick-paper no-delay' + (p.id === paper.value ? ' on' : ''), onclick: () => {
      paper.value = p.id; [...paperGrid.children].forEach(x => x.classList.toggle('on', x === b));
    } }, el('div', { class: 'note-mini paper paper-' + p.id }, el('b', { class: 'note-day' }, '🎄 1'), el('p', {}, 'Ho, ho, ho!')), el('span', {}, p.name));
    return b;
  }));
  // temas: miniaturas del calendario
  const port = { value: currentTheme().id };
  const themeGrid = el('div', { class: 'pick-grid themes' }, ...PORTADAS.map(p => {
    const v = p.variants.find(x => /movil/.test(x.img)) || p.variants[0];
    const b = el('button', { type: 'button', class: 'pick-theme no-delay' + (p.id === port.value ? ' on' : ''), onclick: () => {
      port.value = p.id; [...themeGrid.children].forEach(x => x.classList.toggle('on', x === b));
    } }, el('img', { src: v.img, alt: '', loading: 'lazy' }), el('span', {}, p.name));
    return b;
  }));
  const box = el('div', { class: 'settings-form' },
    el('h2', {}, t('settings')),
    el('button', { type: 'button', class: 'hg-open no-delay', onclick: () => import('./help.js?v=17.15').then(m => m.openUserHelp()).catch(e => toast('⚠️ ' + e.message)) },
      el('span', { class: 'hg-open-ico' }, '📖'), el('span', {}, el('b', {}, t('guideBtn')), el('small', {}, t('guideSub')))),
    el('label', {}, t('name'), name), el('label', {}, t('language'), lang),
    el('div', { class: 'pick-label' }, t('paper')), paperGrid,
    el('div', { class: 'pick-label' }, t('portada')), themeGrid,
    accountSection());
  popup(box, { top: true, buttons: [{ label: t('cancel'), value: false, cls: 'btn-ghost' }, { label: t('save'), value: true }] }).then(async ok => {
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
    form,
    el('button', { type: 'button', class: 'btn btn-ghost small-btn acc-logout', onclick: () => { document.querySelector('.popup-back')?.remove(); store.signOut(); } }, '🚪 ' + t('logoutLong')));
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

// Vigilante: si la pantalla se queda oscurecida sin ninguna nota (algo se ha colgado), se vuelve al inicio solo
let emptySince = 0;
setInterval(() => {
  const layer = document.querySelector('.note-layer');
  const busyFx = document.querySelector('.sum-wrap, .mm-stage, .cine-wrap, .popup-back, .globe-wrap, .crumple-canvas, .scare, .unlock-msg');
  const visible = layer && [...layer.querySelectorAll('.note')].some(n => getComputedStyle(n).opacity !== '0' && getComputedStyle(n).visibility !== 'hidden');
  if (!layer || visible || busyFx) { emptySince = 0; return; }
  if (!emptySince) { emptySince = Date.now(); return; }
  if (Date.now() - emptySince > 9000) { emptySince = 0; layer.remove(); busy = false; clearCrumples(); renderHome(); }
}, 1500);

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
