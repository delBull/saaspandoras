# Mapa de identidad por canal

> Regla que gobierna todo: **cada canal tiene su credencial y su dueño**. Hermes
> (plataforma) y S'Narai comparten nombre, pero son **apps distintas** de Meta y
> bots distintos de Telegram. Un mensaje se procesa con las credenciales de la app
> dueña del número/bot que lo recibió, nunca con las de otra.

## WhatsApp

| Superficie | Credencial | Ruta | Quién responde |
|---|---|---|---|
| Hermes plataforma (número maestro) | `HERMES_PHONE_NUMBER_ID` + `META_APP_SECRET` / `WHATSAPP_APP_SECRET` | `/api/v1/external/whatsapp/webhook` · `/api/whatsapp/simple` | Hermes de `pandoras` |
| S'Narai | `META_PHONE_NUMBER_ID_SNARAI` + `META_APP_SECRET_SNARAI` + `META_WHATSAPP_TOKEN_SNARAI` | idem | Hermes de `snarai` |
| Sofía / Media Co | `SOFIA_PHONE_NUMBER_ID` | (adaptador propio) | Sofía |

**Resolución (una sola, en `hermes-core`):**

1. `phone_number_id` del payload → ¿es el maestro? → `pandoras`.
2. `META_PHONE_NUMBER_ID_<SLUG>` (mayúsculas o slug tal cual).
3. `projects.tenantRuntimeConfig.secrets.whatsappPhoneId` (lo que se conecta por portal).
4. `projects.w2eConfig.whatsappPhoneId` (legacy).
5. Sin coincidencia → **null** (fail-closed, no se asigna a nadie).

**Firma:** se valida con el secreto de la app **dueña del número**
(`lib/whatsapp/inbound-identity.ts`). Si el número es de un tenant y falta su
secreto → 500, no se cae al global.

**Respuesta:** se envía con el token y número del tenant (`vault:channel:<slug>`),
nunca con el maestro.

## Telegram

| Superficie | Credencial | Ruta | Dueño |
|---|---|---|---|
| Nexus Team | `TELEGRAM_TEAM_BOT_TOKEN` + `TELEGRAM_TEAM_WEBHOOK_SECRET` | `/api/integrations/telegram/team` | plataforma (acciones internas) |
| Hermes | `HERMES_TELEGRAM_BOT_TOKEN` | `/api/hermes/bot/webhook` | plataforma |
| S'Narai | `TELEGRAM_SNARAI_BOT_TOKEN` + `TELEGRAM_SNARAI_WEBHOOK_SECRET` | `/api/v1/projects/17/bot/webhook` | tenant `snarai` |

**Regla:** si el proyecto tiene bot (token en config o `TELEGRAM_<SLUG>_BOT_TOKEN`),
el `webhookSecret` es **obligatorio**; sin él la ruta responde 401. Antes era
opcional y cualquiera podía hacerse pasar por Telegram.

## Discord

| Superficie | Credencial | Alcance |
|---|---|---|
| Publicador (Hermes) | `DISCORD_BOT_TOKEN` + `DISCORD_GUILD_ID` | lista blanca `<prefijo>-*` por tenant (ADR-020 §2.5) |
| Lector | `DISCORD_READER_TOKEN` (sólo lectura, 66560) | mismo prefijo, sólo lectura |
| Avisos | webhook del tenant (`tenant_notification_channels`) | `leads` · `approvals` · `alerts` |

## Cómo verificar rápido

```sql
-- ¿qué número pertenece a qué tenant?
select slug from projects where tenant_runtime_config->'secrets'->>'whatsappPhoneId' = '<phone_id>';
```

```bash
# firma con el secreto del tenant (nunca imprimir el secreto)
curl -i -X POST "$URL" -H "x-hub-signature-256: sha256=…" -d @payload.json
```

## Deuda conocida

- El secret de Telegram de S'Narai se resuelve con un caso especial
  (`projectSlug === 'snarai'`); al añadir el segundo tenant, moverlo a
  `w2eConfig.botConfig.webhookSecret` y borrar el caso especial.
