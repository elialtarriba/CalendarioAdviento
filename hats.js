// Día 1: atrapa los 3 gorros de Papá Noel; cada uno guarda una sorpresa
import { t, tx, getLang } from './i18n.js?v=15.8';
import { el, sleep, confetti, popup, svgEl } from './fx.js?v=15.8';
import { chime, pop, machine, scare, hohoho } from './sound.js?v=15.8';

const HAT = `<svg viewBox="0 0 120 110"><path d="M18 78 C24 36 52 8 92 18 C110 24 112 46 102 58 C96 44 86 40 78 44 C66 52 64 68 66 78 Z" fill="#d6203a"/>
<path d="M26 76 C34 44 56 24 86 26" stroke="#ff6b7d" stroke-width="5" fill="none" opacity=".6"/>
<circle cx="104" cy="60" r="12" fill="#fff"/><rect x="8" y="72" width="72" height="22" rx="11" fill="#fff"/>
<path d="M14 80 h60" stroke="#e8eef5" stroke-width="4"/></svg>`;

export function render(body, ctx) {
  const c = ctx.content;
  const area = el('div', { class: 'hats-area' });
  const counter = el('div', { class: 'hats-count' }, '🎅 0 / 3');
  body.append(el('h2', { class: 'q-title' }, '🎅 ' + (tx(c.hatsTitle) || t('hatsTitle'))), el('p', { class: 'game-help' }, tx(c.hatsHelp) || t('hatsHelp')), counter, area);
  let caught = 0, busy = false;
  const hats = [0, 1, 2].map(i => {
    const h = el('button', { class: 'hat no-delay', 'aria-label': 'gorro' }); h.append(svgEl('viewBox="0 0 120 110"', HAT.replace(/<svg[^>]*>|<\/svg>/g, '')));
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
    else { await goodDetector(c); await ctx.submit({ answer: '🎩🎩🎩', status: 'correct' }); cancelAnimationFrame(raf); ctx.finish(); return; }
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

function goodDetector(c) {
  return new Promise(resolve => {
    const pct = el('div', { class: 'gd-pct' }, el('span', { class: 'gd-good' }, '0%'), el('span', { class: 'gd-bad' }));
    const bar = el('div', { class: 'gd-bar' }, el('div', { class: 'gd-fill' }));
    const res = el('div', { class: 'gd-res' });
    const go = el('button', { class: 'btn good-btn no-delay' }, t('gdBtn'));
    const box = el('div', { class: 'hat-pop gd' }, el('div', { class: 'hat-pop-deco' }, '🎅 1.'), el('h2', {}, t('gdTitle')), go);
    const back = el('div', { class: 'popup-back' }, el('div', { class: 'popup small' }, box));
    document.body.append(back);
    go.onclick = async () => {
      go.remove(); box.append(el('div', { class: 'gd-machine' }, pct, bar), res);
      machine(4.2);
      const good = pct.querySelector('.gd-good'), fill = bar.firstChild;
      const t0 = performance.now();
      await new Promise(r => (function f(now) {
        const k = Math.min(1, (now - t0) / 4000), v = Math.round(87 * (1 - Math.pow(1 - k, 2)));
        good.textContent = v + '%'; fill.style.width = v + '%';
        if (k < 1) requestAnimationFrame(f); else r();
      })(t0));
      await sleep(400);
      scare(); box.classList.add('shake-hard');
      pct.querySelector('.gd-bad').textContent = '13%'; bar.append(el('div', { class: 'gd-fill bad' }));
      await sleep(900); box.classList.remove('shake-hard');
      res.append(el('div', { class: 'gd-santa' }, '🎅', el('span', {}, '🔍')),
        el('p', { class: 'gd-text' }, tx(c.gdResult) || t('gdResult')));
      hohoho();
      await sleep(1200);
      res.append(el('button', { class: 'btn btn-big', onclick: () => { back.remove(); resolve(); } }, '🎉 ' + t('gdDone')));
    };
  });
}
