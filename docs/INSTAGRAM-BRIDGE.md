# Puente Instagram → WhatsApp

> Objetivo: que un comentario o un DM en Instagram se convierta en una
> conversación de WhatsApp **atribuida**, sin sostener la conversación en
> Instagram. Instagram sólo entrega el puente; el alma, el conocimiento y la
> política de claims viven en Hermes.

## 1. Qué hace

```
Comentario con "SNARAI"  ──┐
                           ├─→ respuesta privada (1 por comentario)
DM con "SNARAI"          ──┘        │
                                     ▼
                     https://wa.me/<número del tenant>?text=SNARAI%20<código>
                                     │
                                     ▼
                     WhatsApp del tenant → Hermes (lead `whatsapp_dm`)
```

- **Palabra clave** configurable (`COMMUNITY_DM_KEYWORD`, por defecto `SNARAI`),
  aceptada sólo en los primeros tokens del texto.
- **Código de atribución** opcional (4–16 alfanumérico): identifica la pieza que
  originó el contacto y viaja hasta el lead.
- **Sin palabra clave no hay respuesta.** Responder a todos los comentarios
  convierte la cuenta en spam y Meta lo penaliza.
- **Una sola respuesta privada por comentario** (regla de Meta) y DM a DM.
- **Nada se conversa en Instagram**: no hay soul, ni knowledge, ni precios.

## 2. Configuración en Meta

```
developers.facebook.com → app del tenant → Instagram → API setup with Instagram login
  Webhooks
    Callback URL:  https://dash.pandoras.finance/api/v1/external/instagram/webhook
    Verify token:  el valor de INSTAGRAM_WEBHOOK_VERIFY_TOKEN
    [Verificar y guardar]
  Suscripciones (webhook fields)
    ☑ comments
    ☑ messages
```

No existe "fallback URL" para Instagram: es una sola callback por app. El
*verify token* no es un secreto que autorice nada; sirve para que Meta confirme
que el endpoint es nuestro. La autorización real es la firma HMAC del POST.

Permisos necesarios en la app:

| Permiso | Para qué |
|---|---|
| `instagram_basic` | leer la cuenta y sus medios |
| `instagram_manage_comments` | recibir y responder comentarios |
| `instagram_business_manage_messages` | enviar la respuesta privada / DM |
| `instagram_content_publish` | publicar piezas del community manager |

### 2.1 Los dos caminos de Meta (elegir uno)

| | Instagram Login | Facebook Login |
|---|---|---|
| Host | `graph.instagram.com/v21.0` | `graph.facebook.com/v21.0` |
| Requiere Página de Facebook | **no** | **sí** (la cuenta IG cuelga de la Página) |
| Scopes | `instagram_business_basic`, `instagram_business_manage_comments`, `instagram_business_manage_messages`, `instagram_business_content_publish` | `instagram_basic`, `instagram_manage_comments`, `instagram_business_manage_messages`, `instagram_content_publish` |
| Cómo se obtiene | App Dashboard → Instagram → *API setup with Instagram login* → **Generate token** | OAuth de Facebook + `GET /me/accounts` |

**Para el puente hace falta `instagram_business_manage_messages`** (o
`instagram_business_manage_messages` en Instagram Login): es la única forma de
enviar la respuesta privada. Un token con `instagram_manage_comments` **no**
basta: puede responder en público, no por DM.

Si `GET /me/accounts` devuelve `{"data":[]}`, el token no tiene Páginas y por
tanto no hay cuenta de Instagram que resolver por esa vía: hay que generar el
token con **Instagram Login**.


## 3. Variables de entorno (por tenant)

| Variable | Ejemplo | Notas |
|---|---|---|
| `META_IG_USER_ID_<SLUG>` | `17841400000000001` | cuenta receptora (`entry[0].id`); alternativa a la integración del portal |
| `META_APP_SECRET_<SLUG>` | — | **obligatorio** en producción; sin él la ruta responde 500 |
| `META_IG_ACCESS_TOKEN_<SLUG>` | `IGAA...` | token de larga duración |
| `META_IG_API_BASE_<SLUG>` | `https://graph.instagram.com/v21.0` | Instagram Login; usa `graph.facebook.com` si hay Página vinculada |
| `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` | cadena inventada | o `INSTAGRAM_WEBHOOK_VERIFY_TOKEN_<SLUG>`; también acepta `META_WEBHOOK_VERIFY_TOKEN` |
| `COMMUNITY_WHATSAPP_NUMBER_<SLUG>` | `18336529213` | respaldo del número del tenant |

