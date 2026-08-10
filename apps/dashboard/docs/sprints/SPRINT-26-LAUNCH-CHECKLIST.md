# 🚀 SPRINT 26 — LAUNCH GATE

## Checklist operativo de ejecución

### Regla del sprint

**No agregar features. No refactorizar arquitectura. No introducir Redis/Kafka.**

Sprint 26 únicamente responde:

> **¿Pandora's Control Plane puede operar una organización real, desde Frontend → Server Action → Domain → PostgreSQL → Outbox → Consumer, de forma segura y observable?**

---

# 0. PRE-FLIGHT

### 0.1 Confirmar branch

```bash
git status
git branch --show-current
```

Debe existir una branch específica del sprint, por ejemplo:

```text
feature/sprint-26-launch-gate
```

Si estás trabajando directamente sobre la branch objetivo, **no crear otra innecesariamente**.

---

### 0.2 Confirmar build limpio

```bash
bun install
bun run build
```

**PASS si:**

* TypeScript compila.
* Next.js compila.
* No aparecen imports rotos.
* No aparecen errores de Server Components / Server Actions.

---

### 0.3 Confirmar lint

```bash
bun run lint
```

**PASS = 0 errores.**

Warnings aceptables solamente si ya están documentados.

---

# 1. DATABASE — NEONDB

## Archivo

```text
src/db/schema.ts
```

### Verificar

Debe existir:

```text
operational_intents
operational_intent_governance_events
outbox_events
```

Y `operational_intents` debe tener:

```text
organization_id
status
```

con índice:

```text
(organization_id, status)
```

---

### Outbox

Confirmar:

```text
outbox_events
├── id
├── aggregate_type
├── aggregate_id
├── event_type
├── payload
├── status
├── attempts
├── locked_at
├── locked_by
├── created_at
├── processed_at
└── last_error
```

Los nombres exactos deben coincidir con ADR-014/015.

---

### Ejecutar migraciones

Usar **el mecanismo oficial ya definido por el repositorio**.

Por ejemplo:

```bash
bun run db:migrate
```

Si el proyecto usa Drizzle Kit directamente:

```bash
npx drizzle-kit migrate
```

**No ejecutar SQL manual contra producción durante este gate**, salvo que el procedimiento de migración del proyecto explícitamente lo requiera.

---

# 2. DOMAIN CONTRACTS

Revisar:

```text
src/lib/pandoras/core/domains/control-plane/
```

Especialmente:

```text
application/
commands/
queries/
domain/
```

### Confirmar

`ApproveIntentCommand`:

```text
requestedOrganizationId
TenantScope
idempotencyKey
```

`RejectIntentCommand`:

```text
requestedOrganizationId
TenantScope
idempotencyKey
```

Y que ningún Command permita:

```text
organizationId
```

como autoridad proporcionada directamente por el frontend.

---

# 3. CONTROL PLANE CONTEXT

## Archivo

```text
src/lib/pandoras/core/domains/control-plane/application/context.ts
```

Confirmar existencia de:

```text
ControlPlaneContext
TenantScope
requireOrganizationScope()
assertOrganizationAccess()
```

### Regla crítica

La autoridad debe seguir siendo:

```text
SESSION
   ↓
ControlPlaneContext
   ↓
TenantScope
   ↓
Repository
```

Nunca:

```text
URL
 ↓
organizationId
 ↓
Repository
```

La URL solamente identifica el recurso solicitado.

---

# 4. REPOSITORIES

Revisar:

```text
src/lib/pandoras/ports/repositories/
```

Y:

```text
src/lib/pandoras/infrastructure/repositories/
```

### OperationalIntentRepository

Confirmar:

```text
findById(id, scope)
findPending(scope)
transitionStatus(...)
```

Debe existir la semántica:

```text
expectedStatus
        ↓
atomic UPDATE
        ↓
nextStatus
```

Nunca:

```text
find()
 ↓
if status
 ↓
update()
```

---

# 5. POSTGRES APPROVAL TRANSACTION

Revisar:

```text
PostgresApprovalTransaction
```

Debe ejecutarse dentro de:

```text
db.transaction()
```

Y contener la operación:

```text
1. transition intent
2. append governance event
3. insert outbox event
```

Todo dentro de **una sola transacción**.

