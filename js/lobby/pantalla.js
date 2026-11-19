/* =========================================================
   pantalla.js · La pantalla "Elige un juego" del Lobby
   Se pinta en un <canvas> que hace de textura del monitor.
   Cada tarjeta sale de datos/vr.json (juegos); los huecos libres salen como
   "Próximamente" con candado, como en las gafas (6 tarjetas en filas de 3).
   ========================================================= */
import * as THREE from 'three';
import { rrect, mesh } from '../nucleo/util.js?v=202611192241';

const W = 1600, H = 900;                       // resolución del lienzo (16:9)

// ---- Dibujos de las portadas (uno por 'icono' de datos/vr.json) ----
function estrella(g, x, y, r, color){
  g.fillStyle = color; g.beginPath();
  for(let i=0;i<10;i++){ const a = -Math.PI/2 + i*Math.PI/5, rr = i%2 ? r*0.45 : r; g.lineTo(x + Math.cos(a)*rr, y + Math.sin(a)*rr); }
  g.closePath(); g.fill();
}
const ICONOS = {
  olla(g, x, y, w, h){
    const gr = g.createLinearGradient(x, y, x, y+h); gr.addColorStop(0,'#F0883A'); gr.addColorStop(1,'#D9493A'); g.fillStyle = gr; g.fillRect(x,y,w,h);
    const cx = x + w/2, cy = y + h*0.6;
    g.fillStyle = '#E3E6F0'; g.fillRect(cx - w*0.2, cy - h*0.2, w*0.4, h*0.36);
    g.fillStyle = '#7FD3E6'; g.fillRect(cx - w*0.21, cy - h*0.24, w*0.42, h*0.05);
    g.fillStyle = '#4A5568'; g.fillRect(cx - w*0.27, cy - h*0.16, w*0.07, h*0.035); g.fillRect(cx + w*0.2, cy - h*0.16, w*0.07, h*0.035);
    g.fillStyle = 'rgba(255,230,210,.85)'; [[-0.1,0.42,0.045],[0,0.38,0.055],[0.1,0.42,0.045]].forEach(([dx,dy,r]) => { g.beginPath(); g.arc(cx + dx*w, y + dy*h - h*0.08, r*w, 0, 7); g.fill(); });
  },
  cartas(g, x, y, w, h){
    const gr = g.createLinearGradient(x, y, x, y+h); gr.addColorStop(0,'#3FB6B8'); gr.addColorStop(1,'#13617E'); g.fillStyle = gr; g.fillRect(x,y,w,h);
    const cx = x + w/2, cy = y + h/2;
    g.save(); g.translate(cx - w*0.1, cy); g.rotate(-0.08);
    g.fillStyle = '#F6F2E4'; g.fillRect(-w*0.13, -h*0.33, w*0.26, h*0.62); g.fillStyle = '#2B4C9B'; g.fillRect(-w*0.115, -h*0.3, w*0.23, h*0.56);
    g.strokeStyle = '#F2C34B'; g.lineWidth = 5; g.beginPath(); g.arc(0, -h*0.02, w*0.065, 0, 7); g.stroke(); estrella(g, 0, -h*0.02, w*0.045, '#F2C34B');
    g.restore();
    g.save(); g.translate(cx + w*0.12, cy + h*0.02); g.rotate(0.12);
    g.fillStyle = '#FBF7EA'; g.fillRect(-w*0.13, -h*0.33, w*0.26, h*0.62); estrella(g, 0, 0, w*0.08, '#F7C531');
    g.restore();
  },
  candado(g, x, y, w, h){
    const gr = g.createLinearGradient(x, y, x, y+h); gr.addColorStop(0,'#5A6178'); gr.addColorStop(1,'#3A4058'); g.fillStyle = gr; g.fillRect(x,y,w,h);
    const cx = x + w/2, cy = y + h*0.56, s = h*0.2;
    g.strokeStyle = '#D5D9E6'; g.lineWidth = s*0.28; g.beginPath(); g.arc(cx, cy - s*0.55, s*0.55, Math.PI, 0); g.lineTo(cx + s*0.55, cy); g.moveTo(cx - s*0.55, cy - s*0.55); g.lineTo(cx - s*0.55, cy); g.stroke();
    g.fillStyle = '#D5D9E6'; g.fillRect(cx - s*0.95, cy - s*0.1, s*1.9, s*1.5);
    g.fillStyle = '#3A4058'; g.beginPath(); g.arc(cx, cy + s*0.55, s*0.18, 0, 7); g.fill();
  },
  bolas(g, x, y, w, h){
    const gr = g.createLinearGradient(x, y, x+w, y+h); gr.addColorStop(0,'#E98A3A'); gr.addColorStop(1,'#B23A5E'); g.fillStyle = gr; g.fillRect(x,y,w,h);
    [[-0.2,0.58,'#3D7BE0'],[0.2,0.58,'#B54BC2'],[0,0.5,'#F2A33A']].forEach(([dx,dy,c]) => {
      const bx = x + w/2 + dx*w, by = y + dy*h, r = h*0.25;
      g.fillStyle = c; g.beginPath(); g.arc(bx, by, r, 0, 7); g.fill();
      g.fillStyle = '#FBF5E8'; g.beginPath(); g.arc(bx, by, r*0.55, 0, 7); g.fill();
    });
  }
};

