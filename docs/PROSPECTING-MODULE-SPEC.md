# Módulo de Prospección (reutilizable) — especificación

Fecha: 22 nov 2026 · Estado: **diseño**. Implementado hoy: Deal Pods + radar de links.

## 1. Principio

La prospección es un **servicio del ecosistema**, no una función del Deal Pod. El pod
la consume; otro tenant o un worker externo también puede hacerlo por API.

```
Fuentes públicas → Recolector → Extractor → Validador → Aprobación → Link/Borrador
```

## 2. Modelo de datos (propuesto)

```
nexus_prospects
├─ id, pod_id (nullable: puede existir sin pod), canonical_org_id
├─ company, person_name, role, email, email_status (unverified|verified|bounced)
├─ door (CONSOLIDATOR|BROKER|PATIENT_CAPITAL|SOVEREIGN|MX_FAMILY)
├─ source_url, source_type (press|corporate|sec|exchange|event|news)
├─ fetched_at, confidence (0-100), status (new|approved|rejected|contacted)
└─ metadata jsonb
```

Reutiliza `nexus_outreach_links` y `nexus_outreach_events` para el radar.

## 3. Contrato de API

| Método | Ruta | Uso |
|---|---|---|
| POST | `/api/prospects/jobs` | encola una búsqueda (query, puerta, fuentes) |
| GET | `/api/prospects/jobs/:id` | estado, progreso, errores |
| GET | `/api/prospects?podId=&status=` | lista con fuente y fecha |
| POST | `/api/prospects/:id/approve` | aprueba y genera link `/l/<code>` |
| POST | `/api/prospects/:id/reject` | rechaza con motivo |
| POST | `/api/prospects/:id/verify-email` | verificación (SMTP/API) |

Autoridad: sesión Nexus con `nexus.manage` **o** API key de organización
(`x-org-key`), nunca el `pod_id` del body como autorización.

## 4. Recolector

- Cola en DB (`nexus_prospect_jobs`) procesada por cron.
- `fetch` con rate limit por dominio (1 req/s), respeto de `robots.txt`, timeout.
- Fuentes iniciales: comunicados, webs corporativas, SEC/EDGAR, agendas de eventos.
- **Prohibido:** LinkedIn y cualquier contenido tras login.

## 5. Extractor y validador

- LLM con salida estructurada (nombre, cargo, empresa, correo si aparece).
- Regla dura: **sin `source_url` el prospecto no entra**; sin correo → `unverified`.
- Dedupe por `email` o `(company normalized, role)`.
- Score de confianza por fuente y coincidencia de cargo.

## 6. Aprobación humana

- Bandeja en el Deal Pod: aprobar/rechazar con un clic.
- Al aprobar: se crea el link `/l/<code>` y el borrador de correo (EN/ES según puerta).
- Nada se envía automáticamente en la v1.

## 7. Reutilización por otros tenants

- Todo se filtra por `canonical_org_id` de la API key/sesión.
- El Deal Pod es solo una vista: el módulo funciona sin pod (`pod_id` null).
- Para S'Narai: mismos endpoints con `door` y fuentes configuradas para compradores de
  accesos (family offices, clubes, operadores boutique) en lugar de M&A hotelero.

## 8. Fases

| Fase | Entrega | Tiempo |
|---|---|---|
| 1 | Tabla + job + 3 fuentes + bandeja | 3–5 días |
| 2 | Verificación de correo + scoring + 8 fuentes | +1 semana |
| 3 | API keys por organización y monitoreo continuo | +1 semana |
