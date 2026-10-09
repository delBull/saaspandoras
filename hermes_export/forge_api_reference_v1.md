# Pandora's Media Co - Guía de Integración para Forge (v1.0)

Bienvenido a la documentación de integración de Hermes OS. Esta guía detalla cómo el agente de Forge puede aprovisionar tenants y comunicarse con la **Content API** de Media Co mediante autenticación Server-to-Server.

---

## 1. Autenticación

Todas las peticiones a la API deben estar autenticadas mediante un **API Key** válido (Sovereign Token). Este token se debe enviar en el header HTTP `Authorization`.

**Formato del Header:**
```http
Authorization: Bearer sk_live_tu_api_key_aqui
```

> **Aviso:** Cada API Key tiene permisos criptográficos acotados (ej. `content.asset.read`, `tenant.provision`). Asegúrate de que tu llave cuenta con los permisos necesarios para cada endpoint.

---

## 2. Aprovisionamiento de Tenants (Developer Mode)

Si requieres crear nuevos espacios de trabajo (tenants) dinámicamente desde Forge.

### `POST /api/v1/integrations/tenants/provision`

Crea una nueva organización aislada dentro del sistema.

**Permiso requerido:** `tenant.provision`

**Body (JSON):**
```json
{
  "name": "Nombre de la Organización / Creador",
  "slug": "nombre-unico-sin-espacios",
  "identity": {
    "tone": "profesional",
    "language": "es"
  }
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Tenant provisioned successfully via API.",
  "tenant": {
    "id": 123,
    "organizationId": "uuid-del-tenant",
    "slug": "nombre-unico-sin-espacios",
    "status": "draft",
    "isSimulationMode": true
  }
}
```

---

## 3. Content API (Media Co)

Esta API permite al agente leer el calendario de contenido, crear tareas de producción de assets y registrar aprobaciones criptográficas on-chain (Knowledge Vault).

### 3.1. Obtener Assets Aprobados o Pendientes
### `GET /api/v1/content/assets`

**Permiso requerido:** `content.asset.read`

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "assets": [
    // Lista de assets disponibles y sus metadatos
  ]
}
```

### 3.2. Crear una Solicitud de Producción (Job)
### `POST /api/v1/content/jobs`

Solicita la creación de un nuevo asset (ej. renderizado de video, generación de copy).

**Permiso requerido:** `content.asset.create`

**Body (JSON):**
```json
{
  "title": "Video Pitch Q3",
  "type": "video_render",
  "parameters": {
    "duration": 60,
    "script": "Texto del guion..."
  }
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "jobId": "job_123456789",
  "status": "queued",
  "message": "Job created successfully"
}
```

### 3.3. Consultar Estado de un Job
### `GET /api/v1/content/jobs/:jobId`

**Permiso requerido:** `content.asset.read`

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "jobId": "job_123456789",
  "status": "completed"
}
```

### 3.4. Aprobar un Asset Terminado
### `POST /api/v1/content/assets/:assetId/approval`

Emite una firma para aprobar un asset que fue generado. Esta acción notifica al Sovereign Vault.

**Permiso requerido:** `content.render`

**Body (JSON):**
```json
{
  "approved": true,
  "comments": "Excelente render, listo para distribución."
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "assetId": "asset_987",
  "approved": true,
  "message": "Asset approval recorded"
}
```

---

## 4. Webhooks y Sincronización (Próximamente)

La capacidad para que Forge reciba notificaciones (ej. `job.completed`, `asset.approved`) directamente en un endpoint (Server-to-Server callbacks) ya cuenta con la UI preparada en el panel de **Hermes Portal > Developers**. En la siguiente fase se documentarán las firmas criptográficas para validar la procedencia de los eventos webhooks.
