# S'Narai · Lote 1 de Instagram (6 piezas)

**Estado:** captions listos, material visual existente. **Nada publicado.**
Pendiente: subir cada pieza a la biblioteca del tenant para obtener su URL https.

Reglas aplicadas a todas las piezas:

- Producto = **Título de Propiedad**; derecho de uso = **estancias anuales**.
- **Sin** precios, fases, rendimientos, cronogramas ni “hotel/noches/fideicomiso/CP”.
- Los cuatro niveles se nombran, **no** se detallan condiciones (van en llamada).
- CTA: palabra clave **SNARAI** por WhatsApp; el enlace `/l/<code>` lo añade el
  servidor al proponer, no se escribe a mano.

---

## 1 · Portada de marca — imagen simple 1080×1080

Asset: `posts/01-portada-marca/01-portada-1080.jpg`

```
S'Narai · Riviera Nayarit

Un residencial boutique en Bucerías, a pasos del mar, con un modelo de participación distinto: Título de Propiedad, estancias anuales y participación en la renta vacacional.

Escríbenos SNARAI por WhatsApp y te explicamos cómo funciona, con la documentación a la vista.

#Bucerias #RivieraNayarit #Nayarit #InversionInmobiliaria #BienesRaicesMexico
```

## 2 · Render del proyecto — imagen simple 1080×1080

Asset: `posts/02-render/02-render-1080.jpg`

```
Así se ve S'Narai desde la Riviera.

El proyecto se desarrolla en Bucerías: un complejo residencial boutique pensado para usarse, no sólo para mirarse.

Si quieres conocer el modelo —Título de Propiedad y estancias anuales— escríbenos SNARAI por WhatsApp.

#Bucerias #RivieraNayarit #Nayarit #InversionInmobiliaria
```

## 3 · Carrusel educativo — 4 slides 1080×1350

Assets: `posts/03-carrusel-titulo/03-1.jpg` … `03-4.jpg`

```
Qué es un Título de Propiedad.

1. No compras un departamento: adquieres un derecho.
2. Ese derecho se ejerce en estancias anuales, según tu nivel.
3. Participas en las utilidades de la operación de renta vacacional.

Cuatro niveles: Explorador, Residente, Embajador y Riviera Owner. Las condiciones de cada uno se revisan en una llamada con el equipo.

Escríbenos SNARAI por WhatsApp.

#Bucerias #RivieraNayarit #TituloDePropiedad #InversionInmobiliaria #Nayarit
```

## 4 · Los cuatro niveles — imagen simple 1080×1350

Asset: `posts/05-plantillas-v3/03-levels.png`

```
Cuatro niveles, una misma idea: usar el inmueble sin comprar el edificio completo.

Explorador · Residente · Embajador · Riviera Owner.

Cada nivel define sus estancias anuales y su participación en la operación. Las condiciones concretas se revisan en una llamada con el equipo, con la documentación a la vista.

Escríbenos SNARAI por WhatsApp.

#RivieraNayarit #Bucerias #TituloDePropiedad #InversionInmobiliaria
```

## 5 · Statement de marca — imagen simple 1080×1350

Asset: `posts/05-plantillas-v3/02-statement.png`

```
Un residencial boutique en Bucerías, a pasos del mar.

No vendemos departamentos: documentamos un Título de Propiedad con estancias anuales y participación en la renta vacacional. La operación del inmueble la lleva el equipo; al titular le corresponde su parte.

La documentación se revisa con el equipo, sin prisas.

SNARAI por WhatsApp.

#RivieraNayarit #Bucerias #Nayarit #InversionInmobiliaria
```

## 6 · CTA — imagen simple 1080×1350

Asset: `posts/05-plantillas-v3/04-cta.png`

```
Si quieres ver cómo funciona antes de decidir:

1. Escríbenos SNARAI por WhatsApp.
2. Te compartimos la documentación del proyecto.
3. Agendamos 30 minutos con el equipo.

Sin presión y con la información a la vista.

#Bucerias #RivieraNayarit #TituloDePropiedad #BienesRaicesMexico
```

---

## Orden de salida sugerido (día 1)

| # | Pieza | Formato | Objetivo |
|---|---|---|---|
| 1 | Portada de marca | simple | presentar la cuenta |
| 2 | Render | simple | mostrar el proyecto real |
| 3 | Carrusel educativo | carrusel 4 | sostener la objeción “¿qué compro?” |
| 4 | Niveles | simple | estructura sin precios |
| 5 | Statement | simple | posicionamiento |
| 6 | CTA | simple | conversión a WhatsApp |

## Cómo se propone (no publica)

```bash
./community-agent propose \
  --platform=instagram --channel=snaraibucerias \
  --file=/tmp/snarai-batch-01.json \
  --intent="Lote 1 · presentación de cuenta y educación (6 piezas)"
```

El gateway añade el enlace `/l/<code>` a cada pieza y crea la aprobación.
La publicación sólo ocurre cuando se aprueba.
