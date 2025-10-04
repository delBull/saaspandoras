/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
"use client";

import useSWR from "swr";
import type { UserData, Project } from "@/types/admin";
import { useActiveAccount } from "thirdweb/react";

interface UserProfile extends UserData {
  projects: Project[];
}

async function fetcher(walletAddress?: string): Promise<UserProfile> {
   const headers: Record<string, string> = {
     'Content-Type': 'application/json',
   };

   if (walletAddress) {
     headers['x-thirdweb-address'] = walletAddress;
     console.log('✅ useProfile: Sending request with auth header for wallet:', walletAddress.substring(0, 15) + '...');
     console.log('🔍 useProfile: Headers being sent:', headers);
   } else {
     console.error('❌ useProfile: CRITICAL ERROR - No wallet address provided');
     throw new Error('No wallet authentication available');
   }

   const res = await fetch('/api/profile', {
     headers,
     cache: 'no-store' // Critical for dynamic content
   });

  if (!res.ok) {
    console.error('🚨 useProfile: API REQUEST FAILED', {
      status: res.status,
      statusText: res.statusText,
      url: '/api/profile',
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
   const account = useActiveAccount();
   const walletAddress = account?.address?.toLowerCase();

   // Create dynamic SWR key based on current wallet
   const walletSWRKey = walletAddress ? `profile-${walletAddress}` : null;

   const { data, error, isLoading, mutate } = useSWR<UserProfile>(
     walletSWRKey, // Unique key per wallet
     () => fetcher(walletAddress),
     {
       refreshInterval: 30000, // More frequent refresh
       revalidateOnFocus: true,
       revalidateOnReconnect: true
     }
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
