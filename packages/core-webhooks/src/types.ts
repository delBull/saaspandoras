export interface PandoraWebhookEvent<T = unknown> {
    id: string;
    type: string;
    version: 'v1';
    timestamp: number;
    data: T;
}

// Specific Event Data Types
export interface DeploymentEventData {
    protocolId: string;
    contractAddress?: string;
    transactionHash?: string;
    reason?: string;
}
