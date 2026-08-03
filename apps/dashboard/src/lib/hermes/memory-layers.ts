/**
 * 🧠 Pandora's Platform OS — 4-Layer Memory Engine
 * lib/hermes/memory-layers.ts
 *
 * Resolves context from 4 distinct memory layers:
 *   1. Conversation Memory (Recent active chat messages)
 *   2. Customer Memory (CRM History, holdings, objections, lead score)
 *   3. Organization Memory (Tenant FAQs, services, schedules, policies)
 *   4. Platform Memory (Pandora's global best practices & playbooks)
 */

import { db } from '@/db';
import { marketingLeads, projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';

export interface MemoryLayersContext {
  conversationMemory: { role: 'user' | 'assistant'; text: string }[];
  customerMemory: {
    leadId?: string;
    email?: string;
    name?: string;
    score: number;
    crmStage: string;
    holdings?: any;
  };
  organizationMemory: {
    companyName: string;
    industry: string;
    schedule: string;
    services: string[];
    faqs: { question: string; answer: string }[];
  };
  platformMemory: {
    playbookRules: string[];
  };
}

export class MemoryLayersResolver {
  static async resolve(projectId: number, chatId: string, userMessage: string): Promise<MemoryLayersContext> {
    // 1. Resolve Organization Memory
    const orgContext = await OrganizationSDK.resolve(projectId, 'HERMES');
    const installed = orgContext.activeProduct;
    const knowledgePack = (installed?.config as any)?.knowledgePack || {};

    const organizationMemory = {
      companyName: knowledgePack.companyName || orgContext.name,
      industry: knowledgePack.industry || 'General',
      schedule: knowledgePack.schedule || 'Horario habitual de oficina',
      services: knowledgePack.services || [],
      faqs: knowledgePack.faqs || [],
    };

    // 2. Resolve Customer Memory from CRM
    let customerMemory = {
      score: 50,
      crmStage: 'LEAD',
    } as any;

    try {
      const lead = await db.query.marketingLeads.findFirst({
        where: and(eq(marketingLeads.projectId, projectId)),
      });
      if (lead) {
        customerMemory = {
          leadId: lead.id,
          email: lead.email || undefined,
          name: lead.name || undefined,
          score: lead.score || 50,
          crmStage: lead.crmStage || 'LEAD',
        };
      }
    } catch (e) {
      console.warn('[MemoryLayersResolver] Could not query CRM customer memory:', e);
    }

    // 3. Resolve Conversation Memory
    const conversationMemory = [
      { role: 'user' as const, text: userMessage }
    ];

    // 4. Resolve Platform Memory (Pandora's Global Best Practices)
    const platformMemory = {
      playbookRules: [
        'Responde de forma cortes, ejecutiva y directa.',
        'No realices promesas de retornos financieros garantizados.',
        'Ofrece agendar una cita o llamada cuando la intención comercial sea alta.',
      ]
    };

    return {
      conversationMemory,
      customerMemory,
      organizationMemory,
      platformMemory,
    };
  }
}
