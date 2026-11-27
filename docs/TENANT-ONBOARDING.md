# Alta de un tenant nuevo (paquete completo)

> Todo lo que hicimos para S'Narai, en orden y con su fuente de verdad. Sirve para
> vender el paquete y para no improvisar cuando entre el segundo tenant.
> Regla: **cada tenant tiene su credencial y su dueño**; nada se comparte.

## 0. Prerrequisitos de negocio

- Marca y posicionamiento (qué es, qué NO es, términos permitidos).
- Nivel de producto y precios: **decisión de negocio**, no de código.
- Assets reales (renders, fotos, planos) — sin ellos no hay contenido visual.

## 1. Identidad

| Pieza | Dónde | Nota |
|---|---|---|
| Proyecto | `projects` (slug = identidad de ruta) | el slug nunca es autoridad |
| Brand kit | `projects.tenantRuntimeConfig.brandConfig` | color, fondo, logo, fuentes |
| Alma del agente | `packages/hermes-core/src/soul/` → `HermesSoulRegistry.registerTenantSoul()` | persona, claims, escalado, URLs |
| Paleta | `#0A151F` base · `#C99960` oro · `#F5F2EA` texto (S'Narai) | por tenant |

## 2. Canales

| Canal | Credencial | Dónde se configura |
|---|---|---|
| WhatsApp | `META_PHONE_NUMBER_ID_<SLUG>` + `META_WHATSAPP_TOKEN_<SLUG>` + `META_APP_SECRET_<SLUG>` | env (o `runtimeConfig.secrets`) |
| Telegram | `TELEGRAM_<SLUG>_BOT_TOKEN` + `..._WEBHOOK_SECRET` | env + `w2eConfig.botConfig` |
| Discord | categoría + rol del tenant; publicador con lista blanca `<prefijo>-*` | `community/channel-prefixes.ts` |
| Avisos | webhook por tenant | `tenant_notification_channels` (portal → Ajustes) |
| Instagram | IG Business ID + Page token | `tenant_social_integrations` (cifrado) |

## 3. Captación y medición

```
post → /l/<code> (cookie nx_src) → /pitch/<slug> → /join/<slug> (consentimiento)
     → marketing_leads (projectId del tenant) → Growth OS pipeline → llamada
```

- `marketing_leads.source` = código de la publicación (atribución).
- `/join/<slug>` es genérico: cualquier tenant lo hereda.
- Deal Room: `provision-deal-pod.ts --code <slug>` + `docs/<SLUG>-DEAL-ROOM.md`.

## 4. Contenido y publicación

| Pieza | Cómo |
|---|---|
| Media | `/portal/<slug>/media` → biblioteca del tenant (`tenant_media_assets`, respaldada por Vercel Blob) + render de plantillas |
| Plantillas | `POST /api/v1/hermes/media/render`; el brand kit sale de `projects.tenantRuntimeConfig.brandConfig` (fuente canónica, la misma del correo) |
| Formatos | imagen simple, **carrusel (2–10 slides)** y **Reels** (video https; el publicador espera el procesamiento de Meta) |
| Palabra clave | `extraConfig.community.keyword` → respaldo `COMMUNITY_DM_KEYWORD` → default `SNARAI` |
| Propuesta | `community-agent propose --platform=instagram --image=<url>` |
| Aprobación | `/approvals` (una tarjeta, multi-red) |
| Publicación | `DirectChannelPublisher` (credenciales cifradas por tenant) |

## 5. Conversación y cierre

| Paso | Pieza |
|---|---|
| Conversación | Hermes del tenant (WhatsApp/Telegram/Portal) con su soul y knowledge |
| Keyword de DM | `parseDmKeyword` (`SNARAI <código>` → lead atribuido) |
| Agenda | `extraConfig.sovereignCalendar` + `/schedule/<slug>` (slots dinámicos) |
| Cierre | `syncBookingPipeline`: lead +50, CRM, email con .ics, avisos |

## 6. Verificación obligatoria por tenant

1. `/pitch/<slug>` 200 y el botón lleva al Deal Room con `?src=`.
2. `/join/<slug>` 200; un lead de prueba queda con `source`.
3. WhatsApp: mensaje al número del tenant → responde **su** Hermes (log: `tenant=<slug>`).
4. Telegram: POST sin secreto → 401.
5. `/schedule/<slug>` 200 con el branding del tenant.
6. `/approvals` lista las propuestas y publicar deja `messageId`.

## 7. Deuda conocida (no bloquea)

- Kubo sin bloques persistentes + Pinata bloqueado por plan → el knowledge se
  hidrata desde el sobre local (Postgres); el respaldo IPFS real sigue pendiente.
- 7 artefactos con sobre anidado → desactivados (deuda 008).
- El secreto de Telegram de S'Narai usa un caso especial; al segundo tenant se
  mueve a `w2eConfig.botConfig.webhookSecret`.
