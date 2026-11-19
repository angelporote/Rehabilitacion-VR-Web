# Rehabilitación VR · Web

*Una web en 3D para presentar RehabilitaciónVR, juegos de rehabilitación en realidad virtual.*

**Web:** https://angelporote.github.io/Rehabilitacion-VR-Web/

La portada es un salón de casa al atardecer con unas **gafas de realidad virtual** sobre una mesita. Las gafas flotan y se pueden girar con el ratón o el dedo. Al tocarlas, una cinemática te pone las gafas y apareces en el **Lobby** de RehabilitaciónVR (`vr/`), la habitación desde la que se eligen los juegos en las gafas Pico 4 Ultra. Primero ves la pantalla "Elige un juego"; con el botón **Muévete libremente por la lobby** la web se convierte en un videojuego en primera persona (WASD o flechas y ratón, con colisiones), y **R** te devuelve a la pantalla. "Quitarse las gafas" tiene su cinemática de vuelta. El cursor es una mano VR y todo se puede usar con teclado.

Está hecha con HTML, CSS y JavaScript sin compilar: los modelos 3D se construyen con código en Three.js y los textos están separados en archivos JSON.

## Estructura

```
index.html              portada: el salón con las gafas en 3D
vr/index.html           el Lobby en 3D (pantalla y modo libre en primera persona)
vr/info.html            la información del proyecto en texto, sin 3D
css/base.css            colores, tipografía y botones comunes
css/portada.css         aspecto de la portada
css/lobby.css           aspecto del Lobby (botones, indicador, mano, ficha)
css/vr.css              aspecto de la versión en texto
js/nucleo/              lo compartido: motor gráfico, utilidades 3D y carga de datos
js/modelos/             un archivo por modelo 3D (hoy: gafas.js) y su catálogo (index.js)
js/portada/             escena, salón, escaparate (objetos e interacción) y arranque de la portada
js/lobby/                el Lobby: habitación, pantalla, jugador en primera persona y arranque
js/vr/main.js           pinta la versión en texto desde datos/vr.json
datos/escaparate.json   qué objetos salen en la portada y adónde lleva cada uno
datos/vr.json           los juegos (tarjetas del Lobby) y los textos del proyecto
img/vr/                 capturas tomadas dentro de las gafas
img/cursor/             la mano VR que hace de cursor
docs/                   documentación y bitácora
```

Más detalle en [docs/ESTRUCTURA.md](docs/ESTRUCTURA.md).

## Documentación

| Archivo | Para qué |
|---|---|
| [docs/ESTRUCTURA.md](docs/ESTRUCTURA.md) | Cómo está montada la web y qué hace cada archivo |
| [docs/AÑADIR_UN_PROYECTO.md](docs/AÑADIR_UN_PROYECTO.md) | Añadir un juego a la página VR, o un objeto nuevo a la portada |
| [docs/BITACORA.md](docs/BITACORA.md) | Diario del trabajo: qué se hizo, qué se decidió y qué falta |

## Probarla en local

Como usa módulos y carga archivos JSON, hay que servirla (no basta con abrir el archivo):

```
python3 -m http.server
```

y abrir `http://localhost:8000`.

## Publicarla

En GitHub: **Settings > Pages > Build and deployment > Deploy from a branch**, rama `main` y carpeta `/ (root)`. El archivo `.nojekyll` hace que GitHub sirva los archivos tal cual.

## Tecnología

[Three.js](https://threejs.org) 0.170 para el 3D y [GSAP](https://gsap.com) 3.12 para las animaciones, cargados desde CDN: no hay que instalar nada ni compilar. Letra [Sora](https://fonts.google.com/specimen/Sora).

## Licencia

- **Código:** MIT (ver `LICENSE`).
- **Contenido (textos, datos e imágenes):** CC BY-NC-SA 4.0 (ver `LICENSE-CONTENIDO.md`).

Autor: Ángel Portela Otero.
