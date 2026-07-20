import { db } from "@/db";
import { platformAssets } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { ProjectEventDTO } from "./dto";

export class EventRepository {
  static async findById(id: number): Promise<ProjectEventDTO | null> {
    const event = await db.query.platformAssets.findFirst({
      where: and(
        eq(platformAssets.id, id),
        eq(platformAssets.type, 'project_event' as any)
      )
    });
    if (!event) return null;
    const metadata = event.metadata as any;
    return {
      ...event,
      date: metadata?.event?.date || null,
      location: metadata?.event?.location || '',
      type: metadata?.event?.subType || 'MACRO',
      config: metadata?.event || {},
      isActive: event.status === 'active'
    } as any;
  }

  static async findByProjectIdAndId(projectId: number, eventId: number): Promise<ProjectEventDTO | null> {
    const event = await db.query.platformAssets.findFirst({
      where: and(
        eq(platformAssets.projectId, projectId),
        eq(platformAssets.id, eventId),
        eq(platformAssets.type, 'project_event' as any)
      )
    });
    if (!event) return null;
    const metadata = event.metadata as any;
    return {
      ...event,
      date: metadata?.event?.date || null,
      location: metadata?.event?.location || '',
      type: metadata?.event?.subType || 'MACRO',
      config: metadata?.event || {},
      isActive: event.status === 'active'
    } as any;
  }
  static async getEventsByProject(projectId: number): Promise<ProjectEventDTO[]> {
    const events = await db.query.platformAssets.findMany({
      where: and(
        eq(platformAssets.projectId, projectId),
        eq(platformAssets.type, 'project_event' as any)
      ),
      orderBy: [desc(platformAssets.createdAt)]
    });
    return events.map(e => {
      const metadata = e.metadata as any;
      return {
        ...e,
        date: metadata?.event?.date || null,
        location: metadata?.event?.location || '',
        type: metadata?.event?.subType || 'MACRO',
        config: metadata?.event || {},
        isActive: e.status === 'active'
      };
    }) as any[];
  }

  static async createEvent(data: {
    projectId: number;
    type: string;
    title: string;
    date: Date | null;
    location?: string;
    config?: any;
    isActive?: boolean;
  }): Promise<ProjectEventDTO> {
    const [event] = await db.insert(platformAssets).values({
      projectId: data.projectId,
      type: 'project_event' as any,
      title: data.title,
      metadata: {
        event: {
          ...data.config,
          date: data.date,
          location: data.location,
          subType: data.type
        }
      },
      status: data.isActive === false ? 'inactive' : 'active',
      visibility: 'public'
    }).returning();
    return event as any;
  }

  static async updateEvent(id: number, data: {
    title?: string;
    date?: Date | null;
    location?: string;
    config?: any;
    isActive?: boolean;
  }): Promise<ProjectEventDTO> {
    const [event] = await db.update(platformAssets).set({
      title: data.title,
      metadata: {
        event: {
          ...data.config,
          date: data.date,
          location: data.location
        }
      },
      status: data.isActive === false ? 'inactive' : 'active',
    }).where(eq(platformAssets.id, id)).returning();
    return event as any;
  }

  static async deleteEvent(id: number): Promise<void> {
    await db.delete(platformAssets).where(eq(platformAssets.id, id));
  }
}
