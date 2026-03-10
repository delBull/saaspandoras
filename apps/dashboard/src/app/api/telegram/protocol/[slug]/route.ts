/**
 * GET /api/telegram/protocol/[slug]
 *
 * Read-only protocol data for the Telegram App.
 * Returns only what the bot needs: artifacts, registry, and capabilities.
 *
 * ✅ Bot CAN: read protocol info, check artifact types, display capabilities
 * ❌ Bot CANNOT: see governance data, admin fields, or raw w2eConfig
 *
 * `capabilities` tells the bot what actions are available — the bot
 * should NEVER infer this logic itself.
 */
import { db } from '@/db';
import { sql, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import type { ProtocolTelegramCapabilities } from '@pandoras/gamification/types/bridge';
import { readContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { client } from "@/lib/thirdweb-client";
import { getContract } from "thirdweb";
import { telegramBindings } from '@/db/schema';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const { searchParams } = new URL(req.url);
        let wallet = searchParams.get('wallet');
        const telegramId = searchParams.get('telegramId');

        // Resolve wallet from telegramId if not provided directly
        if (!wallet && telegramId) {
            const binding = await db.query.telegramBindings.findFirst({
                where: eq(telegramBindings.telegramUserId, telegramId)
            });
            if (binding) wallet = binding.walletAddress;
        }

        const rows = await db.execute(sql`
      SELECT
        id, title, slug, status,
        license_contract_address,
        contract_address,
        w2e_config,
        protocol_version,
        chain_id
      FROM projects
      WHERE slug = ${slug}
        AND status IN ('approved', 'live', 'completed')
      LIMIT 1
    `);

        if (rows.length === 0) {
            return Response.json({ error: 'Protocol not found' }, { status: 404 });
        }

        const project = rows[0] as any;
        const w2e = typeof project.w2e_config === 'string'
            ? JSON.parse(project.w2e_config)
            : (project.w2e_config ?? {});

        // Resolve artifacts from w2eConfig (V2 schema)
        const artifacts: any[] = w2e.artifacts ?? [];
        const primaryArtifact = artifacts.find((a: any) => a.isPrimary) ?? artifacts[0] ?? null;

        // Resolve contract address (same 4-field fallback as sidebar)
        const resolvedContract =
            project.license_contract_address ||
            w2e.licenseToken?.address ||
            project.contract_address ||
            null;

        const isV2 = project.protocol_version === 2 || w2e.schema === 'v2';
        const isDeployed = !!resolvedContract;
        const hasFreeArtifact = primaryArtifact && !primaryArtifact.price;

        // ── Access check (hasAccess) ──────────────────────────────────────
        let hasAccess = false;
        if (wallet && resolvedContract && project.chain_id) {
            try {
                const contract = getContract({
                    client,
                    chain: defineChain(Number(project.chain_id)),
                    address: resolvedContract
                });
                const balance = await readContract({
                    contract,
                    method: "function balanceOf(address) view returns (uint256)",
                    params: [wallet as `0x${string}`]
                });
                hasAccess = Number(balance) > 0;
            } catch (e) {
                console.error('[API] Access check failed:', e);
            }
        }

        // ── Capabilities (bot reads this, never infers) ────────────────────
        const capabilities: ProtocolTelegramCapabilities = {
            canMintFreeArtifact:
                !!process.env.TELEGRAM_ENABLE_MINT_FREE_ARTIFACT &&
                isDeployed &&
                !!hasFreeArtifact,
            canClaimPBOX:
                !!process.env.TELEGRAM_ENABLE_CLAIMS &&
                !!process.env.PBOX_CLAIM_ENABLED,
            supportsGamification:
                !!process.env.ALLOW_TELEGRAM_GAMIFICATION,
        };

        return Response.json({
            id: project.id.toString(),
            slug: project.slug,
            title: project.title,
            name: project.title, // MiniApp uses name
            status: project.status,
            protocolVersion: isV2 ? 2 : 1,
            registryContractAddress: resolvedContract,
            hasAccess,
            artifacts: artifacts.map((a: any) => ({
                type: a.type,
                name: a.name,
                symbol: a.symbol,
                address: a.address ?? null,
                isPrimary: a.isPrimary ?? false,
                price: a.price ?? null,
                unlocked: hasAccess || (a.isPrimary && !a.price), // Simplified logic matching MiniApp expectations
            })),
            primaryArtifact: primaryArtifact
                ? {
                    type: primaryArtifact.type,
                    name: primaryArtifact.name,
                    symbol: primaryArtifact.symbol,
                    address: primaryArtifact.address ?? null,
                }
                : null,
            w2eConfig: w2e,
            capabilities,
        });
    } catch (err) {
        console.error('[/api/telegram/protocol] Error:', err);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
