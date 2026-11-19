/* =========================================================
   sala.js · El salón de casa que rodea a las gafas
   Todo hecho con código: suelo de madera, paredes, ventana al atardecer,
   sofá, alfombra, lámpara de pie, planta, cuadros y una mesita bajo cada objeto.
   Medidas en "metros de escena": suelo en y = SUELO, pared del fondo en z = FONDO.
   ========================================================= */
import * as THREE from 'three';
import { gamaBaja, rrect, mesh, canvasTex, basicGlow } from '../nucleo/util.js';

export const SUELO = -3.4, FONDO = -9;

const madera = new THREE.MeshStandardMaterial({ color:0x8A5A3B, roughness:0.55 });
const maderaClara = new THREE.MeshStandardMaterial({ color:0xB98A5E, roughness:0.5 });
const blanco = new THREE.MeshStandardMaterial({ color:0xF3ECE2, roughness:0.6 });

// Caja con esquinas redondeadas (para muebles blanditos)
function cojin(w, h, d, r, mat){
  const g = new THREE.ExtrudeGeometry(rrect(w, h, Math.min(r, w/2-0.01, h/2-0.01)), { depth:d - r*2, bevelEnabled:true, bevelThickness:r, bevelSize:r*0.9, bevelSegments:5, curveSegments:10 });
  g.translate(0, 0, -(d - r*2)/2);
  return new THREE.Mesh(g, mat);
}

