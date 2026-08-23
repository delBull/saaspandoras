# ADR-018 — Tenant Sovereignty, Authority Manifest & Pre-Runtime Gateway

**Status:** PROPOSED (Architecture Gate for Milestone K27)  
**Date:** 2026-08-23  
**Authors:** Hermes Core & Multi-Tenant Governance Architecture  
**Related ADRs:** ADR-000, ADR-001, ADR-005, ADR-011, ADR-015, ADR-017  

---

## 1. Contexto & Problema

Tras consolidar y congelar la gobernanza de inferencia en **K26.2.1** (ADR-017), el reto actual es extender esta soberanía hacia **tenants externos arbitrarios** sin requerir archivos TypeScript hardcodeados (como `snarai-soul.ts`) ni scripts manuales de sincronización.

Para evitar conflictos de autoridad ("¿cuál identidad gana entre DB, IPFS y código?") y evitar que la generación automática de claims convierta texto no verificado en verdad institucional, este ADR define los 4 contratos fundacionales de la soberanía de tenants.

---

## 2. Jerarquía de Autoridad: IPFS como Autoridad Canónica, DB como Índice

$$\text{Signed Authority Manifest en IPFS (Autoridad Canónica)} \longrightarrow \text{DB Metadata (Caché e Índice Operacional)}$$

1. **IPFS**: Fuente única e inmutable de verdad criptográfica (manifiestos firmados con EIP-712 por la Agent Wallet del tenant).
2. **PostgreSQL (Neon)**: Índice operacional para búsquedas rápidas, enrutamiento y agregación analítica. En caso de discrepancia, la firma de IPFS invalida cualquier estado en DB.

---

## 3. Los 4 Contratos Fundacionales

### Contrato 1: `TenantAuthorityManifest` (Root de Autoridad del Tenant)
El root criptográfico anclado a IPFS que agrupa todos los artefactos de gobernanza del tenant:

```typescript
export type TenantGovernanceLifecycleStatus = 
  | 'DRAFT'
  | 'PENDING_ACTIVATION'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'ARCHIVED';

export interface TenantAuthorityManifest {
  manifestVersion: '1.0.0';
  tenantId: string;
  version: number;
  
  // Enlaces criptográficos a los sub-manifiestos anclados en IPFS
  identityManifestCid: string;   // CID de TenantIdentitySoulManifest
  claimContractCid: string;      // CID de TenantClaimContract activo
  policyManifestCid: string;     // CID de Policy Lattice y clearances
  
  // Identidad Web3 del Agente para este Tenant
  agentWalletAddress: string;
  
  // Metadatos de Gobernanza
  governanceStatus: TenantGovernanceLifecycleStatus;
  merkleRoot: string;            // Raíz Merkle de todos los claims activos
  previousManifestCid?: string;  // Linaje inmutable de supercesión
  
  // Firma Criptográfica Institucional
  signedAt: string;
  agentSignature: string;        // Firma EIP-712 sobre el payload
}
```

### Contrato 2: `TenantIdentitySoulManifest` (Identidad y Políticas Declarativas)
Define quién es el agente, cómo habla y qué reglas de escalación aplica, sin una sola línea de código estático:

```typescript
export interface TenantIdentitySoulManifest {
  tenantId: string;
  version: number;
  agentName: string;
  organizationName: string;
  persona: string;
  voice: string;
  tone: {
    dos: string[];
    donts: string[];
  };
  languagePolicy: {
    avoidAsDefault: string[];
    preferred: Record<string, string>;
    allowedWhenAsked: string[];
  };
  claimsPolicy: {
    prohibited: string[];
    requiredQualification: string[];
  };
  escalationPolicy: {
    legalQuestions: 'ESCALATE' | 'ANSWER' | 'HANDOFF';
    taxQuestions: 'ESCALATE' | 'ANSWER' | 'HANDOFF';
    customInvestmentAdvice: 'ESCALATE' | 'ANSWER' | 'HANDOFF';
    unavailableProjectData: 'ESCALATE' | 'ANSWER' | 'HANDOFF';
    founderRequest: 'ESCALATE' | 'ANSWER' | 'HANDOFF';
    outOfScopeQuestion: 'ESCALATE' | 'ANSWER' | 'HANDOFF';
  };
  canonicalUrls: Record<string, string>;
  closingSignature: string;
}
```

