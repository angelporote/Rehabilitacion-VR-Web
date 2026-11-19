/* =========================================================
   escaparate.js · Los objetos de la portada (hoy, las gafas)
   - Lee datos/escaparate.json y carga el modelo de cada objeto
   - Los reparte en pantalla según cuántos haya (escala sola)
   - Se pueden girar arrastrando y se activan con un clic o con su etiqueta
   ========================================================= */
import * as THREE from 'three';
import { MODELOS } from '../modelos/index.js';
import { gsap, reduceMotion, isMobile, D } from '../nucleo/util.js';
import { esc } from '../nucleo/datos.js';

const RADIO_BASE = 1.9;   // tamaño (radio de la esfera envolvente) al que se ajusta cada modelo

export async function crearEscaparate({ scene, camera, lienzo, datos, alActivar, alColocar }){
  const objetos = [];
  const capaEtiquetas = document.getElementById('labels');

  // ---- 1. Cargar y normalizar cada modelo ----
  for(const d of datos.objetos){
    const cargar = MODELOS[d.modelo];
    if(!cargar){ console.warn(`Modelo desconocido: ${d.modelo}`); continue; }
    const { crear } = await cargar();
    const { grupo, detalle } = crear();

    // Centrar y escalar a un tamaño común: así se puede añadir cualquier modelo
    const caja = new THREE.Box3().setFromObject(grupo);
    const centro = caja.getCenter(new THREE.Vector3());
    const radio = caja.getBoundingSphere(new THREE.Sphere()).radius;
    grupo.position.sub(centro);
    const ajuste = new THREE.Group(); ajuste.add(grupo); ajuste.scale.setScalar(RADIO_BASE / radio * (d.escala || 1));   // 'escala' corrige modelos muy alargados

    const giro = new THREE.Group(); giro.add(ajuste);            // lo que gira el usuario
    const raiz = new THREE.Group(); raiz.add(giro); scene.add(raiz);   // lo que se coloca en pantalla
    const [gx, gy] = d.giroInicial || [0, 0];
    giro.rotation.set(gx, gy, 0);
    grupo.traverse(o => { if(o.isMesh) o.userData.objeto = d.id; });

    // Etiqueta HTML (también es el acceso por teclado)
    const etiqueta = document.createElement('button');
    etiqueta.className = 'label';
    etiqueta.style.setProperty('--c', d.color || 'var(--bio)');
    etiqueta.innerHTML = `<span class="dot"></span><span class="txt"><b>${esc(d.titulo)}</b><em>${esc(d.etiqueta)}</em></span>`;
    etiqueta.setAttribute('aria-label', `${d.titulo}: ${d.etiqueta}`);
    capaEtiquetas.appendChild(etiqueta);

    const obj = { datos:d, raiz, giro, ajuste, modelo:grupo, detalle, etiqueta,
                  rot:{ x:gx, y:gy }, base:{ x:gx, y:gy }, fase:Math.random()*6, hover:false };
    etiqueta.addEventListener('click', () => activar(obj));
    etiqueta.addEventListener('pointerenter', () => marcar(obj, true));
    etiqueta.addEventListener('pointerleave', () => marcar(obj, false));
    objetos.push(obj);
  }

  // ---- 2. Colocación según el tamaño de pantalla y el número de objetos ----
  const plano = new THREE.Plane(new THREE.Vector3(0,0,1), 0);
  const ray = new THREE.Raycaster();
  function puntoEnPantalla(nx, ny){            // coordenadas normalizadas (-1..1) → punto del plano z=0
    ray.setFromCamera(new THREE.Vector2(nx, ny), camera);
    return ray.ray.intersectPlane(plano, new THREE.Vector3());
  }
  function colocar(){
    const n = objetos.length; if(!n) return;
    camera.updateMatrixWorld();
    const movil = isMobile();
    // Zona de la pantalla reservada a los objetos (el texto ocupa el resto)
    const zona = movil ? { x0:-0.5, x1:0.5, y:0.28 } : { x0:0.12, x1:0.62, y:0.0 };
    const paso = n > 1 ? (zona.x1 - zona.x0) / (n - 1) : 0;
    const a = puntoEnPantalla(zona.x0, zona.y), b = puntoEnPantalla(zona.x1, zona.y);
    const sep = n > 1 ? a.distanceTo(b) / (n - 1) : a.distanceTo(b);
    const alto = puntoEnPantalla(0, 1).y - puntoEnPantalla(0, -1).y;
    const ancho = puntoEnPantalla(1, 0).x - puntoEnPantalla(-1, 0).x;
    const escala = (n > 1
      ? Math.min(sep * (movil ? 0.34 : 0.42), alto * (movil ? 0.2 : 0.27))
      : Math.min(ancho * (movil ? 0.36 : 0.18), alto * (movil ? 0.22 : 0.25))) / RADIO_BASE;   // un solo objeto: más grande
    objetos.forEach((o, i) => {
      const nx = n > 1 ? zona.x0 + paso*i : (zona.x0 + zona.x1)/2;
      o.raiz.position.copy(puntoEnPantalla(nx, zona.y));
      o.raiz.scale.setScalar(escala);
      o.radioPantalla = RADIO_BASE * escala;
    });
    alColocar && alColocar(objetos);              // p. ej., poner una mesita bajo cada objeto
  }
  colocar();

  // ---- 3. Interacción: pasar por encima, arrastrar para girar y tocar para entrar ----
  let bloqueado = false, arrastre = null;
  const mouse = new THREE.Vector2();
  const mallas = () => objetos.map(o => o.modelo);
  function objetoBajo(e){
    mouse.set(e.clientX/innerWidth*2 - 1, -(e.clientY/innerHeight)*2 + 1);
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObjects(mallas(), true)[0];
    return hit ? objetos.find(o => o.datos.id === hit.object.userData.objeto) : null;
  }
  function marcar(obj, on){
    if(obj.hover === on) return;
    obj.hover = on;
    obj.etiqueta.classList.toggle('on', on);
    gsap.to(obj.ajuste.scale, { x:obj.ajuste.scale.x/(on?1:1.07)*(on?1.07:1), y:obj.ajuste.scale.y/(on?1:1.07)*(on?1.07:1), z:obj.ajuste.scale.z/(on?1:1.07)*(on?1.07:1), duration:D(0.35), ease:'power2.out', overwrite:true });
  }
  lienzo.addEventListener('pointermove', e => {
    if(bloqueado) return;
    if(arrastre){
      const dx = e.clientX - arrastre.x, dy = e.clientY - arrastre.y;
      arrastre.movido = Math.max(arrastre.movido, Math.hypot(e.clientX - arrastre.x0, e.clientY - arrastre.y0));
      arrastre.obj.rot.y += dx * 0.012;
      arrastre.obj.rot.x = THREE.MathUtils.clamp(arrastre.obj.rot.x + dy * 0.008, -1.1, 1.1);
      arrastre.x = e.clientX; arrastre.y = e.clientY;
      return;
    }
    const o = objetoBajo(e);
    objetos.forEach(x => marcar(x, x === o));
    lienzo.style.cursor = o ? 'var(--cursor-dedo)' : '';
  });
  lienzo.addEventListener('pointerdown', e => {
    if(bloqueado) return;
    const o = objetoBajo(e); if(!o) return;
    arrastre = { obj:o, x:e.clientX, y:e.clientY, x0:e.clientX, y0:e.clientY, movido:0 };
    lienzo.setPointerCapture(e.pointerId);
    lienzo.style.cursor = 'var(--cursor-mano)';
    marcar(o, true);
  });
  const soltar = e => {
    if(!arrastre) return;
    const { obj, movido } = arrastre; arrastre = null;
    lienzo.style.cursor = 'var(--cursor-dedo)';
    if(e.type === 'pointerup' && movido < 6) activar(obj);   // un toque sin arrastrar = abrir
    else if(e.pointerType !== 'mouse') marcar(obj, false);
  };
  lienzo.addEventListener('pointerup', soltar);
  lienzo.addEventListener('pointercancel', soltar);

  function activar(obj){ if(!bloqueado) alActivar(obj); }

  // ---- 4. Animación por fotograma: flotar, girar despacio y colocar etiquetas ----
  const tmp = new THREE.Vector3();
  function animar(t, dt){
    objetos.forEach(o => {
      const libre = !o.hover && !(arrastre && arrastre.obj === o) && !reduceMotion;
      if(libre) o.rot.y += dt * 0.25;                                       // giro automático lento
      if(libre) o.rot.x += (o.base.x - o.rot.x) * Math.min(1, dt * 1.5);    // vuelve a su inclinación
      o.giro.rotation.x += (o.rot.x - o.giro.rotation.x) * Math.min(1, dt*10);
      o.giro.rotation.y += (o.rot.y - o.giro.rotation.y) * Math.min(1, dt*10);
      o.giro.position.y = reduceMotion ? 0 : Math.sin(t*0.9 + o.fase) * 0.12 / o.raiz.scale.y;   // flotar
      // Etiqueta
      tmp.copy(o.raiz.position); tmp.y += o.radioPantalla * 0.95; tmp.project(camera);      // encima del objeto
      const medio = o.etiqueta.offsetWidth / 2 + 8;                              // que no se salga de la pantalla
      const x = THREE.MathUtils.clamp((tmp.x*.5 + .5) * innerWidth, medio, innerWidth - medio), y = (-tmp.y*.5 + .5) * innerHeight;
      o.etiqueta.style.transform = `translate(${x}px, ${y}px) translate(-50%, 0)`;
    });
  }

  return {
    objetos, colocar, animar,
    bloquear(v){ bloqueado = v; if(v) objetos.forEach(o => marcar(o, false)); },
    detalles(){ objetos.forEach(o => o.detalle && o.detalle()); }
  };
}
