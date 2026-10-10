# Auditoría Read-Only: Identidad, Ciclo Comercial y Aprovisionamiento (Growth OS)

Este documento incorpora la revisión arquitectónica profunda (Architecture Lock v0.1) que condiciona la implementación. Certifica el estado real de la arquitectura, congela las invariantes de identidad y establece los contratos estrictos para el flujo comercial interno de Pandora's (KYC-Internal). **NO-GO para escribir código, GO para fijar el diseño conceptual bajo estas condiciones.**

---

## 1. Verificación del Estado Real (Base de Datos y Código)

La inspección de la base de código real confirma:

| Componente / Tabla | Estado | Evidencia y Limitaciones detectadas |
| :--- | :--- | :--- |
| `nexus_collaborators` | **IMPLEMENTADO** | Es la identidad canónica interna (`schema.ts:4263`). Sin embargo, su simple existencia no prueba autorización comercial. |
| `marketing_leads` | **IMPLEMENTADO** | Usado en `ProvisioningEngine` (`schema.ts:2301`). Es una entidad separada de los tenants y usuarios. |
| `marketing_lead_events` | **IMPLEMENTADO** | Registro inmutable (`schema.ts:2365`). |
| `projects` y `users` | **IMPLEMENTADO** | Tablas principales del Core. |
| `golden_links` | **IMPLEMENTADO** | `schema.ts:3195`. Soporta enlaces para campañas, pero para su uso como invitación de un solo uso requiere controles atómicos de concurrencia. |
| Webhooks WhatsApp/TG | **IMPLEMENTADO** | Operativos (`channel-inbound/route.ts`). |
| Provisioning Engine | **IMPLEMENTADO** | `lib/platform/provisioning-engine.ts`. Posee protección idempotente basada en el `leadId`, reutilizando proyectos si ya existen. |

---

## 2. Invariantes Congeladas (Architecture Lock)

Bajo ninguna circunstancia la implementación del flujo romperá los siguientes contratos fundamentales:

1. **Autoridad Derivada del Servidor:** `canonicalOrgId` y el identificador de colaborador se resuelven exclusivamente desde el contexto de la identidad autenticada (token/sesión), **nunca** confiando en el payload enviado por el cliente.
2. **Autorización Comercial Explícita:** La inyección de leads requiere no solo estar autenticado, sino poseer capacidad explícita para registrar prospectos en el tenant específico (`pandoras`) y que la cuenta del colaborador esté activa.
3. **Invitación ≠ Autenticación:** La invitación segura (token o enlace) no convierte al prospecto en un usuario autenticado ni le concede acceso al dashboard. Solo recupera de forma temporal el contexto comercial para que Hermes (el LLM) pueda saludarlo y enrutarlo al onboarding.
4. **Ciclo Comercial Desacoplado del Aprovisionamiento:** El `crmStage = CLOSED_WON` no es un comando emitido por el LLM ni se alcanza solo por "elegir un paquete". Debe ser producto de una transición autorizada con **evidencia verificable** (pago confirmado, concesión gratuita por admin).
5. **Aislamiento de Errores y Fusión de Identidades:** Fallos de base de datos o política resultarán en *fail-closed*. La deduplicación de leads no debe fusionar automáticamente identidades no verificadas ni revelar datos (PII) a colaboradores no autorizados.

---

## 3. Diseño del Ciclo de Invitación Seguro (Golden Links)

Rechazamos almacenar tokens persistentes en texto plano. La estrategia utilizará `golden_links` bajo un contrato criptográfico:

1. **Generación:** Se crea un token criptográficamente aleatorio y se persiste un hash verificable en `golden_links.slug`, junto con su `expiresAt`, `referrerId` (emisor) y el `leadId`.
2. **Uso Único y Atómico:** La validación de la invitación requerirá una operación condicional atómica para evitar concurrencia (`UPDATE golden_links SET is_active=false WHERE is_active=true AND slug='HASH' RETURNING id`).
3. **Vinculación Temporal:** Su consumo asocia temporalmente el canal (WA) al lead solo para el flujo comercial, no secuestra identidades ya vinculadas en `channel_identity_bindings`.

---

## 4. Diseño del Ciclo Comercial y Provisionamiento

1. **Inyección (`crmStage = LEAD`):** El colaborador autorizado inserta el prospecto y se emite la invitación.
2. **Onboarding Comercial (`crmStage = PROPOSAL`):** Hermes reconoce al prospecto y este elige un paquete en el Hub comercial. Esto es solo una propuesta, no un cierre.
3. **Evidencia y Cierre (`crmStage = CLOSED_WON`):** Se exige evidencia persistida:
   - Webhook validado del proveedor de pagos confirmando fondos.
   - Autorización explícita y registrada de un administrador para gratuidad o descuentos.
4. **Provisionamiento (`ProvisioningEngine`):** Al tener evidencia, se aprovisiona. La operación es 100% idempotente (maneja reintentos fallidos, no duplica tenants, permite recuperación segura).

---

## 5. Contrato Exacto para `POST /api/v1/nexus/leads/inject`

| Componente | Requisito del Contrato |
| :--- | :--- |
| **Autenticación** | Validación real del Bearer token (Service o Session). Expiración comprobada. |
| **Autorización** | Capacidad explícita para inyectar leads en el tenant. Colaborador debe estar `ACTIVE`. |
| **Organización** | `canonicalOrgId` se deriva en el servidor desde la autenticación. No se lee del JSON body. |
| **Payload** | Validación estricta: `name`, email/teléfono normalizados. Minimización estricta de PII. |
| **Duplicados** | Política controlada: Retorna `HTTP 409 Conflict` (o simulación segura) sin filtrar datos de leads previos si ya existe uno asignado a otro colaborador. |
| **Invitación** | Token aleatorio, hash persistido (`golden_links`), expiración y propósito explícito. |
| **Reintentos** | *Idempotency key* para evitar duplicados si la red falla y se reintenta el `POST`. |
| **Auditoría** | Logs registran: actor, org, resultado, `leadId` y motivo de rechazo (sin secretos ni PII). |

---

## 6. Plan de Pruebas Negativas (Obligatorio)

La implementación debe ser verificable contra los siguientes escenarios de fallo:

1. Un token válido de integración sin capacidad comercial recibe rechazo (`403`).
2. Un colaborador suspendido o revocado no puede registrar prospectos.
3. El cliente atacante intenta suplantar `canonicalOrgId`, `referrer` o `collaboratorId` enviándolos en el JSON Payload (el servidor los ignora y usa los del token).
4. Dos solicitudes concurrentes intentan consumir la misma invitación: solo una puede reclamarla, la otra falla.
5. Un código de invitación expirado, revocado o ya consumido no recupera el contexto del lead.
6. Un webhook de WhatsApp con firma inválida o duplicado no produce efectos repetidos.
7. Crear un lead que ya existe bajo otro propietario no filtra sus datos (PII) ni cambia su atribución comercial sin autorización.
8. Un intento de cambiar a `CLOSED_WON` sin evidencia transaccional de pago o concesión autorizada falla y no aprovisiona.
9. Dos intentos simultáneos (race condition) de aprovisionamiento no crean tenants ni administradores duplicados gracias al lock o idempotencia.
10. Una falla de red después de crear el tenant, pero antes de enviar el enlace de activación, permite recuperación segura sin duplicar el tenant.
11. Un usuario o tenant protegido (ej. S'Narai, ID=2) no puede ser sobrescrito ni mutado por este flujo.
