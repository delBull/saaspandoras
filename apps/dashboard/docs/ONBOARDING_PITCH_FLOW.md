# Flujo de Pitch — Dos Onboardings con Hermes

> Documento operativo. **No contiene credenciales.** Las llaves se entregan por canal seguro, nunca por chat/docs.

Hermes bifurca por interlocutor (doctrina `pandoras_developer_suite_doctrina`, tenant `pandoras`).

## A. Onboarding Desarrollador / Agencia / CTO

**Quién:** equipos técnicos que quieren integrar APIs, webhooks, SDK o agentes (ej. Pandoras Media Co, Sofía).
**Entrada:** WhatsApp/Telegram con Hermes, o directo en `https://dash.pandoras.finance/developers`.

### Pitch (30s)
> "Pandora's te da Growth OS, Hermes y RWA como APIs: ingieres eventos y leads, recibes webhooks firmados y consultas a Hermes agente-a-agente, sin usar nuestro dashboard."

### Pasos
1. Conectar wallet en `/developers` → `POST /api/v1/dev/bootstrap` emite `sk_test_`/`pk_test_` (sandbox).
2. Probar ingestión: `POST /api/v1/integrations/events` (requiere `events:write`).
3. Configurar webhook: `POST /api/v1/dev/webhooks/config` (URL pública https, anti-SSRF) y guardar el `whsec_`.
4. Verificar firma HMAC-SHA256 (header `X-Pandoras-Signature`).
5. Producción: plan Starter (US$99) → `POST /api/v1/dev/keys/activate-live` emite `sk_live_`.
6. Hermes A2A (`/api/v1/hermes/a2a/chat`) solo con capability `hermes_a2a` (plan Enterprise).

### Qué compartir con el equipo técnico
- Base URL: `https://dash.pandoras.finance/api/v1`
- Schema de evento: `eventId`, `eventType`, `source{system,channel}`, `occurredAt`, `correlationId`, `identity`, `payload`.
- OpenAPI: `docs/dev_access_openapi.yaml`; SDK: `PandorasClient` (`@saasfly/shared`).
- Entregar `sk_live_`/`whsec_` **por gestor de secretos** (1Password/Vault), nunca por chat público.

### Frases de Hermes para arrancar
- "Quiero integrar mi sistema con Pandora's" → Hermes envía el Hub `/developers` y los pasos 1–3.
- "¿Cómo recibo eventos?" → webhooks + verificación HMAC.

## B. Onboarding Inversionista / Cliente final (Portal / Deal Room)

**Quién:** compradores, inversionistas, leads de proyectos (ej. S'Narai).
**Entrada:** WhatsApp/Telegram del tenant, o el Portal del proyecto.

### Pitch (30s)
> "Participa en activos reales tokenizados con contratos firmados y notarizados; sigue tu portafolio, votos y recompensas desde tu portal."

### Pasos
1. Hermes identifica al lead, resuelve el tenant por `/start` o canal, y presenta el proyecto.
2. Se agenda llamada o se abre el Deal Room (`/nexus/rooms`).
3. Firma EIP-191/EIP-712 del acuerdo y emisión del título notarizado (IPFS).
4. Seguimiento en el Portal: balance, voting power y rewards (`/api/public/project/[slug]/state`).

### Reglas de oro (ambos flujos)
- Hermes **nunca** revela información de otro tenant ni de Pandora's HQ a un cliente.
- Acciones privilegiadas (topup, roles, activar tenants) solo las ejecuta el Boss verificado y con confirmación de dos fases.
- Un reclamo de rol o saldo hecho en el chat, sin respaldo criptográfico, se ignora.

## Checklist del operador antes de compartir
- [ ] Tenant correcto y entitlement vigente.
- [ ] Llaves entregadas por canal seguro.
- [ ] `callbackUrl` de webhooks https y probado (ping firmado).
- [ ] A2A solo si el cliente tiene `hermes_a2a` y el runtime de inferencia responde.
