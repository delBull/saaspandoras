import { db } from "@saasfly/db-core";
import { projects } from "@saasfly/db-core";
import { eq } from "@saasfly/db-core";

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
      if (project.applicantEmail) {
        const { sendEmail } = await import('@/lib/email/client');
        const { resolveEmailBranding } = await import('@/lib/email/engine/branding');
        const { renderEmailAsync } = await import('@/lib/email/engine/render-email');
        const { ClientActivationTemplate } = await import('@/lib/email/templates/clients/ClientActivationTemplate');

        let html: string;
        try {
          const branding = await resolveEmailBranding({
            tenantSlug: project.slug,
            explicitBrand: {
              name: project.title,
            }
          });

          const rendered = await renderEmailAsync({
            template: ClientActivationTemplate,
            props: {
              branding,
              name: project.applicantName || 'Founder',
              projectName: project.title,
              dashboardLink: 'https://dash.pandoras.finance/',
            }
          });
          html = rendered.html.replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
        } catch (renderErr) {
          console.warn('⚠️ [activateClient] Engine render failed, using legacy fallback:', renderErr);
          const { render } = await import('@react-email/render');
          const WelcomeEmail = (await import('@/emails/welcome-active-client')).default;
          html = await render(WelcomeEmail({
            name: project.applicantName || 'Founder',
            projectName: project.title,
            dashboardLink: 'https://dash.pandoras.finance/'
          }));
        }

        await sendEmail({
          from: 'Onboarding <onboarding@pandoras.finance>',
          to: [project.applicantEmail],
          subject: '¡Bienvenido a Pandora’s! Tu lugar está asegurado 🚀',
          html,
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
