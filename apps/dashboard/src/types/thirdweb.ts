// 🔧 TypeScript Types for Thirdweb Social Login Integration

export interface ThirdwebSocialProfile {
  type: string; // Thirdweb can have various auth types
  email?: string;
  emailVerified?: boolean;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  locale?: string;
  hd?: string; // Google hosted domain
  id?: string; // Profile identifier
}

export interface ThirdwebUser {
  address: string;
  smartWalletAddress?: string;
  createdAt?: string;
  profiles: ThirdwebSocialProfile[];
}

export interface ThirdwebAPIResponse {
  result: {
    wallets: ThirdwebUser[];
    pagination?: {
      hasMore: boolean;
      limit: number;
      page: number;
    };
  };
}

export interface EnrichedUserData extends Omit<ThirdwebUser, 'profiles'> {
  // Legacy fields for backward compatibility
  email: string | null;
  name: string | null;
  image: string | null;

  // Social profiles
  socialProfiles: ThirdwebSocialProfile[];

  // Analytics
  loginMethods?: string[];
}

export interface ThirdwebSyncRequest {
  walletAddress: string;
  socialProfiles?: ThirdwebSocialProfile[];
}

// Analytics types for tracking login methods
export interface LoginAnalytics {
  date: string;
  method: string; // 'google', 'email', 'wallet', etc.
  count: number;
}

// Configuration types
export interface ThirdwebConfig {
  secretKey?: string;
  clientId?: string;
  ecosystemId?: string;
}
