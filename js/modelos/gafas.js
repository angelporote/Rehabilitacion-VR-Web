/* =========================================================
   gafas.js · Gafas de realidad virtual modeladas por código
   Visor con frontal brillante, cámaras de seguimiento, almohadilla facial,
   lentes y cinta trasera con su contrapeso (como unas gafas autónomas).
   El frontal mira hacia +Z.
   ========================================================= */
import * as THREE from 'three';
import { rrect, mesh, basicGlow } from '../nucleo/util.js';

export function crear(){
  const grupo = new THREE.Group();

  // ---- Materiales ----
  const carcasa = new THREE.MeshPhysicalMaterial({ color:0xEDEBF5, metalness:0.05, roughness:0.38, clearcoat:0.6, clearcoatRoughness:0.25 });
  const frontal = new THREE.MeshPhysicalMaterial({ color:0x0E0C24, metalness:0.3, roughness:0.08, clearcoat:1, clearcoatRoughness:0.02 });
  const espuma  = new THREE.MeshStandardMaterial({ color:0x2A2547, roughness:0.95 });
  const cinta   = new THREE.MeshStandardMaterial({ color:0x3A3366, roughness:0.75 });
  const lenteM  = new THREE.MeshPhysicalMaterial({ color:0x0B1A2A, metalness:0, roughness:0.02, clearcoat:1, ior:1.5 });
  const camaraM = new THREE.MeshPhysicalMaterial({ color:0x05050C, metalness:0.2, roughness:0.05, clearcoat:1 });
  const brillo  = basicGlow(0x5FF2D2, 2.4);

  // ---- Visor: un rectángulo redondeado extruido con bisel ----
  const W = 3.4, H = 1.9;
  const cuerpo = mesh(new THREE.ExtrudeGeometry(rrect(W, H, 0.62), { depth:1.0, bevelEnabled:true, bevelThickness:0.2, bevelSize:0.18, bevelSegments:8, curveSegments:24 }), carcasa, 0, 0, -0.5, grupo);

  // Frontal negro brillante, un poco más pequeño y por delante
  mesh(new THREE.ExtrudeGeometry(rrect(W-0.22, H-0.2, 0.52), { depth:0.08, bevelEnabled:true, bevelThickness:0.06, bevelSize:0.06, bevelSegments:6, curveSegments:24 }), frontal, 0, 0, 0.66, grupo);

  // Cámaras de seguimiento: cuatro "ojos" en las esquinas del frontal
  const camGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.06, 32);
  const aroGeo = new THREE.TorusGeometry(0.15, 0.025, 12, 40);
  const aroM = new THREE.MeshStandardMaterial({ color:0x555070, metalness:0.9, roughness:0.3 });
  [[-1.25,0.55],[1.25,0.55],[-1.25,-0.55],[1.25,-0.55]].forEach(([x,y])=>{
    const c = mesh(camGeo, camaraM, x, y, 0.86, grupo); c.rotation.x = Math.PI/2;
    mesh(aroGeo, aroM, x, y, 0.87, grupo);
  });

  // Franja luminosa: el "estado encendido" del visor (brilla con el bloom)
  const franja = mesh(new THREE.CapsuleGeometry(0.035, 1.3, 6, 16), brillo, 0, -0.62, 0.86, grupo);
  franja.rotation.z = Math.PI/2;

  // ---- Almohadilla facial (detrás del visor) con hueco para la nariz ----
  const cara = rrect(W-0.3, H-0.25, 0.55);
  const nariz = new THREE.Path(); nariz.absarc(0, -H/2+0.05, 0.42, 0, Math.PI, false); cara.holes.push(nariz);
  mesh(new THREE.ExtrudeGeometry(cara, { depth:0.35, bevelEnabled:true, bevelThickness:0.1, bevelSize:0.08, bevelSegments:6, curveSegments:20 }), espuma, 0, 0, -1.0, grupo);

  // Lentes: dos discos oscuros con un aro, visibles desde detrás
  [-0.72, 0.72].forEach(x=>{
    const l = mesh(new THREE.CircleGeometry(0.42, 48), lenteM, x, 0.08, -1.12, grupo); l.rotation.y = Math.PI;
    const a = mesh(new THREE.TorusGeometry(0.44, 0.04, 12, 48), aroM, x, 0.08, -1.11, grupo);
  });

  // ---- Cinta: un arco que rodea la cabeza y un contrapeso (batería) detrás ----
  const R = 1.95;
  const arco = mesh(new THREE.TorusGeometry(R, 0.16, 16, 96, Math.PI), cinta, 0, 0.05, -1.1, grupo);
  arco.rotation.x = -Math.PI/2;                        // el arco queda horizontal, por detrás del visor
  arco.scale.set(0.98, 1.35, 1);                        // un poco más profundo que ancho
  // Uniones laterales entre visor y cinta
  [-1, 1].forEach(s=>{ const u = mesh(new THREE.BoxGeometry(0.22, 0.42, 0.9), carcasa, s*1.88, 0.05, -0.85, grupo); u.rotation.y = s*0.08; });
  // Contrapeso trasero
  const bat = mesh(new THREE.ExtrudeGeometry(rrect(1.3, 0.9, 0.3), { depth:0.35, bevelEnabled:true, bevelThickness:0.1, bevelSize:0.08, bevelSegments:5 }), carcasa, 0, 0.05, -1.1 - R*1.35 - 0.2, grupo);
  const batLuz = mesh(new THREE.CapsuleGeometry(0.025, 0.4, 4, 12), brillo, 0, 0.05, -1.1 - R*1.35 - 0.24, grupo); batLuz.rotation.z = Math.PI/2;
  // Lo que queda detrás de la cabeza: en la cinemática de ponérselas se aparta para ver las lentes
  grupo.userData.trasera = [bat, batLuz, arco];

  // Todo proyecta y recibe sombra suave del entorno
  grupo.traverse(o => { if(o.isMesh) o.userData.esGafas = true; });

  // Punto "dentro de las lentes": hacia dónde viaja la cámara al entrar en el proyecto
  const entrada = new THREE.Object3D(); entrada.position.set(0, 0.05, 0.2); grupo.add(entrada);
  grupo.userData.entrada = entrada;

  return { grupo };
}
