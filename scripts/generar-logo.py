"""Genera el logo «Grapa» (boceto A de logos.html) trazado a curvas.

    python scripts/generar-logo.py

Las letras salen de las fuentes de scripts/fuentes (Instrument Serif y Figtree,
licencia SIL OFL) con HarfBuzz para el kerning, así que los SVG no dependen de
ninguna fuente instalada. Escribe:

    assets/logo/marca.svg            JM + grapa, tinta sobre claro
    assets/logo/marca-claro.svg      JM + grapa, papel sobre oscuro
    assets/logo/logo.svg             marca + «Jorge Miralles» + «Gestoría · Badajoz», sobre claro
    assets/logo/logo-claro.svg       lo mismo, sobre oscuro
    assets/favicon.svg               marca sobre el linóleo, cuadrado redondeado
    assets/logo/simbolo.txt          el <symbol id="logo"> que va en el sprite de index.html

Los PNG los saca scripts/exportar-logo.mjs a partir de estos SVG.
"""
import os
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FUENTES = os.path.join(RAIZ, 'scripts', 'fuentes')

TINTA = '#1F2320'
PAPEL = '#FBF8F1'
LINOLEO = '#4F6B5E'
MOSTAZA = '#E2A43A'          # sobre oscuro
MOSTAZA_OSC = '#B07A1C'      # sobre claro: la grapa se sigue viendo en papel blanco
GRIS = '#555A53'


def num(v):
    s = ('%.2f' % v).rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s


class Fuente:
    def __init__(self, archivo, variacion=None):
        ruta = os.path.join(FUENTES, archivo)
        self.tt = TTFont(ruta)
        self.upm = self.tt['head'].unitsPerEm
        self.variacion = variacion or {}
        self.glifos = self.tt.getGlyphSet(location=self.variacion) if self.variacion else self.tt.getGlyphSet()
        self.orden = self.tt.getGlyphOrder()
        blob = hb.Blob.from_file_path(ruta)
        self.hb = hb.Font(hb.Face(blob))
        if self.variacion:
            self.hb.set_variations(self.variacion)

    def trazar(self, texto, tam, x, y, espaciado=0.0, centrar=False):
        """Devuelve (d, ancho, caja) del texto con su línea base en y."""
        buf = hb.Buffer()
        buf.add_str(texto)
        buf.guess_segment_properties()
        hb.shape(self.hb, buf, {'kern': True, 'liga': False})
        esc = tam / self.upm
        avances = [p.x_advance * esc + espaciado for p in buf.glyph_positions]
        ancho = sum(avances) - (espaciado if avances else 0)
        if centrar:
            x -= ancho / 2
        trozos, cx = [], x
        caja = [1e9, 1e9, -1e9, -1e9]
        for info, pos, av in zip(buf.glyph_infos, buf.glyph_positions, avances):
            nombre = self.orden[info.codepoint]
            ox, oy = cx + pos.x_offset * esc, y - pos.y_offset * esc
            tr = (esc, 0, 0, -esc, ox, oy)
            pen = SVGPathPen(self.glifos, ntos=num)
            self.glifos[nombre].draw(TransformPen(pen, tr))
            d = pen.getCommands()
            if d:
                trozos.append(d)
                bp = BoundsPen(self.glifos)
                self.glifos[nombre].draw(TransformPen(bp, tr))
                if bp.bounds:
                    b = bp.bounds
                    caja = [min(caja[0], b[0]), min(caja[1], b[1]), max(caja[2], b[2]), max(caja[3], b[3])]
            cx += av
        return ' '.join(trozos), ancho, caja


serif = Fuente('InstrumentSerif-Regular.ttf')
figtree = Fuente('Figtree.ttf', {'wght': 700})

# ── la marca, en su caja de 64: «JM» a 46, espaciado −2, centrado; grapa de 12 a 52 ──
JM, _, CAJA_JM = serif.trazar('JM', 46, 32, 53, espaciado=-2, centrar=True)
GRAPA = 'M12 25v-9h40v9'
GROSOR_GRAPA = 3.6


