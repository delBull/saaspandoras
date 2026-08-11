import { NextResponse } from 'next/server';
import { db } from '@/db';
import { ambassadors, projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import { withSecurity, apiRateLimiter } from '@/lib/security-utils';
import { verifySignature } from 'thirdweb/auth';
import { client } from '@/lib/thirdweb-client';

async function handlerGet(
    req: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const { session } = await getAuth(await headers());
        const walletAddress = session?.address;

        if (!walletAddress) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let project;
        if (!isNaN(parseInt(projectId))) {
            project = await db.query.projects.findFirst({
                where: eq(projects.id, parseInt(projectId))
            });
        } else {
            project = await db.query.projects.findFirst({
                where: eq(projects.slug, projectId)
            });
        }

        if (!project || project.applicantWalletAddress?.toLowerCase() !== walletAddress.toLowerCase()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const projectIdNum = project.id;

        const network = await db.query.ambassadors.findMany({
            where: eq(ambassadors.projectId, projectIdNum),
            with: {
                manager: {
                    columns: {
                        fullName: true,
                        referralCode: true,
                    }
                }
            }
        });

        return NextResponse.json({
            network,
            rates: {
                ambassadorCommissionRate: project.ambassadorCommissionRate || "4.00",
                managerCommissionRate: project.managerCommissionRate || "3.00",
            }
        });
    } catch (error) {
        console.error('Error in network GET:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function handlerPut(
    req: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const body = await req.json();
        const { action, ambassadorId, managerId, ambassadorCommissionRate, managerCommissionRate, signature, message, signerAddress } = body;
        
        const { session } = await getAuth(await headers());
        const walletAddress = session?.address;

        if (!walletAddress) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let project;
        if (!isNaN(parseInt(projectId))) {
            project = await db.query.projects.findFirst({
                where: eq(projects.id, parseInt(projectId))
            });
        } else {
            project = await db.query.projects.findFirst({
                where: eq(projects.slug, projectId)
            });
        }

        if (!project || project.applicantWalletAddress?.toLowerCase() !== walletAddress.toLowerCase()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const projectIdNum = project.id;

        // Action: Update Rates
        if (action === 'update_rates') {
            await db.update(projects)
                .set({
                    ambassadorCommissionRate: ambassadorCommissionRate ? String(ambassadorCommissionRate) : project.ambassadorCommissionRate,
                    managerCommissionRate: managerCommissionRate ? String(managerCommissionRate) : project.managerCommissionRate,
                    updatedAt: new Date(),
                })
                .where(eq(projects.id, projectIdNum));

            return NextResponse.json({ success: true, message: "Tasas de comisión actualizadas" });
        }

        // Action: Assign Manager (Requires Signature)
        if (!ambassadorId) {
            return NextResponse.json({ error: 'Ambassador ID required' }, { status: 400 });
        }

        // Verify Signature for Admin Security
        if (!signature || !message || !signerAddress) {
            return NextResponse.json({ error: 'Firma de wallet requerida para autorizar este cambio.' }, { status: 400 });
        }

        const expectedMessage = `Pandoras Admin Action\nProject: ${projectIdNum}\nAssign Manager: ${managerId || 'NONE'}\nAmbassador: ${ambassadorId}`;
        if (message !== expectedMessage) {
            return NextResponse.json({ error: 'Mensaje de firma no coincide.' }, { status: 400 });
        }

        if (signerAddress.toLowerCase() !== project.applicantWalletAddress?.toLowerCase()) {
            return NextResponse.json({ error: 'La firma debe provenir del dueño del proyecto.' }, { status: 403 });
        }

        const isValidSig = await verifySignature({
            client,
            message,
            signature,
            address: signerAddress,
        });

        if (!isValidSig) {
            return NextResponse.json({ error: 'Firma inválida o expirada.' }, { status: 401 });
        }

        await db.update(ambassadors)
            .set({ managerId: managerId || null, updatedAt: new Date() })
            .where(eq(ambassadors.id, ambassadorId));

        return NextResponse.json({ success: true, message: "Manager asignado con firma verificada" });
    } catch (error) {
        console.error('Error in network PUT:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export const GET = withSecurity(handlerGet as any, { rateLimit: apiRateLimiter });
export const PUT = withSecurity(handlerPut as any, { rateLimit: apiRateLimiter });
