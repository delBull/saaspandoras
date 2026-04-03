import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects as projectsSchema } from "@/db/schema";
import { eq } from "drizzle-orm";
import { IntegrationKeyService } from "@/lib/integrations/auth";
import { getProjectPhasesWithStats } from "@/lib/phase-utils";
import { getContract, defineChain, readContract } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { totalSupply as erc721TotalSupply } from "thirdweb/extensions/erc721";
import { totalSupply as erc1155TotalSupply } from "thirdweb/extensions/erc1155";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/public/project/[slug]/config
 * Retrieves the normalized configuration (tiers, phases) for a project.
 * Requires a valid Public API Key (pk_...).
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const apiKey = req.headers.get("x-api-key") || req.nextUrl.searchParams.get("apiKey");

    if (!apiKey) {
      return NextResponse.json({ error: "No se proporcionó API Key" }, { status: 401 });
    }

    // 1. Validate API Key
    const authClient = await IntegrationKeyService.validateKey(apiKey);
    if (!authClient) {
      return NextResponse.json({ error: "API Key inválida o expirada" }, { status: 401 });
    }

    // 2. Fetch Project
    const project = await db.query.projects.findFirst({
      where: eq(projectsSchema.slug, slug),
      columns: {
        id: true,
        slug: true,
        title: true,
        w2eConfig: true,
        status: true,
        tokenPriceUsd: true,
        contractAddress: true,
        chainId: true,
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    const w2e = typeof project.w2eConfig === 'string' 
      ? JSON.parse(project.w2eConfig) 
      : (project.w2eConfig || {});

    // 3. (Optional) Fetch Current Supply if contract is present for real-time status
    let currentSupply = 0;
    if (project.contractAddress && project.chainId) {
      try {
        const contract = getContract({
          client,
          chain: defineChain(project.chainId),
          address: project.contractAddress,
        });

        // Try ERC721 first, then fallback to ERC1155 (Default ID 0)
        try {
          const supply = await erc721TotalSupply({ contract });
          currentSupply = Number(supply);
        } catch {
          try {
            const supply = await erc1155TotalSupply({ contract, id: 0n });
            currentSupply = Number(supply);
          } catch (e1155) {
            console.warn("[PublicConfig] Supply fetch fail (721 & 1155 id:0):", e1155);
          }
        }
      } catch (e) {
        console.warn("[PublicConfig] Contract setup fail:", e);
      }
    }

    // 4. Calculate Unified Phases with Stats
    const phasesWithStats = getProjectPhasesWithStats(project, currentSupply);

    const response = {
      project: {
        id: project.id,
        slug: project.slug,
        title: project.title,
        status: project.status,
        contractAddress: project.contractAddress,
        chainId: project.chainId,
      },
      config: {
        phases: phasesWithStats.map((p: any) => ({
          ...p,
          // Explicitly expose cleaned status for SDK consumption
          is_active: p.isActive,
          status: p.status,
          status_label: p.statusLabel,
          is_clickable: p.isClickable
        })),
        tiers: w2e.tiers || w2e.packages || [],
        tokenomics: {
          ticker: project.slug.toUpperCase() || 'TOKEN',
          price: w2e.tokenomics?.price || project.tokenPriceUsd || 0,
        }
      },
      version: "2.0.0"
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ Public Config API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
