# ADR-016 — Control Plane UI Completion & Production Wiring

**Status:** Accepted
**Date:** 2026-08-09
**Decision Owners:** Pandora's Architecture
**Related ADRs:** ADR-010, ADR-011, ADR-012, ADR-013, ADR-014, ADR-015
**Sprint:** 27

---

## 1. Context

Pandora's Control Plane ha completado la construcción de su infraestructura fundamental:

* Organization-scoped authority.
* Zero Trust tenant isolation.
* `ControlPlaneContext`.
* `TenantScope`.
* Atomic state transitions.
* PostgreSQL persistence.
* Governance audit trail.
* Transactional Outbox.
* At-least-once event delivery.
* Server Actions como transport adapters.
* Composition Root.
* Frontend-to-Application wiring.

Los Sprints 22.6 a 26 establecieron la integridad arquitectónica y el flujo operacional.

Sin embargo, la superficie visual del Control Plane todavía requiere completar su integración de producto.

El sistema debe poder ser operado desde Pandora's Admin por un usuario real sin depender de mocks, blueprints o intervención manual de infraestructura.

La UI existente se encuentra bajo:

```text
/growth-os/organizations/[id]
```

y comprende cuatro superficies principales:

1. Overview
2. Missions
3. Governance
4. Activity

Este ADR establece que Sprint 27 será exclusivamente el sprint de finalización de esta superficie.

---

# 2. Decision

Se establece:

> **Sprint 27 será el sprint de Control Plane UI Completion & Production Wiring.**

Su objetivo es conectar y presentar correctamente en la UI el estado operacional real ya producido por Application, Domain, PostgreSQL y Outbox.

Sprint 27 **NO redefine arquitectura**.

Sprint 27 **NO crea un nuevo dominio**.

Sprint 27 **NO modifica las reglas de autoridad**.

Sprint 27 **NO introduce nuevas tecnologías de infraestructura**.

Sprint 27 únicamente completa:

```text
Production Infrastructure
        ↓
Application Queries / Commands
        ↓
Server Actions
        ↓
Control Plane UI
```

---

# 3. Architectural Boundary

La UI seguirá siendo un consumidor no autoritativo.

La URL:

```text
/growth-os/organizations/[id]
```

identifica el recurso solicitado, pero nunca constituye autoridad.

La autoridad continuará derivándose exclusivamente de:

```text
Authenticated Session
        ↓
ControlPlaneContext
        ↓
TenantScope
```

La UI:

* puede solicitar una organización;
* puede mostrar datos;
* puede solicitar comandos;
* puede mostrar resultados.

La UI:

* NO puede declarar autoridad;
* NO puede proporcionar `actorId` como autoridad;
* NO puede proporcionar un `organizationId` confiable;
* NO puede modificar directamente PostgreSQL;
* NO puede ejecutar comandos de dominio directamente;
* NO puede decidir transiciones de estado.

---

# 4. Product Surface

La superficie oficial del Control Plane será:

```text
Growth OS
└── Organizations
    └── [organizationId]
        ├── Overview
        ├── Missions
        ├── Governance
        └── Activity
```

Estas cuatro vistas constituyen la superficie operacional inicial.

No se creará una quinta vista de infraestructura para Sprint 27.

---

# 5. Overview

## Purpose

Presentar el estado operacional resumido de una organización.

Debe permitir responder:

* ¿Está activo Hermes?
* ¿Cuántas misiones están activas?
* ¿Hay decisiones pendientes?
* ¿Cuál es la misión principal?
* ¿En qué fase se encuentra?
* ¿Existe alguna acción que requiera autoridad humana?

## Data Sources

La vista consumirá exclusivamente:

```text
getOrganizationOverview()
getActiveMissions()
getPendingIntents()
```

No accederá directamente a PostgreSQL.

## Required UX

Debe incluir:

* Organization identity.
* Operational status.
* Active mission summary.
* Pending governance count.
* Current strategic state.
* Pending action alerts.
* Navigation hacia Missions y Governance.

---

# 6. Missions

## Purpose

Mostrar la evolución estratégica de las misiones.

Debe exponer:

* Mission status.
* Current phase.
* Installed Pack.
* Milestones.
* Current strategic decision.
* Decision reason.
* Recommended next action.
* Mission continuity.

La UI debe hacer visible el concepto:

```text
Goal
 ↓
Mission
 ↓
Milestone
 ↓
Strategy Decision
 ↓
Operational Intent
 ↓
Governance
 ↓
Execution
```

La UI no calcula esta cadena.

La UI solamente presenta ViewModels producidos por Application.

---

# 7. Governance

## Purpose

Convertir la autoridad humana en una experiencia operacional clara.

Cada `OperationalIntent` pendiente debe presentar:

### Why

¿Por qué Hermes propone esta acción?

### Authority Required

¿Quién debe autorizarla?

### Consequence

¿Qué ocurrirá si se aprueba?

### Action

```text
Approve
Reject
```

Los botones utilizarán exclusivamente Server Actions.

Flujo obligatorio:

```text
GovernanceButtons
      ↓
Server Action
      ↓
ControlPlaneContext
      ↓
ApproveIntentCommand / RejectIntentCommand
      ↓
ApprovalService
      ↓
PostgresApprovalTransaction
```

Nunca:

