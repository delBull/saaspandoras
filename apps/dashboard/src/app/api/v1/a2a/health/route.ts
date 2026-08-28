import { NextResponse } from 'next/server';
import { AgentRegistry } from '@/lib/pandoras/core/domains/hermes/a2a/agent-registry';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/a2a/health
 * Public health check and capability declaration for Hermes A2A Bridge.
 */
export async function GET() {
  const hermes = AgentRegistry.getAgent('hermes');
  const sofia = AgentRegistry.getAgent('sofia');

  return NextResponse.json({
    status: 'ACTIVE',
    protocol: 'pandoras-a2a',
    version: '1.0',
    agent: hermes?.displayName,
    wallet: hermes?.walletAddress,
    registeredPeers: [
      {
        agentId: sofia?.agentId,
        displayName: sofia?.displayName,
        status: sofia?.status,
        capabilities: sofia?.allowedCapabilities,
      },
    ],
    timestamp: new Date().toISOString(),
  });
}
