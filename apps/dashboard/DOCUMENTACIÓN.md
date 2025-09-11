# Documentación Técnica del Proyecto: Dashboard de Pandora's Finance

Este documento detalla la arquitectura, estructura de componentes y flujos de trabajo clave de la aplicación del dashboard, construida con Next.js (App Router), TypeScript, Thirdweb y TailwindCSS.

## 1. Estructura del Proyecto

La aplicación sigue la estructura del App Router de Next.js.

```
/
├── app/
│   ├── (dashboard)/                # Grupo de rutas para el layout principal
│   │   ├── layout.tsx              # Layout del dashboard (con Sidebar y NFT Gate)
│   │   ├── page.tsx                # Página principal (Overview)
│   │   └── swap/
│   │       └── page.tsx            # Página de Swap/Exchange
│   ├── layout.tsx                  # Layout raíz (proveedores de contexto)
│   └── globals.css                 # Estilos globales
├── components/
│   ├── sidebar.tsx                 # Barra de navegación lateral
│   ├── shell.tsx                   # Contenedor principal del layout
│   ├── nft-gate.tsx                # Componente de acceso por NFT
│   ├── Exchange.tsx                # Widget de Swap de Uniswap
│   └── CustomSwap.tsx              # Componente de Swap/Bridge personalizado
├── lib/
│   ├── thirdweb-client.ts          # Cliente de Thirdweb
│   ├── auth.ts                     # Lógica de autenticación (ej. isAdmin)
│   └── pandoras-*.ts               # ABIs de los contratos
└── next.config.mjs                 # Configuración de Next.js
```

## 2. Arquitectura y Flujo de Datos

### 2.1. Layouts y Contexto

1.  **`app/layout.tsx` (Root Layout):**
    *   Es el punto de entrada principal de la aplicación.
    *   Envuelve toda la aplicación en los proveedores de contexto necesarios:
        *   `ThemeProvider`: Para el manejo del tema (claro/oscuro).
        *   `ThirdwebProvider`: Provee el contexto de Thirdweb a toda la aplicación, permitiendo que cualquier componente acceda a hooks como `useActiveAccount`, `useConnectModal`, etc.
        *   `Toaster`: Para mostrar notificaciones.

2.  **`app/(dashboard)/layout.tsx` (Dashboard Layout):**
    *   Define la estructura visual principal del dashboard.
    *   Utiliza el componente `<DashboardShell>` que a su vez renderiza:
        *   `<Sidebar>`: La barra de navegación lateral.
        *   `<NFTGate>`: Un componente crucial que protege el contenido.
    *   El contenido de cada página (ej. `page.tsx`, `swap/page.tsx`) se renderiza como `{children}` dentro de este layout.

### 2.2. Enrutamiento (Routing)

*   Se utiliza el **App Router** de Next.js.
*   Las rutas dentro del grupo `(dashboard)` no incluyen `/dashboard` en la URL. Por ejemplo, la página de swap, ubicada en `app/(dashboard)/swap/page.tsx`, es accesible a través de la URL `/swap`.
*   Los enlaces en el `<Sidebar>` deben apuntar a estas rutas simplificadas (ej. `href="/swap"` en lugar de `href="/dashboard/swap"`).

## 3. Autenticación y Conexión Web3 (Thirdweb)

### 3.1. Conexión de Wallet

*   La lógica de conexión se centraliza en el componente `<Sidebar>`.
*   Se utiliza el hook `useConnectModal` de Thirdweb para abrir el modal de conexión.
*   El estado del usuario (conectado/desconectado) se gestiona con `useActiveAccount`.
*   Una vez conectado, la información de la cuenta (`account.address`) se pasa como prop a otros componentes si es necesario.

### 3.2. Acceso por NFT (`NFTGate`)

Este es un componente de "cliente" (`'use client'`) que envuelve las páginas protegidas del dashboard. Su lógica es la siguiente:

1.  **Verificar Cuenta Activa:** Usa `useActiveAccount()` para saber si hay un usuario conectado.
    *   Si no hay cuenta, muestra un mensaje para conectar la wallet.
