import { db } from "@/db";
import { agoraListings, artifacts, pandoraInventories } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { IListingStorageAdapter } from "@pandoras/agora-engine";

export class DrizzleListingStorageAdapter implements IListingStorageAdapter {

    async isArtifactOwnedBy(artifactId: string, userId: string): Promise<boolean> {
        const artifact = await db.query.artifacts.findFirst({
            where: eq(artifacts.id, artifactId)
        });
        return artifact?.ownerId === userId;
    }

    async isArtifactListed(artifactId: string): Promise<boolean> {
        // We already have `hasActiveListings`, keeping for interface compatibility
        return this.hasActiveListings(artifactId);
    }

    async getListingStatus(listingId: string): Promise<{ status: string; sellerId: string; artifactId: string } | null> {
        const row = await db.query.agoraListings.findFirst({
            where: eq(agoraListings.id, listingId)
        });
        if (!row) return null;
        return {
            status: row.status,
            sellerId: row.sellerTelegramId,
            artifactId: row.artifactId
        };
    }

    async hasActiveListings(artifactId: string): Promise<boolean> {
        const activeListing = await db.query.agoraListings.findFirst({
            where: and(
                eq(agoraListings.artifactId, artifactId),
                inArray(agoraListings.status, ["ACTIVE", "LOCKED", "ROFR_PENDING"])
            )
        });
        return !!activeListing;
    }

    async isArtifactInTreasury(artifactId: string): Promise<boolean> {
        const held = await db.query.pandoraInventories.findFirst({
            where: and(
                eq(pandoraInventories.artifactId, artifactId),
                eq(pandoraInventories.status, "HELD")
            )
        });
        return !!held;
    }

    async getLastCancelledAt(artifactId: string): Promise<Date | null> {
        const artifact = await db.query.artifacts.findFirst({
            where: eq(artifacts.id, artifactId)
        });

        if (!artifact?.lastListingCancelledAt) return null;
        return new Date(artifact.lastListingCancelledAt);
    }

    async createListing(protocolId: number, artifactId: string, sellerId: string, price: string): Promise<string> {
        const [inserted] = await db.insert(agoraListings).values({
            protocolId,
            artifactId,
            sellerTelegramId: sellerId,
            price: price.toString(),
            status: "ACTIVE"
        }).returning({ id: agoraListings.id });

        if (!inserted) throw new Error("Database insertion failed");
        return inserted.id;
    }

    async cancelListing(listingId: string, artifactId: string): Promise<void> {
        await db.transaction(async (tx) => {
            const now = new Date();

            // Update the listing
            await tx.update(agoraListings)
                .set({ status: "CANCELLED", cancelledAt: now })
                .where(eq(agoraListings.id, listingId));

            // Update the artifact macro state to invoke the 5-min cooldown
            await tx.update(artifacts)
                .set({ lastListingCancelledAt: now })
                .where(eq(artifacts.id, artifactId));
        });
    }
}
