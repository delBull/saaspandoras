import { db } from '@/db';
import { hermesCognitiveProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface LearningExtraction {
  behavioralTraits: string[];
  optimalApproach: string;
}

export class HermesLearningLoop {
  /**
   * Resumes the conversation history and extracts behavioral traits using a lightweight LLM.
   */
  static async extractLearnings(userId: string, conversationHistory: { role: string; content: string }[]): Promise<LearningExtraction | null> {
    const model = process.env.HERMES_LEARNING_MODEL || "llama3.1"; // Can be a cheaper model
    const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    
    if (conversationHistory.length < 4) {
      // Not enough data to learn yet
      return null;
    }

    const systemPrompt = `You are a metacognitive learning module for an AI Sales Agent.
Analyze the following conversation history between a USER and an ASSISTANT.
Extract behavioral traits about the USER (e.g. how they negotiate, what they care about, their tone).
Also define an 'optimalApproach' - a brief instruction for the ASSISTANT on how to handle this USER in the future.

You MUST respond ONLY with a valid JSON object matching this schema:
{
  "behavioralTraits": ["string", "string"],
  "optimalApproach": "string"
}
Do not include markdown blocks or any other text.
`;

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(conversationHistory) }
          ],
          format: 'json',
          stream: false,
          options: {
            temperature: 0.1
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Learning API error: ${response.statusText}`);
      }

      const data: any = await response.json();
      const content = data?.message?.content;
      if (!content) return null;

      const result = JSON.parse(content) as LearningExtraction;
      return result;
    } catch (error) {
      console.error("[HermesLearningLoop] Extraction failed:", error);
      return null;
    }
  }

  /**
   * Triggers the learning loop and saves to DB. 
   * Call this as a background job or fire-and-forget promise when a session concludes.
   */
  static async triggerLearning(userId: string, history: { role: string; content: string }[]) {
    try {
      const extraction = await this.extractLearnings(userId, history);
      if (!extraction) return;

      await db.update(hermesCognitiveProfiles)
        .set({
          behavioralTraits: extraction.behavioralTraits,
          optimalApproach: extraction.optimalApproach
        })
        .where(eq(hermesCognitiveProfiles.userId, userId));
        
      console.log(`[HermesLearningLoop] Successfully updated traits for ${userId}`);
    } catch (error) {
      console.error(`[HermesLearningLoop] Error processing trigger:`, error);
    }
  }
}
