# AGENTS.md - Pandoras Growth OS (Dashboard / Backend)

## Contexto del Proyecto

**Pandoras Growth OS** es el motor central que alimenta todo el ecosistema. Gestiona proyectos, compras, gobernanza, distribución de yield y APIs externas para TMA y widgets whitelabel.

---

## Repositorios en Scope

| Repositorio | Rol |
|---|---|
| `saaspandoras/apps/dashboard` | Pandoras Growth OS Backend + Dashboard Admin |
| `pandoras_tgApp/pandoras-telegram-app` | Telegram Mini App (TMA) standalone |
| `pandoras_tgApp/pandoras-edge-api` | Edge API que conecta TMA con Core |

---

## Stack Tecnológico

- **Framework:** Next.js 15 (App Router), TypeScript
- **Runtime:** Node.js (serverless functions en Vercel)
- **DB:** PostgreSQL via Neon (serverless, pooler endpoint recomendado)
- **ORM:** Drizzle ORM con postgres-js
- **Blockchain:** thirdweb SDK (Base Sepolia, Base Mainnet)
- **Auth:** Wallet-based + API Keys (integrationClients table)

---

## Alias de import críticos

```typescript
import { db } from '@/db';                          // Drizzle ORM → NeonDB
import { IntegrationKeyService } from '@/lib/integrations/auth';  // API key validation
import { projects, daoMembers, purchases, ... } from '@/db/schema';
```

---

## Fuentes de Verdad del Ecosistema

```
┌─────────────────────────────────────────────────────────┐
│                    PANDORAS GROWTH OS                     │
│                    (saaspandoras / dashboard)             │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐     │
│  │  projects   │  │ daoMembers   │  │ purchases     │     │
│  │  (phases,   │  │ (voting      │  │ (completed,   │     │
│  │   config)   │  │  power)      │  │  on_hold)     │     │
│  └─────────────┘  └──────────────┘  └───────────────┘     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐     │
│  │userBalances│  │ govProposals │  │integration_clients│   │
│  │(USDC yield) │  │              │  │ (API keys)     │     │
│  └─────────────┘  └──────────────┘  └───────────────┘     │
└─────────────────────────────────────────────────────────┘
           │
           ├──→ TMA (pandoras-telegram-app) ──→ Edge API ──→ Core
           ├──→ S'Narai Portal (Narai/web) ──→ Widget
           └──→ Widgets whitelabel (proyectos externos)
```

---

## Endpoints Externos (para TMA, Portal, Widgets)

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/public/project/[slug]/state` | Feed principal para Portal. Devuelve: projectState, userBalance, userVotingPower, userRewards, certificates, governance, metadata, holdersCount, treasuryDisplay |
| GET | `/api/v1/projects/[slug]/analytics` | Fases con stats reales: tokensSold, remainingTokens, percent, isSoldOut, status (SOLD_OUT/ACTIVE/UPCOMING) |
| GET | `/api/v1/external/governance/proposals?protocolId=X` | Lista de propuestas de gobernanza filtradas por protocolo |
| GET | `/api/v1/external/governance/proposals/[proposalId]?protocolId=X` | Detalle de propuesta individual |
| GET | `/api/v1/external/users/[wallet]/portfolio` | Portfolio del usuario + votingPower + claimableRewards |
| GET | `/api/v1/external/users/[wallet]/purchases` | Historial de compras (dual lookup: users + marketingIdentities) |

---

## Tablas DB Críticas

| Tabla | Descripción |
|---|---|
| `projects` | ID=2, slug='snarai', chainId=11155111 (Sepolia), licenseContractAddress=0x7D426... |
| `integration_clients` | API keys para external access. Client ID 3ec55444 → pk_test_b277293448... (S'Narai staging) |
| `dao_members` | votingPower, artifactsCount por wallet/proyecto. Se sincroniza desde approve route |
| `purchases` | Status: 'completed', 'processing', 'on_hold', 'pending', 'rejected', 'failed' |
| `user_balances` | usdcBalance, pboxBalance para distribución de yield |
| `governance_proposals` | Propuestas on-chain con proposalId, status, forVotes, againstVotes, governorAddress, chainId |
| `users` | Usuarios con walletAddress |
| `marketing_identities` | Fallback para purchases lookup por wallet cuando no hay match en users |

---

## Flujo de Inversión End-to-End

```
1. Fast Lane (CLABE/SPEI)
   Purchase Intent → createPurchaseIntent() → ON_HOLD purchase
   
2. Admin Approve
   Admin dashboard → approve route → dao_members sync (onConflictDoUpdate) + agreementHash SHA-256
   
3. Mint On-Chain
   approve route → RelayerService.mintLicense → token mint en contracts
   
4. Distribución de Yield
   Admin → distribute route → pro-rata USDC → userBalances.usdcBalance
   
5. Portal / TMA visibility
   state/route.ts → lee dao_members + purchases + userBalances → alimenta Portal/TMA
```

---

## Notas de Seguridad

- API keys registrados en `integration_clients` con SHA-256 hash
- Environment enforcement: pk_live_ solo conecta a production, pk_test_ solo a staging
- Secrets en `.env` (gitignored), nunca en código
- La wallet se persiste en localStorage en los frontends (Narai y TMA)
- TxHash de mint no se persiste aún ( pendiente fix del backlog)

---

## Problemas Conocidos

### 1. Cold Start NeonDB en Vercel (RESUELTO PARCIALMENTE)
- Staging tiene cold start severos. Homepage funciona (no toca BD), API routes se cuelgan
- Solución: usar Neon Pooler endpoint (`-pooler` suffix en hostname)
- Verificar: `curl --max-time 10 "https://staging.dash.pandoras.finance/api/public/project/snarai/state?wallet=..."`
- Si falla, hacer redeploy en Vercel dashboard

### 2. ERR_NETWORK_CHANGED en navegador
- No es error de código — red WiFi cortando brevemente
- Probar en modo incógnito

### 3. holdersCount fallback
- state/route.ts toma daoMembers primero, luego on-chain si disponible, pero no tiene fallback a purchases
- Pendiente: agregar cuenta de purchases con status 'completed' como fuente terciaria

---

## Scripts Útiles

```bash
# Registrar API key de S'Narai en staging
node scripts/register-snarai-staging-key.mjs

# Diagnóstico de Narai
node scripts/diagnose-narai.ts

# Verificación de harmonización
node scripts/verify-harmonization.ts
```

---

## Dónde Continuar (Token ~70% usado)

La siguiente sesión debe continuar con:

1. **FIX: state/route.ts** → Agregar fallback holdersCount con purchases como fuente terciaria
2. **FIX: Narai/web/actions.ts** → getProjectStats() consume `/api/v1/projects/snarai/analytics`
3. **FIX: Narai/web/InvestmentGrid.tsx** → Fases dinámicas del API real
4. **FIX: Narai/web/HeroV3.tsx** → CTA inteligente (Fast Lane modal si no hay fase activa)
5. **FIX: Narai/web/PortalView.tsx** → Botón Telegram sutil (pendiente URL del bot)