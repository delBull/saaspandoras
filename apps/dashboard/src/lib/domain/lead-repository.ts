import { db } from "@/db";
import { marketingLeads } from "@/db/schema";
import { desc } from "drizzle-orm";

export class LeadRepository {
  static async findAllLeads() {
    return await db.select().from(marketingLeads).orderBy(desc(marketingLeads.createdAt));
  }
}
