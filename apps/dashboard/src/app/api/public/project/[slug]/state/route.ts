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
 * GET /api/public/project/[slug]/state
 * Retrieves real-time contract state and user progression.
 * Caching: 15s default, bypass with ?live=true
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const apiKey = req.headers.get("x-api-key") || searchParams.get("apiKey");
    const wallet = searchParams.get("wallet");
    const isLive = searchParams.get("live") === "true";

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
        id: true, slug: true, status: true, chainId: true, 
        licenseContractAddress: true, contractAddress: true, w2eConfig: true,
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    const w2e = typeof project.w2eConfig === 'string' 
      ? JSON.parse(project.w2eConfig) 
      : (project.w2eConfig || {});

    // 3. Fetch Real-time Contract Data
    const chainId = project.chainId || 11155111;
    const resolvedContract = project.licenseContractAddress || w2e.licenseToken?.address || project.contractAddress;

    let userArtifactCount = 0;
    let currentSupply = 0;

    if (resolvedContract && resolvedContract !== "0x0000000000000000000000000000000000000000") {
      const contract = getContract({
        client: twClient, chain: defineChain(Number(chainId)), address: resolvedContract
      });

      try {
        const supplyData = await readContract({
          contract, method: "function totalSupply() view returns (uint256)", params: []
        });
        currentSupply = Number(supplyData);

        if (wallet && wallet.startsWith("0x")) {
          const balance = await readContract({
              contract, method: "function balanceOf(address) view returns (uint256)", params: [wallet as `0x${string}`]
          });
          userArtifactCount = Number(balance);
        }
      } catch (e) {
        console.warn(`[API] Contract read error for ${slug}:`, e);
      }
    }

    // 4. Calculate Progression via Engine
    const rawTiers = (w2e.tiers || w2e.packages || []) as any[];
    const normalizedTiers: Tier[] = rawTiers.map(t => ({
      id: t.id,
      name: t.name,
      artifactCountThreshold: t.artifactCountThreshold ?? t.minArtifacts ?? 0,
      perks: t.perks || [],
      description: t.description
    }));

    const progression = wallet ? ProgressionEngine.calculate(userArtifactCount, normalizedTiers) : null;

    // 5. Build Response with Caching
    const response = NextResponse.json({
      slug: project.slug,
      status: project.status,
      currentSupply,
      progression,
      metrics: {
        urgency: progression?.urgencyLevel || "low"
      },
      timestamp: new Date().toISOString()
    });

    // Caching Strategy: s-maxage=15, stale-while-revalidate=30
    // Bypass if isLive=true
    if (isLive) {
      response.headers.set("Cache-Control", "no-store, max-age=0");
    } else {
      response.headers.set("Cache-Control", "public, s-maxage=15, stale-while-revalidate=30");
    }

    return response;

  } catch (error) {
    console.error("❌ Public State API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
