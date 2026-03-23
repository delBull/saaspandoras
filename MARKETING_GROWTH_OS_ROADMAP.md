# Pandoras Growth OS (Marketing CRM 2.0) - Roadmap

This document serves as the official reference for the evolution of the Pandoras Marketing & CRM system into a multi-tenant "Growth OS" for internal and external protocols.

## 🎯 Vision
Transform Pandoras from a simple dashboard into a **Growth Infrastructure** for Web3 projects.
- **Identity Layer**: Unified user data across multiple protocols.
- **Intent Engine**: Lead scoring and behavior analysis.
- **Distribution Hub**: Smart routing of leads to Discord/Email/CRM.

---

## 🏗️ Architectural Principles
- **Isolation**: Work is performed in the `feature/marketing-growth-os` branch.
- **Logical Separation**: Marketing logic resides in isolated service modules.
- **DB Schema**: Leads and events use specific table prefixes (`marketing_`) to avoid mixing with Core data.
- **Performance**: High-traffic ingestion points (Lead Registration API) leverage Edge/Serverless environments.

---

## 🗓️ Phase 1: MVP & Narai Whitelisting [COMPLETED]
**Goal**: Enable the first external protocol (Narai) to collect whitelist leads via API.

- [x] **Infrastructure**:
    - [x] Create `marketing_leads` table (Project-aware). [x]
    - [x] Create `marketing_lead_events` table (Journey tracking). [x]
- [x] **API Gateway**:
    - [x] Endpoint: `POST /api/v1/marketing/leads/register`. [x]
    - [x] Auth: `x-api-key` validation (via `integration_clients`). [x]
    - [x] Anti-spam & Rate limiting. [x]
- [x] **Dashboard Integration**:
    - [x] Dedicated "Growth OS" sub-tab (Independent from Newsletter). [x]
    - [x] "GROWTH OS" pulsing visual identifiers in protocol list. [x]
    - [x] Multi-tenant project filtering and intent metrics. [x]
- [ ] **Distribution**:
    - [ ] Discord webhook notifications (Configurable per project).

---

### Phase 4.6: AI & Widget Autonomy [COMPLETED 🚀]
- [x] **Cost Optimization**: Migration to `gpt-4o-mini` and prompt engineering.
- [x] **Global Widget**: Support for `projectId: "external"` with auto-detection via `origin`.
- [x] **API Resilience**: Refactored registration with TS type-safety and Drizzle upserts.

---

### Phase 5: Pandoras Core Integration (Identity & Rewards) [COMPLETED 🚀]
**Goal**: Turn anonymous leads into loyal Pandoras Ecosystem users.

- [x] **Multi-factor Identity Resolution**: 
    - Linking `marketing_leads` to the `users` table via Email, Wallet, and Fingerprint. [x]
- [x] **Deterministic Identity Hashing**:
    - Created `IdentityService` for secure and private deduplication via `identity_hash`. [x]
- [x] **Idempotent Reward Engine**:
    - Implemented `RewardEngine` with `marketing_reward_logs` to prevent double-dipping. [x]
- [x] **Asynchronous Reward Sync**:
    - Decoupled reward processing from login to maintain performance. [x]
- [x] **"Surprise & Delight" UX**:
    - Implemented Dashboard welcome modal for converted leads. [x]

---

### Phase 6: Viral Growth & Affiliates [NEXT 🏗️]
**Goal**: Turn every lead into a growth agent through incentivized sharing.

- [ ] **Referral Parameter Tracking**: 
    - The widget will automatically capture `?ref=` and `?src=` from URLs and store them in the lead metadata.
- [ ] **Viral Post-Signup Screens**: 
    - After registering, the widget shows a unique referral link: *"Invite friends to Narai and earn +50 XP"*.
- [ ] **Affiliate Attribution**: 
    - Automatically link new leads to existing Pandoras users ("The Affiliates").
- [ ] **Tiered Rewards**: 
    - Bonus XP/Credits for the referrer when their referred friend completes a "High Intent" action.

---

### Phase 7: CRM Automations & Developer Experience [IN PROGRESS 🏗️]
**Goal**: Make the system work while you sleep and empower external devs.

- [x] **Developer Portal Core**: API documentation and snippet generator integrated into Growth House. [x]
- [ ] **Smart Telegram Alerts**: Notify protocol owners when a "High Quality Lead" (Score > 85) is captured.
- [ ] **Email Drip Integration**: Auto-sync leads to Mailchimp/Brevo for automated follow-up.

---

### Phase 8: Demand Engine & Instant Execution [COMPLETED 🚀]
- **Market Attack Engine v2.6**: Strategic execution hub with "Close the Loop" capabilities.
- **Launch Panel "Canonical"**: 60-second execution via automated draft creation (`createCampaign`).
- **Urgency Engine**: "TODAY'S EXECUTION" daily tracker for protocol operators.
- **Auto-Launch Mode**: One-click generation + persistence + redirect to marketing dashboard.
- [x] **Content Sections**: Dedicated areas for Monetization, Content Nurturing, and Demand Engine. [x]
- [x] **Persistence Layer**: Real integration with Drizzle/Server Actions for campaign drafts. [x]

