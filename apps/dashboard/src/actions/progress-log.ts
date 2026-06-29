'use server';

import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface ProgressLogEntry {
  id: string;
  weekNumber: number;
  title: string;
  content: string;
  highlights: string[];
  createdAt: string;
}

export async function getProgressLogs(projectId: number): Promise<ProgressLogEntry[]> {
  try {
    const [project] = await db.select({ extraConfig: projects.extraConfig })
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) return [];
    const config = (project.extraConfig as Record<string, any>) || {};
    return (config.progressLogs as ProgressLogEntry[]) || [];
  } catch (error) {
    console.error('[ProgressLog] Error fetching:', error);
    return [];
  }
}

export async function addProgressLog(
  projectId: number,
  entry: { weekNumber: number; title: string; content: string; highlights: string[] }
) {
  try {
    const [project] = await db.select({ extraConfig: projects.extraConfig })
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) return { success: false, error: 'Proyecto no encontrado' };

    const config = (project.extraConfig as Record<string, any>) || {};
    const logs = (config.progressLogs as ProgressLogEntry[]) || [];

    const newEntry: ProgressLogEntry = {
      id: crypto.randomUUID(),
      ...entry,
      createdAt: new Date().toISOString(),
    };

    logs.unshift(newEntry);
    config.progressLogs = logs;

    await db.update(projects)
      .set({ extraConfig: config })
      .where(eq(projects.id, projectId));

    revalidatePath(`/profile/projects/${projectId}/manage/progress-log`);
    return { success: true, entry: newEntry };
  } catch (error) {
    console.error('[ProgressLog] Error adding:', error);
    return { success: false, error: 'Error al guardar' };
  }
}

export async function deleteProgressLog(projectId: number, entryId: string) {
  try {
    const [project] = await db.select({ extraConfig: projects.extraConfig })
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) return { success: false, error: 'Proyecto no encontrado' };

    const config = (project.extraConfig as Record<string, any>) || {};
    const logs = (config.progressLogs as ProgressLogEntry[]) || [];
    config.progressLogs = logs.filter(l => l.id !== entryId);

    await db.update(projects)
      .set({ extraConfig: config })
      .where(eq(projects.id, projectId));

    revalidatePath(`/profile/projects/${projectId}/manage/progress-log`);
    return { success: true };
  } catch (error) {
    console.error('[ProgressLog] Error deleting:', error);
    return { success: false, error: 'Error al eliminar' };
  }
}
