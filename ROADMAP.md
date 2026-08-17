# Pandora's Platform — Roadmap de Implementacion

> Basado en **ADR-012: Platform Experience Boundary** y los invariantes **EXP-001 a EXP-014**.
> Referencia: `apps/dashboard/src/lib/pandoras/docs/ADR-012-platform-experience-boundary.md`

---

## Leyenda

- `[ ]` = Pendiente
- `[~]` = En progreso
- `[x]` = Completado
- `[!]` = Bloqueado
- `[-]` = Cancelado / Fuera de alcance

---

## Fase 0: Boundary & Inventory Audit

**Objetivo:** Descubrir y aislar la Identidad Canonica de Pandora's. Asegurar que dash, app y tma sean clientes de una plataforma compartida sin duplicar modelos de usuario ni logicas de autenticacion.

**Referencia:** `ADR-012` + `exp-013`, `exp-014`

### 0.1 — Surface Inventory
- [x] Inventario de api-core: 18 archivos TS, 9 tablas DB, auth wallet-first
- [x] Inventario de dashboard: schema 3659 lineas, auth multi-capa, portal separado
- [x] Inventario de TMA: SPA standalone, 35+ endpoints, CloudStorage private key
- [x] Confirmar que TMA NO esta en el workspace monorepo
- [x] Confirmar que TMA es repo separado (`pandoras_tgApp/pandoras-telegram-app`)

### 0.2 — Identity Authority Inventory
- [x] Identity Map: wallet -> userId, telegram -> userId, portal -> product session
- [x] Marcar como `INFERRED` o `EXTRACTED` cada camino de resolucion
- [x] Documentar gaps: TMA initData validation stub en api-core
- [x] Documentar virtual sessions en portal-auth.ts

### 0.3 — Tenant/Organization Authority Inventory
- [x] Ownership Map: project vs organization vs tenant vs membership
- [x] Mapear `users.id`, `projects.id`, `tenants.id`, `tenant_users`, `installedProducts`
- [x] Documentar: organization = project en dashboard, tenant = separado en api-core
- [x] Documentar: no existe tabla canonica de membresias

### 0.4 — Boundary Violation Register
- [x] `tenant-gate.ts` resuelve tenant desde header/body sin session validation
- [x] `portal-auth.ts` decodifica JWT sin verificar firma (line 87-95)
- [x] `portal-auth.ts` crea virtual sessions en DB fallback (line 184-197)
- [x] `getAuth()` retorna `userId: null` deliberadamente
- [x] Admin middleware solo verifica existencia de cookie, no JWT
- [x] `audit_logs` table definida pero nunca escrita
- [x] `nft_ownership_cache` table definida pero nunca escrita
- [x] `requireAdmin` duplicado en auth.ts y tenants.ts
- [x] `apiLimiter` exportado pero nunca usado
- [x] Rate limiter global vs local inconsistente

### 0.5 — Five Maps (Artefactos)
- [ ] `identity-map.md` — Ver `DOCUMENTACION/phase-0/identity-map.md`
- [ ] `context-map.md` — Ver `DOCUMENTACION/phase-0/context-map.md`
- [ ] `ownership-map.md` — Ver `DOCUMENTACION/phase-0/ownership-map.md`
- [ ] `dependency-map.md` — Ver `DOCUMENTACION/phase-0/dependency-map.md`
- [ ] `extraction-plan.md` — Ver `DOCUMENTACION/phase-0/extraction-plan.md`

### 0.6 — STOP/GO Gate Report
- [ ] Ver `DOCUMENTACION/phase-0/gate-report.md`

**Gate de salida Fase 0:**
- Todos los 5 mapas completados con evidencia file:line
- Cada boundary violation documentada con severidad
- Identity Map verificada contra los 3 codebases
- Veredicto STOP o GO documentado

---

## Fase 1: Canonical Identity Extraction

**Objetivo:** Crear `packages/platform-core` como package compartido con la identidad canonica, contextos y contratos.

**Depende de:** Fase 0 GO

### 1.1 — Package Setup
- [ ] Crear `packages/platform-core/` con `package.json`, `tsconfig.json`
- [ ] Registrar en root `package.json` workspaces
- [ ] Configurar build (tsup o tsc)
- [ ] Definir dependencias minimas (drizzle-orm, zod)

### 1.2 — Canonical Identity Types
- [ ] Definir `CanonicalUser` type (userId, walletAddress, telegramId, email, roles, status)
- [ ] Definir `ProviderIdentity` type (provider, providerId, userId)
- [ ] Definir `IdentityLinking` rules (merge, dedup, conflict resolution)
- [ ] Definir `IdentityResolver` interface

