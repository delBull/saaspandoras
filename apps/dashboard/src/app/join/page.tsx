'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useActiveAccount } from 'thirdweb/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { CheckCircleIcon, ArrowRightIcon, UserGroupIcon } from '@heroicons/react/24/outline';

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const account = useActiveAccount();

  const [referrerWallet, setReferrerWallet] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [referralProcessed, setReferralProcessed] = useState(false);

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
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-400">Enlace Inválido</CardTitle>
            <CardDescription>
              El enlace de referido no es válido o ha expirado.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/')} className="w-full">
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
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center">
                <UserGroupIcon className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">
              ¡Bienvenido a Pandora&apos;s!
            </CardTitle>
            <CardDescription className="text-gray-400">
              Has sido invitado por un amigo. Conecta tu wallet para comenzar.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Estado de conexión */}
            {!account?.address ? (
              <div className="text-center p-6 bg-zinc-800/50 rounded-lg">
                <div className="animate-pulse">
                  <div className="w-12 h-12 bg-zinc-700 rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-400">Esperando conexión de wallet...</p>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="text-center p-6 bg-green-900/20 border border-green-700/50 rounded-lg"
              >
                <CheckCircleIcon className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-green-300 font-medium">¡Wallet conectada!</p>
                <p className="text-xs text-green-400 mt-1">
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
            <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
              <p className="text-xs text-gray-400 mb-2">Invitado por:</p>
              <p className="text-sm font-mono text-cyan-400">
                {referrerWallet.slice(0, 6)}...{referrerWallet.slice(-4)}
              </p>
            </div>

            {/* Botón manual (solo si hay problemas) */}
            {account?.address && !referralProcessed && !isProcessing && (
              <Button
                onClick={processReferral}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
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
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full border-zinc-700 hover:bg-zinc-800"
            >
              Ir al Dashboard
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
