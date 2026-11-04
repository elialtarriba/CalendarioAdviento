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
      if (hoho) parts.push(say('Ho, ho, ho!', .3, .7));
      if (text) parts.push(say(text, .55, .85));
      parts[parts.length - 1].onend = res; parts[parts.length - 1].onerror = res;
      parts.forEach(p => speechSynthesis.speak(p));
      setTimeout(res, 12000);
    } catch { res(); }
  });
}
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};
