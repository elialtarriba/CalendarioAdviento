// Final del calendario (día 25): una bola de nieve que cobra vida.
// Bola de cristal sobre base dorada con un pueblecito dentro (ventanas iluminadas, árbol, tren).
// Al deslizar el dedo se levanta una tormenta de nieve; luego la cámara entra en el paisaje,
// el tren pasa por delante, se encienden las luces y aparece «Feliz Navidad» entre destellos dorados.
import { el, sleep } from './fx.js?v=18.8';
import { getLang } from './i18n.js?v=18.8';
import { chime, whistle, christmasSong, unlockAudio } from './sound.js?v=18.8';

const L = (es, ca, en) => ({ es, ca, en })[getLang()] ?? es;
const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

export function snowGlobe() {
  return new Promise(resolve => {
    const cv = el('canvas', { class: 'globe-cv' });
    const hint = el('div', { class: 'globe-hint' }, '👆 ' + L('Desliza el dedo por la bola para levantar una tormenta de nieve', 'Llisca el dit per la bola per aixecar una tempesta de neu', 'Swipe your finger over the globe to stir up a snowstorm'));
    const done = el('button', { class: 'btn btn-big globe-done no-delay' }, '🏠 ' + L('Volver al inicio', 'Tornar a l’inici', 'Back to home'));
    const wrap = el('div', { class: 'globe-wrap' }, cv, hint, done);
    document.body.append(wrap);
    const g = cv.getContext('2d');
    let W, H, dpr;
    const size = () => { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; };
    size(); addEventListener('resize', size);
    let music = null; try { unlockAudio(); music = christmasSong(); } catch {}

    // ---------------- estado
    const R0 = () => Math.min(W * .4, H * .27);           // radio de la bola
    const C0 = () => [W / 2, H * .42];                    // centro de la bola
    let phase = 'globe', t0 = performance.now(), phaseAt = t0, storm = 0, swiped = 0, lights = .35, finalAt = 0, insideAt = 0;
    // nieve dentro de la bola (coordenadas de la bola: radio 1)
    const flakes = Array.from({ length: 170 }, () => ({ x: (Math.random() - .5) * 1.3, y: -.8 + Math.random() * 1.3, vx: 0, vy: 0, r: .008 + Math.random() * .016 }));
    // nieve de pantalla completa (cuando entramos)
    const big = Array.from({ length: 220 }, () => ({ x: Math.random(), y: Math.random(), s: .3 + Math.random(), r: 1 + Math.random() * 3.5, w: Math.random() * 6 }));
    const sparks = [];
    let last = null;
    const onMove = e => {
      const p = e.touches ? e.touches[0] : e; if (!p) return;
      if (last) {
        const dx = p.clientX - last[0], dy = p.clientY - last[1], d = Math.hypot(dx, dy);
        const [cx, cy] = C0(), R = R0();
        if (phase === 'globe' && Math.hypot(p.clientX - cx, p.clientY - cy) < R * 1.25) {
          storm = Math.min(1.6, storm + d / 260); swiped += d;
          const imp = Math.min(.03, d / R * .06); for (const f of flakes) { f.vx += (dx / (d || 1) * .5 + (Math.random() - .5) * 2) * imp; f.vy += (dy / (d || 1) * .5 + (Math.random() - .5) * 2) * imp - Math.random() * imp * .6; }
          hint.classList.add('hide');
        }
      }
      last = [p.clientX, p.clientY];
      if (e.cancelable && phase === 'globe') e.preventDefault();
    };
    const onUp = () => { last = null; };
    cv.addEventListener('pointerdown', e => { last = [e.clientX, e.clientY]; });
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('touchmove', onMove, { passive: false });
    ['pointerup', 'pointercancel', 'touchend'].forEach(ev => cv.addEventListener(ev, onUp));

    // ---------------- dibujos pintados (los mismos del calendario)
    const IM = {};
    const load = (k, src) => new Promise(r => { const i = new Image(); i.onload = () => { IM[k] = i; r(); }; i.onerror = r; i.src = src; });
    const ready = Promise.all([['bola', 'ilu-7.webp'], ['casa', 'ilu-10.webp'], ['tren', 'ilu-21.webp'], ['arbol', 'ilu-5.webp'], ['farol', 'ilu-20.webp'],
      ['muneco', 'ilu-3.webp'], ['regalos', 'ilu-gl.webp']].map(([k, s]) => load(k, s)));
    // dibuja una imagen apoyada en (x, base) con altura h
    const put = (k, x, base, h, a = 1) => { const i = IM[k]; if (!i) return null; const w = h * i.width / i.height; g.save(); g.globalAlpha *= a; g.drawImage(i, x - w / 2, base - h, w, h); g.restore(); return { x: x - w / 2, y: base - h, w, h }; };
    const glow = (x, y, r, col, a) => { if (a <= 0) return; g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, col); q.addColorStop(1, 'rgba(255,180,60,0)'); g.fillStyle = q; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.restore(); };

    // la bola: el cristal de la imagen tiene el centro en (.5, .405) y radio .48 del ancho
    function globeImg(cx, cy, R, t, a) {
      const i = IM.bola; if (!i) return;
      const w = 2 * R / .96, h = w * i.height / i.width, x = cx - w / 2, y = cy - .405 * h;
      g.save(); g.globalAlpha = a;
      // halo cálido detrás
      glow(cx, cy + R * .2, R * 1.5, 'rgba(255,214,120,.35)', a);
      g.drawImage(i, x, y, w, h);
      // ventanas que se encienden
      [[.465, .46], [.47, .63], [.7, .62], [.4, .63]].forEach(([u, v], n) => glow(x + u * w, y + v * h, R * .16, 'rgba(255,220,130,.9)', a * lights * (.55 + .25 * Math.sin(t * 2.5 + n))));
      g.restore();
    }
    // el pueblo por dentro (pantalla completa)
    function inside(t, a, now) {
      g.save(); g.globalAlpha = a;
      const sky = g.createLinearGradient(0, 0, 0, H * .7); sky.addColorStop(0, '#081230'); sky.addColorStop(.6, '#1d3268'); sky.addColorStop(1, '#5a5f99');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.fillStyle = '#fff'; for (let i = 0; i < 60; i++) { g.globalAlpha = a * (.25 + .6 * Math.abs(Math.sin(t * .9 + i * 1.7))); const sx = (i * 137.5) % W, sy = (i * 71.3) % (H * .5); g.fillRect(sx, sy, 1.6, 1.6); }
      g.globalAlpha = a;
      glow(W * .82, H * .1, Math.min(W, H) * .12, 'rgba(255,250,225,.55)', a * .8);
      // colinas nevadas
      const hy = H * .6;
      g.fillStyle = '#c9d6ef'; g.beginPath(); g.moveTo(0, hy); g.quadraticCurveTo(W * .25, hy - H * .07, W * .5, hy - H * .01); g.quadraticCurveTo(W * .78, hy - H * .08, W, hy - H * .02); g.lineTo(W, H); g.lineTo(0, H); g.fill();
      const sn = g.createLinearGradient(0, H * .62, 0, H); sn.addColorStop(0, '#eef3fb'); sn.addColorStop(1, '#ffffff');
      g.fillStyle = sn; g.beginPath(); g.moveTo(0, H * .66); g.quadraticCurveTo(W * .5, H * .6, W, H * .66); g.lineTo(W, H); g.lineTo(0, H); g.fill();
      const U = Math.min(H, W * 1.9);              // unidad para que quepa en pantallas anchas y estrechas
      // árboles del fondo
      const tr = put('arbol', W * .14, H * .67, U * .33);
      put('arbol', W * .9, H * .65, U * .24, .95);
      // la casita
      const hs = put('casa', W * .52, H * .71, U * .36);
      // farol y regalos
      const fa = put('farol', W * .83, H * .79, U * .16);
      put('regalos', W * .2, H * .8, U * .1);
      put('muneco', W * .68, H * .82, U * .13);
      // luces: ventanas, puerta, farol, árbol y guirnalda
      if (hs) [[.2, .68], [.64, .68], [.85, .68], [.42, .76]].forEach(([u, v], n) => glow(hs.x + u * hs.w, hs.y + v * hs.h, U * .07, 'rgba(255,214,120,.95)', lights * (.7 + .3 * Math.sin(t * 3 + n))));
      if (fa) glow(fa.x + fa.w * .5, fa.y + fa.h * .55, U * .1, 'rgba(255,200,100,.95)', lights);
      if (tr) for (let i = 0; i < 14; i++) { const k = i / 14; glow(tr.x + tr.w * (.5 + Math.sin(i * 2.3) * .32 * (.35 + k * .65)), tr.y + tr.h * (.18 + k * .7), U * .018, ['rgba(255,90,90,1)', 'rgba(255,214,74,1)', 'rgba(120,200,255,1)'][i % 3], lights * (.5 + .5 * Math.sin(t * 4 + i))); }
      if (hs && tr) for (let i = 0; i <= 14; i++) { const k = i / 14, x0 = tr.x + tr.w * .78, x1 = hs.x + hs.w * .12, lx = x0 + (x1 - x0) * k, ly = tr.y + tr.h * .45 + Math.sin(k * Math.PI) * U * .035 + (hs.y + hs.h * .42 - tr.y - tr.h * .45) * k;
        glow(lx, ly, U * .014, ['rgba(255,110,110,1)', 'rgba(255,220,90,1)', 'rgba(130,240,160,1)', 'rgba(120,190,255,1)'][i % 4], lights * (.6 + .4 * Math.sin(t * 5 + i))); }
      // vía y tren que pasa por delante (de derecha a izquierda, con humo)
      const ry = H * .93;
      g.fillStyle = '#7a5532'; for (let x = -20; x < W + 20; x += U * .05) g.fillRect(x, ry - U * .006, U * .028, U * .016);
      g.fillStyle = '#9aa3ad'; g.fillRect(0, ry - U * .012, W, U * .006);
      if (phase === 'inside' || phase === 'final') {
        const th = U * .2, tw = th * (IM.tren ? IM.tren.width / IM.tren.height : 1.3);
        const k = (((now - insideAt) / 1000) % 9) / 6.5; const tx = W + tw * .6 - clamp(k, 0, 1.15) * (W + tw * 1.4);
        for (let i = 0; i < 6; i++) { const q = ((t * .8 + i / 6) % 1); g.save(); g.globalAlpha = a * .5 * (1 - q); g.fillStyle = '#f4f6ff'; g.beginPath(); g.arc(tx - tw * .37 + q * tw * .5, ry - th * .98 - q * th * .9, th * (.06 + q * .16), 0, 7); g.fill(); g.restore(); }
        put('tren', tx, ry + th * .02, th);
        glow(tx - tw * .48, ry - th * .45, th * .35, 'rgba(255,240,180,.9)', lights * .8);
      }
      g.restore();
    }

    // ---------------- bucle de dibujo
    let raf;
    const frame = now => {
      const t = (now - t0) / 1000, pt = (now - phaseAt) / 1000;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      // fondo: noche con luces cálidas
      const bg = g.createRadialGradient(W / 2, H * .45, 10, W / 2, H * .5, Math.max(W, H));
      bg.addColorStop(0, '#3a1a2e'); bg.addColorStop(.6, '#160b1d'); bg.addColorStop(1, '#07040c');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 14; i++) { const bx = (i * 97) % W, by = (i * 53) % H; g.globalAlpha = .12 + .1 * Math.sin(t + i); g.fillStyle = '#ffcf7a'; g.beginPath(); g.arc(bx, by, 18 + (i % 4) * 8, 0, 7); g.fill(); } g.globalAlpha = 1;

      // cámara: de la bola hacia dentro del pueblo
      let z = 1, k = 0;
      if (phase === 'zoom') { k = ease(clamp(pt / 2.6)); z = 1 + k * 4; }
      else if (phase === 'inside' || phase === 'final') { z = 5; k = 1; }
      const [gx, gy] = C0(), R = R0();
      const fx = .1, fy = .32;                         // la casita dentro de la bola
      const cx = gx - fx * R * (z - 1), cy = gy - fy * R * (z - 1), S = R * z;
      const ia = clamp((k - .45) / .45);               // fundido hacia el pueblo de dentro
      if (ia < 1) {
        globeImg(cx, cy, S, t, 1);
        // nieve dentro de la bola
        if (phase === 'globe' || phase === 'zoom') {
          storm *= .985;
          g.save(); g.beginPath(); g.arc(cx, cy, S * .95, 0, 7); g.clip();
          for (const f of flakes) {
            // nevada suave siempre; al remover la bola, remolino
            f.vy += .00025 - f.vy * .02 + (Math.random() - .5) * storm * .006; f.vx += (Math.random() - .5) * (.0003 + storm * .008);
            f.x += f.vx; f.y += f.vy; f.vx *= .965; f.vy *= .965;
            const d = Math.hypot(f.x, f.y); if (d > .75) { f.vx -= f.x * .004; f.vy -= f.y * .004; } if (d > .9) { f.x *= .9 / d; f.y *= .9 / d; f.vx *= -.3; f.vy *= -.3; }
            if (f.y > .5 && storm < .15) { f.y = -.75 + Math.random() * .2; f.x = (Math.random() - .5) * 1.3; f.vy = 0; }
            g.fillStyle = '#fff'; g.globalAlpha = .95; g.beginPath(); g.arc(cx + f.x * S, cy + f.y * S, Math.max(1.3, f.r * S), 0, 7); g.fill();
          }
          g.restore(); g.globalAlpha = 1;
        }
      }
      if (ia > 0) inside(t, ia, now);

      // dentro: nieve a pantalla completa
      if (ia > 0) {
        for (const b of big) {
          b.y += .0016 * b.s; b.x += Math.sin(t * .8 + b.w) * .0006; if (b.y > 1.02) { b.y = -.02; b.x = Math.random(); }
          g.globalAlpha = .85 * ia; g.fillStyle = '#fff'; g.beginPath(); g.arc(b.x * W, b.y * H, b.r * (1 + b.s * .6), 0, 7); g.fill();
        }
        g.globalAlpha = 1;
        if (phase === 'inside') lights = clamp(.35 + pt * .2, .35, 1);
      }
      // final: «Feliz Navidad» entre destellos dorados
      if (phase === 'final') {
        const k = clamp((now - finalAt) / 1500);
        if (Math.random() < .5) for (let i = 0; i < 3; i++) sparks.push({ x: W / 2 + (Math.random() - .5) * W * .8, y: H * .17 + (Math.random() - .5) * H * .14, vx: (Math.random() - .5) * 1.2, vy: -Math.random() * 1.4, life: 1, r: 1 + Math.random() * 2.5 });
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i]; s.x += s.vx; s.y += s.vy; s.vy += .02; s.life -= .012; if (s.life <= 0) { sparks.splice(i, 1); continue; }
          g.save(); g.globalAlpha = s.life; g.fillStyle = '#ffe9a8'; g.shadowColor = '#ffd24a'; g.shadowBlur = 10; g.translate(s.x, s.y); g.rotate(t * 2);
          g.fillRect(-s.r * 2, -s.r * .3, s.r * 4, s.r * .6); g.fillRect(-s.r * .3, -s.r * 2, s.r * .6, s.r * 4); g.restore();
        }
        g.save(); g.globalAlpha = k; g.textAlign = 'center'; g.textBaseline = 'middle';
        const fs = Math.min(W * .125, 84); g.font = `700 ${fs}px 'Mountains of Christmas', cursive`;
        const ty = H * .17; const tg = g.createLinearGradient(0, ty - fs / 2, 0, ty + fs / 2); tg.addColorStop(0, '#fff6c2'); tg.addColorStop(.5, '#f2c14e'); tg.addColorStop(1, '#b8860b');
        g.shadowColor = '#ffd24a'; g.shadowBlur = 24; g.fillStyle = tg;
        const sc = .8 + .2 * ease(k); g.translate(W / 2, ty); g.scale(sc, sc);
        g.fillText(L('Feliz Navidad', 'Bon Nadal', 'Merry Christmas'), 0, 0); g.restore();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // ---------------- guion
    const go = (p) => { phase = p; phaseAt = performance.now(); };
    (async () => {
      // espera a que levanten la tormenta (o sigue sola a los 14 s)
      const start = performance.now();
      while (phase === 'globe') {
        await sleep(200);
        if (swiped > 420 && storm < .5) { await sleep(1800); break; }
        if (performance.now() - start > 14000) { storm = 1.2; flakes.forEach(f => { f.vx += (Math.random() - .5) * .08; f.vy -= Math.random() * .06; }); await sleep(2500); break; }
      }
      hint.classList.add('hide');
      go('zoom'); await sleep(2700);
      insideAt = performance.now(); go('inside'); setTimeout(whistle, 900); await sleep(5600);
      finalAt = performance.now(); go('final'); chime(); setTimeout(chime, 600);
      await sleep(1800);
      done.classList.add('show');
    })();
    done.onclick = () => {
      cancelAnimationFrame(raf); removeEventListener('resize', size); music?.stop(2);
      wrap.classList.add('out'); setTimeout(() => { wrap.remove(); resolve(); }, 600);
    };
  });
}
