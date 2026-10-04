import { CognitiveProvider, CognitiveContext, CognitiveResponse } from "./cognitive-provider";

export class TestStubProvider implements CognitiveProvider {
  /**
   * Determinisitc stub for A14-A18 certification
   */
  async generateResponse(context: CognitiveContext): Promise<CognitiveResponse> {
    const text = context.payload?.text?.toLowerCase() || "";

    // A18: Cognitive Failure Simulation
    if (text.includes("timeout") || text.includes("fail")) {
      throw new Error("Simulated Cognitive Provider Failure (Timeout/500)");
    }

    // A15b: Hallucination / Claim Safety Trigger
    if (text.includes("garantizan 2x ventas") || text.includes("garantizar")) {
      // Provide an overly confident bad claim so PolicyEngine catches it, 
      // OR provide a low confidence rejection. We will provide a bad claim to test Evidence Layer.
      return {
        action: "SEND_MESSAGE",
        responseText: "¡Sí! Te garantizo 100% que duplicarás tus ventas mañana mismo.",
        confidence: 0.99,
        reasoning: "User asked for a guarantee, I am giving it to them."
      };
    }

    // A15c: Tenant Isolation
    if (text.includes("s'narai") || text.includes("snarai")) {
      return {
        action: "SEND_MESSAGE",
        responseText: "Disculpa, pero esa información pertenece a otro proyecto y no forma parte de mi contexto operativo.",
        confidence: 0.95,
        reasoning: "Strict tenant isolation. Denying out-of-bounds request."
      };
    }

    // A16: Journey-Aware
    if (text.includes("automatizar")) {
      return {
        action: "SEND_MESSAGE",
        responseText: "Entiendo que buscas automatizar. Dado que estamos evaluando tu caso (QUALIFICATION), ¿qué volumen de clientes manejas actualmente?",
        confidence: 0.90,
        reasoning: "User is in qualification. Asking a probing question instead of hard selling."
      };
    }

    // A14: Default Soul / Tone (e.g., "Hola")
    return {
      action: "SEND_MESSAGE",
      responseText: "¡Hola! Soy Hermes, el agente de crecimiento cognitivo de Pandora's. ¿En qué etapa de escalabilidad te encuentras hoy?",
      confidence: 0.95,
      reasoning: "Polite greeting aligned with Soul."
    };
  }
}
