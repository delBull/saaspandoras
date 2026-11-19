# Nexus · Reuniones y presentaciones soberanas

Estado real de la cadena **propuesta → deal → agenda → sala → seguimiento**, decisiones tomadas y
lo que queda pendiente. Última actualización: 18 nov 2026.

> Regla de este documento: describe lo que **está** implementado y lo que **no**. Si algo no tiene
> evidencia de runtime, se dice.

---

## 1. Flujo completo

```
Deal Room (nexus_deal_rooms)
  ├─ deck del deal          → nexus_deal_rooms.presentation_id
  ├─ firmantes (1-2)        → nexus_deal_signers
  └─ invitados al meet (N)  → meeting_participants (email + join_token)

Agenda Soberana (meetings)
  ├─ presentation_id        → deck a presentar
  ├─ deal_room_id           → deal asociado (links dinámicos)
  └─ presenter_notes        → guión contextual de ESA sesión

En la sala (/meet/<id>)
  ├─ deck inyectado         → meeting_presentation_state (open, slide_index)
  ├─ guión del slide        → nexus_presentations.slides[].notes
  ├─ presencia              → meeting_presence_sessions (join/heartbeat/leave)
  └─ cerrar reunión         → meetings.status = 'ended'

Post-reunión
  └─ seguimiento por email  → lib/nexus/agenda-followups.ts
        · a asistentes (permanencia ≥ 60s) cuando hay evidencia
        · a todos si no hay evidencia (nunca se inventa no-show)

Calendario (rápido, sin OAuth)
  ├─ invitados → .ics adjunto en invitación/recordatorio
  └─ host      → “Añadir a Google Calendar” en agenda/Hub/drawer
                 (evento prellenado; el host revisa y guarda)
```

Las dos vías para agendar producen el mismo objeto reunión:

| Vía | Endpoint | Contexto |
|---|---|---|
| Deal Room → Clients & CRM → "Agendar presentación" | `POST /api/nexus/deals/:id/schedule` | hereda deck del deal y deal_room_id |
| Agenda Soberana → "Agendar presentación" | `POST /api/v1/nexus/agenda/meet/create` | reunión suelta con deck del catálogo |

### Minuta IA — proveedores y configuración (implementado)

- **Gemini primero:** `GEMINI_API_KEY` (o `GOOGLE_GENERATIVE_AI_API_KEY`),
  modelo `gemini-2.5-flash` por defecto (`GEMINI_MEETING_MODEL`).
- **OpenAI como fallback:** `OPENAI_API_KEY`, transcripción `whisper-1` y resumen
  `gpt-4o-mini` (`OPENAI_TRANSCRIBE_MODEL`/`OPENAI_MEETING_MODEL`).
- Si no hay ninguno: `503 AI_NOT_CONFIGURED` con mensaje claro; no se inventa resumen.
- Solo audio ≤ 10 MB; video → 415.
- El **resumen se guarda antes** de las tareas. Si fallan las tareas, el resumen no
  se pierde y el follow-up ya no devuelve `409 NO_SUMMARY`.
- `POST /api/v1/meet/follow-up` sigue exigiendo reunión `ended`; si está `live`,
  devuelve `409 MEETING_NOT_ENDED`.

> Operación: cambiar una env en Vercel **no** afecta deployments existentes; hay que
> redeployar para que la función reciba la nueva variable.

### Borrado lógico de reuniones pasadas (implementado)

- En `/nexus/agenda` → bloque **Anteriores**, el host ve **“Eliminar”**.
- No es un `DELETE`: setea `meetings.archived_at`. Se conservan minuta, asistencia,
  tareas, audit y follow-ups.
- La reunión deja de listarse en agenda, Operations Hub y TMA.
- Solo el host de la reunión puede archivarla; cross-tenant → 403.
- Participantes: no pueden archivarla (afecta a la agenda del host, no a la suya).

### Añadir a Google Calendar (implementado, sin OAuth)

- Botón **“Google Calendar”** en:
  - `/nexus/agenda` (cada reunión programada/live),
  - pestaña de agenda del Operations Hub,
  - drawer de la reunión en la agenda.
