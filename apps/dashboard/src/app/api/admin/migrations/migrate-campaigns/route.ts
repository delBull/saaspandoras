
import { NextResponse } from "next/server";
import { db } from "@/db"; // Adjust import
import { marketingCampaigns, marketingExecutions } from "@/db/schema";
import { eq } from "drizzle-orm";

// Define the campaigns to migrate (Extracted from MarketingEngine hardcoded maps)
const CAMPAIGNS_TO_MIGRATE = [
    {
        name: 'ApplyProtocol Hot Leads',
        triggerType: 'auto_registration',
        // config: { steps: [] } -> Populated below
        steps: [
            {
                day: 1, type: 'email',
                subject: 'Tu aplicación no está aprobada aún',
                body: `Hola {{name}},\n\nRecibimos tu aplicación para lanzar un Protocolo en Pandora.\n\nImportante: aplicar no significa entrar.\n\nSolo avanzamos con proyectos que:\n• Pueden ejecutar este trimestre\n• Tienen claridad mínima de utilidad\n• No buscan experimentar con capital ajeno\n\nSi ese es tu caso, el siguiente paso es una llamada breve para confirmar encaje.`,
                // cta: { text: 'Agendar Aquí', link: 'https://dash.pandoras.finance/schedule/protocol?type=strategy' } // We can embed this in body or handle later
            },
            {
                day: 3, type: 'email',
                subject: 'El error que veo todas las semanas',
                body: `Hola {{name}},\n\nLa mayoría de los proyectos Web3 no fallan por tecnología.\nFallan por postergar decisiones irreversibles.\n\nEsperan:\n• al socio ideal\n• a levantar más capital\n• a "pulir" la idea\n\nPandora existe para el momento opuesto:\ncuando decides ejecutar antes de que el mercado se mueva sin ti.\n\nSi ese momento es ahora, agenda aquí.\nSi no, no pasa nada — pero sé honesto contigo.\n\n[Agendar Ahora](https://dash.pandoras.finance/schedule/protocol?type=strategy)`
            },
            {
                day: 7, type: 'email',
                subject: 'Cierre de seguimiento',
                body: `Hola {{name}},\n\nNo tuve respuesta de tu lado, así que cierro este hilo por ahora.\n\nCuando un founder decide ejecutar de verdad, suele volver rápido.\nPandora no va a ningún lado — la ventana de oportunidad de tu proyecto, sí.\n\nSi retomas, puedes aplicar nuevamente desde la web.`
            }
        ]
    },
    {
        name: 'Founders Nurture',
        triggerType: 'auto_registration',
        steps: [
            {
                day: 0, type: 'email',
                subject: 'Aplicación recibida — Founders Inner Circle',
                body: `Hola {{name}},\n\nRecibimos tu aplicación al Pandora Founders Inner Circle.\n\nImportante:\nEste programa no opera por volumen ni por pitch decks.\nAvanzamos solo con founders que ya están listos para mover capital y estructura.\n\nEn las próximas horas revisaremos tu perfil.\nSi hay encaje, alguien del core team te contactará directamente.`
            },
            {
                day: 2, type: 'email',
                subject: 'No es mentoría',
                body: `{{name}},\n\nEl Inner Circle no existe para enseñar "cómo levantar" o "cómo lanzar".\n\nExiste para founders que:\n• Ya tomaron el riesgo\n• Buscan ventaja estructural\n• Entienden que el timing lo es todo\n\nSi entras, no es para aprender.\nEs para mover fichas.\n\nSi no, no pasa nada — este no es el vehículo correcto aún.`
            },
            {
                day: 5, type: 'email',
                subject: 'Seguimiento cerrado',
                body: `{{name}},\n\nCerramos seguimiento de esta ronda del Inner Circle.\n\nCuando un founder está listo, normalmente lo sabe.\nY cuando no, forzarlo suele ser costoso.\n\nSi más adelante tu contexto cambia, puedes volver a aplicar.`
            }
        ]
    },
    {
        name: 'Start Creator Nurture',
        triggerType: 'auto_registration',
        steps: [
            {
                day: 0, type: 'email',
                subject: 'No eres una audiencia',
                body: `Bienvenido a Pandora’s.\n\nAquí no enseñamos a crecer en redes.\n\nEnseñamos a dejar de depender de ellas.\n\nSi tu negocio puede ser apagado por un algoritmo,\nno es tuyo.\n\nEsta secuencia no vende.\nAlinea.`
            },
            {
                day: 2, type: 'email',
                subject: 'El 30% no es el verdadero costo',
                body: `Patreon, Instagram, Discord…\n\nNo son herramientas.\nSon landlords digitales.\n\nTe prestan acceso a cambio de control.\n\nLa soberanía no se pide.\nSe construye.`
            },
            {
                day: 4, type: 'email',
                subject: 'Tu comunidad no es tu audiencia',
                body: `Una audiencia consume.\n\nUna comunidad construye.\n\nPandora no recompensa likes.\nRecompensa acciones verificables.\n\nModerar.\nCrear.\nValidar.\n\nTrabajo real → valor real.`
            },
            {
                day: 6, type: 'email',
                subject: 'Esto no es Web3 marketing',
                body: `Tokens sin utilidad existen por todos lados.\n\nProtocolos que sobreviven, no.\n\nAquí no lanzas promesas.\nLanzas sistemas.\n\nSi no puedes explicar el flujo,\nno es un protocolo.`
            },
            {
                day: 9, type: 'email',
                subject: 'El siguiente paso no es una llamada',
                body: `Antes de herramientas,\nantes de contratos,\nantes de tokens…\n\nHay una sola pregunta:\n\n¿Qué acción hace el usuario\ny por qué merece valor?\n\nSi quieres responderla,\nel filtro está abierto.\n\n[Ir al Filtro Técnico](https://wa.me/5213221374392?text=utility)`
            }
        ]
    },
    {
        name: 'Utility Protocol Follow-up', // Assuming this name from engine.ts line 112
        triggerType: 'auto_registration',
        steps: [
            {
                day: 0, type: 'email',
                subject: 'Tu protocolo está en evaluación',
                body: `Hola {{name}},\n\nRecibimos tus respuestas al Filtro de Viabilidad 2.5.\n\nEste proceso no evalúa:\n• Narrativa\n• Whitepaper\n• Promesas futuras\n\nEvalúa una sola cosa:\n👉 si la utilidad existe antes del token.\n\nSi pasa, avanzamos.\nSi no, te diremos exactamente por qué.`
            },
            {
                day: 2, type: 'email',
                subject: 'El error #1 en Work-to-Earn',
                body: `{{name}},\n\nEl 80% de los protocolos W2E fallan por lo mismo:\n\n👉 La acción no es verificable.\n\nCuando no puedes verificar:\n• la tesorería se drena\n• el incentivo se pervierte\n• el riesgo legal se dispara\n\nLa utilidad no se declara.\nSe diseña.`
            },
            {
                day: 4, type: 'email',
                subject: 'Arquitectura vs idea',
                body: `Una idea puede ser interesante.\n\nUn protocolo necesita:\n• flujos\n• validadores\n• incentivos controlados\n\nSi no puedes escribir el flujo sin adjetivos,\ntodavía no es arquitectura.`
            },
            {
                day: 7, type: 'email',
                subject: 'Siguiente paso (si aplica)',
                body: `{{name}},\n\nSi tu protocolo pasa el filtro, el siguiente paso no es consultoría.\n\nEs:\n• Arquitectura SC\n• Loom Protocol\n• Estructura de tesorería\n\nSi no, también es una victoria.\nConstruir sin claridad es el error más caro en Web3.\n\n[Agendar Revisión](https://dash.pandoras.finance/schedule/protocol?type=architecture)`
            }
        ]
    }
];

export async function GET() {
    try {
        const results = [];
        for (const camp of CAMPAIGNS_TO_MIGRATE) {
            // Check if exists
            const existing = await db.select().from(marketingCampaigns).where(eq(marketingCampaigns.name, camp.name)).limit(1);

            if (existing.length > 0 && existing[0]) {
                const existingCamp = existing[0];
                const config = { steps: camp.steps } as any;
                // Update existing to enable it and sync config
                await db.update(marketingCampaigns)
                    .set({
                        config: config,
                        // triggerType: camp.triggerType as any,
                        isActive: true
                    })
                    .where(eq(marketingCampaigns.id, existingCamp.id));
                results.push({ name: camp.name, action: 'enabled_dynamic' });
            } else {
                // Insert new
                await db.insert(marketingCampaigns).values({
                    name: camp.name,
                    triggerType: camp.triggerType as any,
                    isActive: true,
                    config: { steps: camp.steps } as any
                });
                results.push({ name: camp.name, action: 'created' });
            }
        }
        return NextResponse.json({ success: true, results });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: e }, { status: 500 });
    }
}
