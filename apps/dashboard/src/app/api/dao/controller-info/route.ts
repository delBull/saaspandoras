import { NextResponse } from "next/server";
import { createPublicClient, http, parseAbi } from "viem";
import { sepolia, base } from "viem/chains";
import { db } from "~/db";
import { projects } from "~/db/schema";
import { eq } from "drizzle-orm";

const CONTROLLER_ABI = parseAbi([
  "function owner() view returns (address)",
  "function delegate() view returns (address)",
  "function token() view returns (address)",
  "function dailyLimit() view returns (uint256)",
  "function spentToday() view returns (uint256)",
  "function remainingAllowance() view returns (uint256)",
]);

function getViemChain() {
  return process.env.NODE_ENV === 'production' ? base : sepolia;
}

const USDC_ABI = parseAbi(["function balanceOf(address) view returns (uint256)"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  let controllerAddress: string | null = null;

  if (projectId) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, Number(projectId)),
    });
    controllerAddress = project?.allowanceControllerAddress || null;
  }

  const addr = controllerAddress || process.env.ALLOWANCE_CONTROLLER_ADDRESS;
  if (!addr) {
    return NextResponse.json({ error: "No controller address found" }, { status: 404 });
  }

  try {
    const chain = getViemChain();
    const client = createPublicClient({ chain, transport: http() });

    const [owner, delegate, token, dailyLimit, spentToday, remaining] = await Promise.all([
      client.readContract({ address: addr as `0x${string}`, abi: CONTROLLER_ABI, functionName: "owner" }),
      client.readContract({ address: addr as `0x${string}`, abi: CONTROLLER_ABI, functionName: "delegate" }),
      client.readContract({ address: addr as `0x${string}`, abi: CONTROLLER_ABI, functionName: "token" }),
      client.readContract({ address: addr as `0x${string}`, abi: CONTROLLER_ABI, functionName: "dailyLimit" }),
      client.readContract({ address: addr as `0x${string}`, abi: CONTROLLER_ABI, functionName: "spentToday" }),
      client.readContract({ address: addr as `0x${string}`, abi: CONTROLLER_ABI, functionName: "remainingAllowance" }),
    ]);

    const balance = await client.readContract({
      address: token as `0x${string}`,
      abi: USDC_ABI,
      functionName: "balanceOf",
      args: [addr as `0x${string}`],
    });

    return NextResponse.json({
      address: addr,
      owner,
      delegate,
      token,
      balance: (Number(balance) / 1_000_000).toFixed(2),
      dailyLimit: (Number(dailyLimit) / 1_000_000).toFixed(2),
      spentToday: (Number(spentToday) / 1_000_000).toFixed(2),
      remaining: (Number(remaining) / 1_000_000).toFixed(2),
    });
  } catch (err: any) {
    console.error("[/api/dao/controller-info]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
