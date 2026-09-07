import { db } from '@/db';
import { marketingIdentities, channelIdentityBindings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { ChannelType } from '../channel-gateway';

export class IdentityResolver {
  /**
   * Resolves a raw channel interaction into a canonical marketingIdentity.
   * If the binding doesn't exist, it creates a new anonymous marketingIdentity and binds it.
   */
  static async resolveIdentity(
    channel: ChannelType,
    externalUserId: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const existingBinding = await db.query.channelIdentityBindings.findFirst({
      where: (bindings, { eq, and }) =>
        and(
          eq(bindings.channel, channel),
          eq(bindings.externalUserId, externalUserId)
        ),
    });

    if (existingBinding) {
      return existingBinding.identityId;
    }

    // No binding found. Create a new anonymous marketing identity.
    const newIdentityId = uuidv4();
    
    // Attempt to extract some info from metadata
    const name = metadata?.firstName 
        ? `${metadata.firstName} ${metadata.lastName || ''}`.trim() 
        : metadata?.username || 'Anónimo';

    await db.insert(marketingIdentities).values({
      id: newIdentityId,
      metadata: { name },
      // Cannot set email/wallet yet, this is an anonymous lead from a channel
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create the binding
    await db.insert(channelIdentityBindings).values({
      identityId: newIdentityId,
      channel,
      externalUserId,
      address: metadata?.username || externalUserId, // Use username if available as address
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return newIdentityId;
  }
}
