// Quién está dentro de la app ahora mismo. Cada móvil avisa cada minuto (con el nombre que se escribe
// en la pantalla de la nieve). La administradora principal ve la lista y puede echar a alguien.
import { el, popup, toast } from './fx.js?v=18.4';
import { getLang } from './i18n.js?v=18.4';
import { store } from './store.js?v=18.4';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
export const OWNER = 'elialtarriba@gmail.com';
export const whoName = () => { try { return (localStorage.getItem('adv_who') || '').trim(); } catch { return ''; } };
const device = () => {
  const u = navigator.userAgent;
  return /iPad/.test(u) ? 'iPad' : /iPhone/.test(u) ? 'iPhone' : /Android/.test(u) ? 'Android' : /Mac/.test(u) ? 'Mac' : /Windows/.test(u) ? 'Windows' : 'Navegador';
};

// el nombre no se puede repetir: queda guardado a nombre de su cuenta (y en el móvil, para no volver a escribirlo)
export const keyOf = n => n.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').replace(/[\/.#$\[\]]/g, '');
async function askName(msg, def = '') {
  const inp = el('input', { type: 'text', value: def, maxlength: 30, placeholder: L('Tu nombre', 'El teu nom', 'Your name'), class: 'pr-name-in' });
  const box = el('div', { class: 'pr-ask' }, el('h2', {}, '🎄 ' + L('¿Cómo te llamas?', 'Com et dius?', 'What is your name?')), el('p', {}, msg), inp);
  setTimeout(() => inp.focus(), 300);
  while (true) {
    await popup(box, { cls: 'small', buttons: [{ label: L('Guardar', 'Desar', 'Save'), value: true }] });
    if (inp.value.trim().length >= 2) return inp.value.trim();
  }
}
export async function ensureName(S) {
  const uid = S.user.uid;
  let name = whoName(), msg = L('Escribe tu nombre. Así sabremos quién está en el calendario.', 'Escriu el teu nom. Així sabrem qui hi ha al calendari.', 'Write your name so we know who is in the calendar.');
  for (let i = 0; i < 6; i++) {
    if (!name) name = await askName(msg);
    const key = keyOf(name);
    try {
      const cur = await store.getName(key);
      if (cur && cur.uid !== uid) { msg = L(`El nombre «${name}» ya lo tiene otra persona. Escribe otro (por ejemplo, con tu apellido).`, `El nom «${name}» ja el té una altra persona. Escriu-ne un altre (per exemple, amb el cognom).`, `The name “${name}” is already taken. Write another one (for example with your surname).`); name = ''; try { localStorage.removeItem('adv_who'); } catch {} continue; }
      if (!cur) {
        const old = S.profile?.whoKey;
        await store.claimName(key, uid, name);
        if (old && old !== key) store.releaseName(old).catch(() => {});
        S.profile.whoKey = key; S.profile.who = name; store.saveProfile(uid, { whoKey: key, who: name }).catch(() => {});
      }
    } catch (e) { console.warn('nombre', e); }
    try { localStorage.setItem('adv_who', name); } catch {}
    return name;
  }
}

let started = null;
export async function startPresence(S) {
  if (!S.user || started === S.user.uid) return;
  started = S.user.uid;
  // en otro móvil: recupera el nombre guardado en su cuenta
  if (!whoName() && S.profile?.who) { try { localStorage.setItem('adv_who', S.profile.who); } catch {} }
  await ensureName(S);
  const uid = S.user.uid, since = Date.now();
  const ping = (state = document.visibilityState === 'visible' ? 'online' : 'away') =>
    store.presencePing(uid, { name: whoName() || S.profile?.name || '', profileName: S.profile?.name || '', email: S.user.email || '', device: device(), state, lastSeen: Date.now(), since }).catch(() => {});
  ping();
  const iv = setInterval(() => ping(), 60000);
  document.addEventListener('visibilitychange', () => ping());
  addEventListener('pagehide', () => ping('off'));
  // si la administradora lo echa: fuera de la app
  let kicked = false;
  store.watchPresence(uid, async d => {
    if (!d?.kick || kicked) return;
    kicked = true; clearInterval(iv);
    await store.presencePing(uid, { kick: false, state: 'off', lastSeen: Date.now() }).catch(() => {});
    try { sessionStorage.removeItem('adv_splash_seen'); } catch {}
    document.querySelectorAll('.popup-back, .note-layer, .ttt-fx, .mm-stage, .cine-wrap').forEach(x => x.remove());
    await popup(`<h2>👋</h2><p style="font-size:18px">${L('La administradora ha cerrado tu sesión. Cuando quieras, vuelve a entrar. 🎄', 'L’administradora ha tancat la teva sessió. Quan vulguis, torna a entrar. 🎄', 'The administrator has closed your session. Come back whenever you like. 🎄')}</p>`);
    try { await store.signOut(); } catch {}
    location.reload();
  });
}
export const stopPresence = S => { if (S?.user) store.presencePing(S.user.uid, { state: 'off', lastSeen: Date.now() }).catch(() => {}); started = null; };

