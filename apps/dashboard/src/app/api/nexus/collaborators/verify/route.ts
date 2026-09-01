/**
 * 🔐 GET /api/nexus/collaborators/verify?token=...
 * Verify collaborator token and return collaborator info.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCollaboratorToken } from '@/lib/nexus/collaborators-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const collaborator = await verifyCollaboratorToken(token);

    if (!collaborator) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      collaborator: {
        id: collaborator.id,
        name: collaborator.name,
        email: collaborator.email,
        expiresAt: collaborator.expiresAt,
        lastAccessAt: collaborator.lastAccessAt,
      },
    });
  } catch (error: any) {
    console.error('[Nexus Collaborators Verify] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
