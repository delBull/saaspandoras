/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
"use client";

import useSWR from "swr";
import type { UserData, Project } from "@/types/admin";

interface UserProfile extends UserData {
  projects: Project[];
}

async function fetcher(url: string): Promise<UserProfile> {
  // Get wallet address from multiple sources - same logic as admin dashboard
  let walletAddress = null;
  if (typeof window !== 'undefined') {
    // 1. Try localStorage first (most reliable)
    if (window.localStorage) {
      try {
        const sessionData = localStorage.getItem('wallet-session');
        if (sessionData) {
          const parsedSession = JSON.parse(sessionData) as unknown as { address?: string };
          walletAddress = parsedSession.address?.toLowerCase();
        }
      } catch (error) {
        console.warn('useProfile: Error reading wallet from localStorage:', error);
      }
    }

    // 2. Fallback to cookies (ssr-compatible but less reliable)
    if (!walletAddress) {
      walletAddress = document.cookie
        .split('; ')
        .find((row) => row.startsWith('wallet-address='))
        ?.split('=')[1];
    }

    // 3. Check for saved wallet in cookies as final fallback
    if (!walletAddress) {
      walletAddress = document.cookie
        .split('; ')
        .find((row) => row.startsWith('wallet-address='))
        ?.split('=')[1];
    }

    console.log('💳 useProfile: Wallet sources checked - localStorage, cookies', walletAddress ? 'FOUND' : 'NOT FOUND');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (walletAddress) {
    headers['x-thirdweb-address'] = walletAddress;
    console.log('💳 useProfile: Auth header sent with wallet:', walletAddress.substring(0, 15) + '...');
  } else {
    console.error('❌ useProfile: CRITICAL - No wallet address available for authentication');
  }

  const res = await fetch(url, {
    headers,
    cache: 'no-store' // Disable cache for dynamic content
  });

  if (!res.ok) {
    console.error('❌ useProfile: API REJECTED', {
      url,
      status: res.status,
      statusText: res.statusText,
      walletAddress,
      headers
    });
    throw new Error(`Profile API failed: ${res.status} - ${res.statusText}`);
  }

  console.log('✅ useProfile: Profile fetched successfully');
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
