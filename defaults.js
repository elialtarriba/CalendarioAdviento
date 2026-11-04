// Contenido por defecto. Todo se puede cambiar desde Configuración.
const L = (es, ca, en) => ({ es, ca, en });

// ---- Preguntas con 4 respuestas: [pregunta, [a,b,c,d], índice correcto]
const Q = {
  1: [L('Tengo agujas pero no coso, tengo bolas pero no juego al fútbol. ¿Qué soy?',
        'Tinc agulles però no cuso, tinc boles però no jugo a futbol. Què sóc?',
        "I have needles but I don't sew, I have balls but I don't play football. What am I?"),
      { es: ['Un erizo presumido', 'Un árbol de Navidad', 'Una costurera aburrida', 'Un portero de fútbol'],
        ca: ['Un eriçó presumit', 'Un arbre de Nadal', 'Una cosidora avorrida', 'Un porter de futbol'],
        en: ['A vain hedgehog', 'A Christmas tree', 'A bored tailor', 'A goalkeeper'] }, 1],
  2: [L('¿Cuántos meses tienen 28 días?', 'Quants mesos tenen 28 dies?', 'How many months have 28 days?'),
      { es: ['3', '1', '12', '9'], ca: ['3', '1', '12', '9'], en: ['3', '1', '12', '9'] }, 2],
  3: [L('¿Cómo se llama el miedo a quedarse atascado en una chimenea?',
        'Com es diu la por de quedar-se encallat en una xemeneia?',
        "What do you call the fear of getting stuck in a chimney?"),
      { es: ['Renofobia', 'Turronitis aguda', 'Santa Claustrofobia', 'Chimeneopatía'],
        ca: ['Rensfòbia', 'Torronitis aguda', 'Santa Claustrofòbia', 'Xemeneiopatia'],
        en: ['Reindeerphobia', 'Acute puddingitis', 'Santa Claustrophobia', 'Chimneyitis'] }, 2],
  5: [L('¿Qué es un muñeco de nieve en pleno verano?', 'Què és un ninot de neu en ple estiu?', 'What is a snowman in the middle of summer?'),
      { es: ['Un charco', 'Un turista', 'Un helado gigante', 'Un muñeco de vacaciones'],
        ca: ['Un bassal', 'Un turista', 'Un gelat gegant', 'Un ninot de vacances'],
        en: ['A puddle', 'A tourist', 'A giant ice cream', 'A snowman on holiday'] }, 0],
  7: [L('¿Qué le dijo el 0 al 8?', 'Què li va dir el 0 al 8?', 'What did the 0 say to the 8?'),
      { es: ['¡Qué alto estás!', '¡Bonito cinturón!', '¡Te queda bien el gorro!', '¡No me sigas!'],
        ca: ['Que alt que estàs!', 'Quin cinturó més bonic!', 'Et queda bé el barret!', 'No em segueixis!'],
        en: ["You've grown!", 'Nice belt!', 'Nice hat!', 'Stop following me!'] }, 1],
  9: [L('¿Qué pesa más: un kilo de turrón o un kilo de plumas?', 'Què pesa més: un quilo de torró o un quilo de plomes?', 'Which weighs more: a kilo of nougat or a kilo of feathers?'),
      { es: ['El turrón, sin duda', 'Las plumas, que son muchas', 'Pesan lo mismo', 'Depende de quién se lo coma'],
        ca: ['El torró, sens dubte', 'Les plomes, que són moltes', 'Pesen el mateix', 'Depèn de qui se’l mengi'],
        en: ['The nougat, of course', 'The feathers, there are loads', 'They weigh the same', 'Depends who eats it'] }, 2],
  10: [L('¿Qué se rompe con solo decir su nombre?', 'Què es trenca només dient el seu nom?', 'What breaks as soon as you say its name?'),
      { es: ['El turrón duro', 'El silencio', 'La dieta de enero', 'Una bola de cristal'],
        ca: ['El torró dur', 'El silenci', 'La dieta de gener', 'Una bola de vidre'],
        en: ['Hard nougat', 'Silence', "January's diet", 'A glass bauble'] }, 1],
  11: [L('¿Dónde guarda Papá Noel su dinero?', 'On guarda el Pare Noel els seus diners?', 'Where does Santa keep his money?'),
      { es: ['En un calcetín', 'En un banco de nieve', 'Debajo del trineo', 'En la hucha de Rodolfo'],
        ca: ['En un mitjó', 'En un banc de neu', 'Sota el trineu', 'A la guardiola d’en Rodolf'],
        en: ['In a stocking', 'In a snow bank', 'Under the sleigh', "In Rudolph's piggy bank"] }, 1],
  14: [L('¿Qué le dijo una uva verde a una uva morada en Nochevieja?', 'Què li va dir un raïm verd a un raïm morat per Cap d’Any?', 'What did the green grape say to the purple grape on New Year’s Eve?'),
      { es: ['¡Feliz año!', '¡Te queda bien ese color!', '¡Respira!', '¡Corre, que vienen!'],
        ca: ['Bon any!', 'Et queda bé aquest color!', 'Respira!', 'Corre, que ja vénen!'],
        en: ['Happy New Year!', 'That colour suits you!', 'Breathe!', 'Run, they are coming!'] }, 2],
  16: [L('Un gallo pone un huevo en lo alto del tejado de Papá Noel. ¿Hacia qué lado cae?', 'Un gall pon un ou dalt de la teulada del Pare Noel. Cap a quin costat cau?', "A rooster lays an egg on top of Santa's roof. Which way does it roll?"),
      { es: ['Hacia la chimenea', 'Hacia el trineo', 'Hacia el lado del viento', 'Los gallos no ponen huevos'],
        ca: ['Cap a la xemeneia', 'Cap al trineu', 'Cap al costat del vent', 'Els galls no ponen ous'],
        en: ['Towards the chimney', 'Towards the sleigh', 'Downwind', "Roosters don't lay eggs"] }, 3],
  17: [L('¿Qué tiene un ojo pero no puede ver?', 'Què té un ull però no hi pot veure?', 'What has an eye but cannot see?'),
      { es: ['Una aguja', 'Un pirata dormido', 'Una patata', 'Un reno con gafas'],
        ca: ['Una agulla', 'Un pirata adormit', 'Una patata', 'Un ren amb ulleres'],
        en: ['A needle', 'A sleeping pirate', 'A potato', 'A reindeer in glasses'] }, 0],
  18: [L('¿Qué desayuna un muñeco de nieve?', 'Què esmorza un ninot de neu?', 'What does a snowman eat for breakfast?'),
      { es: ['Chocolate caliente (¡error fatal!)', 'Tostadas', 'Copos de nieve', 'Zanahorias'],
        ca: ['Xocolata calenta (error fatal!)', 'Torrades', 'Flocs de neu', 'Pastanagues'],
        en: ['Hot chocolate (fatal mistake!)', 'Toast', 'Snowflakes', 'Carrots'] }, 2],
  19: [L('¿Qué es lo que, cuanto más le quitas, más grande se hace?', 'Què és allò que, com més li treus, més gran es fa?', 'What gets bigger the more you take away from it?'),
      { es: ['Un agujero', 'La lista de regalos', 'La barriga de Papá Noel', 'Un bostezo'],
        ca: ['Un forat', 'La llista de regals', 'La panxa del Pare Noel', 'Un badall'],
        en: ['A hole', 'The present list', "Santa's belly", 'A yawn'] }, 0],
  21: [L('¿Cuál es el animal más antiguo?', 'Quin és l’animal més antic?', 'What is the oldest animal?'),
      { es: ['El dinosaurio', 'La tortuga', 'La cebra, porque está en blanco y negro', 'El reno jubilado'],
        ca: ['El dinosaure', 'La tortuga', 'La zebra, perquè és en blanc i negre', 'El ren jubilat'],
        en: ['The dinosaur', 'The tortoise', "The zebra, it's in black and white", 'The retired reindeer'] }, 2],
  22: [L('¿Qué tiene cuello pero no tiene cabeza?', 'Què té coll però no té cap?', 'What has a neck but no head?'),
      { es: ['Un jersey sin estrenar', 'Una botella', 'Un muñeco de nieve en verano', 'Una jirafa tímida'],
        ca: ['Un jersei per estrenar', 'Una ampolla', 'Un ninot de neu a l’estiu', 'Una girafa tímida'],
        en: ['A brand-new jumper', 'A bottle', 'A snowman in summer', 'A shy giraffe'] }, 1],
  23: [L('¿Qué sube y baja pero nunca se mueve?', 'Què puja i baixa però mai no es mou?', 'What goes up and down but never moves?'),
      { es: ['El ascensor', 'Las escaleras', 'El precio del turrón', 'Papá Noel por la chimenea'],
        ca: ['L’ascensor', 'Les escales', 'El preu del torró', 'El Pare Noel per la xemeneia'],
        en: ['The lift', 'The stairs', 'The price of mince pies', 'Santa in the chimney'] }, 1],
};

