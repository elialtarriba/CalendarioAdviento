// Capa de datos: usa Firebase si está configurado; si no, modo demo (localStorage).
import { firebaseConfig } from './firebase-config.js?v=18.8';

const SALT = 'calendario-adviento-v1:';
export async function hashPw(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(SALT + pw));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
// Apertura del día n: 1 de diciembre a las 00:00 hora de Madrid (UTC+1)
export const openAtMs = (year, n) => Date.UTC(year, 11, n, -1, 0, 0);

export const DEMO = !firebaseConfig.apiKey;

// Jugadores: entran con su nombre y un PIN de 4 números (sin correo). Por dentro es una cuenta
// con un correo inventado a partir del nombre (no se le manda nunca nada) y el PIN como contraseña.
export const nameKey = n => String(n || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').replace(/[\/.#$\[\]]/g, '');
export const PLAYER_DOMAIN = '@jugadores.example.com';
export const playerEmail = key => (key.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'jugador') + PLAYER_DOMAIN;
export const playerPw = pin => 'Adv-' + pin + '-nadal';
export const isPlayerEmail = e => String(e || '').toLowerCase().endsWith(PLAYER_DOMAIN);
let api;

// ---------------------------------------------------------------- FIREBASE
async function firebaseApi() {
  const V = '10.12.2';
  const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
  const A = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`);
  const F = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`);
  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  const db = F.initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  const d = (...p) => F.doc(db, ...p);
  const get = async (...p) => { const s = await F.getDoc(d(...p)); return s.exists() ? s.data() : null; };

  return {
    onAuth: cb => A.onAuthStateChanged(auth, u => cb(u ? { uid: u.uid, email: u.email } : null)),
    authReady: async () => { try { await auth.authStateReady(); } catch {} return auth.currentUser ? { uid: auth.currentUser.uid, email: auth.currentUser.email } : null; },
    // entra con nombre + PIN: si el nombre es nuevo, crea su cuenta con ese PIN
    // devuelve 'in' (ya existía), 'new' (cuenta nueva), 'badpin' (PIN incorrecto) o 'taken' (el nombre es de otra cuenta)
    playerEnter: async (name, key, pin, lang) => {
      const e = playerEmail(key), p = playerPw(pin);
      try { await A.signInWithEmailAndPassword(auth, e, p); return 'in'; }
      catch (er) { if (!/invalid-credential|user-not-found|wrong-password|invalid-login|invalid-password/.test(er.code || '')) throw er; }
      let c;
      try { c = await A.createUserWithEmailAndPassword(auth, e, p); }
      catch (er) { if (/email-already-in-use/.test(er.code || '')) return 'badpin'; throw er; }
      const nm = await get('names', key).catch(() => null);
      if (nm && nm.uid !== c.user.uid) { try { await A.deleteUser(c.user); } catch { await A.signOut(auth); } return 'taken'; }
      await F.setDoc(d('names', key), { uid: c.user.uid, name, at: Date.now() }).catch(() => {});
      await F.setDoc(d('users', c.user.uid), { email: e, name, who: name, pin, player: true, lang, paper: 'nordico', portada: 'regalos', createdAt: Date.now() });
      return 'new';
    },
    changePin: async (oldPin, newPin) => {
      const u = auth.currentUser;
      await A.reauthenticateWithCredential(u, A.EmailAuthProvider.credential(u.email, playerPw(oldPin)));
      await A.updatePassword(u, playerPw(newPin));
      await F.setDoc(d('users', u.uid), { pin: newPin, pinPrev: oldPin, pinChangedAt: Date.now() }, { merge: true });
    },
    signIn: (e, p) => A.signInWithEmailAndPassword(auth, e, p),
    signUp: async (e, p, name, lang) => {
      const c = await A.createUserWithEmailAndPassword(auth, e, p);
      await F.setDoc(d('users', c.user.uid), { email: e, name, lang, paper: 'nordico', portada: 'regalos', createdAt: Date.now() });
    },
    signOut: () => A.signOut(auth),
    resetPassword: e => { auth.languageCode = document.documentElement.lang || 'es'; return A.sendPasswordResetEmail(auth, e); },
    changePassword: async (current, next) => {
      const u = auth.currentUser;
      await A.reauthenticateWithCredential(u, A.EmailAuthProvider.credential(u.email, current));
      await A.updatePassword(u, next);
    },

    getProfile: uid => get('users', uid),
    saveProfile: (uid, data) => F.setDoc(d('users', uid), data, { merge: true }),
    getSettings: uid => get('settings', uid),
    setSettings: (uid, data) => F.setDoc(d('settings', uid), data),

    getAnswers: async uid => {
      const qs = await F.getDocs(F.collection(db, 'answers', uid, 'items'));
      const out = {}; qs.forEach(s => out[s.id] = s.data()); return out;
    },
    submitAnswer: (uid, day, data) => F.setDoc(d('answers', uid, 'items', String(day)), { ...data, at: data.at || Date.now() }),
    deleteAnswer: (uid, day) => F.deleteDoc(d('answers', uid, 'items', String(day))),
    setAnswerStatus: (uid, day, status) => F.setDoc(d('answers', uid, 'items', String(day)), { status, reviewedAt: Date.now() }, { merge: true }),

    // devuelve {locked:true} si aún no es el día, null si no hay contenido guardado
    getDay: async n => {
      try { const s = await F.getDoc(d('content', String(n))); return s.exists() ? s.data() : null; }
      catch (e) { if (e.code === 'permission-denied') return { locked: true }; throw e; }
    },
    saveDay: (n, data, year) => F.setDoc(d('content', String(n)), { ...data, openAt: F.Timestamp.fromMillis(openAtMs(year, n)) }),
    // fotos y vídeos de las actividades: content/{día}/media/{id}
    getMedia: async n => {
      try { const qs = await F.getDocs(F.collection(db, 'content', String(n), 'media')); const out = []; qs.forEach(x => out.push({ id: x.id, ...x.data() })); return out.sort((a, b) => (a.order || 0) - (b.order || 0)); }
      catch (e) { return []; }
    },
    addMedia: async (n, item) => { const r = F.doc(F.collection(db, 'content', String(n), 'media')); await F.setDoc(r, item); return r.id; },
    deleteMedia: (n, id) => F.deleteDoc(d('content', String(n), 'media', id)),
    getConfig: () => get('config', 'public'),
    saveConfig: data => F.setDoc(d('config', 'public'), data, { merge: true }),
    // quién está dentro de la app (para la administradora principal)
    presencePing: (uid, data) => F.setDoc(d('presence', uid), data, { merge: true }),
    watchPresence: (uid, cb) => F.onSnapshot(d('presence', uid), s => cb(s.exists() ? s.data() : null), () => {}),
    listPresence: async () => { const qs = await F.getDocs(F.collection(db, 'presence')); const out = []; qs.forEach(x => out.push({ uid: x.id, ...x.data() })); return out; },
    kickUser: uid => F.setDoc(d('presence', uid), { kick: true, kickAt: Date.now() }, { merge: true }),
    // nombres únicos: names/{nombre en minúsculas} = { uid, name }
    getName: key => get('names', key),
    claimName: (key, uid, name) => F.setDoc(d('names', key), { uid, name, at: Date.now() }),
    releaseName: key => F.deleteDoc(d('names', key)),
    // foto de cada premio (una por figura y casilla), en su propio documento para no llenar config/public
    getPrizePhoto: async (fig, g) => { try { const x = await get('config', `prize-${fig}-${g}`); return x?.src || ''; } catch { return ''; } },
    savePrizePhoto: (fig, g, src) => F.setDoc(d('config', `prize-${fig}-${g}`), { src: src || '' }),

    adminSetup: async (uid, pw) => {
      const h = await hashPw(pw);
      const b = F.writeBatch(db);
      b.set(d('adminSecret', 'main'), { hash: h });
      b.set(d('admins', uid), { key: h, at: Date.now() });
      await b.commit();
      await F.setDoc(d('config', 'public'), { adminConfigured: true }, { merge: true });
    },
    adminLogin: async (uid, pw) => {
      const h = await hashPw(pw);
      try { await F.setDoc(d('admins', uid), { key: h, at: Date.now() }); return true; }
      catch (e) { return false; }
    },
    // la dueña (su correo) puede poner una contraseña nueva si la olvida
    adminOwnerReset: async (uid, pw) => {
      const h = await hashPw(pw);
      const b = F.writeBatch(db);
      b.set(d('adminSecret', 'main'), { hash: h });
      b.set(d('admins', uid), { key: h, at: Date.now() });
      await b.commit();
    },
    adminChangePw: async (uid, pw) => {
      const h = await hashPw(pw);
      const b = F.writeBatch(db);
      b.set(d('adminSecret', 'main'), { hash: h });
      b.set(d('admins', uid), { key: h, at: Date.now() });
      await b.commit();
    },
    listUsers: async () => {
      const qs = await F.getDocs(F.collection(db, 'users'));
      const out = []; qs.forEach(s => out.push({ uid: s.id, ...s.data() })); return out;
    },
    saveCard: (uid, img) => F.setDoc(d('cards', uid), { img, at: Date.now() }),
    deleteCard: uid => F.deleteDoc(d('cards', uid)),
    setActDone: (uid, actDone) => F.updateDoc(d('users', uid), { actDone }),
    getCard: async uid => (await get('cards', uid))?.img || null,
    // mensajes sorpresa: surprises/{uid}/msgs/{id} con { active, dates: ['AAAA-MM-DD', …], … }
    getSurprise: async (uid, date) => {
      const qs = await F.getDocs(F.query(F.collection(db, 'surprises', uid, 'msgs'), F.where('dates', 'array-contains', date)));
      const out = []; qs.forEach(x => out.push(x.data()));
      return out.filter(m => m.active !== false).sort((a, b) => (b.at || 0) - (a.at || 0))[0] || null;
    },
    listSurprises: async uid => {
      const qs = await F.getDocs(F.collection(db, 'surprises', uid, 'msgs'));
      const out = []; qs.forEach(x => out.push({ id: x.id, ...x.data() })); return out.sort((a, b) => (a.dates?.[0] || '9').localeCompare(b.dates?.[0] || '9'));
    },
    saveSurprise: async (uid, id, data) => { const r = id ? d('surprises', uid, 'msgs', id) : F.doc(F.collection(db, 'surprises', uid, 'msgs')); await F.setDoc(r, { ...data, at: Date.now() }); return r.id; },
    setSurpriseActive: (uid, id, active) => F.updateDoc(d('surprises', uid, 'msgs', id), { active }),
    deleteSurprise: (uid, id) => F.deleteDoc(d('surprises', uid, 'msgs', id)),
  };
}