2.  **Verificar Posesión del NFT:** Si hay una cuenta, usa el hook `useReadContract` para llamar a la función `isGateHolder` de nuestro contrato `PANDORAS_KEY`.
    *   **Mientras carga (`isLoadingKey`):** Muestra un spinner.
    *   **Si `hasKey` es `true`:** Renderiza `{children}`, dando acceso al contenido de la página.
    *   **Si `hasKey` es `false`:** Inicia automáticamente el flujo de minteo.
3.  **Flujo de Minteo Automático:**
    *   Si el usuario no tiene la llave, se prepara y envía una transacción para llamar a la función `freeMint` del contrato.
    *   Se utiliza `useSendTransaction` para ejecutar el minteo.
    *   Mientras la transacción está en proceso, se muestra un modal de progreso (`<MintingProgressModal>`).
    *   Si el minteo es exitoso, se muestra una animación de éxito (`<SuccessNFTCard>`) y finalmente se da acceso al contenido.
    *   Si falla, se muestra un mensaje de error y se permite al usuario reintentar.

## 4. Funcionalidad de Swap

La página `/swap` contiene dos componentes principales para el intercambio de tokens, ofreciendo diferentes experiencias al usuario.

### 4.1. `Exchange.tsx` (Widget de Uniswap)

*   **Propósito:** Ofrecer una experiencia de swap simple y directa, delegando la lógica a un componente externo de confianza.
*   **Implementación:** Utiliza el `@uniswap/widgets`.
*   **Configuración Clave:**
    *   `hideConnectionUI={true}`: Es fundamental. Le decimos al widget que no muestre su propio botón de "Conectar Wallet". En su lugar, detectará automáticamente la wallet que el usuario ya conectó a través de nuestra `<Sidebar>`.
    *   `jsonRpcUrlMap`: Se le proveen las URLs de los RPCs de Thirdweb para las redes soportadas. Esto asegura una conexión estable y confiable.
    *   `tokenList`: Usa la lista de tokens oficial de Uniswap.

### 4.2. `CustomSwap.tsx` (Swap/Bridge Personalizado)

*   **Propósito:** Ofrecer una funcionalidad más avanzada y personalizada, incluyendo swaps en la misma cadena (same-chain) y puentes entre cadenas (cross-chain).
*   **Tecnología Principal:**
    *   **Same-Chain Swap:** Utiliza las extensiones `uniswap` de Thirdweb para interactuar directamente con los pools de Uniswap V3.
    *   **Cross-Chain Bridge:** Utiliza la API `Bridge` de Thirdweb para encontrar las mejores rutas y cotizaciones para mover activos entre diferentes blockchains.

#### Flujo de `CustomSwap`:

1.  **Selección de Tokens y Cadenas:** El usuario elige los tokens y las cadenas de origen y destino. Las listas de tokens se obtienen dinámicamente usando `Bridge.tokens({ client })`.

2.  **Obtención de Cotización (`useQuote` y `Bridge.Sell.quote`):**
    *   **Si es Same-Chain:** El hook personalizado `useQuote` busca el pool de Uniswap V3, calcula la tarifa (`fee`) y obtiene una cotización (`outputAmount`).
        *   **Punto Crítico:** Se debe asegurar que las direcciones de tokens nativos (ETH) se conviertan a sus versiones "wrapped" (WETH) antes de consultar el pool para evitar errores de "zero data".
    *   **Si es Cross-Chain:** Se utiliza `Bridge.Sell.quote` para obtener la mejor cotización de los agregadores de puentes soportados por Thirdweb.

3.  **Revisión del Swap:** Se muestra un modal (`<ReviewModal>`) con un resumen de la transacción: montos, impacto de precio, tarifas, etc.

