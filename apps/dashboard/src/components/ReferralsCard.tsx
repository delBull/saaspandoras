'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, PlusIcon, UsersIcon, EyeIcon } from '@heroicons/react/24/outline';

// Interface para referidos
interface Referral {
  id: string;
  referrerWalletAddress: string;
  referredWalletAddress: string;
  referralSource: string;
  status: 'pending' | 'completed';
  completedAt?: string;
  referredCompletedOnboarding?: boolean;
  referredFirstProject?: boolean;
}

export function ReferralsCard() {
  const account = useActiveAccount();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [userReferral, setUserReferral] = useState<Referral | null>(null);
  const [newReferrer, setNewReferrer] = useState('');
  const [_isLoading, setIsLoading] = useState(false); // Prefixed _ to indicate unused
  const [showAllReferralsModal, setShowAllReferralsModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format wallet address for display
  const formatWallet = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Fetch user referrals and referral status
  useEffect(() => {
    if (!account?.address) return;

    /* eslint-disable @typescript-eslint/no-floating-promises,
       @typescript-eslint/no-unsafe-assignment,
       @typescript-eslint/no-unsafe-member-access */
    const fetchReferrals = async () => {
      try {
        setIsLoading(true);

        // Fetch user's own referral status
        const statusResponse = await fetch('/api/referrals/status');
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          if (statusData.wasReferred && statusData.referrer) {
            setUserReferral({
              id: 'personal',
              referrerWalletAddress: statusData.referrer,
              referredWalletAddress: account.address,
              referralSource: statusData.source,
              status: statusData.status,
              referredCompletedOnboarding: statusData.completedOnboarding,
              referredFirstProject: statusData.hasFirstProject,
            });
          }
        }

        // Fetch users who were referred by current user
        const referrerWallet = account.address.toLowerCase();
        const referrerResponse = await fetch(`/api/referrals/my-referrals?wallet=${referrerWallet}`);
        if (referrerResponse.ok) {
          const referrerData = await referrerResponse.json();
          const actualReferrals: Referral[] = (referrerData.referrals as Referral[]) || [];
          setReferrals(actualReferrals);
          console.log(`✅ Loaded ${actualReferrals.length} referrals for user ${referrerWallet.slice(0, 6)}...`);
        } else {
          console.warn(`⚠️ Could not load referrals for user ${referrerWallet.slice(0, 6)}...`);
          setReferrals([]);
        }
      } catch (error) {
        console.error('Error fetching referrals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReferrals();
    /* eslint-enable */
  }, [account?.address]);

  // Handle adding new referrer
  /* eslint-disable @typescript-eslint/no-unsafe-assignment,
     @typescript-eslint/no-unsafe-member-access, 
     @typescript-eslint/no-unsafe-argument */
  const handleAddReferrer = async () => {
    if (!account?.address || !newReferrer.trim()) return;

    if (!newReferrer.toLowerCase().startsWith('0x')) {
      toast.error('Ingresa una dirección de wallet válida que empiece con "0x"');
      return;
    }

    if (newReferrer.toLowerCase() === account.address.toLowerCase()) {
      toast.error('¡No puedes referirte a ti mismo!');
      return;
    }

    setIsSubmitting(true);
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
          referrerWallet: newReferrer.trim(),
          source: 'manual_input'
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`¡Referido registrado! Recibiste ${data.referralBonus} puntos`);

        // Update user referral
        setUserReferral({
          id: 'personal',
          referrerWalletAddress: newReferrer.trim(),
          referredWalletAddress: account.address,
          referralSource: 'manual_input',
          status: 'pending',
        });

        // Clear input
        setNewReferrer('');
      } else {
        if (data.message) {
          toast.error(data.message);
        } else {
          toast.error('Error al registrar el referido');
        }
      }
    } catch (error) {
      console.error('Error adding referrer:', error);
      toast.error('Error conectando con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };
  /* eslint-enable */

  // If not connected, show login message
  if (!account?.address) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-400">
            👥 Referidos
          </CardTitle>
          <CardDescription>
            Conecta tu wallet para ver tus referidos y agregar quien te refirió
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-400">
            👥 Referidos
          </CardTitle>
          <CardDescription>
            Gestiona referidos y conexiones
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Add Referrer Input - Only show if no referrer */}
          {!userReferral && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
            >
              <div className="flex items-center gap-2">
                <PlusIcon className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-orange-400">
                  ¿Quién te refirió?
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="0x..."
                  value={newReferrer}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewReferrer(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-transparent"
                  maxLength={42}
                />
                <Button
                  size="sm"
                  onClick={handleAddReferrer}
                  disabled={isSubmitting || !newReferrer.trim()}
                  className="bg-orange-500 hover:bg-orange-600 text-white w-full"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Agregando...</span>
                    </div>
                  ) : (
                    'Agregar'
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                Agrega la wallet que te invitó para recibir bonus
              </p>
            </motion.div>
          )}

          {/* Referrer Badge - Show if has referrer */}
          {userReferral && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/40 rounded-lg"
            >
              <div className="flex items-center gap-3 mb-2">
                <CheckCircleIcon className="w-6 h-6 text-green-400" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-green-400">
                    ¡Referido Registrado!
                  </h4>
                  <p className="text-xs text-green-300">
                    Wallet que te refirió: <span className="font-mono font-medium">{formatWallet(userReferral.referrerWalletAddress)}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  userReferral.status === 'completed'
                    ? 'bg-green-900/50 text-green-300'
                    : 'bg-yellow-900/50 text-yellow-300'
                }`}>
                  Status: {userReferral.status === 'completed' ? 'Completado' : 'Pendiente'}
                </span>
                <span className="text-xs text-gray-400">
                  {userReferral.referralSource === 'link' ? 'Vía enlace' :
                   userReferral.referralSource === 'manual_input' ? 'Manual' :
                   userReferral.referralSource === 'direct' ? 'Directo' : 'Otro'}
                </span>
              </div>
              {/* Only show pending explanation if status is pending */}
              {userReferral.status === 'pending' && (
                <div className="mt-2 p-2 bg-yellow-900/20 rounded border border-yellow-700/30">
                  <p className="text-xs text-yellow-200">
                    ⏳ <strong>Referido pendiente:</strong> Recibirás tus tokens adicionales cuando completes cualquiera de estas acciones:
                  </p>
                  <ul className="text-xs text-yellow-200 mt-1 ml-4 list-disc">
                    <li>Completa tu verificación KYC básica</li>
                    <li>Aplica tu primer proyecto</li>
                    <li>Desbloquea cualquier logro</li>
                  </ul>
                </div>
              )}

              {/* Show completed message if status is completed */}
              {userReferral.status === 'completed' && (
                <div className="mt-2 p-2 bg-green-900/20 rounded border border-green-700/30">
                  <p className="text-xs text-green-200">
                    🎉 <strong>¡Referido completado!</strong> Tu y tu referrer reciben tokens adicionales por tu actividad.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Recent Referrals */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-300">Mis Referidos</h4>
              {referrals.length > 3 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAllReferralsModal(true)}
                  className="text-xs text-orange-400 hover:text-orange-300"
                >
                  <EyeIcon className="w-3 h-3 mr-1" />
                  Ver más
                </Button>
              )}
            </div>

            {referrals.length === 0 ? (
              <div className="text-center py-4">
                <UsersIcon className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-xs text-gray-400">
                  Aún no tienes referidos
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {referrals.slice(0, 3).map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-2 bg-zinc-800/30 rounded border border-zinc-700/30"
                  >
                    <span className="text-xs font-mono text-white">
                      {formatWallet(referral.referredWalletAddress)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      referral.status === 'completed'
                        ? 'bg-green-900/50 text-green-400'
                        : 'bg-yellow-900/50 text-yellow-400'
                    }`}>
                      {referral.status === 'completed' ? 'Completado' : 'Pendiente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
            <div className="text-center">
              <div className="text-lg font-bold text-orange-400">{referrals.length}</div>
              <div className="text-xs text-gray-400">Referidos</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-400">
                {referrals.filter(r => r.status === 'completed').length}
              </div>
              <div className="text-xs text-gray-400">Completados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Referrals Modal */}
      <AnimatePresence>
        {showAllReferralsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>Todos mis Referidos</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAllReferralsModal(false)}
                    className="h-6 w-6 p-0"
                  >
                    ✕
                  </Button>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto">
                  {referrals.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      No tienes referidos aún
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {referrals.map((referral) => (
                        <div
                          key={referral.id}
                          className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                        >
                          <div>
                            <p className="font-mono text-sm text-white">
                              {formatWallet(referral.referredWalletAddress)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {referral.referralSource}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                              referral.status === 'completed'
                                ? 'bg-green-900/50 text-green-400'
                                : 'bg-yellow-900/50 text-yellow-400'
                            }`}>
                              {referral.status === 'completed' ? 'Completado' : 'Pendiente'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