- Abre un evento **prellenado** de Google Calendar con título, hora, detalles y liga.
- Host: usa la liga genérica de la sala. Participante: usa su liga personal (`?p=`).
- Es un **clic manual**; no escribe por API ni actualiza al reagendar/cancelar.
- Los invitados siguen recibiendo su `.ics`; no se duplica el evento de Google.
- Para sincronización automática real se necesita OAuth (ver
  [AGENDA-SOBERANA-MULTITENANT-ROADMAP.md](./AGENDA-SOBERANA-MULTITENANT-ROADMAP.md)).

---

## 2. Participantes ≠ firmantes (decisión)

Un meet puede tener 10 invitados y 1 solo firmante. Son dos entidades separadas:

- **Firmantes** = `nexus_deal_signers` (firma del documento).
- **Participantes** = `meeting_participants`, con `email` propio y `join_token`.
- En el panel del deal, "Invitados al meet" se **precarga** con los firmantes pero es editable.
- Tope: 25 invitados por reunión (`MAX_PARTICIPANTS`).

La invitación sale con un link personal `/meet/<id>?p=<join_token>`; ese token es lo que identifica
a la persona (asistencia y presencia). No se expone el email en la URL.

---

## 3. Decks como dato (CMS) — estado y pendientes

### Implementado

- Tabla `nexus_presentations`: `slug`, metadata, `guardrails` (jsonb), `slides` (jsonb), `proposal_key`.
- Cada slide: `{ id, title, blocks[], notes[] (guión), minutes }`.
- Bloques soportados: `hero`, `metrics`, `info`, `numbered`, `pillars`, `steps`, `checklist`,
  `prices`, `note`, `closing`. **No hay HTML libre**: el renderer es tipado.
- Renderer: `/pitch/deck/[slug]` (`DeckRenderer` + `PresentationEngine`).
- Guión en sala: `GET /api/v1/meet/presentation` devuelve `deck` desde la DB; el catálogo en código
  queda solo como respaldo si el deck no está sembrado.
- Seed versionado: `src/lib/nexus/decks/celeste.deck.json` → `bun run seed:decks`.
- Fallback: si el deck no existe en DB, `/pitch/deck/<slug>` redirige al deck estático versionado.

### Cómo editar hoy (sin UI)

1. Editar `apps/dashboard/src/lib/nexus/decks/<slug>.deck.json` y correr `bun run seed:decks`, **o**
2. `UPDATE nexus_presentations SET slides = ... WHERE slug = '<slug>'` (el seed sobrescribe con el
   archivo del repo: si editas en DB y corres el seed, pierdes el cambio).

### PENDIENTE: UI de CMS (documentado para después)

- [ ] **Listado** `/nexus/presentations` leyendo `listDecks()` (hoy el listado es el registro en código).
- [ ] **Editor de slides**: reordenar, editar bloques tipados, editar `notes` (guión) y `minutes`.
- [ ] **Versionado**: tabla `nexus_presentation_versions` (o `revision` en la fila) + "restaurar".
- [ ] **Publicación con gobernanza**: `DRAFT → REVIEW → PUBLISHED` con aprobación humana distinta del
      editor (mismo patrón que `artifact-lifecycle`: API key nunca aprueba).
- [ ] **Preview** del deck antes de publicar (mismo renderer, con `?preview=1` sin indexar).
- [ ] **Registro de decks**: hoy agregar un deck nuevo a los selectores requiere una línea en
      `presentations-catalog.ts`. La meta es que el registro venga de `listDecks()` vía API.
- [ ] **Permisos**: `calendar.manage` para usar el deck; `nexus.manage` (o capability nueva) para editarlo.
- [ ] **Auditoría**: `nexus_audit_events` en cada cambio de deck (quién, qué slide, antes/después).

Riesgo conocido: mientras el registro siga en código, un deck creado solo en DB no aparece en los
selectores de agenda/deal hasta agregar la línea correspondiente.

---

## 4. Presencia en la sala (decisión: se queda como está)

- `POST /api/v1/meet/presence` con `join | heartbeat | leave`; el cliente reporta al entrar, cada 30 s
  y al salir (`sendBeacon`).
