# Pandora's ↔ Pandora's Media Co

# Integration Contract v1.2

### Architecture Lock — Event Spine & Omnichannel Integration

**Status:** 🟢 Architecture Baseline / Frozen
**Version:** 1.2
**Scope:** Pandora's Platform + Pandora's Media Co
**Primary Tenant:** S'Narai
**Audience:** Pandora's Platform Engineering, Hermes Engineering, Media Co Engineering, Infrastructure, Growth/Marketing
**Purpose:** Definir el contrato canónico para integrar adquisición, identidad, eventos, atribución, journeys, Hermes y ejecución omnicanal sin conexiones punto-a-punto ni dependencia directa de infraestructura interna.

---

# 0. Executive Rule

> **Pandora's Media Co genera atención y proporciona señales de adquisición/atribución. Pandora's Platform es el System of Record. El Event Spine es el centro de integración. Hermes es la Cognitive/Decision Layer. Governance controla autoridad. Execution OS ejecuta.**

Ningún componente puede saltarse estas fronteras para realizar una acción fuera de su responsabilidad.

```text
Media Co
   │
   │ Integration API
   ▼
Integration Gateway
   │
   ▼
Event Spine
   │
   ├── Identity Resolution
   ├── Attribution
   ├── Journey Engine
   │
   ▼
Hermes
Cognitive Layer
   │
   ▼
Governance
   │
   ▼
Execution OS
   │
   ├── WhatsApp
   ├── Telegram
   ├── Voice
   ├── Email
   └── Web
```

---

# 1. Architectural Boundaries

La arquitectura queda dividida en siete dominios.

| Dominio                 | Responsabilidad                                       | Puede escribir directamente en DB |
| ----------------------- | ----------------------------------------------------- | --------------------------------: |
| **Media Co**            | Atención, campañas, creatividades, adquisición        |                                 ❌ |
| **Integration Gateway** | Autenticación, autorización, validación, idempotencia |                                ❌* |
| **Event Spine**         | Registro canónico de eventos                          |                                 ✅ |
| **Identity Service**    | Identidad canónica y resolución                       |                                 ✅ |
| **Journey Engine**      | Estado y evolución del journey                        |                                 ✅ |
| **Hermes**              | Cognición, interpretación, recomendación              |                                 ❌ |
| **Governance**          | Autoridad y aprobación                                |                                ❌* |
| **Execution OS**        | Ejecución operacional                                 |                                ❌* |
| **Channel Adapters**    | Traducción hacia canales externos                     |                                ❌* |
| **Meta/Ads Adapters**   | Feedback de conversiones                              |                                ❌* |

`*` Las escrituras pasan por los servicios/repositorios autorizados de Pandora's Platform, no por acceso arbitrario a NeonDB.

### Regla absoluta

> **Media Co jamás tendrá acceso directo a NeonDB.**

No tendrá:

* connection strings;
* credenciales PostgreSQL;
* acceso Drizzle;
* acceso Redis;
* secrets de SignalWire;
* tokens de Meta;
* secrets de Hermes;
* credenciales internas de Execution OS.

---

# 2. Source of Truth Matrix

| Dominio                     | Canonical Owner      | Media Co              |
| --------------------------- | -------------------- | --------------------- |
| Campaigns                   | Media Co             | Read/Write vía API    |
| Creatives                   | Media Co             | Read/Write            |
| Ad Accounts                 | Media Co             | Operational ownership |
| UTMs                        | Media Co → Pandora's | Signal provided       |
| Attribution State           | Pandora's Platform   | Read                  |
| Identity                    | Pandora's Platform   | No direct access      |
| CRM / Lead State            | Pandora's Platform   | Read vía API          |
| Event Spine                 | Pandora's Platform   | Ingest/Read vía API   |
| Conversation History        | Pandora's Platform   | No direct access      |
| Hermes Memory               | Pandora's Platform   | No direct access      |
| Journey State               | Pandora's Platform   | Read                  |
| Governance State            | Pandora's Platform   | No access             |
| Execution State             | Pandora's Platform   | Read                  |
| Conversion Events           | Pandora's Platform   | Read                  |
| Meta CAPI Credentials       | Pandora's Platform   | No access             |
| Media Performance           | Media Co             | Own                   |
| Canonical Customer Identity | Pandora's Platform   | No                    |

