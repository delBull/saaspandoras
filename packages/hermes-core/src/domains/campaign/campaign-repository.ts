import { Campaign, CampaignId } from './campaign';

/**
 * Abstracción de persistencia para el Dominio de Campañas.
 * No guarda el Contexto (Runtime), solo el Negocio.
 */
export interface ICampaignRepository {
  findById(id: CampaignId): Promise<Campaign | null>;
  save(campaign: Campaign): Promise<void>;
  listByProject(projectId: number): Promise<Campaign[]>;
}

/**
 * Repositorio en memoria para el Sprint 5 (Domain Freeze).
 * En el futuro, esto se conectará a DrizzleORM leyendo/escribiendo 
 * en una tabla simplificada de la BD.
 */
export class InMemoryCampaignRepository implements ICampaignRepository {
  private store: Map<CampaignId, Campaign> = new Map();

  async findById(id: CampaignId): Promise<Campaign | null> {
    return this.store.get(id) || null;
  }

  async save(campaign: Campaign): Promise<void> {
    this.store.set(campaign.id, campaign);
    console.log(`[CampaignRepository] Saved Campaign ${campaign.id} to persistent storage.`);
  }

  async listByProject(projectId: number): Promise<Campaign[]> {
    return Array.from(this.store.values()).filter(c => c.projectId === projectId);
  }
}
