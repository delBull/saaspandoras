
export type ProtocolState =
    | 'LEAD'
    | 'ACTIVE_TIER_1' | 'IN_PROGRESS_TIER_1' | 'APPROVED_TIER_1' | 'SKIPPED_TIER_1'
    | 'ACTIVE_TIER_2' | 'IN_PROGRESS_TIER_2' | 'APPROVED_TIER_2'
    | 'ACTIVE_TIER_3' | 'IN_PROGRESS_TIER_3' | 'DEPLOYED';

export interface ProtocolMetadata {
    state: ProtocolState;
    approved_tiers: string[];
    project_name?: string;
    next_action?: string;
    sow_history: Array<{
        tier: string;
        sow_id: string;
        sent_at: string; // ISO Date
        link_id: string;
        status: 'sent' | 'paid' | 'signed';
    }>;
    msa_status?: 'sent' | 'accepted';
    msa_sent_at?: string;
    msa_accepted_at?: string;
    msa_signature?: string;
    msa_version?: string;
}

export interface ClientWithMetadata {
    id: string;
    name: string | null;
    email: string;
    metadata: ProtocolMetadata | Record<string, any> | null;
    status: string;
}
