# Bitácora

Diario del trabajo en la web: qué se hizo, qué se decidió (y por qué) y qué queda pendiente. La entrada más reciente va arriba.

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
