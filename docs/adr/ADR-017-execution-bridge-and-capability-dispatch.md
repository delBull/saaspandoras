# ADR-017 — Execution Bridge & Capability Dispatch

- **Status:** Accepted
- **Date:** 2026-08-09
- **Decision Owners:** Pandora's Architecture
- **Related ADRs:** ADR-011, ADR-012, ADR-013, ADR-014, ADR-015, ADR-016
- **Related Sprint:** Sprint 28 — Execution Bridge & First Real Capability

---

## 1. Context

Pandora's Control Plane ya es capaz de:

1. recibir una solicitud dentro de una Organización;
2. validar autoridad mediante `ControlPlaneContext`;
3. producir y persistir `OperationalIntent`;
4. requerir aprobación humana cuando corresponde;
5. ejecutar transiciones de estado atómicas en PostgreSQL;
6. registrar Governance Events append-only;
7. generar Transactional Outbox Events;
8. procesar dichos eventos mediante el Outbox Processor;
9. exponer el estado resultante en el Control Plane UI.

Sin embargo, existe una frontera todavía no validada:

> Una decisión aprobada debe poder transformarse en trabajo ejecutable por el Execution OS y producir evidencia persistente de su resultado.

Hasta Sprint 27, Pandora's demuestra correctamente el plano de **decisión, autoridad y observabilidad**, pero todavía no existe una capacidad funcional conectada de extremo a extremo.

Sprint 28 establece esta frontera.

El objetivo no es construir todavía un Marketing Engine completo ni integrar múltiples proveedores externos.

El objetivo es demostrar una única capacidad determinista:

`CREATE_REFERRAL_CAMPAIGN`

El circuito esperado será:

```text
Hermes
  ↓
StrategyDecision
  ↓
OperationalIntent
  ↓
Human / Policy Approval
  ↓
PostgreSQL Transaction
  ├── OperationalIntent = approved
  ├── GovernanceEvent
  └── OutboxEvent = pending
          ↓
     Outbox Processor
          ↓
OPERATIONAL_INTENT_APPROVED
          ↓
   Execution Bridge
          ↓
   ExecutionRequest
          ↓
     Execution OS
          ↓
 CREATE_REFERRAL_CAMPAIGN
          ↓
   Campaign persisted
          ↓
 ExecutionSucceeded
          ↓
      MissionEvent
          ↓
    Activity / Audit
          ↓
         UI
```

---

## 2. Decision

Pandora's introduce una frontera explícita denominada:

**Execution Bridge**

El Execution Bridge será responsable de traducir eventos provenientes del Transactional Outbox en `ExecutionRequest` tipadas para el Execution OS.

La arquitectura será:

```text
Transactional Outbox
        ↓
   Outbox Handler
        ↓
 ExecutionRequest
        ↓
   Execution OS
        ↓
 Capability Dispatcher
        ↓
      Workflow
        ↓
 ExecutionResult
        ↓
   Feedback Loop
        ↓
   MissionEvent
```

El Outbox **NO conocerá workflows concretos**.

El Outbox tampoco importará directamente implementaciones de capacidades.

---

## 3. Architectural Principle

Se establece la siguiente regla:

> **El Outbox transporta eventos. El Execution Bridge traduce eventos en solicitudes de ejecución. El Execution OS decide qué capability ejecutar.**

Por lo tanto, esta arquitectura está prohibida:

```text
Outbox
  ↓
ReferralCampaignWorkflow
```

Y esta arquitectura es obligatoria:

```text
Outbox
  ↓
ExecutionRequest
  ↓
Execution OS
  ↓
Capability
```

Esto mantiene desacoplados:

* Control Plane
* Transactional Outbox
* Execution OS
* Capabilities
* Workflows
* UI

---

## 4. ExecutionRequest

Se introduce el concepto `ExecutionRequest`.

Una solicitud debe contener, como mínimo:

