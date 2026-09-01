/**
 * 📧 POST /api/nexus/collaborators/request
 * Create/update collaborator and send magic link email.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createOrUpdateCollaborator,
  sendCollaboratorMagicLink,
  requireNexusAdmin,
} from '@/lib/nexus/collaborators-service';

export async function POST(req: NextRequest) {
  try {
    if (!(await requireNexusAdmin(req))) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 403 });
    }
    const body = await req.json();
    const { name, email } = body as { name?: string; email?: string };

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const { collaborator, magicLink } = await createOrUpdateCollaborator(
      name.trim(),
      email.trim().toLowerCase()
    );

    const sendResult = await sendCollaboratorMagicLink(
      collaborator.name,
      collaborator.email,
      magicLink
    );

    if (!sendResult.ok) {
      return NextResponse.json(
        { error: sendResult.error, collaborator },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Magic link sent to collaborator',
      collaborator: {
        id: collaborator.id,
        name: collaborator.name,
        email: collaborator.email,
        expiresAt: collaborator.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('[Nexus Collaborators Request] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
