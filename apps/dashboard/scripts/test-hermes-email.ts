import { sendB2BWelcomeEmail } from '../src/lib/marketing/growth-engine/email-senders';

async function main() {
    console.log("Triggering Hermes Welcome Email...");
    try {
        const result = await sendB2BWelcomeEmail({
            to: "misstaco@protonmail.com",
            projectName: "Hermes Growth OS",
            source: "hermes_enterprise_landing",
            subType: "growth_os_signup"
        });
        console.log("Result:", result);
    } catch (error) {
        console.error("Error:", error);
    }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
