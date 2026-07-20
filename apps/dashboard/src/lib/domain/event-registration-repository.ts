import { db } from "@/db";
import { eventRegistrations } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export class EventRegistrationRepository {
  /**
   * Obtiene la cantidad de registros confirmados para un evento general (MACRO)
   */
  static async countConfirmedForMacroEvent(eventId: number): Promise<number> {
    const regs = await db.select().from(eventRegistrations).where(
      and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.status, 'CONFIRMED')
      )
    );
    return regs.length;
  }

  /**
   * Obtiene la cantidad de registros confirmados para un horario específico (CALENDAR)
   */
  static async countConfirmedForSlot(eventId: number, selectedDateTime: Date): Promise<number> {
    const regs = await db.select().from(eventRegistrations).where(
      and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.selectedDateTime, selectedDateTime),
        eq(eventRegistrations.status, 'CONFIRMED')
      )
    );
    return regs.length;
  }

  /**
   * Registra a un nuevo usuario en un evento
   */
  static async insertRegistration(data: {
    eventId: number;
    projectId: number;
    nombre: string;
    email: string;
    telefono: string;
    perfil: string;
    status: "CONFIRMED" | "CANCELLED";
    selectedDateTime: Date | null;
  }) {
    const [inserted] = await db.insert(eventRegistrations).values(data).returning();
    return inserted;
  }

  /**
   * Obtiene todos los registros para un evento especifico
   */
  static async getRegistrationsByEventId(eventId: number) {
    return await db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, eventId));
  }
}
