import { randomUUID } from "crypto";

export interface LogData {
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  event: string;
  status?: "success" | "error" | "pending";
  metadata?: Record<string, any>;
  error?: string;
}

/**
 * Servicio de Logging Estruturado para Observabilidad "Production-Grade"
 */
export const logger = {
  info: (data: LogData) => {
    console.log(JSON.stringify({
      level: "INFO",
      timestamp: new Date().toISOString(),
      ...data
    }));
  },
  
  error: (data: LogData) => {
    console.error(JSON.stringify({
      level: "ERROR",
      timestamp: new Date().toISOString(),
      ...data
    }));
  },

  warn: (data: LogData) => {
    console.warn(JSON.stringify({
      level: "WARN",
      timestamp: new Date().toISOString(),
      ...data
    }));
  },

  /**
   * Genera un ID de petición único y robusto
   */
  generateRequestId: () => {
    try {
      return randomUUID();
    } catch (e) {
      // Fallback si crypto no está disponible en algún edge runtime específico
      return Math.random().toString(36).substring(2, 15);
    }
  }
};
