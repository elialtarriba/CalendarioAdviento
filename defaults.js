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

const SPECIAL = { 1: 'hats', 3: 'sudoku', 4: 'reindeer', 6: 'differences', 7: 'puzzle', 8: 'tree', 9: 'simon', 12: 'memory', 13: 'goodcheck', 14: 'catch', 15: 'ballsort', 16: 'diploma', 17: 'ttt', 18: 'puzzle', 21: 'slidepuzzle', 22: 'wordsearch', 23: 'crossword', 20: 'roulette', 24: 'dance', 25: 'pairs' };

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

export const MISSED_DEFAULT = '¿Cómo que no has participado en el día {dia}? ¡No te despistes, o Papá Noel no te va a traer regalos!';
export const SPLASH_DEFAULT = {
  show: true, seconds: 5,
  text: { es: 'Bienvenidos a la aplicación de la Navidad', ca: "Benvinguts a l'aplicació del Nadal", en: 'Welcome to the Christmas app' },
};
export const MARQUEE_DEFAULT = {
  show: true, speed: 14, weight: 700, colorName: 'rojo', color: '#b3122e',
  text: { es: '', ca: '', en: '' }, // vacío = «¡Feliz Navidad (año) y próspero Año Nuevo!»
};
export const MARQUEE_COLORS = [
  ['rojo', 'Rojo Navidad', '#b3122e'], ['neon-amarillo', 'Neón amarillo', '#f5e400'], ['neon-rosa', 'Neón rosa', '#ff2fd6'], ['neon-verde', 'Neón verde', '#28ff6a'], ['neon-azul', 'Neón azul', '#1fe4ff'],
  ['rosa-pastel', 'Rosa pastel', '#f4a6c6'], ['menta-pastel', 'Menta pastel', '#8fd9b6'], ['azul-pastel', 'Azul pastel', '#9cc7f0'], ['lila-pastel', 'Lila pastel', '#c3a6ec'], ['melocoton', 'Melocotón pastel', '#f7b98c'],
  ['dorado', 'Dorado', '#c99a2e'], ['verde', 'Verde abeto', '#1f6b45'], ['negro', 'Negro', '#1b1b1b'], ['marron', 'Marrón chocolate', '#5a3218'], ['marron-claro', 'Marrón canela', '#9a6334'],
];
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

