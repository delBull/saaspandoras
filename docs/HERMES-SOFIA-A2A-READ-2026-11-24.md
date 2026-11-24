# Sofía ↔ Hermes · lectura gobernada por A2A (24 nov 2026)

Sofía es la asistente personal del Fundador. Esta entrega **abre lectura** sobre la operación de
Pandora's a través del puente A2A existente. No se creó un canal nuevo, ni un usuario nuevo, ni un
token nuevo: se extendió el mecanismo canónico (`AgentRegistry` + `A2AMessageHandler`).

## 1. Qué puede leer ahora

| Mensaje A2A | Capability exigida | Devuelve |
|---|---|---|
| `knowledge.query` | `hermes.knowledge.query` | `claims` (igual que antes) **+ `governedFacts`**: hechos `ACTIVE` con contenido, filtrados por techo de clasificación |
| `contacts.query` | `hermes.contacts.read` | fichas de Deal Pods (nombre, rol, relación, teléfono, correo, contexto, pod) + colaboradores (nombre, rol, correo, WhatsApp, estado) |
| `deals.query` | `hermes.deals.read` | Deal Rooms (publicId, tipo, estado, título, contraparte, empresa, resumen, NDA/POF, fechas) + pods |

Los tres son **aditivos**: nada de lo que Sofía ya consumía cambió de forma o de nombre.

## 2. Qué NO puede hacer

- **Escribir**: no hay `contacts.update`, ni `deals.update`, ni `knowledge.grant` nuevo. Sigue igual.
- **Ver tokens o permisos**: `nexus_collaborators.token` y `.permissions` no se seleccionan.
- **Leer otro tenant en deals**: `deals.query` con `tenantId != pandoras` devuelve vacío con
  `reason: DEALS_SCOPE_PANDORAS_ONLY` (fail-closed, no mezcla operaciones).
- **Saltarse el techo de clasificación**: sin `maxClearance` declarado el agente lee sólo PUBLIC.
- **Llamar sin firma**: HMAC + wallet EIP-191 + nonce + frescura + capability siguen obligatorios
  (no se tocó `A2ASecurityValidator`).

## 3. Techo de clasificación

`AgentRegistry` gana un campo `maxClearance` por agente:

```ts
maxClearance: (process.env.A2A_SOFIA_MAX_CLEARANCE || 'SECRET').toUpperCase()
```

- **Sofía: SECRET** (decisión del Fundador: es su asistente personal).
- **Cualquier otro agente: PUBLIC** por defecto.
- Para reducir el alcance sin tocar código: `A2A_SOFIA_MAX_CLEARANCE=CONFIDENTIAL` (o `PUBLIC`) en
  Vercel y redeploy. Un valor inválido cae a PUBLIC (fail-closed).

El ranking usado es el canónico del runtime (`CLASSIFICATION_LATTICE_RANK`), el mismo que aplica el
`ContextAdapter`; no hay una segunda tabla de niveles.

## 4. Auditoría

Cada lectura escribe un evento `A2A_MESSAGE_RECEIVED` (severity `INFO`, `policyDecision ALLOW`) con
**sólo metadatos**: scope, techo, cuántos registros se devolvieron y cuántos se excluyeron por
clasificación. Nunca el contenido.

```sql
select created_at, actor_id, metadata
from hermes_security_events
where event_type='A2A_MESSAGE_RECEIVED' and actor_id='a2a:sofia'
order by created_at desc limit 20;
```

## 5. Cómo se revoca

| Acción | Cómo |
|---|---|
| Bajar el techo | `A2A_SOFIA_MAX_CLEARANCE=PUBLIC` + redeploy |
| Quitar contactos | eliminar `hermes.contacts.read` de `allowedCapabilities` de `sofia` en `agent-registry.ts` |
| Quitar deals | eliminar `hermes.deals.read` (idem) |
| Revocar a Sofía entera | `status: 'REVOKED'` en su entrada del registro |

## 6. Verificación ejecutada

`packages/hermes-core/src/a2a/__tests__/a2a-sofia-read-access.test.ts` (5 tests, pasan):

- `SRA-01` Sofía tiene las dos capabilities nuevas y Hermes **no** (no hay auto-concesión);
- `SRA-02` `knowledge.query` devuelve hechos gobernados y mantiene `claims`;
- `SRA-03` bajar el techo a PUBLIC excluye el hecho SECRET y lo reporta en `excludedByClearance`;
- `SRA-04` `contacts.query` devuelve la ficha del pod y colaboradores **sin** `token` ni `permissions`;
- `SRA-05` `deals.query` devuelve las salas en scope Pandora's y vacío fuera de él.

## 7. Lo que Sofía debe adaptar de su lado

El puente ya entrega los datos; su cliente tiene que:

1. enviar `type: 'contacts.query'` o `'deals.query'` con el mismo sobre firmado que ya usa;
2. leer `payload.podContacts`, `payload.collaborators`, `payload.rooms`, `payload.pods`;
3. para knowledge, usar `payload.governedFacts` (los `claims` siguen ahí por compatibilidad).

Si su implementación sólo conoce `knowledge.query`, no se rompe: sigue funcionando igual y además
recibe `governedFacts`.
