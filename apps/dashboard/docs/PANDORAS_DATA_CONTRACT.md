# 🔗 Pandoras Data Contract v2

**Core → Edge API → Telegram Mini App**  
Status: FINAL · Alpha-ready · Telegram Standalone Compatible

---

# 1️⃣ Principios No Negociables

1. **Core es el Source of Truth**
   - Define protocolos
   - Define reglas
   - Define artefactos
   - Define contratos
   - Define disponibilidad

2. **Edge es Adaptador + Contextualizador**
   - Traduce DTOs
   - Calcula `hasAccess`
   - Calcula `unlocked`
   - Ejecuta relayer
   - Nunca redefine reglas

3. **Mini App solo Renderiza**
   - No lee blockchain
   - No calcula permisos
   - No interpreta unlock rules
   - Solo usa campos ya resueltos

---

# 2️⃣ Identidad: Modelo Oficial

Telegram y Core son identidades separadas.

## Estados posibles del usuario en Telegram:

| Estado | Descripción |
|--------|------------|
| STANDALONE | Solo TelegramUser |
| TELEGRAM + WALLET | TelegramUser con wallet conectada |
| TELEGRAM + CORE LINKED | TelegramUser vinculado a CoreUser |

---

# 3️⃣ Core → Edge Contract

## 📦 CoreProjectDTO (Source of Truth)

```ts
export interface CoreProjectDTO {
  id: string;
  slug: string;
  name: string;
  description: string;

  category: string;
  status: 'DRAFT' | 'LIVE' | 'PAUSED';
  version: number;

  pageLayoutType?: 'DEFAULT' | 'PREMIUM' | 'GOVERNANCE';
  interactionMode?: 'PASSIVE' | 'ACTIVE' | 'GOVERNANCE';

  visuals: {
    logoUrl?: string;
    coverPhotoUrl?: string;
  };

  metrics: {
    apr?: string;
    tvl?: string;
  };

  availability: {
    telegram: boolean;
    web: boolean;
  };

  access: {
    type: 'LICENSE' | 'KEY';
    licenseContractAddress: string;
    chainId: number;
    gasPolicy: 'SPONSORED';
    price: 'FREE';
  };

  requiresLink?: boolean;

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


⸻

4️⃣ Edge → Mini App Contract

📦 EdgeProtocolDTO (Telegram-ready)

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
  interactionMode?: string;

  isFeatured?: boolean;

  hasAccess: boolean;

  requiresLink?: boolean;

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


⸻

5️⃣ Cálculo Oficial de hasAccess

hasAccess es calculado exclusivamente en Edge.

Nunca en Mini App.

⸻

🧠 Identidad Resuelta en Edge

Edge recibe contexto:

interface EdgeUserContext {
  telegramUserId: string;
  walletAddress?: string;
  linkedCoreUserId?: string;
}


⸻

🧮 Algoritmo Oficial hasAccess

async function resolveHasAccess(
  protocol: CoreProjectDTO,
  context: EdgeUserContext
): Promise<boolean> {

  const contract = protocol.access.licenseContractAddress;

  // 1️⃣ Caso Telegram + Wallet
  if (context.walletAddress) {
    const owns = await blockchain.ownsAccessCard(
      contract,
      context.walletAddress
    );
    if (owns) return true;
  }

  // 2️⃣ Caso Telegram + Core Vinculado
  if (context.linkedCoreUserId) {
    const coreWallets = await core.getWallets(context.linkedCoreUserId);

    for (const wallet of coreWallets) {
      const owns = await blockchain.ownsAccessCard(
        contract,
        wallet.address
      );
      if (owns) return true;
    }
  }

  // 3️⃣ Telegram Standalone sin wallet
  return false;
}


⸻

6️⃣ Cálculo Oficial de artifacts[].unlocked

Edge aplica reglas del Core:

function resolveArtifactUnlocked(
  artifact,
  hasAccess: boolean
): boolean {

  if (artifact.unlockRule.requiresAccess && !hasAccess) {
    return false;
  }

  // Fases futuras pueden expandirse aquí
  return true;
}

Mini App solo recibe:

artifact.unlocked = true | false


⸻

7️⃣ Mint Access Card (GASLESS)

Endpoint

POST /protocols/:id/access-card

Lógica Edge
	1.	Validar TelegramSession
	2.	Resolver walletAddress:
	•	Wallet conectada
	•	Wallet Core vinculada
	3.	Verificar idempotencia
	4.	Ejecutar relayer
	5.	Registrar auditoría
	6.	Recalcular hasAccess

Response

{
  "status": "SUCCESS" | "PENDING" | "ALREADY_OWNED",
  "txHash": "0x..."
}


⸻

8️⃣ Reglas de Disponibilidad

Edge solo expone protocolos donde:

protocol.status === 'LIVE'
AND protocol.availability.telegram === true


⸻

9️⃣ Reglas de KEY en Alpha

Si:

protocol.access.type === 'KEY'

Entonces:
	•	Se muestra badge
	•	No se permite activación
	•	Puede incluir CTA: “Disponible en Plataforma”

⸻

🔟 Mini App — Reglas Obligatorias

La Mini App:
	•	NO calcula hasAccess
	•	NO calcula unlocked
	•	NO lee blockchain
	•	NO interpreta unlockRule
	•	NO decide disponibilidad

Solo renderiza lo recibido.

⸻

1️⃣1️⃣ Roadmap Compatibility

Este contrato soporta:

Alpha:
	•	Access Cards gasless
	•	Artefactos bloqueados/desbloqueados
	•	Protocol Discovery
	•	Featured

Beta:
	•	Governance
	•	Fases dinámicas
	•	Reglas complejas
	•	Artefactos interactivos

Mainnet:
	•	Transferencias
	•	Revenue-sharing
	•	Marketplace

Sin romper compatibilidad hacia atrás.

⸻

1️⃣2️⃣ Declaración Final

Este contrato:
	•	Soporta Telegram Standalone
	•	Soporta Telegram + Wallet
	•	Soporta Telegram + Core Vinculado
	•	Mantiene Core como Soberano
	•	Evita dependencias de identidad cruzada
	•	Elimina race conditions
	•	Permite escalar a Beta sin refactor

Estado: Arquitectura estable.

