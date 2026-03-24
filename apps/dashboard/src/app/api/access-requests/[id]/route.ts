import { NextResponse } from "next/server";
import { db } from "~/db";
import { accessRequests } from "~/db/schema";
import { eq } from "drizzle-orm";
import { sendWaitlistSequenceEmail, sendGenesisWelcomeEmail } from "~/lib/marketing/growth-engine/email-senders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PATCH /api/access-requests/[id]
 * Admin action: approve or reject a waitlist request.
 * On approval → sends Genesis Welcome email automatically.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const body = await request.json() as { status: string; reviewedBy?: string };
    const { status, reviewedBy } = body;

    if (!["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }

    // Fetch the request first (we need the email)
    const existing = await db.query.accessRequests.findFirst({
      where: eq(accessRequests.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Solicitud no encontrada." }, { status: 404 });
    }

    // Update status
    await db
      .update(accessRequests)
      .set({
        status,
        reviewedAt: new Date(),
        reviewedBy: reviewedBy || null,
      })
      .where(eq(accessRequests.id, id));

    // ── Send approval email (non-blocking) ───────────────────────────────────
    if (status === "approved") {
      sendGenesisWelcomeEmail({ to: existing.email }).catch((e: unknown) => {
        console.error(`[access-requests PATCH] Genesis email failed for ${existing.email}:`, e);
      });

      console.log(`✅ [access-requests] Approved: ${existing.email} | by: ${reviewedBy || "system"}`);
    }

    return NextResponse.json({ success: true, id, status });
  } catch (err) {
    console.error("[/api/access-requests/[id] PATCH]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * GET /api/access-requests/[id]
 * Fetch a single request.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (isNaN(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  const item = await db.query.accessRequests.findFirst({
    where: eq(accessRequests.id, id),
  });

  if (!item) return NextResponse.json({ error: "No encontrado." }, { status: 404 });

  return NextResponse.json(item);
}