### 1.3 — Context Types
- [ ] `ConsumerContext` (userId, wallet, scopes, device, telegram binding)
- [ ] `OrganizationContext` (organizationId, projectId, tenantId, products, capabilities)
- [ ] `TelegramUserContext` (telegramId, userId, linked, walletAddress)
- [ ] `PortalSessionContext` (installedProductId, projectId, product, authority)

### 1.4 — Authorization Contracts
- [ ] `AuthorizationPolicy` interface (check, enforce, deny)
- [ ] `TenantScope` type (tenantId, roles, permissions)
- [ ] `CrossTenantGuard` type (deny if spoofed tenantId)

### 1.5 — Validation Schemas (Zod)
- [ ] `canonicalUserSchema`
- [ ] `consumerContextSchema`
- [ ] `organizationContextSchema`
- [ ] `tenantScopeSchema`

**Gate de salida Fase 1:**
- `packages/platform-core` compila sin errores
- Tipos exportados son consumidos por api-core y dashboard sin `any`
- No hay duplicacion de tipos entre apps

---

## Fase 2: Shared Auth Layer

**Objetivo:** Unificar JWT issuance y validation en `platform-core`. Eliminar JWT duplicados entre api-core y dashboard.

**Depende de:** Fase 1

### 2.1 — JWT Unification
- [ ] Mover `verifyJWT()` a `platform-core/lib/jwt.ts`
- [ ] Eliminar `reconstructPEM()` duplicado
- [ ] Unificar algoritmo: RS256 primario, HS256 fallback controlado
- [ ] Estandarizar cookie names: `__pbox_sid` unico
- [ ] Eliminar `auth_token` y `pbox_session_v3` legacy

### 2.2 — Session Unification
- [ ] Evaluar si api-core Redis sessions y dashboard in-memory son compatibles
- [ ] Definir estrategia: Redis centralizado o sessions por app
- [ ] Crear `SessionManager` interface en platform-core
- [ ] Implementar adapter para cada backend

### 2.3 — Login Flow Unification
- [ ] Definir si api-core o dashboard es el issuer canonical de JWT
- [ ] Si api-core es issuer: dashboard consume JWT via cookie sharing
- [ ] Si dashboard es issuer: api-core valida JWT de dashboard
- [ ] Documentar y testear el flujo completo

### 2.4 — Admin Authorization
- [ ] Mover `isAdmin()` y `requireAdmin()` a platform-core
- [ ] Eliminar duplicacion auth.ts/tenants.ts
- [ ] Unificar `administrators` table con `users.role`
- [ ] Definir `PlatformRole` canonical en platform-core

**Gate de salida Fase 2:**
- Un solo issuer de JWT para web sessions
- Ambas apps validan con la misma funcion
- `isAdmin()` no esta duplicado
- Cookie names son consistentes

---

## Fase 3: TMA Integration

**Objetivo:** Integrar la TMA en el ecosistema de identidad canonica. Respetar EXP-003 (TMA es Consumer Experience primario).

**Depende de:** Fase 1

### 3.1 — TMA Auth Bridge
- [ ] Implementar `initData` HMAC validation en api-core (actualmente stub)
- [ ] Crear endpoint `/auth/telegram-standalone` completo en api-core
- [ ] Usar `platform-core` para crear/validar sesiones TMA
- [ ] Testear flujo completo: initData -> HMAC verify -> JWT issue

### 3.2 — Identity Linking
- [ ] Implementar linking wallet->telegram->coreUser en api-core
- [ ] Crear endpoint para link challenge (actualmente en TMA pero sin backend completo)
- [ ] Definir reglas de merge cuando wallet ya existe en dashboard
- [ ] Documentar flujo: TMA creates wallet -> links to Core App user

### 3.3 — Cross-Platform Identity
- [ ] Unificar `telegramId` field: api-core `users.telegram_id` vs dashboard `users.telegramId`
- [ ] Migrar a un solo nombre canónico
- [ ] Crear tabla `user_identities` compartida (provider, providerId, userId)
- [ ] Backfill: vincular identidades existentes

### 3.4 — TMA Workspace Migration (Opcional)
- [ ] Evaluar si TMA debe moverse al monorepo o mantenerse separado
- [ ] Si monorepo: mover a `apps/telegram-mini-app/`
- [ ] Si separado: crear package compartido de tipos y contratos
- [ ] Documentar decisión

**Gate de salida Fase 3:**
- TMA initData se valida con HMAC real
- Identity linking funciona end-to-end
- Un usuario puede acceder desde TMA y dashboard con la misma identidad
- No hay duplicación de telegramId fields

---

## Fase 4: Organization / Tenant Mapping

**Objetivo:** Establecer la relacion canonica `projectId <-> organizationId <-> tenantId`. Resolver la ambigüedad actual.

