interface Address {
  street?: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

interface AddressInfoProps {
  address?: Address;
}

export function AddressInfo({ address }: AddressInfoProps) {
  if (!address) return null;

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-700/30 rounded-lg border p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white">Dirección Residencial</h3>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Dirección</span>
          <p className="text-white font-medium mt-1">{address.street ?? 'No registrada'}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Ciudad</span>
            <p className="text-white font-medium mt-1">{address.city ?? 'No registrada'}</p>
          </div>

          <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">País</span>
            <p className="text-white font-medium mt-1">{address.country ?? 'No registrado'}</p>
          </div>

          <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Código Postal</span>
            <p className="text-white font-mono font-medium mt-1">{address.postalCode ?? 'No registrado'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
