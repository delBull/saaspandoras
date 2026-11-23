# Módulo de Prospección — implementación

Fecha: 22 nov 2026 · Estado: **implementado y cableado en Nexus** (no desplegado aún).
Diseño previo: `docs/PROSPECTING-MODULE-SPEC.md`.

> Es un **módulo**, no una función del Deal Pod. El pod sólo aporta contexto y el
> destino del link. El runner se puede importar desde el Portal de Hermes o
> Growth OS sin reescribir nada: recibe `(orgId, jobId)` y usa el mismo `JobSpec`.

---

## 1. Qué hace y qué no hace

**Hace**

```
Fuentes públicas → recolector → extractor → reglas → bandeja → aprobación → link /l/<code>
```

- Recolecta de prensa (RSS), webs que tú declares, EDGAR (SEC) y búsqueda web (opcional).
- Aplica reglas: edad máxima, confianza mínima, dominios excluidos, palabras excluidas, "sólo con correo".
- Deduplica por organización (correo; si no hay, empresa + persona + cargo).
- Deja todo en una bandeja; al aprobar genera la semilla del radar.

**No hace (por diseño)**

- No entra a LinkedIn ni a nada detrás de login.
- No envía correos. El primer toque lo mandas tú desde tu buzón.
- No inventa correos, nombres ni empresas: si el dato no está escrito en la fuente, no existe.
- No simula resultados: si una fuente falla, se reporta el motivo.

---

## 2. Archivos

| Archivo | Rol |
|---|---|
| `apps/dashboard/src/lib/prospecting/types.ts` | Contrato: `JobSpec`, `ProspectRules`, puertas, fuentes |
| `lib/prospecting/spec.ts` | Normalización defensiva (API y jsonb) |
| `lib/prospecting/http.ts` | `SafeHttpClient` de Hermes + `robots.txt` + rate limit 1 req/s + parser RSS |
| `lib/prospecting/text-to-spec.ts` | Camino B: texto libre → `JobSpec` (reglas + LLM opcional) |
| `lib/prospecting/extract.ts` | Extracción regex + LLM validada, scoring determinista, `dedupeKey` |
| `lib/prospecting/sources/{news,corporate,sec,search}.ts` | Una fuente por archivo; el runner no conoce implementaciones |
| `lib/prospecting/runner.ts` | Ejecuta un job con presupuesto de tiempo y persiste resultados |
| `lib/prospecting/repo.ts` | Consultas, `nextRunFor`, `dueJobs` |
| `lib/nexus/outreach-links.ts` | Creación de semillas (fuente única; la usan el pod y la aprobación) |
| `app/api/nexus/prospects/**` | API (parse, jobs, run, bandeja, approve, reject) |
| `app/api/cron/prospects/route.ts` | Worker programado con `CRON_SECRET` |
| `components/nexus/ProspectingPanel.tsx` | UI: reglas, targets, horarios, edades, text-to-scrap, bandeja |
| `packages/db-core/src/schema.ts` | `nexus_prospect_jobs`, `nexus_prospects` |
| `apps/dashboard/drizzle/0113_prospects.sql` | Migración aditiva |
| `.github/workflows/prospects-cron.yml` | Cron cada 30 min → `/api/cron/prospects` |

---

## 3. Modelo de datos

`nexus_prospect_jobs`

- `pod_id` (opcional), `canonical_org_id`, `label`, `mode` (`SEARCH|TEXT`), `query`, `spec` (jsonb)
- `status` (`QUEUED|RUNNING|DONE|FAILED|PAUSED`), `schedule` (`MANUAL|HOURLY|DAILY|WEEKLY`)
- `max_age_days`, `min_confidence`, `runs`, `last_run_at`, `next_run_at`, `stats`, `last_error`

`nexus_prospects`

- `job_id`, `pod_id`, `canonical_org_id`
- `company`, `person_name`, `role`, `email`, `email_status`, `door`
- `source_type` (`press|corporate|sec|search`), `source_url` (**obligatorio**), `source_title`, `publisher`, `published_at`
- `confidence` (0–92), `extraction` (`llm|regex|feed`), `status` (`NEW|APPROVED|REJECTED|CONTACTED`)
- `dedupe_key`, `raw` (evidencia), `reject_reason`, `link_id`
- Índice único `(canonical_org_id, dedupe_key)`

