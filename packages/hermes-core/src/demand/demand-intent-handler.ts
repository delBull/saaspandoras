/**
 * 🎯 HERMES OS — TENANT DEMAND INTENT HANDLER
 * apps/dashboard/src/lib/hermes/demand/demand-intent-handler.ts
 *
 * Dedicated handler for Tenant Business Intents related to Demand & Distribution.
 * Strict separation from Founder/Marco Executive Sovereign Plane (executive-planner.ts).
 */

import { DemandDistributionService, DemandObjective } from './demand-distribution.service';

export interface PendingDemandProposal {
  tenantId: string;
  campaignId: string;
  objective: DemandObjective;
  createdAt: number;
  expiresAt: number;
}

export class DemandIntentHandler {
  private static readonly TTL_MS = 15 * 60 * 1000; // 15 minutos
  private static pendingProposals: Map<string, PendingDemandProposal> = new Map();

  /**
   * Detects if the utterance is an expression of commercial demand generation.
   */
  public static isDemandIntent(text: string): boolean {
    const clean = (text || '').trim().toLowerCase();
    return (
      /^\/(?:demand|campa[ñn]a|campaign)/i.test(clean) ||
      /(?:conseguir|atraer|generar|buscar)\s+(?:m[aá]s\s+)?(?:clientes|leads|prospectos|citas|demanda)/i.test(clean) ||
      /(?:prepara|crea|inicia|lanza|haz|quiero)\s+(?:una\s+)?campa[ñn]a\s+(?:de\s+)?(?:distribuci[oó]n|marketing|demanda)/i.test(clean) ||
      /(?:activa|activar)\s+(?:la\s+)?demanda/i.test(clean)
    );
  }

  /**
   * Detects explicit objective keyword from prompt.
   */
  public static extractObjective(text: string): DemandObjective {
    const clean = (text || '').toLowerCase();
    if (clean.includes('cita') || clean.includes('reunion') || clean.includes('agenda')) return 'BOOK_MEETINGS';
    if (clean.includes('lanzar') || clean.includes('lanzamiento')) return 'LAUNCH_PRODUCT';
    if (clean.includes('oferta') || clean.includes('descuento') || clean.includes('promocion')) return 'PROMOTE_OFFER';
    if (clean.includes('educar') || clean.includes('audiencia') || clean.includes('contenido')) return 'EDUCATE_AUDIENCE';
    if (clean.includes('reactivar') || clean.includes('recuperar')) return 'REACTIVATE_CLIENTS';
    return 'GENERATE_LEADS';
  }

  /**
   * Formulates a proposed campaign and generates the interactive review card for the conversation.
   */
  public static async handleDemandProposal(
    tenantId: string,
    messageText: string
  ): Promise<{
    content: string;
    suggestedActions: string[];
    campaignId: string;
  }> {
    const objective = this.extractObjective(messageText);
    const campaign = await DemandDistributionService.proposeCampaign(tenantId, objective, { autoReady: true });

    const now = Date.now();
    this.pendingProposals.set(tenantId.toLowerCase(), {
      tenantId: tenantId.toLowerCase(),
      campaignId: campaign.id,
      objective,
      createdAt: now,
      expiresAt: now + this.TTL_MS,
    });

    const channelsFormatted = campaign.channels
      .map((c) => (c === 'x' ? 'X' : c.charAt(0).toUpperCase() + c.slice(1)))
      .join(', ');

    const card = [
      `🚀 **Campaña de Distribución Recomendada**`,
      ``,
      `Puedo preparar y distribuir una campaña para ti basándome en el conocimiento de tu negocio y audiencia:`,
      ``,
      `• **Objetivo:** \`${campaign.name}\``,
      `• **Volumen:** ${campaign.piecesCount} publicaciones durante los próximos 7 días`,
      `• **Canales activos:** ${channelsFormatted}`,
      `• **CTA Primario:** ${campaign.primaryCta}`,
      `• **CTA Secundario:** ${campaign.secondaryCta}`,
      ``,
      `¿Deseas autorizar la campaña y proceder con la distribución a canales?`,
      `Responde **"confirmo"** para aprobar y despachar a Media Co, o **"cancela"** para descartar.`,
    ].join('\n');

    return {
      content: card,
      suggestedActions: ['confirmo', 'cancela', 'Ver campaña'],
      campaignId: campaign.id,
    };
  }

  /**
   * Retrieves active pending proposal if valid.
   */
  public static getPendingProposal(tenantId: string): PendingDemandProposal | null {
    const clean = tenantId.toLowerCase().trim();
    const proposal = this.pendingProposals.get(clean);
    if (!proposal) return null;

    if (Date.now() > proposal.expiresAt) {
      this.pendingProposals.delete(clean);
      return null;
    }
    return proposal;
  }

  /**
   * Executes distribution upon confirmation.
   */
  public static async confirmProposal(tenantId: string): Promise<{
    success: boolean;
    content: string;
    suggestedActions: string[];
  }> {
    const proposal = this.getPendingProposal(tenantId);
    if (!proposal) {
      return {
        success: false,
        content: '⚠️ No hay ninguna propuesta de campaña de distribución pendiente o ha expirado.',
        suggestedActions: ['/demand', 'Ver estado de canales'],
      };
    }

    const result = await DemandDistributionService.approveAndDistribute(
      proposal.tenantId,
      proposal.campaignId
    );

    this.pendingProposals.delete(tenantId.toLowerCase().trim());

    if (!result.success) {
      const tenantMessage =
        result.error && (result.error.includes('en generación') || result.error.includes('gating'))
          ? result.error
          : 'No pudimos distribuir esta campaña en este momento. Media Co rechazó la operación o el servicio no está disponible.';

      return {
        success: false,
        content: `❌ **Fallo en Distribución:** ${tenantMessage}.`,
        suggestedActions: ['/demand', 'Reintentar'],
      };
    }

    const dispatched = result.dispatchedChannels.map((c) => `✓ ${c.toUpperCase()}`).join(' · ');

    return {
      success: true,
      content: [
        `✅ **Campaña Aprobada y Distribuida Exitosamente**`,
        ``,
        `• **Estado:** \`${result.campaign.status}\``,
        `• **Canales despachados:** ${dispatched}`,
        `• **Piezas programadas:** ${result.campaign.piecesCount}`,
        `• **Trazabilidad A2A:** Despachada formalmente a Sofia / Pandora's Media Co`,
        ``,
        `El tráfico entrante será canalizado automáticamente hacia las conversaciones de Hermes y tu Agenda Soberana.`,
      ].join('\n'),
      suggestedActions: ['Ver métricas', '/briefing', '/demand'],
    };
  }

  /**
   * Cancels active proposal.
   */
  public static cancelProposal(tenantId: string): { content: string; suggestedActions: string[] } {
    const clean = tenantId.toLowerCase().trim();
    const proposal = this.pendingProposals.get(clean);
    if (!proposal) {
      return {
        content: 'No hay ninguna propuesta de campaña de demanda pendiente para descartar.',
        suggestedActions: ['/demand'],
      };
    }

    this.pendingProposals.delete(clean);
    return {
      content: '🚫 **Propuesta Descartada:** La campaña de demanda ha sido cancelada sin emitir ningún despacho hacia Media Co.',
      suggestedActions: ['/demand', '/briefing'],
    };
  }
}
