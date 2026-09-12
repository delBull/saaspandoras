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

    const cleanBase = baseUrl.replace(/\/+$/, '').replace(/\/api$/, '').replace(/\/v1$/, '');
    let content: string | null = null;

    // 1. Try Native Ollama /api/chat
    try {
      const response = await fetch(`${cleanBase}/api/chat`, {
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
          options: { temperature: 0.1 }
        })
      });

      if (response.ok) {
        const data: any = await response.json();
        content = data?.message?.content;
      }
    } catch {
      // Fall through to /v1
    }

    // 2. Try OpenAI-compatible /v1/chat/completions
    if (!content) {
      try {
        const v1Res = await fetch(`${cleanBase}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: JSON.stringify(conversationHistory) }
            ],
            temperature: 0.1,
          })
        });

        if (v1Res.ok) {
          const data: any = await v1Res.json();
          content = data?.choices?.[0]?.message?.content;
        }
      } catch {
        // Fall through to OpenAI
      }
    }

    // 3. Resilient Fallback to OpenAI API if configured
    if (!content && process.env.OPENAI_API_KEY) {
      try {
        const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: JSON.stringify(conversationHistory) }
            ],
            temperature: 0.1,
          })
        });

        if (oaiRes.ok) {
          const data: any = await oaiRes.json();
          content = data?.choices?.[0]?.message?.content;
        }
      } catch {
        // Non-blocking degradation
      }
    }

    if (!content) {
      return null;
    }

    try {
      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(cleanJson) as LearningExtraction;
      return result;
    } catch (parseErr) {
      console.warn("[HermesLearningLoop] Failed to parse learning extraction JSON:", parseErr);
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

  /**
   * Processes purely analytical web events (clicks, form submits) for a lead to deduce
   * their transactional intent and score asynchronously.
   */
  static async processLeadEvents(leadId: string) {
    try {
      // 1. Fetch lead events
      const { marketingLeadEvents } = await import('@/db/schema');
      const { sql, desc } = await import('drizzle-orm');
      
      const events = await db.select()
        .from(marketingLeadEvents)
        .where(eq(marketingLeadEvents.leadId, leadId))
        .orderBy(desc(marketingLeadEvents.createdAt))
        .limit(20);

      if (events.length === 0) return;

      // 2. Format events for LLM
      const eventDescriptions = events.map(e => `[${e.createdAt?.toISOString()}] Event Type: ${e.type} | Data: ${JSON.stringify(e.payload || {})}`).join('\n');

      const systemPrompt = `You are the Hermes Cognitive Scoring Engine.
Analyze the following recent web events of a user.
Determine their transactional intent (score 0-100) and assign them a 'persona' (e.g., 'Risk-Averse', 'Whale', 'Curious', 'Window-Shopper').

You MUST respond ONLY with a valid JSON object matching this schema:
{
  "transactionalScore": number,
  "persona": "string"
}
Do not include markdown blocks or any other text.`;

      const model = process.env.HERMES_LEARNING_MODEL || "llama3.1";
      const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Events:\n${eventDescriptions}` }
          ],
          format: 'json',
          stream: false,
          options: { temperature: 0.1 }
        })
      });

      if (!response.ok) throw new Error(`LLM API error: ${response.statusText}`);

      const data: any = await response.json();
      const content = data?.message?.content;
      if (!content) return;

      const result = JSON.parse(content) as { transactionalScore: number; persona: string };

      // 3. Upsert Profile
      await db.insert(hermesCognitiveProfiles)
        .values({
          userId: leadId,
          transactionalScore: result.transactionalScore,
          persona: result.persona
        })
        .onConflictDoUpdate({
          target: hermesCognitiveProfiles.userId,
          set: {
            transactionalScore: result.transactionalScore,
            persona: result.persona,
            lastInteractionAt: new Date()
          }
        });

      console.log(`[HermesLearningLoop] Inferred score ${result.transactionalScore} and persona ${result.persona} for lead ${leadId} via web events.`);
    } catch (error) {
      console.error(`[HermesLearningLoop] Error processing lead events for ${leadId}:`, error);
    }
  }
}
