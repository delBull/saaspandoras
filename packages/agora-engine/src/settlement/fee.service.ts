import { Decimal } from 'decimal.js';

export interface FeeBreakdown {
    protocolPrice: string;   // The total execution price the buyer pays
    platformFee: string;     // The exact fee portion sent to Pandoraas Revenue Pool
    sellerReceives: string;  // The net amount the seller gets
}

/**
 * Handles all logic pertaining to Pandoraas Institutional Commission
 */
export class FeeService {
    /**
     * Calculates the exact fee distribution based on a configured parameter.
     * All outputs are Decimal 8-precision strings for Db persistence.
     * 
     * @param price The listing price to execute
     * @param feeRate The fractional fee to charge (e.g. 0.02 for 2%)
     * @returns FeeBreakdown
     */
    static calculate(price: string | number | Decimal, feeRate: number): FeeBreakdown {
        if (feeRate < 0 || feeRate > 1) {
            throw new Error('Fee rate must be a fraction between 0 and 1');
        }

        const p = new Decimal(price);
        const fee = p.mul(feeRate);
        const sellerRemaining = p.sub(fee);

        return {
            protocolPrice: p.toFixed(8),
            platformFee: fee.toFixed(8),
            sellerReceives: sellerRemaining.toFixed(8)
        };
    }
}
