/* =========================================================
   main.js · Arranque de la portada
   motor → escena → escaparate (objetos) → bucle de dibujo
   y qué pasa al activar un objeto: entrar en él o abrir su ficha.
   ========================================================= */
import * as THREE from 'three';
import { crearMotor } from '../nucleo/motor.js';
import { gsap, reduceMotion, D } from '../nucleo/util.js';
import { cargarJSON, esc } from '../nucleo/datos.js';
import { crearEscena } from './escena.js';
import { crearEscaparate } from './escaparate.js';

const lienzo = document.getElementById('scene');
const motor = crearMotor(lienzo);
const { scene, camera, animarAmbiente } = crearEscena(motor.entorno);
const CAMARA_INICIO = camera.position.clone();

const hero = document.getElementById('hero');
const card = document.getElementById('card');
const cardBody = document.getElementById('cardBody');
const flash = document.getElementById('flash');
const flashText = document.getElementById('flashText');

let escaparate;

/* ---------- Activar un objeto ---------- */
function alActivar(obj){
  const d = obj.datos;
  if(d.accion === 'entrar') entrar(obj);
  else abrirFicha(obj);
}

// Viaje "dentro" del objeto (las gafas): la cámara se mete por las lentes y se abre su página
function entrar(obj){
  escaparate.bloquear(true);
  cerrarFicha();
  const destino = new URL(obj.datos.destino, location.href).href;
  if(reduceMotion){ location.href = destino; return; }
  const p = obj.modelo.userData.entrada ? obj.modelo.userData.entrada.getWorldPosition(new THREE.Vector3()) : obj.raiz.position.clone();
  // Primero ponemos las gafas de frente, luego la cámara avanza hasta las lentes
  obj.rot.x = 0; obj.rot.y = Math.round(obj.rot.y / (Math.PI*2)) * Math.PI*2;
  flashText.textContent = `Entrando en ${obj.datos.titulo}…`;
  const mirar = { x:0, y:0, z:0 };
  const tl = gsap.timeline({ onComplete:() => { location.href = destino; } });
  tl.to(hero, { autoAlpha:0, y:20, duration:0.4 }, 0)
    .to('#labels', { autoAlpha:0, duration:0.3 }, 0)
    .to(mirar, { x:p.x, y:p.y, z:p.z, duration:1.2, ease:'power2.inOut', onUpdate:() => camera.lookAt(mirar.x, mirar.y, mirar.z) }, 0.2)
    .to(camera.position, { x:p.x, y:p.y, z:p.z + 0.25, duration:1.6, ease:'power3.in' }, 0.5)
    .to(flash, { autoAlpha:1, duration:0.45, ease:'power1.in' }, 1.75)
    .to(flashText, { autoAlpha:1, duration:0.3 }, 1.95)
    .to({}, { duration:0.35 });
}

// Ficha: tarjeta con el resumen del proyecto y un enlace
function abrirFicha(obj){
  const d = obj.datos, f = d.ficha || {};
  const externo = /^https?:/.test(d.destino);
  card.style.setProperty('--c', d.color || 'var(--bio)');
  cardBody.innerHTML = `
    ${f.familia ? `<span class="fam">${esc(f.familia)}</span>` : ''}
    <h2>${esc(d.titulo)}</h2>
    <p class="mat">${esc(d.etiqueta)}</p>
    <p>${esc(f.texto)}</p>
    <a class="cta" href="${esc(d.destino)}" ${externo ? 'target="_blank" rel="noopener"' : ''}>${esc(f.boton || 'Abrir')}
      <i><svg viewBox="0 0 16 16" fill="none" stroke="#F1EEFF" stroke-width="2"><path d="M3 8h10M9 4l4 4-4 4"/></svg></i></a>`;
  card.classList.add('open');
  card.querySelector('a').focus({ preventScroll:true });
}
function cerrarFicha(){ card.classList.remove('open'); }
document.getElementById('close').addEventListener('click', cerrarFicha);
addEventListener('keydown', e => { if(e.key === 'Escape') cerrarFicha(); });

/* ---------- Tamaño de pantalla ---------- */
function redimensionar(){
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  motor.redimensionar(innerWidth, innerHeight);
  escaparate && escaparate.colocar();
}
addEventListener('resize', redimensionar);
redimensionar();

// Al volver con el botón "atrás" el navegador puede restaurar la página tal cual: la dejamos como al principio
addEventListener('pageshow', e => {
  if(!e.persisted || !escaparate) return;
  camera.position.copy(CAMARA_INICIO); camera.lookAt(0, 0, 0);
  gsap.set([hero, '#labels'], { autoAlpha:1, y:0 }); gsap.set([flash, flashText], { autoAlpha:0 });
  escaparate.bloquear(false);
});

/* ---------- Arranque ---------- */
const reloj = new THREE.Clock();
function bucle(){
  const dt = Math.min(reloj.getDelta(), 0.1), t = reloj.elapsedTime;
  animarAmbiente(t);
  escaparate && escaparate.animar(t, dt);
  motor.dibujar(scene, camera);
  motor.vigilarRendimiento(dt);
}

(async () => {
  try{
    const datos = await cargarJSON('datos/escaparate.json');
    escaparate = await crearEscaparate({ scene, camera, lienzo, datos, alActivar });
    camera.lookAt(0, 0, 0);
    motor.renderer.setAnimationLoop(bucle);
    document.getElementById('loader').classList.add('done');
    gsap.from(hero, { autoAlpha:0, y:24, duration:D(0.9), ease:'power3.out' });
    gsap.from('#labels', { autoAlpha:0, duration:D(0.8), delay:D(0.4) });
    // Texturas costosas, cuando la página ya se ve
    requestAnimationFrame(() => setTimeout(() => escaparate.detalles(), 60));
  }catch(err){
    console.error(err);
    document.getElementById('loader').textContent = 'No se pudo cargar la escena. Si abriste el archivo directamente, sírvelo con «python3 -m http.server».';
  }
})();
