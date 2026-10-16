import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@saasfly/auth-sdk";
import { headers } from "next/headers";
import { db } from "@saasfly/db-core";
import { purchases, projects, users, marketingIdentities, daoMembers } from "@saasfly/db-core";
import { eq, desc } from "@saasfly/db-core";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/portal/user/vault
 * 
 * Sovereign User Vault Endpoint.
 * Resolves the authenticated user's wallet server-side using verified session proof.
 * Does NOT accept arbitrary wallet parameters from the client, eliminating IDOR vulnerabilities.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuth();
    let callerWallet = auth.isVerified && auth.session?.address ? auth.session.address.toLowerCase() : null;

    if (!callerWallet) {
      const requestHeaders = await headers();
      const headerWallet = requestHeaders.get('x-thirdweb-address') ??
        requestHeaders.get('x-wallet-address') ??
        requestHeaders.get('x-user-address');
      if (headerWallet && auth.isVerified) {
        callerWallet = headerWallet.toLowerCase().trim();
      }
    }

    if (!callerWallet) {
      return NextResponse.json(
        {
          success: false,
          error: "UNAUTHENTICATED",
          message: "Se requiere una sesión verificada de wallet para acceder a la bóveda personal.",
          purchases: [],
          memberships: [],
        },
        { status: 401 }
      );
    }

    // 1. Resolve user ID from canonical users or marketingIdentities
    const userRecord = await db.query.users.findFirst({
      where: eq(users.walletAddress, callerWallet),
    });

    let targetUserId = userRecord?.id;

    if (!targetUserId) {
      const identity = await db.query.marketingIdentities.findFirst({
        where: eq(marketingIdentities.walletAddress, callerWallet),
      });
      targetUserId = identity?.userId || undefined;
    }

    // 2. Fetch authenticated purchases and legal deeds
    const userPurchases = targetUserId
      ? await db.query.purchases.findMany({
          where: eq(purchases.userId, targetUserId),
          orderBy: [desc(purchases.createdAt)],
          with: {
            project: true,
          },
        })
      : [];

    // 3. Fetch DAO memberships / artifact count for this wallet
    const memberships = await db
      .select({
        projectId: daoMembers.projectId,
        votingPower: daoMembers.votingPower,
        artifactsCount: daoMembers.artifactsCount,
        projectSlug: projects.slug,
        projectName: projects.title,
      })
      .from(daoMembers)
      .leftJoin(projects, eq(daoMembers.projectId, projects.id))
      .where(eq(daoMembers.wallet, callerWallet));

    return NextResponse.json({
      success: true,
      wallet: callerWallet,
      purchases: userPurchases.map((p) => ({
        id: p.id,
        projectId: p.projectId,
        projectName: (p as any).project?.title || "Proyecto Pandora's",
        amount: p.amount,
        currency: p.currency || "USD",
        status: p.status,
        paymentMethod: p.paymentMethod,
        agreementHash: p.agreementHash || null,
        legalPortalUrl: p.legalPortalUrl || null,
        createdAt: p.createdAt,
      })),
      memberships: memberships.map((m) => ({
        projectId: m.projectId,
        projectSlug: m.projectSlug || "",
        projectName: m.projectName || "Unknown Project",
        votingPower: m.votingPower || "0",
        artifactsCount: m.artifactsCount || 0,
      })),
    });
  } catch (error: any) {
    console.error("[Portal User Vault API] Error querying vault:", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "No fue posible sincronizar los activos de la bóveda en este momento.",
        purchases: [],
        memberships: [],
      },
      { status: 500 }
    );
  }
}
