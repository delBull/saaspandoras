import { db } from "@/db";
import { platformEvents } from "@/db/schema";
import { eq, or, and, desc } from "drizzle-orm";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface MemoryContext {
  recentHistory: ConversationMessage[];
}

export class MemoryProvider {
  /**
   * Fetches the recent conversation history for a given identity.
   * Abstracts away the DB layer so HermesCognitiveLayer doesn't know about Drizzle/Postgres.
   */
  static async getRecentHistory(identityId: string, limit: number = 10): Promise<MemoryContext> {
    const events = await db.query.platformEvents.findMany({
      where: and(
        eq(platformEvents.identityId, identityId),
        or(
          eq(platformEvents.eventType, "MESSAGE_RECEIVED"),
          eq(platformEvents.eventType, "MESSAGE_SENT")
        )
      ),
      orderBy: [desc(platformEvents.occurredAt)],
      limit
    });

    // Reverse to chronological order (oldest first)
    const chronologicalEvents = events.reverse();

    const recentHistory: ConversationMessage[] = chronologicalEvents.map(evt => {
      const payload = evt.payload as { text?: string };
      const role: "user" | "assistant" = evt.eventType === "MESSAGE_RECEIVED" ? "user" : "assistant";
      return {
        role,
        content: payload?.text || "",
        timestamp: evt.occurredAt?.toISOString() || new Date().toISOString()
      };
    }).filter(msg => msg.content !== "");

    return { recentHistory };
  }
}
