# Gestoría Jorge Miralles · Badajoz

Web de una página para **Gestoría Jorge Miralles**, gestor administrativo colegiado con despacho en la calle Rafael Morales, 1, local B, Badajoz. Negocio real; la ve por teléfono el 29-09-2026. Sustituye a la página que colgaba de `miralles.onsurbe-abogados.com`, que a 28-09-2026 no resuelve.

> **Estado: maqueta de presentación. Todavía no se puede publicar como web del cliente.**
> Todas las páginas llevan `noindex, nofollow`. Lleva un mando de revisión interno (solo con `?revision`) que se borra antes de entregar y varios datos marcados como `[PENDIENTE]`. La primera persona («tráemelo», «yo me encargo») está pendiente de su visto bueno.

## Concepto: «Mesa despejada»

La mesa de cualquiera, vista desde arriba, llena de papeles que da pereza abrir: una multa, un modelo 303, el contrato de venta del coche, una nómina, una carta de Hacienda, el alta de autónomo. Al bajar, cada papel se va a su sitio, se apilan, se grapan y en la mesa solo queda el café. El mensaje: **«Tráemelo. Lo tuyo, fuera de tu mesa»**. Habla a particulares y autónomos igual que a empresas.

- **Cortina**: sobre tinta cae una hoja en blanco con un leve giro; en ella sube el nombre y alguien la aparta de la mesa arrastrándola a la derecha, con el fondo detrás y el borde curvo. Su color no es el del hero que destapa. Se retira sin GSAP, con movimiento reducido (ni un fotograma), con `<noscript>` y con dos redes de seguridad.
- **Hero anclado con scrub**: linóleo a pantalla completa con seis papeles desordenados y «¿Así está tu mesa?» letra a letra. Al bajar vuelan uno a uno al montón (solo `transform`), cae la grapa con rebote, entra la taza y el titular cambia a «Lo tuyo, *fuera de tu mesa.*». Al pasar el ratón por un papel se levanta un poco (magnético) y el cursor dice «coger». En móvil: cuatro papeles, texto en flujo arriba y el montón centrado debajo.
- **Marquesina a dos velocidades**: «Tráemelo» en mostaza sobre tinta y, detrás y en sentido contrario, lo que resuelve. Capacidad, no condiciones.
- **Los papeles (servicios)**: una pila sticky de cinco hojas, cada una un poco girada, literalmente un montón. Tráfico (DGT), Fiscal, Contable, Laboral y Legal. Cada hoja que se posa manda un papelito volando a la **bandeja de «hecho»** fija en la esquina, que hace de indicador de progreso y **se grapa al final de la página**. La bandeja tiene fondo propio para leerse sobre papel y sobre linóleo, y sube por encima del aviso de cookies en móvil.
- **Quién te lo lleva**: la tarjeta de visita de Jorge Miralles Nevado dibujada sobre la mesa, con el hueco de la foto marcado. Sin biografía inventada.
- **Reseñas**: 5,0 ★ con **1** reseña en Google, dicho tal cual, con el enlace para dejar otra. Un test falla si aparece prueba social en plural. No se cita el texto de la reseña porque no lo tenemos.
- **Horario y dónde**: estado en vivo con `Europe/Madrid`, mapa de Google solo bajo clic (`maps?q=…&output=embed`, sin clave), WhatsApp con el token `NUMERO-PENDIENTE` y un diálogo que explica que falta confirmarlo.
- **Pie**: la mesa despejada, con el café; la bandeja grapada queda fija en la esquina.

**Paleta**: linóleo `#4F6B5E` (hondo `#46604F`), papel `#FBF8F1`, tinta `#1F2320`, un solo acento mostaza `#E2A43A`, gris de grapa `#6F787C` y un rojo `#B33A33` solo en las marcas pequeñas de los papeles (MULTA, AEAT, DGT…). La mostaza no llega a 4,5:1 ni sobre linóleo (2,7) ni sobre papel (2,1), así que se queda para lo decorativo y para texto grande sobre linóleo hondo (3,2:1) y sobre tinta (7,3:1); para texto se derivan con `color-mix` `--acento-texto` (sobre papel, 5,0:1) y `--acento-claro` (sobre linóleo, 4,6:1). Todo calculado con `scripts/contraste.mjs`.
**Tipografías**: Instrument Serif (con cursiva para el acento) y Figtree.

**Ilustración**: todo SVG/HTML propio, sin fotos. Los papeles llevan textura muy suave (ruido SVG en un pseudoelemento), renglones, un doblez y la sombra en una capa cacheada que solo cambia de opacidad: ningún `filter` ni `box-shadow` animados por fotograma. El contenido de los papeles es genérico: ni nombres, ni matrículas, ni importes, ni escudos ni logos oficiales.

## Qué la separa de Botejara y del resto de asesorías