### Regla de atribución

Media Co **proporciona attribution signals**.

Pandora's Platform mantiene la **canonical attribution state**.

---

# 3. Integration Client

Media Co utilizará un `IntegrationClient` registrado en Pandora's.

Ejemplo conceptual:

```json
{
  "clientId": "mc_prod_xxxxx",
  "organizationId": "org_pandoras",
  "name": "Pandora's Media Co",
  "status": "ACTIVE",
  "scopes": [
    "campaign:write",
    "lead:write",
    "attribution:write",
    "events:write",
    "analytics:read",
    "events:read"
  ]
}
```

Los valores anteriores son ilustrativos. **Nunca deben copiarse como credenciales reales.**

---

# 4. Integration Scopes

### `campaign:write`
Permite registrar o actualizar campañas.

### `lead:write`
Permite enviar señales de nuevos leads.

### `attribution:write`
Permite enviar UTMs, campaign IDs y señales de origen.

### `events:write`
Permite enviar eventos externos al Event Gateway.

### `events:read`
Permite consultar eventos autorizados.

### `analytics:read`
Permite consultar métricas y conversiones agregadas.

### Principio Least Privilege
Media Co solamente recibirá los scopes necesarios para su función. No se otorgarán:
`db:read`, `db:write`, `identity:admin`, `governance:write`, `execution:write`, `hermes:admin`.

---

# 5. Tenant Security

Este punto es **inmutable**.

Un `organizationId` o `projectId` enviado por Media Co **NO constituye autoridad de tenant**.

El payload puede contener:

```json
{
  "projectId": "snarai"
}
```

pero Pandora's debe resolver:

```text
Integration Client
        ↓
Authorized Organizations
        ↓
Requested Project
        ↓
Tenant Authorization
        ↓
Canonical Organization
```

El sistema debe verificar: `requestedProject ∈ authorizedScope(client)` antes de aceptar el evento.

### Regla
> **El cliente puede solicitar un tenant; nunca puede otorgarse autoridad sobre ese tenant.**

Esto preserva las invariantes del **Multi-Tenant & Governance Integrity Boundary**.

---

# 6. Event Gateway

El punto de entrada canónico será:

```http
POST /api/v1/integrations/events
```

Opcionalmente podrán existir endpoints especializados para DX:

```http
POST /api/v1/integrations/leads
```

pero internamente deben normalizar al mismo `PlatformEvent`.

No existirán diferentes sistemas de eventos para Meta, Telegram, WhatsApp, Media Co, S'Narai, o SignalWire. Todos terminan en el mismo Event Spine.

---

# 7. PlatformEvent Contract

Todo evento debe implementar conceptualmente:

```typescript
interface PlatformEvent {
  eventId: string;

  eventType: string;

  source: {
    system: string;
    channel?: string;
  };

  requestedOrganizationId?: string;
  projectId?: string;

  occurredAt: string;

  correlationId: string;

  causationId?: string;

  identity?: {
    email?: string;
    phone?: string;
    walletAddress?: string;
    externalId?: string;
  };

  attribution?: {
    campaignId?: string;
    adId?: string;
    creativeId?: string;

    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };

  payload: Record<string, unknown>;
}
```

---

# 8. Event Identity Model

Cada evento tendrá cuatro identificadores conceptualmente distintos.

## `eventId`
Identifica **el evento individual** (Ej. `evt_001`). Nunca debe repetirse.

## `identityId`
Identifica **la persona o entidad canónica** (Ej. `identity_abc`). Es generado/resuelto por Pandora's. Nunca debe ser inventado por Media Co.

