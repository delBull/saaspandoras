# ADR-018 — Capability Runtime Contract & Execution State

**Status:** Accepted
**Date:** 2026-08-09
**Decision Owners:** Pandora's Architecture Team
**Scope:** Execution OS / Capability Runtime
**Related Sprints:** Sprint 28 — Execution Bridge & Capability Dispatch, Sprint 29 — Capability Runtime Hardening & Mission Feedback
**Supersedes:** None

---

## 1. Context

Sprint 28 established and verified the first complete execution pipeline of Pandora's Growth OS:

```text
Hermes
  ↓
Operational Intent
  ↓
Governance Approval
  ↓
PostgreSQL Transaction
  ↓
Transactional Outbox
  ↓
Outbox Processor
  ↓
Execution Bridge
  ↓
Execution OS
  ↓
Capability
  ↓
Database Effect
  ↓
Mission Event
  ↓
Activity
  ↓
UI
```

The first production-shaped capability, `CREATE_REFERRAL_CAMPAIGN`, successfully demonstrated:

* Outbox-driven execution.
* Capability dispatch.
* Database side effects.
* Mission feedback.
* At-least-once delivery.
* Capability-level idempotency.
* Protection against duplicate execution.

The architecture now requires a formal contract for capabilities themselves.

Without such a contract, each new capability could independently define:

* its own input format;
* its own execution context;
* its own result format;
* its own error semantics;
* its own idempotency behavior;
* its own execution state model.

That would create fragmentation inside the Execution OS and eventually make capabilities impossible to operate consistently.

This ADR therefore establishes the **Capability Runtime Contract** and the canonical **Execution State Machine**.

---

# 2. Decision

Pandora's will implement a centralized, infrastructure-independent Capability Runtime contract.

Every executable capability MUST conform to the same lifecycle:

```text
QUEUED
  ↓
RUNNING
  ↓
SUCCEEDED
```

or:

```text
QUEUED
  ↓
RUNNING
  ↓
FAILED
```

The Execution OS owns execution lifecycle semantics.

Individual capabilities own only their actual work.

The capability MUST NOT become an authority boundary.

Authorization and governance decisions remain the responsibility of the Control Plane.

---

# 3. Architectural Boundary

The system is divided into two explicit planes.

## 3.1 Control Plane

Responsible for:

* strategy;
* missions;
* operational intents;
* governance;
* authorization;
* tenant scope;
* founder approval;
* state transitions;
* audit events;
* transactional persistence.

```text
Control Plane
    │
    │ approved intent
    ▼
Transactional Outbox
```

## 3.2 Execution Plane

Responsible for:

* consuming approved work;
* resolving capabilities;
* executing workflows;
* tracking execution state;
* enforcing execution idempotency;
* producing execution results;
* emitting mission feedback.

```text
Transactional Outbox
        ↓
Execution Bridge
        ↓
Execution OS
        ↓
Capability Runtime
        ↓
Capability
```

The Execution Plane MUST NOT bypass the Control Plane to create unauthorized operational effects.

---

# 4. Capability Contract

Every capability MUST expose a canonical contract.

Conceptually:

```typescript
interface Capability<TInput, TOutput> {
  id: string;
  version: string;

  execute(
    input: TInput,
    context: CapabilityContext
  ): Promise<CapabilityResult<TOutput>>;
}
```

The exact TypeScript implementation MAY differ, but the architectural contract MUST remain equivalent.

---

# 5. Capability Identity

Every capability MUST have a stable identifier.

Example:

```text
CREATE_REFERRAL_CAMPAIGN
SEND_TELEGRAM_NOTIFICATION
GENERATE_LEAD_ASSET
```

Capability identity MUST NOT depend on:

* file path;
* class name;
* function name;
* database implementation;
* provider-specific identifiers.

A capability MAY evolve through explicit versions:

```text
CREATE_REFERRAL_CAMPAIGN:v1
CREATE_REFERRAL_CAMPAIGN:v2
```

