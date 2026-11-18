import { NextRequest, NextResponse } from "next/server";
import { getNexusAuthContext } from "@saasfly/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 🏛️ ARCHITECTURE NOTE: Readiness del ciclo de presentación
 * ========================================================
 * `GET /api/v1/internal/readiness` responde, sin exponer secretos, QUÉ está
 * configurado y qué no para la cadena:
 *
 *   agendar → invitar (email) → sala (Jitsi) → deck → asistencia → cierre → seguimiento
 *
 * Regla de honestidad: si una dependencia falta, se reporta como `missing`, nunca
 * como "listo". Es la herramienta para verificar post-deploy sin adivinar.
 *
 * Autorización: `Authorization: Bearer $CRON_SECRET` o sesión SUPER_ADMIN.
 */

const REQUIRED = {
  database: ["DATABASE_URL", "POSTGRES_URL"],
  email: ["RESEND_API_KEY"],
  meetings: ["MEET_JOIN_SECRET", "JITSI_APP_ID", "JITSI_API_KEY", "JITSI_PRIVATE_KEY_B64"],
  cron: ["CRON_SECRET"],
} as const;

const OPTIONAL = {
  appUrl: ["NEXT_PUBLIC_APP_URL"],
  emailFrom: ["RESEND_FROM_EMAIL"],
  redis: ["REDIS_URL"],
} as const;

/**
 * `DATABASE_URL` y `POSTGRES_URL` son alternativas (el driver usa una u otra), por eso
 * el criterio es "al menos una", no "todas".
 */
function atLeastOneOf(names: readonly string[]): { configured: boolean; missing: string[] } {
  const present = names.filter((name) => Boolean(process.env[name]));
  return present.length > 0 ? { configured: true, missing: [] } : { configured: false, missing: [...names] };
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronAuthorized = Boolean(process.env.CRON_SECRET) && authHeader === `Bearer ${process.env.CRON_SECRET}`;

  let adminAuthorized = false;
  if (!cronAuthorized) {
    try {
      const auth = await getNexusAuthContext(req.headers);
      adminAuthorized = Boolean(auth.isAuthenticated && auth.role === "SUPER_ADMIN");
    } catch {
      adminAuthorized = false;
    }
  }

  if (!cronAuthorized && !adminAuthorized) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const required = Object.fromEntries(
    Object.entries(REQUIRED).map(([capability, names]) => [capability, atLeastOneOf(names)])
  ) as Record<keyof typeof REQUIRED, { configured: boolean; missing: string[] }>;

  const optional = Object.fromEntries(
    Object.entries(OPTIONAL).map(([capability, names]) => [capability, atLeastOneOf(names)])
  ) as Record<keyof typeof OPTIONAL, { configured: boolean; missing: string[] }>;

  const missingRequired = Object.values(required).flatMap((entry) => entry.missing);
  const ready = missingRequired.length === 0;

  return NextResponse.json({
    ready,
    // No se devuelven valores de entorno, solo presencia y nombres faltantes.
    capabilities: {
      database: required.database.configured,
      email: required.email.configured,
      meetings: required.meetings.configured,
      cron: required.cron.configured,
    },
    optional: {
      appUrl: optional.appUrl,
      emailFrom: optional.emailFrom,
      redis: optional.redis,
    },
    missing: missingRequired,
    notes: ready
      ? []
      : [
          "Sin DATABASE_URL/POSTGRES_URL no hay persistencia: agendar y asistencia fallan.",
          "Sin RESEND_API_KEY las invitaciones y el seguimiento se reportan como fallidos (no se finge envío).",
          "Sin JITSI_* y MEET_JOIN_SECRET la sala no puede emitir tokens.",
          "Sin CRON_SECRET el cron de reintento responde 401 (la vía inmediata al cerrar la reunión sigue funcionando).",
        ],
  });
}
