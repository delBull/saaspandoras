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

## Instagram (comentarios y DMs)

| Superficie | Credencial | Ruta | Dueño |
|---|---|---|---|
| App de Meta (plataforma) | `META_IG_USER_ID` + `META_APP_SECRET` + `META_IG_ACCESS_TOKEN` | `/api/v1/external/instagram/webhook` | `pandoras` |
| S'Narai | `META_IG_USER_ID_SNARAI` **o** integración en portal (<code>tenant_social_integrations</code>, canal `instagram`) + `META_APP_SECRET_SNARAI` + `META_IG_ACCESS_TOKEN_SNARAI` | idem | `snarai` |

**Resolución del tenant (por la cuenta receptora, nunca por un campo del payload):**

1. `tenant_social_integrations` con `channel='instagram'` y `metadata.igUserId` = `entry[0].id`
   (lo que se conecta desde el portal o con `apps/dashboard/scripts/connect-instagram-channel.ts`).
2. `projects.extraConfig.community.igUserId`.
3. `META_IG_USER_ID_<SLUG>`.
4. Cuenta de plataforma (`META_IG_USER_ID`) → `pandoras`.
5. Sin coincidencia → **null**: se responde 200 sin procesar (no se inventa tenant).

**Firma:** HMAC con el app secret del tenant dueño de la cuenta. Orden:
`META_IG_APP_SECRET_<SLUG>` → `META_APP_SECRET_<SLUG>`; si no hay ninguno → 500
fail-closed, nunca el global. El secreto propio de Instagram existe porque
Instagram Login firma con un secreto distinto al de Facebook: reutilizar el de
WhatsApp rompería la validación de WhatsApp.

**Respuesta:** una sola respuesta privada por comentario (Meta lo impone) y DM a
DM. El texto sólo contiene el puente a WhatsApp del tenant
(`extraConfig.community.whatsappNumber`, con respaldo en
`COMMUNITY_WHATSAPP_NUMBER_<SLUG>`). La conversación **no** se sostiene en
Instagram: ahí no hay alma, ni conocimiento, ni política de claims.

**Idempotencia:** `social_dm_log` con índice único `(network, external_id)`
(migración `0124`). Un reintento de Meta no envía un segundo DM.

## Cómo verificar rápido

```sql
-- ¿qué número pertenece a qué tenant?
select slug from projects where tenant_runtime_config->'secrets'->>'whatsappPhoneId' = '<phone_id>';
```

```sql
-- ¿qué cuenta de Instagram pertenece a qué tenant?
select tenant_id, metadata->>'igUserId' as ig_user_id, status
from tenant_social_integrations
where channel = 'instagram';

-- ¿qué pasó con los DMs/comentarios de Instagram?
select kind, status, count(*), max(created_at)
from social_dm_log
group by 1, 2
order by 4 desc;
```

```bash
# firma con el secreto del tenant (nunca imprimir el secreto)
curl -i -X POST "$URL" -H "x-hub-signature-256: sha256=…" -d @payload.json
```

## Deuda conocida

- El secret de Telegram de S'Narai se resuelve con un caso especial
  (`projectSlug === 'snarai'`); al añadir el segundo tenant, moverlo a
  `w2eConfig.botConfig.webhookSecret` y borrar el caso especial.
