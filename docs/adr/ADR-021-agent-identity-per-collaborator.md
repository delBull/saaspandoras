# ADR-021 · Identidad de agente por colaborador (Developer Hub)

**Estado:** propuesta para aprobación
**Contexto:** Nexus es una superficie **sólo para colaboradores**: no hay clientes ni
terceros dentro. El siguiente paso es que cada colaborador (empezando por el COO)
opere con **su propia IA**, igual que Marco opera con la suya, pero **con su
identidad, su scope y sus candados**.

---

## 1. Decisión

Un colaborador no "comparte la cuenta de Marco". Obtiene un **actor propio de
agente**, derivado de su identidad de colaborador ya existente:

```
Authenticated Identity (users / collaborator)
        ↓
Canonical Organization (canonicalOrgId)
        ↓
Agent Key  ← credencial propia, revocable, con expiración
        ↓
Delegation (capabilities + resource scope + expiración + aprobación)
        ↓
Policy gate (por operación, por recurso)
        ↓
Execution (tool gateway)  →  Audit (hash chain)
```

El agente **actúa como el colaborador** (mismos permisos efectivos, nunca más),
y por encima de él hay una **delegación** que puede ser más restrictiva que su
rol, pero jamás más amplia.

### Invariantes

1. **Identidad separada.** El agente nunca usa las credenciales de otra persona.
   `actor = collaborator:<id>` + `agent_key_id` en cada evento.
2. **Sin escalada.** Una delegación no puede conceder una capability que el
   colaborador no tenga, ni un recurso fuera de su scope.
3. **Sólo el owner es soberano.** `SUPER_ADMIN` (Marco) es el único que puede
   crear delegaciones de nivel propietario, saltar el scope y aprobar
   excepciones. Nadie más puede aprobar por encima de sí mismo.
4. **Expiración por defecto.** Toda delegación nace con `expires_at` (30 días
   por defecto, máximo 90). Renovar = un clic y nueva aprobación del owner.
5. **Recurso con dueño.** Operar un Deal Pod o un Deal Room ajeno requiere
   `resource_share` aprobado por **el owner de ese recurso**, no por quien lo
   pide. Sin share: lectura de lo público y nada más.
6. **Idempotencia.** Toda mutación del agente exige `Idempotency-Key`; índice
   único `(agent_key_id, idempotency_key)`. Reintentar no duplica.
7. **Kill switch.** Revocar un `agent_key` corta el acceso en la siguiente
   petición (no hay caché de permisos). Existe además un switch global.
8. **Auditoría.** Cada acción deja `actor`, `agent_key_id`, `delegation_id`,
   recurso, resultado y huella. Sin agente identificable no se ejecuta.

---

## 2. Modelo de datos (aditivo, sin tocar contratos existentes)

```sql
-- Credencial del agente (una por colaborador y entorno).
agent_keys (
  id uuid pk,
  collaborator_id int not null,          -- nexus_collaborators.id
  canonical_org_id text not null,
  label text not null,                   -- "Mac de Pablo · COO"
  key_prefix text not null,              -- para identificarla sin exponerla
  key_hash text not null unique,         -- SHA-256 del secreto
  status text not null default 'ACTIVE', -- ACTIVE | SUSPENDED | REVOKED
  expires_at timestamptz not null,
  last_used_at timestamptz,
  created_by text not null,              -- quién la emitió
  created_at timestamptz not null default now()
);

-- Delegación: qué puede hacer el agente, sobre qué, hasta cuándo.
agent_delegations (
  id uuid pk,
  agent_key_id uuid references agent_keys(id) on delete cascade,
  collaborator_id int not null,
  capabilities jsonb not null,           -- subconjunto de los permisos efectivos
  scope jsonb not null,                  -- { pods:[], rooms:[], projects:[] }
  status text not null default 'PENDING',-- PENDING | ACTIVE | SUSPENDED | REVOKED
  approved_by text,                      -- owner que aprueba
  approved_at timestamptz,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revoke_reason text,
  created_at timestamptz not null default now()
);

-- Autorización del dueño del recurso para operarlo (colaboración puntual).
resource_shares (
  id uuid pk,
  resource_type text not null,           -- pod | room | project
  resource_id text not null,
  owner_org_id text not null,
  shared_with_collaborator_id int not null,
  capabilities jsonb not null,           -- p.ej. ["deal.read","deal.propose"]
  approved_by text not null,             -- owner del recurso
  status text not null default 'ACTIVE',
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- Límites operativos por agente (candados).
agent_limits (
  agent_key_id uuid pk references agent_keys(id) on delete cascade,
  max_mutations_per_hour int not null default 60,
  max_outbound_messages_per_day int not null default 50,
  require_approval_for jsonb not null default '["deal.sign","payment.*","publish.*"]',
  auto_suspend_on_anomaly boolean not null default true
);
```

Nada de esto modifica `canonicalOrgId`, `ControlPlaneContext`, capabilities,
policy gates ni los contratos de pago. Todo es capa de delegación encima.

---

## 3. Flujos

### 3.1 Emitir acceso (Marco → Pablo)

```
Nexus → Developer Hub → "Mi agente"
  1. Pablo genera una agent_key  → se muestra UNA vez (hash en BD)
  2. Pide una delegación: capabilities + scope + 30 días
  3. Marco recibe la solicitud (bandeja de aprobaciones) → aprueba / ajusta scope
  4. Se activa; Pablo conecta su IA local contra la API del Developer Hub
```

