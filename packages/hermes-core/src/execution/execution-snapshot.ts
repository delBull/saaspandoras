import { PendingAction, Artifact } from '../contracts';
import { ExecutionEvent } from './execution-journal';

/**
 * ExecutionSnapshot (Reemplaza al antiguo WorkspaceSnapshot)
 * 
 * Es una proyección PURAMENTE DE LECTURA.
 * Mission Control (UI) lee esto, NUNCA la ExecutionInstance directamente.
 * Contiene el estado actual, acciones requeridas y el journal resumido.
 */
export interface ExecutionSnapshot {
  instanceId: string;
  workflowId: string;
  title: string; 
  
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  pendingActions: PendingAction[];
  
  // Projection data
  currentStage: string;
  progressPercentage: number;
  
  // 4. Activos
  artifacts: Artifact[];
  
  // 5. Historial y Auditoría
  recentEvents: ExecutionEvent[];
  
  // 6. Línea de tiempo
  timeline: {
    startedAt?: string;
    targetCompletionDate?: string;
    completedAt?: string;
  };
  
  // 7. Resumen de Métricas (Extraído del Payload o inyectado por Engines)
  metricsSummary?: Record<string, number | string>;
}
