import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { privatePaymentLinks } from "@/db/schema";
import { validateAdminSession } from "@/lib/admin-auth";
import { getNexusAuthContext } from "@/lib/nexus/nexus-rbac";
import { z } from "zod";
import { desc } from "drizzle-orm";

export const runtime = "nodejs";

const CreatePrivateLinkSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(255),
  description: z.string().optional(),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  currency: z.string().default("USD"),
  destinationWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/i, "Dirección de wallet inválida"),
  networkChainId: z.number().default(8453), // Default to Base
  settlementToken: z.string().regex(/^0x[a-fA-F0-9]{40}$/i).optional().nullable(),
  expiresInDays: z.number().min(1).max(365).optional(),
});

/**
 * 🔒 Private Payment Rail — Admin Listing & Creation
 * Strictly isolated: zero tenant crossover, zero CRM sync, server-enforced destination.
 */
async function resolvePrivateAdmin(req: NextRequest) {
  // Strategy 1: Validate via validateAdminSession
  try {
    const adminCheck = await validateAdminSession(req.headers);
    if (adminCheck.session?.address) {
      return { address: adminCheck.session.address, errorResponse: null };
    }
  } catch (err) {
    console.warn("[PrivatePayments API] validateAdminSession fallback check:", err);
  }

  // Strategy 2: Validate via Nexus RBAC Context (x-nexus-token / cookie)
  try {
    const nexusAuth = await getNexusAuthContext(req.headers);
    if (nexusAuth.isAuthenticated && (nexusAuth.role === "SUPER_ADMIN" || nexusAuth.role === "ADMIN")) {
      const address = nexusAuth.wallet || "0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9";
      return { address, errorResponse: null };
    }
  } catch (err) {
    console.warn("[PrivatePayments API] getNexusAuthContext fallback check:", err);
  }

  return {
    address: null,
    errorResponse: NextResponse.json(
      { error: "Forbidden: Super Admin session required." },
      { status: 403 }
    ),
  };
}

export async function GET(req: NextRequest) {
  const { address, errorResponse } = await resolvePrivateAdmin(req);
  if (errorResponse) return errorResponse;

  try {
    const links = await db.query.privatePaymentLinks.findMany({
      orderBy: [desc(privatePaymentLinks.createdAt)],
      limit: 50,
    });

    return NextResponse.json({
      success: true,
      links,
      admin: address,
    });
  } catch (error: any) {
    console.error("[PrivatePayments API] Error listing links:", error);
    return NextResponse.json({ error: error?.message || "Failed to load private payment links" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { address, errorResponse } = await resolvePrivateAdmin(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsed = CreatePrivateLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      amount,
      currency,
      destinationWallet,
      networkChainId,
      settlementToken,
      expiresInDays,
    } = parsed.data;

    let expiresAt: Date | null = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const [created] = await db
      .insert(privatePaymentLinks)
      .values({
        title,
        description: description || null,
        amount: amount.toFixed(2),
        currency: currency.toUpperCase(),
        destinationWallet: destinationWallet.toLowerCase(),
        networkChainId,
        settlementToken: settlementToken ? settlementToken.toLowerCase() : null,
        expiresAt,
        status: "active",
        metadata: {
          createdByUser: address,
          createdByWallet: address,
        },
      })
      .returning();

    if (!created) {
      return NextResponse.json({ error: "Failed to persist private payment link" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      link: created,
      paymentUrl: `/pay/private/${created.id}`,
    });
  } catch (error: any) {
    console.error("[PrivatePayments API] Error creating link:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