Renovar: la delegación expirada queda `EXPIRED`; un clic genera la nueva
solicitud con el mismo scope para que Marco la apruebe de nuevo.

### 3.2 Colaboración en un recurso ajeno

```
Pablo quiere operar el Deal Pod de S'Narai
  1. Pide resource_share sobre pod:"snarai" con capabilities deal.read + deal.propose
  2. El OWNER DEL POD (Marco, o el owner del tenant cuando exista) aprueba
  3. Se crea el share con expiración
  4. El gate verifica: capability + delegación activa + share activo + scope
```

Sin share → sólo lo público. Con share → exactamente lo concedido.

### 3.3 Revocación y emergencia

| Situación | Acción | Efecto |
|---|---|---|
| Fin de la colaboración | revocar delegación | siguiente petición denegada |
| Máquina comprometida | revocar agent_key | todas las delegaciones mueren con ella |
| Comportamiento anómalo | auto-suspensión por límites | delegación `SUSPENDED`, aviso al owner |
| Incidente global | switch global | todas las agent_key suspendidas |

La revocación **no borra evidencia**: el audit y los registros quedan.

---

## 4. Candados anti-daño (aunque su máquina esté comprometida)

1. **Límite por hora** de mutaciones (`agent_limits`). Al excederlo: `429` y, si
   `auto_suspend_on_anomaly`, suspensión inmediata.
2. **Acciones que siempre piden aprobación humana** aunque estén delegadas:
   `deal.sign`, `payment.*`, `publish.*`, `tenant.*.delete`, cambios de
   permisos. Se configuran por agente; el default ya es restrictivo.
3. **No puede tocar la identidad**: crear/editar colaboradores, emitir claves,
   cambiar roles o aprobar delegaciones está fuera del alcance de cualquier
   agente que no sea el owner.
4. **Scope cerrado**: una delegación sin recurso explícito no opera recursos.
5. **Lectura de secretos prohibida**: el agente nunca recibe credenciales de
   canales (WhatsApp/Telegram/Meta); usa herramientas del gateway.
6. **Firma de dinero**: el agente no puede mover fondos; propone y el humano
   firma (Payment Core).

---

## 5. Developer Hub con contenido según rol

Hoy `/nexus/developers` muestra lo mismo a ADMIN y SUPER_ADMIN. Debe pasar a ser
**role-aware**, y además ser el punto donde cada colaborador conecta su IA:

| Rol / permiso | Qué ve |
|---|---|
| `developer` | A2A SDK, endpoints de lectura, cómo conectar su agente local, su `agent_key`, el estado de su delegación |
| `ADMIN` / `SUPER_ADMIN` | todo lo anterior + emisión de claves, aprobación de delegaciones, límites, revocación |
| sin `developer` | pantalla de solicitud (la que ya existe) |
| otros roles | **nada**: ni rutas, ni endpoints, ni mención de agentes en el sidebar |

Regla dura: **el contenido se filtra en servidor**, no con `display:none`. Un
endpoint que el rol no puede usar no se documenta ni se expone.

---

## 6. Primer caso de uso (plataformas)

Colaboración interna sobre **S'Narai**, **Forge** y los deal pods que vengan:

- Cada uno conserva su identidad y sus acciones (nada de "cuenta compartida").
- El recurso se comparte explícitamente (`resource_shares`) con el otro.
- Las acciones quedan separadas y auditadas por actor.
- El owner del recurso puede cortar el acceso sin afectar al resto.

---

## 7. Fases

| Fase | Alcance | Depende de |
|---|---|---|
| 0 | Bandeja de aprobaciones (`nexus_access_requests`, migración 0125 ya aplicada) | — |
| 1 | `agent_keys` + `agent_delegations` + emisión y revocación | fase 0 |
| 2 | Gate de ejecución: capability + delegación + scope + límites | fase 1 |
| 3 | `resource_shares` (pod/room/project) con aprobación del owner | fase 2 |
| 4 | Developer Hub role-aware + "conectar mi IA" | fase 1 |
| 5 | Auto-suspensión por anomalía y panel de límites | fase 2 |

## 8. Fuera de alcance (explícito)

- No se crea un modelo de identidad paralelo: el agente cuelga de la identidad
  del colaborador.
- No se permite que un agente emita claves o apruebe a otros agentes.
- No se comparten secretos de canal con agentes.
- No se automatizan pagos ni firmas: se proponen.

## 9. Seguridad: preguntas de adversario

| Pregunta | Respuesta del diseño |
|---|---|
| ¿Puede un agente de Pablo leer el pod de un cliente? | Solo con `resource_share` aprobado por el owner, y sólo las capabilities concedidas |
| ¿Puede escalar sus permisos? | No: la delegación es intersección con sus permisos efectivos |
| ¿Puede sobrevivir a una revocación? | No: la clave se valida por petición; no hay caché |
| ¿Puede duplicar una operación? | No: `Idempotency-Key` única por clave |
| ¿Puede actuar tras comprometerse su máquina? | Los límites y la auto-suspensión lo cortan; el owner revoca en un clic |
| ¿Puede borrar evidencia? | No: el audit es append-only y no tiene endpoint de borrado |
