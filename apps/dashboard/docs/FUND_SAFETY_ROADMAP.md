# Fund Safety & Security Roadmap

## Estado Actual (Baseline Audit)

| Componente | Estado | Riesgo |
|---|---|---|
| Recaudación (purchases) | ✅ Producción | Bajo |
| Creación DAO Members | ✅ Producción | Bajo |
| Distribución USDC (ledger) | ✅ Producción (off-chain) | Medio |
| Retiro USDC a holders | ❌ No existe | CRÍTICO |
| Redemption PBOX | ⚠️ Sin auth | ALTO |
| Claim actividades | ⚠️ Sin verificación submission | ALTO |
| Auth admin (x-wallet-address) | ⚠️ Sin firma | ALTO |
| Exchange rate PBOX | ⚠️ Hardcodeado 0.01 | Medio |
| userBalances sin FK | ⚠️ Riesgo orphan data | Bajo |

---

## Fase 1 — Seguridad Inmediata (IMPLEMENTADA)

- [x] Claim route: verificar submission `approved` antes de otorgar reward
- [x] Redemption route: auth con firma wallet
- [x] Distribute route: verificar saldo on-chain del treasury antes de distribuir
- [x] Rate limiting en rutas de fondos (withdraw, redemption, distribute, claim)
- [x] Exchange rate configurable via env var (`PBOX_EXCHANGE_RATE`)
- [x] Atomicidad redemption: DB deduction envuelta en manejo de errores con rollback

## Fase 2 — Movimiento de Fondos (IMPLEMENTADA)

- [x] Tabla `withdrawals` (DB schema + migration)
- [x] Tabla `distribution_batches` (DB schema + migration)
- [x] Ruta `POST /api/dao/withdraw` — Holder retira USDC a su wallet
- [x] Ruta `POST /api/dao/withdraw/admin` — Admin ejecuta distribución masiva on-chain
- [x] Treasury lib: helpers para USDC (transfer, balanceOf, approve)
- [x] Treasury lib: verificación de saldo antes de transferencias

## Fase 3 — Gobernanza de Fondos (PENDIENTE)

- [ ] Safe multi-sig: treasury como Gnosis Safe en vez de EOA
- [ ] Propuesta on-chain para aprobar distribución de fondos
- [ ] Límites de retiro por holder (max amount, cooldown)
- [ ] Notificaciones de retiro/distribución (Discord, Telegram)
- [ ] Dashboard admin UI para aprobar retiros grandes

## Fase 4 — Producción Mainnet (PENDIENTE)

- [ ] Migrar rate limiting in-memory → Redis (Upstash) para serverless
- [ ] Auditoría externa de contratos treasury
- [ ] Stress test: 1000 holders retirando simultáneamente
- [ ] Monitoreo de balances treasury + alertas de saldo bajo
- [ ] FK en userBalances → users (migración)

---

## Estrategia de Retiro/Depósito

### ¿A dónde se retiran los fondos?

```
Treasury del proyecto (treasuryAddress)
    ↓
USDC contract (Base Mainnet: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
    ↓
Holder wallet (walletAddress del dao_member)
```

Cada proyecto tiene su propia wallet treasury (`projects.treasuryAddress`).
Los holders retiran su porción proporcional de USDC desde ese treasury a su wallet personal.

### ¿Cómo se retiran?

1. **Distribución manual (admin):** Admin distribuye X USDC entre holders →
   `POST /api/v1/projects/[projectId]/admin/distribute`
   - Actualiza `userBalances.usdcBalance` (ledger off-chain)
   - NO mueve fondos on-chain (solo contabilidad)

2. **Retiro individual (holder):** Holder retira su balance →
   `POST /api/dao/withdraw`
   - Verifica que `userBalances.usdcBalance ≥ amount`
   - Verifica que treasury tiene suficiente USDC on-chain
   - Call `USDC.transfer(holder, amount)` desde la wallet del protocolo
   - Crea registro en `withdrawals` table
   - Rate limit: 1 retiro cada 24h por wallet por proyecto

3. **Retiro masivo (admin):** Admin ejecuta distribución on-chain →
   `POST /api/dao/withdraw/admin`
   - Calcula shares pro-rata igual que distribute
   - Ejecuta transfers en lote (evita gas griefing)
   - Crea registro en `distribution_batches`

### Seguridad

- **Auth:** EIP-712 signature verification en rutas de fondos
- **Rate limit:** 5 req/min por wallet en withdraw, 1 req/min en redemption
- **Sanitize logs:** No se registran private keys ni secretos
- **Atomicidad:** DB update y on-chain tx en bloque con rollback
- **Verificación saldo:** Siempre se verifica balance on-chain antes de transferir

---

## Variables de Entorno Requeridas

```env
# Treasury / USDC
USDC_MAINNET_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
USDC_SEPOLIA_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
TREASURY_PRIVATE_KEY=0x...  # Solo si se separa del PROTOCOL_ADMIN
PBOX_EXCHANGE_RATE=0.01

# Rate Limiting (Redis recomendado en producción)
REDIS_URL=redis://...
RATE_LIMIT_WITHDRAW=5
RATE_LIMIT_WITHDRAW_WINDOW_MS=60000

# Límites de transacción
WITHDRAW_MIN_AMOUNT=1
WITHDRAW_MAX_AMOUNT=10000
WITHDRAW_COOLDOWN_HOURS=24
```

---

## Progreso de Implementación

| Item | Estado | PR/Branch |
|---|---|---|
| Schema withdrawals + distribution_batches | ✅ Listo | `main` |
| Treasury lib (USDC helpers) | ✅ Listo | `main` |
| POST /api/dao/withdraw | ✅ Listo | `main` |
| POST /api/dao/withdraw/admin | ✅ Listo | `main` |
| Fix redemption auth | ✅ Listo | `main` |
| Fix claim submission check | ✅ Listo | `main` |
| Fix distribute treasury check | ✅ Listo | `main` |
| Rate limiting (withSecurity) | ✅ Listo | `main` |
| Exchange rate env var | ✅ Listo | `main` |
| Documentation | ✅ Listo | `main` |
| Migration SQL | ✅ Listo | `main` |
