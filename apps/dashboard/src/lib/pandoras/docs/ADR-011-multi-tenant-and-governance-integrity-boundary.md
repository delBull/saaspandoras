# ADR-011: Multi-Tenant & Governance Integrity Boundary

**Status:** Accepted
**Date:** 2026-08-07
**Decision Owners:** Pandora's Architecture
**Related:** ADR-010 — Organization Control Plane Boundary
**Sprint:** 22.6 — Multi-Tenant & Governance Integrity Lock

---

# Context

Pandora's OS ha evolucionado desde un agente reactivo hacia un **Organizational Operating System** donde Hermes propone estrategia, Governance determina autoridad y el Execution OS ejecuta operaciones.

La arquitectura actual establece la siguiente cadena:

```text
Hermes
  │
  ▼
StrategyDecision
  │
  ▼
OperationalIntent
  │
  ▼
Governance
  │
  ▼
ExecutionRequest
  │
  ▼
Execution OS
```

El Sprint 22 introdujo el **Organization Control Plane** dentro del Admin existente de Pandora's, manteniendo la interfaz como una superficie:

> **Read-Heavy, Command-Light**

El Sprint 22.5 añadió `ControlPlaneContext`, permisos explícitos, comandos de aprobación/rechazo y protección Zero Trust para impedir que el frontend determine directamente la identidad del actor.

También se verificó que:

* React consume exclusivamente ViewModels.
* La Application Layer no depende directamente de Infrastructure.
* Las Server Actions funcionan como Composition Root.
* Los comandos delegan la mutación al Governance Domain.
* El Control Plane forma parte de Pandora's Admin y no constituye una aplicación separada.
* Governance expone explícitamente `Why`, `Authority Required` y `Consequence (If Approved)`.

Sin embargo, antes de conectar los repositorios reales de PostgreSQL/NeonDB existen cuatro invariantes que deben quedar formalmente congeladas.

## 1. Tenant isolation

El `organizationId` no puede derivarse únicamente de:

* parámetros de URL;
* payloads enviados por React;
* IDs enviados por el cliente;
* valores proporcionados por el actor.

La organización efectiva debe provenir del contexto autorizado de la sesión.

## 2. Authorization scope

Tener un permiso como:

```text
approve_intent
```

no significa:

> "el actor puede aprobar cualquier Intent".

Significa:

> "el actor puede aprobar Intents dentro del ámbito organizacional que su sesión tiene autorizado".

## 3. Governance state integrity

Una aprobación o rechazo no puede depender de una secuencia vulnerable a condiciones de carrera.

Una intención que ya fue:

```text
APPROVED
REJECTED
CANCELLED
EXECUTING
```

no puede volver a `PENDING_APPROVAL` ni ser aprobada nuevamente mediante una segunda solicitud concurrente.

## 4. Audit integrity

La trazabilidad de Pandora's debe permitir reconstruir:

```text
Strategic Decision
       ↓
Operational Intent
       ↓
Governance Decision
       ↓
Execution Request
```

El historial de gobernanza debe ser append-only y no depender de que la UI conserve información histórica.

---

# Decision

Adoptamos formalmente cuatro invariantes arquitectónicos.

---

## Invariant 1 — Session-Derived Organization Scope

El `organizationId` utilizado por cualquier operación del Control Plane deberá derivarse del `ControlPlaneContext` autorizado.

La URL puede identificar el recurso solicitado, pero **nunca establece autoridad**.

La frontera conceptual será:

```text
Route Parameter
      │
      ▼
Requested Organization
      │
      ▼
Authenticated Session
      │
      ▼
Authorization Check
      │
      ▼
ControlPlaneContext
      │
      ▼
Application Layer
```

Nunca:

```text
URL
 ↓
organizationId
 ↓
Repository
```

### Regla

> **The route identifies the requested resource; the authenticated session determines whether the actor may access it.**

---

# Invariant 2 — Tenant-Scoped Authorization

Toda operación de lectura o escritura deberá ejecutarse dentro del ámbito autorizado del `ControlPlaneContext`.

