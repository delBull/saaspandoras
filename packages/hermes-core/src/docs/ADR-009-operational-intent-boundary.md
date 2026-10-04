# ADR-009: Strategy Decision → Operational Intent Boundary

**Status:** Proposed
**Date:** 2026-08-07
**Authors:** Pandora's Architecture Team
**Decision Type:** Core Architecture Boundary

---

# 1. Context

Pandora's OS actualmente posee una separación clara:

```text
Hermes Strategy Layer
        |
        |
Execution OS
```

Hermes entiende:
* Goals
* Missions
* Milestones
* Business context
* Strategic reasoning

Execution OS entiende:
* Workflows
* State Machines
* Providers
* Tools
* Infrastructure

Sin embargo, actualmente existe un salto directo:

```text
StrategyDecision
        |
        v
ExecutionRequest
```

Esto genera un problema arquitectónico.
Una decisión estratégica todavía no representa una operación autorizada.

Ejemplo:
Hermes decide:
> "El branding está terminado. Debemos iniciar generación de leads."

Pero una empresa real requiere responder:
* ¿Quién autorizó esa acción?
* ¿Tiene presupuesto?
* ¿Tiene restricciones?
* ¿Qué proveedor debe utilizarse?
* ¿Debe ejecutarse inmediatamente?
* ¿Necesita aprobación humana?
* ¿Puede modificarse antes de ejecutar?

Por lo tanto, necesitamos una frontera intermedia.

---

# 2. Decision

Introducimos un nuevo dominio:
**Operational Intent Layer**

La arquitectura cambia de:

```text
Mission Event
      ↓
Mission Planner
      ↓
Strategy Decision
      ↓
Execution Request
      ↓
Execution OS
```

A:

```text
Mission Event
      ↓
Mission Planner
      ↓
Strategy Decision
      ↓
Operational Intent
      ↓
Governance Layer
      ↓
Execution Request
      ↓
Execution OS
```

---

# 3. Core Principle

**Strategy proposes.**
**Operations execute.**
**Governance approves.**

Hermes tiene autoridad estratégica:
Puede decir: *"La misión requiere adquisición de clientes."*

Pero no tiene autoridad operacional:
No puede decir: *"Gasta $20,000 en anuncios de Facebook ahora."*

---

# 4. New Domain Contract

Nuevo contrato: `core/contracts/operational-contracts.ts`

## OperationalIntent

Representa una intención operacional derivada de una estrategia.

```typescript
export interface OperationalIntent {
  id: string;
  organizationId: string;
  missionId: string;
  sourceDecisionId: string;

  // Qué busca lograr
  objective: string;

  // Acción propuesta
  action: string;

  // Contexto estratégico
  rationale: string;

  // Restricciones
  constraints: OperationalConstraint[];

  // Gobernanza
  approvalPolicy: ApprovalPolicy;

  status:
    | "proposed"
    | "pending_approval"
    | "approved"
    | "rejected"
    | "executing"
    | "completed"
    | "cancelled";

  createdAt: Date;
}
```

---

# 5. Operational Constraints

Una intención puede tener límites.

```typescript
export interface OperationalConstraint {
 type:
   | "budget"
   | "time"
   | "provider"
   | "compliance";
 value: unknown;
}
```

---

# 6. Approval Policy

Aquí entra gobernanza empresarial.

```typescript
export interface ApprovalPolicy {
  required: boolean;
  approvers?: string[];
  reason?: string;
}
```

---

# 7. Responsibility Changes

## Hermes
Antes: `Planner -> ExecutionRequest`
Después: `Planner -> StrategyDecision -> OperationalIntent`
Hermes termina aquí.

## Governance Layer
Nuevo componente: `OperationalIntentManager`
Responsable de:
* validar políticas
* pedir aprobación
* registrar cambios
* transformar intent aprobado

## Execution OS
Solo recibe: `ExecutionRequest`. Nunca Missions, Goals o StrategyDecisions.

---

# 8. New Lifecycle

```text
PROPOSED
    |
Governance Check
    |
PENDING_APPROVAL
    |
Human/System Approval
    |
APPROVED
    |
ExecutionRequest Created
    |
EXECUTING
    |
COMPLETED
```

---

# 9. Persistence Model

Nuevas tablas:
- `operational_intents`
- `operational_approvals` (opcional)

---

# 10. Event Integration

Operational Intent genera sus propios eventos, separados de Strategic Events.

**Strategic Events (Hermes)**:
`MISSION_STARTED`, `MILESTONE_COMPLETED`, `PHASE_CHANGED`

**Operational Events (Ejecución)**:
`INTENT_CREATED`, `INTENT_APPROVED`, `EXECUTION_STARTED`, `EXECUTION_COMPLETED`

Nunca mezclarlos.

---

# 11. Updated Architecture

La arquitectura final queda:

```text
                 Organization
                       |
                 Installed Packs
                       |
              Hermes Strategy Layer
                       |
              Goals / Missions
                       |
              Mission Event Bus
                       |
              Mission Planner
                       |
              Strategy Decision
                       |
              Operational Intent
                       |
          Governance / Approval Layer
                       |
              Execution Request
                       |
              Execution OS
                       |
             Workflows / Providers
```

---

# 12. Why This ADR Matters

Este ADR convierte Pandora's de "Un agente que hace cosas" a "Un sistema operativo empresarial que propone, gobierna y ejecuta operaciones." Es la diferencia entre un chatbot autónomo y un COO digital.
