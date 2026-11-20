# Estructura de la web

La web son páginas estáticas: HTML, CSS y JavaScript en módulos, sin compilar. Las librerías (Three.js y GSAP) llegan por CDN.

## Reglas de organización

1. **Contenido separado del código.** Los textos y enlaces viven en `datos/*.json`. Para cambiar un texto no hace falta tocar JavaScript.
2. **Un modelo 3D por archivo.** Cada modelo está en `js/modelos/<nombre>.js` y exporta `crear()`. Ningún modelo conoce a los demás ni a la escena.
3. **Lo común va en `js/nucleo/`.** Las páginas y los modelos lo usan; el núcleo no conoce ninguna página.
4. **Una carpeta por página.** La portada es `index.html` + `js/portada/` + `css/portada.css`. Cada página de información tiene su carpeta (`vr/`) y su JSON.
5. **Nada de tamaños fijos por modelo en la escena.** El escaparate centra y escala cada modelo solo, y los reparte según cuántos haya.

## Dependencias entre módulos

```
js/portada/main.js ──> js/portada/escena.js ──> js/portada/sala.js ──> js/nucleo/util.js
                   ──> js/portada/escaparate.js ──> js/modelos/index.js ──> js/modelos/*.js ──> js/nucleo/util.js
                   ──> js/nucleo/motor.js
                   ──> js/nucleo/datos.js
js/lobby/main.js ──> js/lobby/sala.js, js/lobby/pantalla.js ──> js/nucleo/util.js
                 ──> js/nucleo/jugador.js, js/nucleo/plano.js, js/nucleo/motor.js, js/nucleo/datos.js
js/juego/main.js ──> js/juegos/index.js ──> js/juegos/<id>/escena.js ──> js/nucleo/util.js
                 ──> js/juego/panel.js ──> js/juego/vistas.js
                 ──> js/nucleo/jugador.js, js/nucleo/plano.js, js/nucleo/motor.js, js/nucleo/datos.js
js/vr/main.js ─────> js/nucleo/datos.js        (versión en texto, sin 3D: no carga Three.js)
```

## Qué hace cada archivo

### Núcleo (`js/nucleo/`)

| Archivo | Qué hace |
|---|---|
| `motor.js` | Crea el renderizador WebGL, el entorno de luz (reflejos) y el bloom. Baja la calidad sola si el equipo va lento. |
| `util.js` | Ayudas para modelar (`rrect`, `shell`, `mesh`, `canvasTex`, `basicGlow`), y detección de móvil, gama baja y "reducir movimiento". Usa Three.js. |
| `datos.js` | `cargarJSON` y `esc` (escapar texto para HTML). No usa Three.js, así que sirve en cualquier página. |
| `jugador.js` | Caminar en primera persona con colisiones: no deja salir de los límites ni entrar en los obstáculos. Lo usan el Lobby y las salas de los juegos. |
| `plano.js` | El plano de la esquina (la habitación desde arriba y dónde estás). Lo usan el Lobby y las salas. |

### Modelos (`js/modelos/`)

| Archivo | Qué hace |
|---|---|
| `index.js` | El catálogo: asocia cada nombre (hoy solo `gafas`) con su archivo. Se cargan bajo demanda. |
| `gafas.js` | Gafas de realidad virtual: visor, frontal con cámaras y franja luminosa, almohadilla, lentes, cinta y contrapeso. Marca un punto `entrada` entre las lentes, adonde viaja la cámara. |

### Portada (`js/portada/`)

| Archivo | Qué hace |
|---|---|
| `escena.js` | Escena, cámara, luces cálidas y motas de polvo. Monta el salón. |
| `sala.js` | El salón de casa hecho con código: tarima, paredes, ventana al atardecer con cortinas, sofá, lámpara, planta, cuadros, alfombra y una mesita bajo cada objeto (`colocarMesitas`). |
| `escaparate.js` | Lee `datos/escaparate.json`, carga los modelos, los coloca, los gira al arrastrarlos y los activa al tocarlos. Crea una etiqueta HTML por objeto (también sirve para teclado). |
| `main.js` | Arranca todo y decide qué pasa al activar un objeto: `entrar` (viaje de cámara y cambio de página) o `ficha` (tarjeta con enlace). |