// ---------------------------------------------------------------- DEMO
function demoApi() {
  const K = 'adv_demo_';
  const ld = (k, def) => { try { return JSON.parse(localStorage.getItem(K + k)) ?? def; } catch { return def; } };
  const sv = (k, v) => { try { localStorage.setItem(K + k, JSON.stringify(v)); } catch (e) { console.warn(e); } };
  let listener = null;
  const cur = () => ld('session', null);
  const emit = () => listener && listener(cur());
  const err = code => Object.assign(new Error(code), { code });
  return {
    onAuth: cb => { listener = cb; setTimeout(emit, 0); },
    authReady: async () => { const c = cur(); return c ? { uid: c.uid, email: c.email } : null; },
    playerEnter: async (name, key, pin, lang) => {
      const e = playerEmail(key), accts = ld('accounts', {}), a = accts[e];
      if (a) { if (a.pw !== await hashPw(playerPw(pin))) return 'badpin'; sv('session', { uid: a.uid, email: e }); return 'in'; }
      const nm = ld('names', {})[key];
      if (nm) return 'taken';
      const uid = 'u' + Math.random().toString(36).slice(2, 10);
      accts[e] = { uid, pw: await hashPw(playerPw(pin)) }; sv('accounts', accts);
      const users = ld('users', {}); users[uid] = { email: e, name, who: name, pin, player: true, lang, paper: 'nordico', portada: 'regalos', createdAt: Date.now() }; sv('users', users);
      const n = ld('names', {}); n[key] = { uid, name, at: Date.now() }; sv('names', n);
      sv('session', { uid, email: e }); return 'new';
    },
    changePin: async (oldPin, newPin) => {
      const s = cur(); const accts = ld('accounts', {}); const a = accts[s.email];
      if (!a || a.pw !== await hashPw(playerPw(oldPin))) throw err('auth/wrong-password');
      a.pw = await hashPw(playerPw(newPin)); sv('accounts', accts);
      const u = ld('users', {}); u[s.uid] = { ...(u[s.uid] || {}), pin: newPin, pinPrev: oldPin, pinChangedAt: Date.now() }; sv('users', u);
    },
    signIn: async (e, p) => {
      const accts = ld('accounts', {}); const a = accts[e.toLowerCase()];
      if (!a || a.pw !== await hashPw(p)) throw err('auth/invalid-credential');
      sv('session', { uid: a.uid, email: e.toLowerCase() }); emit();
    },
    signUp: async (e, p, name, lang) => {
      if (p.length < 6) throw err('auth/weak-password');
      const accts = ld('accounts', {}); e = e.toLowerCase();
      if (accts[e]) throw err('auth/email-already-in-use');
      const uid = 'u' + Math.random().toString(36).slice(2, 10);
      accts[e] = { uid, pw: await hashPw(p) }; sv('accounts', accts);
      const users = ld('users', {}); users[uid] = { email: e, name, lang, paper: 'nordico', portada: 'regalos', createdAt: Date.now() }; sv('users', users);
      sv('session', { uid, email: e }); emit();
    },
    signOut: async () => { localStorage.removeItem(K + 'session'); emit(); },
    resetPassword: async () => {},
    demoWipe: () => Object.keys(localStorage).filter(k => k.startsWith(K)).forEach(k => localStorage.removeItem(k)),
    // solo en modo demo: poner una contraseña nueva directamente (los datos están en este navegador)
    demoSetPassword: async (e, next) => {
      const accts = ld('accounts', {}); e = e.toLowerCase();
      if (next.length < 6) throw err('auth/weak-password');
      if (!accts[e]) { // la cuenta no existe en este navegador: se crea
        const uid = 'u' + Math.random().toString(36).slice(2, 10);
        accts[e] = { uid }; const users = ld('users', {});
        users[uid] = { email: e, name: e.split('@')[0], lang: 'es', paper: 'nordico', portada: 'regalos', createdAt: Date.now() }; sv('users', users);
      }
      accts[e].pw = await hashPw(next); sv('accounts', accts);
      return true;
    },
    changePassword: async (current, next) => {
      const s = cur(); const accts = ld('accounts', {}); const a = accts[s.email];
      if (!a || a.pw !== await hashPw(current)) throw err('auth/wrong-password');
      if (next.length < 6) throw err('auth/weak-password');
      a.pw = await hashPw(next); sv('accounts', accts);
    },
    getProfile: async uid => ld('users', {})[uid] || null,
    deleteCard: async uid => { const c = ld('cards', {}); delete c[uid]; sv('cards', c); },
    setActDone: async (uid, actDone) => { const u = ld('users', {}); u[uid] = { ...(u[uid] || {}), actDone }; sv('users', u); },
    saveProfile: async (uid, data) => { const u = ld('users', {}); u[uid] = { ...(u[uid] || {}), ...data }; sv('users', u); },
    getSettings: async uid => ld('settings', {})[uid] || null,
    setSettings: async (uid, data) => { const s = ld('settings', {}); s[uid] = { ...(s[uid] || {}), ...data }; sv('settings', s); },
    getAnswers: async uid => ld('answers', {})[uid] || {},
    submitAnswer: async (uid, day, data) => { const a = ld('answers', {}); a[uid] = a[uid] || {}; a[uid][day] = { ...data, at: data.at || Date.now() }; sv('answers', a); },
    deleteAnswer: async (uid, day) => { const a = ld('answers', {}); if (a[uid]) delete a[uid][day]; sv('answers', a); },
    setAnswerStatus: async (uid, day, status) => { const a = ld('answers', {}); a[uid] = a[uid] || {}; a[uid][day] = { ...(a[uid][day] || {}), status, reviewedAt: Date.now() }; sv('answers', a); },
    getDay: async n => ld('content', {})[n] || null,
    saveDay: async (n, data) => { const c = ld('content', {}); c[n] = data; sv('content', c); },
    getMedia: async n => (ld('media', {})[n] || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0)),
    addMedia: async (n, item) => { const m = ld('media', {}); const id = 'm' + Date.now() + Math.random().toString(36).slice(2, 6); (m[n] = m[n] || []).push({ id, ...item }); sv('media', m); return id; },
    deleteMedia: async (n, id) => { const m = ld('media', {}); m[n] = (m[n] || []).filter(x => x.id !== id); sv('media', m); },
    getConfig: async () => ld('config', null),
    saveConfig: async data => sv('config', { ...ld('config', {}), ...data }),
    presencePing: async (uid, data) => { const p = ld('presence', {}); p[uid] = { ...(p[uid] || {}), ...data }; sv('presence', p); },
    watchPresence: (uid, cb) => { const iv = setInterval(() => cb(ld('presence', {})[uid] || null), 3000); return () => clearInterval(iv); },
    listPresence: async () => Object.entries(ld('presence', {})).map(([uid, v]) => ({ uid, ...v })),
    getName: async key => ld('names', {})[key] || null,
    claimName: async (key, uid, name) => { const n = ld('names', {}); n[key] = { uid, name, at: Date.now() }; sv('names', n); },
    releaseName: async key => { const n = ld('names', {}); delete n[key]; sv('names', n); },
    kickUser: async uid => { const p = ld('presence', {}); p[uid] = { ...(p[uid] || {}), kick: true, kickAt: Date.now() }; sv('presence', p); },
    getPrizePhoto: async (fig, g) => ld('prizePhotos', {})[`${fig}-${g}`] || '',
    savePrizePhoto: async (fig, g, src) => { const p = ld('prizePhotos', {}); p[`${fig}-${g}`] = src || ''; sv('prizePhotos', p); },
    adminSetup: async (uid, pw) => { sv('adminHash', await hashPw(pw)); sv('config', { ...ld('config', {}), adminConfigured: true }); },
    adminLogin: async (uid, pw) => ld('adminHash', null) === await hashPw(pw),
    adminChangePw: async (uid, pw) => sv('adminHash', await hashPw(pw)),
    adminOwnerReset: async (uid, pw) => sv('adminHash', await hashPw(pw)),
    listUsers: async () => Object.entries(ld('users', {})).map(([uid, u]) => ({ uid, ...u })),
    saveCard: async (uid, img) => { const c = ld('cards', {}); c[uid] = img; sv('cards', c); },
    getCard: async uid => ld('cards', {})[uid] || null,
    getSurprise: async (uid, date) => Object.values(ld('surprises', {})[uid] || {}).filter(m => m.active !== false && (m.dates || []).includes(date)).sort((a, b) => (b.at || 0) - (a.at || 0))[0] || null,
    listSurprises: async uid => Object.entries(ld('surprises', {})[uid] || {}).map(([id, v]) => ({ id, ...v })).sort((a, b) => (a.dates?.[0] || '9').localeCompare(b.dates?.[0] || '9')),
    saveSurprise: async (uid, id, data) => { const s = ld('surprises', {}); id = id || 's' + Date.now() + Math.random().toString(36).slice(2, 6); (s[uid] = s[uid] || {})[id] = { ...data, at: Date.now() }; sv('surprises', s); return id; },
    setSurpriseActive: async (uid, id, active) => { const s = ld('surprises', {}); if (s[uid]?.[id]) s[uid][id].active = active; sv('surprises', s); },
    deleteSurprise: async (uid, id) => { const s = ld('surprises', {}); if (s[uid]) delete s[uid][id]; sv('surprises', s); },
  };
}

export async function initStore() {
  api = DEMO ? demoApi() : await firebaseApi();
  return api;
}
export const store = new Proxy({}, { get: (_, k) => (...a) => api[k](...a) });
