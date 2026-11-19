/* =========================================================
   pantalla.js · La pantalla "Elige un juego" del Lobby
   Se pinta en un <canvas> que hace de textura del monitor.
   Cada tarjeta sale de datos/vr.json (juegos) y se puede tocar.
   ========================================================= */
import * as THREE from 'three';
import { rrect, mesh } from '../nucleo/util.js';

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
  bolas(g, x, y, w, h){
    const gr = g.createLinearGradient(x, y, x+w, y+h); gr.addColorStop(0,'#E98A3A'); gr.addColorStop(1,'#B23A5E'); g.fillStyle = gr; g.fillRect(x,y,w,h);
    [[-0.2,0.58,'#3D7BE0'],[0.2,0.58,'#B54BC2'],[0,0.5,'#F2A33A']].forEach(([dx,dy,c]) => {
      const bx = x + w/2 + dx*w, by = y + dy*h, r = h*0.25;
      g.fillStyle = c; g.beginPath(); g.arc(bx, by, r, 0, 7); g.fill();
      g.fillStyle = '#FBF5E8'; g.beginPath(); g.arc(bx, by, r*0.55, 0, 7); g.fill();
    });
  }
};

export function crearPantalla(juegos){
  const lienzo = document.createElement('canvas'); lienzo.width = W; lienzo.height = H;
  const g = lienzo.getContext('2d');
  const tex = new THREE.CanvasTexture(lienzo); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;

  // Rectángulos de cada tarjeta, en píxeles del lienzo (sirven para saber cuál se toca)
  const n = Math.max(1, juegos.length), hueco = 40, margen = 120;
  const anchoT = Math.min(440, (W - margen*2 - hueco*(n-1)) / n), altoT = 520;
  const x0 = (W - (anchoT*n + hueco*(n-1))) / 2, y0 = 270;
  const tarjetas = juegos.map((j, i) => ({ juego:j, x:x0 + i*(anchoT + hueco), y:y0, w:anchoT, h:altoT }));

  function pintar(resaltada = -1){
    g.fillStyle = '#15141F'; g.fillRect(0,0,W,H);
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.fillStyle = '#FFFFFF'; g.font = '700 92px Sora, system-ui, sans-serif'; g.fillText('Elige un juego', W/2, 130);
    g.fillStyle = '#B9C0DA'; g.font = '400 42px Sora, system-ui, sans-serif'; g.fillText('Toca la portada del juego al que quieras jugar', W/2, 200);
    tarjetas.forEach((t, i) => {
      const on = i === resaltada;
      g.save(); g.translate(t.x + t.w/2, t.y + t.h/2); if(on) g.scale(1.04, 1.04); g.translate(-(t.x + t.w/2), -(t.y + t.h/2));
      if(on){ g.shadowColor = 'rgba(95,242,210,.8)'; g.shadowBlur = 40; }
      g.fillStyle = '#262C40'; g.fillRect(t.x, t.y, t.w, t.h);
      g.shadowBlur = 0;
      g.fillStyle = t.juego.color || '#5FF2D2'; g.fillRect(t.x, t.y, t.w, 14);
      const dib = ICONOS[t.juego.icono];
      if(dib) dib(g, t.x + 24, t.y + 38, t.w - 48, t.h*0.5); else { g.fillStyle = '#4A5068'; g.fillRect(t.x + 24, t.y + 38, t.w - 48, t.h*0.5); }
      g.fillStyle = '#FFFFFF'; g.font = '700 50px Sora, system-ui, sans-serif'; g.fillText(t.juego.nombre, t.x + t.w/2, t.y + t.h*0.5 + 120, t.w - 30);
      g.fillStyle = '#C9CFE6'; g.font = '400 32px Sora, system-ui, sans-serif'; g.fillText(t.juego.lema, t.x + t.w/2, t.y + t.h*0.5 + 175, t.w - 30);
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
    return tarjetas.findIndex(t => px >= t.x && px <= t.x + t.w && py >= t.y && py <= t.y + t.h);
  }

  return { grupo, pantalla, tarjetas, pintar, tarjetaEn, ANCHO, ALTO };
}
