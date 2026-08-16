import { db } from "@/db";
import { hermesSubscriptions, users, projects } from "@/db/schema";
import { eq, and, lt } from "drizzle-orm";
import { sendSubscriptionExpiringSoon, sendGracePeriodStarted, sendSubscriptionSuspended } from "@/lib/email/hermes-mailer";
import { HermesOperationalAlerts } from "@/lib/pandoras/core/domains/hermes/alerts";

export class SubscriptionEngine {
    /**
     * Da días gratis a un usuario/proyecto (usado para referidos o recompensas).
     */
    static async grantFreeDays(projectId: number, days: number) {
        // Encontrar la suscripción
        let sub = await db.query.hermesSubscriptions.findFirst({
            where: eq(hermesSubscriptions.projectId, projectId)
        });

        if (!sub) {
            // Si no tiene suscripción activa, la creamos (ej. venía de S'Narai pero es nuevo en Hermes)
            const [newSub] = await db.insert(hermesSubscriptions).values({
                projectId,
                status: 'active',
                currentPeriodEnd: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
            }).returning();
            return newSub;
        }

        // Si ya tiene, le sumamos a su tiempo actual o al tiempo que le quede
        const currentEnd = sub.currentPeriodEnd.getTime() > Date.now() ? sub.currentPeriodEnd.getTime() : Date.now();
        const newEnd = new Date(currentEnd + days * 24 * 60 * 60 * 1000);

        const [updatedSub] = await db.update(hermesSubscriptions)
            .set({ 
                currentPeriodEnd: newEnd, 
                status: 'active', // Revivimos si estaba suspendida
                gracePeriodEnd: null 
            })
            .where(eq(hermesSubscriptions.id, sub.id))
            .returning();
        
        return updatedSub;
    }

    /**
     * Función principal para el Cron Diario. Evalúa vencimientos y periodos de gracia.
     */
    static async checkAndProcessExpirations() {
        const now = new Date();
        const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

        // 1. Alertar a los que vencen en 3 días (Incentivo de Rep Points)
        const expiringSoon = await db.query.hermesSubscriptions.findMany({
            where: and(
                eq(hermesSubscriptions.status, 'active'),
                lt(hermesSubscriptions.currentPeriodEnd, inThreeDays),
                // Lógica de evitar spam: Se podría filtrar si ya se le envió aviso
            ),
            with: { project: true }
        });

        for (const sub of expiringSoon) {
            const email = sub.project.applicantEmail;
            const name = sub.project.applicantName || 'Gestor';
            if (email) {
                await sendSubscriptionExpiringSoon(email, name);
                await HermesOperationalAlerts.sendAlert(
                    sub.project.slug!,
                    `🔔 *Hermes Growth*\nTu suscripción vence pronto. Renueva ahora y obtén +50 Reputation Points.\n\nRenueva en: https://dash.pandoras.finance/growth-os/hermes`
                );
            }
        }

        // 2. Transicionar Activos Vencidos a Periodo de Gracia (3 días)
        const expiredActive = await db.query.hermesSubscriptions.findMany({
            where: and(
                eq(hermesSubscriptions.status, 'active'),
                lt(hermesSubscriptions.currentPeriodEnd, now)
            ),
            with: { project: true }
        });

        for (const sub of expiredActive) {
            const graceEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
            await db.update(hermesSubscriptions)
                .set({ status: 'grace_period', gracePeriodEnd: graceEnd })
                .where(eq(hermesSubscriptions.id, sub.id));
            
            const email = sub.project.applicantEmail;
            const name = sub.project.applicantName || 'Gestor';
            if (email) {
                await sendGracePeriodStarted(email, name);
                await HermesOperationalAlerts.sendAlert(
                    sub.project.slug!,
                    `⚠️ *Hermes Growth*\nTu suscripción ha vencido. Hemos activado un periodo de gracia de 3 días para que no pierdas acceso al motor operativo.\n\nRenueva en: https://dash.pandoras.finance/growth-os/hermes`
                );
            }
        }

        // 3. Transicionar Gracia a Suspendido
        const expiredGrace = await db.query.hermesSubscriptions.findMany({
            where: and(
                eq(hermesSubscriptions.status, 'grace_period'),
                lt(hermesSubscriptions.gracePeriodEnd, now)
            ),
            with: { project: true }
        });

        for (const sub of expiredGrace) {
            await db.update(hermesSubscriptions)
                .set({ status: 'suspended' })
                .where(eq(hermesSubscriptions.id, sub.id));
            
            const email = sub.project.applicantEmail;
            const name = sub.project.applicantName || 'Gestor';
            if (email) {
                await sendSubscriptionSuspended(email, name);
                await HermesOperationalAlerts.sendAlert(
                    sub.project.slug!,
                    `⛔ *Hermes Growth*\nTu suscripción ha sido suspendida por falta de pago. El Centro de Comando Operativo está bloqueado.\n\nReactiva tu cuenta en: https://dash.pandoras.finance/growth-os/hermes`
                );
            }
        }
    }
}
