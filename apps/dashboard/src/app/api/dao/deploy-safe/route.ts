import { NextResponse } from "next/server";
import { db } from "~/db";
import { projects } from "~/db/schema";
import { eq } from "drizzle-orm";
import { deploySafeViaMulticall } from "~/lib/treasury/safe-deploy";
import { withSecurity, withdrawRateLimiter } from "~/lib/security-utils";
import { getAdminAddress } from "~/lib/treasury/gas-monitor";
import { verifyMessage } from "viem";

interface DeployRequest {
  projectId: number;
  ownerSignature?: string;
  owners?: string[];
  threshold?: number;
}

async function handler(request: Request): Promise<Response> {
  try {
    const body: DeployRequest = await request.json();
    const { projectId, ownerSignature, owners, threshold } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      columns: { id: true, slug: true, allowanceControllerAddress: true, applicantWalletAddress: true, title: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.allowanceControllerAddress) {
      return NextResponse.json(
        { error: "Project already has a deployed Safe", safeAddress: project.allowanceControllerAddress },
        { status: 409 },
      );
    }

    const safeOwners = (owners ?? [project.applicantWalletAddress].filter(Boolean)) as `0x${string}`[];
    if (safeOwners.length === 0) {
      safeOwners.push(getAdminAddress());
    }

    if (ownerSignature && project.applicantWalletAddress) {
      const message = `Deploy Safe for project ${project.slug} (${projectId}) with owners ${safeOwners.join(",")}`;
      const valid = await verifyMessage({
        address: project.applicantWalletAddress as `0x${string}`,
        message,
        signature: ownerSignature as `0x${string}`,
      });
      if (!valid) {
        return NextResponse.json({ error: "Invalid owner signature" }, { status: 403 });
      }
    }

    const result = await deploySafeViaMulticall(
      safeOwners,
      threshold ? BigInt(threshold) : undefined,
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    await db
      .update(projects)
      .set({
        allowanceControllerAddress: result.safeAddress.toLowerCase(),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    return NextResponse.json({
      ok: true,
      safeAddress: result.safeAddress,
      txHash: result.txHash,
      computedAddress: result.computedAddress,
      addressMatch: result.match,
      projectId,
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Deploy failed: ${e.message}` }, { status: 500 });
  }
}

export const POST = withSecurity(handler, { rateLimit: withdrawRateLimiter });
