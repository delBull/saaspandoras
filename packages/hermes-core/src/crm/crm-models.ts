export interface Lead {
  id: string;
  name: string;
  email?: string;
  status: 'NEW' | 'QUALIFIED' | 'DISQUALIFIED';
  createdAt: string;
}

export interface Opportunity {
  id: string;
  leadId: string;
  title: string;
  valueUsd: number;
  stage: 'PROSPECT' | 'QUALIFIED' | 'PROPOSAL' | 'CLOSED_WON' | 'CLOSED_LOST';
  createdAt: string;
  updatedAt: string;
}
