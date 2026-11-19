/* =========================================================
   motor.js · El "motor" gráfico: renderizador WebGL, entorno de luz y posprocesado (bloom)
   ========================================================= */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { gamaBaja } from './util.js?v=202611192241';

export function crearMotor(lienzo){
  const renderer = new THREE.WebGLRenderer({ canvas:lienzo, antialias:!gamaBaja, alpha:false, powerPreference:'high-performance' });
  let pixelRatio = Math.min(devicePixelRatio, gamaBaja ? 1 : 1.5);
  renderer.setPixelRatio(pixelRatio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;    // tonos más "cinematográficos"
  renderer.toneMappingExposure = 1.05;

  // Entorno de "estudio fotográfico": reflejos realistas en metales y plásticos (se calcula una vez)
  const entorno = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;

  // Bloom: lo más luminoso irradia un halo. Se desactiva en gama baja o si los FPS caen
  let usarBloom = !gamaBaja;
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.35, 0.6, 0.85);
  composer.addPass(renderPass); composer.addPass(bloom); composer.addPass(new OutputPass());

  function redimensionar(w, h){ renderer.setSize(w, h, false); if(usarBloom) composer.setSize(w, h); }

  // Ajuste automático: si baja de ~50 fps quita el bloom; si sigue lento, baja la resolución
  let nivelAhorro = gamaBaja ? 2 : 0, muestras = 0, sumaDt = 0, calentamiento = 60;
  function vigilarRendimiento(dt){
    if(nivelAhorro >= 2 || dt <= 0 || dt > 0.25) return;
    if(calentamiento > 0){ calentamiento--; return; }
    muestras++; sumaDt += dt;
    if(muestras < 35) return;
    const media = sumaDt / muestras; muestras = 0; sumaDt = 0;
    if(nivelAhorro === 0 && media > 0.020){ nivelAhorro = 1; usarBloom = false; }
    else if(nivelAhorro <= 1 && media > 0.024){ nivelAhorro = 2; usarBloom = false; pixelRatio = 1; renderer.setPixelRatio(1); }
    redimensionar(innerWidth, innerHeight);
  }

  function dibujar(escena, camara, { fuerza=0.35, umbral=0.85, radio=0.6 }={}){
    if(!usarBloom){ renderer.render(escena, camara); return; }
    renderPass.scene = escena; renderPass.camera = camara;
    bloom.strength = fuerza; bloom.threshold = umbral; bloom.radius = radio;
    composer.render();
  }

  return { renderer, entorno, dibujar, redimensionar, vigilarRendimiento };
}
