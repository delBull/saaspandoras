import { db } from "@/db";
import { marketingExecutions, marketingCampaigns, whatsappPreapplyLeads, users } from "@/db/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import { sendEmail } from "@/lib/email/client";
import { sendWhatsAppMessage } from "@/lib/whatsapp/utils/client";
// import { renderToStaticMarkup } from "react-dom/server";
import { PandorasCampaignEmail } from "@/emails/campaigns/PandorasCampaignEmail";

interface CampaignStep {
    day: number;
    type: 'whatsapp' | 'email';
    contentId?: string;
    message?: string;
    subject?: string;
    conditions?: Record<string, any>;
}

interface CampaignConfig {
    steps: CampaignStep[];
}

export class MarketingEngine {

    static async startCampaign(campaignName: string, targetId: { userId?: string, leadId?: number }) {
        console.log(`[MarketingEngine] Starting campaign '${campaignName}' for user ${JSON.stringify(targetId)}`);

        const [campaign] = await db
            .select()
            .from(marketingCampaigns)
            .where(eq(marketingCampaigns.name, campaignName))
            .limit(1);

        if (!campaign?.isActive) {
            console.warn(`[MarketingEngine] Campaign '${campaignName}' not found or inactive`);
            return null;
        }

        const nextRunAt = new Date();

        const [execution] = await db.insert(marketingExecutions).values({
            id: crypto.randomUUID(),
            campaignId: campaign.id,
            userId: targetId.userId,
            leadId: targetId.leadId?.toString(),
            status: 'active',
            currentStageIndex: 0,
            nextRunAt: nextRunAt,
            historyLog: [],
            metadata: {}
        }).returning();

        return execution;
    }

    static async processDueExecutions() {
        const now = new Date();

        const due = await db
            .select({
                execution: marketingExecutions,
                campaign: marketingCampaigns
            })
            .from(marketingExecutions)
            .innerJoin(marketingCampaigns, eq(marketingExecutions.campaignId, marketingCampaigns.id))
            .where(and(
                eq(marketingExecutions.status, 'active'),
                lte(marketingExecutions.nextRunAt, now)
            ));

        console.log(`[MarketingEngine] Found ${due.length} due executions`);

        let processed = 0;
        let errors = 0;

        for (const { execution, campaign } of due) {
            try {
                await this.executeStage(execution, campaign);
                processed++;
            } catch (e) {
                console.error(`[MarketingEngine] Error processing execution ${execution.id}:`, e);
                errors++;
            }
        }

        return { processed, errors };
    }

    private static async executeStage(execution: typeof marketingExecutions.$inferSelect, campaign: typeof marketingCampaigns.$inferSelect) {
        const config = campaign.config as unknown as CampaignConfig;
        const currentStepIndex = execution.currentStageIndex;

        if (!config.steps || currentStepIndex >= config.steps.length) {
            await this.completeExecution(execution.id, 'Finished all steps');
            return;
        }

        const step = config.steps[currentStepIndex];
        if (!step) {
            console.error(`[MarketingEngine] Step ${currentStepIndex} is undefined.`);
            return;
        }

        console.log(`[MarketingEngine] Executing Step ${currentStepIndex} (Day ${step.day}) Type: ${step.type}`);

        // GET TARGET DATA
        const contact = { phone: '', email: '', name: 'Friend' };

        if (execution.leadId) {
            const leadId = parseInt(execution.leadId);
            const results = await db.select().from(whatsappPreapplyLeads).where(eq(whatsappPreapplyLeads.id, leadId)).limit(1);
            const lead = results[0];
            if (lead) {
                contact.phone = lead.userPhone;
                contact.email = lead.applicantEmail || '';
                contact.name = lead.applicantName || 'Friend';
            }
        } else if (execution.userId) {
            const [user] = await db.select().from(users).where(eq(users.id, execution.userId)).limit(1);
            if (user) {
                contact.email = user.email || '';
                contact.name = user.name || 'Friend';
            }
        }

        if (!contact.phone && !contact.email) {
            console.error(`[MarketingEngine] No contact info for execution ${execution.id}`);
            await this.completeExecution(execution.id, 'Missing contact info');
            return;
        }

        // --- REPLACE VARIABLES ---
        const replaceVars = (text: string) => text.replace(/{{name}}/g, contact.name).replace(/{{project}}/g, 'tu proyecto');

        // --- EXECUTE ACTION ---
        let actionResult: any = {};

        if (step.type === 'whatsapp' && contact.phone) {
            if (!step.message) throw new Error("WhatsApp step missing message");
            const body = replaceVars(step.message);
            await sendWhatsAppMessage(contact.phone, body);
            actionResult = { channel: 'whatsapp', sentTo: contact.phone };
        }
        else if (step.type === 'email' && contact.email) {
            if (!step.contentId) throw new Error("Email step missing contentId");

            const templateData = this.getTemplateData(step.contentId, contact.name);

            // Dynamic import to avoid build issues with server components
            const { render } = await import('@react-email/render');

            const html = await render(
                PandorasCampaignEmail({
                    ...templateData,
                    bodyContent: templateData.body
                })
            );

            const subject = step.subject ? replaceVars(step.subject) : templateData.heading;

            await sendEmail({
                to: contact.email,
                subject: subject,
                html: html
            });
            actionResult = { channel: 'email', sentTo: contact.email };
        }

        // Update History
        const logEntry = {
            timestamp: new Date().toISOString(),
            action: `execute_step_${currentStepIndex}`,
            stepType: step.type,
            result: actionResult,
            status: 'success'
        };

        // Calculate Next Run
        const nextStageIndex = currentStepIndex + 1;
        let nextRunAt: Date | null = null;
        let newStatus: "active" | "completed" | "paused" | "intercepted" | "failed" = "active";

        if (nextStageIndex < config.steps.length) {
            const nextStep = config.steps[nextStageIndex];
            if (nextStep) {
                const dayDiff = nextStep.day - step.day;
                const delayDays = dayDiff > 0 ? dayDiff : 0;

                const nextDate = new Date();
                if (delayDays > 0) {
                    nextDate.setDate(nextDate.getDate() + delayDays);
                    nextDate.setHours(10, 0, 0, 0);
                } else {
                    nextDate.setMinutes(nextDate.getMinutes() + 5);
                }
                nextRunAt = nextDate;
            } else {
                newStatus = "completed";
            }
        } else {
            newStatus = "completed";
            nextRunAt = null;
        }

        // Update DB
        await db.update(marketingExecutions).set({
            currentStageIndex: nextStageIndex,
            nextRunAt: nextRunAt,
            status: newStatus,
            updatedAt: new Date(),
            historyLog: sql`history_log || ${JSON.stringify(logEntry)}::jsonb`
        }).where(eq(marketingExecutions.id, execution.id));
    }

