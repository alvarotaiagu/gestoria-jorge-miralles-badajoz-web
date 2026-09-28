/* Servidor estático para revisar la maqueta en el navegador.
   Hace falta servirla por HTTP (no con doble clic) para que el 404 responda
   de verdad y para que localStorage no dé problemas. Se sirve bajo el mismo
   prefijo que GitHub Pages para que las rutas absolutas del 404 funcionen.

   node scripts/servir.mjs          → http://127.0.0.1:4194/gestoria-jorge-miralles-badajoz-web/
   node scripts/servir.mjs 5000     → otro puerto
*/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const puerto = Number(process.argv[2]) || 4194;
const PREFIJO = '/gestoria-jorge-miralles-badajoz-web';

const tipos = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.json': 'application/json', '.md': 'text/plain; charset=utf-8'
};

http.createServer((req, res) => {
  let limpia = decodeURIComponent(req.url.split('?')[0]);
  if (limpia === '/') { res.writeHead(302, { location: PREFIJO + '/' }); res.end(); return; }
  if (limpia.startsWith(PREFIJO)) limpia = limpia.slice(PREFIJO.length) || '/';
  const destino = path.join(raiz, limpia === '/' ? 'index.html' : limpia);
  if (!destino.startsWith(raiz)) { res.writeHead(403).end('no'); return; }
  if (!fs.existsSync(destino) || fs.statSync(destino).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(path.join(raiz, '404.html')));
    return;
  }
  res.writeHead(200, {
    'content-type': tipos[path.extname(destino)] || 'application/octet-stream',
    'cache-control': 'no-store'
  });
  res.end(fs.readFileSync(destino));
}).listen(puerto, '127.0.0.1', () => {
  console.log('Gestoría Jorge Miralles en http://127.0.0.1:' + puerto + PREFIJO + '/');
  console.log('Con el mando de densidades: ' + PREFIJO + '/index.html?revision');
  console.log('Ctrl+C para parar.');
});
