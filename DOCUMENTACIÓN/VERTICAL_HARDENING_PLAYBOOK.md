# Pandoras Growth OS — Vertical Hardening Playbook
**Versión:** 1.0 · **Fecha:** 2026-09-08 · **Autores:** Pandoras Core Team

> **Principio central:** Estamos haciendo hardening incremental sobre un sistema integrado y funcional. No creamos arquitecturas paralelas. No reemplazamos componentes que funcionan. Todo cambio es additive o quirúrgico, y respeta los contratos actuales salvo donde explícitamente se cierra un security gap.

---

## Contexto

Después del ciclo de **Sovereign Mesh Consolidation** (4 fases completadas, `61d03583`), todas las verticales del OS pasaron por un desacople significativo:

- Routing renombrado (`[id]` → `[organizationSlug]`)
- SovereignHeader unificado (3 layouts)
- HITL Inbox fusionado
- RWA reubicado a `/ecosystem/[slug]/capital`
- Developer Hub centralizado

El desacople fue quirúrgico y el build pasa. Pero el principio de seguridad del sistema distribuido aplica: **cada desacople es una oportunidad para que algo que antes funcionaba deje de estarlo silenciosamente**.

Este playbook define el proceso estándar para:
1. Auditar una vertical post-desacople
2. Cerrar gaps de seguridad y funcionalidad (P0/P1/P2)
3. Verificar regresiones sin romper lo que ya funcionaba
4. Documentar deuda técnica sin refactorizarla prematuramente

---

## Metodología: 3 Fases por Vertical

```
Fase 1: AUDITORÍA        → entender el estado real con evidencia de código
Fase 2: HARDENING P0     → cerrar gaps críticos de forma additive
Fase 3: REGRESSION AUDIT → demostrar que lo que funcionaba sigue funcionando
```

**Regla de oro:** Si durante la auditoría encuentras algo que ya funciona pero está arquitectónicamente imperfecto, **NO lo refactorices dentro del P0**. Lo documentas como follow-up. Velocidad nunca justifica abrir 15 frentes.

---

## Fase 1 — Auditoría de Vertical

### 1.1 Mapa de blast radius (obligatorio antes de tocar código)

Para cada componente que se planea modificar:

```bash
# ¿Quién llama a este archivo/función?
grep -rn "<NombreClase|función>" src --include="*.ts" | grep -v "__tests__" | grep -v "<archivo_propio>"

# Si el único caller es su propio archivo y tests → NO está integrado. Declararlo.
```

Clasificar cada aparición como:
- **ACTIVE** — en ruta de producción viva
- **LEGACY** — heredado, sin callers activos
- **ADAPTER** — capa de transición intencional
- **DEAD** — importado pero nunca ejecutado
- **INTENTIONAL** — código de dev/test con propósito

> **Nunca interpretar LEGACY como "borrar". Solo documentar.**

### 1.2 Inventario de callers por endpoint

Para cualquier endpoint que se vaya a modificar (especialmente si cambia su contrato de auth):

```bash
# En todos los repos del ecosistema
grep -rn "<endpoint_path>" apps/ packages/ ../pandoras_tgApp/ ../Narai/ 2>/dev/null
```

Clasificar cada caller:
| Caller | Auth mechanism | tenant source | organizationId source | Production? |
|--------|---------------|--------------|----------------------|-------------|

### 1.3 Checklist de auditoría por área

#### A. Runtime / Pipeline cognitivo
- [ ] ¿Los stages del pipeline siguen conectados en el mismo orden?
- [ ] ¿Ningún import/adaptador apunta al runtime anterior (pre-desacople)?
- [ ] ¿Algún canal llama directamente al execution engine saltando capas de governance?

#### B. Tenant Isolation
- [ ] ¿El canonical resolver (`TenantAuthorityService.resolveCanonicalTenant()`) es el único punto de resolución de identidad de tenant?
- [ ] ¿Ninguna ruta acepta `organizationId`, `tenantId`, `projectSlug` del body como autoridad de identidad?
- [ ] ¿El storage key y el security key están claramente separados?

