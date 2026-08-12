import OpenAI from "openai";
import { CognitiveProvider, CognitiveContext, CognitiveResponse } from "./cognitive-provider";

export class OpenAIProvider implements CognitiveProvider {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateResponse(context: CognitiveContext): Promise<CognitiveResponse> {
    const model = process.env.HERMES_COGNITIVE_MODEL || "gpt-4o-mini";
    
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
    systemPrompt += `Adjust your response to gently move the user along this journey without being overly aggressive.\n`;

    // Messages Array
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
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
      const response = await this.openai.chat.completions.create({
        model,
        messages,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "cognitive_response",
            strict: true,
            schema: {
              type: "object",
              properties: {
                action: { type: "string", enum: ["SEND_MESSAGE", "ESCALATE_TO_HUMAN", "DO_NOTHING"] },
                responseText: { type: "string" },
                confidence: { type: "number" },
                reasoning: { type: "string" }
              },
              required: ["action", "confidence", "reasoning"],
              additionalProperties: false
            }
          }
        },
        temperature: 0.2
      });

      const data: any = response;
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
         throw new Error("No content received from OpenAI");
      }

      const result = JSON.parse(content) as CognitiveResponse;
      return result;
      
    } catch (error) {
      console.error("[OpenAIProvider] Error generating response:", error);
      throw error;
    }
  }
}
