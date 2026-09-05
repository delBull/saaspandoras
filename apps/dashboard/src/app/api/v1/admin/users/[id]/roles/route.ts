import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { PlatformActor } from '@/lib/dash-contracts/admin';
import type { UserRole } from '@/types/admin';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: targetUserId } = await params;

    // 1. Authenticate Actor
    const auth = await getNexusAuthContext(req.headers);

    // 2. Initial RBAC Check
    if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN')) {
      return NextResponse.json({ ok: false, error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    const { role, capabilities } = await req.json();

    if (!role || !capabilities) {
      return NextResponse.json({ ok: false, error: 'Missing role or capabilities' }, { status: 400 });
    }

    // 3. Fetch Target User
    const [targetUser] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, targetUserId));

    if (!targetUser) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
    }

    // 4. Enforce Hierarchical Delegation Restrictions
    if (auth.role === 'ADMIN') {
      // An ADMIN cannot edit a SUPER_ADMIN or another ADMIN
      if (targetUser.role === 'SUPER_ADMIN' || targetUser.role === 'ADMIN') {
        return NextResponse.json({ ok: false, error: 'Unauthorized: Cannot edit higher or equal privileged users' }, { status: 403 });
      }

      // An ADMIN cannot grant SUPER_ADMIN or ADMIN role
      if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
        return NextResponse.json({ ok: false, error: 'Unauthorized: Cannot grant higher or equal privileged roles' }, { status: 403 });
      }
    }

    // 5. Apply Updates
    await db
      .update(users)
      .set({
        role: role as UserRole,
        capabilities: capabilities as Record<string, boolean>,
      })
      .where(eq(users.id, targetUserId));

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Error updating user roles:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
