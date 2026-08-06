# Pandora's Media Co — Provider API (Hermes Integration)

Contrato de integración del Service Provider **`pandoras-media-co`** para el Cognitive OS (Hermes).
Cumple los contratos del `requisitos.md`: Service Identity, Capability Catalog, Context, Artifact,
Workflow, Telemetry, Health, Cost, Authorization, Discovery, Dashboard Boundary y **Versionado**.

> Última actualización: 06 Ago 2026 · API version `1.0.0`

---

## 1. Base

| Campo | Valor |
|---|---|
| Base URL | `https://portal-production-1672.up.railway.app` |
| API root | `/api/v1` |
| Identidad | `pandoras-media-co` (Service Provider) |
| Versión API | `1.0.0` (semver; header `X-Api-Version`, 426 si no soportada) |
| Auth | Bearer token — header `X-Provider-Key` o `Authorization: Bearer <key>` |
| **Provider Key** | `e4b35d94300ba39a51dc4f53bedd4e93402cca2e4e56043e` |
| Scopes | `content.*`, `creative.*`, `campaign.*`, `analytics.*`, `admin.*` |
| CORS | `*` habilitado (usar token si se consume desde navegador) |

Formato de datos: JSON. Errores: `{ "error": "..." }` con códigos HTTP estándar
(400 invalid body, 401 no auth, 404 no existe, 426 versión, 503 capability no disponible).

---

## 2. Endpoints

### Identidad / Dashboard Boundary
```
GET /api/v1/provider            → identidad, status, capabilities, counts
GET /api/v1/health              → health por servicio (storage, strategy, runpod, providerApi)
```
`/api/v1/provider` es el resumen que Hermes muestra en su Workbench (sin duplicar el dashboard).

### Catálogo de capacidades (Capability Catalog + Discovery + Versionado)
```
GET /api/v1/capabilities            → lista completa con versión, dominio, scope, workflow, endpoint, cost
GET /api/v1/capabilities?domain=X   → filtrar por dominio (editorial/creative/marketing/analytics)
GET /api/v1/capabilities?status=X   → filtrar por estado (available/planned)
GET /api/v1/capabilities/names      → discovery ligera: solo IDs disponibles
GET /api/v1/capabilities/:id        → detalle de una capability (inputSchema, cost, endpoint)
```
Cada capability es **versionada semánticamente** (`content.plan@1.0.0`). El contrato no es un archivo
estático: Railway puede servir varias versiones en paralelo y el catálogo se consulta en runtime.

### Ejecución (Workflow + Context + Artifact)
```
POST /api/v1/capabilities/:id/execute      body: { contexto/inputs + tenantId + executionId + callbackUrl? }
GET  /api/v1/executions/:executionId       → estado, telemetría y artefactos generados
GET  /api/v1/executions                    → historial (limit)
GET  /api/v1/jobs                          → jobs en cola/ejecutándose
GET  /api/v1/artifacts/:artifactId         → metadata del artefacto
```

**Workflow `sync`** → responde 200 con el artefacto embebido.
**Workflow `async`** → responde `202 { executionId, pollUrl }`; se consulta con `GET /api/v1/executions/:id`
o se recibe el resultado por **callback dinámico** (ver §4).

Estados de ejecución: `queued → running → completed | failed` (con `progress`, `logs`, `errors`, `cost`).

### Inyección de contexto del Tenant (siempre)
Hermes envía **siempre** estos campos en el body de `execute` (para facturación/segregación por sub-proyecto):

| Campo | Tipo | Descripción |
|---|---|---|
| `tenantId` | string | id del proyecto/tenant (también acepta `projectId`). Se persiste y se refleja en telemetría y callbacks. |
| `executionId` | string | id de ejecución de Hermes (externo). Media Co lo guarda como `externalExecutionId` y lo devuelve en el ExecutionResult para correlación. Media Co genera su propio `executionId` interno como id canónico. |
| `callbackUrl` | string? | (async) URL a la que Media Co hace POST con el **ExecutionResult** al terminar. Evita polling. |

### Ejemplo (async — generación de imagen con callback)
```bash
# 1) Ejecutar (Hermes envía tenantId + executionId + callbackUrl)
curl -X POST https://portal-production-1672.up.railway.app/api/v1/capabilities/image.generate/execute \
  -H "X-Provider-Key: e4b35d94300ba39a51dc4f53bedd4e93402cca2e4e56043e" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Un dragón dorado sobre la bolsa de valores, estilo cinematográfico",
    "series": "tokenizacion-sin-humo",
    "tags": ["cover"],
    "tenantId": "prj_snarai",
    "executionId": "hermes-ex-001",
    "callbackUrl": "https://hermes.ejemplo.com/webhooks/executions"
  }'
# → 202 { "executionId": "ex-...", "pollUrl": ".../api/v1/executions/ex-..." }

# 2) SIN polling: Media Co hace POST al callbackUrl cuando termina con el ExecutionResult (ver §4).
#    (opcional) Poll del estado: curl -H "X-Provider-Key: <key>" .../api/v1/executions/ex-...
```

