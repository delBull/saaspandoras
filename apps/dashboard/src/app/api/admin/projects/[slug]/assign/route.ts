import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { projects, administrators } from '@saasfly/db/schema';
import { eq } from "@saasfly/db-core";
import { getNexusAuthContext } from '@saasfly/shared';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const auth = await getNexusAuthContext();
    if (!auth.isAuthenticated || (auth.role !== 'SUPER_ADMIN' && auth.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { slug } = resolvedParams;
    const body = await req.json();
    const { adminId } = body; // The ID of the admin to assign

    if (!adminId) {
      return NextResponse.json({ success: false, message: 'Admin ID is required' }, { status: 400 });
    }

    // 1. Get the current user's admin record based on their wallet address
    const [callerAdmin] = await db
      .select()
      .from(administrators)
      .where(eq(administrators.walletAddress, auth.wallet || ''))
      .limit(1);

    if (!callerAdmin) {
      return NextResponse.json({ success: false, message: 'Admin record not found for caller' }, { status: 404 });
    }

    // 2. Enforce assignment rules
    // - SUPER_ADMIN can assign anyone
    // - ADMIN can assign themselves
    // - ADMIN assigning another ADMIN requires approval (currently blocked until approval flow is built)
    if (auth.role === 'ADMIN') {
      if (callerAdmin.id !== adminId) {
        return NextResponse.json({ 
          success: false, 
          message: 'Asignar a otro Admin requiere un flujo de aprobación. Por ahora, solo puedes asignarte a ti mismo.' 
        }, { status: 403 });
      }
    }

    // 3. Verify Project exists
    const [project] = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1);
    if (!project) {
      return NextResponse.json({ success: false, message: 'Project not found' }, { status: 404 });
    }

    // 4. Execute Assignment
    await db.update(projects)
      .set({ assignedAdminId: adminId })
      .where(eq(projects.id, project.id));

    return NextResponse.json({ success: true, message: 'Admin assigned successfully' });
  } catch (error: any) {
    console.error('[Admin API: assign admin]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
