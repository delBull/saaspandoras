import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

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

export const AIService = {
  async getGrowthInsights(leads: LeadData[], projectName: string) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY missing');
    }

    const segments = {
      investors: leads.filter(l => l.intent === 'invest').length,
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
      console.error('[GrowthAI] Error generating insights:', error);
      throw error;
    }
  }
};
