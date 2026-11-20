/* =========================================================
   main.js · Arranque de la portada
   motor → escena → escaparate (objetos) → bucle de dibujo
   y qué pasa al activar un objeto: entrar en él o abrir su ficha.
   ========================================================= */
import * as THREE from 'three';
import { crearMotor } from '../nucleo/motor.js?v=202611201014';
import { gsap, reduceMotion, D } from '../nucleo/util.js?v=202611201014';
import { cargarJSON, esc } from '../nucleo/datos.js?v=202611201014';
import { crearEscena } from './escena.js?v=202611201014';
import { crearEscaparate } from './escaparate.js?v=202611201014';

const lienzo = document.getElementById('scene');
const motor = crearMotor(lienzo);
const { scene, camera, animarAmbiente, sala } = crearEscena(motor.entorno);
const CAMARA_INICIO = camera.position.clone();

const hero = document.getElementById('hero');
const card = document.getElementById('card');
const cardBody = document.getElementById('cardBody');
const flash = document.getElementById('flash');
const flashText = document.getElementById('flashText');
const visor = document.getElementById('visor');

let escaparate;

/* ---------- Activar un objeto ---------- */
function alActivar(obj){
  const d = obj.datos;
  if(d.accion === 'entrar') entrar(obj);
  else abrirFicha(obj);
}

