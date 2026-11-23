# Hermes · Scraping de prospectos — viabilidad

Fecha: 22 nov 2026 · Estado: **análisis, sin ejecutar**.

## 1. Veredicto

**Viable, con límites claros.** Hermes ya tiene runtime, cron, DB y LLM; le falta la
capa de recolección (crawler, cola, extracción y deduplicación). No es un proyecto
de meses, pero tampoco es “un prompt”.

Lo que **no** se debe hacer: scrapear LinkedIn. Viola sus términos y termina en
bloqueo de cuenta. La prospección institucional se hace con fuentes públicas.

## 2. Fuentes viables

| Fuente | Qué se obtiene | Nota |
|---|---|---|
| Sitios corporativos (páginas de equipo, “contact us”) | Nombre, cargo, correo genérico | Respetar `robots.txt` |
| Comunicados de prensa y notas de adquisiciones | Quién lidera M&A / investments | Es la mina para consolidadores |
| SEC / EDGAR (10-K, 8-K, S-4) | Nombres y cargos de Corporate Development | Público y citable |
| Bolsas (BMV, TSX, LSE) | Directivos y operaciones | Requiere parser por formato |
| Agendas de conferencias (IHIF, ALIS, Meet the Money) | Contactos y cargos | Muy buena señal de “quién compra” |
| Noticias y bases de datos de deals | Movimientos y tesis | Sirve para personalizar el correo |

## 3. Arquitectura propuesta

```
Cron (Hermes) → cola de fuentes → fetch (HTTP, sitemap/RSS)
   → extracción estructurada (LLM: nombre, cargo, empresa, fuente, URL)
   → validación (dominio corporativo, dedupe por email/empresa+cargo)
   → guardar en nexus_prospects (nueva tabla, con source_url y fetched_at)
   → aprobación humana en el Deal Pod (nada se envía solo)
   → generar link /l/<code> y borrador de correo
```

Reglas de integridad:
- Cada prospecto guarda **fuente y fecha**; sin fuente no entra.
- Sin correo verificado → queda como “para verificar”, nunca se inventa.
- El envío sigue siendo humano.

## 4. Qué falta construir

1. Tabla `nexus_prospects` (pod_id, empresa, nombre, cargo, email, fuente, estado).
2. Worker de recolección: fetch + parseo + rate limit (1 req/s por dominio) y
   respeto de `robots.txt`.
3. Extractor LLM con salida estructurada y validación.
4. Deduplicación (empresa + cargo + email normalizado).
5. Bandeja de aprobación en el Deal Pod.
6. Registro de “última revisión” por fuente para no repetir.

## 5. Esfuerzo y riesgos

| Fase | Alcance | Tiempo |
|---|---|---|
| MVP | 3 fuentes (prensa, sitios corporativos, SEC) + aprobación | 3–5 días |
| v1 | 8 fuentes + dedupe + scoring por puerta | 2 semanas |
| v2 | Monitoreo continuo y alertas de movimientos | 1 mes |

Riesgos: bloqueo por rate limit, HTML cambiante (mantenimiento de parsers), datos
desactualizados (mostrar fecha), y exposición legal si se scrapea contenido con
login o se almacenan datos personales sin base legal.

## 6. Recomendación

Empezar por el **MVP de 3 fuentes** con aprobación humana. Eso ya elimina la
dependencia de una lista manual para la Onda 1 y deja el terreno para Onda 2. La
automatización del *envío* no se recomienda: el primer toque institucional se gana
con criterio humano.
