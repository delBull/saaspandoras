import { redirect } from "next/navigation";
import { db } from "@saasfly/db-core";
import { sql } from "@saasfly/db-core";
import { meetings } from "@saasfly/db-core/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Enlace corto de reunión: `/m/<code>` → `/meet/<uuid>`.
 *
 * El código son los primeros 12 hex del UUID (ver `lib/meet/meeting-links.ts`).
 * No sustituye al enlace canónico: solo lo abrevia para compartir. El token
 * personal `?p=` se reenvía intacto (es la capability de asistencia).
 */
export default async function ShortMeetingLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ p?: string; lobby?: string }>;
}) {
  const { code } = await params;
  const { p: joinToken, lobby } = await searchParams;

  const normalized = code.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (normalized.length < 6 || normalized.length > 32) {
    return <ShortLinkNotice reason="invalid" />;
  }

  let rows: Array<{ id: string }> = [];
  try {
    rows = await db
      .select({ id: meetings.id })
      .from(meetings)
      .where(sql`replace(lower(${meetings.id}), '-', '') like ${`${normalized}%`}`)
      .limit(2);
  } catch (error) {
    console.error("[ShortMeet] Error resolviendo enlace corto:", error);
    return <ShortLinkNotice reason="error" />;
  }

  const match = rows[0];
  if (!match) return <ShortLinkNotice reason="not_found" />;
  if (rows.length > 1) return <ShortLinkNotice reason="ambiguous" />;

  // Se reenvían los parámetros que importan: `p` (capability de asistencia) y
  // `lobby=1` (vista previa del host). Nada más se propaga.
  const query = new URLSearchParams();
  if (joinToken) query.set("p", joinToken);
  if (lobby === "1") query.set("lobby", "1");
  const suffix = query.toString();
  redirect(`/meet/${match.id}${suffix ? `?${suffix}` : ""}`);
}

function ShortLinkNotice({ reason }: { reason: "invalid" | "not_found" | "ambiguous" | "error" }) {
  const copy: Record<"invalid" | "not_found" | "ambiguous" | "error", { title: string; body: string }> = {
    invalid: {
      title: "Enlace no válido",
      body: "Este enlace de reunión está incompleto. Pide de nuevo el enlace al anfitrión.",
    },
    not_found: {
      title: "Reunión no encontrada",
      body: "El enlace ya no corresponde a ninguna reunión. Pide uno nuevo al anfitrión.",
    },
    ambiguous: {
      title: "Enlace ambiguo",
      body: "Ese código coincide con más de una reunión. Usa el enlace completo que recibiste por correo.",
    },
    error: {
      title: "No se pudo abrir la reunión",
      body: "Hubo un problema temporal al resolver el enlace. Intenta de nuevo en unos segundos.",
    },
  };
  const { title, body } = copy[reason];

  return (
    <main className="min-h-screen bg-[#07070B] text-white flex items-center justify-center p-8">
      <div className="max-w-sm text-center space-y-3">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-lime-400/80">
          Pandora&apos;s · Sovereign Meet
        </p>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-zinc-400 leading-relaxed">{body}</p>
      </div>
    </main>
  );
}
