// Sonidos sintetizados (sin archivos) + voz de Papá Noel con la voz del navegador.
let ctx;
// En iPhone/iPad: decir desde el principio que la app «reproduce sonido» (como un vídeo),
// así suena aunque el botón de silencio esté puesto. Tiene que ser ANTES de crear el sonido:
// si se cambia después, el iPhone corta el sonido de golpe.
try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch {}
const ac = () => {
  if (!ctx || ctx.state === 'closed') ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state !== 'running') ctx.resume().catch(() => {}); // «suspended» o «interrupted» (iPhone)
  return ctx;
};
// iPhones antiguos (sin audioSession): un audio silencioso en bucle hace lo mismo
let silentEl = null;
const SILENT = 'data:audio/mp4;base64,AAAAHGZ0eXBNNEEgAAACAE00QSBpc29taXNvMgAAAAhmcmVlAAAAG21kYXQhAAOgQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
let checking = false;
// se llama en cada toque: si el sonido se ha cortado (llamada, bloqueo, voz…), lo recupera
export const unlockAudio = () => {
  try {
    const c = ac();
    if (!navigator.audioSession) {
      if (!silentEl) { silentEl = new Audio(SILENT); silentEl.setAttribute('playsinline', ''); silentEl.loop = true; silentEl.volume = .01; }
      if (silentEl.paused) silentEl.play().catch(() => {});
    }
    const b = c.createBuffer(1, 1, 22050), src = c.createBufferSource(); src.buffer = b; src.connect(c.destination); src.start(0);
    // si tras intentarlo sigue sin funcionar, se crea un sonido nuevo para el siguiente toque
    if (c.state !== 'running' && !checking) {
      checking = true;
      setTimeout(() => { checking = false; if (ctx === c && c.state !== 'running' && c.state !== 'suspended') { try { c.close(); } catch {} ctx = null; } }, 600);
    }
  } catch {}
};
['pointerdown', 'touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, unlockAudio, { capture: true, passive: true }));
// al volver a la app (después de bloquear el móvil o cambiar de app)
const wake = () => { if (document.visibilityState === 'visible' && ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); };
document.addEventListener('visibilitychange', wake); window.addEventListener('pageshow', wake); window.addEventListener('focus', wake);

function noiseBuffer(c, secs) {
  const b = c.createBuffer(1, c.sampleRate * secs, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

// Chirrido de puerta: oscilador "stick-slip" con frecuencia que cambia
export function creak(open = true) {
  try {
    const c = ac(), t = c.currentTime, dur = open ? 1.6 : 1.3;
    const osc = c.createOscillator(); osc.type = 'sawtooth';
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 6;
    const g = c.createGain(); g.gain.value = 0;
    const lfo = c.createOscillator(); lfo.type = 'square';
    const lfoG = c.createGain(); lfoG.gain.value = 0.18;
    lfo.connect(lfoG); lfoG.connect(g.gain);
    osc.connect(f); f.connect(g); g.connect(c.destination);
    const pts = open ? [180, 260, 210, 340, 300, 420, 260] : [380, 300, 330, 220, 260, 160];
    pts.forEach((p, i) => osc.frequency.linearRampToValueAtTime(p, t + dur * i / (pts.length - 1)));
    f.frequency.setValueAtTime(900, t); f.frequency.linearRampToValueAtTime(1500, t + dur);
    lfo.frequency.setValueAtTime(28, t); lfo.frequency.linearRampToValueAtTime(55, t + dur * .6); lfo.frequency.linearRampToValueAtTime(22, t + dur);
    const env = c.createGain(); env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(.35, t + .08); env.gain.setValueAtTime(.35, t + dur - .25); env.gain.linearRampToValueAtTime(0, t + dur);
    g.disconnect(); g.connect(env); env.connect(c.destination);
    g.gain.value = 0.2;
    osc.start(t); lfo.start(t); osc.stop(t + dur); lfo.stop(t + dur);
    if (!open) thud(t + dur - .05);
  } catch {}
}
function thud(at) {
  const c = ac(); const o = c.createOscillator(); const g = c.createGain();
  o.frequency.setValueAtTime(110, at); o.frequency.exponentialRampToValueAtTime(40, at + .25);
  g.gain.setValueAtTime(.5, at); g.gain.exponentialRampToValueAtTime(.001, at + .3);
  o.connect(g); g.connect(c.destination); o.start(at); o.stop(at + .32);
}

function tone(freq, start, dur, type = 'sine', vol = .15, dest) {
  const c = ac(); const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(vol, start + .02);
  g.gain.exponentialRampToValueAtTime(.001, start + dur);
  o.connect(g); g.connect(dest || c.destination); o.start(start); o.stop(start + dur + .05);
}
export function chime() {
  try { const t = ac().currentTime; [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * .09, .7, 'triangle', .12)); } catch {}
}
export function wrong() {
  try { const t = ac().currentTime; tone(330, t, .25, 'square', .06); tone(247, t + .2, .4, 'square', .06); } catch {}
}
export function pop() {
  try { const t = ac().currentTime; tone(900 + Math.random() * 400, t, .12, 'sine', .12); } catch {}
}
export function crumple() {
  try {
    const c = ac(), t = c.currentTime;
    for (let i = 0; i < 14; i++) {
      const s = c.createBufferSource(); s.buffer = noiseBuffer(c, .08);
      const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1500 + Math.random() * 3000;
      const g = c.createGain(); const st = t + i * .045 + Math.random() * .03;
      g.gain.setValueAtTime(.25 * Math.random() + .05, st); g.gain.exponentialRampToValueAtTime(.001, st + .07);
      s.connect(f); f.connect(g); g.connect(c.destination); s.start(st);
    }
  } catch {}
}
// "Susto": golpe + sirena cómica
export function scare() {
  try {
    const c = ac(), t = c.currentTime;
    const s = c.createBufferSource(); s.buffer = noiseBuffer(c, .4);
    const g = c.createGain(); g.gain.setValueAtTime(.7, t); g.gain.exponentialRampToValueAtTime(.001, t + .4);
    s.connect(g); g.connect(c.destination); s.start(t);
    const o = c.createOscillator(); o.type = 'sawtooth'; const og = c.createGain();
    o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(1400, t + .35); o.frequency.exponentialRampToValueAtTime(300, t + 1.1);
    og.gain.setValueAtTime(.25, t); og.gain.exponentialRampToValueAtTime(.001, t + 1.2);
    o.connect(og); og.connect(c.destination); o.start(t); o.stop(t + 1.25);
    // "boing" divertido
    tone(180, t + 1.1, .5, 'sine', .3);
  } catch {}
}
// Máquina analizando (día 13)
export function machine(secs = 4) {
  try {
    const c = ac(), t = c.currentTime;
    const o = c.createOscillator(); o.type = 'square'; const g = c.createGain(); g.gain.value = .05;
    o.frequency.setValueAtTime(90, t);
    const l = c.createOscillator(); l.frequency.value = 8; const lg = c.createGain(); lg.gain.value = 40;
    l.connect(lg); lg.connect(o.frequency);
    o.connect(g); g.connect(c.destination); o.start(t); l.start(t); o.stop(t + secs); l.stop(t + secs);
    for (let i = 0; i < secs * 6; i++) tone(600 + Math.random() * 1200, t + i / 6, .06, 'square', .04);
    tone(1046, t + secs, .5, 'triangle', .2);
  } catch {}
}
// Melodía navideña sencilla (Jingle Bells, dominio público)
export function jingle(loops = 1) {
  try {
    const c = ac(); let t = c.currentTime + .05; const b = .195;
    const E = 659, G = 784, C = 523, D = 587, F = 698;
    const mel = [[E,1],[E,1],[E,2],[E,1],[E,1],[E,2],[E,1],[G,1],[C,1.5],[D,.5],[E,4],
                 [F,1],[F,1],[F,1.5],[F,.5],[F,1],[E,1],[E,1],[E,.5],[E,.5],[E,1],[D,1],[D,1],[E,1],[D,2],[G,2]];
    for (let k = 0; k < loops; k++) for (const [f, d] of mel) { tone(f, t, b * d * .95, 'triangle', .1); tone(f / 2, t, b * d * .9, 'sine', .05); if (Math.random() < .5) tone(5000, t, .05, 'square', .015); t += b * d; }
    return (t - c.currentTime) * 1000;
  } catch { return 0; }
}

// ---------------- Voz de Papá Noel
const LANGS = { es: ['es-ES', 'es'], ca: ['ca-ES', 'ca', 'es-ES'], en: ['en-GB', 'en-US', 'en'] };
function pickVoice(lang) {
  const vs = speechSynthesis.getVoices();
  for (const code of LANGS[lang] || LANGS.es) {
    const cands = vs.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(code.toLowerCase()));
    const male = cands.find(v => /male|jorge|diego|pablo|enric|jordi|daniel|arthur|alex|fred|reed|rocko|grandpa/i.test(v.name) && !/female/i.test(v.name));
    if (male || cands[0]) return male || cands[0];
  }
  return null;
}
export function speak(text, lang = 'es', { hoho = false } = {}) {
  return new Promise(res => {
    try {
      if (!('speechSynthesis' in window)) return res();
      speechSynthesis.cancel();
      const say = (t, pitch, rate) => {
        const u = new SpeechSynthesisUtterance(t);
        const v = pickVoice(lang); if (v) u.voice = v;
        u.lang = (v && v.lang) || LANGS[lang][0]; u.pitch = pitch; u.rate = rate; u.volume = 1;
        return u;
      };
      const parts = [];
      if (hoho) parts.push(say(lang === 'en' ? 'Ho! Ho! Ho!' : '¡Jo! ¡Jo! ¡Jo!', .1, .65));
      if (text) parts.push(say(text, .55, .85));
      const done = () => { wake(); setTimeout(wake, 300); res(); };
      parts[parts.length - 1].onend = done; parts[parts.length - 1].onerror = done;
      parts.forEach(p => speechSynthesis.speak(p));
      setTimeout(() => { wake(); res(); }, 12000);
    } catch { res(); }
  });
}
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};

