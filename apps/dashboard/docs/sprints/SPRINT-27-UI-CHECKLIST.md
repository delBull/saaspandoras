# Sprint 27 — Checklist exacto de ejecución

### 0. Pre-flight

**Objetivo:** confirmar que partimos del estado correcto de Sprint 26.

```bash
git status
git branch --show-current
git pull
bun install
```

Validar:

```bash
bun run typecheck
bun run build
```

**Gate:** 🟢 ambos deben pasar antes de tocar UI.

---

# 27-A — Composition Root + Application Wiring

### 1. Revisar

```text
src/lib/pandoras/composition/control-plane-composition.ts
```

Debe exponer las dependencias reales:

* `PostgresOperationalIntentRepository`
* `PostgresGovernanceEventRepository`
* `PostgresApprovalTransaction`
* Queries
* Commands
* `ApprovalService`

**No modificar dominio.**

Validar imports:

```bash
grep -R "drizzle-orm\|~/db\|src/db" src/lib/pandoras/core/domains/control-plane/application
```

**Resultado esperado:** cero dependencias de infraestructura.

---

# 27-B — Queries → UI ViewModels

Revisar exactamente:

```text
src/lib/pandoras/core/domains/control-plane/application/queries/
├── get-organization-overview.ts
├── get-active-missions.ts
├── get-pending-intents.ts
└── get-mission-audit-trail.ts
```

### 2. Confirmar contrato

Cada query debe recibir:

```text
ControlPlaneContext
requestedOrganizationId
repositories/dependencies
```

Y producir exclusivamente:

```text
ViewModel
```

No debe regresar:

* Drizzle rows
* entidades internas
* `organizationId` como autoridad
* objetos de infraestructura.

---

# 27-C — Server Actions

### 3. Archivo principal

```text
src/app/growth-os/organizations/[id]/actions.ts
```

Debe quedar como:

```text
URL params
   ↓
requestedOrganizationId
   ↓
ControlPlaneContext
   ↓
Application Query / Command
   ↓
ViewModel / CommandResult
   ↓
UI
```

### 4. Verificar acciones

Debe existir el cableado para:

```text
getOrganizationOverview
getActiveMissions
getPendingIntents
getMissionAuditTrail
approveIntent
rejectIntent
```

Ejecutar:

```bash
grep -n "organizationId" "src/app/growth-os/organizations/[id]/actions.ts"
```

**Permitido:** extracción/mapeo desde `params.id`.

**Prohibido:**

```text
formData.organizationId
body.organizationId
session.organizationId enviado por cliente
```

---

# 27-D — Overview

### 5. Archivo

```text
src/app/growth-os/organizations/[id]/page.tsx
```

Debe consumir:

```text
getOrganizationOverview()
```

y renderizar:

* estado de la organización
* misiones activas
* intents pendientes
* alertas de gobernanza
* actividad reciente

### 6. No duplicar consultas

La página **no debe consultar Neon directamente**.

Buscar:

```bash
grep -n "db\." "src/app/growth-os/organizations/[id]/page.tsx"
```

**Resultado esperado:** cero.

---

# 27-E — Missions

### 7. Revisar

```text
src/app/growth-os/organizations/[id]/missions/page.tsx
```

Cablear:

```text
getActiveMissions()
```

Cada misión debería mostrar como mínimo:

```text
Mission
Status
Current Phase
Pack
Progress / Milestones
Last strategic activity
```

Si ya existe el componente visual, **reutilizarlo**.

No crear un nuevo sistema de Mission Engine.

---

# 27-F — Governance

Esta es la vista crítica.

### 8. Página

```text
src/app/growth-os/organizations/[id]/governance/page.tsx
```

Debe consumir:

```text
getPendingIntents()
```

### 9. Componente

```text
src/app/growth-os/organizations/[id]/governance/components/GovernanceButtons.tsx
```

Debe ejecutar:

```text
approveIntent()
rejectIntent()
```

y manejar:

```text
SUCCESS
FORBIDDEN
ALREADY_PROCESSED
INVALID_STATE
NOT_FOUND
TENANT_MISMATCH
```

### 10. Flujo final

```text
[Approve]
    ↓
Server Action
    ↓
ControlPlaneContext
    ↓
ApproveIntentCommand
    ↓
ApprovalService
    ↓
PostgresApprovalTransaction
    ↓
┌─────────────────────────────┐
│ operational_intents         │
│ governance_events           │
│ outbox_events               │
└─────────────────────────────┘
    ↓
CommandResult
    ↓
revalidatePath()
    ↓
Governance UI actualizada
```

**Aquí NO meter polling, Redis, WebSockets ni lógica de negocio en React.**

---

# 27-G — Activity / Audit

### 11. Archivo

```text
src/app/growth-os/organizations/[id]/activity/page.tsx
```

Cablear:

```text
getMissionAuditTrail()
```

La UI debe representar el historial como:

```text
Timeline
   │
   ├── Strategy Decision
   ├── Operational Intent Created
   ├── Approval / Rejection
   ├── Execution Request
   └── Mission Event
```

Y dejar claro:

> **qué ocurrió, quién lo autorizó y por qué.**

No modificar el audit trail desde UI.

---

# 27-H — Navegación del Control Plane

### 12. Revisar estructura

```text
src/app/growth-os/organizations/[id]/
```

Debe quedar conceptualmente:

