# ADR-013 — Application-to-Frontend Integration Boundary

**Status:** Accepted  
**Date:** 2026-08-08  
**Decision Type:** Architectural  
**Scope:** Control Plane / Application / Server Actions / Frontend  
**Depends On:** ADR-010, ADR-011, ADR-012  
**Sprint:** 24

---

## 1. Context

Los Sprints 22, 22.5, 22.6 y 23 establecieron y congelaron las fronteras de autoridad, gobernanza,
multi-tenancy y persistencia del Organization Control Plane.

El sistema actualmente dispone de:
- `ControlPlaneContext` como frontera de autoridad
- `TenantScope` como representación explícita de autoridad organizacional
- Queries tenant-scoped
- Commands tenant-scoped
- `OperationalIntentRepository`, `GovernanceEventRepository`, `ApprovalTransaction`
- Implementaciones PostgreSQL/NeonDB con compare-and-set
- Governance Audit Trail append-only
- Transactional Outbox

Sin embargo, estas capacidades no están conectadas con la superficie de aplicación real.

---

## 2. Decision

El **Frontend nunca será una autoridad de dominio ni de tenancy**.

La UI únicamente:
1. identifica el recurso solicitado mediante la URL
2. presenta ViewModels
3. solicita operaciones mediante Server Actions
4. transmite identificadores de recursos y datos de intención
5. **nunca determina permisos**
6. **nunca determina el `organizationId` autorizado**
7. **nunca accede directamente a PostgreSQL**
8. **nunca importa repositorios, Drizzle o modelos de infraestructura**

```
┌──────────────────────────────┐
│          FRONTEND            │
│ React / Next.js              │
│ params.id / form data        │
└──────────────┬───────────────┘
               │ requestedOrganizationId
               ▼
┌──────────────────────────────┐
│       SERVER ACTIONS         │
│ authenticate                 │
│ build ControlPlaneContext    │
│ invoke Application Command   │
│ map result → UI result       │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│      APPLICATION LAYER       │
│ Queries / Commands           │
│ ViewModels / DTOs            │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│           DOMAIN             │
│ ApprovalService              │
│ Governance rules             │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│      REPOSITORY PORTS        │
│ TenantScope                  │
│ ApprovalTransaction          │
│ GovernanceEventRepository    │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│     POSTGRES / NEONDB        │
│ Atomic persistence           │
│ Audit trail / Outbox         │
└──────────────────────────────┘
```

---

## 3. Architectural Invariants

### 3.1 Session-derived authority
La autoridad se deriva de `ControlPlaneContext` → `requireOrganizationScope()`.  
Nunca de `formData.organizationId`.

### 3.2 URL identifies; session authorizes
La URL identifica el recurso. La sesión determina si el actor puede operar sobre él.

### 3.3 Server Actions son transport adapters
No contienen SQL, reglas de negocio, ni autorización manual duplicada.

### 3.4 Application Layer permanece infra-agnostic
No importa `drizzle-orm`, `src/db`, Neon ni PostgreSQL directamente.

### 3.5 Frontend consume ViewModels
Nunca entidades internas del dominio ni filas de PostgreSQL.

### 3.6 Commands siguen siendo autoritativos
`Server Action → Command → Domain Service → Transaction`.  
Nunca `Server Action → Repository`.

### 3.7 Governance permanece atómica
Una aprobación produce dentro de la misma transacción:
```
OperationalIntent transition + Governance Audit Event + Outbox Event
```

---

## 4. Error Boundary

```typescript
type CommandResult =
  | { success: true }
  | {
      success: false;
      code: 'FORBIDDEN' | 'NOT_FOUND' | 'INVALID_STATE' | 'ALREADY_PROCESSED' | 'VALIDATION_ERROR';
      message: string;
    };
```

Detalles de PostgreSQL, Drizzle o infraestructura no forman parte del contrato de UI.

---

## 5. Caching

Las mutaciones invalidan vistas afectadas mediante `revalidatePath(...)`.  
La revalidación es preocupación de presentación, no del dominio.

---

## 6. Out of Scope

ADR-013 / Sprint 24 **NO** incluye:
- Outbox Worker completo
- Kafka / Redis
- Nuevo diseño del Kernel
- Expansión del Mission Engine
- Nuevas capacidades de Hermes
- CQRS completo

---

## 7. Acceptance Criteria

- [ ] Ninguna UI accede directamente a infraestructura
- [ ] Todas las actions construyen contexto desde sesión
- [ ] Todas las queries utilizan `TenantScope`
- [ ] Todos los commands utilizan `TenantScope`
- [ ] Mocks de producción eliminados
- [ ] Approve/Reject funciona desde la UI
- [ ] Cross-tenant access es rechazado
- [ ] Doble aprobación retorna `ALREADY_PROCESSED`
- [ ] Audit event se genera
- [ ] Outbox event se genera
- [ ] Rollback elimina todas las escrituras de la transacción
- [ ] Activity refleja el audit trail real
- [ ] Overview / Missions / Governance reflejan estado persistido

---

## 8. Consequence

El frontend deja de ser una demostración y se convierte en un consumidor real de los contratos del sistema. La arquitectura queda preparada para Outbox Worker, background processing y production-scale event processing sin modificar la frontera fundamental de autoridad.

**ADR-013 queda ACCEPTED.**
