import { NextRequest, NextResponse } from "next/server";
import { integrationGuard } from "@/lib/integrations/guard";

export const runtime = "nodejs";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * POST /api/v1/hermes/a2a/chat
 * Endpoint soberano Agent-to-Agent (A2A) para integración headless con el runtime de Ollama.
 * 
 * Directivas Constitucionales y de Seguridad (FC-004, FC-006):
 * 1. El LLM nunca es una frontera de autorización.
 * 2. Protegido estrictamente con capability `hermes_a2a` fail-closed.
 * 3. Ejecución directa sobre el runtime local/soberano de Ollama (process.env.OLLAMA_BASE_URL).
 */
export async function POST(req: NextRequest) {
  try {
    const guardResult = await integrationGuard(req, {
      requiredCapability: "hermes_a2a",
    });

    if (!guardResult.ok) {
      return NextResponse.json({ error: guardResult.error }, { status: guardResult.status });
    }

    const { client } = guardResult;
    const body = await req.json().catch(() => ({}));
    const { messages, model: requestedModel } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "INVALID_PAYLOAD: messages array is required and must not be empty." },
        { status: 400 }
      );
    }

    // Runtime de inferencia soberano: Ollama
    const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const model = requestedModel || process.env.OLLAMA_MODEL || "llama3.1";

    // System prompt contextualizado con aislamiento de tenant (FC-001)
    const systemPrompt: ChatMessage = {
      role: "system",
      content: `You are Hermes AI running in Sovereign Agent-to-Agent (A2A) mode for project tenant ID ${client.projectId ?? 'system'}. 
Environment: ${client.environment}.
You assist autonomous agents with business intelligence, lead scoring, and growth automation.
Stay concise, objective, and deterministic.`,
    };

    // Filtrar mensajes del cliente: ignorar cualquier intento de inyectar role === "system"
    // Solo permitir mensajes legítimos de usuario y asistente
    const sanitizedUserMessages = messages
      .filter((m: any) => m && typeof m.content === "string" && m.role !== "system")
      .map((m: any) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: String(m.content).trim(),
      }))
      .filter((m: any) => m.content.length > 0);

    if (sanitizedUserMessages.length === 0) {
      return NextResponse.json(
        { error: "INVALID_PAYLOAD: At least one user/assistant message with content is required." },
        { status: 400 }
      );
    }

    const finalMessages: ChatMessage[] = [
      systemPrompt,
      ...sanitizedUserMessages,
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    let ollamaResponse;
    try {
      ollamaResponse = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: finalMessages,
          stream: false,
        }),
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      if (fetchErr.name === "AbortError") {
        return NextResponse.json({ error: "GATEWAY_TIMEOUT: Inference timed out after 30s." }, { status: 504 });
      }
      return NextResponse.json(
        { error: "SERVICE_UNAVAILABLE", message: `Ollama inference runtime unreachable at ${baseUrl}` },
        { status: 503 }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!ollamaResponse.ok) {
      return NextResponse.json(
        { error: "INFERENCE_ERROR", message: `Ollama returned status ${ollamaResponse.status}` },
        { status: 502 }
      );
    }

    const data: any = await ollamaResponse.json();
    const reply = data?.message?.content || "";

    return NextResponse.json({
      success: true,
      model,
      tenantId: client.projectId,
      message: {
        role: "assistant",
        content: reply,
      },
      usage: {
        promptTokens: data?.prompt_eval_count ?? 0,
        completionTokens: data?.eval_count ?? 0,
      },
    });
  } catch (error: any) {
    console.error("❌ [HermesA2AChatAPI] Error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: error?.message || "Internal error in A2A chat." },
      { status: 500 }
    );
  }
}