const SPECIAL = { 4: 'reindeer', 6: 'differences', 8: 'tree', 12: 'memory', 13: 'goodcheck', 15: 'diploma', 20: 'roulette', 24: 'dance', 25: 'santa' };

const MISSIONS = [
  L('Canta un villancico con voz de robot.', 'Canta una nadala amb veu de robot.', 'Sing a carol in a robot voice.'),
  L('Habla como un pirata durante los próximos 10 minutos.', 'Parla com un pirata durant els propers 10 minuts.', 'Talk like a pirate for the next 10 minutes.'),
  L('Haz 10 sentadillas diciendo «¡Ho, ho, ho!» en cada una.', 'Fes 10 esquats dient «Ho, ho, ho!» a cada un.', 'Do 10 squats shouting “Ho, ho, ho!” on each one.'),
  L('Ponte un calcetín en la mano y preséntalo como tu nuevo mejor amigo.', 'Posa’t un mitjó a la mà i presenta’l com el teu nou millor amic.', 'Put a sock on your hand and introduce it as your new best friend.'),
  L('Imita a un reno buscando a Papá Noel por toda la casa.', 'Imita un ren buscant el Pare Noel per tota la casa.', 'Act like a reindeer looking for Santa all over the house.'),
  L('Dile un piropo navideño a la persona que tengas más cerca.', 'Digues un compliment nadalenc a la persona que tinguis més a prop.', 'Pay a Christmas compliment to the nearest person.'),
  L('Baila como un muñeco de nieve que se está derritiendo.', 'Balla com un ninot de neu que s’està fonent.', 'Dance like a melting snowman.'),
  L('Hazte un selfie con la cara más rara posible y mándalo al grupo.', 'Fes-te una selfie amb la cara més estranya possible i envia-la al grup.', 'Take a selfie with your weirdest face and send it to the group.'),
];