Prueba de aislamiento obligatoria (verificar en código):
```
User A → knowledgeId de B         → DENY
User A → tenantSlug de B en URL   → DENY (resolver lo neutraliza)
User A → organizationId de B body → DENY (ignorado, resuelto de session)
User A → conversationId de B      → DENY
```

#### C. Identity
- [ ] ¿Existe un único resolver de identidad canónico (no hay duplicados post-desacople)?
- [ ] ¿`userId`, wallet, Telegram ID, session, membershipService apuntan todos al mismo modelo?
- [ ] ¿El desacople NO creó otro tenant membership resolver paralelo?

#### D. Memory
- [ ] ¿La memoria conversacional es tenant-scoped con tenant canónico (no slug arbitrario)?
- [ ] ¿`conversationId` no puede usarse para cruzar tenants?
- [ ] ¿PostgresMemory recibe el `canonicalOrgId` correcto?
- [ ] ¿No quedó ningún fallback de memoria global accidental?

#### E. Domain Packs / Knowledge
- [ ] ¿Qué fuentes se cargan y en qué orden de precedencia?
  ```
  DB identityPack  >  DB policyPack  >  DB tenantRuntimeConfig  >  static PACK_REGISTRY  >  throw
  ```
- [ ] ¿La precedencia está documentada y es determinista?
- [ ] ¿`hermes_global` (o equivalente global namespace) está preservado y no sobreescrito?

#### F. Policy / Governance
- [ ] ¿PolicyValidator sigue en el pipeline (no saltado por adapter nuevo)?
- [ ] ¿HITL sigue disparándose correctamente?
- [ ] ¿Escalation → pending → human response → resume no fue interrumpido?
- [ ] ¿La identidad de quien responde en HITL no puede cambiarse por parámetros del request?

#### G. Canales (inventario completo)
Para cada canal verificar el flujo completo:
```
Canal → Edge/Adapter → Core → Hermes → Response
```
Inventario estándar:
| Canal | Edge/Adapter | Auth | Tenant Resolution | Hermes Entry | Status |
|-------|-------------|------|-------------------|-------------|--------|
| Telegram | | | | | |
| WhatsApp/Meta | | | | | |
| SignalWire | | | | | |
| Web/Portal | | | | | |
| TMA | | | | | |
| Internal/Discord | | | | | |

#### H. Outbound / Proactivo
- [ ] ¿`HermesOutboundDispatcher` (o equivalente) sigue disponible y no fue roto?
- [ ] ¿Retries e idempotencia siguen operativos?
- [ ] (P1) ¿JourneyEngine conectado a outbound? Si no → documentar como gap.

#### I. Audit / Receipts
- [ ] ¿Cada ejecución importante produce: actor + tenant + action + capability + resultado + timestamp?
- [ ] ¿Los receipts tienen tenant scope (no cross-tenant accidental)?

#### J. Rate Limiting
- [ ] ¿Sigue usando canonical tenant identity (no slug arbitrario ni IP como sustituto)?

#### K. LLM Provider
- [ ] ¿Ningún endpoint hardcodea un provider específico (`new OllamaReasoningProvider()`)?
- [ ] ¿Todos usan `getDefaultRuntime()` o equivalente que respeta env vars?
- [ ] Per-tenant LLM → documentar como P1 si no está implementado.

#### L. Secrets / Internal Auth
```bash
grep -rn "dev_secret_key\||| ''" apps/dashboard/src/app/api/ --include="*.ts"
```
- [ ] ¿Ningún secret tiene fallback hardcodeado en producción?
- [ ] ¿Todos los endpoints `/internal/*` usan `requireInternalAuth()` o equivalente?

---

## Fase 2 — Hardening P0 (Ejecución)

### Principios de ejecución

1. **Hardening incremental** — no paralelo, no replace
2. **Reutilizar** servicios, resolvers, capabilities, identity y governance ya existentes
3. **Additive** — el cambio no rompe callers existentes verificados
4. **Fail-closed** — sin fallbacks silenciosos; degradación explícita y visible
5. **tsc obligatorio** al finalizar cada commit parcial