---

### Phase 8.1: "Canon" Architecture & Performance V3 [COMPLETED 🚀]
- [x] **Unified Schema**: Consolidated `campaigns` table with `source` field for Demand/WA/Manual.
- [x] **Content DNA**: Implemented `demand_drafts` with strategic attributes (Angle, Emotion, Mechanism).
- [x] **High-Performance Telemetry**: Denormalized `campaign_stats` for instant dashboard loading.
- [x] **ROI Tracker**: Advanced `demand_events` for conversion value and attribution tracking.
- [x] **Performance Score**: Real-time algorithmic scoring of campaign efficiency.

---

### Phase 9: The "Auto-Scaling" Intelligence [FUTURE 🚀]
**Goal**: Transition from manual optimization to autonomous protocol growth.

- [ ] **Autonomous Budget Routing**: 
    - Automatically increase allocation to campaigns with `Score > 90`.
    - Pause or archive campaigns with `Score < 30` and high spend.
- [ ] **DNA Mutation**: 
    - The engine automatically generates new drafts by mixing "Winning Patterns" (e.g., Scarcity + Authority + Access).
- [ ] **Market Prediction**: 
    - Forecast lead volume based on historical DNA performance data.
- [ ] **DAO-Incentivized Scaling**: 
    - Link campaign performance directly to PBOX rewards for the community agents who generated the content.

---

# 📖 Guía de Integración para Desarrolladores (SDK v1.0)

El Growth OS Widget es un componente "Plug-and-Play" diseñado para capturar leads de alta calidad con mínima fricción.

### 1. Instalación Básica
Pega este script justo antes del cierre de la etiqueta `</body>`:
```html
<script 
  src="https://pandoras.app/widget.js" 
  data-project-id="TU_PROJECT_ID" 
  data-api-key="TU_API_KEY"
></script>
```

### 2. Referencia de Atributos (`data-*`)

| Atributo | Valor | Descripción |
| :--- | :--- | :--- |
| `data-project-id` | `number` \| `"external"` | ID del proyecto en Pandoras. Usa `"external"` para auto-detección. |
| `data-api-key` | `string` | Tu clave de integración (pk_grow_...). |
| `data-color` | `Hex Color` | Color de acento para botones y progreso (Ej: `#7c3aed`). |
| `data-theme` | `"light"` \| `"dark"` | Tema visual del modal (Default: `light`). |
| `data-position` | `"right"` \| `"left"` | Posición del botón flotante (Default: `right`). |
| `data-title` | `string` | Título del modal (Ej: `"Narai Whitelist"`). |
| `data-subtitle` | `string` | Descripción debajo del título. |
| `data-button-text` | `string` | Texto del botón flotante. |
| `data-success-url` | `URL` | URL a la que redirigir tras un registro exitoso. |

### 3. Ejemplo: Configuración Narai (Dark Mode + Left)
```html
<script 
  src="https://pandoras.app/widget.js" 
  data-project-id="external" 
  data-api-key="pk_grow_live_..."
  data-theme="dark"
  data-position="left"
  data-color="#3b82f6"
  data-title="Narai Whitelist"
  data-subtitle="Únete a la nueva era de liquidez"
  data-button-text="🎟 Entrar a Whitelist"
  data-success-url="https://narai.finance/welcome"
></script>
```

### 5. Integración Avanzada (Public JS API)

Si el proyecto ya cuenta con su propio modal, formulario o landing personalizada (ej: Narai), puede usar nuestra API global expuesta por el SDK. Esto permite enviar leads al Growth OS manteniendo el control total de la UI.

#### `window.PandorasGrowth.registerLead(data)`
Envía un nuevo lead al sistema de tracking de Pandoras.

**Parámetros (Objeto `data`):**
- `email` (string, Requerido): Email del usuario.
- `name` (string, Opcional): Nombre completo.
- `phoneNumber` (string, Opcional): WhatsApp o teléfono de contacto.
- `walletAddress` (string, Opcional): Dirección de wallet Web3.
- `intent` (string, Opcional): Propósito (`whitelist`, `invest`, `early_access`).
- `metadata` (object, Opcional): Datos adicionales de tracking.

**Ejemplo de integración:**
```javascript
// Captura el lead desde un formulario personalizado
const onMySubmit = async () => {
  const res = await window.PandorasGrowth.registerLead({
    email: 'user@narai.finance',
    name: 'Marco Antonio',
    phoneNumber: '+521234567890',
    intent: 'whitelist'
  });
  
  if (res.success) {
    alert('¡Bienvenido a la Whitelist de Narai!');
  }
};
```

---

## ⚠️ Registro de Riesgos & Mitigación
- **Spam**: Mitigado por Token de API + Rate Limiting + Fingerprinting.
- **Límites de Vercel**: Mitigado por Caché de IA y funciones Edge ligeras.
- **Privacidad**: Gestión mediante capa de consentimiento explícito (`consent: true`).
