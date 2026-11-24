import { describe, it, expect } from 'vitest';
import { isKuboFailureCritical } from '../orchestrator';

/**
 * La alarma "Kubo Primary Node Offline" debe sonar por servicio, no por
 * contenido. Un bloque ausente se resuelve con el espejo; una credencial mal o
 * un nodo caído sí amerita alerta.
 */
describe('Kubo · clasificación de fallos para alerta', () => {
  it('NO alerta cuando el nodo simplemente no tiene el bloque', () => {
    expect(
      isKuboFailureCritical(
        '[KuboRpcIpfsProvider] Failed to retrieve content from Kubo for CID: bafkrei… (rpc=500, gateway=500, rpcBody={"Message":"block was not found locally (offline)","Code":0}, gwBody=-)',
      ),
    ).toBe(false);
  });

  it('NO alerta por "no link named" del gateway', () => {
    expect(
      isKuboFailureCritical(
        '[KuboRpcIpfsProvider] Failed … (rpc=404, gateway=404, rpcBody=no link named under /ipfs, gwBody=no link named)',
      ),
    ).toBe(false);
  });

  it('SÍ alerta si falta la credencial (401/403)', () => {
    expect(
      isKuboFailureCritical('[KuboRpcIpfsProvider] Failed … (rpc=401, gateway=200, rpcBody=Unauthorized Sovereign RPC Access, gwBody=-)'),
    ).toBe(true);
    expect(isKuboFailureCritical('… (rpc=403, gateway=403, rpcBody=forbidden, gwBody=forbidden)')).toBe(true);
  });

  it('SÍ alerta si el nodo no responde (red/timeout)', () => {
    expect(isKuboFailureCritical('… (rpc=network, gateway=network, rpcBody=-, gwBody=-)')).toBe(true);
    expect(isKuboFailureCritical('connect ECONNREFUSED 10.0.0.5:5001')).toBe(true);
    expect(isKuboFailureCritical('The operation was aborted')).toBe(true);
  });

  it('SÍ alerta ante un 5xx sin marca de bloque ausente (proxy/nodo roto)', () => {
    expect(isKuboFailureCritical('… (rpc=502, gateway=502, rpcBody=Bad Gateway, gwBody=Bad Gateway)')).toBe(true);
  });

  it('no alerta con mensajes vacíos o irrelevantes', () => {
    expect(isKuboFailureCritical('')).toBe(false);
    expect(isKuboFailureCritical('algo raro pero no de red')).toBe(false);
  });
});