Breaking behavioral or input/output changes MUST result in a version change.

---

# 6. Capability Context

Every execution MUST receive a `CapabilityContext`.

The context MUST contain the execution identity required to establish traceability and idempotency.

Minimum conceptual fields:

```typescript
interface CapabilityContext {
  organizationId: string;
  actorId: string;
  missionId: string;
  intentId: string;
  correlationId: string;
  idempotencyKey: string;
}
```

Additional fields MAY be introduced when required by a specific execution boundary.

## 6.1 Authority Rule

`CapabilityContext` provides execution context.

It does NOT grant authority.

The capability MUST NOT interpret:

```text
organizationId
actorId
missionId
```

as proof that the requested action was authorized.

Authorization has already occurred in the Control Plane.

The capability receives an already-approved execution request.

---

# 7. Tenant Isolation

Every capability execution MUST remain tenant-scoped.

A capability MUST NOT:

* accept an arbitrary tenant supplied by an untrusted client;
* derive organization authority from capability payloads;
* switch tenants during execution;
* query another organization without an explicit authorized system boundary.

The organization identity originates from the authenticated Control Plane context and propagates through the execution pipeline.

The intended chain is:

```text
Authenticated Session
        ↓
ControlPlaneContext
        ↓
TenantScope
        ↓
OperationalIntent
        ↓
Outbox Event
        ↓
CapabilityContext
        ↓
Capability
```

No downstream layer may replace the organization identity with client-supplied data.

---

# 8. Execution Identity

Every execution MUST be traceable to its originating intent.

The minimum execution relationship is:

```text
Execution
 ├── organizationId
 ├── missionId
 ├── intentId
 ├── capabilityId
 ├── correlationId
 └── idempotencyKey
```

This allows the system to answer:

> Which capability execution produced this effect?

and:

> Which approved intent authorized this execution?

---

# 9. Execution State Machine

The canonical execution states are:

```text
QUEUED
RUNNING
SUCCEEDED
FAILED
```

## 9.1 QUEUED

The execution has been accepted for processing but has not started actual capability execution.

```text
QUEUED
```

## 9.2 RUNNING

The Execution OS has claimed the execution and invoked the capability.

```text
QUEUED
  ↓
RUNNING
```

## 9.3 SUCCEEDED

The capability completed successfully and produced its expected effect/result.

```text
RUNNING
  ↓
SUCCEEDED
```

## 9.4 FAILED

The capability could not complete successfully.

```text
RUNNING
  ↓
FAILED
```

The system MUST preserve sufficient failure information to determine whether the failure is retryable.

---

# 10. Valid State Transitions

Only the following transitions are valid:

```text
QUEUED → RUNNING
RUNNING → SUCCEEDED
RUNNING → FAILED
```

The following are invalid:

```text
SUCCEEDED → RUNNING
SUCCEEDED → FAILED
FAILED → RUNNING
FAILED → SUCCEEDED
QUEUED → SUCCEEDED
QUEUED → FAILED
```

Retry behavior MUST NOT be implemented by silently mutating terminal state.

If retry semantics require re-execution, they MUST be represented through an explicit retry mechanism defined by the Execution Runtime.

---

# 11. Idempotency

At-least-once delivery is an intentional property of the Transactional Outbox.

Therefore:

```text
Outbox delivery ≠ exactly once execution
```

A capability MUST tolerate duplicate delivery.

The minimum execution identity for idempotency is:

```text
organizationId + intentId + capabilityId + idempotencyKey
```

A duplicate execution request MUST NOT create duplicate business effects.

For example:

```text
Outbox Event #1
      ↓
CREATE_REFERRAL_CAMPAIGN
      ↓
Campaign #123 created
```

If the same event is delivered again:

```text
Outbox Event #1 duplicate
      ↓
CREATE_REFERRAL_CAMPAIGN
      ↓
Existing execution detected
      ↓
No second campaign
```

