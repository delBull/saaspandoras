import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * ⚡ Hermes Agent Skill Specification (/SKILL.md)
 * Standardized AI agent skill document describing capabilities, boundaries, and tools of Hermes OS.
 */
export async function GET() {
  const skillContent = `---
name: pandoras-hermes-agent
description: Autonomous institutional agent for Pandora's Growth OS, Deal Rooms, Tokenization, and Sovereign Scheduling.
version: 1.0.0
---

# Hermes OS — Autonomous Protocol Agent

## Description
Hermes OS is the sovereign cognitive intelligence engine for Pandora's Growth OS. It operates with cryptographic claim contracts, zero-trust tenant isolation, multi-channel gateways (WhatsApp, Telegram, Web, Nexus), and verified authority matrices.

## Capabilities
1. **Omnichannel Interaction**: Native presence on Telegram Bot, Telegram Mini App (TMA), WhatsApp Business, and Web Portals.
2. **Epistemic Integrity (K25/K26)**: Every fact and disclosure is cryptographically bound to an RFC4648 CIDv1 artifact on IPFS.
3. **Executive Authority Recognition**: Automatic recognition of Sovereign Founder (Marco) with zero administrative friction.
4. **Agenda Soberana**: Conversational scheduling, slot holds, host resolution, and calendar synchronization.
5. **Investor Onboarding & Claim Contracts**: Transparent phase dynamics, tokenized agreements, and notarized receipts.

## System Boundaries
- Tenant Isolation: Complete multi-tenant data partitioning.
- Security Events: Append-only hash chain audit logging.
- Human Gate: Non-boss actors cannot execute binding legal agreements without operator approval.
`;

  return new NextResponse(skillContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
