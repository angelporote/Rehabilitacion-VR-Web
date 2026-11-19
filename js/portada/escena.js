/* =========================================================
   escena.js · Escena 3D de la portada: cámara, fondo, luces y ambiente
   ========================================================= */
import * as THREE from 'three';
import { gamaBaja } from '../nucleo/util.js';

export function crearEscena(entorno){
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x15103D, 16, 36);
  scene.environment = entorno;

  const camera = new THREE.PerspectiveCamera(35, innerWidth/innerHeight, 0.05, 100);
  camera.position.set(0, 0.3, 14);
  camera.lookAt(0, 0, 0);

  // Fondo: degradado pintado en un canvas (así el bloom trabaja sobre un fondo real)
  const bg = document.createElement('canvas'); bg.width = 1024; bg.height = 640;
  { const g = bg.getContext('2d'); const gr = g.createRadialGradient(665,256,0,665,256,720);
    gr.addColorStop(0,'#2B1F66'); gr.addColorStop(.42,'#15103D'); gr.addColorStop(1,'#0B0A22'); g.fillStyle = gr; g.fillRect(0,0,1024,640); }
  const bgTex = new THREE.CanvasTexture(bg); bgTex.colorSpace = THREE.SRGBColorSpace; scene.background = bgTex;

  // Luces: principal blanca y dos de contorno (violeta y turquesa), como en Dentro del implante
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 6, 8); scene.add(key);
  const rimV = new THREE.PointLight(0x8B6CFF, 60, 30); rimV.position.set(-6, 3, -4); scene.add(rimV);
  const rimT = new THREE.PointLight(0x5FF2D2, 40, 30); rimT.position.set(6, -5, -3); scene.add(rimT);
  scene.add(new THREE.AmbientLight(0x6E5FD0, 0.35));

  // Ambiente: partículas de polvo luminoso que derivan muy despacio
  const N = gamaBaja ? 400 : 900, pos = new Float32Array(N*3);
  for(let i=0;i<N;i++){ pos[i*3]=(Math.random()-.5)*34; pos[i*3+1]=(Math.random()-.5)*20; pos[i*3+2]=-Math.random()*18+2; }
  const polvo = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos,3)),
    new THREE.PointsMaterial({ color:0xBFB4FF, size:0.035, transparent:true, opacity:0.55, depthWrite:false }));
  scene.add(polvo);

  function animarAmbiente(t){ polvo.rotation.y = t*0.01; polvo.position.y = Math.sin(t*0.1)*0.2; }

  return { scene, camera, animarAmbiente };
}
