import { t, tx } from './i18n.js?v=20';
import { el, sleep, confetti, borderLights } from './fx.js?v=20';
import { chime, wrong } from './sound.js?v=20';

export function render(body, ctx) {
  const c = ctx.content;
  const opts = tx(c.options) || [];
  const fb = el('div', { class: 'q-feedback' });
  const buttons = opts.map((o, i) => el('button', { class: 'q-opt', onclick: () => choose(i) },
    el('span', { class: 'letter' }, 'ABCD'[i]), el('span', {}, o)));
  body.append(
    el('h2', { class: 'q-title' }, tx(c.q)),
    el('p', { class: 'game-help muted' }, t('chooseOne')),
    el('div', { class: 'q-options' }, buttons), fb);

  async function choose(i) {
    buttons.forEach(b => b.disabled = true);
    const ok = i === +c.correct;
    buttons[i].classList.add(ok ? 'right' : 'wrong');
    if (ok) {
      chime(); confetti(140);
      fb.textContent = t('rightAnswer');
      const stop = borderLights();
      const fin = ctx.finishBtn.onclick;
      ctx.finishBtn.onclick = () => { stop(); fin(); };
    } else {
      wrong();
      buttons[+c.correct]?.classList.add('right');
      fb.textContent = `${t('wrongAnswer')} ${'ABCD'[+c.correct]}`;
    }
    await ctx.submit({ answer: opts[i] ?? i, status: ok ? 'correct' : 'incorrect', extra: { choice: i } });
  }
}
