import { db } from "@/db";
import { agoraListings, protocolNavs } from "@/db/schema";
import { eq, and, lt, desc, inArray } from "drizzle-orm";

export interface IMarketDiscoveryAdapter {
    findUndervaluedListings(protocolId: number, minPrice: string): Promise<any[]>;
}

export class DrizzleMarketDiscoveryAdapter implements IMarketDiscoveryAdapter {
    async findUndervaluedListings(protocolId: number, minPrice: string): Promise<any[]> {
        return await db.select()
            .from(agoraListings)
            .where(
                and(
                    eq(agoraListings.protocolId, protocolId),
                    eq(agoraListings.status, "ACTIVE"),
                    lt(agoraListings.price, minPrice)
                )
            )
            .orderBy(agoraListings.price);
    }
}