The capability MAY implement idempotency using:

* unique database constraints;
* execution records;
* deterministic identifiers;
* existing business records;
* provider idempotency keys.

The specific mechanism belongs to the capability implementation, but the semantic guarantee belongs to the Runtime Contract.

---

# 12. Capability Result

Capabilities MUST return a standardized execution result.

Conceptually:

```typescript
type CapabilityResult<T> =
  | {
      status: "succeeded";
      data: T;
    }
  | {
      status: "failed";
      error: CapabilityError;
    };
```

The result MUST distinguish successful execution from failed execution.

A capability MUST NOT communicate failure solely through arbitrary console output or unstructured strings.

---

# 13. Capability Errors

Capability errors SHOULD be categorized.

Minimum categories:

```text
VALIDATION_ERROR
AUTHORIZATION_ERROR
NOT_FOUND
CONFLICT
RATE_LIMITED
EXTERNAL_SERVICE_ERROR
TRANSIENT_ERROR
PERMANENT_ERROR
UNKNOWN_ERROR
```

The exact enum MAY evolve.

The important architectural distinction is:

```text
retryable
vs.
non-retryable
```

The Execution Runtime SHOULD eventually use this classification to determine retry behavior.

---

# 14. Execution OS Responsibility

The Execution OS owns:

1. capability resolution;
2. capability version resolution;
3. execution context construction;
4. execution lifecycle;
5. idempotency boundary;
6. result normalization;
7. error normalization;
8. mission feedback dispatch.

The Execution OS does NOT own:

* founder approval;
* tenant authorization;
* strategy decisions;
* governance policy;
* client authentication.

Those remain Control Plane responsibilities.

---

# 15. Capability Responsibility

A capability owns:

1. input validation specific to the capability;
2. execution of the requested operation;
3. interaction with its required provider/database boundary;
4. business effect creation;
5. capability-specific idempotency implementation;
6. returning a standardized result.

A capability MUST NOT:

* approve its own Operational Intent;
* change governance state;
* bypass TenantScope;
* directly manipulate Control Plane authority;
* invent a new authorization model.

---

# 16. Capability Registry

Capabilities MUST be registered through a centralized registry.

Conceptually:

```typescript
registry.register({
  id: "CREATE_REFERRAL_CAMPAIGN",
  version: "v1",
  handler: createReferralCampaign,
});
```

The registry becomes the dispatch boundary:

```text
eventType
   ↓
Execution Bridge
   ↓
Execution OS
   ↓
Capability Registry
   ↓
Capability
```

The Execution OS MUST NOT contain large conditional branches such as:

```typescript
if (intentType === "...") {
  ...
} else if (intentType === "...") {
  ...
}
```

Capability discovery belongs to the registry.

---

# 17. Capability Versioning

Capability versions MUST be explicit when compatibility changes.

Non-breaking implementation improvements MAY remain within the same version.

Breaking changes to:

* input contract;
* output contract;
* execution semantics;
* side-effect semantics;

MUST produce a new capability version.

Existing Outbox events MUST remain executable against the version they were created for.

---

# 18. Mission Feedback

Successful and failed executions MUST be observable by the originating Mission.

The intended feedback path is:

```text
Capability Result
      ↓
Execution Feedback Loop
      ↓
MissionEvent
      ↓
Mission Activity
      ↓
Activity UI
```

Minimum feedback information SHOULD include:

```text
missionId
intentId
capabilityId
execution status
timestamp
result/error metadata
correlationId
```

The feedback event is an observation of execution.

It MUST NOT silently mutate governance state.

---

# 19. Transactional Outbox Boundary

The Transactional Outbox remains the handoff mechanism between Control Plane and Execution Plane.

The Control Plane guarantees:

```text
Operational Intent transition
+
Governance Event
+
Outbox Event
```

inside the same PostgreSQL transaction.

After that transaction commits:

```text
Execution Plane
```

owns delivery and execution.

