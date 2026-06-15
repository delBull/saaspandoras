# Go-to-Market Plan: Producción (Base Mainnet)

**Aviso de Entornos**: Se mantiene una separación estricta de entornos (Local, Staging, Producción). Bajo ninguna circunstancia se debe mutar, romper o redirigir tráfico de staging hacia producción. Todos los servicios de backend de producción (Railway, Telegram Bots) serán instancias completamente nuevas y aisladas.

## Estrategia de Entornos

| Entorno | Chain | Base de Datos (Neon) | Backend (Railway) | Frontend (Vercel) | Telegram Bot |
|---------|-------|----------------------|-------------------|-------------------|--------------|
| **Local** | Sepolia (11155111) | Neon DB local / Local PG | N/A | N/A | N/A |
| **Staging** | Base Sepolia (84532) | Neon DB staging (`ep-cool...`) | Railway staging project | `staging.dash...` | Bot staging |
| **Producción** | Base Mainnet (8453) | **Neon DB main (¡Ya existe!)** | Railway producción (**nuevo proyecto**) | `dash...`, `snarai.com` (¡Ya en Vercel!) | Bot producción **nuevo** |

*(Nota: El schema de la base de datos debe ser exactamente el mismo en los 3 entornos. Las migraciones garantizan la paridad).*

---

## Fase 0: Fundaciones de Producción

### 0.0 DNS y Dominios
- Los frontends ya están en Vercel y ya responden en `dash.pandoras.finance` y `snarai.com`.
- [ ] Agregar registros SPF, DKIM y **DMARC** (`_dmarc.pandoras.finance`) para correos de Resend. (¡Obligatorio para evitar caer en Spam en Gmail/Yahoo!).

### 0.0.1 Remover URLs hardcodeadas de Railway staging en el código
**⚠️ CRÍTICO**: Hay 4 archivos con URLs de Railway staging hardcodeadas que fallarán en producción al migrar la API a main.
Los archivos a modificar y reemplazar con variable de entorno (ej: `process.env.NEXT_PUBLIC_API_CORE_URL || 'https://api.pandoras.finance'`):
1. `apps/dashboard/src/app/actions/telegram.ts` (líneas 23, 73)
2. `apps/dashboard/src/app/api/profile/route.ts` (línea 67)
3. `apps/dashboard/src/app/api/admin/global-config/route.ts` (línea 34)
4. `apps/dashboard/src/components/admin/ApiKeysTab.tsx` (líneas 67, 77)
5. `apps/dashboard/src/components/admin/AdminSettings.tsx` (líneas 107, 403)

### 0.1 Neon DB — Sincronizar Main DB (¡Ya existe!)
La base de datos Main de Neon ya existe y está conectada en Vercel. 
- [ ] Asegurar que la configuración de la conexión (Pooled vs Unpooled) esté correcta en Vercel.
- [ ] Ejecutar migraciones (`drizzle-kit push` o `migrate`) contra la DB Main para garantizar que el schema es idéntico al de Staging y Local.

### 0.2 Inyectar S'Narai a la DB Mainnet (Migración de Proyecto)
Actualmente el proyecto S'Narai vive en la DB de staging. Para que el frontend en Main funcione bien, hay que clonar ese proyecto:
- [ ] Inyectar el proyecto actual de staging a la DB Main (puede ser un script manual o copiado SQL) para que la data, settings del Growth OS, y config sean exactamente iguales.
- [ ] Una vez inyectado, **ajustar las fases de inversión y precios** en el dashboard de Mainnet para que coincidan con la configuración de los Smart Contracts desplegados en Base Mainnet.

### 0.3 Resend — Verificar reputación
- [ ] Confirmar que `noreply@pandoras.finance` está verificado en Resend.
- [ ] **DMARC**: Verificar que exista un registro TXT para `_dmarc` con valor `v=DMARC1; p=none;`.

### 0.4 Error Tracking & RPC
- [ ] Crear proyecto Sentry para `pandoras-prod` (opcional pero recomendado).
- [ ] Contratar/Configurar Alchemy Growth, Infura Base o QuickNode para evitar rate limits en mainnet.

---

## Fase 1: Smart Contracts en Base Mainnet

### 1.1 Desplegar contratos en Base
Usar Hardhat con network `base-mainnet`. 

**¡Importante! (Gnosis Safe)**: El ownership de los contratos y la tesorería (`ROOT_TREASURY_ADDRESS`) debe ser una cartera multifirma (Gnosis Safe en Base) para máxima seguridad.

