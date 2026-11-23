// Guía de la app (para la administradora): pantalla completa, índice, dibujos y zoom con dos dedos
import { el } from './fx.js';
import { getLang } from './i18n.js';
import { PORTADAS, PAPERS } from './defaults.js';
import { figure, S } from './app.js';
import { store } from './store.js';
import { toast } from './fx.js';
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
const shot = k => el('img', { class: 'hg-shot', src: `man-${k}-${LANG}.webp`, alt: '', loading: 'lazy' });
const num = (n, ico, title, txt) => el('div', { class: 'hg-num' }, el('span', { class: 'hg-num-n' }, String(n)), el('span', { class: 'hg-num-ico' }, ico), el('div', {}, B(title), txt ? el('small', {}, txt) : null));
const whenRow = (ico, title, keys) => el('div', { class: 'hg-when-row' }, el('span', { class: 'hg-when-ico' }, ico), B(title), el('span', { class: 'hg-when-keys' }, ...keys.map(k => el('i', {}, k))));
// (V23.2) lo primero de la guía: las 3 cosas para entrar
function keysIntro(go) {
  return el('div', { class: 'hg-keys' },
    el('h2', {}, '🗝️ ' + L('Para entrar necesitas…', 'Per entrar necessites…', 'To come in you need…')),
    el('div', { class: 'hg-keys-row' },
      el('div', { class: 'hg-key' }, el('span', { class: 'hg-key-ico' }, '🙋'), B(L('Tu nombre', 'El teu nom', 'Your name'))),
      el('div', { class: 'hg-key' }, el('span', { class: 'hg-key-ico' }, '🔢'), B(L('Tu PIN', 'El teu PIN', 'Your PIN')), el('small', {}, L('4 números que te inventas tú', '4 números que t’inventes tu', '4 numbers you make up'))),
      el('div', { class: 'hg-key gold' }, el('span', { class: 'hg-key-ico' }, '🔑'), B(L('La palabra secreta', 'La paraula secreta', 'The secret word')), el('small', {}, L('te la da la administradora', 'te la dona l’administradora', 'the admin gives it to you')))),
    el('p', { class: 'hg-keys-note' }, '🔢 ', B(L('PIN = siempre tuyo', 'PIN = sempre teu', 'PIN = always yours')), ' · 🔑 ', B(L('palabra = solo la 1.ª vez', 'paraula = només la 1a vegada', 'word = only the 1st time'))),
    el('button', { class: 'btn btn-big no-delay hg-keys-go', onclick: () => go('u-enter') }, '❄️ ' + L('Mira cómo se entra, paso a paso', 'Mira com s’entra, pas a pas', 'See how to get in, step by step')));
}
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
      el('div', { class: 'hg-card' }, el('div', { class: 'hg-big' }, '🔒'), B('Configuración'), el('small', {}, 'Solo lo ves TÚ (los jugadores no lo tienen) y con tu contraseña.')),
      el('div', { class: 'hg-card' }, el('div', { class: 'hg-big' }, '🚪'), B('Salir'), el('small', {}, 'Cerrar sesión.'))),
    el('h4', {}, 'El botón del sonido 🔊'),
    P('Es un ', B('interruptor'), ': verde 🔊 = sonido activado; un toque y se pone ', B('rojo 🔇'), ' (sin sonido); otro toque y vuelve. Se recuerda en cada móvil. También sale flotando arriba a la derecha en la nieve, las casillas y los juegos.'),
    shot('sound'),
    el('h4', {}, 'El botón dorado ⭐ con su nombre'),
    P('Abre su ', B('Marcador de Navidad'), ': sus puntos, los 5 primeros y su historial.'),
    shot('score'),
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
    tip('Si olvidas la contraseña: entra con tu cuenta de administradora, pulsa 🔒 y luego «¿Has olvidado la contraseña de configuración?». Podrás poner una nueva.'),
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
      [1, '🎅', 'Atrapa los 3 gorros + 4 en raya', 'Mensaje anónimo, chiste y detector de personas buenas (textos editables). Debajo, «¡Juega al 4 en raya!»: contra el Pare Noel o en línea, con mensajes. 1.ª partida: Marcador +2; gnomos +2 si ganan, +1 si pierden.'],
      [2, '🎁', 'El duende de los regalos', 'Comecocos navideño con 3 niveles. Suma al Marcador con 1.000 puntos en Mediano o 800 en Difícil.'],
      [4, '🦌', 'Renos con gafas', 'Buscar los renos que llevan gafas.'],
      [6, '🔍', '5 diferencias + susto', 'Puedes cambiar los segundos del susto.'],
      [7, '🧩', 'Puzle del tren', '15 piezas que se mueven y se giran. Al acabar, el puzle cobra vida con el vídeo (puzle7.jpg y puzle7.mp4).'],
      [8, '🎄', 'Decorar el árbol', ''],
      [12, '🎲', 'Parchís de Navidad', 'Solo contra Papá Noel o en línea (2 a 4 personas). Se corrige solo.'],
      [13, '🃏', 'Superpoder + solitario', 'Debajo de la ruleta de superpoderes: «¡Juega al solitario de Navidad!». Resolverlo suma al Marcador y a los gnomos (1.ª vez).'],
      [16, '📜', 'Diploma absurdo + marcianitos', 'Debajo del diploma, «¡Pulsa para divertirte!» abre los marcianitos de Navidad (como el Space Invaders). Llegar a 100 puntos suma al Marcador y a los gnomos.'],
      [17, '⭕', 'Tres en raya navideño', 'Galleta (fichas verdes) contra Perrito (fichas rojas). Al acabar, cada uno pulsa su dibujo: el ganador baila, el que pierde… lluvia y carbón; o empate.'],
      [18, '🧩', 'Puzle de Papá Noel', '15 piezas. Al acabar, cobra vida con su vídeo (puzle18.jpg y puzle18.mp4).'],
      [20, '🎡', 'Ruleta del disparate', 'Tú escribes las misiones de cada casilla y la frase de debajo.'],
      [24, '💃', 'El baile secreto', 'Sale siempre el vídeo baile.mp4 (súbelo a GitHub con los demás archivos). La grabación se comparte por WhatsApp.'],
      [25, '🎄', '¡Es Navidad! Dos juegos', 'Al entrar salen dos botones y hay que hacer los dos: 🎴 Memory de Navidad (14 parejas; al acabar la bola de nieve cobra vida) y 🐍 La serpiente de Navidad (come galletas y crece; niveles facilísimo, intermedio y difícil). Cuando están los dos: fuegos artificiales, «Ho, ho, ho», Merry Christmas y confeti, y después el resumen del mes con todas las casillas. El día 25 no tiene actividad 1 ni 2.'],
    ].map(([n, e, t, d]) => el('div', { class: 'hg-day' }, el('span', { class: 'hg-day-n' }, n), el('span', { class: 'hg-day-e' }, e), el('div', {}, B(t), d ? el('small', {}, d) : null)))),
  ] },
  { id: 'points', ico: '⭐', title: 'Marcador de Navidad (para todos)', color: '#c99a2e', body: () => [
    P('Galletas, árboles y gnomos suman puntos cada vez que ', B('terminan un juego'), ': la ', B('1.ª vez +2'), ' y las siguientes ', B('+1'), ' (como mucho ', B('5 veces al día por juego'), '). En Dulce Navidad cuenta al pasar los 5 niveles; en el Código secreto, solo si lo adivinan. El 1 de diciembre empieza de 0 y ', B('se cierra el 24 de diciembre a las 23:59'), ' (igual que el juego de los gnomos).'),
    shot('board'),
    steps(el('span', {}, 'Configuración → ', btn('⭐ Marcador de Navidad'), '.'),
      el('span', {}, 'Marca los ', B('juegos que dan puntos'), ' (al principio, todos) y pulsa ', btn('💾 Guardar juegos', 'red'), '.'),
      el('span', {}, 'Abajo ves la ', B('clasificación completa'), ': 📜 abre el historial de cada uno y ✕ lo pone a 0.')),
    warn('No tiene nada que ver con el marcador 🍄 de los gnomos. Aquí no se pueden dar puntos a mano.'),
    tip('Juegos que cuentan: días 1 (gorros, y la 1.ª partida del 4 en raya: +2), 3, 4, 5, 6, 7, 8 (árbol y Dulce Navidad), 9, 10 (la oca), 11, 12 (parchís en línea: 4-3-2-1 según el puesto, −1 si abandonas), 13 (solitario resuelto), 14, 15, 16 (marcianitos: al llegar a 100 puntos), 17, 18, 19, 21, 22 y 23. El día 25 ya está cerrado. Las preguntas no dan puntos aquí.'),
  ] },
  { id: 'candy', ico: '🍬', title: 'Dulce Navidad (día 8) y puntos de gnomos', color: '#a3122c', body: () => [
    P('Un mini juego como el Candy Crush, con tus dibujos. Botón rojo «¡Juega a Dulce Navidad!» arriba del árbol del día 8 (y otra vez al acabar de decorarlo). No cuenta para la casilla.'),
    shot('candy'),
    el('div', { class: 'hg-list' },
      el('div', {}, el('span', {}, '🎮'), el('div', {}, B('24 partidas'), el('small', {}, 'Cada vez que se entra, una nueva y distinta. Después se puede volver a empezar.'))),
      el('div', {}, el('span', {}, '🪜'), el('div', {}, B('5 niveles'), el('small', {}, 'Cada uno más difícil. Si no se pasa, se repite el nivel.'))),
      el('div', {}, el('span', {}, '⭐'), el('div', {}, B('Contador «4 en raya»'), el('small', {}, 'Cada estrella mágica suma 1 hasta la meta (100). Al llegar, celebración.')))),
    el('h4', {}, '🍄 Puntos para los gnomos'),
    tip('Además, cada casilla que hace un gnomo le suma +1 en su juego (se suma solo, sin botón; en noviembre cuenta desde que empezó el juego de los gnomos y el 1 de diciembre empieza de 0). Se cambia en 🍄 → 🎮 Puntos en los juegos → «Casillas del calendario hechas».'),
    P('En su ', B('PRIMERA partida'), ': si pasan el nivel 2, ', B('+1'), '; si pasan los 5 niveles, ', B('3 en total'), '. Les sale un botón verde «🍄 ¡Pulsa y cobra!» y los puntos aparecen en su marcador como «🎮 Juego».'),
    steps(el('span', {}, 'Configuración → ', btn('🍄 Juego de los gnomos'), ' → ', btn('🎮 Puntos en los juegos'), '.'),
      el('span', {}, 'Arriba: la ', B('meta del contador'), ' (para todos) y ', btn('💾 Guardar meta', 'red'), '.'),
      el('span', {}, 'Debajo: activar Dulce Navidad, los puntos (0 a 5) y quién ha jugado su partida de puntos (✕ la borra y puede volver a jugarla).')),
  ] },
  { id: 'oca', ico: '🪿', title: 'La oca de Navidad (día 10)', color: '#1f6b45', body: () => [
    P('El día 10 ya no es una pregunta: es el ', B('juego de la oca'), ' con dibujos de Navidad y tablero luminoso. Arriba, el dado en su hueco (un toque gira, otro toque para), a un lado el cronómetro y al otro las instrucciones. Se juega solo o contra el Pare Noel.'),
    el('div', { class: 'hg-list' },
      el('div', {}, el('span', {}, '⭐'), el('div', {}, B('Marcador de Navidad'), el('small', {}, 'Acabar (solo o ganando) suma +2 la 1.ª vez y +1 las siguientes. Perder contra el Pare Noel: −1, como mucho una vez al día.'))),
      el('div', {}, el('span', {}, '🍄'), el('div', {}, B('Gnomos'), el('small', {}, 'La 1.ª vez que ganan al Pare Noel: +2 (botón verde para cobrar). Perder: −1, como mucho una vez al día. Se cambia en 🍄 → 🎮 Puntos en los juegos.')))),
    tip('Casillas: ocas (saltan y vuelven a tirar), trineos 6↔12, regalos 26↔53, casita de galleta 19 (1 turno), bola de nieve 31 y saco 52 (2 turnos), bosque 42 (a la 30), muñeco de nieve 58 (a empezar), árbol 63 (gana).'),
  ] },
  { id: 'invaders', ico: '👽', title: 'Los marcianitos de Navidad (día 16)', color: '#3b2a8a', body: () => [
    P('Debajo del diploma absurdo hay un botón rojo ', B('«¡Pulsa para divertirte!»'), '. Abre un juego como el Space Invaders de antes: marcianitos verdes con gorro de Papá Noel que bajan poco a poco y un trineo que les dispara rayos láser.'),
    el('div', { class: 'hg-list' },
      el('div', {}, el('span', {}, '🎮'), el('div', {}, B('Cómo se juega'), el('small', {}, '⚡ LÁSER a la izquierda y ◀ ▶ a la derecha mueven el trineo (o arrastrar el dedo por el tablero); el botón rojo ⚡ LÁSER dispara (mantenido, dispara seguido). Dos niveles: Fácil (lentos, pocas bolas de nieve, 4 trineos) y Difícil (3 trineos). Marcianitos: abajo 1 punto, en medio 2, arriba 3; platillo volador 5, 10 o 15. Fuertes de nieve para esconderse. Botón 📜 Normas dentro del juego.'))),
      el('div', {}, el('span', {}, '⭐'), el('div', {}, B('Marcador de Navidad'), el('small', {}, 'Al llegar a 100 puntos (en Fácil o en Difícil): +2 la 1.ª vez y +1 las siguientes (como mucho 5 al día). No resta nada.'))),
      el('div', {}, el('span', {}, '🍄'), el('div', {}, B('Gnomos'), el('small', {}, 'La 1.ª vez que llegan a 100 puntos: +2 (botón verde para cobrar). Se cambia en 🍄 → 🎮 Puntos en los juegos.')))),
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
      el('div', {}, el('span', {}, '🔊'), el('div', {}, B('Sonido'), el('small', {}, 'Si alguien no oye nada, que mire si su botón 🔊 está en rojo 🔇 y lo toque. En iPhone, además, nada suena hasta tocar la pantalla.'))),
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
  openGuide(userSections(), { bar, sub, ui: UI[lang], langs: lang, onLang: l => openUserHelp(l), intro: keysIntro });
}

function openGuide(SECTIONS, { bar: barTitle, sub, ui = UI.es, langs = null, onLang = null, intro = null }) {
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
    intro ? intro(go) : null,
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
  { id: 'u-enter', ico: '❄️', color: '#0e7490', title: L('Cómo se entra: la pantalla de la nieve', 'Com s’entra: la pantalla de la neu', 'How to get in: the snow screen'), body: () => [
    P(L('Al abrir la app ', 'En obrir l’app ', 'When you open the app it '), B(L('nieva', 'neva', 'snows')), L(' y suena música (en iPhone, toca la pantalla para oírla). Abajo sale esta tarjeta:', ' i sona música (a l’iPhone, toca la pantalla per sentir-la). A baix surt aquesta targeta:', ' and music plays (on iPhone, tap the screen to hear it). This card appears:')),
    shot('login'),
    el('div', { class: 'hg-nums' },
      num(1, '🙋', L('Tu nombre', 'El teu nom', 'Your name'), L('Si hay dos personas con el mismo nombre, añade un número: Marian2.', 'Si hi ha dues persones amb el mateix nom, afegeix-hi un número: Marian2.', 'If two people share a name, add a number: Marian2.')),
      num(2, '🔢', L('Tu PIN: 4 números', 'El teu PIN: 4 números', 'Your PIN: 4 numbers'), L('La primera vez te lo inventas tú. Es tuyo y es tu llave para siempre.', 'La primera vegada te l’inventes tu. És teu i és la teva clau per sempre.', 'The first time you make it up. It is yours and it is your key forever.')),
      num(3, '🔔', L('Pulsa para empezar', 'Prem per començar', 'Tap to start'), '')),
    el('div', { class: 'hg-bigsep' }, '⬇️'),
    P(B(L('Solo la primera vez', 'Només la primera vegada', 'Only the first time')), L(' sale la palabra secreta:', ' surt la paraula secreta:', ' the secret word appears:')),
    shot('word'),
    el('div', { class: 'hg-nums' },
      num(4, '🔑', L('La palabra secreta', 'La paraula secreta', 'The secret word'), L('Te la da la administradora (Mamá Noel). Es la misma para todos. Da igual mayúsculas o acentos.', 'Te la dona l’administradora (la Mare Noel). És la mateixa per a tothom. És igual majúscules o accents.', 'The admin (Mrs Claus) gives it to you. It is the same for everyone. Capitals and accents don’t matter.'))),
    tip(L('¿No sabes la palabra secreta? Pulsa ', 'No saps la paraula secreta? Prem ', 'Don’t know the secret word? Tap '), btn(L('💌 No la sé', '💌 No la sé', '💌 I don’t know it')), L(' y después «Escribir a Mamá Noel»: se abre un correo ya escrito. Ella sabrá que quieres entrar y te enviará la palabra.', ' i després «Escriure a la Mare Noel»: s’obre un correu ja escrit. Ella sabrà que vols entrar i t’enviarà la paraula.', ' and then “Write to Mrs Claus”: a ready-written email opens. She’ll know you want to join and will send you the word.')),
    el('div', { class: 'hg-bigsep' }, '⬇️'),
    P(L('Después, la app te enseña tu PIN en grande:', 'Després, l’app t’ensenya el teu PIN en gran:', 'Then the app shows you your PIN in big numbers:')),
    shot('pin'),
    el('div', { class: 'hg-tip big' }, '📸 ', B(L('¡Haz una foto o apúntalo!', 'Fes-hi una foto o apunta’l!', 'Take a photo or write it down!')), ' ', L('Te hará falta si algún día entras desde otro móvil, tableta u ordenador.', 'Et caldrà si algun dia entres des d’un altre mòbil, tauleta o ordinador.', 'You will need it if you ever come in from another phone, tablet or computer.')),
    el('div', { class: 'hg-bigsep' }, '⬇️'),
    P(B(L('Las próximas veces, en el mismo móvil:', 'Les properes vegades, al mateix mòbil:', 'Next times, on the same phone:')), L(' solo tu nombre y ¡dentro!', ' només el teu nom i a dins!', ' just your name and you’re in!')),
    shot('next'),
    el('div', { class: 'hg-when' },
      whenRow('🆕', L('Primera vez', 'Primera vegada', 'First time'), ['🙋', '🔢', '🔑']),
      whenRow('📱', L('Mismo móvil', 'Mateix mòbil', 'Same phone'), ['🙋']),
      whenRow('💻', L('Otro móvil o tableta', 'Un altre mòbil o tauleta', 'Another phone or tablet'), ['🙋', '🔢'])),
    el('div', { class: 'hg-list' },
      item('❄️', L('Volver a la nieve', 'Tornar a la neu', 'Back to the snow'), L('El botón ❄️ de arriba te lleva otra vez a esta pantalla.', 'El botó ❄️ de dalt et porta un altre cop a aquesta pantalla.', 'The ❄️ button at the top takes you back to this screen.')),
      item('📖', L('Cómo funciona', 'Com funciona', 'How it works'), L('Esta guía. Puedes leerla antes de empezar.', 'Aquesta guia. La pots llegir abans de començar.', 'This guide. You can read it before you start.')),
      item('ℹ️', L('La «i» de la esquina', 'La «i» del racó', 'The “i” in the corner'), L('Bienvenida y el correo de la administradora.', 'Benvinguda i el correu de l’administradora.', 'Welcome and the admin’s email.')),
      item('🔑', L('«Soy la administradora»', '«Soc l’administradora»', '“I am the admin”'), L('Solo para la persona que prepara el calendario.', 'Només per a la persona que prepara el calendari.', 'Only for the person who prepares the calendar.'))),
    tip(L('¿Has olvidado tu PIN o la palabra secreta? Pídeselos a la administradora (su correo está en la «i»).', 'Has oblidat el PIN o la paraula secreta? Demana-ho a l’administradora (el seu correu és a la «i»).', 'Forgot your PIN or the secret word? Ask the admin (her email is in the “i”).')),
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
      item('⭐', L('Botón dorado con tu nombre', 'Botó daurat amb el teu nom', 'Golden button with your name'), L('Tu Marcador de Navidad: tus puntos, los 5 primeros y tu historial.', 'El teu Marcador de Nadal: els teus punts, els 5 primers i el teu historial.', 'Your Christmas scoreboard: your points, the top 5 and your history.')),
      item('🔍', L('Barra roja fina', 'Barra vermella fina', 'Thin red bar'), L('Para ver el calendario a pantalla completa.', 'Per veure el calendari a pantalla completa.', 'To see the calendar full screen.')),
      item('🎅', L('Franja de figuras', 'Franja de figures', 'Row of figures'), L('Una figura por día que se ilumina cuando lo haces bien. A la izquierda, el trofeo 🏆 con tus aciertos.', 'Una figura per dia que s’il·lumina quan ho fas bé. A l’esquerra, el trofeu 🏆 amb els teus encerts.', 'One figure per day that lights up when you get it right. On the left, the trophy 🏆 with your score.')),
      item('📣', L('Cinta que se mueve', 'Cinta que es mou', 'Moving banner'), L('Un mensaje navideño, a veces solo para ti.', 'Un missatge nadalenc, de vegades només per a tu.', 'A Christmas message, sometimes just for you.')),
      item('🎁', L('El calendario', 'El calendari', 'The calendar'), L('Con las 25 casillas. Toca un número para abrir su casilla.', 'Amb les 25 caselles. Toca un número per obrir la seva casella.', 'With the 25 boxes. Tap a number to open its box.'))),
  ] },
  { id: 'u-sound', ico: '🔊', color: '#16a34a', title: L('El botón del sonido', 'El botó del so', 'The sound button'), body: () => [
    P(L('El botón ', 'El botó ', 'The '), btn('🔊'), L(' es un interruptor: un toque quita el sonido y otro toque lo vuelve a poner.', ' és un interruptor: un toc treu el so i un altre toc el torna a posar.', ' button is a switch: one tap turns sound off and another tap turns it back on.')),
    shot('sound'),
    row(card(el('div', { class: 'hg-big' }, '🔊'), L('Verde', 'Verd', 'Green'), L('Sonido activado', 'So activat', 'Sound on')),
      card(el('div', { class: 'hg-big hg-red' }, '🔇'), L('Rojo', 'Vermell', 'Red'), L('Sonido apagado', 'So apagat', 'Sound off'))),
    P(L('Se queda como lo dejes, aunque cierres la app. También sale ', 'Es queda com el deixes, encara que tanquis l’app. També surt ', 'It stays as you leave it, even if you close the app. It also appears '), B(L('flotando arriba a la derecha', 'flotant a dalt a la dreta', 'floating at the top right')), L(' en la nieve, en las casillas y en los juegos.', ' a la neu, a les caselles i als jocs.', ' on the snow screen, in the boxes and in the games.')),
    tip(L('Si no oyes nada, mira si el botón está en rojo y tócalo.', 'Si no sents res, mira si el botó és vermell i toca’l.', 'If you hear nothing, check whether the button is red and tap it.')),
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
    P(L('Las preguntas se contestan ', 'Les preguntes es contesten ', 'Questions are answered '), B(L('una sola vez', 'un sol cop', 'only once')), L('. Los juegos los puedes repetir siempre que quieras: al volver a abrir una casilla hecha, verás el juego, los otros juegos del día y tu actividad.', '. Els jocs els pots repetir sempre que vulguis: quan tornis a obrir una casella feta, veuràs el joc, els altres jocs del dia i la teva activitat.', '. Games can be replayed whenever you like: when you reopen a finished box you’ll see the game, the day’s other games and your activity.')),
    tip(L('Si te dejas un día, lo puedes hacer cuando puedas: las casillas de los días que ya han pasado siempre se pueden abrir. ¡Pero mejor no dejarlo pasar mucho!', 'Si et deixes un dia, el pots fer quan puguis: les caselles dels dies que ja han passat sempre es poden obrir. Però millor no deixar-ho passar gaire!', 'If you miss a day, you can do it whenever you can: boxes from past days can always be opened. But better not leave it too long!')),
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
      f === 'gnomo' ? tip(L('Como gnomo tienes DOS marcadores: el 🍄 de la seta (abajo a la izquierda, solo gnomos) y el ⭐ Marcador de Navidad (el botón dorado, para todos). No se mezclan.', 'Com a gnom tens DOS marcadors: el 🍄 del bolet (a baix a l’esquerra, només gnoms) i el ⭐ Marcador de Nadal (el botó daurat, per a tothom). No es barregen.', 'As a gnome you have TWO scoreboards: the 🍄 mushroom one (bottom left, gnomes only) and the ⭐ Christmas scoreboard (the golden button, for everyone). They never mix.')) : null,
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
  { id: 'u-points', ico: '⭐', color: '#c99a2e', title: L('El Marcador de Navidad', 'El Marcador de Nadal', 'The Christmas scoreboard'), body: () => [
    P(L('Todos (galletas, árboles y gnomos) suman puntos cada vez que ', 'Tothom (galetes, arbres i gnoms) suma punts cada cop que ', 'Everyone (gingerbreads, trees and gnomes) scores points every time they '), B(L('terminan un juego', 'acaba un joc', 'finish a game')), '.'),
    shot('score'),
    el('div', { class: 'hg-nums' },
      num('+2', '🥇', L('La primera vez', 'La primera vegada', 'The first time'), L('que terminas un juego.', 'que acabes un joc.', 'you finish a game.')),
      num('+1', '🔁', L('Cada vez que lo repites', 'Cada cop que el repeteixes', 'Each time you replay it'), L('y lo vuelves a terminar (hasta 5 veces al día por juego).', 'i el tornes a acabar (fins a 5 vegades al dia per joc).', 'and finish it again (up to 5 times a day per game).'))),
    P(L('Toca el ', 'Toca el ', 'Tap the '), B(L('botón dorado con tu nombre', 'botó daurat amb el teu nom', 'golden button with your name')), L(': verás tus puntos, en qué puesto vas, ', ': veuràs els teus punts, en quin lloc vas, ', ': you’ll see your points, your position, '), B(L('los 5 primeros', 'els 5 primers', 'the top 5')), L(' y tu historial.', ' i el teu historial.', ' and your history.')),
    shot('board'),
    tip(L('En Dulce Navidad (día 8) cuenta al pasar los 5 niveles. ¡A ver quién llega primero! 🏆', 'A Dolç Nadal (dia 8) compta quan passes els 5 nivells. A veure qui arriba primer! 🏆', 'In Sweet Christmas (day 8) it counts when you beat all 5 levels. Let’s see who gets there first! 🏆')),
    warn(L('El marcador se cierra el 24 de diciembre a las 23:59. ¡Después ya no se suman puntos!', 'El marcador es tanca el 24 de desembre a les 23:59. Després ja no se sumen punts!', 'The scoreboard closes on 24 December at 23:59. No more points after that!')),
  ] },
  { id: 'u-candy', ico: '🍬', color: '#a3122c', title: L('Dulce Navidad (día 8)', 'Dolç Nadal (dia 8)', 'Sweet Christmas (day 8)'), body: () => [
    P(L('En el día 8, además de decorar el árbol, pulsa el botón rojo ', 'Al dia 8, a més de decorar l’arbre, prem el botó vermell ', 'On day 8, besides decorating the tree, tap the red button '), btn(L('¡Juega a Dulce Navidad!', 'Juga a Dolç Nadal!', 'Play Sweet Christmas!'), 'red'), '.'),
    shot('candy'),
    steps(el('span', {}, B(L('Desliza una pieza', 'Llisca una peça', 'Swipe a piece')), L(' hacia la de al lado para hacer filas de 3 iguales.', ' cap a la del costat per fer files de 3 iguals.', ' towards its neighbour to make rows of 3.')),
      el('span', {}, L('Con 4 o más sale una ', 'Amb 4 o més surt una ', 'With 4 or more you get a '), B(L('⭐ estrella mágica', '⭐ estrella màgica', '⭐ magic star')), L(': se lleva su fila y su columna.', ': s’emporta la seva fila i la seva columna.', ': it clears its row and column.')),
      el('span', {}, L('Llega a los puntos 🎯 antes de que se acaben los movimientos.', 'Arriba als punts 🎯 abans que s’acabin els moviments.', 'Reach the points 🎯 before you run out of moves.'))),
    el('div', { class: 'hg-list' },
      item('🎮', L('24 partidas', '24 partides', '24 games'), L('Cada vez que entras, una partida nueva y distinta.', 'Cada cop que hi entres, una partida nova i diferent.', 'Every time you come in, a new and different game.')),
      item('🪜', L('5 niveles', '5 nivells', '5 levels'), L('Cada nivel, un poco más difícil.', 'Cada nivell, una mica més difícil.', 'Each level a bit harder.')),
      item('⭐', L('Contador «4 en raya»', 'Comptador «4 en ratlla»', '“4 in a row” counter'), L('Cada estrella mágica suma 1. ¡Llega a la meta!', 'Cada estrella màgica suma 1. Arriba a la meta!', 'Each magic star adds 1. Reach the goal!'))),
    tip(L('Los gnomos ganan puntos para su juego en su primera partida: un botón verde 🍄 les avisa para cobrarlos.', 'Els gnoms guanyen punts per al seu joc a la seva primera partida: un botó verd 🍄 els avisa per cobrar-los.', 'Gnomes earn points for their game in their first round: a green 🍄 button tells them to collect them.')),
  ] },
  { id: 'u-oca', ico: '🪿', color: '#1f6b45', title: L('La oca de Navidad (día 10)', 'L’oca de Nadal (dia 10)', 'The Christmas goose game (day 10)'), body: () => [
    P(L('El juego de la oca de siempre, con dibujos de Navidad. Pulsa ', 'El joc de l’oca de sempre, amb dibuixos de Nadal. Prem ', 'The classic goose game with Christmas pictures. Tap '), btn(L('¡A jugar a la oca!', 'A jugar a l’oca!', 'Let’s play!'), 'red'), L(' y elige: solo o contra el Pare Noel.', ' i tria: sol o contra el Pare Noel.', ' and choose: alone or against Santa.')),
    steps(el('span', {}, B(L('Toca el dado', 'Toca el dau', 'Tap the dice')), L(': empieza a girar.', ': comença a girar.', ': it starts spinning.')),
      el('span', {}, B(L('Vuelve a tocarlo', 'Torna’l a tocar', 'Tap it again')), L(' para pararlo: tu ficha avanza.', ' per parar-lo: la teva fitxa avança.', ' to stop it: your token moves.')),
      el('span', {}, L('¡De oca a oca y tiro porque me toca! Llega justo al árbol de Navidad (63).', 'D’oca a oca i tiro perquè em toca! Arriba just a l’arbre de Nadal (63).', 'From goose to goose! Land exactly on the Christmas tree (63).'))),
    el('div', { class: 'hg-list' },
      item('⏱', L('Cronómetro', 'Cronòmetre', 'Timer'), L('Mira cuánto tardas en acabar.', 'Mira quant tardes a acabar.', 'See how long you take.')),
      item('📜', L('Instrucciones', 'Instruccions', 'Rules'), L('Al lado del dado: qué hace cada casilla especial.', 'Al costat del dau: què fa cada casella especial.', 'Next to the dice: what each special square does.')),
      item('⭐', L('Puntos', 'Punts', 'Points'), L('Acabar suma en el Marcador de Navidad. Si pierdes contra el Pare Noel: −1 (como mucho una vez al día).', 'Acabar suma al Marcador de Nadal. Si perds contra el Pare Noel: −1 (com a molt un cop al dia).', 'Finishing adds to the scoreboard. Lose to Santa: −1 (at most once a day).'))),
    tip(L('Gnomos: la primera vez que ganáis al Pare Noel, ¡premio para vuestro juego! 🍄', 'Gnoms: la primera vegada que guanyeu el Pare Noel, premi per al vostre joc! 🍄', 'Gnomes: the first time you beat Santa, a prize for your game! 🍄')),
  ] },
  { id: 'u-c4', ico: '🔴', color: '#1846b8', title: L('El 4 en raya (día 1)', 'El 4 en ratlla (dia 1)', 'Connect 4 (day 1)'), body: () => [
    P(L('Debajo de los gorros pulsa ', 'A sota dels barrets prem ', 'Below the hats tap '), btn(L('¡Juega al 4 en raya!', 'Juga al 4 en ratlla!', 'Play Connect 4!'), 'red'), L(' y elige: contra el Pare Noel o con alguien en línea.', ' i tria: contra el Pare Noel o amb algú en línia.', ' and choose: against Santa or someone online.')),
    el('div', { class: 'hg-list' },
      item('👆', L('Tirar', 'Tirar', 'Play'), L('Coge tu ficha de abajo y suéltala encima de una columna: cae hasta abajo.', 'Agafa la teva fitxa de sota i deixa-la anar a sobre d’una columna: cau fins a baix.', 'Drag your disc over a column and let go: it drops.')),
      item('🎯', L('Ganar', 'Guanyar', 'Win'), L('4 fichas seguidas: en fila, columna o diagonal.', '4 fitxes seguides: en fila, columna o diagonal.', '4 in a row: across, down or diagonal.')),
      item('💬', L('Mensajes', 'Missatges', 'Messages'), L('En línea podéis escribiros. Al acabar se borran.', 'En línia us podeu escriure. En acabar s’esborren.', 'Online you can write to each other. Deleted at the end.')),
      item('⏱', L('20 segundos', '20 segons', '20 seconds'), L('Si no tiras, te pregunta si sigues jugando.', 'Si no tires, et pregunta si continues jugant.', 'If you don’t play, it asks if you’re still playing.'))),
    tip(L('Tu 1.ª partida acabada suma +2 en el Marcador de Navidad. Gnomos: +2 si la ganan, +1 si pierden o empatan. 🍄', 'La teva 1a partida acabada suma +2 al Marcador de Nadal. Gnoms: +2 si la guanyen, +1 si perden o empaten. 🍄', 'Your 1st finished game: +2 Christmas scoreboard. Gnomes: +2 win, +1 loss or draw. 🍄')),
  ] },
  { id: 'u-sol', ico: '🃏', color: '#0f7a3c', title: L('El solitario de Navidad (día 13)', 'El solitari de Nadal (dia 13)', 'Christmas solitaire (day 13)'), body: () => [
    P(L('Debajo de la ruleta de superpoderes pulsa ', 'A sota de la ruleta de superpoders prem ', 'Below the superpower wheel tap '), btn(L('¡Juega al solitario de Navidad!', 'Juga al solitari de Nadal!', 'Play Christmas solitaire!'), 'red'), '.'),
    el('div', { class: 'hg-list' },
      item('👆', L('Tocar', 'Tocar', 'Tap'), L('Toca una carta y se va sola donde puede ir. También la puedes arrastrar.', 'Toca una carta i se’n va sola on pot anar. També la pots arrossegar.', 'Tap a card and it goes where it can. You can also drag it.')),
      item('🔴🟢', L('Columnas', 'Columnes', 'Columns'), L('Bajan de una en una, del color que quieras (también del mismo color). En una columna vacía, solo una K (Papá Noel). Si ya no se puede hacer nada más, te avisa.', 'Baixen d’una en una, del color que vulguis (també del mateix color). En una columna buida, només una K (Pare Noel). Si ja no es pot fer res més, t’avisa.', 'Going down one by one, any colour (even the same colour). Only a K (Santa) in an empty column. If there are no moves left, you’ll be told.')),
      item('🂠', L('Mazo', 'Munt', 'Pile'), L('Arriba a la izquierda: tócalo para sacar cartas.', 'A dalt a l’esquerra: toca’l per treure cartes.', 'Top left: tap it to draw cards.')),
      item('↶', L('Deshacer', 'Desfer', 'Undo'), L('Para volver atrás si te equivocas.', 'Per tornar enrere si t’equivoques.', 'To go back if you make a mistake.'))),
    tip(L('Si lo resuelves: suma al Marcador de Navidad. Gnomos: la 1.ª vez, ¡puntos para vuestro juego! 🍄', 'Si el resols: suma al Marcador de Nadal. Gnoms: la 1a vegada, punts per al vostre joc! 🍄', 'Solve it for Christmas scoreboard points. Gnomes: the first time, points for your game! 🍄')),
  ] },
  { id: 'u-inv', ico: '👽', color: '#3b2a8a', title: L('Los marcianitos de Navidad (día 16)', 'Els marcianets de Nadal (dia 16)', 'Christmas space invaders (day 16)'), body: () => [
    P(L('Debajo del diploma absurdo pulsa ', 'A sota del diploma absurd prem ', 'Below the absurd diploma tap '), btn(L('¡Pulsa para divertirte!', 'Prem per divertir-te!', 'Tap to have fun!'), 'red'), L(': ¡llegan los marcianitos con gorro de Papá Noel!', ': arriben els marcianets amb gorro de Pare Noel!', ': here come the invaders in Santa hats!')),
    el('div', { class: 'hg-list' },
      item('◀ ▶', L('Moverte', 'Moure’t', 'Move'), L('Las flechas mueven el trineo. También puedes arrastrar el dedo por el tablero.', 'Les fletxes mouen el trineu. També pots arrossegar el dit pel tauler.', 'The arrows move the sleigh. You can also drag on the board.')),
      item('⚡', L('Rayo láser', 'Raig làser', 'Laser'), L('El botón rojo dispara. Si lo mantienes pulsado, dispara seguido.', 'El botó vermell dispara. Si el mantens premut, dispara seguit.', 'The red button fires. Hold it to keep firing.')),
      item('👽', L('Puntos', 'Punts', 'Points'), L('Abajo 1, en medio 2, arriba 3. El platillo volador 🛸: 5, 10 o 15.', 'A baix 1, al mig 2, a dalt 3. El plateret volador 🛸: 5, 10 o 15.', 'Bottom 1, middle 2, top 3. The flying saucer 🛸: 5, 10 or 15.')),
      item('❄️', L('Cuidado', 'Compte', 'Watch out'), L('Te tiran bolas de nieve: escóndete detrás de los fuertes. Elige Fácil o Difícil.', 'Et tiren boles de neu: amaga’t darrere els fortins. Tria Fàcil o Difícil.', 'They throw snowballs: hide behind the forts. Choose Easy or Hard.'))),
    tip(L('Llega a 100 puntos y sumas en el Marcador de Navidad. Gnomos: la 1.ª vez, ¡premio para vuestro juego! 🍄', 'Arriba a 100 punts i sumes al Marcador de Nadal. Gnoms: la 1a vegada, premi per al vostre joc! 🍄', 'Reach 100 points for the Christmas scoreboard. Gnomes: the first time, a prize for your game! 🍄')),
  ] },
  { id: 'u-prizes', ico: '🏆', color: '#b45309', title: L('Los premios', 'Els premis', 'The prizes'), body: () => [
    P(L('Hay ', 'Hi ha ', 'There are '), B(L('4 premios', '4 premis', '4 prizes')), L(': al llegar a la casilla 10, a la 15, a la 20 y a la 25.', ': en arribar a la casella 10, a la 15, a la 20 i a la 25.', ': on reaching box 10, 15, 20 and 25.')),
    P(L('Para ganar cada premio puedes fallar o dejarte sin hacer ', 'Per guanyar cada premi pots fallar o deixar sense fer ', 'To win each prize you can get wrong or skip '), B(L('como mucho 3 casillas', 'com a màxim 3 caselles', 'at most 3 boxes')), L(', contando desde el día 1.', ', comptant des del dia 1.', ', counting from day 1.')),
    mock(L('🏆 Premios', '🏆 Premis', '🏆 Prizes'), ...[10, 15, 20, 25].map(g => el('div', { class: 'hg-prize' }, el('span', {}, '🎁'), el('div', {}, B(L(`Del día 1 al ${g}`, `Del dia 1 al ${g}`, `Day 1 to ${g}`)), el('small', {}, L('El regalo y cómo vas: ✅ bien · ❌ mal', 'El regal i com vas: ✅ bé · ❌ malament', 'The gift and how you’re doing: ✅ right · ❌ wrong')))))),
    P(L('Pulsa el ', 'Prem el ', 'Tap the '), B(L('trofeo 🏆', 'trofeu 🏆', 'trophy 🏆')), L(' de la franja para ver los regalos y cuántas casillas llevas bien y mal. Toca un regalo para ver el detalle.', ' de la franja per veure els regals i quantes caselles portes bé i malament. Toca un regal per veure’n el detall.', ' in the row to see the gifts and how many boxes you have right and wrong. Tap a gift to see the details.')),
    P(L('Cuando consigues un regalo, sale un aviso con confeti (', 'Quan aconsegueixes un regal, surt un avís amb confeti (', 'When you win a present, a notice with confetti appears ('), B(L('solo una vez', 'només un cop', 'only once')), L('). Lo puedes volver a mirar siempre que quieras desde el trofeo 🏆.', '). El pots tornar a mirar sempre que vulguis des del trofeu 🏆.', '). You can look at it again whenever you like from the trophy 🏆.')),
    tip(L('Si un premio se escapa, ¡sigues jugando por los demás!', 'Si un premi s’escapa, continues jugant pels altres!', 'If you miss a prize, you keep playing for the others!')),
  ] },
  { id: 'u-special', ico: '🎮', color: '#db2777', title: L('Los juegos de cada día', 'Els jocs de cada dia', 'Each day’s games'), body: () => [
    P(L('Cada casilla esconde un ', 'Cada casella amaga un ', 'Each box hides a '), B(L('juego o un reto', 'joc o un repte', 'game or a challenge')), L('. Estos son los 25:', '. Aquests són els 25:', '. Here are all 25:')),
    el('div', { class: 'hg-list hg-days' },
      item('🎅 1', L('Atrapa los 3 gorros + 4 en raya', 'Atrapa els 3 barrets + 4 en ratlla', 'Catch the 3 hats + Connect 4'), ''),
      item('🎁 2', L('El duende de los regalos (comecocos)', 'El follet dels regals (menjacocos)', 'The present elf (Pac-Man style)'), ''),
      item('🔢 3', L('Sudoku de Navidad', 'Sudoku de Nadal', 'Christmas sudoku'), ''),
      item('🦌 4', L('Los renos traviesos', 'Els rens entremaliats', 'The cheeky reindeer'), ''),
      item('🎨 5', L('Desafío de colores', 'Desafiament de colors', 'Colour challenge'), ''),
      item('🔍 6', L('Las 5 diferencias', 'Les 5 diferències', 'Spot the 5 differences'), ''),
      item('🚂 7', L('Puzle del tren', 'Puzle del tren', 'Train puzzle'), ''),
      item('🎄 8', L('Decora el árbol + Dulce Navidad', 'Decora l’arbre + Dolç Nadal', 'Decorate the tree + Sweet Christmas'), ''),
      item('🎵 9', L('Papá Noel dice', 'El Pare Noel diu', 'Santa says'), ''),
      item('🪿 10', L('La oca de Navidad', 'L’oca de Nadal', 'The Christmas goose game'), ''),
      item('🧭 11', L('Los regalos perdidos (laberinto)', 'Els regals perduts (laberint)', 'The lost presents (maze)'), ''),
      item('🎲 12', L('El parchís de Navidad', 'El parxís de Nadal', 'Christmas ludo'), ''),
      item('🦸 13', L('Tu superpoder + solitario', 'El teu superpoder + solitari', 'Your superpower + solitaire'), ''),
      item('🛷 14', L('Atrapa los regalos', 'Atrapa els regals', 'Catch the presents'), ''),
      item('🔴 15', L('Ordena las bolas de Navidad', 'Ordena les boles de Nadal', 'Sort the baubles'), ''),
      item('📜 16', L('Diploma absurdo + marcianitos', 'Diploma absurd + marcianets', 'Absurd diploma + space invaders'), ''),
      item('❌ 17', L('Tres en raya de Navidad', 'Tres en ratlla de Nadal', 'Christmas noughts and crosses'), ''),
      item('🎅 18', L('Puzle de Papá Noel', 'Puzle del Pare Noel', 'Santa puzzle'), ''),
      item('🔐 19', L('El código secreto de Papá Noel', 'El codi secret del Pare Noel', 'Santa’s secret code'), ''),
      item('🎡 20', L('La ruleta del disparate', 'La ruleta del disbarat', 'The silly wheel'), ''),
      item('🧩 21', L('Puzle deslizante', 'Puzle lliscant', 'Sliding puzzle'), ''),
      item('🔤 22', L('Sopa de letras', 'Sopa de lletres', 'Word search'), ''),
      item('✏️ 23', L('Crucigrama de Navidad', 'Mots encreuats de Nadal', 'Christmas crossword'), ''),
      item('💃 24', L('El baile secreto', 'El ball secret', 'The secret dance'), ''),
      item('🎉 25', L('Memory + la serpiente de Navidad', 'Memory + la serp de Nadal', 'Memory + the Christmas snake'), '')),
    P(L('En cada juego la nota te explica qué hay que hacer, y muchos tienen niveles y un botón 📜 con las normas. Si hay que grabarse o hacerse una foto, la app te ayuda a compartirla por WhatsApp.', 'A cada joc la nota t’explica què cal fer, i molts tenen nivells i un botó 📜 amb les normes. Si t’has de gravar o fer una foto, l’app t’ajuda a compartir-la per WhatsApp.', 'In each game the note explains what to do, and many have levels and a 📜 rules button. If you need to record yourself or take a photo, the app helps you share it on WhatsApp.')),
    tip(L('Algunos juegos tienen sonido: sube el volumen. 🔊', 'Alguns jocs tenen so: apuja el volum. 🔊', 'Some games have sound: turn the volume up. 🔊')),
  ] },
  { id: 'u-25', ico: '🎆', color: '#7a1020', title: L('El día 25 y el resumen de tu Navidad', 'El dia 25 i el resum del teu Nadal', 'Day 25 and your Christmas summary'), body: () => [
    steps(el('span', {}, L('Al abrir la casilla 25 salen ', 'En obrir la casella 25 surten ', 'When you open box 25 you get '), B(L('dos juegos', 'dos jocs', 'two games')), L(': 🎴 Memory de Navidad y 🐍 la serpiente. ¡Hay que hacer los dos!', ': 🎴 Memory de Nadal i 🐍 la serp. Cal fer-los tots dos!', ': 🎴 Christmas memory and 🐍 the snake. You have to do both!')),
      el('span', {}, L('Cuando acabas los dos: ', 'Quan acabes tots dos: ', 'When you finish both: '), B(L('¡fiesta!', 'festa!', 'party time!')), L(' Fuegos artificiales, «Ho, ho, ho», Merry Christmas y mucho confeti.', ' Focs artificials, «Ho, ho, ho», Merry Christmas i molt de confeti.', ' Fireworks, “Ho, ho, ho”, Merry Christmas and lots of confetti.')),
      el('span', {}, L('Después sale ', 'Després surt ', 'Then you see '), B(L('el resumen de tu Navidad', 'el resum del teu Nadal', 'your Christmas summary')), L(': los 25 días con tus resultados, los juegos de cada día y tus actividades.', ': els 25 dies amb els teus resultats, els jocs de cada dia i les teves activitats.', ': all 25 days with your results, each day’s games and your activities.'))),
    P(L('Desde el resumen puedes ', 'Des del resum pots ', 'From the summary you can '), B(L('tocar cualquier día', 'tocar qualsevol dia', 'tap any day')), L(' para volver a entrar y jugar otra vez, también a los dos juegos del 25. Y con «Guardar en PDF» te lo puedes guardar de recuerdo.', ' per tornar-hi a entrar i jugar un altre cop, també als dos jocs del 25. I amb «Desar en PDF» te’l pots guardar de record.', ' to go back in and play again, including the two games of day 25. And with “Save as PDF” you can keep it as a souvenir.')),
    tip(L('Luego, al tocar la casilla 25, sale siempre el resumen. 🎄', 'Després, quan toquis la casella 25, sortirà sempre el resum. 🎄', 'After that, tapping box 25 always shows the summary. 🎄')),
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
      item('🔊', L('No se oye nada', 'No se sent res', 'No sound'), L('Mira el botón 🔊: si está en rojo 🔇, tócalo. Sube el volumen y toca la pantalla (en iPhone nada suena hasta que la tocas).', 'Mira el botó 🔊: si és vermell 🔇, toca’l. Apuja el volum i toca la pantalla (a l’iPhone res no sona fins que la toques).', 'Check the 🔊 button: if it is red 🔇, tap it. Turn the volume up and tap the screen (on iPhone nothing plays until you tap it).')),
      item('🔄', L('Algo se ve raro', 'Alguna cosa es veu estranya', 'Something looks odd'), L('Cierra la app (o la pestaña) y vuelve a abrirla.', 'Tanca l’app (o la pestanya) i torna-la a obrir.', 'Close the app (or the tab) and open it again.')),
      item('🔑', L('He olvidado mi PIN', 'He oblidat el meu PIN', 'I forgot my PIN'), L('Escribe a la persona responsable del calendario (su correo está en la «i» de la pantalla de la nieve): ella te lo dirá.', 'Escriu a la persona responsable del calendari (el seu correu és a la «i» de la pantalla de la neu): ella te’l dirà.', 'Write to the person in charge of the calendar (her email is in the “i” on the snow screen): she will tell you.')),
      item('🔒', L('La casilla no se abre', 'La casella no s’obre', 'The box won’t open'), L('Todavía no es su día: se abre a las 00:00.', 'Encara no és el seu dia: s’obre a les 00:00.', 'It isn’t its day yet: it opens at 00:00.'))),
    el('div', { class: 'hg-end' }, L('🎄 ¡Feliz Navidad! 🎄', '🎄 Bon Nadal! 🎄', '🎄 Merry Christmas! 🎄')),
  ] },
  ];
}
