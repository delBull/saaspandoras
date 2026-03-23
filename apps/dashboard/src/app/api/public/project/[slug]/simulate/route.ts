import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects as projectsSchema } from "@/db/schema";
import { eq } from "drizzle-orm";
import { IntegrationKeyService } from "@/lib/integrations/auth";
import { readContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { client as twClient } from "@/lib/thirdweb-client";
import { getContract } from "thirdweb";
import { ProgressionEngine, Tier } from "@/lib/protocol-engine/progression";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * POST /api/public/project/[slug]/simulate
 * Predicts the progression state after a hypothetical purchase.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const body = await req.json();
    
    const apiKey = req.headers.get("x-api-key") || searchParams.get("apiKey");
    const { wallet, amount } = body;

    if (!apiKey) {
      return NextResponse.json({ error: "No se proporcionó API Key" }, { status: 401 });
    }

    if (!amount || isNaN(Number(amount))) {
      return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
    }

    // 1. Validate API Key
    const authClient = await IntegrationKeyService.validateKey(apiKey);
    if (!authClient) {
      return NextResponse.json({ error: "API Key inválida o expirada" }, { status: 401 });
    }

    // 2. Fetch Project & Config
    const project = await db.query.projects.findFirst({
      where: eq(projectsSchema.slug, slug),
      columns: {
        chainId: true, licenseContractAddress: true, contractAddress: true, w2eConfig: true,
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    const w2e = typeof project.w2eConfig === 'string' ? JSON.parse(project.w2eConfig) : (project.w2eConfig || {});

    // 3. Get Current Balance (if wallet provided)
    let currentBalance = 0;
    if (wallet && wallet.startsWith("0x")) {
      const chainId = project.chainId || 11155111;
      const resolvedContract = project.licenseContractAddress || w2e.licenseToken?.address || project.contractAddress;

      if (resolvedContract && resolvedContract !== "0x0000000000000000000000000000000000000000") {
        try {
          const contract = getContract({
            client: twClient, chain: defineChain(Number(chainId)), address: resolvedContract
          });
          const balance = await readContract({
            contract, method: "function balanceOf(address) view returns (uint256)", params: [wallet as `0x${string}`]
          });
          currentBalance = Number(balance);
        } catch (e) {
          console.warn(`[Simulate API] Balance fetch error:`, e);
        }
      }
    }

    // 4. Run Simulation
    const rawTiers = (w2e.tiers || w2e.packages || []) as any[];
    const normalizedTiers: Tier[] = rawTiers.map(t => ({
      id: t.id,
      name: t.name,
      artifactCountThreshold: t.artifactCountThreshold ?? t.minArtifacts ?? 0,
      perks: t.perks || [],
    }));

    const simulation = ProgressionEngine.simulate(currentBalance, normalizedTiers, Number(amount));

    return NextResponse.json({
      originalBalance: currentBalance,
      simulatedAmount: Number(amount),
      finalBalance: currentBalance + Number(amount),
      simulation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Simulation API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
