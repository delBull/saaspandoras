# ADR-015 — Production Readiness & Launch Gate

**Status:** Accepted
**Date:** 2026-08-09
**Decision Owners:** Pandora's Architecture
**Scope:** Production Readiness / Control Plane / Governance / Outbox / Deployment
**Related:** ADR-011, ADR-012, ADR-013, ADR-014

---

# 1. Context

Pandora's ha completado las principales fronteras arquitectónicas necesarias para operar el Control Plane:

```text
ADR-011
Organization Authority
        ↓
ADR-012
PostgreSQL Persistence
        ↓
ADR-013
Application → Server Actions → Frontend
        ↓
ADR-014
Transactional Outbox Delivery
```

El sistema ya no depende de:

* mocks para la ruta principal;
* repositorios en memoria;
* autorización proporcionada por la UI;
* acceso directo de Application a PostgreSQL;
* mutaciones no transaccionales;
* eventos distribuidos sin persistencia;
* un broker externo.

El siguiente riesgo ya no es principalmente arquitectónico.

El riesgo es **operacional**.

Por lo tanto, antes de declarar Pandora's lista para lanzamiento, se requiere una última frontera formal que valide:

1. seguridad;
2. aislamiento multi-tenant;
3. persistencia;
4. gobernanza;
5. delivery;
6. autenticación;
7. configuración;
8. deployment;
9. recuperación;
10. observabilidad;
11. comportamiento E2E.

---

# 2. Decision

Pandora's establecerá un **Production Launch Gate** obligatorio.

Ninguna funcionalidad del Control Plane podrá declararse `production-ready` hasta que todos los criterios **CRITICAL** del Launch Gate hayan sido satisfechos.

El gate tendrá únicamente dos resultados:

```text
GO
NO-GO
```

No existirá un estado ambiguo de "casi listo" para los controles críticos.

---

# 3. Launch Principle

La arquitectura de producción debe preservar:

> **El Frontend nunca posee autoridad. La sesión determina la autoridad. PostgreSQL preserva el estado. El dominio determina las transiciones. El Outbox garantiza la entrega.**

El flujo oficial será:

```text
                    ┌──────────────┐
                    │   Frontend   │
                    └──────┬───────┘
                           │
                           ▼
                    Server Actions
                           │
                           ▼
                  ControlPlaneContext
                           │
                           ▼
                  Application Commands
                           │
                           ▼
                       Domain
                           │
                           ▼
                 PostgreSQL Transaction
                    │       │       │
                    ▼       ▼       ▼
                 Intent   Audit   Outbox
                                    │
                                    ▼
                              Cron Processor
                                    │
                                    ▼
                              Idempotent
                               Consumer
                                    │
                                    ▼
                              Execution OS
```

---

# 4. Production Invariants

Los siguientes invariantes quedan congelados.

## INV-01 — Session Authority

La autoridad organizacional siempre proviene de la sesión autenticada.

Nunca de:

```text
URL
Frontend
Request body
Client state
Hidden fields
```

---

## INV-02 — Tenant Isolation

Un actor perteneciente a `org_A` jamás podrá:

```text
read org_B
mutate org_B
approve org_B
reject org_B
inspect org_B audit data
```

---

## INV-03 — Domain Authority

Las transiciones de estado son responsabilidad del dominio.

El Frontend no puede decidir:

```text
approved
rejected
cancelled
```

---

## INV-04 — Transactional Governance

Una mutación de gobernanza deberá persistir atómicamente:

```text
Intent State
+
Governance Audit Event
+
Outbox Event
```

---

## INV-05 — Append-Only Audit

Los eventos de gobernanza no podrán modificarse ni eliminarse.

---

## INV-06 — At-Least-Once Delivery

Todo evento Outbox persistido deberá permanecer recuperable hasta alcanzar un estado terminal.

---

## INV-07 — Consumer Idempotency

La repetición de un evento no podrá provocar una ejecución duplicada.

---

## INV-08 — No Silent Failure

Los errores no pueden convertirse silenciosamente en estados exitosos.

---

## INV-09 — Production Configuration

Producción no puede depender de:

```text
local filesystem
hardcoded secrets
mock data
development credentials
```

---

## INV-10 — Reproducible Deployment

El deployment debe poder reproducirse desde el repositorio y configuración oficial.

---

# 5. Security Boundary

El Launch Gate verificará específicamente:

```text
Authentication
        ↓
Session
        ↓
ControlPlaneContext
        ↓
TenantScope
        ↓
Application
        ↓
Repository
```

No deberá existir una ruta alternativa de autorización.

Se deberá realizar una auditoría final de:

```text
organizationId
requestedOrganizationId
actorId
tenant
scope
permissions
```

---

# 6. Database Authority

PostgreSQL/NeonDB será considerado la fuente de verdad de:

* Operational Intents;
* Governance Events;
* Missions;
* Strategy Decisions;
* Outbox Events;
* estados persistentes.

No se aceptarán fuentes paralelas de autoridad.

---

# 7. Deployment Strategy

El deployment deberá seguir:

```text
Build
 ↓
Migration
 ↓
Deploy
 ↓
Smoke Tests
 ↓
E2E
 ↓
GO
```

Las migraciones deberán ejecutarse de manera controlada y reproducible.

No se permitirán cambios manuales no versionados en producción.

---

# 8. Environment Management

Se deberá validar que todas las variables críticas existan en producción.

Como mínimo:

```text
DATABASE_URL
AUTH configuration
CRON authentication
Application secrets
External service credentials
```

Los secretos:

* no se imprimirán;
* no estarán en Git;
* no estarán hardcodeados;
* no aparecerán en logs.

---

# 9. Observability

El sistema deberá permitir identificar:

```text
request
actor
organization
intent
event
attempt
execution
error
```

cuando corresponda.

Los logs deberán ser suficientemente estructurados para reconstruir una operación.

No se exige todavía una plataforma externa específica.

---

# 10. Failure Recovery

El sistema deberá demostrar recuperación ante:

### Database Failure

La aplicación debe fallar de manera segura.

### Worker Crash

El Outbox debe recuperar leases expiradas.

### Consumer Failure

El evento debe reintentarse.

### Maximum Retries

El evento debe llegar a:

```text
failed
```

### Duplicate Delivery

El Consumer debe evitar doble ejecución.

### Deployment Restart

No deben perderse eventos persistidos.

---

# 11. Rollback Principle

El deployment debe tener un camino de rollback.

Una versión nueva no deberá requerir una operación irreversible para volver a la versión anterior.

Las migraciones incompatibles deberán evitarse o desplegarse mediante estrategia expand/contract cuando corresponda.

---

# 12. Launch Decision

El lanzamiento requiere:

```text
ALL CRITICAL = PASS
```

Si existe cualquier:

```text
CRITICAL = FAIL
```

el resultado será:

```text
NO-GO
```

Los issues `HIGH` podrán ser aceptados únicamente con:

* owner;
* workaround;
* fecha de resolución;
* evaluación explícita del riesgo.

---

# 13. Out of Scope

ADR-015 no introduce:

* Kubernetes;
* Redis;
* Kafka;
* service mesh;
* multi-region;
* autoscaling avanzado;
* event sourcing;
* microservices;
* observability platform obligatoria;
* disaster recovery multi-region.

El objetivo es **lanzar correctamente el sistema actual**, no diseñar el sistema del futuro.

---

# 14. Final Decision

> Pandora's no será considerado Production Ready por la existencia de código compilable o por una demostración funcional aislada. Será considerado Production Ready únicamente cuando toda la cadena crítica haya superado el Launch Gate definido en Sprint 26.