**Depende de:** Fase 1

### 4.1 — Canonical Mapping
- [ ] Definir: `projectId` = `organizationId` = `tenantId` (o documentar si son diferentes)
- [ ] Crear tabla `organization_memberships` si no existe
- [ ] Definir cardinalidad: 1 project = 1 organization = 1 tenant?
- [ ] Documentar decision en ADR

### 4.2 — Schema Migration
- [ ] Decidir owner de schema: api-core o dashboard?
- [ ] Unificar `tenants` (api-core) con `projects` (dashboard)
- [ ] Crear migracion para `tenant_users` -> `organization_memberships`
- [ ] Backfill datos existentes

### 4.3 — Tenant Scope Enforcement
- [ ] Mover tenant resolution a middleware canonical
- [ ] Eliminar resolucion desde body/header sin session validation
- [ ] Implementar `CrossTenantGuard` middleware
- [ ] Test: spoofing tenantId via header -> DENY

### 4.4 — Membership CRUD
- [ ] Crear API para gestionar membresias (actualmente no existe)
- [ ] Definir roles canonicos: owner, admin, member, viewer
- [ ] Integrar con Hermes portal (exp-009)
- [ ] Integrar con dashboard admin panel

**Gate de salida Fase 4:**
- Tabla canonical de memberships existe
- Tenant scope no puede ser spoofed desde request
- CRUD de membresias funciona via API
- Relationship projectId <-> tenantId es explícita y documentada

---

## Fase 5: Hermes Portal Unification

**Objetivo:** Unificar portal auth con la identidad canónica. Eliminar virtual sessions y JWT sin verificar.

**Depende de:** Fase 2, Fase 4

### 5.1 — Portal Auth Cleanup
- [ ] Eliminar decodificacion sin firma en `portal-auth.ts:87-95`
- [ ] Eliminar virtual session fallback en `portal-auth.ts:184-197`
- [ ] Unificar portal JWT secret con platform-core
- [ ] Definir: portal sessions son `ProductSession` ≠ `UserSession`

### 5.2 — Portal -> Canonical Identity Bridge
- [ ] Opcion A: Portal sessions crean user si no existe (auto-provision)
- [ ] Opcion B: Portal sessions son anónimas con permisos limitados
- [ ] Documentar cual y por qué
- [ ] Implementar la decisión

### 5.3 — OrganizationSDK Cleanup
- [ ] Eliminar virtual Hermes sandbox creation en `organization-sdk.ts:103-127`
- [ ] Definir cuando OrganizationContext requiere user vs product
- [ ] Test: portal session sin user -> limited org context

**Gate de salida Fase 5:**
- No hay JWT decoding sin firma
- No hay virtual sessions en producción
- Portal auth es un sistema documentado y acotado
- OrganizationSDK no fabrica datos ficticios

---

## Fase 6: Consumer App Setup

**Objetivo:** Preparar `app.pandoras.finance` como Consumer Experience (exp-002).

**Depende de:** Fase 2, Fase 3

### 6.1 — App Bootstrap
- [ ] Crear `apps/consumer-app/` o usar `apps/nextjs/` existente
- [ ] Configurar dominio `app.pandoras.finance`
- [ ] Consumir `platform-core` para auth y contextos
- [ ] Implementar ConsumerContext-based routing

### 6.2 — Consumer Features
- [ ] Login con wallet (consumir JWT de api-core)
- [ ] Login con Telegram (consumir JWT de TMA flow)
- [ ] Profile view (consumir desde api-core)
- [ ] Protocol discovery (consumir protocols API)
- [ ] Purchase flow (consumir payment API)

### 6.3 — Boundary Enforcement
- [ ] App NO puede crear identidad (exp-013)
- [ ] App NO puede crear autorización (exp-014)
- [ ] App consume contextos de platform-core
- [ ] Test: app no tiene tabla de users propia

**Gate de salida Fase 6:**
- App desplegada en staging
- Auth funciona via platform-core
- No hay lógica de identidad duplicada
- Boundary tests pasan

---

## Fase 7: Cross-Tenant Authorization Enforcement

**Objetivo:** Implementar CI-level checks que previenen violaciones de boundary.

**Depende de:** Fase 4

### 7.1 — Invariant Tests
- [ ] Test: changing tenantId in header -> DENY
- [ ] Test: changing organizationId in body -> DENY
- [ ] Test: cross-organization data access -> DENY
- [ ] Test: JWT without userId -> DENY
- [ ] Test: portal session accessing user-only resources -> DENY
- [ ] Test: TMA token accessing dashboard admin -> DENY

