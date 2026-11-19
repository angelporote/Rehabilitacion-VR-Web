/* =========================================================
   util.js · Ayudas compartidas por toda la web
   (accesibilidad, gama del equipo, ayudas de modelado y texturas)
   Usa Three.js: solo para páginas con 3D. Lo que no necesita 3D está en datos.js
   ========================================================= */
import * as THREE from 'three';

export const gsap = window.gsap;                                         // GSAP se carga como script clásico en el HTML

// ¿El usuario prefiere menos movimiento? (ajuste de accesibilidad del sistema)
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isMobile = () => innerWidth < 760;
// "Gama baja": móvil o equipo con pocos núcleos / poca memoria → desactivamos lo más costoso
export const gamaBaja = isMobile() || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
export const D = d => reduceMotion ? 0 : d;                              // duración de animación (0 si se pide menos movimiento)

// ---- Ayudas de modelado ----
export function mesh(geo, mat, x=0, y=0, z=0, parent){ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); parent && parent.add(m); return m; }
export const bright = (hex, k) => new THREE.Color(hex).multiplyScalar(k);                         // colores > 1: brillan con el bloom
export const basicGlow = (hex, k=2) => new THREE.MeshBasicMaterial({ color:bright(hex,k), toneMapped:false });

// Rectángulo con esquinas redondeadas (forma 2D para extruir)
export function rrect(w, h, r){
  const s=new THREE.Shape(), x=-w/2, y=-h/2;
  s.moveTo(x+r,y); s.lineTo(x+w-r,y); s.quadraticCurveTo(x+w,y,x+w,y+r); s.lineTo(x+w,y+h-r); s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h); s.quadraticCurveTo(x,y+h,x,y+h-r); s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y); return s;
}
// Casquete esférico hueco: se genera girando un perfil 2D (LatheGeometry)
export function shell(rIn, rOut, seg=96){
  const pts=[];
  for(let i=0;i<=24;i++){ const a=i/24*Math.PI/2; pts.push(new THREE.Vector2(Math.sin(a)*rOut, Math.cos(a)*rOut)); }
  for(let i=24;i>=0;i--){ const a=i/24*Math.PI/2; pts.push(new THREE.Vector2(Math.sin(a)*rIn, Math.cos(a)*rIn)); }
  pts.push(pts[0].clone());
  return new THREE.LatheGeometry(pts, seg);
}
// Textura pintada con código en un <canvas>
export function canvasTex(w, h, draw){
  const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; return t;
}
