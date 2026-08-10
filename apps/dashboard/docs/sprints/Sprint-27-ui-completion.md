# Sprint 27 — Control Plane UI Completion & Production Wiring

**Status:** Ready for Implementation
**Related ADR:** ADR-016
**Scope:** UI / Application Integration
**Objective:** Production-ready Control Plane experience

---

# 1. Objective

Completar el cableado de las cuatro superficies existentes del Control Plane:

```text
Overview
Missions
Governance
Activity
```

consumiendo exclusivamente los datos y comandos reales establecidos en Sprints 22.6–26.

---

# 2. Scope

## IN SCOPE

* UI data wiring.
* ViewModel presentation.
* Server Action integration.
* Loading states.
* Empty states.
* Error states.
* Governance mutations.
* Cache revalidation.
* Decision lineage presentation.
* Activity timeline.
* Navigation.
* Production UX polish.
* Removal of remaining production mocks.

## OUT OF SCOPE

* Domain redesign.
* New repositories.
* New database architecture.
* New authorization model.
* New event bus.
* Redis.
* Kafka.
* New Packs.
* New business capabilities.
* Billing.
* Analytics platform.
* Mobile application.

---

# 3. Phase 27-A — UI Inventory

Auditar:

```text
src/app/growth-os/organizations/[id]/
```

Identificar:

* mock data;
* placeholder data;
* hardcoded organization identifiers;
* hardcoded mission state;
* hardcoded governance state;
* direct DB imports;
* obsolete Server Action calls.

Acceptance:

```text
Production UI contains no hardcoded tenant state.
```

---

# 4. Phase 27-B — Overview Wiring

Primary files:

```text
src/app/growth-os/organizations/[id]/page.tsx
```

y componentes descendientes de Overview.

Conectar:

```text
getOrganizationOverview
getActiveMissions
getPendingIntents
```

Verificar:

* organization derived exclusively from route;
* authorization derived from session;
* real PostgreSQL data;
* no mock fallback.

---

# 5. Phase 27-C — Missions Wiring

Conectar:

```text
getActiveMissions
getMissionAuditTrail
```

Mostrar:

* active missions;
* current phase;
* status;
* milestones;
* strategic decisions;
* reasoning;
* recommended action.

Implementar Decision Lineage cuando el ViewModel ya disponga de la información.

No reconstruir decisiones desde la UI.

---

# 6. Phase 27-D — Governance Wiring

Primary files:

```text
governance/page.tsx
governance/components/GovernanceButtons.tsx
../actions.ts
```

Flujo:

```text
Approve
 ↓
Server Action
 ↓
ApproveIntentCommand
 ↓
ApprovalService
 ↓
PostgresApprovalTransaction
```

y:

```text
Reject
 ↓
Server Action
 ↓
RejectIntentCommand
 ↓
ApprovalService
 ↓
PostgresApprovalTransaction
```

Después de éxito:

```text
revalidatePath()
```

---

# 7. Phase 27-E — Governance UX

Cada pending intent deberá mostrar:

```text
WHY
AUTHORITY REQUIRED
CONSEQUENCE
STATUS
AVAILABLE ACTIONS
```

Estados:

```text
pending
approved
rejected
already processed
forbidden
invalid state
```

Los botones deben deshabilitarse durante ejecución para evitar UX de doble-submit.

La protección real seguirá estando en PostgreSQL/domain.

La UI solamente mejora la experiencia.

---

# 8. Phase 27-F — Activity Wiring

Conectar:

```text
getMissionAuditTrail
```

y las fuentes de auditoría disponibles.

Construir una timeline operacional.

Orden:

```text
newest → oldest
```

Cada evento deberá presentar cuando esté disponible:

* timestamp;
* event type;
* actor;
* mission;
* intent;
* reason;
* outcome.

No permitir edición.

---

# 9. Phase 27-G — State UX

Todas las vistas deberán soportar:

```text
Loading
Empty
Error
Success
```

No utilizar:

```text
"Loading..."
```

como único mecanismo cuando exista una UX mejor.

---

# 10. Phase 27-H — Error Boundary

Errores de infraestructura deberán ser absorbidos por Application/Server Action.

El Frontend recibe únicamente errores semánticos.

Ejemplo:

