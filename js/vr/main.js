/* =========================================================
   vr/main.js · Pinta la página del proyecto VR a partir de datos/vr.json
   Para cambiar textos o añadir un juego basta con editar el JSON.
   ========================================================= */
import { cargarJSON, esc } from '../nucleo/datos.js?v=202611192241';

const $ = id => document.getElementById(id);

function pintar(d){
  $('tecnologia').innerHTML = d.tecnologia.map(t => `<li>${esc(t)}</li>`).join('');

  $('resumen').innerHTML = d.resumen.map((r, i) => `
    <article class="tarjeta">
      <span class="num">0${i + 1}</span>
      <h3>${esc(r.titulo)}</h3>
      <p>${esc(r.texto)}</p>
    </article>`).join('');

  $('juegos').innerHTML = d.juegos.map(j => `
    <article class="juego" id="${esc(j.id)}">
      <img src="${esc(j.imagen)}" alt="Captura de ${esc(j.nombre)} dentro de las gafas" loading="lazy" width="960" height="540">
      <div class="juego-texto">
        <small>${esc(j.lema)}</small>
        <h3>${esc(j.nombre)}</h3>
        <p>${esc(j.texto)}</p>
        <div class="trabaja"><b>Qué trabaja</b><ul>${j.trabaja.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
        <span class="niveles">Niveles: ${esc(j.niveles)}</span>
      </div>
    </article>`).join('');

  $('informeTexto').textContent = d.informe.texto;
  $('privacidad').textContent = d.informe.privacidad;
  $('medidas').innerHTML = d.informe.medidas.map(m => `<li>${esc(m)}</li>`).join('');
  $('estado').textContent = d.estado;
}

cargarJSON('../datos/vr.json').then(pintar).catch(err => {
  console.error(err);
  $('juegos').innerHTML = '<p class="intro">No se pudo cargar el contenido. Si abriste el archivo directamente, sirve la web con «python3 -m http.server».</p>';
});