El contexto deberá representar como mínimo:

```typescript
interface ControlPlaneContext {
  actorId: string;
  organizationId: string;
  permissions: string[];
  role: string;
  sessionId: string;
}
```

La implementación podrá evolucionar posteriormente hacia scopes más sofisticados, pero la autoridad organizacional debe formar parte explícita del contexto.

## Command invariant

Un comando como:

```typescript
ApproveIntentCommand.execute(...)
```

deberá verificar:

```text
permission
+
organization scope
+
resource ownership
+
valid state
```

antes de delegar al Governance Domain.

Conceptualmente:

```text
Actor
 │
 ├── has permission?
 │       └── NO → FORBIDDEN
 │
 ├── Intent belongs to actor's organization?
 │       └── NO → FORBIDDEN
 │
 ├── Intent is pending approval?
 │       └── NO → INVALID STATE
 │
 └── YES
       ↓
ApprovalService
```

---

# Invariant 3 — Atomic & Idempotent Governance Transitions

Las transiciones de Governance deberán estar protegidas contra concurrencia y solicitudes repetidas.

La transición válida será:

```text
PENDING_APPROVAL
        │
        ├── APPROVE ──► APPROVED
        │
        └── REJECT ───► REJECTED
```

Posteriormente podrá existir:

```text
REJECTED → CANCELLED
```

pero nunca:

```text
APPROVED → PENDING_APPROVAL
APPROVED → REJECTED
REJECTED → APPROVED
CANCELLED → APPROVED
EXECUTING → APPROVED
```

La operación deberá ser **state-guarded**.

Conceptualmente:

```sql
UPDATE operational_intents
SET status = 'approved'
WHERE id = ?
  AND organization_id = ?
  AND status = 'pending_approval';
```

Si ninguna fila es afectada, la operación no debe asumir éxito.

Deberá producir un resultado equivalente a:

```text
INVALID_STATE_TRANSITION
```

o:

```text
ALREADY_PROCESSED
```

según corresponda.

### Idempotency

Una segunda solicitud de aprobación sobre un Intent ya aprobado no debe producir:

* una segunda aprobación;
* un segundo Governance Event;
* un segundo ExecutionRequest;
* una segunda ejecución.

---

# Invariant 4 — Append-Only Governance Audit

Los eventos de Governance deberán considerarse registros históricos inmutables.

El sistema no deberá modificar ni eliminar eventos existentes para representar una nueva situación.

En lugar de:

```text
PENDING
↓
UPDATE
↓
APPROVED
```

el historial deberá representar:

```text
OPERATIONAL_INTENT_CREATED
        ↓
APPROVAL_REQUESTED
        ↓
APPROVED
```

La implementación inicial podrá utilizar PostgreSQL convencional, pero el contrato conceptual será:

```text
INSERT ONLY
NO UPDATE
NO DELETE
```

Cada evento deberá poder asociarse al contexto organizacional y causal de la operación.

Como mínimo se recomienda contemplar:

```text
eventId
organizationId
actorId / actorType
eventType
aggregateType
aggregateId
occurredAt
payload
```

Y dejar preparados:

```text
correlationId
causationId
```

para reconstrucción causal futura.

---

# Composition Root Boundary

Se formaliza una excepción controlada respecto a la separación Application/Infrastructure.

Las Server Actions pueden actuar como **Composition Root** y construir adapters concretos:

```text
Server Action
     │
     ├── Authentication
     ├── ControlPlaneContext
     └── Dependency Injection
              │
              ▼
        Application Command
              │
              ▼
            Port
              │
              ▼
       Infrastructure
```

La regla es:

> **Infrastructure may be composed at the application boundary, but Application Services must never depend on Infrastructure implementations.**

Por lo tanto, una referencia temporal como:

```typescript
new MemoryOperationalIntentRepository()
```

es aceptable en el Composition Root durante los Blueprints.

No es aceptable dentro de:

```text
core/
application/
domain/
```

---

# Read Security

La misma protección aplicada a los comandos deberá existir en las consultas.

