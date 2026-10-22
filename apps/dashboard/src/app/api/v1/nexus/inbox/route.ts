import { NextResponse } from 'next/server';
import { GET as myWorkHandler } from '@/app/api/v1/tma/nexus/operations/my-work/route';
import type { NexusOperation } from '@/app/api/v1/tma/nexus/operations/adapters/DomainAdapter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface MyWorkResponse {
  operations?: {
    NEEDS_ATTENTION?: NexusOperation[];
    TODAY?: NexusOperation[];
    RECENT?: NexusOperation[];
  };
  error?: string;
}

interface InboxItem {
  id: string;
  title: string;
  reason: string;
  type: 'ESCALATION' | 'CAMPAIGN' | 'TASK';
  severity: string;
  createdAt: string;
  recommendedAction: { label: string; action: string; intent?: string };
  payload?: unknown;
  domain: string;
}

/**
 * 📥 GET /api/v1/nexus/inbox
 * Canonical alias for TMA and Web attention inbox.
 * Flattens and unifies operations into items format.
 */
export async function GET(req: Request) {
  try {
    const res = await myWorkHandler(req);
    const data = (await res.json()) as MyWorkResponse;

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    const buckets = data.operations ?? {};
    const rawOps: NexusOperation[] = [
      ...(buckets.NEEDS_ATTENTION ?? []),
      ...(buckets.TODAY ?? []),
      ...(buckets.RECENT ?? []),
    ];

    const items: InboxItem[] = rawOps.map((op: NexusOperation) => ({
      id: op.id,
      title: op.title,
      reason: op.description ?? '',
      type: op.type === 'INTERVENTION' ? 'ESCALATION' : op.type === 'DECISION' ? 'CAMPAIGN' : 'TASK',
      severity: op.priority,
      createdAt: op.createdAt instanceof Date ? op.createdAt.toISOString() : String(op.createdAt),
      recommendedAction: op.actions[0] ?? { label: 'Revisar', action: 'VIEW' },
      payload: (op.payload as unknown) ?? null,
      domain: op.domain,
    }));

    return NextResponse.json({ items, count: items.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[NexusInbox GET] Error:', message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