// ---------------------------------------------------------------- panel de la administradora principal
const ago = ms => { const m = Math.round(ms / 60000); return m < 1 ? 'ahora mismo' : m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} días`; };
export async function presenceAdmin(root) {
  let timer = null;
  const draw = async () => {
    if (!root.isConnected) { clearInterval(timer); return; }
    let list = [];
    try { list = await store.listPresence(); }
    catch (e) {
      root.replaceChildren(el('div', { class: 'card' }, el('h3', {}, '🟢 Quién está en la app'),
        el('p', {}, '⚠️ No se puede leer la lista (' + (e.code || e.message) + ').'),
        el('p', { class: 'muted' }, 'Hay que publicar las reglas nuevas de Firebase (archivo firestore.rules): copia todo su texto en Firebase → Firestore Database → Reglas → Publicar.')));
      return;
    }
    const now = Date.now();
    const st = p => p.state === 'off' ? 'off' : now - (p.lastSeen || 0) < 150000 ? (p.state === 'away' ? 'away' : 'on') : 'off';
    list.forEach(p => { p.st = st(p); });
    list.sort((a, b) => ({ on: 0, away: 1, off: 2 }[a.st] - { on: 0, away: 1, off: 2 }[b.st]) || (b.lastSeen || 0) - (a.lastSeen || 0));
    const on = list.filter(p => p.st === 'on').length, away = list.filter(p => p.st === 'away').length;
    const rows = list.map(p => {
      const kick = el('button', { class: 'btn small-btn no-delay pr-kick', onclick: async () => {
        const ok = await popup(`<h2>🚪</h2><p>¿Sacar a <b>${(p.name || p.profileName || p.email || '').replace(/[<>&]/g, '')}</b> de la app? Tendrá que volver a entrar.</p>`,
          { buttons: [{ label: 'Cancelar', value: false, cls: 'btn-ghost' }, { label: 'Sí, sacar', value: true }] });
        if (!ok) return;
        try { await store.kickUser(p.uid); toast('🚪 En unos segundos saldrá de la app'); draw(); } catch (e) { toast('⚠️ ' + (e.code || e.message), 5000); }
      } }, '🚪 Sacar');
      return el('div', { class: 'pr-row ' + p.st },
        el('span', { class: 'pr-dot' }),
        el('div', { class: 'pr-who' }, el('b', {}, p.name || p.profileName || '—'),
          el('small', {}, [p.name && p.profileName && p.name !== p.profileName ? `cuenta: ${p.profileName}` : '', p.email, p.device].filter(Boolean).join(' · ')),
          el('small', { class: 'pr-when' }, p.st === 'on' ? '🟢 Dentro ahora' : p.st === 'away' ? '🟡 Con la app abierta en segundo plano · ' + ago(now - p.lastSeen) : '⚪ Fuera · ' + ago(now - (p.lastSeen || 0)))),
        p.st !== 'off' && !p.kick ? kick : p.kick ? el('small', { class: 'pr-kicking' }, 'saliendo…') : null);
    });
    root.replaceChildren(el('div', { class: 'card' },
      el('h3', {}, '🟢 Quién está en la app'),
      el('p', { class: 'muted' }, 'Cada persona escribe su nombre al entrar (en la pantalla de la nieve). Aquí ves quién tiene la app abierta ahora y puedes sacar a quien la haya dejado abierta. Se actualiza solo cada 15 segundos.'),
      el('div', { class: 'pr-stats' }, el('div', {}, el('b', {}, on), el('small', {}, 'dentro ahora')), el('div', {}, el('b', {}, away), el('small', {}, 'en segundo plano')), el('div', {}, el('b', {}, list.length), el('small', {}, 'personas en total'))),
      el('div', { class: 'pr-list' }, ...(rows.length ? rows : [el('p', { class: 'muted' }, 'Todavía no ha entrado nadie con esta versión.')]))));
  };
  await draw();
  timer = setInterval(draw, 15000);
}
