/* =========================================================
   juegos/comun/sala.js · La sala común de los juegos (como GameRoomBuilder en Unity)
   Suelo de baldosas, paredes crema, lámpara, ventana, planta, mesa de madera
   a 0,74 m, silla del paciente y un letrero con el nombre del juego.
   Cada juego (js/juegos/<id>/escena.js) la crea y pone encima lo suyo.
   Medidas en metros, como en Unity, con el eje Z cambiado de signo (U()).
   ========================================================= */
import * as THREE from 'three';
import { mesh, canvasTex, basicGlow, gamaBaja } from '../../nucleo/util.js?v=202611201014';

export const U = (x, y, z) => new THREE.Vector3(x, y, -z);      // de Unity a la web
export const MESA_Y = 0.74;
export const LIMITES = { x0:-2.4, x1:2.4, z0:-2.1, z1:2.3, alto:2.8 };
export const MESA = { x:0, z:-0.465, ancho:1.3, fondo:0.6 };

export const lit = (color, rough = 0.5, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness:rough, metalness:metal });

export function texMadera(base, vetas, w = 512, h = 256){
  const t = canvasTex(w, h, (g, W, H) => {
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    for(let i = 0; i < 140; i++){ g.fillStyle = `rgba(${vetas},${Math.random()*.16})`; g.fillRect(0, Math.random()*H, W, 1 + Math.random()*3); }
  });
  t.colorSpace = THREE.SRGBColorSpace; return t;
}
// Texto o dibujo pintado en un canvas, sin repetir
export function texTexto(w, h, pintar){ const t = canvasTex(w, h, pintar); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; }

