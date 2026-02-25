# 🔗 Pandoras Data Contract

**Core → Edge API → Telegram Mini App**  
*Status: FINAL · Alpha-ready*

---

## 1️⃣ Principios de diseño (no negociables)

1. **Core es el Source of Truth**
   * Telegram **no define reglas**
   * Telegram **no interpreta lógica**
   * Telegram **solo renderiza y ejecuta**

2. **Edge API = Adaptador + Cache**
   * Traduce Core → UX-friendly
   * Añade contexto del usuario (hasAccess, balances, etc.)
   * Ejecuta acciones delegadas (relayer)

3. **Mini App = Render + Acción**
   * Nunca asume contratos
   * Nunca hardcodea artefactos
   * Nunca calcula permisos

---

## 2️⃣ Core → Edge

### 📦 DTO: `CoreProjectDTO`
Este es el **contrato que el Core debe exponer** (REST o GraphQL).

```ts
// Core → Edge
export interface CoreProjectDTO {
  id: string;                 // UUID Core
  slug: string;
  name: string;
  description: string;

  category: string;           // enum: REAL_ESTATE | TECH | AGRI | etc
  status: 'DRAFT' | 'LIVE' | 'PAUSED';

  version: number;            // protocolVersion
  pageLayoutType?: 'DEFAULT' | 'PREMIUM' | 'GOVERNANCE';

  visuals: {
    logoUrl?: string;
    coverPhotoUrl?: string;
  };

  metrics: {
    apr?: string;
    tvl?: string;
  };

  access: {
    type: 'LICENSE' | 'KEY';
    licenseContractAddress: string;
    chainId: number;
    gasPolicy: 'SPONSORED' | 'USER_PAYS'; // ← YA decidido: SPONSORED
    price: 'FREE';
  };

  artifacts: Array<{
    id: string;
    type: 'ERC20' | 'NFT' | 'POINTS';
    name: string;
    symbol: string;
    contractAddress?: string;
    unlockRule: {
      requiresAccess: boolean;
      phase: number;
    };
  }>;

  flags?: {
    isFeatured?: boolean;
  };

  updatedAt: string;
}
```

✅ **Nota clave**
* **Pandoras Key** entra aquí como `access.type = 'KEY'`
* Telegram **NO decide** si algo es Key o License → solo renderiza

---

## 3️⃣ Edge API (Adaptación Telegram-aware)

### 📦 DTO: `EdgeProtocolDTO`
Este es **el DTO real que YA estás usando en Telegram**, formalizado.

```ts
// Edge → Mini App
export interface EdgeProtocolDTO {
  id: string;
  slug: string;
  name: string;
  description: string;

  category: string;
  status: string;

  apr?: string;
  tvl?: string;

  logoUrl?: string;
  coverPhotoUrl?: string;

  pageLayoutType?: string;
  isFeatured?: boolean;

  // 🔐 Usuario-contextual
  hasAccess: boolean;

  access: {
    type: 'LICENSE' | 'KEY';
    isFree: true;
    gasless: true;
  };

  artifacts: Array<{
    type: string;
    name: string;
    symbol: string;
    unlocked: boolean;
  }>;
}
```

🔎 **De dónde sale cada campo**

| Campo | Fuente |
| :--- | :--- |
| metadata | Core |
| artifacts | Core |
| hasAccess | Edge (on-chain + DB) |
| unlocked | Edge (reglas Core + estado usuario) |

---

## 4️⃣ Edge API – Endpoints finales (contrato cerrado)

### 🔹 Listado (Home / Explore)
`GET /protocols` -> `EdgeProtocolDTO[]`

### 🔹 Detalle de protocolo
`GET /protocols/:slug` -> `EdgeProtocolDTO`

### 🔹 Activar acceso (GASLESS)
`POST /protocols/:id/access-card`
* Ejecuta: Relayer, Mint `mintTo(user.wallet)`, Idempotencia, Auditoría.
* Response: `{ status: 'SUCCESS' | 'PENDING' | 'ALREADY_OWNED', txHash?: string }`

---

## 5️⃣ Mini App – Contrato asumido (Frontend)

### 🔹 Discover.tsx
* **NO calcula permisos**. Usa `hasAccess`, `isFeatured`, `coverPhotoUrl`.

### 🔹 ProtocolDetail.tsx
* **No lee blockchain**. No usa thirdweb read. Solo `protocol.hasAccess` y `protocol.artifacts[].unlocked`.

---

## 6️⃣ Pandoras Key (ajuste final)
* **No entra en Telegram Alpha**. Vive en plataforma web.
* Mismo DTO, pero `access.type = 'KEY'`. Telegram ignora o muestra badge: “Disponible en Plataforma”.

---

## 7️⃣ Roadmap (para Mini App + Web)

### 📍 Alpha (Ahora)
* Protocol Discovery
* Access Cards gasless
* Artefactos bloqueados/desbloqueados
* PBOX Testnet
* Activity Drawer

### 📍 Beta
* Artefactos interactivos
* Governance lite
* Misiones por protocolo
* Badges dinámicos

### 📍 Mainnet
* Artefactos transferibles
* Revenue-sharing
* Governance real
* Marketplace interno
