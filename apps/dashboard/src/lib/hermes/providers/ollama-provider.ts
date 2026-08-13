import { CognitiveProvider, CognitiveContext, CognitiveResponse } from "./cognitive-provider";

export class OllamaProvider implements CognitiveProvider {
  async generateResponse(context: CognitiveContext): Promise<CognitiveResponse> {
    const model = process.env.OLLAMA_MODEL || process.env.HERMES_COGNITIVE_MODEL || "llama3.1"; 
    const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    
    const { domainPack, memory, journeyContext, payload } = context;
    
    // System Prompt Construction
    let systemPrompt = `You are a Cognitive Growth Agent. Follow these core traits (Soul):\n`;
    systemPrompt += `Role: ${domainPack.soul.role}\n`;
    systemPrompt += `Persona: ${domainPack.soul.persona}\n`;
    systemPrompt += `Tone: ${domainPack.soul.tone.warmth} warmth, ${domainPack.soul.tone.formality} formality.\n\n`;

    systemPrompt += `Knowledge Base (Use this to answer questions truthfully):\n`;
    if (domainPack.knowledgeDef?.faqs?.length) {
      systemPrompt += `FAQS:\n${domainPack.knowledgeDef.faqs.map(f => `Q: ${f.question} A: ${f.answer}`).join('\n')}\n\n`;
    }
    
    if (domainPack.soul.forbiddenClaims?.length) {
      systemPrompt += `CRITICAL RULES (Forbidden Claims - NEVER VIOLATE):\n- ${domainPack.soul.forbiddenClaims.join('\n- ')}\n\n`;
    }

    systemPrompt += `Journey State:\n`;
    systemPrompt += `The user is currently at stage: ${journeyContext.stage}. The primary intent for this interaction is: ${journeyContext.intent}.\n`;
    systemPrompt += `Adjust your response to gently move the user along this journey without being overly aggressive.\n\n`;

    systemPrompt += `INSTRUCTIONS:\nYou MUST respond ONLY with a valid JSON object matching this schema:
{
  "action": "SEND_MESSAGE" | "ESCALATE_TO_HUMAN" | "DO_NOTHING",
  "responseText": "Your generated text here",
  "confidence": 0.0 to 1.0,
  "reasoning": "Explain your logic briefly"
}
Do not wrap it in markdown block. Just return raw JSON.`;

    // Messages Array
    const messages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt }
    ];

    // History
    for (const msg of memory.recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }

    // Current Payload (if text is not in history or needs explicit treatment)
    const lastMsg = memory.recentHistory[memory.recentHistory.length - 1];
    if (payload?.text && (memory.recentHistory.length === 0 || lastMsg?.content !== payload.text)) {
       messages.push({ role: "user", content: payload.text });
    }

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          format: 'json',
          stream: false,
          options: {
            temperature: 0.2
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data: any = await response.json();
      const content = data?.message?.content;
      if (!content) {
         throw new Error("No content received from Ollama");
      }

      const result = JSON.parse(content) as CognitiveResponse;
      return result;
      
    } catch (error) {
      console.error("[OllamaProvider] Error generating response:", error);
      throw error;
    }
  }
}
