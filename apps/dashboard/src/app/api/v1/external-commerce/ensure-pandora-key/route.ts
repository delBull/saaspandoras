import { NextResponse } from 'next/server';
import { getContract, readContract, prepareContractCall, sendTransaction } from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";
import { client } from "@/lib/thirdweb-client";
import { config } from "@/config";
import { PANDORAS_KEY_ABI } from "@/lib/pandoras-key-abi";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/v1/external-commerce/ensure-pandora-key
 * 
 * "Invisible" Handshake that ensures a user has a Pandora's Key.
 * If missing, it triggers a background sponsored mint.
 */
export async function POST(req: Request) {
    try {
        const { wallet, projectId } = await req.json();

        if (!wallet) {
            return NextResponse.json({ error: 'Missing wallet address' }, { status: 400 });
        }

        const walletLower = wallet.toLowerCase();

        // 🧬 Step 0: Resolve Protocol Context (if provided)
        let project: any = null;
        if (projectId) {
            project = await db.query.projects.findFirst({
                where: (projects, { eq }) => eq(projects.id, Number(projectId))
            });
        }

        // ── 1. GLOBAL ACCESS: PANDORA'S KEY ───────────────────────────────────────
        
        // Check if user already has the key (Fast DB check first)
        const user = await db.query.users.findFirst({
            where: eq(users.walletAddress, walletLower)
        });

        const keyContract = getContract({
            client,
            chain: config.chain,
            address: config.nftContractAddress,
            abi: PANDORAS_KEY_ABI
        });

        let hasPandorasKey = user?.hasPandorasKey || false;

        if (!hasPandorasKey) {
            try {
                hasPandorasKey = await readContract({
                    contract: keyContract,
                    method: "isGateHolder",
                    params: [walletLower]
                });
            } catch (e) {
                hasPandorasKey = false;
            }
        }

        // Trigger background mint for Pandora's Key if missing
        if (!hasPandorasKey) {
            const relayKey = process.env.RELAY_PRIVATE_KEY;
            if (relayKey && relayKey !== "0x_production_private_key") {
                try {
                    const adminAccount = privateKeyToAccount({ client, privateKey: relayKey as `0x${string}` });
                    const tx = prepareContractCall({ contract: keyContract, method: "adminMint", params: [walletLower] });
                    await sendTransaction({ transaction: tx, account: adminAccount });
                    hasPandorasKey = true;
                    console.log(`✅ [Handshake] Global Key minted for ${walletLower}`);
                } catch (e) {
                    console.error("[Handshake] Global Key mint failed:", e);
                }
            }
        }

        // ── 2. PROTOCOL ACCESS: ACCESS CARD (LICENSE) ───────────────────────────
        
        let hasProtocolAccess = false;
        const licenseAddress = project?.licenseContractAddress;

        if (licenseAddress && licenseAddress !== "0x0000000000000000000000000000000000000000") {
            const licenseContract = getContract({
                client,
                chain: config.chain,
                address: licenseAddress
            });

            // Check balance/ownership
            try {
                const balance = await readContract({
                    contract: licenseContract,
                    method: "function balanceOf(address) view returns (uint256)",
                    params: [walletLower]
                });
                hasProtocolAccess = Number(balance) > 0;
            } catch (e) {
                console.warn(`[Handshake] Protocol access check failed for ${licenseAddress}:`, e);
            }

            // Auto-mint protocol Access Card if missing
            if (!hasProtocolAccess) {
                const relayKey = process.env.RELAY_PRIVATE_KEY;
                if (relayKey && relayKey !== "0x_production_private_key") {
                    try {
                        const adminAccount = privateKeyToAccount({ client, privateKey: relayKey as `0x${string}` });
                        
                        // Try adminMint first (Standard Pass), fallback to mint (SBT)
                        let mintTx;
                        try {
                            mintTx = prepareContractCall({
                                contract: licenseContract,
                                method: "function adminMint(address to)",
                                params: [walletLower]
                            });
                        } catch (e) {
                            mintTx = prepareContractCall({
                                contract: licenseContract,
                                method: "function mint(address to)",
                                params: [walletLower]
                            });
                        }

                        await sendTransaction({ transaction: mintTx, account: adminAccount });
                        hasProtocolAccess = true;
                        console.log(`✅ [Handshake] Protocol Access Card minted for ${walletLower} (Project: ${project.slug})`);
                    } catch (e) {
                        console.error("[Handshake] Protocol Access Card mint failed:", e);
                    }
                }
            }
        }

        // ── 3. GLOBAL SYNC: DB & MARKETING ─────────────────────────────────────
        
        let dbUserId = user?.id;

        if (hasPandorasKey) {
            if (user) {
                await db.update(users).set({ hasPandorasKey: true, updatedAt: new Date() }).where(eq(users.id, user.id));
            } else {
                // 🧬 Phase 90: Silent Pre-Registration
                // Creates the user record so the platform recognizes them immediately
                dbUserId = crypto.randomUUID();
                try {
                    await db.insert(users).values({
                        id: dbUserId,
                        walletAddress: walletLower,
                        hasPandorasKey: true,
                        connectionCount: 1,
                        lastConnectionAt: new Date(),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        acquisitionSource: "external_handshake",
                        walletVerified: true
                    }).onConflictDoNothing();
                    console.log(`🆕 [Handshake] Silent registration for ${walletLower}`);
                } catch (e) {
                    console.warn("[Handshake] Pre-registration skipped (likely conflict):", e);
                }
            }

            // Trigger Marketing Events
            try {
                const origin = new URL(req.url).origin;
                const events = [];
                
                events.push({
                    event: 'IDENTITY_VERIFIED',
                    walletAddress: walletLower,
                    userId: dbUserId,
                    metadata: { source: 'external_handshake', hasPandorasKey: true }
                });

                if (hasProtocolAccess) {
                    events.push({
                        event: 'ACCESS_CARD_ACQUIRED',
                        projectId: project?.id,
                        walletAddress: walletLower,
                        metadata: { source: 'external_handshake', projectSlug: project?.slug }
                    });
                }

                // Fire events to tracking engine
                for (const ev of events) {
                    fetch(`${origin}/api/v1/marketing/events`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(ev)
                    }).catch(() => {});
                }
            } catch (e) {
                console.warn("[Handshake] Sync failed:", e);
            }
        }

        return NextResponse.json({ 
            success: true, 
            hasPandorasKey, 
            hasProtocolAccess,
            wallet: walletLower 
        });

    } catch (error) {
        console.error('[Handshake] Fatal Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
