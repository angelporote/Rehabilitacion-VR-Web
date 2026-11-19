/* =========================================================
   lobby/main.js · El Lobby: lo que se ve al entrar en las gafas
   Dos modos:
   - "pantalla": vista sentada frente a la pantalla "Elige un juego"
   - "libre":    primera persona por la habitación (WASD/flechas + ratón)
   R vuelve siempre a la pantalla. El indicador de la esquina muestra
   el modo, los controles y un plano con la posición.
   ========================================================= */
import * as THREE from 'three';
import { crearMotor } from '../nucleo/motor.js';
import { gsap, D, reduceMotion } from '../nucleo/util.js';
import { cargarJSON, esc } from '../nucleo/datos.js';
import { crearSala, LIMITES, MESA } from './sala.js';
import { crearPantalla } from './pantalla.js';
import { crearJugador } from './jugador.js';

const $ = id => document.getElementById(id);
const lienzo = $('scene');
const motor = crearMotor(lienzo);

/* ---------- Escena ---------- */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xD9C6A6);
scene.environment = motor.entorno; scene.environmentIntensity = 0.4;
scene.add(new THREE.HemisphereLight(0xFFF3E0, 0x8A6A4A, 1.0));
scene.add(new THREE.AmbientLight(0xFFE9D0, 0.25));
const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.03, 50);

const { obstaculos, silla } = crearSala(scene);

/* ---------- Pantalla sobre la mesa ---------- */
let pantalla, juegos = [], opcionesLobby = {};
const centroPantalla = new THREE.Vector3(), normalPantalla = new THREE.Vector3();
function montarPantalla(){
  pantalla = crearPantalla(juegos, opcionesLobby);
  const p = pantalla.grupo;
  p.position.set(MESA.x, MESA.alto + 0.06 + pantalla.ALTO/2 + 0.05, MESA.z - 0.08);
  p.rotation.x = -0.16;                                                 // inclinada hacia atrás, como en las gafas
  scene.add(p);
  // Peana
  const peana = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.03, 0.22), new THREE.MeshStandardMaterial({ color:0x2B2620, metalness:0.4, roughness:0.5 }));
  peana.position.set(MESA.x, MESA.alto + 0.015, MESA.z - 0.1); scene.add(peana);
  const pie = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.04), peana.material);
  pie.position.set(MESA.x, MESA.alto + 0.08, MESA.z - 0.14); scene.add(pie);
  p.updateMatrixWorld();
  p.getWorldPosition(centroPantalla);
  normalPantalla.set(0, 0, 1).applyQuaternion(p.quaternion);
}

/* ---------- Vista "pantalla": la cámara encuadra el monitor ---------- */
function vistaPantalla(){
  // Distancia para que la pantalla ocupe ~90 % del ancho (o del alto) visible
  const vFov = THREE.MathUtils.degToRad(camera.fov), hFov = 2*Math.atan(Math.tan(vFov/2)*camera.aspect);
  const dist = Math.max((pantalla.ANCHO*0.72) / Math.tan(hFov/2), (pantalla.ALTO*0.95) / Math.tan(vFov/2));
  const pos = centroPantalla.clone().addScaledVector(normalPantalla, dist);
  const m = new THREE.Matrix4().lookAt(pos, centroPantalla, new THREE.Vector3(0,1,0));
  return { pos, rot:new THREE.Euler().setFromRotationMatrix(m, 'YXZ') };
}

/* ---------- Jugador en primera persona ---------- */
const jugador = crearJugador({ camera, limites:LIMITES, obstaculos });

/* ---------- Modos ---------- */
let modo = 'pantalla';           // 'pantalla' | 'libre' | 'viaje'
const cuerpo = document.body;
function ponerModo(m){
  modo = m; cuerpo.dataset.modo = m; pintarIndicador();
  silla.visible = m !== 'pantalla';      // sentados frente a la pantalla, la silla es la nuestra: no se ve
}

function animarCamara(destino, alTerminar){
  const desde = { p:camera.position.clone(), q:camera.quaternion.clone() };
  const qDestino = new THREE.Quaternion().setFromEuler(destino.rot);
  const t = { k:0 };
  gsap.to(t, { k:1, duration:D(1.1), ease:'power2.inOut',
    onUpdate:() => { camera.position.lerpVectors(desde.p, destino.pos, t.k); camera.quaternion.slerpQuaternions(desde.q, qDestino, t.k); },
    onComplete:alTerminar });
}

