'use server';

import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { resend, FROM_EMAIL } from "@/lib/resend";

/* ─── Types ─── */

export interface NewsletterSubscriber {
    id: string;
    email: string;
    name: string;
    walletAddress?: string;
    subscribedAt: string;
    source: 'public' | 'manual' | 'widget';
}

export interface NewsletterCampaign {
    id: string;
    type: 'welcome' | 'monthly' | 'milestone' | 'investment' | 'custom';
    subject: string;
    preview: string;
    body: string;
    sentAt: string | null;
    scheduledFor: string | null;
    status: 'draft' | 'sent' | 'scheduled';
    recipientCount: number;
}

export interface NewsletterSettings {
    autoSendWelcome: boolean;
    senderName: string;
    senderEmail: string;
}

export interface NewsletterData {
    subscribers: NewsletterSubscriber[];
    campaigns: NewsletterCampaign[];
    settings: NewsletterSettings;
}

const DEFAULT_SETTINGS: NewsletterSettings = {
    autoSendWelcome: true,
    senderName: '',
    senderEmail: '',
};

/* ─── Templates ─── */

const TEMPLATES: Record<string, { subject: string; preview: string; body: string }> = {
    welcome: {
        subject: '¡Bienvenido a bordo!',
        preview: 'Gracias por unirte a nuestra comunidad',
        body: `Hola {{name}},

¡Gracias por suscribirte! A partir de ahora recibirás actualizaciones exclusivas sobre el proyecto.

**¿Qué esperar?**
- 📬 Actualizaciones mensuales de progreso
- 🎯 Alertas de hitos importantes
- 💎 Oportunidades de inversión prioritarias
- 🤝 Invitaciones a eventos exclusivos

Estamos construyendo algo grande y queremos que seas parte del viaje.

El equipo de {{project}}`,
    },
    monthly: {
        subject: 'Avances de {{project}} — {{month}}',
        preview: 'Resumen mensual de progreso y métricas',
        body: `Hola {{name}},

Te compartimos los avances de {{project}} durante este mes.

**📊 Progreso**
- Hitos cumplidos: {{milestones}}
- Nuevos miembros en la comunidad
- Actualizaciones de desarrollo

**🎯 Próximos Pasos**
Seguimos trabajando para llevar el proyecto al siguiente nivel. Gracias por ser parte.

El equipo de {{project}}`,
    },
    milestone: {
        subject: '¡Hito Alcanzado: {{milestone}}!',
        preview: 'Celebramos un logro importante',
        body: `Hola {{name}},

¡Grandes noticias! {{project}} acaba de alcanzar un hito importante:

**🏆 {{milestone}}**

Esto no sería posible sin el apoyo de nuestra comunidad. Cada vez estamos más cerca de nuestra visión compartida.

**¿Qué sigue?**
Seguimos avanzando con la hoja de ruta. Pronto compartiremos más novedades.

Gracias por ser parte de este viaje.

El equipo de {{project}}`,
    },
    investment: {
        subject: 'Oportunidad de Inversión — {{project}}',
        preview: 'Accede a términos preferenciales',
        body: `Hola {{name}},

Tenemos una oportunidad exclusiva para ti.

**💎 {{project}} — Nueva Ronda de Inversión**

Hemos abierto una ventana de inversión con términos preferenciales para nuestros suscriptores.

**Detalles:**
- Monto objetivo: {{targetAmount}}
- Valoración: {{valuation}}
- Beneficios exclusivos para early adopters

No dejes pasar esta oportunidad. El equipo de {{project}} está listo para escalar.

El equipo de {{project}}`,
    },
};

/* ─── Helpers ─── */

function getConfig(project: any): NewsletterData {
    const config = (project.extraConfig as Record<string, any>) || {};
    return (config.newsletter as NewsletterData) || { subscribers: [], campaigns: [], settings: { ...DEFAULT_SETTINGS } };
}