export function crearSala(scene){
  const T = gamaBaja ? 0.5 : 1;
  const sala = new THREE.Group(); scene.add(sala);

  // ---- Suelo de tarima ----
  const tarima = canvasTex(1024*T, 1024*T, (g,w,h)=>{
    const filas = 8, alto = h/filas;
    for(let f=0; f<filas; f++){
      let x = -Math.random()*w*0.5;
      while(x < w){
        const largo = w*(0.35 + Math.random()*0.4), tono = 120 + Math.random()*30;
        g.fillStyle = `rgb(${tono+40},${tono-5},${tono-45})`; g.fillRect(x, f*alto, largo, alto);
        for(let i=0;i<40;i++){ g.fillStyle = `rgba(70,40,20,${Math.random()*0.12})`; g.fillRect(x, f*alto + Math.random()*alto, largo, 1+Math.random()*2); }   // vetas
        g.fillStyle = 'rgba(40,22,10,.55)'; g.fillRect(x, f*alto, 2, alto);                                                                         // junta
        x += largo;
      }
      g.fillStyle = 'rgba(40,22,10,.6)'; g.fillRect(0, f*alto, w, 2);
    }
  });
  tarima.repeat.set(5, 5); tarima.colorSpace = THREE.SRGBColorSpace;
  const suelo = mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshStandardMaterial({ map:tarima, roughness:0.45, metalness:0 }), 0, SUELO, 6, sala);
  suelo.rotation.x = -Math.PI/2;

  // ---- Paredes: crema cálido con un zócalo blanco ----
  const pintura = canvasTex(512*T, 512*T, (g,w,h)=>{
    g.fillStyle = '#D8C3A8'; g.fillRect(0,0,w,h);
    for(let i=0;i<6000*T;i++){ g.fillStyle = `rgba(${Math.random()>.5?255:150},${Math.random()>.5?240:120},200,.05)`; g.fillRect(Math.random()*w, Math.random()*h, 2, 2); }
  });
  pintura.repeat.set(6, 2); pintura.colorSpace = THREE.SRGBColorSpace;
  const paredM = new THREE.MeshStandardMaterial({ map:pintura, roughness:0.95 });
  mesh(new THREE.PlaneGeometry(60, 20), paredM, 0, SUELO + 10, FONDO, sala);
  const lateral = mesh(new THREE.PlaneGeometry(30, 20), paredM, -16, SUELO + 10, FONDO + 15, sala); lateral.rotation.y = Math.PI/2;
  mesh(new THREE.BoxGeometry(60, 0.45, 0.12), blanco, 0, SUELO + 0.22, FONDO + 0.06, sala);   // zócalo

  // ---- Ventana al atardecer (detrás de las gafas) ----
  const ventana = new THREE.Group(); ventana.position.set(5.5, SUELO + 6.3, FONDO + 0.05); sala.add(ventana);
  const cielo = canvasTex(256, 384, (g,w,h)=>{
    const gr = g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#6E7FB8'); gr.addColorStop(.45,'#E9A27A'); gr.addColorStop(.8,'#FFD3A0'); gr.addColorStop(1,'#FFE6C2');
    g.fillStyle = gr; g.fillRect(0,0,w,h);
    g.fillStyle = 'rgba(60,50,70,.55)';                              // siluetas de tejados a lo lejos
    for(let x=0; x<w; x+=28){ const t = 20 + Math.random()*40; g.fillRect(x, h-t, 26, t); }
  });
  cielo.colorSpace = THREE.SRGBColorSpace; cielo.wrapS = cielo.wrapT = THREE.ClampToEdgeWrapping;
  mesh(new THREE.PlaneGeometry(4.4, 5.6), new THREE.MeshBasicMaterial({ map:cielo, color:new THREE.Color(1.15,1.1,1.05), toneMapped:false }), 0, 0, 0, ventana);
  const marco = (w,h,x,y) => mesh(new THREE.BoxGeometry(w,h,0.25), blanco, x, y, 0.1, ventana);
  marco(4.8,0.25,0,2.9); marco(4.8,0.25,0,-2.9); marco(0.25,6,-2.3,0); marco(0.25,6,2.3,0);    // marco
  marco(0.12,5.6,0,0); marco(4.4,0.12,0,0.6);                                                     // cruceta
  mesh(new THREE.BoxGeometry(5.4,0.18,0.7), blanco, 0, -3.05, 0.3, ventana);                    // alféizar
  // Cortinas: telas con pliegues (ondas en la geometría)
  const tela = new THREE.MeshStandardMaterial({ color:0xC98B6B, roughness:0.9, side:THREE.DoubleSide });
  [-1, 1].forEach(s=>{
    const geo = new THREE.PlaneGeometry(1.6, 7, 24, 1);
    const p = geo.attributes.position;
    for(let i=0;i<p.count;i++) p.setZ(i, Math.sin(p.getX(i)*9)*0.12);
    geo.computeVertexNormals();
    mesh(geo, tela, s*3.2, -0.2, 0.35, ventana);
  });
  mesh(new THREE.CylinderGeometry(0.05,0.05,8.2,12), maderaClara, 0, 3.4, 0.4, ventana).rotation.z = Math.PI/2;   // barra

  // Luz que entra por la ventana: cálida, desde detrás
  const sol = new THREE.DirectionalLight(0xFFC38A, 1.1); sol.position.set(6, 6, FONDO + 1); sol.target.position.set(2, SUELO, 4); sala.add(sol, sol.target);

  // ---- Sofá contra la pared, a la izquierda ----
  const sofa = new THREE.Group(); sofa.position.set(-6.5, SUELO, FONDO + 1.6); sala.add(sofa);
  const tapiz = new THREE.MeshStandardMaterial({ color:0x6F8A78, roughness:0.95 });
  const asiento = cojin(6.4, 1.0, 2.2, 0.25, tapiz); asiento.position.set(0, 1.2, 0.2); sofa.add(asiento);
  const respaldo = cojin(6.4, 1.9, 0.7, 0.3, tapiz); respaldo.position.set(0, 2.2, -0.85); sofa.add(respaldo);
  [-1,1].forEach(s=>{ const b = cojin(0.7, 1.6, 2.3, 0.28, tapiz); b.position.set(s*3.35, 1.55, 0.1); sofa.add(b); });
  [-1.5, 1.5].forEach((x,i)=>{ const c = cojin(1.3, 1.1, 0.35, 0.15, new THREE.MeshStandardMaterial({ color:i ? 0xE7B25B : 0xD98A6C, roughness:0.9 })); c.position.set(x, 2.25, -0.35); c.rotation.set(-0.15, 0, i ? 0.08 : -0.08); sofa.add(c); });
  [[-3,-0.8],[3,-0.8],[-3,1.1],[3,1.1]].forEach(([x,z]) => mesh(new THREE.CylinderGeometry(0.08,0.06,0.5,10), madera, x, 0.25, z, sofa));

  // ---- Lámpara de pie junto al sofá (luz cálida) ----
  const lampara = new THREE.Group(); lampara.position.set(-10.2, SUELO, FONDO + 2.4); sala.add(lampara);
  mesh(new THREE.CylinderGeometry(0.6,0.7,0.12,32), madera, 0, 0.06, 0, lampara);
  mesh(new THREE.CylinderGeometry(0.05,0.05,6,12), madera, 0, 3, 0, lampara);
  mesh(new THREE.CylinderGeometry(0.7,1.1,1.3,40,1,true), new THREE.MeshStandardMaterial({ color:0xFFE9C8, emissive:0xFFB86B, emissiveIntensity:0.9, side:THREE.DoubleSide, roughness:1 }), 0, 6.2, 0, lampara);
  mesh(new THREE.SphereGeometry(0.25, 16, 12), basicGlow(0xFFD9A0, 2.2), 0, 5.9, 0, lampara);
  const bombilla = new THREE.PointLight(0xFFB870, 35, 22, 1.6); bombilla.position.set(0, 5.6, 0.6); lampara.add(bombilla);

  // ---- Planta en maceta, a la derecha ----
  const planta = new THREE.Group(); planta.position.set(11, SUELO, FONDO + 2.5); sala.add(planta);
  mesh(new THREE.CylinderGeometry(0.9,0.7,1.6,32), new THREE.MeshStandardMaterial({ color:0xC6704E, roughness:0.8 }), 0, 0.8, 0, planta);
  const hoja = new THREE.MeshStandardMaterial({ color:0x4E7A4A, roughness:0.7, side:THREE.DoubleSide });
  for(let i=0;i<14;i++){
    const h = mesh(new THREE.SphereGeometry(0.5, 12, 8), hoja, 0, 0, 0, planta);
    const a = i/14*Math.PI*2, alto = 2.2 + Math.random()*2.2, r = 0.4 + Math.random()*0.9;
    h.scale.set(0.45, 1.5, 0.12); h.position.set(Math.cos(a)*r, alto, Math.sin(a)*r);
    h.rotation.set(Math.sin(a)*0.5, -a, Math.cos(a)*0.6);
  }

  // ---- Cuadros en la pared ----
  const cuadro = (x, y, w, h, colores) => {
    const lam = canvasTex(256, Math.round(256*h/w), (g,W,H)=>{ g.fillStyle = colores[0]; g.fillRect(0,0,W,H);
      colores.slice(1).forEach((c,i)=>{ g.fillStyle = c; g.beginPath(); g.arc(W*(.3+i*.25), H*(.4+(i%2)*.25), W*(.18+i*.04), 0, 7); g.fill(); }); });
    lam.colorSpace = THREE.SRGBColorSpace; lam.wrapS = lam.wrapT = THREE.ClampToEdgeWrapping;
    mesh(new THREE.BoxGeometry(w+0.3, h+0.3, 0.12), madera, x, y, FONDO + 0.06, sala);
    mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map:lam, roughness:0.8 }), x, y, FONDO + 0.13, sala);
  };
  cuadro(-8.2, SUELO + 7.6, 2.2, 1.6, ['#F2E3CF','#D98A6C','#6F8A78','#E7B25B']);
  cuadro(-4.8, SUELO + 7.9, 1.6, 2.1, ['#2F3A4A','#E7B25B','#C98B6B']);

  // ---- Alfombra ----
  const dibujoAlfombra = canvasTex(512, 512, (g,w,h)=>{
    g.fillStyle = '#E9DCC8'; g.fillRect(0,0,w,h);
    g.strokeStyle = '#C98B6B'; g.lineWidth = 18; g.strokeRect(30,30,w-60,h-60);
    g.strokeStyle = '#6F8A78'; g.lineWidth = 6; g.strokeRect(70,70,w-140,h-140);
    for(let i=0;i<9000;i++){ g.fillStyle = `rgba(120,90,60,${Math.random()*.06})`; g.fillRect(Math.random()*w, Math.random()*h, 2, 2); }
  });
  dibujoAlfombra.colorSpace = THREE.SRGBColorSpace; dibujoAlfombra.wrapS = dibujoAlfombra.wrapT = THREE.ClampToEdgeWrapping;
  const alfombra = mesh(new THREE.PlaneGeometry(14, 9), new THREE.MeshStandardMaterial({ map:dibujoAlfombra, roughness:1 }), 1.5, SUELO + 0.02, 0, sala);
  alfombra.rotation.x = -Math.PI/2;

  // ---- Mesitas: una bajo cada objeto del escaparate ----
  const mesitas = [];
  function colocarMesitas(objetos){
    while(mesitas.length < objetos.length){
      const m = new THREE.Group();
      mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.16, 48), maderaClara, 0, 2.2, 0, m);
      mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.1, 16), madera, 0, 1.1, 0, m);
      mesh(new THREE.CylinderGeometry(0.9, 1.0, 0.1, 40), madera, 0, 0.05, 0, m);
      // Sombra suave de las gafas sobre la mesa (un disco oscuro difuminado)
      const sombra = canvasTex(128, 128, (g,w,h)=>{ const gr = g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2); gr.addColorStop(0,'rgba(0,0,0,.45)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0,0,w,h); });
      const s = mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map:sombra, transparent:true, depthWrite:false }), 0, 2.29, 0, m);
      s.rotation.x = -Math.PI/2;
      sala.add(m); mesitas.push(m);
    }
    mesitas.forEach((m, i) => {
      const o = objetos[i];
      m.visible = !!o;
      if(!o) return;
      m.position.set(o.raiz.position.x, SUELO, o.raiz.position.z);
      // La mesa llega hasta un poco por debajo del objeto
      const hueco = (o.raiz.position.y - o.radioPantalla*0.72) - SUELO;
      m.scale.set(1, Math.max(0.3, hueco / 2.3), 1);
    });
  }

  return { colocarMesitas };
}
