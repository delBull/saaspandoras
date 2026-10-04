export type AttentionItemType = 'KYC' | 'DEPOSIT' | 'ESCALATION' | 'MEETING' | 'CAMPAIGN' | 'APPROVAL';
export type AttentionItemSeverity = 'INFO' | 'NORMAL' | 'HIGH' | 'CRITICAL';
export type AttentionItemStatus = 'NEW' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'WAITING' | 'DONE';

export interface AttentionItem {
  id: string;
  type: AttentionItemType;
  resourceType: string;
  resourceId: string;
  severity: AttentionItemSeverity;
  title: string;
  reason: string;
  status: AttentionItemStatus;
  
  recommendedAction?: {
    action: string;
    label: string;
  };
  
  requiredCapability?: string;
  resourceScope: any; // ResolvedResourceScope
  assignedTo?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface AttentionInbox {
  count: number;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  items: AttentionItem[];
  source: string;
  reason?: string;
}
