# Agenda Soberana multi-tenant — Hoja de ruta

> **Estado:** revisión de código completada, sin cambios de implementación.
> **Fecha:** 19 nov 2026.
> **Alcance:** Agenda Soberana (agendar, sala, deck, presencia, minuta, seguimiento) en
> Nexus, Nexus TMA, Growth OS y Pandora's Academy, para tenants distintos de Pandora's.
>
> **Regla del documento:** separa lo implementado de lo pendiente. Si algo no tiene
> evidencia de runtime, se marca como inspección de código.

---

## 1. Veredicto

**El modelo de datos es multi-tenant; la experiencia y el wiring no.**

- `meetings`, `meeting_participants`, `meeting_presence_sessions` y
  `meeting_presentation_state` están scoped por `canonical_org_id`.
- `AgendaCore.createMeeting` recibe `canonicalOrgId` y host; no inventa tenant.
- La configuración de agenda se guarda por proyecto en
  `projects.extraConfig.sovereignCalendar`.
- **Pero** el booking público de un tenant se atribuye a `projectId = 1` (Pandora's),
  Growth OS/Academy no tienen superficie de agenda, el catálogo de decks es global y
  los correos son de Pandora's.

Conclusión: hoy **no se puede vender Agenda Soberana como capacidad multi-tenant
terminada**. Hay 2 P0 de atribución/aislamiento y 4 P1 de producto/marca.

---

## 0. Empezar aquí (próxima sesión)

1. Leer **MT-01** y **MT-02** (los dos P0).
2. Ejecutar la **Fase 0** completa: propagar tenant y quitar los fallbacks a
   `pandoras`.
3. Validar con **dos proyectos reales** que un booking de A no cae en B.
4. **No** construir la UI de agenda para tenants (Fase 1) hasta cerrar la Fase 0.

---

## 2. Lo que ya está implementado (Nexus)

No rehacer:

- Agenda del operador `/nexus/agenda` con bloques **Ahora / Programadas / Anteriores**.
- Agendar presentación (deck) y **reunión externa** (sin deal ni deck, con asunto).
- Deck inyectado en sala, control de slides por host, guion y contexto.
- Lobby propio, enlace temporal de anfitrión (15 min), pantalla de cierre.
- Presencia por permanencia (`meeting_presence_sessions`, ≥ 60 s).
- Minuta: tareas manuales + audio (solo audio, ≤ 10 MB) con resumen IA.
- Seguimiento opcional:
  - casilla al finalizar para el correo de cortesía (`follow_up_enabled`);
  - envío manual del resumen + tareas (`summary_sent_at`);
  - opt-out respetado por el cron.
- Deck demo `aurora-demo` para ensayos.
- **Añadir a Google Calendar (rápido, sin OAuth):** botón en agenda, Hub y drawer;
  evento prellenado con título/hora/liga. No es sincronización automática.
- **Borrado lógico de reuniones pasadas:** el host archiva (`meetings.archived_at`);
  no se borra historial, minuta ni follow-ups; se oculta en agenda/Hub/TMA.

Evidencia: `docs/NEXUS_REUNIONES_PRESENTACIONES.md`,
`apps/dashboard/DOCUMENTACIÓN/Producto/MEET-DEMO-Y-HOST-LINK.md`.

---

## 3. Mapa de superficies

| Superficie | Agenda | Crear/agendar | Presentar | Minuta | Follow-up |
|---|---|---|---|---|---|
| Nexus `/nexus/agenda` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Nexus TMA (`apps/nexus-tma`) | ✅ limitada | ❌ solo lista/unirse/cancelar | ❌ | ❌ | ❌ |
| Growth OS (`/growth-os/...`) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Academy (`apps/academy`) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Público `/schedule/<slug>` | ✅ | ⚠️ atribuye a project 1 | — | — | — |

---

## 4. Hallazgos

### MT-01 · P0 · El booking público de un tenant se atribuye a Pandora's

**Dónde**

- `apps/dashboard/src/actions/scheduling.ts` → `bookSlot()`:
  `const projectId = 1; // TODO: Resolve from context in multi-tenant v2`
- `apps/dashboard/src/components/scheduler/SchedulerForm.tsx` → solo recibe `userId`
  y `meetingType`; no recibe `tenantSlug` ni `projectId`.
- `apps/dashboard/src/app/schedule/[username]/page.tsx` conoce `username`, pero no
  lo pasa al formulario.

**Impacto**

Una cita desde `/schedule/<tenant>` se crea en el proyecto 1 (Pandora's). El
`canonical_org_id`, el CRM, las notificaciones y la agenda del tenant quedan mal.

**Criterio de aceptación**

- Agendar desde `/schedule/<tenant>` crea `meetings.canonical_org_id = <org del tenant>`.
- El lead/booking queda en el proyecto del tenant.
- Test con dos proyectos: A y B; el booking de A no aparece en B.

### MT-02 · P0 · Fallbacks silenciosos a `pandoras`

**Dónde**

- `apps/dashboard/src/lib/scheduling/sovereign-calendar-engine.ts` →
  `resolveConfig`: `tenantSlug || 'pandoras'`.
- `apps/dashboard/src/lib/scheduling/syncBookingPipeline.ts` → si no encuentra el
  proyecto, cae a `projects.slug = 'pandoras'`.
- `apps/dashboard/src/app/api/v1/tma/nexus/agenda/route.ts` →
  `canonicalOrgId ?? 'pandoras'`.

**Impacto**

Si el tenant no resuelve, se muestra/crea data de Pandora's en lugar de fallar
cerrado. Riesgo de aislamiento.

**Criterio de aceptación**

- Sin tenant resoluble → `400/409 ORG_UNRESOLVED`; nunca `pandoras` por defecto.
- Tests de tenant desconocido en booking, config y TMA.

### MT-03 · P1 · Growth OS y Academy no tienen agenda de tenant

**Dónde**

- `apps/dashboard/src/app/growth-os/organizations/[organizationSlug]/layout.tsx`
  no tiene tab de Agenda.
- Único enlace: `apps/dashboard/src/app/growth-os/hermes/autonomous-closing/page.tsx`
  → `/schedule/pandoras` **fijo**.
- `apps/dashboard/src/app/portal/[organizationSlug]/growth/page.tsx` redirige a
  Growth OS; no hay agenda.
- `apps/academy` no tiene rutas `schedule`/`meet`/`agenda`; solo dos links relativos
  a `/schedule/pandoras` en `master-tokenizacion/page.tsx`, sin rewrite en el repo.

**Impacto**

El tenant no tiene dónde ver ni operar su agenda; Academy puede dar 404 si se sirve
en su propio dominio.

**Criterio de aceptación**

- Growth OS tiene `.../agenda` con las reuniones de **su** organización.
- Academy tiene una entrada funcional (ruta propia o link absoluto verificado).
- Un usuario de otro tenant no ve esas reuniones.

### MT-04 · P1 · Configuración de agenda solo para Nexus admin

**Dónde**

- `apps/dashboard/src/app/api/v1/scheduling/config/route.ts` → `POST` exige
  `requireNexusAdmin` (`nexus.manage`/`users.manage`) o platform admin.
- `requireNexusAdmin` rechaza superficies `ACADEMY` y `TMA`.
- El endpoint acepta cualquier `tenantSlug` sin verificar pertenencia.

**Impacto**

Un admin de tenant con `calendar.manage` no puede configurar su agenda; un admin de
Nexus podría tocar la de otro tenant.

**Criterio de aceptación**

- `calendar.manage` scoped al tenant permite editar **solo** su configuración.
- Cross-tenant → 403.
- Academy/TMA no escalan a admin de Nexus.

### MT-05 · P1 · Catálogo de decks global

**Dónde**

- `packages/db-core/src/schema.ts` → `nexusPresentations` no tiene
  `canonical_org_id`.
- `apps/dashboard/src/lib/nexus/presentations-catalog.ts` es un registro global.
- `nexus_deal_rooms.presentation_id` y `meetings.presentation_id` apuntan al mismo
  catálogo.

**Impacto**

Todos los tenants comparten Celeste, Aurora y los demás decks. No hay decks
privados ni plantillas por tenant.

**Criterio de aceptación**

- Decks con `canonical_org_id` (o `tenant_id`) y filtro por organización.
- Plantillas globales explícitas (flag) si se quieren compartir.
- Un tenant no puede seleccionar el deck privado de otro.

### MT-06 · P1 · Branding global en correos

**Dónde**

- `apps/dashboard/src/lib/nexus/meeting-invites.ts` → “PANDORA'S · SOVEREIGN MEET”,
  `FROM` de Pandora's.
- `apps/dashboard/src/lib/nexus/meeting-reminders.ts` → mismo branding;
  `counterparty` fijo a “Pandora's Group”.
- `apps/dashboard/src/lib/nexus/agenda-followups.ts` → mismo header y `FROM`.

**Impacto**

El invitado de un tenant recibe un correo de Pandora's, no del tenant. Rompe la
marca blanca y puede confundir la relación comercial.

**Criterio de aceptación**

- Nombre, logo y `reply-to`/`from` según el proyecto/tenant.
- Tests de branding para Pandora's y para un tenant.
- Si no hay dominio verificado, usar `pandoras.finance` con nombre del tenant y
  `reply-to` del tenant (decisión pendiente).

### MT-07 · P2 · TMA con paridad incompleta

**Dónde**

- `apps/dashboard/src/app/api/v1/tma/nexus/agenda/route.ts`:
  - `orgId = canonicalOrgId ?? 'pandoras'`;
  - participantes solo por `identity_id`, no por email;
  - `title` ignora `meeting.title` (externas salen como “Sovereign Meet”);
  - join URL sin `?p=`, por lo que la asistencia desde TMA no se registra;
  - no hay presentación, minuta ni follow-up.

**Criterio de aceptación**

- Invitado por email ve su reunión en TMA.
- Reunión externa muestra su asunto.
- El join de TMA usa el token personal y registra asistencia.
- Sin fallback a `pandoras`.

### MT-08 · P2 · `createAdminBooking` crea meetings en `'default'`

**Dónde**

- `apps/dashboard/src/actions/scheduling.ts` → `createAdminBooking`:
  `canonicalOrgId: 'default'`, sin `hostCollaboratorId`.

**Impacto**

La reunión no aparece en la agenda del operador y queda fuera del aislamiento por
organización.

**Criterio de aceptación**

- Usa la organización del admin/host y resuelve `hostCollaboratorId`.
- Si no se puede resolver, falla cerrado.

### MT-09 · P2 · Resolución de alias/host ambigua

**Dónde**

- `apps/dashboard/src/actions/scheduling.ts` → `resolveUserByAlias`:
  - si el proyecto no tiene owner con wallet, cae a un admin de plataforma;
  - el `username` de `/schedule/[username]` se usa como `tenantSlug` y como alias de
    usuario a la vez.

**Impacto**

Un tenant podría agendar contra el host/admin equivocado o contra la config de
Pandora's.

**Criterio de aceptación**

- Alias de host y slug de tenant son conceptos separados.
- Sin owner resoluble → error explícito, no admin de plataforma.

### MT-10 · P2 · Metadatos públicos de agenda hardcodeados

**Dónde**

- `apps/dashboard/src/app/schedule/[username]/page.tsx` → metadata
  “Agenda Soberana | Pandora's Finance”.

**Criterio de aceptación**

- Título/descripción por tenant, con fallback honesto.

---

## 5. Hoja de ruta

### Fase 0 — Contención (P0)

Objetivo: que ningún booking/consulta caiga en el tenant equivocado.

- [ ] **0.1** Propagar `tenantSlug`/`projectId` desde `/schedule/[username]` →
  `SchedulerForm` → `bookSlot` → `syncBookingToPipeline`.
- [ ] **0.2** Eliminar `projectId = 1`; resolver el proyecto desde el slot/host o
  desde el tenant explícito.
- [ ] **0.3** Fail-closed en `resolveConfig`, `syncBookingToPipeline` y TMA:
  `ORG_UNRESOLVED`/`TENANT_UNRESOLVED`.
- [ ] **0.4** Tests de dos tenants: A no ve/crea en B.

**Archivos:** `actions/scheduling.ts`, `components/scheduler/SchedulerForm.tsx`,
`app/schedule/[username]/page.tsx`, `lib/scheduling/syncBookingPipeline.ts`,
`lib/scheduling/sovereign-calendar-engine.ts`,
`app/api/v1/tma/nexus/agenda/route.ts`.

### Fase 1 — Superficie de agenda para tenants (P1)

- [ ] **1.1** Ruta de agenda compartida por organización
  (`/portal/[org]/agenda` o `/growth-os/organizations/[slug]/agenda`) que reutilice
  `OperationsAgendaTab` + `SchedulePresentationForm` + sala.
- [ ] **1.2** Entrada en el nav de Growth OS.
- [ ] **1.3** Academy: decidir ruta propia vs link absoluto verificado.
- [ ] **1.4** `calendar.manage` scoped al tenant para configurar agenda.
- [ ] **1.5** Tests de aislamiento y de UI.

**No rehacer:** la agenda, sala, deck, lobby, minuta y follow-up de Nexus ya
funcionan; se reutilizan.

### Fase 2 — Decks por tenant (P1)

- [ ] **2.1** Migración aditiva: `nexus_presentations.canonical_org_id` nullable
  (NULL = plantilla global) o tabla de mapeo tenant↔deck.
- [ ] **2.2** `listDecks(org)` y filtro en selectores de agenda/deal.
- [ ] **2.3** Validación server-side: un deck privado de otro tenant → 403.
- [ ] **2.4** Migrar Aurora/Celeste: decidir cuáles son plantillas globales.
- [ ] **2.5** Tests de catálogo por tenant.

### Fase 2.5 — Google Calendar automático (P2, opcional)

> Ya existe el botón rápido “Añadir a Google Calendar” (render URL). Esto es la
> integración automática real, que requiere OAuth.

- [ ] `calendar_connections` por host (refresh token cifrado).
- [ ] OAuth `calendar.events` + `openid email` con state firmado.
- [ ] Crear/actualizar/borrar evento al crear/reagendar/cancelar.
- [ ] `meeting_calendar_events` para idempotencia y reintentos.
- [ ] UI “Conectar Google Calendar” en Settings.
- [ ] Credenciales `GOOGLE_CLIENT_ID`/`SECRET`/`REDIRECT_URI`.

### Fase 3 — Branding por tenant (P1)

- [ ] **3.1** Resolver marca desde `projects` (nombre, logo, color, reply-to).
- [ ] **3.2** Invitaciones, recordatorios y follow-ups usan la marca; Pandora's solo
  si el tenant es Pandora's.
- [ ] **3.3** Decidir dominio de envío (compartido con reply-to vs dominio verificado
  por tenant).
- [ ] **3.4** Tests de branding.

### Fase 4 — Paridad TMA y Academy (P2)

- [ ] **4.1** TMA: match por email, `meeting.title`, `?p=` para asistencia,
  fail-closed de org.
- [ ] **4.2** Academy: link absoluto o ruta propia; metadata por tenant.
- [ ] **4.3** `createAdminBooking` con org/host reales.
- [ ] **4.4** `resolveUserByAlias`: separar alias de host y slug de tenant.

### Fase 5 — Endurecimiento (P2)

- [ ] **5.1** Auditoría de configuración de agenda y bookings por org.
- [ ] **5.2** Métricas: bookings por org, meetings por org, entrega de follow-ups.
- [ ] **5.3** Rate limit/idempotencia por tenant.
- [ ] **5.4** E2E con dos tenants y dos hosts.

---

## 6. Decisiones abiertas

1. **Decks:** ¿globales con plantillas, o cada tenant tiene su catálogo privado?
   Recomendación: `canonical_org_id` nullable + plantillas globales explícitas.
2. **Configuración:** ¿`calendar.manage` por tenant o solo `nexus.manage`?
   Recomendación: capability por tenant, con `nexus.manage` solo para plataforma.
3. **Academy:** ¿misma app/superficie embebida o link absoluto al dashboard?
   Recomendación: link absoluto verificado a corto plazo; superficie propia después.
4. **Correo:** ¿un dominio compartido (`pandoras.finance`) con nombre/reply-to del
   tenant, o dominios verificados por tenant?
   Recomendación: compartido con reply-to en V1; dominio propio cuando el tenant lo
   pida.
5. **Hosts:** ¿cómo se mapea un alias de host a su tenant y a su proyecto?
   Hoy `username` se usa para ambas cosas; hay que separarlo.

---

## 7. Reglas de implementación

- No crear una segunda fuente de verdad para agenda/tenant.
- No usar `pandoras` como fallback silencioso.
- Migraciones **aditivas**; aplicar con el verificador, no a ciegas:
  ```bash
  cd apps/dashboard
  bun run db:verify:production
  bun run db:migrate:production   # solo DDL aditivo del dominio reuniones
  ```
- No compartir decks entre tenants sin decisión explícita.
- No enviar correos cross-tenant.
- Cada cambio con test que falle si se elimina la implementación.

---

## 8. Definition of done (multi-tenant)

1. Un booking desde `/schedule/<tenant>` crea la reunión en la org del tenant.
2. Un operador del tenant ve su agenda en Growth OS (y Academy según decisión).
3. Un usuario de A no puede leer/crear/cerrar reuniones de B (404/403).
4. La configuración de agenda de A no puede ser editada por B.
5. Los decks privados de A no aparecen en B.
6. Invitaciones/recordatorios/follow-ups muestran la marca del tenant.
7. TMA muestra las reuniones por email, con título y asistencia.
8. `tsc` 0 errores, tests verdes y verificación de DB al día.

---

## 9. Verificación de esta revisión

- **Método:** inspección de código y esquema; sin ejecución de flujos multi-tenant.
- **Evidencia principal:**
  - `actions/scheduling.ts` (`bookSlot`, `createAdminBooking`, `resolveUserByAlias`).
  - `lib/scheduling/syncBookingPipeline.ts`.
  - `lib/scheduling/sovereign-calendar-engine.ts`.
  - `app/api/v1/scheduling/config/route.ts`.
  - `app/api/v1/tma/nexus/agenda/route.ts`.
  - `packages/db-core/src/schema.ts` (`meetings`, `nexusPresentations`).
  - `lib/nexus/meeting-invites.ts`, `meeting-reminders.ts`, `agenda-followups.ts`.
  - `apps/academy` y `apps/dashboard/src/app/growth-os`.
- **No verificado:** comportamiento runtime con dos tenants reales; requiere prueba
  end-to-end después de la Fase 0.

---

## 10. Changelog

| Fecha | Cambio |
|---|---|
| 19 nov 2026 | Revisión inicial; hallazgos MT-01…MT-10 y hoja de ruta por fases. |
