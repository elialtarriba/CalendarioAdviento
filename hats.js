// Día 1: atrapa los 3 gorros de Papá Noel; cada uno guarda una sorpresa
import { t, tx, getLang } from './i18n.js?v=17.3';
import { el, sleep, confetti, popup, svgEl } from './fx.js?v=17.3';
import { chime, pop, machine, scare, hohoho } from './sound.js?v=17.3';

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
const COOKIE = `<svg viewBox="0 0 100 100"><defs><radialGradient id="ck" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#f3c27a"/><stop offset=".75" stop-color="#d9964a"/><stop offset="1" stop-color="#b8742f"/></radialGradient></defs>
<path d="M50 6c8 0 10 5 17 6s12 2 15 9 0 11 4 17 6 11 2 18-9 7-12 13-4 13-12 15-13-2-19 0-12 6-19 1-5-12-10-17-12-6-13-14 6-12 5-19-6-12-1-18 12-4 18-9 9-12 25-11z" fill="url(#ck)"/>
<g fill="#5b3216"><ellipse cx="28" cy="34" rx="5" ry="4"/><ellipse cx="70" cy="30" rx="4.5" ry="3.5"/><ellipse cx="76" cy="62" rx="5" ry="4"/><ellipse cx="26" cy="66" rx="4" ry="3.5"/><ellipse cx="52" cy="80" rx="4.5" ry="3.5"/></g>
<g fill="#2b1608"><ellipse cx="40" cy="48" rx="4" ry="5"/><ellipse cx="60" cy="48" rx="4" ry="5"/></g><g fill="#fff"><circle cx="41.5" cy="46" r="1.6"/><circle cx="61.5" cy="46" r="1.6"/></g>
<path d="M41 60q9 9 18 0" stroke="#2b1608" stroke-width="3.2" fill="none" stroke-linecap="round"/><g fill="#f28b8b" opacity=".7"><ellipse cx="32" cy="57" rx="5" ry="3"/><ellipse cx="68" cy="57" rx="5" ry="3"/></g></svg>`;
const SANTA = `<svg viewBox="0 0 120 120"><path d="M22 52C26 18 64 4 92 22c10 7 14 20 10 30H22z" fill="#d6203a"/><circle cx="100" cy="24" r="9" fill="#fff"/>
<rect x="16" y="46" width="88" height="16" rx="8" fill="#fff"/><ellipse cx="60" cy="72" rx="30" ry="22" fill="#f6cfae"/>
<path d="M28 74c0 30 14 42 32 42s32-12 32-42c-6 8-14 10-20 8-4 6-20 6-24 0-6 2-14 0-20-8z" fill="#fff"/><path d="M46 80q14-8 28 0q-14 6-28 0z" fill="#fff" stroke="#e8e8e8"/>
<ellipse cx="60" cy="74" rx="6" ry="5" fill="#f09a8a"/><g fill="#2b1608"><circle cx="48" cy="66" r="3.4"/><circle cx="72" cy="66" r="3.4"/></g>
<path d="M42 59q6-4 12 0M66 59q6-4 12 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
<g transform="rotate(-25 98 92)"><circle cx="98" cy="86" r="13" fill="#cfe9ff" fill-opacity=".55" stroke="#6b4423" stroke-width="5"/><rect x="95" y="98" width="6" height="20" rx="3" fill="#6b4423"/></g></svg>`;
const svgBox = (svg, cls) => { const d = el('span', { class: cls }); d.innerHTML = svg; return d; };

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
          const ck = el('button', { class: 'gd-cookie no-delay', 'aria-label': 'galleta' }); ck.innerHTML = COOKIE;
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
