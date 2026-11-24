# S'Narai · Auditoría de readiness + estrategia de captación (24 nov 2026)

Alcance: portal y proyecto real (`/Users/Marco/Documents/Company/Aztecas/Proyectos/Narai/apps/web`),
su lugar como tenant en `dash.pandoras.finance` (Growth / Hermes / RWA) y el plan de Discord.
Todo lo que sigue está verificado en código o en base de datos; lo inferido va marcado como tal.

---

# Resumen ejecutivo

| Pregunta | Veredicto |
|---|---|
| ¿S'Narai está listo para vender desde su portal? | **Casi, pero no.** El contenido y la captación están listos; **el cobro no ocurre en el portal** y hay **tres tablas de precios contradictorias** en el mismo repo. |
| ¿Sirve como tenant interno de Pandora's? | **Sí, ya lo es.** `projects.id=17`, `slug=snarai`, `status=live`. Growth y Hermes tienen todo lo necesario; RWA es donde debería cerrarse la venta. |
| ¿Dónde va la estrategia de Discord? | **Growth OS**, como él intuyó — con Hermes capturando la conversación y RWA cerrando la transacción. Discord **no** debe ser el CRM. |

**Tres bloqueadores antes de meter tráfico:**

1. **Precios contradictorios (P0).** Tres fuentes distintas en el mismo proyecto:
   - `src/constants/memberships.tsx`: $500 / $2,500 / $25,000 / $100,000 (10 / 50 / 500 / 2,000 certs).
   - `src/knowledge/snarai.ts`: $50 / $500 / $2,500 (+ unidad completa).
   - `llms-full.txt` + gobernanza: $50 Explorer (10 CP), $500 Residente (50 CP), $2,500 Embajador (200 CP), Riviera Owner (1,000 CP).
   - Además `messages/es.json` habla de “Miembro Fundador / Estratégico / Acceso General”.
   → Cuatro relatos de precio. **Ningún tráfico debe entrar hasta unificar.**
2. **El cobro no está en el portal (P0).** No hay pasarela ni acción de compra en la app de S'Narai
   (`src/app/api` sólo tiene `send-magic-link`). El portal abre `projectState.globalCertificate.globalPortalUrl`,
   que apunta al mercado de Pandora's. Ese mercado (`/protocol/market/[id]`) hoy **es de lectura**: muestra
   listings y NAV, y pone `setUserBalance('1500.00')` con el comentario *“Mock balance for demo if not
   logged in”*. La participación real entra por un webhook S2S (`/api/v1/internal/agora/participate`,
   autenticado con `PANDORA_CORE_KEY`) desde la Edge API. **Falta el botón de compra real.**
3. **Claims prohibidos en el copy (P1).** “plusvalía anual proyectada del 12–15%”, “gana hasta un 40% más
   por entrar primero”, “noches garantizadas”, “Riviera Maya” (el proyecto es Riviera Nayarit). Contradicen
   la política de claims del propio ecosistema y son material de riesgo regulatorio si se promocionan.

---

# Parte A · Auditoría del portal S'Narai

## Lo que sí está listo (verificado)

| Pieza | Evidencia |
|---|---|
| Narrativa institucional | white paper, data room (20 documentos institucionales), due diligence index, project status, partners, legal |
| Gobernanza | `/dao-rules` con quórum 10%, votación 24 h, timelock 24 h, dispersión en USDC (7 días) |
| Academia | módulos y walkthrough |
| Captación de leads | `submitLead`, `registerGestor`, verificación por PIN (`verifyGestorEmail`) |
| Datos reales de marketing | `marketing_leads` 206 · `marketing_identities` 296 |
| Portal del inversionista | magic link, portafolio, estado del proyecto, reporte, transparencia |
| Programa de gestores | panel, referrals, decisiones, recomendaciones |
| i18n | ES/EN completo |

## Lo que falta para “vender”

