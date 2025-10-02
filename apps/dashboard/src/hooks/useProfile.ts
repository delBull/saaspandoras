/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
"use client";

import useSWR from "swr";
import type { UserData, Project } from "@/types/admin";

interface UserProfile extends UserData {
  projects: Project[];
}

async function fetcher(url: string): Promise<UserProfile> {
  // Send wallet address header to authenticate the request
  const walletAddress = typeof window !== 'undefined'
    ? document.cookie
        .split('; ')
        .find((row) => row.startsWith('wallet-address='))
        ?.split('=')[1]
    : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (walletAddress) {
    headers['x-thirdweb-address'] = walletAddress;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }
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
