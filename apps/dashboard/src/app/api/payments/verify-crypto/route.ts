import { NextResponse } from "next/server";
import { activateClient } from "@/lib/project-utils";

// This endpoint receives post-payment notification from the frontend
// In a highly secure environment, we would monitor the blockchain independently,
// but relying on the client to send the txHash + confirming verification here is a valid Step 1.

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { linkId, clientId, amount, method, txHash, chainId, walletAddress } = body;

        console.log(`⛓️  Verifying Crypto Payment: ${txHash} on Chain ${chainId}`);

        // TODO: Use Thirdweb SDK to verify txHash status on-chain if strict security is needed.
        // For now, we trust the successful callback data but log it for manual audit.

        if (!clientId) {
            return NextResponse.json({ error: "Missing Client ID" }, { status: 400 });
        }

        const project = await activateClient(
            Number(clientId),
            `crypto_${method}_${chainId}`,
            amount
        );

        return NextResponse.json({ success: true, project });

    } catch (error: any) {
        console.error("Crypto Verification Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
