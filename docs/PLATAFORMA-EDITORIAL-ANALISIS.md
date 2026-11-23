# Plataforma editorial multi-marca — análisis, números y reutilización

Fecha: 23 nov 2026 · Documento de trabajo para decidir alcance y arquitectura del proyecto
externo. Fuente comercial: <https://propuesta-medios.vercel.app> (leída hoy). Fuente
contractual: `docs/CONTRATO-CMS-EDITORIAL.md` (sala `PDR-EDITORIAL`).

---

## 1. Resumen ejecutivo

1. **Los números del contrato son coherentes entre sí**: $15,000 + $62,000 = $77,000; IVA
   16% = $12,320; total $89,320.
2. **El contrato toma el techo del rango de la propuesta** en la Fase 1 ($62,000 vs
   $52,000–$62,000) y **elimina el crédito de la Fase 0**, que la propuesta sí promete.
   Hay que decidir si eso se comunica o se corrige en la propuesta.
3. **La propuesta y el contrato no hablan del mismo obligado**: la propuesta dice
   "infraestructura operada por Pandora's"; el contrato lo firma Marco Muñoz como persona
   física. Es válido, pero hay que alinear el discurso para que el cliente no espere
   obligaciones de otra entidad.
4. **Hay módulos ya construidos y probados** que este proyecto puede reutilizar sin
   reescribir: Deal Room con firma y auditoría, generador de PDF, pods y atribución,
   solicitudes de acceso, POF, portal whitelabel, display engine (accesibilidad),
   prospección y utilidades web de Hermes.
5. **Riesgo principal del alcance**: la Fase 1 promete dos sitios piloto en 2–3 semanas.
   Es factible sólo si los accesos y el inventario llegan completos en la Fase 0.

---

## 2. Cotejo propuesta ↔ contrato

