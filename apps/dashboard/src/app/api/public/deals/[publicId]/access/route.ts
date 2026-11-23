import { NextResponse } from "next/server";
import { db } from "@saasfly/db";
import { nexusDealPods } from "@saasfly/db/schema";
import { eq } from "@saasfly/db-core";
import {
  KIND_LABEL,
  generateDealToken,
  getRoomByPublicId,
  markMagicSent,
  sendDealMagicLink,
} from "@saasfly/nexus-deals-sdk";
import {
  accessRequestContext,
  acknowledgeAccessRequest,
  createAccessRequest,
  hashIp,
  normalizeEmail,
  notifyAccessRequest,
} from "@/lib/nexus/deal-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://nexus.pandoras.finance";

// Rate limit en memoria (mismo criterio que /magic): mitiga abuso básico.
const recent = new Map<string, number>();
const COOLDOWN_MS = 30_000;

function tooFast(key: string): boolean {
  const now = Date.now();
  const last = recent.get(key);
  if (last && now - last < COOLDOWN_MS) return true;
  recent.set(key, now);
  if (recent.size > 5000) recent.clear();
  return false;
}

function utmFrom(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === "string" && raw.trim() && Object.keys(out).length < 10) {
      out[key.slice(0, 32)] = raw.trim().slice(0, 200);
    }
  }
  return out;
}

/**
 * `POST /api/public/deals/[publicId]/access` — solicitud de acceso.
 *
 * Casos:
 *  · El correo ya es firmante registrado → se envía el magic link (comportamiento
 *    previo, sin cambios) y **no** se crea solicitud.
 *  · Correo nuevo → se registra una solicitud en el Deal Pod, se avisa a operación
 *    (Discord + correo) y se manda un acuse al solicitante. **No** se envía enlace.
 *
 * La respuesta es idéntica en ambos casos (`{ ok: true }`): no se revela si un
 * correo ya está autorizado.
 */
export async function POST(req: Request, { params }: { params: Promise<{ publicId: string }> }) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;

  if (tooFast(hashIp(ip) ?? "anon")) {
    return NextResponse.json({ error: "Espera unos segundos antes de reenviar." }, { status: 429 });
  }

  const email = normalizeEmail(body.email);
  if (!email) {
    return NextResponse.json({ error: "Escribe un correo válido." }, { status: 400 });
  }
  if (body.consent !== true) {
    return NextResponse.json(
      { error: "Necesitamos tu consentimiento para registrar la solicitud." },
      { status: 400 },
    );
  }

  const { publicId } = await params;
  const room = await getRoomByPublicId(publicId);
  if (!room) {
    // No revelar existencia de la sala.
    return NextResponse.json({ ok: true });
  }

  // Ya es firmante: mismo camino de siempre (magic link).
  const signer = room.signers.find((s) => s.email.toLowerCase() === email);
  if (signer) {
    const token = generateDealToken(room.id, room.publicId, email);
    const magicUrl = `${BASE_URL}/deal/${room.publicId}?token=${encodeURIComponent(token)}`;
    try {
      await sendDealMagicLink({
        to: email,
        firstName: email.split("@")[0],
        dealKindLabel: KIND_LABEL[room.kind] ?? room.kind,
        counterparty: room.counterparty,
        publicUrl: magicUrl,
      });
      await markMagicSent(room.id, email);
    } catch (error) {
      console.error("[deal-access] magic falló:", error);
      return NextResponse.json({ error: "No se pudo enviar el correo." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (!room.podId) {
    return NextResponse.json(
      { error: "Esta sala no recibe solicitudes en línea. Escríbenos por correo." },
      { status: 409 },
    );
  }

  const [pod] = await db
    .select({ id: nexusDealPods.id, orgId: nexusDealPods.canonicalOrgId })
    .from(nexusDealPods)
    .where(eq(nexusDealPods.id, room.podId))
    .limit(1);

  if (!pod) {
    return NextResponse.json({ error: "Pod no disponible." }, { status: 409 });
  }

  const srcCode =
    typeof body.src === "string" && body.src.trim() ? body.src.trim().slice(0, 64) : null;

  const created = await createAccessRequest({
    podId: pod.id,
    roomId: room.id,
    orgId: pod.orgId,
    email,
    name: typeof body.name === "string" ? body.name : null,
    company: typeof body.company === "string" ? body.company : null,
    role: typeof body.role === "string" ? body.role : null,
    message: typeof body.message === "string" ? body.message : null,
    consent: true,
    source: body.source === "room" ? "room" : "landing",
    srcCode,
    referrer: typeof body.referrer === "string" ? body.referrer : req.headers.get("referer"),
    utm: utmFrom(body.utm),
    ip,
    userAgent: req.headers.get("user-agent"),
  });

  if (!created) {
    return NextResponse.json({ error: "No se pudo registrar la solicitud." }, { status: 500 });
  }

  if (created.created) {
    const context = await accessRequestContext({ podId: pod.id, roomId: room.id, srcCode });
    if (context) {
      // Los avisos no bloquean la solicitud: si fallan, queda registrada igual.
      await Promise.allSettled([
        notifyAccessRequest({ request: created.request, context }),
        acknowledgeAccessRequest({ request: created.request, context }),
      ]);
    }
  }

  return NextResponse.json({ ok: true });
}
