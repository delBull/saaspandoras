/**
 * 📋 GET /api/nexus/collaborators/list
 * List all active collaborators.
 */

import { NextResponse } from 'next/server';
import { listCollaborators, requireNexusAdmin } from '@/lib/nexus/collaborators-service';

export async function GET() {
  try {
    if (!(await requireNexusAdmin())) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 403 });
    }
    const collaborators = await listCollaborators();
    return NextResponse.json({ ok: true, collaborators });
  } catch (error: any) {
    console.error('[Nexus Collaborators List] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