function setConfig(project: any, data: NewsletterData): any {
    const config = (project.extraConfig as Record<string, any>) || {};
    config.newsletter = data;
    return config;
}

/* ─── Actions ─── */

export async function getNewsletterData(projectId: number): Promise<NewsletterData> {
    try {
        const [project] = await db.select({ extraConfig: projects.extraConfig })
            .from(projects)
            .where(eq(projects.id, projectId));
        if (!project) return { subscribers: [], campaigns: [], settings: { ...DEFAULT_SETTINGS } };
        return getConfig(project);
    } catch (error) {
        console.error('[Newsletter] Error fetching:', error);
        return { subscribers: [], campaigns: [], settings: { ...DEFAULT_SETTINGS } };
    }
}

export async function getTemplates() {
    return Object.entries(TEMPLATES).map(([type, tpl]) => ({
        type,
        subject: tpl.subject,
        preview: tpl.preview,
        body: tpl.body,
    }));
}

export async function addSubscriber(
    projectId: number,
    data: { email: string; name?: string; walletAddress?: string; source?: 'public' | 'manual' | 'widget' }
) {
    try {
        const [project] = await db.select({ extraConfig: projects.extraConfig, title: projects.title })
            .from(projects)
            .where(eq(projects.id, projectId));
        if (!project) return { success: false, error: 'Proyecto no encontrado' };

        const newsletter = getConfig(project);

        if (newsletter.subscribers.some(s => s.email.toLowerCase() === data.email.toLowerCase())) {
            return { success: false, error: 'El email ya está registrado' };
        }

        const subscriber: NewsletterSubscriber = {
            id: crypto.randomUUID(),
            email: data.email.toLowerCase(),
            name: data.name || '',
            walletAddress: data.walletAddress,
            subscribedAt: new Date().toISOString(),
            source: data.source || 'public',
        };

        newsletter.subscribers.push(subscriber);

        // Auto-send welcome if enabled
        if (newsletter.settings.autoSendWelcome) {
            const tpl = TEMPLATES.welcome!;
            const campaignId = crypto.randomUUID();

            try {
                const htmlBody = tpl.body
                    .replace(/\n/g, '<br/>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\{\{name\}\}/g, subscriber.name || 'Suscriptor')
                    .replace(/\{\{project\}\}/g, project.title);

                await resend.emails.send({
                    from: FROM_EMAIL,
                    to: subscriber.email,
                    subject: tpl.subject,
                    html: htmlBody,
                });
            } catch (e) {
                console.error(`[Newsletter] Welcome email failed for ${subscriber.email}:`, e);
            }

            const campaign: NewsletterCampaign = {
                id: campaignId,
                type: 'welcome',
                subject: tpl.subject,
                preview: tpl.preview,
                body: tpl.body,
                sentAt: new Date().toISOString(),
                scheduledFor: null,
                status: 'sent',
                recipientCount: 1,
            };
            newsletter.campaigns.push(campaign);
        }

        await db.update(projects)
            .set({ extraConfig: setConfig(project, newsletter) })
            .where(eq(projects.id, projectId));

        revalidatePath(`/profile/projects/${projectId}/manage`);
        return { success: true, subscriber };
    } catch (error) {
        console.error('[Newsletter] Error adding subscriber:', error);
        return { success: false, error: 'Error al agregar suscriptor' };
    }
}

export async function removeSubscriber(projectId: number, subscriberId: string) {
    try {
        const [project] = await db.select({ extraConfig: projects.extraConfig })
            .from(projects)
            .where(eq(projects.id, projectId));
        if (!project) return { success: false, error: 'Proyecto no encontrado' };

        const newsletter = getConfig(project);
        newsletter.subscribers = newsletter.subscribers.filter(s => s.id !== subscriberId);

        await db.update(projects)
            .set({ extraConfig: setConfig(project, newsletter) })
            .where(eq(projects.id, projectId));

        revalidatePath(`/profile/projects/${projectId}/manage`);
        return { success: true };
    } catch (error) {
        console.error('[Newsletter] Error removing subscriber:', error);
        return { success: false, error: 'Error al eliminar suscriptor' };
    }
}

export async function sendCampaign(
    projectId: number,
    data: { type: NewsletterCampaign['type']; subject: string; preview: string; body: string }
) {
    try {
        const [project] = await db.select({ extraConfig: projects.extraConfig, title: projects.title })
            .from(projects)
            .where(eq(projects.id, projectId));
        if (!project) return { success: false, error: 'Proyecto no encontrado' };

        const newsletter = getConfig(project);
        const recipients = newsletter.subscribers.filter(s => s.email);

        // Send via Resend
        const htmlBody = data.body
            .replace(/\n/g, '<br/>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        let sentCount = 0;
        let failCount = 0;

        for (const sub of recipients) {
            try {
                const personalHtml = htmlBody
                    .replace(/\{\{name\}\}/g, sub.name || 'Suscriptor')
                    .replace(/\{\{project\}\}/g, project.title);

                await resend.emails.send({
                    from: FROM_EMAIL,
                    to: sub.email,
                    subject: data.subject.replace(/\{\{project\}\}/g, project.title),
                    html: personalHtml,
                });
                sentCount++;
            } catch (e) {
                console.error(`[Newsletter] Failed to send to ${sub.email}:`, e);
                failCount++;
            }
        }

        const campaign: NewsletterCampaign = {
            id: crypto.randomUUID(),
            type: data.type,
            subject: data.subject,
            preview: data.preview,
            body: data.body,
            sentAt: new Date().toISOString(),
            scheduledFor: null,
            status: 'sent',
            recipientCount: sentCount,
        };

        newsletter.campaigns.unshift(campaign);

        await db.update(projects)
            .set({ extraConfig: setConfig(project, newsletter) })
            .where(eq(projects.id, projectId));

        revalidatePath(`/profile/projects/${projectId}/manage`);
        return { success: true, campaign, sentCount, failCount };
    } catch (error) {
        console.error('[Newsletter] Error sending campaign:', error);
        return { success: false, error: 'Error al enviar campaña' };
    }
}

export async function updateNewsletterSettings(projectId: number, settings: Partial<NewsletterSettings>) {
    try {
        const [project] = await db.select({ extraConfig: projects.extraConfig })
            .from(projects)
            .where(eq(projects.id, projectId));
        if (!project) return { success: false, error: 'Proyecto no encontrado' };

        const newsletter = getConfig(project);
        newsletter.settings = { ...newsletter.settings, ...settings };

        await db.update(projects)
            .set({ extraConfig: setConfig(project, newsletter) })
            .where(eq(projects.id, projectId));

        revalidatePath(`/profile/projects/${projectId}/manage`);
        return { success: true, settings: newsletter.settings };
    } catch (error) {
        console.error('[Newsletter] Error updating settings:', error);
        return { success: false, error: 'Error al actualizar configuración' };
    }
}

export async function deleteCampaign(projectId: number, campaignId: string) {
    try {
        const [project] = await db.select({ extraConfig: projects.extraConfig })
            .from(projects)
            .where(eq(projects.id, projectId));
        if (!project) return { success: false, error: 'Proyecto no encontrado' };

        const newsletter = getConfig(project);
        newsletter.campaigns = newsletter.campaigns.filter(c => c.id !== campaignId);

        await db.update(projects)
            .set({ extraConfig: setConfig(project, newsletter) })
            .where(eq(projects.id, projectId));

        revalidatePath(`/profile/projects/${projectId}/manage`);
        return { success: true };
    } catch (error) {
        console.error('[Newsletter] Error deleting campaign:', error);
        return { success: false, error: 'Error al eliminar campaña' };
    }
}
