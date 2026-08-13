export interface AddOnCompatibility {
  /** Versión mínima de Hermes requerida */
  minHermesVersion: string;
  
  /** Lista de addonIds incompatibles mutuamente */
  incompatibleAddOns?: string[];
}
