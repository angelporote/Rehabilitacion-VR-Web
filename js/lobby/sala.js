/* =========================================================
   sala.js · La habitación del Lobby (como la de las gafas)
   Paredes crema, suelo de baldosas, mesa de madera con la pantalla,
   silla del paciente, ventana, puerta, estantería y planta.
   Devuelve también los obstáculos (cajas en el plano XZ) para las colisiones.
   Medidas en metros, como en Unity: suelo en y = 0.
   ========================================================= */
import * as THREE from 'three';
import { gamaBaja, mesh, canvasTex, basicGlow } from '../nucleo/util.js';

export const LIMITES = { x0:-3, x1:3, z0:-3, z1:4, alto:2.9 };   // interior de las paredes
export const MESA = { x:0, z:-1.75, ancho:1.7, fondo:0.8, alto:0.76 };

export function crearSala(scene){
  const T = gamaBaja ? 0.5 : 1;
  const sala = new THREE.Group(); scene.add(sala);
  const obstaculos = [];                                   // { x0, x1, z0, z1 }
  const caja = (cx, cz, w, d) => obstaculos.push({ x0:cx - w/2, x1:cx + w/2, z0:cz - d/2, z1:cz + d/2 });
  const { x0, x1, z0, z1, alto } = LIMITES, anchoS = x1 - x0, fondoS = z1 - z0;
  const cx = (x0 + x1)/2, cz = (z0 + z1)/2;

  // ---- Suelo de baldosas beige ----
  const baldosa = canvasTex(512*T, 512*T, (g,w,h)=>{
    const n = 4, l = w/n;
    for(let i=0;i<n;i++) for(let j=0;j<n;j++){ const t = 218 + Math.random()*14; g.fillStyle = `rgb(${t},${t-18},${t-42})`; g.fillRect(i*l, j*l, l, l); }
    g.strokeStyle = '#A99377'; g.lineWidth = 4*T; for(let i=0;i<=n;i++){ g.beginPath(); g.moveTo(i*l,0); g.lineTo(i*l,h); g.moveTo(0,i*l); g.lineTo(w,i*l); g.stroke(); }
  });
  baldosa.repeat.set(anchoS/2, fondoS/2); baldosa.colorSpace = THREE.SRGBColorSpace;
  mesh(new THREE.PlaneGeometry(anchoS, fondoS), new THREE.MeshStandardMaterial({ map:baldosa, roughness:0.5 }), cx, 0, cz, sala).rotation.x = -Math.PI/2;

  // ---- Paredes y techo ----
  const pintura = canvasTex(256*T, 256*T, (g,w,h)=>{ const gr = g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#E8D8BE'); gr.addColorStop(1,'#D6C09E'); g.fillStyle = gr; g.fillRect(0,0,w,h); });
  pintura.colorSpace = THREE.SRGBColorSpace; pintura.wrapS = pintura.wrapT = THREE.ClampToEdgeWrapping;
  const paredM = new THREE.MeshStandardMaterial({ map:pintura, roughness:0.95 });
  const pared = (w, x, z, ry) => { const m = mesh(new THREE.PlaneGeometry(w, alto), paredM, x, alto/2, z, sala); m.rotation.y = ry; };
  pared(anchoS, cx, z0, 0); pared(anchoS, cx, z1, Math.PI); pared(fondoS, x0, cz, Math.PI/2); pared(fondoS, x1, cz, -Math.PI/2);
  mesh(new THREE.PlaneGeometry(anchoS, fondoS), new THREE.MeshStandardMaterial({ color:0xF4EEE4, roughness:1 }), cx, alto, cz, sala).rotation.x = Math.PI/2;
  // Zócalo de madera alrededor
  const zocaloM = new THREE.MeshStandardMaterial({ color:0x9A6A44, roughness:0.6 });
  [[anchoS,0.04,cx,z0+0.02],[anchoS,0.04,cx,z1-0.02],[0.04,fondoS,x0+0.02,cz],[0.04,fondoS,x1-0.02,cz]].forEach(([w,d,x,z]) => mesh(new THREE.BoxGeometry(w,0.12,d), zocaloM, x, 0.06, z, sala));

  // ---- Lámpara de techo ----
  mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.06, 40), basicGlow(0xFFF1D8, 1.6), 0, alto - 0.03, -0.5, sala);
  const luzTecho = new THREE.PointLight(0xFFE8C8, 9, 12, 1.5); luzTecho.position.set(0, alto - 0.3, -0.5); sala.add(luzTecho);

  // ---- Mesa de madera con la pantalla encima ----
  const madera = canvasTex(512*T, 256*T, (g,w,h)=>{
    g.fillStyle = '#C98A4E'; g.fillRect(0,0,w,h);
    for(let i=0;i<160;i++){ g.fillStyle = `rgba(${Math.random()>.5?120:230},${Math.random()>.5?70:160},40,${Math.random()*.15})`; g.fillRect(0, Math.random()*h, w, 1 + Math.random()*3); }
  });
  madera.colorSpace = THREE.SRGBColorSpace;
  const maderaM = new THREE.MeshStandardMaterial({ map:madera, roughness:0.55 });
  const pataM = new THREE.MeshStandardMaterial({ color:0x6B4A30, roughness:0.6 });
  const mesa = new THREE.Group(); mesa.position.set(MESA.x, 0, MESA.z); sala.add(mesa);
  mesh(new THREE.BoxGeometry(MESA.ancho, 0.05, MESA.fondo), maderaM, 0, MESA.alto - 0.025, 0, mesa);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz]) => mesh(new THREE.BoxGeometry(0.06, MESA.alto - 0.05, 0.06), pataM, sx*(MESA.ancho/2 - 0.08), (MESA.alto - 0.05)/2, sz*(MESA.fondo/2 - 0.08), mesa));
  caja(MESA.x, MESA.z, MESA.ancho, MESA.fondo);

  // ---- Silla del paciente (frente a la pantalla) ----
  const silla = new THREE.Group(); silla.position.set(0, 0, -0.75); sala.add(silla);
  const tapiz = new THREE.MeshStandardMaterial({ color:0x4F6E8E, roughness:0.9 });
  mesh(new THREE.BoxGeometry(0.5, 0.08, 0.48), tapiz, 0, 0.46, 0, silla);
  mesh(new THREE.BoxGeometry(0.5, 0.5, 0.06), tapiz, 0, 0.75, 0.24, silla).rotation.x = -0.1;
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz]) => mesh(new THREE.CylinderGeometry(0.02,0.02,0.44,10), pataM, sx*0.21, 0.22, sz*0.2, silla));
  caja(0, -0.75, 0.55, 0.55);

  // ---- Ventana en la pared izquierda (luz de día) ----
  const cielo = canvasTex(256, 256, (g,w,h)=>{ const gr = g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#7FB2E5'); gr.addColorStop(1,'#D9EEFA'); g.fillStyle = gr; g.fillRect(0,0,w,h);
    g.fillStyle = 'rgba(255,255,255,.8)'; [[70,80,30],[100,70,40],[135,82,28]].forEach(([x,y,r]) => { g.beginPath(); g.arc(x,y,r,0,7); g.fill(); }); });
  cielo.colorSpace = THREE.SRGBColorSpace; cielo.wrapS = cielo.wrapT = THREE.ClampToEdgeWrapping;
  const ventana = new THREE.Group(); ventana.position.set(x0 + 0.01, 1.55, 0.6); ventana.rotation.y = Math.PI/2; sala.add(ventana);
  mesh(new THREE.PlaneGeometry(1.6, 1.1), new THREE.MeshBasicMaterial({ map:cielo, toneMapped:false }), 0, 0, 0, ventana);
  const blanco = new THREE.MeshStandardMaterial({ color:0xF7F3EC, roughness:0.6 });
  [[1.75,0.08,0,0.59],[1.75,0.08,0,-0.59],[0.08,1.25,-0.84,0],[0.08,1.25,0.84,0],[0.05,1.1,0,0]].forEach(([w,h,x,y]) => mesh(new THREE.BoxGeometry(w,h,0.06), blanco, x, y, 0.03, ventana));
  const sol = new THREE.DirectionalLight(0xFFF6E8, 1.1); sol.position.set(x0 - 2, 3, 0.6); sol.target.position.set(1, 0, 0); sala.add(sol, sol.target);

  // ---- Puerta en la pared del fondo (detrás del paciente) ----
  const puerta = new THREE.Group(); puerta.position.set(1.6, 0, z1 - 0.01); puerta.rotation.y = Math.PI; sala.add(puerta);
  mesh(new THREE.BoxGeometry(0.95, 2.1, 0.04), new THREE.MeshStandardMaterial({ color:0xB07A4C, roughness:0.6 }), 0, 1.05, 0, puerta);
  [[1.07,0.07,0,2.13],[0.07,2.15,-0.51,1.07],[0.07,2.15,0.51,1.07]].forEach(([w,h,x,y]) => mesh(new THREE.BoxGeometry(w,h,0.06), blanco, x, y, 0.01, puerta));
  mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshStandardMaterial({ color:0xD9C27A, metalness:0.9, roughness:0.3 }), 0.36, 1.0, 0.05, puerta);

  // ---- Estantería con libros en la pared derecha ----
  const est = new THREE.Group(); est.position.set(x1 - 0.18, 0, 1.2); sala.add(est);
  const estM = new THREE.MeshStandardMaterial({ color:0xA8744A, roughness:0.6 });
  mesh(new THREE.BoxGeometry(0.34, 1.8, 0.04), estM, 0, 0.9, -0.5, est); mesh(new THREE.BoxGeometry(0.34, 1.8, 0.04), estM, 0, 0.9, 0.5, est);
  const colores = [0xD9643C, 0x2BA3B0, 0xE8B04B, 0x4F6E8E, 0x8E5A9E, 0x6F8A5A];
  [0.05, 0.6, 1.15, 1.75].forEach((y, k) => {
    mesh(new THREE.BoxGeometry(0.34, 0.04, 1.04), estM, 0, y, 0, est);
    if(k === 3) return;
    let z = -0.45;
    while(z < 0.42){ const a = 0.04 + Math.random()*0.04, h = 0.3 + Math.random()*0.15;
      mesh(new THREE.BoxGeometry(0.24, h, a), new THREE.MeshStandardMaterial({ color:colores[(Math.random()*colores.length)|0], roughness:0.8 }), 0, y + 0.02 + h/2, z + a/2, est); z += a + 0.008; }
  });
  caja(x1 - 0.18, 1.2, 0.36, 1.08);

  // ---- Planta en la esquina ----
  const planta = new THREE.Group(); planta.position.set(x1 - 0.45, 0, z0 + 0.45); sala.add(planta);
  mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.4, 24), new THREE.MeshStandardMaterial({ color:0xC6704E, roughness:0.8 }), 0, 0.2, 0, planta);
  const hoja = new THREE.MeshStandardMaterial({ color:0x4E7A4A, roughness:0.7, side:THREE.DoubleSide });
  for(let i=0;i<11;i++){ const a = i/11*Math.PI*2, h = mesh(new THREE.SphereGeometry(0.15, 10, 6), hoja, Math.cos(a)*0.16, 0.6 + Math.random()*0.5, Math.sin(a)*0.16, planta); h.scale.set(0.45, 1.5, 0.12); h.rotation.set(Math.sin(a)*0.5, -a, Math.cos(a)*0.5); }
  caja(x1 - 0.45, z0 + 0.45, 0.5, 0.5);

  // ---- Cuadro con el nombre del proyecto ----
  const cartel = canvasTex(512, 256, (g,w,h)=>{ g.fillStyle = '#1C2033'; g.fillRect(0,0,w,h); g.fillStyle = '#5FF2D2'; g.font = '700 54px Sora, system-ui, sans-serif'; g.textAlign = 'center'; g.fillText('RehabilitaciónVR', w/2, h/2 + 8); g.fillStyle = '#B9C0DA'; g.font = '400 26px Sora, system-ui, sans-serif'; g.fillText('Rehabilitar jugando', w/2, h/2 + 52); });
  cartel.colorSpace = THREE.SRGBColorSpace; cartel.wrapS = cartel.wrapT = THREE.ClampToEdgeWrapping;
  mesh(new THREE.BoxGeometry(1.3, 0.68, 0.04), new THREE.MeshStandardMaterial({ color:0x6B4A30 }), -1.6, 1.75, z0 + 0.02, sala);
  mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshBasicMaterial({ map:cartel, toneMapped:false }), -1.6, 1.75, z0 + 0.045, sala);

  return { sala, obstaculos, silla };
}
