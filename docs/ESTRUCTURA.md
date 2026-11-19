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
js/vr/main.js ─────> js/nucleo/datos.js        (sin 3D: no carga Three.js)
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

### Página VR (`vr/`)

`vr/index.html` tiene la cabecera fija y los huecos de cada sección. `js/vr/main.js` los rellena con `datos/vr.json`.

## Accesibilidad y rendimiento

- Con "reducir movimiento" activado en el sistema, no hay giros automáticos ni viaje de cámara: se navega directamente.
- Cada objeto 3D tiene su etiqueta como botón, así que se puede usar con teclado.
- En móviles y equipos modestos se desactiva el bloom y se baja la resolución.
