import { NextResponse } from "next/server";
import { db } from "@saasfly/db";
import { nexusDealPofDocuments, nexusDealSigners } from "@saasfly/db/schema";
import { and, desc, eq } from "@saasfly/db-core";
import { getRoomByPublicId, hasEmailSignedNda, verifyDealToken } from "@saasfly/nexus-deals-sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png"]);

/**
 * POF desde la sala (firmante con NDA firmado).
 *
 * GET  ?token=...  → estado del POF (none | declared | verified)
 * POST (multipart) → declaración + archivo (PDF/JPG/PNG ≤ 5 MB)
 *
 * El archivo se guarda en Postgres (`bytea`), no en storage externo. Queda en
 * revisión (`declared`) hasta que el host lo marca como verificado y entrega el OM.
 */
export async function GET(req: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const payload = verifyDealToken(token);
  if (!payload || payload.sub !== publicId) {
    return NextResponse.json({ error: "Token inválido" }, { status: 403 });
  }

  const [signer] = await db
    .select({ pofStatus: nexusDealSigners.pofStatus, pofVerifiedAt: nexusDealSigners.pofVerifiedAt })
    .from(nexusDealSigners)
    .where(and(eq(nexusDealSigners.roomId, payload.roomId), eq(nexusDealSigners.email, payload.email)))
    .limit(1);

  return NextResponse.json({
    status: signer?.pofStatus ?? "none",
    verifiedAt: signer?.pofVerifiedAt ?? null,
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formulario inválido" }, { status: 400 });
  }

  const token = String(form.get("token") ?? "");
  const payload = verifyDealToken(token);
  if (!payload || payload.sub !== publicId) {
    return NextResponse.json({ error: "Token inválido o expirado" }, { status: 403 });
  }

  const room = await getRoomByPublicId(publicId);
  if (!room) return NextResponse.json({ error: "Deal no encontrado" }, { status: 404 });

  const signed = await hasEmailSignedNda(payload.email, room.ndaVersion || "v1.0");
  if (!signed) {
    return NextResponse.json({ error: "Primero firma el acuerdo de confidencialidad." }, { status: 409 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Adjunta la carta del fondo o tu declaración." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Formato no permitido. Usa PDF, JPG o PNG." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "El archivo supera 5 MB." }, { status: 413 });
  }

  const mime = file.type;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await db.insert(nexusDealPofDocuments).values({
      roomId: room.id,
      signerEmail: payload.email,
      filename: file.name.slice(0, 200),
      mimeType: mime,
      sizeBytes: file.size,
      content: buffer,
      entityName: String(form.get("entity") ?? "").slice(0, 200) || null,
      fundName: String(form.get("fund") ?? "").slice(0, 200) || null,
      amountRange: String(form.get("amount") ?? "").slice(0, 64) || null,
      notes: String(form.get("notes") ?? "").slice(0, 1000) || null,
    });

    await db
      .update(nexusDealSigners)
      .set({ pofStatus: "declared" })
      .where(and(eq(nexusDealSigners.roomId, room.id), eq(nexusDealSigners.email, payload.email)));

    // Marca el POF como declarado en la sala (el host lo verificará después).
    const latest = await db
      .select({ uploadedAt: nexusDealPofDocuments.uploadedAt })
      .from(nexusDealPofDocuments)
      .where(and(eq(nexusDealPofDocuments.roomId, room.id), eq(nexusDealPofDocuments.signerEmail, payload.email)))
      .orderBy(desc(nexusDealPofDocuments.uploadedAt))
      .limit(1);

    return NextResponse.json({ ok: true, status: "declared", uploadedAt: latest[0]?.uploadedAt ?? null });
  } catch (error) {
    console.error("[POF] upload error:", error);
    return NextResponse.json({ error: "No se pudo guardar el documento." }, { status: 500 });
  }
}
