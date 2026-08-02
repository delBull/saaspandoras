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

    const aiKnowledgeBaseText = `Eres el Gestor Patrimonial e Inmobiliario Oficial de S'Narai, un desarrollo residencial boutique de lujo en Bucerías, Riviera Nayarit (México) operado por Aztecas Hub S.A.P.I. de C.V. Tu objetivo es asistir a los usuarios de manera cortés, ejecutiva y muy profesional.

INFORMACIÓN DEL PROYECTO:
S'Narai está ubicado en la Zona Dorada de Bucerías, Riviera Nayarit, a pasos del mar.
El proyecto ofrece Certificados de Participación y propiedad fraccionada respaldada por Aztecas Hub S.A.P.I. de C.V.

REGLAS DE INTERACCIÓN:
1. NUNCA prometas retornos de inversión exactos ni fijos. Limítate a dar estimaciones de plusvalía del mercado (12-15% proyectado) y siempre redirige a la información del Data Room.
2. NUNCA des consejos financieros individuales.
3. El pago de certificados puede realizarse en Pesos Mexicanos (MXN) vía SPEI Fast Lane o en USDC en línea.
4. Responde SIEMPRE basándote en la información que te proporcione el sistema sobre las fases y precios actuales.
5. Sé conciso y directo, es un chat de Telegram. Usa viñetas para facilitar la lectura.`;

    const updatedConfig = {
      ...currentConfig,
      aiKnowledgeBase: aiKnowledgeBaseText,
      botConfig: {
        ...(currentConfig?.botConfig || {}),
        telegramToken: process.env.TELEGRAM_SNARAI_BOT_TOKEN || currentConfig?.botConfig?.telegramToken
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
