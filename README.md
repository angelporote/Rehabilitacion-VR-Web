# Rehabilitación VR · Web

*Una web en 3D para presentar mis proyectos de Ingeniería Biomédica.*

**Web:** https://angelporote.github.io/Rehabilitacion-VR-Web/ (cuando GitHub Pages esté activado)

La portada muestra unos objetos 3D que se pueden girar con el ratón o el dedo. Cada objeto es la puerta a un proyecto:

| Objeto | Proyecto | Qué pasa al tocarlo |
|---|---|---|
| Gafas de realidad virtual | **RehabilitaciónVR**: juegos de rehabilitación para las gafas Pico 4 Ultra, controlados solo con las manos | La cámara entra por las lentes y se abre la página del proyecto (`vr/`) |
| Prótesis de cadera | **Dentro del implante**: web de biomateriales e implantología | Se abre una ficha con el enlace a esa web |

Sigue el mismo enfoque que [Dentro del implante](https://github.com/angelporote/Dentro-del-Implante): HTML, CSS y JavaScript sin compilar, modelos hechos con código en Three.js y los textos separados en archivos JSON.

## Estructura

```
index.html              portada: un objeto 3D por proyecto
vr/index.html           página del proyecto RehabilitaciónVR
css/base.css            colores, tipografía y botones comunes
css/portada.css         aspecto de la portada
css/vr.css              aspecto de las páginas de proyecto
js/nucleo/              lo compartido: motor gráfico, utilidades 3D y carga de datos
js/modelos/             un archivo por modelo 3D (gafas.js, protesis.js) y su catálogo (index.js)
js/portada/             escena, escaparate (objetos e interacción) y arranque de la portada
js/vr/main.js           pinta la página del proyecto VR desde su JSON
datos/escaparate.json   qué objetos salen en la portada y adónde lleva cada uno
datos/vr.json           textos de la página del proyecto VR (juegos, informe, estado)
img/vr/                 capturas tomadas dentro de las gafas
docs/                   documentación y bitácora
```

Más detalle en [docs/ESTRUCTURA.md](docs/ESTRUCTURA.md).

## Documentación

| Archivo | Para qué |
|---|---|
| [docs/ESTRUCTURA.md](docs/ESTRUCTURA.md) | Cómo está montada la web y qué hace cada archivo |
| [docs/AÑADIR_UN_PROYECTO.md](docs/AÑADIR_UN_PROYECTO.md) | Añadir un objeto nuevo a la portada, o un juego a la página VR |
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
