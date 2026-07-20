import { ProjectRepository } from "./project-repository";
import { EventRepository } from "./event-repository";
import { EventRegistrationRepository } from "./event-registration-repository";
import crypto from 'crypto';

export class LeadDomainService {
  /**
   * Registra a un usuario en un evento, valida cupos y envía notificaciones.
   */
  static async registerForEvent(params: {
    eventId: number;
    projectId: number;
    nombre: string;
    email: string;
    telefono: string;
    perfil: string;
    selectedDateTimeStr: string | null;
    meetingPreference: string;
  }) {
    const { eventId, projectId, nombre, email, telefono, perfil, selectedDateTimeStr, meetingPreference } = params;

    const project = await ProjectRepository.findById(projectId);
    const event = await EventRepository.findById(eventId);

    if (!event || !project) {
      return { success: false, error: 'Evento o proyecto no encontrado' };
    }

    // Capacity check
    const config = typeof event.config === 'string' ? JSON.parse(event.config) : event.config || {};
    
    if (event.type === 'CALENDAR' && selectedDateTimeStr) {
      const selectedDate = new Date(selectedDateTimeStr);
      const confirmedCount = await EventRegistrationRepository.countConfirmedForSlot(eventId, selectedDate);
      const slotCapacity = config.maxCapacityPerSlot || 1;
      if (confirmedCount >= slotCapacity) {
        return { success: false, error: 'Este horario ya no está disponible. Por favor selecciona otro.' };
      }
    } else if (event.type === 'MACRO') {
      const confirmedCount = await EventRegistrationRepository.countConfirmedForMacroEvent(eventId);
      const maxCapacity = config.maxCapacity || 20;
      if (confirmedCount >= maxCapacity) {
        return { success: false, error: 'El cupo para este evento se ha agotado.' };
      }
    }

    // Generate meeting link if VIRTUAL
    let finalLocation = event.location || 'Presencial';
    let jitsiLink = '';
    if (meetingPreference === 'VIRTUAL' || config.meetingType === 'VIRTUAL') {
      const rand = crypto.randomBytes(6).toString('base64url');
      jitsiLink = `https://meet.jit.si/pandoras-${project.slug}-${rand}`;
      finalLocation = jitsiLink;
    } else if (config.mapsLink) {
      finalLocation = `${event.location} - ${config.mapsLink}`;
    }

    const dateTimeWithTz = selectedDateTimeStr ? `${selectedDateTimeStr}-06:00` : null;
    const finalSelectedDate = dateTimeWithTz ? new Date(dateTimeWithTz) : null;

    // Persist registration
    await EventRegistrationRepository.insertRegistration({
      eventId,
      projectId,
      nombre,
      email,
      telefono: telefono || '',
      perfil: (perfil || '') + (meetingPreference ? ` (${meetingPreference})` : ''),
      status: 'CONFIRMED',
      selectedDateTime: finalSelectedDate
    });

    return { 
      success: true, 
      project, 
      event, 
      config, 
      finalLocation, 
      jitsiLink, 
      finalSelectedDate 
    };
  }
}