// ---- Actividad 1 (árboles) y actividad 2 (gnomos): una por día
const ACT1 = [
  ['Hoy toca decorar: pon un adorno navideño en un sitio donde nadie se lo espere (¡la nevera cuenta!) y haz una foto.', 'Avui toca decorar: posa un adorn nadalenc en un lloc on ningú no s’ho esperi (la nevera compta!) i fes una foto.', 'Time to decorate: put a Christmas ornament somewhere nobody expects (the fridge counts!) and take a photo.'],
  ['Envía un mensaje de voz cantando la primera estrofa de tu villancico favorito.', 'Envia un missatge de veu cantant la primera estrofa de la teva nadala preferida.', 'Send a voice message singing the first verse of your favourite carol.'],
  ['Escribe en un papel tres cosas buenas que te han pasado este año y guárdalo en un calcetín.', 'Escriu en un paper tres coses bones que t’han passat aquest any i guarda’l en un mitjó.', 'Write three good things that happened to you this year and hide the note in a sock.'],
  ['Hazte una foto con un gorro navideño improvisado (vale un colador, una bufanda o un calcetín).', 'Fes-te una foto amb un barret nadalenc improvisat (val un colador, una bufanda o un mitjó).', 'Take a photo wearing an improvised Christmas hat (a colander, scarf or sock will do).'],
  ['Da un abrazo de oso a alguien de tu casa sin explicarle por qué.', 'Fes una abraçada d’os a algú de casa sense explicar-li per què.', 'Give someone at home a bear hug without explaining why.'],
  ['Prepara un chocolate caliente y brinda por el día 6 con quien tengas al lado.', 'Prepara una xocolata calenta i brinda pel dia 6 amb qui tinguis al costat.', 'Make a hot chocolate and toast to day 6 with whoever is next to you.'],
  ['Dibuja un reno con los ojos cerrados y compártelo en el grupo.', 'Dibuixa un ren amb els ulls tancats i comparteix-lo al grup.', 'Draw a reindeer with your eyes closed and share it with the group.'],
  ['Hoy, cada vez que alguien diga «Navidad», tienes que decir «¡Ho, ho, ho!».', 'Avui, cada vegada que algú digui «Nadal», has de dir «Ho, ho, ho!».', 'Today, every time someone says “Christmas”, you must shout “Ho, ho, ho!”.'],
  ['Cuenta un chiste navideño a alguien. Si no se ríe, cuéntale otro.', 'Explica un acudit nadalenc a algú. Si no riu, explica-li’n un altre.', 'Tell someone a Christmas joke. If they don’t laugh, tell another.'],
  ['Haz una lista de 5 películas navideñas y elige una para este fin de semana.', 'Fes una llista de 5 pel·lícules nadalenques i tria’n una per aquest cap de setmana.', 'List 5 Christmas films and pick one for this weekend.'],
  ['Escribe una nota bonita y escóndela en el bolsillo de alguien.', 'Escriu una nota bonica i amaga-la a la butxaca d’algú.', 'Write a kind note and hide it in someone’s pocket.'],
  ['Sal a mirar las luces de Navidad de tu calle y haz la foto más bonita que puedas.', 'Surt a mirar els llums de Nadal del teu carrer i fes la foto més bonica que puguis.', 'Go and look at the Christmas lights in your street and take your best photo.'],
  ['Baila 30 segundos la canción navideña que suene en la radio (o la que tú cantes).', 'Balla 30 segons la cançó nadalenca que soni a la ràdio (o la que cantis tu).', 'Dance for 30 seconds to whatever Christmas song is playing (or one you sing).'],
  ['Envía una felicitación a alguien con quien hace mucho que no hablas.', 'Envia una felicitació a algú amb qui fa molt que no parles.', 'Send greetings to someone you haven’t spoken to for ages.'],
  ['Ponte tu jersey más navideño (o el más feo) y hazte una foto de modelo.', 'Posa’t el jersei més nadalenc (o el més lleig) i fes-te una foto de model.', 'Wear your most Christmassy (or ugliest) jumper and pose like a model.'],
  ['Prepara galletas, turrón o algo dulce y compártelo con alguien.', 'Prepara galetes, torró o alguna cosa dolça i comparteix-ho amb algú.', 'Bake cookies or something sweet and share it with someone.'],
  ['Escribe tu carta a Papá Noel… pidiendo algo para otra persona.', 'Escriu la teva carta al Pare Noel… demanant una cosa per a una altra persona.', 'Write your letter to Santa… asking for something for someone else.'],
  ['Inventa un villancico nuevo de 4 frases sobre alguien de tu familia.', 'Inventa una nadala nova de 4 frases sobre algú de la teva família.', 'Invent a 4-line carol about someone in your family.'],
  ['Haz una figura de papel (estrella, copo o árbol) y cuélgala en una ventana.', 'Fes una figura de paper (estrella, floc o arbre) i penja-la en una finestra.', 'Make a paper star, snowflake or tree and hang it in a window.'],
  ['Hoy di «gracias» a tres personas por algo concreto.', 'Avui digues «gràcies» a tres persones per alguna cosa concreta.', 'Today, say “thank you” to three people for something specific.'],
  ['Haz una foto de grupo con caras de reno (dedos como cuernos, ¡obligatorio!).', 'Fes una foto de grup amb cares de ren (dits com a banyes, obligatori!).', 'Take a group photo pulling reindeer faces (finger antlers compulsory!).'],
  ['Juega a las películas con mímica: solo películas navideñas.', 'Juga a les pel·lícules amb mímica: només pel·lícules nadalenques.', 'Play charades: Christmas films only.'],
  ['Escribe en el grupo cuál es tu recuerdo navideño favorito.', 'Escriu al grup quin és el teu record nadalenc preferit.', 'Share your favourite Christmas memory in the group.'],
  ['Esta noche, antes de dormir, deja una galleta para Papá Noel (y una zanahoria para los renos).', 'Aquesta nit, abans de dormir, deixa una galeta per al Pare Noel (i una pastanaga per als rens).', 'Tonight, leave a cookie for Santa (and a carrot for the reindeer).'],
  ['¡Hoy es Navidad! Da las gracias, abraza fuerte y disfruta muchísimo. ¡Lo has conseguido!', 'Avui és Nadal! Dona les gràcies, abraça fort i gaudeix moltíssim. Ho has aconseguit!', 'It’s Christmas! Say thank you, hug tight and enjoy every minute. You made it!'],
];
const ACT2 = [
  ['Misión gnómica: esconde un objeto pequeño de alguien de tu casa y dale tres pistas para encontrarlo.', 'Missió gnòmica: amaga un objecte petit d’algú de casa i dona-li tres pistes per trobar-lo.', 'Gnome mission: hide something small belonging to someone at home and give them three clues.'],
  ['Los gnomos hablan en susurros: hoy, durante 15 minutos, solo puedes hablar susurrando.', 'Els gnoms parlen xiuxiuejant: avui, durant 15 minuts, només pots parlar xiuxiuejant.', 'Gnomes whisper: for 15 minutes today you may only whisper.'],
  ['Construye una casita para gnomos con lo que encuentres (tazas, libros, cojines…). Foto obligatoria.', 'Construeix una caseta per a gnoms amb el que trobis (tasses, llibres, coixins…). Foto obligatòria.', 'Build a gnome house from whatever you find (mugs, books, cushions…). Photo required.'],
  ['Ponte un gorro puntiagudo y saluda a todo el mundo con una reverencia.', 'Posa’t un barret punxegut i saluda tothom amb una reverència.', 'Wear a pointy hat and greet everyone with a bow.'],
  ['Deja un mensaje secreto de gnomo (sin firma) en algún sitio de la casa.', 'Deixa un missatge secret de gnom (sense signar) en algun lloc de casa.', 'Leave an unsigned secret gnome message somewhere in the house.'],
  ['Haz una barba con algodón, papel o espuma y hazte una foto de gnomo sabio.', 'Fes-te una barba amb cotó, paper o escuma i fes-te una foto de gnom savi.', 'Make a beard out of cotton, paper or foam and take a wise-gnome photo.'],
  ['Ordena un cajón como lo haría un gnomo muy, muy maniático.', 'Endreça un calaix com ho faria un gnom molt, molt maniàtic.', 'Tidy a drawer like an extremely fussy gnome.'],
  ['Inventa un nombre de gnomo para cada persona de tu casa.', 'Inventa un nom de gnom per a cada persona de casa.', 'Invent a gnome name for everyone at home.'],
  ['Camina de puntillas durante 5 minutos: los gnomos nunca hacen ruido.', 'Camina de puntetes durant 5 minuts: els gnoms mai no fan soroll.', 'Tiptoe for 5 minutes: gnomes never make a sound.'],
  ['Prepara un pequeño regalo hecho a mano para alguien (vale un dibujo).', 'Prepara un petit regal fet a mà per a algú (val un dibuix).', 'Make a little handmade present for someone (a drawing counts).'],
  ['Cuenta una historia de 1 minuto sobre un gnomo que perdió su gorro.', 'Explica una història d’1 minut sobre un gnom que va perdre el barret.', 'Tell a 1-minute story about a gnome who lost his hat.'],
  ['Busca en casa algo rojo, algo verde y algo dorado, y haz un bodegón navideño.', 'Busca a casa una cosa vermella, una de verda i una de daurada, i fes un bodegó nadalenc.', 'Find something red, green and gold and arrange a Christmas still life.'],
  ['Los gnomos dan suerte: desea algo bonito en voz alta a tres personas.', 'Els gnoms porten sort: desitja una cosa bonica en veu alta a tres persones.', 'Gnomes bring luck: wish three people something lovely out loud.'],
  ['Hazte una foto escondido como un gnomo (detrás de una planta, una cortina…).', 'Fes-te una foto amagat com un gnom (darrere d’una planta, una cortina…).', 'Take a photo hiding like a gnome (behind a plant, a curtain…).'],
  ['Hoy toca canción gnómica: canta un villancico con la voz más grave que puedas.', 'Avui toca cançó gnòmica: canta una nadala amb la veu més greu que puguis.', 'Gnome song day: sing a carol in your deepest voice.'],
  ['Escribe una poesía de 4 versos sobre tu gorro favorito.', 'Escriu una poesia de 4 versos sobre el teu barret preferit.', 'Write a 4-line poem about your favourite hat.'],
  ['Organiza una búsqueda del tesoro de 3 pistas para alguien de tu casa.', 'Organitza una caça del tresor de 3 pistes per a algú de casa.', 'Set up a 3-clue treasure hunt for someone at home.'],
  ['Prepara una merienda de gnomo: todo en tamaño mini.', 'Prepara un berenar de gnom: tot en mida mini.', 'Make a gnome snack: everything mini-sized.'],
  ['Los gnomos cuidan el bosque: riega una planta o da de comer a los pájaros.', 'Els gnoms cuiden el bosc: rega una planta o dona menjar als ocells.', 'Gnomes care for the forest: water a plant or feed the birds.'],
  ['Haz una reverencia gnómica cada vez que entres en una habitación hoy.', 'Fes una reverència gnòmica cada vegada que entris en una habitació avui.', 'Bow like a gnome every time you enter a room today.'],
  ['Envía al grupo una foto de tu calcetín más divertido.', 'Envia al grup una foto del teu mitjó més divertit.', 'Send the group a photo of your funniest sock.'],
  ['Cuenta un secreto de gnomo (inventado) a alguien muy en serio.', 'Explica un secret de gnom (inventat) a algú molt seriosament.', 'Tell someone a (made-up) gnome secret, very seriously.'],
  ['Envuelve un objeto cualquiera de casa como si fuera un regalo carísimo.', 'Embolica un objecte qualsevol de casa com si fos un regal caríssim.', 'Wrap a random household object as if it were a very expensive present.'],
  ['Nochebuena gnómica: enciende una vela (o una linterna) y cuenta lo mejor de tu año.', 'Nit de Nadal gnòmica: encén una espelma (o una llanterna) i explica el millor del teu any.', 'Gnome Christmas Eve: light a candle (or a torch) and share the best part of your year.'],
  ['¡Feliz Navidad, gnomo! Hoy reparte abrazos y risas. Te lo has ganado.', 'Bon Nadal, gnom! Avui reparteix abraçades i rialles. T’ho has guanyat.', 'Merry Christmas, gnome! Hand out hugs and laughs today. You’ve earned it.'],
];

