// Guía de la app (para la administradora): pantalla completa, índice, dibujos y zoom con dos dedos
import { el } from './fx.js?v=19.2';
import { getLang } from './i18n.js?v=19.2';
import { PORTADAS, PAPERS } from './defaults.js?v=19.2';
import { figure, S } from './app.js?v=19.2';
import { store } from './store.js?v=19.2';
import { toast } from './fx.js?v=19.2';
// una ventanita del calendario (recortada del tema «Cosas Navidad»), como las de la portada
function doorCrop(d = 1, cls = '') {
  const v = PORTADAS[0].variants.find(x => /movil/.test(x.img)) || PORTADAS[0].variants[0];
  const [cx, cy, w, h] = v.spots[d], L0 = cx - w / 2, T0 = cy - h / 2;
  return el('span', { class: 'hg-door-crop ' + cls, style: `background-image:url(${v.img});background-size:${v.w / w * 100}% ${v.h / h * 100}%;background-position:${L0 / (v.w - w) * 100}% ${T0 / (v.h - h) * 100}%` });
}
const FIG_IMG = { galleta: 'galleta.png', arbol: 'arbol.png', gnomo: 'gnomo.png' };
let LANG = 'es';
const L = (es, ca, en) => ({ es, ca, en })[LANG] ?? es;

// ---------- piezas de dibujo (imitan los botones reales de la app)
const fig = (src, cls = '') => el('img', { class: 'hg-fig ' + cls, src, alt: '' });
const pill = (txt, cls = '') => el('span', { class: 'hg-pill ' + cls }, txt);
const btn = (txt, cls = '') => el('span', { class: 'hg-btn ' + cls }, txt);
const tip = (...k) => el('div', { class: 'hg-tip' }, el('b', {}, L('💡 Truco: ', '💡 Truc: ', '💡 Tip: ')), ...k);
const warn = (...k) => el('div', { class: 'hg-tip warn' }, el('b', {}, L('⚠️ Ojo: ', '⚠️ Compte: ', '⚠️ Note: ')), ...k);
const steps = (...items) => el('ol', { class: 'hg-steps' }, ...items.map(i => el('li', {}, i)));
const mock = (title, ...k) => el('div', { class: 'hg-mock' }, title ? el('div', { class: 'hg-mock-bar' }, el('i'), el('i'), el('i'), el('span', {}, title)) : null, el('div', { class: 'hg-mock-body' }, ...k));
const row = (...k) => el('div', { class: 'hg-row' }, ...k);
const P = (...k) => el('p', {}, ...k);
const B = t => el('b', {}, t);
const sw = (on, label) => el('span', { class: 'hg-switch' + (on ? ' on' : '') }, el('span'), label);