No será suficiente proteger:

```text
approveIntent(intentId)
```

si posteriormente un actor puede consultar:

```text
getPendingIntents(otherOrganizationId)
```

Por lo tanto:

```text
getOrganizationOverview
getActiveMissions
getPendingIntents
getMissionAuditTrail
```

deberán ejecutarse con contexto autorizado.

El patrón será:

```text
Query
  +
ControlPlaneContext
  +
Resource Scope
       ↓
Authorized ViewModel
```

Nunca:

```text
Query(orgIdFromURL)
       ↓
Repository
```

---

# Consequence

Esta decisión consolida el Control Plane como una **frontera de autoridad**, no solamente como una interfaz gráfica.

El modelo resultante queda:

```text
                     PANDORA'S ADMIN
                           │
                           ▼
                  ORGANIZATION CONTROL
                        PLANE
                           │
              ┌────────────┴────────────┐
              │                         │
           Queries                   Commands
              │                         │
              ▼                         ▼
         ViewModels             ControlPlaneContext
                                      │
                              Authorization Scope
                                      │
                                      ▼
                              Governance Domain
                                      │
                              OperationalIntent
                                      │
                              Governance Events
                                      │
                                      ▼
                              ExecutionRequest
                                      │
                                      ▼
                                Execution OS
```

Hermes permanece fuera de la autoridad humana:

```text
Hermes
   │
   ▼
StrategyDecision
   │
   ▼
OperationalIntent
   │
   ▼
Governance
   │
   ├── approve
   ├── reject
   └── cancel
   │
   ▼
Execution OS
```

La regla fundamental permanece:

> **Hermes proposes. Governance disposes. Operations execute.**

---

# Non-Goals

Este ADR **NO** introduce todavía:

* Kafka.
* Redis como Event Bus distribuido.
* WebSockets.
* Event Sourcing completo.
* CQRS completo.
* Microservicios.
* Un frontend independiente para Hermes.
* Nuevas capacidades estratégicas.
* Nuevos Packs.
* Automatización adicional del Execution OS.

El objetivo es congelar las invariantes antes de persistirlas en infraestructura real.

---

# Future Compatibility

La arquitectura deberá permitir posteriormente:

```text
ControlPlaneContext
        ↓
Tenant Scope
        ↓
PostgreSQL / NeonDB
        ↓
Transactional Outbox
        ↓
Distributed Event Bus
        ↓
Execution OS
```

sin modificar las reglas fundamentales de autoridad.

---

# Acceptance Criteria

ADR-011 se considera implementado cuando:

* [ ] Ninguna operación del Control Plane utiliza `organizationId` proporcionado directamente por React como fuente de autoridad.
* [ ] `ControlPlaneContext` contiene el ámbito organizacional autorizado.
* [ ] Las queries están tenant-scoped.
* [ ] `ApproveIntentCommand` valida permiso + organización + estado.
* [ ] `RejectIntentCommand` valida permiso + organización + estado.
* [ ] Una intención de otra organización no puede aprobarse manipulando su ID.
* [ ] Una intención de otra organización no puede rechazarse manipulando su ID.
* [ ] Una aprobación concurrente no puede generar dos transiciones válidas.
* [ ] Una aprobación repetida no genera un segundo `ExecutionRequest`.
* [ ] Los Governance Events son append-only.
* [ ] La Application Layer continúa sin depender de Infrastructure.
* [ ] Las Server Actions permanecen como Composition Root.
* [ ] El Blueprint demuestra aislamiento multi-tenant.
* [ ] El Blueprint demuestra una transición concurrente/repetida segura.
* [ ] El Blueprint demuestra el audit trail inmutable.

---

# Final Principle

> **Authority is derived from authenticated context, not client intent.**

Pandora's no confía en el actor porque diga quién es.

Pandora's no confía en la URL porque indique una organización.

Pandora's no confía en el frontend porque solicite una transición.

La autoridad se deriva del contexto autenticado, se verifica dentro de la Application Layer y se materializa mediante el Governance Domain.
