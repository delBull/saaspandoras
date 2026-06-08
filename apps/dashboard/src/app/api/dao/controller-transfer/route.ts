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
  "function acceptOwnership() external",
  "function owner() view returns (address)",
  "function pendingOwner() view returns (address)",
]);

function getControllerAddress(): `0x${string}` {
  return (process.env.ALLOWANCE_CONTROLLER_ADDRESS || "0x2E15a2e05a7d7399dB003e014aCB1De03Cea5cc9") as `0x${string}`;
}

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

    const safeAddress = project.allowanceControllerAddress as `0x${string}` | null;
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

    const pendingOwner = await publicClient.readContract({
      address: controllerAddress,
      abi: CONTROLLER_ABI,
      functionName: "pendingOwner",
    }) as `0x${string}`;

    // Already transferred — check if Safe is already owner or pending
    if (currentOwner.toLowerCase() === safeAddress.toLowerCase()) {
      return NextResponse.json({
        message: "AllowanceController is already owned by the Safe",
        safeAddress, controllerAddress, step: "done",
      });
    }

    const isPending = pendingOwner.toLowerCase() === safeAddress.toLowerCase();

    if (!isPending) {
      // ── STEP 1: Nominate Safe as pendingOwner ──────────────────────────
      const txData = encodeFunctionData({
        abi: CONTROLLER_ABI,
        functionName: "transferOwnership",
        args: [safeAddress],
      });

      const gasEstimate = await publicClient.estimateGas({
        account: currentOwner,
        to: controllerAddress,
        data: txData,
      });

      const fee = await publicClient.estimateFeesPerGas();
      const chainId = await publicClient.getChainId();
      const ownerNonce = await publicClient.getTransactionCount({ address: currentOwner });

      if (!signedTx) {
        return NextResponse.json({
          step: "nominate",
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
          message: `Step 1/2: Nominate Safe as pending owner. Sign this tx from ${currentOwner.slice(0, 6)}...`,
        });
      }

      // Validate and broadcast nomination tx
      const parsedTx = parseTransaction(signedTx as `0x${string}`);

      if (parsedTx.to?.toLowerCase() !== controllerAddress.toLowerCase()) {
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

      const txHash = await publicClient.sendRawTransaction({ serializedTransaction: signedTx as `0x${string}` });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      return NextResponse.json({
        step: "nominated",
        success: true,
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber.toString(),
        controllerAddress,
        message: `Safe nominated as pendingOwner. Now execute Step 2 from the Safe: call acceptOwnership() on the controller.`,
      });
    }

    // ── STEP 2: Safe needs to acceptOwnership ────────────────────────────
    // This tx must be executed FROM the Safe (via Safe multisig tx)
    const acceptTxData = encodeFunctionData({
      abi: CONTROLLER_ABI,
      functionName: "acceptOwnership",
    });

    return NextResponse.json({
      step: "accept",
      controllerAddress,
      currentOwner,
      pendingOwner: safeAddress,
      acceptTx: {
        to: controllerAddress,
        data: acceptTxData,
        value: "0x0",
      },
      message: `Step 2/2: Safe ${safeAddress.slice(0, 6)}... has been nominated. Execute acceptOwnership() via Safe multisig interface to complete the transfer.`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Controller transfer failed: ${e.message}` }, { status: 500 });
  }
}

export const POST = withSecurity(handler, { rateLimit: withdrawRateLimiter });
