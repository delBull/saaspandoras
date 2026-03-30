import OpenAI from 'openai';

export interface LeadData {
  email: string;
  intent: string;
  score: number;
  metadata?: any;
  projectName: string;
}

export interface GrowthInsight {
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  type: 'strategy' | 'segmentation' | 'engagement';
}

const ADVISOR_SCHEMA = `{
  "insights": [
    {
      "title": "string",
      "description": "string",
      "impact": "low | medium | high",
      "type": "strategy | segmentation | engagement"
    }
  ],
  "summary": "string - resumen general de la salud de crecimiento del proyecto"
}`;

/**
 * Rule-based fallback insights when OpenAI is unavailable.
 * Generates deterministic, data-driven recommendations.
 */
function generateFallbackInsights(leads: LeadData[], projectName: string) {
  const investors = leads.filter(l => l.intent === 'invest' || l.intent === 'capital').length;
  const highScore = leads.filter(l => l.score > 70).length;
  const explore = leads.filter(l => l.intent === 'explore' || !l.intent).length;
  const total = leads.length;
  const conversionRate = total > 0 ? Math.round((investors / total) * 100) : 0;

  const insights: GrowthInsight[] = [];

  // Insight 1: Conversion opportunity
  if (explore > 0) {
    insights.push({
      title: 'Leads en modo exploración — actívalos',
      description: `${explore} de tus ${total} leads (${Math.round((explore/total)*100)}%) tienen intent "explore". Considera enviar un email de activación con caso de uso concreto o una oferta de acceso limitado para convertirlos a intent de inversión.`,
      impact: 'high',
      type: 'strategy'
    });
  }

  // Insight 2: High quality leads
  if (highScore > 0) {
    insights.push({
      title: `${highScore} leads de alta calidad sin seguimiento`,
      description: `Tienes ${highScore} leads con QS > 70 en ${projectName}. Este segmento tiene alta probabilidad de conversión. Prioriza contacto directo vía WhatsApp o llamada estratégica en las próximas 48h.`,
      impact: 'high',
      type: 'segmentation'
    });
  } else {
    insights.push({
      title: 'Optimiza tu score promedio de leads',
      description: `Ningún lead supera 70 QS actualmente en ${projectName}. Considera enriquecer el formulario de captura con campos de capital estimado e intención de inversión para elevar la calidad de incoming leads.`,
      impact: 'medium',
      type: 'segmentation'
    });
  }

  // Insight 3: Investor segment
  insights.push({
    title: conversionRate > 30 ? 'Tasa de conversión saludable' : 'Oportunidad de mejora en conversión',
    description: conversionRate > 30
      ? `El ${conversionRate}% de leads tiene intent de inversión en ${projectName}. Mantén el momentum con una secuencia de nurturing D+3 orientada a cierre.`
      : `Solo el ${conversionRate}% tiene intent de inversión. Revisa el copy de tu landing page para enfatizar el ROI y los casos de uso del protocolo ${projectName}.`,
    impact: conversionRate > 30 ? 'medium' : 'high',
    type: 'engagement'
  });

  return {
    insights,
    summary: `${projectName} tiene ${total} leads capturados. ${investors} con intent de inversión (${conversionRate}% conversión) y ${highScore} leads de alta calidad (QS>70). Análisis generado por Growth Engine v2.`,
    source: 'rule_engine' // indicates fallback was used
  };
}

export const AIService = {
  async getGrowthInsights(leads: LeadData[], projectName: string) {
    // If no OpenAI key, use rule-based fallback immediately
    if (!process.env.OPENAI_API_KEY) {
      console.log('[GrowthAI] No OPENAI_API_KEY — using rule-based fallback');
      return generateFallbackInsights(leads, projectName);
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const segments = {
      investors: leads.filter(l => l.intent === 'invest' || l.intent === 'capital').length,
      whitelisters: leads.filter(l => l.intent === 'whitelist').length,
      highScore: leads.filter(l => l.score > 70).length,
      total: leads.length
    };

    const systemPrompt = `Eres un Growth Hacker Senior para protocolos Web3. 
Analiza los datos del proyecto "${projectName}" y devuelve 3 insights estratégicos de alto impacto.

DATOS DE AUDIENCIA:
<stats>
- Total: ${segments.total}
- Inversores: ${segments.investors}
- Whitelisters: ${segments.whitelisters}
- Leads de alta calidad (>70 QS): ${segments.highScore}
</stats>

CONTEXTO: Enfócate en conversión, retención y liquidez Web3.
FORMATO DE SALIDA: JSON estricto según este esquema:
${ADVISOR_SCHEMA}`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Genera el JSON de insights ahora.' }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      });

      const rawContent = completion.choices[0]?.message.content ?? '{}';
      return JSON.parse(rawContent);
    } catch (error) {
      console.error('[GrowthAI] OpenAI error, falling back to rule engine:', error);
      // Graceful fallback — never crash the UI
      return generateFallbackInsights(leads, projectName);
    }
  }
};
