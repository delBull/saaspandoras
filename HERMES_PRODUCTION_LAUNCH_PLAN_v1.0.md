# HERMES_PRODUCTION_LAUNCH_PLAN_v1.0.md

**Status:** ACTIVE
**Phase:** Post-6.12 Cognitive Runtime → Production
**Objective:** First Real Tenant / First Real User
**Execution Principle:** Ship the governed system before expanding the system.

---

# 1. Executive Decision

Hermes ha completado la construcción y certificación de su núcleo cognitivo gobernado.
La siguiente etapa **NO consiste en agregar más arquitectura cognitiva**.

Consiste en conectar las piezas existentes y operar Hermes con:
- un tenant real, conocimiento real, identidad real
- un modelo real, usuarios reales, observabilidad real, un canal real

---

# 2. Production Principle

## Hermes debe ser usable antes de ser completo.

| ✅ Permitido | ❌ Bloqueado inicialmente |
|---|---|
| Conversaciones | Ejecución autónoma de herramientas |
| Memoria | Movimientos financieros |
| Conocimiento | Cambios irreversibles |
| Identidad | Operaciones externas autónomas |
| Streaming | Acciones con impacto contractual |
| Capabilities informativas | Acciones regulatorias |
| Recomendaciones / suggested actions | Ejecución sin aprobación humana |
| Governance / Auditoría / Analytics | — |

---

# 3. Launch Gates

```
G0 Architecture Freeze ← DONE ✅
       ↓
G1 Infrastructure
       ↓
G2 Real LLM (OllamaReasoningProvider)
       ↓
G3 First Real Tenant
       ↓
G4 Real Knowledge
       ↓
G5 Real Conversation
       ↓
G6 First Real Channel (Portal)
       ↓
G7 GO-LIVE 🚀
```

---

# 4. G0 — Architecture Freeze ✅ DONE

### Frozen contracts (no modificar salvo bug crítico)
- `HermesCognitiveRuntime`, `RuntimeInput`, `RuntimeResponse`
- `ReasoningContext`, `ReasoningProvider`
- `ConversationMemoryProvider`, `RuntimePolicyValidator`
- `RuntimeTraceRecorder`, `ControlPlaneContext`, `ContextAdapter`

### Certification scorecard
| Suite | Result |
|---|---|
| K11 Core Runtime | 25/25 ✅ |
| Conversational Memory | 7/7 ✅ |
| Governed Streaming | 15/15 ✅ |
| Portal Transport | 6/6 ✅ |

---

# 5. G1 — Production Infrastructure

```env
HERMES_ENV=production
HERMES_REASONING_PROVIDER=ollama
OLLAMA_BASE_URL=<url>
OLLAMA_MODEL=<model>
DATABASE_URL=<neon-pooler>
HERMES_RUNTIME_VERSION=1.0
HERMES_POLICY_VERSION=1.1
HERMES_ENABLED=true
```

**Security rule:** Ninguna credencial entra en ReasoningContext · EffectiveCognitiveContext · RuntimeTrace · ConversationMemory · Prompt

---

# 6. G2 — Real LLM

Reemplazar `MockReasoningProvider` → `OllamaReasoningProvider` sin modificar:
`HermesRuntime` · `Policy` · `Governance` · `Memory` · `ContextAdapter`

Model config (Runtime-owned, never user-configurable):
- `temperature`: low · `maxTokens`: bounded · `timeout`: bounded · `context window`: bounded

---

# 7. G3 — First Real Tenant

Un único tenant piloto con todo en estado `ACTIVE`:
`Organization` · `Identity` · `Knowledge` · `Governance` · `Capabilities` · `Channel`

Nada `PENDING | SUSPENDED | DEACTIVATED` puede entrar al `ReasoningContext`.

---

# 8. G4 — Real Knowledge

Pipeline: Upload → Ingestion → Normalization → ACTIVE → EffectiveCognitiveContext → ReasoningContext

| Case | Input | Expected |
|---|---|---|
| A | Respuesta explícita en ACTIVE | Hermes responde |
| B | No existe | Hermes reconoce incertidumbre |
| C | Existe pero PENDING | No utiliza como autoridad |
| D | Existe pero RESTRICTED | No revela |
| E | Existe en Tenant B | No conoce |

---

# 9. G5 — Real Conversation

`ConversationMemoryProvider` es la fuente de verdad. No Portal UI State.
`conversationId` es estable y omnicanal (Portal → Telegram = mismo ID).

---

# 10. G6 — First Real Channel: Portal

```
USER → resolvePortalContext() → ControlPlaneContext
→ OmnichannelGateway → HermesRuntime.stream() → SSE → UI
```

---

# 11. Failure Model

| Fallo | Comportamiento |
|---|---|
| Database failure | Fail safely, sin respuesta |
| Ollama failure | Safe error, sin fallback alucinado |
| Policy uncertain | BLOCK |
| Trace failure | Cognitive response MAY continue |

> **Observability Failure ≠ Cognitive Failure**

---

# 12. Kill Switch

```env
HERMES_ENABLED=false
```
Detiene respuestas cognitivas · Preserva datos y auditoría · No requiere modificar código.

---

# 13. Tool Execution Boundary (fuera de v1)

❌ `SEND_EMAIL · TRANSFER_MONEY · CHANGE_PRICE · ISSUE_REFUND · CREATE_CONTRACT · EXECUTE_TRANSACTION`

Hermes v1 puede: `suggest · recommend · draft · classify · explain · qualify · route`

---

# 14. GO / NO-GO Matrix

| Área | Criterio |
|---|---|
| Tenant isolation | ✅ |
| Governance | ✅ |
| Identity | ACTIVE |
| Knowledge | ACTIVE |
| Memory | 7/7 |
| Cognitive Runtime | 25/25 |
| Streaming | 15/15 |
| Portal Transport | 6/6 |
| Real LLM | Certified |
| Policy Boundary | PASS |
| Trace | Operational |
| Kill Switch | Tested |
| Human fallback | Tested |
| Tool execution | **DISABLED** |

---

# 15. Launch Day Sequence

| Time | Action |
|---|---|
| T-24h | DB backup · env verify · Ollama health · tenant ACTIVE · knowledge ACTIVE |
| T-1h | Smoke test · real conversation · prompt injection · memory · streaming |
| T-0 | `HERMES_ENABLED=true` |
| T+15m | Review errors · latency · policy blocks · provider health · memory |
| T+1h | Review conversation quality · knowledge accuracy · tenant isolation |
| T+24h | Formal Production Review |

---

# 16. Definition of Done

La fase termina cuando un usuario externo puede decir:

> "Le escribí a Hermes, entendió quién soy, conoció la información autorizada de mi organización, respondió utilizando el modelo real, mantuvo memoria de nuestra conversación, respetó las políticas, transmitió la respuesta en tiempo real y podemos reconstruir qué contexto gobernó su respuesta."

---

# 17. Post-Launch Roadmap

| Phase | Feature |
|---|---|
| 7 | Tool Execution OS |
| 8 | Approval / Human-in-the-loop |
| 9 | Omnichannel |
| 10 | Campaign / Journey Automation |
| 11 | Multi-model routing |
| 12 | Enterprise scale |

---

# 18. Strategic Freeze

> **No se agregan nuevas capas al Cognitive Runtime para bloquear el lanzamiento.**

Toda nueva funcionalidad es `LAUNCH BLOCKER` o `POST-LAUNCH`. Nada más.
