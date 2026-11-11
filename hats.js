// Día 1: atrapa los 3 gorros de Papá Noel; cada uno guarda una sorpresa
import { t, tx, getLang } from './i18n.js?v=17.19';
import { el, sleep, confetti, popup, svgEl } from './fx.js?v=17.19';
import { chime, pop, machine, scare, hohoho } from './sound.js?v=17.19';

const HAT = 'ilu-gorro.webp'; // gorro pintado al estilo del calendario
const ilu = src => el('img', { src, class: 'ilu', alt: '', draggable: 'false' });

export function render(body, ctx) {
  const c = ctx.content;
  const area = el('div', { class: 'hats-area' });
  const counter = el('div', { class: 'hats-count' }, '🎅 0 / 3');
  body.append(el('h2', { class: 'q-title' }, '🎅 ' + (tx(c.hatsTitle) || t('hatsTitle'))), el('p', { class: 'game-help' }, tx(c.hatsHelp) || t('hatsHelp')), counter, area);
  let caught = 0, busy = false;
  const hats = [0, 1, 2].map(i => {
    const h = el('button', { class: 'hat no-delay', 'aria-label': 'gorro' }); h.append(ilu(HAT));
    area.append(h);
    return { el: h, x: 10 + i * 30, y: 10 + i * 20, vx: (Math.random() * .5 + .35) * (i % 2 ? -1 : 1), vy: Math.random() * .5 + .3, r: Math.random() * 360, done: false };
  });
  let raf;
  const tick = () => {
    const W = area.clientWidth - 80, H = area.clientHeight - 74;
    hats.forEach(h => {
      if (h.done) return;
      h.x += h.vx; h.y += h.vy; h.r += h.vx * 3;
      if (h.x < 0 || h.x > W) h.vx *= -1; if (h.y < 0 || h.y > H) h.vy *= -1;
      h.x = Math.max(0, Math.min(W, h.x)); h.y = Math.max(0, Math.min(H, h.y));
      h.el.style.transform = `translate(${h.x}px,${h.y}px) rotate(${Math.sin(h.r / 40) * 18}deg)`;
    });
    raf = requestAnimationFrame(tick);
  };
  requestAnimationFrame(() => { hats.forEach(h => { h.x = Math.random() * (area.clientWidth - 80); h.y = Math.random() * (area.clientHeight - 74); }); tick(); });
  ctx.finishBtn.addEventListener('click', () => cancelAnimationFrame(raf));

  if (ctx.prev) { hats.forEach(h => { h.done = true; h.el.classList.add('caught'); }); counter.textContent = '🎅 3 / 3 ✅'; return; }

  hats.forEach(h => h.el.addEventListener('click', async () => {
    if (h.done || busy) return;
    busy = true; h.done = true; caught++; pop(); confetti(60, { x: h.el.getBoundingClientRect().left + 40, y: h.el.getBoundingClientRect().top + 30, frames: 120 });
    h.el.classList.add('caught'); counter.textContent = `🎅 ${caught} / 3`;
    await sleep(350);
    if (caught === 1) await msgAnon(c);
    else if (caught === 2) await msgJoke(c);
    else { await goodDetector(c, ctx.settings?.figure || 'galleta'); await ctx.submit({ answer: '🎩🎩🎩', status: 'correct' }); cancelAnimationFrame(raf); ctx.finish(); return; }
    busy = false;
  }));
}

function card(...kids) { return el('div', { class: 'hat-pop' }, ...kids); }

function msgAnon(c) {
  return popup(card(
    el('div', { class: 'hat-pop-deco' }, '💌✨🎄'),
    el('h2', {}, tx(c.hat1Title) || t('hat1Title')),
    el('p', { class: 'hat-pop-text' }, tx(c.hat1Text) || t('hat1Text')),
    el('p', { class: 'hat-pop-small' }, tx(c.hatReminder) || t('hatReminder'))), { cls: 'small', buttons: [{ label: t('close'), value: true }] });
}

function msgJoke(c) {
  const ans = el('p', { class: 'hat-joke-a', style: 'display:none' }, tx(c.hat2Answer) || t('hat2Answer'));
  const btn = el('button', { class: 'btn btn-green small-btn', onclick: () => { ans.style.display = ''; btn.remove(); chime(); confetti(70); } }, '👉 ' + t('hat2Reveal'));
  return popup(card(
    el('div', { class: 'hat-pop-deco' }, '😂🎅🐝'),
    el('h2', {}, tx(c.hat2Title) || t('hat2Title')),
    el('p', { class: 'hat-pop-text' }, tx(c.hat2Joke) || t('hat2Joke')), btn, ans), { cls: 'small', buttons: [{ label: t('close'), value: true }] });
}

