
import { sendEmail } from "./client";

export interface SchedulerBrandIdentity {
    name: string;
    isPandoras: boolean;
    logoUrl?: string;
}

function generateICS(event: {
    start: Date;
    end: Date;
    summary: string;
    description: string;
    location?: string;
    organizer?: { name: string; email: string };
}) {
    const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    return [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Pandoras//Scheduler//EN",
        "BEGIN:VEVENT",
        `UID:${crypto.randomUUID()}`,
        `DTSTAMP:${formatDate(new Date())}`,
        `DTSTART:${formatDate(event.start)}`,
        `DTEND:${formatDate(event.end)}`,
        `SUMMARY:${event.summary}`,
        `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`,
        `LOCATION:${event.location || "Google Meet"}`,
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");
}

export async function sendBookingPendingEmail(
    to: string, 
    data: { 
        name: string; 
        date: string; 
        time: string; 
        brand?: SchedulerBrandIdentity 
    }
) {
    const isPandoras = data.brand?.isPandoras !== false;
    const brandName = data.brand?.name || "Pandora's";

    const headerTitle = isPandoras ? "Solicitud de Agenda Recibida" : `Solicitud Recibida - ${brandName}`;
    const subject = isPandoras 
        ? `🗓️ Solicitud de Agenda Recibida - Pandora's` 
        : `🗓️ Solicitud de Agenda Recibida - ${brandName}`;

    const footerHtml = isPandoras
        ? `<div style="font-size: 12px; color: #71717a; text-align: center;">Pandora's Growth OS • Sovereign Capital & Growth Infrastructure</div>`
        : `<div style="font-size: 12px; color: #52525b; text-align: center;">${brandName} • Gestión de Citas<br><span style="font-size: 11px; color: #a1a1aa; display: inline-block; margin-top: 6px;">Coordinado mediante <strong>Pandora's Growth OS</strong> • Infraestructura Soberana</span></div>`;

    await sendEmail({
        to,
        subject,
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0c0d12; border-radius: 12px; border: 1px solid #27272a; overflow: hidden; color: #f4f4f5;">
                <div style="background: #18181b; padding: 28px 24px; text-align: center; border-bottom: 1px solid #27272a;">
                    <h2 style="margin: 0; color: #ffffff; font-size: 20px; letter-spacing: -0.02em;">${headerTitle}</h2>
                </div>
                <div style="padding: 32px 24px;">
                    <p style="color: #e4e4e7; font-size: 16px; margin-top: 0;">Hola <strong>${data.name}</strong>,</p>
                    <p style="color: #a1a1aa; line-height: 1.6;">
                        Hemos reservado tu espacio provisionalmente. Nuestro equipo está coordinando los detalles y recibirás la confirmación definitiva con el enlace de acceso.
                    </p>
                    
                    <div style="background: #13141c; border: 1px solid #27272a; border-radius: 8px; padding: 18px; margin: 24px 0;">
                        <h3 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #e4c875;">Detalles de la Sesión</h3>
                        <p style="margin: 6px 0; color: #f4f4f5;"><strong>Fecha:</strong> ${data.date}</p>
                        <p style="margin: 6px 0; color: #f4f4f5;"><strong>Hora:</strong> ${data.time}</p>
                        <p style="margin: 6px 0; color: #f4f4f5;"><strong>Organizador:</strong> ${brandName}</p>
                    </div>

                    <p style="color: #71717a; font-size: 13px; margin-bottom: 0;">
                        Si necesitas reagendar o tienes consultas previas, por favor responde a este correo.
                    </p>
                </div>
                <div style="background: #111218; padding: 20px; border-top: 1px solid #27272a;">
                    ${footerHtml}
                </div>
            </div>
        `
    });
}

export async function sendBookingConfirmedEmail(to: string, data: {
    name: string;
    start: Date;
    end: Date;
    meetingLink?: string;
    brand?: SchedulerBrandIdentity;
}) {
    const isPandoras = data.brand?.isPandoras !== false;
    const brandName = data.brand?.name || "Pandora's";

    const dateStr = data.start.toLocaleDateString("es-MX", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = data.start.toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' });

    const subject = isPandoras
        ? `✅ Cita Confirmada - Pandora's Growth OS`
        : `✅ Cita Confirmada - ${brandName}`;

    const headerTitle = isPandoras
        ? "Cita Confirmada • Pandora's"
        : `Cita Confirmada • ${brandName}`;

    const footerHtml = isPandoras
        ? `<div style="font-size: 12px; color: #71717a; text-align: center;">Pandora's Growth OS • Sovereign Capital & Growth Infrastructure</div>`
        : `<div style="font-size: 12px; color: #52525b; text-align: center;">${brandName} • Gestión de Citas<br><span style="font-size: 11px; color: #a1a1aa; display: inline-block; margin-top: 6px;">Coordinado mediante <strong>Pandora's Growth OS</strong> • Infraestructura Soberana</span></div>`;

    const icsContent = generateICS({
        start: data.start,
        end: data.end,
        summary: isPandoras ? "Sesión Pandora's Growth OS" : `Sesión con ${brandName}`,
        description: `Sesión agendada con ${brandName}.\nEnlace de acceso: ${data.meetingLink || "Por definir"}`,
        location: data.meetingLink
    });

    const icsBase64 = Buffer.from(icsContent).toString('base64');

    await sendEmail({
        to,
        subject,
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0c0d12; border-radius: 12px; border: 1px solid #27272a; overflow: hidden; color: #f4f4f5;">
                <div style="background: #18181b; padding: 28px 24px; text-align: center; border-bottom: 1px solid #27272a;">
                    <h2 style="margin: 0; color: #e4c875; font-size: 22px; letter-spacing: -0.02em;">${headerTitle}</h2>
                </div>
                <div style="padding: 32px 24px;">
                    <p style="color: #e4e4e7; font-size: 16px; margin-top: 0;">Hola <strong>${data.name}</strong>,</p>
                    <p style="color: #a1a1aa; line-height: 1.6;">
                        Tu cita ha sido confirmada exitosamente con <strong>${brandName}</strong>. Hemos adjuntado el evento a este correo para que puedas agregarlo directamente a tu calendario de Google, Outlook o Apple.
                    </p>
                    
                    <div style="background: #13141c; border: 1px solid #27272a; border-radius: 8px; padding: 20px; margin: 24px 0;">
                        <h3 style="margin: 0 0 14px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #e4c875;">Coordenadas de la Reunión</h3>
                        <p style="margin: 8px 0; color: #f4f4f5;">📅 <strong>Fecha:</strong> ${dateStr}</p>
                        <p style="margin: 8px 0; color: #f4f4f5;">⏰ <strong>Hora:</strong> ${timeStr}</p>
                        <p style="margin: 8px 0; color: #f4f4f5;">🔗 <strong>Enlace de llamada:</strong> <a href="${data.meetingLink || '#'}" style="color: #d4a853; text-decoration: underline;">${data.meetingLink || 'Se generará minutos antes'}</a></p>
                    </div>

                    <div style="text-align: center; margin: 28px 0;">
                        <a href="${data.meetingLink || '#'}" style="background: #d4a853; color: #0c0d12; padding: 12px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; display: inline-block;">
                            Unirse a la Reunión
                        </a>
                    </div>

                    <p style="color: #71717a; font-size: 13px; margin-bottom: 0;">
                        Atentamente,<br>
                        <strong>Equipo ${brandName}</strong>
                    </p>
                </div>
                <div style="background: #111218; padding: 20px; border-top: 1px solid #27272a;">
                    ${footerHtml}
                </div>
            </div>
        `,
        attachments: [
            {
                filename: 'invite.ics',
                content: icsBase64,
                content_type: 'text/calendar'
            }
        ]
    });
}

export async function sendBookingReminderEmail(to: string, data: {
    name: string;
    start: Date;
    end: Date;
    meetingLink?: string;
    window: '24h' | '1h';
    brand?: SchedulerBrandIdentity;
}) {
    const isPandoras = data.brand?.isPandoras !== false;
    const brandName = data.brand?.name || "Pandora's";

    const dateStr = data.start.toLocaleDateString("es-MX", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = data.start.toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' });

    const reminderText = data.window === '24h' ? "en 24 horas (mañana)" : "en 1 hora";
    const subject = isPandoras
        ? `⏰ Recordatorio: Tu sesión con Pandora's es ${reminderText}`
        : `⏰ Recordatorio: Tu sesión con ${brandName} es ${reminderText}`;

    const footerHtml = isPandoras
        ? `<div style="font-size: 12px; color: #71717a; text-align: center;">Pandora's Growth OS • Sovereign Capital & Growth Infrastructure</div>`
        : `<div style="font-size: 12px; color: #52525b; text-align: center;">${brandName} • Gestión de Citas<br><span style="font-size: 11px; color: #a1a1aa; display: inline-block; margin-top: 6px;">Coordinado mediante <strong>Pandora's Growth OS</strong> • Infraestructura Soberana</span></div>`;

    const icsContent = generateICS({
        start: data.start,
        end: data.end,
        summary: isPandoras ? "Sesión Pandora's Growth OS" : `Sesión con ${brandName}`,
        description: `Recordatorio de sesión agendada con ${brandName}.\nEnlace de acceso: ${data.meetingLink || "Por definir"}`,
        location: data.meetingLink
    });
    const icsBase64 = Buffer.from(icsContent).toString('base64');

    await sendEmail({
        to,
        subject,
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0c0d12; border-radius: 12px; border: 1px solid #27272a; overflow: hidden; color: #f4f4f5;">
                <div style="background: #18181b; padding: 28px 24px; text-align: center; border-bottom: 1px solid #27272a;">
                    <h2 style="margin: 0; color: #e4c875; font-size: 20px; letter-spacing: -0.02em;">⏰ Recordatorio de Sesión</h2>
                </div>
                <div style="padding: 32px 24px;">
                    <p style="color: #e4e4e7; font-size: 16px; margin-top: 0;">Hola <strong>${data.name}</strong>,</p>
                    <p style="color: #a1a1aa; line-height: 1.6;">
                        Te recordamos que tu sesión con <strong>${brandName}</strong> comenzará <strong>${reminderText}</strong>.
                    </p>
                    
                    <div style="background: #13141c; border: 1px solid #27272a; border-radius: 8px; padding: 20px; margin: 24px 0;">
                        <p style="margin: 8px 0; color: #f4f4f5;">📅 <strong>Fecha:</strong> ${dateStr}</p>
                        <p style="margin: 8px 0; color: #f4f4f5;">⏰ <strong>Hora:</strong> ${timeStr}</p>
                        <p style="margin: 8px 0; color: #f4f4f5;">🔗 <strong>Enlace de llamada:</strong> <a href="${data.meetingLink || '#'}" style="color: #d4a853; text-decoration: underline;">${data.meetingLink || 'Se generará en breve'}</a></p>
                    </div>

                    <div style="text-align: center; margin: 28px 0;">
                        <a href="${data.meetingLink || '#'}" style="background: #d4a853; color: #0c0d12; padding: 12px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; display: inline-block;">
                            Ingresar a la Sesión
                        </a>
                    </div>
                </div>
                <div style="background: #111218; padding: 20px; border-top: 1px solid #27272a;">
                    ${footerHtml}
                </div>
            </div>
        `,
        attachments: [
            {
                filename: 'invite.ics',
                content: icsBase64,
                content_type: 'text/calendar'
            }
        ]
    });
}

