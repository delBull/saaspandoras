#!/usr/bin/env bun
/**
 * migrate-v1-to-v2.ts
 * Semi-automatic V1 → V2 migration script for Pandoras protocols.
 *
 * Usage:
 *   bun run migrate-v1-to-v2.ts             # dry-run (safe, no writes)
 *   bun run migrate-v1-to-v2.ts --apply     # write to DB
 *   bun run migrate-v1-to-v2.ts --slug abc  # single protocol
 */

import { db } from './src/db';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { ArtifactType } from './src/app/()/projects/types';

const isDryRun = !process.argv.includes('--apply');
const targetSlug = process.argv.includes('--slug')
    ? process.argv[process.argv.indexOf('--slug') + 1]
    : null;

// ── Heuristic: infer artifact type from V1 project fields ─────────────────────
function inferArtifactType(project: any): ArtifactType {
    // Priority rules (order matters)
    // Note: only count lockup_period; fund_usage alone is not a strong Membership signal
    if (project.lockup_period) return 'Membership';
    if (project.worktoearnMecanism || project['worktoearnMecanism']) return 'Reputation';
    const textFields = [
        project.description,
        project['protoclMecanism'],
        project['artefactUtility'],
        project.fund_usage,
    ].filter(Boolean).join(' ').toLowerCase();
    if (textFields.includes('coupon') || textFields.includes('descuento') || textFields.includes('reward')) return 'Coupon';
    if (textFields.includes('identity') || textFields.includes('identidad') || textFields.includes('kyc')) return 'Identity';
    if (textFields.includes('yield') || textFields.includes('rendimiento') || textFields.includes('apy')) return 'Yield';
    // Default: Access is the safest and most common
    return 'Access';
}

// ── Resolve contract address with 4-field fallback ────────────────────────────
function resolveContractAddress(project: any): string | null {
    const candidates = [
        project.license_contract_address,
        project.w2e_config?.licenseToken?.address,
        project.contract_address,
        project.utility_contract_address,
    ];
    return candidates.find(a => a && a.startsWith('0x') && a.length === 42) ?? null;
}

// ── Build V2 artifact from V1 project ─────────────────────────────────────────
function buildV2Artifact(project: any): object {
    const type = inferArtifactType(project);
    const resolvedAddress = resolveContractAddress(project);

    return {
        id: randomUUID(),
        type,
        name: `${project.title} ${type} Pass`,
        symbol: 'PBOX',
        address: resolvedAddress,
        maxSupply: project.w2e_config?.licenseToken?.maxSupply ?? null,
        price: project.w2e_config?.licenseToken?.price ? String(project.w2e_config.licenseToken.price) : null,
        isPrimary: true,
        metadata: {
            source: 'v1-migration',
            inferredAt: new Date().toISOString(),
            confidence: resolvedAddress ? 'high' : 'medium',
            originalFields: {
                licenseContractAddress: project.license_contract_address ?? null,
                contractAddress: project.contract_address ?? null,
            }
        }
    };
}

// ── Migration confidence score ────────────────────────────────────────────────
function getConfidence(project: any): 'high' | 'medium' | 'low' {
    if (resolveContractAddress(project)) return 'high';
    if (project.license_contract_address || project.contract_address) return 'medium';
    return 'low';
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    console.log(`\n🔄 V1 → V2 Migration Script`);
    console.log(`   Mode: ${isDryRun ? '🔍 DRY-RUN (no writes)' : '✍️  APPLY (writing to DB)'}`);
    if (targetSlug) console.log(`   Target: slug = ${targetSlug}`);
    console.log('');

    // Fetch V1 projects — no protocol_version column in staging DB,
    // so we detect V1 by checking that w2e_config.schema != 'v2'
    const rows = await db.execute(sql`
    SELECT 
      id, title, slug, status,
      license_contract_address, contract_address, utility_contract_address,
      fund_usage, lockup_period,
      w2e_config
    FROM projects
    WHERE 
      (${targetSlug ? sql`slug = ${targetSlug}` : sql`1=1`})
      AND (
        w2e_config IS NULL 
        OR (w2e_config->>'schema') IS DISTINCT FROM 'v2'
      )
      AND status IN ('approved', 'live', 'completed', 'pending')
    ORDER BY created_at ASC
  `);

    if (rows.length === 0) {
        console.log('✅ No V1 projects found to migrate.');
        process.exit(0);
    }

    console.log(`Found ${rows.length} V1 project(s) to migrate:\n`);

    const results: any[] = [];

    for (const project of rows) {
        const artifact = buildV2Artifact(project);
        const confidence = getConfidence(project);
        const inferredType = inferArtifactType(project);
        const resolvedContract = resolveContractAddress(project);

        results.push({
            slug: project.slug,
            title: String(project.title).substring(0, 28),
            inferredType,
            resolvedContract: resolvedContract
                ? `${String(resolvedContract).substring(0, 10)}...`
                : '⚠️ none',
            confidence,
            action: isDryRun ? 'PENDING' : 'MIGRATED',
        });

        if (!isDryRun) {
            // Build updated w2eConfig preserving existing data
            let existingConfig: any = project.w2e_config ?? {};
            if (typeof existingConfig === 'string') {
                try { existingConfig = JSON.parse(existingConfig); } catch { existingConfig = {}; }
            }

            const updatedConfig = {
                ...existingConfig,
                schema: 'v2',
                migratedFromV1: true,
                migrationVersion: '2026-02',
                artifacts: [artifact],
                pageLayoutType: inferredType,
            };

            // Only update w2e_config — staging DB has no protocol_version column yet
            await db.execute(sql`
        UPDATE projects
        SET
          w2e_config = ${JSON.stringify(updatedConfig)}::jsonb
        WHERE id = ${project.id}
      `);
        }
    }

    // Summary table
    console.table(results);

    if (isDryRun) {
        console.log(`\n💡 This was a DRY-RUN. No changes were written.`);
        console.log(`   To apply: bun run migrate-v1-to-v2.ts --apply`);
        console.log(`   Single:   bun run migrate-v1-to-v2.ts --slug <slug> --apply\n`);
    } else {
        console.log(`\n✅ Migrated ${rows.length} project(s) to V2.`);
        console.log(`   Protocol pages will now use the V2 dispatcher layout.`);
        console.log(`   Artifacts are marked with { source: 'v1-migration' } for auditing.\n`);
    }

    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
