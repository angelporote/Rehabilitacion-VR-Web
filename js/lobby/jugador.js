/* =========================================================
   jugador.js · Moverse en primera persona por la habitación
   - WASD o flechas para caminar, ratón (o ←/→, Q/E) para mirar
   - Colisiones: no se atraviesan las paredes ni los muebles
   ========================================================= */
import * as THREE from 'three';

const RADIO = 0.3;          // "grosor" del jugador (m)
const VELOCIDAD = 2.0;      // m/s
const SENSIBILIDAD = 0.0022;

export function crearJugador({ camera, limites, obstaculos, altura = 1.6 }){
  const pos = new THREE.Vector3(0, altura, 0);
  let yaw = 0, pitch = 0, activo = false;
  const teclas = new Set();
  // W/↑ adelante, S/↓ atrás, A/D de lado, ←/→ y Q/E girar (así se puede jugar solo con teclado)
  const CODIGOS = { KeyW:'f', ArrowUp:'f', KeyS:'b', ArrowDown:'b', KeyA:'l', KeyD:'r', ArrowLeft:'gi', KeyQ:'gi', ArrowRight:'gd', KeyE:'gd' };
  const GIRO = 1.8;           // rad/s al girar con teclado

  addEventListener('keydown', e => { if(activo && CODIGOS[e.code]){ teclas.add(CODIGOS[e.code]); e.preventDefault(); } });
  addEventListener('keyup', e => { if(CODIGOS[e.code]) teclas.delete(CODIGOS[e.code]); });
  addEventListener('blur', () => teclas.clear());

  // Mirar: con el ratón capturado (pointer lock) o arrastrando si el navegador no lo permite
  function mirar(dx, dy){
    yaw -= dx * SENSIBILIDAD;
    pitch = THREE.MathUtils.clamp(pitch - dy * SENSIBILIDAD, -1.3, 1.3);
  }

  // Colisiones: dentro de las paredes y fuera de cada mueble (cajas en el plano XZ)
  function resolver(){
    pos.x = THREE.MathUtils.clamp(pos.x, limites.x0 + RADIO, limites.x1 - RADIO);
    pos.z = THREE.MathUtils.clamp(pos.z, limites.z0 + RADIO, limites.z1 - RADIO);
    for(const o of obstaculos){
      const ax0 = o.x0 - RADIO, ax1 = o.x1 + RADIO, az0 = o.z0 - RADIO, az1 = o.z1 + RADIO;
      if(pos.x <= ax0 || pos.x >= ax1 || pos.z <= az0 || pos.z >= az1) continue;
      // Empujamos hacia el lado más cercano
      const salidas = [[ax0 - pos.x, 0], [ax1 - pos.x, 0], [0, az0 - pos.z], [0, az1 - pos.z]];
      salidas.sort((a, b) => Math.abs(a[0] + a[1]) - Math.abs(b[0] + b[1]));
      pos.x += salidas[0][0]; pos.z += salidas[0][1];
    }
  }

  const adelante = new THREE.Vector3(), derecha = new THREE.Vector3(), paso = new THREE.Vector3();
  function actualizar(dt){
    if(!activo) return;
    adelante.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    derecha.set(Math.cos(yaw), 0, -Math.sin(yaw));
    paso.set(0, 0, 0);
    if(teclas.has('f')) paso.add(adelante);
    if(teclas.has('b')) paso.sub(adelante);
    if(teclas.has('r')) paso.add(derecha);
    if(teclas.has('l')) paso.sub(derecha);
    if(teclas.has('gi')) yaw += GIRO * dt;
    if(teclas.has('gd')) yaw -= GIRO * dt;
    if(paso.lengthSq() > 0){ paso.normalize().multiplyScalar(VELOCIDAD * dt); pos.add(paso); }
    resolver();
    // Un leve balanceo al caminar, para que se note el paso
    const bal = paso.lengthSq() > 0 ? Math.sin(performance.now() * 0.012) * 0.015 : 0;
    camera.position.set(pos.x, altura + bal, pos.z);
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
  }

  return {
    pos, mirar, actualizar,
    get yaw(){ return yaw; },
    activar(v){ activo = v; if(!v) teclas.clear(); },
    get activo(){ return activo; },
    // Coloca al jugador en un sitio mirando hacia un punto
    colocar(x, z, mirarA){
      pos.set(x, altura, z); resolver();
      yaw = Math.atan2(-(mirarA.x - pos.x), -(mirarA.z - pos.z));
      pitch = Math.atan2(mirarA.y - altura, Math.hypot(mirarA.x - pos.x, mirarA.z - pos.z));
    },
    // Orientación de la cámara para esa posición (para animar el paso de un modo a otro)
    vista(){ return { pos:new THREE.Vector3(pos.x, altura, pos.z), rot:new THREE.Euler(pitch, yaw, 0, 'YXZ') }; }
  };
}
