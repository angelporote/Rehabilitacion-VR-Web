/* =========================================================
   juego/main.js · La sala de un juego (vr/juego.html?id=<juego>)
   Es genérica: la sala de cada juego (js/juegos/<id>/escena.js) pone la
   habitación, los objetos que se tocan y la cinemática; los textos salen
   de datos/juegos/<id>.json.
   Modos (body[data-modo]):
   - "cine":  la cinemática de entrada, con la mirada fija. Enter la salta, Esc vuelve al Lobby
   - "mesa":  sentado a la mesa; los objetos que se tocan llevan etiqueta
   - "libre": primera persona por la sala (como en el Lobby). R vuelve a la mesa
   - "panel": un objeto se ha acercado y su panel está abierto
   ========================================================= */
import * as THREE from 'three';
import { crearMotor } from '../nucleo/motor.js?v=202611192241';
import { gsap, D, reduceMotion } from '../nucleo/util.js?v=202611192241';
import { cargarJSON, esc } from '../nucleo/datos.js?v=202611192241';
import { crearJugador } from '../nucleo/jugador.js?v=202611192241';
import { crearPlano } from '../nucleo/plano.js?v=202611192241';
import { SALAS } from '../juegos/index.js?v=202611192241';
import { crearPanel } from './panel.js?v=202611192241';

const $ = id => document.getElementById(id);
const lienzo = $('scene'), cuerpo = document.body, html = document.documentElement;
const motor = crearMotor(lienzo);

/* ---------- Escena ---------- */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xD9C6A6);
scene.environment = motor.entorno; scene.environmentIntensity = 0.45;
scene.add(new THREE.HemisphereLight(0xFFF3E0, 0x8A6A4A, 1.0));
scene.add(new THREE.AmbientLight(0xFFE9D0, 0.2));
const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.01, 40);

let sala, juego, panel, jugador, pintarPlano;

/* ---------- Cámara guiada (cinemática y vista de la mesa) ----------
   cam.pos, cam.mira y cam.fov se animan; en "cine" y "mesa" la cámara los sigue.
   El fov es vertical para una pantalla 16:9; en pantallas más estrechas se abre
   para que se vea lo mismo a lo ancho. */
const cam = { pos:new THREE.Vector3(), mira:new THREE.Vector3(), fov:50 };
let guiada = true;
function fovAjustado(fov){
  const a = camera.aspect, ref = a < 1 ? 1.1 : 16/9;   // en vertical se recorta algo por los lados
  if(a >= ref) return fov;
  const h = 2*Math.atan(Math.tan(THREE.MathUtils.degToRad(fov)/2)*ref);
  return THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(h/2)/a));
}
function aplicarGuiada(){
  camera.position.copy(cam.pos); camera.lookAt(cam.mira);
  const f = fovAjustado(cam.fov);
  if(Math.abs(camera.fov - f) > 1e-3){ camera.fov = f; camera.updateProjectionMatrix(); }
}

/* ---------- Modos ---------- */
let modo = 'cine';
function ponerModo(m){
  modo = m; cuerpo.dataset.modo = m;
  if(sala) sala.silla.visible = m === 'libre' || m === 'viaje';
  pintarIndicador();
}

/* ---------- Cinemática ---------- */
let cine = null;
function empezarCinematica(){
  ponerModo('cine'); guiada = true;
  $('cineTitulo').textContent = juego.cinematica || juego.nombre;
  if(reduceMotion){ terminarCinematica(); return; }
  cine = sala.cinematica(gsap.timeline({ onComplete:terminarCinematica }), cam);
  $('cineSaltar').focus({ preventScroll:true });
}
function saltarCinematica(){
  if(modo !== 'cine') return;
  if(cine){ cine.kill(); cine = null; }
  sala.finCinematica();
  const v = sala.vistaMesa();
  gsap.to(cam.pos, { x:v.pos.x, y:v.pos.y, z:v.pos.z, duration:D(0.6), ease:'power2.inOut' });
  gsap.to(cam.mira, { x:v.mira.x, y:v.mira.y, z:v.mira.z, duration:D(0.6), ease:'power2.inOut' });
  gsap.to(cam, { fov:50, duration:D(0.6), ease:'power2.inOut', onComplete:terminarCinematica });
}
function terminarCinematica(){
  cine = null; sala.finCinematica();
  const v = sala.vistaMesa(); cam.pos.copy(v.pos); cam.mira.copy(v.mira); cam.fov = 50;
  ponerModo('mesa');
  botones[0] && botones[0].focus({ preventScroll:true });
}

