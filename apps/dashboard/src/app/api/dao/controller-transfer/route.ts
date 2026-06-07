import { NextResponse } from "next/server";
import {
  createPublicClient,
  http,
  encodeFunctionData,
  parseAbi,
  parseTransaction,
  decodeFunctionData,
} from "viem";
import { sepolia, base } from "viem/chains";
import { db } from "~/db";
import { projects } from "~/db/schema";
import { eq } from "drizzle-orm";
import { withSecurity, withdrawRateLimiter } from "~/lib/security-utils";

const CONTROLLER_ABI = parseAbi([
  "function transferOwnership(address newOwner) external",
  "function owner() view returns (address)",
]);

function getControllerAddress(): `0x${string}` {
  return (process.env.ALLOWANCE_CONTROLLER_ADDRESS || "0x2E15a2e05a7d7399dB003e014aCB1De03Cea5cc9") as `0x${string}`;
}

const TRANSFER_OWNERSHIP_SIG = "transferOwnership(address)";

function getViemChain() {
  return process.env.NODE_ENV === 'production' ? base : sepolia;
}

interface TransferRequest {
  projectId: number;
  signedTx?: string;
}

async function handler(request: Request): Promise<Response> {
  try {
    const body: TransferRequest = await request.json();
    const { projectId, signedTx } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const chain = getViemChain();
    const publicClient = createPublicClient({ chain, transport: http() });
    const controllerAddress = getControllerAddress();

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      columns: { id: true, slug: true, allowanceControllerAddress: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const safeAddress = project.allowanceControllerAddress;
    if (!safeAddress) {
      return NextResponse.json(
        { error: "Project does not have a Safe deployed yet. Use POST /api/dao/deploy-safe first." },
        { status: 400 },
      );
    }

    const currentOwner = await publicClient.readContract({
      address: controllerAddress,
      abi: CONTROLLER_ABI,
      functionName: "owner",
    }) as `0x${string}`;

    if (currentOwner.toLowerCase() === safeAddress.toLowerCase()) {
      return NextResponse.json({ message: "AllowanceController is already owned by the Safe", safeAddress, controllerAddress });
    }

    const txData = encodeFunctionData({
      abi: CONTROLLER_ABI,
      functionName: "transferOwnership",
      args: [safeAddress as `0x${string}`],
    });

    const gasEstimate = await publicClient.estimateGas({
      account: currentOwner,
      to: controllerAddress,
      data: txData,
    });

    const fee = await publicClient.estimateFeesPerGas();
    const chainId = await publicClient.getChainId();
    const ownerNonce = await publicClient.getTransactionCount({ address: currentOwner as `0x${string}` });

    if (!signedTx) {
      return NextResponse.json({
        mode: "prepare",
        controllerAddress,
        currentOwner,
        newOwner: safeAddress,
        tx: {
          to: controllerAddress,
          data: txData,
          value: "0x0",
          gas: gasEstimate.toString(),
          maxFeePerGas: fee.maxFeePerGas.toString(),
          maxPriorityFeePerGas: fee.maxPriorityFeePerGas.toString(),
          nonce: ownerNonce,
          chainId,
        },
        message: `Sign this transaction to transfer AllowanceController ownership to Safe ${safeAddress}`,
      });
    }

    const parsedTx = parseTransaction(signedTx as `0x${string}`);

    if ((parsedTx.to as string | undefined)?.toLowerCase() !== controllerAddress.toLowerCase()) {
      return NextResponse.json({ error: "Signed tx target does not match AllowanceController address" }, { status: 403 });
    }

    if (parsedTx.value && parsedTx.value > 0n) {
      return NextResponse.json({ error: "Signed tx has non-zero value (suspicious)" }, { status: 403 });
    }

    if (parsedTx.chainId && parsedTx.chainId !== chainId) {
      return NextResponse.json({ error: "Signed tx chainId does not match" }, { status: 403 });
    }

    if (parsedTx.data) {
      try {
        const decoded = decodeFunctionData({ abi: CONTROLLER_ABI, data: parsedTx.data as `0x${string}` });
        if (decoded.functionName !== "transferOwnership") {
          return NextResponse.json({ error: "Signed tx does not call transferOwnership" }, { status: 403 });
        }
        const args = decoded.args as readonly [string];
        if (args[0].toLowerCase() !== safeAddress.toLowerCase()) {
          return NextResponse.json({ error: "Signed tx transfers ownership to wrong address" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Signed tx data cannot be decoded as transferOwnership" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Signed tx has no data" }, { status: 403 });
    }

    const txHash = await publicClient.sendRawTransaction({
      serializedTransaction: signedTx as `0x${string}`,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    const newOwner = await publicClient.readContract({
      address: controllerAddress,
      abi: CONTROLLER_ABI,
      functionName: "owner",
    }) as `0x${string}`;

    const success = newOwner.toLowerCase() === safeAddress.toLowerCase();

    return NextResponse.json({
      mode: "execute",
      success,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber.toString(),
      controllerAddress,
      previousOwner: currentOwner,
      currentOwner: newOwner,
      expectedOwner: safeAddress,
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Controller transfer failed: ${e.message}` }, { status: 500 });
  }
}

export const POST = withSecurity(handler, { rateLimit: withdrawRateLimiter });