### 7.2 — Architecture Lint
- [ ] Regla: no `userId = null` en getAuth() para nuevas rutas
- [ ] Regla: no JWT decode sin verify
- [ ] Regla: no virtual session fallback en auth
- [ ] Regla: no tenant resolution desde body sin session
- [ ] Regla: schema changes requieren platform-core review

### 7.3 — CI Integration
- [ ] Agregar invariant tests a pipeline
- [ ] Agregar architecture lint a CI
- [ ] Agregar boundary check a PR review
- [ ] Definir failure thresholds

**Gate de salida Fase 7:**
- Todos los invariant tests pasan
- Architecture lint corre en CI
- Boundary violations son detectadas antes de merge
- Documentacion de gates actualizada

---

## Fase 8: Migration & Backward Compatibility

**Objetivo:** Ejecutar migraciones sin romper clientes existentes (exp-012).

**Depende de:** Fase 2-5 completados

### 8.1 — Schema Migrations
- [ ] Unificar `users.telegramId` vs `users.telegram_id`
- [ ] Crear `user_identities` table canónica
- [ ] Migrar `tenant_users` a `organization_memberships`
- [ ] Eliminar `nft_ownership_cache` (nunca escrita)
- [ ] Eliminar `audit_logs` vieja o empezar a escribir en ella

### 8.2 — API Versioning
- [ ] Definir si hay v2 o si es in-place
- [ ] Crear deprecation headers para endpoints legacy
- [ ] Mantener backward compat 6 meses mínimo
- [ ] Documentar endpoints deprecated

### 8.3 — Data Backfill
- [ ] Vincular identidades existentes (wallet + telegram -> userId)
- [ ] Migrar existing tenants a organization model
- [ ] Verificar que todos los usuarios tienen canonical userId
- [ ] Rollback plan para cada migración

### 8.4 — Staged Rollout
- [ ] Staging: testear todas las migraciones
- [ ] Canary: 10% de usuarios en nuevo modelo
- [ ] Full: migrar 100%
- [ ] Monitoring: alertas por boundary violations

**Gate de salida Fase 8:**
- Todas las migraciones ejecutadas en staging sin errores
- Rollback plan documentado y testeado
- No hay datos huérfanos
- Monitoreo activo

---

## Fase 9: Production Rollout

**Objetivo:** Lanzar la plataforma unificada en producción.

**Depende de:** Fase 8

### 9.1 — Pre-Launch
- [ ] Security audit de todo el sistema
- [ ] Load testing con usuarios reales
- [ ] Penetration testing de auth flows
- [ ] Revisar todos los gates de fases anteriores

### 9.2 — Launch
- [ ] Deploy platform-core a producción
- [ ] Deploy api-core actualizado
- [ ] Deploy dashboard actualizado
- [ ] Deploy TMA actualizado
- [ ] Deploy consumer-app (si aplica)

### 9.3 — Post-Launch
- [ ] Monitoring 72h continuas
- [ ] Alertas por auth failures
- [ ] Alertas por boundary violations
- [ ] User feedback collection
- [ ] Retrospectiva de Fase 0-9

**Gate de salida Fase 9:**
- Zero critical bugs en 72h
- Auth failure rate < 0.1%
- Boundary violations = 0
- User satisfaction baseline establecida

---

## Fase 10: Continuous Governance

**Objetivo:** Mantener la integridad arquitectónica a largo plazo.

**Depende de:** Fase 9

### 10.1 — Ongoing
- [ ] Quarterly architecture reviews
- [ ] New features must pass boundary tests
- [ ] ADR updates for new decisions
- [ ] Dependency audit mensual

### 10.2 — Metrics
- [ ] Auth success/failure rates por provider
- [ ] Cross-tenant access attempts (deben ser 0)
- [ ] Identity linking success rate
- [ ] Portal session vs user session ratio

---

## Referencias

| Documento | Ubicacion |
|-----------|-----------|
| ADR-012 Platform Boundary | `apps/dashboard/src/lib/pandoras/docs/ADR-012-platform-experience-boundary.md` |
| ADR-012 Compatibility | `apps/dashboard/docs/adr/ADR-012-Compatibility-Layer-Strategy.md` |
| ADR-010 Organization Control | `apps/dashboard/src/lib/pandoras/docs/ADR-010-organization-control-plane-boundary.md` |
| ADR-011 Multi-Tenant Governance | `apps/dashboard/src/lib/pandoras/docs/ADR-011-multi-tenant-and-governance-integrity-boundary.md` |
| Phase 0 Artefactos | `DOCUMENTACION/phase-0/` |
| TMA Repository | `/Users/Marco/Documents/Company/Crypto/Pandoras/dApps/pandoras_tgApp/pandoras-telegram-app` |

---

*Ultima actualizacion: 2026-08-17 — Fase 0 en progreso*
