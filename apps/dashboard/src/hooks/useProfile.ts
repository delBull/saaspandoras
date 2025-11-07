/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import useSWR from "swr";
import type { UserData, Project } from "@/types/admin";
import { useActiveAccount } from "thirdweb/react";

interface UserProfile extends UserData {
   projects: Project[];
   _timestamp?: number; // For cache debugging
   _requestDuration?: number; // For performance monitoring
 }

async function fetcher(walletAddress?: string): Promise<UserProfile> {
    const startTime = Date.now();
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
      // Use cache for better performance, but not too aggressive
      next: { revalidate: 300 } // Revalidate every 5 minutes
    });

   if (!res.ok) {
     // Handle quota exceeded errors gracefully
     if (res.status === 503) {
       const errorData = await res.json().catch(() => ({})) as { message?: string };
       throw new Error(errorData.message ?? 'Database quota exceeded');
     }
     throw new Error(`Profile fetch failed: ${res.status} ${res.statusText}`);
   }

   const data = await res.json();
   const endTime = Date.now();

   // Add timestamp and performance metrics for debugging cache effectiveness
   return {
     ...data,
     _timestamp: endTime,
     _requestDuration: endTime - startTime
   } as UserProfile & { _timestamp: number; _requestDuration: number };
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
         refreshInterval: 600000, // Refresh every 10 minutes (production optimized)
         revalidateOnFocus: false, // Disable focus revalidation to reduce DB calls
         revalidateOnReconnect: true, // Keep reconnect revalidation
         dedupingInterval: 120000, // Increase deduping interval to 2 minutes
         revalidateIfStale: false, // Don't revalidate if data is stale
         focusThrottleInterval: 300000, // Throttle focus events to 5 minutes
         errorRetryCount: 1, // Minimal retry attempts
         errorRetryInterval: 10000, // Wait 10 seconds before retry
         shouldRetryOnError: (error: Error) => {
           // Don't retry on quota exceeded or server errors
           return !error.message.includes('quota') &&
                  !error.message.includes('limit') &&
                  !error.message.includes('exceeded');
         },
         // Add loading timeout to prevent hanging requests
         loadingTimeout: 15000, // 15 second timeout
         // Add onSuccess callback for debugging
         onSuccess: (data) => {
           if (process.env.NODE_ENV === 'development') {
             console.log('✅ Profile data loaded successfully:', {
               hasData: !!data,
               projectCount: data?.projectCount,
               role: data?.role,
               requestDuration: data?._requestDuration,
               timestamp: data?._timestamp
             });
           }
         },
         // Add onError callback for debugging
         onError: (error: Error) => {
           // Don't log expected errors (no wallet connected)
           if (error.message === 'No wallet authentication available') {
             return;
           }

           if (process.env.NODE_ENV === 'development') {
             console.error('❌ Profile fetch error:', {
               message: error.message,
               isQuotaError: error.message.includes('quota') || error.message.includes('limit'),
               stack: error.stack
             });
           }
         }
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
     // Add quota error detection
     isQuotaError: error instanceof Error ?
       (error.message.includes('quota') || error.message.includes('limit')) : false,
     // Add cache status for debugging
     isStale: false, // SWR manages staleness internally
     // Add retry information
     retryCount: 0,
     // Add cache hit/miss info
     isFromCache: false,
     // Add data freshness indicator
     isFresh: data ? (Date.now() - (data._timestamp ?? 0)) < 300000 : false, // Fresh if < 5 minutes
     // Add cache performance summary
     cacheInfo: {
       isLoading,
       isError: !!error,
       isStale: false,
       lastRequestTime: data?._timestamp ?? null,
       requestDuration: data?._requestDuration ?? null,
       isQuotaError: error instanceof Error ?
         (error.message.includes('quota') || error.message.includes('limit')) : false,
     }
   };
 }
