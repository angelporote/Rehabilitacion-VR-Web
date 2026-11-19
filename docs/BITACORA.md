# Bitácora

Diario del trabajo en la web: qué se hizo, qué se decidió (y por qué) y qué queda pendiente. La entrada más reciente va arriba.

---

## 19/11/2026 · Primera versión

**Hecho**
- Repositorio `Rehabilitacion-VR-Web` creado (público).
- Portada en 3D con dos objetos que se giran arrastrando y flotan:
  - **Gafas de realidad virtual** modeladas por código. Al tocarlas, la cámara entra por las lentes y se abre la página del proyecto (`vr/`).
  - **Prótesis de cadera**, el mismo modelo que Dentro del implante. Al tocarla se abre una ficha con el enlace a esa web.
- Página `vr/` con la información de RehabilitaciónVR: cómo se juega, los tres juegos (Receta de Cocina, Memoria de cartas, Bingo) con sus capturas, el informe para el terapeuta, la tecnología y el estado.
- Documentación: `README.md`, `docs/ESTRUCTURA.md`, `docs/AÑADIR_UN_PROYECTO.md` y esta bitácora.

**Decisiones**
- **Misma tecnología que Dentro del implante** (Three.js 0.170 y GSAP 3.12 por CDN, sin compilar, GitHub Pages) y mismos colores y letra, para que las dos webs se reconozcan como del mismo autor.
- **Pensada para crecer:** los objetos de la portada salen de `datos/escaparate.json` y cada modelo es un archivo. Añadir un proyecto es crear su modelo y una entrada en el JSON, sin tocar la escena.
- **Textos en JSON** (`datos/vr.json`), separados del código, como en Dentro del implante.
- **Licencias:** MIT para el código y CC BY-NC-SA 4.0 para el contenido, igual que en Dentro del implante.
- Las capturas de `img/vr/` son las de la carpeta del proyecto VR (`vr/arte/antes/`).

**Pendiente**
- Activar GitHub Pages (Settings > Pages, rama `main`, carpeta raíz).
- Revisar los textos de la página VR.
- Cambiar las capturas por las del arte nuevo cuando esté terminado.
- Añadir un vídeo corto de una partida a la página VR.
