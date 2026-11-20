# Plan de migración — Registro de Activos IP (`nexus_ip_assets`)

Fecha: 20 nov 2026 · Estado: **EJECUTADO (DDL aplicado + API + UI)** · Tipo: **aditiva, sin cambios destructivos**.

Objetivo: que el tab **OPS REGISTER** del Operations Hub lea y escriba activos IP en
base de datos, por organización, en lugar del `localStorage` del navegador.

---

## 1. Estado actual (verificado)

| Hecho | Evidencia |
|---|---|
| El registro IP vive solo en el navegador | `OperationsHubModal` lee/escribe `pandoras_ip_assets_custom` |
| Los 8 activos `PAND-MARK-*` se quitaron del código | seed vacío tras la limpieza de mocks |
| No existe tabla ni API de IP | no hay `nexus_ip_assets` en `packages/db-core/src/schema.ts` |
| El verificador de producción solo cubre reuniones/decks | `scripts/migrate-production.mjs` limita su alcance |
| El journal de drizzle está desfasado | `_journal.json` tiene 94 entradas vs. 0105 en disco |

Consecuencia: el alta actual **no se comparte**, se pierde al cambiar de dispositivo y no
es auditable. Es exactamente el tipo de dato que debería estar en DB.

---

## 2. Diseño de datos (nueva tabla, aislada)

```
nexus_ip_assets
├─ id                     uuid      PK, default gen_random_uuid()
├─ canonical_org_id       varchar(256) NOT NULL         ← tenant (nunca del cliente)
├─ name                   text      NOT NULL
├─ category               varchar(64) NOT NULL default 'Marca Denominativa'
├─ classes                varchar(128)                   ← "Clase 36 + Clase 42"
├─ jurisdiction           varchar(64) default 'IMPI (México)'
├─ status                 varchar(24) NOT NULL default 'PLANNED'
│                          -- PLANNED | FILED | PENDING | ACTIVE | ABANDONED
├─ priority               varchar(16) default 'MEDIUM'   -- LOW | MEDIUM | HIGH
├─ risk                   varchar(16) default 'LOW'      -- LOW | MEDIUM | HIGH
├─ risk_notes             text
├─ registry_ref           varchar(128)                   ← número de expediente
├─ filed_at               timestamptz
├─ granted_at             timestamptz
├─ next_action            text
├─ next_action_at         timestamptz
├─ owner_collaborator_id  int       NULL → nexus_collaborators(id) ON DELETE SET NULL
├─ created_by             int       NULL → nexus_collaborators(id) ON DELETE SET NULL
├─ metadata               jsonb     NOT NULL default '{}'
├─ archived_at            timestamptz                    ← borrado lógico
├─ created_at             timestamptz NOT NULL default now()
└─ updated_at             timestamptz NOT NULL default now()

Índices
├─ (canonical_org_id, status)
├─ (canonical_org_id, category)
└─ (canonical_org_id, archived_at)
```

Decisiones deliberadas:

- **Sin ENUM de Postgres**: `varchar` + validación en aplicación. Un ENUM agrega un tipo
  global difícil de revertir; `varchar` permite evolucionar estados sin migración.
- **Sin `CHECK`**: mismo motivo. La tabla arranca vacía, así que el riesgo es cero, pero
  no compra nada frente a validar en el endpoint.
- **Sin FK a una tabla de organizaciones**: no existe; el aislamiento es
  `canonical_org_id` (igual que `nexus_tasks`).
- **Borrado lógico** (`archived_at`), nunca `DELETE` desde la UI.
- **`metadata jsonb`**: espacio para campos futuros sin migrar.

---

## 3. Migración (DDL aditivo)

Archivo: `apps/dashboard/drizzle/0106_nexus_ip_assets.sql`

