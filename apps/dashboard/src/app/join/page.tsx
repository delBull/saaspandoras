'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useActiveAccount } from 'thirdweb/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { CheckCircleIcon, ArrowRightIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { TelegramDashboardAuth } from '@/components/auth/TelegramDashboardAuth';

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const account = useActiveAccount();

  const [referrerWallet, setReferrerWallet] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [referralProcessed, setReferralProcessed] = useState(false);
  const [telegramUserData, setTelegramUserData] = useState<any>(null);

  // Obtener el parámetro ref de la URL
  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam && refParam.startsWith('0x') && refParam.length === 42) {
      setReferrerWallet(refParam.toLowerCase());
    }
  }, [searchParams]);

  // Procesar el referido
  const processReferral = useCallback(async () => {
    if (!account?.address || !referrerWallet || referralProcessed) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/referrals/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Address': account.address,
          'x-thirdweb-address': account.address,
          'x-user-address': account.address,
        },
        body: JSON.stringify({
          referrerWallet: referrerWallet,
          source: 'link'
        })
      });

      const data = await response.json() as { referralBonus?: number; message?: string };

      if (response.ok) {
        toast.success(`¡Bienvenido! Has recibido ${data.referralBonus ?? 50} puntos por unirte`);
        setReferralProcessed(true);

        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          void router.push('/');
        }, 2000);
      } else {
        if (data.message) {
          toast.error(data.message);
        } else {
          toast.error('Error al procesar el referido');
        }
      }
    } catch (error) {
      console.error('Error processing referral:', error);
      toast.error('Error conectando con el servidor');
    } finally {
      setIsProcessing(false);
    }
  }, [account?.address, referrerWallet, referralProcessed, router]);

  // Procesar automáticamente cuando el usuario se conecte
  useEffect(() => {
    if (account?.address && referrerWallet && !referralProcessed) {
      void processReferral();
    }
  }, [account?.address, referrerWallet, referralProcessed, processReferral]);

  // Si no hay referrer wallet, mostrar error
  if (!referrerWallet) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-900 to-black">
        <Card className="w-full max-w-md border-zinc-800 bg-zinc-950">
          <CardHeader className="text-center">
            <CardTitle className="text-red-400">Enlace Inválido</CardTitle>
            <CardDescription className="text-zinc-500">
              El enlace de referido no es válido o ha expirado.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/')} variant="outline" className="w-full border-zinc-800 text-zinc-400">
              Ir al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-900 to-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-zinc-900 border-zinc-800 shadow-2xl overflow-hidden">
          <CardHeader className="text-center relative">
            {/* Decorative element */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"></div>

            <div className="flex justify-center mb-4 pt-4">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center ring-1 ring-cyan-500/30">
                <UserGroupIcon className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white font-bold tracking-tight">
              ¡Bienvenido a Pandora&apos;s!
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Has sido invitado. Elige cómo quieres continuar para empezar a ganar puntos.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Telegram Login Option (Priority) */}
            <div className="space-y-3">
              <TelegramDashboardAuth
                onSuccess={(data) => {
                  setTelegramUserData(data);
                  // If they have a wallet linked in Telegram, we could use it
                  // For now we just track that they resolved identity
                }}
              />

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-zinc-800"></div>
                <span className="flex-shrink mx-4 text-zinc-500 text-xs uppercase tracking-widest font-medium">O CONECTA TU WALLET</span>
                <div className="flex-grow border-t border-zinc-800"></div>
              </div>
            </div>

            {/* Wallet connection status */}
            {!account?.address ? (
              <div className="text-center p-6 bg-zinc-950/50 border border-zinc-800/50 rounded-xl">
                <p className="text-zinc-500 text-sm mb-4 italic">Conecta tu wallet para vincular activos on-chain</p>
                {/* The parent sidebar usually has the connect button, but here we can show instructions */}
              </div>
            ) : (
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="text-center p-6 bg-blue-900/10 border border-blue-500/30 rounded-xl"
              >
                <CheckCircleIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <p className="text-blue-300 font-medium">¡Wallet conectada!</p>
                <p className="text-xs text-blue-400/70 mt-1 font-mono">
                  {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </p>
              </motion.div>
            )}


            {/* Estado del referido */}
            {account?.address && (
              <div className="space-y-4">
                {referralProcessed ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center p-4 bg-cyan-900/20 border border-cyan-700/50 rounded-lg"
                  >
                    <CheckCircleIcon className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                    <p className="text-cyan-300 font-medium">¡Referido registrado!</p>
                    <p className="text-xs text-cyan-400 mt-1">
                      Redirigiendo al dashboard...
                    </p>
                  </motion.div>
                ) : (
                  <div className="text-center p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                    <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-yellow-300 font-medium">Procesando referido...</p>
                    <p className="text-xs text-yellow-400 mt-1">
                      Registrando tu conexión con el referrer
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Información del referrer */}
            <div className="text-center p-4 bg-zinc-950/50 border border-zinc-800/30 rounded-xl">
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-widest font-bold">Invitado por</p>
              <p className="text-sm font-mono text-cyan-400">
                {referrerWallet.slice(0, 6)}...{referrerWallet.slice(-4)}
              </p>
            </div>

            {/* Botón manual (solo si hay problemas) */}
            {account?.address && !referralProcessed && !isProcessing && (
              <Button
                onClick={processReferral}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-6 rounded-xl transition-all shadow-lg shadow-cyan-600/20"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin w-4 h-4" />
                    Procesando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ArrowRightIcon className="w-4 h-4" />
                    Completar Registro
                  </div>
                )}
              </Button>
            )}

            {/* Botón para ir al dashboard */}
            <Button
              variant="link"
              onClick={() => router.push('/')}
              className="w-full text-zinc-500 hover:text-zinc-300 text-xs"
            >
              Omitir y entrar al Dashboard
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}


export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-900 to-black">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Cargando...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    }>
      <JoinContent />
    </Suspense>
  );
}