// ---------------- Un sonido distinto para cada casilla
function bellTone(f, at, dur = 1.2, vol = .12) {
  // campana: parciales inarmónicos
  [[1, 1], [2.76, .45], [5.4, .25], [8.9, .12]].forEach(([m, g]) => tone(f * m, at, dur / Math.sqrt(m), 'sine', vol * g));
}
function sleighBells(at, n = 10, vol = .05) {
  const c = ac();
  for (let i = 0; i < n; i++) {
    const s = c.createBufferSource(); s.buffer = noiseBuffer(c, .12);
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 6000 + Math.random() * 3000; f.Q.value = 8;
    const g = c.createGain(); const st = at + i * .07 + Math.random() * .03;
    g.gain.setValueAtTime(vol * (1.5 + Math.random()), st); g.gain.exponentialRampToValueAtTime(.001, st + .11);
    s.connect(f); f.connect(g); g.connect(c.destination); s.start(st);
    tone(2400 + Math.random() * 900, st, .15, 'triangle', vol * .4);
  }
}
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
const PHRASES = [
  [64, 64, 64, 64, 64, 64, 64, 67, 60, 62, 64],          // Jingle Bells
  [67, 69, 67, 64, 67, 69, 67, 64],                      // Noche de paz
  [67, 65, 64, 62, 60, 62, 64, 60],                      // Deck the halls
  [62, 67, 67, 69, 67, 66, 64, 64],                      // We wish you
  [60, 64, 67, 72, 67, 64, 60],                          // arpegio
  [72, 71, 69, 67, 65, 64, 62, 60],                      // Joy to the world
  [64, 65, 67, 72, 71, 69, 67],                          // campanitas
  [67, 64, 60, 64, 67, 72],                              // fanfarria
];
// 24 sonidos alegres distintos: 8 villancicos × 3 instrumentos, con cascabeles
const CAROLS = [
  [[64,.5],[64,.5],[64,1],[64,.5],[64,.5],[64,1],[64,.5],[67,.5],[60,.75],[62,.25],[64,1.5]],          // Jingle Bells
  [[67,.5],[72,.5],[72,.25],[74,.25],[72,.25],[71,.25],[69,.5],[69,.5],[69,.5],[74,1]],                 // We wish you
  [[72,.75],[71,.25],[69,.5],[67,.5],[65,.5],[64,.5],[62,.5],[60,1]],                                     // Joy to the world
  [[67,.75],[65,.25],[64,.5],[62,.5],[60,.5],[62,.5],[64,.5],[60,1]],                                     // Deck the halls
  [[60,.5],[65,.5],[65,.5],[67,.5],[69,.5],[65,.5],[69,.5],[70,.5],[72,1]],                               // Ding dong merrily
  [[67,.75],[69,.25],[67,.5],[64,1.25],[67,.75],[69,.25],[67,.5],[64,1.25]],                              // Noche de paz
  [[64,.5],[64,.5],[65,.5],[67,.5],[67,.5],[65,.5],[64,.5],[62,.5],[60,.5],[60,.5],[62,.5],[64,1]],       // campanitas alegres
  [[60,.25],[64,.25],[67,.25],[72,.5],[67,.25],[72,1],[76,.25],[79,1]],                                  // fanfarria
];
function voice(kind, f, at, len) {
  if (kind === 0) { tone(f * 2, at, len * 1.6 + .3, 'sine', .13); tone(f * 4, at, .2, 'sine', .03); }                 // caja de música
  else if (kind === 1) { [[1, .1], [2.76, .04], [5.4, .02]].forEach(([m, v]) => tone(f * 2 * m, at, 1.1 / Math.sqrt(m), 'sine', v)); } // campanas
  else { tone(f * 2, at, len + .25, 'triangle', .11); tone(f, at, len, 'sine', .06); tone(f * 3, at, .12, 'sine', .02); } // celesta
}
export function doorSound(n) {
  try {
    unlockAudio();
    const c = ac(); let t = c.currentTime + .03;
    const carol = CAROLS[(n - 1) % CAROLS.length], kind = Math.floor((n - 1) / 8) % 3, beat = .2;
    sleighBells(t, 6, .035);
    for (const [m, d] of carol) { voice(kind, NOTE(m), t, d * beat); t += d * beat; }
    tone(NOTE(84), t + .05, 1, 'sine', .05); sleighBells(t, 5, .03);
  } catch {}
}
// Campanillas a lo lejos: cascabeles suaves y apagados que van y vienen
function distantBells(at, secs = 5) {
  const c = ac();
  const far = c.createBiquadFilter(); far.type = 'lowpass'; far.frequency.value = 3800;
  const gain = c.createGain(); gain.gain.value = .55; far.connect(gain); gain.connect(c.destination);
  for (let i = 0; i < secs * 9; i++) {
    const st = at + i / 9 + Math.random() * .05, k = Math.sin(Math.PI * i / (secs * 9)); // se acercan y se alejan
    const s = c.createBufferSource(); s.buffer = noiseBuffer(c, .1);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 5000 + Math.random() * 2500; bp.Q.value = 10;
    const g = c.createGain(); g.gain.setValueAtTime(.05 * k + .01, st); g.gain.exponentialRampToValueAtTime(.001, st + .09);
    s.connect(bp); bp.connect(g); g.connect(far); s.start(st);
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 2600 + Math.random() * 800;
    const og = c.createGain(); og.gain.setValueAtTime(.025 * k, st); og.gain.exponentialRampToValueAtTime(.0005, st + .25);
    o.connect(og); og.connect(far); o.start(st); o.stop(st + .3);
  }
  // campanita de iglesia muy lejana
  [0, 1.2, 2.4].forEach(d => [[1, .03], [2.76, .012], [5.4, .006]].forEach(([m, v]) => {
    const o = c.createOscillator(); o.frequency.value = 523 * m; const g = c.createGain();
    g.gain.setValueAtTime(v, at + .4 + d); g.gain.exponentialRampToValueAtTime(.0001, at + .4 + d + 2.5);
    o.connect(g); g.connect(far); o.start(at + .4 + d); o.stop(at + 3.2 + d);
  }));
}
// Día 25: ¡Ho, ho, ho! de Papá Noel con cascabeles sonando a la vez.
// La risa se reproduce con el mismo sistema de sonido que el resto (así suena siempre, también en iPhone),
// un poco más grave y con más cuerpo para que suene a Papá Noel.
let hohoBuf = null, hohoLoading = null;
function loadHoho() {
  if (hohoBuf) return Promise.resolve(hohoBuf);
  if (!hohoLoading) hohoLoading = fetch('hohoho.mp3?v=2').then(r => r.arrayBuffer())
    .then(ab => new Promise((res, rej) => ac().decodeAudioData(ab, res, rej))).then(b => (hohoBuf = b)).catch(e => { hohoLoading = null; throw e; });
  return hohoLoading;
}
setTimeout(() => loadHoho().catch(() => {}), 3000); // se prepara con tiempo
function jingleShake(at, secs = 3.6, vol = .06) {
  // cascabeles de trineo al ritmo (como si alguien los agitara mientras Papá Noel se ríe)
  for (let tt = 0; tt < secs; tt += .2) sleighBells(at + tt, 3, vol * (tt % .8 < .2 ? 1.4 : 1));
}
export function hohoho() {
  try {
    unlockAudio();
    const c = ac(), at = c.currentTime + .08;
    jingleShake(at, 3.8);
    distantBells(at, 5);
    loadHoho().then(buf => {
      const src = c.createBufferSource(); src.buffer = buf; src.playbackRate.value = .86; // más grave, voz de Papá Noel
      const body = c.createBiquadFilter(); body.type = 'lowshelf'; body.frequency.value = 220; body.gain.value = 7;
      const air = c.createBiquadFilter(); air.type = 'highshelf'; air.frequency.value = 5000; air.gain.value = -4;
      const g = c.createGain(); g.gain.value = 1.5;
      src.connect(body); body.connect(air); air.connect(g); g.connect(c.destination);
      src.start(Math.max(c.currentTime, at + .15));
    }).catch(() => {
      // si no se puede cargar el archivo: se intenta con el reproductor normal
      const a = new Audio('hohoho.mp3?v=2'); a.play().catch(() => {});
    });
  } catch {}
}
// ¡Enhorabuena!: fanfarria de trompetas + aplausos
export function fanfare() {
  try {
    unlockAudio();
    const c = ac(), t = c.currentTime;
    [[523, 0, .14], [659, .14, .14], [784, .28, .14], [1047, .42, .5], [784, .95, .14], [1047, 1.1, .8]].forEach(([f, d, l]) => {
      tone(f, t + d, l + .1, 'sawtooth', .09); tone(f * 2, t + d, l, 'square', .025); tone(f / 2, t + d, l + .1, 'triangle', .08);
    });
    // aplausos: muchas palmadas durante 3 segundos
    for (let i = 0; i < 220; i++) {
      const st = t + .4 + Math.pow(Math.random(), .8) * 3, k = 1 - (st - t - .4) / 3.2;
      const s = c.createBufferSource(); s.buffer = noiseBuffer(c, .04);
      const fl = c.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = 900 + Math.random() * 2200; fl.Q.value = 1.2;
      const g = c.createGain(); g.gain.setValueAtTime((.25 * Math.random() + .12) * k, st); g.gain.exponentialRampToValueAtTime(.001, st + .045);
      s.connect(fl); fl.connect(g); g.connect(c.destination); s.start(st);
    }
    // «¡bieeen!» de la gente: varias voces que suben
    for (let v = 0; v < 6; v++) {
      const st = t + .45 + v * .04, o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(220 + v * 35, st); o.frequency.linearRampToValueAtTime(330 + v * 45, st + .35); o.frequency.linearRampToValueAtTime(280 + v * 40, st + 1);
      f.type = 'bandpass'; f.frequency.value = 900 + v * 120; f.Q.value = 3;
      g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(.05, st + .08); g.gain.exponentialRampToValueAtTime(.001, st + 1.1);
      o.connect(f); f.connect(g); g.connect(c.destination); o.start(st); o.stop(st + 1.2);
    }
    sleighBells(t + .3, 18, .04);
  } catch {}
}

