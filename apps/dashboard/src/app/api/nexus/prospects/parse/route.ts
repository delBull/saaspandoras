import { NextResponse } from "next/server";
import { requirePodActor } from "@/lib/nexus/pod-auth";
import { llmAvailable } from "@/lib/prospecting/extract";
import { textToSpec } from "@/lib/prospecting/text-to-spec";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * `POST /api/nexus/prospects/parse` — text-to-scrap (vista previa).
 *
 * No escribe nada: devuelve el `JobSpec` que se entendió y las notas de lo que
 * NO se entendió, para que el operador confirme antes de crear el job.
 */
export async function POST(req: Request) {
  const { error } = await requirePodActor();
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.slice(0, 4000) : "";
  if (!text.trim()) {
    return NextResponse.json({ error: "Escribe qué quieres encontrar." }, { status: 400 });
  }

  const result = await textToSpec(text);
  return NextResponse.json({
    spec: result.spec,
    notes: result.notes,
    usedLlm: result.usedLlm,
    suggestedSchedule: result.suggestedSchedule,
    llmAvailable: llmAvailable(),
  });
}
