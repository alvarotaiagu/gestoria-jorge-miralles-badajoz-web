/* GitHub Pages sirve CSS/JS con max-age=600: tras un push el navegador mezcla
   durante 10 minutos la hoja vieja con el HTML nuevo. Cada referencia a
   css/estilos.css y js/main.js lleva ?v=<huella del contenido>; este script
   la recalcula. Ejecutar antes de cada commit que toque CSS o JS.

   node scripts/versionar.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const huella = f => crypto.createHash('sha1').update(fs.readFileSync(path.join(raiz, f))).digest('hex').slice(0, 8);
const versiones = { 'css/estilos.css': huella('css/estilos.css'), 'js/main.js': huella('js/main.js') };

for (const pagina of ['index.html', 'aviso-legal.html', 'privacidad.html']) {
  const ruta = path.join(raiz, pagina);
  let html = fs.readFileSync(ruta, 'utf8');
  const antes = html;
  for (const [archivo, v] of Object.entries(versiones)) {
    html = html.replace(new RegExp(archivo.replace(/[./]/g, '\\$&') + '(\\?v=[^"]*)?'), archivo + '?v=' + v);
  }
  if (html !== antes) fs.writeFileSync(ruta, html);
  console.log((html !== antes ? 'actualizado ' : 'sin cambios ') + pagina);
}
console.log(versiones);
