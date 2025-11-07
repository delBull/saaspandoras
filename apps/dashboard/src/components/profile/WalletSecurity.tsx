import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { ShieldCheckIcon, WalletIcon, ArrowTopRightOnSquareIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@saasfly/ui/button';
import { toast } from 'sonner';

export function WalletSecurity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          Seguridad de Wallet
        </CardTitle>
        <CardDescription>
          Información importante sobre tu wallet y recuperación de fondos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Critical Warning */}
        <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 rounded-lg p-4 border border-red-700/30">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-200 mb-1"> ¡Guarda tus claves privadas en lugar seguro!</p>
              <p className="text-sm text-gray-300">
                Si pierdes el acceso a tu wallet, solo podrás recuperarlo con tus claves privadas.
                Guarda tu seed phrase/recovery kit en un lugar físico seguro y privado.
              </p>
            </div>
          </div>
        </div>

        {/* Recovery Options */}
        <div className="bg-zinc-800/60 rounded-lg p-4 border border-zinc-700/50">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-sm font-medium text-gray-300">Opciones de Recuperación</h5>
            <ShieldCheckIcon className="w-4 h-4 text-green-400" />
          </div>

          <div className="space-y-3">
            {/* In-App Wallet Recovery */}
            <div className="p-3 bg-zinc-700/30 rounded border border-zinc-600/50">
              <div className="flex items-center gap-3 mb-2">
                <WalletIcon className="w-4 h-4 text-lime-400" />
                <div>
                  <span className="text-sm font-medium text-gray-300">Wallet integrada</span>
                  <p className="text-xs text-gray-400">Via thirdweb recovery</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs bg-transparent border-zinc-600 hover:bg-zinc-700 text-gray-400"
                onClick={() => {
                  toast.info('Funcionalidad de recovery kit próximamente disponible desde thirdweb');
                }}
                disabled={true}
              >
                Exportar Recovery Keys
              </Button>
            </div>

            {/* External Wallet Message */}
            <div className="p-3 bg-zinc-700/30 rounded border border-zinc-600/50">
              <div className="flex items-center gap-3 mb-2">
                <ArrowTopRightOnSquareIcon className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="text-sm font-medium text-gray-300">Wallet externa</span>
                  <p className="text-xs text-gray-400">MetaMask, Trust Wallet, etc.</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs bg-transparent border-zinc-600 hover:bg-zinc-700 text-gray-400"
                disabled={true}
              >
                En tu app
              </Button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-600/50">
            <p className="text-xs text-gray-500">
              <strong>Wallet integrada:</strong> Usa el recovery proporcionado por thirdweb<br/>
              <strong>Wallet externa:</strong> Recupera desde tu aplicación oficial (MetaMask, etc.)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