---

## 3. Catálogo actual (`v1.0.0`)

### Disponibles (7)
| Capability | Dominio | Scope | Workflow | Costo aprox | Qué devuelve |
|---|---|---|---|---|---|
| `content.plan` | editorial | content.* | sync | ~0 | Plan editorial institucional (series, canales, plan90, campañas) |
| `image.generate` | creative | creative.* | async | ~$0.003/imagen | Imagen FLUX (RunPod) + artefacto `image` |
| `analytics.report` | analytics | analytics.* | sync | ~0 | Overview + estado RunPod (balance, gastos, riesgo) |
| `analytics.dashboard` | analytics | analytics.* | sync | ~0 | Resumen ligero para el Workbench de Hermes |
| `analytics.insights` | analytics | analytics.* | sync | ~0 | Costo por pieza, gasto por periodo, riesgo, top series |
| `campaign.performance` | analytics | analytics.* | sync | ~0 | Rendimiento de campañas + artifacts asociados |
| `content.performance` | analytics | analytics.* | sync | ~0 | Rendimiento por serie/día + costos |

### Planificadas (planned → `503`)
`content.generate`, `content.rewrite`, `content.translate`, `content.review`, `journal.publish`,
`newsletter.compose`, `newsletter.publish`, `image.edit`, `video.generate`, `video.edit`,
`branding.generate`, `presentation.generate`, `document.design`, `campaign.plan`, `campaign.launch`,
`campaign.pause`, `campaign.optimize`, `social.schedule`, `social.publish`, `seo.optimize`.

---

## 4. Contrato de artefactos

Envelope normalizado:
```json
{
  "id": "gen-image-xxx",
  "type": "image",
  "title": "...",
  "series": "tokenizacion-sin-humo",
  "status": "done",
  "createdAt": "2026-08-06T04:36:19.499Z",
  "costUsd": 0.003,
  "file": { "name": "output.jpg", "size": 12345, "mime": "image/jpeg", "url": "<base>/media/<id>/output.jpg" },
  "jobId": "ex-xxx",
  "prompt": "..."
}
```

## 5. Callback dinámico — ExecutionResult (webhook)

Si el body de `execute` incluye `callbackUrl`, Media Co hace **POST JSON** a esa URL al terminar el job
(no hace falta polling). Retry: no automático por ahora (los fallos quedan en `telemetry.logs`; Hermes puede re-poll).

```json
{
  "event": "artifact.ready",
  "provider": "pandoras-media-co",
  "apiVersion": "1.0.0",
  "tenantId": "prj_snarai",
  "executionId": "ex-abc123",
  "externalExecutionId": "hermes-ex-001",
  "capability": "image.generate",
  "status": "completed",
  "artifact": { "id": "gen-image-xxx", "type": "image", "url": "<base>/media/<id>/output.jpg", "contentType": "image/jpeg", "costUsd": 0.003 },
  "error": null,
  "telemetry": { "status": "completed", "progress": 100, "startedAt": "...", "finishedAt": "...", "cost": 0.003, "tokens": null, "warnings": [], "errors": [], "logs": ["..."], "generatedArtifacts": ["..."] },
  "callbackAt": "2026-08-06T05:31:13.621Z"
}
```

- `event`: `artifact.ready` (completed) o `workflow.failed` (failed).
- `error`: mensaje si `workflow.failed`, si no `null`.
- `executionId` = id interno de Media Co (canónico para polling). `externalExecutionId` = el `executionId` que envió Hermes.
- `tenantId`: eco del valor enviado por Hermes (base futura de facturación por sub-proyecto).

## 6. Eventos / telemetría

- `GET /api/v1/executions/:id` → `status`, `progress`, `cost`, `tokens`, `warnings`, `errors`, `logs`,
  `generatedArtifacts`, `startedAt`, `finishedAt`, `estimatedCompletion`.
- Las generaciones persisten en `generations.jsonl` (fuente de `analytics.*` y del dashboard).

---

## 7. Flujo de integración con Hermes

1. Hermes consulta `GET /api/v1/provider` → identidad + status (Dashboard Boundary).
2. Hermes consulta `GET /api/v1/capabilities` → registro dinámico (Service Registry → Capability Registry).
3. Hermes registra **Bindings** con scopes de `analytics.*` + `creative.*` (y `content.*` de lectura).
4. Hermes invoca `POST /api/v1/capabilities/:id/execute` enviando **siempre** `tenantId` + `executionId` y, para async, `callbackUrl`.
5. Al terminar, Media Co hace POST del **ExecutionResult** al `callbackUrl` de Hermes (sin polling) y publica el artefacto.
6. Hermes vuelca los artefactos a su Artifact Store y deja la traza en Telemetry.

---
*Documento de especificación — no duplica el dashboard. Railway mantiene versionado y health en runtime.*
