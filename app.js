import { initStore, store, DEMO, nameKey, isPlayerEmail } from './store.js?v=20.3';
import { t, tx, setLang, getLang } from './i18n.js?v=20.3';
import { defaultDay, DEFAULT_CONFIG, PAPERS, PORTADAS, DEFAULT_PORTADA, MARQUEE_DEFAULT, MISSED_DEFAULT, SPLASH_DEFAULT } from './defaults.js?v=20.3';
import { creak, speak, unlockAudio, crumple as crumpleSound, chime, doorSound, hohoho, fanfare, wrong, sadTrombone, clickSound, christmasSong, audioOn, onAudioState } from './sound.js?v=20.3';
import { typeRich, gallery, lightbox } from './richact.js?v=20.3';
import { $, el, sleep, esc, confetti, typewriter, popup, toast } from './fx.js?v=20.3';

export const APP_VERSION = 'V20.3';
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
// 1 de diciembre a las 00:00 (hora de Madrid) del año del calendario
const decStart = () => Date.UTC(S.config.year, 11, 1, -1);
const decStarted = () => { const { y, m } = madridToday(); const Y = S.config.year; return y > Y || (y === Y && m === 12); };
function canOpen(n) {
  if (testMode()) return true; // modo prueba (solo la administradora)
  if (S.config?.openAll && !decStarted()) return true; // «abrir todas a todos»: solo antes de diciembre
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
  if (c && getLang() !== 'es') { try { return await (await import('./translate.js?v=20.3')).localizeDay(day, def, getLang()); } catch {} }
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
// el nombre ya lo tiene otra cuenta: popup bonito que pide cambiar el nombre (o, si es el suyo, volver a poner el PIN)
async function nameTaken(name, maybeMine) {
  const box = el('div', { class: 'nt' },
    el('div', { class: 'nt-deco' }, '❄ ✦ ❄'),
    el('h2', { class: 'nt-title' }, L3('Este nombre ya existe', 'Aquest nom ja existeix', 'This name already exists')),
    el('p', { class: 'nt-name' }, '«' + name + '»'),
    el('p', {}, L3('Ya hay alguien en el calendario con este nombre. Si eres otra persona, escribe un nombre diferente: por ejemplo, ponle un número, como ', 'Ja hi ha algú al calendari amb aquest nom. Si ets una altra persona, escriu un nom diferent: per exemple, posa-hi un número, com ', 'Someone in the calendar already has this name. If you are someone else, write a different name: for example, add a number, like '), el('b', {}, name + '2'), '.'),
    maybeMine ? el('p', { class: 'nt-small' }, L3('Si este nombre es el tuyo, es que el PIN no es correcto.', 'Si aquest nom és el teu, és que el PIN no és correcte.', 'If this name is yours, the PIN is not correct.')) : null);
  const r = await popup(box, { cls: 'small nt-pop', buttons: [
    ...(maybeMine ? [{ label: '🔑 ' + L3('Es el mío: repetir el PIN', 'És el meu: tornar a posar el PIN', 'It’s mine: retype the PIN'), value: 'pin', cls: 'btn-ghost' }] : []),
    { label: '✏️ ' + L3('Cambiar el nombre', 'Canviar el nom', 'Change the name'), value: 'name' }] });
  return { focus: r === 'pin' ? 'pin' : 'name' };
}
// la bienvenida de Elisabeth (botón «i» de la pantalla de la nieve)
const OWNER_MAIL = 'elialtarriba@gmail.com';
function welcomeInfo() {
  const T = {
    es: ['¡Bienvenidos!', 'Hola, soy Elisabeth. He preparado este Calendario de Adviento con muchísimo cariño, pensando en cada uno de vosotros.',
      'Cada día de diciembre se abrirá una ventanita con una sorpresa: un reto, un juego, una pregunta o un ratito de risas. Ojalá os traiga ilusión, buenos momentos juntos y un poquito de magia navideña cada día.',
      'Si tenéis cualquier duda, una idea o simplemente queréis decirme algo bonito, aquí me tenéis:', '¡Que disfrutéis mucho del calendario y Feliz Navidad!', 'Con todo mi cariño,'],
    ca: ['Benvinguts!', 'Hola, soc l’Elisabeth. He preparat aquest Calendari d’Advent amb moltíssima estima, pensant en cadascun de vosaltres.',
      'Cada dia de desembre s’obrirà una finestreta amb una sorpresa: un repte, un joc, una pregunta o una estona de riure. Tant de bo us porti il·lusió, bons moments junts i una mica de màgia nadalenca cada dia.',
      'Si teniu qualsevol dubte, una idea o simplement em voleu dir alguna cosa bonica, aquí em teniu:', 'Que gaudiu molt del calendari i Bon Nadal!', 'Amb tota la meva estima,'],
    en: ['Welcome!', 'Hello, I’m Elisabeth. I have prepared this Advent Calendar with lots of love, thinking of each one of you.',
      'Every day in December a little window will open with a surprise: a challenge, a game, a question or a moment of laughter. I hope it brings you excitement, good times together and a little Christmas magic every day.',
      'If you have any question, an idea, or simply want to tell me something nice, here I am:', 'Enjoy the calendar and Merry Christmas!', 'With all my love,'],
  }[getLang()] || null;
  const [h, p1, p2, p3, p4, sign] = T || [];
  const box = el('div', { class: 'wl' },
    el('img', { class: 'wl-fig', src: FIG_IMG.galleta, alt: '' }),
    el('h2', { class: 'wl-title' }, h), el('p', {}, p1), el('p', {}, p2), el('p', {}, p3),
    el('a', { class: 'wl-mail', href: 'mailto:' + OWNER_MAIL + '?subject=' + encodeURIComponent(t('appTitle')) }, '✉️ ' + OWNER_MAIL),
    el('p', { class: 'wl-end' }, p4), el('p', { class: 'wl-sign' }, sign, el('br'), el('b', {}, 'Elisabeth')));
  return popup(box, { cls: 'small wl-pop', outside: true, buttons: [{ label: L3('¡Gracias!', 'Gràcies!', 'Thank you!'), value: true }] });
}
function splash(enter = async () => null, sessP = Promise.resolve([])) {
  const cfg = splashCfg();
  if (cfg.show === false) return Promise.resolve(); // la pantalla de nieve sale siempre al abrir la app
  return new Promise(resolve => {
    const secs = Math.max(1, Math.min(30, +cfg.seconds || 5));
    const cv = el('canvas', { class: 'splash-snow' });
    const title = el('h1', { class: 'splash-title' }, tx(cfg.text) || tx(SPLASH_DEFAULT.text));
    const pic = el('div', { class: 'splash-pic' }, el('img', { src: 'arbol.png', alt: '' }));
    const msg = el('div', { class: 'splash-msg' }, pic, title);
    // solo se entra pulsando este botón
    const skip = el('button', { type: 'button', class: 'splash-start', disabled: true }, '🔔 ' + ({ es: 'Pulsa para empezar', ca: 'Prem per començar', en: 'Tap to start' }[getLang()] || 'Pulsa para empezar'));
    const hint = el('span');
    // primero el nombre (queda guardado en el móvil); el botón se activa cuando hay nombre
    let saved = ''; try { saved = localStorage.getItem('adv_who') || ''; } catch {}
    const nameIn = el('input', { type: 'text', class: 'splash-name', maxlength: 30, value: saved, autocomplete: 'given-name',
      placeholder: ({ es: 'Escribe tu nombre', ca: 'Escriu el teu nom', en: 'Write your name' }[getLang()] || 'Escribe tu nombre') });
    const nameErr = el('div', { class: 'splash-err' });
    // PIN de 4 números: la primera vez se lo inventa; después solo hace falta en otro aparato
    const pinIn = el('input', { type: 'password', class: 'splash-name splash-pin', inputmode: 'numeric', pattern: '[0-9]*', maxlength: 4, autocomplete: 'off',
      placeholder: L3('Tu PIN (4 números)', 'El teu PIN (4 números)', 'Your PIN (4 numbers)') });
    const pinHint = el('small', { class: 'splash-pin-hint' }, L3('¿Primera vez? Inventa 4 números y recuérdalos.', 'Primer cop? Inventa’t 4 números i recorda’ls.', 'First time? Make up 4 numbers and remember them.'));
    const pinWrap = el('div', { class: 'splash-pin-wrap' }, pinIn, pinHint);
    let known = saved ? [saved] : []; // nombres con los que este aparato ya ha entrado
    sessP.then(k => { known = k || []; upd(); }).catch(() => {});
    const needPin = () => !known.some(k => k && nameKey(k) === nameKey(nameIn.value));
    const upd = () => {
      const np = needPin(); pinWrap.classList.toggle('hide', !np);
      pinIn.value = pinIn.value.replace(/\D/g, '').slice(0, 4);
      skip.disabled = nameIn.value.trim().length < 2 || (np && pinIn.value.length !== 4); nameErr.textContent = '';
    };
    nameIn.addEventListener('input', upd); pinIn.addEventListener('input', upd); upd();
    [nameIn, pinIn].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter' && !skip.disabled) skip.click(); }));
    const adminLink = el('button', { type: 'button', class: 'splash-admin no-delay', onclick: () => { unlockAudio(); finish('admin'); } }, '🔑 ' + L3('Soy la administradora', 'Soc l’administradora', 'I am the admin'));
    const guideBtn = el('button', { type: 'button', class: 'splash-guide no-delay', onclick: () => { unlockAudio(); import('./help.js?v=20.3').then(m => m.openUserHelp(getLang())).catch(e => toast('⚠️ ' + e.message)); } },
      '📖 ' + L3('Cómo funciona', 'Com funciona', 'How it works'));
    const form = el('div', { class: 'splash-form' }, el('label', {}, '🎅 ' + ({ es: '¿Cómo te llamas?', ca: 'Com et dius?', en: 'What is your name?' }[getLang()] || '¿Cómo te llamas?')), nameIn, pinWrap, nameErr, skip, guideBtn, adminLink);
    // «i» en la esquina: bienvenida de Elisabeth y su correo
    const infoBtn = el('button', { type: 'button', class: 'splash-info no-delay', title: L3('Información', 'Informació', 'Information'), onclick: () => { unlockAudio(); welcomeInfo(); } }, 'i');
    msg.append(form); // todo en una columna centrada: árbol, título y la tarjeta del nombre
    const box = el('div', { class: 'splash' }, cv, msg, infoBtn, el('span', { class: 'splash-ver' }, APP_VERSION)); // la versión, discreta en una esquina
    document.body.append(box);
    // música desde el primer copo; el iPhone no deja sonar nada hasta que se toca la pantalla
    let music = null; try { music = christmasSong(); } catch {}
    const checkSound = () => { if (music?.playing) hint.classList.add('hide'); else hint.classList.add('show'); };
    setTimeout(checkSound, 600);
    box.addEventListener('pointerdown', e => {
      if (e.target.closest?.('.splash-form')) { unlockAudio(); return; }
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
      if (el_ >= secs && !shown) { shown = true; box.classList.add('show-msg'); }
      requestAnimationFrame(loop);
    })(t0);
    function finish(val) {
      if (done) return; done = true; removeEventListener('resize', size);
      box.classList.add('out'); setTimeout(() => { box.remove(); resolve(val); }, 700);
      setTimeout(() => music?.stop(4), 7000); // sigue sonando unos segundos con la portada abierta
    }
    skip.onclick = async () => {
      const name = nameIn.value.trim(); if (name.length < 2) return;
      unlockAudio(); if (!music?.playing) { try { music?.stop(0); music = christmasSong(); } catch {} }
      skip.disabled = true; skip.classList.add('go');
      const pin = needPin() ? pinIn.value : '';
      const errMsg = await enter({ name, pin }).catch(e => '⚠️ ' + (e.code || e.message));
      if (errMsg && typeof errMsg === 'object') { // el nombre ya existe: el popup ya ha preguntado qué hacer
        skip.classList.remove('go');
        if (errMsg.focus === 'pin') { pinIn.value = ''; upd(); pinIn.focus(); } else { nameIn.value = ''; pinIn.value = ''; upd(); nameIn.focus(); }
        return;
      }
      if (errMsg) {
        skip.classList.remove('go'); skip.disabled = false;
        nameErr.textContent = errMsg; (/PIN/.test(errMsg) ? pinIn : nameIn).focus();
        return;
      }
      try { localStorage.setItem('adv_who', name); } catch {}
      setTimeout(finish, 250);
    };
  });
}

async function boot() {
  setLang(localStorage.getItem('adv_lang') || 'es');
  const storeP = initStore().then(() => null, e => e);
  // nombres con los que este aparato ya está dentro (entonces no hace falta el PIN)
  const sessP = storeP.then(async e => {
    if (e) return [];
    const u = await store.authReady(); if (!u) return [];
    const p = await store.getProfile(u.uid).catch(() => null);
    let w = ''; try { w = localStorage.getItem('adv_who') || ''; } catch {}
    return [p?.name, p?.who, w].filter(Boolean);
  }).catch(() => []);
  let newPin = '';
  // todos entran por la nieve: los jugadores con nombre + PIN; la administradora, con su correo
  const mode = await splash(async ({ name, pin }) => {
    if (await storeP) return null; // sin conexión: el aviso sale después
    const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
    if (!pin) return null; // ya está dentro en este aparato con este nombre
    if (await store.authReady()) { try { (await import('./presence.js?v=20.3')).stopPresence(S); } catch {} await store.signOut(); }
    let r;
    try { r = await store.playerEnter(name, nameKey(name), pin, getLang()); }
    catch (er) {
      const c = String(er.code || er.message || '');
      return '⚠️ ' + (c.includes('too-many') ? L('Demasiados intentos. Espera un par de minutos y vuelve a probar.', 'Massa intents. Espera un parell de minuts i torna-ho a provar.', 'Too many tries. Wait a couple of minutes and try again.')
        : c.includes('network') ? L('No hay conexión a internet.', 'No hi ha connexió a internet.', 'No internet connection.') : c);
    }
    if (r === 'badpin' || r === 'taken') return nameTaken(name, r === 'badpin');
    if (r === 'badpin') return '❄ ' + L(`El nombre «${name}» ya está cogido, o ese PIN no es el suyo. Si eres tú, revisa tu PIN. Si eres otra persona, pon el nombre con un número, por ejemplo ${name}2.`, `El nom «${name}» ja està agafat, o aquest PIN no és el seu. Si ets tu, revisa el teu PIN. Si ets una altra persona, posa el nom amb un número, per exemple ${name}2.`, `The name “${name}” is already taken, or that PIN isn’t theirs. If it’s you, check your PIN. If you’re someone else, add a number to the name, for example ${name}2.`);
    if (r === 'taken') return '❄ ' + L(`El nombre «${name}» ya está cogido. Ponlo con un número, por ejemplo ${name}2.`, `El nom «${name}» ja està agafat. Posa’l amb un número, per exemple ${name}2.`, `The name “${name}” is already taken. Add a number, for example ${name}2.`);
    if (r === 'new') newPin = pin;
    return null;
  }, sessP);
  const wantAdmin = mode === 'admin';
  if (wantAdmin) { // si este aparato estaba dentro como jugador, se sale para entrar con el correo
    const u = await store.authReady().catch(() => null);
    if (u && isPlayerEmail(u.email)) await store.signOut().catch(() => {});
  }
  try { const e = await storeP; if (e) throw e; } catch (e) {
    app.innerHTML = `<div class="fatal">No se ha podido conectar con Firebase. Revisa js/firebase-config.js.<br><small>${esc(e.message)}</small></div>`; return;
  }
  store.onAuth(async u => {
    S.user = u;
    if (!u) { S.isAdmin = false; return wantAdmin ? renderLogin() : goStart(); } // sin cuenta: se vuelve a la nieve
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
    if (S.profile.player) { try { localStorage.setItem('adv_who', S.profile.name); } catch {} }
    await resetPractice(u.uid);
    renderHome();
    const afterPin = () => setTimeout(startPopups, 500);
    if (!newPin) afterPin();
    if (newPin) { const p = newPin; newPin = ''; setTimeout(() => popup(`<h2>🎄 ${esc(S.profile.name)}</h2><p style="font-size:18px">${L3('Tu PIN es', 'El teu PIN és', 'Your PIN is')}</p><p class="pin-show">${esc(p)}</p><p>${L3('Recuérdalo: lo necesitarás si entras desde otro móvil, tableta u ordenador.', 'Recorda’l: el necessitaràs si entres des d’un altre mòbil, tauleta o ordinador.', 'Remember it: you will need it on another phone, tablet or computer.')}</p>`, { buttons: [{ label: 'OK', value: true }] }).then(afterPin), 600); }
    import('./presence.js?v=20.3').then(m => m.startPresence(S)).catch(e => console.warn(e));
    import('./admin.js?v=20.3').catch(() => {});
    import('./surprise.js?v=20.3').then(m => m.showSurprise(u.uid)).catch(() => {});
  });
}

// al empezar diciembre, todo lo que se hizo antes (casillas abiertas para probar) se borra: se empieza de 0
async function resetPractice(uid) {
  const { y, m } = madridToday();
  if (!(y === S.config.year && m === 12)) return;
  const cut = decStart();
  // la tirada de la máquina y el «regalo abierto» hechos antes de diciembre tampoco cuentan
  const pf = {};
  if (S.profile.slot && (S.profile.slot.at || 0) < cut) { pf.slot = null; S.profile.slot = null; }
  if (S.profile.giftOpened && S.profile.giftOpened < cut) { pf.giftOpened = null; S.profile.giftOpened = null; }
  if (Object.keys(pf).length) await store.saveProfile(uid, pf).catch(e => console.warn(e));
  const old = Object.keys(S.answers).filter(d => (S.answers[d]?.at || 0) < cut);
  if (!old.length) return;
  const gone = [];
  for (const d of old) { try { await store.deleteAnswer(uid, d); delete S.answers[d]; gone.push(d); } catch (e) { console.warn('reset', d, e); } }
  if (!gone.length) return;
  const ad = { ...(S.profile.actDone || {}) }; gone.forEach(d => delete ad[d]);
  S.profile.actDone = ad; await store.setActDone(uid, ad).catch(e => console.warn(e));
  try { localStorage.removeItem('adv_prizes_' + uid); } catch {}
  if (S.card) { await store.deleteCard(uid).catch(() => {}); S.card = null; }
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
  const guideBtn = el('button', { type: 'button', class: 'btn btn-ghost login-guide no-delay', onclick: () => import('./help.js?v=20.3').then(m => m.openUserHelp(getLang())).catch(e => toast('⚠️ ' + e.message)) },
    '📖 ' + ({ es: 'Cómo funciona', ca: 'Com funciona', en: 'How it works' }[getLang()] || 'Cómo funciona'));
  const submit = async e => {
    e.preventDefault(); errBox.textContent = ''; unlockAudio();
    try {
      if (mode === 'login') await store.signIn(email.value.trim(), pw.value);
      else {
        if (!name.value.trim()) { name.focus(); return; }
        await store.signUp(email.value.trim(), pw.value, name.value.trim(), getLang());
      }
      try { localStorage.setItem('adv_pw_' + email.value.trim().toLowerCase(), pw.value); } catch {} // para verla con el ojo (solo en este aparato)
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
    el('button', { type: 'button', class: 'btn btn-ghost login-guide no-delay', onclick: goStart }, '❄️ ' + ({ es: 'Volver al inicio', ca: 'Tornar a l’inici', en: 'Back to the start' }[getLang()] || 'Volver al inicio')),
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
let fullView = false, boardObserver = null, stripObserver = null;
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
  if (text && getLang() !== 'es') import('./translate.js?v=20.3').then(m => m.tr(text, getLang())).then(x => { if (x) n.textContent = x; }).catch(() => {});
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
  try { const { jingle } = await import('./sound.js?v=20.3'); jingle(1); } catch {}
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
  const fig = figure();
  const rows = GOALS.map((g, i) => {
    const p = prizeState(g);
    const chip = { won: ['🏆', L3('¡Conseguido!', 'Aconseguit!', 'Won!')], lost: ['💔', L3('Se ha escapado', 'S’ha escapat', 'Missed')], play: ['🎁', L3('En juego', 'En joc', 'In play')] }[p.state];
    const left = Math.max(0, 3 - p.bad);
    const card = el('button', { class: 'pz-card ' + p.state, style: `--d:${i * .08}s`, onclick: () => prizeDetail(g) },
      el('div', { class: 'pz-num' }, el('small', {}, L3('casilla', 'casella', 'door')), el('b', {}, g)),
      el('div', { class: 'pz-body' },
        el('div', { class: 'pz-range' }, t('dayRange', g), el('span', { class: 'pz-chip' }, chip[0] + ' ' + chip[1])),
        prizeText(g) ? tEl('div', 'pz-prize', prizeText(g)) : null,
        el('div', { class: 'pz-stats' },
          el('span', { class: 'ok' }, '✅ ' + p.ok), el('span', { class: 'bad' }, '❌ ' + p.bad),
          p.state === 'play' ? el('span', { class: 'left' }, '🎯 ' + L3(`te quedan ${left} fallos`, `et queden ${left} errades`, `${left} misses left`)) : null)),
      el('span', { class: 'pz-go' }, '›'));
    if (p.state !== 'won') return card;
    return el('div', { class: 'pz-wrap' }, card,
      el('button', { class: 'prize-claim no-delay', onclick: () => revealPrize(g) }, el('img', { src: 'ilu-gr.webp', alt: '' }), el('span', {}, L3('Pulsa para conseguir el regalo', 'Prem per aconseguir el regal', 'Tap to get your present')), '✨'));
  });
  const box = el('div', { class: 'pz-sheet' },
    el('div', { class: 'pz-lights' }, ...Array.from({ length: 12 }, (_, i) => el('i', { style: `--i:${i}` }))),
    el('div', { class: 'pz-hero' },
      el('img', { class: 'pz-tree', src: 'ilu-arbolito.webp', alt: '' }),
      el('div', {}, el('h2', { class: 'pz-title' }, t('prizes')), el('p', { class: 'pz-sub' }, L3('¡Mira lo que puedes ganar!', 'Mira què pots guanyar!', 'See what you can win!')))),
    el('p', { class: 'pz-rules' }, t('prizeRules')),
    el('p', { class: 'pz-tap' }, '👆 ' + t('prizeTap')),
    el('div', { class: 'pz-list' }, ...rows));
  popup(box, { cls: 'pz-pop' });
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
export const goStart = () => { try { sessionStorage.removeItem('adv_splash_seen'); } catch {} location.reload(); }; // volver a la pantalla de nieve
// ---- cuenta atrás hasta el 1 de diciembre (en la portada, hasta que empieza el calendario)
let cdTimer = null;
function countdownSign(onZero = () => {}) {
  const target = decStart();
  const num = el('b', { class: 'cd-num' }), unit = el('span', { class: 'cd-unit' }), clock = el('div', { class: 'cd-clock' });
  const sign = el('div', { class: 'cd-sign' },
    el('div', { class: 'cd-lights' }, ...Array.from({ length: 13 }, (_, i) => el('i', { style: `--i:${i}` }))),
    el('div', { class: 'cd-row' }, el('span', { class: 'cd-pre' }, L3('Faltan', 'Falten', 'Only')), num, unit),
    el('div', { class: 'cd-txt' }, L3('para que empiece el Gran Calendario de Adviento', 'perquè comenci el Gran Calendari d’Advent', 'until the Great Advent Calendar begins')),
    clock,
    el('small', { class: 'cd-note' }, L3('Cada casilla se abre en su día, a partir del 1 de diciembre', 'Cada casella s’obre el seu dia, a partir de l’1 de desembre', 'Each door opens on its day, from 1 December')));
  const p2 = v => String(v).padStart(2, '0');
  const tick = () => {
    const ms = target - Date.now();
    if (ms <= 0) { clearInterval(cdTimer); cdTimer = null; onZero(sign); return; }
    const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
    if (d >= 1) { num.textContent = d; unit.textContent = d === 1 ? L3('día', 'dia', 'day') : L3('días', 'dies', 'days'); }
    else { num.textContent = h; unit.textContent = h === 1 ? L3('hora', 'hora', 'hour') : L3('horas', 'hores', 'hours'); }
    clock.replaceChildren(...[[d, L3('días', 'dies', 'days')], [h, L3('horas', 'hores', 'hours')], [m, L3('min', 'min', 'min')], [s, L3('seg', 'seg', 'sec')]]
      .map(([v, k]) => el('span', {}, el('b', {}, p2(v)), el('small', {}, k))));
  };
  tick(); cdTimer = setInterval(() => { if (!sign.isConnected) { clearInterval(cdTimer); cdTimer = null; return; } tick(); }, 1000);
  return sign;
}

// popup con la cuenta atrás (al entrar y con el botoncito ⏳)
function countdownPopup() {
  if (decStarted()) return celebrateStart();
  if (document.querySelector('.cd-pop')) return;
  let zero = false;
  const sign = countdownSign(() => { zero = true; document.querySelector('.cd-pop')?.closest('.popup-back')?.remove(); celebrateStart(); });
  return popup(el('div', { class: 'cd-popbox' }, sign), { cls: 'small cd-pop', outside: true, buttons: [{ label: '🎄 ' + L3('¡Al calendario!', 'Al calendari!', 'To the calendar!'), value: true }] })
    .then(() => { if (!zero) { clearInterval(cdTimer); cdTimer = null; } });
}
// al entrar: hasta el 1 de diciembre, la cuenta atrás; el primer día, la explosión de fuegos artificiales (una vez por aparato)
function startPopups() {
  // espera a que no haya otra ventana abierta (por ejemplo, la que pregunta el nombre)
  if (document.querySelector('.popup-back')) return setTimeout(startPopups, 700);
  if (!decStarted()) return countdownPopup();
  const { y, m } = madridToday();
  let seen = true; try { seen = !!localStorage.getItem('adv_started_' + S.config.year); } catch {}
  if (y === S.config.year && m === 12 && !seen) celebrateStart();
}
// ¡Empezamos! el letrero explota dulcemente, la pantalla se ilumina y hay fuegos artificiales
export function celebrateStart(test = false) {
  if (!test) try { localStorage.setItem('adv_started_' + S.config.year, '1'); } catch {}
  if (document.querySelector('.cd-boom')) return;
  const cv = el('canvas', { class: 'cd-fw' });
  const sign = el('div', { class: 'cd-sign cd-boom-sign' },
    el('div', { class: 'cd-lights' }, ...Array.from({ length: 13 }, (_, i) => el('i', { style: `--i:${i}` }))),
    el('div', { class: 'cd-row' }, el('b', { class: 'cd-num' }, '0'), el('span', { class: 'cd-unit' }, L3('días', 'dies', 'days'))),
    el('div', { class: 'cd-txt' }, L3('¡Empieza el Gran Calendario de Adviento!', 'Comença el Gran Calendari d’Advent!', 'The Great Advent Calendar begins!')));
  const msg = el('div', { class: 'cd-boom-msg' }, L3('¡A empezar!', 'A començar!', 'Let’s begin!'));
  const box = el('div', { class: 'cd-boom' }, el('div', { class: 'cd-flash' }), cv, sign, msg);
  document.body.append(box);
  try { unlockAudio(); fanfare(); } catch {}
  // fuegos artificiales
  const g = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1);
  const size = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); }; size();
  const COLS = ['#ffd24a', '#ff4d6d', '#4ade80', '#7dd3fc', '#ffffff', '#f2c14e', '#c084fc'];
  let parts = [];
  const burst = (x, y) => { const c = COLS[Math.floor(Math.random() * COLS.length)], n = 70 + Math.floor(Math.random() * 40);
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = 1.5 + Math.random() * 4.5; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c: Math.random() < .2 ? '#fff' : c }); } };
  const t0 = performance.now(); let lastB = 0, raf = 0;
  (function frame(t) {
    const el2 = t - t0;
    if (el2 > 1100 && el2 < 6500 && t - lastB > 380) { lastB = t; burst(innerWidth * (.15 + Math.random() * .7), innerHeight * (.12 + Math.random() * .45)); try { clickSound(); } catch {} }
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(0, 0, innerWidth, innerHeight);
    g.globalCompositeOperation = 'lighter';
    parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .05; p.vx *= .985; p.vy *= .985; p.life -= .012;
      g.globalAlpha = Math.max(0, p.life); g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, 2.2, 0, 7); g.fill(); });
    parts = parts.filter(p => p.life > 0); g.globalAlpha = 1;
    if (el2 < 8200) raf = requestAnimationFrame(frame);
  })(t0);
  setTimeout(() => { try { confetti(260); } catch {} }, 900);
  let mus = null; const mt = setTimeout(() => { try { mus = christmasSong(); } catch {} }, 1800);
  const close = () => { if (box.classList.contains('out')) return; clearTimeout(mt); try { mus?.stop(1.5); } catch {} cancelAnimationFrame(raf); box.classList.add('out'); setTimeout(() => { box.remove(); renderHome(); }, 900); };
  box.addEventListener('click', () => { if (performance.now() - t0 > 2500) close(); });
  setTimeout(close, 8600);
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
        el('span', { class: 'ver-tag' }, APP_VERSION),
        el('div', { class: 'top-actions' },
          el('button', { class: 'icon-btn', title: L3('Inicio', 'Inici', 'Start'), onclick: goStart }, '❄️'),
          sndBtn(),
          el('button', { class: 'icon-btn', title: t('settings'), onclick: openUserSettings }, '⚙️'),
          el('button', { class: 'icon-btn', title: t('admin'), onclick: async () => (await import('./admin.js?v=20.3')).openAdmin() }, '🔒')))));

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
  // botoncito discreto para volver a ver la cuenta atrás (hasta el 1 de diciembre)
  const cdFab = decStarted() ? null : el('button', { type: 'button', class: 'cd-fab no-delay', title: L3('Cuenta atrás', 'Compte enrere', 'Countdown'), onclick: () => countdownPopup() },
    '⏳', el('b', {}, String(Math.max(0, Math.floor((decStart() - Date.now()) / 864e5)))));
  app.replaceChildren(header, ...bars, ...(strip && !fullView ? [strip] : []), ...(marquee ? [marquee] : []), board, ...(strip && fullView ? [strip] : []), ...(exitBtn ? [exitBtn] : []), ...(cdFab ? [cdFab] : []));

  fitTitle(); document.fonts?.ready?.then(fitTitle);
  // en grande, la fila de figuras queda abajo y el calendario ocupa el resto
  stripObserver?.disconnect(); stripObserver = null;
  const setStripH = () => document.body.style.setProperty('--fv-strip', (fullView && strip ? strip.offsetHeight : 0) + 'px');
  if (fullView && strip) { stripObserver = new ResizeObserver(setStripH); stripObserver.observe(strip); }
  setStripH();
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
      class: 'door' + (done ? ' opened' : '') + (S.answers[d] && actPending(d) ? ' half' : '') + (canOpen(d) ? '' : ' closed-day') + (d === 25 ? ' d25' : ''), 'aria-label': t('dayN', d), 'data-day': d,
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
async function openDoor(n, door, mode = null) {
  if (busy || document.querySelector('.note-layer') || document.querySelector('.sum-wrap')) return; // nunca dos casillas a la vez
  unlockAudio();
  if (!canOpen(n)) { door.classList.add('shake'); setTimeout(() => door.classList.remove('shake'), 600); toast(t('locked', n)); return; }
  // día 25 ya hecho: siempre sale el resumen del mes, con «volver a jugar», «abrir la casilla desde el principio» o «hacer mi actividad»
  if (n === 25 && !mode && allDone25()) return day25Menu(); // solo cuando ya están hechas TODAS las casillas (del 1 al 25)
  mode25 = n === 25 ? mode : null;
  busy = true;
  if (actPending(n) && !mode) {
    door.classList.add('lighting'); hohoho(); await sleep(700); door.classList.add('opening'); await sleep(700);
    busy = false; return remindActivity(n);
  }
  const content = await loadDay(n);
  if (!content) { busy = false; toast(t('locked', n)); return; }
  // la luz se enciende dentro de la ventana y después se abre
  door.classList.add('lighting');
  hohoho(); // al abrir cualquier puerta: el «Ho, ho, ho, Merry Christmas» de Papá Noel
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
  note.append(el('div', { class: 'note-head' }, el('span', { class: 'note-day' }, t('dayN', n))), body, el('div', { class: 'note-foot' }, cancelBtn, finishBtn)); // «lo haré luego» siempre, en todas las casillas
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
  setTimeout(() => speak(t('welcome', n), getLang()), 4800); // después del ho, ho, ho (en el iPhone la voz corta el sonido)

  let closed = false;
  const ctx = {
    day: n, content, lang: getLang(), prev: mode ? null : (S.answers[n] || null), note, body, finishBtn,
    profile: S.profile, settings: S.settings, user: S.user, config: S.config,
    submit: async data => {
      if (S.answers[n]) return;
      const rec = { answer: data.answer ?? '', status: data.status || 'pending', extra: data.extra ?? null, at: Date.now() };
      S.answers[n] = { ...rec };
      try { await store.submitAnswer(S.user.uid, n, rec); } catch (e) { console.error(e); toast('⚠️ ' + e.message); }
      if (rec.status === 'correct') { fanfare(); checkPrize(); }
    },
    finish: (later = false) => { if (!closed) { closed = true; closeDay(n, layer, note, door, later); } },
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
  cancelBtn.onclick = () => { try { ctx.cleanup?.(); } catch {} document.querySelectorAll('.mm-stage, .pz3-peekbig').forEach(x => x.remove()); speechSynthesis?.cancel?.(); document.querySelectorAll('video').forEach(v => { try { v.pause(); } catch {} }); ctx.finish(true); }; // salir sin hacer la actividad: se podrá volver a entrar
  try {
    // juegos que se pueden repetir: se juegan de nuevo, pero la respuesta guardada (y los premios) no cambian
    if (ctx.prev && ['hats', 'reindeer', 'differences', 'memory', 'goodcheck'].includes(content.type)) { ctx.replay = true; ctx.prev = null; }
    if (ctx.prev && !['diploma', 'dance', 'pairs', 'roulette', 'puzzle', 'ttt', 'crossword', 'wordsearch', 'slidepuzzle', 'tree', 'ballsort', 'catch', 'simon', 'sudoku', 'maze'].includes(content.type)) renderSummary(body, ctx);
    else (await import(`./${content.type}.js?v=20.3`)).render(body, ctx);
  } catch (e) { console.error(e); body.append(el('p', {}, '⚠️ ' + e.message)); }
  // casilla 25: el regalo sorpresa abajo del todo (si el juego se vuelve a pintar, se vuelve a poner)
  if (n === 25) {
    try {
      const { giftButton } = await import('./gift.js?v=20.3');
      const gb = el('div', { class: 'gift-box25' }, giftButton());
      if (figure() === 'gnomo') { const { slotButton } = await import('./slot.js?v=20.3'); gb.append(slotButton()); }
      const keep = () => { if (!gb.isConnected && note.isConnected) body.append(gb); else if (gb !== body.lastElementChild && note.isConnected) body.append(gb); };
      body.append(gb); new MutationObserver(() => { if (body.lastElementChild !== gb) keep(); }).observe(body, { childList: true });
    } catch (e) { console.warn(e); }
  }
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

async function closeDay(n, layer, note, door, later = false) {
  fullView = true; // al salir de cualquier casilla: el calendario en grande (con la fila de figuras abajo)
  const fig = figure();
  const done = !!S.answers[n];
  speechSynthesis?.cancel?.();
  const fresh = n === 25 && mode25 === 'fresh'; mode25 = null;
  if (!later && fig !== 'galleta' && done && (actPending(n) || fresh)) {
    // la actividad sale siempre que esté pendiente (y solo una vez: la de tu figura)
    await crumpleAway(note);
    const res = await runActivity(n, layer);
    if (res === 'done') fullView = true; // al acabar: el calendario en grande
  }
  // día 25 con la foto hecha: final del calendario con la bola de nieve que cobra vida
  // al acabar el día 25: el resumen de todo el mes
  let next = null;
  if (!later && n === 25 && done) { try { next = await (await import('./summary.js?v=20.3')).monthSummary({ menu: menu25() }); fullView = true; } catch (e) { console.error(e); } }
  creak(false);
  layer.classList.add('fade-out');
  await sleep(700);
  layer.remove();
  renderHome();
  if (next) setTimeout(() => go25(next), 300);
}

// ---- día 25: menú del resumen del mes
let mode25 = null;
const allDone25 = () => Array.from({ length: 25 }, (_, i) => i + 1).every(d => S.answers[d] && !actPending(d));
const menu25 = () => (allDone25() ? { act: figure() !== 'galleta' } : null);
async function day25Menu() {
  let r = null;
  try { r = await (await import('./summary.js?v=20.3')).monthSummary({ menu: menu25() }); } catch (e) { console.error(e); }
  if (r) go25(r);
}
async function go25(r) {
  const door = document.querySelector('.door.d25');
  if (r === 'play' || r === 'fresh') { if (door) openDoor(25, door, r); return; }
  if (r === 'act') {
    const layer = el('div', { class: 'note-layer' }); document.body.append(layer);
    const res = await runActivity(25, layer);
    fullView = true; creak(false); layer.classList.add('fade-out'); await sleep(700); layer.remove(); renderHome();
    if (res === 'done') setTimeout(day25Menu, 300);
  }
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
  const sp = await import('./acts.js?v=20.3').then(m => m.special(n, key)).catch(() => null);
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
    const qz = content[key + 'Q']?.[getLang()] || content[key + 'Q']?.es;
    if (qz?.q && !choice) { await Promise.race([actQuiz(textBox, qz, n, key), decided]); }
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
// pregunta con 4 respuestas al final de la actividad: se elige una; la correcta brilla y crece, la incorrecta se encoge
function actQuiz(box, qz, n, key) {
  return new Promise(resolve => {
    const opts = qz.opts.map((o, i) => ({ o, i })).filter(x => x.o);
    const fb = el('div', { class: 'aq-fb' });
    const list = el('div', { class: 'aq-list' });
    const card = el('div', { class: 'aq-play' },
      el('div', { class: 'aq-garland' }, ...Array.from({ length: 9 }, (_, i) => el('i', { style: `--i:${i}` }))),
      el('p', { class: 'aq-question' }, qz.q), list, fb);
    let answered = false;
    opts.forEach(({ o, i }, k) => list.append(el('button', { type: 'button', class: 'aq-ans no-delay', style: `--k:${k}`, onclick: ev => {
      if (answered) return; answered = true;
      const b = ev.currentTarget, good = i === qz.ok;
      list.classList.add('done'); b.classList.add(good ? 'right' : 'wrong');
      if (good) {
        fanfare(); const r = b.getBoundingClientRect(); confetti(160, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
        fb.className = 'aq-fb show good'; fb.textContent = L3('¡Muy bien! ¡Has acertado! ¡Enhorabuena!', 'Molt bé! Ho has encertat! Enhorabona!', 'Well done! That’s right! Congratulations!');
      } else {
        sadTrombone();
        fb.className = 'aq-fb show bad'; fb.textContent = L3('¡Oh! No era esa… ¡Otra vez será!', 'Oh! No era aquesta… Una altra vegada serà!', 'Oh! That wasn’t it… Better luck next time!');
      }
      const res = { pick: i, ok: good, at: Date.now() };
      S.profile.actQuiz = { ...(S.profile.actQuiz || {}), [n]: res };
      store.saveProfile(S.user.uid, { actQuiz: { [n]: res } }).catch(e => console.warn(e));
      setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 200);
      setTimeout(resolve, 900);
    } }, el('span', { class: 'aq-ball' }), el('span', { class: 'aq-txt' }, o))));
    box.append(card);
    setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150);
  });
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
  // si el reto es un juego (no una pregunta), también se puede volver a jugar
  const game = defaultDay(n).type !== 'quiz' ? el('button', { class: 'btn btn-ghost remind-game no-delay' }, '🎮 ' + L3('Volver al juego del día', 'Tornar al joc del dia', 'Back to the day’s game')) : null;
  note.append(el('div', { class: 'note-head' }, el('span', { class: 'note-day' }, t('dayN', n))),
    el('div', { class: 'note-body activity-body' },
      el('div', { class: 'remind-deco' }, '🎄 ⭐ 🎁 ⭐ 🎄'),
      el('p', { class: 'activity-text' }, t('remindDone', n)),
      el('img', { class: 'activity-fig', src: FIG_IMG[fig], alt: '' }),
      el('p', { class: 'activity-text remind-small' }, t('remindAct', t(fig === 'arbol' ? 'activity1' : 'activity2'))),
      el('div', { class: 'remind-deco' }, '❄️ 🦌 🔔 🦌 ❄️')),
    game ? el('div', { class: 'remind-gamebox' }, game) : null,
    el('div', { class: 'note-foot' }, later, go));
  layer.append(note);
  note.animate([{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' });
  chime();
  const r = await new Promise(res => { go.onclick = () => res('go'); later.onclick = () => res('later'); if (game) game.onclick = () => res('game'); });
  if (r === 'game') {
    creak(false); layer.classList.add('fade-out'); await sleep(500); layer.remove(); renderHome();
    return setTimeout(() => { const d = document.querySelector(`.door[data-day="${n}"]`); if (d) openDoor(n, d, 'replay'); }, 250);
  }
  if (r === 'go') {
    await crumpleAway(note); const res = await runActivity(n, layer);
    if (res === 'done') fullView = true;
    if (res === 'done' && n === 25) { creak(false); layer.classList.add('fade-out'); await sleep(700); layer.remove(); renderHome(); return day25Menu(); }
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
    el('button', { type: 'button', class: 'hg-open no-delay', onclick: () => import('./help.js?v=20.3').then(m => m.openUserHelp()).catch(e => toast('⚠️ ' + e.message)) },
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

// jugadores: su nombre y su PIN (se puede ver y cambiar)
function pinSection() {
  const logout = el('button', { type: 'button', class: 'btn btn-ghost small-btn acc-logout', onclick: async () => { document.querySelector('.popup-back')?.remove(); try { (await import('./presence.js?v=20.3')).stopPresence(S); } catch {} store.signOut(); } }, '🚪 ' + t('logoutLong'));
  const pin = String(S.profile?.pin || '');
  const dots = el('b', { class: 'dots' }, '••••');
  const eye = el('button', { type: 'button', class: 'btn btn-ghost small-btn', onclick: () => { const h = dots.textContent === '••••'; dots.textContent = h ? (pin || '—') : '••••'; eye.textContent = h ? '🙈' : '👁️'; } }, '👁️');
  const mk = ph => el('input', { type: 'password', inputmode: 'numeric', pattern: '[0-9]*', maxlength: 4, placeholder: ph, autocomplete: 'off', oninput: e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4); } });
  const cur = mk(L3('PIN actual', 'PIN actual', 'Current PIN')), n1 = mk(L3('PIN nuevo', 'PIN nou', 'New PIN')), n2 = mk(L3('Repite el PIN nuevo', 'Repeteix el PIN nou', 'Repeat new PIN'));
  const form = el('div', { class: 'pw-change', style: 'display:none' }, cur, n1, n2,
    el('button', { type: 'button', class: 'btn small-btn', onclick: async () => {
      if (n1.value.length !== 4) return toast(L3('El PIN tiene que tener 4 números.', 'El PIN ha de tenir 4 números.', 'The PIN must have 4 numbers.'));
      if (n1.value !== n2.value) return toast(L3('Los dos PIN nuevos no son iguales.', 'Els dos PIN nous no són iguals.', 'The two new PINs are different.'));
      try { await store.changePin(cur.value, n1.value); S.profile.pin = n1.value; toast('🔐 ' + L3('PIN cambiado', 'PIN canviat', 'PIN changed')); document.querySelector('.popup-back')?.remove(); }
      catch (er) { const c = String(er.code || ''); toast(c.includes('wrong-password') || c.includes('invalid-credential') ? L3('El PIN actual no es correcto.', 'El PIN actual no és correcte.', 'The current PIN is wrong.') : '⚠️ ' + (er.code || er.message), 5000); }
    } }, '💾 ' + L3('Guardar PIN', 'Desar PIN', 'Save PIN')));
  return el('div', { class: 'account-box' },
    el('div', { class: 'acc-row' }, el('span', {}, '👤 ' + L3('Nombre', 'Nom', 'Name')), el('b', {}, S.profile?.name || '')),
    el('div', { class: 'acc-row' }, el('span', {}, '🔑 PIN'), dots, eye,
      el('button', { type: 'button', class: 'btn btn-ghost small-btn', onclick: () => { form.style.display = form.style.display === 'none' ? '' : 'none'; } }, L3('Cambiar', 'Canviar', 'Change'))),
    form, logout);
}

function accountSection() {
  if (isPlayerEmail(S.user?.email)) return pinSection();
  const cur = pwField(t('currentPw')), n1 = pwField(t('newPw')), n2 = pwField(t('repeatPw'));
  const form = el('div', { class: 'pw-change', style: 'display:none' }, cur.wrap, n1.wrap, n2.wrap,
    el('button', { type: 'button', class: 'btn small-btn', onclick: async () => {
      if (n1.input.value.length < 6) return toast(t('weakPw'));
      if (n1.input.value !== n2.input.value) return toast(t('pwMismatch'));
      try { await store.changePassword(cur.input.value, n1.input.value); try { localStorage.setItem('adv_pw_' + (S.user.email || '').toLowerCase(), n1.input.value); } catch {} toast('🔐 ' + t('pwChanged')); form.style.display = 'none'; [cur, n1, n2].forEach(f => f.input.value = ''); }
      catch (er) { const c = String(er.code || ''); toast(c.includes('wrong-password') || c.includes('invalid-credential') ? t('wrongCurrent') : c.includes('weak') ? t('weakPw') : '⚠️ ' + (er.code || er.message), 5000); }
    } }, '💾 ' + t('savePw')));
  return el('div', { class: 'account-box' },
    el('div', { class: 'acc-row' }, el('span', {}, '👤 ' + t('user')), el('b', {}, S.user.email)),
    el('div', { class: 'acc-row' }, el('span', {}, '🔑 ' + t('password')), el('b', { class: 'dots', title: t('pwHidden'), onclick: () => toast(t('pwHidden'), 6000) }, '•••••••• 👁️'),
      el('button', { type: 'button', class: 'btn btn-ghost small-btn', onclick: () => { form.style.display = form.style.display === 'none' ? '' : 'none'; } }, t('changePw'))),
    form,
    el('button', { type: 'button', class: 'btn btn-ghost small-btn acc-logout', onclick: async () => { document.querySelector('.popup-back')?.remove(); try { (await import('./presence.js?v=20.3')).stopPresence(S); } catch {} store.signOut(); } }, '🚪 ' + t('logoutLong')));
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
  const b = e.target.closest('.btn, .icon-btn, .q-opt, .prize-row2, .strip-score, .tb-btn, .adm-btn');
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