The Outbox Processor MUST NOT become responsible for deciding whether an intent should have been approved.

---

# 20. Failure Semantics

A capability failure MUST NOT corrupt the originating governance state.

For example:

```text
Intent
APPROVED
```

remains approved even if:

```text
Capability
FAILED
```

The failure is represented as an execution outcome.

This distinction is fundamental:

```text
Governance decision ≠ execution outcome
```

A failed execution MAY trigger a later operational decision, but it MUST NOT retroactively rewrite the original approval.

---

# 21. External Side Effects

Capabilities that interact with external providers MUST treat the provider boundary as an at-least-once environment.

Examples:

* Telegram;
* email;
* CRM;
* payment providers;
* external APIs.

The capability SHOULD use provider-native idempotency mechanisms when available.

If no provider idempotency mechanism exists, Pandora's MUST establish an internal execution/idempotency boundary before issuing the external side effect where technically possible.

---

# 22. Security Invariants

The following invariants are frozen.

### INV-01 — No Capability Authority

Capabilities execute approved work. They do not authorize work.

### INV-02 — Tenant Isolation

Every execution remains bound to its originating organization.

### INV-03 — Intent Traceability

Every execution MUST be traceable to an approved Operational Intent.

### INV-04 — At-Least-Once Compatibility

Every capability MUST tolerate duplicate delivery.

### INV-05 — No Silent State Mutation

Execution failures MUST NOT silently mutate Control Plane governance state.

### INV-06 — Central Dispatch

Capability resolution occurs through the Execution Runtime registry.

### INV-07 — Deterministic Lifecycle

Execution states follow the canonical state machine.

### INV-08 — Observable Execution

Every execution produces sufficient information for Mission Activity feedback.

---

# 23. Consequences

## Positive

This ADR provides:

* a common contract for all capabilities;
* predictable execution behavior;
* explicit execution states;
* reusable idempotency semantics;
* centralized dispatch;
* traceability from intent to effect;
* clean separation between Control Plane and Execution Plane;
* a foundation for external integrations.

Adding a new capability becomes primarily:

```text
Define contract
      ↓
Implement capability
      ↓
Register capability
      ↓
Add verification
```

rather than modifying the entire Execution OS.

## Negative

The architecture introduces additional concepts:

* Capability Context;
* Execution State;
* Capability Result;
* Capability Error;
* versioning;
* execution idempotency.

This is intentional complexity.

It prevents much larger complexity from emerging through ad-hoc capability implementations.

---

# 24. Alternatives Considered

## Alternative A — Let every capability define its own contract

Rejected.

This would fragment the Execution OS and make capabilities difficult to monitor and compose.

## Alternative B — Treat Outbox `processed` as execution success

Rejected.

Outbox delivery and capability execution are different concerns.

An event can be successfully consumed while the capability fails.

## Alternative C — Use exactly-once execution

Rejected.

Exactly-once delivery is not assumed at the infrastructure boundary.

Pandora's explicitly adopts:

```text
At-Least-Once Delivery
+
Idempotent Execution
```

## Alternative D — Put authorization inside every capability

Rejected.

This duplicates Control Plane policy and creates multiple authority boundaries.

## Alternative E — Introduce Redis/Kafka/Temporal

Rejected for the current architecture.

PostgreSQL + Transactional Outbox + Execution Runtime is sufficient for the current scale and requirements.

Additional infrastructure MAY be reconsidered when measurable operational requirements justify it.

---

# 25. Sprint 29 Scope

Sprint 29 implements this ADR.

The sprint MUST include:

### 29-A — Capability Contract

Create the canonical capability interfaces and result/error contracts.

### 29-B — Capability Registry

Formalize registration and version resolution.

### 29-C — Execution State

Introduce the canonical execution lifecycle.

### 29-D — Failure & Retry Semantics

Formalize retryable versus terminal execution failures.

### 29-E — Second Real Capability

Implement:

```text
SEND_TELEGRAM_NOTIFICATION
```

