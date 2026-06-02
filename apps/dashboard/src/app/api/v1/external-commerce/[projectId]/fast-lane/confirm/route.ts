import { NextResponse } from 'next/server';
import { db } from '@/db';
import { purchases, projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendPaymentNotification } from '@/lib/discord/notifier';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId: rawProjectId } = await params;
    const projectId = Number(rawProjectId);
    
    if (isNaN(projectId)) {
        return NextResponse.json({ error: "Invalid Project ID" }, { status: 400 });
    }
    
    const body = await req.json();
    const { purchaseRef } = body;
    
    if (!purchaseRef) {
        return NextResponse.json({ error: "Missing purchaseRef" }, { status: 400 });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId)
    });

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    const purchase = await db.query.purchases.findFirst({
        where: and(
            eq(purchases.purchaseId, purchaseRef),
            eq(purchases.projectId, projectId)
        )
    });

    if (!purchase) {
        return NextResponse.json({ error: 'Purchase no encontrada' }, { status: 404 });
    }

    if (purchase.status === 'on_hold') {
        await db.update(purchases)
            .set({ status: 'processing' as any, updatedAt: new Date() })
            .where(eq(purchases.id, purchase.id));

        // Enviar Webhook notificando a los administradores
        const dashboardUrl = `https://dash.pandoras.finance/profile/projects/${project.slug}/manage`;
        await sendPaymentNotification({
            type: "payment_received",
            amount: Number(purchase.amount),
            currency: "USD",
            method: "wire",
            status: "pending",
            linkId: purchase.purchaseId,
            clientId: purchase.userId,
            metadata: {
                message: `El inversor notificó haber realizado la transferencia para el proyecto ${project.title}. Favor de conciliar con el banco.\n\n🔗 [Abrir Panel de Administración](${dashboardUrl})`
            }
        });
    }

    return NextResponse.json({ success: true, status: 'processing' });

  } catch (error) {
    console.error('Fast-lane confirm error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
