// 25 partidas distintas por juego: cada vez que se entra se juega la siguiente; después de la 25 vuelve a la 1.
// El número de partida se guarda en el móvil. Las partidas salen siempre iguales para un mismo número (semilla).
export const TOTAL = 25;
export function nextGame(name) {
  let i = 0;
  try { i = +(localStorage.getItem('adv_g25_' + name) || 0) % TOTAL; localStorage.setItem('adv_g25_' + name, String((i + 1) % TOTAL)); } catch { i = Math.floor(Math.random() * TOTAL); }
  return i; // 0..24
}
// generador de números al azar con semilla (mulberry32)
export function rng(seed) {
  let a = (seed * 2654435761) >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