El número de WhatsApp, la cuenta de Instagram y el host de la API **también** se
pueden fijar como datos del tenant (sin tocar código ni redeploy). `igApiBase`
decide el camino: `graph.instagram.com` (Instagram Login) o
`graph.facebook.com` (Facebook Login). El token **nunca** va aquí.

```json
{
  "extraConfig": {
    "community": {
      "igUserId": "17841425380042995",
      "igHandle": "snaraibucerias",
      "igApiBase": "https://graph.facebook.com/v21.0",
      "whatsappNumber": "+1 833 652-9213"
    }
  }
}
```

## 4. Conectar la cuenta (mecanismo canónico)

`tenant_social_integrations` es la fuente de verdad de "qué cuenta pertenece a
qué tenant". Se escribe con el servicio existente, no con SQL a mano:

```bash
IG_TENANT_SLUG=snarai \
META_IG_USER_ID=17841400000000001 \
META_IG_ACCESS_TOKEN=IGAA... \
META_IG_API_BASE=https://graph.instagram.com/v21.0 \
IG_ACCOUNT_HANDLE=@snarai \
bun apps/dashboard/scripts/connect-instagram-channel.ts
```

- Los secretos se cifran en el vault (`channel_cred_instagram_<id>`); la respuesta
  del script es el DTO saneado, sin token.
- `metadata.igUserId` se deriva **de las credenciales**, no del input: un cliente
  no puede declarar que su cuenta es otra.
- Rotar credenciales = revocar la integración y volver a correr el script.

## 5. Verificación

```sql
-- enrutamiento
select tenant_id, metadata->>'igUserId', status from tenant_social_integrations where channel='instagram';

-- resultados de los eventos
select kind, status, detail, created_at from social_dm_log order by created_at desc limit 20;
```

Estados posibles en `social_dm_log.status`:

| Estado | Significado |
|---|---|
| `SENT` | respuesta privada enviada |
| `SKIPPED_NO_KEYWORD` | el texto no traía la palabra clave (no se registra) |
| `SKIPPED_NO_CREDENTIALS` | falta token o número del tenant; el `detail` dice cuál |
| `DUPLICATE` | reintento de Meta sobre un evento ya procesado |
| `FAILED` | Meta rechazó el envío; el `detail` trae el código |
| `PENDING` | reclamado y sin cierre (proceso interrumpido); se puede reintentar |

Prueba manual del GET (debe devolver el challenge):

```bash
curl -i "https://dash.pandoras.finance/api/v1/external/instagram/webhook?hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=12345"
```

## 6. Diagnóstico

| Síntoma | Causa probable |
|---|---|
| Meta dice "no se pudo verificar" | falta `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` en producción, o el deploy no incluye la ruta |
| 401 `Invalid HMAC signature` | el app secret configurado no es el de la app que firma |
| 500 `missing tenant secret` | la cuenta es de un tenant y falta `META_APP_SECRET_<SLUG>` (fail-closed) |
| 200 con `tenant: null` | la cuenta no está vinculada: correr el script de conexión |
| `SKIPPED_NO_CREDENTIALS` | falta token de Instagram o el número de WhatsApp del tenant |
| `FAILED` 400 de Meta | el comentario tiene más de 7 días, o ya se respondió una vez |
| `FAILED` 403 al enviar | al token le falta `instagram_business_manage_messages` |
| El script dice `Invalid OAuth access token` | el token es de Facebook Login y se está usando contra `graph.instagram.com` (o al revés) |
| `GET /me/accounts` vacío | el token no tiene Páginas: hay que usar Instagram Login |

## 7. Límites conocidos

- Meta permite **una** respuesta privada por comentario: no se puede reintentar
  con otro texto aunque falle. Un `FAILED` requiere respuesta pública o handoff.
- La ventana de DM es de 24 h.
- Instagram no es un canal conversacional aquí: por diseño no hay respuesta a
  preguntas de precio ni de producto en IG.
