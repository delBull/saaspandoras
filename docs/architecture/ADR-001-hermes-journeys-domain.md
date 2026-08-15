# ADR-001: Hermes Journeys Domain Architecture

## Status
Approved

## Context
Hermes requires a "Dynamic Goal Engine" (Journeys) to move from a hardcoded conversation state (`JourneyEngine` with static mocks) to a dynamic, tenant-configurable, persistent journey system.
However, introducing this system directly into the production cognitive pipeline carries an unacceptable risk of destabilizing the current go-live (Launch Mode).

## Decision
We will build the **Architectural Foundation** of Hermes Journeys as an isolated, pure domain layer.
This domain will be fully tested and persisted in the database, but **will not be wired to the production HermesRuntime** until a future, explicit "Journey Runtime Activation" gate is passed.

## Invariants
The following rules are mandatory and cannot be overridden by implementation convenience.

### INV-J01 — Tenant Authority
All Journey objects must belong to a canonical `organizationId`. 
**Never** use `slug` as an authorization identity. `slug` is exclusively for portal navigation.

### INV-J02 — Actor Authority
`hermes_actor_journeys` must use the canonical actor identifier produced by the omnichannel identity layer.
Do not store or convert `telegramChatId`, phone numbers, or discord IDs directly as business identities.

### INV-J03 — Definition ≠ State
`JourneyDefinition` (the template) and `ActorJourneyState` (where a user currently is) are strictly separated entities.

### INV-J04 — LLM Is Proposer
The LLM **never** writes directly to the Journey state.
The LLM only produces a `JourneyActionProposal`.
The proposal must pass through: `Journey Governance -> Transition Validator -> Persistence`.

### INV-J05 — Tenant Isolation
Every repository query or mutation must explicitly verify `organizationId`.
No global queries depending only on `journeyId` or `actorId` are allowed.

### INV-J06 — Versioning
Journeys must support immutable versioning.
An actor started under `Journey v1` must not be silently moved to `Journey v2`. Changes to a journey create a new version.

### INV-J07 — Explicit Transitions
State transitions must be explicitly modeled as a graph in persistence (`hermes_journey_transitions`).
Do not use informal `allowedTransitions: string[]` inside stages as permanent domain authority.

### INV-J08 — Engine is Authority
Only the domain/validator determines if a proposal can become a transition. The LLM only proposes.

### INV-J09 — Persistence is Consequence
The database repository only persists validated decisions; it does not decide cognitive rules.

### INV-J10 — Production Safety
Until explicitly activated, `HermesRuntime`, `TelegramAdapter`, `WhatsAppAdapter`, and the cognitive pipeline will not import or execute Journeys.

## Consequences
- The domain layer is pure and testable without LLMs or HTTP.
- Production is safe while the schema and engine mature.
- Future LLM autonomous capabilities are constrained by mathematical graph transitions, preventing arbitrary state mutations.
