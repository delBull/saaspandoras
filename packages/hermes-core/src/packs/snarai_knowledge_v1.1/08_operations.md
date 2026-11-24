---
organizationId: snarai
visibility: INTERNAL
authority: VERIFIED
status: ACTIVE
version: 2
sourceId: snarai-operations
---

# S'Narai — Operación, Administración y Liquidez

## Administración del inmueble

- La operación corre a cargo de **profesionales en renta vacacional y property management**.
- Servicios incluidos en la operación: **concierge 24/7**, limpieza, mantenimiento preventivo y
  correctivo y gestión de reservaciones.
- Existe un **Fondo de Reserva** destinado a mejoras mayores, para que el inmueble no pierda valor
  con el tiempo.
- La estructura de costos y retenciones (mantenimiento, corretaje, administración) se transparenta en
  el documento *Property Management & Rental Operating Model*; no se publica como cifra suelta y no
  debe inventarse.

## Generación y distribución de utilidades

- Los ingresos provienen de la **renta vacacional** del edificio.
- Se descuentan costos operativos y se distribuye la **utilidad neta pro-rata** entre los titulares de
  certificados.
- La dispersión se realiza en **USDC** con una ventana de liquidación de **7 días**.
- Las propuestas de gobernanza se votan con quórum del **10%** de los certificados en circulación,
  periodo de votación de **24 horas** y **timelock de 24 horas** antes de ejecutar.

## Incorporación y pago

- Pago por **transferencia SPEI** en pesos mexicanos (SPEI Fast Lane).
- Al confirmar, el cupo se bloquea con un **soft-lock de 7 días** y se emite el contrato digital de
  participación.
- El registro en la lista de acceso **no garantiza** la asignación: da prioridad en el proceso.

## Liquidez y cesión

- El derecho de participación es **legalmente vinculante y heredable**.
- La liquidez se obtiene por dos vías: **mercado secundario interno (AGORA)** o **recompra de
  tesorería**, esta última sujeta a disponibilidad.
- No es una inversión líquida: el tiempo de salida depende de la demanda del mercado y de las
  condiciones de tesorería.

## Límites de esta ficha

- No contiene cifras de ocupación, ADR, RevPAR ni costos unitarios: no están publicadas.
- Cualquier dato operativo específico debe venir del *Project Status Report* o del equipo; si no está
  a la mano, se dice que no se tiene.

## Fuente

`snarai-materials-v2.ts` (Property Management & Rental Operating Model, Institutional Investment
Process), `src/knowledge/snarai.ts` (FAQs y objeciones), `messages/es.json`
(DaoRules.rewardsText, Portal.liq*, Terms) y `snarai-governance` (parámetros de distribución y DAO)
del proyecto S'Narai.