---

## Prueba de rollback

Ejecutar el blueprint correspondiente:

```bash
npx tsx scripts/blueprint-v23-postgres-persistence.ts
```

Debe demostrar:

```text
transaction succeeds
→ intent updated
→ governance event inserted
→ outbox inserted
```

y:

```text
transaction fails
→ intent unchanged
→ no governance event
→ no outbox event
```

---

# 6. CONTROL PLANE COMPOSITION ROOT

## Archivo

```text
src/lib/pandoras/composition/control-plane-composition.ts
```

Confirmar:

```text
PostgresOperationalIntentRepository
PostgresGovernanceEventRepository
PostgresApprovalTransaction
ApprovalService
```

se instancian aquí.

La Application Layer **no debe importar Drizzle**.

Buscar:

```bash
grep -R "drizzle-orm" src/lib/pandoras/core
```

### PASS

No debe haber dependencia de infraestructura desde Core/Application.

---

# 7. SERVER ACTIONS

## Archivo

```text
src/app/growth-os/organizations/[id]/actions.ts
```

Validar:

```text
requestedOrganizationId = params.id
```

Luego:

```text
ControlPlaneContext
        ↓
requireOrganizationScope()
        ↓
Command / Query
```

Y finalmente:

```text
CommandResult
```

---

### Buscar fugas

```bash
grep -R "organizationId" src/app/growth-os
```

La aparición esperada debe limitarse a datos derivados/controlados.

**STOP si encuentras:**

```text
organizationId: userInput
organizationId: formData
organizationId: body
organizationId: queryParam
```

---

# 8. FRONTEND

Revisar:

```text
src/app/growth-os/organizations/[id]/
```

Especialmente:

```text
page.tsx
overview/
missions/
governance/
activity/
```

Y:

```text
governance/components/GovernanceButtons.tsx
```

---

## Verificar que la UI:

### Reads

Consume:

```text
Server Action
 ↓
Query
 ↓
Postgres Repository
 ↓
NeonDB
```

### Mutations

Consume:

```text
Button
 ↓
Server Action
 ↓
Command
 ↓
ApprovalService
 ↓
PostgresApprovalTransaction
```

---

# 9. OUTBOX

## Archivos esperados

```text
src/lib/pandoras/infrastructure/outbox/outbox-processor.ts
```

```text
src/lib/pandoras/infrastructure/outbox/outbox-registry.ts
```

```text
scripts/worker.ts
```

Y el consumer definido por Sprint 25/ADR-014.

---

# 10. OUTBOX PROCESSOR

Confirmar semántica:

```text
pending
   ↓
processing
   ↓
processed
```

En error:

```text
processing
   ↓
pending
```

hasta:

```text
MAX_RETRIES
   ↓
failed
```

---

## Leasing

Debe existir:

```text
locked_at
locked_by
```

Y recuperación de leases vencidos.

La consulta debe utilizar el equivalente a:

```sql
FOR UPDATE SKIP LOCKED
```

para evitar que dos workers procesen simultáneamente el mismo lote.

---

# 11. IDEMPOTENT CONSUMER

El consumer **no puede asumir exactly-once delivery**.

Debe asumir:

```text
EVENT
 ↓
CONSUME
 ↓
CRASH
 ↓
EVENT AGAIN
 ↓
SAFE
```

Por tanto:

```text
same event
same aggregate
same execution
```

no debe producir dos ejecuciones.

---

# 12. REGISTRY

## Archivo

```text
src/lib/pandoras/infrastructure/outbox/outbox-registry.ts
```

Confirmar que cada `eventType` tiene un handler explícito.

Ejemplo conceptual:

```text
OPERATIONAL_INTENT_APPROVED
        ↓
Execution Consumer
```

Si llega un `eventType` desconocido:

**NO ejecutar silenciosamente.**

Debe quedar registrado como error controlado.

---

# 13. WORKER

## Archivo

```text
scripts/worker.ts
```

Probar:

```bash
bun run worker:outbox
```

o el comando equivalente definido en `package.json`.

Debe poder:

```text
START
 ↓
POLL
 ↓
CLAIM
 ↓
PROCESS
 ↓
MARK PROCESSED
 ↓
POLL AGAIN
```

---

# 14. OUTBOX HAPPY PATH

