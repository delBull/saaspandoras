/**
 * Platform Service: Calendar
 * 
 * Administra exclusivamente tiempo y disponibilidad (slots).
 * No sabe qué es una campaña, un funnel o un webinar.
 * Es transversal a todo el ecosistema Pandora's.
 */
export interface TimeSlot {
  id: string;
  tenantId: string;
  startTime: string; // ISO
  endTime: string; // ISO
  status: 'AVAILABLE' | 'RESERVED';
  referenceId?: string; // ID agnóstico a lo que reservó el slot (CampaignId, CallId, etc.)
}

export class CalendarService {
  private slots: Map<string, TimeSlot> = new Map();

  public async createSlot(tenantId: string, startTime: string, endTime: string): Promise<string> {
    const id = `slot_${Date.now()}`;
    this.slots.set(id, { id, tenantId, startTime, endTime, status: 'AVAILABLE' });
    return id;
  }

  public async findAvailability(tenantId: string, after: string): Promise<TimeSlot[]> {
    return Array.from(this.slots.values()).filter(s => 
      s.tenantId === tenantId && 
      s.status === 'AVAILABLE' && 
      new Date(s.startTime) >= new Date(after)
    );
  }

  public async reserveSlot(slotId: string, referenceId: string): Promise<boolean> {
    const slot = this.slots.get(slotId);
    if (slot && slot.status === 'AVAILABLE') {
      slot.status = 'RESERVED';
      slot.referenceId = referenceId;
      console.log(`[CalendarService] Slot ${slotId} reservado exitosamente para la referencia ${referenceId}`);
      return true;
    }
    return false;
  }

  public async releaseSlot(slotId: string): Promise<void> {
    const slot = this.slots.get(slotId);
    if (slot) {
      slot.status = 'AVAILABLE';
      slot.referenceId = undefined;
      console.log(`[CalendarService] Slot ${slotId} liberado.`);
    }
  }
}
