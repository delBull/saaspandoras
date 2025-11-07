import { Card, CardContent, CardHeader, CardTitle } from '@saasfly/ui/card';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

interface KycInfoProps {
  fullName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  nationality?: string;
}

export function KycInfo({ fullName, phoneNumber, dateOfBirth, nationality }: KycInfoProps) {
  return (
    <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-700/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
            <ShieldCheckIcon className="w-4 h-4 text-green-400" />
          </div>
          Información KYC
          <span className="ml-auto flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            Verificado
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Nombre Completo</span>
              <p className="text-white font-medium mt-1">{fullName ?? 'No registrado'}</p>
            </div>

            <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Teléfono</span>
              <p className="text-white font-medium mt-1">{phoneNumber ?? 'No registrado'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Fecha de Nacimiento</span>
              <p className="text-white font-medium mt-1">{dateOfBirth ?
                new Date(dateOfBirth).toLocaleDateString('es-ES') :
                'No registrada'}</p>
            </div>

            <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Nacionalidad</span>
              <p className="text-white font-medium mt-1">{nationality ?? 'No registrada'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
