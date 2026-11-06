// Día 13: máquina que comprueba si has sido bueno
import { t, getLang } from './i18n.js?v=9';
import { el, sleep, confetti } from './fx.js?v=9';
import { machine, speak } from './sound.js?v=9';

export function render(body, ctx) {
  const lines = el('div', { class: 'machine-lines' });
  const box = el('div', { class: 'machine' }, lines);
  const btn = el('button', { class: 'btn good-btn' }, t('d13btn'));
  const wrap = el('div', { class: 'good-check' }, el('h2', { class: 'good-title' }, '😇 ' + t('d13title') + ' 😈'), box, btn);
  body.append(wrap);
  const src = t('d13lines');
  lines.innerHTML = Array.from({ length: 40 }, (_, i) => `<div>${src[i % src.length]} ${'▓'.repeat(3 + i % 7)}</div>`).join('');
  btn.onclick = async () => {
    btn.disabled = true; btn.textContent = t('d13analyzing');
    const secs = 4.5; machine(secs);
    const t0 = performance.now();
    await new Promise(res => (function f(now) {
      const k = (now - t0) / (secs * 1000);
      lines.style.top = (-((Math.sin(k * 14) + 1) * 400 + k * 300)) + 'px';
      if (k < 1) requestAnimationFrame(f); else res();
    })(t0));
    lines.remove();
    box.append(el('div', { class: 'machine-result' }, t('d13result')));
    btn.remove(); confetti(80);
    await ctx.submit({ answer: '87%', status: 'correct' });
    await speak(t('d13result'), getLang(), { hoho: true });
    await sleep(1500);
    wrap.classList.add('vanish'); await sleep(1000);
    ctx.finish();
  };
}
