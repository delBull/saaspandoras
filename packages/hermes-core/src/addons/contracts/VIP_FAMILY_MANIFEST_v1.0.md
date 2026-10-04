# VIP_FAMILY_MANIFEST_v1.0

**Status:** `REFERENCE IMPLEMENTATION`
**Tenant inicial:** S'Narai
**Type:** Strategy + Journey + Knowledge Overlay + Style Overlay

---

## 1. Identity
```yaml
id: vip_family_concierge
version: 1.0.0
name: VIP Family Concierge
category:
  - STRATEGY
  - JOURNEY
status: ACTIVE
```
No existe ninguna dependencia arquitectónica obligatoria con S'Narai.

---

## 2. Purpose
Proporciona a un Tenant la capacidad de administrar un programa privado de referrals, círculos preferenciales, invitaciones y relaciones de confianza. No define producto, precio, ni condiciones legales del Tenant.

---

## 3. Capabilities
`vip_referral_management`, `vip_lead_recognition`, `vip_contextual_conversation`, `vip_lead_qualification`, `vip_founder_connection`, `vip_followup`. Las capacidades quedan subordinadas a Governance.

---

## 4. Knowledge Overlay
Aporta conocimiento estratégico (referral strategy, trust principles, etc.). **NO puede contener Contact Memory global**.

---

## 5. Contact Memory Boundary
Información de familiares, relaciones, historiales, debe vivir EXCLUSIVAMENTE en Contact Memory. Nunca en el Knowledge del Add-On (ej. no `family-context.md` global).

---

## 6. Knowledge Metadata
Todo Knowledge Overlay debe declarar metadata completa (`organizationId`, `visibility`, `authority`, `status`, `source`). No puede promover automáticamente `DISCOVERED → ACTIVE`.

---

## 7. Referral Trust Journey
`REFERRAL_TRUST → RECOGNITION → CONTEXT → TRUST_BUILDING → QUALIFICATION → FOUNDER_CONNECTION → NEXT_STEP`.
Propone únicamente acciones autorizadas.

---

## 8. Style Overlay
No reemplaza el Tenant Soul. Define:
```yaml
style:
  mode: institutional_concierge
  warmth: high
  exclusivity: high
  directness: high
  pressure: low
  personalization: high
```
Si hay conflicto, **Tenant Soul prevalece**.

---

## 9. Proactive Integration
Puede registrar señales (`VIP_HESITANT_BUYER`, `VIP_HIGH_INTENT`). Nunca ejecuta directamente, pasa por Governance Gate.

---

## 10. Channel Requirements
Declara preferencia (`whatsapp`, `telegram`), no autorización. La autoridad definitiva es del Tenant + Governance.

---

## 11. Human Approval
Requiere aprobación humana por defecto para `financial_claims`, `legal_claims`, `exceptional_terms`, `founder_commitment`.

---

## 12. Tenant Configuration
Cada Tenant configura su propia instancia.
```json
{
  "addonId": "vip_family_concierge",
  "version": "1.0.0",
  "configuration": {
    "programName": "Familia Fundadores",
    "referralMode": "PRIVATE",
    "founderAccess": true,
    "requiresHumanApproval": true
  }
}
```

---

## 13. Security Invariants
MUST NOT acceder a otro Tenant, cambiar `organizationId`, escribir Governance directamente, aprobar sus propios claims, enviar sin Governance, ni modificar Core Soul/Security.

---

## 14. Acceptance Criteria
Instalable sin referencias a S'Narai, Isolation probado entre Tenants, Governance funcional, Proactive Intents no se saltan Execution, Auditoría completa.
