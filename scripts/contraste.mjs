/* Contraste de cada pareja texto/fondo del sitio, calculado (no a ojo).
   La mostaza del cliente se queda intacta; para texto se derivan dos tonos
   con color-mix (ver :root en estilos.css). Aquí se comprueban los mismos
   valores que el CSS declara como respaldo.
   node scripts/contraste.mjs */
const hex = h => h.replace('#', '').match(/../g).map(x => parseInt(x, 16) / 255);
const lin = c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const L = h => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const mezcla = (a, b, p) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round((v * p + B[i] * (1 - p)) * 255).toString(16).padStart(2, '0')).join(''); };
const sobre = (rgba, fondo) => { const [r, g, b, a] = rgba; const F = hex(fondo); return '#' + [r, g, b].map((v, i) => Math.round((v / 255 * a + F[i] * (1 - a)) * 255).toString(16).padStart(2, '0')).join(''); };

const linoleo = '#4F6B5E', hondo = '#46604F', papel = '#FBF8F1', tinta = '#1F2320', mostaza = '#E2A43A', rojo = '#B33A33';
const acentoTexto = mezcla(mostaza, tinta, 0.52);    /* color-mix(in srgb, mostaza 52%, tinta) */
const acentoClaro = mezcla(mostaza, papel, 0.25);    /* color-mix(in srgb, mostaza 25%, papel) */
const tintaSuave = sobre([31, 35, 32, 0.66], papel);
const papelApagado = sobre([251, 248, 241, 0.86], linoleo);
const papelApagadoHondo = sobre([251, 248, 241, 0.86], hondo);
const papelApagadoTinta = sobre([251, 248, 241, 0.86], tinta);

console.log('acento-texto =', acentoTexto, ' acento-claro =', acentoClaro);
const parejas = [
  ['papel sobre linóleo', papel, linoleo, 4.5],
  ['papel sobre linóleo hondo', papel, hondo, 4.5],
  ['papel apagado sobre linóleo', papelApagado, linoleo, 4.5],
  ['papel apagado sobre linóleo hondo', papelApagadoHondo, hondo, 4.5],
  ['papel apagado sobre tinta (marquesina)', papelApagadoTinta, tinta, 4.5],
  ['acento claro (texto pequeño) sobre linóleo', acentoClaro, linoleo, 4.5],
  ['acento claro (texto pequeño) sobre linóleo hondo', acentoClaro, hondo, 4.5],
  ['mostaza (texto grande) sobre linóleo hondo — hero', mostaza, hondo, 3],
  ['mostaza (texto grande) sobre tinta — marquesina', mostaza, tinta, 3],
  ['mostaza (solo decorativa) sobre linóleo', mostaza, linoleo, 1],
  ['tinta sobre papel', tinta, papel, 4.5],
  ['tinta suave sobre papel', tintaSuave, papel, 4.5],
  ['tinta suave sobre hoja 2 (#F8F4EA)', tintaSuave, '#F8F4EA', 4.5],
  ['acento texto sobre papel', acentoTexto, papel, 4.5],
  ['acento texto sobre hoja 4 (#F7F2E6)', acentoTexto, '#F7F2E6', 4.5],
  ['rojo de marca sobre papel', rojo, papel, 4.5],
  ['tinta sobre mostaza (botón)', tinta, mostaza, 4.5],
  ['papel sobre tinta (botón tinta)', papel, tinta, 4.5],
  ['tinta sobre papel (botón papel)', tinta, papel, 4.5],
  ['pendiente sobre linóleo', acentoClaro, linoleo, 4.5],
  ['pendiente en hoja', acentoTexto, papel, 4.5],
  ['cortina: gris del pie sobre papel', tintaSuave, papel, 4.5],
  ['cursor «coger»: tinta sobre mostaza al 92 % sobre linóleo', tinta, sobre([226, 164, 58, 0.92], linoleo), 4.5]
];
let malas = 0;
for (const [n, t, f, min] of parejas) {
  const r = ratio(t, f);
  const ok = r >= min;
  if (!ok) malas++;
  console.log((ok ? 'OK   ' : 'FALLA') + '  ' + r.toFixed(2).padStart(5) + ' ≥ ' + min + '  ' + n);
}
if (malas) process.exitCode = 1;
