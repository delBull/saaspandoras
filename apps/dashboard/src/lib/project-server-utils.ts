import { db } from "~/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * ACTIVATES A CLIENT AFTER SUCCESSFUL PAYMENT
 * - Updates DB status to 'active_client'
 * - Sends Welcome Email
 * - Notifies Discord
 */
export async function activateClient(projectId: number, method: string, amount: string) {
  console.log(`🚀 Activating Client Project ID: ${projectId} via ${method}`);

  try {
    // 1. Update DB
    const result = await db.update(projects)
      .set({
        status: 'active_client' as any, 
      })
      .where(eq(projects.id, projectId))
      .returning();

    const project = result[0];
    if (!project) throw new Error("Project not found");

    console.log(`✅ DB Updated: ${project.title} is now active.`);

    // 2. Send Welcome Email
    try {
      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      if (RESEND_API_KEY && project.applicantEmail) {
        const { render } = await import('@react-email/render');
        const WelcomeEmail = (await import('@/emails/welcome-active-client')).default;

        const html = await render(WelcomeEmail({
          name: project.applicantName || 'Founder',
          projectName: project.title,
          dashboardLink: 'https://dash.pandoras.finance/'
        }));

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Onboarding <onboarding@pandoras.finance>',
            to: [project.applicantEmail],
            subject: '¡Bienvenido a Pandora’s! Tu lugar está asegurado 🚀',
            html: html,
          }),
        });
        console.log('📧 Welcome Email sent.');
      }
    } catch (emailErr) {
      console.error('❌ Email Failed:', emailErr);
    }

    // 3. Notify Discord
    try {
      const { notifyPaymentSuccess } = await import('@/lib/discord');
      if (notifyPaymentSuccess) {
        await notifyPaymentSuccess(project.title, amount, method, project.applicantEmail || 'No Email');
      }
    } catch (discordErr) {
      console.error('❌ Discord Notification Failed:', discordErr);
    }

    return { success: true, project };

  } catch (error) {
    console.error('❌ Activation Failed:', error);
    throw error;
  }
}
