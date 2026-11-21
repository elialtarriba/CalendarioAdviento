// =====================================================================
//  VERSIÓN Y CORREO DE CONTACTO — el ÚNICO sitio donde se cambian (V23.5)
//  · Nueva versión: cambia solo APP_VERSION (y sube este archivo + los que hayan cambiado).
//  · El resto de archivos ya no llevan el número de versión (…?v=), así no hay que tocarlos.
// =====================================================================
export const APP_VERSION = 'V27.5';

// Correo que ven los jugadores (la «i» de la pantalla de la nieve)
export const CONTACT_EMAIL = 'bisbetjoy@gmail.com';

// La cuenta con la que entra la administradora NO está escrita en ningún archivo:
// solo su huella (SHA-256), que no se puede «deshacer» para leer el correo.
export const OWNER_HASH = 'ee23a431f55e0250e0dc5aa98ac9520e7f526d62c4e802b96ca4fd1b4ff45466';

export async function sha256Hex(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s)));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
// ¿Es este correo el de la administradora? (compara huellas, nunca el correo)
export async function isOwnerEmail(e) {
  const m = String(e || '').trim().toLowerCase();
  return !!m && (await sha256Hex(m)) === OWNER_HASH;
}