as the second real capability, subject to available credentials and test environment.

### 29-F — E2E Verification

Verify:

```text
Approval
 ↓
Outbox
 ↓
Execution Bridge
 ↓
Capability
 ↓
Effect
 ↓
Feedback
 ↓
Activity
```

including duplicate delivery and failure scenarios.

---

# 26. Acceptance Criteria

ADR-018 is considered implemented when:

* [ ] Every capability conforms to the canonical contract.
* [ ] Capability Context is standardized.
* [ ] Capability Registry is centralized.
* [ ] Execution states are explicit.
* [ ] Invalid state transitions are rejected.
* [ ] Capability failures are normalized.
* [ ] Retryable and permanent failures are distinguishable.
* [ ] Duplicate Outbox delivery does not duplicate business effects.
* [ ] Every execution is traceable to an Operational Intent.
* [ ] Mission feedback is generated.
* [ ] `CREATE_REFERRAL_CAMPAIGN` continues to pass existing Sprint 28 tests.
* [ ] `SEND_TELEGRAM_NOTIFICATION` successfully executes in the test environment, or its external boundary is explicitly mocked.
* [ ] Cross-tenant execution is rejected.
* [ ] No capability can bypass Control Plane authorization.
* [ ] No existing Control Plane invariant is weakened.

---

# 27. Verification Blueprint

Sprint 29 MUST include an automated blueprint covering at minimum:

```text
TEST 01 — Capability Registration
TEST 02 — Capability Resolution
TEST 03 — Valid QUEUED → RUNNING transition
TEST 04 — Valid RUNNING → SUCCEEDED transition
TEST 05 — Valid RUNNING → FAILED transition
TEST 06 — Invalid state transition rejection
TEST 07 — Successful capability execution
TEST 08 — Capability failure
TEST 09 — Duplicate delivery
TEST 10 — Idempotent business effect
TEST 11 — Cross-tenant rejection
TEST 12 — Mission feedback
TEST 13 — Existing Sprint 28 regression
```

The blueprint MUST verify database effects, not merely console output.

---

# 28. Operational Observability

The Execution Runtime SHOULD expose structured execution information sufficient to answer:

```text
What executed?
Who authorized it?
For which organization?
For which mission?
Which intent caused it?
Which capability ran?
Which version?
When did it start?
When did it finish?
Did it succeed?
If it failed, why?
Was it retried?
```

Observability MUST NOT become a source of authority.

It is diagnostic only.

---

# 29. Future Extensions

The following are explicitly deferred:

* distributed execution brokers;
* Redis-based execution queues;
* Kafka;
* Temporal;
* generalized workflow orchestration;
* complex DAG execution;
* distributed tracing infrastructure;
* capability marketplace;
* dynamic third-party capability installation.

These MAY be introduced through future ADRs if operational requirements justify them.

---

# 30. Architectural Principle

The core principle established by this ADR is:

> **The Control Plane decides. The Execution Plane acts. The Capability performs. The Mission records the consequence.**

Therefore:

```text
CONTROL PLANE
     │
     │ approved intent
     ▼
   OUTBOX
     │
     ▼
EXECUTION OS
     │
     ▼
 CAPABILITY
     │
     ▼
 REAL EFFECT
     │
     ▼
MISSION FEEDBACK
```

No layer may silently assume the responsibilities of another.

---

# 31. Decision Summary

Pandora's adopts a standardized Capability Runtime with:

```text
Central Registry
+
Capability Contract
+
Capability Context
+
Execution State Machine
+
Idempotent Execution
+
Normalized Results
+
Normalized Errors
+
Mission Feedback
```

The architecture continues to use:

```text
PostgreSQL
+
Transactional Outbox
+
At-Least-Once Delivery
+
Idempotent Consumers
```

without introducing an external message broker.

**ADR-018 is accepted as the governing contract for Sprint 29 and all subsequent Capability Runtime implementations.**
