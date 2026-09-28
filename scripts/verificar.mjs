/* Verificación de la maqueta Gestoría Jorge Miralles.
   Levanta un servidor estático bajo el prefijo del repo (como GitHub Pages),
   abre el sitio con Playwright y comprueba las trampas conocidas: cortina que
   no se retira, montón del hero que no se completa ni se grapa, pila que se
   deshace por la última hoja, bandeja tapada o que no cuenta, consola sucia,
   404, cookies, menú móvil, mapa bajo clic, cursor, WhatsApp pendiente, las
   dos densidades, sin GSAP, con movimiento reducido, cuatro móviles, y que no
   se publica ningún dato de la lista «sin confirmar».

   node scripts/verificar.mjs            (todo)
   node scripts/verificar.mjs --capturas (además guarda screenshots/)
*/
import { chromium } from 'file:///C:/Users/alvar/Desktop/WEBS%20NEGOCIOS/alvarotaiagu.github.io/node_modules/playwright/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const conCapturas = process.argv.includes('--capturas');
if (conCapturas) fs.mkdirSync(path.join(raiz, 'screenshots'), { recursive: true });
const foto = n => path.join(raiz, 'screenshots', n);
const tipos = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json'
};
const PREFIJO = '/gestoria-jorge-miralles-badajoz-web';
const PUERTO = 4195;

/* se sirve bajo el prefijo del repo, como en GitHub Pages: así el 404 con
   rutas absolutas se prueba de verdad */
const servidor = http.createServer((req, res) => {
  let limpia = decodeURIComponent(req.url.split('?')[0]);
  if (limpia.startsWith(PREFIJO)) limpia = limpia.slice(PREFIJO.length) || '/';
  const destino = path.join(raiz, limpia === '/' ? 'index.html' : limpia);
  if (!destino.startsWith(raiz)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(destino) || fs.statSync(destino).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(path.join(raiz, '404.html')));
    return;
  }
  res.writeHead(200, { 'content-type': tipos[path.extname(destino)] || 'application/octet-stream' });
  res.end(fs.readFileSync(destino));
});

const fallos = [];
const notas = [];
function comprobar(ok, mensaje) { (ok ? notas : fallos).push((ok ? 'OK   ' : 'FALLA') + ' · ' + mensaje); }

async function rueda(page, vueltas, paso = 700, espera = 240) {
  for (let i = 0; i < vueltas; i++) {             // window.scrollTo no dispara ScrollTrigger con Lenis
    await page.mouse.wheel(0, paso);
    await page.waitForTimeout(espera);
  }
  await page.waitForTimeout(1800);
}

async function hasta(page, selector, margen = 0) {
  for (let i = 0; i < 90; i++) {
    const top = await page.evaluate(s => document.querySelector(s).getBoundingClientRect().top, selector);
    if (top <= 90 + margen && top > -40) break;
    const paso = top > 0 ? Math.min(700, Math.max(120, top - 60)) : Math.max(-700, top - 80);
    await page.mouse.wheel(0, paso);
    await page.waitForTimeout(160);
  }
  await page.waitForTimeout(1800);
}

async function nuevaPagina(navegador, opciones = {}) {
  const contexto = await navegador.newContext({
    viewport: opciones.viewport || { width: 1440, height: 900 },
    reducedMotion: opciones.reducedMotion || 'no-preference',
    deviceScaleFactor: 1
  });
  if (opciones.sinCookies) await contexto.addInitScript(() => { try { localStorage.setItem('miralles-cookies', 'ok'); } catch (e) {} });
  const page = await contexto.newPage();
  const errores = [];
  const caidas = [];
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  page.on('pageerror', e => errores.push('pageerror: ' + e.message));
  page.on('requestfailed', r => caidas.push(r.url() + ' → ' + (r.failure()?.errorText || '')));
  page.on('response', r => { if (r.status() >= 400) caidas.push(r.status() + ' ' + r.url()); });
  return { contexto, page, errores, caidas };
}

/* estado del hero: dónde está cada papel visible, si hay grapa y taza, qué frase se lee */
const mesa = page => page.evaluate(() => {
  const vis = [...document.querySelectorAll('#mesa .papel')].filter(p => getComputedStyle(p).display !== 'none');
  const centros = vis.map(p => { const r = p.getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)]; });
  const xs = centros.map(c => c[0]), ys = centros.map(c => c[1]);
  const visible = el => { const e = getComputedStyle(el); return parseFloat(e.opacity) > 0.9 && e.visibility !== 'hidden'; };
  const antes = document.getElementById('frase-antes'), despues = document.getElementById('frase-despues');
  const letraDespues = despues.querySelector('.letra');
  return {
    n: vis.length,
    dispersion: Math.round(Math.max(...xs) - Math.min(...xs) + Math.max(...ys) - Math.min(...ys)),
    grapa: visible(document.getElementById('grapa')),
    taza: visible(document.getElementById('taza')),
    antes: visible(antes),
    despues: getComputedStyle(despues).visibility !== 'hidden' && (!letraDespues || Math.abs(new DOMMatrix(getComputedStyle(letraDespues).transform).m42) < 2),
    pin: !!document.querySelector('.pin-spacer')
  };
});
const bandeja = page => page.evaluate(() => {
  const b = document.getElementById('bandeja');
  const r = b.getBoundingClientRect();
  const enPunto = document.elementFromPoint(r.left + r.width / 2, r.top + 30);
  return {
    n: Number(document.getElementById('bandeja-n').textContent),
    puestas: document.querySelectorAll('.bandeja__hoja.puesta').length,
    grapada: b.classList.contains('bandeja--grapada'),
    seVe: !!enPunto && b.contains(enPunto),
    display: getComputedStyle(b).display
  };
});

const base = 'http://127.0.0.1:' + PUERTO + PREFIJO;
await new Promise(r => servidor.listen(PUERTO, '127.0.0.1', r));
const navegador = await chromium.launch();

