# PATRIA · Deal Pod clonado de VILLAGE (24 nov 2026)

Clon estructural de la oportunidad `PDR-VILLAGE`, adaptado al activo real de **PATRIA + ACUEDUCTO**
(terreno para desarrollo de usos mixtos). No se mezcló ni un nombre ni un dato de Village.

## Lo que se creó

| Pieza | Valor |
|---|---|
| Deal Pod | `patria` · "Proyecto Patria" · `OFF_MARKET` · org `pandoras` |
| Sala | `PDR-PATRIA` · `PROPOSAL` · **`PROPOSAL_SENT`** (publicada) |
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

## Landing pública

`apps/dashboard/src/app/pitch/patria/page.tsx` — clon de la de Village con el mismo layout, reglas y
atribución (`?src=`, `utm_*` viajan a la sala):

- ES/EN, `noindex`, sin nombre del predio, sin ubicación exacta, sin precio.
- CTA a `/deal/PDR-PATRIA`; contacto `aztecaz@pandoras.finance`.
- Los enlaces de radar `/l/<code>` redirigen a `/pitch/<pod.code>`, así que un link del pod `patria`
  cae solo en esta landing.

## Estado publicado

Ambas salas quedaron en **`PROPOSAL_SENT`** (el único estado "publicada" del modelo):

| Sala | Estado |
|---|---|
| `PDR-PATRIA` | PROPOSAL_SENT · NDA `v1.0-patria` · POF activo |
| `PDR-VILLAGE` | PROPOSAL_SENT · NDA `v1.0-village` · POF activo |

## Nota de integridad: firmas del registro

Al republicar los 4 artefactos de S'Narai con el pipeline nuevo, el script pasó a **firmar el pin**
(EIP-712) con la identidad Hermes `0x8515Fb0F…` — la misma que ya usaba el registro del tenant. Las
firmas anteriores correspondían a los artefactos `MISSING` y habrían quedado desalineadas del CID
nuevo. Ahora firmante, firma y CID son consistentes en las 4 filas.

## Pendiente

- **Precio dentro del OM:** el PDF entregado incluye precio por m² y total. Se deja como está (decisión
  del Fundador).
- Abrir la sala a un prospecto concreto cuando exista.
