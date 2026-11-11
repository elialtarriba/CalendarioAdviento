// Traducción automática de los textos que escribe el administrador (en español) al idioma elegido.
// Se guarda en el móvil (caché) para traducir cada texto solo una vez. Si no hay conexión, se queda en español.
const CK = 'adv_tr_v1';
let cache = null, downUntil = 0;
const load = () => { if (cache) return cache; try { cache = JSON.parse(localStorage.getItem(CK)) || {}; } catch { cache = {}; } return cache; };
const save = () => { try { localStorage.setItem(CK, JSON.stringify(cache)); } catch {} };
const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + s.length; };
const timeout = (p, ms) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);

async function google(text, from, to) {
  const u = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  const j = await timeout(fetch(u).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }), 5000);
  return (j?.[0] || []).map(x => x?.[0] || '').join('');
}
async function mymemory(text, from, to) {
  const u = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
  const j = await timeout(fetch(u).then(r => r.json()), 5000);
  const t = j?.responseData?.translatedText; if (!t || /MYMEMORY WARNING/i.test(t)) throw new Error('mm'); return t;
}
async function plain(text, from, to) {
  const s = String(text || ''); if (!s.trim() || from === to) return s;
  const c = load(), k = `${from}>${to}:${hash(s)}`;
  if (c[k] != null) return c[k];
  if (Date.now() < downUntil) return s;
  let out;
  try { out = await google(s, from, to); }
  catch { try { out = await mymemory(s, from, to); } catch (e) { downUntil = Date.now() + 10 * 60000; throw e; } } // sin servicio: 10 minutos en español sin esperar
  if (out && out.trim()) { c[k] = out; save(); }
  return out || s;
}
// texto con formato (HTML): se traduce trozo a trozo sin romper las etiquetas
async function rich(html, from, to) {
  const s = String(html || '');
  if (!/[<&]/.test(s)) return plain(s, from, to);
  const tpl = document.createElement('template'); tpl.innerHTML = s;
  const nodes = []; const w = document.createTreeWalker(tpl.content, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) if (/[A-Za-zÀ-ÿ]/.test(w.currentNode.data)) nodes.push(w.currentNode);
  await Promise.all(nodes.map(async n => {
    const lead = n.data.match(/^\s*/)[0], tail = n.data.match(/\s*$/)[0];
    n.data = lead + (await plain(n.data.trim(), from, to)) + tail;
  }));
  return tpl.innerHTML;
}
export async function tr(text, to, from = 'es') {
  if (!text || to === from) return text;
  try { return await rich(text, from, to); } catch { return text; }
}
// pone el texto ya (en español) y lo cambia por la traducción cuando llega
export function trInto(node, text, to) {
  node.textContent = text || '';
  if (!text || to === 'es') return node;
  tr(text, to).then(t => { if (t) node.textContent = t; });
  return node;
}

// Rellena los textos del día que el administrador ha cambiado en español pero no en el idioma elegido.
const FIELDS = ['act1', 'act2', 'q', 'rouletteNote', 'hat1Title', 'hat1Text', 'hatReminder', 'hat2Title', 'hat2Joke', 'hat2Answer', 'gdResult', 'hatsTitle', 'hatsHelp'];
export async function localizeDay(c, def, lang) {
  if (!c || lang === 'es') return c;
  const out = { ...c };
  const needs = (cur, d) => cur?.es && cur.es !== d?.es && (!cur[lang] || cur[lang] === d?.[lang]);
  const jobs = [];
  for (const f of FIELDS) {
    const cur = c[f]; if (!cur || typeof cur !== 'object' || !needs(cur, def[f])) continue;
    jobs.push(tr(cur.es, lang).then(t => { out[f] = { ...cur, [lang]: t }; }));
  }
  if (c.options?.es && JSON.stringify(c.options.es) !== JSON.stringify(def.options?.es) && (!c.options[lang] || JSON.stringify(c.options[lang]) === JSON.stringify(def.options?.[lang])))
    jobs.push(Promise.all(c.options.es.map(o => tr(o, lang))).then(a => { out.options = { ...c.options, [lang]: a }; }));
  if (Array.isArray(c.missions)) jobs.push(Promise.all(c.missions.map((m, i) => needs(m, def.missions?.[i]) ? tr(m.es, lang).then(t => ({ ...m, [lang]: t })) : m)).then(a => { out.missions = a; }));
  await Promise.race([Promise.all(jobs), new Promise(r => setTimeout(r, 6000))]);
  return out;
}
