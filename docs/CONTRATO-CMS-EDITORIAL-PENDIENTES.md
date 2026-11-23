# Contrato CMS editorial — datos pendientes y criterios

Documento de trabajo (no forma parte del contrato). Fuente: `docs/CONTRATO-CMS-EDITORIAL.md`,
que es el mismo texto que vive en el Deal Room `PDR-EDITORIAL`.

## 1. Datos que faltan para firmar

| # | Dato | Dónde aparece |
|---|---|---|
| 1 | Razón social completa del cliente | Encabezado, declaraciones, firma |
| 2 | RFC del cliente | No obligatorio en el contrato, pero sí para el CFDI |
| 3 | Domicilio fiscal del cliente | Declaraciones y notificaciones |
| 4 | Nombre del representante legal y datos del poder | Encabezado y firma |
| 5 | Correo y domicilio de notificaciones (ambas partes) | Cláusula 23 |
| 6 | Ciudad y estado para jurisdicción | Cláusula 24 |
| 7 | RFC, domicilio y correo del prestador | Declaraciones y notificaciones |

## 2. Decisión de pago

El contrato quedó con **ejecución secuencial**:

- Fase 0: al firmar.
- Fase 1: al autorizar su inicio, una vez aceptada la Fase 0.

Si el cliente quiere pagar la Fase 1 en dos exhibiciones, sustituir la cláusula **SÉPTIMA**
por esta:

> **SÉPTIMA. FORMA DE PAGO.** La Fase 0 será pagadera al momento de la firma del contrato y antes del inicio de los trabajos. La Fase 1 se pagará en dos exhibiciones: cincuenta por ciento (50%) al autorizarse su inicio y cincuenta por ciento (50%) contra la aceptación de sus entregables. Cada fase tendrá su propia facturación.

No usar la separación por fases para presentar como "no cobrado" un importe que sí se recibió:
el tratamiento del ingreso y del IVA depende del cobro efectivo y del CFDI, no de cómo se
nombre la cláusula.

## 3. Notas que conviene revisar con contador/abogado

- **IVA:** la separación en dos servicios independientes es contractual. La no retención de
  IVA depende de que la actividad empresarial sea real y defendible (criterio 3/IVA/N), no de
  una cláusula.
- **ISR:** la retención del 10% del artículo 106 aplica a servicios profesionales a personas
  morales; no se elimina por redacción. El contrato ya incluye una cláusula que reconoce que
  cualquier retención legal procedente se aplicará y documentará.
- **Propiedad intelectual:** el contrato distingue activos del cliente, componentes
  preexistentes del prestador y desarrollos específicos. Se añadió una **licencia de uso
  perpetua y no exclusiva** para que el cliente pueda operar la plataforma sin que eso
  implique ceder el CMS reutilizable.
- **Datos personales:** se incluyó la referencia a la LFPDPPP y la prohibición de usar los
  datos del cliente para fines distintos.

## 4. ¿Hace falta un NDA aparte?

**No para este trato.** El contrato ya contiene confidencialidad, protección de datos y
límites de uso de accesos; un NDA previo agregaría fricción sin aportar protección nueva.

Sí tendría sentido un NDA corto **sólo** si antes de firmar el contrato se comparten:

- accesos productivos (hosting, DNS, panel de WordPress),
- credenciales de terceros,
- bases de datos de lectores o información comercial sensible.

En ese escenario, el orden correcto es: NDA → accesos → Fase 0. Si los accesos se entregan
después de firmar, el contrato basta.

## 5. Firma

El Deal Room permite firmar con wallet (EIP-191) y deja evidencia. Para un contrato de esta
naturaleza conviene además:

1. Generar el PDF desde la sala y firmarlo también de forma autógrafa o con e.firma.
2. Guardar el PDF firmado como anexo de la sala.
3. Registrar en la sala la fecha de inicio de cada fase y la aceptación de entregables.

## 6. Cómo se armó en el sistema

- Pod: `editorial` (confidencial), independiente de Village.
- Sala: `PDR-EDITORIAL`, tipo `CONTRACT`, sin NDA y sin POF (no aplican a un servicio).
- Secciones: 01–08, tomadas del mismo documento para que no existan dos versiones.
- `created_by`: la cuenta SUPER_ADMIN.