## `correlationId`
Identifica **la cadena de interacción/journey**. (Ej. `corr_instagram_snarai_2026_08_001`). Permite reconstruir: Ad → Landing → Lead → WhatsApp → Hermes → Meeting → Purchase.

## `causationId`
Identifica **qué evento provocó este evento**. (Ej. `evt_lead` → `evt_whatsapp` → `evt_intent`). 

Por tanto:
* `eventId` = qué ocurrió
* `identityId` = quién
* `correlationId` = qué journey
* `causationId` = qué lo provocó

---

# 9. Idempotency Contract

Todos los eventos de entrada deben ser idempotentes.

El cliente deberá proporcionar: `Idempotency-Key: <unique-key>` y/o utilizar un `eventId` único.

Si Meta reintenta:
* Request 1 → process
* Request 2 → already processed

El sistema **NO** debe crear otro lead, otra identidad, otro journey, o duplicar la atribución.

---

# 10. Event Lifecycle

Cada evento sigue:
RECEIVED → VALIDATED → AUTHORIZED → IDEMPOTENCY CHECK → TENANT RESOLUTION → IDENTITY RESOLUTION → PERSISTED → DISPATCHED → CONSUMED.

Los errores deben quedar registrados sin perder el evento original.

---

# 11. Canonical Event Flow

Ejemplo:
LEAD_GENERATED → Identity Resolution → identityId → Journey Engine → Hermes → Intent / Recommendation → Governance → Operational Intent → Execution OS → WhatsApp.

Hermes **no recibe directamente el webhook externo**. Hermes consume el contexto ya normalizado por Pandora's.

---

# 12. Identity Resolution

Cuando entra un evento, Pandora's intentará resolver una identidad existente antes de crear una nueva.
Prioridad: verified external identity → phone → email → wallet → fingerprint → new identity.

---

# 13. Attribution

Media Co puede enviar:
```json
{
  "attribution": {
    "campaignId": "cmp_001",
    "utm_source": "instagram"
  }
}
```
La atribución inicial puede venir de Media Co. La atribución canónica pertenece a Pandora's Platform.

---

# 14. Hermes Boundary

Hermes tiene acceso a: Knowledge, Soul, Memory, ContactContext, ChannelContext, EventContext, JourneyContext, Evidence Layer, Policies.

Hermes **NO tiene responsabilidad directa sobre**: Meta, Media Co, NeonDB, campañas, attribution providers, credenciales externas, ejecución de canales, Governance bypass.

### Regla de oro
> **Hermes puede interpretar, razonar y recomendar; no puede saltarse Governance ni ejecutar infraestructura directamente.**

---

# 15. Journey Engine Boundary

El Journey Engine es responsable de:
Contact State + Intent + Context + Journey Stage + Domain Rules = Next Best Action.

El Journey Engine no debe contener lógica específica de canales (Meta, SignalWire, Telegram). Debe trabajar con capacidades/contextos abstractos.

---

# 16. Governance Boundary

Antes de ejecutar acciones sensibles: Journey/Hermes → Operational Intent → Governance → ExecutionRequest.
Governance determina: quién puede actuar, sobre qué tenant, qué acción está permitida, en qué estado.

---

# 17. Execution OS

Execution OS convierte una intención autorizada en ejecución. Execution OS determina el adapter correspondiente. Hermes no necesita saber "esto es Telegram" para decidir el comportamiento cognitivo.

---

# 18. Channel Adapters

Los adapters son responsables exclusivamente de:
1. External Payload → Normalized Event
2. Execution Request → External Channel

---

# 19. Meta CAPI Adapter

Meta CAPI queda completamente desacoplado de Hermes.
Flujo: PURCHASE_COMPLETED → Event Spine → Meta CAPI Adapter → Meta.
Hermes jamás realizará: Hermes → Meta API.

---

# 20. Conversion Events

Estos eventos son **business events** del Platform Event Spine. Los adapters externos pueden transformarlos posteriormente (ej. PURCHASE_COMPLETED → Meta Purchase).

