/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
"use client";

import useSWR from "swr";
import type { UserData, Project } from "@/types/admin";

interface UserProfile extends UserData {
  projects: Project[];
}

async function fetcher(url: string): Promise<UserProfile> {
  // Get CURRENT wallet address from useActiveAccount pattern (similar to admin dashboard)
  let walletAddress = null;
  if (typeof window !== 'undefined') {
    console.log('🧪 useProfile: Debug wallet sources...');

    // 1. Try localStorage first (most reliable - from usePersistedAccount)
    if (window.localStorage) {
      try {
        const sessionData = localStorage.getItem('wallet-session');
        if (sessionData) {
          const parsedSession = JSON.parse(sessionData) as unknown as { address?: string };
          walletAddress = parsedSession.address?.toLowerCase();
          console.log('💾 useProfile: Found wallet in localStorage:', walletAddress?.substring(0, 10) + '...');
        } else {
          console.log('⚠️ useProfile: No wallet-session in localStorage');
        }
      } catch (error) {
        console.warn('useProfile: Error reading localStorage:', error);
      }
    }

    // 2. Fallback to cookies (same pattern as admin dashboard)
    if (!walletAddress) {
      const cookieWallet = document.cookie
        .split('; ')
        .find((row) => row.startsWith('wallet-address='))
        ?.split('=')[1];

      if (cookieWallet) {
        walletAddress = cookieWallet.toLowerCase();
        console.log('🍪 useProfile: Found wallet in cookies:', walletAddress?.substring(0, 10) + '...');
      } else {
        console.log('⚠️ useProfile: No wallet-address cookie');
      }
    }

    console.log('💳 useProfile: Final wallet address:', walletAddress ? walletAddress.substring(0, 20) + '...' : 'NONE');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (walletAddress) {
    headers['x-thirdweb-address'] = walletAddress;
    console.log('� useProfile: Sending request with auth header for wallet:', walletAddress.substring(0, 15) + '...');
  } else {
    console.error('❌ useProfile: CRITICAL ERROR - No wallet address found in localStorage or cookies');
    throw new Error('No wallet authentication available');
  }

  const res = await fetch(url, {
    headers,
    cache: 'no-store' // Critical for dynamic content
  });

  if (!res.ok) {
    console.error('🚨 useProfile: API REQUEST FAILED', {
      status: res.status,
      statusText: res.statusText,
      url,
      walletAddress: walletAddress?.substring(0, 10) + '...',
      hasHeader: !!headers['x-thirdweb-address']
    });

    // Try to read response for debugging
    try {
      const errorText = await res.text();
      console.error('🚨 useProfile: API Error Response:', errorText);
    } catch (e) {
      console.error('🚨 useProfile: Could not read error response');
    }

    throw new Error(`Profile fetch failed: ${res.status} ${res.statusText}`);
  }

  console.log('✅ useProfile: API Request SUCCESS - Profile data retrieved');
  return res.json();
}

export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR<UserProfile>(
    "/api/profile",
    fetcher,
    { refreshInterval: 60000 } // refresca cada minuto
  );

  return {
    profile: data,
    projects: data?.projects ?? [],
    role: data?.role,
    projectCount: data?.projectCount ?? 0,
    systemProjectsManaged: data?.systemProjectsManaged,
    hasPandorasKey: data?.hasPandorasKey,
    isLoading,
    isError: !!error,
    mutate, // para refrescar manualmente
  };
}
