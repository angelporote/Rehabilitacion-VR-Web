/* =========================================================
   plano.js · El plano de la esquina: la habitación vista desde arriba,
   los muebles y dónde estás (con un abanico hacia donde miras).
   Lo usan el Lobby y las salas de los juegos.
   ========================================================= */
import * as THREE from 'three';

// lienzo: <canvas>; limites: { x0, x1, z0, z1 }; obstaculos: [{ x0, x1, z0, z1 }]
// extra(g, X, Z, escala): para dibujar algo propio de cada sala (la pantalla, la mesa…)
export function crearPlano(lienzo, limites, obstaculos, extra){
  const g = lienzo.getContext('2d'), dir = new THREE.Vector3();
  return function pintar(camera){
    const { x0, x1, z0, z1 } = limites, w = lienzo.width, h = lienzo.height, m = 8;
    const k = Math.min((w - m*2)/(x1 - x0), (h - m*2)/(z1 - z0));
    const X = x => m + (x - x0)*k + ((w - m*2) - (x1 - x0)*k)/2, Z = z => m + (z - z0)*k;
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,246,236,.08)'; g.strokeStyle = 'rgba(255,246,236,.5)'; g.lineWidth = 2;
    g.fillRect(X(x0), Z(z0), (x1 - x0)*k, (z1 - z0)*k); g.strokeRect(X(x0), Z(z0), (x1 - x0)*k, (z1 - z0)*k);
    g.fillStyle = 'rgba(210,192,172,.55)';
    obstaculos.forEach(o => g.fillRect(X(o.x0), Z(o.z0), (o.x1 - o.x0)*k, (o.z1 - o.z0)*k));
    extra && extra(g, X, Z, k);
    // Dónde estás y hacia dónde miras
    const px = X(camera.position.x), pz = Z(camera.position.z);
    camera.getWorldDirection(dir);
    const a = Math.atan2(dir.z, dir.x);
    g.fillStyle = 'rgba(95,242,210,.25)'; g.beginPath(); g.moveTo(px, pz); g.arc(px, pz, 22, a - 0.5, a + 0.5); g.fill();
    g.fillStyle = '#FFF6EC'; g.beginPath(); g.arc(px, pz, 4.5, 0, 7); g.fill();
  };
}
