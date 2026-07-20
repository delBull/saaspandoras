import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';
import { eq, sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(process.env.DATABASE_URL as string);
const db = drizzle(client, { schema });

async function migrate() {
  console.log("🚀 Starting Events Migration (Sprint C/D)...");

  try {
    // 1. Fetch all old events using raw SQL since project_events is removed from schema
    const oldEventsResult = await db.execute(sql`SELECT * FROM project_events`);
    const oldEvents = oldEventsResult as any[];
    console.log(`📦 Found ${oldEvents.length} project events to migrate.`);

    if (oldEvents.length === 0) {
      console.log("✅ No events to migrate.");
      process.exit(0);
    }

    // Drop FK to allow event ID changes
    console.log("Dropping old foreign key on event_registrations...");
    try {
      await db.execute(sql`ALTER TABLE event_registrations DROP CONSTRAINT IF EXISTS event_registrations_event_id_project_events_id_fk;`);
    } catch (e) {
      console.log("FK drop skipped or failed, moving on...");
    }

    // Begin transaction for safety (actually doing manual steps to track IDs)
    for (const old of oldEvents) {
      console.log(`Migrating event: [${old.id}] ${old.title}`);

      // Map to platform_assets
      const newAsset = {
        projectId: old.projectId,
        type: 'project_event',
        title: old.title,
        metadata: {
          event: {
            ...((old.config as any) || {}),
            date: old.date,
            location: old.location,
            subType: old.type, // MACRO, CALENDAR, etc
          }
        },
        status: old.isActive ? 'active' : 'inactive',
        visibility: 'public',
        createdAt: old.createdAt,
        updatedAt: old.updatedAt,
      };

      // Insert into platformAssets
      const [inserted] = await db.insert(schema.platformAssets).values(newAsset as any).returning();
      if (!inserted) {
        console.error(`   -> Failed to insert event ${old.id}`);
        continue;
      }
      console.log(`   -> Created platform_asset ID: ${inserted.id}`);

      // Update eventRegistrations FK
      await db.execute(sql`
        UPDATE event_registrations 
        SET event_id = ${inserted.id} 
        WHERE event_id = ${old.id}
      `);
      console.log(`   -> Updated registrations for event ${old.id} to new asset ${inserted.id}`);
    }

    console.log("✅ Migration completed successfully!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await client.end();
  }
}

migrate();
