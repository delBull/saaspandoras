import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { SecurityAuditLogger } from "@/lib/pandoras/core/domains/hermes/runtime/security-audit-logger";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { session } = await getAuth(await headers());
    const walletAddress = session?.address;

    if (!walletAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch Project and verify scope
    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, projectId)
    });

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Replace with real capability check when fully integrated. 
    // Currently, verifying if the wallet is the applicant/owner of the project.
    if (walletAddress.toLowerCase() !== project.applicantWalletAddress?.toLowerCase() && walletAddress !== process.env.ADMIN_WALLET?.toLowerCase()) {
        return NextResponse.json({ error: "Insufficient capabilities to activate tenant" }, { status: 403 });
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
      actorId: walletAddress,
      eventType: 'EXECUTIVE_TENANT_STATUS_UPDATED',
      severity: 'INFO',
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
