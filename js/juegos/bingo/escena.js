/* =========================================================
   juegos/bingo/escena.js · La sala del Bingo, como en Unity
   (Assets/_Proyecto/Juegos/Bingo/Herramientas/CreateBingoGame.cs)

   Medidas en metros y las mismas posiciones que en Unity, con el eje Z
   cambiado de signo (en Unity el paciente mira hacia +Z; aquí hacia -Z):
   ojos del paciente en (0, 1.2, 0.1), mesa a 0.74 m, bombo al fondo a la derecha,
   bandeja delante a la derecha, cesta en el centro y cartón a la izquierda.

   Exporta crear({ scene }) y devuelve lo que necesita la sala genérica
   (js/juego/main.js): límites y obstáculos, vistas, objetos que se tocan,
   la cinemática y la animación de cada fotograma.
   ========================================================= */
import * as THREE from 'three';
import { mesh, rrect } from '../../nucleo/util.js?v=202611201014';
import { U, MESA_Y, LIMITES, lit, texMadera, texTexto, crearSalaComun } from '../comun/sala.js?v=202611201014';

const OJOS = U(0, 1.2, -0.1);
const BOMBO = U(0.37, 0.95, 0.60), R_BOMBO = 0.095;
const DENTRO = U(0.37, 0.905, 0.585), BOCA = U(0.355, 0.88, 0.505);
const BANDEJA = U(0.25, 0.782, 0.29), AGUJERO = U(0.41, MESA_Y, 0.23);
const CESTA = U(0, MESA_Y, 0.31), CARTON = U(-0.28, 0.79, 0.27), MONITOR = U(0, 1.03, 0.50);
const R_BOLA = 0.034;

// ---- Materiales (colores de BingoAssets.cs) ----
const M = {
  laca:  lit(0x4B2C24, 0.3),
  acero: lit(0x8A9199, 0.4, 0.9),
  laton: lit(0xC79E57, 0.35, 0.9),
  negro: lit(0x0A0A0D, 0.9),
  crema: lit(0xF7EDD6, 0.2),
  cristal: new THREE.MeshPhysicalMaterial({ color:0xCCE6FF, roughness:0.05, transmission:0, transparent:true, opacity:0.16, depthWrite:false, side:THREE.DoubleSide }),
};

