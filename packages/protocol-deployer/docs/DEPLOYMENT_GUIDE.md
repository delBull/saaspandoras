# 🚀 Guía de Despliegue - SCaaS Infrastructure

Esta guía detalla cómo desplegar los contratos "Core" (Singleton) de la plataforma SCaaS en la red principal (Base Mainnet).

## Requisitos Previos

1.  **Wallet de Despliegue**: Asegúrate de que `PANDORA_ORACLE_PRIVATE_KEY` en tu `.env` tenga fondos suficientes en **Base Mainnet** (ETH).
    *   Costo estimado: ~0.02 - 0.05 ETH (dependiendo del gas).
2.  **Variables de Entorno**: Verifica que `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` esté configurado.

## Instrucciones de Despliegue (Mainnet)

Para desplegar el `PandoraRootTreasury` en Base Mainnet, ejecuta el siguiente comando desde el directorio `packages/protocol-deployer`:

```bash
# Navegar al directorio
cd packages/protocol-deployer

# Ejecutar script apuntando a BASE
NETWORK=base bun scripts/deploy-core.ts
```

### Salida Esperada

Si el despliegue es exitoso, verás un output similar a este:

```bash
Using RPC: https://8453.rpc.thirdweb.com/...
🚀 Targeting BASE MAINNET
...
✅ PandoraRootTreasury deployed at: 0x...[NUEVA_ADDRESS]

IMPORTANT: Update your .env or Config with this address!
ROOT_TREASURY_ADDRESS=0x...
```

## Post-Despliegue

1.  **Copiar la Dirección**: Toma la dirección `0x...` que aparece al final.
2.  **Actualizar Vercel/Producción**:
    *   Ve a tu panel de Vercel -> Settings -> Environment Variables.
    *   Actualiza `ROOT_TREASURY_ADDRESS` con la nueva dirección de Mainnet.
    *   Asegúrate de que `NEXT_PUBLIC_CHAIN_ID` esté en `8453` (Base) en el entorno de producción.
3.  **Redeploy Dashboard**: Redeploy tu aplicación Dashboard para que tome los cambios.

## Notas Importantes

*   **Multisig**: En este script de despliegue inicial, los *signers* se configuran por defecto con tu wallet + 2 wallets aleatorias (para dev/test).
*   **Producción Real**: Para un entorno de producción real con seguridad multisig, deberías editar `scripts/deploy-core.ts` antes de correrlo en mainnet para especificar las direcciones reales de los 3-5 signatarios (CEO, CTO, Advisor, etc.) en el array `signers`.

```typescript
// scripts/deploy-core.ts - Lìnea ~80
const signers = [
    "0xRealCEO...",
    "0xRealCTO...",
    "0xRealCFO..."
];
```
