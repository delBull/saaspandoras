"use client";

import Image from "next/image";

const NO_FUNDS_ICON = "/images/pkey.png";

// Un componente reutilizable para cada fila de activo
function AssetRow({ icon, name, cryptoAmount, usdAmount }: { icon: string, name: string, cryptoAmount: string, usdAmount: string }) {
  return (
    <div className="flex items-center justify-between p-3 transition-colors hover:bg-zinc-800/50 rounded-lg cursor-pointer">
      <div className="flex items-center gap-4">
        <Image src={icon} alt={name} width={40} height={40} className="rounded-full" />
        <div>
          <p className="font-bold text-white">{name}</p>
          <p className="text-sm font-mono text-gray-400">{cryptoAmount}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-mono font-semibold text-white">{usdAmount}</p>
      </div>
    </div>
  );
}

// La interfaz de props
interface PandorasPoolRowsProps {
  ethAmount: number;
  usdcAmount: number;
  isLoading: boolean;
}

export function PandorasPoolRows({ ethAmount, usdcAmount, isLoading }: PandorasPoolRowsProps) {

  if (isLoading) {
    return <div className="p-4 text-center text-gray-400">Cargando datos de blockchain...</div>;
  }
  
  if (!isLoading && ethAmount === 0 && usdcAmount === 0) {
    return (
      <div className="px-4 py-12 text-center text-gray-400">
        <div className="flex flex-col items-center">
          <Image src={NO_FUNDS_ICON} alt="Sin inversión" width={56} height={56} className="mb-3 opacity-70" />
          <div className="mb-2 font-semibold text-lg text-gray-300">Aún no tienes inversiones en Pandora&apos;s Pool</div>
          <div className="text-sm mb-4 text-gray-400">Invierte con ETH o USDC para ver tus posiciones aquí.</div>
          <a href="https://minter.pandoras.finance" target="_blank" rel="noopener noreferrer" className="bg-lime-700 text-white px-4 py-2 rounded hover:bg-lime-600 text-sm transition text-center">
            Ir a invertir
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {ethAmount > 0 && (
        <AssetRow 
          icon="/images/eth-icon.png"
          name="Pandora's Pool ETH"
          cryptoAmount={`${ethAmount.toFixed(4)} ETH`}
          usdAmount={`$${(ethAmount * 3000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
      )}
      {usdcAmount > 0 && (
        <AssetRow 
          icon="/images/usdc-icon.png"
          name="Pandora's Pool USDC"
          cryptoAmount={`${usdcAmount.toFixed(2)} USDC`}
          usdAmount={`$${usdcAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
      )}
    </div>
  );
}