### Lobby (`vr/index.html` + `js/lobby/`)

Es lo que se ve al entrar en las gafas. Tiene dos modos (atributo `data-modo` del `<body>`):

- **pantalla**: vista sentada frente al monitor "Elige un juego", con 6 tarjetas en filas de 3 como en las gafas (los huecos sin juego salen como "Próximamente" con candado). Al tocar una tarjeta se entra en la sala del juego si la tiene (`"sala": true`) o, si no, se abre su ficha (provisional).
- **libre**: primera persona. Se entra con el botón "Muévete libremente por la lobby" o la tecla **L**, que captura el ratón (pointer lock). W/S o ↑/↓ para avanzar y retroceder, A/D de lado, ←/→ o Q/E para girar, ratón para mirar, clic o Enter para tocar la pantalla donde apunta la mano (a menos de 3,5 m), **R** para volver a la pantalla, Esc para soltar el ratón. Si el navegador no deja capturar el ratón, se mira arrastrando.

| Archivo | Qué hace |
|---|---|
| `main.js` | Escena, cambio entre modos con animación de cámara, tocar tarjetas, ficha, tecla R y el indicador de la esquina (modo, controles y plano con tu posición). |
| `sala.js` | La habitación: paredes, suelo de baldosas, mesa, silla, ventana, puerta, estantería, planta y cuadro. Exporta `LIMITES` (paredes) y devuelve `obstaculos` (muebles) para las colisiones. |
| `pantalla.js` | El monitor: dibuja "Elige un juego" en un canvas con una tarjeta por juego de `datos/vr.json` y dice qué tarjeta hay en un punto (`tarjetaEn`). Los dibujos de las portadas están en `ICONOS`. |

En pantallas táctiles sin ratón no se ofrece el modo libre.

### Sala de un juego (`vr/juego.html?id=<juego>` + `js/juego/` + `js/juegos/<id>/`)

La sala 3D de cada juego, hoy las del **Bingo** y **Memoria**, copiadas de sus escenas de Unity (mismas medidas). La habitación, la mesa y la silla son comunes (`js/juegos/comun/sala.js`, como `GameRoomBuilder` en Unity). Se entra desde su tarjeta del Lobby con un fundido a negro. Modos (`data-modo` del `<body>`):

- **cine**: cinemática con la mirada fija, sentado a la mesa. En el Bingo, el bombo acelera, suelta la bola 18, la cámara la sigue por la rampa hasta la bandeja y se abre a la mesa entera. En Memoria, la mirada va a una carta, se da la vuelta (un plátano), luego a otra (otro plátano) y las dos quedan en verde: pareja. `Enter` (o clic) la salta y `Esc` vuelve al Lobby.
- **mesa**: sentado. Cada objeto que se toca lleva una etiqueta encima (también es su botón de teclado). `L` pasa a moverse libremente.
- **libre**: primera persona como en el Lobby; se toca lo que hay en el centro de la vista a menos de 2,5 m. `R` vuelve a la mesa.
- **panel**: el objeto se acerca a la cámara y se abre su panel (90 % de la pantalla): el texto baja a la izquierda por secciones y la derecha muestra la captura o el dibujo de la sección que se lee. El **cartón** se despliega como un papel ("Cómo se juega", con capturas de Unity) y la **bola** se abre en círculo ("Cómo se guardan los datos", con datos de ejemplo).

