export interface AddOnGovernanceRequirements {
  /** Declarativo: El Add-On solicita que exista aprobación humana para activarse */
  requiresHumanApproval: boolean;

  /** Declarativo: Capacidades de alto riesgo que el Add-On necesita para operar */
  restrictedCapabilities?: string[];

  /** Declarativo: Canales en los que el Add-On pide operar */
  allowedChannels?: ('telegram' | 'whatsapp' | 'email' | 'web')[];
}