```typescript
interface ExecutionRequest {
  requestId: string;
  organizationId: string;
  intentId: string;
  missionId: string;
  capability: string;
  payload: Record<string, unknown>;
  correlationId?: string;
  causationId?: string;
}
```

### Authority Rule

El `organizationId` presente en `ExecutionRequest` no constituye una nueva fuente de autoridad.

La autoridad ya fue establecida en el Control Plane antes de generar el OperationalIntent.

El Execution OS debe tratar el identificador como contexto de ejecución, no como mecanismo de autorización del usuario.

---

## 5. Capability Dispatch

El Execution OS será responsable de resolver:

```text
capability
    ↓
registered capability
    ↓
handler/workflow
```

Ejemplo:

```text
CREATE_REFERRAL_CAMPAIGN
        ↓
ReferralCampaignCapability
        ↓
createReferralCampaign()
```

La resolución debe realizarse mediante un registro explícito de capacidades.

No se permite:

* `if/else` masivo;
* `switch` monolítico;
* imports directos desde el Outbox hacia workflows específicos.

---

## 6. First Capability

La primera capability oficial será:

```text
CREATE_REFERRAL_CAMPAIGN
```

Su propósito es crear una campaña de referral asociada a la Organización/Misión correspondiente y devolver un resultado de ejecución persistible.

La capacidad debe ser:

* determinista;
* testeable;
* idempotente;
* independiente de proveedores externos;
* observable.

No se utilizarán todavía:

* Telegram;
* Redis;
* Kafka;
* APIs externas;
* LLMs;
* proveedores de marketing.

---

## 7. Idempotency

El sistema de Outbox opera bajo semántica:

> **At-Least-Once Delivery**

Por lo tanto, una misma `ExecutionRequest` puede llegar más de una vez.

La capability debe garantizar que:

```text
request A
  ↓
campaign created

request A again
  ↓
existing campaign returned
```

y nunca:

```text
request A
  ↓
campaign #1

request A again
  ↓
campaign #2
```

La idempotencia debe estar basada en un identificador estable de ejecución, preferentemente:

```text
intentId
```

o una clave derivada de:

```text
organizationId + intentId + capability
```

---

## 8. ExecutionResult

Toda capability debe devolver un resultado normalizado:

```typescript
type ExecutionResult =
  | {
      status: "succeeded";
      executionId: string;
      output: Record<string, unknown>;
    }
  | {
      status: "failed";
      executionId: string;
      errorCode: string;
      message: string;
    };
```

El resultado no debe lanzar directamente información de infraestructura hacia el Control Plane UI.

---

## 9. Feedback Loop

Una ejecución exitosa debe producir evidencia estratégica.

Ejemplo:

```text
ExecutionSucceeded
        ↓
MissionEvent
        ↓
mission_events
        ↓
getMissionAuditTrail()
        ↓
Activity UI
```

El evento deberá permitir responder:

* qué se ejecutó;
* para qué misión;
* qué capability se ejecutó;
* cuándo ocurrió;
* cuál fue el resultado;
* qué ejecución produjo el evento.

---

## 10. Failure Semantics

Si una capability falla:

```text
ExecutionRequest
      ↓
Capability
      ↓
ExecutionFailed
```

El sistema debe permitir que el Outbox Processor aplique su política existente de retry.

No se implementará todavía un sistema separado de retries dentro de cada capability.

La responsabilidad queda dividida:

```text
Outbox
  → delivery retry

Execution OS
  → execution dispatch

Capability
  → business execution

Feedback Loop
  → execution evidence
```

---

## 11. Tenant Isolation

Toda ejecución debe conservar el contexto de Organización.

Está prohibido:

```typescript
execute(intentId)
```

si esto obliga al Execution OS a descubrir posteriormente la Organización mediante consultas ambiguas.

Preferido:

```typescript
execute({
  organizationId,
  intentId,
  missionId,
  capability,
  payload
});
```

La ejecución no podrá utilizar un `organizationId` arbitrario proveniente directamente de una petición HTTP.

---

