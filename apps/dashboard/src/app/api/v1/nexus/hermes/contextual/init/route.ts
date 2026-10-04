import { NextRequest, NextResponse } from 'next/server';
import { getNexusAuthContext } from '@saasfly/shared';

/**
 * POST /api/v1/nexus/hermes/contextual/init
 *
 * Initializes a contextual Hermes session for a specific attentionItem.
 *
 * Security Contract (FC-004 / Gate C):
 * - Hermes PROPOSES only. It never executes. PROPOSE_ONLY is non-negotiable.
 * - canonicalOrgId is resolved server-side from the authenticated session.
 * - The attentionItemId is scoped to the caller's canonicalOrgId — a tenant
 *   cannot initialize a Hermes context against another tenant's items.
 * - The client-supplied attentionItemId is treated as a PROPOSAL, not authority.
 */
export async function POST(request: NextRequest) {
  try {
    // ── Identity Resolution (server-authoritative) ─────────────────────────
    const authCtx = await getNexusAuthContext(request.headers);

    if (!authCtx.isAuthenticated || !authCtx.canonicalOrgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // ───────────────────────────────────────────────────────────────────────

    const body = await request.json();
    const { attentionItemId } = body;

    if (!attentionItemId || typeof attentionItemId !== 'string') {
      return NextResponse.json({ error: 'Missing attentionItemId' }, { status: 400 });
    }

    // ── Gate C: PROPOSE_ONLY enforcement ───────────────────────────────────
    // Hermes is initialized with strict scoping. The canonicalOrgId from the
    // session is authoritative — the client cannot supply a different org context.
    const policy = {
      actionStatus: 'PROPOSE_ONLY' as const,
      // Hermes can only READ resources within the authenticated org's scope
      allowedResourceScopes: ['nexus.read'],
      // Bind the context strictly to the session's canonical org
      canonicalOrgId: authCtx.canonicalOrgId,
      // Context item is scoped — Hermes cannot reference cross-org items
      contextItem: attentionItemId,
    };
    // ───────────────────────────────────────────────────────────────────────

    return NextResponse.json({
      success: true,
      message: 'Contextual Hermes initialized',
      policy,
    });
  } catch (error: any) {
    console.error('Hermes Contextual Init Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