const SECTIONS = [
  { id: 'app', ico: '🎄', title: 'Cómo funciona el calendario', color: '#b3122e', body: () => [
    P('Todos entran por la pantalla de la nieve: cada jugador con su ', B('nombre y un PIN de 4 números'), ' (se lo inventa la primera vez; tú lo ves en «Usuarios»). Tú, con «🔑 Soy la administradora». Ve un calendario con ', B('25 casillas'), ' (del 1 al 25 de diciembre). Cada casilla se puede abrir a partir de las ', B('00:00 de ese día'), ' (hora de España). Antes, la casilla tiembla y no se abre.'),
    mock('Portada', el('div', { class: 'hg-board' }, ...Array.from({ length: 10 }, (_, i) => el('span', { class: 'hg-door' + (i < 3 ? ' done' : '') }, i + 1)))),
    P('Al abrir una casilla, la puerta se ilumina, se abre y sale una ', B('nota'), ' con el reto del día: una pregunta, un juego, un vídeo…'),
    el('h4', {}, 'La figura de cada persona'),
    P('Tú decides qué figura tiene cada persona (en ', B('Usuarios'), '). La figura también decide si tiene actividad extra:'),
    row(el('div', { class: 'hg-card' }, fig('galleta.png'), B('Galleta'), el('small', {}, 'Solo el reto de la casilla.')),
      el('div', { class: 'hg-card' }, fig('arbol.png'), B('Árbol'), el('small', {}, 'Reto + Actividad 1 al terminar.')),
      el('div', { class: 'hg-card' }, fig('gnomo.png'), B('Gnomo'), el('small', {}, 'Reto + Actividad 2 al terminar.'))),
    P('Cuando una persona con árbol o gnomo termina el reto, ', B('el papel se arruga'), ' y aparece su actividad. Si pulsa «Cancelar (lo haré luego)», la próxima vez que abra esa casilla se le recordará.'),
    el('h4', {}, 'La franja de figuras (arriba)'),
    row(el('div', { class: 'hg-card' }, fig('gnomo.png', 'glow'), B('Iluminada'), el('small', {}, 'Casilla bien hecha.')),
      el('div', { class: 'hg-card' }, fig('gnomo.png', 'gray'), B('En gris'), el('small', {}, 'Pendiente o sin abrir.')),
      el('div', { class: 'hg-card' }, el('div', { class: 'hg-troll' }, '🧌'), B('Duende verde'), el('small', {}, 'Mal hecha o día olvidado.'))),
    P('Al tocar una figura sale el resultado de ese día. Al tocar el duende verde se explica por qué no salió bien y se dan ánimos.'),
    tip('Si no quieres que alguien vea la franja, desactívala en ', B('Usuarios → Configurar'), '.'),
  ] },
  { id: 'users-side', ico: '🙋', title: 'Lo que ve y puede cambiar cada persona', color: '#1f6b45', body: () => [
    P('Arriba a la derecha cada persona tiene tres botones:'),
    row(el('div', { class: 'hg-card' }, el('div', { class: 'hg-big' }, '⚙️'), B('Mis opciones'), el('small', {}, 'Nombre, idioma, tema y papel.')),
      el('div', { class: 'hg-card' }, el('div', { class: 'hg-big' }, '🔒'), B('Configuración'), el('small', {}, 'Solo con tu contraseña.')),
      el('div', { class: 'hg-card' }, el('div', { class: 'hg-big' }, '🚪'), B('Salir'), el('small', {}, 'Cerrar sesión.'))),
    el('h4', {}, 'Temas del calendario'),
    el('div', { class: 'hg-themes' }, ...[['regalos', 'Cosas Navidad'], ['galletas', 'Galletas'], ['toyshop', 'Mansión'], ['papanoel-color', 'Papá Noel'], ['somosnavidad', 'Somos Navidad'], ['numeros', 'Números']].map(([id, n]) =>
      el('figure', {}, el('img', { src: `tema-${id}-movil.jpg`, alt: '' }), el('figcaption', {}, n)))),
    P('Cada tema tiene tres versiones (móvil, iPad y ordenador): la app elige sola la que mejor encaja.'),
    el('h4', {}, 'Otras cosas que ve'),
    steps(el('span', {}, B('Bienvenida con nieve'), ' y música de «Navidad, Navidad, dulce Navidad». En iPhone suena al tocar la pantalla.'),
      el('span', {}, B('Cinta que se mueve'), ' con un mensaje (general o solo para esa persona).'),
      el('span', {}, B('Mensajes sorpresa'), ' que tú le preparas para un día concreto.'),
      el('span', {}, B('Premios'), ' (el trofeo 🏆 de la franja): se ven las reglas y cómo va.')),
  ] },
  { id: 'enter', ico: '🔐', title: 'Entrar en Configuración', color: '#7c3aed', body: () => [
    steps(el('span', {}, 'Pulsa el candado ', btn('🔒'), ' de arriba a la derecha.'),
      el('span', {}, 'Escribe la ', B('contraseña de configuración'), ' (la primera vez la eliges tú).'),
      el('span', {}, 'Pulsa ', btn('Entrar a configuración', 'red'), '.')),
    mock('⚙️ Configuración', el('div', { class: 'hg-special' }, '💌 ', B('Mensajes sorpresa')),
      el('div', { class: 'hg-tabs' }, pill('📨 Respuestas'), pill('👥 Usuarios'), pill('📅 Contenido de los días'), pill('🏆 Premios y ajustes')),
      el('div', { class: 'hg-help-btn' }, '📖 Guía de la app')),
    P('Arriba tienes el botón rojo de ', B('Mensajes sorpresa'), ' y debajo las cuatro pestañas. Abajo del todo, siempre a la vista, el botón ', B('Cerrar'), '.'),
    tip('Si olvidas la contraseña: entra con tu cuenta (elialtarriba@gmail.com), pulsa 🔒 y luego «¿Has olvidado la contraseña de configuración?». Podrás poner una nueva.'),
  ] },
  { id: 'surprise', ico: '💌', title: 'Mensajes sorpresa', color: '#e11d48', body: () => [
    P('Un ', B('popup bonito'), ' que le sale a una persona al entrar en la app, el día (o los días) que tú elijas. Detrás se ve la portada difuminada.'),
    steps(el('span', {}, 'Pulsa el botón rojo ', btn('💌 Mensajes sorpresa', 'red'), '.'),
      el('span', {}, 'Busca a la persona con el buscador 🔍 y tócala.'),
      el('span', {}, 'Pulsa ', btn('➕ Nuevo mensaje'), ' o ', btn('✏️ Editar'), ' uno que ya tengas.'),
      el('span', {}, 'Rellénalo y pulsa ', btn('💾 Guardar', 'green'), '.')),
    el('h4', {}, 'Cuándo sale'),
    mock('📅 Cuándo sale', sw(true, 'Activado'), el('div', { class: 'hg-chips' }, pill('mié, 3 dic', 'chip'), pill('HOY · vie, 6 nov', 'chip today'), pill('jue, 24 dic', 'chip'))),
    P('Solo sale si está en ', B('Activado'), ' y ', B('hoy es una de sus fechas'), '. Si lo pones en «No activado» se queda guardado pero no sale. El interruptor también está en la lista de mensajes de cada persona.'),
    el('h4', {}, 'El título'),
    el('div', { class: 'hg-title-demo' }, ...[...'¡Hola!'].map((ch, i) => el('span', { style: `color:${['#b3122e', '#16a34a', '#c99a2e', '#1d4ed8', '#db2777', '#ea580c'][i]}` }, ch))),
    steps(el('span', {}, 'Escribe el título. Toca una o varias letras y luego un color (sin letras marcadas, el color va a todo).'),
      el('span', {}, 'Elige el ', B('tipo de letra'), ', el ', B('grosor'), ' (de muy fina a muy gruesa), el ', B('tamaño'), ' y el ', B('giro'), '.'),
      el('span', {}, B('Arrastra el título'), ' con el dedo en la vista previa para ponerlo donde quieras.')),
    el('h4', {}, 'Mensaje, fotos y vídeo'),
    P('Escribe el texto, añade ', B('hasta 2 fotos'), ' 📷 y, si quieres, un ', B('vídeo'), ' 🎥 (enlace de YouTube o el nombre de un vídeo subido a GitHub, por ejemplo saludo.mp4).'),
    row(btn('👀 Ver como lo verá'), btn('📋 Copiar a otra persona'), btn('🗑️ Borrar')),
    tip('Puedes preparar todos los mensajes con antelación y dejarlos en «No activado» hasta el día que quieras.'),
  ] },
  { id: 'answers', ico: '📨', title: 'Respuestas', color: '#0f766e', body: () => [
    P('Aquí salen las respuestas de todos, la más nueva arriba. Por defecto solo ves las ', B('pendientes de revisar'), ' (por ejemplo las de escribir o las fotos).'),
    mock('📨 Respuestas', el('table', { class: 'hg-table' },
      el('tr', {}, el('th', {}, 'Persona'), el('th', {}, 'Día'), el('th', {}, 'Respuesta'), el('th', {}, 'Estado')),
      el('tr', {}, el('td', {}, 'Rai'), el('td', {}, '12'), el('td', {}, 'Faltaba la vela'), el('td', {}, el('span', { class: 'hg-st' }, el('i', { class: 'ok' }, '✓'), el('i', { class: 'bad' }, '✗'), el('i', { class: 'pend sel' }, '⏳')))))),
    steps(el('span', {}, B('✓'), ' Correcta: su figura se ilumina.'), el('span', {}, B('✗'), ' Incorrecta: sale el duende verde.'), el('span', {}, B('⏳'), ' Pendiente: aún no lo has decidido.')),
    tip('Lo puedes cambiar siempre que quieras: pulsa otro símbolo y se guarda al momento.'),
  ] },
  { id: 'users', ico: '👥', title: 'Usuarios', color: '#1d4ed8', body: () => [
    P('Lista de todas las personas registradas, con su figura y sus aciertos. Pulsa ', btn('Configurar'), ' para ver y cambiar lo suyo:'),
    steps(el('span', {}, B('Figura'), ': galleta, árbol (actividad 1) o gnomo (actividad 2).'),
      el('span', {}, B('Ver la franja'), ' de figuras con su progreso (sí o no).'),
      el('span', {}, B('Días'), ': cada día con ✓ ✗ ⏳ para corregir. También puedes reiniciar un día, o ', B('↺ Reiniciar todo'), ' para que empiece de cero.'),
      el('span', {}, B('Mensaje de su cinta'), ': un texto solo para esa persona. Vacío = el mensaje general.'),
      el('span', {}, B('Actividades del día'), ': son las mismas que en «Contenido de los días». Si cambias algo aquí, cambia allí también.')),
    warn('Las actividades 1 y 2 son iguales para todas las personas de esa figura: no hay actividades distintas por persona.'),
  ] },
  { id: 'days', ico: '📅', title: 'Contenido de los días', color: '#c2410c', body: () => [
    P('Elige el ', B('día'), ' y el ', B('idioma'), '. Verás el tipo de juego de ese día (no se puede cambiar) y lo que puedes escribir.'),
    mock('📅 Día 2 · Español', el('div', { class: 'hg-field' }, '¿Cuántos meses tienen 28 días?'),
      el('div', { class: 'hg-opts' }, pill('○ 1'), pill('○ 2'), pill('● 12', 'sel'), pill('○ Ninguno')),
      row(el('div', { class: 'hg-act' }, '🎄 Actividad 1', el('small', {}, '✏️ Editar')), el('div', { class: 'hg-act' }, '🧙 Actividad 2', el('small', {}, '✏️ Editar')))),
    steps(el('span', {}, 'En las ', B('preguntas'), ': escribe la pregunta, las 4 respuestas y marca la correcta.'),
      el('span', {}, 'Pulsa una ', B('actividad'), ' para abrir su editor: títulos de colores, negrita, emojis, ', B('📷 fotos'), ' y ', B('🎥 vídeos'), '. «Guardar texto» la guarda al momento.'),
      el('span', {}, 'Pulsa ', btn('💾 Guardar día', 'green'), ' para guardar el resto.')),
    tip('Si escribes solo en español, en catalán e inglés se verá el texto original de ese idioma.'),
    P('Lo que escribes aquí solo lo ven las personas a partir del día que toca.'),
  ] },
  { id: 'special', ico: '⭐', title: 'Los días especiales', color: '#a16207', body: () => [
    P('Casi todos los días son preguntas con 4 respuestas. Estos son distintos:'),
    el('div', { class: 'hg-days' }, ...[
      [1, '🎅', 'Atrapa los 3 gorros', 'Mensaje anónimo, chiste y detector de personas buenas. Textos editables.'],
      [4, '🦌', 'Renos con gafas', 'Buscar los renos que llevan gafas.'],
      [6, '🔍', '5 diferencias + susto', 'Puedes cambiar los segundos del susto.'],
      [7, '🧩', 'Puzle del tren', '15 piezas que se mueven y se giran. Al acabar, el puzle cobra vida con el vídeo (puzle7.jpg y puzle7.mp4).'],
      [8, '🎄', 'Decorar el árbol', ''],
      [12, '👁️', 'Ojo de lince', 'Qué objeto falta. Lo corriges tú en Respuestas.'],
      [13, '😇', '¿Has sido bueno?', 'La máquina de bondad.'],
      [15, '📜', 'Diploma absurdo', ''],
      [17, '⭕', 'Tres en raya navideño', 'Galleta (fichas verdes) contra Perrito (fichas rojas). Al acabar, cada uno pulsa su dibujo: el ganador baila, el que pierde… lluvia y carbón; o empate.'],
      [18, '🧩', 'Puzle de Papá Noel', '15 piezas. Al acabar, cobra vida con su vídeo (puzle18.jpg y puzle18.mp4).'],
      [20, '🎡', 'Ruleta del disparate', 'Tú escribes las misiones de cada casilla y la frase de debajo.'],
      [24, '💃', 'El baile secreto', 'Sale siempre el vídeo baile.mp4 (súbelo a GitHub con los demás archivos). La grabación se comparte por WhatsApp.'],
      [25, '🎴', 'Memory navideño', '14 parejas de cartas. Al acabar, la bola de nieve crece y cobra vida (bola25.mp4). Después, la actividad (árbol o gnomo) y el resumen del mes.'],
    ].map(([n, e, t, d]) => el('div', { class: 'hg-day' }, el('span', { class: 'hg-day-n' }, n), el('span', { class: 'hg-day-e' }, e), el('div', {}, B(t), d ? el('small', {}, d) : null)))),
  ] },
  { id: 'general', ico: '🏆', title: 'Premios y ajustes', color: '#b45309', body: () => [
    P('Arriba tienes un solo botón fijo, ', btn('💾 Guardar todo', 'red'), ', que guarda todos los apartados a la vez.'),
    el('div', { class: 'hg-list' },
      el('div', {}, el('span', {}, '🏆'), el('div', {}, B('Premios'), el('small', {}, 'Lo que se gana en las casillas 10, 15, 20 y 25, distinto para galleta, árbol y gnomo (una pestaña para cada figura). Se gana si como mucho se han fallado o dejado sin hacer 3 días hasta esa casilla.'))),
      el('div', {}, el('span', {}, '📣'), el('div', {}, B('Cinta que se mueve'), el('small', {}, 'Texto general en 3 idiomas, color, grosor y velocidad, con vista previa.'))),
      el('div', {}, el('span', {}, '❄️'), el('div', {}, B('Bienvenida con nieve'), el('small', {}, 'Mostrarla o no, segundos que nieva y el título. «👀 Verla ahora» para probarla.'))),
      el('div', {}, el('span', {}, '📅'), el('div', {}, B('Año del calendario'), el('small', {}, 'Las casillas se abren del 1 al 25 de diciembre de ese año.'))),
      el('div', {}, el('span', {}, '🧪'), el('div', {}, B('Modo prueba'), el('small', {}, 'Abre todas las casillas solo para ti. Se queda activado hasta que lo desactives con su interruptor.'))),
      el('div', {}, el('span', {}, '🔐'), el('div', {}, B('Contraseña de configuración'), el('small', {}, 'Cambiarla (actual + nueva dos veces).'))),
      el('div', {}, el('span', {}, '🚪'), el('div', {}, B('Cerrar sesión'), el('small', {}, 'Debajo de la contraseña. Te pregunta antes si estás segura.'))),
      el('div', {}, el('span', {}, '🧌'), el('div', {}, B('Aviso de día olvidado'), el('small', {}, 'Solo en diciembre: si alguien deja pasar un día sin abrir su casilla, sale un duende verde en su franja y, al tocarlo, este mensaje. No tiene que ver con las actividades. {dia} = el número del día.')))),
  ] },
  { id: 'tips', ico: '🛠️', title: 'Consejos y problemas', color: '#475569', body: () => [
    el('div', { class: 'hg-list' },
      el('div', {}, el('span', {}, '🔢'), el('div', {}, B('Versión'), el('small', {}, 'En la cabecera, abajo a la izquierda y en letra pequeña, se ve la versión (por ejemplo V17.5). Si después de subir cambios no la ves, recarga la página.'))),
      el('div', {}, el('span', {}, '⬆️'), el('div', {}, B('Subir cambios'), el('small', {}, 'Sube a GitHub todos los .js, index.html y styles.css a la vez, para que no se mezclen versiones.'))),
      el('div', {}, el('span', {}, '🔊'), el('div', {}, B('Sonido en iPhone'), el('small', {}, 'Apple no deja sonar nada hasta tocar la pantalla. Si deja de sonar, toca la pantalla otra vez: se recupera solo.'))),
      el('div', {}, el('span', {}, '↺'), el('div', {}, B('Empezar de cero'), el('small', {}, 'Usuarios → Configurar → Reiniciar todo, para borrar los días de prueba.'))),
      el('div', {}, el('span', {}, '🔥'), el('div', {}, B('Reglas de Firebase'), el('small', {}, 'Si algo dice «sin permiso», hay que volver a publicar las reglas (firestore.rules) en Firebase → Firestore Database → Reglas → Publicar.')))),
    el('div', { class: 'hg-end' }, '🎄 ¡Feliz Navidad! 🎄'),
  ] },
];

