# ADR-019 — Community Agent & Governed Proposals

- **Status:** Accepted
- **Date:** 2026-11-24
- **Decision Owners:** Pandora's Architecture
- **Scope:** A2A Bridge · Growth OS · Community operations
- **Related ADRs:** ADR-011 (authority), ADR-017 (execution bridge), ADR-018 (capability runtime)
- **Supersedes:** None

---

## 1. Context

El trabajo de community management para captación (planear contenido, redactar, publicar, moderar,
medir) tiene una parte mecánica que hoy consume tiempo humano y una parte de criterio que no se puede
automatizar sin riesgo.

Ya existen las piezas para separar ambas:

- un **puente A2A** firmado (HMAC + wallet + nonce) con agentes registrados y capabilities
  (Sofía lo usa en producción);
- **aprobaciones** (`nexus_approvals`) con UI y `PATCH` que valida la sesión en el servidor;
- un **bot de Discord** con permisos de escritura y canales ya creados;
- el **Execution Bridge** (ADR-017) y el **Capability Runtime** (ADR-018) como capas de ejecución.

Lo que faltaba era el **agente que propone** y la **implementación real del despacho**: 
`handleCapabilityRequest` respondía `CAPABILITY_EXECUTION_ACCEPTED` sin ejecutar ni registrar nada.

Además, el agente de desarrollo (Orca) corre en la laptop del Fundador **con su acceso**. Darle la base
de datos o el token de Discord habría permitido escribir saltándose capabilities, aprobaciones y
auditoría, y habría mezclado identidades.

---

## 2. Decision

Se incorpora un **agente de comunidad** (`community`) al puente A2A, con dos capacidades y **sin
permiso de escritura en Discord ni en la base de datos**:

| Capacidad | Efecto | Escritura |
|---|---|---|
| `community.report` | devuelve el digest del embudo (etapas, fuentes, clics, aprobaciones pendientes) | ninguna |
| `community.publish_post` | valida el texto contra la política del tenant y **crea una aprobación** | sólo `nexus_approvals` |

La publicación la ejecuta el **bot de Discord** después de la aprobación humana (fase 2). El agente
propone; no ejecuta.

Reglas de la decisión:

1. **Identidad propia.** El agente tiene su wallet (`COMMUNITY_AGENT_WALLET`). Sin wallet registrada
   queda en `MAINTENANCE` y no puede autenticarse (fail-closed).
2. **Una sola puerta de ejecución.** Todo lo que publique pasa por Hermes → approval → Action Gateway.
3. **Nada auto-aprobado.** Durante las primeras semanas, toda propuesta requiere decisión humana.
4. **Sin credenciales de plataforma en el bot.** No recibe `DATABASE_URL`, `HERMES_KMS_KEK` ni el token
   del bot de Discord: firma A2A con su wallet.
5. **Política antes que humano.** El validador aplica `banned_topics` v2 y marca (sin bloquear) cifras,
   enlaces y lenguaje de garantía para que el aprobador decida con contexto.

---

## 3. Contrato

### 3.1 Agente

```
agentId:        community
organizationId: snarai
role:           EXTERNAL_DELEGATE
wallet:         COMMUNITY_AGENT_WALLET
endpoint:       COMMUNITY_BOT_WEBHOOK_URL   (para devolver resultados, fase 2)
capabilities:   community.report · community.publish_post
```

### 3.2 Mensaje

```jsonc
{
  "protocol": "pandoras-a2a", "version": "1.1",
  "from": "community", "to": "hermes", "tenantId": "snarai",
  "type": "capability.request",
  "payload": {
    "capability": "community.publish_post",
    "canonicalOrgId": "snarai", "projectId": 17,
    "intent": "Respuestas a dudas de cesión",
    "posts": [{ "channel": "s-narai-preguntas", "text": "…" }]
  },
  "security": { "hmac": "…", "signature": "…", "signatureScheme": "EIP191" }
}
```

### 3.3 Respuestas

| Caso | `status` | Efecto |
|---|---|---|
| Reporte | `REPORT_READY` | digest en el payload |
| Propuesta válida | `PENDING_APPROVAL` | `approvalId`, `warnings[]` |
| Propuesta inválida | `REJECTED_BY_POLICY` | `violations[]` (no se crea nada) |
| Capacidad desconocida | error `CAPABILITY_NOT_IMPLEMENTED` | falla cerrada |

