import { NextResponse } from 'next/server';
import { AIService } from '@/services/marketing/ai_advisor';

// Simple in-memory cache for Vercel Hobby tier optimization
const aiCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function POST(req: Request) {
  try {
    const { leads, projectName } = await req.json();

    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json({ error: 'Leads array is required' }, { status: 400 });
    }

    // Cache key based on project and lead count (simple heuristic)
    const cacheKey = `${projectName}_${leads.length}`;
    const cached = aiCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log(`[AI Advisor] Serving cached insights for ${projectName}`);
      return NextResponse.json(cached.data);
    }

    const insights = await AIService.getGrowthInsights(leads, projectName || 'Pandoras Project');
    
    // Store in cache
    aiCache.set(cacheKey, { data: insights, timestamp: Date.now() });
    
    return NextResponse.json(insights);
  } catch (error: any) {
    console.error('[AI Advisor API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error processing AI insights' }, 
      { status: 500 }
    );
  }
}
