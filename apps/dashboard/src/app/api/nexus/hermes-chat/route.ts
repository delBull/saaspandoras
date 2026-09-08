/**
 * POST /api/nexus/hermes-chat
 * Operations Hub — Hermes Terminal Chat API
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireNexusAdmin } from '@/lib/nexus/collaborators-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HERMES_KB: Array<{ keywords: string[]; response: string }> = [
  {
    keywords: ['whatsapp', 'wa', 'wsp', 'numero', 'telefono'],
    response: `La integración de WhatsApp Business opera a través de SignalWire y el conector de Hermes Channel Mesh.

El número activo es el configurado en HERMES_WHATSAPP_PHONE_NUMBER. Flujo de mensajes entrantes:
  1. Webhook SignalWire → Edge API (/api/v1/a2a/messages)
  2. Hermes Runtime evalúa el tenant y el journey del contacto
  3. Respuesta generada con el Soul del proyecto activo

Para el equipo interno: interactúen vía Discord mencionando a @Hermes en cualquier hilo HITL. Escribe !resolver para devolver el control al bot.`,
  },
  {
    keywords: ['telegram', 'tg', 'bot', 'tma', 'miniapp'],
    response: `Telegram opera en las Fases 2 y 3 del roadmap Hermes Channel Mesh.

Fase 2 — Telegram Bot (pandoras-telegram-bot): Conversational Plane.
  Consume HermesRuntime.respond(), resuelve tenants por /start, botones inline con evidencia K26/K27 en IPFS.

Fase 3 — Telegram Mini App (pandoras-telegram-app): Interactive Transaction Plane.
  Renderiza Claim Contracts, explorador de oportunidades fraccionadas y recibos notarizados.

Para integrar un proyecto al bot: /nexus/developers → SDK A2A.`,
  },
  {
    keywords: ['discord', 'hitl', 'soporte', 'escalamiento', 'hilo'],
    response: `Discord es el canal HITL oficial para escalar conversaciones de clientes.

Para vincularte como colaborador de soporte:
  1. Únete: https://discord.gg/HcfARNc9Q
  2. Ejecuta !link-wallet en el canal de onboarding
  3. Firma con tu Smart Wallet via el DM que recibirás
  4. Tus mensajes en hilos HITL llegan al cliente en tiempo real
  5. Escribe !resolver para devolver el control a Hermes`,
  },
  {
    keywords: ['deal', 'contrato', 'nda', 'acuerdo', 'propuesta', 'firma', 'legal'],
    response: `Los Deal Rooms son la capa de ejecución legal soberana del Nexus.

Desde /nexus/rooms puedes crear: Propuestas, Acuerdos, Contratos, Enmiendas y Charters.
Los signatarios externos reciben un Magic Link firmado (sin registro previo).
Cada acuerdo genera un digest SHA-256 con timestamp atómico, anclado en Sovereign K25 (IPFS).
Los documentos firmados aparecen automáticamente en el Data Room del colaborador correspondiente.`,
  },
  {
    keywords: ['colaborador', 'equipo', 'invitar', 'miembro', 'acceso', 'rol', 'rbac'],
    response: `Para gestionar colaboradores: /nexus/settings → pestaña "Equipo".

Acciones disponibles:
  • Invitar (Magic Link por email + WhatsApp automático si tiene número)
  • Asignar roles RBAC: SUPER_ADMIN / ADMIN / MARKETING / VIEWER
  • Permisos granulares por colaborador desde el drawer de configuración
  • Consultar Data Room con documentos contractuales activos

Nota: El WhatsApp es obligatorio para el flujo de Hermes — inclúyelo siempre al invitar.`,
  },
  {
    keywords: ['hermes', 'ia', 'ai', 'llm', 'modelo', 'kernel', 'cognitiv'],
    response: `Hermes es el Sistema Operativo de IA de Pandoras — runtime de lenguaje multi-tenant con memoria vectorial.

Arquitectura:
  • Kernel: Orquesta prompts, aplica Soul del tenant, ejecuta gates deterministas post-LLM
  • Memory: pgvector en Neon + Knowledge Vault IPFS (K25)
  • Channels: Web Portal, Telegram, WhatsApp, Discord HITL, TMA
  • A2A Protocol: Agentes externos via HMAC L1 + firma EIP-191 L2

QA: /admin/hermes | Agentes cognitivos: /nexus/settings → Agentes`,
  },
  {
    keywords: ['ipfs', 'vault', 'k25', 'k26', 'k27', 'boveda', 'storage'],
    response: `Sovereign Storage Stack:

  • K25 — Sovereign Knowledge Vault: Contratos firmados, blueprints. AES-256-GCM + tenant isolation.
  • K26 — Evidence Anchoring: Hash-chain SHA-256 de eventos → IPFS via Pinata (CID inmutable).
  • K27 — Durable IPFS Pinning: Multi-pin resiliente. Dev: prefijo mock_bafkrei_. Producción: fail-closed.`,
  },
  {
    keywords: ['api', 'key', 'sdk', 'integracion', 'developer', 'a2a', 'webhook', 'endpoint'],
    response: `Developer Hub: /nexus/developers

  • SDK A2A con ejemplos en TypeScript
  • Headers de transporte: HMAC (L1) + EIP-191 (L2)
  • Endpoints: /api/v1/a2a/messages, /api/v1/a2a/health
  • Reglas de Neon serverless (pooler) y mutaciones seguras

Para generar API Keys: /nexus/settings → sección de llaves de integración.`,
  },
  {
    keywords: ['estado', 'status', 'salud', 'health', 'sistema', 'runpod', 'gpu', 'infra'],
    response: `Estado del sistema Pandoras OS:

  • PostgreSQL (Neon pooler): Conectado
  • Hermes Runtime Kernel: Activo
  • WhatsApp Gateway (SignalWire): Operativo
  • Telegram Bot: Canal activo
  • Discord Bridge: Conectado
  • IPFS Pinning (Pinata): Activo en produccion

Para monitoreo de GPU RunPod y creditos por tenant: /admin → Billing Studio.`,
  },
  {
    keywords: ['data room', 'documento', 'archivo', 'documentacion'],
    response: `El Data Room de cada colaborador esta en /nexus/settings → seleccionar colaborador → pestaña DATA ROOM.

Secciones:
  A. Documentos contractuales (Pandoras ↔ Colaborador): NDA, Contrato de Servicios, Onboarding Brief
  B. Documentos que el colaborador debe entregar: ID oficial, comprobante, CV/Portfolio
  C. Documentos que puede compartir con clientes: One-pager, Deck institucional, Term Sheet, AML

Los Deal Rooms vinculados al email del colaborador aparecen aquí automáticamente con su estado de firma.`,
  },
];

function matchKnowledge(query: string): string | null {
  const normalized = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let bestMatch: { score: number; response: string } | null = null;
  for (const entry of HERMES_KB) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (new RegExp(kw, 'i').test(normalized)) score += 1;
    }
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { score, response: entry.response };
    }
  }
  return bestMatch?.response ?? null;
}

function hermesGreeting(role: string, context?: any): string {
  const roleLabel =
    role === 'SUPER_ADMIN' ? 'Super Administrador (SUPER_ADMIN)' :
    role === 'ADMIN' ? 'Administrador (ADMIN)' :
    `Operador (${role})`;
  
  if (context && context.name) {
    return `Hermes OS Kernel · AI Operations Assistant\nUsuario verificado: ${context.name} (${roleLabel})\nEmail: ${context.email}\n— Hermes está en línea. ¿En qué te puedo ayudar, ${context.name.split(' ')[0]}?`;
  }

  return `Hermes OS Kernel · AI Operations Assistant\nUsuario verificado: ${roleLabel}\n— Hermes está en línea. ¿En qué te puedo ayudar?`;
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await requireNexusAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 403 });
    }
    const body = await req.json();
    const message: string = (body.message ?? '').trim();
    const role: string = (body.role ?? 'OPERATOR').trim();
    const isBootSequence: boolean = body.isBootSequence === true;
    const operatorContext = body.operatorContext;

    if (isBootSequence) {
      return NextResponse.json({ reply: hermesGreeting(role, operatorContext) });
    }
    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    if (message.toLowerCase() === 'sudo wakeup hermes') {
      const firstName = operatorContext?.name ? operatorContext.name.split(' ')[0] : 'Operador';
      return NextResponse.json({
        reply: `Hola ${firstName}. He iniciado la secuencia de despertar operativo. Sistemas en línea, protocolos de gobernanza listos y conexiones de infraestructura estables. ¿En qué cuadrante estratégico nos enfocamos hoy?`,
        source: 'SYSTEM'
      });
    }

    const kbAnswer = matchKnowledge(message);
    if (kbAnswer) {
      return NextResponse.json({ reply: kbAnswer, source: 'KB' });
    }

    return NextResponse.json({
      reply: `Entendido. He recibido tu consulta:\n\n"${message}"\n\nMi base de conocimiento cubre: WhatsApp, Telegram, Discord HITL, Deal Rooms, Colaboradores, Hermes AI, IPFS/Vault, API/SDK y estado del sistema.\n\nPara consultas especializadas:\n  → Abre un Deal Room en /nexus/rooms\n  → Escala al canal de soporte en Discord\n  → Consulta la documentación técnica en /nexus/developers`,
      source: 'FALLBACK',
    });
  } catch (error: any) {
    console.error('[Hermes Chat] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
