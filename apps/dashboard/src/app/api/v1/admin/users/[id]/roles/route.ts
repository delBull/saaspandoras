import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/db';
import { users, nexusCollaborators } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { PlatformActor } from '@/lib/dash-contracts/admin';
import type { UserRole } from '@/types/admin';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: targetUserId } = await params;

    // 1. Authenticate Actor
    const auth = await getNexusAuthContext(req.headers, null, 'ADMIN');

    // 2. Initial RBAC Capability Check
    if (!auth.isAuthenticated || !auth.permissions['users.manage']) {
      return NextResponse.json({ ok: false, error: 'Unauthorized: users.manage capability required' }, { status: 403 });
    }

    const { role, capabilities } = await req.json();

    if (!role || !capabilities) {
      return NextResponse.json({ ok: false, error: 'Missing role or capabilities' }, { status: 400 });
    }

    // 3. Fetch Target User
    const [targetUser] = await db
      .select({ role: users.role, email: users.email })
      .from(users)
      .where(eq(users.id, targetUserId));

    if (!targetUser) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
    }

    // 4. Enforce Hierarchical Delegation Restrictions
    if (auth.role !== 'SUPER_ADMIN') {
      // A non-SUPER_ADMIN (even with users.manage) cannot edit a SUPER_ADMIN or another ADMIN
      if (targetUser.role === 'SUPER_ADMIN' || targetUser.role === 'ADMIN') {
        return NextResponse.json({ ok: false, error: 'Unauthorized: Cannot edit higher or equal privileged users' }, { status: 403 });
      }

      // A non-SUPER_ADMIN cannot grant SUPER_ADMIN or ADMIN role
      if (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'admin' || role === 'super_admin') {
        return NextResponse.json({ ok: false, error: 'Unauthorized: Cannot grant higher or equal privileged roles' }, { status: 403 });
      }
    }

    // 5. Apply Updates to canonical `users` table
    await db
      .update(users)
      .set({
        role: role as UserRole,
      })
      .where(eq(users.id, targetUserId));

    // 6. Sync with Sovereign Nexus (nexus_collaborators) if it exists
    if (targetUser.email) {
      const [collab] = await db
        .select({ id: nexusCollaborators.id })
        .from(nexusCollaborators)
        .where(eq(nexusCollaborators.email, targetUser.email));

      if (collab) {
        // We sync the permissions override and role to Nexus Identity
        await db
          .update(nexusCollaborators)
          .set({
            role: role.toUpperCase(),
            permissions: capabilities,
          })
          .where(eq(nexusCollaborators.id, collab.id));
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Error updating user roles:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