// clic de botón: «toc» corto y suave
export function clickSound() {
  try {
    const c = ac(), t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle';
    o.frequency.setValueAtTime(1400, t); o.frequency.exponentialRampToValueAtTime(500, t + .05);
    g.gain.setValueAtTime(.18, t); g.gain.exponentialRampToValueAtTime(.001, t + .08);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + .09);
    const s = c.createBufferSource(); s.buffer = noiseBuffer(c, .02); const sg = c.createGain(); sg.gain.value = .08; s.connect(sg); sg.connect(c.destination); s.start(t);
  } catch {}
}


// ---------------- Música de bienvenida: «Navidad, Navidad, dulce Navidad» (Jingle Bells, solo melodía)
// con cascabeles, bajo y acordes. Devuelve { stop(segundos) } para apagarla poco a poco.
export function christmasSong() {
  const c = ac();
  const master = c.createGain(); master.gain.value = .9; master.connect(c.destination);
  const B = .25; // segundos por pulso
  const M = (n, d) => [n, d];
  const A = [M(64,1),M(64,1),M(64,2), M(64,1),M(64,1),M(64,2), M(64,1),M(67,1),M(60,1.5),M(62,.5), M(64,4)];
  const P1 = [M(65,1),M(65,1),M(65,1.5),M(65,.5), M(65,1),M(64,1),M(64,1),M(64,.5),M(64,.5), M(64,1),M(62,1),M(62,1),M(64,1), M(62,2),M(67,2)];
  const P2 = [M(65,1),M(65,1),M(65,1),M(65,1), M(65,1),M(64,1),M(64,1),M(64,.5),M(64,.5), M(67,1),M(67,1),M(65,1),M(62,1), M(60,4)];
  const melody = [...A, ...P1, ...A, ...P2];
  // un acorde por compás (4 pulsos): Do Do Do Do | Fa Do Re7 Sol | Do Do Do Do | Fa Do Sol Do
  const CH = { C: [48, 60, 64, 67], F: [41, 60, 65, 69], D: [50, 60, 62, 66], G: [43, 59, 62, 67] };
  const bars = ['C','C','C','C','F','C','D','G','C','C','C','C','F','C','G','C'];
  const LOOP = 64 * B;
  let stopped = false, next = c.currentTime + .15, timer;
  const bell = (f, at, dur, v) => [[1, 1], [2.76, .35], [5.4, .15]].forEach(([m, g]) => tone(f * m, at, dur / Math.sqrt(m), 'sine', v * g, master));
  const jingleHit = (at, v) => { // cascabel
    const sN = c.createBufferSource(); sN.buffer = noiseBuffer(c, .1);
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 7000 + Math.random() * 2500; f.Q.value = 6;
    const g = c.createGain(); g.gain.setValueAtTime(v, at); g.gain.exponentialRampToValueAtTime(.001, at + .09);
    sN.connect(f); f.connect(g); g.connect(master); sN.start(at);
  };
  const scheduleLoop = t0 => {
    let t = t0;
    for (const [n, d] of melody) { // melodía: campanita + caja de música
      bell(NOTE(n + 12), t, Math.max(.5, d * B * 2), .075);
      tone(NOTE(n), t, d * B * .95, 'triangle', .07, master);
      t += d * B;
    }
    bars.forEach((ch, i) => {
      const at = t0 + i * 4 * B, [bass, ...rest] = CH[ch];
      tone(NOTE(bass), at, B * 1.8, 'sine', .14, master); tone(NOTE(bass + 7), at + 2 * B, B * 1.8, 'sine', .11, master); // bajo «um-pa»
      [1, 3].forEach(k => rest.forEach(n => tone(NOTE(n), at + k * B, B * .7, 'triangle', .025, master)));          // acordes
      for (let k = 0; k < 8; k++) jingleHit(at + k * B / 2, k % 2 ? .05 : .09);                                    // cascabeles en corcheas
    });
  };
  const pump = () => {
    if (stopped) return;
    while (next < c.currentTime + 2) { scheduleLoop(next); next += LOOP; }
    timer = setTimeout(pump, 500);
  };
  pump();
  return {
    get playing() { return c.state === 'running'; },
    stop(fade = 4) {
      if (stopped) return; stopped = true; clearTimeout(timer);
      const now = c.currentTime;
      master.gain.cancelScheduledValues(now); master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + fade);
      setTimeout(() => master.disconnect(), (fade + .2) * 1000);
    },
  };
}
