# HERMES_ADDON_CONTRACT_v1.0

**Status:** `FROZEN`
**Scope:** Hermes Core / Add-On Architecture
**Owner:** Pandora's / Hermes Architecture

## 1. Purpose

Un **Hermes Add-On** es un módulo extensible que agrega capacidades, conocimiento, journeys, estilos de interacción o integraciones especializadas a un Tenant sin modificar ni debilitar los invariantes del Hermes Core.

El Add-On **extiende** Hermes.
No redefine Hermes.

### Core Principle
```text
Hermes Core
    +
Tenant Configuration
    +
Installed Add-Ons
    ↓
Effective Cognitive Runtime
```

---

## 2. Add-On Contract

Todo Add-On MUST declarar un `HermesAddOnManifest`.

```ts
interface HermesAddOnManifest {
  id: string;
  version: string;
  name: string;
  description: string;
  category: AddOnCategory[];
  status: AddOnDefinitionStatus;
  capabilities?: CapabilityDefinition[];
  knowledgeOverlays?: KnowledgeOverlayDefinition[];
  journeys?: JourneyDefinition[];
  styleOverlay?: StyleOverlayDefinition;
  requiredChannels?: ChannelRequirement[];
  governanceRequirements?: GovernanceRequirement[];
  configurationSchema?: ConfigurationSchema;
  compatibility?: CompatibilityContract;
}
```

---

## 3. Add-On Categories

Un Add-On puede pertenecer a una o varias categorías:
- **CAPABILITY**: Agrega una capacidad funcional (ej. PROACTIVE_CLOSER)
- **STRATEGY**: Agrega una estrategia comercial (ej. VIP_FAMILY_CONCIERGE)
- **JOURNEY**: Agrega journeys especializados
- **INTEGRATION**: Agrega acceso a infraestructura externa

---

## 4. Add-On Invariants

Todo Add-On MUST obey:
- **A1 — Tenant Isolation**: Opera solo dentro del `ControlPlaneContext`.
- **A2 — Governance Supremacy**: Add-On -> Policy -> Governance -> Execution.
- **A3 — Knowledge Scope**: Todo knowledge debe tener metadata validada. No bypass del `ScopeValidator`.
- **A4 — Memory Boundary**: Contact Memory ≠ Tenant Knowledge.
- **A5 — Channel Authority**: Puede requerir un canal, pero no autorizarlo.
- **A6 — Auditability**: Toda acción produce eventos auditables.
- **A7 — Version Integrity**: Ejecuta una versión explícita (ej. `1.0.0`).
- **A8 — No Core Override**: No puede invalidar reglas de seguridad del Core.

---

## 5. Effective Runtime

```text
1. Core Safety / Security
2. Governance / Policy
3. Tenant Identity
4. Tenant Soul
5. Tenant Knowledge
6. Add-On Constraints
7. Add-On Knowledge
8. Add-On Journey
9. Add-On Style Overlay
10. Conversation / Contact Memory
11. Current Message
```
**Ninguna capa inferior puede invalidar una superior.**

---

## 6. Forbidden Behavior

Un Add-On MUST NOT:
- Modificar directamente tablas fuera de su bounded context
- Cambiar `organizationId`
- Insertar conocimiento sin metadata
- Promover `DISCOVERED → ACTIVE` por sí mismo
- Autorizar canales
- Ejecutar acciones sin Governance
- Acceder a Contact Memory global o de otro Tenant
- Alterar Core Soul o Core Security Policy
