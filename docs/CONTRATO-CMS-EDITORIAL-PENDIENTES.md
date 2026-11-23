# Contrato CMS editorial — datos pendientes y criterios

Documento de trabajo (no forma parte del contrato). Fuente: `docs/CONTRATO-CMS-EDITORIAL.md`,
que es el mismo texto que vive en el Deal Room `PDR-EDITORIAL`.

## 1. Datos ya integrados

| Dato | Valor |
|---|---|
| Prestador | Marco Arturo Muñoz Del Toro · RFC **MUTM8610091NA** |
| Domicilio del prestador | Lázaro Cárdenas 74, Col. Dorada, Bucerías, Bahía de Banderas, Nayarit, C.P. 63732 |
| Correo del prestador | marco.munoz9@gmail.com |
| Cliente | Keeper Consulting and Management · RFC **KCM241213N63** |
| Domicilio del cliente | Valle de Aqua No. 6-10, Fracc. Valle Esmeralda, Bahía de Banderas, Nayarit, C.P. 63737 |
| Régimen del cliente | Simplificado de Confianza (RESICO) · uso de CFDI: Gastos en general |
| Correo de contacto | luispguardado@gmail.com |
| Correo de facturación | facturaskeepercm@gmail.com |
| Jurisdicción | Bahía de Banderas, Nayarit |
| Total | $77,000 + IVA = **$89,320** |

## 1.1 Datos que faltan (sólo dos)

| # | Dato | Dónde aparece |
|---|---|---|
| 1 | Denominación social completa con régimen de capital (S.A. de C.V. / S. de R.L. de C.V.) | Encabezado, declaraciones, firma |
| 2 | Nombre del representante legal y referencia al poder | Encabezado y firma |

## 2. Decisión de pago

El contrato quedó con **ejecución secuencial**, que es lo que pediste:

- Fase 0: al firmar ($15,000 + IVA).
- Fase 1: al autorizar su inicio, una vez aceptada la Fase 0 ($62,000 + IVA).

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

## 6. Cotejo con la propuesta publicada

Ver `docs/PLATAFORMA-EDITORIAL-ANALISIS.md` §2. Resumen:

- La propuesta publica la Fase 1 en **$52,000–$62,000**; el contrato toma **$62,000**.
- La propuesta promete **acreditar la Fase 0** al total del Camino A; el contrato no
  recoge ese crédito (sólo dice que no se descuenta de la Fase 1).
- La propuesta menciona "infraestructura operada por Pandora's"; el contrato lo firma
  Marco como persona física. Conviene alinear el lenguaje.

## 7. Cómo se armó en el sistema

- Pod: `editorial` (confidencial), independiente de Village.
- Sala: `PDR-EDITORIAL`, tipo `CONTRACT`, sin NDA y sin POF (no aplican a un servicio).
- Secciones: 01–08, tomadas del mismo documento para que no existan dos versiones.
- `created_by`: la cuenta SUPER_ADMIN.
