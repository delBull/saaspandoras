import { NextResponse } from 'next/server';
import { executeGrowthActions } from '@/lib/marketing/growth-engine/actions';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, name, source, tags, metadata } = body;

        if (!email) {
            return NextResponse.json({ message: 'Email required' }, { status: 400 });
        }

        console.log(`📧 [Creator OS] Delegating Welcome to Growth Engine: ${email}`);

        // 1. Fetch Project Context (Pandora - ID 1)
        const projectContext = await db.query.projects.findFirst({
            where: eq(projects.id, 1)
        });

        if (!projectContext) {
            throw new Error("Project context not found for Creator Lead");
        }

        // 2. Execute via Growth Engine
        // Creators usually get the Waitlist Welcome sequence (B2C-style but for Pandora)
        await executeGrowthActions(
            ['SEND_WAITLIST_WELCOME_D0', 'NOTIFY_TEAM'], 
            {
                lead: {
                    email,
                    name: name || 'Creator',
                    scope: 'b2c', // Creators are usually treated as waitlist leads
                    intent: 'explore',
                    metadata: { 
                        tags,
                        ...metadata,
                        source: source || 'start_landing'
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
                ruleId: 'CREATOR_MANUAL_REGISTRATION',
                bypassCooldown: true
            }
        );

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('❌ Creator Registration Error:', error);
        return NextResponse.json({ 
            message: 'Internal Server Error',
            error: error instanceof Error ? error.message : 'Unknown'
        }, { status: 500 });
    }
}
