import { db } from "@saasfly/db-core";
import { agoraListings, protocolNavs } from "@saasfly/db-core";
import { eq, and, lt, desc, inArray } from "@saasfly/db-core";

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
