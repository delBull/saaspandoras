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
import { sql } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import type { ProtocolTelegramCapabilities } from '@pandoras/gamification/types/bridge';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        const rows = await db.execute(sql`
      SELECT
        id, title, slug, status,
        license_contract_address,
        contract_address,
        w2e_config
      FROM projects
      WHERE slug = ${slug}
        AND status IN ('approved', 'live', 'completed')
      LIMIT 1
    `);

        if (rows.length === 0) {
            return Response.json({ error: 'Protocol not found' }, { status: 404 });
        }

        const project = rows[0] as any;
        const w2e = project.w2e_config ?? {};

        // Resolve artifacts from w2eConfig (V2 schema)
        const artifacts: any[] = w2e.artifacts ?? [];
        const primaryArtifact = artifacts.find((a: any) => a.isPrimary) ?? artifacts[0] ?? null;

        // Resolve contract address (same 4-field fallback as sidebar)
        const resolvedContract =
            project.license_contract_address ||
            w2e.licenseToken?.address ||
            project.contract_address ||
            null;

        const isV2 = w2e.schema === 'v2';
        const isDeployed = !!resolvedContract;
        const hasFreeArtifact = primaryArtifact && !primaryArtifact.price;

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
            slug: project.slug,
            title: project.title,
            status: project.status,
            protocolVersion: isV2 ? 2 : 1,
            registryContractAddress: resolvedContract,
            artifacts: artifacts.map((a: any) => ({
                type: a.type,
                name: a.name,
                symbol: a.symbol,
                address: a.address ?? null,
                isPrimary: a.isPrimary ?? false,
                price: a.price ?? null,
            })),
            primaryArtifact: primaryArtifact
                ? {
                    type: primaryArtifact.type,
                    name: primaryArtifact.name,
                    symbol: primaryArtifact.symbol,
                    address: primaryArtifact.address ?? null,
                }
                : null,
            capabilities,
        });
    } catch (err) {
        console.error('[/api/telegram/protocol] Error:', err);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
