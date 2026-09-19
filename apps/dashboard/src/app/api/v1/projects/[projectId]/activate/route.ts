import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, installedProducts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { headers, cookies } from "next/headers";
import { validatePortalSession } from "@/lib/platform/portal-auth";
import { SecurityAuditLogger } from "@/lib/pandoras/core/domains/hermes/runtime/security-audit-logger";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const reqHeaders = await headers();
    const cookieStore = await cookies();

    // 1. Dual Authentication: Web3 Session OR Portal JWT Session (Magic Link)
    const { session } = await getAuth(reqHeaders);
    let walletAddress = session?.address;
    let actorIdentifier = walletAddress;
    let isPortalOwner = false;

    // Check portal cookie if no wallet
    const portalSessionCookie = cookieStore.get('pandoras_portal_session')?.value;
    if (!walletAddress && portalSessionCookie) {
      const portalSession = await validatePortalSession(portalSessionCookie);
      if (portalSession) {
        actorIdentifier = `portal_actor_${portalSession.installedProductId}`;
        isPortalOwner = true;
      }
    }

    if (!walletAddress && !isPortalOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch Project and verify scope
    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, projectId)
    });

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Permission Verification:
    // If authenticated via portal session, verify it belongs to this project
    if (isPortalOwner && portalSessionCookie) {
      const portalSession = await validatePortalSession(portalSessionCookie);
      if (portalSession && portalSession.projectId !== project.id) {
        return NextResponse.json({ error: "Cross-tenant activation forbidden" }, { status: 403 });
      }
    } else if (walletAddress) {
      // If via wallet, verify ownership or platform admin
      if (walletAddress.toLowerCase() !== project.applicantWalletAddress?.toLowerCase() && walletAddress !== process.env.ADMIN_WALLET?.toLowerCase()) {
        return NextResponse.json({ error: "Insufficient capabilities to activate tenant" }, { status: 403 });
      }
    }

    if (!project.isSimulationMode) {
        return NextResponse.json({ error: "Project is already active" }, { status: 400 });
    }

    // 3. Execute Irreversible Activation
    await db.update(projects)
      .set({ isSimulationMode: false })
      .where(eq(projects.id, project.id));

    // 4. Audit Log
    await SecurityAuditLogger.logEvent({
      organizationId: project.organizationId,
      actorId: actorIdentifier || 'unknown',
      eventType: 'EXECUTIVE_TENANT_STATUS_UPDATED',
      severity: 'WARN',
      policyDecision: 'ALLOW',
      correlationId: `activate-${project.id}-${Date.now()}`,
      metadata: {
        from: 'SIMULATION',
        to: 'PRODUCTION',
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({ success: true, message: "Tenant successfully activated" });

  } catch (error: unknown) {
    console.error("[ActivateTenant] Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