```text
UI → Database
UI → Repository
UI → ApprovalService
```

---

# 8. Activity

## Purpose

Presentar el historial operacional y de gobernanza.

La vista debe mostrar eventos relevantes como:

* Strategy Decision created.
* Operational Intent created.
* Intent approved.
* Intent rejected.
* Mission transition.
* Execution queued.
* Execution started.
* Execution completed.
* Relevant failures.

La UI debe presentar el historial como:

> **Append-only operational timeline**

No debe ofrecer edición o eliminación de eventos.

---

# 9. Decision Lineage

Cuando exista información suficiente, Missions y Activity podrán exponer el linaje:

```text
Strategy Decision
       ↓
Operational Intent
       ↓
Approval Decision
       ↓
Governance Event
       ↓
Outbox Event
       ↓
Execution
```

El objetivo es proporcionar AI Observability sin exponer detalles innecesarios de infraestructura.

---

# 10. Outbox Visibility

Sprint 27 NO creará una pantalla administrativa del Outbox.

La infraestructura:

```text
lockedAt
lockedBy
attempts
status
lease
DLQ
```

permanece fuera de la UX principal.

La UI únicamente mostrará consecuencias operacionales relevantes:

```text
Queued
Processing
Completed
Failed
```

cuando dichas señales formen parte del ViewModel correspondiente.

---

# 11. Error Semantics

La UI debe diferenciar errores operacionales relevantes.

Ejemplos:

```text
FORBIDDEN
ALREADY_PROCESSED
INVALID_STATE
NOT_FOUND
TENANT_MISMATCH
```

Estos errores deben transformarse en mensajes semánticos adecuados para el usuario.

Nunca se deberán mostrar:

* SQL errors.
* stack traces.
* Drizzle errors.
* infraestructura interna.
* connection strings.
* detalles de PostgreSQL.

---

# 12. Loading / Empty / Error States

Las cuatro vistas deben tener estados explícitos para:

```text
Loading
Empty
Error
Success
```

Ejemplos:

```text
No active missions.
No pending approvals.
No activity yet.
Unable to load organization data.
```

No se utilizarán mocks para ocultar estados reales.

---

# 13. Cache and Revalidation

Después de una mutación exitosa:

```text
Approve
Reject
```

la Server Action deberá invalidar/revalidar la ruta correspondiente.

La UI no debe asumir el nuevo estado localmente como fuente de verdad.

El flujo será:

```text
Command
 ↓
Database
 ↓
Success
 ↓
revalidatePath
 ↓
Query
 ↓
Fresh UI
```

PostgreSQL continúa siendo la fuente de verdad.

---

# 14. Composition Root

El Frontend no deberá crear repositories.

La composición seguirá centralizada en:

```text
control-plane-composition.ts
```

La UI consume casos de uso.

La Composition Root conecta:

```text
Postgres Repositories
        ↓
Application
        ↓
Server Actions
```

---

# 15. Forbidden Changes

Durante Sprint 27 queda prohibido:

### Domain

Modificar reglas de negocio salvo bug crítico demostrado.

### Repository Contracts

No cambiar contratos congelados.

### Tenant Authority

No introducir una segunda fuente de autorización.

### Database

No rediseñar el modelo de persistencia.

### Outbox

No convertirlo en un Event Bus genérico.

### Infrastructure

No introducir:

* Redis
* Kafka
* RabbitMQ
* nuevos brokers
* nueva infraestructura distribuida

### Hermes Core

No modificar la arquitectura cognitiva.

### Packs

No crear nuevas capacidades de Packs.

### Feature Scope

No introducir features comerciales nuevas.

---

# 16. Launch Principle

El Control Plane se considerará listo cuando:

```text
Real User
   ↓
Pandora's Admin
   ↓
Organization
   ↓
Control Plane
   ↓
Real PostgreSQL State
   ↓
Real Governance Command
   ↓
Real Outbox Event
   ↓
Real Execution Boundary
```

pueda recorrerse sin mocks ni intervención manual.

---

# 17. Consequence

Esta decisión permite separar:

### Architecture Complete

Sprints 22.6–26.

de:

### Product Surface Complete

Sprint 27.

Esto evita seguir modificando la arquitectura cuando el sistema ya posee una frontera técnica estable.

---

# 18. Acceptance Criteria

ADR-016 se considera cumplido cuando:

* [ ] Overview consume datos reales.
* [ ] Missions consume datos reales.
* [ ] Governance consume datos reales.
* [ ] Activity consume datos reales.
* [ ] Approve funciona desde UI.
* [ ] Reject funciona desde UI.
* [ ] Cross-tenant tampering continúa bloqueado.
* [ ] Repeated approval continúa protegido.
* [ ] UI no accede directamente a infraestructura.
* [ ] No existen mocks productivos.
* [ ] Loading states existen.
* [ ] Empty states existen.
* [ ] Error states existen.
* [ ] Mutation revalidation funciona.
* [ ] Decision lineage es visible donde corresponda.
* [ ] El usuario puede operar el Control Plane sin herramientas internas.

---

# 19. Final Principle

> **The Control Plane is not another application. It is the operational surface of Pandora's organizational operating system.**

La UI debe exponer el estado y las decisiones del sistema, pero nunca convertirse en la autoridad del sistema.
