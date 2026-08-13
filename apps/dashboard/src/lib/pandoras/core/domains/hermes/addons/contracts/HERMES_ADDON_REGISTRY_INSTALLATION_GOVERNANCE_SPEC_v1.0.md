# HERMES ADD-ON REGISTRY & INSTALLATION GOVERNANCE SPECIFICATION v1.0

## Invariant
> **An Add-On may extend Hermes capabilities, but it can never acquire authority over Tenant identity, knowledge, governance, authorization, or execution.**

## 1. Objetivo
Convertir el ecosistema de Add-Ons en un sistema multi-tenant, persistente, gobernado y auditable. Un Tenant descubre, solicita, configura, aprueba y activa Add-Ons bajo las estrictas reglas de `ControlPlaneContext`.

## 2. Add-On Manifest Contract
El Manifest declara explícitamente las capacidades del Add-On. No declara autoridad.

```typescript
interface HermesAddOnManifest {
  id: string
  name: string
  version: string
  type: "CAPABILITY" | "KNOWLEDGE_OVERLAY" | "JOURNEY_PACK" | "CHANNEL_EXTENSION" | "COMPOSITE"
  description: string
  capabilities: AddOnCapability[]
  knowledgeOverlays?: KnowledgeOverlay[]
  journeyDefinitions?: JourneyDefinition[]
  governanceRequirements: AddOnGovernanceRequirements
  configurationSchema?: AddOnConfigurationSchema
  compatibility: AddOnCompatibility
  status: "AVAILABLE" | "DEPRECATED"
}
```

## 3. Installation State Machine
La máquina de estados es cerrada y explícita:

```text
INSTALLING ────→ CONFIGURING ────→ PENDING_APPROVAL ────→ ACTIVE
    │                 │
    ↓                 ↓
  FAILED            FAILED

ACTIVE ────→ SUSPENDED ────→ ACTIVE
ACTIVE ────→ DEACTIVATING ────→ DEACTIVATED
```
*Prohibido:* `DEACTIVATED → ACTIVE` directamente.

## 4. Governance & Human Approval
El Manifest propone requisitos de gobernanza (ej. `requiresHumanApproval`), pero el Policy Engine decide. La decisión final debe recaer sobre un humano autenticado si la política lo exige, nunca ser auto-aprobada por el Add-On.

## 5. Knowledge Overlay Boundary
Un Add-On no puede inyectar conocimiento `ACTIVE` directamente. Todo conocimiento superpuesto debe pasar por la Governance de Conocimiento (Discovery → Pending Review → Human Approval → Active).

## 6. Context Merger v2
Produce el `Effective Cognitive Context` bajo la siguiente regla de precedencia estricta:
**System/ADR-011 > Tenant Governance > Tenant Soul > Tenant Knowledge > Add-On Capabilities > Add-On Style Overlay**

## 7. Audit Trail
Registro `append-only` de toda mutación. Mínimos obligatorios: `INSTALL_REQUESTED`, `CONFIGURATION_UPDATED`, `SUBMITTED_FOR_APPROVAL`, `APPROVED`, `REJECTED`, `ACTIVATED`, `SUSPENDED`, `DEACTIVATED`, `VERSION_UPDATED`.