---

## 4. Autoridad

- Todas las rutas `/api/nexus/prospects/**` usan `requirePodActor()`: sesión Nexus + `OWNER`/`SUPER_ADMIN`/`permissions.all`.
- El `podId` que llega del cliente **se valida** contra `canonical_org_id`; no autoriza.
- Toda consulta filtra por `canonical_org_id` de la sesión. Un prospecto de otra org no es visible ni aprobable.
- El cron usa `Authorization: Bearer CRON_SECRET` (401 en producción sin secreto).
- Aprobar no concede nada: sólo crea una fila en `nexus_outreach_links` ligada a un pod de la misma org.

---

## 5. Fuentes

| Fuente | Cómo obtiene | Límite honesto |
|---|---|---|
| `press` | Google News RSS | Los enlaces son envoltorios de Google: **no hay cuerpo**. Se guarda titular, medio, fecha y URL. `extraction: feed`, confianza ≤ 35 |
| `corporate` | URLs que tú declaras + páginas de equipo/contacto del mismo host (máx. 2) | Requiere `robots.txt` permitido. Sólo lee HTML público |
| `sec` | EDGAR full-text search (8-K) + documento del archivo público | Rango de fechas en el servidor (`dateRange=custom`). Empresa viene del filing |
| `search` | Brave Search API | Requiere `BRAVE_SEARCH_API_KEY`. Sin clave: fuente omitida con motivo explícito |

**Política de robots:** se respeta `robots.txt` en páginas HTML (regla más específica gana; 5xx ⇒ fail-closed). Los feeds RSS y las APIs públicas de sindicación se leen como se publican; no son crawling de contenido.

**Rate limit:** 1 request por segundo por host, con caché de `robots.txt` de 1 h.

---

## 6. Reglas y confianza

Reglas del job:

| Regla | Efecto |
|---|---|
| `maxAgeDays` | Descarta candidatos con `published_at` más viejo. `0` = sin límite |
| `minConfidence` | Descarta por debajo del umbral |
| `requireEmail` | Sólo entran candidatos con correo **literal** en la fuente |
| `excludeDomains` | Nunca recolecta esos dominios (por defecto LinkedIn, redes) |
| `excludeKeywords` | Descarta si el titular/texto contiene la palabra |

Confianza (determinista, calculada en `extract.ts`):

```
base: corporate 45 · sec 40 · press 28 · search 25
+25 correo literal   +15 nombre con cargo   +8 empresa   +4 puerta   +3 reciente
sin cuerpo recuperable ⇒ tope 35
máximo absoluto: 92 (nada aquí está verificado)
```

`email_status` arranca en `unverified`. No existe todavía verificación SMTP: **no se presenta como verificado**.

---

## 7. Extracción

1. **regex (siempre):** correos literales; nombre + cargo adyacentes (`"Ana Ruiz — CEO"`).
2. **llm (si `OPENAI_API_KEY`):** salida JSON con `{company, personName, role, email, door}`.
   Cada campo se **valida contra el texto**: si el nombre o el correo no aparecen literalmente, se descarta y queda la razón en `raw.evidence`.
3. Sin clave o si el modelo falla: se usa regex y el job lo refleja (`stats.lastRun.llm = false`).

---

## 8. Text-to-scrap

`POST /api/nexus/prospects/parse` devuelve el spec entendido **sin escribir nada**.

El parser determinista detecta: puertas (family office, broker, consolidador, patient capital, soberano), fuentes (prensa/EDGAR/webs/búsqueda), URLs, frases entre comillas, edad (`últimos 6 meses`), frecuencia (`semanal`, `diario`, `cada hora`) y `sólo con correo`. Con clave, el modelo refina; sus valores se validan contra los enums antes de aceptarse. Lo que no se entiende aparece como nota visible.

Ejemplo real (sin LLM, ejecutado hoy):

```
"Family offices en CDMX que compraron hoteles en los últimos 6 meses, con correo,
 "hotel acquisition", revisar cada semana en https://ejemplo.com/team"
→ doors [MX_FAMILY] · sources [corporate] · targetUrls 1 · maxAgeDays 180
  requireEmail true · schedule WEEKLY · query "hotel acquisition"
```

---

## 9. API

