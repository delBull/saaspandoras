/**
 * Mathematical helper enforcing the Centralized Circulating Supply Invariant.
 * NO system module should query circulating supply without using this single source of truth.
 *
 * Fórmula:
 * Supply Circulante = TotalEmitido - InventarioPandoraas_Recomprado - UnidadesQuemadas
 */
export interface SupplyStateConfig {
    totalIssued: number;
    pandoraInventoryCount: number;
    burnedCount: number;
}

export class SupplyCalculator {

    /**
     * Computes the final economic supply participating in protocol NAV calculation.
     */
    static recalculateCirculatingSupply(config: SupplyStateConfig): number {
        const { totalIssued, pandoraInventoryCount, burnedCount } = config;

        // Safety guard
        if (totalIssued < 0 || pandoraInventoryCount < 0 || burnedCount < 0) {
            throw new Error('Supply parameters cannot be negative.');
        }

        const circulating = totalIssued - pandoraInventoryCount - burnedCount;

        if (circulating < 0) {
            // Invariant Protection
            throw new Error(`CRITICAL INVARIANT VIOLATION: Circulating supply plunged below zero. Issued: ${totalIssued}, PandoraHold: ${pandoraInventoryCount}, Burned: ${burnedCount}`);
        }

        return circulating;
    }
}
