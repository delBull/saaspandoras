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

## 5. Decisiones que necesito

1. ¿El rol se llama `COMMUNITY_MANAGER` o prefieres otro nombre visible?
2. ¿Puede **crear** campañas de email o sólo prepararlas para aprobación?
3. ¿Puede ver conversaciones completas de WhatsApp (lectura) o sólo resúmenes?
4. ¿Quién aprueba la media: sólo tú, o también un `ADMIN_MARKETING`?