| # | Faltante | Impacto |
|---|---|---|
| A-1 | Unificar precios/tiers en **una** fuente y propagarla a landing, knowledge, PDF y portal | crítico |
| A-2 | Cerrar el cobro: botón de compra real en el mercado RWA (o deep-link a la Edge API con sesión), con POF y contrato | crítico |
| A-3 | Inventario verificable (hoy el knowledge declara `availableUnits: 30000`; el sitio no consulta inventario real) | alto |
| A-4 | Limpiar claims del copy (12–15%, 40%, noches garantizadas) y el error “Riviera Maya” | alto |
| A-5 | Confirmar que `globalPortalUrl` apunta al protocolo correcto (id 17) en producción | medio |

**Mi lectura:** A-1 y A-4 son trabajo de una tarde; A-2 es el único que exige desarrollo real y
probablemente ya existe del lado de la Edge API (el webhook lo sugiere). Nada de esto invalida el
producto: invalida **empezar a pagar por tráfico** antes de cerrarlo.

---

# Parte B · S'Narai como tenant interno

S'Narai **ya es** un proyecto de Pandora's (`projects.id=17`, `slug=snarai`, `status=live`). Lo que
falta no es darlo de alta, es usarlo.

| Portal | Qué aporta hoy | Rol propuesto para S'Narai |
|---|---|---|
| **Growth OS** (`/portal/snarai/growth`, `/crm`) | `crm_opportunities` con etapas (`nuevo → contactado → calificado → discovery_solicitado → visita_realizada → propuesta → ganada/perdida`), valor estimado y cerrado, atribución `source/utm_source/utm_medium/utm_campaign`, export CSV, aprobaciones, analytics y automatizaciones | **Dueño del embudo**: de dónde vino cada interesado, en qué etapa está, cuánto vale |
| **Hermes OS** (`/admin/hermes`) | 16 artefactos de conocimiento de S'Narai hidratados desde el vault (sin `MISSING`), canales WhatsApp/Telegram, mesh de canales, propuestas gobernadas | **Captura y calificación conversacional**: responde, califica y propone; no escribe en CRM sin aprobación |
| **RWA** (`/protocol/market/17`) | listings, NAV, configs, gobernanza, participaciones vía Edge | **Cierre**: certificado, POF, pago, registro |

**Regla de oro:** Discord capta, Growth mide, Hermes conversa, RWA cobra. Ninguno invade al otro.

## Lo que falta para operar como tenant de marketing

1. Pipeline propio de S'Narai (hoy las 12 oportunidades existentes son de otra organización).
2. Campañas de Growth con `utm_campaign` por canal y contenido, no sólo por link.
3. Un panel de embudo para S'Narai (la página existe; hay que poblarla y definir stages).
4. Puente Discord → lead (hoy sólo hay webhooks de notificación saliente).

---

# Parte C · Estrategia de Discord

## Decisión: dos capas, no una

| Capa | Visibilidad | Contenido | Quién entra |
|---|---|---|---|
| **Capa 1 · `#s-narai` (pública)** | Visible para todo el servidor de Pandora's | tesis, avance de obra, renders, AMAs, educación (qué es un certificado de participación), no-precio | cualquiera |
| **Capa 2 · `#s-narai-miembros` (privada)** | Canal de solo lectura con rol verificado | documentos del data room, calendario de visitas, preguntas de due diligence, avisos de disponibilidad | rol verificado por correo/portal |

**Por qué híbrido:** Discord es público por naturaleza y el activo es *off-market*. Si todo es privado,
no capta; si todo es público, se filtra el deal y se promocionan cifras sin NDA. La capa 1 capta, la
capa 2 retiene y eleva la intención.

**El rol verificado** se obtiene registrando el correo en `snarai.aztecaz.xyz` y verificando en
`/admin/discord-verify` (ya existe la página). Eso convierte a Discord en un **canal de conversión**,
no sólo de comunidad.

## Estructura propuesta (mínima, dentro del servidor de Pandora's)

```
CATEGORÍA · S'NARAI (pública)
  #s-narai-anuncios        avisos oficiales (solo staff)
  #s-narai-la-oportunidad  qué es, tesis, por qué Bucerías
  #s-narai-avance          hitos de obra y operación
  #s-narai-preguntas       dudas públicas (moderadas)
  #s-narai-amas            eventos con fecha/hora
CATEGORÍA · S'NARAI MIEMBROS (privada, rol verificado)
  #miembros-documentos     índice del data room
  #miembros-visitas        agenda de visitas al desarrollo
  #miembros-due-diligence  preguntas técnicas con el equipo
```

