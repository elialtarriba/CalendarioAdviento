// Sonidos sintetizados (sin archivos) + voz de Papá Noel con la voz del navegador.
let ctx;
const ac = () => {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};
export const unlockAudio = () => { try { ac(); } catch {} };

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

function tone(freq, start, dur, type = 'sine', vol = .15) {
  const c = ac(); const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(vol, start + .02);
  g.gain.exponentialRampToValueAtTime(.001, start + dur);
  o.connect(g); g.connect(c.destination); o.start(start); o.stop(start + dur + .05);
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
      parts[parts.length - 1].onend = res; parts[parts.length - 1].onerror = res;
      parts.forEach(p => speechSynthesis.speak(p));
      setTimeout(res, 12000);
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
export function doorSound(n) {
  try {
    const c = ac(), t = c.currentTime;
    const kind = n % 6, shift = Math.floor(n / 6) * 2 - 3; // 6 tipos x 4 variaciones = 24 sonidos distintos
    if (kind === 0) { // caja de música
      const ph = PHRASES[n % PHRASES.length];
      ph.forEach((m, i) => { tone(NOTE(m + 12 + shift), t + i * .16, .5, 'sine', .12); tone(NOTE(m + 24 + shift), t + i * .16, .25, 'sine', .03); });
    } else if (kind === 1) { // cascabeles de trineo + campanita
      sleighBells(t, 12); bellTone(NOTE(84 + shift), t + .3, 1.2, .08);
    } else if (kind === 2) { // destello mágico (glissando)
      for (let i = 0; i < 14; i++) tone(NOTE(72 + shift + i * (n % 2 ? 2 : 3)), t + i * .045, .35, 'triangle', .06);
      sleighBells(t + .5, 4, .03);
    } else if (kind === 3) { // toc-toc y crujido de madera
      [0, .18].forEach(d => { tone(180 + shift * 8, t + d, .08, 'square', .12); tone(90, t + d, .1, 'sine', .25); });
      setTimeout(() => creak(true), 420);
    } else if (kind === 4) { // campanas de iglesia
      const base = NOTE(67 + shift);
      [0, .35, .7].forEach((d, i) => bellTone(base * [1, 1.25, 1.5][(i + n) % 3], t + d, 1.8, .1));
    } else { // arpa
      const sc = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
      sc.forEach((s, i) => tone(NOTE(60 + shift + s), t + i * .05, .9, 'triangle', .07));
      tone(NOTE(84 + shift), t + .6, 1.2, 'sine', .06);
    }
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
// Día 25: ¡Ho, ho, ho! de Papá Noel + campanillas a lo lejos
let hohoAudio;
export function hohoho() {
  try {
    distantBells(ac().currentTime + .05, 5);
    hohoAudio = hohoAudio || new Audio('hohoho.mp3?v=2');
    hohoAudio.currentTime = 0; hohoAudio.volume = 1;
    hohoAudio.play().catch(() => speak('', 'es', { hoho: true }));
  } catch {}
}
// ¡Enhorabuena!: fanfarria de trompetas + aplausos
export function fanfare() {
  try {
    const c = ac(), t = c.currentTime;
    [[523, 0, .14], [659, .14, .14], [784, .28, .14], [1047, .42, .5], [784, .95, .14], [1047, 1.1, .7]].forEach(([f, d, l]) => {
      tone(f, t + d, l + .1, 'sawtooth', .07); tone(f * 2, t + d, l, 'square', .02); tone(f / 2, t + d, l + .1, 'triangle', .06);
    });
    for (let i = 0; i < 60; i++) { // aplausos
      const s = c.createBufferSource(); s.buffer = noiseBuffer(c, .05);
      const fl = c.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = 1200 + Math.random() * 1800; fl.Q.value = 1.5;
      const g = c.createGain(); const st = t + .5 + Math.random() * 2;
      g.gain.setValueAtTime(.18 * Math.random() + .05, st); g.gain.exponentialRampToValueAtTime(.001, st + .05);
      s.connect(fl); fl.connect(g); g.connect(c.destination); s.start(st);
    }
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