| Web | Motivo | Aquí no hay |
|---|---|---|
| Enrique Botejara (Badajoz) | Balanza que se nivela, pizarra con latón, Libre Caslon + Public Sans | Ni balanza, ni pizarra, ni esas tipografías (lo comprueba el script) |
| «Expediente» | Carpetas con pestañas | Hojas sueltas que se apilan; el gesto es del caos al orden |
| «Sello» | Un sello estampado protagonista | Solo marcas rojas pequeñas en los papeles |
| Rivand | Calendario fiscal y plazos en vivo | Ni plazos ni fechas: no se inventan plazos ni precios |
| Dourado & Fernández | Columnas de libro mayor | Nada contable dibujado |
| Cervantes | Pluma que escribe | El nombre sube en una hoja, no se escribe |
| Autoescuela | Carreteras, carriles, señales | La parte de tráfico es un papel («el papel del coche») |

Lo que sí comparte con las hermanas es el kit: GSAP + ScrollTrigger, Lenis desde jsDelivr, char-reveal, botones magnéticos, marquesina, cursor propio, cortina, cookies y mando de densidades. La estructura de secciones es propia.

## Fuentes y fecha de cada dato (consultado el 28-09-2026)

Ver `../gestoria-jorge-miralles-badajoz-bocetos/DATOS-MIRALLES.md`. En resumen: nombre, dirección, móvil, email, áreas y valoración salen de la ficha de Google y de AJE Extremadura (coinciden); el horario, de un resumen que cuadra con el «cierra a las 19:30» de Google.

## Lista de `[PENDIENTE]` (visible en la web)

- [ ] **Teléfono fijo 924 65 66 97**: sale solo de un resumen de buscador. No está en la web (un test falla si aparece).
- [ ] **Formación** («Universidad Europea»): sin fuente legible. No está en la web.
- [ ] **Número de colegiado y colegio profesional**: sin fuente. Marcadores en «Quién», pie y aviso legal.
- [ ] **Relación con Onsurbe Abogados**: se menciona la colaboración sin enlace. Marcador en la hoja «Legal».
- [ ] **WhatsApp**: no se da por hecho que el móvil lo tenga. Token `NUMERO-PENDIENTE` en el `href` y diálogo explicativo.
- [ ] **Horario de verano**: nota discreta en «Horario y dónde».
- [ ] **Logo**: no había ninguno. La marca provisional es una hoja grapada (`assets/favicon.svg` y el `<symbol id="logo">` de `index.html`).
- [ ] **Foto**: hueco marcado en la tarjeta de visita.
- [ ] **NIF** para el aviso legal y la privacidad.
- [ ] **Primera persona** («tráemelo», «yo me encargo», «soy Jorge»): pendiente de su visto bueno.
- [ ] **Listas «qué traer»** de la densidad sobria: orientativas, confirmar con él.

## Decisiones tomadas

- Se tutea y se habla en primera persona porque es un despacho de una persona (pendiente de su OK).
- En `schema.org` va `AccountingService` **sin `aggregateRating`**: con una sola reseña no aporta.
- Los papeles del hero se mueven con `transform` de GSAP; el giro de reposo también lo pone GSAP cuando hay movimiento, porque el `rotate` del CSS giraría el sistema de coordenadas del vuelo. Sin GSAP, el CSS hace la mesa recogida con `translate`/`rotate` y transición.
- GSAP 3.12 escribe `translate/rotate/scale: none` en línea cuando toca un transform: por eso la escala del papel al pasar el ratón también la pone GSAP.
- El hero no se ancla si es más alto que la pantalla (móviles bajos): entonces el scrub va sobre el recorrido normal.

## Estructura

```
index.html          cortina, hero, marquesina, papeles (pila), quién, reseñas, horario y dónde, pie, bandeja, índice, diálogo WhatsApp, cookies, mando
404.html            «Este papel no está en la mesa.» Rutas absolutas bajo /gestoria-jorge-miralles-badajoz-web/
aviso-legal.html    borrador con pendientes (NIF, colegio)
privacidad.html     borrador; lista lo que se guarda en localStorage
manifest.json
css/estilos.css
js/main.js          GSAP 3.12.5 + ScrollTrigger + Lenis 1.1.13, desde jsDelivr (cdnjs ya no sirve Lenis)
assets/             favicon.svg, og-miralles.png (1200×630)
scripts/            servir.mjs, verificar.mjs, contraste.mjs, comprobar-borrado.mjs, versionar.mjs
screenshots/        escritorio y móvil: cortina, hero a mitad de recoger y recogido, secciones, densidades, sin GSAP, movimiento reducido, 404, legales
```

## Revisar en local

```
node scripts/servir.mjs              # http://127.0.0.1:4194/gestoria-jorge-miralles-badajoz-web/
node scripts/verificar.mjs           # 134 comprobaciones con Playwright
node scripts/verificar.mjs --capturas
node scripts/contraste.mjs
node scripts/versionar.mjs           # antes de cada commit que toque CSS o JS
```

`verificar.mjs` sirve el sitio bajo el prefijo del repo y comprueba, con `mouse.wheel` (Lenis):

