/* ═══════════════════════════════════════════════════════════════════════════
   Gestoría Jorge Miralles · «Mesa despejada»
   Cae una hoja en blanco y alguien la aparta de la mesa. En el hero, los seis
   papeles vuelan uno a uno al montón mientras bajas; cae la grapa, entra el
   café y el titular cambia. En los servicios, cada hoja que se posa manda un
   papelito a la bandeja de «hecho» de la esquina, que se grapa al final.

   Banderas separadas a propósito:
     gsapReady  → hay motor de animación (GSAP + ScrollTrigger cargados)
     movimiento → además el usuario NO ha pedido reducir el movimiento
   Con movimiento reducido el CONTENIDO sigue cambiando (la mesa recogida, la
   cuenta de la bandeja, el estado del horario); lo que se apaga es el viaje.

   Cada propiedad tiene un solo dueño: el scroll mueve el .papel (transform de
   GSAP); el ratón levanta la .papel__hoja de dentro. Ninguna sombra ni
   desenfoque se anima por fotograma: la sombra es una capa cacheada que solo
   cambia de opacidad.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esTactil = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var gsapReady = !!(window.gsap && window.ScrollTrigger);
  var movimiento = gsapReady && !reduce;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;

  if (gsapReady) {
    gsap.registerPlugin(ST);
    gsap.ticker.lagSmoothing(80, 33);   /* un atasco en la carga en frío no se salta la caída de la hoja */
  }
  html.classList.add(movimiento ? 'con-movimiento' : 'sin-movimiento');

  function esMovil() { return window.matchMedia('(max-width: 900px)').matches; }
  function sobria() { return html.classList.contains('densidad-sobria'); }
  function alturaCabecera() { return parseFloat(getComputedStyle(html).getPropertyValue('--cab')) || 76; }
  function tope() { return alturaCabecera() + window.innerHeight * 0.03; }
  function prop(el, nombre) { return (el.style.getPropertyValue(nombre) || getComputedStyle(el).getPropertyValue(nombre) || '').trim(); }
  function grados(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }

  function cuandoVisible(nodos, umbral, alEntrar) {
    if (!('IntersectionObserver' in window)) { nodos.forEach(alEntrar); return; }
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        obs.unobserve(en.target);
        alEntrar(en.target);
      });
    }, { threshold: umbral });
    nodos.forEach(function (n) { obs.observe(n); });
  }

  /* ───────────────────────── Lenis ───────────────────────── */
  var lenis = null;
  if (movimiento && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  }

  function irA(destino) {
    var desfase = -alturaCabecera() + 1;
    if (destino === '#inicio') {             /* el hero está anclado: su rect no dice dónde empieza */
      if (lenis) lenis.scrollTo(0, { duration: 1.4 }); else window.scrollTo(0, 0);
      return;
    }
    if (lenis) { lenis.scrollTo(destino, { offset: desfase, duration: 1.6 }); return; }
    var el = typeof destino === 'string' ? document.querySelector(destino) : destino;
    if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.pageYOffset + desfase);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id === '#' || !document.querySelector(id)) return;
    e.preventDefault();
    cerrarMenu();
    irA(id);
  });

  /* ───────────────────── titulares partidos ───────────────────── */
  function partir(el) {
    var modo = el.dataset.revelar;
    var texto = el.textContent.replace(/\s+/g, ' ').trim();
    if (!el.hasAttribute('aria-hidden')) el.setAttribute('aria-label', texto);
    var nodos = Array.prototype.slice.call(el.childNodes);
    el.textContent = '';
    var piezas = [];
    /* se respeta el <em> del acento: cada trozo de texto se parte dentro de su envoltorio */
    function partirTexto(trozo, destino) {
      var palabras = trozo.split(/(\s+)/);
      palabras.forEach(function (palabra) {
        if (!palabra) return;
        if (/^\s+$/.test(palabra)) { destino.appendChild(document.createTextNode(' ')); return; }
        var caja = document.createElement('span');
        caja.className = 'palabra';
        caja.setAttribute('aria-hidden', 'true');
        if (modo === 'letras') {
          palabra.split('').forEach(function (c) {
            var s = document.createElement('span');
            s.className = 'letra';
            s.textContent = c;
            caja.appendChild(s);
            piezas.push(s);
          });
        } else {
          var s = document.createElement('span');
          s.className = 'palabra-int';
          s.textContent = palabra;
          caja.appendChild(s);
          piezas.push(s);
        }
        destino.appendChild(caja);
      });
    }
    nodos.forEach(function (n) {
      if (n.nodeType === 3) { partirTexto(n.textContent, el); return; }
      var envoltorio = n.cloneNode(false);
      partirTexto(n.textContent, envoltorio);
      el.appendChild(envoltorio);
    });
    return piezas;
  }

  function revelar(el, piezas, retardo) {
    /* y:0 explícito: GSAP lee el translate3d del CSS como píxeles, no como yPercent */
    gsap.to(piezas, {
      y: 0, yPercent: 0,
      duration: 1.1,
      ease: 'expo.out',
      delay: retardo || 0,
      stagger: el.dataset.revelar === 'letras' ? 0.024 : 0.055
    });
  }

  var letrasDespues = [];
  Array.prototype.forEach.call(document.querySelectorAll('[data-revelar]'), function (el) {
    var piezas = partir(el);
    if (el.hasAttribute('data-revelar-manual')) { letrasDespues = piezas; return; }   /* la enseña el scrub del hero */
    if (!movimiento) return;
    if (el.closest('.hero')) {
      document.addEventListener('cortina-abriendose', function () { revelar(el, piezas, 0.35); }, { once: true });
      return;
    }
    cuandoVisible([el], 0.3, function () { revelar(el, piezas); });
  });

  /* ───────────────── cortina: cae la hoja y se aparta de la mesa ───────────────── */
  (function cortina() {
    var cort = document.getElementById('cortina');
    if (!cort) return;
    var hecho = false, abierta = false;

    function abriendose() {
      if (abierta) return;
      abierta = true;
      document.dispatchEvent(new CustomEvent('cortina-abriendose'));
    }
    function retirar() {
      if (hecho) return;
      hecho = true;
      abriendose();
      cort.classList.add('fuera');
      html.classList.remove('cortina-activa');
      if (lenis) lenis.start();
      if (ST) ST.refresh();
      document.dispatchEvent(new CustomEvent('cortina-retirada'));
    }

    if (!movimiento) {
      /* sin GSAP o con movimiento reducido se retira igual: nunca tapa la página */
      setTimeout(retirar, reduce ? 200 : 120);
      return;
    }

    html.classList.add('cortina-activa');
    if (lenis) lenis.stop();

    var fondo = document.getElementById('cortina-fondo');
    var hoja = document.getElementById('cortina-hoja');
    var labio = document.getElementById('cortina-labio-path');
    var nombre = Array.prototype.slice.call(cort.querySelectorAll('.cortina__nombre b'));
    var pie = document.getElementById('cortina-pie');
    var alto = window.innerHeight, ancho = window.innerWidth;

    var tl = gsap.timeline({ onComplete: retirar });
    /* la hoja cae desde arriba con un leve giro y se posa */
    tl.set(hoja, { y: -alto * 1.3, rotation: -9, autoAlpha: 1 }, 0)
      .to(hoja, { y: 0, duration: 0.95, ease: 'power2.out' }, 0.05)
      .to(hoja, { rotation: -2.5, duration: 1.1, ease: 'back.out(1.8)' }, 0.05)
      .to(nombre, { y: 0, yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.09 }, 0.55)
      .to(pie, { opacity: 1, duration: 0.5 }, 1.15)
      /* la aparta de la mesa: la hoja sale arrastrada a la derecha y el fondo la sigue */
      .add(abriendose, 1.85)
      .to(hoja, { x: ancho * 1.3, y: alto * 0.12, rotation: 16, duration: 0.8, ease: 'power3.in' }, 1.85)
      .to(fondo, { xPercent: 112, duration: 1.05, ease: 'expo.inOut' }, 2.0)
      /* el borde de salida se abomba y se aplana */
      .to(labio, { attr: { d: 'M10 0V100H10Q-9 50 10 0Z' }, duration: 0.5, ease: 'power2.in' }, 2.0)
      .to(labio, { attr: { d: 'M10 0V100H10Q10 50 10 0Z' }, duration: 0.55, ease: 'power2.out' }, 2.5);

    /* red de seguridad: pase lo que pase, a los 7 s la cortina se va */
    setTimeout(retirar, 7000);
  })();

  /* ───────────────── hero: la mesa se recoge al bajar ───────────────── */
  var montarHero = function () {};
  (function hero() {
    var seccion = document.getElementById('inicio');
    var mesa = document.getElementById('mesa');
    if (!seccion || !mesa) return;
    var papeles = Array.prototype.slice.call(mesa.querySelectorAll('.papel'));
    var grapa = document.getElementById('grapa');
    var taza = document.getElementById('taza');
    var antes = document.getElementById('frase-antes');
    var SR = [-3, 2, -1, 1.5, -2, 0];   /* giro de cada papel ya en el montón */
    var st = null, tl = null;

    function visibles() { return papeles.filter(function (p) { return getComputedStyle(p).display !== 'none'; }); }
    function reposo(p) {
      var m = esMovil();
      return grados(m ? (prop(p, '--mr') || prop(p, '--r')) : prop(p, '--r'));
    }

    /* mide el reposo (offsetLeft/Top ignoran transforms) y calcula el destino de cada papel */
    function geometria() {
      var vis = visibles();
      var W = mesa.clientWidth, H = mesa.clientHeight;
      var m = esMovil();
      var cx = m ? W * 0.5 : W * 0.70, cy = m ? H * 0.5 : H * 0.52;
      var pw = 0, ph = 0;
      vis.forEach(function (p, i) {
        pw = p.offsetWidth; ph = p.offsetHeight;
        var rx = p.offsetLeft + pw / 2, ry = p.offsetTop + ph / 2;
        var tx = cx + i * 2, ty = cy + i * 3;
        p.style.setProperty('--dx', (tx - rx).toFixed(1) + 'px');
        p.style.setProperty('--dy', (ty - ry).toFixed(1) + 'px');
        p.style.setProperty('--sr', SR[i] + 'deg');
        p.style.setProperty('--z', String(10 + i));
        p.dataset.dx = (tx - rx).toFixed(1);
        p.dataset.dy = (ty - ry).toFixed(1);
        p.dataset.giro = String(SR[i] - reposo(p));
      });
      /* la grapa, en la esquina del montón; la taza, en la esquina de la mesa */
      var n = vis.length;
      mesa.style.setProperty('--gx', Math.round(cx + (n - 1) * 2 - pw / 2 + 16) + 'px');
      mesa.style.setProperty('--gy', Math.round(cy + (n - 1) * 3 - ph / 2 + 7) + 'px');
      /* la taza, abajo a la derecha del montón, sin pisar la bandeja fija de la esquina */
      var tw = taza.offsetWidth, th = taza.offsetHeight;
      var tx = Math.min(cx + pw / 2 + (m ? 14 : 44), W - tw - 8);
      var ty = Math.min(cy + ph / 2 - (m ? 44 : 30), H - th - 8);
      mesa.style.setProperty('--tx', Math.round(tx) + 'px');
      mesa.style.setProperty('--ty', Math.round(ty) + 'px');
      return vis;
    }

    function limpiar() {
      if (st) { st.kill(); st = null; }
      if (tl) { tl.kill(); tl = null; }
      if (gsapReady) {
        gsap.set(papeles.concat([grapa, taza, antes]), { clearProps: 'transform,opacity,visibility' });   /* nunca 'all': borraría las --x/--y del style */
        gsap.set(letrasDespues, { clearProps: 'transform' });
      }
    }

    function montar() {
      limpiar();
      seccion.classList.remove('hero--recogido');
      var vis = geometria();

      if (!movimiento || sobria()) {
        /* sin viaje (o densidad sobria): mesa desordenada arriba, recogida en cuanto se baja.
           En la sobria los papeles están quietos: la mesa ya recogida desde el principio. */
        if (sobria()) { seccion.classList.add('hero--recogido'); return; }
        var revisar = function () {
          seccion.classList.toggle('hero--recogido', window.pageYOffset > seccion.offsetHeight * 0.22);
        };
        window.addEventListener('scroll', revisar, { passive: true });
        revisar();
        return;
      }

      /* con GSAP el giro de reposo también lo pone GSAP: así el vuelo (x,y) no se
         calcula en un sistema girado por el `rotate` del CSS */
      vis.forEach(function (p) { gsap.set(p, { rotation: reposo(p) }); });

      tl = gsap.timeline({ defaults: { ease: 'none' } });
      vis.forEach(function (p, i) {
        tl.to(p, {
          x: parseFloat(p.dataset.dx), y: parseFloat(p.dataset.dy),
          rotation: SR[i], duration: 2.2, ease: 'power2.inOut'
        }, i * 0.8);
      });
      var fin = (vis.length - 1) * 0.8 + 2.2;
      tl.fromTo(taza, { autoAlpha: 0, scale: 0.7, y: 40 }, { autoAlpha: 1, scale: 1, y: 0, duration: 1.1, ease: 'power2.out', immediateRender: false }, fin - 0.6)
        .fromTo(grapa, { autoAlpha: 0, y: -46 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'bounce.out', immediateRender: false }, fin + 0.2)
        .to(antes, { y: -34, autoAlpha: 0, duration: 0.8, ease: 'power2.in' }, fin - 0.35)
        .fromTo(letrasDespues, { yPercent: 135, y: 0 }, { yPercent: 0, y: 0, duration: 1.2, stagger: 0.03, ease: 'power3.out', immediateRender: false }, fin + 0.05)
        .to({}, { duration: 0.8 });   /* un respiro con la mesa ya recogida antes de soltar el anclaje */

      var cabe = seccion.offsetHeight <= window.innerHeight + 24;
      st = ST.create({
        trigger: seccion,
        start: cabe ? 'top top' : 'top 12%',
        end: cabe ? '+=' + (esMovil() ? 120 : 150) + '%' : 'bottom 96%',
        pin: cabe,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        animation: tl
      });
    }
    montarHero = montar;

    /* entrada del texto tras la cortina */
    var texto = seccion.querySelector('.hero__texto');
    var entrada = ['.antetitulo', '.hero__entrada', '.hero__acciones', '.hero__nota'].map(function (s) { return texto.querySelector(s); });
    if (movimiento) {
      gsap.set(entrada, { opacity: 0, y: 24 });
      gsap.set(seccion.querySelector('.hero__desliza'), { opacity: 0 });
      document.addEventListener('cortina-abriendose', function () {
        gsap.to(entrada, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1, delay: 0.55 });
        gsap.to(seccion.querySelector('.hero__desliza'), { opacity: 1, duration: 0.8, delay: 1.1 });
      }, { once: true });
    }

    montar();
    var temporizador;
    window.addEventListener('resize', function () {
      clearTimeout(temporizador);
      temporizador = setTimeout(function () { montar(); if (ST) ST.refresh(); }, 220);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { montar(); if (ST) ST.refresh(); });

    /* el ratón levanta el papel: la hoja de dentro, nunca el .papel que mueve el scroll */
    if (movimiento && !esTactil) {
      papeles.forEach(function (p) {
        var hoja = p.querySelector('.papel__hoja');
        var aX = gsap.quickTo(hoja, 'x', { duration: 0.5, ease: 'power3.out' });
        var aY = gsap.quickTo(hoja, 'y', { duration: 0.5, ease: 'power3.out' });
        /* GSAP pone `scale: none` en línea al escribir su transform: la escala también va por GSAP */
        p.addEventListener('pointerenter', function () { hoja.classList.add('papel__hoja--alzada'); gsap.to(hoja, { scale: 1.035, duration: 0.45, ease: 'power3.out' }); });
        p.addEventListener('pointermove', function (e) {
          var c = p.getBoundingClientRect();
          aX((e.clientX - (c.left + c.width / 2)) * 0.12);
          aY((e.clientY - (c.top + c.height / 2)) * 0.12);
        });
        p.addEventListener('pointerleave', function () { aX(0); aY(0); hoja.classList.remove('papel__hoja--alzada'); gsap.to(hoja, { scale: 1, duration: 0.45, ease: 'power3.out' }); });
      });
    }
  })();

  /* ───────────────── marquesina a dos velocidades ───────────────── */
  (function marquesina() {
    var carriles = Array.prototype.slice.call(document.querySelectorAll('.marquesina__carril'));
    if (!carriles.length) return;
    var velocidadScroll = 0;
    if (lenis) lenis.on('scroll', function (e) { velocidadScroll = Math.min(Math.abs(e.velocity || 0) * 0.35, 8); });
    carriles.forEach(function (pista) {
      var grupo = pista.firstElementChild;
      var copias = Math.ceil((window.innerWidth * 2) / Math.max(1, grupo.offsetWidth)) + 1;
      for (var i = 0; i < copias; i++) {
        var c = grupo.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        pista.appendChild(c);
      }
      if (!movimiento) return;
      var base = parseFloat(pista.dataset.velocidad) || 0.6;
      var x = base < 0 ? -grupo.offsetWidth : 0;
      /* rAF propio: ningún tween de GSAP toca esta propiedad, el -= no pisa nada */
      (function paso() {
        var ancho = grupo.offsetWidth;
        var v = base + (base < 0 ? -1 : 1) * velocidadScroll * Math.abs(base);
        x -= v;
        if (ancho) {
          if (x <= -ancho) x += ancho;
          if (x > 0) x -= ancho;
        }
        pista.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
        requestAnimationFrame(paso);
      })();
    });
    if (movimiento) gsap.ticker.add(function () { velocidadScroll *= 0.92; });
  })();

  /* ───────────────── los papeles: pila, bandeja e índice ───────────────── */
  var revisarBandeja = function () {};
  (function papeles() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.pila__item'));
    var lista = document.getElementById('pila');
    if (!items.length || !lista) return;
    var disparos = [];

    /* Todas miden lo que la más alta: la condición para que la pila no se
       deshaga por la última. Se mide el contenido, no la pantalla. */
    function igualar() {
      var hojas = items.map(function (it) { return it.querySelector('.hoja'); });
      lista.style.removeProperty('--alto-hoja');
      if (getComputedStyle(items[0]).position !== 'sticky') return;
      hojas.forEach(function (h) { h.style.height = 'auto'; });
      var alto = Math.max.apply(null, hojas.map(function (h) { return h.offsetHeight; }));
      hojas.forEach(function (h) { h.style.removeProperty('height'); });
      lista.style.setProperty('--alto-hoja', alto + 'px');
    }

    function montar() {
      igualar();
      if (!movimiento) return;
      disparos.forEach(function (d) { d.kill(); });
      disparos = [];
      items.forEach(function (it) {
        var h = it.querySelector('.hoja');
        gsap.set(h, { clearProps: 'transform' });
        h.style.removeProperty('--oscuro');
      });
      if (getComputedStyle(items[0]).position !== 'sticky' || sobria()) return;
      var arriba = Math.round(tope());
      items.forEach(function (it, i) {
        var siguiente = items[i + 1];
        if (!siguiente) return;
        var hoja = it.querySelector('.hoja');
        var tw = gsap.fromTo(hoja, { scale: 1, '--oscuro': 0 }, { scale: 0.94, '--oscuro': 0.22, ease: 'none', paused: true, immediateRender: false });
        disparos.push(ST.create({
          trigger: siguiente,
          start: 'top bottom',
          end: 'top ' + arriba + 'px',        /* acaba justo cuando la siguiente se posa */
          scrub: true,
          animation: tw
        }));
      });
    }

    /* cada hoja entra en la mesa (solo en la densidad Mesa) */
    if (movimiento) {
      items.forEach(function (it) {
        var h = it.querySelector('.hoja');
        gsap.set(h, { y: 70, autoAlpha: 0 });
      });
      cuandoVisible(items, 0.12, function (it) {
        var h = it.querySelector('.hoja');
        gsap.to(h, { y: 0, autoAlpha: 1, duration: sobria() ? 0.01 : 1.1, ease: 'expo.out', clearProps: 'y,opacity,visibility' });
      });
    }

    montar();
    var temporizador;
    window.addEventListener('resize', function () {
      clearTimeout(temporizador);
      temporizador = setTimeout(function () { montar(); if (ST) ST.refresh(); revisar(); }, 220);
    });
    document.addEventListener('densidad-cambiada', function () {
      setTimeout(function () {
        items.forEach(function (it) { var h = it.querySelector('.hoja'); if (gsapReady) gsap.set(h, { clearProps: 'y,opacity,visibility' }); });
        montar(); montarHero(); if (ST) ST.refresh(); revisar();
      }, 60);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { montar(); if (ST) ST.refresh(); });

    /* ── la bandeja de «hecho»: cada hoja que se posa manda un papelito ── */
    var bandeja = document.getElementById('bandeja');
    var caja = document.getElementById('bandeja-caja');
    var cuenta = document.getElementById('bandeja-n');
    var hojasBandeja = Array.prototype.slice.call(document.querySelectorAll('.bandeja__hoja'));
    var indice = Array.prototype.slice.call(document.querySelectorAll('#indice li'));
    var pieDoc = document.getElementById('pie');
    var n = -1;

    function volar(i) {
      /* origen: la esquina superior izquierda de la hoja; destino: el hueco real de la bandeja */
      var origen = items[i].querySelector('.hoja').getBoundingClientRect();
      var destino = hojasBandeja[i].getBoundingClientRect();
      if (!destino.width) return;
      var v = document.createElement('span');
      v.className = 'vuelo';
      document.body.appendChild(v);
      var ox = origen.left + 24, oy = origen.top + 24;
      var sx = Math.min(1, origen.width / 4) / 60;
      gsap.set(v, { x: ox, y: oy, scale: Math.max(1.6, sx * 60 / 60 * 2.2), rotation: -6, opacity: 1 });
      gsap.to(v, {
        x: destino.left + (destino.width - 60) / 2, y: destino.top + (destino.height - 42) / 2,
        scale: destino.width / 60, rotation: grados(prop(hojasBandeja[i], '--r')),
        duration: 0.85, ease: 'power3.inOut',
        onComplete: function () { v.remove(); hojasBandeja[i].classList.add('puesta'); }
      });
    }

    function ponerN(nuevo) {
      if (nuevo === n) return;
      var anterior = n;
      n = nuevo;
      cuenta.textContent = String(n);
      indice.forEach(function (li) { li.classList.toggle('activo', Number(li.dataset.i) <= n); });
      hojasBandeja.forEach(function (h, i) {
        if (i + 1 > n) h.classList.remove('puesta');
        else if (!(movimiento && !sobria() && anterior >= 0 && i + 1 > anterior)) h.classList.add('puesta');
      });
      if (movimiento && !sobria() && anterior >= 0) {
        for (var i = anterior; i < n; i++) volar(i);
      }
    }
    function revisar() {
      var pegada = getComputedStyle(items[0]).position === 'sticky';
      var umbral = pegada ? tope() + 2 : window.innerHeight * 0.55;
      ponerN(items.filter(function (li) { return li.getBoundingClientRect().top <= umbral; }).length);
      /* al final de la página, con la bandeja llena, se grapa */
      var pie = pieDoc ? pieDoc.getBoundingClientRect() : null;
      var grapada = n === items.length && pie && pie.top < window.innerHeight - 40;
      bandeja.classList.toggle('bandeja--grapada', !!grapada);
    }
    revisarBandeja = revisar;
    window.addEventListener('scroll', revisar, { passive: true });
    if (lenis) lenis.on('scroll', revisar);
    revisar();
  })();

  /* ───────────────── contadores ───────────────── */
  (function contadores() {
    var nodos = Array.prototype.slice.call(document.querySelectorAll('[data-contador]'));
    function formatear(v, el) {
      var dec = parseInt(el.dataset.decimales || '0', 10);
      return dec ? v.toFixed(dec).replace('.', ',') : Math.round(v).toString();
    }
    if (movimiento) nodos.forEach(function (el) { el.textContent = formatear(0, el); });
    cuandoVisible(nodos, 0.5, function (el) {
      var fin = parseFloat(el.dataset.contador);
      if (!movimiento) { el.textContent = formatear(fin, el); return; }
      var estado = { v: 0 };
      gsap.to(estado, {
        v: fin, duration: 1.6, ease: 'power2.out',
        onUpdate: function () { el.textContent = formatear(estado.v, el); },
        onComplete: function () { el.textContent = formatear(fin, el); }
      });
    });
  })();

  /* ───────────────── botones magnéticos ───────────────── */
  (function imanes() {
    if (!movimiento || esTactil) return;
    Array.prototype.forEach.call(document.querySelectorAll('.iman'), function (el) {
      var aX = gsap.quickTo(el, 'x', { duration: 0.55, ease: 'power3.out' });
      var aY = gsap.quickTo(el, 'y', { duration: 0.55, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var c = el.getBoundingClientRect();
        aX((e.clientX - (c.left + c.width / 2)) * 0.3);
        aY((e.clientY - (c.top + c.height / 2)) * 0.4);
      });
      el.addEventListener('pointerleave', function () { aX(0); aY(0); });
    });
  })();

  /* ───────────────── cursor propio ───────────────── */
  (function cursor() {
    if (!movimiento || esTactil) return;
    var c = document.createElement('div');
    var p = document.createElement('div');
    var t = document.createElement('span');
    c.className = 'cursor';
    p.className = 'cursor-punto';
    t.className = 'cursor__texto';
    t.textContent = 'coger';
    c.appendChild(t);
    [c, p].forEach(function (n) { n.setAttribute('aria-hidden', 'true'); document.body.appendChild(n); });
    var aX = gsap.quickTo(c, 'x', { duration: 0.28, ease: 'power3.out' });
    var aY = gsap.quickTo(c, 'y', { duration: 0.28, ease: 'power3.out' });

    function mostrar(si) {
      c.classList.toggle('cursor--vivo', si);
      p.classList.toggle('cursor--vivo', si);
    }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (!c.classList.contains('cursor--vivo')) {
        gsap.set(c, { x: e.clientX, y: e.clientY });
        html.classList.add('con-cursor');        /* el del sistema se oculta cuando el propio ya se ve */
        mostrar(true);
      }
      gsap.set(p, { x: e.clientX, y: e.clientY });
      aX(e.clientX); aY(e.clientY);
    });
    html.addEventListener('mouseleave', function () { mostrar(false); });
    html.addEventListener('mouseenter', function () { if (html.classList.contains('con-cursor')) mostrar(true); });
    document.addEventListener('pointerover', function (e) {
      var coger = !!e.target.closest('.hero .papel');
      var sobre = !coger && !!e.target.closest('a, button, .map-consent');
      c.classList.toggle('cursor--coger', coger);
      c.classList.toggle('cursor--activo', sobre);
      p.classList.toggle('cursor-punto--activo', sobre || coger);
    });
  })();

  /* ───────────────── cabecera ───────────────── */
  var cabecera = document.getElementById('cabecera');
  var boton = document.getElementById('hamburguesa');

  (function cabeceraFija() {
    if (!cabecera) return;
    function actualizar() { cabecera.classList.toggle('cabecera--fija', window.pageYOffset > 8); }
    window.addEventListener('scroll', actualizar, { passive: true });
    actualizar();
  })();

  function cerrarMenu() {
    if (!cabecera || !boton || !cabecera.classList.contains('menu-abierto')) return;
    cabecera.classList.remove('menu-abierto');
    boton.setAttribute('aria-expanded', 'false');
    boton.querySelector('.visualmente-oculto').textContent = 'Abrir menú';
    if (lenis) lenis.start();
  }
  if (boton) {
    boton.addEventListener('click', function () {
      var abierto = cabecera.classList.toggle('menu-abierto');
      boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      boton.querySelector('.visualmente-oculto').textContent = abierto ? 'Cerrar menú' : 'Abrir menú';
      if (lenis) { if (abierto) lenis.stop(); else lenis.start(); }
    });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarMenu(); });

  /* ───────────────── horario en vivo (Europe/Madrid) ───────────────── */
  (function horario() {
    var estado = document.getElementById('horario-estado');
    var tabla = document.getElementById('horario-tabla');
    if (!estado || !tabla) return;
    /* franjas en horas decimales; 0 = domingo */
    var FRANJAS = { 1: [[8.5, 14], [17, 19.5]], 2: [[8.5, 14], [17, 19.5]], 3: [[8.5, 14], [17, 19.5]], 4: [[8.5, 14], [17, 19.5]], 5: [[8.5, 14.5]], 6: [], 0: [] };
    var NOMBRES = ['el domingo', 'el lunes', 'el martes', 'el miércoles', 'el jueves', 'el viernes', 'el sábado'];
    var DIAS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    function hora(h) { var m = Math.round((h % 1) * 60); return Math.floor(h) + ':' + (m < 10 ? '0' : '') + m; }
    function ahora() {
      var partes = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      var o = {};
      partes.forEach(function (p) { o[p.type] = p.value; });
      return { dia: DIAS[o.weekday], h: parseInt(o.hour, 10) % 24 + parseInt(o.minute, 10) / 60 };
    }
    function pintar() {
      var t = ahora();
      Array.prototype.forEach.call(tabla.querySelectorAll('tr'), function (tr) {
        tr.classList.toggle('hoy', tr.dataset.dias.split(',').indexOf(String(t.dia)) !== -1);
      });
      var hoy = FRANJAS[t.dia];
      var abierto = null;
      hoy.forEach(function (f) { if (t.h >= f[0] && t.h < f[1]) abierto = f; });
      if (abierto) {
        estado.textContent = 'Abierto ahora · cierra a las ' + hora(abierto[1]);
        estado.classList.add('horario__estado--abierto');
        estado.dataset.estado = 'abierto';
        return;
      }
      estado.classList.remove('horario__estado--abierto');
      estado.dataset.estado = 'cerrado';
      var proxima = null;
      hoy.forEach(function (f) { if (!proxima && t.h < f[0]) proxima = 'hoy a las ' + hora(f[0]); });
      for (var d = 1; d <= 7 && !proxima; d++) {
        var dia = (t.dia + d) % 7;
        if (FRANJAS[dia].length) proxima = NOMBRES[dia] + ' a las ' + hora(FRANJAS[dia][0][0]);
      }
      estado.textContent = 'Cerrado ahora · abre ' + proxima;
    }
    pintar();
    setInterval(pintar, 60000);
  })();

  /* ───────────────── WhatsApp sin confirmar ───────────────── */
  (function whatsapp() {
    var enlace = document.getElementById('whatsapp');
    var dialogo = document.getElementById('wa-dialogo');
    var cerrar = document.getElementById('wa-cerrar');
    if (!enlace || !dialogo) return;
    enlace.addEventListener('click', function (e) {
      if (!/NUMERO-PENDIENTE/.test(enlace.getAttribute('href'))) return;   /* con número real, el enlace funciona */
      e.preventDefault();
      if (typeof dialogo.showModal === 'function') dialogo.showModal();
      else dialogo.setAttribute('open', '');
    });
    if (cerrar) cerrar.addEventListener('click', function () { if (dialogo.close) dialogo.close(); else dialogo.removeAttribute('open'); });
  })();

  /* ───────────────── mapa solo bajo clic ───────────────── */
  (function mapa() {
    var btn = document.getElementById('mapa-boton');
    var caja = document.getElementById('mapa-consentimiento');
    if (!btn || !caja) return;
    btn.addEventListener('click', function () {
      var marco = document.createElement('iframe');
      marco.src = caja.dataset.mapSrc;
      marco.loading = 'lazy';
      marco.title = 'Mapa: Gestoría Jorge Miralles, calle Rafael Morales, 1, Badajoz';
      marco.referrerPolicy = 'no-referrer-when-downgrade';
      caja.parentNode.replaceChild(marco, caja);
    });
  })();

  /* ───────────────── aviso de cookies ───────────────── */
  (function cookies() {
    var caja = document.getElementById('cookies');
    var ok = document.getElementById('cookies-aceptar');
    if (!caja || !ok) return;
    var guardado = null;
    try { guardado = localStorage.getItem('miralles-cookies'); } catch (e) {}
    function medir() { html.style.setProperty('--alto-cookies', (caja.offsetHeight + 20) + 'px'); }
    if (guardado !== 'ok') {
      caja.hidden = false;
      document.body.classList.add('cookies-visibles');
      medir();
      window.addEventListener('resize', medir);
    }
    ok.addEventListener('click', function () {
      caja.hidden = true;                     /* el CSS pone display solo si NO hay [hidden] */
      document.body.classList.remove('cookies-visibles');
      try { localStorage.setItem('miralles-cookies', 'ok'); } catch (e) {}
    });
  })();

  var anio = document.getElementById('anio');
  if (anio) anio.textContent = new Date().getFullYear();

  /* las medidas cambian cuando llegan las fuentes y con cualquier relayout tardío */
  if (gsapReady) {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
    if ('ResizeObserver' in window) {
      var espera;
      new ResizeObserver(function () {
        clearTimeout(espera);
        espera = setTimeout(function () { ST.refresh(); revisarBandeja(); }, 150);
      }).observe(document.documentElement);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     [MANDO DE MAQUETA] — SOLO REVISIÓN INTERNA. NO PUBLICAR.
     Borrar este bloque entero, el bloque CSS marcado igual en estilos.css,
     el <div class="mando"> del HTML y la parte de densidad del <head>.
     ═══════════════════════════════════════════════════════════════════════ */
  (function mandoMaqueta() {
    var mando = document.getElementById('mando');
    if (!mando) return;
    /* solo con ?revision: el enlace que recibe el cliente sale limpio */
    if (!/[?&]revision\b/.test(window.location.search)) return;
    mando.hidden = false;
    var botones = Array.prototype.slice.call(mando.querySelectorAll('[data-densidad]'));

    function aplicar(d) {
      html.classList.remove('densidad-mesa', 'densidad-sobria');
      html.classList.add('densidad-' + d);
      botones.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.densidad === d ? 'true' : 'false'); });
      try { localStorage.setItem('miralles-densidad', d); } catch (e) {}
      document.dispatchEvent(new CustomEvent('densidad-cambiada', { detail: d }));
    }
    var actual = html.classList.contains('densidad-sobria') ? 'sobria' : 'mesa';
    botones.forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.densidad === actual ? 'true' : 'false');
      b.addEventListener('click', function () { aplicar(b.dataset.densidad); });
    });
  })();
  /* ═══════════ fin del bloque [MANDO DE MAQUETA] ═══════════ */

})();
