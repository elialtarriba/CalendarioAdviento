// Efectos visuales: confeti, luces alrededor, máquina de escribir, papel arrugado, avisos.
export const $ = (s, r = document) => r.querySelector(s);
export const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  kids.flat().forEach(k => k != null && e.append(k.nodeType ? k : document.createTextNode(k)));
  return e;
};
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function confetti(n = 160, opts = {}) {
  const c = el('canvas', { class: 'fx-canvas' }); document.body.append(c);
  const x = c.getContext('2d'); const W = c.width = innerWidth, H = c.height = innerHeight;
  const cols = ['#e63946', '#ffd166', '#06d6a0', '#118ab2', '#f4a261', '#ffffff', '#c1121f', '#2a9d8f'];
  const ps = Array.from({ length: n }, () => ({
    x: opts.x ?? Math.random() * W, y: opts.y ?? -20 - Math.random() * H * .5,
    vx: (Math.random() - .5) * (opts.x != null ? 12 : 3), vy: opts.y != null ? -Math.random() * 12 - 2 : Math.random() * 3 + 2,
    r: Math.random() * 6 + 4, a: Math.random() * 6, va: (Math.random() - .5) * .3, c: cols[Math.random() * cols.length | 0], s: Math.random() < .3,
  }));
  let f = 0;
  (function loop() {
    x.clearRect(0, 0, W, H); f++;
    ps.forEach(p => {
      p.vy += .12; p.vy = Math.min(p.vy, 5); p.vx *= .99; p.x += p.vx + Math.sin(f / 20 + p.a); p.y += p.vy; p.a += p.va;
      x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c;
      if (p.s) { x.beginPath(); x.arc(0, 0, p.r / 2, 0, 7); x.fill(); } else x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      x.restore();
    });
    if (f < (opts.frames || 260)) requestAnimationFrame(loop); else c.remove();
  })();
}

// Guirnalda de luces alrededor de la pantalla con pase alterno lento
export function borderLights(container = document.body) {
  const wrap = el('div', { class: 'border-lights' });
  const cols = ['#ff3b3b', '#ffd23b', '#3bff6a', '#3bb6ff', '#ff7af0'];
  const per = Math.max(10, Math.round(innerWidth / 55)), perV = Math.max(8, Math.round(innerHeight / 55));
  const add = (x, y, i) => {
    const b = el('span', { class: 'bulb ' + (i % 2 ? 'odd' : 'even') });
    b.style.left = x + '%'; b.style.top = y + '%'; b.style.setProperty('--c', cols[i % cols.length]);
    wrap.append(b);
  };
  let i = 0;
  for (let k = 0; k <= per; k++) { add(k / per * 100, 0, i++); add(k / per * 100, 100, i++); }
  for (let k = 1; k < perV; k++) { add(0, k / perV * 100, i++); add(100, k / perV * 100, i++); }
  container.append(wrap);
  return () => wrap.remove();
}

// Texto que aparece letra a letra
export async function typewriter(node, text, speed = 28) {
  node.textContent = '';
  const cursor = el('span', { class: 'tw-cursor' }, '▍');
  node.append(cursor);
  for (const ch of text) {
    cursor.before(document.createTextNode(ch));
    await sleep(ch === '.' || ch === '!' || ch === '?' ? speed * 6 : ch === ',' ? speed * 3 : speed);
  }
  cursor.remove();
}

// Arrugar el papel: la nota se arruga, se aleja y desaparece
export async function crumpleOut(node) {
  node.classList.add('crumpling');
  await sleep(1300);
}

export function toast(msg, ms = 2600) {
  const tt = el('div', { class: 'toast' }, msg); document.body.append(tt);
  requestAnimationFrame(() => tt.classList.add('show'));
  setTimeout(() => { tt.classList.remove('show'); setTimeout(() => tt.remove(), 400); }, ms);
}

// Ventanita emergente; devuelve promesa que se resuelve al cerrar
export function popup(content, { buttons = [{ label: 'OK', value: true }], cls = '', outside = false } = {}) {
  return new Promise(res => {
    const box = el('div', { class: 'popup ' + cls });
    if (typeof content === 'string') box.innerHTML = content; else box.append(content);
    const bar = el('div', { class: 'popup-btns' });
    const back = el('div', { class: 'popup-back' }, box);
    buttons.forEach(b => bar.append(el('button', { class: 'btn ' + (b.cls || ''), onclick: () => { back.remove(); res(b.value); } }, b.label)));
    if (buttons.length) box.append(bar);
    if (outside) back.addEventListener('click', e => { if (e.target === back) { back.remove(); res(false); } });
    document.body.append(back);
  });
}

export function starBurst(x, y) {
  const s = el('div', { class: 'star-burst' }, '★');
  s.style.left = x + 'px'; s.style.top = y + 'px'; document.body.append(s);
  setTimeout(() => s.remove(), 1200);
  confetti(40, { x, y, frames: 120 });
}

// Crea un elemento SVG real a partir de texto
export function svgEl(attrs, inner) {
  const d = document.createElement('div');
  d.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${inner}</svg>`;
  return d.firstElementChild;
}
