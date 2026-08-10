# Sprint 26 — Production Readiness & Launch Gate

**Status:** Ready for Execution
**Depends on:** Sprint 25, ADR-015
**Objective:** Production Launch

---

# 1. Sprint Objective

Validar que Pandora's puede pasar de:

```text
Development
```

a:

```text
Production
```

sin introducir una nueva capa arquitectónica.

Este sprint es un **verification sprint**, no un feature sprint.

---

# 2. Phase 26-A — Repository & Architecture Audit

Realizar una búsqueda global sobre:

```text
organizationId
actorId
requestedOrganizationId
db
drizzle
Mock
TODO
FIXME
console.log
```

Objetivo:

* detectar bypasses;
* detectar mocks;
* detectar imports prohibidos;
* detectar hardcodes;
* detectar deuda crítica.

### Gate

```text
No unauthorized tenant authority path
No production mock path
No Application → Infrastructure bypass
```

---

# 3. Phase 26-B — Authentication & Session Gate

Validar:

### Test A

Usuario autenticado:

```text
org_A
```

puede acceder a:

```text
org_A
```

### Test B

Usuario autenticado:

```text
org_A
```

intenta:

```text
/org_B
```

Resultado:

```text
FORBIDDEN
```

### Test C

Usuario sin sesión.

Resultado:

```text
UNAUTHORIZED
```

### Test D

Modificar manualmente el `requestedOrganizationId`.

Resultado:

```text
FORBIDDEN
```

---

# 4. Phase 26-C — Permission Gate

Validar permisos:

```text
approve_intent
reject_intent
```

Un actor sin permiso no podrá ejecutar la operación aunque:

* conozca el intent;
* conozca el endpoint;
* manipule la UI;
* llame directamente al Server Action.

---

# 5. Phase 26-D — Tenant Isolation E2E

Crear como mínimo:

```text
org_A
org_B
actor_A
actor_B
intent_A
intent_B
```

Ejecutar:

```text
actor_A → intent_A
```

Debe funcionar.

```text
actor_A → intent_B
```

Debe fallar.

```text
actor_B → intent_A
```

Debe fallar.

También validar lecturas:

```text
actor_A → overview(org_B)
actor_A → missions(org_B)
actor_A → intents(org_B)
actor_A → audit(org_B)
```

Todos deben fallar.

---

# 6. Phase 26-E — Governance State Machine

Validar todas las transiciones permitidas.

### Approve

```text
pending_approval
        ↓
approved
```

### Reject

```text
pending_approval
        ↓
rejected
```

### Duplicate Approve

```text
approved
   ↓
FAIL
```

### Reject after Approve

```text
approved
   ↓
FAIL
```

### Approve after Reject

```text
rejected
   ↓
FAIL
```

---

# 7. Phase 26-F — Concurrent Governance

Ejecutar solicitudes concurrentes:

```text
Approve(intent_A)
Approve(intent_A)
Approve(intent_A)
Approve(intent_A)
```

Resultado esperado:

```text
1 × SUCCESS
3 × ALREADY_PROCESSED / INVALID_STATE
```

No debe existir:

```text
2 × approved events
```

---

# 8. Phase 26-G — Transactional Atomicity

Forzar fallos durante:

```text
Intent update
Audit insert
Outbox insert
```

y verificar:

```text
ROLLBACK
```

No debe existir:

```text
approved intent
+
missing audit
```

ni:

```text
approved intent
+
missing outbox
```

La operación es atómica.

---

# 9. Phase 26-H — Audit Integrity

Validar:

```text
INSERT governance event
```

funciona.

Intentar:

```text
UPDATE governance event
DELETE governance event
```

debe estar prohibido por la arquitectura y/o controles de persistencia definidos.

El historial deberá permanecer append-only.

---

# 10. Phase 26-I — Outbox Delivery

Ejecutar:

```text
Approve
 ↓
outbox_events
 ↓
Cron
 ↓
Processor
 ↓
Consumer
```

Verificar:

```text
pending
→ processing
→ processed
```

---

# 11. Phase 26-J — Outbox Failure Recovery

### Test 1

Consumer falla.

Resultado:

```text
retry
```

### Test 2

Worker muere.

Resultado:

```text
lease expires
→ pending
```

### Test 3

Maximum attempts.

Resultado:

```text
failed
```

### Test 4

Manual retry.

Resultado:

```text
failed
→ pending
→ processing
→ processed
```

---

# 12. Phase 26-K — Duplicate Delivery

Forzar dos entregas del mismo evento.

Resultado:

```text
Delivery #1 → execute
Delivery #2 → deduplicate
```

Nunca:

```text
execute × 2
```

---

# 13. Phase 26-L — Frontend E2E

Validar desde la interfaz real:

```text
Login
 ↓
Organizations
 ↓
Organization
 ↓
Overview
 ↓
Governance
 ↓
Pending Intent
 ↓
Approve
 ↓
Success feedback
 ↓
UI refresh
 ↓
Intent approved
```

Después:

```text
Reject
```

y validar el mismo ciclo.

No deberán utilizarse mocks.

---

# 14. Phase 26-M — Error UX

Validar que la UI maneje correctamente:

```text
FORBIDDEN
UNAUTHORIZED
INVALID_STATE
ALREADY_PROCESSED
NOT_FOUND
DATABASE_FAILURE
UNKNOWN_ERROR
```

La interfaz nunca deberá mostrar:

```text
stack trace
SQL
DATABASE_URL
internal exception
```

al usuario.

---

# 15. Phase 26-N — Production Environment Audit