- **Datos**: en ninguna página aparece el fijo, «Universidad Europea», un número de colegiado, un enlace a Onsurbe, un WhatsApp dado por hecho ni prueba social en plural; `noindex` justo tras el charset; JSON-LD sin `aggregateRating`; CSS/JS versionados; Lenis desde jsDelivr; sin las tipografías de Botejara; ningún `filter` ni sombra animados en el JS.
- **Cortina**: la hoja cae desde arriba, se aparta a un lado, su color no es el del hero, y acaba en `display:none` en las tres pasadas (normal, sin GSAP, movimiento reducido).
- **Hero**: entra desordenado y anclado; a media bajada los papeles vuelan; al final el montón está completo, grapado (la grapa en la esquina del papel de arriba), con la taza, y el titular ha cambiado. Cursor propio: aro + punto, se rellena sobre botones y dice «coger» sobre un papel, que se levanta con la sombra cacheada.
- **Marquesina**: dos carriles a dos velocidades y sentidos.
- **Pila**: las cinco hojas miden lo mismo; en página limpia bajando en pasos de 90 px nadie se suelta antes, nada asoma por debajo de la última, salen en bloque y no queda hueco.
- **Bandeja**: cuenta 0 → 1 → 2 → 5, se ve de verdad (`elementFromPoint`) a media página y al final, con fondo propio, y se grapa al llegar al pie; en móvil sube por encima del aviso de cookies.
- **Reseñas, horario, WhatsApp, mapa, cookies, mando**: 5,0 con 1 reseña; estado abierto/cerrado coincide con las franjas en Europe/Madrid; el WhatsApp abre el diálogo; el iframe del mapa solo existe tras el clic; las cookies cierran de verdad; sin `?revision` no hay mando ni se aplica una densidad guardada.
- **Densidades**: la sobria quita la bandeja, pone el índice de texto, añade «qué traer» y deja el hero quieto y recogido; se puede volver.
- **Móvil**: cuatro papeles, el menú abre y cierra, con la cabecera fija ocupa 100dvh con desenfoque; a 360×640, 375×667, 390×844 y 768×1024 el texto y los papeles no se pisan ni al entrar ni recogidos.
- **Sin GSAP y con movimiento reducido**: la mesa se recoge sin viaje, el titular cambia, la bandeja cuenta, el horario se calcula.
- **Rendimiento**: huecos entre fotogramas durante el scroll medidos desde `fonts.ready`.
- **404 y legales**: el 404 sale a otra profundidad sin recursos rotos; las legales llevan el NIF y el colegio como `[PENDIENTE]`.

## Quitar el mando de maqueta antes de entregar

El mando **solo aparece si la URL lleva `?revision`**. El enlace que se manda al cliente, sin el parámetro, sale limpio, y sin `?revision` tampoco se aplica una densidad guardada.

Dos densidades:

- **Mesa**: papeles volando en el hero, cada hoja entrando en la mesa y la bandeja de «hecho» que se llena y se grapa.
- **Sobria**: los papeles quietos solo en el hero (la mesa ya recogida). La bandeja se sustituye por un índice de texto y cada servicio añade la lista de **qué traer** para el trámite más habitual, marcada como «orientativa · confirmar con Jorge».

Pasos para borrarlo. Están comprobados por `scripts/comprobar-borrado.mjs`, que falla si queda algún rastro:

1. `index.html`:
   - En el `<script>` del `<head>`, borrar desde `/* la densidad guardada solo cuenta…` hasta el `} catch (e) {}` del final, y la línea `[MANDO DE MAQUETA]` de su comentario. **La red de seguridad de la cortina (`setTimeout` de 8 s) se queda.**
   - Borrar el `<div class="mando">` del final con su comentario.
   - Quitar `densidad-mesa` de la clase del `<html>`.
   - Si el cliente elige la **Mesa**: borrar el `<ol class="indice">` y los cinco `<div class="hoja__traer">`.
   - Si elige la **Sobria**: antes de borrar, pasar sus reglas a CSS normal (quitar el prefijo `.densidad-sobria` en `estilos.css`), borrar el `<div class="bandeja">` y dejar el índice y las listas.
2. `css/estilos.css`: borrar todo lo que hay entre `[MANDO DE MAQUETA]` y `fin del bloque [MANDO DE MAQUETA]`.
3. `js/main.js`: borrar la función `mandoMaqueta()` entre los mismos comentarios, la escucha de `densidad-cambiada` dentro de `papeles()` y la función `sobria()` con sus usos (o dejarla devolviendo `false`).
4. `privacidad.html`: borrar la fila `miralles-densidad`.
5. Pasar `node scripts/comprobar-borrado.mjs`.

## Antes de publicar como web del cliente

- [ ] Resolver los pendientes de arriba (fijo, formación, colegiado, Onsurbe, WhatsApp, horario de verano, logo, foto, NIF, primera persona).
- [ ] Borrar el mando y pasar `comprobar-borrado.mjs`.
- [ ] Quitar el `noindex` de las cuatro páginas.
- [ ] `node scripts/versionar.mjs` y `node scripts/verificar.mjs`.