### Contrato 3: `TenantClaimContract` & Ciclo de Vida Extendido
Separación estricta entre claims determinísticos e interpretativos:

```text
Claims Determinísticos (Campos estructurados en DB) ──► Compilación directa a FACT
Claims Interpretativos (Proyecciones, derechos, rendimientos) ──► Requieren flujo:
  DRAFT ──► REVIEW ──► AUTHORIZED ──► SIGNED ──► ACTIVE
                                                   │
                                                   ├──► SUPERSEDED
                                                   ├──► DEPRECATED
                                                   └──► REVOKED
```

### Contrato 4: `TenantControlPlaneContext` & `IntegrationCredential` (Pre-Runtime Gateway)
La resolución de identidad y tenant ocurre estrictamente **antes** de ingresar a Hermes Runtime:

```typescript
export interface IntegrationCredential {
  credentialId: string;
  tenantId: string;
  publicKey: string;             // pk_live_...
  secretHash: string;            // SHA-256 de sk_live_...
  environment: 'PRODUCTION' | 'STAGING' | 'SANDBOX';
  status: 'ACTIVE' | 'REVOKED';
  scopes: Array<
    | 'chat:public'
    | 'chat:authenticated'
    | 'governance:read'
    | 'governance:admin'
    | 'claims:publish'
  >;
  allowedOrigins: string[];      // Dominios autorizados para CORS / Widget
  allowedChannels: string[];     // ['PORTAL', 'TELEGRAM', 'WIDGET', 'API']
  createdAt: Date;
  revokedAt?: Date;
}
```

**Invariante del Gateway**:
$$\text{credential.tenantId} \equiv \text{resolvedControlPlaneContext.tenantId}$$
Si la clave pertenece a `tenant_a` pero el header o payload indica `tenant_b`, el gateway deniega la petición de inmediato con `HTTP 403 Forbidden` (`TENANT_CREDENTIAL_MISMATCH`) antes de cargar cualquier contexto cognitivo.

---

## 4. Estructura de Milestones K27 (Tenant Sovereignty & Kernel Output Boundary)

| Hito | Nombre | Alcance Principal |
|---|---|---|
| **K27.0** | **Tenant Authority Core** | Tipos, esquemas y serializadores de `TenantAuthorityManifest` e `IdentitySoulManifest` en IPFS. |
| **K27.1** | **Claim Provisioning Studio** | Lifecycle `DRAFT` $\to$ `REVIEW` $\to$ `ACTIVE`, separación de claims determinísticos vs interpretativos. |
| **K27.2** | **Pre-Runtime Tenant Gateway** | Middleware de resolución de tenant, validación de credenciales y binding estricto pre-Hermes. |
| **K27.3** | **Credential Management** | Emisión, rotación y validación de scopes/orígenes (`IntegrationCredential`). |
| **K27.4** | **Tenant Governance Console** | Feed de eventos de seguridad y denegaciones, lifecycle de tenant (`ACTIVE` / `SUSPENDED`). |
| **K27.5** | **Navigable Receipt Explorer** | Vista DAG interactiva para inspección pública de recibos EIP-712 y CIDs vinculados. |
| **K27.6** | **Channel Provisioning Mesh** | Whitelabel Widget SDK embebible y enlace dinámico de bots de Telegram. |
| **K27.7** | **Kernel Output Boundary** | Extensión de la frontera de gobernanza a Journeys, Campaigns, Commerce y Streams. |

---

## 5. Decisión

**ADR-018 queda formalmente PROPUESTO** para guiar la ejecución de la fase K27 sin riesgos de desalineación arquitectónica.
