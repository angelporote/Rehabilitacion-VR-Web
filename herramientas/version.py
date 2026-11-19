#!/usr/bin/env python3
"""
version.py · Pone un número de versión a los archivos propios de la web
para que el navegador coja siempre la versión nueva al publicar.

GitHub Pages deja que el navegador guarde los archivos unos 10 minutos.
Este script añade ?v=<versión> a:
  - los <link> de CSS y los <script> propios de cada .html
  - todos los import de JavaScript entre archivos propios (js/**)
Los JSON de datos/ no lo necesitan: se piden siempre con revalidación (js/nucleo/datos.js).

Uso, antes de cada commit:   python3 herramientas/version.py
"""
import re, time, pathlib

RAIZ = pathlib.Path(__file__).resolve().parent.parent
V = time.strftime('%Y%m%d%H%M')

def poner(texto, patron):
    return re.sub(patron, lambda m: m.group(1) + '?v=' + V + m.group(3), texto)

cambios = 0
for f in list(RAIZ.glob('*.html')) + list(RAIZ.glob('vr/*.html')):
    t = f.read_text(encoding='utf-8')
    n = poner(t, r'((?:href|src)="(?!https?:)[^"]+\.(?:css|js))(\?v=\w+)?(")')
    if n != t: f.write_text(n, encoding='utf-8'); cambios += 1
for f in RAIZ.glob('js/**/*.js'):
    t = f.read_text(encoding='utf-8')
    n = poner(t, r"((?:from\s*|import\s*\(\s*)'\.{1,2}/[^']+\.js)(\?v=\w+)?(')")
    if n != t: f.write_text(n, encoding='utf-8'); cambios += 1
print(f'Versión {V}: {cambios} archivos actualizados')
