# Rotación de base de datos — notas de recuperación

Fecha: 22 nov 2026 · Motivo: el proyecto Neon `pandoras-prod` agotó la cuota del plan
Free (`active_seconds_limit: 0`) y bloqueó todas las consultas (auth incluido).

## 1. Qué se hizo en la base rotada

Esquema aplicado (aditivo, idempotente):

```
0089 presentation state · 0090 attendance/notes · 0091 presence + decks
0094 reminders · 0094 presentation/emails · 0102 title · 0103 action source
0104 followup controls · 0105 archive · 0106 IP assets · 0107 followup state
0108 deal client · 0109 pods · 0110 signer POF/OM · 0111 POF documents
0112 deal_rooms.presentation_id
```

Omitidas `0093` y `0101`: la base ya tenía `host_collaborator_id` integer con FK
a `nexus_collaborators`.

Datos re-provisionados:

| Pieza | Estado |
|---|---|
| Decks | `celeste` (11 slides, 38 min) y `aurora-demo` (10) |
| Deal Pod | `village` (AZTECAZ, 3%, OFF_MARKET) + sala `PDR-VILLAGE`, NDA `v1.0-village`, 4 secciones |
| Cliente | `eduardo.garza.castillon@gmail.com` — Celeste, `negotiating` |
| Deal Room | `PDR-63C2E9` — `PROPOSAL_SENT`, 5 secciones, cliente vinculado |
| Reunión | 20 nov 17:00 UTC, `ended`, resumen 2,953 chars, notas, 3 participantes, 3 tareas |

Verificado contra la base nueva:

```
/api/auth/nonce            → 200 con nonce
/pitch/deck/celeste        → 200 (contenido del deck)
/propuesta/celeste         → 200
/deal/PDR-63C2E9           → 200
/deal/PDR-VILLAGE          → 200
/pitch/village             → 200
```

## 2. Qué NO está en esta base (snapshot del 16 oct 2026)

- Reuniones anteriores al 20 nov: **ninguna** (la tabla estaba vacía).
- Deal rooms creados después del 16 oct (salvo los dos re-provisionados).
- Firmantes, aceptaciones de NDA, comentarios y adjuntos de esos deals.
- Broadcasts, notificaciones, actividad de Hermes, suscripciones de tenant.
- Activos IP, links/eventos del radar, documentos POF.
- Historial de correos y recordatorios.

## 3. Cuando producción vuelva (upgrade o reset)

Checklist para reconciliar sin adivinar:

```sql
-- Comparar conteos entre prod (P) y rotada (R)
select 'rooms' t, count(*) from nexus_deal_rooms
union all select 'meetings', count(*) from meetings
union all select 'clients', count(*) from clients
union all select 'decks', count(*) from nexus_presentations
union all select 'pods', count(*) from nexus_deal_pods;
```

Filas a comparar por clave natural (no por id, que puede diferir):

- `nexus_deal_rooms.public_id`
- `meetings (title, starts_at)` / `appointment_id`
- `clients.email`
- `nexus_presentations.slug`
- `nexus_deal_pods.code`
- `meeting_participants (meeting_id, email)` y `nexus_deal_signers (room_id, email)`

Si falta algo, se copia con `INSERT ... ON CONFLICT` sobre esa clave. Los IDs de
reunión y sala re-provisionados **son nuevos**: los enlaces viejos a esa reunión
no resuelven.

## 4. Para no repetir el bloqueo

1. Desarrollo **nunca** contra la base operativa: usar un branch de Neon o Postgres local.
2. Scale-to-zero activo y `max CU` bajo.
3. Alerta de consumo al 80%.
4. Los seeds se corren una vez, no en cada sesión.
