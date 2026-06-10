'use server';

import { db } from "@/db";
import { eventRegistrations, projectEvents, projects } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function registerForEvent(prevState: any, formData: FormData) {
    try {
        const nombre = formData.get('nombre') as string;
        const email = formData.get('email') as string;
        const telefono = formData.get('telefono') as string;
        const perfil = formData.get('perfil') as string;
        const eventIdStr = formData.get('eventId') as string;
        const projectIdStr = formData.get('projectId') as string;
        const selectedDateTimeStr = formData.get('selectedDateTime') as string;

        if (!nombre || !email || !eventIdStr || !projectIdStr) {
            return { error: 'Faltan campos obligatorios' };
        }

        const eventId = Number(eventIdStr);
        const projectId = Number(projectIdStr);

        await db.insert(eventRegistrations).values({
            eventId,
            projectId,
            nombre,
            email,
            telefono: telefono || '',
            perfil: perfil || null,
            status: 'CONFIRMED',
            selectedDateTime: selectedDateTimeStr ? new Date(selectedDateTimeStr) : null
        });

        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { error: e.message?.includes('relation "event_registrations" does not exist')
            ? 'La tabla de registros aún no está disponible. Ejecuta la migración de BD primero.'
            : 'Ocurrió un error al procesar tu solicitud.' };
    }
}
