/* =========================================================
   juegos/memoria/escena.js · La sala de Memoria de cartas, como en Unity
   (Assets/_Proyecto/Juegos/Memoria/Herramientas/CreateMemoryGame.cs y MemoryGame.cs)

   Tablero oscuro inclinado 25° hacia el paciente, con el centro en (0, 1.06, 0.38)
   de Unity y 0,90 x 0,66 m de zona útil. Nivel Normal: 4 x 3 cartas (6 parejas),
   casillas de 16 cm con 2 cm de hueco. Las caras y el dorso son las texturas de
   Unity (img/vr/memoria/cartas/); el plátano es nuevo, dibujado con el mismo estilo.

   Los dos plátanos son los objetos que se tocan: el de la izquierda explica
   cómo se juega y el de la derecha cómo se guardan los datos.
   ========================================================= */
import * as THREE from 'three';
import { mesh } from '../../nucleo/util.js?v=202611201014';
import { U, MESA_Y, LIMITES, lit, crearSalaComun } from '../comun/sala.js?v=202611201014';

const CENTRO = U(0, 1.06, 0.38), INCLINACION = THREE.MathUtils.degToRad(25);
const COLS = 4, FILAS = 3, CELDA = 0.16, PASO = 0.18, ZONA_Y = -0.05;
const GROSOR = 0.06*CELDA, DIBUJO = 0.90;                     // el dibujo ocupa el 90 %: el resto es el borde (verde al emparejar)
const COLOR_CARTA = 0xF7F5EB, COLOR_PAREJA = 0x38C455;        // MemoryCard.bodyColor / matchedColor
const RUTA = '../img/vr/memoria/cartas/';
// Reparto fijo (fila a fila): los plátanos en la fila del medio, uno a cada lado
const REPARTO = ['cara-00', 'cara-03', 'cara-01', 'cara-05',
                 'cara-platano', 'cara-02', 'cara-05', 'cara-platano',
                 'cara-01', 'cara-00', 'cara-03', 'cara-02'];
const IZQ = 4, DER = 7;

const cargador = new THREE.TextureLoader();
const texturas = {};
function tex(nombre){
  if(!texturas[nombre]){ const t = cargador.load(RUTA + nombre + '.png'); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; texturas[nombre] = t; }
  return texturas[nombre];
}

