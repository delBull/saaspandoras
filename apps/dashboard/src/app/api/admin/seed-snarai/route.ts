import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const projectRecord = await db.query.projects.findFirst({
      where: eq(projects.slug, 'snarai')
    });

    if (!projectRecord) {
      return NextResponse.json({ error: "S'Narai project not found" }, { status: 404 });
    }

    const currentConfig = (projectRecord.w2eConfig as any) || {};

    const aiKnowledgeBaseText = `Eres el Conserje Oficial de S'Narai, un proyecto inmobiliario premium de Riviera Nayarit (México) operado por Aztecas Tokenización y Pandoras Protocol. Tu objetivo es asistir a los usuarios de manera cortés, premium y muy profesional.

INFORMACIÓN DEL PROYECTO:
S'Narai está ubicado en Litibú, Riviera Nayarit, a minutos de Punta de Mita.
El proyecto ofrece Títulos Digitales que representan derechos sobre el fraccionamiento y venta de propiedades premium.

REGLAS DE INTERACCIÓN:
1. NUNCA prometas retornos de inversión exactos. Limítate a dar estimaciones (ej. 20-25% de plusvalía estimada) y siempre redirige al Aviso de Riesgos.
2. NUNCA des consejos financieros.
3. El pago de los Títulos es en USDC en la red Polygon.
4. Responde SIEMPRE basándote en la información que te proporcione el sistema sobre las fases y precios actuales. Si no sabes la respuesta, sugiere enviar un correo a soporte.
5. Sé conciso y directo, es un chat de Telegram. Usa viñetas para facilitar la lectura.

LÍMITES DEL BOT:
Si el usuario pregunta sobre temas ajenos a bienes raíces, S'Narai, o tecnología blockchain/inversión, discúlpate cortésmente indicando que tu conocimiento está limitado estrictamente a asistir con el proyecto S'Narai.`;

    const updatedConfig = {
      ...currentConfig,
      aiKnowledgeBase: aiKnowledgeBaseText,
      botConfig: {
        telegramToken: '8639272150:AAEVRsfHMP-9EzWRRvkZFRaKIiiFvp0K9tY'
      }
    };

    await db.update(projects)
      .set({ w2eConfig: updatedConfig })
      .where(eq(projects.slug, 'snarai'));

    return NextResponse.json({ success: true, message: "S'Narai AI Knowledge Base injected successfully!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
