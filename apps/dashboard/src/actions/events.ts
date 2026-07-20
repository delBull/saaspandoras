'use server';

import { EventRepository } from "@/lib/domain/event-repository";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

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

    const event = await EventRepository.updateEvent(id, {
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
    console.error("Error updating event:", error);
    return { success: false, error: "Failed to update event" };
  }
}

export async function deleteProjectEvent(id: number) {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.address) throw new Error("Unauthorized");

    await EventRepository.deleteEvent(id);
    
    revalidatePath(`/admin/projects`);
    revalidatePath(`/profile/projects`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { success: false, error: "Failed to delete event" };
  }
}
