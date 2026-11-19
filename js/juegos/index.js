/* =========================================================
   juegos/index.js · Catálogo de salas de juego
   Cada juego con sala 3D tiene su carpeta js/juegos/<id>/ con escena.js
   (la sala, los objetos que se tocan y la cinemática) y su contenido en
   datos/juegos/<id>.json. Se cargan bajo demanda.
   Para añadir una sala: crea la carpeta, añade aquí su línea y pon
   "sala": true en su entrada de datos/vr.json.
   ========================================================= */
export const SALAS = {
  bingo: () => import('./bingo/escena.js?v=202611192241'),
};
