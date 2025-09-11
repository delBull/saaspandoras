'use client';

import { SwapWidget } from '@uniswap/widgets';
// ELIMINADO: Ya no necesitamos los hooks de thirdweb aquí, el widget funciona por su cuenta.

// --- CONFIGURACIÓN ROBUSTA PARA EL WIDGET ---

// Tu Client ID de las variables de entorno
const THIRDWEB_CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "";

// Mapa de Redes y sus RPCs
const JSON_RPC_URL_MAP: Record<number, string> = {
  1:     `https://ethereum.rpc.thirdweb.com/${THIRDWEB_CLIENT_ID}`,
  137:   `https://polygon.rpc.thirdweb.com/${THIRDWEB_CLIENT_ID}`,
  8453:  `https://base.rpc.thirdweb.com/${THIRDWEB_CLIENT_ID}`,
  10:    `https://optimism.rpc.thirdweb.com/${THIRDWEB_CLIENT_ID}`,
  42161: `https://arbitrum.rpc.thirdweb.com/${THIRDWEB_CLIENT_ID}`,
};

// URL de la Lista de Tokens
const UNISWAP_TOKEN_LIST = "https://tokens.uniswap.org";

export function Exchange() {
  // ELIMINADO: La lógica de 'account' y los manejadores de eventos 'handleSwapSuccess' y 'handleSwapError' se han quitado.
  // El widget es una "caja negra" que maneja su propio estado.

  return (
    <div className="uniswap-widget-container w-full">
      <SwapWidget
        // --- Configuración Esencial ---
        jsonRpcUrlMap={JSON_RPC_URL_MAP}
        tokenList={UNISWAP_TOKEN_LIST}
        
        // --- Integración con tu dApp ---
        // Le decimos al widget que no muestre su propio botón de "Conectar",
        // ya que el usuario se conectará desde tu Sidebar global.
        // El widget detectará automáticamente la wallet ya conectada.
        hideConnectionUI={true}
        
        // --- Valores por Defecto (Opcional) ---
        defaultChainId={8453} // Base
        defaultOutputTokenAddress="0x833589fCD6eDb6E08f4c7C32D4f71b54bda02913" // USDC
        
        // ELIMINADO: Las props onSwapSuccess y onSwapError no existen en la API del widget.
      />
    </div>
  );
}