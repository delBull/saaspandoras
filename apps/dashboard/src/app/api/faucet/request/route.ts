import { NextResponse } from 'next/server';
import { db } from '@/db';
import { actionLogs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { prepareTransaction, sendTransaction, waitForReceipt } from 'thirdweb';
import { privateKeyToAccount } from 'thirdweb/wallets';
import { client } from '@/lib/thirdweb-client';
import { config } from '@/config';
import crypto from 'crypto';

export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        console.log("💧 [FAUCET] ========== REQUEST RECEIVED ==========");
        
        // 1. Verify we are NOT in production
        if (process.env.NODE_ENV === 'production') {
             console.error("❌ [FAUCET] Request denied: Faucet is not available in production.");
             return NextResponse.json({ error: "El Faucet de pruebas no está disponible en producción." }, { status: 403 });
        }

        const body = await request.json();
        const { walletAddress } = body;

        if (!walletAddress) {
            return NextResponse.json({ error: "Missing wallet address" }, { status: 400 });
        }

        const walletAddressLower = walletAddress.toLowerCase();
        console.log(`💧 Faucet Attempt: ${walletAddressLower}`);

        // 2. Check Sybil/Rate Limiting in actionLogs
        const existingClaim = await db.query.actionLogs.findFirst({
            where: and(
                eq(actionLogs.actionType, 'FAUCET_CLAIM'),
                // We use metadata->>walletAddress for filtering or just fetch and filter
            )
        });
        
        // Drizzle jsonb query is a bit tricky, let's fetch recent claims limited to this exact user or just query all recent and filter
        // Actually since we only want 1 per wallet, we can do a raw query or just fetch where correlationId = walletAddress
        const userClaim = await db.query.actionLogs.findFirst({
            where: and(
                eq(actionLogs.actionType, 'FAUCET_CLAIM'),
                eq(actionLogs.correlationId, `faucet_${walletAddressLower}`)
            )
        });

        if (userClaim) {
            console.error(`❌ [FAUCET] Wallet already claimed: ${walletAddressLower}`);
            return NextResponse.json({ error: "Ya has solicitado Sepolia ETH de prueba anteriormente. Utiliza tus fondos actuales." }, { status: 429 });
        }

        // 3. Setup Relayer Account
        const privateKey = process.env.PROTOCOL_ADMIN_PRIVATE_KEY || process.env.MINTER_PRIVATE_KEY;
        if (!privateKey) {
             console.error("❌ [FAUCET] Treasury Private Key is not defined");
             return NextResponse.json({ error: "Error de configuración de tesorería" }, { status: 500 });
        }

        const account = privateKeyToAccount({ client, privateKey });

        // 4. Send Transaction (0.01 Sepolia ETH)
        const amountToSend = BigInt(0.01 * 1e18);
        console.log(`💧 Sending 0.01 ETH to ${walletAddressLower}...`);

        const transaction = prepareTransaction({
            to: walletAddressLower,
            value: amountToSend,
            chain: config.chain,
            client
        });

        const txResult = await sendTransaction({ account, transaction });
        console.log(`💧 Transaction Sent: ${txResult.transactionHash}`);

        // Wait for receipt to ensure it landed
        await waitForReceipt({
            client,
            chain: config.chain,
            transactionHash: txResult.transactionHash
        });
        
        console.log(`✅ [FAUCET] Transaction Confirmed: ${txResult.transactionHash}`);

        // 5. Log Action
        await db.insert(actionLogs).values({
            id: crypto.randomUUID(),
            actionType: 'FAUCET_CLAIM',
            correlationId: `faucet_${walletAddressLower}`,
            metadata: {
                walletAddress: walletAddressLower,
                amount: '0.01',
                txHash: txResult.transactionHash
            }
        });

        return NextResponse.json({ 
            success: true, 
            txHash: txResult.transactionHash,
            message: "¡0.01 Sepolia ETH enviados correctamente!"
        });

    } catch (error: any) {
        console.error("❌ [FAUCET] Error:", error);
        // Specifically look for insufficient funds on the treasury side
        if (error.message?.includes('insufficient funds')) {
             return NextResponse.json({ error: "La tesorería de pruebas se ha quedado sin Sepolia ETH temporalmente." }, { status: 500 });
        }
        return NextResponse.json({ error: "Error interno al procesar la solicitud del Faucet" }, { status: 500 });
    }
}
