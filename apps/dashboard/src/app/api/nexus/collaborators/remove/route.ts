/**
 * 🗑️ DELETE /api/nexus/collaborators/remove?email=...
 * Remove a collaborator by email.
 */

import { NextRequest, NextResponse } from 'next/server';
import { removeCollaborator, requireNexusAdmin } from '@/lib/nexus/collaborators-service';

export async function DELETE(req: NextRequest) {
  try {
    if (!(await requireNexusAdmin())) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const removed = await removeCollaborator(email);

    if (!removed) {
      return NextResponse.json(
        { error: 'Collaborator not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, message: 'Collaborator removed' });
  } catch (error: any) {
    console.error('[Nexus Collaborators Remove] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
