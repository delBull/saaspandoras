'use server';

export async function getDiscordWebhookStatus() {
    // Check environment variables for configuration
    const alerts = !!process.env.DISCORD_WEBHOOK_ALERTS;
    const applications = !!process.env.DISCORD_WEBHOOK_APPLICATIONS;
    const leads = !!process.env.DISCORD_WEBHOOK_WHATSAPP_LEADS;

    await Promise.resolve(); // Vercel Linter requirement for server actions

    return {
        alerts: { configured: alerts, status: alerts ? 'active' : 'missing' },
        applications: { configured: applications, status: applications ? 'active' : 'missing' },
        leads: { configured: leads, status: leads ? 'active' : 'missing' }
    };
}