### Estructura de commit por vertical

```
fix(<vertical>): close P0 gaps — auth + <descripción>
feat(<vertical>): <KnowledgeService|SoulService|etc> additive layer
```

### Template de análisis previo (§8 del AGENTS.md)

Antes de cada archivo a modificar, declarar en 5-10 líneas:
1. **Blast radius**: callers directos e indirectos
2. **Contratos compartidos**: tipos/interfaces afectados en otros dominios
3. **Datos en producción**: ¿altera lecturas/escrituras existentes?
4. **Superficie de regresión**: tests existentes en esa zona
5. **Plan declarado**: qué vas a cambiar, por qué es seguro, qué NO vas a tocar

### Nota sobre capability authorization

`Authenticated tenant session` es suficiente para endpoints de gestión en P0 **temporalmente**, pero no representa el modelo final de capability authorization.

El modelo final será:
```
session válida
    ↓
tenant membership verificado
    ↓
capability autorizada (e.g. growth.knowledge.manage)
    ↓
domain service
```

Documentar siempre en qué endpoints falta el capability check y registrar como deuda P1.

---

## Fase 3 — Regression Audit (Verificación)

### 3.1 Automated

```bash
bun x tsc --noEmit          # 0 errores TypeScript
bun test --filter <vertical> # tests del dominio tocado
```

### 3.2 Functional verification (manual)

Para cada vertical, ejecutar el flujo E2E conceptual:

```
TENANT A                       TENANT B
    ↓                              ↓
authenticated user          authenticated user
    ↓                              ↓
[Vertical Service]          [Vertical Service]
    ↓                              ↓
Domain Pack A               Domain Pack B
    ↓                              ↓
Knowledge/Memory A          Knowledge/Memory B
    ↓                              ↓
Response A                  Response B
    ↓                              ↓
Audit A                     Audit B
```

Y cross-tenant attacks (verificar en código, no solo asumir):
```
User A → resource of B    → DENY
```

### 3.3 Clasificación final de estado

Vocabulario obligatorio para cada ítem:
- ✅ **IMPLEMENTADO+CABLEADO** — caller en ruta de producción
- 🟡 **IMPLEMENTADO-SIN-CABLEAR** — existe, tests pasan, sin uso real
- 🔵 **ESPECIFICACIÓN** — solo diseño/documento
- ⏳ **DEPENDIENTE** — espera env var/recurso externo
- 🔴 **GAP** — funcionalidad ausente con impacto en producción

---

## Inventario de Verticales — Orden de Revisión

| # | Vertical | Estado Post-Desacople | Prioridad | Sprints estimados |
|---|----------|----------------------|-----------|-------------------|
| 1 | **Hermes OS** | 🟡 Hardening P0 activo | ← **AQUÍ** | 1-2 |
| 2 | **Portal** | ⬜ Pendiente auditoría | Alta | 1 |
| 3 | **Ecosystem / Capital** | ⬜ Pendiente auditoría | Alta | 1 |
| 4 | **Growth OS** | ⬜ Pendiente auditoría | Media | 1 |
| 5 | **Nexus** | ⬜ Pendiente auditoría | Media | 1 |
| 6 | **Academy** | ⬜ Pendiente auditoría | Baja | 1 |

---

## Hermes OS — Estado de referencia (Vertical 1) — 🟢 CERTIFICADO

### Certificado Post-Desacople ✅
- Pipeline cognitivo (`HermesCognitiveRuntime.respond()`) cableado en `/api/v1/hermes/chat` con sesión obligatoria
- Channel Gateway (`ChannelGatewayAdapter`) cableado en `/api/v1/hermes/channel-inbound`
- HITL Escalation (trigger/reply/resume) — 100% Postgres verificado
- Tenant Auth (`TenantAuthorityService` + `HermesTenantMembershipService`) — Canónico, fail-closed
- Multi-Tenant Isolation (A vs B) — **Certificado con prueba hostil en vivo** contra Neon DB
- Rate limiting per-tenant por `canonicalOrgId`
- Canales productivos: Telegram (channel mesh), WhatsApp (Meta Cloud API canónico)
- Knowledge Domain: `KnowledgeService` con separación estricta `sources` (lógico KNOW UX) vs `chunks` (físico RAG) y precedencia de `hermes_global`

