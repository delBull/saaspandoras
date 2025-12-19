
export const APPLY_PROTOCOL_CAMPAIGNS = [
    {
        name: "ApplyProtocol Hot Leads",
        triggerType: "auto_registration",
        config: {
            steps: [
                {
                    day: 0,
                    type: "whatsapp",
                    message:
                        "Hola {{name}}, soy Marco de Pandora.\nYa recibí tu aplicación para {{project}}.\n\nAntes de agendar llamada necesito confirmar algo rápido:\n👉 ¿Cuál es tu prioridad principal ahora mismo?\n1️⃣ Lanzar rápido\n2️⃣ Levantar capital\n3️⃣ Escalar ventas\n4️⃣ Definir modelo\n\nRespóndeme con el número.",
                },
                {
                    day: 1,
                    type: "email",
                    subject: "Siguiente paso sobre tu aplicación en Pandora",
                    contentId: "hot_lead_day_1", // Maps to template renderer
                },
                {
                    day: 1,
                    type: "whatsapp",
                    message:
                        "Solo para confirmar, {{name}}:\n¿Seguimos revisando {{project}} o lo dejamos en pausa?\n\nRespóndeme “Seguimos” o “Pausa”.",
                    conditions: { ifNoReplyTo: "email" }, // Logic for engine later
                },
                {
                    day: 3,
                    type: "email",
                    subject: "Lo que pasa cuando un proyecto no ejecuta",
                    contentId: "hot_lead_day_3",
                },
                {
                    day: 5,
                    type: "whatsapp",
                    message:
                        "Cierro seguimiento, {{name}}.\nSi quieres avanzar con {{project}}, dime “Avanzar” y te mando el link directo.\n\nSi no, lo dejamos aquí sin problema.",
                },
                {
                    day: 7,
                    type: "email",
                    subject: "Cierre de seguimiento — Pandora",
                    contentId: "hot_lead_day_7",
                },
            ],
        },
    },
    {
        name: "ApplyProtocol Nurturing",
        triggerType: "manual",
        config: {
            steps: [
                {
                    day: 0, // Starts immediately when moved to nurturing
                    type: "email",
                    subject: "Por qué la mayoría de DAOs no generan ingresos",
                    contentId: "nurture_1",
                },
                {
                    day: 5,
                    type: "email",
                    subject: "Infraestructura vs improvisación",
                    contentId: "nurture_2",
                },
                {
                    day: 12,
                    type: "email",
                    subject: "Pandora no es para todos",
                    contentId: "nurture_3",
                },
                {
                    day: 21,
                    type: "email",
                    subject: "?Sigues trabajando en {{project}}?",
                    contentId: "nurture_4",
                },
            ],
        },
    },
    {
        name: "Utility Protocol Follow-up",
        triggerType: "manual", // Triggered via code after technical filter
        config: {
            steps: [
                {
                    day: 0,
                    type: "email",
                    subject: "Tu protocolo está en evaluación",
                    contentId: "utility_day_0",
                },
                {
                    day: 2,
                    type: "email",
                    subject: "El error #1 en Work-to-Earn",
                    contentId: "utility_day_2",
                },
                {
                    day: 4,
                    type: "email",
                    subject: "Arquitectura vs idea",
                    contentId: "utility_day_4",
                },
                {
                    day: 7,
                    type: "email",
                    subject: "Siguiente paso (si aplica)",
                    contentId: "utility_day_7",
                },
            ],
        },
    },
    {
        name: "Start Creator Nurture",
        triggerType: "manual", // Triggered via code after sovereignty filter
        config: {
            steps: [
                {
                    day: 0,
                    type: "email",
                    subject: "No eres una audiencia",
                    contentId: "creator_day_0",
                },
                {
                    day: 2,
                    type: "email",
                    subject: "El 30% no es el verdadero costo",
                    contentId: "creator_day_2",
                },
                {
                    day: 4,
                    type: "email",
                    subject: "Tu comunidad no es tu audiencia",
                    contentId: "creator_day_4",
                },
                {
                    day: 6,
                    type: "email",
                    subject: "Esto no es Web3 marketing",
                    contentId: "creator_day_6",
                },
                {
                    day: 9,
                    type: "email",
                    subject: "El siguiente paso no es una llamada",
                    contentId: "creator_day_9",
                },
            ],
        },
    },
];