    static async completeExecution(id: string, reason: string) {
        await db.update(marketingExecutions).set({
            status: 'completed',
            metadata: sql`metadata || ${JSON.stringify({ completion_reason: reason })}::jsonb`
        }).where(eq(marketingExecutions.id, id));
    }

    // --- CONTENT MAPPER ---
    private static getTemplateData(contentId: string, name: string) {
        const map: Record<string, { previewText: string, heading: string, body: string, ctaText?: string, ctaLink?: string }> = {
            'hot_lead_day_1': {
                previewText: 'Revisión de tu aplicación',
                heading: 'Siguiente paso sobre tu aplicación',
                body: `Hola ${name},\n\nRevisé tu aplicación para tu proyecto.\nPandora no es consultoría ni desarrollo a la medida: desplegamos infraestructura operativa que debe monetizarse.\n\nSi avanzamos, la llamada es para:\n- Validar si tu proyecto es fit\n- Definir qué paquete aplica\n- Ver si tiene sentido ejecutar ahora.\n\nSi no tienes urgencia o presupuesto definido, dime y lo dejamos para más adelante.`,
                ctaText: 'Agendar Llamada',
                ctaLink: 'https://calendly.com/pandoras-w2e/strategy'
            },
            'hot_lead_day_3': {
                previewText: 'El costo de no ejecutar',
                heading: 'Lo que pasa cuando un proyecto no ejecuta',
                body: `Hola ${name},\n\nAlgo que veo seguido:\nProyectos con buena idea que pierden meses comparando opciones, esperando socios o "mejor momento".\n\nPandora existe para reducir ese tiempo a días, no para extender decisiones.\n\nSi tu objetivo es ejecutar este trimestre, agenda aquí.\nSi no, no pasa nada — solo prefiero ser claro y no hacerte perder tiempo.`,
                ctaText: 'Agendar Ahora',
                ctaLink: 'https://calendly.com/pandoras-w2e/strategy'
            },
            'hot_lead_day_7': {
                previewText: 'Cierre de seguimiento',
                heading: 'Cierre de expediente',
                body: `Hola ${name},\n\nNo tuve respuesta de tu lado, así que cierro seguimiento por ahora.\n\nSi en el futuro decides lanzar o monetizar tu proyecto, puedes aplicar de nuevo desde nuestra web.\n\nÉxito con el proyecto.`,
            },
            'nurture_1': {
                previewText: '¿Comunidad o Negocio?',
                heading: 'Por qué la mayoría de DAOs no generan ingresos',
                body: `Hola ${name},\n\nLa mayoría de DAOs fracasan por una razón simple:\nconfunden comunidad con modelo económico.\n\nPandora se diseñó para lo contrario:\nprimero infraestructura, luego incentivos, luego gobernanza.\n\nCuando estés listo para ejecutar, no para experimentar, aquí estamos.`,
            },
            'nurture_2': {
                previewText: 'Infraestructura vs Improvisación',
                heading: 'Infraestructura vs Improvisación',
                body: 'Un proyecto puede:\nA) construir todo desde cero\nB) usar infraestructura probada y salir al mercado rápido\n\nLa diferencia no es técnica.\nEs tiempo + foco + ejecución.\n\nPandora existe para B.'
            },
            'nurture_3': {
                previewText: 'Pandora no es para todos',
                heading: 'Pandora no es para todos',
                body: 'No todos los proyectos califican para Pandora.\nY eso está bien.\n\nTrabajamos con gente que:\n- Tiene piel en el juego\n- Entiende riesgo\n- Quiere ejecutar ahora\n\nSi ese eres tú, puedes aplicar cuando quieras.'
            },
            'nurture_4': {
                previewText: '¿Sigues trabajando?',
                heading: '¿Sigues trabajando en tu proyecto?',
                body: `Hola ${name},\n\nSolo paso a preguntar:\n¿Tu proyecto sigue activo o quedó en pausa?\n\nSi está activo y quieres ejecutarlo, responde este email con "Activo".`
            }
        };
        return map[contentId] || { previewText: 'Actualización', heading: 'Actualización Pandora', body: 'Contenido no encontrado.' };
    }
}
