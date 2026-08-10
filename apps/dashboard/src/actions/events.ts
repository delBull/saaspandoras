'use server';

import { EventRepository } from "@/lib/domain/event-repository";
import { getAuth, isAdmin } from "@/lib/auth";
import { db } from "@/db";
import { daoMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// ZERO TRUST TENANT GUARD: admins may access any project; founders may only
// access projects they belong to (dao_members).
async function assertProjectAccess(address: string, projectId: number): Promise<boolean> {
  if (await isAdmin(address)) return true;
  const membership = await db.select({ id: daoMembers.id })
    .from(daoMembers)
    .where(and(
      eq(daoMembers.wallet, address),
      eq(daoMembers.projectId, projectId)
    ))
    .limit(1);
  return membership.length > 0;
}

export async function getProjectEvents(projectId: number) {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.address) throw new Error("Unauthorized");

    const events = await EventRepository.getEventsByProject(projectId);

    return { success: true, events };
  } catch (error) {
    console.error("Error fetching events:", error);
    return { success: false, error: "Failed to fetch events" };
  }
}

export async function createProjectEvent(data: {
  projectId: number;
  type: string;
  title: string;
  date: Date | null;
  location?: string;
  config?: any;
  isActive?: boolean;
}) {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.address) throw new Error("Unauthorized");
    if (!(await assertProjectAccess(session.address, data.projectId))) throw new Error("Forbidden");

    const event = await EventRepository.createEvent({
      projectId: data.projectId,
      type: data.type,
      title: data.title,
      date: data.date,
      location: data.location,
      config: data.config,
      isActive: data.isActive
    });

    revalidatePath(`/admin/projects`);
    revalidatePath(`/profile/projects`);
    return { success: true, event };
  } catch (error) {
    console.error("Error creating event:", error);
    return { success: false, error: "Failed to create event" };
  }
}

export async function updateProjectEvent(id: number, data: {
  title?: string;
  date?: Date | null;
  location?: string;
  config?: any;
  isActive?: boolean;
}) {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.address) throw new Error("Unauthorized");

    // Tenant scope: resolve the event's project before mutating.
    const event = await EventRepository.findById(id);
    if (!event) throw new Error("NOT_FOUND");
    if (!(await assertProjectAccess(session.address, (event as any).projectId))) throw new Error("Forbidden");

    const updated = await EventRepository.updateEvent(id, {
      title: data.title,
      date: data.date,
      location: data.location,
      config: data.config,
      isActive: data.isActive
    });

    revalidatePath(`/admin/projects`);
    revalidatePath(`/profile/projects`);
    return { success: true, event: updated };
  } catch (error) {
    console.error("Error updating event:", error);
    return { success: false, error: "Failed to update event" };
  }
}

export async function deleteProjectEvent(id: number) {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.address) throw new Error("Unauthorized");

    // Tenant scope: resolve the event's project before deleting.
    const event = await EventRepository.findById(id);
    if (!event) throw new Error("NOT_FOUND");
    if (!(await assertProjectAccess(session.address, (event as any).projectId))) throw new Error("Forbidden");

    await EventRepository.deleteEvent(id);

    revalidatePath(`/admin/projects`);
    revalidatePath(`/profile/projects`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { success: false, error: "Failed to delete event" };
  }
}
