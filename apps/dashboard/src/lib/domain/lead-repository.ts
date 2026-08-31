import { db } from "@/db";
import { marketingLeads } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

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
