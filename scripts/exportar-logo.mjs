/* Saca los PNG del logo a partir de los SVG de assets/logo (los genera
   scripts/generar-logo.py). Fondo transparente salvo el favicon.

   node scripts/exportar-logo.mjs
*/
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const salidas = [
  ['assets/logo/marca.svg', 'assets/logo/marca.png', 1024],
  ['assets/logo/marca-claro.svg', 'assets/logo/marca-claro.png', 1024],
  ['assets/logo/logo.svg', 'assets/logo/logo.png', 2400],
  ['assets/logo/logo-claro.svg', 'assets/logo/logo-claro.png', 2400],
  ['assets/favicon.svg', 'assets/logo/icono-512.png', 512],
  ['assets/favicon.svg', 'assets/apple-touch-icon.png', 180]
];

const navegador = await chromium.launch();
const page = await navegador.newPage({ deviceScaleFactor: 1 });
for (const [origen, destino, ancho] of salidas) {
  const svg = fs.readFileSync(path.join(raiz, origen), 'utf8');
  const [, , w, h] = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const alto = Math.round(ancho * h / w);
  await page.setViewportSize({ width: ancho, height: alto });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${ancho}" height="${alto}" `)}</body></html>`);
  await page.screenshot({ path: path.join(raiz, destino), omitBackground: true, clip: { x: 0, y: 0, width: ancho, height: alto } });
  console.log('png', destino, ancho + '×' + alto);
}
await navegador.close();
