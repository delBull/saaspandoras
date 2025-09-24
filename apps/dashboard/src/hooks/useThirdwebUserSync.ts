'use client';

import { useEffect, useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';

export function useThirdwebUserSync() {
  const account = useActiveAccount();
  const [hasSynced, setHasSynced] = useState(false);
  const [_hasSyncedProfile, _setHasSyncedProfile] = useState(false);

  useEffect(() => {
    if (account?.address && !hasSynced) {
      // Sincroniza wallet básica
      fetch('/api/user-sync/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: account.address,
          // Información básica por ahora
        }),
      })
      .then((res) => {
        if (res.ok) {
          console.log('✅ Wallet sincronizada correctamente');
          setHasSynced(true);
        } else {
          console.warn('⚠️ Error al sincronizar wallet:', res.status);
        }
      })
      .catch((error) => {
        console.error('❌ Error al sincronizar wallet:', error);
      });
    }
  }, [account?.address, hasSynced]);

  // Reset sync flag when wallet disconnects
  useEffect(() => {
    if (!account?.address) {
      setHasSynced(false);
      _setHasSyncedProfile(false);
    }
  }, [account?.address]);

  return { address: account?.address, hasSynced };
}

/**
 * Hook opcional para futura integración con social login
 *
 * Cuando configures Google/Facebook login en Thirdweb, puedes usar este hook
 * para enviar información adicional (email, nombre) al sistema.
 *
 * Ejemplo de uso futuro:
 *
 * ```tsx
 * const account = useActiveAccount();
 * const { user } = useUser(); // Cuando configures social login
 *
 * if (user?.email) {
 *   fetch('/api/user-sync/connect', {
 *     method: 'PUT',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       walletAddress: account.address,
 *       email: user.email,
 *       name: user.name,
 *       image: user.image
 *     })
 *   });
 * }
 * ```
 */
export function useThirdwebProfileSync() {
  return { ready: true };
}