| Archivo | Qué hace |
|---|---|
| `js/juego/main.js` | Genérico para todos los juegos: modos, cámara guiada, etiquetas, tocar, acercar el objeto, teclado, indicador y volver al Lobby. |
| `js/juego/panel.js` | El panel grande: monta las secciones, marca la que se lee (al bajar con rueda o con `↑↓`) y lo abre "desplegando" o "acercando". |
| `js/juego/vistas.js` | Los dibujos de la derecha que no son capturas (archivo `.json`, medidas, barras por número, evolución, de las gafas al PC, privacidad). |
| `js/juegos/index.js` | Catálogo de salas (se cargan bajo demanda). |
| `js/juegos/comun/sala.js` | La habitación común: suelo, paredes, ventana, planta, mesa, silla y letrero con el nombre del juego. |
| `js/juegos/memoria/escena.js` | La sala de Memoria: tablero inclinado con marcador, 12 cartas (nivel Normal) con las texturas de Unity y dos plátanos; la cinemática de la pareja. Plátano izquierdo = cómo se juega, derecho = datos. |
| `js/juegos/bingo/escena.js` | La sala del Bingo: habitación, mesa, máquina con bombo que gira, rampa, bandeja, descarte, cesta, cartón, monitor y la bola; su cinemática y sus objetos que se tocan. |
| `datos/juegos/<id>.json` | Los textos de los dos paneles y los datos de ejemplo de cada juego. |

### Versión en texto (`vr/info.html`)

La misma información sin 3D. `js/vr/main.js` rellena sus secciones con `datos/vr.json`. Cada juego tiene un ancla (`info.html#cocina`).

### Cursor de mano VR

Dos dibujos SVG en `img/cursor/`, translúcidos como las manos de Unity y difuminados en la muñeca: `mano.svg` (dedos abiertos) y `dedo.svg` (índice estirado y el resto cerrados, sobre lo que se puede tocar). El punto activo es la punta del índice. Están incrustados en `css/base.css` como `--cursor-mano` y `--cursor-dedo`. En el modo libre la mano se dibuja en el centro de la pantalla.

## Cinemáticas de ponerse y quitarse las gafas

- **Ponerse** (`entrar` en `js/portada/main.js`): las gafas se levantan de la mesita, se giran para enseñar las lentes, se acercan a la cara y la vista se cierra en dos círculos (el `.visor` de `css/base.css`, con su radio en `--r`). Deja la marca `rvr-cinematica` en `sessionStorage` y el Lobby empieza con las lentes cerradas y las abre.
- **Quitarse** (`quitarseGafas` en `js/lobby/main.js` y en `js/portada/main.js`): el Lobby cierra las lentes y deja la marca `rvr-quitar`; la portada empieza con las gafas pegadas a la cara, abre las lentes y las gafas vuelven a la mesita.

## Teclado

Todo se puede usar sin ratón. El foco inicial se pone cuando la interfaz ya es visible (un elemento oculto con `visibility:hidden` pierde el foco).

| Dónde | Teclas |
|---|---|
| Portada | Al cargar está seleccionado **Conocer el proyecto** (`Enter` ya entra). `→` selecciona las gafas y se encienden, `←` vuelve al botón, `↑↓` giran las gafas, `Enter` entra con la cinemática |
| Lobby, modo pantalla | Al llegar está seleccionada la primera tarjeta. `Tab` o `←→↑↓` entre tarjetas (botones ocultos que resaltan la tarjeta), `Enter` abre la ficha, `L` modo libre, `Esc` quitarse las gafas y volver a la portada |
| Lobby, modo libre | `W A S D`, `↑↓` caminar, `←→`/`Q E` girar, `Enter`/`Espacio` tocar, `R` volver |
| Fichas | `Esc` cierra y el foco vuelve a donde estaba |
| Sala de un juego, cinemática | `Enter`, `Espacio` o `→` la saltan; `Esc` vuelve al Lobby |
| Sala de un juego, mesa | Al acabar la cinemática está seleccionado el primer objeto. `←→` entre objetos, `Enter` lo abre, `L` modo libre, `Esc` vuelve al Lobby (y queda seleccionada la tarjeta del juego) |
| Sala de un juego, modo libre | Como en el Lobby; `R` vuelve a la mesa |
| Panel de un objeto | `↓`/`Av Pág`/`Espacio` siguiente sección, `↑`/`Re Pág` anterior, `Inicio`/`Fin`, `Esc` cierra |

## Accesibilidad y rendimiento

- Con "reducir movimiento" activado en el sistema, no hay giros automáticos ni viaje de cámara: se navega directamente.
- Cada objeto 3D tiene su etiqueta como botón, así que se puede usar con teclado.
- En móviles y equipos modestos se desactiva el bloom y se baja la resolución.
