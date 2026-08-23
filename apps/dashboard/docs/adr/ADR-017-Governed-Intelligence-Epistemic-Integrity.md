# ADR-017 — Governed Intelligence, Epistemic Integrity & Material Claim Invariants

**Status:** ACCEPTED (Baseline K26.2.1 Frozen)  
**Date:** 2026-08-23  
**Authors:** Hermes Core & Governance Architecture  
**Related ADRs:** ADR-000, ADR-001, ADR-011, ADR-015  

---

## 1. Contexto

Con la culminación de los hitos **K25** (Sanitización y Bóveda Soberana IPFS), **K25.5** (Multi-tenant Cryptographic Bridge), **K26** (Claim Contracts & Epistemic Framing), **K26.1** (Provenance, Disclosure Clearance & Coverage Granular) y **K26.2.1** (Runtime Integrity, Tenant Binding & Adversarial Intersection), Hermes ha evolucionado de un modelo RAG tradicional a un **Runtime de Inteligencia Gobernada**.

Para asegurar la longevidad institucional y evitar sobreafirmaciones o degradaciones accidentales en futuras optimizaciones, este ADR congela los principios epistemológicos, las garantías formales y los invariantes no negociables de la arquitectura.

---

## 2. Principios Arquitectónicos Fundamentales

### A. Epistemic Integrity $\neq$ Factual Truth (Integridad Epistemológica vs Verdad Fáctica)
- **Garantía Formal de Hermes**:
  > *"Esta afirmación material está respaldada por la autoridad epistemológica registrada en el Claim Contract activo y anclado a IPFS con firma EIP-712."*
- **Límite Explícito**:
  - Hermes garantiza que el LLM no puede alucinar, inventar rendimientos, extrapolar hechos históricos a promesas futuras ni violar clasificaciones de divulgación (`SECRET` / `CONFIDENTIAL`).
  - Hermes **no** garantiza la verdad fáctica absoluta del universo físico si la entidad emisora original registró datos erróneos en su contrato de gobernanza. La responsabilidad de veracidad fáctica reside en la autoridad firmante del contrato.

### B. Invariante de Cobertura: `FALSE NEGATIVE > FALSE POSITIVE`
- **Regla de Oro en Claims Materiales**:
  Para cualquier afirmación de naturaleza financiera, comercial, legal o contractual:
  $$\text{FALSE NEGATIVE (Bloquear afirmación legítima)} \gg \text{FALSE POSITIVE (Permitir afirmación no respaldada)}$$
- **Prohibición de Relajación Semántica**:
  Queda terminantemente prohibido sustituir el matching proposicional determinista y canónico de `evaluateClaimCoverage` por aproximaciones semánticas o de similitud laxa de LLM para "reducir falsos bloqueos". Si una cláusula no cuenta con respaldo explícito e inequívoco en el contrato activo, el sistema **debe fallar cerrado (BLOCK)**.

### C. Alcance de Certificación K26.2.1
- **Declaración Institucional**:
  El 100% de los vectores adversariales modelados en la suite `K26.2.1` (Inyección de prompts, revelación no autorizada de secretos, extrapolación de rendimientos no sustentados, suplantación de CIDs inter-tenant y replay de recibos EIP-712) fueron contenidos fail-closed por el pipeline de gobernanza.

---

## 3. Arquitectura del Pipeline de Salida Canónica

Toda emisión de afirmaciones gobernadas debe cumplir el siguiente flujo secuencial determinista:

```text
                  ┌─────────────────────┐
                  │ Sovereign Knowledge │
                  │       IPFS          │
                  └──────────┬──────────┘
                             ↓
                    Claim Contracts
                             ↓
                  Integrity Verification
                             ↓
                  Governance Lifecycle (ACTIVE vs SUPERSEDED / SHADOW)
                             ↓
                   Disclosure Clearance (PUBLIC vs SECRET)
                             ↓
                     Tenant Binding (CIDs & Signers)
                             ↓
                    Cognitive Context
                             ↓
                           LLM
                             ↓
                  Claim Coverage / Policy Lattice
                             ↓
                    Final Output
                             ↓
               normalizeCanonicalPayload()
                             ↓
                    Response Hash (SHA-256)
                             ↓
               ClaimProvenanceReceipt (EIP-712)
                             ↓
                        USUARIO
```

---

## 4. Siguiente Frontera Institucional: Watch Item (K27 / Kernel Boundary)

Habiendo certificado que el pipeline cognitivo (`HermesRuntime.respond()`) gobierna sus salidas:
- **Próximo Objetivo de Auditoría**:
  Verificar la cobertura integral de gobernanza sobre **todos los canales productores de respuestas al usuario** (Journeys programados, herramientas autónomas, campañas, webhooks salientes, streaming, respuestas de voz y comercio) para asegurar que ningún subsistema pueda emitir afirmaciones no gobernadas al cliente final.

---

## 5. Decisión

**ADR-017 queda formalmente ACEPTADO** como la baseline congelada de Gobernanza Epistemológica de Hermes OS.
