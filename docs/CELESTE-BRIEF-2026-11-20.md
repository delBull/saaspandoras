# Celeste × Pandora's — Brief para la reunión con Eduardo

> **Fecha:** viernes 20 de noviembre de 2026 · **11:00–11:45 CDMX** (17:00–17:45 UTC).
> **Objetivo:** refrescar precios finales, posicionamiento, capacidades y reglas de
> conducción antes de la presentación.
>
> **La reunión ya está programada.** No hay que crearla ni editar horario:
>
> | Campo | Valor |
> |---|---|
> | Meeting ID | `1aaf16f1-cf44-4208-9605-1ded7f9a0010` |
> | Título | Celeste Beach Residences & Spa |
> | Deck | `celeste` (11 slides) |
> | Deal Room | `PDR-63C2E9` (`c48df355-61bb-4f87-888a-a0c9f2de17e9`) |
> | Invitado | `eduardo.garza.castillon@gmail.com` · `anonymous_guest` · `pending` |
> | Liga personal | `https://nexus.pandoras.finance/meet/1aaf16f1-cf44-4208-9605-1ded7f9a0010?p=edf4ba0cf8b8ab3d9000760a95d7aadc` |
>
> **Deal:** PROPOSAL · `DRAFT` · NDA `after_proposal` · **0 firmantes**.

---

## 0. Dónde vive el guión (y por qué se actualiza solo)

| Capa | Fuente | Rol |
|---|---|---|
| **Guión canónico** | `nexus_presentations` (slug `celeste`) | **Fuente de verdad** de la sala: la lee `GET /api/v1/meet/presentation` |
| Guión versionado | `apps/dashboard/src/lib/nexus/presentations-catalog.ts` | Respaldo explícito + página `/nexus/presentations/celeste` |
| Contenido visual | `apps/dashboard/src/lib/nexus/decks/celeste.deck.json` (sembrado a la DB) | Slides, bloques y notas |

**Estado verificado en la DB de producción (20 nov 2026):**

```
slug='celeste' · target_minutes=38 · slides=11 · suma de minutos=38 · guardrails=11 · notas=39
```

Consecuencia: al abrir la sala con el deck `celeste`, el panel **Guión** y las
**Reglas** salen de la DB. **No requiere deploy** para reflejar este brief.

---

## 1. Datos duros (los que no se negocian)

| Dato | Valor |
|---|---|
| Fracciones disponibles | **104** |
| Precio 2 recámaras | **USD 138,000** (aprox.) |
| Precio 3 recámaras | **USD 181,000** (aprox.) |
| Ticket promedio | **USD 155,000** |
| Inventario nominal | **~USD 16.12M** (104 × 155k) — **no es venta ni ingreso** |
| Mercados | CDMX, Oaxaca y compradores extranjeros |
| Motivación | Uso vacacional (segunda residencia y renta) |
| Equipo actual | 1 asesora en Huatulco + 2 vendedores en CDMX |
| Estancia Discovery | **USD 250/noche**, descontable del anticipo (condiciones a confirmar) |
| Tercero | Posadas/Curamoria comercializa inventario no vendido con **8%** (a confirmar de qué se calcula) |

**Frase clave:** el cuello de botella no es el producto ni el precio; es **generar
suficientes interesados calificados** y acompañarlos hasta la visita.

---

## 2. Diagnóstico (presentarlo como hipótesis, no como verdad)

1. **Dependencia de terceros:** parte del inventario se comercializa por
   Posadas/Curamoria (8%). Llega demanda, pero no es propia ni medible.
2. **Sin un proceso único:** cada asesor opera a su manera; no hay embudo común ni
   criterios de calificación acordados.
3. **Sin medición:** no se sabe qué canal trae prospectos que visitan y compran.

Compromiso: el diagnóstico se valida con datos en la **semana 1**, no se da por cierto.

---

## 3. Posicionamiento (el cambio de conversación)

**Pandora's no viene a administrar redes sociales.** Viene a **diseñar, implementar y
operar la infraestructura comercial** de Celeste: el sistema que conecta adquisición,
atención, seguimiento, visitas y medición.