function entrarLibre(){
  if(modo !== 'pantalla') return;
  cerrarFicha();
  ponerModo('viaje');
  pantalla.pintar(-1);
  // Nos levantamos de la silla y damos un paso atrás
  jugador.colocar(0.55, 0.15, centroPantalla);
  pedirRaton();
  animarCamara(jugador.vista(), () => { jugador.activar(true); ponerModo('libre'); });
}

function volverPantalla(){
  if(modo === 'pantalla' || modo === 'viaje') return;
  jugador.activar(false);
  soltarRaton();
  ponerModo('viaje');
  animarCamara(vistaPantalla(), () => ponerModo('pantalla'));
}

/* ---------- Ratón capturado (pointer lock) ---------- */
const puedeCapturar = 'pointerLockElement' in document && lienzo.requestPointerLock;
function pedirRaton(){ if(puedeCapturar){ try{ const r = lienzo.requestPointerLock(); r && r.catch && r.catch(() => {}); }catch{} } }
function soltarRaton(){ if(document.pointerLockElement) document.exitPointerLock(); }
const capturado = () => document.pointerLockElement === lienzo;
document.addEventListener('pointerlockchange', () => { cuerpo.classList.toggle('capturado', capturado()); pintarIndicador(); });

/* ---------- Tocar la pantalla ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function tarjetaBajo(nx, ny){
  if(!pantalla) return -1;
  ndc.set(nx, ny); ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObject(pantalla.pantalla)[0];
  return hit && hit.distance < 3.5 ? pantalla.tarjetaEn(hit.uv) : -1;   // en modo libre hay que acercarse
}
let resaltada = -1;
function resaltar(i){ if(i !== resaltada){ resaltada = i; pantalla.pintar(i); } }

lienzo.addEventListener('pointermove', e => {
  if(modo === 'libre'){
    if(capturado()) jugador.mirar(e.movementX, e.movementY);
    else if(e.buttons & 1) jugador.mirar(e.movementX * 1.6, e.movementY * 1.6);   // sin captura: mirar arrastrando
    return;
  }
  if(modo !== 'pantalla') return;
  const i = tarjetaBajo(e.clientX/innerWidth*2 - 1, -(e.clientY/innerHeight)*2 + 1);
  resaltar(i);
  lienzo.classList.toggle('sobre', i >= 0);
});
let pulsado = null;
lienzo.addEventListener('pointerdown', e => { pulsado = { x:e.clientX, y:e.clientY }; });
lienzo.addEventListener('click', e => {
  const movido = pulsado ? Math.hypot(e.clientX - pulsado.x, e.clientY - pulsado.y) : 0;
  if(modo === 'pantalla'){
    const i = tarjetaBajo(e.clientX/innerWidth*2 - 1, -(e.clientY/innerHeight)*2 + 1);
    if(i >= 0) abrirFicha(pantalla.tarjetas[i].juego);
  } else if(modo === 'libre'){
    if(!capturado() && puedeCapturar && movido < 6){ pedirRaton(); return; }       // volver a capturar el ratón
    const i = capturado() ? tarjetaBajo(0, 0) : tarjetaBajo(e.clientX/innerWidth*2 - 1, -(e.clientY/innerHeight)*2 + 1);
    if(i >= 0 && movido < 6){ tocar(); abrirFicha(pantalla.tarjetas[i].juego); }
  }
});
function tocar(){ const m = $('mano'); m.classList.remove('toca'); void m.offsetWidth; m.classList.add('toca'); }

/* ---------- Ficha del juego (provisional: aún está por decidir cómo se mostrará) ---------- */
const ficha = $('ficha');
let focoAntes = null;
function abrirFicha(j){
  soltarRaton();
  focoAntes = document.activeElement;
  $('fichaCuerpo').innerHTML = `
    <span class="fam" style="--c:${esc(j.color)}">${esc(j.lema)}</span>
    <h2>${esc(j.nombre)}</h2>
    <p>${esc(j.texto)}</p>
    <p class="nota">Aquí irá la información completa del juego. Estamos decidiendo cómo mostrarla.</p>
    <a class="ghost" href="info.html#${esc(j.id)}">Leer la ficha en texto</a>`;
  ficha.classList.add('open');
  $('fichaCerrar').focus({ preventScroll:true });
}
function cerrarFicha(){
  if(!ficha.classList.contains('open')) return;
  ficha.classList.remove('open');
  if(focoAntes && document.contains(focoAntes)) focoAntes.focus({ preventScroll:true });   // el foco vuelve a donde estaba
}
$('fichaCerrar').addEventListener('click', () => { cerrarFicha(); if(modo === 'libre') pedirRaton(); });

