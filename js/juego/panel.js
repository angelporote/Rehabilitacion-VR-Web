/* =========================================================
   juego/panel.js · El panel grande que se despliega al tocar un objeto
   Texto que baja a la izquierda (por secciones) y, a la derecha, la captura
   o el dibujo de la sección que se está leyendo.
   Dos formas de aparecer:
   - "desplegar": como un papel que se abre (primero a lo ancho, luego a lo alto)
   - "acercar":   un círculo que se abre desde el centro (sale de la bola)
   ========================================================= */
import { gsap, reduceMotion } from '../nucleo/util.js?v=202611201014';
import { esc } from '../nucleo/datos.js?v=202611201014';
import { VISTAS, animarVista } from './vistas.js?v=202611201014';

export function crearPanel(juego){
  const $ = id => document.getElementById(id);
  const panel = $('panel'), texto = $('panelTexto'), visual = $('panelVisual'), barra = $('panelBarra');
  panel.style.setProperty('--c', juego.color);
  let capas = [], articulos = [], activa = -1, abierto = false, estilo = 'desplegar';

  function montar(p, ejemplo){
    $('panelFam').textContent = `${juego.nombre} · ${p.etiqueta}`;
    $('panelTitulo').textContent = p.titulo;
    texto.innerHTML = `<p class="intro">${esc(p.intro)}</p><p class="baja">↓ Baja para seguir: rueda del ratón, flechas o barra espaciadora</p>` +
      p.secciones.map((s, i) => `<article data-i="${i}"><h3>${esc(s.titulo)}</h3>${s.texto ? `<p>${esc(s.texto)}</p>` : ''}${
        s.lista ? `<ul>${s.lista.map(l => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}${
        s.tabla ? `<table>${s.tabla.map((f, j) => `<tr>${f.map(c => j ? `<td>${esc(c)}</td>` : `<th>${esc(c)}</th>`).join('')}</tr>`).join('')}</table>` : ''}</article>`).join('');
    visual.innerHTML = p.secciones.map(s => `<div class="capa">${
      s.imagen ? `<img src="${esc(s.imagen)}" alt="" loading="lazy" decoding="async"><figcaption>${esc(s.pie || '')}</figcaption>`
      : VISTAS[s.vista] ? VISTAS[s.vista](ejemplo || {}) : ''}</div>`).join('');
    capas = [...visual.children]; articulos = [...texto.querySelectorAll('article')];
    activa = -1; texto.scrollTop = 0; activar(0);
  }

  // La sección activa es la última que ha pasado del primer cuarto de la altura del texto
  function activar(i){
    if(i === activa || !capas[i]) return;
    capas[activa]?.classList.remove('activa'); articulos[activa]?.classList.remove('activa');
    activa = i;
    capas[i].classList.add('activa'); articulos[i].classList.add('activa');
    animarVista(capas[i]);
  }
  let guiadoHasta = 0;      // mientras baja solo por teclado, la sección la marca el teclado
  texto.addEventListener('scrollend', () => { guiadoHasta = 0; });
  texto.addEventListener('scroll', () => {
    const max = texto.scrollHeight - texto.clientHeight;
    barra.style.width = (max > 0 ? texto.scrollTop/max*100 : 100) + '%';
    if(performance.now() < guiadoHasta) return;
    const tope = texto.getBoundingClientRect().top + texto.clientHeight*0.25;
    let i = 0;
    articulos.forEach((a, j) => { if(a.getBoundingClientRect().top < tope) i = j; });
    activar(i);
  }, { passive:true });

  // Teclado: ↓ / Av Pág / Espacio pasan a la sección siguiente; ↑ / Re Pág, a la anterior; Inicio y Fin
  texto.addEventListener('keydown', e => {
    const paso = { ArrowDown:1, PageDown:1, Space:e.shiftKey ? -1 : 1, ArrowUp:-1, PageUp:-1 }[e.code];
    let i = null;
    if(paso !== undefined) i = Math.max(-1, Math.min(articulos.length - 1, activa + paso));
    else if(e.code === 'Home') i = -1;
    else if(e.code === 'End') i = articulos.length - 1;
    if(i === null) return;
    e.preventDefault();
    const destino = i < 0 ? 0 : texto.scrollTop + articulos[i].getBoundingClientRect().top - texto.getBoundingClientRect().top - texto.clientHeight*0.08;
    guiadoHasta = performance.now() + 1500;
    texto.scrollTo({ top:destino, behavior:reduceMotion ? 'auto' : 'smooth' });
    if(i >= 0) activar(i);
  });

  function abrir(p, ejemplo, como){
    estilo = como; abierto = true;
    panel.style.setProperty('--c', juego.color);     // (al cerrar se limpian los estilos en línea)
    montar(p, ejemplo);
    panel.hidden = false; barra.style.width = '0%';
    const fin = () => texto.focus({ preventScroll:true });
    if(reduceMotion){ fin(); return Promise.resolve(); }
    return new Promise(res => {
      const tl = gsap.timeline({ onComplete:() => { fin(); res(); } });
      if(como === 'acercar'){
        tl.fromTo(panel, { clipPath:'circle(3% at 50% 50%)' }, { clipPath:'circle(75% at 50% 50%)', duration:0.75, ease:'power2.inOut', clearProps:'clipPath' });
      } else {
        tl.fromTo(panel, { scaleX:0.3, scaleY:0.05, opacity:0.4 }, { scaleX:1, opacity:1, duration:0.35, ease:'power2.out' })
          .to(panel, { scaleY:1, duration:0.5, ease:'power3.out', clearProps:'transform' });
      }
      tl.from([texto, visual], { opacity:0, duration:0.35, stagger:0.1 }, '-=0.15');
    });
  }

  function cerrar(){
    if(!abierto) return Promise.resolve();
    abierto = false;
    const fin = () => { panel.hidden = true; gsap.set(panel, { clearProps:'all' }); };
    if(reduceMotion){ fin(); return Promise.resolve(); }
    return new Promise(res => {
      const tl = gsap.timeline({ onComplete:() => { fin(); res(); } });
      if(estilo === 'acercar') tl.to(panel, { clipPath:'circle(3% at 50% 50%)', duration:0.5, ease:'power2.in' });
      else tl.to(panel, { scaleY:0.05, duration:0.35, ease:'power2.in' }).to(panel, { scaleX:0.3, opacity:0, duration:0.25, ease:'power2.in' });
    });
  }

  return { abrir, cerrar, get abierto(){ return abierto; } };
}
