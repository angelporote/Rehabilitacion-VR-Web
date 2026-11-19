/* =========================================================
   modelos/index.js · Catálogo de modelos 3D de la portada
   Cada modelo vive en su propio archivo y exporta crear() → { grupo, detalle? }.
   - grupo:   THREE.Group con el objeto montado (en cualquier tamaño: la escena lo escala sola)
   - detalle: función opcional que se llama tras el primer fotograma para generar texturas costosas
   Para añadir un modelo: crea js/modelos/<nombre>.js y añádelo aquí.
   ========================================================= */
export const MODELOS = {
  gafas: () => import('./gafas.js?v=202611192241')
};
