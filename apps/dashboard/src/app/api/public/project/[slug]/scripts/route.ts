import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: Request,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const params = await props.params;
    const { slug } = params;

    const projectList = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1);
    
    if (!projectList.length) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const scripts = [
      {
        id: "script_1",
        title: "Primer Contacto (Generando Interés)",
        script: "Hola [Nombre], estoy trabajando con un nuevo modelo de inversión inmobiliaria en Riviera Nayarit. Es una forma de participar en un desarrollo premium de hotelería sin adquirir una propiedad completa ni lidiar con inquilinos. Pensé que podría interesarte porque sé que buscas diversificar tu patrimonio con flujos de caja constantes. ¿Tienes 5 minutos esta semana para enviarte el enlace al Transparency Center y que lo revises?",
        category: "contact"
      },
      {
        id: "script_2",
        title: "Manejo de la pregunta '¿Es Crypto?'",
        script: "Excelente pregunta. La tecnología blockchain está detrás de la transparencia del sistema, pero la inversión está 100% enfocada en un activo inmobiliario real (tabiques, operación hotelera, escrituras). Es como el sistema de un banco: no te importa el software que usan, sino que tu dinero esté respaldado.",
        category: "objection"
      },
      {
        id: "script_3",
        title: "Seguimiento / 'Déjame pensarlo'",
        script: "Perfecto [Nombre]. No hay ninguna prisa. Mi recomendación es que entres directamente a nuestro Centro de Transparencia. Ahí puedes revisar por ti mismo las proyecciones financieras, los documentos legales y el estado del fideicomiso. Te dejo el acceso directo aquí: [TU LINK DE PARTNER]. Mándame mensaje cuando lo leas si tienes alguna duda sobre el Yield.",
        category: "followup"
      }
    ];

    return NextResponse.json({
      scripts,
      success: true
    });
  } catch (error) {
    console.error('Error fetching scripts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
