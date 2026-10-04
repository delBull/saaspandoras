import { Identity } from '../contracts';

/**
 * Declara las etapas y transiciones posibles de un Workflow.
 * No contiene lógica de negocio ni políticas.
 * Es un ACTIVO, no código vivo.
 */
export interface WorkflowDefinition<TPayload = any, TState = string> {
  id: string; // Ej. 'marketing.campaign.v1'
  version: string;
  
  initialState: TState;
  terminalStates: TState[];
  
  stages: TState[];
  
  /**
   * Dependencias del ecosistema que este workflow asume que existen.
   * Ej: ['content.fulfill', 'calendar.reserveSlot']
   * El Runtime valida esto antes de instanciar.
   */
  requiredCapabilities: string[];

  /**
   * Transiciones permitidas declarativas (Opcional, puede ser un mapa origen -> destino)
   */
  transitions?: Record<string, TState[]>;
  
  /** Identifica el tipo de payload de entrada */
  inputType: string;
  /** Identifica el tipo de payload de salida */
  outputType?: string;
  
  /** 
   * Políticas de reintento para etapas falibles 
   * (Opcional, pero define la semántica futura) 
   */
  retryPolicies?: Record<string, { maxAttempts: number, backoffMs: number }>;
  
  /** 
   * SLA y Timeouts por etapa (en milisegundos)
   */
  timeouts?: Record<string, number>;
  
  /**
   * Guards: Condiciones pre-requeridas para ejecutar un stage
   */
  guards?: Record<string, string[]>; // Ex: {'REVIEW': ['hasDraftAsset']}
  
  /**
   * Rutas de compensación en caso de fallo (Saga Pattern)
   */
  compensation?: Record<string, string>; // Ex: Si falla 'PAYMENT', ejecuta 'REFUND'
  
  /**
   * Etapas que pueden correr en paralelo
   */
  parallelStages?: string[][]; // Ex: [['GENERATE_COPY', 'GENERATE_IMAGE']]
  
  /**
   * Interacciones humanas requeridas
   */
  humanInteractions?: string[];

  /**
   * Conocimiento requerido previo a ejecución
   */
  requiredKnowledge?: string[];
}