- `meeting_presence_sessions` acumula `joined_at / last_seen_at / left_at`; la duración se calcula
  server-side.
- El seguimiento usa **≥ 60 s** (`MIN_ATTENDANCE_SECONDS`) para considerar asistencia; si no hay
  ninguna sesión, cae al registro del link personal; si tampoco hay evidencia, escribe a todos.

**Límite aceptado conscientemente:** la evidencia es del navegador, no del proveedor de video. Un
usuario podría entrar y cerrar la pestaña sin beacon (quedaría con `last_seen_at`).

### Si algún día se quiere presencia verificada por el proveedor

- `meeting_presence_sessions.source = 'provider-webhook'` ya existe: mismo endpoint, misma tabla,
  misma agregación.
- Falta: contrato real de los webhooks de JaaS (8x8), secreto compartido y mapeo
  `participant displayName → email`. **No se implementó por no inventar el contrato.**

---

## 5. Documentos y links dinámicos

- `/propuesta/celeste` resuelve el link del Deal Room así:
  `?deal=PDR-XXXX` → `NEXT_PUBLIC_CELESTE_DEAL_PUBLIC_ID` → aviso "Deal Room no vinculado".
- La sala pasa `?deal=<publicId>` usando `meetings.deal_room_id` (resuelto server-side).
- La propuesta sigue siendo una página por cliente (`/propuesta/celeste`). Estandarizarla
  (`/propuesta/[key]` alimentada por datos del deal) es trabajo pendiente, no está hecho.

---

## 6. Migraciones aplicadas

| Migración | Contenido | Estado |
|---|---|---|
| 0088 | `nexus_deal_rooms.presentation_id` | aplicada |
| 0089 | `meeting_presentation_state.presentation_open` (adopta la tabla existente) | aplicada |
| 0090 | `meeting_participants.join_token` + `meetings.presenter_notes` | aplicada |
| 0091 | `meetings.deal_room_id`, `meeting_participants.email`, `meeting_presence_sessions`, `nexus_presentations` | aplicada |

Verificación posterior: 8 objetos de esquema presentes, datos previos intactos
(16 deal rooms, 7 firmantes, 0 meetings). Deck `celeste` sembrado: 10 slides, 31 notas, 7 reglas.

Comandos:

```bash
cd apps/dashboard
bun run db:migrate     # si se usa la cadena de drizzle
bun run seed:decks     # siembra los decks versionados
```

> Nota: `meeting_presentation_state` ya existía en producción (creada por el checkout principal). Se
> adoptó como única fuente de verdad del estado del deck en lugar de duplicarlo en `meetings`.

---

## 7. Multi-tenant (Academy / Growth OS)

La revisión completa de herencia multi-tenant vive en:

**[AGENDA-SOBERANA-MULTITENANT-ROADMAP.md](./AGENDA-SOBERANA-MULTITENANT-ROADMAP.md)**

Resumen del veredicto:

- El **modelo de datos** sí está scoped por `canonical_org_id`.
- El **booking público** (`bookSlot`) atribuye a `projectId = 1` (Pandora's), no al tenant.
- **Growth OS** no tiene agenda de tenant; solo un link fijo a `/schedule/pandoras`.
- **Academy** no tiene rutas de agenda/meet; sus links a `/schedule/pandoras` son relativos.
- El **catálogo de decks** (`nexus_presentations`) es global, sin tenant.
- Los **correos** (invitaciones, recordatorios, follow-ups) son de Pandora's.

Hay **2 P0** (atribución y fallbacks a `pandoras`) y **4 P1** (superficie de agenda,
configuración por tenant, decks y branding).

---

## 8. Pendientes generales

- [ ] Verificación end-to-end en staging (agendar → entrar → presentar → finalizar → seguimiento).
- [ ] `NEXT_PUBLIC_APP_URL` correcto en producción (los links de email dependen de él).
- [ ] `RESEND_API_KEY` y `RESEND_FROM_EMAIL` para invitaciones y seguimiento.
- [ ] Decidir si la propuesta se estandariza como `/propuesta/[key]`.