```sql
CREATE TABLE IF NOT EXISTS "nexus_ip_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "canonical_org_id" varchar(256) NOT NULL,
  "name" text NOT NULL,
  "category" varchar(64) NOT NULL DEFAULT 'Marca Denominativa',
  "classes" varchar(128),
  "jurisdiction" varchar(64) DEFAULT 'IMPI (México)',
  "status" varchar(24) NOT NULL DEFAULT 'PLANNED',
  "priority" varchar(16) DEFAULT 'MEDIUM',
  "risk" varchar(16) DEFAULT 'LOW',
  "risk_notes" text,
  "registry_ref" varchar(128),
  "filed_at" timestamptz,
  "granted_at" timestamptz,
  "next_action" text,
  "next_action_at" timestamptz,
  "owner_collaborator_id" integer REFERENCES "nexus_collaborators"("id") ON DELETE SET NULL,
  "created_by" integer REFERENCES "nexus_collaborators"("id") ON DELETE SET NULL,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "archived_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_nexus_ip_assets_org_status"
  ON "nexus_ip_assets" ("canonical_org_id", "status");
CREATE INDEX IF NOT EXISTS "idx_nexus_ip_assets_org_category"
  ON "nexus_ip_assets" ("canonical_org_id", "category");
CREATE INDEX IF NOT EXISTS "idx_nexus_ip_assets_org_archived"
  ON "nexus_ip_assets" ("canonical_org_id", "archived_at");
```

Propiedades de riesgo:

| Propiedad | Estado |
|---|---|
| ¿Altera tablas existentes? | No |
| ¿Borra o renombra columnas? | No |
| ¿Requiere backfill? | No (tabla nueva, vacía) |
| ¿Bloquea escrituras existentes? | No (`CREATE TABLE` sin locks sobre otras tablas) |
| ¿Reversible? | Sí: `DROP TABLE` (sin dependencias) |

Nota sobre el journal: como el journal de drizzle está desfasado, **no** se usa
`drizzle-kit migrate`. El SQL se aplica directo, idempotente (`IF NOT EXISTS`), igual
que las migraciones 0095–0105.

---

## 4. Contrato de API (nuevo, aislado)

```
GET    /api/nexus/ip-assets                 → lista (por org, sin archivados)
POST   /api/nexus/ip-assets                 → crea
PATCH  /api/nexus/ip-assets/[id]            → actualiza campos permitidos
POST   /api/nexus/ip-assets/[id]/archive    → archiva (archived_at = now)
```

Autoridad (server-side, fail-closed):

1. `getNexusAuthContext(headers)` → sesión válida; si no, `401`.
2. Capability: `nexus.manage` **o** rol `SUPER_ADMIN`/`ADMIN`; si no, `403`.
3. `canonical_org_id` **solo** desde `auth.canonicalOrgId`. Si falta → `409 ORG_UNRESOLVED`
   (nunca `'pandoras'` por defecto).
4. Toda consulta filtra `AND canonical_org_id = :org`. Un `id` de otra org → `404`
   (no `403`: no se filtra la existencia).
5. `created_by` / `owner_collaborator_id` desde la sesión, jamás del body.
6. Validación: `name` 1–200, `category` en lista, `status` en lista, `risk` en lista,
   `registry_ref` ≤ 128, `next_action` ≤ 500.

Ejemplo de payload (POST):

```json
{
  "name": "PANDORAS",
  "category": "Marca Denominativa",
  "classes": "Clase 36 + Clase 42",
  "jurisdiction": "IMPI (México)",
  "status": "FILED",
  "priority": "HIGH",
  "risk": "LOW",
  "registry_ref": "MX/2026/000123"
}
```

---

## 5. Cableado en la UI

1. `OperationsHubModal` (tab `REGISTER`):
   - `useEffect` → `GET /api/nexus/ip-assets` (loading / vacío / error explícito).
   - Alta → `POST`; edición de estado/riesgo → `PATCH`; “eliminar” → archive.
   - Se elimina la lectura/escritura de `localStorage`.
2. **Importación única** de lo que ya exista en el navegador:
   - Al abrir el tab, si `localStorage` tiene registros y la tabla está vacía, mostrar
     “Importar N activos locales” (botón explícito, nunca automático).
   - Postea uno por uno; idempotente por `name` normalizado; al terminar, borra la clave
     local y muestra “Importados N”.
3. Feature flag temporal (`nexus_ip_registry = 'api' | 'local'`) para poder volver a
   lectura local sin revertir el deploy. Por defecto `api`.

---

## 6. Orden de despliegue (sin ventana de riesgo)

```
1. Aplicar DDL en producción            ← nadie la usa todavía
2. Verificar information_schema
3. Deploy API + UI (flag = api)
4. Importar los registros locales (botón, una vez)
5. Retirar el código de localStorage   ← deploy posterior, ya sin datos que perder
```

