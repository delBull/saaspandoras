# Auditoría de Identidad y Arquitectura: Flujo "KYC-Internal" y Ventas (Growth OS)

Basado en la directiva de habilitar el flujo comercial interno ("pandoras" tenant) para que los colaboradores (Marketing/Ventas) puedan inyectar leads y Hermes actúe como agente de cierre y onboarding, presento el estado actual de la base de datos y la arquitectura necesaria.

## 1. Identidades Involucradas (Modelo de Datos Actual)

### A. Colaborador Interno (Agente de Marketing/Ventas)
- **Tabla:** `nexus_collaborators`
- **Autoridad:** `canonicalOrgId = "pandoras"`
- **Rol:** `role = "MARKETING"` o `"COLLABORATOR"`
- **Contacto:** `whatsappPhone`, `email`
- **Estado:** Ya soportado nativamente por la base de datos.

### B. El Cliente Potencial (El "Lead" inyectado)
- **Tabla:** `marketing_leads`
- **Tenant Asignado:** `projectId` (apuntando al ID del tenant "pandoras").
- **Vinculación con el Agente:** El campo `referrer` en `marketing_leads` se utilizará para guardar el `id` del `nexus_collaborator` que lo creó.
- **Campos de Negocio (KYC-Internal):** `name`, `email`, `phoneNumber` (WhatsApp). Cualquier detalle adicional del negocio se guardará en la columna `metadata` (JSONB).

---

## 2. El Enlace: La "Clave de Invitado" y WhatsApp

El usuario solicita que el cliente se contacte con Hermes usando una **"clave de invitado"**.

### Solución Arquitectónica (Golden Links vs Meta-Tags)
Actualmente tenemos la tabla `golden_links`, pero está orientada a *Campañas*. Para un flujo 1 a 1 (Lead <-> Hermes), la forma más limpia y alineada con los `FROZEN_CONTRACTS` es:

1. Cuando el Colaborador crea el Lead en el Growth OS, el backend genera un código único (ej. `INV-9A8B`).
2. Este código se guarda en `marketing_leads.contactContext.inviteKey`.
3. El Colaborador le envía un mensaje de WhatsApp al cliente con un link pre-llenado: 
   `https://wa.me/<NUMERO_HERMES>?text=Hola Hermes, mi clave de acceso es INV-9A8B`
4. **El Engine de Hermes:**
   - Lee el mensaje entrante.
   - Extrae `INV-9A8B`.
   - Busca en `marketing_leads` donde `contactContext->>'inviteKey' = 'INV-9A8B'`.
   - **¡Magia!** Hermes ya sabe el nombre del cliente, el correo, los detalles de su negocio, y que "Marco" (el Colaborador) fue quien lo invitó.

---

## 3. Mapeo del Flujo Solicitado a la Arquitectura

| Paso del Usuario | Componente Técnico / Tabla afectada |
| :--- | :--- |
| **1. Llenar info del cliente en Growth OS** | Se hace un `INSERT` a `marketing_leads`. `referrer = collaboratorId`. Campos: nombre, wp, detalles en `metadata`. |
| **2. Enviar WhatsApp con Clave** | Se genera un `inviteKey` en el `contactContext`. Hermes Omnichannel (WhatsApp webhook) intercepta el texto. |
| **3. Entrar a dash.pandoras / Hub** | Hermes le responde en WA validando su identidad y le entrega un Magic Link o acceso a la TMA / Hub de Onboarding. |
| **4. Onboarding y Paquetes** | El cliente interactúa con la UI (o con Hermes). El estado de la negociación actualiza `marketing_leads.crmStage`. |
| **5. Seguimiento Comercial** | Los disparadores en Growth OS leen la tabla `marketing_lead_events` para notificar al Colaborador sobre el avance del Lead. |
| **6. Aprovisionamiento (Gratis/Pago)** | Al cerrar la venta (`CLOSED_WON`), se llama al endpoint `/api/v1/integrations/tenants/provision` para crear un nuevo `projects` y un `users` real. |
| **7. Uso del Growth OS (RWA/Contenido)** | El cliente ahora tiene su propio `canonicalOrgId` (su tenant) aislado y puede configurar sus propios colaboradores. |

---

## 4. Brechas Detectadas (Lo que necesitamos codificar)

La base de datos actual soporta el 95% de este flujo. Las únicas piezas que necesitaremos desarrollar en el código (Backend/API) son:

1. **Endpoint de Inyección (Growth OS API):** Un endpoint seguro (`POST /api/v1/nexus/leads/inject`) que los `nexus_collaborators` puedan llamar para insertar el `marketing_lead` y autogenerar el `inviteKey`.
2. **Hermes Intent Recognizer (WhatsApp):** Modificar el router de canales de Hermes para que si un mensaje contiene "clave de acceso es XYZ", ejecute un `LeadResolver` que busque la clave, "despierte" el contexto de ese lead, y responda personalizadamente.
3. **Conversión Lead $\to$ Tenant:** El script de orquestación que toma un `marketing_lead` en estado `CLOSED_WON` y dispara el provisioning real del Tenant.

Todo está perfectamente cuadrado bajo las reglas de `FROZEN_CONTRACTS`. No necesitamos crear nuevas tablas, solo utilizar `marketing_leads` y `nexus_collaborators` correctamente mediante un `inviteKey` en el contexto.
