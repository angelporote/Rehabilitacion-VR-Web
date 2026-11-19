/* =========================================================
   datos.js · Ayudas sin 3D: cargar contenido JSON y escapar texto
   (las usan la portada y las páginas de proyecto)
   ========================================================= */

// Carga un JSON relativo a la página
export async function cargarJSON(ruta){
  const r = await fetch(ruta, { cache:'no-cache' });   // revalida siempre: los textos cambian sin tocar el código
  if(!r.ok) throw new Error(`No se pudo cargar ${ruta} (${r.status})`);
  return r.json();
}

// Escapa texto para meterlo en HTML sin riesgo
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