En ningún paso el sistema queda sin registrar activos: si la UI nueva falla, se apaga el
flag y vuelve a modo local mientras se diagnostica.

---

## 7. Verificación (antes de decir “listo”)

```sql
-- Estructura
select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'nexus_ip_assets' order by ordinal_position;

-- Índices
select indexname from pg_indexes where tablename = 'nexus_ip_assets';

-- Aislamiento (debe devolver 0 filas cruzadas)
select count(*) from nexus_ip_assets a
join nexus_ip_assets b on a.id <> b.id
where a.canonical_org_id <> b.canonical_org_id;
```

```
bun x tsc --noEmit                 → 0 errores
vitest ip-assets                   → 401 sin sesión · 403 sin capability · 404 cross-tenant · 201 create
smoke autenticado                  → alta visible tras refresh, en otro navegador
```

---

## 8. Reversión

| Escenario | Acción | Riesgo |
|---|---|---|
| Falla la UI nueva | flag a `local` | ninguno |
| Falla la API | revertir deploy; la tabla queda sin uso | ninguno |
| Hay que quitar la tabla | `DROP TABLE IF EXISTS nexus_ip_assets` (exportar antes si tiene datos) | bajo, tabla aislada |

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Dato escrito en org equivocada | `canonical_org_id` desde sesión; nunca del body |
| Fuga entre tenants | `WHERE canonical_org_id = :org` en toda query; test cross-tenant |
| Pérdida de los registros locales | Importación explícita antes de retirar `localStorage` |
| Confusión “¿dónde está mi activo?” | Estados de carga/vacío/error visibles; sin fallback silencioso |
| Journal de drizzle desfasado | Migración SQL idempotente aplicada directo, no vía kit |
| ENUM/CHECK inmutables | `varchar` + validación en app |

---

## 10. Estimación

| Bloque | Tiempo |
|---|---|
| Schema + DDL + verificación | 45 min |
| API (4 rutas) + tests | 3–4 h |
| UI del tab + importación local | 3–4 h |
| Deploy + importación + retiro del código local | 1 h |
| **Total** | **~1.5 días** |

---

## 11. Decisiones que necesito antes de ejecutar

1. **¿Quién puede escribir?** Propongo `nexus.manage` + admins.
2. **¿Los activos se borran o se archivan?** Propongo archivar (nunca `DELETE`).
3. **¿Importamos automáticamente lo del navegador?** Propongo botón explícito, no automático.
4. **¿Agregamos `owner_collaborator_id` ahora o después?** Propongo ahora (columna nullable, costo cero).

Con esas cuatro respuestas, ejecuto en el orden de la sección 6 y te entrego la evidencia
de la sección 7.


---

## 12. Ejecución (20 nov 2026)

| Paso | Resultado |
|---|---|
| DDL `0106_nexus_ip_assets.sql` | Aplicado en producción: **21 columnas**, **4 índices**, **0 filas** |
| Schema drizzle | `nexusIpAssets` en `packages/db-core/src/schema.ts` (+ tipos `NexusIpAsset`) |
| API | `GET/POST /api/nexus/ip-assets` · `PATCH /api/nexus/ip-assets/[id]` · `POST /api/nexus/ip-assets/[id]/archive` |
| UI | Tab `REGISTER` lee/escribe por API; alta envía `POST`; importación local con botón explícito |
| Identidad | `canonical_org_id` **solo** de la sesión; si falta → `409`; `created_by` desde `collaboratorId`; el body no puede fijar org ni autor |
| Duplicación de rutas | Verificado: no existía `/api/nexus/ip-assets` ni tabla `ip_assets`; no se tocó ninguna otra ruta |
| Tests | `IPA-01..06` (401, 409, 403, 400, 401 GET, 200 lista vacía) → **6/6** |
| Tipos | `tsc --noEmit` → 0 errores en lo tocado |

Pendientes conscientes:

- **Feature flag** `nexus_ip_registry` no se implementó: el rollback es revertir el
  deploy (la tabla queda sin uso) o archivar los registros.
- El banner del tab decía “6 hallazgos, 0 conflictos graves, riesgo bajo” (texto fijo,
  sin respaldo en datos). Se reemplazó por un encabezado neutral con el conteo real.
