import { NextResponse } from "next/server";
import { getNexusAuthContext } from "@saasfly/shared";
import { db } from "@saasfly/db-core";
import { meetings, meetingActionItems } from "@saasfly/db-core";
import { eq, and } from "@saasfly/db-core";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import crypto from "crypto";
import { isMeetingHost, resolveRoomActor } from "@/lib/meet/room-credentials";

export const maxDuration = 60; // Vercel: audio ≤ 10 MB

/**
 * 🏛️ ARCHITECTURE NOTE — Procesar grabación → minuta
 * ===================================================
 * Autoridad (nunca desde el body):
 *   - Sesión Nexus con rol host (o admin de operaciones), o
 *   - `ref` firmado de la sala + `isMeetingHost` (enlace temporal de anfitrión).
 * Un participante con su `?p=` NO puede procesar ni sobrescribir la minuta.
 *
 * Solo audio (máx. 10 MB). El video no aporta al acta y multiplica el payload.
 *
 * Proveedores:
 *   1. Gemini (`GEMINI_API_KEY` o `GOOGLE_GENERATIVE_AI_API_KEY`) — preferido.
 *   2. OpenAI (`OPENAI_API_KEY`) — fallback si Gemini no está configurado o falla.
 *   Si ninguno existe: 503 AI_NOT_CONFIGURED (nunca se inventa un resumen).
 *
 * Preservación de datos:
 *   - Las tareas MANUALES (`source = 'manual'`) no se tocan.
 *   - Solo se reemplazan las generadas por IA (`source = 'ai'`).
 *   - El resumen se guarda ANTES de las tareas: si fallan las tareas, el resumen
 *     no se pierde (evita el 409 NO_SUMMARY en el follow-up).
 */
const MAX_BYTES = 10 * 1024 * 1024;
const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "ADMIN_OPERATIONS"]);
const GEMINI_MODEL = process.env.GEMINI_MEETING_MODEL || "gemini-2.5-flash";
const OPENAI_MODEL = process.env.OPENAI_MEETING_MODEL || "gpt-4o-mini";
const OPENAI_TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1";

interface SummaryResult {
  summary: string;
  actionItems: Array<{ task?: unknown; assignee?: unknown }>;
  provider: "gemini" | "openai";
  model: string;
}

const SUMMARY_PROMPT = `
  Eres un asistente de Sovereign Agenda.
  Analiza la siguiente grabación de audio de una reunión.
  Devuelve un JSON estrictamente estructurado con este formato (sin markdown blocks de código, solo el texto en JSON válido):
  {
    "summary": "Resumen ejecutivo de la reunión en 2-3 oraciones breves",
    "actionItems": [
      { "task": "Descripción de la tarea a realizar", "assignee": "Nombre del asignado o 'Equipo'" }
    ]
  }
`;

function parseSummaryJson(text: string): { summary: string; actionItems: any[] } {
  const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(clean) as { summary?: unknown; actionItems?: unknown };
  const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
  const actionItems = Array.isArray(parsed.actionItems) ? parsed.actionItems : [];
  if (!summary) throw new Error("EMPTY_SUMMARY");
  return { summary, actionItems };
}

async function generateWithGemini(
  buffer: Buffer,
  mimeType: string,
  apiKey: string
): Promise<SummaryResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const result = await model.generateContent([
    SUMMARY_PROMPT,
    { inlineData: { data: buffer.toString("base64"), mimeType } },
  ]);
  const parsed = parseSummaryJson(result.response.text());
  return { ...parsed, provider: "gemini", model: GEMINI_MODEL };
}

