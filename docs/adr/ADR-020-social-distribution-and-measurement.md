# ADR-020 · Distribución social y medición de primera parte

- **Estado:** aceptado · fase 0 en implementación
- **Fecha:** 2026-11-25
- **Contexto anterior:** ADR-019 (agente de comunidad con propuestas gobernadas)

## 1. Contexto

El agente de comunidad ya propone, el humano aprueba y Hermes publica en Discord. Faltan tres
piezas para que eso sea una estrategia y no una demostración:

1. **Medición**: hoy se mide el clic (`nexus_outreach_events` / `/l/<code>`) pero el lead queda
   sin atribuir (`attribution.leads = null`). El checkout (`/pay/<slug>/<tier>`) manda
   `source: 'checkout_hub'` fijo y no lee el origen.
2. **Distribución**: sólo Discord está realmente cableado. X tiene publicador sin credenciales;
   Instagram y Facebook no existen como adaptadores, aunque el registro A2A **declara**
   `media.publish.channel:*` (y hoy falla cerrado).
3. **Media**: el motor existe (orquestador Sofía/RunPod) pero en inmobiliaria no se puede inventar
   material: el proyecto se construye y el contenido debe apoyarse en piezas reales (renders,
   fotos de obra, planos, avances).

Restricción de operación: el dueño no tiene equipo para operar varias redes. La fricción debe
quedar en **aprobar**, no en producir ni publicar.

## 2. Decisión

### 2.1 Medición de primera parte

- El clic en `/l/<code>` deja la cookie `nx_src` (30 días, `SameSite=Lax`, no `httpOnly`).
  El código **no es secreto**: ya viaja en la URL pública; se valida formato `^[a-z0-9]{4,16}$`.
- Prioridad de resolución: `?src=` de la URL → cookie → `null`. **Nunca se inventa un origen.**
- Punto de captura por tenant: `/join/<organizationSlug>` (público) que crea el lead por el
  endpoint canónico `POST /api/v1/marketing/leads/register` con `utm_source = <code>` y
  `consent: true`. El lead queda en `marketing_leads` (mismo embudo, mismos reportes).
- El checkout propaga el origen: `CheckoutClient` resuelve `src`/cookie y lo manda en
  `source` al `fast-lane` (que ya lo aceptaba). Sin `src`, se conserva `checkout_hub`.

**Contrato congelado de medición:** `nx_src` · `utm_source = <code>` · `marketing_leads.source`.
Cambiar cualquiera rompe los reportes; se extiende, no se sustituye.

### 2.2 Adaptadores por red (reutilizando lo existente)

No se crea subsistema nuevo. Se usa lo que ya existe:

| Pieza existente | Uso |
|---|---|
| `IChannelPublisher` + `PublicationReceipt` (idempotencyKey, códigos de error) | contrato de publicación |
| `DirectChannelPublisher` | registro `telegram · x · newsletter` + los nuevos |
| `tenant_social_integrations` (`encryptedPayload`, `credentialFingerprint`, `lastVerifiedAt`) | credenciales **por tenant**, cifradas |
| A2A `capability.request` | ejecución gobernada tras aprobación |

Se añade:

- `ChannelType` += `'instagram' | 'facebook'`.
- `FacebookPagePublisher` (Page feed; texto o foto) e `InstagramPublisher` (contenedor → publicar;
  **exige imagen pública https**, 25 posts/24 h, caption ≤ 2200).
- Implementación real de `media.publish.channel:facebook|instagram` (hoy declaradas y fail-closed).

**Prohibido:** un bot por plataforma. Los bots son roles (proponer, leer), no credenciales.
Las credenciales viven en Hermes y se conectan por tenant.

### 2.3 Media: material real primero

- Fuente de verdad del material: **assets del proyecto** (renders, fotos de obra, planos, video),
  no generación por IA.
- La IA sólo produce **derivados** (recortes, portadas, textos sobre plantilla), nunca "el edificio".
- Cada publicación referencia un asset existente; si no hay asset, no hay publicación con imagen.
- `media.image.create` queda opcional y detrás de aprobación, igual que el texto.

