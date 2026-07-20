'use server';

import { AssetRepository } from "@/lib/domain/asset-repository";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function createProjectResource(data: {
  projectId: number;
  type: string;
  title: string;
  description?: string;
  url?: string;
  version?: string;
  visibility?: string;
  tags?: string[];
  eventConfig?: any;
}) {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.address || !await isAdmin(session.address)) throw new Error("Unauthorized");

    const resource = await AssetRepository.createAsset({
      projectId: data.projectId,
      type: data.type,
      title: data.title,
      description: data.description,
      url: data.url,
      version: data.version,
      visibility: data.visibility,
      tags: data.tags,
      metadata: data.eventConfig ? { event: data.eventConfig } : undefined,
      createdBy: session.address
    });

    revalidatePath(`/admin/projects`);
    return { success: true, resource };
  } catch (error) {
    console.error("Error creating resource:", error);
    return { success: false, error: "Failed to create resource" };
  }
}

export async function linkResourceToCampaign(data: {
  campaignId: number;
  assetId: number;
}) {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.address || !await isAdmin(session.address)) throw new Error("Unauthorized");

    await AssetRepository.linkToCampaign(data.assetId, data.campaignId);

    revalidatePath(`/admin/marketing`);
    return { success: true };
  } catch (error: any) {
    console.error("Error linking resource:", error);
    if (error.code === '23505') {
      return { success: false, error: "Este recurso ya está vinculado a la campaña." };
    }
    return { success: false, error: "Failed to link resource" };
  }
}

export async function getProjectResources(projectId: number) {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.address && !session?.unverifiedAddress) throw new Error("Unauthorized");

    const resources = await AssetRepository.getAssetsByProject(projectId);

    return { success: true, resources };
  } catch (error) {
    console.error("Error fetching resources:", error);
    return { success: false, error: "Failed to fetch resources" };
  }
}

export async function deleteProjectResource(id: number) {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.address) throw new Error("Unauthorized");

    await AssetRepository.deleteAsset(id);
    
    revalidatePath(`/admin/projects`);
    revalidatePath(`/profile/projects`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting resource:", error);
    return { success: false, error: "Failed to delete resource" };
  }
}

export async function updateProjectResource(id: number, data: {
  title?: string;
  description?: string;
  url?: string;
  version?: string;
  visibility?: string;
  tags?: string[];
  eventConfig?: any;
}) {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.address) throw new Error("Unauthorized");

    const resource = await AssetRepository.updateAsset(id, {
      title: data.title,
      description: data.description,
      url: data.url,
      version: data.version,
      visibility: data.visibility,
      tags: data.tags,
      metadata: data.eventConfig ? { event: data.eventConfig } : undefined
    });

    revalidatePath(`/admin/projects`);
    revalidatePath(`/profile/projects`);
    return { success: true, resource };
  } catch (error) {
    console.error("Error updating resource:", error);
    return { success: false, error: "Failed to update resource" };
  }
}
