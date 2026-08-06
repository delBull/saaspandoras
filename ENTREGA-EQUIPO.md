# 🚀 ENTREGA AL EQUIPO EXTERNO — Pandora's Media Co ↔ Hermes

**Preparado por Sofía (COO — Bull's Lab) · 06 Ago 2026 · Listo para enviar**

---

## Mensaje de entrega (copiar y pegar)

> Hola equipo Pandora's 👋
>
> Les entrego el contrato de integración entre **Hermes (Cognitive OS)** y **Pandora's Media Co** para quedar cableados de verdad.
>
> 📄 **`requisitos.md`** — Los requisitos/contrato de integración (Service Provider ↔ Consumidor). Lo revisamos completo: la estructura de 2 entregables y el hallazgo del **Resource Manager** están correctos. Detectamos y ya **ejecutamos** (no solo documentamos) los contratos que faltaban en el documento: **Capability Endpoints** + **Versionado**.
>
> 📄 **`PROVIDER-API.md`** — La especificación TÉCNICA ya desplegada y en producción:
>
> - Base: `https://portal-production-1672.up.railway.app/api/v1`
> - Identidad: `pandoras-media-co` @ `v1.0.0` (healthy)
> - Catálogo de capacidades **versionado** y consultable en runtime (`GET /api/v1/capabilities`)
> - 7 capacidades disponibles + 20 planificadas (devuelven `503` hasta activarse)
> - Auth por scopes (`X-Provider-Key` / Bearer) + `X-Api-Version` (426 si no soportada)
> - Workflows `sync` y `async` (imágenes FLUX reales con telemetría y costo)
> - Provider Key y ejemplo E2E dentro de la spec
>
> **Lo que necesitamos de ustedes para cablear:** que Hermes (1) consulte `/api/v1/provider` y `/api/v1/capabilities`, (2) registre los Bindings (scopes `analytics.*` + `creative.*`), y (3) ejecute vía `POST /api/v1/capabilities/:id/execute`. **Ya implementamos los requisitos finales que nos pidieron:** el `callbackUrl` dinámico (Media Co hace POST del ExecutionResult al terminar — **sin polling**) y la inyección de contexto `tenantId` (projectId) + `executionId` en cada ejecución, persistidos en telemetría y reflejados en el callback (base lista para facturación por sub-proyecto). Detalle completo en la sección 5 de `PROVIDER-API.md`.
>
> Estamos listos. 🚀

---

## Archivos a adjuntar

| Archivo | Ruta | Qué es |
|---|---|---|
| `requisitos.md` | `~/Downloads/requisitos.md` | Contrato de requisitos Hermes ↔ Media Co (revisado) |
| `PROVIDER-API.md` | `media-co/PROVIDER-API.md` | Spec técnica desplegada (endpoints, auth, catálogo, ejemplos) |

## Estado de lo que pide el `requisitos.md`

| Contrato | Estado |
|---|---|
| A · Service Identity | ✅ `/api/v1/provider` |
| B · Capability Catalog (versionado) | ✅ `/api/v1/capabilities` + semver por capability |
| C · Context | ✅ body de `execute` |
| D · Artifact | ✅ envelope + `/api/v1/artifacts/:id` |
| E · Workflow | ✅ sync (200) / async (202 + poll) |
| F · **Capability Endpoints** | ✅ **EJECUTADO** (antes faltaba en el doc) |
| G · **Versionado** | ✅ **EJECUTADO** (antes faltaba en el doc) |
| H · Health | ✅ `/api/v1/health` (por servicio) |
| I · Authorization (scopes) | ✅ `X-Provider-Key`/Bearer + scopes por dominio |
| J · Discovery | ✅ `/api/v1/capabilities/names` (+ schemas en catálogo) |
| K · Dashboard Boundary | ✅ `/api/v1/provider` = resumen embebible (no duplica dashboard) |
