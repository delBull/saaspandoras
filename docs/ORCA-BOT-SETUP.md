# S'Narai Manager · puesta en marcha del bot (ADR-019)

El bot ya existe en Orca (`S'Narai Manager`, agente `opencode`). Esto lo conecta al puente A2A para
que **proponga** y **lea el embudo**, sin poder publicar ni tocar la base.

## 1. Crear la identidad del agente

En la carpeta del bot (fuera del repo), genera una wallet nueva y regístrala:

```bash
cd ~/bots/snarai-manager
node -e "const{Wallet}=require('ethers');const w=Wallet.createRandom();console.log('ADDRESS='+w.address);console.log('PRIVATE_KEY='+w.privateKey)"
```

- `ADDRESS` → variable `COMMUNITY_AGENT_WALLET` en Vercel (producción) **y** en el `.env` del bot.
- `PRIVATE_KEY` → **solo** en el `.env` del bot (`COMMUNITY_AGENT_PRIVATE_KEY`). Nunca en Vercel ni en el repo.

Sin `COMMUNITY_AGENT_WALLET` el agente queda en `MAINTENANCE` y no puede autenticarse: fail-closed.

## 2. Variables del bot (`~/bots/snarai-manager/.env`)

```
COMMUNITY_AGENT_PRIVATE_KEY=0x…
A2A_HMAC_SECRET=<el mismo del servidor>
HERMES_A2A_URL=https://dash.pandoras.finance/api/v1/a2a/messages
COMMUNITY_ORG=snarai
COMMUNITY_PROJECT_ID=17
```

**No** copies el `.env` del repo: ni `DATABASE_URL`, ni `HERMES_KMS_KEK`, ni el token de Discord.

## 3. La CLI (binario aislado)

**No** ejecutes la CLI desde el repo: `bun` cargaría el `.env` del repo (base de datos y KEK) en el
entorno del bot. Compílala como binario independiente y cópiala a la carpeta del bot:

```bash
cd <repo>
bun build apps/dashboard/scripts/community-agent.ts --compile --outfile ~/bots/snarai-manager/community-agent
```

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

`posts.json`:

```json
[
  { "channel": "s-narai-la-oportunidad", "text": "…" },
  { "channel": "s-narai-preguntas", "text": "…" }
]
```

Qué devuelve:

- `REPORT_READY` con el digest (etapas, fuentes, clics, aprobaciones pendientes).
- `PENDING_APPROVAL` con `approvalId` y advertencias → aparece en `/growth-os/organizations/snarai/approvals`.
- `REJECTED_BY_POLICY` con las violaciones (no se crea nada).

## 4. Configuración del bot en Orca

| Ajuste | Valor |
|---|---|
| Permisos del agente | **Ask for approval** (no Full access) |
| Conectores | ninguno de escritura (nada de GitHub push, Slack post, Gmail send) |
| Herramienta propia | la CLI `community-agent` (o un MCP que la envuelva) |
| Quién puede pedirle | sólo tú |
| Automatizaciones | digest L-V 8:00 · plan lunes 9:00 · revisar aprobaciones cada hora |

## 5. Qué puede y qué no

| Puede | No puede |
|---|---|
| Leer embudo, fuentes, clics y pendientes | Publicar en Discord |
| Redactar posts y propuestas | Aprobar |
| Crear la aprobación (queda pendiente) | Tocar la base de datos |
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
