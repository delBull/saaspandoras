import { NextResponse } from "next/server";
import { getNexusAuthContext } from "@saasfly/shared";
import { db } from "@saasfly/db-core";
import { meetings, meetingActionItems } from "@saasfly/db-core";
import { eq, and } from "@saasfly/db-core";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";

export const maxDuration = 60; // Max execution time for Vercel

export async function POST(req: Request) {
  try {
    const authCtx = await getNexusAuthContext();
    if (!authCtx.isAuthenticated || !authCtx.collaboratorId || !authCtx.canonicalOrgId) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const canonicalOrgId = authCtx.canonicalOrgId as string;
    const formData = await req.formData();
    
    const meetingId = formData.get("meetingId") as string;
    const file = formData.get("file") as File;

    if (!meetingId || !file) {
      return NextResponse.json({ error: "meetingId y file son requeridos." }, { status: 400 });
    }

    // Security check: verify meeting belongs to tenant
    const meetRow = await db.query.meetings.findFirst({
      where: and(
        eq(meetings.id, meetingId),
        eq(meetings.canonicalOrgId, canonicalOrgId)
      )
    });

    if (!meetRow) {
      return NextResponse.json({ error: "Reunión no encontrada o sin acceso." }, { status: 404 });
    }

    // 1. File size limit (max 20MB for memory processing)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo es demasiado grande (max 20MB)." }, { status: 413 });
    }

    // Process file with Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Servicio de IA no disponible." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      Eres un asistente de Sovereign Agenda.
      Analiza la siguiente grabación de una reunión (puede ser audio o video).
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
          mimeType: file.type
        }
      }
    ]);

    const responseText = result.response.text();
    let jsonResult;
    try {
      // Remove any markdown formatting if present
      const cleanJsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      jsonResult = JSON.parse(cleanJsonStr);
    } catch (e) {
      console.error("Failed to parse Gemini output:", responseText);
      return NextResponse.json({ error: "El modelo falló al devolver un JSON estructurado válido." }, { status: 500 });
    }

    const { summary, actionItems } = jsonResult;

    // Transaction to ensure atomicity of summary and action items
    await db.transaction(async (tx) => {
      // Update Meeting with AI Summary
      await tx.update(meetings)
        .set({ 
          aiSummary: summary,
          status: meetRow.status === "live" || meetRow.status === "scheduled" ? "ended" : meetRow.status
        })
        .where(eq(meetings.id, meetingId));

      // Idempotency: delete previous action items
      await tx.delete(meetingActionItems).where(eq(meetingActionItems.meetingId, meetingId));

      // Insert Action Items
      if (actionItems && Array.isArray(actionItems) && actionItems.length > 0) {
        const inserts = actionItems.map((item: any) => ({
          id: crypto.randomUUID(),
          meetingId,
          canonicalOrgId,
          task: String(item.task || '').slice(0, 500), // sanitize
          assigneeName: String(item.assignee || '').slice(0, 200), // sanitize
          status: "pending" as const
        }));
        await tx.insert(meetingActionItems).values(inserts);
      }
    });

    return NextResponse.json({
      success: true,
      summary,
      actionItems
    });

  } catch (error: any) {
    console.error("Meeting process error:", error);
    return NextResponse.json({ error: "Error interno al procesar la grabación." }, { status: 500 });
  }
}
