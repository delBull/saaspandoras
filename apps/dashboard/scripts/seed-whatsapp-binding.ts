import { db } from '../src/db';
import { channelIdentityBindings } from '../src/db/schema';
import { eq, and } from 'drizzle-orm';

async function seed() {
  const channel = 'whatsapp';
  const externalUserId = '5213221374392';
  const organizationId = 'pandoras-corporate';

  console.log(`[Seed] Checking binding for ${channel} : ${externalUserId}...`);

  const existing = await db
    .select()
    .from(channelIdentityBindings)
    .where(
      and(
        eq(channelIdentityBindings.channel, channel),
        eq(channelIdentityBindings.externalUserId, externalUserId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    console.log(`[Seed] Binding already exists for ${externalUserId}. Updating identityId to ${organizationId}...`);
    await db.update(channelIdentityBindings)
      .set({ identityId: organizationId })
      .where(eq(channelIdentityBindings.externalUserId, externalUserId));
    console.log('[Seed] Successfully updated binding.');
  } else {
    console.log(`[Seed] Creating new binding for ${organizationId}...`);
    await db.insert(channelIdentityBindings).values({
      identityId: organizationId,
      channel: channel,
      externalUserId: externalUserId,
      address: `+${externalUserId}`,
      status: 'ACTIVE'
    });
    console.log('[Seed] Successfully inserted binding.');
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
