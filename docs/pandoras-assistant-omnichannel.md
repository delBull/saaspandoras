# Manual de Estrategia e Integración Omnicanal — Pandoras Assistant / Hermes OS

Este documento define la arquitectura y el plan de ejecución para desplegar a **Hermes OS** como el agente comercial omnicanal nativo de **Pandoras Growth OS** en **WhatsApp y Telegram**, orientado a convertir leads que ya probaron la plataforma pero no han completado su pago.

---

## 🎯 1. Visión y Objetivos

- **Monitoreo & Registro**: Guardar automáticamente cada interacción, intención y objeción en las tablas `leads` y `marketing_identities` de NeonDB en el CRM de Pandoras.
- **Seguimiento Automático (Nurturing Omnicanal)**: Disparar mensajes proactivos en WhatsApp/Telegram cuando un prospecto genera un token o prueba el sandbox pero no completa la transacción tras 24h.
- **Demostración de Apalancamiento**: El cliente experimenta de primera mano el poder de Hermes al ser atendido por Hermes durante su proceso de compra de Pandoras.

---

## 📱 2. Requerimientos de Infraestructura & Canales

### A. Canal de Telegram (`@PandorasAssistantBot`)
1. **Requerimiento**: Crear el bot oficial en Telegram a través de `@BotFather`.
2. **Webhook Endpoint (Producción)**:
   ```http
   POST https://dash.pandoras.finance/api/v1/projects/pandoras/bot/webhook
   ```
3. **Mecanismo de Interacción**:
   - Soporta botones inline nativos (`[Ver Demostración]`, `[Hablar con un Humano]`, `[Pagar Licencia]`).
   - Evaluación en tiempo real por `HermesJourneyEngine`.

### B. Canal de WhatsApp Cloud API (`Pandoras Commercial Line`)
1. **Requerimiento**:
   - Cuenta de Meta Business Manager Verificada para Pandoras.
   - Número de teléfono dedicado (ej. WhatsApp Business API).
2. **Webhook Endpoint (Producción)**:
   ```http
   POST https://dash.pandoras.finance/api/v1/projects/pandoras/whatsapp/webhook
   ```
3. **Mecanismo de Interacción**:
   - Plantillas de Mensajes Aprobadas por Meta (*Utility / Marketing Templates*) para iniciar la conversación tras 24h de inactividad.
   - Conversación interactiva fluida basada en el Evidence Layer.

---

## 🗺️ 3. Mapa del Flujo de Conversión (Playbook del Asistente)

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Usuario prueba Sandbox / Registra Access Request en Pandoras OS     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ (Si transcurren 24h sin compra)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. Disparo de Mensaje Proactivo (WhatsApp / Telegram)                  │
│    "Hola [Nombre], soy Hermes de Pandoras OS. Vi que probaste el       │
│     Portal. ¿Tienes alguna duda sobre la Capa de Evidencias o el BOT?" │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. Evaluación de Intención por Hermes OS Kernel                        │
│    - Duda de Precio -> Responde con Evidence Claim [FINANCIAL_CLAIM]   │
│    - Duda Legal -> Responde con Evidence Claim [LEGAL_CLAIM]           │
│    - Intención de Compra -> Dispara Next Best Action (NBA)             │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4. Generación de Checkout Directo                                      │
│    "Perfecto [Nombre]. Puedes activar tu Tenant ahora mismo aquí:       │
│     https://dash.pandoras.finance/growth-os/hermes/portal/login"        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ 4. Registro en el CRM de Pandoras (NeonDB Schema)

Cada mensaje procesado por Hermes Assistant registra automáticamente telemetría en NeonDB:

```sql
-- Ejemplo de inserción en CRM de Pandoras
INSERT INTO marketing_identities (
  email,
  phone_number,
  telegram_handle,
  status,
  metadata
) VALUES (
  'prospecto@ejemplo.com',
  '+525512345678',
  '@prospecto_tg',
  'QUALIFIED_LEAD',
  '{"last_intent": "PRICE_OBJECTION", "nba": "SEND_OFFER_LINK", "channel": "WHATSAPP"}'
);
```

---

## 🛠️ 5. Qué Necesito de Ti para Activar este Flujo

1. **Número de WhatsApp Dedicado**: Confirmar si contamos con una línea corporativa de WhatsApp Business lista en Meta Cloud API (o si requerimos aprovisionar una nueva con Twilio / Meta API).
2. **Bot Token de Telegram**: Crear el bot oficial en `@BotFather` para obtener el Token `TELEGRAM_BOT_TOKEN_PANDORAS`.
3. **Confirmación de Activación**: Una vez nos des luz verde con estas credenciales, activaremos los Webhooks de producción para que Hermes comience el seguimiento omnicanal.
