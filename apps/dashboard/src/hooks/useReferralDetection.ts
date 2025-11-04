'use client';

import { useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';

/**
 * Hook que automáticamente detecta y procesa referidos desde enlaces ?ref=wallet
 * Solo se ejecuta una vez por usuario para evitar procesar referidos múltiples veces
 */
export function useReferralDetection() {
  const account = useActiveAccount();

  useEffect(() => {
    if (!account?.address) return;

    // Solo procesar si estamos en el navegador
    if (typeof window === 'undefined') return;

    // Verificar si hay un parámetro ref en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const referrerWallet = urlParams.get('ref');

    if (!referrerWallet) return;

    const currentUserWallet = account.address.toLowerCase();
    const referrerWalletNormalized = referrerWallet.toLowerCase();

    // No permitir autoreferidos
    if (currentUserWallet === referrerWalletNormalized) {
      console.log('ℹ️ Autoreferido detectado - ignorando');
      return;
    }

    // Verificar si este referido ya fue procesado para este usuario
    const processedKey = `pandoras_referral_processed_${currentUserWallet}_${referrerWalletNormalized}`;
    const alreadyProcessed = localStorage.getItem(processedKey);

    if (alreadyProcessed) {
      console.log('ℹ️ Referido ya procesado anteriormente - ignorando');
      return;
    }

    // Procesar el referido automáticamente
    console.log(`🎯 Detectado referido automático: ${referrerWalletNormalized.slice(0, 6)}... refiere a ${currentUserWallet.slice(0, 6)}...`);

    fetch('/api/referrals/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Wallet-Address': account.address,
      },
      body: JSON.stringify({
        referrerWallet: referrerWalletNormalized,
        source: 'link_url'
      })
    })
    .then(async (response) => {
      const data = await response.json() as { alreadyReferred?: boolean; message?: string };

      if (response.ok) {
        console.log('✅ Referido procesado automáticamente exitosamente:', data);

        // Marcar como procesado para evitar re-procesamiento
        localStorage.setItem(processedKey, 'true');

        // 🔥 NOTIFICACIÓN DE ÉXITO AL USUARIO
        // Puedes agregar un toast aquí o mensaje personalizado
        console.log(`🎉 ¡Has recibido 50 puntos por el referido! Invitación de ${referrerWalletNormalized.slice(0, 6)}...`);

      } else if (data.alreadyReferred) {
        console.log('ℹ️ Usuario ya fue referido anteriormente');
        localStorage.setItem(processedKey, 'true'); // Marcar para evitar reintentos

      } else {
        console.warn('⚠️ Error procesando referido automático:', data.message ?? 'Unknown error');
      }
    })
    .catch(error => {
      console.error('❌ Error procesando referido automático:', error);
    });

  }, [account?.address]);
}

/**
 * Hook alternativo para integración manual en componentes específicos
 * Ejemplo de uso:
 *
 * ```tsx
 * const { processReferralManually } = useManualReferralProcessor();
 *
 * const handleManualReferral = () => {
 *   processReferralManually('0x123...abc', 'manual_input');
 * };
 * ```
 */
export function useManualReferralProcessor() {
  const account = useActiveAccount();

  const processReferralManually = async (referrerWallet: string, source = 'manual') => {
    if (!account?.address || !referrerWallet) return false;

    try {
      const response = await fetch('/api/referrals/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Address': account.address,
        },
        body: JSON.stringify({
          referrerWallet,
          source
        })
      });

      const data = await response.json() as { alreadyReferred?: boolean; success?: boolean };

      return response.ok && !data.alreadyReferred;
    } catch (error) {
      console.error('Error en procesamiento manual de referido:', error);
      return false;
    }
  };

  return { processReferralManually };
}
