
import { Router } from "express";
import fetch from "node-fetch";

const router = Router();

router.post("/railway", async (req, res) => {
    try {
        const event = req.body;
        console.log("🚂 Railway Webhook:", JSON.stringify(event, null, 2));

        // Filter for specific events (DEPLOY, CRASHED, FAILED)
        const type = event.type;
        const status = event.status; // e.g., "CRASHED", "FAILED", "SUCCESS"

        // We only care about failures/crashes for alerts
        if (status === "CRASHED" || status === "FAILED") {
            const projectName = event.project?.name || "Unknown Project";
            const serviceName = event.service?.name || "Unknown Service";
            const environment = event.environment?.name || "Unknown Env";
            const deploymentId = event.deployment?.id || "N/A";

            const discordMessage = {
                username: "Pandoras OpsBot",
                avatar_url: "https://railway.app/brand/logotype-dark.png",
                embeds: [
                    {
                        title: `🚨 Railway Alert: ${status}`,
                        color: 15158332, // Red
                        fields: [
                            { name: "Project", value: projectName, inline: true },
                            { name: "Service", value: serviceName, inline: true },
                            { name: "Environment", value: environment, inline: true },
                            { name: "Status", value: `**${status}**` },
                            { name: "Deployment ID", value: deploymentId }
                        ],
                        timestamp: new Date().toISOString()
                    }
                ]
            };

            const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_ALERTS;
            if (DISCORD_WEBHOOK_URL) {
                await fetch(DISCORD_WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(discordMessage)
                });
                console.log("✅ Alert sent to Discord");
            } else {
                console.warn("⚠️ DISCORD_ALERTS_WEBHOOK_URL not set");
            }
        }

        res.json({ received: true });

    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
