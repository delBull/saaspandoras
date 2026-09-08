import { createHmac } from 'crypto';
import { createWalletClient, http, custom } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

export interface A2AClientConfig {
  agentId: string;
  agentSecret: string;
  privateKey: `0x${string}`;
  hubEndpoint?: string;
}

export interface A2AMessagePayload {
  protocol: string;
  version: string;
  messageId: string;
  correlationId?: string;
  from: string;
  to: string;
  tenantId?: string;
  type: string;
  createdAt: string;
  expiresAt?: string;
  nonce: string;
  payload: any;
  security?: {
    hmac: string;
    signature: string;
  };
}

export class A2AClient {
  private agentId: string;
  private agentSecret: string;
  private account: any;
  private hubEndpoint: string;

  constructor(config: A2AClientConfig) {
    this.agentId = config.agentId;
    this.agentSecret = config.agentSecret;
    this.hubEndpoint = config.hubEndpoint || 'https://dash.pandoras.finance/api/v1/a2a';
    this.account = privateKeyToAccount(config.privateKey);
  }

  private generateNonce(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private generateMessageId(): string {
    return 'msg_' + Date.now() + Math.random().toString(36).substring(2);
  }

  private computeCanonicalHash(msg: Partial<A2AMessagePayload>): string {
    const canonical = JSON.stringify({
      protocol: msg.protocol,
      version: msg.version,
      messageId: msg.messageId,
      correlationId: msg.correlationId,
      from: msg.from,
      to: msg.to,
      tenantId: msg.tenantId,
      type: msg.type,
      createdAt: msg.createdAt,
      expiresAt: msg.expiresAt,
      nonce: msg.nonce,
      payload: msg.payload,
    });
    return canonical;
  }

  private computeHmac(canonicalHash: string): string {
    return createHmac('sha256', this.agentSecret).update(canonicalHash).digest('hex');
  }

  public async signAndBuildMessage(type: string, payload: any, to: string = 'hermes', tenantId?: string): Promise<A2AMessagePayload> {
    const baseMessage: Partial<A2AMessagePayload> = {
      protocol: 'pandoras-a2a',
      version: '1.1',
      messageId: this.generateMessageId(),
      from: this.agentId,
      to,
      type,
      tenantId,
      createdAt: new Date().toISOString(),
      nonce: this.generateNonce(),
      payload,
    };

    const canonicalHash = this.computeCanonicalHash(baseMessage);
    const hmac = this.computeHmac(canonicalHash);
    
    // EIP-191 Personal Sign
    const signature = await this.account.signMessage({ message: canonicalHash });

    return {
      ...(baseMessage as A2AMessagePayload),
      security: {
        hmac,
        signature,
      }
    };
  }

  public async sendMessage(type: string, payload: any, to?: string, tenantId?: string): Promise<any> {
    const message = await this.signAndBuildMessage(type, payload, to, tenantId);
    
    const response = await fetch(`${this.hubEndpoint}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`A2A Message failed: ${response.status} - ${err}`);
    }

    return response.json();
  }

  public async uploadFile(fileBuffer: Buffer, filename: string, mimeType: string): Promise<{ cid: string }> {
    // We sign a payload describing the upload
    const payload = { filename, mimeType, byteLength: fileBuffer.length };
    const message = await this.signAndBuildMessage('media.upload', payload);

    const formData = new FormData();
    formData.append('message', JSON.stringify(message));
    formData.append('file', new Blob([new Uint8Array(fileBuffer)], { type: mimeType }), filename);

    const response = await fetch(`${this.hubEndpoint}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`A2A Upload failed: ${response.status} - ${err}`);
    }

    return response.json();
  }
}
