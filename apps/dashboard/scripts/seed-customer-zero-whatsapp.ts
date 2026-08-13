import { db } from '../src/db';
import { channelIdentityBindings, projects } from '../src/db/schema';
import { eq, and } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

// Ensure .env is loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seedCustomerZeroWhatsApp() {
  console.log('--- Seeding Customer Zero WhatsApp Binding (C5.22) ---');

  // Customer Zero is 'pandoras-corporate'
  const projectSlug = 'pandoras-corporate';

  // 1. Find or create the pandoras-corporate project to get its exact tenant/identity ID
  let rows = await db.select().from(projects).where(eq(projects.slug, projectSlug)).limit(1);
  if (rows.length === 0) {
    console.log(`Project ${projectSlug} not found. Creating it...`);
    rows = await db.insert(projects).values({
      title: "Pandora's Corporate",
      slug: projectSlug,
      description: "Hermes - Pandora's Institutional Conversational Interface"
    }).returning();
  }

  const tenantIdStr = projectSlug;
  // Canonicalized phone number format (no spaces, starts with +)
  const externalPhone = process.env.CUSTOMER_ZERO_PHONE || '+5213221374392'; 
  const credentialsRef = `vault:channel:pandoras-corporate`; // Format updated for agnostic outbound

  console.log(`Found Customer Zero tenantId: ${tenantIdStr}`);

  // 2. Insert or update the Channel Binding
  const existingBindings = await db
    .select()
    .from(channelIdentityBindings)
    .where(
      and(
        eq(channelIdentityBindings.channel, 'whatsapp'),
        eq(channelIdentityBindings.externalUserId, externalPhone)
      )
    )
    .limit(1);

  if (existingBindings.length > 0) {
    console.log('WhatsApp binding already exists, updating...');
    await db.update(channelIdentityBindings)
      .set({
        identityId: tenantIdStr,
        address: externalPhone,
        status: 'ACTIVE',
        updatedAt: new Date()
      })
      .where(eq(channelIdentityBindings.id, existingBindings[0]!.id));
  } else {
    console.log('Creating new WhatsApp binding...');
    await db.insert(channelIdentityBindings).values({
      identityId: tenantIdStr,
      channel: 'whatsapp',
      externalUserId: externalPhone,
      address: externalPhone,
      status: 'ACTIVE',
      verifiedAt: new Date()
    });
  }

  console.log(`✅ Successfully seeded WhatsApp channel binding for Customer Zero (${projectSlug})`);
}

if (require.main === module) {
  seedCustomerZeroWhatsApp()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
