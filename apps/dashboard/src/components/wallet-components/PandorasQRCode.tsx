import React from 'react';
import Image from 'next/image';
import QRCode from 'react-qr-code';

interface PandorasQRCodeProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
}

export function PandorasQRCode({
  value,
  size = 200,
  level = 'M'
}: PandorasQRCodeProps) {
  const qrSize = size;

  // Dimensiones para el área central:
  // El área total es el 25% del QR (seguro para el nivel 'M' o 'H')
  const logoAreaSize = Math.floor(qrSize * 0.25);
  // La máscara blanca (el "cutout") es ligeramente más grande que el logo para la separación
  const maskSize = logoAreaSize * 1.15;
  // El logo de color es el 80% de la zona total de logo
  const logoInnerSize = logoAreaSize * 0.8;

  return (
    <div className="relative inline-block">
      {/* QR Code base con fondo blanco para contraste */}
      <div className="bg-black p-3 rounded-lg shadow-sm relative">
        <QRCode
          value={value}
          size={qrSize}
          level={level}
          className="rounded"
        />
      </div>

      {/* Contenedor central: MÁSCARA TRIANGULAR (Cutout) + LOGO */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: maskSize,
          height: maskSize,
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        {/* 1. MÁSCARA BLANCA TRIANGULAR (El "Cutout" que borra el QR) */}
        <div
          style={{
            position: 'absolute',
            backgroundColor: 'black', // Color para ocultar los módulos QR
            width: maskSize,
            height: maskSize,
            // Aplicar la forma triangular con clipPath
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            // Ajuste visual: los triángulos se ven mejor centrados si se levantan un poco
            transform: 'translateY(-10%)',
            // Sombra sutil para mejorar la definición del corte
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.1), inset 0 0 5px rgba(0, 0, 0, 0.05)',
            zIndex: 10,
          }}
        />

        {/* Logo SVG de Pandoras dentro del triángulo negro - centrado */}
        <Image
          src="/logop.svg"
          alt="Pandoras Logo"
          width={logoInnerSize * 1}
          height={logoInnerSize * 1}
          style={{
            position: 'absolute',
            top: '60%',
            left: '50%',
            transform: 'translate(-50%, -50%) translateY(-15%)',
            opacity: 0.95,
            zIndex: 12,
          }}
        />
      </div>

      {/* Efectos decorativos sutiles */}
      <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-orange-500/10 via-red-500/10 to-pink-500/10 blur-sm -z-10" />
    </div>
  );
}

// Componente wrapper con información adicional
interface WalletQRDisplayProps {
  address: string;
  chainName: string;
  currencySymbol: string;
}

export function WalletQRDisplay({ address, chainName, currencySymbol }: WalletQRDisplayProps) {
  // ✅ QR CODE GENERADO DINÁMICAMENTE:
  // Cada wallet conectada genera su propio QR único basado en su dirección

  // Formato EIP-681 con chain ID para MetaMask
  const metamaskURI = `ethereum:${address}@1`;

  // Usamos el formato con chain ID que MetaMask reconoce correctamente
  const walletURI = metamaskURI;

  console.log('🎯 QR Code generado dinámicamente para wallet:', {
    address,
    chainName,
    currencySymbol,
    walletURI,
    formato: 'ethereum:@1 (con chain ID)'
  });

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="inline-block p-4 bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl border border-zinc-700/50">
          <PandorasQRCode
            value={walletURI}
            size={180}
            level="M"
          />
        </div>

        <div className="mt-4 space-y-2">
          <h3 className="text-lg font-semibold text-white">
            🦊 Escanea con MetaMask
          </h3>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">
            Abre MetaMask móvil, toca "Escanear" y apunta a este código QR para enviar {currencySymbol}
          </p>
        </div>
      </div>

      {/* Información adicional */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="p-3 bg-zinc-800/50 rounded-lg">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Red</div>
          <div className="text-sm font-medium text-white">{chainName}</div>
        </div>
        <div className="p-3 bg-zinc-800/50 rounded-lg">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Tipo</div>
          <div className="text-sm font-medium text-white">ERC20 + ETH</div>
        </div>
      </div>

      {/* Consejos */}
      <div className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
        <h4 className="text-sm font-medium text-orange-400 mb-2">🦊 Qué sucede al escanear:</h4>
        <ul className="text-xs text-gray-300 space-y-1">
          <li>• MetaMask se abre automáticamente</li>
          <li>• La dirección de recepción aparece precargada</li>
          <li>• Solo necesitas ingresar el monto a enviar</li>
          <li>• Confirma la transacción normalmente</li>
        </ul>
        <div className="mt-3 p-2 bg-orange-500/10 rounded border border-orange-500/30">
          <p className="text-xs text-orange-300">
            💡 <strong>Nota:</strong> Si MetaMask no se abre automáticamente, copia la dirección manualmente desde arriba.
          </p>
        </div>
      </div>
    </div>
  );
}
