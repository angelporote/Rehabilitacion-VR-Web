# Bitácora

Diario del trabajo en la web: qué se hizo, qué se decidió (y por qué) y qué queda pendiente. La entrada más reciente va arriba.

---

## 19/11/2026 · Teclado de principio a fin

**Hecho**
- Portada: al cargar está seleccionado **"Conocer el proyecto"**; `→` selecciona las gafas, que **se encienden** (luz frontal y tira de luz más brillantes); `←` vuelve al botón; `Enter` entra con la cinemática de ponerse las gafas. El botón también usa la cinemática al pulsarlo con el ratón.
- Lobby: al llegar está seleccionada la primera tarjeta; `Esc` hace la cinemática de quitarse las gafas y vuelve a la portada (si hay una ficha abierta, `Esc` primero la cierra).
- Al volver a la portada, "Conocer el proyecto" queda seleccionado otra vez.

**Decidido**
- `↑↓` en las gafas siguen girándolas; `←→` pasan a moverse entre botón y gafas.

---

## 19/11/2026 · Seis huecos, cinemáticas y teclado

**Hecho**
- La pantalla del Lobby tiene **6 tarjetas en filas de 3**, como el Lobby nuevo del proyecto (`GameCatalog`: Cocina, Memoria, Bingo y tres "Próximamente" con candado). Se configura en `datos/vr.json` (`lobby.huecos`).
- **Cinemática de ponerse las gafas**: en vez de entrar por las lentes, las gafas se levantan, se giran, se acercan a la cara y la vista se cierra en las dos lentes. En el Lobby las lentes se abren.
- **Cinemática de quitarse las gafas**: "Quitarse las gafas" cierra las lentes; en la portada se abren, las gafas se apartan de la cara y vuelven a la mesita.
- **Cursor de mano como en Unity**: mano translúcida con los dedos abiertos; sobre lo que se puede tocar, el índice sigue estirado y el resto se cierra. Se tomó como referencia la captura `gafas_lobby`.
- **Teclado en toda la web**: etiqueta de las gafas con `Tab`, flechas y `Enter`; tarjetas del Lobby con `Tab`/flechas y `Enter`; `L` para el modo libre; en el modo libre `←→`/`Q E` para girar y `Enter` para tocar; `Esc` cierra las fichas.

**Decisiones**
- En el modo libre, `↑↓` caminan y `←→` giran: así se puede mirar alrededor sin ratón. `A`/`D` siguen moviendo de lado.

**Pendiente**
- Decidir cómo se muestra la información de cada juego.

---

## 19/11/2026 · El Lobby en 3D y la mano VR

**Hecho**
- Al entrar en las gafas apareces en el **Lobby**, copiado de la habitación del proyecto (paredes crema, suelo de baldosas, mesa de madera y la pantalla "Elige un juego" con Receta de Cocina, Memoria de cartas y Bingo). Se miraron las capturas `navegacion_01_lobby` y `arte_despues_lobby`.
- Botón **"Muévete libremente por la lobby"**: convierte la web en un videojuego en primera persona. WASD o flechas para caminar, ratón para mirar, clic para tocar la pantalla.
- **Colisiones** con las paredes y los muebles (mesa, silla, estantería y planta).
- Tecla y botón **R** para volver a la pantalla.
- **Indicador** en la esquina inferior derecha: modo actual, controles y un plano con tu posición y hacia dónde miras.
- **Cursor de mano VR** en toda la web: mano abierta y dedo índice sobre lo que se puede tocar.
- La página de información en texto pasa a `vr/info.html`, enlazada desde el Lobby.

**Decisiones**
- Las tarjetas de la pantalla salen de `datos/vr.json`: un juego nuevo aparece solo en el Lobby.
- En móviles y tabletas sin ratón no se ofrece el modo libre (necesita teclado).

**Pendiente**
- **Decidir cómo se muestra la información de cada juego** al tocarlo. Por ahora sale una ficha provisional con un enlace a la versión en texto.

---

## 19/11/2026 · Solo las gafas, en un salón de casa

**Hecho**
- Quitado todo lo de implantes: la prótesis de cadera, su modelo (`protesis.js`) y los enlaces y textos sobre Dentro del implante. Son webs distintas.
- El fondo espacial pasa a ser un **salón de casa al atardecer**, hecho con código (`js/portada/sala.js`): tarima, paredes crema, ventana con cortinas, sofá, lámpara de pie, planta, cuadros y alfombra. Las gafas flotan sobre una mesita.
- Paleta de colores cálida en toda la web (madera y crema), con el turquesa de las gafas como acento.
- Textos de la portada centrados en RehabilitaciónVR (provisionales).
- GitHub Pages activado.

**Decisiones**
- Fondo de casa porque transmite algo más **hogareño** que el espacio, que es la idea del proyecto.
- El sistema de "escaparate" se mantiene: si más adelante hay más objetos, se añaden con un modelo y una entrada en `datos/escaparate.json`.

**Pendiente**
- Decidir los textos definitivos de la portada y de la página VR.

---

## 19/11/2026 · Primera versión

**Hecho**
- Repositorio `Rehabilitacion-VR-Web` creado (público).
- Portada en 3D con unas **gafas de realidad virtual** modeladas por código, que se giran arrastrando y flotan. Al tocarlas, la cámara entra por las lentes y se abre la página del proyecto (`vr/`).
- Página `vr/` con la información de RehabilitaciónVR: cómo se juega, los tres juegos (Receta de Cocina, Memoria de cartas, Bingo) con sus capturas, el informe para el terapeuta, la tecnología y el estado.
- Documentación: `README.md`, `docs/ESTRUCTURA.md`, `docs/AÑADIR_UN_PROYECTO.md` y esta bitácora.

**Decisiones**
- **Tecnología sencilla:** Three.js 0.170 y GSAP 3.12 por CDN, sin compilar, publicada con GitHub Pages.
- **Pensada para crecer:** los objetos de la portada salen de `datos/escaparate.json` y cada modelo es un archivo. Añadir un proyecto es crear su modelo y una entrada en el JSON, sin tocar la escena.
- **Textos en JSON** (`datos/vr.json`), separados del código.
- **Licencias:** MIT para el código y CC BY-NC-SA 4.0 para el contenido.
- Las capturas de `img/vr/` son las de la carpeta del proyecto VR (`vr/arte/antes/`).

**Pendiente**
- Revisar los textos de la página VR.
- Cambiar las capturas por las del arte nuevo cuando esté terminado.
- Añadir un vídeo corto de una partida a la página VR.
