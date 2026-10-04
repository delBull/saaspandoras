export type AddOnInstallationStatus = 
  | 'AVAILABLE'
  | 'INSTALLING'
  | 'CONFIGURING'
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DEACTIVATING'
  | 'DEACTIVATED'
  | 'REJECTED'
  | 'FAILED';

export interface AddOnInstallation {
  /** ID único de la instancia de la instalación (no el addonId) */
  installationId: string;
  organizationId: string;
  addonId: string;
  version: string;
  
  status: AddOnInstallationStatus;
  
  /** Configuración propia del Tenant que restringe/ajusta el comportamiento */
  configuration: Record<string, unknown>;

  /** Copia congelada del manifest en el momento de la aprobación/instalación */
  manifestSnapshot?: Record<string, unknown>;

  installedBy: string;
  approvedBy?: string;

  installedAt: Date;
  activatedAt?: Date;
  updatedAt: Date;
}
