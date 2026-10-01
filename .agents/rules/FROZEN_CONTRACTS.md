---
trigger: always_on
---
# FROZEN_CONTRACTS.md — Pandora's Architectural Contracts

## FROZEN CONTRACTS

Este documento registra contratos arquitectónicos que no deben modificarse
incidentalmente durante feature development.

Modificar un contrato aquí listado requiere:

identificar todos los consumidores,
documentar impacto,
proponer estrategia de migración,
obtener aprobación explícita,
actualizar este documento,
implementar migración compatible cuando corresponda.

### FC-001 — Canonical Tenant Identity

La identidad de organización canónica es canonicalOrgId.

Slugs, nombres comerciales y valores enviados por frontend no son autoridad.

### FC-002 — Control Plane

ControlPlaneContext es la fuente autorizada para contexto operativo.

No crear contexts paralelos que puedan representar autoridad diferente.

### FC-003 — Authorization

La autorización sigue:

Identity
→ Membership / Relationship
→ Capability
→ Policy
→ Resource Scope
→ Execution Authority

Role ≠ Capability ≠ Execution Authority.

### FC-004 — Hermes

Hermes propone.

Governance autoriza/dispone.

Operations ejecuta.

El LLM nunca es una frontera de autorización.

### FC-005 — Hermes Runtime Configuration

La fuente canónica de runtime configuration es:

projects.tenantRuntimeConfig

No recrear tablas legacy de runtime configuration únicamente porque
existan referencias históricas.

### FC-006 — Resource Scope

Los read adapters y servicios de inteligencia reciben un ResourceScope
ya autorizado.

No deben derivar autoridad a partir de:

slug,
projectId recibido directamente,
resourceId recibido directamente,
frontend state,
prompt,
LLM output.

### FC-007 — Payment Core

Payment Core controla:

intent
→ settlement
→ reconciliation
→ event

La consecuencia específica pertenece al vertical adapter.

Payment Core no debe convertirse en autoridad de Growth, RWA u otros
dominios.

### FC-008 — Payment Context Separation

Existen contextos conceptualmente independientes:

PrivatePaymentContext
PlatformBillingContext
TenantCommerceContext

No utilizar un contexto como shortcut de otro.

### FC-009 — Omnichannel

Channel ≠ Surface.

La normalización de mensajes no constituye autorización.

El flujo conceptual es:

Channel
→ Normalize
→ Authenticate
→ Resolve Identity
→ Resolve Tenant
→ Capability
→ Policy
→ Resource Scope
→ Authorized Context
→ Hermes

### FC-010 — Memory

Conversation ≠ Canonical Memory.

Canonical Memory es tenant-scoped e identity-scoped por defecto.

Nunca asumir memoria cross-tenant.

Nunca permitir:

LLM → INSERT memory

sin validación, provenance y memory policy.

### FC-011 — Production Truth

Datos reales deben provenir de fuentes reales.

No fabricar:

metrics,
IDs,
CIDs,
hashes,
transactions,
balances,
identities,
provider states.

Unavailable ≠ zero.

Unknown ≠ false.

### FC-012 — Simulation

Simulation Mode y Production Mode deben estar explícitamente separados.

Simulation no puede convertirse silenciosamente en production.

Activation es server-authoritative y auditable.

### FC-013 — Secrets

Secrets no son:

identidad,
authority,
UI state,
database content,
logs.

Nunca exponerlos al cliente.

### FC-014 — Presentation

Display Engine, responsive behavior y UI state son presentation-only.

No pueden alterar:

Identity
Capability
Policy
Resource Scope
Execution

### FC-015 — Database Evolution

Schema evolution siempre ocurre mediante nuevas migrations.

Nunca editar una migration ya aplicada.

El schema declarado y el schema real deben verificarse independientemente.

---

## Change Protocol

Si una tarea parece requerir modificar un Frozen Contract:

STOP
→ Explain which contract is affected
→ Explain why current architecture is insufficient
→ Map consumers
→ Propose compatible alternatives
→ Wait for explicit approval

No realizar el cambio silenciosamente como parte de una feature.