// Temas del calendario. Cada tema tiene varias versiones (móvil, cuadrada, ancha):
// la app elige la que mejor encaja en la pantalla. spots = [centro x, centro y, ancho, alto] en píxeles de la imagen.
export const PORTADAS = [
  { id: 'regalos', name: 'Cosas Navidad', radius: '14%', light: 'claro', variants: [
    { img: 'tema-regalos-cuadrado.jpg', w: 1254, h: 1254, bg: '#beac99', spots: {"1":[249,173,184,176],"2":[440,173,177,176],"3":[631,173,179,176],"4":[824,173,179,176],"5":[1017,173,179,176],"6":[249,356,184,161],"7":[440,356,177,161],"8":[631,356,179,161],"9":[824,356,179,161],"10":[1017,356,179,161],"11":[249,525,184,150],"12":[440,525,177,150],"13":[631,525,179,150],"14":[824,525,179,150],"15":[1017,525,179,150],"16":[249,687,184,148],"17":[440,687,177,148],"18":[631,687,179,148],"19":[824,687,179,148],"20":[1017,687,179,148],"21":[303,859,209,167],"22":[520,859,197,167],"23":[732,859,202,167],"24":[953,859,208,167],"25":[627,1088,272,188]} },
    { img: 'tema-regalos-movil.jpg', w: 941, h: 1672, bg: '#e0c5aa', spots: {"1":[116,302,179,221],"2":[299,302,172,221],"3":[475,302,167,221],"4":[647,302,167,221],"5":[826,302,176,221],"6":[116,525,179,203],"7":[299,525,172,203],"8":[475,525,167,203],"9":[647,525,167,203],"10":[826,525,176,203],"11":[116,742,179,199],"12":[299,742,172,199],"13":[475,742,167,199],"14":[647,742,167,199],"15":[826,742,176,199],"16":[116,957,179,207],"17":[299,957,172,207],"18":[475,957,167,207],"19":[647,957,167,207],"20":[826,957,176,207],"21":[146,1179,209,209],"22":[361,1179,209,209],"23":[577,1179,211,209],"24":[792,1179,211,209],"25":[466,1484,322,233]} },
    { img: 'tema-regalos-ancho.jpg', w: 1619, h: 971, bg: '#ddc1a9', spots: {"1":[475,91,187,154],"2":[673,91,173,154],"3":[866,91,177,154],"4":[1059,91,176,154],"5":[1257,91,183,154],"6":[475,245,187,131],"7":[673,245,173,131],"8":[866,245,177,131],"9":[1059,245,176,131],"10":[1257,245,183,131],"11":[475,382,187,120],"12":[673,382,173,120],"13":[866,382,177,120],"14":[1059,382,176,120],"15":[1257,382,183,120],"16":[475,513,187,119],"17":[673,513,173,119],"18":[866,513,177,119],"19":[1059,513,176,119],"20":[1257,513,183,119],"21":[504,649,210,124],"22":[733,649,205,124],"23":[956,649,205,124],"24":[1193,649,223,124],"25":[824,844,295,173]} },
  ] },
  { id: 'galletas', name: 'Galletas de jengibre', radius: '6%', light: 'claro', variants: [
    { img: 'tema-galletas-cuadrado.jpg', w: 1086, h: 1448, bg: '#d0e8eb', spots: {"1":[137.4,292.5,194.8,211.0],"2":[340.2,292.5,194.8,211.0],"3":[543.0,292.5,194.8,211.0],"4":[745.8,292.5,194.8,211.0],"5":[948.6,292.5,194.8,211.0],"6":[137.4,511.5,194.8,211.0],"7":[340.2,511.5,194.8,211.0],"8":[543.0,511.5,194.8,211.0],"9":[745.8,511.5,194.8,211.0],"10":[948.6,511.5,194.8,211.0],"11":[137.4,730.5,194.8,211.0],"12":[340.2,730.5,194.8,211.0],"13":[543.0,730.5,194.8,211.0],"14":[745.8,730.5,194.8,211.0],"15":[948.6,730.5,194.8,211.0],"16":[137.4,949.5,194.8,211.0],"17":[340.2,949.5,194.8,211.0],"18":[543.0,949.5,194.8,211.0],"19":[745.8,949.5,194.8,211.0],"20":[948.6,949.5,194.8,211.0],"21":[137.4,1168.5,194.8,211.0],"22":[340.2,1168.5,194.8,211.0],"23":[543.0,1168.5,194.8,211.0],"24":[745.8,1168.5,194.8,211.0],"25":[948.6,1168.5,194.8,211.0]} },
    { img: 'tema-galletas-movil.jpg', w: 941, h: 1672, bg: '#d1e6e9', spots: {"1":[111.6,404.7,171.2,231.4],"2":[290.8,404.7,171.2,231.4],"3":[470.0,404.7,171.2,231.4],"4":[649.2,404.7,171.2,231.4],"5":[828.4,404.7,171.2,231.4],"6":[111.6,644.1,171.2,231.4],"7":[290.8,644.1,171.2,231.4],"8":[470.0,644.1,171.2,231.4],"9":[649.2,644.1,171.2,231.4],"10":[828.4,644.1,171.2,231.4],"11":[111.6,883.5,171.2,231.4],"12":[290.8,883.5,171.2,231.4],"13":[470.0,883.5,171.2,231.4],"14":[649.2,883.5,171.2,231.4],"15":[828.4,883.5,171.2,231.4],"16":[111.6,1122.9,171.2,231.4],"17":[290.8,1122.9,171.2,231.4],"18":[470.0,1122.9,171.2,231.4],"19":[649.2,1122.9,171.2,231.4],"20":[828.4,1122.9,171.2,231.4],"21":[111.6,1362.3,171.2,231.4],"22":[290.8,1362.3,171.2,231.4],"23":[470.0,1362.3,171.2,231.4],"24":[649.2,1362.3,171.2,231.4],"25":[828.4,1362.3,171.2,231.4]} },
    { img: 'tema-galletas-ancho.jpg', w: 1672, h: 941, bg: '#c9e1e6', spots: {"1":[409.5,107.3,205.0,162.6],"2":[622.5,107.3,205.0,162.6],"3":[835.5,107.3,205.0,162.6],"4":[1048.5,107.3,205.0,162.6],"5":[1261.5,107.3,205.0,162.6],"6":[409.5,277.9,205.0,162.6],"7":[622.5,277.9,205.0,162.6],"8":[835.5,277.9,205.0,162.6],"9":[1048.5,277.9,205.0,162.6],"10":[1261.5,277.9,205.0,162.6],"11":[409.5,448.5,205.0,162.6],"12":[622.5,448.5,205.0,162.6],"13":[835.5,448.5,205.0,162.6],"14":[1048.5,448.5,205.0,162.6],"15":[1261.5,448.5,205.0,162.6],"16":[409.5,619.1,205.0,162.6],"17":[622.5,619.1,205.0,162.6],"18":[835.5,619.1,205.0,162.6],"19":[1048.5,619.1,205.0,162.6],"20":[1261.5,619.1,205.0,162.6],"21":[409.5,789.7,205.0,162.6],"22":[622.5,789.7,205.0,162.6],"23":[835.5,789.7,205.0,162.6],"24":[1048.5,789.7,205.0,162.6],"25":[1261.5,789.7,205.0,162.6]} },
  ] },
  { id: 'toyshop', name: 'Mansión', radius: '16%', variants: [
    { img: 'tema-toyshop-cuadrado.jpg', w: 1254, h: 1254, bg: '#313166', spots: {"1":[450,237,103,90],"2":[629,235,103,94],"3":[808,240,103,85],"4":[349,405,99,103],"5":[481,405,103,103],"6":[616,405,103,103],"7":[750,405,103,103],"8":[878,405,99,103],"9":[349,553,99,94],"10":[481,553,103,94],"11":[616,553,103,94],"12":[750,553,103,94],"13":[878,553,99,94],"14":[331,728,107,94],"15":[470,728,107,94],"16":[611,728,112,94],"17":[752,728,107,94],"18":[885,728,103,94],"19":[334,873,103,99],"20":[470,873,107,99],"21":[611,873,112,99],"22":[752,873,107,99],"23":[885,873,103,99],"24":[428,1093,237,197],"25":[741,1082,309,228]} },
    { img: 'tema-toyshop-movil.jpg', w: 941, h: 1672, bg: '#544161', spots: {"1":[308,358,113,107],"2":[469,358,113,107],"3":[630,364,113,107],"4":[197,558,107,125],"5":[331,558,107,125],"6":[466,558,107,125],"7":[601,558,107,125],"8":[729,558,107,125],"9":[187,737,116,125],"10":[325,737,113,125],"11":[463,737,113,125],"12":[600,737,113,125],"13":[732,737,113,125],"14":[179,967,131,131],"15":[316,967,131,131],"16":[454,967,131,131],"17":[588,967,125,131],"18":[718,967,128,131],"19":[179,1152,131,131],"20":[316,1152,131,131],"21":[454,1152,131,131],"22":[585,1152,131,131],"23":[717,1152,131,131],"24":[316,1457,227,215],"25":[601,1442,314,257]} },
    { img: 'tema-toyshop-ancho.jpg', w: 1619, h: 971, bg: '#2f3764', spots: {"1":[685,156,98,93],"2":[844,153,93,98],"3":[1009,162,98,93],"4":[610,290,98,90],"5":[726,290,98,90],"6":[844,290,93,90],"7":[963,290,98,90],"8":[1078,290,98,90],"9":[610,399,98,93],"10":[726,399,98,93],"11":[844,399,93,93],"12":[963,399,98,93],"13":[1078,399,98,93],"14":[604,552,98,87],"15":[726,552,98,87],"16":[847,552,98,87],"17":[969,552,98,87],"18":[1087,552,104,87],"19":[603,665,101,81],"20":[720,665,98,81],"21":[847,665,98,81],"22":[969,665,98,81],"23":[1087,665,104,81],"24":[619,850,208,150],"25":[963,830,283,191]} },
  ] },
  { id: 'papanoel-bn', name: 'Papá Noel BN', radius: '4%', light: 'claro', variants: [
    { img: 'tema-papanoel-bn-movil.jpg', w: 852, h: 1846, bg: '#ffffff', spots: {"1":[204,249,219,170],"2":[428,249,208,170],"3":[652,249,216,170],"4":[206,426,223,159],"5":[436,426,213,159],"6":[658,426,206,159],"7":[204,590,219,151],"8":[433,590,214,151],"9":[656,590,209,151],"10":[208,755,226,158],"11":[436,755,201,158],"12":[656,755,212,158],"13":[205,914,220,141],"14":[432,914,210,141],"15":[656,914,212,141],"16":[202,1059,213,132],"17":[424,1059,207,132],"18":[650,1059,223,132],"19":[202,1203,213,136],"20":[430,1203,220,136],"21":[657,1203,210,136],"22":[200,1354,209,147],"23":[426,1354,219,147],"24":[654,1354,215,147],"25":[428,1576,667,273]} },
    { img: 'tema-papanoel-bn-cuadrado.jpg', w: 1086, h: 1448, bg: '#ffffff', spots: {"1":[228,242,197,168],"2":[432,242,191,168],"3":[634,242,191,168],"4":[848,242,219,168],"5":[212,420,163,165],"6":[380,420,154,165],"7":[545,420,156,165],"8":[716,420,165,165],"9":[882,420,151,165],"10":[218,594,174,157],"11":[391,594,154,157],"12":[557,594,160,157],"13":[724,594,154,157],"14":[884,594,147,157],"15":[210,755,159,144],"16":[378,755,157,144],"17":[546,755,157,144],"18":[714,755,161,144],"19":[882,755,155,144],"20":[213,914,164,152],"21":[382,914,155,152],"22":[550,914,160,152],"23":[718,914,157,152],"24":[882,914,153,152],"25":[550,1147,814,286]} },
    { img: 'tema-papanoel-bn-ancho.jpg', w: 1585, h: 992, bg: '#ffffff', spots: {"1":[278,177,268,152],"2":[554,177,259,152],"3":[821,177,248,152],"4":[1080,177,244,152],"5":[1328,177,225,152],"6":[277,332,264,132],"7":[544,332,243,132],"8":[801,332,242,132],"9":[1059,332,246,132],"10":[1318,332,245,132],"11":[278,473,266,126],"12":[546,473,242,126],"13":[803,473,244,126],"14":[1062,473,247,126],"15":[1321,473,242,126],"16":[272,613,253,130],"17":[538,613,251,130],"18":[801,613,248,130],"19":[1060,613,244,130],"20":[1318,613,245,130],"21":[250,794,208,204],"22":[462,794,188,204],"23":[666,794,193,204],"24":[876,794,199,204],"25":[1216,794,449,204]} },
  ] },
  { id: 'papanoel-color', name: 'Papá Noel Color', radius: '4%', light: 'claro', variants: [
    { img: 'tema-papanoel-color-movil.jpg', w: 852, h: 1846, bg: '#ffffff', spots: {"1":[203,266,224,163],"2":[426,266,214,163],"3":[649,266,224,163],"4":[210,429,192,142],"5":[441,429,164,142],"6":[653,429,196,142],"7":[210,602,193,157],"8":[448,602,153,157],"9":[638,602,163,157],"10":[204,778,205,149],"11":[431,778,186,149],"12":[653,778,196,149],"13":[208,940,196,130],"14":[422,940,170,130],"15":[653,940,196,130],"16":[208,1087,196,120],"17":[431,1087,186,120],"18":[654,1087,195,120],"19":[228,1236,157,137],"20":[426,1236,195,137],"21":[654,1236,195,137],"22":[208,1395,196,140],"23":[431,1395,186,140],"24":[675,1395,152,140],"25":[412,1594,614,204]} },
    { img: 'tema-papanoel-color-cuadrado.jpg', w: 1086, h: 1448, bg: '#ffffff', spots: {"1":[222,231,222,180],"2":[446,231,207,180],"3":[662,231,209,180],"4":[876,231,203,180],"5":[196,413,172,166],"6":[376,413,170,166],"7":[552,413,161,166],"8":[720,413,160,166],"9":[893,413,168,166],"10":[198,590,174,166],"11":[374,590,163,166],"12":[547,590,166,166],"13":[718,590,160,166],"14":[892,590,171,166],"15":[198,766,175,163],"16":[375,766,162,163],"17":[546,766,165,163],"18":[716,766,160,163],"19":[892,766,171,163],"20":[198,942,174,167],"21":[375,942,166,167],"22":[548,942,165,167],"23":[719,942,160,167],"24":[892,942,171,167],"25":[544,1170,837,260]} },
    { img: 'tema-papanoel-color-ancho.jpg', w: 1586, h: 992, bg: '#ffffff', spots: {"1":[296,193,252,152],"2":[550,193,243,152],"3":[800,193,245,152],"4":[1048,193,239,152],"5":[1295,193,242,152],"6":[296,352,251,151],"7":[550,352,243,151],"8":[798,352,245,151],"9":[1047,352,240,151],"10":[1294,352,244,151],"11":[296,502,252,135],"12":[549,502,242,135],"13":[798,502,245,135],"14":[1048,502,239,135],"15":[1295,502,242,135],"16":[296,642,251,130],"17":[549,642,242,130],"18":[798,642,245,130],"19":[1048,642,240,130],"20":[1295,642,242,130],"21":[282,804,224,177],"22":[491,804,184,177],"23":[680,804,182,177],"24":[865,804,178,177],"25":[1188,804,456,177]} },
  ] },
  { id: 'somosnavidad', name: 'Somos Navidad', radius: '4%', light: 'claro', variants: [
    { img: 'tema-somosnavidad-movil.jpg', w: 830, h: 1896, bg: '#ffffff', spots: {"1":[166,195,221,210],"2":[413,195,212,210],"3":[660,195,221,210],"4":[174,410,240,203],"5":[420,410,232,203],"6":[668,410,241,203],"7":[168,617,249,194],"8":[416,617,239,194],"9":[667,617,242,194],"10":[172,805,256,164],"11":[420,805,232,164],"12":[667,805,242,164],"13":[174,976,241,161],"14":[420,976,231,161],"15":[667,976,242,161],"16":[173,1142,240,161],"17":[420,1142,231,161],"18":[668,1142,241,161],"19":[168,1312,249,161],"20":[418,1312,232,161],"21":[666,1312,243,161],"22":[168,1489,248,172],"23":[418,1489,232,172],"24":[666,1489,244,172],"25":[416,1710,744,247]} },
    { img: 'tema-somosnavidad-cuadrado.jpg', w: 1086, h: 1448, bg: '#ffffff', spots: {"1":[174,168,207,214],"2":[418,168,206,214],"3":[666,168,206,214],"4":[914,168,205,214],"5":[154,384,195,196],"6":[356,384,187,196],"7":[548,384,183,196],"8":[743,384,184,196],"9":[938,384,186,196],"10":[154,584,165,182],"11":[350,584,176,182],"12":[549,584,182,182],"13":[748,584,175,182],"14":[932,584,172,182],"15":[154,772,173,173],"16":[350,772,177,173],"17":[557,772,168,173],"18":[743,772,184,173],"19":[939,772,186,173],"20":[154,960,194,182],"21":[359,960,194,182],"22":[556,960,179,182],"23":[746,960,179,182],"24":[940,960,185,182],"25":[528,1232,881,307]} },
    { img: 'tema-somosnavidad-ancho.jpg', w: 1586, h: 992, bg: '#ffffff', spots: {"1":[254,162,248,163],"2":[533,162,166,163],"3":[809,162,168,163],"4":[1080,162,253,163],"5":[1357,162,152,163],"6":[252,334,252,149],"7":[529,334,258,149],"8":[806,334,254,149],"9":[1105,334,202,149],"10":[1364,334,237,149],"11":[242,494,271,141],"12":[529,494,258,141],"13":[806,494,254,141],"14":[1080,494,254,141],"15":[1354,494,255,141],"16":[243,652,270,142],"17":[529,652,258,142],"18":[806,652,254,142],"19":[1080,652,254,142],"20":[1354,652,255,142],"21":[252,830,255,180],"22":[527,830,256,180],"23":[784,830,222,180],"24":[1056,830,163,180],"25":[1326,830,312,180]} },
  ] },
  { id: 'navidadfoto', name: 'Navidad foto', radius: '6%', light: 'claro', variants: [
    { img: 'tema-navidadfoto-movil.jpg', w: 1039, h: 1513, bg: '#ffffff', spots: {"1":[207,214,200,178],"2":[417,214,188,178],"3":[624,214,193,178],"4":[834,214,195,178],"5":[206,404,198,169],"6":[416,404,190,169],"7":[622,404,193,169],"8":[834,404,195,169],"9":[206,586,198,169],"10":[416,586,191,167],"11":[622,586,193,167],"12":[834,586,194,169],"13":[206,766,198,162],"14":[418,766,188,162],"15":[624,766,191,162],"16":[834,766,194,162],"17":[206,940,197,163],"18":[416,941,191,162],"19":[624,942,191,160],"20":[834,942,197,160],"21":[206,1122,198,169],"22":[418,1123,195,172],"23":[623,1122,194,173],"24":[835,1122,194,171],"25":[520,1314,823,179]} },
    { img: 'tema-navidadfoto-cuadrado.jpg', w: 1086, h: 1448, bg: '#ffffff', spots: {"1":[236,200,191,166],"2":[442,200,187,166],"3":[646,200,189,166],"4":[852,200,193,166],"5":[236,374,191,151],"6":[442,374,187,151],"7":[646,374,189,151],"8":[854,374,190,151],"9":[234,542,193,151],"10":[442,542,187,151],"11":[646,542,189,151],"12":[854,542,190,151],"13":[234,704,193,147],"14":[442,705,187,150],"15":[646,704,189,147],"16":[854,704,190,147],"17":[236,864,190,142],"18":[442,864,187,142],"19":[647,864,194,142],"20":[854,864,190,142],"21":[238,1028,193,154],"22":[442,1028,187,154],"23":[647,1028,188,154],"24":[854,1028,190,154],"25":[543,1216,778,181]} },
    { img: 'tema-navidadfoto-ancho.jpg', w: 1586, h: 992, bg: '#ffffff', spots: {"1":[311,198,176,152],"2":[508,198,173,152],"3":[704,198,173,152],"4":[902,198,177,152],"5":[1098,198,175,152],"6":[1296,198,176,152],"7":[312,358,176,134],"8":[508,358,173,134],"9":[704,358,173,134],"10":[900,358,177,134],"11":[1100,358,177,134],"12":[1296,358,173,134],"13":[312,504,177,125],"14":[509,505,172,124],"15":[704,505,173,124],"16":[902,505,177,124],"17":[1098,505,175,124],"18":[1296,505,172,124],"19":[314,650,179,133],"20":[510,650,172,132],"21":[705,650,172,132],"22":[902,650,175,132],"23":[1098,650,175,132],"24":[1296,650,172,132],"25":[790,806,445,150]} },
  ] },
  { id: 'numeros', name: 'Números', radius: '5%', light: 'claro', variants: [
    { img: 'tema-numeros-movil.jpg', w: 852, h: 1846, bg: '#ffffff', spots: {"1":[116,482,201,212],"2":[324,482,197,212],"3":[530,482,197,213],"4":[738,482,202,212],"5":[117,704,202,212],"6":[324,704,197,212],"7":[530,704,197,212],"8":[738,704,202,212],"9":[117,922,202,205],"10":[324,922,197,205],"11":[530,922,197,205],"12":[738,922,201,205],"13":[116,1130,201,195],"14":[324,1130,197,196],"15":[530,1130,197,195],"16":[738,1130,201,195],"17":[117,1333,202,190],"18":[324,1333,197,190],"19":[530,1334,197,191],"20":[738,1333,201,190],"21":[117,1532,202,189],"22":[325,1532,198,189],"23":[530,1532,197,189],"24":[738,1532,201,189],"25":[424,1736,295,198]} },
    { img: 'tema-numeros-cuadrado.jpg', w: 1086, h: 1448, bg: '#ffffff', spots: {"1":[177,382,244,165],"2":[422,382,235,165],"3":[664,382,234,165],"4":[908,381,240,164],"5":[178,551,243,162],"6":[423,551,234,162],"7":[664,551,234,162],"8":[908,551,240,162],"9":[178,714,245,150],"10":[424,714,235,151],"11":[664,714,234,152],"12":[908,714,240,151],"13":[178,868,245,145],"14":[424,868,235,145],"15":[664,868,235,145],"16":[908,868,241,145],"17":[178,1020,244,145],"18":[424,1020,235,145],"19":[664,1020,233,145],"20":[908,1020,241,145],"21":[177,1176,244,153],"22":[424,1176,236,155],"23":[665,1175,234,154],"24":[909,1175,242,154],"25":[541,1348,240,181]} },
    { img: 'tema-numeros-ancho.jpg', w: 1586, h: 992, bg: '#ffffff', spots: {"1":[420,164,211,234],"2":[634,164,204,234],"3":[846,164,204,234],"4":[1058,164,205,234],"5":[1268,164,200,234],"6":[1478,164,203,234],"7":[419,402,212,224],"8":[634,402,204,224],"9":[846,402,204,223],"10":[1058,402,205,224],"11":[1268,403,201,224],"12":[1480,402,205,223],"13":[420,626,211,207],"14":[634,627,205,208],"15":[846,627,205,208],"16":[1059,626,204,207],"17":[1268,626,201,207],"18":[1480,627,205,208],"19":[420,845,211,212],"20":[635,845,204,210],"21":[847,845,204,210],"22":[1058,845,205,212],"23":[1269,844,202,211],"24":[1480,844,204,211],"25":[162,782,249,266]} },
  ] },
];
export const DEFAULT_PORTADA = 'regalos';