- [ ] Validar en Basescan que los contratos estén verificados y apunten a la USDC oficial de Base (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`).

### 1.2 Configurar Thirdweb en Producción
- [ ] Crear API Key de Thirdweb exclusiva para producción (dominios: `dash.pandoras.finance`, `snarai.com`, `*.railway.app`).
- [ ] Configurar webhooks de Thirdweb para que envíen notificaciones a `https://dash.pandoras.finance/api/webhooks/thirdweb` usando un `THIRDWEB_WEBHOOK_SECRET` que coincida en Vercel.

---

## Fase 2: Railway — Servicios de Producción (Separados)

### 2.1 Crear nuevo proyecto Railway "pandoras-prod"
Se debe mantener el proyecto staging completamente intacto. Se crearán servicios nuevos:

#### Servicio: api-core (Express)
- `PORT=8080`, `NODE_ENV=production`, `CORE_ENV=production`
- `DATABASE_URL`: Neon Main DB Pooler
- `REDIS_URL`: Upstash Redis (nuevo para prod).
- `THIRDWEB_CLIENT_ID`: Producción.
- `JWT_PRIVATE_KEY` / `PUBLIC_KEY`: **NUEVO PAR RSA**. (⚠️ *Nota*: Para evitar que Railway rompa los saltos de línea `\n`, considera guardarlos codificados en Base64).

#### Servicio: deployment-service (Express)
- `DEPLOYER_PRIVATE_KEY`: **NUEVA WALLET** con fondos de ETH en Base Mainnet.
- `BASE_RPC_URL`: Proveedor pagado.

### 2.2 Redis para producción
- [ ] Crear instancia Redis (Upstash) dedicada solo a producción para manejar rate limits efectivos.

---

## Fase 3: Vercel — Adaptar Frontends a Mainnet

Ambos frontends (Dashboard y S'Narai) ya están en Vercel. Lo que falta es **transicionar sus variables de entorno** para que dejen de apuntar a staging y apunten a los nuevos recursos de Mainnet.

### 3.1 Dashboard (saaspandoras)
Ajustar las env vars en Vercel:
- Actualizar contratos al entorno Base Mainnet (Pool, PBOX, Factory, Governance).
- Apuntar la `USDC_MAINNET_ADDRESS` a la de Base.
- Configurar el nuevo bot de Telegram (`TELEGRAM_BOT_TOKEN`) y las keys de Thirdweb.
- **Cambiar la URL de la API/Edge** a que apunte al nuevo proyecto de Railway de Producción, en vez del de staging.

### 3.2 Adaptación Externa de S'Narai (Widget/Portal)
Una vez que la API de producción esté viva y el proyecto S'Narai inyectado en la DB Main:
- Cambiar la variable `NEXT_PUBLIC_PANDORAS_API_URL` en el repo `Narai/apps/web` (en Vercel Producción) de `https://staging.dash.pandoras.finance/api/v1` a la URL real de main `https://dash.pandoras.finance/api/v1`.
- Cambiar el API Key a una generada en la DB Mainnet.
- Desplegar para que el Portal S'Narai consuma la data en vivo de Mainnet.

### 3.3 Telegram Bots y Mini Apps (TMA)
- **Staging**: El bot actual de staging se queda igual para seguir probando nuevas features futuras.
- **Producción**: Crear **NUEVO** bot con BotFather (`/newbot`).
  - **⚠️ IMPORTANTE**: El `initData` de Telegram cambia según el token del bot. Ambos (Vercel y Railway) deben usar el mismo `TELEGRAM_BOT_TOKEN` del nuevo bot de producción para que el Auth de TMA funcione correctamente.

---

## Fase 4: Seguridad y Tareas Previas

### 4.1 Redis y Rate Limiting (Crítico en Vercel)
El rate limiter en memoria (`Map`) de `middleware.ts` es inefectivo en un ambiente serverless. Asegurarse que el middleware está usando el `REDIS_URL` en Vercel para aplicar el límite real.

### 4.2 Cuidado con Vercel Crons
Los endpoints como `/api/cron/process-webhooks` o conciliaciones pueden sufrir de **Timeouts** bajo tráfico intenso en Vercel Serverless (límite normal de 60s). 
- *Acción*: Monitorear. Si sufren timeouts, migrar estos crons para que se ejecuten desde el nuevo ambiente persistente de `Railway`.

---

## Fase 5: Pruebas y Lanzamiento Real

### 5.1 Smoke tests manuales (E2E con Thirdweb 1 USDC)
En Mainnet no hay faucet de pruebas. Para validar verdaderamente la funcionalidad:
- [ ] Verificar que todo despliegue con éxito.
- [ ] Ejecutar el flujo completo de inversión realizando una compra equivalente a **1 USDC** mediante wallet usando **Thirdweb**. (Solo las transferencias bancarias seguirán el flujo manual referenciado).
- [ ] Validar que se haga el charge on-chain, se dispare el webhook de Thirdweb, el `AllowanceController` haga lo suyo, y se reflejen los balances y el NFT correctamente en el Portal S'Narai de producción.

### 5.2 Staging Intacto para el Futuro
- [ ] Confirmar que el Railway Staging, Bot Staging y DB Staging no fueron interrumpidos ni manchados con datos de producción.
- [ ] Las nuevas features (y la QA) se siguen desarrollando y probando contra Staging primero.

---
## Resumen del Entregable
- Un **Pipeline de Producción 100% independiente** (Base Mainnet, Neon Main, Railway Prod, Telegram Bot Prod).
- El **Dashboard** y **S'Narai** conectados a la nueva API consumiendo los contratos reales de Base.
- **Zero Downtime** para el ambiente de Staging.
