import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const maxDuration = 60;
export const runtime = 'nodejs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// ─── JSON Schemas como strings (sin zodResponseFormat, compatible con Zod 3.23.8) ───

const OUTLINE_SCHEMA = `{
  "title": "string — título atractivo del curso",
  "description": "string — descripción persuasiva",
  "difficulty": "string — Beginner | Intermediate | Advanced",
  "skills_covered": ["string", "..."],
  "prerequisites": ["string", "..."],
  "modules": [
    {
      "id": "string",
      "title": "string",
      "type": "article | video | quiz",
      "description": "string — resumen de 1-2 líneas"
    }
  ]
}`;

const MODULE_SCHEMA = `{
  "modules": [
    {
      "id": "string — MISMO id que el módulo del outline",
      "content": "string | null — HTML con <h3> y <p> para artículos. null para video o quiz",
      "duration": "string — ej: '3 min'",
      "engagement_hook": "string — frase de apertura que da curiosidad",
      "key_takeaway": "string — insight principal (TLDR)",
      "dopamine_trigger": "insight | reward | curiosity"
    }
  ]
}`;

const QUIZ_SCHEMA = `{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": 0,
      "type": "concept | scenario | trap"
    }
  ]
}`;

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY no está configurada en las variables de entorno.' }, { status: 500 });
    }

    const body = await req.json();
    const { phase, topic, difficulty, tone, currentState } = body;

    const baseSystem = `Eres un Arquitecto de Cursos Web3 que crea contenido "dopaminérgico".
Reglas del motor:
- Tópico: ${topic}
- Dificultad: ${difficulty || 'Beginner'}
- Tono: ${tone || 'Motivacional, conciso y directo'}
IMPORTANTE: Responde ÚNICAMENTE con JSON válido que siga el schema pedido. Sin texto extra, sin markdown, solo el JSON.`;

    if (phase === 'outline') {
      const outlineCompletion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `${baseSystem}\n\nCrea la estructura del curso (máximo 5 módulos de contenido + 1 quiz final).\nResponde EXACTAMENTE con este JSON schema:\n${OUTLINE_SCHEMA}`,
          },
          { role: 'user', content: 'Genera el outline del curso.' },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const outlineRaw = outlineCompletion.choices[0]?.message.content ?? '{}';
      return NextResponse.json(JSON.parse(outlineRaw));
    }

    if (phase === 'modules') {
      const outlineStr = JSON.stringify(currentState?.modules || [], null, 2);

      const modulesCompletion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `${baseSystem}\n\nExpande los módulos de tipo 'article' con contenido HTML usando solo <h3> y <p>.
Máximo 3 minutos de lectura por módulo. Incluye engagement_hook, key_takeaway y dopamine_trigger.
Mantén los mismos IDs. Para módulos de tipo 'video' o 'quiz' devuelve content: null.
Responde EXACTAMENTE con este JSON schema:\n${MODULE_SCHEMA}`,
          },
          {
            role: 'user',
            content: `Módulos del outline:\n${outlineStr}\n\nExpande el contenido de tipo 'article'.`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const modulesRaw = modulesCompletion.choices[0]?.message.content ?? '{}';
      return NextResponse.json(JSON.parse(modulesRaw));
    }

    if (phase === 'quiz') {
      const contentStr = JSON.stringify(currentState?.modules || [], null, 2);

      const quizCompletion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `${baseSystem}\n\nCrea banco de preguntas (mínimo 5, máximo 7). Mezcla tipos: concept, scenario, trap.
Las opciones siempre deben ser exactamente 4 strings. correctIndex es 0-3.
Responde EXACTAMENTE con este JSON schema:\n${QUIZ_SCHEMA}`,
          },
          {
            role: 'user',
            content: `Basándote en este contenido del curso:\n${contentStr}\n\nGenera las preguntas del quiz final.`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.6,
      });

      const quizRaw = quizCompletion.choices[0]?.message.content ?? '{}';
      return NextResponse.json(JSON.parse(quizRaw));
    }

    return NextResponse.json({ error: 'Fase no válida. Usa: outline | modules | quiz' }, { status: 400 });

  } catch (error: any) {
    console.error('[AI Course Generate] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error desconocido generando contenido con IA.' },
      { status: 500 }
    );
  }
}
