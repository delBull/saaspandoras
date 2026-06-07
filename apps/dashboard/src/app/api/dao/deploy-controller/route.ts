import { NextResponse } from "next/server";
import { db } from "~/db";
import { projects } from "~/db/schema";
import { eq } from "drizzle-orm";
import { withSecurity, withdrawRateLimiter, isValidWalletAddress } from "~/lib/security-utils";
import { deployProjectController } from "~/lib/treasury/factory";
import { getUsdcAddress } from "~/lib/treasury/usdc-contract";

const DEFAULT_DAILY_LIMIT = BigInt(500 * 1_000_000); // 500 USDC

async function handler(request: Request): Promise<Response> {
  const body = await request.json();
  const { projectId, ownerAddress, dailyLimitWei } = body;

  if (!projectId || !ownerAddress) {
    return NextResponse.json(
      { error: "Missing required fields: projectId, ownerAddress" },
      { status: 400 },
    );
  }

  if (!isValidWalletAddress(ownerAddress)) {
    return NextResponse.json({ error: "Invalid owner address" }, { status: 400 });
  }

  // Check project exists and doesn't already have a controller
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.allowanceControllerAddress) {
    return NextResponse.json(
      { error: "Project already has an AllowanceController", controllerAddress: project.allowanceControllerAddress },
      { status: 409 },
    );
  }

  const usdcAddress = getUsdcAddress() as `0x${string}`;
  const dailyLimit = dailyLimitWei ? BigInt(dailyLimitWei) : DEFAULT_DAILY_LIMIT;

  const result = await deployProjectController(ownerAddress, usdcAddress, dailyLimit);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // Store controller address in project record
  await db
    .update(projects)
    .set({ allowanceControllerAddress: result.controllerAddress })
    .where(eq(projects.id, projectId));

  return NextResponse.json({
    success: true,
    controllerAddress: result.controllerAddress,
    txHash: result.txHash,
    owner: ownerAddress,
    token: usdcAddress,
    dailyLimit: dailyLimit.toString(),
  });
}

export const POST = withSecurity(handler, { rateLimit: withdrawRateLimiter });
