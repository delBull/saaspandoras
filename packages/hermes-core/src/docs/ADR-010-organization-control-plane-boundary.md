# ADR-010: Organization Control Plane Boundary

**Status:** Proposed
**Date:** 2026-08-07
**Authors:** Pandora's Architecture Team
**Decision Type:** Core Architecture Boundary

---

# 1. Context

Hasta el Sprint 21, Pandora's OS ha consolidado su motor interno de inteligencia y operación:
- Hermes propone estrategias (`StrategyDecision`).
- La capa de Gobernanza las autoriza (`OperationalIntent` y `ApprovalPolicy`).
- Execution OS las materializa (`ExecutionRequest`).

Toda esta actividad ocurre en las capas profundas del sistema. Sin embargo, para que una organización pueda interactuar, gobernar y auditar a este sistema operativo, necesitamos una superficie de administración.

El error común en arquitecturas de agentes es construir un "chat" (Frontend) que interactúa directamente con el cerebro. Esto rompe la separación de responsabilidades y permite que el UI ejecute comandos que bypassan la gobernanza.

---

# 2. Decision

Se define el **Organization Control Plane** como la única superficie autorizada para que los humanos (directivos, administradores) interactúen con Pandora's OS a nivel organizacional.

No es el frontend de un Pack específico (como S'Narai), sino el **panel de administración agnóstico** desde donde una organización gobierna todos los Packs instalados.

## Principio Fundamental

**El Control Plane es "Read-Heavy, Command-Light".**

- El usuario **lee** estados, decisiones, misiones e historiales de auditoría.
- El usuario **ejecuta comandos** sobre intenciones (Aprobar, Rechazar, Pausar, Cancelar).
- El usuario **NUNCA** puede comandar directamente la ejecución técnica de un workflow desde la UI. El gobierno se ejerce sobre las intenciones operacionales que Hermes propone.

---

# 3. Control Plane Application Layer

Para proteger el núcleo de Pandora's, el frontend (React/Next.js) no importará ni consumirá directamente `MissionManager`, `IntentManager` o `ExecutionOS`.

Se establece una capa intermedia: **Control Plane Application Layer (API / Server Actions)**.

```text
Frontend (React UI)
    │
    ▼
Control Plane Application Layer (Server Actions)
    │
    ├── Queries (Overview, Missions, Intents, Audit)
    ├── Commands (Approve, Reject, Cancel)
    │
    ▼
Pandora's Core Ports & Repositories
```

# 4. Architectural Locks (Las 5 Reglas Inquebrantables)

### 4.1. Prohibición de consumo directo de repositorios en Server Actions
Las Server Actions (`actions.ts`) **NO** pueden consumir repositorios ni servicios del core directamente. Se establece una subcapa obligatoria:
```text
control-plane/
├── application/
│   ├── queries/ (Lecturas de estado y auditoría)
│   └── commands/ (Comandos de gobernanza)
└── actions.ts (Router hacia queries/commands)
```

### 4.2. Autoridad basada en Sesión (Zero Trust UI)
El `organizationId` y `actorId` **nunca** deben confiarse si vienen como parámetros desde el cliente (UI). Deben derivarse exclusivamente del contexto de la sesión autenticada. La UI manda una orden sobre un `intentId`, pero la Application Layer verifica que la sesión tenga autoridad sobre el `organizationId` al que pertenece ese intent.

### 4.3. Los Comandos de UI son Propuestas, no Mutaciones
Un comando como `approveIntent()` **NO** muta el estado a `approved`. Delega la orden al `Governance Domain` (ej. `ApprovalService`), el cual evalúa políticas y restricciones antes de producir un `ExecutionRequest`. El estado operativo lo define el core, no la base de datos manipulada por la UI.

### 4.4. View Models Estrictos (Aislamiento de Dominio)
La UI (React) **NO** recibe contratos internos del dominio (`StrategyDecision`, `OperationalIntent`, etc.). La Application Layer debe mapear las respuestas de los queries a `ViewModels` específicos (`OrganizationOverviewView`, `ActivityAuditView`). Esto evita acoplamiento y fuga de arquitectura profunda hacia el frontend.

### 4.5. Auditoría Inmutable (Append-Only Lineage)
Las vistas de auditoría no muestran el "estado actual" sino la historia inmutable (Audit Trail) de cómo el sistema llegó a ese estado. Debe ser capaz de reconstruir visualmente el *Decision Lineage*:
`Mission → StrategyDecision (WHY) → OperationalIntent (WHAT) → Governance (AUTHORITY) → ExecutionRequest (HOW)`

---

# 5. Superficies de Interfaz (UI Views)

El Control Plane se divide en 4 vistas principales:

### 4.1. Organization Overview (`/organizations/:id`)
Dashboard ejecutivo que muestra la salud estratégica de la organización:
- Misiones activas, objetivos, estado de los packs instalados.
- Visibilidad inmediata de los `OperationalIntents` pendientes de aprobación.

### 4.2. Mission Control (`/organizations/:id/missions`)
Visión profunda del progreso de una misión:
- Estado de los hitos (Milestones).
- La siguiente decisión estratégica encolada (`StrategyDecision`).
- El "WHY" (el `reason` estructurado) que explica por qué Hermes decidió esa acción.

### 4.3. Governance Center (`/organizations/:id/governance`)
El punto de interacción de autoridad.
- Muestra los `OperationalIntents` con estado `pending_approval`.
- Expone las restricciones operativas (`constraints`, ej. Budget).
- Permite aprobar o rechazar con justificación.

### 4.4. Activity & Audit (`/organizations/:id/activity`)
El rastro inmutable (Audit Trail) que demuestra gobernabilidad:
- Línea temporal: Evento Estratégico → Decisión de Hermes → Intención Propuesta → Aprobación de Gobernanza → Envío a Ejecución.
- Responde siempre: *Por qué se hizo algo, qué se propuso, quién lo autorizó y cuál fue el resultado.*

---

# 5. Restricciones Técnicas Iniciales (Sprint 22)

Para garantizar estabilidad y enfoque en la arquitectura de estados, se prohíbe inicialmente:
- ❌ WebSockets o actualizaciones en tiempo real (Real-time pub/sub).
- ❌ Redis, Kafka o Message Brokers externos.
- ❌ Gráficos y dashboards analíticos complejos.
- ❌ Notificaciones Push.

**El objetivo es demostrar que la UI refleja fielmente el estado real y persistente del OS a través de consultas (Queries) y que la gobernanza se ejerce mediante Comandos limpios.**

---

# 6. Consecuencias

Este ADR establece formalmente que Pandora's no es una "plataforma de agentes conversacionales", sino un **Operating System para Organizaciones**. El Control Plane es la consola de mando de ese sistema operativo.
