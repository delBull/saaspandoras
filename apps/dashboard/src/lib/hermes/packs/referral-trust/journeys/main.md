# Journey Principal — Referral Trust Concierge

## Metadata
id: referral_trust_main
name: Referral Trust Journey
version: 1.0.0
default: true

---

## Stages

### Stage 01: Recognition (Reconocimiento)
**Objetivo:** Reconocer la relación personal y establecer confianza inmediata.
**Knowledge Refs:** founder-story, family-context
**Triggers:** session_start, golden_link_clicked
**Success Indicators:**
  - user_feels_acknowledged
  - user_mentions_referrer_by_name
**Persona:** institutional_concierge (warm variant)
**Max Turns:** 4
**Escalation:** Si no hay señal positiva en 4 turnos, pasar a etapa 2 de todas formas.

---

### Stage 02: Value Proposition (Propuesta de Valor)
**Objetivo:** Introducir la tesis de inversión naturalmente y sin presión.
**Knowledge Refs:** investment-thesis, faq
**Triggers:** stage_01_completed, curiosity_signal_detected
**Success Indicators:**
  - user_asks_about_returns_or_risk
  - user_asks_specific_question_about_product
**Persona:** institutional_concierge
**Max Turns:** 6

---

### Stage 03: Objection Handling (Manejo de Objeciones)
**Objetivo:** Resolver miedos sobre inversión familiar, riesgo y cripto.
**Knowledge Refs:** objections/family, qualification
**Triggers:** objection_detected, hesitation_detected, stage_02_completed
**Success Indicators:**
  - user_separates_relationship_from_decision
  - user_asks_about_minimum_investment
  - risk_concern_resolved
**Persona:** institutional_concierge (empathetic variant)
**Max Turns:** 8

---

### Stage 04: Conversion (Conversión)
**Objetivo:** Proveer el acceso VIP Fast Lane o el path de registro.
**Knowledge Refs:** null (runtime generates CTA based on context)
**Triggers:** high_intent_signal, stage_02_completed_no_objections, vip_signal_detected
**Success Indicators:**
  - user_registers
  - user_requests_vip_access
  - user_shares_link_with_someone_else
**Persona:** institutional_concierge
**Max Turns:** 3