// cartel = { texto, fondo, borde, color }
export function crearSalaComun(scene, cartel){
  const sala = new THREE.Group(); scene.add(sala);
  const obstaculos = [];
  const caja = (cx, cz, w, d) => obstaculos.push({ x0:cx - w/2, x1:cx + w/2, z0:cz - d/2, z1:cz + d/2 });
  const { x0, x1, z0, z1, alto } = LIMITES, anchoS = x1 - x0, fondoS = z1 - z0, cx = (x0 + x1)/2, cz = (z0 + z1)/2;
  const T = gamaBaja ? 0.5 : 1;

  /* ---------- Habitación (como la sala común de los juegos en Unity) ---------- */
  const baldosa = canvasTex(512*T, 512*T, (g, w, h) => {
    const n = 4, l = w/n;
    for(let i = 0; i < n; i++) for(let j = 0; j < n; j++){ const t = 222 + Math.random()*12; g.fillStyle = `rgb(${t},${t-16},${t-38})`; g.fillRect(i*l, j*l, l, l); }
    g.strokeStyle = '#B8A488'; g.lineWidth = 4*T; for(let i = 0; i <= n; i++){ g.beginPath(); g.moveTo(i*l, 0); g.lineTo(i*l, h); g.moveTo(0, i*l); g.lineTo(w, i*l); g.stroke(); }
  });
  baldosa.repeat.set(anchoS/1.6, fondoS/1.6); baldosa.colorSpace = THREE.SRGBColorSpace;
  mesh(new THREE.PlaneGeometry(anchoS, fondoS), new THREE.MeshStandardMaterial({ map:baldosa, roughness:0.5 }), cx, 0, cz, sala).rotation.x = -Math.PI/2;
  const paredM = new THREE.MeshStandardMaterial({ color:0xD9C3A2, roughness:0.95 });
  const pared = (w, x, z, ry) => { const m = mesh(new THREE.PlaneGeometry(w, alto), paredM, x, alto/2, z, sala); m.rotation.y = ry; };
  pared(anchoS, cx, z0, 0); pared(anchoS, cx, z1, Math.PI); pared(fondoS, x0, cz, Math.PI/2); pared(fondoS, x1, cz, -Math.PI/2);
  mesh(new THREE.PlaneGeometry(anchoS, fondoS), lit(0xF4EEE4, 1), cx, alto, cz, sala).rotation.x = Math.PI/2;
  const zocalo = lit(0x9A6A44, 0.6);
  [[anchoS,0.04,cx,z0+0.02],[anchoS,0.04,cx,z1-0.02],[0.04,fondoS,x0+0.02,cz],[0.04,fondoS,x1-0.02,cz]].forEach(([w,d,x,z]) => mesh(new THREE.BoxGeometry(w,0.12,d), zocalo, x, 0.06, z, sala));
  mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 40), basicGlow(0xFFF1D8, 1.5), 0, alto - 0.03, -0.3, sala);
  const luz = new THREE.PointLight(0xFFE8C8, 7, 10, 1.5); luz.position.set(0, alto - 0.4, -0.2); sala.add(luz);
  const foco = new THREE.SpotLight(0xFFF2DE, 3, 6, 0.6, 0.6, 1.2); foco.position.set(0.3, 2.4, 0.4); foco.target.position.set(0, MESA_Y, -0.35); sala.add(foco, foco.target);

  // Letrero con el nombre del juego en la pared del fondo (como GameRoomBuilder.AddSign)
  const letrero = texTexto(1024, 256, (g, w, h) => {
    g.fillStyle = cartel.fondo; g.beginPath(); g.roundRect(8, 8, w - 16, h - 16, 60); g.fill();
    g.strokeStyle = cartel.borde; g.lineWidth = 12; g.beginPath(); g.roundRect(26, 26, w - 52, h - 52, 46); g.stroke();
    g.fillStyle = cartel.color; g.font = `800 ${cartel.texto.length > 6 ? 120 : 150}px Sora, system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(cartel.texto, w/2, h/2 + 8);
  });
  mesh(new THREE.PlaneGeometry(1.4, 0.35), new THREE.MeshStandardMaterial({ map:letrero, roughness:0.6 }), 0, 1.95, z0 + 0.01, sala);

  // Ventana en la pared izquierda
  const cielo = texTexto(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7FB2E5'); gr.addColorStop(1, '#D9EEFA'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const ventana = new THREE.Group(); ventana.position.set(x0 + 0.01, 1.5, -0.6); ventana.rotation.y = Math.PI/2; sala.add(ventana);
  mesh(new THREE.PlaneGeometry(1.4, 1.0), new THREE.MeshBasicMaterial({ map:cielo, toneMapped:false }), 0, 0, 0, ventana);
  const blanco = lit(0xF7F3EC, 0.6);
  [[1.55,0.08,0,0.54],[1.55,0.08,0,-0.54],[0.08,1.15,-0.74,0],[0.08,1.15,0.74,0],[0.05,1.0,0,0]].forEach(([w,h,x,y]) => mesh(new THREE.BoxGeometry(w,h,0.06), blanco, x, y, 0.03, ventana));
  const sol = new THREE.DirectionalLight(0xFFF6E8, 0.9); sol.position.set(x0 - 2, 3, -0.6); sol.target.position.set(0.5, 0, -0.4); sala.add(sol, sol.target);

  // Planta en una esquina
  const maceta = new THREE.Group(); maceta.position.set(x1 - 0.45, 0, z0 + 0.45); sala.add(maceta);
  mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.4, 24), lit(0xB0603A, 0.7), 0, 0.2, 0, maceta);
  const hojaM = lit(0x4E8A4A, 0.6);
  for(let i = 0; i < 9; i++){ const h = mesh(new THREE.SphereGeometry(0.16, 12, 10), hojaM, Math.cos(i*0.7)*0.12, 0.55 + i*0.06, Math.sin(i*0.7)*0.12, maceta); h.scale.set(1, 0.45, 0.6); h.rotation.z = i; }
  caja(x1 - 0.45, z0 + 0.45, 0.45, 0.45);

  /* ---------- Mesa de madera ---------- */
  const maderaMesa = new THREE.MeshStandardMaterial({ map:texMadera('#C98A4E', '120,70,40'), roughness:0.5 });
  mesh(new THREE.BoxGeometry(MESA.ancho, 0.04, MESA.fondo), maderaMesa, MESA.x, MESA_Y - 0.02, MESA.z, sala);
  mesh(new THREE.BoxGeometry(MESA.ancho - 0.08, MESA_Y - 0.04, MESA.fondo - 0.12), lit(0x7A7064, 0.9), MESA.x, (MESA_Y - 0.04)/2, MESA.z - 0.03, sala);
  caja(MESA.x, MESA.z, MESA.ancho, MESA.fondo);

  // Silla del paciente (no se ve mientras estamos sentados en ella)
  const silla = new THREE.Group(); silla.position.set(0, 0, 0.4); sala.add(silla);
  const tapiz = lit(0x4F6E8E, 0.9), pata = lit(0x6B4A30, 0.6);
  mesh(new THREE.BoxGeometry(0.5, 0.08, 0.48), tapiz, 0, 0.46, 0, silla);
  mesh(new THREE.BoxGeometry(0.5, 0.5, 0.06), tapiz, 0, 0.75, 0.24, silla).rotation.x = -0.1;
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz]) => mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.44, 10), pata, sx*0.21, 0.22, sz*0.2, silla));
  caja(0, 0.4, 0.55, 0.55);

  return { sala, obstaculos, silla, caja };
}
