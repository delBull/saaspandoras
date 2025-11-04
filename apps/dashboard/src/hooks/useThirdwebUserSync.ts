'use client';

import { useEffect, useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
// 🎮 EVENT SYSTEM - Ahora usa API, no engine directo

export function useThirdwebUserSync() {
  const account = useActiveAccount();
  const [hasSynced, setHasSynced] = useState(false);
  const [_hasSyncedProfile, _setHasSyncedProfile] = useState(false);

  useEffect(() => {
    if (account?.address && !hasSynced) {
      // Verificar si es primera conexión de este usuario
      const firstLoginKey = `pandoras_first_login_reward_${account.address}`;
      const alreadyGotFirstLoginReward = localStorage.getItem(firstLoginKey);

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

          // 🎮 TRIGGER EVENTO DE PRIMER LOGIN (SOLO PRIMERA VEZ)
          if (!alreadyGotFirstLoginReward) {
            console.log('🎯 Activando evento de primer login para:', account.address);
            // Usar API en lugar de engine directo para evitar errores de dashboard service
            fetch('/api/gamification/events', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Wallet-Address': account.address,
              },
              body: JSON.stringify({
                walletAddress: account.address.toLowerCase(),
                eventType: 'DAILY_LOGIN',
                metadata: {
                  walletAddress: account.address,
                  timestamp: new Date().toISOString(),
                  firstLoginReward: true,
                  description: 'Primer login del usuario - reward único'
                }
              })
            }).then(async (response) => {
              if (response.ok) {
                console.log('✅ Evento de primer login registrado exitosamente');
                // Marcar que ya recibió el reward de primer login inmediatamente
                localStorage.setItem(firstLoginKey, 'true');
                console.log('💾 Primer login marcado en localStorage');

                // 🚀 ACHIEVEMENT SERÁ DESBLOQUEADO AUTOMÁTICAMENTE POR LA API
                // No necesitamos hacer nada extra aquí - la API events ya desbloquea achievements
                console.log('🎉 Achievement "Primer Login" será desbloqueado automáticamente por la API');
              } else {
                console.warn('❌ Failed to register first login event:', await response.text());
              }
            }).catch(err => console.warn('⚠️ Error al dar primer login reward:', err));
          } else {
            console.log('ℹ️ Usuario ya recibió reward de primer login anteriormente:', account.address);
          }

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