```typescript
{
  success: false,
  error: {
    code: "ALREADY_PROCESSED",
    message: "This approval has already been processed."
  }
}
```

Nunca exponer:

```text
PostgresError
DrizzleError
SQLSTATE
stack trace
```

---

# 11. Phase 27-I — Navigation

Validar navegación completa:

```text
Organizations
      ↓
Organization
      ↓
Overview
      ├── Missions
      ├── Governance
      └── Activity
```

Cada vista deberá conservar:

```text
organizationId
```

exclusivamente como identificador solicitado por la ruta.

Nunca como autoridad.

---

# 12. Phase 27-J — Production Data Validation

Crear una organización de staging con:

* al menos una misión;
* al menos un milestone;
* al menos una Strategy Decision;
* al menos un Operational Intent;
* al menos un pending approval.

Validar que las cuatro vistas muestran exactamente el estado real de PostgreSQL.

---

# 13. Phase 27-K — Real Governance E2E

Ejecutar:

```text
UI
 ↓
Approve
 ↓
Server Action
 ↓
Command
 ↓
Transaction
 ↓
PostgreSQL
 ↓
Governance Event
 ↓
Outbox
 ↓
Cron
 ↓
Consumer
```

Verificar visualmente que el estado cambia.

---

# 14. Phase 27-L — Security Regression

Ejecutar nuevamente:

### Cross Tenant

```text
Actor A
 ↓
Org B URL
 ↓
FORBIDDEN
```

### Double Approval

```text
Approve
 ↓
SUCCESS

Approve again
 ↓
ALREADY_PROCESSED
```

### URL Tampering

Modificar manualmente:

```text
/organizations/org_A
```

a:

```text
/organizations/org_B
```

y confirmar rechazo cuando la sesión no tenga acceso.

---

# 15. Phase 27-M — Production Build

Ejecutar:

```bash
bun run typecheck
bun run lint
bun run build
```

Los errores fuera del scope del Control Plane deberán estar documentados.

No se permite introducir nuevos errores dentro de:

```text
src/app/growth-os
src/lib/pandoras/core/domains/control-plane
src/lib/pandoras/composition
src/lib/outbox
```

---

# 16. Phase 27-N — Final E2E

Checklist:

```text
[ ] Login
[ ] Organization selection
[ ] Overview
[ ] Missions
[ ] Mission details
[ ] Governance
[ ] Approve
[ ] Reject
[ ] Activity
[ ] Revalidation
[ ] Outbox creation
[ ] Outbox processing
[ ] Execution consumer
[ ] Cross-tenant rejection
[ ] Double-submit rejection
[ ] Error UX
[ ] Empty UX
[ ] Loading UX
```

---

# 17. Definition of Done

Sprint 27 está terminado cuando un usuario real puede:

1. Entrar a Pandora's Admin.
2. Seleccionar una organización.
3. Ver su estado operacional real.
4. Ver sus misiones.
5. Entender por qué Hermes propone una acción.
6. Ver una intención pendiente.
7. Aprobarla o rechazarla.
8. Ver el resultado reflejado en Governance.
9. Ver el evento en Activity.
10. Ver que la ejecución fue encolada/procesada.

Todo esto sin:

* mocks;
* intervención manual;
* acceso directo a DB;
* herramientas de desarrollo;
* blueprints.

---

# 18. Launch Boundary

Al terminar Sprint 27:

```text
                 PANDORA'S
                     │
              ┌──────┴──────┐
              │             │
          ADMIN          GROWTH OS
                            │
                     CONTROL PLANE
                            │
          ┌─────────┬───────┼─────────┐
          │         │       │         │
       Overview Missions Governance Activity
          │         │       │         │
          └─────────┴───────┼─────────┘
                            │
                       APPLICATION
                            │
                          DOMAIN
                            │
                       POSTGRESQL
                            │
                         OUTBOX
                            │
                      EXECUTION OS
```

Este es el **primer producto operacional completo** que debe llegar a lanzamiento.

---

# 19. Final Rule

> **If a task does not make Overview, Missions, Governance, or Activity production-operable, it does not belong to Sprint 27.**

Cualquier feature adicional deberá convertirse en una nueva propuesta y no incorporarse informalmente durante el sprint.