/* ---------- Teclado y botones ---------- */
addEventListener('keydown', e => {
  if(e.ctrlKey || e.metaKey || e.altKey) return;
  const enFicha = ficha.classList.contains('open');
  if(e.code === 'Escape' && enFicha){ cerrarFicha(); return; }
  if(enFicha) return;                                                    // con la ficha abierta, el teclado es para ella
  if(e.code === 'KeyR'){ volverPantalla(); return; }
  if(modo === 'pantalla'){
    if(e.code === 'KeyL'){ entrarLibre(); return; }
    // Flechas: moverse entre las tarjetas (rejilla de 3 columnas)
    const mov = { ArrowLeft:-1, ArrowRight:1, ArrowUp:-3, ArrowDown:3 }[e.code];
    if(mov !== undefined){
      e.preventDefault();
      const disponibles = botonesTarjeta.filter(Boolean);
      const actual = botonesTarjeta.indexOf(document.activeElement);
      if(actual < 0){ disponibles[0] && disponibles[0].focus(); return; }   // la primera vez, a la primera tarjeta
      let i = actual + mov;
      while(i >= 0 && i < botonesTarjeta.length && !botonesTarjeta[i]) i += Math.sign(mov);
      (botonesTarjeta[i] || disponibles[0]).focus();
    }
  } else if(modo === 'libre' && (e.code === 'Enter' || e.code === 'Space')){
    e.preventDefault();
    const i = tarjetaBajo(0, 0);
    tocar();
    if(i >= 0) abrirFicha(pantalla.tarjetas[i].juego);
  }
});

/* ---------- Tarjetas con teclado: un botón invisible por tarjeta (Tab y Enter) ---------- */
let botonesTarjeta = [];
function montarBotonesTarjeta(){
  const nav = $('tarjetasTeclado');
  botonesTarjeta = pantalla.tarjetas.map((t, i) => {
    if(!t.juego) return null;
    const b = document.createElement('button');
    b.className = 'solo-lector';
    b.textContent = `${t.juego.nombre}: ${t.juego.lema}`;
    b.addEventListener('focus', () => { if(modo === 'pantalla') resaltar(i); });
    b.addEventListener('blur', () => { if(modo === 'pantalla') resaltar(-1); });
    b.addEventListener('click', () => { if(modo === 'pantalla') abrirFicha(t.juego); });
    nav.appendChild(b);
    return b;
  });
}
$('libre').addEventListener('click', entrarLibre);
$('volver').addEventListener('click', () => { cerrarFicha(); volverPantalla(); });

/* ---------- Indicador de la esquina: modo, controles y plano ---------- */
const plano = $('plano'), pg = plano.getContext('2d');
function pintarIndicador(){
  const libre = modo === 'libre';
  $('indModo').textContent = libre ? 'Modo libre' : modo === 'viaje' ? '…' : 'Modo pantalla';
  $('indAyuda').innerHTML = libre
    ? `<li><kbd>W A S D</kbd> o <kbd>↑↓</kbd> moverte</li><li><kbd>Ratón</kbd>, <kbd>←→</kbd> o <kbd>Q E</kbd> mirar</li><li><kbd>Clic</kbd> o <kbd>Enter</kbd> tocar la pantalla</li><li><kbd>R</kbd> volver a la pantalla</li>${capturado() ? '<li><kbd>Esc</kbd> soltar el ratón</li>' : ''}`
    : `<li><kbd>Clic</kbd> en un juego, o <kbd>Tab</kbd>/<kbd>←↑↓→</kbd> y <kbd>Enter</kbd></li><li><kbd>L</kbd> moverte libremente</li>`;
}
function pintarPlano(){
  const { x0, x1, z0, z1 } = LIMITES, w = plano.width, h = plano.height, m = 8;
  const esc2 = Math.min((w - m*2)/(x1 - x0), (h - m*2)/(z1 - z0));
  const X = x => m + (x - x0)*esc2 + ((w - m*2) - (x1 - x0)*esc2)/2, Z = z => m + (z - z0)*esc2;
  pg.clearRect(0, 0, w, h);
  pg.fillStyle = 'rgba(255,246,236,.08)'; pg.strokeStyle = 'rgba(255,246,236,.5)'; pg.lineWidth = 2;
  pg.fillRect(X(x0), Z(z0), (x1 - x0)*esc2, (z1 - z0)*esc2); pg.strokeRect(X(x0), Z(z0), (x1 - x0)*esc2, (z1 - z0)*esc2);
  pg.fillStyle = 'rgba(210,192,172,.55)';
  obstaculos.forEach(o => pg.fillRect(X(o.x0), Z(o.z0), (o.x1 - o.x0)*esc2, (o.z1 - o.z0)*esc2));
  pg.fillStyle = '#5FF2D2'; pg.fillRect(X(-pantalla.ANCHO/2), Z(MESA.z - 0.12), pantalla.ANCHO*esc2, 3);   // la pantalla
  // Dónde estás y hacia dónde miras
  const px = X(camera.position.x), pz = Z(camera.position.z);
  const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
  const a = Math.atan2(dir.z, dir.x);
  pg.fillStyle = 'rgba(95,242,210,.25)'; pg.beginPath(); pg.moveTo(px, pz); pg.arc(px, pz, 22, a - 0.5, a + 0.5); pg.fill();
  pg.fillStyle = '#FFF6EC'; pg.beginPath(); pg.arc(px, pz, 4.5, 0, 7); pg.fill();
}