| Método | Ruta | Uso |
|---|---|---|
| POST | `/api/nexus/prospects/parse` | text-to-scrap (vista previa) |
| GET/POST | `/api/nexus/prospects/jobs` | lista / crea job (`text` o `spec`) |
| GET/PATCH | `/api/nexus/prospects/jobs/[id]` | detalle / reglas, frecuencia, pausa |
| POST | `/api/nexus/prospects/jobs/[id]/run` | ejecuta ahora (≤ 45 s) |
| GET | `/api/nexus/prospects?status=&door=&podId=&jobId=&minConfidence=` | bandeja |
| POST | `/api/nexus/prospects/[id]/approve` | aprueba y genera `/l/<code>` (idempotente) |
| POST | `/api/nexus/prospects/[id]/reject` | rechaza con motivo obligatorio |
| GET | `/api/cron/prospects` | worker programado (`CRON_SECRET`) |

---

## 10. Cómo se usa

1. Nexus → **OPS HUB → PROSPECCIÓN**.
2. “Nueva búsqueda” → modo **Texto** o **Reglas manuales**.
3. Elige Deal Pod destino (para que la aprobación genere el link del radar).
4. “Guardar y ejecutar”. El resumen dice cuántos candidatos hubo y por qué se descartaron.
5. Bandeja → **Aprobar** (crea `/l/<code>` y lo copia) o **Rechazar** (pide motivo).
6. El envío lo haces tú desde tu buzón; el link mide la apertura en el radar.

---

## 11. Evidencia de esta sesión

```
Migración
  psql -f drizzle/0113_prospects.sql
  → aplicada; pg_tables: nexus_prospect_jobs, nexus_prospects; 44 columnas; uq_prospects_org_dedupe

Typecheck
  apps/dashboard: ../../node_modules/.bin/tsc --noEmit --pretty false
  → 0 errores en archivos nuevos. Errores preexistentes ajenos: NexusLoginGate (3), CustomSwap (1),
    TokenRoutes (1), packages/shared/dist/nexus-phone.js (13). NINGUNO en prospección.

Smoke determinista
  → robots: {"allow":["/private/public/"],"disallow":["/private/","/no-bot/"]}
  → emails: ["juan.perez@fondomx.com"] (descarta logo@2x.png y noreply@)
  → text-to-spec: MX_FAMILY · 180 días · requireEmail · WEEKLY
  → prensa real: 3 candidatos con medio y fecha

Smoke de fuentes
  → corporate (snarai.aztecaz.xyz): 1 página, 65 chars (sitio cliente-side) ⇒ extraction feed, conf 35
  → SEC (8-K, 120 días): 3 filings reales, empresa DiamondRock, conf 55, sin correos inventados

End-to-end contra la base operativa (org `smoke-test`, luego borrado)
  job 267800a5… → DONE · candidates 3 · inserted 3 · skipped 0 · 1000 ms
  filas: 31 feed / 35 regex / 35 regex — sin nombre ni correo (correcto: prensa sin cuerpo)
  limpieza: prospects y job eliminados
```

**NO verificado:** la ruta LLM (no hay `OPENAI_API_KEY` en este entorno local). En producción la clave existe; se verificará en la primera corrida real y quedará en `stats.lastRun.llm`.

---

## 12. Reutilización desde Hermes Portal / Growth OS

El runner no depende de Next ni de la UI:

```ts
import { runProspectJob } from "@/lib/prospecting/runner";

await runProspectJob({ jobId, orgId: canonicalOrgId, budgetMs: 30_000 });
```

Lo único que hay que proveer en el nuevo host: acceso a `@saasfly/db`, `canonicalOrgId` ya resuelto por su propio control plane, y `CRON_SECRET` para el worker. El Deal Pod es opcional (`pod_id` nullable): sin pod, aprobar no genera link.

---

## 13. Siguientes pasos (no incluidos)

1. Verificación de correo (MX/SMTP) para mover `email_status` a `verified`.
2. Fuentes adicionales (prensa de negocio con cuerpo, agendas de eventos, registros públicos locales).
3. Plantillas de correo por puerta e idioma, conectadas al link aprobado.
4. Monitoreo de rendimiento por fuente (cuántos aprobados por fuente, no sólo cuántos recolectados).
5. API keys por organización para que otro tenant use el módulo sin sesión Nexus.