/* ---------- Objetos que se tocan: etiqueta (botón) sobre cada uno ---------- */
let botones = [];
function montarEtiquetas(){
  const caja = $('etiquetas');
  botones = sala.tocables.map((t, i) => {
    const p = juego.paneles[t.id] || {};
    const b = document.createElement('button');
    b.className = 'etiqueta';
    b.innerHTML = `<b>${esc(t.nombre)}</b><span>${esc(p.etiqueta || t.ayuda)}</span>`;
    b.addEventListener('click', () => abrir(t));
    b.addEventListener('focus', () => resaltar(i));
    b.addEventListener('blur', () => resaltar(-1));
    b.addEventListener('pointerenter', () => resaltar(i));
    b.addEventListener('pointerleave', () => resaltar(-1));
    caja.appendChild(b);
    return b;
  });
}
const v3 = new THREE.Vector3();
function colocarEtiquetas(){
  if(modo !== 'mesa') return;
  sala.tocables.forEach((t, i) => {
    v3.copy(t.ancla()).project(camera);
    botones[i].style.transform = `translate(${(v3.x*0.5 + 0.5)*innerWidth}px, ${(-v3.y*0.5 + 0.5)*innerHeight}px) translate(-50%, -100%)`;
  });
}
let resaltado = -1;
function resaltar(i){
  if(i === resaltado) return;
  if(resaltado >= 0){ sala.tocables[resaltado].resaltar(false, gsap); botones[resaltado].classList.remove('on'); }
  resaltado = i;
  if(i >= 0){ sala.tocables[i].resaltar(true, gsap); botones[i].classList.add('on'); }
  lienzo.classList.toggle('sobre', i >= 0 && modo === 'mesa');
}

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function tocableBajo(nx, ny, maxDist = Infinity){
  ndc.set(nx, ny); ray.setFromCamera(ndc, camera);
  let mejor = -1, dist = maxDist;
  sala.tocables.forEach((t, i) => { const h = ray.intersectObject(t.objeto, true)[0]; if(h && h.distance < dist){ dist = h.distance; mejor = i; } });
  return mejor;
}

