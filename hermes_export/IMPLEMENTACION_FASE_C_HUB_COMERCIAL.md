# Implementación Fase C: Hub Comercial y Pipeline B2B

Se ha implementado el **Hub Comercial (Selección Comercial y Órdenes)** para cerrar la brecha entre los prospectos del CRM y el motor de aprovisionamiento de tenants, manteniendo la estricta seguridad de arquitectura requerida por Pandora's.

## 1. Diseño Arquitectónico (Contrato Aprobado)
Se creó un nuevo módulo `commercial_orders` que opera independientemente de `purchases`. Esto soluciona el problema de que los prospectos B2B aún no tienen un `projectId` ni un `userId` en el sistema.

### Esquema de Base de Datos
- **Cabecera (`commercial_orders`):** Relaciona el `leadId`, controla el importe total (`totalAmount`), estado de pago y el nombre/slug deseado para la organización.
- **Detalle (`commercial_order_lines`):** Almacena los módulos seleccionados (`HERMES`, `GROWTH_OS`, `PANDORAS_RWA`), sus precios congelados según la versión del catálogo, y metadatos (como las intenciones o prioridades).
- **Control de Idempotencia:** Se agregó un índice parcial (`commercial_orders_active_idx`) que previene a nivel base de datos que un lead pueda generar múltiples carritos activos simultáneamente (Status: PENDING_PAYMENT, PENDING_APPROVAL, PAID, PROVISIONING).

## 2. Flujo B2B (Cableado Actual)
El cableado del front-end (`UnifiedOnboardingClient.tsx`) discrimina de manera segura a los usuarios dependiendo de cómo llegaron al onboarding:

### A) Flujo Existente B2C (No Comercial):
1. El usuario conecta su wallet.
2. Selecciona módulos y configura su tenant.
3. Se invoca directamente `/api/v1/internal/onboarding/provision` para aprovisionarlo instantáneamente (Tenant Provisioning Service).

### B) Nuevo Flujo B2B (Prospectos por Invitación):
1. El prospecto hace clic en un "Magic Link" (`goldenLink`).
2. El API Endpoint `/api/v1/internal/nexus/invite/[token]` lo valida y emite un **JWT de sesión temporal** con el alcance `commercial:read`, inyectándolo como cookie `commercial_session`.
3. El usuario es redirigido al `UnifiedOnboardingClient`, donde no se le pide conectar Wallet (todavía).
4. Elige sus productos y hace clic en "Continuar al Pago".
5. Se invoca el Server Action `/api/v1/internal/nexus/orders`.
6. El servidor:
   - Valida el JWT y extrae el `leadId`.
   - Consulta el **Catálogo Comercial Server-Side** y calcula el precio oficial (ignorando cualquier precio enviado desde el cliente).
   - Escribe el `commercial_order` con estado `PENDING_PAYMENT`.
7. El cliente es redirigido a `/nexus/checkout/[orderId]` para pagar y finalizar.

## 3. Resolución sobre Aprovisionamiento "Gratuito" Automático

> **Pregunta del equipo comercial:** "¿Se puede dar el aprovisionamiento gratuito desde que se envía el magic link, como ya aprovisionado con todo para ahorrarnos la aprobación? ¿O eso se da después?"

**Respuesta Arquitectónica Actual:**  
Actualmente, el sistema **NO** aprovisiona automáticamente desde el envío del link, incluso si el trato fuera gratuito. Esto es por diseño de seguridad del *Sovereign Tenant Provisioning Engine*:
1. **La decisión del dominio/slug es del cliente:** Necesitamos que el usuario llene el paso 1 de Onboarding (el nombre de su Tenant y el `orgSlug`) para poder correr el aprovisionamiento. Si lo aprovisionamos *antes* de enviarle el link, tendríamos que inventarle un Slug genérico.
2. **El estado siempre pasa por PENDING_PAYMENT:** El endpoint `/api/v1/internal/nexus/orders` actualmente codifica el estado inicial siempre como `PENDING_PAYMENT`, sin excepciones para costo $0.

**¿Cómo implementarlo correctamente (Recomendación para Iteración Inmediata)?**
Si se desea enviar links "Pre-aprobados" o "100% Bonificados" (Gratuitos), la solución más limpia que respeta los contratos de arquitectura (Zero-Bypass) es:
1. Añadir un metadato en la tabla `goldenLinks` al generarlo (ej. `metadata: { discount: 100, autoProvision: true }`).
2. Cuando el usuario entra al Onboarding, hace el flujo normal (elige su Slug y selecciona módulos).
3. Al invocar `/nexus/orders`, el servidor lee del token (derivado del Golden Link) que el Lead tiene una pre-aprobación total. 
4. El servidor inserta la orden **directamente con estado `PAID`** y dispara asíncronamente el motor de aprovisionamiento, saltándose por completo la pantalla de Checkout y la aprobación manual.

Esto ahorra el paso de aprobación, pero obliga al usuario a definir la identidad de su ecosistema (Slug/Nombre) y garantiza que el registro de auditoría (`commercial_orders`) captura la transacción comercial y el funnel de forma perfecta.
