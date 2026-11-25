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

### 3.3-quater Ejecución (fase 2)

Al resolver la aprobación:

1. Se carga la propuesta de `community_proposals`.
2. **Revalidación**: se vuelve a aplicar `banned_topics` y la lista blanca de canales
   (`s-narai-*`, excluyendo la categoría de miembros). Si algo falla → `BLOCKED`, sin tocar Discord.
3. **Reclamo atómico**: `UPDATE … SET status='EXECUTING' WHERE status='PENDING'`. Si otra petición ya
   la tomó, no se publica dos veces.
4. Publica cada post con el bot de Discord y guarda `published[]` / `errors[]` en `result`.
5. Auditoría `EXECUTIVE_ACTION_EXECUTED` con conteos (nunca el texto).

Un rechazo guarda el motivo en `result.reason` y aparece en `recentDecisions` del digest: el agente lo
lee en la siguiente corrida.

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
| 2 | Ejecución: publica tras la aprobación, con revalidación, lista blanca de canales y reclamo atómico | ✅ implementado (resultado en `community_proposals.result`) |
| 3 | Señal de aprendizaje: decisiones con motivo en el digest (`recentDecisions`) | ✅ implementado; el extractor LLM de `HermesLearningLoop` queda como deuda (es por perfil de usuario, no por decisión) |
| 4 | Ampliar: responder hilo, agendar AMA, mover etapa del lead | pendiente |

## 7. Lectura, media y atribución (roadmap de community)

| # | Integración | Estado | Evidencia / límite |
|---|---|---|---|
| 1 | Lectura de Discord con bot dedicado (`read`) | ✅ implementado · ⏳ credencial | `community-insights.ts` (analizadores puros) + `read` en la CLI. El token de `S'Narai Reader` es **sólo lectura** (66560) y vive únicamente en `~/.orca/bots/s-narai-reader/.env`. Sin token el comando falla cerrado. |
| 2 | Media en publicaciones | 🟡 parcial | `imageUrl` se valida (`https`) en la propuesta y se publica como **embed** en `community-publisher`. La **generación** de la imagen sigue en `HermesMediaOrchestratorService`; no se añadió una capacidad nueva para no duplicar ese motor. |
| 3 | Atribución por publicación | ✅ implementado | Cada post recibe su código `/l/<code>` al proponerse (guardado en `community_proposals.posts[].code`). El digest devuelve `attribution` con `opens`, `uniqueVisitors` y `leads` (`null` = no atribuible, nunca 0 inventado). |
| 4 | Moderación en modo reporte | ✅ analizador · ⏳ cableado a lectura | `analyzeModeration` detecta invitaciones ajenas, promesas prohibidas, enlaces externos y repetición. Nunca borra ni silencia: sólo reporta. Requiere el token del lector para operar sobre datos reales. |
| 5 | Salud de comunidad semanal | ✅ analizador · ⏳ cableado a lectura | `buildCommunityHealth` cuenta mensajes, autores, preguntas y sin responder (conservador: sólo dentro de la ventana leída). |
| 6 | Otras redes | ❌ bloqueado | Existen `media.publish.channel:x/telegram/newsletter` en A2A, pero cada red necesita credencial propia y su política. |
| 7 | AMAs y eventos | ❌ bloqueado | Requiere permiso `Manage Events` en el bot de Hermes y una capacidad nueva. |

Reglas que se mantienen:

- El bot **lector** no puede escribir; el que **publica** no lee contenido de terceros para razonar.
- Todo hallazgo de moderación es una recomendación: la ejecución sigue siendo humana.
- La atribución no inventa: si la landing externa no reenvía `src`, `leads` es `null`.

## 8. Notificaciones (aviso, no autorización)

Cuando se crea una aprobación hay que avisar a quien puede resolverla. Se usan dos canales y sólo dos:

| Canal | Cómo | Garantía |
|---|---|---|
| **In-app** | `hermes_tenant_notifications` (`kind = APPROVAL`) | Siempre se escribe; idempotente por `dedupeKey = approval:<id>` |
| **Discord** | webhook del canal privado del tenant (`tenant_notification_channels`) | Aviso con enlace al portal; nunca aprueba |

Decisiones y límites:

1. **Sin fallback global.** Si el tenant no tiene canal configurado, sólo queda el aviso in-app. Nunca se
   usa `DISCORD_WEBHOOK_PANDORAS_ALERTS` como respaldo: el contenido de un tenant no puede terminar en el
   canal de otro.
2. **El aviso no lleva el texto de la publicación.** Sólo intención, número de publicaciones y canales.
   El texto se revisa en `/growth-os/organizations/<org>/approvals`, con la sesión del aprobador.
3. **El webhook no vive en `tenantRuntimeConfig`.** La config de runtime se devuelve completa en
   `/api/v1/tenant/:id/manifest`; un webhook ahí quedaría expuesto. Por eso hay tabla propia.
4. **Destinatario por tenant, nunca "el jefe".** La resolución es por `canonicalOrgId`; la identidad
   transversal de un owner de plataforma no convierte un aviso en acceso.
5. **Un aviso fallido no bloquea la aprobación.** El notificador nunca lanza; devuelve
   `SENT | SKIPPED | FAILED`.

Configuración (una vez por tenant):

```bash
bun run apps/dashboard/scripts/set-tenant-notification-channel.ts \
  --org=snarai --url=https://discord.com/api/webhooks/… --by=marco
```

Migraciones: `0121_tenant_notification_channels` (canales por tenant) y
`0122_hermes_tenant_notifications` (la tabla de avisos in-app existía en el schema pero **nunca se había
creado** en la base: los recordatorios de trial y el banner del portal se perdían en silencio).

Pendiente (no bloquea): WhatsApp requiere plantillas aprobadas por Meta y destinatarios registrados por
tenant; Telegram puede reutilizar `NexusActionDispatcher` para botones de aprobar/rechazar.


