/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
"use client";

import useSWR from "swr";
import type { UserData, Project } from "@/types/admin";

interface UserProfile extends UserData {
  projects: Project[];
}

async function fetcher(url: string): Promise<UserProfile> {
  // Send wallet address header to authenticate the request
  let walletAddress = null;
  if (typeof window !== 'undefined') {
    // Try localStorage first (more reliable)
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

    // Fallback to cookies
    if (!walletAddress) {
      walletAddress = document.cookie
        .split('; ')
        .find((row) => row.startsWith('wallet-address='))
        ?.split('=')[1];
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (walletAddress) {
    headers['x-thirdweb-address'] = walletAddress;
    console.log('💳 useProfile: Using wallet for auth:', walletAddress.substring(0, 10) + '...');
  } else {
    console.log('⚠️ useProfile: No wallet address found for auth');
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
    console.error('❌ useProfile: Fetch failed', url, res.status, res.statusText);
    throw new Error(`Profile fetch failed: ${res.status}`);
  }

  console.log('✅ useProfile: Successfully fetched profile');
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
