import { db } from '../src/db';
import { marketingCampaigns } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const campaignName = "Market Attack";
    console.log(`🌱 Seeding campaign: ${campaignName}...`);

    const existing = await db
        .select()
        .from(marketingCampaigns)
        .where(eq(marketingCampaigns.name, campaignName))
        .limit(1);

    if (existing.length > 0) {
        console.log(`  ✅ Campaign already exists. Updating configuration...`);
        await db.update(marketingCampaigns)
            .set({
                config: {
                    steps: [
                        {
                            day: 0,
                            type: 'whatsapp',
                            body: "Hola {{name}}, ¿viste esto? {{project_name}} acaba de abrir fase temprana. La mayoría llega tarde, pero tú estás en el radar. Échale un ojo: {{pay_link}}"
                        },
                        {
                            day: 1,
                            type: 'email',
                            subject: "La ventaja de {{project_name}}",
                            body: "Hola {{name}},\n\nEntrar en activos reales como {{project_name}} antes que el mercado es la verdadera ventaja.\n\nEl precio actual es de {{price}}.\n\nNo es especulación, es infraestructura. Asegura tu acceso en el botón de abajo.",
                        },
                        {
                            day: 2,
                            type: 'whatsapp',
                            body: "Últimas 24 horas del acceso preferente para {{project_name}}. El precio de {{price}} cambia pronto. Asegura tu lugar aquí: {{pay_link}}"
                        }
                    ]
                },
                updatedAt: new Date()
            })
            .where(eq(marketingCampaigns.id, existing[0]!.id));
    } else {
        await db.insert(marketingCampaigns).values({
            name: campaignName,
            triggerType: 'manual',
            isActive: true,
            config: {
                steps: [
                    {
                        day: 0,
                        type: 'whatsapp',
                        body: "Hola {{name}}, ¿viste esto? {{project_name}} acaba de abrir fase temprana. La mayoría llega tarde, pero tú estás en el radar. Échale un ojo: {{pay_link}}"
                    },
                    {
                        day: 1,
                        type: 'email',
                        subject: "La ventaja de {{project_name}}",
                        body: "Hola {{name}},\n\nEntrar en activos reales como {{project_name}} antes que el mercado es la verdadera ventaja.\n\nEl precio actual es de {{price}}.\n\nNo es especulación, es infraestructura. Asegura tu acceso en el botón de abajo.",
                    },
                    {
                        day: 2,
                        type: 'whatsapp',
                        body: "Últimas 24 horas del acceso preferente para {{project_name}}. El precio de {{price}} cambia pronto. Asegura tu lugar aquí: {{pay_link}}"
                    }
                ]
            }
        });
        console.log(`  🌱 Seeded new campaign: ${campaignName}`);
    }

    console.log(`✅ Done!`);
    process.exit(0);
}

main().catch(console.error);