Insertar un evento controlado de prueba o utilizar el flujo real.

Después:

```bash
bun run worker:outbox
```

Verificar en DB:

```text
status = processed
processed_at != null
```

---

# 15. OUTBOX FAILURE PATH

Forzar deliberadamente un consumer failure.

Verificar:

```text
attempts + 1
```

y posteriormente:

```text
pending
```

o:

```text
failed
```

según el límite configurado.

---

# 16. DEAD-LETTER TEST

Verificar:

```text
attempts >= MAX_RETRIES
```

produce:

```text
status = failed
```

Y que el worker **no entra en loop infinito**.

---

# 17. LEASE RECOVERY TEST

Crear un evento:

```text
status = processing
locked_at = expired
```

Ejecutar worker.

Debe recuperar:

```text
processing
       ↓
pending
       ↓
processing
       ↓
processed
```

---

# 18. CRITICAL MULTI-TENANT TEST

Ejecutar nuevamente:

```bash
npx tsx scripts/blueprint-v22.6-integrity-lock.ts
```

Debe permanecer:

```text
approve own intent        → SUCCESS
approve twice             → ALREADY_PROCESSED
approve foreign intent    → TENANT_MISMATCH
reject approved intent    → INVALID_STATE
impersonate org URL       → FORBIDDEN
```

**Si cualquiera cambia de comportamiento: STOP.**

---

# 19. POSTGRES CONCURRENCY TEST

Ejecutar:

```bash
npx tsx scripts/blueprint-v23-postgres-persistence.ts
```

Debe demostrar:

```text
4 concurrent approvals
        ↓
1 winner
3 rejected
```

Nunca:

```text
4 approvals
```

---

# 20. END-TO-END REAL

Ahora sí: **no blueprint.**

Abrir:

```text
/growth-os/organizations/[organizationId]/governance
```

Seleccionar una intención real:

```text
PENDING_APPROVAL
```

Presionar:

```text
APPROVE
```

---

## Debe ocurrir exactamente esto

```text
                 FRONTEND
                    │
                    ▼
             Server Action
                    │
                    ▼
        ControlPlaneContext
                    │
                    ▼
              TenantScope
                    │
                    ▼
        ApproveIntentCommand
                    │
                    ▼
           ApprovalService
                    │
                    ▼
      PostgresApprovalTransaction
             ┌──────┼──────┐
             ▼      ▼      ▼
          Intent  Audit   Outbox
             │      │      │
             └──────┼──────┘
                    ▼
                 COMMIT
                    │
                    ▼
             revalidatePath
                    │
                    ▼
                FRONTEND
```

---

# 21. OUTBOX E2E

Después de aprobar:

Consultar:

```text
outbox_events
```

Debe existir:

```text
event_type
aggregate_id
payload
status = pending
```

Después ejecutar:

```bash
bun run worker:outbox
```

Debe terminar:

```text
status = processed
```

Y el consumer debe haber ejecutado la acción correspondiente.

---

# 22. AUDIT TRAIL

Abrir:

```text
/growth-os/organizations/[id]/activity
```

Confirmar que aparezca el evento.

Debe existir la cadena:

```text
StrategyDecision
      ↓
OperationalIntent
      ↓
Approval
      ↓
GovernanceEvent
      ↓
OutboxEvent
      ↓
Execution
```

---

# 23. GOVERNANCE UX

Abrir:

```text
/growth-os/organizations/[id]/governance
```

Confirmar:

### Pending

```text
Approve
Reject
```

### Approved

No debe poder aprobar nuevamente.

### Rejected

No debe poder rechazar nuevamente.

### Error

Debe mostrar error semántico:

```text
FORBIDDEN
ALREADY_PROCESSED
INVALID_STATE
TENANT_MISMATCH
```

No:

```text
500 Internal Server Error
```

como experiencia primaria del usuario.

---

# 24. CROSS-TENANT MANUAL TEST

Tener:

```text
Organization A
Organization B
```

Entrar como actor autorizado para A.

Intentar navegar manualmente:

```text
/growth-os/organizations/org_B/...
```

Resultado:

```text
FORBIDDEN
```

No:

```text
datos de B
```

---

# 25. SEARCH GLOBAL DE SEGURIDAD

Ejecutar:

