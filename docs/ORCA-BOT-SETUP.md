# S'Narai Manager · puesta en marcha del bot (ADR-019)

El bot ya existe en Orca (`S'Narai Manager`, agente `opencode`). Esto lo conecta al puente A2A para
que **proponga** y **lea el embudo**, sin poder publicar ni tocar la base.

## 1. Identidad del agente (ya provisionada)

| Dato | Valor |
|---|---|
| Carpeta | `/Users/Marco/.orca/bots/s-narai-manager` |
| Wallet (pública) | `0x6D1f9049d6415B4C3054a254c54E4FA2bbA46272` |
| En Vercel | `COMMUNITY_AGENT_WALLET`, `COMMUNITY_A2A_HMAC_SECRET` |
| En la carpeta | `.env` con permisos `600` (llave + secreto dedicado) |

La llave privada **nunca** se imprime ni se guarda en `MEMORY.md`. Si hace falta regenerarla, se
escribe directamente en `.env` y sólo se publica la dirección.

Sin `COMMUNITY_AGENT_WALLET` el agente queda en `MAINTENANCE`: fail-closed.

## 2. Variables del bot (`~/.orca/bots/s-narai-manager/.env`)

```
COMMUNITY_AGENT_PRIVATE_KEY=0x…            # sólo aquí
COMMUNITY_A2A_HMAC_SECRET=…                # secreto PROPIO del agente
HERMES_A2A_URL=https://dash.pandoras.finance/api/v1/a2a/messages
COMMUNITY_ORG=snarai
COMMUNITY_PROJECT_ID=17
```

**No** copies el `.env` del repo: ni `DATABASE_URL`, ni `HERMES_KMS_KEK`, ni el token de Discord. El
agente **no** conoce `A2A_HMAC_SECRET` (el compartido de Sofía/Hermes): con él podría firmar mensajes
como otro agente.

## 3. La CLI (binario aislado)

**No** ejecutes la CLI desde el repo: `bun` cargaría el `.env` del repo (base de datos y KEK) en el
entorno del bot. Compílala como binario independiente y cópiala a la carpeta del bot:

```bash
cd <repo>
bun build apps/dashboard/scripts/community-agent.ts --compile --outfile ~/.orca/bots/s-narai-manager/community-agent
```

Ya está instalado en la carpeta del bot. El binario lee el `.env` de su propio directorio (o el que
indique `COMMUNITY_ENV_FILE`).

El binario (~60 MB, con `ethers` incluido) no necesita el repo ni `node_modules`. Comandos:

```bash
# leer el embudo
./community-agent report

# proponer una publicación
./community-agent propose \
  --channel=s-narai-preguntas \
  --text="Gracias por la pregunta…" \
  --intent="Respuesta a duda de cesión"

# proponer un lote desde archivo (máx. 10)
./community-agent propose --file=posts.json --intent="Plan de la semana"
```

`posts.json` (la imagen es opcional y debe ser `https`):

```json
[
  { "channel": "s-narai-la-oportunidad", "text": "…", "imageUrl": "https://…/render.png" },
  { "channel": "s-narai-preguntas", "text": "…" }
]
```

Qué devuelve:

- `REPORT_READY` con el digest (etapas, fuentes, clics, aprobaciones pendientes, decisiones recientes y atribución).
- `PENDING_APPROVAL` con `approvalId` y advertencias → aparece en `/growth-os/organizations/snarai/approvals`.
- `REJECTED_BY_POLICY` con las violaciones (no se crea nada).

## 3-bis. Lectura de Discord (`read`) — bot de sólo lectura

El bot que publica (Hermes) **no** se usa para leer: tiene `Manage Roles` y `Manage Channels`. La
lectura la hace un bot aparte, `S'Narai Reader`, con permisos únicamente de **Ver canales (1024) +
Leer historial (65536) = 66560**.

| Dato | Valor |
|---|---|
| Carpeta | `/Users/Marco/.orca/bots/s-narai-reader` |
| `.env` (600) | `DISCORD_READER_TOKEN`, `DISCORD_GUILD_ID` |
| Token | **sólo** ahí; nunca en Vercel, nunca el de publicación |

```bash
# salud + moderación de todos los canales s-narai-* (50 mensajes por canal)
./community-agent read

# un canal, 100 mensajes, sólo salud, guardando el JSON
./community-agent read --channel=s-narai-preguntas --limit=100 --analyze=health --out=salud.json

# sólo amenazas (spam, invitaciones ajenas, promesas prohibidas, enlaces externos)
./community-agent read --analyze=moderation
```

Salida: `health` (mensajes, autores, preguntas, sin responder, horas de la más vieja) y `moderation`
(hallazgos con severidad y extracto). **No borra, no silencia y no responde**: son avisos para un
humano. El token del lector no puede escribir, así que un hallazgo jamás se ejecuta solo.

## 3-ter. Atribución por publicación

Cada publicación propuesta recibe un enlace propio `/l/<code>` que se añade al texto **antes** de la
aprobación (el aprobador ve exactamente lo que se publica). El digest devuelve `attribution`:

```json
{ "proposalId": "CMP-…", "channel": "s-narai-anuncios", "code": "ab12cd34",
  "opens": 12, "uniqueVisitors": 9, "leads": null }
```

`leads: null` significa **no atribuible**: la landing externa no reenvió el código. Un `0` significaría
"llegó gente y nadie convirtió", que es distinto y no se inventa.

## 4. Configuración del bot en Orca

| Ajuste | Valor |
|---|---|
| Permisos del agente | **Ask for approval** (no Full access) |
| Conectores | ninguno de escritura (nada de GitHub push, Slack post, Gmail send) |
| Herramienta propia | la CLI `community-agent` (o un MCP que la envuelva) |
| Quién puede pedirle | sólo tú |
| Automatizaciones | digest L-V 8:00 · plan lunes 9:00 · revisar aprobaciones cada hora |

## 4-bis. Ciclo completo (fase 2)

Al aprobar en `/growth-os/organizations/snarai/approvals`:

- el servidor **revalida** el texto y el canal (lista blanca `s-narai-*`);
- reclama la propuesta de forma atómica (nadie publica dos veces);
- publica con el bot de Discord y guarda mensaje por canal;
- si rechazas, guarda tu motivo y el agente lo ve en el siguiente `report`.

## 5. Qué puede y qué no

| Puede | No puede |
|---|---|
| Leer embudo, fuentes, clics y pendientes | Publicar en Discord |
| Redactar posts y propuestas | Aprobar |
| Crear la aprobación (queda pendiente) | Aprobar (eso es humano) |
| Reportar el resultado de lo aprobado | Asignar roles |

## 6. Verificación

```bash
# 1. el agente está activo
curl -s -X POST https://dash.pandoras.finance/api/v1/a2a/messages … | jq '.payload.status'
#    esperado: REPORT_READY

# 2. texto prohibido → rechazo de política
./community-agent propose --channel=s-narai-preguntas --text="El fideicomiso garantiza tu inversión"
#    esperado: REJECTED_BY_POLICY con la violación

# 3. texto limpio → aprobación
./community-agent propose --channel=s-narai-preguntas --text="Gracias por la pregunta…"
#    esperado: PENDING_APPROVAL + approvalId visible en /approvals
```
