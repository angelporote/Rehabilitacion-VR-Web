/* =========================================================
   juego/vistas.js · Los dibujos de la derecha del panel que no son capturas
   Cada vista recibe el "ejemplo" del JSON del juego (datos inventados,
   nunca de pacientes) y devuelve HTML. Se animan con la clase .activa.
   Para añadir una vista: una función más en VISTAS con su nombre.
   ========================================================= */
import { esc } from '../nucleo/datos.js?v=202611201014';

const num = v => typeof v === 'number' ? v.toLocaleString('es-ES') : esc(v);
const etiquetaEjemplo = '<span class="ejemplo">Datos de ejemplo</span>';

const ICONO = {
  gafas:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="7" width="19" height="10" rx="4"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/></svg>',
  pc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
  tabla:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 4v16"/></svg>',
  informe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h9l4 4v14H6z"/><path d="M9 17v-3M12 17v-6M15 17v-4"/></svg>',
};

export const VISTAS = {
  // El archivo de la partida, tal cual (resumido)
  json(e){
    const L = [];
    const k = (n, v, coma = true) => L.push(`  <b class="j-k">"${n}"</b>: ${v}${coma ? ',' : ''}`);
    const s = v => `<b class="j-s">"${esc(v)}"</b>`, n = v => `<b class="j-n">${v}</b>`;
    L.push('{');
    k('formatVersion', n(e.formatVersion)); k('patient', s(e.patient)); k('game', s(e.game));
    k('level', s(e.level)); k('levelIndex', n(e.levelIndex)); k('durationSeconds', n(e.durationSeconds));
    k('completed', n(e.completed)); k('endReason', s(e.endReason)); k('summary', s(e.summary));
    L.push('  <b class="j-k">"metrics"</b>: {');
    [...e.comunes, ...e.derivadas, ...e.propias.filter(([, v]) => typeof v === 'number')].slice(0, 7).forEach(([nom, v]) => L.push(`    <b class="j-k">"${nom}"</b>: ${n(v)},`));
    L.push('    <b class="j-c">…</b>'); L.push('  },');
    const pasos = e.pasos || [];
    if(pasos.length){
      L.push('  <b class="j-k">"steps"</b>: [');
      pasos.slice(0, 2).forEach(([nom, lat, dur, err]) => L.push(`    { <b class="j-k">"name"</b>: ${s(nom)}, <b class="j-k">"latencySeconds"</b>: ${n(lat)}, <b class="j-k">"durationSeconds"</b>: ${n(dur)}, <b class="j-k">"errors"</b>: ${n(err)} },`));
      L.push('    <b class="j-c">…</b>'); L.push('  ]');
    } else L.push('  <b class="j-k">"steps"</b>: []');
    L.push('}');
    return `${etiquetaEjemplo}<div class="vista"><h4>Archivo de una partida (.json)</h4><pre>${L.map((l, i) => `<span style="transition-delay:${i*35}ms">${l}</span>`).join('')}</pre></div>`;
  },

  // Las medidas comunes, como fichas
  comunes(e){
    const f = ([nom, v, u, que], cls = '') => `<div class="ficha-m ${cls}"><code>${esc(nom)}</code><b>${num(v)}<small>${esc(u)}</small></b><span>${esc(que)}</span></div>`;
    return `${etiquetaEjemplo}<div class="vista"><h4>Medidas comunes a todos los juegos</h4><div class="fichas">${e.comunes.map(m => f(m)).join('')}</div></div>`;
  },

  // Las propias del juego, en tabla
  propias(e){
    return `${etiquetaEjemplo}<div class="vista"><h4>Medidas propias del ${esc(e.game)}</h4><table class="tabla-m">${
      e.propias.map(([nom, v, u, que]) => `<tr><td>${esc(nom)}</td><td>${num(v)} ${esc(u)}</td><td>${esc(que)}</td></tr>`).join('')}</table></div>`;
  },

  // Un registro por número: barras de tiempo de reacción y de transporte
  pasos(e){
    const max = Math.max(...e.pasos.map(([, l, d]) => Math.max(0, l) + Math.max(0, d))) || 1;
    const fila = ([nom, lat, dur], i) => {
      const dentro = lat < 0
        ? '<span class="omitida">Se le pasó (omisión)</span>'
        : `<i class="lat" data-w="${lat/max*100}" style="transition-delay:${i*90}ms"></i><i class="tra" data-w="${dur/max*100}" style="transition-delay:${i*90 + 200}ms"></i>`;
      return `<div class="barra"><span>${esc(nom)}</span><div class="pista" title="${lat < 0 ? 'Omitida' : `Reacción ${num(lat)} s · transporte ${num(dur)} s`}">${dentro}</div></div>`;
    };
    return `${etiquetaEjemplo}<div class="vista"><h4>Un registro por número del cartón</h4><div class="barras">${e.pasos.map(fila).join('')}</div>
      <div class="leyenda"><span><i style="background:var(--bio)"></i>Hasta cogerla (s)</span><span><i style="background:var(--warm)"></i>Hasta la cesta (s)</span></div></div>`;
  },

  // Medidas derivadas y evolución de la precisión en varias sesiones
  evolucion(e){
    const v = e.evolucion, W = 300, H = 110, m = 18;
    const X = i => m + i*(W - m*2)/(v.length - 1), Y = p => H - m - (p - 40)/60*(H - m*2);
    const d = v.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p).toFixed(1)}`).join(' ');
    const puntos = v.map((p, i) => `<circle cx="${X(i)}" cy="${Y(p)}" r="4" fill="#5FF2D2"/><text x="${X(i)}" y="${Y(p) - 9}" fill="#D2C0AC" font-size="9" text-anchor="middle">${p}%</text>`).join('');
    const fichas = e.derivadas.map(([nom, val, u, como]) => `<div class="ficha-m der"><code>${esc(nom)}</code><b>${num(val)}<small>${esc(u)}</small></b><span>${esc(como)}</span></div>`).join('');
    return `${etiquetaEjemplo}<div class="vista"><h4>Se calculan al guardar</h4><div class="fichas">${fichas}</div>
      <div class="grafica"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Precisión en 5 sesiones de ejemplo">
        <path class="linea" d="${d}" fill="none" stroke="#5FF2D2" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${puntos}
        <text x="${m}" y="${H - 3}" fill="#8A7562" font-size="9">Sesión 1</text><text x="${W - m}" y="${H - 3}" fill="#8A7562" font-size="9" text-anchor="end">Sesión ${v.length}</text>
      </svg></div><p style="color:var(--dim);font-size:.76rem;margin:.6rem 0 0">Precisión de un paciente de ejemplo en ${esc(e.game)} · ${esc(e.level)}, sesión a sesión.</p></div>`;
  },

  // De las gafas al PC
  flujo(){
    const p = (ico, t, s, i) => `<div class="paso-f" style="transition-delay:${i*150}ms">${ICONO[ico]}<div><b>${t}</b><span>${s}</span></div></div>`;
    const f = '<div class="flecha-f">↓</div>';
    return `<div class="vista"><h4>De las gafas al PC del centro</h4><div class="flujo">
      ${p('gafas', 'Gafas', 'Un archivo por partida. En las gafas no se borra nada.', 0)}${f}
      ${p('pc', 'Carpeta del PC', 'RehabilitacionVR_Datos: los originales, sin tocar. Importar dos veces no duplica.', 1)}${f}
      ${p('tabla', 'Tablas para Excel', 'sesiones.csv (una fila por partida) y medidas.csv (todas las medidas).', 2)}${f}
      ${p('informe', 'Informe del paciente', 'Evolución por juego con gráficas. Se abre sin internet.', 3)}
    </div></div>`;
  },

  privacidad(e){
    return `<div class="vista privado"><h4>Lo único que identifica la partida</h4><div class="codigo">${esc(e.patient)}</div>
      <ul><li>Nombre</li><li>Apellidos</li><li>Fecha de nacimiento</li><li>DNI</li><li>Fotos</li></ul></div>`;
  },
};

// Al activarse una vista: las barras crecen hasta su ancho
export function animarVista(capa){
  capa.querySelectorAll('[data-w]').forEach(i => { i.style.width = '0'; requestAnimationFrame(() => requestAnimationFrame(() => { i.style.width = i.dataset.w + '%'; })); });
}
