# Discord Manager en Growth OS · plan de roles y límites (24 nov 2026)

Objetivo: que un **Discord Manager** trabaje **dentro** de Growth OS (sin una plataforma externa),
con el mínimo privilegio necesario, y que su trabajo alimente el embudo que ya existe.

---

## 1. Estado actual (verificado)

| Pieza | Dónde vive | Estado |
|---|---|---|
| Roles | `NexusRole` en `packages/shared/src/nexus/nexus-rbac.ts` | 9 roles: SUPER_ADMIN, ADMIN, ADMIN_OPERATIONS, ADMIN_MARKETING, ADMIN_COMPLIANCE, TENANT_ADMIN, OPERATOR, MARKETING, VIEWER |
| Permisos | `NexusPermissions` (flags booleanos por módulo) | `users/tenants/finance/growth/marketing/nexus/compliance.manage`, `calendar`, `ecosystem`, `institutionalBooks`, `academyAdmin`, `dealRoom`, `settings`, `hermesQa` |
| Resolución | `resolveEffectivePermissions(role, overrides, surface)` | ✅ funciona, con overrides por colaborador |
| Superficies | `ADMIN · NEXUS · ACADEMY · TMA` | ✅ |
| Gate de tool-calls de Hermes | `ToolAuthorizationGate` + capabilities | ✅ |
| **Enforcement en las APIs de Growth** | `/api/v1/growth/*` | ❌ **no valida permisos**: sólo resuelve el tenant (sesión/wallet). Cualquier sesión válida de la organización entra |
| **UI por rol** | `growth-os/.../layout.tsx` | ❌ sólo distingue `SUPER_ADMIN`/`ADMIN` para el panel de plataforma; no oculta módulos |
| Auditoría | `SecurityAuditLogger` | ✅ existe, pero no hay vista "quién hizo qué" por rol |

**Conclusión:** el modelo de permisos está, la **aplicación** no. Antes de meter a un empleado hay que
cerrar dos huecos: enforcement en APIs y visibilidad de UI.

---

## 2. Rol propuesto: `COMMUNITY_MANAGER`

Nombre interno `COMMUNITY_MANAGER` (etiqueta visible “Community & Discord Manager”). No es un
`MARKETING` recortado: es un rol con alcance de **captación y comunidad**, sin dinero ni gobierno.

| Capacidad | Permiso | Por qué |
|---|---|---|
| Ver y mover leads del embudo | `growth.manage` | su trabajo diario |
| Crear/editar campañas y secuencias | `marketing.manage` | contenido y captación |
| Ver conversaciones y calificar | `hermesQa` (solo lectura) | entender qué pregunta la gente |
| Proponer mensajes y media a Hermes | tools de propuesta (**no** ejecución) | media generada con aprobación |
| Ver listings y estado RWA | `dealRoom` (solo lectura) | responder dudas sin prometer |
| Verificar accesos de Discord | capacidad `discord.verify` (nueva) | dar roles, **sin** poder elevar a admin |
| **NO** finanzas | `finance.manage: false` | nunca |
| **NO** usuarios/tenants | `users.manage/tenants.manage: false` | nunca |
| **NO** gobierno ni emisión | `compliance.manage: false`, sin `nft.mint` | nunca |
| **NO** configuración del tenant | `settings: false` | nunca |

**Regla dura:** puede **proponer** y **operar el embudo**; no puede **aprobar** ni **mover dinero**.
Toda acción sensible (media, publicación, promoción de rol) pasa por aprobación del Fundador.

---

## 3. Qué falta construir (en orden)

| # | Pieza | Riesgo si no existe |
|---|---|---|
| 1 | **Enforcement en `/api/v1/growth/*`** con `resolveEffectivePermissions` sobre la organización resuelta | hoy cualquier sesión de la org puede escribir el CRM; el rol sería decorativo |
| 2 | **Guard de superficie**: que `COMMUNITY_MANAGER` no pueda usar endpoints de finanzas/usuarios aunque los llame directo | escalada por API |
| 3 | **UI por permisos**: ocultar Finanzas, Gobierno, NFT Lab, Settings para ese rol | confusión y clics que fallan |
| 4 | **Vista de auditoría por rol**: “últimas acciones de X” | sin trazabilidad no se puede supervisar |
| 5 | **Capacidad `discord.verify`** separada de `users.manage` | hoy verificar Discord exige ser admin |
| 6 | **Cola de aprobación de media**: propuesta de Hermes → revisión del Fundador → job | publicar sin control |

### Cómo encaja con Hermes y otras redes

