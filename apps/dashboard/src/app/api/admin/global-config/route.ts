import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/admin/global-config
 * Fetches the global configuration (betaOpen, ritualEnabled) from project #15 metadata.
 */
export async function GET() {
    try {
        const result = await db.select({
            w2eConfig: projects.w2eConfig
        })
        .from(projects)
        .where(eq(projects.id, 15))
        .limit(1);

        if (!result.length) {
            return NextResponse.json({
                betaOpen: false,
                ritualEnabled: true,
                error: 'Global project not found'
            });
        }

        const w2eConfig = (result[0].w2eConfig as any) || {};

        return NextResponse.json({
            betaOpen: w2eConfig.betaOpen ?? false,
            ritualEnabled: w2eConfig.ritualEnabled ?? true,
            apiBaseUrlProduction: w2eConfig.apiBaseUrlProduction ?? 'https://saaspandoras-production.up.railway.app:8080',
            apiBaseUrlStaging: w2eConfig.apiBaseUrlStaging ?? 'https://staging.pandoras.io'
        });
    } catch (error: any) {
        console.error('[GLOBAL_CONFIG_GET] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/global-config
 * Updates the global configuration.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { betaOpen, ritualEnabled, apiBaseUrlProduction, apiBaseUrlStaging } = body;

        // Fetch current w2eConfig to merge
        const current = await db.select({
            w2eConfig: projects.w2eConfig
        })
        .from(projects)
        .where(eq(projects.id, 15))
        .limit(1);

        const currentW2eConfig = (current[0]?.w2eConfig as any) || {};
        
        const newW2eConfig = {
            ...currentW2eConfig,
            betaOpen: betaOpen ?? currentW2eConfig.betaOpen,
            ritualEnabled: ritualEnabled ?? currentW2eConfig.ritualEnabled,
            apiBaseUrlProduction: apiBaseUrlProduction ?? currentW2eConfig.apiBaseUrlProduction,
            apiBaseUrlStaging: apiBaseUrlStaging ?? currentW2eConfig.apiBaseUrlStaging,
            updatedAt: new Date().toISOString()
        };

        await db.update(projects)
            .set({
                w2eConfig: newW2eConfig,
                updatedAt: new Date()
            })
            .where(eq(projects.id, 15));

        return NextResponse.json({
            success: true,
            config: {
                betaOpen: newW2eConfig.betaOpen,
                ritualEnabled: newW2eConfig.ritualEnabled,
                apiBaseUrlProduction: newW2eConfig.apiBaseUrlProduction,
                apiBaseUrlStaging: newW2eConfig.apiBaseUrlStaging
            }
        });
    } catch (error: any) {
        console.error('[GLOBAL_CONFIG_POST] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