```text
[id]/
├── page.tsx                 → Overview
├── missions/
│   └── page.tsx             → Mission Control
├── governance/
│   ├── page.tsx             → Governance Center
│   └── components/
│       └── GovernanceButtons.tsx
├── activity/
│   └── page.tsx             → Audit Trail
└── actions.ts               → Transport Boundary
```

### 13. Navegación

Agregar/revisar links entre:

```text
Overview
Missions
Governance
Activity
```

**Todos deben conservar `[id]`.**

Ejemplo conceptual:

```text
/growth-os/organizations/org_snarai_sprint22
/growth-os/organizations/org_snarai_sprint22/missions
/growth-os/organizations/org_snarai_sprint22/governance
/growth-os/organizations/org_snarai_sprint22/activity
```

---

# 27-I — Estados de UI

Agregar/revisar estados:

### Loading

```text
loading.tsx
```

### Empty

Ejemplos:

```text
No active missions
No pending approvals
No activity yet
```

### Error

```text
error.tsx
```

Pero **no revelar**:

* SQL
* stack traces
* Neon errors
* infraestructura
* detalles internos.

---

# 27-J — Governance UX

La tarjeta de cada `OperationalIntent` debería hacer visible:

```text
WHY
────────────────
Por qué Hermes propone esto.

AUTHORITY REQUIRED
────────────────
Qué autoridad necesita.

CONSEQUENCE
────────────────
Qué ocurrirá si se aprueba.

BUDGET / CONSTRAINTS
────────────────
Restricciones relevantes.

[ REJECT ]   [ APPROVE ]
```

Esto es importante porque convierte Governance en un **panel de autoridad**, no en un CRUD.

---

# 27-K — Outbox: visibilidad correcta

Aquí hay una distinción importante.

**NO vamos a mostrar `outbox_events` directamente en la UI.**

El Outbox es infraestructura.

La UI muestra:

```text
Governance Event
        ↓
Execution lifecycle
        ↓
Activity / Audit
```

No:

```text
outbox_events
locked_at
locked_by
attempts
```

Esos datos pertenecen a observabilidad operacional futura, no al usuario normal del Control Plane.

---

# 27-L — End-to-End UI Test

Ahora sí: probar desde navegador.

### Test 1 — Overview

Entrar:

```text
/growth-os/organizations/org_snarai_sprint22
```

Confirmar:

* carga real
* datos reales
* no mocks
* organización correcta.

---

### Test 2 — Missions

```text
/growth-os/organizations/org_snarai_sprint22/missions
```

Confirmar:

* missions provenientes de DB
* fases correctas
* estados correctos.

---

### Test 3 — Governance

Crear/preparar un intent:

```text
pending_approval
```

Entrar a:

```text
/growth-os/organizations/org_snarai_sprint22/governance
```

Click:

```text
APPROVE
```

Esperar:

```text
pending_approval
        ↓
approved
```

Y confirmar que desaparece de pendientes después de `revalidatePath()`.

---

### Test 4 — Audit

Entrar:

```text
/growth-os/organizations/org_snarai_sprint22/activity
```

Confirmar que aparece el evento generado.

---

### Test 5 — Outbox

En DB:

```sql
SELECT *
FROM outbox_events
ORDER BY created_at DESC
LIMIT 10;
```

Confirmar:

```text
pending → processed
```

después de ejecutar el Cron/processor.

---

# 27-M — Cross-Tenant UI Attack

Este test es **obligatorio**.

Con una sesión autorizada para:

```text
org_A
```

intentar:

```text
/growth-os/organizations/org_B
```

Debe terminar en:

```text
FORBIDDEN
```

No simplemente:

```text
"No data"
```

La autoridad debe fallar en:

```text
ControlPlaneContext
```

---

# 27-N — Double Approval

Con el mismo intent:

```text
pending_approval
```

hacer dos aprobaciones consecutivas.

Primera:

```text
SUCCESS
```

Segunda:

```text
ALREADY_PROCESSED
```

Nunca:

```text
500 Internal Server Error
```

---

# 27-O — Validación final

Ejecutar en este orden:

```bash
bun run typecheck
```

```bash
bun run lint
```

```bash
bun run build
```

Después:

```bash
git diff --check
```

Y:

```bash
git status
```

Finalmente buscar fugas:

```bash
grep -R "db\." src/app/growth-os
```

Debe devolver **cero resultados**.

Después:

```bash
grep -R "organizationId" src/app/growth-os
```

Debe devolver únicamente usos legítimos como:

```text
params.id
requestedOrganizationId
```

---

# 27-P — Launch Gate

El Sprint 27 solamente se declara **DONE** si:

| Gate                | Resultado requerido |
| ------------------- | ------------------- |
| Overview → DB       | 🟢                  |
| Missions → DB       | 🟢                  |
| Governance → DB     | 🟢                  |
| Activity → DB       | 🟢                  |
| Approve E2E         | 🟢                  |
| Reject E2E          | 🟢                  |
| Audit trail         | 🟢                  |
| Outbox generated    | 🟢                  |
| Outbox processed    | 🟢                  |
| Cross-tenant attack | 🔴 rechazado        |
| Double approval     | 🔴 rechazado        |
| `typecheck`         | 🟢                  |
| `lint`              | 🟢*                 |
| `build`             | 🟢                  |
| No DB in UI         | 🟢                  |
| No client authority | 🟢                  |

* Los errores de deuda técnica previamente documentados fuera de Control Plane pueden permanecer, pero **ningún error nuevo del Sprint 27** es aceptable.
