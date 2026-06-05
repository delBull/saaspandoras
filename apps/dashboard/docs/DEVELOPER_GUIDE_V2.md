# 🛠 Pandora Growth OS: Developer Integration Guide (v2.0)

This guide provides the technical specifications for integrating Pandora's Growth Infrastructure into external landing pages and custom dApps.

## 🔐 Authentication
All public API requests require an **API Key** (`pk_grow_...`) and the project **Slug**.

- **Header:** `x-api-key: YOUR_PUBLIC_KEY`
- **Query Param (Fallback):** `?apiKey=YOUR_PUBLIC_KEY`

---

## 🛰 REST API Reference

### 1. Protocol Configuration
`GET /api/public/project/[slug]/config`

Retrieves the structural setup of the growth protocol.

**Attributes:**
- `project.contractAddress`: The main utility/license contract.
- `project.chainId`: Network ID (e.g., 137 for Polygon).
- `config.tiers`: Array of benefits levels with `artifactCountThreshold`.
- `config.phases`: Active distribution/sale phases.

### 2. Real-time State & Progression
`GET /api/public/project/[slug]/state?wallet=0x...`

Retrieves live metrics and the specific progression of a user.

**Attributes:**
- `currentSupply`: Global count of artifacts issued.
- `progression.userArtifactCount`: Current balance of the provided wallet.
- `progression.currentTier`: Details of the user's earned tier.
- `progression.nextTier`: Requirements for the next level.
- `progression.unlockDelta`: Exact amount needed to level up.
- `metrics.urgency`: Suggestion level ("low", "medium", "high").

### 3. Purchase Simulator
`POST /api/public/project/[slug]/simulate`

Predicts the progression state after a hypothetical purchase.

**Body:**
```json
{
  "wallet": "0x...",
  "amount": 10
}
```

---

## 💀 Headless Mode (Custom UI)

If you don't want to use our pre-built widget, you can build a fully custom experience using the attributes above.

**Example: Level Up Suggestion**
```javascript
const res = await fetch('/api/public/project/my-protocol/state?wallet=0x123...', {
  headers: { 'x-api-key': 'pk_grow_...' }
});
const { progression } = await res.json();

if (progression.unlockDelta > 0) {
  showToast(`You are only ${progression.unlockDelta} artifacts away from ${progression.nextTier.name}!`);
}
```

---

## 🧩 Widget Injection (No-Code)
The simplest way to integrate. Handles tracking and UI automatically.

```html
<script 
  src="https://pandoras.io/js/growth-v2.js" 
  data-project-id="YOUR_PROJECT_ID" 
  async
></script>
```

---

## 🔄 White-Label Redirection (Zero Friction)

To maintain a seamless brand experience, you can specify an `origin` parameter. If provided, the Pandoras checkout will show a "Return to [Your Project]" button upon success, redirecting the user back to your native portal.

### Via SDK Data Object:
```javascript
PandorasGrowth.openCheckout({
  slug: 'my-project',
  tier: 'founder',
  origin: window.location.origin // Dynamic redirection back to your site
});
```

### Via Data Attributes:
```html
<button 
  data-pd-checkout-slug="my-project" 
  data-pd-checkout-tier="founder"
  data-pd-checkout-origin="https://my-app.com/portal"
>
  Buy Now
</button>
```

**Behavior:** 
When `origin` is detected, the default "Go to Dashboard" button in Pandoras is replaced with a customizable redirect button that returns the user to the specified URL.
