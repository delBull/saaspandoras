# HERMES KNOWLEDGE GOVERNANCE CONSOLE
**Phase 6.8 — Formal Architecture & Governance Contract v1.0**
*Status: Proposed / Architecture Contract*
*Phase: 6.8*
*Depends on: Phase 6.6 Cognitive Runtime, Phase 6.7 Proactive Intelligence*

## 1. Core Principle: Discovery is not Authority
Hermes puede descubrir conocimiento, pero el Tenant lo gobierna.
El ciclo inmutable será:
`DISCOVERED → Owner Review → APPROVED/REJECTED → ACTIVE → SUPERSEDED`

Nunca: `LLM → modify Knowledge → immediate active`
La Console **no es una autoridad**, la autoridad reside en el `ControlPlaneContext` y los `Governance Commands`.

## 2. Las 3 Dimensiones del Control Plane Cognitivo
La Console controlará 3 áreas distintas:
1. 🧠 **Knowledge Governance**: Qué sabe Hermes y con qué autoridad. (10 dimensiones)
2. 🧩 **Add-On Governance**: Qué capacidades (ej. Proactive Closer) están instaladas y activas. (Install ≠ Active)
3. ⚖️ **Cognitive Governance**: Qué puede decir, proponer y ejecutar (Channel Authority, Human Approvals).

## 3. The 10 Knowledge Dimensions & Authority Matrix
1. **Identity** (Owner/Admin)
2. **Business** (Owner/Admin)
3. **Brand** (Brand Admin)
4. **Agent Soul** (Special Governance Review required, LLM cannot auto-modify)
5. **Projects** (Tenant-owned)
6. **Products** (Highly protected: Canonical Authority required)
7. **Market** (Distinguish Fact vs Hypothesis)
8. **Operations** (Internal processes, SLA)
9. **Governance** (Highest Protection: Discovered rules do not affect execution until explicitly approved)
10. **Public** (Internal → Public Review → Public Active)

## 4. Lifecycle & Versioning
- Las mutaciones generan nuevas versiones (Event Sourcing ligero).
- `ACTIVE v2 → Edit → NEW v3 DISCOVERED → Review → ACTIVE v3`
- `SUPERSEDED → ACTIVE` directamente está prohibido.
- `DELETE ACTIVE` está prohibido. El conocimiento se rechaza o se supersede (auditabilidad).

## 5. Audit & Exclusion Register
- Toda mutación produce un `KnowledgeMutationEvent` (append-only).
- Se expondrá un **Exclusion Register** para demostrar qué conocimiento tiene prohibido usar Hermes (SUPERSEDED, RESTRICTED, WRONG TENANT).

## 6. Proactive Engine Integration
El Proactive Engine (Phase 6.7) **solamente** puede utilizar `ACTIVE Knowledge` + `ACTIVE Policies` + `AUTHORIZED Contact Memory`. Si el precio de un producto es `DISCOVERED`, Hermes tiene prohibido usarlo proactivamente.

## 7. Zero Contamination (Tenant Isolation)
`organizationId != snarai` asegura que el conocimiento de un Tenant jamás cruza al runtime de otro (C6.10). `Global Knowledge` ≠ `Tenant Knowledge`.

## 8. Definition of Done (Phase 6.8)
Se implementarán las primitivas de backend primero:
- State Machine & Lifecycle.
- `Governance Commands` (discover, edit, approve, reject, supersede).
- `Audit Events`.
Y luego se construirá la **Knowledge Governance Console UI**, que será puramente un consumidor de estos comandos.