def marca_svg(letras, grapa, fondo=None, caja=None, radio=0):
    """SVG suelto de la marca, ajustado a su contenido con un margen."""
    x0, y0, x1, y1 = caja or (min(CAJA_JM[0], 12) - 3, 16 - 4, max(CAJA_JM[2], 52) + 3, CAJA_JM[3] + 3)
    w, h = x1 - x0, y1 - y0
    capas = []
    if fondo:
        capas.append(f'<rect x="{num(x0)}" y="{num(y0)}" width="{num(w)}" height="{num(h)}" rx="{num(radio)}" fill="{fondo}"/>')
    capas.append(f'<path fill="{letras}" d="{JM}"/>')
    capas.append(f'<path d="{GRAPA}" fill="none" stroke="{grapa}" stroke-width="{GROSOR_GRAPA}" stroke-linejoin="round" stroke-linecap="square"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{num(x0)} {num(y0)} {num(w)} {num(h)}">'
            f'<title>Gestoría Jorge Miralles</title>' + ''.join(capas) + '</svg>\n')


def logo_svg(letras, grapa, rotulo):
    """Marca + nombre + rótulo, en horizontal (el lockup de la cabecera)."""
    # la marca ocupa 0–64 en vertical; el nombre se centra ópticamente con ella
    nombre, ancho_n, caja_n = serif.trazar('Jorge Miralles', 34, 78, 42)
    rot, ancho_r, caja_r = figtree.trazar('GESTORÍA · BADAJOZ', 9.4, 79, 58, espaciado=9.4 * 0.2)
    x0 = min(CAJA_JM[0], 12) - 3
    x1 = max(78 + ancho_n, 79 + ancho_r) + 3
    y0, y1 = 12, max(CAJA_JM[3], caja_n[3], caja_r[3]) + 3   # la cola de la J baja de la línea base
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{num(x0)} {y0} {num(x1 - x0)} {y1 - y0}">'
            f'<title>Gestoría Jorge Miralles · Badajoz</title>'
            f'<path fill="{letras}" d="{JM}"/>'
            f'<path d="{GRAPA}" fill="none" stroke="{grapa}" stroke-width="{GROSOR_GRAPA}" stroke-linejoin="round" stroke-linecap="square"/>'
            f'<path fill="{letras}" d="{nombre}"/>'
            f'<path fill="{rotulo}" d="{rot}"/>'
            '</svg>\n')


def escribir(rel, texto):
    ruta = os.path.join(RAIZ, rel)
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, 'w', encoding='utf-8', newline='\n') as f:
        f.write(texto)
    print('escrito', rel, len(texto), 'bytes')


escribir('assets/logo/marca.svg', marca_svg(TINTA, MOSTAZA_OSC))
escribir('assets/logo/marca-claro.svg', marca_svg(PAPEL, MOSTAZA))
escribir('assets/logo/logo.svg', logo_svg(TINTA, MOSTAZA_OSC, GRIS))
escribir('assets/logo/logo-claro.svg', logo_svg(PAPEL, MOSTAZA, MOSTAZA))

# favicon: cuadrado de linóleo con la marca centrada y lo más grande posible
cx = (min(CAJA_JM[0], 12) + max(CAJA_JM[2], 52)) / 2
cy = (16 + CAJA_JM[3]) / 2
lado = max(max(CAJA_JM[2], 52) - min(CAJA_JM[0], 12), CAJA_JM[3] - 16) + 12
escribir('assets/favicon.svg', marca_svg(PAPEL, MOSTAZA, fondo=LINOLEO,
                                         caja=(cx - lado / 2, cy - lado / 2, cx + lado / 2, cy + lado / 2),
                                         radio=lado * 0.22))

# el símbolo del sprite: letras en currentColor y la grapa en var(--logo-grapa). Dentro de un <use> no entra
# ningún selector de la página, pero las custom properties sí se heredan: se pone --logo-grapa en el <svg> que lo usa
simbolo = ('  <symbol id="logo" viewBox="0 0 64 64">\n'
           f'    <path fill="currentColor" d="{JM}"/>\n'
           f'    <path class="logo-grapa" d="{GRAPA}" fill="none" style="stroke:var(--logo-grapa, currentColor)" stroke-width="{GROSOR_GRAPA}" stroke-linejoin="round" stroke-linecap="square"/>\n'
           '  </symbol>\n')
escribir('assets/logo/simbolo.txt', simbolo)
print('caja JM', [round(v, 1) for v in CAJA_JM])