No se vende una landing, ni cuatro publicaciones, ni una campaña, ni un CRM por
separado. Se vende el sistema completo.

| Componente | Qué incluye | Límite explícito |
|---|---|---|
| **Captación** | Estrategia de audiencias, campañas y landing orientada a compradores de fracción | La pauta la paga Celeste directo a plataformas |
| **Atención y precalificación** | Respuesta, recopilación de datos y agenda de la Estancia Discovery | Al inicio es **humana asistida**; el asistente WhatsApp requiere gate técnico y aprobación de Meta |
| **Conversión a visita** | Coordinación con el equipo de Celeste para confirmar disponibilidad y condiciones | Celeste conserva la relación y el cierre |
| **Seguimiento y medición** | Origen, etapa, responsable, visita y resultado en un solo lugar | Reporte semanal; sin integración con sistemas de Celeste en esta fase |

**Propiedad y continuidad:** la implementación (dominio, landing, catálogo, CRM, datos,
cuentas, campañas y documentación) queda **bajo control de Celeste**. Pandora's
conserva su metodología, herramientas y **propiedad intelectual preexistente**.

### Lo que NO prometemos

- Prospectos, visitas o ventas garantizadas.
- Atención 24/7.
- Automatización de anuncios.
- Integración con sistemas de Celeste.
- Tokenización o estructura legal/financiera de fracciones.

---

## 4. Plan de 90 días (dos fases)

| Etapa | Cuándo | Entregable |
|---|---|---|
| **Fase 1 · Diagnóstico y arquitectura** | Semana 1 | Estrategia, oferta, audiencias, CRM y pipeline |
| **Fase 1 · Implementación** | Semanas 2–3 | Landing y catálogo, guiones, CRM y tracking, campañas en borrador |
| **Fase 1 · Lanzamiento** | Semana 4 | Campañas y atención operando (**depende de accesos, materiales y aprobaciones**) |
| **Fase 2 · Operación** | Semanas 5–11 | Optimización semanal, contenido y reporte |
| **Cierre** | Semana 12 | Reporte final, entrega de activos y decisión de continuidad |

**Mensaje:** la semana 4 se mueve si no hay accesos/materiales. Decirlo ahora evita
fricción después.

---

## 5. Entregables

1. Diagnóstico comercial y definición de oferta.
2. Landing page y catálogo digital comercial.
3. CRM y pipeline con etapas, responsables y campos de seguimiento.
4. Asistente de atención y precalificación *(sujeto a gate técnico)*.
5. Campañas: diseño, lanzamiento y optimización.
6. Contenido: **4 piezas/mes incluidas**; **8 solo mediante ampliación cotizada**
   (con material y aprobaciones a tiempo).
7. Seguimiento de prospectos y coordinación de visitas Discovery.
8. Reporte semanal y reunión de revisión.

---

## 6. Inversión final (la única cifra que se dice)

| Concepto | Importe |
|---|---|
| **Implementación** (una vez) | **USD 4,500** |
| **Operación** mensual | **USD 2,500 / mes** |
| **Total primer ciclo (90 días)** | **USD 12,000** (4,500 + 7,500) |
| Publicidad | **USD 1,500–3,000 / mes**, aparte, pagada por Celeste directo a plataformas |

**Dos fases, un solo sistema:** la implementación construye el activo; la operación lo
mantiene y lo optimiza. No es una tarifa de agencia.

**Forma de pago propuesta:** 50% de la implementación al inicio y 50% al lanzamiento
de campañas (semana 4); mensualidad por adelantado.

**No incluye:** publicidad, impuestos, viajes, producción audiovisual especializada,
servicios externos extraordinarios, tokenización/estructura legal de fracciones,
migración de sistemas de Celeste ni incentivo por ventas.

**Incentivo por ventas (opcional, adicional, no sustituto):**
- **0.75%–1% del importe efectivamente cobrado** por Celeste en ventas atribuibles.
- Ejemplo: **1% de USD 155,000 = USD 1,550** por venta.
- 1 venta = $1,550 · 2 = $3,100 · 3 = $4,650 · 5 = $7,750.
- Reglas: primer contacto documentado, ventana de 90 días, excluir prospectos
  preexistentes, solo importes cobrados; pagos parciales/cancelaciones según contrato;
  revisión legal de la figura. **No es comisión inmobiliaria por intermediación.**

