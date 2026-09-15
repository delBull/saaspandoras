/**
 * 💾 Nexus TMA — Session Store
 * src/lib/session-store.ts
 *
 * Lightweight, stateless session management.
 * - Sessions are stored in sessionStorage (cleared on tab close)
 * - No cookies, no server-side state
 * - Session expires after 8h TTL (validated client-side)
 */

export interface NexusWorkspace {
  id: string;
  name: string;
}

export interface NexusBadges {
  hitlUrgentChats: number;
  growthHotLeadsToday: number;
  rwaPendingDeposits: number;
  total: number;
}

export interface NexusTmaSession {
  collaboratorId: number;
  name: string;
  role: string;
  telegramUserId: string;
  telegramUsername?: string;
  capabilities: string[];
  enabledVerticals: string[];      // ['HERMES', 'GROWTH', 'RWA']
  workspaces: NexusWorkspace[];
  activeWorkspace: string;
  badges: NexusBadges;
  organizationId: string | null;
  issuedAt: number;
  expiresAt: number;
  token: string;
}

const SESSION_KEY = 'nexus_tma_session';

export function saveSession(session: NexusTmaSession): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    console.warn('[NexusTMA] Failed to save session to sessionStorage.');
  }
}

export function loadSession(): NexusTmaSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as NexusTmaSession;

    // Validate TTL client-side
    if (session.expiresAt <= Date.now()) {
      clearSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function hasCapability(session: NexusTmaSession | null, cap: string): boolean {
  if (!session) return false;
  return session.capabilities.includes(cap);
}
