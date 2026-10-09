import { create } from 'zustand';

export interface TenantInfo {
  organizationId: string;
  slug: string;
  title: string;
  role: string;
  isOwner: boolean;
}

export interface HermesSession {
  userId: string;
  telegramUserId: string;
  organizationId: string;
  role: string;
  capabilities: string[];
  expiresAt: number;
}

interface SessionState {
  token: string | null;
  session: HermesSession | null;
  authorizedTenants: TenantInfo[];
  isAuthenticated: boolean;
  
  setSession: (token: string, session: HermesSession, tenants: TenantInfo[]) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  token: null,
  session: null,
  authorizedTenants: [],
  isAuthenticated: false,

  setSession: (token, session, tenants) => set({
    token,
    session,
    authorizedTenants: tenants,
    isAuthenticated: true,
  }),

  clearSession: () => set({
    token: null,
    session: null,
    authorizedTenants: [],
    isAuthenticated: false,
  }),
}));