**Validez:** 30 días naturales desde la publicación on-chain de la propuesta. El deal
está en `DRAFT`; si no se ha publicado, el plazo no ha empezado.

**Justificación comercial:** el precio separa el valor de **construir** la
infraestructura del de **operarla**. La implementación queda como activo de Celeste
aunque después cambie de operador. La pauta va aparte para no inflar honorarios.
**No ofrecer descuentos automáticos:** si hay resistencia, reducir alcance antes que
regalar horas de implementación.

---

## 7. Métricas y honestidad

Se mide: **CPL, prospectos, % calificado, solicitudes y visitas Discovery, ventas
atribuibles si se acuerda atribución**.

**No se garantizan resultados.** El resultado también depende de la oferta, la
disponibilidad y la velocidad de cierre del equipo de Celeste.

---

## 8. Guión y tiempos — 11 slides · 38 min

| # | Slide (título en pantalla) | Min | Idea que debe quedar |
|---|---|---|---|
| 1 | Apertura | 2 | Agradecer, confirmar asistentes, encuadrar 35–40 min y 4 datos |
| 2 | La oportunidad | 4 | 104 fracciones, precios, mercados, equipo, Discovery |
| 3 | Diagnóstico | 4 | 3 hipótesis; preguntar cuántos interesados/visitas reciben |
| 4 | Infraestructura comercial | 5 | No es agencia: sistema que capta, atiende, lleva a visita y mide; Celeste cierra |
| 5 | El recorrido del prospecto | 3 | Etapas con responsable y registro; el punto crítico es la visita |
| 6 | Dos fases, un solo sistema | 4 | Implementación (1–4) + operación (5–12); semana 4 depende de accesos |
| 7 | Qué incluye el sistema | 3 | Qué incluye; 4 piezas incluidas, 8 ampliación; activos de Celeste |
| 8 | Inversión: implementación + operación | 5 | 4,500 + 2,500×3 = 12,000; pauta aparte; qué no incluye |
| 9 | Incentivo por ventas atribuibles | 3 | 0.75–1% de ventas atribuibles cobradas; no sustituye honorarios |
| 10 | Qué medimos | 3 | CPL, % calificado, Discovery, ventas atribuidas; no garantía |
| 11 | Siguientes pasos | 2 | 4 datos, aceptación en Deal Room, kickoff de implementación |

**Regla:** abre el deck al terminar el encuadre, no antes. Usa **Presentar deck** en la
sala y avanza con el dock (los beats de cada slide aparecen en el panel **Guión**).

**Cómo se lee el guión:** está escrito para decirlo, no para estudiarlo. Cada bloque
empieza con **Di:** (lo que se dice), **Pregunta:** (lo que se pregunta) u **Ojo:**
(lo que no se debe olvidar). Si te trabas, usa la línea **“Si te pierdes”**. No lo
leas textual: úsalo como carril.

---

## 9. Objeciones y respuestas cortas

- **“¿Por qué subió de $7,900 a $12,000?”** Porque antes se cobraba como agencia un
  trabajo que incluye construir la infraestructura. Ahora se separa: **$4,500** por
  construirla y **$2,500/mes** por operarla. La implementación queda como activo de
  Celeste aunque después cambie de operador.
- **“¿Garantizan ventas?”** No. Operamos el sistema, lo medimos y reportamos; el
  cierre y la relación son de Celeste.
- **“¿Pueden bajar la implementación?”** No se regalan horas de construcción. Si el
  presupuesto aprieta, se **reduce alcance** (por ejemplo, menos mercados o menos
  contenido), no el precio de la implementación.
- **“¿Y el 8% de Curamoria?”** Es su referencia de costo de venta por terceros, no
  nuestra tarifa. El 8% no es comisión de Pandora's y no compite con nuestro modelo.
