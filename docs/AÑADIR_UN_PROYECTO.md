# Añadir un juego o un objeto

## Un objeto nuevo en la portada

1. **Modelo.** Crea `js/modelos/<nombre>.js` con una función `crear()` que devuelva `{ grupo }` (un `THREE.Group` con el modelo). Puede tener cualquier tamaño: la portada lo centra y lo escala. Si tiene texturas costosas, devuelve también `detalle`, una función que las genere (se llama después del primer fotograma).

   ```js
   import * as THREE from 'three';
   export function crear(){
     const grupo = new THREE.Group();
     // ... piezas del modelo ...
     return { grupo };
   }
   ```

   Si el objeto debe "abrirse" con un viaje de cámara, añade un punto de entrada: `grupo.userData.entrada = unObject3D`.

2. **Catálogo.** Añade una línea en `js/modelos/index.js`:

   ```js
   miModelo: () => import('./miModelo.js'),
   ```

3. **Datos.** Añade una entrada a `datos/escaparate.json`:

   | Campo | Qué es |
   |---|---|
   | `id` | Identificador único |
   | `modelo` | El nombre usado en el catálogo |
   | `titulo`, `etiqueta` | Lo que dice la etiqueta bajo el objeto |
   | `color` | Color de acento de la etiqueta y la ficha |
   | `accion` | `entrar` (viaja dentro y abre `destino`) o `ficha` (tarjeta con enlace) |
   | `destino` | Ruta interna (`vr/`) o dirección web externa |
   | `ficha` | Solo para `ficha`: `familia`, `texto` y `boton` |
   | `giroInicial` | `[x, y]` en radianes: cómo se ve al empezar |
   | `escala` | Opcional: agranda (>1) o reduce (<1) el modelo frente a los demás |

La portada reparte los objetos sola según cuántos haya.

## Una página nueva

Copia el patrón de `vr/info.html`: un HTML, un `js/<pagina>/main.js` que pinte su `datos/<pagina>.json`, y reutiliza `css/base.css` y `css/vr.css`.

## Un juego nuevo en el Lobby

Añade una entrada a `juegos` en `datos/vr.json` y su captura en `img/vr/` (960 × 540, JPG). Sale a la vez como tarjeta en la pantalla del Lobby y en la versión en texto. `icono` es uno de los dibujos de `ICONOS` en `js/lobby/pantalla.js` (`olla`, `cartas`, `bolas`); para uno nuevo, añade allí una función que lo dibuje:

```json
{
  "id": "nuevo",
  "nombre": "Nombre del juego",
  "lema": "Frase corta",
  "imagen": "../img/vr/nuevo.jpg",
  "texto": "Qué hace el paciente.",
  "trabaja": ["Función 1", "Función 2"],
  "niveles": "Fácil y Difícil",
  "color": "#E8643C",
  "icono": "olla"
}
```

## La sala 3D de un juego

Un juego puede tener su propia sala (como el Bingo): al tocar su tarjeta en el Lobby se entra en `vr/juego.html?id=<id>` en vez de abrir la ficha. Pasos:

1. **La sala**: crea `js/juegos/<id>/escena.js` con una función `crear({ scene })` que devuelva:
   - `limites` y `obstaculos` (para caminar con colisiones), `silla` (se oculta sentado), `vistaMesa()` (`{ pos, mira }`) e `inicioLibre` (`{ x, z, mira }`);
   - `tocables`: los objetos que se tocan, cada uno con `id` (el del panel), `nombre`, `objeto`, `estilo` (`"desplegar"` o `"acercar"`), `ancla()` (dónde va su etiqueta) y `resaltar(on, gsap)`;
   - `cinematica(tl, cam)` (rellena una línea de tiempo de GSAP moviendo `cam.pos`, `cam.mira` y `cam.fov`), `finCinematica()`, `animar(t, dt, camera)` y `dibujarPlano(g, X, Z, k)`.
   Copia `js/juegos/bingo/escena.js` como punto de partida: usa las medidas de la escena de Unity.
2. **Regístrala** en `js/juegos/index.js`.
3. **Los textos**: `datos/juegos/<id>.json`, con un panel por objeto en `paneles`. Cada sección tiene `titulo`, `texto` (y si quieres `lista` o `tabla`) y, para la derecha, una `imagen` (capturas en `img/vr/<id>/`) o una `vista` de `js/juego/vistas.js` (`json`, `comunes`, `propias`, `pasos`, `evolucion`, `flujo`, `privacidad`), que se dibujan con los datos de `ejemplo`.
4. **Actívala** con `"sala": true` en su entrada de `datos/vr.json`.

Los datos de las vistas son siempre de ejemplo: nunca de pacientes reales.

## Antes de subir cambios

- Sirve la web en local (`python3 -m http.server`) y prueba la portada, el Lobby (los dos modos) y la versión en texto, también con la ventana estrecha (móvil).
- Comprueba que la consola del navegador no muestra errores.
- Apunta lo que hiciste en `docs/BITACORA.md`.
