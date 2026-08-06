import { getRedis } from '@/lib/redis';
import { SalesState } from '../types';

export interface TelegramLeadState {
  salesState: SalesState;
  journeyStageId?: string;
  leadId: string;
  email?: string;
  phone?: string;
  name?: string;
  walletAddress?: string;
  expressedIntent?: 'explore' | 'invest' | 'whitelist' | 'b2b';
  pendingInput?: 'email' | 'phone' | 'name' | 'wallet' | 'none';
  lastAction?: string;
  updatedAt: number;
  createdAt: number;
}

const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function buildStateKey(projectId: number, chatId: string): string {
  return `hermes:tg:state:${projectId}:${chatId}`;
}

export async function getTelegramState(
  projectId: number,
  chatId: string
): Promise<TelegramLeadState> {
  const redis = getRedis();
  const key = buildStateKey(projectId, chatId);
  const now = Date.now();

  if (!redis) {
    return {
      salesState: 'NEW',
      journeyStageId: 'stage_welcome_thesis',
      leadId: `TG-${chatId}`,
      pendingInput: 'none',
      updatedAt: now,
      createdAt: now
    };
  }

  try {
    const raw = await redis.get(key);
    if (raw) {
      const parsed = JSON.parse(raw) as TelegramLeadState;
      return {
        ...parsed,
        pendingInput: parsed.pendingInput || 'none',
        updatedAt: now
      };
    }
  } catch (e) {
    console.error('[TelegramState] Error reading state:', e);
  }

  return {
    salesState: 'NEW',
    journeyStageId: 'stage_welcome_thesis',
    leadId: `TG-${chatId}`,
    pendingInput: 'none',
    updatedAt: now,
    createdAt: now
  };
}

export async function saveTelegramState(
  projectId: number,
  chatId: string,
  patch: Partial<TelegramLeadState>
): Promise<TelegramLeadState> {
  const redis = getRedis();
  const key = buildStateKey(projectId, chatId);
  const current = await getTelegramState(projectId, chatId);
  const next: TelegramLeadState = {
    ...current,
    ...patch,
    updatedAt: Date.now()
  };

  if (redis && key) {
    try {
      await redis.set(key, JSON.stringify(next), 'EX', TTL_SECONDS);
    } catch (e) {
      console.error('[TelegramState] Error saving state:', e);
    }
  }

  return next;
}
