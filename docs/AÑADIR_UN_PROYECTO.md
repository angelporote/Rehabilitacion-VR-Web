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

## Una página de proyecto nueva

Copia el patrón de `vr/`: una carpeta con su `index.html`, un `js/<proyecto>/main.js` que pinte su `datos/<proyecto>.json`, y reutiliza `css/base.css` y `css/vr.css`.

## Un juego nuevo en la página VR

Añade una entrada a `juegos` en `datos/vr.json` y su captura en `img/vr/` (960 × 540, JPG):

```json
{
  "id": "nuevo",
  "nombre": "Nombre del juego",
  "lema": "Frase corta",
  "imagen": "../img/vr/nuevo.jpg",
  "texto": "Qué hace el paciente.",
  "trabaja": ["Función 1", "Función 2"],
  "niveles": "Fácil y Difícil"
}
```

## Antes de subir cambios

- Sirve la web en local (`python3 -m http.server`) y prueba la portada y la página VR, también con la ventana estrecha (móvil).
- Comprueba que la consola del navegador no muestra errores.
- Apunta lo que hiciste en `docs/BITACORA.md`.
