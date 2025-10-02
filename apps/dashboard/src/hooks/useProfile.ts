/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
"use client";

import useSWR from "swr";
import type { UserData, Project } from "@/types/admin";

interface UserProfile extends UserData {
  projects: Project[];
}

async function fetcher(url: string): Promise<UserProfile> {
  const res = await fetch(url);
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
