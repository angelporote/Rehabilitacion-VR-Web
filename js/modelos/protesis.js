/* =========================================================
   protesis.js · Prótesis total de cadera modelada por código
   Mismo modelo que la portada de "Dentro del implante":
   cabeza cerámica, inserto de polietileno, cotilo de titanio poroso y vástago.
   ========================================================= */
import * as THREE from 'three';
import { gamaBaja, canvasTex, shell } from '../nucleo/util.js';

export function crear(){
  // ---- Materiales PBR (metalness y roughness imitan cada material real) ----
  const M = {
    stem:  new THREE.MeshPhysicalMaterial({ color:0xE4E7EE, metalness:1, roughness:0.3, anisotropy:0.6 }),
    cup:   new THREE.MeshPhysicalMaterial({ color:0xC6CCD8, metalness:1, roughness:0.16 }),
    cupOuter: new THREE.MeshPhysicalMaterial({ color:0xB4BAC7, metalness:0.9, roughness:0.8 }),
    liner: new THREE.MeshPhysicalMaterial({ color:0xF8F3E8, metalness:0, roughness:0.35, clearcoat:0.25, sheen:0.4, sheenColor:0xFFF6DE, transparent:true, opacity:0.9 }),
    head:  new THREE.MeshPhysicalMaterial({ color:0xF6EAEF, metalness:0, roughness:0.08, clearcoat:1, clearcoatRoughness:0.03, ior:1.76, sheen:0.25, sheenColor:0xFFE3EA })
  };

  const grupo = new THREE.Group();

  // Cabeza: esfera pulida
  grupo.add(new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), M.head));

  // Inserto y cotilo: dos casquetes con la abertura hacia el fémur
  const liner = new THREE.Mesh(shell(1.04, 1.26, 64), M.liner); liner.rotation.z = 0.62;
  const cup   = new THREE.Mesh(shell(1.28, 1.48, 64), M.cup);   cup.rotation.z = 0.62;
  const cupOuter = new THREE.Mesh(new THREE.SphereGeometry(1.492, 72, 32, 0, Math.PI*2, 0, Math.PI/2), M.cupOuter); cupOuter.rotation.z = 0.62;
  grupo.add(liner, cup, cupOuter);

  // Vástago: silueta 2D extruida con bisel + cuello cilíndrico (cono Morse)
  const s = new THREE.Shape();
  s.moveTo(0.55,-1.05); s.lineTo(1.25,-1.18); s.quadraticCurveTo(1.95,-1.35, 1.9,-2.0);
  s.lineTo(1.62,-6.0); s.quadraticCurveTo(1.45,-6.55, 1.22,-6.0); s.lineTo(1.0,-3.4);
  s.quadraticCurveTo(0.9,-2.0, 0.5,-1.55); s.closePath();
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth:0.42, bevelEnabled:true, bevelThickness:0.14, bevelSize:0.12, bevelSegments:6, curveSegments:32 }), M.stem);
  body.position.z = -0.21;
  const neckDir = new THREE.Vector3(0.62,-0.78,0).normalize();
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 1.75, 48), M.stem);
  neck.position.copy(neckDir.clone().multiplyScalar(0.95));
  neck.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), neckDir.clone().negate());
  grupo.add(body, neck);

  // Texturas pintadas con código (costosas): se generan después del primer fotograma
  function detalle(){
    const T = gamaBaja ? 0.5 : 1;
    // Titanio trabecular del cotilo: celdas abiertas, como una espuma metálica
    const poros = canvasTex(1024*T, 1024*T, (g,w,h)=>{
      g.fillStyle='#9c9c9c'; g.fillRect(0,0,w,h);
      for(let i=0;i<2400*T*T;i++){ const x=Math.random()*w, y=Math.random()*h, r=(5+Math.random()*10)*T;
        const gr=g.createRadialGradient(x,y,r*.15,x,y,r); gr.addColorStop(0,'#1e1e1e'); gr.addColorStop(.65,'#4a4a4a'); gr.addColorStop(1,'rgba(225,225,225,.6)');
        g.fillStyle=gr; g.beginPath(); g.arc(x,y,r,0,7); g.fill(); }
    });
    poros.repeat.set(5, 2.5); poros.colorSpace = THREE.SRGBColorSpace;
    // Vástago: titanio cepillado y, arriba, recubrimiento rugoso de hidroxiapatita
    const COAT = 0.36;
    const lienzo = color => canvasTex(512*T, 1024*T, (g,w,h)=>{
      g.fillStyle = color ? '#E4E7EE' : '#2E2E2E'; g.fillRect(0,0,w,h);
      for(let i=0;i<1400*T;i++){ g.fillStyle = color ? `rgba(160,168,185,${Math.random()*.12})` : `rgba(110,110,110,${Math.random()*.3})`; g.fillRect(0,Math.random()*h,w,1); }
      const ch = h*COAT;
      g.fillStyle = color ? '#B9B3A4' : '#DADADA'; g.fillRect(0,0,w,ch);
      for(let i=0;i<26000*T*T;i++){ const v=Math.random();
        g.fillStyle = color ? `rgba(${v>.5?250:120},${v>.5?246:114},${v>.5?235:102},.55)` : `rgba(${v>.5?255:90},${v>.5?255:90},${v>.5?255:90},.6)`;
        g.fillRect(Math.random()*w, Math.random()*(ch-20*T), 2, 2); }
    });
    const stemColor = lienzo(true), stemRough = lienzo(false);
    [stemColor, stemRough].forEach(t=>{ t.repeat.set(1/1.7, 1/5.75); t.offset.set(-0.35/1.7, 6.65/5.75); });
    stemColor.colorSpace = THREE.SRGBColorSpace;
    Object.assign(M.stem, { color:new THREE.Color(0xFFFFFF), map:stemColor, roughness:1, roughnessMap:stemRough, bumpMap:stemRough, bumpScale:0.6 });
    Object.assign(M.cupOuter, { map:poros, roughness:1, roughnessMap:poros, bumpMap:poros, bumpScale:3 });
    M.stem.needsUpdate = M.cupOuter.needsUpdate = true;
  }

  // Inclinación anatómica ligera
  grupo.rotation.z = 0.08;
  return { grupo, detalle };
}
