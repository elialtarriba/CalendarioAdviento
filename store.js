// Capa de datos: usa Firebase si está configurado; si no, modo demo (localStorage).
import { firebaseConfig } from './firebase-config.js';

const SALT = 'calendario-adviento-v1:';
export async function hashPw(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(SALT + pw));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
// Apertura del día n: 1 de diciembre a las 00:00 hora de Madrid (UTC+1)
export const openAtMs = (year, n) => Date.UTC(year, 11, n, -1, 0, 0);

export const DEMO = !firebaseConfig.apiKey;
let api;

// ---------------------------------------------------------------- FIREBASE
async function firebaseApi() {
  const V = '10.12.2';
  const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
  const A = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`);
  const F = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`);
  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  const db = F.getFirestore(app);
  const d = (...p) => F.doc(db, ...p);
  const get = async (...p) => { const s = await F.getDoc(d(...p)); return s.exists() ? s.data() : null; };

  return {
    onAuth: cb => A.onAuthStateChanged(auth, u => cb(u ? { uid: u.uid, email: u.email } : null)),
    signIn: (e, p) => A.signInWithEmailAndPassword(auth, e, p),
    signUp: async (e, p, name, lang) => {
      const c = await A.createUserWithEmailAndPassword(auth, e, p);
      await F.setDoc(d('users', c.user.uid), { email: e, name, lang, paper: 'pergamino', portada: 'regalos', createdAt: Date.now() });
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
    submitAnswer: (uid, day, data) => F.setDoc(d('answers', uid, 'items', String(day)), { ...data, at: Date.now() }),
    setAnswerStatus: (uid, day, status) => F.setDoc(d('answers', uid, 'items', String(day)), { status, reviewedAt: Date.now() }, { merge: true }),

    // devuelve {locked:true} si aún no es el día, null si no hay contenido guardado
    getDay: async n => {
      try { const s = await F.getDoc(d('content', String(n))); return s.exists() ? s.data() : null; }
      catch (e) { if (e.code === 'permission-denied') return { locked: true }; throw e; }
    },
    saveDay: (n, data, year) => F.setDoc(d('content', String(n)), { ...data, openAt: F.Timestamp.fromMillis(openAtMs(year, n)) }),
    getConfig: () => get('config', 'public'),
    saveConfig: data => F.setDoc(d('config', 'public'), data, { merge: true }),

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
    getCard: async uid => (await get('cards', uid))?.img || null,
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
      const users = ld('users', {}); users[uid] = { email: e, name, lang, paper: 'pergamino', portada: 'regalos', createdAt: Date.now() }; sv('users', users);
      sv('session', { uid, email: e }); emit();
    },
    signOut: async () => { localStorage.removeItem(K + 'session'); emit(); },
    resetPassword: async () => {},
    // solo en modo demo: poner una contraseña nueva directamente (los datos están en este navegador)
    demoSetPassword: async (e, next) => {
      const accts = ld('accounts', {}); e = e.toLowerCase();
      if (!accts[e]) throw err('auth/user-not-found');
      if (next.length < 6) throw err('auth/weak-password');
      accts[e].pw = await hashPw(next); sv('accounts', accts);
    },
    changePassword: async (current, next) => {
      const s = cur(); const accts = ld('accounts', {}); const a = accts[s.email];
      if (!a || a.pw !== await hashPw(current)) throw err('auth/wrong-password');
      if (next.length < 6) throw err('auth/weak-password');
      a.pw = await hashPw(next); sv('accounts', accts);
    },
    getProfile: async uid => ld('users', {})[uid] || null,
    saveProfile: async (uid, data) => { const u = ld('users', {}); u[uid] = { ...(u[uid] || {}), ...data }; sv('users', u); },
    getSettings: async uid => ld('settings', {})[uid] || null,
    setSettings: async (uid, data) => { const s = ld('settings', {}); s[uid] = { ...(s[uid] || {}), ...data }; sv('settings', s); },
    getAnswers: async uid => ld('answers', {})[uid] || {},
    submitAnswer: async (uid, day, data) => { const a = ld('answers', {}); a[uid] = a[uid] || {}; a[uid][day] = { ...data, at: Date.now() }; sv('answers', a); },
    setAnswerStatus: async (uid, day, status) => { const a = ld('answers', {}); a[uid] = a[uid] || {}; a[uid][day] = { ...(a[uid][day] || {}), status, reviewedAt: Date.now() }; sv('answers', a); },
    getDay: async n => ld('content', {})[n] || null,
    saveDay: async (n, data) => { const c = ld('content', {}); c[n] = data; sv('content', c); },
    getConfig: async () => ld('config', null),
    saveConfig: async data => sv('config', { ...ld('config', {}), ...data }),
    adminSetup: async (uid, pw) => { sv('adminHash', await hashPw(pw)); sv('config', { ...ld('config', {}), adminConfigured: true }); },
    adminLogin: async (uid, pw) => ld('adminHash', null) === await hashPw(pw),
    adminChangePw: async (uid, pw) => sv('adminHash', await hashPw(pw)),
    listUsers: async () => Object.entries(ld('users', {})).map(([uid, u]) => ({ uid, ...u })),
    saveCard: async (uid, img) => { const c = ld('cards', {}); c[uid] = img; sv('cards', c); },
    getCard: async uid => ld('cards', {})[uid] || null,
  };
}

export async function initStore() {
  api = DEMO ? demoApi() : await firebaseApi();
  return api;
}
export const store = new Proxy({}, { get: (_, k) => (...a) => api[k](...a) });
