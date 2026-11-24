# PATRIA · Deal Pod clonado de VILLAGE (24 nov 2026)

Clon estructural de la oportunidad `PDR-VILLAGE`, adaptado al activo real de **PATRIA + ACUEDUCTO**
(terreno para desarrollo de usos mixtos). No se mezcló ni un nombre ni un dato de Village.

## Lo que se creó

| Pieza | Valor |
|---|---|
| Deal Pod | `patria` · "Proyecto Patria" · `OFF_MARKET` · org `pandoras` |
| Sala | `PDR-PATRIA` · `PROPOSAL` · `DRAFT` |
| Título | Proyecto Patria — Oportunidad de adquisición |
| Contraparte | *Proyecto Patria (terreno para desarrollo mixto)* — genérica, como Village |
| Emisor (`company`) | AZTECAZ HUB S.A.P.I. de C.V. |
| NDA | `v1.0-patria` · 1 firmante · no bilateral · fase `before_proposal` |
| POF | activado (igual que Village) |
| OM | `apps/dashboard/private/deals/patria/om.pdf` (el PDF que entregaste) |
| Secciones | 4: La oportunidad · Tesis de inversión · Proceso · Criterios de elegibilidad |

## Qué se dejó fuera (instrucción del Fundador)

- **Estructura de venta / precio / tiers:** no aparece en la sala ni en el NDA. Se explica cuando haya
  prospecto.
- **Ubicación explícita:** no se nombra en la sala ni en la contraparte ("terreno para desarrollo
  mixto"). Vive en el OM.
- **Contraparte real:** no se conoce todavía (trato tipo deal pod). Se mantiene el genérico.

## Diferencia deliberada con Village: jurisdicción

El NDA de Village somete las controversias a los tribunales de **Nayarit**. El inmueble de Patria está
en **Jalisco**, así que el clon cambia la sumisión a **Jalisco**. Copiar el template sin ese ajuste
habría dejado una cláusula incorrecta.

También se adaptó la cláusula de información confidencial: en lugar de operación hotelera (estados
financieros, franquicia, plantilla), lista materia de suelo (títulos y cadena de dominio, avalúos,
COS/CUS y factibilidades, proyectos y presupuestos, situación fiscal).

## Cómo se entrega el OM (verificado en código)

1. El prospecto firma el NDA en la sala.
2. Se registra POF (`pof_enabled = true`); sin POF el OM no se libera.
3. `POST /api/nexus/deals/[id]/om` envía por correo una **URL firmada de 7 días** —
   `GET /api/public/deals/PDR-PATRIA/om?t=…`.
4. El archivo se sirve desde `private/deals/patria/om.pdf`, nunca desde `public/`.

El OM **no** se adjunta: se entrega por enlace. Es un documento distinto del PDF de la sala (ese se
genera desde las secciones) y del PDF del NDA.

## Pendiente / a decidir

- **Landing pública** (`/pitch/patria`): no se creó. Village tiene una y es material de marketing
  público; requiere el copy aprobado por el Fundador.
- **Precio dentro del OM:** el PDF entregado incluye precio por m² y total. No se editó — si no debe
  verse en esa etapa, hay que modificar el PDF antes de publicar la sala.
- **Estado:** la sala está en `DRAFT` y no compartida. Se abre cuando exista prospecto.
