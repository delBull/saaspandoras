# Auditoría de salas y PDFs antes del deploy

Fecha: 23 nov 2026. Alcance: **las 18 salas** de la base operativa. Objetivo: que los
cambios de contrato (tokens, firma y PDF) no rompan ninguna sala existente.

## 1. Inventario

| Sala | Tipo | Estado | NDA | POF | Secciones | Tokens |
|---|---|---|---|---|---|---|
| PDR-GARZA-01 | PROPOSAL | SIGNED | sí | no | 9 | 0 |
| PDR-6K8CFV | CHARTER | CANCELLED | sí | no | 9 | 0 |
| PDR-6EBE27 | AGREEMENT | DRAFT | sí | no | 79 | 46 ({{COUNTERPARTY}}) |
| PDR-GARZA-02 | AGREEMENT | DRAFT | no | no | 20 | 0 |
| PDR-0ACA9A · PDR-1084C6 | PROPOSAL | DRAFT | no | no | 5 / 1 | 0 |
| PDR-63C2E9 | PROPOSAL | PROPOSAL_SENT | sí | no | 5 | 0 |
| PDR-A1B2B4 … PDR-D426E5 (8 salas) | PROPOSAL | DRAFT | no | no | 4 | 0 |
| PDR-VILLAGE | PROPOSAL | DRAFT | sí | **sí** | 4 | 0 |
| PDR-EDITORIAL | CONTRACT | DRAFT | no | no | 8 | 2 ({{COUNTERPARTY}}, {{REPRESENTATIVE}}) |

Sólo dos salas usan tokens; las demás son texto fijo.

## 2. Hallazgos y correcciones

| # | Hallazgo | Impacto | Corrección |
|---|---|---|---|
| 1 | El bloque de firma del PDF tenía **hardcodeado** "MARCO ARTURO MUÑOZ DEL TORO" como prestador | En Village el prestador es **AZTECAZ HUB** y en Garza la sala no tiene empresa: el PDF firmado habría atribuido el contrato a la persona equivocada | El prestador ahora sale de `room.company` con respaldo "Pandora's" |
| 2 | El PDF **reemplazaba la mención literal** de la contraparte por la empresa del firmante | En salas donde la contraparte es una persona o el activo, el documento se reescribía solo (p. ej. "Óscar Trueba" → empresa del firmante) | Sustitución **sólo por tokens** `{{COUNTERPARTY}}` / `{{REPRESENTATIVE}}` |
| 3 | La UI hacía lo mismo (reemplazo literal e incluso de la primera palabra) | Corrupción visible al firmar en salas B2B con contraparte persona | Se retiró; sólo tokens |
| 4 | Si el firmante dejaba vacía su empresa, `{{COUNTERPARTY}}` caía en `room.company` (¡el prestador!) | Una sala podía mostrar a "Pandoras International" como si fuera el cliente | El respaldo ahora es `room.counterparty` |
| 5 | El selector de tipo de sociedad venía en `LLC` y era obligatorio | Un cliente mexicano firmaba como "… LLC" | Opción **"sin sufijo"** por defecto; el tipo dejó de ser obligatorio |

## 3. Verificación con las salas reales

PDF generado para cada caso (sin desplegar):

```
PDR-VILLAGE     tokens 0 · sin bloque de firma · prestador AZTECAZ HUB S.A.P.I. de C.V. ✓
PDR-GARZA-01    tokens 0 · bloque de firma sí · prestador "Pandora's" (sala sin empresa)
                nombre del firmante "Eduardo Garza" presente ✓
PDR-EDITORIAL   tokens 0 (resueltos) · prestador Marco Arturo Muñoz Del Toro ✓
PDR-6EBE27      tokens 0 (resueltos) · prestador Pandoras International ✓
```

## 4. Pendiente de verificación en producción

- Descarga real de los PDFs por HTTP (requiere deploy de la ruta nueva).
- Firma del contrato editorial por el cliente: hasta que firme, el PDF sale con
  "por el cliente al firmar" y sin bloque de firma.

## 5. Nota de comportamiento

A partir de este cambio, los nombres dinámicos **sólo** se resuelven con tokens. Si una
plantilla futura necesita el nombre del cliente, debe escribir `{{COUNTERPARTY}}`; ya no
se reescribe el texto por coincidencia literal.
