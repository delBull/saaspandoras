export type AddOnCapabilityCategory = 'JOURNEY' | 'SIGNAL' | 'UTILITY' | 'INTEGRATION';

export interface AddOnCapability {
  /** Un identificador único de esta capacidad (ej. "vip_referral_management") */
  id: string;
  category: AddOnCapabilityCategory;
  description: string;
  suggestedActions?: string[];
}
