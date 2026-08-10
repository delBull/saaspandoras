import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { outboxEvents } from "../src/db/schema";

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "list") {
    console.log("Fetching failed events...");
    const failed = await db.query.outboxEvents.findMany({
      where: eq(outboxEvents.status, "failed"),
      orderBy: (events, { desc }) => [desc(events.createdAt)],
      limit: 20
    });

    if (failed.length === 0) {
      console.log("No failed events found.");
    } else {
      console.table(failed.map(f => ({
        id: f.id,
        aggregateType: f.aggregateType,
        eventType: f.eventType,
        attempts: f.attempts,
        lastError: f.lastError,
        createdAt: f.createdAt
      })));
    }
  } else if (command === "retry") {
    const eventId = args[1];
    if (!eventId) {
      console.error("Please provide an event ID. Usage: ts-node outbox-retry.ts retry <eventId>");
      process.exit(1);
    }

    console.log(`Re-queueing event ${eventId}...`);
    const result = await db.update(outboxEvents)
      .set({ 
        status: "pending", 
        attempts: 0,
        lastError: null,
        lockedAt: null,
        lockedBy: null
      })
      .where(eq(outboxEvents.id, eventId))
      .returning();

    if (result.length > 0) {
      console.log(`Successfully re-queued event ${eventId}. It will be processed on the next cron run.`);
    } else {
      console.error(`Failed to re-queue event ${eventId}. Not found.`);
    }
  } else if (command === "retry-all") {
    console.log(`Re-queueing all failed events...`);
    const result = await db.update(outboxEvents)
      .set({ 
        status: "pending", 
        attempts: 0,
        lastError: null,
        lockedAt: null,
        lockedBy: null
      })
      .where(eq(outboxEvents.status, "failed"))
      .returning();

    console.log(`Successfully re-queued ${result.length} failed events.`);
  } else {
    console.log(`
Usage: 
  ts-node outbox-retry.ts list
  ts-node outbox-retry.ts retry <eventId>
  ts-node outbox-retry.ts retry-all
    `);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
