import { Card, CardContent, CardHeader, CardTitle } from '@saasfly/ui/card';

interface BasicInfoProps {
  name?: string;
  email?: string;
  occupation?: string;
  taxId?: string;
}

export function BasicInfo({ name, email, occupation, taxId }: BasicInfoProps) {
  return (
    <Card className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 border-zinc-700/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          Información Básica
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Nombre</span>
              <p className="text-white font-medium mt-1">{name ?? 'No registrado'}</p>
            </div>

            <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Email</span>
              <p className="text-white font-medium mt-1 break-all">{email ?? 'No registrado'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Ocupación</span>
              <p className="text-white font-medium mt-1">{occupation ?? 'No especificada'}</p>
            </div>

            <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">ID Fiscal / RFC</span>
              <p className="text-white font-mono font-medium mt-1">{taxId ?? 'No registrado'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