const UI = {
  es: { reset: '↺ Tamaño normal', close: '✕ Cerrar', top: '↑ Índice', index: '📑 Índice', back: '↑ Volver al índice', small: 'Más pequeño', big: 'Más grande',
    hint: 'Toca un apartado para ir directamente. Puedes hacer zoom con dos dedos y volver con «↺ Tamaño normal».', title: 'Calendario de Adviento' },
  ca: { reset: '↺ Mida normal', close: '✕ Tancar', top: '↑ Índex', index: '📑 Índex', back: '↑ Tornar a l’índex', small: 'Més petit', big: 'Més gran',
    hint: 'Toca un apartat per anar-hi directament. Pots fer zoom amb dos dits i tornar amb «↺ Mida normal».', title: 'Calendari d’Advent' },
  en: { reset: '↺ Normal size', close: '✕ Close', top: '↑ Contents', index: '📑 Contents', back: '↑ Back to contents', small: 'Smaller', big: 'Bigger',
    hint: 'Tap a section to jump straight to it. You can zoom with two fingers and go back with “↺ Normal size”.', title: 'Advent Calendar' },
};
export const openHelp = () => (LANG = 'es', openGuide(SECTIONS, { bar: '📖 Guía de la app', sub: 'Todo lo que tiene la app y cómo configurarlo, paso a paso.', ui: UI.es }));
export function openUserHelp(lang = getLang()) {
  if (!UI[lang]) lang = 'es';
  LANG = lang;
  const sub = { es: 'Todo lo que necesitas saber para disfrutar de tu calendario, paso a paso.', ca: 'Tot el que has de saber per gaudir del teu calendari, pas a pas.', en: 'Everything you need to know to enjoy your calendar, step by step.' }[lang];
  const bar = { es: '📖 Cómo funciona', ca: '📖 Com funciona', en: '📖 How it works' }[lang];
  openGuide(userSections(), { bar, sub, ui: UI[lang], langs: lang, onLang: l => openUserHelp(l) });
}