| Punto | Propuesta publicada | Contrato | Diferencia / decisión |
|---|---|---|---|
| Fase 0 | $15,000 · **acreditable** al total del Camino A (10 días hábiles) | $15,000 · **no acreditable** a la Fase 1 | El contrato elimina el crédito hacia la Fase 1. El crédito al Camino A (fases 2-3) no está recogido. **Decidir** |
| Fase 1 | $52,000 – $62,000 | $62,000 fijo | Se toma el techo. Justificable si el piloto incluye todo lo listado |
| Total fases 0+1 | $67,000 – $77,000 (sin IVA) | **$77,000** | Coherente con el techo |
| Diagnóstico | $5,000 **ya pagados y acreditados** | Fuera de estos $77,000; no se recobra | Coherente, pero el crédito al Camino A queda pendiente |
| Camino A (4 sitios) | $120,000 – $140,000 de referencia · lista $230,000–$270,000 (ajuste socio 50%) | No contratado | Fuera de alcance; el contrato lo dice expresamente |
| Fase 2 | $33,000 – $40,000 (DLB + Rey Juan Carlos) | No incluida | Fuera de alcance |
| Fase 3 | $15,000 – $18,000 (QA y handover) | No incluida | Fuera de alcance |
| Mantenimiento | $9,000 – $11,000 / mes | No incluido ("servicios no contratados") | El cliente podría esperarlo: confirmarlo por escrito |
| Infraestructura | $1,500 – $2,500 / mes, "operada por Pandora's" | No incluida; la paga el cliente o se cotiza | **Alinear el obligado** (Marco vs Pandora's) |
| Plazos | Fase 0: 3–5 días · Fase 1: 2–3 semanas · total 6–8 semanas | 3–5 días · 2–3 semanas | Coherente |
| Modelo comercial | "Infraestructura operada por Pandora's, cliente dueño de dominios y activos" | Prestador: Marco Muñoz (persona física) | El contrato manda: si Pandora's opera, hace falta contrato/acuerdo aparte |

### Nota sobre los dos totales de la propuesta

La propuesta usa dos bases distintas y por eso parecen discrepar:

- **Inversión nueva del Camino A:** $115,000 – $135,000.
- **Total de referencia:** $120,000 – $140,000 (= suma los $5,000 del diagnóstico que el
  cliente ya pagó).
- **Precio "lista":** $230,000 – $270,000 (el doble, con "ajuste de socio 50%").

No es un error aritmético, pero conviene explicarlo en la propuesta con una nota de una
línea para que el cliente no lo lea como dos precios distintos.

---

## 3. Verificación aritmética

```
Fase 0                       15,000.00
Fase 1                       62,000.00
Subtotal                     77,000.00
IVA 16%                      12,320.00
Total                       89,320.00
```

Cotejo con la propuesta:

```
Fase 1 publicada           52,000 – 62,000
+ Fase 0                  15,000
= total sin crédito       67,000 – 77,000   ← el contrato toma 77,000
Camino A (fases 0–3)     120,000 – 140,000
− fases 0+1 (techo)       77,000
= fases 2+3               43,000 – 63,000
  (publicado: 33–40k + 15–18k = 48–58k)   ← dentro del rango, con holgura
```

**Conclusión:** los importes cuadran. La única diferencia material es el **crédito de
$15,000** y el **techo de la Fase 1**, no la aritmética.

---

## 4. Módulos de Pandora's reutilizables

Estado real, no aspiracional. "Cableado" = hay ruta/UI en producción que lo usa.

| # | Módulo | Qué aporta al proyecto editorial | Estado | Esfuerzo de adaptación |
|---|---|---|---|---|
| 1 | **Deal Room** (`/deal/[id]`) | Contratos y acuerdos con secciones, firma, auditoría y enlace personal | ✅ cableado | Bajo: cambiar contenido y marca |
| 2 | **Generador de PDF** (servidor) | Contrato/NDA en carta con márgenes reales, sin diálogo de impresión | ✅ cableado | Nulo: genérico por sala |
| 3 | **Deal Pods** | Agrupar cada cliente/oportunidad con su sala, estado y confidencialidad | ✅ cableado | Bajo |
| 4 | **Radar `/l/<code>`** | Atribución por canal + métricas de apertura | ✅ cableado | Nulo |
| 5 | **Solicitudes de acceso** | Cola por pod, avisos a operación, acuse y autorización manual | ✅ cableado | Bajo |
| 6 | **POF por deal** | Declaración + carta en Postgres, verificación y gate de entrega | ✅ cableado | Bajo (opcional en este cliente) |
| 7 | **NDA engine** | Texto versionado por tipo de acuerdo, aceptación global por correo+versión | ✅ cableado | Nulo si no se usa |
| 8 | **Portal whitelabel** (`/portal/[org]`) | Marca del cliente: logo, colores, links legales, capacidades | ✅ cableado | Medio: brandConfig por tenant |
| 9 | **Display engine** | Zoom 115/130%, temas, alto contraste, movimiento reducido | ✅ cableado | Nulo (paquete) |
| 10 | **CRM (`clients`)** | Ficha del cliente, estado, vínculo con la sala | ✅ cableado | Bajo |
| 11 | **Prospección** | Fuentes, reglas, text-to-scrap, bandeja (captación de anunciantes) | ✅ cableado | Bajo |
| 12 | **Utilidades web de Hermes** | `SafeHttpClient` anti-SSRF, extracción HTML, crawl, búsqueda | ✅ cableado | Nulo (paquete) |
| 13 | **Registro de activos IP** | Inventario de marcas/dominios del cliente | 🟡 adaptable | Medio: modelo de activos |
| 14 | **Emails transaccionales** | Resend con plantillas de marca | ✅ cableado | Bajo |
| 15 | **Feature flags / telemetría** | Encendidos controlados y eventos | ✅ cableado | Bajo |

### Lo que conviene **no** reutilizar

- **Payment Core / settlement**: no interviene en este contrato (pago por transferencia).
- **Kernel de entrenamiento (Forge)**: nada que ver con un CMS editorial.
- **Governance/approvals**: útil si hay comités, innecesario aquí.
- **Marketplace de paquetes**: sin relación.

### Candidatos de mayor valor para "producto externo"

1. **Deal Room + PDF + firma** → se puede vender como "sala de contratos" a cualquier
   despacho o boutique.
2. **Portal whitelabel + display engine** → accesibilidad y marca para portales de medios.
3. **Prospección + radar** → captación de anunciantes con atribución medible.

---

## 5. Arquitectura recomendada para el proyecto externo

**No mezclar instancias.** El proyecto editorial debe vivir en su propio despliegue:

| Capa | Recomendación | Motivo |
|---|---|---|
| Repositorio | Monorepo propio, con `packages/` copiados desde Pandora's y versionados aparte | El cliente no debe depender del repo de Pandora's |
| Base de datos | Neon separado | Aislamiento de datos y de credenciales |
| Storage | Cloudflare R2 con buckets por marca | Aislamiento por publicación |
| CMS | Payload en Railway | Permisos por marca y auditoría |
| Frontends | 4 proyectos Next.js en Vercel | Despliegue y reversión independientes |
| Auth | Propia del proyecto (no la Nexus) | El cliente no debe entrar al ecosistema Pandora's |
| Observabilidad | Sentry + analytics propios | Datos del cliente en su cuenta |

**Propiedad intelectual:** si se copian paquetes de Pandora's al proyecto externo, hace
falta una licencia escrita (Pandora's → Marco o → cliente), aunque el contrato con el
cliente ya contemple una licencia de uso de la plataforma entregada. Sin eso, el mismo
código queda con dos titulares difusos.

---

## 6. Riesgos y decisiones abiertas

| # | Riesgo | Mitigación |
|---|---|---|
| 1 | La propuesta promete crédito de Fase 0 y el contrato no | Corregir la propuesta o añadir cláusula de crédito a fases 2-3 |
| 2 | La propuesta dice "Pandora's" y el contrato es de Marco (persona física) | Ajustar el lenguaje: "operado por el prestador" o contrato con la entidad |
| 3 | 2–3 semanas para dos sitios depende de accesos e inventario | Condición suspensiva ya prevista; registrar la fecha de entrega de accesos |
| 4 | Mantenimiento e infraestructura no están contratados | Enviar cotización separada antes de la entrega de la Fase 1 |
| 5 | Fase 1 al techo del rango ($62,000) | Justificar por alcance (2 sitios, migración, SEO, aislamiento) o ajustar a $52,000 |
| 6 | Migración de contenido: volumen desconocido | Medir en Fase 0; si excede, orden de cambio |
| 7 | Funcionalidades de DLB (TV, encuestas, cartones) | Fase 2 con alcance propio; no incluirlas en el piloto |

---

## 7. Próximos pasos sugeridos

1. Decidir crédito de Fase 0 y techo de Fase 1; alinear propuesta y contrato.
2. Completar los dos datos que faltan del cliente: denominación social completa y nombre
   del representante legal.
3. Enviar el contrato desde la sala (`PDR-EDITORIAL`) al correo del cliente.
4. En la Fase 0, medir contenido y funcionalidades para cerrar el alcance de la Fase 1.
5. Preparar la cotización de mantenimiento e infraestructura para después del piloto.
