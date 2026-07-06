import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
const db = drizzle(pool, { schema });

const briefings = [
  {
    slug: 'participate',
    title: 'Quiero participar (Inversionistas)',
    blocks: [
      { type: 'hero', data: { pretitle: 'ACCESO EXCLUSIVO', title: 'PARTICIPACIÓN ESTRATÉGICA', description: "Accede a un protocolo de rendimientos inmobiliarios en la zona dorada de Bucerías." } },
      { type: 'sixty_seconds', data: { title: 'EL PROYECTO EN 60 SEGUNDOS', text: "S'Narai no es un tiempo compartido ni una fracción tradicional. Es un **Protocolo de Participación Digital** respaldado por un activo de $100MDP MXN.\n\nObtienes certificados (CPs) que te otorgan derechos sobre utilidades operativas y noches gratis en el hotel." } },
      { type: 'principles', data: { title: 'VENTAJAS COMPETITIVAS', list: [
        { title: 'Eficiencia de Capital', text: 'Posiciones desde $500 USD con liquidez global lista.' },
        { title: 'Rendimientos Operativos', text: 'Distribución inteligente basada en ocupación hotelera real.' },
        { title: 'Cero Fricción Legal', text: 'Sin notarios, sin fideicomisos individuales, pura infraestructura digital.' }
      ]}},
      { type: 'next_steps', data: { title: 'ÚNETE A LA FASE FOUNDER', text: 'Solicita tu acceso preferencial antes del cierre de fase.' } }
    ]
  },
  {
    slug: 'realtors',
    title: 'Comercializo desarrollos (Gestores)',
    blocks: [
      { type: 'hero', data: { pretitle: 'RED DE VENTAS', title: 'PROGRAMA DE GESTORES PATRIMONIALES', description: "Comercializa S'Narai con tus clientes de alto valor y asegura comisiones on-chain." } },
      { type: 'sixty_seconds', data: { title: 'UNA HERRAMIENTA DE VENTA ÚNICA', text: "Ofrece a tus clientes exposición a bienes raíces premium sin el dolor de cabeza de escrituración o hipotecas.\n\nS'Narai te permite ganar un **10% de comisión garantizada** de forma programática a través de nuestros Smart Contracts." } },
      { type: 'journey', data: { title: 'TU RUTA DE COMERCIALIZACIÓN', steps: [
        { step: '01', title: 'Aprobación', text: 'Verificamos tu perfil como Gestor Patrimonial.' },
        { step: '02', title: 'Generación de Enlaces', text: 'Obtienes un enlace referenciado atado a tu wallet.' },
        { step: '03', title: 'Comisiones On-Chain', text: 'Tus clientes invierten, tú recibes tus comisiones automáticamente en USDC.' }
      ]}},
      { type: 'next_steps', data: { title: 'APLICA COMO GESTOR', text: 'Regístrate hoy en nuestro Mission Control.' } }
    ]
  },
  {
    slug: 'developers',
    title: 'Desarrollo proyectos (Infraestructura)',
    blocks: [
      { type: 'hero', data: { pretitle: 'TECNOLOGÍA BLOCKCHAIN', title: 'PANDORAS GROWTH OS', description: "Descubre cómo Pandoras potencia a S'Narai con infraestructura institucional." } },
      { type: 'sixty_seconds', data: { title: 'EL MOTOR DETRÁS DEL ACTIVO', text: "Pandoras provee el **Growth OS Engine**: Contratos Inteligentes, Tokenomics, App de Telegram y paneles administrativos.\n\nPermitimos que los desarrolladores inmobiliarios levanten capital 3x más rápido sin perder el control de su activo." } },
      { type: 'principles', data: { title: 'NUESTRO STACK TECNOLÓGICO', list: [
        { title: 'Smart Contracts', text: 'Auditorías de seguridad y compatibilidad global.' },
        { title: 'Cumplimiento Legal (NOM-151)', text: 'Contratos con validez jurídica oficial en México.' },
        { title: 'Distribución de Pagos', text: 'Dispersión de utilidades de manera pro-rata en 1-clic.' }
      ]}},
      { type: 'next_steps', data: { title: 'UTILIZA NUESTRO STACK', text: 'Agenda una llamada con el equipo de Pandoras.' } }
    ]
  },
  {
    slug: 'thesis',
    title: 'Nuestra tesis de inversión',
    blocks: [
      { type: 'hero', data: { pretitle: 'RIVIERA NAYARIT', title: 'TESIS Y CRECIMIENTO ASIMÉTRICO', description: "Por qué S'Narai se posiciona en el corredor de mayor plusvalía de México." } },
      { type: 'sixty_seconds', data: { title: 'DEMANDA CONCENTRADA', text: "Bucerías está experimentando una transición hacia el lujo. Con una plusvalía anual del **12% al 15%** y una ocupación en rentas a corto plazo superior al **70%**, la escasez de tierra premium garantiza apreciación.\n\nNuestra tesis se basa en adquirir en la **Zona Dorada** antes del peak market." } },
      { type: 'journey', data: { title: 'MECÁNICAS DE VALOR', steps: [
        { step: '01', title: 'Adquisición Temprana', text: 'Fondeo de capital estructurado en etapa cero.' },
        { step: '02', title: 'Desarrollo Condo-Hotel', text: 'Operación hotelera de altos márgenes y optimización fiscal.' },
        { step: '03', title: 'Rendimiento y Apreciación', text: 'Combinación de utilidades operativas y crecimiento de capital subyacente.' }
      ]}},
      { type: 'next_steps', data: { title: 'LEE EL DOSSIER COMPLETO', text: 'Entra a nuestro Resource Hub.' } }
    ]
  }
];

async function main() {
    console.log("Fetching S'Narai project...");
    const project = await db.query.projects.findFirst({
        where: eq(schema.projects.slug, 'snarai')
    });

    if (!project) {
        console.error("Project not found!");
        process.exit(1);
    }

    console.log("Deleting existing briefings...");
    await db.delete(schema.projectBriefings).where(eq(schema.projectBriefings.projectId, project.id));

    console.log("Inserting new briefings...");
    for (const b of briefings) {
      await db.insert(schema.projectBriefings).values({
        projectId: project.id,
        slug: b.slug,
        title: b.title,
        blocks: b.blocks,
        status: 'published'
      });
    }

    console.log("✅ Successfully seeded briefings into DB");
    process.exit(0);
}

main().catch(console.error);