export function crearPantalla(juegos, { huecos = juegos.length, bloqueado = { nombre:'Próximamente', lema:'Nuevo juego' } } = {}){
  const lienzo = document.createElement('canvas'); lienzo.width = W; lienzo.height = H;
  const g = lienzo.getContext('2d');
  const tex = new THREE.CanvasTexture(lienzo); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;

  // Tarjetas: los juegos y, hasta completar los huecos, "Próximamente" (sin juego: no se pueden tocar)
  const lista = juegos.slice(0, Math.max(huecos, juegos.length));
  while(lista.length < huecos) lista.push(null);
  // Rejilla de 3 columnas, como en las gafas. Posiciones en píxeles del lienzo (sirven para saber cuál se toca)
  const cols = Math.min(3, lista.length), filas = Math.ceil(lista.length / cols);
  const hx = 50, hy = 44, y0 = 250, anchoT = 400;
  const altoT = Math.min(320, (H - y0 - 40 - hy*(filas - 1)) / filas);
  const x0 = (W - (anchoT*cols + hx*(cols - 1))) / 2;
  const tarjetas = lista.map((j, i) => ({ juego:j, x:x0 + (i % cols)*(anchoT + hx), y:y0 + Math.floor(i / cols)*(altoT + hy), w:anchoT, h:altoT }));
  function pintar(resaltada = -1){
    g.fillStyle = '#15141F'; g.fillRect(0,0,W,H);
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.fillStyle = '#FFFFFF'; g.font = '700 84px Sora, system-ui, sans-serif'; g.fillText('Elige un juego', W/2, 118);
    g.fillStyle = '#B9C0DA'; g.font = '400 40px Sora, system-ui, sans-serif'; g.fillText('Toca la portada del juego al que quieras jugar', W/2, 182);
    tarjetas.forEach((t, i) => {
      const j = t.juego || { ...bloqueado, color:'#727C99', icono:'candado' };
      const on = i === resaltada && t.juego;
      g.save(); g.translate(t.x + t.w/2, t.y + t.h/2); if(on) g.scale(1.04, 1.04); g.translate(-(t.x + t.w/2), -(t.y + t.h/2));
      if(on){ g.shadowColor = 'rgba(95,242,210,.8)'; g.shadowBlur = 40; }
      g.fillStyle = '#262C40'; g.fillRect(t.x, t.y, t.w, t.h);
      g.shadowBlur = 0;
      g.fillStyle = j.color || '#5FF2D2'; g.fillRect(t.x, t.y, t.w, 10);
      const portada = { x:t.x + 18, y:t.y + 26, w:t.w - 36, h:t.h*0.56 };
      const dib = ICONOS[j.icono];
      if(dib) dib(g, portada.x, portada.y, portada.w, portada.h); else { g.fillStyle = '#4A5068'; g.fillRect(portada.x, portada.y, portada.w, portada.h); }
      g.fillStyle = '#FFFFFF'; g.font = '700 40px Sora, system-ui, sans-serif'; g.fillText(j.nombre, t.x + t.w/2, t.y + t.h*0.56 + 82, t.w - 24);
      g.fillStyle = '#C9CFE6'; g.font = '400 25px Sora, system-ui, sans-serif'; g.fillText(j.lema, t.x + t.w/2, t.y + t.h*0.56 + 122, t.w - 24);
      if(on){ g.strokeStyle = '#5FF2D2'; g.lineWidth = 6; g.strokeRect(t.x - 3, t.y - 3, t.w + 6, t.h + 6); }
      g.restore();
    });
    tex.needsUpdate = true;
  }

  // ---- Monitor 3D: marco con bisel, pantalla y peana (mide 1,15 m de ancho) ----
  const ANCHO = 1.15, ALTO = ANCHO * H / W;
  const grupo = new THREE.Group();
  const marcoM = new THREE.MeshStandardMaterial({ color:0x2B2620, metalness:0.4, roughness:0.45 });
  mesh(new THREE.ExtrudeGeometry(rrect(ANCHO + 0.1, ALTO + 0.1, 0.03), { depth:0.04, bevelEnabled:true, bevelThickness:0.012, bevelSize:0.012, bevelSegments:3 }), marcoM, 0, 0, -0.045, grupo);
  const pantalla = mesh(new THREE.PlaneGeometry(ANCHO, ALTO), new THREE.MeshBasicMaterial({ map:tex, toneMapped:false }), 0, 0, 0.012, grupo);
  pintar();
  // Si la fuente Sora llega después, repintamos con ella
  document.fonts && document.fonts.ready.then(() => pintar());

  // ¿Qué tarjeta hay en un punto de la pantalla? (uv de un rayo que la toca)
  function tarjetaEn(uv){
    const px = uv.x * W, py = (1 - uv.y) * H;
    return tarjetas.findIndex(t => t.juego && px >= t.x && px <= t.x + t.w && py >= t.y && py <= t.y + t.h);   // los huecos 'Próximamente' no se tocan
  }

  return { grupo, pantalla, tarjetas, pintar, tarjetaEn, ANCHO, ALTO };
}