4.  **Ejecución de la Transacción (`executeSwap`):**
    *   **Aprobación (Approval):** Antes del swap, se verifica si el contrato del router (Uniswap o Bridge) tiene permiso para gastar los tokens del usuario. Se usa `allowance` y, si es necesario, se envía una transacción de `approve` con `useSendTransaction`.
    *   **Swap:**
        *   **Same-Chain:** Se llama a la función `exactInputSingle` del router de Uniswap V3.
        *   **Cross-Chain:** Se utiliza `Bridge.Sell.prepare` para obtener los pasos de la transacción (que pueden incluir aprobaciones y la transacción de venta/bridge) y se ejecutan en orden.

5.  **Confirmación y Resultado:**
    *   Se muestra un modal de progreso (`<ProgressModal>`) mientras la transacción se confirma en la red.
    *   Se utiliza `useWaitForReceipt` para esperar la confirmación.
    *   Finalmente, se muestra un modal de éxito o error (`<ResultModal>`) con el hash de la transacción.

## 5. Componentes y Hooks Reutilizables

*   **`components/PandorasPoolRows.tsx`**: Muestra las posiciones del usuario en los pools de inversión. Recibe los montos como props y los renderiza.
*   **`components/WalletRows.tsx`**: Muestra los saldos de ETH y USDC del usuario en su wallet conectada. Usa `getWalletBalance` de Thirdweb.
*   **`components/promotional-banners.tsx`**: Banners interactivos para la página principal.
*   **`hooks/useQuote.ts`**: Hook personalizado para obtener cotizaciones de Uniswap V3.
*   **`hooks/useTokenList.ts`**: Hook para obtener y "parchear" las listas de tokens, asegurando que los tokens "wrapped" estén presentes.

## 6. Checklist para Despliegue (Deploy)

Antes de desplegar en producción (ej. Vercel), verifica los siguientes puntos para evitar errores de build:

1.  **Errores de TypeScript:**
    *   **`Type 'string' is not assignable to type '0x...'`**: Asegúrate de hacer un type cast `as \`0x\${string}\`` en las direcciones.
    *   **`... | undefined' is not assignable to '...'`**: Provee valores por defecto (ej. `token.logoURI ?? 'default.png'`) o haz que las props del componente receptor sean opcionales.
    *   **`... | null' is not assignable to '... | undefined'`**: Usa el operador `?? undefined` al pasar props que pueden ser `null`.

2.  **Errores de Linter (ESLint):**
    *   **`no-explicit-any`**: Reemplaza todos los `any` por tipos más específicos o por `unknown` con validación de tipo. En el `RootLayout`, el `any` en `ThirdwebProvider` es una solución temporal aceptada, pero debe evitarse en otros lugares.
    *   **`no-misused-promises`**: Si pasas una función `async` a un callback que no espera una promesa (como `onClick` o `setTimeout`), envuélvela: `() => { void miFuncionAsync(); }`.

3.  **Errores de Lógica (Runtime):**
    *   **`Cannot convert undefined to a BigInt`**: Antes de llamar a `sendTransaction`, asegúrate de que el objeto de la transacción no contenga campos `undefined`, especialmente `value` o `amount`. Valida siempre las cotizaciones antes de usarlas.
    *   **`Cannot decode zero data ("0x")`**: Verifica que estás usando la dirección del token "wrapped" (WETH, WMATIC) en lugar del nativo (ETH, MATIC) al interactuar con pools de liquidez.

4.  **Configuración de `next.config.mjs`:**
    *   **Dominios de Imágenes:** Asegúrate de que todos los dominios de los logos de los tokens estén en la lista `images.remotePatterns`. Ejecuta `node generar-dominios.js` para actualizar esta lista automáticamente desde la lista de tokens de Uniswap.

```

¡Espero que esta documentación sea de gran ayuda para ti y tu equipo!

<!--
[PROMPT_SUGGESTION]¿Cómo puedo añadir un nuevo enlace a la barra lateral que apunte a una nueva página `/app/(dashboard)/analytics/page.tsx`?[/PROMPT_SUGGESTION]
[PROMPT_SUGGESTION]Explícame en detalle cómo funciona el hook `useQuote.ts` y cómo interactúa con Uniswap V3.[/PROMPT_SUGGESTION]
