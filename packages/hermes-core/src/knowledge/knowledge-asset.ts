export type AssetType = 
  | 'PROMPT' 
  | 'PLAYBOOK' 
  | 'TEMPLATE' 
  | 'BENCHMARK' 
  | 'EXECUTION_PATTERN' 
  | 'FAILURE_PATTERN' 
  | 'BUSINESS_RULE' 
  | 'RESEARCH';

export interface KnowledgeAsset {
  id: string;
  type: AssetType;
  title: string;
  description: string;
  tags: string[];
  content: any; // El contenido del activo. Puede ser un string de texto, o un JSON estructurado.
  confidenceScore: number;
  sourceInstanceIds: string[]; // Qué ejecuciones formaron este conocimiento
  createdAt: string;
}
