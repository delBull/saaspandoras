import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

export const maxDuration = 60; // Allow up to 60 seconds for AI generation

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Zod schemas for Structured Outputs
const OutlineSchema = z.object({
  title: z.string().describe("T\u00EDtulo altamente atractivo del curso"),
  description: z.string().describe("Descripci\u00F3n persuasiva que enganche al estudiante"),
  skills_covered: z.array(z.string()).describe("Lista de 3 a 5 habilidades o conceptos a dominar"),
  prerequisites: z.array(z.string()).describe("Lista de requisitos previos o conceptos base necesarios (puede estar vac\u00EDa)"),
  modules: z.array(z.object({
    id: z.string(),
    title: z.string().describe("T\u00EDtulo del m\u00F3dulo, debe dar curiosidad"),
    type: z.enum(['article', 'video', 'quiz']),
    description: z.string().describe("Resumen de 1 o 2 l\u00EDneas de lo que cubrir\u00E1 este m\u00F3dulo")
  })).describe("Lista de m\u00F3dulos. Si es outline, no incluye el contenido profundo a\u00FAn. Debe incluir un m\u00F3dulo final de tipo 'quiz'.")
});

const ModuleContentSchema = z.object({
  modules: z.array(z.object({
    id: z.string(),
    content: z.string().nullable().describe("Contenido en HTML del art\u00EDculo. Si es un video o quiz, devu\u00E9lvelo null."),
    duration: z.string().describe("Tiempo estimado en formato 'X min'. M\u00E1ximo 5 min."),
    engagement_hook: z.string().describe("Hook de curiosidad con el que debe iniciar el m\u00F3dulo"),
    key_takeaway: z.string().describe("Insight accionable principal (TLDR) del m\u00F3dulo"),
    dopamine_trigger: z.enum(['insight', 'reward', 'curiosity']).describe("El tipo de trigger emocional que persigue este m\u00F3dulo")
  }))
});

const QuizSchema = z.object({
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()).length(4),
    correctIndex: z.number().int().min(0).max(3),
    type: z.enum(['concept', 'scenario', 'trap']).describe("El tipo de pregunta para intercalar din\u00E1micas e inteligencia")
  }))
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key no est\u00E1 configurada en las variables de entorno.' }, { status: 500 });
    }

    const body = await req.json();
    const { phase, topic, difficulty, tone, currentState } = body;

    const baseSystemPrompt = `
      Eres un Arquitecto de Cursos "Dopamin\u00E9rgico" y Experto en Aprendizaje Web3.
      Tu objetivo no es crear una enciclopedia plana. Tu objetivo es retener al usuario.
      Reglas del "Course Engine":
      1. T\u00F3pico: ${topic}
      2. Dificultad: ${difficulty || 'Beginner'}
      3. Tono: ${tone || 'Motivacional, conciso y directo'}
    `;

    if (phase === 'outline') {
      const response = await openai.beta.chat.completions.parse({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: baseSystemPrompt + '\n\nCrea la estructura modular para este curso. Debe haber max 4-6 m\u00F3dulos cr\u00EDticos y luego un Quiz interactivo final.' },
          { role: 'user', content: 'Genera el outline del curso.' }
        ],
        response_format: zodResponseFormat(OutlineSchema, 'course_outline'),
        temperature: 0.7,
      });

      return NextResponse.json(response.choices[0].message.parsed);
    } 
    
    else if (phase === 'modules') {
      const outlineStr = JSON.stringify(currentState?.modules || []);
      const prompt = `
        ${baseSystemPrompt}
        
        Aqu\u00ED est\u00E1 el outline de m\u00F3dulos actual:
        ${outlineStr}
        
        Tu tarea:
        - Expande los m\u00F3dulos que sean de tipo 'article'.
        - Cada content en HTML debe empezar reforzando el 'engagement_hook' aportado.
        - Entregar S\u00D3LO un concepto central por m\u00F3dulo (Micro-dosis).
        - Tiempo de lectura m\u00E1ximo: 3 minutos (unas 300 palabras).
        - Debe cerrar r\u00E1pidamente apoyando el 'key_takeaway'.
        - IMPORTANTE: Usa HTML con <h3> y <p> s\u00F3lamente. No uses headers <h1> o <h2> de nuevo porque ya la UI tiene sus propios t\u00EDtulos.
        - Devuelve s\u00F3lo los campos mapeados al JSON esperado para CADA m\u00F3dulo. Si es video o quiz, omite el content.
      `;

      const response = await openai.beta.chat.completions.parse({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: 'Escribe el contenido de los m\u00F3dulos de tipo art\u00EDculo.' }
        ],
        response_format: zodResponseFormat(ModuleContentSchema, 'module_contents'),
        temperature: 0.7,
      });

      return NextResponse.json(response.choices[0].message.parsed);
    }

    else if (phase === 'quiz') {
      const contentStr = JSON.stringify(currentState?.modules || []);
      const prompt = `
        ${baseSystemPrompt}

        Aqu\u00ED est\u00E1 el contenido de todo el curso:
        ${contentStr}

        Crea el banco de preguntas final. Mezcla:
        - 'concept': Para check de conocimiento r\u00E1pido.
        - 'scenario': Un caso de uso aplicado o supuesto, largo.
        - 'trap': Una pregunta con truco donde la respuesta obvia es incorrecta (y una de las opciones da la pista de cu\u00E1l es la real).
        
        Genera m\u00EDnimo 5 a 7 preguntas en total.
      `;

      const response = await openai.beta.chat.completions.parse({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: 'Genera las preguntas interactivas bas\u00E1ndote ESTRICTAMENTE en los temas cubiertos en el content.' }
        ],
        response_format: zodResponseFormat(QuizSchema, 'quiz_questions'),
        temperature: 0.6,
      });

      return NextResponse.json(response.choices[0].message.parsed);
    }

    return NextResponse.json({ error: 'Fase no v\u00E1lida.' }, { status: 400 });

  } catch (error: any) {
    console.error('AI Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Error desconocido generando contenido con IA.' }, { status: 500 });
  }
}