export function crear({ scene }){
  const { sala, obstaculos, silla } = crearSalaComun(scene, { texto:'MEMORIA', fondo:'#22468F', borde:'#F7CC40', color:'#FFFFFF' });

  /* ---------- Tablero: marco, pata y pantalla oscura ---------- */
  const tablero = new THREE.Group(); tablero.position.copy(CENTRO); tablero.rotation.x = -INCLINACION; sala.add(tablero);
  const caja = lit(0x1E2026, 0.45, 0.3), acero = lit(0x34373D, 0.4, 0.6);
  mesh(new THREE.BoxGeometry(0.96, 0.72, 0.012), caja, 0, 0, -0.05, tablero);
  [[0, 0.345, 0.96, 0.03], [0, -0.345, 0.96, 0.03], [-0.465, 0, 0.03, 0.72], [0.465, 0, 0.03, 0.72]]
    .forEach(([x, y, w, h]) => mesh(new THREE.BoxGeometry(w, h, 0.05), caja, x, y, -0.03, tablero));
  // Pantalla: marcador y botones arriba (como el HUD de la partida)
  let parejas = 0, intentos = 0;
  const lienzoHud = document.createElement('canvas'); lienzoHud.width = 900; lienzoHud.height = 660;
  const hudTex = new THREE.CanvasTexture(lienzoHud); hudTex.colorSpace = THREE.SRGBColorSpace;
  function pintarHud(){
    const g = lienzoHud.getContext('2d'), w = 900;
    g.fillStyle = '#12161F'; g.fillRect(0, 0, w, 660);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#FFFFFF'; g.font = '700 32px Sora, system-ui, sans-serif';
    g.fillText(`Parejas ${parejas}/6   ·   Intentos ${intentos}`, w/2, 50);
    [['‹ Nivel', 85], ['Reiniciar', 815]].forEach(([t, x]) => {
      g.fillStyle = '#566078'; g.beginPath(); g.roundRect(x - 85, 18, 170, 64, 8); g.fill();
      g.fillStyle = '#FFFFFF'; g.font = '600 28px Sora, system-ui, sans-serif'; g.fillText(t, x, 51);
    });
    hudTex.needsUpdate = true;
  }
  pintarHud();
  mesh(new THREE.PlaneGeometry(0.90, 0.66), new THREE.MeshBasicMaterial({ map:hudTex, toneMapped:false }), 0, 0, -0.02, tablero);
  // Pata trasera hasta la mesa y peana
  tablero.updateMatrixWorld(true);
  const pata = tablero.localToWorld(new THREE.Vector3(0, 0.15, -0.08)), suelo = U(0, MESA_Y, 0.70);
  const largo = pata.distanceTo(suelo);
  const barra = mesh(new THREE.BoxGeometry(0.08, 0.04, largo), acero, 0, 0, 0, sala);
  barra.position.copy(pata).lerp(suelo, 0.5); barra.lookAt(pata);
  mesh(new THREE.BoxGeometry(0.40, 0.03, 0.12), acero, 0, MESA_Y + 0.015, U(0, 0, 0.68).z, sala);

  /* ---------- Cartas ---------- */
  const geoCuerpo = new THREE.BoxGeometry(CELDA, CELDA, GROSOR), geoDibujo = new THREE.PlaneGeometry(CELDA*DIBUJO, CELDA*DIBUJO);
  const dorsoM = new THREE.MeshBasicMaterial({ map:tex('dorso'), toneMapped:false });
  const cartas = REPARTO.map((cara, i) => {
    const col = i % COLS, fila = Math.floor(i / COLS);
    const raiz = new THREE.Group();
    raiz.position.set((col - (COLS - 1)/2)*PASO, ZONA_Y + ((FILAS - 1)/2 - fila)*PASO, 0);
    tablero.add(raiz);
    const visual = new THREE.Group(); visual.position.z = GROSOR/2; raiz.add(visual);    // lo que gira
    const cuerpoM = new THREE.MeshStandardMaterial({ color:COLOR_CARTA, roughness:0.6, emissive:0x59D973, emissiveIntensity:0 });
    mesh(geoCuerpo, cuerpoM, 0, 0, 0, visual);
    mesh(geoDibujo, dorsoM, 0, 0, GROSOR/2 + 0.0008, visual);                          // el dorso mira al paciente
    const caraM = new THREE.MeshBasicMaterial({ map:tex(cara), toneMapped:false });
    mesh(geoDibujo, caraM, 0, 0, -(GROSOR/2 + 0.0008), visual).rotation.y = Math.PI;     // el dibujo, por detrás: aparece al girar
    return { raiz, visual, cuerpoM, cara };
  });

  /* ---------- Darse la vuelta y quedar emparejadas ---------- */
  function voltear(tl, c, en, dur = 0.7){
    tl.to(c.visual.position, { z:GROSOR/2 + 0.06, duration:dur/2, ease:'power1.out', yoyo:true, repeat:1 }, en)   // se levanta un poco al girar
      .to(c.visual.rotation, { y:Math.PI, duration:dur, ease:'power2.inOut' }, en);
  }
  function emparejar(tl, c, en){
    const col = new THREE.Color(COLOR_PAREJA);
    tl.to(c.cuerpoM.color, { r:col.r, g:col.g, b:col.b, duration:0.35 }, en)
      .to(c.raiz.scale, { x:1.08, y:1.08, duration:0.18, yoyo:true, repeat:1, ease:'power1.out' }, en);
  }
  const izq = cartas[IZQ], der = cartas[DER];

  /* ---------- Objetos que se tocan: los dos plátanos ---------- */
  const brillo = (c) => (on, gsap) => gsap.to(c.cuerpoM, { emissiveIntensity:on ? 0.5 : 0, duration:0.25 });
  const tocables = [
    { id:'carta-izquierda', nombre:'El plátano de la izquierda', ayuda:'Cómo se juega', objeto:izq.raiz, estilo:'desplegar',
      ancla:() => izq.raiz.localToWorld(new THREE.Vector3(0, CELDA*0.6, 0.02)), resaltar:brillo(izq) },
    { id:'carta-derecha', nombre:'El plátano de la derecha', ayuda:'Cómo se guardan los datos', objeto:der.raiz, estilo:'acercar',
      ancla:() => der.raiz.localToWorld(new THREE.Vector3(0, CELDA*0.6, 0.02)), resaltar:brillo(der) },
  ];

  /* ---------- Vistas ---------- */
  const SENTADO = new THREE.Vector3(0, 1.42, 0.6), MIRA = CENTRO.clone().add(new THREE.Vector3(0, -0.02, 0));
  const vistaMesa = () => ({ pos:SENTADO.clone(), mira:MIRA.clone() });

  /* ---------- Cinemática: se dan la vuelta los dos plátanos y quedan emparejados ---------- */
  const posIzq = () => izq.raiz.getWorldPosition(new THREE.Vector3());
  const posDer = () => der.raiz.getWorldPosition(new THREE.Vector3());
  function estadoInicial(){
    cartas.forEach(c => { c.visual.rotation.y = 0; c.visual.position.z = GROSOR/2; c.cuerpoM.color.setHex(COLOR_CARTA); c.raiz.scale.set(1, 1, 1); });
    parejas = 0; intentos = 0; pintarHud();
  }
  function cinematica(tl, cam){
    tablero.updateMatrixWorld(true);
    const a = posIzq(), b = posDer();
    tl.call(estadoInicial, null, 0)
      .set(cam.pos, { x:SENTADO.x, y:SENTADO.y, z:SENTADO.z }, 0)
      .set(cam.mira, { x:MIRA.x, y:MIRA.y, z:MIRA.z }, 0)
      .set(cam, { fov:40 }, 0)
      // La mirada va a la carta de la izquierda y se da la vuelta: un plátano
      .to(cam.mira, { x:a.x, y:a.y, z:a.z, duration:1.1, ease:'sine.inOut' }, 0.5)
      .to(cam, { fov:26, duration:1.1, ease:'sine.inOut' }, 0.5);
    voltear(tl, izq, 1.6);
    // Pasa a la de la derecha: otro plátano
    tl.to(cam.mira, { x:b.x, y:b.y, z:b.z, duration:1.2, ease:'sine.inOut' }, 2.7);
    voltear(tl, der, 3.9);
    // Se abre la vista a las dos y quedan en verde: ¡pareja!
    tl.to(cam.mira, { x:MIRA.x, y:a.y, z:(a.z + b.z)/2, duration:0.9, ease:'sine.inOut' }, 4.8)
      .to(cam, { fov:32, duration:0.9, ease:'sine.inOut' }, 4.8)
      .call(() => { parejas = 1; intentos = 1; pintarHud(); }, null, 5.3);
    emparejar(tl, izq, 5.3); emparejar(tl, der, 5.3);
    tl.to(cam.mira, { x:MIRA.x, y:MIRA.y, z:MIRA.z, duration:1.3, ease:'power2.inOut' }, 6.4)
      .to(cam, { fov:50, duration:1.3, ease:'power2.inOut' }, 6.4);
    return tl;
  }
  function finCinematica(){
    estadoInicial();
    [izq, der].forEach(c => { c.visual.rotation.y = Math.PI; c.cuerpoM.color.setHex(COLOR_PAREJA); });
    parejas = 1; intentos = 1; pintarHud();
  }

  function animar(){}
  function dibujarPlano(g, X, Z, k){
    g.fillStyle = '#2BA3B0'; g.fillRect(X(-0.45), Z(CENTRO.z) - 2, 0.9*k, 4);
  }

  return { limites:LIMITES, obstaculos, silla, vistaMesa, tocables, cinematica, finCinematica, animar, dibujarPlano,
    inicioLibre:{ x:0.8, z:0.8, mira:CENTRO.clone() } };
}
