
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { daoActivities, projects } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { verifyMessage } from "viem";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
        return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    try {
        const category = searchParams.get('category');

        const whereCondition = category
            ? and(eq(daoActivities.projectId, Number(projectId)), eq(daoActivities.category, category))
            : eq(daoActivities.projectId, Number(projectId));

        const activities = await db
            .select()
            .from(daoActivities)
            .where(whereCondition)
            .orderBy(desc(daoActivities.createdAt));



        return NextResponse.json(activities);
    } catch (error) {
        console.error('Error fetching activities:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}



export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { projectId, title, description, rewardAmount, rewardTokenSymbol, type, externalLink, signature, signerAddress, message } = body;

        // 1. Verify Signature
        // Reconstruct message or use passed one if robust. Ideally reconstruct.
        // Client sent: `Create Activity: ${title}\nReward: ${rewardAmount} ${rewardToken}\nDate: ...`
        // Since date is dynamic, let's rely on passed message for now but verify it matches intent?
        // Better pattern: Client sends a deterministic message payload. 
        // For now, verification of "Authorized Signer" is key.

        if (!signature || !signerAddress || !message) {
            return NextResponse.json({ error: "Missing signature/auth" }, { status: 401 });
        }

        const isValid = await verifyMessage({
            address: signerAddress,
            message: message,
            signature: signature
        });

        if (!isValid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

        // 2. Verify Ownership
        // Only the project owner (applicant_wallet_address) can create activities.
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, Number(projectId))
        });

        if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

        // Normalize addresses
        const owner = project.applicantWalletAddress?.toLowerCase();
        const signer = signerAddress.toLowerCase();

        // Allow if owner OR if it's the global admin (hardcoded for now or env)
        const isOwner = owner === signer;
        // const isAdmin = ...

        if (!isOwner) {
            return NextResponse.json({ error: "Unauthorized: Only project owner can manage activities" }, { status: 403 });
        }

        let targetProjectId = Number(projectId);

        // Special handling for Global DAO (Project 0 from frontend)
        if (targetProjectId === 0) {
            const globalProject = await db.query.projects.findFirst({
                where: eq(projects.slug, 'pandoras-dao')
            });

            if (globalProject) {
                targetProjectId = globalProject.id;
            } else {
                // Auto-create Global DAO Project if missing
                const result = await db.insert(projects).values({
                    title: "Pandoras Governance",
                    slug: "pandoras-dao",
                    description: "DAO Oficial de la Plataforma Pandoras.",
                    status: "live",
                    targetAmount: "0",
                    featured: true,
                    treasuryAddress: "0x0000000000000000000000000000000000000000", // Placeholder
                }).returning();

                if (!result[0]) throw new Error("Failed to create Global DAO project");
                targetProjectId = result[0].id;
            }
        }

        const newActivity = await db.insert(daoActivities).values({
            projectId: targetProjectId,
            title,
            description,
            rewardAmount: rewardAmount.toString(),
            rewardTokenSymbol: rewardTokenSymbol || 'PBOX',
            type: type || 'custom',
            category: body.category || 'social',
            requirements: body.requirements || {},
            status: 'active',
            externalLink,
        }).returning();

        return NextResponse.json(newActivity[0]);
    } catch (error) {
        console.error('Error creating activity:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
