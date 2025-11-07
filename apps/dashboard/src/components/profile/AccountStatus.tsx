import { Card, CardContent, CardHeader, CardTitle } from '@saasfly/ui/card';
import { ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface AccountStatusProps {
  role?: string;
  connectionCount?: number;
  kycCompleted?: boolean;
  lastConnectionAt?: string;
  projectCount?: number;
  hasPandorasKey?: boolean;
}

export function AccountStatus({
  role,
  connectionCount,
  kycCompleted,
  lastConnectionAt,
  projectCount,
  hasPandorasKey
}: AccountStatusProps) {
  return (
    <Card className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border-orange-700/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          Estado de Cuenta
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 gap-4">
          {/* Rol y Conexiones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Rol</span>
                  <p className="text-white font-medium capitalize">{role ?? 'pandorian'}</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Conexiones Totales</span>
                  <p className="text-white font-medium">{connectionCount ?? 1}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Estado KYC */}
          <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/30">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                kycCompleted ? 'bg-green-500/20' : 'bg-yellow-500/20'
              }`}>
                {kycCompleted ? (
                  <ShieldCheckIcon className="w-4 h-4 text-green-400" />
                ) : (
                  <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />
                )}
              </div>
              <div className="flex-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Estado KYC</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    kycCompleted ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-white font-medium">
                    {kycCompleted ? 'Verificado' : 'Pendiente'}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 ml-11">
              {kycCompleted
                ? 'Tu identidad ha sido verificada exitosamente'
                : 'Completa el proceso de KYC Básico para acceder a más funciones'
              }
            </p>
          </div>

          {/* Última Conexión */}
          <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Última Conexión</span>
                <p className="text-white font-medium">
                  {lastConnectionAt ?
                    new Date(lastConnectionAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) :
                    'Nunca'
                  }
                </p>
              </div>
            </div>
            {lastConnectionAt && (
              <p className="text-xs text-gray-400 ml-11">
                {(() => {
                  const now = new Date();
                  const lastConnection = new Date(lastConnectionAt);
                  const diffTime = Math.abs(now.getTime() - lastConnection.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  if (diffDays === 1) return 'Hace 1 día';
                  if (diffDays < 7) return `Hace ${diffDays} días`;
                  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
                  return `Hace ${Math.floor(diffDays / 30)} meses`;
                })()}
              </p>
            )}
          </div>

          {/* Creaciones Aplicadas y Pandora's Key */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Creaciones Aplicadas</span>
                  <p className="text-white font-medium">{projectCount ?? 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/30">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  hasPandorasKey ? 'bg-lime-500/20' : 'bg-gray-500/20'
                }`}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Pandora's Key</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`font-medium ${
                      hasPandorasKey ? 'text-lime-400' : 'text-gray-400'
                    }`}>
                      {hasPandorasKey ? 'Activada' : 'Inactiva'}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${
                      hasPandorasKey ? 'bg-lime-500' : 'bg-gray-500'
                    }`}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