### 2.4 Una aprobación, varias redes

Una propuesta puede llevar varias plataformas. La aprobación es única (una tarjeta) y el servidor
publica en cada red con el copy adaptado. Cada ejecución es idempotente por `(aprobación, red)`.

Diferencias por red (no se copia y pega):

| | Instagram | Facebook |
|---|---|---|
| Texto | caption corto (≤ 2200), 3–5 hashtags | 1–3 párrafos, enlace en el cuerpo |
| Imagen | **obligatoria** (1:1 o 4:5) | opcional |
| CTA | "escríbenos por DM" + enlace en bio | enlace directo medible `/l/<code>` |
| Riesgo | no permite texto suelto | permite enlace y más texto |


### 2.5 Hub de Discord multi-tenant

**Decisión:** un solo servidor (el de Pandora's) hospeda a los tenants por **categoría**, con un
rol por tenant y permisos deny-by-default. S'Narai es el primer inquilino (`S'NARAI` +
`S'NARAI · MIEMBROS`).

Reglas:

1. Una categoría y un rol por tenant.
2. Canales privados por defecto: `@everyone` no ve; sólo el rol del tenant y el staff.
3. El publicador sólo escribe en canales con el prefijo del tenant (`<slug>-*`) y nunca en la
   categoría de miembros.
4. El lector sólo lee esos mismos canales.
5. **Prueba de fuga obligatoria** en cada alta: con el rol del tenant A no se ve ningún canal de B.

**Prerrequisito técnico (hoy bloqueado):** `community-publisher.ts` y la CLI del lector filtran
`^s-narai-` **en duro**. Para hospedar otro tenant hay que derivar el prefijo del `slug` del
proyecto. Sin eso, el hub no es multi-tenant: es el servidor de S'Narai con canales extra.

**Canales de aviso del tenant:** `tenant_notification_channels` con `kind`
(`leads` · `approvals` · `alerts`). Puede ser el mismo canal para varios kinds o uno distinto por
kind. Se configuran por API, con la sesión del owner:

```
PUT    /api/v1/tenant/<slug>/notification-channels   { kind, url }
DELETE /api/v1/tenant/<slug>/notification-channels?kind=leads
```

La organización **sale de la sesión**; pedir el canal de otro tenant devuelve 403. La URL se valida
como webhook de Discord y se desactiva (`enabled=false`) en vez de borrarse.

**Límites y ruta de escape:** Discord permite 500 canales por servidor y los permisos se vuelven
frágiles con muchos tenants. Regla operativa: hasta ~5 tenants activos, hub; por encima de eso —o
si el tenant es enterprise— servidor dedicado. El código ya resuelve por `DISCORD_GUILD_ID`, así
que migrar es configuración, no refactor.

### 2.6 Marcas y redes

| Marca | Redes | Rol | Etapa |
|---|---|---|---|
| **Pandora's** | LinkedIn · X | institucional: tesis, alianzas, tecnología, hiring | 1 |
| **Pandora's** | YouTube | demos y presentaciones (sin material aún) | diferido |
| **S'Narai** | Discord (hub) · canales web3 | comunidad + descubrimiento sin coste de media | 1 |
| **S'Narai** | Instagram | identidad visual y deseo (requiere assets) | 1 (activo) |
| **S'Narai** | Facebook | implementado, **no habilitado** por decisión de operación | diferido |
| **Tenants** | las que conecten | su propio contenido | por su portal |

Reglas:

- **Una comunidad central, varias puertas.** Discord es donde se construye; X/IG/FB sólo llevan
  gente hacia ella. No se administran cuatro comunidades.
- **Pandora's no abre IG/FB/TikTok** y no publica producto: su audiencia es institucional.
- **S'Narai es marca propia**, con identidad y analíticas separadas; puede mencionar el ecosistema
  Pandora's sin depender de la marca matriz.
- **S'Narai no usa X**: exige más esfuerzo que el resto y su impacto no es proporcional al objetivo
  (conversación calificada). X queda como canal institucional de Pandora's.
- **Canales web3 en lugar de X**: Farcaster y Reddit (`r/RWA`, real estate investing) son texto,
  no exigen material, tienen audiencia de tokenización y permiten enlazar a Discord. Se miden con
  los mismos enlaces `/l/<code>`. Regla: aportar antes de promocionar; nada de spam en comunidades
  ajenas.
- **Instagram** entra cuando existan los assets (es la red visual del comprador).
- **Propiedad institucional**: cuentas, correos, dominios y servidores pertenecen a la entidad, no
  al community manager. Los accesos se otorgan, no se ceden.
- Los tenants heredan el mecanismo, no el contenido: conectan sus cuentas por el portal.

**Indicadores por canal (S'Narai):** X → alcance, interacciones y clics a Discord · Instagram →
alcance, reproducciones, compartidos y visitas al perfil · Facebook → alcance, participación y CPA ·
Discord → miembros activos, retención, participación y leads.

### 2.7 La pregunta que define el contenido

Antes de contratar a nadie para operar la comunidad hay que fijar: **¿qué es S'Narai para el público
y qué debe hacer una persona después de descubrirlo?**

Propuesta (ya soportada por la infraestructura): el objetivo no es "tener comunidad", es **provocar
una conversación calificada**. El recorrido medible es:

```
publicación → /l/<code> → /join/<slug> (datos + consentimiento) → CRM → llamada con el equipo
```

Eso define el contenido: explicar el modelo (Título de Propiedad, estancias anuales), mostrar obra
real y resolver objeciones. No memes, no frases de IA, no promesas de rentabilidad.

## 3. Multi-tenant

- Todo se resuelve por `canonicalOrgId`; jamás por un `tenantId` del cliente.
- Credenciales: una fila por `(tenant, channel)` en `tenant_social_integrations`; revocación
  borra el payload y deja `credentialFingerprint` para auditoría.
- Captura: `/join/<slug>` resuelve el proyecto en servidor; un tenant nuevo hereda la ruta sin
  código nuevo.
- Notificaciones y aprobaciones ya son tenant-scoped (ADR-019): sin fallback global.

## 4. Seguridad

- El código de atribución se valida antes de escribir cookie o base.
- Consentimiento explícito obligatorio en la captura; se guarda `consentAt` y `consentSource`.
- Tokens de red cifrados, nunca en logs ni en respuestas; `lastVerifiedAt` y verificación
  periódica; si la credencial está revocada, la publicación **falla cerrada** (no se publica en otra).
- El checkout no confía en el `source` del cliente para autorizar nada: sólo atribuye.

## 5. Fases

| Fase | Alcance | Estado |
|---|---|---|
| 0 | Cookie `nx_src`, `/join/<slug>`, `src` en checkout | ✅ implementado |
| 0.5 | Whitelist por tenant (publisher + lector) — prerrequisito del hub | pendiente |
| 1 | `FacebookPagePublisher` + `InstagramPublisher` + registro | pendiente (credenciales) |
| 2 | A2A `media.publish.channel:*` real + aprobación multi-red | pendiente |
| 3 | Media: biblioteca de assets por tenant y `media.image.create` opcional | pendiente |
| 4 | Hub multi-tenant (categoría + rol por tenant + prueba de fuga) | pendiente |
| 5 | X/LinkedIn como extensiones del mismo contrato | diferido |

## 6. Consecuencias y deuda

- `attribution.leads` deja de ser `null` en cuanto exista un lead que llegue por `/join`.
- El `source` del fast-lane mejora la atribución de pagos, pero la orden completa
  (`commercial_orders`) aún no guarda el código: se resuelve leyendo el lead.
- La auto-descubierta de proyecto por `Origin` en `leads/register` es deuda de seguridad
  heredada: se mantiene por compatibilidad, pero la captura nueva resuelve por slug.