// dibujitos (en vez de emojis)
// dibujos al estilo del calendario: el duende de Papá Noel con su detector y la galleta
const COOKIE = 'ilu-18.webp';
const SANTA = 'ilu-17.webp';
const svgBox = (src, cls) => el('span', { class: cls }, ilu(src));

function goodDetector(c, fig = 'galleta') {
  return new Promise(resolve => {
    const goodT = el('span', { class: 'gd-good' }, '0%'), badT = el('span', { class: 'gd-bad' });
    const pct = el('div', { class: 'gd-pct' }, goodT, badT);
    const fill = el('div', { class: 'gd-fill' }), badFill = el('div', { class: 'gd-fill bad', style: 'display:none' });
    const bar = el('div', { class: 'gd-bar' }, fill, badFill);
    const res = el('div', { class: 'gd-res' });
    const go = el('button', { class: 'btn good-btn no-delay' }, t('gdBtn'));
    const box = el('div', { class: 'hat-pop gd' }, svgBox(SANTA, 'gd-santa-top'), el('h2', {}, t('gdTitle')), go);
    const back = el('div', { class: 'popup-back' }, el('div', { class: 'popup small' }, box));
    document.body.append(back);
    let cur = 0;
    const show = v => { cur = v; goodT.textContent = Math.round(v) + '%'; fill.style.width = v + '%'; badFill.style.width = (100 - v) + '%'; badT.textContent = v >= 99.5 ? '' : Math.round(100 - v) + '%'; };
    const animateTo = (to, ms) => new Promise(r => { const from = cur, t0 = performance.now(); (function f(now) { const k = Math.min(1, (now - t0) / ms); show(from + (to - from) * (1 - Math.pow(1 - k, 2))); if (k < 1) requestAnimationFrame(f); else r(); })(t0); });
    go.onclick = async () => {
      go.remove(); box.append(el('div', { class: 'gd-machine' }, pct, bar), res);
      machine(4.2);
      await animateTo(87, 4000);
      await sleep(400);
      scare(); box.classList.add('shake-hard');
      badFill.style.display = ''; show(87);
      await sleep(900); box.classList.remove('shake-hard');
      res.append(svgBox(SANTA, 'gd-santa'), el('p', { class: 'gd-text' }, tx(c.gdResult) || t('gdResult')));
      hohoho();
      await sleep(1200);
      // ---- ¡Mejora tu porcentaje!: sobornar a Papá Noel con galletas
      const better = el('button', { class: 'btn btn-big no-delay gd-better', onclick: () => {
        better.remove(); res.replaceChildren();
        const msg = el('p', { class: 'gd-text' }, t('gdBribeMsg'));
        const cookies = el('div', { class: 'gd-cookies' });
        const steps = [91, 96, 100]; let eaten = 0;
        for (let i = 0; i < 3; i++) {
          const ck = el('button', { class: 'gd-cookie no-delay', 'aria-label': 'galleta' }); ck.append(ilu(COOKIE));
          ck.style.animationDelay = (i * .25) + 's';
          ck.onclick = async () => {
            if (ck.classList.contains('eaten')) return;
            ck.classList.add('eaten'); pop();
            const nam = el('span', { class: 'gd-nam' }, t('gdNam')); ck.append(nam);
            const target = steps[eaten++];
            await animateTo(target, 700); chime();
            if (target === 100) {
              confetti(220); hohoho();
              await sleep(500);
              res.append(el('p', { class: 'gd-final' }, t('gdFinal')),
                el('button', { class: 'btn btn-big no-delay', onclick: () => { back.remove(); resolve(); } }, fig === 'galleta' ? '🏠 ' + t('gdHome') : '✨ ' + t('gdToAct')));
            }
          };
          cookies.append(ck);
        }
        res.append(el('h3', { class: 'gd-bribe-t' }, svgBox(COOKIE, 'gd-mini-cookie'), ' ', t('gdBribe')), msg, cookies);
      } }, '📈 ' + t('gdBetter'));
      res.append(better);
    };
  });
}