Verificar:

* [ ] Production database correcta.
* [ ] Environment variables configuradas.
* [ ] Secrets fuera del repositorio.
* [ ] Cron configurado.
* [ ] Cron authentication configurada.
* [ ] Database migrations aplicadas.
* [ ] Build production exitoso.
* [ ] No development-only configuration.
* [ ] No localhost URLs.
* [ ] No staging URLs.
* [ ] No hardcoded organization.
* [ ] No hardcoded actor.
* [ ] No mock repository.

---

# 16. Phase 26-O — Build & Deployment

Ejecutar:

```text
typecheck
lint
build
migration validation
```

El deployment debe producir un artefacto reproducible.

### Gate

```text
BUILD = PASS
```

---

# 17. Phase 26-P — Production Smoke Test

Inmediatamente después del deployment:

### Smoke 1

Login.

### Smoke 2

Open organization.

### Smoke 3

Read Overview.

### Smoke 4

Read Missions.

### Smoke 5

Read Governance.

### Smoke 6

Approve test intent.

### Smoke 7

Verify audit event.

### Smoke 8

Verify outbox event.

### Smoke 9

Verify processor.

### Smoke 10

Verify UI state.

---

# 18. Phase 26-Q — Rollback Test

Documentar:

```text
Current Version
Previous Version
Rollback Procedure
Database Considerations
```

No necesariamente se requiere provocar un rollback destructivo en producción.

Debe demostrarse que existe un procedimiento operativo claro.

---

# 19. Phase 26-R — Launch Evidence Package

Crear:

```text
docs/launch/
```

con:

```text
launch-checklist.md
security-validation.md
tenant-isolation.md
e2e-validation.md
database-validation.md
outbox-validation.md
rollback.md
```

Cada documento deberá indicar:

```text
TEST
EXPECTED
ACTUAL
STATUS
EVIDENCE
```

---

# 20. Final Launch Matrix

| Área                  | Critical | Resultado requerido |
| --------------------- | -------: | ------------------- |
| Authentication        |       🔴 | PASS                |
| Authorization         |       🔴 | PASS                |
| Tenant Isolation      |       🔴 | PASS                |
| Governance            |       🔴 | PASS                |
| PostgreSQL            |       🔴 | PASS                |
| Transaction Atomicity |       🔴 | PASS                |
| Audit Integrity       |       🔴 | PASS                |
| Outbox                |       🔴 | PASS                |
| Consumer Idempotency  |       🔴 | PASS                |
| Frontend E2E          |       🔴 | PASS                |
| Production Config     |       🔴 | PASS                |
| Build                 |       🔴 | PASS                |
| Deployment            |       🔴 | PASS                |
| Smoke Tests           |       🔴 | PASS                |
| Rollback              |       🟠 | PASS                |
| Observability         |       🟠 | PASS                |

---

# 21. GO Criteria

El sistema obtiene:

```text
╔══════════════════════════════╗
║                              ║
║          LAUNCH GO           ║
║                              ║
╚══════════════════════════════╝
```

únicamente cuando:

```text
ALL CRITICAL = PASS
```

y no existe ningún riesgo conocido que pueda:

* comprometer tenant isolation;
* perder una mutación;
* duplicar una operación irreversible;
* romper governance;
* exponer secretos;
* impedir recuperación.

---

# 22. NO-GO Criteria

El lanzamiento se detiene inmediatamente ante:

```text
Tenant isolation failure
Authorization bypass
Lost governance event
Lost outbox event
Duplicate irreversible execution
Production secret exposure
Unrecoverable database migration
Broken authentication
Broken transaction atomicity
```

Resultado:

```text
NO-GO
```

---

# 23. Definition of Done

Sprint 26 estará completo cuando:

* [ ] Architecture audit PASS.
* [ ] Authentication PASS.
* [ ] Authorization PASS.
* [ ] Tenant isolation PASS.
* [ ] Governance state machine PASS.
* [ ] Concurrent mutations PASS.
* [ ] Transaction rollback PASS.
* [ ] Audit immutability PASS.
* [ ] Outbox delivery PASS.
* [ ] Outbox recovery PASS.
* [ ] Dead-letter recovery PASS.
* [ ] Consumer idempotency PASS.
* [ ] Frontend E2E PASS.
* [ ] Error UX PASS.
* [ ] Production environment PASS.
* [ ] Production build PASS.
* [ ] Deployment PASS.
* [ ] Smoke tests PASS.
* [ ] Rollback procedure documented.
* [ ] Launch evidence package complete.
* [ ] No unresolved CRITICAL issues.

---

# 24. Final Architecture After Sprint 26

Al cerrar el sprint, la arquitectura objetivo será:

```text
                         ┌───────────────────┐
                         │     FRONTEND      │
                         │     Next.js       │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │  SERVER ACTIONS   │
                         │ Transport Adapter │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │ CONTROL PLANE     │
                         │ Application Layer │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │      DOMAIN       │
                         │ Governance/Hermes │
                         └─────────┬─────────┘
                                   │
                                   ▼
                    ┌────────────────────────────┐
                    │      PostgreSQL / Neon     │
                    │                            │
                    │ Intent                     │
                    │ Governance Audit           │
                    │ Missions                   │
                    │ Strategy Decisions         │
                    │ Outbox                     │
                    └──────────────┬─────────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │    VERCEL CRON    │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │ OUTBOX PROCESSOR  │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │ IDEMPOTENT        │
                         │ CONSUMERS         │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │   EXECUTION OS    │
                         └───────────────────┘
```