async function generateWithOpenAI(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
  apiKey: string
): Promise<SummaryResult> {
  const client = new OpenAI({ apiKey });

  const upload = await toFile(buffer, fileName || "reunion.mp3", { type: mimeType });
  const transcription = await client.audio.transcriptions.create({
    file: upload,
    model: OPENAI_TRANSCRIBE_MODEL,
    response_format: "text",
  });

  const transcript =
    typeof transcription === "string"
      ? transcription
      : String((transcription as { text?: string })?.text ?? "");
  if (!transcript.trim()) throw new Error("EMPTY_TRANSCRIPT");

  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Eres un asistente de Sovereign Agenda. Devuelves exclusivamente JSON válido con 'summary' y 'actionItems'.",
      },
      {
        role: "user",
        content: `${SUMMARY_PROMPT}\n\nTranscripción de la reunión:\n${transcript}`,
      },
    ],
  });

  const parsed = parseSummaryJson(completion.choices[0]?.message?.content ?? "");
  return { ...parsed, provider: "openai", model: OPENAI_MODEL };
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const meetingId = String(formData.get("meetingId") ?? "");
    const fileEntry = formData.get("file");

    // `instanceof File` no es portable en todos los runtimes de Node; un archivo
    // de FormData nunca llega como string.
    if (!meetingId || !fileEntry || typeof fileEntry === "string") {
      return NextResponse.json({ error: "meetingId y file son requeridos." }, { status: 400 });
    }
    const file = fileEntry as File;

    // 1. Identidad: sesión (host/admin) o ref firmado de la sala (host).
    const { actor, error } = await resolveRoomActor(req.headers, formData.get("ref"), meetingId);
    if (error || !actor) {
      const failure = error ?? { status: 401, message: "No autorizado." };
      return NextResponse.json({ error: failure.message }, { status: failure.status });
    }

    const conditions = [
      eq(meetings.id, actor.meetingId),
      ...(actor.orgId ? [eq(meetings.canonicalOrgId, actor.orgId)] : []),
    ];

    const meetRow = await db.query.meetings.findFirst({ where: and(...conditions) });
    if (!meetRow) {
      return NextResponse.json({ error: "Reunión no encontrada o sin acceso." }, { status: 404 });
    }

    const sessionAuth = await getNexusAuthContext();
    const isAdmin =
      sessionAuth.isAuthenticated && ADMIN_ROLES.has(String(sessionAuth.role ?? ""));
    const isHost = isMeetingHost(meetRow, actor.actorCollaboratorId);

    if (!isHost && !isAdmin) {
      return NextResponse.json(
        { error: "Solo el anfitrión puede procesar la grabación." },
        { status: 403 }
      );
    }

    // 2. Solo audio y tamaño acotado.
    if (!file.type.startsWith("audio/")) {
      return NextResponse.json(
        { error: "Solo se aceptan archivos de audio (MP3, M4A, WAV, OGG, WebM)." },
        { status: 415 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "El audio es demasiado grande (máx. 10 MB ≈ 40 min a 32 kbps)." },
        { status: 413 }
      );
    }

    // 3. Proveedor de IA: Gemini preferido, OpenAI como fallback.
    const geminiKey =
      process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!geminiKey && !openaiKey) {
      return NextResponse.json(
        {
          error:
            "La IA no está configurada en este entorno. Falta GEMINI_API_KEY o OPENAI_API_KEY.",
          code: "AI_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let aiResult: SummaryResult | null = null;

    if (geminiKey) {
      try {
        aiResult = await generateWithGemini(buffer, file.type, geminiKey);
      } catch (geminiError) {
        console.warn("[Minuta] Gemini falló; se intenta OpenAI si está configurado.", geminiError);
      }
    }

    if (!aiResult && openaiKey) {
      try {
        aiResult = await generateWithOpenAI(buffer, file.type, file.name, openaiKey);
      } catch (openaiError) {
        console.error("[Minuta] OpenAI también falló:", openaiError);
      }
    }

    if (!aiResult) {
      return NextResponse.json(
        {
          error: "No se pudo procesar el audio con el proveedor de IA. Revisa la configuración.",
          code: "AI_PROVIDER_FAILED",
        },
        { status: 502 }
      );
    }

    const { summary, actionItems } = aiResult;

    // 4. Guardar el resumen PRIMERO. Si falla la sincronización de tareas, el
    // resumen no se pierde (causa del 409 NO_SUMMARY en follow-up).
    // Procesar audio NO finaliza la reunión: finalizar es una acción explícita
    // del host. Así el resumen no dispara correos por sorpresa.
    await db
      .update(meetings)
      .set({ aiSummary: summary })
      .where(eq(meetings.id, meetingId));

    let tasksSynced = true;
    try {
      await db.transaction(async (tx) => {
        await tx
          .delete(meetingActionItems)
          .where(
            and(
              eq(meetingActionItems.meetingId, meetingId),
              eq(meetingActionItems.source, "ai")
            )
          );

        if (actionItems.length > 0) {
          const inserts = actionItems.map((item: any) => ({
            id: crypto.randomUUID(),
            meetingId,
            canonicalOrgId: meetRow.canonicalOrgId,
            task: String(item.task || "").slice(0, 500),
            assigneeName: String(item.assignee || "").slice(0, 200),
            status: "pending" as const,
            source: "ai" as const,
          }));
          await tx.insert(meetingActionItems).values(inserts);
        }
      });
    } catch (taskError) {
      tasksSynced = false;
      console.error("[Minuta] El resumen se guardó, pero fallaron las tareas:", taskError);
    }

    return NextResponse.json({
      success: true,
      summary,
      actionItems,
      tasksSynced,
      provider: aiResult.provider,
      model: aiResult.model,
      preservedManualItems: true,
    });
  } catch (error: any) {
    console.error("Meeting process error:", error);
    return NextResponse.json({ error: "Error interno al procesar la grabación." }, { status: 500 });
  }
}