function openGuide(SECTIONS, { bar: barTitle, sub, ui = UI.es, langs = null, onLang = null }) {
  const content = el('div', { class: 'hg-content' });
  const scroll = el('div', { class: 'hg-scroll' }, content);
  let zoom = 1;
  const zlabel = el('span', { class: 'hg-zl' }, '100%');
  const setZoom = (z, cx, cy) => {
    z = Math.max(1, Math.min(3, z));
    const r = scroll.getBoundingClientRect();
    const px = cx ?? r.width / 2, py = cy ?? r.height / 2;
    const k = z / zoom;
    const sx = (scroll.scrollLeft + px) * k - px, sy = (scroll.scrollTop + py) * k - py;
    zoom = z; content.style.zoom = z; zlabel.textContent = Math.round(z * 100) + '%';
    scroll.scrollLeft = sx; scroll.scrollTop = sy;
    reset.classList.toggle('show', z > 1.01);
  };
  const close = () => { back.classList.add('out'); setTimeout(() => back.remove(), 250); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  const reset = el('button', { class: 'hg-reset no-delay', onclick: () => setZoom(1) }, ui.reset);
  const bar = el('div', { class: 'hg-bar' },
    el('div', { class: 'hg-bar-title' }, barTitle),
    el('div', { class: 'hg-bar-btns' },
      el('button', { class: 'hg-z no-delay', title: ui.small, onclick: () => setZoom(zoom - .25) }, '−'), zlabel,
      el('button', { class: 'hg-z no-delay', title: ui.big, onclick: () => setZoom(zoom + .25) }, '+'),
      el('button', { class: 'hg-close no-delay', onclick: close }, ui.close)));
  const go = id => { const t = content.querySelector('#hg-' + id); if (t) scroll.scrollTo({ top: t.getBoundingClientRect().top - scroll.getBoundingClientRect().top + scroll.scrollTop - 8, behavior: 'smooth' }); };
  const toTop = el('button', { class: 'hg-top no-delay', onclick: () => scroll.scrollTo({ top: 0, behavior: 'smooth' }) }, ui.top);

  // ---- portada + índice
  content.append(
    el('div', { class: 'hg-hero' }, el('div', { class: 'hg-hero-figs' }, fig('galleta.png'), fig('arbol.png'), fig('gnomo.png')),
      el('h1', {}, ui.title), el('p', {}, sub),
      langs ? el('div', { class: 'hg-langs' }, ...[['es', 'Castellano'], ['ca', 'Català'], ['en', 'English']].map(([l, n]) => el('button', { class: 'hg-lang no-delay' + (l === langs ? ' on' : ''), onclick: () => { if (l === langs) return; back.remove(); document.removeEventListener('keydown', onKey); onLang(l); } }, n))) : null),
    el('h2', { class: 'hg-index-t' }, ui.index),
    el('p', { class: 'hg-hint' }, ui.hint),
    el('div', { class: 'hg-index' }, ...SECTIONS.map((s, i) => el('button', { class: 'hg-index-item no-delay', style: `--c:${s.color}`, onclick: () => go(s.id) },
      el('span', { class: 'hg-index-ico' }, typeof s.ico === 'function' ? s.ico() : s.ico), el('span', {}, el('small', {}, `${i + 1}.`), ' ', s.title)))));
  SECTIONS.forEach((s, i) => content.append(el('section', { class: 'hg-sec', id: 'hg-' + s.id, style: `--c:${s.color}` },
    el('h2', {}, el('span', { class: 'hg-sec-ico' }, typeof s.ico === 'function' ? s.ico() : s.ico), el('span', {}, el('small', {}, `${i + 1}`), s.title)),
    ...s.body(),
    el('button', { class: 'hg-back no-delay', onclick: () => scroll.scrollTo({ top: 0, behavior: 'smooth' }) }, ui.back))));

  // ---- zoom con dos dedos (y con ctrl + rueda en el ordenador)
  let pinch = null;
  const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  scroll.addEventListener('touchstart', e => {
    if (e.touches.length === 2) { const r = scroll.getBoundingClientRect(); pinch = { d: dist(e.touches), z: zoom, cx: (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left, cy: (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top }; }
  }, { passive: true });
  scroll.addEventListener('touchmove', e => {
    if (pinch && e.touches.length === 2) { e.preventDefault(); setZoom(pinch.z * dist(e.touches) / pinch.d, pinch.cx, pinch.cy); }
  }, { passive: false });
  scroll.addEventListener('touchend', e => { if (e.touches.length < 2) pinch = null; });
  scroll.addEventListener('wheel', e => { if (e.ctrlKey) { e.preventDefault(); const r = scroll.getBoundingClientRect(); setZoom(zoom * (e.deltaY < 0 ? 1.1 : .9), e.clientX - r.left, e.clientY - r.top); } }, { passive: false });
  scroll.addEventListener('scroll', () => toTop.classList.toggle('show', scroll.scrollTop > 400), { passive: true });

  const back = el('div', { class: 'hg' }, bar, scroll, reset, toTop);
  document.body.append(back);
  document.addEventListener('keydown', onKey);
  if (langs) editable(content, SECTIONS, langs, bar);
}

// ---- la guía de las personas se puede cambiar (solo la administradora): se escribe encima, con la misma letra
const GK = 'adv_guide_edits';
const guideEdits = () => { const c = S?.config?.guideEdits; if (c) { try { localStorage.setItem(GK, JSON.stringify(c)); } catch {} return c; } try { return JSON.parse(localStorage.getItem(GK)) || {}; } catch { return {}; } };
const clean = html => { const t = document.createElement('template'); t.innerHTML = html; t.content.querySelectorAll('*').forEach(n => { if (!/^(B|STRONG|I|EM|BR|SPAN|U)$/.test(n.tagName)) n.replaceWith(...n.childNodes); else [...n.attributes].forEach(a => n.removeAttribute(a.name)); }); return t.innerHTML; };
function editable(content, SECTIONS, lang, bar) {
  const E = guideEdits();
  const slots = [];
  SECTIONS.forEach(sec0 => {
    const node = content.querySelector('#hg-' + sec0.id); if (!node) return;
    const sec = { id: sec0.id === 'u-fig' ? 'u-fig-' + figure() : sec0.id }; // «Tu figura» cambia según la figura
    const list = [...node.querySelectorAll('*')].filter(e => !e.closest('button') && !e.closest('h2') && [...e.childNodes].some(n => n.nodeType === 3 && n.data.trim()));
    list.forEach((e, i) => {
      const k = `${lang}:${sec.id}:${i}`; e.dataset.orig = e.innerHTML;
      if (E[k] != null) { if (E[k] === '') e.style.display = 'none'; else e.innerHTML = clean(E[k]); }
      slots.push({ k, e });
    });
    const extraBox = el('div', { class: 'hg-extras' }); node.querySelector('.hg-back')?.before(extraBox);
    (E[`${lang}:${sec.id}:+`] || []).forEach(h => extraBox.append(el('p', { class: 'hg-p hg-extra', html: clean(h) })));
    slots.push({ extra: true, sec: sec.id, box: extraBox });
  });
  if (!S?.isAdmin) return;
  let on = false;
  const btn = el('button', { class: 'hg-edit no-delay' }, '✏️');
  bar.querySelector('.hg-bar-btns')?.prepend(btn);
  btn.onclick = async () => {
    if (!on) {
      on = true; btn.textContent = '💾'; content.classList.add('editing');
      slots.forEach(s => {
        if (s.extra) { s.add = el('button', { type: 'button', class: 'hg-add no-delay', onclick: () => { const p = el('p', { class: 'hg-p hg-extra' }); p.contentEditable = 'true'; s.box.append(p); p.focus(); } }, '➕ Añadir texto'); s.box.after(s.add); s.box.querySelectorAll('.hg-extra').forEach(p => p.contentEditable = 'true'); }
        else { s.e.style.display = ''; s.e.contentEditable = 'true'; }
      });
      toast('✏️ Toca cualquier texto para cambiarlo. Para borrar uno, déjalo vacío. Pulsa 💾 para guardar.', 5000);
      return;
    }
    // guardar
    const all = { ...(S.config.guideEdits || guideEdits()) };
    Object.keys(all).filter(k => k.startsWith(lang + ':')).forEach(k => delete all[k]);
    slots.forEach(s => {
      if (s.extra) { const a = [...s.box.querySelectorAll('.hg-extra')].map(p => p.innerHTML.trim()).filter(h => h.replace(/<[^>]*>|&nbsp;/g, '').trim()); if (a.length) all[`${lang}:${s.sec}:+`] = a.map(clean); s.add?.remove(); s.box.querySelectorAll('.hg-extra').forEach(p => p.contentEditable = 'false'); return; }
      s.e.contentEditable = 'false';
      const h = s.e.innerHTML.trim();
      if (!s.e.textContent.trim()) { all[s.k] = ''; s.e.style.display = 'none'; }
      else if (h !== s.e.dataset.orig) all[s.k] = clean(h);
    });
    try { await store.saveConfig({ guideEdits: all }); S.config.guideEdits = all; try { localStorage.setItem(GK, JSON.stringify(all)); } catch {} toast('💾 Guía guardada para todos'); }
    catch (e) { toast('⚠️ ' + (e.code || e.message), 5000); }
    on = false; btn.textContent = '✏️'; content.classList.remove('editing');
  };
}

// ================================================================ GUÍA PARA TODAS LAS PERSONAS (es / ca / en)
const THEMES = [['regalos', 'Cosas Navidad'], ['galletas', 'Galletas'], ['toyshop', 'Mansión'], ['papanoel-color', 'Papá Noel'], ['somosnavidad', 'Somos Navidad'], ['numeros', 'Números']];
const item = (ico, title, txt) => el('div', {}, el('span', {}, ico), el('div', {}, B(title), el('small', {}, txt)));
const card = (img, title, txt) => el('div', { class: 'hg-card' }, img, B(title), el('small', {}, txt));
const troll = () => el('div', { class: 'hg-troll' }, '🧌');
// apartado que se abre al tocarlo
function acc(ico, title, content) {
  const panel = el('div', { class: 'hg-acc-panel' });
  const head = el('button', { class: 'hg-acc-head no-delay', onclick: () => {
    const open = !wrap.classList.contains('open');
    if (open && !panel.childElementCount) panel.append(...content());
    wrap.classList.toggle('open', open);
  } }, el('span', { class: 'hg-acc-ico' }, ico), el('b', {}, title), el('span', { class: 'hg-acc-arrow' }, '›'));
  const wrap = el('div', { class: 'hg-acc-item' }, head, panel);
  return wrap;
}

function userSections() {
  const FIN = L('Finalizar', 'Finalitzar', 'Finish');
  return [
  { id: 'u-start', ico: '❄️', color: '#0e7490', title: L('Cómo se entra: la pantalla de la nieve', 'Com s’entra: la pantalla de la neu', 'How to get in: the snow screen'), body: () => [
    P(L('Al abrir la app empieza a ', 'En obrir l’app comença a ', 'When you open the app, it starts to '), B(L('nevar', 'nevar', 'snow')), L(' y suena música de Navidad (en iPhone, toca la pantalla para oírla). Abajo verás una tarjeta:', ' i sona música de Nadal (a l’iPhone, toca la pantalla per sentir-la). A baix veuràs una targeta:', ' and Christmas music plays (on iPhone, tap the screen to hear it). At the bottom you’ll see a card:')),
    mock(L('¿Cómo te llamas?', 'Com et dius?', 'What is your name?'), el('div', { class: 'hg-field' }, 'Marian'), el('div', { class: 'hg-field' }, '• • • •'), el('div', { class: 'hg-guide-btn' }, '🔔 ', B(L('Pulsa para empezar', 'Prem per començar', 'Tap to start')))),
    steps(el('span', {}, L('Escribe ', 'Escriu ', 'Write '), B(L('tu nombre', 'el teu nom', 'your name')), L('. Si en la familia hay dos personas con el mismo nombre, poned el nombre con un número, por ejemplo Marian2. La aplicación os dirá si el nombre ya está cogido.', '. Si a la família hi ha dues persones amb el mateix nom, poseu el nom amb un número, per exemple Marian2. L’aplicació us dirà si el nom ja està agafat.', '. If two people in the family have the same name, add a number to it, for example Marian2. The app will tell you if the name is already taken.')),
      el('span', {}, L('Escribe tu ', 'Escriu el teu ', 'Write your '), B(L('PIN de 4 números', 'PIN de 4 números', '4-number PIN')), L('. La primera vez ', '. La primera vegada ', '. The first time '), B(L('te lo inventas tú', 'te l’inventes tu', 'you make it up')), L(': la app te lo enseñará en grande para que lo recuerdes.', ': l’app te l’ensenyarà en gran perquè el recordis.', ': the app will show it to you in big numbers so you remember it.')),
      el('span', {}, L('Pulsa ', 'Prem ', 'Tap '), btn('🔔 ' + L('Pulsa para empezar', 'Prem per començar', 'Tap to start'), 'red'), L(' y ya estás dentro.', ' i ja ets a dins.', ' and you’re in.'))),
    el('div', { class: 'hg-list' },
      item('📱', L('Las próximas veces', 'Les properes vegades', 'Next times'), L('En el mismo móvil solo hace falta tu nombre: ya te reconoce.', 'Al mateix mòbil només cal el teu nom: ja et reconeix.', 'On the same phone you only need your name: it already knows you.')),
      item('💻', L('En otro aparato', 'En un altre aparell', 'On another device'), L('En otro móvil, tableta u ordenador escribe tu nombre y tu PIN, y lo tendrás todo igual.', 'En un altre mòbil, tauleta o ordinador escriu el teu nom i el teu PIN, i ho tindràs tot igual.', 'On another phone, tablet or computer, write your name and PIN and everything will be the same.')),
      item('📖', L('Cómo funciona', 'Com funciona', 'How it works'), L('El botón que te ha traído a esta guía. Puedes leerla antes de empezar.', 'El botó que t’ha portat a aquesta guia. La pots llegir abans de començar.', 'The button that brought you to this guide. You can read it before you start.')),
      item('ℹ️', L('La «i» de la esquina', 'La «i» del racó', 'The “i” in the corner'), L('Un mensaje de bienvenida y el correo de la persona que ha preparado el calendario, por si quieres escribirle.', 'Un missatge de benvinguda i el correu de la persona que ha preparat el calendari, per si li vols escriure.', 'A welcome message and the email of the person who prepared the calendar, in case you want to write to her.')),
      item('🔑', L('«Soy la administradora»', '«Soc l’administradora»', '“I am the admin”'), L('Es solo para la persona responsable del calendario. Tú no lo necesitas.', 'És només per a la persona responsable del calendari. Tu no el necessites.', 'It is only for the person in charge of the calendar. You don’t need it.'))),
    tip(L('Si has olvidado tu PIN, escribe a la persona responsable del calendario (su correo está en la «i»).', 'Si has oblidat el teu PIN, escriu a la persona responsable del calendari (el seu correu és a la «i»).', 'If you forget your PIN, write to the person in charge of the calendar (her email is in the “i”).')),
  ] },
  { id: 'u-what', ico: '🎄', color: '#b3122e', title: L('¿Qué es este calendario?', 'Què és aquest calendari?', 'What is this calendar?'), body: () => [
    P(L('Es un ', 'És un ', 'It is an '), B(L('calendario de Adviento', 'calendari d’Advent', 'Advent calendar')), L(' para toda la familia: tiene ', ' per a tota la família: té ', ' for the whole family: it has '), B(L('25 casillas', '25 caselles', '25 boxes')), L(', una para cada día del 1 al 25 de diciembre.', ', una per a cada dia de l’1 al 25 de desembre.', ', one for each day from 1 to 25 December.')),
    P(L('Cada día se abre una casilla nueva a las ', 'Cada dia s’obre una casella nova a les ', 'A new box opens every day at '), B('00:00'), L(' (hora de España). Dentro hay un ', ' (hora d’Espanya). A dins hi ha un ', ' (Spanish time). Inside there is a '), B(L('reto', 'repte', 'challenge')), L(': una pregunta, un juego, un baile… ¡cada día es una sorpresa!', ': una pregunta, un joc, un ball… cada dia és una sorpresa!', ': a question, a game, a dance… every day is a surprise!')),
    mock(L('Tu calendario', 'El teu calendari', 'Your calendar'), el('div', { class: 'hg-board' }, ...Array.from({ length: 10 }, (_, i) => el('span', { class: 'hg-door' + (i < 3 ? ' done' : '') }, i + 1)))),
    tip(L('Si intentas abrir una casilla antes de su día, tiembla y no se abre. ¡Paciencia! 😉', 'Si intentes obrir una casella abans del seu dia, tremola i no s’obre. Paciència! 😉', 'If you try to open a box before its day, it shakes and stays closed. Be patient! 😉')),
  ] },
  { id: 'u-home', ico: '🏠', color: '#1f6b45', title: L('La pantalla de inicio', 'La pantalla d’inici', 'The home screen'), body: () => [
    P(L('Esto es lo que ves al entrar, de arriba abajo:', 'Això és el que veus quan entres, de dalt a baix:', 'This is what you see when you come in, from top to bottom:')),
    el('div', { class: 'hg-list' },
      item('🏷️', L('Cabecera', 'Capçalera', 'Header'), L('El título, tu saludo y los botones: ❄️ vuelve a la pantalla de la nieve, 🔊 quita o pone el sonido y ⚙️ Mis opciones (tus ajustes y esta guía).', 'El títol, la teva salutació i els botons: ❄️ torna a la pantalla de la neu, 🔊 treu o posa el so i ⚙️ Les meves opcions (els teus ajustos i aquesta guia).', 'The title, your greeting and the buttons: ❄️ goes back to the snow screen, 🔊 turns sound on or off and ⚙️ My options (your settings and this guide).')),
      item('🔍', L('Barra roja fina', 'Barra vermella fina', 'Thin red bar'), L('Para ver el calendario a pantalla completa.', 'Per veure el calendari a pantalla completa.', 'To see the calendar full screen.')),
      item('🎅', L('Franja de figuras', 'Franja de figures', 'Row of figures'), L('Una figura por día que se ilumina cuando lo haces bien. A la izquierda, el trofeo 🏆 con tus aciertos.', 'Una figura per dia que s’il·lumina quan ho fas bé. A l’esquerra, el trofeu 🏆 amb els teus encerts.', 'One figure per day that lights up when you get it right. On the left, the trophy 🏆 with your score.')),
      item('📣', L('Cinta que se mueve', 'Cinta que es mou', 'Moving banner'), L('Un mensaje navideño, a veces solo para ti.', 'Un missatge nadalenc, de vegades només per a tu.', 'A Christmas message, sometimes just for you.')),
      item('🎁', L('El calendario', 'El calendari', 'The calendar'), L('Con las 25 casillas. Toca un número para abrir su casilla.', 'Amb les 25 caselles. Toca un número per obrir la seva casella.', 'With the 25 boxes. Tap a number to open its box.'))),
  ] },
  { id: 'u-zoom', ico: '🔍', color: '#1d4ed8', title: L('Ver el calendario en grande', 'Veure el calendari en gran', 'Seeing the calendar bigger'), body: () => [
    P(L('Hay tres formas de ver el calendario a pantalla completa:', 'Hi ha tres maneres de veure el calendari a pantalla completa:', 'There are three ways to see the calendar full screen:')),
    steps(el('span', {}, L('Pulsa la ', 'Prem la ', 'Tap the '), B(L('barra roja', 'barra vermella', 'red bar')), L(' de arriba: «🔍 Pulsa aquí para ver el calendario a pantalla completa».', ' de dalt: «🔍 Prem aquí per veure el calendari a pantalla completa».', ' at the top: “🔍 Tap here to see the calendar full screen”.')),
      el('span', {}, L('Toca ', 'Toca ', 'Tap '), B(L('la imagen del calendario', 'la imatge del calendari', 'the calendar picture')), L(' en cualquier sitio que no sea un número (los bordes, el fondo, los dibujos).', ' a qualsevol lloc que no sigui un número (les vores, el fons, els dibuixos).', ' anywhere that is not a number (the edges, the background, the drawings).')),
      el('span', {}, L('Toca la ', 'Toca la ', 'Tap the '), B(L('cinta que se mueve', 'cinta que es mou', 'moving banner')), '.')),
    mock(L('Pantalla completa', 'Pantalla completa', 'Full screen'), el('div', { class: 'hg-full' }, el('img', { src: 'tema-regalos-movil.jpg', alt: '' }), el('span', { class: 'hg-exit' }, L('✕ Salir', '✕ Sortir', '✕ Exit')))),
    P(L('Para volver a la vista normal, pulsa ', 'Per tornar a la vista normal, prem ', 'To go back to the normal view, tap '), btn(L('✕ Salir', '✕ Sortir', '✕ Exit')), '.'),
    tip(L('En pantalla completa también puedes abrir las casillas tocando su número, y abajo tienes tu franja de figuras y el trofeo. Al salir de una casilla vuelves siempre aquí.', 'A pantalla completa també pots obrir les caselles tocant-ne el número, i a baix tens la teva franja de figures i el trofeu. En sortir d’una casella hi tornes sempre.', 'In full screen you can also open the boxes by tapping their number, and at the bottom you have your row of figures and the trophy. When you leave a box you always come back here.')),
  ] },
  { id: 'u-open', ico: () => doorCrop(1, 'ico'), color: '#c2410c', title: L('Abrir la casilla del día', 'Obrir la casella del dia', 'Opening today’s box'), body: () => [
    el('div', { class: 'hg-doors' }, doorCrop(1), doorCrop(2, 'lit'), doorCrop(3)),
    steps(el('span', {}, L('Toca el ', 'Toca el ', 'Tap the '), B(L('número', 'número', 'number')), L(' de la casilla de hoy.', ' de la casella d’avui.', ' of today’s box.')),
      el('span', {}, L('La ventanita ', 'La finestreta ', 'The little window '), B(L('se ilumina', 's’il·lumina', 'lights up')), L(', suena una melodía y se abre.', ', sona una melodia i s’obre.', ', a tune plays and it opens.')),
      el('span', {}, L('Aparece una ', 'Apareix una ', 'A '), B(L('nota', 'nota', 'note')), L(' con el reto del día. ¡Léela con calma!', ' amb el repte del dia. Llegeix-la amb calma!', ' appears with the day’s challenge. Read it calmly!')),
      el('span', {}, L('Haz el reto y pulsa ', 'Fes el repte i prem ', 'Do the challenge and tap '), btn(FIN, 'red'), '.')),
    P(L('Si no puedes hacerlo en ese momento, pulsa ', 'Si no ho pots fer en aquell moment, prem ', 'If you can’t do it right then, tap '), btn(L('Cancelar (lo haré luego)', 'Cancel·lar (ho faré després)', 'Cancel (I’ll do it later)')), L(' y vuelve más tarde.', ' i torna més tard.', ' and come back later.')),
    warn(L('Cada reto se responde ', 'Cada repte es respon ', 'Each challenge can be answered '), B(L('una sola vez', 'una sola vegada', 'only once')), L('. Si vuelves a abrir la casilla, verás lo que contestaste.', '. Si tornes a obrir la casella, veuràs el que vas contestar.', '. If you open the box again, you’ll see what you answered.')),
    tip(L('Si te dejas un día, lo puedes hacer al día siguiente… ¡pero mejor no dejarlo pasar mucho!', 'Si et deixes un dia, el pots fer l’endemà… però millor no deixar-ho passar gaire!', 'If you miss a day, you can do it the next day… but better not to leave it too long!')),
  ] },
  (() => {
    if (!S.user) return { id: 'u-fig', ico: () => fig('galleta.png'), color: '#7c3aed', title: L('Las figuras: galleta, árbol y gnomo', 'Les figures: galeta, arbre i gnom', 'The figures: gingerbread, tree and gnome'), body: () => [
      row(card(fig('galleta.png', 'glow'), L('Galleta', 'Galeta', 'Gingerbread'), L('Todos empiezan así', 'Tothom comença així', 'Everyone starts like this')),
        card(fig(FIG_IMG.arbol, 'glow'), L('Árbol', 'Arbre', 'Tree'), L('Actividad 1', 'Activitat 1', 'Activity 1')),
        card(fig(FIG_IMG.gnomo, 'glow'), L('Gnomo', 'Gnom', 'Gnome'), L('Actividad 2', 'Activitat 2', 'Activity 2'))),
      P(L('Al entrar por primera vez eres una ', 'En entrar per primer cop ets una ', 'When you first come in you are a '), B(L('galleta de jengibre', 'galeta de gingebre', 'gingerbread')), L(': en cada casilla haces el reto del día. La persona responsable del calendario puede convertirte en ', ': a cada casella fas el repte del dia. La persona responsable del calendari et pot convertir en ', ': in each box you do the day’s challenge. The person in charge can turn you into a '), B(L('árbol', 'arbre', 'tree')), L(' o en ', ' o en ', ' or a '), B(L('gnomo', 'gnom', 'gnome')), L(': entonces, después del reto, tendrás además una actividad extra (a veces con una pregunta de 4 respuestas).', ': aleshores, després del repte, tindràs a més una activitat extra (de vegades amb una pregunta de 4 respostes).', ': then, after the challenge, you’ll also have an extra activity (sometimes with a 4-answer question).')),
    ] };
    const f = figure();
    if (f === 'galleta') return { id: 'u-fig', ico: () => fig('galleta.png'), color: '#7c3aed', title: L('Tu figura: la galleta', 'La teva figura: la galeta', 'Your figure: the gingerbread'), body: () => [
      row(card(fig('galleta.png', 'glow'), L('Galleta de jengibre', 'Galeta de gingebre', 'Gingerbread'), L('¡Esta eres tú!', 'Aquesta ets tu!', 'This is you!'))),
      P(L('Tu figura es la ', 'La teva figura és la ', 'Your figure is the '), B(L('galleta de jengibre', 'galeta de gingebre', 'gingerbread')), L('. En cada casilla haces el reto del día y, cuando lo terminas, pulsas ', '. A cada casella fas el repte del dia i, quan l’acabes, prems ', '. In each box you do the day’s challenge and, when you finish, you tap '), btn(FIN, 'red'), '.'),
      P(L('Cuando lo haces bien, ', 'Quan ho fas bé, ', 'When you get it right, '), B(L('tu galleta se ilumina', 'la teva galeta s’il·lumina', 'your gingerbread lights up')), L(' en la franja de arriba.', ' a la franja de dalt.', ' in the row at the top.')),
      tip(L('Cuantas más galletas iluminadas, más cerca estás de los premios. 🍪', 'Com més galetes il·luminades, més a prop ets dels premis. 🍪', 'The more gingerbreads lit up, the closer you are to the prizes. 🍪')),
    ] };
    const A = f === 'arbol' ? L('Actividad 1', 'Activitat 1', 'Activity 1') : L('Actividad 2', 'Activitat 2', 'Activity 2');
    const name = f === 'arbol' ? L('el árbol de Navidad', 'l’arbre de Nadal', 'the Christmas tree') : L('el gnomo', 'el gnom', 'the gnome');
    return { id: 'u-fig', ico: () => fig(FIG_IMG[f]), color: '#7c3aed', title: f === 'arbol' ? L('Tu figura: el árbol', 'La teva figura: l’arbre', 'Your figure: the tree') : L('Tu figura: el gnomo', 'La teva figura: el gnom', 'Your figure: the gnome'), body: () => [
      row(card(fig(FIG_IMG[f], 'glow'), f === 'arbol' ? L('Árbol de Navidad', 'Arbre de Nadal', 'Christmas tree') : L('Gnomo', 'Gnom', 'Gnome'), L('¡Este eres tú!', 'Aquest ets tu!', 'This is you!'))),
      P(L('Tu figura es ', 'La teva figura és ', 'Your figure is '), B(name), L('. En cada casilla haces el reto del día y, además, tienes una actividad extra: la ', '. A cada casella fas el repte del dia i, a més, tens una activitat extra: l’', '. In each box you do the day’s challenge and you also have an extra activity: '), B(A), '.'),
      steps(el('span', {}, L('Haz el reto y pulsa ', 'Fes el repte i prem ', 'Do the challenge and tap '), btn(FIN, 'red'), '.'),
        el('span', {}, B(L('La nota se arruga como un papel', 'La nota s’arruga com un paper', 'The note crumples like paper')), L(' y se hace una bola.', ' i es fa una bola.', ' into a ball.')),
        el('span', {}, L('Aparece tu ', 'Apareix la teva ', 'Your '), B(A), L('. Cuando la hagas, pulsa ', '. Quan la facis, prem ', ' appears. When you’ve done it, tap '), btn(FIN, 'red'), '.')),
      P(L('Algunas actividades terminan con una ', 'Algunes activitats acaben amb una ', 'Some activities end with a '), B(L('pregunta de 4 respuestas', 'pregunta de 4 respostes', '4-answer question')), L(': eliges una (¡solo una vez!). Si aciertas, brilla y te felicitamos; si no… ¡otra vez será!', ': n’esculls una (només una vegada!). Si l’encertes, brilla i et felicitem; si no… una altra vegada serà!', ': you choose one (only once!). If you get it right, it shines and we congratulate you; if not… better luck next time!')),
      tip(L('Si dejas la actividad para luego, al volver a abrir esa casilla te la recordará.', 'Si deixes l’activitat per a després, quan tornis a obrir aquella casella te la recordarà.', 'If you leave the activity for later, it will remind you when you open that box again.')),
      warn(L('Haz también la actividad: si no, tu figura no se ilumina del todo.', 'Fes també l’activitat: si no, la teva figura no s’il·lumina del tot.', 'Do the activity too: otherwise your figure won’t fully light up.')),
    ] };
  })(),
  { id: 'u-strip', ico: '✨', color: '#a16207', title: L('La franja de figuras', 'La franja de figures', 'The row of figures'), body: () => [
    P(L('Tienes una figura por cada día (arriba y, con el calendario en grande, abajo). Así sabes cómo vas:', 'Tens una figura per cada dia (a dalt i, amb el calendari en gran, a baix). Així saps com vas:', 'You have one figure per day (at the top and, with the big calendar, at the bottom), so you know how you’re doing:')),
    row(card(fig(FIG_IMG[figure()], 'glow'), L('Iluminada', 'Il·luminada', 'Lit up'), L('¡Bien hecho!', 'Ben fet!', 'Well done!')),
      card(fig(FIG_IMG[figure()], 'gray'), L('En gris', 'En gris', 'Grey'), L('Sin hacer todavía, o esperando que lo revisen (⏳).', 'Encara sense fer, o esperant que el revisin (⏳).', 'Not done yet, or waiting to be checked (⏳).')),
      card(troll(), L('Duende verde', 'Follet verd', 'Green goblin'), L('Esta vez no salió bien, o el día se olvidó.', 'Aquesta vegada no ha sortit bé, o el dia es va oblidar.', 'It didn’t go right this time, or the day was missed.'))),
    P(B(L('Toca cualquier figura', 'Toca qualsevol figura', 'Tap any figure')), L(' para ver el resultado de ese día. Si tocas el duende verde, te explica por qué no salió y te anima a seguir.', ' per veure el resultat d’aquell dia. Si toques el follet verd, t’explica per què no ha sortit i t’anima a continuar.', ' to see that day’s result. If you tap the green goblin, it tells you why it didn’t work out and encourages you to keep going.')),
    tip(L('Algunas respuestas las revisa a mano la persona responsable del calendario: mientras tanto verás un relojito ⏳.', 'Algunes respostes les revisa a mà la persona responsable del calendari: mentrestant veuràs un rellotget ⏳.', 'Some answers are checked by hand by the person in charge: meanwhile you’ll see a little hourglass ⏳.')),
  ] },
  { id: 'u-prizes', ico: '🏆', color: '#b45309', title: L('Los premios', 'Els premis', 'The prizes'), body: () => [
    P(L('Hay ', 'Hi ha ', 'There are '), B(L('4 premios', '4 premis', '4 prizes')), L(': al llegar a la casilla 10, a la 15, a la 20 y a la 25.', ': en arribar a la casella 10, a la 15, a la 20 i a la 25.', ': on reaching box 10, 15, 20 and 25.')),
    P(L('Para ganar cada premio puedes fallar o dejarte sin hacer ', 'Per guanyar cada premi pots fallar o deixar sense fer ', 'To win each prize you can get wrong or skip '), B(L('como mucho 3 casillas', 'com a màxim 3 caselles', 'at most 3 boxes')), L(', contando desde el día 1.', ', comptant des del dia 1.', ', counting from day 1.')),
    mock(L('🏆 Premios', '🏆 Premis', '🏆 Prizes'), ...[10, 15, 20, 25].map(g => el('div', { class: 'hg-prize' }, el('span', {}, '🎁'), el('div', {}, B(L(`Del día 1 al ${g}`, `Del dia 1 al ${g}`, `Day 1 to ${g}`)), el('small', {}, L('El regalo y cómo vas: ✅ bien · ❌ mal', 'El regal i com vas: ✅ bé · ❌ malament', 'The gift and how you’re doing: ✅ right · ❌ wrong')))))),
    P(L('Pulsa el ', 'Prem el ', 'Tap the '), B(L('trofeo 🏆', 'trofeu 🏆', 'trophy 🏆')), L(' de la franja para ver los regalos y cuántas casillas llevas bien y mal. Toca un regalo para ver el detalle.', ' de la franja per veure els regals i quantes caselles portes bé i malament. Toca un regal per veure’n el detall.', ' in the row to see the gifts and how many boxes you have right and wrong. Tap a gift to see the details.')),
    tip(L('Si un premio se escapa, ¡sigues jugando por los demás!', 'Si un premi s’escapa, continues jugant pels altres!', 'If you miss a prize, you keep playing for the others!')),
  ] },
  { id: 'u-special', ico: '⭐', color: '#db2777', title: L('Días especiales', 'Dies especials', 'Special days'), body: () => [
    P(L('Casi todos los días hay una pregunta con 4 respuestas, pero algunos días son ', 'Gairebé cada dia hi ha una pregunta amb 4 respostes, però alguns dies són ', 'Most days there is a question with 4 answers, but some days are '), B(L('juegos especiales', 'jocs especials', 'special games')), L(': atrapar gorros de Papá Noel, buscar renos, encontrar diferencias, una ruleta de misiones, un baile secreto… y el día 25, ¡tu cara en Papá Noel! 🎅', ': atrapar barrets del Pare Noel, buscar rens, trobar diferències, una ruleta de missions, un ball secret… i el dia 25, la teva cara al Pare Noel! 🎅', ': catching Santa hats, finding reindeer, spotting differences, a mission wheel, a secret dance… and on day 25, your face on Santa! 🎅')),
    P(L('En cada juego la nota te explica qué hay que hacer. Si hay que grabarse o hacerse una foto, la app te ayuda a compartirla por WhatsApp.', 'A cada joc la nota t’explica què cal fer. Si t’has de gravar o fer una foto, l’app t’ajuda a compartir-la per WhatsApp.', 'In each game the note explains what to do. If you need to record yourself or take a photo, the app helps you share it on WhatsApp.')),
    tip(L('Algunos juegos tienen sonido: sube el volumen. 🔊', 'Alguns jocs tenen so: apuja el volum. 🔊', 'Some games have sound: turn the volume up. 🔊')),
  ] },
  { id: 'u-surprise', ico: '💌', color: '#e11d48', title: L('Sorpresas al entrar', 'Sorpreses en entrar', 'Surprises when you come in'), body: () => [
    P(L('Al abrir la app sale una ', 'En obrir l’app surt una ', 'When you open the app there is a '), B(L('bienvenida con nieve', 'benvinguda amb neu', 'snowy welcome')), L(' y la melodía de «Navidad, Navidad, dulce Navidad». En iPhone, toca la pantalla para oírla.', ' i la melodia de «Jingle Bells». A l’iPhone, toca la pantalla per sentir-la.', ' and the “Jingle Bells” tune. On iPhone, tap the screen to hear it.')),
    P(L('Algunos días puede salirte un ', 'Alguns dies et pot sortir un ', 'Some days you may get a '), B(L('mensaje sorpresa', 'missatge sorpresa', 'surprise message')), L(' solo para ti, con fotos o un vídeo. Cuando lo hayas visto, pulsa ', ' només per a tu, amb fotos o un vídeo. Quan l’hagis vist, prem ', ' just for you, with photos or a video. When you’ve seen it, tap '), btn(L('🏠 Volver al inicio', '🏠 Tornar a l’inici', '🏠 Back to home'), 'red'), '.'),
  ] },
  { id: 'u-opts', ico: '⚙️', color: '#0f766e', title: L('Mis opciones', 'Les meves opcions', 'My options'), body: () => [
    P(L('Pulsa ', 'Prem ', 'Tap '), btn('⚙️'), L(' arriba a la derecha. Toca cada opción para ver lo que encontrarás:', ' a dalt a la dreta. Toca cada opció per veure què hi trobaràs:', ' at the top right. Tap each option to see what you will find:')),
    el('div', { class: 'hg-acc' },
      acc('📖', L('Ver esta guía', 'Veure aquesta guia', 'See this guide'), () => [el('div', { class: 'hg-guide-btn' }, '📖 ', B(L('Cómo funciona el calendario', 'Com funciona el calendari', 'How the calendar works'))), el('small', {}, L('Siempre que la necesites, en castellano, catalán o inglés.', 'Sempre que la necessitis, en castellà, català o anglès.', 'Whenever you need it, in Spanish, Catalan or English.'))]),
      acc('✏️', L('Tu nombre', 'El teu nom', 'Your name'), () => [el('div', { class: 'hg-field' }, 'Eli'), el('small', {}, L('Sale en el saludo: «¡Buenas tardes, Eli!»', 'Surt a la salutació: «Bona tarda, Eli!»', 'It shows in the greeting: “Good afternoon, Eli!”'))]),
      acc('🌍', L('Idioma', 'Idioma', 'Language'), () => [el('div', { class: 'hg-chips' }, pill('Español'), pill('Català'), pill('English'))]),
      acc('📝', L('Estilo de las notas', 'Estil de les notes', 'Note style'), () => [el('small', {}, L('Ves todos los estilos y tocas el que más te guste:', 'Veus tots els estils i toques el que més t’agradi:', 'You see all the styles and tap the one you like:')),
        el('div', { class: 'hg-papers' }, ...PAPERS.map(p => el('div', {}, el('div', { class: 'note-mini paper paper-' + p.id }, el('b', { class: 'note-day' }, '🎄 1'), el('p', {}, 'Ho, ho, ho!')), el('small', {}, p.name))))]),
      acc('🖼️', L('Diferentes temas', 'Diferents temes', 'Different themes'), () => [el('small', {}, L('Ves todos los calendarios en pequeño y tocas el que quieras:', 'Veus tots els calendaris en petit i toques el que vulguis:', 'You see all the calendars small and tap the one you want:')),
        el('div', { class: 'hg-themes' }, ...PORTADAS.map(p => { const v = p.variants.find(x => /movil/.test(x.img)) || p.variants[0]; return el('figure', {}, el('img', { src: v.img, alt: '', loading: 'lazy' }), el('figcaption', {}, p.name)); }))]),
      acc('🔑', 'PIN', () => [el('div', { class: 'hg-pw' }, el('span', {}, '•••• 👁️'), btn(L('Cambiar', 'Canviar', 'Change'))), el('small', {}, L('Con 👁️ ves tu PIN. Para cambiarlo escribes el actual y el nuevo dos veces.', 'Amb 👁️ veus el teu PIN. Per canviar-lo escrius l’actual i el nou dues vegades.', 'With 👁️ you see your PIN. To change it, type the current one and the new one twice.'))]),
      acc('🚪', L('Cerrar sesión', 'Tancar la sessió', 'Sign out'), () => [btn('🚪 ' + L('Cerrar sesión', 'Tancar la sessió', 'Sign out')), el('small', {}, L('Está abajo del todo.', 'És a baix de tot.', 'It is at the very bottom.'))])),
    P(L('Los botones ', 'Els botons ', 'The '), btn(L('Cancelar', 'Cancel·lar', 'Cancel')), L(' y ', ' i ', ' and '), btn(L('Guardar', 'Desar', 'Save'), 'red'), L(' están arriba y no se mueven aunque bajes.', ' són a dalt i no es mouen encara que baixis.', ' buttons are at the top and stay put while you scroll.')),
  ] },
  { id: 'u-help', ico: '🛟', color: '#475569', title: L('Si algo no va', 'Si alguna cosa no va', 'If something isn’t working'), body: () => [
    el('div', { class: 'hg-list' },
      item('🔊', L('No se oye nada', 'No se sent res', 'No sound'), L('Sube el volumen y toca la pantalla. En iPhone ningún sonido funciona hasta que tocas la pantalla.', 'Apuja el volum i toca la pantalla. A l’iPhone cap so funciona fins que toques la pantalla.', 'Turn the volume up and tap the screen. On iPhone no sound plays until you tap the screen.')),
      item('🔄', L('Algo se ve raro', 'Alguna cosa es veu estranya', 'Something looks odd'), L('Cierra la app (o la pestaña) y vuelve a abrirla.', 'Tanca l’app (o la pestanya) i torna-la a obrir.', 'Close the app (or the tab) and open it again.')),
      item('🔑', L('He olvidado mi PIN', 'He oblidat el meu PIN', 'I forgot my PIN'), L('Escribe a la persona responsable del calendario (su correo está en la «i» de la pantalla de la nieve): ella te lo dirá.', 'Escriu a la persona responsable del calendari (el seu correu és a la «i» de la pantalla de la neu): ella te’l dirà.', 'Write to the person in charge of the calendar (her email is in the “i” on the snow screen): she will tell you.')),
      item('🔒', L('La casilla no se abre', 'La casella no s’obre', 'The box won’t open'), L('Todavía no es su día: se abre a las 00:00.', 'Encara no és el seu dia: s’obre a les 00:00.', 'It isn’t its day yet: it opens at 00:00.'))),
    el('div', { class: 'hg-end' }, L('🎄 ¡Feliz Navidad! 🎄', '🎄 Bon Nadal! 🎄', '🎄 Merry Christmas! 🎄')),
  ] },
  ];
}
