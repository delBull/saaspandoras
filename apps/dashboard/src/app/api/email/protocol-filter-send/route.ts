import { NextResponse } from 'next/server';
import { executeGrowthActions } from '@/lib/marketing/growth-engine/actions';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, name, source, answers } = body;

        if (!email) {
            return NextResponse.json({ message: 'Email required' }, { status: 400 });
        }

        console.log(`📧 [Utility OS] Delegating Protocol Filter to Growth Engine: ${email}`);

        // 1. Fetch Project Context (Pandora - ID 1)
        const projectContext = await db.query.projects.findFirst({
            where: eq(projects.id, 1)
        });

        if (!projectContext) {
            throw new Error("Project context not found for Utility Lead");
        }

        // 2. Execute via Growth Engine
        await executeGrowthActions(
            ['SEND_WELCOME_B2B_D1', 'NOTIFY_TEAM'], 
            {
                lead: {
                    email,
                    name: name || 'Architect',
                    scope: 'b2b',
                    intent: 'invest',
                    metadata: { 
                        answers,
                        subType: 'protocol_filter',
                        source: source || 'utility_protocol_landing'
                    }
                } as any,
                project: {
                    id: projectContext.id,
                    slug: projectContext.slug,
                    name: projectContext.title || 'Pandora',
                    businessCategory: projectContext.businessCategory || 'other',
                    discordWebhookUrl: projectContext.discordWebhookUrl || null
                } as any
            },
            { 
                ruleId: 'PROTOCOL_FILTER_MANUAL_INQUIRY',
                bypassCooldown: true
            }
        );

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('❌ Utility Registration Error:', error);
        return NextResponse.json({ 
            message: 'Internal Server Error',
            error: error instanceof Error ? error.message : 'Unknown'
        }, { status: 500 });
    }
}
