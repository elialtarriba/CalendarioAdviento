// Guía de la app (para la administradora): pantalla completa, índice, dibujos y zoom con dos dedos
import { el } from './fx.js?v=16.2';

// ---------- piezas de dibujo (imitan los botones reales de la app)
const fig = (src, cls = '') => el('img', { class: 'hg-fig ' + cls, src, alt: '' });
const pill = (txt, cls = '') => el('span', { class: 'hg-pill ' + cls }, txt);
const btn = (txt, cls = '') => el('span', { class: 'hg-btn ' + cls }, txt);
const tip = (...k) => el('div', { class: 'hg-tip' }, el('b', {}, '💡 Truco: '), ...k);
const warn = (...k) => el('div', { class: 'hg-tip warn' }, el('b', {}, '⚠️ Ojo: '), ...k);
const steps = (...items) => el('ol', { class: 'hg-steps' }, ...items.map(i => el('li', {}, i)));
const mock = (title, ...k) => el('div', { class: 'hg-mock' }, title ? el('div', { class: 'hg-mock-bar' }, el('i'), el('i'), el('i'), el('span', {}, title)) : null, el('div', { class: 'hg-mock-body' }, ...k));
const row = (...k) => el('div', { class: 'hg-row' }, ...k);
const P = (...k) => el('p', {}, ...k);
const B = t => el('b', {}, t);
const sw = (on, label) => el('span', { class: 'hg-switch' + (on ? ' on' : '') }, el('span'), label);

const SECTIONS = [
  { id: 'app', ico: '🎄', title: 'Cómo funciona el calendario', color: '#b3122e', body: () => [
    P('Cada persona entra con su ', B('correo y contraseña'), '. Ve un calendario con ', B('25 casillas'), ' (del 1 al 25 de diciembre). Cada casilla se puede abrir a partir de las ', B('00:00 de ese día'), ' (hora de España). Antes, la casilla tiembla y no se abre.'),
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
    P('Arriba tienes el botón rojo de ', B('Mensajes sorpresa'), ' y debajo las cuatro pestañas. Abajo del todo, el botón ', B('Cerrar'), '.'),
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
      [8, '🎄', 'Decorar el árbol', ''],
      [12, '👁️', 'Ojo de lince', 'Qué objeto falta. Lo corriges tú en Respuestas.'],
      [13, '😇', '¿Has sido bueno?', 'La máquina de bondad.'],
      [15, '📜', 'Diploma absurdo', ''],
      [20, '🎡', 'Ruleta del disparate', 'Tú escribes las misiones de cada casilla y la frase de debajo.'],
      [24, '💃', 'El baile secreto', 'Pon tu vídeo en Premios y ajustes.'],
      [25, '🎅', 'Tu cara en Papá Noel', 'Foto para compartir, guardar o imprimir.'],
    ].map(([n, e, t, d]) => el('div', { class: 'hg-day' }, el('span', { class: 'hg-day-n' }, n), el('span', { class: 'hg-day-e' }, e), el('div', {}, B(t), d ? el('small', {}, d) : null)))),
  ] },
  { id: 'general', ico: '🏆', title: 'Premios y ajustes', color: '#b45309', body: () => [
    el('div', { class: 'hg-list' },
      el('div', {}, el('span', {}, '🏆'), el('div', {}, B('Premios'), el('small', {}, 'Lo que se gana en los días 10, 15, 20 y 25. Se gana si como mucho has fallado o dejado sin hacer 3 días hasta esa fecha.'))),
      el('div', {}, el('span', {}, '📣'), el('div', {}, B('Cinta que se mueve'), el('small', {}, 'Texto general en 3 idiomas, color, grosor y velocidad, con vista previa.'))),
      el('div', {}, el('span', {}, '❄️'), el('div', {}, B('Bienvenida con nieve'), el('small', {}, 'Mostrarla o no, segundos que nieva y el título. «👀 Verla ahora» para probarla.'))),
      el('div', {}, el('span', {}, '💃'), el('div', {}, B('Vídeo del baile (día 24)'), el('small', {}, 'Enlace de YouTube o nombre del vídeo. Vacío = baila el hombrecito de jengibre.'))),
      el('div', {}, el('span', {}, '📅'), el('div', {}, B('Año del calendario'), el('small', {}, 'Las casillas se abren del 1 al 25 de diciembre de ese año.'))),
      el('div', {}, el('span', {}, '🧪'), el('div', {}, B('Modo prueba'), el('small', {}, 'Abre todas las casillas solo para ti mientras no cierres la app. Ideal para probar.'))),
      el('div', {}, el('span', {}, '🔐'), el('div', {}, B('Contraseña de configuración'), el('small', {}, 'Cambiarla (actual + nueva dos veces).'))),
      el('div', {}, el('span', {}, '🧌'), el('div', {}, B('Aviso de día olvidado'), el('small', {}, 'El texto del duende verde cuando alguien no abre un día. {dia} = el número del día.')))),
  ] },
  { id: 'tips', ico: '🛠️', title: 'Consejos y problemas', color: '#475569', body: () => [
    el('div', { class: 'hg-list' },
      el('div', {}, el('span', {}, '🔢'), el('div', {}, B('Versión'), el('small', {}, 'Abajo a la izquierda se ve la versión (por ejemplo V16.2). Si después de subir cambios no la ves, recarga la página.'))),
      el('div', {}, el('span', {}, '⬆️'), el('div', {}, B('Subir cambios'), el('small', {}, 'Sube a GitHub todos los .js, index.html y styles.css a la vez, para que no se mezclen versiones.'))),
      el('div', {}, el('span', {}, '🔊'), el('div', {}, B('Sonido en iPhone'), el('small', {}, 'Apple no deja sonar nada hasta tocar la pantalla. Si deja de sonar, toca la pantalla otra vez: se recupera solo.'))),
      el('div', {}, el('span', {}, '↺'), el('div', {}, B('Empezar de cero'), el('small', {}, 'Usuarios → Configurar → Reiniciar todo, para borrar los días de prueba.'))),
      el('div', {}, el('span', {}, '🔥'), el('div', {}, B('Reglas de Firebase'), el('small', {}, 'Si algo dice «sin permiso», hay que volver a publicar las reglas (firestore.rules) en Firebase → Firestore Database → Reglas → Publicar.')))),
    el('div', { class: 'hg-end' }, '🎄 ¡Feliz Navidad! 🎄'),
  ] },
];