```bash
grep -R "organizationId" src/app/growth-os
```

Después:

```bash
grep -R "findById" src/lib/pandoras/core/domains/control-plane
```

Y:

```bash
grep -R "update(" src/lib/pandoras/core/domains/control-plane
```

Revisar manualmente cualquier resultado.

La intención es confirmar que no reapareció:

```text
fetch → check → update
```

en Governance.

---

# 26. TEST SUITE

Ejecutar:

```bash
bun test
```

Si existe:

```bash
bun run test:e2e
```

Y:

```bash
bun run typecheck
```

si el proyecto tiene ese script.

---

# 27. BUILD FINAL

Ejecutar **después de todas las pruebas**:

```bash
bun run lint
bun run typecheck
bun run build
```

Los tres deben terminar exitosamente.

---

# 28. GIT DIFF AUDIT

Ejecutar:

```bash
git status
```

Después:

```bash
git diff --stat
```

Y:

```bash
git diff
```

Buscar especialmente:

```text
.env
.env.local
DATABASE_URL
NEON
API KEYS
TOKENS
SECRETS
```

**Ningún secreto debe aparecer en Git.**

---

# 29. MIGRATIONS AUDIT

Revisar:

```text
drizzle/
```

o la carpeta de migrations utilizada por el proyecto.

Confirmar:

```text
migration exists
schema matches migration
database matches migration
```

No debe existir una modificación manual de Neon que no esté representada en el repositorio.

---

# 30. DOCUMENTACIÓN

Actualizar únicamente si corresponde:

```text
docs/adr/ADR-011-...
docs/adr/ADR-012-...
docs/adr/ADR-013-...
docs/adr/ADR-014-...
docs/adr/ADR-015-...
```

Y:

```text
implementation_plan.md
walkthrough.md
task.md
```

El `walkthrough` final debe registrar:

```text
PASS
```

para cada gate.

---

# 31. LA PRUEBA DEFINITIVA

Esta es la prueba que realmente importa.

## Preparar

```text
Organization A
Actor A
Pending Intent A
```

### Paso 1

Frontend:

```text
Approve
```

### Paso 2

DB:

```text
intent = approved
audit = inserted
outbox = pending
```

### Paso 3

Worker:

```bash
bun run worker:outbox
```

### Paso 4

DB:

```text
outbox = processed
```

### Paso 5

Execution OS:

```text
execution received
```

### Paso 6

Frontend:

```text
intent = approved
activity = visible
```

### Paso 7

Repetir:

```text
Approve
```

Resultado:

```text
ALREADY_PROCESSED
```

### Paso 8

Cambiar URL a Organization B:

```text
FORBIDDEN
```

---

# 🟢 LAUNCH GATE

El Sprint 26 se declara **PASS** únicamente cuando:

| Gate                        | Resultado |
| --------------------------- | --------- |
| Build                       | 🟢        |
| TypeScript                  | 🟢        |
| Lint                        | 🟢        |
| DB migrations               | 🟢        |
| PostgreSQL persistence      | 🟢        |
| Tenant isolation            | 🟢        |
| Atomic approval             | 🟢        |
| Idempotency                 | 🟢        |
| Governance audit            | 🟢        |
| Transactional Outbox        | 🟢        |
| Lease recovery              | 🟢        |
| Retry / DLQ                 | 🟢        |
| Idempotent consumer         | 🟢        |
| Server Actions              | 🟢        |
| Frontend reads              | 🟢        |
| Frontend mutations          | 🟢        |
| Governance UX               | 🟢        |
| E2E approval                | 🟢        |
| Cross-tenant attack         | 🟢        |
| Production migration parity | 🟢        |
| No secrets committed        | 🟢        |

---

## 🔴 Criterios de STOP

**No lanzar** si aparece cualquiera de estos:

```text
❌ Frontend puede seleccionar autoridad
❌ Cross-tenant read
❌ Cross-tenant mutation
❌ Double approval
❌ Approval sin audit event
❌ Approval sin outbox event
❌ Outbox pierde eventos
❌ Worker duplica ejecución no idempotente
❌ Worker no recupera leases
❌ DB schema ≠ migrations
❌ Application importa Drizzle
❌ Secrets en repository
❌ Build roto
❌ E2E roto
```