/* ---------- Abrir un objeto: se acerca a la cámara y se despliega su panel ---------- */
let abiertoT = null, guardado = null, focoAntes = null;
async function abrir(t){
  if(modo !== 'mesa' && modo !== 'libre') return;
  const p = juego.paneles[t.id]; if(!p) return;
  const desde = modo;
  focoAntes = desde === 'mesa' ? document.activeElement : null;
  jugador.activar(false); soltarRaton(); resaltar(-1);
  abiertoT = t; guardado = { desde, pos:t.objeto.position.clone(), quat:t.objeto.quaternion.clone() };
  ponerModo('panel');
  // Delante de los ojos: el cartón ocupa medio ancho; la bola, un tercio del alto
  const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
  const vFov = THREE.MathUtils.degToRad(camera.fov), hFov = 2*Math.atan(Math.tan(vFov/2)*camera.aspect);
  const caja = new THREE.Box3().setFromObject(t.objeto), tam = caja.getSize(new THREE.Vector3());
  const d = t.estilo === 'acercar' ? tam.y/(0.32*2*Math.tan(vFov/2)) : Math.max(tam.x, tam.z)/(0.5*2*Math.tan(hFov/2));
  const destino = camera.position.clone().addScaledVector(dir, d);
  const q = camera.quaternion.clone();
  if(!reduceMotion){
    await new Promise(res => {
      const tl = gsap.timeline({ onComplete:res });
      tl.to(t.objeto.position, { x:destino.x, y:destino.y, z:destino.z, duration:0.9, ease:'power2.inOut' }, 0);
      const q0 = t.objeto.quaternion.clone(), k = { v:0 };
      if(t.estilo !== 'acercar') tl.to(k, { v:1, duration:0.9, ease:'power2.inOut', onUpdate:() => t.objeto.quaternion.slerpQuaternions(q0, q, k.v) }, 0);
      else tl.to(t.objeto.rotation, { y:'+=' + Math.PI*2, duration:0.9, ease:'power2.inOut' }, 0);
    });
  }
  await panel.abrir(p, p.ejemplo, t.estilo);
  t.objeto.visible = false;     // tapado por el panel; así no se ve por los bordes en móvil
}
async function cerrar(){
  if(!abiertoT || !panel.abierto) return;
  const t = abiertoT; t.objeto.visible = true;
  await panel.cerrar();
  const g = guardado;
  const fin = () => {
    t.objeto.position.copy(g.pos); t.objeto.quaternion.copy(g.quat); abiertoT = null;
    if(g.desde === 'libre'){ ponerModo('libre'); jugador.activar(true); pedirRaton(); }
    else { ponerModo('mesa'); (focoAntes && document.contains(focoAntes) ? focoAntes : botones[0])?.focus({ preventScroll:true }); }
  };
  if(reduceMotion){ fin(); return; }
  const q0 = t.objeto.quaternion.clone(), k = { v:0 };
  gsap.timeline({ onComplete:fin })
    .to(t.objeto.position, { x:g.pos.x, y:g.pos.y, z:g.pos.z, duration:0.8, ease:'power2.inOut' }, 0)
    .to(k, { v:1, duration:0.8, ease:'power2.inOut', onUpdate:() => t.objeto.quaternion.slerpQuaternions(q0, g.quat, k.v) }, 0);
}
$('panelCerrar').addEventListener('click', cerrar);

/* ---------- Primera persona (como en el Lobby) ---------- */
const puedeCapturar = 'pointerLockElement' in document && lienzo.requestPointerLock;
function pedirRaton(){ if(puedeCapturar){ try{ const r = lienzo.requestPointerLock(); r && r.catch && r.catch(() => {}); }catch{} } }
function soltarRaton(){ if(document.pointerLockElement) document.exitPointerLock(); }
const capturado = () => document.pointerLockElement === lienzo;
document.addEventListener('pointerlockchange', () => { cuerpo.classList.toggle('capturado', capturado()); pintarIndicador(); });

function viajarA(pos, rot, alTerminar){
  const desde = { p:camera.position.clone(), q:camera.quaternion.clone() };
  const qDestino = new THREE.Quaternion().setFromEuler(rot), k = { v:0 };
  gsap.to(k, { v:1, duration:D(1.1), ease:'power2.inOut',
    onUpdate:() => { camera.position.lerpVectors(desde.p, pos, k.v); camera.quaternion.slerpQuaternions(desde.q, qDestino, k.v); },
    onComplete:alTerminar });
}
function entrarLibre(){
  if(modo !== 'mesa') return;
  guiada = false; resaltar(-1);
  ponerModo('viaje');
  const i = sala.inicioLibre;
  jugador.colocar(i.x, i.z, i.mira);
  pedirRaton();
  const v = jugador.vista();
  viajarA(v.pos, v.rot, () => { jugador.activar(true); ponerModo('libre'); });
}
function volverMesa(){
  if(modo !== 'libre') return;
  jugador.activar(false); soltarRaton(); resaltar(-1);
  ponerModo('viaje');
  const v = sala.vistaMesa();
  const m = new THREE.Matrix4().lookAt(v.pos, v.mira, new THREE.Vector3(0, 1, 0));
  // El fov también vuelve al de la mesa
  gsap.to(camera, { fov:fovAjustado(50), duration:D(1.1), onUpdate:() => camera.updateProjectionMatrix() });
  viajarA(v.pos, new THREE.Euler().setFromRotationMatrix(m, 'YXZ'), () => {
    cam.pos.copy(v.pos); cam.mira.copy(v.mira); cam.fov = 50; guiada = true;
    ponerModo('mesa'); botones[0]?.focus({ preventScroll:true });
  });
}
$('libre').addEventListener('click', entrarLibre);
$('volver').addEventListener('click', volverMesa);

