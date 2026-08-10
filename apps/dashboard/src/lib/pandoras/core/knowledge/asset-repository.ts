import { KnowledgeAsset } from './knowledge-asset';

/**
 * Repositorio clasificado para la memoria a largo plazo (Knowledge Assets)
 */
export class AssetRepository {
  private assets: KnowledgeAsset[] = [];

  async save(asset: KnowledgeAsset): Promise<void> {
    this.assets.push(asset);
  }

  async getByType(type: KnowledgeAsset['type']): Promise<KnowledgeAsset[]> {
    return this.assets.filter(a => a.type === type);
  }
  
  async getAll(): Promise<KnowledgeAsset[]> {
    return this.assets;
  }
}
