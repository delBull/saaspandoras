import { NextResponse } from "next/server";
import { getNexusAuthContext } from "@saasfly/shared";
import { db } from "@saasfly/db-core";
import { meetings, meetingActionItems } from "@saasfly/db-core";
import { eq, and } from "@saasfly/db-core";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";
import { isMeetingHost, resolveRoomActor } from "@/lib/meet/room-credentials";

export const maxDuration = 60; // Vercel: audio ≤ 10 MB con Gemini Flash

/**
 * 🏛️ ARCHITECTURE NOTE — Procesar grabación → minuta
 * ===================================================
 * Autoridad (nunca desde el body):
 *   - Sesión Nexus con rol host (o admin de operaciones), o
 *   - `ref` firmado de la sala + `isMeetingHost` (enlace temporal de anfitrión).
 * Un participante con su `?p=` NO puede procesar ni sobrescribir la minuta.
 *
 * Solo audio (máx. 10 MB). El video no aporta al acta y multiplica el payload.
 * Gemini recibe inline data; el límite real baja por el base64 (~33% extra).
 *
 * Preservación de datos:
 *   - Las tareas MANUALES (`source = 'manual'`) no se tocan.
 *   - Solo se reemplazan las generadas por IA (`source = 'ai'`).
 */
const MAX_BYTES = 10 * 1024 * 1024;
const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "ADMIN_OPERATIONS"]);
const MEETING_MODEL = process.env.GEMINI_MEETING_MODEL || "gemini-2.5-flash";

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

    // 2. Solo audio y tamaño acotado (inline data de Gemini).
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

    // 3. Procesar con Gemini.
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Servicio de IA no disponible." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MEETING_MODEL });

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
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

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      },
    ]);

    const responseText = result.response.text();
    let jsonResult: { summary?: unknown; actionItems?: unknown };
    try {
      const cleanJsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      jsonResult = JSON.parse(cleanJsonStr);
    } catch {
      console.error("Failed to parse Gemini output:", responseText);
      return NextResponse.json(
        { error: "El modelo falló al devolver un JSON estructurado válido." },
        { status: 500 }
      );
    }

    const summary = typeof jsonResult.summary === "string" ? jsonResult.summary : "";
    const actionItems = Array.isArray(jsonResult.actionItems) ? jsonResult.actionItems : [];

    // 4. Transacción: resumen + reemplazo SOLO de tareas generadas por IA.
    await db.transaction(async (tx) => {
      // Procesar audio NO finaliza la reunión: finalizar es una acción explícita
      // del host. Así el resumen no dispara correos por sorpresa.
      await tx
        .update(meetings)
        .set({ aiSummary: summary })
        .where(eq(meetings.id, meetingId));

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

    return NextResponse.json({
      success: true,
      summary,
      actionItems,
      model: MEETING_MODEL,
      preservedManualItems: true,
    });
  } catch (error: any) {
    console.error("Meeting process error:", error);
    return NextResponse.json({ error: "Error interno al procesar la grabación." }, { status: 500 });
  }
}