export function crear({ scene }){
  const { sala, obstaculos, silla } = crearSalaComun(scene, { texto:'BINGO', fondo:'#4B2C24', borde:'#C79E57', color:'#F2C14E' });

  /* ---------- Máquina de bingo: base, postes, bombo que gira, boca y rampa ---------- */
  const maquina = new THREE.Group(); sala.add(maquina);
  const base = U(0.37, MESA_Y, 0.60);
  mesh(new THREE.ExtrudeGeometry(rrect(0.22, 0.17, 0.014), { depth:0.07, bevelEnabled:false }), M.laca, base.x, base.y + 0.07, base.z, maquina).rotation.x = Math.PI/2;
  mesh(new THREE.ExtrudeGeometry(rrect(0.23, 0.18, 0.012), { depth:0.01, bevelEnabled:false }), M.laton, base.x, base.y + 0.08, base.z, maquina).rotation.x = Math.PI/2;
  for(const lado of [-1, 1]){
    const altoPoste = BOMBO.y - MESA_Y - 0.08;
    mesh(new THREE.CylinderGeometry(0.009, 0.009, altoPoste, 12), M.acero, BOMBO.x + lado*0.115, MESA_Y + 0.08 + altoPoste/2, BOMBO.z, maquina);
  }
  mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.25, 10), M.acero, BOMBO.x, BOMBO.y, BOMBO.z, maquina).rotation.z = Math.PI/2;

  const bombo = new THREE.Group(); bombo.position.copy(BOMBO); maquina.add(bombo);    // gira sobre su eje X
  const cristal = mesh(new THREE.SphereGeometry(R_BOMBO, 40, 28), M.cristal, 0, 0, 0, bombo); cristal.renderOrder = 2;
  for(let i = 0; i < 3; i++){
    const aro = mesh(new THREE.TorusGeometry(R_BOMBO + 0.002, 0.0028, 8, 64), M.laton, 0, 0, 0, bombo);
    aro.rotation.y = Math.PI/2; aro.rotation.x = i * Math.PI/3;   // aros que pasan por el eje, a 60°
  }
  mesh(new THREE.SphereGeometry(0.013, 16, 12), M.laton, -R_BOMBO, 0, 0, bombo);
  mesh(new THREE.SphereGeometry(0.013, 16, 12), M.laton, R_BOMBO, 0, 0, bombo);
  // Bolitas dentro, que dan vueltas con el bombo
  const bolitas = new THREE.Group(); bombo.add(bolitas);
  for(let i = 0; i < 12; i++){
    const p = new THREE.Vector3().randomDirection().multiplyScalar(0.03 + Math.random()*0.035);
    mesh(new THREE.SphereGeometry(0.016, 14, 10), M.crema, p.x, p.y, p.z, bolitas);
  }

  // Boca dorada y rampa (canal con barandillas) de la boca a la bandeja
  const bajada = BANDEJA.clone().sub(BOCA).normalize();
  const boca = mesh(new THREE.CylinderGeometry(0.0425, 0.0425, 0.02, 32), M.laton, 0, 0, 0, maquina);
  boca.position.copy(BOCA).addScaledVector(bajada, -0.01); boca.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bajada);
  const finRampa = BANDEJA.clone().addScaledVector(bajada, -0.05).add(new THREE.Vector3(0, -(R_BOLA + 0.003), 0));
  const iniRampa = BOCA.clone().add(new THREE.Vector3(0, -(R_BOLA + 0.003), 0));
  const largo = iniRampa.distanceTo(finRampa);
  const rampa = new THREE.Group(); rampa.position.copy(iniRampa).lerp(finRampa, 0.5); rampa.lookAt(finRampa); maquina.add(rampa);
  mesh(new THREE.BoxGeometry(0.078, 0.006, largo), M.acero, 0, -0.003, 0, rampa);
  mesh(new THREE.BoxGeometry(0.006, 0.026, largo), M.acero, -0.042, 0.01, 0, rampa);
  mesh(new THREE.BoxGeometry(0.006, 0.026, largo), M.acero, 0.042, 0.01, 0, rampa);
  const patita = finRampa.clone().lerp(iniRampa, 0.35);
  mesh(new THREE.CylinderGeometry(0.006, 0.006, patita.y - MESA_Y, 8), M.acero, patita.x, (patita.y + MESA_Y)/2, patita.z, maquina);

  // Bandeja y agujero de descarte
  mesh(new THREE.CylinderGeometry(0.0575, 0.0575, 0.008, 40), M.acero, BANDEJA.x, MESA_Y + 0.004, BANDEJA.z, sala);
  mesh(new THREE.CylinderGeometry(0.049, 0.049, 0.008, 40), lit(0x3A3F46, 0.5, 0.6), BANDEJA.x, MESA_Y + 0.008, BANDEJA.z, sala);
  mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.004, 40), M.acero, AGUJERO.x, MESA_Y + 0.002, AGUJERO.z, sala);
  mesh(new THREE.CylinderGeometry(0.041, 0.041, 0.004, 40), M.negro, AGUJERO.x, MESA_Y + 0.0045, AGUJERO.z, sala);

  /* ---------- Cesta del paciente (haya clara, 23 x 23 cm) ---------- */
  const haya = new THREE.MeshStandardMaterial({ map:texMadera('#D6B892', '150,110,70', 256, 256), roughness:0.6 });
  const cesta = new THREE.Group(); cesta.position.copy(CESTA); sala.add(cesta);
  const ext = 0.23, pared5 = 0.055;
  mesh(new THREE.BoxGeometry(ext, 0.01, ext), lit(0xB59A78, 0.7), 0, 0.005, 0, cesta);
  [[0, ext/2 - 0.005, ext, 0.01], [0, -ext/2 + 0.005, ext, 0.01], [ext/2 - 0.005, 0, 0.01, ext], [-ext/2 + 0.005, 0, 0.01, ext]]
    .forEach(([x, z, w, d]) => mesh(new THREE.BoxGeometry(w, pared5, d), haya, x, pared5/2, z, cesta));
  const rotulo = texTexto(512, 96, (g, w, h) => { g.fillStyle = '#1D2430'; g.font = '700 54px Sora, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TU CESTA', w/2, h/2 + 3); });
  mesh(new THREE.PlaneGeometry(0.18, 0.034), new THREE.MeshBasicMaterial({ map:rotulo, transparent:true }), 0, pared5/2, ext/2 + 0.0012, cesta);

  /* ---------- Cartón (25 x 15 cm, inclinado 20° hacia el paciente) ---------- */
  const NUMEROS = [3, 8, 18, 19];
  const carton = new THREE.Group(); carton.position.copy(CARTON); carton.rotation.x = -Math.PI/2 + 0.35; sala.add(carton);
  const caraCarton = texTexto(1000, 600, (g, w, h) => {
    g.fillStyle = '#E3A72F'; g.beginPath(); g.roundRect(0, 0, w, h, 26); g.fill();
    g.fillStyle = '#FBF6EA'; g.beginPath(); g.roundRect(28, 28, w - 56, h - 56, 14); g.fill();
    g.fillStyle = '#1D2430'; g.font = 'italic 700 48px Sora, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('TU CARTÓN', w/2, 86);
    const l = 190, gx = w/2 - l - 6, gy = 130;
    NUMEROS.forEach((n, i) => {
      const x = gx + (i % 2)*(l + 12), y = gy + Math.floor(i/2)*(l + 12);
      g.fillStyle = '#E3A72F'; g.fillRect(x - 6, y - 6, l + 12, l + 12);
      g.fillStyle = '#FFFDF6'; g.fillRect(x, y, l, l);
      g.fillStyle = '#23262F'; g.font = 'italic 600 112px Sora, system-ui, sans-serif'; g.fillText(String(n), x + l/2, y + l/2 + 6);
    });
  });
  const cartonM = new THREE.MeshStandardMaterial({ map:caraCarton, roughness:0.8, emissive:0xFFFFFF, emissiveMap:caraCarton, emissiveIntensity:0 });   // al resaltarlo brilla con sus propios colores
  mesh(new THREE.BoxGeometry(0.25, 0.15, 0.008), [M.laca, M.laca, M.laca, M.laca, cartonM, M.laca], 0, 0, 0.004, carton);
  mesh(new THREE.BoxGeometry(0.22, 0.12, 0.03), lit(0x2B3545, 0.5), 0, 0.005, -0.016, carton);   // peana

  /* ---------- Monitor (como el de la partida) ---------- */
  const monitor = new THREE.Group(); monitor.position.copy(MONITOR); monitor.rotation.x = -0.26; sala.add(monitor);
  const pantallaTex = texTexto(880, 540, (g, w, h) => {
    g.fillStyle = '#12151E'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#FFFFFF'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '700 46px Sora, system-ui, sans-serif'; g.fillText('Bola 1 de 10   ·   Cesta 0/4', w/2, 92);
    g.fillStyle = '#C4CCDD'; g.font = '400 32px Sora, system-ui, sans-serif';
    g.fillText('Si el número es tuyo, coge la bola', w/2, 190); g.fillText('y métela en tu cesta', w/2, 232);
    [['‹ Nivel', 250], ['Reiniciar', 440], ['‹ Juegos', 630]].forEach(([t, x]) => {
      g.fillStyle = '#566078'; g.beginPath(); g.roundRect(x - 85, 330, 170, 70, 8); g.fill();
      g.fillStyle = '#FFFFFF'; g.font = '600 28px Sora, system-ui, sans-serif'; g.fillText(t, x, 366);
    });
  });
  mesh(new THREE.BoxGeometry(0.46, 0.29, 0.016), lit(0x1B1D22, 0.4, 0.3), 0, 0, -0.012, monitor);
  mesh(new THREE.PlaneGeometry(0.44, 0.27), new THREE.MeshBasicMaterial({ map:pantallaTex, toneMapped:false }), 0, 0, -0.0035, monitor);
  const pieM = lit(0x26282E, 0.5, 0.4);
  mesh(new THREE.BoxGeometry(0.05, MONITOR.y - MESA_Y - 0.1, 0.02), pieM, 0, MESA_Y + (MONITOR.y - MESA_Y - 0.1)/2, MONITOR.z - 0.03, sala);
  mesh(new THREE.BoxGeometry(0.2, 0.016, 0.09), pieM, 0, MESA_Y + 0.008, MONITOR.z - 0.03, sala);

  /* ---------- La bola (6,8 cm) con su número en un disco blanco que mira a los ojos ---------- */
  function crearBola(numero, color){
    const g = new THREE.Group();
    const cuerpoM = new THREE.MeshStandardMaterial({ color, roughness:0.15, emissive:color, emissiveIntensity:0 });
    mesh(new THREE.SphereGeometry(R_BOLA, 40, 28), cuerpoM, 0, 0, 0, g);
    const disco = new THREE.Group(); g.add(disco);
    const num = texTexto(256, 256, (c, w, h) => {
      c.fillStyle = '#FDFAF2'; c.beginPath(); c.arc(w/2, h/2, w/2 - 4, 0, 7); c.fill();
      c.fillStyle = '#1D2430'; c.font = '700 132px Sora, system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(numero), w/2, h/2 + 8);
    });
    mesh(new THREE.CircleGeometry(0.019, 40), new THREE.MeshBasicMaterial({ map:num, transparent:true }), 0, 0, R_BOLA + 0.0012, disco);
    g.userData = { disco, cuerpoM };
    return g;
  }
  const bola = crearBola(18, 0xE0703F);
  bola.position.copy(DENTRO); bola.visible = false; sala.add(bola);

  /* ---------- Objetos que se tocan ---------- */
  const brillo = (mat, k) => (on, gsap) => gsap.to(mat, { emissiveIntensity:on ? k : 0, duration:0.25 });
  const tocables = [
    { id:'carton', nombre:'El cartón', ayuda:'Cómo se juega', objeto:carton, estilo:'desplegar',
      ancla:() => carton.localToWorld(new THREE.Vector3(0, 0.1, 0.02)), resaltar:brillo(cartonM, 0.1) },
    { id:'bola', nombre:'La bola', ayuda:'Cómo se guardan los datos', objeto:bola, estilo:'acercar',
      ancla:() => bola.localToWorld(new THREE.Vector3(0, R_BOLA + 0.045, 0)), resaltar:brillo(bola.userData.cuerpoM, 0.45) },
  ];

  /* ---------- Vistas ---------- */
  // Sentado, con la cabeza algo echada atrás para ver la mesa entera (como las capturas de Unity)
  const SENTADO = new THREE.Vector3(0, 1.4, 0.38), MIRA_MESA = new THREE.Vector3(0, 0.84, -0.42);
  const vistaMesa = () => ({ pos:SENTADO.clone(), mira:MIRA_MESA.clone() });

  /* ---------- Cinemática: el bombo gira, suelta una bola y la seguimos hasta la bandeja ---------- */
  let giro = 0.8;                       // velocidad del bombo (rad/s)
  function cinematica(tl, cam){
    // cam = { pos, mira, fov }: la sala genérica coloca la cámara con esto en cada fotograma
    const p0 = SENTADO.clone(), mira0 = BOMBO.clone();
    tl.set(cam.pos, { x:p0.x, y:p0.y, z:p0.z }, 0)
      .set(cam.mira, { x:mira0.x, y:mira0.y, z:mira0.z }, 0)
      .set(cam, { fov:16 }, 0)
      .call(() => { bola.visible = false; bola.position.copy(DENTRO); giro = 0.8; }, null, 0)
      // El bombo acelera y da vueltas
      .to({ v:0.8 }, { v:7, duration:1.6, ease:'power2.in', onUpdate(){ giro = this.targets()[0].v; } }, 0.3)
      .to(cam, { fov:13, duration:2.4, ease:'sine.inOut' }, 0.3)
      .to({ v:7 }, { v:1.2, duration:1.0, ease:'power2.out', onUpdate(){ giro = this.targets()[0].v; } }, 2.3)
      // Sale la bola por la boca
      .call(() => { bola.visible = true; }, null, 2.7)
      .to(bola.position, { x:BOCA.x, y:BOCA.y, z:BOCA.z, duration:0.45, ease:'power1.in' }, 2.7)
      // Baja por la rampa: la cámara la sigue y se abre el plano
      .to(bola.position, { x:BANDEJA.x, y:BANDEJA.y, z:BANDEJA.z, duration:1.6, ease:'power1.in' }, 3.15)
      .to(cam.mira, { x:BANDEJA.x, y:BANDEJA.y, z:BANDEJA.z, duration:1.75, ease:'sine.inOut' }, 2.9)
      .to(cam, { fov:22, duration:1.75, ease:'sine.inOut' }, 2.9)
      // Un pequeño bote al llegar a la bandeja
      .to(bola.position, { y:BANDEJA.y + 0.012, duration:0.14, ease:'power1.out', yoyo:true, repeat:1 }, 4.75)
      // Y la vista vuelve a la mesa entera
      .to(cam.mira, { x:MIRA_MESA.x, y:MIRA_MESA.y, z:MIRA_MESA.z, duration:1.4, ease:'power2.inOut' }, 5.3)
      .to(cam, { fov:50, duration:1.4, ease:'power2.inOut' }, 5.3)
      .call(() => { giro = 0.8; }, null, 5.3);
    return tl;
  }
  // Estado final de la cinemática (para saltarla)
  function finCinematica(){ bola.visible = true; bola.position.copy(BANDEJA); giro = 0.8; }

  /* ---------- Cada fotograma ---------- */
  const ojo = new THREE.Vector3();
  function animar(t, dt, camera){
    bombo.rotation.x -= giro * dt;
    bolitas.rotation.y += giro * 0.6 * dt;
    // El número de la bola siempre mira a los ojos (como en BingoBall.cs)
    camera.getWorldPosition(ojo);
    bola.userData.disco.lookAt(ojo);
  }

  // En el plano: la mesa y la máquina
  function dibujarPlano(g, X, Z, k){
    g.fillStyle = '#E8A93A'; g.beginPath(); g.arc(X(BOMBO.x), Z(BOMBO.z), Math.max(3, R_BOMBO*k*1.5), 0, 7); g.fill();
  }

  return {
    limites:LIMITES, obstaculos, silla, ojos:OJOS, vistaMesa, tocables, cinematica, finCinematica, animar, dibujarPlano,
    inicioLibre:{ x:0.75, z:0.75, mira:MIRA_MESA.clone() },
  };
}
