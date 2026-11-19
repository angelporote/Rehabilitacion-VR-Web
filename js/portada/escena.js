/* =========================================================
   escena.js · Escena 3D de la portada: cámara, luces y el salón de casa
   ========================================================= */
import * as THREE from 'three';
import { gamaBaja } from '../nucleo/util.js';
import { crearSala } from './sala.js';

export function crearEscena(entorno){
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2A1D15);
  scene.fog = new THREE.Fog(0x2A1D15, 22, 42);       // niebla cálida: difumina lo más lejano
  scene.environment = entorno;
  scene.environmentIntensity = 0.35;

  const camera = new THREE.PerspectiveCamera(35, innerWidth/innerHeight, 0.05, 100);
  camera.position.set(0, 2.4, 14);
  camera.lookAt(0, 0, 0);

  // Luces de atardecer en casa: ambiente cálido, una principal suave y un contraluz turquesa (el color de las gafas)
  scene.add(new THREE.HemisphereLight(0xFFDDB5, 0x4A2E1E, 0.42));
  const key = new THREE.DirectionalLight(0xFFF1E0, 0.85); key.position.set(4, 6, 8); scene.add(key);
  const rimT = new THREE.PointLight(0x5FF2D2, 18, 14); rimT.position.set(6, -1, -2); scene.add(rimT);

  const sala = crearSala(scene);

  // Motas de polvo flotando en la luz de la ventana
  const N = gamaBaja ? 150 : 350, pos = new Float32Array(N*3);
  for(let i=0;i<N;i++){ pos[i*3]=Math.random()*14-3; pos[i*3+1]=Math.random()*9-3; pos[i*3+2]=-Math.random()*9+1; }
  const polvo = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos,3)),
    new THREE.PointsMaterial({ color:0xFFE0B0, size:0.04, transparent:true, opacity:0.5, depthWrite:false }));
  scene.add(polvo);

  function animarAmbiente(t){ polvo.position.y = Math.sin(t*0.15)*0.25; polvo.position.x = Math.sin(t*0.07)*0.3; }

  return { scene, camera, animarAmbiente, sala };
}
