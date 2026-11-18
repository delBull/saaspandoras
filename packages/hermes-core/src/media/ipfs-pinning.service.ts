import crypto from 'crypto';

export interface PinningConfig {
  pinApiUrl: string;
  pinApiToken?: string;
  mode?: 'managed' | 'byo';
}

/**
 * Pinneo real de artefactos en IPFS (Kubo HTTP API).
 *
 * La configuración viene por tenant (`resolveTenantPinningConfig`):
 *  - BYO: el endpoint y token que aportó el tenant.
 *  - Gestionado: `IPFS_PIN_API_URL` / `IPFS_PIN_API_TOKEN` del entorno.
 *
 * Sin configuración no se inventa nada: el orquestador marca el artefacto como
 * UNPINNED (cid = null).
 */
export class IpfsPinningService {
  private static endpoint(config: PinningConfig): string {
    const base = config.pinApiUrl.trim().replace(/\/+$/, '');
    return base.endsWith('/add') ? base : `${base}/add`;
  }

  static async pinBytes(
    bytes: Uint8Array,
    filename = 'artifact.bin',
    config: PinningConfig
  ): Promise<{ cid: string; sha256: string; sizeBytes: number } | null> {
    if (!config?.pinApiUrl) return null;
    try {
      const form = new FormData();
      form.append('file', new Blob([bytes as unknown as BlobPart]), filename);

      const headers: Record<string, string> = {};
      if (config.pinApiToken) headers.Authorization = `Bearer ${config.pinApiToken}`;

      const res = await fetch(`${this.endpoint(config)}?pin=true&cid-version=1`, {
        method: 'POST',
        headers,
        body: form,
      });
      if (!res.ok) {
        console.error('[IpfsPinning] add failed:', res.status, await res.text().catch(() => ''));
        return null;
      }
      const payload = (await res.json()) as { Hash?: string };
      const cid = payload.Hash;
      if (!cid) return null;

      return {
        cid,
        sha256: crypto.createHash('sha256').update(Buffer.from(bytes)).digest('hex'),
        sizeBytes: bytes.byteLength,
      };
    } catch (error: unknown) {
      console.error('[IpfsPinning] pinBytes error:', error);
      return null;
    }
  }

  static async pinFromUrl(
    url: string,
    config: PinningConfig
  ): Promise<{ cid: string; sha256: string; sizeBytes: number } | null> {
    if (!config?.pinApiUrl) return null;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error('[IpfsPinning] source fetch failed:', response.status, url);
        return null;
      }
      const bytes = new Uint8Array(await response.arrayBuffer());
      const name = url.split('/').pop()?.split('?')[0] || 'artifact.bin';
      return await this.pinBytes(bytes, name, config);
    } catch (error: unknown) {
      console.error('[IpfsPinning] pinFromUrl error:', error);
      return null;
    }
  }
}
