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
import { getAuth } from "~/lib/auth";
import { headers } from "next/headers";
import { withSecurity, withdrawRateLimiter, isValidWalletAddress } from "~/lib/security-utils";

const CONTROLLER_ABI = parseAbi([
  "function ownerWithdraw(address to, uint256 amount) external",
  "function owner() view returns (address)",
]);

const OWNER_WITHDRAW_SIG = "ownerWithdraw(address,uint256)";

function getControllerAddress(): `0x${string}` {
  return (process.env.ALLOWANCE_CONTROLLER_ADDRESS || "0x2E15a2e05a7d7399dB003e014aCB1De03Cea5cc9") as `0x${string}`;
}

function getViemChain() {
  return process.env.NODE_ENV === 'production' ? base : sepolia;
}

async function handler(request: Request): Promise<Response> {
  try {
    const authHeaders = await headers();
    const { session } = await getAuth(authHeaders);
    if (!session?.address) {
      return NextResponse.json({ error: "Unauthorized — session required" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, mode, amount, to, signedTx } = body;

    if (!projectId || !mode) {
      return NextResponse.json({ error: "projectId and mode (prepare|execute) are required" }, { status: 400 });
    }

    if (!["prepare", "execute"].includes(mode)) {
      return NextResponse.json({ error: "mode must be 'prepare' or 'execute'" }, { status: 400 });
    }

    const chain = getViemChain();
    const publicClient = createPublicClient({ chain, transport: http() });
    const controllerAddress = getControllerAddress();
    const chainId = await publicClient.getChainId();

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      columns: { id: true, slug: true, applicantWalletAddress: true, allowanceControllerAddress: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.applicantWalletAddress?.toLowerCase() !== session.address.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden — not the project owner" }, { status: 403 });
    }

    const ownerWallet = session.address as `0x${string}`;

    if (mode === "prepare") {
      if (!amount || !to) {
        return NextResponse.json({ error: "amount and to are required in prepare mode" }, { status: 400 });
      }

      if (!isValidWalletAddress(to)) {
        return NextResponse.json({ error: "Invalid recipient address" }, { status: 400 });
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      }

      const amountWei = BigInt(Math.round(amountNum * 1_000_000));

      const currentOwner = await publicClient.readContract({
        address: controllerAddress,
        abi: CONTROLLER_ABI,
        functionName: "owner",
      }) as `0x${string}`;

      if (currentOwner.toLowerCase() !== ownerWallet.toLowerCase()) {
        return NextResponse.json({
          error: `You are not the current controller owner. On-chain owner: ${currentOwner}`,
        }, { status: 403 });
      }

      const txData = encodeFunctionData({
        abi: CONTROLLER_ABI,
        functionName: "ownerWithdraw",
        args: [to as `0x${string}`, amountWei],
      });

      const gasEstimate = await publicClient.estimateGas({
        account: ownerWallet,
        to: controllerAddress,
        data: txData,
      });

      const fee = await publicClient.estimateFeesPerGas();
      const chainId = await publicClient.getChainId();
      const ownerNonce = await publicClient.getTransactionCount({ address: ownerWallet });

      return NextResponse.json({
        mode: "prepare",
        controllerAddress,
        owner: ownerWallet,
        recipient: to,
        amount: amountNum.toFixed(6),
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
        message: `Withdraw ${amountNum.toFixed(6)} USDC from AllowanceController to ${to}`,
      });
    }

    if (!signedTx) {
      return NextResponse.json({ error: "signedTx is required in execute mode" }, { status: 400 });
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
        if (decoded.functionName !== "ownerWithdraw") {
          return NextResponse.json({ error: "Signed tx does not call ownerWithdraw" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Signed tx data cannot be decoded as ownerWithdraw" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Signed tx has no data" }, { status: 403 });
    }

    const txHash = await publicClient.sendRawTransaction({
      serializedTransaction: signedTx as `0x${string}`,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    return NextResponse.json({
      mode: "execute",
      success: receipt.status === "success",
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber.toString(),
      controllerAddress,
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Owner withdraw failed: ${e.message}` }, { status: 500 });
  }
}

export const POST = withSecurity(handler, { rateLimit: withdrawRateLimiter });
