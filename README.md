# 🎄 Calendario de Adviento

App web (HTML + CSS + JavaScript, sin instalar nada) para GitHub Pages, con Firebase para los usuarios y las respuestas.

## Qué archivos subir a GitHub
Todos los archivos de la carpeta, **sin subcarpetas** (todos juntos en la raíz del repositorio):
`index.html`, `styles.css`, todos los `.js`, las imágenes (`galleta.png`, `arbol.png`, `gnomo.png` y todas las `tema-*.jpg`), el sonido `hohoho.mp3`, `firestore.rules` y `README.md`.

## Paso 1 · GitHub
1. Crea el repositorio (por ejemplo `calendario-adviento`), público.
2. «Add file → Upload files» y arrastra todo el contenido de la carpeta.
3. Settings → Pages → Source: «Deploy from a branch» → rama `main`, carpeta `/ (root)` → Save.
4. En un par de minutos tendrás la dirección: `https://TU-USUARIO.github.io/calendario-adviento/`

Sin Firebase ya funciona en **modo demo** (todo se guarda solo en ese navegador), perfecto para probar.

## Paso 2 · Firebase (gratis, plan Spark)
1. Entra en https://console.firebase.google.com → «Crear proyecto» (puedes desactivar Analytics).
2. **Authentication** → Comenzar → «Correo electrónico/contraseña» → Habilitar → Guardar.
   - En Authentication → Configuración → Dominios autorizados → añade `TU-USUARIO.github.io`.
3. **Firestore Database** → Crear base de datos → ubicación `europe-west` → modo producción.
   - Pestaña **Reglas**: borra lo que hay, pega TODO el archivo `firestore.rules` y pulsa Publicar.
4. ⚙️ Configuración del proyecto → «Tus apps» → icono `</>` (web) → ponle nombre → Registrar.
   Copia los valores de `firebaseConfig` en **`firebase-config.js`** y vuelve a subir ese archivo a GitHub.

## Paso 3 · Primera vez
1. Abre la web, crea tu cuenta.
2. Pulsa el candado 🔒 → como es la primera vez, eliges la **contraseña de configuración**
   (hazlo tú la primera, antes de pasar el enlace a nadie).
3. En «Premios y ajustes» revisa el año y escribe los premios. Activa «Modo prueba» para abrir todas las casillas y probar.
4. Pasa el enlace. Cuando alguien se registre, en «Usuarios → Configurar» le eliges galleta, árbol o gnomo.

## Cómo funciona
- **Galleta**: abre la puerta y hace el reto del día.
- **Árbol**: además, al finalizar, el papel se arruga y aparece la **actividad 1**.
- **Gnomo**: igual, con la **actividad 2**.
- ✓ = figura en color · ✗ = blanco y negro · ⏳ = pendiente (por ejemplo el día 12, que corriges tú).
- Actividades 1 y 2: son las mismas para todos y se editan en un solo sitio (Contenido de los días o desde cada usuario: es el mismo texto). Admiten fotos y vídeos.
- Cada usuario puede tener su propio mensaje en la cinta que se mueve (si está vacío, sale el general).
- Premios en los días 10, 15, 20 y 25: se ganan si como mucho has fallado o dejado sin hacer 3 días hasta esa fecha.
- **Mensajes sorpresa** (botón rojo en Configuración): eliges persona, una o varias fechas y lo marcas «Activado» (o no), y al entrar ese día le sale un popup con título (colores por letra, grosor, tamaño, giro y posición libres), texto, hasta 2 fotos y/o un vídeo. Necesita las reglas nuevas de Firestore.
- **Guía de la app** (botón verde 📖 en Configuración): explicación de todo con dibujos, índice, zoom con dos dedos.
- Días especiales: 1 gorros de Papá Noel (mensaje anónimo, chiste y detector de personas buenas), 4 renos, 6 diferencias + susto, 8 árbol, 12 ojo de lince, 13 ¿has sido bueno?, 15 diploma, 20 ruleta, 24 baile, 25 tu cara en Papá Noel.

## Añadir más temas
Cada tema tiene 3 versiones de la imagen: `-movil` (vertical), `-cuadrado` (iPad) y `-ancho` (ordenador). La app elige sola la que mejor llena la pantalla.
Pon las imágenes junto a los demás archivos y añade el tema en `PORTADAS` de `defaults.js`, con la posición de las 25 casillas de cada versión.
