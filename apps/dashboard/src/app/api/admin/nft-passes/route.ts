import { NextResponse } from "next/server";
import { db } from "~/db";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * GET /api/admin/nft-passes
 * Returns all deployed NFT Pass contracts for airdrop selection
 *  
 * Returns:
 * [{
 *   id: string;
 *   title: string;
 *   licenseContractAddress: string;
 *   symbol: string (from w2eConfig);
 *   imageUrl: string (from w2eConfig.accessCardImage);
 * }]
 */
export async function GET(_request: Request) {
    try {
        // 1. Auth check
        const { session } = await getAuth(await headers());
        const userIsAdmin = await isAdmin(session?.address ?? session?.userId);

        if (!userIsAdmin) {
            return NextResponse.json({ message: "No autorizado" }, { status: 403 });
        }

        // 2. Query for NFT Passes:
        //    - businessCategory = 'infrastructure'
        //    - licenseContractAddress exists (deployed)
        //    - utilityContractAddress is NULL (not a full protocol)
        const nftPasses = await db.execute(sql`
            SELECT 
                id,
                title,
                "license_contract_address" as "licenseContractAddress",
                "w2e_config" as "w2eConfig",
                "chain_id" as "chainId"
            FROM projects
            WHERE 
                "business_category" = 'infrastructure'
                AND "license_contract_address" IS NOT NULL
                AND "utility_contract_address" IS NULL
                AND "deployment_status" = 'deployed'
            ORDER BY "created_at" DESC
        `);

        // 3. Format response with extracted w2eConfig fields
        const formattedPasses = nftPasses.map((pass: any) => {
            const w2eConfig = pass.w2eConfig || {};
            return {
                id: pass.id,
                title: pass.title,
                contractAddress: pass.licenseContractAddress,
                symbol: w2eConfig.symbol || 'PASS',
                imageUrl: w2eConfig.accessCardImage || null,
                chainId: pass.chainId || null,
            };
        });

        console.log(`✅ NFT Passes API: Found ${formattedPasses.length} passes`);
        return NextResponse.json(formattedPasses);

    } catch (error) {
        console.error("❌ NFT Passes API Error:", error);
        return NextResponse.json(
            { message: "Error fetching NFT passes", error: error instanceof Error ? error.message : 'Unknown' },
            { status: 500 }
        );
    }
}