/* ---------- Tamaño de pantalla y bucle ---------- */
function redimensionar(){
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  motor.redimensionar(innerWidth, innerHeight);
  if(pantalla && modo === 'pantalla'){ const v = vistaPantalla(); camera.position.copy(v.pos); camera.rotation.copy(v.rot); }
}
addEventListener('resize', redimensionar);

const reloj = new THREE.Clock();
function bucle(){
  const dt = Math.min(reloj.getDelta(), 0.1);
  jugador.actualizar(dt);
  // En modo libre, la tarjeta que hay en el centro de la vista (donde apunta la mano) se resalta
  if(modo === 'libre') resaltar(tarjetaBajo(0, 0));
  pintarPlano();
  motor.dibujar(scene, camera, { fuerza:0.2, umbral:0.9 });
  motor.vigilarRendimiento(dt);
}

/* ---------- Llegada desde la cinemática: las lentes se abren ---------- */
function abrirVisor(){
  const html = document.documentElement;
  if(!html.classList.contains('cinematica')) return;
  try{ sessionStorage.removeItem('rvr-cinematica'); }catch{}
  const visor = $('visor');
  gsap.fromTo(visor, { '--r':'0vmax' }, { '--r':'80vmax', duration:D(1.6), ease:'power2.out', delay:D(0.3),
    onComplete:() => { html.classList.remove('cinematica'); gsap.set(visor, { autoAlpha:0 }); } });
}

/* ---------- Quitarse las gafas: las lentes se cierran y volvemos al salón ---------- */
function quitarseGafas(e){
  e && e.preventDefault();
  if(cuerpo.dataset.saliendo) return;
  cuerpo.dataset.saliendo = '1';
  jugador.activar(false); soltarRaton(); cerrarFicha();
  const destino = new URL('../', location.href).href;
  const ir = () => { try{ sessionStorage.setItem('rvr-quitar', '1'); }catch{} location.href = destino; };
  if(reduceMotion){ ir(); return; }
  setTimeout(ir, 3000);
  gsap.timeline({ onComplete:ir })
    .to('.lobby-ui > *', { autoAlpha:0, duration:0.3 }, 0)
    .fromTo($('visor'), { autoAlpha:1, '--r':'80vmax' }, { '--r':'0vmax', duration:0.9, ease:'power2.in' }, 0.1)
    .to({}, { duration:0.15 });
}
$('salir').addEventListener('click', quitarseGafas);

/* ---------- Arranque ---------- */
(async () => {
  try{
    const datos = await cargarJSON('../datos/vr.json');
    juegos = datos.juegos; opcionesLobby = datos.lobby || {};
    montarPantalla();
    montarBotonesTarjeta();
    redimensionar();
    ponerModo('pantalla');
    motor.renderer.setAnimationLoop(bucle);
    $('loader').classList.add('done');
    // Moverse libremente necesita teclado: en pantallas táctiles sin ratón no se ofrece
    if(matchMedia('(hover: none) and (pointer: coarse)').matches) cuerpo.classList.add('tactil');
    gsap.from('.lobby-ui > *', { autoAlpha:0, y:12, duration:D(0.6), stagger:0.08, delay:D(0.2) });
    abrirVisor();
  }catch(err){
    console.error(err);
    $('loader').innerHTML = 'No se pudo cargar el Lobby. <a href="info.html">Ver la información en texto</a>';
  }
})();