## Cómo se capta atención (mecánica, no inspiración)

1. **Cada publicación con enlace atribuible**: `https://snarai.aztecaz.xyz?utm_source=discord&utm_campaign=<poste>`
   o el link de radar `/l/<code>` de Pandora's, que ya registra apertura y redirige a `/pitch/<pod>`.
2. **Cada AMA deja un CTA único**: “acceso al data room → registra tu correo”, no “visita la web”.
3. **Ritmo semanal fijo** (predecible = autoridad):
   - Lunes: tesis / educación (un concepto financiero explicado sin promesas).
   - Miércoles: avance real (obra, licencias, operación).
   - Viernes: pregunta abierta + AMA quincenal.
   - Mensual: “mes en 5 datos” con cifras verificables.
4. **Colaboración con los otros canales**: cada post de Discord se reutiliza en WhatsApp/Telegram vía
   Hermes (mismo texto, distinto enlace de atribución).

## Reglas de cumplimiento (no negociables)

- Nunca precio, retorno proyectado, “garantizado”, “noches garantizadas” ni comparativos de rendimiento.
- Toda mención de inversión lleva la declaración de riesgo y remite al white paper.
- El data room se menciona, **no** se enlaza en público: se entrega tras NDA/registro.
- Moderación con regla escrita: se borra cualquier cifra de retorno publicada por terceros.

## KPIs del canal

| Etapa | Métrica | Meta inicial |
|---|---|---|
| Atención | miembros nuevos / semana | 25 |
| Activación | verificados (correo) / miembros | 20% |
| Intención | clics atribuidos por publicación | 15% de miembros activos |
| Conversión | leads calificados en CRM | 5 / semana |
| Cierre | participaciones (RWA) | 1–2 / mes |

---

# Parte D · Veredicto de integración

**Sí: Growth OS.** Es el único que ya tiene pipeline, etapas, valor, atribución por UTM, export y
aprobaciones. Hermes no debe cargar el CRM (es capa de propuesta y conversación) y RWA no debe cargar
marketing (es transacción y cumplimiento).

**Qué construir (mínimo, en orden):**

| # | Pieza | Por qué |
|---|---|---|
| 1 | Endpoint de ingesta Discord → `marketing_leads` (`source='discord'`, utm del enlace) | sin esto no hay atribución |
| 2 | Pipeline S'Narai en `crm_opportunities` (org del proyecto 17) con las etapas ya existentes | medir avance real |
| 3 | Generador de enlaces `/l/<code>` por publicación/campaña | atribución por post, no por canal |
| 4 | Panel `/portal/snarai/growth` poblado (funnel + fuentes + valor) | decisión semanal con datos |
| 5 | (Después) comando de bot `/snarai` para consultar estado y pedir acceso | reduce fricción |

**Lo que NO haría:** un bot nuevo de comunidad desde cero. Los webhooks y la página de verificación ya
existen; conviene usarlos antes de añadir superficie.

---

# Parte E · Plan

**Semana 0 (bloqueadores):** unificar precios → una sola fuente; limpiar claims; decidir la ruta de cobro.
**Semanas 1–2:** pipeline S'Narai + ingesta Discord + enlaces atribuibles + panel de funnel.
**Semanas 3–4:** abrir `#s-narai` público con calendario de 4 semanas; primera AMA; medir activación.
**Mes 2:** capa de miembros (rol verificado) y primeras visitas; iterar con datos de CRM.
**Mes 3:** escalar lo que funcione; cortar lo que no.

---

# Decisiones que necesito del Fundador

1. **¿Cuál tabla de precios es la verdad?** (la de `memberships.tsx`, la de `knowledge/snarai.ts`, o la
   de gobernanza). Sin esto no se puede tocar landing, PDF ni campañas.
2. **¿La venta se cierra en el mercado RWA con botón propio, o se delega a la Edge API** con deep-link?
3. **¿Autorizas abrir `#s-narai` público** en el servidor de Pandora's, con la capa de miembros detrás
   del registro?
