import { db } from "@saasfly/db-core";
import { marketingLeads } from "@saasfly/db-core";
import { eq, desc } from "@saasfly/db-core";

export class LeadRepository {
  static async findAllLeads() {
    return await db.select().from(marketingLeads).orderBy(desc(marketingLeads.createdAt));
  }

  static async findById(id: string) {
    return await db.query.marketingLeads.findFirst({
      where: eq(marketingLeads.id, id),
    });
  }
}
