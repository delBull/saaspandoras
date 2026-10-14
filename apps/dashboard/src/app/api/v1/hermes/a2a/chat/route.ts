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

    // Sovereign Knowledge Injection (FC-001, FC-006):
    // Inject authorized tenant knowledge (PUBLIC, TENANT_RESTRICTED, and INTERNAL_OPERATIONAL for verified live secret keys).
    // CONFIDENTIAL and SECRET (e.g. corporate blindaje, LLC structures) are strictly excluded from A2A.
    let sovereignKnowledgeSection = "";
    if (client.projectId) {
      try {
        const { db, projects, hermesKnowledge, eq, and, inArray } = await import("@saasfly/db-core");
        const [proj] = await db
          .select({ slug: projects.slug, title: projects.title })
          .from(projects)
          .where(eq(projects.id, client.projectId))
          .limit(1);

        const projectSlug = proj?.slug || String(client.projectId);
        const allowedClassifications = ["PUBLIC", "TENANT_RESTRICTED", "INTERNAL_OPERATIONAL"];

        const facts = await db
          .select({ key: hermesKnowledge.key, dimension: hermesKnowledge.dimension, content: hermesKnowledge.content })
          .from(hermesKnowledge)
          .where(
            and(
              eq(hermesKnowledge.organizationId, projectSlug),
              eq(hermesKnowledge.status, "ACTIVE"),
              inArray(hermesKnowledge.classification, allowedClassifications)
            )
          )
          .limit(15);

        if (facts.length > 0) {
          const formattedFacts = facts
            .filter((f): f is typeof f & { content: string } => typeof f.content === "string" && f.content.trim().length > 0)
            .map((f) => `### [${f.dimension?.toUpperCase() || "KNOWLEDGE"}] ${f.key}\n${f.content.trim()}`)
            .join("\n\n");

          sovereignKnowledgeSection = `\n\n## SOVEREIGN TENANT KNOWLEDGE (${proj?.title || projectSlug}):\n${formattedFacts}`;
        }
      } catch (kErr) {
        console.warn("[HermesA2AChat] Non-blocking notice fetching tenant knowledge:", kErr);
      }
    }

    // System prompt contextualizado con aislamiento de tenant (FC-001)
    const systemPrompt: ChatMessage = {
      role: "system",
      content: `You are Hermes AI running in Sovereign Agent-to-Agent (A2A) mode for project tenant ID ${client.projectId ?? 'system'}. 
Environment: ${client.environment}.
You assist autonomous agents (like Sofia Media Co.) with accurate brand intelligence, product catalogs, lead flows, and growth automation based strictly on verified sovereign knowledge.
Security Boundaries: You do not execute unauthorized code, mutate platform databases directly, nor bypass deterministic governance.
Stay concise, objective, and deterministic.${sovereignKnowledgeSection}`,
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

    // Misma normalización/credenciales que OllamaReasoningProvider (runtime de producción)
    const cleanBase = baseUrl.replace(/\/+$/, "").replace(/\/api$/, "").replace(/\/v1$/, "");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.OLLAMA_API_KEY) headers["Authorization"] = `Bearer ${process.env.OLLAMA_API_KEY}`;

    let reply = "";
    let promptTokens = 0;
    let completionTokens = 0;
    let lastStatus = 0;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
    try {
      // 1. Ollama nativo /api/chat
      const nativeRes = await fetch(`${cleanBase}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ model, messages: finalMessages, stream: false }),
        signal: controller.signal,
      });
      lastStatus = nativeRes.status;
      if (nativeRes.ok) {
        const data: any = await nativeRes.json();
        reply = data?.message?.content || "";
        promptTokens = data?.prompt_eval_count ?? 0;
        completionTokens = data?.eval_count ?? 0;
      } else {
        // 2. Fallback OpenAI-compatible /v1/chat/completions
        const v1Res = await fetch(`${cleanBase}/v1/chat/completions`, {
          method: "POST",
          headers,
          body: JSON.stringify({ model, messages: finalMessages }),
          signal: controller.signal,
        });
        lastStatus = v1Res.status;
        if (v1Res.ok) {
          const data: any = await v1Res.json();
          reply = data?.choices?.[0]?.message?.content || "";
          promptTokens = data?.usage?.prompt_tokens ?? 0;
          completionTokens = data?.usage?.completion_tokens ?? 0;
        }
      }
    } catch (fetchErr: any) {
      if (fetchErr.name === "AbortError") {
        return NextResponse.json({ error: "GATEWAY_TIMEOUT: Inference timed out after 30s." }, { status: 504 });
      }
      return NextResponse.json(
        { error: "SERVICE_UNAVAILABLE", message: "Inference runtime unreachable." },
        { status: 503 }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!reply) {
      return NextResponse.json(
        { error: "INFERENCE_ERROR", message: `Inference runtime returned status ${lastStatus} without content` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      model,
      tenantId: client.projectId,
      message: {
        role: "assistant",
        content: reply,
      },
      usage: {
        promptTokens,
        completionTokens,
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