```
Discord Manager (Growth OS)
   ├─ ve embudo y conversaciones (lectura)
   ├─ escribe/actualiza leads y campañas (permiso growth/marketing)
   ├─ pide a Hermes: "genera 3 variantes de copy + 1 imagen para AMA"
   │     └─ Hermes PROPONE (no ejecuta) → aprobación del Fundador → job de media
   ├─ publica enlace atribuible /l/<code> por publicación
   └─ nada de precios, retornos ni promesas: lo bloquea la política del tenant
```

Su trabajo **no duplica** nada: el CRM es el mismo, la media la genera el mismo motor, la atribución
usa el mismo `/l/<code>`, y los límites son los permisos que ya existen.

---

## 4. Plan por fases

| Fase | Qué | Criterio de aceptación |
|---|---|---|
| **A** | Enforcement de permisos en las rutas de Growth + guard de superficie | un `COMMUNITY_MANAGER` recibe 403 en `/api/v1/growth/billing` y 200 en `/pipeline` |
| **B** | Rol `COMMUNITY_MANAGER` en el catálogo + overrides por colaborador | se puede invitar y su sesión resuelve los permisos esperados |
| **C** | UI: ocultar módulos sin permiso + badge de rol | Finanzas/Gobierno/NFT no aparecen para ese rol |
| **D** | Capacidad `discord.verify` y vínculo desde la UI (no por script) | verifica sin ser admin, con auditoría |
| **E** | Cola de aprobación de media (Hermes propone, Fundador aprueba) | ninguna publicación sale sin aprobación |
| **F** | Vista de auditoría por rol | se puede responder “qué hizo ayer” |

**Nota de riesgo:** A y B tocan autorización. Se hará con tests que **fallen si el guard desaparece**
(no basta con que la ruta siga respondiendo 200 al dueño).

---

## 5. Decisiones tomadas (24 nov 2026)

1. **Campañas de email:** el Community Manager **sí puede crearlas**, pero quedan
   **pendientes de aprobación del admin** antes de programarse o enviarse.
2. **Media:** el Community Manager **puede aprobar** la generación de media. No necesita pasar por el
   Fundador (sí sigue pasando por el gate de herramientas de Hermes, que no cambia).
3. **Aviso de aprobaciones:** llegan a **Discord**, a un canal privado del tenant (S'Narai).
4. **Nombre del rol:** pendiente de confirmar (`COMMUNITY_MANAGER` por ahora).

---

## 6. Aprobaciones: cómo funcionan hoy y qué falta

**Lo que ya existe**

| Pieza | Rol |
|---|---|
| `nexus_approvals` | tabla de aprobaciones gobernadas: `action_token`, `proposer_id`, `what`, `why`, `resource_scope`, `capability_required`, `risk_level`, `status`, `next_action`, `resolved_by` |
| `PATCH /api/nexus/approvals` | resuelve una aprobación (aprobar/rechazar) validando `canonical_org_id` |
| `operations-repo.listApprovals()` | bandeja de aprobaciones por organización (hoy 0 filas) |
| `operational_approvals` | 32 filas; es otra cosa (decisiones de intent) |
| `hermes_media_requests` | 204 filas; peticiones de media de Sofía |

**Lo que falta**

1. **La creación de campaña no genera aprobación.** `POST /api/v1/growth/email` crea la campaña
   directamente; no pasa por `nexus_approvals`.
2. **No hay aviso.** Nadie recibe un ping cuando hay algo pendiente: ni Discord ni correo.
3. **No hay ejecución diferida.** Aprobar no dispara nada; falta el paso “aprobado → programada”.

**Flujo propuesto (mínimo, sin infraestructura nueva)**

```
Community Manager crea campaña
  → estado BORRADOR + fila en nexus_approvals (what='email_campaign', risk_level=MEDIUM)
  → aviso a Discord del tenant (canal privado) con botones Aprobar / Rechazar
  → PATCH /api/nexus/approvals  →  campaña pasa a PROGRAMADA
  → (rechazo) → RECHAZADA + motivo, y se avisa al manager
```

El aviso usa el mismo patrón de webhooks que ya existe (`apps/dashboard/src/lib/discord.ts`), pero
apuntando al canal del tenant, no a los webhooks globales de alertas.

**Bloqueo actual:** el canal `narai-bucerias` **no es visible para el bot**. Los canales que el bot ve
hoy son `#s-narai-anuncios`, `#s-narai-la-oportunidad`, `#s-narai-avance`, `#s-narai-preguntas`,
`#s-narai-amas` y los tres privados de miembros. Hace falta el **ID del canal** (o darle visibilidad al
bot) para cablear el aviso.

**Nota de seguridad:** el aviso va al canal, pero la **decisión** se valida en el servidor con la
sesión del admin. Un botón en Discord no autoriza nada por sí mismo: abre o confirma una acción que el
servidor vuelve a comprobar.