### P1 Documentado (próximos sprints) 📋
- Capability fine-grained authorization (`growth.knowledge.manage`) en BootSequence registry
- Per-tenant LLM provider (Ollama/OpenAI/Gemini por tenant en DB)
- Soul configurable UI (`identityPack.soul` PATCH endpoint)
- Tenant Onboarding self-service
- Outbound proactivo (JourneyEngine → HermesOutboundDispatcher + cron)

### P2 Futuro & Deuda Registrada 🔭
- **P2 — Schema Drift: `hermes_conversations.identity_id`**: Columna presente en Drizzle `schema.ts` pero ausente en tabla Neon física. Runtime opera aislado por `organizationId` + `conversationId`. Pendiente decidir: migración formal o remover de schema.
- **Canal WhatsApp Baileys**: Clasificado como **LEGACY / DEPRECATED** (Meta Cloud API es el único canal productivo canónico).
- Knowledge Studio (PDF/URL ingestion, embeddings, pgvector RAG)
- Per-tenant outbound orchestration
- Distributed tracing / observability

---

## Deuda Técnica Registrada

| Ítem | Archivo | Clasificación |
|------|---------|---------------|
| `hermes_conversations.identity_id` schema drift | `db/schema.ts:3605` | 🟡 P2 Schema Drift (no bloqueante) |
| WhatsApp Baileys handler | `api/whatsapp/baileys/route.ts` | 🟡 LEGACY / DEPRECATED (Meta Cloud API es prod) |
| `KnowledgeEngine.searchKnowledgeBase()` mock con `hermes_global` | `knowledge-engine.ts:61` | 🟡 TODO Phase 6.6.x |
| `PACK_REGISTRY` estático solo para `snarai`/`hermes` | `domain-pack-loader.ts:19` | 🟡 Fallback válido |
| `snarai-soul.ts` hardcoded para S'Narai | `soul/snarai-soul.ts` | 🟡 P1 generalizar |
| `HermesOutboundDispatcher` sin caller en journey | `agents/HermesOutboundDispatcher.ts` | 🟡 P1 conectar |
| Receipts registrados solo en tests | `claim-contract-engine.ts` | 🟡 P1 producción |

---

## Reglas de Gobernanza del Playbook

### No hacer en ningún P0
- ❌ Refactorizar algo que ya funciona solo porque está "arquitectónicamente imperfecto"
- ❌ Crear arquitecturas paralelas a las existentes
- ❌ Usar slug como identidad de seguridad
- ❌ Fallbacks hardcodeados en producción (`|| 'dev_secret_key'`, `|| 'pandoras'`)
- ❌ Swallow errors en persistencia/seguridad (`.catch(console.warn)`)
- ❌ Declarar completo sin haber corrido `tsc --noEmit`
- ❌ Borrar código clasificado como LEGACY sin confirmar callers ocultos

### Siempre en cada P0
- ✅ `TenantAuthorityService.resolveCanonicalTenant()` como única fuente de verdad de tenant
- ✅ Fail-closed en auth, secrets y resolvers de identidad
- ✅ `tsc --noEmit` antes de reportar completado
- ✅ Clasificar con vocabulario estándar (✅/🟡/🔵/⏳/🔴)
- ✅ Documentar deuda técnica en lugar de refactorizarla
- ✅ Verificar cross-tenant attacks conceptualmente en código

---

## Referencias Canónicas

- **AGENTS.md** — Directivas de producción (§1-§10)
- **`TenantAuthorityService`** — `lib/pandoras/core/domains/hermes/tenants/tenant-authority.ts`
- **`HermesTenantMembershipService`** — `lib/hermes/auth/tenant-membership.service.ts`
- **`requireInternalAuth()`** — `lib/security/internal-auth.ts`
- **`getDefaultRuntime()`** — `lib/pandoras/core/domains/hermes/runtime/hermes-runtime.ts:772`