- **“¿Por qué 90 días?”** Permite diagnóstico, construcción, activación, optimización
  y una decisión con datos; no es un contrato largo.
- **“¿Qué pasa si no funciona?”** No hay penalización por no renovar; al cierre se
  entregan activos, accesos y reporte.
- **“¿Quién atiende?”** Pandora's opera; al inicio atención humana asistida. La
  automatización de WhatsApp está sujeta a Meta.
- **“¿Qué necesitan de nosotros?”** Los 4 datos, accesos/materiales y un responsable
  de aprobaciones.
- **“¿Ya está la pauta?”** Va aparte, la paga Celeste directo a plataformas.

---

## 10. Cierre de la reunión (los 4 datos + siguientes pasos)

Validar en la llamada:

1. **Anticipo** y condiciones de la Estancia Discovery.
2. **Reglas Discovery** (quién confirma, disponibilidad, noches).
3. **Presupuesto de pauta** (escenario 1,500–3,000/mes).
4. **Accesos y materiales** (dominio, cuentas, catálogo, fotos, aprobaciones).

Luego:

- Aceptar la propuesta en el **Deal Room** (`PDR-63C2E9`, sección 05, v1.1).
- Kickoff / semana 1 de diagnóstico.
- Definir qué pasa a los 90 días: continuidad mensual, nuevo alcance o cierre ordenado.

**No improvisar descuentos, plazos ni comisiones.** Si piden un incentivo por ventas,
se negocia por separado con reglas de atribución y revisión legal.

---

## 11. Discrepancias y pendientes

1. **Contenido:** deck y Deal Room dicen **4 piezas/mes incluidas + 8 solo mediante
   ampliación cotizada**. Confirmarlo antes de firmar.
2. **8% de Posadas/Curamoria:** confirmar **de qué se calcula** (lista, cobrado, neto).
3. **Inventario nominal ~USD 16.12M:** es valor de lo disponible, **no ventas**.
4. **Validez 30 días:** corre desde la publicación on-chain; el deal está `DRAFT`.
5. **Firmante:** el Deal Room sigue con **0 firmantes**. La invitación al Deal Room se
   envía desde el propio Deal Room (no depende de la reunión).

---

## 12. Checklist pre-flight (10:50, 10 minutos antes)

- [ ] Entrar a la sala con tu usuario host: `/nexus/agenda` → reunión de las 11:00.
- [ ] Confirmar que el panel **Guión** muestra **11 slides** y ~**38 min objetivo**.
- [ ] Verificar los 3 números en el panel/slide 8: **$4,500 · $2,500 · $12,000**.
- [ ] Abrir **Presentar deck** una vez y cerrarlo (calienta el iframe).
- [ ] **Aviso conocido:** el servidor de producción aún acota el slide al catálogo
      desplegado (10 slides). El slide 11 no se alcanza en la sala **hasta desplegar**
      `apps/dashboard/src/app/api/v1/meet/presentation/route.ts`. Si no hay deploy
      antes de las 11:00, abre `https://nexus.pandoras.finance/pitch/deck/celeste?slide=10`
      en otra pestaña para el cierre y comparte pantalla.
- [ ] **Recordatorios:** `reminder_24h_sent_at` y `reminder_1h_sent_at` están en `NULL`
      para Eduardo — el cron no los ha marcado. **Enviar la liga a mano** (arriba) si
      no tienes confirmación de que le llegó el correo.
- [ ] Probar el dock: Guión, Contexto, Liga, Silenciar, Minuta.
- [ ] Al terminar: **subir audio** (≤10 MB) en Minuta si quieres resumen IA; luego
      **Enviar resumen** (solo a asistentes).

---

## 13. Después de la reunión

1. Revisar minuta y tareas.
2. Enviar resumen a asistentes (con audio procesado).
3. Si se movió precio o alcance, actualizar **deck + Deal Room + este brief** juntos:
   el deck vive en la DB y el Deal Room en `nexus_deal_sections`.
4. Acordar kickoff y pedir accesos/materiales.
5. Registrar la decisión: avanza / no avanza / siguiente fecha.
