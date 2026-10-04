/**
 * 📦 Dash Contracts — Growth Email Marketing & Templates
 * src/lib/dash-contracts/growth/email.ts
 */

export interface EmailTemplateDTO {
  id: string;
  name: string;
  category: 'WELCOME' | 'TOKEN_OFFERING' | 'INVESTOR_UPDATE' | 'VIP_CONCIERGE' | 'NEWSLETTER';
  subject: string;
  previewText?: string;
  contentHtml: string;
  variables: string[];
  updatedAt: string;
}

export interface EmailCampaignDTO {
  id: string;
  name: string;
  templateId: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'PAUSED';
  recipientsCount: number;
  openRate: number;
  clickRate: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
}

export interface GetEmailMarketingResponseDTO {
  templates: EmailTemplateDTO[];
  campaigns: EmailCampaignDTO[];
  stats: {
    totalSent: number;
    avgOpenRate: number;
    avgClickRate: number;
  };
}