// Cinemática "ponerse las gafas": las gafas se levantan de la mesa, se giran para enseñar
// las lentes y se acercan a la cara; la vista se cierra en dos círculos (las lentes) y se abre el Lobby
function entrar(obj){
  escaparate.bloquear(true);
  cerrarFicha();
  const destino = new URL(obj.datos.destino, location.href).href;
  const ir = () => { try{ sessionStorage.setItem('rvr-cinematica', '1'); }catch{} location.href = destino; };
  if(reduceMotion){ ir(); return; }

  obj.fijo = true;
  const vuelta = Math.round(obj.rot.y / (Math.PI*2)) * Math.PI*2;
  const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
  const delante = camera.position.clone().addScaledVector(dir, 6);            // en el aire, frente a nosotros
  const cara = camera.position.clone().addScaledVector(dir, 0.35);            // pegadas a la cara
  const mirar = new THREE.Vector3(0, 0, 0);
  const p = obj.raiz.position;
  flashText.textContent = 'Encendiendo las gafas…';

  const tl = gsap.timeline({ onComplete:ir });
  setTimeout(ir, 7000);   // por si el equipo va tan lento que la animación se alarga: entramos igualmente
  tl.to(hero, { autoAlpha:0, y:20, duration:0.4 }, 0)
    .to(['#labels', '.sombra', '.top'], { autoAlpha:0, duration:0.4 }, 0)
    // 1. Se levantan de la mesa y vienen delante, de frente
    .call(() => { obj.rot.x = 0.05; obj.rot.y = vuelta; }, null, 0)
    .to(p, { x:delante.x, y:delante.y, z:delante.z, duration:1.4, ease:'power2.inOut' }, 0.2)
    .to(mirar, { x:delante.x, y:delante.y, z:delante.z, duration:1.4, ease:'power2.inOut', onUpdate:() => camera.lookAt(mirar) }, 0.2)
    // 2. Se dan la vuelta: vemos la almohadilla y las dos lentes
    .call(() => { (obj.modelo.userData.trasera || []).forEach(m => m.visible = false); obj.rot.y = vuelta + Math.PI; obj.rot.x = -0.05; }, null, 1.5)
    // 3. Se acercan a la cara
    .to(p, { x:cara.x, y:cara.y, z:cara.z, duration:1.5, ease:'power3.in' }, 2.5)
    // 4. Todo se cierra en las dos lentes y se apaga
    .set(visor, { autoAlpha:1, '--r':'75vmax' }, 3.3)
    .set(flash, { autoAlpha:1 }, 3.3)
    .to(visor, { '--r':'0vmax', duration:0.7, ease:'power2.in' }, 3.3)
    .to(flashText, { autoAlpha:1, duration:0.3 }, 4.0)
    .to({}, { duration:0.6 });
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

/* ---------- Cinemática al volver del Lobby: nos quitamos las gafas ----------
   Empezamos con la vista cerrada en las lentes y las gafas pegadas a la cara;
   las lentes se abren, las gafas se apartan y vuelven a su mesita. */
// «Conocer el proyecto» seleccionado de inicio (Enter ya entra). Se enfoca cuando el texto
// ya es visible: un elemento con visibility:hidden pierde el foco.
function seleccionarInicio(){ if(document.activeElement === document.body) cta.focus({ preventScroll:true }); }

function quitarseGafas(){
  let viene = false;
  try{ viene = !!sessionStorage.getItem('rvr-quitar'); sessionStorage.removeItem('rvr-quitar'); }catch{}
  if(!viene) return false;
  const obj = escaparate.objetos.find(o => o.datos.accion === 'entrar');
  if(!obj || reduceMotion){ document.documentElement.classList.remove('quitar'); return false; }
  escaparate.bloquear(true);
  obj.fijo = true;
  const casa = obj.raiz.position.clone();
  const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
  const cara = camera.position.clone().addScaledVector(dir, 0.35);
  const vuelta = Math.round(obj.rot.y / (Math.PI*2)) * Math.PI*2;
  const trasera = obj.modelo.userData.trasera || [];
  // Estado inicial: gafas en la cara, de espaldas (vemos las lentes) y la vista cerrada
  obj.raiz.position.copy(cara);
  obj.rot.x = obj.giro.rotation.x = -0.05; obj.rot.y = obj.giro.rotation.y = vuelta + Math.PI;
  trasera.forEach(m => m.visible = false);
  gsap.set(visor, { autoAlpha:1, '--r':'0vmax' });
  document.documentElement.classList.remove('quitar');
  gsap.set([hero, '#labels', '.sombra', '.top'], { autoAlpha:0 });
  gsap.timeline({ onComplete:() => { obj.fijo = false; escaparate.bloquear(false); seleccionarInicio(); } })
    .to(visor, { '--r':'80vmax', duration:1.0, ease:'power2.out' }, 0.2)
    .set(visor, { autoAlpha:0 }, 1.2)
    .to(obj.raiz.position, { x:casa.x, y:casa.y + 1, z:casa.z + 2, duration:1.3, ease:'power2.out' }, 0.5)
    .call(() => { obj.rot.y = vuelta + Math.PI*2; obj.rot.x = obj.base.x; trasera.forEach(m => m.visible = true); }, null, 1.0)
    .to(obj.raiz.position, { x:casa.x, y:casa.y, z:casa.z, duration:1.0, ease:'power2.inOut' }, 1.8)
    .to('.sombra', { autoAlpha:1, duration:0.6 }, 1.8)
    .fromTo(hero, { autoAlpha:0, y:24 }, { autoAlpha:1, y:0, duration:0.9, ease:'power3.out' }, 2.2)
    .to(['#labels', '.top'], { autoAlpha:1, duration:0.6 }, 2.6);
  return true;
}

/* ---------- Teclado en la portada ----------
   Al empezar está seleccionado "Conocer el proyecto". ←→ van de un elemento a otro
   (botón, gafas…): al seleccionar las gafas se encienden. Enter entra. */
const cta = document.getElementById('cta');
const enfocables = () => [cta, ...escaparate.objetos.map(o => o.etiqueta)];
addEventListener('keydown', e => {
  if(!escaparate || e.ctrlKey || e.metaKey || e.altKey) return;
  const mov = { ArrowRight:1, ArrowLeft:-1 }[e.key];
  if(mov === undefined) return;
  const lista = enfocables(), i = lista.indexOf(document.activeElement);
  const sig = lista[Math.min(lista.length - 1, Math.max(0, (i < 0 ? 0 : i + mov)))];
  if(sig){ e.preventDefault(); sig.focus({ preventScroll:true }); }
});
// "Conocer el proyecto" también se pone las gafas (misma cinemática que tocarlas)
cta.addEventListener('click', e => {
  const gafas = escaparate && escaparate.objetos.find(o => o.datos.accion === 'entrar');
  if(!gafas) return;                   // si la escena no cargó, el enlace funciona normal
  e.preventDefault();
  entrar(gafas);
});

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
  camera.position.copy(CAMARA_INICIO); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
  gsap.set([hero, '#labels', '.sombra', '.top'], { autoAlpha:1, y:0 }); gsap.set([flash, flashText, visor], { autoAlpha:0 });
  escaparate.reiniciar();
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
    escaparate = await crearEscaparate({ scene, camera, lienzo, datos, alActivar, alColocar:sala.colocarMesitas });
    motor.renderer.setAnimationLoop(bucle);
    document.getElementById('loader').classList.add('done');
    if(!quitarseGafas()){
      gsap.from(hero, { autoAlpha:0, y:24, duration:D(0.9), ease:'power3.out', onComplete:seleccionarInicio });
      gsap.from('#labels', { autoAlpha:0, duration:D(0.8), delay:D(0.4) });
    }
    // Texturas costosas, cuando la página ya se ve
    requestAnimationFrame(() => setTimeout(() => escaparate.detalles(), 60));
  }catch(err){
    console.error(err);
    document.getElementById('loader').textContent = 'No se pudo cargar la escena. Si abriste el archivo directamente, sírvelo con «python3 -m http.server».';
  }
})();
