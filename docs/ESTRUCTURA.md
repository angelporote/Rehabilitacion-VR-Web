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
js/lobby/main.js ──> js/lobby/sala.js, js/lobby/pantalla.js, js/lobby/jugador.js ──> js/nucleo/util.js
                 ──> js/nucleo/motor.js, js/nucleo/datos.js
js/vr/main.js ─────> js/nucleo/datos.js        (versión en texto, sin 3D: no carga Three.js)
```

## Qué hace cada archivo

### Núcleo (`js/nucleo/`)

| Archivo | Qué hace |
|---|---|
| `motor.js` | Crea el renderizador WebGL, el entorno de luz (reflejos) y el bloom. Baja la calidad sola si el equipo va lento. |
| `util.js` | Ayudas para modelar (`rrect`, `shell`, `mesh`, `canvasTex`, `basicGlow`), y detección de móvil, gama baja y "reducir movimiento". Usa Three.js. |
| `datos.js` | `cargarJSON` y `esc` (escapar texto para HTML). No usa Three.js, así que sirve en cualquier página. |

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

- **pantalla**: vista sentada frente al monitor "Elige un juego", con 6 tarjetas en filas de 3 como en las gafas (los huecos sin juego salen como "Próximamente" con candado). Al tocar una tarjeta se abre la ficha del juego (provisional).
- **libre**: primera persona. Se entra con el botón "Muévete libremente por la lobby" o la tecla **L**, que captura el ratón (pointer lock). W/S o ↑/↓ para avanzar y retroceder, A/D de lado, ←/→ o Q/E para girar, ratón para mirar, clic o Enter para tocar la pantalla donde apunta la mano (a menos de 3,5 m), **R** para volver a la pantalla, Esc para soltar el ratón. Si el navegador no deja capturar el ratón, se mira arrastrando.

| Archivo | Qué hace |
|---|---|
| `main.js` | Escena, cambio entre modos con animación de cámara, tocar tarjetas, ficha, tecla R y el indicador de la esquina (modo, controles y plano con tu posición). |
| `sala.js` | La habitación: paredes, suelo de baldosas, mesa, silla, ventana, puerta, estantería, planta y cuadro. Exporta `LIMITES` (paredes) y devuelve `obstaculos` (muebles) para las colisiones. |
| `pantalla.js` | El monitor: dibuja "Elige un juego" en un canvas con una tarjeta por juego de `datos/vr.json` y dice qué tarjeta hay en un punto (`tarjetaEn`). Los dibujos de las portadas están en `ICONOS`. |
| `jugador.js` | Caminar en primera persona con colisiones: no deja salir de `LIMITES` ni entrar en los obstáculos. |

En pantallas táctiles sin ratón no se ofrece el modo libre.

### Versión en texto (`vr/info.html`)

La misma información sin 3D. `js/vr/main.js` rellena sus secciones con `datos/vr.json`. Cada juego tiene un ancla (`info.html#cocina`).

### Cursor de mano VR

Dos dibujos SVG en `img/cursor/` (`mano.svg` abierta y `dedo.svg` apuntando), incrustados en `css/base.css` como `--cursor-mano` y `--cursor-dedo`. En el modo libre, con el ratón capturado, la mano se dibuja en el centro de la pantalla.

## Cinemáticas de ponerse y quitarse las gafas

- **Ponerse** (`entrar` en `js/portada/main.js`): las gafas se levantan de la mesita, se giran para enseñar las lentes, se acercan a la cara y la vista se cierra en dos círculos (el `.visor` de `css/base.css`, con su radio en `--r`). Deja la marca `rvr-cinematica` en `sessionStorage` y el Lobby empieza con las lentes cerradas y las abre.
- **Quitarse** (`quitarseGafas` en `js/lobby/main.js` y en `js/portada/main.js`): el Lobby cierra las lentes y deja la marca `rvr-quitar`; la portada empieza con las gafas pegadas a la cara, abre las lentes y las gafas vuelven a la mesita.

## Teclado

Todo se puede usar sin ratón:

| Dónde | Teclas |
|---|---|
| Portada | `Tab` hasta la etiqueta de las gafas, `←→↑↓` las giran, `Enter` entra |
| Lobby, modo pantalla | `Tab` o `←→↑↓` entre las tarjetas (botones ocultos que resaltan la tarjeta), `Enter` abre la ficha, `L` modo libre |
| Lobby, modo libre | `W A S D`, `↑↓` caminar, `←→`/`Q E` girar, `Enter`/`Espacio` tocar, `R` volver |
| Fichas | `Esc` cierra y el foco vuelve a donde estaba |

## Accesibilidad y rendimiento

- Con "reducir movimiento" activado en el sistema, no hay giros automáticos ni viaje de cámara: se navega directamente.
- Cada objeto 3D tiene su etiqueta como botón, así que se puede usar con teclado.
- En móviles y equipos modestos se desactiva el bloom y se baja la resolución.