/* ---------- Ratón ---------- */
lienzo.addEventListener('pointermove', e => {
  if(modo === 'libre'){
    if(capturado()) jugador.mirar(e.movementX, e.movementY);
    else if(e.buttons & 1) jugador.mirar(e.movementX*1.6, e.movementY*1.6);
    return;
  }
  if(modo === 'mesa') resaltar(tocableBajo(e.clientX/innerWidth*2 - 1, -(e.clientY/innerHeight)*2 + 1));
});
let pulsado = null;
lienzo.addEventListener('pointerdown', e => { pulsado = { x:e.clientX, y:e.clientY }; });
lienzo.addEventListener('click', e => {
  const movido = pulsado ? Math.hypot(e.clientX - pulsado.x, e.clientY - pulsado.y) : 0;
  if(modo === 'cine'){ saltarCinematica(); return; }
  if(modo === 'mesa'){
    const i = tocableBajo(e.clientX/innerWidth*2 - 1, -(e.clientY/innerHeight)*2 + 1);
    if(i >= 0) abrir(sala.tocables[i]);
  } else if(modo === 'libre'){
    if(!capturado() && puedeCapturar && movido < 6){ pedirRaton(); return; }
    const i = capturado() ? tocableBajo(0, 0, 2.5) : tocableBajo(e.clientX/innerWidth*2 - 1, -(e.clientY/innerHeight)*2 + 1, 2.5);
    if(i >= 0 && movido < 6){ tocar(); abrir(sala.tocables[i]); }
  }
});
function tocar(){ const m = $('mano'); m.classList.remove('toca'); void m.offsetWidth; m.classList.add('toca'); }

/* ---------- Teclado ---------- */
addEventListener('keydown', e => {
  if(e.ctrlKey || e.metaKey || e.altKey || !sala) return;
  if(modo === 'cine'){
    if(e.code === 'Escape'){ e.preventDefault(); volverLobby(); }
    else if(['Enter', 'Space', 'ArrowRight'].includes(e.code)){ e.preventDefault(); saltarCinematica(); }
    return;
  }
  if(modo === 'panel'){ if(e.code === 'Escape'){ e.preventDefault(); cerrar(); } return; }
  if(e.code === 'Escape'){ volverLobby(); return; }
  if(modo === 'mesa'){
    if(e.code === 'KeyL'){ entrarLibre(); return; }
    const mov = { ArrowLeft:-1, ArrowRight:1 }[e.code];
    if(mov !== undefined){
      e.preventDefault();
      const i = botones.indexOf(document.activeElement);
      botones[i < 0 ? 0 : Math.min(botones.length - 1, Math.max(0, i + mov))].focus({ preventScroll:true });
    }
  } else if(modo === 'libre'){
    if(e.code === 'KeyR'){ volverMesa(); return; }
    if(e.code === 'Enter' || e.code === 'Space'){
      e.preventDefault(); tocar();
      const i = tocableBajo(0, 0, 2.5);
      if(i >= 0) abrir(sala.tocables[i]);
    }
  }
});
$('cineSaltar').addEventListener('click', saltarCinematica);
$('cineAtras').addEventListener('click', volverLobby);
$('salir').addEventListener('click', e => { e.preventDefault(); volverLobby(); });

/* ---------- Volver al Lobby (fundido a negro) ---------- */
function volverLobby(){
  if(cuerpo.dataset.saliendo) return;
  cuerpo.dataset.saliendo = '1';
  soltarRaton(); jugador && jugador.activar(false);
  try{ sessionStorage.setItem('rvr-desde-juego', juego ? juego.id : ''); }catch{}
  const ir = () => { location.href = './'; };
  if(reduceMotion){ ir(); return; }
  setTimeout(ir, 1500);
  gsap.to('.fundido-negro', { autoAlpha:1, duration:0.5, onComplete:ir });
}

