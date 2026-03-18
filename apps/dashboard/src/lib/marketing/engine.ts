import { db } from "@/db";
import { marketingExecutions, marketingCampaigns, clients, users } from "@/db/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import { sendEmail } from "@/lib/email/client";
import { sendWhatsAppMessage } from "@/lib/whatsapp/utils/client";
// import { renderToStaticMarkup } from "react-dom/server";
import { PandorasCampaignEmail } from "@/emails/campaigns/PandorasCampaignEmail";

interface CampaignStep {
    day: number;
    type: 'whatsapp' | 'email';
    // Dynamic Mode
    body?: string; // HTML for email, Text for WhatsApp
    subject?: string;
    // Legacy Mode
    contentId?: string;
    message?: string; // Legacy WhatsApp
    // Logic
    conditions?: Record<string, any>;
}

interface CampaignConfig {
    steps: CampaignStep[];
}

export class MarketingEngine {

    // ... existing startCampaign and processDueExecutions ...

    static async startCampaign(campaignName: string, targetId: { userId?: string, leadId?: string }) {
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
            history: [],
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
            const results = await db.select().from(clients).where(eq(clients.id, execution.leadId)).limit(1);
            const lead = results[0];
            if (lead) {
                contact.phone = lead.whatsapp || lead.phone || '';
                contact.email = lead.email || '';
                contact.name = lead.name || 'Friend';
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
        const replaceVars = (text: string) => text
            .replace(/{{name}}/g, contact.name)
            .replace(/{{project}}/g, 'tu proyecto')
            .replace(/{{agent_name}}/g, 'Equipo Pandora');

        // --- EXECUTE ACTION ---
        let actionResult: any = {};

        if (step.type === 'whatsapp' && contact.phone) {
            // Priority: Dynamic Body -> Legacy Message -> Error
            const rawBody = step.body || step.message;
            if (!rawBody) throw new Error("WhatsApp step missing message body");

            const body = replaceVars(rawBody);
            await sendWhatsAppMessage(contact.phone, body);
            actionResult = { channel: 'whatsapp', sentTo: contact.phone };
        }
        else if (step.type === 'email' && contact.email) {
            let subject = "";
            let templateData: any = {};

            // HYBRID ENGINE LOGIC
            if (step.body) {
                // Dynamic Mode (From DB)
                subject = replaceVars(step.subject || "Actualización Pandora");
                // For dynamic, we wrap the raw body in our standard template structure or send raw
                // Here we re-use the PandorasCampaignEmail logic by mocking the data structure
                templateData = {
                    previewText: subject,
                    heading: subject,
                    body: step.body,
                    // If we add CTA support to DB later, extract it here
                };
            } else if (step.contentId) {
                // Legacy Mode (From Code Map)
                templateData = this.getTemplateData(step.contentId, contact.name);
                subject = step.subject ? replaceVars(step.subject) : templateData.heading;
            } else {
                throw new Error("Email step missing content (body or contentId)");
            }

            // Render
            // Dynamic import to avoid build issues with server components
            const { render } = await import('@react-email/render');

            const html = await render(
                PandorasCampaignEmail({
                    ...templateData,
                    // Ensure body is processed if it came from dynamic and has vars
                    bodyContent: step.body ? replaceVars(step.body) : templateData.body
                })
            );

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
            history: sql`history || ${JSON.stringify(logEntry)}::jsonb`
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
                previewText: 'Siguiente paso',
                heading: 'Tu aplicación no está aprobada aún',
                body: `Hola ${name},\n\nRecibimos tu aplicación para lanzar un Protocolo en Pandora.\n\nImportante: aplicar no significa entrar.\n\nSolo avanzamos con proyectos que:\n• Pueden ejecutar este trimestre\n• Tienen claridad mínima de utilidad\n• No buscan experimentar con capital ajeno\n\nSi ese es tu caso, el siguiente paso es una llamada breve para confirmar encaje.`,
                ctaText: 'Agendar Aquí',
                ctaLink: 'https://dash.pandoras.finance/schedule/protocol?type=strategy'
            },
            'hot_lead_day_3': {
                previewText: 'Y cuesta caro',
                heading: 'El error que veo todas las semanas',
                body: `Hola ${name},\n\nLa mayoría de los proyectos Web3 no fallan por tecnología.\nFallan por postergar decisiones irreversibles.\n\nEsperan:\n• al socio ideal\n• a levantar más capital\n• a "pulir" la idea\n\nPandora existe para el momento opuesto:\ncuando decides ejecutar antes de que el mercado se mueva sin ti.\n\nSi ese momento es ahora, agenda aquí.\nSi no, no pasa nada — pero sé honesto contigo.`,
                ctaText: 'Agendar Ahora',
                ctaLink: 'https://dash.pandoras.finance/schedule/protocol?type=strategy'
            },
            'hot_lead_day_7': {
                previewText: 'Por ahora',
                heading: 'Cierre de seguimiento',
                body: `Hola ${name},\n\nNo tuve respuesta de tu lado, así que cierro este hilo por ahora.\n\nCuando un founder decide ejecutar de verdad, suele volver rápido.\nPandora no va a ningún lado — la ventana de oportunidad de tu proyecto, sí.\n\nSi retomas, puedes aplicar nuevamente desde la web.`,
            },
            'nurture_1': {
                previewText: '¿Comunidad o Negocio?',
                heading: 'Por qué la mayoría de DAOs no generan ingresos',
                body: `Hola ${name},\n\nLa mayoría de DAOs fracasan por una razón simple:\nconfunden comunidad con modelo económico.\n\nPandora se diseñó para lo contrario:\nprimero infraestructura, luego incentivos, luego gobernanza.\n\nCuando estés listo para ejecutar, no para experimentar, aquí estamos.`,
            },
            // UTILITY PROTOCOL CAMPAIGN
            'utility_day_0': {
                previewText: 'Esto no es un pitch',
                heading: 'Tu protocolo está en evaluación',
                body: `Hola ${name},\n\nRecibimos tus respuestas al Filtro de Viabilidad 2.5.\n\nEste proceso no evalúa:\n• Narrativa\n• Whitepaper\n• Promesas futuras\n\nEvalúa una sola cosa:\n👉 si la utilidad existe antes del token.\n\nSi pasa, avanzamos.\nSi no, te diremos exactamente por qué.`
            },
            'utility_day_2': {
                previewText: 'No es falta de capital',
                heading: 'El error #1 en Work-to-Earn',
                body: `${name},\n\nEl 80% de los protocolos W2E fallan por lo mismo:\n\n👉 La acción no es verificable.\n\nCuando no puedes verificar:\n• la tesorería se drena\n• el incentivo se pervierte\n• el riesgo legal se dispara\n\nLa utilidad no se declara.\nSe diseña.`
            },
            'utility_day_4': {
                previewText: 'Son cosas distintas',
                heading: 'Arquitectura vs idea',
                body: `Una idea puede ser interesante.\n\nUn protocolo necesita:\n• flujos\n• validadores\n• incentivos controlados\n\nSi no puedes escribir el flujo sin adjetivos,\ntodavía no es arquitectura.`
            },
            'utility_day_7': {
                previewText: 'No para todos',
                heading: 'Siguiente paso (si aplica)',
                body: `${name},\n\nSi tu protocolo pasa el filtro, el siguiente paso no es consultoría.\n\nEs:\n• Arquitectura SC\n• Loom Protocol\n• Estructura de tesorería\n\nSi no, también es una victoria.\nConstruir sin claridad es el error más caro en Web3.`,
                ctaText: 'Agendar Revisión',
                ctaLink: 'https://dash.pandoras.finance/schedule/protocol?type=architecture'
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
            },
            // START / CREATOR SOVEREIGNTY CAMPAIGN
            'creator_day_0': {
                previewText: 'Eres infraestructura',
                heading: 'No eres una audiencia',
                body: `Bienvenido a Pandora’s.\n\nAquí no enseñamos a crecer en redes.\n\nEnseñamos a dejar de depender de ellas.\n\nSi tu negocio puede ser apagado por un algoritmo,\nno es tuyo.\n\nEsta secuencia no vende.\nAlinea.`
            },
            'creator_day_2': {
                previewText: 'El control sí',
                heading: 'El 30% no es el verdadero costo',
                body: `Patreon, Instagram, Discord…\n\nNo son herramientas.\nSon landlords digitales.\n\nTe prestan acceso a cambio de control.\n\nLa soberanía no se pide.\nSe construye.`
            },
            'creator_day_4': {
                previewText: 'Es tu motor económico',
                heading: 'Tu comunidad no es tu audiencia',
                body: `Una audiencia consume.\n\nUna comunidad construye.\n\nPandora no recompensa likes.\nRecompensa acciones verificables.\n\nModerar.\nCrear.\nValidar.\n\nTrabajo real → valor real.`
            },
            'creator_day_6': {
                previewText: 'Es arquitectura',
                heading: 'Esto no es Web3 marketing',
                body: `Tokens sin utilidad existen por todos lados.\n\nProtocolos que sobreviven, no.\n\nAquí no lanzas promesas.\nLanzas sistemas.\n\nSi no puedes explicar el flujo,\nno es un protocolo.`
            },
            'creator_day_9': {
                previewText: 'Es claridad',
                heading: 'El siguiente paso no es una llamada',
                body: `Antes de herramientas,\nantes de contratos,\nantes de tokens…\n\nHay una sola pregunta:\n\n¿Qué acción hace el usuario\ny por qué merece valor?\n\nSi quieres responderla,\nel filtro está abierto.`,
                ctaText: 'Ir al Filtro Técnico',
                ctaLink: 'https://wa.me/5213221374392?text=utility'
            },
            // FOUNDERS NURTURE CAMPAIGN
            'founders_day_0': {
                previewText: 'No todos avanzan',
                heading: 'Aplicación recibida — Founders Inner Circle',
                body: `Hola ${name},\n\nRecibimos tu aplicación al Pandora Founders Inner Circle.\n\nImportante:\nEste programa no opera por volumen ni por pitch decks.\nAvanzamos solo con founders que ya están listos para mover capital y estructura.\n\nEn las próximas horas revisaremos tu perfil.\nSi hay encaje, alguien del core team te contactará directamente.`
            },
            'founders_day_2': {
                previewText: 'Y no debería serlo',
                heading: 'No es mentoría',
                body: `${name},\n\nEl Inner Circle no existe para enseñar "cómo levantar" o "cómo lanzar".\n\nExiste para founders que:\n• Ya tomaron el riesgo\n• Buscan ventaja estructural\n• Entienden que el timing lo es todo\n\nSi entras, no es para aprender.\nEs para mover fichas.\n\nSi no, no pasa nada — este no es el vehículo correcto aún.`
            },
            'founders_day_5': {
                previewText: 'Por ahora',
                heading: 'Seguimiento cerrado',
                body: `${name},\n\nCerramos seguimiento de esta ronda del Inner Circle.\n\nCuando un founder está listo, normalmente lo sabe.\nY cuando no, forzarlo suele ser costoso.\n\nSi más adelante tu contexto cambia, puedes volver a aplicar.`
            }
        };
        return map[contentId] || { previewText: 'Actualización', heading: 'Actualización Pandora', body: 'Contenido no encontrado.' };
    }
}
