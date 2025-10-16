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
     // Try multiple header names in case Vercel filters some
     headers['x-thirdweb-address'] = walletAddress;
     headers['x-wallet-address'] = walletAddress;
     headers['x-user-address'] = walletAddress;
   } else {
     throw new Error('No wallet authentication available');
   }

   const res = await fetch('/api/profile', {
     headers,
     cache: 'no-store' // Critical for dynamic content
   });

  if (!res.ok) {
    throw new Error(`Profile fetch failed: ${res.status} ${res.statusText}`);
  }

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
        revalidateOnReconnect: true,
        // Add mutation when wallet changes to ensure fresh data
        dedupingInterval: 5000, // Reduce cache time for more responsive updates
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
     // Helper function to refresh profile data (useful after creating projects)
     refreshProfile: () => mutate(),
   };
 }