try {
  /* ───── 0. lo que no puede aparecer en ninguna página ───── */
  for (const p of ['index.html', 'aviso-legal.html', 'privacidad.html', '404.html']) {
    const texto = fs.readFileSync(path.join(raiz, p), 'utf8');
    comprobar(/<meta charset="utf-8">\s*<meta name="robots" content="noindex, nofollow">/.test(texto), p + ': noindex, nofollow justo tras el charset');
    const prohibidos = [
      [/924\s?65\s?66\s?97/, 'el fijo sin confirmar'],
      [/Universidad Europea/i, 'la formación sin confirmar'],
      [/colegiado n(\.º|º|úm)\s*\d/i, 'un número de colegiado'],
      [/onsurbe-abogados\.com/i, 'un enlace a la web de Onsurbe'],
      [/wa\.me\/\+?34\d{9}/, 'un WhatsApp dado por hecho'],
      [/años de experiencia/i, 'antigüedad inventada'],
      [/clientes satisfechos|nuestros clientes|cientos de|miles de|opiniones de clientes/i, 'prueba social en plural']
    ];
    prohibidos.forEach(([re, que]) => comprobar(!re.test(texto), p + ': no aparece ' + que));
  }
  {
    const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
    const ld = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
    let datos = null;
    try { datos = JSON.parse(ld[1]); } catch (e) {}
    comprobar(datos && datos['@type'] === 'AccountingService' && !datos.aggregateRating, 'JSON-LD AccountingService válido y sin aggregateRating');
    comprobar(/estilos\.css\?v=[0-9a-f]{8}"/.test(html) && /main\.js\?v=[0-9a-f]{8}"/.test(html), 'CSS y JS versionados con ?v=<huella> (node scripts/versionar.mjs)');
    comprobar(/cdn\.jsdelivr\.net\/npm\/lenis@/.test(html) && !/cdnjs\.cloudflare\.com\/ajax\/libs\/lenis/.test(html), 'Lenis se carga desde jsDelivr, no desde cdnjs');
    comprobar(/href="https:\/\/wa\.me\/NUMERO-PENDIENTE"/.test(html), 'el WhatsApp lleva el token NUMERO-PENDIENTE');
    const css = fs.readFileSync(path.join(raiz, 'css/estilos.css'), 'utf8');
    comprobar(/\.cookies:not\(\[hidden\]\)\s*\{\s*display:\s*flex/.test(css), 'CSS: .cookies:not([hidden]){display:flex}');
    comprobar(/height:\s*100dvh/.test(css), 'CSS: el menú móvil lleva height:100dvh');
    comprobar(/--acento-texto:\s*color-mix/.test(css), 'CSS: --acento-texto derivado con color-mix');
    comprobar(!/Libre Caslon|Public Sans/.test(css) && !/Libre\+Caslon|Public\+Sans/.test(html), 'sin las tipografías de Botejara');
    const js = fs.readFileSync(path.join(raiz, 'js/main.js'), 'utf8');
    comprobar(!/filter\s*:|shadowBlur|boxShadow\s*:/.test(js), 'JS: ningún filter ni sombra animados por fotograma');
    comprobar(/ResizeObserver/.test(js) && /ST\.refresh\(\)/.test(js), 'JS: ResizeObserver + ScrollTrigger.refresh()');
  }

  /* ───── 1. escritorio, pasada normal ───── */
  {
    const { contexto, page, errores, caidas } = await nuevaPagina(navegador);
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.classList.contains('con-movimiento') || document.documentElement.classList.contains('sin-movimiento'));

    /* fotogramas intermedios: la única forma de ver que la hoja cae y se aparta */
    const alturasHoja = new Set();
    let vistaCayendo = false, vistaApartando = false, fondoColor = '';
    for (let i = 0; i < 110; i++) {
      const s = await page.evaluate(() => {
        const c = document.getElementById('cortina');
        if (getComputedStyle(c).display === 'none') return null;
        const h = document.getElementById('cortina-hoja').getBoundingClientRect();
        const f = document.getElementById('cortina-fondo').getBoundingClientRect();
        return { top: Math.round(h.top), left: Math.round(h.left), fondoLeft: Math.round(f.left), color: getComputedStyle(document.getElementById('cortina-fondo')).backgroundColor };
      });
      if (!s) break;
      fondoColor = s.color;
      alturasHoja.add(s.top);
      if (s.top < 0 && s.top > -700 && !vistaCayendo) { vistaCayendo = true; if (conCapturas) await page.screenshot({ path: foto('00a-cortina-cae.png') }); }
      if (s.left > 900 || s.fondoLeft > 200) { if (!vistaApartando && conCapturas) await page.screenshot({ path: foto('00b-cortina-se-aparta.png') }); vistaApartando = true; }
      if (i === 8 && conCapturas) await page.screenshot({ path: foto('00-cortina-hoja.png') });
      await page.waitForTimeout(60);
    }
    comprobar(alturasHoja.size >= 4 && vistaCayendo, 'la hoja de la cortina cae desde arriba (' + alturasHoja.size + ' alturas distintas)');
    await page.waitForLoadState('networkidle');
    comprobar(vistaApartando, 'la cortina se aparta hacia un lado (hoja y fondo se van a la derecha)');
    comprobar(fondoColor === 'rgb(31, 35, 32)', 'la cortina no es del color del hero que destapa → ' + fondoColor);
    await page.waitForTimeout(2200);
    const cortinaFinal = await page.evaluate(() => getComputedStyle(document.getElementById('cortina')).display);
    comprobar(cortinaFinal === 'none', 'la cortina acaba en display:none (pasada normal) → ' + cortinaFinal);
    comprobar(await page.evaluate(() => !document.documentElement.classList.contains('cortina-activa')), 'se devuelve el scroll al retirar la cortina');
    comprobar(await page.evaluate(() => !!window.Lenis && document.documentElement.classList.contains('lenis')), 'Lenis cargado y gobernando el scroll');
    const desborda = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    comprobar(desborda <= 1, 'sin desbordamiento horizontal en escritorio (' + desborda + 'px)');
    if (conCapturas) await page.screenshot({ path: foto('01-hero-mesa.png') });

    const m0 = await mesa(page);
    comprobar(m0.n === 6 && m0.dispersion > 500 && !m0.grapa && !m0.taza && m0.antes && !m0.despues && m0.pin,
      'hero al entrar: seis papeles desordenados, sin grapa ni taza, «¿Así está tu mesa?», anclado → ' + JSON.stringify(m0));

    /* cursor propio */
    await page.mouse.move(700, 300);
    await page.mouse.move(720, 320, { steps: 4 });
    await page.waitForTimeout(400);
    const cursorLibre = await page.evaluate(() => ({
      sistema: getComputedStyle(document.body).cursor,
      aro: getComputedStyle(document.querySelector('.cursor')).opacity,
      punto: getComputedStyle(document.querySelector('.cursor-punto')).opacity
    }));
    comprobar(cursorLibre.sistema === 'none' && cursorLibre.aro === '1' && cursorLibre.punto === '1',
      'cursor propio visible (aro + punto) y el del sistema oculto → ' + JSON.stringify(cursorLibre));
    const boton = await page.locator('.hero__acciones .boton').boundingBox();
    await page.mouse.move(boton.x + boton.width / 2, boton.y + boton.height / 2, { steps: 6 });
    await page.waitForTimeout(600);
    const cursorBoton = await page.evaluate(() => {
      const e = getComputedStyle(document.querySelector('.cursor'));
      return { fondo: e.backgroundColor, ancho: e.width, sistema: getComputedStyle(document.querySelector('.hero__acciones .boton')).cursor };
    });
    comprobar(/rgba\(226, 164, 58, 0\.42\)/.test(cursorBoton.fondo) && cursorBoton.ancho === '64px' && cursorBoton.sistema === 'none',
      'sobre un botón el aro crece y se rellena, sin cursor del sistema → ' + JSON.stringify(cursorBoton));
    if (conCapturas) await page.screenshot({ path: foto('01b-cursor-boton.png'), clip: { x: boton.x - 60, y: boton.y - 60, width: boton.width + 120, height: boton.height + 120 } });
    /* sobre un papel: se levanta y el cursor dice «coger» */
    const papel = await page.locator('#mesa .papel[data-papel="contrato"] .papel__hoja').boundingBox();
    await page.mouse.move(papel.x + papel.width / 2, papel.y + papel.height / 2, { steps: 8 });
    await page.waitForTimeout(700);
    const sobrePapel = await page.evaluate(() => {
      const c = document.querySelector('.cursor');
      const h = document.querySelector('#mesa .papel[data-papel="contrato"] .papel__hoja');
      return { texto: c.textContent, opTexto: getComputedStyle(c.querySelector('.cursor__texto')).opacity, coger: c.classList.contains('cursor--coger'), alzada: h.classList.contains('papel__hoja--alzada'), escala: new DOMMatrix(getComputedStyle(h).transform).a, sombraAlta: getComputedStyle(h.querySelector('.papel__sombra--alta')).opacity };
    });
    comprobar(sobrePapel.coger && sobrePapel.texto === 'coger' && sobrePapel.opTexto === '1' && sobrePapel.alzada && parseFloat(sobrePapel.escala) > 1.02 && sobrePapel.sombraAlta === '1',
      'sobre un papel el cursor dice «coger» y el papel se levanta (escala + sombra cacheada) → ' + JSON.stringify(sobrePapel));
    if (conCapturas) await page.screenshot({ path: foto('01c-cursor-coger.png'), clip: { x: papel.x - 60, y: papel.y - 60, width: papel.width + 120, height: papel.height + 120 } });
    await page.mouse.move(720, 450, { steps: 4 });
    await page.waitForTimeout(300);

    /* el hero se recoge con el scroll */
    await rueda(page, 2, 300);
    const m1 = await mesa(page);
    if (conCapturas) await page.screenshot({ path: foto('02-hero-a-medias.png') });
    comprobar(m1.dispersion < m0.dispersion - 150 && m1.dispersion > 60, 'a media bajada los papeles están volando al montón (dispersión ' + m0.dispersion + ' → ' + m1.dispersion + ')');
    await rueda(page, 4, 400);
    const m2 = await mesa(page);
    if (conCapturas) await page.screenshot({ path: foto('03-hero-recogido.png') });
    comprobar(m2.dispersion <= 30 && m2.grapa && m2.taza && !m2.antes && m2.despues,
      'el montón termina completo y grapado, con el café, y el titular dice «Lo tuyo, fuera de tu mesa.» → ' + JSON.stringify(m2));
    const grapaSobreMonton = await page.evaluate(() => {
      const g = document.getElementById('grapa').getBoundingClientRect();
      const ultimo = [...document.querySelectorAll('#mesa .papel')].filter(p => getComputedStyle(p).display !== 'none').pop().getBoundingClientRect();
      return g.left > ultimo.left - 4 && g.top > ultimo.top - 6 && g.right < ultimo.left + 80 && g.bottom < ultimo.top + 40;
    });
    comprobar(grapaSobreMonton, 'la grapa cae en la esquina del papel de arriba del montón');

    /* marquesina a dos velocidades */
    await hasta(page, '.marquesina');
    const marq = await page.evaluate(async () => {
      const leer = () => ['carril-estribillo', 'carril-lista'].map(id => new DOMMatrix(getComputedStyle(document.getElementById(id)).transform).m41);
      const a = leer();
      await new Promise(r => setTimeout(r, 500));
      const b = leer();
      return { estribillo: b[0] - a[0], lista: b[1] - a[1] };
    });
    comprobar(marq.estribillo < -5 && marq.lista > 5 && Math.abs(marq.estribillo) > Math.abs(marq.lista) * 1.4,
      'marquesina: dos carriles, dos velocidades y sentidos → ' + JSON.stringify(marq));
    if (conCapturas) await page.screenshot({ path: foto('04-marquesina.png') });

    /* la pila y la bandeja */
    await hasta(page, '#papeles');
    if (conCapturas) await page.screenshot({ path: foto('05-papeles.png') });
    const b0 = await bandeja(page);
    await hasta(page, '#hoja-trafico', 20);
    await page.waitForTimeout(1200);
    const b1 = await bandeja(page);
    if (conCapturas) await page.screenshot({ path: foto('06-hoja-trafico.png') });
    await hasta(page, '#hoja-fiscal', 20);
    await page.waitForTimeout(1200);
    const b2 = await bandeja(page);
    await hasta(page, '#hoja-contable', 20);
    await page.waitForTimeout(1200);
    const apilada = await page.evaluate(() => getComputedStyle(document.querySelector('#hoja-fiscal .hoja')).transform);
    comprobar(apilada !== 'none', 'la hoja de debajo se hunde al apilarse → ' + apilada);
    if (conCapturas) await page.screenshot({ path: foto('07-hoja-contable.png') });
    await hasta(page, '#hoja-legal', 20);
    await page.waitForTimeout(1400);
    const b5 = await bandeja(page);
    if (conCapturas) await page.screenshot({ path: foto('08-hoja-legal.png') });
    comprobar(b0.n === 0 && b1.n === 1 && b1.puestas === 1 && b2.n === 2 && b5.n === 5 && b5.puestas === 5,
      'la bandeja cuenta cada hoja que se posa (0 → 1 → 2 → 5) → ' + JSON.stringify([b0, b1, b2, b5]));
    comprobar(b1.seVe && b5.seVe, 'la bandeja fija se ve de verdad (elementFromPoint la devuelve) a media página');
    const fondoBandeja = await page.evaluate(() => getComputedStyle(document.getElementById('bandeja')).backgroundColor);
    comprobar(fondoBandeja.startsWith('rgba(31, 35, 32, 0.8'), 'la bandeja lleva fondo propio: se lee sobre papel y sobre linóleo → ' + fondoBandeja);
    comprobar(!b5.grapada, 'la bandeja aún no está grapada antes del final');

    const alturas = await page.evaluate(() => [...document.querySelectorAll('.pila__item .hoja')].map(t => ({ alto: t.offsetHeight, cabe: t.scrollHeight <= t.clientHeight + 1 })));
    comprobar(new Set(alturas.map(a => a.alto)).size === 1 && alturas.every(a => a.cabe), 'pila: las cinco hojas miden lo mismo y su contenido cabe → ' + JSON.stringify(alturas));

    await hasta(page, '#quien');
    if (conCapturas) await page.screenshot({ path: foto('09-quien.png') });
    const pendientes = await page.evaluate(() => [...document.querySelectorAll('#quien .marca-pendiente')].map(n => n.textContent));
    comprobar(pendientes.length >= 3 && pendientes.join(' ').includes('colegiado') && pendientes.join(' ').includes('fijo') && pendientes.join(' ').includes('formación'),
      'quién: marcadores visibles de formación, colegiado y fijo → ' + pendientes.join(' | '));
    await hasta(page, '#resenas');
    await page.waitForTimeout(1800);
    if (conCapturas) await page.screenshot({ path: foto('10-resenas.png') });
    const cifra = await page.textContent('.resenas__cifra');
    const cuenta = await page.textContent('.resenas__cuenta');
    comprobar(cifra.trim() === '5,0' && /^1 reseña/.test(cuenta.trim()), 'reseñas: 5,0 con 1 reseña, tal cual → ' + cifra.trim() + ' / ' + cuenta.trim());
    const textoPagina = await page.evaluate(() => document.body.textContent);
    comprobar(!/clientes satisfechos|nuestros clientes|cientos de|miles de|opiniones de clientes|reseñas de clientes/i.test(textoPagina), 'reseñas: ninguna prueba social en plural en la página');

    await hasta(page, '#donde');
    if (conCapturas) await page.screenshot({ path: foto('11-donde.png') });
    const horario = await page.evaluate(() => {
      const e = document.getElementById('horario-estado');
      const partes = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      const o = {}; partes.forEach(p => { o[p.type] = p.value; });
      const dia = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday];
      const h = parseInt(o.hour, 10) % 24 + parseInt(o.minute, 10) / 60;
      const franjas = { 1: [[8.5, 14], [17, 19.5]], 2: [[8.5, 14], [17, 19.5]], 3: [[8.5, 14], [17, 19.5]], 4: [[8.5, 14], [17, 19.5]], 5: [[8.5, 14.5]], 6: [], 0: [] }[dia];
      const abierto = franjas.some(f => h >= f[0] && h < f[1]);
      const hoy = document.querySelector('#horario-tabla tr.hoy');
      return { texto: e.textContent, estado: e.dataset.estado, esperado: abierto ? 'abierto' : 'cerrado', hoyMarcado: !!hoy && hoy.dataset.dias.split(',').includes(String(dia)) };
    });
    comprobar(horario.estado === horario.esperado && /^(Abierto|Cerrado) ahora/.test(horario.texto) && horario.hoyMarcado,
      'horario en vivo (Europe/Madrid) coincide con las franjas y marca el día de hoy → ' + JSON.stringify(horario));

    /* WhatsApp pendiente: el clic abre el diálogo, no un enlace roto */
    await page.click('#whatsapp');
    await page.waitForTimeout(400);
    const dialogo = await page.evaluate(() => ({ abierto: document.getElementById('wa-dialogo').open, url: location.href }));
    comprobar(dialogo.abierto && !/wa\.me/.test(dialogo.url), 'WhatsApp sin confirmar: el clic abre el diálogo que lo explica → ' + JSON.stringify(dialogo));
    if (conCapturas) await page.screenshot({ path: foto('11b-whatsapp-pendiente.png') });
    await page.click('#wa-cerrar');
    await page.waitForTimeout(300);
    comprobar(await page.evaluate(() => !document.getElementById('wa-dialogo').open), 'el diálogo del WhatsApp se cierra');

    const iframesAntes = await page.$$eval('iframe', n => n.length);
    await page.click('#mapa-boton');
    await page.waitForTimeout(900);
    const iframesDespues = await page.$$eval('iframe', n => n.length);
    comprobar(iframesAntes === 0 && iframesDespues === 1, 'el iframe del mapa no existe hasta el clic (' + iframesAntes + ' → ' + iframesDespues + ')');
    const srcMapa = await page.$eval('iframe', f => f.src);
    comprobar(/google\.com\/maps\?q=.*output=embed/.test(srcMapa), 'el mapa usa maps?q=…&output=embed (sin clave de API)');

    await rueda(page, 6, 700);
    if (conCapturas) await page.screenshot({ path: foto('12-pie.png') });
    const bFin = await bandeja(page);
    comprobar(bFin.n === 5 && bFin.grapada && bFin.seVe, 'al final de la página la bandeja está llena, grapada y visible → ' + JSON.stringify(bFin));
    const grapaBandeja = await page.evaluate(() => { const g = getComputedStyle(document.querySelector('.bandeja__grapa')); return { opacidad: g.opacity, escala: g.scale }; });
    comprobar(grapaBandeja.opacidad === '1' && parseFloat(grapaBandeja.escala) === 1, 'la grapa de la bandeja está puesta → ' + JSON.stringify(grapaBandeja));
    if (conCapturas) { const r = await page.locator('#bandeja').boundingBox(); await page.screenshot({ path: foto('12b-bandeja-grapada.png'), clip: { x: r.x - 20, y: r.y - 20, width: r.width + 40, height: r.height + 40 } }); }

    const cookiesVisible = await page.evaluate(() => {
      const c = document.getElementById('cookies');
      return { oculto: c.hidden, display: getComputedStyle(c).display };
    });
    comprobar(!cookiesVisible.oculto && cookiesVisible.display === 'flex', 'el aviso de cookies se ve al entrar');
    await page.click('#cookies-aceptar');
    await page.waitForTimeout(300);
    const cookiesCerrado = await page.evaluate(() => getComputedStyle(document.getElementById('cookies')).display);
    comprobar(cookiesCerrado === 'none', 'el botón de cookies lo cierra de verdad → ' + cookiesCerrado);

    const mandoSinRevision = await page.evaluate(() => {
      const m = document.getElementById('mando');
      return { oculto: m.hidden, display: getComputedStyle(m).display };
    });
    comprobar(mandoSinRevision.oculto && mandoSinRevision.display === 'none', 'sin ?revision el mando de maqueta no se ve → ' + JSON.stringify(mandoSinRevision));

    /* vuelta arriba: el enlace de la marca lleva al 0 real, no al rect del hero anclado */
    await page.click('.cabecera__marca');
    await page.waitForTimeout(2200);
    comprobar((await page.evaluate(() => Math.round(window.scrollY))) < 5, 'el enlace de la marca vuelve arriba del todo (hero anclado)');

    comprobar(errores.length === 0, 'consola sin errores' + (errores.length ? ' → ' + errores.join(' | ') : ''));
    const caidasReales = caidas.filter(c => !/favicon\.ico|google\.com\/maps|gstatic|googleapis\.com\/maps|maps\.google|google\.com\/(gen_204|log)/.test(c));
    comprobar(caidasReales.length === 0, 'sin peticiones caídas' + (caidasReales.length ? ' → ' + caidasReales.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 1b. la pila, en una página limpia y bajando desde arriba en pasos de ~90 px ─────
     El fallo clásico está en la ÚLTIMA hoja. */
  {
    const { contexto, page } = await nuevaPagina(navegador, { sinCookies: true });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4200);
    await page.mouse.move(720, 450);
    await hasta(page, '#hoja-laboral', 300);
    const tope = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.pila__item')).top));
    let ultimo = null, sueltaAntes = null, asomaDebajo = null, seSeparan = null, ultimaPosada = false;
    for (let i = 0; i < 50; i++) {
      await page.mouse.wheel(0, 90);
      await page.waitForTimeout(170);
      const m = await page.evaluate(() => [...document.querySelectorAll('.pila__item')].map(li => { const r = li.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom)]; }));
      ultimo = m;
      const ultima = m[m.length - 1];
      const anteriores = m.slice(0, -1);
      if (!ultimaPosada && ultima[0] > tope + 2 && ultima[0] < 900 && anteriores.some(a => a[0] < tope - 2)) sueltaAntes = sueltaAntes || { paso: i, m };
      if (Math.abs(ultima[0] - tope) <= 2) {
        ultimaPosada = true;
        if (anteriores.some(a => a[1] > ultima[1] + 1)) asomaDebajo = asomaDebajo || { paso: i, m };
      }
      if (ultimaPosada && anteriores.some(a => Math.abs(a[0] - ultima[0]) > 2)) seSeparan = seSeparan || { paso: i, m };
    }
    const sinLlegar = ultimaPosada ? '' : ' (la última no llegó a posarse: ' + JSON.stringify(ultimo) + ')';
    comprobar(ultimaPosada && !sueltaAntes, 'pila: ninguna hoja se suelta antes de que se pose la última' + (sueltaAntes ? ' → ' + JSON.stringify(sueltaAntes) : '') + sinLlegar);
    comprobar(ultimaPosada && !asomaDebajo, 'pila: la última tapa entera a la anterior (nada asoma por debajo)' + (asomaDebajo ? ' → ' + JSON.stringify(asomaDebajo) : '') + sinLlegar);
    comprobar(ultimaPosada && !seSeparan, 'pila: al acabarse, las cinco salen juntas como un bloque' + (seSeparan ? ' → ' + JSON.stringify(seSeparan) : '') + sinLlegar);
    /* el hueco que deja el margen de la última se lo come la sección siguiente */
    const hueco = await page.evaluate(() => {
      const ultima = document.querySelector('#hoja-legal .hoja').getBoundingClientRect();
      const q = document.getElementById('quien').getBoundingClientRect();
      return Math.round(q.top - ultima.bottom);
    });
    comprobar(hueco < 160, 'pila: sin un hueco vacío grande entre la última hoja y «Quién» (' + hueco + 'px)');
    await contexto.close();
  }

  /* ───── 1c. rendimiento: huecos entre fotogramas durante el scroll, medidos desde fonts.ready ───── */
  {
    const { contexto, page } = await nuevaPagina(navegador, { sinCookies: true });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4200);
    await page.evaluate(() => document.fonts.ready.then(() => {
      window.__huecos = []; let ant = performance.now();
      (function paso(t) { if (t - ant > 50) window.__huecos.push(Math.round(t - ant)); ant = t; requestAnimationFrame(paso); })(performance.now());
    }));
    await page.waitForTimeout(300);
    await page.mouse.move(720, 450);
    for (let i = 0; i < 26; i++) { await page.mouse.wheel(0, 420); await page.waitForTimeout(120); }
    await page.waitForTimeout(1500);
    const huecos = await page.evaluate(() => window.__huecos || []);
    comprobar(huecos.length <= 3 && Math.max(0, ...huecos) < 200, 'scroll sin tareas largas propias (huecos >50 ms tras fonts.ready: ' + JSON.stringify(huecos) + ')');
    await contexto.close();
  }

  /* ───── 2. las dos densidades ───── */
  {
    const { contexto, page } = await nuevaPagina(navegador);
    await page.goto(base + '/index.html?revision', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4200);
    comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('mando')).visibility === 'hidden'), 'el mando se aparta mientras el aviso de cookies está en pantalla');
    await page.click('#cookies-aceptar');
    await page.waitForTimeout(400);
    comprobar(await page.evaluate(() => !document.getElementById('mando').hidden && getComputedStyle(document.getElementById('mando')).visibility !== 'hidden'), 'el mando de maqueta aparece al cerrar las cookies (lo enseña el JS)');

    await page.click('[data-densidad="sobria"]');
    await page.waitForTimeout(1000);
    const sobria = await page.evaluate(() => ({
      clase: document.documentElement.className,
      bandeja: getComputedStyle(document.getElementById('bandeja')).display,
      indice: getComputedStyle(document.getElementById('indice')).display,
      traer: getComputedStyle(document.querySelector('.hoja__traer')).display,
      traerTexto: document.querySelector('.hoja__traer small').textContent,
      recogido: document.getElementById('inicio').classList.contains('hero--recogido'),
      pin: !!document.querySelector('.pin-spacer'),
      despues: getComputedStyle(document.getElementById('frase-despues')).visibility,
      antes: getComputedStyle(document.getElementById('frase-antes')).visibility,
      grapa: getComputedStyle(document.getElementById('grapa')).opacity,
      desborda: document.documentElement.scrollWidth - window.innerWidth,
      pulsado: document.querySelector('[data-densidad="sobria"]').getAttribute('aria-pressed')
    }));
    comprobar(sobria.clase.includes('densidad-sobria'), 'la clase de densidad cambia en <html>');
    comprobar(sobria.bandeja === 'none' && sobria.indice !== 'none', 'sobria: fuera la bandeja, dentro el índice de texto → ' + sobria.bandeja + '/' + sobria.indice);
    comprobar(sobria.traer !== 'none' && /orientativa/.test(sobria.traerTexto) && /Jorge/.test(sobria.traerTexto), 'sobria: cada servicio añade «qué traer», marcada como orientativa · confirmar con Jorge');
    comprobar(sobria.recogido && !sobria.pin && sobria.despues === 'visible' && sobria.antes === 'hidden' && sobria.grapa === '1', 'sobria: el hero está quieto, ya recogido y grapado, sin anclaje → ' + JSON.stringify(sobria));
    comprobar(sobria.desborda <= 1, 'sobria: sin desbordamiento nuevo (' + sobria.desborda + 'px)');
    comprobar(sobria.pulsado === 'true', 'aria-pressed correcto tras pulsar');
    if (conCapturas) {
      await page.screenshot({ path: foto('20-sobria-hero.png') });
      await page.mouse.move(720, 450);
      await hasta(page, '#hoja-trafico', 20);
      await page.waitForTimeout(600);
      await page.screenshot({ path: foto('21-sobria-hoja.png') });
    }
    await page.mouse.move(720, 450);
    await hasta(page, '#hoja-contable', 20);
    await page.waitForTimeout(600);
    const indiceActivo = await page.evaluate(() => document.querySelectorAll('#indice li.activo').length);
    comprobar(indiceActivo === 3, 'sobria: el índice de texto sigue el progreso (' + indiceActivo + ' de 5 al llegar a la tercera)');

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    comprobar((await page.evaluate(() => document.documentElement.className)).includes('densidad-sobria'), 'la densidad elegida se aplica sin parpadeo al recargar');
    await page.waitForTimeout(4200);
    await page.click('[data-densidad="mesa"]');
    await page.waitForTimeout(900);
    const vuelta = await page.evaluate(() => ({ clase: document.documentElement.className, bandeja: getComputedStyle(document.getElementById('bandeja')).display, pin: !!document.querySelector('.pin-spacer') }));
    comprobar(vuelta.clase.includes('densidad-mesa') && vuelta.bandeja !== 'none' && vuelta.pin, 'se puede volver a la densidad Mesa (bandeja y hero anclado de vuelta) → ' + JSON.stringify(vuelta));
    await contexto.close();
  }
  {
    /* sin ?revision, una densidad guardada NO se aplica: el enlace del cliente sale limpio */
    const { contexto, page } = await nuevaPagina(navegador);
    await contexto.addInitScript(() => { try { localStorage.setItem('miralles-densidad', 'sobria'); } catch (e) {} });
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    comprobar((await page.evaluate(() => document.documentElement.className)).includes('densidad-mesa'), 'sin ?revision una densidad guardada no se aplica');
    await contexto.close();
  }

  /* ───── 3. móvil ───── */
  {
    const { contexto, page, errores } = await nuevaPagina(navegador, { viewport: { width: 390, height: 844 } });
    await page.goto(base + '/index.html?revision', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4200);
    const ancho = await page.evaluate(() => ({ innerWidth: window.innerWidth, scroll: document.documentElement.scrollWidth, papeles: [...document.querySelectorAll('#mesa .papel')].filter(p => getComputedStyle(p).display !== 'none').length }));
    comprobar(ancho.innerWidth === 390 && ancho.scroll - ancho.innerWidth <= 1, 'móvil: el viewport no se ensancha (' + JSON.stringify(ancho) + ')');
    comprobar(ancho.papeles === 4, 'móvil: cuatro papeles en vez de seis (' + ancho.papeles + ')');
    const bandejaCookies = await page.evaluate(() => {
      const b = document.getElementById('bandeja').getBoundingClientRect();
      const c = document.getElementById('cookies').getBoundingClientRect();
      return { bandejaAbajo: Math.round(b.bottom), cookiesArriba: Math.round(c.top) };
    });
    comprobar(bandejaCookies.bandejaAbajo <= bandejaCookies.cookiesArriba + 2, 'móvil: la bandeja sube por encima del aviso de cookies → ' + JSON.stringify(bandejaCookies));
    if (conCapturas) await page.screenshot({ path: foto('30-movil-hero.png') });

    await page.click('#cookies-aceptar');
    await page.waitForTimeout(600);
    await page.click('#hamburguesa');
    await page.waitForTimeout(800);
    comprobar(await page.evaluate(() => document.getElementById('hamburguesa').getAttribute('aria-expanded')) === 'true', 'móvil: el menú abre');
    if (conCapturas) await page.screenshot({ path: foto('31-movil-menu.png') });
    await page.click('#hamburguesa', { timeout: 4000 });
    await page.waitForTimeout(800);
    comprobar(await page.evaluate(() => document.getElementById('hamburguesa').getAttribute('aria-expanded')) === 'false', 'móvil: el mismo botón cierra el menú');

    /* con la cabecera fija (backdrop-filter) el panel del menú no puede asomar */
    await page.mouse.move(200, 500);
    await rueda(page, 2, 220);
    if (conCapturas) await page.screenshot({ path: foto('32-movil-hero-a-medias.png') });
    await rueda(page, 3, 260);
    if (conCapturas) await page.screenshot({ path: foto('33-movil-hero-recogido.png') });
    await rueda(page, 5, 700);
    const panel = await page.evaluate(() => {
      const n = document.getElementById('menu').getBoundingClientRect();
      return { fija: document.getElementById('cabecera').classList.contains('cabecera--fija'), bottom: Math.round(n.bottom), alto: Math.round(n.height), visible: getComputedStyle(document.getElementById('menu')).visibility };
    });
    comprobar(panel.fija && (panel.bottom <= 1 || panel.visible === 'hidden') && panel.alto >= 800, 'móvil: con la cabecera fija el menú cerrado no asoma → ' + JSON.stringify(panel));
    await page.click('#hamburguesa');
    await page.waitForTimeout(900);
    const panelAbierto = await page.evaluate(() => {
      const r = document.getElementById('menu').getBoundingClientRect();
      return { alto: Math.round(r.height), top: Math.round(r.top), filtro: getComputedStyle(document.getElementById('menu')).backdropFilter };
    });
    comprobar(panelAbierto.alto >= 800 && panelAbierto.top === 0 && /blur/.test(panelAbierto.filtro), 'móvil: con la cabecera fija el menú abierto ocupa toda la pantalla, con desenfoque → ' + JSON.stringify(panelAbierto));
    if (conCapturas) await page.screenshot({ path: foto('31b-movil-menu-fija.png') });
    await page.click('#hamburguesa');
    await page.waitForTimeout(800);

    if (conCapturas) {
      await page.evaluate(() => { window.scrollTo(0, 0); return 0; });
      await page.waitForTimeout(800);
      await hasta(page, '.marquesina');
      await page.screenshot({ path: foto('34-movil-marquesina.png') });
      await hasta(page, '#hoja-fiscal');
      await page.screenshot({ path: foto('35-movil-hoja.png') });
      await hasta(page, '#quien');
      await page.screenshot({ path: foto('36-movil-quien.png') });
      await hasta(page, '#resenas');
      await page.screenshot({ path: foto('37-movil-resenas.png') });
      await hasta(page, '#donde');
      await page.screenshot({ path: foto('38-movil-donde.png') });
      await rueda(page, 4, 700);
      await page.screenshot({ path: foto('39-movil-pie.png') });
    }
    const bMovil = await bandeja(page);
    comprobar(bMovil.seVe, 'móvil: la bandeja fija se ve (elementFromPoint) → ' + JSON.stringify(bMovil));
    comprobar(errores.length === 0, 'móvil: consola sin errores' + (errores.length ? ' → ' + errores.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 3b. cuatro móviles: el texto y los papeles no se pisan, ni al entrar ni recogidos ───── */
  for (const vp of [{ width: 360, height: 640 }, { width: 375, height: 667 }, { width: 390, height: 844 }, { width: 768, height: 1024 }]) {
    const { contexto, page } = await nuevaPagina(navegador, { viewport: vp, sinCookies: true });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4600);
    const medir = () => page.evaluate(() => {
      const caja = e => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; };
      const t = caja(document.querySelector('.hero__texto'));
      const papeles = [...document.querySelectorAll('#mesa .papel')].filter(p => getComputedStyle(p).display !== 'none').map(caja);
      const mesa = caja(document.getElementById('mesa'));
      const cruzan = papeles.filter(p => !(t[2] <= p[0] || p[2] <= t[0] || t[3] <= p[1] || p[3] <= t[1]));
      const taza = caja(document.getElementById('taza'));
      return { texto: t, mesaTop: mesa[1], cruzan: cruzan.length, papeles, fuera: papeles.filter(p => p[0] < -2 || p[2] > innerWidth + 2).length, taza, ancho: document.documentElement.scrollWidth - innerWidth };
    });
    const r0 = await medir();
    comprobar(r0.cruzan === 0 && r0.texto[3] <= r0.mesaTop + 1 && r0.fuera === 0 && r0.ancho <= 1, 'hero ' + vp.width + '×' + vp.height + ': texto y papeles no se pisan, ningún papel se sale, sin scroll horizontal → ' + JSON.stringify({ texto: r0.texto, mesaTop: r0.mesaTop, cruzan: r0.cruzan, fuera: r0.fuera, ancho: r0.ancho }));
    if (conCapturas) await page.screenshot({ path: foto('3b-hero-' + vp.width + 'x' + vp.height + '.png') });
    await page.mouse.move(vp.width / 2, vp.height / 2);
    await rueda(page, 4, 300, 200);
    const r1 = await medir();
    const m1 = await mesa(page);
    comprobar(m1.dispersion <= 30 && m1.grapa && m1.taza && r1.cruzan === 0 && r1.fuera === 0 && r1.taza[2] <= vp.width + 2,
      'hero ' + vp.width + '×' + vp.height + ' recogido: montón centrado y grapado, taza dentro, nada se pisa → ' + JSON.stringify({ dispersion: m1.dispersion, grapa: m1.grapa, taza: r1.taza, cruzan: r1.cruzan }));
    if (conCapturas) await page.screenshot({ path: foto('3b-recogido-' + vp.width + 'x' + vp.height + '.png') });
    await contexto.close();
  }

  /* ───── 4. sin GSAP (CDN caído) ───── */
  {
    const { contexto, page, errores } = await nuevaPagina(navegador);
    await page.route('**/cdn.jsdelivr.net/**', r => r.abort());
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2200);
    const estado = await page.evaluate(() => ({
      cortina: getComputedStyle(document.getElementById('cortina')).display,
      conMovimiento: document.documentElement.classList.contains('con-movimiento'),
      bloqueado: document.documentElement.classList.contains('cortina-activa')
    }));
    comprobar(estado.cortina === 'none' && !estado.bloqueado, 'sin GSAP: la cortina se retira igual y el scroll queda libre → ' + JSON.stringify(estado));
    comprobar(!estado.conMovimiento, 'sin GSAP: no se activa con-movimiento (nada queda a medio revelar)');
    const apagados = await page.evaluate(() => [...document.querySelectorAll('h1, h2, h3, p, li, .papel, .hoja')].filter(n => {
      const e = getComputedStyle(n);
      return parseFloat(e.opacity) < 0.15 && n.getBoundingClientRect().height > 0 && !n.closest('.cortina') && e.visibility !== 'hidden';
    }).map(n => n.className || n.tagName));
    comprobar(apagados.length === 0, 'sin GSAP: ningún texto ni papel queda apagado' + (apagados.length ? ' → ' + apagados.join(',') : ''));
    const m0 = await mesa(page);
    if (conCapturas) await page.screenshot({ path: foto('40-sin-gsap.png') });
    await page.evaluate(() => { window.scrollTo(0, window.innerHeight * 0.5); return 0; });
    await page.waitForTimeout(1600);
    const m1 = await mesa(page);
    comprobar(m0.dispersion > 500 && m0.antes && m1.dispersion <= 30 && m1.grapa && m1.taza && m1.despues && !m1.antes, 'sin GSAP: la mesa se recoge al bajar (sin viaje) y el titular cambia → ' + JSON.stringify([m0, m1]));
    await page.evaluate(() => { document.getElementById('hoja-contable').scrollIntoView({ block: 'start' }); return 0; });
    await page.waitForTimeout(500);
    const b = await bandeja(page);
    comprobar(b.n === 3 && b.puestas === 3, 'sin GSAP: la bandeja sigue contando (' + b.n + ')');
    const horario = await page.evaluate(() => document.getElementById('horario-estado').dataset.estado);
    comprobar(horario === 'abierto' || horario === 'cerrado', 'sin GSAP: el estado del horario se calcula (' + horario + ')');
    const propios = errores.filter(e => !/Failed to load resource|ERR_FAILED/.test(e));
    comprobar(propios.length === 0, 'sin GSAP: consola sin errores propios' + (propios.length ? ' → ' + propios.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 5. movimiento reducido ───── */
  {
    const { contexto, page, errores } = await nuevaPagina(navegador, { reducedMotion: 'reduce' });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('cortina')).display) === 'none', 'movimiento reducido: la cortina no aparece');
    comprobar(await page.evaluate(() => !document.documentElement.classList.contains('con-movimiento')), 'movimiento reducido: sin con-movimiento');
    const m0 = await mesa(page);
    await page.evaluate(() => { window.scrollTo(0, window.innerHeight * 0.5); return 0; });
    await page.waitForTimeout(600);
    const m1 = await mesa(page);
    comprobar(m0.antes && !m0.grapa && m1.despues && m1.grapa && m1.taza && m1.dispersion <= 30, 'movimiento reducido: el contenido cambia igual (mesa recogida, titular) → ' + JSON.stringify([m0, m1]));
    await page.evaluate(() => { document.getElementById('hoja-legal').scrollIntoView({ block: 'start' }); return 0; });
    await page.waitForTimeout(500);
    const b = await bandeja(page);
    comprobar(b.n === 5 && b.puestas === 5, 'movimiento reducido: la bandeja cuenta igual → ' + JSON.stringify(b));
    const cifra = await page.textContent('.resenas__cifra');
    comprobar(cifra.trim() === '5,0', 'movimiento reducido: el contador muestra el dato → ' + cifra);
    const marq = await page.evaluate(() => getComputedStyle(document.getElementById('carril-estribillo')).transform);
    comprobar(marq === 'none', 'movimiento reducido: la marquesina está quieta');
    if (conCapturas) await page.screenshot({ path: foto('41-movimiento-reducido.png') });
    comprobar(errores.length === 0, 'movimiento reducido: consola sin errores' + (errores.length ? ' → ' + errores.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 6. 404 servido bajo el prefijo del repo ───── */
  {
    const { contexto, page, caidas } = await nuevaPagina(navegador);
    const resp = await page.goto(base + '/no-existe/ni-esto.html', { waitUntil: 'networkidle' });
    const titulo = await page.textContent('h1').catch(() => '');
    comprobar(resp.status() === 404 && /mesa/i.test(titulo || ''), '404 propio con el lenguaje del sitio → "' + titulo + '"');
    const propias = caidas.filter(c => !c.includes('/no-existe/'));
    comprobar(propias.length === 0, '404: sin recursos rotos a otra profundidad' + (propias.length ? ' → ' + propias.join(' | ') : ''));
    if (conCapturas) await page.screenshot({ path: foto('50-404.png') });
    await contexto.close();
  }

  /* ───── 7. páginas legales ───── */
  for (const p of ['aviso-legal.html', 'privacidad.html']) {
    const { contexto, page, errores, caidas } = await nuevaPagina(navegador, { viewport: { width: 390, height: 844 } });
    await page.goto(base + '/' + p, { waitUntil: 'networkidle' });
    comprobar(errores.length === 0 && caidas.length === 0, p + ': sin errores ni recursos rotos' + (caidas.length ? ' → ' + caidas.join(' | ') : ''));
    const texto = await page.evaluate(() => document.body.textContent);
    comprobar(/\[PENDIENTE: NIF\]/.test(texto), p + ': el NIF va como [PENDIENTE]');
    if (p === 'aviso-legal.html') comprobar(/\[PENDIENTE: colegio profesional/.test(texto), p + ': el colegio profesional va como [PENDIENTE]');
    if (conCapturas) await page.screenshot({ path: foto('60-' + p.replace('.html', '') + '.png') });
    await contexto.close();
  }
} finally {
  await navegador.close();
  servidor.close();
}

console.log('\n' + notas.join('\n'));
if (fallos.length) {
  console.log('\n──────── FALLOS ────────\n' + fallos.join('\n'));
  process.exitCode = 1;
} else {
  console.log('\nTodo en orden: ' + notas.length + ' comprobaciones.');
}