export function defaultDay(n) {
  const base = { act1: L(...ACT1[n - 1]), act2: L(...ACT2[n - 1]) };
  if (SPECIAL[n]) {
    const d = { ...base, type: SPECIAL[n] };
    if (n === 20) d.missions = MISSIONS;
    if (n === 6) d.scareSeconds = 5;
    return d;
  }
  const [q, options, correct] = Q[n];
  return { ...base, type: 'quiz', q, options, correct };
}

export const DEFAULT_CONFIG = {
  year: new Date().getMonth() >= 1 ? new Date().getFullYear() : new Date().getFullYear() - 1,
  prizes: {
    p10: '🎁 10 aciertos: ¡Una taza de chocolate caliente con nubes!',
    p15: '🎁 15 aciertos: ¡Una tarde de peli navideña con palomitas!',
    p20: '🎁 20 aciertos: ¡Un regalo sorpresa!',
    p25: '🌟 ¡Todas acertadas! Te llevas los 4 premios y un EXTRA mágico.',
  },
};

// Estilos de las notas (papel)
export const PAPERS = [
  { id: 'pergamino', name: 'Pergamino' },
  { id: 'nordico', name: 'Nórdico' },
  { id: 'moderno', name: 'Moderno' },
  { id: 'sofisticado', name: 'Sofisticado (negro y oro)' },
  { id: 'profesional', name: 'Profesional' },
  { id: 'caramelo', name: 'Bastón de caramelo' },
  { id: 'bosque', name: 'Bosque nevado' },
];

