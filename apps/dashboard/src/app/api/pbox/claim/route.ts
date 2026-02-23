import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { gamificationProfiles, pboxClaims, securityEvents, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';

// Import ABI and config
import PBOXTokenArtifact from '../../../../../../../packages/protocol-deployer/artifacts/contracts/core/PBOXToken.sol/PBOXToken.json';

const PBOX_TOKEN_ADDRESS = process.env.PBOX_TOKEN_ADDRESS || '';
const MINTER_PRIVATE_KEY = process.env.MINTER_PRIVATE_KEY || '';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia-api.lisk.com'; // Default Lisk Sepolia
const MIN_CLAIM_THRESHOLD = 50; // Minimum points required to claim
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

/**
 * POST /api/pbox/claim
 * Endpoint to claim PBOX tokens (Approach A: Backend Minting)
 * Requires valid JWT in Authorization header or cookie.
 */
export async function POST(request: NextRequest) {
    try {
        console.log("🚀 [PBOX Claim API] Received claim request");

        // 1. Authenticate Request
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1] || request.cookies.get('__session')?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
        }

        let decodedToken: any;
        try {
            decodedToken = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
        }

        const userId = decodedToken.sub;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized: Invalid token payload" }, { status: 401 });
        }

        console.log(`👤 [PBOX Claim API] User authenticated: ${userId}`);

        // 2. Validate User and Status
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId)
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.status !== 'ACTIVE') {
            return NextResponse.json({ error: "Identity is currently restricted or frozen", status: user.status }, { status: 403 });
        }

        if (!user.walletAddress) {
            return NextResponse.json({ error: "Verification required: Please link a wallet to claim PBOX" }, { status: 400 });
        }

        // 3. Load Gamification Profile & Calculate Claimable PBOX
        const profile = await db.query.gamificationProfiles.findFirst({
            where: eq(gamificationProfiles.userId, userId)
        });

        if (!profile) {
            return NextResponse.json({ error: "No gamification profile found for this user" }, { status: 400 });
        }

        const claimablePBOX = profile.totalPoints - profile.claimedPoints;

        console.log(`📊 [PBOX Claim API] Balances - Total: ${profile.totalPoints}, Claimed: ${profile.claimedPoints}, Claimable: ${claimablePBOX}`);

        if (claimablePBOX <= 0) {
            return NextResponse.json({ error: "No PBOX available to claim" }, { status: 400 });
        }

        if (claimablePBOX < MIN_CLAIM_THRESHOLD) {
            return NextResponse.json({ error: `You need at least ${MIN_CLAIM_THRESHOLD} PBOX to claim` }, { status: 400 });
        }

        // 4. Rate Limiting Check (Simple off-chain limit, e.g., 1 claim per 24hrs)
        if (profile.lastClaimedAt) {
            const timeSinceLastClaim = Date.now() - profile.lastClaimedAt.getTime();
            const oneDayMs = 24 * 60 * 60 * 1000;
            if (timeSinceLastClaim < oneDayMs) {
                return NextResponse.json({ error: "Rate limit exceeded: You can only claim PBOX once every 24 hours" }, { status: 429 });
            }
        }

        // 5. Initialize Claim Tracking for Idempotency
        // This prevents race conditions or double clicks
        console.log(`📝 [PBOX Claim API] Registering pending claim...`);
        const pendingClaimResult = await db.insert(pboxClaims).values({
            userId: userId,
            walletAddress: user.walletAddress,
            amount: claimablePBOX,
            status: 'PENDING',
        }).returning({ claimId: pboxClaims.id });

        const claimRecord = pendingClaimResult[0];

        if (!claimRecord?.claimId) {
            throw new Error("Failed to initialize claim record.");
        }

        const claimId = claimRecord.claimId;

        console.log(`🔗 [PBOX Claim API] Executing Minting Transaction...`);
        let txHash: string | null = null;

        // 6. Execute On-Chain Transaction
        try {
            if (!MINTER_PRIVATE_KEY || !PBOX_TOKEN_ADDRESS) {
                console.error("❌ Environment configuration missing for minting.");
                // Dev mock handling for local dev if needed
                if (process.env.NODE_ENV === 'development') {
                    txHash = `0xmock_tx_${Date.now()}`;
                    console.warn("⚠️ Running in DEV mode without real keys. Proceeding with MOCK transaction.");
                } else {
                    throw new Error("Server misconfiguration: Minter keys missing.");
                }
            } else {
                const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
                const signer = new ethers.Wallet(MINTER_PRIVATE_KEY, provider);
                const pboxContract = new ethers.Contract(PBOX_TOKEN_ADDRESS, PBOXTokenArtifact.abi, signer);

                // Assuming reason 0 is REWARD according to MintReason Enum (REWARD, GAMIFICATION, STAKING, MIGRATION, VOUCHER_CLAIM, OTHER)
                // Sending exact wei formatted amount. E.g if 1 point = 1 PBOX token (18 decimals)
                const amountInWei = ethers.utils.parseUnits(claimablePBOX.toString(), 18);
                const mintReasonEnum = 0; // REWARD

                const tx = await pboxContract.mint(user.walletAddress, amountInWei, mintReasonEnum);
                console.log(`⏳ [PBOX Claim API] Transaction submitted: ${tx.hash}`);

                // Wait for confirmation
                const receipt = await tx.wait();
                txHash = receipt.hash;
                console.log(`✅ [PBOX Claim API] Transaction confirmed in block: ${receipt.blockNumber}`);
            }
        } catch (chainError: any) {
            console.error(`❌ [PBOX Claim API] Blockchain transaction failed:`, chainError);

            // Update claim record as failed
            await db.update(pboxClaims)
                .set({ status: 'FAILED', updatedAt: new Date() })
                .where(eq(pboxClaims.id, claimId));

            return NextResponse.json({ error: "Failed to mint tokens on the blockchain. Try again later." }, { status: 500 });
        }

        // 7. Settlement (Transaction successful, update database)
        console.log(`💾 [PBOX Claim API] Updating gamification profile...`);
        await db.update(gamificationProfiles)
            .set({
                claimedPoints: profile.claimedPoints + claimablePBOX,
                lastClaimedAt: new Date(),
                updatedAt: new Date()
            })
            .where(eq(gamificationProfiles.userId, userId));

        // Mark claim as Confirmed
        await db.update(pboxClaims)
            .set({ status: 'CONFIRMED', txHash: txHash, updatedAt: new Date() })
            .where(eq(pboxClaims.id, claimId));

        // Log Security Event
        await db.insert(securityEvents).values({
            userId,
            type: 'PBOX_CLAIM',
            metadata: {
                amount: claimablePBOX,
                txHash: txHash,
                walletAddress: user.walletAddress,
                claimId: claimId
            }
        });

        console.log(`🎉 [PBOX Claim API] Claim process completed successfully for ${userId}`);

        return NextResponse.json({
            success: true,
            message: "Tokens claimed successfully",
            claimedAmount: claimablePBOX,
            txHash: txHash
        });

    } catch (error) {
        console.error("❌ PBOX Claim API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
