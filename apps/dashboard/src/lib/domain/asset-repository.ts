import { db } from "@/db";
import { platformAssets, campaignAssets } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { PlatformAssetDTO, AssetType, AssetMetadata } from "./dto";

export class AssetRepository {
  static async createAsset(data: {
    projectId: number;
    type: AssetType | string;
    title: string;
    description?: string | null;
    url?: string | null;
    version?: string;
    visibility?: string;
    tags?: string[];
    metadata?: AssetMetadata | any;
    createdBy: string;
  }): Promise<PlatformAssetDTO> {
    const [resource] = await db.insert(platformAssets).values({
      projectId: data.projectId,
      type: data.type as any,
      title: data.title,
      description: data.description,
      url: data.url,
      version: data.version || 'v1',
      visibility: data.visibility || 'public',
      tags: data.tags || [],
      metadata: data.metadata || {},
      status: 'active',
      createdBy: data.createdBy
    }).returning();

    return resource as any;
  }

  static async updateAsset(id: number, data: Partial<{
    title: string;
    description: string;
    url: string;
    version: string;
    visibility: string;
    tags: string[];
    metadata: AssetMetadata | any;
  }>): Promise<PlatformAssetDTO> {
    const [resource] = await db.update(platformAssets).set({
      ...data
    }).where(eq(platformAssets.id, id)).returning();

    return resource as any;
  }

  static async deleteAsset(id: number): Promise<void> {
    await db.delete(platformAssets).where(eq(platformAssets.id, id));
  }

  static async getAssetsByProject(projectId: number): Promise<PlatformAssetDTO[]> {
    const resources = await db.query.platformAssets.findMany({
      where: eq(platformAssets.projectId, projectId),
      orderBy: [desc(platformAssets.createdAt)]
    });
    return resources as any;
  }

  static async linkToCampaign(assetId: number, campaignId: number): Promise<void> {
    await db.insert(campaignAssets).values({
      campaignId,
      assetId
    });

    await db.update(platformAssets)
      .set({ linkedCampaignCount: sql`${platformAssets.linkedCampaignCount} + 1` })
      .where(eq(platformAssets.id, assetId));
  }
}
