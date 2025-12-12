import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";
import { trackGamificationEvent } from "@/lib/gamification/service";

export const runtime = "nodejs";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    try {
        // 1. Auth & Admin Check
        const headersObj = await headers();
        const { session } = await getAuth(headersObj);

        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userIsSuperAdmin = session.userId.toLowerCase() === SUPER_ADMIN_WALLET.toLowerCase();

        if (!userIsSuperAdmin) {
            return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
        }



        // 2. Fetch Project
        const project = await db.query.projects.findFirst({
            where: eq(projects.slug, slug),
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // 3. Validation
        // We expect the project to be 'live' or 'approved' (ready for sale)
        // If it's already completed, we might want to error or just return success
        if (project.status === 'completed') {
            return NextResponse.json({ message: "Project already certified/completed" }, { status: 200 });
        }

        // 4. Update Project Status (Certify Sale)
        // - Set status to 'completed' (Fundraising successful)
        // - Ensure raisedAmount equals targetAmount (implying full sale)
        await db.update(projects)
            .set({
                status: 'completed',
                raisedAmount: project.targetAmount, // Assume full sale certification
                // We could also add a 'certifiedAt' if we had such column, but we rely on updatedAt
            })
            .where(eq(projects.slug, slug));

        console.log(`✅ Project ${slug} certified as COMPLETED (Sale Finalized).`);

        // 5. Gamification: Award 1000 points for successful sale certification
        // (Assuming this goes to the project creator)
        if (project.applicantWalletAddress) {
            try {
                await trackGamificationEvent(
                    project.applicantWalletAddress,
                    'sale_certified',
                    {
                        projectId: project.id.toString(),
                        projectSlug: slug,
                        raisedAmount: project.targetAmount,
                        timestamp: new Date().toISOString()
                    }
                );
                console.log(`🎯 Gamification event tracked: sale_certified for ${project.applicantWalletAddress}`);
            } catch (gamificationError) {
                console.warn('⚠️ Failed to track gamification event:', gamificationError);
            }
        }

        return NextResponse.json({
            success: true,
            message: "Sale certified successfully",
            project: {
                slug: project.slug,
                newStatus: 'completed',
                raisedAmount: project.targetAmount
            }
        });

    } catch (error) {
        console.error("Certify Sale API Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}
