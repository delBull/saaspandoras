/**
 * 🔌 Hermes Core Injection Ports
 * Used to avoid tight coupling between Hermes Core and the Dashboard.
 */

// Execution OS Port
export interface IExecutionOS {
  execute(arg: any): Promise<any>;
}
let executionOSPort: IExecutionOS | null = null;
export const setExecutionOSPort = (port: IExecutionOS) => { executionOSPort = port; };
export const getExecutionOSPort = () => {
  if (!executionOSPort) throw new Error("NOT_CONFIGURED: ExecutionOS port is not set.");
  return executionOSPort;
};

// Discord Webhook Port
export interface IDiscordWebhookService {
  dispatchEscalation(args: any): Promise<void>;
}
let discordWebhookPort: IDiscordWebhookService | null = null;
export const setDiscordWebhookPort = (port: IDiscordWebhookService) => { discordWebhookPort = port; };
export const getDiscordWebhookPort = () => {
  if (!discordWebhookPort) throw new Error("NOT_CONFIGURED: DiscordWebhook port is not set.");
  return discordWebhookPort;
};

// Marketing Domain Port
export interface IMarketingDomainService {
  launchCampaign(projectId: string, campaignData: any): Promise<any>;
  getProjectMarketingStats(projectId: string): Promise<any>;
}
let marketingDomainPort: IMarketingDomainService | null = null;
export const setMarketingDomainPort = (port: IMarketingDomainService) => { marketingDomainPort = port; };
export const getMarketingDomainPort = () => {
  if (!marketingDomainPort) throw new Error("NOT_CONFIGURED: MarketingDomain port is not set.");
  return marketingDomainPort;
};

// Project Domain Port
export interface IProjectDomainService {
  buildProjectDomain(slug: string): Promise<any>;
}
let projectDomainPort: IProjectDomainService | null = null;
export const setProjectDomainPort = (port: IProjectDomainService) => { projectDomainPort = port; };
export const getProjectDomainPort = () => {
  if (!projectDomainPort) throw new Error("NOT_CONFIGURED: ProjectDomain port is not set.");
  return projectDomainPort;
};