### 3.3-bis Secreto propio del agente (no compartido)

`community` **no** usa el `A2A_HMAC_SECRET` compartido de Sofía/Hermes. Tiene el suyo:
`COMMUNITY_A2A_HMAC_SECRET`. Motivo: el secreto compartido permite firmar un mensaje como `sofia`
(con `signature: 'mock_sig'` pasa la validación), así que dárselo a un agente que lee contenido de
terceros habría abierto una escalada de identidad. El transporte acepta el secreto compartido **o** el
dedicado; el servidor exige, en ambos casos, la firma EIP-191 del agente.

### 3.3-ter Idempotencia

La propuesta lleva `proposalKey`. El servidor la usa como parte de `what`:
`community.publish_post:<proposalKey>`. Si ya existe una aprobación **PENDING** con la misma clave y
organización, devuelve esa (`idempotent: true`) en lugar de crear otra. Reintentos del bot no llenan la
bandeja. La CLI deriva la clave del hash del contenido si no se pasa `--key`.

### 3.4 Registro de aprobación

`nexus_approvals` con `canonical_org_id`, `what = community.publish_post:<id>`,
`capability_required = community.publish_post`, `risk_level` (`HIGH` si hay advertencias),
`status = PENDING`, `next_action = PUBLISH_COMMUNITY_POST`.

### 3.5 Validación (primera barrera)

Prohibido (bloquea): fideicomiso, NOM-151, condo-hotel, renta hotelera, hotel/hotelera, “noches”,
“CP”, “estrategia de familia”, rendimiento/retorno garantizado. Longitud ≤ 1800, canal válido,
máximo 10 publicaciones por propuesta.

Avisos (no bloquean): cifras en MXN/USD, plusvalía/apreciación, lenguaje de garantía, enlaces.

---

## 4. Seguridad

| Amenaza | Mitigación |
|---|---|
| Suplantar al agente | HMAC del puente **+ firma EIP-191** con su wallet registrada |
| Replay | nonce de un solo uso en base de datos + ventana de frescura |
| Prompt injection desde Discord | el agente que lee **no puede escribir**; el texto se valida contra política |
| Salto de aprobación | el servidor crea la aprobación; el botón de Discord no autoriza, sólo abre la decisión |
| Escritura accidental | el agente no tiene token de Discord ni credenciales de base |
| Abuso de cuota | límite de 10 publicaciones por propuesta; rate limit del endpoint A2A |

**No objetivos:** publicar sin aprobación, aprobar por el agente, escribir en el knowledge, tocar
finanzas o emisión.

---

## 5. Consecuencias

**Positivas:** el trabajo mecánico (analizar, redactar, publicar por lotes, reportar) queda cubierto
por el sistema; el humano decide; cada acción deja traza con identidad propia.

**Negativas / deuda:**

- El catálogo de capacidades está **triplicado** en el repo (`registries/`, `runtimes/`,
  `capabilities/`). Esta entrega no crea un cuarto: usa una lista propia en
  `community/community-capabilities.ts`. Converger es deuda abierta.
- `CapabilityRuntime` no está cableado al A2A: la ejecución de `community.publish_post` se implementará
  en la fase 2 dentro del Action Gateway, no en el runtime genérico.
- El aprendizaje: las decisiones de aprobación aún no alimentan `HermesLearningLoop`. Se propone
  registrar el resultado (aprobado/rechazado + motivo) como señal de aprendizaje en la fase 3.

---

## 6. Fases

| Fase | Alcance | Estado |
|---|---|---|
| 0 | Digest + agente registrado + CLI firmada | ✅ esta entrega |
| 1 | `capability.request` real + aprobación | ✅ esta entrega |
| 2 | Ejecución: `PUBLISH_COMMUNITY_POST` en el Action Gateway + devolución del resultado al webhook del bot | pendiente |
| 3 | Señal de aprendizaje (aprobaciones → `HermesLearningLoop`) y métricas de calidad | pendiente |
| 4 | Ampliar: responder hilo, agendar AMA, mover etapa del lead | pendiente |