---

# 21. Data Ownership

Media Co nunca deberá replicar el CRM canónico. Pandora's mantiene la identidad, lead state, conversation, journey, events. La unión se realiza mediante APIs y eventos.

---

# 22. Security

Toda integración debe cumplir: Authentication, Authorization, Tenant Isolation, Secrets management (Platform only), Audit trails, y No Direct DB Access.

---

# 23. Shadow Mode — S'Narai

S'Narai ya opera con integraciones existentes. El nuevo Event Spine procesará paralelamente en "Shadow Mode" sin ejecutar acciones duplicadas para verificar la arquitectura.

---

# 24. Migration / Cutover

Phase 1 (Observe) → Phase 2 (Shadow) → Phase 3 (Compare) → Phase 4 (Certify) → Phase 5 (Partial Cutover) → Phase 6 (Full Cutover) → Phase 7 (Legacy Retirement).

---

# 25. Observability

Cada evento debe poder rastrearse mediante: eventId, identityId, correlationId, causationId, organizationId, projectId.

---

# 26. Error Handling

Los errores se clasifican en: VALIDATION_ERROR, AUTHORIZATION_ERROR, TENANT_SCOPE_ERROR, DUPLICATE_EVENT, IDENTITY_RESOLUTION_ERROR, PROCESSING_ERROR, DELIVERY_ERROR.

---

# 27. Dead Letter / Recovery

Los eventos que no puedan procesarse después de retries entran a la Dead Letter Queue.

---

# 28. Non-Negotiable Architecture Invariants

Estas reglas quedan **FROZEN**:
* INV-001: Pandora's Platform es el System of Record.
* INV-002: Event Spine es el centro de integración.
* INV-003: Media Co nunca accede directamente a la DB.
* INV-004: Hermes no conoce proveedores externos.
* INV-005: Hermes no ejecuta acciones directamente.
* INV-006: Journey Engine permanece separado del Kernel.
* INV-007: Governance no puede ser bypassed.
* INV-008: Execution OS es la única capa de ejecución operacional.
* INV-009: Tenant authority nunca proviene únicamente del payload del cliente.
* INV-010: Todos los eventos son idempotentes.
* INV-011: Cada evento tiene eventId y correlationId.
* INV-012: identityId es canónico y pertenece a Pandora's.
* INV-013: causationId debe utilizarse cuando exista una relación causal.
* INV-014: Meta CAPI es un adapter independiente.
* INV-015: S'Narai no se migra directamente de producción.
* INV-016: Shadow Mode precede cualquier cutover.

---

# 29. End-to-End Example

Media Co envía `LEAD_GENERATED` → Integration Gateway → Event Spine → IdentityService → Journey Engine → Hermes (Intent = HIGH_INTEREST) → Governance → Execution OS → WhatsApp. 
Al final: `PURCHASE_COMPLETED` → Event Spine → Meta CAPI Adapter → Meta. Hermes nunca conoció a Meta.

---

# 30. Implementation Sequence

* Phase 1 — Contract Lock
* Phase 2 — Integration Gateway (`/api/v1/integrations/events`)
* Phase 3 — Event Spine
* Phase 4 — Identity + Attribution
* Phase 5 — Hermes Integration
* Phase 6 — Execution
* Phase 7 — Conversion Feedback
* Phase 8 — S'Narai Shadow Mode
* Phase 9 — Certification
* Phase 10 — Cutover

---

# 31. Definition of Done

La integración **NO** se considera Production Ready hasta que se cumplan todas las reglas inquebrantables detalladas en este documento, incluyendo tenant isolation, idempotency, y trazabilidad de los cuatro IDs.

---

# 🔒 Architecture Lock

A partir de la aceptación de este documento:
> **Este contrato se considera la frontera oficial entre Pandora's Media Co y Pandora's Platform.**

Cualquier modificación posterior deberá ser documentada, versionada y sometida a revisión arquitectónica. No se deberán introducir conexiones directas fuera de este contrato.