// Dibujos de portada: imagen + posición de las 25 casillas (centro x,y y tamaño en %)
export const PORTADAS = [
  {
    id: 'toyshop', name: 'Juguetería (Toy Shop)', img: 'portada-toyshop.jpg', w: 1122, h: 1402, door: { radius: '10%' },
    // [x, y, ancho, alto] en píxeles de la imagen original
    spots: {
      1: [293, 162, 88, 62], 2: [548, 176, 88, 62], 3: [771, 195, 86, 62],
      4: [200, 366, 78, 62], 5: [385, 371, 80, 62], 6: [563, 384, 80, 62], 7: [730, 396, 78, 62], 8: [870, 404, 76, 62],
      9: [195, 556, 82, 62], 10: [383, 559, 82, 62], 11: [562, 549, 82, 62], 12: [723, 570, 82, 62], 13: [868, 581, 82, 62],
      14: [178, 779, 80, 62], 15: [343, 779, 80, 62], 16: [552, 812, 80, 64], 17: [757, 791, 82, 62], 18: [880, 791, 82, 62],
      19: [272, 1040, 80, 58], 20: [376, 1034, 80, 58], 21: [575, 1041, 84, 58], 22: [790, 1034, 84, 58], 23: [900, 1034, 84, 58],
      24: [368, 1266, 102, 78], 25: [727, 1266, 106, 78],
    },
  },
  { id: 'pastel', name: 'Dulce pastel', img: 'portada-pastel.jpg', w: 1200, h: 1500, door: { radius: '22%' },
    spots: {"1":[192,150,168,150],"2":[396,150,168,150],"3":[600,150,168,150],"4":[804,150,168,150],"5":[1008,150,168,150],"6":[192,355,168,150],"7":[396,355,168,150],"8":[600,355,168,150],"9":[804,355,168,150],"10":[1008,355,168,150],"11":[192,560,168,150],"12":[396,560,168,150],"13":[600,560,168,150],"14":[804,560,168,150],"15":[1008,560,168,150],"16":[192,765,168,150],"17":[396,765,168,150],"18":[600,765,168,150],"19":[804,765,168,150],"20":[1008,765,168,150],"21":[218,970,168,150],"22":[473,970,168,150],"23":[728,970,168,150],"24":[983,970,168,150],"25":[600,1250,360,300]} },
  { id: 'nordico', name: 'Blanco nórdico', img: 'portada-nordico.jpg', w: 1200, h: 1500, door: { radius: '50%' },
    spots: {"1":[190,192,150,150],"2":[399,191,150,150],"3":[598,195,150,150],"4":[809,186,150,150],"5":[1014,197,150,150],"6":[212,373,150,150],"7":[464,386,150,150],"8":[733,388,150,150],"9":[986,384,150,150],"10":[183,565,150,150],"11":[388,565,150,150],"12":[592,567,150,150],"13":[803,572,150,150],"14":[1008,568,150,150],"15":[208,754,150,150],"16":[471,754,150,150],"17":[730,761,150,150],"18":[996,764,150,150],"19":[178,941,150,150],"20":[390,956,150,150],"21":[602,949,150,150],"22":[814,953,150,150],"23":[1020,942,150,150],"24":[600,1300,330,330]} },
  { id: 'neon', name: 'Neón navideño', img: 'portada-neon.jpg', w: 1200, h: 1500, door: { radius: '12%' },
    spots: {"1":[240,150,150,145],"2":[420,150,150,145],"3":[600,150,150,145],"4":[780,150,150,145],"5":[960,150,150,145],"6":[240,350,150,145],"7":[420,350,150,145],"8":[600,350,150,145],"9":[780,350,150,145],"10":[960,350,150,145],"11":[240,550,150,145],"12":[420,550,150,145],"13":[600,550,150,145],"14":[780,550,150,145],"15":[960,550,150,145],"16":[240,750,150,145],"17":[420,750,150,145],"18":[600,750,150,145],"19":[780,750,150,145],"20":[960,750,150,145],"21":[263,950,150,145],"22":[488,950,150,145],"23":[713,950,150,145],"24":[938,950,150,145],"25":[600,1255,340,330]} },
  { id: 'aurora', name: 'Aurora polar', img: 'portada-aurora.jpg', w: 1200, h: 1500, door: { radius: '50%' },
    spots: {"1":[184,150,160,160],"2":[392,150,160,160],"3":[600,150,160,160],"4":[808,150,160,160],"5":[1016,150,160,160],"6":[210,322,160,160],"7":[470,322,160,160],"8":[730,322,160,160],"9":[990,322,160,160],"10":[184,494,160,160],"11":[392,494,160,160],"12":[600,494,160,160],"13":[808,494,160,160],"14":[1016,494,160,160],"15":[210,666,160,160],"16":[470,666,160,160],"17":[730,666,160,160],"18":[990,666,160,160],"19":[184,838,160,160],"20":[392,838,160,160],"21":[600,838,160,160],"22":[808,838,160,160],"23":[1016,838,160,160],"24":[600,1290,330,330]} },
  { id: 'taller', name: 'Taller de juguetes', img: 'portada-taller.jpg', w: 1200, h: 1500, door: { radius: '6%' },
    spots: {"1":[184,210,180,150],"2":[392,210,180,150],"3":[600,210,180,150],"4":[808,210,180,150],"5":[1016,210,180,150],"6":[184,425,180,150],"7":[392,425,180,150],"8":[600,425,180,150],"9":[808,425,180,150],"10":[1016,425,180,150],"11":[184,640,180,150],"12":[392,640,180,150],"13":[600,640,180,150],"14":[808,640,180,150],"15":[1016,640,180,150],"16":[184,855,180,150],"17":[392,855,180,150],"18":[600,855,180,150],"19":[808,855,180,150],"20":[1016,855,180,150],"21":[210,1070,180,150],"22":[470,1070,180,150],"23":[730,1070,180,150],"24":[990,1070,180,150],"25":[830,1290,380,300]} },
  { id: 'jengibre', name: 'Casita de jengibre', img: 'portada-jengibre.jpg', w: 1200, h: 1500, door: { radius: '40%' },
    spots: {"1":[600,215,140,140],"2":[420,375,140,140],"3":[780,375,140,140],"4":[192,600,150,140],"5":[396,600,150,140],"6":[600,600,150,140],"7":[804,600,150,140],"8":[1008,600,150,140],"9":[192,770,150,140],"10":[396,770,150,140],"11":[600,770,150,140],"12":[804,770,150,140],"13":[1008,770,150,140],"14":[192,940,150,140],"15":[396,940,150,140],"16":[600,940,150,140],"17":[804,940,150,140],"18":[1008,940,150,140],"19":[110,1150,120,125],"20":[240,1150,120,125],"21":[370,1150,120,125],"22":[830,1150,120,125],"23":[960,1150,120,125],"24":[1090,1150,120,125],"25":[600,1240,240,300]} },
  { id: 'tropical', name: 'Navidad tropical', img: 'portada-tropical.jpg', w: 1200, h: 1500, door: { radius: '50%' },
    spots: {"1":[208,530,150,150],"2":[404,530,150,150],"3":[600,530,150,150],"4":[796,530,150,150],"5":[992,530,150,150],"6":[208,695,150,150],"7":[404,695,150,150],"8":[600,695,150,150],"9":[796,695,150,150],"10":[992,695,150,150],"11":[208,860,150,150],"12":[404,860,150,150],"13":[600,860,150,150],"14":[796,860,150,150],"15":[992,860,150,150],"16":[208,1025,150,150],"17":[404,1025,150,150],"18":[600,1025,150,150],"19":[796,1025,150,150],"20":[992,1025,150,150],"21":[233,1190,150,150],"22":[478,1190,150,150],"23":[723,1190,150,150],"24":[968,1190,150,150],"25":[600,230,330,330]} },
  { id: 'bolas', name: 'Bolas de oro', img: 'portada-bolas.jpg', w: 1200, h: 1500, door: { radius: '50%' },
    spots: {"1":[174,211,150,150],"2":[381,203,150,150],"3":[594,211,150,150],"4":[811,221,150,150],"5":[1022,221,150,150],"6":[176,432,150,150],"7":[379,414,150,150],"8":[601,428,150,150],"9":[823,432,150,150],"10":[1037,418,150,150],"11":[166,634,150,150],"12":[396,634,150,150],"13":[603,628,150,150],"14":[800,623,150,150],"15":[1032,618,150,150],"16":[180,851,150,150],"17":[400,844,150,150],"18":[593,837,150,150],"19":[822,828,150,150],"20":[1015,833,150,150],"21":[209,1052,150,150],"22":[477,1039,150,150],"23":[732,1060,150,150],"24":[986,1045,150,150],"25":[600,1265,360,360]} },
  { id: 'perrito', name: 'Perrito en la nieve', img: 'portada-perrito.jpg', w: 1536, h: 1024, door: { radius: '8%' },
    spots: {1:[158,110,200,140],2:[408,108,200,140],3:[655,105,200,140],4:[918,105,200,140],5:[1163,105,200,140],6:[1407,105,200,140],
      7:[157,280,200,145],8:[412,280,200,145],9:[668,278,200,145],10:[925,275,200,145],11:[1175,275,200,145],12:[1410,272,200,145],
      13:[160,455,200,150],14:[448,455,200,150],15:[825,458,210,150],16:[1112,455,210,150],17:[1395,445,210,150],
      18:[152,665,200,150],19:[408,660,200,150],20:[790,652,210,150],21:[1100,652,210,150],22:[1410,652,200,150],
      23:[195,868,200,150],24:[440,862,200,150],25:[958,870,230,170]} },
  { id: 'puente', name: 'Puente con farolillo', img: 'portada-puente.jpg', w: 1024, h: 1024, door: { radius: '8%' },
    spots: {1:[243,68,125,120],2:[375,68,125,120],3:[546,68,135,120],4:[716,68,135,120],5:[898,68,135,120],
      6:[267,230,125,130],7:[395,230,125,130],8:[558,230,135,130],9:[730,230,135,130],10:[902,230,135,130],
      11:[262,395,125,130],12:[393,395,125,130],13:[558,395,135,130],14:[730,395,135,130],15:[902,395,135,130],
      16:[265,570,125,130],17:[393,570,125,130],18:[558,570,135,130],19:[730,570,135,130],20:[902,570,135,130],
      21:[265,800,125,130],22:[393,800,125,130],23:[558,800,135,130],24:[730,800,135,130],25:[885,880,160,170]} },
];