/* ---------- Indicador ---------- */
function pintarIndicador(){
  const ayuda = {
    cine:  ['Cinemática', '<li><kbd>Enter</kbd> saltar</li><li><kbd>Esc</kbd> volver al Lobby</li>'],
    mesa:  ['Sentado a la mesa', '<li><kbd>Clic</kbd> en el cartón o la bola, o <kbd>←→</kbd> y <kbd>Enter</kbd></li><li><kbd>L</kbd> moverte libremente</li><li><kbd>Esc</kbd> volver al Lobby</li>'],
    libre: ['Modo libre', `<li><kbd>W A S D</kbd> o <kbd>↑↓</kbd> moverte</li><li><kbd>Ratón</kbd>, <kbd>←→</kbd> o <kbd>Q E</kbd> mirar</li><li><kbd>Clic</kbd> o <kbd>Enter</kbd> tocar</li><li><kbd>R</kbd> volver a la mesa</li><li><kbd>Esc</kbd> ${capturado() ? 'soltar el ratón' : 'volver al Lobby'}</li>`],
    panel: ['Leyendo', '<li><kbd>↑↓</kbd> bajar</li><li><kbd>Esc</kbd> cerrar</li>'],
    viaje: ['…', ''],
  }[modo];
  $('indModo').textContent = ayuda[0]; $('indAyuda').innerHTML = ayuda[1];
}

/* ---------- Tamaño y bucle ---------- */
function redimensionar(){
  camera.aspect = innerWidth/innerHeight;
  if(!guiada) camera.fov = fovAjustado(50);
  camera.updateProjectionMatrix();
  motor.redimensionar(innerWidth, innerHeight);
}
addEventListener('resize', redimensionar);

const reloj = new THREE.Clock();
function bucle(){
  const dt = Math.min(reloj.getDelta(), 0.1), t = reloj.elapsedTime;
  if(guiada && modo !== 'panel') aplicarGuiada();
  jugador.actualizar(dt);
  sala.animar(t, dt, camera);
  if(modo === 'libre') resaltar(tocableBajo(0, 0, 2.5));
  colocarEtiquetas();
  pintarPlano(camera);
  motor.dibujar(scene, camera, { fuerza:0.18, umbral:0.92 });
  motor.vigilarRendimiento(dt);
}

/* ---------- Arranque ---------- */
(async () => {
  try{
    const id = new URLSearchParams(location.search).get('id') || 'bingo';
    if(!SALAS[id]) throw new Error(`No hay sala para "${id}"`);
    const [datos, modulo] = await Promise.all([cargarJSON(`../datos/juegos/${encodeURIComponent(id)}.json`), SALAS[id]()]);
    juego = datos;
    document.title = `RehabilitaciónVR · ${juego.nombre}`;
    lienzo.setAttribute('aria-label', `La sala del ${juego.nombre} en 3D`);
    sala = modulo.crear({ scene });
    jugador = crearJugador({ camera, limites:sala.limites, obstaculos:sala.obstaculos });
    pintarPlano = crearPlano($('plano'), sala.limites, sala.obstaculos, sala.dibujarPlano);
    panel = crearPanel(juego);
    montarEtiquetas();
    if(matchMedia('(hover: none) and (pointer: coarse)').matches) cuerpo.classList.add('tactil');
    const v = sala.vistaMesa(); cam.pos.copy(v.pos); cam.mira.copy(v.mira);
    redimensionar();
    motor.renderer.setAnimationLoop(bucle);
    $('loader').classList.add('done');
    empezarCinematica();
    gsap.to('.fundido-negro', { autoAlpha:0, duration:D(0.6), delay:D(0.1), onComplete:() => html.classList.remove('fundido') });
  }catch(err){
    console.error(err);
    html.classList.remove('fundido');
    $('loader').innerHTML = 'No se pudo cargar la sala. <a href="./">Volver al Lobby</a>';
  }
})();