## 12. UI Boundary

El Frontend no invocará directamente:

```text
Execution OS
Capability
Workflow
Outbox Processor
```

La UI solamente observa los resultados a través de los ViewModels existentes.

El flujo visual será:

```text
Governance UI
    ↓
Approve
    ↓
Intent approved
    ↓
Outbox processed
    ↓
Execution completed
    ↓
Activity UI
```

La UI no necesita conocer cómo se ejecutó la capability.

---

## 13. Database Boundary

Sprint 28 reutilizará las estructuras persistentes existentes siempre que sea posible.

No se crearán tablas genéricas de ejecución prematuramente.

Si la primera capability necesita persistir una campaña, utilizará la infraestructura existente o una tabla específica claramente justificada.

No se creará un "Execution Engine DB" paralelo.

---

## 14. Observability

Cada ejecución deberá poder correlacionarse mediante:

```text
organizationId
intentId
missionId
executionId
correlationId
causationId
```

El objetivo es poder reconstruir:

```text
Why?
  StrategyDecision

What?
  OperationalIntent

Who authorized?
  GovernanceEvent

What was dispatched?
  ExecutionRequest

What happened?
  ExecutionResult

What changed?
  MissionEvent
```

---

## 15. Invariants

Sprint 28 no puede romper ninguno de los siguientes invariantes:

### INV-01 — Session Authority

La autoridad nace de la sesión.

### INV-02 — Tenant Isolation

Una Organización nunca puede ejecutar sobre otra.

### INV-03 — Atomic Governance

La aprobación continúa siendo atómica.

### INV-04 — Append-Only Audit

Governance Events permanecen inmutables.

### INV-05 — At-Least-Once Delivery

El Outbox puede entregar más de una vez.

### INV-06 — Idempotent Execution

Una entrega repetida no genera efectos duplicados.

### INV-07 — Execution Boundary

El Control Plane no ejecuta workflows directamente.

### INV-08 — UI Isolation

La UI no conoce infraestructura ni lógica de ejecución.

### INV-09 — No Infrastructure Leakage

El dominio no importa Drizzle/PostgreSQL.

### INV-10 — Observable Execution

Una ejecución exitosa genera evidencia visible en Activity.

---

## 16. Explicitly Out of Scope

Sprint 28 NO incluye:

* Telegram production integration;
* Redis;
* Kafka;
* Event Bus genérico;
* múltiples capabilities;
* Marketing Engine completo;
* LLM orchestration;
* scheduling avanzado;
* distributed execution;
* execution dashboard;
* automatic retry de workflows;
* compensation/saga engine;
* multi-worker distributed orchestration.

---

## 17. Acceptance Criteria

Sprint 28 será considerado completo únicamente cuando:

1. Un `OperationalIntent` aprobado genere un Outbox Event.
2. El Outbox Processor reclame el evento.
3. El Execution Bridge lo transforme en `ExecutionRequest`.
4. El Execution OS resuelva `CREATE_REFERRAL_CAMPAIGN`.
5. La capability ejecute exitosamente.
6. La ejecución sea idempotente.
7. La campaña/efecto esperado quede persistido.
8. Se genere un `MissionEvent`.
9. El evento aparezca en Activity.
10. Una repetición del mismo evento no duplique el efecto.
11. Un evento de otra Organización sea rechazado.
12. No existan imports directos Outbox → Workflow.
13. No existan imports UI → Execution Infrastructure.
14. Los tests de Sprint 22.6-D, 23, 25, 26 y 27 continúen pasando.

---

## 18. Final Decision

Pandora's adopta un modelo:

```text
CONTROL
   ↓
GOVERNANCE
   ↓
OUTBOX
   ↓
EXECUTION BRIDGE
   ↓
EXECUTION OS
   ↓
CAPABILITY
   ↓
MISSION FEEDBACK
```

Este patrón se convierte en la frontera oficial para futuras capacidades del sistema.

**ADR-017: ACCEPTED**