export function openHelp() {
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
  const reset = el('button', { class: 'hg-reset no-delay', onclick: () => setZoom(1) }, '↺ Tamaño normal');
  const bar = el('div', { class: 'hg-bar' },
    el('div', { class: 'hg-bar-title' }, '📖 Guía de la app'),
    el('div', { class: 'hg-bar-btns' },
      el('button', { class: 'hg-z no-delay', title: 'Más pequeño', onclick: () => setZoom(zoom - .25) }, '−'), zlabel,
      el('button', { class: 'hg-z no-delay', title: 'Más grande', onclick: () => setZoom(zoom + .25) }, '+'),
      el('button', { class: 'hg-close no-delay', onclick: close }, '✕ Cerrar')));
  const go = id => { const t = content.querySelector('#hg-' + id); if (t) scroll.scrollTo({ top: t.getBoundingClientRect().top - scroll.getBoundingClientRect().top + scroll.scrollTop - 8, behavior: 'smooth' }); };
  const toTop = el('button', { class: 'hg-top no-delay', onclick: () => scroll.scrollTo({ top: 0, behavior: 'smooth' }) }, '↑ Índice');

  // ---- portada + índice
  content.append(
    el('div', { class: 'hg-hero' }, el('div', { class: 'hg-hero-figs' }, fig('galleta.png'), fig('arbol.png'), fig('gnomo.png')),
      el('h1', {}, 'Calendario de Adviento'), el('p', {}, 'Todo lo que tiene la app y cómo configurarlo, paso a paso.')),
    el('h2', { class: 'hg-index-t' }, '📑 Índice'),
    el('p', { class: 'hg-hint' }, 'Toca un apartado para ir directamente. Puedes hacer zoom con dos dedos y volver con «↺ Tamaño normal».'),
    el('div', { class: 'hg-index' }, ...SECTIONS.map((s, i) => el('button', { class: 'hg-index-item no-delay', style: `--c:${s.color}`, onclick: () => go(s.id) },
      el('span', { class: 'hg-index-ico' }, s.ico), el('span', {}, el('small', {}, `${i + 1}.`), ' ', s.title)))));
  SECTIONS.forEach((s, i) => content.append(el('section', { class: 'hg-sec', id: 'hg-' + s.id, style: `--c:${s.color}` },
    el('h2', {}, el('span', { class: 'hg-sec-ico' }, s.ico), el('span', {}, el('small', {}, `${i + 1}`), s.title)),
    ...s.body(),
    el('button', { class: 'hg-back no-delay', onclick: () => scroll.scrollTo({ top: 0, behavior: 'smooth' }) }, '↑ Volver al índice'))));

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
}
