import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getContract } from "thirdweb";
import { ownerOf } from "thirdweb/extensions/erc721";
import { config } from "@/config";
import { client } from "@/lib/thirdweb-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/nft/metadata/:tokenId
 * 
 * Dynamic Metadata Oracle for Pandora's Key.
 * Returns the NFT metadata JSON with dynamic attributes based on user status.
 */
export async function GET(
    req: Request,
    { params }: { params: { tokenId: string } }
) {
    const tokenId = BigInt(params.tokenId);

    try {
        // 1. Resolve Owner from Chain (Using Thirdweb)
        const nftContract = getContract({
            client,
            chain: config.chain,
            address: config.nftContractAddress,
        });

        // 🛡️ Error safety: If contract address is still zero, return placeholder
        if (config.nftContractAddress === "0x0000000000000000000000000000000000000000") {
             return NextResponse.json(getPlaceholderMetadata(tokenId.toString()));
        }

        const ownerAddress = await ownerOf({
            contract: nftContract,
            tokenId: tokenId,
        }).catch(() => null);

        if (!ownerAddress) {
            return NextResponse.json({ error: "Token not found" }, { status: 404 });
        }

        // 2. Resolve User Status from DB
        const user = await db.query.users.findFirst({
            where: eq(users.walletAddress, ownerAddress.toLowerCase())
        });

        const isInitiated = !!user?.ritualCompletedAt;
        
        // 3. Construct Dynamic Metadata
        const metadata = {
            name: `Pandora's Key #${tokenId}`,
            description: isInitiated 
                ? "Una llave vinculada a un alma que ha completado la Iniciación. El sistema le reconoce." 
                : "Una llave de acceso al sistema Pandoras. La Iniciación está pendiente.",
            image: isInitiated 
                ? "https://dash.pandoras.finance/images/nft/key-initiated.png" // Placeholder
                : "https://dash.pandoras.finance/images/nft/key-standard.png",   // Placeholder
            attributes: [
                {
                    trait_type: "Access Tier",
                    value: user?.benefitsTier || "Standard"
                },
                {
                    trait_type: "State",
                    value: isInitiated ? "Iniciado" : "Candidato"
                },
                {
                    trait_type: "Oracle Verified",
                    value: "True"
                }
            ],
            external_url: "https://dash.pandoras.finance/access",
            background_color: isInitiated ? "00FF00" : "000000"
        };

        return NextResponse.json(metadata);

    } catch (e: any) {
        console.error("❌ [Metadata API] Error:", e);
        return NextResponse.json(getPlaceholderMetadata(tokenId.toString()));
    }
}

function getPlaceholderMetadata(id: string) {
    return {
        name: `Pandora's Key #${id}`,
        description: "Clave de acceso institucional para el ecosistema Pandoras.",
        image: "https://dash.pandoras.finance/images/nft/key-standard.png",
        attributes: [{ trait_type: "State", value: "Unknown" }]
    };
}
